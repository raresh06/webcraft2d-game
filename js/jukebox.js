// WEBCRAFT 2D - JUKEBOX & VINYL AUDIO SYSTEM (jukebox.js)

const DB_NAME = 'webcraft_music_db';
const DB_VERSION = 1;
const STORE_NAME = 'tracks';

let dbPromise = null;

export function getMusicDB() {
    if (dbPromise) return dbPromise;
    if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB not supported'));

    dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'trackId' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    return dbPromise;
}

export async function saveAudioTrack(trackId, fileBlob, fileName) {
    try {
        const db = await getMusicDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const record = {
                trackId: trackId,
                name: fileName,
                blob: fileBlob,
                mimeType: fileBlob.type || 'audio/mp3',
                updatedAt: Date.now()
            };
            const req = store.put(record);
            req.onsuccess = () => resolve(record);
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.warn('Failed to save audio track to IndexedDB:', err);
        return null;
    }
}

export async function getAudioTrack(trackId) {
    try {
        const db = await getMusicDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(trackId);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.warn('Failed to load audio track from IndexedDB:', err);
        return null;
    }
}

export async function deleteAudioTrack(trackId) {
    try {
        const db = await getMusicDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.delete(trackId);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.warn('Failed to delete audio track from IndexedDB:', err);
        return false;
    }
}

// ========================================================
// JUKEBOX PLAYBACK CONTROLLER
// ========================================================

class JukeboxManager {
    constructor() {
        this.audio = (typeof Audio !== 'undefined') ? new Audio() : null;
        this.activeJukebox = null; // { x, y }
        this.activeTrack = null;   // { trackId, name, duration }
        this.activeVinyl = null;   // Item object representing vinyl in jukebox
        this.currentBlobUrl = null;
        this.isPlaying = false;
        this.volume = 0.85;

        this.listeners = new Set();

        if (this.audio) {
            this.audio.volume = this.volume;
            this.audio.addEventListener('timeupdate', () => this.notify('timeupdate'));
            this.audio.addEventListener('play', () => {
                this.isPlaying = true;
                this.notify('statechange');
            });
            this.audio.addEventListener('pause', () => {
                this.isPlaying = false;
                this.notify('statechange');
            });
            this.audio.addEventListener('ended', () => {
                this.isPlaying = false;
                this.notify('ended');
            });
            this.audio.addEventListener('error', (e) => {
                console.warn('Jukebox audio playback error:', e);
                this.isPlaying = false;
                this.notify('error');
            });
        }
    }

    subscribe(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    notify(event) {
        for (const fn of this.listeners) {
            try { fn(event, this); } catch (e) { console.error(e); }
        }
    }

    getActiveJukebox() {
        return this.activeJukebox;
    }

    getActiveTrack() {
        return this.activeTrack;
    }

    getActiveVinyl() {
        return this.activeVinyl;
    }

    getDuration() {
        if (!this.audio || !Number.isFinite(this.audio.duration)) return 0;
        return this.audio.duration;
    }

    getCurrentTime() {
        if (!this.audio || !Number.isFinite(this.audio.currentTime)) return 0;
        return this.audio.currentTime;
    }

    async play(blobOrUrl, trackInfo, jukeboxCoord, vinylItem) {
        if (!this.audio) return false;

        // Clean up previous blob URL if needed
        if (this.currentBlobUrl && this.currentBlobUrl.startsWith('blob:')) {
            try { URL.revokeObjectURL(this.currentBlobUrl); } catch (e) {}
            this.currentBlobUrl = null;
        }

        let src = '';
        if (typeof blobOrUrl === 'string') {
            src = blobOrUrl;
        } else if (blobOrUrl instanceof Blob) {
            src = URL.createObjectURL(blobOrUrl);
            this.currentBlobUrl = src;
        }

        this.audio.src = src;
        this.audio.currentTime = 0;
        this.activeJukebox = jukeboxCoord ? { x: jukeboxCoord.x, y: jukeboxCoord.y } : null;
        this.activeTrack = trackInfo || { name: 'Custom Track' };
        this.activeVinyl = vinylItem || null;

        try {
            await this.audio.play();
            this.isPlaying = true;
            this.notify('start');
            return true;
        } catch (err) {
            console.warn('Audio play() request interrupted or blocked:', err);
            this.isPlaying = false;
            return false;
        }
    }

    pause() {
        if (this.audio) {
            this.audio.pause();
            this.isPlaying = false;
        }
    }

    resume() {
        if (this.audio && this.audio.src) {
            this.audio.play().catch(e => console.warn('Audio resume failed:', e));
        }
    }

    seek(seconds) {
        if (!this.audio) return;
        const target = Math.max(0, Math.min(this.getDuration(), seconds));
        this.audio.currentTime = target;
        this.notify('timeupdate');
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.audio) this.audio.volume = this.volume;
        this.notify('volumechange');
    }

    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio.removeAttribute('src');
            this.audio.load();
        }
        if (this.currentBlobUrl && this.currentBlobUrl.startsWith('blob:')) {
            try { URL.revokeObjectURL(this.currentBlobUrl); } catch (e) {}
            this.currentBlobUrl = null;
        }
        this.isPlaying = false;
        const prevJukebox = this.activeJukebox;
        const prevVinyl = this.activeVinyl;
        this.activeJukebox = null;
        this.activeTrack = null;
        this.activeVinyl = null;
        this.notify('stop');
        return { jukebox: prevJukebox, vinyl: prevVinyl };
    }
}

export const jukebox = new JukeboxManager();

if (typeof window !== 'undefined') {
    window.jukebox = jukebox;
    window.saveAudioTrack = saveAudioTrack;
    window.getAudioTrack = getAudioTrack;
    window.deleteAudioTrack = deleteAudioTrack;
}

