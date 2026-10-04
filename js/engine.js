// ===========                                                                ==================================================================
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
export let gloomDreadTimer = 0;
export function setEngineGloomDreadTimer(val) { gloomDreadTimer = val; if (typeof window !== 'undefined') window.gloomDreadTimer = val; }

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

// Granular Fabulous Graphics Configuration Schema & Presets
export const DEFAULT_FABULOUS_CONFIG = {
    colorGrading: true,        // Biome ambient color grading
    volumetricFog: true,       // Multi-layer snow & rainforest fog
    godRays: true,             // Crepuscular sunbeams through foliage
    vignette: true,            // Cinematic corner vignette
    heatShimmer: true,         // Desert atmospheric heat waves
    foliageSway: true,         // Wind sway on grass, crops, saplings, flowers
    windBreeze: true,          // Animated wind breeze gusts
    waterEffects: true,        // Fluid surface ripples & specular glints
    ambientParticles: true,    // Fireflies, leaves, snow, dust, spores
    lavaGlow: true,            // Dynamic lava illumination & rising embers
    bloomAura: true,           // Radiant celestial and torch bloom
    preset: 'high'             // 'low' | 'medium' | 'high' | 'custom'
};

export const FABULOUS_PRESETS = {
    low: {
        colorGrading: true,
        volumetricFog: false,
        godRays: false,
        vignette: true,
        heatShimmer: false,
        foliageSway: false,
        windBreeze: false,
        waterEffects: false,
        ambientParticles: false,
        lavaGlow: true,
        bloomAura: false,
        preset: 'low'
    },
    medium: {
        colorGrading: true,
        volumetricFog: true,
        godRays: true,
        vignette: true,
        heatShimmer: false,
        foliageSway: true,
        windBreeze: false,
        waterEffects: true,
        ambientParticles: true,
        lavaGlow: true,
        bloomAura: true,
        preset: 'medium'
    },
    high: {
        colorGrading: true,
        volumetricFog: true,
        godRays: true,
        vignette: true,
        heatShimmer: true,
        foliageSway: true,
        windBreeze: true,
        waterEffects: true,
        ambientParticles: true,
        lavaGlow: true,
        bloomAura: true,
        preset: 'high'
    }
};

export function loadFabulousConfig() {
    let cfg = { ...DEFAULT_FABULOUS_CONFIG };
    if (typeof localStorage !== 'undefined') {
        try {
            const raw = localStorage.getItem('swc_fabulous_config');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (typeof parsed === 'object' && parsed !== null) {
                    cfg = { ...cfg, ...parsed };
                }
            }
        } catch (e) {}
    }
    return cfg;
}

export let fabulousConfig = loadFabulousConfig();

export function setFabulousConfig(newConfig) {
    fabulousConfig = { ...fabulousConfig, ...newConfig };
    if (typeof localStorage !== 'undefined') {
        try {
            localStorage.setItem('swc_fabulous_config', JSON.stringify(fabulousConfig));
        } catch (e) {}
    }
    if (typeof window !== 'undefined') {
        window.fabulousConfig = fabulousConfig;
    }
    return fabulousConfig;
}

export function applyFabulousPreset(presetName) {
    if (FABULOUS_PRESETS[presetName]) {
        return setFabulousConfig(FABULOUS_PRESETS[presetName]);
    }
    return fabulousConfig;
}

