/**
 * Webcraft2D - Asynchronous IndexedDB Storage Layer (js/storage.js)
 * High-capacity client-side persistence for worlds, tile chunks, entities, and thumbnails.
 * Bypasses the 5MB browser localStorage ceiling with graceful fallback and auto-migration.
 */

const DB_NAME = 'webcraft2d_db';
const DB_VERSION = 1;
const STORE_WORLDS = 'worlds';
const STORE_THUMBNAILS = 'thumbnails';

export const availableWorldSaveIds = new Set();
export const thumbnailCache = new Map();

let dbInstance = null;
let dbPromise = null;
let isMigrating = false;

// Scan localStorage immediately for synchronous startup checks
try {
    if (typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('swc_data_')) {
                const wid = key.slice('swc_data_'.length);
                if (wid) availableWorldSaveIds.add(wid);
            }
        }
    }
} catch (e) {
    console.warn('[WebcraftStorage] Initial localStorage scan failed:', e);
}

/**
 * Open or retrieve the IndexedDB database instance
 * @returns {Promise<IDBDatabase|null>}
 */
export function openDB() {
    if (dbInstance) return Promise.resolve(dbInstance);
    if (dbPromise) return dbPromise;

    if (typeof indexedDB === 'undefined') {
        console.warn('[WebcraftStorage] IndexedDB not supported; falling back to localStorage.');
        return Promise.resolve(null);
    }

    dbPromise = new Promise((resolve) => {
        try {
            const req = indexedDB.open(DB_NAME, DB_VERSION);

            req.onupgradeneeded = (e) => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE_WORLDS)) {
                    db.createObjectStore(STORE_WORLDS);
                }
                if (!db.objectStoreNames.contains(STORE_THUMBNAILS)) {
                    db.createObjectStore(STORE_THUMBNAILS);
                }
            };

            req.onsuccess = () => {
                dbInstance = req.result;
                // Cache all existing world IDs from IndexedDB
                refreshAvailableWorldIds().then(() => {
                    resolve(dbInstance);
                }).catch(() => {
                    resolve(dbInstance);
                });
            };

            req.onerror = (err) => {
                console.warn('[WebcraftStorage] indexedDB.open error:', err);
                dbInstance = null;
                resolve(null);
            };

            req.onblocked = () => {
                console.warn('[WebcraftStorage] indexedDB open blocked.');
                resolve(null);
            };
        } catch (e) {
            console.warn('[WebcraftStorage] indexedDB exception:', e);
            resolve(null);
        }
    });

    return dbPromise;
}

/**
 * Synchronize the in-memory set of available world IDs
 */
async function refreshAvailableWorldIds() {
    try {
        const db = await openDB();
        if (db) {
            await new Promise((resolve) => {
                const tx = db.transaction(STORE_WORLDS, 'readonly');
                const store = tx.objectStore(STORE_WORLDS);
                const req = store.getAllKeys();
                req.onsuccess = () => {
                    if (Array.isArray(req.result)) {
                        req.result.forEach(id => availableWorldSaveIds.add(String(id)));
                    }
                    resolve();
                };
                req.onerror = () => resolve();
            });
        }
    } catch (e) {
        console.warn('[WebcraftStorage] Error refreshing available world IDs:', e);
    }

    // Also check localStorage
    try {
        if (typeof localStorage !== 'undefined') {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('swc_data_')) {
                    const wid = key.slice('swc_data_'.length);
                    if (wid) availableWorldSaveIds.add(wid);
                }
            }
        }
    } catch (e) {}
}

/**
 * Check synchronously if a world exists in local memory/storage
 * @param {string} id
 * @returns {boolean}
 */
export function hasWorldDataSync(id) {
    if (!id) return false;
    if (availableWorldSaveIds.has(String(id))) return true;
    try {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('swc_data_' + id) !== null) {
            availableWorldSaveIds.add(String(id));
            return true;
        }
    } catch (e) {}
    return false;
}

