// =============================================================================
// WEBCRAFT 2D - CORE STATE MODULE (js/core/state.js)
// Zero-dependency leaf module defining global mutable game simulation state
// references, collections, input maps, and authoritative mutator functions.
// =============================================================================

export let STATE = 'MENU';
export let timeOfDay = 0;
export let dayCount = 1;
export let frameCount = 0;
export let introPhase = 0;
export let introTimer = null;
export let currentWorldId = null;
export let selectedDiffChoice = 'normal';
export let currentDifficulty = 'normal';
export let settingsPreviousState = 'MENU';
export let gloomDreadTimer = 0;

export let mouse = { x: 0, y: 0, clientX: 0, clientY: 0, down: false, rightDown: false, worldX: 0, worldY: 0 };
export let keys = {};

export let world = null;
export let bgWorld = null;
export let camera = { x: 0, y: 0 };
export let player = null;

export let inventory = new Array(28).fill(null);
export let hotbarSize = 9;
export let selectedHotbarIndex = 0;
export let equippedArmor = [null, null, null, null];
export let isInventoryOpen = false;
export let hotbarWheelLockUntil = 0;
export let heldItemIndex = -1;
export let heldItemObj = null;
export let heldItemDraggedOutside = false;
export let miningTarget = { x: -1, y: -1, progress: 0, toolId: null, slotIndex: 0 };

export let entities = [];
export let mobs = [];
export let droppedItems = [];
export let activeProjectiles = [];
export let fallingBlocks = [];
export let particles = [];
export let floatingTexts = [];
export let clouds = [];
export let lightMap = [];

export let isMultiplayer = false;
export let currentMpRoom = null;
export let currentMpWorldName = null;
export let playerName = typeof localStorage !== 'undefined' ? localStorage.getItem('swc_player_name') || '' : '';
export let remotePlayers = {};
export let isSleeping = false;
export let sleepWakeVersion = 0;
export let mpPeerIds = new Set();
export let lastWorldSyncTime = 0;
export let lastWorldStateTimestamp = 0;
export let lastDamageEventId = null;
export let mpPlayerSyncPending = false;
export let mpPlayerSyncQueued = false;
export let mpPlayerSyncPendingStartTime = 0;
export let mpWorldSyncPending = false;
export let lastSyncTime = 0;
export let lastSentSkinData = null;
export let lastFluidStateTimestamp = 0;

export let WORLD_WIDTH = 1280;
export let WORLD_HEIGHT = 320;
export let currentWorldSize = 'small';
export let worldBiomes = null;

export function setWorldDimensions(size, explicitWidth, explicitHeight) {
    currentWorldSize = (size === 'big' || (explicitWidth && explicitWidth > 1500)) ? 'big' : 'small';
    if (explicitWidth && explicitHeight) {
        WORLD_WIDTH = explicitWidth;
        WORLD_HEIGHT = explicitHeight;
    } else if (currentWorldSize === 'big') {
        WORLD_WIDTH = 2560;
        WORLD_HEIGHT = 512;
    } else {
        WORLD_WIDTH = 1280;
        WORLD_HEIGHT = 320;
    }
    if (typeof window !== 'undefined') {
        window.currentWorldSize = currentWorldSize;
        window.WORLD_WIDTH = WORLD_WIDTH;
        window.WORLD_HEIGHT = WORLD_HEIGHT;
        if (typeof window.isOffscreenMapDirty !== 'undefined') window.isOffscreenMapDirty = true;
    }
}

export function getMaxAnimals() {
    if (isMultiplayer) {
        return currentWorldSize === 'big' ? 40 : 30;
    } else {
        return 40;
    }
}

export let physicsAccumulator = 0;
export let lastFrameTime = typeof performance !== 'undefined' ? performance.now() : 0;
export let lastRenderTime = 0;
export let currentFps = 60;
export let frameDeltaMs = 16.6;

export let sleepStartTime = 0;
export let sleepTransitionMs = 3000;

export let isBackgroundBuildMode = false;
export let bgBuildDarknessAlpha = 0;
export let underwaterScreenAlpha = 0;
export let underwaterDeepFactor = 0;

export let surfaceHeights = [];
export let nonCollidableTreeWood = new Set();
export function setEngineNonCollidableTreeWood(newSet) {
    nonCollidableTreeWood = (newSet instanceof Set) ? newSet : new Set(newSet || []);
    if (typeof window !== 'undefined') {
        window.nonCollidableTreeWood = nonCollidableTreeWood;
    }
    return nonCollidableTreeWood;
}

export let leafDecayQueue = new Map();
export let treeDecayClusters = new Map();
export let saplingGrowthQueue = new Map();
export let cropGrowthQueue = new Map();
export let saplingBlockedWarnings = new Set();
export let dirtToGrassQueue = new Map();
export let snowRegrowthQueue = new Map();
export let fluids = new Map();
export let fluidTick = 0;
export let fluidWakeQueue = new Set();
export let attackAnimationTimer = 0;
export let furnaces = [];
export let openedFurnace = null;
export let chests = new Map();
export let openedChest = null;
export let jukeboxes = [];
export let signs = new Map();

