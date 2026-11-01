// =============================================================================
// WEBCRAFT 2D - CORE CONFIG MODULE (js/core/config.js)
// Zero-dependency leaf module defining display toggles, graphics modes,
// Fabulous graphics settings schema/presets, framerate cap and accent theming.
// =============================================================================

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

export let minimapShape = 'circle';
export function setMinimapShape(shape) {
    minimapShape = shape;
    if (typeof window !== 'undefined') window.minimapShape = shape;
}

export let keepInventory = false;
export function setEngineKeepInventory(val) {
    keepInventory = !!val;
    if (typeof window !== 'undefined') window.keepInventory = keepInventory;
}

export let currentWorldAchievementsEnabled = true;
export function setEngineCurrentWorldAchievementsEnabled(val) {
    currentWorldAchievementsEnabled = !!val;
    if (typeof window !== 'undefined') window.currentWorldAchievementsEnabled = currentWorldAchievementsEnabled;
}

export let whatsNewShownThisLoad = false;
export let whatsNewStartupEnabled = typeof localStorage !== 'undefined' ? localStorage.getItem('swc_whats_new_startup_enabled') !== 'false' : true;

// Backward compatibility window bindings
if (typeof window !== 'undefined') {
    window.graphicsMode = graphicsMode;
    window.advancedGraphics = advancedGraphics;
    window.fabulousGraphics = fabulousGraphics;
    window.fabulousConfig = fabulousConfig;
    window.setEngineGraphicsMode = setEngineGraphicsMode;
    window.setEngineSetting = setEngineSetting;
    window.fpsCap = fpsCap;
    window.setEngineFpsCap = setEngineFpsCap;
    window.getFpsCapText = getFpsCapText;
    window.currentAccentColor = currentAccentColor;
    window.setEngineAccentColor = setEngineAccentColor;
    window.getAccentPalette = getAccentPalette;
    window.minimapShape = minimapShape;
    window.setMinimapShape = setMinimapShape;
    window.keepInventory = keepInventory;
    window.currentWorldAchievementsEnabled = currentWorldAchievementsEnabled;
}


export { graphicsMode as graphicsQuality };
export { graphicsMode as activeGraphicPreset };
export let isDevConsoleOpen = false;
