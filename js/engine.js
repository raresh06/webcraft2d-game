// =============================================================================
// WEBCRAFT 2D - ENGINE MODULE (engine.js)
// Canvas Rendering Loop, Player Physics, Block Textures, Collision Math & World Gen
// =============================================================================

    export let STATE = 'MENU';
export let timeOfDay = 0;
export let dayCount = 1;
export let frameCount = 0;
export let showClouds = true;
export let showDebug = false;
export let autoJumpEnabled = true;
export let showHeatShimmer = true;
export let showBiomeGrading = true;
export let showVignette = true;
export let introEnabled = typeof localStorage !== 'undefined' ? localStorage.getItem('swc_intro_enabled') !== 'false' : true;
export let graphicsMode = typeof localStorage !== 'undefined' ? localStorage.getItem('swc_graphics_mode') || 'advanced' : 'advanced';
export let advancedGraphics = (graphicsMode !== 'base');
export let fabulousGraphics = (graphicsMode === 'fabulous');
export let introPhase = 0;
export let introTimer = null;
export let currentWorldId = null;
export let selectedDiffChoice = 'normal';
export let currentDifficulty = 'normal';
export let settingsPreviousState = 'MENU';

export function setEngineGraphicsMode(mode) {
    graphicsMode = mode;
    advancedGraphics = (mode !== 'base');
    fabulousGraphics = (mode === 'fabulous');
    if (typeof window !== 'undefined') {
        window.graphicsMode = mode;
        window.advancedGraphics = advancedGraphics;
        window.fabulousGraphics = fabulousGraphics;
    }
}

export function setEngineSetting(key, val) {
    if (key === 'showClouds') showClouds = val;
    else if (key === 'showDebug') showDebug = val;
    else if (key === 'autoJumpEnabled') autoJumpEnabled = val;
    else if (key === 'showHeatShimmer') showHeatShimmer = val;
    else if (key === 'showBiomeGrading') showBiomeGrading = val;
    else if (key === 'showVignette') showVignette = val;
    else if (key === 'introEnabled') introEnabled = val;
    else if (key === 'graphicsMode') setEngineGraphicsMode(val);
    else if (key === 'accentColor') setEngineAccentColor(val);
    if (typeof window !== 'undefined') window[key] = val;
}

if (typeof window !== 'undefined') {
    window.graphicsMode = graphicsMode;
    window.advancedGraphics = advancedGraphics;
    window.fabulousGraphics = fabulousGraphics;
    window.setEngineGraphicsMode = setEngineGraphicsMode;
    window.setEngineSetting = setEngineSetting;
}

export function showToast(msg, duration) { if (typeof window !== 'undefined' && typeof window.showToast === 'function' && window.showToast !== showToast) return window.showToast(msg, duration); }
export function dropItemForWorld(itemId, x, y, count = 1) { if (typeof window !== 'undefined' && typeof window.dropItemForWorld === 'function' && window.dropItemForWorld !== dropItemForWorld) return window.dropItemForWorld(itemId, x, y, count); }
export function playSound(type, options = {}) { if (typeof window !== 'undefined' && typeof window.playSound === 'function' && window.playSound !== playSound) return window.playSound(type, options); }
export function giveItem(id, amount = 1) { if (typeof window !== 'undefined' && typeof window.giveItem === 'function' && window.giveItem !== giveItem) return window.giveItem(id, amount); return false; }
export function damageSelectedTool(amount = 1) { if (typeof window !== 'undefined' && typeof window.damageSelectedTool === 'function' && window.damageSelectedTool !== damageSelectedTool) return window.damageSelectedTool(amount); }
export function ensureToolDurability(item) { if (typeof window !== 'undefined' && typeof window.ensureToolDurability === 'function' && window.ensureToolDurability !== ensureToolDurability) return window.ensureToolDurability(item); return item; }
export function isTool(id) {
    if (typeof window !== 'undefined' && typeof window.isTool === 'function' && window.isTool !== isTool) return window.isTool(id);
    return [
        IDS.WOOD_PICKAXE, IDS.STONE_PICKAXE, IDS.IRON_PICKAXE, IDS.GOLD_PICKAXE, IDS.DIAMOND_PICKAXE, IDS.ASTRAL_PICKAXE,
        IDS.WOOD_SWORD, IDS.STONE_SWORD, IDS.IRON_SWORD, IDS.GOLD_SWORD, IDS.DIAMOND_SWORD, IDS.ASTRAL_SWORD,
        IDS.WOOD_AXE, IDS.STONE_AXE, IDS.IRON_AXE, IDS.GOLD_AXE, IDS.DIAMOND_AXE, IDS.ASTRAL_AXE,
        IDS.WOOD_SHOVEL, IDS.STONE_SHOVEL, IDS.IRON_SHOVEL, IDS.GOLD_SHOVEL, IDS.DIAMOND_SHOVEL, IDS.ASTRAL_SHOVEL,
        IDS.WOOD_HOE, IDS.STONE_HOE, IDS.IRON_HOE, IDS.GOLD_HOE, IDS.DIAMOND_HOE,
        IDS.KINETIC_SHEARS
    ].includes(id);
}
export function updateArmorUI() { if (typeof window !== 'undefined' && typeof window.updateArmorUI === 'function' && window.updateArmorUI !== updateArmorUI) return window.updateArmorUI(); }
export function updateHealthUI() { if (typeof window !== 'undefined' && typeof window.updateHealthUI === 'function' && window.updateHealthUI !== updateHealthUI) return window.updateHealthUI(); }
export function updateHungerUI() { if (typeof window !== 'undefined' && typeof window.updateHungerUI === 'function' && window.updateHungerUI !== updateHungerUI) return window.updateHungerUI(); }
export function updateOxygenUI(isSubmerged) { if (typeof window !== 'undefined' && typeof window.updateOxygenUI === 'function' && window.updateOxygenUI !== updateOxygenUI) return window.updateOxygenUI(isSubmerged); }
export function updateUI(refreshCrafting) { if (typeof window !== 'undefined' && typeof window.updateUI === 'function' && window.updateUI !== updateUI) return window.updateUI(refreshCrafting); }
export function updateTutorialUI() {}
export function updateHudArmorBar() { if (typeof window !== 'undefined' && typeof window.updateHudArmorBar === 'function' && window.updateHudArmorBar !== updateHudArmorBar) return window.updateHudArmorBar(); }
export function unlockAchievement(id) { if (typeof window !== 'undefined' && typeof window.unlockAchievement === 'function' && window.unlockAchievement !== unlockAchievement) return window.unlockAchievement(id); }
export function damageRemotePlayer(id, amt, isPoison) { if (typeof window !== 'undefined' && typeof window.damageRemotePlayer === 'function' && window.damageRemotePlayer !== damageRemotePlayer) return window.damageRemotePlayer(id, amt, isPoison); }
export function syncBlock(x, y, newId, extraData) { if (typeof window !== 'undefined' && typeof window.syncBlock === 'function' && window.syncBlock !== syncBlock) return window.syncBlock(x, y, newId, extraData); }
export function syncFluidState() { if (typeof window !== 'undefined' && typeof window.syncFluidState === 'function' && window.syncFluidState !== syncFluidState) return window.syncFluidState(); }
export function syncLocalPlayerState(immediate) { if (typeof window !== 'undefined' && typeof window.syncLocalPlayerState === 'function' && window.syncLocalPlayerState !== syncLocalPlayerState) return window.syncLocalPlayerState(immediate); }
export function broadcastDataPacket(packet) { if (typeof window !== 'undefined' && typeof window.broadcastDataPacket === 'function' && window.broadcastDataPacket !== broadcastDataPacket) return window.broadcastDataPacket(packet); }
export function deleteWorld(id, prompt) { if (typeof window !== 'undefined' && typeof window.deleteWorld === 'function' && window.deleteWorld !== deleteWorld) return window.deleteWorld(id, prompt); }
export function spawnDroppedItem(itemId, x, y, count = 1) {
    let dropId = `drop_${(typeof window !== 'undefined' && window.user?.uid) || 'local'}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const DropClass = (typeof ItemDrop !== 'undefined') ? ItemDrop : (typeof window !== 'undefined' ? window.ItemDrop : null);
    if (DropClass) {
        const drop = new DropClass(itemId, x, y, count, dropId);
        droppedItems.push(drop);
        if (typeof window !== 'undefined') {
            window.droppedItems = droppedItems;
        }
        return drop;
    }
}
export function toggleBackgroundBuildMode(mode) { if (typeof window !== 'undefined' && typeof window.toggleBackgroundBuildMode === 'function' && window.toggleBackgroundBuildMode !== toggleBackgroundBuildMode) return window.toggleBackgroundBuildMode(mode); }
export function isMultiplayerAuthority() { if (typeof window !== 'undefined' && typeof window.isMultiplayerAuthority === 'function' && window.isMultiplayerAuthority !== isMultiplayerAuthority) return window.isMultiplayerAuthority(); return true; }
export let currentAccentColor = (typeof window !== 'undefined' && window.currentAccentColor) ? window.currentAccentColor : '#e5a823';
export function setEngineAccentColor(hex) {
    if (!hex) return;
    currentAccentColor = hex;
    if (typeof window !== 'undefined') window.currentAccentColor = hex;
}
export function getAccentPalette(baseHex) {
    const activeHex = baseHex || (typeof window !== 'undefined' && window.currentAccentColor) || currentAccentColor || '#e5a823';
    if (typeof window !== 'undefined' && typeof window.getAccentPalette === 'function' && window.getAccentPalette !== getAccentPalette) {
        return window.getAccentPalette(activeHex);
    }
    const n = parseInt(activeHex.replace('#', ''), 16) || 0xe5a823;
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
    const toHex = (cr, cg, cb) => '#' + [cr, cg, cb].map(x => clamp(x).toString(16).padStart(2, '0')).join('');
    return {
        base: activeHex,
        light: toHex(r + (255 - r) * 0.45, g + (255 - g) * 0.45, b + (255 - b) * 0.45),
        dark: toHex(r * 0.78, g * 0.78, b * 0.78),
        darker: toHex(r * 0.52, g * 0.52, b * 0.52),
        glow: `rgba(${r}, ${g}, ${b}, 0.35)`
    };
}

export let mouse = { x: 0, y: 0, clientX: 0, clientY: 0, down: false, rightDown: false, worldX: 0, worldY: 0 };
export let keys = {};
// player initialized after class Player
export let world = null;
export let bgWorld = null;
export let camera = { x: 0, y: 0 };
export let inventory = new Array(28).fill(null);
export let hotbarSize = 9;
export let selectedHotbarIndex = 0;
export let equippedArmor = [null, null, null, null];
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

export const TILE_SIZE = 40;
export const GRAVITY = 0.45;
export const TERMINAL_VELOCITY = 15;
export const JUMP_FORCE = -8.5;
export const MOVE_SPEED = 3.6;
export const REACH = 4.2;
export const DAY_LENGTH_FRAMES = 60 * 60 * 20; // 72,000 frames = 20 minutes (Minecraft standard day cycle)
export const DAY_LENGTH = 24000;
export const CAVE_SKY_START_TILES = 6;
export const CAVE_SKY_FADE_TILES = 3;
export const SAPLING_GROWTH_DAYS = 2;
export const DIRT_TO_GRASS_DAYS = 1.5;
export const SNOW_REGROWTH_DAYS = 1.0;
export const BED_LENGTH = 2;
export const LEAF_DECAY_MIN_FRAMES = 180;
export const LEAF_DECAY_RANDOM_FRAMES = 180;
export const WATER_FLOW_MAX = 5;
export const LAVA_FLOW_MAX = 3;
export const WATER_FLOW_INTERVAL = 4;
export const LAVA_FLOW_INTERVAL = 16;
export let WORLD_WIDTH = 1024;
export let WORLD_HEIGHT = 320;
export let currentWorldSize = 'small';

export function setWorldDimensions(size, explicitWidth, explicitHeight) {
    currentWorldSize = (size === 'big' || (explicitWidth && explicitWidth > 1200)) ? 'big' : 'small';
    if (explicitWidth && explicitHeight) {
        WORLD_WIDTH = explicitWidth;
        WORLD_HEIGHT = explicitHeight;
    } else if (currentWorldSize === 'big') {
        WORLD_WIDTH = 2048;
        WORLD_HEIGHT = 512;
    } else {
        WORLD_WIDTH = 1024;
        WORLD_HEIGHT = 320;
    }
    if (typeof window !== 'undefined') {
        window.currentWorldSize = currentWorldSize;
        window.WORLD_WIDTH = WORLD_WIDTH;
        window.WORLD_HEIGHT = WORLD_HEIGHT;
        if (typeof window.isOffscreenMapDirty !== 'undefined') window.isOffscreenMapDirty = true;
    }
}
export let worldBiomes = null;

export function getMaxAnimals() {
    if (isMultiplayer) {
        return currentWorldSize === 'big' ? 40 : 30;
    } else {
        return 40;
    }
}


    export const PHYSICS_TICK_RATE = 60;
    export const PHYSICS_TICK_MS = 1000 / PHYSICS_TICK_RATE;
    export let physicsAccumulator = 0;
    export let lastFrameTime = performance.now();
    export let lastRenderTime = 0;
    export let currentFps = 60;
    export let frameDeltaMs = 16.6;

    export const FPS_CAP_OPTIONS = [60, 120, 0, 30];
    export let fpsCap = typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('swc_fps_cap') || '60', 10) : 60;
    if (!FPS_CAP_OPTIONS.includes(fpsCap)) fpsCap = 60;

    export function getFpsCapText() {
        return fpsCap === 0 ? "Unlimited" : `${fpsCap} FPS`;
    }

    export const LIGHT_SCALE = 0.5;
    export let canvas = typeof document !== 'undefined' ? document.getElementById('gameCanvas') : null;
    export let ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
    export let menuBgCanvas = typeof document !== 'undefined' ? document.getElementById('menuBgCanvas') : null;
    export let menuCtx = menuBgCanvas ? menuBgCanvas.getContext('2d', { alpha: false }) : null;
    export let lightCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    export let lightCtx = lightCanvas ? lightCanvas.getContext('2d') : null;

    // Cached vignette radial gradient
    export let cachedLightVignette = null;
    export let cachedVignetteW = 0;
    export let cachedVignetteH = 0;
    export function updateCachedVignette() {
        if (!lightCanvas || !lightCanvas.width || !lightCanvas.height || lightCanvas.width < 10 || lightCanvas.height < 10) return;
        if (!lightCtx) lightCtx = lightCanvas.getContext('2d');
        if (!lightCtx) return;
        cachedLightVignette = lightCtx.createRadialGradient(
            lightCanvas.width / 2, lightCanvas.height / 2, Math.max(10, lightCanvas.height * 0.28),
            lightCanvas.width / 2, lightCanvas.height / 2, Math.max(20, lightCanvas.height * 0.82)
        );
        cachedLightVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        cachedLightVignette.addColorStop(1, 'rgba(0, 0, 12, 1)');
        cachedVignetteW = lightCanvas.width;
        cachedVignetteH = lightCanvas.height;
    }

    // Natural Ambient Occlusion (AO) System for caves, overhangs, walls, and crevices
    export const cachedCeilingAO = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    export const cachedLeftWallAO = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    export const cachedRightWallAO = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    export const cachedCornerAOTopLeft = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    export const cachedCornerAOTopRight = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    export const cachedOverhangShadow = cachedCeilingAO; // Compatibility alias

    if (cachedCeilingAO) {
        cachedCeilingAO.width = TILE_SIZE;
        cachedCeilingAO.height = 8;
        const cCtx = cachedCeilingAO.getContext('2d');
        if (cCtx) {
            const grad = cCtx.createLinearGradient(0, 0, 0, 8);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0.22)');
            grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.10)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            cCtx.fillStyle = grad;
            cCtx.fillRect(0, 0, TILE_SIZE, 8);
        }
    }

    if (cachedLeftWallAO) {
        cachedLeftWallAO.width = 8;
        cachedLeftWallAO.height = TILE_SIZE;
        const lwCtx = cachedLeftWallAO.getContext('2d');
        if (lwCtx) {
            const grad = lwCtx.createLinearGradient(0, 0, 8, 0);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0.18)');
            grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.08)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            lwCtx.fillStyle = grad;
            lwCtx.fillRect(0, 0, 8, TILE_SIZE);
        }
    }

    if (cachedRightWallAO) {
        cachedRightWallAO.width = 8;
        cachedRightWallAO.height = TILE_SIZE;
        const rwCtx = cachedRightWallAO.getContext('2d');
        if (rwCtx) {
            const grad = rwCtx.createLinearGradient(8, 0, 0, 0);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0.18)');
            grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.08)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            rwCtx.fillStyle = grad;
            rwCtx.fillRect(0, 0, 8, TILE_SIZE);
        }
    }

    if (cachedCornerAOTopLeft) {
        cachedCornerAOTopLeft.width = 12;
        cachedCornerAOTopLeft.height = 12;
        const clCtx = cachedCornerAOTopLeft.getContext('2d');
        if (clCtx) {
            const grad = clCtx.createRadialGradient(0, 0, 0, 0, 0, 12);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0.28)');
            grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.12)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            clCtx.fillStyle = grad;
            clCtx.fillRect(0, 0, 12, 12);
        }
    }

    if (cachedCornerAOTopRight) {
        cachedCornerAOTopRight.width = 12;
        cachedCornerAOTopRight.height = 12;
        const crCtx = cachedCornerAOTopRight.getContext('2d');
        if (crCtx) {
            const grad = crCtx.createRadialGradient(12, 0, 0, 12, 0, 12);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0.28)');
            grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.12)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            crCtx.fillStyle = grad;
            crCtx.fillRect(0, 0, 12, 12);
        }
    }

    // Pre-rendered reusable light falloff stamp (GPU texture blit)
    export const cachedTorchLightCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (cachedTorchLightCanvas) {
        cachedTorchLightCanvas.width = 256;
        cachedTorchLightCanvas.height = 256;
        const torchLightCtx = cachedTorchLightCanvas.getContext('2d');
        const tGrad = torchLightCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
        tGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        tGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        torchLightCtx.fillStyle = tGrad;
        torchLightCtx.beginPath();
        torchLightCtx.arc(128, 128, 128, 0, Math.PI * 2);
        torchLightCtx.fill();
    }

    // Pre-rendered reusable warm torch aura glow stamp
    export const cachedTorchGlowCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (cachedTorchGlowCanvas) {
        cachedTorchGlowCanvas.width = 128;
        cachedTorchGlowCanvas.height = 128;
        const torchGlowCtx = cachedTorchGlowCanvas.getContext('2d');
        const gGrad = torchGlowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gGrad.addColorStop(0, 'rgba(255, 214, 112, 0.32)');
        gGrad.addColorStop(1, 'rgba(255, 82, 18, 0)');
        torchGlowCtx.fillStyle = gGrad;
        torchGlowCtx.fillRect(0, 0, 128, 128);
    }

    // Pre-rendered reusable screen vignette stamp for Fabulous Graphics
    export const cachedFabulousVignetteCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (cachedFabulousVignetteCanvas) {
        cachedFabulousVignetteCanvas.width = 256;
        cachedFabulousVignetteCanvas.height = 256;
        const fabVigCtx = cachedFabulousVignetteCanvas.getContext('2d');
        const fabVigGrad = fabVigCtx.createRadialGradient(128, 128, 64, 128, 128, 128);
        fabVigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        fabVigGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.45)');
        fabVigGrad.addColorStop(1, 'rgba(0, 0, 0, 1.0)');
        fabVigCtx.fillStyle = fabVigGrad;
        fabVigCtx.fillRect(0, 0, 256, 256);
    }

    // Pre-rendered reusable snow fog gradient stamp
    export const cachedSnowFogCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (cachedSnowFogCanvas) {
        cachedSnowFogCanvas.width = 16;
        cachedSnowFogCanvas.height = 256;
        const snowFogCtx = cachedSnowFogCanvas.getContext('2d');
        const sFogGrad = snowFogCtx.createLinearGradient(0, 0, 0, 256);
        sFogGrad.addColorStop(0, 'rgba(230, 245, 255, 0)');
        sFogGrad.addColorStop(0.3, 'rgba(225, 242, 255, 0.45)');
        sFogGrad.addColorStop(0.7, 'rgba(215, 238, 255, 0.65)');
        sFogGrad.addColorStop(1, 'rgba(230, 245, 255, 0)');
        snowFogCtx.fillStyle = sFogGrad;
        snowFogCtx.fillRect(0, 0, 16, 256);
    }

    // Pre-rendered Sun Corona Glow (Daytime)
    export const cachedSunGlowDayCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (cachedSunGlowDayCanvas) {
        cachedSunGlowDayCanvas.width = 200;
        cachedSunGlowDayCanvas.height = 200;
        const sunDayCtx = cachedSunGlowDayCanvas.getContext('2d');
        const sgDay = sunDayCtx.createRadialGradient(100, 100, 15, 100, 100, 95);
        sgDay.addColorStop(0, 'rgba(255, 245, 160, 0.45)');
        sgDay.addColorStop(0.5, 'rgba(255, 215, 80, 0.18)');
        sgDay.addColorStop(1, 'rgba(255, 190, 40, 0)');
        sunDayCtx.fillStyle = sgDay;
        sunDayCtx.beginPath(); sunDayCtx.arc(100, 100, 95, 0, Math.PI * 2); sunDayCtx.fill();
    }

    // Pre-rendered Sun Corona Glow (Sunset / Sunrise)
    export const cachedSunGlowSunsetCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (cachedSunGlowSunsetCanvas) {
        cachedSunGlowSunsetCanvas.width = 200;
        cachedSunGlowSunsetCanvas.height = 200;
        const sunSunsetCtx = cachedSunGlowSunsetCanvas.getContext('2d');
        const sgSunset = sunSunsetCtx.createRadialGradient(100, 100, 15, 100, 100, 95);
        sgSunset.addColorStop(0, 'rgba(255, 140, 60, 0.45)');
        sgSunset.addColorStop(0.5, 'rgba(255, 90, 40, 0.20)');
        sgSunset.addColorStop(1, 'rgba(255, 50, 20, 0)');
        sunSunsetCtx.fillStyle = sgSunset;
        sunSunsetCtx.beginPath(); sunSunsetCtx.arc(100, 100, 95, 0, Math.PI * 2); sunSunsetCtx.fill();
    }

    // Pre-rendered Moon Celestial Halo Glow
    export const cachedMoonGlowCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (cachedMoonGlowCanvas) {
        cachedMoonGlowCanvas.width = 180;
        cachedMoonGlowCanvas.height = 180;
        const moonGlowCtx = cachedMoonGlowCanvas.getContext('2d');
        const mg = moonGlowCtx.createRadialGradient(90, 90, 15, 90, 90, 80);
        mg.addColorStop(0, 'rgba(190, 220, 255, 0.28)');
        mg.addColorStop(0.5, 'rgba(140, 185, 245, 0.12)');
        mg.addColorStop(1, 'rgba(100, 150, 230, 0)');
        moonGlowCtx.fillStyle = mg;
        moonGlowCtx.beginPath(); moonGlowCtx.arc(90, 90, 80, 0, Math.PI * 2); moonGlowCtx.fill();
    }

    // Pre-rendered Soft Entity Drop Shadow Sprite
    export const cachedShadowCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (cachedShadowCanvas) {
        cachedShadowCanvas.width = 64;
        cachedShadowCanvas.height = 16;
        const shadowCtx = cachedShadowCanvas.getContext('2d');
        const shGrad = shadowCtx.createRadialGradient(32, 8, 0, 32, 8, 32);
        shGrad.addColorStop(0, 'rgba(0, 0, 0, 0.42)');
        shGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.35)');
        shGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        shadowCtx.fillStyle = shGrad;
        shadowCtx.beginPath();
        shadowCtx.ellipse(32, 8, 30, 7, 0, 0, Math.PI * 2);
        shadowCtx.fill();
    }

    // Persistent offscreen canvas and ImageData for pixel-art aurora rendering
    export let auroraCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    export let auroraCtx = auroraCanvas ? auroraCanvas.getContext('2d') : null;
    export let auroraImageData = null;
    export let auroraSnowOpacity = 0;

    export const minimapOffscreenCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (minimapOffscreenCanvas) {
        minimapOffscreenCanvas.width = 64;
        minimapOffscreenCanvas.height = 64;
    }
    export const minimapOffscreenCtx = minimapOffscreenCanvas ? minimapOffscreenCanvas.getContext('2d') : null;
    export const minimapImageData = minimapOffscreenCtx ? minimapOffscreenCtx.createImageData(64, 64) : null;
    export const minimapBuf32 = minimapImageData ? new Uint32Array(minimapImageData.data.buffer) : null;
    export let minimapShape = 'square';
    export function setMinimapShape(shape) { minimapShape = shape; if (typeof window !== 'undefined') window.minimapShape = shape; }

    export const visibleFluids = [];
    export const LEAF_COLORS = ['#6f9f38', '#8dbb45', '#c28a3d', '#d0a34a'];
    export const MINIMAP_COLOR_32 = new Uint32Array(256);
    export let caveSkyOpacity = 0;
    export let keepInventory = false;
    export let currentWorldAchievementsEnabled = true;
    export let whatsNewShownThisLoad = false;
    export let whatsNewStartupEnabled = typeof localStorage !== 'undefined' ? localStorage.getItem('swc_whats_new_startup_enabled') !== 'false' : true;
    export let previewWalkAnimation = 0;
    export let previewWalkUntil = 0;
    export let hotbarPopupTimeout = null;
    export let lastHotbarItemId = null;
    export let sleepStartTime = 0;
    export let sleepTransitionMs = 3000;
    export const PATCH_NOTES_0_1_5 = {
        title: 'Beta 0.1.5 (Pigeon Wildlife, Flight Physics & Tree Perching)',
        items: [
            'Sweet Avian Wildlife (Pigeons): Populated biomes with sweet, innocent Pigeons featuring charming pixel art, shimmering emerald-violet neck collars, and expressive animations.',
            'Aerodynamic Flight Physics: Pigeons possess genuine flight dynamics, flapping wings to soar effortlessly above tree canopies, smoothly banking into turns, and gliding gracefully.',
            'Tree Foliage & Leaf Perching AI: Pigeons seek out tree canopies, landing softly on leaves to perch, look around with curious head tilts, and rest before taking flight again.',
            'Ground Foraging & Pecking: Pigeons land on open fields to hunt for seeds, walking with realistic head bobs and rhythmically pecking the earth.',
            'Skittish Startle Reflexes: Quick to startle—running close without seeds causes wild pigeons to scatter with fluttering wings and swiftly launch into the sky.',
            'Seed Temptation & Flocking Calls: Holding seeds in your hand pacifies pigeons and tempts them to approach. An attracted pigeon signals companions within range, gathering a friendly flock.',
            'Social Pairing: Pigeons often roam and fly in synchronized pairs, sticking close together across trees and meadows.',
            'Bittersweet Master Achievement: Defeating an innocent pigeon unlocks the bittersweet Master achievement "Why Would You Do That?"... they drop no loot, and the world feels a little quieter.'
        ]
    };

    export const PATCH_NOTES_0_1_4_PATCH_1 = {
        title: 'Beta 0.1.4 (Patch 1 - Visuals, Combat & UI Polish)',
        items: [
            'Authentic 16x16 Pixel-Art Block Breaking Animation: Upgraded the block breaking animation to an authentic 16x16 texel fracture system across 10 progressive stages, featuring dual-pass 3D relief highlights, dark core hairline fissures, block damage stress darkening, and integer-snapped physical micro-vibration.',
            'Symmetrical Inventory Equipment Showcase: Redesigned the backpack equipment panel with a balanced, symmetrical 54px right-side container mirroring the vertical armor slots. Integrates the Offhand slot, stone pixel divider, and a compact pixel-art Defense Station with high-contrast text and dynamic tooltips.',
            'Furnace UI Aesthetic Refinement: Removed the fire emoji and orange text glow from the Furnace header, restoring an authentic pixel-art stone aesthetic matching the rest of the game UI.',
            'Daytime Hostile Mob Spawning Prevention: Fixed hostile mob spawning algorithms to prevent creepers, zombies, skeletons, spiders, and desert scorpions from spawning during daytime hours and after sleeping in a bed.',
            'Inventory Item Hover Tooltips: Added interactive pixel-art tooltips displaying item names and metadata upon hovering over slots across inventory, hotbar, chest, furnace, armor, and offhand slots.',
            'Escape Key Navigation Hierarchy: Pressing the Escape key now intelligently closes foreground container interfaces (Crafting Table, Furnace, Chest, Backpack) first before opening the Pause Menu.'
        ]
    };

    export const PATCH_NOTES_0_1_4 = {
        title: 'Beta 0.1.4 (Farming, Livestock, Jukebox & Mechanics Overhaul)',
        items: [
            'Agriculture & Farmland System: Craft hoes to till grass and dirt into fertile Farmland blocks. Farmland dynamically stays moist and hydrated when near water sources (within 4 blocks) and supports crop cultivation.',
            'Progressive 4-Stage Wheat Farming: Plant wheat seeds on farmland to cultivate wheat across 4 authentic pixel-art growth stages (sprouts, vegetative blades, tall green stalks, and golden nodding wheat heads). Harvesting mature crops yields nutritious Wheat and bonus Seeds.',
            'Nutritious Bread Crafting: Combine 3 harvested Wheat in the Crafting Table to bake fresh Bread, providing efficient hunger and saturation replenishment.',
            'Complete Shovel & Hoe Tool Sets: Full tool progression across 5 material tiers (Wood, Stone, Iron, Gold, and Diamond). Shovels allow rapid excavation of dirt, grass, sand, gravel, and snow; Hoes till soil and harvest crops.',
            'Bovine Livestock (Cows): Added peaceful grazing Cows inhabiting grassy biomes with udders, horns, animated quadruped walking legs, and head bobbing. Defeating cows yields Raw Beef and Leather.',
            'Quadruped Animal Animation Overhaul: Overhauled procedural walking animations, natural leg cycles, and pixel art models for Cows, Sheep, Pigs, and Chickens.',
            'Jukebox & Vinyl Music Discs: Craftable Jukebox block with disc slots, interactive disc insertion/ejection, custom MP3 track loading with persistent IndexedDB storage, floating Music Player HUD with audio waveform and progress scrubbers, and floating musical note particles.',
            'Dynamic Unlit & Lit Furnace Textures: Authentically rendered furnace states - unlit dark stone grates when idle, bursting into animated glowing flames and dynamic light emissions when smelting ore or cooking food.',
            'Furnace GUI & Smelting Pipeline: Seamless furnace opening, smart shift-clicking, automatic fuel consumption, cooking/smelting progress bar, and protected take-only output slot.',
            'Realistic Tool Tier Harvesting: Authentic Minecraft drop mechanics - breaking stone or ores with bare hands or an insufficient pickaxe tier slowly breaks the block, but drops NO items whatsoever. Snow requires a shovel to drop snowballs.',
            'Enhanced 10-Stage Block Fracture Animation: Rebuilt block breaking animation with 10 progressive Minecraft-style pixelated fracture stages with dynamic jagged crack lines and relief shading.',
            'Persistent Difficulty Selector: Configurable Peaceful, Easy, Normal, and Hard modes with persistent storage, dynamic mob despawning in Peaceful, and accessible switching from both Pause and Main Menu settings.',
            'UI Accent Color Customization: Integrated custom accent color theming across menu borders, buttons, hover states, How-to-Play tabs, and gamepad focus outlines.',
            'Native Gamepad API Controller Support: Full support for standard Xbox, PlayStation, and generic USB/Bluetooth gamepads with automatic plug-and-play detection.',
            'Analog Platformer Movement: Smooth, variable-speed platformer movement using the left analog stick with configurable deadzone filtering and non-linear response curves.',
            '360° Analog Aim Vector: 360-degree crosshair targeting using the right analog stick with adjustable sensitivity, Y-axis inversion, and automated facing fallback.',
            'Adaptive Trigger Controls: Mine and attack with RT / R2 (Right Trigger) and place blocks or interact with LT / L2 (Left Trigger). Alternate attack mapped to X / Square.',
            'Console-Style Controller Jump & Crouch: Jump with A / Cross (or D-Pad Up / Left Stick tilt) and crouch / climb down with B / Circle (or D-Pad Down).',
            'Bumper Hotbar Cycling: Instantly cycle active hotbar items with LB / L1 (previous) and RB / R1 (next).',
            'Haptic Vibration Rumble: Dual-rumble and haptic pulse feedback on block breaking, taking damage, tool breakage, and UI interactions with toggleable settings.',
            'Universal Gamepad UI Navigation: Full D-Pad and left-stick 2D spatial focus navigation across all menus, modals, and inventory screens (Main Menu, Settings, Worlds, Achievements, Profile, Pause, and Death screen).',
            'Retro Gold UI Focus Glow: Animated focus outline (.gamepad-focused) with auto-scrolling into view and seamless mouse-controller coexistence.',
            'Recipe Pinning to HUD: Click any recipe in the Crafting Table to pin it to your HUD with live material tracking and crafting station status while mining.'
        ]
    };

    export const PATCH_NOTES_0_1_3 = {
        title: 'Beta 0.1.3 (Major Architecture & UI Overhaul)',
        items: [
            'Modular Codebase Architecture: Disassembled the monolithic single-file index.html into organized ES modules: main.js (game simulation & loop), engine.js (world generation & physics), ui.js (DOM, menus, inventory & skin studio), and network.js (P2P multiplayer & cloud auth).',
            'Dedicated CSS Pipeline: Migrated from runtime CDN Tailwind injection to a professional Tailwind CSS pipeline (css/input.css -> css/style.css), eliminating external CDN dependencies and dramatically improving load performance.',
            'Player Profile & Identity System: Added a dedicated Player Profile badge on the Main Menu showing your custom skin avatar head, player name, account status, and accumulated achievement emeralds.',
            'User Accounts & Authentication: Integrated Webcraft User Accounts with email/password registration, login, and cloud profile persistence.',
            'Guest Mode Architecture: Full support for playing as a Guest with local storage saves, clear guest limitations dialogs, and seamless account upgrading without progress loss.',
            'Emerald Currency System: Earn emeralds by unlocking achievements, with live balance tracking across singleplayer and multiplayer displayed on your profile card.',
            'Profile Details Modal: View account creation date, playtime statistics, unlocked achievements summary, emerald count, and manage account credentials.',
            'Aseprite-Style Pixel Skin Studio: Rebuilt the skin customizer into a professional pixel art studio with real-time 3D-mapped character preview, custom color swatches, palette history, undo/redo, canvas zoom, and cloud gallery uploading.',
            'Chunked Multiplayer World Streaming: Implemented 32x32 chunked world compression and progressive streaming (MP_CHUNK_SIZE = 32), enabling large custom worlds to be uploaded and downloaded without payload caps.',
            'Publish Singleplayer to Multiplayer: Added "Open to Multiplayer" modal in the pause menu allowing singleplayer worlds to be seamlessly converted into online multiplayer rooms with automated local backups and password protection.',
            'Multiplayer Lobby & Server Browser: Redesigned multiplayer lobby with real-time server browser, survival and minigame filter tabs, secure SHA-256 password hashing, and room difficulty badges.',
            'Multiplayer Chat System: In-game chat overlay (press T or /) with player nametags, system broadcasts, achievement unlock announcements, and auto-fading message history.',
            'AFK Inactivity Protection: Automated 5-minute inactivity watchdog that gently disconnects idle players to preserve server performance and player security.',
            'Authentic Backpack & Equipment Layout: Redesigned inventory with 4 vertical armor slots (Helmet, Chestplate, Leggings, Boots), live interactive Paperdoll preview stage, offhand slot, defense percentage readout, and separated storage/hotbar grids.',
            'Crafting Table Search & Categories: Real-time recipe search with keyword filtering, clear button, and category filters (All, Tools, Armour, Materials, Blocks, Utility).',
            'Full Armor Protection & Durability: Craftable armor sets across Iron, Gold, and Diamond tiers with unique defense ratings, damage mitigation formulas, durability bars, and breakage audio.',
            'Background Wall Building Mode: Press B to toggle background placement mode, allowing players to build and mine depth background walls behind structures with atmospheric darkening.',
            'Falling Sand Gravity Physics: Dynamic falling physics for unsupported sand blocks with natural chain-reaction cave collapses, impact damage, and head suffocation.',
            'Snowball Throwing Combat: Gather snowballs from snow blocks and throw them with ballistic trajectories, particle trails, sound effects, and knockback damage synchronized across multiplayer.',
            'Desert Scorpions & Poison Effect: Hostile Desert Scorpions spawning in arid biomes with multi-legged animations, stinger strikes, and a damage-over-time poison status effect.',
            'Synthesized Procedural Web Audio Engine: Procedural audio synthesis for material-based footsteps (grass, stone, sand, wood, ladder, water, snow), block breaking/placing, tool/armor durability breakage, eating, damage, and projectile whooshes.',
            'Dynamic Celestial Sky & Aurora Borealis: Multi-stage procedural sky with daylight, twilight, sunset, starry night cycles, radiant sun flares, lunar craters, and animated multi-layer Aurora Borealis in snowy biomes.',
            'Fabulous Atmosphere & Visual Shaders: Added graphics quality presets (Base, Advanced, Fabulous) with biome color grading, desert heat shimmer, volumetric cloud drift, ambient particles (fireflies, cave dust, spores, snow), and cinematic vignette.',
            'Delta-Time Physics Stabilization: Physics accumulator with delta-time snapping to eliminate micro-stutter and ensure deterministic 60Hz physics across 60Hz, 120Hz, and 144Hz displays.',
            'Automated Cassette Tape Autosave: 60-second recurring background autosave with animated retro cassette tape slide-up notifications.',
            'Keybinding Rebinding System: Customizable controls menu in Settings with interactive click-to-rebind buttons, escape cancellation, mouse wheel sensitivity tuning, and wrap-around toggles.'
        ]
    };

    export const LATEST_PATCH_NOTES = PATCH_NOTES_0_1_5;
    export const UPDATE_HISTORY_LOGS = [PATCH_NOTES_0_1_5, PATCH_NOTES_0_1_4_PATCH_1, PATCH_NOTES_0_1_4, PATCH_NOTES_0_1_3];

    export let mapSeed = Math.floor(Math.random() * 1000000);
    export function seededRandom() {
        mapSeed = (mapSeed * 9301 + 49297) % 233280;
        return mapSeed / 233280;
    }

    export const DIFFICULTIES = {
        peaceful: { name: 'Peaceful', mobSpawn: 0, mobDmg: 0, starve: false, hpRegen: 40 },
        easy:     { name: 'Easy', mobSpawn: 0.12, mobDmg: 0.75, starve: false, hpRegen: 100 },
        normal:   { name: 'Normal', mobSpawn: 0.28, mobDmg: 1.0, starve: true, hpRegen: 120 },
        hard:     { name: 'Hard', mobSpawn: 0.55, mobDmg: 1.5, starve: true, hpRegen: 160 },
        hardcore: { name: 'Hardcore', mobSpawn: 0.55, mobDmg: 1.5, starve: true, hpRegen: 160, permadeath: true }
    };

    export function getDayDifficultyMultiplier() {
        if (currentDifficulty === 'peaceful') return 1.0;
        const currentDays = Math.max(1, dayCount);
        // Increases difficulty: +4.5% per day past day 1, capped at 3.25x (around day 51)
        const progress = Math.min(50, currentDays - 1);
        return 1 + (progress * 0.045);
    }

    export function getDayHungerDrainMultiplier() {
        if (currentDifficulty === 'peaceful') return 0;
        const currentDays = Math.max(1, dayCount);
        // Slowly increases hunger exhaustion drain: +1.5% per day past day 1, capped at 1.75x (around day 51)
        const progress = Math.min(50, currentDays - 1);
        const baseMult = 1 + (progress * 0.015);
        if (currentDifficulty === 'easy') return 0.5 * baseMult;
        return baseMult;
    }

    export const diffDescriptions = {
        peaceful: "Peaceful: No monsters spawn at night. Player health regenerates rapidly and hunger never starves you.",
        easy: "Easy: Monsters spawn less frequently and deal light damage. Creepers produce smaller explosions.",
        normal: "Normal: Standard survival experience with standard monster spawns and hunger depletion.",
        hard: "Hard: Monsters spawn frequently, deal extra damage, creepers swell faster, and hunger drains quicker.",
        hardcore: "Hardcore: Locked to Hard difficulty with PERMANENT DEATH. If you die, your world is permanently deleted!"
    };

    export const IDS = {
        AIR: 0, DIRT: 1, GRASS: 2, STONE: 3, COBBLESTONE: 4, 
        WOOD: 5, LEAVES: 6, PLANKS: 7, COAL_ORE: 8, GOLD_ORE: 9, CRAFTING_TABLE: 10, FURNACE: 11, TORCH: 12,
        SAND: 13, SNOW: 14, CACTUS: 15, BED: 16, IRON_ORE: 17, DIAMOND_ORE: 18, DOOR: 19, DOOR_TOP: 20, DOOR_OPEN: 21, DOOR_OPEN_TOP: 22, SAPLING: 23, WATER: 24, LAVA: 25,
        CHEST: 26, SHORT_GRASS: 27, TALL_GRASS: 28, FLOWER_RED: 29, FLOWER_YELLOW: 30,
        LADDER: 31, WOODEN_STAIRS: 32, WOODEN_STAIRS_LEFT: 32, COBBLESTONE_STAIRS: 33, COBBLESTONE_STAIRS_LEFT: 33,
        WOODEN_STAIRS_RIGHT: 34, COBBLESTONE_STAIRS_RIGHT: 35,
        PLOWED_DIRT: 36, FARMLAND: 36,
        WHEAT_STAGE_1: 37, WHEAT_STAGE_2: 38, WHEAT_STAGE_3: 39, WHEAT_STAGE_4: 40,
        JUKEBOX: 41,
        JUNGLE_WOOD: 42, JUNGLE_LEAVES: 43, JUNGLE_PLANKS: 44, JUNGLE_SAPLING: 45,
        JUNGLE_DOOR: 46, JUNGLE_DOOR_TOP: 47, JUNGLE_DOOR_OPEN: 48, JUNGLE_DOOR_OPEN_TOP: 49,
        VINES: 50, MELON: 51, FERN: 52, BAMBOO: 53, MELON_STEM: 54,
        EMERALD_ORE: 55, PRISM_GLASS: 56, VOID_STONE_BRICK: 57, ASTRAL_INFUSER: 58, VOID_BERRY_BUSH: 59, SUNBURST_MELON: 60,
        SIGN: 61,
        STICK: 100, WOOD_PICKAXE: 101, STONE_PICKAXE: 102, 
        WOOD_SWORD: 103, STONE_SWORD: 104, WOOD_AXE: 105, 
        COAL: 106, GOLD_INGOT: 107,
        STONE_AXE: 108, GOLD_PICKAXE: 109, GOLD_SWORD: 110, GOLD_AXE: 111,
        RAW_PORKCHOP: 112, COOKED_PORKCHOP: 113, APPLE: 114,
        RAW_CHICKEN: 115, COOKED_CHICKEN: 116, FEATHER: 117, WOOL: 118, RAW_MUTTON: 119,
        IRON_INGOT: 120, DIAMOND: 121, BUCKET: 128, WATER_BUCKET: 129, LAVA_BUCKET: 130,
        SEEDS: 131, COOKED_MUTTON: 132, BONE: 133, SNOWBALL: 134,
        HELMET_IRON: 135, CHESTPLATE_IRON: 136, LEGGINGS_IRON: 137, BOOTS_IRON: 138,
        HELMET_GOLD: 139, CHESTPLATE_GOLD: 140, LEGGINGS_GOLD: 141, BOOTS_GOLD: 142,
        HELMET_DIAMOND: 143, CHESTPLATE_DIAMOND: 144, LEGGINGS_DIAMOND: 145, BOOTS_DIAMOND: 146,
        IRON_PICKAXE: 122, IRON_SWORD: 123, IRON_AXE: 124,
        DIAMOND_PICKAXE: 125, DIAMOND_SWORD: 126, DIAMOND_AXE: 127,
        WOOD_SHOVEL: 147, STONE_SHOVEL: 148, IRON_SHOVEL: 149, GOLD_SHOVEL: 150, DIAMOND_SHOVEL: 151,
        WOOD_HOE: 152, STONE_HOE: 153, IRON_HOE: 154, GOLD_HOE: 155, DIAMOND_HOE: 156,
        WHEAT: 157, BREAD: 158,
        RAW_BEEF: 159, COOKED_BEEF: 160, LEATHER: 161,
        EMPTY_VINYL: 162, VINYL_DISC: 162,
        MELON_SLICE: 163, MELON_SEEDS: 164,
        ASTRAL_EMERALD: 165, ASTRAL_SHARD: 166,
        VOID_BERRY_SPORES: 167, VOID_BERRY: 168,
        SUNBURST_MELON_SEEDS: 169, SUNBURST_MELON_SLICE: 170,
        MUSIC_DISC_SYNTHWAVE: 171, MUSIC_DISC_AMBIENT: 172,
        KINETIC_SHEARS: 173, STRIDER_BOOTS: 174,
        ASTRAL_SWORD: 175, ASTRAL_PICKAXE: 176, ASTRAL_AXE: 177, ASTRAL_SHOVEL: 178,
        ASTRAL_HELMET: 179, ASTRAL_CHESTPLATE: 180, ASTRAL_LEGGINGS: 181, ASTRAL_BOOTS: 182,
        EMERALD: 183
    };


    MINIMAP_COLOR_32.fill(0xFF7D7D7D); // default stone color (ABGR)
    MINIMAP_COLOR_32[IDS.AIR] = 0xFF0A0A0A;
    MINIMAP_COLOR_32[IDS.JUKEBOX] = 0xFF213A5C;
    MINIMAP_COLOR_32[IDS.TORCH] = 0xFF33CFFF;
    MINIMAP_COLOR_32[IDS.GRASS] = 0xFF35B042;
    MINIMAP_COLOR_32[IDS.LEAVES] = 0xFF35B042;
    MINIMAP_COLOR_32[IDS.SHORT_GRASS] = 0xFF35B042;
    MINIMAP_COLOR_32[IDS.TALL_GRASS] = 0xFF35B042;
    MINIMAP_COLOR_32[IDS.FLOWER_RED] = 0xFF3539E5;
    MINIMAP_COLOR_32[IDS.FLOWER_YELLOW] = 0xFF35D8FD;
    MINIMAP_COLOR_32[IDS.DIRT] = 0xFF3A5579;
    MINIMAP_COLOR_32[IDS.PLOWED_DIRT] = 0xFF283C58;
    MINIMAP_COLOR_32[IDS.WHEAT_STAGE_1] = 0xFF35B042;
    MINIMAP_COLOR_32[IDS.WHEAT_STAGE_2] = 0xFF35B042;
    MINIMAP_COLOR_32[IDS.WHEAT_STAGE_3] = 0xFF35D8FD;
    MINIMAP_COLOR_32[IDS.WHEAT_STAGE_4] = 0xFF33CFFF;
    MINIMAP_COLOR_32[IDS.WOOD] = 0xFF3A5579;
    MINIMAP_COLOR_32[IDS.PLANKS] = 0xFF3A5579;
    MINIMAP_COLOR_32[IDS.LADDER] = 0xFF3A5579;
    MINIMAP_COLOR_32[IDS.WOODEN_STAIRS] = 0xFF3A5579;
    MINIMAP_COLOR_32[IDS.WOODEN_STAIRS_RIGHT] = 0xFF3A5579;
    MINIMAP_COLOR_32[IDS.COBBLESTONE_STAIRS] = 0xFF7D7D7D;
    MINIMAP_COLOR_32[IDS.COBBLESTONE_STAIRS_RIGHT] = 0xFF7D7D7D;
    MINIMAP_COLOR_32[IDS.GOLD_ORE] = 0xFF33CFFF;
    MINIMAP_COLOR_32[IDS.IRON_ORE] = 0xFF557BC2;
    MINIMAP_COLOR_32[IDS.DIAMOND_ORE] = 0xFFE6E655;
    MINIMAP_COLOR_32[IDS.DIAMOND] = 0xFFE6E655;
    MINIMAP_COLOR_32[IDS.COAL_ORE] = 0xFF222222;
    MINIMAP_COLOR_32[IDS.SAND] = 0xFF80CCE6;
    MINIMAP_COLOR_32[IDS.SNOW] = 0xFFFFFFFF;
    MINIMAP_COLOR_32[IDS.CACTUS] = 0xFF50AF4C;
    MINIMAP_COLOR_32[IDS.BED] = 0xFF3B3BD8;
    MINIMAP_COLOR_32[IDS.DOOR] = 0xFF3D6B9E;
    MINIMAP_COLOR_32[IDS.DOOR_TOP] = 0xFF3D6B9E;
    MINIMAP_COLOR_32[IDS.DOOR_OPEN] = 0xFF3D6B9E;
    MINIMAP_COLOR_32[IDS.DOOR_OPEN_TOP] = 0xFF3D6B9E;
    MINIMAP_COLOR_32[IDS.WOOL] = 0xFFF5F5F5;
    MINIMAP_COLOR_32[IDS.JUNGLE_WOOD] = 0xFF33405C;
    MINIMAP_COLOR_32[IDS.JUNGLE_LEAVES] = 0xFF347E1E;
    MINIMAP_COLOR_32[IDS.JUNGLE_PLANKS] = 0xFF4F82B8;
    MINIMAP_COLOR_32[IDS.JUNGLE_SAPLING] = 0xFF449E2E;
    MINIMAP_COLOR_32[IDS.JUNGLE_DOOR] = 0xFF365D8D;
    MINIMAP_COLOR_32[IDS.JUNGLE_DOOR_TOP] = 0xFF365D8D;
    MINIMAP_COLOR_32[IDS.JUNGLE_DOOR_OPEN] = 0xFF365D8D;
    MINIMAP_COLOR_32[IDS.JUNGLE_DOOR_OPEN_TOP] = 0xFF365D8D;
    MINIMAP_COLOR_32[IDS.VINES] = 0xFF297A2D;
    MINIMAP_COLOR_32[IDS.MELON] = 0xFF327D2E;
    MINIMAP_COLOR_32[IDS.FERN] = 0xFF3C8E38;
    MINIMAP_COLOR_32[IDS.BAMBOO] = 0xFF47A043;
    MINIMAP_COLOR_32[IDS.MELON_STEM] = 0xFF42B37C;
    MINIMAP_COLOR_32[IDS.EMERALD_ORE] = 0xFF50D050;
    MINIMAP_COLOR_32[IDS.PRISM_GLASS] = 0xFFF0E0D0;
    MINIMAP_COLOR_32[IDS.VOID_STONE_BRICK] = 0xFF4A1838;
    MINIMAP_COLOR_32[IDS.ASTRAL_INFUSER] = 0xFF8A3070;
    MINIMAP_COLOR_32[IDS.VOID_BERRY_BUSH] = 0xFFB04090;
    MINIMAP_COLOR_32[IDS.SUNBURST_MELON] = 0xFF20A0F0;
    MINIMAP_COLOR_32[IDS.SIGN] = 0xFF3A5579;

    export const HARDNESS = {
        [IDS.DIRT]: 20, [IDS.PLOWED_DIRT]: 20, [IDS.GRASS]: 25, [IDS.STONE]: 150, [IDS.COBBLESTONE]: 150,
        [IDS.WOOD]: 60, [IDS.LEAVES]: 5, [IDS.PLANKS]: 60, [IDS.COAL_ORE]: 160, 
        [IDS.GOLD_ORE]: 180, [IDS.IRON_ORE]: 180, [IDS.DIAMOND_ORE]: 240,
        [IDS.CRAFTING_TABLE]: 60, [IDS.FURNACE]: 150, [IDS.TORCH]: 5, [IDS.SAPLING]: 5,
        [IDS.JUKEBOX]: 60,
        [IDS.SHORT_GRASS]: 1, [IDS.TALL_GRASS]: 1, [IDS.FLOWER_RED]: 1, [IDS.FLOWER_YELLOW]: 1,
        [IDS.WHEAT_STAGE_1]: 1, [IDS.WHEAT_STAGE_2]: 1, [IDS.WHEAT_STAGE_3]: 1, [IDS.WHEAT_STAGE_4]: 1,
        [IDS.SAND]: 15, [IDS.SNOW]: 10, [IDS.CACTUS]: 20, [IDS.BED]: 30,
        [IDS.DOOR]: 45, [IDS.DOOR_TOP]: 45, [IDS.DOOR_OPEN]: 45, [IDS.DOOR_OPEN_TOP]: 45, [IDS.CHEST]: 45,
        [IDS.LADDER]: 10, [IDS.WOODEN_STAIRS]: 60, [IDS.WOODEN_STAIRS_RIGHT]: 60,
        [IDS.COBBLESTONE_STAIRS]: 150, [IDS.COBBLESTONE_STAIRS_RIGHT]: 150,
        [IDS.WATER]: 1, [IDS.LAVA]: 1,
        [IDS.JUNGLE_WOOD]: 60, [IDS.JUNGLE_LEAVES]: 5, [IDS.JUNGLE_PLANKS]: 60, [IDS.JUNGLE_SAPLING]: 5,
        [IDS.JUNGLE_DOOR]: 45, [IDS.JUNGLE_DOOR_TOP]: 45, [IDS.JUNGLE_DOOR_OPEN]: 45, [IDS.JUNGLE_DOOR_OPEN_TOP]: 45,
        [IDS.VINES]: 5, [IDS.MELON]: 30, [IDS.FERN]: 1, [IDS.BAMBOO]: 15, [IDS.MELON_STEM]: 1,
        [IDS.EMERALD_ORE]: 240, [IDS.PRISM_GLASS]: 15, [IDS.VOID_STONE_BRICK]: 200,
        [IDS.ASTRAL_INFUSER]: 250, [IDS.VOID_BERRY_BUSH]: 10, [IDS.SUNBURST_MELON]: 30,
        [IDS.SIGN]: 15
    };

    export const ID_NAMES = Object.fromEntries(Object.entries(IDS).map(([k, v]) => [v, k.replace(/_/g, ' ')]));
    ID_NAMES[IDS.SAPLING] = 'Oak Sapling';
    ID_NAMES[IDS.JUKEBOX] = 'Jukebox';
    ID_NAMES[IDS.EMPTY_VINYL] = 'Vinyl Disc';
    ID_NAMES[IDS.SHORT_GRASS] = 'Short Grass';
    ID_NAMES[IDS.TALL_GRASS] = 'Tall Grass';
    ID_NAMES[IDS.FLOWER_RED] = 'Poppy';
    ID_NAMES[IDS.FLOWER_YELLOW] = 'Dandelion';
    ID_NAMES[IDS.SEEDS] = 'Seeds';
    ID_NAMES[IDS.PLOWED_DIRT] = 'Farmland';
    ID_NAMES[IDS.WHEAT_STAGE_1] = 'Wheat Crop';
    ID_NAMES[IDS.WHEAT_STAGE_2] = 'Wheat Crop';
    ID_NAMES[IDS.WHEAT_STAGE_3] = 'Wheat Crop';
    ID_NAMES[IDS.WHEAT_STAGE_4] = 'Wheat Crop';
    ID_NAMES[IDS.WOOD_SHOVEL] = 'Wooden Shovel';
    ID_NAMES[IDS.STONE_SHOVEL] = 'Stone Shovel';
    ID_NAMES[IDS.IRON_SHOVEL] = 'Iron Shovel';
    ID_NAMES[IDS.GOLD_SHOVEL] = 'Golden Shovel';
    ID_NAMES[IDS.DIAMOND_SHOVEL] = 'Diamond Shovel';
    ID_NAMES[IDS.WOOD_HOE] = 'Wooden Hoe';
    ID_NAMES[IDS.STONE_HOE] = 'Stone Hoe';
    ID_NAMES[IDS.IRON_HOE] = 'Iron Hoe';
    ID_NAMES[IDS.GOLD_HOE] = 'Golden Hoe';
    ID_NAMES[IDS.DIAMOND_HOE] = 'Diamond Hoe';
    ID_NAMES[IDS.WHEAT] = 'Wheat';
    ID_NAMES[IDS.BREAD] = 'Bread';
    ID_NAMES[IDS.RAW_MUTTON] = 'Raw Mutton';
    ID_NAMES[IDS.COOKED_MUTTON] = 'Cooked Mutton';
    ID_NAMES[IDS.RAW_BEEF] = 'Raw Beef';
    ID_NAMES[IDS.COOKED_BEEF] = 'Cooked Beef';
    ID_NAMES[IDS.LEATHER] = 'Leather';
    ID_NAMES[IDS.BONE] = 'Bone';
    ID_NAMES[IDS.SNOWBALL] = 'Snowball';
    ID_NAMES[IDS.LADDER] = 'Ladder';
    ID_NAMES[IDS.WOODEN_STAIRS] = 'Oak Stairs';
    ID_NAMES[IDS.WOODEN_STAIRS_RIGHT] = 'Oak Stairs';
    ID_NAMES[IDS.COBBLESTONE_STAIRS] = 'Cobblestone Stairs';
    ID_NAMES[IDS.COBBLESTONE_STAIRS_RIGHT] = 'Cobblestone Stairs';
    ID_NAMES[IDS.HELMET_IRON] = 'Iron Helmet';
    ID_NAMES[IDS.CHESTPLATE_IRON] = 'Iron Chestplate';
    ID_NAMES[IDS.LEGGINGS_IRON] = 'Iron Leggings';
    ID_NAMES[IDS.BOOTS_IRON] = 'Iron Boots';
    ID_NAMES[IDS.HELMET_GOLD] = 'Golden Helmet';
    ID_NAMES[IDS.JUNGLE_WOOD] = 'Jungle Wood';
    ID_NAMES[IDS.JUNGLE_LEAVES] = 'Jungle Leaves';
    ID_NAMES[IDS.JUNGLE_PLANKS] = 'Jungle Planks';
    ID_NAMES[IDS.JUNGLE_SAPLING] = 'Jungle Sapling';
    ID_NAMES[IDS.JUNGLE_DOOR] = 'Jungle Door';
    ID_NAMES[IDS.JUNGLE_DOOR_TOP] = 'Jungle Door';
    ID_NAMES[IDS.JUNGLE_DOOR_OPEN] = 'Jungle Door';
    ID_NAMES[IDS.JUNGLE_DOOR_OPEN_TOP] = 'Jungle Door';
    ID_NAMES[IDS.VINES] = 'Vines';
    ID_NAMES[IDS.MELON] = 'Melon';
    ID_NAMES[IDS.FERN] = 'Fern';
    ID_NAMES[IDS.BAMBOO] = 'Bamboo';
    ID_NAMES[IDS.MELON_STEM] = 'Melon Stem';
    ID_NAMES[IDS.MELON_SLICE] = 'Melon Slice';
    ID_NAMES[IDS.MELON_SEEDS] = 'Melon Seeds';
    ID_NAMES[IDS.CHESTPLATE_GOLD] = 'Golden Chestplate';
    ID_NAMES[IDS.LEGGINGS_GOLD] = 'Golden Leggings';
    ID_NAMES[IDS.BOOTS_GOLD] = 'Golden Boots';
    ID_NAMES[IDS.HELMET_DIAMOND] = 'Diamond Helmet';
    ID_NAMES[IDS.CHESTPLATE_DIAMOND] = 'Diamond Chestplate';
    ID_NAMES[IDS.LEGGINGS_DIAMOND] = 'Diamond Leggings';
    ID_NAMES[IDS.BOOTS_DIAMOND] = 'Diamond Boots';
    ID_NAMES[IDS.EMERALD_ORE] = 'Emerald Ore';
    ID_NAMES[IDS.PRISM_GLASS] = 'Prism Glass';
    ID_NAMES[IDS.VOID_STONE_BRICK] = 'Void Stone Brick';
    ID_NAMES[IDS.ASTRAL_INFUSER] = 'Astral Infuser';
    ID_NAMES[IDS.VOID_BERRY_BUSH] = 'Void Berry Bush';
    ID_NAMES[IDS.SUNBURST_MELON] = 'Sunburst Melon';
    ID_NAMES[IDS.ASTRAL_EMERALD] = 'Astral Emerald';
    ID_NAMES[IDS.ASTRAL_SHARD] = 'Astral Shard';
    ID_NAMES[IDS.VOID_BERRY_SPORES] = 'Void Berry Spores';
    ID_NAMES[IDS.VOID_BERRY] = 'Void Berry';
    ID_NAMES[IDS.SUNBURST_MELON_SEEDS] = 'Sunburst Melon Seeds';
    ID_NAMES[IDS.SUNBURST_MELON_SLICE] = 'Sunburst Melon Slice';
    ID_NAMES[IDS.MUSIC_DISC_SYNTHWAVE] = 'Audio Relic - Neon Horizon';
    ID_NAMES[IDS.MUSIC_DISC_AMBIENT] = 'Audio Relic - Echoes of the Void';
    ID_NAMES[IDS.KINETIC_SHEARS] = 'Kinetic Shears';
    ID_NAMES[IDS.STRIDER_BOOTS] = 'Strider Boots';
    ID_NAMES[IDS.ASTRAL_SWORD] = 'Astral Sword';
    ID_NAMES[IDS.ASTRAL_PICKAXE] = 'Astral Pickaxe';
    ID_NAMES[IDS.ASTRAL_AXE] = 'Astral Axe';
    ID_NAMES[IDS.ASTRAL_SHOVEL] = 'Astral Shovel';
    ID_NAMES[IDS.ASTRAL_HELMET] = 'Astral Helmet';
    ID_NAMES[IDS.ASTRAL_CHESTPLATE] = 'Astral Chestplate';
    ID_NAMES[IDS.ASTRAL_LEGGINGS] = 'Astral Leggings';
    ID_NAMES[IDS.ASTRAL_BOOTS] = 'Astral Boots';
    ID_NAMES[IDS.EMERALD] = 'Emerald';
    ID_NAMES[IDS.SIGN] = 'Sign';

    export const TOOL_DURABILITY = {
        [IDS.WOOD_PICKAXE]: 60, [IDS.WOOD_AXE]: 60, [IDS.WOOD_SWORD]: 60,
        [IDS.WOOD_SHOVEL]: 60, [IDS.WOOD_HOE]: 60,
        [IDS.STONE_PICKAXE]: 120, [IDS.STONE_AXE]: 120, [IDS.STONE_SWORD]: 120,
        [IDS.STONE_SHOVEL]: 120, [IDS.STONE_HOE]: 120,
        [IDS.IRON_PICKAXE]: 240, [IDS.IRON_AXE]: 240, [IDS.IRON_SWORD]: 240,
        [IDS.IRON_SHOVEL]: 240, [IDS.IRON_HOE]: 240,
        [IDS.GOLD_PICKAXE]: 180, [IDS.GOLD_AXE]: 180, [IDS.GOLD_SWORD]: 180,
        [IDS.GOLD_SHOVEL]: 180, [IDS.GOLD_HOE]: 180,
        [IDS.DIAMOND_PICKAXE]: 480, [IDS.DIAMOND_AXE]: 480, [IDS.DIAMOND_SWORD]: 480,
        [IDS.DIAMOND_SHOVEL]: 480, [IDS.DIAMOND_HOE]: 480,
        [IDS.ASTRAL_PICKAXE]: 750, [IDS.ASTRAL_AXE]: 750, [IDS.ASTRAL_SWORD]: 750,
        [IDS.ASTRAL_SHOVEL]: 750, [IDS.KINETIC_SHEARS]: 500
    };

    export const ARMOR_DURABILITY = {
        [IDS.HELMET_IRON]: 165, [IDS.CHESTPLATE_IRON]: 240, [IDS.LEGGINGS_IRON]: 225, [IDS.BOOTS_IRON]: 195,
        [IDS.HELMET_GOLD]: 77, [IDS.CHESTPLATE_GOLD]: 112, [IDS.LEGGINGS_GOLD]: 105, [IDS.BOOTS_GOLD]: 91,
        [IDS.HELMET_DIAMOND]: 363, [IDS.CHESTPLATE_DIAMOND]: 528, [IDS.LEGGINGS_DIAMOND]: 495, [IDS.BOOTS_DIAMOND]: 429,
        [IDS.ASTRAL_HELMET]: 520, [IDS.ASTRAL_CHESTPLATE]: 650, [IDS.ASTRAL_LEGGINGS]: 600, [IDS.ASTRAL_BOOTS]: 540,
        [IDS.STRIDER_BOOTS]: 500
    };

    export const ARMOR_DEFENSE = {
        [IDS.HELMET_IRON]: 2, [IDS.CHESTPLATE_IRON]: 6, [IDS.LEGGINGS_IRON]: 5, [IDS.BOOTS_IRON]: 2,
        [IDS.HELMET_GOLD]: 2, [IDS.CHESTPLATE_GOLD]: 5, [IDS.LEGGINGS_GOLD]: 3, [IDS.BOOTS_GOLD]: 1,
        [IDS.HELMET_DIAMOND]: 3, [IDS.CHESTPLATE_DIAMOND]: 8, [IDS.LEGGINGS_DIAMOND]: 6, [IDS.BOOTS_DIAMOND]: 3,
        [IDS.ASTRAL_HELMET]: 4, [IDS.ASTRAL_CHESTPLATE]: 9, [IDS.ASTRAL_LEGGINGS]: 7, [IDS.ASTRAL_BOOTS]: 4,
        [IDS.STRIDER_BOOTS]: 2
    };

    export const ARMOR_SLOT_TYPE = {
        [IDS.HELMET_IRON]: 0, [IDS.HELMET_GOLD]: 0, [IDS.HELMET_DIAMOND]: 0, [IDS.ASTRAL_HELMET]: 0,
        [IDS.CHESTPLATE_IRON]: 1, [IDS.CHESTPLATE_GOLD]: 1, [IDS.CHESTPLATE_DIAMOND]: 1, [IDS.ASTRAL_CHESTPLATE]: 1,
        [IDS.LEGGINGS_IRON]: 2, [IDS.LEGGINGS_GOLD]: 2, [IDS.LEGGINGS_DIAMOND]: 2, [IDS.ASTRAL_LEGGINGS]: 2,
        [IDS.BOOTS_IRON]: 3, [IDS.BOOTS_GOLD]: 3, [IDS.BOOTS_DIAMOND]: 3, [IDS.ASTRAL_BOOTS]: 3,
        [IDS.STRIDER_BOOTS]: 3
    };


    export function isArmor(id) {
        return ARMOR_SLOT_TYPE[id] !== undefined;
    }

    export function getArmorSlotIndex(id) {
        return ARMOR_SLOT_TYPE[id] !== undefined ? ARMOR_SLOT_TYPE[id] : -1;
    }

    export function ensureArmorDurability(item) {
        if (!item || !isArmor(item.id)) return;
        if (item.durability === undefined) {
            item.durability = ARMOR_DURABILITY[item.id] || 100;
        }
    }

    export function getTotalArmorDefense() {
        let total = 0;
        for (let i = 0; i < 4; i++) {
            const piece = equippedArmor[i];
            if (piece && piece.id && ARMOR_DEFENSE[piece.id]) {
                total += ARMOR_DEFENSE[piece.id];
            }
        }
        return total;
    }

    export function getArmorDamageReductionRatio() {
        const defense = getTotalArmorDefense();
        return Math.min(0.80, (defense * 4) / 100);
    }

    export const MINING_TOOL_TIERS = {
        [IDS.WOOD_PICKAXE]: 1,
        [IDS.STONE_PICKAXE]: 2,
        [IDS.IRON_PICKAXE]: 3,
        [IDS.GOLD_PICKAXE]: 4,
        [IDS.DIAMOND_PICKAXE]: 5,
        [IDS.ASTRAL_PICKAXE]: 6
    };

    export function getRequiredMiningTier(blockId) {
        if (blockId === IDS.STONE || blockId === IDS.COAL_ORE || blockId === IDS.COBBLESTONE || blockId === IDS.FURNACE || blockId === IDS.COBBLESTONE_STAIRS || blockId === IDS.COBBLESTONE_STAIRS_LEFT || blockId === IDS.COBBLESTONE_STAIRS_RIGHT) return 1;
        if (blockId === IDS.IRON_ORE || blockId === IDS.VOID_STONE_BRICK) return 2;
        if (blockId === IDS.GOLD_ORE || blockId === IDS.DIAMOND_ORE || blockId === IDS.EMERALD_ORE || blockId === IDS.ASTRAL_INFUSER) return 3;
        return 0;
    }

    export const BLOCK_CRACK_STAGES = [
        // Stage 0: 0% - 10% (Fine center impact fracture)
        [[8,8], [7,8], [8,7], [9,8], [8,9]],
        // Stage 1: 10% - 20%
        [[8,8], [7,8], [8,7], [9,8], [8,9], [6,8], [8,6], [10,8], [8,10], [7,7], [9,9]],
        // Stage 2: 20% - 30%
        [[8,8], [7,8], [8,7], [9,8], [8,9], [6,8], [8,6], [10,8], [8,10], [7,7], [9,9], [6,6], [5,6], [10,10], [11,10], [9,7], [10,6], [7,9], [6,10]],
        // Stage 3: 30% - 40%
        [[8,8], [7,8], [8,7], [9,8], [8,9], [6,8], [8,6], [10,8], [8,10], [7,7], [9,9], [6,6], [5,6], [10,10], [11,10], [9,7], [10,6], [7,9], [6,10], [5,5], [4,5], [11,11], [12,11], [11,5], [12,5], [5,11], [4,11], [8,5], [8,11]],
        // Stage 4: 40% - 50%
        [[8,8], [7,8], [8,7], [9,8], [8,9], [6,8], [8,6], [10,8], [8,10], [7,7], [9,9], [6,6], [5,6], [10,10], [11,10], [9,7], [10,6], [7,9], [6,10], [5,5], [4,5], [11,11], [12,11], [11,5], [12,5], [5,11], [4,11], [8,5], [8,11], [3,5], [2,5], [13,11], [13,12], [13,4], [13,3], [4,12], [3,12], [8,4], [8,3], [9,4], [6,11], [6,12]],
        // Stage 5: 50% - 60%
        [[8,8], [7,8], [8,7], [9,8], [8,9], [6,8], [8,6], [10,8], [8,10], [7,7], [9,9], [6,6], [5,6], [10,10], [11,10], [9,7], [10,6], [7,9], [6,10], [5,5], [4,5], [11,11], [12,11], [11,5], [12,5], [5,11], [4,11], [8,5], [8,11], [3,5], [2,5], [13,11], [13,12], [13,4], [13,3], [4,12], [3,12], [8,4], [8,3], [9,4], [6,11], [6,12], [1,5], [0,5], [14,12], [14,13], [14,3], [14,2], [3,13], [2,13], [7,3], [6,3], [10,4], [10,3], [10,11], [11,12]],
        // Stage 6: 60% - 70%
        [[8,8], [7,8], [8,7], [9,8], [8,9], [6,8], [8,6], [10,8], [8,10], [7,7], [9,9], [6,6], [5,6], [10,10], [11,10], [9,7], [10,6], [7,9], [6,10], [5,5], [4,5], [11,11], [12,11], [11,5], [12,5], [5,11], [4,11], [8,5], [8,11], [3,5], [2,5], [13,11], [13,12], [13,4], [13,3], [4,12], [3,12], [8,4], [8,3], [9,4], [6,11], [6,12], [1,5], [0,5], [14,12], [14,13], [14,3], [14,2], [3,13], [2,13], [7,3], [6,3], [10,4], [10,3], [10,11], [11,12], [15,2], [15,13], [1,13], [8,2], [8,1], [5,3], [4,2], [11,3], [12,2], [2,8], [3,8], [4,8], [12,8], [13,8], [14,8]],
        // Stage 7: 70% - 80%
        [[8,8], [7,8], [8,7], [9,8], [8,9], [6,8], [8,6], [10,8], [8,10], [7,7], [9,9], [6,6], [5,6], [10,10], [11,10], [9,7], [10,6], [7,9], [6,10], [5,5], [4,5], [11,11], [12,11], [11,5], [12,5], [5,11], [4,11], [8,5], [8,11], [3,5], [2,5], [13,11], [13,12], [13,4], [13,3], [4,12], [3,12], [8,4], [8,3], [9,4], [6,11], [6,12], [1,5], [0,5], [14,12], [14,13], [14,3], [14,2], [3,13], [2,13], [7,3], [6,3], [10,4], [10,3], [10,11], [11,12], [15,2], [15,13], [1,13], [8,2], [8,1], [5,3], [4,2], [11,3], [12,2], [2,8], [3,8], [4,8], [12,8], [13,8], [14,8], [3,2], [2,2], [13,1], [14,1], [1,14], [0,14], [8,12], [8,13], [8,14], [6,5], [5,4], [10,9], [11,9], [9,10], [9,11]],
        // Stage 8: 80% - 90%
        [[8,8], [7,8], [8,7], [9,8], [8,9], [6,8], [8,6], [10,8], [8,10], [7,7], [9,9], [6,6], [5,6], [10,10], [11,10], [9,7], [10,6], [7,9], [6,10], [5,5], [4,5], [11,11], [12,11], [11,5], [12,5], [5,11], [4,11], [8,5], [8,11], [3,5], [2,5], [13,11], [13,12], [13,4], [13,3], [4,12], [3,12], [8,4], [8,3], [9,4], [6,11], [6,12], [1,5], [0,5], [14,12], [14,13], [14,3], [14,2], [3,13], [2,13], [7,3], [6,3], [10,4], [10,3], [10,11], [11,12], [15,2], [15,13], [1,13], [8,2], [8,1], [5,3], [4,2], [11,3], [12,2], [2,8], [3,8], [4,8], [12,8], [13,8], [14,8], [3,2], [2,2], [13,1], [14,1], [1,14], [0,14], [8,12], [8,13], [8,14], [6,5], [5,4], [10,9], [11,9], [9,10], [9,11], [1,2], [0,2], [8,0], [8,15], [15,1], [15,8], [15,14], [4,6], [3,7], [12,6], [13,7], [4,10], [3,9], [12,10], [13,9]],
        // Stage 9: 90% - 100%
        [[8,8], [7,8], [8,7], [9,8], [8,9], [6,8], [8,6], [10,8], [8,10], [7,7], [9,9], [6,6], [5,6], [10,10], [11,10], [9,7], [10,6], [7,9], [6,10], [5,5], [4,5], [11,11], [12,11], [11,5], [12,5], [5,11], [4,11], [8,5], [8,11], [3,5], [2,5], [13,11], [13,12], [13,4], [13,3], [4,12], [3,12], [8,4], [8,3], [9,4], [6,11], [6,12], [1,5], [0,5], [14,12], [14,13], [14,3], [14,2], [3,13], [2,13], [7,3], [6,3], [10,4], [10,3], [10,11], [11,12], [15,2], [15,13], [1,13], [8,2], [8,1], [5,3], [4,2], [11,3], [12,2], [2,8], [3,8], [4,8], [12,8], [13,8], [14,8], [3,2], [2,2], [13,1], [14,1], [1,14], [0,14], [8,12], [8,13], [8,14], [6,5], [5,4], [10,9], [11,9], [9,10], [9,11], [1,2], [0,2], [8,0], [8,15], [15,1], [15,8], [15,14], [4,6], [3,7], [12,6], [13,7], [4,10], [3,9], [12,10], [13,9], [1,1], [0,1], [14,0], [15,0], [0,15], [1,15], [14,15], [15,15], [7,1], [6,1], [9,1], [10,1], [7,14], [6,14], [9,14], [10,14], [2,4], [1,3], [14,4], [13,5], [2,11], [1,12], [14,11], [13,10]]
    ];

    export const BLOCK_CRACK_SEGMENTS = [
        // Stage 0: 0% - 10% (Center impact star)
        [
            [0.48, 0.50, 0.44, 0.44], [0.48, 0.50, 0.54, 0.56],
            [0.48, 0.50, 0.54, 0.44], [0.48, 0.50, 0.43, 0.56]
        ],
        // Stage 1: 10% - 20%
        [
            [0.48, 0.50, 0.44, 0.44], [0.48, 0.50, 0.54, 0.56],
            [0.48, 0.50, 0.54, 0.44], [0.48, 0.50, 0.43, 0.56],
            [0.44, 0.44, 0.38, 0.42], [0.54, 0.56, 0.60, 0.62],
            [0.54, 0.44, 0.60, 0.38], [0.43, 0.56, 0.38, 0.64]
        ],
        // Stage 2: 20% - 30%
        [
            [0.48, 0.50, 0.44, 0.44], [0.48, 0.50, 0.54, 0.56],
            [0.48, 0.50, 0.54, 0.44], [0.48, 0.50, 0.43, 0.56],
            [0.44, 0.44, 0.38, 0.42], [0.54, 0.56, 0.60, 0.62],
            [0.54, 0.44, 0.60, 0.38], [0.43, 0.56, 0.38, 0.64],
            [0.38, 0.42, 0.32, 0.35], [0.60, 0.62, 0.68, 0.60],
            [0.60, 0.38, 0.68, 0.32], [0.38, 0.64, 0.30, 0.72],
            [0.44, 0.44, 0.46, 0.34]
        ],
        // Stage 3: 30% - 40%
        [
            [0.48, 0.50, 0.44, 0.44], [0.48, 0.50, 0.54, 0.56],
            [0.48, 0.50, 0.54, 0.44], [0.48, 0.50, 0.43, 0.56],
            [0.44, 0.44, 0.38, 0.42], [0.54, 0.56, 0.60, 0.62],
            [0.54, 0.44, 0.60, 0.38], [0.43, 0.56, 0.38, 0.64],
            [0.38, 0.42, 0.32, 0.35], [0.60, 0.62, 0.68, 0.60],
            [0.60, 0.38, 0.68, 0.32], [0.38, 0.64, 0.30, 0.72],
            [0.44, 0.44, 0.46, 0.34], [0.32, 0.35, 0.24, 0.28],
            [0.68, 0.60, 0.76, 0.70], [0.68, 0.32, 0.78, 0.26],
            [0.30, 0.72, 0.24, 0.80], [0.54, 0.56, 0.52, 0.68],
            [0.38, 0.42, 0.46, 0.34]
        ],
        // Stage 4: 40% - 50%
        [
            [0.48, 0.50, 0.44, 0.44], [0.48, 0.50, 0.54, 0.56],
            [0.48, 0.50, 0.54, 0.44], [0.48, 0.50, 0.43, 0.56],
            [0.44, 0.44, 0.38, 0.42], [0.54, 0.56, 0.60, 0.62],
            [0.54, 0.44, 0.60, 0.38], [0.43, 0.56, 0.38, 0.64],
            [0.38, 0.42, 0.32, 0.35], [0.60, 0.62, 0.68, 0.60],
            [0.60, 0.38, 0.68, 0.32], [0.38, 0.64, 0.30, 0.72],
            [0.44, 0.44, 0.46, 0.34], [0.32, 0.35, 0.24, 0.28],
            [0.68, 0.60, 0.76, 0.70], [0.68, 0.32, 0.78, 0.26],
            [0.30, 0.72, 0.24, 0.80], [0.54, 0.56, 0.52, 0.68],
            [0.38, 0.42, 0.46, 0.34], [0.24, 0.28, 0.18, 0.22],
            [0.76, 0.70, 0.84, 0.78], [0.78, 0.26, 0.86, 0.20],
            [0.24, 0.80, 0.16, 0.86], [0.32, 0.35, 0.22, 0.44],
            [0.68, 0.60, 0.78, 0.52], [0.46, 0.34, 0.48, 0.18],
            [0.52, 0.68, 0.54, 0.84]
        ],
        // Stage 5: 50% - 60%
        [
            [0.48, 0.50, 0.44, 0.44], [0.48, 0.50, 0.54, 0.56],
            [0.48, 0.50, 0.54, 0.44], [0.48, 0.50, 0.43, 0.56],
            [0.44, 0.44, 0.38, 0.42], [0.54, 0.56, 0.60, 0.62],
            [0.54, 0.44, 0.60, 0.38], [0.43, 0.56, 0.38, 0.64],
            [0.38, 0.42, 0.32, 0.35], [0.60, 0.62, 0.68, 0.60],
            [0.60, 0.38, 0.68, 0.32], [0.38, 0.64, 0.30, 0.72],
            [0.44, 0.44, 0.46, 0.34], [0.32, 0.35, 0.24, 0.28],
            [0.68, 0.60, 0.76, 0.70], [0.68, 0.32, 0.78, 0.26],
            [0.30, 0.72, 0.24, 0.80], [0.54, 0.56, 0.52, 0.68],
            [0.38, 0.42, 0.46, 0.34], [0.24, 0.28, 0.18, 0.22],
            [0.76, 0.70, 0.84, 0.78], [0.78, 0.26, 0.86, 0.20],
            [0.24, 0.80, 0.16, 0.86], [0.32, 0.35, 0.22, 0.44],
            [0.68, 0.60, 0.78, 0.52], [0.46, 0.34, 0.48, 0.18],
            [0.52, 0.68, 0.54, 0.84], [0.18, 0.22, 0.10, 0.14],
            [0.84, 0.78, 0.92, 0.86], [0.86, 0.20, 0.94, 0.12],
            [0.16, 0.86, 0.10, 0.92], [0.22, 0.44, 0.12, 0.48],
            [0.78, 0.52, 0.88, 0.50], [0.60, 0.38, 0.78, 0.52],
            [0.38, 0.64, 0.22, 0.44]
        ],
        // Stage 6: 60% - 70%
        [
            [0.48, 0.50, 0.44, 0.44], [0.48, 0.50, 0.54, 0.56],
            [0.48, 0.50, 0.54, 0.44], [0.48, 0.50, 0.43, 0.56],
            [0.44, 0.44, 0.38, 0.42], [0.54, 0.56, 0.60, 0.62],
            [0.54, 0.44, 0.60, 0.38], [0.43, 0.56, 0.38, 0.64],
            [0.38, 0.42, 0.32, 0.35], [0.60, 0.62, 0.68, 0.60],
            [0.60, 0.38, 0.68, 0.32], [0.38, 0.64, 0.30, 0.72],
            [0.44, 0.44, 0.46, 0.34], [0.32, 0.35, 0.24, 0.28],
            [0.68, 0.60, 0.76, 0.70], [0.68, 0.32, 0.78, 0.26],
            [0.30, 0.72, 0.24, 0.80], [0.54, 0.56, 0.52, 0.68],
            [0.38, 0.42, 0.46, 0.34], [0.24, 0.28, 0.18, 0.22],
            [0.76, 0.70, 0.84, 0.78], [0.78, 0.26, 0.86, 0.20],
            [0.24, 0.80, 0.16, 0.86], [0.32, 0.35, 0.22, 0.44],
            [0.68, 0.60, 0.78, 0.52], [0.46, 0.34, 0.48, 0.18],
            [0.52, 0.68, 0.54, 0.84], [0.18, 0.22, 0.10, 0.14],
            [0.84, 0.78, 0.92, 0.86], [0.86, 0.20, 0.94, 0.12],
            [0.16, 0.86, 0.10, 0.92], [0.22, 0.44, 0.12, 0.48],
            [0.78, 0.52, 0.88, 0.50], [0.60, 0.38, 0.78, 0.52],
            [0.38, 0.64, 0.22, 0.44], [0.10, 0.14, 0.04, 0.0],
            [0.92, 0.86, 1.0, 0.92], [0.94, 0.12, 1.0, 0.08],
            [0.10, 0.92, 0.08, 1.0], [0.48, 0.18, 0.50, 0.0],
            [0.54, 0.84, 0.52, 1.0], [0.12, 0.48, 0.0, 0.50],
            [0.88, 0.50, 1.0, 0.52]
        ],
        // Stage 7: 70% - 80%
        [
            [0.48, 0.50, 0.44, 0.44], [0.48, 0.50, 0.54, 0.56],
            [0.48, 0.50, 0.54, 0.44], [0.48, 0.50, 0.43, 0.56],
            [0.44, 0.44, 0.38, 0.42], [0.54, 0.56, 0.60, 0.62],
            [0.54, 0.44, 0.60, 0.38], [0.43, 0.56, 0.38, 0.64],
            [0.38, 0.42, 0.32, 0.35], [0.60, 0.62, 0.68, 0.60],
            [0.60, 0.38, 0.68, 0.32], [0.38, 0.64, 0.30, 0.72],
            [0.44, 0.44, 0.46, 0.34], [0.32, 0.35, 0.24, 0.28],
            [0.68, 0.60, 0.76, 0.70], [0.68, 0.32, 0.78, 0.26],
            [0.30, 0.72, 0.24, 0.80], [0.54, 0.56, 0.52, 0.68],
            [0.38, 0.42, 0.46, 0.34], [0.24, 0.28, 0.18, 0.22],
            [0.76, 0.70, 0.84, 0.78], [0.78, 0.26, 0.86, 0.20],
            [0.24, 0.80, 0.16, 0.86], [0.32, 0.35, 0.22, 0.44],
            [0.68, 0.60, 0.78, 0.52], [0.46, 0.34, 0.48, 0.18],
            [0.52, 0.68, 0.54, 0.84], [0.18, 0.22, 0.10, 0.14],
            [0.84, 0.78, 0.92, 0.86], [0.86, 0.20, 0.94, 0.12],
            [0.16, 0.86, 0.10, 0.92], [0.22, 0.44, 0.12, 0.48],
            [0.78, 0.52, 0.88, 0.50], [0.60, 0.38, 0.78, 0.52],
            [0.38, 0.64, 0.22, 0.44], [0.10, 0.14, 0.04, 0.0],
            [0.92, 0.86, 1.0, 0.92], [0.94, 0.12, 1.0, 0.08],
            [0.10, 0.92, 0.08, 1.0], [0.48, 0.18, 0.50, 0.0],
            [0.54, 0.84, 0.52, 1.0], [0.12, 0.48, 0.0, 0.50],
            [0.88, 0.50, 1.0, 0.52], [0.18, 0.22, 0.0, 0.24],
            [0.84, 0.78, 0.86, 1.0], [0.86, 0.20, 0.88, 0.0],
            [0.16, 0.86, 0.0, 0.84], [0.32, 0.35, 0.46, 0.34],
            [0.68, 0.60, 0.52, 0.68], [0.48, 0.18, 0.68, 0.32],
            [0.52, 0.68, 0.30, 0.72]
        ],
        // Stage 8: 80% - 90%
        [
            [0.48, 0.50, 0.44, 0.44], [0.48, 0.50, 0.54, 0.56],
            [0.48, 0.50, 0.54, 0.44], [0.48, 0.50, 0.43, 0.56],
            [0.44, 0.44, 0.38, 0.42], [0.54, 0.56, 0.60, 0.62],
            [0.54, 0.44, 0.60, 0.38], [0.43, 0.56, 0.38, 0.64],
            [0.38, 0.42, 0.32, 0.35], [0.60, 0.62, 0.68, 0.60],
            [0.60, 0.38, 0.68, 0.32], [0.38, 0.64, 0.30, 0.72],
            [0.44, 0.44, 0.46, 0.34], [0.32, 0.35, 0.24, 0.28],
            [0.68, 0.60, 0.76, 0.70], [0.68, 0.32, 0.78, 0.26],
            [0.30, 0.72, 0.24, 0.80], [0.54, 0.56, 0.52, 0.68],
            [0.38, 0.42, 0.46, 0.34], [0.24, 0.28, 0.18, 0.22],
            [0.76, 0.70, 0.84, 0.78], [0.78, 0.26, 0.86, 0.20],
            [0.24, 0.80, 0.16, 0.86], [0.32, 0.35, 0.22, 0.44],
            [0.68, 0.60, 0.78, 0.52], [0.46, 0.34, 0.48, 0.18],
            [0.52, 0.68, 0.54, 0.84], [0.18, 0.22, 0.10, 0.14],
            [0.84, 0.78, 0.92, 0.86], [0.86, 0.20, 0.94, 0.12],
            [0.16, 0.86, 0.10, 0.92], [0.22, 0.44, 0.12, 0.48],
            [0.78, 0.52, 0.88, 0.50], [0.60, 0.38, 0.78, 0.52],
            [0.38, 0.64, 0.22, 0.44], [0.10, 0.14, 0.04, 0.0],
            [0.92, 0.86, 1.0, 0.92], [0.94, 0.12, 1.0, 0.08],
            [0.10, 0.92, 0.08, 1.0], [0.48, 0.18, 0.50, 0.0],
            [0.54, 0.84, 0.52, 1.0], [0.12, 0.48, 0.0, 0.50],
            [0.88, 0.50, 1.0, 0.52], [0.18, 0.22, 0.0, 0.24],
            [0.84, 0.78, 0.86, 1.0], [0.86, 0.20, 0.88, 0.0],
            [0.16, 0.86, 0.0, 0.84], [0.32, 0.35, 0.46, 0.34],
            [0.68, 0.60, 0.52, 0.68], [0.48, 0.18, 0.68, 0.32],
            [0.52, 0.68, 0.30, 0.72], [0.24, 0.28, 0.36, 0.14],
            [0.36, 0.14, 0.48, 0.18], [0.76, 0.70, 0.64, 0.86],
            [0.64, 0.86, 0.54, 0.84], [0.78, 0.26, 0.66, 0.12],
            [0.66, 0.12, 0.50, 0.0], [0.24, 0.80, 0.34, 0.90],
            [0.34, 0.90, 0.52, 1.0], [0.10, 0.14, 0.0, 0.10],
            [0.94, 0.12, 0.92, 0.0], [0.10, 0.92, 0.0, 0.94],
            [0.92, 0.86, 0.90, 1.0]
        ],
        // Stage 9: 90% - 100% (Complete intricate shatter)
        [
            [0.48, 0.50, 0.44, 0.44], [0.48, 0.50, 0.54, 0.56],
            [0.48, 0.50, 0.54, 0.44], [0.48, 0.50, 0.43, 0.56],
            [0.44, 0.44, 0.38, 0.42], [0.54, 0.56, 0.60, 0.62],
            [0.54, 0.44, 0.60, 0.38], [0.43, 0.56, 0.38, 0.64],
            [0.38, 0.42, 0.32, 0.35], [0.60, 0.62, 0.68, 0.60],
            [0.60, 0.38, 0.68, 0.32], [0.38, 0.64, 0.30, 0.72],
            [0.44, 0.44, 0.46, 0.34], [0.32, 0.35, 0.24, 0.28],
            [0.68, 0.60, 0.76, 0.70], [0.68, 0.32, 0.78, 0.26],
            [0.30, 0.72, 0.24, 0.80], [0.54, 0.56, 0.52, 0.68],
            [0.38, 0.42, 0.46, 0.34], [0.24, 0.28, 0.18, 0.22],
            [0.76, 0.70, 0.84, 0.78], [0.78, 0.26, 0.86, 0.20],
            [0.24, 0.80, 0.16, 0.86], [0.32, 0.35, 0.22, 0.44],
            [0.68, 0.60, 0.78, 0.52], [0.46, 0.34, 0.48, 0.18],
            [0.52, 0.68, 0.54, 0.84], [0.18, 0.22, 0.10, 0.14],
            [0.84, 0.78, 0.92, 0.86], [0.86, 0.20, 0.94, 0.12],
            [0.16, 0.86, 0.10, 0.92], [0.22, 0.44, 0.12, 0.48],
            [0.78, 0.52, 0.88, 0.50], [0.60, 0.38, 0.78, 0.52],
            [0.38, 0.64, 0.22, 0.44], [0.10, 0.14, 0.04, 0.0],
            [0.92, 0.86, 1.0, 0.92], [0.94, 0.12, 1.0, 0.08],
            [0.10, 0.92, 0.08, 1.0], [0.48, 0.18, 0.50, 0.0],
            [0.54, 0.84, 0.52, 1.0], [0.12, 0.48, 0.0, 0.50],
            [0.88, 0.50, 1.0, 0.52], [0.18, 0.22, 0.0, 0.24],
            [0.84, 0.78, 0.86, 1.0], [0.86, 0.20, 0.88, 0.0],
            [0.16, 0.86, 0.0, 0.84], [0.32, 0.35, 0.46, 0.34],
            [0.68, 0.60, 0.52, 0.68], [0.48, 0.18, 0.68, 0.32],
            [0.52, 0.68, 0.30, 0.72], [0.24, 0.28, 0.36, 0.14],
            [0.36, 0.14, 0.48, 0.18], [0.76, 0.70, 0.64, 0.86],
            [0.64, 0.86, 0.54, 0.84], [0.78, 0.26, 0.66, 0.12],
            [0.66, 0.12, 0.50, 0.0], [0.24, 0.80, 0.34, 0.90],
            [0.34, 0.90, 0.52, 1.0], [0.10, 0.14, 0.0, 0.10],
            [0.94, 0.12, 0.92, 0.0], [0.10, 0.92, 0.0, 0.94],
            [0.92, 0.86, 0.90, 1.0], [0.04, 0.0, 0.0, 0.04],
            [1.0, 0.08, 0.94, 0.0], [0.0, 0.94, 0.08, 1.0],
            [1.0, 0.92, 0.90, 1.0], [0.24, 0.28, 0.12, 0.48],
            [0.76, 0.70, 0.88, 0.50], [0.78, 0.26, 0.60, 0.38],
            [0.24, 0.80, 0.38, 0.64]
        ]
    ];

    export function getSelectedMiningTier() {
        const item = inventory[selectedHotbarIndex];
        return item ? (MINING_TOOL_TIERS[item.id] || 0) : 0;
    }

    export function canHarvestBlock(blockId) {
        const requiredTier = getRequiredMiningTier(blockId);
        return requiredTier === 0 || getSelectedMiningTier() >= requiredTier;
    }

    export let isBackgroundBuildMode = false;
    export let bgBuildDarknessAlpha = 0;
    export const BACKGROUND_BUILDING_BLOCKS = new Set([
        IDS.DIRT, IDS.GRASS, IDS.STONE, IDS.COBBLESTONE, IDS.WOOD, IDS.PLANKS,
        IDS.SAND, IDS.SNOW, IDS.WOOL, IDS.WOODEN_STAIRS, IDS.COBBLESTONE_STAIRS,
        IDS.WOODEN_STAIRS_RIGHT, IDS.COBBLESTONE_STAIRS_RIGHT,
        IDS.JUNGLE_WOOD, IDS.JUNGLE_PLANKS,
        IDS.VOID_STONE_BRICK, IDS.PRISM_GLASS
    ]);
    export function isBackgroundBuildingBlock(id) {
        return BACKGROUND_BUILDING_BLOCKS.has(id);
    }
    export function isFoodItem(id) {
        return id === IDS.RAW_PORKCHOP || id === IDS.COOKED_PORKCHOP || id === IDS.APPLE ||
               id === IDS.RAW_CHICKEN || id === IDS.COOKED_CHICKEN || id === IDS.RAW_MUTTON ||
               id === IDS.COOKED_MUTTON || id === IDS.BREAD ||
               id === IDS.RAW_BEEF || id === IDS.COOKED_BEEF || id === IDS.MELON_SLICE ||
               id === IDS.VOID_BERRY || id === IDS.SUNBURST_MELON_SLICE;
    }
    export let surfaceHeights = [];
    export let nonCollidableTreeWood = new Set();
    export function isWoodPartOfTree(wx, wy) {
        if (!world || !world[wx]) return false;
        const b = world[wx][wy];
        if (b !== IDS.WOOD && b !== IDS.JUNGLE_WOOD) return false;
        for (let dx = -4; dx <= 4; dx++) {
            for (let dy = -16; dy <= 4; dy++) {
                const nx = wx + dx;
                const ny = wy + dy;
                if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
                    const leaf = world[nx]?.[ny];
                    if (leaf === IDS.LEAVES || leaf === IDS.JUNGLE_LEAVES) return true;
                }
            }
        }
        return false;
    }
    export function ensureTreeWoodNonCollidable() {
        if (!world || !world.length) return;
        for (let x = 0; x < WORLD_WIDTH; x++) {
            if (!world[x]) continue;
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                const b = world[x][y];
                if ((b === IDS.WOOD || b === IDS.JUNGLE_WOOD) && isWoodPartOfTree(x, y)) {
                    nonCollidableTreeWood.add(`${x}_${y}`);
                }
            }
        }
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
    
    export let isInventoryOpen = false;
    export let hotbarWheelLockUntil = 0;
    export let heldItemIndex = -1; 
    export let heldItemObj = null; 
    export let heldItemDraggedOutside = false;
    export let miningTarget = { x: -1, y: -1, progress: 0 };
    export let tooltipEl = typeof document !== 'undefined' ? document.getElementById('item-tooltip') : null;

    export const textures = {};

    export function generateTexture(id) {
        if (typeof document === 'undefined') return;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 16; tempCanvas.height = 16;
        const tCtx = tempCanvas.getContext('2d');
        const p = (x, y, color) => { tCtx.fillStyle = color; tCtx.fillRect(x, y, 1, 1); };
        const randColor = (colors) => colors[Math.floor(Math.random() * colors.length)];

        const dirtColors = ['#79553a', '#6b4931', '#855d40'];
        const stoneColors = ['#747474', '#6c6c6c', '#7d7d7d', '#636363'];
        const woodColors = ['#452e19', '#3b2613', '#523720'];

        function getStonePixel(px, py) {
            const base = '#737373';
            const light = '#7d7d7d';
            const mid = '#686868';
            const dark = '#5c5c5c';
            const n = ((px * 7 + py * 13 + (px ^ py) * 3) % 17);
            if (n === 0 || n === 5) return dark;
            if (n === 1 || n === 8 || n === 12) return mid;
            if (n === 3 || n === 7 || n === 14) return light;
            return base;
        }

        const ORE_VEIN_MAP = [
            [2, 2, 1], [3, 2, 2], [4, 2, 1],
            [2, 3, 2], [3, 3, 2], [4, 3, 3],
            [3, 4, 3],
            [10, 2, 1], [11, 2, 2], [12, 2, 1],
            [9, 3, 1], [10, 3, 2], [11, 3, 2], [12, 3, 3],
            [10, 4, 3], [11, 4, 3],
            [6, 6, 1], [7, 6, 2],
            [5, 7, 1], [6, 7, 2], [7, 7, 2], [8, 7, 3],
            [5, 8, 2], [6, 8, 3], [7, 8, 3],
            [11, 8, 1], [12, 8, 2],
            [10, 9, 1], [11, 9, 2], [12, 9, 3], [13, 9, 3],
            [10, 10, 2], [11, 10, 3], [12, 10, 3],
            [2, 11, 1], [3, 11, 2], [4, 11, 1],
            [2, 12, 2], [3, 12, 2], [4, 12, 3],
            [3, 13, 3], [4, 13, 3],
            [7, 12, 1], [8, 12, 2], [9, 12, 1],
            [7, 13, 2], [8, 13, 3], [9, 13, 3]
        ];

        const ORE_PALETTES = {
            [IDS.COAL_ORE]: { 1: '#3e3e3e', 2: '#222222', 3: '#111111' },
            [IDS.IRON_ORE]: { 1: '#f4d7c5', 2: '#d8af93', 3: '#8a6249' },
            [IDS.GOLD_ORE]: { 1: '#fff99a', 2: '#fcee4b', 3: '#b88d18' },
            [IDS.DIAMOND_ORE]: { 1: '#c8ffff', 2: '#5decf2', 3: '#198c94' },
            [IDS.EMERALD_ORE]: { 1: '#a7f3d0', 2: '#10b981', 3: '#047857' }
        };
        
        function getOakWoodPixel(px, py) {
            // Handcrafted authentic oak log bark with straight vertical bark plates,
            // deep fissure crevices, natural highlight ridges, and occasional bark knot
            const fissureOffset = Math.floor(py / 6) % 2;
            const col = (px + fissureOffset) % 16;
            const isFissure = (col === 0 || col === 4 || col === 9 || col === 13);
            const isSubFissure = (col === 2 && py % 5 === 0) || (col === 11 && py % 4 === 0);
            
            // Natural bark knot on face
            const dx = px - 6;
            const dy = py - 7;
            const knotDist = dx * dx + dy * dy;
            if (knotDist <= 1) return '#20160b'; // knot center
            if (knotDist <= 4) return '#7c6142'; // knot ring highlight
            if (knotDist <= 7) return '#3d2c1a'; // knot shadow ring

            if (isFissure || isSubFissure) {
                return (py % 3 === 0) ? '#22180d' : '#332415'; // Deep bark crevice
            }
            
            const platePos = col % 4;
            const jitter = (px * 13 + py * 7) % 5;
            if (platePos === 1) {
                // Ridge highlight
                return jitter === 0 ? '#8a6e4d' : '#7a6042';
            } else if (platePos === 2) {
                // Warm midtone body
                return jitter < 2 ? '#6c5337' : '#5e472e';
            } else if (platePos === 3) {
                // Secondary shadow
                return '#4f3b25';
            } else {
                return '#43311e';
            }
        }

        function getDirtPixel(px, py) {
            // Rich authentic Minecraft soil: base loam with dark crevices and small lighter pebbles
            const n = ((px * 7 + py * 13 + (px ^ py) * 3) % 23);
            const sub = ((px * 11 + py * 17) % 5);

            // Occasional small pebbles / gravel grains
            if ((px === 3 && py === 5) || (px === 11 && py === 9) || (px === 7 && py === 14) || (px === 14 && py === 2)) {
                return '#9e7956'; // Pebble highlight
            }
            if ((px === 4 && py === 5) || (px === 12 && py === 9) || (px === 8 && py === 14)) {
                return '#8a6544'; // Pebble body
            }
            if ((px === 4 && py === 6) || (px === 12 && py === 10)) {
                return '#50351e'; // Pebble under-shadow
            }

            // Deep soil fissures / dark crevices
            if (n === 0 || n === 7 || n === 15) {
                return sub < 2 ? '#482e1a' : '#573a23';
            }
            // Mid-dark soil
            if (n === 2 || n === 9 || n === 18) {
                return '#68472d';
            }
            // Light loam flecks
            if (n === 4 || n === 12 || n === 20) {
                return sub === 0 ? '#916d4d' : '#856242';
            }
            // Standard rich brown soil body
            return (sub === 1 || sub === 3) ? '#745235' : '#7b583a';
        }

        const GRASS_HANG_DEPTH = [
            4, 4, 5, 6, 5, 4, 3, 5, 7, 6, 4, 3, 4, 6, 5, 4
        ];

        function getGrassBlockPixel(px, py) {
            const hangY = GRASS_HANG_DEPTH[px % 16];

            if (py < hangY) {
                // Inside green grass turf
                const n = ((px * 13 + py * 7 + (px ^ py) * 3) % 17);
                const isHangingTip = (py === hangY - 1 && hangY > 4);
                const isTurfSurface = (py === 0);

                if (isTurfSurface) {
                    // Sunlit top edge highlight
                    if (n === 1 || n === 5 || n === 11) return '#6be845';
                    if (n === 3 || n === 8) return '#58d234';
                    return '#49be28';
                } else if (isHangingTip) {
                    // Hanging blade tip: slightly darker, shadowed green
                    return (n % 2 === 0) ? '#2d781b' : '#368e21';
                } else if (py >= hangY - 2 && hangY >= 5) {
                    // Lower blade body
                    return (n % 3 === 0) ? '#3c9e25' : '#32861e';
                } else {
                    // Rich turf interior
                    if (n === 2 || n === 9) return '#5fd53a';
                    if (n === 0 || n === 6 || n === 14) return '#348d20';
                    return '#42aa28';
                }
            } else if (py === hangY && hangY >= 4) {
                // Darkened soil shadow under hanging blades
                return ((px + py) % 2 === 0) ? '#382313' : '#452c19';
            } else {
                // Rich dirt body below grass
                return getDirtPixel(px, py);
            }
        }

        function getShortGrassPixel(px, py) {
            // Blade 1: Left leaning
            if (px === 2 && py === 8) return '#6ce842';
            if (px === 3 && (py === 9 || py === 10)) return '#46b82b';
            if (px === 4 && (py >= 11 && py <= 15)) return py >= 14 ? '#246b14' : '#3aa523';

            // Blade 2: Left-center
            if (px === 5 && py === 5) return '#6ce842';
            if (px === 5 && (py >= 6 && py <= 8)) return '#5cd934';
            if (px === 6 && (py >= 9 && py <= 13)) return '#46b82b';
            if (px === 6 && (py >= 14 && py <= 15)) return '#1b540f';

            // Blade 3: Center tall spike
            if (px === 8 && py === 3) return '#7cf54e';
            if (px === 8 && (py === 4 || py === 5)) return '#6ce842';
            if (px === 7 && (py >= 5 && py <= 9)) return '#5cd934';
            if (px === 8 && (py >= 6 && py <= 12)) return '#46b82b';
            if (px === 7 && (py >= 10 && py <= 15)) return '#3aa523';
            if (px === 8 && (py >= 13 && py <= 15)) return '#246b14';

            // Blade 4: Right-center
            if (px === 10 && py === 5) return '#6ce842';
            if (px === 10 && (py >= 6 && py <= 8)) return '#5cd934';
            if (px === 9 && (py >= 8 && py <= 13)) return '#46b82b';
            if (px === 9 && (py >= 14 && py <= 15)) return '#1b540f';

            // Blade 5: Right leaning
            if (px === 13 && py === 7) return '#6ce842';
            if (px === 12 && (py >= 8 && py <= 10)) return '#46b82b';
            if (px === 11 && (py >= 10 && py <= 15)) return py >= 14 ? '#246b14' : '#3aa523';

            // Inter-blade cross tufts
            if (px === 7 && py === 12) return '#46b82b';
            if (px === 9 && py === 11) return '#5cd934';
            if (px === 5 && py === 13) return '#3aa523';
            if (px === 10 && py === 13) return '#3aa523';

            return null;
        }

        function getTallGrassPixel(px, py) {
            // Central primary plume
            if (px === 7 && py === 1) return '#7cf54e';
            if ((px === 7 || px === 8) && (py === 2 || py === 3)) return '#6ce842';
            if (px === 6 && (py >= 3 && py <= 6)) return '#5cd934';
            if (px === 7 && (py >= 4 && py <= 10)) return '#46b82b';
            if (px === 8 && (py >= 4 && py <= 9)) return '#5cd934';
            if ((px === 7 || px === 8) && (py >= 11 && py <= 15)) return py >= 14 ? '#1b540f' : '#2e821b';

            // Left arching fronds
            if (px === 4 && py === 3) return '#6ce842';
            if (px === 5 && (py >= 4 && py <= 6)) return '#5cd934';
            if (px === 4 && (py >= 6 && py <= 9)) return '#46b82b';
            if (px === 5 && (py >= 8 && py <= 13)) return '#3aa523';
            if (px === 6 && (py >= 10 && py <= 15)) return '#246b14';

            if (px === 2 && py === 6) return '#6ce842';
            if (px === 3 && (py >= 7 && py <= 10)) return '#46b82b';
            if (px === 4 && (py >= 10 && py <= 15)) return '#3aa523';

            // Right arching fronds
            if (px === 11 && py === 3) return '#6ce842';
            if (px === 10 && (py >= 4 && py <= 6)) return '#5cd934';
            if (px === 11 && (py >= 6 && py <= 9)) return '#46b82b';
            if (px === 10 && (py >= 8 && py <= 13)) return '#3aa523';
            if (px === 9 && (py >= 10 && py <= 15)) return '#246b14';

            if (px === 13 && py === 6) return '#6ce842';
            if (px === 12 && (py >= 7 && py <= 10)) return '#46b82b';
            if (px === 11 && (py >= 10 && py <= 15)) return '#3aa523';

            // Secondary inner density
            if (px === 6 && (py === 7 || py === 8)) return '#46b82b';
            if (px === 9 && (py === 7 || py === 8)) return '#5cd934';
            if (px === 8 && py === 10) return '#3aa523';

            return null;
        }

        function getPlowedDirtPixel(px, py) {
            // Farmland block: standard authentic dirt below with a darker brown tilled space above
            if (py >= 4) {
                return getDirtPixel(px, py);
            }
            // Top tilled soil surface (py: 0..3) - darker brown space above with furrow texture
            if (py === 0) {
                const furrow = px % 4;
                if (furrow === 0) return '#2e190b'; // Dark furrow trough
                if (furrow === 1) return '#452914'; // Furrow slope
                if (furrow === 2) return '#59381c'; // Crest highlight
                return '#4d3018'; // Shoulder
            } else if (py === 1) {
                const furrow = (px + 1) % 4;
                if (furrow === 0) return '#281509';
                if (furrow === 2) return '#4f311a';
                return '#3f2512';
            } else if (py === 2) {
                const n = ((px * 7 + 3) % 5);
                if (n === 0) return '#331e0f';
                if (n === 2) return '#4d311b';
                return '#412714';
            } else {
                // py === 3: subtle transition seam into dirt below
                const sub = (px * 3) % 4;
                if (sub === 0) return '#382010';
                if (sub === 1) return '#482d19';
                return getDirtPixel(px, py);
            }
        }

        function getWheatStage1Pixel(px, py) {
            // Stage 1: Delicate tender green shoots sprouting from dark soil (height 3-5px)
            // Sprout 1 (px 2-3, py 12-15)
            if (px === 2 && py === 12) return '#a3e635'; // Chartreuse sunlit shoot tip
            if (px === 3 && py === 12) return '#84cc16';
            if (px === 2 && py === 13) return '#4ade80';
            if (px === 3 && py === 13) return '#22c55e';
            if (px === 3 && py === 14) return '#16a34a';
            if (px === 3 && py === 15) return '#15803d';
            if (px === 2 && py === 15) return '#9e8548'; // Seed hull at soil line

            // Sprout 2 (px 6-7, py 11-15, slightly taller shoot with twin blades)
            if (px === 7 && py === 11) return '#a3e635'; // Sunlit tip
            if (px === 6 && py === 12) return '#84cc16';
            if (px === 7 && py === 12) return '#4ade80';
            if (px === 6 && py === 13) return '#22c55e';
            if (px === 7 && py === 13) return '#22c55e';
            if (px === 8 && py === 13) return '#4ade80'; // Branching blade
            if (px === 7 && (py === 14 || py === 15)) return py === 15 ? '#15803d' : '#16a34a';
            if (px === 6 && py === 15) return '#9e8548';

            // Sprout 3 (px 10-11, py 12-15)
            if (px === 10 && py === 12) return '#a3e635';
            if (px === 11 && py === 12) return '#84cc16';
            if (px === 10 && py === 13) return '#22c55e';
            if (px === 11 && py === 13) return '#4ade80';
            if (px === 10 && py === 14) return '#16a34a';
            if (px === 10 && py === 15) return '#15803d';

            // Sprout 4 (px 13-14, py 12-15)
            if (px === 14 && py === 12) return '#a3e635';
            if (px === 13 && py === 13) return '#84cc16';
            if (px === 14 && py === 13) return '#22c55e';
            if (px === 13 && py === 14) return '#16a34a';
            if (px === 14 && py === 15) return '#15803d';
            if (px === 13 && py === 15) return '#9e8548';

            return null;
        }

        function getWheatStage2Pixel(px, py) {
            // Stage 2: Bushy tillering wheat foliage with arching blades (height 8-10px)
            // Left bunch (px 2..5, py 8..15)
            if (px === 3 && py === 8) return '#7cf54e'; // Left sunlit blade tip
            if (px === 2 && py === 9) return '#6ce842';
            if (px === 3 && py === 9) return '#5cd934';
            if (px === 2 && py === 10) return '#46b82b';
            if (px === 3 && (py >= 10 && py <= 12)) return '#3aa523';
            if (px === 4 && py === 11) return '#5cd934'; // Inner blade
            if (px === 4 && py === 12) return '#46b82b';
            if ((px === 3 || px === 4) && (py >= 13 && py <= 15)) return py >= 15 ? '#15803d' : '#246b14';

            // Center primary plume (px 6..9, py 6..15)
            if (px === 7 && py === 6) return '#86efac'; // Highest central sunlit tip
            if ((px === 7 || px === 8) && py === 7) return '#6ce842';
            if (px === 6 && py === 8) return '#5cd934';
            if (px === 7 && (py >= 8 && py <= 10)) return '#46b82b';
            if (px === 8 && (py >= 8 && py <= 11)) return '#5cd934';
            if (px === 9 && py === 9) return '#6ce842'; // Right arching frond
            if (px === 9 && py === 10) return '#46b82b';
            if (px === 6 && py === 11) return '#3aa523';
            if ((px === 7 || px === 8) && (py >= 11 && py <= 15)) return py >= 14 ? '#14532d' : '#1e6a14';

            // Right bunch (px 11..14, py 7..15)
            if (px === 12 && py === 7) return '#7cf54e';
            if (px === 13 && py === 8) return '#6ce842';
            if (px === 12 && (py === 8 || py === 9)) return '#5cd934';
            if (px === 11 && py === 9) return '#6ce842'; // Inward arching blade
            if (px === 11 && py === 10) return '#46b82b';
            if (px === 13 && py === 10) return '#46b82b';
            if (px === 12 && (py >= 10 && py <= 12)) return '#3aa523';
            if ((px === 12 || px === 13) && (py >= 13 && py <= 15)) return py >= 15 ? '#15803d' : '#246b14';

            // Additional ground filler blades
            if (px === 5 && py === 13) return '#3aa523';
            if (px === 10 && py === 13) return '#3aa523';

            return null;
        }

        function getWheatStage3Pixel(px, py) {
            // Stage 3: Tall jointed stalks with developing golden-amber grain heads and awns (height 14px)
            // Left stalk & developing ear (px 2..5, py 2..15)
            if (px === 3 && py === 2) return '#fde047'; // Awn whisker tip
            if (px === 4 && py === 3) return '#facc15';
            if (px === 3 && (py === 3 || py === 4)) return '#eab308'; // Young golden ear
            if (px === 4 && py === 4) return '#ca8a04';
            if (px === 3 && py === 5) return '#ca8a04';
            if (px === 4 && py === 5) return '#a16207'; // Ear base crease
            if (px === 2 && py === 5) return '#84cc16'; // Flag leaf curling left
            if (px === 2 && py === 6) return '#65a30d';
            // Stem below ear
            if (px === 3 && (py >= 6 && py <= 8)) return '#84cc16';
            if (px === 4 && (py >= 6 && py <= 9)) return '#65a30d';
            if (px === 3 && (py >= 9 && py <= 12)) return '#22c55e';
            if (px === 4 && (py >= 10 && py <= 13)) return '#16a34a';
            if ((px === 3 || px === 4) && (py >= 14 && py <= 15)) return '#15803d';

            // Center primary stalk & prominent ear (px 6..10, py 1..15)
            if (px === 8 && py === 1) return '#fef08a'; // Sunlit center awn tip
            if (px === 7 && py === 2) return '#fde047';
            if (px === 8 && py === 2) return '#facc15';
            if (px === 7 && (py === 3 || py === 4)) return '#facc15';
            if (px === 8 && (py === 3 || py === 4)) return '#eab308';
            if (px === 9 && py === 3) return '#fde047'; // Right awn
            if (px === 9 && py === 4) return '#ca8a04';
            if (px === 7 && py === 5) return '#ca8a04';
            if (px === 8 && py === 5) return '#a16207';
            // Flag leaves spreading outward
            if (px === 6 && py === 6) return '#84cc16';
            if (px === 9 && py === 6) return '#84cc16';
            if (px === 5 && py === 7) return '#65a30d';
            if (px === 10 && py === 7) return '#65a30d';
            // Stem descending
            if (px === 7 && (py >= 6 && py <= 9)) return '#84cc16';
            if (px === 8 && (py >= 6 && py <= 9)) return '#65a30d';
            if (px === 7 && (py >= 10 && py <= 12)) return '#22c55e';
            if (px === 8 && (py >= 10 && py <= 13)) return '#16a34a';
            if ((px === 7 || px === 8) && (py >= 14 && py <= 15)) return '#15803d';

            // Right stalk & developing ear (px 11..14, py 2..15)
            if (px === 13 && py === 2) return '#fde047';
            if (px === 12 && py === 3) return '#facc15';
            if (px === 13 && py === 3) return '#eab308';
            if (px === 12 && (py === 4 || py === 5)) return '#eab308';
            if (px === 13 && (py === 4 || py === 5)) return '#ca8a04';
            if (px === 14 && py === 6) return '#84cc16'; // Leaf
            if (px === 12 && (py >= 6 && py <= 8)) return '#84cc16';
            if (px === 13 && (py >= 6 && py <= 9)) return '#65a30d';
            if (px === 12 && (py >= 9 && py <= 12)) return '#22c55e';
            if (px === 13 && (py >= 10 && py <= 13)) return '#16a34a';
            if ((px === 12 || px === 13) && (py >= 14 && py <= 15)) return '#15803d';

            // Lower connecting foliage blades
            if (px === 5 && (py === 11 || py === 12)) return '#16a34a';
            if (px === 10 && (py === 11 || py === 12)) return '#16a34a';

            return null;
        }

        function getWheatStage4Pixel(px, py) {
            // Stage 4: Majestic fully ripe golden wheat with heavy nodding grain ears, fine awn whiskers & individual kernels
            // Left nodding ear & awns (px 1..5, py 1..15)
            if (px === 2 && py === 1) return '#fef08a';
            if (px === 4 && py === 1) return '#fde047';
            if (px === 1 && py === 2) return '#fde047';
            if (px === 3 && py === 2) return '#fef9c3'; // Top kernel highlight
            if (px === 2 && py === 3) return '#fde047';
            if (px === 3 && py === 3) return '#eab308';
            if (px === 4 && py === 3) return '#ca8a04';
            if (px === 2 && py === 4) return '#eab308';
            if (px === 3 && py === 4) return '#fde047'; // Mid kernel highlight
            if (px === 4 && py === 4) return '#854d0e'; // Kernel separation shadow
            if (px === 2 && py === 5) return '#ca8a04';
            if (px === 3 && py === 5) return '#eab308';
            if (px === 4 && py === 5) return '#f59e0b';
            if (px === 3 && py === 6) return '#ca8a04';
            if (px === 4 && py === 6) return '#854d0e';
            // Left straw & arching dry blade
            if (px === 1 && py === 7) return '#fde047';
            if (px === 2 && py === 7) return '#ca8a04';
            if (px === 3 && (py >= 7 && py <= 10)) return '#eab308';
            if (px === 4 && (py >= 7 && py <= 11)) return '#ca8a04';
            if (px === 3 && (py >= 11 && py <= 15)) return py >= 14 ? '#78350f' : '#a16207';
            if (px === 4 && (py >= 12 && py <= 15)) return py >= 14 ? '#78350f' : '#92400e';

            // Central heavy ripe ear (px 6..10, py 0..15)
            // Long fanning sunlit awn whiskers (py 0..1)
            if ((px === 7 || px === 9) && py === 0) return '#fef9c3';
            if ((px === 6 || px === 8 || px === 10) && py === 1) return '#fde047';
            if (px === 7 && py === 1) return '#fef9c3';
            // Dense golden kernel head (py 2..7)
            if (px === 8 && py === 2) return '#fef9c3'; // Crown highlight
            if (px === 7 && py === 2) return '#fde047';
            if (px === 9 && py === 2) return '#ca8a04';
            if (px === 7 && py === 3) return '#facc15';
            if (px === 8 && py === 3) return '#eab308';
            if (px === 9 && py === 3) return '#854d0e'; // Shadow notch
            if (px === 6 && py === 4) return '#fde047';
            if (px === 7 && py === 4) return '#fef08a'; // Kernel highlight
            if (px === 8 && py === 4) return '#eab308';
            if (px === 9 && py === 4) return '#ca8a04';
            if (px === 7 && py === 5) return '#eab308';
            if (px === 8 && py === 5) return '#facc15';
            if (px === 9 && py === 5) return '#854d0e';
            if (px === 7 && py === 6) return '#ca8a04';
            if (px === 8 && py === 6) return '#eab308';
            if (px === 9 && py === 6) return '#713f12'; // Ear base knot
            // Center straw & dried chaff blades
            if (px === 6 && py === 7) return '#ca8a04';
            if (px === 10 && py === 7) return '#ca8a04';
            if (px === 7 && (py >= 7 && py <= 10)) return '#f59e0b';
            if (px === 8 && (py >= 7 && py <= 11)) return '#ca8a04';
            if (px === 7 && (py >= 11 && py <= 15)) return py >= 14 ? '#78350f' : '#a16207';
            if (px === 8 && (py >= 12 && py <= 15)) return py >= 14 ? '#78350f' : '#92400e';

            // Right nodding ear & awns (px 11..15, py 1..15)
            // Awns
            if (px === 12 && py === 1) return '#fde047';
            if (px === 14 && py === 1) return '#fef08a';
            if (px === 15 && py === 2) return '#fde047';
            // Right plump ear (py 2..7)
            if (px === 13 && py === 2) return '#fef9c3';
            if (px === 12 && py === 3) return '#ca8a04';
            if (px === 13 && py === 3) return '#eab308';
            if (px === 14 && py === 3) return '#fde047';
            if (px === 12 && py === 4) return '#854d0e';
            if (px === 13 && py === 4) return '#fef08a';
            if (px === 14 && py === 4) return '#eab308';
            if (px === 12 && py === 5) return '#f59e0b';
            if (px === 13 && py === 5) return '#eab308';
            if (px === 14 && py === 5) return '#ca8a04';
            if (px === 12 && py === 6) return '#854d0e';
            if (px === 13 && py === 6) return '#ca8a04';
            // Right straw
            if (px === 14 && py === 7) return '#fde047';
            if (px === 12 && (py >= 7 && py <= 11)) return '#ca8a04';
            if (px === 13 && (py >= 7 && py <= 10)) return '#eab308';
            if (px === 12 && (py >= 12 && py <= 15)) return py >= 14 ? '#78350f' : '#92400e';
            if (px === 13 && (py >= 11 && py <= 15)) return py >= 14 ? '#78350f' : '#a16207';

            // Inter-stalk dry straw blades
            if (px === 5 && (py === 12 || py === 13)) return '#a16207';
            if (px === 10 && (py === 12 || py === 13)) return '#a16207';

            return null;
        }

        for (let x = 0; x < 16; x++) {
            for (let y = 0; y < 16; y++) {
                if (id === IDS.DIRT) p(x, y, getDirtPixel(x, y));
                else if (id === IDS.PLOWED_DIRT) {
                    p(x, y, getPlowedDirtPixel(x, y));
                }
                else if (id === IDS.GRASS) p(x, y, getGrassBlockPixel(x, y));
                else if (id === IDS.STONE || id === IDS.COAL_ORE || id === IDS.IRON_ORE || id === IDS.GOLD_ORE || id === IDS.DIAMOND_ORE || id === IDS.EMERALD_ORE) {
                    p(x, y, getStonePixel(x, y));
                }
                else if (id === IDS.COBBLESTONE) {
                    let c = stoneColors[(Math.floor(x/3) + Math.floor(y/3)) % stoneColors.length];
                    if (x%4===0 || y%4===0) c = '#4a4a4a'; p(x, y, c);
                }
                else if (id === IDS.WOOD) {
                    p(x, y, getOakWoodPixel(x, y));
                }
                else if (id === IDS.PLANKS) {
                    let c = ['#9e7b4f', '#a68254'][x%2];
                    if (y % 4 === 0 || (y%4===2 && x%8===0)) c = '#59442a'; p(x, y, c);
                }
                else if (id === IDS.LEAVES) {
                    if(Math.random() > 0.15) p(x, y, randColor(['#2e7025', '#24591d', '#398a2e', '#1c4516']));
                }
                else if (id === IDS.SAPLING) {
                    if (x >= 7 && x <= 8 && y >= 5 && y <= 14) p(x, y, '#6b4931');
                    if (x >= 4 && x <= 11 && y >= 3 && y <= 8 && (x + y) % 2 === 0) p(x, y, '#398a2e');
                    if (x >= 5 && x <= 10 && y >= 2 && y <= 6 && (x + y) % 3 !== 0) p(x, y, '#4caf50');
                }
                else if (id === IDS.SHORT_GRASS) {
                    const c = getShortGrassPixel(x, y);
                    if (c) p(x, y, c);
                }
                else if (id === IDS.TALL_GRASS) {
                    const c = getTallGrassPixel(x, y);
                    if (c) p(x, y, c);
                }
                else if (id === IDS.FLOWER_RED) {
                    if (x >= 7 && x <= 8 && y >= 7 && y <= 15) p(x, y, '#2e7d32');
                    if ((x === 6 && y === 11) || (x === 9 && y === 12)) p(x, y, '#4caf50');
                    if (x >= 5 && x <= 10 && y >= 3 && y <= 7) {
                        if (x >= 6 && x <= 9 && y >= 4 && y <= 6) {
                            p(x, y, (x === 7 || x === 8) && (y === 5) ? '#1a1a1a' : '#e53935');
                        } else {
                            p(x, y, '#d32f2f');
                        }
                    }
                }
                else if (id === IDS.FLOWER_YELLOW) {
                    if (x >= 7 && x <= 8 && y >= 7 && y <= 15) p(x, y, '#2e7d32');
                    if ((x === 6 && y === 11) || (x === 9 && y === 12)) p(x, y, '#4caf50');
                    if (x >= 5 && x <= 10 && y >= 3 && y <= 7) {
                        if (x >= 6 && x <= 9 && y >= 4 && y <= 6) {
                            p(x, y, (x === 7 || x === 8) && (y === 5) ? '#ffb300' : '#fdd835');
                        } else {
                            p(x, y, '#fbc02d');
                        }
                    }
                }
                else if (id === IDS.SEEDS) {
                    const seedDots = [
                        [5, 8, '#cbb577'], [6, 7, '#e2ce91'], [7, 7, '#cbb577'], [8, 8, '#9e8548'],
                        [6, 9, '#9e8548'], [7, 9, '#e2ce91'], [8, 10, '#cbb577'], [9, 9, '#9e8548'],
                        [6, 11, '#cbb577'], [7, 12, '#9e8548'], [8, 11, '#e2ce91'], [9, 11, '#cbb577'],
                        [10, 10, '#9e8548'], [10, 12, '#cbb577']
                    ];
                    seedDots.forEach(([sx, sy, scol]) => p(sx, sy, scol));
                }
                else if (id === IDS.WHEAT_STAGE_1) {
                    const c = getWheatStage1Pixel(x, y);
                    if (c) p(x, y, c);
                }
                else if (id === IDS.WHEAT_STAGE_2) {
                    const c = getWheatStage2Pixel(x, y);
                    if (c) p(x, y, c);
                }
                else if (id === IDS.WHEAT_STAGE_3) {
                    const c = getWheatStage3Pixel(x, y);
                    if (c) p(x, y, c);
                }
                else if (id === IDS.WHEAT_STAGE_4) {
                    const c = getWheatStage4Pixel(x, y);
                    if (c) p(x, y, c);
                }
                else if (id === IDS.WHEAT) {
                    // Harvested wheat sheaf
                    if (x >= 7 && x <= 8 && y >= 11 && y <= 15) p(x, y, '#ca8a04');
                    if (x >= 6 && x <= 9 && y === 12) p(x, y, '#78350f');
                    if ((x === 5 || x === 10) && y >= 7 && y <= 11) p(x, y, '#eab308');
                    if ((x === 6 || x === 9) && y >= 6 && y <= 11) p(x, y, '#f59e0b');
                    if ((x === 7 || x === 8) && y >= 5 && y <= 11) p(x, y, '#facc15');
                    if (x >= 4 && x <= 6 && y >= 3 && y <= 6) p(x, y, (x === 4 || y === 3) ? '#fde047' : '#eab308');
                    if (x >= 6 && x <= 9 && y >= 2 && y <= 5) p(x, y, (y === 2) ? '#fef08a' : '#f59e0b');
                    if (x >= 9 && x <= 11 && y >= 3 && y <= 6) p(x, y, (x === 11 || y === 3) ? '#fde047' : '#eab308');
                    if (y === 1 && (x === 7 || x === 8)) p(x, y, '#fde047');
                }
                else if (id === IDS.BREAD) {
                    // Oven baked bread loaf with golden crust and diagonal scoring
                    if (x >= 3 && x <= 12 && y === 11) p(x, y, '#78350f');
                    if (x >= 4 && x <= 11 && y === 12) p(x, y, '#542609');
                    if (x >= 2 && x <= 13 && y >= 7 && y <= 10) p(x, y, '#b45309');
                    if (x >= 3 && x <= 12 && y === 6) p(x, y, '#d97706');
                    if (x >= 4 && x <= 11 && y === 5) p(x, y, '#f59e0b');
                    if (x >= 5 && x <= 10 && y === 5) p(x, y, '#fcd34d');
                    if ((x === 5 && y >= 6 && y <= 8) || (x === 8 && y >= 6 && y <= 8) || (x === 11 && y >= 6 && y <= 8)) {
                        p(x, y, '#fef3c7');
                    }
                    if ((x === 4 && y === 6) || (x === 7 && y === 6) || (x === 10 && y === 6)) {
                        p(x, y, '#78350f');
                    }
                }
                else if (id === IDS.CRAFTING_TABLE) {
                    // Top (y: 0..3): 3x3 checkered pine/oak crafting grid with darker frame
                    if (y === 0) {
                        p(x, y, (x === 0 || x === 15) ? '#452b14' : '#6b4624');
                    } else if (y >= 1 && y <= 3) {
                        if (x === 0 || x === 15) {
                            p(x, y, '#452b14');
                        } else if (x === 1 || x === 14) {
                            p(x, y, '#784e26');
                        } else {
                            const isGridLine = ((x - 2) % 4 === 3);
                            if (isGridLine) {
                                p(x, y, '#3b2210');
                            } else {
                                const cellX = Math.floor((x - 2) / 4);
                                const cellY = y - 1;
                                const isAlt = (cellX + cellY) % 2 === 0;
                                p(x, y, isAlt ? '#ba8b58' : '#94673b');
                            }
                        }
                    }
                    // Table top overhang shadow line
                    else if (y === 4) {
                        p(x, y, (x === 0 || x === 15) ? '#241407' : '#331c0b');
                    }
                    // Front & Side Face (y: 5..15)
                    else {
                        if (x <= 1 || x >= 14) {
                            const isEdge = (x === 0 || x === 15);
                            p(x, y, isEdge ? '#482e16' : '#5a3b1d');
                            if ((y === 5 || y === 14) && (x === 0 || x === 15)) p(x, y, '#2b2b2b');
                            if ((y === 5 || y === 14) && (x === 1 || x === 14)) p(x, y, '#71717a');
                        } else {
                            let woodColor = (x % 3 === 0) ? '#845c32' : ((x + y) % 2 === 0 ? '#996d3d' : '#8f6437');
                            
                            // Left Tool: Hand Saw
                            const isSawHandle = (x === 3 && (y === 7 || y === 8)) || (x === 4 && y === 7);
                            const isSawBlade = (x === 4 && y >= 8 && y <= 10) || 
                                               (x === 5 && y >= 9 && y <= 11) || 
                                               (x === 6 && y >= 10 && y <= 12) || 
                                               (x === 7 && y >= 11 && y <= 13);
                            const isSawTooth = (x === 5 && y === 12) || (x === 6 && y === 13) || (x === 7 && y === 14);

                            // Right Tool: Crafting Pliers/Hammer
                            const isToolHead = (x >= 10 && x <= 12 && y === 7) || (x >= 11 && x <= 12 && y === 8);
                            const isToolHandleLeft = (x === 10 && (y >= 9 && y <= 12));
                            const isToolHandleRight = (x === 12 && (y >= 9 && y <= 12));
                            const isToolPivot = (x === 11 && y === 9);

                            if (isSawHandle) p(x, y, '#452814');
                            else if (isSawBlade) p(x, y, (x === 4 || y === 8 || y === 9) ? '#e4e4e7' : '#a1a1aa');
                            else if (isSawTooth) p(x, y, '#d4d4d8');
                            else if (isToolHead) p(x, y, '#71717a');
                            else if (isToolPivot) p(x, y, '#f4f4f5');
                            else if (isToolHandleLeft || isToolHandleRight) p(x, y, '#3f3f46');
                            else if (y === 15) p(x, y, '#3b2210');
                            else p(x, y, woodColor);
                        }
                    }
                }
                else if (id === IDS.TORCH) {
                    if ((x === 7 || x === 8) && y >= 8 && y <= 15) p(x, y, x === 7 ? '#784e26' : '#53371a');
                    if ((x === 7 || x === 8) && (y === 6 || y === 7)) p(x, y, '#262626');
                    if (y >= 1 && y <= 5) {
                        if (x === 7 && (y === 3 || y === 4)) p(x, y, '#ffffff');
                        else if ((x === 7 || x === 8) && y >= 2 && y <= 5) p(x, y, '#fde047');
                        else if ((x === 6 || x === 9) && (y === 3 || y === 4)) p(x, y, '#f59e0b');
                        else if (x === 7 && y === 1) p(x, y, '#facc15');
                        else if ((x >= 6 && x <= 9 && y >= 2 && y <= 5) || (y === 1 && (x === 6 || x === 8))) p(x, y, '#ea580c');
                    }
                }
                else if ([IDS.DOOR, IDS.DOOR_TOP, IDS.DOOR_OPEN, IDS.DOOR_OPEN_TOP].includes(id)) {
                    const isClosed = id === IDS.DOOR || id === IDS.DOOR_TOP;
                    const isTop = id === IDS.DOOR_TOP || id === IDS.DOOR_OPEN_TOP;
                    if (isClosed) {
                        if (x >= 1 && x <= 4) p(x, y, x === 1 ? '#4b2b18' : '#a66b38');
                        if (x === 2) p(x, y, '#c28a4d');
                        if (x === 4) p(x, y, '#6b4226');
                        if (y === 2 || y === 13) for (let doorX = 2; doorX <= 3; doorX++) p(doorX, y, '#6b4226');
                        if (!isTop && x === 3 && y === 7) p(x, y, '#f1d27a');
                    } else {
                        if (x >= 1 && x <= 14) p(x, y, '#8f5b30');
                        if (x === 1 || x === 14) p(x, y, '#422716');
                        if (x === 2 || x === 13) p(x, y, '#c18a4b');
                        if (y === 1 || y === 14) for (let doorX = 2; doorX <= 13; doorX++) p(doorX, y, '#5b351d');
                        if (y === 2 || y === 13) for (let doorX = 3; doorX <= 12; doorX++) p(doorX, y, '#c18a4b');
                        if (y >= 3 && y <= 12 && x >= 4 && x <= 11) p(x, y, (x + y) % 5 === 0 ? '#a96f39' : '#784a27');
                        if (x === 4 || x === 11) for (let doorY = 3; doorY <= 12; doorY++) p(x, doorY, '#5b351d');
                        if (!isTop && x === 10 && y === 7) p(x, y, '#f1d27a');
                    }
                }
                else if (id === IDS.STICK) {
                    if (x === y && x >= 3 && x <= 13) p(x, y, '#78512b');
                    if (x === y - 1 && x >= 4 && x <= 12) p(x, y, '#a17443');
                    if (x === y + 1 && x >= 4 && x <= 13) p(x, y, '#4a3017');
                    if ((x === 7 && y === 7) || (x === 11 && y === 11)) p(x, y, '#3b2410');
                }
                else if ([IDS.WOOD_PICKAXE, IDS.STONE_PICKAXE, IDS.IRON_PICKAXE, IDS.GOLD_PICKAXE, IDS.DIAMOND_PICKAXE, IDS.ASTRAL_PICKAXE].includes(id)) {
                    const pal = id === IDS.WOOD_PICKAXE ? { base: '#9e7b4f', light: '#bda077', dark: '#73542f', border: '#4a3318' }
                              : id === IDS.STONE_PICKAXE ? { base: '#808080', light: '#a6a6a6', dark: '#595959', border: '#383838' }
                              : id === IDS.IRON_PICKAXE ? { base: '#d8d8d8', light: '#ffffff', dark: '#a8a8a8', border: '#6b7280' }
                              : id === IDS.GOLD_PICKAXE ? { base: '#facc15', light: '#fef08a', dark: '#ca8a04', border: '#854d0e' }
                              : id === IDS.ASTRAL_PICKAXE ? { base: '#a855f7', light: '#f3e8ff', dark: '#6b21a8', border: '#3b0764' }
                              : { base: '#38bdf8', light: '#bae6fd', dark: '#0284c7', border: '#0369a1' };
                    // Handle
                    if (x === y && x >= 5 && x <= 13) p(x, y, '#855a30');
                    if (x === y + 1 && x >= 6 && x <= 14) p(x, y, '#52361b');
                    if (x === y - 1 && x >= 6 && x <= 13) p(x, y, '#a67744');
                    if (x === 14 && y === 14) p(x, y, '#3d2613');
                    // Pickaxe Arch
                    if ((x === 1 && (y === 7 || y === 8)) || (y === 1 && (x === 7 || x === 8))) p(x, y, pal.border);
                    if ((x === 2 && y === 7) || (x === 7 && y === 2)) p(x, y, pal.base);
                    if ((x === 2 && y === 5) || (x === 3 && y === 4) || (x === 4 && y === 3) || (x === 5 && y === 2) || (x === 6 && y === 1)) p(x, y, pal.light);
                    if ((x === 2 && y === 6) || (x === 3 && y === 5) || (x === 4 && y === 4) || (x === 5 && y === 3) || (x === 6 && y === 2)) p(x, y, pal.base);
                    if ((x === 3 && y === 6) || (x === 4 && y === 5) || (x === 5 && y === 4) || (x === 6 && y === 3)) p(x, y, pal.dark);
                    if ((x === 2 && y === 8) || (x === 3 && y === 7) || (x === 7 && y === 3) || (x === 8 && y === 2)) p(x, y, pal.border);
                    if (x === 5 && y === 5) p(x, y, pal.dark);
                }
                else if ([IDS.WOOD_SWORD, IDS.STONE_SWORD, IDS.IRON_SWORD, IDS.GOLD_SWORD, IDS.DIAMOND_SWORD, IDS.ASTRAL_SWORD].includes(id)) {
                    const pal = id === IDS.WOOD_SWORD ? { base: '#9e7b4f', light: '#bda077', dark: '#73542f', border: '#4a3318' }
                              : id === IDS.STONE_SWORD ? { base: '#808080', light: '#a6a6a6', dark: '#595959', border: '#383838' }
                              : id === IDS.IRON_SWORD ? { base: '#d8d8d8', light: '#ffffff', dark: '#a8a8a8', border: '#6b7280' }
                              : id === IDS.GOLD_SWORD ? { base: '#facc15', light: '#fef08a', dark: '#ca8a04', border: '#854d0e' }
                              : id === IDS.ASTRAL_SWORD ? { base: '#a855f7', light: '#f3e8ff', dark: '#6b21a8', border: '#3b0764' }
                              : { base: '#38bdf8', light: '#bae6fd', dark: '#0284c7', border: '#0369a1' };
                    // Pommel & Grip
                    if (x === 14 && y === 14) p(x, y, pal.dark);
                    if ((x === 13 && y === 14) || (x === 14 && y === 13)) p(x, y, pal.border);
                    if ((x === 12 && y === 12) || (x === 11 && y === 11)) p(x, y, '#5c3a1e');
                    if (x === 12 && y === 11) p(x, y, '#3d2411');
                    // Crossguard
                    if ((x === 9 && y === 12) || (x === 12 && y === 9)) p(x, y, pal.light);
                    if ((x === 9 && y === 11) || (x === 10 && y === 11) || (x === 10 && y === 10) || (x === 11 && y === 10) || (x === 11 && y === 9)) p(x, y, pal.dark);
                    if ((x === 8 && y === 12) || (x === 12 && y === 8)) p(x, y, pal.border);
                    // Blade
                    if (x === y && x >= 3 && x <= 8) p(x, y, pal.light);
                    if ((x === 2 && y === 3) || (x === 3 && y === 4) || (x === 4 && y === 5) || (x === 5 && y === 6) || (x === 6 && y === 7) || (x === 7 && y === 8)) p(x, y, pal.base);
                    if ((x === 3 && y === 2) || (x === 4 && y === 3) || (x === 5 && y === 4) || (x === 6 && y === 5) || (x === 7 && y === 6) || (x === 8 && y === 7)) p(x, y, pal.dark);
                    if ((x === 1 && y === 2) || (x === 2 && y === 1)) p(x, y, pal.base);
                    if (x === 1 && y === 1) p(x, y, pal.light);
                    if ((x === 2 && y === 4) || (x === 3 && y === 5) || (x === 4 && y === 6) || (x === 5 && y === 7) || (x === 6 && y === 8)) p(x, y, pal.border);
                    if ((x === 4 && y === 2) || (x === 5 && y === 3) || (x === 6 && y === 4) || (x === 7 && y === 5) || (x === 8 && y === 6)) p(x, y, pal.border);
                }
                else if ([IDS.WOOD_AXE, IDS.STONE_AXE, IDS.IRON_AXE, IDS.GOLD_AXE, IDS.DIAMOND_AXE, IDS.ASTRAL_AXE].includes(id)) {
                    const pal = id === IDS.WOOD_AXE ? { base: '#9e7b4f', light: '#bda077', dark: '#73542f', border: '#4a3318' }
                              : id === IDS.STONE_AXE ? { base: '#808080', light: '#a6a6a6', dark: '#595959', border: '#383838' }
                              : id === IDS.IRON_AXE ? { base: '#d8d8d8', light: '#ffffff', dark: '#a8a8a8', border: '#6b7280' }
                              : id === IDS.GOLD_AXE ? { base: '#facc15', light: '#fef08a', dark: '#ca8a04', border: '#854d0e' }
                              : id === IDS.ASTRAL_AXE ? { base: '#a855f7', light: '#f3e8ff', dark: '#6b21a8', border: '#3b0764' }
                              : { base: '#38bdf8', light: '#bae6fd', dark: '#0284c7', border: '#0369a1' };
                    // Handle
                    if (x === y && x >= 4 && x <= 13) p(x, y, '#855a30');
                    if (x === y + 1 && x >= 5 && x <= 14) p(x, y, '#52361b');
                    if (x === y - 1 && x >= 5 && x <= 13) p(x, y, '#a67744');
                    if (x === 14 && y === 14) p(x, y, '#3d2613');
                    // Axe Head & Blade
                    if (x === 2 && y >= 2 && y <= 5) p(x, y, pal.light);
                    if (x === 3 && y >= 2 && y <= 5) p(x, y, pal.base);
                    if (x >= 4 && x <= 6 && y === 2) p(x, y, pal.dark);
                    if (x >= 4 && x <= 5 && y === 3) p(x, y, pal.base);
                    if (x === 6 && y === 3) p(x, y, pal.dark);
                    if (x === 7 && y === 4) p(x, y, pal.border);
                    if ((x === 2 || x === 3) && y === 6) p(x, y, pal.dark);
                    if (x === 3 && y === 7) p(x, y, pal.border);
                    if (x === 4 && y === 4) p(x, y, pal.dark);
                    if (x === 5 && y === 4) p(x, y, pal.border);
                }
                else if ([IDS.WOOD_SHOVEL, IDS.STONE_SHOVEL, IDS.IRON_SHOVEL, IDS.GOLD_SHOVEL, IDS.DIAMOND_SHOVEL, IDS.ASTRAL_SHOVEL].includes(id)) {
                    const pal = id === IDS.WOOD_SHOVEL ? { base: '#9e7b4f', light: '#bda077', dark: '#73542f', border: '#4a3318' }
                              : id === IDS.STONE_SHOVEL ? { base: '#808080', light: '#a6a6a6', dark: '#595959', border: '#383838' }
                              : id === IDS.IRON_SHOVEL ? { base: '#d8d8d8', light: '#ffffff', dark: '#a8a8a8', border: '#6b7280' }
                              : id === IDS.GOLD_SHOVEL ? { base: '#facc15', light: '#fef08a', dark: '#ca8a04', border: '#854d0e' }
                              : id === IDS.ASTRAL_SHOVEL ? { base: '#a855f7', light: '#f3e8ff', dark: '#6b21a8', border: '#3b0764' }
                              : { base: '#38bdf8', light: '#bae6fd', dark: '#0284c7', border: '#0369a1' };
                    // Handle
                    if (x === y && x >= 6 && x <= 13) p(x, y, '#855a30');
                    if (x === y + 1 && x >= 7 && x <= 14) p(x, y, '#52361b');
                    if (x === y - 1 && x >= 7 && x <= 13) p(x, y, '#a67744');
                    if (x === 14 && y === 14) p(x, y, '#3d2613');
                    // Collar
                    if ((x === 5 && y === 6) || (x === 6 && y === 5)) p(x, y, pal.border);
                    // Shovel Scoop
                    if ((x === 1 && y === 4) || (x === 2 && y === 3) || (x === 3 && y === 2) || (x === 4 && y === 1)) p(x, y, pal.light);
                    if ((x === 2 && y === 4) || (x === 3 && y === 3) || (x === 4 && y === 2)) p(x, y, pal.base);
                    if ((x === 2 && y === 5) || (x === 5 && y === 2)) p(x, y, pal.base);
                    if ((x === 3 && y === 4) || (x === 4 && y === 3)) p(x, y, pal.light);
                    if ((x === 3 && y === 5) || (x === 4 && y === 4) || (x === 5 && y === 3)) p(x, y, pal.dark);
                    if ((x === 4 && y === 5) || (x === 5 && y === 4)) p(x, y, pal.border);
                }
                else if ([IDS.WOOD_HOE, IDS.STONE_HOE, IDS.IRON_HOE, IDS.GOLD_HOE, IDS.DIAMOND_HOE].includes(id)) {
                    const pal = id === IDS.WOOD_HOE ? { base: '#9e7b4f', light: '#bda077', dark: '#73542f', border: '#4a3318' }
                              : id === IDS.STONE_HOE ? { base: '#808080', light: '#a6a6a6', dark: '#595959', border: '#383838' }
                              : id === IDS.IRON_HOE ? { base: '#d8d8d8', light: '#ffffff', dark: '#a8a8a8', border: '#6b7280' }
                              : id === IDS.GOLD_HOE ? { base: '#facc15', light: '#fef08a', dark: '#ca8a04', border: '#854d0e' }
                              : { base: '#38bdf8', light: '#bae6fd', dark: '#0284c7', border: '#0369a1' };
                    // Handle
                    if (x === y && x >= 5 && x <= 13) p(x, y, '#855a30');
                    if (x === y + 1 && x >= 6 && x <= 14) p(x, y, '#52361b');
                    if (x === y - 1 && x >= 6 && x <= 13) p(x, y, '#a67744');
                    if (x === 14 && y === 14) p(x, y, '#3d2613');
                    // Tilling Blade & Hook
                    if (y === 2 && x >= 2 && x <= 6) p(x, y, pal.light);
                    if (y === 3 && x >= 2 && x <= 5) p(x, y, pal.base);
                    if (x === 1 && (y === 3 || y === 4)) p(x, y, pal.light);
                    if (x === 2 && y === 4) p(x, y, pal.base);
                    if (x === 2 && y === 5) p(x, y, pal.dark);
                    if (y === 4 && (x === 3 || x === 4)) p(x, y, pal.dark);
                    if ((x === 5 && y === 4) || (x === 4 && y === 5)) p(x, y, pal.border);
                }
                else if (id === IDS.GOLD_INGOT || id === IDS.IRON_INGOT) {
                    const isGold = (id === IDS.GOLD_INGOT);
                    const lightCol = isGold ? '#fef08a' : '#ffffff';
                    const baseCol  = isGold ? '#facc15' : '#e4e4e7';
                    const midCol   = isGold ? '#eab308' : '#a1a1aa';
                    const darkCol  = isGold ? '#ca8a04' : '#71717a';
                    const shadowCol= isGold ? '#854d0e' : '#3f3f46';

                    for (let iy = 5; iy <= 12; iy++) {
                        for (let ix = 2; ix <= 13; ix++) {
                            if (iy === 5 && ix >= 5 && ix <= 10) p(ix, iy, lightCol);
                            else if (iy === 6 && ix >= 4 && ix <= 11) p(ix, iy, (ix === 4 || ix === 5) ? lightCol : baseCol);
                            else if (iy === 7 && ix >= 4 && ix <= 11) p(ix, iy, baseCol);
                            else if (iy >= 8 && iy <= 10 && ix >= 3 && ix <= 12) {
                                if (ix === 3) p(ix, iy, lightCol);
                                else if (ix === 12) p(ix, iy, darkCol);
                                else p(ix, iy, (iy === 8) ? baseCol : midCol);
                            }
                            else if (iy === 11 && ix >= 3 && ix <= 12) p(ix, iy, darkCol);
                            else if (iy === 12 && ix >= 4 && ix <= 12) p(ix, iy, shadowCol);
                        }
                    }
                }
                else if ([IDS.BUCKET, IDS.WATER_BUCKET, IDS.LAVA_BUCKET].includes(id)) {
                    if ((x >= 4 && x <= 11 && y === 5) || (x >= 3 && x <= 4 && y >= 6 && y <= 12) || (x >= 11 && x <= 12 && y >= 6 && y <= 12) || (x >= 5 && x <= 10 && y === 13)) p(x, y, '#b8c3c9');
                    if (x >= 5 && x <= 10 && y >= 6 && y <= 12) p(x, y, id === IDS.WATER_BUCKET ? '#258dcc' : id === IDS.LAVA_BUCKET ? '#d94b1f' : '#6e7c83');
                }
                else if (id === IDS.DIAMOND) {
                    const gemPixels = [
                        [6, 3, '#f0f9ff'], [7, 3, '#ffffff'], [8, 3, '#f0f9ff'], [9, 3, '#e0f2fe'],
                        [5, 4, '#e0f2fe'], [6, 4, '#bae6fd'], [7, 4, '#e0f2fe'], [8, 4, '#bae6fd'], [9, 4, '#bae6fd'], [10, 4, '#7dd3fc'],
                        [4, 5, '#e0f2fe'], [5, 5, '#bae6fd'], [6, 5, '#ffffff'], [7, 5, '#7dd3fc'], [8, 5, '#38bdf8'], [9, 5, '#38bdf8'], [10, 5, '#0284c7'], [11, 5, '#0369a1'],
                        [3, 6, '#bae6fd'], [4, 6, '#7dd3fc'], [5, 6, '#38bdf8'], [6, 6, '#38bdf8'], [7, 6, '#0284c7'], [8, 6, '#0284c7'], [9, 6, '#0369a1'], [10, 6, '#0369a1'], [11, 6, '#075985'], [12, 6, '#082f49'],
                        [4, 7, '#38bdf8'], [5, 7, '#38bdf8'], [6, 7, '#0284c7'], [7, 7, '#0284c7'], [8, 7, '#0284c7'], [9, 7, '#0369a1'], [10, 7, '#0369a1'], [11, 7, '#075985'],
                        [5, 8, '#0284c7'], [6, 8, '#0284c7'], [7, 8, '#0369a1'], [8, 8, '#0369a1'], [9, 8, '#075985'], [10, 8, '#075985'],
                        [6, 9, '#0284c7'], [7, 9, '#0369a1'], [8, 9, '#075985'], [9, 9, '#075985'],
                        [6, 10, '#0369a1'], [7, 10, '#075985'], [8, 10, '#075985'], [9, 10, '#0c4a6e'],
                        [7, 11, '#075985'], [8, 11, '#0c4a6e'],
                        [7, 12, '#0c4a6e'], [8, 12, '#082f49']
                    ];
                    gemPixels.forEach(([gx, gy, gcol]) => p(gx, gy, gcol));
                }
                else if (id === IDS.COAL) {
                    const coalShape = [
                        [0,0,0,1,1,1,0,0], [0,1,1,1,1,1,1,0], [1,1,1,1,1,1,1,1],
                        [1,1,2,1,1,1,1,1], [1,1,1,1,3,1,1,1], [0,1,1,1,1,1,1,0], [0,0,1,1,1,1,0,0]
                    ];
                    let startX = 4, startY = 5;
                    if (y >= startY && y < startY + coalShape.length && x >= startX && x < startX + coalShape[0].length) {
                        let val = coalShape[y - startY][x - startX];
                        if (val === 1) p(x, y, randColor(['#222', '#111', '#1a1a1a']));
                        if (val === 2) p(x, y, '#444');
                        if (val === 3) p(x, y, '#000');
                    }
                }
                else if (id === IDS.FURNACE) {
                    const isBorder = (x === 0 || x === 15 || y === 0 || y === 15);
                    const isMouth = (x >= 4 && x <= 11 && y >= 5 && y <= 13);
                    const isArchTop = (y === 4 && x >= 5 && x <= 10);
                    const isKeystone = (y === 3 && (x === 7 || x === 8));

                    if (isBorder) {
                        p(x, y, (x + y) % 3 === 0 ? '#3f3f46' : '#52525b');
                    } else if (isKeystone) {
                        p(x, y, '#a1a1aa');
                    } else if (isArchTop) {
                        p(x, y, (x === 7 || x === 8) ? '#71717a' : '#52525b');
                    } else if (isMouth) {
                        if (y <= 7) {
                            p(x, y, y === 5 ? '#09090b' : '#141416');
                        } else {
                            const isGrateBar = (x === 5 || x === 7 || x === 9);
                            if (isGrateBar && y <= 11) {
                                p(x, y, '#27272a');
                            } else {
                                p(x, y, (y >= 11 && (x === 6 || x === 8 || x === 10)) ? '#18181b' : '#09090b');
                            }
                        }
                    } else {
                        const n = ((Math.floor(x / 3) * 7 + Math.floor(y / 3) * 13) % 4);
                        const c = n === 0 ? '#71717a' : (n === 1 ? '#52525b' : (n === 2 ? '#64748b' : '#78716c'));
                        p(x, y, (x % 4 === 0 || y % 4 === 0) ? '#3f3f46' : c);
                    }
                }
                else if (id === IDS.RAW_PORKCHOP) {
                    const porkPixels = [
                        "................",
                        "....OOOO........",
                        "...OFFFFOO......",
                        "..OFFLLMMFOO....",
                        ".OFLLMMMMLLFO...",
                        ".OFLMMDDMMLLFO..",
                        ".OLMMDDDDMMMbBO.",
                        ".OLMDDDDDDMbbbBO",
                        ".OLMMDDDDMMMbBO.",
                        ".OFLLMMMMLLFO...",
                        "..OFLLMMLLFO....",
                        "...OFFFFFOO.....",
                        "....OOOOOO......",
                        "................",
                        "................",
                        "................"
                    ];
                    const col = {
                        'O': '#4c0519', 'F': '#fff1f2', 'f': '#ffe4e6', 'L': '#fda4af',
                        'M': '#fb7185', 'D': '#e11d48', 'B': '#ffffff', 'b': '#cbd5e1'
                    };
                    const row = porkPixels[y];
                    if (row && row[x] && col[row[x]]) p(x, y, col[row[x]]);
                }
                else if (id === IDS.COOKED_PORKCHOP) {
                    const cookedPorkPixels = [
                        "................",
                        "....OOOO........",
                        "...OCCCCOO......",
                        "..OCCLLMMCOO....",
                        ".OCLLMMMMLLCO...",
                        ".OCLMMDDMMLLCO..",
                        ".OLMGDDDDMMMbBO.",
                        ".OLMDDGGDDMbbbBO",
                        ".OLMMDDDDMMMbBO.",
                        ".OCLLMMMMLLCO...",
                        "..OCLLMMLLCO....",
                        "...OCCCCCOO.....",
                        "....OOOOOO......",
                        "................",
                        "................",
                        "................"
                    ];
                    const col = {
                        'O': '#271202', 'C': '#fef3c7', 'L': '#d97706', 'M': '#b45309',
                        'D': '#78350f', 'G': '#451a03', 'B': '#f8fafc', 'b': '#94a3b8'
                    };
                    const row = cookedPorkPixels[y];
                    if (row && row[x] && col[row[x]]) p(x, y, col[row[x]]);
                }
                else if (id === IDS.APPLE) {
                    const applePixels = [
                        "................",
                        ".......sE.......",
                        "......SGG.......",
                        ".....SOOO.......",
                        "....OLLRRO......",
                        "...OLRRRRRO.....",
                        "..OLRRRRRRRRO...",
                        "..ORRRRRRRRRRO..",
                        "..OMMRRRRRMMMD..",
                        "..OMMMRRMMMMMD..",
                        "..OMMMMMMMMMMD..",
                        "...OMMMMMMMMD...",
                        "...ODDMMMMDDD...",
                        "....ODDDDDDDO...",
                        ".....OOOOOO.....",
                        "................"
                    ];
                    const col = {
                        'O': '#450a0a', 'S': '#542609', 's': '#78350f', 'E': '#86efac',
                        'G': '#22c55e', 'L': '#ffffff', 'R': '#ef4444', 'M': '#dc2626', 'D': '#991b1b'
                    };
                    const row = applePixels[y];
                    if (row && row[x] && col[row[x]]) p(x, y, col[row[x]]);
                }
                else if (id === IDS.RAW_CHICKEN) {
                    const rawChickenPixels = [
                        "................",
                        "...OOOO.........",
                        "..OPLLMMO.......",
                        ".OPLLMMMMO......",
                        ".OPLMMMMDDO.....",
                        ".OPMMMMMDDO.....",
                        "..OMMMMDDO......",
                        "...OMMDDO.......",
                        "....OMDO........",
                        ".....OBO........",
                        "......ObBO......",
                        ".......ObBO.....",
                        "......ObbbBO....",
                        "......OBBBB.....",
                        "................",
                        "................"
                    ];
                    const col = {
                        'O': '#3f1d1d', 'P': '#fed7aa', 'L': '#fca5a5', 'M': '#f87171',
                        'D': '#dc2626', 'B': '#f8fafc', 'b': '#cbd5e1'
                    };
                    const row = rawChickenPixels[y];
                    if (row && row[x] && col[row[x]]) p(x, y, col[row[x]]);
                }
                else if (id === IDS.COOKED_CHICKEN) {
                    const cookedChickenPixels = [
                        "................",
                        "...OOOO.........",
                        "..OKGGMMO.......",
                        ".OKGGMMMMO......",
                        ".OKGMMMMDDO.....",
                        ".OKMMMMMDDO.....",
                        "..OMMMMDDO......",
                        "...OMMDDO.......",
                        "....OMDO........",
                        ".....OBO........",
                        "......ObBO......",
                        ".......ObBO.....",
                        "......ObbbBO....",
                        "......OBBBB.....",
                        "................",
                        "................"
                    ];
                    const col = {
                        'O': '#271202', 'K': '#fef08a', 'G': '#f59e0b', 'M': '#d97706',
                        'D': '#78350f', 'B': '#f8fafc', 'b': '#cbd5e1'
                    };
                    const row = cookedChickenPixels[y];
                    if (row && row[x] && col[row[x]]) p(x, y, col[row[x]]);
                }
                else if (id === IDS.FEATHER) {
                    if (x+y>8 && x+y<24 && Math.abs(x-y)<3) p(x,y, '#ffffff');
                    if (x===y) p(x,y, '#e6e6e6');
                    if (x===y && x>10) p(x,y, '#666666'); 
                }
                else if (id === IDS.WOOL) {
                    if (x > 2 && x < 13 && y > 3 && y < 13) p(x, y, '#f5f5f5');
                    if ((x + y) % 4 === 0 && x > 1 && x < 14 && y > 2 && y < 14) p(x, y, '#d0d0d0');
                }
                else if (id === IDS.RAW_MUTTON) {
                    const rawMuttonPixels = [
                        "................",
                        "....OOOO........",
                        "...OFFFFOO......",
                        "..OFFLLMMFOO....",
                        ".OFLLMMMMMDDO...",
                        ".OFLMMDDDDDDDDO.",
                        ".OLMDDDDDDMMMbBO",
                        ".OLMDDDDDDMMbbbB",
                        "..OMDDDDMMMMObBO",
                        "...OMMMMMMMFO...",
                        "....OMMMMMFO....",
                        ".....OFFFFO.....",
                        "......OOOO......",
                        "................",
                        "................",
                        "................"
                    ];
                    const col = {
                        'O': '#360808', 'F': '#f8fafc', 'f': '#e2e8f0', 'L': '#e11d48',
                        'M': '#be123c', 'D': '#881337', 'B': '#ffffff', 'b': '#94a3b8'
                    };
                    const row = rawMuttonPixels[y];
                    if (row && row[x] && col[row[x]]) p(x, y, col[row[x]]);
                }
                else if (id === IDS.COOKED_MUTTON) {
                    const cookedMuttonPixels = [
                        "................",
                        "....OOOO........",
                        "...OCCCCOO......",
                        "..OCCLLMMCOO....",
                        ".OCLLMMMMMDDO...",
                        ".OCLMMDDDDDDDDO.",
                        ".OLMDDDDDDMMMbBO",
                        ".OLMDDDDDDMMbbbB",
                        "..OMDDDDMMMMObBO",
                        "...OMMMMMMCO....",
                        "....OMMMMMCO....",
                        ".....OCCCCO.....",
                        "......OOOO......",
                        "................",
                        "................",
                        "................"
                    ];
                    const col = {
                        'O': '#1c0c04', 'C': '#d97706', 'L': '#b45309', 'M': '#78350f',
                        'D': '#451a03', 'B': '#f8fafc', 'b': '#94a3b8'
                    };
                    const row = cookedMuttonPixels[y];
                    if (row && row[x] && col[row[x]]) p(x, y, col[row[x]]);
                }
                else if (id === IDS.RAW_BEEF) {
                    const beefPixels = [
                        "................",
                        "....OOOOO.......",
                        "...OffffFOOO....",
                        "..OffMMMMFFFFO..",
                        ".OfMMMMMMMMMMFO.",
                        ".OfMMDDMMMMMMFO.",
                        ".OfMDDVVMDDMMMFO",
                        ".OfMDVVVDMMMMFO.",
                        ".OfMMDDMDDMMMFO.",
                        "..OfMMMMMMMMFO..",
                        "...OfMMDDMMFO...",
                        "....OfMMMMFO....",
                        ".....OfMMFO.....",
                        "......OOOO......",
                        "................",
                        "................"
                    ];
                    const col = {
                        'O': '#450a0a',
                        'f': '#fef08a',
                        'F': '#fde047',
                        'M': '#dc2626',
                        'D': '#991b1b',
                        'V': '#ffffff'
                    };
                    const row = beefPixels[y];
                    if (row && row[x] && col[row[x]]) p(x, y, col[row[x]]);
                }
                else if (id === IDS.COOKED_BEEF) {
                    const cookedPixels = [
                        "................",
                        "....OOOOO.......",
                        "...OBBBBCCOO....",
                        "..OBBMMMMCCCCo..",
                        ".OBMMGGMMMMMMCO.",
                        ".OBMMGGMMGGMMCO.",
                        ".OBMGGMMGGMMMCO.",
                        ".OBMMGGMMGGMMCO.",
                        ".OBMMMMGGMMMMCO.",
                        "..OBMMMMMMMMCO..",
                        "...OBMMDDMMCO...",
                        "....OBMMMMCO....",
                        ".....OBMMCO.....",
                        "......OOOO......",
                        "................",
                        "................"
                    ];
                    const col = {
                        'O': '#1c0d02',
                        'B': '#fef3c7',
                        'C': '#78350f',
                        'o': '#92400e',
                        'M': '#b45309',
                        'G': '#451a03',
                        'D': '#78350f'
                    };
                    const row = cookedPixels[y];
                    if (row && row[x] && col[row[x]]) p(x, y, col[row[x]]);
                }
                else if (id === IDS.LEATHER) {
                    const leatherPixels = [
                        "................",
                        "...OO.....OO....",
                        "..OLLOOOOOLLO...",
                        ".OLLLLMMMMLLLO..",
                        ".OLLMMHHHHMMLLO.",
                        ".OLMMHHHHHHMLLO.",
                        "..OMMHHHHHHMMO..",
                        "..OMMHHHHHHMMO..",
                        ".OLMMHHHHHHMLLO.",
                        ".OLLMMHHHHMMLLO.",
                        ".OLLLLMMMMLLLO..",
                        "..OLLOOOOOLLO...",
                        "...OO.....OO....",
                        "................",
                        "................",
                        "................"
                    ];
                    const col = {
                        'O': '#381e05',
                        'L': '#78350f',
                        'M': '#92400e',
                        'H': '#b45309'
                    };
                    const row = leatherPixels[y];
                    if (row && row[x] && col[row[x]]) p(x, y, col[row[x]]);
                }
                else if (id === IDS.JUKEBOX) {
                    const jukeboxPixels = [
                        "BBBBBBBBBBBBBBBB",
                        "BHHHHHHHHHHHHHHB",
                        "BH..SSSSSSSS..HB",
                        "BOPPPPPPPPPPPPOB",
                        "BOPPWWTTTWWPPOOB",
                        "BOPPWTTGTTWWPOOB",
                        "BOPWTTGGGGTTWPOB",
                        "BOPWTGGCCGGTWPOB",
                        "BOPWTGGCCGGTWPOB",
                        "BOPWTTGGGGTTWPOB",
                        "BOPPWTTGTTWWPOOB",
                        "BOPPWWTTTWWPPOOB",
                        "BOPPPPPPPPPPPPOB",
                        "BHHHHHHHHHHHHHHB",
                        "BBBBBBBBBBBBBBBB",
                        "BBBBBBBBBBBBBBBB"
                    ];
                    const col = {
                        'B': '#2a1204',
                        'H': '#92400e',
                        '.': '#0f0a06',
                        'S': '#18181b',
                        'O': '#5c2a07',
                        'P': '#78350f',
                        'W': '#854d0e',
                        'T': '#ca8a04',
                        'G': '#eab308',
                        'C': '#fef08a'
                    };
                    const row = jukeboxPixels[y];
                    if (row && row[x] && col[row[x]]) p(x, y, col[row[x]]);
                }
                else if (id === IDS.EMPTY_VINYL) {
                    const vinylPixels = [
                        "................",
                        ".....OOOOOO.....",
                        "...OOGGGGGGOO...",
                        "..OGGRRRRRRGGO..",
                        ".OGRRssssssRRGO.",
                        ".OGRsSSSSSSsRGO.",
                        "OGRsSSGGGGSSsRGO",
                        "OGRsSGGCCGGSsRGO",
                        "OGRsSGGCCGGSsRGO",
                        "OGRsSSGGGGSSsRGO",
                        ".OGRsSSSSSSsRGO.",
                        ".OGRRssssssRRGO.",
                        "..OGGRRRRRRGGO..",
                        "...OOGGGGGGOO...",
                        ".....OOOOOO.....",
                        "................"
                    ];
                    const col = {
                        'O': '#09090b',
                        'G': '#18181b',
                        'R': '#27272a',
                        's': '#3f3f46',
                        'S': '#dc2626',
                        'C': '#f87171'
                    };
                    const row = vinylPixels[y];
                    if (row && row[x] && col[row[x]]) p(x, y, col[row[x]]);
                }
                else if (id === IDS.BED) {
                    if (x < 12 && y < 6) p(x, y, y === 0 ? '#9e2020' : '#c52b2b');
                    if (x < 12 && y === 2 && x > 1 && x < 5) p(x, y, '#a51f1f');
                    if (x < 12 && y === 2 && x > 7 && x < 10) p(x, y, '#a51f1f');
                    if (x < 12 && y === 5) p(x, y, '#8f1b1b');
                    if (x >= 12 && y < 6) p(x, y, '#a9a9a9');
                    if (x >= 13 && x <= 14 && y >= 1 && y <= 3) p(x, y, '#f4f4f4');
                    if (y >= 6 && y <= 7) p(x, y, '#d9a62f');
                    if (y >= 8 && x <= 1) p(x, y, '#d9a62f');
                    if (y >= 8 && x >= 14) p(x, y, '#b78324');
                    if (y >= 8 && x > 1 && x < 14) p(x, y, '#5a3c1b');
                    if (y === 7 && x > 1 && x < 14) p(x, y, '#8a6233');
                }
                else if (id === IDS.SAND) p(x, y, randColor(['#e6cc80', '#e0c266', '#d9b34d']));
                else if (id === IDS.SNOW) p(x, y, randColor(['#ffffff', '#f2f2f2', '#e6e6e6']));
                else if (id === IDS.SNOWBALL) {
                    // Draw a small rounded snowball icon centred in the 16x16 tile
                    const cx = 7, cy = 7, r = 5;
                    const d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
                    if (d <= r) {
                        if (d <= r - 3) p(x, y, '#ddeeff');
                        else if (d <= r - 1.5) p(x, y, '#eef6ff');
                        else p(x, y, '#c8e4f8');
                    }
                    // Highlight
                    if (x === 5 && y === 5) p(x, y, '#ffffff');
                    if (x === 6 && y === 5) p(x, y, '#ffffff');
                    if (x === 5 && y === 6) p(x, y, '#ffffff');
                }
                else if (id === IDS.WATER) {
                    p(x, y, y < 4 ? '#65d9ef' : '#258dcc');
                    if ((x + y) % 5 === 0) p(x, y, '#8ce8f5');
                }
                else if (id === IDS.LAVA) {
                    p(x, y, y < 5 ? '#ffcf33' : '#d94b1f');
                    if ((x * 3 + y) % 6 === 0) p(x, y, '#ff7b22');
                }
                else if (id === IDS.CACTUS) {
                    if (x===0 || x===15 || y===0 || y===15) p(x, y, '#1b5e20'); 
                    else if (x%4===0) p(x, y, '#2e7d32'); 
                    else p(x, y, '#4caf50'); 
                }
                else if (id === IDS.CHEST) {
                    if (x < 2 || x > 13 || y < 2 || y > 13) p(x, y, '#4b2b18');
                    else if (y === 3 || y === 12 || x === 3 || x === 12) p(x, y, '#a66b38');
                    else p(x, y, (x + y) % 3 === 0 ? '#b9783d' : '#8f5b30');
                    if (x === 7 || x === 8) p(x, y, '#d5a04c');
                    if (y === 7 || y === 8) p(x, y, '#6b3d20');
                    if (x === 7 && y === 7) p(x, y, '#f1d27a');
                }
                else if (id === IDS.LADDER) {
                    if (x === 2 || x === 3 || x === 12 || x === 13) {
                        let c = (x === 2 || x === 12) ? '#5c3e1e' : '#8a6233';
                        if (y % 4 === 0) c = '#4a3318';
                        p(x, y, c);
                    }
                    if ((y === 3 || y === 7 || y === 11 || y === 15) && x >= 4 && x <= 11) {
                        p(x, y, '#a67c4e');
                    }
                    if ((y === 4 || y === 8 || y === 12) && x >= 4 && x <= 11) {
                        p(x, y, '#5c3e1e');
                    }
                }
                else if (id === IDS.SIGN) {
                    // Wooden post in center bottom (x: 7-8, y: 10-15)
                    if ((x === 7 || x === 8) && y >= 10 && y <= 15) {
                        p(x, y, x === 7 ? '#6b4931' : '#523720');
                    }
                    // Wooden sign board on top (x: 1 to 14, y: 1 to 9)
                    else if (x >= 1 && x <= 14 && y >= 1 && y <= 9) {
                        if (x === 1 || x === 14 || y === 1 || y === 9) {
                            p(x, y, '#4a3318'); // border outline
                        } else {
                            p(x, y, (x + y) % 2 === 0 ? '#9e7b4f' : '#a68254'); // oak plank surface
                        }
                        // Subtle text lines on board
                        if ((y === 4 || y === 6) && x >= 3 && x <= 12 && x !== 6 && x !== 9) {
                            p(x, y, '#59442a');
                        }
                    }
                }
                else if (id === IDS.WOODEN_STAIRS_RIGHT) {
                    const isSolidPart = (y >= 8) || (x >= 8);
                    if (isSolidPart) {
                        let c = ['#9e7b4f', '#a68254'][x % 2];
                        if (y % 4 === 0 || (y % 4 === 2 && x % 8 === 0)) c = '#59442a';
                        if ((x === 8 && y < 8) || (y === 8 && x < 8)) c = '#4a3318';
                        p(x, y, c);
                    }
                }
                else if (id === IDS.WOODEN_STAIRS || id === IDS.WOODEN_STAIRS_LEFT) {
                    const isSolidPart = (y >= 8) || (x < 8);
                    if (isSolidPart) {
                        let c = ['#9e7b4f', '#a68254'][x % 2];
                        if (y % 4 === 0 || (y % 4 === 2 && x % 8 === 0)) c = '#59442a';
                        if ((x === 7 && y < 8) || (y === 8 && x >= 8)) c = '#4a3318';
                        p(x, y, c);
                    }
                }
                else if (id === IDS.COBBLESTONE_STAIRS_RIGHT) {
                    const isSolidPart = (y >= 8) || (x >= 8);
                    if (isSolidPart) {
                        let c = stoneColors[(Math.floor(x/3) + Math.floor(y/3)) % stoneColors.length];
                        if (x % 4 === 0 || y % 4 === 0) c = '#4a4a4a';
                        if ((x === 8 && y < 8) || (y === 8 && x < 8)) c = '#333333';
                        p(x, y, c);
                    }
                }
                else if (id === IDS.COBBLESTONE_STAIRS || id === IDS.COBBLESTONE_STAIRS_LEFT) {
                    const isSolidPart = (y >= 8) || (x < 8);
                    if (isSolidPart) {
                        let c = stoneColors[(Math.floor(x/3) + Math.floor(y/3)) % stoneColors.length];
                        if (x % 4 === 0 || y % 4 === 0) c = '#4a4a4a';
                        if ((x === 7 && y < 8) || (y === 8 && x >= 8)) c = '#333333';
                        p(x, y, c);
                    }
                }
                else if (id === IDS.BONE) {
                    if ((x + y === 15 && x >= 3 && x <= 12) || (x + y === 16 && x >= 4 && x <= 11)) p(x, y, '#e8e8e8');
                    if ((x === 3 && (y === 11 || y === 13)) || (x === 4 && y === 12) || (x === 2 && y === 12)) p(x, y, '#d0d0d0');
                    if ((x === 12 && (y === 2 || y === 4)) || (x === 13 && y === 3) || (x === 11 && y === 3)) p(x, y, '#ffffff');
                }
                else if ([IDS.HELMET_IRON, IDS.HELMET_GOLD, IDS.HELMET_DIAMOND, IDS.ASTRAL_HELMET].includes(id)) {
                    let base = id === IDS.HELMET_IRON ? '#d0d0d0' : id === IDS.HELMET_GOLD ? '#ffcf33' : id === IDS.ASTRAL_HELMET ? '#9333ea' : '#55e6e6';
                    let highlight = id === IDS.HELMET_IRON ? '#ffffff' : id === IDS.HELMET_GOLD ? '#fff3a8' : id === IDS.ASTRAL_HELMET ? '#f3e8ff' : '#b8ffff';
                    let shadow = id === IDS.HELMET_IRON ? '#888888' : id === IDS.HELMET_GOLD ? '#b38600' : id === IDS.ASTRAL_HELMET ? '#3b0764' : '#1d8f99';
                    if (y >= 3 && y <= 12 && x >= 3 && x <= 12) {
                        if (y <= 8 || x <= 5 || x >= 10 || (y === 9 && (x === 6 || x === 9))) {
                            let c = base;
                            if (y === 3 || x === 3) c = highlight;
                            else if (y === 12 || x === 12) c = shadow;
                            p(x, y, c);
                        }
                    }
                    if (id === IDS.ASTRAL_HELMET && ((x === 7 || x === 8) && y === 4)) p(x, y, '#c084fc');
                }
                else if ([IDS.CHESTPLATE_IRON, IDS.CHESTPLATE_GOLD, IDS.CHESTPLATE_DIAMOND, IDS.ASTRAL_CHESTPLATE].includes(id)) {
                    let base = id === IDS.CHESTPLATE_IRON ? '#d0d0d0' : id === IDS.CHESTPLATE_GOLD ? '#ffcf33' : id === IDS.ASTRAL_CHESTPLATE ? '#9333ea' : '#55e6e6';
                    let highlight = id === IDS.CHESTPLATE_IRON ? '#ffffff' : id === IDS.CHESTPLATE_GOLD ? '#fff3a8' : id === IDS.ASTRAL_CHESTPLATE ? '#f3e8ff' : '#b8ffff';
                    let shadow = id === IDS.CHESTPLATE_IRON ? '#888888' : id === IDS.CHESTPLATE_GOLD ? '#b38600' : id === IDS.ASTRAL_CHESTPLATE ? '#3b0764' : '#1d8f99';
                    if (y >= 2 && y <= 13 && x >= 2 && x <= 13) {
                        if (y <= 5 || (x >= 4 && x <= 11) || (y <= 8 && (x <= 3 || x >= 12))) {
                            if (!(y <= 4 && x >= 6 && x <= 9)) {
                                let c = base;
                                if (x === 2 || y === 2) c = highlight;
                                else if (x === 13 || y === 13) c = shadow;
                                p(x, y, c);
                            }
                        }
                    }
                    if (id === IDS.ASTRAL_CHESTPLATE && ((x === 7 || x === 8) && (y === 7 || y === 8))) p(x, y, '#c084fc');
                }
                else if ([IDS.LEGGINGS_IRON, IDS.LEGGINGS_GOLD, IDS.LEGGINGS_DIAMOND, IDS.ASTRAL_LEGGINGS].includes(id)) {
                    let base = id === IDS.LEGGINGS_IRON ? '#d0d0d0' : id === IDS.LEGGINGS_GOLD ? '#ffcf33' : id === IDS.ASTRAL_LEGGINGS ? '#9333ea' : '#55e6e6';
                    let highlight = id === IDS.LEGGINGS_IRON ? '#ffffff' : id === IDS.LEGGINGS_GOLD ? '#fff3a8' : id === IDS.ASTRAL_LEGGINGS ? '#f3e8ff' : '#b8ffff';
                    let shadow = id === IDS.LEGGINGS_IRON ? '#888888' : id === IDS.LEGGINGS_GOLD ? '#b38600' : id === IDS.ASTRAL_LEGGINGS ? '#3b0764' : '#1d8f99';
                    if (y >= 2 && y <= 13 && x >= 3 && x <= 12) {
                        if (y <= 5 || x <= 6 || x >= 9) {
                            let c = base;
                            if (y === 2 || x === 3) c = highlight;
                            else if (y === 13 || x === 12) c = shadow;
                            p(x, y, c);
                        }
                    }
                    if (id === IDS.ASTRAL_LEGGINGS && ((x === 5 || x === 10) && y === 8)) p(x, y, '#c084fc');
                }
                else if ([IDS.BOOTS_IRON, IDS.BOOTS_GOLD, IDS.BOOTS_DIAMOND, IDS.ASTRAL_BOOTS, IDS.STRIDER_BOOTS].includes(id)) {
                    let base = id === IDS.BOOTS_IRON ? '#d0d0d0' : id === IDS.BOOTS_GOLD ? '#ffcf33' : id === IDS.ASTRAL_BOOTS ? '#9333ea' : id === IDS.STRIDER_BOOTS ? '#059669' : '#55e6e6';
                    let highlight = id === IDS.BOOTS_IRON ? '#ffffff' : id === IDS.BOOTS_GOLD ? '#fff3a8' : id === IDS.ASTRAL_BOOTS ? '#f3e8ff' : id === IDS.STRIDER_BOOTS ? '#6ee7b7' : '#b8ffff';
                    let shadow = id === IDS.BOOTS_IRON ? '#888888' : id === IDS.BOOTS_GOLD ? '#b38600' : id === IDS.ASTRAL_BOOTS ? '#3b0764' : id === IDS.STRIDER_BOOTS ? '#064e3b' : '#1d8f99';
                    if (y >= 7 && y <= 13 && ((x >= 3 && x <= 6) || (x >= 9 && x <= 12))) {
                        let c = base;
                        if (x === 3 || x === 9 || y === 7) c = highlight;
                        else if (x === 6 || x === 12 || y === 13) c = shadow;
                        p(x, y, c);
                    }
                    if (id === IDS.STRIDER_BOOTS) {
                        // Winged heels
                        if ((x === 1 && y === 9) || (x === 2 && (y === 8 || y === 9))) p(x, y, '#e0f2fe');
                        if ((x === 14 && y === 9) || (x === 13 && (y === 8 || y === 9))) p(x, y, '#e0f2fe');
                        if (x === 2 && y === 10) p(x, y, '#38bdf8');
                        if (x === 13 && y === 10) p(x, y, '#38bdf8');
                    }
                }
                else if (id === IDS.JUNGLE_WOOD) {
                    let c = ['#564228', '#5e482c', '#4d3b24'][(x + Math.floor(y / 2)) % 3];
                    if (y % 4 === 0 || (y % 4 === 2 && x % 4 === 0)) c = '#3c2e1c';
                    else if ((x + y * 3) % 11 === 0) c = '#3d5228';
                    p(x, y, c);
                }
                else if (id === IDS.JUNGLE_LEAVES) {
                    if (Math.random() > 0.12) {
                        p(x, y, randColor(['#1e7e34', '#28a745', '#155724', '#2d6a4f', '#38b000']));
                    }
                }
                else if (id === IDS.JUNGLE_PLANKS) {
                    let c = ['#b8824f', '#bf8956'][(x + Math.floor(y / 4)) % 2];
                    if (y % 4 === 0 || (y % 4 === 2 && x % 8 === 0)) c = '#8a5c32';
                    else if (y % 4 === 1 && x % 8 === 1) c = '#cca06e';
                    p(x, y, c);
                }
                else if (id === IDS.JUNGLE_SAPLING) {
                    if (x >= 7 && x <= 8 && y >= 6 && y <= 14) p(x, y, '#564228');
                    if (x >= 4 && x <= 11 && y >= 3 && y <= 8 && (x + y) % 2 === 0) p(x, y, '#28a745');
                    if (x >= 5 && x <= 10 && y >= 2 && y <= 7) p(x, y, '#38b000');
                    if (x === 6 && y === 4) p(x, y, '#20c997');
                }
                else if (id === IDS.JUNGLE_DOOR_TOP || id === IDS.JUNGLE_DOOR) {
                    let isEdge = (x === 0 || x === 15 || y === 0 || (id === IDS.JUNGLE_DOOR && y === 15));
                    let c = isEdge ? '#633e1c' : ['#b8824f', '#bf8956'][x % 2];
                    p(x, y, c);
                    if (id === IDS.JUNGLE_DOOR_TOP) {
                        let dx = x - 7.5, dy = y - 7.5;
                        let dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 3.2) p(x, y, dist > 2.2 ? '#452a12' : '#38bdf8');
                    }
                    if (id === IDS.JUNGLE_DOOR && y === 2 && (x === 12 || x === 13)) p(x, y, '#facc15');
                }
                else if (id === IDS.JUNGLE_DOOR_OPEN_TOP || id === IDS.JUNGLE_DOOR_OPEN) {
                    if (x <= 3) {
                        let c = (x === 0 || x === 3) ? '#633e1c' : '#b8824f';
                        p(x, y, c);
                        if (id === IDS.JUNGLE_DOOR_OPEN_TOP && y >= 5 && y <= 10 && (x === 1 || x === 2)) p(x, y, '#38bdf8');
                    }
                }
                else if (id === IDS.VINES) {
                    const vineMask = (
                        (x === 3 && y % 3 !== 0) || (x === 4 && (y >= 2 && y <= 14)) ||
                        (x === 5 && (y === 4 || y === 8 || y === 12)) ||
                        (x === 10 && (y >= 1 && y <= 15)) || (x === 11 && y % 4 !== 1) ||
                        (x === 12 && (y === 3 || y === 7 || y === 11)) ||
                        (x === 7 && (y >= 6 && y <= 13)) || (x === 8 && y % 2 === 0)
                    );
                    if (vineMask) {
                        let c = (x + y) % 3 === 0 ? '#1b5e20' : ((x + y) % 2 === 0 ? '#2e7d32' : '#43a047');
                        p(x, y, c);
                    }
                }
                else if (id === IDS.MELON) {
                    let stripe = Math.sin(x * 0.9 + Math.sin(y * 0.4) * 0.7);
                    let c;
                    if (stripe > 0.25) c = (x + y) % 4 === 0 ? '#4caf50' : '#388e3c';
                    else if (stripe < -0.25) c = (x + y) % 4 === 0 ? '#1b5e20' : '#2e7d32';
                    else c = '#28692c';
                    if (x === 0 || x === 15 || y === 0 || y === 15) {
                        if ((x + y) % 2 === 0) c = '#1b5e20';
                    }
                    p(x, y, c);
                }
                else if (id === IDS.MELON_SLICE) {
                    if (y >= 3 && y <= 13 && x >= 2 && x <= 13) {
                        let inWedge = (x + y >= 9 && x + y <= 21 && y - x <= 7 && x - y <= 7);
                        if (inWedge) {
                            let isRind = (x === 2 || y === 13 || (x + y === 9) || (x + y === 10));
                            let isRindWhite = (x === 3 || y === 12 || x + y === 11);
                            if (isRind) p(x, y, '#2e7d32');
                            else if (isRindWhite) p(x, y, '#e8f5e9');
                            else {
                                let isSeed = (x === 7 && y === 8) || (x === 10 && y === 7) || (x === 8 && y === 10);
                                p(x, y, isSeed ? '#1a1a1a' : ((x + y) % 3 === 0 ? '#d32f2f' : '#ef5350'));
                            }
                        }
                    }
                }
                else if (id === IDS.MELON_SEEDS) {
                    const mSeedDots = [
                        [5, 9, '#262626'], [6, 8, '#404040'], [7, 7, '#d97706'], [7, 8, '#262626'],
                        [9, 10, '#262626'], [10, 9, '#404040'], [11, 8, '#d97706'], [11, 9, '#262626'],
                        [7, 12, '#262626'], [8, 11, '#404040'], [9, 11, '#262626']
                    ];
                    mSeedDots.forEach(([sx, sy, scol]) => p(sx, sy, scol));
                }
                else if (id === IDS.FERN) {
                    if (x >= 7 && x <= 8 && y >= 9 && y <= 15) p(x, y, '#2e7d32');
                    if ((x >= 4 && x <= 11) && (y >= 4 && y <= 12)) {
                        let isFrond = (Math.abs(x - 7.5) <= (14 - y) * 0.7);
                        if (isFrond && (x + y) % 2 === 0) {
                            p(x, y, (x + y) % 3 === 0 ? '#43a047' : '#2e7d32');
                        }
                    }
                }
                else if (id === IDS.BAMBOO) {
                    if (x >= 6 && x <= 9) {
                        let isNode = (y === 3 || y === 8 || y === 13);
                        let c = isNode ? '#2e7d32' : ((x === 6) ? '#66bb6a' : (x === 9 ? '#388e3c' : '#4caf50'));
                        p(x, y, c);
                    }
                    if ((y === 4 && (x === 5 || x === 10)) || (y === 3 && (x === 4 || x === 11))) p(x, y, '#81c784');
                    if ((y === 9 && (x === 5 || x === 10)) || (y === 8 && (x === 4 || x === 11))) p(x, y, '#81c784');
                }
                else if (id === IDS.MELON_STEM) {
                    if (x >= 7 && x <= 8 && y >= 11 && y <= 15) p(x, y, '#2e7d32');
                    if (x >= 5 && x <= 10 && y >= 7 && y <= 10 && (x + y) % 2 === 0) p(x, y, '#66bb6a');
                    if (x >= 3 && x <= 6 && y >= 5 && y <= 8) p(x, y, '#43a047');
                }
                else if (id === IDS.PRISM_GLASS) {
                    const isBorder = (x === 0 || x === 15 || y === 0 || y === 15);
                    const isInnerBorder = (x === 1 || x === 14 || y === 1 || y === 14);
                    if (isBorder) {
                        p(x, y, (x <= 1 || y <= 1) ? '#ffffff' : ((x >= 14 || y >= 14) ? '#6366f1' : '#c084fc'));
                    } else if (isInnerBorder) {
                        p(x, y, '#e0e7ff');
                    } else {
                        // Refractive translucent glass lattice
                        let isGlint1 = (x + y === 7 || x + y === 8) && (x >= 2 && x <= 6);
                        let isGlint2 = (x + y === 19 || x + y === 20) && (x >= 8 && x <= 13);
                        let isSpark = (x === 4 && y === 4) || (x === 11 && y === 11);
                        if (isSpark) p(x, y, '#ffffff');
                        else if (isGlint1 || isGlint2) p(x, y, '#c7d2fe');
                        else if ((x + y) % 5 === 0) p(x, y, '#a5b4fc');
                        else if ((x * 3 + y * 7) % 11 === 0) p(x, y, '#fbcfe8');
                    }
                }
                else if (id === IDS.VOID_STONE_BRICK) {
                    const isMortarH = (y === 3 || y === 7 || y === 11 || y === 15);
                    const isMortarV = ((y < 3 && x === 8) || (y > 3 && y < 7 && (x === 4 || x === 12)) ||
                                       (y > 7 && y < 11 && x === 8) || (y > 11 && y < 15 && (x === 4 || x === 12)));
                    if (isMortarH || isMortarV) {
                        p(x, y, ((x + y) % 3 === 0) ? '#8b5cf6' : '#581c87');
                    } else {
                        const brickNoise = (x * 7 + y * 13) % 7;
                        if (brickNoise === 0) p(x, y, '#3b0764');
                        else if (brickNoise === 1) p(x, y, '#4c1d95');
                        else if (brickNoise === 2) p(x, y, '#2e1065');
                        else if (brickNoise === 3) p(x, y, '#1e102d');
                        else if (brickNoise === 4) p(x, y, '#6b21a8');
                        else p(x, y, '#241038');
                    }
                }
                else if (id === IDS.ASTRAL_INFUSER) {
                    // Heavy obsidian station with gold brackets and floating celestial core
                    if (y >= 8) {
                        // Obsidian Base
                        let isCornerGold = (x <= 2 || x >= 13) && (y >= 13);
                        let isRune = (y === 11 && (x === 5 || x === 7 || x === 10)) || (y === 10 && x === 8);
                        if (isCornerGold) p(x, y, (x + y) % 2 === 0 ? '#fbbf24' : '#d97706');
                        else if (isRune) p(x, y, '#c084fc');
                        else p(x, y, (x + y) % 3 === 0 ? '#1e102d' : ((x + y) % 2 === 0 ? '#2e1065' : '#0f0919'));
                    } else if (y >= 6) {
                        // Altar Rim
                        p(x, y, (x === 0 || x === 15) ? '#fbbf24' : ((x >= 5 && x <= 10) ? '#581c87' : '#3b0764'));
                    } else {
                        // Floating Astral Singularity Gem
                        let dx = Math.abs(x - 7.5);
                        let dy = Math.abs(y - 2.5);
                        if (dx + dy <= 3) {
                            if (dx + dy <= 1) p(x, y, '#ffffff');
                            else if (dx <= 1 && dy <= 1) p(x, y, '#f3e8ff');
                            else p(x, y, (x + y) % 2 === 0 ? '#c084fc' : '#38bdf8');
                        }
                    }
                }
                else if (id === IDS.VOID_BERRY_BUSH) {
                    const bushMask = (
                        (x >= 2 && x <= 13 && y >= 3 && y <= 15) &&
                        !((x <= 3 || x >= 12) && y <= 4)
                    );
                    if (bushMask) {
                        // Twilight leaf base
                        let leafCol = (x + y) % 3 === 0 ? '#1e1b4b' : ((x + y) % 2 === 0 ? '#312e81' : '#172554');
                        p(x, y, leafCol);
                    }
                    // Glowing violet berries
                    const berryDots = [
                        [4, 6, '#c084fc', '#ffffff'], [5, 6, '#a855f7', '#f3e8ff'], [4, 7, '#7c3aed', '#c084fc'],
                        [10, 5, '#c084fc', '#ffffff'], [11, 5, '#a855f7', '#f3e8ff'], [11, 6, '#7c3aed', '#c084fc'],
                        [7, 9, '#c084fc', '#ffffff'], [8, 9, '#a855f7', '#f3e8ff'], [8, 10, '#7c3aed', '#c084fc'],
                        [5, 12, '#a855f7', '#c084fc'], [10, 11, '#c084fc', '#f3e8ff']
                    ];
                    berryDots.forEach(([bx, by, b1, b2]) => {
                        p(bx, by, b1);
                        if (bx > 0 && by > 0 && Math.random() < 0.3) p(bx, by, b2);
                    });
                }
                else if (id === IDS.SUNBURST_MELON) {
                    let stripe = Math.sin(x * 0.9 + Math.sin(y * 0.4) * 0.7);
                    let c;
                    if (stripe > 0.25) c = (x + y) % 4 === 0 ? '#fef08a' : '#fde047';
                    else if (stripe < -0.25) c = (x + y) % 4 === 0 ? '#b45309' : '#d97706';
                    else c = '#f59e0b';
                    if (x === 0 || x === 15 || y === 0 || y === 15) {
                        if ((x + y) % 2 === 0) c = '#78350f';
                    }
                    p(x, y, c);
                }
                else if (id === IDS.ASTRAL_EMERALD) {
                    // Authentic Minecraft diamond-cut gem in celestial Astral Violet
                    // 1. Dark Void Outline
                    const outline = [
                        [5,1],[6,1],[7,1],[8,1],[9,1],[10,1],
                        [4,2],[11,2],[3,3],[12,3],[2,4],[13,4],
                        [1,5],[1,6],[1,7],[1,8],[1,9],[1,10],
                        [14,5],[14,6],[14,7],[14,8],[14,9],[14,10],
                        [2,11],[13,11],[3,12],[12,12],[4,13],[11,13],
                        [5,14],[6,14],[7,14],[8,14],[9,14],[10,14]
                    ];
                    outline.forEach(([gx, gy]) => p(gx, gy, '#140528'));

                    // 2. Exact interior facet fills strictly bounded by outline
                    const astralPalette = {
                        W: '#ffffff', // Starlight glint
                        H: '#f3e8ff', // Celestial highlight
                        L: '#d8b4fe', // Light lavender
                        V: '#c084fc', // Bright violet
                        P: '#a855f7', // Astral purple
                        M: '#9333ea', // Core purple
                        D: '#7e22ce', // Deep purple
                        S: '#581c87', // Shaded void
                        Z: '#3b0764', // Dark void facet
                        B: '#1e0836'  // Deepest void base
                    };

                    const astralRows = [
                        { y: 2,  startX: 5, cols: ['V','V','V','V','V','M'] },
                        { y: 3,  startX: 4, cols: ['W','W','W','H','H','P','M','M'] },
                        { y: 4,  startX: 3, cols: ['W','W','W','H','V','V','P','P','D','D'] },
                        { y: 5,  startX: 2, cols: ['H','V','V','P','P','P','P','M','M','D','D','D'] },
                        { y: 6,  startX: 2, cols: ['H','V','V','P','P','P','P','M','M','S','S','S'] },
                        { y: 7,  startX: 2, cols: ['V','P','P','M','M','M','M','D','D','S','S','S'] },
                        { y: 8,  startX: 2, cols: ['V','P','P','M','M','M','M','D','D','Z','Z','Z'] },
                        { y: 9,  startX: 2, cols: ['P','M','M','D','D','D','S','S','S','Z','Z','Z'] },
                        { y: 10, startX: 2, cols: ['P','M','M','D','D','D','S','S','S','Z','Z','Z'] },
                        { y: 11, startX: 3, cols: ['M','M','D','D','D','S','S','Z','Z','Z'] },
                        { y: 12, startX: 4, cols: ['D','D','S','S','S','Z','Z','Z'] },
                        { y: 13, startX: 5, cols: ['S','S','S','B','B','B'] }
                    ];

                    astralRows.forEach(row => {
                        row.cols.forEach((code, idx) => {
                            p(row.startX + idx, row.y, astralPalette[code]);
                        });
                    });
                }
                else if (id === IDS.EMERALD) {
                    // Authentic Minecraft diamond-cut gem in radiant Emerald Green
                    // 1. Dark Jade Outline
                    const outline = [
                        [5,1],[6,1],[7,1],[8,1],[9,1],[10,1],
                        [4,2],[11,2],[3,3],[12,3],[2,4],[13,4],
                        [1,5],[1,6],[1,7],[1,8],[1,9],[1,10],
                        [14,5],[14,6],[14,7],[14,8],[14,9],[14,10],
                        [2,11],[13,11],[3,12],[12,12],[4,13],[11,13],
                        [5,14],[6,14],[7,14],[8,14],[9,14],[10,14]
                    ];
                    outline.forEach(([gx, gy]) => p(gx, gy, '#0a2e16'));

                    // 2. Exact interior facet fills strictly bounded by outline
                    const emeraldPalette = {
                        W: '#ffffff', // Pure glint shine
                        H: '#86efac', // Mint highlight
                        L: '#4ade80', // Light emerald
                        E: '#22c55e', // Vivid pure emerald
                        M: '#16a34a', // Rich emerald body
                        D: '#15803d', // Mid jade body
                        S: '#166534', // Deep jade shadow
                        Z: '#0f4a24', // Dark shadow facet
                        B: '#0a2e16'  // Deepest base facet
                    };

                    const emeraldRows = [
                        { y: 2,  startX: 5, cols: ['L','L','L','L','L','M'] },
                        { y: 3,  startX: 4, cols: ['W','W','W','H','H','E','M','M'] },
                        { y: 4,  startX: 3, cols: ['W','W','W','H','L','L','E','E','D','D'] },
                        { y: 5,  startX: 2, cols: ['H','L','L','E','E','E','E','M','M','D','D','D'] },
                        { y: 6,  startX: 2, cols: ['H','L','L','E','E','E','E','M','M','S','S','S'] },
                        { y: 7,  startX: 2, cols: ['L','E','E','M','M','M','M','D','D','S','S','S'] },
                        { y: 8,  startX: 2, cols: ['L','E','E','M','M','M','M','D','D','Z','Z','Z'] },
                        { y: 9,  startX: 2, cols: ['E','M','M','D','D','D','S','S','S','Z','Z','Z'] },
                        { y: 10, startX: 2, cols: ['E','M','M','D','D','D','S','S','S','Z','Z','Z'] },
                        { y: 11, startX: 3, cols: ['M','M','D','D','D','S','S','Z','Z','Z'] },
                        { y: 12, startX: 4, cols: ['D','D','S','S','S','Z','Z','Z'] },
                        { y: 13, startX: 5, cols: ['S','S','S','B','B','B'] }
                    ];

                    emeraldRows.forEach(row => {
                        row.cols.forEach((code, idx) => {
                            p(row.startX + idx, row.y, emeraldPalette[code]);
                        });
                    });
                }
                else if (id === IDS.ASTRAL_SHARD) {
                    const shardPixels = [
                        [11, 2, '#ffffff'], [12, 2, '#ffffff'], [10, 3, '#f3e8ff'], [11, 3, '#c084fc'], [12, 3, '#38bdf8'],
                        [9, 4, '#e9d5ff'], [10, 4, '#a855f7'], [11, 4, '#7c3aed'], [12, 4, '#38bdf8'],
                        [8, 5, '#c084fc'], [9, 5, '#9333ea'], [10, 5, '#6b21a8'], [11, 5, '#0284c7'],
                        [7, 6, '#a855f7'], [8, 6, '#7c3aed'], [9, 6, '#581c87'], [10, 6, '#0369a1'],
                        [6, 7, '#c084fc'], [7, 7, '#9333ea'], [8, 7, '#6b21a8'], [9, 7, '#075985'],
                        [6, 8, '#a855f7'], [7, 8, '#7c3aed'], [8, 8, '#581c87'], [9, 8, '#0c4a6e'],
                        [5, 9, '#9333ea'], [6, 9, '#7c3aed'], [7, 9, '#3b0764'],
                        [4, 10, '#7c3aed'], [5, 10, '#581c87'], [6, 10, '#2e1065'],
                        [4, 11, '#6b21a8'], [5, 11, '#3b0764'],
                        [3, 12, '#581c87'], [4, 12, '#2e1065'],
                        [3, 13, '#3b0764']
                    ];
                    shardPixels.forEach(([sx, sy, scol]) => p(sx, sy, scol));
                }
                else if (id === IDS.VOID_BERRY_SPORES) {
                    const sporeDots = [
                        [7, 8, '#ffffff'], [8, 8, '#c084fc'], [7, 9, '#a855f7'], [8, 9, '#581c87'],
                        [5, 10, '#ffffff'], [6, 10, '#c084fc'], [5, 11, '#a855f7'], [6, 11, '#581c87'],
                        [10, 9, '#ffffff'], [11, 9, '#c084fc'], [10, 10, '#a855f7'], [11, 10, '#581c87'],
                        [4, 7, '#38bdf8'], [12, 7, '#c084fc'], [8, 5, '#e9d5ff'], [9, 13, '#38bdf8']
                    ];
                    sporeDots.forEach(([sx, sy, scol]) => p(sx, sy, scol));
                }
                else if (id === IDS.VOID_BERRY) {
                    // Small stem
                    p(7, 4, '#06b6d4'); p(8, 3, '#0891b2'); p(9, 4, '#06b6d4');
                    // Berries
                    const berries = [
                        [5, 7, '#c084fc'], [6, 6, '#ffffff'], [7, 6, '#e9d5ff'], [6, 7, '#a855f7'], [7, 7, '#7c3aed'], [6, 8, '#581c87'], [7, 8, '#3b0764'],
                        [9, 6, '#c084fc'], [10, 6, '#ffffff'], [9, 7, '#a855f7'], [10, 7, '#7c3aed'], [10, 8, '#581c87'],
                        [7, 9, '#c084fc'], [8, 9, '#ffffff'], [7, 10, '#a855f7'], [8, 10, '#7c3aed'], [8, 11, '#3b0764']
                    ];
                    berries.forEach(([bx, by, bcol]) => p(bx, by, bcol));
                }
                else if (id === IDS.SUNBURST_MELON_SEEDS) {
                    const smSeedDots = [
                        [5, 9, '#78350f'], [6, 8, '#b45309'], [7, 7, '#fef08a'], [7, 8, '#d97706'],
                        [9, 10, '#78350f'], [10, 9, '#b45309'], [11, 8, '#fef08a'], [11, 9, '#d97706'],
                        [7, 12, '#78350f'], [8, 11, '#b45309'], [9, 11, '#f59e0b']
                    ];
                    smSeedDots.forEach(([sx, sy, scol]) => p(sx, sy, scol));
                }
                else if (id === IDS.SUNBURST_MELON_SLICE) {
                    if (y >= 3 && y <= 13 && x >= 2 && x <= 13) {
                        let inWedge = (x + y >= 9 && x + y <= 21 && y - x <= 7 && x - y <= 7);
                        if (inWedge) {
                            let isRind = (x === 2 || y === 13 || (x + y === 9) || (x + y === 10));
                            let isRindWhite = (x === 3 || y === 12 || x + y === 11);
                            if (isRind) p(x, y, '#78350f');
                            else if (isRindWhite) p(x, y, '#fef08a');
                            else {
                                let isSeed = (x === 7 && y === 8) || (x === 10 && y === 7) || (x === 8 && y === 10);
                                p(x, y, isSeed ? '#262626' : ((x + y) % 3 === 0 ? '#f59e0b' : '#fbbf24'));
                            }
                        }
                    }
                }
                else if (id === IDS.MUSIC_DISC_SYNTHWAVE || id === IDS.MUSIC_DISC_AMBIENT) {
                    const isSynth = (id === IDS.MUSIC_DISC_SYNTHWAVE);
                    // Vinyl circular outline & grooves
                    for (let vy = 1; vy <= 14; vy++) {
                        for (let vx = 1; vx <= 14; vx++) {
                            let dist = Math.hypot(vx - 7.5, vy - 7.5);
                            if (dist <= 6.8) {
                                if (dist <= 2.2) {
                                    // Center label
                                    if (dist <= 0.8) p(vx, vy, '#ffffff'); // Center hole
                                    else p(vx, vy, isSynth ? '#ec4899' : '#06b6d4');
                                } else if (dist <= 2.8) {
                                    p(vx, vy, isSynth ? '#06b6d4' : '#6366f1');
                                } else if (dist <= 6.2) {
                                    // Vinyl groove lines
                                    let isGroove = (Math.floor(dist * 2) % 2 === 0);
                                    p(vx, vy, isGroove ? '#27272a' : '#18181b');
                                } else {
                                    p(vx, vy, '#09090b');
                                }
                            }
                        }
                    }
                    // Vinyl sheen reflection
                    p(4, 3, '#52525b'); p(5, 3, '#71717a'); p(10, 12, '#52525b'); p(11, 12, '#71717a');
                }
                else if (id === IDS.KINETIC_SHEARS) {
                    // Brass pivot bolt
                    p(7, 8, '#f59e0b'); p(8, 8, '#fbbf24');
                    // Handles
                    p(4, 11, '#3b0764'); p(5, 10, '#3b0764'); p(4, 12, '#581c87'); p(5, 12, '#581c87');
                    p(11, 11, '#3b0764'); p(10, 10, '#3b0764'); p(11, 12, '#581c87'); p(10, 12, '#581c87');
                    // Left blade
                    p(6, 7, '#7c3aed'); p(5, 6, '#9333ea'); p(5, 5, '#a855f7'); p(4, 4, '#c084fc'); p(4, 3, '#ffffff');
                    p(7, 6, '#581c87'); p(6, 5, '#7c3aed'); p(5, 4, '#9333ea');
                    // Right blade
                    p(9, 7, '#7c3aed'); p(10, 6, '#9333ea'); p(10, 5, '#a855f7'); p(11, 4, '#c084fc'); p(11, 3, '#ffffff');
                    p(8, 6, '#581c87'); p(9, 5, '#7c3aed'); p(10, 4, '#9333ea');
                }
            }
        }
        if (ORE_PALETTES[id]) {
            const pal = ORE_PALETTES[id];
            for (let i = 0; i < ORE_VEIN_MAP.length; i++) {
                const [vx, vy, vType] = ORE_VEIN_MAP[i];
                p(vx, vy, pal[vType]);
            }
        }
        tempCanvas.src = tempCanvas.toDataURL ? tempCanvas.toDataURL() : '';
        textures[id] = tempCanvas;
    }
    Object.values(IDS).forEach(id => { if (id !== IDS.AIR) generateTexture(id); });

    export const largeChestTexture = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (largeChestTexture) {
        largeChestTexture.width = 32; largeChestTexture.height = 16;
        const largeChestCtx = largeChestTexture.getContext('2d');
        for (let x = 0; x < 32; x++) {
            for (let y = 0; y < 16; y++) {
                let color;
                if (x < 1 || x > 30 || y < 2 || y > 13) color = '#4b2b18';
                else if (y === 3 || y === 12 || x === 2 || x === 29) color = '#a66b38';
                else color = (x + y) % 3 === 0 ? '#b9783d' : '#8f5b30';
                if (x === 15 || x === 16) color = '#d5a04c';
                if (y === 7 || y === 8) color = '#6b3d20';
                if ((x === 15 || x === 16) && y === 7) color = '#f1d27a';
                largeChestCtx.fillStyle = color;
                largeChestCtx.fillRect(x, y, 1, 1);
            }
        }
        largeChestTexture.src = largeChestTexture.toDataURL ? largeChestTexture.toDataURL() : '';
    }
    export const largeChestImage = largeChestTexture;

    export const furnaceLitTexture = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (furnaceLitTexture) {
        furnaceLitTexture.width = 16; furnaceLitTexture.height = 16;
        const fCtx = furnaceLitTexture.getContext('2d');
        const pLit = (x, y, color) => {
            fCtx.fillStyle = color;
            fCtx.fillRect(x, y, 1, 1);
        };
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const isBorder = (x === 0 || x === 15 || y === 0 || y === 15);
                const isMouth = (x >= 4 && x <= 11 && y >= 5 && y <= 13);
                const isArchTop = (y === 4 && x >= 5 && x <= 10);
                const isKeystone = (y === 3 && (x === 7 || x === 8));

                if (isBorder) {
                    pLit(x, y, (x + y) % 3 === 0 ? '#3f3f46' : '#52525b');
                } else if (isKeystone) {
                    pLit(x, y, '#a1a1aa');
                } else if (isArchTop) {
                    pLit(x, y, (x === 7 || x === 8) ? '#71717a' : '#52525b');
                } else if (isMouth) {
                    if (y <= 7) {
                        pLit(x, y, y === 5 ? '#09090b' : '#18181b');
                    } else {
                        const isGrateBar = (x === 5 || x === 7 || x === 9);
                        if (isGrateBar && y <= 10) {
                            pLit(x, y, '#27272a');
                        } else {
                            if (y === 13) pLit(x, y, (x === 7 || x === 8) ? '#fef08a' : '#f97316');
                            else if (y === 12) pLit(x, y, (x === 7 || x === 8) ? '#fef08a' : '#ea580c');
                            else if (y === 11) pLit(x, y, (x % 2 === 0) ? '#ea580c' : '#fbbf24');
                            else if (y === 10) pLit(x, y, (x === 7 || x === 8) ? '#f97316' : '#9a3412');
                            else if (y === 9) pLit(x, y, (x === 7) ? '#ea580c' : '#431407');
                            else pLit(x, y, '#18181b');
                        }
                    }
                } else {
                    const n = ((Math.floor(x / 3) * 7 + Math.floor(y / 3) * 13) % 4);
                    const c = n === 0 ? '#71717a' : (n === 1 ? '#52525b' : (n === 2 ? '#64748b' : '#78716c'));
                    pLit(x, y, (x % 4 === 0 || y % 4 === 0) ? '#3f3f46' : c);
                }
            }
        }
        furnaceLitTexture.src = furnaceLitTexture.toDataURL ? furnaceLitTexture.toDataURL() : '';
        textures.furnace_lit = furnaceLitTexture;
    }

    export function getBedLength(x, y) {
        let length = 0;
        while (length < BED_LENGTH && x + length < WORLD_WIDTH && world[x + length]?.[y] === IDS.BED) length++;
        return length;
    }

    export function getBedPairStart(x, y) {
        let groupStart = x;
        while (groupStart > 0 && world[groupStart - 1]?.[y] === IDS.BED) groupStart--;
        return groupStart + Math.floor((x - groupStart) / BED_LENGTH) * BED_LENGTH;
    }

    export function isBedRenderStart(x, y) {
        return x === getBedPairStart(x, y);
    }

    export const SKIN_W = 16;
export const SKIN_H = 32;
    export let playerSkinData = new Array(SKIN_W * SKIN_H).fill(null);
    export let editingSkinId = null;
    export let activeSkinId = 'default';
    export let skinCanvasObj = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (skinCanvasObj) {
        skinCanvasObj.width = SKIN_W; skinCanvasObj.height = SKIN_H;
    }
    export let previewWalkAnimId = null;
    export let isPreviewWalking = false;
    export let staticPreviewDrawn = false;

    export function getSkinSaveData() {
        if (typeof window !== 'undefined' && typeof window.playerSkinData !== 'undefined' && Array.isArray(window.playerSkinData) && window.playerSkinData.length === SKIN_W * SKIN_H) {
            return window.playerSkinData.slice(0, SKIN_W * SKIN_H);
        }
        return playerSkinData.slice(0, SKIN_W * SKIN_H);
    }


    export function drawCharacterArm(ctx, skinCanvas, srcX, srcY, destX, destY, pivotX, pivotY, angle, sX, sY, chestPal, renderItem = false, heldItemId = null) {
        ctx.save();
        ctx.translate(destX + pivotX, destY + pivotY);
        ctx.rotate(angle);
        
        // 1. Draw Arm Skin (4x12)
        ctx.drawImage(skinCanvas, srcX, srcY, 4, 12, -pivotX, -pivotY, 4 * sX, 12 * sY);
        
        // 2. Draw Chestplate Arm / Sleeve Armor (Shoulder pauldron & upper arm, leaving hand on exterior)
        if (chestPal) {
            ctx.fillStyle = chestPal.base;
            ctx.fillRect(-pivotX, -pivotY, 4 * sX, 6 * sY);
            ctx.fillStyle = chestPal.highlight;
            ctx.fillRect(-pivotX + 1 * sX, -pivotY, 2 * sX, 1 * sY);
            ctx.fillStyle = chestPal.trim;
            ctx.fillRect(-pivotX, -pivotY + 5 * sY, 4 * sX, 1 * sY);

            if (chestPal.isAstral) {
                const glintAlpha = 0.25 + Math.sin(Date.now() / 220) * 0.15;
                ctx.fillStyle = `rgba(216, 180, 254, ${glintAlpha})`;
                ctx.fillRect(-pivotX, -pivotY, 4 * sX, 6 * sY);
            }
        }

        // 3. Draw Held Item
        if (renderItem && heldItemId && textures[heldItemId]) {
            ctx.translate(-pivotX + (4 * sX) / 2, -pivotY + (12 * sY)); 
            ctx.rotate(-Math.PI / 4); // point outward
            ctx.drawImage(textures[heldItemId], -10, -20, 24, 24);
        }
        ctx.restore();
    }

    export function drawCharacterLeg(ctx, skinCanvas, srcX, srcY, destX, destY, pivotX, pivotY, angle, sX, sY, legPal, bootPal) {
        ctx.save();
        ctx.translate(destX + pivotX, destY + pivotY);
        ctx.rotate(angle);
        
        // 1. Draw Leg Skin (4x12)
        ctx.drawImage(skinCanvas, srcX, srcY, 4, 12, -pivotX, -pivotY, 4 * sX, 12 * sY);
        
        // 2. Draw Leggings Thigh Armor (Rotates with swinging leg)
        if (legPal) {
            ctx.fillStyle = legPal.base;
            ctx.fillRect(-pivotX, -pivotY, 4 * sX, 6 * sY);
            ctx.fillStyle = legPal.highlight;
            ctx.fillRect(-pivotX + 1 * sX, -pivotY + 1 * sY, 2 * sX, 4 * sY);
            ctx.fillStyle = legPal.trim;
            ctx.fillRect(-pivotX, -pivotY + 5 * sY, 4 * sX, 1 * sY);

            if (legPal.isAstral) {
                const glintAlpha = 0.25 + Math.sin(Date.now() / 220 + 1) * 0.15;
                ctx.fillStyle = `rgba(216, 180, 254, ${glintAlpha})`;
                ctx.fillRect(-pivotX, -pivotY, 4 * sX, 6 * sY);
            }
        }

        // 3. Draw Boot Armor (Attached directly to each individual swinging foot)
        if (bootPal) {
            ctx.fillStyle = bootPal.base;
            ctx.fillRect(-pivotX, -pivotY + 7 * sY, 4 * sX, 5 * sY);
            ctx.fillStyle = bootPal.highlight;
            ctx.fillRect(-pivotX + 1 * sX, -pivotY + 7 * sY, 2 * sX, 2 * sY);
            ctx.fillStyle = bootPal.trim;
            ctx.fillRect(-pivotX, -pivotY + 7 * sY, 4 * sX, 1 * sY);
            ctx.fillStyle = bootPal.dark;
            ctx.fillRect(-pivotX, -pivotY + 11 * sY, 4 * sX, 1 * sY); // Boot sole

            if (bootPal.isAstral) {
                const glintAlpha = 0.25 + Math.sin(Date.now() / 220 + 2) * 0.15;
                ctx.fillStyle = `rgba(216, 180, 254, ${glintAlpha})`;
                ctx.fillRect(-pivotX, -pivotY + 7 * sY, 4 * sX, 5 * sY);
            }
        }

        ctx.restore();
    }

    export function drawCharacterTorso(ctx, skinCanvas, destX, destY, pivotX, pivotY, angle, sX, sY, chestPal, legPal) {
        ctx.save();
        ctx.translate(destX + pivotX, destY + pivotY);
        ctx.rotate(angle);
        
        // 1. Draw Torso Skin (8x12)
        ctx.drawImage(skinCanvas, 4, 8, 8, 12, -pivotX, -pivotY, 8 * sX, 12 * sY);
        
        // 2. Draw Chestplate Breastplate on Torso
        if (chestPal) {
            ctx.fillStyle = chestPal.base;
            ctx.fillRect(-pivotX, -pivotY, 8 * sX, 10 * sY);
            ctx.fillStyle = chestPal.highlight;
            ctx.fillRect(-pivotX + 1 * sX, -pivotY + 1 * sY, 6 * sX, 2 * sY);
            ctx.fillStyle = chestPal.trim;
            ctx.fillRect(-pivotX, -pivotY + 9 * sY, 8 * sX, 1 * sY);
            ctx.fillStyle = chestPal.dark;
            ctx.fillRect(-pivotX + 3 * sX, -pivotY + 3 * sY, 2 * sX, 6 * sY);

            if (chestPal.isAstral) {
                const glintAlpha = 0.25 + Math.sin(Date.now() / 220 + 0.5) * 0.15;
                ctx.fillStyle = `rgba(216, 180, 254, ${glintAlpha})`;
                ctx.fillRect(-pivotX, -pivotY, 8 * sX, 10 * sY);
            }
        }

        // 3. Draw Leggings Pelvis / Waistband on Lower Torso
        if (legPal) {
            ctx.fillStyle = legPal.base;
            ctx.fillRect(-pivotX, -pivotY + 10 * sY, 8 * sX, 2 * sY);
            ctx.fillStyle = legPal.trim;
            ctx.fillRect(-pivotX, -pivotY + 10 * sY, 8 * sX, 1 * sY);

            if (legPal.isAstral) {
                const glintAlpha = 0.25 + Math.sin(Date.now() / 220 + 1.5) * 0.15;
                ctx.fillStyle = `rgba(216, 180, 254, ${glintAlpha})`;
                ctx.fillRect(-pivotX, -pivotY + 10 * sY, 8 * sX, 2 * sY);
            }
        }

        ctx.restore();
    }

    export function drawCharacterHead(ctx, skinCanvas, destX, destY, pivotX, pivotY, angle, sX, sY, helmetPal) {
        ctx.save();
        ctx.translate(destX + pivotX, destY + pivotY);
        ctx.rotate(angle);
        
        // 1. Draw Head Skin (8x8)
        ctx.drawImage(skinCanvas, 4, 0, 8, 8, -pivotX, -pivotY, 8 * sX, 8 * sY);
        
        // 2. Draw Helmet Armor Overlay
        if (helmetPal) {
            ctx.fillStyle = helmetPal.base;
            ctx.fillRect(-pivotX, -pivotY, 8 * sX, 3 * sY); // Cap
            ctx.fillRect(-pivotX, -pivotY, 1 * sX, 6 * sY); // Left ear
            ctx.fillRect(-pivotX + 7 * sX, -pivotY, 1 * sX, 6 * sY); // Right ear
            ctx.fillStyle = helmetPal.highlight;
            ctx.fillRect(-pivotX + 1 * sX, -pivotY, 6 * sX, 1 * sY); // Brow highlight
            ctx.fillStyle = helmetPal.dark;
            ctx.fillRect(-pivotX + 3 * sX, -pivotY + 3 * sY, 2 * sX, 3 * sY); // Nose guard

            if (helmetPal.isAstral) {
                const glintAlpha = 0.25 + Math.sin(Date.now() / 220) * 0.15;
                ctx.fillStyle = `rgba(216, 180, 254, ${glintAlpha})`;
                ctx.fillRect(-pivotX, -pivotY, 8 * sX, 6 * sY);
            }
        }

        ctx.restore();
    }

    export function getArmorPalette(armorPiece) {
        if (!armorPiece || !armorPiece.id) return null;
        const id = armorPiece.id;
        if (id === IDS.HELMET_IRON || id === IDS.CHESTPLATE_IRON || id === IDS.LEGGINGS_IRON || id === IDS.BOOTS_IRON) {
            return { base: '#d8dee9', trim: '#94a3b8', highlight: '#ffffff', dark: '#64748b' };
        }
        if (id === IDS.HELMET_GOLD || id === IDS.CHESTPLATE_GOLD || id === IDS.LEGGINGS_GOLD || id === IDS.BOOTS_GOLD) {
            return { base: '#facc15', trim: '#ca8a04', highlight: '#fef08a', dark: '#854d0e' };
        }
        if (id === IDS.HELMET_DIAMOND || id === IDS.CHESTPLATE_DIAMOND || id === IDS.LEGGINGS_DIAMOND || id === IDS.BOOTS_DIAMOND) {
            return { base: '#22d3ee', trim: '#0891b2', highlight: '#cffafe', dark: '#164e63' };
        }
        if (id === IDS.ASTRAL_HELMET || id === IDS.ASTRAL_CHESTPLATE || id === IDS.ASTRAL_LEGGINGS || id === IDS.ASTRAL_BOOTS) {
            return { base: '#7c3aed', trim: '#5b21b6', highlight: '#e9d5ff', dark: '#2e1065', isAstral: true };
        }
        if (id === IDS.STRIDER_BOOTS) {
            return { base: '#059669', trim: '#047857', highlight: '#6ee7b7', dark: '#064e3b', isAstral: true };
        }
        return null;
    }

    // Central drawing function for local & remote characters with limb segmentation and armor overlays
    export function drawShoulderParrot(ctx, parrot, px, py, sX, sY) {
        if (!parrot) return;
        ctx.save();
        ctx.translate(px, py);

        const v = parrot.variant || 0;
        let cBody = '#dc2626', cWing = '#eab308', cFlight = '#2563eb', cBeak = '#1e293b', cCrest = null;
        if (v === 1) { cBody = '#16a34a'; cWing = '#ef4444'; cFlight = '#0d9488'; cBeak = '#fef08a'; }
        else if (v === 2) { cBody = '#0284c7'; cWing = '#38bdf8'; cFlight = '#1d4ed8'; cBeak = '#111827'; }
        else if (v === 3) { cBody = '#64748b'; cWing = '#f8fafc'; cFlight = '#475569'; cBeak = '#d1d5db'; cCrest = '#fde047'; }

        // Tail
        ctx.fillStyle = cFlight;
        ctx.fillRect(-1.5 * sX, 3.5 * sY, 2.5 * sX, 3.5 * sY);

        // Body
        ctx.fillStyle = cBody;
        ctx.fillRect(-1 * sX, 0, 3.5 * sX, 4.5 * sY);

        // Head
        ctx.fillRect(0.5 * sX, -3 * sY, 3 * sX, 3 * sY);

        // Crest if cockatiel
        if (cCrest) {
            ctx.fillStyle = cCrest;
            ctx.fillRect(0.5 * sX, -4.8 * sY, 1.5 * sX, 2 * sY);
        }

        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(1.8 * sX, -2.2 * sY, 1.2 * sX, 1.2 * sY);
        ctx.fillStyle = '#000000';
        ctx.fillRect(2.2 * sX, -2.2 * sY, 0.8 * sX, 1.2 * sY);

        // Beak
        ctx.fillStyle = cBeak;
        ctx.fillRect(3.5 * sX, -1.8 * sY, 1.2 * sX, 1.2 * sY);

        // Wing
        ctx.fillStyle = cWing;
        ctx.fillRect(-0.2 * sX, 0.8 * sY, 2.2 * sX, 2.6 * sY);

        ctx.restore();
    }

    export function drawCharacter(ctx, skinCanvas, x, y, w, h, facingRight, walkAnim, isMoving, isDamage, headTargetX, headTargetY, isAttacking, heldItemId, isClimbing = false, armorList = null, shoulderParrots = null, walkBlend = null) {
        const activeArmor = (STATE === 'MENU') ? (armorList || [null, null, null, null]) : (armorList !== null ? armorList : equippedArmor);
        ctx.save();
        ctx.translate(x, y);
        if (isDamage) {
            ctx.filter = 'sepia(1) saturate(8) hue-rotate(315deg) brightness(0.95)';
            if (Math.floor(frameCount / 4) % 2 === 0) ctx.globalAlpha = 0.75;
        }

        let sX = w / 16;
        let sY = h / 32;

        const blend = (walkBlend !== null && typeof walkBlend === 'number') ? Math.max(0, Math.min(1, walkBlend)) : (isMoving ? 1 : 0);
        let swing = (!isMoving && !isClimbing && blend <= 0) ? 0 : (isClimbing ? Math.sin(walkAnim) * Math.PI / 7 : Math.sin(walkAnim) * (Math.PI / 4.2) * blend);
        let armSwing = (!isMoving && !isClimbing && blend <= 0) ? 0 : (isClimbing ? -Math.PI / 1.5 + Math.sin(walkAnim) * Math.PI / 7 : Math.sin(walkAnim) * (Math.PI / 6) * blend);
        let frontArmSwing = isAttacking ? -Math.PI / 2 - Math.sin(frameCount * 0.4) * 0.5 : (isClimbing ? -Math.PI / 1.5 - Math.sin(walkAnim) * Math.PI / 7 : -armSwing);

        if (!facingRight) {
            ctx.translate(w, 0);
            ctx.scale(-1, 1);
        }

        let headAngle = 0;
        let headOffset = 0;

        const helmetPal = (activeArmor && activeArmor[0]) ? getArmorPalette(activeArmor[0]) : null;
        const chestPal = (activeArmor && activeArmor[1]) ? getArmorPalette(activeArmor[1]) : null;
        const legPal = (activeArmor && activeArmor[2]) ? getArmorPalette(activeArmor[2]) : null;
        const bootPal = (activeArmor && activeArmor[3]) ? getArmorPalette(activeArmor[3]) : null;

        // Proper Layer Draw Order (back to front):
        // 1. Back Arm (with shoulder sleeve armor)
        drawCharacterArm(ctx, skinCanvas, 12, 8, 6 * sX, 8 * sY, 2 * sX, 2 * sY, armSwing, sX, sY, chestPal, false, null);
        
        // Back shoulder parrot (if any)
        if (shoulderParrots && shoulderParrots.left) {
            drawShoulderParrot(ctx, shoulderParrots.left, 2 * sX, 4 * sY, sX, sY);
        }

        // 2. Back Leg (with back thigh armor and back boot moving with swinging foot)
        drawCharacterLeg(ctx, skinCanvas, 8, 20, 6 * sX, 20 * sY, 2 * sX, 2 * sY, -swing, sX, sY, legPal, bootPal);
        
        // 3. Torso (with chestplate breastplate and pelvis waistband)
        drawCharacterTorso(ctx, skinCanvas, 4 * sX, 8 * sY, 4 * sX, 6 * sY, 0, sX, sY, chestPal, legPal);
        
        // 4. Head (with helmet overlay)
        drawCharacterHead(ctx, skinCanvas, 4 * sX + headOffset, 0, 4 * sX, 6 * sY, headAngle, sX, sY, helmetPal);
        
        // 5. Front Leg (with front thigh armor and front boot moving with swinging foot)
        drawCharacterLeg(ctx, skinCanvas, 4, 20, 6 * sX, 20 * sY, 2 * sX, 2 * sY, swing, sX, sY, legPal, bootPal);
        
        // 6. Front Arm ON EXTERIOR (with shoulder sleeve armor, hands on the exterior, and held item)
        drawCharacterArm(ctx, skinCanvas, 0, 8, 6 * sX, 8 * sY, 2 * sX, 2 * sY, frontArmSwing, sX, sY, chestPal, true, heldItemId);

        // Front shoulder parrot (if any)
        if (shoulderParrots && shoulderParrots.right) {
            drawShoulderParrot(ctx, shoulderParrots.right, 9 * sX, 4 * sY, sX, sY);
        }

        ctx.restore();
    }

    export function drawFrontCharacter(ctx, skinCanvas, x, y, w, h, bounceOffset = 0) {
        if (!skinCanvas) return;
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Calculate aspect-fit centered rectangle for 16x32 front-facing character
        const scale = Math.min(w / 16, h / 32);
        const drawW = Math.round(16 * scale);
        const drawH = Math.round(32 * scale);
        const drawX = Math.round(x + (w - drawW) / 2);
        const drawY = Math.round(y + (h - drawH) / 2 - bounceOffset);

        ctx.drawImage(skinCanvas, 0, 0, 16, 32, drawX, drawY, drawW, drawH);
        ctx.restore();
    }

    export function drawPlayerHead(ctx, skinCanvas, x, y, size) {
        if (!skinCanvas) return;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        // Head in skinCanvas (16x32) is 8x8 pixels at source x: 4, y: 0, w: 8, h: 8
        ctx.drawImage(skinCanvas, 4, 0, 8, 8, Math.round(x), Math.round(y), Math.round(size), Math.round(size));
        ctx.restore();
    }

    export function setStaticPreviewDrawn(val) {
        staticPreviewDrawn = !!val;
        if (typeof window !== 'undefined') window.staticPreviewDrawn = staticPreviewDrawn;
    }

    export function renderStaticPlayerPreview() {
        let pCanvas = document.getElementById('player-preview-canvas');
        if (!pCanvas) return;
        let pCtx = pCanvas.getContext('2d');
        pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
        pCtx.imageSmoothingEnabled = false;
        const activeCanvas = (typeof window !== 'undefined' && window.skinCanvasObj) ? window.skinCanvasObj : skinCanvasObj;
        drawFrontCharacter(pCtx, activeCanvas, 0, 0, pCanvas.width, pCanvas.height, 0);
        staticPreviewDrawn = true;
        if (typeof window !== 'undefined') window.staticPreviewDrawn = true;
    }

    export function drawPlayerPreview(force = false) {
        if (force) {
            staticPreviewDrawn = false;
            if (typeof window !== 'undefined') window.staticPreviewDrawn = false;
        }
        if (!isPreviewWalking && (!staticPreviewDrawn || force)) {
            renderStaticPlayerPreview();
        }
    }

    export function startPlayerPreviewWalk() {
        if (isPreviewWalking) return; // Prevent double clicking or spamming while animation runs
        let pCanvas = document.getElementById('player-preview-canvas');
        if (!pCanvas || getComputedStyle(pCanvas).display === 'none') return;

        isPreviewWalking = true;
        staticPreviewDrawn = false;
        if (typeof window !== 'undefined') window.staticPreviewDrawn = false;
        let startTime = performance.now();
        let duration = 1600; // ms

        if (previewWalkAnimId) {
            cancelAnimationFrame(previewWalkAnimId);
            previewWalkAnimId = null;
        }

        function animLoop(now) {
            if (!isPreviewWalking) {
                renderStaticPlayerPreview();
                return;
            }
            let elapsed = now - startTime;
            if (elapsed >= duration || STATE !== 'MENU') {
                isPreviewWalking = false;
                previewWalkAnimId = null;
                renderStaticPlayerPreview();
                return;
            }

            let pCtx = pCanvas.getContext('2d');
            pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
            pCtx.imageSmoothingEnabled = false;
            let walkAnimPhase = (elapsed / 1000) * (Math.PI * 4); // Constant smooth ~2 steps/sec
            const activeCanvas = (typeof window !== 'undefined' && window.skinCanvasObj) ? window.skinCanvasObj : skinCanvasObj;
            drawCharacter(pCtx, activeCanvas, 0, 0, pCanvas.width, pCanvas.height, true, walkAnimPhase, true, false, null, null, false, null, false, [null, null, null, null]);

            previewWalkAnimId = requestAnimationFrame(animLoop);
        }

        previewWalkAnimId = requestAnimationFrame(animLoop);
    }


    export class Particle {
        constructor(x = 0, y = 0, color = '#ffffff') {
            this.init(x, y, color);
        }
        init(x, y, color) {
            this.x = x; this.y = y;
            this.vx = (Math.random() - 0.5) * 8;
            this.vy = (Math.random() - 1) * 8;
            this.life = 20 + Math.random() * 15;
            this.color = color;
            this.size = Math.random() * 4 + 2;
            this.alive = true;
        }
        update() {
            if (!this.alive) return;
            this.x += this.vx; this.y += this.vy; this.vy += GRAVITY * 0.9;
            this.life--;
            if (this.life <= 0) this.alive = false;
        }
        draw(ctx, camX, camY) {
            if (!this.alive) return;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - camX, this.y - camY, this.size, this.size);
        }
    }

    export const MAX_PARTICLES = 160;
    export function spawnParticle(x, y, color) {
        for (let i = 0; i < particles.length; i++) {
            if (!particles[i].alive) {
                particles[i].init(x, y, color);
                return particles[i];
            }
        }
        if (particles.length < MAX_PARTICLES) {
            const p = new Particle(x, y, color);
            particles.push(p);
            return p;
        }
        const p = particles[0];
        p.init(x, y, color);
        return p;
    }

    export class FloatingText {
        constructor(x, y, text, color) {
            this.x = x; this.y = y; this.text = text; this.color = color;
            this.life = 40; this.vy = -1.5;
        }
        update() { this.y += this.vy; this.life--; }
        draw(ctx, camX, camY) {
            ctx.globalAlpha = Math.max(0, this.life / 40);
            ctx.fillStyle = this.color; ctx.font = '24px "VT323"';
            ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
            ctx.strokeText(this.text, this.x - camX, this.y - camY);
            ctx.fillText(this.text, this.x - camX, this.y - camY);
            ctx.globalAlpha = 1.0;
        }
    }

    export const NOTE_PATTERNS = [
        // 0: Single Eighth Note ♪ (8x8)
        [
            "....###.",
            "....###.",
            "....##.#",
            "....##..",
            "....##..",
            "..####..",
            ".######.",
            "..####.."
        ],
        // 1: Beamed Double Note ♫ (9x8)
        [
            ".#######.",
            ".#######.",
            ".##...##.",
            ".##...##.",
            ".##...##.",
            "####.####",
            "#########",
            ".###..###"
        ]
    ];

    export class NoteParticle {
        constructor(x = 0, y = 0) {
            this.init(x, y);
        }
        init(x, y) {
            this.startX = x;
            this.x = x;
            this.y = y;
            this.patternIndex = Math.random() < 0.5 ? 0 : 1;
            const colors = ['#f43f5e', '#ec4899', '#a855f7', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#eab308'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.life = 55 + Math.random() * 25;
            this.maxLife = this.life;
            this.vy = -(1.2 + Math.random() * 0.8);
            this.freq = 0.08 + Math.random() * 0.06;
            this.amp = 8 + Math.random() * 8;
            this.time = Math.random() * 100;
            this.pSize = 2;
            this.alive = true;
        }
        update() {
            if (!this.alive) return;
            this.time += 1;
            this.y += this.vy;
            this.x = this.startX + Math.sin(this.time * this.freq) * this.amp;
            this.life--;
            if (this.life <= 0) this.alive = false;
        }
        draw(ctx, camX, camY) {
            if (!this.alive) return;
            const alpha = Math.max(0, Math.min(1, this.life / (this.maxLife * 0.25)));
            const pattern = NOTE_PATTERNS[this.patternIndex] || NOTE_PATTERNS[0];
            const rows = pattern.length;
            const cols = pattern[0].length;
            const pSize = this.pSize;
            const originX = Math.round(this.x - camX - (cols * pSize) / 2);
            const originY = Math.round(this.y - camY - (rows * pSize) / 2);

            ctx.save();
            ctx.globalAlpha = alpha;
            // 1) 1-texel black pixel drop-shadow
            ctx.fillStyle = '#000000';
            for (let r = 0; r < rows; r++) {
                const rowStr = pattern[r];
                for (let c = 0; c < cols; c++) {
                    if (rowStr[c] === '#') {
                        ctx.fillRect(originX + c * pSize + 1, originY + r * pSize + 1, pSize, pSize);
                    }
                }
            }
            // 2) Main colored pixel note
            ctx.fillStyle = this.color;
            for (let r = 0; r < rows; r++) {
                const rowStr = pattern[r];
                for (let c = 0; c < cols; c++) {
                    if (rowStr[c] === '#') {
                        ctx.fillRect(originX + c * pSize, originY + r * pSize, pSize, pSize);
                    }
                }
            }
            ctx.restore();
        }
    }

    export let noteParticles = [];
    export function spawnNoteParticle(x, y) {
        for (let i = 0; i < noteParticles.length; i++) {
            if (!noteParticles[i].alive) {
                noteParticles[i].init(x, y);
                return noteParticles[i];
            }
        }
        if (noteParticles.length < 50) {
            const np = new NoteParticle(x, y);
            noteParticles.push(np);
            return np;
        }
        const np = noteParticles[0];
        np.init(x, y);
        return np;
    }
    
    export function getBlockColor(id) {
        if (id === IDS.GRASS || id === IDS.LEAVES || id === IDS.SHORT_GRASS || id === IDS.TALL_GRASS) return '#42b035';
        if (id === IDS.FLOWER_RED) return '#e53935';
        if (id === IDS.FLOWER_YELLOW) return '#fdd835';
        if (id === IDS.DIRT || id === IDS.WOOD || id === IDS.PLANKS) return '#79553a';
        if (id === IDS.PLOWED_DIRT) return '#573a23';
        if (id === IDS.WHEAT_STAGE_1 || id === IDS.WHEAT_STAGE_2) return '#42b035';
        if (id === IDS.WHEAT_STAGE_3) return '#c4b035';
        if (id === IDS.WHEAT_STAGE_4) return '#eab308';
        if (id === IDS.GOLD_ORE || id === IDS.TORCH) return '#ffcf33';
        if (id === IDS.IRON_ORE) return '#c27b55';
        if (id === IDS.DIAMOND_ORE || id === IDS.DIAMOND) return '#55e6e6';
        if (id === IDS.COAL_ORE) return '#222';
        if (id === IDS.SAND) return '#e6cc80';
        if (id === IDS.SNOW) return '#ffffff';
        if (id === IDS.CACTUS) return '#4caf50';
        if (id === IDS.BED) return '#d83b3b';
        if (id === IDS.JUKEBOX) return '#5c3a21';
        if ([IDS.DOOR, IDS.DOOR_TOP, IDS.DOOR_OPEN, IDS.DOOR_OPEN_TOP].includes(id)) return '#9e6b3d';
        if ([IDS.JUNGLE_DOOR, IDS.JUNGLE_DOOR_TOP, IDS.JUNGLE_DOOR_OPEN, IDS.JUNGLE_DOOR_OPEN_TOP].includes(id)) return '#8d5d36';
        if (id === IDS.WOOL) return '#f5f5f5';
        return '#7d7d7d'; 
    }

    export function isClimbableBlock(block) {
        return block === IDS.LADDER || block === IDS.VINES;
    }

    export function isSolidWorldBlock(x, y, block) {
        if (block === IDS.AIR || block === IDS.TORCH || block === IDS.LEAVES || block === IDS.JUNGLE_LEAVES ||
            block === IDS.SAPLING || block === IDS.JUNGLE_SAPLING || block === IDS.WATER || block === IDS.LAVA ||
            block === IDS.SHORT_GRASS || block === IDS.TALL_GRASS || block === IDS.FLOWER_RED || block === IDS.FLOWER_YELLOW ||
            block === IDS.LADDER || block === IDS.VINES || block === IDS.FERN || block === IDS.MELON_STEM ||
            block === IDS.VOID_BERRY_BUSH || block === IDS.BAMBOO || block === IDS.SIGN) return false;
        if (block === IDS.WHEAT_STAGE_1 || block === IDS.WHEAT_STAGE_2 || block === IDS.WHEAT_STAGE_3 || block === IDS.WHEAT_STAGE_4) return false;
        if (block === IDS.DOOR_OPEN || block === IDS.DOOR_OPEN_TOP || block === IDS.JUNGLE_DOOR_OPEN || block === IDS.JUNGLE_DOOR_OPEN_TOP) return false;
        if (block === IDS.WOOD || block === IDS.JUNGLE_WOOD) {
            return !nonCollidableTreeWood.has(`${x}_${y}`);
        }
        return true;
    }

    export function getFluidKey(x, y) { return `${x}_${y}`; }

    export function getChestKey(x, y) { return `${x}_${y}`; }
    export function getChestGroup(x, y) {
        const neighbors = [[x, y], [x - 1, y], [x + 1, y]].filter(([cx, cy]) => world[cx]?.[cy] === IDS.CHEST);
        const key = neighbors.map(([cx, cy]) => getChestKey(cx, cy)).sort()[0];
        const existingGroups = neighbors.map(([cx, cy]) => chests.get(getChestKey(cx, cy))).filter(Boolean);
        if (!chests.has(key) && existingGroups.length) {
            const mergedItems = existingGroups.flatMap(group => group.items).slice(0, 54);
            chests.set(key, { items: mergedItems.length ? mergedItems : new Array(neighbors.length > 1 ? 54 : 27).fill(null) });
            neighbors.forEach(([cx, cy]) => { const neighborKey = getChestKey(cx, cy); if (neighborKey !== key) chests.delete(neighborKey); });
        }
        if (!chests.has(key)) chests.set(key, { items: new Array(neighbors.length > 1 ? 54 : 27).fill(null) });
        const chest = chests.get(key);
        if (neighbors.length > 1 && chest.items.length !== 54) chest.items.length = 54;
        return { key, chest, size: neighbors.length > 1 ? 54 : 27 };
    }
    export function syncChest(key) {
        if (!isMultiplayer) return;
        broadcastDataPacket({
            type: 'chest',
            key: key,
            items: chests.get(key)?.items || []
        });
    }

    export function applyChestState(key, data) {
        if (!key || !data || !Array.isArray(data.items)) return;
        chests.set(key, { items: data.items.slice(0, 54) });
        if (openedChest?.key === key) {
            openedChest.chest = chests.get(key);
            openedChest.size = openedChest.chest.items.length > 27 ? 54 : 27;
            updateUI(false);
        }
    }

    export function getFluid(x, y) {
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return null;
        return fluids.get(getFluidKey(x, y)) || null;
    }

    export function getActivePhysicsWorld(entity = null) {
        if (entity?.isMenuEntity || (typeof STATE !== 'undefined' && STATE === 'MENU')) {
            return (typeof menuWorld !== 'undefined' && menuWorld && menuWorld.blocks) ? menuWorld.blocks : null;
        }
        return (typeof world !== 'undefined' && world) ? world : ((typeof menuWorld !== 'undefined' && menuWorld && menuWorld.blocks) ? menuWorld.blocks : null);
    }

    export function getActivePhysicsTerrain(entity = null) {
        if (entity?.isMenuEntity || (typeof STATE !== 'undefined' && STATE === 'MENU')) {
            return (typeof menuWorld !== 'undefined' && menuWorld && (menuWorld.surfaceHeights || menuWorld.terrain)) ? (menuWorld.surfaceHeights || menuWorld.terrain) : null;
        }
        return (typeof surfaceHeights !== 'undefined' && surfaceHeights && surfaceHeights.length) ? surfaceHeights : ((typeof menuWorld !== 'undefined' && menuWorld && (menuWorld.surfaceHeights || menuWorld.terrain)) ? (menuWorld.surfaceHeights || menuWorld.terrain) : null);
    }

    export function isWater(x, y, entity = null) {
        const activeWorld = getActivePhysicsWorld(entity);
        if (!activeWorld) return false;
        const curWorldW = activeWorld.length;
        const curWorldH = activeWorld[0]?.length || 0;
        if (x < 0 || x >= curWorldW || y < 0 || y >= curWorldH) return false;
        return activeWorld[x]?.[y] === IDS.WATER || (typeof fluids !== 'undefined' && fluids.get(getFluidKey(x, y))?.type === IDS.WATER);
    }

    export function isLava(x, y, entity = null) {
        const activeWorld = getActivePhysicsWorld(entity);
        if (!activeWorld) return false;
        const curWorldW = activeWorld.length;
        const curWorldH = activeWorld[0]?.length || 0;
        if (x < 0 || x >= curWorldW || y < 0 || y >= curWorldH) return false;
        return activeWorld[x]?.[y] === IDS.LAVA || (typeof fluids !== 'undefined' && fluids.get(getFluidKey(x, y))?.type === IDS.LAVA);
    }

    export function setFluid(x, y, fluid) {
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return false;
        if (isSolidWorldBlock(x, y, world[x]?.[y])) return false;
        
        let curBlock = world[x]?.[y];
        if (curBlock !== IDS.AIR && !isSolidWorldBlock(x, y, curBlock)) {
            if (fluid.type === IDS.WATER && [IDS.TORCH, IDS.FLOWER_RED, IDS.FLOWER_YELLOW, IDS.SHORT_GRASS, IDS.TALL_GRASS, IDS.SAPLING].includes(curBlock)) {
                if (curBlock === IDS.SAPLING) {
                    saplingGrowthQueue.delete(`${x}_${y}`);
                    saplingBlockedWarnings.delete(`${x}_${y}`);
                }
                dropItemForWorld(curBlock, x * TILE_SIZE + 10, y * TILE_SIZE + 10, 1);
                world[x][y] = IDS.AIR;
                syncBlock(x, y, IDS.AIR);
                checkSandFallAbove(x, y);
            } else if (fluid.type === IDS.LAVA) {
                if (curBlock === IDS.SAPLING) {
                    saplingGrowthQueue.delete(`${x}_${y}`);
                    saplingBlockedWarnings.delete(`${x}_${y}`);
                }
                for (let i = 0; i < 4; i++) {
                    particles.push(new Particle(x * TILE_SIZE + 20, y * TILE_SIZE + 20, '#ff4500'));
                }
                world[x][y] = IDS.AIR;
                syncBlock(x, y, IDS.AIR);
                checkSandFallAbove(x, y);
            }
        }
        
        fluids.set(getFluidKey(x, y), {
            type: fluid.type,
            level: fluid.level || 0,
            source: fluid.source === true,
            falling: fluid.falling === true,
            x: x,
            y: y
        });
        wakeFluidsAround(x, y);
        return true;
    }

    export function removeFluid(x, y) {
        const deleted = fluids.delete(getFluidKey(x, y));
        if (deleted) wakeFluidsAround(x, y);
        return deleted;
    }

    export function wakeFluidsAround(x, y) {
        for (let offsetX = -2; offsetX <= 2; offsetX++) {
            for (let offsetY = -2; offsetY <= 2; offsetY++) {
                let wx = x + offsetX;
                let wy = y + offsetY;
                if (wx >= 0 && wx < WORLD_WIDTH && wy >= 0 && wy < WORLD_HEIGHT) {
                    fluidWakeQueue.add(getFluidKey(wx, wy));
                }
            }
        }
    }

    export function triggerSteamEffect(x, y) {
        for (let i = 0; i < 5; i++) {
            let p = new Particle(x * TILE_SIZE + 20 + (Math.random() - 0.5) * 16, y * TILE_SIZE + 10, '#d0e8f2');
            p.vy = -1.5 - Math.random() * 2.0;
            p.vx = (Math.random() - 0.5) * 1.5;
            p.life = 25;
            particles.push(p);
        }
    }

    export function updateFluids() {
        fluidTick++;
        const waterTick = fluidTick % WATER_FLOW_INTERVAL === 0;
        const lavaTick = fluidTick % LAVA_FLOW_INTERVAL === 0;
        if (!waterTick && !lavaTick && fluidWakeQueue.size === 0) return;

        const toSet = [];
        const toRemove = [];
        const toSolidify = [];

        // Snapshot existing entries
        const entries = Array.from(fluids.entries());

        const pTileX = Math.floor((player?.x || 0) / TILE_SIZE);
        const pTileY = Math.floor((player?.y || 0) / TILE_SIZE);
        for (let i = 0; i < entries.length; i++) {
            const [key, fluid] = entries[i];
            const sep = key.indexOf('_');
            const x = parseInt(key.slice(0, sep), 10);
            const y = parseInt(key.slice(sep + 1), 10);

            // Proximity culling: Only simulate active fluid flow within 80 tiles horizontally of player
            if (player && Math.abs(x - pTileX) > 80) continue;
            const isWaterCell = fluid.type === IDS.WATER;
            const isLavaCell = fluid.type === IDS.LAVA;
            const isAwake = fluidWakeQueue.has(key);

            if (isWaterCell && !waterTick && !isAwake) continue;
            if (isLavaCell && !lavaTick && !isAwake) continue;
            fluidWakeQueue.delete(key);

            const maxFlow = isWaterCell ? WATER_FLOW_MAX : LAVA_FLOW_MAX;

            // 1. Check drainage for non-source flowing fluid
            if (!fluid.source) {
                let hasFeeder = false;
                const above = getFluid(x, y - 1);
                if (above && above.type === fluid.type) {
                    hasFeeder = true;
                } else {
                    const left = getFluid(x - 1, y);
                    if (left && left.type === fluid.type && (left.source || (!left.falling && left.level < fluid.level))) {
                        hasFeeder = true;
                    }
                    const right = getFluid(x + 1, y);
                    if (right && right.type === fluid.type && (right.source || (!right.falling && right.level < fluid.level))) {
                        hasFeeder = true;
                    }
                }

                if (!hasFeeder) {
                    toRemove.push([x, y]);
                    continue;
                }
            }

            // 2. Downward Flow (Gravity) & Resting State Transitions
            const belowY = y + 1;
            const isBelowSolid = belowY >= WORLD_HEIGHT || isSolidWorldBlock(x, belowY, world[x]?.[belowY]);
            const belowFluid = getFluid(x, belowY);
            const isResting = isBelowSolid || (belowFluid && belowFluid.type === fluid.type && !belowFluid.falling);

            // If previously marked as falling but now resting on solid ground or resting fluid, clear falling flag
            if (isResting && fluid.falling) {
                toSet.push([x, y, { ...fluid, falling: false }]);
                fluid.falling = false;
            }

            if (!isBelowSolid) {
                if (!belowFluid) {
                    // Flow straight down
                    toSet.push([x, belowY, { type: fluid.type, source: false, level: 0, falling: true }]);
                    continue; // When falling straight down, horizontal spread from this cell is deferred
                } else if (belowFluid.type !== fluid.type) {
                    // Vertical contact between Water and Lava
                    if (isWaterCell && belowFluid.type === IDS.LAVA) {
                        // Water above Lava -> Cobblestone or Stone
                        toSolidify.push([x, belowY, IDS.COBBLESTONE]);
                    } else if (isLavaCell && belowFluid.type === IDS.WATER) {
                        // Lava above Water -> Stone
                        toSolidify.push([x, belowY, IDS.STONE]);
                    }
                    continue;
                } else if (!belowFluid.falling && !belowFluid.source && !isSolidWorldBlock(x, belowY + 1, world[x]?.[belowY + 1])) {
                    toSet.push([x, belowY, { type: fluid.type, source: false, level: 0, falling: true }]);
                }
            }

            // 3. Horizontal Spread (Only when resting on a solid block or fluid beneath)
            if (isResting && fluid.level < maxFlow) {
                const nextLevel = fluid.source ? 1 : fluid.level + 1;
                for (const dir of [-1, 1]) {
                    const nx = x + dir;
                    if (nx < 0 || nx >= WORLD_WIDTH) continue;
                    if (isSolidWorldBlock(nx, y, world[nx]?.[y])) continue;

                    const nbrFluid = getFluid(nx, y);
                    const willDropBelow = (y + 1 < WORLD_HEIGHT && !isSolidWorldBlock(nx, y + 1, world[nx]?.[y + 1]));
                    if (!nbrFluid) {
                        toSet.push([nx, y, { type: fluid.type, source: false, level: nextLevel, falling: willDropBelow }]);
                    } else if (nbrFluid.type !== fluid.type) {
                        // Horizontal meeting of Water and Lava -> Cobblestone
                        toSolidify.push([nx, y, IDS.COBBLESTONE]);
                    } else if (!nbrFluid.source && nbrFluid.level > nextLevel) {
                        toSet.push([nx, y, { type: fluid.type, source: false, level: nextLevel, falling: willDropBelow }]);
                    }
                }
            }

            // 4. Classic 2-Source Infinite Water Spring
            if (isWaterCell && !fluid.source && isResting) {
                let adjacentSources = 0;
                const left = getFluid(x - 1, y);
                const right = getFluid(x + 1, y);
                if (left && left.type === IDS.WATER && left.source) adjacentSources++;
                if (right && right.type === IDS.WATER && right.source) adjacentSources++;
                if (adjacentSources >= 2) {
                    toSet.push([x, y, { type: IDS.WATER, source: true, level: 0, falling: false }]);
                }
            }
        }

        // Apply removals
        for (let i = 0; i < toRemove.length; i++) {
            const [rx, ry] = toRemove[i];
            removeFluid(rx, ry);
        }

        // Apply solidifications (Water + Lava reaction)
        for (let i = 0; i < toSolidify.length; i++) {
            const [sx, sy, blockId] = toSolidify[i];
            removeFluid(sx, sy);
            world[sx][sy] = blockId;
            syncBlock(sx, sy, blockId);
            triggerSteamEffect(sx, sy);
        }

        // Apply additions / updates
        for (let i = 0; i < toSet.length; i++) {
            const [sx, sy, fData] = toSet[i];
            setFluid(sx, sy, fData);
        }
    }

    export function isDoorBlock(block) {
        return [
            IDS.DOOR, IDS.DOOR_TOP, IDS.DOOR_OPEN, IDS.DOOR_OPEN_TOP,
            IDS.JUNGLE_DOOR, IDS.JUNGLE_DOOR_TOP, IDS.JUNGLE_DOOR_OPEN, IDS.JUNGLE_DOOR_OPEN_TOP
        ].includes(block);
    }

    export function isOpenDoorBlock(block) {
        return block === IDS.DOOR_OPEN || block === IDS.DOOR_OPEN_TOP ||
               block === IDS.JUNGLE_DOOR_OPEN || block === IDS.JUNGLE_DOOR_OPEN_TOP;
    }

    export function isJungleDoorBlock(block) {
        return block === IDS.JUNGLE_DOOR || block === IDS.JUNGLE_DOOR_TOP ||
               block === IDS.JUNGLE_DOOR_OPEN || block === IDS.JUNGLE_DOOR_OPEN_TOP;
    }

    export function getDoorBaseY(y, block) {
        return (block === IDS.DOOR_TOP || block === IDS.DOOR_OPEN_TOP ||
                block === IDS.JUNGLE_DOOR_TOP || block === IDS.JUNGLE_DOOR_OPEN_TOP) ? y + 1 : y;
    }

    export class Cloud {
        constructor() {
            this.x = Math.random() * WORLD_WIDTH * TILE_SIZE;
            this.y = Math.random() * 110 + 15;
            this.w = 140 + Math.random() * 220;
            this.h = 32 + Math.random() * 24;
            this.speed = 0.08 + Math.random() * 0.16;
            this.puffs = [
                { relX: 0.10, relY: -0.35, relW: 0.38, relH: 0.45 },
                { relX: 0.36, relY: -0.55, relW: 0.44, relH: 0.65 },
                { relX: 0.68, relY: -0.25, relW: 0.24, relH: 0.35 }
            ];
        }
        update() { 
            this.x += this.speed; 
            if (this.x > WORLD_WIDTH * TILE_SIZE) this.x = -this.w; 
        }
        draw(ctx, camX) {
            if (!showClouds) return;
            let drawX = this.x - (camX * 0.15); 
            if (drawX < -this.w) drawX += WORLD_WIDTH * TILE_SIZE;
            else if (drawX > canvas.width + this.w) drawX -= WORLD_WIDTH * TILE_SIZE;

            let isSunset = (timeOfDay >= 0.58 && timeOfDay < 0.68);
            let isSunrise = (timeOfDay >= 0.90 || timeOfDay < 0.04);
            let isNight = (timeOfDay >= 0.68 && timeOfDay < 0.90);

            let bodyColor = 'rgba(255, 255, 255, 0.82)';
            let shadeColor = 'rgba(210, 225, 242, 0.88)';
            let highlightColor = 'rgba(255, 255, 255, 0.95)';

            if (isSunset || isSunrise) {
                bodyColor = 'rgba(255, 212, 185, 0.82)';
                shadeColor = 'rgba(215, 125, 115, 0.88)';
                highlightColor = 'rgba(255, 240, 210, 0.95)';
            } else if (isNight) {
                bodyColor = 'rgba(42, 54, 82, 0.60)';
                shadeColor = 'rgba(26, 34, 56, 0.75)';
                highlightColor = 'rgba(105, 130, 175, 0.55)';
            }

            ctx.fillStyle = shadeColor;
            ctx.fillRect(Math.floor(drawX), Math.floor(this.y + this.h - 8), Math.floor(this.w), 8);
            this.puffs.forEach(p => {
                ctx.fillRect(Math.floor(drawX + p.relX * this.w), Math.floor(this.y + p.relY * this.h), Math.floor(p.relW * this.w), Math.floor(p.relH * this.h));
            });

            ctx.fillStyle = bodyColor;
            ctx.fillRect(Math.floor(drawX), Math.floor(this.y), Math.floor(this.w), Math.floor(this.h - 6));
            this.puffs.forEach(p => {
                ctx.fillRect(Math.floor(drawX + p.relX * this.w), Math.floor(this.y + p.relY * this.h), Math.floor(p.relW * this.w), Math.floor(p.relH * this.h - 4));
            });

            ctx.fillStyle = highlightColor;
            ctx.fillRect(Math.floor(drawX + 4), Math.floor(this.y), Math.floor(this.w - 8), 3);
            this.puffs.forEach(p => {
                ctx.fillRect(Math.floor(drawX + p.relX * this.w + 2), Math.floor(this.y + p.relY * this.h), Math.floor(p.relW * this.w - 4), 3);
            });
        }
    }
    for(let i=0; i<12; i++) clouds.push(new Cloud());

    export class PhysicsEntity {
        constructor(x, y, w, h) {
            this.x = x; this.y = y; this.width = w; this.height = h;
            this.vx = 0; this.vy = 0; this.isGrounded = false;
            this.fallStartY = y;
        }

        getActiveWorld() {
            return getActivePhysicsWorld(this);
        }

        getActiveTerrain() {
            return getActivePhysicsTerrain(this);
        }

        applyPhysics() {
            const wasGrounded = this.isGrounded;
            const prevVy = this.vy;
            if (this.isGrounded) {
                this.fallStartY = this.y;
            } else if (this.vy <= 0) {
                this.fallStartY = Math.min(this.fallStartY ?? this.y, this.y);
            }

            this.vy += GRAVITY;
            if (this.vy > TERMINAL_VELOCITY) this.vy = TERMINAL_VELOCITY;

            this.x += this.vx;
            this.handleCollisions(true);

            this.y += this.vy;
            this.isGrounded = false;
            this.handleCollisions(false);

            if (!wasGrounded && this.isGrounded && prevVy > 0 && !(this instanceof Player) && !(this instanceof Chicken) && this.health !== undefined) {
                const curGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
                const curGy = Math.floor((this.y + this.height - 2) / TILE_SIZE);
                if (!isWater(curGx, curGy, this) && this.fallStartY !== undefined) {
                    const fallTiles = (this.y - this.fallStartY) / TILE_SIZE;
                    if (fallTiles > 4) {
                        const fallDmg = Math.floor(fallTiles - 4);
                        if (fallDmg > 0 && typeof this.takeDamage === 'function') {
                            this.takeDamage(fallDmg, 0);
                        }
                    }
                }
                this.fallStartY = this.y;
            }

            if (this.health !== undefined && !(this instanceof Player)) checkCactusContact(this);
            
            const activeWorld = this.getActiveWorld();
            const maxWorldW = activeWorld ? activeWorld.length : ((typeof menuWorld !== 'undefined' && menuWorld && menuWorld.width) ? menuWorld.width : WORLD_WIDTH);
            if (this.x < 0) this.x = 0;
            if (this.x > maxWorldW * TILE_SIZE - this.width) this.x = maxWorldW * TILE_SIZE - this.width;
        }

        checkObstacleJump(dir) {
            if (!this.isGrounded || this.vx === 0) return;
            const activeWorld = this.getActiveWorld();
            if (!activeWorld) return;
            const curWorldW = activeWorld.length;
            const stepDir = dir !== undefined ? dir : (this.vx > 0 ? 1 : -1);
            const checkX = Math.floor((this.x + this.width / 2 + stepDir * (this.width / 2 + 5)) / TILE_SIZE);
            const footY = Math.floor((this.y + this.height - 5) / TILE_SIZE);
            const headY = Math.floor((this.y + 5) / TILE_SIZE);
            if (checkX >= 0 && checkX < curWorldW) {
                const b = activeWorld[checkX]?.[footY];
                const upperB = activeWorld[checkX]?.[headY - 1];
                if (b !== undefined && isSolidWorldBlock(checkX, footY, b) && !isSolidWorldBlock(checkX, headY - 1, upperB) && !isWater(checkX, headY - 1, this)) {
                    this.vy = JUMP_FORCE;
                    this.isGrounded = false;
                }
            }
        }

        applyMobDamage(amt, knockbackDir, particleColor = '#3b6a2c') {
            if (this.damageCooldown > 0) return false;
            this.health -= amt;
            this.damageCooldown = 15;
            this.vy = -3.5;
            this.vx = (knockbackDir || 0) * 5;
            for (let i = 0; i < 8; i++) {
                particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, particleColor));
            }
            floatingTexts.push(new FloatingText(this.x + this.width / 2, this.y - 10, amt, "#ffcc00"));
            return true;
        }

        handleCollisions(isAxisX) {
            const eps = 0.05; 
            const activeWorld = this.getActiveWorld();
            if (!activeWorld) return;
            const curWorldW = activeWorld.length;
            const curWorldH = activeWorld[0]?.length || 0;
            if (!curWorldW || !curWorldH) return;
            
            let leftTile = Math.floor((this.x + (isAxisX ? 0 : eps)) / TILE_SIZE);
            let rightTile = Math.floor((this.x + this.width - (isAxisX ? 0 : eps)) / TILE_SIZE);
            let topTile = Math.floor((this.y + (isAxisX ? eps : 0)) / TILE_SIZE);
            let bottomTile = Math.floor((this.y + this.height - (isAxisX ? eps : 0)) / TILE_SIZE);

            leftTile = Math.max(0, Math.min(leftTile, curWorldW - 1));
            rightTile = Math.max(0, Math.min(rightTile, curWorldW - 1));
            topTile = Math.max(0, Math.min(topTile, curWorldH - 1));
            bottomTile = Math.max(0, Math.min(bottomTile, curWorldH - 1));

            for (let y = topTile; y <= bottomTile; y++) {
                for (let x = leftTile; x <= rightTile; x++) {
                    let block = activeWorld[x][y];
                    if (isSolidWorldBlock(x, y, block)) {
                        let bMinX = x * TILE_SIZE;
                        let bMaxX = (x + 1) * TILE_SIZE;
                        let bMinY = y * TILE_SIZE;
                        let bMaxY = (y + 1) * TILE_SIZE;

                        // Closed door thin collision box (matches thin closed door texture: ~10px wide on left edge)
                        if (block === IDS.DOOR || block === IDS.DOOR_TOP) {
                            bMinX = x * TILE_SIZE + 2.5;
                            bMaxX = x * TILE_SIZE + 12.5;
                        }

                        let curLeft = this.x + (isAxisX ? 0 : eps);
                        let curRight = this.x + this.width - (isAxisX ? 0 : eps);
                        let curTop = this.y + (isAxisX ? eps : 0);
                        let curBottom = this.y + this.height - (isAxisX ? eps : 0);

                        let isStairRight = (block === IDS.WOODEN_STAIRS_RIGHT || block === IDS.COBBLESTONE_STAIRS_RIGHT);
                        let isStairLeft = (block === IDS.WOODEN_STAIRS_LEFT || block === IDS.COBBLESTONE_STAIRS_LEFT);

                        if (isStairRight || isStairLeft) {
                            let slabMinY = bMinY + TILE_SIZE / 2;
                            let hitSlab = (curRight > bMinX && curLeft < bMaxX && curBottom > slabMinY && curTop < bMaxY);
                            let stepMinX = isStairRight ? bMinX + TILE_SIZE / 2 : bMinX;
                            let stepMaxX = isStairRight ? bMaxX : bMinX + TILE_SIZE / 2;
                            let hitStep = (curRight > stepMinX && curLeft < stepMaxX && curBottom > bMinY && curTop < slabMinY);

                            if (hitSlab || hitStep) {
                                if (isAxisX) {
                                    if (this.vx > 0) this.x = (hitStep ? stepMinX : bMinX) - this.width - 0.1;
                                    else if (this.vx < 0) this.x = (hitStep ? stepMaxX : bMaxX) + 0.1;
                                    this.vx = 0;
                                } else {
                                    if (this.vy > 0 || this.vy === 0) {
                                        let floorY = (hitStep ? bMinY : slabMinY);
                                        this.y = floorY - this.height - 0.05;
                                        this.isGrounded = true;
                                    } else if (this.vy < 0) {
                                        this.y = bMaxY + 0.05;
                                    }
                                    this.vy = 0;
                                }
                            }
                            continue;
                        }

                        if (curRight > bMinX && curLeft < bMaxX && curBottom > bMinY && curTop < bMaxY) {
                            if (isAxisX) {
                                if (this.vx > 0) this.x = bMinX - this.width - 0.1;
                                else if (this.vx < 0) this.x = bMaxX + 0.1;
                                this.vx = 0;
                            } else {
                                if (this.vy > 0 || this.vy === 0) {
                                    this.y = bMinY - this.height - 0.05;
                                    this.isGrounded = true;
                                } else if (this.vy < 0) {
                                    this.y = bMaxY + 0.05;
                                }
                                this.vy = 0;
                            }
                        }
                    }
                }
            }
        }
    }

    export function checkCactusContact(entity) {
        const activeWorld = getActivePhysicsWorld(entity);
        if (!activeWorld) return;
        const curWorldW = activeWorld.length;
        const curWorldH = activeWorld[0]?.length || 0;
        const padding = 2;
        const leftTile = Math.max(0, Math.floor((entity.x - padding) / TILE_SIZE));
        const rightTile = Math.min(curWorldW - 1, Math.floor((entity.x + entity.width + padding) / TILE_SIZE));
        const topTile = Math.max(0, Math.floor((entity.y - padding) / TILE_SIZE));
        const bottomTile = Math.min(curWorldH - 1, Math.floor((entity.y + entity.height + padding) / TILE_SIZE));
        for (let tileY = topTile; tileY <= bottomTile; tileY++) {
            for (let tileX = leftTile; tileX <= rightTile; tileX++) {
                if (activeWorld[tileX]?.[tileY] === IDS.CACTUS && entity.damageCooldown <= 0) {
                    entity.takeDamage(1, 0);
                    return;
                }
            }
        }
    }

    export class ItemDrop extends PhysicsEntity {
        constructor(id, x, y, count, dropId) {
            super(x, y, 14, 14);
            this.itemId = id; this.count = count; this.dropId = dropId;
            this.vx = (Math.random() - 0.5) * 2; this.vy = -3;
            this.isGrounded = false;
        }

        update() {
            this.applyPhysics();
            if (this.isGrounded) this.vx *= 0.8;
        }

        draw(ctx, camX, camY) {
            let texture = textures[this.itemId];
            if (!texture) return;
            let drawX = this.x - camX; let drawY = this.y - camY;
            ctx.save();
            ctx.translate(drawX + this.width / 2, drawY + this.height / 2);
            ctx.rotate(Math.sin(frameCount * 0.08 + this.x) * 0.08);
            ctx.drawImage(texture, -10, -10, 20, 20);
            ctx.restore();
        }
    }

    export function getFootstepMaterial(p) {
        if (!p || !Array.isArray(world) || world.length === 0) return 'dirt';

        // Multi-point sampling across player width: left foot, center, right foot
        const xPositions = [
            p.x + 4,
            p.x + (p.width || 24) / 2,
            p.x + (p.width || 24) - 4
        ];
        
        const footGy = Math.floor(((p.y || 0) + (p.height || 48) - 2) / TILE_SIZE);
        const bodyGy = Math.floor(((p.y || 0) + (p.height || 48) / 2) / TILE_SIZE);
        const headGy = Math.floor(((p.y || 0) + 4) / TILE_SIZE);
        const belowGy = Math.floor(((p.y || 0) + (p.height || 48) + 2) / TILE_SIZE);

        // 1. Ladder / Vine priority
        for (let posX of xPositions) {
            const gx = Math.floor(posX / TILE_SIZE);
            if (isClimbableBlock(world[gx]?.[footGy]) || isClimbableBlock(world[gx]?.[bodyGy]) || isClimbableBlock(world[gx]?.[headGy])) {
                return 'ladder';
            }
        }

        // 2. Liquid (Water) priority
        for (let posX of xPositions) {
            const gx = Math.floor(posX / TILE_SIZE);
            if (typeof isWater === 'function' && (isWater(gx, footGy) || isWater(gx, bodyGy) || isWater(gx, belowGy))) {
                return 'water';
            }
        }

        // 3. Check blocks supporting the player (at feet level first, then directly below feet)
        const checkTiles = [];
        for (let posX of xPositions) {
            const gx = Math.floor(posX / TILE_SIZE);
            if (gx >= 0 && gx < WORLD_WIDTH && Array.isArray(world[gx])) {
                // Check cell containing feet (e.g. stairs, partial blocks, ground cover)
                if (footGy >= 0 && footGy < WORLD_HEIGHT) {
                    const blockAtFeet = world[gx][footGy];
                    if (blockAtFeet !== undefined && blockAtFeet !== IDS.AIR && blockAtFeet !== IDS.TORCH) {
                        checkTiles.push(blockAtFeet);
                    }
                }
                // Check floor block directly below feet
                if (belowGy >= 0 && belowGy < WORLD_HEIGHT) {
                    const blockBelow = world[gx][belowGy];
                    if (blockBelow !== undefined && blockBelow !== IDS.AIR && blockBelow !== IDS.TORCH) {
                        checkTiles.push(blockBelow);
                    }
                }
            }
        }

        // Evaluate candidate blocks from highest priority to lowest
        for (const block of checkTiles) {
            if (block === IDS.SNOW) return 'snow';
            if (block === IDS.SAND) return 'sand';
            if (block === IDS.GRASS || block === IDS.SHORT_GRASS || block === IDS.TALL_GRASS || block === IDS.FLOWER_RED || block === IDS.FLOWER_YELLOW || block === IDS.SAPLING) {
                return 'grass';
            }
            if (block === IDS.LEAVES) return 'leaves';
            if (block === IDS.WOOL) return 'wool';
            if (block === IDS.LADDER) return 'ladder';
            if (block === IDS.WOOD || block === IDS.PLANKS || block === IDS.CRAFTING_TABLE || 
                block === IDS.JUKEBOX ||
                block === IDS.WOODEN_STAIRS || block === IDS.WOODEN_STAIRS_LEFT || block === IDS.WOODEN_STAIRS_RIGHT ||
                block === IDS.DOOR || block === IDS.DOOR_TOP || block === IDS.DOOR_OPEN || block === IDS.DOOR_OPEN_TOP ||
                block === IDS.CHEST || block === IDS.BED) {
                return 'wood';
            }
            if (block === IDS.STONE || block === IDS.COBBLESTONE || block === IDS.COBBLESTONE_STAIRS ||
                block === IDS.COBBLESTONE_STAIRS_LEFT || block === IDS.COBBLESTONE_STAIRS_RIGHT ||
                block === IDS.COAL_ORE || block === IDS.IRON_ORE || block === IDS.GOLD_ORE ||
                block === IDS.DIAMOND_ORE || block === IDS.FURNACE) {
                return 'stone';
            }
            if (block === IDS.DIRT) return 'dirt';
            if (block === IDS.CACTUS) return 'wood';
        }

        return 'dirt';
    }


    // =============================================
    // SNOWBALL PROJECTILE SYSTEM
    // =============================================

    export class SnowballProjectile {
        constructor(x, y, vx, vy, ownerId, id) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.ownerId = ownerId;
            this.id = id;
            this.size = 10;
            this.alive = true;
            this.age = 0;
            this.maxAge = 180; // 3 seconds at 60fps
            this.trail = [];
        }

        update() {
            if (!this.alive) return;
            this.age++;
            if (this.age > this.maxAge) { this.alive = false; return; }

            // Store trail positions
            this.trail.push({ x: this.x, y: this.y, age: 0 });
            if (this.trail.length > 6) this.trail.shift();
            for (let t of this.trail) t.age++;

            // Apply gravity
            this.vy += 0.35;
            // Light air drag
            this.vx *= 0.994;
            this.vy *= 0.994;

            // Occasional sparkling particle trail
            if (this.age % 2 === 0) {
                const trailParticle = new Particle(this.x + (Math.random() - 0.5) * 4, this.y + (Math.random() - 0.5) * 4, '#e8f4fc');
                trailParticle.vx = -this.vx * 0.08 + (Math.random() - 0.5) * 0.8;
                trailParticle.vy = -this.vy * 0.08 + (Math.random() - 0.5) * 0.8;
                trailParticle.life = 10;
                particles.push(trailParticle);
            }

            const steps = Math.ceil(Math.max(Math.abs(this.vx), Math.abs(this.vy)) / (TILE_SIZE / 2)) + 1;
            const sx = this.vx / steps;
            const sy = this.vy / steps;

            for (let s = 0; s < steps; s++) {
                this.x += sx;
                this.y += sy;

                // World boundary
                if (this.x < 0 || this.x > WORLD_WIDTH * TILE_SIZE || this.y < 0 || this.y > WORLD_HEIGHT * TILE_SIZE) {
                    this.alive = false;
                    return;
                }

                // Block collision
                const gx = Math.floor(this.x / TILE_SIZE);
                const gy = Math.floor(this.y / TILE_SIZE);
                if (gx >= 0 && gx < WORLD_WIDTH && gy >= 0 && gy < WORLD_HEIGHT) {
                    const block = world[gx]?.[gy];
                    if (block !== undefined && block !== IDS.AIR && HARDNESS[block] !== undefined) {
                        this._impact();
                        return;
                    }
                }

                // Entity collision (only if local player or authority)
                if (!isMultiplayer || isMultiplayerAuthority()) {
                    for (let i = 0; i < entities.length; i++) {
                        const e = entities[i];
                        if (e.health <= 0) continue;
                        if (this.x >= e.x && this.x <= e.x + e.width && this.y >= e.y && this.y <= e.y + e.height) {
                            e.takeDamage(1, this.vx > 0 ? 1 : -1);
                            this._impact();
                            return;
                        }
                    }
                }

                // Player collision — only damage other players (not self)
                if (!isMultiplayer || isMultiplayerAuthority()) {
                    const isLocalOwner = (this.ownerId === (window.user?.uid || 'local'));
                    if (!isLocalOwner || this.age > 10) {
                        // Check local player if owner is remote
                        if (!isLocalOwner) {
                            if (this.x >= player.x && this.x <= player.x + player.width && this.y >= player.y && this.y <= player.y + player.height && !player.isDead) {
                                player.takeDamage(1);
                                this._impact();
                                return;
                            }
                        }
                        // Check remote players
                        Object.entries(remotePlayers).forEach(([rpId, rp]) => {
                            if (!this.alive || rp.isDead) return;
                            const rpX = rp.renderX ?? rp.x;
                            const rpY = rp.renderY ?? rp.y;
                            if (rpX == null) return;
                            const rpW = TILE_SIZE * 0.75;
                            const rpH = TILE_SIZE * 1.8;
                            if (this.x >= rpX && this.x <= rpX + rpW && this.y >= rpY && this.y <= rpY + rpH) {
                                // Trigger damage event for that peer via WebRTC
                                if (isMultiplayer) {
                                    const evtId = this.id + '_dmg_' + rpId;
                                    broadcastDataPacket({
                                        type: 'damage',
                                        targetUid: rpId,
                                        amount: 1,
                                        isPoison: false,
                                        id: evtId
                                    });
                                }
                                this._impact();
                            }
                        });
                        if (!this.alive) return;
                    }
                }
            }
        }

        _impact() {
            this.alive = false;
            // Spawn crisp snow particles
            for (let i = 0; i < 10; i++) {
                const p = new Particle(this.x, this.y, '#e8f4fc');
                p.vx = (Math.random() - 0.5) * 5;
                p.vy = -1 - Math.random() * 3;
                p.life = 12 + Math.floor(Math.random() * 8);
                particles.push(p);
            }
            for (let i = 0; i < 4; i++) {
                const p = new Particle(this.x, this.y, '#b0d4f1');
                p.vx = (Math.random() - 0.5) * 3;
                p.vy = -0.5 - Math.random() * 2;
                particles.push(p);
            }
        }

        draw(ctx, camX, camY) {
            if (!this.alive) return;
            // Draw motion trail
            for (let i = 0; i < this.trail.length; i++) {
                const t = this.trail[i];
                const tx = Math.round(t.x - camX);
                const ty = Math.round(t.y - camY);
                const ratio = (i + 1) / (this.trail.length + 1);
                const trailSize = Math.max(2, Math.round(5 * ratio));
                ctx.fillStyle = `rgba(230, 245, 255, ${0.15 + 0.35 * ratio})`;
                ctx.fillRect(tx - trailSize / 2, ty - trailSize / 2, trailSize, trailSize);
            }

            const sx = Math.round(this.x - camX);
            const sy = Math.round(this.y - camY);
            const r = 5; // 10x10 rounded pixel ball

            // Dark outline border (rounded corners)
            ctx.fillStyle = '#688ca8';
            ctx.fillRect(sx - r + 1, sy - r, 8, 10);
            ctx.fillRect(sx - r, sy - r + 1, 10, 8);

            // Shaded underside
            ctx.fillStyle = '#a6cbe8';
            ctx.fillRect(sx - r + 1, sy - r + 1, 8, 8);

            // Main snow body
            ctx.fillStyle = '#ebf4fc';
            ctx.fillRect(sx - r + 1, sy - r + 1, 7, 7);

            // Bright highlight
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(sx - r + 2, sy - r + 1, 4, 3);
            ctx.fillRect(sx - r + 1, sy - r + 2, 3, 4);

            // Tiny snow speckle detail
            ctx.fillStyle = '#c5e0f7';
            ctx.fillRect(sx + 1, sy + 1, 2, 2);
        }
    }

    // =============================================
    // FALLING BLOCKS / SAND PHYSICS SYSTEM
    // =============================================

    export class FallingBlock {
        constructor(gx, gy, blockId = IDS.SAND) {
            this.gx = gx;
            this.gy = gy;
            this.x = gx * TILE_SIZE;
            this.y = gy * TILE_SIZE;
            this.blockId = blockId;
            this.vy = 0;
            this.alive = true;
            this.age = 0;
            this.hitPlayer = false;
        }

        update() {
            if (!this.alive) return;
            this.age++;

            // Accelerate with gravity
            this.vy = Math.min(16, this.vy + 0.55);
            this.y += this.vy;

            // Damage player if falling sand hits their head
            if (this.vy > 1 && !this.hitPlayer && typeof player !== 'undefined' && player) {
                const px = player.x;
                const py = player.y;
                const pw = player.width;
                const ph = player.height;
                const hitX = (this.x < px + pw) && (this.x + TILE_SIZE > px);
                const hitY = (this.y + TILE_SIZE >= py) && (this.y <= py + ph * 0.75);
                if (hitX && hitY && !player.isDead) {
                    player.takeDamage(1);
                    this.hitPlayer = true;
                    if (Array.isArray(particles)) {
                        for (let i = 0; i < 4; i++) {
                            particles.push(new Particle(this.x + Math.random() * TILE_SIZE, this.y + TILE_SIZE, '#e6cc80'));
                        }
                    }
                }
            }

            const targetGy = Math.floor((this.y + TILE_SIZE) / TILE_SIZE);
            const currentTileX = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.round(this.x / TILE_SIZE)));

            // Bottom of world
            if (targetGy >= WORLD_HEIGHT - 1) {
                this._land(currentTileX, WORLD_HEIGHT - 1);
                return;
            }

            // Check block beneath
            const blockBelow = world[currentTileX]?.[targetGy];
            if (isSolidWorldBlock(currentTileX, targetGy, blockBelow)) {
                // Land on the cell above the solid block
                const landY = targetGy - 1;
                this._land(currentTileX, landY);
                return;
            }

            // Check if landed on a fragile non-solid item (like torches, flowers, tall grass, saplings)
            if (blockBelow !== undefined && blockBelow !== IDS.AIR && [IDS.TORCH, IDS.FLOWER_RED, IDS.FLOWER_YELLOW, IDS.SHORT_GRASS, IDS.TALL_GRASS, IDS.SAPLING].includes(blockBelow)) {
                if (blockBelow === IDS.TORCH) spawnDroppedItem(IDS.TORCH, currentTileX * TILE_SIZE + TILE_SIZE / 2, targetGy * TILE_SIZE + TILE_SIZE / 2, 1);
                else if (blockBelow === IDS.SAPLING) spawnDroppedItem(IDS.SAPLING, currentTileX * TILE_SIZE + TILE_SIZE / 2, targetGy * TILE_SIZE + TILE_SIZE / 2, 1);
                else if (blockBelow === IDS.FLOWER_RED || blockBelow === IDS.FLOWER_YELLOW) spawnDroppedItem(blockBelow, currentTileX * TILE_SIZE + TILE_SIZE / 2, targetGy * TILE_SIZE + TILE_SIZE / 2, 1);
                else if (blockBelow === IDS.SHORT_GRASS || blockBelow === IDS.TALL_GRASS) {
                    if (Math.random() < 0.2) spawnDroppedItem(IDS.SEEDS, currentTileX * TILE_SIZE + TILE_SIZE / 2, targetGy * TILE_SIZE + TILE_SIZE / 2, 1);
                }
                world[currentTileX][targetGy] = IDS.AIR;
                syncBlock(currentTileX, targetGy, IDS.AIR);
            }
        }

        _land(gx, gy) {
            this.alive = false;
            if (gy < 0 || gy >= WORLD_HEIGHT || gx < 0 || gx >= WORLD_WIDTH) return;

            // If target cell is air or non-solid, solidify as sand
            if (world[gx][gy] === IDS.AIR || !isSolidWorldBlock(gx, gy, world[gx][gy])) {
                removeFluid(gx, gy);
                world[gx][gy] = this.blockId;
                syncBlock(gx, gy, this.blockId);
                wakeFluidsAround(gx, gy);
                playSound('place');

                // Dust particles
                for (let i = 0; i < 6; i++) {
                    const p = new Particle(gx * TILE_SIZE + Math.random() * TILE_SIZE, (gy + 1) * TILE_SIZE - 2, '#e6cc80');
                    p.vx = (Math.random() - 0.5) * 3;
                    p.vy = -Math.random() * 2;
                    particles.push(p);
                }
            } else {
                // Otherwise drop as item
                spawnDroppedItem(this.blockId, gx * TILE_SIZE + TILE_SIZE / 2, gy * TILE_SIZE + TILE_SIZE / 2, 1);
            }

            // Check if any sand above needs to continue falling
            checkSandFallAbove(gx, gy);
        }

        draw(ctx, camX, camY) {
            if (!this.alive) return;
            const drawX = Math.floor(this.x - camX);
            const drawY = Math.floor(this.y - camY);
            if (drawX > canvas.width || drawX + TILE_SIZE < 0 || drawY > canvas.height || drawY + TILE_SIZE < 0) return;

            if (textures[this.blockId]) {
                ctx.drawImage(textures[this.blockId], drawX, drawY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#e6cc80';
                ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    export function triggerSandFall(x, y) {
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT - 1) return false;
        if (world[x]?.[y] !== IDS.SAND) return false;

        if (fallingBlocks.some(fb => fb.alive && fb.gx === x && Math.abs(fb.y - y * TILE_SIZE) < TILE_SIZE * 0.5)) return false;

        const belowBlock = world[x]?.[y + 1];
        if (!isSolidWorldBlock(x, y + 1, belowBlock)) {
            world[x][y] = IDS.AIR;
            syncBlock(x, y, IDS.AIR);
            wakeFluidsAround(x, y);
            fallingBlocks.push(new FallingBlock(x, y, IDS.SAND));

            if (y > 0 && world[x]?.[y - 1] === IDS.SAND) {
                triggerSandFall(x, y - 1);
            }
            return true;
        }
        return false;
    }

    export function checkSandFallAbove(x, y) {
        for (let checkY = y - 1; checkY >= 0; checkY--) {
            if (world[x]?.[checkY] === IDS.SAND) {
                triggerSandFall(x, checkY);
            } else {
                break;
            }
        }
    }

    export function isActionActive(action) {
        if (typeof window !== 'undefined' && typeof window.isActionActive === 'function' && window.isActionActive !== isActionActive) {
            return window.isActionActive(action);
        }
        if (typeof window !== 'undefined' && window.GamepadManager && typeof window.GamepadManager.isGamepadActionActive === 'function') {
            if (window.GamepadManager.isGamepadActionActive(action)) return true;
        }
        const activeKeys = (typeof window !== 'undefined' && window.keys) ? window.keys : keys;
        if (!activeKeys) return false;
        if (action === 'left') return !!(activeKeys['KeyA'] || activeKeys['ArrowLeft'] || activeKeys['a'] || activeKeys['A'] || activeKeys['arrowleft']);
        if (action === 'right') return !!(activeKeys['KeyD'] || activeKeys['ArrowRight'] || activeKeys['d'] || activeKeys['D'] || activeKeys['arrowright']);
        if (action === 'jump') return !!(activeKeys['KeyW'] || activeKeys['Space'] || activeKeys['ArrowUp'] || activeKeys['w'] || activeKeys['W'] || activeKeys[' '] || activeKeys['arrowup']);
        if (action === 'sneak' || action === 'down') return !!(activeKeys['ShiftLeft'] || activeKeys['ShiftRight'] || activeKeys['KeyS'] || activeKeys['ArrowDown'] || activeKeys['s'] || activeKeys['S'] || activeKeys['arrowdown']);
        return false;
    }

    export class Player extends PhysicsEntity {
        constructor(x, y) {
            super(x, y, TILE_SIZE * 0.75, TILE_SIZE * 1.8);
            this.maxHealth = 20; this.health = 20;
            this.hunger = 20; this.exhaustion = 0; this.eatTimer = 0;
            this.maxOxygen = 10; this.oxygen = this.maxOxygen;
            this.damageCooldown = 0; this.isDead = false; this.facingRight = true;
            this.walkAnimTime = 0;
            this.walkBlend = 0;
            this.fallStartY = y;
            this.poisonTimer = 0;
            this.airborneTicks = 0;
            this.leftShoulderParrot = null;
            this.rightShoulderParrot = null;
        }

        update() {
            if (this.isDead) return;
            if (isSleeping) return;
            if (this.damageCooldown > 0) this.damageCooldown--;

            // Handle Poison status effect
            if (this.poisonTimer > 0) {
                this.poisonTimer--;
                if (this.poisonTimer % 75 === 0 && this.health > 1 && !this.isDead) {
                    this.health -= 1;
                    this.damageCooldown = 12;
                    updateHealthUI();
                    playSound('hurt');
                    for (let i = 0; i < 3; i++) {
                        particles.push(new Particle(this.x + Math.random() * this.width, this.y + Math.random() * this.height, '#4ade80'));
                    }
                    floatingTexts.push(new FloatingText(this.x + this.width / 2, this.y - 10, "-1", "#4ade80"));
                }
                if (this.poisonTimer === 0) updateHealthUI();
            }

            let diff = DIFFICULTIES[currentDifficulty] || DIFFICULTIES.normal;
            const wasGrounded = this.isGrounded;
            const prevVy = this.vy;

            if (this.isGrounded) {
                this.fallStartY = this.y;
            } else if (this.vy <= 0) {
                this.fallStartY = Math.min(this.fallStartY ?? this.y, this.y);
            }

            const hungerRate = getDayHungerDrainMultiplier();
            let moveDir = 0;
            const gpMoveAxis = (typeof window !== 'undefined' && window.GamepadManager && typeof window.GamepadManager.getGamepadMoveAxis === 'function') ? window.GamepadManager.getGamepadMoveAxis() : 0;
            if (Math.abs(gpMoveAxis) > 0.01) {
                moveDir = Math.max(-1.0, Math.min(1.0, gpMoveAxis));
                if (moveDir < -0.05) this.facingRight = false;
                else if (moveDir > 0.05) this.facingRight = true;
            } else if (isActionActive('left')) { 
                moveDir = -1; this.facingRight = false; 
            } else if (isActionActive('right')) { 
                moveDir = 1; this.facingRight = true; 
            }

            if (moveDir !== 0) {
                let speedMult = 1.0;
                const boots = (typeof equippedArmor !== 'undefined' && Array.isArray(equippedArmor)) ? equippedArmor[3] : (this.equippedArmor ? this.equippedArmor[3] : null);
                if (boots && (boots.id === IDS.STRIDER_BOOTS || boots.id === IDS.ASTRAL_BOOTS)) {
                    speedMult = 1.25;
                }
                let targetVx = moveDir * MOVE_SPEED * speedMult;
                if (this.isGrounded) {
                    this.vx += (targetVx - this.vx) * 0.45;
                } else {
                    this.vx += (targetVx - this.vx) * 0.28;
                }
                this.exhaustion += 0.005 * hungerRate * Math.abs(moveDir);
            } else {
                if (this.isGrounded) {
                    this.vx *= 0.55;
                    if (Math.abs(this.vx) < 0.15) this.vx = 0;
                } else {
                    this.vx *= 0.88;
                    if (Math.abs(this.vx) < 0.1) this.vx = 0;
                }
            }

            if (isActionActive('jump') && this.isGrounded) {
                this.vy = JUMP_FORCE; this.isGrounded = false;
                this.exhaustion += 0.05 * hungerRate;
            }
            
            const pGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const pFootGy = Math.floor((this.y + this.height - 2) / TILE_SIZE);
            const pBodyGy = Math.floor((this.y + this.height / 2) / TILE_SIZE);
            const pHeadGy = Math.floor((this.y + 4) / TILE_SIZE);
            const onLadder = isClimbableBlock(world[pGx]?.[pFootGy]) || 
                             isClimbableBlock(world[pGx]?.[pBodyGy]) || 
                             isClimbableBlock(world[pGx]?.[pHeadGy]);

            const footFluid = getFluid(pGx, pFootGy);
            const bodyFluid = getFluid(pGx, pBodyGy);
            const headFluid = getFluid(pGx, pHeadGy);
            const inWater = (footFluid?.type === IDS.WATER) || (bodyFluid?.type === IDS.WATER) || (headFluid?.type === IDS.WATER);
            const inLava = (footFluid?.type === IDS.LAVA) || (bodyFluid?.type === IDS.LAVA) || (headFluid?.type === IDS.LAVA);

            if (inWater) {
                this.fallStartY = this.y;
                this.vx *= 0.82;
                if (this.vy > 2.2) this.vy = 2.2;
                this.vy -= GRAVITY * 0.72; // Counter gravity buoyancy
                if (isActionActive('jump')) {
                    this.vy = Math.max(-3.0, this.vy - 0.75);
                }
                if (advancedGraphics && Math.abs(this.vx) > 0.5 && frameCount % 6 === 0) {
                    particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, 'rgba(160, 230, 255, 0.7)'));
                }
            } else if (inLava) {
                this.fallStartY = this.y;
                this.vx *= 0.45;
                this.vy *= 0.55;
                if (this.vy > 1.2) this.vy = 1.2;
                this.vy -= GRAVITY * 0.5;
                if (isActionActive('jump')) {
                    this.vy = Math.max(-1.8, this.vy - 0.45);
                }
                if (frameCount % 20 === 0) {
                    this.takeDamage(3);
                    for (let i = 0; i < 3; i++) {
                        particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ff4500'));
                    }
                }
            }

            const fullySubmerged = headFluid?.type === IDS.WATER && bodyFluid?.type === IDS.WATER;
            const previousOxygen = this.oxygen;
            if (fullySubmerged) {
                if (frameCount % 25 === 0) this.oxygen = Math.max(0, this.oxygen - 1);
                if (this.oxygen <= 0 && frameCount % 15 === 0) this.takeDamage(2);
            } else {
                this.oxygen = Math.min(this.maxOxygen, this.oxygen + 0.18);
            }
            if (fullySubmerged || previousOxygen !== this.oxygen) updateOxygenUI(fullySubmerged);

            if (this.isGrounded) {
                this.airborneTicks = 0;
            } else {
                this.airborneTicks++;
            }

            const isWalking = moveDir !== 0 && (this.isGrounded || this.airborneTicks <= 4) && Math.abs(this.vx) > 0.15;
            if (isWalking) {
                this.walkAnimTime += (Math.abs(this.vx) / MOVE_SPEED) * 0.20;
                this.walkBlend = Math.min(1.0, (this.walkBlend || 0) + 0.18);
            } else if (!this.isGrounded && this.airborneTicks > 4) {
                this.walkAnimTime = Math.PI / 6;
                this.walkBlend = Math.max(0.0, (this.walkBlend || 0) - 0.10);
            } else {
                this.walkAnimTime = 0;
                this.walkBlend = Math.max(0.0, (this.walkBlend || 0) - 0.20);
                if (this.walkBlend <= 0.02) {
                    this.walkBlend = 0;
                    this.walkAnimTime = 0;
                } else {
                    this.walkAnimTime += 0.08;
                }
            }
            if (advancedGraphics && Math.abs(this.vx) > 0.5 && this.isGrounded && frameCount % 7 === 0) {
                let footDust = new Particle(this.x + this.width / 2, this.y + this.height - 2, '#b8a982');
                footDust.vx = -this.vx * 0.08 + (Math.random() - 0.5) * 1.5;
                footDust.vy = -1.2 - Math.random() * 1.2;
                footDust.life = 10 + Math.random() * 8;
                footDust.size = 2 + Math.random() * 2;
                particles.push(footDust);
            }

            // Footstep sounds engine trigger
            if (this.isGrounded && Math.abs(this.vx) > 0.5 && !onLadder && !inWater) {
                if (frameCount % 18 === 0) {
                    const mat = getFootstepMaterial(this);
                    playSound('step', { material: mat });
                }
            } else if (onLadder && (this.vy !== 0) && frameCount % 16 === 0) {
                playSound('step', { material: 'ladder' });
            } else if (inWater && (Math.abs(this.vx) > 0.5 || this.vy < -0.5) && frameCount % 22 === 0) {
                playSound('step', { material: 'water' });
            }

            if (currentDifficulty === 'peaceful') {
                this.exhaustion = 0;
                // On Peaceful, hunger naturally regenerates to max (20) if depleted
                if (this.hunger < 20 && frameCount % 20 === 0) {
                    this.hunger++;
                    updateHungerUI();
                }
                // On Peaceful, health always regenerates rapidly
                if (this.health < this.maxHealth && frameCount % diff.hpRegen === 0) {
                    this.health++;
                    updateHealthUI();
                }
            } else {
                if (diff.starve && frameCount % 120 === 0 && hungerRate > 1.0) {
                    this.exhaustion += 0.012 * (hungerRate - 1);
                }

                const exhaustionCap = (currentDifficulty === 'easy') ? 8.0 : 4.0;
                const maxExhaustion = Math.max(2.4, exhaustionCap / Math.max(0.1, hungerRate));
                if (this.exhaustion >= maxExhaustion) {
                    this.exhaustion = 0;
                    this.hunger = Math.max(0, this.hunger - 1);
                    updateHungerUI();
                    if(this.hunger === 0) document.getElementById('hunger-bar').classList.add('shake-ui');
                    else document.getElementById('hunger-bar').classList.remove('shake-ui');
                }

                if (this.hunger >= 18 && this.health < this.maxHealth && frameCount % diff.hpRegen === 0) {
                    this.health++; this.exhaustion += 2 * hungerRate; updateHealthUI(); 
                }
                if (this.hunger === 0 && diff.starve && frameCount % 60 === 0) {
                    this.takeDamage(1);
                }
            }

            // Head suffocation when inside solid blocks (e.g. sand lands on player's head)
            const headBlock = world[pGx]?.[pHeadGy];
            if (isSolidWorldBlock(pGx, pHeadGy, headBlock) && headBlock !== IDS.DOOR && headBlock !== IDS.LADDER) {
                if (frameCount % 30 === 0 && !this.isDead) {
                    this.takeDamage(1);
                    if (advancedGraphics && Math.random() < 0.5 && Array.isArray(particles)) {
                        particles.push(new Particle(this.x + this.width / 2 + (Math.random() - 0.5) * 8, this.y + 4, '#e6cc80'));
                    }
                }
            }

            if (mouse.isDownRight && !isInventoryOpen) {
                let sel = inventory[selectedHotbarIndex];
                if (sel && isFoodItem(sel.id) && this.hunger < 20) {
                    this.eatTimer++;
                    if (this.eatTimer > 20) {
                        let val = (sel.id === IDS.COOKED_PORKCHOP || sel.id === IDS.COOKED_MUTTON || sel.id === IDS.COOKED_BEEF) ? 8 : 
                                  (sel.id === IDS.COOKED_CHICKEN || sel.id === IDS.SUNBURST_MELON_SLICE ? 6 : 
                                  (sel.id === IDS.BREAD ? 5 : 
                                  (sel.id === IDS.APPLE || sel.id === IDS.VOID_BERRY ? 4 : 
                                  (sel.id === IDS.RAW_BEEF ? 3 : 2))));
                        this.hunger = Math.min(20, this.hunger + val);
                        if ((sel.id === IDS.MELON_SLICE || sel.id === IDS.SUNBURST_MELON_SLICE || sel.id === IDS.VOID_BERRY) && this.health < this.maxHealth) {
                            const healAmt = (sel.id === IDS.SUNBURST_MELON_SLICE || sel.id === IDS.VOID_BERRY) ? 2 : 1;
                            this.health = Math.min(this.maxHealth, this.health + healAmt);
                            updateHealthUI();
                        }
                        const eatenId = sel.id;
                        sel.count--;
                        if (sel.count <= 0) inventory[selectedHotbarIndex] = null;
                        updateHungerUI(); updateUI();
                        playSound('eat');
                        if (typeof window !== 'undefined' && typeof window.trackDailyQuestProgress === 'function') {
                            window.trackDailyQuestProgress('eat_food', { itemId: eatenId });
                        }
                        if (eatenId === IDS.VOID_BERRY) {
                            unlockAchievement('void_nourishment');
                        }
                        let pColor = (eatenId === IDS.VOID_BERRY) ? '#c084fc' : ((eatenId === IDS.SUNBURST_MELON_SLICE) ? '#f59e0b' : ((eatenId === IDS.MELON_SLICE) ? '#ef4444' : ((eatenId === IDS.COOKED_PORKCHOP || eatenId === IDS.COOKED_MUTTON || eatenId === IDS.COOKED_BEEF) ? '#8B4513' : (eatenId === IDS.RAW_BEEF ? '#991b1b' : (eatenId === IDS.COOKED_CHICKEN ? '#d98c53' : (eatenId === IDS.BREAD ? '#d2b48c' : (eatenId === IDS.APPLE ? '#ff3333' : '#ff99cc')))))));
                        for(let i=0; i<10; i++) particles.push(new Particle(this.x+this.width/2, this.y, pColor));
                    }
                } else { this.eatTimer = 0; }
            } else { this.eatTimer = 0; }

            if (onLadder) {
                this.isClimbing = true;
                this.fallStartY = this.y;
                if (isActionActive('jump')) {
                    this.vy = -3.1;
                    this.exhaustion += 0.008 * hungerRate;
                    this.walkAnimTime += 0.24;
                    unlockAchievement('ladder_climber');
                } else if (isActionActive('down')) {
                    this.vy = 2.8;
                    this.walkAnimTime += 0.24;
                    unlockAchievement('ladder_climber');
                } else {
                    this.vy = 0;
                }
            } else {
                this.isClimbing = false;
            }

            if (autoJumpEnabled && Math.abs(this.vx) > 0.5 && this.isGrounded && !onLadder) {
                let dir = this.vx > 0 ? 1 : -1;
                let frontX = Math.floor((this.x + (dir > 0 ? this.width + 3 : -3)) / TILE_SIZE);
                let currentX = Math.floor((this.x + this.width / 2) / TILE_SIZE);
                let footTileY = Math.floor((this.y + this.height - 4) / TILE_SIZE);
                let headTileY = Math.floor((this.y + 4) / TILE_SIZE);
                
                if (frontX >= 0 && frontX < WORLD_WIDTH && frontX !== currentX) {
                    let bObstacle = world[frontX]?.[footTileY];
                    let bAboveObstacle = world[frontX]?.[footTileY - 1];
                    let bHeadRoom = world[currentX]?.[headTileY - 1];

                    let isStairsObstacle = (bObstacle === IDS.WOODEN_STAIRS || bObstacle === IDS.WOODEN_STAIRS_LEFT || bObstacle === IDS.WOODEN_STAIRS_RIGHT ||
                                            bObstacle === IDS.COBBLESTONE_STAIRS || bObstacle === IDS.COBBLESTONE_STAIRS_LEFT || bObstacle === IDS.COBBLESTONE_STAIRS_RIGHT);

                    if (!isStairsObstacle && isSolidWorldBlock(frontX, footTileY, bObstacle) && 
                        !isSolidWorldBlock(frontX, footTileY - 1, bAboveObstacle) && 
                        !isSolidWorldBlock(currentX, headTileY - 1, bHeadRoom)) {
                        this.vy = JUMP_FORCE; 
                        this.isGrounded = false;
                    }
                }
            }

            // Auto step-up for stairs when walking
            if (Math.abs(this.vx) > 0.5 && this.isGrounded && !onLadder) {
                let dir = this.vx > 0 ? 1 : -1;
                let frontX = Math.floor((this.x + this.width / 2 + dir * (this.width / 2 + 1)) / TILE_SIZE);
                let currentX = Math.floor((this.x + this.width / 2) / TILE_SIZE);
                let footY = Math.floor((this.y + this.height - 2) / TILE_SIZE);
                if (frontX >= 0 && frontX < WORLD_WIDTH && frontX !== currentX) {
                    let bFoot = world[frontX]?.[footY];
                    let isStairs = (bFoot === IDS.WOODEN_STAIRS || bFoot === IDS.WOODEN_STAIRS_LEFT || bFoot === IDS.WOODEN_STAIRS_RIGHT ||
                                    bFoot === IDS.COBBLESTONE_STAIRS || bFoot === IDS.COBBLESTONE_STAIRS_LEFT || bFoot === IDS.COBBLESTONE_STAIRS_RIGHT);
                    if (isStairs && !isSolidWorldBlock(frontX, footY - 1, world[frontX]?.[footY - 1])) {
                        let stairTopY = footY * TILE_SIZE + TILE_SIZE / 2;
                        if (this.y + this.height > stairTopY && this.y + this.height <= footY * TILE_SIZE + TILE_SIZE) {
                            this.y = stairTopY - this.height;
                            this.isGrounded = true;
                        }
                    }
                }
            }

            this.applyPhysics();

            // Shoulder parrots dismount if player enters water or falls/jumps violently
            if (this.leftShoulderParrot || this.rightShoulderParrot) {
                const px = Math.floor((this.x + this.width / 2) / TILE_SIZE);
                const py = Math.floor((this.y + this.height - 2) / TILE_SIZE);
                const inWater = isWater(px, py) || isWater(px, py - 1);
                if (inWater || this.vy > 4.5 || this.vy < -5.5) {
                    dismountAllShoulderParrots();
                }
            }

            if (!wasGrounded && this.isGrounded && prevVy > 0) {
                const landingInWater = isWater(Math.floor((this.x + this.width / 2) / TILE_SIZE), Math.floor((this.y + this.height - 2) / TILE_SIZE)) || isWater(Math.floor((this.x + this.width / 2) / TILE_SIZE), Math.floor((this.y + this.height / 2) / TILE_SIZE));
                if (!landingInWater && this.fallStartY !== undefined) {
                    const fallDistanceTiles = (this.y - this.fallStartY) / TILE_SIZE;
                    if (fallDistanceTiles > 4) {
                        const fallDamage = Math.floor(fallDistanceTiles - 4);
                        if (fallDamage > 0) {
                            this.takeDamage(fallDamage);
                        }
                    }
                }
                this.fallStartY = this.y;
            }

            this.checkCactusContact();
            if (this.y > WORLD_HEIGHT * TILE_SIZE) this.takeDamage(999);
        }

        checkCactusContact() {
            const padding = 2;
            const leftTile = Math.max(0, Math.floor((this.x - padding) / TILE_SIZE));
            const rightTile = Math.min(WORLD_WIDTH - 1, Math.floor((this.x + this.width + padding) / TILE_SIZE));
            const topTile = Math.max(0, Math.floor((this.y - padding) / TILE_SIZE));
            const bottomTile = Math.min(WORLD_HEIGHT - 1, Math.floor((this.y + this.height + padding) / TILE_SIZE));
            for (let tileY = topTile; tileY <= bottomTile; tileY++) {
                for (let tileX = leftTile; tileX <= rightTile; tileX++) {
                    if (world[tileX][tileY] === IDS.CACTUS) {
                        this.takeDamage(1);
                        return;
                    }
                }
            }
        }

        resetEat() {
            this.eatTimer = 0; 
            if(document.getElementById('hotbar').children[selectedHotbarIndex])
                document.getElementById('hotbar').children[selectedHotbarIndex].classList.remove('eating-anim');
        }

        takeDamage(amt) {
            if (this.damageCooldown > 0 || this.isDead) return;
            let diff = DIFFICULTIES[currentDifficulty] || DIFFICULTIES.normal;

            if (this.leftShoulderParrot || this.rightShoulderParrot) {
                dismountAllShoulderParrots();
            }
            
            // Armor damage reduction calculation
            let reductionRatio = getArmorDamageReductionRatio();
            let reducedAmt = amt * (1 - reductionRatio);
            let finalAmt = Math.round(reducedAmt * diff.mobDmg);
            if (amt > 0 && finalAmt < 1) finalAmt = 1;

            // Damage equipped armor pieces
            if (amt > 0) {
                let brokeAnyArmor = false;
                for (let i = 0; i < 4; i++) {
                    if (equippedArmor[i] && equippedArmor[i].id) {
                        ensureArmorDurability(equippedArmor[i]);
                        equippedArmor[i].durability -= Math.max(1, Math.round(amt / 2));
                        if (equippedArmor[i].durability <= 0) {
                            equippedArmor[i] = null;
                            brokeAnyArmor = true;
                        }
                    }
                }
                if (brokeAnyArmor) {
                    playSound('break_tool');
                    showToast('Armor piece broke!');
                }
                updateArmorUI();
            }

            this.health -= finalAmt; this.damageCooldown = 30; this.vy = -4; 
            this.lastDamageEvent = { id: `${Date.now()}-${Math.random()}`, amount: finalAmt };
            updateHealthUI();
            playSound('hurt');
            if (typeof window !== 'undefined' && window.GamepadManager && typeof window.GamepadManager.triggerGamepadVibration === 'function') {
                window.GamepadManager.triggerGamepadVibration(160, 0.6, 0.85);
            }
            
            floatingTexts.push(new FloatingText(this.x + this.width/2, this.y - 10, "-" + finalAmt, "#ff3333"));

            if (typeof document !== 'undefined' && document.body) {
                let flash = document.createElement('div');
                flash.className = 'fixed inset-0 bg-red-600/30 pointer-events-none z-50 transition-opacity duration-300';
                document.body.appendChild(flash);
                setTimeout(() => { if (flash && flash.style) flash.style.opacity = '0'; setTimeout(() => { if (flash && typeof flash.remove === 'function') flash.remove(); }, 300); }, 50);
            }

            if (this.health <= 0) {
                this.health = 0; this.isDead = true; this.poisonTimer = 0;
                if (typeof toggleBackgroundBuildMode === 'function') toggleBackgroundBuildMode(false);
                if (!keepInventory || diff.permadeath) {
                    inventory.fill(null);
                    equippedArmor.fill(null);
                    updateArmorUI();
                }
                updateUI(); STATE = 'DEAD';
                if (isMultiplayer && window.user && currentMpRoom) {
                    syncLocalPlayerState(true);
                }
                if(diff.permadeath && !isMultiplayer) {
                    deleteWorld(currentWorldId, false);
                    const sub = document.getElementById('death-subtitle'); if (sub) sub.innerText = "Hardcore Mode: World Deleted!";
                    const rBtn = document.getElementById('respawn-btn'); if (rBtn) rBtn.classList.add('hidden');
                } else {
                    const sub = document.getElementById('death-subtitle'); if (sub) sub.innerText = "Game Over";
                    const rBtn = document.getElementById('respawn-btn'); if (rBtn) rBtn.classList.remove('hidden');
                }
                const dMenu = document.getElementById('death-menu'); if (dMenu) dMenu.classList.remove('hidden');
                const hud = document.getElementById('hud'); if (hud) hud.style.display = 'none';
            } else if (isMultiplayer && window.user && currentMpRoom) {
                syncLocalPlayerState(true);
            }
        }

        getToolPower(targetBlock) {
            let item = inventory[selectedHotbarIndex];
            if (item) ensureToolDurability(item);
            if (item && isTool(item.id) && item.durability <= 0) return 0;
            let id = item ? item.id : null;
            if (targetBlock === IDS.WOOD || targetBlock === IDS.PLANKS || targetBlock === IDS.LADDER || targetBlock === IDS.WOODEN_STAIRS || targetBlock === IDS.WOODEN_STAIRS_LEFT || targetBlock === IDS.WOODEN_STAIRS_RIGHT || targetBlock === IDS.JUNGLE_WOOD || targetBlock === IDS.JUNGLE_PLANKS || targetBlock === IDS.BAMBOO) {
                if (id === IDS.DIAMOND_AXE || id === IDS.DIAMOND_SWORD) return 18; if (id === IDS.GOLD_AXE || id === IDS.GOLD_SWORD) return 12; if (id === IDS.IRON_AXE || id === IDS.IRON_SWORD) return 9; if (id === IDS.STONE_AXE || id === IDS.STONE_SWORD) return 8; if (id === IDS.WOOD_AXE || id === IDS.WOOD_SWORD) return 5;
            } else if (targetBlock === IDS.DIRT || targetBlock === IDS.PLOWED_DIRT || targetBlock === IDS.GRASS || targetBlock === IDS.SAND || targetBlock === IDS.SNOW) {
                if (id === IDS.DIAMOND_SHOVEL) return 18; if (id === IDS.GOLD_SHOVEL) return 12; if (id === IDS.IRON_SHOVEL) return 9; if (id === IDS.STONE_SHOVEL) return 6; if (id === IDS.WOOD_SHOVEL) return 4;
            } else if (HARDNESS[targetBlock] >= 100) { 
                const requiredTier = getRequiredMiningTier(targetBlock);
                if (requiredTier > 0 && !canHarvestBlock(targetBlock)) return 0.1 * Math.pow(0.5, requiredTier - 1);
                if (id === IDS.DIAMOND_PICKAXE) return 18; if (id === IDS.GOLD_PICKAXE) return 12; if (id === IDS.IRON_PICKAXE) return 9; if (id === IDS.STONE_PICKAXE) return 6; if (id === IDS.WOOD_PICKAXE) return 3;
            }
            return id >= 100 ? 1.5 : 1;
        }
        
        getWeaponDamage() {
            let item = inventory[selectedHotbarIndex]; if (!item) return 1;
            const dmgMap = {
                [IDS.DIAMOND_SWORD]: 10, [IDS.IRON_SWORD]: 8, [IDS.GOLD_SWORD]: 8, [IDS.STONE_SWORD]: 6, [IDS.WOOD_SWORD]: 4,
                [IDS.DIAMOND_AXE]: 8, [IDS.IRON_AXE]: 7, [IDS.GOLD_AXE]: 6, [IDS.STONE_AXE]: 5, [IDS.WOOD_AXE]: 3,
                [IDS.DIAMOND_PICKAXE]: 4, [IDS.IRON_PICKAXE]: 3.5, [IDS.GOLD_PICKAXE]: 3, [IDS.STONE_PICKAXE]: 2.5, [IDS.WOOD_PICKAXE]: 2,
                [IDS.DIAMOND_SHOVEL]: 4.5, [IDS.IRON_SHOVEL]: 3.5, [IDS.GOLD_SHOVEL]: 3, [IDS.STONE_SHOVEL]: 2.5, [IDS.WOOD_SHOVEL]: 1.5,
                [IDS.DIAMOND_HOE]: 3, [IDS.IRON_HOE]: 2.5, [IDS.GOLD_HOE]: 2, [IDS.STONE_HOE]: 1.5, [IDS.WOOD_HOE]: 1
            };
            return dmgMap[item.id] || 1;
        }

        draw(ctx, camX, camY) {
            if (this.isDead) return;
            const drawX = Math.round(this.x - camX);
            const drawY = Math.round(this.y - camY);
            
            if (advancedGraphics) {
                ctx.drawImage(cachedShadowCanvas, drawX + this.width/2 - this.width/2.2, drawY + this.height - 6, this.width * (2/2.2), 8);
            }

            let isAttacking = attackAnimationTimer > 0;
            let activeItem = inventory[selectedHotbarIndex] ? inventory[selectedHotbarIndex].id : null;
            const isMoving = (this.walkBlend || 0) > 0.05 || Math.abs(this.vx) > 0.15;
            
            // Advanced segmented rendering with perched shoulder parrots!
            drawCharacter(
                ctx, skinCanvasObj, drawX, drawY, this.width, this.height, 
                this.facingRight, this.walkAnimTime, isMoving, this.damageCooldown > 0,
                isInventoryOpen ? null : mouse.worldX - camX, 
                isInventoryOpen ? null : mouse.worldY - camY, 
                isAttacking, activeItem, this.isClimbing, null,
                { left: this.leftShoulderParrot, right: this.rightShoulderParrot },
                this.walkBlend !== undefined ? this.walkBlend : 1.0
            );
        }
    }

    export function dismountParrot(p, shoulder) {
        if (!p) return;
        p.isMounted = false;
        p.mountedShoulder = null;
        if (player) {
            p.x = player.x + (shoulder === 'left' ? -12 : 12);
            p.y = player.y - 12;
        }
        p.state = 'flying';
        p.vy = -3.2;
        p.vx = (shoulder === 'left' ? -2.2 : 2.2);
        p.flightTimer = 200;
        playSound('parrot_chirp', { vol: 0.7 });
    }

    export function dismountAllShoulderParrots() {
        const curPlayer = (typeof window !== 'undefined' && window.player) ? window.player : player;
        if (!curPlayer) return;
        if (curPlayer.leftShoulderParrot) {
            dismountParrot(curPlayer.leftShoulderParrot, 'left');
            curPlayer.leftShoulderParrot = null;
        }
        if (curPlayer.rightShoulderParrot) {
            dismountParrot(curPlayer.rightShoulderParrot, 'right');
            curPlayer.rightShoulderParrot = null;
        }
    }

    export let player = new Player(WORLD_WIDTH * TILE_SIZE / 2, 0);
    try { window.player = player; } catch(e) {}


    export class Zombie extends PhysicsEntity {
        constructor(x, y) {
            super(x, y, TILE_SIZE * 0.75, TILE_SIZE * 1.8);
            this.health = 15;
            this.damageCooldown = 0;
            this.speed = MOVE_SPEED * 0.45;
            this.damage = 2;
            this.facingRight = true;
            this.walkAnimTime = 0;
            this.onFire = false;
        }

        update() {
            if (this.damageCooldown > 0) this.damageCooldown--;
            if (this.health <= 0) return;

            // Daytime Sunlight Burning: Zombies burn rapidly in daylight when exposed to open sky
            const isDaytime = (timeOfDay < 0.58 || timeOfDay > 0.90);
            if (isDaytime) {
                let headGx = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor((this.x + this.width / 2) / TILE_SIZE)));
                let headGy = Math.max(0, Math.floor((this.y + 4) / TILE_SIZE));
                let footGy = Math.max(0, Math.floor((this.y + this.height - 2) / TILE_SIZE));
                let inWater = (typeof isWater === 'function' && isWater(headGx, footGy));
                if (!inWater && typeof hasDirectSkyAccess === 'function' && hasDirectSkyAccess(headGx, headGy, true)) {
                    this.onFire = true;
                    if (frameCount % 4 === 0) {
                        particles.push(new Particle(this.x + Math.random() * this.width, this.y + Math.random() * this.height * 0.8, Math.random() < 0.6 ? '#ff6600' : '#ffaa00'));
                    }
                    if (frameCount % 15 === 0) {
                        this.takeDamage(2, 0);
                    }
                } else {
                    this.onFire = false;
                }
            } else {
                this.onFire = false;
            }

            let target = getZombieTarget(this);
            if (target) {
                let distToPlayer = target.x - this.x;
                if (Math.abs(distToPlayer) < TILE_SIZE * 16) { 
                    if (distToPlayer > TILE_SIZE / 2) { this.vx = this.speed; this.facingRight = true; }
                    else if (distToPlayer < -TILE_SIZE / 2) { this.vx = -this.speed; this.facingRight = false; }
                    else this.vx = 0;
                    this.checkObstacleJump();
                } else { this.vx = 0; }
            } else { this.vx = 0; }

            const prevX = this.x;
            this.applyPhysics();
            const actualMoved = Math.abs(this.x - prevX);

            if (actualMoved > 0.05 && this.isGrounded) {
                this.walkAnimTime += 0.18;
            } else {
                this.walkAnimTime = 0;
            }

            if (target && this.x < target.x + target.width && this.x + this.width > target.x &&
                this.y < target.y + target.height && this.y + this.height > target.y) {
                if (target.isRemote) damageRemotePlayer(target.id, this.damage);
                else player.takeDamage(this.damage);
            }
        }

        takeDamage(amt, knockbackDir) {
            this.applyMobDamage(amt, knockbackDir, '#3b6a2c');
        }

        draw(ctx, camX, camY) {
            if (this.health <= 0) return;
            const drawX = this.x - camX; const drawY = this.y - camY;
            const w = this.width; const h = this.height;

            if (advancedGraphics) {
                ctx.drawImage(cachedShadowCanvas, drawX + w / 2 - w / 2.2, drawY + h - 6, w * (2 / 2.2), 8);
            }

            ctx.save();
            ctx.translate(drawX, drawY);
            if (!this.facingRight) {
                ctx.translate(w, 0);
                ctx.scale(-1, 1);
            }

            if (this.damageCooldown > 0) {
                ctx.filter = 'sepia(1) saturate(8) hue-rotate(315deg) brightness(0.95)';
                if (Math.floor(frameCount / 4) % 2 === 0) ctx.globalAlpha = 0.75;
            }

            const sX = w / 16;
            const sY = h / 32;

            const legSwing = (this.walkAnimTime > 0) ? Math.sin(this.walkAnimTime) * (Math.PI / 4.5) : 0;
            const armBob = Math.sin(frameCount * 0.08) * 0.06;

            // Authentic Zombie Color Palette
            const skinBase = '#4d823b';
            const skinDark = '#345e26';
            const skinLight = '#629e4d';
            const skinRot = '#25441b';
            const hairDark = '#1b3013';

            const shirtBase = '#1f8294';
            const shirtDark = '#145c6b';
            const shirtLight = '#2cb1c9';

            const pantsBase = '#332e6b';
            const pantsDark = '#211d47';
            const pantsLight = '#46408f';
            const shoeDark = '#1a162e';

            // 1. Back Arm (Outstretched forward with subtle arm swing & sleeve)
            ctx.save();
            ctx.translate(6 * sX + 2 * sX, 8 * sY + 2 * sY);
            ctx.rotate(-Math.PI / 2 + armBob + 0.12);
            // Sleeve
            ctx.fillStyle = shirtDark;
            ctx.fillRect(-2 * sX, -2 * sY, 4 * sX, 5 * sY);
            // Rotting Arm & Hand
            ctx.fillStyle = skinDark;
            ctx.fillRect(-2 * sX, 3 * sY, 4 * sX, 9 * sY);
            ctx.fillStyle = skinRot;
            ctx.fillRect(-1 * sX, 6 * sY, 2 * sX, 3 * sY);
            // Fingers
            ctx.fillStyle = skinLight;
            ctx.fillRect(-2 * sX, 10 * sY, 4 * sX, 2 * sY);
            ctx.restore();

            // 2. Back Leg (Swinging backward)
            ctx.save();
            ctx.translate(6 * sX + 2 * sX, 20 * sY + 2 * sY);
            ctx.rotate(-legSwing);
            // Pants thigh & shin
            ctx.fillStyle = pantsDark;
            ctx.fillRect(-2 * sX, -2 * sY, 4 * sX, 9 * sY);
            ctx.fillStyle = pantsBase;
            ctx.fillRect(-1 * sX, -1 * sY, 2 * sX, 6 * sY);
            // Ragged tear on leg
            ctx.fillStyle = skinDark;
            ctx.fillRect(-2 * sX, 5 * sY, 2 * sX, 2 * sY);
            // Shoe
            ctx.fillStyle = shoeDark;
            ctx.fillRect(-2 * sX, 7 * sY, 4 * sX, 5 * sY);
            ctx.restore();

            // 3. Torso (8x12 cyan shirt with neck and tears)
            ctx.save();
            ctx.translate(4 * sX, 8 * sY);
            ctx.fillStyle = shirtBase;
            ctx.fillRect(0, 0, 8 * sX, 12 * sY);
            // Highlights & shadows
            ctx.fillStyle = shirtLight;
            ctx.fillRect(1 * sX, 1 * sY, 6 * sX, 2 * sY);
            ctx.fillStyle = shirtDark;
            ctx.fillRect(0, 8 * sX, 8 * sX, 4 * sY);
            ctx.fillRect(6 * sX, 2 * sY, 2 * sX, 8 * sY);
            // Decayed chest skin tear / V-neck
            ctx.fillStyle = skinBase;
            ctx.fillRect(3 * sX, 0, 2 * sX, 3 * sY);
            ctx.fillRect(2 * sX, 6 * sY, 2 * sX, 2 * sY);
            ctx.fillStyle = skinRot;
            ctx.fillRect(3 * sX, 1 * sY, 2 * sX, 1 * sY);
            ctx.restore();

            // 4. Head (8x8 rotting green zombie face & hair)
            ctx.save();
            ctx.translate(4 * sX, 0);
            // Base face
            ctx.fillStyle = skinBase;
            ctx.fillRect(0, 0, 8 * sX, 8 * sY);
            // Rotting texture patches
            ctx.fillStyle = skinLight;
            ctx.fillRect(1 * sX, 2 * sY, 2 * sX, 2 * sY);
            ctx.fillRect(5 * sX, 5 * sY, 2 * sX, 2 * sY);
            ctx.fillStyle = skinDark;
            ctx.fillRect(0, 4 * sY, 2 * sX, 3 * sY);
            ctx.fillRect(6 * sX, 1 * sY, 2 * sX, 3 * sY);
            // Messy dark hair
            ctx.fillStyle = hairDark;
            ctx.fillRect(0, 0, 8 * sX, 2 * sY);
            ctx.fillRect(0, 2 * sY, 2 * sX, 2 * sY);
            ctx.fillRect(7 * sX, 2 * sY, 1 * sX, 1 * sY);
            ctx.fillRect(3 * sX, 2 * sY, 2 * sX, 1 * sY);
            // Sunken dark eyes
            ctx.fillStyle = '#101c0c';
            ctx.fillRect(1 * sX, 3 * sY, 2 * sX, 2 * sY);
            ctx.fillRect(5 * sX, 3 * sY, 2 * sX, 2 * sY);
            // Eye gleam / pupil
            ctx.fillStyle = '#2d4d1f';
            ctx.fillRect(2 * sX, 3 * sY, 1 * sX, 1 * sY);
            ctx.fillRect(6 * sX, 3 * sY, 1 * sX, 1 * sY);
            // Decayed nose & mouth
            ctx.fillStyle = skinRot;
            ctx.fillRect(3 * sX, 4 * sY, 2 * sX, 2 * sY);
            ctx.fillRect(2 * sX, 6 * sY, 4 * sX, 1 * sY);
            ctx.fillStyle = '#101c0c';
            ctx.fillRect(3 * sX, 6 * sY, 2 * sX, 1 * sY);
            ctx.restore();

            // 5. Front Leg (Swinging forward)
            ctx.save();
            ctx.translate(6 * sX + 2 * sX, 20 * sY + 2 * sY);
            ctx.rotate(legSwing);
            // Pants
            ctx.fillStyle = pantsBase;
            ctx.fillRect(-2 * sX, -2 * sY, 4 * sX, 9 * sY);
            ctx.fillStyle = pantsLight;
            ctx.fillRect(-1 * sX, -1 * sY, 2 * sX, 5 * sY);
            ctx.fillStyle = pantsDark;
            ctx.fillRect(-2 * sX, 4 * sY, 4 * sX, 2 * sY);
            // Ragged tear
            ctx.fillStyle = skinBase;
            ctx.fillRect(0, 3 * sY, 2 * sX, 2 * sY);
            // Shoe
            ctx.fillStyle = shoeDark;
            ctx.fillRect(-2 * sX, 7 * sY, 4 * sX, 5 * sY);
            ctx.restore();

            // 6. Front Arm (Outstretched forward reaching toward player!)
            ctx.save();
            ctx.translate(6 * sX + 2 * sX, 8 * sY + 2 * sY);
            ctx.rotate(-Math.PI / 2 + armBob - 0.08);
            // Sleeve
            ctx.fillStyle = shirtBase;
            ctx.fillRect(-2 * sX, -2 * sY, 4 * sX, 5 * sY);
            ctx.fillStyle = shirtLight;
            ctx.fillRect(-1 * sX, -2 * sY, 2 * sX, 1 * sY);
            ctx.fillStyle = shirtDark;
            ctx.fillRect(-2 * sX, 3 * sY, 4 * sX, 1 * sY);
            // Rotting Forearm & Hand
            ctx.fillStyle = skinBase;
            ctx.fillRect(-2 * sX, 4 * sY, 4 * sX, 8 * sY);
            ctx.fillStyle = skinLight;
            ctx.fillRect(-1 * sX, 4 * sY, 2 * sX, 5 * sY);
            ctx.fillStyle = skinRot;
            ctx.fillRect(-2 * sX, 7 * sY, 2 * sX, 2 * sY);
            // Reaching Fingers
            ctx.fillStyle = skinLight;
            ctx.fillRect(-2 * sX, 10 * sY, 4 * sX, 2 * sY);
            ctx.fillStyle = skinDark;
            ctx.fillRect(0, 11 * sY, 2 * sX, 1 * sY);
            ctx.restore();

            ctx.restore();
        }
    }

    export class Animal extends PhysicsEntity {
        constructor(x, y, w, h, health, baseSpeed) {
            super(x, y, w, h);
            this.health = health;
            this.damageCooldown = 0;
            this.baseSpeed = baseSpeed;
            this.speed = baseSpeed;
            this.timer = 0;
            this.dir = 1;
            this.panic = false;
            this.panicTimer = 0;
            this.isTempted = false;
            this.walkAnimTime = 0;
            this.idleSeed = Math.random() * 1000;
        }

        isTemptedBy(itemId) {
            return itemId === IDS.SEEDS;
        }

        hasHazardAhead(dir) {
            if (dir === 0) return false;
            const activeWorld = this.getActiveWorld();
            if (!activeWorld) return false;
            const checkX = Math.floor((this.x + this.width / 2 + dir * (this.width / 2 + 10)) / TILE_SIZE);
            const footY = Math.floor((this.y + this.height - 4) / TILE_SIZE);
            const bodyY = Math.floor((this.y + 4) / TILE_SIZE);
            const drop1Y = footY + 1;
            const drop2Y = footY + 2;

            if (isWater(checkX, footY, this) || isWater(checkX, bodyY, this) || isWater(checkX, footY - 1, this)) return true;
            if (activeWorld[checkX]?.[footY] === IDS.CACTUS || activeWorld[checkX]?.[bodyY] === IDS.CACTUS) return true;
            if (getFluid(checkX, footY)?.type === IDS.LAVA || getFluid(checkX, bodyY)?.type === IDS.LAVA) return true;

            const blockAtStep = activeWorld[checkX]?.[footY];
            const isStepSolid = isSolidWorldBlock(checkX, footY, blockAtStep);
            if (!isStepSolid) {
                if (isWater(checkX, drop1Y, this) || isWater(checkX, drop2Y, this)) return true;
                if (getFluid(checkX, drop1Y)?.type === IDS.LAVA || getFluid(checkX, drop2Y)?.type === IDS.LAVA) return true;
            }
            return false;
        }

        hasLethalDropAhead(dir) {
            if (dir === 0) return false;
            const activeWorld = this.getActiveWorld();
            if (!activeWorld) return false;
            const curH = activeWorld[0]?.length || WORLD_HEIGHT;
            const checkX = Math.floor((this.x + this.width / 2 + dir * (this.width / 2 + 8)) / TILE_SIZE);
            const footY = Math.floor((this.y + this.height - 2) / TILE_SIZE);
            
            if (isSolidWorldBlock(checkX, footY, activeWorld[checkX]?.[footY])) return false;
            
            let dropDist = 0;
            for (let dy = 1; dy <= 5; dy++) {
                const testY = footY + dy;
                if (testY >= curH) break;
                if (isSolidWorldBlock(checkX, testY, activeWorld[checkX]?.[testY])) break;
                if (isWater(checkX, testY, this)) return false;
                dropDist++;
            }
            return dropDist >= 3;
        }

        updateAnimalAI() {
            if (this.damageCooldown > 0) this.damageCooldown--;
            this.timer--;
            if (this.panicTimer > 0) this.panicTimer--;
            else this.panic = false;

            const activeWorld = this.getActiveWorld();
            const curWorldW = activeWorld ? activeWorld.length : WORLD_WIDTH;

            const curX = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const curFootY = Math.floor((this.y + this.height - 2) / TILE_SIZE);
            const curBodyY = Math.floor((this.y + this.height / 2) / TILE_SIZE);
            const currentlyInWater = isWater(curX, curFootY, this) || isWater(curX, curBodyY, this);

            if (currentlyInWater) {
                this.vy = Math.min(this.vy, -2.4);
                this.fallStartY = this.y;

                let leftLand = -1;
                let rightLand = -1;
                for (let d = 1; d <= 14; d++) {
                    if (leftLand < 0 && curX - d >= 0) {
                        const b = activeWorld?.[curX - d]?.[curFootY];
                        if (isSolidWorldBlock(curX - d, curFootY, b) && !isWater(curX - d, curFootY - 1)) leftLand = d;
                        else if (!isWater(curX - d, curFootY) && !isWater(curX - d, curFootY - 1)) leftLand = d;
                    }
                    if (rightLand < 0 && curX + d < curWorldW) {
                        const b = activeWorld?.[curX + d]?.[curFootY];
                        if (isSolidWorldBlock(curX + d, curFootY, b) && !isWater(curX + d, curFootY - 1)) rightLand = d;
                        else if (!isWater(curX + d, curFootY) && !isWater(curX + d, curFootY - 1)) rightLand = d;
                    }
                }

                if (leftLand > 0 && (rightLand < 0 || leftLand <= rightLand)) {
                    this.dir = -1;
                } else if (rightLand > 0) {
                    this.dir = 1;
                } else if (this.dir === 0) {
                    this.dir = 1;
                }
                this.speed = this.baseSpeed * 1.3;
                this.vx = this.dir * this.speed;
            } 
            else if (this.panic) {
                this.speed = this.baseSpeed * 2.2;
                if (this.hasHazardAhead(this.dir)) this.dir = -this.dir;
                this.vx = this.dir * this.speed;
            }
            else {
                let tempted = false;
                if (player && !player.isDead) {
                    const held = inventory[selectedHotbarIndex];
                    if (held && this.isTemptedBy(held.id)) {
                        const dist = Math.hypot(player.x + player.width / 2 - (this.x + this.width / 2), player.y + player.height / 2 - (this.y + this.height / 2));
                        if (dist < 340) {
                            tempted = true;
                            const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
                            this.dir = dx > 0 ? 1 : -1;
                            
                            if (dist > 65) {
                                this.speed = this.baseSpeed * 1.15;
                                this.vx = this.dir * this.speed;
                            } else {
                                this.vx = 0;
                            }

                            if (frameCount % 60 === 0 && Math.random() < 0.35) {
                                particles.push(new Particle(this.x + this.width / 2, this.y - 4, '#ff66aa'));
                            }
                        }
                    }
                }
                this.isTempted = tempted;

                if (!tempted) {
                    if (this.timer <= 0) {
                        let roll = Math.random();
                        if (roll < 0.40) {
                            this.dir = 0;
                            this.timer = Math.random() * 80 + 40;
                        } else {
                            let herdDir = 0;
                            let sameSpecies = entities.filter(e => e !== this && e.constructor === this.constructor && Math.hypot(e.x - this.x, e.y - this.y) < 400);
                            if (sameSpecies.length > 0 && Math.random() < 0.4) {
                                let avgX = sameSpecies.reduce((acc, e) => acc + e.x, 0) / sameSpecies.length;
                                herdDir = avgX > this.x ? 1 : -1;
                            }
                            this.dir = herdDir !== 0 ? herdDir : (Math.random() > 0.5 ? 1 : -1);
                            this.timer = Math.random() * 140 + 70;
                            this.speed = this.baseSpeed;
                        }
                    }

                    if (this.dir !== 0) {
                        if (this.hasHazardAhead(this.dir) || this.hasLethalDropAhead(this.dir)) {
                            if (!this.hasHazardAhead(-this.dir) && !this.hasLethalDropAhead(-this.dir)) {
                                this.dir = -this.dir;
                                this.timer = Math.random() * 100 + 50;
                            } else {
                                this.dir = 0;
                                this.timer = 50;
                            }
                        }
                    }

                    this.vx = this.dir * this.speed;
                }
            }

            if (this.vx !== 0 && (this.isGrounded || currentlyInWater)) {
                const moveDir = this.vx > 0 ? 1 : -1;
                const checkX = Math.floor((this.x + this.width / 2 + moveDir * (this.width / 2 + 5)) / TILE_SIZE);
                const footY = Math.floor((this.y + this.height - 5) / TILE_SIZE);
                const headY = Math.floor((this.y + 5) / TILE_SIZE);
                if (checkX >= 0 && checkX < curWorldW) {
                    const b = activeWorld?.[checkX]?.[footY];
                    const upperB = activeWorld?.[checkX]?.[headY - 1];
                    if (isSolidWorldBlock(checkX, footY, b) && !isSolidWorldBlock(checkX, headY - 1, upperB) && !isWater(checkX, headY - 1)) {
                        this.vy = JUMP_FORCE * 0.85;
                        this.isGrounded = false;
                    }
                }
            }

            const prevX = this.x;
            this.applyPhysics();
            const actualMoved = Math.abs(this.x - prevX);

            if (actualMoved > 0.05 && (this.isGrounded || currentlyInWater)) {
                this.walkAnimTime = (this.walkAnimTime || 0) + (actualMoved / (this.baseSpeed || 1)) * 0.22;
            } else {
                this.walkAnimTime = 0;
            }
        }
    }

    export class Pig extends Animal {
        constructor(x, y) {
            super(x, y, TILE_SIZE * 0.85, TILE_SIZE * 0.65, 10, MOVE_SPEED * 0.3);
        }

        isTemptedBy(itemId) {
            return itemId === IDS.WHEAT || itemId === IDS.APPLE;
        }

        update() {
            this.updateAnimalAI();
        }

        takeDamage(amt, knockbackDir) {
            if (this.damageCooldown > 0) return;
            this.health -= amt;
            this.damageCooldown = 15;
            this.vy = -4;
            this.vx = knockbackDir * 6;
            this.panic = true;
            this.panicTimer = 180;
            this.dir = knockbackDir || (Math.random() > 0.5 ? 1 : -1);
            for (let i = 0; i < 6; i++) particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ffafcc'));
            for (let i = 0; i < 3; i++) particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#f43f5e'));
            floatingTexts.push(new FloatingText(this.x + this.width / 2, this.y - 10, amt, "#ffcc00"));
        }

        draw(ctx, camX, camY) {
            const drawX = this.x - camX;
            const drawY = this.y - camY;
            const w = this.width;
            const h = this.height;

            if (advancedGraphics) {
                ctx.drawImage(cachedShadowCanvas, drawX + w / 2 - w / 2.2, drawY + h - 6, w * (2 / 2.2), 8);
            }

            ctx.save();
            ctx.translate(drawX + w / 2, drawY + h / 2);
            if (this.dir < 0) ctx.scale(-1, 1);

            const isMoving = Math.abs(this.vx) > 0.05;
            const walk = this.walkAnimTime || 0;
            const idle = Math.sin((frameCount + this.idleSeed) * 0.07);
            const bodyBob = isMoving ? Math.abs(Math.sin(walk * 2)) * 1.2 : idle * 0.6;
            const isBlinking = ((frameCount + Math.floor(this.idleSeed)) % 200 < 8);

            const isDamaged = this.damageCooldown > 0;
            const bodyBase = isDamaged ? '#ff4d4d' : '#f472b6';
            const bodyHigh = isDamaged ? '#ff9999' : '#fbcfe8';
            const bodyShade = isDamaged ? '#b91c1c' : '#db2777';
            const hoofColor = isDamaged ? '#450a0a' : '#500724';
            const nearHoof = isDamaged ? '#7f1d1d' : '#831843';
            const snoutBase = isDamaged ? '#ff8080' : '#fb7185';
            const snoutHigh = isDamaged ? '#ffcccc' : '#fda4af';
            const nostril = isDamaged ? '#990000' : '#881337';
            const blush = isDamaged ? '#b91c1c' : '#f43f5e';

            const farLegSwing = isMoving ? Math.sin(walk) * 3 : 0;
            const nearLegSwing = isMoving ? -Math.sin(walk) * 3 : 0;
            const farLegLift = (isMoving && Math.sin(walk) > 0) ? Math.sin(walk) * 1.5 : 0;
            const nearLegLift = (isMoving && -Math.sin(walk) > 0) ? -Math.sin(walk) * 1.5 : 0;

            // 1. Far Legs (Back and Front)
            ctx.fillStyle = bodyShade;
            ctx.fillRect(-w * 0.44 + farLegSwing, h * 0.15 - farLegLift, w * 0.17, h * 0.35);
            ctx.fillRect(w * 0.05 - farLegSwing, h * 0.15 - nearLegLift, w * 0.17, h * 0.35);
            // Far Hooves
            ctx.fillStyle = hoofColor;
            ctx.fillRect(-w * 0.44 + farLegSwing, h * 0.5 - 2 - farLegLift, w * 0.17, 3);
            ctx.fillRect(w * 0.05 - farLegSwing, h * 0.5 - 2 - nearLegLift, w * 0.17, 3);

            // 2. Curly Tail (Back)
            const tailWiggle = Math.sin(frameCount * (this.panic ? 0.6 : 0.25)) * 1.5;
            ctx.fillStyle = snoutBase;
            ctx.fillRect(-w * 0.5 - 3, -h * 0.18 + bodyBob + tailWiggle, 3, 2);
            ctx.fillRect(-w * 0.5 - 4, -h * 0.18 + bodyBob + tailWiggle - 3, 2, 3);
            ctx.fillRect(-w * 0.5 - 2, -h * 0.18 + bodyBob + tailWiggle - 4, 3, 2);

            // 3. Torso / Body
            ctx.fillStyle = bodyBase;
            ctx.fillRect(-w * 0.5, -h * 0.48 + bodyBob, w * 0.68, h * 0.68);
            // Body Top Highlight
            ctx.fillStyle = bodyHigh;
            ctx.fillRect(-w * 0.48, -h * 0.48 + bodyBob, w * 0.64, 3);
            // Body Belly Shadow
            ctx.fillStyle = bodyShade;
            ctx.fillRect(-w * 0.5, h * 0.12 + bodyBob, w * 0.68, 3);

            // 4. Head & Neck
            const headBob = bodyBob * 0.8;
            ctx.fillStyle = bodyBase;
            ctx.fillRect(w * 0.08, -h * 0.54 + headBob, w * 0.38, h * 0.64);
            ctx.fillStyle = bodyHigh;
            ctx.fillRect(w * 0.1, -h * 0.54 + headBob, w * 0.34, 3);
            ctx.fillStyle = bodyShade;
            ctx.fillRect(w * 0.08, h * 0.04 + headBob, w * 0.38, 2);

            // Cute Floppy Ear
            const earTwitch = Math.sin(frameCount * 0.12) * 0.8;
            ctx.fillStyle = snoutBase;
            ctx.fillRect(w * 0.16, -h * 0.54 - 4 + headBob + earTwitch, 4, 5);
            ctx.fillStyle = isDamaged ? '#7f1d1d' : '#be123c';
            ctx.fillRect(w * 0.18, -h * 0.54 - 3 + headBob + earTwitch, 2, 3);

            // Rosy Cheek Blush
            ctx.fillStyle = blush;
            ctx.fillRect(w * 0.22, -h * 0.12 + headBob, 4, 3);

            // Cute Eye
            if (isBlinking) {
                ctx.fillStyle = nearHoof;
                ctx.fillRect(w * 0.24, -h * 0.28 + headBob, 4, 1.5);
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(w * 0.23, -h * 0.34 + headBob, 5, 4.5);
                ctx.fillStyle = '#1e1b4b';
                ctx.fillRect(w * 0.27, -h * 0.34 + headBob, 2.5, 4.5);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(w * 0.24, -h * 0.34 + headBob, 1.5, 1.5);
            }

            // 3D Snout
            ctx.fillStyle = snoutBase;
            ctx.fillRect(w * 0.38, -h * 0.26 + headBob, w * 0.18, h * 0.36);
            ctx.fillStyle = snoutHigh;
            ctx.fillRect(w * 0.38, -h * 0.26 + headBob, w * 0.18, 2);
            // Nostrils
            ctx.fillStyle = nostril;
            ctx.fillRect(w * 0.52, -h * 0.18 + headBob, 2, 2.5);
            ctx.fillRect(w * 0.52, -h * 0.04 + headBob, 2, 2.5);

            // 5. Near Legs (Back and Front)
            ctx.fillStyle = bodyBase;
            ctx.fillRect(-w * 0.30 + nearLegSwing, h * 0.18 - nearLegLift, w * 0.17, h * 0.32);
            ctx.fillRect(w * 0.20 + farLegSwing, h * 0.18 - farLegLift, w * 0.17, h * 0.32);
            // Near Hooves
            ctx.fillStyle = nearHoof;
            ctx.fillRect(-w * 0.30 + nearLegSwing, h * 0.5 - 2 - nearLegLift, w * 0.17, 3);
            ctx.fillRect(w * 0.20 + farLegSwing, h * 0.5 - 2 - farLegLift, w * 0.17, 3);

            ctx.restore();
        }
    }

    export class Chicken extends Animal {
        constructor(x, y) {
            super(x, y, TILE_SIZE * 0.5, TILE_SIZE * 0.6, 4, MOVE_SPEED * 0.25);
            this.peckTimer = 0;
        }

        isTemptedBy(itemId) {
            return itemId === IDS.SEEDS || itemId === IDS.WHEAT || itemId === IDS.SAPLING;
        }

        update() {
            this.updateAnimalAI();
            if (this.vy > 2.2) this.vy = 2.2;
            if (this.vx === 0 && Math.random() < 0.012 && this.peckTimer <= 0) {
                this.peckTimer = 22;
            }
            if (this.peckTimer > 0) this.peckTimer--;
        }

        takeDamage(amt, knockbackDir) {
            if (this.damageCooldown > 0) return;
            this.health -= amt;
            this.damageCooldown = 15;
            this.vy = -4;
            this.vx = knockbackDir * 6;
            this.panic = true;
            this.panicTimer = 180;
            this.dir = knockbackDir || (Math.random() > 0.5 ? 1 : -1);
            for (let i = 0; i < 6; i++) particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ffffff'));
            for (let i = 0; i < 3; i++) particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ef4444'));
            floatingTexts.push(new FloatingText(this.x + this.width / 2, this.y - 10, amt, "#ffcc00"));
        }

        draw(ctx, camX, camY) {
            const drawX = this.x - camX;
            const drawY = this.y - camY;
            const w = this.width;
            const h = this.height;

            if (advancedGraphics) {
                ctx.drawImage(cachedShadowCanvas, drawX + w / 2 - w / 2.2, drawY + h - 5, w * (2 / 2.2), 7);
            }

            ctx.save();
            ctx.translate(drawX + w / 2, drawY + h / 2);
            if (this.dir < 0) ctx.scale(-1, 1);

            const isMoving = Math.abs(this.vx) > 0.05;
            const isAirborne = !this.isGrounded || this.vy > 0.5;
            const walk = this.walkAnimTime || 0;
            const idle = Math.sin((frameCount + this.idleSeed) * 0.08);
            const isBlinking = ((frameCount + Math.floor(this.idleSeed)) % 190 < 8);

            const isDamaged = this.damageCooldown > 0;
            const featherWhite = isDamaged ? '#ff7f7f' : '#ffffff';
            const featherShade = isDamaged ? '#ff4d4d' : '#cbd5e1';
            const featherDark = isDamaged ? '#cc0000' : '#94a3b8';
            const combRed = isDamaged ? '#b91c1c' : '#ef4444';
            const combLight = isDamaged ? '#f87171' : '#fca5a5';
            const wattleRed = isDamaged ? '#991b1b' : '#dc2626';
            const beakAmber = isDamaged ? '#d97706' : '#f59e0b';
            const beakLight = isDamaged ? '#fde047' : '#fbbf24';
            const legYellow = isDamaged ? '#ca8a04' : '#f59e0b';
            const clawDark = isDamaged ? '#854d0e' : '#d97706';

            // Head Bobbing & Pecking Animation
            const headBobX = isMoving ? Math.sin(walk) * 2 : 0;
            const peckBobY = (this.peckTimer > 0) ? Math.sin(this.peckTimer / 22 * Math.PI) * 3.5 : 0;
            const headBobY = (isMoving ? Math.abs(Math.sin(walk)) * 1 : idle * 0.4) + peckBobY;

            // Wing Flapping Animation
            let wingAngle = 0;
            if (isAirborne) {
                wingAngle = Math.sin(frameCount * 0.8) * 0.5;
            } else if (this.panic) {
                wingAngle = Math.sin(frameCount * 0.6) * 0.35;
            } else if (isMoving) {
                wingAngle = Math.sin(walk) * 0.12;
            }

            // Leg Swings
            const leftLegSwing = isMoving ? Math.sin(walk) * 3 : 0;
            const rightLegSwing = isMoving ? -Math.sin(walk) * 3 : 0;
            const leftLegLift = (isMoving && Math.sin(walk) < 0) ? Math.abs(Math.sin(walk)) * 2 : 0;
            const rightLegLift = (isMoving && -Math.sin(walk) < 0) ? Math.abs(Math.sin(walk)) * 2 : 0;

            // 1. Far Leg
            ctx.fillStyle = clawDark;
            ctx.fillRect(-w * 0.18 + leftLegSwing, h * 0.2 - leftLegLift, 2.5, h * 0.28);
            // Far Foot / Claws
            ctx.fillRect(-w * 0.18 + leftLegSwing - 1, h * 0.48 - 1 - leftLegLift, 5, 2);

            // 2. Tail Feathers (Upturned at back)
            const tailWiggle = Math.sin(frameCount * 0.15) * 0.6;
            ctx.fillStyle = featherWhite;
            ctx.fillRect(-w * 0.5, -h * 0.32 + tailWiggle, 4, 6);
            ctx.fillRect(-w * 0.54, -h * 0.40 + tailWiggle, 3, 5);
            ctx.fillStyle = featherShade;
            ctx.fillRect(-w * 0.48, -h * 0.24 + tailWiggle, 3, 3);

            // 3. Body
            ctx.fillStyle = featherWhite;
            ctx.fillRect(-w * 0.42, -h * 0.28, w * 0.62, h * 0.5);
            ctx.fillStyle = featherShade;
            ctx.fillRect(-w * 0.42, h * 0.14, w * 0.62, 3);
            ctx.fillStyle = featherDark;
            ctx.fillRect(-w * 0.42, h * 0.20, w * 0.45, 1.5);

            // 4. Head & Neck
            const hx = w * 0.12 + headBobX;
            const hy = -h * 0.54 + headBobY;
            ctx.fillStyle = featherWhite;
            ctx.fillRect(hx, hy, w * 0.34, h * 0.42);
            ctx.fillStyle = featherShade;
            ctx.fillRect(hx, hy + h * 0.36, w * 0.34, 2);

            // Red Comb (Head crown)
            ctx.fillStyle = combRed;
            ctx.fillRect(hx + 2, hy - 4, 3, 4);
            ctx.fillRect(hx + 5, hy - 6, 3, 6);
            ctx.fillRect(hx + 8, hy - 3, 3, 3);
            ctx.fillStyle = combLight;
            ctx.fillRect(hx + 3, hy - 4, 1.5, 2);
            ctx.fillRect(hx + 6, hy - 5, 1.5, 3);

            // Red Wattle (under chin)
            ctx.fillStyle = wattleRed;
            ctx.fillRect(hx + w * 0.24, hy + h * 0.32, 3, 4);

            // Amber Beak
            ctx.fillStyle = beakAmber;
            ctx.fillRect(hx + w * 0.28, hy + h * 0.14, 5, 3.5);
            ctx.fillStyle = beakLight;
            ctx.fillRect(hx + w * 0.28, hy + h * 0.14, 5, 1.5);
            ctx.fillStyle = clawDark;
            ctx.fillRect(hx + w * 0.28, hy + h * 0.24, 4, 1);

            // Eye
            if (isBlinking) {
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(hx + 4, hy + h * 0.14, 3, 1.5);
            } else {
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(hx + 4, hy + h * 0.10, 3.5, 3.5);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(hx + 4, hy + h * 0.10, 1.5, 1.5);
            }

            // 5. Wing (Flapping overlay)
            ctx.save();
            ctx.translate(-w * 0.08, -h * 0.12);
            ctx.rotate(wingAngle);
            ctx.fillStyle = featherWhite;
            ctx.fillRect(-w * 0.24, -h * 0.12, w * 0.44, h * 0.32);
            ctx.fillStyle = featherShade;
            ctx.fillRect(-w * 0.22, h * 0.12, w * 0.40, 2);
            ctx.fillStyle = featherDark;
            ctx.fillRect(-w * 0.12, 0, w * 0.26, 1.5);
            ctx.restore();

            // 6. Near Leg
            ctx.fillStyle = legYellow;
            ctx.fillRect(w * 0.06 + rightLegSwing, h * 0.2 - rightLegLift, 2.5, h * 0.28);
            // Near Foot / Claws
            ctx.fillStyle = clawDark;
            ctx.fillRect(w * 0.06 + rightLegSwing - 1, h * 0.48 - 1 - rightLegLift, 5, 2);

            ctx.restore();
        }
    }

    export class Pigeon extends Animal {
        constructor(x, y) {
            super(x, y, TILE_SIZE * 0.54, TILE_SIZE * 0.48, 20, MOVE_SPEED * 0.28);
            this.state = 'ground'; // 'ground' | 'flying' | 'perching'
            this.peckTimer = 0;
            this.perchTimer = 0;
            this.flightTimer = 0;
            this.flyTargetX = x;
            this.flyTargetY = y;
            this.flapTime = Math.random() * 100;
            this.targetLeaf = null;
            this.partner = null;
            this.headTilt = 0;
            this.headTiltTimer = 0;
            this.temptAlertTimer = 0;
        }

        isTemptedBy(itemId) {
            return itemId === IDS.SEEDS;
        }

        startle(scareDir) {
            if (this.state === 'perching') {
                this.targetLeaf = null;
            }
            this.state = 'flying';
            this.panic = true;
            this.panicTimer = 180;
            this.dir = scareDir || (Math.random() > 0.5 ? 1 : -1);
            this.vy = -4.5;
            this.vx = this.dir * (3.5 + Math.random() * 1.5);
            this.isGrounded = false;
            this.flightTimer = 350 + Math.random() * 300;
            this.flyTargetX = this.x + this.dir * (200 + Math.random() * 150);
            this.flyTargetY = Math.max(2 * TILE_SIZE, this.y - (120 + Math.random() * 100));

            for (let i = 0; i < 5; i++) {
                const p = new Particle(this.x + this.width / 2, this.y + this.height / 2, '#94a3b8');
                p.vx = (Math.random() - 0.5) * 3;
                p.vy = (Math.random() - 0.5) * 3;
                particles.push(p);
            }

            if (this.partner && !this.partner.panic && Math.hypot(this.partner.x - this.x, this.partner.y - this.y) < 300) {
                this.partner.startle(this.dir);
            }
        }

        alertTempted(playerX, playerY) {
            this.temptAlertTimer = 80;
            if (this.state === 'flying') {
                this.flyTargetX = playerX + (this.x < playerX ? -50 : 50);
                this.flyTargetY = playerY - 10;
            } else if (this.state === 'perching') {
                if (Math.random() < 0.05) {
                    this.state = 'flying';
                    this.targetLeaf = null;
                    this.flightTimer = 200;
                    this.flyTargetX = playerX + (this.x < playerX ? -50 : 50);
                    this.flyTargetY = playerY - 10;
                }
            }
        }

        findNearbyTreeLeaf(searchRadiusTiles = 16) {
            const activeWorld = this.getActiveWorld();
            if (!activeWorld) return null;
            const curWorldW = activeWorld.length;
            const curWorldH = activeWorld[0]?.length || WORLD_HEIGHT;
            const curGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const curGy = Math.floor((this.y + this.height / 2) / TILE_SIZE);
            const candidates = [];

            const minX = Math.max(2, curGx - searchRadiusTiles);
            const maxX = Math.min(curWorldW - 3, curGx + searchRadiusTiles);
            const minY = Math.max(2, curGy - 14);
            const maxY = Math.min(curWorldH - 3, curGy + 14);

            for (let x = minX; x <= maxX; x++) {
                if (!activeWorld[x]) continue;
                for (let y = minY; y <= maxY; y++) {
                    if (activeWorld[x][y] === IDS.LEAVES || activeWorld[x][y] === IDS.JUNGLE_LEAVES) {
                        if (activeWorld[x][y - 1] === IDS.AIR) {
                            candidates.push({ x, y });
                        }
                    }
                }
            }

            if (candidates.length === 0) return null;
            candidates.sort((a, b) => {
                const distA = Math.hypot(a.x - curGx, a.y - curGy);
                const distB = Math.hypot(b.x - curGx, b.y - curGy);
                return distA - distB;
            });
            const pickIdx = Math.min(candidates.length - 1, Math.floor(Math.random() * Math.min(3, candidates.length)));
            return candidates[pickIdx];
        }

        update() {
            if (this.damageCooldown > 0) this.damageCooldown--;
            if (this.panicTimer > 0) this.panicTimer--;
            else this.panic = false;
            if (this.peckTimer > 0) this.peckTimer--;
            if (this.temptAlertTimer > 0) this.temptAlertTimer--;

            const activeWorld = this.getActiveWorld();
            const curWorldW = activeWorld ? activeWorld.length : WORLD_WIDTH;
            const curWorldH = activeWorld ? (activeWorld[0]?.length || WORLD_HEIGHT) : WORLD_HEIGHT;
            const activeHeights = this.getActiveTerrain();

            if (this.headTiltTimer > 0) {
                this.headTiltTimer--;
            } else if (Math.random() < 0.02) {
                this.headTilt = (Math.random() - 0.5) * 0.35;
                this.headTiltTimer = Math.floor(Math.random() * 40 + 20);
            } else {
                this.headTilt = 0;
            }

            if (!this.partner || this.partner.health <= 0) {
                this.partner = null;
                if (Math.random() < 0.02) {
                    const nearbyPigeons = entities.filter(e => e instanceof Pigeon && e !== this && !e.partner && Math.hypot(e.x - this.x, e.y - this.y) < 220);
                    if (nearbyPigeons.length > 0) {
                        const companion = nearbyPigeons[Math.floor(Math.random() * nearbyPigeons.length)];
                        this.partner = companion;
                        companion.partner = this;
                    }
                }
            }

            let pDist = 9999;
            let isHoldingSeeds = false;
            if (player && !player.isDead) {
                pDist = Math.hypot(
                    (player.x + player.width / 2) - (this.x + this.width / 2),
                    (player.y + player.height / 2) - (this.y + this.height / 2)
                );
                const held = inventory[selectedHotbarIndex];
                isHoldingSeeds = (held && this.isTemptedBy(held.id));
            }

            // 1. Skittish startle check
            if (!this.panic && player && !player.isDead) {
                if (!isHoldingSeeds && pDist < 95) {
                    const scareDir = (player.x < this.x) ? 1 : -1;
                    this.startle(scareDir);
                } else if (isHoldingSeeds && pDist < 25) {
                    const scareDir = (player.x < this.x) ? 1 : -1;
                    this.startle(scareDir);
                }
            }

            // 2. Seeds temptation & Flocking Call
            let isTemptedNow = false;
            if (isHoldingSeeds && pDist < 360 && !this.panic) {
                isTemptedNow = true;
                this.isTempted = true;

                if (frameCount % 30 === 0) {
                    const others = entities.filter(e => e instanceof Pigeon && e !== this && Math.hypot(e.x - this.x, e.y - this.y) < 280);
                    others.forEach(p => p.alertTempted(player.x, player.y));
                }

                if (frameCount % 75 === 0 && Math.random() < 0.4) {
                    particles.push(new Particle(this.x + this.width / 2, this.y - 4, '#ff80bf'));
                }
            } else {
                this.isTempted = (this.temptAlertTimer > 0);
            }

            // 3. State Machine
            if (this.state === 'perching') {
                this.vx = 0;
                this.vy = 0;
                this.isGrounded = true;

                if (this.targetLeaf) {
                    const block = activeWorld?.[this.targetLeaf.x]?.[this.targetLeaf.y];
                    if (block !== IDS.LEAVES && block !== IDS.JUNGLE_LEAVES) {
                        this.targetLeaf = null;
                        this.state = 'flying';
                        this.flightTimer = 300;
                    }
                }

                this.perchTimer--;
                if (Math.random() < 0.01) this.dir = -this.dir;

                if (this.perchTimer <= 0) {
                    this.state = 'flying';
                    this.targetLeaf = null;
                    this.flightTimer = 350 + Math.random() * 450;
                    this.vy = -3;
                    this.vx = this.dir * (1.5 + Math.random());
                    this.isGrounded = false;
                }
            }
            else if (this.state === 'ground') {
                if (this.panic) {
                    this.state = 'flying';
                    this.vy = -4.5;
                    this.flightTimer = 350;
                } else if (isTemptedNow) {
                    const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
                    this.dir = dx > 0 ? 1 : -1;
                    if (pDist > 55) {
                        this.vx = this.dir * this.baseSpeed * 1.1;
                    } else {
                        this.vx = 0;
                        if (Math.random() < 0.03 && this.peckTimer <= 0) this.peckTimer = 20;
                    }
                } else {
                    this.timer--;
                    if (this.timer <= 0) {
                        const roll = Math.random();
                        if (roll < 0.35) {
                            this.dir = 0;
                            this.peckTimer = 26;
                            this.timer = Math.random() * 60 + 30;
                        } else if (roll < 0.70) {
                            let partnerDir = 0;
                            if (this.partner && Math.hypot(this.partner.x - this.x, this.partner.y - this.y) > 40) {
                                partnerDir = this.partner.x > this.x ? 1 : -1;
                            }
                            this.dir = partnerDir !== 0 ? partnerDir : (Math.random() > 0.5 ? 1 : -1);
                            this.timer = Math.random() * 120 + 60;
                        } else {
                            this.state = 'flying';
                            this.flightTimer = 400 + Math.random() * 500;
                            this.vy = -3.8;
                            this.isGrounded = false;
                        }
                    }

                    if (this.dir !== 0 && (this.hasHazardAhead(this.dir) || this.hasLethalDropAhead(this.dir))) {
                        this.dir = -this.dir;
                        this.timer = 50;
                    }

                    this.vx = this.dir * this.baseSpeed;
                }

                if (this.vx !== 0 && this.isGrounded) {
                    const moveDir = this.vx > 0 ? 1 : -1;
                    const checkX = Math.floor((this.x + this.width / 2 + moveDir * (this.width / 2 + 4)) / TILE_SIZE);
                    const footY = Math.floor((this.y + this.height - 4) / TILE_SIZE);
                    const headY = Math.floor((this.y + 4) / TILE_SIZE);
                    if (checkX >= 0 && checkX < curWorldW) {
                        const b = activeWorld?.[checkX]?.[footY];
                        const upperB = activeWorld?.[checkX]?.[headY - 1];
                        if (isSolidWorldBlock(checkX, footY, b) && !isSolidWorldBlock(checkX, headY - 1, upperB) && !isWater(checkX, headY - 1)) {
                            this.vy = JUMP_FORCE * 0.75;
                            this.isGrounded = false;
                        }
                    }
                }

                const prevX = this.x;
                this.applyPhysics();
                const actualMoved = Math.abs(this.x - prevX);

                if (actualMoved > 0.05 && this.isGrounded) {
                    this.walkAnimTime = (this.walkAnimTime || 0) + (actualMoved / this.baseSpeed) * 0.25;
                } else {
                    this.walkAnimTime = 0;
                }

                if (!this.isGrounded && this.vy > 3.0) {
                    this.state = 'flying';
                    this.flightTimer = 300;
                }
            }
            else {
                this.flightTimer--;
                this.flapTime += (this.panic ? 0.65 : 0.38);

                const curGx = Math.max(0, Math.min(curWorldW - 1, Math.floor((this.x + this.width / 2) / TILE_SIZE)));
                const groundY = (activeHeights && activeHeights[curGx] !== undefined) ? activeHeights[curGx] : Math.floor(curWorldH / 2);
                const cruiseAltitudeY = Math.max(2 * TILE_SIZE, (groundY - 8) * TILE_SIZE);

                if (this.panic) {
                    this.flyTargetY = Math.max(2 * TILE_SIZE, cruiseAltitudeY - 3 * TILE_SIZE);
                    this.flyTargetX = this.x + this.dir * 120;
                } else if (isTemptedNow && player && !player.isDead) {
                    this.flyTargetX = player.x + (this.x < player.x ? -45 : 45);
                    this.flyTargetY = player.y - 12;
                    this.targetLeaf = null;
                } else if (this.targetLeaf) {
                    this.flyTargetX = this.targetLeaf.x * TILE_SIZE + (TILE_SIZE - this.width) / 2;
                    this.flyTargetY = (this.targetLeaf.y - 1) * TILE_SIZE + (TILE_SIZE - this.height);
                } else {
                    if (this.flightTimer % 120 === 0 || Math.abs(this.x - this.flyTargetX) < 30) {
                        const roamDistance = (Math.random() - 0.5) * 250;
                        this.flyTargetX = Math.max(50, Math.min(curWorldW * TILE_SIZE - 50, this.x + roamDistance));
                        this.flyTargetY = cruiseAltitudeY + (Math.random() - 0.5) * 50;

                        if (this.flightTimer < 250 && Math.random() < 0.45) {
                            const leafSpot = this.findNearbyTreeLeaf(18);
                            if (leafSpot) {
                                this.targetLeaf = leafSpot;
                            }
                        } else if (this.flightTimer < 100 && Math.random() < 0.4) {
                            this.flyTargetY = (groundY - 1) * TILE_SIZE;
                        }
                    }
                }

                const dx = this.flyTargetX - this.x;
                const dy = this.flyTargetY - this.y;
                const maxFlightSpeed = this.panic ? 4.2 : 2.4;
                const maxClimbSpeed = this.panic ? 3.2 : 1.8;

                const desiredVx = Math.sign(dx) * Math.min(Math.abs(dx) * 0.05, maxFlightSpeed);
                const desiredVy = Math.sign(dy) * Math.min(Math.abs(dy) * 0.05, maxClimbSpeed);

                this.vx += (desiredVx - this.vx) * 0.07;
                this.vy += (desiredVy - this.vy) * 0.07;
                this.vy += Math.sin(this.flapTime) * 0.18;

                if (Math.abs(this.vx) > 0.1) {
                    this.dir = this.vx > 0 ? 1 : -1;
                }

                this.x += this.vx;
                this.handleCollisions(true);

                this.y += this.vy;
                this.handleCollisions(false);

                if (this.targetLeaf) {
                    const leafTargetX = this.targetLeaf.x * TILE_SIZE + (TILE_SIZE - this.width) / 2;
                    const leafTargetY = (this.targetLeaf.y - 1) * TILE_SIZE + (TILE_SIZE - this.height);
                    if (Math.hypot(this.x - leafTargetX, this.y - leafTargetY) < 8 && this.vy >= -0.5) {
                        this.state = 'perching';
                        this.x = leafTargetX;
                        this.y = leafTargetY;
                        this.vx = 0;
                        this.vy = 0;
                        this.isGrounded = true;
                        this.perchTimer = 300 + Math.random() * 450;
                    }
                }

                if (this.isGrounded && this.vy >= 0 && !this.targetLeaf) {
                    this.state = 'ground';
                    this.vx = 0;
                    this.timer = 80 + Math.random() * 100;
                }
            }
        }

        takeDamage(amt, knockbackDir) {
            if (this.damageCooldown > 0) return;
            this.health -= amt;
            this.damageCooldown = 20;
            const escapeDir = knockbackDir || (Math.random() > 0.5 ? 1 : -1);
            this.startle(escapeDir);

            for (let i = 0; i < 6; i++) {
                particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#64748b'));
            }
            for (let i = 0; i < 3; i++) {
                particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ef4444'));
            }
            floatingTexts.push(new FloatingText(this.x + this.width / 2, this.y - 10, amt, "#ffcc00"));
        }

        draw(ctx, camX, camY) {
            const drawX = this.x - camX;
            const drawY = this.y - camY;
            const w = this.width;
            const h = this.height;

            if (advancedGraphics && this.state !== 'flying') {
                ctx.drawImage(cachedShadowCanvas, drawX + w / 2 - w * 0.45, drawY + h - 3, w * 0.9, 5);
            }

            ctx.save();
            ctx.translate(drawX + w / 2, drawY + h / 2);
            if (this.dir < 0) ctx.scale(-1, 1);

            const isDamaged = this.damageCooldown > 0;
            const isFlying = (this.state === 'flying');
            const isGrounded = (this.state === 'ground' && this.isGrounded);
            const isMoving = Math.abs(this.vx) > 0.05 && isGrounded;
            const walk = this.walkAnimTime || 0;
            const idle = Math.sin((frameCount + this.idleSeed) * 0.07);
            const isBlinking = ((frameCount + Math.floor(this.idleSeed)) % 190 < 6);

            // Shimmering iridescent neck cycle
            const shimmerTime = (frameCount * 0.09 + this.idleSeed);
            const shimmerVal = (Math.sin(shimmerTime) + 1) * 0.5;

            // Palette setup with damage flash override
            const cHeadBase = isDamaged ? '#ff7070' : '#334155';
            const cHeadTop = isDamaged ? '#ffa0a0' : '#475569';
            const cHeadDark = isDamaged ? '#cc4444' : '#1e293b';

            const cBreastBase = isDamaged ? '#ff8080' : '#4b5563';
            const cBreastHigh = isDamaged ? '#ffa5a5' : '#64748b';
            const cBreastDark = isDamaged ? '#cc4444' : '#334155';
            const cBellyDark = isDamaged ? '#aa3333' : '#1e293b';

            const cWingShield = isDamaged ? '#ffb0b0' : '#94a3b8';
            const cWingLight = isDamaged ? '#ffd0d0' : '#cbd5e1';
            const cWingBar = isDamaged ? '#991111' : '#0f172a';
            const cWingPrimaries = isDamaged ? '#bb2222' : '#1e293b';

            const cTailGrey = isDamaged ? '#ffa0a0' : '#475569';
            const cTailBar = isDamaged ? '#880000' : '#0f172a';
            const cTailEdge = isDamaged ? '#ffe0e0' : '#e2e8f0';

            const cCereWhite = isDamaged ? '#ffcccc' : '#f8fafc';
            const cBeakSlate = isDamaged ? '#333333' : '#1e293b';
            const cBeakTip = isDamaged ? '#222222' : '#0f172a';

            const cEyeOrange = isDamaged ? '#ff4444' : '#ea580c';
            const cEyeRing = isDamaged ? '#ff8888' : '#64748b';

            const cFootCoral = isDamaged ? '#ff4444' : '#f43f5e';
            const cFootDark = isDamaged ? '#b91c1c' : '#9f1239';
            const cClaw = isDamaged ? '#444444' : '#334155';

            // Dynamic emerald and purple iridescence
            const cIridGreen = isDamaged ? '#ff9999' : (shimmerVal > 0.4 ? '#10b981' : '#059669');
            const cIridPurple = isDamaged ? '#ff7777' : (shimmerVal > 0.6 ? '#c084fc' : '#7c3aed');
            const cIridGlint = isDamaged ? '#ffffff' : (shimmerVal > 0.5 ? '#34d399' : '#a855f7');

            // Animations
            const headBobX = isMoving ? Math.sin(walk) * 2.4 : (isFlying ? 1.2 : 0);
            const peckBobY = (this.peckTimer > 0) ? Math.sin(this.peckTimer / 26 * Math.PI) * 4.5 : 0;
            const headBobY = (isMoving ? Math.abs(Math.sin(walk)) * 1.3 : idle * 0.35) + peckBobY + (this.headTilt * 3);

            let wingAngle = 0;
            if (isFlying) {
                wingAngle = Math.sin(this.flapTime) * 0.85;
                const flyTilt = Math.max(-0.35, Math.min(0.35, this.vy * 0.08));
                ctx.rotate(flyTilt);
            } else if (this.panic) {
                wingAngle = Math.sin(frameCount * 0.65) * 0.4;
            }

            const walkSwing = isMoving ? Math.sin(walk) * 3.2 : 0;
            const walkLiftFar = (isMoving && Math.sin(walk) < 0) ? Math.abs(Math.sin(walk)) * 2.2 : 0;
            const walkLiftNear = (isMoving && -Math.sin(walk) < 0) ? Math.abs(Math.sin(walk)) * 2.2 : 0;

            // 1. Far Leg & Claws (Behind Body)
            if (!isFlying) {
                ctx.fillStyle = cFootDark;
                // Shank
                ctx.fillRect(-w * 0.12 + walkSwing, h * 0.20 - walkLiftFar, 2, h * 0.26);
                // Back toe
                ctx.fillRect(-w * 0.12 + walkSwing - 2, h * 0.46 - walkLiftFar - 1, 2, 1.5);
                // Front toes with claws
                ctx.fillRect(-w * 0.12 + walkSwing + 1, h * 0.46 - walkLiftFar - 1, 4, 1.5);
                ctx.fillStyle = cClaw;
                ctx.fillRect(-w * 0.12 + walkSwing + 4.5, h * 0.46 - walkLiftFar - 0.5, 1.5, 1);
            }

            // 2. Tail & Rump
            const tailFlutter = isFlying ? Math.sin(this.flapTime * 0.5) * 0.5 : Math.sin(frameCount * 0.12) * 0.4;
            ctx.save();
            ctx.translate(-w * 0.42, -h * 0.05 + tailFlutter);
            // Pale grey rump
            ctx.fillStyle = cWingShield;
            ctx.fillRect(0, -h * 0.14, 3, 3);
            // Tail main body
            ctx.fillStyle = cTailGrey;
            ctx.fillRect(-w * 0.22, -h * 0.10, w * 0.24, 4.5);
            // Dark terminal bar
            ctx.fillStyle = cTailBar;
            ctx.fillRect(-w * 0.22, -h * 0.10, 3.5, 4.5);
            // White outer margin edge
            ctx.fillStyle = cTailEdge;
            ctx.fillRect(-w * 0.22, -h * 0.12, 1.5, 4.8);
            ctx.restore();

            // 3. Plump Breast & Belly Body
            // Underbelly
            ctx.fillStyle = cBellyDark;
            ctx.fillRect(-w * 0.30, h * 0.14, w * 0.54, 3);
            // Main breast / body mass
            ctx.fillStyle = cBreastBase;
            ctx.fillRect(-w * 0.32, -h * 0.22, w * 0.58, h * 0.40);
            // Puffed breast curve
            ctx.fillStyle = cBreastHigh;
            ctx.fillRect(w * 0.10, -h * 0.18, 4, h * 0.30);
            ctx.fillRect(-w * 0.15, -h * 0.20, w * 0.32, 2.5);
            // Feather scallops on breast (curved plumage markings as in photo)
            ctx.fillStyle = cBreastDark;
            ctx.fillRect(-w * 0.08, -h * 0.08, 2.5, 2);
            ctx.fillRect(w * 0.04, -h * 0.04, 2.5, 2);
            ctx.fillRect(-w * 0.02, h * 0.06, 2.5, 2);
            ctx.fillRect(w * 0.12, -h * 0.12, 2, 2);

            // 4. Head, Throat & Neck
            const hx = w * 0.16 + headBobX;
            const hy = -h * 0.46 + headBobY;

            // Neck connecting body to head
            ctx.fillStyle = cHeadBase;
            ctx.fillRect(hx - 3, hy + h * 0.16, w * 0.32, h * 0.28);
            ctx.fillStyle = cHeadDark;
            ctx.fillRect(hx - 4, hy + h * 0.22, 2, h * 0.22); // Throat/nape shadow

            // Metallic Iridescent Neck Patch (Emerald Green + Purple Shimmer)
            ctx.fillStyle = cIridGreen;
            ctx.fillRect(hx - 1, hy + h * 0.18, 3.5, 3.5);
            ctx.fillRect(hx + 3, hy + h * 0.24, 3, 3);
            ctx.fillStyle = cIridPurple;
            ctx.fillRect(hx - 2, hy + h * 0.26, 3, 3);
            ctx.fillRect(hx + 2, hy + h * 0.18, 2.5, 2);
            ctx.fillStyle = cIridGlint;
            ctx.fillRect(hx, hy + h * 0.20, 1.5, 1.5);
            ctx.fillRect(hx + 3, hy + h * 0.27, 1.5, 1.5);

            // Sleek Rounded Head
            ctx.fillStyle = cHeadBase;
            ctx.fillRect(hx - 2, hy, w * 0.34, h * 0.32);
            // Head crown highlight
            ctx.fillStyle = cHeadTop;
            ctx.fillRect(hx - 1, hy, w * 0.30, 2);
            // Subtle throat shade
            ctx.fillStyle = cHeadDark;
            ctx.fillRect(hx + 3, hy + h * 0.26, 4, 2);

            // Fiery Amber-Orange Eye
            const eyeX = hx + 4;
            const eyeY = hy + 3;
            if (isBlinking) {
                ctx.fillStyle = cHeadDark;
                ctx.fillRect(eyeX - 1, eyeY + 1, 4, 1.5);
            } else {
                // Orbital skin ring
                ctx.fillStyle = cEyeRing;
                ctx.fillRect(eyeX - 0.5, eyeY - 0.5, 4.5, 4.5);
                // Fiery orange iris
                ctx.fillStyle = cEyeOrange;
                ctx.fillRect(eyeX, eyeY, 3.5, 3.5);
                // Black pupil
                ctx.fillStyle = '#020617';
                ctx.fillRect(eyeX + 1, eyeY + 1, 2, 2);
                // Crisp white catchlight gleam
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(eyeX + 1, eyeY, 1, 1);
            }

            // Beak & White Cere
            const beakX = hx + w * 0.32;
            const beakY = hy + 4;
            // Prominent White / Ivory Cere (signature pigeon feature!)
            ctx.fillStyle = cCereWhite;
            ctx.fillRect(beakX - 1, beakY - 1, 2.5, 2);
            // Slate bill
            ctx.fillStyle = cBeakSlate;
            ctx.fillRect(beakX + 1, beakY + 0.5, 4, 2.2);
            // Curved dark tip
            ctx.fillStyle = cBeakTip;
            ctx.fillRect(beakX + 3.5, beakY + 1.8, 1.8, 1.4);

            // 5. Wing (Checkered Wing Coverts + Two Black Wing Bars + Primaries)
            ctx.save();
            ctx.translate(-w * 0.04, -h * 0.08);
            ctx.rotate(wingAngle);

            if (isFlying) {
                // Expanded Aerodynamic Wing
                // Wing coverts
                ctx.fillStyle = cWingShield;
                ctx.fillRect(-w * 0.24, -h * 0.28, w * 0.52, h * 0.46);
                // Dual black wing bars
                ctx.fillStyle = cWingBar;
                ctx.fillRect(-w * 0.20, h * 0.02, w * 0.46, 2.5);
                ctx.fillRect(-w * 0.16, -h * 0.10, w * 0.42, 2.5);
                // Dark primaries with spread feather tips
                ctx.fillStyle = cWingPrimaries;
                ctx.fillRect(-w * 0.24, h * 0.12, w * 0.54, 3.5);
                ctx.fillRect(-w * 0.20, h * 0.20, 3, 2.5);
                ctx.fillRect(-w * 0.10, h * 0.22, 3, 2.5);
                ctx.fillRect(0, h * 0.22, 3, 2.5);
                ctx.fillRect(w * 0.10, h * 0.20, 3, 2.5);
                // Inner wing lining highlight
                ctx.fillStyle = cWingLight;
                ctx.fillRect(-w * 0.18, -h * 0.24, w * 0.38, 2);
            } else {
                // Folded Wing with Checker Marks and Two Bars
                // Silvery lavender wing shield
                ctx.fillStyle = cWingShield;
                ctx.fillRect(-w * 0.24, -h * 0.14, w * 0.46, h * 0.34);
                ctx.fillStyle = cWingLight;
                ctx.fillRect(-w * 0.20, -h * 0.12, w * 0.38, 2.5);

                // Checker feather spots on upper wing
                ctx.fillStyle = cWingPrimaries;
                ctx.fillRect(-w * 0.16, -h * 0.06, 2, 2);
                ctx.fillRect(-w * 0.06, -h * 0.08, 2, 2);
                ctx.fillRect(w * 0.04, -h * 0.04, 2, 2);
                ctx.fillRect(-w * 0.10, 0, 2, 2);

                // Two Iconic Black Wing Bars
                ctx.fillStyle = cWingBar;
                ctx.fillRect(-w * 0.20, h * 0.04, w * 0.38, 2.5); // First broad bar
                ctx.fillRect(-w * 0.14, h * 0.12, w * 0.32, 2.5); // Second broad bar

                // Folded Dark Primary Flight Feathers extending back
                ctx.fillStyle = cWingPrimaries;
                ctx.fillRect(-w * 0.32, h * 0.08, w * 0.22, 4);
                ctx.fillStyle = cBeakTip;
                ctx.fillRect(-w * 0.36, h * 0.10, 3, 3);
            }
            ctx.restore();

            // 6. Near Leg & Claws (In Front)
            if (!isFlying) {
                ctx.fillStyle = cFootCoral;
                // Shank
                ctx.fillRect(w * 0.06 - walkSwing, h * 0.20 - walkLiftNear, 2.2, h * 0.26);
                // Back toe
                ctx.fillRect(w * 0.06 - walkSwing - 2, h * 0.46 - walkLiftNear - 1, 2, 1.5);
                // Front toes with claws
                ctx.fillRect(w * 0.06 - walkSwing + 1, h * 0.46 - walkLiftNear - 1, 4.5, 1.5);
                ctx.fillStyle = cClaw;
                ctx.fillRect(w * 0.06 - walkSwing + 5.2, h * 0.46 - walkLiftNear - 0.5, 1.5, 1);
            } else {
                // Tucked feet in flight
                ctx.fillStyle = cFootCoral;
                ctx.fillRect(-w * 0.10, h * 0.16, 3.5, 2);
                ctx.fillRect(w * 0.04, h * 0.16, 3.5, 2);
                ctx.fillStyle = cClaw;
                ctx.fillRect(-w * 0.12, h * 0.17, 1.5, 1);
                ctx.fillRect(w * 0.02, h * 0.17, 1.5, 1);
            }

            ctx.restore();
        }
    }

    export class Parrot extends Animal {
        constructor(x, y, variant = null) {
            super(x, y, TILE_SIZE * 0.48, TILE_SIZE * 0.52, 6, MOVE_SPEED * 0.32);
            this.state = 'ground'; // 'ground' | 'flying' | 'perching'
            this.variant = (variant !== null && variant >= 0 && variant <= 3) ? variant : Math.floor(Math.random() * 4);
            this.isTamed = false;
            this.owner = null;
            this.isSitting = false;
            this.isMounted = false;
            this.mountedShoulder = null;
            this.peckTimer = 0;
            this.perchTimer = 0;
            this.flightTimer = 0;
            this.flyTargetX = x;
            this.flyTargetY = y;
            this.flapTime = Math.random() * 100;
            this.targetLeaf = null;
            this.headTilt = 0;
            this.headTiltTimer = 0;
            this.temptAlertTimer = 0;
            this.chirpTimer = Math.floor(Math.random() * 300 + 200);
            this.hopTimer = 0;
        }

        isTemptedBy(itemId) {
            return itemId === IDS.SEEDS || itemId === IDS.MELON_SEEDS;
        }

        startle(scareDir) {
            if (this.isMounted || this.isSitting) return;
            if (this.state === 'perching') this.targetLeaf = null;
            this.state = 'flying';
            this.panic = true;
            this.panicTimer = 160;
            this.dir = scareDir || (Math.random() > 0.5 ? 1 : -1);
            this.vy = -4.5;
            this.vx = this.dir * (3.5 + Math.random() * 1.5);
            this.isGrounded = false;
            this.flightTimer = 300 + Math.random() * 250;
            this.flyTargetX = this.x + this.dir * (180 + Math.random() * 120);
            this.flyTargetY = Math.max(2 * TILE_SIZE, this.y - (100 + Math.random() * 80));

            for (let i = 0; i < 5; i++) {
                const p = new Particle(this.x + this.width / 2, this.y + this.height / 2, this.getFeatherParticleColor());
                p.vx = (Math.random() - 0.5) * 3;
                p.vy = (Math.random() - 0.5) * 3;
                particles.push(p);
            }
        }

        getFeatherParticleColor() {
            switch (this.variant) {
                case 0: return '#ef4444';
                case 1: return '#22c55e';
                case 2: return '#0ea5e9';
                case 3: return '#eab308';
                default: return '#ef4444';
            }
        }

        findNearbyTreeLeaf(searchRadiusTiles = 16) {
            const activeWorld = this.getActiveWorld();
            if (!activeWorld) return null;
            const curWorldW = activeWorld.length;
            const curWorldH = activeWorld[0]?.length || WORLD_HEIGHT;
            const curGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const curGy = Math.floor((this.y + this.height / 2) / TILE_SIZE);
            const candidates = [];

            const minX = Math.max(2, curGx - searchRadiusTiles);
            const maxX = Math.min(curWorldW - 3, curGx + searchRadiusTiles);
            const minY = Math.max(2, curGy - 14);
            const maxY = Math.min(curWorldH - 3, curGy + 14);

            for (let x = minX; x <= maxX; x++) {
                if (!activeWorld[x]) continue;
                for (let y = minY; y <= maxY; y++) {
                    const block = activeWorld[x][y];
                    if (block === IDS.JUNGLE_LEAVES || block === IDS.LEAVES) {
                        if (activeWorld[x][y - 1] === IDS.AIR) candidates.push({ x, y });
                    }
                }
            }

            if (candidates.length === 0) return null;
            candidates.sort((a, b) => {
                const distA = Math.hypot(a.x - curGx, a.y - curGy);
                const distB = Math.hypot(b.x - curGx, b.y - curGy);
                return distA - distB;
            });
            const pickIdx = Math.min(candidates.length - 1, Math.floor(Math.random() * Math.min(3, candidates.length)));
            return candidates[pickIdx];
        }

        interact(curPlayer, inv, slotIdx) {
            const held = inv ? inv[slotIdx] : null;
            if (!this.isTamed) {
                if (held && this.isTemptedBy(held.id) && held.count > 0) {
                    held.count--;
                    if (held.count <= 0) inv[slotIdx] = null;
                    if (typeof updateUI === 'function') updateUI();

                    if (Math.random() < 0.33) {
                        this.isTamed = true;
                        this.owner = 'player';
                        this.isSitting = false;
                        playSound('parrot_tame');
                        for (let i = 0; i < 7; i++) {
                            const p = new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ef4444');
                            p.vx = (Math.random() - 0.5) * 2.5;
                            p.vy = -Math.random() * 2.5 - 0.5;
                            particles.push(p);
                        }
                        if (typeof showToast === 'function') showToast('Parrot tamed!');
                        if (typeof unlockAchievement === 'function') unlockAchievement('best_friends_forever');
                    } else {
                        playSound('pop');
                        for (let i = 0; i < 4; i++) {
                            const p = new Particle(this.x + this.width / 2, this.y + this.height / 2, '#9ca3af');
                            p.vx = (Math.random() - 0.5) * 2;
                            p.vy = -Math.random() * 2;
                            particles.push(p);
                        }
                    }
                    if (!isMultiplayer && typeof saveCurrentWorld === 'function') saveCurrentWorld();
                    return true;
                }
            } else {
                if (this.isMounted) {
                    if (curPlayer.leftShoulderParrot === this) curPlayer.leftShoulderParrot = null;
                    if (curPlayer.rightShoulderParrot === this) curPlayer.rightShoulderParrot = null;
                    this.isMounted = false;
                    this.mountedShoulder = null;
                    this.state = 'flying';
                    this.vy = -3;
                    this.flightTimer = 150;
                    playSound('parrot_chirp', { vol: 0.6 });
                    return true;
                }

                this.isSitting = !this.isSitting;
                if (this.isSitting) {
                    this.state = 'ground';
                    this.vx = 0;
                    this.vy = 0;
                    if (typeof showToast === 'function') showToast('Parrot is sitting.');
                } else {
                    if (typeof showToast === 'function') showToast('Parrot is standing.');
                }
                playSound('parrot_chirp', { vol: 0.6 });
                if (!isMultiplayer && typeof saveCurrentWorld === 'function') saveCurrentWorld();
                return true;
            }
            return false;
        }

        update() {
            if (this.isMounted) {
                const curPlayer = (typeof window !== 'undefined' && window.player) ? window.player : player;
                if (!curPlayer || curPlayer.isDead || curPlayer.health <= 0) {
                    this.isMounted = false;
                    this.mountedShoulder = null;
                    this.state = 'flying';
                    this.vy = -3;
                    return;
                }
                this.x = curPlayer.x;
                this.y = curPlayer.y;
                this.vx = 0;
                this.vy = 0;
                return;
            }

            if (this.damageCooldown > 0) this.damageCooldown--;
            if (this.panicTimer > 0) this.panicTimer--;
            else this.panic = false;
            if (this.peckTimer > 0) this.peckTimer--;
            if (this.temptAlertTimer > 0) this.temptAlertTimer--;
            if (this.hopTimer > 0) this.hopTimer--;

            const activeWorld = this.getActiveWorld();
            const curWorldW = activeWorld ? activeWorld.length : WORLD_WIDTH;
            const curWorldH = activeWorld ? (activeWorld[0]?.length || WORLD_HEIGHT) : WORLD_HEIGHT;
            const activeHeights = this.getActiveTerrain();

            if (this.chirpTimer > 0) {
                this.chirpTimer--;
            } else {
                this.chirpTimer = Math.floor(Math.random() * 450 + 350);
                const curPlayer = (typeof window !== 'undefined' && window.player) ? window.player : player;
                if (curPlayer && !curPlayer.isDead && Math.hypot(this.x - curPlayer.x, this.y - curPlayer.y) < 380) {
                    playSound('parrot_chirp', { vol: 0.5 });
                }
            }

            if (this.headTiltTimer > 0) {
                this.headTiltTimer--;
            } else if (Math.random() < 0.02) {
                this.headTilt = (Math.random() - 0.5) * 0.4;
                this.headTiltTimer = Math.floor(Math.random() * 40 + 20);
            } else {
                this.headTilt = 0;
            }

            const curPlayer = (typeof window !== 'undefined' && window.player) ? window.player : player;
            let pDist = 9999;
            let isHoldingSeeds = false;
            if (curPlayer && !curPlayer.isDead) {
                pDist = Math.hypot(
                    (curPlayer.x + curPlayer.width / 2) - (this.x + this.width / 2),
                    (curPlayer.y + curPlayer.height / 2) - (this.y + this.height / 2)
                );
                const held = inventory[selectedHotbarIndex];
                isHoldingSeeds = (held && this.isTemptedBy(held.id));
            }

            if (!this.isTamed && !this.panic && curPlayer && !curPlayer.isDead && !isHoldingSeeds) {
                if (pDist < 75 && Math.abs(curPlayer.vx) > 1.5) {
                    const scareDir = (curPlayer.x < this.x) ? 1 : -1;
                    this.startle(scareDir);
                }
            }

            let isTemptedNow = false;
            if (!this.isSitting && isHoldingSeeds && pDist < 350 && !this.panic) {
                isTemptedNow = true;
                this.isTempted = true;
                if (frameCount % 60 === 0 && Math.random() < 0.4) {
                    particles.push(new Particle(this.x + this.width / 2, this.y - 4, '#ff80bf'));
                }
            } else {
                this.isTempted = false;
            }

            if (this.isTamed && !this.isSitting && curPlayer && !curPlayer.isDead) {
                const px = Math.floor((curPlayer.x + curPlayer.width / 2) / TILE_SIZE);
                const py = Math.floor((curPlayer.y + curPlayer.height - 2) / TILE_SIZE);
                const isPlayerInWater = isWater(px, py) || isWater(px, py - 1);

                if (!isPlayerInWater && Math.abs(curPlayer.vy) < 2 && pDist < 32) {
                    if (!curPlayer.leftShoulderParrot) {
                        curPlayer.leftShoulderParrot = this;
                        this.isMounted = true;
                        this.mountedShoulder = 'left';
                        playSound('parrot_chirp', { vol: 0.6 });
                        return;
                    } else if (!curPlayer.rightShoulderParrot && curPlayer.leftShoulderParrot !== this) {
                        curPlayer.rightShoulderParrot = this;
                        this.isMounted = true;
                        this.mountedShoulder = 'right';
                        playSound('parrot_chirp', { vol: 0.6 });
                        return;
                    }
                }

                if (pDist > 48) {
                    if (this.state !== 'flying') {
                        this.state = 'flying';
                        this.flightTimer = 300;
                        this.vy = -3;
                        this.isGrounded = false;
                    }
                    this.flyTargetX = curPlayer.x + (this.x < curPlayer.x ? -24 : 24);
                    this.flyTargetY = curPlayer.y - 8;
                }
            }

            if (this.isSitting) {
                this.vx = 0;
                this.vy = 0;
                this.isGrounded = true;
                this.applyPhysics();
                return;
            }

            if (this.state === 'perching') {
                this.vx = 0;
                this.vy = 0;
                this.isGrounded = true;

                if (this.targetLeaf) {
                    const block = activeWorld?.[this.targetLeaf.x]?.[this.targetLeaf.y];
                    if (block !== IDS.LEAVES && block !== IDS.JUNGLE_LEAVES) {
                        this.targetLeaf = null;
                        this.state = 'flying';
                        this.flightTimer = 300;
                    }
                }

                this.perchTimer--;
                if (Math.random() < 0.01) this.dir = -this.dir;

                if (this.perchTimer <= 0) {
                    this.state = 'flying';
                    this.targetLeaf = null;
                    this.flightTimer = 300 + Math.random() * 400;
                    this.vy = -3;
                    this.vx = this.dir * (1.5 + Math.random());
                    this.isGrounded = false;
                }
            }
            else if (this.state === 'ground') {
                if (this.panic) {
                    this.state = 'flying';
                    this.vy = -4.5;
                    this.flightTimer = 300;
                } else if (isTemptedNow) {
                    const dx = (curPlayer.x + curPlayer.width / 2) - (this.x + this.width / 2);
                    this.dir = dx > 0 ? 1 : -1;
                    if (pDist > 45) {
                        this.vx = this.dir * this.baseSpeed * 1.2;
                        if (this.isGrounded && this.hopTimer <= 0 && Math.random() < 0.08) {
                            this.vy = -2.5;
                            this.hopTimer = 25;
                        }
                    } else {
                        this.vx = 0;
                        if (Math.random() < 0.03 && this.peckTimer <= 0) this.peckTimer = 20;
                    }
                } else {
                    this.timer--;
                    if (this.timer <= 0) {
                        const roll = Math.random();
                        if (roll < 0.35) {
                            this.dir = 0;
                            this.peckTimer = 24;
                            this.timer = Math.random() * 60 + 30;
                        } else if (roll < 0.70) {
                            this.dir = Math.random() > 0.5 ? 1 : -1;
                            this.timer = Math.random() * 100 + 50;
                            if (this.isGrounded && Math.random() < 0.5) {
                                this.vy = -2.4;
                            }
                        } else {
                            this.state = 'flying';
                            this.flightTimer = 350 + Math.random() * 450;
                            this.vy = -3.8;
                            this.isGrounded = false;
                        }
                    }

                    if (this.dir !== 0 && (this.hasHazardAhead(this.dir) || this.hasLethalDropAhead(this.dir))) {
                        this.dir = -this.dir;
                        this.timer = 50;
                    }

                    this.vx = this.dir * this.baseSpeed;
                }

                if (this.vx !== 0 && this.isGrounded) {
                    const moveDir = this.vx > 0 ? 1 : -1;
                    const checkX = Math.floor((this.x + this.width / 2 + moveDir * (this.width / 2 + 4)) / TILE_SIZE);
                    const footY = Math.floor((this.y + this.height - 4) / TILE_SIZE);
                    const headY = Math.floor((this.y + 4) / TILE_SIZE);
                    if (checkX >= 0 && checkX < curWorldW) {
                        const b = activeWorld?.[checkX]?.[footY];
                        const upperB = activeWorld?.[checkX]?.[headY - 1];
                        if (isSolidWorldBlock(checkX, footY, b) && !isSolidWorldBlock(checkX, headY - 1, upperB) && !isWater(checkX, headY - 1)) {
                            this.vy = JUMP_FORCE * 0.75;
                            this.isGrounded = false;
                        }
                    }
                }

                const prevX = this.x;
                this.applyPhysics();
                const actualMoved = Math.abs(this.x - prevX);

                if (actualMoved > 0.05 && this.isGrounded) {
                    this.walkAnimTime = (this.walkAnimTime || 0) + (actualMoved / this.baseSpeed) * 0.25;
                } else {
                    this.walkAnimTime = 0;
                }

                if (!this.isGrounded && this.vy > 3.0) {
                    this.state = 'flying';
                    this.flightTimer = 250;
                }
            }
            else {
                this.flightTimer--;
                this.flapTime += (this.panic ? 0.7 : 0.42);

                const curGx = Math.max(0, Math.min(curWorldW - 1, Math.floor((this.x + this.width / 2) / TILE_SIZE)));
                const groundY = (activeHeights && activeHeights[curGx] !== undefined) ? activeHeights[curGx] : Math.floor(curWorldH / 2);
                const cruiseAltitudeY = Math.max(2 * TILE_SIZE, (groundY - 8) * TILE_SIZE);

                if (this.panic) {
                    this.flyTargetY = Math.max(2 * TILE_SIZE, cruiseAltitudeY - 3 * TILE_SIZE);
                    this.flyTargetX = this.x + this.dir * 120;
                } else if (isTemptedNow && curPlayer && !curPlayer.isDead) {
                    this.flyTargetX = curPlayer.x + (this.x < curPlayer.x ? -35 : 35);
                    this.flyTargetY = curPlayer.y - 10;
                    this.targetLeaf = null;
                } else if (this.isTamed && !this.isSitting && curPlayer && !curPlayer.isDead) {
                    this.flyTargetX = curPlayer.x + (this.x < curPlayer.x ? -20 : 20);
                    this.flyTargetY = curPlayer.y - 12;
                    this.targetLeaf = null;
                } else if (this.targetLeaf) {
                    this.flyTargetX = this.targetLeaf.x * TILE_SIZE + (TILE_SIZE - this.width) / 2;
                    this.flyTargetY = (this.targetLeaf.y - 1) * TILE_SIZE + (TILE_SIZE - this.height);
                } else {
                    if (this.flightTimer % 100 === 0 || Math.abs(this.x - this.flyTargetX) < 30) {
                        const roamDistance = (Math.random() - 0.5) * 220;
                        this.flyTargetX = Math.max(50, Math.min(curWorldW * TILE_SIZE - 50, this.x + roamDistance));
                        this.flyTargetY = cruiseAltitudeY + (Math.random() - 0.5) * 40;

                        if (this.flightTimer < 250 && Math.random() < 0.5) {
                            const leafSpot = this.findNearbyTreeLeaf(16);
                            if (leafSpot) this.targetLeaf = leafSpot;
                        } else if (this.flightTimer < 100 && Math.random() < 0.4) {
                            this.flyTargetY = (groundY - 1) * TILE_SIZE;
                        }
                    }
                }

                const dx = this.flyTargetX - this.x;
                const dy = this.flyTargetY - this.y;
                const maxFlightSpeed = this.panic ? 4.5 : 2.6;
                const maxClimbSpeed = this.panic ? 3.5 : 2.0;

                const desiredVx = Math.sign(dx) * Math.min(Math.abs(dx) * 0.05, maxFlightSpeed);
                const desiredVy = Math.sign(dy) * Math.min(Math.abs(dy) * 0.05, maxClimbSpeed);

                this.vx += (desiredVx - this.vx) * 0.08;
                this.vy += (desiredVy - this.vy) * 0.08;
                this.vy += Math.sin(this.flapTime) * 0.16;

                if (Math.abs(this.vx) > 0.1) this.dir = this.vx > 0 ? 1 : -1;

                this.x += this.vx;
                this.handleCollisions(true);
                this.y += this.vy;
                this.handleCollisions(false);

                if (this.targetLeaf) {
                    const leafTargetX = this.targetLeaf.x * TILE_SIZE + (TILE_SIZE - this.width) / 2;
                    const leafTargetY = (this.targetLeaf.y - 1) * TILE_SIZE + (TILE_SIZE - this.height);
                    if (Math.hypot(this.x - leafTargetX, this.y - leafTargetY) < 8 && this.vy >= -0.5) {
                        this.state = 'perching';
                        this.x = leafTargetX;
                        this.y = leafTargetY;
                        this.vx = 0;
                        this.vy = 0;
                        this.isGrounded = true;
                        this.perchTimer = 280 + Math.random() * 400;
                    }
                }

                if (this.isGrounded && this.vy >= 0 && !this.targetLeaf) {
                    this.state = 'ground';
                    this.vx = 0;
                    this.timer = 70 + Math.random() * 90;
                }
            }
        }

        takeDamage(amt, knockbackDir) {
            if (this.damageCooldown > 0) return;
            this.health -= amt;
            this.damageCooldown = 20;

            const curPlayer = (typeof window !== 'undefined' && window.player) ? window.player : player;
            if (this.isMounted && curPlayer) {
                if (curPlayer.leftShoulderParrot === this) curPlayer.leftShoulderParrot = null;
                if (curPlayer.rightShoulderParrot === this) curPlayer.rightShoulderParrot = null;
                this.isMounted = false;
                this.mountedShoulder = null;
            }

            playSound('parrot_hurt', { vol: 0.8 });
            const escapeDir = knockbackDir || (Math.random() > 0.5 ? 1 : -1);
            this.startle(escapeDir);

            for (let i = 0; i < 6; i++) {
                particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, this.getFeatherParticleColor()));
            }
            for (let i = 0; i < 3; i++) {
                particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ef4444'));
            }
            floatingTexts.push(new FloatingText(this.x + this.width / 2, this.y - 10, amt, "#ffcc00"));
        }

        draw(ctx, camX, camY) {
            if (this.isMounted) return;

            const drawX = this.x - camX;
            const drawY = this.y - camY;
            const w = this.width;
            const h = this.height;

            if (advancedGraphics && this.state !== 'flying') {
                ctx.drawImage(cachedShadowCanvas, drawX + w / 2 - w * 0.45, drawY + h - 3, w * 0.9, 5);
            }

            ctx.save();
            ctx.translate(drawX + w / 2, drawY + h / 2);
            if (this.dir < 0) ctx.scale(-1, 1);

            const isDamaged = this.damageCooldown > 0;
            const isFlying = (this.state === 'flying');
            const isGrounded = (this.state === 'ground' && this.isGrounded);
            const isMoving = Math.abs(this.vx) > 0.05 && isGrounded;
            const walk = this.walkAnimTime || 0;
            const idle = Math.sin((frameCount + this.idleSeed) * 0.08);
            const isBlinking = ((frameCount + Math.floor(this.idleSeed)) % 180 < 6);

            let cBody, cWingAccent, cWingFlight, cBeak, cEyeRing, cEyeIris, cTail, cCrest = null;
            if (this.variant === 0) {
                cBody = isDamaged ? '#ff6666' : '#dc2626';
                cWingAccent = isDamaged ? '#ffcc00' : '#eab308';
                cWingFlight = isDamaged ? '#60a5fa' : '#2563eb';
                cBeak = isDamaged ? '#475569' : '#1e293b';
                cEyeRing = '#ffffff';
                cEyeIris = '#0f172a';
                cTail = '#2563eb';
            } else if (this.variant === 1) {
                cBody = isDamaged ? '#86efac' : '#16a34a';
                cWingAccent = isDamaged ? '#fca5a5' : '#ef4444';
                cWingFlight = isDamaged ? '#5eead4' : '#0d9488';
                cBeak = isDamaged ? '#fef08a' : '#fef08a';
                cEyeRing = '#dcfce7';
                cEyeIris = '#0f172a';
                cTail = '#15803d';
            } else if (this.variant === 2) {
                cBody = isDamaged ? '#7dd3fc' : '#0284c7';
                cWingAccent = isDamaged ? '#38bdf8' : '#0369a1';
                cWingFlight = isDamaged ? '#93c5fd' : '#1d4ed8';
                cBeak = isDamaged ? '#475569' : '#111827';
                cEyeRing = '#facc15';
                cEyeIris = '#0f172a';
                cTail = '#1e40af';
            } else {
                cBody = isDamaged ? '#cbd5e1' : '#64748b';
                cWingAccent = '#f8fafc';
                cWingFlight = '#475569';
                cBeak = '#d1d5db';
                cEyeRing = '#fef08a';
                cEyeIris = '#1e293b';
                cTail = '#475569';
                cCrest = '#fde047';
            }

            const cFeet = '#4b5563';

            let wingAngle = 0;
            if (isFlying) {
                wingAngle = Math.sin(this.flapTime) * 0.9;
                const flyTilt = Math.max(-0.35, Math.min(0.35, this.vy * 0.08));
                ctx.rotate(flyTilt);
            } else if (this.panic) {
                wingAngle = Math.sin(frameCount * 0.65) * 0.4;
            }

            const headBobX = isMoving ? Math.sin(walk) * 2 : 0;
            const peckBobY = (this.peckTimer > 0) ? Math.sin(this.peckTimer / 24 * Math.PI) * 3.5 : 0;
            const headBobY = (isMoving ? Math.abs(Math.sin(walk)) * 1.2 : idle * 0.4) + peckBobY + (this.headTilt * 3);

            // Tail
            ctx.save();
            ctx.translate(-w * 0.35, h * 0.1);
            ctx.fillStyle = cTail;
            ctx.fillRect(-w * 0.35, 0, w * 0.45, 3.5);
            ctx.fillRect(-w * 0.25, 2, w * 0.3, 2.5);
            ctx.restore();

            // Feet
            if (!isFlying && !this.isSitting) {
                ctx.fillStyle = cFeet;
                ctx.fillRect(-w * 0.12, h * 0.35, 2, h * 0.15);
                ctx.fillRect(w * 0.08, h * 0.35, 2, h * 0.15);
                ctx.fillRect(-w * 0.15, h * 0.48, 4, 1.5);
                ctx.fillRect(w * 0.05, h * 0.48, 4, 1.5);
            }

            // Body
            const bodyY = this.isSitting ? 2 : 0;
            ctx.fillStyle = cBody;
            ctx.fillRect(-w * 0.28, -h * 0.25 + bodyY, w * 0.55, h * 0.55);

            // Head
            const hx = w * 0.05 + headBobX;
            const hy = -h * 0.48 + headBobY + bodyY;
            ctx.fillStyle = cBody;
            ctx.fillRect(hx, hy, w * 0.45, h * 0.42);

            if (cCrest) {
                ctx.fillStyle = cCrest;
                ctx.fillRect(hx - 2, hy - 4, 3.5, 5);
                ctx.fillRect(hx + 1, hy - 6, 2.5, 6);
                ctx.fillStyle = '#f97316';
                ctx.fillRect(hx + 2, hy + 5, 3, 3);
            } else {
                ctx.fillStyle = cWingAccent;
                ctx.fillRect(hx - 1, hy - 2, 2.5, 3);
            }

            // Eye
            const eyeX = hx + w * 0.22;
            const eyeY = hy + 3;
            if (isBlinking) {
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(eyeX, eyeY + 1, 3, 1);
            } else {
                ctx.fillStyle = cEyeRing;
                ctx.fillRect(eyeX - 0.5, eyeY - 0.5, 4, 4);
                ctx.fillStyle = cEyeIris;
                ctx.fillRect(eyeX, eyeY, 2.5, 2.5);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(eyeX, eyeY, 1, 1);
            }

            // Beak
            ctx.fillStyle = cBeak;
            ctx.fillRect(hx + w * 0.42, hy + 3, 3.5, 3.5);
            ctx.fillRect(hx + w * 0.42 + 1.5, hy + 5.5, 2, 2);

            // Wing
            ctx.save();
            ctx.translate(-w * 0.05, -h * 0.12 + bodyY);
            ctx.rotate(wingAngle);

            if (isFlying) {
                ctx.fillStyle = cBody;
                ctx.fillRect(-w * 0.25, -h * 0.3, w * 0.55, h * 0.4);
                ctx.fillStyle = cWingAccent;
                ctx.fillRect(-w * 0.2, -h * 0.1, w * 0.5, 2.5);
                ctx.fillStyle = cWingFlight;
                ctx.fillRect(-w * 0.25, 0, w * 0.55, 3.5);
            } else {
                ctx.fillStyle = cBody;
                ctx.fillRect(-w * 0.22, -h * 0.15, w * 0.44, h * 0.4);
                ctx.fillStyle = cWingAccent;
                ctx.fillRect(-w * 0.18, -h * 0.05, w * 0.36, 2.5);
                ctx.fillStyle = cWingFlight;
                ctx.fillRect(-w * 0.22, h * 0.05, w * 0.4, 3);
            }
            ctx.restore();

            ctx.restore();
        }
    }

    export class Sheep extends Animal {
        constructor(x, y) {
            super(x, y, TILE_SIZE * 0.85, TILE_SIZE * 0.7, 8, MOVE_SPEED * 0.22);
            this.isSheared = false;
            this.eatAnim = 0;
        }

        isTemptedBy(itemId) {
            return itemId === IDS.WHEAT || itemId === IDS.SEEDS || itemId === IDS.SAPLING;
        }

        update() {
            this.updateAnimalAI();
            if (this.eatAnim > 0) this.eatAnim--;
            if (this.isSheared && this.isGrounded && Math.random() < 0.004) {
                let gx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
                let gy = Math.floor((this.y + this.height + 2) / TILE_SIZE);
                if (gx >= 0 && gx < WORLD_WIDTH && gy >= 0 && gy < WORLD_HEIGHT) {
                    if (world[gx]?.[gy] === IDS.GRASS || world[gx]?.[gy] === IDS.SHORT_GRASS) {
                        this.isSheared = false;
                        this.eatAnim = 35;
                        for (let p = 0; p < 10; p++) particles.push(new Particle(this.x + this.width / 2, this.y + this.height - 4, '#35b042'));
                    }
                }
            }
        }

        takeDamage(amount, knockbackDir) {
            if (this.damageCooldown > 0) return;
            this.health -= amount;
            this.damageCooldown = 15;
            this.vy = -3.5;
            this.vx = knockbackDir * 6;
            this.panic = true;
            this.panicTimer = 180;
            this.dir = knockbackDir || (Math.random() > 0.5 ? 1 : -1);
            for (let i = 0; i < 6; i++) particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ffffff'));
            for (let i = 0; i < 3; i++) particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#e2b49a'));
            floatingTexts.push(new FloatingText(this.x + this.width / 2, this.y - 10, amount, '#ffcc00'));
        }

        draw(ctx, camX, camY) {
            const drawX = this.x - camX;
            const drawY = this.y - camY;
            const w = this.width;
            const h = this.height;

            if (advancedGraphics) {
                ctx.drawImage(cachedShadowCanvas, drawX + w / 2 - w / 2.2, drawY + h - 6, w * (2 / 2.2), 8);
            }

            ctx.save();
            ctx.translate(drawX + w / 2, drawY + h / 2);
            if (this.dir < 0) ctx.scale(-1, 1);

            const isMoving = Math.abs(this.vx) > 0.05;
            const walk = this.walkAnimTime || 0;
            const idle = Math.sin((frameCount + this.idleSeed) * 0.06);
            const isBlinking = ((frameCount + Math.floor(this.idleSeed)) % 210 < 8);
            const isGrazing = this.eatAnim > 0;
            const headDip = isGrazing ? 5 : 0;
            const bodyBob = isMoving ? Math.abs(Math.sin(walk * 2)) * 1.2 : idle * 0.6;

            const isDamaged = this.damageCooldown > 0;
            const woolWhite = isDamaged ? '#ff9999' : '#ffffff';
            const woolShade = isDamaged ? '#ff6666' : '#e2e8f0';
            const woolDark = isDamaged ? '#cc3333' : '#cbd5e1';
            const skinBase = isDamaged ? '#ff8080' : '#e2b49a';
            const skinLight = isDamaged ? '#ffaaaa' : '#f5d0b5';
            const skinShade = isDamaged ? '#b91c1c' : '#c58f72';
            const hoofColor = isDamaged ? '#450a0a' : '#44352b';
            const earPink = isDamaged ? '#cc0000' : '#fca5a5';

            const farLegSwing = isMoving ? Math.sin(walk) * 3 : 0;
            const nearLegSwing = isMoving ? -Math.sin(walk) * 3 : 0;
            const farLegLift = (isMoving && Math.sin(walk) > 0) ? Math.sin(walk) * 1.5 : 0;
            const nearLegLift = (isMoving && -Math.sin(walk) > 0) ? -Math.sin(walk) * 1.5 : 0;

            // 1. Far Legs (Back and Front)
            ctx.fillStyle = isDamaged ? '#b91c1c' : (this.isSheared ? skinShade : skinBase);
            ctx.fillRect(-w * 0.42 + farLegSwing, h * 0.16 - farLegLift, w * 0.15, h * 0.34);
            ctx.fillRect(w * 0.08 - farLegSwing, h * 0.16 - nearLegLift, w * 0.15, h * 0.34);
            // Far Hooves
            ctx.fillStyle = hoofColor;
            ctx.fillRect(-w * 0.42 + farLegSwing, h * 0.5 - 2 - farLegLift, w * 0.15, 3);
            ctx.fillRect(w * 0.08 - farLegSwing, h * 0.5 - 2 - nearLegLift, w * 0.15, 3);

            // 2. Body (Sheared vs Unsheared)
            if (this.isSheared) {
                // Trimmed skin body
                ctx.fillStyle = skinLight;
                ctx.fillRect(-w * 0.48, -h * 0.36 + bodyBob, w * 0.65, h * 0.54);
                ctx.fillStyle = skinShade;
                ctx.fillRect(-w * 0.48, h * 0.12 + bodyBob, w * 0.65, 3);
                // Fleece stubble tufts
                ctx.fillStyle = woolWhite;
                ctx.fillRect(-w * 0.44, -h * 0.36 + bodyBob, 4, 3);
                ctx.fillRect(-w * 0.25, -h * 0.34 + bodyBob, 5, 3);
                ctx.fillRect(-w * 0.08, -h * 0.36 + bodyBob, 4, 3);
                ctx.fillRect(-w * 0.34, -h * 0.12 + bodyBob, 4, 2.5);
                ctx.fillRect(-w * 0.15, -h * 0.08 + bodyBob, 4, 2.5);
            } else {
                // Fluffy Cloud Wool Mounds!
                ctx.fillStyle = woolWhite;
                ctx.fillRect(-w * 0.5, -h * 0.46 + bodyBob, w * 0.72, h * 0.66);
                // Cloud scalloped top bumps
                ctx.fillRect(-w * 0.46, -h * 0.52 + bodyBob, w * 0.22, h * 0.1);
                ctx.fillRect(-w * 0.20, -h * 0.54 + bodyBob, w * 0.24, h * 0.12);
                ctx.fillRect(w * 0.06, -h * 0.50 + bodyBob, w * 0.16, h * 0.1);
                // Cloud scalloped back bump
                ctx.fillRect(-w * 0.54, -h * 0.38 + bodyBob, w * 0.08, h * 0.44);
                // Cloud shading & creases
                ctx.fillStyle = woolShade;
                ctx.fillRect(-w * 0.5, h * 0.14 + bodyBob, w * 0.72, 4);
                ctx.fillStyle = woolDark;
                ctx.fillRect(-w * 0.24, -h * 0.44 + bodyBob, 2, h * 0.4);
                ctx.fillRect(0, -h * 0.40 + bodyBob, 2, h * 0.4);
            }

            // 3. Head & Face
            const headBob = bodyBob * 0.7 + headDip;
            ctx.fillStyle = skinBase;
            ctx.fillRect(w * 0.12, -h * 0.42 + headBob, w * 0.36, h * 0.56);
            ctx.fillStyle = skinLight;
            ctx.fillRect(w * 0.14, -h * 0.42 + headBob, w * 0.32, 3);
            ctx.fillStyle = skinShade;
            ctx.fillRect(w * 0.12, h * 0.10 + headBob, w * 0.36, 2);

            // Wool Cap on Head (if not sheared)
            if (!this.isSheared) {
                ctx.fillStyle = woolWhite;
                ctx.fillRect(w * 0.10, -h * 0.54 + headBob, w * 0.38, 5);
                ctx.fillRect(w * 0.14, -h * 0.60 + headBob, w * 0.28, 4);
                ctx.fillStyle = woolShade;
                ctx.fillRect(w * 0.10, -h * 0.46 + headBob, w * 0.38, 2);
            }

            // Floppy Ears
            const earSway = Math.sin(frameCount * 0.1) * 0.8;
            ctx.fillStyle = skinShade;
            ctx.fillRect(w * 0.18, -h * 0.38 + headBob + earSway, 3, 5);
            ctx.fillRect(w * 0.15, -h * 0.34 + headBob + earSway, 3, 6);
            ctx.fillStyle = earPink;
            ctx.fillRect(w * 0.16, -h * 0.32 + headBob + earSway, 1.5, 4);

            // Muzzle / Mouth (chewing when grazing)
            const chewOffset = (isGrazing && frameCount % 6 < 3) ? 1 : 0;
            ctx.fillStyle = skinShade;
            ctx.fillRect(w * 0.36 + chewOffset, -h * 0.12 + headBob, w * 0.14, 4);
            ctx.fillStyle = hoofColor;
            ctx.fillRect(w * 0.46 + chewOffset, -h * 0.08 + headBob, 2, 2);

            // Eye
            if (isBlinking) {
                ctx.fillStyle = hoofColor;
                ctx.fillRect(w * 0.28, -h * 0.24 + headBob, 3, 1.5);
            } else {
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(w * 0.28, -h * 0.28 + headBob, 3.5, 3.5);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(w * 0.28, -h * 0.28 + headBob, 1.5, 1.5);
            }

            // 4. Near Legs (Back and Front)
            ctx.fillStyle = isDamaged ? '#ff4d4d' : skinLight;
            ctx.fillRect(-w * 0.28 + nearLegSwing, h * 0.18 - nearLegLift, w * 0.15, h * 0.32);
            ctx.fillRect(w * 0.22 + farLegSwing, h * 0.18 - farLegLift, w * 0.15, h * 0.32);
            // Wool Cuffs above hooves (if not sheared)
            if (!this.isSheared) {
                ctx.fillStyle = woolWhite;
                ctx.fillRect(-w * 0.30 + nearLegSwing, h * 0.34 - nearLegLift, w * 0.19, 3);
                ctx.fillRect(w * 0.20 + farLegSwing, h * 0.34 - farLegLift, w * 0.19, 3);
            }
            // Near Hooves
            ctx.fillStyle = hoofColor;
            ctx.fillRect(-w * 0.28 + nearLegSwing, h * 0.5 - 2 - nearLegLift, w * 0.15, 3);
            ctx.fillRect(w * 0.22 + farLegSwing, h * 0.5 - 2 - farLegLift, w * 0.15, 3);

            ctx.restore();
        }
    }

    export class Cow extends Animal {
        constructor(x, y) {
            super(x, y, TILE_SIZE * 0.95, TILE_SIZE * 0.75, 10, MOVE_SPEED * 0.22);
        }

        isTemptedBy(itemId) {
            return itemId === IDS.WHEAT;
        }

        update() {
            this.updateAnimalAI();
        }

        takeDamage(amt, knockbackDir) {
            if (this.damageCooldown > 0) return;
            this.health -= amt;
            this.damageCooldown = 15;
            this.vy = -3.5;
            this.vx = knockbackDir * 5;
            this.panic = true;
            this.panicTimer = 180;
            this.dir = knockbackDir || (Math.random() > 0.5 ? 1 : -1);
            for (let i = 0; i < 5; i++) particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#451a03'));
            for (let i = 0; i < 4; i++) particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#f8fafc'));
            floatingTexts.push(new FloatingText(this.x + this.width / 2, this.y - 10, amt, "#ffcc00"));
        }

        draw(ctx, camX, camY) {
            const drawX = this.x - camX;
            const drawY = this.y - camY;
            const w = this.width;
            const h = this.height;

            if (advancedGraphics) {
                ctx.drawImage(cachedShadowCanvas, drawX + w / 2 - w / 2.2, drawY + h - 6, w * (2 / 2.2), 8);
            }

            ctx.save();
            ctx.translate(drawX + w / 2, drawY + h / 2);
            if (this.dir < 0) ctx.scale(-1, 1);

            const isMoving = Math.abs(this.vx) > 0.05;
            const walk = this.walkAnimTime || 0;
            const idle = Math.sin((frameCount + this.idleSeed) * 0.07);
            const bodyBob = isMoving ? Math.abs(Math.sin(walk * 2)) * 1.2 : idle * 0.6;
            const isBlinking = ((frameCount + Math.floor(this.idleSeed)) % 220 < 8);

            const isDamaged = this.damageCooldown > 0;
            const hideWhite = isDamaged ? '#ff9999' : '#f8fafc';
            const hideHighlight = isDamaged ? '#ffcccc' : '#ffffff';
            const hideShade = isDamaged ? '#ff6666' : '#cbd5e1';
            const spotBlack = isDamaged ? '#660000' : '#27272a';
            const spotOutline = isDamaged ? '#400000' : '#18181b';
            const hoofDark = isDamaged ? '#330000' : '#18181b';
            const hoofLight = isDamaged ? '#550000' : '#27272a';
            const muzzlePink = isDamaged ? '#ff8080' : '#fbcfe8';
            const muzzleHigh = isDamaged ? '#ffaaaa' : '#ffe4e6';
            const nostrilDark = isDamaged ? '#990000' : '#9f1239';
            const udderPink = isDamaged ? '#ff8080' : '#fbcfe8';
            const teatPink = isDamaged ? '#cc0000' : '#f43f5e';
            const hornIvory = isDamaged ? '#ffcc80' : '#fef08a';
            const hornBase = isDamaged ? '#d97706' : '#ca8a04';

            const farLegSwing = isMoving ? Math.sin(walk) * 3 : 0;
            const nearLegSwing = isMoving ? -Math.sin(walk) * 3 : 0;
            const farLegLift = (isMoving && Math.sin(walk) > 0) ? Math.sin(walk) * 1.5 : 0;
            const nearLegLift = (isMoving && -Math.sin(walk) > 0) ? -Math.sin(walk) * 1.5 : 0;

            // 1. Far Legs (Back and Front)
            ctx.fillStyle = hideShade;
            ctx.fillRect(-w * 0.44 + farLegSwing, h * 0.15 - farLegLift, w * 0.16, h * 0.35);
            ctx.fillRect(w * 0.08 - farLegSwing, h * 0.15 - nearLegLift, w * 0.16, h * 0.35);
            // Black spot on far back leg
            ctx.fillStyle = spotOutline;
            ctx.fillRect(-w * 0.44 + farLegSwing, h * 0.20 - farLegLift, w * 0.16, 4);
            // Far Hooves
            ctx.fillStyle = hoofDark;
            ctx.fillRect(-w * 0.44 + farLegSwing, h * 0.5 - 2 - farLegLift, w * 0.16, 3);
            ctx.fillRect(w * 0.08 - farLegSwing, h * 0.5 - 2 - nearLegLift, w * 0.16, 3);

            // 2. Udder (underneath body between hind legs)
            ctx.fillStyle = udderPink;
            ctx.fillRect(-w * 0.22, h * 0.12 + bodyBob, w * 0.16, 4);
            ctx.fillStyle = teatPink;
            ctx.fillRect(-w * 0.20, h * 0.12 + bodyBob + 4, 2, 2.5);
            ctx.fillRect(-w * 0.10, h * 0.12 + bodyBob + 4, 2, 2.5);

            // 3. Swishing Tail (Back)
            const tailSwish = Math.sin(frameCount * (this.panic ? 0.5 : 0.12) + this.idleSeed) * 0.3;
            ctx.save();
            ctx.translate(-w * 0.48, -h * 0.24 + bodyBob);
            ctx.rotate(tailSwish);
            ctx.fillStyle = hideWhite;
            ctx.fillRect(-2, 0, 2.5, h * 0.38);
            // Black tassel tuft
            ctx.fillStyle = spotBlack;
            ctx.fillRect(-3.5, h * 0.34, 5, 5);
            ctx.restore();

            // 4. Torso / Body
            ctx.fillStyle = hideWhite;
            ctx.fillRect(-w * 0.48, -h * 0.48 + bodyBob, w * 0.70, h * 0.68);
            // Top Highlight Stripe
            ctx.fillStyle = hideHighlight;
            ctx.fillRect(-w * 0.46, -h * 0.48 + bodyBob, w * 0.66, 3);
            // Belly Shadow
            ctx.fillStyle = hideShade;
            ctx.fillRect(-w * 0.48, h * 0.14 + bodyBob, w * 0.70, 3);

            // Organic Black Cow Spots on Torso
            ctx.fillStyle = spotBlack;
            // Main flank spot
            ctx.fillRect(-w * 0.28, -h * 0.48 + bodyBob, w * 0.26, h * 0.45);
            ctx.fillRect(-w * 0.34, -h * 0.40 + bodyBob, w * 0.12, h * 0.30);
            ctx.fillRect(-w * 0.14, -h * 0.44 + bodyBob, w * 0.14, h * 0.36);
            // Hind patch
            ctx.fillRect(-w * 0.48, -h * 0.38 + bodyBob, w * 0.12, h * 0.28);
            ctx.fillRect(-w * 0.48, -h * 0.48 + bodyBob, w * 0.16, 4);

            // 5. Head & Neck
            const headBob = bodyBob * 0.75;
            ctx.fillStyle = hideWhite;
            ctx.fillRect(w * 0.10, -h * 0.52 + headBob, w * 0.38, h * 0.62);
            ctx.fillStyle = hideHighlight;
            ctx.fillRect(w * 0.12, -h * 0.52 + headBob, w * 0.34, 3);
            ctx.fillStyle = hideShade;
            ctx.fillRect(w * 0.10, h * 0.06 + headBob, w * 0.38, 2);

            // Black patch over eye / head
            ctx.fillStyle = spotBlack;
            ctx.fillRect(w * 0.10, -h * 0.52 + headBob, w * 0.20, h * 0.36);
            ctx.fillRect(w * 0.22, -h * 0.42 + headBob, w * 0.14, h * 0.22);

            // Ivory Horns on top of head
            ctx.fillStyle = hornBase;
            ctx.fillRect(w * 0.18, -h * 0.52 - 3 + headBob, 3.5, 3);
            ctx.fillRect(w * 0.28, -h * 0.52 - 3 + headBob, 3.5, 3);
            ctx.fillStyle = hornIvory;
            ctx.fillRect(w * 0.16, -h * 0.52 - 6 + headBob, 3, 3);
            ctx.fillRect(w * 0.30, -h * 0.52 - 6 + headBob, 3, 3);

            // Floppy Cow Ears (lateral droop with twitch)
            const earTwitch = Math.sin(frameCount * 0.08) * 0.8;
            ctx.fillStyle = hideWhite;
            ctx.fillRect(w * 0.06, -h * 0.40 + headBob + earTwitch, 4, 4);
            ctx.fillRect(w * 0.04, -h * 0.36 + headBob + earTwitch, 4, 4);
            ctx.fillStyle = muzzlePink;
            ctx.fillRect(w * 0.05, -h * 0.36 + headBob + earTwitch, 2.5, 3);

            // Large Soulful Cow Eye
            if (isBlinking) {
                ctx.fillStyle = hoofDark;
                ctx.fillRect(w * 0.26, -h * 0.26 + headBob, 4.5, 1.5);
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(w * 0.25, -h * 0.30 + headBob, 5, 4.5);
                ctx.fillStyle = '#1e1b4b';
                ctx.fillRect(w * 0.28, -h * 0.30 + headBob, 3, 4.5);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(w * 0.26, -h * 0.30 + headBob, 1.5, 1.5);
            }

            // Muzzle / Snout (with gentle cud-chewing motion when idle)
            const cudChew = (!isMoving && frameCount % 60 < 22) ? Math.sin(frameCount * 0.4) * 1 : 0;
            ctx.fillStyle = muzzlePink;
            ctx.fillRect(w * 0.38, -h * 0.20 + headBob + cudChew, w * 0.18, h * 0.34);
            ctx.fillStyle = muzzleHigh;
            ctx.fillRect(w * 0.38, -h * 0.20 + headBob + cudChew, w * 0.18, 2);
            // Nostrils
            ctx.fillStyle = nostrilDark;
            ctx.fillRect(w * 0.50, -h * 0.12 + headBob + cudChew, 2.5, 2.5);
            ctx.fillRect(w * 0.50, -h * 0.02 + headBob + cudChew, 2.5, 2.5);

            // 6. Near Legs (Back and Front)
            ctx.fillStyle = hideWhite;
            ctx.fillRect(-w * 0.30 + nearLegSwing, h * 0.18 - nearLegLift, w * 0.16, h * 0.32);
            ctx.fillRect(w * 0.22 + farLegSwing, h * 0.18 - farLegLift, w * 0.16, h * 0.32);
            // Spot on near front leg
            ctx.fillStyle = spotBlack;
            ctx.fillRect(w * 0.22 + farLegSwing, h * 0.24 - farLegLift, w * 0.16, 4);
            // Near Hooves
            ctx.fillStyle = hoofLight;
            ctx.fillRect(-w * 0.30 + nearLegSwing, h * 0.5 - 2 - nearLegLift, w * 0.16, 3);
            ctx.fillRect(w * 0.22 + farLegSwing, h * 0.5 - 2 - farLegLift, w * 0.16, 3);

            ctx.restore();
        }
    }

    export class Creeper extends PhysicsEntity {
        constructor(x, y) {
            super(x, y, TILE_SIZE * 0.75, TILE_SIZE * 1.8);
            this.health = 20; this.damageCooldown = 0;
            this.speed = MOVE_SPEED * 0.35; this.swell = 0; this.facingRight = true;
        }

        update() {
            if (this.damageCooldown > 0) this.damageCooldown--;
            if (this.health <= 0) return;

            let target = getMobTarget(this);
            if (target) {
                let dx = (target.x + target.width / 2) - (this.x + this.width / 2);
                let dy = (target.y + target.height / 2) - (this.y + this.height / 2);
                let distToTarget = Math.hypot(dx, dy);

                // Only explode if physically close in BOTH horizontal and vertical dimensions (true 2D distance < 2.8 tiles, and |dy| < 2.5 tiles)
                if (distToTarget < TILE_SIZE * 2.8 && Math.abs(dy) < TILE_SIZE * 2.5) {
                    this.vx = 0;
                    this.swell++;
                    if (frameCount % 8 === 0) particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ffffff'));
                    if (this.swell >= 90) this.explode();
                } else if (distToTarget < TILE_SIZE * 16 && Math.abs(dy) < TILE_SIZE * 8) {
                    this.swell = Math.max(0, this.swell - 1);
                    if (dx > 4) { this.vx = this.speed; this.facingRight = true; }
                    else if (dx < -4) { this.vx = -this.speed; this.facingRight = false; }
                    else { this.vx = 0; }
                    this.checkObstacleJump();
                } else {
                    this.vx = 0;
                    this.swell = Math.max(0, this.swell - 1);
                }
            } else {
                this.vx = 0;
                this.swell = Math.max(0, this.swell - 1);
            }
            
            this.applyPhysics();
        }

        explode() {
            this.health = 0;
            let cx = Math.floor((this.x + this.width/2) / TILE_SIZE);
            let cy = Math.floor((this.y + this.height/2) / TILE_SIZE);
            let radius = 4;

            const clearExplosionCell = (gx, gy) => {
                if (gx < 0 || gx >= WORLD_WIDTH || gy < 0 || gy >= WORLD_HEIGHT || world[gx][gy] === IDS.AIR) return;
                const blockId = world[gx][gy];
                for(let i=0; i<2; i++) particles.push(new Particle(gx*TILE_SIZE+TILE_SIZE/2, gy*TILE_SIZE+TILE_SIZE/2, getBlockColor(blockId)));
                removeFluid(gx, gy);
                world[gx][gy] = IDS.AIR;
                wakeFluidsAround(gx, gy);
                syncBlock(gx, gy, IDS.AIR);
                checkSandFallAbove(gx, gy);
                dirtToGrassQueue.delete(`${gx}_${gy}`);
                if (blockId === IDS.SNOW) scheduleSnowRegrowth(gx, gy);
                if (world[gx]?.[gy + 1] === IDS.DIRT) scheduleDirtToGrass(gx, gy + 1);
                if (isDoorBlock(blockId)) {
                    const pairedY = getDoorBaseY(gy, blockId) === gy ? gy - 1 : gy + 1;
                    clearExplosionCell(gx, pairedY);
                }
            };
            
            for(let dx = -radius; dx <= radius; dx++) {
                for(let dy = -radius; dy <= radius; dy++) {
                    if (dx*dx + dy*dy <= radius*radius) {
                        let gx = cx + dx; let gy = cy + dy;
                        clearExplosionCell(gx, gy);
                    }
                }
            }
            
            for(let i=0; i<30; i++) particles.push(new Particle(this.x+this.width/2, this.y+this.height/2, '#ffffff'));
            for(let i=0; i<30; i++) particles.push(new Particle(this.x+this.width/2, this.y+this.height/2, '#ff6600'));
            
            // Damage local player if in blast radius
            let distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
            if (distToPlayer < radius * TILE_SIZE * 1.5 && !player.isDead) {
                player.takeDamage(12);
                player.vx = (player.x > this.x ? 10 : -10);
                player.vy = -8;
            }

            // Damage remote players in multiplayer
            if (isMultiplayer && isMultiplayerAuthority()) {
                Object.entries(remotePlayers).forEach(([id, rp]) => {
                    if (rp.isDead) return;
                    let dist = Math.hypot(rp.x - this.x, rp.y - this.y);
                    if (dist < radius * TILE_SIZE * 1.5) {
                        damageRemotePlayer(id, 12);
                    }
                });
            }
        }

        takeDamage(amt, knockbackDir) {
            this.applyMobDamage(amt, knockbackDir, '#4CAF50');
        }

        draw(ctx, camX, camY) {
            if (this.health <= 0) return;
            const drawX = this.x - camX; const drawY = this.y - camY;
            const w = this.width; const h = this.height;

            if (advancedGraphics) {
                ctx.drawImage(cachedShadowCanvas, drawX + w/2 - w/2.2, drawY + h - 6, w * (2/2.2), 8);
            }
            
            ctx.save();
            ctx.translate(drawX + w/2, drawY + h);
            let swellScale = 1 + (this.swell / 90) * 0.30;
            ctx.scale(swellScale, 1 + (this.swell / 90) * 0.15);
            if (!this.facingRight) ctx.scale(-1, 1);
            ctx.translate(-w/2, -h);

            const isFlashing = (this.damageCooldown > 0) || (this.swell > 0 && Math.floor(frameCount / (this.swell > 55 ? 3 : 6)) % 2 === 0);
            const baseGreen = isFlashing ? '#ffffff' : '#52b038';
            const darkGreen = isFlashing ? '#e0e0e0' : '#327820';
            const deepGreen = isFlashing ? '#c8c8c8' : '#225814';
            const lightGreen = isFlashing ? '#ffffff' : '#7adc56';
            const faceBlack = isFlashing ? '#333333' : '#111a0d';

            // 1. HEAD (square 26x22)
            const headX = (w - 26) / 2;
            const headY = 0;
            const headW = 26;
            const headH = 22;

            ctx.fillStyle = baseGreen;
            ctx.fillRect(headX, headY, headW, headH);

            // Mottled head noise pixels
            ctx.fillStyle = lightGreen;
            ctx.fillRect(headX + 2, headY + 2, 4, 4);
            ctx.fillRect(headX + 20, headY + 1, 4, 3);
            ctx.fillRect(headX + 1, headY + 16, 4, 4);
            ctx.fillStyle = darkGreen;
            ctx.fillRect(headX + 7, headY + 1, 4, 3);
            ctx.fillRect(headX + 16, headY + 17, 5, 4);
            ctx.fillRect(headX + 1, headY + 7, 3, 4);
            ctx.fillStyle = deepGreen;
            ctx.fillRect(headX + 21, headY + 8, 4, 4);

            // Iconic Creeper Face
            ctx.fillStyle = faceBlack;
            // Eyes
            ctx.fillRect(headX + 4, headY + 6, 5, 5);
            ctx.fillRect(headX + 17, headY + 6, 5, 5);
            // Nose
            ctx.fillRect(headX + 10, headY + 11, 6, 5);
            // Mouth droop & mustache
            ctx.fillRect(headX + 7, headY + 13, 3, 8);
            ctx.fillRect(headX + 16, headY + 13, 3, 8);
            ctx.fillRect(headX + 10, headY + 16, 6, 3);

            // 2. TORSO (20x32)
            const bodyX = (w - 20) / 2;
            const bodyY = 22;
            const bodyW = 20;
            const bodyH = 32;

            ctx.fillStyle = baseGreen;
            ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

            // Mottled body pixels
            ctx.fillStyle = darkGreen;
            ctx.fillRect(bodyX + 2, bodyY + 3, 5, 6);
            ctx.fillRect(bodyX + 12, bodyY + 8, 6, 7);
            ctx.fillRect(bodyX + 3, bodyY + 20, 6, 6);
            ctx.fillRect(bodyX + 13, bodyY + 23, 5, 6);
            ctx.fillStyle = lightGreen;
            ctx.fillRect(bodyX + 10, bodyY + 2, 6, 5);
            ctx.fillRect(bodyX + 1, bodyY + 11, 6, 6);
            ctx.fillRect(bodyX + 11, bodyY + 16, 5, 5);
            ctx.fillRect(bodyX + 4, bodyY + 27, 4, 4);
            ctx.fillStyle = deepGreen;
            ctx.fillRect(bodyX + 8, bodyY + 10, 3, 4);
            ctx.fillRect(bodyX + 1, bodyY + 24, 3, 4);

            // 3. SHORT STUBBY LEGS (18px high)
            const legSwing = (this.vx !== 0) ? Math.sin(frameCount * 0.35) * 3 : 0;
            const legH = 18;
            const legW = 10;

            // Back / Secondary feet
            ctx.fillStyle = deepGreen;
            ctx.fillRect(bodyX + 1 - legSwing * 0.6, 54, legW, legH - 2);
            ctx.fillRect(bodyX + bodyW - legW - 1 + legSwing * 0.6, 54, legW, legH - 2);

            // Front Left Foot
            ctx.fillStyle = baseGreen;
            ctx.fillRect(bodyX - 1 + legSwing, 54, legW, legH);
            ctx.fillStyle = darkGreen;
            ctx.fillRect(bodyX - 1 + legSwing, 54 + legH - 4, legW, 4);
            ctx.fillStyle = lightGreen;
            ctx.fillRect(bodyX + legSwing, 56, 3, 4);

            // Front Right Foot
            ctx.fillStyle = baseGreen;
            ctx.fillRect(bodyX + bodyW - legW + 1 - legSwing, 54, legW, legH);
            ctx.fillStyle = darkGreen;
            ctx.fillRect(bodyX + bodyW - legW + 1 - legSwing, 54 + legH - 4, legW, 4);
            ctx.fillStyle = lightGreen;
            ctx.fillRect(bodyX + bodyW - 3 - legSwing, 56, 3, 4);

            ctx.restore();
        }
    }

    export class Scorpion extends PhysicsEntity {
        constructor(x, y) {
            super(x, y, TILE_SIZE * 0.85, TILE_SIZE * 0.5);
            this.health = 8;
            this.damageCooldown = 0;
            this.speed = MOVE_SPEED * 0.52;
            this.damage = 1;
            this.facingRight = true;
            this.attackCooldown = 0;
            this.tailStrikeTime = 0;
            this.walkAnimTime = 0;
        }

        update() {
            if (this.damageCooldown > 0) this.damageCooldown--;
            if (this.attackCooldown > 0) this.attackCooldown--;
            if (this.tailStrikeTime > 0) this.tailStrikeTime--;

            let target = getMobTarget(this);
            if (target) {
                let distToPlayer = (target.x + target.width / 2) - (this.x + this.width / 2);
                let absDist = Math.abs(distToPlayer);

                if (absDist < TILE_SIZE * 15) {
                    if (distToPlayer > 6) {
                        this.vx = this.speed;
                        this.facingRight = true;
                        this.walkAnimTime += 0.25;
                    } else if (distToPlayer < -6) {
                        this.vx = -this.speed;
                        this.facingRight = false;
                        this.walkAnimTime += 0.25;
                    } else {
                        this.vx = 0;
                    }

                    this.checkObstacleJump();

                    // Tail Stinger Attack
                    if (absDist < TILE_SIZE * 1.35 && Math.abs((target.y + target.height / 2) - (this.y + this.height / 2)) < TILE_SIZE * 1.3) {
                        if (this.attackCooldown <= 0) {
                            this.attackCooldown = 55;
                            this.tailStrikeTime = 18;
                            playSound('hurt');

                            for (let i = 0; i < 6; i++) {
                                particles.push(new Particle(this.x + this.width / 2, this.y - 2, '#4ade80'));
                            }

                            if (target.isRemote) {
                                damageRemotePlayer(target.id, this.damage, true);
                            } else {
                                player.takeDamage(this.damage);
                                player.poisonTimer = 360; // 6 seconds poison duration
                                updateHealthUI();
                            }
                        }
                    }
                } else {
                    this.vx = 0;
                }
            } else {
                this.vx = 0;
            }

            this.applyPhysics();
        }

        takeDamage(amt, knockbackDir) {
            if (this.applyMobDamage(amt, knockbackDir || (this.facingRight ? -1 : 1), '#c28435')) {
                if (this.health <= 0) {
                    if (Math.random() < 0.6) dropItemForWorld(IDS.BONE, this.x + this.width / 2, this.y + this.height / 2, 1);
                }
            }
        }

        draw(ctx, camX, camY) {
            if (this.health <= 0) return;
            const drawX = Math.round(this.x - camX);
            const drawY = Math.round(this.y - camY);
            const w = this.width;
            const h = this.height;

            if (advancedGraphics) {
                ctx.drawImage(cachedShadowCanvas, drawX + w / 2 - w / 2.2, drawY + h - 4, w * (2 / 2.2), 6);
            }

            ctx.save();
            if (this.damageCooldown > 0) ctx.globalAlpha = 0.6;

            const isRight = this.facingRight;
            const legWiggle = Math.sin(this.walkAnimTime) * 2.5;
            const strikeProgress = this.tailStrikeTime > 0 ? (this.tailStrikeTime / 18) : 0;
            const tailWhipOffset = Math.sin(strikeProgress * Math.PI) * 10;
            const strikeDir = isRight ? 1 : -1;
            const tailDir = isRight ? -1 : 1;

            // 1. Legs (6 skittering legs underneath)
            ctx.fillStyle = '#683b10';
            for (let i = 0; i < 3; i++) {
                let legX = drawX + (isRight ? 6 + i * 6 : w - 8 - i * 6);
                let legOffset = (i % 2 === 0 ? legWiggle : -legWiggle);
                ctx.fillRect(legX, drawY + h - 4 + legOffset, 2, 4 - legOffset);
            }

            // 2. Chitin Main Body
            ctx.fillStyle = '#c28435'; // Amber desert carapace
            ctx.fillRect(drawX + 4, drawY + 4, w - 8, h - 6);

            // Chitin segment lines
            ctx.fillStyle = '#92581f';
            ctx.fillRect(drawX + 8, drawY + 5, 2, h - 8);
            ctx.fillRect(drawX + 14, drawY + 5, 2, h - 8);

            // 3. Head & Eyes
            const headX = isRight ? drawX + w - 7 : drawX + 1;
            ctx.fillStyle = '#683b10';
            ctx.fillRect(headX, drawY + 4, 6, 6);
            ctx.fillStyle = '#111111'; // Dark eyes
            ctx.fillRect(isRight ? headX + 4 : headX + 1, drawY + 5, 1.5, 1.5);

            // 4. Front Pincers
            ctx.fillStyle = '#92581f';
            if (isRight) {
                ctx.fillRect(drawX + w - 3, drawY + 3, 5, 2.5);
                ctx.fillRect(drawX + w + 1, drawY + 1, 2, 2);
                ctx.fillRect(drawX + w + 1, drawY + 5, 2, 2);
            } else {
                ctx.fillRect(drawX - 2, drawY + 3, 5, 2.5);
                ctx.fillRect(drawX - 3, drawY + 1, 2, 2);
                ctx.fillRect(drawX - 3, drawY + 5, 2, 2);
            }

            // 5. Arched Tail & Poison Stinger in the back
            const tailBaseX = isRight ? drawX + 2 : drawX + w - 4;

            // Tail segment 1 (base)
            ctx.fillStyle = '#92581f';
            ctx.fillRect(tailBaseX + (tailDir * 2), drawY + 2 - (tailWhipOffset * 0.3), 3, 4);

            // Tail segment 2 (mid curve)
            ctx.fillStyle = '#c28435';
            ctx.fillRect(tailBaseX + (tailDir * 4) + (strikeDir * tailWhipOffset * 0.6), drawY - 2 - (tailWhipOffset * 0.6), 3.5, 3.5);

            // Tail segment 3 (top arch)
            ctx.fillRect(tailBaseX + (tailDir * 2) + (strikeDir * tailWhipOffset * 1.1), drawY - 6 - (tailWhipOffset * 0.8), 3.5, 3.5);

            // Stinger bulb
            ctx.fillStyle = '#451a03';
            ctx.fillRect(tailBaseX + (strikeDir * tailWhipOffset * 1.4), drawY - 8 - (tailWhipOffset * 0.5), 3, 3);

            // Glowing venom stinger tip
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(tailBaseX + (isRight ? 3 : -2) + (strikeDir * tailWhipOffset * 1.6), drawY - 7 - (tailWhipOffset * 0.5), 2, 2);

            // Red damage flash
            if (this.damageCooldown > 0) {
                ctx.fillStyle = 'rgba(255, 60, 60, 0.45)';
                ctx.fillRect(drawX - 2, drawY - 8, w + 4, h + 10);
            }

            ctx.restore();
        }
    }

    export let kaelSkinCanvas = null;
    export function getKaelSkinCanvas() {
        if (kaelSkinCanvas) return kaelSkinCanvas;
        if (typeof document === 'undefined') return null;
        const c = document.createElement('canvas');
        c.width = 16;
        c.height = 32;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const p = (x, y, col) => {
            ctx.fillStyle = col;
            ctx.fillRect(x, y, 1, 1);
        };
        const rect = (x, y, w, h, col) => {
            ctx.fillStyle = col;
            ctx.fillRect(x, y, w, h);
        };

        // --- 1. HEAD (8x8 at x: 4, y: 0) - Human face matching player build ---
        // Base human skin
        rect(4, 0, 8, 8, '#e8b188');
        // Facial shading & jawline
        rect(4, 6, 8, 2, '#dba075');
        rect(6, 7, 4, 1, '#c68b59');
        // Windswept dark chestnut traveler hair
        rect(4, 0, 8, 2, '#4a2e1b');
        p(4, 2, '#4a2e1b'); p(11, 2, '#4a2e1b');
        p(5, 2, '#6e4428'); // Hair highlight
        p(6, 2, '#4a2e1b'); p(7, 2, '#362012'); // Bangs
        // Explorer brass goggles resting on forehead
        p(6, 1, '#fbbf24'); p(7, 1, '#0284c7'); // Left goggle brass rim & cyan lens
        p(8, 1, '#fbbf24'); p(9, 1, '#0284c7'); // Right goggle
        // Human Eyes (white sclera with celestial cyan iris & dark pupil)
        // Left eye at (5, 4)
        p(5, 4, '#ffffff'); p(6, 4, '#0284c7');
        p(5, 3, '#362012'); // Eyebrow
        // Right eye at (9, 4)
        p(9, 4, '#0284c7'); p(10, 4, '#ffffff');
        p(10, 3, '#362012'); // Eyebrow
        // Nose & mouth
        p(7, 5, '#c68a5f');
        p(7, 6, '#995832'); p(8, 6, '#995832');

        // --- 2. TORSO (8x12 at x: 4, y: 8) ---
        // Celestial indigo tunic base
        rect(4, 8, 8, 12, '#1e1b4b');
        // Open rugged leather traveler vest
        rect(4, 8, 2, 9, '#582d12');
        rect(10, 8, 2, 9, '#582d12');
        p(5, 8, '#783d19'); p(10, 8, '#783d19');
        // Celestial collar / scarf
        rect(6, 8, 4, 2, '#312e81');
        p(7, 9, '#fbbf24'); // Gold celestial star clasp
        // Diagonal leather explorer sash
        p(5, 10, '#451a03'); p(6, 11, '#451a03'); p(7, 12, '#fbbf24'); p(8, 13, '#451a03'); p(9, 14, '#451a03');
        // Sturdy belt with brass buckle
        rect(4, 16, 8, 2, '#2e1102');
        p(7, 16, '#fbbf24'); p(8, 16, '#fbbf24');
        p(5, 17, '#0284c7'); // Astrolabe pouch charm

        // --- 3. FRONT ARM (4x12 at x: 0, y: 8) ---
        // Leather adventurer coat shoulder sleeve
        rect(0, 8, 4, 4, '#582d12');
        p(1, 8, '#783d19');
        // Folded tunic sleeve
        rect(0, 12, 4, 3, '#1e1b4b');
        // Bare human forearm / wrist wrap
        rect(0, 15, 4, 2, '#dba075');
        // Traveler's fingerless glove & hand
        rect(0, 17, 4, 3, '#451a03');
        rect(1, 18, 2, 2, '#e8b188'); // Exposed human fingers

        // --- 4. BACK ARM (4x12 at x: 12, y: 8) ---
        rect(12, 8, 4, 4, '#3d1a08'); // Shadowed shoulder
        rect(12, 12, 4, 3, '#161928'); // Shadowed sleeve
        rect(12, 15, 4, 2, '#c68a5f'); // Forearm
        rect(12, 17, 4, 3, '#2e1102'); // Glove

        // --- 5. FRONT LEG (4x12 at x: 4, y: 20) ---
        // Deep indigo traveler trousers
        rect(4, 20, 4, 6, '#1e2337');
        p(5, 21, '#272f48'); p(6, 23, '#161928');
        // Sturdy laced explorer boots
        rect(4, 26, 4, 6, '#451a03');
        p(5, 27, '#d97706'); p(5, 29, '#d97706'); // Brass lace buckles
        rect(4, 31, 4, 1, '#1e0c01'); // Boot sole

        // --- 6. BACK LEG (4x12 at x: 8, y: 20) ---
        // Shadowed trousers
        rect(8, 20, 4, 6, '#141826');
        // Shadowed boots
        rect(8, 26, 4, 6, '#2e1102');
        p(9, 27, '#b45309'); p(9, 29, '#b45309');
        rect(8, 31, 4, 1, '#130700');

        kaelSkinCanvas = c;
        return kaelSkinCanvas;
    }

    export class AtlasExplorer extends PhysicsEntity {
        constructor(x, y) {
            super(x, y, TILE_SIZE * 0.75, TILE_SIZE * 1.8);
            this.health = 9999;
            this.name = 'Kael, The Atlas Explorer';
            this.title = 'Planar Cartographer';
            this.warpState = 'warping_in'; // 'warping_in', 'active', 'warping_out'
            this.warpProgress = 0.05;
            this.warpInTotalFrames = 200; // ~3.3 seconds (extended cinematic arrival)
            this.warpOutTotalFrames = 150; // ~2.5 seconds (extended departure)
            this.stayTimer = 0;
            this.maxStayDuration = 7200; // ~2 minutes of active stay
            this.isDeparted = false;
            this.facingRight = true;
            this.tetherX = x;
            this.paceTimer = 180;
            this.isPacing = false;
            this.mapReadingTimer = 120;
            this.walkAnimTime = 0;
            this.damageCooldown = 0;
        }

        takeDamage(amt, knockbackDir) {
            // Invincible planar explorer: absorbs all physical attacks with cosmic ripple
            this.spawnPlanarRipple();
            return false;
        }

        spawnPlanarRipple() {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            for (let i = 0; i < 8; i++) {
                const p = new Particle(cx, cy, (i % 2 === 0) ? '#c084fc' : '#38bdf8');
                p.vx = (Math.random() - 0.5) * 4;
                p.vy = (Math.random() - 0.5) * 4;
                particles.push(p);
            }
        }

        interact(interactor) {
            if (typeof window !== 'undefined') {
                if (typeof window.hasPlayerTalkedToKael === 'function' && window.hasPlayerTalkedToKael()) {
                    if (typeof window.openAtlasMarket === 'function') {
                        window.openAtlasMarket(this);
                        return true;
                    }
                } else if (typeof window.openAtlasDialogue === 'function') {
                    window.openAtlasDialogue(this);
                    return true;
                }
            }
            return false;
        }

        update() {
            if (this.isDeparted) return;

            if (this.warpState === 'warping_in') {
                this.warpProgress += (1 / this.warpInTotalFrames);
                if (frameCount % 3 === 0) {
                    const cx = this.x + this.width / 2 + (Math.random() - 0.5) * 28;
                    const cy = this.y + this.height / 2 + (Math.random() - 0.5) * 44;
                    const p = new Particle(cx, cy, (Math.random() > 0.4) ? '#c084fc' : '#38bdf8');
                    p.vy = -0.5 - Math.random() * 0.8;
                    particles.push(p);
                }
                if (this.warpProgress >= 1) {
                    this.warpProgress = 1;
                    this.warpState = 'active';
                }
                return;
            }

            if (this.warpState === 'warping_out') {
                this.warpProgress -= (1 / this.warpOutTotalFrames);
                if (frameCount % 3 === 0) {
                    const cx = this.x + this.width / 2 + (Math.random() - 0.5) * 28;
                    const cy = this.y + this.height / 2 + (Math.random() - 0.5) * 44;
                    const p = new Particle(cx, cy, '#38bdf8');
                    p.vy = -0.6 - Math.random() * 0.8;
                    particles.push(p);
                }
                if (this.warpProgress <= 0) {
                    this.warpProgress = 0;
                    this.isDeparted = true;
                }
                return;
            }

            // Active state
            this.stayTimer++;
            if (this.stayTimer >= this.maxStayDuration) {
                this.warpState = 'warping_out';
                if (typeof playSound === 'function') playSound('portal_warp');
                if (isMultiplayer && isMultiplayerAuthority() && typeof broadcastDataPacket === 'function') {
                    broadcastDataPacket({ type: 'ATLAS_EXPLORER_DEPARTED' });
                }
                return;
            }

            // Ambient planar stardust
            if (frameCount % 24 === 0) {
                const cx = this.x + this.width / 2 + (Math.random() - 0.5) * 16;
                const cy = this.y + this.height - 4;
                const p = new Particle(cx, cy, (Math.random() > 0.4) ? '#c084fc' : '#38bdf8');
                p.vy = -0.8 - Math.random() * 0.6;
                p.vx = (Math.random() - 0.5) * 0.5;
                particles.push(p);
            }

            // Water Buoyancy
            const centerGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const footGy = Math.floor((this.y + this.height - 2) / TILE_SIZE);
            const inWater = (typeof isWater === 'function' && isWater(centerGx, footGy));
            if (inWater) {
                this.vy = Math.min(this.vy, -2.4);
            }

            const curPlayer = (typeof player !== 'undefined') ? player : window.player;
            if (curPlayer) {
                const dx = (curPlayer.x + curPlayer.width / 2) - (this.x + this.width / 2);
                const dy = (curPlayer.y + curPlayer.height / 2) - (this.y + this.height / 2);
                const dist = Math.hypot(dx, dy);

                if (dist < TILE_SIZE * 6) {
                    // Smart gaze & posture towards player
                    this.facingRight = (dx >= 0);
                    this.vx = 0;
                    this.isPacing = false;
                    this.mapReadingTimer = Math.max(0, this.mapReadingTimer - 1);
                } else {
                    // Pacing and map reading cycle
                    this.paceTimer--;
                    if (this.paceTimer <= 0) {
                        if (this.isPacing) {
                            this.isPacing = false;
                            this.vx = 0;
                            this.mapReadingTimer = 160 + Math.floor(Math.random() * 80);
                            this.paceTimer = 220 + Math.floor(Math.random() * 100);
                        } else {
                            this.isPacing = true;
                            // Check distance from tether
                            const distFromTether = this.x - this.tetherX;
                            if (distFromTether > TILE_SIZE * 3) this.facingRight = false;
                            else if (distFromTether < -TILE_SIZE * 3) this.facingRight = true;
                            else this.facingRight = (Math.random() > 0.5);

                            this.vx = this.facingRight ? (MOVE_SPEED * 0.28) : (-MOVE_SPEED * 0.28);
                            this.paceTimer = 120 + Math.floor(Math.random() * 80);
                        }
                    }

                    if (this.isPacing) {
                        this.walkAnimTime += 0.18;
                        this.checkObstacleJump();
                        // Intelligent pathfinding: check front obstacles, drops, hazards
                        const stepDir = this.facingRight ? 1 : -1;
                        const frontGx = Math.floor((this.x + this.width / 2 + stepDir * (this.width / 2 + 5)) / TILE_SIZE);
                        const frontFootGy = Math.floor((this.y + this.height - 4) / TILE_SIZE);
                        const frontHeadGy = Math.floor((this.y + 4) / TILE_SIZE);

                        const activeWorld = (typeof world !== 'undefined' && world) ? world : null;
                        if (activeWorld && frontGx >= 0 && frontGx < activeWorld.length) {
                            const bFoot = activeWorld[frontGx]?.[frontFootGy];
                            const bHead = activeWorld[frontGx]?.[frontHeadGy];
                            const isFootSolid = bFoot !== undefined && isSolidWorldBlock(frontGx, frontFootGy, bFoot);
                            const isHeadSolid = bHead !== undefined && isSolidWorldBlock(frontGx, frontHeadGy, bHead);
                            const isUpperSolid = isSolidWorldBlock(frontGx, frontHeadGy - 1, activeWorld[frontGx]?.[frontHeadGy - 1]);

                            // 1. 2-block high barrier or ceiling block ahead: stop and turn around
                            if (isHeadSolid || (isFootSolid && isUpperSolid)) {
                                this.facingRight = !this.facingRight;
                                this.vx = this.facingRight ? (MOVE_SPEED * 0.28) : (-MOVE_SPEED * 0.28);
                                this.isPacing = false;
                                this.mapReadingTimer = 90;
                                this.paceTimer = 110;
                            } else if (isFootSolid) {
                                // 1-block step up: jump over it smoothly!
                                this.checkObstacleJump();
                            } else {
                                // 2. Check for lethal drop or lava/cactus ahead
                                let dropDist = 0;
                                while (dropDist < 5 && (!isSolidWorldBlock(frontGx, frontFootGy + 1 + dropDist, activeWorld[frontGx]?.[frontFootGy + 1 + dropDist]))) {
                                    dropDist++;
                                }
                                const landingB = activeWorld[frontGx]?.[frontFootGy + 1 + dropDist];
                                const isHazard = (landingB === IDS.LAVA || landingB === IDS.CACTUS || (typeof isWater === 'function' && isWater(frontGx, frontFootGy + 1)));
                                if (dropDist >= 3 || isHazard) {
                                    // Turn around before falling
                                    this.facingRight = !this.facingRight;
                                    this.vx = this.facingRight ? (MOVE_SPEED * 0.28) : (-MOVE_SPEED * 0.28);
                                    this.isPacing = false;
                                    this.mapReadingTimer = 80;
                                    this.paceTimer = 100;
                                }
                            }
                        }
                    } else {
                        this.vx = 0;
                        if (this.mapReadingTimer > 0) this.mapReadingTimer--;
                    }
                }
            }

            const prevX = this.x;
            this.applyPhysics();
            const actualMoved = Math.abs(this.x - prevX);

            // Detect if blocked against a wall while pacing
            if (this.isPacing) {
                if (actualMoved < 0.05) {
                    this.stuckTimer = (this.stuckTimer || 0) + 1;
                    if (this.stuckTimer > 15) {
                        this.stuckTimer = 0;
                        this.facingRight = !this.facingRight;
                        this.isPacing = false;
                        this.mapReadingTimer = 90;
                        this.paceTimer = 110;
                    }
                } else {
                    this.stuckTimer = 0;
                }
            } else {
                this.stuckTimer = 0;
            }

            if (this.isPacing && actualMoved > 0.05 && (this.isGrounded || inWater)) {
                this.walkAnimTime += 0.18;
            } else {
                this.walkAnimTime = 0;
            }
        }

        drawPixelRiftPortal(ctx, cx, cy, progress, state) {
            ctx.save();
            ctx.imageSmoothingEnabled = false;

            const pixelSize = 4;
            const fullW = 44;
            const fullH = 76;

            // Animate portal width and height based on warp progress
            let scaleX = state === 'active' ? 1.0 : Math.min(1.0, progress * 1.5);
            let scaleY = state === 'active' ? 1.0 : Math.min(1.0, Math.max(0.08, progress * 1.25));

            const curW = Math.max(8, Math.floor((fullW * scaleX) / pixelSize) * pixelSize);
            const curH = Math.max(16, Math.floor((fullH * scaleY) / pixelSize) * pixelSize);

            const halfW = curW / 2;
            const halfH = curH / 2;
            const startY = Math.round(cy - halfH);

            const animTick = Math.floor(frameCount * 0.18);

            // 1. Stepped Pixel Aperture & Dimensional Void Frame
            for (let py = 0; py < curH; py += pixelSize) {
                const normY = (py - halfH) / halfH; // -1 to 1
                const sliceRatio = Math.sqrt(Math.max(0, 1 - normY * normY));
                const sliceHalfW = Math.floor((halfW * sliceRatio) / pixelSize) * pixelSize;
                if (sliceHalfW <= 0) continue;

                const rowX1 = Math.round(cx - sliceHalfW);
                const rowW = sliceHalfW * 2;

                // Outer cosmic void rim
                ctx.fillStyle = '#090312';
                ctx.fillRect(rowX1 - pixelSize, startY + py, rowW + pixelSize * 2, pixelSize);

                // Astral Amethyst stepped boundary ring
                const ringPhase = Math.sin(normY * 4 + animTick * 0.4);
                ctx.fillStyle = ringPhase > 0 ? '#6b21a8' : '#7e22ce';
                ctx.fillRect(rowX1, startY + py, rowW, pixelSize);

                // Inner Dimensional Swirling Energy
                const innerHalfW = Math.max(0, sliceHalfW - pixelSize);
                if (innerHalfW > 0) {
                    const innerX = Math.round(cx - innerHalfW);
                    const innerW = innerHalfW * 2;

                    for (let px = 0; px < innerW; px += pixelSize) {
                        const colIdx = Math.floor(px / pixelSize);
                        const wave = Math.sin(colIdx * 0.85 + normY * 2.8 - animTick * 0.45);
                        let col = '#a855f7';
                        if (wave > 0.65) col = '#fde047'; // Starlight gold spark
                        else if (wave > 0.25) col = '#38bdf8'; // Cyan rift glow
                        else if (wave > -0.25) col = '#c084fc'; // Bright lilac
                        else col = '#581c87'; // Deep void purple

                        ctx.fillStyle = col;
                        ctx.fillRect(innerX + px, startY + py, pixelSize, pixelSize);
                    }
                }
            }

            // 2. Swirling Pixel Orbiting Runes (4 stepped orbiting pixel crystals)
            const numRunes = 4;
            const orbitRadius = Math.max(16, halfW + 6);
            for (let r = 0; r < numRunes; r++) {
                const angle = (animTick * 0.12) + (r * (Math.PI * 2 / numRunes));
                const rx = Math.round((cx + Math.cos(angle) * orbitRadius) / pixelSize) * pixelSize;
                const ry = Math.round((cy + Math.sin(angle) * (halfH * 0.85)) / pixelSize) * pixelSize;

                ctx.fillStyle = (r % 2 === 0) ? '#38bdf8' : '#fde047';
                ctx.fillRect(rx - 2, ry - 2, 4, 4);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(rx - 1, ry - 1, 2, 2);
            }

            ctx.restore();
        }

        draw(ctx, camX, camY) {
            if (this.isDeparted) return;
            const drawX = Math.round(this.x - camX);
            const drawY = Math.round(this.y - camY);
            const w = this.width;
            const h = this.height;

            ctx.save();

            // 1. Draw Stepped Pixel-Art Planar Rift Vortex Behind Kael
            if (this.warpProgress < 1 || this.warpState !== 'active') {
                const cx = drawX + w / 2;
                const cy = drawY + h / 2;
                this.drawPixelRiftPortal(ctx, cx, cy, this.warpProgress, this.warpState);
            }

            // Kael materializes as portal establishes itself
            const kaelAlpha = (this.warpState === 'warping_in') 
                ? Math.max(0.0, Math.min(1.0, (this.warpProgress - 0.35) / 0.65))
                : Math.min(1.0, Math.max(0.0, this.warpProgress));
            ctx.globalAlpha = kaelAlpha;

            if (advancedGraphics) {
                ctx.drawImage(cachedShadowCanvas, drawX + w / 2 - 14, drawY + h - 5, 28, 7);
            }

            // Draw Kael using the standard player humanoid character renderer
            const kCanvas = getKaelSkinCanvas();
            const isReallyMoving = this.isPacing && (this.walkAnimTime > 0);
            if (kCanvas) {
                drawCharacter(
                    ctx, kCanvas, drawX, drawY, w, h,
                    this.facingRight, this.walkAnimTime, isReallyMoving, false,
                    null, null, false, null,
                    false, null, null, null
                );
            }

            // Extra traveler accessories: held celestial star map or rolled map tube
            const sx = w / 16;
            const sy = h / 32;
            ctx.save();
            ctx.translate(drawX + w / 2, drawY);
            if (!this.facingRight) ctx.scale(-1, 1);
            ctx.translate(-w / 2, 0);

            if (this.mapReadingTimer > 0) {
                // Open parchment map held in front
                ctx.fillStyle = '#fef08a';
                ctx.fillRect(6 * sx, 13 * sy, 8 * sx, 6 * sy);
                ctx.fillStyle = '#0284c7';
                ctx.fillRect(7 * sx, 14 * sy, 2 * sx, 1 * sy);
                ctx.fillStyle = '#a855f7';
                ctx.fillRect(10 * sx, 15 * sy, 3 * sx, 1 * sy);
                // Gloves holding edges
                ctx.fillStyle = '#451a03';
                ctx.fillRect(5 * sx, 15 * sy, 2 * sx, 2 * sy);
                ctx.fillRect(13 * sx, 15 * sy, 2 * sx, 2 * sy);
            } else {
                // Rolled star map tube strapped to back
                ctx.fillStyle = '#fef08a';
                ctx.fillRect(2 * sx, 9 * sy, 2.5 * sx, 9 * sy);
                ctx.fillStyle = '#451a03';
                ctx.fillRect(1.5 * sx, 12 * sy, 3.5 * sx, 2 * sy); // Leather strap
            }
            ctx.restore();

            // Overhead Nameplate & Pop-up Tooltip (Authentic Webcraft Pixel-Art Style)
            if (this.warpState === 'active') {
                const nameCX = Math.round(drawX + w / 2);
                const nameY = Math.round(drawY - 22);

                ctx.font = 'bold 14px "VT323", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const titleStr = 'Kael, The Atlas Explorer';
                const subStr = '[Planar Cartographer]';
                const titleWidth = ctx.measureText(titleStr).width;
                const bgW = Math.round(Math.max(titleWidth + 28, 172));
                const bgH = 26;
                const bgX = Math.round(nameCX - bgW / 2);
                const bgY = Math.round(nameY - bgH / 2);

                // Pixel-Art Slate Nameplate (Crisp 9-slice / Minecraft slate style with sharp corners)
                // 1. Drop shadow & outer border (1px black/slate)
                ctx.fillStyle = '#080a0c';
                ctx.fillRect(bgX - 1, bgY - 1, bgW + 2, bgH + 2);

                // 2. Slate inner base
                ctx.fillStyle = 'rgba(18, 14, 28, 0.95)';
                ctx.fillRect(bgX, bgY, bgW, bgH);

                // 3. Pixel Bevel Borders (Authentic Webcraft/Minecraft highlight & shadow)
                ctx.fillStyle = '#a855f7'; // Top highlight
                ctx.fillRect(bgX, bgY, bgW, 1);
                ctx.fillRect(bgX, bgY, 1, bgH); // Left highlight
                ctx.fillStyle = '#3b0764'; // Bottom shadow
                ctx.fillRect(bgX, bgY + bgH - 1, bgW, 1);
                ctx.fillRect(bgX + bgW - 1, bgY, 1, bgH); // Right shadow

                // Corner pixel dots
                ctx.fillStyle = '#c084fc';
                ctx.fillRect(bgX + 1, bgY + 1, 1, 1);
                ctx.fillRect(bgX + bgW - 2, bgY + 1, 1, 1);

                // Title & Subtitle text
                // Pixel Diamond Badges (replacing non-pixelart unicode stars)
                ctx.fillStyle = '#fbbf24';
                ctx.fillRect(bgX + 9, nameY - 6, 3, 1);
                ctx.fillRect(bgX + 8, nameY - 5, 5, 1);
                ctx.fillRect(bgX + 9, nameY - 4, 3, 1);
                ctx.fillRect(bgX + 10, nameY - 7, 1, 3);
                ctx.fillRect(bgX + bgW - 12, nameY - 6, 3, 1);
                ctx.fillRect(bgX + bgW - 13, nameY - 5, 5, 1);
                ctx.fillRect(bgX + bgW - 12, nameY - 4, 3, 1);
                ctx.fillRect(bgX + bgW - 11, nameY - 7, 1, 3);

                ctx.fillStyle = '#f5f3ff'; // Clean crisp white/lilac
                ctx.fillText('Kael, The Atlas Explorer', nameCX, nameY - 4);

                ctx.font = '11px "VT323", monospace';
                ctx.fillStyle = '#38bdf8'; // Sky blue
                ctx.fillText(subStr, nameCX, nameY + 7);

                // Proximity Interaction Pop-up if player is near
                const curP = (typeof player !== 'undefined') ? player : window.player;
                if (curP) {
                    const dToP = Math.hypot((curP.x + curP.width / 2) - (this.x + this.width / 2), (curP.y + curP.height / 2) - (this.y + this.height / 2));
                    if (dToP < TILE_SIZE * 3.5) {
                        const hasTalked = (typeof window !== 'undefined' && typeof window.hasPlayerTalkedToKael === 'function') ? window.hasPlayerTalkedToKael() : false;
                        const actionWord = hasTalked ? 'Trade' : 'Speak';
                        const promptText = `Press [E] to ${actionWord}`;

                        // Measure prompt text dynamically so box perfectly bounds the content
                        ctx.font = 'bold 15px "VT323", monospace';
                        const textW = Math.ceil(ctx.measureText(promptText).width);
                        const popW = Math.max(154, textW + 40);
                        const popH = 22;
                        const popX = Math.round(nameCX - popW / 2);
                        const popY = Math.round(bgY - popH - 5);

                        // Pop-up outer pixel border
                        ctx.fillStyle = '#080a0c';
                        ctx.fillRect(popX - 1, popY - 1, popW + 2, popH + 2);

                        // Pop-up dark slate background
                        ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
                        ctx.fillRect(popX, popY, popW, popH);

                        // Pop-up crisp amber/gold highlight border
                        const pulse = (Math.sin(Date.now() * 0.007) + 1) * 0.5;
                        ctx.fillStyle = (pulse > 0.5) ? '#fbbf24' : '#d97706';
                        ctx.fillRect(popX, popY, popW, 1);
                        ctx.fillRect(popX, popY, 1, popH);
                        ctx.fillStyle = '#78350f';
                        ctx.fillRect(popX, popY + popH - 1, popW, 1);
                        ctx.fillRect(popX + popW - 1, popY, 1, popH);

                        // Pixel downward arrow pointer (pointing at nameplate)
                        ctx.fillStyle = '#080a0c';
                        ctx.fillRect(nameCX - 3, popY + popH, 6, 2);
                        ctx.fillRect(nameCX - 2, popY + popH + 2, 4, 1);
                        ctx.fillRect(nameCX - 1, popY + popH + 3, 2, 1);
                        ctx.fillStyle = '#fbbf24';
                        ctx.fillRect(nameCX - 2, popY + popH, 4, 1);
                        ctx.fillRect(nameCX - 1, popY + popH + 1, 2, 1);

                        // Pixel Key Badge [E]
                        const keyX = popX + 8;
                        const keyY = popY + 4;
                        const keyW = 14;
                        const keyH = 14;

                        // Key cap outer shadow
                        ctx.fillStyle = '#020617';
                        ctx.fillRect(keyX - 1, keyY - 1, keyW + 2, keyH + 2);
                        // Key cap face
                        ctx.fillStyle = '#1e293b';
                        ctx.fillRect(keyX, keyY, keyW, keyH);
                        // Key cap top highlight
                        ctx.fillStyle = '#64748b';
                        ctx.fillRect(keyX, keyY, keyW, 1);
                        ctx.fillRect(keyX, keyY, 1, keyH);
                        // Key letter E
                        ctx.font = 'bold 12px "VT323", monospace';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#fef08a';
                        ctx.fillText('E', keyX + keyW / 2, keyY + keyH / 2 + 1);

                        // Pop-up text with guaranteed spacing
                        ctx.font = 'bold 15px "VT323", monospace';
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#fef08a';
                        ctx.fillText(promptText, keyX + keyW + 7, popY + popH / 2 + 1);
                    }
                }
            }

            ctx.restore();
        }
    }

    export function getInitialSpawnPoint() {
        const centerCol = Math.floor(WORLD_WIDTH / 2);
        const nonSolid = new Set([IDS.AIR, IDS.TORCH, IDS.SAPLING, IDS.JUNGLE_SAPLING, IDS.DOOR_OPEN, IDS.DOOR_OPEN_TOP, IDS.JUNGLE_DOOR_OPEN, IDS.JUNGLE_DOOR_OPEN_TOP, IDS.WATER, IDS.LAVA, IDS.SHORT_GRASS, IDS.TALL_GRASS, IDS.FLOWER_RED, IDS.FLOWER_YELLOW, IDS.FERN, IDS.BAMBOO, IDS.VINES, IDS.LEAVES, IDS.JUNGLE_LEAVES]);
        const hazard = new Set([IDS.LAVA, IDS.CACTUS]);

        for (let r = 0; r < Math.floor(WORLD_WIDTH / 2); r++) {
            const offsets = r === 0 ? [0] : [r, -r];
            for (let offset of offsets) {
                const sx = centerCol + offset;
                if (sx < 2 || sx >= WORLD_WIDTH - 2) continue;

                for (let sy = 2; sy < WORLD_HEIGHT - 2; sy++) {
                    const blockBelow = world[sx]?.[sy];
                    if (blockBelow !== undefined && !nonSolid.has(blockBelow) && !hazard.has(blockBelow)) {
                        const blockHead = world[sx]?.[sy - 2];
                        const blockTorso = world[sx]?.[sy - 1];
                        if (
                            blockHead !== undefined && nonSolid.has(blockHead) &&
                            blockTorso !== undefined && nonSolid.has(blockTorso)
                        ) {
                            return {
                                x: sx * TILE_SIZE + (TILE_SIZE - (TILE_SIZE * 0.75)) / 2,
                                y: sy * TILE_SIZE - (TILE_SIZE * 1.8),
                                gridX: sx,
                                gridY: sy - 2
                            };
                        }
                    }
                }
            }
        }

        let fallbackX = Math.floor(WORLD_WIDTH / 2);
        let fallbackY = 0;
        while (fallbackY < WORLD_HEIGHT && world[fallbackX]?.[fallbackY] === IDS.AIR) fallbackY++;
        return {
            x: fallbackX * TILE_SIZE + (TILE_SIZE - (TILE_SIZE * 0.75)) / 2,
            y: Math.max(0, fallbackY * TILE_SIZE - (TILE_SIZE * 1.8)),
            gridX: fallbackX,
            gridY: Math.max(0, fallbackY - 2)
        };
    }

    export function generateWorld(seedOverride) {
        if (seedOverride !== undefined) {
            mapSeed = seedOverride;
        } else {
            mapSeed = Math.floor(Math.random() * 1000000);
        }
        
        world = Array.from({ length: WORLD_WIDTH }, () => Array(WORLD_HEIGHT).fill(IDS.AIR));
        bgWorld = Array.from({ length: WORLD_WIDTH }, () => Array(WORLD_HEIGHT).fill(IDS.AIR));
        if (typeof window !== 'undefined') { window.world = world; window.bgWorld = bgWorld; }
        if (typeof toggleBackgroundBuildMode === 'function') toggleBackgroundBuildMode(false);
        fluids = new Map();
        fluidTick = 0;
        fluidWakeQueue = new Set();
        leafDecayQueue = new Map();
        treeDecayClusters = new Map();
        saplingGrowthQueue = new Map();
        cropGrowthQueue = new Map();
        dirtToGrassQueue = new Map();
        snowRegrowthQueue = new Map();
        fallingBlocks = [];
        activeProjectiles = [];
        chests = new Map();
        openedChest = null;
        signs = new Map();
        if (typeof window !== 'undefined') window.signs = signs;
        
        const baseHeight = Math.floor(WORLD_HEIGHT / 2);
        const worldSeed = seededRandom() * 10000;
        const tempSeed = seededRandom() * 10000;
        const humidSeed = seededRandom() * 10000;
        const mountainSeed = seededRandom() * 10000;
        worldBiomes = new Array(WORLD_WIDTH);
        if (typeof window !== 'undefined') window.worldBiomes = worldBiomes;
        const biomes = worldBiomes;
        const rawSurfaceHeights = new Array(WORLD_WIDTH);
        nonCollidableTreeWood = new Set();
        let lastTreeX = -10;

        // Guaranteed Biome Distribution:
        // Ensures all 6 biomes (snow, forest, plains, jungle, desert, mountains) generate in every world.
        const biomeSequence = ['snow', 'forest', 'plains', 'jungle', 'desert', 'mountains'];
        const seedShift = Math.floor(worldSeed * 137.5) % WORLD_WIDTH;
        const reverseOrder = (Math.floor(worldSeed) % 2 === 1);
        const activeBiomeList = reverseOrder ? [...biomeSequence].reverse() : [...biomeSequence];
        const numBiomes = activeBiomeList.length;

        for (let x = 0; x < WORLD_WIDTH; x++) {
            // Multi-octave organic domain warping for undulating natural biome borders
            let warp = Math.sin(x * 0.012 + worldSeed * 0.4) * 45 +
                       Math.cos(x * 0.028 + tempSeed * 0.6) * 22 +
                       Math.sin(x * 0.065 + humidSeed * 0.8) * 12;
            let warpedX = (x + seedShift + warp) % WORLD_WIDTH;
            if (warpedX < 0) warpedX += WORLD_WIDTH;

            let sectorFraction = (warpedX / WORLD_WIDTH) * numBiomes;
            let sectorIndex = Math.floor(sectorFraction) % numBiomes;
            let sectorProgress = sectorFraction - Math.floor(sectorFraction); // 0.0 to 1.0 within sector
            let biome = activeBiomeList[sectorIndex];
            biomes[x] = biome;

            let wx = x + worldSeed;
            // Layered organic fractal terrain (continental + hills + detail)
            let continental = Math.sin(wx * 0.004) * 28 + Math.cos(wx * 0.01 + worldSeed * 0.3) * 18;
            let hills = Math.sin(wx * 0.02 + worldSeed * 0.5) * 10 + Math.sin(wx * 0.045) * 5;
            let detail = Math.sin(wx * 0.1 + worldSeed * 0.8) * 2 + Math.cos(wx * 0.18) * 0.9;

            let surfaceY = baseHeight + continental + hills + detail;

            if (biome === "mountains") {
                // Smooth mountain envelope rising smoothly from borders to towering peaks in the center
                let mountainEnvelope = Math.sin(sectorProgress * Math.PI);
                let heightScale = WORLD_HEIGHT / 320;
                let mountainSpikes = Math.abs(Math.sin(wx * 0.028 + worldSeed * 0.4) * 65 + Math.sin(wx * 0.065 + worldSeed * 0.6) * 25 + Math.sin(wx * 0.12) * 10);
                surfaceY -= (32 + mountainSpikes) * mountainEnvelope * heightScale;
            } else if (biome === "desert") {
                let dunes = Math.sin(wx * 0.02 + worldSeed * 0.7) * 9 + Math.abs(Math.sin(wx * 0.045)) * 5;
                surfaceY = baseHeight + (continental * 0.35) + dunes + detail;
            } else if (biome === "jungle") {
                let jungleHills = Math.sin(wx * 0.028 + worldSeed * 0.2) * 12 + Math.cos(wx * 0.055) * 6;
                surfaceY += jungleHills;
            } else if (biome === "forest") {
                surfaceY += Math.sin(wx * 0.035) * 7 - 2;
            } else if (biome === "snow") {
                surfaceY += Math.sin(wx * 0.038) * 8 + 2;
            } else if (biome === "plains") {
                surfaceY += Math.sin(wx * 0.025) * 5;
            }

            rawSurfaceHeights[x] = surfaceY;
        }

        // Blend neighboring columns so biome height changes do not create cliffs.
        surfaceHeights = rawSurfaceHeights.map((height, x) => {
            let weightedHeight = 0;
            let totalWeight = 0;
            for (let offset = -3; offset <= 3; offset++) {
                let neighborX = Math.max(0, Math.min(WORLD_WIDTH - 1, x + offset));
                let weight = 4 - Math.abs(offset);
                weightedHeight += rawSurfaceHeights[neighborX] * weight;
                totalWeight += weight;
            }
            return Math.max(35, Math.min(WORLD_HEIGHT - 35, Math.floor(weightedHeight / totalWeight)));
        });
        if (typeof window !== 'undefined') window.surfaceHeights = surfaceHeights;

        for (let x = 0; x < WORLD_WIDTH; x++) {
            let biome = biomes[x];
            let surfaceY = surfaceHeights[x];

            for (let y = 0; y < WORLD_HEIGHT; y++) {
                if (y < surfaceY) {
                    world[x][y] = IDS.AIR;
                }
                else if (y === surfaceY) {
                    if (biome === "desert") world[x][y] = IDS.SAND;
                    else if (biome === "snow") world[x][y] = IDS.SNOW;
                    else if (biome === "mountains" && y < baseHeight - 45) world[x][y] = IDS.SNOW;
                    else if (biome === "mountains" && y >= baseHeight - 18) world[x][y] = IDS.GRASS;
                    else if (biome === "mountains") world[x][y] = IDS.STONE;
                    else world[x][y] = IDS.GRASS;
                }
                else if (y > surfaceY && y < surfaceY + seededRandom() * 3 + 3) {
                    if (biome === "desert") world[x][y] = IDS.SAND;
                    else if (biome === "snow" || biome === "plains" || biome === "forest" || biome === "jungle" || (biome === "mountains" && surfaceY >= baseHeight - 18)) world[x][y] = IDS.DIRT;
                    else world[x][y] = IDS.STONE;
                }
                else {
                    world[x][y] = IDS.STONE;

                    // Multi-type Cave Generator:
                    // Mountain peaks and high slopes remain solid stone/snow; caves only generate deep underground below mountain base.
                    let minCaveY = surfaceY + 6;
                    if (biome === "mountains") minCaveY = Math.max(surfaceY + 28, baseHeight - 6);
                    let isCave = false;

                    if (y > minCaveY && y < WORLD_HEIGHT - 2) {
                        let cx = x + worldSeed;
                        let cy = y + worldSeed;

                        // 1. Spaghetti Tunnels: Winding continuous tubes/corridors that twist and intersect
                        let spag1 = Math.sin(cx * 0.045 + Math.cos(cy * 0.04 + worldSeed * 0.7) * 1.8);
                        let spag2 = Math.cos(cy * 0.045 + Math.sin(cx * 0.04 + worldSeed * 0.3) * 1.8);
                        let spagDist = spag1 * spag1 + spag2 * spag2;
                        let isSpaghetti = spagDist < 0.18;

                        // 2. Cheese Caverns: Spacious large halls and open underground rooms
                        let cavernNoise = (Math.sin(cx * 0.024 + worldSeed * 0.2) * Math.cos(cy * 0.024 + worldSeed * 0.5) + 
                                           Math.sin(cx * 0.048 + cy * 0.048 + worldSeed * 0.8) * 0.45);
                        let cavernThresh = 0.76 - (Math.max(0, y - baseHeight) / (WORLD_HEIGHT - baseHeight)) * 0.14;
                        let isCavern = cavernNoise > cavernThresh;

                        // 3. Noodle Crevices: Tangled, narrow, squiggly fissures connecting subterranean pockets
                        let noodle = Math.abs(Math.sin(cx * 0.07 + Math.sin(cy * 0.06) * 1.7 + worldSeed * 0.4) + 
                                             Math.cos(cy * 0.07 + Math.cos(cx * 0.06) * 1.7 + worldSeed * 0.9));
                        let isNoodle = noodle < 0.085;

                        if (isCavern || isSpaghetti || isNoodle) {
                            isCave = true;
                        }
                    }

                    if (isCave) {
                        world[x][y] = IDS.AIR;
                    } else {
                        // Ore generation embedded in stone and cave walls:
                        // Deep ore layer thresholds dynamically scaled to world depth:
                        // Gold strictly in lower half of underground; Diamonds strictly in deepest ~20% abyss.
                        const undergroundDepth = WORLD_HEIGHT - baseHeight;
                        const goldMinY = baseHeight + Math.floor(undergroundDepth * 0.52);
                        const diamondMinY = baseHeight + Math.floor(undergroundDepth * 0.80);
                        const emeraldMinY = baseHeight + Math.floor(undergroundDepth * 0.65);

                        let oreRoll = seededRandom();
                        if (oreRoll < 0.035) {
                            world[x][y] = IDS.COAL_ORE;
                        } else if (oreRoll < 0.065) {
                            world[x][y] = IDS.IRON_ORE;
                        } else if (oreRoll < 0.080) {
                            // Gold only generates in the deep lower half
                            if (y >= goldMinY) {
                                world[x][y] = IDS.GOLD_ORE;
                            }
                        } else if (oreRoll < 0.084) {
                            // Rare Diamonds (0.4% chance, reduced from 1.2%), strictly in the bottom 20% abyss
                            if (y >= diamondMinY) {
                                world[x][y] = IDS.DIAMOND_ORE;
                            }
                        } else if (oreRoll < 0.089) {
                            // Emeralds in mountains or deep underground
                            if (biome === "mountains" || y >= emeraldMinY) {
                                world[x][y] = IDS.EMERALD_ORE;
                            }
                        }
                    }
                }
            }
            
        }

        function buildTree(tx, sy, treeType = 'oak') {
            const setTrunk = (bx, by) => {
                if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) return;
                if (isWater(bx, by) || getFluid(bx, by)) return;
                world[bx][by] = IDS.WOOD;
                nonCollidableTreeWood.add(`${bx}_${by}`);
            };
            const setLeaf = (bx, by) => {
                if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) return;
                if (isWater(bx, by) || getFluid(bx, by)) return;
                if (world[bx][by] === IDS.AIR) world[bx][by] = IDS.LEAVES;
            };

            if (treeType === 'bush' || treeType === 'snow_bush') {
                setTrunk(tx, sy - 1);
                for (let lx = -1; lx <= 1; lx++) {
                    for (let ly = -2; ly <= -1; ly++) {
                        setLeaf(tx + lx, sy + ly);
                    }
                }
                setLeaf(tx, sy - 3);
            }
            else if (treeType === 'pine' || treeType === 'tall_pine') {
                const th = treeType === 'tall_pine' ? (Math.floor(seededRandom() * 3) + 7) : (Math.floor(seededRandom() * 3) + 5);
                for (let i = 1; i <= th; i++) setTrunk(tx, sy - i);
                
                const top = sy - th;
                setLeaf(tx, top - 1);
                for (let layer = 0; layer <= th - 2; layer++) {
                    const layerY = top + layer;
                    let rad;
                    if (layer === 0 || layer === 1) rad = 1;
                    else if (layer % 2 === 0) rad = 2;
                    else rad = 3;
                    
                    if (layerY > sy - 2) continue;

                    for (let lx = -rad; lx <= rad; lx++) {
                        if (Math.abs(lx) === rad && layer % 2 === 1 && Math.abs(lx) === 3 && seededRandom() < 0.25) continue;
                        setLeaf(tx + lx, layerY);
                    }
                }
            }
            else if (treeType === 'tall_oak' || treeType === 'fancy') {
                const th = Math.floor(seededRandom() * 4) + 7;
                for (let i = 1; i <= th; i++) setTrunk(tx, sy - i);

                const branchY = sy - Math.floor(th * 0.65);
                const branchDir = seededRandom() > 0.5 ? 1 : -1;
                setTrunk(tx + branchDir, branchY);

                const top = sy - th;
                for (let lx = -2; lx <= 2; lx++) {
                    for (let ly = -2; ly <= -1; ly++) {
                        if (Math.abs(lx) + Math.abs(ly + 1) <= 2) setLeaf(tx + lx, top + ly);
                    }
                }
                for (let lx = -3; lx <= 3; lx++) {
                    for (let ly = 0; ly <= 2; ly++) {
                        if (Math.abs(lx) + Math.abs(ly - 1) <= 3) setLeaf(tx + lx, top + ly);
                    }
                }
                for (let lx = -2; lx <= 2; lx++) {
                    setLeaf(tx + lx, top + 3);
                }
            }
            else {
                // Classic full-canopy Minecraft oak tree
                const th = Math.floor(seededRandom() * 3) + 4;
                for (let i = 1; i <= th; i++) setTrunk(tx, sy - i);
                const top = sy - th;

                // Base canopy layer (width 5, height 2)
                for (let lx = -2; lx <= 2; lx++) {
                    for (let ly = -1; ly <= 1; ly++) {
                        if (Math.abs(lx) === 2 && Math.abs(ly) === 1 && seededRandom() < 0.35) continue;
                        setLeaf(tx + lx, top + ly);
                    }
                }
                // Upper dome layer (width 3, height 2)
                for (let lx = -1; lx <= 1; lx++) {
                    for (let ly = -3; ly <= -2; ly++) {
                        if (Math.abs(lx) === 1 && ly === -3 && seededRandom() < 0.45) continue;
                        setLeaf(tx + lx, top + ly);
                    }
                }
                // Peak crown top leaf
                setLeaf(tx, top - 4);
            }
        }

        function buildJungleTree(tx, sy, treeType = 'giant') {
            const setTrunk = (bx, by) => {
                if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) return;
                if (isWater(bx, by) || getFluid(bx, by)) return;
                world[bx][by] = IDS.JUNGLE_WOOD;
                nonCollidableTreeWood.add(`${bx}_${by}`);
            };
            const setLeaf = (bx, by) => {
                if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) return;
                if (isWater(bx, by) || getFluid(bx, by)) return;
                if (world[bx][by] === IDS.AIR) world[bx][by] = IDS.JUNGLE_LEAVES;
            };
            const setVine = (bx, by) => {
                if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) return;
                if (isWater(bx, by) || getFluid(bx, by)) return;
                if (world[bx][by] === IDS.AIR) world[bx][by] = IDS.VINES;
            };

            if (treeType === 'jungle_bush') {
                setTrunk(tx, sy - 1);
                for (let lx = -1; lx <= 1; lx++) {
                    for (let ly = -2; ly <= -1; ly++) {
                        setLeaf(tx + lx, sy + ly);
                    }
                }
                setLeaf(tx, sy - 3);
                return;
            }

            // Giant Jungle Tree: 12 to 20 blocks high
            const th = Math.floor(seededRandom() * 9) + 12;
            const is2x2 = seededRandom() < 0.65;
            const trunkWidth = is2x2 ? 2 : 1;

            // Grow main trunk
            for (let i = 1; i <= th; i++) {
                for (let tw = 0; tw < trunkWidth; tw++) {
                    setTrunk(tx + tw, sy - i);
                }
            }

            // Spreading branch arms midway up
            const branchY1 = sy - Math.floor(th * 0.55);
            setTrunk(tx - 1, branchY1);
            setLeaf(tx - 2, branchY1);
            setLeaf(tx - 2, branchY1 - 1);
            setLeaf(tx - 1, branchY1 - 1);

            const branchY2 = sy - Math.floor(th * 0.75);
            setTrunk(tx + trunkWidth, branchY2);
            setLeaf(tx + trunkWidth + 1, branchY2);
            setLeaf(tx + trunkWidth + 1, branchY2 - 1);
            setLeaf(tx + trunkWidth, branchY2 - 1);

            // Broad canopy at top (radius 4 to 6)
            const top = sy - th;
            const canopyRadius = is2x2 ? 5 : 4;
            for (let ly = -4; ly <= 2; ly++) {
                const layerY = top + ly;
                const r = canopyRadius - Math.abs(ly + 1);
                for (let lx = -r; lx <= r + (is2x2 ? 1 : 0); lx++) {
                    if (Math.abs(lx) === r && Math.abs(ly + 1) >= 2 && seededRandom() < 0.4) continue;
                    setLeaf(tx + lx, layerY);
                }
            }

            // Hanging Vines on trunk sides and under canopy
            for (let side of [-1, trunkWidth]) {
                const vineX = tx + side;
                const startVineY = top + 2;
                const vineLen = Math.floor(seededRandom() * 6) + 3;
                for (let v = 0; v < vineLen; v++) {
                    const vy = startVineY + v;
                    if (vy < sy - 1) {
                        setVine(vineX, vy);
                    }
                }
            }
            // Hanging vines under outer canopy edges
            for (let offset of [-canopyRadius + 1, canopyRadius + (is2x2 ? 0 : -1)]) {
                const vineX = tx + offset;
                const startVineY = top + 3;
                const vineLen = Math.floor(seededRandom() * 5) + 2;
                for (let v = 0; v < vineLen; v++) {
                    const vy = startVineY + v;
                    if (vy < sy - 1) {
                        setVine(vineX, vy);
                    }
                }
            }
        }

        // 1. Surface Lakes in Plains & Valleys (Natural sealed concave basins with level waterlines)
        const fillPool = (centerX, width, depth) => {
            const halfW = Math.floor(width / 2);
            const startX = Math.max(5, centerX - halfW);
            const endX = Math.min(WORLD_WIDTH - 6, startX + width - 1);
            if (endX <= startX + 2) return false;

            const yLeftRim = surfaceHeights[startX - 1];
            const yRightRim = surfaceHeights[endX + 1];
            if (yLeftRim === undefined || yRightRim === undefined) return false;

            // Waterline is set strictly below (larger Y) the lower rim so water is naturally contained
            const waterline = Math.max(yLeftRim, yRightRim) + 1;
            let placed = 0;

            for (let x = startX; x <= endX; x++) {
                const progress = (x - startX + 0.5) / (endX - startX + 1);
                const bowlFactor = Math.sin(progress * Math.PI);
                const bowlDepth = Math.max(1, Math.round(depth * bowlFactor));
                const bedY = waterline + bowlDepth;

                // 1. Clear open sky above the waterline
                const originalSurface = surfaceHeights[x] || waterline;
                for (let y = Math.min(originalSurface, waterline - 1); y < waterline; y++) {
                    world[x][y] = IDS.AIR;
                }

                // 2. Fill concave basin with water source blocks
                for (let y = waterline; y < bedY; y++) {
                    world[x][y] = IDS.AIR;
                    setFluid(x, y, { type: IDS.WATER, level: 0, source: true, falling: false });
                    placed++;
                }

                // 3. Line the lake bed with sand or clay and reinforce watertight base
                const bedBlock = seededRandom() < 0.25 ? IDS.CLAY : IDS.SAND;
                for (let by = bedY; by <= Math.min(WORLD_HEIGHT - 1, bedY + 2); by++) {
                    if (!isSolidWorldBlock(x, by, world[x]?.[by])) {
                        world[x][by] = (by === bedY) ? bedBlock : IDS.DIRT;
                    }
                }

                // 4. Update surface height to waterline so vegetation and mobs don't generate inside water
                surfaceHeights[x] = waterline;
            }

            // 5. Seal containment banks on left and right borders
            for (let by = Math.min(yLeftRim, waterline); by <= waterline + depth + 1; by++) {
                if (startX - 1 >= 0 && !isSolidWorldBlock(startX - 1, by, world[startX - 1]?.[by])) {
                    world[startX - 1][by] = IDS.SAND;
                }
                if (endX + 1 < WORLD_WIDTH && !isSolidWorldBlock(endX + 1, by, world[endX + 1]?.[by])) {
                    world[endX + 1][by] = IDS.SAND;
                }
            }

            return placed > 0;
        };

        let poolsPlaced = 0;
        for (let x = 12; x < WORLD_WIDTH - 12 && poolsPlaced < 7; x += 6) {
            const localFloor = surfaceHeights[x];
            const leftRim = Math.min(surfaceHeights[x - 4], surfaceHeights[x - 2]);
            const rightRim = Math.min(surfaceHeights[x + 2], surfaceHeights[x + 4]);
            const isValley = localFloor >= leftRim + 2 && localFloor >= rightRim + 2;
            const biomeAllowsWater = biomes[x] !== 'desert' && biomes[x] !== 'snow';
            if (isValley && biomeAllowsWater && seededRandom() < 0.70) {
                const width = 5 + Math.floor(seededRandom() * 6);
                const depth = 2 + Math.floor(seededRandom() * 3);
                if (fillPool(x, width, depth)) poolsPlaced++;
            }
        }

        // Mountain waterfall springs with open downhill cascade outlet
        let springsPlaced = 0;
        for (let x = 12; x < WORLD_WIDTH - 12 && springsPlaced < 4; x += 8) {
            if (biomes[x] === 'mountains' && seededRandom() < 0.45) {
                const peakY = surfaceHeights[x];
                if (peakY > 10 && peakY < WORLD_HEIGHT - 20) {
                    const leftSlopeY = surfaceHeights[x - 1] ?? peakY;
                    const rightSlopeY = surfaceHeights[x + 1] ?? peakY;
                    const flowRight = rightSlopeY >= leftSlopeY;
                    world[x][peakY + 1] = IDS.STONE;
                    world[x][peakY] = IDS.AIR;
                    if (flowRight) {
                        world[x - 1][peakY] = IDS.STONE;
                        world[x + 1][peakY] = IDS.AIR; // Downhill open outlet creates cliff waterfall
                    } else {
                        world[x + 1][peakY] = IDS.STONE;
                        world[x - 1][peakY] = IDS.AIR; // Downhill open outlet
                    }
                    setFluid(x, peakY, { type: IDS.WATER, level: 0, source: true, falling: false });
                    springsPlaced++;
                }
            }
        }

        // Underground Lava Pools in deep caverns
        for (let x = 8; x < WORLD_WIDTH - 8; x += 12) {
            const surfaceY = surfaceHeights[x];
            for (let y = WORLD_HEIGHT - 6; y > surfaceY + 35; y -= 4) {
                if (world[x][y] === IDS.AIR && isSolidWorldBlock(x, y + 1, world[x][y + 1])) {
                    if (seededRandom() < 0.35) {
                        const poolW = 3 + Math.floor(seededRandom() * 4);
                        for (let lx = x; lx < Math.min(WORLD_WIDTH - 4, x + poolW); lx++) {
                            if (world[lx][y] === IDS.AIR && isSolidWorldBlock(lx, y + 1, world[lx][y + 1])) {
                                setFluid(lx, y, { type: IDS.LAVA, level: 0, source: true, falling: false });
                            }
                        }
                        break;
                    }
                }
            }
        }

        // 2. Add Trees and Vegetation on dry, solid terrain (strictly AFTER water generation)
        const isNearWater = (checkX) => {
            for (let ox = -3; ox <= 3; ox++) {
                let tx = checkX + ox;
                if (tx < 0 || tx >= WORLD_WIDTH) continue;
                let sy = surfaceHeights[tx];
                for (let ty = sy - 4; ty <= sy + 8; ty++) {
                    if (ty >= 0 && ty < WORLD_HEIGHT) {
                        if (isWater(tx, ty) || getFluid(tx, ty)) return true;
                    }
                }
            }
            return false;
        };

        lastTreeX = -999;
        for (let x = 3; x < WORLD_WIDTH - 3; x++) {
            let biome = biomes[x];
            let surfaceY = surfaceHeights[x];
            let topBlock = world[x][surfaceY];
            if (isNearWater(x)) continue;

            if (biome === "jungle" && topBlock === IDS.GRASS && x - lastTreeX >= 3 && seededRandom() < 0.65) {
                let roll = seededRandom();
                let treeType = roll < 0.80 ? 'giant' : 'jungle_bush';
                buildJungleTree(x, surfaceY, treeType);
                lastTreeX = x + (treeType === 'giant' ? 3 : 1);
            } else if (biome === "forest" && topBlock === IDS.GRASS && x - lastTreeX >= 2 && seededRandom() < 0.52) {
                let roll = seededRandom();
                let treeType = roll < 0.40 ? 'oak' : (roll < 0.70 ? 'tall_oak' : (roll < 0.88 ? 'fancy' : 'bush'));
                buildTree(x, surfaceY, treeType);
                lastTreeX = x;
            } else if (biome === "plains" && topBlock === IDS.GRASS && x - lastTreeX >= 4 && seededRandom() < 0.20) {
                let roll = seededRandom();
                let treeType = roll < 0.65 ? 'oak' : (roll < 0.85 ? 'bush' : 'tall_oak');
                buildTree(x, surfaceY, treeType);
                lastTreeX = x;
            } else if (biome === "snow" && topBlock === IDS.SNOW && x - lastTreeX >= 3 && seededRandom() < 0.32) {
                let roll = seededRandom();
                let treeType = roll < 0.70 ? 'pine' : (roll < 0.88 ? 'tall_pine' : 'snow_bush');
                buildTree(x, surfaceY, treeType);
                lastTreeX = x;
            } else if (topBlock === IDS.SAND && biome === "desert" && seededRandom() < 0.06) {
                let cactusHeight = Math.floor(seededRandom() * 3) + 2;
                for (let i = 1; i <= cactusHeight; i++) world[x][surfaceY - i] = IDS.CACTUS;
            }

            // Natural Ground Cover: Organic Meadows, Grass Waves & Clustered Wildflower Patches
            if (topBlock === IDS.GRASS && world[x][surfaceY - 1] === IDS.AIR && !isNearWater(x)) {
                const meadowDensity = Math.sin(x * 0.12 + worldSeed * 0.3) * 0.5 + Math.sin(x * 0.04) * 0.5;
                const flowerCluster = Math.sin(x * 0.22 + worldSeed * 1.7);
                let vegRoll = seededRandom();

                if (biome === "jungle") {
                    // Jungle floor: Bamboo clumps, Ferns, Melons, and tall foliage
                    if (vegRoll < 0.25) {
                        world[x][surfaceY - 1] = IDS.FERN;
                    } else if (vegRoll < 0.45) {
                        world[x][surfaceY - 1] = IDS.TALL_GRASS;
                    } else if (vegRoll < 0.60) {
                        world[x][surfaceY - 1] = IDS.SHORT_GRASS;
                    } else if (vegRoll < 0.75) {
                        // Bamboo shoot/stalk (2-5 blocks tall)
                        let bambooHeight = Math.floor(seededRandom() * 4) + 2;
                        for (let b = 1; b <= bambooHeight; b++) {
                            if (surfaceY - b > 0 && world[x][surfaceY - b] === IDS.AIR) {
                                world[x][surfaceY - b] = IDS.BAMBOO;
                            }
                        }
                    }
                } else if (biome === "plains") {
                    // Wildflower patches in plains
                    if (flowerCluster > 0.82 && vegRoll < 0.45) {
                        world[x][surfaceY - 1] = IDS.FLOWER_RED;
                    } else if (flowerCluster < -0.82 && vegRoll < 0.45) {
                        world[x][surfaceY - 1] = IDS.FLOWER_YELLOW;
                    } else if (meadowDensity > 0.15) {
                        // Dense waving meadow
                        if (vegRoll < 0.42) world[x][surfaceY - 1] = IDS.SHORT_GRASS;
                        else if (vegRoll < 0.70) world[x][surfaceY - 1] = IDS.TALL_GRASS;
                        else if (vegRoll < 0.75) world[x][surfaceY - 1] = IDS.FLOWER_RED;
                        else if (vegRoll < 0.80) world[x][surfaceY - 1] = IDS.FLOWER_YELLOW;
                    } else {
                        // Open grassy clearing
                        if (vegRoll < 0.20) world[x][surfaceY - 1] = IDS.SHORT_GRASS;
                        else if (vegRoll < 0.30) world[x][surfaceY - 1] = IDS.TALL_GRASS;
                    }
                } else if (biome === "forest") {
                    // Forest floor under-canopy ferns & shaded flowers
                    if (flowerCluster > 0.85 && vegRoll < 0.38) {
                        world[x][surfaceY - 1] = IDS.FLOWER_RED;
                    } else if (meadowDensity > 0.10) {
                        if (vegRoll < 0.38) world[x][surfaceY - 1] = IDS.SHORT_GRASS;
                        else if (vegRoll < 0.62) world[x][surfaceY - 1] = IDS.TALL_GRASS;
                    } else {
                        if (vegRoll < 0.18) world[x][surfaceY - 1] = IDS.SHORT_GRASS;
                        else if (vegRoll < 0.28) world[x][surfaceY - 1] = IDS.TALL_GRASS;
                    }
                } else if (biome === "mountains" && topBlock === IDS.GRASS) {
                    // Alpine foothill meadows
                    if (vegRoll < 0.24) world[x][surfaceY - 1] = IDS.SHORT_GRASS;
                    else if (vegRoll < 0.34) world[x][surfaceY - 1] = IDS.FLOWER_YELLOW;
                }
            }
        }

        // Natural Wild Melon Patches in Jungle clearings
        for (let x = 10; x < WORLD_WIDTH - 10; x += 14) {
            if (biomes[x] === 'jungle' && seededRandom() < 0.48) {
                let sy = surfaceHeights[x];
                if (sy && world[x][sy] === IDS.GRASS && world[x][sy - 1] === IDS.AIR && !isNearWater(x)) {
                    let patchSize = Math.floor(seededRandom() * 4) + 2;
                    for (let p = 0; p < patchSize; p++) {
                        let mx = x + (p % 3) - 1;
                        if (mx >= 5 && mx < WORLD_WIDTH - 5) {
                            let my = surfaceHeights[mx];
                            if (my && world[mx][my] === IDS.GRASS && world[mx][my - 1] === IDS.AIR) {
                                world[mx][my - 1] = IDS.MELON;
                            }
                        }
                    }
                }
            }
        }

        ensureTreeWoodNonCollidable();
        ensureDesertScorpions();
    }

    export function spawnAnimals(count = 1, nearPlayerBias = 0.35) {
        let maxAnimals = getMaxAnimals();
        let currentAnimals = entities.filter(e => e instanceof Animal).length;
        if (currentAnimals >= maxAnimals) return;

        let activePlayers = [{ x: player.x, y: player.y }];
        if (isMultiplayer && isMultiplayerAuthority()) {
            Object.values(remotePlayers).forEach(rp => {
                if (!rp.isDead && rp.x !== undefined) activePlayers.push({ x: rp.x, y: rp.y });
            });
        }

        const validGround = new Set([IDS.GRASS, IDS.SNOW, IDS.SHORT_GRASS, IDS.TALL_GRASS, IDS.DIRT, IDS.JUNGLE_LEAVES, IDS.LEAVES]);
        const nonSolid = new Set([IDS.AIR, IDS.TORCH, IDS.SAPLING, IDS.JUNGLE_SAPLING, IDS.SHORT_GRASS, IDS.TALL_GRASS, IDS.FLOWER_RED, IDS.FLOWER_YELLOW, IDS.DOOR_OPEN, IDS.DOOR_OPEN_TOP, IDS.BAMBOO, IDS.FERN, IDS.VINES]);

        for (let i = 0; i < count && currentAnimals < maxAnimals; i++) {
            let chosenPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
            let isNear = Math.random() < nearPlayerBias;
            // Near: 32 to 65 tiles away (safely off-screen without crowding); Far: 70 to 160 tiles away
            let offsetTiles = isNear ? (32 + Math.random() * 33) : (70 + Math.random() * 90);
            let side = Math.random() > 0.5 ? 1 : -1;
            let spawnX = chosenPlayer.x + side * offsetTiles * TILE_SIZE;
            let gx = Math.floor(spawnX / TILE_SIZE);
            if (gx < 5 || gx >= WORLD_WIDTH - 5) continue;

            let gy = surfaceHeights[gx];
            if (gy === undefined || gy < 2 || gy >= WORLD_HEIGHT - 3) {
                gy = 0;
                while (gy < WORLD_HEIGHT && nonSolid.has(world[gx]?.[gy])) gy++;
            }
            if (gy >= WORLD_HEIGHT || gy < 2) continue;

            let groundBlock = world[gx]?.[gy];
            let headBlock = world[gx]?.[gy - 2];
            let torsoBlock = world[gx]?.[gy - 1];

            if (groundBlock !== undefined && validGround.has(groundBlock) && 
                headBlock !== undefined && nonSolid.has(headBlock) && 
                torsoBlock !== undefined && nonSolid.has(torsoBlock)) {
                
                const isJungle = typeof getActiveBiomeAt === 'function' && getActiveBiomeAt(gx) === 'jungle';
                let currentPigeons = entities.filter(e => e instanceof Pigeon).length;
                let targetPigeons = Math.round(maxAnimals * 0.28); // 11 pigeons when maxAnimals is 40
                let animalType;
                if (isJungle && Math.random() < 0.65) {
                    animalType = 'Parrot';
                } else if (currentPigeons < targetPigeons) {
                    let roll = Math.random();
                    if (roll < 0.35) animalType = 'Pigeon';
                    else if (roll < 0.51) animalType = 'Sheep';
                    else if (roll < 0.67) animalType = 'Pig';
                    else if (roll < 0.83) animalType = 'Cow';
                    else animalType = 'Chicken';
                } else {
                    let roll = Math.random();
                    if (roll < 0.25) animalType = 'Sheep';
                    else if (roll < 0.50) animalType = 'Pig';
                    else if (roll < 0.75) animalType = 'Cow';
                    else animalType = 'Chicken';
                }
                let spawnWorldY = (gy - 2) * TILE_SIZE;
                
                if (animalType === 'Sheep') entities.push(new Sheep(spawnX, spawnWorldY));
                else if (animalType === 'Pig') entities.push(new Pig(spawnX, spawnWorldY));
                else if (animalType === 'Cow') entities.push(new Cow(spawnX, spawnWorldY));
                else if (animalType === 'Chicken') entities.push(new Chicken(spawnX, spawnWorldY));
                else if (animalType === 'Parrot') {
                    const parrot = new Parrot(spawnX, spawnWorldY);
                    entities.push(parrot);
                    currentAnimals++;
                    if (Math.random() < 0.45 && currentAnimals < maxAnimals) {
                        entities.push(new Parrot(spawnX + 16, spawnWorldY));
                        currentAnimals++;
                    }
                }
                else {
                    const p1 = new Pigeon(spawnX, spawnWorldY);
                    entities.push(p1);
                    currentAnimals++;
                    if (Math.random() < 0.50 && currentAnimals < maxAnimals && (currentPigeons + 1) < 12) {
                        const p2 = new Pigeon(spawnX + 16, spawnWorldY);
                        p1.partner = p2;
                        p2.partner = p1;
                        entities.push(p2);
                        currentAnimals++;
                    }
                }
                currentAnimals++;

                // Subtle herd bonus: 15% chance to spawn a single companion slightly nearby
                if (animalType !== 'Pigeon' && animalType !== 'Parrot' && Math.random() < 0.15 && currentAnimals < maxAnimals) {
                    let herdOffset = (Math.random() > 0.5 ? 2 : -2);
                    let hgx = gx + herdOffset;
                    if (hgx >= 2 && hgx < WORLD_WIDTH - 2) {
                        let hgy = surfaceHeights[hgx] || gy;
                        if (hgy >= 2 && hgy < WORLD_HEIGHT - 2 && validGround.has(world[hgx]?.[hgy])) {
                            let hSpawnX = hgx * TILE_SIZE;
                            let hSpawnY = (hgy - 2) * TILE_SIZE;
                            if (animalType === 'Sheep') entities.push(new Sheep(hSpawnX, hSpawnY));
                            else if (animalType === 'Pig') entities.push(new Pig(hSpawnX, hSpawnY));
                            else if (animalType === 'Cow') entities.push(new Cow(hSpawnX, hSpawnY));
                            else entities.push(new Chicken(hSpawnX, hSpawnY));
                            currentAnimals++;
                        }
                    }
                }
            }
        }
        return true;
    }

    export function isNearTorch(gx, gy, radius = 4) {
        let minX = Math.max(0, gx - radius);
        let maxX = Math.min(WORLD_WIDTH - 1, gx + radius);
        let minY = Math.max(0, gy - radius);
        let maxY = Math.min(WORLD_HEIGHT - 1, gy + radius);
        for (let x = minX; x <= maxX; x++) {
            if (!world[x]) continue;
            for (let y = minY; y <= maxY; y++) {
                if (world[x][y] === IDS.TORCH) return true;
            }
        }
        return false;
    }

    export function hasDirectSkyAccess(gx, gy, ignoreTranslucent = true) {
        if (gx < 0 || gx >= WORLD_WIDTH) return true;
        const nonSunlightBlocking = new Set([
            IDS.AIR, IDS.TORCH, IDS.SAPLING, IDS.JUNGLE_SAPLING,
            IDS.FLOWER_RED, IDS.FLOWER_YELLOW, IDS.FERN, IDS.SHORT_GRASS,
            IDS.TALL_GRASS, IDS.VINES, IDS.GLASS
        ]);
        if (ignoreTranslucent) {
            nonSunlightBlocking.add(IDS.LEAVES);
            nonSunlightBlocking.add(IDS.PINE_LEAVES);
            nonSunlightBlocking.add(IDS.JUNGLE_LEAVES);
            nonSunlightBlocking.add(IDS.BAMBOO);
        }
        for (let y = gy; y >= 0; y--) {
            let b = world[gx]?.[y];
            if (b !== undefined && !nonSunlightBlocking.has(b)) {
                return false;
            }
        }
        return true;
    }

    export function spawnMobs(forcePassive = false) {
        let diff = DIFFICULTIES[currentDifficulty] || DIFFICULTIES.normal;
        if (diff.mobSpawn <= 0) {
            entities = entities.filter(e => (e instanceof Animal) || (e instanceof AtlasExplorer));
            if (!forcePassive) return;
        }

        const isNight = timeOfDay >= 0.68 && timeOfDay < 0.90;
        const isDay = !isNight;

        let activePlayerPositions = [{ x: player.x, y: player.y }];
        if (isMultiplayer && isMultiplayerAuthority()) {
            Object.values(remotePlayers).forEach(rp => {
                if (!rp.isDead && rp.x !== undefined) activePlayerPositions.push({ x: rp.x, y: rp.y });
            });
        }

        // 1. Despawn burning mobs in daytime and distant hostile mobs so the mob cap dynamically refreshes around active players
        entities = entities.filter(e => {
            if (e instanceof AtlasExplorer) return !e.isDeparted;
            if (e instanceof Zombie || e instanceof Creeper || e instanceof Scorpion) {
                if (isDay && e instanceof Zombie) {
                    let headGx = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor((e.x + e.width / 2) / TILE_SIZE)));
                    let headGy = Math.max(0, Math.floor((e.y + 4) / TILE_SIZE));
                    let footGy = Math.max(0, Math.floor((e.y + e.height - 2) / TILE_SIZE));
                    let inWater = (typeof isWater === 'function' && isWater(headGx, footGy));
                    if (!inWater && hasDirectSkyAccess(headGx, headGy, true)) {
                        if (frameCount % 15 === 0) {
                            e.takeDamage(3, 0);
                            for (let p = 0; p < 2; p++) particles.push(new Particle(e.x + Math.random() * e.width, e.y + Math.random() * e.height * 0.7, '#ffaa00'));
                        }
                        if (e.health <= 0) return false;
                    }
                }
                let isNearAnyPlayer = activePlayerPositions.some(p => {
                    return Math.abs(e.x - p.x) < 45 * TILE_SIZE && Math.abs(e.y - p.y) < 32 * TILE_SIZE;
                });
                if (!isNearAnyPlayer) return false;
            }
            return e.health > 0;
        });

        if (forcePassive) {
            spawnAnimals(2, 0.35);
            return;
        }

        // Passive animals follow the daily respawn cycle and do not trickle-spawn during daytime

        // Hostile mobs (Zombies, Creepers, Scorpions) strictly do NOT spawn during daytime
        if (!isNight) return;
        if (diff.mobSpawn <= 0) return;

        // Controlled tick rate per difficulty: Easy checks every 60 frames (1s), Normal checks every 40 frames (~0.67s), Hard checks every 25 frames (~0.4s)
        let spawnInterval = 40;
        if (currentDifficulty === 'easy') spawnInterval = 60;
        else if (currentDifficulty === 'normal') spawnInterval = 40;
        else if (currentDifficulty === 'hard' || currentDifficulty === 'hardcore') spawnInterval = 25;

        if (frameCount % spawnInterval !== 0) return;

        const dayMultiplier = getDayDifficultyMultiplier();
        const hostileEntities = entities.filter(e => e instanceof Zombie || e instanceof Creeper || e instanceof Scorpion);
        const isHardMode = currentDifficulty === 'hard' || currentDifficulty === 'hardcore';
        
        let maxHostiles = 14;
        let spawnChance = 0.40;
        let packSize = 1;

        if (currentDifficulty === 'easy') {
            maxHostiles = Math.min(8, Math.floor(4 + (dayMultiplier - 1) * 3));
            spawnChance = 0.28;
            packSize = 1;
        } else if (currentDifficulty === 'normal') {
            maxHostiles = Math.min(14, Math.floor(7 + (dayMultiplier - 1) * 5));
            spawnChance = 0.42;
            packSize = (isNight && Math.random() < 0.15) ? 2 : 1;
        } else {
            // Hard / Hardcore
            maxHostiles = Math.min(42, Math.floor(18 + (dayMultiplier - 1) * 16));
            spawnChance = 0.65;
            packSize = (Math.random() < 0.40) ? (Math.floor(Math.random() * 2) + 2) : 1;
        }

        if (hostileEntities.length >= maxHostiles || Math.random() >= spawnChance) {
            return;
        }

        let chosenPlayer = activePlayerPositions[Math.floor(Math.random() * activePlayerPositions.length)];
        let pGx = Math.floor((chosenPlayer.x + (chosenPlayer.width || 24) / 2) / TILE_SIZE);
        let pGy = Math.floor((chosenPlayer.y + (chosenPlayer.height || 48)) / TILE_SIZE);
        let isPlayerInCave = pGy > getWorldSurfaceY(pGx) + CAVE_SKY_START_TILES;

        let tryCave = isPlayerInCave || isDay || Math.random() < 0.40;
        let spawnSide = Math.random() > 0.5 ? 1 : -1;

        const creeperChance = currentDifficulty === 'easy' ? 0.18 : 0.28;

        if (tryCave) {
            let foundX = -1;
            let foundY = -1;
            for (let attempt = 0; attempt < 28; attempt++) {
                let dist = 8 + Math.floor(Math.random() * 20);
                let candX = pGx + spawnSide * dist;
                if (candX < 2 || candX >= WORLD_WIDTH - 2) {
                    spawnSide = -spawnSide;
                    continue;
                }
                let surfY = getWorldSurfaceY(candX);
                // During daytime, hostiles MUST ONLY spawn deep subterranean (at least 8 blocks below surface)
                let minY = isDay ? (surfY + 8) : (isPlayerInCave ? Math.max(surfY + 2, pGy - 10) : surfY + 3);
                let maxY = isPlayerInCave ? Math.min(WORLD_HEIGHT - 3, pGy + 12) : WORLD_HEIGHT - 4;
                if (minY >= maxY) continue;

                let candY = minY + Math.floor(Math.random() * (maxY - minY));
                if (isDay && candY < surfY + 8) continue;

                let floorBlock = world[candX]?.[candY + 1];
                let feetBlock = world[candX]?.[candY];
                let headBlock = world[candX]?.[candY - 1];

                if (feetBlock === IDS.AIR && headBlock === IDS.AIR && floorBlock !== undefined && floorBlock !== IDS.AIR && floorBlock !== IDS.WATER && floorBlock !== IDS.LAVA) {
                    // MUST be sheltered deep underground with a solid roof overhead during the daytime
                    if (isDay && hasDirectSkyAccess(candX, candY, true)) {
                        continue;
                    }
                    if (!isNearTorch(candX, candY, 4)) {
                        foundX = candX;
                        foundY = candY;
                        break;
                    }
                }
            }

            if (foundX > 0 && foundY > 0) {
                const isDesert = (typeof getActiveBiomeAt === 'function' && getActiveBiomeAt(foundX) === 'desert');
                for (let k = 0; k < packSize; k++) {
                    if (entities.filter(e => e instanceof Zombie || e instanceof Creeper || e instanceof Scorpion).length >= maxHostiles) break;
                    let mobX = foundX * TILE_SIZE + (k * 16 * (Math.random() > 0.5 ? 1 : -1));
                    let mobY = (foundY - 1) * TILE_SIZE;
                    if (isDesert && Math.random() < 0.55) {
                        entities.push(new Scorpion(mobX, mobY));
                    } else if (Math.random() < creeperChance) {
                        entities.push(new Creeper(mobX, mobY));
                    } else {
                        entities.push(new Zombie(mobX, mobY));
                    }
                }
                return;
            }
        }

        // Surface spawning ONLY during the night
        if (isNight) {
            let dist = 10 + Math.floor(Math.random() * 22);
            let candX = pGx + spawnSide * dist;
            if (candX > 1 && candX < WORLD_WIDTH - 1) {
                let surfY = getWorldSurfaceY(candX);
                if (surfY > 0 && surfY < WORLD_HEIGHT - 2) {
                    let floorBlock = world[candX]?.[surfY];
                    let feetBlock = world[candX]?.[surfY - 1];
                    let headBlock = world[candX]?.[surfY - 2];
                    if (feetBlock === IDS.AIR && headBlock === IDS.AIR && floorBlock !== IDS.AIR && floorBlock !== IDS.WATER && floorBlock !== IDS.LAVA) {
                        if (!isNearTorch(candX, surfY - 1, 4)) {
                            const isDesert = (typeof getActiveBiomeAt === 'function' && getActiveBiomeAt(candX) === 'desert');
                            for (let k = 0; k < packSize; k++) {
                                if (entities.filter(e => e instanceof Zombie || e instanceof Creeper || e instanceof Scorpion).length >= maxHostiles) break;
                                let mobX = candX * TILE_SIZE + (k * 16 * (Math.random() > 0.5 ? 1 : -1));
                                let mobY = (surfY - 2) * TILE_SIZE;
                                if (isDesert && Math.random() < 0.55) {
                                    entities.push(new Scorpion(mobX, mobY));
                                } else if (Math.random() < creeperChance) {
                                    entities.push(new Creeper(mobX, mobY));
                                } else {
                                    entities.push(new Zombie(mobX, mobY));
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    export function ensureDesertScorpions() {
        if (typeof getActiveBiomeAt !== 'function' || !Array.isArray(entities)) return;
        const isNight = timeOfDay >= 0.68 && timeOfDay < 0.90;
        if (!isNight) return;
        const currentScorpions = entities.filter(e => e instanceof Scorpion).length;
        if (currentScorpions >= 3) return;
        for (let gx = 10; gx < WORLD_WIDTH - 10; gx += 12) {
            if (getActiveBiomeAt(gx) === 'desert') {
                let gy = 0; while (gy < WORLD_HEIGHT && world[gx]?.[gy] === IDS.AIR) gy++;
                if (gy > 0 && gy < WORLD_HEIGHT && world[gx]?.[gy] === IDS.SAND) {
                    entities.push(new Scorpion(gx * TILE_SIZE, (gy - 1) * TILE_SIZE));
                    if (entities.filter(e => e instanceof Scorpion).length >= 4) break;
                }
            }
        }
    }

    export function initCanvases() {
        if (!canvas && typeof document !== 'undefined') canvas = document.getElementById('gameCanvas');
        if (canvas && !ctx) ctx = canvas.getContext('2d', { alpha: false });
        if (!menuBgCanvas && typeof document !== 'undefined') menuBgCanvas = document.getElementById('menuBgCanvas');
        if (menuBgCanvas && !menuCtx) menuCtx = menuBgCanvas.getContext('2d', { alpha: false });
        if (!lightCanvas && typeof document !== 'undefined') {
            lightCanvas = document.createElement('canvas');
            lightCtx = lightCanvas.getContext('2d');
        }
        if (!auroraCanvas && typeof document !== 'undefined') {
            auroraCanvas = document.createElement('canvas');
            auroraCtx = auroraCanvas.getContext('2d');
        }
        resizeCanvases();
    }

    export function resizeCanvases() {
        if (!canvas && typeof document !== 'undefined') canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx = canvas.getContext('2d', { alpha: false });
        }
        if (!menuBgCanvas && typeof document !== 'undefined') menuBgCanvas = document.getElementById('menuBgCanvas');
        if (menuBgCanvas) {
            menuBgCanvas.width = window.innerWidth;
            menuBgCanvas.height = window.innerHeight;
            menuCtx = menuBgCanvas.getContext('2d', { alpha: false });
        }
        if (lightCanvas) {
            lightCanvas.width = Math.max(1, Math.ceil(window.innerWidth * LIGHT_SCALE));
            lightCanvas.height = Math.max(1, Math.ceil(window.innerHeight * LIGHT_SCALE));
        }
        if (typeof updateCachedVignette === 'function') {
            updateCachedVignette();
        }
    }

    if (typeof window !== 'undefined') {
        window.addEventListener('resize', resizeCanvases);
    }


    export function isLeafConnectedToWood(lx, ly, maxDistance = 4) {
        if (lx < 0 || lx >= WORLD_WIDTH || ly < 0 || ly >= WORLD_HEIGHT) return false;
        
        // Fast direct check
        for (let dx = -maxDistance; dx <= maxDistance; dx++) {
            for (let dy = -maxDistance; dy <= maxDistance; dy++) {
                if (Math.abs(dx) + Math.abs(dy) > maxDistance) continue;
                const nx = lx + dx;
                const ny = ly + dy;
                if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
                    const blk = world[nx][ny];
                    if ((blk === IDS.WOOD || blk === IDS.JUNGLE_WOOD) && Math.abs(dx) <= 1 && Math.abs(dy) <= 1) return true;
                }
            }
        }

        // BFS leaf/wood connectivity check
        const queue = [[lx, ly, 0]];
        const visited = new Set([`${lx}_${ly}`]);
        
        while (queue.length > 0) {
            const [cx, cy, dist] = queue.shift();
            const cur = world[cx]?.[cy];
            if (cur === IDS.WOOD || cur === IDS.JUNGLE_WOOD) return true;
            if (dist < maxDistance) {
                const neighbors = [
                    [cx + 1, cy], [cx - 1, cy],
                    [cx, cy + 1], [cx, cy - 1],
                    [cx + 1, cy + 1], [cx - 1, cy - 1],
                    [cx + 1, cy - 1], [cx - 1, cy + 1]
                ];
                for (const [nx, ny] of neighbors) {
                    const key = `${nx}_${ny}`;
                    if (!visited.has(key) && nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
                        const block = world[nx][ny];
                        if (block === IDS.WOOD || block === IDS.JUNGLE_WOOD) return true;
                        if (block === IDS.LEAVES || block === IDS.JUNGLE_LEAVES) {
                            visited.add(key);
                            queue.push([nx, ny, dist + 1]);
                        }
                    }
                }
            }
        }
        return false;
    }

    export function scheduleTreeLeafDecay(trunkX, trunkY = null) {
        const minY = (trunkY !== null && typeof trunkY === 'number') ? Math.max(0, trunkY - 14) : 0;
        const maxY = (trunkY !== null && typeof trunkY === 'number') ? Math.min(WORLD_HEIGHT - 1, trunkY + 4) : (WORLD_HEIGHT - 1);
        const minX = Math.max(0, trunkX - 6);
        const maxX = Math.min(WORLD_WIDTH - 1, trunkX + 6);

        const unassignedLeaves = [];
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const blk = world[x]?.[y];
                if ((blk === IDS.LEAVES || blk === IDS.JUNGLE_LEAVES) && !leafDecayQueue.has(`${x}_${y}`)) {
                    if (!isLeafConnectedToWood(x, y, 5)) {
                        unassignedLeaves.push({ x, y, blk });
                    }
                }
            }
        }

        if (unassignedLeaves.length === 0) return;

        // Group newly disconnected leaves into connected canopy components
        const visited = new Set();
        const leafMap = new Map();
        for (const leaf of unassignedLeaves) {
            leafMap.set(`${leaf.x}_${leaf.y}`, leaf);
        }

        let clusterSeq = 0;
        for (const leaf of unassignedLeaves) {
            const key = `${leaf.x}_${leaf.y}`;
            if (visited.has(key)) continue;

            const component = [];
            const queue = [leaf];
            visited.add(key);

            while (queue.length > 0) {
                const cur = queue.shift();
                component.push(cur);

                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const nKey = `${cur.x + dx}_${cur.y + dy}`;
                        if (leafMap.has(nKey) && !visited.has(nKey)) {
                            visited.add(nKey);
                            queue.push(leafMap.get(nKey));
                        }
                    }
                }
            }

            const clusterId = `tree_decay_${Date.now()}_${trunkX}_${clusterSeq++}_${Math.floor(Math.random() * 10000)}`;

            // Quota strictly between 0 and 2 oak saplings per tree!
            // 20% chance: 0 saplings, 50% chance: 1 sapling, 30% chance: 2 saplings
            const roll = Math.random();
            let targetSaplings = roll < 0.20 ? 0 : (roll < 0.70 ? 1 : 2);
            targetSaplings = Math.min(targetSaplings, component.length);

            treeDecayClusters.set(clusterId, {
                id: clusterId,
                type: leaf.blk === IDS.JUNGLE_LEAVES ? 'jungle' : 'oak',
                targetSaplings: targetSaplings,
                droppedSaplings: 0,
                leavesRemaining: component.length,
                totalLeaves: component.length
            });

            for (const l of component) {
                leafDecayQueue.set(`${l.x}_${l.y}`, {
                    delay: LEAF_DECAY_MIN_FRAMES + Math.floor(Math.random() * LEAF_DECAY_RANDOM_FRAMES),
                    clusterId: clusterId
                });
            }
        }
    }


    export function deliverLeafDecayItem(dropId, x, y, count = 1) {
        if (!dropId) return;
        const curPlayer = (typeof player !== 'undefined') ? player : (typeof window !== 'undefined' ? window.player : null);
        
        let targetPlayer = curPlayer;
        if (isMultiplayer && typeof remotePlayers !== 'undefined' && remotePlayers) {
            let pX = curPlayer ? curPlayer.x : 0;
            let pY = curPlayer ? curPlayer.y : 0;
            let minDist = Math.hypot(pX - (x * TILE_SIZE + TILE_SIZE / 2), pY - (y * TILE_SIZE + TILE_SIZE / 2));
            Object.values(remotePlayers).forEach(rp => {
                if (rp && !rp.isDead && rp.x !== undefined) {
                    let d = Math.hypot(rp.x - (x * TILE_SIZE + TILE_SIZE / 2), rp.y - (y * TILE_SIZE + TILE_SIZE / 2));
                    if (d < minDist) {
                        minDist = d;
                        targetPlayer = rp;
                    }
                }
            });
        }

        if (targetPlayer === curPlayer && curPlayer) {
            const given = giveItem(dropId, count);
            if (given) {
                if (typeof playSound === 'function') playSound('pop', { vol: 0.35 });
                if (typeof particles !== 'undefined' && Array.isArray(particles)) {
                    particles.push(new Particle(curPlayer.x + curPlayer.width / 2, curPlayer.y + 10, '#84cc16'));
                }
            } else {
                // Inventory full: drop right near player
                dropItemForWorld(dropId, curPlayer.x + curPlayer.width / 2, curPlayer.y, count);
            }
        } else if (isMultiplayer && isMultiplayerAuthority()) {
            const targetX = targetPlayer ? targetPlayer.x + (targetPlayer.width || 24) / 2 : x * TILE_SIZE + TILE_SIZE / 2;
            const targetY = targetPlayer ? targetPlayer.y + 10 : y * TILE_SIZE + TILE_SIZE / 2;
            dropItemForWorld(dropId, targetX, targetY, count);
        } else {
            const given = giveItem(dropId, count);
            if (!given && curPlayer) {
                dropItemForWorld(dropId, curPlayer.x + curPlayer.width / 2, curPlayer.y, count);
            }
        }
    }

    export function updateTreeLeafDecay() {
        for (let [key, val] of leafDecayQueue) {
            let delay = typeof val === 'object' && val !== null ? val.delay : val;
            const clusterId = typeof val === 'object' && val !== null ? val.clusterId : null;

            let [x, y] = key.split('_').map(Number);
            const blk = world[x]?.[y];
            if (blk !== IDS.LEAVES && blk !== IDS.JUNGLE_LEAVES) {
                if (clusterId && treeDecayClusters.has(clusterId)) {
                    const c = treeDecayClusters.get(clusterId);
                    c.leavesRemaining = Math.max(0, c.leavesRemaining - 1);
                    if (c.leavesRemaining <= 0) treeDecayClusters.delete(clusterId);
                }
                leafDecayQueue.delete(key);
                continue;
            }

            delay--;
            if (delay > 0) {
                if (typeof val === 'object' && val !== null) {
                    val.delay = delay;
                    leafDecayQueue.set(key, val);
                } else {
                    leafDecayQueue.set(key, delay);
                }
                continue;
            }

            if (isLeafConnectedToWood(x, y, 5)) {
                if (clusterId && treeDecayClusters.has(clusterId)) {
                    const c = treeDecayClusters.get(clusterId);
                    c.leavesRemaining = Math.max(0, c.leavesRemaining - 1);
                    if (c.leavesRemaining <= 0) treeDecayClusters.delete(clusterId);
                }
                leafDecayQueue.delete(key);
                continue;
            }

            world[x][y] = IDS.AIR;
            syncBlock(x, y, IDS.AIR);

            let cluster = (clusterId && treeDecayClusters.has(clusterId)) ? treeDecayClusters.get(clusterId) : null;
            if (cluster) {
                cluster.leavesRemaining = Math.max(0, cluster.leavesRemaining - 1);
                const saplingNeeded = cluster.targetSaplings - cluster.droppedSaplings;
                let droppedSapling = false;

                if (saplingNeeded > 0) {
                    if (cluster.leavesRemaining < saplingNeeded) {
                        droppedSapling = true;
                    } else {
                        const dropProb = saplingNeeded / (cluster.leavesRemaining + 1);
                        if (Math.random() < dropProb) droppedSapling = true;
                    }
                }

                if (droppedSapling) {
                    cluster.droppedSaplings++;
                    const dropId = (blk === IDS.JUNGLE_LEAVES) ? IDS.JUNGLE_SAPLING : IDS.SAPLING;
                    deliverLeafDecayItem(dropId, x, y, 1);
                } else {
                    // Secondary drops: apples, sticks, melon seeds
                    const roll = Math.random();
                    if (blk === IDS.JUNGLE_LEAVES) {
                        if (roll < 0.15) deliverLeafDecayItem(IDS.MELON_SEEDS, x, y, 1);
                        else if (roll < 0.35) deliverLeafDecayItem(IDS.STICK, x, y, 1);
                    } else {
                        if (roll < 0.05) deliverLeafDecayItem(IDS.APPLE, x, y, 1);
                        else if (roll < 0.25) deliverLeafDecayItem(IDS.STICK, x, y, 1);
                    }
                }

                if (cluster.leavesRemaining <= 0) {
                    treeDecayClusters.delete(clusterId);
                }
            } else {
                let roll = Math.random();
                if (blk === IDS.JUNGLE_LEAVES) {
                    if (roll < 0.10) deliverLeafDecayItem(IDS.JUNGLE_SAPLING, x, y, 1);
                    else if (roll < 0.25) deliverLeafDecayItem(IDS.MELON_SEEDS, x, y, 1);
                    else if (roll < 0.40) deliverLeafDecayItem(IDS.STICK, x, y, 1);
                } else {
                    if (roll < 0.10) deliverLeafDecayItem(IDS.SAPLING, x, y, 1);
                    else if (roll < 0.30) deliverLeafDecayItem(IDS.STICK, x, y, 1);
                    else if (roll < 0.35) deliverLeafDecayItem(IDS.APPLE, x, y, 1);
                }
            }

            leafDecayQueue.delete(key);
        }
    }

    export function growSaplingAt(x, y) {
        const sBlock = world[x]?.[y];
        if (sBlock !== IDS.SAPLING && sBlock !== IDS.JUNGLE_SAPLING) return;
        if (!canSaplingGrowAt(x, y)) {
            return;
        }
        saplingBlockedWarnings.delete(`${x}_${y}`);
        if (sBlock === IDS.JUNGLE_SAPLING) {
            world[x][y] = IDS.AIR;
            syncBlock(x, y, IDS.AIR);
            buildJungleTree(x, y + 1, 'giant');
            saplingGrowthQueue.delete(`${x}_${y}`);
            return;
        }
        const setTreeBlock = (blockX, blockY, blockId) => {
            if (blockX < 0 || blockX >= WORLD_WIDTH || blockY < 0 || blockY >= WORLD_HEIGHT) return;
            if (world[blockX][blockY] !== IDS.AIR && !(blockX === x && blockY === y)) return;
            world[blockX][blockY] = blockId;
            if (blockId === IDS.WOOD) nonCollidableTreeWood.add(`${blockX}_${blockY}`);
            syncBlock(blockX, blockY, blockId, blockId === IDS.WOOD ? { treeTrunk: true } : {});
        };
        const height = getSaplingGrowthHeight(x, y);
        setTreeBlock(x, y, IDS.WOOD);
        for (let trunkOffset = 1; trunkOffset <= height; trunkOffset++) setTreeBlock(x, y - trunkOffset, IDS.WOOD);
        const topY = y - height;
        if (height >= 6) {
            for (let leafX = -3; leafX <= 3; leafX++) {
                for (let leafY = -2; leafY <= 2; leafY++) {
                    if (Math.abs(leafX) + Math.abs(leafY) <= 4) {
                        setTreeBlock(x + leafX, topY + leafY, IDS.LEAVES);
                    }
                }
            }
            setTreeBlock(x, topY - 3, IDS.LEAVES);
        } else {
            for (let leafX = -2; leafX <= 2; leafX++) {
                for (let leafY = -2; leafY <= 1; leafY++) {
                    if (Math.abs(leafX) + Math.abs(leafY) <= 3 || (leafY === -2 && Math.abs(leafX) <= 1)) {
                        setTreeBlock(x + leafX, topY + leafY, IDS.LEAVES);
                    }
                }
            }
            setTreeBlock(x, topY - 2, IDS.LEAVES);
        }
        saplingGrowthQueue.delete(`${x}_${y}`);
    }

    export function getSaplingGrowthHeight(x, y) {
        return 4 + (Math.abs(x * 37 + y * 19) % 4);
    }

    export function canSaplingGrowAt(x, y) {
        const sBlock = world[x]?.[y];
        if ((sBlock !== IDS.SAPLING && sBlock !== IDS.JUNGLE_SAPLING) || ![IDS.DIRT, IDS.GRASS, IDS.PLOWED_DIRT].includes(world[x]?.[y + 1])) return false;
        if (sBlock === IDS.JUNGLE_SAPLING) {
            for (let dy = 1; dy <= 6; dy++) {
                if (y - dy < 0 || world[x][y - dy] !== IDS.AIR) return false;
            }
            return true;
        }
        const height = getSaplingGrowthHeight(x, y);
        const trunkCells = new Set();
        for (let trunkOffset = 0; trunkOffset <= height; trunkOffset++) trunkCells.add(`${x}_${y - trunkOffset}`);
        const topY = y - height;
        if (height >= 6) {
            for (let leafX = -3; leafX <= 3; leafX++) {
                for (let leafY = -2; leafY <= 2; leafY++) {
                    if (Math.abs(leafX) + Math.abs(leafY) <= 4) {
                        const blockX = x + leafX;
                        const blockY = topY + leafY;
                        if (blockX < 0 || blockX >= WORLD_WIDTH || blockY < 0 || blockY >= WORLD_HEIGHT) return false;
                        const cellKey = `${blockX}_${blockY}`;
                        if (world[blockX][blockY] !== IDS.AIR && !trunkCells.has(cellKey)) return false;
                    }
                }
            }
            if (topY - 3 < 0 || (world[x]?.[topY - 3] !== IDS.AIR && !trunkCells.has(`${x}_${topY - 3}`))) return false;
        } else {
            for (let leafX = -2; leafX <= 2; leafX++) {
                for (let leafY = -2; leafY <= 1; leafY++) {
                    if (Math.abs(leafX) + Math.abs(leafY) <= 3 || (leafY === -2 && Math.abs(leafX) <= 1)) {
                        const blockX = x + leafX;
                        const blockY = topY + leafY;
                        if (blockX < 0 || blockX >= WORLD_WIDTH || blockY < 0 || blockY >= WORLD_HEIGHT) return false;
                        const cellKey = `${blockX}_${blockY}`;
                        if (world[blockX][blockY] !== IDS.AIR && !trunkCells.has(cellKey)) return false;
                    }
                }
            }
            if (topY - 2 < 0 || (world[x]?.[topY - 2] !== IDS.AIR && !trunkCells.has(`${x}_${topY - 2}`))) return false;
        }
        return [...trunkCells].every(cellKey => {
            const [blockX, blockY] = cellKey.split('_').map(Number);
            return blockX >= 0 && blockX < WORLD_WIDTH && blockY >= 0 && blockY < WORLD_HEIGHT && (world[blockX][blockY] === IDS.AIR || (blockX === x && blockY === y));
        });
    }

    export function notifyBlockedSaplings() {
        for (const key of saplingBlockedWarnings) {
            const [x, y] = key.split('_').map(Number);
            if (world[x]?.[y] !== IDS.SAPLING) {
                saplingBlockedWarnings.delete(key);
            } else if (canSaplingGrowAt(x, y)) {
                saplingBlockedWarnings.delete(key);
            }
        }
    }

    export function updateSaplingGrowth() {
        for (let [key, growthAt] of saplingGrowthQueue) {
            let [x, y] = key.split('_').map(Number);
            if (world[x]?.[y] !== IDS.SAPLING) { saplingGrowthQueue.delete(key); continue; }
            if (dayCount + timeOfDay < growthAt) continue;
            if (!isMultiplayer || isMultiplayerAuthority()) growSaplingAt(x, y);
        }
    }

    export function checkWaterNearCrop(x, y) {
        if (!world || !world.length) return false;
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return false;
        const soilY = y + 1;
        for (let dx = -4; dx <= 4; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const wx = x + dx;
                const wy = soilY + dy;
                if (wx >= 0 && wx < WORLD_WIDTH && wy >= 0 && wy < WORLD_HEIGHT) {
                    if (world[wx]?.[wy] === IDS.WATER || (typeof isWater === 'function' && isWater(wx, wy)) || getFluid(wx, wy)?.type === IDS.WATER) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    export function registerPlantedCrop(x, y) {
        const hasWater = checkWaterNearCrop(x, y);
        const stageDuration = hasWater ? 1.0 : (4 / 3);
        const nextStageAt = dayCount + timeOfDay + stageDuration;
        cropGrowthQueue.set(`${x}_${y}`, {
            stage: 1,
            nextStageAt: nextStageAt,
            hasWater: hasWater
        });
        return hasWater;
    }

    export function updateCropGrowth() {
        if (!world || !world.length) return;
        if (isMultiplayer && !isMultiplayerAuthority()) return;

        for (let [key, info] of cropGrowthQueue) {
            const [x, y] = key.split('_').map(Number);
            const currentBlock = world[x]?.[y];
            const isCrop = currentBlock === IDS.WHEAT_STAGE_1 || currentBlock === IDS.WHEAT_STAGE_2 || currentBlock === IDS.WHEAT_STAGE_3 || currentBlock === IDS.WHEAT_STAGE_4 || currentBlock === IDS.MELON_STEM;
            if (!isCrop) {
                cropGrowthQueue.delete(key);
                continue;
            }

            if (world[x]?.[y + 1] !== IDS.PLOWED_DIRT) {
                cropGrowthQueue.delete(key);
                if (currentBlock === IDS.MELON_STEM) {
                    spawnDroppedItem(IDS.MELON_SEEDS, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 1);
                } else if (currentBlock === IDS.WHEAT_STAGE_4) {
                    spawnDroppedItem(IDS.WHEAT, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 1);
                    spawnDroppedItem(IDS.SEEDS, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 2);
                } else if (currentBlock === IDS.WHEAT_STAGE_3) {
                    spawnDroppedItem(IDS.WHEAT, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 1);
                } else {
                    spawnDroppedItem(IDS.SEEDS, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 1);
                }
                world[x][y] = IDS.AIR;
                syncBlock(x, y, IDS.AIR);
                continue;
            }

            if (currentBlock === IDS.MELON_STEM) {
                if (dayCount + timeOfDay >= info.nextStageAt) {
                    const melonDirections = [-1, 1].sort(() => Math.random() - 0.5);
                    for (let dx of melonDirections) {
                        const mx = x + dx;
                        if (mx >= 0 && mx < WORLD_WIDTH && world[mx]?.[y] === IDS.AIR && [IDS.DIRT, IDS.GRASS, IDS.PLOWED_DIRT].includes(world[mx]?.[y + 1])) {
                            world[mx][y] = IDS.MELON;
                            syncBlock(mx, y, IDS.MELON);
                            for (let p = 0; p < 4; p++) {
                                particles.push(new Particle(mx * TILE_SIZE + Math.random() * TILE_SIZE, y * TILE_SIZE + Math.random() * TILE_SIZE, '#22c55e'));
                            }
                            break;
                        }
                    }
                    const stageDuration = info.hasWater ? 1.5 : 2.5;
                    info.nextStageAt = dayCount + timeOfDay + stageDuration;
                }
                continue;
            }

            if (currentBlock === IDS.WHEAT_STAGE_4 || info.stage >= 4) {
                continue;
            }

            const hasWater = checkWaterNearCrop(x, y);
            if (hasWater !== info.hasWater) {
                const oldTotal = info.hasWater ? 1.0 : (4 / 3);
                const newTotal = hasWater ? 1.0 : (4 / 3);
                const remaining = Math.max(0, info.nextStageAt - (dayCount + timeOfDay));
                const ratio = remaining / oldTotal;
                info.nextStageAt = (dayCount + timeOfDay) + ratio * newTotal;
                info.hasWater = hasWater;
            }

            if (dayCount + timeOfDay >= info.nextStageAt) {
                let nextBlock = currentBlock;
                let nextStage = info.stage;

                if (currentBlock === IDS.WHEAT_STAGE_1) {
                    nextBlock = IDS.WHEAT_STAGE_2;
                    nextStage = 2;
                } else if (currentBlock === IDS.WHEAT_STAGE_2) {
                    nextBlock = IDS.WHEAT_STAGE_3;
                    nextStage = 3;
                } else if (currentBlock === IDS.WHEAT_STAGE_3) {
                    nextBlock = IDS.WHEAT_STAGE_4;
                    nextStage = 4;
                }

                world[x][y] = nextBlock;
                syncBlock(x, y, nextBlock);

                const sparkColor = nextStage === 4 ? '#facc15' : (nextStage === 3 ? '#a3e635' : '#4ade80');
                for (let p = 0; p < 4; p++) {
                    particles.push(new Particle(x * TILE_SIZE + Math.random() * TILE_SIZE, y * TILE_SIZE + Math.random() * TILE_SIZE, sparkColor));
                }

                if (nextStage >= 4) {
                    info.stage = 4;
                } else {
                    info.stage = nextStage;
                    const stageDuration = info.hasWater ? 1.0 : (4 / 3);
                    info.nextStageAt = dayCount + timeOfDay + stageDuration;
                }
            }
        }
    }

    export function scheduleDirtToGrass(x, y) {
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return;
        if (world[x]?.[y] !== IDS.DIRT) return;
        if (typeof getActiveBiomeAt === 'function' && getActiveBiomeAt(x) === 'desert') return;
        const above = world[x]?.[y - 1];
        if (above !== undefined && isSolidWorldBlock(x, y - 1, above)) return;
        if (!dirtToGrassQueue.has(`${x}_${y}`)) {
            const growAt = dayCount + timeOfDay + DIRT_TO_GRASS_DAYS + (Math.random() * 0.5);
            dirtToGrassQueue.set(`${x}_${y}`, growAt);
        }
    }

    export function scheduleSnowRegrowth(x, y) {
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return;
        const isSnowBiome = (typeof getActiveBiomeAt === 'function' && getActiveBiomeAt(x) === 'snow') || (y < Math.floor(WORLD_HEIGHT / 2) - 30);
        if (!isSnowBiome) return;
        if (!snowRegrowthQueue.has(`${x}_${y}`)) {
            const regrowAt = dayCount + timeOfDay + SNOW_REGROWTH_DAYS + (Math.random() * 0.5);
            snowRegrowthQueue.set(`${x}_${y}`, regrowAt);
        }
    }

    export function updateNaturalRegrowth() {
        if (isMultiplayer && !isMultiplayerAuthority()) return;

        // 1. Process queued dirt-to-grass growth
        for (let [key, growAt] of dirtToGrassQueue) {
            let [x, y] = key.split('_').map(Number);
            if (world[x]?.[y] !== IDS.DIRT) { dirtToGrassQueue.delete(key); continue; }
            const above = world[x]?.[y - 1];
            if (above !== undefined && isSolidWorldBlock(x, y - 1, above)) {
                dirtToGrassQueue.delete(key);
                continue;
            }
            if (dayCount + timeOfDay >= growAt) {
                dirtToGrassQueue.delete(key);
                world[x][y] = IDS.GRASS;
                syncBlock(x, y, IDS.GRASS);
            }
        }

        // 2. Process queued snow regrowth
        for (let [key, regrowAt] of snowRegrowthQueue) {
            let [x, y] = key.split('_').map(Number);
            if (world[x]?.[y] === IDS.SNOW) { snowRegrowthQueue.delete(key); continue; }
            if (dayCount + timeOfDay < regrowAt) continue;

            const isSnowBiome = (typeof getActiveBiomeAt === 'function' && getActiveBiomeAt(x) === 'snow') || (y < Math.floor(WORLD_HEIGHT / 2) - 30);
            if (!isSnowBiome) { snowRegrowthQueue.delete(key); continue; }

            // If empty air sitting above a solid block
            if (world[x]?.[y] === IDS.AIR && isSolidWorldBlock(x, y + 1, world[x]?.[y + 1])) {
                world[x][y] = IDS.SNOW;
                syncBlock(x, y, IDS.SNOW);
                snowRegrowthQueue.delete(key);
            }
            // Or if top surface was reduced to dirt/grass in snow biome
            else if ((world[x]?.[y] === IDS.DIRT || world[x]?.[y] === IDS.GRASS) && (world[x]?.[y - 1] === IDS.AIR || !isSolidWorldBlock(x, y - 1, world[x]?.[y - 1]))) {
                world[x][y] = IDS.SNOW;
                syncBlock(x, y, IDS.SNOW);
                snowRegrowthQueue.delete(key);
            }
            else {
                // If cell was covered or altered, regrow on top surface of column if applicable
                const surfY = getWorldSurfaceY(x);
                if (surfY < WORLD_HEIGHT && (world[x]?.[surfY] === IDS.DIRT || world[x]?.[surfY] === IDS.GRASS)) {
                    world[x][surfY] = IDS.SNOW;
                    syncBlock(x, surfY, IDS.SNOW);
                }
                snowRegrowthQueue.delete(key);
            }
        }

        // 3. Random natural ambient spread around all active players (local & remote)
        if (frameCount % 30 === 0 && player) {
            const playerPositions = [player.x + player.width / 2];
            if (isMultiplayer && typeof remotePlayers === 'object') {
                Object.values(remotePlayers).forEach(rp => {
                    if (Number.isFinite(rp.x)) playerPositions.push(rp.x + 14);
                });
            }

            playerPositions.forEach(pX => {
                const centerGx = Math.floor(pX / TILE_SIZE);
                for (let i = 0; i < 4; i++) {
                    const randX = Math.max(0, Math.min(WORLD_WIDTH - 1, centerGx + Math.floor((Math.random() - 0.5) * 60)));
                    const surfY = getWorldSurfaceY(randX);
                    if (surfY >= 0 && surfY < WORLD_HEIGHT) {
                        const block = world[randX]?.[surfY];
                        const biome = typeof getActiveBiomeAt === 'function' ? getActiveBiomeAt(randX) : 'plains';
                        // Snow biome natural snow coverage
                        if (biome === 'snow' || (biome === 'mountains' && surfY < Math.floor(WORLD_HEIGHT / 2) - 30)) {
                            if ((block === IDS.DIRT || block === IDS.GRASS) && (world[randX]?.[surfY - 1] === IDS.AIR || !isSolidWorldBlock(randX, surfY - 1, world[randX]?.[surfY - 1]))) {
                                scheduleSnowRegrowth(randX, surfY);
                            }
                        }
                        // Plains/forest natural grass spread on exposed dirt
                        else if (biome !== 'desert' && block === IDS.DIRT && (world[randX]?.[surfY - 1] === IDS.AIR || !isSolidWorldBlock(randX, surfY - 1, world[randX]?.[surfY - 1]))) {
                            const hasNearbyGrass = (randX > 0 && world[randX - 1]?.[surfY] === IDS.GRASS) ||
                                                   (randX < WORLD_WIDTH - 1 && world[randX + 1]?.[surfY] === IDS.GRASS) ||
                                                   (randX > 0 && world[randX - 1]?.[surfY - 1] === IDS.GRASS) ||
                                                   (randX < WORLD_WIDTH - 1 && world[randX + 1]?.[surfY - 1] === IDS.GRASS) ||
                                                   (randX > 0 && world[randX - 1]?.[surfY + 1] === IDS.GRASS) ||
                                                   (randX < WORLD_WIDTH - 1 && world[randX + 1]?.[surfY + 1] === IDS.GRASS);
                            if (hasNearbyGrass) {
                                scheduleDirtToGrass(randX, surfY);
                            }
                        }
                        // If an existing grass block has become covered by a solid block, smother it back into dirt
                        else if (block === IDS.GRASS && isSolidWorldBlock(randX, surfY - 1, world[randX]?.[surfY - 1])) {
                            world[randX][surfY] = IDS.DIRT;
                            syncBlock(randX, surfY, IDS.DIRT);
                        }
                    }
                }
            });
        }
    }

    export function processDroppedItems() {
        for (let drop of droppedItems) drop.update();
        let pickup = droppedItems.find(drop => Math.hypot(player.x + player.width / 2 - (drop.x + drop.width / 2), player.y + player.height / 2 - (drop.y + drop.height / 2)) < TILE_SIZE * 0.9 && drop.count > 0);
        if (!pickup) return;
        if (!isMultiplayer || isMultiplayerAuthority()) {
            if (giveItem(pickup.itemId, pickup.count)) droppedItems = droppedItems.filter(drop => drop !== pickup);
        } else if (pendingPickupRequest !== pickup.dropId) {
            pendingPickupRequest = pickup.dropId;
            broadcastDataPacket({
                type: 'pickup_request',
                dropId: pickup.dropId,
                uid: window.user?.uid || window.fbAuth?.currentUser?.uid
            });
        }
    }


    export function getMobTarget(mob) {
        let targets = player.isDead ? [] : [{ x: player.x, y: player.y, width: player.width, height: player.height, isRemote: false }];
        if (isMultiplayer && isMultiplayerAuthority()) {
            Object.entries(remotePlayers).forEach(([id, remotePlayer]) => {
                if (remotePlayer.isDead || remotePlayer.isDisconnected || (remotePlayer.lastSeenLocalTime && Date.now() - remotePlayer.lastSeenLocalTime > 15000)) return;
                targets.push({ ...remotePlayer, id, width: TILE_SIZE * 0.75, height: TILE_SIZE * 1.8, isRemote: true });
            });
        }
        return targets
            .filter(target => Math.abs(target.x - mob.x) < TILE_SIZE * 16)
            .sort((first, second) => Math.abs(first.x - mob.x) - Math.abs(second.x - mob.x))[0] || null;
    }
    export const getZombieTarget = getMobTarget;


    export function updateCamera(dtFactor = 1.0) {
        const curPlayer = player || (typeof window !== 'undefined' ? window.player : null);
        const curCanvas = canvas || (typeof window !== 'undefined' ? window.canvas : null);
        if (!curPlayer || !curCanvas) return;
        let targetX = curPlayer.x + (curPlayer.width || 24) / 2 - curCanvas.width / 2;
        let targetY = curPlayer.y + (curPlayer.height || 48) / 2 - curCanvas.height / 2;
        const lerpX = 1 - Math.pow(1 - 0.20, dtFactor);
        const lerpY = 1 - Math.pow(1 - 0.15, dtFactor);
        camera.x += (targetX - camera.x) * lerpX; 
        camera.y += (targetY - camera.y) * lerpY; 
        if (Math.abs(targetX - camera.x) < 0.1) camera.x = targetX;
        if (Math.abs(targetY - camera.y) < 0.1) camera.y = targetY;
        
        // Let camera go beyond bounds for ocean rendering effect, but keep it mostly clamped
        camera.x = Math.max(-curCanvas.width / 3, Math.min(camera.x, WORLD_WIDTH * TILE_SIZE - curCanvas.width + curCanvas.width / 3));
        camera.y = Math.max(0, Math.min(camera.y, WORLD_HEIGHT * TILE_SIZE - curCanvas.height));
    }

    export const SKY_STARS = Array.from({ length: 70 }, (_, index) => ({
        x: ((index * 47) % 101) / 100,
        y: 0.06 + ((index * 29) % 52) / 100,
        size: index % 9 === 0 ? 2 : 1,
        brightness: 0.45 + (index % 5) * 0.1
    }));

    export const SKY_STARS_BUCKETS = [
        SKY_STARS.filter(s => Math.abs(s.brightness - 0.45) < 0.01),
        SKY_STARS.filter(s => Math.abs(s.brightness - 0.55) < 0.01),
        SKY_STARS.filter(s => Math.abs(s.brightness - 0.65) < 0.01),
        SKY_STARS.filter(s => Math.abs(s.brightness - 0.75) < 0.01),
        SKY_STARS.filter(s => Math.abs(s.brightness - 0.85) < 0.01),
    ];
    export const SKY_STAR_BRIGHTNESSES = [0.45, 0.55, 0.65, 0.75, 0.85];

    export const DAYLIGHT_TOP = [83, 168, 255];
    export const DAYLIGHT_BOTTOM = [135, 206, 235];
    export const TWILIGHT_TOP = [102, 88, 145];
    export const TWILIGHT_BOTTOM = [224, 128, 78];
    export const NIGHT_TOP = [3, 8, 28];
    export const NIGHT_BOTTOM = [12, 20, 54];
    export const skyTopColor = [83, 168, 255];
    export const skyBottomColor = [135, 206, 235];

    export function smoothStep(value) {
        return value * value * (3 - 2 * value);
    }

    export function blendColor(from, to, amount, out = [0, 0, 0]) {
        out[0] = Math.round(from[0] + (to[0] - from[0]) * amount);
        out[1] = Math.round(from[1] + (to[1] - from[1]) * amount);
        out[2] = Math.round(from[2] + (to[2] - from[2]) * amount);
        return out;
    }

    export function drawDynamicSky(targetCtx, w, h, time) {
        let duskAmount = time >= 0.58 && time < 0.68 ? smoothStep(Math.min(1, (time - 0.58) / 0.10)) : 0;
        let dawnAmount = time >= 0.90 ? smoothStep(Math.min(1, (time - 0.90) / 0.10)) : time < 0.04 ? 1 : 0;
        let nightAmount = 0;
        if (time >= 0.58 && time < 0.68) nightAmount = duskAmount;
        else if (time >= 0.68 && time < 0.90) nightAmount = 1;
        else if (time >= 0.90) nightAmount = 1 - dawnAmount;
        else if (time < 0.04) nightAmount = 1 - smoothStep(time / 0.04);
        let topColor = DAYLIGHT_TOP;
        let bottomColor = DAYLIGHT_BOTTOM;
        if (time >= 0.58 && time < 0.68) {
            let sunsetProgress = duskAmount;
            if (sunsetProgress < 0.5) {
                let sunsetBlend = smoothStep(sunsetProgress * 2);
                topColor = blendColor(DAYLIGHT_TOP, TWILIGHT_TOP, sunsetBlend, skyTopColor);
                bottomColor = blendColor(DAYLIGHT_BOTTOM, TWILIGHT_BOTTOM, sunsetBlend, skyBottomColor);
            } else {
                let nightBlend = smoothStep((sunsetProgress - 0.5) * 2);
                topColor = blendColor(TWILIGHT_TOP, NIGHT_TOP, nightBlend, skyTopColor);
                bottomColor = blendColor(TWILIGHT_BOTTOM, NIGHT_BOTTOM, nightBlend, skyBottomColor);
            }
        } else if (time >= 0.68 && time < 0.90) {
            topColor = NIGHT_TOP;
            bottomColor = NIGHT_BOTTOM;
        } else if (time >= 0.90 || time < 0.04) {
            let sunriseProgress = time >= 0.90 ? (time - 0.90) / 0.14 : (time + 0.10) / 0.14;
            sunriseProgress = Math.max(0, Math.min(1, sunriseProgress));
            if (sunriseProgress < 0.5) {
                let twilightBlend = smoothStep(sunriseProgress * 2);
                topColor = blendColor(NIGHT_TOP, TWILIGHT_TOP, twilightBlend, skyTopColor);
                bottomColor = blendColor(NIGHT_BOTTOM, TWILIGHT_BOTTOM, twilightBlend, skyBottomColor);
            } else {
                let daylightBlend = smoothStep((sunriseProgress - 0.5) * 2);
                topColor = blendColor(TWILIGHT_TOP, DAYLIGHT_TOP, daylightBlend, skyTopColor);
                bottomColor = blendColor(TWILIGHT_BOTTOM, DAYLIGHT_BOTTOM, daylightBlend, skyBottomColor);
            }
        }

        let grad = targetCtx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgb(' + topColor[0] + ',' + topColor[1] + ',' + topColor[2] + ')');
        grad.addColorStop(1, 'rgb(' + bottomColor[0] + ',' + bottomColor[1] + ',' + bottomColor[2] + ')');
        targetCtx.fillStyle = grad;
        targetCtx.fillRect(0, 0, w, h);

        if (nightAmount > 0) {
            targetCtx.fillStyle = '#ffffff';
            for (let b = 0; b < 5; b++) {
                targetCtx.globalAlpha = SKY_STAR_BRIGHTNESSES[b] * nightAmount;
                const bucket = SKY_STARS_BUCKETS[b];
                for (let i = 0; i < bucket.length; i++) {
                    const star = bucket[i];
                    targetCtx.fillRect(Math.floor(star.x * w), Math.floor(star.y * h), star.size, star.size);
                }
            }
            targetCtx.globalAlpha = 1;
        }
    }

    export function drawMountains(targetCtx, camX, h, time, w, offsetX = 0, offsetY = 0) {
        let darkFactor = 1;
        if (time >= 0.58 && time < 0.68) darkFactor = 1 - (time - 0.58) * 8; 
        else if (time >= 0.68 && time < 0.90) darkFactor = 0.2;
        else if (time >= 0.90) darkFactor = 0.2 + (time - 0.90) * 8;
        darkFactor = Math.max(0.12, Math.min(1, darkFactor));

        const isSunset = (time >= 0.58 && time < 0.68);
        const step = 8;
        const maxCols = Math.ceil(w / step) + 4;

        if (!drawMountains.y1 || drawMountains.y1.length < maxCols) {
            drawMountains.y1 = new Int32Array(maxCols);
            drawMountains.y2 = new Int32Array(maxCols);
            drawMountains.y3 = new Int32Array(maxCols);
        }
        const y1 = drawMountains.y1;
        const y2 = drawMountains.y2;
        const y3 = drawMountains.y3;

        // ====================================================
        // LAYER 1: Distant Glacial Summits (8px voxels)
        // ====================================================
        const factor1 = 0.045;
        const baseH1 = h * 0.70 + offsetY * 0.25;
        const snowLine1 = h * 0.46 + offsetY * 0.25;

        let c1R = Math.floor(62 * darkFactor), c1G = Math.floor(78 * darkFactor), c1B = Math.floor(102 * darkFactor);
        let s1R = Math.floor(235 * darkFactor), s1G = Math.floor(245 * darkFactor), s1B = Math.floor(255 * darkFactor);

        if (isSunset) {
            c1R = Math.floor(88 * darkFactor); c1G = Math.floor(64 * darkFactor); c1B = Math.floor(92 * darkFactor);
            s1R = Math.floor(255 * darkFactor); s1G = Math.floor(195 * darkFactor); s1B = Math.floor(180 * darkFactor);
        }

        let nCols1 = 0;
        for (let x = -step; x <= w + step; x += step) {
            const wx = x + camX * factor1 + offsetX * 0.35;
            const s1 = Math.sin(wx * 0.0028);
            const s2 = Math.sin(wx * 0.0075 + 1.4);
            const s3 = Math.cos(wx * 0.0160 + 2.1);
            const r1 = 1 - Math.abs(s1);
            const r2 = 1 - Math.abs(s2);
            const peak = (r1 * 0.7 + r2 * 0.3) * (r1 * 0.5 + 0.5);
            y1[nCols1++] = Math.floor((baseH1 - (peak * 210 + s3 * 50)) / step) * step;
        }

        targetCtx.fillStyle = `rgb(${c1R},${c1G},${c1B})`;
        targetCtx.beginPath();
        targetCtx.moveTo(0, h);
        for (let i = 0; i < nCols1; i++) {
            const x = -step + i * step;
            targetCtx.lineTo(x, y1[i]);
            targetCtx.lineTo(x + step, y1[i]);
        }
        targetCtx.lineTo(w, h);
        targetCtx.closePath();
        targetCtx.fill();

        // Snow caps
        targetCtx.fillStyle = `rgb(${s1R},${s1G},${s1B})`;
        for (let i = 0; i < nCols1; i++) {
            const my = y1[i];
            if (my < snowLine1) {
                targetCtx.fillRect(-step + i * step, my, step, step);
            }
        }

        // ====================================================
        // LAYER 2: Mid Stony Mountain Terraces (8px voxels)
        // ====================================================
        const factor2 = 0.12;
        const baseH2 = h * 0.82 + offsetY * 0.50;
        const snowLine2 = h * 0.54 + offsetY * 0.50;

        let c2R = Math.floor(48 * darkFactor), c2G = Math.floor(62 * darkFactor), c2B = Math.floor(78 * darkFactor);
        let c2HighR = Math.floor(68 * darkFactor), c2HighG = Math.floor(84 * darkFactor), c2HighB = Math.floor(104 * darkFactor);

        if (isSunset) {
            c2HighR = Math.floor(105 * darkFactor); c2HighG = Math.floor(75 * darkFactor); c2HighB = Math.floor(70 * darkFactor);
        }

        let nCols2 = 0;
        for (let x = -step; x <= w + step; x += step) {
            const wx = x + camX * factor2 + offsetX * 0.65 + 650;
            const s1 = Math.sin(wx * 0.0038);
            const s2 = Math.sin(wx * 0.0102 + 1.4);
            const s3 = Math.cos(wx * 0.0220 + 2.1);
            const r1 = 1 - Math.abs(s1);
            const r2 = 1 - Math.abs(s2);
            const peak = (r1 * 0.7 + r2 * 0.3) * (r1 * 0.5 + 0.5);
            y2[nCols2++] = Math.floor((baseH2 - (peak * 145 + s3 * 38)) / step) * step;
        }

        targetCtx.fillStyle = `rgb(${c2R},${c2G},${c2B})`;
        targetCtx.beginPath();
        targetCtx.moveTo(0, h);
        for (let i = 0; i < nCols2; i++) {
            const x = -step + i * step;
            targetCtx.lineTo(x, y2[i]);
            targetCtx.lineTo(x + step, y2[i]);
        }
        targetCtx.lineTo(w, h);
        targetCtx.closePath();
        targetCtx.fill();

        // Facet highlights
        targetCtx.fillStyle = `rgb(${c2HighR},${c2HighG},${c2HighB})`;
        for (let i = 0; i < nCols2; i++) {
            const x = -step + i * step;
            targetCtx.fillRect(x, y2[i], step, 2);
        }

        // ====================================================
        // LAYER 3: Near Taiga Foothills & Spruce Trees (8px voxels)
        // ====================================================
        const factor3 = 0.24;
        const baseH3 = h * 0.92 + offsetY * 0.80;

        let c3R = Math.floor(26 * darkFactor), c3G = Math.floor(58 * darkFactor), c3B = Math.floor(36 * darkFactor);
        let c3HighR = Math.floor(40 * darkFactor), c3HighG = Math.floor(82 * darkFactor), c3HighB = Math.floor(50 * darkFactor);

        if (isSunset) {
            c3HighR = Math.floor(75 * darkFactor); c3HighG = Math.floor(70 * darkFactor); c3HighB = Math.floor(30 * darkFactor);
        }

        let nCols3 = 0;
        for (let x = -step; x <= w + step; x += step) {
            const wx = x + camX * factor3 + offsetX * 0.95 + 1200;
            y3[nCols3++] = Math.floor((baseH3 - (Math.abs(Math.sin(wx * 0.0035)) * 70 + Math.cos(wx * 0.0085) * 24)) / step) * step;
        }

        targetCtx.fillStyle = `rgb(${c3R},${c3G},${c3B})`;
        targetCtx.beginPath();
        targetCtx.moveTo(0, h);
        for (let i = 0; i < nCols3; i++) {
            const x = -step + i * step;
            targetCtx.lineTo(x, y3[i]);
            targetCtx.lineTo(x + step, y3[i]);
        }
        targetCtx.lineTo(w, h);
        targetCtx.closePath();
        targetCtx.fill();

        // Grass ridge highlights
        targetCtx.fillStyle = `rgb(${c3HighR},${c3HighG},${c3HighB})`;
        for (let i = 0; i < nCols3; i++) {
            targetCtx.fillRect(-step + i * step, y3[i], step, 2);
        }

        // Pixel-Art Spruce Trees along Foothill Terraces (Smooth parallax, zero jiggling, nicely spaced)
        const trunkCol = `rgb(${Math.floor(62 * darkFactor)},${Math.floor(40 * darkFactor)},${Math.floor(22 * darkFactor)})`;
        const pineTopCol = `rgb(${Math.floor(18 * darkFactor)},${Math.floor(46 * darkFactor)},${Math.floor(26 * darkFactor)})`;
        const pineMidCol = `rgb(${Math.floor(24 * darkFactor)},${Math.floor(58 * darkFactor)},${Math.floor(34 * darkFactor)})`;
        const pineBotCol = `rgb(${Math.floor(26 * darkFactor)},${Math.floor(68 * darkFactor)},${Math.floor(38 * darkFactor)})`;

        const layerX = camX * factor3 + offsetX * 0.95 + 1200;
        const treeSpacing = 160; // Rarer and nicely spaced out
        const minTreeWorldX = Math.floor((layerX - 40) / treeSpacing) * treeSpacing;
        const maxTreeWorldX = Math.ceil((layerX + w + 40) / treeSpacing) * treeSpacing;

        for (let twx = minTreeWorldX; twx <= maxTreeWorldX; twx += treeSpacing) {
            const jitter = Math.sin(twx * 0.045) * 40;
            const treeWx = twx + jitter;
            
            // Deterministic hash to make trees rarer and natural
            const treeHash = Math.abs(Math.sin(twx * 0.173 + 0.8));
            if (treeHash < 0.45) continue;

            const rawY = baseH3 - (Math.abs(Math.sin(treeWx * 0.0035)) * 70 + Math.cos(treeWx * 0.0085) * 24);
            const ty = Math.floor(rawY / step) * step;
            if (ty >= h - 25) continue;

            // Project smoothly onto screen X with zero jitter
            const tx = Math.round(treeWx - layerX);
            if (tx < -20 || tx > w + 20) continue;

            // Trunk
            targetCtx.fillStyle = trunkCol;
            targetCtx.fillRect(tx, ty - 4, 2, 4);

            // Stepped Spruce foliage
            targetCtx.fillStyle = pineTopCol;
            targetCtx.fillRect(tx, ty - 18, 2, 3);
            targetCtx.fillStyle = pineMidCol;
            targetCtx.fillRect(tx - 2, ty - 15, 6, 3);
            targetCtx.fillStyle = pineTopCol;
            targetCtx.fillRect(tx - 4, ty - 12, 10, 4);
            targetCtx.fillStyle = pineBotCol;
            targetCtx.fillRect(tx - 6, ty - 8, 14, 4);
        }
    }

    export const MENU_WORLD_WIDTH = 128;
    export const MENU_WORLD_HEIGHT = 160;
    export const MENU_SURFACE_Y = 56;
    export let menuCamX = 0;
    export let menuParallaxX = 0;
    export let menuParallaxY = 0;
    export let menuWorldSeed = (Math.random() * 0xffffffff) >>> 0;
    export let menuWorld = { terrain: [], surfaceHeights: [], blocks: [], trees: [], animals: [], fireflies: [], stars: [], width: 240 };
    export let menuWorldInitialized = false;
    export let menuEntities = [];
    export let menuTime = 0.20 + Math.random() * 0.15;
    export let menuLastFrame = performance.now();

    export let menuFireflies = Array.from({ length: 48 }, (_, i) => ({
        x: Math.random() * 2000,
        y: Math.random() * 800,
        type: i < 16 ? 'firefly' : (i < 34 ? 'spore' : 'leaf'),
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.25,
        phase: Math.random() * Math.PI * 2,
        size: 2 + Math.random() * 2,
        color: ['#bbf7d0', '#86efac', '#fef08a', '#4ade80'][Math.floor(Math.random() * 4)],
        leafColor: ['#15803d', '#22c55e', '#4ade80'][Math.floor(Math.random() * 3)]
    }));

    export function drawMenuFireflies(targetCtx, w, h, camX, camY) {
        targetCtx.save();
        for (let i = 0; i < menuFireflies.length; i++) {
            const f = menuFireflies[i];
            f.phase += 0.035;

            if (f.type === 'leaf') {
                f.x += 0.35 + Math.sin(f.phase) * 0.6;
                f.y += 0.55;
            } else if (f.type === 'spore') {
                f.x += 0.2 + Math.sin(f.phase) * 0.3;
                f.y -= 0.15 + Math.cos(f.phase * 0.8) * 0.2;
            } else {
                f.x += f.vx;
                f.y += f.vy;
            }

            if (f.x < camX - 100) f.x = camX + w + 50;
            if (f.x > camX + w + 100) f.x = camX - 50;
            if (f.y < camY - 50) f.y = camY + h;
            if (f.y > camY + h + 50) f.y = camY;

            const screenX = f.x - camX;
            const screenY = f.y - camY;
            if (screenX >= -10 && screenX <= w + 10 && screenY >= -10 && screenY <= h + 10) {
                if (f.type === 'leaf') {
                    targetCtx.fillStyle = f.leafColor;
                    targetCtx.fillRect(Math.floor(screenX), Math.floor(screenY), 3, 2);
                    targetCtx.fillStyle = '#166534';
                    targetCtx.fillRect(Math.floor(screenX + 1), Math.floor(screenY + 1), 2, 2);
                } else if (f.type === 'spore') {
                    const pulse = (Math.sin(f.phase) + 1) * 0.5;
                    targetCtx.fillStyle = 'rgba(254, 240, 138, 0.35)';
                    targetCtx.fillRect(Math.floor(screenX - 1), Math.floor(screenY - 1), f.size + 2, f.size + 2);
                    targetCtx.fillStyle = f.color;
                    targetCtx.fillRect(Math.floor(screenX), Math.floor(screenY), f.size, f.size);
                } else {
                    const pulse = (Math.sin(f.phase) + 1) * 0.5;
                    if (pulse > 0.08) {
                        targetCtx.fillStyle = `rgba(180, 255, 90, ${pulse * 0.85})`;
                        targetCtx.fillRect(Math.floor(screenX), Math.floor(screenY), f.size, f.size);
                        targetCtx.fillStyle = `rgba(180, 255, 90, ${pulse * 0.25})`;
                        targetCtx.fillRect(Math.floor(screenX - 2), Math.floor(screenY - 2), f.size + 4, f.size + 4);
                    }
                }
            }
        }
        targetCtx.restore();
    }

    export function menuRandom() {
        menuWorldSeed = (menuWorldSeed * 1664525 + 1013904223) >>> 0;
        return menuWorldSeed / 0xffffffff;
    }

    export function generateMenuWorld() {
        if ((menuWorldInitialized || (typeof window !== 'undefined' && window.menuWorldInitialized)) && menuWorld && menuWorld.blocks && menuWorld.blocks.length === MENU_WORLD_WIDTH && menuWorld.blocks[0]?.length === MENU_WORLD_HEIGHT) {
            return;
        }

        menuWorldSeed = (Math.random() * 0xffffffff) >>> 0;
        menuTime = 0.22;
        const baseH = MENU_SURFACE_Y;
        const terrain = new Array(MENU_WORLD_WIDTH);
        const blocks = new Array(MENU_WORLD_WIDTH);

        // 1. Generate full terrain column for all columns (Surface down to MENU_WORLD_HEIGHT)
        for (let x = 0; x < MENU_WORLD_WIDTH; x++) {
            const h = baseH + Math.round(Math.sin(x * 0.04) * 4 + Math.cos(x * 0.08) * 2);
            terrain[x] = h;
            const col = new Array(MENU_WORLD_HEIGHT).fill(IDS.AIR);

            // Grass surface
            col[h] = IDS.GRASS;

            // Dirt (3-4 layers below grass)
            for (let y = h + 1; y < Math.min(MENU_WORLD_HEIGHT, h + 4); y++) {
                col[y] = IDS.DIRT;
            }

            // Stone & Ores (filling all the way down through the bottom of the world)
            for (let y = h + 4; y < MENU_WORLD_HEIGHT; y++) {
                // Natural organic cave pockets
                const caveNoise = Math.sin(x * 0.14 + y * 0.2) + Math.cos(x * 0.18 - y * 0.14);
                if (y > h + 7 && caveNoise > 1.35) {
                    col[y] = IDS.AIR;
                    continue;
                }

                const r = menuRandom();
                if (r < 0.055) col[y] = IDS.COAL_ORE;
                else if (r < 0.09) col[y] = IDS.IRON_ORE;
                else if (y > h + 10 && r < 0.115) col[y] = IDS.GOLD_ORE;
                else if (y > h + 14 && r < 0.13) col[y] = IDS.DIAMOND_ORE;
                else if (y > h + 12 && r < 0.14) col[y] = IDS.EMERALD_ORE;
                else col[y] = IDS.STONE;
            }

            blocks[x] = col;
        }

        // 2. Exact in-game Jungle Trees matching buildJungleTree
        const setTrunk = (bx, by) => {
            if (bx < 0 || bx >= MENU_WORLD_WIDTH || by < 0 || by >= MENU_WORLD_HEIGHT) return;
            blocks[bx][by] = IDS.JUNGLE_WOOD;
            nonCollidableTreeWood.add(`${bx}_${by}`);
        };
        const setLeaf = (bx, by) => {
            if (bx < 0 || bx >= MENU_WORLD_WIDTH || by < 0 || by >= MENU_WORLD_HEIGHT) return;
            if (blocks[bx][by] === IDS.AIR || blocks[bx][by] === undefined) blocks[bx][by] = IDS.JUNGLE_LEAVES;
        };
        const setVine = (bx, by) => {
            if (bx < 0 || bx >= MENU_WORLD_WIDTH || by < 0 || by >= MENU_WORLD_HEIGHT) return;
            if (blocks[bx][by] === IDS.AIR || blocks[bx][by] === undefined) blocks[bx][by] = IDS.VINES;
        };

        function buildMenuJungleTree(tx, sy, treeType = 'giant') {
            if (treeType === 'jungle_bush') {
                setTrunk(tx, sy - 1);
                for (let lx = -1; lx <= 1; lx++) {
                    for (let ly = -2; ly <= -1; ly++) {
                        setLeaf(tx + lx, sy + ly);
                    }
                }
                setLeaf(tx, sy - 3);
                return;
            }

            // Giant Jungle Tree: 12 to 20 blocks high (exact match to buildJungleTree)
            const th = Math.floor(menuRandom() * 9) + 12;
            const is2x2 = menuRandom() < 0.65;
            const trunkWidth = is2x2 ? 2 : 1;

            // Grow main trunk
            for (let i = 1; i <= th; i++) {
                for (let tw = 0; tw < trunkWidth; tw++) {
                    setTrunk(tx + tw, sy - i);
                }
            }

            // Spreading branch arms midway up (exact match)
            const branchY1 = sy - Math.floor(th * 0.55);
            setTrunk(tx - 1, branchY1);
            setLeaf(tx - 2, branchY1);
            setLeaf(tx - 2, branchY1 - 1);
            setLeaf(tx - 1, branchY1 - 1);

            const branchY2 = sy - Math.floor(th * 0.75);
            setTrunk(tx + trunkWidth, branchY2);
            setLeaf(tx + trunkWidth + 1, branchY2);
            setLeaf(tx + trunkWidth + 1, branchY2 - 1);
            setLeaf(tx + trunkWidth, branchY2 - 1);

            // Broad canopy at top (radius 4 to 6)
            const top = sy - th;
            const canopyRadius = is2x2 ? 5 : 4;
            for (let ly = -4; ly <= 2; ly++) {
                const layerY = top + ly;
                const r = canopyRadius - Math.abs(ly + 1);
                for (let lx = -r; lx <= r + (is2x2 ? 1 : 0); lx++) {
                    if (Math.abs(lx) === r && Math.abs(ly + 1) >= 2 && menuRandom() < 0.4) continue;
                    setLeaf(tx + lx, layerY);
                }
            }

            // Hanging Vines on trunk sides and under canopy
            for (let side of [-1, trunkWidth]) {
                const vineX = tx + side;
                const startVineY = top + 2;
                const vineLen = Math.floor(menuRandom() * 6) + 3;
                for (let v = 0; v < vineLen; v++) {
                    const vy = startVineY + v;
                    if (vy < sy - 1) {
                        setVine(vineX, vy);
                    }
                }
            }
            // Hanging vines under outer canopy edges
            for (let offset of [-canopyRadius + 1, canopyRadius + (is2x2 ? 0 : -1)]) {
                const vineX = tx + offset;
                const startVineY = top + 3;
                const vineLen = Math.floor(menuRandom() * 5) + 2;
                for (let v = 0; v < vineLen; v++) {
                    const vy = startVineY + v;
                    if (vy < sy - 1) {
                        setVine(vineX, vy);
                    }
                }
            }
        }

        let lastTreeX = -999;
        for (let x = 3; x < MENU_WORLD_WIDTH - 4; x++) {
            const surfaceY = terrain[x];
            if (x - lastTreeX >= 3 && menuRandom() < 0.65) {
                const roll = menuRandom();
                const treeType = roll < 0.80 ? 'giant' : 'jungle_bush';
                buildMenuJungleTree(x, surfaceY, treeType);
                lastTreeX = x + (treeType === 'giant' ? 3 : 1);
            }
        }

        // 3. Ground Cover & Understory: Bamboo clumps (2-5 blocks tall), Ferns, Tall & Short Grass
        for (let x = 0; x < MENU_WORLD_WIDTH; x++) {
            const h = terrain[x];
            if (blocks[x][h] === IDS.GRASS && blocks[x][h - 1] === IDS.AIR) {
                const vegRoll = menuRandom();
                if (vegRoll < 0.25) {
                    blocks[x][h - 1] = IDS.FERN;
                } else if (vegRoll < 0.45) {
                    blocks[x][h - 1] = IDS.TALL_GRASS;
                } else if (vegRoll < 0.60) {
                    blocks[x][h - 1] = IDS.SHORT_GRASS;
                } else if (vegRoll < 0.75) {
                    // Bamboo shoot/stalk (2-5 blocks tall)
                    const bambooHeight = Math.floor(menuRandom() * 4) + 2;
                    for (let b = 1; b <= bambooHeight; b++) {
                        if (h - b >= 0 && blocks[x][h - b] === IDS.AIR) {
                            blocks[x][h - b] = IDS.BAMBOO;
                        }
                    }
                }
            }
        }

        // 4. Wild Melon Patches (exact match to generateWorld)
        for (let x = 5; x < MENU_WORLD_WIDTH - 5; x++) {
            if (menuRandom() < 0.48) {
                const sy = terrain[x];
                if (sy && blocks[x][sy] === IDS.GRASS && blocks[x][sy - 1] === IDS.AIR) {
                    const patchSize = Math.floor(menuRandom() * 4) + 2;
                    for (let p = 0; p < patchSize; p++) {
                        const mx = x + (p % 3) - 1;
                        if (mx >= 2 && mx < MENU_WORLD_WIDTH - 2) {
                            const my = terrain[mx];
                            if (my && blocks[mx][my] === IDS.GRASS && blocks[mx][my - 1] === IDS.AIR) {
                                blocks[mx][my - 1] = IDS.MELON;
                            }
                        }
                    }
                }
            }
        }

        // 5. Animals & Birds: Colorful Parrots, Pigeons, Sheep, Pigs, Cows, Chickens
        const animals = [];
        const animalRoster = [
            { type: 'parrot', variant: 0 },
            { type: 'parrot', variant: 1 },
            { type: 'pigeon', variant: null },
            { type: 'parrot', variant: 2 },
            { type: 'parrot', variant: 3 },
            { type: 'pigeon', variant: null },
            { type: 'sheep', variant: null },
            { type: 'pig', variant: null },
            { type: 'cow', variant: null },
            { type: 'chicken', variant: null },
            { type: 'parrot', variant: 0 },
            { type: 'parrot', variant: 2 },
            { type: 'pigeon', variant: null },
            { type: 'sheep', variant: null },
            { type: 'pig', variant: null },
            { type: 'chicken', variant: null },
            { type: 'cow', variant: null },
            { type: 'pigeon', variant: null }
        ];

        animalRoster.forEach((spec, index) => {
            let x;
            if (index < 6) {
                x = 10 + (index * 4) + menuRandom() * 3;
            } else {
                x = 8 + menuRandom() * (MENU_WORLD_WIDTH - 16);
            }

            let entity;
            if (spec.type === 'parrot') {
                entity = new Parrot(x * TILE_SIZE, 0, spec.variant);
            } else if (spec.type === 'pigeon') {
                entity = new Pigeon(x * TILE_SIZE, 0);
            } else if (spec.type === 'sheep') {
                entity = new Sheep(x * TILE_SIZE, 0);
            } else if (spec.type === 'pig') {
                entity = new Pig(x * TILE_SIZE, 0);
            } else if (spec.type === 'cow') {
                entity = new Cow(x * TILE_SIZE, 0);
            } else {
                entity = new Chicken(x * TILE_SIZE, 0);
            }

            entity.dir = menuRandom() > 0.5 ? 1 : -1;
            entity.y = (terrain[Math.floor(x)] || baseH) * TILE_SIZE - entity.height;
            entity.isGrounded = true;
            entity.isMenuEntity = true;
            animals.push({ type: spec.type, entity });
        });
        menuEntities = animals;

        menuWorld = {
            terrain,
            surfaceHeights: terrain,
            blocks,
            animals,
            width: MENU_WORLD_WIDTH
        };
        menuWorldInitialized = true;
        if (typeof window !== 'undefined') {
            window.menuWorld = menuWorld;
            window.menuEntities = animals;
            window.menuWorldInitialized = true;
        }
    }

    export function drawMenuBackground() {
        if (!menuWorldInitialized || !menuWorld.blocks || !menuWorld.blocks.length || menuWorld.blocks.length !== MENU_WORLD_WIDTH) {
            generateMenuWorld();
        }
        const now = performance.now();
        if (!menuLastFrame) menuLastFrame = now;
        const delta = Math.min(32, Math.max(0, now - menuLastFrame));
        menuLastFrame = now;
        const motion = (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ? 0 : delta;
        const pointerX = Math.max(-1, Math.min(1, (mouse.clientX - window.innerWidth / 2) / Math.max(1, window.innerWidth / 2)));
        const pointerY = Math.max(-1, Math.min(1, (mouse.clientY - window.innerHeight / 2) / Math.max(1, window.innerHeight / 2)));
        menuParallaxX += (pointerX * 24 - menuParallaxX) * 0.08;
        menuParallaxY += (pointerY * 14 - menuParallaxY) * 0.08;
        menuCamX = (menuCamX + motion * 0.035) % (MENU_WORLD_WIDTH * TILE_SIZE);
        if (!menuBgCanvas && typeof document !== 'undefined') menuBgCanvas = document.getElementById('menuBgCanvas');
        if (menuBgCanvas && !menuCtx) menuCtx = menuBgCanvas.getContext('2d', { alpha: false });
        if (!menuBgCanvas || !menuCtx) return;
        if (!menuBgCanvas.width || !menuBgCanvas.height) {
            menuBgCanvas.width = (typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : 800;
            menuBgCanvas.height = (typeof window !== 'undefined' && window.innerHeight) ? window.innerHeight : 600;
        }
        const width = menuBgCanvas.width, height = menuBgCanvas.height;

        // 1. Dynamic Celestial Sky
        drawDynamicSky(menuCtx, width, height, menuTime);

        // 2. Parallax Mountain Ridges (Ultra-fast vector path filling)
        drawMountains(menuCtx, menuCamX, height, menuTime, width, menuParallaxX, menuParallaxY);

        // 3. Tropical Jungle Humidity Mist (Unconditional Fabulous Shader Layer)
        menuCtx.save();
        const mistLayers = [
            { speed: 0.05, alpha: 0.22, yOffset: 0.18, hRatio: 0.65 },
            { speed: 0.10, alpha: 0.18, yOffset: 0.35, hRatio: 0.60 },
            { speed: 0.03, alpha: 0.15, yOffset: 0.05, hRatio: 0.90 }
        ];
        for (let l = 0; l < mistLayers.length; l++) {
            const layer = mistLayers[l];
            const a = layer.alpha;
            const fogGrad = menuCtx.createLinearGradient(0, height * layer.yOffset, 0, height * (layer.yOffset + layer.hRatio));
            fogGrad.addColorStop(0, 'rgba(180, 245, 205, 0)');
            fogGrad.addColorStop(0.3, `rgba(160, 240, 195, ${a.toFixed(3)})`);
            fogGrad.addColorStop(0.7, `rgba(140, 235, 180, ${(a * 1.15).toFixed(3)})`);
            fogGrad.addColorStop(1, 'rgba(180, 245, 205, 0)');
            menuCtx.fillStyle = fogGrad;
            menuCtx.fillRect(0, height * layer.yOffset, width, height * layer.hRatio);
        }
        menuCtx.restore();

        // 4. Drifting Clouds
        clouds.forEach(c => c.draw(menuCtx, menuCamX * 0.6));

        // 5. Atmospheric Sun Glow
        const lightStrength = menuTime > 0.08 && menuTime < 0.42 ? 0.22 : (menuTime > 0.84 || menuTime < 0.08 ? 0.12 : 0.03);
        const sunX = width * 0.72 + menuParallaxX * 0.3;
        const sunY = height * 0.20 + menuParallaxY * 0.3;
        const worldLight = menuCtx.createRadialGradient(sunX, sunY, 10, sunX, sunY, height * 0.85);
        worldLight.addColorStop(0, `rgba(255, 225, 140, ${lightStrength})`);
        worldLight.addColorStop(0.35, `rgba(255, 170, 90, ${lightStrength * 0.4})`);
        worldLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
        menuCtx.save();
        menuCtx.globalCompositeOperation = 'screen';
        menuCtx.fillStyle = worldLight;
        menuCtx.fillRect(0, 0, width, height);
        menuCtx.restore();

        // 6. Foreground Living World (Trees, Foliage, Grass, Dirt, Stone & Ore Strata)
        // Camera is permanently anchored to the tropical jungle surface layer at MENU_SURFACE_Y
        const cameraX = menuCamX;
        const cameraY = (MENU_SURFACE_Y * TILE_SIZE) - height * 0.52 + menuParallaxY * 0.8;
        const startCol = Math.floor(cameraX / TILE_SIZE) - 1;
        const endCol = startCol + Math.ceil(width / TILE_SIZE) + 2;
        const startRow = Math.max(0, Math.floor(cameraY / TILE_SIZE) - 2);
        const endRow = Math.min(MENU_WORLD_HEIGHT - 1, Math.ceil((cameraY + height) / TILE_SIZE) + 1);

        menuCtx.imageSmoothingEnabled = false;

        for (let x = startCol; x <= endCol; x++) {
            const wrappedX = ((x % MENU_WORLD_WIDTH) + MENU_WORLD_WIDTH) % MENU_WORLD_WIDTH;
            const drawX = Math.round(x * TILE_SIZE - cameraX);
            const col = menuWorld.blocks?.[wrappedX];
            if (!col) continue;

            for (let y = startRow; y <= endRow; y++) {
                const block = col[y];
                if (block === undefined || block === IDS.AIR) continue;
                const drawY = Math.round(y * TILE_SIZE - cameraY);
                if (drawY + TILE_SIZE < 0 || drawY > height) continue;

                if (textures[block]) {
                    menuCtx.drawImage(textures[block], drawX, drawY, TILE_SIZE, TILE_SIZE);
                }
            }
        }

        // 7. Living Animated Animals (Authentic in-game physics, AI, jumping, walking leg swings & bird flight)
        if (menuEntities && menuEntities.length) {
            menuEntities.forEach(entry => {
                const entity = entry.entity;
                entity.isMenuEntity = true;
                
                // Turn around smoothly before hitting world boundaries
                if (entity.x < 3 * TILE_SIZE) {
                    entity.dir = 1;
                    entity.vx = Math.abs(entity.speed || entity.baseSpeed || 1);
                    entity.x = 3 * TILE_SIZE;
                } else if (entity.x > (MENU_WORLD_WIDTH - 4) * TILE_SIZE) {
                    entity.dir = -1;
                    entity.vx = -Math.abs(entity.speed || entity.baseSpeed || 1);
                    entity.x = (MENU_WORLD_WIDTH - 4) * TILE_SIZE;
                }

                // Full in-game AI, physics, gravity, obstacle jumps & flight
                entity.update();

                // Safety fallback if entity goes below terrain
                const curGx = Math.max(0, Math.min(MENU_WORLD_WIDTH - 1, Math.floor((entity.x + entity.width / 2) / TILE_SIZE)));
                const groundY = (menuWorld.terrain && menuWorld.terrain[curGx] !== undefined) ? menuWorld.terrain[curGx] : MENU_SURFACE_Y;
                if (entity.y > (groundY + 2) * TILE_SIZE) {
                    entity.y = groundY * TILE_SIZE - entity.height;
                    entity.vy = 0;
                    entity.isGrounded = true;
                }

                entity.draw(menuCtx, cameraX, cameraY);
            });
        }

        // 8. Tropical Canopy Sunbeams / Godrays (Unconditional Fabulous Shader)
        menuCtx.save();
        menuCtx.globalCompositeOperation = 'lighter';
        const numMenuRays = 6;
        const baseRaySpacing = width / (numMenuRays - 1);
        const rayParallaxOffset = (cameraX * 0.12) % baseRaySpacing;
        const rayPixelStep = 8;
        const raySliceHeight = 16;
        const rayTilt = 0.18;
        const rayTime = now * 0.001;

        for (let i = 0; i < numMenuRays; i++) {
            const rayPulse = Math.sin(rayTime * 1.2 + i * 1.5) * 0.5 + 0.5;
            const driftX = Math.floor(Math.sin(rayTime * 0.6 + i * 0.8) * 24 / rayPixelStep) * rayPixelStep;
            const topCenterX = Math.floor((i * baseRaySpacing - rayParallaxOffset + driftX) / rayPixelStep) * rayPixelStep;
            const topHalfWidth = 26 + Math.floor(Math.sin(i * 1.8) * 8 / rayPixelStep) * rayPixelStep;
            const bottomHalfWidth = topHalfWidth * 1.6;

            const baseAlpha = 0.024 + rayPulse * 0.014;
            const r = 230, g = 255, b = 145; // Tropical canopy sunbeams

            for (let y = 0; y < height; y += raySliceHeight) {
                const yRatio = y / height;
                const fade = Math.max(0, 1.0 - yRatio * 0.85);
                const sliceAlpha = baseAlpha * fade;
                if (sliceAlpha <= 0.002) continue;

                const sliceCenterX = Math.floor((topCenterX + rayTilt * y) / rayPixelStep) * rayPixelStep;
                const sliceHalfWidth = Math.floor((topHalfWidth + yRatio * (bottomHalfWidth - topHalfWidth)) / rayPixelStep) * rayPixelStep;

                menuCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${sliceAlpha.toFixed(4)})`;
                menuCtx.fillRect(sliceCenterX - sliceHalfWidth, y, sliceHalfWidth * 2, raySliceHeight);
            }
        }
        menuCtx.restore();

        // 9. Floating Bioluminescent Spores, Jungle Leaves & Fireflies (Fabulous Atmosphere)
        drawMenuFireflies(menuCtx, width, height, cameraX, cameraY);

        // 10. Tropical Jungle Biome Color Grading (Unconditional Fabulous Shader)
        menuCtx.save();
        menuCtx.fillStyle = 'rgba(34, 197, 94, 0.15)'; // Vibrant tropical emerald-jade canopy grade
        menuCtx.fillRect(0, 0, width, height);
        menuCtx.restore();

        // 11. Cinematic Dark Edge Vignette
        const vignette = menuCtx.createRadialGradient(width / 2, height * 0.46, height * 0.28, width / 2, height * 0.46, height * 0.85);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(0.7, 'rgba(4,8,14,0.30)');
        vignette.addColorStop(1, 'rgba(2,5,10,0.65)');
        menuCtx.fillStyle = vignette;
        menuCtx.fillRect(0, 0, width, height);
        menuLastFrame = now;
    }

    export function getWorldSurfaceY(x) {
        const curWorld = world || window.world;
        if (!curWorld || !Array.isArray(curWorld) || x < 0 || x >= WORLD_WIDTH) return WORLD_HEIGHT;
        const curHeights = (surfaceHeights && surfaceHeights.length === WORLD_WIDTH) ? surfaceHeights : window.surfaceHeights;
        if (curHeights && curHeights.length === WORLD_WIDTH && Number.isFinite(curHeights[x])) return curHeights[x];
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            const block = curWorld[x]?.[y];
            if (block !== undefined && block !== IDS.AIR && block !== IDS.LEAVES && block !== IDS.WOOD && block !== IDS.SAPLING && block !== IDS.TORCH) return y;
        }
        return WORLD_HEIGHT;
    }

    export function getPlayerCaveSkyOpacity() {
        const curPlayer = player || window.player;
        const curWorld = world || window.world;
        if (!curPlayer || !curWorld) return 0;
        const playerGridX = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor(((curPlayer.x || 0) + (curPlayer.width || 24) / 2) / TILE_SIZE)));
        let avgSurfaceY = 0;
        let count = 0;
        for (let ox = -2; ox <= 2; ox++) {
            let gx = Math.max(0, Math.min(WORLD_WIDTH - 1, playerGridX + ox));
            avgSurfaceY += getWorldSurfaceY(gx);
            count++;
        }
        avgSurfaceY = (avgSurfaceY / count) * TILE_SIZE;
        const playerFeetWorldY = (curPlayer.y || 0) + (curPlayer.height || 48);
        const caveDepthTiles = (playerFeetWorldY - avgSurfaceY) / TILE_SIZE;
        return Math.max(0, Math.min(1, (caveDepthTiles - CAVE_SKY_START_TILES) / CAVE_SKY_FADE_TILES));
    }

    export function getSnowBiomeRatio(centerGridX, radius = 18) {
        if (!Array.isArray(world) || !Array.isArray(surfaceHeights) || surfaceHeights.length === 0) return 0;
        let startX = Math.max(0, centerGridX - radius);
        let endX = Math.min(WORLD_WIDTH - 1, centerGridX + radius);
        let snowCols = 0;
        let totalCols = 0;
        for (let x = startX; x <= endX; x++) {
            totalCols++;
            let surfY = surfaceHeights[x];
            if (surfY !== undefined && surfY < WORLD_HEIGHT) {
                let topBlock = world[x]?.[surfY];
                let nextBlock = world[x]?.[surfY + 1];
                if (topBlock === IDS.SNOW || topBlock === IDS.ICE || nextBlock === IDS.SNOW || nextBlock === IDS.ICE) {
                    snowCols++;
                }
            }
        }
        return totalCols > 0 ? (snowCols / totalCols) : 0;
    }

    export function drawPixelAurora(targetCtx, w, h, time) {
        if (!advancedGraphics || time < 0.46 || time > 0.88 || auroraSnowOpacity <= 0.01) return;

        let nightPhase = Math.sin((time - 0.46) / 0.42 * Math.PI);
        let auroraAlpha = Math.pow(nightPhase, 1.1) * 0.92 * auroraSnowOpacity * (1 - caveSkyOpacity);
        if (auroraAlpha <= 0.01) return;

        const pixelSize = 4;
        const colWidth = 8;
        const totalCols = Math.ceil(w / colWidth) + 1;
        const aH = 64;

        if (!auroraImageData || auroraCanvas.width !== totalCols || auroraCanvas.height !== aH) {
            auroraCanvas.width = totalCols;
            auroraCanvas.height = aH;
            auroraImageData = auroraCtx.createImageData(totalCols, aH);
        }

        const buf32 = new Uint32Array(auroraImageData.data.buffer);
        buf32.fill(0);

        // Layer 1: Ethereal Background Ribbon (Deep Aqua, Cyan & Emerald Waves)
        for (let c = 0; c < totalCols; c++) {
            let wave1 = Math.sin(c * 0.07 + frameCount * 0.018) * 20;
            let wave2 = Math.sin(c * 0.035 - frameCount * 0.012) * 16;
            let baseY = Math.floor((48 + wave1 + wave2) / pixelSize);
            let colHeight = Math.floor((72 + Math.sin(c * 0.12 + frameCount * 0.022) * 24) / pixelSize);

            for (let b = 0; b < colHeight; b++) {
                let blockY = baseY + b;
                if (blockY < 0 || blockY >= aH) continue;
                let relPos = b / colHeight;

                let shimmer = 0.85 + Math.sin(c * 0.4 + b * 0.6 + frameCount * 0.08) * 0.15;
                let a = (relPos < 0.2 ? relPos / 0.2 : (1 - relPos * 0.3)) * auroraAlpha * shimmer * 0.45;
                let alphaByte = Math.min(255, Math.max(0, Math.floor(a * 255)));

                let r, g, bl;
                if (relPos < 0.35) {
                    // Upper ethereal teal glow (no harsh purple)
                    r = 0; g = 190; bl = 225;
                    alphaByte = Math.min(255, Math.floor(alphaByte * 0.85));
                } else if (relPos < 0.7) {
                    // Mid vibrant cyan
                    r = 0; g = 230; bl = 240;
                    alphaByte = Math.min(255, Math.floor(alphaByte * 0.95));
                } else {
                    // Lower radiant emerald green
                    r = 37; g = 244; bl = 158;
                    alphaByte = Math.min(255, Math.floor(alphaByte * 1.1));
                }

                let idx = blockY * totalCols + c;
                let prevA = (buf32[idx] >>> 24) & 255;
                if (prevA === 0) {
                    buf32[idx] = (alphaByte << 24) | (bl << 16) | (g << 8) | r;
                } else {
                    let outA = Math.min(255, prevA + alphaByte);
                    buf32[idx] = (outA << 24) | (bl << 16) | (g << 8) | r;
                }
            }
        }

        // Layer 2: Vibrant Foreground Shimmering Curtain (Neon Emerald, Turquoise & Radiant Mint)
        for (let c = 0; c < totalCols; c++) {
            let wave1 = Math.sin(c * 0.09 + frameCount * 0.024 + 1.2) * 24;
            let wave2 = Math.cos(c * 0.045 - frameCount * 0.016) * 18;
            let wave3 = Math.sin(c * 0.16 + frameCount * 0.038) * 8;
            let baseY = Math.floor((36 + wave1 + wave2 + wave3) / pixelSize);
            let colHeight = Math.floor((88 + Math.sin(c * 0.14 + frameCount * 0.03 + 2.0) * 32) / pixelSize);

            for (let b = 0; b < colHeight; b++) {
                let blockY = baseY + b;
                if (blockY < 0 || blockY >= aH) continue;
                let relPos = b / colHeight;

                let shimmer = 0.82 + Math.sin(c * 0.5 + b * 0.8 + frameCount * 0.1) * 0.18;
                let a = (relPos < 0.15 ? relPos / 0.15 : (relPos > 0.85 ? (1 - relPos) / 0.15 : 1.0)) * auroraAlpha * shimmer * 0.65;
                let alphaByte = Math.min(255, Math.max(0, Math.floor(a * 255)));

                let r, g, bl;
                if (relPos < 0.22) {
                    // Soft luminous aquamarine / cyan upper edge (smooth transition, no magenta)
                    r = 0; g = 215; bl = 235;
                    alphaByte = Math.min(255, Math.floor(alphaByte * 0.8));
                } else if (relPos < 0.55) {
                    // Electric cyan
                    r = 26; g = 238; bl = 255;
                    alphaByte = Math.min(255, Math.floor(alphaByte * 0.9));
                } else if (relPos < 0.85) {
                    // Neon emerald
                    r = 37; g = 248; bl = 158;
                    alphaByte = Math.min(255, Math.floor(alphaByte * 1.15));
                } else {
                    // Mint / lime glowing highlight
                    r = 130; g = 255; bl = 185;
                    alphaByte = Math.min(255, Math.floor(alphaByte * 1.35));
                }

                if (b >= colHeight - 2 && (c + b + Math.floor(frameCount / 4)) % 3 === 0) {
                    r = 210; g = 255; bl = 230;
                    alphaByte = Math.min(255, Math.floor(alphaByte * 1.5));
                }

                let idx = blockY * totalCols + c;
                let prevA = (buf32[idx] >>> 24) & 255;
                if (prevA === 0) {
                    buf32[idx] = (alphaByte << 24) | (bl << 16) | (g << 8) | r;
                } else {
                    let outA = Math.min(255, prevA + alphaByte);
                    buf32[idx] = (outA << 24) | (bl << 16) | (g << 8) | r;
                }
            }
        }

        // Layer 3: Vertical Ion Ray Curtain Folds (Luminous Emerald & Cyan Ray Pillars)
        const pillarSpacing = 4;
        const totalPillars = Math.ceil(totalCols / pillarSpacing) + 1;
        for (let p = 0; p < totalPillars; p++) {
            let pCol = p * pillarSpacing + Math.floor(Math.sin(frameCount * 0.015 + p * 2.1) * 0.75);
            let pHeight = Math.floor((110 + Math.sin(frameCount * 0.02 + p * 1.7) * 45) / pixelSize);
            let pBaseY = Math.floor((25 + Math.sin(p * 0.3 + frameCount * 0.018) * 15) / pixelSize);
            let pAlpha = (0.06 + Math.sin(frameCount * 0.03 + p * 1.3) * 0.035) * auroraAlpha;

            // Harmonious emerald / cyan rays (no harsh purple spikes)
            let isAqua = p % 2 === 0;
            let r = isAqua ? 0 : 35;
            let g = isAqua ? 230 : 250;
            let bl = isAqua ? 240 : 175;

            for (let b = 0; b < pHeight; b++) {
                let blockY = pBaseY + b;
                if (blockY < 0 || blockY >= aH) continue;
                let rel = b / pHeight;
                let a = (1 - rel) * pAlpha;
                let alphaByte = Math.min(255, Math.max(0, Math.floor(a * 255)));

                if (pCol >= 0 && pCol < totalCols) {
                    let idx = blockY * totalCols + pCol;
                    let prevA = (buf32[idx] >>> 24) & 255;
                    let outA = Math.min(255, prevA + alphaByte);
                    buf32[idx] = (outA << 24) | (bl << 16) | (g << 8) | r;
                }
            }
        }

        auroraCtx.putImageData(auroraImageData, 0, 0);

        targetCtx.save();
        targetCtx.imageSmoothingEnabled = false;
        targetCtx.globalCompositeOperation = 'screen';
        targetCtx.drawImage(auroraCanvas, 0, 0, totalCols, aH, 0, 0, totalCols * colWidth, aH * pixelSize);
        targetCtx.restore();
    }

    // Fabulous Atmosphere & VFX State
    export let currentBiomeHue = { r: 0, g: 0, b: 0, a: 0 };
    export let currentFogDensity = 0;
    export const fabulousAmbientParticles = [];
    export const MAX_FABULOUS_PARTICLES = 90;

    export function getActiveBiomeAt(gridX) {
        const gx = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor(gridX)));
        if (worldBiomes && worldBiomes[gx]) return worldBiomes[gx];
        if (typeof window !== 'undefined' && window.worldBiomes && window.worldBiomes[gx]) return window.worldBiomes[gx];
        if (!Array.isArray(world) || !Array.isArray(surfaceHeights) || surfaceHeights.length === 0) return 'plains';
        let snowCount = 0;
        let sandCount = 0;
        let woodCount = 0;
        let jungleCount = 0;
        const checkRadius = 8;
        const startX = Math.max(0, gx - checkRadius);
        const endX = Math.min(WORLD_WIDTH - 1, gx + checkRadius);
        let totalChecked = 0;

        for (let x = startX; x <= endX; x++) {
            totalChecked++;
            let surfY = surfaceHeights[x] !== undefined ? surfaceHeights[x] : getWorldSurfaceY(x);
            if (surfY < WORLD_HEIGHT) {
                let b0 = world[x]?.[surfY];
                let b1 = world[x]?.[surfY + 1];
                let bAbove = world[x]?.[surfY - 1];
                if (b0 === IDS.SNOW || b0 === IDS.ICE || b1 === IDS.SNOW || b1 === IDS.ICE) snowCount++;
                else if (b0 === IDS.SAND || b1 === IDS.SAND) sandCount++;
                else if (b0 === IDS.JUNGLE_WOOD || b0 === IDS.JUNGLE_LEAVES || b0 === IDS.BAMBOO || b0 === IDS.FERN || b0 === IDS.MELON || b0 === IDS.VINES || b1 === IDS.JUNGLE_WOOD || b1 === IDS.JUNGLE_LEAVES || bAbove === IDS.BAMBOO || bAbove === IDS.FERN || bAbove === IDS.MELON) jungleCount++;
                else if (b0 === IDS.WOOD || b0 === IDS.LEAVES || b1 === IDS.WOOD || bAbove === IDS.WOOD || bAbove === IDS.LEAVES) woodCount++;
            }
        }

        if (jungleCount >= 1) return 'jungle';
        if (totalChecked > 0 && snowCount / totalChecked > 0.30) return 'snow';
        if (totalChecked > 0 && sandCount / totalChecked > 0.30) return 'desert';
        if (woodCount >= 1) return 'forest';
        const surfY = surfaceHeights[gx] !== undefined ? surfaceHeights[gx] : getWorldSurfaceY(gx);
        if (surfY < Math.floor(WORLD_HEIGHT * 0.32) || (world[gx]?.[surfY] === IDS.STONE)) return 'mountains';
        return 'plains';
    }

    export function initFabulousParticles() {
        if (fabulousAmbientParticles.length > 0) return;
        for (let i = 0; i < MAX_FABULOUS_PARTICLES; i++) {
            fabulousAmbientParticles.push({
                x: Math.random() * 2000,
                y: Math.random() * 1200,
                vx: 0, vy: 0,
                size: 2,
                color: '#ffffff',
                life: Math.random() * 200,
                maxLife: 200,
                type: 'dust'
            });
        }
    }

    export let cachedBiomeGridX = -1;
    export let cachedActiveBiome = 'plains';
    export let cachedIsSnowy = false;

    export function updateBiomeAtmosphere() {
        if (!fabulousGraphics || !player) {
            currentBiomeHue.a = 0;
            currentFogDensity = 0;
            return;
        }
        const playerGridX = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor(((player.x || 0) + (player.width || 24) / 2) / TILE_SIZE)));
        const playerFeetGridY = ((player.y || 0) + (player.height || 48)) / TILE_SIZE;
        const surfY = getWorldSurfaceY(playerGridX);
        const isUnderground = playerFeetGridY > surfY + CAVE_SKY_START_TILES;

        if (playerGridX !== cachedBiomeGridX || frameCount % 15 === 0) {
            cachedBiomeGridX = playerGridX;
            cachedActiveBiome = getActiveBiomeAt(playerGridX);
            cachedIsSnowy = (cachedActiveBiome === 'snow') || (getSnowBiomeRatio(playerGridX, 10) > 0.25);
        }
        const activeBiome = cachedActiveBiome;
        const isSnowy = cachedIsSnowy;

        let targetR = 0, targetG = 0, targetB = 0, targetA = 0;
        let targetFog = 0;

        if (isUnderground) {
            targetR = 10; targetG = 8; targetB = 22; targetA = Math.min(0.35, caveSkyOpacity * 0.45);
        } else if (isSnowy) {
            targetR = 195; targetG = 230; targetB = 255; targetA = 0.16;
            targetFog = 0.55;
        } else if (activeBiome === 'desert') {
            if (timeOfDay >= 0.68 && timeOfDay < 0.90) {
                targetR = 18; targetG = 32; targetB = 76; targetA = 0.14;
            } else {
                targetR = 255; targetG = 175; targetB = 45; targetA = 0.16;
            }
        } else if (activeBiome === 'jungle') {
            // Tropical Jungle: Rich lush emerald-jade canopy grade with warm humidity mist
            if (timeOfDay >= 0.58 && timeOfDay < 0.68) {
                // Tropical Sunset: warm mango amber with humid glow
                targetR = 255; targetG = 145; targetB = 35; targetA = 0.20;
                targetFog = 0.25;
            } else if (timeOfDay >= 0.68 && timeOfDay < 0.90) {
                // Rainforest Night: deep moonlit indigo-teal
                targetR = 12; targetG = 45; targetB = 68; targetA = 0.17;
                targetFog = 0.18;
            } else {
                // Daytime: vibrant tropical emerald-jade canopy filtering
                targetR = 34; targetG = 197; targetB = 94; targetA = 0.17;
                targetFog = 0.22;
            }
        } else if (activeBiome === 'forest') {
            // Plain Woods: Rich lush emerald canopy grade with golden sun accents
            if (timeOfDay >= 0.58 && timeOfDay < 0.68) {
                targetR = 255; targetG = 155; targetB = 60; targetA = 0.18;
            } else if (timeOfDay >= 0.68 && timeOfDay < 0.90) {
                targetR = 18; targetG = 38; targetB = 84; targetA = 0.15;
            } else {
                targetR = 75; targetG = 215; targetB = 95; targetA = 0.14;
            }
        } else if (activeBiome === 'mountains') {
            if (timeOfDay >= 0.68 && timeOfDay < 0.90) {
                targetR = 16; targetG = 28; targetB = 68; targetA = 0.13;
            } else {
                targetR = 155; targetG = 190; targetB = 250; targetA = 0.11;
            }
        } else {
            // Open Plains: Warm sun-drenched golden-meadow tint
            if (timeOfDay >= 0.58 && timeOfDay < 0.68) {
                targetR = 255; targetG = 160; targetB = 65; targetA = 0.18;
            } else if (timeOfDay >= 0.68 && timeOfDay < 0.90) {
                targetR = 20; targetG = 42; targetB = 90; targetA = 0.15;
            } else {
                targetR = 145; targetG = 225; targetB = 85; targetA = 0.13;
            }
        }

        if (isNaN(currentBiomeHue.r)) currentBiomeHue.r = targetR;
        if (isNaN(currentBiomeHue.g)) currentBiomeHue.g = targetG;
        if (isNaN(currentBiomeHue.b)) currentBiomeHue.b = targetB;
        if (isNaN(currentBiomeHue.a)) currentBiomeHue.a = targetA;
        if (isNaN(currentFogDensity)) currentFogDensity = targetFog;

        currentBiomeHue.r += (targetR - currentBiomeHue.r) * 0.12;
        currentBiomeHue.g += (targetG - currentBiomeHue.g) * 0.12;
        currentBiomeHue.b += (targetB - currentBiomeHue.b) * 0.12;
        currentBiomeHue.a += (targetA - currentBiomeHue.a) * 0.12;
        currentFogDensity += (targetFog - currentFogDensity) * 0.08;
    }

    export function drawBiomeGrading(targetCtx, w, h) {
        if (!fabulousGraphics || currentBiomeHue.a <= 0.005 || w <= 0 || h <= 0) return;
        targetCtx.save();
        targetCtx.fillStyle = `rgba(${Math.round(currentBiomeHue.r)}, ${Math.round(currentBiomeHue.g)}, ${Math.round(currentBiomeHue.b)}, ${currentBiomeHue.a.toFixed(3)})`;
        targetCtx.fillRect(0, 0, w, h);
        targetCtx.restore();
    }

    export function drawSnowFog(targetCtx, w, h, camX) {
        if (!fabulousGraphics || currentFogDensity <= 0.01 || w <= 0 || h <= 0) return;
        targetCtx.save();
        const isJungle = cachedActiveBiome === 'jungle';
        const layers = [
            { speed: 0.8, alpha: 0.28, yOffset: 0.15, hRatio: 0.7 },
            { speed: 1.4, alpha: 0.22, yOffset: 0.35, hRatio: 0.65 },
            { speed: 0.5, alpha: 0.18, yOffset: 0.0, hRatio: 1.0 }
        ];

        for (let l = 0; l < layers.length; l++) {
            const layer = layers[l];
            const a = layer.alpha * currentFogDensity * (isJungle ? 0.70 : 1.0);
            const fogGrad = targetCtx.createLinearGradient(0, h * layer.yOffset, 0, h * (layer.yOffset + layer.hRatio));
            if (isJungle) {
                fogGrad.addColorStop(0, `rgba(180, 245, 205, 0)`);
                fogGrad.addColorStop(0.3, `rgba(160, 240, 195, ${a.toFixed(3)})`);
                fogGrad.addColorStop(0.7, `rgba(140, 235, 180, ${(a * 1.15).toFixed(3)})`);
                fogGrad.addColorStop(1, `rgba(180, 245, 205, 0)`);
            } else {
                fogGrad.addColorStop(0, `rgba(230, 245, 255, 0)`);
                fogGrad.addColorStop(0.3, `rgba(225, 242, 255, ${a.toFixed(3)})`);
                fogGrad.addColorStop(0.7, `rgba(215, 238, 255, ${(a * 1.2).toFixed(3)})`);
                fogGrad.addColorStop(1, `rgba(230, 245, 255, 0)`);
            }

            targetCtx.fillStyle = fogGrad;
            targetCtx.fillRect(0, h * layer.yOffset, w, h * layer.hRatio);
        }
        targetCtx.restore();
    }

    export function drawVignette(targetCtx, w, h) {
        if (!showVignette || (!fabulousGraphics && !advancedGraphics) || w <= 0 || h <= 0) return;
        targetCtx.save();
        const maxDim = Math.hypot(w / 2, h / 2);
        const vigGrad = targetCtx.createRadialGradient(w / 2, h / 2, Math.max(1, maxDim * 0.42), w / 2, h / 2, Math.max(2, maxDim));
        const cornerAlpha = Math.max(0.18, Math.min(0.68, 0.28 + caveSkyOpacity * 0.35));
        vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vigGrad.addColorStop(0.6, `rgba(0, 0, 0, ${(cornerAlpha * 0.35).toFixed(3)})`);
        vigGrad.addColorStop(1, `rgba(0, 0, 0, ${cornerAlpha.toFixed(3)})`);

        targetCtx.fillStyle = vigGrad;
        targetCtx.fillRect(0, 0, w, h);
        targetCtx.restore();
    }

    export function drawDesertHeatShimmer(targetCtx, w, h, camX) {
        if (!fabulousGraphics || caveSkyOpacity > 0.5 || w <= 0 || h <= 0 || !player) return;
        const playerGridX = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor(((player.x || 0) + (player.width || 24) / 2) / TILE_SIZE)));
        const activeBiome = getActiveBiomeAt(playerGridX);
        if (activeBiome !== 'desert' || timeOfDay < 0.08 || timeOfDay > 0.58) return;
        targetCtx.save();
        targetCtx.fillStyle = 'rgba(255, 210, 110, 0.06)';
        const numWaves = 4;
        for (let i = 0; i < numWaves; i++) {
            const waveY = h * 0.6 + i * 25 + Math.sin(frameCount * 0.05 + i * 1.5) * 6;
            targetCtx.fillRect(0, waveY, w, 12);
        }
        targetCtx.restore();
    }

    export function drawForestGodRays(targetCtx, w, h, camX, camY) {
        if (!fabulousGraphics || caveSkyOpacity > 0.45 || w <= 0 || h <= 0 || !player) return;
        const playerGridX = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor(((player.x || 0) + (player.width || 24) / 2) / TILE_SIZE)));
        const activeBiome = getActiveBiomeAt(playerGridX);
        if (activeBiome !== 'forest' && activeBiome !== 'plains' && activeBiome !== 'jungle') return;

        // Intermittent presence: rays will not always appear (fades in and out during sunny intervals)
        const rayCycle = Math.sin(frameCount * 0.0018 + playerGridX * 0.05);
        if (rayCycle < 0.35) return;
        const presence = Math.max(0, Math.min(1.0, (rayCycle - 0.35) / 0.65));

        const isDaytime = (timeOfDay >= 0.90 || timeOfDay < 0.58);
        const isSunset = (timeOfDay >= 0.58 && timeOfDay < 0.68);
        const isSunrise = (timeOfDay >= 0.90 || timeOfDay <= 0.04);
        const isNight = (timeOfDay >= 0.68 && timeOfDay < 0.90);

        // Subtle intensity based on daylight, presence & caveSkyOpacity
        const skyClear = Math.max(0, 1.0 - caveSkyOpacity * 2.2) * presence;
        if (skyClear <= 0.01) return;

        targetCtx.save();
        targetCtx.globalCompositeOperation = 'lighter';

        // Calculate sun/moon ray tilt angle across the sky
        let tilt = 0;
        if (isDaytime) {
            if (timeOfDay >= 0.90) {
                tilt = 0.40 - ((timeOfDay - 0.90) / 0.10) * 0.25;
            } else if (timeOfDay <= 0.30) {
                tilt = 0.15 - (timeOfDay / 0.30) * 0.20;
            } else {
                tilt = -0.05 - ((timeOfDay - 0.30) / 0.28) * 0.40;
            }
        } else if (isNight) {
            tilt = Math.sin((timeOfDay - 0.79) * Math.PI * 3) * 0.20;
        }

        const numRays = (activeBiome === 'jungle') ? 6 : 5;
        const baseSpacing = w / (numRays - 1);
        const parallaxOffset = (camX * 0.12) % baseSpacing;
        const pixelStep = 8;
        const sliceHeight = 16;

        for (let i = 0; i < numRays; i++) {
            const rayPulse = Math.sin(frameCount * 0.016 + i * 1.5) * 0.5 + 0.5;
            const driftX = Math.floor(Math.sin(frameCount * 0.008 + i * 0.8) * 24 / pixelStep) * pixelStep;
            const topCenterX = Math.floor((i * baseSpacing - parallaxOffset + driftX) / pixelStep) * pixelStep;
            const topHalfWidth = 24 + Math.floor(Math.sin(i * 1.8) * 8 / pixelStep) * pixelStep;
            const bottomHalfWidth = topHalfWidth * 1.6;

            // Faint, subtle opacity adapted to pixel art
            let baseAlpha = 0;
            let r = 255, g = 250, b = 210;

            if (isSunset) {
                baseAlpha = (0.018 + rayPulse * 0.012) * skyClear;
                r = (activeBiome === 'jungle') ? 255 : 255;
                g = (activeBiome === 'jungle') ? 175 : 165;
                b = (activeBiome === 'jungle') ? 70 : 80;
            } else if (isSunrise) {
                baseAlpha = (0.016 + rayPulse * 0.010) * skyClear;
                r = 255; g = 210; b = 130;
            } else if (isDaytime) {
                if (activeBiome === 'jungle') {
                    baseAlpha = (0.024 + rayPulse * 0.012) * skyClear;
                    r = 230; g = 255; b = 145; // Tropical canopy sunbeams
                } else {
                    baseAlpha = ((activeBiome === 'forest' ? 0.018 : 0.014) + rayPulse * 0.008) * skyClear;
                    r = 245; g = 250; b = 190;
                }
            } else if (isNight) {
                baseAlpha = (0.010 + rayPulse * 0.006) * skyClear;
                r = 180; g = 210; b = 255;
            }

            if (baseAlpha > 0.003) {
                for (let y = 0; y < h; y += sliceHeight) {
                    const yRatio = y / h;
                    const fade = Math.max(0, 1.0 - yRatio * 0.85);
                    const sliceAlpha = baseAlpha * fade;
                    if (sliceAlpha <= 0.002) continue;

                    const sliceCenterX = Math.floor((topCenterX + tilt * y) / pixelStep) * pixelStep;
                    const sliceHalfWidth = Math.floor((topHalfWidth + yRatio * (bottomHalfWidth - topHalfWidth)) / pixelStep) * pixelStep;

                    targetCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${sliceAlpha.toFixed(4)})`;
                    targetCtx.fillRect(sliceCenterX - sliceHalfWidth, y, sliceHalfWidth * 2, sliceHeight);
                }
            }
        }
        targetCtx.restore();
    }

    export function drawPlainsWindBreeze(targetCtx, w, h, camX, camY) {
        if (!fabulousGraphics || caveSkyOpacity > 0.4 || w <= 0 || h <= 0 || !player) return;
        const playerGridX = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor(((player.x || 0) + (player.width || 24) / 2) / TILE_SIZE)));
        const activeBiome = getActiveBiomeAt(playerGridX);
        if (activeBiome !== 'plains' && activeBiome !== 'forest') return;

        targetCtx.save();
        const numGusts = 3;
        const t = frameCount * 0.015;

        for (let g = 0; g < numGusts; g++) {
            const gustSpeed = 1.4 + g * 0.5;
            const gustCycle = (frameCount * gustSpeed * 2.0 + g * 350) % (w + 600) - 300;
            const startX = gustCycle;
            const baseY = h * (0.55 + g * 0.12) + Math.sin(t + g * 2.0) * 18;
            const gustLength = 180 + g * 60;

            const breezeGrad = targetCtx.createLinearGradient(startX, baseY, startX + gustLength, baseY);
            breezeGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            breezeGrad.addColorStop(0.35, 'rgba(235, 255, 210, 0.08)');
            breezeGrad.addColorStop(0.7, 'rgba(215, 250, 195, 0.06)');
            breezeGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

            targetCtx.strokeStyle = breezeGrad;
            targetCtx.lineWidth = 3 + g;
            targetCtx.beginPath();
            targetCtx.moveTo(startX, baseY);
            targetCtx.bezierCurveTo(
                startX + gustLength * 0.33, baseY - 8 + Math.sin(t * 2 + g) * 6,
                startX + gustLength * 0.66, baseY + 8 - Math.cos(t * 2 + g) * 6,
                startX + gustLength, baseY - 2
            );
            targetCtx.stroke();
        }
        targetCtx.restore();
    }

    export function updateAndDrawFabulousParticles(targetCtx, camX, camY, w, h) {
        if (!fabulousGraphics || w <= 0 || h <= 0 || !player) return;
        initFabulousParticles();

        const playerGridX = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor(((player.x || 0) + (player.width || 24) / 2) / TILE_SIZE)));
        const activeBiome = getActiveBiomeAt(playerGridX);
        const isSnowy = (activeBiome === 'snow') || (getSnowBiomeRatio(playerGridX, 10) > 0.25);
        const isUnderground = caveSkyOpacity > 0.4;
        const isNight = timeOfDay >= 0.68 && timeOfDay <= 0.90;

        targetCtx.save();
        for (let i = 0; i < fabulousAmbientParticles.length; i++) {
            const p = fabulousAmbientParticles[i];
            p.life--;

            if (p.life <= 0 || p.x < camX - 100 || p.x > camX + w + 100 || p.y < camY - 100 || p.y > camY + h + 100) {
                p.x = camX + Math.random() * (w + 160) - 80;
                p.y = camY + Math.random() * (h + 160) - 80;
                p.maxLife = 130 + Math.random() * 110;
                p.life = p.maxLife;

                if (isUnderground) {
                    p.type = 'cave_dust';
                    p.size = 1.5 + Math.random() * 1.5;
                    p.color = 'rgba(180, 190, 210, 0.45)';
                    p.vx = (Math.random() - 0.5) * 0.4;
                    p.vy = -0.15 - Math.random() * 0.25;
                } else if (isSnowy) {
                    p.type = 'snow';
                    p.size = 2.0 + Math.random() * 2.5;
                    p.color = 'rgba(240, 248, 255, 0.85)';
                    p.vx = -1.8 - Math.random() * 1.6;
                    p.vy = 1.6 + Math.random() * 1.8;
                } else if (activeBiome === 'desert') {
                    p.type = 'sand_dust';
                    p.size = 2.0 + Math.random() * 2.0;
                    p.color = 'rgba(235, 195, 110, 0.65)';
                    p.vx = 1.4 + Math.random() * 1.2;
                    p.vy = 0.2 + Math.random() * 0.4;
                } else if (isNight && (activeBiome === 'forest' || activeBiome === 'plains' || activeBiome === 'jungle')) {
                    p.type = 'firefly';
                    p.size = (activeBiome === 'jungle') ? (3.5 + Math.random() * 1.5) : (3.0 + Math.random() * 1.5);
                    p.color = (activeBiome === 'jungle') ? 'rgba(160, 255, 120, 0.85)' : 'rgba(180, 255, 80, 0.75)';
                    p.vx = (Math.random() - 0.5) * 0.8;
                    p.vy = (Math.random() - 0.5) * 0.8;
                } else if (activeBiome === 'jungle') {
                    // Tropical Jungle: Glowing bioluminescent spores, broad lush jungle leaves, tropical orchid petals
                    const jRoll = Math.random();
                    if (jRoll < 0.48) {
                        p.type = 'jungle_spore';
                        p.size = 2.0 + Math.random() * 1.5;
                        const sporeColors = ['#bbf7d0', '#86efac', '#fef08a', '#4ade80'];
                        p.sporeColor = sporeColors[Math.floor(Math.random() * sporeColors.length)];
                        p.swayPhase = Math.random() * Math.PI * 2;
                        p.vx = 0.25 + Math.random() * 0.3;
                        p.vy = -0.2 + (Math.random() - 0.5) * 0.3;
                    } else if (jRoll < 0.80) {
                        p.type = 'leaf';
                        p.size = 3.5 + Math.random() * 1.5;
                        p.swayPhase = Math.random() * Math.PI * 2;
                        p.swaySpeed = 0.04 + Math.random() * 0.03;
                        p.fallSpeed = 0.60 + Math.random() * 0.40;
                        p.leafColorChoice = 4 + Math.floor(Math.random() * 3);
                        p.vx = 0.3;
                        p.vy = p.fallSpeed;
                    } else {
                        p.type = 'petal';
                        p.size = 2.5 + Math.random() * 1.2;
                        p.petalType = 3 + Math.floor(Math.random() * 3);
                        p.swayPhase = Math.random() * Math.PI * 2;
                        p.vx = 0.4 + Math.random() * 0.4;
                        p.vy = 0.25 + Math.random() * 0.25;
                    }
                } else {
                    // Daytime Plains & Plain Woods (Forest)
                    const pRoll = Math.random();
                    if (activeBiome === 'forest' || pRoll < 0.38) {
                        // Fluttering Oak Leaves
                        p.type = 'leaf';
                        p.size = 3.0 + Math.random() * 1.5;
                        p.swayPhase = Math.random() * Math.PI * 2;
                        p.swaySpeed = 0.05 + Math.random() * 0.04;
                        p.fallSpeed = 0.55 + Math.random() * 0.45;
                        p.leafColorChoice = Math.floor(Math.random() * 4);
                        p.vx = 0.4;
                        p.vy = p.fallSpeed;
                    } else if (pRoll < 0.74) {
                        // Floating Dandelion Fluff / Meadow Seeds
                        p.type = 'dandelion';
                        p.size = 2.0 + Math.random() * 1.2;
                        p.swayPhase = Math.random() * Math.PI * 2;
                        p.vx = 0.8 + Math.random() * 0.6;
                        p.vy = -0.1 + (Math.random() - 0.5) * 0.25;
                    } else {
                        // Drifting Flower Petals
                        p.type = 'petal';
                        p.size = 2.5 + Math.random() * 1.2;
                        p.petalType = Math.floor(Math.random() * 3);
                        p.swayPhase = Math.random() * Math.PI * 2;
                        p.vx = 0.5 + Math.random() * 0.5;
                        p.vy = 0.3 + Math.random() * 0.3;
                    }
                }
            }

            if (p.type === 'firefly') {
                p.vx += (Math.random() - 0.5) * 0.15;
                p.vy += (Math.random() - 0.5) * 0.15;
                p.x += p.vx;
                p.y += p.vy;
                const pulse = Math.sin(frameCount * 0.1 + i) * 0.5 + 0.5;
                const fx = Math.floor(p.x - camX);
                const fy = Math.floor(p.y - camY);
                targetCtx.fillStyle = `rgba(180, 255, 80, ${(pulse * 0.25).toFixed(2)})`;
                targetCtx.fillRect(fx - 2, fy - 2, p.size + 4, p.size + 4);
                targetCtx.fillStyle = `rgba(225, 255, 140, ${(pulse * 0.9 + 0.1).toFixed(2)})`;
                targetCtx.fillRect(fx, fy, p.size, p.size);
            } else if (p.type === 'jungle_spore') {
                p.swayPhase = (p.swayPhase || 0) + 0.035;
                p.vx = 0.25 + Math.sin(p.swayPhase) * 0.35;
                p.vy = -0.15 + Math.cos(p.swayPhase * 0.8) * 0.25;
                p.x += p.vx;
                p.y += p.vy;

                const sx = Math.floor(p.x - camX);
                const sy = Math.floor(p.y - camY);
                const alpha = Math.max(0, Math.min(0.9, (p.life / p.maxLife) * 1.5));
                targetCtx.globalAlpha = alpha;
                targetCtx.fillStyle = 'rgba(254, 240, 138, 0.35)';
                targetCtx.fillRect(sx - 1, sy - 1, p.size + 2, p.size + 2);
                targetCtx.fillStyle = p.sporeColor || '#86efac';
                targetCtx.fillRect(sx, sy, p.size, p.size);
                targetCtx.globalAlpha = 1.0;
            } else if (p.type === 'leaf') {
                p.swayPhase = (p.swayPhase || 0) + (p.swaySpeed || 0.06);
                p.vx = 0.4 + Math.sin(p.swayPhase) * 1.1;
                p.vy = (p.fallSpeed || 0.7);
                p.x += p.vx;
                p.y += p.vy;

                const lx = Math.floor(p.x - camX);
                const ly = Math.floor(p.y - camY);
                const alpha = Math.max(0, Math.min(1.0, (p.life / p.maxLife) * 1.6));
                targetCtx.globalAlpha = alpha;

                const leafColors = [
                    ['#388e3c', '#4caf50'], // 0 Vibrant grass leaf
                    ['#2e7d32', '#1b5e20'], // 1 Deep forest oak leaf
                    ['#7cb342', '#8bc34a'], // 2 Golden sunlit leaf
                    ['#f57f17', '#e65100'], // 3 Autumn amber leaf
                    ['#15803d', '#22c55e'], // 4 Lush rainforest canopy leaf
                    ['#166534', '#15803d'], // 5 Deep jungle understory leaf
                    ['#4ade80', '#16a34a']  // 6 Sunlit jungle vine leaf
                ];
                const pair = leafColors[p.leafColorChoice || 0] || leafColors[0];
                targetCtx.fillStyle = pair[0];
                targetCtx.fillRect(lx, ly, 3, 2);
                targetCtx.fillStyle = pair[1];
                targetCtx.fillRect(lx + 1, ly + 1, 2, 2);
                targetCtx.globalAlpha = 1.0;
            } else if (p.type === 'dandelion') {
                p.swayPhase = (p.swayPhase || 0) + 0.04;
                p.vx = 0.7 + Math.sin(p.swayPhase) * 0.4;
                p.vy = Math.sin(p.swayPhase * 0.7) * 0.2;
                p.x += p.vx;
                p.y += p.vy;

                const dx = Math.floor(p.x - camX);
                const dy = Math.floor(p.y - camY);
                const alpha = Math.max(0, Math.min(0.85, (p.life / p.maxLife) * 1.4));
                targetCtx.globalAlpha = alpha;

                targetCtx.fillStyle = '#ffffff';
                targetCtx.fillRect(dx, dy, 2, 2);
                targetCtx.fillStyle = 'rgba(230, 240, 215, 0.7)';
                targetCtx.fillRect(dx - 1, dy + 2, 1, 2);
                targetCtx.globalAlpha = 1.0;
            } else if (p.type === 'petal') {
                p.swayPhase = (p.swayPhase || 0) + 0.05;
                p.vx = 0.5 + Math.sin(p.swayPhase) * 0.6;
                p.vy = 0.35 + Math.cos(p.swayPhase) * 0.2;
                p.x += p.vx;
                p.y += p.vy;

                const px = Math.floor(p.x - camX);
                const py = Math.floor(p.y - camY);
                const alpha = Math.max(0, Math.min(0.9, (p.life / p.maxLife) * 1.5));
                targetCtx.globalAlpha = alpha;

                const petalPalette = [
                    '#e53935', '#fdd835', '#f48fb1', // Standard flowers
                    '#f43f5e', '#a855f7', '#fbbf24'  // Tropical jungle orchid / exotic flora
                ];
                targetCtx.fillStyle = petalPalette[p.petalType || 0] || '#e53935';
                targetCtx.fillRect(px, py, 2, 2);
                targetCtx.fillRect(px + 1, py + 1, 1, 2);
                targetCtx.globalAlpha = 1.0;
            } else {
                p.x += p.vx;
                p.y += p.vy;
                const alpha = Math.max(0, Math.min(1.0, (p.life / p.maxLife) * 1.4));
                targetCtx.fillStyle = p.color;
                targetCtx.globalAlpha = alpha;
                targetCtx.fillRect(Math.floor(p.x - camX), Math.floor(p.y - camY), p.size, p.size);
                targetCtx.globalAlpha = 1.0;
            }
        }
        targetCtx.restore();
    }

    export function drawWorld() {
        const camX = Math.round(camera.x);
        const camY = Math.round(camera.y);
        updateBiomeAtmosphere();
        const playerGridX = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor((player.x + player.width / 2) / TILE_SIZE)));
        const surfaceWorldY = getWorldSurfaceY(playerGridX) * TILE_SIZE;
        const targetCaveSkyOpacity = getPlayerCaveSkyOpacity();
        caveSkyOpacity += (targetCaveSkyOpacity - caveSkyOpacity) * 0.08;
        if (Math.abs(targetCaveSkyOpacity - caveSkyOpacity) < 0.01) caveSkyOpacity = targetCaveSkyOpacity;

        const snowRatio = getSnowBiomeRatio(playerGridX, 18);
        const targetSnowOpacity = snowRatio > 0.15 ? Math.min(1.0, (snowRatio - 0.15) / 0.35) : 0;
        auroraSnowOpacity += (targetSnowOpacity - auroraSnowOpacity) * 0.04;
        if (Math.abs(targetSnowOpacity - auroraSnowOpacity) < 0.005) auroraSnowOpacity = targetSnowOpacity;

        drawDynamicSky(ctx, canvas.width, canvas.height, timeOfDay);
        const verticalParallax = Math.max(-80, Math.min(80, (camY - (surfaceWorldY - canvas.height / 2)) * 0.08));
        drawMountains(ctx, camX, canvas.height, timeOfDay, canvas.width, 0, verticalParallax);
        drawPixelAurora(ctx, canvas.width, canvas.height, timeOfDay);
        drawSnowFog(ctx, canvas.width, canvas.height, camX);
        clouds.forEach(c => c.draw(ctx, camX));

        let timeAngle = (timeOfDay - 0.30) * Math.PI * 2; 
        let celX = canvas.width/2 - Math.sin(timeAngle) * (canvas.width * 0.45);
        let celY = canvas.height/2 + Math.cos(timeAngle) * (canvas.height * 0.45);
        
        ctx.imageSmoothingEnabled = false;

        let isDaytime = (timeOfDay >= 0.90 || timeOfDay < 0.58);
        if (isDaytime) {
            let sunSize = 64;
            let isSunset = (timeOfDay >= 0.58 && timeOfDay < 0.68);
            let isSunrise = (timeOfDay >= 0.90 || timeOfDay <= 0.04);

            // Sun radiant corona bloom (Pre-rendered GPU sprite blit)
            const sunGlowSprite = (isSunset || isSunrise) ? cachedSunGlowSunsetCanvas : cachedSunGlowDayCanvas;
            ctx.drawImage(sunGlowSprite, celX - 100, celY - 100, 200, 200);

            // Outer sun block
            ctx.fillStyle = (isSunset || isSunrise) ? '#ff6c2c' : '#ffd43f';
            ctx.fillRect(Math.floor(celX - sunSize/2), Math.floor(celY - sunSize/2), sunSize, sunSize);

            // Mid sun layer
            let midSize = sunSize - 12;
            ctx.fillStyle = (isSunset || isSunrise) ? '#ffaa44' : '#fff07a';
            ctx.fillRect(Math.floor(celX - midSize/2), Math.floor(celY - midSize/2), midSize, midSize);

            // Radiant inner core
            let coreSize = sunSize - 24;
            ctx.fillStyle = (isSunset || isSunrise) ? '#fff4b8' : '#ffffff';
            ctx.fillRect(Math.floor(celX - coreSize/2), Math.floor(celY - coreSize/2), coreSize, coreSize);
        } else {
            let moonAngle = (timeOfDay - 0.81) * Math.PI * 2;
            let mX = canvas.width/2 - Math.sin(moonAngle) * (canvas.width * 0.45);
            let mY = canvas.height/2 + Math.cos(moonAngle) * (canvas.height * 0.45);
            let moonSize = 52;

            // Celestial lunar halo (Pre-rendered GPU sprite blit)
            ctx.drawImage(cachedMoonGlowCanvas, mX - 90, mY - 90, 180, 180);

            // Base lunar plate
            let startX = Math.floor(mX - moonSize/2);
            let startY = Math.floor(mY - moonSize/2);
            ctx.fillStyle = '#e8edf5';
            ctx.fillRect(startX, startY, moonSize, moonSize);

            // Bright edge highlight (top and left edges)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(startX, startY, moonSize, 3);
            ctx.fillRect(startX, startY, 3, moonSize);

            // Shaded bottom and right edges
            ctx.fillStyle = '#c5d3e6';
            ctx.fillRect(startX, startY + moonSize - 3, moonSize, 3);
            ctx.fillRect(startX + moonSize - 3, startY, 3, moonSize);

            // Pixel Lunar Maria / Crater patterns
            ctx.fillStyle = '#a6b8ce';
            ctx.fillRect(startX + 8, startY + 8, 14, 12);
            ctx.fillRect(startX + 28, startY + 12, 16, 14);
            ctx.fillRect(startX + 12, startY + 28, 18, 14);
            ctx.fillRect(startX + 34, startY + 32, 10, 10);

            // Darker inner crater cores
            ctx.fillStyle = '#7c93ac';
            ctx.fillRect(startX + 11, startY + 11, 7, 6);
            ctx.fillRect(startX + 32, startY + 15, 8, 8);
            ctx.fillRect(startX + 15, startY + 31, 10, 7);
            ctx.fillRect(startX + 36, startY + 34, 5, 5);

            // Deep crater pits
            ctx.fillStyle = '#5c728a';
            ctx.fillRect(startX + 13, startY + 13, 3, 3);
            ctx.fillRect(startX + 34, startY + 17, 3, 3);
            ctx.fillRect(startX + 18, startY + 33, 4, 3);
        }


        if (advancedGraphics && (timeOfDay > 0.08 && timeOfDay < 0.58)) {
            let flareAmount = Math.max(0, 1 - Math.abs(timeOfDay - 0.30) * 3.5);
            let flareCenterX = canvas.width / 2 + (canvas.width / 2 - celX) * 0.28;
            let flareCenterY = canvas.height / 2 + (canvas.height / 2 - celY) * 0.28;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.42 * flareAmount;
            ctx.fillStyle = '#ffd777';
            ctx.fillRect(Math.floor(celX - 4), Math.floor(celY - 4), 8, 8);
            ctx.globalAlpha = 0.2 * flareAmount;
            ctx.fillRect(Math.floor(flareCenterX - 3), Math.floor(flareCenterY - 3), 6, 6);
            ctx.fillStyle = '#ff9d52';
            ctx.globalAlpha = 0.16 * flareAmount;
            ctx.fillRect(Math.floor(canvas.width / 2 - 5), Math.floor(canvas.height / 2 - 5), 10, 10);
            ctx.restore();
        }
        if (advancedGraphics && timeOfDay >= 0.68 && timeOfDay <= 0.90) {
            let starCycle = frameCount % 720;
            for (let shootingStar = 0; shootingStar < 3; shootingStar++) {
                let starAge = starCycle - (shootingStar * 240 + 35);
                if (starAge >= 0 && starAge < 38) {
                    let starX = (shootingStar * 211 + starAge * 13) % Math.max(1, canvas.width - 80) + 40;
                    let starY = 52 + shootingStar * 23 + starAge * 2;
                    ctx.save();
                    ctx.globalAlpha = Math.max(0, 1 - starAge / 38) * 0.9;
                    ctx.fillStyle = '#e8f4ff';
                    ctx.fillRect(Math.floor(starX), Math.floor(starY), 4, 4);
                    ctx.fillRect(Math.floor(starX - 18), Math.floor(starY - 12), 14, 3);
                    ctx.restore();
                }
            }
        }
        if (caveSkyOpacity > 0 && advancedGraphics) {
            ctx.fillStyle = `rgba(0, 0, 0, ${caveSkyOpacity})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        let startCol = Math.floor(camX / TILE_SIZE);
        let endCol = startCol + Math.ceil(canvas.width / TILE_SIZE) + 1;
        let startRow = Math.max(0, Math.floor(camY / TILE_SIZE));
        let endRow = Math.min(WORLD_HEIGHT - 1, startRow + Math.ceil(canvas.height / TILE_SIZE) + 1);

        const visibleLightSources = [];

        for (let x = startCol; x <= endCol; x++) {
            let drawX = Math.round(x * TILE_SIZE - camX);
            // Infinite ocean bounds masking for cutoff fix
            if (x < 0 || x >= WORLD_WIDTH) {
                for(let y = startRow; y <= endRow; y++) {
                    if (y >= Math.floor(WORLD_HEIGHT/2)) {
                        let drawY = Math.round(y * TILE_SIZE - camY);
                        // Sea level
                        ctx.fillStyle = (y === Math.floor(WORLD_HEIGHT/2)) ? 'rgba(30, 144, 255, 0.7)' : 'rgba(20, 100, 200, 0.9)';
                        ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                        // Sand floor
                        if (y > Math.floor(WORLD_HEIGHT/2) + 10) {
                            ctx.fillStyle = '#e6cc80';
                            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                        }
                    }
                }
                continue; 
            }
            
            // Draw background blocks (darker depth tone)
            if (bgWorld && bgWorld[x]) {
                for (let y = startRow; y <= endRow; y++) {
                    let bgBlock = bgWorld[x][y];
                    if (bgBlock !== undefined && bgBlock !== IDS.AIR && textures[bgBlock]) {
                        let drawY = Math.round(y * TILE_SIZE - camY);
                        ctx.drawImage(textures[bgBlock], drawX, drawY, TILE_SIZE, TILE_SIZE);
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
                        ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                    }
                }
            }

            for (let y = startRow; y <= endRow; y++) {
                let block = world[x][y];
                if (block === IDS.AIR) {
                    // Natural Ambient Occlusion (AO) on cave ceilings, overhangs, walls, and inner corners
                    if (advancedGraphics && y > 0 && y >= surfaceHeights[x]) {
                        const hasCeiling = world[x][y - 1] !== undefined && isSolidWorldBlock(x, y - 1, world[x][y - 1]);
                        const hasLeftWall = x > 0 && world[x - 1]?.[y] !== undefined && isSolidWorldBlock(x - 1, y, world[x - 1][y]);
                        const hasRightWall = x < WORLD_WIDTH - 1 && world[x + 1]?.[y] !== undefined && isSolidWorldBlock(x + 1, y, world[x + 1][y]);
                        
                        if (hasCeiling || hasLeftWall || hasRightWall) {
                            let drawY = Math.round(y * TILE_SIZE - camY);
                            if (hasCeiling && cachedCeilingAO) {
                                ctx.drawImage(cachedCeilingAO, drawX, drawY, TILE_SIZE, 8);
                            }
                            if (hasLeftWall && cachedLeftWallAO) {
                                ctx.drawImage(cachedLeftWallAO, drawX, drawY, 8, TILE_SIZE);
                            }
                            if (hasRightWall && cachedRightWallAO) {
                                ctx.drawImage(cachedRightWallAO, drawX + TILE_SIZE - 8, drawY, 8, TILE_SIZE);
                            }
                            if (hasCeiling && hasLeftWall && cachedCornerAOTopLeft) {
                                ctx.drawImage(cachedCornerAOTopLeft, drawX, drawY, 12, 12);
                            }
                            if (hasCeiling && hasRightWall && cachedCornerAOTopRight) {
                                ctx.drawImage(cachedCornerAOTopRight, drawX + TILE_SIZE - 12, drawY, 12, 12);
                            }
                        }
                    }
                    continue;
                }
                if (block !== undefined) {
                    let drawY = Math.round(y * TILE_SIZE - camY);
                    
                    if (block === IDS.BED) {
                        if (!isBedRenderStart(x, y)) continue;
                        let bedLength = getBedLength(x, y);
                        if (textures[block]) ctx.drawImage(textures[block], drawX, drawY, TILE_SIZE * bedLength, TILE_SIZE);
                    } else if (block === IDS.CHEST) {
                        const hasChestLeft = x > 0 && world[x - 1]?.[y] === IDS.CHEST;
                        const hasChestRight = x < WORLD_WIDTH - 1 && world[x + 1]?.[y] === IDS.CHEST;
                        if (hasChestLeft) continue;
                        if (hasChestRight) {
                            if (largeChestImage.complete) ctx.drawImage(largeChestImage, drawX, drawY, TILE_SIZE * 2, TILE_SIZE);
                        } else if (textures[block]) {
                            ctx.drawImage(textures[block], drawX, drawY, TILE_SIZE, TILE_SIZE);
                        }
                    } else if (block === IDS.TORCH) {
                        visibleLightSources.push({ x: x * TILE_SIZE + TILE_SIZE/2, y: y * TILE_SIZE + TILE_SIZE/2, type: 'torch', gridX: x, gridY: y });
                        let bottomSolid = (y < WORLD_HEIGHT-1 && world[x][y+1] !== IDS.AIR && world[x][y+1] !== IDS.TORCH);
                        let leftSolid = (x > 0 && world[x-1][y] !== IDS.AIR && world[x-1][y] !== IDS.TORCH);
                        let rightSolid = (x < WORLD_WIDTH-1 && world[x+1][y] !== IDS.AIR && world[x+1][y] !== IDS.TORCH);

                        ctx.save(); ctx.translate(drawX + TILE_SIZE/2, drawY + TILE_SIZE/2);
                        if (!bottomSolid) {
                            if (leftSolid) { ctx.translate(-TILE_SIZE/3, TILE_SIZE/6); ctx.rotate(Math.PI / 5); } 
                            else if (rightSolid) { ctx.translate(TILE_SIZE/3, TILE_SIZE/6); ctx.rotate(-Math.PI / 5); }
                        }
                        if (textures[block]) ctx.drawImage(textures[block], -TILE_SIZE/2, -TILE_SIZE/2, TILE_SIZE, TILE_SIZE);
                        ctx.restore();
                    } else if ((fabulousGraphics || advancedGraphics) && (
                        block === IDS.SHORT_GRASS || block === IDS.TALL_GRASS || 
                        block === IDS.FLOWER_RED || block === IDS.FLOWER_YELLOW || 
                        block === IDS.SAPLING ||
                        block === IDS.WHEAT_STAGE_1 || block === IDS.WHEAT_STAGE_2 || 
                        block === IDS.WHEAT_STAGE_3 || block === IDS.WHEAT_STAGE_4
                    )) {
                        // Gentle meadow & crop wind sway anchored to soil
                        let swayFactor = 0.035;
                        if (block === IDS.TALL_GRASS) swayFactor = 0.045;
                        else if (block === IDS.WHEAT_STAGE_1) swayFactor = 0.018; // subtle sprout sway
                        else if (block === IDS.WHEAT_STAGE_2) swayFactor = 0.028; // vegetative blade sway
                        else if (block === IDS.WHEAT_STAGE_3) swayFactor = 0.042; // tall stalk sway
                        else if (block === IDS.WHEAT_STAGE_4) swayFactor = 0.052; // heavy ripe grain heads nodding

                        const sway = Math.sin(frameCount * 0.045 + x * 0.7) * 2.0;
                        ctx.save();
                        ctx.translate(drawX + TILE_SIZE / 2, drawY + TILE_SIZE);
                        ctx.transform(1, 0, sway * swayFactor, 1, 0, 0); // shear sway anchored from bottom soil
                        if (textures[block]) ctx.drawImage(textures[block], -TILE_SIZE / 2, -TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        ctx.restore();
                    } else if (block === IDS.FURNACE) {
                        const liveFurnaces = (typeof window !== 'undefined' && Array.isArray(window.furnaces)) ? window.furnaces : furnaces;
                        const isLit = liveFurnaces.some(f => f.x === x && f.y === y && f.burnTime > 0);
                        const furnaceTex = (isLit && textures.furnace_lit) ? textures.furnace_lit : textures[IDS.FURNACE];
                        if (furnaceTex) ctx.drawImage(furnaceTex, drawX, drawY, TILE_SIZE, TILE_SIZE);
                        if (isLit) {
                            visibleLightSources.push({ x: x * TILE_SIZE + TILE_SIZE/2, y: y * TILE_SIZE + TILE_SIZE/2, type: 'torch', gridX: x, gridY: y });
                        }
                    } else {
                        if (textures[block]) ctx.drawImage(textures[block], drawX, drawY, TILE_SIZE, TILE_SIZE);
                    }
                }
            }
        }

        visibleFluids.length = 0;
        const animTick = frameCount;

        // Separate lists for Water and Lava to batch render cleanly
        const visibleWater = [];
        const visibleLava = [];

        fluids.forEach((fluid, key) => {
            let fluidX = fluid.x;
            let fluidY = fluid.y;
            if (fluidX === undefined) {
                const sep = key.indexOf('_');
                fluidX = parseInt(key.slice(0, sep), 10);
                fluidY = parseInt(key.slice(sep + 1), 10);
                fluid.x = fluidX;
                fluid.y = fluidY;
            }
            const drawX = Math.floor(fluidX * TILE_SIZE - camera.x);
            const drawY = Math.floor(fluidY * TILE_SIZE - camera.y);
            if (drawX > canvas.width || drawX + TILE_SIZE < 0 || drawY > canvas.height || drawY + TILE_SIZE < 0) return;

            const entry = { fluid, fluidX, fluidY, drawX, drawY };
            visibleFluids.push(entry);
            if (fluid.type === IDS.WATER) visibleWater.push(entry);
            else if (fluid.type === IDS.LAVA) visibleLava.push(entry);
        });

        // 1. RENDER WATER (Translucent, wavy connected surface, sloping quads, caustics & waterfalls)
        if (visibleWater.length > 0) {
            ctx.save();
            for (let i = 0; i < visibleWater.length; i++) {
                const { fluid, fluidX, fluidY, drawX, drawY } = visibleWater[i];
                const fluidAbove = getFluid(fluidX, fluidY - 1);
                const hasFluidAbove = (fluidAbove && fluidAbove.type === IDS.WATER);

                const isSolidBelow = isSolidWorldBlock(fluidX, fluidY + 1, world[fluidX]?.[fluidY + 1]);
                const isSolidLeft = isSolidWorldBlock(fluidX - 1, fluidY, world[fluidX - 1]?.[fluidY]);
                const isSolidRight = isSolidWorldBlock(fluidX + 1, fluidY, world[fluidX + 1]?.[fluidY]);

                if (hasFluidAbove) {
                    // Submerged Water Block: Full height, underwater caustics, and boundary shading
                    ctx.fillStyle = 'rgba(28, 120, 218, 0.76)';
                    ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);

                    // Gentle animated caustics (light refraction ribbons)
                    const causticsOffset = Math.sin(fluidX * 0.7 + fluidY * 0.9 + animTick * 0.05) * 4;
                    ctx.fillStyle = 'rgba(110, 195, 255, 0.20)';
                    ctx.fillRect(drawX + 4 + causticsOffset, drawY + 8, 14, 2);
                    ctx.fillRect(drawX + 14 - causticsOffset, drawY + 22, 12, 2);

                    // Solid contact shading (connected border against floor / walls)
                    if (isSolidBelow) {
                        ctx.fillStyle = 'rgba(12, 60, 130, 0.35)';
                        ctx.fillRect(drawX, drawY + TILE_SIZE - 2, TILE_SIZE, 2);
                    }
                    if (isSolidLeft) {
                        ctx.fillStyle = 'rgba(12, 60, 130, 0.35)';
                        ctx.fillRect(drawX, drawY, 2, TILE_SIZE);
                    }
                    if (isSolidRight) {
                        ctx.fillStyle = 'rgba(12, 60, 130, 0.35)';
                        ctx.fillRect(drawX + TILE_SIZE - 2, drawY, 2, TILE_SIZE);
                    }
                } else if (fluid.falling) {
                    // Falling waterfall stream column
                    ctx.fillStyle = 'rgba(28, 120, 218, 0.68)';
                    ctx.fillRect(drawX + 2, drawY, TILE_SIZE - 4, TILE_SIZE);

                    ctx.fillStyle = 'rgba(190, 242, 255, 0.70)';
                    const streakOffset = (animTick * 3 + fluidX * 11) % TILE_SIZE;
                    ctx.fillRect(drawX + 6, drawY + streakOffset, 3, 14);
                    ctx.fillRect(drawX + 18, drawY + ((streakOffset + 12) % TILE_SIZE), 3, 12);

                    // Falling waterfall splash & mist when hitting ground or pool
                    const belowF = getFluid(fluidX, fluidY + 1);
                    if (isSolidBelow || (belowF && !belowF.falling)) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
                        const mistW = 6 + Math.sin(animTick * 0.2 + fluidX) * 3;
                        ctx.fillRect(drawX + 6, drawY + TILE_SIZE - 3, mistW, 3);
                        ctx.fillRect(drawX + 18, drawY + TILE_SIZE - 4, mistW * 0.8, 3);
                        if (advancedGraphics && Math.random() < 0.06) {
                            spawnParticle(fluidX * TILE_SIZE + 8 + Math.random() * 16, (fluidY + 1) * TILE_SIZE - 2, '#d7f0ff');
                        }
                    }
                } else {
                    // Surface Water Block: Connected sloping surface quad with seamless wave highlights
                    const hSelf = fluid.source ? 1.0 : Math.max(0.25, 1.0 - (fluid.level / (WATER_FLOW_MAX + 1)) * 0.72);

                    const leftFluid = getFluid(fluidX - 1, fluidY);
                    const rightFluid = getFluid(fluidX + 1, fluidY);

                    const getNeighborHeight = (nbr, isSolid) => {
                        if (isSolid) return hSelf;
                        if (!nbr || nbr.type !== IDS.WATER) return hSelf * 0.65;
                        if (nbr.falling) return 1.0;
                        if (nbr.source) return 1.0;
                        return Math.max(0.25, 1.0 - (nbr.level / (WATER_FLOW_MAX + 1)) * 0.72);
                    };

                    const hLeftN = getNeighborHeight(leftFluid, isSolidLeft);
                    const hRightN = getNeighborHeight(rightFluid, isSolidRight);

                    const hLeft = (hLeftN + hSelf) * 0.5;
                    const hRight = (hRightN + hSelf) * 0.5;

                    // Continuous wave offsets based on world pixel coordinates (guarantees zero boundary seams)
                    const worldPixelL = fluidX * TILE_SIZE;
                    const worldPixelR = (fluidX + 1) * TILE_SIZE;
                    const waveL = Math.sin(worldPixelL * 0.06 + animTick * 0.08) * 1.5;
                    const waveR = Math.sin(worldPixelR * 0.06 + animTick * 0.08) * 1.5;

                    const topYL = Math.floor(drawY + TILE_SIZE * (1.0 - hLeft) + waveL);
                    const topYR = Math.floor(drawY + TILE_SIZE * (1.0 - hRight) + waveR);
                    const botY = drawY + TILE_SIZE;

                    // Render smooth trapezoid fluid quad
                    ctx.fillStyle = 'rgba(28, 120, 218, 0.72)';
                    ctx.beginPath();
                    ctx.moveTo(drawX, topYL);
                    ctx.lineTo(drawX + TILE_SIZE, topYR);
                    ctx.lineTo(drawX + TILE_SIZE, botY);
                    ctx.lineTo(drawX, botY);
                    ctx.closePath();
                    ctx.fill();

                    // Wave surface highlight strip
                    ctx.strokeStyle = 'rgba(215, 245, 255, 0.88)';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(drawX, topYL);
                    ctx.lineTo(drawX + TILE_SIZE, topYR);
                    ctx.stroke();

                    // Shoreline foam / meniscus where water touches solid terrain banks
                    if (isSolidLeft) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
                        const foamBob = Math.sin(animTick * 0.12 + fluidX) * 1.0;
                        ctx.fillRect(drawX, Math.floor(topYL + foamBob - 1), 5, 3);
                    }
                    if (isSolidRight) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
                        const foamBob = Math.sin(animTick * 0.12 + fluidX + 1) * 1.0;
                        ctx.fillRect(drawX + TILE_SIZE - 5, Math.floor(topYR + foamBob - 1), 5, 3);
                    }

                    // Foam crest specks in wave centers
                    if ((fluidX + Math.floor(animTick / 8)) % 3 === 0) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                        const midTopY = (topYL + topYR) * 0.5;
                        ctx.fillRect(drawX + 10, Math.floor(midTopY - 1), 6, 2);
                    }

                    // Bottom and side boundary shading
                    if (isSolidBelow) {
                        ctx.fillStyle = 'rgba(12, 60, 130, 0.35)';
                        ctx.fillRect(drawX, botY - 2, TILE_SIZE, 2);
                    }
                }
            }
            ctx.restore();
        }

        // 2. RENDER LAVA (Molten glowing base, core heat currents, basalt crust, bubbling surface)
        if (visibleLava.length > 0) {
            ctx.save();
            for (let i = 0; i < visibleLava.length; i++) {
                const { fluid, fluidX, fluidY, drawX, drawY } = visibleLava[i];
                const fluidAbove = getFluid(fluidX, fluidY - 1);
                const hasFluidAbove = (fluidAbove && fluidAbove.type === IDS.LAVA);

                let hRatio = 1.0;
                if (!hasFluidAbove && !fluid.source && !fluid.falling) {
                    hRatio = Math.max(0.35, 1.0 - (fluid.level / (LAVA_FLOW_MAX + 1)) * 0.62);
                }
                const cellHeight = Math.floor(TILE_SIZE * hRatio);
                const cellTopY = drawY + (TILE_SIZE - cellHeight);

                // Deep molten magma base
                ctx.fillStyle = '#d33215';
                ctx.fillRect(drawX, cellTopY, TILE_SIZE, cellHeight);

                // Hot golden-orange swirling core veins
                ctx.fillStyle = '#ff7a18';
                const pulse = Math.sin(fluidX * 0.8 + fluidY * 0.4 + animTick * 0.04) * 4;
                ctx.fillRect(drawX + 4, cellTopY + Math.max(2, Math.floor(cellHeight * 0.35 + pulse)), TILE_SIZE - 8, Math.max(3, Math.floor(cellHeight * 0.3)));

                // Bright yellow heat veins
                ctx.fillStyle = '#ffd236';
                if ((fluidX + fluidY + Math.floor(animTick / 10)) % 4 < 2) {
                    ctx.fillRect(drawX + 8, cellTopY + Math.max(2, Math.floor(cellHeight * 0.45)), 14, 3);
                }

                // Dark basalt floating crust specks
                ctx.fillStyle = '#5c160a';
                if ((fluidX * 2 + fluidY) % 3 === 0) {
                    const speckOffset = Math.floor(Math.sin(animTick * 0.02 + fluidX) * 3);
                    ctx.fillRect(drawX + 6 + speckOffset, cellTopY + Math.max(2, Math.floor(cellHeight * 0.2)), 8, 4);
                }

                // Glowing bubbling top surface edge
                if (!hasFluidAbove) {
                    ctx.fillStyle = '#ffec66';
                    const wave = Math.sin(fluidX * 0.5 + animTick * 0.06) * 1.2;
                    ctx.fillRect(drawX, Math.floor(cellTopY + wave), TILE_SIZE, 3);
                    
                    // Random rising spark/smoke particle
                    if (advancedGraphics && Math.random() < 0.015) {
                        spawnParticle(fluidX * TILE_SIZE + Math.random() * TILE_SIZE, fluidY * TILE_SIZE + 4, '#ff4500');
                    }
                }
            }
            ctx.restore();
        }

        if (advancedGraphics && caveSkyOpacity < 0.75) {
            ctx.save();
            ctx.globalAlpha = 0.82;
            for (let leaf = 0; leaf < 16; leaf++) {
                let leafWorldX = (leaf * 227 + frameCount * (0.35 + leaf * 0.012)) % (WORLD_WIDTH * TILE_SIZE);
                let leafGridX = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor(leafWorldX / TILE_SIZE)));
                let leafFall = (frameCount * (0.7 + leaf * 0.025) + leaf * 41) % 190;
                let leafWorldY = surfaceHeights[leafGridX] * TILE_SIZE - 150 + leafFall;
                let leafX = leafWorldX - camera.x;
                let leafY = leafWorldY - camera.y;
                if (leafX < -12 || leafX > canvas.width + 12 || leafY < -12 || leafY > canvas.height + 12) continue;
                ctx.fillStyle = LEAF_COLORS[leaf % LEAF_COLORS.length];
                ctx.fillRect(Math.floor(leafX), Math.floor(leafY), leaf % 3 === 0 ? 8 : 6, leaf % 4 === 0 ? 5 : 7);
            }
            ctx.restore();
        }
        
        // Draw Remote Multiplayer Characters using advanced limb rendering & LERP interpolation
        for (let rpId in remotePlayers) {
            let rp = remotePlayers[rpId];
            if (!rp || rp.isDisconnected || (rp.lastSeenLocalTime && Date.now() - rp.lastSeenLocalTime > 15000)) {
                delete remotePlayers[rpId];
                continue;
            }
            if (rp.isDead) continue; // Skip drawing alive avatar when dead without deleting state

            if (rp.targetX !== undefined && rp.targetY !== undefined) {
                if (rp.renderX === undefined) rp.renderX = rp.targetX;
                if (rp.renderY === undefined) rp.renderY = rp.targetY;
                const dist = Math.hypot(rp.targetX - rp.renderX, rp.targetY - rp.renderY);
                if (dist > TILE_SIZE * 16) {
                    // Teleport / instant snap for massive jumps / respawns
                    rp.renderX = rp.targetX;
                    rp.renderY = rp.targetY;
                } else {
                    // Delta-time compensated smooth linear interpolation (glides smoothly at 60Hz/120Hz/144Hz)
                    const lerpFactor = Math.min(1.0, Math.max(0.10, 0.22 * (frameDeltaMs / 16.67)));
                    rp.renderX += (rp.targetX - rp.renderX) * lerpFactor;
                    rp.renderY += (rp.targetY - rp.renderY) * lerpFactor;
                }
            }
            let remoteX = rp.renderX !== undefined ? rp.renderX : (rp.targetX || rp.x || 0);
            let remoteY = rp.renderY !== undefined ? rp.renderY : (rp.targetY || rp.y || 0);
            let drawX = Math.floor(remoteX - camera.x);
            let drawY = Math.floor(remoteY - camera.y);

            // Simple drop shadow for remote players
            if (advancedGraphics) {
                const rpW = TILE_SIZE * 0.75;
                ctx.drawImage(cachedShadowCanvas, drawX + rpW/2 - rpW/2.5, drawY + (TILE_SIZE * 1.8) - 6, rpW * (2/2.5), 8);
            }
            
            // Calculate walking animation for remote players
            let dx = (rp.targetX !== undefined ? rp.targetX : (rp.x || 0)) - remoteX;
            let dy = (rp.targetY !== undefined ? rp.targetY : (rp.y || 0)) - remoteY;
            let isClimbingRemote = Boolean(rp.isClimbing);
            let isMovingRemote = Boolean(rp.isMoving || Math.abs(rp.vx || 0) > 0.08 || Math.abs(dx) > 0.1);
            
            if (isClimbingRemote) {
                rp.walkAnimTime = (rp.walkAnimTime || 0) + 0.18;
            } else if (isMovingRemote) {
                rp.walkAnimTime = (rp.walkAnimTime || 0) + 0.18;
            } else if (Math.abs(dy) > 0.5) {
                rp.walkAnimTime = Math.PI / 6; 
            } else {
                rp.walkAnimTime = 0;
            }

            if (rp.damageCooldown > 0) rp.damageCooldown--;

            let canvasToDraw = rp.canvas || skinCanvasObj;
            drawCharacter(
                ctx, canvasToDraw, drawX, drawY, TILE_SIZE*0.75, TILE_SIZE*1.8,
                rp.facingRight !== false, rp.walkAnimTime || 0, isMovingRemote, (rp.damageCooldown || 0) > 0, null, null, false, rp.heldItem, isClimbingRemote,
                rp.equippedArmor || [null, null, null, null]
            );

            // Nametag
            let pName = (rp.playerName || rpId.substring(0,6)).substring(0,16);
            ctx.font = '16px "VT323"';
            let nameWidth = ctx.measureText(pName).width;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(drawX + (TILE_SIZE*0.75)/2 - nameWidth/2 - 4, drawY - 20, nameWidth + 8, 18);
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText(pName, drawX + (TILE_SIZE*0.75)/2, drawY - 6);
            ctx.textAlign = 'left';

            // Health bar above remote player
            if (Number.isFinite(rp.health) && rp.health < 20 && !rp.isDead) {
                const barW = TILE_SIZE * 0.75 + 16;
                const barH = 4;
                const barX = drawX - 8;
                const barY = drawY - 26;
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(barX, barY, barW, barH);
                const healthFrac = Math.max(0, Math.min(1, rp.health / 20));
                let barColor = (rp.isPoisoned || rp.poisonTimer > 0) ? '#84cc16' : (healthFrac > 0.5 ? '#22c55e' : (healthFrac > 0.2 ? '#eab308' : '#ef4444'));
                ctx.fillStyle = barColor;
                ctx.fillRect(barX, barY, barW * healthFrac, barH);
            }

            // Poison particles rising from poisoned remote player
            if ((rp.isPoisoned || rp.poisonTimer > 0) && frameCount % 14 === 0 && !rp.isDead) {
                let pp = spawnParticle(remoteX + Math.random() * (TILE_SIZE * 0.75), remoteY + Math.random() * (TILE_SIZE * 1.5), '#4ade80');
                if (pp) {
                    pp.vy = -1.0 - Math.random() * 0.8;
                    pp.vx = (Math.random() - 0.5) * 0.8;
                    pp.life = 18;
                }
            }
        }

        droppedItems.forEach(d => { if (d && typeof d.draw === 'function') d.draw(ctx, camX, camY); });
        entities.forEach(e => e.draw(ctx, camX, camY));
        player.draw(ctx, camX, camY);
        
        // Poison particles rising from local player
        if (player.poisonTimer > 0 && frameCount % 14 === 0 && !player.isDead) {
            let pp = spawnParticle(player.x + Math.random() * player.width, player.y + Math.random() * player.height, '#4ade80');
            if (pp) {
                pp.vy = -1.0 - Math.random() * 0.8;
                pp.vx = (Math.random() - 0.5) * 0.8;
                pp.life = 18;
            }
        }
        for (let i = 0; i < particles.length; i++) {
            if (particles[i].alive) particles[i].draw(ctx, camX, camY);
        }
        for (let i = 0; i < noteParticles.length; i++) {
            if (noteParticles[i].alive) noteParticles[i].draw(ctx, camX, camY);
        }
        floatingTexts.forEach(t => t.draw(ctx, camX, camY));
        // Draw falling blocks and snowball projectiles
        fallingBlocks.forEach(fb => fb.draw(ctx, camX, camY));
        activeProjectiles.forEach(proj => proj.draw(ctx, camX, camY));

        if (advancedGraphics) {
            ctx.save();
            ctx.globalAlpha = 0.22;
            ctx.fillStyle = '#d5c9a3';
            for (let mote = 0; mote < 14; mote++) {
                let moteX = ((mote * 173 + frameCount * (0.18 + mote * 0.01)) % (canvas.width + 40)) - 20;
                let moteY = ((mote * 97 + frameCount * (0.11 + mote * 0.008)) % (canvas.height + 40)) - 20;
                ctx.fillRect(Math.floor(moteX), Math.floor(moteY), mote % 3 === 0 ? 3 : 2, mote % 4 === 0 ? 3 : 2);
            }
            ctx.restore();
        }

        if (STATE === 'PLAYING' && !isInventoryOpen) {
            let hX = Math.floor(mouse.worldX / TILE_SIZE); let hY = Math.floor(mouse.worldY / TILE_SIZE);
            let pCX = player.x + player.width/2; let pCY = player.y + player.height/2;
            let hCX = hX * TILE_SIZE + TILE_SIZE/2; let hCY = hY * TILE_SIZE + TILE_SIZE/2;
            
            if (hX >= 0 && hX < WORLD_WIDTH && hY >= 0 && hY < WORLD_HEIGHT) {
                if (Math.hypot(pCX-hCX, pCY-hCY) / TILE_SIZE <= REACH) {
                    let drawX = hX * TILE_SIZE - camX; let drawY = hY * TILE_SIZE - camY;
                    const curBgMode = (typeof window !== 'undefined' && window.isBackgroundBuildMode !== undefined) ? window.isBackgroundBuildMode : isBackgroundBuildMode;
                    ctx.strokeStyle = curBgMode ? 'rgba(245, 158, 11, 0.95)' : 'rgba(255, 255, 255, 0.5)';
                    ctx.lineWidth = curBgMode ? 2.5 : 2;
                    ctx.strokeRect(drawX, drawY, TILE_SIZE, TILE_SIZE);

                    if (miningTarget.x === hX && miningTarget.y === hY && miningTarget.progress > 0) {
                        let activeBlock = curBgMode ? (bgWorld[hX]?.[hY] || IDS.AIR) : world[hX][hY];
                        let ratio = Math.max(0, Math.min(1, miningTarget.progress / (HARDNESS[activeBlock] || 100)));
                        let stageIdx = Math.min(9, Math.floor(ratio * 10));
                        const crackPixels = (typeof BLOCK_CRACK_STAGES !== 'undefined' && BLOCK_CRACK_STAGES[stageIdx]) ? BLOCK_CRACK_STAGES[stageIdx] : [];

                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                        ctx.clip();

                        // 1. Subtle block structural stress darkening as damage increases
                        if (ratio > 0.15) {
                            ctx.fillStyle = curBgMode ? `rgba(180, 83, 9, ${ratio * 0.18})` : `rgba(0, 0, 0, ${ratio * 0.22})`;
                            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                        }

                        // 2. Crisp integer pixel micro-shake on mining impact (integer snap keeps pixel-art sharp)
                        const shakeIntensity = (ratio > 0.05) ? Math.min(1.5, ratio * 1.5) : 0;
                        const shakeX = (shakeIntensity > 0) ? Math.round(Math.sin(frameCount * 3.0) * shakeIntensity) : 0;
                        const shakeY = (shakeIntensity > 0) ? Math.round(Math.cos(frameCount * 3.6) * (shakeIntensity * 0.6)) : 0;

                        if (crackPixels.length > 0) {
                            // 3. Pixel-Art 3D Relief Highlight (+1px physical offset)
                            ctx.fillStyle = curBgMode ? 'rgba(255, 235, 175, 0.40)' : 'rgba(255, 255, 255, 0.35)';
                            for (let i = 0; i < crackPixels.length; i++) {
                                const [tx, ty] = crackPixels[i];
                                const x0 = Math.floor(tx * TILE_SIZE / 16);
                                const x1 = Math.floor((tx + 1) * TILE_SIZE / 16);
                                const y0 = Math.floor(ty * TILE_SIZE / 16);
                                const y1 = Math.floor((ty + 1) * TILE_SIZE / 16);
                                ctx.fillRect(drawX + x0 + shakeX + 1, drawY + y0 + shakeY + 1, x1 - x0, y1 - y0);
                            }

                            // 4. Pixel-Art Dark Core Fracture Fissure (Snap-to-grid 16x16 texels)
                            ctx.fillStyle = curBgMode ? 'rgba(120, 53, 15, 0.96)' : 'rgba(10, 10, 10, 0.95)';
                            for (let i = 0; i < crackPixels.length; i++) {
                                const [tx, ty] = crackPixels[i];
                                const x0 = Math.floor(tx * TILE_SIZE / 16);
                                const x1 = Math.floor((tx + 1) * TILE_SIZE / 16);
                                const y0 = Math.floor(ty * TILE_SIZE / 16);
                                const y1 = Math.floor((ty + 1) * TILE_SIZE / 16);
                                ctx.fillRect(drawX + x0 + shakeX, drawY + y0 + shakeY, x1 - x0, y1 - y0);
                            }
                        }

                        ctx.restore();
                    }

                    // Controller Aim Reticle Overlay
                    if (typeof window !== 'undefined' && window.GamepadManager && window.GamepadManager.isUsingGamepad) {
                        let reticleX = Math.round(mouse.worldX - camX);
                        let reticleY = Math.round(mouse.worldY - camY);
                        ctx.save();
                        ctx.fillStyle = curBgMode ? '#f59e0b' : '#38bdf8';
                        ctx.fillRect(reticleX - 4, reticleY - 1, 9, 2);
                        ctx.fillRect(reticleX - 1, reticleY - 4, 2, 9);
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(reticleX, reticleY, 1, 1);
                        ctx.restore();
                    }
                }
            }
        }

        if (!advancedGraphics) return;

        lightCtx.globalCompositeOperation = 'source-over';
        lightCtx.clearRect(0, 0, lightCanvas.width, lightCanvas.height);
        
        let surfaceDarkness = 0;
        if (timeOfDay > 0.58 && timeOfDay <= 0.68) surfaceDarkness = (timeOfDay - 0.58) * 8; 
        else if (timeOfDay > 0.68 && timeOfDay <= 0.90) surfaceDarkness = 0.8;
        else if (timeOfDay > 0.90) surfaceDarkness = 0.8 - ((timeOfDay - 0.90) * 8);
        surfaceDarkness = Math.max(0, Math.min(0.85, surfaceDarkness));

        // Depth darkness: Smoothly scales darker as you descend into deep underground caves
        let ambientDarkness = Math.max(surfaceDarkness, caveSkyOpacity * 0.94);

        if (ambientDarkness > 0) {
            lightCtx.fillStyle = `rgba(0, 0, 15, ${ambientDarkness})`;
            lightCtx.fillRect(0, 0, lightCanvas.width, lightCanvas.height);
        }

        lightCtx.globalCompositeOperation = 'destination-out';
        
        function drawLight(worldX, worldY, radius, intensity) {
            let drawX = (worldX - camera.x) * LIGHT_SCALE;
            let drawY = (worldY - camera.y) * LIGHT_SCALE;
            let r = radius * LIGHT_SCALE;
            if (drawX < -r || drawX > lightCanvas.width + r || drawY < -r || drawY > lightCanvas.height + r) return;
            lightCtx.globalAlpha = intensity;
            lightCtx.drawImage(cachedTorchLightCanvas, drawX - r, drawY - r, r * 2, r * 2);
        }

        furnaces.forEach(f => {
            if (f.burnTime > 0) {
                visibleLightSources.push({ x: f.x * TILE_SIZE + TILE_SIZE/2, y: f.y * TILE_SIZE + TILE_SIZE/2, type: 'furnace', obj: f });
            }
        });

        let heldItem = inventory[selectedHotbarIndex];
        let offhandItem = inventory[27];
        if ((heldItem && heldItem.id === IDS.TORCH) || (offhandItem && offhandItem.id === IDS.TORCH)) {
            visibleLightSources.push({ x: player.x + player.width/2, y: player.y + player.height/2, type: 'player_torch' });
        }
        
        for(let rpId in remotePlayers) {
            let rp = remotePlayers[rpId];
            if (rp && !rp.isDead && !rp.isDisconnected && (!rp.lastSeenLocalTime || Date.now() - rp.lastSeenLocalTime < 12000) && rp.heldItem === IDS.TORCH) {
                let rx = rp.renderX !== undefined ? rp.renderX : (rp.x || 0);
                let ry = rp.renderY !== undefined ? rp.renderY : (rp.y || 0);
                visibleLightSources.push({ x: rx + TILE_SIZE/2, y: ry + TILE_SIZE/2, type: 'remote_torch' });
            }
        }

        if (fabulousGraphics) {
            for (let i = 0; i < visibleFluids.length; i++) {
                const vf = visibleFluids[i];
                if (vf.fluid && vf.fluid.type === IDS.LAVA && i % 2 === 0) {
                    visibleLightSources.push({ x: vf.fluidX * TILE_SIZE + TILE_SIZE/2, y: vf.fluidY * TILE_SIZE + TILE_SIZE/2, type: 'lava' });
                }
            }
        }

        for (let i = 0; i < visibleLightSources.length; i++) {
            const ls = visibleLightSources[i];
            if (ls.type === 'torch') {
                let torchFlicker = 0.94 + Math.sin(frameCount * 0.16 + ls.gridX * 1.7 + ls.gridY) * 0.06;
                drawLight(ls.x, ls.y, TILE_SIZE * 5, torchFlicker);
            } else if (ls.type === 'furnace') {
                let furnaceFlicker = 0.78 + Math.sin(frameCount * 0.12 + ls.obj.x) * 0.08;
                drawLight(ls.x, ls.y, TILE_SIZE * 4.5, furnaceFlicker);
            } else if (ls.type === 'lava') {
                drawLight(ls.x, ls.y, TILE_SIZE * 4.2, 0.75);
            } else {
                drawLight(ls.x, ls.y, TILE_SIZE * 5, 0.9);
            }
        }
        
        lightCtx.globalCompositeOperation = 'source-over';
        if (cachedLightVignette) {
            let vignetteStrength = 0.12 + caveSkyOpacity * 0.38;
            lightCtx.globalAlpha = vignetteStrength;
            lightCtx.fillStyle = cachedLightVignette;
            lightCtx.fillRect(0, 0, lightCanvas.width, lightCanvas.height);
            lightCtx.globalAlpha = 1.0;
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(lightCanvas, 0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;

        if (advancedGraphics) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const glowR = TILE_SIZE * 1.7;
            const glowD = glowR * 2;
            for (let i = 0; i < visibleLightSources.length; i++) {
                const ls = visibleLightSources[i];
                if (ls.type === 'torch') {
                    let gx = ls.x - camera.x;
                    let gy = ls.y - camera.y;
                    ctx.drawImage(cachedTorchGlowCanvas, gx - glowR, gy - glowR, glowD, glowD);
                    ctx.fillStyle = 'rgba(255, 235, 160, 0.34)';
                    ctx.fillRect(Math.floor(gx - 3), Math.floor(gy - 3), 6, 6);
                }
            }
            ctx.restore();
        }

        let atmosphereColor = 'rgba(0, 0, 0, 0)';
        if (timeOfDay >= 0.36 && timeOfDay < 0.48) {
            const warmFactor = Math.sin((timeOfDay - 0.36) / 0.12 * Math.PI);
            atmosphereColor = `rgba(255, 120, 50, ${(warmFactor * 0.035).toFixed(4)})`;
        } else if (timeOfDay >= 0.48 && timeOfDay < 0.84) {
            atmosphereColor = 'rgba(18, 32, 75, 0.035)';
        } else if (timeOfDay >= 0.84 && timeOfDay < 0.96) {
            const dawnFactor = Math.sin((timeOfDay - 0.84) / 0.12 * Math.PI);
            atmosphereColor = `rgba(255, 180, 80, ${(dawnFactor * 0.025).toFixed(4)})`;
        }
        if (atmosphereColor !== 'rgba(0, 0, 0, 0)') {
            ctx.fillStyle = atmosphereColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (showHeatShimmer) drawDesertHeatShimmer(ctx, canvas.width, canvas.height, camera.x);
        drawForestGodRays(ctx, canvas.width, canvas.height, camera.x, camera.y);
        drawPlainsWindBreeze(ctx, canvas.width, canvas.height, camera.x, camera.y);
        updateAndDrawFabulousParticles(ctx, camera.x, camera.y, canvas.width, canvas.height);
        if (showBiomeGrading) drawBiomeGrading(ctx, canvas.width, canvas.height);
        if (showVignette) drawVignette(ctx, canvas.width, canvas.height);

        // Smoothly darken and illuminate orange frame in Background Build Mode
        const curBgModeForDarkness = (typeof window !== 'undefined' && window.isBackgroundBuildMode !== undefined) ? window.isBackgroundBuildMode : isBackgroundBuildMode;
        const targetBgDarkness = curBgModeForDarkness ? 0.45 : 0;
        bgBuildDarknessAlpha += (targetBgDarkness - bgBuildDarknessAlpha) * 0.18;
        if (bgBuildDarknessAlpha > 0.005) {
            ctx.save();
            // Subtle backdrop tint
            ctx.fillStyle = `rgba(18, 12, 6, ${bgBuildDarknessAlpha * 0.55})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Light warm orange radial vignette around entire screen
            const maxR = Math.hypot(canvas.width / 2, canvas.height / 2);
            const orangeVig = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, Math.max(1, maxR * 0.35),
                canvas.width / 2, canvas.height / 2, Math.max(2, maxR)
            );
            const edgeAlpha = (bgBuildDarknessAlpha * 0.45).toFixed(3);
            const midAlpha = (bgBuildDarknessAlpha * 0.20).toFixed(3);
            orangeVig.addColorStop(0, 'rgba(255, 160, 40, 0.02)');
            orangeVig.addColorStop(0.65, `rgba(255, 140, 30, ${midAlpha})`);
            orangeVig.addColorStop(1.0, `rgba(255, 115, 15, ${edgeAlpha})`);
            ctx.fillStyle = orangeVig;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Glowing light orange perimeter frame border
            const frameAlpha = (bgBuildDarknessAlpha * 0.75).toFixed(3);
            ctx.strokeStyle = `rgba(255, 150, 30, ${frameAlpha})`;
            ctx.lineWidth = 4;
            ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
            ctx.restore();
        }
    }

    export function updateTimeUI() {
        let t = "Morning";
        if (timeOfDay >= 0.92 || timeOfDay < 0.04) t = "Sunrise";
        else if (timeOfDay < 0.25) t = "Morning";
        else if (timeOfDay < 0.60) t = "Afternoon";
        else if (timeOfDay < 0.70) t = "Sunset";
        else t = "Night";
        drawTimeClock(timeOfDay);
        document.getElementById('time-display').innerText = t;
        document.getElementById('day-counter').innerText = dayCount;
    }

    export function drawTimeClock(time) {
        const clockCanvas = document.getElementById('time-clock');
        if (!clockCanvas) return;
        const ctx = clockCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, 76, 76);

        // Center on 76x76 canvas with 2px integer grid
        const cx = 38;
        const cy = 40;
        const activeColor = (typeof window !== 'undefined' && window.currentAccentColor) || currentAccentColor || '#e5a823';
        const palette = getAccentPalette(activeColor);

        // 1. Top Crown Loop (Pocket watch ring stem) in 2px blocks
        ctx.fillStyle = palette.darker;
        ctx.fillRect(30, 2, 16, 8);
        ctx.fillStyle = palette.base;
        ctx.fillRect(32, 4, 12, 6);
        ctx.fillStyle = '#20252b'; // Cutout hole
        ctx.fillRect(34, 4, 8, 4);

        // Pixel-art stepped circle generator (quantized to 2px grid steps)
        const drawPixelCircle = (gridRadius, color) => {
            ctx.fillStyle = color;
            for (let gy = -gridRadius; gy <= gridRadius; gy++) {
                const rSq = gridRadius * gridRadius;
                const ySq = gy * gy;
                if (ySq <= rSq) {
                    const gxSpan = Math.floor(Math.sqrt(rSq - ySq));
                    ctx.fillRect(cx - gxSpan * 2, cy + gy * 2, gxSpan * 4, 2);
                }
            }
        };

        // 2. Outer Beveled Pocket Watch Body (Matches Accent Color)
        drawPixelCircle(17, '#080a0c'); // Outer dark rim (diameter ~68px)
        drawPixelCircle(16, palette.darker); // Deep accent edge
        drawPixelCircle(15, palette.dark); // Rich accent body
        drawPixelCircle(13.5, palette.base); // Bright accent highlight

        // 3D Bevel Highlights & Glints (Stepped Pixel Rectangles)
        ctx.fillStyle = palette.light; // Top-left glint
        ctx.fillRect(cx - 22, cy - 26, 16, 4);
        ctx.fillRect(cx - 26, cy - 22, 4, 16);
        ctx.fillStyle = '#080a0c'; // Bottom-right shadow bevel
        ctx.fillRect(cx + 10, cy + 24, 14, 4);
        ctx.fillRect(cx + 24, cy + 10, 4, 14);

        // 3. Inner Dark Recessed Well
        drawPixelCircle(12, '#111418');

        // 4. Clip to Stepped Celestial Viewport
        ctx.save();
        ctx.beginPath();
        const vRadius = 11;
        for (let gy = -vRadius; gy <= vRadius; gy++) {
            const rSq = vRadius * vRadius;
            const ySq = gy * gy;
            if (ySq <= rSq) {
                const gxSpan = Math.floor(Math.sqrt(rSq - ySq));
                ctx.rect(cx - gxSpan * 2, cy + gy * 2, gxSpan * 4, 2);
            }
        }
        ctx.clip();

        // 5. Rotate Celestial Disc (Daytime Sky / Night Sky)
        // timeOfDay: 0 = Dawn, 0.30 = High Noon, 0.65 = Sunset, 0.81 = Midnight
        const rotAngle = (time - 0.30) * Math.PI * 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotAngle);

        // Upper Half: Daytime Sky Blue
        ctx.fillStyle = '#3a88e9';
        ctx.fillRect(-38, -38, 76, 38);
        ctx.fillStyle = '#5ca2f5'; // Sky top highlight
        ctx.fillRect(-38, -38, 76, 12);

        // Horizon Warm Transitions (Stepped bands)
        ctx.fillStyle = '#f59e0b'; // Warm yellow horizon
        ctx.fillRect(-38, -10, 76, 5);
        ctx.fillStyle = '#ea580c'; // Dusk/dawn orange
        ctx.fillRect(-38, -5, 76, 5);

        // Lower Half: Midnight Cosmic Night Sky
        ctx.fillStyle = '#0a0f1d';
        ctx.fillRect(-38, 0, 76, 38);
        ctx.fillStyle = '#2d1454'; // Twilight purple horizon
        ctx.fillRect(-38, 0, 76, 5);

        // Twinkling Pixel Starfield across Night Sky
        ctx.fillStyle = '#ffffff';
        const stars = [
            [-18, 12], [16, 10], [-10, 24], [12, 26], [0, 16], [-20, 26], [22, 18], [-4, 30], [18, 30], [-14, 6], [10, 6]
        ];
        stars.forEach(([sx, sy]) => {
            ctx.fillRect(sx, sy, 2, 2);
        });
        ctx.fillStyle = '#80d8ff';
        [[-6, 12], [18, 24], [-12, 30], [6, 22]].forEach(([sx, sy]) => {
            ctx.fillRect(sx, sy, 2, 2);
        });

        // Golden Radiant Sun (positioned at top of disc)
        ctx.fillStyle = '#d97706'; // Sun outer amber corona
        ctx.fillRect(-10, -24, 20, 20);
        ctx.fillStyle = '#fbbf24'; // Sun bright yellow core
        ctx.fillRect(-8, -22, 16, 16);
        ctx.fillStyle = '#fffbeb'; // Sun hot yellow
        ctx.fillRect(-6, -20, 12, 12);
        ctx.fillStyle = '#ffffff'; // Sun glowing white center
        ctx.fillRect(-4, -18, 8, 8);

        // Silvery Luminous Moon (positioned at bottom of disc)
        ctx.fillStyle = '#94a3b8'; // Moon dark rim
        ctx.fillRect(-8, 6, 16, 16);
        ctx.fillStyle = '#e2e8f0'; // Moon silver surface
        ctx.fillRect(-7, 7, 14, 14);
        ctx.fillStyle = '#ffffff'; // Moon bright face
        ctx.fillRect(-6, 7, 10, 12);
        ctx.fillRect(-7, 8, 14, 10);
        ctx.fillStyle = '#64748b'; // Lunar craters
        ctx.fillRect(-4, 11, 4, 4);
        ctx.fillRect(2, 14, 4, 4);

        ctx.restore(); // unrotate

        // 6. Glass Curved Glare & Bottom Vignette Shading (Pixel Stepped)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
        ctx.fillRect(cx - 16, cy - 16, 6, 4);
        ctx.fillRect(cx - 20, cy - 12, 4, 6);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
        ctx.fillRect(cx - 14, cy - 20, 10, 4);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(cx - 16, cy + 12, 32, 10);

        ctx.restore(); // unclip
    }

    export function drawMinimap() {
        const mmCanvas = document.getElementById('minimap');
        if (!mmCanvas) return;
        const mmCtx = mmCanvas.getContext('2d');
        
        let pGridX = Math.floor(player.x / TILE_SIZE);
        let pGridY = Math.floor(player.y / TILE_SIZE);
        
        let tilesAcross = 64; 
        let startX = pGridX - Math.floor(tilesAcross / 2);
        let startY = pGridY - Math.floor(tilesAcross / 2);
        const curShape = (typeof window !== 'undefined' && window.minimapShape) ? window.minimapShape : minimapShape;
        const isCircle = curShape === 'circle';
        const circleLimitSq = 27.5 * 27.5;
        
        let idx = 0;
        for (let y = 0; y < 64; y++) {
            let gy = startY + y;
            let dy = y - 31.5;
            let dySq = dy * dy;
            for (let x = 0; x < 64; x++) {
                if (isCircle) {
                    let dx = x - 31.5;
                    if (dx * dx + dySq > circleLimitSq) {
                        minimapBuf32[idx++] = 0x00000000;
                        continue;
                    }
                }
                let gx = startX + x;
                if (gx >= 0 && gx < WORLD_WIDTH && gy >= 0 && gy < WORLD_HEIGHT) {
                    let block = world[gx][gy];
                    if (block !== IDS.AIR && block !== IDS.TORCH) {
                        minimapBuf32[idx++] = MINIMAP_COLOR_32[block] || 0xFF7D7D7D;
                    } else if (bgWorld && bgWorld[gx]?.[gy] !== IDS.AIR && bgWorld[gx]?.[gy] !== undefined) {
                        let bgB = bgWorld[gx][gy];
                        let baseColor = MINIMAP_COLOR_32[bgB] || 0xFF7D7D7D;
                        let a = (baseColor >>> 24) & 0xFF;
                        let b = ((baseColor >> 16) & 0xFF) >> 1;
                        let g = ((baseColor >> 8) & 0xFF) >> 1;
                        let r = (baseColor & 0xFF) >> 1;
                        minimapBuf32[idx++] = (a << 24) | (b << 16) | (g << 8) | r;
                    } else {
                        minimapBuf32[idx++] = 0xFF0A0A0A;
                    }
                } else if (gx < 0 || gx >= WORLD_WIDTH) {
                    minimapBuf32[idx++] = (gy >= halfHeight) ? 0xFFC86414 : 0xFF0A0A0A;
                } else {
                    minimapBuf32[idx++] = 0xFF0A0A0A;
                }
            }
        }
        
        // Draw local player (High-contrast red marker with white core)
        let center = 31;
        minimapBuf32[center * 64 + center] = 0xFFFFFFFF;
        minimapBuf32[center * 64 + center + 1] = 0xFF0000FF;
        minimapBuf32[(center + 1) * 64 + center] = 0xFF0000FF;
        minimapBuf32[(center + 1) * 64 + center + 1] = 0xFFFFFFFF;
        
        // Draw remote players (Cyan / Gold markers)
        for (let rpId in remotePlayers) {
            let rp = remotePlayers[rpId];
            if (rp && !rp.isDead && !rp.isDisconnected && (!rp.lastSeenLocalTime || Date.now() - rp.lastSeenLocalTime < 12000)) {
                let rx = rp.renderX !== undefined ? rp.renderX : (rp.x || 0);
                let ry = rp.renderY !== undefined ? rp.renderY : (rp.y || 0);
                let rpx = Math.floor(rx / TILE_SIZE) - startX;
                let rpy = Math.floor(ry / TILE_SIZE) - startY;
                if (rpx >= 0 && rpx < 63 && rpy >= 0 && rpy < 63) {
                    if (isCircle) {
                        let cdx = rpx - 31.5;
                        let cdy = rpy - 31.5;
                        if (cdx * cdx + cdy * cdy > circleLimitSq) continue;
                    }
                    let pIdx = rpy * 64 + rpx;
                    minimapBuf32[pIdx] = 0xFFFFFFFF;
                    minimapBuf32[pIdx + 1] = 0xFF00FFFF;
                    minimapBuf32[pIdx + 64] = 0xFF00FFFF;
                    minimapBuf32[pIdx + 65] = 0xFFFFFFFF;
                }
            }
        }

        minimapOffscreenCtx.putImageData(minimapImageData, 0, 0);
        mmCtx.imageSmoothingEnabled = false;
        mmCtx.clearRect(0, 0, mmCanvas.width, mmCanvas.height);
        mmCtx.drawImage(minimapOffscreenCanvas, 0, 0, mmCanvas.width, mmCanvas.height);
        if (isCircle && cachedMinimapCircleBezelCanvas) {
            mmCtx.drawImage(cachedMinimapCircleBezelCanvas, 0, 0);
        }
    }


    // ==========================================
    // FULLSCREEN WORLD MAP & ATLAS SUBSYSTEM
    // ==========================================
    export let isWorldMapOpen = false;
    export let mapPanX = 0; // Center coordinate in tiles
    export let mapPanY = 0; // Center coordinate in tiles
    export let mapZoom = 1.0;
    export let isMapDragging = false;
    export let mapDragStartX = 0;
    export let mapDragStartY = 0;
    export let mapDragOriginPanX = 0;
    export let mapDragOriginPanY = 0;
    export let mapHoverTileX = 0;
    export let mapHoverTileY = 0;
    export let mapAnimFrameId = null;
    export let mapEventsInitialized = false;

    export function setIsWorldMapOpen(val) {
        isWorldMapOpen = !!val;
        if (typeof window !== 'undefined') window.isWorldMapOpen = !!val;
    }

    export function setMapPan(x, y) {
        mapPanX = x;
        mapPanY = y;
        if (typeof window !== 'undefined') {
            window.mapPanX = x;
            window.mapPanY = y;
        }
    }

    export function setMapZoom(z) {
        mapZoom = z;
        if (typeof window !== 'undefined') window.mapZoom = z;
    }

    // High performance offscreen cache canvas
    export let offscreenMapCanvas = null;
    export let offscreenMapCtx = null;
    export let isOffscreenMapDirty = true;


    export function buildFullOffscreenMap() {
        const curWorld = world || (typeof window !== 'undefined' && window.world);
        if (!curWorld) return;
        if (!offscreenMapCanvas) {
            offscreenMapCanvas = document.createElement('canvas');
            offscreenMapCtx = offscreenMapCanvas.getContext('2d', { alpha: false });
        }
        if (offscreenMapCanvas.width !== WORLD_WIDTH || offscreenMapCanvas.height !== WORLD_HEIGHT) {
            offscreenMapCanvas.width = WORLD_WIDTH;
            offscreenMapCanvas.height = WORLD_HEIGHT;
        }
        
        const curBgWorld = bgWorld || (typeof window !== 'undefined' && window.bgWorld);
        const imgData = offscreenMapCtx.createImageData(WORLD_WIDTH, WORLD_HEIGHT);
        const buf32 = new Uint32Array(imgData.data.buffer);
        buf32.fill(0xFF261710); // #101726 sky background in ABGR

        for (let x = 0; x < WORLD_WIDTH; x++) {
            const col = curWorld[x];
            const bgCol = curBgWorld ? curBgWorld[x] : null;
            if (!col) continue;
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                const block = col[y];
                const idx = y * WORLD_WIDTH + x;
                if (block !== undefined && block !== IDS.AIR && block !== IDS.TORCH) {
                    buf32[idx] = MINIMAP_COLOR_32[block] || 0xFF7D7D7D;
                } else {
                    const fl = getFluid(x, y);
                    if (fl) {
                        buf32[idx] = fl.type === IDS.LAVA ? 0xFF045DE8 : 0xFFB86B1E;
                    } else if (bgCol && bgCol[y] !== undefined && bgCol[y] !== IDS.AIR) {
                        buf32[idx] = 0xFF30241E; // #1e2430 in ABGR
                    }
                }
            }
        }
        offscreenMapCtx.putImageData(imgData, 0, 0);
        isOffscreenMapDirty = false;
    }


    export function renderWorldMapLoop() {
        const isOpen = (typeof window !== 'undefined' && window.isWorldMapOpen !== undefined) ? window.isWorldMapOpen : isWorldMapOpen;
        if (!isOpen) return;
        renderWorldMapFrame();
        mapAnimFrameId = requestAnimationFrame(renderWorldMapLoop);
    }

    export function renderWorldMapFrame() {
        const mapCanvas = document.getElementById('world-map-canvas');
        if (!mapCanvas) return;
        
        const container = document.getElementById('world-map-container');
        if (container) {
            const w = container.clientWidth || mapCanvas.clientWidth || 800;
            const h = container.clientHeight || mapCanvas.clientHeight || 500;
            if (w > 0 && h > 0 && (mapCanvas.width !== w || mapCanvas.height !== h)) {
                mapCanvas.width = w;
                mapCanvas.height = h;
            }
        }

        const ctx = mapCanvas.getContext('2d');
        const cw = mapCanvas.width;
        const ch = mapCanvas.height;
        if (cw <= 0 || ch <= 0) return;

        // Background dark void
        ctx.fillStyle = '#080a0e';
        ctx.fillRect(0, 0, cw, ch);

        const cx = cw / 2;
        const cy = ch / 2;
        const curZoom = (typeof window !== 'undefined' && window.mapZoom !== undefined) ? window.mapZoom : mapZoom;
        const curPanX = (typeof window !== 'undefined' && window.mapPanX !== undefined) ? window.mapPanX : mapPanX;
        const curPanY = (typeof window !== 'undefined' && window.mapPanY !== undefined) ? window.mapPanY : mapPanY;
        const tileSize = Math.max(1, 4 * curZoom);

        if (isOffscreenMapDirty || !offscreenMapCanvas) {
            buildFullOffscreenMap();
        }

        if (!offscreenMapCanvas) return;

        // Draw offscreen world canvas in 1 single ultra-fast blit
        const drawStartX = Math.floor(cx - curPanX * tileSize);
        const drawStartY = Math.floor(cy - curPanY * tileSize);
        const drawWidth = Math.floor(WORLD_WIDTH * tileSize);
        const drawHeight = Math.floor(WORLD_HEIGHT * tileSize);

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(offscreenMapCanvas, drawStartX, drawStartY, drawWidth, drawHeight);

        // Pixel-art World border
        ctx.strokeStyle = '#46515a';
        ctx.lineWidth = 2;
        ctx.strokeRect(drawStartX, drawStartY, drawWidth, drawHeight);

        const curWorld = world || (typeof window !== 'undefined' && window.world);
        // Draw torches as glowing yellow pixel squares
        const startTileX = Math.max(0, Math.floor(curPanX - cx / tileSize) - 1);
        const endTileX = Math.min(WORLD_WIDTH - 1, Math.ceil(curPanX + cx / tileSize) + 1);
        const startTileY = Math.max(0, Math.floor(curPanY - cy / tileSize) - 1);
        const endTileY = Math.min(WORLD_HEIGHT - 1, Math.ceil(curPanY + cy / tileSize) + 1);

        if (curWorld) {
            for (let x = startTileX; x <= endTileX; x++) {
                const screenX = Math.floor(cx + (x - curPanX) * tileSize);
                for (let y = startTileY; y <= endTileY; y++) {
                    if (curWorld[x]?.[y] === IDS.TORCH) {
                        const screenY = Math.floor(cy + (y - curPanY) * tileSize);
                        ctx.fillStyle = '#ffea6c';
                        ctx.fillRect(screenX, screenY, Math.max(2, tileSize * 0.75), Math.max(2, tileSize * 0.75));
                    }
                }
            }
        }

        // Render Remote Players (Multiplayer) with Pixel Diamond Markers
        if (isMultiplayer) {
            for (let rpId in remotePlayers) {
                let rp = remotePlayers[rpId];
                if (rp && !rp.isDead && !rp.isDisconnected && (!rp.lastSeenLocalTime || Date.now() - rp.lastSeenLocalTime < 12000)) {
                    let rx = (rp.renderX !== undefined ? rp.renderX : (rp.x || 0)) / TILE_SIZE;
                    let ry = ((rp.renderY !== undefined ? rp.renderY : (rp.y || 0)) + 35) / TILE_SIZE;
                    let rScreenX = Math.floor(cx + (rx - curPanX) * tileSize);
                    let rScreenY = Math.floor(cy + (ry - curPanY) * tileSize);

                    // Pixel Diamond 5x5
                    const rPixelScale = 2;
                    const rDiamond = [
                        [0,1,0],
                        [1,2,1],
                        [0,1,0]
                    ];
                    for (let dy = 0; dy < 3; dy++) {
                        for (let dx = 0; dx < 3; dx++) {
                            if (rDiamond[dy][dx] > 0) {
                                ctx.fillStyle = rDiamond[dy][dx] === 2 ? '#ffffff' : '#00e5ff';
                                ctx.fillRect(rScreenX - 3 + dx * rPixelScale, rScreenY - 3 + dy * rPixelScale, rPixelScale, rPixelScale);
                            }
                        }
                    }

                    // Remote player pixel name tag
                    ctx.font = 'bold 16px VT323, monospace';
                    ctx.textAlign = 'center';
                    let rName = rp.playerName || 'Player';
                    const tagW = ctx.measureText(rName).width + 8;
                    ctx.fillStyle = '#171b20';
                    ctx.fillRect(rScreenX - tagW / 2, rScreenY - 22, tagW, 16);
                    ctx.strokeStyle = '#00e5ff';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(rScreenX - tagW / 2, rScreenY - 22, tagW, 16);
                    ctx.fillStyle = '#00e5ff';
                    ctx.fillText(rName, rScreenX, rScreenY - 10);
                }
            }
        }

        // Render Local Player Marker & Pixel-Art Beacon
        const curPlayer = player || (typeof window !== 'undefined' && window.player);
        if (curPlayer) {
            const px = curPlayer.x / TILE_SIZE;
            const py = (curPlayer.y + (curPlayer.height || 48) / 2) / TILE_SIZE;
            const pScreenX = Math.round(cx + (px - curPanX) * tileSize);
            const pScreenY = Math.round(cy + (py - curPanY) * tileSize);

            // Animated pixel pulse box
            const pulseCycle = (Date.now() % 1200) / 1200;
            const pulseSize = Math.round(10 + pulseCycle * 24);
            ctx.strokeStyle = `rgba(255, 60, 60, ${1 - pulseCycle})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(pScreenX - pulseSize / 2, pScreenY - pulseSize / 2, pulseSize, pulseSize);

            // Pixel-Art Diamond Beacon
            const diamondPattern = [
                [0,0,1,0,0],
                [0,1,2,1,0],
                [1,2,3,2,1],
                [0,1,2,1,0],
                [0,0,1,0,0]
            ];
            const pixelScale = Math.max(2, Math.min(4, Math.round(2 * curZoom)));
            const dOffset = Math.floor(diamondPattern.length / 2) * pixelScale;

            for (let dy = 0; dy < diamondPattern.length; dy++) {
                for (let dx = 0; dx < diamondPattern[dy].length; dx++) {
                    let val = diamondPattern[dy][dx];
                    if (val > 0) {
                        ctx.fillStyle = val === 3 ? '#ffffff' : (val === 2 ? '#ff3333' : '#990000');
                        ctx.fillRect(pScreenX - dOffset + dx * pixelScale, pScreenY - dOffset + dy * pixelScale, pixelScale, pixelScale);
                    }
                }
            }

            // Pixel-Art "YOU ARE HERE" Callout Box
            const tagText = "YOU ARE HERE";
            ctx.font = 'bold 18px VT323, monospace';
            ctx.textAlign = 'center';
            const textWidth = ctx.measureText(tagText).width;
            const boxW = Math.round(textWidth + 18);
            const boxH = 24;
            const boxX = Math.round(pScreenX - boxW / 2);
            const boxY = Math.round(pScreenY - 32);

            // Pin stem (pixel line)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(pScreenX - 1, boxY + boxH, 2, Math.max(0, pScreenY - dOffset - (boxY + boxH)));

            // Pixel-art Box Background & Borders
            ctx.fillStyle = '#171b20';
            ctx.fillRect(boxX, boxY, boxW, boxH);
            
            // Red outer border
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(boxX, boxY, boxW, 2);
            ctx.fillRect(boxX, boxY + boxH - 2, boxW, 2);
            ctx.fillRect(boxX, boxY, 2, boxH);
            ctx.fillRect(boxX + boxW - 2, boxY, 2, boxH);

            // Gold corner pixels
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(boxX, boxY, 2, 2);
            ctx.fillRect(boxX + boxW - 2, boxY, 2, 2);
            ctx.fillRect(boxX, boxY + boxH - 2, 2, 2);
            ctx.fillRect(boxX + boxW - 2, boxY + boxH - 2, 2, 2);

            // Text
            ctx.fillStyle = '#ffffff';
            ctx.fillText(tagText, pScreenX, boxY + 17);
        }

        // Coordinate Grid ticks when zoomed in
        if (curZoom >= 1.4) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            for (let x = Math.ceil(startTileX / 10) * 10; x <= endTileX; x += 10) {
                const sx = Math.floor(cx + (x - curPanX) * tileSize);
                ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, ch); ctx.stroke();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                ctx.font = '13px VT323, monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`X:${x}`, sx + 3, 16);
            }
        }

        if (typeof updateMapCoordinateReadout === 'function') updateMapCoordinateReadout();
        else if (typeof window !== 'undefined' && typeof window.updateMapCoordinateReadout === 'function') window.updateMapCoordinateReadout();
    }

    export function getMapBlockColor(block) {
        switch(block) {
            case IDS.GRASS: return '#56912a';
            case IDS.SHORT_GRASS: case IDS.TALL_GRASS: return '#4caf50';
            case IDS.FLOWER_RED: return '#e53935';
            case IDS.FLOWER_YELLOW: return '#fdd835';
            case IDS.SAPLING: return '#43a047';
            case IDS.DIRT: return '#7b5433';
            case IDS.STONE: return '#696c73';
            case IDS.WOOD: return '#86572e';
            case IDS.LEAVES: return '#306e23';
            case IDS.SAND: return '#d6b876';
            case IDS.SNOW: return '#e4edf2';
            case IDS.COAL_ORE: return '#2c2c2c';
            case IDS.IRON_ORE: return '#cb9a82';
            case IDS.GOLD_ORE: return '#f3c737';
            case IDS.DIAMOND_ORE: return '#52e8be';
            case IDS.BED: return '#be2828';
            case IDS.CHEST: return '#b67434';
            case IDS.FURNACE: return '#515459';
            case IDS.CRAFTING_TABLE: return '#885c32';
            case IDS.JUKEBOX: return '#5c3a21';
            case IDS.CACTUS: return '#367c2a';
            case IDS.DOOR: case IDS.DOOR_TOP: case IDS.DOOR_OPEN: case IDS.DOOR_OPEN_TOP: return '#935e2e';
            default: return '#777777';
        }
    }


// Global Window Bridge for cross-module & HTML event compatibility
try { if (typeof ARMOR_DEFENSE !== "undefined") window.ARMOR_DEFENSE = ARMOR_DEFENSE; } catch(e) {}
try { if (typeof ARMOR_DURABILITY !== "undefined") window.ARMOR_DURABILITY = ARMOR_DURABILITY; } catch(e) {}
try { if (typeof ARMOR_SLOT_TYPE !== "undefined") window.ARMOR_SLOT_TYPE = ARMOR_SLOT_TYPE; } catch(e) {}
try { if (typeof Animal !== "undefined") window.Animal = Animal; } catch(e) {}
try { if (typeof BACKGROUND_BUILDING_BLOCKS !== "undefined") window.BACKGROUND_BUILDING_BLOCKS = BACKGROUND_BUILDING_BLOCKS; } catch(e) {}
try { if (typeof Chicken !== "undefined") window.Chicken = Chicken; } catch(e) {}
try { if (typeof Cloud !== "undefined") window.Cloud = Cloud; } catch(e) {}
try { if (typeof Cow !== "undefined") window.Cow = Cow; } catch(e) {}
try { if (typeof Creeper !== "undefined") window.Creeper = Creeper; } catch(e) {}
try { if (typeof DAYLIGHT_BOTTOM !== "undefined") window.DAYLIGHT_BOTTOM = DAYLIGHT_BOTTOM; } catch(e) {}
try { if (typeof DAYLIGHT_TOP !== "undefined") window.DAYLIGHT_TOP = DAYLIGHT_TOP; } catch(e) {}
try { if (typeof DIFFICULTIES !== "undefined") window.DIFFICULTIES = DIFFICULTIES; } catch(e) {}
try { if (typeof FPS_CAP_OPTIONS !== "undefined") window.FPS_CAP_OPTIONS = FPS_CAP_OPTIONS; } catch(e) {}
try { if (typeof FallingBlock !== "undefined") window.FallingBlock = FallingBlock; } catch(e) {}
try { if (typeof FloatingText !== "undefined") window.FloatingText = FloatingText; } catch(e) {}
try { if (typeof HARDNESS !== "undefined") window.HARDNESS = HARDNESS; } catch(e) {}
try { if (typeof IDS !== "undefined") window.IDS = IDS; } catch(e) {}
try { if (typeof ID_NAMES !== "undefined") window.ID_NAMES = ID_NAMES; } catch(e) {}
try { if (typeof ItemDrop !== "undefined") window.ItemDrop = ItemDrop; } catch(e) {}
try { if (typeof LATEST_PATCH_NOTES !== "undefined") window.LATEST_PATCH_NOTES = LATEST_PATCH_NOTES; } catch(e) {}
try { if (typeof LEAF_COLORS !== "undefined") window.LEAF_COLORS = LEAF_COLORS; } catch(e) {}
try { if (typeof MAX_FABULOUS_PARTICLES !== "undefined") window.MAX_FABULOUS_PARTICLES = MAX_FABULOUS_PARTICLES; } catch(e) {}
try { if (typeof MAX_PARTICLES !== "undefined") window.MAX_PARTICLES = MAX_PARTICLES; } catch(e) {}
try { if (typeof MINIMAP_COLOR_32 !== "undefined") window.MINIMAP_COLOR_32 = MINIMAP_COLOR_32; } catch(e) {}
try { if (typeof MINING_TOOL_TIERS !== "undefined") window.MINING_TOOL_TIERS = MINING_TOOL_TIERS; } catch(e) {}
try { if (typeof NIGHT_BOTTOM !== "undefined") window.NIGHT_BOTTOM = NIGHT_BOTTOM; } catch(e) {}
try { if (typeof NIGHT_TOP !== "undefined") window.NIGHT_TOP = NIGHT_TOP; } catch(e) {}
try { if (typeof PHYSICS_TICK_MS !== "undefined") window.PHYSICS_TICK_MS = PHYSICS_TICK_MS; } catch(e) {}
try { if (typeof PHYSICS_TICK_RATE !== "undefined") window.PHYSICS_TICK_RATE = PHYSICS_TICK_RATE; } catch(e) {}
try { if (typeof Particle !== "undefined") window.Particle = Particle; } catch(e) {}
try { if (typeof PhysicsEntity !== "undefined") window.PhysicsEntity = PhysicsEntity; } catch(e) {}
try { if (typeof Pig !== "undefined") window.Pig = Pig; } catch(e) {}
try { if (typeof Pigeon !== "undefined") window.Pigeon = Pigeon; } catch(e) {}
try { if (typeof Player !== "undefined") window.Player = Player; } catch(e) {}
try { if (typeof SKIN_W !== "undefined") window.SKIN_W = SKIN_W; } catch(e) {}
try { if (typeof SKY_STARS !== "undefined") window.SKY_STARS = SKY_STARS; } catch(e) {}
try { if (typeof SKY_STARS_BUCKETS !== "undefined") window.SKY_STARS_BUCKETS = SKY_STARS_BUCKETS; } catch(e) {}
try { if (typeof SKY_STAR_BRIGHTNESSES !== "undefined") window.SKY_STAR_BRIGHTNESSES = SKY_STAR_BRIGHTNESSES; } catch(e) {}
try { if (typeof Scorpion !== "undefined") window.Scorpion = Scorpion; } catch(e) {}
try { if (typeof Sheep !== "undefined") window.Sheep = Sheep; } catch(e) {}
try { if (typeof SnowballProjectile !== "undefined") window.SnowballProjectile = SnowballProjectile; } catch(e) {}
try { if (typeof TOOL_DURABILITY !== "undefined") window.TOOL_DURABILITY = TOOL_DURABILITY; } catch(e) {}
try { if (typeof TWILIGHT_BOTTOM !== "undefined") window.TWILIGHT_BOTTOM = TWILIGHT_BOTTOM; } catch(e) {}
try { if (typeof TWILIGHT_TOP !== "undefined") window.TWILIGHT_TOP = TWILIGHT_TOP; } catch(e) {}
try { if (typeof UPDATE_HISTORY_LOGS !== "undefined") window.UPDATE_HISTORY_LOGS = UPDATE_HISTORY_LOGS; } catch(e) {}
try { if (typeof Zombie !== "undefined") window.Zombie = Zombie; } catch(e) {}
try { if (typeof activeProjectiles !== "undefined") window.activeProjectiles = activeProjectiles; } catch(e) {}
try { if (typeof activeSkinId !== "undefined") window.activeSkinId = activeSkinId; } catch(e) {}
try { if (typeof applyChestState !== "undefined") window.applyChestState = applyChestState; } catch(e) {}
try { if (typeof attackAnimationTimer !== "undefined") window.attackAnimationTimer = attackAnimationTimer; } catch(e) {}
try { if (typeof bgBuildDarknessAlpha !== "undefined") window.bgBuildDarknessAlpha = bgBuildDarknessAlpha; } catch(e) {}
try { if (typeof bgWorld !== "undefined") window.bgWorld = bgWorld; } catch(e) {}
try { if (typeof blendColor !== "undefined") window.blendColor = blendColor; } catch(e) {}
try { if (typeof buildFullOffscreenMap !== "undefined") window.buildFullOffscreenMap = buildFullOffscreenMap; } catch(e) {}
try { if (typeof cachedActiveBiome !== "undefined") window.cachedActiveBiome = cachedActiveBiome; } catch(e) {}
try { if (typeof cachedBiomeGridX !== "undefined") window.cachedBiomeGridX = cachedBiomeGridX; } catch(e) {}
try { if (typeof cachedIsSnowy !== "undefined") window.cachedIsSnowy = cachedIsSnowy; } catch(e) {}
try { if (typeof camera !== "undefined") window.camera = camera; } catch(e) {}
try { if (typeof canHarvestBlock !== "undefined") window.canHarvestBlock = canHarvestBlock; } catch(e) {}
try { if (typeof canSaplingGrowAt !== "undefined") window.canSaplingGrowAt = canSaplingGrowAt; } catch(e) {}
try { if (typeof caveSkyOpacity !== "undefined") window.caveSkyOpacity = caveSkyOpacity; } catch(e) {}
try { if (typeof checkCactusContact !== "undefined") window.checkCactusContact = checkCactusContact; } catch(e) {}
try { if (typeof checkSandFallAbove !== "undefined") window.checkSandFallAbove = checkSandFallAbove; } catch(e) {}
try { if (typeof chests !== "undefined") window.chests = chests; } catch(e) {}
try { if (typeof clouds !== "undefined") window.clouds = clouds; } catch(e) {}
try { if (typeof currentBiomeHue !== "undefined") window.currentBiomeHue = currentBiomeHue; } catch(e) {}
try { if (typeof currentFogDensity !== "undefined") window.currentFogDensity = currentFogDensity; } catch(e) {}
try { if (typeof currentFps !== "undefined") window.currentFps = currentFps; } catch(e) {}
try { if (typeof diffDescriptions !== "undefined") window.diffDescriptions = diffDescriptions; } catch(e) {}
try { if (typeof dirtToGrassQueue !== "undefined") window.dirtToGrassQueue = dirtToGrassQueue; } catch(e) {}
try { if (typeof drawBiomeGrading !== "undefined") window.drawBiomeGrading = drawBiomeGrading; } catch(e) {}
try { if (typeof drawCharacter !== "undefined") window.drawCharacter = drawCharacter; } catch(e) {}
try { if (typeof drawFrontCharacter !== "undefined") window.drawFrontCharacter = drawFrontCharacter; } catch(e) {}
try { if (typeof drawPlayerHead !== "undefined") window.drawPlayerHead = drawPlayerHead; } catch(e) {}
try { if (typeof drawCharacterArm !== "undefined") window.drawCharacterArm = drawCharacterArm; } catch(e) {}
try { if (typeof drawCharacterHead !== "undefined") window.drawCharacterHead = drawCharacterHead; } catch(e) {}
try { if (typeof drawCharacterLeg !== "undefined") window.drawCharacterLeg = drawCharacterLeg; } catch(e) {}
try { if (typeof drawCharacterTorso !== "undefined") window.drawCharacterTorso = drawCharacterTorso; } catch(e) {}
try { if (typeof drawDesertHeatShimmer !== "undefined") window.drawDesertHeatShimmer = drawDesertHeatShimmer; } catch(e) {}
try { if (typeof drawForestGodRays !== "undefined") window.drawForestGodRays = drawForestGodRays; } catch(e) {}
try { if (typeof drawPlainsWindBreeze !== "undefined") window.drawPlainsWindBreeze = drawPlainsWindBreeze; } catch(e) {}
try { if (typeof drawDynamicSky !== "undefined") window.drawDynamicSky = drawDynamicSky; } catch(e) {}
try { if (typeof drawMenuBackground !== "undefined") window.drawMenuBackground = drawMenuBackground; } catch(e) {}
try { if (typeof drawMinimap !== "undefined") window.drawMinimap = drawMinimap; } catch(e) {}
try { if (typeof drawMountains !== "undefined") window.drawMountains = drawMountains; } catch(e) {}
try { if (typeof drawPixelAurora !== "undefined") window.drawPixelAurora = drawPixelAurora; } catch(e) {}
try { if (typeof drawPlayerPreview !== "undefined") window.drawPlayerPreview = drawPlayerPreview; } catch(e) {}
try { if (typeof drawSnowFog !== "undefined") window.drawSnowFog = drawSnowFog; } catch(e) {}
try { if (typeof drawTimeClock !== "undefined") window.drawTimeClock = drawTimeClock; } catch(e) {}
try { if (typeof drawVignette !== "undefined") window.drawVignette = drawVignette; } catch(e) {}
try { if (typeof drawWorld !== "undefined") window.drawWorld = drawWorld; } catch(e) {}
try { if (typeof droppedItems !== "undefined") window.droppedItems = droppedItems; } catch(e) {}
try { if (typeof editingSkinId !== "undefined") window.editingSkinId = editingSkinId; } catch(e) {}
try { if (typeof ensureArmorDurability !== "undefined") window.ensureArmorDurability = ensureArmorDurability; } catch(e) {}
try { if (typeof ensureDesertScorpions !== "undefined") window.ensureDesertScorpions = ensureDesertScorpions; } catch(e) {}
try { if (typeof ensureTreeWoodNonCollidable !== "undefined") window.ensureTreeWoodNonCollidable = ensureTreeWoodNonCollidable; } catch(e) {}
try { if (typeof entities !== "undefined") window.entities = entities; } catch(e) {}
try { if (typeof equippedArmor !== "undefined") window.equippedArmor = equippedArmor; } catch(e) {}
try { if (typeof fabulousAmbientParticles !== "undefined") window.fabulousAmbientParticles = fabulousAmbientParticles; } catch(e) {}
try { if (typeof fallingBlocks !== "undefined") window.fallingBlocks = fallingBlocks; } catch(e) {}
try { if (typeof floatingTexts !== "undefined") window.floatingTexts = floatingTexts; } catch(e) {}
try { if (typeof fluidTick !== "undefined") window.fluidTick = fluidTick; } catch(e) {}
try { if (typeof fluidWakeQueue !== "undefined") window.fluidWakeQueue = fluidWakeQueue; } catch(e) {}
try { if (typeof fluids !== "undefined") window.fluids = fluids; } catch(e) {}
try { if (typeof fpsCap !== "undefined") window.fpsCap = fpsCap; } catch(e) {}
try { if (typeof frameDeltaMs !== "undefined") window.frameDeltaMs = frameDeltaMs; } catch(e) {}
try { if (typeof furnaces !== "undefined") window.furnaces = furnaces; } catch(e) {}
try { if (typeof generateMenuWorld !== "undefined") window.generateMenuWorld = generateMenuWorld; } catch(e) {}
try { if (typeof generateTexture !== "undefined") window.generateTexture = generateTexture; } catch(e) {}
try { if (typeof generateWorld !== "undefined") window.generateWorld = generateWorld; } catch(e) {}
try { if (typeof getActiveBiomeAt !== "undefined") window.getActiveBiomeAt = getActiveBiomeAt; } catch(e) {}
try { if (typeof getArmorDamageReductionRatio !== "undefined") window.getArmorDamageReductionRatio = getArmorDamageReductionRatio; } catch(e) {}
try { if (typeof getArmorPalette !== "undefined") window.getArmorPalette = getArmorPalette; } catch(e) {}
try { if (typeof getArmorSlotIndex !== "undefined") window.getArmorSlotIndex = getArmorSlotIndex; } catch(e) {}
try { if (typeof getBedLength !== "undefined") window.getBedLength = getBedLength; } catch(e) {}
try { if (typeof getBedPairStart !== "undefined") window.getBedPairStart = getBedPairStart; } catch(e) {}
try { if (typeof getBlockColor !== "undefined") window.getBlockColor = getBlockColor; } catch(e) {}
try { if (typeof getChestGroup !== "undefined") window.getChestGroup = getChestGroup; } catch(e) {}
try { if (typeof getChestKey !== "undefined") window.getChestKey = getChestKey; } catch(e) {}
try { if (typeof getDayDifficultyMultiplier !== "undefined") window.getDayDifficultyMultiplier = getDayDifficultyMultiplier; } catch(e) {}
try { if (typeof getDayHungerDrainMultiplier !== "undefined") window.getDayHungerDrainMultiplier = getDayHungerDrainMultiplier; } catch(e) {}
try { if (typeof getDoorBaseY !== "undefined") window.getDoorBaseY = getDoorBaseY; } catch(e) {}
try { if (typeof getFluid !== "undefined") window.getFluid = getFluid; } catch(e) {}
try { if (typeof getFluidKey !== "undefined") window.getFluidKey = getFluidKey; } catch(e) {}
try { if (typeof getFootstepMaterial !== "undefined") window.getFootstepMaterial = getFootstepMaterial; } catch(e) {}
try { if (typeof getFpsCapText !== "undefined") window.getFpsCapText = getFpsCapText; } catch(e) {}
try { if (typeof getInitialSpawnPoint !== "undefined") window.getInitialSpawnPoint = getInitialSpawnPoint; } catch(e) {}
try { if (typeof getMapBlockColor !== "undefined") window.getMapBlockColor = getMapBlockColor; } catch(e) {}
try { if (typeof getMobTarget !== "undefined") window.getMobTarget = getMobTarget; } catch(e) {}
try { if (typeof getPlayerCaveSkyOpacity !== "undefined") window.getPlayerCaveSkyOpacity = getPlayerCaveSkyOpacity; } catch(e) {}
try { if (typeof getRequiredMiningTier !== "undefined") window.getRequiredMiningTier = getRequiredMiningTier; } catch(e) {}
try { if (typeof getSaplingGrowthHeight !== "undefined") window.getSaplingGrowthHeight = getSaplingGrowthHeight; } catch(e) {}
try { if (typeof getSelectedMiningTier !== "undefined") window.getSelectedMiningTier = getSelectedMiningTier; } catch(e) {}
try { if (typeof getSkinSaveData !== "undefined") window.getSkinSaveData = getSkinSaveData; } catch(e) {}
try { if (typeof getSnowBiomeRatio !== "undefined") window.getSnowBiomeRatio = getSnowBiomeRatio; } catch(e) {}
try { if (typeof getTotalArmorDefense !== "undefined") window.getTotalArmorDefense = getTotalArmorDefense; } catch(e) {}
try { if (typeof getWorldSurfaceY !== "undefined") window.getWorldSurfaceY = getWorldSurfaceY; } catch(e) {}
try { if (typeof getZombieTarget !== "undefined") window.getZombieTarget = getZombieTarget; } catch(e) {}
try { if (typeof growSaplingAt !== "undefined") window.growSaplingAt = growSaplingAt; } catch(e) {}
try { if (typeof hasDirectSkyAccess !== "undefined") window.hasDirectSkyAccess = hasDirectSkyAccess; } catch(e) {}
try { if (typeof heldItemDraggedOutside !== "undefined") window.heldItemDraggedOutside = heldItemDraggedOutside; } catch(e) {}
try { if (typeof heldItemIndex !== "undefined") window.heldItemIndex = heldItemIndex; } catch(e) {}
try { if (typeof heldItemObj !== "undefined") window.heldItemObj = heldItemObj; } catch(e) {}
try { if (typeof hotbarPopupTimeout !== "undefined") window.hotbarPopupTimeout = hotbarPopupTimeout; } catch(e) {}
try { if (typeof hotbarWheelLockUntil !== "undefined") window.hotbarWheelLockUntil = hotbarWheelLockUntil; } catch(e) {}
try { if (typeof initFabulousParticles !== "undefined") window.initFabulousParticles = initFabulousParticles; } catch(e) {}
try { if (typeof isArmor !== "undefined") window.isArmor = isArmor; } catch(e) {}
try { if (typeof isBackgroundBuildMode !== "undefined") window.isBackgroundBuildMode = isBackgroundBuildMode; } catch(e) {}
try { if (typeof isBackgroundBuildingBlock !== "undefined") window.isBackgroundBuildingBlock = isBackgroundBuildingBlock; } catch(e) {}
try { if (typeof isBedRenderStart !== "undefined") window.isBedRenderStart = isBedRenderStart; } catch(e) {}
try { if (typeof isDoorBlock !== "undefined") window.isDoorBlock = isDoorBlock; } catch(e) {}
try { if (typeof isFoodItem !== "undefined") window.isFoodItem = isFoodItem; } catch(e) {}
try { if (typeof isInventoryOpen !== "undefined") window.isInventoryOpen = isInventoryOpen; } catch(e) {}
try { if (typeof isLava !== "undefined") window.isLava = isLava; } catch(e) {}
try { if (typeof isLeafConnectedToWood !== "undefined") window.isLeafConnectedToWood = isLeafConnectedToWood; } catch(e) {}
try { if (typeof isMapDragging !== "undefined") window.isMapDragging = isMapDragging; } catch(e) {}
try { if (typeof isNearTorch !== "undefined") window.isNearTorch = isNearTorch; } catch(e) {}
try { if (typeof isOffscreenMapDirty !== "undefined") window.isOffscreenMapDirty = isOffscreenMapDirty; } catch(e) {}
try { if (typeof isOpenDoorBlock !== "undefined") window.isOpenDoorBlock = isOpenDoorBlock; } catch(e) {}
try { if (typeof isPreviewWalking !== "undefined") window.isPreviewWalking = isPreviewWalking; } catch(e) {}
try { if (typeof isSolidWorldBlock !== "undefined") window.isSolidWorldBlock = isSolidWorldBlock; } catch(e) {}
try { if (typeof isWater !== "undefined") window.isWater = isWater; } catch(e) {}
try { if (typeof isWoodPartOfTree !== "undefined") window.isWoodPartOfTree = isWoodPartOfTree; } catch(e) {}
try { if (typeof isWorldMapOpen !== "undefined") window.isWorldMapOpen = isWorldMapOpen; } catch(e) {}
try { if (typeof jukeboxes !== "undefined") window.jukeboxes = jukeboxes; } catch(e) {}
try { if (typeof keepInventory !== "undefined") window.keepInventory = keepInventory; } catch(e) {}
try { if (typeof keys !== "undefined") window.keys = keys; } catch(e) {}
try { if (typeof largeChestCtx !== "undefined") window.largeChestCtx = largeChestCtx; } catch(e) {}
try { if (typeof largeChestImage !== "undefined") window.largeChestImage = largeChestImage; } catch(e) {}
try { if (typeof largeChestTexture !== "undefined") window.largeChestTexture = largeChestTexture; } catch(e) {}
try { if (typeof lastFrameTime !== "undefined") window.lastFrameTime = lastFrameTime; } catch(e) {}
try { if (typeof lastHotbarItemId !== "undefined") window.lastHotbarItemId = lastHotbarItemId; } catch(e) {}
try { if (typeof lastPlayerActivityAt !== "undefined") window.lastPlayerActivityAt = lastPlayerActivityAt; } catch(e) {}
try { if (typeof lastRenderTime !== "undefined") window.lastRenderTime = lastRenderTime; } catch(e) {}
try { if (typeof leafDecayQueue !== "undefined") window.leafDecayQueue = leafDecayQueue; } catch(e) {}
try { if (typeof treeDecayClusters !== "undefined") window.treeDecayClusters = treeDecayClusters; } catch(e) {}
try { if (typeof getKaelSkinCanvas !== "undefined") window.getKaelSkinCanvas = getKaelSkinCanvas; } catch(e) {}
try { if (typeof mapAnimFrameId !== "undefined") window.mapAnimFrameId = mapAnimFrameId; } catch(e) {}
try { if (typeof mapDragOriginPanX !== "undefined") window.mapDragOriginPanX = mapDragOriginPanX; } catch(e) {}
try { if (typeof mapDragOriginPanY !== "undefined") window.mapDragOriginPanY = mapDragOriginPanY; } catch(e) {}
try { if (typeof mapDragStartX !== "undefined") window.mapDragStartX = mapDragStartX; } catch(e) {}
try { if (typeof mapDragStartY !== "undefined") window.mapDragStartY = mapDragStartY; } catch(e) {}
try { if (typeof mapEventsInitialized !== "undefined") window.mapEventsInitialized = mapEventsInitialized; } catch(e) {}
try { if (typeof mapHoverTileX !== "undefined") window.mapHoverTileX = mapHoverTileX; } catch(e) {}
try { if (typeof mapHoverTileY !== "undefined") window.mapHoverTileY = mapHoverTileY; } catch(e) {}
try { if (typeof mapPanX !== "undefined") window.mapPanX = mapPanX; } catch(e) {}
try { if (typeof mapPanY !== "undefined") window.mapPanY = mapPanY; } catch(e) {}
try { if (typeof mapSeed !== "undefined") window.mapSeed = mapSeed; } catch(e) {}
try { if (typeof mapZoom !== "undefined") window.mapZoom = mapZoom; } catch(e) {}
try { if (typeof menuCamX !== "undefined") window.menuCamX = menuCamX; } catch(e) {}
try { if (typeof menuEntities !== "undefined") window.menuEntities = menuEntities; } catch(e) {}
try { if (typeof menuLastFrame !== "undefined") window.menuLastFrame = menuLastFrame; } catch(e) {}
try { if (typeof menuParallaxX !== "undefined") window.menuParallaxX = menuParallaxX; } catch(e) {}
try { if (typeof menuParallaxY !== "undefined") window.menuParallaxY = menuParallaxY; } catch(e) {}
try { if (typeof menuRandom !== "undefined") window.menuRandom = menuRandom; } catch(e) {}
try { if (typeof menuTime !== "undefined") window.menuTime = menuTime; } catch(e) {}
try { if (typeof menuWorld !== "undefined") window.menuWorld = menuWorld; } catch(e) {}
try { if (typeof menuWorldInitialized !== "undefined") window.menuWorldInitialized = menuWorldInitialized; } catch(e) {}
try { if (typeof menuWorldSeed !== "undefined") window.menuWorldSeed = menuWorldSeed; } catch(e) {}
try { if (typeof minimapBuf32 !== "undefined") window.minimapBuf32 = minimapBuf32; } catch(e) {}
try { if (typeof minimapImageData !== "undefined") window.minimapImageData = minimapImageData; } catch(e) {}
try { if (typeof minimapOffscreenCanvas !== "undefined") window.minimapOffscreenCanvas = minimapOffscreenCanvas; } catch(e) {}
try { if (typeof minimapOffscreenCtx !== "undefined") window.minimapOffscreenCtx = minimapOffscreenCtx; } catch(e) {}
try { if (typeof miningTarget !== "undefined") window.miningTarget = miningTarget; } catch(e) {}
try { if (typeof BLOCK_CRACK_STAGES !== "undefined") window.BLOCK_CRACK_STAGES = BLOCK_CRACK_STAGES; } catch(e) {}
try { if (typeof BLOCK_CRACK_SEGMENTS !== "undefined") window.BLOCK_CRACK_SEGMENTS = BLOCK_CRACK_SEGMENTS; } catch(e) {}
try { if (typeof mouse !== "undefined") window.mouse = mouse; } catch(e) {}
try { if (typeof nonCollidableTreeWood !== "undefined") window.nonCollidableTreeWood = nonCollidableTreeWood; } catch(e) {}
try { if (typeof notifyBlockedSaplings !== "undefined") window.notifyBlockedSaplings = notifyBlockedSaplings; } catch(e) {}
try { if (typeof offscreenMapCanvas !== "undefined") window.offscreenMapCanvas = offscreenMapCanvas; } catch(e) {}
try { if (typeof offscreenMapCtx !== "undefined") window.offscreenMapCtx = offscreenMapCtx; } catch(e) {}
try { if (typeof openedChest !== "undefined") window.openedChest = openedChest; } catch(e) {}
try { if (typeof openedFurnace !== "undefined") window.openedFurnace = openedFurnace; } catch(e) {}
try { if (typeof particles !== "undefined") window.particles = particles; } catch(e) {}
try { if (typeof noteParticles !== "undefined") window.noteParticles = noteParticles; } catch(e) {}
try { if (typeof spawnNoteParticle !== "undefined") window.spawnNoteParticle = spawnNoteParticle; } catch(e) {}
try { if (typeof NoteParticle !== "undefined") window.NoteParticle = NoteParticle; } catch(e) {}
try { if (typeof physicsAccumulator !== "undefined") window.physicsAccumulator = physicsAccumulator; } catch(e) {}
try { if (typeof player !== "undefined") window.player = player; } catch(e) {}
try { if (typeof playerSkinData !== "undefined") window.playerSkinData = playerSkinData; } catch(e) {}
try { if (typeof previewWalkAnimId !== "undefined") window.previewWalkAnimId = previewWalkAnimId; } catch(e) {}
try { if (typeof previewWalkAnimation !== "undefined") window.previewWalkAnimation = previewWalkAnimation; } catch(e) {}
try { if (typeof previewWalkUntil !== "undefined") window.previewWalkUntil = previewWalkUntil; } catch(e) {}
try { if (typeof processDroppedItems !== "undefined") window.processDroppedItems = processDroppedItems; } catch(e) {}
try { if (typeof removeFluid !== "undefined") window.removeFluid = removeFluid; } catch(e) {}
try { if (typeof renderStaticPlayerPreview !== "undefined") window.renderStaticPlayerPreview = renderStaticPlayerPreview; } catch(e) {}
try { if (typeof renderWorldMapFrame !== "undefined") window.renderWorldMapFrame = renderWorldMapFrame; } catch(e) {}
try { if (typeof renderWorldMapLoop !== "undefined") window.renderWorldMapLoop = renderWorldMapLoop; } catch(e) {}
try { if (typeof saplingBlockedWarnings !== "undefined") window.saplingBlockedWarnings = saplingBlockedWarnings; } catch(e) {}
try { if (typeof saplingGrowthQueue !== "undefined") window.saplingGrowthQueue = saplingGrowthQueue; } catch(e) {}
try { if (typeof scheduleDirtToGrass !== "undefined") window.scheduleDirtToGrass = scheduleDirtToGrass; } catch(e) {}
try { if (typeof scheduleSnowRegrowth !== "undefined") window.scheduleSnowRegrowth = scheduleSnowRegrowth; } catch(e) {}
try { if (typeof scheduleTreeLeafDecay !== "undefined") window.scheduleTreeLeafDecay = scheduleTreeLeafDecay; } catch(e) {}
try { if (typeof seededRandom !== "undefined") window.seededRandom = seededRandom; } catch(e) {}
try { if (typeof setFluid !== "undefined") window.setFluid = setFluid; } catch(e) {}
try { if (typeof setEngineAccentColor !== "undefined") window.setEngineAccentColor = setEngineAccentColor; } catch(e) {}
try { if (typeof skinCanvasObj !== "undefined") window.skinCanvasObj = skinCanvasObj; } catch(e) {}
try { if (typeof setStaticPreviewDrawn !== "undefined") window.setStaticPreviewDrawn = setStaticPreviewDrawn; } catch(e) {}
try { if (typeof skyBottomColor !== "undefined") window.skyBottomColor = skyBottomColor; } catch(e) {}
try { if (typeof skyTopColor !== "undefined") window.skyTopColor = skyTopColor; } catch(e) {}
try { if (typeof sleepStartTime !== "undefined") window.sleepStartTime = sleepStartTime; } catch(e) {}
try { if (typeof sleepTransitionMs !== "undefined") window.sleepTransitionMs = sleepTransitionMs; } catch(e) {}
try { if (typeof smoothStep !== "undefined") window.smoothStep = smoothStep; } catch(e) {}
try { if (typeof snowRegrowthQueue !== "undefined") window.snowRegrowthQueue = snowRegrowthQueue; } catch(e) {}
try { if (typeof spawnAnimals !== "undefined") window.spawnAnimals = spawnAnimals; } catch(e) {}
try { if (typeof spawnMobs !== "undefined") window.spawnMobs = spawnMobs; } catch(e) {}
try { if (typeof spawnParticle !== "undefined") window.spawnParticle = spawnParticle; } catch(e) {}
try { if (typeof startPlayerPreviewWalk !== "undefined") window.startPlayerPreviewWalk = startPlayerPreviewWalk; } catch(e) {}
try { if (typeof staticPreviewDrawn !== "undefined") window.staticPreviewDrawn = staticPreviewDrawn; } catch(e) {}
try { if (typeof surfaceHeights !== "undefined") window.surfaceHeights = surfaceHeights; } catch(e) {}
try { if (typeof syncChest !== "undefined") window.syncChest = syncChest; } catch(e) {}
try { if (typeof textures !== "undefined") window.textures = textures; } catch(e) {}
try { if (typeof tooltipEl !== "undefined") window.tooltipEl = tooltipEl; } catch(e) {}
try { if (typeof triggerSandFall !== "undefined") window.triggerSandFall = triggerSandFall; } catch(e) {}
try { if (typeof triggerSteamEffect !== "undefined") window.triggerSteamEffect = triggerSteamEffect; } catch(e) {}
try { if (typeof updateAndDrawFabulousParticles !== "undefined") window.updateAndDrawFabulousParticles = updateAndDrawFabulousParticles; } catch(e) {}
try { if (typeof updateBiomeAtmosphere !== "undefined") window.updateBiomeAtmosphere = updateBiomeAtmosphere; } catch(e) {}
try { if (typeof updateCamera !== "undefined") window.updateCamera = updateCamera; } catch(e) {}
try { if (typeof updateFluids !== "undefined") window.updateFluids = updateFluids; } catch(e) {}
try { if (typeof updateNaturalRegrowth !== "undefined") window.updateNaturalRegrowth = updateNaturalRegrowth; } catch(e) {}
try { if (typeof updateSaplingGrowth !== "undefined") window.updateSaplingGrowth = updateSaplingGrowth; } catch(e) {}
try { if (typeof updateTimeUI !== "undefined") window.updateTimeUI = updateTimeUI; } catch(e) {}
try { if (typeof updateTreeLeafDecay !== "undefined") window.updateTreeLeafDecay = updateTreeLeafDecay; } catch(e) {}
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
    export function setEngineDayCount(newDay) { dayCount = newDay; if (typeof window !== 'undefined') window.dayCount = newDay; }
    export function setEngineFrameCount(newFrames) { frameCount = newFrames; if (typeof window !== 'undefined') window.frameCount = newFrames; }
    export function setEngineCurrentWorldId(newId) { currentWorldId = newId; if (typeof window !== 'undefined') window.currentWorldId = newId; }
    export function setEngineCurrentDifficulty(newDiff) { currentDifficulty = newDiff; if (typeof window !== 'undefined') window.currentDifficulty = newDiff; }
    export function setEngineIsMultiplayer(newMp) { isMultiplayer = newMp; if (typeof window !== 'undefined') window.isMultiplayer = newMp; }
    export function setEngineCurrentMpRoom(newRoom) { currentMpRoom = newRoom; if (typeof window !== 'undefined') window.currentMpRoom = newRoom; }
    export function setEngineCurrentMpWorldName(newName) { currentMpWorldName = newName; if (typeof window !== 'undefined') window.currentMpWorldName = newName; }
    export function setEngineRemotePlayers(newPlayers) { remotePlayers = newPlayers; if (typeof window !== 'undefined') window.remotePlayers = newPlayers; }
    export function setEngineIsSleeping(newSleeping) { isSleeping = newSleeping; if (typeof window !== 'undefined') window.isSleeping = newSleeping; }
    export function setEngineIsBackgroundBuildMode(newMode) { isBackgroundBuildMode = newMode; if (typeof window !== 'undefined') window.isBackgroundBuildMode = newMode; }
    export function setEngineIsInventoryOpen(newOpen) { isInventoryOpen = newOpen; if (typeof window !== 'undefined') window.isInventoryOpen = newOpen; }
    export function setEngineCropGrowthQueue(newQueue) { cropGrowthQueue = newQueue; if (typeof window !== 'undefined') window.cropGrowthQueue = newQueue; }
    export function setEngineSaplingGrowthQueue(newQueue) { saplingGrowthQueue = newQueue; if (typeof window !== 'undefined') window.saplingGrowthQueue = newQueue; }
    export function setEngineDirtToGrassQueue(newQueue) { dirtToGrassQueue = newQueue; if (typeof window !== 'undefined') window.dirtToGrassQueue = newQueue; }
    export function setEngineSnowRegrowthQueue(newQueue) { snowRegrowthQueue = newQueue; if (typeof window !== 'undefined') window.snowRegrowthQueue = newQueue; }
    export function setSelectedHotbarIndex(idx) { selectedHotbarIndex = idx; if (typeof window !== 'undefined') window.selectedHotbarIndex = idx; }
    export function setAttackAnimationTimer(t) { attackAnimationTimer = t; if (typeof window !== 'undefined') window.attackAnimationTimer = t; }

try { if (typeof setEngineCropGrowthQueue !== "undefined") window.setEngineCropGrowthQueue = setEngineCropGrowthQueue; } catch(e) {}
try { if (typeof setEngineSaplingGrowthQueue !== "undefined") window.setEngineSaplingGrowthQueue = setEngineSaplingGrowthQueue; } catch(e) {}
try { if (typeof setEngineDirtToGrassQueue !== "undefined") window.setEngineDirtToGrassQueue = setEngineDirtToGrassQueue; } catch(e) {}
try { if (typeof setEngineSnowRegrowthQueue !== "undefined") window.setEngineSnowRegrowthQueue = setEngineSnowRegrowthQueue; } catch(e) {}
try { if (typeof spawnDroppedItem !== "undefined") window.spawnDroppedItem = spawnDroppedItem; } catch(e) {}
try { if (typeof setEngineWorld !== "undefined") window.setEngineWorld = setEngineWorld; } catch(e) {}
try { if (typeof setEngineBgWorld !== "undefined") window.setEngineBgWorld = setEngineBgWorld; } catch(e) {}
try { if (typeof setEnginePlayer !== "undefined") window.setEnginePlayer = setEnginePlayer; } catch(e) {}
try { if (typeof setEngineSurfaceHeights !== "undefined") window.setEngineSurfaceHeights = setEngineSurfaceHeights; } catch(e) {}
try { if (typeof setEngineInventory !== "undefined") window.setEngineInventory = setEngineInventory; } catch(e) {}
try { if (typeof setEngineEquippedArmor !== "undefined") window.setEngineEquippedArmor = setEngineEquippedArmor; } catch(e) {}
try { if (typeof setEngineEntities !== "undefined") window.setEngineEntities = setEngineEntities; } catch(e) {}
try { if (typeof setEngineFluids !== "undefined") window.setEngineFluids = setEngineFluids; } catch(e) {}
try { if (typeof setEngineFurnaces !== "undefined") window.setEngineFurnaces = setEngineFurnaces; } catch(e) {}
try { if (typeof setEngineJukeboxes !== "undefined") window.setEngineJukeboxes = setEngineJukeboxes; } catch(e) {}
try { if (typeof setEngineChests !== "undefined") window.setEngineChests = setEngineChests; } catch(e) {}
try { if (typeof setEngineDroppedItems !== "undefined") window.setEngineDroppedItems = setEngineDroppedItems; } catch(e) {}
try { if (typeof setEngineState !== "undefined") window.setEngineState = setEngineState; } catch(e) {}
try { if (typeof setGameState !== "undefined") window.setGameState = setGameState; } catch(e) {}
try { if (typeof setEngineTimeOfDay !== "undefined") window.setEngineTimeOfDay = setEngineTimeOfDay; } catch(e) {}
try { if (typeof setEngineDayCount !== "undefined") window.setEngineDayCount = setEngineDayCount; } catch(e) {}
try { if (typeof setEngineFrameCount !== "undefined") window.setEngineFrameCount = setEngineFrameCount; } catch(e) {}
try { if (typeof setEngineCurrentWorldId !== "undefined") window.setEngineCurrentWorldId = setEngineCurrentWorldId; } catch(e) {}
try { if (typeof setEngineCurrentDifficulty !== "undefined") window.setEngineCurrentDifficulty = setEngineCurrentDifficulty; } catch(e) {}
try { if (typeof setEngineIsMultiplayer !== "undefined") window.setEngineIsMultiplayer = setEngineIsMultiplayer; } catch(e) {}
try { if (typeof setEngineCurrentMpRoom !== "undefined") window.setEngineCurrentMpRoom = setEngineCurrentMpRoom; } catch(e) {}
try { if (typeof setEngineCurrentMpWorldName !== "undefined") window.setEngineCurrentMpWorldName = setEngineCurrentMpWorldName; } catch(e) {}
try { if (typeof setEngineRemotePlayers !== "undefined") window.setEngineRemotePlayers = setEngineRemotePlayers; } catch(e) {}
try { if (typeof setEngineIsSleeping !== "undefined") window.setEngineIsSleeping = setEngineIsSleeping; } catch(e) {}
try { if (typeof setEngineIsBackgroundBuildMode !== "undefined") window.setEngineIsBackgroundBuildMode = setEngineIsBackgroundBuildMode; } catch(e) {}
try { if (typeof setEngineIsInventoryOpen !== "undefined") window.setEngineIsInventoryOpen = setEngineIsInventoryOpen; } catch(e) {}
try { if (typeof initCanvases !== "undefined") window.initCanvases = initCanvases; } catch(e) {}
try { if (typeof resizeCanvases !== "undefined") window.resizeCanvases = resizeCanvases; } catch(e) {}
try { if (typeof canvas !== "undefined") window.canvas = canvas; } catch(e) {}
try { if (typeof ctx !== "undefined") window.ctx = ctx; } catch(e) {}
try { if (typeof menuBgCanvas !== "undefined") window.menuBgCanvas = menuBgCanvas; } catch(e) {}
try { if (typeof menuCtx !== "undefined") window.menuCtx = menuCtx; } catch(e) {}
try { if (typeof lightCanvas !== "undefined") window.lightCanvas = lightCanvas; } catch(e) {}
try { if (typeof lightCtx !== "undefined") window.lightCtx = lightCtx; } catch(e) {}
try { if (typeof LIGHT_SCALE !== "undefined") window.LIGHT_SCALE = LIGHT_SCALE; } catch(e) {}
try { if (typeof updateCachedVignette !== "undefined") window.updateCachedVignette = updateCachedVignette; } catch(e) {}
try { if (typeof cachedLightVignette !== "undefined") window.cachedLightVignette = cachedLightVignette; } catch(e) {}
try { if (typeof cachedTorchLightCanvas !== "undefined") window.cachedTorchLightCanvas = cachedTorchLightCanvas; } catch(e) {}
try { if (typeof cachedTorchGlowCanvas !== "undefined") window.cachedTorchGlowCanvas = cachedTorchGlowCanvas; } catch(e) {}
try { if (typeof cachedFabulousVignetteCanvas !== "undefined") window.cachedFabulousVignetteCanvas = cachedFabulousVignetteCanvas; } catch(e) {}
try { if (typeof cachedSnowFogCanvas !== "undefined") window.cachedSnowFogCanvas = cachedSnowFogCanvas; } catch(e) {}
try { if (typeof cachedSunGlowDayCanvas !== "undefined") window.cachedSunGlowDayCanvas = cachedSunGlowDayCanvas; } catch(e) {}
try { if (typeof cachedSunGlowSunsetCanvas !== "undefined") window.cachedSunGlowSunsetCanvas = cachedSunGlowSunsetCanvas; } catch(e) {}
try { if (typeof cachedMoonGlowCanvas !== "undefined") window.cachedMoonGlowCanvas = cachedMoonGlowCanvas; } catch(e) {}
try { if (typeof cachedShadowCanvas !== "undefined") window.cachedShadowCanvas = cachedShadowCanvas; } catch(e) {}
try { if (typeof auroraCanvas !== "undefined") window.auroraCanvas = auroraCanvas; } catch(e) {}
try { if (typeof setWorldDimensions !== "undefined") window.setWorldDimensions = setWorldDimensions; } catch(e) {}
try { if (typeof world !== "undefined") window.world = world; } catch(e) {}
try { if (typeof cropGrowthQueue !== "undefined") window.cropGrowthQueue = cropGrowthQueue; } catch(e) {}
try { if (typeof checkWaterNearCrop !== "undefined") window.checkWaterNearCrop = checkWaterNearCrop; } catch(e) {}
try { if (typeof registerPlantedCrop !== "undefined") window.registerPlantedCrop = registerPlantedCrop; } catch(e) {}
try { if (typeof updateCropGrowth !== "undefined") window.updateCropGrowth = updateCropGrowth; } catch(e) {}
try { if (typeof isClimbableBlock !== "undefined") window.isClimbableBlock = isClimbableBlock; } catch(e) {}
try { if (typeof isJungleDoorBlock !== "undefined") window.isJungleDoorBlock = isJungleDoorBlock; } catch(e) {}
try { if (typeof Parrot !== "undefined") window.Parrot = Parrot; } catch(e) {}
try { if (typeof drawShoulderParrot !== "undefined") window.drawShoulderParrot = drawShoulderParrot; } catch(e) {}
try { if (typeof dismountParrot !== "undefined") window.dismountParrot = dismountParrot; } catch(e) {}
try { if (typeof dismountAllShoulderParrots !== "undefined") window.dismountAllShoulderParrots = dismountAllShoulderParrots; } catch(e) {}
try { if (typeof AtlasExplorer !== "undefined") window.AtlasExplorer = AtlasExplorer; } catch(e) {}
try { if (typeof worldBiomes !== "undefined") window.worldBiomes = worldBiomes; } catch(e) {}
try { if (typeof signs !== "undefined") window.signs = signs; } catch(e) {}
try { if (typeof setEngineSigns !== "undefined") window.setEngineSigns = setEngineSigns; } catch(e) {}
try { if (typeof deliverLeafDecayItem !== "undefined") window.deliverLeafDecayItem = deliverLeafDecayItem; } catch(e) {}