export function setEngineSigns(m) {
    signs = m instanceof Map ? m : new Map(Object.entries(m || {}));
    if (typeof window !== 'undefined') window.signs = signs;
}

// Authoritative State Mutator Functions
export function setEngineWorld(newWorld) { world = newWorld; if (typeof window !== 'undefined') window.world = newWorld; }
export function setEngineBgWorld(newBgWorld) { bgWorld = newBgWorld; if (typeof window !== 'undefined') window.bgWorld = newBgWorld; }
export function setEnginePlayer(newPlayer) { player = newPlayer; if (typeof window !== 'undefined') window.player = newPlayer; }
export function setEngineSurfaceHeights(newHeights) { surfaceHeights = newHeights; if (typeof window !== 'undefined') window.surfaceHeights = newHeights; }
export function setEngineInventory(newInv) { inventory = newInv; if (typeof window !== 'undefined') window.inventory = newInv; }
export function setEngineEquippedArmor(newArmor) { equippedArmor = newArmor; if (typeof window !== 'undefined') window.equippedArmor = newArmor; }
export function setEngineEntities(newEntities) { entities = newEntities; if (typeof window !== 'undefined') window.entities = newEntities; }
export function setEngineFluids(newFluids) { fluids = newFluids; if (typeof window !== 'undefined') window.fluids = newFluids; }
export function setEngineFurnaces(newFurnaces) { furnaces = newFurnaces; if (typeof window !== 'undefined') window.furnaces = newFurnaces; }
export function setEngineJukeboxes(newJukeboxes) { jukeboxes = newJukeboxes; if (typeof window !== 'undefined') window.jukeboxes = newJukeboxes; }
export function setEngineChests(newChests) { chests = newChests; if (typeof window !== 'undefined') window.chests = newChests; }
export function setEngineDroppedItems(newDrops) { droppedItems = newDrops; if (typeof window !== 'undefined') window.droppedItems = newDrops; }
export function setEngineState(newState) { STATE = newState; if (typeof window !== 'undefined') window.STATE = newState; }
export function setGameState(newState) { STATE = newState; if (typeof window !== 'undefined') window.STATE = newState; }
export function setEngineTimeOfDay(newTime) { timeOfDay = newTime; if (typeof window !== 'undefined') window.timeOfDay = newTime; }
export function setEngineDayCount(newDay) {
    dayCount = newDay;
    if (typeof window !== 'undefined') window.dayCount = newDay;
    if (dayCount >= 10) {
        if (typeof unlockAchievement === 'function') unlockAchievement('immortal_legend');
        else if (typeof window !== 'undefined' && typeof window.unlockAchievement === 'function') window.unlockAchievement('immortal_legend');
    }
    if (typeof renderPinnedAchievementHUD === 'function') renderPinnedAchievementHUD();
    else if (typeof window !== 'undefined' && typeof window.renderPinnedAchievementHUD === 'function') window.renderPinnedAchievementHUD();
}
export function setEngineFrameCount(newFrames) { frameCount = newFrames; if (typeof window !== 'undefined') window.frameCount = newFrames; }
export function setEngineCurrentWorldId(newId) { currentWorldId = newId; if (typeof window !== 'undefined') window.currentWorldId = newId; }
export function setEngineCurrentDifficulty(newDiff) { currentDifficulty = newDiff; if (typeof window !== 'undefined') window.currentDifficulty = newDiff; }
export function setEngineIsMultiplayer(newMp) { isMultiplayer = newMp; if (typeof window !== 'undefined') window.isMultiplayer = newMp; }
export function setEngineCurrentMpRoom(newRoom) { currentMpRoom = newRoom; if (typeof window !== 'undefined') window.currentMpRoom = newRoom; }
export function setEngineCurrentMpWorldName(newName) { currentMpWorldName = newName; if (typeof window !== 'undefined') window.currentMpWorldName = newName; }
export function setEngineRemotePlayers(newPlayers) { remotePlayers = newPlayers; if (typeof window !== 'undefined') window.remotePlayers = newPlayers; }
export function setEngineIsSleeping(newSleeping) { isSleeping = newSleeping; if (typeof window !== 'undefined') window.isSleeping = newSleeping; }
export function setEngineSleepStartTime(newTime) { sleepStartTime = newTime; if (typeof window !== 'undefined') window.sleepStartTime = newTime; }
export function setEngineIsBackgroundBuildMode(newMode) { isBackgroundBuildMode = newMode; if (typeof window !== 'undefined') window.isBackgroundBuildMode = newMode; }
export function setEngineIsInventoryOpen(newOpen) { isInventoryOpen = newOpen; if (typeof window !== 'undefined') window.isInventoryOpen = newOpen; }
export function setEngineCropGrowthQueue(newQueue) { cropGrowthQueue = newQueue; if (typeof window !== 'undefined') window.cropGrowthQueue = newQueue; }
export function setEngineSaplingGrowthQueue(newQueue) { saplingGrowthQueue = newQueue; if (typeof window !== 'undefined') window.saplingGrowthQueue = newQueue; }
export function setEngineDirtToGrassQueue(newQueue) { dirtToGrassQueue = newQueue; if (typeof window !== 'undefined') window.dirtToGrassQueue = newQueue; }
export function setEngineSnowRegrowthQueue(newQueue) { snowRegrowthQueue = newQueue; if (typeof window !== 'undefined') window.snowRegrowthQueue = newQueue; }
export function setSelectedHotbarIndex(idx) {
    if (selectedHotbarIndex !== idx) {
        if (miningTarget) {
            miningTarget.progress = 0;
            miningTarget.toolId = null;
            miningTarget.slotIndex = idx;
        }
        if (typeof window !== 'undefined' && window.miningTarget) {
            window.miningTarget.progress = 0;
            window.miningTarget.toolId = null;
            window.miningTarget.slotIndex = idx;
        }
    }
    selectedHotbarIndex = idx;
    if (typeof window !== 'undefined') window.selectedHotbarIndex = idx;
}
export function setAttackAnimationTimer(t) { attackAnimationTimer = t; if (typeof window !== 'undefined') window.attackAnimationTimer = t; }
export function setEngineWorldBiomes(newBiomes) { worldBiomes = newBiomes; if (typeof window !== 'undefined') window.worldBiomes = newBiomes; }
export function setEngineGloomDreadTimer(val) { gloomDreadTimer = val; if (typeof window !== 'undefined') window.gloomDreadTimer = val; }
export function setEngineFallingBlocks(val) { fallingBlocks = val; if (typeof window !== 'undefined') window.fallingBlocks = val; }
export function setEngineActiveProjectiles(val) { activeProjectiles = val; if (typeof window !== 'undefined') window.activeProjectiles = val; }
export function setEngineOpenedChest(val) { openedChest = val; if (typeof window !== 'undefined') window.openedChest = val; }
export function setEngineFluidTick(val) { fluidTick = val; if (typeof window !== 'undefined') window.fluidTick = val; }
export function setEngineBgBuildDarknessAlpha(val) { bgBuildDarknessAlpha = val; if (typeof window !== 'undefined') window.bgBuildDarknessAlpha = val; }
export function setEngineUnderwaterScreenAlpha(val) { underwaterScreenAlpha = val; if (typeof window !== 'undefined') window.underwaterScreenAlpha = val; }
export function setEngineUnderwaterDeepFactor(val) { underwaterDeepFactor = val; if (typeof window !== 'undefined') window.underwaterDeepFactor = val; }