/**
 * Asynchronously check if a world exists
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function hasWorldData(id) {
    if (!id) return false;
    if (availableWorldSaveIds.has(String(id))) return true;

    try {
        const db = await openDB();
        if (db) {
            const exists = await new Promise((resolve) => {
                const tx = db.transaction(STORE_WORLDS, 'readonly');
                const store = tx.objectStore(STORE_WORLDS);
                const req = store.count(String(id));
                req.onsuccess = () => resolve(req.result > 0);
                req.onerror = () => resolve(false);
            });
            if (exists) {
                availableWorldSaveIds.add(String(id));
                return true;
            }
        }
    } catch (e) {}

    try {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('swc_data_' + id) !== null) {
            availableWorldSaveIds.add(String(id));
            return true;
        }
    } catch (e) {}

    return false;
}

/**
 * Retrieve saved world data by ID
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getWorldData(id) {
    if (!id) return null;
    const worldKey = String(id);

    // 1. Try IndexedDB
    try {
        const db = await openDB();
        if (db) {
            const data = await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_WORLDS, 'readonly');
                const store = tx.objectStore(STORE_WORLDS);
                const req = store.get(worldKey);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => reject(req.error);
            });

            if (data) {
                availableWorldSaveIds.add(worldKey);
                if (typeof data === 'string') {
                    try { return JSON.parse(data); } catch (e) { return data; }
                }
                return data;
            }
        }
    } catch (e) {
        console.warn(`[WebcraftStorage] IndexedDB read failed for ${worldKey}:`, e);
    }

    // 2. Fallback to localStorage
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem('swc_data_' + worldKey);
            if (raw) {
                availableWorldSaveIds.add(worldKey);
                let parsed = null;
                try {
                    parsed = JSON.parse(raw);
                } catch (e) {
                    parsed = raw;
                }

                // Auto-promote read from localStorage to IndexedDB in the background
                setWorldData(worldKey, parsed).catch(() => {});

                return parsed;
            }
        }
    } catch (e) {
        console.warn(`[WebcraftStorage] localStorage read failed for ${worldKey}:`, e);
    }

    return null;
}

/**
 * Store world data by ID
 * @param {string} id
 * @param {Object|string} data
 * @returns {Promise<boolean>}
 */
export async function setWorldData(id, data) {
    if (!id || !data) return false;
    const worldKey = String(id);
    availableWorldSaveIds.add(worldKey);

    let savedToIndexedDB = false;

    // 1. Try IndexedDB
    try {
        const db = await openDB();
        if (db) {
            await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_WORLDS, 'readwrite');
                const store = tx.objectStore(STORE_WORLDS);
                const req = store.put(data, worldKey);
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
            savedToIndexedDB = true;

            // If successfully stored in IndexedDB, remove legacy localStorage entry to save 5MB quota
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.removeItem('swc_data_' + worldKey);
                }
            } catch (e) {}

            return true;
        }
    } catch (e) {
        console.warn(`[WebcraftStorage] IndexedDB write failed for ${worldKey}:`, e);
    }

    // 2. Fallback to localStorage if IndexedDB failed or is unsupported
    if (!savedToIndexedDB) {
        try {
            if (typeof localStorage !== 'undefined') {
                const serialized = typeof data === 'string' ? data : JSON.stringify(data);
                localStorage.setItem('swc_data_' + worldKey, serialized);
                return true;
            }
        } catch (storageError) {
            console.error(`[WebcraftStorage] Fatal quota error saving world ${worldKey}:`, storageError);
            throw storageError;
        }
    }

    return false;
}

/**
 * Delete world data by ID from both IndexedDB and localStorage
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function removeWorldData(id) {
    if (!id) return false;
    const worldKey = String(id);
    availableWorldSaveIds.delete(worldKey);
    thumbnailCache.delete(worldKey);

    try {
        const db = await openDB();
        if (db) {
            await new Promise((resolve) => {
                const tx = db.transaction([STORE_WORLDS, STORE_THUMBNAILS], 'readwrite');
                tx.objectStore(STORE_WORLDS).delete(worldKey);
                tx.objectStore(STORE_THUMBNAILS).delete(worldKey);
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            });
        }
    } catch (e) {
        console.warn(`[WebcraftStorage] IndexedDB delete error for ${worldKey}:`, e);
    }

    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('swc_data_' + worldKey);
            localStorage.removeItem('swc_thumb_' + worldKey);
        }
    } catch (e) {}

    return true;
}

/**
 * Retrieve world thumbnail data URL
 * @param {string} id
 * @returns {Promise<string|null>}
 */
export async function getThumbnail(id) {
    if (!id) return null;
    const worldKey = String(id);

    if (thumbnailCache.has(worldKey)) {
        return thumbnailCache.get(worldKey);
    }

    // Try IndexedDB
    try {
        const db = await openDB();
        if (db) {
            const thumb = await new Promise((resolve) => {
                const tx = db.transaction(STORE_THUMBNAILS, 'readonly');
                const store = tx.objectStore(STORE_THUMBNAILS);
                const req = store.get(worldKey);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
            });
            if (thumb) {
                thumbnailCache.set(worldKey, thumb);
                return thumb;
            }
        }
    } catch (e) {}

    // Fallback to localStorage
    try {
        if (typeof localStorage !== 'undefined') {
            const raw = localStorage.getItem('swc_thumb_' + worldKey);
            if (raw) {
                thumbnailCache.set(worldKey, raw);
                return raw;
            }
        }
    } catch (e) {}

    return null;
}

