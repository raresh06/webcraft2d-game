// =============================================================================
// WEBCRAFT 2D - NETWORK & MULTIPLAYER MODULE (network.js)
// Firebase Authentication & WebRTC Peer-to-Peer Networking
// =============================================================================

export let STATE = 'MENU';
export let world = null;
export let bgWorld = null;
export let surfaceHeights = [];
export let inventory = new Array(28).fill(null);
export let equippedArmor = [null, null, null, null];
export let entities = [];
export let droppedItems = [];
export let furnaces = [];
export let fluids = new Map();
export let saplingGrowthQueue = new Map();
export let nonCollidableTreeWood = new Set();
export let timeOfDay = 0;
export let dayCount = 1;
export let frameCount = 0;
export let currentDifficulty = 'normal';
export let keepInventory = false;
export let currentWorldAchievementsEnabled = true;
export let isMultiplayer = false;
export function setNetworkIsMultiplayer(val) { isMultiplayer = !!val; if (typeof window !== 'undefined') window.isMultiplayer = !!val; }
export function setNetworkEntities(newEntities) { entities = newEntities; if (typeof window !== 'undefined') window.entities = newEntities; }
export let currentMpRoom = null;
export let currentMpWorldName = null;
export let mpCreateDifficulty = 'normal';
export let selectedJoinRoom = null;
export let playerName = '';
export let remotePlayers = {};
export let isSleeping = false;
export let sleepWakeVersion = 0;
export let mpPeerIds = new Set();
export let lastWorldSyncTime = 0;
export let lastWorldStateTimestamp = 0;
export let lastSyncTime = 0;
export let lastSentSkinData = null;
export let lastAutosaveTimestamp = Date.now();
export let pendingPickupRequest = null;
export let caveSkyOpacity = 0;
export let chatSeenMessageIds = new Set();

// Firebase Initialization & Authentication
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'webcraft';
export let firebaseConfig = null;
try {
    firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
        apiKey: "AIzaSyB-e7uzYBdOEQabcBmVwxZKazKPgAnTPrg",
        authDomain: "webcraft-server-c25dd.firebaseapp.com",
        projectId: "webcraft-server-c25dd",
        storageBucket: "webcraft-server-c25dd.firebasestorage.app",
        messagingSenderId: "330910473466",
        appId: "1:330910473466:web:22bbc1c26b4ee8a3847d43",
        measurementId: "G-G2HCYF1ZMH"
    };
} catch (e) {
    console.error("Invalid Firebase configuration", e);
}

export let app = null, db = null, auth = null;
export let fbSignInWithCustomToken = null, fbSignInAnonymously = null;

export async function initFirebaseSdk() {
    if (window.fbAuth) return true;
    try {
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js");
        const { getAuth, signInAnonymously, signInWithCustomToken } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js");
        const firestore = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");

        fbSignInAnonymously = signInAnonymously;
        fbSignInWithCustomToken = signInWithCustomToken;

        if (firebaseConfig) {
            app = initializeApp(firebaseConfig);
            db = firestore.getFirestore(app);
            auth = getAuth(app);

            window.fbDb = db;
            window.fbAuth = auth;
            window.fbAppId = appId;
            window.fbModules = firestore;
        }
        return true;
    } catch (e) {
        console.error("Firebase SDK init failed", e);
        return false;
    }
}

window.initFirebase = async () => {
    if (!window.fbAuth) {
        await initFirebaseSdk();
    }
    if (!window.fbAuth) return false;
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token && fbSignInWithCustomToken) {
            await fbSignInWithCustomToken(window.fbAuth, __initial_auth_token);
        } else if (fbSignInAnonymously) {
            await fbSignInAnonymously(window.fbAuth);
        }
        window.user = window.fbAuth.currentUser;
        return true;
    } catch (e) {
        console.error("Auth failed", e);
        return false;
    }
};