export function getFabulousParticleBudget() {
    if (!fabulousGraphics || !fabulousConfig.ambientParticles) return 0;
    if (fabulousConfig.preset === 'low') return 0;
    if (fabulousConfig.preset === 'medium') return 25;
    return 55;
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
    return isPickaxe(id) || isAxe(id) || isShovel(id) || isSword(id) || isHoe(id) || isShears(id);
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
export function setupDeathScreen() { if (typeof window !== 'undefined' && typeof window.setupDeathScreen === 'function') return window.setupDeathScreen(); }
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
export const WATER_FLOW_MAX = 7;
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

    export const FPS_CAP_OPTIONS = [60, 90, 120, 144, 240, 0, 30];
    export let fpsCap = typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('swc_fps_cap') || '60', 10) : 60;
    if (!FPS_CAP_OPTIONS.includes(fpsCap)) fpsCap = 60;

    export function setEngineFpsCap(newCap) {
        if (FPS_CAP_OPTIONS.includes(newCap)) {
            fpsCap = newCap;
        } else {
            fpsCap = 60;
        }
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem('swc_fps_cap', String(fpsCap));
            } catch (e) {}
        }
        if (typeof window !== 'undefined') {
            window.fpsCap = fpsCap;
        }
        return fpsCap;
    }

    export function getFpsCapText(cap = fpsCap) {
        return cap === 0 ? "Unlimited" : `${cap} FPS`;
    }

    export const LIGHT_SCALE = 1.0;
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

    // 4x4 Bayer Dither Matrix for retro stepped pixel-art gradient transitions
    const BAYER_4X4 = [
        [  0/16,  8/16,  2/16, 10/16 ],
        [ 12/16,  4/16, 14/16,  6/16 ],
        [  3/16, 11/16,  1/16,  9/16 ],
        [ 15/16,  7/16, 13/16,  5/16 ]
    ];

    // Pre-rendered Light Stamp: normal bright smooth circle with subtle pixel-art edge
    export function generatePixelArtLightStamp(size = 256) {
        if (typeof document === 'undefined') return null;
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const ctx = c.getContext('2d');
        if (!ctx) return c;

        const imgData = ctx.createImageData(size, size);
        const data = imgData.data;
        const center = (size - 1) / 2;
        const maxRadius = (size / 2) - 1;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - center;
                const dy = y - center;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const u = dist / maxRadius;

                if (u <= 1.0) {
                    let alpha;
                    if (u <= 0.80) {
                        // Normal, smooth continuous gradient in the interior for maximum visibility like before
                        alpha = Math.max(0, 1.0 - u);
                    } else {
                        // Subtle pixel-art stepped edge at the outer perimeter
                        const t = (1.0 - u) / 0.20;
                        const steps = 4;
                        const scaled = t * steps;
                        const band = Math.floor(scaled);
                        const frac = scaled - band;
                        const threshold = BAYER_4X4[y % 4][x % 4];
                        const dithered = (frac > threshold) ? Math.min(steps, band + 1) : band;
                        alpha = 0.20 * (dithered / steps);
                    }

                    if (alpha > 0.005) {
                        const idx = (y * size + x) * 4;
                        data[idx] = 255;
                        data[idx + 1] = 255;
                        data[idx + 2] = 255;
                        data[idx + 3] = Math.round(alpha * 255);
                    }
                }
            }
        }
        ctx.putImageData(imgData, 0, 0);
        return c;
    }

    // Pre-rendered reusable light falloff stamp (256x256 high-resolution with smooth interior and pixel-art edge)
    export const cachedTorchLightCanvas = typeof document !== 'undefined' ? generatePixelArtLightStamp(256) : null;

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

    // Pre-rendered reusable radiant lava aura glow stamp
    export const cachedLavaGlowCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (cachedLavaGlowCanvas) {
        cachedLavaGlowCanvas.width = 128;
        cachedLavaGlowCanvas.height = 128;
        const lavaGlowCtx = cachedLavaGlowCanvas.getContext('2d');
        const lGrad = lavaGlowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
        lGrad.addColorStop(0, 'rgba(255, 110, 20, 0.36)');
        lGrad.addColorStop(1, 'rgba(255, 60, 0, 0)');
        lavaGlowCtx.fillStyle = lGrad;
        lavaGlowCtx.fillRect(0, 0, 128, 128);
    }

    // Pre-rendered reusable bloom aura stamp
    export const cachedBloomAuraCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (cachedBloomAuraCanvas) {
        cachedBloomAuraCanvas.width = 128;
        cachedBloomAuraCanvas.height = 128;
        const bloomCtx = cachedBloomAuraCanvas.getContext('2d');
        const bGrad = bloomCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
        bGrad.addColorStop(0, 'rgba(255, 230, 150, 0.22)');
        bGrad.addColorStop(1, 'rgba(255, 160, 50, 0)');
        bloomCtx.fillStyle = bGrad;
        bloomCtx.fillRect(0, 0, 128, 128);
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

    // Pre-rendered Pixel-Art Entity Drop Shadow Sprite (Retro Minecraft pixelated disc)
    export const cachedShadowCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (cachedShadowCanvas) {
        cachedShadowCanvas.width = 24;
        cachedShadowCanvas.height = 8;
        const shadowCtx = cachedShadowCanvas.getContext('2d');
        if (shadowCtx) {
            shadowCtx.imageSmoothingEnabled = false;
            // Rasterize crisp stepped pixel-art ellipse with dark core and translucent outer rim
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 24; x++) {
                    const dx = (x - 11.5) / 11;
                    const dy = (y - 3.5) / 3.5;
                    const distSq = dx * dx + dy * dy;
                    if (distSq <= 0.55) {
                        shadowCtx.fillStyle = 'rgba(0, 0, 0, 0.45)'; // Dark core
                        shadowCtx.fillRect(x, y, 1, 1);
                    } else if (distSq <= 1.0) {
                        shadowCtx.fillStyle = 'rgba(0, 0, 0, 0.22)'; // Stepped pixel rim
                        shadowCtx.fillRect(x, y, 1, 1);
                    }
                }
            }
        }
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
    export let minimapShape = 'circle';
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
    export const PATCH_NOTES_0_1_6 = {
        title: 'Beta 0.1.6 (Smarter Hostile Mobs, Door Breaches & Combat Overhaul)',
        items: [
            'Smarter Zombie AI & Bloodlust Frenzy: Undead mobs sprint aggressively when pursuing players or when below 50% health, detect and leap 2-block walls, and unleash airborne leap attacks.',
            'Undead Alert Pulse (Call of the Undead): Striking a zombie alerts all nearby zombies within 16-24 blocks, sending them into an aggressive frenzy.',
            'Shelter Defense & Door Breaching: Zombies and hostile mobs attack wooden doors when blocked. On Normal and Hard difficulty, sustained strikes will splinter and breach doors.',
            'Weapon-Tiered Knockback System: Bare hands and building blocks no longer stunlock mobs. Swords and axes deliver authentic tiered knockback from Wood through Diamond and Astral tiers.',
            'Mob Poise & Knockback Resistance: Hostile mobs gain poise and knockback resistance on Normal (20%) and Hard (45%), preventing them from being endlessly juggled by low-tier strikes.',
            'Tactical Creeper Stalking & Ambush: Creepers approach slowly while you watch, but sprint silently when your back is turned. Creepers dropping from ledges prime their explosion fuse mid-air.',
            'Desert Scorpion Camouflage & Evasion: Scorpions bury beneath desert sand when idle, bursting out to ambush approaching players, and performing tactical backward evasive hops after striking.',
            'Procedural Web Audio & Bioluminescence: Added procedural audio for zombie roars, snarling jaws, door bashing, door splintering, and creeper hisses. Hostile mobs feature glowing bioluminescent eyes in subterranean caves and night shadows.',
            'Beta 0.1.5 World Forward-Compatibility: Seamless one-click conversion for worlds created in Beta 0.1.5, safely preserving 100% of terrain, blocks, chests, items, player inventories, and coordinates while unlocking 0.1.6 mechanics.',
            'One-Click World Backup: Integrated instant local JSON backup export directly within the world conversion screen prior to upgrading.',
            'Corner Control Hints & Tutorial: Added interactive bottom-left HUD hotkey hints ([C] Emerald Vault, [L] Achievements, [M] World Map, [B] Background Build) with authentic pixel-art keycaps, plus a toggle in Settings to customize visibility.',
            'Unboxed Retro Cassette Autosave: Overhauled autosave notifications into an unboxed, large retro pixel-art cassette tape with animated spinning reels and crisp text.',
            'Circular Radar Minimap Default: The minimap now defaults to the circular radar shape for a modern, sleek HUD view.',
            'Offhand Quick-Swap & Full Stack Drop: Instantly swap held items into the offhand slot using the customizable [F] key or by clicking the HUD offhand slot, and drop entire item stacks at once with [Ctrl + Q].'
        ]
    };

    export const PATCH_NOTES_0_1_5 = {
        title: 'Beta 0.1.5 (Jungle Biome, Avian Wildlife, Atlas Explorer, Terraria Caverns & Cosmetics Overhaul)',
        items: [
            'Jungle Biome & Canopy Ecosystem: Dynamic procedural generation of vibrant tropical Jungle biomes featuring towering Jungle Trees with winding climbable vines, lush canopy umbrellas, hanging understory vegetation, and dense shrubbery.',
            'Jungle Wood & Timber Progression: Harvest Jungle Logs to craft rich auburn Jungle Wood Planks, sticks, and cultivate saplings to grow towering rainforest canopies anywhere.',
            'Authentic Jungle Doors: Craftable Jungle Doors featuring authentic dual-state pixel textures—an open front-facing porthole window with polished wood trim and a thin closed side profile slit—paired with custom wooden door sound effects and precise collision bounds.',
            'Wild Melons & Tropical Agriculture: Discover wild melon blocks scattered across jungle clearings. Break them to collect fresh Melon Slices for instant hunger restoration, or combine with gold nuggets to craft Glistering Melons.',
            'Exotic Avian Wildlife (Parrots): Lush jungles are now alive with wild Parrots inhabiting treetops in 5 authentic, vibrant color morphs (Red Scarlet Macaw, Blue Macaw, Vibrant Green, Cyan, and Gray).',
            'Parrot Taming & Shoulder Companions: Feed wild parrots seeds to tame them, celebrated with charming floating heart particles. Tamed parrots follow you across biomes, perch comfortably on your shoulder, and whistle tropical melodies.',
            'Sweet Avian Wildlife (Pigeons): Populated plains and forest biomes with sweet, innocent Pigeons featuring charming pixel art, shimmering emerald-violet neck plumage, and rhythmic head bobs.',
            'Aerodynamic Flight Physics & Leaf Perching: Both Pigeons and Parrots possess genuine flight dynamics, flapping wings to soar effortlessly above tree canopies, smoothly banking into turns, gliding gracefully, and landing softly on leaves to perch and rest.',
            'Ground Foraging, Startle Reflexes & Flocking: Birds land on open fields to hunt for seeds, walking with realistic head bobs. Approaching without seeds causes wild birds to startle and scatter, while holding seeds pacifies them and triggers flocking calls that summon nearby companions.',
            'Social Pairing & Bittersweet Achievements: Pigeons often roam and fly in synchronized pairs. Defeating an innocent pigeon unlocks the bittersweet Master achievement "Why Would You Do That?"... they drop no loot, and the world feels a little quieter.',
            'Kael, The Atlas Explorer (Planar NPC): Experience the cinematic arrival of dimensional cartographer Kael, entering your world through a swirling, animated pixel rift portal complete with cosmic stardust ripples, deep dimensional audio, and floating announcement banners.',
            'Permanent World Settlement: Once summoned, Kael settles permanently into your world as an immortal dimensional cartographer and trader, never despawning across day/night cycles, world exits, or restarts.',
            'Planar Sanctuary Aura: Kael projects an active 4.5-block dimensional ward that repels hostile mobs (Zombies, Creepers, Scorpions) with cosmic lilac ripples, instantly defuses Creeper explosion fuses to zero, shields surrounding terrain blocks from blast damage, and suppresses hostile spawns within 14 blocks.',
            'The Atlas Market (Planar Outpost): Interact with Kael using "E" to explore rich planar lore and access the Atlas Market, organized into a clean 5-column categorized interface offering rare dimensional curios, planar tools, and otherworldly commodities.',
            'Astral Infuser Workstation: Channel Astral Emeralds and Planar Gems through the newly introduced Astral Infuser workstation to forge legendary Astral armor sets and empowered utilities.',
            'Astral Armor & Cosmic Protection: Craft the full Astral Armor set (Astral Helmet, Chestplate, Leggings, and Boots) radiating ethereal amethyst particles, granting enhanced defense ratings and mystical protection upon respawn.',
            'Kinetic Shears & Planar Relics: Unlock high-efficiency Kinetic Shears for instant leaf and vine harvesting, alongside specialized relics that expand late-game survival capabilities.',
            'Terraria-Style Subterranean Cavern Shadows: Underground exploration now features deep cavern wall backdrop textures (stone, dirt, sand) that conceal the exterior sky, seamlessly transitioning into 98.8% deep inky blackness (#000006) for authentic subterranean mystery.',
            'Subterranean Depth Offset: Surface daylight now penetrates 6 blocks into the ground, ensuring shallow coal seams, iron deposits, and cave mouths remain clearly visible during daylight before fading smoothly into subterranean blackness.',
            'Direct Sky Access Daylight Raycasting: Replaced naive surface height calculations with dynamic direct-sky access checks, eliminating vertical black shadow glitches and ensuring daylight floods open ravines and cliffside openings naturally.',
            'Diverse & Interconnected Caverns: Overhauled subterranean cave generation with vastly expanded cavern systems, winding subterranean tunnels, soaring underground chambers, vertical shafts, and subterranean water and lava reservoirs.',
            'Real-time In-World Signboards: Craft wooden signs and place them anywhere. Right-clicking opens an in-world floating speech bubble anchored directly above the signpost with smooth camera tracking, displaying your text in real time.',
            'Interactive Sign Editor & Auto-Save: Features a live blinking cursor ("|"), multi-line text input (up to 4 lines with Shift+Enter), and effortless multi-trigger auto-saving (pressing Enter, right-clicking outside, or simply walking away).',
            'Sign Tooltips & Multiplayer Sync: Aiming at signs from a distance displays a clear hover tooltip with the sign\'s contents. Sign placement, edits, and deletions are fully synchronized in real-time across peer-to-peer multiplayer.',
            'Discord-Style Profile Customization: Redesigned the Player Profile screen with full visual customization, showcasing avatar banners, frame wrappers, custom crafter titles, Planar Tier badges, Astral Gem counters, and custom pixel-art scrollbars.',
            'Cosmetics Catalog System: Introduced a modular cosmetics catalog system featuring collectible avatar frames, profile banners, crafter titles, and UI color themes that persist across sessions.',
            'Chest Storage Integrity & Double Chest Architecture: Re-engineered container serialization for both Small (27-slot) and Large Double (54-slot) chests with deep item cloning, eliminating item loss across world quits, page reloads, and browser restarts.',
            'Fabulous Shaders & Settings Menu: Dedicated "Fabulous Settings" panel with granular toggle switches for Volumetric God Rays, Wind Breeze Foliage Animations, Desert Heat Shimmer, Ambient Firefly Swarms, Vignette, and Ambient Occlusion.',
            'Dynamic FPS Cap Selector: Configurable frame rate limiter (30 FPS, 60 FPS, 120 FPS, 144 FPS, and Unlimited) with persistent local storage to match your monitor\'s refresh rate and conserve laptop battery.',
            'Smooth Day Transition Respawning: Animal respawn queues are now deferred and distributed smoothly across morning frames, completely eliminating hitching and frame drops when waking up or transitioning from night to day.',
            'Tree Canopy Navigation & Foliage Pass: Sanitized tree wood and leaf collision handling to ensure smooth vertical climbing and exploration through dense forests and jungle canopies without snagging.',
            'Culinary Texture Revamp: Re-illustrated mouth-watering 16x16 pixel-art food textures for Cooked Porkchops, Bread, Raw and Cooked Beef, Golden Apples, and Melons.',
            'Difficulty & Hunger Rebalancing: Rebalanced hunger saturation, sprint exhaustion rates, health regeneration curves, and mob damage multipliers across Peaceful, Easy, Normal, Hard, and Hardcore modes.',
            'Universal Timber Recipes: All crafting recipes accepting wooden planks now flexibly accept any wood type (Oak, Jungle, and future timber variants) seamlessly.',
            'New Achievements & Emerald Rewards: Unlock brand-new achievements including "Polly Want a Cracker?" (Tame a wild parrot), "Why Would You Do That?" (Bittersweet pigeon achievement), "Planar Commerce" (Trade with Kael), and "Astral Engineering" (Craft the Astral Infuser).'
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

    export const LATEST_PATCH_NOTES = PATCH_NOTES_0_1_6;
    export const UPDATE_HISTORY_LOGS = [PATCH_NOTES_0_1_6, PATCH_NOTES_0_1_5, PATCH_NOTES_0_1_4_PATCH_1, PATCH_NOTES_0_1_4, PATCH_NOTES_0_1_3];

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
        OBSIDIAN: 62,
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
        EMERALD: 183,
        GLOOM_SILK: 184,
        SHADOW_CARAPACE: 185,
        SHADOWFANG: 186,
        GLOOM_LANTERN: 187
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
    MINIMAP_COLOR_32[IDS.OBSIDIAN] = 0xFF281420;
    MINIMAP_COLOR_32[IDS.WATER] = 0xFFD4781C;
    MINIMAP_COLOR_32[IDS.LAVA] = 0xFF1F4BD9;

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
        [IDS.SIGN]: 15,
        [IDS.OBSIDIAN]: 500
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
    ID_NAMES[IDS.GLOOM_SILK] = 'Gloom Silk';
    ID_NAMES[IDS.SHADOW_CARAPACE] = 'Shadow Carapace';
    ID_NAMES[IDS.SHADOWFANG] = 'Shadowfang Dagger';
    ID_NAMES[IDS.GLOOM_LANTERN] = 'Gloom Lantern';

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
        [IDS.ASTRAL_SHOVEL]: 750, [IDS.KINETIC_SHEARS]: 500, [IDS.SHADOWFANG]: 450
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
        if (blockId === IDS.OBSIDIAN) return 5;
        return 0;
    }

    export function isPickaxe(id) {
        return id === IDS.WOOD_PICKAXE || id === IDS.STONE_PICKAXE || id === IDS.IRON_PICKAXE ||
               id === IDS.GOLD_PICKAXE || id === IDS.DIAMOND_PICKAXE || id === IDS.ASTRAL_PICKAXE;
    }

    export function isAxe(id) {
        return id === IDS.WOOD_AXE || id === IDS.STONE_AXE || id === IDS.IRON_AXE ||
               id === IDS.GOLD_AXE || id === IDS.DIAMOND_AXE || id === IDS.ASTRAL_AXE;
    }

    export function isShovel(id) {
        return id === IDS.WOOD_SHOVEL || id === IDS.STONE_SHOVEL || id === IDS.IRON_SHOVEL ||
               id === IDS.GOLD_SHOVEL || id === IDS.DIAMOND_SHOVEL || id === IDS.ASTRAL_SHOVEL;
    }

    export function isSword(id) {
        return id === IDS.WOOD_SWORD || id === IDS.STONE_SWORD || id === IDS.IRON_SWORD ||
               id === IDS.GOLD_SWORD || id === IDS.DIAMOND_SWORD || id === IDS.ASTRAL_SWORD ||
               id === IDS.SHADOWFANG;
    }

    export function isHoe(id) {
        return id === IDS.WOOD_HOE || id === IDS.STONE_HOE || id === IDS.IRON_HOE ||
               id === IDS.GOLD_HOE || id === IDS.DIAMOND_HOE;
    }

    export function isShears(id) {
        return id === IDS.KINETIC_SHEARS || (typeof IDS.SHEARS !== 'undefined' && id === IDS.SHEARS);
    }

    export function isPickaxeBlock(blockId) {
        return blockId === IDS.STONE ||
               blockId === IDS.COBBLESTONE ||
               blockId === IDS.COAL_ORE ||
               blockId === IDS.IRON_ORE ||
               blockId === IDS.GOLD_ORE ||
               blockId === IDS.DIAMOND_ORE ||
               blockId === IDS.EMERALD_ORE ||
               blockId === IDS.FURNACE ||
               blockId === IDS.COBBLESTONE_STAIRS ||
               blockId === IDS.COBBLESTONE_STAIRS_LEFT ||
               blockId === IDS.COBBLESTONE_STAIRS_RIGHT ||
               blockId === IDS.VOID_STONE_BRICK ||
               blockId === IDS.ASTRAL_INFUSER;
    }

    export function isAxeBlock(blockId) {
        return blockId === IDS.WOOD ||
               blockId === IDS.PLANKS ||
               blockId === IDS.JUNGLE_WOOD ||
               blockId === IDS.JUNGLE_PLANKS ||
               blockId === IDS.WOODEN_STAIRS ||
               blockId === IDS.WOODEN_STAIRS_LEFT ||
               blockId === IDS.WOODEN_STAIRS_RIGHT ||
               blockId === IDS.CRAFTING_TABLE ||
               blockId === IDS.CHEST ||
               blockId === IDS.DOOR ||
               blockId === IDS.DOOR_TOP ||
               blockId === IDS.DOOR_OPEN ||
               blockId === IDS.DOOR_OPEN_TOP ||
               blockId === IDS.JUNGLE_DOOR ||
               blockId === IDS.JUNGLE_DOOR_TOP ||
               blockId === IDS.JUNGLE_DOOR_OPEN ||
               blockId === IDS.JUNGLE_DOOR_OPEN_TOP ||
               blockId === IDS.JUKEBOX ||
               blockId === IDS.LADDER ||
               blockId === IDS.BAMBOO ||
               blockId === IDS.SIGN ||
               blockId === IDS.MELON ||
               blockId === IDS.SUNBURST_MELON;
    }

    export function isShovelBlock(blockId) {
        return blockId === IDS.DIRT ||
               blockId === IDS.GRASS ||
               blockId === IDS.PLOWED_DIRT ||
               blockId === IDS.FARMLAND ||
               blockId === IDS.SAND ||
               blockId === IDS.SNOW;
    }

    export function isShearsBlock(blockId) {
        return blockId === IDS.LEAVES ||
               blockId === IDS.JUNGLE_LEAVES ||
               blockId === IDS.VINES ||
               blockId === IDS.SHORT_GRASS ||
               blockId === IDS.TALL_GRASS ||
               blockId === IDS.FERN ||
               blockId === IDS.VOID_BERRY_BUSH;
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
    export let underwaterScreenAlpha = 0;
    export let underwaterDeepFactor = 0;
    export const BACKGROUND_BUILDING_BLOCKS = new Set([
        IDS.DIRT, IDS.GRASS, IDS.STONE, IDS.COBBLESTONE, IDS.WOOD, IDS.PLANKS,
        IDS.SAND, IDS.SNOW, IDS.WOOL, IDS.WOODEN_STAIRS, IDS.COBBLESTONE_STAIRS,
        IDS.WOODEN_STAIRS_RIGHT, IDS.COBBLESTONE_STAIRS_RIGHT,
        IDS.JUNGLE_WOOD, IDS.JUNGLE_PLANKS,
        IDS.VOID_STONE_BRICK, IDS.PRISM_GLASS, IDS.OBSIDIAN
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
    export function setEngineNonCollidableTreeWood(newSet) {
        nonCollidableTreeWood = (newSet instanceof Set) ? newSet : new Set(newSet || []);
        if (typeof window !== 'undefined') {
            window.nonCollidableTreeWood = nonCollidableTreeWood;
        }
        return nonCollidableTreeWood;
    }
    try { if (typeof window !== 'undefined') window.setEngineNonCollidableTreeWood = setEngineNonCollidableTreeWood; } catch(e) {}

    export function isLeafBlock(id) {
        return id === IDS.LEAVES || id === IDS.PINE_LEAVES || id === IDS.JUNGLE_LEAVES;
    }
    export function isFoliageOrAir(id) {
        return id === IDS.AIR || id === IDS.SHORT_GRASS || id === IDS.TALL_GRASS ||
               id === IDS.FLOWER_RED || id === IDS.FLOWER_YELLOW || id === IDS.FERN ||
               id === IDS.VINES || id === IDS.SNOW || isLeafBlock(id);
    }

    export function isWoodPartOfTree(wx, wy) {
        if (!world || !world[wx]) return false;
        const b = world[wx][wy];
        if (b !== IDS.WOOD && b !== IDS.JUNGLE_WOOD) return false;

        const isNaturalGround = (blk) => (
            blk === IDS.DIRT || blk === IDS.GRASS || blk === IDS.STONE ||
            blk === IDS.SAND || blk === IDS.PODZOL || blk === IDS.SNOW || blk === IDS.GRAVEL
        );

        // Canopy leaves check:
        // Every natural tree (oak, pine, jungle, fancy, bushes) has canopy leaves within radius 5 horizontally and 18 vertically above.
        let hasCanopyLeaves = false;
        for (let dx = -5; dx <= 5; dx++) {
            const nx = wx + dx;
            if (nx < 0 || nx >= WORLD_WIDTH || !world[nx]) continue;
            for (let dy = -18; dy <= 4; dy++) {
                const ny = wy + dy;
                if (ny < 0 || ny >= WORLD_HEIGHT) continue;
                const blk = world[nx][ny];
                if (isLeafBlock(blk)) {
                    hasCanopyLeaves = true;
                    break;
                }
            }
            if (hasCanopyLeaves) break;
        }
        if (!hasCanopyLeaves) return false;

        const isWood = (id) => id === IDS.WOOD || id === IDS.JUNGLE_WOOD;
        const up = world[wx]?.[wy - 1];
        const down = world[wx]?.[wy + 1];
        const left = world[wx - 1]?.[wy];
        const right = world[wx + 1]?.[wy];

        const isVerticalTrunk = isWood(up) || isWood(down) || isNaturalGround(down) || isLeafBlock(up) || isLeafBlock(down);
        const isBranch = (isWood(left) && (isWood(world[wx - 1]?.[wy - 1]) || isWood(world[wx - 1]?.[wy + 1]) || isNaturalGround(world[wx - 1]?.[wy + 1]))) ||
                         (isWood(right) && (isWood(world[wx + 1]?.[wy - 1]) || isWood(world[wx + 1]?.[wy + 1]) || isNaturalGround(world[wx + 1]?.[wy + 1])));

        if (!isVerticalTrunk && !isBranch) return false;

        // Reject long horizontal platforms (bridges / roofs >= 5 blocks wide)
        let horizRun = 1;
        let lx = wx - 1;
        while (lx >= 0 && isWood(world[lx]?.[wy])) {
            horizRun++;
            lx--;
        }
        let rx = wx + 1;
        while (rx < WORLD_WIDTH && isWood(world[rx]?.[wy])) {
            horizRun++;
            rx++;
        }
        if (horizRun >= 5) return false;

        // Ground connectivity check:
        // Tracing downwards within a 2-block radius to reach natural ground within 26 blocks.
        // Trees can have torches, chests, flowers, grass, snow, vines, or air underneath branches.
        let reachesGround = false;
        for (let cx = Math.max(0, wx - 2); cx <= Math.min(WORLD_WIDTH - 1, wx + 2); cx++) {
            if (!world[cx]) continue;
            for (let cy = wy; cy < Math.min(WORLD_HEIGHT, wy + 26); cy++) {
                const cb = world[cx][cy];
                if (isNaturalGround(cb)) {
                    reachesGround = true;
                    break;
                }
                // If we encounter player construction blocks (planks, cobblestone, bricks), abort column
                if (cb === IDS.PLANKS || cb === IDS.JUNGLE_PLANKS || cb === IDS.BRICKS || cb === IDS.STONE_BRICKS) {
                    break;
                }
            }
            if (reachesGround) break;
        }

        return reachesGround;
    }

    export function sanitizeTreeWoodCollision() {
        if (!nonCollidableTreeWood || nonCollidableTreeWood.size === 0 || !world || !world.length) return;
        const toRemove = [];
        for (const cell of nonCollidableTreeWood) {
            const sep = cell.indexOf('_');
            if (sep === -1) { toRemove.push(cell); continue; }
            const x = parseInt(cell.slice(0, sep), 10);
            const y = parseInt(cell.slice(sep + 1), 10);
            if (isNaN(x) || isNaN(y) || x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) {
                toRemove.push(cell);
                continue;
            }
            const b = world[x]?.[y];
            // Remove cells if the wood block was destroyed, mined, or replaced
            if (b !== IDS.WOOD && b !== IDS.JUNGLE_WOOD) {
                toRemove.push(cell);
                continue;
            }
        }
        for (let i = 0; i < toRemove.length; i++) {
            nonCollidableTreeWood.delete(toRemove[i]);
        }
        if (typeof window !== 'undefined') window.nonCollidableTreeWood = nonCollidableTreeWood;
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
        sanitizeTreeWoodCollision();
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
    export let miningTarget = { x: -1, y: -1, progress: 0, toolId: null, slotIndex: 0 };
    export let tooltipEl = typeof document !== 'undefined' ? document.getElementById('item-tooltip') : null;

    export const textures = {};

    export const COBBLESTONE_MAP = [
        [1, 2, 5, 6, 5, 2, 1, 0, 1, 2, 6, 7, 6, 2, 1, 0],
        [2, 6, 7, 6, 4, 3, 1, 0, 2, 5, 7, 7, 5, 3, 2, 1],
        [5, 7, 6, 4, 3, 2, 0, 1, 3, 5, 6, 5, 4, 2, 1, 2],
        [3, 4, 3, 2, 1, 0, 1, 2, 4, 4, 3, 2, 1, 0, 1, 4],
        [1, 2, 1, 0, 1, 2, 5, 6, 4, 2, 1, 0, 1, 2, 4, 5],
        [0, 1, 1, 2, 6, 7, 6, 5, 3, 1, 0, 1, 3, 5, 6, 4],
        [1, 2, 5, 7, 7, 6, 4, 2, 1, 0, 2, 5, 6, 6, 4, 2],
        [2, 6, 7, 6, 5, 3, 1, 0, 1, 3, 6, 7, 5, 3, 2, 1],
        [3, 5, 4, 3, 2, 1, 0, 1, 3, 6, 7, 6, 4, 2, 1, 0],
        [1, 2, 1, 0, 0, 1, 2, 5, 6, 5, 4, 3, 1, 0, 1, 2],
        [0, 1, 2, 4, 2, 1, 3, 7, 7, 5, 3, 2, 0, 1, 3, 6],
        [1, 3, 6, 7, 5, 2, 4, 6, 5, 3, 1, 0, 1, 3, 6, 7],
        [2, 5, 7, 6, 4, 2, 1, 2, 1, 0, 1, 2, 4, 6, 7, 5],
        [4, 6, 5, 3, 2, 1, 0, 1, 2, 5, 6, 5, 3, 4, 5, 3],
        [3, 4, 2, 1, 0, 1, 3, 5, 7, 7, 5, 3, 2, 1, 2, 1],
        [1, 2, 1, 0, 1, 3, 6, 7, 6, 4, 2, 1, 0, 1, 2, 1]
    ];

    export function getCobblestonePixel(px, py) {
        const x = (px % 16 + 16) % 16;
        const y = (py % 16 + 16) % 16;
        const idx = COBBLESTONE_MAP[y][x];
        const palette = ['#242424', '#363636', '#484848', '#585858', '#686868', '#787878', '#8c8c8c', '#9e9e9e'];
        return palette[idx];
    }

    export const NUM_FLUID_FRAMES = 16;
    export const waterStillFrames = [];
    export const waterFlowFrames = [];
    export const lavaStillFrames = [];
    export const lavaFlowFrames = [];

    // Authentic Minecraft Lava Palette (warm luminous molten red/orange, glowing amber, less dark crust)
    export const LAVA_PALETTE = [
        '#8c2203', // 0: Warm molten red base (lighter than dark crust)
        '#a62d05', // 1: Luminous crimson-orange
        '#c03e08', // 2: Warm volcanic red-orange
        '#d4530c', // 3: Bright magma orange
        '#e46b14', // 4: Radiant molten orange
        '#f08620', // 5: Glowing amber orange
        '#f6a432', // 6: Warm golden amber
        '#fac24c', // 7: Luminous honey gold
        '#fdda68', // 8: Radiant bright yellow highlight
        '#fff5a0'  // 9: Warm white-gold thermal spark
    ];

    // Authentic Minecraft Water Palette (lighter, clearer aquatic azure with gentle translucency)
    export const WATER_PALETTE = [
        'rgba(46, 114, 218, 0.68)',  // 0: Soft oceanic azure base
        'rgba(58, 128, 228, 0.68)',  // 1: Clear vibrant blue
        'rgba(72, 144, 236, 0.70)',  // 2: Lighter sky-blue stream
        'rgba(90, 162, 242, 0.72)',  // 3: Soft aquatic ripple
        'rgba(115, 182, 246, 0.74)', // 4: Luminous cyan-azure crest
        'rgba(152, 206, 250, 0.76)', // 5: Gentle surface glint
        'rgba(196, 232, 255, 0.80)'  // 6: Crisp foam highlight
    ];

    export function initAnimatedFluidTextures() {
        if (typeof document === 'undefined') return;
        waterStillFrames.length = 0;
        waterFlowFrames.length = 0;
        lavaStillFrames.length = 0;
        lavaFlowFrames.length = 0;

        for (let f = 0; f < NUM_FLUID_FRAMES; f++) {
            const t = f / NUM_FLUID_FRAMES;
            const phi = t * 2.0 * Math.PI;

            // 1. LAVA STILL (Toroidal seamless organic swirling molten magma matching Image 2)
            const lStillCanvas = document.createElement('canvas');
            lStillCanvas.width = 16; lStillCanvas.height = 16;
            const lsCtx = lStillCanvas.getContext('2d');
            for (let py = 0; py < 16; py++) {
                const v = (py * 2.0 * Math.PI) / 16.0;
                for (let px = 0; px < 16; px++) {
                    const u = (px * 2.0 * Math.PI) / 16.0;
                    const w1 = Math.sin(u + Math.sin(v + phi) * 0.85 + phi);
                    const w2 = Math.cos(u - v + Math.cos(u * 2.0 + phi) * 0.65 - phi * 1.4);
                    const w3 = Math.sin(u * 2.0 + v * 2.0 + Math.sin(phi * 2.0) * 0.7);
                    const w4 = Math.cos(u * 3.0 - phi) * Math.sin(v * 2.0 + phi);
                    const w5 = Math.sin(u * 4.0 - v * 2.0 + phi * 0.5) * 0.5;
                    const val = (w1 * 0.35 + w2 * 0.28 + w3 * 0.20 + w4 * 0.10 + w5 * 0.07);
                    const norm = (val + 1.0) * 0.5;
                    const h = Math.pow(norm, 1.25);
                    const idx = Math.max(0, Math.min(9, Math.floor(h * 10)));
                    lsCtx.fillStyle = LAVA_PALETTE[idx];
                    lsCtx.fillRect(px, py, 1, 1);
                }
            }
            lStillCanvas.src = lStillCanvas.toDataURL ? lStillCanvas.toDataURL() : '';
            lavaStillFrames.push(lStillCanvas);

            // 2. LAVA FLOW (Downward continuous streaming fiery veins)
            const lFlowCanvas = document.createElement('canvas');
            lFlowCanvas.width = 16; lFlowCanvas.height = 16;
            const lfCtx = lFlowCanvas.getContext('2d');
            for (let py = 0; py < 16; py++) {
                const vFlow = ((py * 2.0 * Math.PI) / 16.0) - phi;
                for (let px = 0; px < 16; px++) {
                    const u = (px * 2.0 * Math.PI) / 16.0;
                    const w1 = Math.sin(u * 2.0 + Math.sin(vFlow) * 0.65);
                    const w2 = Math.cos(u * 3.0 + vFlow * 0.8 - phi * 1.5);
                    const w3 = Math.sin(u * 4.0 - phi * 2.0) * Math.cos(vFlow);
                    const val = (w1 * 0.45 + w2 * 0.35 + w3 * 0.20);
                    const norm = (val + 1.0) * 0.5;
                    const h = Math.pow(norm, 1.25);
                    const idx = Math.max(0, Math.min(9, Math.floor(h * 10)));
                    lfCtx.fillStyle = LAVA_PALETTE[idx];
                    lfCtx.fillRect(px, py, 1, 1);
                }
            }
            lFlowCanvas.src = lFlowCanvas.toDataURL ? lFlowCanvas.toDataURL() : '';
            lavaFlowFrames.push(lFlowCanvas);

            // 3. WATER STILL (Calm aquatic sapphire ripples and caustics)
            const wStillCanvas = document.createElement('canvas');
            wStillCanvas.width = 16; wStillCanvas.height = 16;
            const wsCtx = wStillCanvas.getContext('2d');
            for (let py = 0; py < 16; py++) {
                const v = (py * 2.0 * Math.PI) / 16.0;
                for (let px = 0; px < 16; px++) {
                    const u = (px * 2.0 * Math.PI) / 16.0;
                    const w1 = Math.sin(u + v + phi);
                    const w2 = Math.cos(u * 2.0 - v + phi * 1.2);
                    const w3 = Math.sin(v * 2.0 + Math.cos(u + phi * 0.8) * 0.7 - phi);
                    const w4 = Math.cos(u - v * 2.0 - phi * 1.4);
                    const val = (w1 * 0.35 + w2 * 0.25 + w3 * 0.25 + w4 * 0.15);
                    const norm = (val + 1.0) * 0.5;
                    const h = Math.pow(norm, 1.1);
                    const idx = Math.max(0, Math.min(6, Math.floor(h * 7)));
                    wsCtx.fillStyle = WATER_PALETTE[idx];
                    wsCtx.fillRect(px, py, 1, 1);
                }
            }
            wStillCanvas.src = wStillCanvas.toDataURL ? wStillCanvas.toDataURL() : '';
            waterStillFrames.push(wStillCanvas);

            // 4. WATER FLOW (Streaming downward ripples with white-water foam flecks)
            const wFlowCanvas = document.createElement('canvas');
            wFlowCanvas.width = 16; wFlowCanvas.height = 16;
            const wfCtx = wFlowCanvas.getContext('2d');
            for (let py = 0; py < 16; py++) {
                const vFlow = ((py * 2.0 * Math.PI) / 16.0) - phi;
                for (let px = 0; px < 16; px++) {
                    const u = (px * 2.0 * Math.PI) / 16.0;
                    const w1 = Math.sin(u * 2.0 + Math.sin(vFlow) * 0.6);
                    const w2 = Math.cos(u * 3.0 + vFlow * 0.9 - phi * 1.3);
                    const w3 = Math.sin(u * 4.0 - phi * 1.8) * Math.cos(vFlow);
                    const val = (w1 * 0.40 + w2 * 0.35 + w3 * 0.25);
                    const norm = (val + 1.0) * 0.5;
                    const h = Math.pow(norm, 1.1);
                    const idx = Math.max(0, Math.min(6, Math.floor(h * 7)));
                    wfCtx.fillStyle = WATER_PALETTE[idx];
                    wfCtx.fillRect(px, py, 1, 1);
                }
            }
            wFlowCanvas.src = wFlowCanvas.toDataURL ? wFlowCanvas.toDataURL() : '';
            waterFlowFrames.push(wFlowCanvas);
        }

        textures.water_still_frames = waterStillFrames;
        textures.water_flow_frames = waterFlowFrames;
        textures.lava_still_frames = lavaStillFrames;
        textures.lava_flow_frames = lavaFlowFrames;

        if (waterStillFrames.length > 0) textures[IDS.WATER] = waterStillFrames[0];
        if (lavaStillFrames.length > 0) textures[IDS.LAVA] = lavaStillFrames[0];
    }
    initAnimatedFluidTextures();

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
                    p(x, y, getCobblestonePixel(x, y));
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
                        p(x, y, (x + y) % 3 === 0 ? '#242424' : '#363636');
                    } else if (isKeystone) {
                        p(x, y, '#9e9e9e');
                    } else if (isArchTop) {
                        p(x, y, (x === 7 || x === 8) ? '#787878' : '#484848');
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
                        p(x, y, getCobblestonePixel(x, y));
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
                else if (id === IDS.SNOW) p(x, y, randColor(['#ffffff', '#f4f8ff', '#eef4ff']));
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
                    if (waterStillFrames.length > 0) {
                        tCtx.drawImage(waterStillFrames[0], 0, 0, 16, 16);
                    } else {
                        const u = (x * 2.0 * Math.PI) / 16.0;
                        const v = (y * 2.0 * Math.PI) / 16.0;
                        const w = Math.sin(u + v) * 0.5 + Math.cos(u * 2.0 - v) * 0.5;
                        const idx = Math.max(0, Math.min(6, Math.floor(((w + 1.0) * 0.5) * 7)));
                        p(x, y, WATER_PALETTE[idx]);
                    }
                }
                else if (id === IDS.LAVA) {
                    if (lavaStillFrames.length > 0) {
                        tCtx.drawImage(lavaStillFrames[0], 0, 0, 16, 16);
                    } else {
                        const u = (x * 2.0 * Math.PI) / 16.0;
                        const v = (y * 2.0 * Math.PI) / 16.0;
                        const w = Math.sin(u + Math.sin(v) * 0.85) * 0.5 + Math.cos(u - v) * 0.5;
                        const idx = Math.max(0, Math.min(9, Math.floor(Math.pow((w + 1.0) * 0.5, 1.25) * 10)));
                        p(x, y, LAVA_PALETTE[idx]);
                    }
                }
                else if (id === IDS.OBSIDIAN) {
                    p(x, y, '#120c1f');
                    if ((x * 7 + y * 13) % 5 === 0) p(x, y, '#1e1430');
                    if ((x + y * 3) % 7 === 0) p(x, y, '#2c1b42');
                    if ((x * 3 + y * 2) % 11 === 0) p(x, y, '#432669');
                    if ((x === 5 && y === 4) || (x === 11 && y === 9) || (x === 3 && y === 12)) p(x, y, '#6b3ea3');
                    if ((x === 6 && y === 4) || (x === 12 && y === 9)) p(x, y, '#a855f7');
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
                        let c = getCobblestonePixel(x, y);
                        if ((x === 8 && y < 8) || (y === 8 && x < 8)) c = '#242424';
                        p(x, y, c);
                    }
                }
                else if (id === IDS.COBBLESTONE_STAIRS || id === IDS.COBBLESTONE_STAIRS_LEFT) {
                    const isSolidPart = (y >= 8) || (x < 8);
                    if (isSolidPart) {
                        let c = getCobblestonePixel(x, y);
                        if ((x === 7 && y < 8) || (y === 8 && x >= 8)) c = '#242424';
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
                else if ([IDS.JUNGLE_DOOR, IDS.JUNGLE_DOOR_TOP, IDS.JUNGLE_DOOR_OPEN, IDS.JUNGLE_DOOR_OPEN_TOP].includes(id)) {
                    const isClosed = (id === IDS.JUNGLE_DOOR || id === IDS.JUNGLE_DOOR_TOP);
                    const isTop = (id === IDS.JUNGLE_DOOR_TOP || id === IDS.JUNGLE_DOOR_OPEN_TOP);
                    if (isClosed) {
                        // Closed: Side profile (matching normal door style)
                        if (x >= 1 && x <= 4) {
                            let c = (x === 1 || x === 4) ? '#633e1c' : ((x + y) % 2 === 0 ? '#b8824f' : '#bf8956');
                            p(x, y, c);
                            if (y === 2 || y === 13) p(x, y, '#633e1c');
                            if (isTop && y >= 6 && y <= 9 && (x === 2 || x === 3)) p(x, y, '#38bdf8'); // porthole slit
                            if (!isTop && x === 3 && y === 7) p(x, y, '#facc15'); // gold handle
                        }
                    } else {
                        // Open: Full front-facing texture with porthole window
                        let isEdge = (x === 0 || x === 15 || y === 0 || (!isTop && y === 15));
                        let c = isEdge ? '#633e1c' : ['#b8824f', '#bf8956'][x % 2];
                        p(x, y, c);
                        if (isTop) {
                            let dx = x - 7.5, dy = y - 7.5;
                            let dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist < 3.2) p(x, y, dist > 2.2 ? '#452a12' : '#38bdf8');
                        }
                        if (!isTop && y === 7 && (x === 12 || x === 13)) p(x, y, '#facc15');
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
                else if (id === IDS.GLOOM_SILK) {
                    const silkPixels = [
                        [5, 4, '#38bdf8'], [6, 4, '#c084fc'], [7, 4, '#7c3aed'], [8, 4, '#581c87'],
                        [4, 5, '#c084fc'], [5, 5, '#ffffff'], [6, 5, '#a855f7'], [7, 5, '#7c3aed'], [8, 5, '#3b0764'],
                        [4, 6, '#7c3aed'], [5, 6, '#a855f7'], [6, 6, '#c084fc'], [7, 6, '#e9d5ff'], [8, 6, '#7c3aed'], [9, 6, '#38bdf8'],
                        [5, 7, '#581c87'], [6, 7, '#7c3aed'], [7, 7, '#a855f7'], [8, 7, '#c084fc'], [9, 7, '#7c3aed'], [10, 7, '#3b0764'],
                        [6, 8, '#3b0764'], [7, 8, '#581c87'], [8, 8, '#7c3aed'], [9, 8, '#a855f7'], [10, 8, '#c084fc'], [11, 8, '#38bdf8'],
                        [7, 9, '#3b0764'], [8, 9, '#7c3aed'], [9, 9, '#c084fc'], [10, 9, '#e9d5ff'], [11, 9, '#7c3aed'],
                        [8, 10, '#581c87'], [9, 10, '#a855f7'], [10, 10, '#7c3aed'], [11, 10, '#3b0764'],
                        [9, 11, '#3b0764'], [10, 11, '#581c87'], [11, 11, '#38bdf8']
                    ];
                    silkPixels.forEach(([sx, sy, scol]) => p(sx, sy, scol));
                }
                else if (id === IDS.SHADOW_CARAPACE) {
                    const platePixels = [
                        [7, 2, '#38bdf8'], [8, 2, '#38bdf8'],
                        [6, 3, '#c084fc'], [7, 3, '#7c3aed'], [8, 3, '#581c87'], [9, 3, '#38bdf8'],
                        [5, 4, '#a855f7'], [6, 4, '#6b21a8'], [7, 4, '#1e102d'], [8, 4, '#1e102d'], [9, 4, '#581c87'], [10, 4, '#a855f7'],
                        [4, 5, '#7c3aed'], [5, 5, '#1e102d'], [6, 5, '#090514'], [7, 5, '#38bdf8'], [8, 5, '#090514'], [9, 5, '#1e102d'], [10, 5, '#581c87'], [11, 5, '#7c3aed'],
                        [3, 6, '#581c87'], [4, 6, '#1e102d'], [5, 6, '#090514'], [6, 6, '#a855f7'], [7, 6, '#090514'], [8, 6, '#090514'], [9, 6, '#1e102d'], [10, 6, '#3b0764'],
                        [4, 7, '#3b0764'], [5, 7, '#1e102d'], [6, 7, '#090514'], [7, 7, '#090514'], [8, 7, '#38bdf8'], [9, 7, '#1e102d'], [10, 7, '#3b0764'],
                        [5, 8, '#3b0764'], [6, 8, '#1e102d'], [7, 8, '#a855f7'], [8, 8, '#090514'], [9, 8, '#1e102d'], [10, 8, '#3b0764'],
                        [5, 9, '#581c87'], [6, 9, '#1e102d'], [7, 9, '#090514'], [8, 9, '#090514'], [9, 9, '#3b0764'],
                        [6, 10, '#3b0764'], [7, 10, '#1e102d'], [8, 10, '#38bdf8'], [9, 10, '#3b0764'],
                        [7, 11, '#581c87'], [8, 11, '#3b0764'],
                        [7, 12, '#3b0764']
                    ];
                    platePixels.forEach(([sx, sy, scol]) => p(sx, sy, scol));
                }
                else if (id === IDS.SHADOWFANG) {
                    const fangPixels = [
                        [2, 14, '#38bdf8'], [3, 14, '#c084fc'], [2, 13, '#c084fc'], [3, 13, '#581c87'],
                        [3, 12, '#180e29'], [4, 12, '#581c87'], [4, 11, '#180e29'], [5, 11, '#7c3aed'],
                        [3, 10, '#c084fc'], [4, 10, '#7c3aed'], [5, 10, '#3b0764'], [6, 10, '#7c3aed'], [7, 10, '#38bdf8'],
                        [5, 9, '#581c87'], [6, 9, '#3b0764'],
                        [5, 8, '#c084fc'], [6, 8, '#1e102d'], [7, 8, '#090514'], [8, 8, '#7c3aed'],
                        [6, 7, '#38bdf8'], [7, 7, '#1e102d'], [8, 7, '#090514'], [9, 7, '#7c3aed'],
                        [7, 6, '#ffffff'], [8, 6, '#38bdf8'], [9, 6, '#1e102d'], [10, 6, '#a855f7'],
                        [8, 5, '#c084fc'], [9, 5, '#1e102d'], [10, 5, '#090514'], [11, 5, '#38bdf8'],
                        [9, 4, '#38bdf8'], [10, 4, '#c084fc'], [11, 4, '#7c3aed'], [12, 4, '#ffffff'],
                        [11, 3, '#c084fc'], [12, 3, '#38bdf8'], [13, 3, '#ffffff'],
                        [12, 2, '#38bdf8'], [13, 2, '#ffffff']
                    ];
                    fangPixels.forEach(([sx, sy, scol]) => p(sx, sy, scol));
                }
                else if (id === IDS.GLOOM_LANTERN) {
                    const lanternPixels = [
                        [7, 1, '#71717a'], [8, 1, '#71717a'],
                        [6, 2, '#3f3f46'], [9, 2, '#3f3f46'],
                        [7, 3, '#27272a'], [8, 3, '#27272a'],
                        [5, 4, '#18181b'], [6, 4, '#3f3f46'], [7, 4, '#52525b'], [8, 4, '#52525b'], [9, 4, '#3f3f46'], [10, 4, '#18181b'],
                        [4, 5, '#18181b'], [5, 5, '#3f3f46'], [6, 5, '#27272a'], [7, 5, '#27272a'], [8, 5, '#27272a'], [9, 5, '#27272a'], [10, 5, '#3f3f46'], [11, 5, '#18181b'],
                        [4, 6, '#27272a'], [5, 6, '#18181b'], [6, 6, '#3b0764'], [7, 6, '#c084fc'], [8, 6, '#c084fc'], [9, 6, '#3b0764'], [10, 6, '#18181b'], [11, 6, '#27272a'],
                        [4, 7, '#3f3f46'], [5, 7, '#3b0764'], [6, 7, '#a855f7'], [7, 7, '#ffffff'], [8, 7, '#ffffff'], [9, 7, '#a855f7'], [10, 7, '#3b0764'], [11, 7, '#3f3f46'],
                        [4, 8, '#3f3f46'], [5, 8, '#581c87'], [6, 8, '#c084fc'], [7, 8, '#ffffff'], [8, 8, '#38bdf8'], [9, 8, '#c084fc'], [10, 8, '#581c87'], [11, 8, '#3f3f46'],
                        [4, 9, '#27272a'], [5, 9, '#3b0764'], [6, 9, '#7c3aed'], [7, 9, '#a855f7'], [8, 9, '#a855f7'], [9, 9, '#7c3aed'], [10, 9, '#3b0764'], [11, 9, '#27272a'],
                        [4, 10, '#18181b'], [5, 10, '#18181b'], [6, 10, '#3b0764'], [7, 10, '#581c87'], [8, 10, '#581c87'], [9, 10, '#3b0764'], [10, 10, '#18181b'], [11, 10, '#18181b'],
                        [4, 11, '#27272a'], [5, 11, '#3f3f46'], [6, 11, '#27272a'], [7, 11, '#27272a'], [8, 11, '#27272a'], [9, 11, '#27272a'], [10, 11, '#3f3f46'], [11, 11, '#27272a'],
                        [3, 12, '#18181b'], [4, 12, '#3f3f46'], [5, 12, '#52525b'], [6, 12, '#3f3f46'], [7, 12, '#3f3f46'], [8, 12, '#3f3f46'], [9, 12, '#3f3f46'], [10, 12, '#52525b'], [11, 12, '#3f3f46'], [12, 12, '#18181b'],
                        [4, 13, '#18181b'], [5, 13, '#27272a'], [6, 13, '#27272a'], [7, 13, '#27272a'], [8, 13, '#27272a'], [9, 13, '#27272a'], [10, 13, '#27272a'], [11, 13, '#18181b']
                    ];
                    lanternPixels.forEach(([sx, sy, scol]) => p(sx, sy, scol));
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

    // Pre-rendered subterranean cavern wall backdrop textures
    export const cachedCavernWallStone = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    export const cachedCavernWallDirt = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    export const cachedCavernWallSand = typeof document !== 'undefined' ? document.createElement('canvas') : null;

    export function initCavernWallTextures() {
        if (typeof document === 'undefined') return;
        const prepareWall = (targetCanvas, baseTex, darkTint) => {
            if (!targetCanvas || !baseTex) return;
            targetCanvas.width = 16;
            targetCanvas.height = 16;
            const wCtx = targetCanvas.getContext('2d');
            wCtx.imageSmoothingEnabled = false;
            wCtx.drawImage(baseTex, 0, 0, 16, 16);
            wCtx.fillStyle = darkTint;
            wCtx.fillRect(0, 0, 16, 16);
        };
        if (textures[IDS.STONE]) prepareWall(cachedCavernWallStone, textures[IDS.STONE], 'rgba(4, 4, 8, 0.78)');
        if (textures[IDS.DIRT]) prepareWall(cachedCavernWallDirt, textures[IDS.DIRT], 'rgba(7, 5, 4, 0.75)');
        if (textures[IDS.SAND]) prepareWall(cachedCavernWallSand, textures[IDS.SAND], 'rgba(12, 9, 6, 0.72)');
    }
    initCavernWallTextures();

    export const largeChestTexture = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    export const largeChestImage = typeof Image !== 'undefined' ? new Image() : (largeChestTexture || {});
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
        largeChestTexture.complete = true;
        if (largeChestTexture.toDataURL) {
            const dataUrl = largeChestTexture.toDataURL();
            largeChestTexture.src = dataUrl;
            if (typeof Image !== 'undefined' && largeChestImage instanceof Image) {
                largeChestImage.src = dataUrl;
            }
        }
    }

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
                    pLit(x, y, (x + y) % 3 === 0 ? '#242424' : '#363636');
                } else if (isKeystone) {
                    pLit(x, y, '#9e9e9e');
                } else if (isArchTop) {
                    pLit(x, y, (x === 7 || x === 8) ? '#787878' : '#484848');
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
                    pLit(x, y, getCobblestonePixel(x, y));
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
            const isHandheld = (typeof isTool === 'function' && isTool(heldItemId)) || [
                IDS.STICK, IDS.TORCH, IDS.BOW, IDS.BONE, IDS.FEATHER,
                IDS.ASTRAL_SHARD, IDS.CHRONO_ANCHOR, IDS.CELESTIAL_COMPASS, IDS.VOID_BEACON,
                IDS.GLOOM_LANTERN
            ].includes(heldItemId);

            if (isHandheld) {
                // Diagonal handheld tool/weapon: pivot at grip (handle at hand), angled 45° forward & up in player facing direction
                ctx.rotate(Math.PI * 0.5);
                ctx.drawImage(textures[heldItemId], -20, -20, 24, 24);
            } else {
                // Blocks, food, and generic items held upright in front of the hand
                ctx.rotate(Math.PI * 0.1);
                ctx.drawImage(textures[heldItemId], -6, -18, 18, 18);
            }
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

        isPreviewWalking = false;
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
        staticPreviewDrawn = false;
        if (typeof window !== 'undefined') window.staticPreviewDrawn = false;
        renderStaticPlayerPreview();
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
            const activeTreeWood = (typeof window !== 'undefined' && window.nonCollidableTreeWood) ? window.nonCollidableTreeWood : nonCollidableTreeWood;
            return !activeTreeWood.has(`${x}_${y}`);
        }
        return true;
    }

    export function isNonSurfaceBlock(block) {
        if (block === undefined || block === IDS.AIR) return true;
        if (block === IDS.LEAVES || block === IDS.JUNGLE_LEAVES) return true;
        if (block === IDS.WOOD || block === IDS.JUNGLE_WOOD) return true;
        if (block === IDS.SAPLING || block === IDS.JUNGLE_SAPLING) return true;
        if (block === IDS.TORCH || block === IDS.LADDER || block === IDS.SIGN) return true;
        if (block === IDS.SHORT_GRASS || block === IDS.TALL_GRASS) return true;
        if (block === IDS.FLOWER_RED || block === IDS.FLOWER_YELLOW || block === IDS.FERN) return true;
        if (block === IDS.VINES || block === IDS.BAMBOO || block === IDS.CACTUS) return true;
        if (block === IDS.MELON || block === IDS.MELON_STEM || block === IDS.SUNBURST_MELON) return true;
        if (block === IDS.VOID_BERRY_BUSH || block === IDS.PRISM_GLASS) return true;
        if (block >= IDS.WHEAT_STAGE_1 && block <= IDS.WHEAT_STAGE_4) return true;
        if (block >= IDS.DOOR && block <= IDS.DOOR_OPEN_TOP) return true;
        if (block >= IDS.JUNGLE_DOOR && block <= IDS.JUNGLE_DOOR_OPEN_TOP) return true;
        return false;
    }

    export function getFluidKey(x, y) { return `${x}_${y}`; }

    export function getChestKey(x, y) { return `${x}_${y}`; }
    export function isChestPairedWithLeft(cx, cy) {
        if (cx <= 0 || !world || !world[cx - 1] || world[cx - 1][cy] !== IDS.CHEST) return false;
        return !isChestPairedWithLeft(cx - 1, cy);
    }
    export function getChestGroup(x, y) {
        let neighbors = [[x, y]];
        if (isChestPairedWithLeft(x, y)) {
            neighbors = [[x - 1, y], [x, y]];
        } else if (x < WORLD_WIDTH - 1 && world[x + 1]?.[y] === IDS.CHEST) {
            neighbors = [[x, y], [x + 1, y]];
        }
        if (typeof window !== 'undefined' && window.chests && window.chests instanceof Map) {
            if (chests.size === 0 && window.chests.size > 0) {
                chests = window.chests;
            } else if (window.chests !== chests) {
                for (const [k, v] of window.chests.entries()) {
                    if (!chests.has(k)) chests.set(k, v);
                }
            }
        }
        const key = neighbors.map(([cx, cy]) => getChestKey(cx, cy)).sort()[0];
        const targetSize = neighbors.length > 1 ? 54 : 27;
        const existingGroups = neighbors.map(([cx, cy]) => chests.get(getChestKey(cx, cy))).filter(Boolean);
        if (existingGroups.length > 1) {
            const mergedItems = existingGroups.flatMap(group => group.items || []).slice(0, 54);
            chests.set(key, { items: mergedItems.length ? mergedItems : new Array(54).fill(null) });
            neighbors.forEach(([cx, cy]) => { const neighborKey = getChestKey(cx, cy); if (neighborKey !== key) chests.delete(neighborKey); });
        } else if (!chests.has(key) && existingGroups.length === 1) {
            chests.set(key, { items: existingGroups[0].items ? [...existingGroups[0].items] : new Array(targetSize).fill(null) });
        }
        if (!chests.has(key)) chests.set(key, { items: new Array(targetSize).fill(null) });
        if (typeof window !== 'undefined') window.chests = chests;
        const chest = chests.get(key);
        while (chest.items.length < targetSize) chest.items.push(null);
        if (chest.items.length > targetSize) chest.items.length = targetSize;
        return { key, chest, size: targetSize };
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
        const fl = fluids.get(getFluidKey(x, y));
        if (fl) return fl;
        if (typeof world !== 'undefined' && world && world[x]) {
            const b = world[x][y];
            if (b === IDS.WATER) return { type: IDS.WATER, level: 0, source: true, falling: false, x, y };
            if (b === IDS.LAVA) return { type: IDS.LAVA, level: 0, source: true, falling: false, x, y };
        }
        return null;
    }

    export function getFluidFlowVector(gx, gy) {
        if (gx < 0 || gx >= WORLD_WIDTH || gy < 0 || gy >= WORLD_HEIGHT) return { vx: 0, vy: 0 };
        const fl = getFluid(gx, gy);
        if (!fl) return { vx: 0, vy: 0 };
        if (fl.falling) return { vx: 0, vy: 0.35 };
        if (fl.source) return { vx: 0, vy: 0 };

        let vx = 0;
        const left = getFluid(gx - 1, gy);
        const right = getFluid(gx + 1, gy);
        const isWaterCell = fl.type === IDS.WATER;
        const maxFlow = isWaterCell ? WATER_FLOW_MAX : LAVA_FLOW_MAX;

        let leftStrength = 0;
        if (left && left.type === fl.type) {
            if (left.source) leftStrength = maxFlow + 1;
            else if (!left.falling && left.level < fl.level) leftStrength = maxFlow - left.level;
        }

        let rightStrength = 0;
        if (right && right.type === fl.type) {
            if (right.source) rightStrength = maxFlow + 1;
            else if (!right.falling && right.level < fl.level) rightStrength = maxFlow - right.level;
        }

        if (!left && gx > 0 && !isSolidWorldBlock(gx - 1, gy, world[gx - 1]?.[gy])) {
            rightStrength += 1.5;
        }
        if (!right && gx < WORLD_WIDTH - 1 && !isSolidWorldBlock(gx + 1, gy, world[gx + 1]?.[gy])) {
            leftStrength += 1.5;
        }

        vx = (leftStrength - rightStrength) * (isWaterCell ? 0.08 : 0.03);
        return { vx, vy: 0 };
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
            const fragileBlocks = [
                IDS.TORCH, IDS.FLOWER_RED, IDS.FLOWER_YELLOW, IDS.SHORT_GRASS, IDS.TALL_GRASS,
                IDS.SAPLING, IDS.JUNGLE_SAPLING, IDS.FERN, IDS.WHEAT_STAGE_1, IDS.WHEAT_STAGE_2,
                IDS.WHEAT_STAGE_3, IDS.WHEAT_STAGE_4, IDS.MELON_STEM
            ];
            if (fragileBlocks.includes(curBlock)) {
                if (curBlock === IDS.SAPLING || curBlock === IDS.JUNGLE_SAPLING) {
                    saplingGrowthQueue.delete(`${x}_${y}`);
                    saplingBlockedWarnings.delete(`${x}_${y}`);
                }
                if (fluid.type === IDS.WATER) {
                    let dropId = curBlock;
                    if (curBlock === IDS.WHEAT_STAGE_1 || curBlock === IDS.WHEAT_STAGE_2) dropId = IDS.SEEDS;
                    else if (curBlock === IDS.WHEAT_STAGE_3 || curBlock === IDS.WHEAT_STAGE_4) dropId = IDS.WHEAT;
                    else if (curBlock === IDS.MELON_STEM) dropId = IDS.MELON_SEEDS;
                    else if (curBlock === IDS.SHORT_GRASS || curBlock === IDS.TALL_GRASS || curBlock === IDS.FERN) {
                        dropId = Math.random() < 0.2 ? IDS.SEEDS : null;
                    }
                    if (dropId) dropItemForWorld(dropId, x * TILE_SIZE + 10, y * TILE_SIZE + 10, 1);
                } else if (fluid.type === IDS.LAVA) {
                    for (let i = 0; i < 4; i++) {
                        particles.push(new Particle(x * TILE_SIZE + 20, y * TILE_SIZE + 20, '#ff4500'));
                    }
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

    export function wakeAllFluids() {
        if (!fluids || !fluidWakeQueue) return;
        for (const key of fluids.keys()) {
            fluidWakeQueue.add(key);
        }
    }

    export function triggerSteamEffect(x, y) {
        for (let i = 0; i < 7; i++) {
            let p = new Particle(x * TILE_SIZE + 20 + (Math.random() - 0.5) * 16, y * TILE_SIZE + 10, '#d0e8f2');
            p.vy = -1.5 - Math.random() * 2.0;
            p.vx = (Math.random() - 0.5) * 1.5;
            p.life = 25;
            particles.push(p);
        }
        if (typeof playSound === 'function') playSound('fizz');
    }

    export function updateFluids() {
        fluidTick++;
        const waterTick = fluidTick % WATER_FLOW_INTERVAL === 0;
        const lavaTick = fluidTick % LAVA_FLOW_INTERVAL === 0;
        if (!waterTick && !lavaTick && fluidWakeQueue.size === 0) return;

        const toSet = [];
        const toRemove = [];
        const toSolidify = [];

        const pTileX = Math.floor((player?.x || 0) / TILE_SIZE);
        const pTileY = Math.floor((player?.y || 0) / TILE_SIZE);

        // Prune off-screen wake keys so fluidWakeQueue can never retain dormant offscreen cells
        if (fluidWakeQueue.size > 0 && player) {
            for (const wakeKey of fluidWakeQueue) {
                const sep = wakeKey.indexOf('_');
                const wx = parseInt(wakeKey.slice(0, sep), 10);
                if (Math.abs(wx - pTileX) > 80) {
                    fluidWakeQueue.delete(wakeKey);
                }
            }
        }
        if (!waterTick && !lavaTick && fluidWakeQueue.size === 0) return;

        let entries;
        const wakeSet = new Set(fluidWakeQueue);
        if (!waterTick && !lavaTick) {
            // Wake-only tick: only process explicitly awake nearby cells!
            entries = [];
            let count = 0;
            for (const key of fluidWakeQueue) {
                const fl = fluids.get(key);
                if (fl) {
                    entries.push([key, fl]);
                    count++;
                    if (count >= 160) break; // Rate limit wake bursts per physics step
                }
            }
            fluidWakeQueue.clear();
        } else {
            // Periodic tick: snapshot fluids within 80 tiles horizontally of player
            entries = [];
            for (const [key, fl] of fluids) {
                let fx = fl.x;
                if (fx === undefined) {
                    const sep = key.indexOf('_');
                    fx = parseInt(key.slice(0, sep), 10);
                    fl.x = fx;
                    fl.y = parseInt(key.slice(sep + 1), 10);
                }
                if (player && Math.abs(fx - pTileX) > 80) {
                    fluidWakeQueue.delete(key);
                    continue;
                }
                entries.push([key, fl]);
            }
            fluidWakeQueue.clear();
        }

        for (let i = 0; i < entries.length; i++) {
            const [key, fluid] = entries[i];
            const x = fluid.x !== undefined ? fluid.x : parseInt(key.slice(0, key.indexOf('_')), 10);
            const y = fluid.y !== undefined ? fluid.y : parseInt(key.slice(key.indexOf('_') + 1), 10);

            // Proximity culling: Only simulate active fluid flow within 80 tiles horizontally of player
            if (player && Math.abs(x - pTileX) > 80) {
                continue;
            }
            const isWaterCell = fluid.type === IDS.WATER;
            const isLavaCell = fluid.type === IDS.LAVA;
            const isAwake = wakeSet.has(key);

            if (isWaterCell && !waterTick && !isAwake) continue;
            if (isLavaCell && !lavaTick && !isAwake) continue;

            const maxFlow = isWaterCell ? WATER_FLOW_MAX : LAVA_FLOW_MAX;

            // 1. Check drainage for non-source flowing fluid
            if (!fluid.source) {
                let hasFeeder = false;
                const above = getFluid(x, y - 1);
                if (above && above.type === fluid.type) {
                    hasFeeder = true;
                } else {
                    const left = getFluid(x - 1, y);
                    if (left && left.type === fluid.type && (left.source || (!left.falling && (left.level < fluid.level || fluid.falling)))) {
                        hasFeeder = true;
                    }
                    const right = getFluid(x + 1, y);
                    if (right && right.type === fluid.type && (right.source || (!right.falling && (right.level < fluid.level || fluid.falling)))) {
                        hasFeeder = true;
                    }
                }

                if (!hasFeeder) {
                    toRemove.push([x, y]);
                    continue;
                }
            }

            // 2. Downward Flow (Gravity) & Resting / Falling State Transitions
            const belowY = y + 1;
            const isBelowSolid = belowY >= WORLD_HEIGHT || isSolidWorldBlock(x, belowY, world[x]?.[belowY]);
            const belowFluid = getFluid(x, belowY);

            // A landing surface is solid ground directly beneath, or a resting fluid layer of the same type
            const isLandingSurface = isBelowSolid || (belowFluid && belowFluid.type === fluid.type && !belowFluid.falling);

            if (!isBelowSolid) {
                if (!belowFluid) {
                    // Open space directly below: cascade vertically downward as falling stream column
                    const fallLevel = fluid.source ? 1 : fluid.level;
                    toSet.push([x, belowY, { type: fluid.type, source: false, level: fallLevel, falling: true, x, y: belowY }]);
                    // Mid-air falling columns MUST NOT spray horizontally into thin air!
                    continue;
                } else if (belowFluid.type !== fluid.type) {
                    // Vertical contact between Water and Lava
                    if (isWaterCell && belowFluid.type === IDS.LAVA) {
                        // Water above Lava -> Obsidian if lava is source, else Cobblestone
                        const solidId = (belowFluid.source || belowFluid.level === 0) ? IDS.OBSIDIAN : IDS.COBBLESTONE;
                        toSolidify.push([x, belowY, solidId]);
                    } else if (isLavaCell && belowFluid.type === IDS.WATER) {
                        // Lava above Water -> Stone
                        toSolidify.push([x, belowY, IDS.STONE]);
                    }
                    continue;
                } else if (belowFluid.falling) {
                    // Fluid below is still falling downward through open air: continue falling column!
                    continue;
                }
            }

            // When a falling fluid stream strikes solid ground or a resting pool surface, it lands!
            if (fluid.falling && isLandingSurface) {
                toSet.push([x, y, { ...fluid, falling: false }]);
                fluid.falling = false;
            }

            // 3. Horizontal Spread (Forms streams and rivers across surfaces)
            // A fluid cell only spreads horizontally if supported from below (not in free fall) and within max reach
            const canSpreadHorizontally = (fluid.source || (isLandingSurface && !fluid.falling)) && fluid.level < maxFlow;

            if (canSpreadHorizontally) {
                // Flow level increments as distance increases from source, tapering stream height/volume down
                const effectiveLevel = fluid.source ? 0 : fluid.level;
                const nextLevel = effectiveLevel + 1;

                if (nextLevel <= maxFlow) {
                    // --- MINECRAFT SLOPE / DROP-OFF PATHFINDING ---
                    // Search up to 5 blocks (or 3 for lava) for the nearest open ledge / drop-off
                    const searchDist = isWaterCell ? 5 : 3;
                    const getDropDist = (dir) => {
                        for (let step = 1; step <= searchDist; step++) {
                            const cx = x + dir * step;
                            if (cx < 0 || cx >= WORLD_WIDTH) return 999;
                            if (isSolidWorldBlock(cx, y, world[cx]?.[y])) return 999; // Solid wall blocks path
                            // Found an open ledge or drop-off!
                            if (y + 1 < WORLD_HEIGHT && !isSolidWorldBlock(cx, y + 1, world[cx]?.[y + 1])) {
                                return step;
                            }
                        }
                        return 999;
                    };

                    const distLeft = getDropDist(-1);
                    const distRight = getDropDist(1);

                    let allowedDirs;
                    if (distLeft < distRight) {
                        allowedDirs = [-1]; // Nearest drop is to the left: flow ONLY left!
                    } else if (distRight < distLeft) {
                        allowedDirs = [1];  // Nearest drop is to the right: flow ONLY right!
                    } else {
                        allowedDirs = [-1, 1]; // Flat ground, basin, or equal distance: spread both ways!
                    }

                    for (const dir of allowedDirs) {
                        const nx = x + dir;
                        if (nx < 0 || nx >= WORLD_WIDTH) continue;
                        if (isSolidWorldBlock(nx, y, world[nx]?.[y])) continue;

                        const nbrFluid = getFluid(nx, y);
                        const willDropBelow = (y + 1 < WORLD_HEIGHT && !isSolidWorldBlock(nx, y + 1, world[nx]?.[y + 1]));

                        if (!nbrFluid) {
                            toSet.push([nx, y, {
                                type: fluid.type,
                                source: false,
                                level: nextLevel,
                                falling: willDropBelow,
                                x: nx,
                                y: y
                            }]);
                        } else if (nbrFluid.type !== fluid.type) {
                            // Horizontal Water + Lava Reaction
                            if (isWaterCell) {
                                const solidId = (nbrFluid.source || nbrFluid.level === 0) ? IDS.OBSIDIAN : IDS.COBBLESTONE;
                                toSolidify.push([nx, y, solidId]);
                            } else {
                                toSolidify.push([nx, y, IDS.COBBLESTONE]);
                            }
                        } else if (!nbrFluid.source && nbrFluid.level > nextLevel) {
                            toSet.push([nx, y, {
                                type: fluid.type,
                                source: false,
                                level: nextLevel,
                                falling: willDropBelow,
                                x: nx,
                                y: y
                            }]);
                        }
                    }
                }
            }

            // 4. Authentic Minecraft 2-Source Infinite Water Spring
            // An infinite water source ONLY forms if resting horizontally between TWO TRUE SOURCE blocks over solid ground.
            // Flowing streams down slopes or waterfalls NEVER form infinite sources.
            if (isWaterCell && !fluid.source && isBelowSolid && !fluid.falling) {
                const left = getFluid(x - 1, y);
                const right = getFluid(x + 1, y);
                const hasLeftSource = left && left.type === IDS.WATER && left.source;
                const hasRightSource = right && right.type === IDS.WATER && right.source;
                if (hasLeftSource && hasRightSource) {
                    toSet.push([x, y, { type: IDS.WATER, source: true, level: 0, falling: false, x, y }]);
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
            wakeFluidsAround(sx, sy);
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

    export function breakDoorAt(activeWorld, gx, gy) {
        if (!activeWorld || !activeWorld[gx]) return;
        const block = activeWorld[gx][gy];
        if (!isDoorBlock(block)) return;
        const baseY = getDoorBaseY(gy, block);
        const topY = baseY - 1;
        const isJungle = isJungleDoorBlock(block);
        const dropId = isJungle ? IDS.JUNGLE_DOOR : IDS.DOOR;

        activeWorld[gx][baseY] = IDS.AIR;
        if (activeWorld[gx][topY] !== undefined) activeWorld[gx][topY] = IDS.AIR;
        syncBlock(gx, baseY, IDS.AIR);
        if (activeWorld[gx][topY] !== undefined) syncBlock(gx, topY, IDS.AIR);

        playSound('door_break');
        if (typeof dropItemForWorld === 'function') {
            dropItemForWorld(dropId, gx * TILE_SIZE + 4, baseY * TILE_SIZE + 4, 1);
        }
        for (let i = 0; i < 18; i++) {
            particles.push(new Particle(gx * TILE_SIZE + Math.random() * TILE_SIZE, baseY * TILE_SIZE + (Math.random() - 0.5) * TILE_SIZE * 2, '#8b5a2b'));
        }
        floatingTexts.push(new FloatingText(gx * TILE_SIZE + 8, topY * TILE_SIZE - 6, "DOOR BREACHED!", "#ef4444"));
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

        canFitAt(targetX, targetY) {
            const eps = 0.05;
            const activeWorld = this.getActiveWorld();
            if (!activeWorld) return false;
            const curWorldW = activeWorld.length;
            const curWorldH = activeWorld[0]?.length || 0;
            if (!curWorldW || !curWorldH) return false;

            let leftTile = Math.max(0, Math.floor((targetX + eps) / TILE_SIZE));
            let rightTile = Math.min(curWorldW - 1, Math.floor((targetX + this.width - eps) / TILE_SIZE));
            let topTile = Math.max(0, Math.floor((targetY + eps) / TILE_SIZE));
            let bottomTile = Math.min(curWorldH - 1, Math.floor((targetY + this.height - eps) / TILE_SIZE));

            for (let y = topTile; y <= bottomTile; y++) {
                for (let x = leftTile; x <= rightTile; x++) {
                    let block = activeWorld[x]?.[y];
                    if (isSolidWorldBlock(x, y, block)) {
                        let bMinX = x * TILE_SIZE;
                        let bMaxX = (x + 1) * TILE_SIZE;
                        let bMinY = y * TILE_SIZE;
                        let bMaxY = (y + 1) * TILE_SIZE;

                        if (block === IDS.DOOR || block === IDS.DOOR_TOP || block === IDS.JUNGLE_DOOR || block === IDS.JUNGLE_DOOR_TOP) {
                            bMinX = x * TILE_SIZE + 2.5;
                            bMaxX = x * TILE_SIZE + 12.5;
                        }

                        let curLeft = targetX + eps;
                        let curRight = targetX + this.width - eps;
                        let curTop = targetY + eps;
                        let curBottom = targetY + this.height - eps;

                        let isStairRight = (block === IDS.WOODEN_STAIRS_RIGHT || block === IDS.COBBLESTONE_STAIRS_RIGHT);
                        let isStairLeft = (block === IDS.WOODEN_STAIRS || block === IDS.WOODEN_STAIRS_LEFT || block === IDS.COBBLESTONE_STAIRS || block === IDS.COBBLESTONE_STAIRS_LEFT);

                        if (isStairRight || isStairLeft) {
                            let slabMinY = bMinY + TILE_SIZE / 2;
                            let hitSlab = (curRight > bMinX && curLeft < bMaxX && curBottom > slabMinY && curTop < bMaxY);
                            let stepMinX = isStairRight ? bMinX + TILE_SIZE / 2 : bMinX;
                            let stepMaxX = isStairRight ? bMaxX : bMinX + TILE_SIZE / 2;
                            let hitStep = (curRight > stepMinX && curLeft < stepMaxX && curBottom > bMinY && curTop < slabMinY);
                            if (hitSlab || hitStep) return false;
                        } else {
                            if (curRight > bMinX && curLeft < bMaxX && curBottom > bMinY && curTop < bMaxY) {
                                return false;
                            }
                        }
                    }
                }
            }
            return true;
        }

        applyPhysics() {
            if (typeof window !== 'undefined' && window.devCheats?.noclip && (this instanceof Player || (typeof player !== 'undefined' && this === player))) {
                return;
            }
            const wasGrounded = this.isGrounded;
            const prevVy = this.vy;
            if (this.isGrounded) {
                this.fallStartY = this.y;
            } else if (this.vy <= 0) {
                this.fallStartY = Math.min(this.fallStartY ?? this.y, this.y);
            }

            // Fluid physics for non-player entities (Mobs, Animals, Dropped Items)
            if (!(this instanceof Player) && !(typeof player !== 'undefined' && this === player)) {
                const entGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
                const entFootGy = Math.floor((this.y + this.height - 2) / TILE_SIZE);
                const entBodyGy = Math.floor((this.y + this.height / 2) / TILE_SIZE);
                const footFl = getFluid(entGx, entFootGy);
                const bodyFl = getFluid(entGx, entBodyGy);

                const inWater = (footFl?.type === IDS.WATER) || (bodyFl?.type === IDS.WATER);
                const inLava = (footFl?.type === IDS.LAVA) || (bodyFl?.type === IDS.LAVA);

                if (inWater) {
                    this.fallStartY = this.y;
                    this.vx *= 0.86;
                    if (this.vy > 2.0) this.vy = 2.0;
                    const isChicken = (this instanceof Chicken) || this.constructor.name === 'Chicken';
                    const buoyancyFactor = isChicken ? 1.5 : 0.95;
                    this.vy -= GRAVITY * buoyancyFactor;
                    const flow = getFluidFlowVector(entGx, entFootGy);
                    this.vx += flow.vx * 0.7;
                } else if (inLava) {
                    this.fallStartY = this.y;
                    this.vx *= 0.50;
                    this.vy *= 0.55;
                    if (this.vy > 1.2) this.vy = 1.2;
                    this.vy -= GRAVITY * 0.5;
                    if (this.health !== undefined && frameCount % 16 === 0) {
                        if (typeof this.takeDamage === 'function') {
                            this.takeDamage(4, 0);
                        } else if (typeof this.applyMobDamage === 'function') {
                            this.applyMobDamage(4, 0, '#ff4500');
                        }
                        for (let i = 0; i < 3; i++) {
                            particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ff4500'));
                        }
                    }
                }
            }

            this.vy += GRAVITY;
            if (this.vy > TERMINAL_VELOCITY) this.vy = TERMINAL_VELOCITY;

            this.x += this.vx;
            this.handleCollisions(true);

            this.y += this.vy;
            this.isGrounded = false;
            this.handleCollisions(false);

            // Downward slope assist for grounded walking on stairs
            const activeWorldPhys = this.getActiveWorld();
            if (this.isGrounded && Math.abs(this.vx) > 0.1 && this.vy === 0 && activeWorldPhys) {
                const footGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
                const footGy = Math.floor((this.y + this.height + 4) / TILE_SIZE);
                const bUnder = activeWorldPhys[footGx]?.[footGy];
                const isUnderStairs = (bUnder === IDS.WOODEN_STAIRS || bUnder === IDS.WOODEN_STAIRS_LEFT || bUnder === IDS.WOODEN_STAIRS_RIGHT ||
                                       bUnder === IDS.COBBLESTONE_STAIRS || bUnder === IDS.COBBLESTONE_STAIRS_LEFT || bUnder === IDS.COBBLESTONE_STAIRS_RIGHT);
                if (isUnderStairs) {
                    const isRight = (bUnder === IDS.WOODEN_STAIRS_RIGHT || bUnder === IDS.COBBLESTONE_STAIRS_RIGHT);
                    const isLeft = (bUnder === IDS.WOODEN_STAIRS || bUnder === IDS.WOODEN_STAIRS_LEFT ||
                                   bUnder === IDS.COBBLESTONE_STAIRS || bUnder === IDS.COBBLESTONE_STAIRS_LEFT);

                    // Downward slope assist ONLY applies when descending the slope
                    const isDescending = (isRight && this.vx < -0.1) || (isLeft && this.vx > 0.1);
                    if (isDescending) {
                        const bUnderMinX = footGx * TILE_SIZE;
                        const bUnderMinY = footGy * TILE_SIZE;
                        const stepMinX = isRight ? bUnderMinX + TILE_SIZE / 2 : bUnderMinX;
                        const stepMaxX = isRight ? bUnderMinX + TILE_SIZE : bUnderMinX + TILE_SIZE / 2;
                        
                        const curLeft = this.x + 0.05;
                        const curRight = this.x + this.width - 0.05;
                        const onHigh = isRight ? (curRight > stepMinX) : (curLeft < stepMaxX);
                        const targetFloor = onHigh ? bUnderMinY : (bUnderMinY + TILE_SIZE / 2);
                        const dropDist = targetFloor - (this.y + this.height);
                        if (dropDist > 0 && dropDist <= TILE_SIZE / 2 + 4) {
                            const testY = targetFloor - this.height - 0.05;
                            if (this.canFitAt(this.x, testY)) {
                                this.y = testY;
                            }
                        }
                    }
                }
            }

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

        applyMobDamage(amt, knockbackDir, particleColor = '#3b6a2c', knockbackForce = 4.0) {
            if (this.damageCooldown > 0) return false;
            this.health -= amt;
            this.damageCooldown = 15;

            // Difficulty-scaled poise & knockback resistance
            let resistance = 0;
            const diff = (typeof currentDifficulty !== 'undefined') ? currentDifficulty : 'normal';
            if (diff === 'normal') resistance = 0.20;
            else if (diff === 'hard' || diff === 'hardcore') resistance = 0.45;

            if (this.isFrenzied || this.isLunging) {
                resistance += 0.25; // Extra poise during aggressive charge/frenzy
            }
            resistance = Math.min(0.85, resistance);

            const finalForce = Math.max(0.6, (knockbackForce !== undefined ? knockbackForce : 4.0) * (1 - resistance));
            this.vy = -3.0 * (1 - resistance * 0.4);
            this.vx = (knockbackDir || 0) * finalForce;

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
                        if (block === IDS.DOOR || block === IDS.DOOR_TOP || block === IDS.JUNGLE_DOOR || block === IDS.JUNGLE_DOOR_TOP) {
                            bMinX = x * TILE_SIZE + 2.5;
                            bMaxX = x * TILE_SIZE + 12.5;
                        }

                        let curLeft = this.x + (isAxisX ? 0 : eps);
                        let curRight = this.x + this.width - (isAxisX ? 0 : eps);
                        let curTop = this.y + (isAxisX ? eps : 0);
                        let curBottom = this.y + this.height - (isAxisX ? eps : 0);

                        let isStairRight = (block === IDS.WOODEN_STAIRS_RIGHT || block === IDS.COBBLESTONE_STAIRS_RIGHT);
                        let isStairLeft = (block === IDS.WOODEN_STAIRS || block === IDS.WOODEN_STAIRS_LEFT || block === IDS.COBBLESTONE_STAIRS || block === IDS.COBBLESTONE_STAIRS_LEFT);

                        if (isStairRight || isStairLeft) {
                            let slabMinY = bMinY + TILE_SIZE / 2;
                            let hitSlab = (curRight > bMinX && curLeft < bMaxX && curBottom > slabMinY && curTop < bMaxY);
                            let stepMinX = isStairRight ? bMinX + TILE_SIZE / 2 : bMinX;
                            let stepMaxX = isStairRight ? bMaxX : bMinX + TILE_SIZE / 2;
                            let hitStep = (curRight > stepMinX && curLeft < stepMaxX && curBottom > bMinY && curTop < slabMinY);

                            if (hitSlab || hitStep) {
                                if (isAxisX) {
                                    // Smooth step-up assist when walking onto stairs
                                    const moveDir = this.vx;
                                    let targetSurface = null;
                                    if (moveDir > 0) {
                                        if (isStairRight) {
                                            targetSurface = (hitStep || curRight > stepMinX) ? bMinY : slabMinY;
                                        } else {
                                            if (curBottom <= bMinY + 4) targetSurface = bMinY;
                                        }
                                    } else if (moveDir < 0) {
                                        if (isStairLeft) {
                                            targetSurface = (hitStep || curLeft < stepMaxX) ? bMinY : slabMinY;
                                        } else {
                                            if (curBottom <= bMinY + 4) targetSurface = bMinY;
                                        }
                                    }

                                    let stepHeight = targetSurface !== null ? ((this.y + this.height) - targetSurface) : 999;
                                    let canStepUp = false;
                                    if (stepHeight > 0 && stepHeight <= TILE_SIZE / 2 + 4) {
                                        let testTargetY = targetSurface - this.height - 0.05;
                                        if (this.canFitAt(this.x, testTargetY)) {
                                            canStepUp = true;
                                        }
                                    }

                                    if (canStepUp) {
                                        this.y = targetSurface - this.height - 0.05;
                                        this.isGrounded = true;
                                        this.vy = 0;
                                    } else {
                                        if (moveDir > 0) this.x = (hitStep ? stepMinX : bMinX) - this.width - 0.1;
                                        else if (moveDir < 0) this.x = (hitStep ? stepMaxX : bMaxX) + 0.1;
                                        this.vx = 0;
                                    }
                                } else {
                                    let onHigh = isStairRight ? (curRight > stepMinX) : (curLeft < stepMaxX);
                                    let floorY = onHigh ? bMinY : slabMinY;

                                    if (this.vy >= 0) {
                                        this.y = floorY - this.height - 0.05;
                                        this.isGrounded = true;
                                        this.vy = 0;
                                    } else if (this.vy < 0) {
                                        this.y = bMaxY + 0.05;
                                        this.vy = 0;
                                    }
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
            this.life = 6000; // 5-minute lifespan
            this.alive = true;
        }

        update() {
            if (!this.alive) return;
            const itemGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const itemGy = Math.floor((this.y + this.height / 2) / TILE_SIZE);
            const fl = getFluid(itemGx, itemGy);

            if (fl && fl.type === IDS.LAVA) {
                // Incinerate in lava with sizzle and fire particles!
                for (let i = 0; i < 5; i++) {
                    let p = new Particle(this.x + this.width / 2, this.y + this.height / 2, i % 2 === 0 ? '#ff4500' : '#333333');
                    p.vy = -1.5 - Math.random() * 1.5;
                    p.vx = (Math.random() - 0.5) * 2;
                    p.life = 20;
                    particles.push(p);
                }
                const pDist = player ? Math.hypot(player.x - this.x, player.y - this.y) : 999;
                if (pDist < 16 * TILE_SIZE && typeof playSound === 'function') playSound('fizz');
                this.alive = false;
                return;
            }

            if (fl && fl.type === IDS.WATER) {
                // Buoyancy in water: float to surface and get carried by current
                this.fallStartY = this.y;
                this.vx *= 0.86;
                this.vy *= 0.84;
                this.vy -= GRAVITY * 1.35;
                if (this.vy < -2.0) this.vy = -2.0;

                const flow = getFluidFlowVector(itemGx, itemGy);
                this.vx += flow.vx * 1.2;

                const fluidAbove = getFluid(itemGx, itemGy - 1);
                if (!fluidAbove || fluidAbove.type !== IDS.WATER) {
                    const surfaceY = itemGy * TILE_SIZE;
                    if (this.y < surfaceY + 2) {
                        this.y = surfaceY + 2 + Math.sin(frameCount * 0.08 + this.x) * 1.5;
                        if (this.vy < 0) this.vy = 0;
                    }
                }
            }

            this.applyPhysics();
            if (this.isGrounded) this.vx *= 0.8;
            this.life--;
            if (this.life <= 0) this.alive = false;
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
            this.gloomTetherTimer = 0;
            this.gloomBlindTimer = 0;
            this.shadowSwiftTimer = 0;
            this.airborneTicks = 0;
            this.leftShoulderParrot = null;
            this.rightShoulderParrot = null;
        }

        update() {
            if (this.isDead) return;
            if (isSleeping) return;

            // Developer Cheats Hooks
            if (typeof window !== 'undefined' && window.devCheats) {
                if (window.devCheats.godMode) {
                    this.health = this.maxHealth || 20;
                    this.oxygen = this.maxOxygen || 20;
                    this.hunger = 20;
                    this.exhaustion = 0;
                    this.poisonTimer = 0;
                    this.gloomBlindTimer = 0;
                    this.gloomTetherTimer = 0;
                }
                if (window.devCheats.infiniteOxygen) {
                    this.oxygen = this.maxOxygen || 20;
                }
                if (window.devCheats.infiniteHunger) {
                    this.hunger = 20;
                    this.exhaustion = 0;
                }
                if (window.devCheats.noclip) {
                    let mx = 0;
                    let my = 0;
                    let flySpeed = (MOVE_SPEED * 2.5) * (window.devCheats.speedMultiplier || 1.0);
                    const activeKeys = (typeof window !== 'undefined' && window.keys) ? window.keys : (typeof keys !== 'undefined' ? keys : {});
                    if (isActionActive('left') || activeKeys['KeyA'] || activeKeys['ArrowLeft'] || activeKeys['a'] || activeKeys['A']) mx -= 1;
                    if (isActionActive('right') || activeKeys['KeyD'] || activeKeys['ArrowRight'] || activeKeys['d'] || activeKeys['D']) mx += 1;
                    if (isActionActive('jump') || activeKeys['KeyW'] || activeKeys['ArrowUp'] || activeKeys['Space'] || activeKeys['w'] || activeKeys['W'] || activeKeys[' ']) my -= 1;
                    if (isActionActive('down') || isActionActive('sneak') || activeKeys['KeyS'] || activeKeys['ArrowDown'] || activeKeys['ShiftLeft'] || activeKeys['ShiftRight'] || activeKeys['s'] || activeKeys['S']) my += 1;

                    const gpMoveAxis = (typeof window !== 'undefined' && window.GamepadManager && typeof window.GamepadManager.getGamepadMoveAxis === 'function') ? window.GamepadManager.getGamepadMoveAxis() : 0;
                    if (Math.abs(gpMoveAxis) > 0.05) {
                        mx = Math.max(-1.0, Math.min(1.0, gpMoveAxis));
                    }

                    if (isActionActive('sprint') || activeKeys['ControlLeft'] || activeKeys['ControlRight']) {
                        flySpeed *= 1.8;
                    }

                    if (mx < -0.05) this.facingRight = false;
                    else if (mx > 0.05) this.facingRight = true;

                    if (mx !== 0 || my !== 0) {
                        this.walkAnimTime += 0.2;
                        this.walkBlend = Math.min(1.0, this.walkBlend + 0.15);
                    } else {
                        this.walkBlend = Math.max(0, this.walkBlend - 0.1);
                    }

                    if (this.damageCooldown > 0) this.damageCooldown--;
                    this.airborneTicks = 0;
                    this.x += mx * flySpeed;
                    this.y += my * flySpeed;
                    this.vx = 0;
                    this.vy = 0;
                    this.fallStartY = this.y;
                    this.isGrounded = false;
                    this.x = Math.max(0, Math.min((WORLD_WIDTH - 1) * TILE_SIZE, this.x));
                    this.y = Math.max(-500, Math.min((WORLD_HEIGHT + 20) * TILE_SIZE, this.y));
                    return;
                }
            }

            if (this.damageCooldown > 0) this.damageCooldown--;

            // Handle Gloom and Shadow status effects
            const hasGloomLantern = (inventory[selectedHotbarIndex]?.id === IDS.GLOOM_LANTERN || inventory[27]?.id === IDS.GLOOM_LANTERN);
            if (hasGloomLantern) {
                this.gloomBlindTimer = 0;
                if (this.gloomTetherTimer > 0) this.gloomTetherTimer = Math.max(0, this.gloomTetherTimer - 3);
            }

            if (this.gloomTetherTimer > 0) {
                this.gloomTetherTimer--;
                if (frameCount % 10 === 0 && Array.isArray(particles)) {
                    particles.push(new Particle(this.x + Math.random() * this.width, this.y + this.height - 4, '#7c3aed'));
                }
            }

            if (this.gloomBlindTimer > 0) {
                this.gloomBlindTimer--;
            }

            if (this.shadowSwiftTimer > 0) {
                this.shadowSwiftTimer--;
                if (frameCount % 5 === 0 && Array.isArray(particles)) {
                    particles.push(new Particle(this.x + Math.random() * this.width, this.y + this.height - 2, '#c084fc'));
                }
            }

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
                if (this.shadowSwiftTimer > 0) {
                    speedMult *= 1.35;
                }
                if (this.gloomTetherTimer > 0) {
                    speedMult *= 0.55;
                }
                let speedDevMult = (typeof window !== 'undefined' && window.devCheats?.speedMultiplier) ? window.devCheats.speedMultiplier : 1.0;
                let targetVx = moveDir * MOVE_SPEED * speedMult * speedDevMult;
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
                let jumpMult = (typeof window !== 'undefined' && window.devCheats?.highJump) ? 1.8 : 1.0;
                this.vy = JUMP_FORCE * jumpMult;
                this.isGrounded = false;
                this.exhaustion += 0.05 * hungerRate;
            }
            
            const pGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const pFootGy = Math.floor((this.y + this.height - 2) / TILE_SIZE);
            const pWaistGy = Math.floor((this.y + this.height * 0.6) / TILE_SIZE);
            const pChestGy = Math.floor((this.y + this.height * 0.3) / TILE_SIZE);
            const pHeadGy = Math.floor((this.y + 4) / TILE_SIZE);
            const onLadder = isClimbableBlock(world[pGx]?.[pFootGy]) || 
                             isClimbableBlock(world[pGx]?.[pWaistGy]) || 
                             isClimbableBlock(world[pGx]?.[pChestGy]) || 
                             isClimbableBlock(world[pGx]?.[pHeadGy]);

            const footFluid = getFluid(pGx, pFootGy);
            const waistFluid = getFluid(pGx, pWaistGy);
            const chestFluid = getFluid(pGx, pChestGy);
            const headFluid = getFluid(pGx, pHeadGy);
            const inWater = (footFluid?.type === IDS.WATER) || (waistFluid?.type === IDS.WATER) || (chestFluid?.type === IDS.WATER) || (headFluid?.type === IDS.WATER);
            const inLava = (footFluid?.type === IDS.LAVA) || (waistFluid?.type === IDS.LAVA) || (chestFluid?.type === IDS.LAVA) || (headFluid?.type === IDS.LAVA);

            // Water Entry Splash & Fire Extinguishing
            if (!this._wasInWater && inWater) {
                if (this.vy > 2.5) {
                    if (typeof playSound === 'function') playSound('splash', { vol: Math.min(1.0, this.vy / 6) });
                    for (let i = 0; i < 8; i++) {
                        let p = new Particle(this.x + this.width / 2 + (Math.random() - 0.5) * 12, pFootGy * TILE_SIZE + 2, i % 2 === 0 ? '#38bdf8' : '#ffffff');
                        p.vy = -2.0 - Math.random() * 3.5;
                        p.vx = (Math.random() - 0.5) * 4.5;
                        p.size = 2 + Math.random() * 2;
                        p.life = 18;
                        particles.push(p);
                    }
                    this.vy = Math.min(2.0, this.vy * 0.35);
                }
                if (this.burnTimer > 0) {
                    this.burnTimer = 0;
                    if (typeof playSound === 'function') playSound('fizz');
                    triggerSteamEffect(pGx, pFootGy);
                }
            }
            this._wasInWater = inWater;

            if (inWater) {
                this.fallStartY = this.y;
                this.vx *= 0.84;
                const submergedCount = (footFluid?.type === IDS.WATER ? 1 : 0) + (waistFluid?.type === IDS.WATER ? 1 : 0) + (chestFluid?.type === IDS.WATER ? 1 : 0) + (headFluid?.type === IDS.WATER ? 1 : 0);
                
                // Water drag dampens vertical speed. Counteract most of normal gravity so player
                // gently sinks downward (submerges) instead of automatically floating/bobbing up.
                this.vy *= 0.85;
                this.vy -= GRAVITY * 0.72;
                if (this.vy > 1.4) this.vy = 1.4;

                // Flow current pushing player
                const flow = getFluidFlowVector(pGx, waistFluid ? pWaistGy : pFootGy);
                this.vx += flow.vx;
                if (flow.vy) this.vy += flow.vy;

                if (isActionActive('jump')) {
                    if (submergedCount <= 2) {
                        // Surface breach jump: hop cleanly onto land or over 1-block banks
                        this.vy = Math.max(JUMP_FORCE * 0.85, this.vy - 1.2);
                        if (frameCount % 20 === 0 && typeof playSound === 'function') playSound('swim');
                    } else {
                        // Submerged swimming stroke upward
                        this.vy = Math.max(-3.5, this.vy - 0.75);
                        if (frameCount % 20 === 0 && typeof playSound === 'function') playSound('swim');
                    }
                }
                if (isActionActive('down')) {
                    // Diving downwards
                    this.vy = Math.min(2.8, this.vy + 0.65);
                }

                if (advancedGraphics && (Math.abs(this.vx) > 0.4 || Math.abs(this.vy) > 0.4) && frameCount % 6 === 0) {
                    particles.push(new Particle(this.x + this.width / 2 + (Math.random() - 0.5) * 8, this.y + this.height * 0.6, 'rgba(160, 230, 255, 0.75)'));
                }
            } else if (inLava) {
                this.fallStartY = this.y;
                this.burnTimer = 240; // 4 seconds of fire
                this.vx *= 0.45;
                this.vy *= 0.55;
                if (this.vy > 1.2) this.vy = 1.2;
                this.vy -= GRAVITY * 0.55;

                const flow = getFluidFlowVector(pGx, waistFluid ? pWaistGy : pFootGy);
                this.vx += flow.vx * 0.7;

                if (isActionActive('jump')) {
                    this.vy = Math.max(-1.8, this.vy - 0.45);
                }
                if (isActionActive('down')) {
                    this.vy = Math.min(1.4, this.vy + 0.35);
                }
                if (frameCount % 16 === 0) {
                    this.takeDamage(4);
                    if (typeof playSound === 'function') playSound('fizz');
                    for (let i = 0; i < 4; i++) {
                        particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ff4500'));
                    }
                }
            }

            // Burn damage tick when outside lava
            if (this.burnTimer > 0 && !inWater) {
                this.burnTimer--;
                if (frameCount % 30 === 0 && !this.isDead) {
                    this.takeDamage(1);
                    if (typeof playSound === 'function') playSound('fizz');
                }
                if (frameCount % 4 === 0) {
                    particles.push(new Particle(this.x + Math.random() * this.width, this.y + Math.random() * this.height, Math.random() < 0.6 ? '#ff4500' : '#ffaa00'));
                }
            }

            const fullySubmerged = headFluid?.type === IDS.WATER && chestFluid?.type === IDS.WATER;
            const previousOxygen = this.oxygen;
            if (fullySubmerged) {
                if (frameCount % 25 === 0) this.oxygen = Math.max(0, this.oxygen - 1);
                if (this.oxygen <= 0 && frameCount % 15 === 0) this.takeDamage(2);
                if (this.oxygen <= 3) this._hadCriticalOxygen = true;
                if (frameCount % 20 === 0) {
                    let bP = new Particle(this.x + this.width / 2 + (Math.random() - 0.5) * 6, this.y + 2, 'rgba(255, 255, 255, 0.85)');
                    bP.vy = -1.2;
                    bP.vx = (Math.random() - 0.5) * 0.4;
                    bP.size = 2;
                    bP.life = 25;
                    particles.push(bP);
                }
            } else {
                if (this._hadCriticalOxygen && this.oxygen >= this.maxOxygen - 0.5) {
                    this._hadCriticalOxygen = false;
                    if (typeof unlockAchievement === 'function') unlockAchievement('deep_diver_breath');
                    else if (typeof window !== 'undefined' && typeof window.unlockAchievement === 'function') window.unlockAchievement('deep_diver_breath');
                }
                this.oxygen = Math.min(this.maxOxygen, this.oxygen + 0.22);
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
                // Keep current phase instead of hard-snapping to a fixed value
                this.walkBlend = Math.max(0.0, (this.walkBlend || 0) - 0.08);
            } else {
                // Fade out blend smoothly; let walkAnimTime keep advancing so
                // limbs ease back naturally rather than snapping to zero.
                this.walkBlend = Math.max(0.0, (this.walkBlend || 0) - 0.12);
                if (this.walkBlend <= 0.01) {
                    this.walkBlend = 0;
                    this.walkAnimTime = 0;
                } else {
                    this.walkAnimTime += 0.06;
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
            if (isSolidWorldBlock(pGx, pHeadGy, headBlock) && !isDoorBlock(headBlock) && headBlock !== IDS.LADDER) {
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
                        if (eatenId === IDS.SUNBURST_MELON_SLICE) {
                            unlockAchievement('solar_nourishment');
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

            // Shoulder parrots dismount if player walks, enters water, or falls/jumps violently
            if (this.leftShoulderParrot || this.rightShoulderParrot) {
                const px = Math.floor((this.x + this.width / 2) / TILE_SIZE);
                const py = Math.floor((this.y + this.height - 2) / TILE_SIZE);
                const inWater = isWater(px, py) || isWater(px, py - 1);
                if (inWater || this.vy > 4.5 || this.vy < -5.5 || Math.abs(this.vx) > 0.4) {
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
            if (typeof window !== 'undefined' && window.devCheats?.godMode) {
                this.health = this.maxHealth || 20;
                this.oxygen = this.maxOxygen || 20;
                return;
            }
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
                if (diff.permadeath) {
                    inventory.fill(null);
                    equippedArmor.fill(null);
                    updateArmorUI();
                }
                updateUI(); STATE = 'DEAD';
                if (isMultiplayer && window.user && currentMpRoom) {
                    syncLocalPlayerState(true);
                }
                if (diff.permadeath && !isMultiplayer) {
                    deleteWorld(currentWorldId, false);
                    const sub = document.getElementById('death-subtitle'); if (sub) sub.innerText = "Hardcore Mode: World Deleted!";
                    const rBtn = document.getElementById('respawn-btn'); if (rBtn) rBtn.classList.add('hidden');
                    const aCont = document.getElementById('death-astral-container'); if (aCont) aCont.classList.add('hidden');
                } else {
                    const sub = document.getElementById('death-subtitle'); if (sub) sub.innerText = "Game Over";
                    const rBtn = document.getElementById('respawn-btn'); if (rBtn) rBtn.classList.remove('hidden');
                    if (typeof setupDeathScreen === 'function') {
                        setupDeathScreen();
                    } else if (typeof window !== 'undefined' && typeof window.setupDeathScreen === 'function') {
                        window.setupDeathScreen();
                    }
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

            // 1. Pickaxe blocks (Stone, Cobblestone, Ores, Furnace, Cobblestone stairs, Void stone brick, Astral infuser)
            if (isPickaxeBlock(targetBlock) || (HARDNESS[targetBlock] >= 100 && !isAxeBlock(targetBlock) && !isShovelBlock(targetBlock))) {
                const requiredTier = getRequiredMiningTier(targetBlock);
                if (requiredTier > 0 && !canHarvestBlock(targetBlock)) {
                    // Penalty if not holding an adequate pickaxe: very slow and drops nothing
                    return 0.1 * Math.pow(0.5, requiredTier - 1);
                }
                if (id === IDS.ASTRAL_PICKAXE) return 24;
                if (id === IDS.DIAMOND_PICKAXE) return 18;
                if (id === IDS.GOLD_PICKAXE) return 12;
                if (id === IDS.IRON_PICKAXE) return 9;
                if (id === IDS.STONE_PICKAXE) return 6;
                if (id === IDS.WOOD_PICKAXE) return 3;
                return 1.0;
            }

            // 2. Axe blocks (Wood, Planks, Wooden stairs, Doors, Chests, Crafting table, Jukebox, Bamboo, Melons, etc.)
            if (isAxeBlock(targetBlock)) {
                // Primary tool: Axe (super fast!)
                if (id === IDS.ASTRAL_AXE) return 24;
                if (id === IDS.DIAMOND_AXE) return 18;
                if (id === IDS.GOLD_AXE) return 12;
                if (id === IDS.IRON_AXE) return 9;
                if (id === IDS.STONE_AXE) return 8;
                if (id === IDS.WOOD_AXE) return 5;

                // Bamboo / Melon: Swords are also effective
                if (targetBlock === IDS.BAMBOO || targetBlock === IDS.MELON || targetBlock === IDS.SUNBURST_MELON) {
                    if (id === IDS.ASTRAL_SWORD) return 18;
                    if (id === IDS.DIAMOND_SWORD) return 14;
                    if (id === IDS.GOLD_SWORD) return 10;
                    if (id === IDS.IRON_SWORD || id === IDS.SHADOWFANG) return 8;
                    if (id === IDS.STONE_SWORD) return 6;
                    if (id === IDS.WOOD_SWORD) return 4;
                }

                // Off-category Pickaxes on wood:
                // Astral pickaxe is faster than hands (~4.0), but NOT super fast (axes have 18-24!)
                if (id === IDS.ASTRAL_PICKAXE) return 4.0;
                if (id === IDS.DIAMOND_PICKAXE) return 2.8;
                if (id === IDS.GOLD_PICKAXE) return 2.2;
                if (id === IDS.IRON_PICKAXE) return 1.8;
                if (id === IDS.STONE_PICKAXE) return 1.4;
                if (id === IDS.WOOD_PICKAXE) return 1.2;

                // Off-category Shovels on wood:
                if (id === IDS.ASTRAL_SHOVEL) return 3.5;
                if (id === IDS.DIAMOND_SHOVEL) return 2.5;
                if (id === IDS.GOLD_SHOVEL) return 2.0;
                if (id === IDS.IRON_SHOVEL) return 1.6;
                if (id === IDS.STONE_SHOVEL) return 1.3;
                if (id === IDS.WOOD_SHOVEL) return 1.1;

                // Swords on standard wood:
                if (id === IDS.ASTRAL_SWORD) return 2.5;
                if (id === IDS.DIAMOND_SWORD) return 2.0;
                if (id === IDS.GOLD_SWORD || id === IDS.IRON_SWORD || id === IDS.SHADOWFANG) return 1.5;
                if (id === IDS.STONE_SWORD || id === IDS.WOOD_SWORD) return 1.2;

                return (id && id >= 100) ? 1.2 : 1.0;
            }

            // 3. Shovel blocks (Dirt, Farmland, Grass, Sand, Snow)
            if (isShovelBlock(targetBlock)) {
                // Primary tool: Shovel (super fast!)
                if (id === IDS.ASTRAL_SHOVEL) return 24;
                if (id === IDS.DIAMOND_SHOVEL) return 18;
                if (id === IDS.GOLD_SHOVEL) return 12;
                if (id === IDS.IRON_SHOVEL) return 9;
                if (id === IDS.STONE_SHOVEL) return 6;
                if (id === IDS.WOOD_SHOVEL) return 4;

                // Off-category Pickaxes on dirt/sand:
                if (id === IDS.ASTRAL_PICKAXE) return 3.2;
                if (id === IDS.DIAMOND_PICKAXE) return 2.4;
                if (id === IDS.GOLD_PICKAXE) return 2.0;
                if (id === IDS.IRON_PICKAXE) return 1.6;
                if (id === IDS.STONE_PICKAXE) return 1.3;
                if (id === IDS.WOOD_PICKAXE) return 1.1;

                // Off-category Axes on dirt/sand:
                if (id === IDS.ASTRAL_AXE) return 3.2;
                if (id === IDS.DIAMOND_AXE) return 2.4;
                if (id === IDS.GOLD_AXE) return 2.0;
                if (id === IDS.IRON_AXE) return 1.6;
                if (id === IDS.STONE_AXE) return 1.3;
                if (id === IDS.WOOD_AXE) return 1.1;

                return (id && id >= 100) ? 1.2 : 1.0;
            }

            // 4. Shears / Foliage blocks (Leaves, Vines, Tall grass, Fern, Berry bush)
            if (isShearsBlock(targetBlock)) {
                if (id === IDS.KINETIC_SHEARS || id === IDS.SHEARS) return 24;
                if (id === IDS.ASTRAL_SWORD) return 15;
                if (id === IDS.DIAMOND_SWORD || id === IDS.SHADOWFANG) return 12;
                if (id === IDS.GOLD_SWORD || id === IDS.IRON_SWORD) return 8;
                if (id === IDS.STONE_SWORD || id === IDS.WOOD_SWORD) return 5;
                if (id === IDS.ASTRAL_AXE || id === IDS.ASTRAL_PICKAXE || id === IDS.ASTRAL_SHOVEL) return 4.0;
                return (id && id >= 100) ? 2.0 : 1.0;
            }

            // 5. General / other blocks (Glass, Cactus, Bed, Torch, etc.)
            if (id === IDS.ASTRAL_PICKAXE || id === IDS.ASTRAL_AXE || id === IDS.ASTRAL_SHOVEL) return 3.5;
            if (id === IDS.DIAMOND_PICKAXE || id === IDS.DIAMOND_AXE || id === IDS.DIAMOND_SHOVEL) return 2.5;
            return (id && id >= 100) ? 1.5 : 1.0;
        }
        
        getWeaponDamage() {
            let item = inventory[selectedHotbarIndex]; if (!item) return 1;
            const dmgMap = {
                [IDS.SHADOWFANG]: 8, [IDS.ASTRAL_SWORD]: 12,
                [IDS.DIAMOND_SWORD]: 10, [IDS.IRON_SWORD]: 8, [IDS.GOLD_SWORD]: 8, [IDS.STONE_SWORD]: 6, [IDS.WOOD_SWORD]: 4,
                [IDS.ASTRAL_AXE]: 9.5, [IDS.DIAMOND_AXE]: 8, [IDS.IRON_AXE]: 7, [IDS.GOLD_AXE]: 6, [IDS.STONE_AXE]: 5, [IDS.WOOD_AXE]: 3,
                [IDS.ASTRAL_PICKAXE]: 5, [IDS.DIAMOND_PICKAXE]: 4, [IDS.IRON_PICKAXE]: 3.5, [IDS.GOLD_PICKAXE]: 3, [IDS.STONE_PICKAXE]: 2.5, [IDS.WOOD_PICKAXE]: 2,
                [IDS.ASTRAL_SHOVEL]: 5.5, [IDS.DIAMOND_SHOVEL]: 4.5, [IDS.IRON_SHOVEL]: 3.5, [IDS.GOLD_SHOVEL]: 3, [IDS.STONE_SHOVEL]: 2.5, [IDS.WOOD_SHOVEL]: 1.5,
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
            this.maxHealth = 15;
            this.damageCooldown = 0;
            this.baseSpeed = MOVE_SPEED * 0.45;
            this.speed = this.baseSpeed;
            this.damage = 2;
            this.facingRight = true;
            this.walkAnimTime = 0;
            this.onFire = false;

            // Smart & Terrifying AI State
            this.isFrenzied = false;
            this.isLunging = false;
            this.lungeWindup = 0;
            this.lungeCooldown = Math.floor(Math.random() * 30);
            this.doorBangTimer = 0;
            this.doorDamageCount = 0;
            this.groanTimer = Math.floor(Math.random() * 200 + 120);
            this.hasAlertedPack = false;
        }

        triggerAlertOnDamage() {
            this.isFrenzied = true;
            if (Math.random() < 0.6) playSound('zombie_roar');

            const diff = (typeof currentDifficulty !== 'undefined') ? currentDifficulty : 'normal';
            let packRadius = 16;
            if (diff === 'easy') packRadius = 8;
            else if (diff === 'hard' || diff === 'hardcore') packRadius = 24;

            const entList = (typeof entities !== 'undefined' && Array.isArray(entities)) ? entities : [];
            for (const e of entList) {
                if (e instanceof Zombie && e !== this && e.health > 0) {
                    if (Math.hypot(e.x - this.x, e.y - this.y) < packRadius * TILE_SIZE) {
                        e.isFrenzied = true;
                    }
                }
            }
        }

        checkClosedDoorAhead(stepDir) {
            const activeWorld = this.getActiveWorld();
            if (!activeWorld) return null;
            const curWorldW = activeWorld.length;
            const checkX = Math.floor((this.x + this.width / 2 + stepDir * (this.width / 2 + 6)) / TILE_SIZE);
            if (checkX < 0 || checkX >= curWorldW) return null;
            const footY = Math.floor((this.y + this.height - 4) / TILE_SIZE);
            const waistY = Math.floor((this.y + this.height * 0.5) / TILE_SIZE);

            const bFoot = activeWorld[checkX]?.[footY];
            const bWaist = activeWorld[checkX]?.[waistY];

            if (isDoorBlock(bFoot) && !isOpenDoorBlock(bFoot)) return { gx: checkX, gy: footY };
            if (isDoorBlock(bWaist) && !isOpenDoorBlock(bWaist)) return { gx: checkX, gy: waistY };
            return null;
        }

        checkSmartZombieJump(target, stepDir) {
            if (!this.isGrounded || this.vx === 0) return;
            const activeWorld = this.getActiveWorld();
            if (!activeWorld) return;
            const curWorldW = activeWorld.length;
            const checkX = Math.floor((this.x + this.width / 2 + stepDir * (this.width / 2 + 6)) / TILE_SIZE);
            if (checkX < 0 || checkX >= curWorldW) return;

            const footY = Math.floor((this.y + this.height - 4) / TILE_SIZE);
            const headY = Math.floor((this.y + 4) / TILE_SIZE);
            const above1Y = headY - 1;
            const above2Y = headY - 2;

            const bFoot = activeWorld[checkX]?.[footY];
            const bHead = activeWorld[checkX]?.[headY];
            const bAbove1 = (above1Y >= 0) ? activeWorld[checkX]?.[above1Y] : IDS.AIR;
            const bAbove2 = (above2Y >= 0) ? activeWorld[checkX]?.[above2Y] : IDS.AIR;

            // 1-block obstacle: block at foot level, open clearance at head level
            if (isSolidWorldBlock(checkX, footY, bFoot) && !isSolidWorldBlock(checkX, headY, bHead)) {
                this.vy = JUMP_FORCE;
                this.isGrounded = false;
                return;
            }

            // 2-block obstacle / high ledge: both foot and head level solid, but clearance above; vault if target elevated
            if (target && target.y < this.y - TILE_SIZE * 0.8) {
                if (isSolidWorldBlock(checkX, footY, bFoot) && isSolidWorldBlock(checkX, headY, bHead) && !isSolidWorldBlock(checkX, above1Y, bAbove1) && !isSolidWorldBlock(checkX, above2Y, bAbove2)) {
                    this.vy = -6.2; // High vault jump
                    this.vx = stepDir * this.speed * 1.25;
                    this.isGrounded = false;
                    return;
                }
            }
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
                    if (frameCount % 3 === 0) {
                        particles.push(new Particle(this.x + Math.random() * this.width, this.y + Math.random() * this.height * 0.85, Math.random() < 0.55 ? '#ff6600' : '#ffaa00'));
                        particles.push(new Particle(this.x + Math.random() * this.width, this.y + Math.random() * this.height * 0.6, '#ff4400'));
                    }
                    if (frameCount % 6 === 0) {
                        particles.push(new Particle(this.x + this.width / 2 + (Math.random() - 0.5) * this.width, this.y - 4, '#cccccc'));
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

            if (this.lungeCooldown > 0) this.lungeCooldown--;

            // Ambient creepy groaning sound
            if (!this.onFire) {
                this.groanTimer--;
                if (this.groanTimer <= 0) {
                    this.groanTimer = Math.floor(Math.random() * 320 + 200);
                    const curP = (typeof player !== 'undefined') ? player : null;
                    if (curP && Math.hypot(curP.x - this.x, curP.y - this.y) < TILE_SIZE * 18) {
                        playSound('zombie_groan');
                    }
                }
            }

            let target = getZombieTarget(this);
            const diff = (typeof currentDifficulty !== 'undefined') ? currentDifficulty : 'normal';

            if (target) {
                let distX = (target.x + target.width / 2) - (this.x + this.width / 2);
                let distY = (target.y + target.height / 2) - (this.y + this.height / 2);
                let absDist = Math.abs(distX);
                let totalDist = Math.hypot(distX, distY);
                let stepDir = distX > 0 ? 1 : -1;

                if (totalDist < TILE_SIZE * 20) {
                    // Check if blocked by a closed wooden door in target direction
                    const doorInfo = this.checkClosedDoorAhead(stepDir);
                    const doorCenterX = doorInfo ? (doorInfo.gx + 0.5) * TILE_SIZE : 0;
                    const targetOnOtherSide = doorInfo && ((this.x < doorCenterX && target.x > doorCenterX) || (this.x > doorCenterX && target.x < doorCenterX));

                    if (doorInfo && targetOnOtherSide) {
                        this.vx = 0;
                        this.doorBangTimer++;
                        if (this.doorBangTimer % 20 === 0) {
                            playSound('door_bang');
                            for (let i = 0; i < 4; i++) {
                                particles.push(new Particle(doorInfo.gx * TILE_SIZE + 6, doorInfo.gy * TILE_SIZE + 10, '#8b5a2b'));
                            }
                            if (diff === 'normal' || diff === 'hard' || diff === 'hardcore') {
                                this.doorDamageCount++;
                                const neededHits = (diff === 'hard' || diff === 'hardcore') ? 22 : 45;
                                if (this.doorDamageCount >= neededHits) {
                                    breakDoorAt(world, doorInfo.gx, doorInfo.gy);
                                    this.doorDamageCount = 0;
                                    this.doorBangTimer = 0;
                                    this.triggerAlertOnDamage();
                                }
                            }
                        }
                        this.applyPhysics();
                        return;
                    } else {
                        this.doorBangTimer = 0;
                    }

                    // Frenzy Trigger: Within 8 blocks or below half health
                    if (absDist < TILE_SIZE * 8 || this.health <= 8) {
                        if (!this.isFrenzied) {
                            this.isFrenzied = true;
                            if (Math.random() < 0.7) playSound('zombie_roar');
                            this.triggerAlertOnDamage();
                        }
                    }

                    // Speed calculation based on Frenzy & Difficulty
                    if (this.isFrenzied) {
                        if (diff === 'hard' || diff === 'hardcore') this.speed = MOVE_SPEED * 0.85;
                        else if (diff === 'normal') this.speed = MOVE_SPEED * 0.72;
                        else this.speed = MOVE_SPEED * 0.55;
                    } else {
                        this.speed = this.baseSpeed;
                    }

                    // Predatory Lunge Initiation
                    if (absDist >= TILE_SIZE * 1.8 && absDist <= TILE_SIZE * 3.6 && Math.abs(distY) < TILE_SIZE * 1.5 && this.isGrounded && this.lungeCooldown <= 0 && this.lungeWindup <= 0) {
                        this.lungeWindup = (diff === 'hard' || diff === 'hardcore') ? 6 : (diff === 'easy' ? 14 : 10);
                        this.lungeCooldown = (diff === 'hard' || diff === 'hardcore') ? 45 : 65;
                        this.vx = 0;
                    }

                    // Lunge Windup execution
                    if (this.lungeWindup > 0) {
                        this.lungeWindup--;
                        this.vx = 0;
                        if (this.lungeWindup === 0) {
                            this.facingRight = (stepDir > 0);
                            const lungeForce = (diff === 'hard' || diff === 'hardcore') ? 5.8 : 4.8;
                            this.vx = stepDir * lungeForce;
                            this.vy = -3.8;
                            this.isGrounded = false;
                            this.isLunging = true;
                            playSound('zombie_roar');
                        }
                    } else if (!this.isLunging) {
                        if (distX > 6) { this.vx = this.speed; this.facingRight = true; }
                        else if (distX < -6) { this.vx = -this.speed; this.facingRight = false; }
                        else { this.vx = 0; }

                        this.checkSmartZombieJump(target, stepDir);
                    }
                } else {
                    this.vx = 0;
                    this.isFrenzied = false;
                }
            } else {
                this.vx = 0;
                this.isFrenzied = false;
            }

            // Ladder / Vine Climbing — mirrors player climb logic
            const zGx  = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const zFootGy = Math.floor((this.y + this.height - 2) / TILE_SIZE);
            const zBodyGy = Math.floor((this.y + this.height / 2) / TILE_SIZE);
            const zHeadGy = Math.floor((this.y + 4) / TILE_SIZE);
            const zOnClimbable = isClimbableBlock(world[zGx]?.[zFootGy]) ||
                                  isClimbableBlock(world[zGx]?.[zBodyGy]) ||
                                  isClimbableBlock(world[zGx]?.[zHeadGy]);
            if (zOnClimbable) {
                if (target) {
                    const targetMidY = target.y + target.height / 2;
                    const selfMidY   = this.y + this.height / 2;
                    if (targetMidY < selfMidY - TILE_SIZE * 0.5) {
                        this.vy = -this.speed * 0.85;
                    } else if (targetMidY > selfMidY + TILE_SIZE * 0.5) {
                        this.vy = this.speed * 0.85;
                    } else {
                        this.vy = 0;
                    }
                } else {
                    this.vy = Math.min(this.vy, 0);
                }
            }

            const prevX = this.x;
            this.applyPhysics();
            const actualMoved = Math.abs(this.x - prevX);

            if (this.isGrounded && this.isLunging) {
                this.isLunging = false;
            }

            if (actualMoved > 0.05 && this.isGrounded) {
                this.walkAnimTime += (this.isFrenzied ? 0.32 : 0.18);
            } else {
                this.walkAnimTime = 0;
            }

            // Attack contact with target
            if (target && this.x < target.x + target.width && this.x + this.width > target.x &&
                this.y < target.y + target.height && this.y + this.height > target.y) {
                const strikeDamage = this.isLunging ? (this.damage + 1) : this.damage;
                if (target.isRemote) {
                    damageRemotePlayer(target.id, strikeDamage);
                } else {
                    player.takeDamage(strikeDamage);
                    if (this.isLunging) {
                        player.vx = (this.facingRight ? 5 : -5);
                        player.vy = -3;
                    }
                }
                if (this.isLunging) this.isLunging = false;
            }
        }

        takeDamage(amt, knockbackDir, knockbackForce = 4.0) {
            const damaged = this.applyMobDamage(amt, knockbackDir, '#3b6a2c', knockbackForce);
            if (damaged && this.health > 0) {
                this.triggerAlertOnDamage();
            }
            return damaged;
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
                // Red hit-flash (takes priority over fire tint)
                ctx.filter = 'sepia(1) saturate(8) hue-rotate(315deg) brightness(0.95)';
                if (Math.floor(frameCount / 4) % 2 === 0) ctx.globalAlpha = 0.75;
            } else if (this.onFire) {
                // Orange fire-burning tint — visually distinct from red hit flash
                ctx.filter = 'sepia(1) saturate(14) hue-rotate(0deg) brightness(1.15)';
                ctx.globalAlpha = 0.88 + Math.sin(frameCount * 0.4) * 0.12;
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

            // 1. Back Arm (Outstretched forward with aggressive elevation in frenzy/lunge)
            ctx.save();
            ctx.translate(6 * sX + 2 * sX, 8 * sY + 2 * sY);
            const reachAngle = (this.isFrenzied || this.isLunging) ? (-Math.PI / 2 - 0.24) : (-Math.PI / 2 + 0.12);
            ctx.rotate(reachAngle + armBob);
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

            // 4. Head (8x8 rotting green zombie face, hair & piercing glowing eyes)
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

            // Glowing Eyes: Crimson/Amber Bioluminescent Eyes in darkness or when frenzied/lunging!
            const isNightOrDark = (typeof timeOfDay !== 'undefined' && (timeOfDay >= 0.58 && timeOfDay <= 0.90));
            const isDeepUnderground = this.y > (WORLD_HEIGHT * 0.40 * TILE_SIZE);
            if (this.isFrenzied || this.isLunging || isNightOrDark || isDeepUnderground) {
                ctx.save();
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 6;
                ctx.fillStyle = (frameCount % 16 < 8 && this.isFrenzied) ? '#ff2222' : '#dc2626';
                ctx.fillRect(1.5 * sX, 3.5 * sY, 1.5 * sX, 1.5 * sY);
                ctx.fillRect(5.5 * sX, 3.5 * sY, 1.5 * sX, 1.5 * sY);
                ctx.fillStyle = '#fef08a';
                ctx.fillRect(2 * sX, 4 * sY, 0.7 * sX, 0.7 * sY);
                ctx.fillRect(6 * sX, 4 * sY, 0.7 * sX, 0.7 * sY);
                ctx.restore();
            } else {
                // Eye gleam / pupil
                ctx.fillStyle = '#2d4d1f';
                ctx.fillRect(2 * sX, 3 * sY, 1 * sX, 1 * sY);
                ctx.fillRect(6 * sX, 3 * sY, 1 * sX, 1 * sY);
            }

            // Snarling jaw with rotting teeth when frenzied / lunging
            if (this.isFrenzied || this.isLunging) {
                ctx.fillStyle = '#101c0c';
                ctx.fillRect(2 * sX, 5.5 * sY, 4 * sX, 2.5 * sY);
                ctx.fillStyle = '#fef08a';
                ctx.fillRect(2.5 * sX, 5.5 * sY, 1 * sX, 1 * sY);
                ctx.fillRect(4.5 * sX, 5.5 * sY, 1 * sX, 1 * sY);
                ctx.fillRect(3.5 * sX, 7 * sY, 1 * sX, 1 * sY);
            } else {
                ctx.fillStyle = skinRot;
                ctx.fillRect(3 * sX, 4 * sY, 2 * sX, 2 * sY);
                ctx.fillRect(2 * sX, 6 * sY, 4 * sX, 1 * sY);
                ctx.fillStyle = '#101c0c';
                ctx.fillRect(3 * sX, 6 * sY, 2 * sX, 1 * sY);
            }
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

            // 6. Front Arm (Outstretched forward reaching aggressively toward player!)
            ctx.save();
            ctx.translate(6 * sX + 2 * sX, 8 * sY + 2 * sY);
            const frontReachAngle = (this.isFrenzied || this.isLunging) ? (-Math.PI / 2 - 0.38) : (-Math.PI / 2 - 0.08);
            ctx.rotate(frontReachAngle + armBob);
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
            const curWorldW = activeWorld.length;
            const curH = activeWorld[0]?.length || WORLD_HEIGHT;

            // Check 1 tile and 2 tiles ahead in the movement direction
            for (let step = 1; step <= 2; step++) {
                const checkX = Math.floor((this.x + this.width / 2 + dir * (this.width / 2 + step * 10)) / TILE_SIZE);
                if (checkX < 0 || checkX >= curWorldW) return true;

                const footY = Math.floor((this.y + this.height - 4) / TILE_SIZE);
                const bodyY = Math.floor((this.y + 4) / TILE_SIZE);

                // Water or lava ahead at head, body, feet, or just above
                for (let ty = bodyY - 1; ty <= footY; ty++) {
                    if (isWater(checkX, ty, this) || isLava(checkX, ty, this) || getFluid(checkX, ty)) return true;
                }
                if (activeWorld[checkX]?.[footY] === IDS.CACTUS || activeWorld[checkX]?.[bodyY] === IDS.CACTUS) return true;

                // Step down or drop into fluid (animals strictly avoid water and lava drops)
                for (let dy = 1; dy <= 4; dy++) {
                    const testY = footY + dy;
                    if (testY >= curH) break;
                    if (isWater(checkX, testY, this) || isLava(checkX, testY, this) || getFluid(checkX, testY)) return true;
                    if (isSolidWorldBlock(checkX, testY, activeWorld[checkX]?.[testY])) break;
                }
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
                // Fluid below is a hazard: animals MUST NOT jump into water or lava!
                if (isWater(checkX, testY, this) || isLava(checkX, testY, this) || getFluid(checkX, testY)) return true;
                if (isSolidWorldBlock(checkX, testY, activeWorld[checkX]?.[testY])) break;
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
            const currentlyInLava = isLava(curX, curFootY, this) || isLava(curX, curBodyY, this);

            if (currentlyInLava) {
                this.panic = true;
                this.panicTimer = 180;
                this.vy = -3.2;
                this.vx = (Math.random() > 0.5 ? 1 : -1) * 3.5;
            }

            if (currentlyInWater) {
                // Smooth swimming physics: gentle buoyant rise to surface instead of violent 60fps bouncing
                if (this.vy > 0) this.vy *= 0.55;
                this.vy = Math.max(-1.4, this.vy - 0.35);
                this.fallStartY = this.y;

                let leftLand = -1;
                let rightLand = -1;
                for (let d = 1; d <= 16; d++) {
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
                this.speed = this.baseSpeed * 0.9;
                this.vx = this.dir * this.speed;

                // Hop smoothly up onto dry shore
                const checkLandX = Math.floor((this.x + this.width / 2 + this.dir * (this.width / 2 + 5)) / TILE_SIZE);
                if (checkLandX >= 0 && checkLandX < curWorldW) {
                    const blockAtShore = activeWorld?.[checkLandX]?.[curFootY];
                    if (isSolidWorldBlock(checkLandX, curFootY, blockAtShore) && !isWater(checkLandX, curFootY - 1)) {
                        this.vy = -3.8;
                        this.isGrounded = false;
                    }
                }
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
                            
                            if (this.hasHazardAhead(this.dir) || this.hasLethalDropAhead(this.dir)) {
                                this.vx = 0;
                            } else if (dist > 65) {
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

        findNearbyTreeLeaf(searchRadiusTiles = 12) {
            const activeWorld = this.getActiveWorld();
            if (!activeWorld) return null;
            const curWorldW = activeWorld.length;
            const curWorldH = activeWorld[0]?.length || WORLD_HEIGHT;
            const curGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const curGy = Math.floor((this.y + this.height / 2) / TILE_SIZE);

            const radX = Math.min(10, searchRadiusTiles);
            const radY = 8;
            const minX = Math.max(2, curGx - radX);
            const maxX = Math.min(curWorldW - 3, curGx + radX);
            const minY = Math.max(2, curGy - radY);
            const maxY = Math.min(curWorldH - 3, curGy + radY);

            let bestSpot = null;
            let bestDistSq = Infinity;

            for (let x = minX; x <= maxX; x++) {
                if (!activeWorld[x]) continue;
                for (let y = minY; y <= maxY; y++) {
                    if (activeWorld[x][y] === IDS.LEAVES || activeWorld[x][y] === IDS.JUNGLE_LEAVES) {
                        if (activeWorld[x][y - 1] === IDS.AIR) {
                            const dx = x - curGx;
                            const dy = y - curGy;
                            const distSq = dx * dx + dy * dy;
                            if (distSq < bestDistSq) {
                                bestDistSq = distSq;
                                bestSpot = { x, y };
                                if (distSq < 16) return bestSpot;
                            }
                        }
                    }
                }
            }
            return bestSpot;
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

        findNearbyTreeLeaf(searchRadiusTiles = 12) {
            const activeWorld = this.getActiveWorld();
            if (!activeWorld) return null;
            const curWorldW = activeWorld.length;
            const curWorldH = activeWorld[0]?.length || WORLD_HEIGHT;
            const curGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const curGy = Math.floor((this.y + this.height / 2) / TILE_SIZE);

            const radX = Math.min(10, searchRadiusTiles);
            const radY = 8;
            const minX = Math.max(2, curGx - radX);
            const maxX = Math.min(curWorldW - 3, curGx + radX);
            const minY = Math.max(2, curGy - radY);
            const maxY = Math.min(curWorldH - 3, curGy + radY);

            let bestSpot = null;
            let bestDistSq = Infinity;

            for (let x = minX; x <= maxX; x++) {
                if (!activeWorld[x]) continue;
                for (let y = minY; y <= maxY; y++) {
                    const block = activeWorld[x][y];
                    if (block === IDS.JUNGLE_LEAVES || block === IDS.LEAVES) {
                        if (activeWorld[x][y - 1] === IDS.AIR) {
                            const dx = x - curGx;
                            const dy = y - curGy;
                            const distSq = dx * dx + dy * dy;
                            if (distSq < bestDistSq) {
                                bestDistSq = distSq;
                                bestSpot = { x, y };
                                if (distSq < 16) return bestSpot;
                            }
                        }
                    }
                }
            }
            return bestSpot;
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
                const isPlayerAFK = curPlayer.isGrounded && Math.abs(curPlayer.vx) < 0.25 && !isPlayerInWater && Math.abs(curPlayer.vy) < 0.8;

                // Stuck / Left Behind Teleportation Detection:
                if (this.stuckTimer === undefined) this.stuckTimer = 0;
                if (this.lastCheckPos === undefined) this.lastCheckPos = { x: this.x, y: this.y, timer: 0 };

                this.lastCheckPos.timer++;
                if (this.lastCheckPos.timer >= 40) {
                    const distMoved = Math.hypot(this.x - this.lastCheckPos.x, this.y - this.lastCheckPos.y);
                    if (distMoved < 16 && pDist > 90) {
                        this.stuckTimer += 40;
                    } else {
                        this.stuckTimer = 0;
                    }
                    this.lastCheckPos = { x: this.x, y: this.y, timer: 0 };
                }

                // If parrot is stuck behind blocks or left behind for a few blocks (distance > 240px or stuck > 60 frames)
                if (pDist > 240 || this.stuckTimer >= 60) {
                    const teleportSide = (curPlayer.vx > 0.1 || (curPlayer.facingRight ?? true)) ? -1 : 1;
                    this.x = curPlayer.x + teleportSide * 20;
                    this.y = curPlayer.y - 14;
                    this.vx = 0;
                    this.vy = 0;
                    this.state = 'flying';
                    this.flightTimer = 300;
                    this.isGrounded = false;
                    this.stuckTimer = 0;
                    this.lastCheckPos = { x: this.x, y: this.y, timer: 0 };
                    for (let i = 0; i < 6; i++) {
                        particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, this.getFeatherParticleColor()));
                    }
                    playSound('parrot_chirp', { vol: 0.5 });
                }

                // Shoulder Perching: When player is AFK / idle on the ground, sit on shoulder!
                // When player walks, player dismounts parrot and parrot flies alongside
                if (isPlayerAFK) {
                    const hasOpenShoulder = (!curPlayer.leftShoulderParrot || (!curPlayer.rightShoulderParrot && curPlayer.leftShoulderParrot !== this));
                    if (hasOpenShoulder) {
                        if (pDist < 52) {
                            if (!curPlayer.leftShoulderParrot) {
                                curPlayer.leftShoulderParrot = this;
                                this.isMounted = true;
                                this.mountedShoulder = 'left';
                                this.state = 'ground';
                                this.vx = 0;
                                this.vy = 0;
                                playSound('parrot_chirp', { vol: 0.6 });
                                return;
                            } else if (!curPlayer.rightShoulderParrot && curPlayer.leftShoulderParrot !== this) {
                                curPlayer.rightShoulderParrot = this;
                                this.isMounted = true;
                                this.mountedShoulder = 'right';
                                this.state = 'ground';
                                this.vx = 0;
                                this.vy = 0;
                                playSound('parrot_chirp', { vol: 0.6 });
                                return;
                            }
                        }

                        // Steer toward player's shoulder
                        if (this.state !== 'flying') {
                            this.state = 'flying';
                            this.flightTimer = 200;
                            this.vy = -2.8;
                            this.isGrounded = false;
                        }
                        this.flyTargetX = curPlayer.x + (curPlayer.leftShoulderParrot ? 14 : -14);
                        this.flyTargetY = curPlayer.y - 12;
                    }
                } else {
                    // Player is moving / in water / airborne: fly alongside the player at head/shoulder height
                    if (this.state !== 'flying') {
                        this.state = 'flying';
                        this.flightTimer = 300;
                        this.vy = -3;
                        this.isGrounded = false;
                    }
                    const walkDir = Math.abs(curPlayer.vx) > 0.1 ? (curPlayer.vx > 0 ? -1 : 1) : (this.x < curPlayer.x ? -1 : 1);
                    this.flyTargetX = curPlayer.x + walkDir * 24;
                    this.flyTargetY = curPlayer.y - 12;
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
                    const isPlayerAFK = curPlayer.isGrounded && Math.abs(curPlayer.vx) < 0.25;
                    if (isPlayerAFK) {
                        this.flyTargetX = curPlayer.x + (curPlayer.leftShoulderParrot ? 14 : -14);
                        this.flyTargetY = curPlayer.y - 12;
                    } else {
                        const walkDir = Math.abs(curPlayer.vx) > 0.1 ? (curPlayer.vx > 0 ? -1 : 1) : (this.x < curPlayer.x ? -1 : 1);
                        this.flyTargetX = curPlayer.x + walkDir * 24;
                        this.flyTargetY = curPlayer.y - 12;
                    }
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
            const diff = (typeof currentDifficulty !== 'undefined') ? currentDifficulty : 'normal';
            const maxSwell = (diff === 'hard' || diff === 'hardcore') ? 60 : (diff === 'easy' ? 90 : 75);

            if (target) {
                let dx = (target.x + target.width / 2) - (this.x + this.width / 2);
                let dy = (target.y + target.height / 2) - (this.y + this.height / 2);
                let distToTarget = Math.hypot(dx, dy);

                // Stalker Stealth Logic: Creep slowly when player looks toward it, sprint when player looks away
                const curP = (typeof player !== 'undefined') ? player : null;
                const playerFacesCreeper = curP ? ((curP.facingRight && this.x > curP.x) || (!curP.facingRight && this.x < curP.x)) : false;
                if (playerFacesCreeper && distToTarget > TILE_SIZE * 3.5) {
                    this.speed = MOVE_SPEED * 0.28; // Stalking slow pace in shadows
                } else {
                    this.speed = MOVE_SPEED * 0.48; // Silent aggressive ambush speed
                }

                // Mid-air Drop Ambush: If dropping from above onto the player, prime the fuse mid-air!
                if (!this.isGrounded && this.vy > 1.2 && dy > 0 && Math.abs(dx) < TILE_SIZE * 3.2) {
                    this.swell += 2;
                    if (frameCount % 10 === 0) {
                        particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ffffff'));
                        playSound('creeper_hiss_stalk');
                    }
                }

                // Explode if physically close in BOTH horizontal and vertical dimensions
                if (distToTarget < TILE_SIZE * 2.8 && Math.abs(dy) < TILE_SIZE * 2.5) {
                    this.vx = 0;
                    this.swell++;
                    if (frameCount % 8 === 0) particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ffffff'));
                    if (this.swell >= maxSwell) this.explode();
                } else if (distToTarget < TILE_SIZE * 18 && Math.abs(dy) < TILE_SIZE * 9) {
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

            // Ladder / Vine Climbing
            const cGx     = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const cFootGy  = Math.floor((this.y + this.height - 2) / TILE_SIZE);
            const cBodyGy  = Math.floor((this.y + this.height / 2) / TILE_SIZE);
            const cHeadGy  = Math.floor((this.y + 4) / TILE_SIZE);
            const cOnClimbable = isClimbableBlock(world[cGx]?.[cFootGy]) ||
                                  isClimbableBlock(world[cGx]?.[cBodyGy]) ||
                                  isClimbableBlock(world[cGx]?.[cHeadGy]);
            if (cOnClimbable && target) {
                const targetMidY = target.y + target.height / 2;
                const selfMidY   = this.y + this.height / 2;
                if (targetMidY < selfMidY - TILE_SIZE * 0.5) {
                    this.vy = -this.speed * 0.85;
                } else if (targetMidY > selfMidY + TILE_SIZE * 0.5) {
                    this.vy = this.speed * 0.85;
                } else {
                    this.vy = 0;
                }
            }

            this.applyPhysics();
        }

        explode() {
            this.health = 0;
            let cx = Math.floor((this.x + this.width/2) / TILE_SIZE);
            let cy = Math.floor((this.y + this.height/2) / TILE_SIZE);
            const isNearKael = (gx, gy) => {
                const entList = (typeof entities !== 'undefined' && Array.isArray(entities)) ? entities : (typeof window !== 'undefined' && Array.isArray(window.entities) ? window.entities : []);
                for (const e of entList) {
                    if (e instanceof AtlasExplorer && !e.isDeparted) {
                        const kGx = Math.floor((e.x + e.width / 2) / TILE_SIZE);
                        const kGy = Math.floor((e.y + e.height / 2) / TILE_SIZE);
                        if (Math.hypot(gx - kGx, gy - kGy) <= 3.5) return true;
                    }
                }
                return false;
            };

            const clearExplosionCell = (gx, gy) => {
                if (gx < 0 || gx >= WORLD_WIDTH || gy < 0 || gy >= WORLD_HEIGHT || world[gx][gy] === IDS.AIR) return;
                if (isNearKael(gx, gy)) return;
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

            const diff = (typeof currentDifficulty !== 'undefined') ? currentDifficulty : 'normal';
            let radius = (diff === 'hard' || diff === 'hardcore') ? 4 : (diff === 'easy' ? 2 : 3);

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
                Object.entries(remotePlayers
... [truncated for diff preview]