// Backward compatibility window bindings
if (typeof window !== 'undefined') {
    window.world = world;
    window.bgWorld = bgWorld;
    window.player = player;
    window.camera = camera;
    window.inventory = inventory;
    window.hotbarSize = hotbarSize;
    window.selectedHotbarIndex = selectedHotbarIndex;
    window.equippedArmor = equippedArmor;
    window.entities = entities;
    window.mobs = mobs;
    window.droppedItems = droppedItems;
    window.activeProjectiles = activeProjectiles;
    window.fallingBlocks = fallingBlocks;
    window.particles = particles;
    window.clouds = clouds;
    window.STATE = STATE;
    window.timeOfDay = timeOfDay;
    window.dayCount = dayCount;
    window.frameCount = frameCount;
    window.WORLD_WIDTH = WORLD_WIDTH;
    window.WORLD_HEIGHT = WORLD_HEIGHT;
    window.currentWorldSize = currentWorldSize;
    window.worldBiomes = worldBiomes;
    window.setEngineWorld = setEngineWorld;
    window.setEngineBgWorld = setEngineBgWorld;
    window.setEnginePlayer = setEnginePlayer;
    window.setEngineState = setEngineState;
    window.setGameState = setGameState;
    window.setEngineInventory = setEngineInventory;
    window.setEngineEquippedArmor = setEngineEquippedArmor;
    window.setEngineEntities = setEngineEntities;
    window.setWorldDimensions = setWorldDimensions;
    window.setSelectedHotbarIndex = setSelectedHotbarIndex;
}


export function isMultiplayerAuthority() {
    if (typeof window !== 'undefined' && typeof window.isMultiplayerAuthority === 'function' && window.isMultiplayerAuthority !== isMultiplayerAuthority) {
        return window.isMultiplayerAuthority();
    }
    return true;
}
export { bgWorld as backgroundWorld };
export const setTimeOfDay = setEngineTimeOfDay;
export let timeUI = typeof document !== 'undefined' ? document.getElementById('timeUI') : null;
export let destroyProgress = 0;
export let destroyTarget = null;