// Auto-authenticate immediately
initFirebaseSdk().then(() => {
    window.initFirebase();
});

    export let mpUnsubscribers = [];
    export let lastMultiplayerConnection = null;
    export let pendingDropRequest = null;
    export let multiplayerConnectionAttempt = 0;

    // WebRTC Peer-to-Peer Configuration & State
    export const rtcConfig = {
        iceServers: [
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ]
    };
    export let peerConnection = null;
    export let gameDataChannel = null;
    export let isWebRTCHost = false;


    export function tryCompleteMultiplayerSleep() {
        if (!isSleeping || timeOfDay <= 0.5 || timeOfDay > 0.9) return;
        if (sleepStartTime && performance.now() - sleepStartTime >= sleepTransitionMs) {
            completeSleepTransition();
        }
    }

    export function syncBlock(x, y, newId, extraData = {}) {
        if (!isMultiplayer) return;
        if (!Number.isInteger(x) || !Number.isInteger(y)) return;
        const payload = {
            type: 'block',
            id: Number(newId),
            x: Number(x),
            y: Number(y),
            newId: Number(newId),
            timestamp: Date.now()
        };
        if (extraData.growthAt !== undefined) payload.growthAt = extraData.growthAt;
        if (extraData.treeTrunk) payload.treeTrunk = true;
        if (extraData.isBackground) payload.isBackground = true;

        broadcastDataPacket(payload);
    }

    export let lastFluidSyncTime = 0;
    export function syncFluidState() {
        if (!isMultiplayer || !isMultiplayerAuthority()) return;
        const now = Date.now();
        if (now - lastFluidSyncTime < 250) return; // Throttle fluid broadcast to max 4 times/sec
        lastFluidSyncTime = now;
        broadcastDataPacket({
            type: 'fluid',
            fluids: Object.fromEntries(fluids),
            timestamp: now
        });
    }

    export function spawnDroppedItem(itemId, x, y, count = 1) {
        let dropId = `drop_${window.user?.uid || 'local'}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        droppedItems.push(new ItemDrop(itemId, x, y, count, dropId));
    }

    export function dropItemForWorld(itemId, x, y, count = 1) {
        if (!isMultiplayer || isMultiplayerAuthority()) {
            spawnDroppedItem(itemId, x, y, count);
            return true;
        }
        broadcastDataPacket({
            type: 'drop_request',
            itemId,
            count,
            uid: window.user?.uid || window.fbAuth?.currentUser?.uid,
            timestamp: Date.now()
        });
        return true;
    }

    export function serializeDroppedItem(drop) {
        return { dropId: drop.dropId, itemId: drop.itemId, x: drop.x, y: drop.y, count: drop.count, vx: drop.vx, vy: drop.vy, isGrounded: drop.isGrounded };
    }

    export function deserializeDroppedItem(data) {
        if (!data || !Number.isFinite(data.x) || !Number.isFinite(data.y) || !Number.isFinite(data.itemId)) return null;
        let drop = new ItemDrop(data.itemId, data.x, data.y, data.count || 1, data.dropId);
        drop.vx = data.vx || 0; drop.vy = data.vy || 0; drop.isGrounded = data.isGrounded === true;
        return drop;
    }


    export function applyMultiplayerBlockDiff(x, y, newId, growthAt = null, treeTrunk = false, isBackground = false) {
        if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return;
        if (isBackground) {
            if (bgWorld && bgWorld[x]) {
                bgWorld[x][y] = newId;
            }
            return;
        }
        if (!world || !world[x]) return;
        let wasTreeTrunk = nonCollidableTreeWood.has(`${x}_${y}`);
        let wasSolid = world[x]?.[y] !== IDS.AIR;
        let wasSnow = world[x]?.[y] === IDS.SNOW;
        nonCollidableTreeWood.delete(`${x}_${y}`);
        if (newId !== IDS.AIR || wasSolid) removeFluid(x, y);
        world[x][y] = newId;
        if (newId === IDS.WOOD && treeTrunk) nonCollidableTreeWood.add(`${x}_${y}`);
        if (newId === IDS.AIR) {
            notifyBlockedSaplings();
            checkSandFallAbove(x, y);
            dirtToGrassQueue.delete(`${x}_${y}`);
            if (wasSnow) scheduleSnowRegrowth(x, y);
            if (world[x]?.[y + 1] === IDS.DIRT) scheduleDirtToGrass(x, y + 1);
        } else if (newId === IDS.SAND) {
            if (!isSolidWorldBlock(x, y + 1, world[x]?.[y + 1])) triggerSandFall(x, y);
            else checkSandFallAbove(x, y);
        } else if (newId === IDS.DIRT) {
            scheduleDirtToGrass(x, y);
        } else if (newId === IDS.GRASS) {
            dirtToGrassQueue.delete(`${x}_${y}`);
        } else if (newId === IDS.SNOW) {
            snowRegrowthQueue.delete(`${x}_${y}`);
        }
        if (newId === IDS.SAPLING && Number.isFinite(growthAt)) saplingGrowthQueue.set(`${x}_${y}`, growthAt);
        else {
            saplingGrowthQueue.delete(`${x}_${y}`);
            saplingBlockedWarnings.delete(`${x}_${y}`);
        }
        if (wasTreeTrunk && newId === IDS.AIR && isMultiplayerAuthority() && ![...nonCollidableTreeWood].some(cell => cell.startsWith(`${x}_`))) {
            scheduleTreeLeafDecay(x);
        }
    }


    export function processRemotePickupRequests() {
        // Handled reactively via WebRTC data channel onmessage
    }

    export function processRemoteDropRequests() {
        // Handled reactively via WebRTC data channel onmessage
    }

    export function isMultiplayerAuthority() {
        if (!isMultiplayer) return true;
        if (isWebRTCHost) return true;
        if (!window.user?.uid) return false;
        return [window.user.uid, ...mpPeerIds].sort()[0] === window.user.uid;
    }

    export function damageRemotePlayer(playerId, amount, isPoison = false) {
        let remotePlayer = remotePlayers[playerId];
        if (!isMultiplayer || !isMultiplayerAuthority() || !remotePlayer || remotePlayer.damageCooldown > 0) return;
        remotePlayer.damageCooldown = 30;
        if (isPoison) {
            remotePlayer.isPoisoned = true;
            remotePlayer.poisonTimer = 360;
        }
        broadcastDataPacket({
            type: 'damage',
            targetUid: playerId,
            amount: amount,
            isPoison: Boolean(isPoison),
            id: `${Date.now()}-${Math.random()}`
        });
    }

    export function serializeMultiplayerEntity(entity) {
        if (!entity.id) {
            entity.id = 'ent_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now();
        }
        return Object.fromEntries(Object.entries({
            id: entity.id,
            type: entity.constructor.name, x: entity.x, y: entity.y,
            width: entity.width, height: entity.height, vx: entity.vx, vy: entity.vy,
            isGrounded: entity.isGrounded, health: entity.health,
            damageCooldown: entity.damageCooldown || 0, facingRight: entity.facingRight,
            damageFlashId: entity.damageFlashId,
            tailStrikeTime: entity.tailStrikeTime || 0,
            walkAnimTime: entity.walkAnimTime || 0,
            dir: entity.dir, timer: entity.timer, panic: entity.panic,
            swell: entity.swell, speed: entity.speed, damage: entity.damage, isSheared: entity.isSheared
        }).filter(([, value]) => value !== undefined));
    }

    export function deserializeMultiplayerEntity(data) {
        const constructors = {
            Pig: typeof Pig !== 'undefined' ? Pig : (typeof window !== 'undefined' ? window.Pig : null),
            Chicken: typeof Chicken !== 'undefined' ? Chicken : (typeof window !== 'undefined' ? window.Chicken : null),
            Sheep: typeof Sheep !== 'undefined' ? Sheep : (typeof window !== 'undefined' ? window.Sheep : null),
            Zombie: typeof Zombie !== 'undefined' ? Zombie : (typeof window !== 'undefined' ? window.Zombie : null),
            Creeper: typeof Creeper !== 'undefined' ? Creeper : (typeof window !== 'undefined' ? window.Creeper : null),
            Scorpion: typeof Scorpion !== 'undefined' ? Scorpion : (typeof window !== 'undefined' ? window.Scorpion : null)
        };
        const EntityType = constructors[data.type];
        if (!EntityType || !Number.isFinite(data.x) || !Number.isFinite(data.y)) return null;
        const entity = new EntityType(data.x, data.y);
        entity.id = data.id || ('ent_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now());
        Object.keys(data).forEach(key => {
            if (key !== 'type' && data[key] !== undefined) entity[key] = data[key];
        });
        return entity;
    }

    export let lastReceivedAutosaveId = null;
    export let currentAutosaveBroadcastId = null;

    export function applyMultiplayerWorldState(data) {
        if (!isMultiplayer || !data || !Number.isFinite(data.timestamp) || data.timestamp <= lastWorldStateTimestamp) return;
        lastWorldStateTimestamp = data.timestamp;
        timeOfDay = data.timeOfDay ?? timeOfDay;
        dayCount = data.dayCount ?? dayCount;
        frameCount = data.frameCount ?? frameCount;
        if (data.wakeVersion !== undefined && data.wakeVersion > sleepWakeVersion) {
            sleepWakeVersion = data.wakeVersion;
            isSleeping = false;
        }

        // Synchronized Autosave toast notification across all connected clients
        if (data.lastAutosaveId && data.lastAutosaveId !== lastReceivedAutosaveId) {
            lastReceivedAutosaveId = data.lastAutosaveId;
            if (!isMultiplayerAuthority()) {
                showAutosaveToast(true);
            }
        }

        // Reconcile entities by stable ID without tearing down objects (prevents GC freezing and cross-entity teleporting)
        const incomingEntities = Array.isArray(data.entities) ? data.entities : [];
        const constructors = {
            Pig: typeof Pig !== 'undefined' ? Pig : (typeof window !== 'undefined' ? window.Pig : null),
            Chicken: typeof Chicken !== 'undefined' ? Chicken : (typeof window !== 'undefined' ? window.Chicken : null),
            Sheep: typeof Sheep !== 'undefined' ? Sheep : (typeof window !== 'undefined' ? window.Sheep : null),
            Zombie: typeof Zombie !== 'undefined' ? Zombie : (typeof window !== 'undefined' ? window.Zombie : null),
            Creeper: typeof Creeper !== 'undefined' ? Creeper : (typeof window !== 'undefined' ? window.Creeper : null),
            Scorpion: typeof Scorpion !== 'undefined' ? Scorpion : (typeof window !== 'undefined' ? window.Scorpion : null)
        };
        const newEntities = [];
        for (let i = 0; i < incomingEntities.length; i++) {
            const eData = incomingEntities[i];
            if (!eData || !constructors[eData.type] || !Number.isFinite(eData.x) || !Number.isFinite(eData.y)) continue;
            const curEntities = (entities && entities.length) ? entities : (typeof window !== 'undefined' && Array.isArray(window.entities) ? window.entities : entities);
            let existing = eData.id ? curEntities.find(e => e.id === eData.id && e.constructor.name === eData.type) : null;
            if (!existing && i < curEntities.length && curEntities[i].constructor.name === eData.type && !newEntities.includes(curEntities[i])) {
                existing = curEntities[i];
            }
            if (existing) {
                Object.keys(eData).forEach(k => {
                    if (k !== 'type' && eData[k] !== undefined) existing[k] = eData[k];
                });
                newEntities.push(existing);
            } else {
                const created = deserializeMultiplayerEntity(eData);
                if (created) newEntities.push(created);
            }
        }
        entities = newEntities;
        if (typeof window !== 'undefined') {
            window.entities = newEntities;
            if (typeof window.setEngineEntities === 'function') window.setEngineEntities(newEntities);
        }

        // Reconcile dropped items
        const incomingDrops = Array.isArray(data.droppedItems) ? data.droppedItems : [];
        const newDrops = [];
        for (let i = 0; i < incomingDrops.length; i++) {
            const dData = incomingDrops[i];
            if (!dData || !Number.isFinite(dData.x) || !Number.isFinite(dData.y)) continue;
            let existing = droppedItems.find(d => d.dropId === dData.dropId);
            if (existing) {
                existing.x = dData.x; existing.y = dData.y;
                existing.vx = dData.vx || 0; existing.vy = dData.vy || 0;
                existing.count = dData.count || 1;
                existing.isGrounded = dData.isGrounded === true;
                newDrops.push(existing);
            } else {
                const created = deserializeDroppedItem(dData);
                if (created) newDrops.push(created);
            }
        }
        droppedItems = newDrops;

        if (typeof updateSleepStatus === 'function') updateSleepStatus();
        else if (typeof window !== 'undefined' && typeof window.updateSleepStatus === 'function') window.updateSleepStatus();
    }

    export let lastSentLocalPlayerPos = { x: 0, y: 0, vx: 0, vy: 0, facingRight: true, heldItem: null, health: 20 };

    export function syncMultiplayerWorldState(isAutosave = false) {
        if (!isMultiplayer || !isMultiplayerAuthority() || !window.user || (Date.now() - lastWorldSyncTime < 50 && !isAutosave)) return;
        lastWorldSyncTime = Date.now();
        const payload = {
            type: 'world_state',
            timeOfDay,
            dayCount,
            frameCount,
            wakeVersion: sleepWakeVersion,
            entities: entities.map(serializeMultiplayerEntity),
            droppedItems: droppedItems.map(serializeDroppedItem),
            timestamp: Date.now(),
            authorityId: window.user.uid
        };
        broadcastDataPacket(payload);
    }

    export function broadcastPlayerState(immediate = false) {
        const user = window.user || window.fbAuth?.currentUser;
        if (!isMultiplayer || !user || !currentMpRoom) return;

        const now = Date.now();
        const timeSinceLastSync = now - lastSyncTime;

        const isMovingNow = Boolean(
            Math.abs(player.vx) > 0.08 || Math.abs(player.vy) > 0.08 ||
            isActionActive('left') || isActionActive('right') ||
            isActionActive('jump') || isActionActive('down')
        );

        // Throttle to ~60Hz when moving, 100ms heartbeat when idle
        const minSyncInterval = isMovingNow ? 16 : 100;

        if (!immediate && timeSinceLastSync < minSyncInterval) {
            return;
        }

        let activeId = inventory[selectedHotbarIndex] ? inventory[selectedHotbarIndex].id : null;
        const currentSkinJson = JSON.stringify(getSkinSaveData());
        const skinChanged = currentSkinJson !== lastSentSkinData;
        if (skinChanged) lastSentSkinData = currentSkinJson;

        lastSyncTime = now;
        lastSentLocalPlayerPos.x = player.x;
        lastSentLocalPlayerPos.y = player.y;
        lastSentLocalPlayerPos.vx = player.vx;
        lastSentLocalPlayerPos.vy = player.vy;
        lastSentLocalPlayerPos.facingRight = Boolean(player.facingRight);
        lastSentLocalPlayerPos.heldItem = activeId;
        lastSentLocalPlayerPos.health = player.health;

        const cleanArmor = Array.isArray(equippedArmor)
            ? equippedArmor.map(item => item ? { id: item.id, count: 1, ...(item.durability !== undefined ? { durability: item.durability } : {}) } : null)
            : [null, null, null, null];

        const payload = {
            type: 'pos',
            uid: user.uid,
            playerName: (playerName || 'Player').slice(0, 16),
            x: Math.round(player.x * 10) / 10,
            y: Math.round(player.y * 10) / 10,
            vx: Math.round((player.vx || 0) * 100) / 100,
            vy: Math.round((player.vy || 0) * 100) / 100,
            isMoving: isMovingNow,
            facingRight: Boolean(player.facingRight),
            isClimbing: Boolean(player.isClimbing),
            isDead: Boolean(player.isDead),
            heldItem: activeId,
            health: Number(player.health) || 20,
            oxygen: Number(player.oxygen) || 20,
            sleeping: Boolean(isSleeping),
            isPoisoned: Boolean(player.poisonTimer > 0),
            poisonTimer: Number(player.poisonTimer) || 0,
            equippedArmor: cleanArmor,
            anim: player.walkAnimTime || 0,
            timestamp: now
        };

        if (skinChanged || immediate) {
            payload.skinData = currentSkinJson;
        }

        broadcastDataPacket(payload);
    }
    export const syncLocalPlayerState = broadcastPlayerState;
    

    export function closeRoomDialogs() {
        document.getElementById('multiplayer-modal').classList.add('hidden');
    }

    export function switchMpTab(tabId) {
        // Update tab buttons
        document.getElementById('tab-btn-join').classList.toggle('active-mp-tab', tabId === 'join');
        document.getElementById('tab-btn-host').classList.toggle('active-mp-tab', tabId === 'host');
        
        // Update content panels
            document.getElementById('mp-tab-join').classList.toggle('hidden', tabId !== 'join');
            document.getElementById('mp-tab-host').classList.toggle('hidden', tabId !== 'host');
        
        if (tabId === 'join') {
            setMpFilter('all');
        } else if (tabId === 'host') {
            selectMpGameMode('survival');
        }
    }

    export function selectMpGameMode(mode) {
        mpCurrentGameMode = mode;
        // Update mode buttons
        document.querySelectorAll('#mp-tab-host .mp-mode-button').forEach(btn => {
            btn.classList.toggle('active-mp-mode', btn.dataset.mode === mode);
        });
        
        // Show/hide panels
        document.getElementById('mp-survival-panel').classList.toggle('hidden', mode !== 'survival');
        document.getElementById('mp-minigames-panel').classList.toggle('hidden', mode !== 'minigames');
        
        if (mode === 'survival') {
            selectMpDifficulty('normal');
        }
    }

    export function setMpFilter(filter) {
        // Update filter buttons
        document.querySelectorAll('#mp-filter-selector .mp-filter-button').forEach(btn => {
            btn.classList.toggle('active-mp-filter', btn.dataset.filter === filter);
        });
        
        loadAvailableRooms(filter);
    }

    export let mpCurrentFilter = 'all';
    export let mpCurrentGameMode = 'survival';

    export function openMultiplayerMenu() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('multiplayer-modal').classList.remove('hidden');
        document.getElementById('mp-player-name').value = playerName;
        switchMpTab('join');
    }
    
    export function closeMultiplayerMenu() {
        document.getElementById('multiplayer-modal').classList.add('hidden');
        showMainMenu();
    }

    export function selectMpDifficulty(diffKey) {
        mpCreateDifficulty = diffKey;
        document.querySelectorAll('#mp-diff-selector .diff-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.diff === diffKey));
        const description = document.getElementById('mp-diff-desc');
        if (description) description.innerText = diffDescriptions[diffKey];
        const keepInventoryInput = document.getElementById('mp-keep-inventory');
        keepInventoryInput.disabled = diffKey === 'hardcore';
        if (diffKey === 'hardcore') keepInventoryInput.checked = false;
        updateMpAchievementWarning();
    }

    export async function ensureFirebase() {
        if (!window.fbAuth) {
            showToast("Multiplayer is unavailable: this file has no Firebase configuration.");
            return false;
        }
        if (!window.user && !window.fbAuth.currentUser) {
            let ok = await window.initFirebase();
            if(!ok) { showToast("Could not connect to the multiplayer server."); return false; }
        }
        if (window.fbAuth.currentUser) {
            window.user = window.fbAuth.currentUser;
        }
        return Boolean(window.user);
    }

    export async function hashRoomPassword(password) {
        try {
            if (typeof TextEncoder !== 'undefined' && window.crypto && window.crypto.subtle) {
                const bytes = new TextEncoder().encode(password);
                const digest = await window.crypto.subtle.digest('SHA-256', bytes);
                return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
            }
        } catch(e) {}
        let hash = 5381;
        for (let i = 0; i < password.length; i++) hash = ((hash << 5) + hash) + password.charCodeAt(i) | 0;
        return 'hash_' + (hash >>> 0).toString(16);
    }

    export function cleanUpPeerConnection() {
        if (gameDataChannel) {
            try { gameDataChannel.close(); } catch(e) {}
            gameDataChannel = null;
        }
        if (peerConnection) {
            try { peerConnection.close(); } catch(e) {}
            peerConnection = null;
        }
        isWebRTCHost = false;
    }

    export function broadcastDataPacket(packet) {
        if (!gameDataChannel || gameDataChannel.readyState !== 'open') return;
        try {
            const raw = typeof packet === 'string' ? packet : JSON.stringify(packet);
            gameDataChannel.send(raw);
        } catch(e) {
            console.error("WebRTC data channel send error", e);
        }
    }

    export function setupDataChannelListeners(channel) {
        if (!channel) return;

        channel.onopen = () => {
            console.log("WebRTC Channel Open! No more lag.");
            isMultiplayer = true;
            setMultiplayerLoadingStatus('Ready', 100);
            setTimeout(() => {
                hideMultiplayerLoading();
                document.getElementById('hud').style.display = 'block';
                document.getElementById('gameCanvas').classList.remove('hidden');
                STATE = 'PLAYING';
                updateUI(); updateHealthUI(); updateHungerUI(); updateTimeUI(); updateTutorialUI(); updateArmorUI(); updateHudArmorBar();
                broadcastPlayerState(true);
                if (isMultiplayerAuthority()) {
                    syncMultiplayerWorldState(true);
                    syncFluidState();
                }
                showToast("Connected to " + (currentMpWorldName || "multiplayer room"));
            }, 100);
        };

        channel.onclose = () => {
            console.log("WebRTC Channel Closed.");
            if (isMultiplayer) {
                showToast("Multiplayer peer disconnected.");
            }
        };

        channel.onerror = (err) => {
            console.error("WebRTC Data Channel error:", err);
        };

        channel.onmessage = (event) => {
            try {
                const packet = JSON.parse(event.data);
                if (!packet || !packet.type) return;

                const currentUid = window.user?.uid || window.fbAuth?.currentUser?.uid;

                switch (packet.type) {
                    case 'pos': {
                        if (packet.uid === currentUid) return;
                        mpPeerIds.add(packet.uid);

                        if (!remotePlayers[packet.uid]) {
                            const rCanvas = document.createElement('canvas');
                            compileRemoteSkin(getDefaultSkinData(), rCanvas);
                            remotePlayers[packet.uid] = {
                                canvas: rCanvas,
                                renderX: Number.isFinite(packet.x) ? packet.x : player.x,
                                renderY: Number.isFinite(packet.y) ? packet.y : player.y,
                                targetX: Number.isFinite(packet.x) ? packet.x : player.x,
                                targetY: Number.isFinite(packet.y) ? packet.y : player.y,
                                x: Number.isFinite(packet.x) ? packet.x : player.x,
                                y: Number.isFinite(packet.y) ? packet.y : player.y,
                                vx: Number.isFinite(packet.vx) ? packet.vx : 0,
                                vy: Number.isFinite(packet.vy) ? packet.vy : 0,
                                isMoving: Boolean(packet.isMoving),
                                facingRight: packet.facingRight !== false,
                                health: Number.isFinite(packet.health) ? packet.health : 20,
                                playerName: packet.playerName || 'Player',
                                isDead: packet.isDead === true,
                                isClimbing: Boolean(packet.isClimbing),
                                isPoisoned: Boolean(packet.isPoisoned),
                                poisonTimer: packet.poisonTimer || 0,
                                heldItem: packet.heldItem || null,
                                damageCooldown: 0,
                                equippedArmor: Array.isArray(packet.equippedArmor) ? packet.equippedArmor : [null, null, null, null],
                                lastSeenLocalTime: Date.now(),
                                initializedHealth: true
                            };
                        }

                        let rp = remotePlayers[packet.uid];
                        rp.lastSeenLocalTime = Date.now();
                        rp.playerName = packet.playerName || rp.playerName || 'Player';

                        if (packet.isPoisoned !== undefined) {
                            rp.isPoisoned = Boolean(packet.isPoisoned);
                            rp.poisonTimer = packet.poisonTimer || (packet.isPoisoned ? 360 : 0);
                        }

                        if (packet.health !== undefined) {
                            if (rp.initializedHealth && rp.health !== undefined && packet.health < rp.health && !packet.isDead) {
                                let dmgTaken = rp.health - packet.health;
                                let rDrawX = (rp.renderX !== undefined ? rp.renderX : (Number.isFinite(packet.x) ? packet.x : rp.x || 0)) + (TILE_SIZE * 0.75) / 2;
                                let rDrawY = (rp.renderY !== undefined ? rp.renderY : (Number.isFinite(packet.y) ? packet.y : rp.y || 0)) - 10;
                                let txtColor = (packet.isPoisoned || rp.isPoisoned) ? "#4ade80" : "#ff3333";
                                floatingTexts.push(new FloatingText(rDrawX, rDrawY, "-" + dmgTaken, txtColor));
                                rp.damageCooldown = 15;
                                for (let i = 0; i < 6; i++) {
                                    let p = new Particle(rDrawX, rDrawY + 20, txtColor);
                                    p.vx = (Math.random() - 0.5) * 3;
                                    p.vy = -1.5 - Math.random() * 1.5;
                                    particles.push(p);
                                }
                            }
                            rp.health = packet.health;
                            rp.initializedHealth = true;
                        }

                        if (Number.isFinite(packet.x) && Number.isFinite(packet.y)) {
                            const currentDist = Math.hypot(packet.x - (rp.renderX ?? packet.x), packet.y - (rp.renderY ?? packet.y));
                            if (rp.renderX === undefined || currentDist > TILE_SIZE * 16 || rp.isDead !== packet.isDead) {
                                rp.renderX = packet.x;
                                rp.renderY = packet.y;
                            }
                            rp.targetX = packet.x;
                            rp.targetY = packet.y;
                            rp.x = packet.x;
                            rp.y = packet.y;
                            rp.vx = Number.isFinite(packet.vx) ? packet.vx : 0;
                            rp.vy = Number.isFinite(packet.vy) ? packet.vy : 0;
                            rp.isMoving = Boolean(packet.isMoving || Math.abs(rp.vx) > 0.08);
                            rp.facingRight = packet.facingRight !== false;
                            rp.isDead = packet.isDead === true;
                            rp.sleeping = Boolean(packet.sleeping);
                            rp.isClimbing = Boolean(packet.isClimbing);
                            rp.heldItem = packet.heldItem || null;
                            if (Array.isArray(packet.equippedArmor)) rp.equippedArmor = packet.equippedArmor;
                            rp.lastNetworkTimestamp = Date.now();
                        }

                        if (packet.skinData && packet.skinData !== rp.lastSkinData) {
                            rp.lastSkinData = packet.skinData;
                            try {
                                const parsedSkin = JSON.parse(packet.skinData);
                                compileRemoteSkin(parsedSkin, rp.canvas);
                            } catch(e) {
                                compileRemoteSkin(getDefaultSkinData(), rp.canvas);
                            }
                        } else if (!rp.lastSkinData && rp.canvas) {
                            compileRemoteSkin(getDefaultSkinData(), rp.canvas);
                        }
                        updateSleepStatus();
                        break;
                    }

                    case 'block': {
                        applyMultiplayerBlockDiff(packet.x, packet.y, packet.newId, packet.growthAt, packet.treeTrunk === true, packet.isBackground === true);
                        break;
                    }

                    case 'snowball': {
                        if (packet.uid !== currentUid && Number.isFinite(packet.x) && Number.isFinite(packet.y)) {
                            activeProjectiles.push(new SnowballProjectile(packet.x, packet.y, packet.vx, packet.vy, packet.uid, packet.id));
                        }
                        break;
                    }

                    case 'damage': {
                        if (packet.targetUid === currentUid) {
                            player.takeDamage(packet.amount || 1);
                            if (packet.isPoison) {
                                player.poisonTimer = 360;
                                updateHealthUI();
                            }
                        } else if (remotePlayers[packet.targetUid]) {
                            const rp = remotePlayers[packet.targetUid];
                            rp.damageCooldown = 15;
                        }
                        break;
                    }

                    case 'chat': {
                        appendChatMessage(packet, true);
                        break;
                    }

                    case 'chest': {
                        applyChestState(packet.key, packet);
                        break;
                    }

                    case 'world_state': {
                        if (!isMultiplayerAuthority()) {
                            applyMultiplayerWorldState(packet);
                        }
                        break;
                    }

                    case 'fluid': {
                        if (!isMultiplayerAuthority() && packet.fluids) {
                            fluids = new Map(Object.entries(packet.fluids));
                        }
                        break;
                    }

                    case 'pickup_request': {
                        if (isMultiplayerAuthority()) {
                            const dropIdx = droppedItems.findIndex(d => d.dropId === packet.dropId);
                            if (dropIdx !== -1) {
                                const drop = droppedItems[dropIdx];
                                droppedItems.splice(dropIdx, 1);
                                broadcastDataPacket({
                                    type: 'pickup_result',
                                    targetUid: packet.uid,
                                    id: packet.dropId,
                                    itemId: drop.itemId,
                                    count: drop.count
                                });
                            }
                        }
                        break;
                    }

                    case 'pickup_result': {
                        if (packet.targetUid === currentUid) {
                            if (giveItem(packet.itemId, packet.count)) {
                                pendingPickupRequest = null;
                                updateUI();
                            }
                        }
                        break;
                    }

                    case 'drop_request': {
                        if (isMultiplayerAuthority() && packet.itemId) {
                            const sender = remotePlayers[packet.uid];
                            const dropX = sender ? sender.x + TILE_SIZE * 0.375 : player.x;
                            const dropY = sender ? sender.y : player.y;
                            spawnDroppedItem(packet.itemId, dropX, dropY, packet.count || 1);
                        }
                        break;
                    }

                    case 'leave': {
                        if (packet.uid) {
                            delete remotePlayers[packet.uid];
                            mpPeerIds.delete(packet.uid);
                            updateSleepStatus();
                        }
                        break;
                    }
                }
            } catch(err) {
                console.error("Error processing WebRTC data channel packet", err);
            }
        };
    }

    export async function createMultiplayerRoom() {
        let name = document.getElementById('mp-player-name').value.trim();
        let worldName = document.getElementById('mp-world-name').value.trim();
        let password = document.getElementById('mp-create-password').value.trim();
        let gameMode = mpCurrentGameMode || 'survival';
        let minigameType = gameMode === 'minigames' ? (document.getElementById('mp-minigame-type')?.value || 'skyblock') : null;
        let starterItems = gameMode === 'survival' && document.getElementById('mp-starter-items').checked;
        let roomKeepInventory = gameMode === 'survival' && mpCreateDifficulty !== 'hardcore' && document.getElementById('mp-keep-inventory').checked;
        let roomAchievementsEnabled = gameMode === 'survival' && (!starterItems && !roomKeepInventory);
        if (!name) { showToast("Enter a character name first."); return; }
        if (!worldName) { showToast("Enter a world name."); return; }
        if (!/^\d{4,}$/.test(password)) { showToast("Password must contain at least 4 digits."); return; }

        const isFirstTime = typeof localStorage !== 'undefined' && !localStorage.getItem('webcraft_tutorial_seen');
        if (isFirstTime && typeof window.openTutorialModal === 'function') {
            window.openTutorialModal(0, {
                onboarding: true,
                onComplete: () => {
                    createMultiplayerRoom();
                }
            });
            return;
        }

        showMultiplayerLoading('Preparing multiplayer world');
        if (!await ensureFirebase()) return;
        playerName = name.slice(0, 16); localStorage.setItem('swc_player_name', playerName);
        let roomName = 'room_' + window.user.uid + '_' + Date.now();
        const { doc, setDoc, collection } = window.fbModules;
        let seed = Math.floor(Math.random() * 100000);
        let passwordHash = await hashRoomPassword(password);
        showMultiplayerLoading(roomName);

        // 1. Initialize WebRTC Host PeerConnection & DataChannel
        cleanUpPeerConnection();
        peerConnection = new RTCPeerConnection(rtcConfig);
        isWebRTCHost = true;

        gameDataChannel = peerConnection.createDataChannel('webcraft2d_sync', {
            ordered: false,
            maxRetransmits: 0
        });
        setupDataChannelListeners(gameDataChannel);

        const roomRef = doc(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'rooms', roomName);

        // 2. Gather Host ICE Candidates
        peerConnection.addEventListener('icecandidate', event => {
            if (event.candidate) {
                const candidateRef = doc(collection(roomRef, 'hostCandidates'));
                setDoc(candidateRef, event.candidate.toJSON()).catch(e => console.error("Host ICE candidate push error", e));
            }
        });

        // 3. Create Offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        // 4. Save Room Document with Offer to Firestore
        await setDoc(roomRef, {
            worldName, gameMode, minigameType, difficulty: mpCreateDifficulty, worldSize: selectedMpWorldSize, starterItems, keepInventory: roomKeepInventory, achievementsEnabled: roomAchievementsEnabled, passwordHash, seed, timeOfDay: 0.2, gameVersion: GAME_VERSION, gameBuild: GAME_BUILD,
            createdAt: Date.now(), ownerId: window.user.uid, status: 'open',
            offer: { type: offer.type, sdp: offer.sdp }
        });

        await connectToMultiplayerRoom(roomName, passwordHash, false, true /* isHost */);
    }

    export async function loadAvailableRooms(filter = 'all') {
        mpCurrentFilter = filter;
        const list = document.getElementById('mp-room-list');
        list.innerHTML = '<p class="text-gray-300 text-lg text-center">Loading worlds...</p>';
        try {
            const { collection, getDocs } = window.fbModules;
            const snap = await getDocs(collection(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'rooms'));
            list.innerHTML = '';
            let rooms = snap.docs.map(roomDoc => ({ id: roomDoc.id, ...roomDoc.data() }))
                .filter(room => room.status !== 'closed' && typeof room.passwordHash === 'string');
            
            // Apply filter
            if (filter === 'survival') {
                rooms = rooms.filter(room => room.gameMode !== 'minigames');
            } else if (filter === 'minigames') {
                rooms = rooms.filter(room => room.gameMode === 'minigames');
            }
            
            if (!rooms.length) { 
                list.innerHTML = '<p class="text-gray-400 text-lg text-center">No worlds found.</p>'; 
                return; 
            }
            rooms.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).forEach(room => {
                let isCompatible = (room.gameVersion === GAME_VERSION && room.gameBuild === GAME_BUILD);
                let button = document.createElement('button');
                button.className = 'w-full text-left p-2 mb-1 bg-gray-600 hover:bg-gray-500 border-2 border-gray-400 text-white font-[\'VT323\'] text-lg flex items-center gap-2';
                if (!isCompatible) button.classList.add('opacity-60');
                let modeLabel = room.gameMode === 'minigames' ? (room.minigameType || 'skyblock').toUpperCase() : 'SURVIVAL';
                let modeClass = room.gameMode === 'minigames' ? 'mp-room-badge-minigame' : 'mp-room-badge-survival';
                let difficulty = (room.difficulty || 'normal').toLowerCase();
                let sizeLabel = (room.worldSize || 'small').toUpperCase();
                let versionLabel = room.gameVersion || 'older';
                let versionBadgeClass = isCompatible ? 'mp-room-badge-version' : 'mp-room-badge-version-invalid';
                button.innerHTML = `<span class="mp-room-badge ${modeClass}">${modeLabel}</span><span class="mp-room-badge font-['VT323'] bg-slate-700 text-slate-200">${sizeLabel}</span><span class="mp-room-badge mp-room-badge-${difficulty}">${difficulty.toUpperCase()}</span><span class="mp-room-badge ${versionBadgeClass}">v${versionLabel}</span>${!isCompatible ? '<span class="mp-room-badge mp-room-badge-version-invalid font-[\'VT323\']">INCOMPATIBLE</span>' : ''}<span>${room.worldName || room.id}</span>`;
                button.onclick = () => {
                    if (!isCompatible) {
                        showToast(`Cannot join world '${room.worldName || room.id}': Incompatible version (Room is v${room.gameVersion || 'older'}, Client is v${GAME_VERSION}).`);
                        selectedJoinRoom = null;
                        document.querySelectorAll('#mp-room-list button').forEach(item => item.classList.remove('!bg-yellow-600'));
                        document.getElementById('mp-join-password').disabled = true;
                        document.getElementById('btn-mp-join').disabled = true;
                        return;
                    }
                    selectedJoinRoom = room;
                    document.querySelectorAll('#mp-room-list button').forEach(item => item.classList.remove('!bg-yellow-600'));
                    button.classList.add('!bg-yellow-600');
                    document.getElementById('mp-join-password').disabled = false;
                    document.getElementById('btn-mp-join').disabled = false;
                    document.getElementById('mp-join-password').focus();
                };
                list.appendChild(button);
            });
        } catch (e) {
            console.error('Room listing failed', e);
            list.innerHTML = '<p class="text-red-300 text-xl text-center">Could not load worlds.</p>';
        }
    }

    export async function joinSelectedRoom() {
        if (!selectedJoinRoom) { showToast("Select a world first."); return; }
        if (selectedJoinRoom.gameVersion !== GAME_VERSION || selectedJoinRoom.gameBuild !== GAME_BUILD) {
            showToast(`Cannot join world: Incompatible version (Room is v${selectedJoinRoom.gameVersion || 'older'}, Client is v${GAME_VERSION}).`);
            return;
        }
        let password = document.getElementById('mp-join-password').value.trim();
        if (!/^\d{4,}$/.test(password) || await hashRoomPassword(password) !== selectedJoinRoom.passwordHash) { showToast("Incorrect world password."); return; }
        let name = document.getElementById('mp-player-name').value.trim();
        if (!name) { showToast("Enter a character name first."); closeRoomDialogs(); return; }

        const isFirstTime = typeof localStorage !== 'undefined' && !localStorage.getItem('webcraft_tutorial_seen');
        if (isFirstTime && typeof window.openTutorialModal === 'function') {
            window.openTutorialModal(0, {
                onboarding: true,
                onComplete: () => {
                    joinSelectedRoom();
                }
            });
            return;
        }

        playerName = name.slice(0, 16); localStorage.setItem('swc_player_name', playerName);
        showMultiplayerLoading(selectedJoinRoom.id);
        await connectToMultiplayerRoom(selectedJoinRoom.id, await hashRoomPassword(password), false, false /* isGuest */);
    }

    export function setMultiplayerLoadingStatus(status, progress) {
        const statusEl = document.getElementById('multiplayer-loading-status');
        const fillEl = document.getElementById('multiplayer-loading-fill');
        if (statusEl) statusEl.innerText = status;
        if (fillEl) fillEl.style.width = `${Math.max(8, Math.min(100, progress))}%`;
    }

    export function showMultiplayerLoadingError(message) {
        const errorEl = document.getElementById('multiplayer-loading-error');
        const actionsEl = document.getElementById('multiplayer-loading-actions');
        if (errorEl) { errorEl.innerText = message; errorEl.classList.add('visible'); }
        if (actionsEl) actionsEl.classList.remove('hidden');
        setMultiplayerLoadingStatus('Connection paused', 100);
    }

    export function resetMultiplayerLoadingScreen(roomName) {
        const titleEl = document.getElementById('multiplayer-loading-title');
        const roomEl = document.getElementById('multiplayer-loading-room');
        const errorEl = document.getElementById('multiplayer-loading-error');
        const actionsEl = document.getElementById('multiplayer-loading-actions');
        if (titleEl) titleEl.innerText = 'Connecting to Server';
        if (roomEl) roomEl.innerText = `Joining ${roomName}`;
        if (errorEl) { errorEl.innerText = ''; errorEl.classList.remove('visible'); }
        if (actionsEl) actionsEl.classList.add('hidden');
        setMultiplayerLoadingStatus('Signing in', 12);
    }

    export function showMultiplayerLoading(roomName) {
        const loadingScreen = document.getElementById('loading-screen');
        if (!loadingScreen) return;
        document.getElementById('multiplayer-modal').classList.add('hidden');
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('worlds-menu').classList.add('hidden');
        document.getElementById('shared-menu-bg').classList.add('hidden');
        loadingScreen.classList.remove('hidden');
        loadingScreen.style.setProperty('display', 'flex', 'important');
        loadingScreen.style.setProperty('z-index', '400', 'important');
        loadingScreen.style.setProperty('background', 'rgba(0, 0, 0, 0.9)', 'important');
        resetMultiplayerLoadingScreen(roomName);
    }

    export function hideMultiplayerLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (!loadingScreen) return;
        loadingScreen.classList.add('hidden');
        loadingScreen.style.removeProperty('display');
        loadingScreen.style.removeProperty('z-index');
        loadingScreen.style.removeProperty('background');
    }

    export function showSingleplayerLoading(worldName) {
        const titleEl = document.getElementById('multiplayer-loading-title');
        const roomEl = document.getElementById('multiplayer-loading-room');
        const errorEl = document.getElementById('multiplayer-loading-error');
        const actionsEl = document.getElementById('multiplayer-loading-actions');
        if (titleEl) titleEl.innerText = 'Loading World';
        if (roomEl) roomEl.innerText = worldName ? `Opening ${worldName}` : 'Opening single-player world';
        if (errorEl) { errorEl.innerText = ''; errorEl.classList.remove('visible'); }
        if (actionsEl) actionsEl.classList.add('hidden');
        document.getElementById('loading-screen').classList.remove('hidden');
        setMultiplayerLoadingStatus('Preparing world', 18);
    }

    export function hideSingleplayerLoading() {
        hideMultiplayerLoading();
    }

    export function retryMultiplayerConnection() {
        if (!lastMultiplayerConnection) return;
        const { roomName, password } = lastMultiplayerConnection;
        connectToMultiplayerRoom(roomName, password);
    }

    export function cancelMultiplayerConnection() {
        multiplayerConnectionAttempt++;
        cleanUpPeerConnection();
        mpUnsubscribers.forEach(unsubscribe => unsubscribe());
        mpUnsubscribers = [];
        isMultiplayer = false;
        currentMpRoom = null;
        closeChat();
        const chatContainer = document.getElementById('mp-chat-container');
        if (chatContainer) chatContainer.classList.add('hidden');
        const chatMessages = document.getElementById('mp-chat-messages');
        if (chatMessages) chatMessages.innerHTML = '';
        chatSeenMessageIds = new Set();
        updateTutorialUI();
        hideMultiplayerLoading();
        document.getElementById('shared-menu-bg').classList.remove('hidden');
        showMainMenu();
    }

    export async function connectToMultiplayerRoom(roomName, password, preserveLocalHostState = false, isHost = false) {
        const connectionAttempt = ++multiplayerConnectionAttempt;
        lastMultiplayerConnection = { roomName, password };
        showMultiplayerLoading(roomName);
        if (!await ensureFirebase()) {
            if (connectionAttempt === multiplayerConnectionAttempt) cancelMultiplayerConnection();
            return;
        }
        
        isMultiplayer = true; currentMpRoom = roomName; currentDifficulty = 'normal';
        mpPeerIds = new Set([window.user.uid]);
        lastWorldSyncTime = 0; lastWorldStateTimestamp = 0; pendingDropRequest = null;
        isSleeping = false; sleepWakeVersion = 0;
        document.getElementById('mp-room-display').innerText = currentMpWorldName || roomName;
        document.getElementById('room-indicator').classList.remove('hidden');
        document.getElementById('btn-quit-to-menu').innerText = "Disconnect / Quit to Title";
        
        const { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, getDocs } = window.fbModules;
        const roomRef = doc(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'rooms', roomName);
        
        try {
            setMultiplayerLoadingStatus('Checking room details', 28);
            let roomSnap = await getDoc(roomRef);
            if (connectionAttempt !== multiplayerConnectionAttempt) return;
            if (!roomSnap.exists() || roomSnap.data().passwordHash !== password) throw new Error('Room not found or password invalid');
            let roomData = roomSnap.data();
            if (roomData.gameVersion !== GAME_VERSION || roomData.gameBuild !== GAME_BUILD) {
                throw new Error(`Incompatible version: World is v${roomData.gameVersion || 'older'} (${roomData.gameBuild || 'legacy'}), but client is v${GAME_VERSION} (${GAME_BUILD}).`);
            }
            let targetSeed = roomData.seed;
            currentMpWorldName = roomData.worldName || roomName;
            currentDifficulty = roomData.difficulty || 'normal';
            keepInventory = currentDifficulty !== 'hardcore' && roomData.keepInventory === true;
            currentWorldAchievementsEnabled = (roomData.starterItems !== true && roomData.keepInventory !== true && roomData.achievementsEnabled !== false);
            timeOfDay = roomData.timeOfDay ?? 0.2;
            let targetSize = roomData.worldSize || (roomData.worldWidth > 700 ? 'big' : 'small');
            setWorldDimensions(targetSize);
            document.getElementById('mp-room-display').innerText = currentMpWorldName;
            
            if (!preserveLocalHostState) {
                if (roomData.hasCustomWorld) {
                    setMultiplayerLoadingStatus('Downloading custom world', 44);
                    let customWorldRef = doc(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'multiplayer_custom_worlds', roomName);
                    let cwSnap = await getDoc(customWorldRef);
                    if (!cwSnap.exists()) {
                        let legacyWorldStateRef = doc(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'multiplayer_world_states', roomName);
                        cwSnap = await getDoc(legacyWorldStateRef);
                    }
                    const cwData = cwSnap.exists() ? cwSnap.data() : null;

                    if (cwData && cwData.isChunked) {
                        setMultiplayerLoadingStatus('Downloading world chunks', 46);
                        world = Array.from({ length: WORLD_WIDTH }, () => Array(WORLD_HEIGHT).fill(IDS.AIR));
                        bgWorld = Array.from({ length: WORLD_WIDTH }, () => Array(WORLD_HEIGHT).fill(IDS.AIR));
                        
                        const chunksSnap = await getDocs(collection(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'world_chunks_' + roomName));
                        setMultiplayerLoadingStatus('Reconstructing terrain', 56);
                        chunksSnap.forEach(chunkDoc => {
                            const cData = chunkDoc.data();
                            if (cData && Number.isInteger(cData.cx) && Number.isInteger(cData.cy)) {
                                decompressChunkInto(cData.rle, world, cData.cx * MP_CHUNK_SIZE, cData.cy * MP_CHUNK_SIZE, MP_CHUNK_SIZE, MP_CHUNK_SIZE, WORLD_WIDTH, WORLD_HEIGHT);
                                if (cData.bgRle) {
                                    decompressChunkInto(cData.bgRle, bgWorld, cData.cx * MP_CHUNK_SIZE, cData.cy * MP_CHUNK_SIZE, MP_CHUNK_SIZE, MP_CHUNK_SIZE, WORLD_WIDTH, WORLD_HEIGHT);
                                }
                            }
                        });

                        if (Array.isArray(cwData.nonCollidableTreeWood)) {
                            nonCollidableTreeWood = new Set(cwData.nonCollidableTreeWood);
                        }
                        if (cwData.saplingGrowthQueue) {
                            saplingGrowthQueue = new Map(Object.entries(cwData.saplingGrowthQueue).map(([k, v]) => [k, Number(v)]).filter(([, v]) => Number.isFinite(v)));
                        }
                        if (Array.isArray(cwData.furnaces)) {
                            furnaces = cwData.furnaces;
                        }
                    } else if (cwData && cwData.worldRle) {
                        world = decompressWorld(cwData.worldRle, WORLD_WIDTH, WORLD_HEIGHT);
                        if (cwData.bgWorldRle) {
                            bgWorld = decompressWorld(cwData.bgWorldRle, WORLD_WIDTH, WORLD_HEIGHT);
                        } else {
                            bgWorld = Array.from({ length: WORLD_WIDTH }, () => Array(WORLD_HEIGHT).fill(IDS.AIR));
                        }
                        if (Array.isArray(cwData.nonCollidableTreeWood)) {
                            nonCollidableTreeWood = new Set(cwData.nonCollidableTreeWood);
                        }
                        if (cwData.saplingGrowthQueue) {
                            saplingGrowthQueue = new Map(Object.entries(cwData.saplingGrowthQueue).map(([k, v]) => [k, Number(v)]).filter(([, v]) => Number.isFinite(v)));
                        }
                        if (Array.isArray(cwData.furnaces)) {
                            furnaces = cwData.furnaces;
                        }
                    } else {
                        generateWorld(targetSeed);
                    }
                } else {
                    setMultiplayerLoadingStatus('Generating world', 46);
                    generateWorld(targetSeed);
                }

                surfaceHeights = new Array(WORLD_WIDTH);
                const nonGround = new Set([IDS.AIR, IDS.LEAVES, IDS.WOOD, IDS.TORCH, IDS.SAPLING, IDS.SHORT_GRASS, IDS.TALL_GRASS, IDS.FLOWER_RED, IDS.FLOWER_YELLOW, IDS.DOOR_OPEN, IDS.DOOR_OPEN_TOP]);
                for (let x = 0; x < WORLD_WIDTH; x++) {
                    let surfY = WORLD_HEIGHT - 1;
                    for (let y = 0; y < WORLD_HEIGHT; y++) {
                        let b = world[x]?.[y];
                        if (b !== undefined && !nonGround.has(b)) {
                            surfY = y;
                            break;
                        }
                    }
                    surfaceHeights[x] = surfY;
                }
            }

            ensureTreeWoodNonCollidable();
            
            // Multiplayer Chat setup
            initChatEvents();
            chatSeenMessageIds = new Set();
            const chatMessagesContainer = document.getElementById('mp-chat-messages');
            if (chatMessagesContainer) chatMessagesContainer.innerHTML = '';
            document.getElementById('mp-chat-container')?.classList.remove('hidden');
            
            if (!preserveLocalHostState) {
                setMultiplayerLoadingStatus('Restoring player', 60);
                const spawn = getInitialSpawnPoint();
                player.x = spawn.x; player.y = spawn.y;
                player.fallStartY = spawn.y;
                player.isGrounded = true;
                caveSkyOpacity = getPlayerCaveSkyOpacity();
                player.health = player.maxHealth; player.hunger = 20; player.exhaustion = 0; player.oxygen = player.maxOxygen;
                player.isDead = false; player.vy = 0; player.vx = 0; player.damageCooldown = 60;
                entities = []; remotePlayers = {};
                if (!Array.isArray(furnaces)) furnaces = [];
                inventory.fill(null);
                equippedArmor = [null, null, null, null];
                if (roomData.starterItems !== false) {
                    giveItem(IDS.WOOD_AXE, 1); giveItem(IDS.WOOD_PICKAXE, 1); giveItem(IDS.WOOD, 16); giveItem(IDS.COOKED_PORKCHOP, 10); giveItem(IDS.TORCH, 32);
                }
                camera.x = player.x + player.width / 2 - canvas.width / 2;
                camera.y = player.y + player.height / 2 - canvas.height / 2;
                camera.x = Math.max(-canvas.width / 3, Math.min(camera.x, WORLD_WIDTH * TILE_SIZE - canvas.width + canvas.width / 3));
                camera.y = Math.max(0, Math.min(camera.y, WORLD_HEIGHT * TILE_SIZE - canvas.height));
            } else {
                remotePlayers = {};
                caveSkyOpacity = getPlayerCaveSkyOpacity();
                player.damageCooldown = 60;
                player.isDead = false;
            }

            // WebRTC Signaling Sequence
            if (isHost) {
                // HOST: Listen for Guest's SDP Answer
                setMultiplayerLoadingStatus('Waiting for guest connection', 75);
                let unAnswer = onSnapshot(roomRef, snapshot => {
                    const data = snapshot.data();
                    if (peerConnection && !peerConnection.currentRemoteDescription && data && data.answer) {
                        const answerDescription = new RTCSessionDescription(data.answer);
                        peerConnection.setRemoteDescription(answerDescription).catch(err => console.error("Host setRemoteDescription error:", err));
                    }
                });
                mpUnsubscribers.push(unAnswer);

                // HOST: Listen for Guest's ICE Candidates
                let unGuestCand = onSnapshot(collection(roomRef, 'guestCandidates'), snapshot => {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            const cData = change.doc.data();
                            if (cData && peerConnection) {
                                const candidate = new RTCIceCandidate(cData);
                                peerConnection.addIceCandidate(candidate).catch(err => console.error("Host addIceCandidate error:", err));
                            }
                        }
                    });
                });
                mpUnsubscribers.push(unGuestCand);

                // Host enters game world immediately while waiting for peers
                setTimeout(() => {
                    if (connectionAttempt !== multiplayerConnectionAttempt) return;
                    setMultiplayerLoadingStatus('Ready', 100);
                    hideMultiplayerLoading();
                    document.getElementById('hud').style.display = 'block';
                    document.getElementById('gameCanvas').classList.remove('hidden');
                    STATE = 'PLAYING'; updateUI(); updateHealthUI(); updateHungerUI(); updateTimeUI(); updateTutorialUI(); updateArmorUI(); updateHudArmorBar();
                    broadcastPlayerState(true);
                    lastAutosaveTimestamp = Date.now();
                    showToast("Hosting " + currentMpWorldName + ". Waiting for players...");
                }, 250);

            } else {
                // GUEST: Initialize WebRTC PeerConnection
                cleanUpPeerConnection();
                peerConnection = new RTCPeerConnection(rtcConfig);
                isWebRTCHost = false;

                // 1. Listen for the Host's Data Channel
                peerConnection.addEventListener('datachannel', event => {
                    gameDataChannel = event.channel;
                    setupDataChannelListeners(gameDataChannel);
                });

                // 2. Gather Guest ICE Candidates
                peerConnection.addEventListener('icecandidate', event => {
                    if (event.candidate) {
                        const candidateRef = doc(collection(roomRef, 'guestCandidates'));
                        setDoc(candidateRef, event.candidate.toJSON()).catch(e => console.error("Guest ICE push error", e));
                    }
                });

                // 3. Read Host Offer and Create Answer
                if (!roomData.offer) throw new Error("Host connection offer not found.");
                setMultiplayerLoadingStatus('Connecting peer handshake', 72);
                await peerConnection.setRemoteDescription(new RTCSessionDescription(roomData.offer));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);

                // 4. Send Answer back to Host
                await updateDoc(roomRef, { answer: { type: answer.type, sdp: answer.sdp } });

                // 5. Listen for Host's ICE Candidates
                let unHostCand = onSnapshot(collection(roomRef, 'hostCandidates'), snapshot => {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            const cData = change.doc.data();
                            if (cData && peerConnection) {
                                const candidate = new RTCIceCandidate(cData);
                                peerConnection.addIceCandidate(candidate).catch(err => console.error("Guest addIceCandidate error:", err));
                            }
                        }
                    });
                });
                mpUnsubscribers.push(unHostCand);
                setMultiplayerLoadingStatus('Establishing WebRTC data channel', 88);
            }

        } catch(e) {
            console.error("Multiplayer join error", e);
            cleanUpPeerConnection();
            mpUnsubscribers.forEach(unsubscribe => unsubscribe());
            mpUnsubscribers = [];
            isMultiplayer = false;
            currentMpRoom = null;
            showMultiplayerLoadingError(e.message || "Error joining server.");
        }
    }


    export function openPublishMultiplayerModal() {
        let savedWorlds = getSavedWorlds();
        let wInfo = savedWorlds.find(w => w.id === currentWorldId);
        let worldName = wInfo?.name || "Singleplayer World";
        document.getElementById('publish-mp-world-name').value = worldName;
        document.getElementById('publish-mp-password').value = "";
        document.getElementById('publish-mp-backup-copy').checked = true;
        document.getElementById('publish-multiplayer-modal').classList.remove('hidden');
        document.getElementById('publish-mp-password').focus();
    }

    export function closePublishMultiplayerModal() {
        document.getElementById('publish-multiplayer-modal').classList.add('hidden');
    }

    export async function confirmPublishToMultiplayer() {
        let worldName = document.getElementById('publish-mp-world-name').value.trim() || "Multiplayer World";
        let password = document.getElementById('publish-mp-password').value.trim();
        let makeBackup = document.getElementById('publish-mp-backup-copy').checked;

        if (!/^\d{4,}$/.test(password)) {
            showToast("Password must contain at least 4 digits.");
            return;
        }

        closePublishMultiplayerModal();
        document.getElementById('pause-menu').classList.add('hidden');

        // 1. Save current world first so the latest snapshot is up to date
        saveCurrentWorld();

        // 2. Create a Singleplayer backup copy if requested
        if (makeBackup && currentWorldId) {
            try {
                let worlds = getSavedWorlds();
                let currentInfo = worlds.find(w => w.id === currentWorldId);
                let rawSave = localStorage.getItem('swc_data_' + currentWorldId);
                if (currentInfo && rawSave) {
                    let backupId = 'world_' + Date.now() + '_backup';
                    let backupInfo = Object.assign({}, currentInfo, {
                        id: backupId,
                        name: currentInfo.name + " (Backup)",
                        lastPlayed: Date.now()
                    });
                    worlds.push(backupInfo);
                    saveWorldsList(worlds);
                    localStorage.setItem('swc_data_' + backupId, rawSave);
                    showToast("Backup copy saved to Singleplayer worlds.");
                }
            } catch(backupErr) {
                console.error("Backup save failed", backupErr);
            }
        }

        // 3. Prepare Multiplayer Room in Firebase & WebRTC Host
        showMultiplayerLoading(worldName);
        if (!await ensureFirebase()) {
            hideMultiplayerLoading();
            showToast("Firebase connection unavailable.");
            return;
        }

        try {
            setMultiplayerLoadingStatus('Initializing multiplayer room', 20);
            let roomName = 'room_' + window.user.uid + '_' + Date.now();
            let passwordHash = await hashRoomPassword(password);
            const { doc, setDoc, collection } = window.fbModules;
            const roomRef = doc(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'rooms', roomName);

            // WebRTC Host Setup
            cleanUpPeerConnection();
            peerConnection = new RTCPeerConnection(rtcConfig);
            isWebRTCHost = true;

            gameDataChannel = peerConnection.createDataChannel('webcraft2d_sync', {
                ordered: false,
                maxRetransmits: 0
            });
            setupDataChannelListeners(gameDataChannel);

            peerConnection.addEventListener('icecandidate', event => {
                if (event.candidate) {
                    const candidateRef = doc(collection(roomRef, 'hostCandidates'));
                    setDoc(candidateRef, event.candidate.toJSON()).catch(e => console.error("Host ICE push error", e));
                }
            });

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            // Room doc with WebRTC SDP Offer
            await setDoc(roomRef, {
                worldName,
                gameMode: 'survival',
                minigameType: null,
                difficulty: currentDifficulty,
                worldSize: currentWorldSize,
                worldWidth: WORLD_WIDTH,
                worldHeight: WORLD_HEIGHT,
                starterItems: false,
                keepInventory: keepInventory,
                achievementsEnabled: currentWorldAchievementsEnabled,
                passwordHash,
                seed: (Number.isFinite(mapSeed) ? mapSeed : Math.floor(Math.random() * 100000)),
                timeOfDay,
                dayCount,
                frameCount,
                gameVersion: GAME_VERSION,
                gameBuild: GAME_BUILD,
                createdAt: Date.now(),
                ownerId: window.user.uid,
                status: 'open',
                hasCustomWorld: true,
                offer: { type: offer.type, sdp: offer.sdp }
            });

            // Custom world terrain chunks & metadata
            ensureTreeWoodNonCollidable();
            const numChunksX = Math.ceil(WORLD_WIDTH / MP_CHUNK_SIZE);
            const numChunksY = Math.ceil(WORLD_HEIGHT / MP_CHUNK_SIZE);
            const chunkDocs = [];
            for (let cx = 0; cx < numChunksX; cx++) {
                for (let cy = 0; cy < numChunksY; cy++) {
                    const startX = cx * MP_CHUNK_SIZE;
                    const startY = cy * MP_CHUNK_SIZE;
                    chunkDocs.push({
                        cx, cy,
                        rle: compressChunk(world, startX, startY, MP_CHUNK_SIZE, MP_CHUNK_SIZE),
                        bgRle: compressChunk(bgWorld, startX, startY, MP_CHUNK_SIZE, MP_CHUNK_SIZE)
                    });
                }
            }

            const CHUNK_BATCH_SIZE = 20;
            for (let i = 0; i < chunkDocs.length; i += CHUNK_BATCH_SIZE) {
                const batch = chunkDocs.slice(i, i + CHUNK_BATCH_SIZE);
                const progress = 25 + Math.round((i / chunkDocs.length) * 20);
                setMultiplayerLoadingStatus(`Uploading terrain chunks (${Math.min(i + CHUNK_BATCH_SIZE, chunkDocs.length)}/${chunkDocs.length})`, progress);
                await Promise.all(batch.map(c => 
                    setDoc(doc(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'world_chunks_' + roomName, `${c.cx}_${c.cy}`), c)
                ));
            }

            setMultiplayerLoadingStatus('Saving world metadata', 48);
            await setDoc(doc(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'multiplayer_custom_worlds', roomName), {
                isChunked: true,
                chunkSize: MP_CHUNK_SIZE,
                numChunksX,
                numChunksY,
                worldWidth: WORLD_WIDTH,
                worldHeight: WORLD_HEIGHT,
                nonCollidableTreeWood: [...nonCollidableTreeWood],
                saplingGrowthQueue: Object.fromEntries(saplingGrowthQueue),
                furnaces: furnaces,
                timestamp: Date.now()
            });

            // Connect and transition smoothly to multiplayer as Host
            await connectToMultiplayerRoom(roomName, passwordHash, true, true /* isHost */);
        } catch(err) {
            console.error("Publish to multiplayer failed", err);
            cleanUpPeerConnection();
            hideMultiplayerLoading();
            showToast("Failed to publish world: " + (err.message || "Network error"));
        }
    }
    

// Global Window Bridge for cross-module & HTML event compatibility
try { if (typeof app !== "undefined") window.app = app; } catch(e) {}
try { if (typeof appId !== "undefined") window.appId = appId; } catch(e) {}
try { if (typeof applyMultiplayerBlockDiff !== "undefined") window.applyMultiplayerBlockDiff = applyMultiplayerBlockDiff; } catch(e) {}
try { if (typeof applyMultiplayerWorldState !== "undefined") window.applyMultiplayerWorldState = applyMultiplayerWorldState; } catch(e) {}
try { if (typeof broadcastDataPacket !== "undefined") window.broadcastDataPacket = broadcastDataPacket; } catch(e) {}
try { if (typeof broadcastPlayerState !== "undefined") window.broadcastPlayerState = broadcastPlayerState; } catch(e) {}
try { if (typeof cancelMultiplayerConnection !== "undefined") window.cancelMultiplayerConnection = cancelMultiplayerConnection; } catch(e) {}
try { if (typeof cleanUpPeerConnection !== "undefined") window.cleanUpPeerConnection = cleanUpPeerConnection; } catch(e) {}
try { if (typeof closeMultiplayerMenu !== "undefined") window.closeMultiplayerMenu = closeMultiplayerMenu; } catch(e) {}
try { if (typeof closePublishMultiplayerModal !== "undefined") window.closePublishMultiplayerModal = closePublishMultiplayerModal; } catch(e) {}
try { if (typeof closeRoomDialogs !== "undefined") window.closeRoomDialogs = closeRoomDialogs; } catch(e) {}
try { if (typeof confirmPublishToMultiplayer !== "undefined") window.confirmPublishToMultiplayer = confirmPublishToMultiplayer; } catch(e) {}
try { if (typeof connectToMultiplayerRoom !== "undefined") window.connectToMultiplayerRoom = connectToMultiplayerRoom; } catch(e) {}
try { if (typeof createMultiplayerRoom !== "undefined") window.createMultiplayerRoom = createMultiplayerRoom; } catch(e) {}
try { if (typeof currentAutosaveBroadcastId !== "undefined") window.currentAutosaveBroadcastId = currentAutosaveBroadcastId; } catch(e) {}
try { if (typeof damageRemotePlayer !== "undefined") window.damageRemotePlayer = damageRemotePlayer; } catch(e) {}
try { if (typeof deserializeDroppedItem !== "undefined") window.deserializeDroppedItem = deserializeDroppedItem; } catch(e) {}
try { if (typeof deserializeMultiplayerEntity !== "undefined") window.deserializeMultiplayerEntity = deserializeMultiplayerEntity; } catch(e) {}
try { if (typeof dropItemForWorld !== "undefined") window.dropItemForWorld = dropItemForWorld; } catch(e) {}
try { if (typeof ensureFirebase !== "undefined") window.ensureFirebase = ensureFirebase; } catch(e) {}
try { if (typeof fbSignInWithCustomToken !== "undefined") window.fbSignInWithCustomToken = fbSignInWithCustomToken; } catch(e) {}
try { if (typeof firebaseConfig !== "undefined") window.firebaseConfig = firebaseConfig; } catch(e) {}
try { if (typeof gameDataChannel !== "undefined") window.gameDataChannel = gameDataChannel; } catch(e) {}
try { if (typeof hashRoomPassword !== "undefined") window.hashRoomPassword = hashRoomPassword; } catch(e) {}
try { if (typeof hideMultiplayerLoading !== "undefined") window.hideMultiplayerLoading = hideMultiplayerLoading; } catch(e) {}
try { if (typeof hideSingleplayerLoading !== "undefined") window.hideSingleplayerLoading = hideSingleplayerLoading; } catch(e) {}
try { if (typeof initFirebaseSdk !== "undefined") window.initFirebaseSdk = initFirebaseSdk; } catch(e) {}
try { if (typeof isMultiplayerAuthority !== "undefined") window.isMultiplayerAuthority = isMultiplayerAuthority; } catch(e) {}
try { if (typeof isWebRTCHost !== "undefined") window.isWebRTCHost = isWebRTCHost; } catch(e) {}
try { if (typeof joinSelectedRoom !== "undefined") window.joinSelectedRoom = joinSelectedRoom; } catch(e) {}
try { if (typeof lastFluidSyncTime !== "undefined") window.lastFluidSyncTime = lastFluidSyncTime; } catch(e) {}
try { if (typeof lastMultiplayerConnection !== "undefined") window.lastMultiplayerConnection = lastMultiplayerConnection; } catch(e) {}
try { if (typeof lastReceivedAutosaveId !== "undefined") window.lastReceivedAutosaveId = lastReceivedAutosaveId; } catch(e) {}
try { if (typeof lastSentLocalPlayerPos !== "undefined") window.lastSentLocalPlayerPos = lastSentLocalPlayerPos; } catch(e) {}
try { if (typeof loadAvailableRooms !== "undefined") window.loadAvailableRooms = loadAvailableRooms; } catch(e) {}
try { if (typeof mpCurrentFilter !== "undefined") window.mpCurrentFilter = mpCurrentFilter; } catch(e) {}
try { if (typeof mpCurrentGameMode !== "undefined") window.mpCurrentGameMode = mpCurrentGameMode; } catch(e) {}
try { if (typeof mpUnsubscribers !== "undefined") window.mpUnsubscribers = mpUnsubscribers; } catch(e) {}
try { if (typeof multiplayerConnectionAttempt !== "undefined") window.multiplayerConnectionAttempt = multiplayerConnectionAttempt; } catch(e) {}
try { if (typeof openMultiplayerMenu !== "undefined") window.openMultiplayerMenu = openMultiplayerMenu; } catch(e) {}
try { if (typeof openPublishMultiplayerModal !== "undefined") window.openPublishMultiplayerModal = openPublishMultiplayerModal; } catch(e) {}
try { if (typeof peerConnection !== "undefined") window.peerConnection = peerConnection; } catch(e) {}
try { if (typeof pendingDropRequest !== "undefined") window.pendingDropRequest = pendingDropRequest; } catch(e) {}
try { if (typeof processRemoteDropRequests !== "undefined") window.processRemoteDropRequests = processRemoteDropRequests; } catch(e) {}
try { if (typeof processRemotePickupRequests !== "undefined") window.processRemotePickupRequests = processRemotePickupRequests; } catch(e) {}
try { if (typeof resetMultiplayerLoadingScreen !== "undefined") window.resetMultiplayerLoadingScreen = resetMultiplayerLoadingScreen; } catch(e) {}
try { if (typeof retryMultiplayerConnection !== "undefined") window.retryMultiplayerConnection = retryMultiplayerConnection; } catch(e) {}
try { if (typeof rtcConfig !== "undefined") window.rtcConfig = rtcConfig; } catch(e) {}
try { if (typeof selectMpDifficulty !== "undefined") window.selectMpDifficulty = selectMpDifficulty; } catch(e) {}
try { if (typeof selectMpGameMode !== "undefined") window.selectMpGameMode = selectMpGameMode; } catch(e) {}
try { if (typeof serializeDroppedItem !== "undefined") window.serializeDroppedItem = serializeDroppedItem; } catch(e) {}
try { if (typeof serializeMultiplayerEntity !== "undefined") window.serializeMultiplayerEntity = serializeMultiplayerEntity; } catch(e) {}
try { if (typeof setMpFilter !== "undefined") window.setMpFilter = setMpFilter; } catch(e) {}
try { if (typeof setMultiplayerLoadingStatus !== "undefined") window.setMultiplayerLoadingStatus = setMultiplayerLoadingStatus; } catch(e) {}
try { if (typeof setupDataChannelListeners !== "undefined") window.setupDataChannelListeners = setupDataChannelListeners; } catch(e) {}
try { if (typeof showMultiplayerLoading !== "undefined") window.showMultiplayerLoading = showMultiplayerLoading; } catch(e) {}
try { if (typeof showMultiplayerLoadingError !== "undefined") window.showMultiplayerLoadingError = showMultiplayerLoadingError; } catch(e) {}
try { if (typeof showSingleplayerLoading !== "undefined") window.showSingleplayerLoading = showSingleplayerLoading; } catch(e) {}
try { if (typeof spawnDroppedItem !== "undefined") window.spawnDroppedItem = spawnDroppedItem; } catch(e) {}
try { if (typeof switchMpTab !== "undefined") window.switchMpTab = switchMpTab; } catch(e) {}
try { if (typeof syncBlock !== "undefined") window.syncBlock = syncBlock; } catch(e) {}
try { if (typeof syncFluidState !== "undefined") window.syncFluidState = syncFluidState; } catch(e) {}
try { if (typeof syncLocalPlayerState !== "undefined") window.syncLocalPlayerState = syncLocalPlayerState; } catch(e) {}
try { if (typeof syncMultiplayerWorldState !== "undefined") window.syncMultiplayerWorldState = syncMultiplayerWorldState; } catch(e) {}
try { if (typeof tryCompleteMultiplayerSleep !== "undefined") window.tryCompleteMultiplayerSleep = tryCompleteMultiplayerSleep; } catch(e) {}