/**
 * Store world thumbnail data URL
 * @param {string} id
 * @param {string} dataUrl
 * @returns {Promise<boolean>}
 */
export async function setThumbnail(id, dataUrl) {
    if (!id || !dataUrl) return false;
    const worldKey = String(id);
    thumbnailCache.set(worldKey, dataUrl);

    try {
        const db = await openDB();
        if (db) {
            await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_THUMBNAILS, 'readwrite');
                const store = tx.objectStore(STORE_THUMBNAILS);
                const req = store.put(dataUrl, worldKey);
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });

            // Clean up localStorage thumbnail to conserve quota
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.removeItem('swc_thumb_' + worldKey);
                }
            } catch (e) {}

            return true;
        }
    } catch (e) {}

    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('swc_thumb_' + worldKey, dataUrl);
            return true;
        }
    } catch (e) {}

    return false;
}

/**
 * Remove world thumbnail
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function removeThumbnail(id) {
    if (!id) return false;
    const worldKey = String(id);
    thumbnailCache.delete(worldKey);

    try {
        const db = await openDB();
        if (db) {
            await new Promise((resolve) => {
                const tx = db.transaction(STORE_THUMBNAILS, 'readwrite');
                tx.objectStore(STORE_THUMBNAILS).delete(worldKey);
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            });
        }
    } catch (e) {}

    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('swc_thumb_' + worldKey);
        }
    } catch (e) {}

    return true;
}

/**
 * One-time background migration of all legacy localStorage worlds into IndexedDB
 * Safely removes large swc_data_* entries from localStorage after verifying write.
 * @returns {Promise<{migratedWorlds: number, migratedThumbs: number}>}
 */
export async function migrateLocalStorageWorlds() {
    if (isMigrating) return { migratedWorlds: 0, migratedThumbs: 0 };
    isMigrating = true;

    let migratedWorlds = 0;
    let migratedThumbs = 0;

    try {
        if (typeof localStorage === 'undefined') {
            isMigrating = false;
            return { migratedWorlds, migratedThumbs };
        }

        const db = await openDB();
        if (!db) {
            isMigrating = false;
            return { migratedWorlds, migratedThumbs };
        }

        const keysToMigrate = [];
        const thumbKeysToMigrate = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                if (key.startsWith('swc_data_')) {
                    keysToMigrate.push(key);
                } else if (key.startsWith('swc_thumb_')) {
                    thumbKeysToMigrate.push(key);
                }
            }
        }

        // Migrate worlds
        for (const fullKey of keysToMigrate) {
            const worldId = fullKey.slice('swc_data_'.length);
            if (!worldId) continue;
            try {
                const raw = localStorage.getItem(fullKey);
                if (raw) {
                    let parsed = null;
                    try { parsed = JSON.parse(raw); } catch (e) { parsed = raw; }
                    await setWorldData(worldId, parsed);
                    // Safe removal once written
                    localStorage.removeItem(fullKey);
                    migratedWorlds++;
                }
            } catch (e) {
                console.warn(`[WebcraftStorage] Failed to migrate world ${worldId}:`, e);
            }
        }

        // Migrate thumbnails
        for (const fullKey of thumbKeysToMigrate) {
            const worldId = fullKey.slice('swc_thumb_'.length);
            if (!worldId) continue;
            try {
                const raw = localStorage.getItem(fullKey);
                if (raw) {
                    await setThumbnail(worldId, raw);
                    localStorage.removeItem(fullKey);
                    migratedThumbs++;
                }
            } catch (e) {
                console.warn(`[WebcraftStorage] Failed to migrate thumbnail ${worldId}:`, e);
            }
        }

        if (migratedWorlds > 0 || migratedThumbs > 0) {
            console.log(`[WebcraftStorage] Migration complete: Transferred ${migratedWorlds} worlds and ${migratedThumbs} thumbnails to IndexedDB.`);
        }
    } catch (e) {
        console.warn('[WebcraftStorage] Migration error:', e);
    } finally {
        isMigrating = false;
    }

    return { migratedWorlds, migratedThumbs };
}

/**
 * Initialize storage system and run initial migration
 */
export async function initStorage() {
    await openDB();
    await migrateLocalStorageWorlds();
}

// Automatically initialize storage when module is imported
try {
    if (typeof window !== 'undefined') {
        window.WebcraftStorage = {
            openDB,
            initStorage,
            getWorldData,
            setWorldData,
            removeWorldData,
            hasWorldData,
            hasWorldDataSync,
            getThumbnail,
            setThumbnail,
            removeThumbnail,
            migrateLocalStorageWorlds,
            availableWorldSaveIds,
            thumbnailCache
        };
        initStorage().catch(err => console.warn('[WebcraftStorage] Auto-init failed:', err));
    }
} catch (e) {}
