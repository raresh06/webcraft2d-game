import {
    IDS, ID_NAMES, TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT,
    Player, Zombie, Pig, Chicken, Sheep, Creeper, Scorpion,
    generateWorld, getInitialSpawnPoint, drawCharacter, drawPlayerPreview,
    startPlayerPreviewWalk, ensureDesertScorpions, ensureTreeWoodNonCollidable,
    textures, getPlayerCaveSkyOpacity, getWorldSurfaceY,
    setEngineWorld, setEngineBgWorld, setEnginePlayer, setEngineSurfaceHeights,
    setEngineInventory, setEngineEquippedArmor, setEngineEntities, setEngineFluids,
    setEngineFurnaces, setEngineChests, setEngineDroppedItems, setEngineState,
    setEngineTimeOfDay, setEngineDayCount, setEngineFrameCount, setEngineCurrentWorldId,
    setEngineCurrentDifficulty, setEngineIsMultiplayer, setEngineCurrentMpRoom,
    setEngineCurrentMpWorldName, setEngineRemotePlayers, setEngineIsSleeping,
    setEngineIsBackgroundBuildMode, setMinimapShape, setEngineIsInventoryOpen, setSelectedHotbarIndex as setEngineSelectedHotbarIndex,
    setEngineAccentColor, drawTimeClock, drawPlayerHead,
    buildFullOffscreenMap, renderWorldMapLoop,
    setIsWorldMapOpen, setMapPan, setMapZoom,
    generateMenuWorld, menuWorldInitialized, drawMenuBackground,
    setWorldDimensions, getMaxAnimals,
    getTotalArmorDefense, getArmorDamageReductionRatio, isArmor, getArmorSlotIndex, ensureArmorDurability,
    TOOL_DURABILITY, ARMOR_DURABILITY, FPS_CAP_OPTIONS, diffDescriptions, DIFFICULTIES,
    LATEST_PATCH_NOTES, UPDATE_HISTORY_LOGS
} from './engine.js';

import {
    registerWebcraftAccount, loginWebcraftAccount, loginAsGuest, logoutWebcraftAccount,
    saveUserProfileToCloud, getUserProfileFromCloud
} from './network.js';

export const SKIN_W = 16;
export const SKIN_H = 32;
export let playerSkinData = new Array(SKIN_W * SKIN_H).fill(null);
export let currentUserProfile = null;
export let currentAuthTab = 'signup';
export let authModalHasBeenDismissedThisSession = false;
// =============================================================================
// WEBCRAFT 2D - UI MODULE (ui.js)
// DOM Event Listeners, Inventory, Crafting, Aseprite Skin Maker & Menus
// =============================================================================

export let STATE = 'MENU';
export let timeOfDay = 0;
export let dayCount = 1;
export let frameCount = 0;
export let showClouds = true;
export let showDebug = false;
export let showTutorial = true;
export let autoJumpEnabled = true;
export let introEnabled = typeof localStorage !== 'undefined' ? localStorage.getItem('swc_intro_enabled') !== 'false' : true;
export let graphicsMode = 'advanced';
export let advancedGraphics = true;
export let fabulousGraphics = false;
export let introPhase = 0;
export let introTimer = null;
export let currentWorldId = null;
export let selectedDiffChoice = 'normal';
export let currentDifficulty = 'normal';
export let settingsPreviousState = 'MENU';
export let currentWorldSize = 'small';
export let selectedWorldSizeChoice = 'small';
export let selectedMpWorldSize = 'small';
export let isMultiplayer = false;
export let currentMpRoom = null;
export let currentMpWorldName = null;
export let playerName = '';
export let remotePlayers = {};
export let isSleeping = false;
export let sleepWakeVersion = 0;
export let mpPeerIds = new Set();
export let lastWorldSyncTime = 0;
export let lastWorldStateTimestamp = 0;
export let mpPlayerSyncPending = false;
export let mpPlayerSyncQueued = false;
export let mpWorldSyncPending = false;
export let lastSentSkinData = null;
export let currentAutosaveBroadcastId = null;
export let pendingDropRequest = null;
export let mpUnsubscribers = [];

export let world = null;
export let bgWorld = null;
export let player = null;
export let surfaceHeights = [];
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
export let fluids = new Map();
export let furnaces = [];
export let openedFurnace = null;
export let chests = new Map();
export let openedChest = null;
export let isInventoryOpen = false;
export let hotbarWheelLockUntil = 0;
export let heldItemIndex = -1;
export let heldItemObj = null;
export let heldItemDraggedOutside = false;

export function setSelectedHotbarIndex(idx) {
    selectedHotbarIndex = idx;
    if (typeof setEngineSelectedHotbarIndex === 'function') setEngineSelectedHotbarIndex(idx);
    if (typeof window !== 'undefined') window.selectedHotbarIndex = idx;
    if (typeof window !== 'undefined' && window.setMainSelectedHotbarIndex) {
        window.setMainSelectedHotbarIndex(idx);
    }
}
try { if (typeof window !== 'undefined') window.setSelectedHotbarIndex = setSelectedHotbarIndex; } catch(e) {}

export function setHeldItemObj(obj) {
    heldItemObj = obj;
    if (typeof window !== 'undefined') window.heldItemObj = obj;
    const dragEl = document.getElementById('dragged-item-container');
    const dImg = document.getElementById('dragged-item-img');
    const dCount = document.getElementById('dragged-item-count');
    if (heldItemObj) {
        if (dImg && textures[heldItemObj.id]) dImg.src = textures[heldItemObj.id].src;
        if (dCount) dCount.innerText = heldItemObj.count > 1 ? heldItemObj.count : '';
        if (dragEl) {
            dragEl.style.display = 'block';
            if (typeof window !== 'undefined' && window.mouse && window.mouse.clientX !== undefined) {
                dragEl.style.left = (window.mouse.clientX - 20) + 'px';
                dragEl.style.top = (window.mouse.clientY - 20) + 'px';
            }
        }
    } else {
        if (dragEl) dragEl.style.display = 'none';
    }
    if (typeof window !== 'undefined' && window.setMainHeldItemObj) {
        window.setMainHeldItemObj(obj);
    }
}
try { if (typeof window !== 'undefined') window.setHeldItemObj = setHeldItemObj; } catch(e) {}
export function setUIState(newState) {
    STATE = newState;
    if (typeof window !== 'undefined') window.STATE = newState;
}
try { if (typeof window !== 'undefined') window.setUIState = setUIState; } catch(e) {}
export let nonCollidableTreeWood = new Set();
export let saplingGrowthQueue = new Map();
export let dirtToGrassQueue = new Map();
export let snowRegrowthQueue = new Map();
export let isBackgroundBuildMode = false;
export let keepInventory = false;
export let editingSkinId = null;
export let fpsCap = 60;
export let lastFrameTime = 0;
export let lastRenderTime = 0;
export let whatsNewShownThisLoad = false;
export let whatsNewStartupEnabled = typeof localStorage !== 'undefined' ? (localStorage.getItem('swc_whats_new_startup_enabled') !== 'false') : true;
export let introPhaseLockUntil = 0;
export let hotbarPopupTimeout = null;
export let lastHotbarItemId = null;
export let caveSkyOpacity = 0;
export let currentFps = 60;
export let frameDeltaMs = 16.6;
export let physicsAccumulator = 0;
export let keys = {};
export let mouse = { x: 0, y: 0, clientX: 0, clientY: 0, down: false, rightDown: false, worldX: 0, worldY: 0 };
export let camera = { x: 0, y: 0 };
export let isWorldMapOpen = false;
export let mapPanX = 0;
export let mapPanY = 0;
export let mapZoom = 1;
export let isMapDragging = false;
export let mapDragStartX = 0;
export let mapDragStartY = 0;
export let mapDragOriginPanX = 0;
export let mapDragOriginPanY = 0;
export let mapHoverTileX = -1;
export let mapHoverTileY = -1;
export let mapAnimFrameId = null;
export let mapEventsInitialized = false;

export function startGameplay() {
    if (typeof window !== 'undefined' && typeof window.startGameplay === 'function' && window.startGameplay !== startGameplay) {
        return window.startGameplay();
    }
}
export function pauseGame() {
    if (typeof window !== 'undefined' && typeof window.pauseGame === 'function' && window.pauseGame !== pauseGame) {
        return window.pauseGame();
    }
}
export function resumeGame() {
    if (typeof window !== 'undefined' && typeof window.resumeGame === 'function' && window.resumeGame !== resumeGame) {
        return window.resumeGame();
    }
}
export function closeForegroundScreen() {
    if (typeof window !== 'undefined' && typeof window.closeForegroundScreen === 'function' && window.closeForegroundScreen !== closeForegroundScreen) {
        return window.closeForegroundScreen();
    }
}
export function playSound(type, options = {}) {
    if (typeof window !== 'undefined' && typeof window.playSound === 'function' && window.playSound !== playSound) {
        return window.playSound(type, options);
    }
}
export function syncMultiplayerWorldState(force = false) {
    if (typeof window !== 'undefined' && typeof window.syncMultiplayerWorldState === 'function' && window.syncMultiplayerWorldState !== syncMultiplayerWorldState) {
        return window.syncMultiplayerWorldState(force);
    }
}
export function syncLocalPlayerState(force = false) {
    if (typeof window !== 'undefined' && typeof window.syncLocalPlayerState === 'function' && window.syncLocalPlayerState !== syncLocalPlayerState) {
        return window.syncLocalPlayerState(force);
    }
}
export function isMultiplayerAuthority() {
    if (typeof window !== 'undefined' && typeof window.isMultiplayerAuthority === 'function' && window.isMultiplayerAuthority !== isMultiplayerAuthority) {
        return window.isMultiplayerAuthority();
    }
    return false;
}
export function dropItemForWorld(itemId, x, y, count = 1) {
    if (typeof window !== 'undefined' && typeof window.dropItemForWorld === 'function' && window.dropItemForWorld !== dropItemForWorld) {
        return window.dropItemForWorld(itemId, x, y, count);
    }
}

    export const GAME_VERSION = '0.1.3';
    export const DISPLAY_VERSION = '0.1.3';
    export const GAME_BUILD = 'webcraft2d-beta-0.1.3';

    export function updateVersionLabels() {
        const versionLabel = document.getElementById('game-version-label');
        if (versionLabel) versionLabel.innerText = `Webcraft2D Beta v${DISPLAY_VERSION}`;
    }

    updateVersionLabels();

    export const SPLASH_TEXTS = [
        'Multiplayer!',
        'Now with extra pixels!',
        'Creepers hate this trick!',
        'Mine responsibly!',
        '100% blocky!',
        'Probably not a bug!',
        'Build something weird!',
        'Diamonds await!',
        'The night is watching!',
        'Craft. Explore. Survive.',
        'No trees were harmed!',
        'Powered by redstone-ish code!',
        'Hey Adnana:))))))',
        'Sigma Skibidi 67',
        'Cum the cheama? Bors cu zeama',
        'Shalom Shabbat',
        'What the sigma?!',
        'Bro is cooking in 2D',
        'Rizzing up the villagers!',
        'Fanum tax on your diamonds!',
        'Real and true!',
        'Mewing in the mines!',
        'Only in Ohio!',
        'Chat is this real?!',
        'Go touch some grass blocks!',
        'Creeper behind you? Cap.',
        'Unemployed behavior fr fr',
        '100% brainrot certified!',
        'Main character energy!',
        'Bro got that blocky rizz',
        'Straight bussin, no cap!',
        'POV: You fell 5 blocks',
        'Living rent free in a dirt hut!',
        'NPC behavior!',
        'Valid and based!',
        'Never dig straight down!',
        'Stairs go brrrr!',
        'Climbing the ladder of success!',
        'A certified Webcraft classic!',
        'Crafting table goes hard!',
        'No wifi? Still grinding.',
        'Mining at 3 AM!',
        'Peak 2D gaming!',
        'Built different!',
        'Sheesh!'
    ];
    export let lastSplashText = '';

    export function setRandomSplashText() {
        const splash = document.getElementById('menu-splash');
        if (!splash || SPLASH_TEXTS.length === 0) return;
        let nextSplash = SPLASH_TEXTS[Math.floor(Math.random() * SPLASH_TEXTS.length)];
        while (SPLASH_TEXTS.length > 1 && nextSplash === lastSplashText) {
            nextSplash = SPLASH_TEXTS[Math.floor(Math.random() * SPLASH_TEXTS.length)];
        }
        lastSplashText = nextSplash;
        splash.innerText = nextSplash;
    }

    setRandomSplashText();

    export function showToast(msg, iconHtml = null) {
        const c = document.getElementById('toast-container');
        if (!c) return;
        const t = document.createElement('div');
        t.className = 'toast flex items-center gap-2.5';
        if (iconHtml) {
            t.innerHTML = `${iconHtml}<span>${msg}</span>`;
        } else {
            t.innerText = msg;
        }
        c.appendChild(t);
        setTimeout(() => { if(t.parentElement) t.remove(); }, 3000);
    }


    // ==========================================
    // KEYBINDS & SETTINGS CONFIGURATION
    // ==========================================
    export const DEFAULT_KEYBINDS = {
        left: 'a',
        right: 'd',
        jump: ' ',
        down: 's',
        inventory: 'e',
        map: 'm',
        drop: 'q',
        chat: 't',
        debug: 'f3'
    };

    export let KEYBINDS = Object.assign({}, DEFAULT_KEYBINDS);
    export let rebindingAction = null;
    export let rebindingBtnEl = null;

    export let masterVolume = 0.8;
    export let sfxVolume = 0.8;
    export let uiVolume = 0.5;
    export let isAudioMuted = false;
    export let footstepsEnabled = true;

    export let scrollSensitivity = 1;
    export let invertScrollWheel = false;
    export let hotbarWrapAround = true;
    export let showItemPopups = true;
    export let showScreenShake = true;
    export let showVignette = true;
    export let showHeatShimmer = true;
    export let showBiomeGrading = true;
    export let minimapShape = 'square'; // 'square' | 'circle'

    export const DEFAULT_ACCENT_COLOR = '#ffd34d';
    export let currentAccentColor = DEFAULT_ACCENT_COLOR;
    export let currentAccentName = 'Gold';

    export const ACCENT_PRESETS = {
        '#ffd34d': 'Gold',
        '#00e5ff': 'Diamond',
        '#00e676': 'Emerald',
        '#ff3d00': 'Redstone',
        '#d500f9': 'Amethyst',
        '#ff9100': 'Copper',
        '#2979ff': 'Lapis',
        '#e0e0e0': 'Iron'
    };

    export function hexToRgb(hex) {
        hex = (hex || '').replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        if (hex.length !== 6) return { r: 255, g: 211, b: 77 };
        const num = parseInt(hex, 16);
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }

    export function rgbToHex(r, g, b) {
        const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
        return '#' + [clamp(r), clamp(g), clamp(b)].map(c => c.toString(16).padStart(2, '0')).join('');
    }

    export function adjustBrightness(hex, factor) {
        const { r, g, b } = hexToRgb(hex);
        if (factor > 0) {
            return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor);
        } else {
            return rgbToHex(r * (1 + factor), g * (1 + factor), b * (1 + factor));
        }
    }

    export function getAccentPalette(baseHex) {
        const rgb = hexToRgb(baseHex);
        return {
            base: baseHex,
            light: adjustBrightness(baseHex, 0.45),
            dark: adjustBrightness(baseHex, -0.22),
            darker: adjustBrightness(baseHex, -0.48),
            glow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`
        };
    }

    // Pre-rendered 160x160 pixel-art stepped circular bezel for circular minimap mode
    export const cachedMinimapCircleBezelCanvas = document.createElement('canvas');
    cachedMinimapCircleBezelCanvas.width = 160;
    cachedMinimapCircleBezelCanvas.height = 160;

    export function buildMinimapCircleBezel() {
        if (!cachedMinimapCircleBezelCanvas) return;
        const bezelCtx = cachedMinimapCircleBezelCanvas.getContext('2d');
        bezelCtx.clearRect(0, 0, 160, 160);
        bezelCtx.imageSmoothingEnabled = false;

        const palette = getAccentPalette(currentAccentColor);
        const bCx = 80, bCy = 80;
        const rShadowSq = 80 * 80;
        const rOuterSq = 78 * 78;
        const rInnerSq = 69 * 69;
        const rWellSq = 67 * 67;

        for (let py = -80; py < 80; py += 2) {
            for (let px = -80; px < 80; px += 2) {
                const dSq = px * px + py * py;
                if (dSq <= rShadowSq && dSq >= rWellSq) {
                    let color;
                    if (dSq > rOuterSq) {
                        color = '#080a0c'; // Outermost deep black rim
                    } else if (dSq <= rInnerSq) {
                        color = '#0a0d10'; // Sunken pitch-black well rim
                    } else if (px < -26 && py < -26) {
                        color = palette.light; // Top-left bright accent glint
                    } else if (px + py < -16) {
                        color = palette.base; // Rich accent highlight bevel
                    } else if (px + py < 12 && (px < 0 || py < 0)) {
                        color = palette.dark; // Transition bevel
                    } else if (px + py > 24) {
                        color = '#080a0c'; // Bottom-right deep black shadow
                    } else if (px + py > 12) {
                        color = '#111418'; // Deep charcoal black
                    } else {
                        color = '#1c2127'; // Dark obsidian black body
                    }
                    bezelCtx.fillStyle = color;
                    bezelCtx.fillRect(bCx + px, bCy + py, 2, 2);
                }
            }
        }
    }

    export function applyAccentColor(hex, name = null) {
        if (!hex || !hex.startsWith('#') || (hex.length !== 4 && hex.length !== 7)) {
            hex = DEFAULT_ACCENT_COLOR;
        }
        if (hex.length === 4) {
            hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        }
        hex = hex.toLowerCase();
        currentAccentColor = hex;
        currentAccentName = name || ACCENT_PRESETS[hex] || 'Custom';

        if (typeof window !== 'undefined') {
            window.currentAccentColor = hex;
            if (typeof window.setEngineSetting === 'function') window.setEngineSetting('accentColor', hex);
        }
        if (typeof setEngineAccentColor === 'function') {
            setEngineAccentColor(hex);
        }

        const palette = getAccentPalette(hex);
        const root = typeof document !== 'undefined' ? document.documentElement : null;
        if (root && root.style) {
            root.style.setProperty('--mc-accent-color', palette.base);
            root.style.setProperty('--mc-accent-light', palette.light);
            root.style.setProperty('--mc-accent-dark', palette.dark);
            root.style.setProperty('--mc-accent-darker', palette.darker);
            root.style.setProperty('--mc-accent-glow', palette.glow);
        }

        buildMinimapCircleBezel();

        if (typeof drawTimeClock === 'function') {
            const curTime = (typeof timeOfDay !== 'undefined') ? timeOfDay : ((typeof window !== 'undefined' && window.timeOfDay !== undefined) ? window.timeOfDay : 0.25);
            drawTimeClock(curTime);
        }

        // Update settings button preview
        const preview = document.getElementById('settings-accent-preview');
        if (preview) preview.style.backgroundColor = hex;
        const label = document.getElementById('settings-accent-label');
        if (label) label.innerText = currentAccentName;

        // Update popover inputs
        const nPicker = document.getElementById('accent-native-picker');
        if (nPicker) nPicker.value = hex;
        const hInput = document.getElementById('accent-hex-input');
        if (hInput && document.activeElement !== hInput) hInput.value = hex.toUpperCase();
    }

    export function setCustomAccentColor(val) {
        if (!val) return;
        if (!val.startsWith('#')) val = '#' + val;
        if (val.length === 7) {
            applyAccentColor(val, ACCENT_PRESETS[val.toLowerCase()] || 'Custom');
            saveCurrentSettings();
        }
    }

    export function applyAccentPreset(hex, name) {
        applyAccentColor(hex, name);
        saveCurrentSettings();
    }

    export function resetAccentColor() {
        applyAccentColor(DEFAULT_ACCENT_COLOR, 'Gold');
        saveCurrentSettings();
        showToast('Accent color reset to default Gold.');
    }

    export function toggleAccentColorPicker(e) {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        const pop = document.getElementById('accent-color-popover');
        if (!pop) return;
        const isHidden = pop.classList.contains('hidden');
        if (isHidden) {
            applyAccentColor(currentAccentColor, currentAccentName);
            pop.classList.remove('hidden');
        } else {
            pop.classList.add('hidden');
        }
    }

    export function closeAccentColorPicker() {
        const pop = document.getElementById('accent-color-popover');
        if (pop) pop.classList.add('hidden');
    }

    export function loadSavedSettings() {
        try {
            const rawBinds = localStorage.getItem('webcraft_keybinds');
            if (rawBinds) KEYBINDS = Object.assign({}, DEFAULT_KEYBINDS, JSON.parse(rawBinds));

            const rawSettings = localStorage.getItem('webcraft_settings');
            if (rawSettings) {
                const s = JSON.parse(rawSettings);
                if (s.masterVolume !== undefined) { masterVolume = s.masterVolume; if (typeof window !== 'undefined') window.masterVolume = s.masterVolume; }
                if (s.sfxVolume !== undefined) { sfxVolume = s.sfxVolume; if (typeof window !== 'undefined') window.sfxVolume = s.sfxVolume; }
                if (s.uiVolume !== undefined) { uiVolume = s.uiVolume; if (typeof window !== 'undefined') window.uiVolume = s.uiVolume; }
                if (s.isAudioMuted !== undefined) { isAudioMuted = s.isAudioMuted; if (typeof window !== 'undefined') window.isAudioMuted = s.isAudioMuted; }
                if (s.footstepsEnabled !== undefined) { footstepsEnabled = s.footstepsEnabled; if (typeof window !== 'undefined') window.footstepsEnabled = s.footstepsEnabled; }
                if (s.scrollSensitivity !== undefined) { scrollSensitivity = s.scrollSensitivity; if (typeof window !== 'undefined') window.scrollSensitivity = s.scrollSensitivity; }
                if (s.invertScrollWheel !== undefined) { invertScrollWheel = s.invertScrollWheel; if (typeof window !== 'undefined') window.invertScrollWheel = s.invertScrollWheel; }
                if (s.hotbarWrapAround !== undefined) { hotbarWrapAround = s.hotbarWrapAround; if (typeof window !== 'undefined') window.hotbarWrapAround = s.hotbarWrapAround; }
                if (s.showItemPopups !== undefined) { showItemPopups = s.showItemPopups; if (typeof window !== 'undefined') window.showItemPopups = s.showItemPopups; }
                if (s.showScreenShake !== undefined) { showScreenShake = s.showScreenShake; if (typeof window !== 'undefined') window.showScreenShake = s.showScreenShake; }
                if (s.showVignette !== undefined) { 
                    showVignette = s.showVignette; 
                    if (typeof window !== 'undefined') { window.showVignette = s.showVignette; if (typeof window.setEngineSetting === 'function') window.setEngineSetting('showVignette', s.showVignette); }
                }
                if (s.showHeatShimmer !== undefined) { 
                    showHeatShimmer = s.showHeatShimmer; 
                    if (typeof window !== 'undefined') { window.showHeatShimmer = s.showHeatShimmer; if (typeof window.setEngineSetting === 'function') window.setEngineSetting('showHeatShimmer', s.showHeatShimmer); }
                }
                if (s.showBiomeGrading !== undefined) { 
                    showBiomeGrading = s.showBiomeGrading; 
                    if (typeof window !== 'undefined') { window.showBiomeGrading = s.showBiomeGrading; if (typeof window.setEngineSetting === 'function') window.setEngineSetting('showBiomeGrading', s.showBiomeGrading); }
                }
                if (s.minimapShape !== undefined) { minimapShape = s.minimapShape; if (typeof window !== 'undefined') window.minimapShape = s.minimapShape; }
                if (s.accentColor !== undefined) { currentAccentColor = s.accentColor; if (typeof window !== 'undefined') window.currentAccentColor = s.accentColor; }
                if (s.accentName !== undefined) { currentAccentName = s.accentName; if (typeof window !== 'undefined') window.currentAccentName = s.accentName; }
            }

            const savedGraphicsMode = localStorage.getItem('swc_graphics_mode') || (localStorage.getItem('swc_advanced_graphics') === 'false' ? 'base' : 'advanced');
            if (savedGraphicsMode) {
                graphicsMode = savedGraphicsMode;
                advancedGraphics = (graphicsMode !== 'base');
                fabulousGraphics = (graphicsMode === 'fabulous');
                if (typeof window !== 'undefined') {
                    window.graphicsMode = graphicsMode;
                    window.advancedGraphics = advancedGraphics;
                    window.fabulousGraphics = fabulousGraphics;
                    if (typeof window.setEngineGraphicsMode === 'function') {
                        window.setEngineGraphicsMode(graphicsMode);
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    }

    export function saveCurrentSettings() {
        try {
            localStorage.setItem('webcraft_keybinds', JSON.stringify(KEYBINDS));
            localStorage.setItem('webcraft_settings', JSON.stringify({
                masterVolume: (typeof window !== 'undefined' && window.masterVolume !== undefined) ? window.masterVolume : masterVolume,
                sfxVolume: (typeof window !== 'undefined' && window.sfxVolume !== undefined) ? window.sfxVolume : sfxVolume,
                uiVolume: (typeof window !== 'undefined' && window.uiVolume !== undefined) ? window.uiVolume : uiVolume,
                isAudioMuted: (typeof window !== 'undefined' && window.isAudioMuted !== undefined) ? window.isAudioMuted : isAudioMuted,
                footstepsEnabled: (typeof window !== 'undefined' && window.footstepsEnabled !== undefined) ? window.footstepsEnabled : footstepsEnabled,
                scrollSensitivity,
                invertScrollWheel,
                hotbarWrapAround,
                showItemPopups,
                showScreenShake,
                showVignette,
                showHeatShimmer,
                showBiomeGrading,
                minimapShape,
                accentColor: currentAccentColor,
                accentName: currentAccentName
            }));
        } catch (e) {
            console.error('Failed to save settings', e);
        }
    }

    export function toggleMinimapShape() {
        minimapShape = minimapShape === 'square' ? 'circle' : 'square';
        if (typeof window !== 'undefined') window.minimapShape = minimapShape;
        if (typeof setMinimapShape === 'function') setMinimapShape(minimapShape);
        applyMinimapShape();
        saveCurrentSettings();
    }

    export function applyMinimapShape() {
        if (typeof document === 'undefined') return;
        const curShape = (typeof window !== 'undefined' && window.minimapShape) ? window.minimapShape : minimapShape;
        const isCircle = curShape === 'circle';
        const wrap = document.querySelector('.hud-minimap-wrap');
        const mm = document.getElementById('minimap');
        if (wrap) wrap.classList.toggle('shape-circle', isCircle);
        if (mm) mm.classList.toggle('shape-circle', isCircle);
        const btn = document.getElementById('btn-toggle-minimap-shape');
        if (btn) btn.innerText = isCircle ? "CIRCLE" : "SQUARE";
    }

    export function formatKeyDisplay(keyStr) {
        if (!keyStr) return 'None';
        if (keyStr === ' ') return 'Space';
        if (keyStr === 'arrowleft') return '← Left';
        if (keyStr === 'arrowright') return '→ Right';
        if (keyStr === 'arrowup') return '↑ Up';
        if (keyStr === 'arrowdown') return '↓ Down';
        return keyStr.toUpperCase();
    }

    export function isActionActive(actionName) {
        const boundKey = (KEYBINDS[actionName] || '').toLowerCase();
        const activeKeys = (typeof window !== 'undefined' && window.keys) ? window.keys : keys;
        if (boundKey && activeKeys[boundKey]) return true;

        if (actionName === 'left') return activeKeys['a'] || activeKeys['arrowleft'];
        if (actionName === 'right') return activeKeys['d'] || activeKeys['arrowright'];
        if (actionName === 'jump') return activeKeys[' '] || activeKeys['w'] || activeKeys['arrowup'];
        if (actionName === 'down') return activeKeys['s'] || activeKeys['arrowdown'] || activeKeys['shift'];
        return false;
    }

    if (typeof window !== 'undefined') {
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', () => {
                loadSavedSettings();
                applyMinimapShape();
                applyAccentColor(currentAccentColor, currentAccentName);
            });
        } else {
            loadSavedSettings();
            applyMinimapShape();
            applyAccentColor(currentAccentColor, currentAccentName);
        }
    }

    export let lastUiClickSoundTime = 0;
    document.addEventListener('click', (e) => {
        const btn = e.target && typeof e.target.closest === 'function' && e.target.closest('button, .settings-tab-btn, .btn, .ach-filter-btn, .hotbar-slot, .keybind-btn, .skin-item-card, .world-item, .mc-btn');
        if (btn) {
            const now = performance.now();
            if (now - lastUiClickSoundTime > 60) {
                lastUiClickSoundTime = now;
                playSound('click', { isUI: true, vol: 0.8 });
            }
        }
    }, true);

    export function unlockAudioContextOnGesture() {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
    }
    window.addEventListener('pointerdown', unlockAudioContextOnGesture, { passive: true });
    window.addEventListener('keydown', unlockAudioContextOnGesture, { passive: true });

    document.addEventListener('click', (e) => {
        const pop = document.getElementById('accent-color-popover');
        const btn = document.getElementById('btn-open-accent-picker');
        if (pop && !pop.classList.contains('hidden')) {
            if (!pop.contains(e.target) && (!btn || !btn.contains(e.target))) {
                pop.classList.add('hidden');
            }
        }
    });


    export let activeSkinId = 'default';
    export let skinCanvasObj = (typeof document !== 'undefined') ? (window.skinCanvasObj || document.createElement('canvas')) : null;
    if (skinCanvasObj) { skinCanvasObj.width = SKIN_W; skinCanvasObj.height = SKIN_H; }

    // Redesigned Advanced Default Skin to map neatly to limbs
    export function generateDefaultSkin() {
        if (!playerSkinData) playerSkinData = new Array(SKIN_W * SKIN_H).fill(null);
        playerSkinData.fill(null);
        
        // Head (x: 4-11, y: 0-7)
        for(let y=0; y<8; y++) for(let x=4; x<12; x++) playerSkinData[y*SKIN_W + x] = '#d09f7a'; 
        // Hair
        for(let y=0; y<2; y++) for(let x=4; x<12; x++) playerSkinData[y*SKIN_W + x] = '#4a2c11';
        for(let x=4; x<12; x+=2) playerSkinData[2*SKIN_W + x] = '#4a2c11';
        // Eyes & Mouth
        playerSkinData[4*SKIN_W + 5] = '#fff'; playerSkinData[4*SKIN_W + 6] = '#3333ff';
        playerSkinData[4*SKIN_W + 9] = '#3333ff'; playerSkinData[4*SKIN_W + 10] = '#fff';
        for(let x=6; x<10; x++) playerSkinData[6*SKIN_W + x] = '#885533'; 

        // Torso (x: 4-11, y: 8-19)
        for(let y=8; y<20; y++) {
            for(let x=4; x<12; x++) playerSkinData[y*SKIN_W + x] = '#008888'; 
        }
        // Belt
        for(let x=4; x<12; x++) playerSkinData[19*SKIN_W + x] = '#222222'; 

        // Right Arm (x: 0-3, y: 8-19)
        for(let y=8; y<20; y++) {
            for(let x=0; x<4; x++) playerSkinData[y*SKIN_W + x] = (y<12) ? '#008888' : '#d09f7a';
        }
        
        // Left Arm (x: 12-15, y: 8-19)
        for(let y=8; y<20; y++) {
            for(let x=12; x<16; x++) playerSkinData[y*SKIN_W + x] = (y<12) ? '#008888' : '#d09f7a';
        }

        // Right Leg (x: 4-7, y: 20-31)
        for(let y=20; y<32; y++) {
            for(let x=4; x<8; x++) playerSkinData[y*SKIN_W + x] = (y<30) ? '#333399' : '#444444';
        }
        
        // Left Leg (x: 8-11, y: 20-31)
        for(let y=20; y<32; y++) {
            for(let x=8; x<12; x++) playerSkinData[y*SKIN_W + x] = (y<30) ? '#333399' : '#444444';
        }
    }

    export function getDefaultSkinData() {
        const activeSkin = playerSkinData;
        playerSkinData = new Array(SKIN_W * SKIN_H).fill(null);
        generateDefaultSkin();
        const defaultSkin = playerSkinData.slice();
        playerSkinData = activeSkin;
        return defaultSkin;
    }

    export function getSkinSaveData() {
        if (Array.isArray(playerSkinData) && playerSkinData.length === SKIN_W * SKIN_H) {
            return playerSkinData;
        }
        if (typeof window !== 'undefined' && Array.isArray(window.playerSkinData) && window.playerSkinData.length === SKIN_W * SKIN_H) {
            return window.playerSkinData;
        }
        return playerSkinData;
    }
    try { if (typeof window !== 'undefined') window.getSkinSaveData = getSkinSaveData; } catch(e) {}

    export function getSavedSkins() {
        try {
            const savedSkins = JSON.parse(localStorage.getItem('swc_skins_v1'));
            if (Array.isArray(savedSkins)) return savedSkins.filter(skin => Array.isArray(skin.data) && skin.data.length === SKIN_W * SKIN_H);
            const oldSkin = JSON.parse(localStorage.getItem('swc_skin_v5'));
            if (Array.isArray(oldSkin) && oldSkin.length === SKIN_W * SKIN_H) {
                const migrated = [{ id: 'skin_' + Date.now(), name: 'My Skin', data: oldSkin }];
                localStorage.setItem('swc_skins_v1', JSON.stringify(migrated));
                return migrated;
            }
        } catch (e) {}
        return [];
    }

    export function saveSavedSkins(skins) {
        localStorage.setItem('swc_skins_v1', JSON.stringify(skins));
    }

    export function getActiveSkinId() {
        const savedId = localStorage.getItem('swc_active_skin_v1');
        if (savedId) return savedId;
        const savedSkins = getSavedSkins();
        const matchingSkin = savedSkins.find(skin => JSON.stringify(skin.data) === JSON.stringify(playerSkinData));
        return matchingSkin ? matchingSkin.id : 'default';
    }

    export function renderSkinLibrary() {
        const grid = document.getElementById('skin-grid');
        grid.innerHTML = '';
        activeSkinId = getActiveSkinId();
        const defaultCard = createSkinCard('Default Skin', getDefaultSkinData(), false, 'default');
        grid.appendChild(defaultCard);
        const savedSkins = getSavedSkins();
        savedSkins.forEach(skin => grid.appendChild(createSkinCard(skin.name || 'My Skin', skin.data, true, skin.id)));
        const addCard = document.createElement('button');
        addCard.className = 'skin-card skin-add';
        addCard.type = 'button';
        addCard.innerHTML = '<span class="skin-add-plus">+</span><span class="skin-add-label">Make a skin</span>';
        addCard.onclick = openSkinMaker;
        grid.appendChild(addCard);
    }


    // --- Emerald Currency & Lifetime Achievement Rewards ---
    export function getPixelEmeraldSvg(size = 14) {
        return `<svg class="emerald-pixel-art" viewBox="0 0 16 16" width="${size}" height="${size}" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="5" y="1" width="6" height="1" fill="#0b3d1d"/><rect x="4" y="2" width="1" height="1" fill="#0b3d1d"/><rect x="11" y="2" width="1" height="1" fill="#0b3d1d"/><rect x="3" y="3" width="1" height="1" fill="#0b3d1d"/><rect x="12" y="3" width="1" height="1" fill="#0b3d1d"/><rect x="2" y="4" width="1" height="1" fill="#0b3d1d"/><rect x="13" y="4" width="1" height="1" fill="#0b3d1d"/><rect x="1" y="5" width="1" height="6" fill="#0b3d1d"/><rect x="14" y="5" width="1" height="6" fill="#0b3d1d"/><rect x="2" y="11" width="1" height="1" fill="#0b3d1d"/><rect x="13" y="11" width="1" height="1" fill="#0b3d1d"/><rect x="3" y="12" width="1" height="1" fill="#0b3d1d"/><rect x="12" y="12" width="1" height="1" fill="#0b3d1d"/><rect x="4" y="13" width="1" height="1" fill="#0b3d1d"/><rect x="11" y="13" width="1" height="1" fill="#0b3d1d"/><rect x="5" y="14" width="6" height="1" fill="#0b3d1d"/><rect x="11" y="5" width="3" height="6" fill="#136d33"/><rect x="5" y="13" width="6" height="1" fill="#136d33"/><rect x="10" y="11" width="3" height="2" fill="#136d33"/><rect x="8" y="12" width="3" height="1" fill="#0e5326"/><rect x="5" y="2" width="6" height="1" fill="#1b9549"/><rect x="4" y="4" width="8" height="1" fill="#46f381"/><rect x="3" y="5" width="8" height="6" fill="#17c858"/><rect x="3" y="11" width="7" height="1" fill="#17c858"/><rect x="4" y="12" width="4" height="1" fill="#136d33"/><rect x="5" y="2" width="5" height="1" fill="#a8ffc6"/><rect x="4" y="3" width="3" height="1" fill="#a8ffc6"/><rect x="3" y="4" width="2" height="1" fill="#a8ffc6"/><rect x="2" y="5" width="1" height="3" fill="#a8ffc6"/><rect x="5" y="3" width="3" height="2" fill="#ffffff"/><rect x="4" y="4" width="2" height="1" fill="#ffffff"/><rect x="6" y="5" width="2" height="1" fill="#a8ffc6"/></svg>`;
    }

    export function getPlayerEmeralds() {
        try {
            const val = parseInt(localStorage.getItem('swc_emeralds_v1'), 10);
            return isNaN(val) || val < 0 ? 0 : val;
        } catch (e) {
            return 0;
        }
    }

    export function setPlayerEmeralds(val) {
        try {
            const safeVal = Math.max(0, Math.floor(val));
            localStorage.setItem('swc_emeralds_v1', safeVal.toString());
            updateEmeraldsUI();
            return safeVal;
        } catch (e) {
            return 0;
        }
    }

    export function addPlayerEmeralds(amt) {
        const current = getPlayerEmeralds();
        return setPlayerEmeralds(current + amt);
    }

    export function getClaimedAchievementRewards() {
        try {
            const raw = localStorage.getItem('swc_claimed_achievements_v1');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    export function getAchievementEmeraldReward(ach) {
        if (!ach) return 5;
        if (ach.emeraldReward) return ach.emeraldReward;
        switch (ach.difficulty) {
            case 'Easy': return 5;
            case 'Medium': return 10;
            case 'Hard': return 25;
            case 'Master': return 50;
            default: return 5;
        }
    }

    export function updateEmeraldsUI() {
        const emeralds = getPlayerEmeralds();
        const mmEl = document.getElementById('main-menu-emeralds-count');
        if (mmEl) {
            mmEl.innerText = emeralds.toLocaleString();
            mmEl.classList.remove('emerald-count-pulse');
            void mmEl.offsetWidth;
            mmEl.classList.add('emerald-count-pulse');
        }
        const skinsEl = document.getElementById('skins-emeralds-count');
        if (skinsEl) {
            skinsEl.innerText = emeralds.toLocaleString();
            skinsEl.classList.remove('emerald-count-pulse');
            void skinsEl.offsetWidth;
            skinsEl.classList.add('emerald-count-pulse');
        }
    }

    export function initEmeraldSystem() {
        try {
            const spData = getAchievementsStorage('sp');
            const mpData = getAchievementsStorage('mp');
            let claimed = getClaimedAchievementRewards();
            let added = 0;

            ACHIEVEMENTS.forEach(ach => {
                const isEarned = spData[ach.id] || mpData[ach.id];
                if (isEarned && !claimed.includes(ach.id)) {
                    claimed.push(ach.id);
                    added += getAchievementEmeraldReward(ach);
                }
            });

            if (added > 0 || !localStorage.getItem('swc_claimed_achievements_v1')) {
                localStorage.setItem('swc_claimed_achievements_v1', JSON.stringify(claimed));
                addPlayerEmeralds(added);
            }
        } catch (e) {
            console.error("Init emeralds error", e);
        }
        updateEmeraldsUI();
    }

    // Geometry Dash Style Shopkeeper Dialogues
    export const SHOPKEEPER_DIALOGUES = [
        "\"Welcome to the Skins Shop! Spend Emeralds earned from achievements on community skins, or sell your own!\"",
        "\"Hey there! Looking for fresh style? Complete achievements to earn Emeralds, then buy custom skins!\"",
        "\"You can upload your own skins and set their price up to 100 Emeralds!\"",
        "\"Achievements only pay out Emeralds once — no duplicate riches, keep it honest!\"",
        "\"Need more Emeralds? Defeat monsters, craft diamond gear, and finish master milestones!\"",
        "\"Everything here was crafted by players just like you! Take a look around.\""
    ];
    export let currentShopkeeperDialogueIdx = 0;

    export function cycleShopkeeperDialogue() {
        currentShopkeeperDialogueIdx = (currentShopkeeperDialogueIdx + 1) % SHOPKEEPER_DIALOGUES.length;
        const textEl = document.getElementById('shopkeeper-dialogue-text');
        if (textEl) {
            textEl.style.opacity = '0';
            setTimeout(() => {
                textEl.innerText = SHOPKEEPER_DIALOGUES[currentShopkeeperDialogueIdx];
                textEl.style.opacity = '1';
            }, 120);
        }
        if (typeof playSound === 'function') {
            playSound('click', { vol: 0.5 });
        }
    }

    export function drawShopkeeperAvatar() {
        const canvas = document.getElementById('shopkeeper-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, 48, 48);

        ctx.fillStyle = '#08252a';
        ctx.fillRect(0, 0, 48, 48);

        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(10, 4, 28, 12);
        ctx.fillStyle = '#ffd34d';
        ctx.fillRect(8, 14, 32, 4);

        ctx.fillStyle = '#cda17c';
        ctx.fillRect(12, 18, 24, 18);

        ctx.fillStyle = '#aa7a54';
        ctx.fillRect(20, 24, 8, 12);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(14, 22, 5, 4);
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(16, 22, 3, 4);

        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(29, 20, 7, 7);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(31, 22, 3, 3);
        ctx.strokeStyle = '#ffd34d';
        ctx.lineWidth = 2;
        ctx.strokeRect(28, 19, 9, 9);

        ctx.fillStyle = '#3e2723';
        ctx.fillRect(8, 36, 32, 12);
        ctx.fillStyle = '#17b978';
        ctx.fillRect(21, 38, 6, 6);
        ctx.fillStyle = '#85ffc7';
        ctx.fillRect(23, 40, 2, 2);
    }

    export function switchSkinLibraryTab(tab) {
        const showingGallery = tab === 'gallery';
        document.getElementById('skin-tab-mine').classList.toggle('active', !showingGallery);
        document.getElementById('skin-tab-gallery').classList.toggle('active', showingGallery);
        document.getElementById('skin-grid').classList.toggle('hidden', showingGallery);
        document.getElementById('skin-gallery-panel').classList.toggle('hidden', !showingGallery);
        updateEmeraldsUI();
        if (showingGallery) {
            drawShopkeeperAvatar();
            loadSkinGallery();
        }
    }

    export function getClientUid() {
        let uid = localStorage.getItem('swc_client_uid_v1');
        if (!uid) {
            uid = 'c_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
            localStorage.setItem('swc_client_uid_v1', uid);
        }
        return window.user?.uid || uid;
    }

    export function isMyGallerySkin(skin) {
        if (!skin) return false;
        try {
            const myPublished = JSON.parse(localStorage.getItem('swc_my_published_skins_v1') || '[]');
            if (skin.id && myPublished.includes(skin.id)) return true;
        } catch (e) {}
        const currentUid = getClientUid();
        if (skin.authorId && (skin.authorId === currentUid || (window.user?.uid && skin.authorId === window.user.uid))) return true;
        return false;
    }

    export function getPurchasedSkins() {
        try {
            const raw = localStorage.getItem('swc_purchased_skins_v1');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    export function recordPurchasedSkin(skinId) {
        try {
            const list = getPurchasedSkins();
            if (!list.includes(skinId)) {
                list.push(skinId);
                localStorage.setItem('swc_purchased_skins_v1', JSON.stringify(list));
            }
        } catch (e) {}
    }

    export function isSkinInMySkins(gallerySkin) {
        if (!gallerySkin || !gallerySkin.data) return false;
        const savedSkins = getSavedSkins();
        const galleryDataStr = JSON.stringify(gallerySkin.data);
        return savedSkins.some(s => Array.isArray(s.data) && JSON.stringify(s.data) === galleryDataStr);
    }

    export function isSkinOwned(gallerySkin) {
        if (!gallerySkin) return false;
        if (isMyGallerySkin(gallerySkin)) return true;
        if (getPurchasedSkins().includes(gallerySkin.id)) return true;
        if (isSkinInMySkins(gallerySkin)) return true;
        const price = Math.min(100, Math.max(0, parseInt(gallerySkin.price, 10) || 0));
        if (price === 0) return false;
        return false;
    }

    export function openSkinOwnedModal(skin) {
        const titleEl = document.getElementById('skin-owned-name');
        const authorEl = document.getElementById('skin-owned-author');
        const previewCanvas = document.getElementById('skin-owned-preview');
        if (titleEl) titleEl.textContent = skin.name || 'Community Skin';
        if (authorEl) authorEl.textContent = 'by ' + (skin.authorName || 'Anonymous');
        if (previewCanvas && skin.data) {
            compileRemoteSkin(skin.data, previewCanvas);
        }
        const modal = document.getElementById('skin-owned-modal');
        if (modal) modal.classList.remove('hidden');
        if (typeof playSound === 'function') playSound('pop', { vol: 0.7 });
    }

    export function closeSkinOwnedModal() {
        const modal = document.getElementById('skin-owned-modal');
        if (modal) modal.classList.add('hidden');
    }

    export function goToMySkinsFromOwnedModal() {
        closeSkinOwnedModal();
        switchSkinLibraryTab('mine');
        renderSkinLibrary();
    }

    export async function loadSkinGallery() {
        const status = document.getElementById('skin-gallery-status');
        const grid = document.getElementById('skin-gallery-grid');
        if (!window.fbModules || !await ensureFirebase()) {
            status.innerText = 'Skins Shop unavailable without a Firebase connection.';
            return;
        }
        status.innerText = 'Loading community skins...';
        const { collection, onSnapshot } = window.fbModules;
        const galleryRef = collection(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'skin_gallery');
        onSnapshot(galleryRef, (snapshot) => {
            const gallerySkins = snapshot.docs.map(skinDoc => ({ id: skinDoc.id, ...skinDoc.data() }))
                .filter(skin => Array.isArray(skin.data) && skin.data.length === SKIN_W * SKIN_H)
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            grid.innerHTML = '';
            status.innerText = gallerySkins.length ? `${gallerySkins.length} community skin${gallerySkins.length === 1 ? '' : 's'}` : 'No community skins yet. Be the first to upload!';
            gallerySkins.forEach(skin => grid.appendChild(createGallerySkinCard(skin)));
        }, (err) => { 
            console.error('Gallery loading failed', err);
            status.innerText = 'Could not load the Skins Shop.'; 
        });
    }

    export function createGallerySkinCard(skin) {
        const card = document.createElement('div');
        card.className = 'skin-gallery-card';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', skin.name || 'Community Skin');
        
        const preview = document.createElement('canvas');
        compileRemoteSkin(skin.data, preview);
        
        const name = document.createElement('span');
        name.className = 'skin-gallery-card-name';
        name.textContent = skin.name || 'Community Skin';
        
        const author = document.createElement('span');
        author.className = 'skin-gallery-card-meta';
        author.textContent = 'by ' + (skin.authorName || 'Anonymous');

        const price = Math.min(100, Math.max(0, parseInt(skin.price, 10) || 0));
        const priceTag = document.createElement('span');
        if (price === 0) {
            priceTag.className = 'skin-price-tag skin-price-free';
            priceTag.innerText = 'FREE';
        } else {
            priceTag.className = 'skin-price-tag skin-price-cost';
            priceTag.innerHTML = `${getPixelEmeraldSvg(14)} ${price} Emeralds`;
        }

        const inMySkins = isSkinInMySkins(skin);
        const isOwned = isSkinOwned(skin);

        // Hover overlay actions matching My Skins
        const actions = document.createElement('div');
        actions.className = 'skin-card-actions';

        if (inMySkins) {
            const equipBtn = document.createElement('button');
            equipBtn.className = 'skin-action equip';
            equipBtn.type = 'button';
            equipBtn.title = 'Already owned in My Skins';
            equipBtn.setAttribute('aria-label', 'Already owned in My Skins');
            equipBtn.innerText = '✓';
            equipBtn.onclick = (e) => {
                e.stopPropagation();
                buyAndEquipGallerySkin(skin);
            };
            actions.appendChild(equipBtn);
        } else if (isOwned || price === 0) {
            const equipBtn = document.createElement('button');
            equipBtn.className = 'skin-action equip';
            equipBtn.type = 'button';
            equipBtn.title = isOwned ? 'Equip (Owned)' : 'Get & Equip (Free)';
            equipBtn.setAttribute('aria-label', 'Equip Skin');
            equipBtn.innerText = '✓';
            equipBtn.onclick = (e) => {
                e.stopPropagation();
                buyAndEquipGallerySkin(skin);
            };
            actions.appendChild(equipBtn);
        } else {
            const buyBtn = document.createElement('button');
            buyBtn.className = 'skin-action buy';
            buyBtn.type = 'button';
            buyBtn.title = `Buy for ${price} Emeralds`;
            buyBtn.setAttribute('aria-label', `Buy for ${price} Emeralds`);
            buyBtn.innerHTML = `Buy (${price} ${getPixelEmeraldSvg(12)})`;
            buyBtn.onclick = (e) => {
                e.stopPropagation();
                buyAndEquipGallerySkin(skin);
            };
            actions.appendChild(buyBtn);
        }

        if (isMyGallerySkin(skin)) {
            const delBtn = document.createElement('button');
            delBtn.className = 'skin-action delete';
            delBtn.type = 'button';
            delBtn.title = 'Delete from Skins Shop';
            delBtn.setAttribute('aria-label', 'Delete from Skins Shop');
            delBtn.innerText = 'X';
            delBtn.onclick = async (e) => {
                e.stopPropagation();
                if (!confirm(`Delete "${skin.name || 'Skin'}" from the Skins Shop?`)) return;
                try {
                    const { deleteDoc, doc } = window.fbModules;
                    await deleteDoc(doc(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'skin_gallery', skin.id));
                    try {
                        const myPublished = JSON.parse(localStorage.getItem('swc_my_published_skins_v1') || '[]');
                        const filtered = myPublished.filter(id => id !== skin.id);
                        localStorage.setItem('swc_my_published_skins_v1', JSON.stringify(filtered));
                    } catch (e) {}
                    showToast('Skin removed from gallery.');
                } catch(err) {
                    console.error('Failed to delete skin', err);
                    showToast('Could not delete skin from gallery.');
                }
            };
            actions.appendChild(delBtn);
        }

        card.onclick = () => buyAndEquipGallerySkin(skin);
        card.onkeydown = (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                buyAndEquipGallerySkin(skin);
            }
        };

        card.append(preview, name, priceTag, author, actions);
        return card;
    }

    export function buyAndEquipGallerySkin(skin) {
        if (isSkinInMySkins(skin)) {
            openSkinOwnedModal(skin);
            showToast('You already own this skin!');
            return;
        }

        const price = Math.min(100, Math.max(0, parseInt(skin.price, 10) || 0));
        const owned = isSkinOwned(skin);

        if (owned || price === 0) {
            addGallerySkinToLibrary(skin);
            return;
        }

        const playerEmeralds = getPlayerEmeralds();
        if (playerEmeralds < price) {
            showToast(`Not enough Emeralds! (${price} needed, you have ${playerEmeralds})`);
            if (typeof playSound === 'function') playSound('hurt', { vol: 0.6 });
            return;
        }

        setPlayerEmeralds(playerEmeralds - price);
        recordPurchasedSkin(skin.id);
        addGallerySkinToLibrary(skin);
        showToast(`Purchased & equipped "${skin.name || 'Skin'}" for ${price} Emeralds!`);
        if (typeof playSound === 'function') playSound('craft', { vol: 1.0 });

        renderSkinLibrary();
        loadSkinGallery();
    }

    export function addGallerySkinToLibrary(gallerySkin) {
        const localSkin = { id: 'skin_' + Date.now(), name: gallerySkin.name || 'Gallery Skin', data: gallerySkin.data.slice() };
        const skins = getSavedSkins();
        skins.push(localSkin);
        saveSavedSkins(skins);
        selectSkin(localSkin.id, localSkin.data);
        showToast('Skin added and equipped!');
        renderSkinLibrary();
        const galleryPanel = document.getElementById('skin-gallery-panel');
        if (galleryPanel && !galleryPanel.classList.contains('hidden')) {
            loadSkinGallery();
        }
    }

    export function createSkinCard(name, skinData, canEdit, skinId) {
        const card = document.createElement('div');
        card.className = 'skin-card' + (activeSkinId === skinId ? ' selected' : '');
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', 'Use ' + name);
        card.onclick = () => selectSkin(skinId, skinData);
        card.onkeydown = (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectSkin(skinId, skinData); } };
        const preview = document.createElement('canvas');
        compileRemoteSkin(skinData, preview);
        const label = document.createElement('span');
        label.className = 'skin-card-name';
        label.textContent = name;
        card.appendChild(preview);
        card.appendChild(label);
        if (canEdit) {
            const actions = document.createElement('div');
            actions.className = 'skin-card-actions';
            actions.innerHTML = `
                <button class="skin-action edit" type="button" title="Edit skin" aria-label="Edit skin">✎</button>
                <button class="skin-action upload" type="button" title="Upload to Skins Shop" aria-label="Upload to Skins Shop">
                    <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
                        <path d="M7 1h2v6h3v2h-2v5H6V9H4V7h3V1z" fill="#4eed99"/>
                        <path d="M1 13h14v2H1z" fill="#fff"/>
                    </svg>
                </button>
                <button class="skin-action delete" type="button" title="Delete skin" aria-label="Delete skin">X</button>
            `;
            actions.children[0].onclick = (event) => { event.stopPropagation(); editSkin(skinId); };
            actions.children[1].onclick = (event) => { event.stopPropagation(); openSkinUploadModal(skinId, name, skinData); };
            actions.children[2].onclick = (event) => { event.stopPropagation(); deleteSkin(skinId); };
            card.appendChild(actions);
        }
        return card;
    }


    // --- Upload to Skins Shop Modal Logic ---
    export let pendingUploadSkinData = null;
    export let pendingUploadSkinId = null;
    export let currentUploadPrice = 0;

    export function openSkinUploadModal(skinId, name, skinData) {
        const candidateData = (skinData && Array.isArray(skinData)) ? skinData.slice() : getSkinSaveData();
        const paintedPixels = candidateData.filter(c => c && c !== 'transparent').length;
        if (paintedPixels < 16) {
            showToast('Cannot upload an empty or blank skin! Paint your skin first.');
            return;
        }

        pendingUploadSkinId = skinId;
        pendingUploadSkinData = candidateData;
        const nameInput = document.getElementById('skin-upload-name-input');
        if (nameInput) nameInput.value = name || 'My Skin';

        const priceSlider = document.getElementById('skin-upload-price-slider');
        if (priceSlider) {
            priceSlider.value = 0;
            updateSkinUploadPriceDisplay(0);
        }

        const previewCanvas = document.getElementById('skin-upload-preview');
        if (previewCanvas) {
            compileRemoteSkin(pendingUploadSkinData, previewCanvas);
        }

        document.getElementById('skin-upload-modal').classList.remove('hidden');
    }

    export function closeSkinUploadModal() {
        document.getElementById('skin-upload-modal').classList.add('hidden');
        pendingUploadSkinData = null;
        pendingUploadSkinId = null;
    }

    export function setSkinUploadPrice(val) {
        const slider = document.getElementById('skin-upload-price-slider');
        if (slider) slider.value = val;
        updateSkinUploadPriceDisplay(val);
    }

    export function updateSkinUploadPriceDisplay(val) {
        currentUploadPrice = parseInt(val, 10) || 0;
        const disp = document.getElementById('skin-upload-price-display');
        if (disp) disp.innerText = currentUploadPrice === 0 ? 'FREE' : `${currentUploadPrice} Emeralds`;
        const label = document.getElementById('skin-upload-price-val');
        if (label) {
            if (currentUploadPrice === 0) {
                label.innerHTML = `${getPixelEmeraldSvg(16)} <span class="text-[#85ffc7] font-bold text-xl">0 (Free)</span>`;
            } else {
                label.innerHTML = `${getPixelEmeraldSvg(16)} <span class="text-[#4eed99] font-bold text-xl">${currentUploadPrice} Emeralds</span>`;
            }
        }
        const priceNum = currentUploadPrice;
        document.querySelectorAll('.skin-upload-presets-grid .mc-btn').forEach(btn => {
            const btnText = btn.textContent.trim();
            const isMatch = (priceNum === 0 && btnText.includes('Free')) || (priceNum > 0 && btnText.startsWith(String(priceNum)));
            btn.classList.toggle('active-preset', isMatch);
        });
    }

    export async function confirmSkinUpload() {
        const nameInput = document.getElementById('skin-upload-name-input');
        const name = (nameInput?.value.trim() || 'Community Skin').slice(0, 24);
        const price = currentUploadPrice;

        if (!pendingUploadSkinData || !Array.isArray(pendingUploadSkinData) || pendingUploadSkinData.length !== SKIN_W * SKIN_H) {
            showToast('Invalid skin data.');
            return;
        }

        const btn = document.getElementById('btn-confirm-skin-upload');
        if (btn) {
            btn.disabled = true;
            btn.innerText = 'Publishing...';
        }

        const paintedPixels = (pendingUploadSkinData || []).filter(c => c && c !== 'transparent').length;
        if (paintedPixels < 16) {
            showToast('Cannot upload an empty or blank skin! Paint your skin first.');
            if (btn) {
                btn.disabled = false;
                btn.innerText = 'Publish';
            }
            return;
        }

        // Validate: Cannot upload unmodified default Steve skin
        if (JSON.stringify(pendingUploadSkinData) === JSON.stringify(getDefaultSkinData())) {
            showToast('Cannot upload default Steve skin! Modify it before publishing.');
            if (btn) {
                btn.disabled = false;
                btn.innerText = 'Publish';
            }
            return;
        }

        if (!await ensureFirebase()) {
            if (btn) {
                btn.disabled = false;
                btn.innerText = 'Publish';
            }
            return;
        }

        try {
            const { collection, getDocs, doc, setDoc } = window.fbModules;
            const galleryRef = collection(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'skin_gallery');

            // Validate: Cannot upload the exact same skin twice
            const snapshot = await getDocs(galleryRef);
            const isDuplicate = snapshot.docs.some(d => {
                const docData = d.data();
                return Array.isArray(docData?.data) && JSON.stringify(docData.data) === JSON.stringify(pendingUploadSkinData);
            });

            if (isDuplicate) {
                showToast('This exact skin is already published in the Skins Shop!');
                if (btn) {
                    btn.disabled = false;
                    btn.innerText = 'Publish';
                }
                return;
            }

            const authorId = getClientUid();
            const newDoc = doc(galleryRef);
            await setDoc(newDoc, {
                name: name,
                data: pendingUploadSkinData,
                price: price,
                authorName: (playerName || 'Anonymous').slice(0, 16),
                authorId: authorId,
                gameVersion: GAME_VERSION,
                createdAt: Date.now()
            });

            // Track published skin locally for deletion rights
            try {
                const myPublished = JSON.parse(localStorage.getItem('swc_my_published_skins_v1') || '[]');
                if (!myPublished.includes(newDoc.id)) {
                    myPublished.push(newDoc.id);
                    localStorage.setItem('swc_my_published_skins_v1', JSON.stringify(myPublished));
                }
            } catch (e) {}

            showToast(`Published "${name}" to Skins Shop (${price === 0 ? 'Free' : price + ' Emeralds'})!`);
            closeSkinUploadModal();
            if (typeof playSound === 'function') playSound('craft', { vol: 1.0 });
            switchSkinLibraryTab('gallery');
        } catch (error) {
            console.error('Skin shop publish failed', error);
            showToast('Could not publish to Skins Shop.');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = 'Publish';
            }
        }
    }

    export function selectSkin(skinId, skinData) {
        playerSkinData = skinData.slice();
        activeSkinId = skinId;
        localStorage.setItem('swc_active_skin_v1', skinId);
        localStorage.setItem('swc_skin_v5', JSON.stringify(getSkinSaveData()));
        compileSkinCanvas();
        renderSkinLibrary();
        showToast('Skin equipped!');
    }

    export function compileSkinCanvas() {
        if (!skinCanvasObj && typeof document !== 'undefined') {
            skinCanvasObj = (typeof window !== 'undefined' && window.skinCanvasObj) ? window.skinCanvasObj : document.createElement('canvas');
            if (skinCanvasObj) { skinCanvasObj.width = SKIN_W; skinCanvasObj.height = SKIN_H; }
        }
        if (!skinCanvasObj) return;
        let sCtx = skinCanvasObj.getContext('2d');
        if (!sCtx) return;
        sCtx.clearRect(0, 0, SKIN_W, SKIN_H);
        const skinData = playerSkinData || (typeof window !== 'undefined' ? window.playerSkinData : null);
        if (skinData) {
            for(let y=0; y<SKIN_H; y++) {
                for(let x=0; x<SKIN_W; x++) {
                    if(skinData[y*SKIN_W + x]) {
                        sCtx.fillStyle = skinData[y*SKIN_W + x];
                        sCtx.fillRect(x, y, 1, 1);
                    }
                }
            }
        }
        skinCanvasObj.cachedSkinTone = getSkinToneFromContext(sCtx);
        if (typeof window !== 'undefined') {
            window.playerSkinData = playerSkinData;
            window.skinCanvasObj = skinCanvasObj;
        }
        if (typeof staticPreviewDrawn !== 'undefined') staticPreviewDrawn = false;
        if (typeof drawPlayerPreview === 'function') drawPlayerPreview();
        if (typeof updateMainMenuProfileBadge === 'function') updateMainMenuProfileBadge();
    }

    export function getSkinToneFromContext(sCtx) {
        try {
            const headPixels = sCtx.getImageData(4, 3, 8, 5).data;
            const colorCounts = new Map();
            for (let index = 0; index < headPixels.length; index += 4) {
                const red = headPixels[index];
                const green = headPixels[index + 1];
                const blue = headPixels[index + 2];
                const alpha = headPixels[index + 3];
                if (alpha === 0 || (red < 20 && green < 20 && blue < 20)) continue;
                const color = `${red},${green},${blue}`;
                colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
            }
            let mostCommonColor = null;
            colorCounts.forEach((count, color) => {
                if (!mostCommonColor || count > mostCommonColor.count) mostCommonColor = { color, count };
            });
            return mostCommonColor ? `rgb(${mostCommonColor.color})` : '#d09f7a';
        } catch (e) {
            return '#d09f7a';
        }
    }
    
    export function compileRemoteSkin(skinArray, targetCanvas) {
        if(!targetCanvas) return;
        targetCanvas.width = SKIN_W; targetCanvas.height = SKIN_H;
        let sCtx = targetCanvas.getContext('2d');
        sCtx.clearRect(0, 0, SKIN_W, SKIN_H);
        let frontData = (Array.isArray(skinArray) && skinArray.length === SKIN_W * SKIN_H) ? skinArray : getDefaultSkinData();
        for(let y=0; y<SKIN_H; y++) {
            for(let x=0; x<SKIN_W; x++) {
                if(frontData[y*SKIN_W + x]) {
                    sCtx.fillStyle = frontData[y*SKIN_W + x];
                    sCtx.fillRect(x, y, 1, 1);
                }
            }
        }
        targetCanvas.cachedSkinTone = getSkinToneFromContext(sCtx);
    }

    export function loadSkin() {
        try {
            const savedId = localStorage.getItem('swc_active_skin_v1');
            const savedSkins = getSavedSkins();
            
            if (savedId && savedId !== 'default') {
                const foundSkin = savedSkins.find(s => s.id === savedId);
                if (foundSkin && Array.isArray(foundSkin.data) && foundSkin.data.length === SKIN_W * SKIN_H) {
                    playerSkinData = foundSkin.data.slice();
                    activeSkinId = savedId;
                    localStorage.setItem('swc_skin_v5', JSON.stringify(playerSkinData));
                    compileSkinCanvas();
                    return;
                }
            }
            
            if (savedId === 'default') {
                playerSkinData = getDefaultSkinData();
                activeSkinId = 'default';
                localStorage.setItem('swc_skin_v5', JSON.stringify(playerSkinData));
                compileSkinCanvas();
                return;
            }

            // Fallback: Check swc_skin_v5
            let saved = localStorage.getItem('swc_skin_v5');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length === SKIN_W * SKIN_H) {
                        playerSkinData = parsed.slice(0, SKIN_W * SKIN_H);
                        const match = savedSkins.find(s => JSON.stringify(s.data) === JSON.stringify(playerSkinData));
                        activeSkinId = match ? match.id : 'default';
                        localStorage.setItem('swc_active_skin_v1', activeSkinId);
                        compileSkinCanvas();
                        return;
                    }
                } catch(e) {}
            }
            
            // Default skin fallback
            playerSkinData = getDefaultSkinData();
            activeSkinId = 'default';
            localStorage.setItem('swc_active_skin_v1', 'default');
            localStorage.setItem('swc_skin_v5', JSON.stringify(playerSkinData));
            compileSkinCanvas();
        } catch(err) {
            console.error('Error loading skin:', err);
            generateDefaultSkin();
            compileSkinCanvas();
        }
    }
    loadSkin();

    export const editorCanvas = document.getElementById('skin-canvas');
    export const eCtx = editorCanvas ? editorCanvas.getContext('2d') : null;
    export let currentColor = '#00AAAA';
    export let currentTool = 'pencil'; // 'pencil', 'eraser', 'picker', 'bucket'
    export let isDrawing = false;
    export let isErasing = false;
    export let showEditorGrid = true;
    export let showEditorGuides = true;
    export let skinUndoStack = [];
    export let skinRedoStack = [];
    export let skinAutoSaveTimer = null;
    export let skinEditorZoom = 1;

    export const skinEditor32Palette = [
        // Row 1: Skin tones & hair
        '#ffd8b3', '#f5c69b', '#d09f7a', '#b87c53', '#8d5524', '#603913', '#4a2c11', '#2c1808',
        // Row 2: Standard vibrant colors
        '#c62828', '#e67e22', '#f1c40f', '#2e7d32', '#35d05f', '#00aaaa', '#1976d2', '#333399',
        // Row 3: Extended shades & pastels
        '#ff70a6', '#e91e63', '#9c27b0', '#673ab7', '#00bcd4', '#4caf50', '#8bc34a', '#795548',
        // Row 4: Monochrome grayscale
        '#ffffff', '#e0e1e4', '#aebac2', '#69737b', '#46515a', '#283038', '#171b20', '#000000'
    ];
    export let recentSkinColors = ['#00AAAA', '#d09f7a', '#333399', '#4a2c11', '#ffffff', '#000000'];

    export function getActiveSkinEditorData() {
        return playerSkinData;
    }

    export function updateSkinEditorTitle() {
        const sTitle = document.getElementById('skins-title');
        if (!sTitle) return;
        const nameInput = document.getElementById('skin-name-input');
        const skinName = nameInput ? nameInput.value.trim() : '';
        sTitle.classList.remove('hidden');
        sTitle.textContent = 'Editing Skin: ' + (skinName || (editingSkinId ? 'Custom Skin' : 'My Skin'));
    }

    export function updateSkinNameCharCount() {
        const input = document.getElementById('skin-name-input');
        const count = document.getElementById('skin-name-count');
        if (input && count) {
            count.innerText = `${input.value.length}/24`;
        }
        updateSkinEditorTitle();
    }

    export function selectSkinTool(tool) {
        currentTool = tool;
        isErasing = (tool === 'eraser');
        const tools = ['pencil', 'eraser', 'picker', 'bucket'];
        tools.forEach(t => {
            const btn = document.getElementById(`tool-btn-${t}`);
            if (btn) btn.classList.toggle('active', t === tool);
        });
        const cap = tool.charAt(0).toUpperCase() + tool.slice(1);
        setSkinToolStatus(`Tool: ${cap}`);
    }

    export function selectSkinColor(hex) {
        if (!hex) return;
        currentColor = hex.toLowerCase();
        if (currentTool === 'eraser') selectSkinTool('pencil');
        
        // Update custom color picker input, hex label, and active swatch preview box
        const picker = document.getElementById('custom-color-picker');
        if (picker && hex.startsWith('#') && hex.length === 7) picker.value = currentColor;
        const hexLabel = document.getElementById('custom-color-hex-label');
        if (hexLabel) hexLabel.innerText = currentColor.toUpperCase();
        const swatchBox = document.getElementById('active-color-swatch-box');
        if (swatchBox) swatchBox.style.backgroundColor = currentColor;

        // Highlight selected swatch in matrix and recents
        document.querySelectorAll('.skin-swatch').forEach(el => {
            el.classList.toggle('selected', el.getAttribute('data-color')?.toLowerCase() === currentColor);
        });

        // Add to recents if not present
        if (!recentSkinColors.includes(currentColor)) {
            recentSkinColors.unshift(currentColor);
            if (recentSkinColors.length > 8) recentSkinColors.pop();
            renderRecentSkinColors();
        }
    }

    export function addCurrentColorToCustom() {
        if (!recentSkinColors.includes(currentColor)) {
            recentSkinColors.unshift(currentColor);
            if (recentSkinColors.length > 8) recentSkinColors.pop();
            renderRecentSkinColors();
            showToast('Color saved to recents!');
        } else {
            showToast('Color already in recents.');
        }
    }

    export function renderPaletteMatrix() {
        const container = document.getElementById('palette-matrix');
        if (!container) return;
        container.innerHTML = '';
        skinEditor32Palette.forEach(c => {
            const swatch = document.createElement('div');
            swatch.className = 'skin-swatch' + (c.toLowerCase() === currentColor.toLowerCase() ? ' selected' : '');
            swatch.style.backgroundColor = c;
            swatch.setAttribute('data-color', c);
            swatch.title = c.toUpperCase();
            swatch.onclick = () => selectSkinColor(c);
            container.appendChild(swatch);
        });
    }

    export function renderRecentSkinColors() {
        const container = document.getElementById('palette-recent-colors');
        if (!container) return;
        container.innerHTML = '';
        recentSkinColors.forEach(c => {
            const swatch = document.createElement('div');
            swatch.className = 'skin-swatch !w-5 !h-5' + (c.toLowerCase() === currentColor.toLowerCase() ? ' selected' : '');
            swatch.style.backgroundColor = c;
            swatch.setAttribute('data-color', c);
            swatch.title = c.toUpperCase();
            swatch.onclick = () => selectSkinColor(c);
            container.appendChild(swatch);
        });
    }

    export function initSkinEditor() {
        renderPaletteMatrix();
        renderRecentSkinColors();

        const customPicker = document.getElementById('custom-color-picker');
        if (customPicker) {
            customPicker.oninput = (e) => selectSkinColor(e.target.value);
        }

        selectSkinTool('pencil');
        updateSkinHistoryButtons();
        updateSkinEditorZoom();
        updateSkinNameCharCount();
        setSkinToolStatus('Ready');
        renderEditorCanvas();
    }

    export function resetSkinHistory() {
        skinUndoStack = [];
        skinRedoStack = [];
        updateSkinHistoryButtons();
    }

    export function updateSkinHistoryButtons() {
        const undoButton = document.getElementById('skin-undo-btn');
        const redoButton = document.getElementById('skin-redo-btn');
        if (undoButton) undoButton.disabled = skinUndoStack.length === 0;
        if (redoButton) redoButton.disabled = skinRedoStack.length === 0;
    }

    export function setSkinToolStatus(message) {
        const status = document.getElementById('skin-tool-status');
        if (status) status.textContent = message;
    }

    export function applySkinEdit(edit) {
        const previousData = getActiveSkinEditorData().slice();
        const nextData = previousData.slice();
        edit(nextData);
        if (nextData.every((color, index) => color === previousData[index])) return;
        skinUndoStack.push(previousData);
        if (skinUndoStack.length > 50) skinUndoStack.shift();
        skinRedoStack = [];
        playerSkinData = nextData;
        renderEditorCanvas();
        compileSkinCanvas();
        updateSkinHistoryButtons();
        setSkinToolStatus('Unsaved');
    }

    export function undoSkinEdit() {
        if (!skinUndoStack.length) return;
        skinRedoStack.push(playerSkinData.slice());
        const previousEdit = skinUndoStack.pop();
        playerSkinData = previousEdit;
        renderEditorCanvas();
        compileSkinCanvas();
        updateSkinHistoryButtons();
        setSkinToolStatus('Undid');
    }

    export function redoSkinEdit() {
        if (!skinRedoStack.length) return;
        skinUndoStack.push(playerSkinData.slice());
        const nextEdit = skinRedoStack.pop();
        playerSkinData = nextEdit;
        renderEditorCanvas();
        compileSkinCanvas();
        updateSkinHistoryButtons();
        setSkinToolStatus('Redid');
    }

    export function startSkinAutoSave() {
        clearInterval(skinAutoSaveTimer);
        skinAutoSaveTimer = setInterval(() => {
            if (!document.getElementById('skin-editor-container').classList.contains('hidden')) autoSaveSkin();
        }, 30000);
    }

    export function autoSaveSkin() {
        const isNewSkin = !editingSkinId;
        persistSkin(false);
        setSkinToolStatus('Autosaved');
        showToast(isNewSkin ? 'Skin automatically saved!' : 'Autosaved');
    }

    export function fillSkin() {
        applySkinEdit(data => data.fill(isErasing ? null : currentColor));
        showToast(isErasing ? 'Canvas cleared!' : 'Canvas filled!');
    }

    export function resetSkinToDefault() {
        if (!confirm('Reset skin canvas to default Steve template?')) return;
        applySkinEdit(data => {
            const def = getDefaultSkinData();
            for (let i = 0; i < def.length; i++) data[i] = def[i];
        });
        showToast('Skin reset to Steve template.');
    }

    export function floodFillSkin(startX, startY, fillCol) {
        applySkinEdit(data => {
            const targetColor = data[startY * SKIN_W + startX];
            if (targetColor === fillCol) return;
            const queue = [[startX, startY]];
            const visited = new Uint8Array(SKIN_W * SKIN_H);
            visited[startY * SKIN_W + startX] = 1;
            while (queue.length > 0) {
                const [cx, cy] = queue.pop();
                data[cy * SKIN_W + cx] = fillCol;
                const neighbors = [
                    [cx + 1, cy], [cx - 1, cy],
                    [cx, cy + 1], [cx, cy - 1]
                ];
                for (const [nx, ny] of neighbors) {
                    if (nx >= 0 && nx < SKIN_W && ny >= 0 && ny < SKIN_H) {
                        const idx = ny * SKIN_W + nx;
                        if (!visited[idx] && data[idx] === targetColor) {
                            visited[idx] = 1;
                            queue.push([nx, ny]);
                        }
                    }
                }
            }
        });
    }

    export function toggleSkinEditorGrid() {
        showEditorGrid = !showEditorGrid;
        const btn = document.getElementById('skin-grid-btn');
        if (btn) btn.classList.toggle('active', showEditorGrid);
        renderEditorCanvas();
    }

    export function toggleSkinEditorGuides() {
        showEditorGuides = !showEditorGuides;
        const btn = document.getElementById('skin-guides-btn');
        if (btn) btn.classList.toggle('active', showEditorGuides);
        renderEditorCanvas();
    }

    export function zoomInSkinEditor() {
        skinEditorZoom = Math.min(3, Math.round((skinEditorZoom + 0.25) * 100) / 100);
        updateSkinEditorZoom();
    }

    export function zoomOutSkinEditor() {
        skinEditorZoom = Math.max(0.5, Math.round((skinEditorZoom - 0.25) * 100) / 100);
        updateSkinEditorZoom();
    }

    export function zoomResetSkinEditor() {
        skinEditorZoom = 1;
        updateSkinEditorZoom();
    }

    export function updateSkinEditorZoom() {
        if (!editorCanvas) return;
        editorCanvas.style.width = `${192 * skinEditorZoom}px`;
        editorCanvas.style.height = `${384 * skinEditorZoom}px`;
        const btn = document.getElementById('skin-zoom-btn');
        if (btn) btn.innerText = `${Math.round(skinEditorZoom * 100)}%`;
    }

    export function getEditorGridPos(e) {
        const rect = editorCanvas.getBoundingClientRect();
        const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        const x = Math.floor(((clientX - rect.left) / rect.width) * SKIN_W);
        const y = Math.floor(((clientY - rect.top) / rect.height) * SKIN_H);
        return { x: Math.max(0, Math.min(SKIN_W - 1, x)), y: Math.max(0, Math.min(SKIN_H - 1, y)) };
    }

    export function handleEditorCanvasAction(e) {
        const pos = getEditorGridPos(e);
        if (pos.x < 0 || pos.x >= SKIN_W || pos.y < 0 || pos.y >= SKIN_H) return;

        if (currentTool === 'picker') {
            const color = getActiveSkinEditorData()[pos.y * SKIN_W + pos.x];
            if (color) {
                selectSkinColor(color);
                showToast(`Eyedropper: ${color.toUpperCase()}`);
            } else {
                showToast('Picked transparent pixel.');
            }
            selectSkinTool('pencil');
            return;
        }

        if (currentTool === 'bucket') {
            floodFillSkin(pos.x, pos.y, isErasing ? null : currentColor);
            return;
        }

        // Pencil or Eraser
        const color = isErasing ? null : currentColor;
        applySkinEdit(data => data[pos.y * SKIN_W + pos.x] = color);
    }

    if (editorCanvas) {
        editorCanvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            handleEditorCanvasAction(e);
        });
        editorCanvas.addEventListener('mousemove', (e) => {
            if (isDrawing && (currentTool === 'pencil' || currentTool === 'eraser')) {
                handleEditorCanvasAction(e);
            }
        });
        editorCanvas.addEventListener('wheel', (e) => {
            if (!e.ctrlKey) return;
            e.preventDefault();
            skinEditorZoom = Math.max(0.5, Math.min(3, skinEditorZoom + (e.deltaY < 0 ? 0.15 : -0.15)));
            updateSkinEditorZoom();
        }, { passive: false });
    }
    window.addEventListener('mouseup', () => isDrawing = false);

    export function renderEditorCanvas() {
        if (!eCtx || !editorCanvas) return;
        eCtx.imageSmoothingEnabled = false;
        eCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
        const cw = editorCanvas.width / SKIN_W;
        const ch = editorCanvas.height / SKIN_H;

        // 1. Checkerboard Background
        for (let y = 0; y < SKIN_H; y++) {
            for (let x = 0; x < SKIN_W; x++) {
                eCtx.fillStyle = (x + y) % 2 === 0 ? '#383e46' : '#282d33';
                eCtx.fillRect(x * cw, y * ch, cw, ch);
                const c = getActiveSkinEditorData()[y * SKIN_W + x];
                if (c) {
                    eCtx.fillStyle = c;
                    eCtx.fillRect(x * cw, y * ch, cw, ch);
                }
            }
        }

        // 2. Pixel Grid Lines
        if (showEditorGrid) {
            eCtx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            eCtx.lineWidth = 1;
            for (let x = 0; x <= SKIN_W; x++) {
                eCtx.beginPath();
                eCtx.moveTo(x * cw, 0);
                eCtx.lineTo(x * cw, editorCanvas.height);
                eCtx.stroke();
            }
            for (let y = 0; y <= SKIN_H; y++) {
                eCtx.beginPath();
                eCtx.moveTo(0, y * ch);
                eCtx.lineTo(editorCanvas.width, y * ch);
                eCtx.stroke();
            }
        }

        // 3. Body Region Guides (Head, Torso, Left/Right Arms, Left/Right Legs)
        if (showEditorGuides) {
            eCtx.lineWidth = 2;
            
            // Head: (4,0) to (12,8)
            eCtx.strokeStyle = '#ffd34d';
            eCtx.strokeRect(4 * cw + 1, 0 + 1, 8 * cw - 2, 8 * ch - 2);

            // Torso: (4,8) to (12,20)
            eCtx.strokeStyle = '#00bcd4';
            eCtx.strokeRect(4 * cw + 1, 8 * ch + 1, 8 * cw - 2, 12 * ch - 2);

            // Right Arm (Screen Left): (0,8) to (4,20)
            eCtx.strokeStyle = '#4caf50';
            eCtx.strokeRect(0 + 1, 8 * ch + 1, 4 * cw - 2, 12 * ch - 2);

            // Left Arm (Screen Right): (12,8) to (16,20)
            eCtx.strokeStyle = '#4caf50';
            eCtx.strokeRect(12 * cw + 1, 8 * ch + 1, 4 * cw - 2, 12 * ch - 2);

            // Right Leg (Screen Left): (4,20) to (8,32)
            eCtx.strokeStyle = '#ab47bc';
            eCtx.strokeRect(4 * cw + 1, 20 * ch + 1, 4 * cw - 2, 12 * ch - 2);

            // Left Leg (Screen Right): (8,20) to (12,32)
            eCtx.strokeStyle = '#ab47bc';
            eCtx.strokeRect(8 * cw + 1, 20 * ch + 1, 4 * cw - 2, 12 * ch - 2);
        }
    }

    export function persistSkin(equipSkin) {
        const skins = getSavedSkins();
        if (editingSkinId) {
            const savedSkin = skins.find(skin => skin.id === editingSkinId);
            if (savedSkin) {
                savedSkin.data = getSkinSaveData();
                const enteredName = document.getElementById('skin-name-input').value.trim();
                savedSkin.name = enteredName || savedSkin.name || 'My Skin';
            }
        } else {
            editingSkinId = 'skin_' + Date.now();
            const enteredName = document.getElementById('skin-name-input').value.trim();
            skins.push({ id: editingSkinId, name: enteredName || 'My Skin ' + (skins.length + 1), data: getSkinSaveData() });
        }
        saveSavedSkins(skins);
        if (equipSkin) {
            activeSkinId = editingSkinId;
            localStorage.setItem('swc_active_skin_v1', activeSkinId);
        }
        localStorage.setItem('swc_skin_v5', JSON.stringify(getSkinSaveData()));
    }

    export function saveSkin() {
        persistSkin(true);
        closeSkinMaker();
    }

    export function publishCurrentSkin() {
        const name = document.getElementById('skin-name-input').value.trim() || 'My Skin';
        openSkinUploadModal(editingSkinId, name, getSkinSaveData());
    }

    export function exportSkin() {
        const currentData = getSkinSaveData();
        const paintedPixels = currentData.filter(c => c && c !== 'transparent').length;
        if (paintedPixels < 16) {
            showToast('Cannot export an empty or blank skin! Paint your skin first.');
            return;
        }
        let blob = new Blob([JSON.stringify(currentData)], {type: "application/json"});
        let url = URL.createObjectURL(blob);
        let a = document.createElement('a'); a.href = url;
        a.download = `webcraft2d_skin.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        showToast("Skin exported!");
    }

    export function importSkin(event) {
        let file = event.target.files[0];
        if (!file) return;
        let reader = new FileReader();
        reader.onload = function(e) {
            try {
                let data = JSON.parse(e.target.result);
                if (!Array.isArray(data) || data.length !== SKIN_W * SKIN_H) throw new Error("Invalid");
                const pageData = data.slice(0, SKIN_W * SKIN_H);
                applySkinEdit(nextData => pageData.forEach((color, index) => nextData[index] = color));
                showToast("Skin imported!");
            } catch(err) { console.error(err); showToast("Error importing skin data!"); }
            event.target.value = '';
        };
        reader.readAsText(file);
    }


    export const previewCanvasEl = document.getElementById('player-preview-canvas');
    if (previewCanvasEl) {
        previewCanvasEl.addEventListener('click', () => {
            startPlayerPreviewWalk();
        });
    }


    export const RECIPES = [
        { output: { id: IDS.BUCKET, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 3 }], reqTable: true, category: 'utility' },
        { output: { id: IDS.PLANKS, count: 4 }, inputs: [{ id: IDS.WOOD, count: 1 }], reqTable: false },
        { output: { id: IDS.CHEST, count: 1 }, inputs: [{ id: IDS.PLANKS, count: 8 }], reqTable: true, category: 'blocks' },
        { output: { id: IDS.STICK, count: 4 }, inputs: [{ id: IDS.PLANKS, count: 2 }], reqTable: false },
        { output: { id: IDS.LADDER, count: 3 }, inputs: [{ id: IDS.STICK, count: 7 }], reqTable: true, category: 'blocks' },
        { output: { id: IDS.WOODEN_STAIRS, count: 4 }, inputs: [{ id: IDS.PLANKS, count: 6 }], reqTable: true, category: 'blocks' },
        { output: { id: IDS.COBBLESTONE_STAIRS, count: 4 }, inputs: [{ id: IDS.COBBLESTONE, count: 6 }], reqTable: true, category: 'blocks' },
        { output: { id: IDS.TORCH, count: 4 }, inputs: [{ id: IDS.COAL, count: 1 }, { id: IDS.STICK, count: 1 }], reqTable: false },
        { output: { id: IDS.CRAFTING_TABLE, count: 1 }, inputs: [{ id: IDS.PLANKS, count: 4 }], reqTable: false },
        { output: { id: IDS.DOOR, count: 1 }, inputs: [{ id: IDS.PLANKS, count: 6 }], reqTable: true, category: 'blocks' },
        { output: { id: IDS.FURNACE, count: 1 }, inputs: [{ id: IDS.COBBLESTONE, count: 8 }], reqTable: true },
        { output: { id: IDS.BED, count: 1 }, inputs: [{ id: IDS.WOOL, count: 3 }, { id: IDS.PLANKS, count: 3 }], reqTable: true },
        { output: { id: IDS.WOOD_PICKAXE, count: 1 }, inputs: [{ id: IDS.PLANKS, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true },
        { output: { id: IDS.WOOD_SWORD, count: 1 }, inputs: [{ id: IDS.PLANKS, count: 2 }, { id: IDS.STICK, count: 1 }], reqTable: true },
        { output: { id: IDS.WOOD_AXE, count: 1 }, inputs: [{ id: IDS.PLANKS, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true },
        { output: { id: IDS.STONE_PICKAXE, count: 1 }, inputs: [{ id: IDS.COBBLESTONE, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true },
        { output: { id: IDS.STONE_SWORD, count: 1 }, inputs: [{ id: IDS.COBBLESTONE, count: 2 }, { id: IDS.STICK, count: 1 }], reqTable: true },
        { output: { id: IDS.STONE_AXE, count: 1 }, inputs: [{ id: IDS.COBBLESTONE, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true },
        { output: { id: IDS.IRON_INGOT, count: 1 }, inputs: [{ id: IDS.IRON_ORE, count: 1 }, { id: IDS.COAL, count: 1 }], reqTable: true, category: 'materials' },
        { output: { id: IDS.GOLD_INGOT, count: 1 }, inputs: [{ id: IDS.GOLD_ORE, count: 1 }, { id: IDS.COAL, count: 1 }], reqTable: true, category: 'materials' },
        { output: { id: IDS.DIAMOND, count: 1 }, inputs: [{ id: IDS.DIAMOND_ORE, count: 1 }], reqTable: true, category: 'materials' },
        { output: { id: IDS.GOLD_PICKAXE, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true },
        { output: { id: IDS.GOLD_SWORD, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 2 }, { id: IDS.STICK, count: 1 }], reqTable: true },
        { output: { id: IDS.GOLD_AXE, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true },
        { output: { id: IDS.IRON_PICKAXE, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true },
        { output: { id: IDS.IRON_SWORD, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 2 }, { id: IDS.STICK, count: 1 }], reqTable: true },
        { output: { id: IDS.IRON_AXE, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true },
        { output: { id: IDS.DIAMOND_PICKAXE, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true },
        { output: { id: IDS.DIAMOND_SWORD, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 2 }, { id: IDS.STICK, count: 1 }], reqTable: true },
        { output: { id: IDS.SNOW, count: 1 }, inputs: [{ id: IDS.SNOWBALL, count: 4 }], reqTable: false, category: 'blocks' },
        { output: { id: IDS.DIAMOND_AXE, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true },
        // --- ARMOR RECIPES ---
        { output: { id: IDS.HELMET_IRON, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 5 }], reqTable: true, category: 'armor' },
        { output: { id: IDS.CHESTPLATE_IRON, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 8 }], reqTable: true, category: 'armor' },
        { output: { id: IDS.LEGGINGS_IRON, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 7 }], reqTable: true, category: 'armor' },
        { output: { id: IDS.BOOTS_IRON, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 4 }], reqTable: true, category: 'armor' },
        { output: { id: IDS.HELMET_GOLD, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 5 }], reqTable: true, category: 'armor' },
        { output: { id: IDS.CHESTPLATE_GOLD, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 8 }], reqTable: true, category: 'armor' },
        { output: { id: IDS.LEGGINGS_GOLD, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 7 }], reqTable: true, category: 'armor' },
        { output: { id: IDS.BOOTS_GOLD, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 4 }], reqTable: true, category: 'armor' },
        { output: { id: IDS.HELMET_DIAMOND, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 5 }], reqTable: true, category: 'armor' },
        { output: { id: IDS.CHESTPLATE_DIAMOND, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 8 }], reqTable: true, category: 'armor' },
        { output: { id: IDS.LEGGINGS_DIAMOND, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 7 }], reqTable: true, category: 'armor' },
        { output: { id: IDS.BOOTS_DIAMOND, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 4 }], reqTable: true, category: 'armor' }
    ];

    export const ACHIEVEMENTS = [
        // --- EASY TIER ---
        {
            id: 'taking_inventory',
            title: 'Taking Inventory',
            description: 'Press E to open your backpack inventory.',
            iconItem: IDS.CHEST,
            badge: 'Easy',
            difficulty: 'Easy'
        },
        {
            id: 'getting_wood',
            title: 'Getting Wood',
            description: 'Punch a tree trunk until you harvest a block of wood.',
            iconItem: IDS.WOOD,
            badge: 'Easy',
            difficulty: 'Easy'
        },
        {
            id: 'benchmarking',
            title: 'Benchmarking',
            description: 'Craft a Crafting Table with 4 wooden planks.',
            iconItem: IDS.CRAFTING_TABLE,
            badge: 'Easy',
            difficulty: 'Easy'
        },
        {
            id: 'time_to_mine',
            title: 'Time to Mine!',
            description: 'Craft a wooden pickaxe from wood and sticks.',
            iconItem: IDS.WOOD_PICKAXE,
            badge: 'Easy',
            difficulty: 'Easy'
        },
        {
            id: 'time_to_strike',
            title: 'Time to Strike!',
            description: 'Craft a wooden sword to defend against hostile monsters.',
            iconItem: IDS.WOOD_SWORD,
            badge: 'Easy',
            difficulty: 'Easy'
        },
        {
            id: 'time_to_farm',
            title: 'Time to Farm!',
            description: 'Harvest seeds by breaking tall wild grass.',
            iconItem: IDS.SEEDS,
            badge: 'Easy',
            difficulty: 'Easy'
        },
        {
            id: 'cartographer',
            title: 'World Explorer',
            description: 'Press M to open the fullscreen world map and survey the land.',
            iconItem: IDS.CHEST,
            badge: 'Easy',
            difficulty: 'Easy'
        },
        {
            id: 'wild_florist',
            title: 'Wild Florist',
            description: 'Pick a red poppy or yellow dandelion in the wild.',
            iconItem: IDS.FLOWER_RED,
            badge: 'Easy',
            difficulty: 'Easy'
        },

        // --- MEDIUM TIER ---
        {
            id: 'hot_topic',
            title: 'Hot Topic',
            description: 'Construct a furnace out of 8 cobblestone blocks.',
            iconItem: IDS.FURNACE,
            badge: 'Medium',
            difficulty: 'Medium'
        },
        {
            id: 'acquire_hardware',
            title: 'Acquire Hardware',
            description: 'Smelt an iron ore block into a pure iron ingot.',
            iconItem: IDS.IRON_INGOT,
            badge: 'Medium',
            difficulty: 'Medium'
        },
        {
            id: 'monster_hunter',
            title: 'Monster Hunter',
            description: 'Attack and defeat a hostile zombie or monster.',
            iconItem: IDS.BONE,
            badge: 'Medium',
            difficulty: 'Medium'
        },
        {
            id: 'sweet_dreams',
            title: 'Sweet Dreams',
            description: 'Sleep in a bed to pass through the dangerous night.',
            iconItem: IDS.BED,
            badge: 'Medium',
            difficulty: 'Medium'
        },
        {
            id: 'ladder_climber',
            title: 'High Climber',
            description: 'Craft and climb a wooden ladder to reach high vantage points.',
            iconItem: IDS.LADDER,
            badge: 'Medium',
            difficulty: 'Medium'
        },
        {
            id: 'stairway_heaven',
            title: 'Stairway to Heaven',
            description: 'Craft oak or cobblestone stairs to build effortless inclines.',
            iconItem: IDS.WOODEN_STAIRS,
            badge: 'Medium',
            difficulty: 'Medium'
        },
        {
            id: 'iron_age',
            title: 'Iron Age',
            description: 'Craft an iron pickaxe capable of extracting diamond veins.',
            iconItem: IDS.IRON_PICKAXE,
            badge: 'Medium',
            difficulty: 'Medium'
        },
        {
            id: 'suit_up',
            title: 'Suit Up!',
            description: 'Craft and equip any piece of protective armor.',
            iconItem: IDS.CHESTPLATE_IRON,
            badge: 'Medium',
            difficulty: 'Medium'
        },
        {
            id: 'delicious_fish',
            title: 'Chef Master',
            description: 'Smelt and cook raw porkchop, chicken, or mutton in the furnace.',
            iconItem: IDS.COOKED_PORKCHOP,
            badge: 'Medium',
            difficulty: 'Medium'
        },
        {
            id: 'snowball_fight',
            title: 'Snowball Fight!',
            description: 'Gather snowballs and throw one across the icy mountains.',
            iconItem: IDS.SNOW,
            badge: 'Medium',
            difficulty: 'Medium'
        },

        // --- HARD TIER ---
        {
            id: 'diamonds',
            title: 'DIAMONDS!',
            description: 'Acquire diamonds with your iron pickaxe.',
            iconItem: IDS.DIAMOND,
            badge: 'Hard',
            difficulty: 'Hard'
        },
        {
            id: 'deep_diver',
            title: 'Into the Depths',
            description: 'Explore deep underground caverns far beneath the surface.',
            iconItem: IDS.STONE,
            badge: 'Hard',
            difficulty: 'Hard'
        },
        {
            id: 'heavy_metal',
            title: 'Heavy Metal',
            description: 'Equip a complete 4-piece set of Iron Armor (Helmet, Chest, Legs, Boots).',
            iconItem: IDS.CHESTPLATE_IRON,
            badge: 'Hard',
            difficulty: 'Hard'
        },
        {
            id: 'shiny_bling',
            title: 'Golden Bling',
            description: 'Smelt gold ingots and craft a piece of gleaming golden armor or a golden tool.',
            iconItem: IDS.GOLD_INGOT,
            badge: 'Hard',
            difficulty: 'Hard'
        },
        {
            id: 'bucket_brigade',
            title: 'Bucket Brigade',
            description: 'Craft an iron bucket and collect water or glowing lava.',
            iconItem: IDS.BUCKET,
            badge: 'Hard',
            difficulty: 'Hard'
        },
        {
            id: 'subterranean_miner',
            title: 'Subterranean Master',
            description: 'Mine 50 stone or ore blocks while deep in dark caverns.',
            iconItem: IDS.COBBLESTONE,
            badge: 'Hard',
            difficulty: 'Hard'
        },
        {
            id: 'sniper_duel',
            title: 'Defend the Homeland',
            description: 'Defeat 5 monsters without succumbing to fatal damage.',
            iconItem: IDS.IRON_SWORD,
            badge: 'Hard',
            difficulty: 'Hard'
        },
        {
            id: 'diamond_tools',
            title: 'Diamond Power',
            description: 'Craft a diamond pickaxe or diamond sword.',
            iconItem: IDS.DIAMOND_PICKAXE,
            badge: 'Hard',
            difficulty: 'Hard'
        },

        // --- MASTER TIER ---
        {
            id: 'covert_with_diamonds',
            title: 'Cover Me With Diamonds',
            description: 'Forge and equip a complete set of Diamond Armor (Helmet, Chest, Legs, Boots).',
            iconItem: IDS.CHESTPLATE_DIAMOND,
            badge: 'Master',
            difficulty: 'Master'
        },
        {
            id: 'armored_tank',
            title: 'Juggernaut',
            description: 'Reach maximum armor defense rating and deflect high monster damage.',
            iconItem: IDS.HELMET_DIAMOND,
            badge: 'Master',
            difficulty: 'Master'
        },
        {
            id: 'master_crafter',
            title: 'Master Crafter',
            description: 'Craft 20 different items and tools at the Crafting Table.',
            iconItem: IDS.CRAFTING_TABLE,
            badge: 'Master',
            difficulty: 'Master'
        },
        {
            id: 'deep_abyss',
            title: 'The Bottom of the World',
            description: 'Descend to the deepest lava-filled bedrock abyss.',
            iconItem: IDS.LAVA_BUCKET,
            badge: 'Master',
            difficulty: 'Master'
        },
        {
            id: 'apex_predator',
            title: 'Apex Predator',
            description: 'Slay 15 monsters under the dangerous moonlight.',
            iconItem: IDS.DIAMOND_SWORD,
            badge: 'Master',
            difficulty: 'Master'
        },
        {
            id: 'completionist',
            title: 'Webcraft Overlord',
            description: 'Unlock at least 25 milestones to cement your legacy in 2D block history.',
            iconItem: IDS.DIAMOND,
            badge: 'Master',
            difficulty: 'Master'
        }
    ];

    export let currentAchievementsTab = 'sp';
    export let openedAchievementsFromPause = false;
    export let currentWorldAchievementsEnabled = true;
    export let monstersKilledCount = 0;
    export let deepBlocksMinedCount = 0;
    export let craftedItemsCount = 0;

    export function updateNewWorldAchievementWarning() {
        const starter = document.getElementById('new-world-starter-items')?.checked;
        const keep = document.getElementById('new-world-keep-inventory')?.checked;
        const warning = document.getElementById('new-world-achievement-warning');
        if (warning) {
            if (starter || keep) {
                warning.classList.remove('hidden');
                let reason = starter && keep ? 'Starter Items and Keep Inventory' : (starter ? 'Starter Items' : 'Keep Inventory');
                warning.innerHTML = `⚠️ <span class="font-bold text-yellow-400">Achievements Disabled:</span> Starting with ${reason} disables achievements in this world. Disable both options to earn achievements.`;
            } else {
                warning.classList.add('hidden');
            }
        }
    }

    export function updateMpAchievementWarning() {
        const starter = document.getElementById('mp-starter-items')?.checked;
        const keep = document.getElementById('mp-keep-inventory')?.checked;
        const warning = document.getElementById('mp-achievement-warning');
        if (warning) {
            if (starter || keep) {
                warning.classList.remove('hidden');
                let reason = starter && keep ? 'Starter Items and Keep Inventory' : (starter ? 'Starter Items' : 'Keep Inventory');
                warning.innerHTML = `⚠️ <span class="font-bold text-yellow-400">Achievements Disabled:</span> Starting with ${reason} disables achievements in this multiplayer room. Disable both options to earn achievements.`;
            } else {
                warning.classList.add('hidden');
            }
        }
    }

    export function getAchievementsStorage(mode = 'sp') {
        const key = mode === 'mp' ? 'webcraft_achievements_mp' : 'webcraft_achievements_sp';
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    export function saveAchievementsStorage(mode, data) {
        const key = mode === 'mp' ? 'webcraft_achievements_mp' : 'webcraft_achievements_sp';
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error("Failed to save achievements", e);
        }
    }

    export let selectedAchDifficultyFilter = 'all';

    export function filterAchievementsByDiff(diff) {
        selectedAchDifficultyFilter = diff;
        document.querySelectorAll('.ach-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.diff === diff);
        });
        renderAchievementsList();
    }

    export function unlockAchievement(achId) {
        if (!currentWorldAchievementsEnabled) return;

        // Achievements and Emerald rewards are exclusively granted to registered Webcraft accounts
        loadUserProfile();
        const isGuest = !currentUserProfile || currentUserProfile.isGuest;
        if (isGuest) {
            return;
        }

        const ach = ACHIEVEMENTS.find(a => a.id === achId);
        if (!ach) return;

        const mode = isMultiplayer ? 'mp' : 'sp';
        const data = getAchievementsStorage(mode);
        if (data[achId]) return;

        data[achId] = Date.now();
        saveAchievementsStorage(mode, data);

        // One-time Emerald reward granting (cannot be re-earned even if achievements are reset)
        const claimed = getClaimedAchievementRewards();
        let rewardGranted = 0;
        if (!claimed.includes(achId)) {
            rewardGranted = getAchievementEmeraldReward(ach);
            claimed.push(achId);
            localStorage.setItem('swc_claimed_achievements_v1', JSON.stringify(claimed));
            addPlayerEmeralds(rewardGranted);
        }

        showAchievementBanner(ach, mode, rewardGranted);


        // Multiplayer room chat broadcast via WebRTC
        const user = window.user || window.fbAuth?.currentUser;
        if (isMultiplayer && currentMpRoom && user) {
            const msgId = `sys_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const chatPacket = {
                type: 'chat',
                id: msgId,
                uid: user.uid,
                playerName: (playerName || 'Player').slice(0, 16),
                text: `${playerName || 'Player'} has earned the achievement [${ach.title}]!${rewardGranted ? ` (+${rewardGranted} Emeralds)` : ''}`,
                isSystem: true,
                timestamp: Date.now()
            };
            broadcastDataPacket(chatPacket);
            appendChatMessage(chatPacket, false);
        }

        if (Object.keys(data).length >= 25 && !data['completionist']) {
            unlockAchievement('completionist');
        }

        const modal = document.getElementById('achievements-modal');
        if (modal && !modal.classList.contains('hidden')) {
            renderAchievementsList();
        }
    }

    export function showAchievementBanner(ach, mode, reward = 0) {
        const container = document.getElementById('achievement-toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'achievement-toast';

        const iconFrame = document.createElement('div');
        iconFrame.className = 'achievement-icon-frame';
        if (textures[ach.iconItem]) {
            const img = document.createElement('img');
            img.src = textures[ach.iconItem].src;
            img.className = 'w-7 h-7 pixelated';
            iconFrame.appendChild(img);
        }
        toast.appendChild(iconFrame);

        const content = document.createElement('div');
        content.className = 'flex flex-col min-w-0';

        const rewardTag = reward > 0 ? ` (+${reward} Emeralds)` : '';
        const header = document.createElement('span');
        header.className = "text-base text-[var(--mc-accent-color)] font-bold font-['VT323'] tracking-wide leading-none uppercase";
        header.innerText = `Achievement Get! (${mode === 'mp' ? 'Multiplayer' : 'Singleplayer'})${rewardTag}`;
        content.appendChild(header);

        const title = document.createElement('span');
        title.className = "text-2xl text-white font-bold font-['VT323'] text-shadow truncate leading-tight";
        title.innerText = ach.title;
        content.appendChild(title);

        toast.appendChild(content);
        container.appendChild(toast);

        if (typeof playSound === 'function') {
            playSound('craft', { vol: 1.0 });
        }

        setTimeout(() => {
            toast.classList.add('dismissing');
            setTimeout(() => {
                if (toast.parentElement) toast.remove();
            }, 360);
        }, 4000);
    }

    export function openAchievements(initialTab = null) {
        if (initialTab) {
            currentAchievementsTab = initialTab;
        } else {
            currentAchievementsTab = isMultiplayer ? 'mp' : 'sp';
        }
        openedAchievementsFromPause = false;
        document.getElementById('achievements-modal').classList.remove('hidden');
        switchAchievementTab(currentAchievementsTab);
    }

    export function openAchievementsFromPause() {
        openedAchievementsFromPause = true;
        document.getElementById('pause-menu').classList.add('hidden');
        openAchievements(isMultiplayer ? 'mp' : 'sp');
    }

    export function closeAchievements() {
        document.getElementById('achievements-modal').classList.add('hidden');
        if (openedAchievementsFromPause && STATE === 'PAUSED') {
            document.getElementById('pause-menu').classList.remove('hidden');
        }
        openedAchievementsFromPause = false;
    }

    export function resetAchievements(mode = currentAchievementsTab) {
        const modeName = mode === 'mp' ? 'Multiplayer' : 'Singleplayer';
        if (!confirm(`Reset all ${modeName} achievements? Note: Emerald rewards already claimed will not be awarded again!`)) return;
        const key = mode === 'mp' ? 'webcraft_achievements_mp' : 'webcraft_achievements_sp';
        localStorage.removeItem(key);
        renderAchievementsList();
        showToast(`${modeName} achievements reset.`);
    }

    export function switchAchievementTab(tab) {
        currentAchievementsTab = tab;
        const btnSp = document.getElementById('ach-tab-sp');
        const btnMp = document.getElementById('ach-tab-mp');
        if (btnSp) btnSp.classList.toggle('active', tab === 'sp');
        if (btnMp) btnMp.classList.toggle('active', tab === 'mp');

        const desc = document.getElementById('ach-mode-description');
        if (desc) {
            if (tab === 'sp') {
                desc.innerText = "Achievements earned in Singleplayer worlds. Independent from Multiplayer milestones.";
            } else {
                desc.innerText = "Achievements earned in Multiplayer rooms. Independent from Singleplayer milestones.";
            }
        }

        renderAchievementsList();
    }

    export function formatAchievementDate(timestamp) {
        if (!timestamp) return '';
        const d = new Date(timestamp);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const m = months[d.getMonth()];
        const day = d.getDate();
        const y = d.getFullYear();
        const h = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${day} ${m} ${y}, ${h}:${min}`;
    }

    export function renderAchievementsList() {
        const list = document.getElementById('achievements-list');
        if (!list) return;
        list.innerHTML = '';

        loadUserProfile();
        const isGuest = !currentUserProfile || currentUserProfile.isGuest;
        const guestBanner = document.getElementById('ach-guest-banner');
        if (guestBanner) {
            guestBanner.classList.toggle('hidden', !isGuest);
        }

        const spData = getAchievementsStorage('sp');
        const mpData = getAchievementsStorage('mp');

        const spCount = Object.keys(spData).length;
        const mpCount = Object.keys(mpData).length;
        const total = ACHIEVEMENTS.length;

        const countSpEl = document.getElementById('ach-count-sp');
        const countMpEl = document.getElementById('ach-count-mp');
        if (countSpEl) countSpEl.innerText = `${spCount}/${total}`;
        if (countMpEl) countMpEl.innerText = `${mpCount}/${total}`;

        const activeData = currentAchievementsTab === 'mp' ? mpData : spData;
        const activeCount = currentAchievementsTab === 'mp' ? mpCount : spCount;
        const percent = Math.round((activeCount / total) * 100);

        const badge = document.getElementById('achievements-progress-badge');
        if (badge) badge.innerText = `${activeCount} / ${total} (${percent}%)`;

        const frag = document.createDocumentFragment();
        const filteredList = selectedAchDifficultyFilter === 'all' 
            ? ACHIEVEMENTS 
            : ACHIEVEMENTS.filter(a => a.difficulty === selectedAchDifficultyFilter);

        filteredList.forEach(ach => {
            const unlockedAt = activeData[ach.id];
            const isUnlocked = !!unlockedAt;
            const rewardAmt = getAchievementEmeraldReward(ach);
            const claimed = getClaimedAchievementRewards();
            const isClaimed = claimed.includes(ach.id);

            const card = document.createElement('div');
            card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;

            const iconFrame = document.createElement('div');
            iconFrame.className = 'achievement-icon-frame';
            if (textures[ach.iconItem]) {
                const img = document.createElement('img');
                img.src = textures[ach.iconItem].src;
                img.className = 'w-7 h-7 pixelated';
                iconFrame.appendChild(img);
            }
            card.appendChild(iconFrame);

            const info = document.createElement('div');
            info.className = 'flex-1 min-w-0';

            const titleRow = document.createElement('div');
            titleRow.className = 'flex items-center justify-between gap-2';

            const title = document.createElement('span');
            title.className = `text-2xl font-bold font-['VT323'] ${isUnlocked ? 'text-[var(--mc-accent-color)]' : 'text-gray-400'}`;
            title.innerText = ach.title;
            titleRow.appendChild(title);

            const badgeGroup = document.createElement('div');
            badgeGroup.className = 'flex items-center gap-1.5 flex-shrink-0';

            const emeraldBadge = document.createElement('span');
            emeraldBadge.className = 'ach-emerald-badge';
            emeraldBadge.innerHTML = `${getPixelEmeraldSvg(13)} +${rewardAmt}`;
            badgeGroup.appendChild(emeraldBadge);

            const diffClass = ach.difficulty === 'Easy' ? 'ach-badge-easy'
                : ach.difficulty === 'Medium' ? 'ach-badge-medium'
                : ach.difficulty === 'Hard' ? 'ach-badge-hard'
                : 'ach-badge-master';

            const badgeTag = document.createElement('span');
            badgeTag.className = `text-sm font-['VT323'] px-2 py-0.5 border ${diffClass}`;
            badgeTag.innerText = ach.badge || ach.difficulty;
            badgeGroup.appendChild(badgeTag);

            titleRow.appendChild(badgeGroup);
            info.appendChild(titleRow);

            const desc = document.createElement('p');
            desc.className = "text-base text-gray-300 font-['VT323'] m-0 leading-tight mt-0.5";
            desc.innerText = ach.description;
            info.appendChild(desc);

            const statusRow = document.createElement('div');
            statusRow.className = 'mt-1 text-sm font-["VT323"] flex items-center gap-1.5 flex-wrap';
            if (isUnlocked) {
                statusRow.innerHTML = `<span class="text-green-400 font-bold">✓ Unlocked:</span> <span class="text-gray-300">${formatAchievementDate(unlockedAt)}</span> ${isClaimed ? `<span class="text-[#4eed99] font-bold ml-1 font-['VT323'] text-sm inline-flex items-center gap-0.5">[+${rewardAmt} ${getPixelEmeraldSvg(12)} Claimed]</span>` : ''}`;
            } else {
                const guestNotice = isGuest ? ` <span class="text-amber-400 font-bold ml-1">(Guest - Log in to earn)</span>` : '';
                statusRow.innerHTML = `<span class="text-gray-500 font-bold">🔒 Locked</span> <span class="text-gray-600">(${currentAchievementsTab === 'mp' ? 'Multiplayer' : 'Singleplayer'})</span>${guestNotice}`;
            }
            info.appendChild(statusRow);

            card.appendChild(info);
            frag.appendChild(card);
        });

        list.appendChild(frag);
    }

    // Multiplayer Chat System
    export let isChatOpen = false;
    export let chatSeenMessageIds = new Set();

    export function initChatEvents() {
        const input = document.getElementById('mp-chat-input');
        if (!input || input.dataset.bound) return;
        input.dataset.bound = 'true';
        input.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
                e.preventDefault();
                sendCurrentChatMessage();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeChat();
            }
        });
    }

    export function openChat(initialText = '') {
        if (!isMultiplayer || STATE !== 'PLAYING' || isInventoryOpen || isWorldMapOpen) return;
        isChatOpen = true;
        keys = {};
        const container = document.getElementById('mp-chat-container');
        const inputBar = document.getElementById('mp-chat-input-bar');
        const input = document.getElementById('mp-chat-input');
        const msgBox = document.getElementById('mp-chat-messages');

        if (container) {
            container.classList.remove('hidden');
            container.classList.add('chat-active');
        }
        if (msgBox) {
            msgBox.classList.add('chat-open-mode');
            msgBox.scrollTop = msgBox.scrollHeight;
        }
        if (inputBar) inputBar.classList.remove('hidden');
        if (input) {
            input.value = initialText;
            setTimeout(() => {
                input.focus();
                if (initialText) input.setSelectionRange(initialText.length, initialText.length);
            }, 20);
        }
    }

    export function closeChat() {
        isChatOpen = false;
        const container = document.getElementById('mp-chat-container');
        const inputBar = document.getElementById('mp-chat-input-bar');
        const input = document.getElementById('mp-chat-input');
        const msgBox = document.getElementById('mp-chat-messages');

        if (input) {
            input.value = '';
            input.blur();
        }
        if (inputBar) inputBar.classList.add('hidden');
        if (container) container.classList.remove('chat-active');
        if (msgBox) {
            msgBox.classList.remove('chat-open-mode');
            Array.from(msgBox.children).forEach(child => {
                if (child.dataset.receivedAt && Date.now() - Number(child.dataset.receivedAt) >= 8000) {
                    child.classList.add('faded');
                }
            });
        }
    }

    export function sendCurrentChatMessage() {
        const input = document.getElementById('mp-chat-input');
        if (!input) return;
        const raw = input.value.trim();
        const user = window.user || window.fbAuth?.currentUser;
        if (!raw || !isMultiplayer || !currentMpRoom || !user) {
            closeChat();
            return;
        }
        const cleanText = raw.slice(0, 120);
        const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const chatPacket = {
            type: 'chat',
            id: msgId,
            uid: user.uid,
            playerName: (playerName || 'Player').slice(0, 16),
            text: cleanText,
            isSystem: false,
            timestamp: Date.now()
        };
        broadcastDataPacket(chatPacket);
        appendChatMessage(chatPacket, false);
        closeChat();
    }

    export function appendChatMessage(msg, playSound = true) {
        const container = document.getElementById('mp-chat-messages');
        const chatWrapper = document.getElementById('mp-chat-container');
        if (!container) return;

        if (chatWrapper) chatWrapper.classList.remove('hidden');

        const row = document.createElement('div');
        row.className = 'chat-message-row';
        row.dataset.receivedAt = String(Date.now());

        if (msg.isSystem) {
            const span = document.createElement('span');
            span.className = 'chat-system-msg';
            span.innerText = msg.text;
            row.appendChild(span);
        } else {
            const author = document.createElement('span');
            author.className = 'chat-author';
            author.innerText = `<${msg.playerName || 'Player'}>`;

            const text = document.createElement('span');
            text.className = 'chat-text';
            text.innerText = ` ${msg.text}`;

            row.appendChild(author);
            row.appendChild(text);
        }

        container.appendChild(row);
        while (container.children.length > 60) {
            container.removeChild(container.firstChild);
        }
        container.scrollTop = container.scrollHeight;

        if (playSound) playChatChime();

        setTimeout(() => {
            if (!isChatOpen && row.parentElement) {
                row.classList.add('faded');
            }
        }, 8000);
    }

    export function playChatChime() {
        try {
            let ctx = getAudioContext();
            if (ctx) {
                let osc = ctx.createOscillator();
                let gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(660, ctx.currentTime);
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
            }
        } catch(e) {}
    }

    export function updateTutorialUI() {
        const tutorial = document.getElementById('tutorial-text');
        if (!tutorial) return;
        const mpExtra = isMultiplayer ? " | 'T' for Chat" : "";
        tutorial.innerHTML = `
            <p class="text-white drop-shadow">WASD/Arrows: Move | Space: Jump</p>
            <p class="text-white drop-shadow">Hold L-Click: Mine/Attack | R-Click: Place/Interact</p>
            <p class="text-yellow-400 font-bold drop-shadow mt-0.5">Press 'E' for Inventory${mpExtra} | 'M' for Map | 'F3' for Debug</p>
        `;
    }

    export let craftingCategory = 'all';

    export function getRecipeCategory(recipe) {
        if (recipe.category) return recipe.category;
        if (isArmor(recipe.output.id)) return 'armor';
        if (isTool(recipe.output.id)) return 'tools';
        if ([IDS.GOLD_INGOT, IDS.IRON_INGOT, IDS.DIAMOND].includes(recipe.output.id)) return 'materials';
        if ([IDS.BUCKET, IDS.WATER_BUCKET, IDS.LAVA_BUCKET].includes(recipe.output.id)) return 'utility';
        if ([IDS.PLANKS, IDS.CRAFTING_TABLE, IDS.FURNACE, IDS.BED, IDS.DOOR, IDS.CHEST].includes(recipe.output.id)) return 'blocks';
        return 'utility';
    }

    export function setCraftingCategory(category) {
        craftingCategory = category;
        document.querySelectorAll('#crafting-categories button').forEach(button => button.classList.toggle('active', button.dataset.category === category));
        renderCraftingRecipes();
    }

    export function isTool(id) {
        return [IDS.WOOD_PICKAXE, IDS.STONE_PICKAXE, IDS.IRON_PICKAXE, IDS.GOLD_PICKAXE, IDS.DIAMOND_PICKAXE, IDS.WOOD_SWORD, IDS.STONE_SWORD, IDS.IRON_SWORD, IDS.GOLD_SWORD, IDS.DIAMOND_SWORD, IDS.WOOD_AXE, IDS.STONE_AXE, IDS.IRON_AXE, IDS.GOLD_AXE, IDS.DIAMOND_AXE].includes(id);
    }

    export function ensureToolDurability(item) {
        if (!item || !TOOL_DURABILITY[item.id]) return item;
        const maxDurability = TOOL_DURABILITY[item.id];
        item.maxDurability = maxDurability;
        if (!Number.isFinite(item.durability)) item.durability = maxDurability;
        item.durability = Math.max(0, Math.min(maxDurability, item.durability));
        return item;
    }

    export function addDurabilityBar(slot, item) {
        if (!item || !TOOL_DURABILITY[item.id]) return;
        ensureToolDurability(item);
        const bar = document.createElement('div');
        bar.className = 'durability-bar';
        const fill = document.createElement('div');
        fill.className = 'durability-fill';
        fill.style.width = `${(item.durability / item.maxDurability) * 100}%`;
        bar.appendChild(fill);
        slot.appendChild(bar);
    }

    export function damageSelectedTool(amount = 1) {
        const item = inventory[selectedHotbarIndex];
        if (!item || !TOOL_DURABILITY[item.id]) return;
        ensureToolDurability(item);
        item.durability -= amount;
        if (item.durability <= 0) {
            inventory[selectedHotbarIndex] = null;
            showToast('Your tool broke!');
        }
        updateUI();
    }

    export function giveItem(id, amount = 1) {
        let initialAmount = amount;
        for (let i = 0; i < 27; i++) { 
            if (inventory[i] && inventory[i].id === id && inventory[i].count < 64 && !isTool(id)) {
                let space = 64 - inventory[i].count;
                let add = Math.min(space, amount);
                inventory[i].count += add; amount -= add;
                if (amount <= 0) break;
            }
        }
        if (amount > 0) {
            for (let i = 0; i < 27; i++) { 
                if (!inventory[i]) { inventory[i] = { id: id, count: amount }; ensureToolDurability(inventory[i]); amount = 0; break; }
            }
        }
        if (amount > 0 && STATE === 'PLAYING') {
            dropItemForWorld(id, player.x + player.width / 2, player.y + 10, amount);
            amount = 0;
        }
        if (initialAmount > 0) {
            if (id === IDS.WOOD) unlockAchievement('getting_wood');
            else if (id === IDS.IRON_INGOT) unlockAchievement('acquire_hardware');
            else if (id === IDS.DIAMOND) unlockAchievement('diamonds');
            else if (id === IDS.SEEDS) unlockAchievement('time_to_farm');
            else if (id === IDS.FLOWER_RED || id === IDS.FLOWER_YELLOW) unlockAchievement('wild_florist');
            else if (id === IDS.COOKED_PORKCHOP || id === IDS.COOKED_CHICKEN || id === IDS.COOKED_MUTTON) unlockAchievement('delicious_fish');
            else if (id === IDS.GOLD_INGOT) unlockAchievement('shiny_bling');
        }
        if(STATE==='PLAYING' && !isInventoryOpen) updateUI();
        return amount === 0; 
    }

    export function canFitItem(id, amount) {
        let capacity = 0;
        for (let i = 0; i < 27; i++) {
            if (inventory[i] && inventory[i].id === id && !isTool(id)) capacity += Math.max(0, 64 - inventory[i].count);
            else if (!inventory[i]) capacity += isTool(id) ? 1 : 64;
            if (capacity >= amount) return true;
        }
        return false;
    }

    export function hasItem(id, amount) {
        let count = 0;
        for (let i = 0; i < 27; i++) { if (inventory[i] && inventory[i].id === id) count += inventory[i].count; }
        return count >= amount;
    }

    export function consumeItem(id, amount) {
        for (let i = 0; i < 27; i++) {
            if (inventory[i] && inventory[i].id === id) {
                if (inventory[i].count >= amount) {
                    inventory[i].count -= amount;
                    if (inventory[i].count === 0) inventory[i] = null;
                    return true;
                } else { amount -= inventory[i].count; inventory[i] = null; }
            }
        }
        return false;
    }


    export function craftRecipe(recipeIndex) {
        const recipe = RECIPES[recipeIndex];
        let canCraft = recipe.inputs.every(req => hasItem(req.id, req.count));
        const outputFits = canFitItem(recipe.output.id, recipe.output.count);
        if (canCraft && !outputFits && isMultiplayer && !isMultiplayerAuthority() && pendingDropRequest) return;
        if (canCraft) {
            recipe.inputs.forEach(req => consumeItem(req.id, req.count));
            if (!outputFits) {
                dropItemForWorld(recipe.output.id, player.x + player.width / 2, player.y, recipe.output.count);
            } else {
                giveItem(recipe.output.id, recipe.output.count);
            }
            craftedItemsCount = (craftedItemsCount || 0) + 1;
            if (craftedItemsCount >= 20) unlockAchievement('master_crafter');

            if (recipe.output.id === IDS.CRAFTING_TABLE) unlockAchievement('benchmarking');
            else if (recipe.output.id === IDS.WOOD_PICKAXE) unlockAchievement('time_to_mine');
            else if (recipe.output.id === IDS.FURNACE) unlockAchievement('hot_topic');
            else if (recipe.output.id === IDS.WOOD_SWORD) unlockAchievement('time_to_strike');
            else if (recipe.output.id === IDS.LADDER) unlockAchievement('ladder_climber');
            else if (recipe.output.id === IDS.WOODEN_STAIRS || recipe.output.id === IDS.COBBLESTONE_STAIRS) unlockAchievement('stairway_heaven');
            else if (recipe.output.id === IDS.IRON_PICKAXE) unlockAchievement('iron_age');
            else if (recipe.output.id === IDS.BUCKET) unlockAchievement('bucket_brigade');
            else if (recipe.output.id === IDS.DIAMOND_PICKAXE || recipe.output.id === IDS.DIAMOND_SWORD || recipe.output.id === IDS.DIAMOND_AXE) unlockAchievement('diamond_tools');
            else if (recipe.output.id === IDS.GOLD_PICKAXE || recipe.output.id === IDS.GOLD_SWORD || recipe.output.id === IDS.GOLD_AXE) unlockAchievement('shiny_bling');
            if (isArmor(recipe.output.id)) {
                unlockAchievement('suit_up');
                if (recipe.output.id === IDS.HELMET_GOLD || recipe.output.id === IDS.CHESTPLATE_GOLD || recipe.output.id === IDS.LEGGINGS_GOLD || recipe.output.id === IDS.BOOTS_GOLD) {
                    unlockAchievement('shiny_bling');
                }
            }
        }
    }


    export function selectDifficulty(diffKey) {
        selectedDiffChoice = diffKey;
        document.querySelectorAll('#diff-selector .diff-btn').forEach(btn => {
            if (btn.dataset.diff === diffKey) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        document.getElementById('diff-desc').innerText = diffDescriptions[diffKey];
        const keepInventoryInput = document.getElementById('new-world-keep-inventory');
        const keepInventoryLabel = document.getElementById('new-world-keep-inventory-label');
        keepInventoryInput.disabled = diffKey === 'hardcore';
        keepInventoryLabel.style.opacity = diffKey === 'hardcore' ? '0.55' : '1';
        if (diffKey === 'hardcore') keepInventoryInput.checked = false;
        updateNewWorldAchievementWarning();
    }

    export function openWhatsNewOnce() {
        if (whatsNewShownThisLoad || !whatsNewStartupEnabled) return;
        whatsNewShownThisLoad = true;
        openWhatsNew();
    }

    export function updateWhatsNewStartupToggle() {
        const toggleButton = document.getElementById('whats-new-startup-toggle');
        if (!toggleButton) return;
        toggleButton.innerText = `Startup: ${whatsNewStartupEnabled ? 'ON' : 'OFF'}`;
        toggleButton.setAttribute('aria-pressed', String(whatsNewStartupEnabled));
        toggleButton.setAttribute('aria-label', `${whatsNewStartupEnabled ? 'Disable' : 'Enable'} What's New on startup`);
    }

    export function toggleWhatsNewStartup() {
        whatsNewStartupEnabled = !whatsNewStartupEnabled;
        localStorage.setItem('swc_whats_new_startup_enabled', whatsNewStartupEnabled ? 'true' : 'false');
        updateWhatsNewStartupToggle();
    }

    export function renderPatchNoteList(items) {
        return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
    }

    export function renderWhatsNewHistory() {
        const entriesRoot = document.getElementById('whats-new-entries');
        if (!entriesRoot) return;

        const latestEntry = (Array.isArray(UPDATE_HISTORY_LOGS) && UPDATE_HISTORY_LOGS.length > 0)
            ? UPDATE_HISTORY_LOGS[0]
            : (typeof LATEST_PATCH_NOTES !== 'undefined' ? LATEST_PATCH_NOTES : null);
        if (!latestEntry) return;

        entriesRoot.innerHTML = '';
        const latestArticle = document.createElement('article');
        latestArticle.className = 'news-entry is-newest';
        latestArticle.innerHTML = `
            <div class="news-entry-header">
                <h3>${latestEntry.title}</h3>
                <span class="news-badge">NEW</span>
            </div>
            ${renderPatchNoteList(latestEntry.items)}
        `;
        entriesRoot.appendChild(latestArticle);
    }

    export function openWhatsNew() {
        updateWhatsNewStartupToggle();
        renderWhatsNewHistory();
        const confetti = document.getElementById('whats-new-confetti');
        const confettiColors = ['#f6d64a', '#55c7e8', '#ef6b73', '#8bd17c', '#f2a65a'];
        if (confetti) {
            confetti.innerHTML = '';
            for (let index = 0; index < 36; index++) {
                const piece = document.createElement('span');
                piece.className = 'confetti-piece';
                piece.style.left = `${8 + Math.random() * 84}%`;
                piece.style.top = `${8 + Math.random() * 76}%`;
                piece.style.width = `${6 + Math.floor(Math.random() * 3) * 2}px`;
                piece.style.height = `${6 + Math.floor(Math.random() * 3) * 2}px`;
                piece.style.backgroundColor = confettiColors[index % confettiColors.length];
                piece.style.setProperty('--confetti-drift', `${Math.round((Math.random() - 0.5) * 44)}px`);
                piece.style.setProperty('--confetti-rotation', `${Math.round((Math.random() - 0.5) * 90)}deg`);
                piece.style.animationDelay = `${Math.random() * 0.35}s`;
                confetti.appendChild(piece);
            }
        }
        document.getElementById('whats-new-modal').classList.remove('hidden');
    }

    export function closeWhatsNew() {
        document.getElementById('whats-new-modal').classList.add('hidden');
    }

    export const whatsNewModalBackdrop = document.getElementById('whats-new-modal');
    if (whatsNewModalBackdrop) {
        whatsNewModalBackdrop.addEventListener('click', (e) => {
            if (e.target === whatsNewModalBackdrop) closeWhatsNew();
        });
    }

    export function showKickModal(reason) {
        const kickModal = document.getElementById('kick-modal');
        const kickMessage = document.getElementById('kick-message');
        if (!kickModal || !kickMessage) return;
        kickMessage.innerText = reason || 'You were kicked from the server.';
        kickModal.classList.remove('hidden');
    }

    export function dismissKickModal() {
        const kickModal = document.getElementById('kick-modal');
        if (kickModal) kickModal.classList.add('hidden');
        if (window.user && currentMpRoom) {
            mpUnsubscribers.forEach(u => u()); mpUnsubscribers = [];
        }
        isMultiplayer = false;
        remotePlayers = {};
        mpPeerIds = new Set(); lastWorldSyncTime = 0; lastWorldStateTimestamp = 0; mpPlayerSyncPending = false; mpWorldSyncPending = false; pendingDropRequest = null; isSleeping = false; sleepWakeVersion = 0; currentMpWorldName = null; currentMpRoom = null;
        STATE = 'MENU';
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('death-menu').classList.add('hidden');
        document.getElementById('hud').style.display = 'none';
        document.getElementById('gameCanvas').classList.add('hidden');
        document.getElementById('shared-menu-bg').classList.remove('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        document.getElementById('multiplayer-modal').classList.add('hidden');
        openMultiplayerMenu();
    }

    // =========================================================================
    // WEBCRAFT USER PROFILE & AUTHENTICATION CONTROLLER
    // =========================================================================

    export function loadUserProfile() {
        try {
            const raw = localStorage.getItem('webcraft_user_profile');
            if (raw) {
                currentUserProfile = JSON.parse(raw);
                if (currentUserProfile && currentUserProfile.username) {
                    localStorage.setItem('swc_player_name', currentUserProfile.username);
                }
            }
        } catch (e) {
            console.warn("Could not load user profile from localStorage", e);
        }
    }

    export function checkProfileOnStartup() {
        loadUserProfile();
        const menuButtons = document.getElementById('main-menu-buttons');
        if (!currentUserProfile && !authModalHasBeenDismissedThisSession) {
            // First time or not connected: hide menu buttons and display the welcome auth modal
            if (menuButtons) menuButtons.classList.add('hidden');
            openAuthProfileModal('credentials');
        } else {
            if (menuButtons) menuButtons.classList.remove('hidden');
            updateMainMenuProfileBadge();
        }
    }

    export function updateMainMenuProfileBadge() {
        loadUserProfile();
        const nameEl = document.getElementById('profile-player-name');
        const tagEl = document.getElementById('profile-account-tag');
        const activeName = currentUserProfile?.username || localStorage.getItem('swc_player_name') || 'Player';
        
        if (nameEl) nameEl.innerText = activeName;
        if (tagEl) {
            if (currentUserProfile && !currentUserProfile.isGuest) {
                tagEl.innerText = '● Online';
                tagEl.className = 'profile-tag-pill';
            } else {
                tagEl.innerText = '● Guest';
                tagEl.className = 'profile-tag-pill guest';
            }
        }

        // Draw Player Head on badges and modals
        const canvases = [
            document.getElementById('profile-head-canvas'),
            document.getElementById('auth-preview-head-canvas'),
            document.getElementById('recommend-avatar-canvas'),
            document.getElementById('profile-details-head-canvas')
        ];

        const skinCanvas = (typeof window !== 'undefined' && window.skinCanvasObj) ? window.skinCanvasObj : skinCanvasObj;
        if (skinCanvas) {
            canvases.forEach(cv => {
                if (!cv) return;
                const ctx = cv.getContext('2d');
                ctx.clearRect(0, 0, cv.width, cv.height);
                ctx.imageSmoothingEnabled = false;
                if (typeof drawPlayerHead === 'function') {
                    drawPlayerHead(ctx, skinCanvas, 0, 0, cv.width);
                }
            });
        }
    }

    export function openAuthProfileModal(stage = 'credentials') {
        const modal = document.getElementById('auth-profile-modal');
        if (!modal) return;
        modal.classList.remove('hidden');

        const credStage = document.getElementById('auth-stage-credentials');
        const recStage = document.getElementById('auth-stage-recommend');

        if (stage === 'credentials') {
            if (credStage) credStage.classList.remove('hidden');
            if (recStage) recStage.classList.add('hidden');
            switchAuthTab(currentAuthTab || 'signup');
        } else {
            if (credStage) credStage.classList.add('hidden');
            if (recStage) recStage.classList.remove('hidden');
            const recName = document.getElementById('recommend-player-name');
            if (recName) recName.innerText = currentUserProfile?.username || 'Player';
        }
        updateMainMenuProfileBadge();
    }

    export function closeAuthProfileModal() {
        const modal = document.getElementById('auth-profile-modal');
        if (modal) modal.classList.add('hidden');
        const confirmModal = document.getElementById('guest-confirm-modal');
        if (confirmModal) confirmModal.classList.add('hidden');
        const menuButtons = document.getElementById('main-menu-buttons');
        if (menuButtons) menuButtons.classList.remove('hidden');
        authModalHasBeenDismissedThisSession = true;
        updateMainMenuProfileBadge();
    }

    export function promptGuestOnAuthClose() {
        const confirmModal = document.getElementById('guest-confirm-modal');
        if (confirmModal) {
            confirmModal.classList.remove('hidden');
        } else {
            handleAuthSkipToGuest(true);
        }
    }

    export function confirmContinueAsGuest() {
        const confirmModal = document.getElementById('guest-confirm-modal');
        if (confirmModal) confirmModal.classList.add('hidden');
        handleAuthSkipToGuest(true);
    }

    export function cancelGuestPrompt() {
        const confirmModal = document.getElementById('guest-confirm-modal');
        if (confirmModal) confirmModal.classList.add('hidden');
    }

    export function handleUnderConstruction(featureName = 'Multiplayer') {
        const iconSvg = `<svg viewBox="0 0 16 16" width="22" height="22" class="flex-shrink-0" style="image-rendering: pixelated; shape-rendering: crispEdges;">
            <rect x="7" y="11" width="2" height="5" fill="#78350f"/>
            <rect x="8" y="11" width="1" height="5" fill="#451a03"/>
            <rect x="1" y="1" width="14" height="1" fill="#78350f"/>
            <rect x="1" y="10" width="14" height="1" fill="#451a03"/>
            <rect x="1" y="2" width="1" height="8" fill="#78350f"/>
            <rect x="14" y="2" width="1" height="8" fill="#451a03"/>
            <rect x="2" y="2" width="12" height="8" fill="#f59e0b"/>
            <rect x="3" y="2" width="2" height="2" fill="#1e293b"/>
            <rect x="2" y="4" width="2" height="2" fill="#1e293b"/>
            <rect x="7" y="2" width="2" height="2" fill="#1e293b"/>
            <rect x="5" y="4" width="2" height="3" fill="#1e293b"/>
            <rect x="3" y="7" width="2" height="3" fill="#1e293b"/>
            <rect x="11" y="2" width="2" height="2" fill="#1e293b"/>
            <rect x="9" y="4" width="2" height="3" fill="#1e293b"/>
            <rect x="7" y="7" width="2" height="3" fill="#1e293b"/>
            <rect x="11" y="7" width="2" height="3" fill="#1e293b"/>
        </svg>`;
        showToast(`${featureName} is currently Under Construction!`, iconSvg);
    }

    export function switchAuthTab(tab) {
        currentAuthTab = tab;
        ['signup', 'login', 'guest'].forEach(t => {
            const btn = document.getElementById(`auth-tab-${t}`);
            if (btn) btn.classList.toggle('active', t === tab);
        });

        const grpUser = document.getElementById('auth-group-username');
        const grpEmail = document.getElementById('auth-group-email');
        const grpPass = document.getElementById('auth-group-password');
        const submitBtn = document.getElementById('auth-submit-btn');
        const userInput = document.getElementById('auth-input-username');
        const emailInput = document.getElementById('auth-input-email');
        const passInput = document.getElementById('auth-input-password');
        const feedback = document.getElementById('auth-feedback-msg');

        if (feedback) feedback.classList.add('hidden');

        if (tab === 'signup') {
            if (grpUser) grpUser.classList.remove('hidden');
            if (grpEmail) grpEmail.classList.remove('hidden');
            if (grpPass) grpPass.classList.remove('hidden');
            if (userInput) { userInput.required = true; userInput.placeholder = "e.g. SteveCraft"; }
            if (emailInput) emailInput.required = true;
            if (passInput) passInput.required = true;
            if (submitBtn) submitBtn.innerText = "Create Profile & Sign Up";
        } else if (tab === 'login') {
            if (grpUser) grpUser.classList.add('hidden');
            if (grpEmail) grpEmail.classList.remove('hidden');
            if (grpPass) grpPass.classList.remove('hidden');
            if (userInput) userInput.required = false;
            if (emailInput) emailInput.required = true;
            if (passInput) passInput.required = true;
            if (submitBtn) submitBtn.innerText = "Log In to Webcraft";
        } else if (tab === 'guest') {
            if (grpUser) grpUser.classList.remove('hidden');
            if (grpEmail) grpEmail.classList.add('hidden');
            if (grpPass) grpPass.classList.add('hidden');
            if (userInput) { userInput.required = false; userInput.placeholder = "Guest Name (optional)"; }
            if (emailInput) emailInput.required = false;
            if (passInput) passInput.required = false;
            if (submitBtn) submitBtn.innerText = "Continue as Guest";
        }
    }

    export function updateAuthAvatarPreview(name) {
        const previewName = document.getElementById('auth-preview-name-label');
        if (previewName) previewName.innerText = name && name.trim() ? name.trim() : 'Player';
    }

    export function toggleAuthPasswordVisibility() {
        const input = document.getElementById('auth-input-password');
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
    }

    export async function handleAuthSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();
        const feedback = document.getElementById('auth-feedback-msg');
        const submitBtn = document.getElementById('auth-submit-btn');

        const showMsg = (msg, isErr = true) => {
            if (!feedback) return;
            feedback.innerText = msg;
            feedback.className = `auth-feedback mb-3 ${isErr ? 'error' : 'success'}`;
            feedback.classList.remove('hidden');
        };

        const userInput = document.getElementById('auth-input-username');
        const emailInput = document.getElementById('auth-input-email');
        const passInput = document.getElementById('auth-input-password');

        const username = userInput ? userInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const pass = passInput ? passInput.value : '';

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Connecting to Firebase...';
        }

        try {
            if (currentAuthTab === 'signup') {
                if (!username || username.length < 2) throw new Error("Character name must be at least 2 characters.");
                if (!email || !email.includes('@')) throw new Error("Please enter a valid email address.");
                if (!pass || pass.length < 6) throw new Error("Password must be at least 6 characters.");

                const profile = await registerWebcraftAccount(username, email, pass, playerSkinData);
                currentUserProfile = profile;
                showToast(`Profile created! Welcome, ${username}!`);
                openAuthProfileModal('recommend');
            } else if (currentAuthTab === 'login') {
                if (!email || !email.includes('@')) throw new Error("Please enter your account email.");
                if (!pass) throw new Error("Please enter your password.");

                const profile = await loginWebcraftAccount(email, pass);
                currentUserProfile = profile;
                showToast(`Signed in as ${profile.username}!`);
                openAuthProfileModal('recommend');
            } else if (currentAuthTab === 'guest') {
                const profile = await loginAsGuest(username);
                currentUserProfile = profile;
                showToast(`Playing as ${profile.username}!`);
                openAuthProfileModal('recommend');
            }
        } catch (err) {
            console.error("Auth submit error:", err);
            let userMsg = err.message || "Authentication failed. Please check your details.";
            if (userMsg.includes('auth/email-already-in-use')) userMsg = "This email is already registered. Please Log In instead.";
            if (userMsg.includes('auth/invalid-credential') || userMsg.includes('auth/wrong-password') || userMsg.includes('auth/user-not-found')) userMsg = "Incorrect email or password. Please try again.";
            if (userMsg.includes('auth/weak-password')) userMsg = "Password should be at least 6 characters.";
            if (userMsg.includes('auth/invalid-email')) userMsg = "The email address is formatted incorrectly.";
            if (userMsg.includes('auth/operation-not-allowed') || userMsg.includes('operation-not-allowed')) {
                userMsg = "Email/Password provider is not enabled in Firebase Console. (Enable it under Authentication > Sign-in method in Firebase Console).";
            }
            showMsg(userMsg, true);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                if (currentAuthTab === 'signup') submitBtn.innerText = "Create Profile & Sign Up";
                else if (currentAuthTab === 'login') submitBtn.innerText = "Log In to Webcraft";
                else submitBtn.innerText = "Continue as Guest";
            }
        }
    }

    export async function handleAuthSkipToGuest(skipRecommend = false) {
        try {
            const profile = await loginAsGuest();
            currentUserProfile = profile;
            if (skipRecommend) {
                closeAuthProfileModal();
            } else {
                openAuthProfileModal('recommend');
            }
        } catch(e) {
            closeAuthProfileModal();
        }
    }

    export function handleAuthRecommend(action) {
        closeAuthProfileModal();
        if (action === 'maker') {
            openSkinMaker();
        } else if (action === 'shop') {
            openSkins();
            if (typeof switchSkinTab === 'function') switchSkinTab('shop');
        }
        // If action === 'play', closeAuthProfileModal() unhides #main-menu-buttons and loads menu normally!
    }

    export function openProfileDetailsModal() {
        loadUserProfile();
        const modal = document.getElementById('profile-details-modal');
        if (!modal) return;

        const nameEl = document.getElementById('profile-details-name');
        const typeEl = document.getElementById('profile-details-type');
        const emailEl = document.getElementById('profile-details-email');
        const emeraldsEl = document.getElementById('profile-details-emeralds');
        const skinStatusEl = document.getElementById('profile-details-skin-status');

        if (nameEl) nameEl.innerText = currentUserProfile?.username || localStorage.getItem('swc_player_name') || 'Player';
        if (typeEl) typeEl.innerText = currentUserProfile?.isGuest ? 'Guest Session' : 'Firebase Cloud Account';
        if (emailEl) emailEl.innerText = currentUserProfile?.email || 'No email associated (Guest)';
        if (emeraldsEl) emeraldsEl.innerText = document.getElementById('main-menu-emeralds-count')?.innerText || '0';
        if (skinStatusEl) skinStatusEl.innerText = 'Active';

        updateMainMenuProfileBadge();
        modal.classList.remove('hidden');
    }

    export function closeProfileDetailsModal() {
        const modal = document.getElementById('profile-details-modal');
        if (modal) modal.classList.add('hidden');
    }

    export async function handleProfileSignOut() {
        await logoutWebcraftAccount();
        currentUserProfile = null;
        closeProfileDetailsModal();
        openAuthProfileModal('credentials');
    }

    export function showMainMenu() {
        const isMenuInit = (typeof window !== 'undefined' && window.menuWorldInitialized) || menuWorldInitialized;
        const splashEl = document.getElementById('splash-text');
        if (!splashEl || !splashEl.innerText || !isMenuInit) {
            setRandomSplashText();
        }
        document.getElementById('worlds-menu').classList.add('hidden');
        document.getElementById('multiplayer-modal').classList.add('hidden');
        document.getElementById('shared-menu-bg').classList.remove('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        if (!isMenuInit) {
            generateMenuWorld();
        }
        if (typeof drawMenuBackground === 'function') drawMenuBackground();
        if (typeof drawPlayerPreview === 'function') drawPlayerPreview();
        updateMainMenuProfileBadge();
        checkProfileOnStartup();
        openWhatsNewOnce();
    }

    export function finishIntro() {
        if (introTimer) { clearTimeout(introTimer); introTimer = null; }
        const intro = document.getElementById('game-intro');
        if (intro) {
            intro.classList.add('hidden');
            intro.setAttribute('aria-hidden', 'true');
            intro.style.pointerEvents = 'none';
        }
        document.getElementById('main-menu').classList.add('intro-reveal');
        showMainMenu();
        setTimeout(() => {
            const mm = document.getElementById('main-menu');
            if (mm) mm.classList.remove('intro-reveal');
        }, 1500);
    }

    export function advanceIntro() {
        const intro = document.getElementById('game-intro');
        if (!introEnabled || !intro || intro.classList.contains('hidden')) return;
        if (introPhase === 0) {
            introPhase = 1;
            if (introTimer) { clearTimeout(introTimer); introTimer = null; }
            const blackText = document.getElementById('intro-black-text');
            if (blackText) blackText.classList.add('hidden');
            intro.classList.add('message-stage');
            const msgScreen = document.getElementById('intro-message-screen');
            if (msgScreen) msgScreen.classList.add('visible');
            const skipHint = document.getElementById('intro-skip-hint');
            if (skipHint) skipHint.innerText = 'Press SPACE or Click anywhere to enter Webcraft2D';
            introPhaseLockUntil = Date.now() + 700;
            introTimer = setTimeout(advanceIntro, 14000);
        } else {
            if (Date.now() < introPhaseLockUntil) return;
            finishIntro();
        }
    }

    export function startIntro() {
        if (!introEnabled) { showMainMenu(); return; }
        introPhase = 0;
        introPhaseLockUntil = 0;
        const intro = document.getElementById('game-intro');
        if (!intro) { showMainMenu(); return; }
        intro.style.pointerEvents = 'auto';
        intro.onclick = (e) => {
            if (e && e.stopPropagation) e.stopPropagation();
            advanceIntro();
        };
        document.getElementById('main-menu').classList.add('hidden');
        intro.classList.remove('message-stage');
        const blackText = document.getElementById('intro-black-text');
        if (blackText) blackText.classList.remove('hidden');
        const msgScreen = document.getElementById('intro-message-screen');
        if (msgScreen) msgScreen.classList.remove('visible');
        const skipHint = document.getElementById('intro-skip-hint');
        if (skipHint) skipHint.innerText = 'Press SPACE or Click to continue';
        intro.classList.remove('hidden');
        intro.setAttribute('aria-hidden', 'false');
        if (introTimer) clearTimeout(introTimer);
        introTimer = setTimeout(advanceIntro, 3400);
    }

    export function openWorldsMenu() { document.getElementById('main-menu').classList.add('hidden'); document.getElementById('worlds-menu').classList.remove('hidden'); renderWorldsList(); }
    export function closeWorldsMenu() { document.getElementById('worlds-menu').classList.add('hidden'); showMainMenu(); }
    export function getSavedWorlds() { try { return JSON.parse(localStorage.getItem('swc_worlds_list_v5')) || []; } catch(e) { return []; } }
    export function saveWorldsList(list) { try { localStorage.setItem('swc_worlds_list_v5', JSON.stringify(list)); } catch(e) { console.warn('Could not save worlds list', e); } }
    export function clearUnsupportedWorldStorage(activeWorldId) {
        const worlds = getSavedWorlds();
        const validIds = new Set(worlds.map(w => w.id));
        if (activeWorldId) validIds.add(activeWorldId);
        for (let index = localStorage.length - 1; index >= 0; index--) {
            const key = localStorage.key(index);
            if (key && key.startsWith('swc_data_')) {
                const worldId = key.slice('swc_data_'.length);
                if (!validIds.has(worldId)) {
                    localStorage.removeItem(key);
                }
            }
        }
    }

    export function compressWorld(worldData) {
        if (!Array.isArray(worldData) || worldData.length === 0 || !Array.isArray(worldData[0])) return [];
        const width = worldData.length;
        const height = worldData[0].length;
        const compressed = [];
        let currentId = worldData[0][0];
        let count = 0;
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const blockId = worldData[x][y];
                if (blockId === currentId) count++;
                else {
                    compressed.push(currentId, count);
                    currentId = blockId;
                    count = 1;
                }
            }
        }
        compressed.push(currentId, count);
        return compressed;
    }

    export function decompressWorld(compressed, width = WORLD_WIDTH, height = WORLD_HEIGHT) {
        if (!Array.isArray(compressed) || compressed.length % 2 !== 0) throw new Error('Invalid compressed world');
        const restoredWorld = Array.from({ length: width }, () => new Array(height));
        let flatIndex = 0;
        const totalBlocks = width * height;
        for (let index = 0; index < compressed.length; index += 2) {
            const blockId = compressed[index];
            const count = compressed[index + 1];
            if (!Number.isInteger(blockId) || !Number.isInteger(count) || count < 1) throw new Error('Invalid compressed world');
            for (let offset = 0; offset < count; offset++) {
                if (flatIndex >= totalBlocks) throw new Error('Invalid compressed world size');
                const x = Math.floor(flatIndex / height);
                const y = flatIndex % height;
                restoredWorld[x][y] = blockId;
                flatIndex++;
            }
        }
        if (flatIndex !== totalBlocks) throw new Error('Invalid compressed world size: got ' + flatIndex + ', expected ' + totalBlocks);
        return restoredWorld;
    }

    export const MP_CHUNK_SIZE = 32;

    export function compressChunk(worldData, startX, startY, chunkW = MP_CHUNK_SIZE, chunkH = MP_CHUNK_SIZE) {
        if (!Array.isArray(worldData) || worldData.length === 0) return [];
        const compressed = [];
        let currentId = null;
        let count = 0;
        const maxW = Math.min(worldData.length, startX + chunkW);
        const maxH = Math.min(worldData[0]?.length || 0, startY + chunkH);
        for (let x = startX; x < maxW; x++) {
            for (let y = startY; y < maxH; y++) {
                const blockId = worldData[x]?.[y] ?? IDS.AIR;
                if (currentId === null) {
                    currentId = blockId;
                    count = 1;
                } else if (blockId === currentId) {
                    count++;
                } else {
                    compressed.push(currentId, count);
                    currentId = blockId;
                    count = 1;
                }
            }
        }
        if (count > 0 && currentId !== null) compressed.push(currentId, count);
        return compressed;
    }

    export function decompressChunkInto(compressed, targetWorld, startX, startY, chunkW = MP_CHUNK_SIZE, chunkH = MP_CHUNK_SIZE, worldMaxW = WORLD_WIDTH, worldMaxH = WORLD_HEIGHT) {
        if (!Array.isArray(compressed) || compressed.length % 2 !== 0 || !Array.isArray(targetWorld)) return;
        const maxW = Math.min(worldMaxW, startX + chunkW);
        const maxH = Math.min(worldMaxH, startY + chunkH);
        let curX = startX;
        let curY = startY;
        for (let i = 0; i < compressed.length; i += 2) {
            const blockId = compressed[i];
            let count = compressed[i + 1];
            while (count > 0 && curX < maxW) {
                if (!targetWorld[curX]) targetWorld[curX] = new Array(worldMaxH).fill(IDS.AIR);
                targetWorld[curX][curY] = blockId;
                count--;
                curY++;
                if (curY >= maxH) {
                    curY = startY;
                    curX++;
                }
            }
        }
    }

    export function renderWorldsList() {
        const listEl = document.getElementById('worlds-list');
        listEl.innerHTML = '';
        let worlds = getSavedWorlds();
        if(worlds.length === 0) {
            listEl.innerHTML = '<p class="text-gray-400 text-center text-xl py-6 font-bold font-[\'VT323\']">No worlds found. Create one!</p>';
            return;
        }
        worlds.sort((a,b) => b.lastPlayed - a.lastPlayed).forEach(w => {
            let row = document.createElement('div');
            row.className = 'world-row flex justify-between items-center cursor-pointer';
            
            let difficulty = (w.difficulty || 'normal').toLowerCase();
            let diffName = difficulty.toUpperCase();
            let sizeName = (w.worldSize || (w.worldWidth > 700 ? 'big' : 'small')).toUpperCase();
            let isCompatible = (w.gameVersion === GAME_VERSION && w.gameBuild === GAME_BUILD);
            let versionClass = isCompatible ? 'world-badge-version' : 'world-badge-version-invalid';

            let info = document.createElement('div'); info.className = 'world-info flex-1';
            info.innerHTML = `
                <div class="flex items-center gap-2">
                    <p class="world-name text-2xl font-bold font-['VT323'] leading-none truncate">${w.name}</p>
                    <span class="world-badge world-badge-mode font-['VT323']">SURVIVAL</span>
                    <span class="world-badge font-['VT323'] bg-slate-700 text-slate-200">${sizeName}</span>
                    <span class="world-badge world-badge-difficulty-${difficulty} font-['VT323']">${diffName}</span>
                    <span class="world-badge ${versionClass} font-['VT323']">v${w.gameVersion || 'older'}</span>
                    ${!isCompatible ? '<span class="world-badge world-badge-version-invalid font-[\'VT323\']">INCOMPATIBLE</span>' : ''}
                </div>
                <p class="world-meta text-lg font-['VT323'] font-bold mt-0.5">Day ${w.dayCount || 1} • ${new Date(w.lastPlayed).toLocaleString()}</p>
            `;
            if (isCompatible) {
                info.onclick = () => loadWorld(w.id);
            } else {
                info.onclick = () => {
                    showToast(`Cannot play world '${w.name}': Incompatible version (Created in v${w.gameVersion || 'older'}, Client is v${GAME_VERSION}).`);
                };
                row.classList.add('opacity-70');
            }
            
            let btnGroup = document.createElement('div'); btnGroup.className = 'flex gap-1.5';
            let expBtn = document.createElement('button');
            expBtn.className = 'mc-btn !w-12 !p-0.5 !text-xl !m-0 !bg-blue-600 hover:!bg-blue-500 !text-white';
            expBtn.innerText = '↓'; expBtn.title = 'Export World'; expBtn.onclick = (e) => { e.stopPropagation(); exportWorld(w.id, w.name); };
            let delBtn = document.createElement('button');
            delBtn.className = 'mc-btn !w-12 !p-0.5 !text-xl !m-0 !bg-red-600 hover:!bg-red-500 !text-white';
            delBtn.innerText = 'X'; delBtn.title = 'Delete World'; delBtn.onclick = (e) => { e.stopPropagation(); deleteWorld(w.id); };

            btnGroup.appendChild(expBtn); btnGroup.appendChild(delBtn);
            row.appendChild(info); row.appendChild(btnGroup); listEl.appendChild(row);
        });
    }

    export function openNewWorldModal() {
        document.getElementById('new-world-modal').classList.remove('hidden');
        selectDifficulty('normal');
        selectWorldSize('small');
        document.getElementById('new-world-starter-items').checked = true;
        document.getElementById('new-world-keep-inventory').checked = true;
        updateNewWorldAchievementWarning();
        document.getElementById('new-world-name').focus();
    }
    export function closeNewWorldModal() { document.getElementById('new-world-modal').classList.add('hidden'); }

    export function confirmCreateWorld() {
        let name = document.getElementById('new-world-name').value.trim() || "New World";
        closeNewWorldModal();
        
        isMultiplayer = false;
        currentWorldId = 'world_' + Date.now();
        if (typeof setEngineCurrentWorldId === 'function') setEngineCurrentWorldId(currentWorldId);
        currentDifficulty = selectedDiffChoice;
        setWorldDimensions(selectedWorldSizeChoice);
        let starterItems = document.getElementById('new-world-starter-items').checked;
        keepInventory = currentDifficulty !== 'hardcore' && document.getElementById('new-world-keep-inventory').checked;
        currentWorldAchievementsEnabled = (!starterItems && !keepInventory);

        let worlds = getSavedWorlds();
        worlds.push({ id: currentWorldId, name: name, difficulty: currentDifficulty, worldSize: currentWorldSize, worldWidth: WORLD_WIDTH, worldHeight: WORLD_HEIGHT, starterItems, keepInventory, achievementsEnabled: currentWorldAchievementsEnabled, gameVersion: GAME_VERSION, gameBuild: GAME_BUILD, lastPlayed: Date.now(), dayCount: 1 });
        saveWorldsList(worlds);
        
        generateWorld();
        if (typeof window !== 'undefined' && window.world) world = window.world;
        if (typeof window !== 'undefined' && window.surfaceHeights) surfaceHeights = window.surfaceHeights;
        if (typeof setEngineWorld === 'function') setEngineWorld(world);
        if (typeof setEngineSurfaceHeights === 'function') setEngineSurfaceHeights(surfaceHeights);
        
        const spawn = getInitialSpawnPoint();
        if (!player) player = (typeof window !== 'undefined' && window.player) ? window.player : new Player(spawn.x, spawn.y);
        player.x = spawn.x; player.y = spawn.y;
        player.fallStartY = spawn.y;
        player.isGrounded = true;
        player.health = player.maxHealth; player.hunger = 20; player.exhaustion = 0; player.oxygen = player.maxOxygen;
        player.poisonTimer = 0;
        player.isDead = false; player.vy = 0; player.vx = 0; player.damageCooldown = 60;
        if (typeof setEnginePlayer === 'function') setEnginePlayer(player);
        
        entities = []; furnaces = []; timeOfDay = 0.15; dayCount = 1; frameCount = 0;
        let initialAnimals = Math.min(getMaxAnimals(), Math.floor(getMaxAnimals() * 0.7));
        const centerSpawnX = Math.floor(spawn.x / TILE_SIZE);
        const curSurfaces = (typeof window !== 'undefined' && window.surfaceHeights && window.surfaceHeights.length === WORLD_WIDTH) ? window.surfaceHeights : ((surfaceHeights && surfaceHeights.length === WORLD_WIDTH) ? surfaceHeights : []);
        const curWorld = (typeof window !== 'undefined' && window.world && window.world.length === WORLD_WIDTH) ? window.world : (world || []);
        for (let i = 0; i < initialAnimals; i++) {
            // Evenly segment the world to guarantee nice, widespread distribution
            let segmentMin = Math.floor(15 + (i / initialAnimals) * (WORLD_WIDTH - 30));
            let segmentMax = Math.floor(15 + ((i + 1) / initialAnimals) * (WORLD_WIDTH - 30));
            let rx = Math.floor(segmentMin + Math.random() * Math.max(1, segmentMax - segmentMin));
            // Ensure animal is at least 25 tiles away from the player's immediate spawn spot
            if (Math.abs(rx - centerSpawnX) < 25) {
                rx = (rx < centerSpawnX) ? Math.max(5, centerSpawnX - 28) : Math.min(WORLD_WIDTH - 6, centerSpawnX + 28);
            }
            let ry = curSurfaces[rx] !== undefined ? curSurfaces[rx] : Math.floor(WORLD_HEIGHT / 2);
            if (ry < WORLD_HEIGHT && curWorld[rx] && (curWorld[rx][ry] === IDS.GRASS || curWorld[rx][ry] === IDS.SNOW || curWorld[rx][ry] === IDS.DIRT)) {
                let roll = Math.random();
                let animal;
                if (roll < 0.40) animal = new Sheep(rx * TILE_SIZE, (ry - 2) * TILE_SIZE);
                else if (roll < 0.72) animal = new Pig(rx * TILE_SIZE, (ry - 2) * TILE_SIZE);
                else animal = new Chicken(rx * TILE_SIZE, (ry - 2) * TILE_SIZE);
                entities.push(animal);
            }
        }
        if (typeof setEngineEntities === 'function') setEngineEntities(entities);
        inventory.fill(null);
        equippedArmor = [null, null, null, null];
        if (typeof setEngineInventory === 'function') setEngineInventory(inventory);
        if (typeof setEngineEquippedArmor === 'function') setEngineEquippedArmor(equippedArmor);
        if (starterItems) {
            giveItem(IDS.WOOD_AXE, 1); giveItem(IDS.WOOD_PICKAXE, 1); giveItem(IDS.WOOD, 32); giveItem(IDS.RAW_PORKCHOP, 5); giveItem(IDS.TORCH, 16);
        }
        updateArmorUI();
        updateHudArmorBar();
        saveCurrentWorld();
        
        document.getElementById('btn-quit-to-menu').innerText = "Save & Quit to Title";
        document.getElementById('room-indicator').classList.add('hidden');

        const isFirstTime = typeof localStorage !== 'undefined' && !localStorage.getItem('webcraft_tutorial_seen');
        if (isFirstTime) {
            openTutorialModal(0, {
                onboarding: true,
                onComplete: () => {
                    const loadingScreen = document.getElementById('loading-screen');
                    if (loadingScreen) loadingScreen.classList.add('hidden');
                    if (typeof hideSingleplayerLoading === 'function') hideSingleplayerLoading();
                    startGameplay();
                }
            });
        } else {
            startGameplay();
        }
    }

    export function saveCurrentWorld(forceSaveMp = false) {
        if((isMultiplayer && !forceSaveMp) || !currentWorldId) return false;
        let worlds = getSavedWorlds();
        let wInfo = worlds.find(w => w.id === currentWorldId);
        if(wInfo) { wInfo.lastPlayed = Date.now(); wInfo.dayCount = dayCount; wInfo.difficulty = currentDifficulty; wInfo.gameVersion = GAME_VERSION; wInfo.gameBuild = GAME_BUILD; wInfo.achievementsEnabled = currentWorldAchievementsEnabled; }
        
        const liveWorld = (typeof window !== 'undefined' && window.world) ? window.world : world;
        const liveBgWorld = (typeof window !== 'undefined' && window.bgWorld) ? window.bgWorld : bgWorld;
        const livePlayer = (typeof window !== 'undefined' && window.player) ? window.player : player;
        const liveEntities = (typeof window !== 'undefined' && Array.isArray(window.entities)) ? window.entities : entities;
        const liveInventory = (typeof window !== 'undefined' && Array.isArray(window.inventory)) ? window.inventory : inventory;
        const liveEquippedArmor = (typeof window !== 'undefined' && Array.isArray(window.equippedArmor)) ? window.equippedArmor : equippedArmor;

        let saveData = {
            worldSize: currentWorldSize, worldWidth: WORLD_WIDTH, worldHeight: WORLD_HEIGHT,
            worldRle: compressWorld(liveWorld), bgWorldRle: compressWorld(liveBgWorld), fluids: Object.fromEntries(fluids), timeOfDay: timeOfDay, dayCount: dayCount, frameCount: frameCount, difficulty: currentDifficulty, keepInventory, achievementsEnabled: currentWorldAchievementsEnabled, gameVersion: GAME_VERSION, gameBuild: GAME_BUILD,
            player: { x: livePlayer.x, y: livePlayer.y, health: livePlayer.health, hunger: livePlayer.hunger, exhaustion: livePlayer.exhaustion, oxygen: livePlayer.oxygen, poisonTimer: livePlayer.poisonTimer || 0, facingRight: livePlayer.facingRight },
            inventory: liveInventory, equippedArmor: liveEquippedArmor, furnaces: furnaces,
            chests: Object.fromEntries(chests),
            saplingGrowthQueue: Object.fromEntries(saplingGrowthQueue),
            dirtToGrassQueue: Object.fromEntries(dirtToGrassQueue),
            snowRegrowthQueue: Object.fromEntries(snowRegrowthQueue),
            treeWoodCells: [...nonCollidableTreeWood],
            entities: liveEntities.map(e => ({ type: e.constructor.name, x: e.x, y: e.y, health: e.health, dir: e.dir || 1 }))
        };
        const serializedSaveData = JSON.stringify(saveData);
        try {
            saveWorldsList(worlds);
            localStorage.setItem('swc_data_' + currentWorldId, serializedSaveData);
            return true;
        } catch(e) {
            try {
                clearUnsupportedWorldStorage(currentWorldId);
                localStorage.setItem('swc_data_' + currentWorldId, serializedSaveData);
                return true;
            } catch(retryError) {
                console.error('World save failed', retryError);
                showToast('World could not be saved. Browser storage is full or blocked.');
                return false;
            }
        }
    }

    export let lastAutosaveTimestamp = Date.now();

    export function showAutosaveToast(isMp = false) {
        const container = document.getElementById('autosave-toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'autosave-toast';

        // Pixel art cassette tape badge
        const badge = document.createElement('div');
        badge.className = 'autosave-icon-badge';
        badge.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="16" viewBox="0 0 22 16" shape-rendering="crispEdges">
            <path fill="#0f172a" d="M1 0h20v1H1zM0 1h22v14H0zM1 15h20v1H1z"/>
            <path fill="#334155" d="M1 1h20v1H1zM1 1h1v14H1z"/>
            <path fill="#e2e8f0" d="M3 3h16v8H3z"/>
            <path fill="#22c55e" d="M3 4h16v2H3z"/>
            <path fill="#0f172a" d="M6 7h10v3H6z"/>
            <path fill="#ffffff" d="M7 8h2v1H7zM13 8h2v1H13z"/>
            <path fill="#0f172a" d="M5 12h12v2H5z"/>
            <path fill="#475569" d="M6 13h10v1H6z"/>
            <path fill="#94a3b8" d="M1 1h1v1H1zM20 1h1v1H20zM1 14h1v1H1zM20 14h1v1H20z"/>
        </svg>`;
        toast.appendChild(badge);

        const textWrap = document.createElement('div');
        textWrap.className = 'flex flex-col min-w-0';

        const titleRow = document.createElement('div');
        titleRow.className = 'flex items-center leading-none';

        const title = document.createElement('span');
        title.className = 'text-xl font-bold text-[#4ade80] tracking-wide';
        title.innerText = isMp ? 'MULTIPLAYER SAVED' : 'WORLD AUTOSAVED';
        titleRow.appendChild(title);

        textWrap.appendChild(titleRow);

        const sub = document.createElement('span');
        sub.className = 'text-base text-gray-300 leading-tight truncate';
        sub.innerText = isMp ? 'Synced & saved progress' : 'Progress saved safely';
        textWrap.appendChild(sub);

        toast.appendChild(textWrap);
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('dismissing');
            setTimeout(() => {
                if (toast.parentElement) toast.remove();
            }, 350);
        }, 2800);
    }

    export function performWorldAutosave() {
        if (STATE !== 'PLAYING') return;
        
        let saved = false;
        if (!isMultiplayer) {
            if (currentWorldId) {
                saved = saveCurrentWorld();
            }
            if (saved) {
                showAutosaveToast(false);
            }
        } else {
            // Multiplayer world cloud autosave
            if (isMultiplayerAuthority()) {
                currentAutosaveBroadcastId = `as_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                syncMultiplayerWorldState(true);
                if (currentWorldId) {
                    saveCurrentWorld(true);
                }
                showAutosaveToast(true);
            }
            if (window.user && currentMpRoom) {
                syncLocalPlayerState(true);
            }
        }
    }

    export function checkAutosave(now = Date.now()) {
        if (STATE !== 'PLAYING') return;
        if (now - lastAutosaveTimestamp >= 60000) { // 1 minute (60,000 ms)
            lastAutosaveTimestamp = now;
            performWorldAutosave();
        }
    }

    export function exportWorld(id, name) {
        let rawData = localStorage.getItem('swc_data_' + id);
        if (!rawData) return;
        let worlds = getSavedWorlds(); let wInfo = worlds.find(w => w.id === id);
        let exportData = { metadata: wInfo, gameData: JSON.parse(rawData) };
        let blob = new Blob([JSON.stringify(exportData)], {type: "application/json"});
        let url = URL.createObjectURL(blob);
        let a = document.createElement('a'); a.href = url;
        a.download = `webcraft2d_world_${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    export function importWorld(event) {
        let file = event.target.files[0];
        if (!file) return;
        let reader = new FileReader();
        reader.onload = function(e) {
            try {
                let data = JSON.parse(e.target.result);
                if (!data.metadata || !data.gameData) throw new Error("Invalid world format");
                let impVersion = data.metadata.gameVersion || data.gameData.gameVersion;
                let impBuild = data.metadata.gameBuild || data.gameData.gameBuild;
                if (impVersion !== GAME_VERSION || impBuild !== GAME_BUILD) {
                    showToast(`Cannot import world: Incompatible version (File is v${impVersion || 'older'}, Client is v${GAME_VERSION}).`);
                    event.target.value = '';
                    return;
                }
                let newId = 'world_' + Date.now();
                let worlds = getSavedWorlds();
                let newInfo = data.metadata; newInfo.id = newId; newInfo.name = newInfo.name + " (Imported)"; newInfo.lastPlayed = Date.now();
                worlds.push(newInfo); saveWorldsList(worlds);
                localStorage.setItem('swc_data_' + newId, JSON.stringify(data.gameData));
                renderWorldsList();
                showToast("World imported!");
            } catch(err) { console.error(err); showToast("Error importing corrupted world data!"); }
            event.target.value = ''; 
        };
        reader.readAsText(file);
    }

    export function loadWorld(id) {
        const worldInfo = getSavedWorlds().find(world => world.id === id);
        if (worldInfo && (worldInfo.gameVersion !== GAME_VERSION || worldInfo.gameBuild !== GAME_BUILD)) {
            showToast(`Cannot open world '${worldInfo.name}': Incompatible version (World is v${worldInfo.gameVersion || 'older'}, Client is v${GAME_VERSION}).`);
            return;
        }
        showSingleplayerLoading(worldInfo?.name);
        setMultiplayerLoadingStatus('Reading save data', 34);
        setTimeout(() => {
            setMultiplayerLoadingStatus('Generating terrain', 58);
            setTimeout(() => loadWorldData(id), 260);
        }, 120);
    }

    export function showSingleplayerLoading(text = 'Loading world...') {
        const screen = document.getElementById('loading-screen');
        const status = document.getElementById('multiplayer-loading-status');
        const title = document.getElementById('multiplayer-loading-title');
        if (title) title.innerText = 'Loading World';
        if (status) status.innerText = text;
        if (screen) screen.classList.remove('hidden');
    }

    export function hideSingleplayerLoading() {
        const screen = document.getElementById('loading-screen');
        if (screen) screen.classList.add('hidden');
    }

    export function loadWorldData(id) {
        let raw = localStorage.getItem('swc_data_' + id);
        if(!raw) { hideSingleplayerLoading(); showToast('This world has no saved game data.'); return; }
        currentWorldId = id; isMultiplayer = false;
        if (typeof setEngineCurrentWorldId === 'function') setEngineCurrentWorldId(currentWorldId);
        try {
            let data = JSON.parse(raw);
            if (data.gameVersion !== GAME_VERSION || data.gameBuild !== GAME_BUILD) {
                currentWorldId = null;
                if (typeof setEngineCurrentWorldId === 'function') setEngineCurrentWorldId(null);
                hideSingleplayerLoading();
                showToast(`Cannot open world: Incompatible version (World is v${data.gameVersion || 'older'}, Client is v${GAME_VERSION}).`);
                return;
            }
            
            // 1. Determine world dimensions first before decompression
            let targetSize = data.worldSize;
            let targetWidth = data.worldWidth || (targetSize === 'big' ? 1024 : 512);
            let targetHeight = data.worldHeight || (targetSize === 'big' ? 320 : 256);
            if (!targetSize) {
                targetSize = targetWidth > 700 ? 'big' : 'small';
            }
            setWorldDimensions(targetSize);

            // 2. Decompress world with explicit dimensions
            let restoredWorld = null;
            if (data.worldRle) {
                restoredWorld = decompressWorld(data.worldRle, targetWidth, targetHeight);
            } else if (Array.isArray(data.world)) {
                restoredWorld = data.world;
            }

            if (!Array.isArray(restoredWorld) || restoredWorld.length !== WORLD_WIDTH || !data.player) {
                currentWorldId = null;
                if (typeof setEngineCurrentWorldId === 'function') setEngineCurrentWorldId(null);
                hideSingleplayerLoading();
                showToast('This world save is incomplete or corrupted.');
                return;
            }

            world = restoredWorld; window.world = world;
            if (typeof setEngineWorld === 'function') setEngineWorld(world);
            if (data.bgWorldRle) {
                bgWorld = decompressWorld(data.bgWorldRle, targetWidth, targetHeight);
                let naturalCount = 0;
                for (let x = 0; x < WORLD_WIDTH; x++) {
                    for (let y = 0; y < WORLD_HEIGHT; y++) {
                        const bgB = bgWorld[x]?.[y];
                        if (bgB === IDS.SAND || bgB === IDS.DIRT || bgB === IDS.STONE || bgB === IDS.GRASS || bgB === IDS.SNOW) {
                            naturalCount++;
                        }
                    }
                }
                if (naturalCount > 50) {
                    for (let x = 0; x < WORLD_WIDTH; x++) {
                        for (let y = 0; y < WORLD_HEIGHT; y++) {
                            const bgB = bgWorld[x]?.[y];
                            if (bgB === IDS.SAND || bgB === IDS.DIRT || bgB === IDS.STONE || bgB === IDS.GRASS || bgB === IDS.SNOW) {
                                bgWorld[x][y] = IDS.AIR;
                            }
                        }
                    }
                }
                window.bgWorld = bgWorld;
            } else {
                bgWorld = Array.from({ length: WORLD_WIDTH }, () => Array(WORLD_HEIGHT).fill(IDS.AIR)); window.bgWorld = bgWorld;
            }
            if (typeof setEngineBgWorld === 'function') setEngineBgWorld(bgWorld);
            if (typeof toggleBackgroundBuildMode === 'function') toggleBackgroundBuildMode(false);
            fluids = new Map(Object.entries(data.fluids || {}));
            if (typeof setEngineFluids === 'function') setEngineFluids(fluids);
            
            // 3. Rebuild surfaceHeights properly from the restored world blocks
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
            window.surfaceHeights = surfaceHeights;
            if (typeof setEngineSurfaceHeights === 'function') setEngineSurfaceHeights(surfaceHeights);

            timeOfDay = data.timeOfDay !== undefined ? data.timeOfDay : 0.2;
            dayCount = data.dayCount || 1;
            frameCount = data.frameCount || 0;
            saplingGrowthQueue = new Map(Object.entries(data.saplingGrowthQueue || {}).map(([key, growthAt]) => [key, Number(growthAt)]).filter(([, growthAt]) => Number.isFinite(growthAt)));
            dirtToGrassQueue = new Map(Object.entries(data.dirtToGrassQueue || {}).map(([key, growAt]) => [key, Number(growAt)]).filter(([, growAt]) => Number.isFinite(growAt)));
            snowRegrowthQueue = new Map(Object.entries(data.snowRegrowthQueue || {}).map(([key, regrowAt]) => [key, Number(regrowAt)]).filter(([, regrowAt]) => Number.isFinite(regrowAt)));
            currentDifficulty = data.difficulty || 'normal';
            keepInventory = currentDifficulty !== 'hardcore' && data.keepInventory === true;
            currentWorldAchievementsEnabled = data.achievementsEnabled !== undefined ? data.achievementsEnabled : (data.starterItems !== true && data.keepInventory !== true);
            
            // 4. Validate & safely position player
            if (!player) player = (typeof window !== 'undefined' && window.player) ? window.player : new Player(0, 0);
            if (Number.isFinite(data.player.x) && Number.isFinite(data.player.y)) {
                player.x = Math.max(10, Math.min(data.player.x, WORLD_WIDTH * TILE_SIZE - player.width - 10));
                player.y = Math.max(0, Math.min(data.player.y, WORLD_HEIGHT * TILE_SIZE - player.height));
            } else {
                const spawn = getInitialSpawnPoint();
                player.x = spawn.x;
                player.y = spawn.y;
            }
            player.fallStartY = player.y;
            player.isGrounded = true;
            player.health = data.player.health || player.maxHealth;
            player.hunger = data.player.hunger !== undefined ? data.player.hunger : 20;
            player.oxygen = Number.isFinite(data.player.oxygen) ? data.player.oxygen : player.maxOxygen;
            player.exhaustion = data.player.exhaustion || 0;
            player.poisonTimer = data.player.poisonTimer || 0;
            player.facingRight = data.player.facingRight !== false;
            player.isDead = player.health <= 0;
            player.vy = 0;
            player.vx = 0;
            player.damageCooldown = 60;
            window.player = player;
            if (typeof setEnginePlayer === 'function') setEnginePlayer(player);

            inventory = Array.isArray(data.inventory) ? data.inventory : new Array(INVENTORY_SIZE).fill(null);
            while(inventory.length < INVENTORY_SIZE) inventory.push(null);
            inventory = inventory.map(item => item ? ensureToolDurability(item) : null);
            window.inventory = inventory;
            if (typeof setEngineInventory === 'function') setEngineInventory(inventory);
            
            if (Array.isArray(data.equippedArmor)) {
                equippedArmor = data.equippedArmor.slice(0, 4);
                while (equippedArmor.length < 4) equippedArmor.push(null);
            } else {
                equippedArmor = [null, null, null, null];
            }
            equippedArmor = equippedArmor.map(item => item ? (ensureArmorDurability(item), item) : null);
            window.equippedArmor = equippedArmor;
            if (typeof setEngineEquippedArmor === 'function') setEngineEquippedArmor(equippedArmor);
            updateArmorUI();
            updateHudArmorBar();
            
            furnaces = data.furnaces || [];
            chests = new Map(Object.entries(data.chests || {}).map(([key, value]) => [key, { items: Array.isArray(value.items) ? value.items : new Array(27).fill(null) }]));
            openedChest = null;
            fallingBlocks = [];
            activeProjectiles = [];
            nonCollidableTreeWood = new Set(data.treeWoodCells || []);
            ensureTreeWoodNonCollidable();
            entities = (data.entities || []).map(e => {
                let inst;
                if (e.type === 'Pig') inst = new Pig(e.x, e.y);
                else if (e.type === 'Chicken') inst = new Chicken(e.x, e.y);
                else if (e.type === 'Sheep') inst = new Sheep(e.x, e.y);
                else if (e.type === 'Creeper') inst = new Creeper(e.x, e.y);
                else if (e.type === 'Scorpion') inst = new Scorpion(e.x, e.y);
                else inst = new Zombie(e.x, e.y);
                inst.health = e.health;
                if(inst instanceof Pig || inst instanceof Chicken || inst instanceof Sheep) inst.dir = e.dir;
                return inst;
            });
            ensureDesertScorpions();
            window.entities = entities;
            if (typeof setEngineEntities === 'function') setEngineEntities(entities);
            
            // 5. Update world metadata and upgrade version safely
            let worlds = getSavedWorlds();
            let wInfo = worlds.find(w => w.id === currentWorldId);
            if(wInfo) {
                wInfo.lastPlayed = Date.now();
                wInfo.dayCount = dayCount;
                wInfo.difficulty = currentDifficulty;
                wInfo.worldSize = currentWorldSize;
                wInfo.worldWidth = WORLD_WIDTH;
                wInfo.worldHeight = WORLD_HEIGHT;
                wInfo.gameVersion = GAME_VERSION;
                wInfo.gameBuild = GAME_BUILD;
                saveWorldsList(worlds);
            }
            document.getElementById('btn-quit-to-menu').innerText = "Save & Quit to Title";
            document.getElementById('room-indicator').classList.add('hidden');
            setMultiplayerLoadingStatus('Restoring player', 82);
            saveCurrentWorld();
            setMultiplayerLoadingStatus('Ready', 100);
            startGameplay();
            hideSingleplayerLoading();
        } catch(e) {
            console.error('Failed to load world', e);
            hideSingleplayerLoading();
            showToast("Error loading world: " + (e.message || "Corrupted save"));
        }
    }

    export function deleteWorld(id, prompt = true) {
        if(prompt && !confirm("Delete this world forever?")) return;
        let worlds = getSavedWorlds(); worlds = worlds.filter(w => w.id !== id); saveWorldsList(worlds);
        localStorage.removeItem('swc_data_' + id); renderWorldsList();
    }


    export function openSkins() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('skins-menu').classList.remove('hidden');
        document.getElementById('skin-library').classList.remove('hidden');
        document.getElementById('skin-editor-container').classList.add('hidden');
        const headerBar = document.getElementById('skins-header-bar');
        if (headerBar) { headerBar.classList.remove('max-w-[960px]'); headerBar.classList.add('max-w-[760px]'); }
        const sTitle = document.getElementById('skins-title');
        if (sTitle) { sTitle.classList.remove('hidden'); sTitle.textContent = 'Skins'; }
        switchSkinLibraryTab('mine');
        renderSkinLibrary();
    }
    export function openSkinMaker() {
        editingSkinId = null;
        playerSkinData = getDefaultSkinData();
        const headerBar = document.getElementById('skins-header-bar');
        if (headerBar) { headerBar.classList.remove('max-w-[760px]'); headerBar.classList.add('max-w-[960px]'); }
        const nameInput = document.getElementById('skin-name-input');
        if (nameInput) nameInput.value = '';
        updateSkinEditorTitle();
        document.getElementById('skin-library').classList.add('hidden');
        document.getElementById('skin-editor-container').classList.remove('hidden');
        initSkinEditor();
        resetSkinHistory();
        compileSkinCanvas();
        startSkinAutoSave();
    }
    export function editSkin(skinId) {
        const skin = getSavedSkins().find(savedSkin => savedSkin.id === skinId);
        if (!skin) return;
        editingSkinId = skinId;
        playerSkinData = skin.data.slice();
        const headerBar = document.getElementById('skins-header-bar');
        if (headerBar) { headerBar.classList.remove('max-w-[760px]'); headerBar.classList.add('max-w-[960px]'); }
        const nameInput = document.getElementById('skin-name-input');
        if (nameInput) nameInput.value = skin.name || '';
        updateSkinEditorTitle();
        document.getElementById('skin-library').classList.add('hidden');
        document.getElementById('skin-editor-container').classList.remove('hidden');
        initSkinEditor();
        resetSkinHistory();
        compileSkinCanvas();
        startSkinAutoSave();
    }
    export function deleteSkin(skinId) {
        if (!confirm('Delete this skin?')) return;
        const skins = getSavedSkins().filter(skin => skin.id !== skinId);
        saveSavedSkins(skins);
        if (activeSkinId === skinId) {
            playerSkinData = getDefaultSkinData();
            activeSkinId = 'default';
            localStorage.setItem('swc_active_skin_v1', activeSkinId);
            localStorage.setItem('swc_skin_v5', JSON.stringify(getSkinSaveData()));
            compileSkinCanvas();
        }
        renderSkinLibrary();
        const galleryPanel = document.getElementById('skin-gallery-panel');
        if (galleryPanel && !galleryPanel.classList.contains('hidden')) {
            loadSkinGallery();
        }
    }
    export function closeSkinMaker() {
        clearInterval(skinAutoSaveTimer);
        skinAutoSaveTimer = null;
        document.getElementById('skin-editor-container').classList.add('hidden');
        document.getElementById('skin-library').classList.remove('hidden');
        const headerBar = document.getElementById('skins-header-bar');
        if (headerBar) { headerBar.classList.remove('max-w-[960px]'); headerBar.classList.add('max-w-[760px]'); }
        const sTitle = document.getElementById('skins-title');
        if (sTitle) { sTitle.classList.remove('hidden'); sTitle.textContent = 'Skins'; }
        switchSkinLibraryTab('mine');
        renderSkinLibrary();
    }
    export function closeSkins() {
        closeSkinOwnedModal();
        closeSkinUploadModal();
        document.getElementById('skins-menu').classList.add('hidden');
        showMainMenu();
    }
    
    export function updateGraphicsButton() {
        const btn = document.getElementById('btn-toggle-graphics');
        if (!btn) return;
        if (graphicsMode === 'fabulous') {
            btn.innerHTML = '<span class="pixel-rainbow-text"><span>F</span><span>A</span><span>B</span><span>U</span><span>L</span><span>O</span><span>U</span><span>S</span></span>';
        } else if (graphicsMode === 'advanced') {
            btn.innerText = 'ADVANCED';
        } else {
            btn.innerText = 'BASE';
        }
    }

    export function updateSettingsUI() {
        if (document.getElementById('btn-toggle-clouds')) document.getElementById('btn-toggle-clouds').innerText = showClouds ? "ON" : "OFF";
        if (document.getElementById('btn-toggle-debug')) document.getElementById('btn-toggle-debug').innerText = showDebug ? "ON" : "OFF";
        if (document.getElementById('btn-toggle-tutorial')) document.getElementById('btn-toggle-tutorial').innerText = showTutorial ? "ON" : "OFF";
        if (document.getElementById('btn-toggle-autojump')) document.getElementById('btn-toggle-autojump').innerText = autoJumpEnabled ? "ON" : "OFF";
        if (document.getElementById('btn-toggle-intro')) document.getElementById('btn-toggle-intro').innerText = introEnabled ? "ON" : "OFF";
        if (document.getElementById('btn-toggle-item-popups')) document.getElementById('btn-toggle-item-popups').innerText = showItemPopups ? "ON" : "OFF";
        if (document.getElementById('btn-toggle-screenshake')) document.getElementById('btn-toggle-screenshake').innerText = showScreenShake ? "ON" : "OFF";
        if (document.getElementById('btn-toggle-vignette')) document.getElementById('btn-toggle-vignette').innerText = showVignette ? "ON" : "OFF";
        if (document.getElementById('btn-toggle-shimmer')) document.getElementById('btn-toggle-shimmer').innerText = showHeatShimmer ? "ON" : "OFF";
        if (document.getElementById('btn-toggle-grading')) document.getElementById('btn-toggle-grading').innerText = showBiomeGrading ? "ON" : "OFF";
        if (document.getElementById('btn-toggle-minimap-shape')) document.getElementById('btn-toggle-minimap-shape').innerText = minimapShape === 'circle' ? "CIRCLE" : "SQUARE";
        const accentPreview = document.getElementById('settings-accent-preview');
        if (accentPreview) accentPreview.style.backgroundColor = currentAccentColor;
        const accentLabel = document.getElementById('settings-accent-label');
        if (accentLabel) accentLabel.innerText = currentAccentName;

        // Sliders & audio
        const sMaster = document.getElementById('slider-master-vol');
        if (sMaster) { sMaster.value = Math.round(masterVolume * 100); const b = document.getElementById('badge-master-vol'); if (b) b.innerText = `${sMaster.value}%`; }
        const sSfx = document.getElementById('slider-sfx-vol');
        if (sSfx) { sSfx.value = Math.round(sfxVolume * 100); const b = document.getElementById('badge-sfx-vol'); if (b) b.innerText = `${sSfx.value}%`; }
        const sUi = document.getElementById('slider-ui-vol');
        if (sUi) { sUi.value = Math.round(uiVolume * 100); const b = document.getElementById('badge-ui-vol'); if (b) b.innerText = `${sUi.value}%`; }
        if (document.getElementById('btn-toggle-footsteps')) document.getElementById('btn-toggle-footsteps').innerText = footstepsEnabled ? "ON" : "OFF";
        if (document.getElementById('btn-toggle-mute')) document.getElementById('btn-toggle-mute').innerText = isAudioMuted ? "ON (Muted)" : "OFF (Audio ON)";

        // Controls
        const sSens = document.getElementById('slider-scroll-sens');
        if (sSens) { sSens.value = scrollSensitivity; const b = document.getElementById('badge-scroll-sens'); if (b) b.innerText = `${scrollSensitivity}x`; }
        if (document.getElementById('btn-invert-wheel')) document.getElementById('btn-invert-wheel').innerText = invertScrollWheel ? "Inverted" : "Normal";
        if (document.getElementById('btn-hotbar-wrap')) document.getElementById('btn-hotbar-wrap').innerText = hotbarWrapAround ? "Wrap (1-9)" : "Clamp (1-9)";

        updateGraphicsButton();
        updateKeybindButtonsUI();
        updateSettingsDifficultyUI();
        if (document.getElementById('btn-toggle-fps-cap')) document.getElementById('btn-toggle-fps-cap').innerText = getFpsCapText();
    }

    export function switchSettingsTab(tabName) {
        document.querySelectorAll('.settings-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        document.querySelectorAll('.settings-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `settings-tab-${tabName}`);
        });
    }

    export function startRebinding(action, btnEl) {
        if (rebindingAction && rebindingBtnEl) {
            rebindingBtnEl.classList.remove('waiting');
            rebindingBtnEl.innerText = formatKeyDisplay(KEYBINDS[rebindingAction]);
        }
        rebindingAction = action;
        rebindingBtnEl = btnEl;
        btnEl.classList.add('waiting');
        btnEl.innerText = '> PRESS <';
    }

    export function handleRebindKey(e) {
        if (!rebindingAction || !rebindingBtnEl) return;
        e.preventDefault();
        e.stopPropagation();

        const key = e.key.toLowerCase();
        if (key === 'escape') {
            rebindingBtnEl.classList.remove('waiting');
            rebindingBtnEl.innerText = formatKeyDisplay(KEYBINDS[rebindingAction]);
            rebindingAction = null;
            rebindingBtnEl = null;
            return;
        }

        KEYBINDS[rebindingAction] = key;
        rebindingBtnEl.classList.remove('waiting');
        rebindingBtnEl.innerText = formatKeyDisplay(key);
        rebindingAction = null;
        rebindingBtnEl = null;
        saveCurrentSettings();
    }

    export function resetKeybindsToDefault() {
        KEYBINDS = Object.assign({}, DEFAULT_KEYBINDS);
        saveCurrentSettings();
        updateKeybindButtonsUI();
        showToast('Keybinds reset to default.');
    }

    export function updateKeybindButtonsUI() {
        document.querySelectorAll('.keybind-btn').forEach(btn => {
            const action = btn.dataset.action;
            if (action && KEYBINDS[action] !== undefined) {
                btn.innerText = formatKeyDisplay(KEYBINDS[action]);
                btn.classList.remove('waiting');
            }
        });
    }

    export function updateMasterVolume(val) {
        masterVolume = Number(val) / 100;
        const badge = document.getElementById('badge-master-vol');
        if (badge) badge.innerText = `${val}%`;
        saveCurrentSettings();
    }

    export function updateSfxVolume(val) {
        sfxVolume = Number(val) / 100;
        const badge = document.getElementById('badge-sfx-vol');
        if (badge) badge.innerText = `${val}%`;
        saveCurrentSettings();
    }

    export function updateUiVolume(val) {
        uiVolume = Number(val) / 100;
        const badge = document.getElementById('badge-ui-vol');
        if (badge) badge.innerText = `${val}%`;
        saveCurrentSettings();
    }

    export function toggleFootsteps() {
        footstepsEnabled = !footstepsEnabled;
        const btn = document.getElementById('btn-toggle-footsteps');
        if (btn) btn.innerText = footstepsEnabled ? "ON" : "OFF";
        saveCurrentSettings();
    }

    export function toggleMuteAudio() {
        isAudioMuted = !isAudioMuted;
        const btn = document.getElementById('btn-toggle-mute');
        if (btn) btn.innerText = isAudioMuted ? "ON (Muted)" : "OFF (Audio ON)";
        saveCurrentSettings();
    }

    export function playTestSound() {
        playSound('craft', { vol: 1.0 });
    }

    export function updateScrollSens(val) {
        scrollSensitivity = Number(val);
        const badge = document.getElementById('badge-scroll-sens');
        if (badge) badge.innerText = `${val}x`;
        saveCurrentSettings();
    }

    export function toggleInvertWheel() {
        invertScrollWheel = !invertScrollWheel;
        const btn = document.getElementById('btn-invert-wheel');
        if (btn) btn.innerText = invertScrollWheel ? "Inverted" : "Normal";
        saveCurrentSettings();
    }

    export function toggleHotbarWrap() {
        hotbarWrapAround = !hotbarWrapAround;
        const btn = document.getElementById('btn-hotbar-wrap');
        if (btn) btn.innerText = hotbarWrapAround ? "Wrap (1-9)" : "Clamp (1-9)";
        saveCurrentSettings();
    }

    export function toggleItemPopups() {
        showItemPopups = !showItemPopups;
        const btn = document.getElementById('btn-toggle-item-popups');
        if (btn) btn.innerText = showItemPopups ? "ON" : "OFF";
        saveCurrentSettings();
    }

    export function toggleScreenShake() {
        showScreenShake = !showScreenShake;
        const btn = document.getElementById('btn-toggle-screenshake');
        if (btn) btn.innerText = showScreenShake ? "ON" : "OFF";
        saveCurrentSettings();
    }

    export function toggleVignette() {
        showVignette = !showVignette;
        const btn = document.getElementById('btn-toggle-vignette');
        if (btn) btn.innerText = showVignette ? "ON" : "OFF";
        if (typeof window !== 'undefined') {
            window.showVignette = showVignette;
            if (typeof window.setEngineSetting === 'function') window.setEngineSetting('showVignette', showVignette);
        }
        saveCurrentSettings();
    }

    export function toggleShimmer() {
        showHeatShimmer = !showHeatShimmer;
        const btn = document.getElementById('btn-toggle-shimmer');
        if (btn) btn.innerText = showHeatShimmer ? "ON" : "OFF";
        if (typeof window !== 'undefined') {
            window.showHeatShimmer = showHeatShimmer;
            if (typeof window.setEngineSetting === 'function') window.setEngineSetting('showHeatShimmer', showHeatShimmer);
        }
        saveCurrentSettings();
    }

    export function toggleGrading() {
        showBiomeGrading = !showBiomeGrading;
        const btn = document.getElementById('btn-toggle-grading');
        if (btn) btn.innerText = showBiomeGrading ? "ON" : "OFF";
        if (typeof window !== 'undefined') {
            window.showBiomeGrading = showBiomeGrading;
            if (typeof window.setEngineSetting === 'function') window.setEngineSetting('showBiomeGrading', showBiomeGrading);
        }
        saveCurrentSettings();
    }

    export function openSettings() { 
        settingsPreviousState = STATE;
        if (STATE === 'MENU') {
            document.getElementById('main-menu').classList.add('hidden'); 
        } else {
            document.getElementById('pause-menu').classList.add('hidden');
        }
        document.getElementById('settings-menu').classList.remove('hidden'); 
        updateSettingsUI();
    }
    export function openSettingsFromPause() {
        settingsPreviousState = 'PAUSED';
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('settings-menu').classList.remove('hidden');
        updateSettingsUI();
    }
    export function openCredits() {
        document.getElementById('settings-menu').classList.add('hidden');
        document.getElementById('credits-modal').classList.remove('hidden');
    }
    export function closeCredits() {
        document.getElementById('credits-modal').classList.add('hidden');
        document.getElementById('settings-menu').classList.remove('hidden');
    }
    export function closeSettings() { 
        document.getElementById('settings-menu').classList.add('hidden'); 
        if (STATE === 'PAUSED' || settingsPreviousState === 'PAUSED' || (STATE === 'PLAYING' && settingsPreviousState !== 'MENU')) {
            document.getElementById('pause-menu').classList.remove('hidden');
            lastRenderTime = performance.now();
            lastFrameTime = performance.now();
        } else {
            showMainMenu(); 
        }
    }

    export function updateSettingsDifficultyUI() {
        const diffRow = document.getElementById('settings-row-difficulty');
        const diffBtn = document.getElementById('btn-settings-difficulty');
        if (!diffRow || !diffBtn) return;

        // ONLY appear when inside an active world
        const inWorld = (STATE === 'PLAYING' || STATE === 'PAUSED' || (currentWorldId !== null && STATE !== 'MENU') || isMultiplayer);
        if (!inWorld) {
            diffRow.style.display = 'none';
            return;
        }
        diffRow.style.display = 'flex';

        if (currentDifficulty === 'hardcore') {
            diffBtn.innerText = 'Hardcore (Locked)';
            diffBtn.disabled = true;
            diffBtn.classList.add('opacity-75', 'cursor-not-allowed');
        } else {
            const diffName = DIFFICULTIES[currentDifficulty]?.name || 'Normal';
            diffBtn.innerText = diffName;
            diffBtn.disabled = false;
            diffBtn.classList.remove('opacity-75', 'cursor-not-allowed');
        }
    }

    export function cycleWorldDifficulty() {
        if (currentDifficulty === 'hardcore') {
            showToast('Difficulty is locked in Hardcore mode');
            return;
        }
        const diffKeys = Object.keys(DIFFICULTIES).filter(k => k !== 'hardcore');
        const currentIndex = diffKeys.indexOf(currentDifficulty);
        const nextIndex = (currentIndex + 1) % diffKeys.length;
        const newDiff = diffKeys[nextIndex];
        
        currentDifficulty = newDiff;
        localStorage.setItem('swc_difficulty', newDiff);
        
        updateSettingsDifficultyUI();

        // If in multiplayer and host, update room difficulty
        if (isMultiplayer && isHost && window.fbDb && window.fbModules && currentMpRoom) {
            const { doc, updateDoc } = window.fbModules;
            updateDoc(doc(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'rooms', currentMpRoom), {
                difficulty: currentDifficulty
            }).catch(() => {});
        }

        showToast(`Difficulty set to ${DIFFICULTIES[newDiff].name}`);
    }


    export function quitToMenu() {
        if (currentWorldId && (STATE === 'PLAYING' || STATE === 'PAUSED')) saveCurrentWorld();
        if (isMultiplayer) {
            const user = window.user || window.fbAuth?.currentUser;
            broadcastDataPacket({ type: 'leave', uid: user?.uid });
            cleanUpPeerConnection();
            mpUnsubscribers.forEach(u => u()); mpUnsubscribers = [];
            isMultiplayer = false;
            remotePlayers = {};
            lastSentSkinData = null; // Force skin re-upload on next connect
            mpPeerIds = new Set(); lastWorldSyncTime = 0; lastWorldStateTimestamp = 0; mpPlayerSyncPending = false; mpPlayerSyncQueued = false; mpWorldSyncPending = false; pendingDropRequest = null; isSleeping = false; sleepWakeVersion = 0; currentMpWorldName = null; currentMpRoom = null;
            closeChat();
            const chatContainer = document.getElementById('mp-chat-container');
            if (chatContainer) chatContainer.classList.add('hidden');
            const chatMessages = document.getElementById('mp-chat-messages');
            if (chatMessages) chatMessages.innerHTML = '';
            chatSeenMessageIds = new Set();
            updateTutorialUI();
        }
        setUIState('MENU');
        if (typeof setEngineState === 'function') setEngineState('MENU');
        document.getElementById('pause-menu').classList.add('hidden'); document.getElementById('death-menu').classList.add('hidden');
        inventory = new Array(INVENTORY_SIZE).fill(null);
        equippedArmor = [null, null, null, null];
        currentWorldId = null;
        player.poisonTimer = 0;
        player.health = player.maxHealth;
        player.hunger = 20;
        player.exhaustion = 0;
        player.oxygen = player.maxOxygen;
        player.isDead = false;
        player.damageCooldown = 0;
        updateArmorUI();
        updateHudArmorBar();
        updateHealthUI();
        updateHungerUI();
        document.getElementById('hud').style.display = 'none'; 
        document.getElementById('gameCanvas').classList.add('hidden');
        document.getElementById('shared-menu-bg').classList.remove('hidden');
        showMainMenu();
        if(isInventoryOpen) toggleInventory();
    }

    window.addEventListener('beforeunload', () => {
        if (isMultiplayer) {
            const user = window.user || window.fbAuth?.currentUser;
            broadcastDataPacket({ type: 'leave', uid: user?.uid });
            cleanUpPeerConnection();
        }
    });

    window.addEventListener('pagehide', () => {
        if (isMultiplayer) {
            const user = window.user || window.fbAuth?.currentUser;
            broadcastDataPacket({ type: 'leave', uid: user?.uid });
            cleanUpPeerConnection();
        }
    });

    export function checkAfkKick() {
        if (!isMultiplayer || STATE !== 'PLAYING') return;
        const afkMs = 5 * 60 * 1000;
        if (Date.now() - lastPlayerActivityAt > afkMs && !document.getElementById('kick-modal').classList.contains('hidden')) return;
        if (Date.now() - lastPlayerActivityAt > afkMs) {
            showKickModal('You were kicked for being AFK for more than 5 minutes.');
            const user = window.user || window.fbAuth?.currentUser;
            broadcastDataPacket({ type: 'leave', uid: user?.uid });
            cleanUpPeerConnection();
            STATE = 'PAUSED';
            return;
        }
    }

    export function respawn() {
        const deathMenu = document.getElementById('death-menu');
        if (deathMenu) deathMenu.classList.add('hidden');
        const hud = document.getElementById('hud');
        if (hud) hud.style.display = 'block';

        const curPlayer = player || (typeof window !== 'undefined' && window.player);
        if (!curPlayer) return;

        const spawn = (typeof getInitialSpawnPoint === 'function') ? getInitialSpawnPoint() : { x: 50 * TILE_SIZE, y: 50 * TILE_SIZE };
        curPlayer.x = spawn.x;
        curPlayer.y = spawn.y;
        curPlayer.vx = 0;
        curPlayer.vy = 0;
        curPlayer.damageCooldown = 60;
        curPlayer.fallStartY = curPlayer.y;
        curPlayer.isGrounded = true;
        curPlayer.health = curPlayer.maxHealth || 20;
        curPlayer.isDead = false;
        curPlayer.hunger = 20;
        curPlayer.exhaustion = 0;
        curPlayer.oxygen = curPlayer.maxOxygen || 10;
        curPlayer.poisonTimer = 0;

        player = curPlayer;
        if (typeof window !== 'undefined') window.player = curPlayer;
        if (typeof setEnginePlayer === 'function') setEnginePlayer(curPlayer);

        const curCanvas = (typeof canvas !== 'undefined' ? canvas : null) || (typeof window !== 'undefined' && window.canvas) || (typeof document !== 'undefined' ? (document.getElementById('game-canvas') || document.getElementById('gameCanvas')) : null);
        const cW = curCanvas ? curCanvas.width : 1280;
        const cH = curCanvas ? curCanvas.height : 720;

        camera.x = curPlayer.x + (curPlayer.width || 24) / 2 - cW / 2;
        camera.y = curPlayer.y + (curPlayer.height || 48) / 2 - cH / 2;
        camera.x = Math.max(-cW / 3, Math.min(camera.x, WORLD_WIDTH * TILE_SIZE - cW + cW / 3));
        camera.y = Math.max(0, Math.min(camera.y, WORLD_HEIGHT * TILE_SIZE - cH));

        caveSkyOpacity = (typeof getPlayerCaveSkyOpacity === 'function') ? getPlayerCaveSkyOpacity() : 0;
        keys = {};

        STATE = 'PLAYING';
        if (typeof window !== 'undefined') window.STATE = 'PLAYING';
        if (typeof setEngineState === 'function') setEngineState('PLAYING');
        if (typeof window.setGameState === 'function') window.setGameState('PLAYING');

        updateHealthUI();
        updateHungerUI();
        updateOxygenUI(false);
        updateArmorUI();
        updateHudArmorBar();
        updateUI();

        if (isMultiplayer && window.user && currentMpRoom) {
            syncLocalPlayerState(true);
        } else if (!isMultiplayer && typeof saveCurrentWorld === 'function') {
            saveCurrentWorld();
        }
    }


    export function toggleClouds() { 
        showClouds = !showClouds; 
        const btn = document.getElementById('btn-toggle-clouds');
        if (btn) btn.innerText = showClouds ? "ON" : "OFF"; 
        if (typeof window !== 'undefined') {
            window.showClouds = showClouds;
            if (typeof window.setEngineSetting === 'function') window.setEngineSetting('showClouds', showClouds);
        }
        saveCurrentSettings();
    }
    export function toggleDebug() {
        showDebug = !showDebug;
        const btn = document.getElementById('btn-toggle-debug');
        if (btn) btn.innerText = showDebug ? "ON" : "OFF";
        const dbg = document.getElementById('debug-info');
        if (dbg) dbg.classList.toggle('hidden', !showDebug);
        if (typeof window !== 'undefined') {
            window.showDebug = showDebug;
            if (typeof window.setEngineSetting === 'function') window.setEngineSetting('showDebug', showDebug);
        }
        saveCurrentSettings();
    }
    export function toggleTutorial() { 
        showTutorial = !showTutorial; 
        const tutorial = document.getElementById('tutorial-text'); 
        if (tutorial) {
            tutorial.classList.toggle('hidden', !showTutorial); 
            tutorial.classList.toggle('tutorial-hidden', !showTutorial); 
        }
        const btn = document.getElementById('btn-toggle-tutorial');
        if (btn) btn.innerText = showTutorial ? "ON" : "OFF"; 
        if (typeof window !== 'undefined') {
            window.showTutorial = showTutorial;
            if (typeof window.setEngineSetting === 'function') window.setEngineSetting('showTutorial', showTutorial);
        }
        saveCurrentSettings();
    }
    export function toggleAutoJump() { 
        autoJumpEnabled = !autoJumpEnabled; 
        const btn = document.getElementById('btn-toggle-autojump');
        if (btn) btn.innerText = autoJumpEnabled ? "ON" : "OFF"; 
        if (typeof window !== 'undefined') {
            window.autoJumpEnabled = autoJumpEnabled;
            if (typeof window.setEngineSetting === 'function') window.setEngineSetting('autoJumpEnabled', autoJumpEnabled);
        }
        saveCurrentSettings();
    }
    export function toggleGraphics() {
        if (graphicsMode === 'base') {
            graphicsMode = 'advanced';
        } else if (graphicsMode === 'advanced') {
            graphicsMode = 'fabulous';
        } else {
            graphicsMode = 'base';
        }
        advancedGraphics = (graphicsMode !== 'base');
        fabulousGraphics = (graphicsMode === 'fabulous');
        if (typeof window !== 'undefined') {
            window.graphicsMode = graphicsMode;
            window.advancedGraphics = advancedGraphics;
            window.fabulousGraphics = fabulousGraphics;
            if (typeof window.setEngineGraphicsMode === 'function') {
                window.setEngineGraphicsMode(graphicsMode);
            }
        }
        localStorage.setItem('swc_graphics_mode', graphicsMode);
        localStorage.setItem('swc_advanced_graphics', advancedGraphics ? 'true' : 'false');
        updateGraphicsButton();
        saveCurrentSettings();
    }
    export function cycleFpsCap() {
        let currentIndex = FPS_CAP_OPTIONS.indexOf(fpsCap);
        if (currentIndex === -1) currentIndex = 0;
        fpsCap = FPS_CAP_OPTIONS[(currentIndex + 1) % FPS_CAP_OPTIONS.length];
        localStorage.setItem('swc_fps_cap', String(fpsCap));
        const btn = document.getElementById('btn-toggle-fps-cap');
        if (btn) btn.innerText = getFpsCapText();
        saveCurrentSettings();
    }
    export function toggleIntro() {
        introEnabled = !introEnabled;
        localStorage.setItem('swc_intro_enabled', introEnabled ? 'true' : 'false');
        const btn = document.getElementById('btn-toggle-intro');
        if (btn) btn.innerText = introEnabled ? "ON" : "OFF";
        saveCurrentSettings();
    }

    export function getMemoryUsageText() {
        if (performance.memory && Number.isFinite(performance.memory.usedJSHeapSize)) {
            const usedMb = performance.memory.usedJSHeapSize / (1024 * 1024);
            const limitMb = performance.memory.jsHeapSizeLimit / (1024 * 1024);
            return `${usedMb.toFixed(1)} MB / ${limitMb.toFixed(0)} MB`;
        }
        return 'Unavailable in this browser';
    }

    export function checkNearCraftingTable() {
        const p = player || (typeof window !== 'undefined' ? window.player : null);
        if (!p) return false;
        let px = Math.floor((p.x + p.width / 2) / TILE_SIZE); 
        let py = Math.floor((p.y + p.height / 2) / TILE_SIZE);
        const w = (typeof world !== 'undefined' && world) || (typeof window !== 'undefined' ? window.world : null);
        if (!w) return false;
        for(let x = px - 3; x <= px + 3; x++) {
            for(let y = py - 3; y <= py + 3; y++) {
                if(x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT && w[x] && w[x][y] === IDS.CRAFTING_TABLE) return true;
            }
        }
        return false;
    }

    export function toggleInventory() {
        isInventoryOpen = !isInventoryOpen;
        if (typeof window !== 'undefined') window.isInventoryOpen = isInventoryOpen;
        if (typeof setEngineIsInventoryOpen === 'function') setEngineIsInventoryOpen(isInventoryOpen);
        const container = document.getElementById('inventory-container');
        if (isInventoryOpen) {
            if (container) container.classList.remove('hidden');
            keys = {};
            updateUI();
            const tip = typeof document !== 'undefined' ? (document.getElementById('item-tooltip') || document.getElementById('tooltip')) : null;
            if (tip) tip.style.display = 'none';
            unlockAchievement('taking_inventory');
        } 
        else {
            if (container) container.classList.add('hidden');
            hotbarWheelLockUntil = performance.now() + 500;
            if (heldItemObj) { 
                if(!giveItem(heldItemObj.id, heldItemObj.count)) { } 
                setHeldItemObj(null); 
                heldItemIndex = -1; 
            }
            openedFurnace = null;
            openedChest = null;
            const searchInput = document.getElementById('crafting-search');
            if (searchInput && document.activeElement === searchInput) {
                searchInput.blur();
            }
        }
        if (typeof MouseEvent !== 'undefined' && typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new MouseEvent('mousemove', {clientX: mouse ? mouse.clientX : 0, clientY: mouse ? mouse.clientY : 0}));
        }
    }

    export function updateHealthUI() {
        const curPlayer = (typeof window !== 'undefined' && window.player) ? window.player : player;
        if (!curPlayer) return;
        const hb = document.getElementById('health-bar');
        if (hb) {
            hb.innerHTML = '';
            let fullHearts = Math.floor(curPlayer.health / 2);
            let hasHalf = (curPlayer.health % 2) === 1;
            let isPoisoned = curPlayer.poisonTimer > 0;
            for (let i = 0; i < 10; i++) { 
                let h = document.createElement('div'); 
                if (i < fullHearts) h.className = isPoisoned ? 'heart heart-poison-full' : 'heart heart-full';
                else if (i === fullHearts && hasHalf) h.className = isPoisoned ? 'heart heart-poison-half' : 'heart heart-half';
                else h.className = 'heart heart-empty';
                hb.appendChild(h); 
            }
        }
        updateHudArmorBar();
    }
    export function updateHungerUI() {
        const curPlayer = (typeof window !== 'undefined' && window.player) ? window.player : player;
        if (!curPlayer) return;
        const hb = document.getElementById('hunger-bar'); 
        if (!hb) return;
        hb.innerHTML = '';
        hb.classList.toggle('shake-ui', curPlayer.hunger === 0);
        let fullShanks = Math.floor(curPlayer.hunger / 2);
        let hasHalf = (curPlayer.hunger % 2) === 1;
        for (let i = 0; i < 10; i++) { 
            let m = document.createElement('div'); 
            if (i < fullShanks) m.className = 'hunger hunger-full';
            else if (i === fullShanks && hasHalf) m.className = 'hunger hunger-half';
            else m.className = 'hunger hunger-empty';
            hb.appendChild(m); 
        }
        updateOxygenUI();
    }
    export function updateOxygenUI(isSubmerged = false) {
        const curPlayer = (typeof window !== 'undefined' && window.player) ? window.player : player;
        if (!curPlayer) return;
        const oxygenBar = document.getElementById('oxygen-bar');
        if (!oxygenBar) return;
        oxygenBar.classList.toggle('visible', isSubmerged || curPlayer.oxygen < curPlayer.maxOxygen);
        oxygenBar.innerHTML = '';
        for (let i = 0; i < curPlayer.maxOxygen; i++) {
            const bubble = document.createElement('div');
            bubble.className = `oxygen-bubble${i < Math.ceil(curPlayer.oxygen) ? '' : ' empty'}`;
            oxygenBar.appendChild(bubble);
        }
    }

    export function triggerHotbarItemPopup() {
        const nameEl = document.getElementById('hotbar-item-name');
        let sel = inventory[selectedHotbarIndex];
        if (hotbarPopupTimeout) clearTimeout(hotbarPopupTimeout);
        if (sel && ID_NAMES[sel.id]) {
            nameEl.innerText = ID_NAMES[sel.id];
            nameEl.style.display = 'block';
            nameEl.style.opacity = '1';
            hotbarPopupTimeout = setTimeout(() => {
                nameEl.style.opacity = '0';
                nameEl.style.display = 'none';
            }, 2000);
        } else {
            nameEl.style.opacity = '0';
            nameEl.style.display = 'none';
        }
    }

    export function getSmeltResult(id) {
        if (id === IDS.RAW_PORKCHOP) return IDS.COOKED_PORKCHOP;
        if (id === IDS.RAW_CHICKEN) return IDS.COOKED_CHICKEN;
        if (id === IDS.RAW_MUTTON) return IDS.COOKED_MUTTON;
        if (id === IDS.GOLD_ORE) return IDS.GOLD_INGOT;
        if (id === IDS.IRON_ORE) return IDS.IRON_INGOT;
        if (id === IDS.COAL_ORE) return IDS.COAL;
        return null;
    }
    export function getFuelValue(id) {
        if (id === IDS.WOOD || id === IDS.PLANKS) return 500;
        if (id === IDS.STICK) return 200;
        if (id === IDS.COAL) return 1800;
        return 0;
    }

    export function updateFurnaceVisual(furnace) {
        if (openedFurnace !== furnace || !isInventoryOpen) return;
        const flame = document.getElementById('f-flame');
        const progress = document.getElementById('f-prog');
        flame.style.height = furnace.maxBurnTime > 0 ? `${Math.round((furnace.burnTime / furnace.maxBurnTime) * 100)}%` : '0%';
        progress.style.width = `${Math.min(100, Math.round((furnace.progress / 200) * 100))}%`;
    }

    export function moveItemToContainer(sourceItem, targetArray, startIndex = 0, endIndex = targetArray.length) {
        if (!sourceItem || sourceItem.count <= 0) return true;
        const maxStack = isTool(sourceItem.id) ? 1 : 64;

        // Pass 1: Smart Stacking into existing non-full matching stacks
        if (maxStack > 1) {
            for (let i = startIndex; i < endIndex; i++) {
                const target = targetArray[i];
                if (target && target.id === sourceItem.id && target.count < maxStack) {
                    const space = maxStack - target.count;
                    const toMove = Math.min(space, sourceItem.count);
                    target.count += toMove;
                    sourceItem.count -= toMove;
                    if (sourceItem.count <= 0) return true;
                }
            }
        }

        // Pass 2: Place remaining into first available empty slots
        for (let i = startIndex; i < endIndex; i++) {
            if (!targetArray[i]) {
                const toMove = Math.min(maxStack, sourceItem.count);
                targetArray[i] = {
                    id: sourceItem.id,
                    count: toMove,
                    ...(sourceItem.durability !== undefined ? { durability: sourceItem.durability, maxDurability: sourceItem.maxDurability } : {})
                };
                sourceItem.count -= toMove;
                if (sourceItem.count <= 0) return true;
            }
        }

        return sourceItem.count <= 0;
    }

    export function handleSlotClick(index, type, isShift, isRightClick = false) {
        const containerItems = type === 'inv' ? inventory : type === 'chest' ? openedChest?.chest.items : openedFurnace;
        if (!containerItems) return;
        let currentItem = containerItems[index];
        
        if (isShift && currentItem && !heldItemObj && !isRightClick) {
            if (openedChest) {
                if (type === 'inv') {
                    moveItemToContainer(currentItem, openedChest.chest.items, 0, openedChest.size);
                    if (currentItem.count <= 0) containerItems[index] = null;
                } else if (type === 'chest') {
                    let done = moveItemToContainer(currentItem, inventory, 0, 9);
                    if (!done && currentItem.count > 0) {
                        moveItemToContainer(currentItem, inventory, 9, 27);
                    }
                    if (currentItem.count <= 0) containerItems[index] = null;
                }
                syncChest(openedChest.key);
                if (!isMultiplayer) saveCurrentWorld();
            } else if (openedFurnace) {
                if (type === 'inv') {
                    if (getSmeltResult(currentItem.id)) {
                        let fInput = openedFurnace.input;
                        if (!fInput) {
                            openedFurnace.input = { id: currentItem.id, count: currentItem.count };
                            containerItems[index] = null;
                        } else if (fInput.id === currentItem.id && fInput.count < 64) {
                            let space = 64 - fInput.count;
                            let add = Math.min(space, currentItem.count);
                            fInput.count += add;
                            currentItem.count -= add;
                            if (currentItem.count <= 0) containerItems[index] = null;
                        }
                    } else if (getFuelValue(currentItem.id)) {
                        let fFuel = openedFurnace.fuel;
                        if (!fFuel) {
                            openedFurnace.fuel = { id: currentItem.id, count: currentItem.count };
                            containerItems[index] = null;
                        } else if (fFuel.id === currentItem.id && fFuel.count < 64) {
                            let space = 64 - fFuel.count;
                            let add = Math.min(space, currentItem.count);
                            fFuel.count += add;
                            currentItem.count -= add;
                            if (currentItem.count <= 0) containerItems[index] = null;
                        }
                    }
                } else if (type === 'furnace') {
                    let done = moveItemToContainer(currentItem, inventory, 0, 9);
                    if (!done && currentItem.count > 0) {
                        moveItemToContainer(currentItem, inventory, 9, 27);
                    }
                    if (currentItem.count <= 0) containerItems[index] = null;
                }
            } else {
                if (type === 'inv') {
                    if (isArmor(currentItem.id)) {
                        const slotIdx = getArmorSlotIndex(currentItem.id);
                        if (slotIdx !== -1) {
                            const oldPiece = equippedArmor[slotIdx];
                            equippedArmor[slotIdx] = currentItem;
                            containerItems[index] = oldPiece;
                            playSound('pop');
                            checkArmorAchievements();
                            updateArmorUI();
                            updateUI();
                            return;
                        }
                    } else if (currentItem.id === IDS.TORCH && index !== 27 && !inventory[27]) {
                        inventory[27] = currentItem;
                        containerItems[index] = null;
                        playSound('pop');
                        updateUI();
                        updateArmorUI();
                        return;
                    }
                    let tStart = (index < 9 || index === 27) ? 9 : 0; 
                    let tEnd = (index < 9 || index === 27) ? 27 : 9;
                    moveItemToContainer(currentItem, inventory, tStart, tEnd);
                    if (currentItem.count <= 0) containerItems[index] = null;
                }
            }
        } else {
            if (!heldItemObj) {
                if (currentItem) {
                    if (isRightClick && currentItem.count > 1) {
                        let half = Math.ceil(currentItem.count / 2); let rem = currentItem.count - half;
                        heldItemObj = { id: currentItem.id, count: half, ...(currentItem.durability !== undefined ? { durability: currentItem.durability, maxDurability: currentItem.maxDurability } : {}) };
                        currentItem.count = rem;
                    } else {
                        heldItemObj = currentItem;
                        containerItems[index] = null;
                    }
                }
            } else {
                if (currentItem) {
                    if (currentItem.id === heldItemObj.id && !isTool(currentItem.id) && currentItem.count < 64) {
                        if (isRightClick) {
                            currentItem.count += 1; heldItemObj.count -= 1;
                            if (heldItemObj.count <= 0) heldItemObj = null;
                        } else {
                            let space = 64 - currentItem.count; let amount = Math.min(space, heldItemObj.count);
                            currentItem.count += amount; heldItemObj.count -= amount;
                            if (heldItemObj.count <= 0) heldItemObj = null;
                        }
                    } else if (!isRightClick) {
                        let temp = currentItem;
                        containerItems[index] = heldItemObj;
                        heldItemObj = temp;
                    }
                } else {
                    if (isRightClick) {
                        let placedItem = { id: heldItemObj.id, count: 1, ...(heldItemObj.durability !== undefined ? { durability: heldItemObj.durability, maxDurability: heldItemObj.maxDurability } : {}) };
                        containerItems[index] = placedItem;
                        heldItemObj.count -= 1;
                        if (heldItemObj.count <= 0) heldItemObj = null;
                    } else {
                        containerItems[index] = heldItemObj;
                        heldItemObj = null;
                    }
                }
            }
            if (openedChest && type === 'chest') {
                syncChest(openedChest.key);
                if (!isMultiplayer) saveCurrentWorld();
            }
        }
        
        setHeldItemObj(heldItemObj);
        heldItemDraggedOutside = false;
        updateUI(false);
    }

    export function populateSlotItemDOM(slot, item, imgClass = 'w-8 h-8') {
        if (!item || !item.id) return;
        ensureToolDurability(item);
        const img = document.createElement('img');
        img.src = textures[item.id]?.src || '';
        img.className = `${imgClass} pixelated pointer-events-none`;
        slot.appendChild(img);
        if (item.count > 1) {
            const count = document.createElement('span');
            count.className = 'item-count pointer-events-none';
            count.innerText = item.count;
            slot.appendChild(count);
        }
        addDurabilityBar(slot, item);
    }

    export function setupFurnaceSlot(elementId, slotKey) {
        const slot = document.getElementById(elementId);
        slot.innerHTML = '';
        slot.onmousedown = (e) => { 
            e.preventDefault();
            window.getSelection()?.removeAllRanges();
            if(e.button === 0 || e.button === 2) handleSlotClick(slotKey, 'furnace', e.shiftKey, e.button === 2); 
        };
        if (openedFurnace && openedFurnace[slotKey]) {
            populateSlotItemDOM(slot, openedFurnace[slotKey]);
        }
    }

    export let craftingSearchQuery = '';

    export function handleCraftingSearch(query) {
        craftingSearchQuery = (query || '').trim().toLowerCase();
        const clearBtn = document.getElementById('crafting-search-clear');
        if (clearBtn) clearBtn.classList.toggle('hidden', !craftingSearchQuery);
        renderCraftingRecipes();
    }

    export function clearCraftingSearch() {
        craftingSearchQuery = '';
        const searchInput = document.getElementById('crafting-search');
        if (searchInput) searchInput.value = '';
        const clearBtn = document.getElementById('crafting-search-clear');
        if (clearBtn) clearBtn.classList.add('hidden');
        renderCraftingRecipes();
    }

    export function renderCraftingRecipes() {
        const craftList = document.getElementById('crafting-list');
        if (!craftList) return;
        craftList.innerHTML = '';
        const nearTable = checkNearCraftingTable();
        const query = craftingSearchQuery;

        const filteredRecipes = [];
        RECIPES.forEach((recipe, idx) => {
            if (recipe.reqTable && !nearTable) return;
            if (craftingCategory !== 'all' && getRecipeCategory(recipe) !== craftingCategory) return;
            
            if (query) {
                const outName = (ID_NAMES[recipe.output.id] || '').toLowerCase();
                const inNames = recipe.inputs.map(r => (ID_NAMES[r.id] || '').toLowerCase()).join(' ');
                if (!outName.includes(query) && !inNames.includes(query)) return;
            }
            filteredRecipes.push({ recipe, idx });
        });

        if (filteredRecipes.length === 0) {
            const emptyNotice = document.createElement('div');
            emptyNotice.className = 'text-center py-6 text-gray-400 font-["VT323"] text-xl';
            emptyNotice.innerText = query ? `No recipes found for "${query}"` : 'No recipes available';
            craftList.appendChild(emptyNotice);
            return;
        }

        const frag = document.createDocumentFragment();
        filteredRecipes.forEach(({ recipe, idx }) => {
            let canCraft = recipe.inputs.every(req => hasItem(req.id, req.count));
            let row = document.createElement('div');
            row.className = `flex flex-col bg-black/40 p-1.5 rounded border ${canCraft ? 'border-[#8c5a2b]/80 bg-black/50' : 'border-gray-700/80 opacity-80'} mb-1 hover:bg-black/70 transition-colors`;
            
            let topRow = document.createElement('div');
            topRow.className = 'flex items-center justify-between gap-2';
            let nameDiv = document.createElement('div');
            nameDiv.className = 'flex items-center gap-2 min-w-0';
            
            let img = document.createElement('img');
            img.src = textures[recipe.output.id] ? textures[recipe.output.id].src : '';
            img.className = 'w-6 h-6 pixelated shrink-0';
            nameDiv.appendChild(img);
            
            let t = document.createElement('span');
            t.className = 'text-white text-xl font-bold font-["VT323"] text-shadow truncate';
            t.innerText = `${ID_NAMES[recipe.output.id]} x${recipe.output.count}`;
            nameDiv.appendChild(t);
            
            let btn = document.createElement('button');
            btn.className = 'craft-btn shrink-0';
            btn.innerText = 'Craft';
            btn.disabled = !canCraft;
            btn.onclick = () => {
                craftRecipe(idx);
                updateUI();
            };
            
            topRow.appendChild(nameDiv);
            topRow.appendChild(btn);
            
            let reqs = document.createElement('div');
            reqs.className = 'text-base text-gray-300 mt-0.5 pl-8 flex flex-wrap gap-2';
            recipe.inputs.forEach(r => {
                let has = hasItem(r.id, r.count);
                let reqSpan = document.createElement('span');
                reqSpan.className = has ? 'text-green-400 font-bold' : 'text-red-400 font-bold';
                reqSpan.innerText = `${r.count} ${ID_NAMES[r.id]}`;
                reqs.appendChild(reqSpan);
            });
            
            row.appendChild(topRow);
            row.appendChild(reqs);
            frag.appendChild(row);
        });
        craftList.appendChild(frag);
    }

    export function updateUI(refreshCrafting = true) {
        const curSel = (typeof window !== 'undefined' && window.selectedHotbarIndex !== undefined) ? window.selectedHotbarIndex : selectedHotbarIndex;
        const hotbar = document.getElementById('hotbar');
        if (hotbar.children.length !== hotbarSize) {
            hotbar.innerHTML = '';
            for (let i = 0; i < hotbarSize; i++) {
                let slot = document.createElement('div');
                slot.className = `hotbar-slot w-12 h-12 flex items-center justify-center relative border-3 cursor-pointer ${i === curSel ? 'active' : ''}`;
                slot.onclick = () => { setSelectedHotbarIndex(i); updateUI(); triggerHotbarItemPopup(); };
                let num = document.createElement('span');
                num.className = 'absolute top-0 left-1 text-xs text-gray-300 font-bold pointer-events-none';
                num.innerText = i + 1;
                slot.appendChild(num);
                hotbar.appendChild(slot);
            }
        }
        for (let i = 0; i < hotbarSize; i++) {
            let slot = hotbar.children[i];
            if (!slot) continue;
            slot.className = `hotbar-slot w-12 h-12 flex items-center justify-center relative border-3 cursor-pointer ${i === curSel ? 'active' : ''}`;
            while (slot.childNodes && slot.childNodes.length > 1) slot.removeChild(slot.lastChild);
            populateSlotItemDOM(slot, inventory[i]);
        }

        let currSelItem = inventory[curSel];
        let currSelId = currSelItem ? currSelItem.id : null;
        if (currSelId !== lastHotbarItemId) {
            lastHotbarItemId = currSelId;
            triggerHotbarItemPopup();
        }

        let hudOffhand = document.getElementById('hud-offhand-slot');
        hudOffhand.innerHTML = '';
        populateSlotItemDOM(hudOffhand, inventory[27], 'w-9 h-9');

        updateHudArmorBar();

        if (!isInventoryOpen) return;

        let nearTable = checkNearCraftingTable();
        const invMenu = document.getElementById('inventory-menu');
        const cPanel = document.getElementById('crafting-panel');
        const fPanel = document.getElementById('furnace-panel');

        if (openedFurnace) {
            invMenu.classList.remove('crafting-table-mode');
            document.getElementById('header-inventory').classList.add('hidden');
            document.getElementById('header-crafting').classList.add('hidden');
            cPanel.classList.add('hidden');
            fPanel.classList.remove('hidden');
            setupFurnaceSlot('f-input', 'input');
            setupFurnaceSlot('f-fuel', 'fuel');
            setupFurnaceSlot('f-output', 'output');
        } else {
            const chestPanel = document.getElementById('chest-panel');
            chestPanel.classList.toggle('hidden', !openedChest);
            if (openedChest) {
                invMenu.classList.remove('crafting-table-mode');
                cPanel.classList.add('hidden');
                document.getElementById('header-inventory').classList.add('hidden');
                document.getElementById('header-crafting').classList.add('hidden');
                document.getElementById('chest-title').innerText = openedChest.size === 54 ? 'Large Chest' : 'Chest';
                const chestGrid = document.getElementById('chest-grid');
                chestGrid.innerHTML = '';
                const frag = document.createDocumentFragment();
                for (let i = 0; i < openedChest.size; i++) {
                    const slot = document.createElement('div');
                    slot.className = 'slot';
                    slot.onmousedown = e => {
                        e.preventDefault();
                        window.getSelection()?.removeAllRanges();
                        if (e.button === 0 || e.button === 2) {
                            handleSlotClick(i, 'chest', e.shiftKey, e.button === 2);
                            syncChest(openedChest.key);
                            if (!isMultiplayer) saveCurrentWorld();
                        }
                    };
                    populateSlotItemDOM(slot, openedChest.chest.items[i]);
                    frag.appendChild(slot);
                }
                chestGrid.appendChild(frag);
            } else {
                cPanel.classList.remove('hidden');
            }
            fPanel.classList.add('hidden');
            if (!openedChest) cPanel.classList.remove('hidden');
            
            if (nearTable && !openedChest) {
                invMenu.classList.add('crafting-table-mode');
                document.getElementById('header-inventory').classList.add('hidden');
                document.getElementById('header-crafting').classList.remove('hidden');
                document.getElementById('crafting-status').innerText = "Table Access (3x3)";
                document.getElementById('crafting-status').className = 'text-lg text-[#ffd899] font-bold bg-black/40 px-2 py-0.5 rounded border border-[#8f5f2e]';
                let ctIcon = document.getElementById('ct-icon');
                ctIcon.innerHTML = '';
                if (textures[IDS.CRAFTING_TABLE]) {
                    ctIcon.appendChild(textures[IDS.CRAFTING_TABLE].cloneNode());
                    ctIcon.firstChild.className = 'w-full h-full pixelated';
                }
            } else {
                invMenu.classList.remove('crafting-table-mode');
                document.getElementById('header-crafting').classList.add('hidden');
                document.getElementById('header-inventory').classList.remove('hidden');
                document.getElementById('crafting-status').innerText = "Basic (2x2)";
                document.getElementById('crafting-status').className = 'text-lg text-gray-400 font-bold bg-black/40 px-2 py-0.5 rounded';
            }
        }

        function createInventorySlotElement(i) {
            let slot = document.createElement('div');
            slot.className = `slot ${i === selectedHotbarIndex && i < 9 ? 'selected' : ''}`;
            slot.onmousedown = (e) => {
                e.preventDefault();
                window.getSelection()?.removeAllRanges();
                if (e.button === 0 || e.button === 2) handleSlotClick(i, 'inv', e.shiftKey, e.button === 2);
            };
            populateSlotItemDOM(slot, inventory[i]);
            return slot;
        }

        const storageGrid = document.getElementById('inventory-storage-grid');
        if (storageGrid) {
            storageGrid.innerHTML = '';
            const sFrag = document.createDocumentFragment();
            for (let i = 9; i < 27; i++) {
                sFrag.appendChild(createInventorySlotElement(i));
            }
            storageGrid.appendChild(sFrag);
        }

        const hotbarGrid = document.getElementById('inventory-hotbar-grid');
        if (hotbarGrid) {
            hotbarGrid.innerHTML = '';
            const hFrag = document.createDocumentFragment();
            for (let i = 0; i < 9; i++) {
                hFrag.appendChild(createInventorySlotElement(i));
            }
            hotbarGrid.appendChild(hFrag);
        }

        const legacyGrid = document.getElementById('inventory-grid');
        if (legacyGrid) {
            legacyGrid.innerHTML = '';
            const gridFrag = document.createDocumentFragment();
            for (let i = 0; i < 27; i++) {
                gridFrag.appendChild(createInventorySlotElement(i));
            }
            legacyGrid.appendChild(gridFrag);
        }
        
        let invOffhand = document.getElementById('inv-offhand-slot');
        if (invOffhand) {
            invOffhand.innerHTML = '';
            if (inventory[27]) {
                invOffhand.classList.remove('empty');
                populateSlotItemDOM(invOffhand, inventory[27]);
            } else {
                invOffhand.classList.add('empty');
            }
            invOffhand.onmousedown = (e) => {
                e.preventDefault();
                window.getSelection()?.removeAllRanges();
                if (e.button === 0 || e.button === 2) handleSlotClick(27, 'inv', e.shiftKey, e.button === 2);
            };
        }

        updateArmorUI();

        if (refreshCrafting) {
            renderCraftingRecipes();
        }
    }

    export function addArmorDurabilityBar(slotEl, item) {
        if (!item || !isArmor(item.id)) return;
        const maxDur = ARMOR_DURABILITY[item.id] || 100;
        const curDur = item.durability !== undefined ? item.durability : maxDur;
        if (curDur >= maxDur) return;

        const ratio = Math.max(0, Math.min(1, curDur / maxDur));
        const bar = document.createElement('div');
        bar.className = 'durability-bar';
        const fill = document.createElement('div');
        fill.className = 'durability-fill';
        fill.style.width = `${Math.round(ratio * 100)}%`;
        fill.style.backgroundColor = ratio > 0.5 ? '#4ade80' : ratio > 0.2 ? '#facc15' : '#ef4444';
        bar.appendChild(fill);
        slotEl.appendChild(bar);
    }

    export function checkArmorAchievements() {
        if (equippedArmor.some(p => p !== null)) {
            unlockAchievement('suit_up');
        }
        if (equippedArmor[0]?.id === IDS.HELMET_IRON &&
            equippedArmor[1]?.id === IDS.CHESTPLATE_IRON &&
            equippedArmor[2]?.id === IDS.LEGGINGS_IRON &&
            equippedArmor[3]?.id === IDS.BOOTS_IRON) {
            unlockAchievement('heavy_metal');
        }
        if (equippedArmor[0]?.id === IDS.HELMET_DIAMOND &&
            equippedArmor[1]?.id === IDS.CHESTPLATE_DIAMOND &&
            equippedArmor[2]?.id === IDS.LEGGINGS_DIAMOND &&
            equippedArmor[3]?.id === IDS.BOOTS_DIAMOND) {
            unlockAchievement('covert_with_diamonds');
        }
        if (getTotalArmorDefense() >= 20) {
            unlockAchievement('armored_tank');
        }
    }

    export function updateArmorUI() {
        for (let i = 0; i < 4; i++) {
            const slotEl = document.getElementById(`armor-slot-${i}`);
            if (!slotEl) continue;
            slotEl.innerHTML = '';
            const piece = equippedArmor[i];
            if (piece && piece.id) {
                slotEl.classList.remove('empty');
                ensureArmorDurability(piece);
                const img = document.createElement('img');
                img.src = textures[piece.id]?.src || '';
                img.className = 'w-8 h-8 pixelated pointer-events-none';
                slotEl.appendChild(img);
                addArmorDurabilityBar(slotEl, piece);
            } else {
                slotEl.classList.add('empty');
            }

            slotEl.onmousedown = (e) => {
                e.preventDefault();
                window.getSelection()?.removeAllRanges();
                if (e.button === 0 || e.button === 2) {
                    handleArmorSlotClick(i, e.shiftKey);
                }
            };
        }

        const invCanvas = document.getElementById('inv-player-preview-canvas');
        if (invCanvas) {
            const invCtx = invCanvas.getContext('2d');
            invCtx.clearRect(0, 0, invCanvas.width, invCanvas.height);
            invCtx.imageSmoothingEnabled = false;
            drawCharacter(invCtx, skinCanvasObj, 0, 0, invCanvas.width, invCanvas.height, true, 0, false, false, null, null, false, null, false, equippedArmor);
        }

        const totalDefense = getTotalArmorDefense();
        const reductionPct = Math.round(getArmorDamageReductionRatio() * 100);
        const defenseReadout = document.getElementById('inv-defense-readout');
        if (defenseReadout) {
            defenseReadout.innerText = `Defense: ${reductionPct}%`;
        }

        updateHudArmorBar();
    }

    export function updateHudArmorBar() {
        const ab = document.getElementById('armor-bar');
        if (!ab) return;
        const defense = getTotalArmorDefense();
        if (defense <= 0) {
            ab.innerHTML = '';
            ab.style.display = 'none';
            return;
        }
        ab.style.display = 'flex';
        ab.innerHTML = '';
        const fullIcons = Math.floor(defense / 2);
        const hasHalf = (defense % 2) === 1;
        for (let i = 0; i < 10; i++) {
            const icon = document.createElement('div');
            if (i < fullIcons) icon.className = 'armor-icon armor-full';
            else if (i === fullIcons && hasHalf) icon.className = 'armor-icon armor-half';
            else icon.className = 'armor-icon armor-empty';
            ab.appendChild(icon);
        }
    }

    export function handleArmorSlotClick(armorIndex, isShift) {
        const piece = equippedArmor[armorIndex];
        if (heldItemObj) {
            if (isArmor(heldItemObj.id) && getArmorSlotIndex(heldItemObj.id) === armorIndex) {
                const prev = equippedArmor[armorIndex];
                equippedArmor[armorIndex] = heldItemObj;
                heldItemObj = prev;
                playSound('pop');
                checkArmorAchievements();
                updateArmorUI();
                updateUI();
                setHeldItemObj(heldItemObj);
            }
        } else if (piece) {
            if (isShift) {
                const emptyIdx = inventory.findIndex((item, idx) => idx < 27 && item === null);
                if (emptyIdx !== -1) {
                    inventory[emptyIdx] = piece;
                    equippedArmor[armorIndex] = null;
                    playSound('pop');
                    updateUI();
                    updateArmorUI();
                } else {
                    showToast('Inventory full!');
                }
            } else {
                heldItemObj = piece;
                equippedArmor[armorIndex] = null;
                playSound('pop');
                updateArmorUI();
                updateUI();
                setHeldItemObj(heldItemObj);
            }
        }
    }


    export function toggleWorldMap(forceState) {
        let newState = forceState !== undefined ? forceState : !isWorldMapOpen;
        if (newState === isWorldMapOpen) return;
        
        if (newState) {
            const curState = (typeof window !== 'undefined' && window.STATE) ? window.STATE : STATE;
            if (curState !== 'PLAYING') return;
            if (isInventoryOpen) toggleInventory();
            isWorldMapOpen = true;
            if (typeof window !== 'undefined') window.isWorldMapOpen = true;
            if (typeof setIsWorldMapOpen === 'function') setIsWorldMapOpen(true);
            const mapModal = document.getElementById('world-map-modal');
            if (mapModal) mapModal.classList.remove('hidden');
            
            buildFullOffscreenMap();
            updateMapWorldBadge();
            resetMapView();
            initWorldMapEvents();
            renderWorldMapLoop();
            unlockAchievement('cartographer');
        } else {
            isWorldMapOpen = false;
            if (typeof window !== 'undefined') window.isWorldMapOpen = false;
            if (typeof setIsWorldMapOpen === 'function') setIsWorldMapOpen(false);
            const mapModal = document.getElementById('world-map-modal');
            if (mapModal) mapModal.classList.add('hidden');
            if (mapAnimFrameId) {
                cancelAnimationFrame(mapAnimFrameId);
                mapAnimFrameId = null;
            }
        }
    }

    export function toggleBackgroundBuildMode(forceState) {
        let newState = forceState !== undefined ? forceState : !isBackgroundBuildMode;
        if (newState === isBackgroundBuildMode) return;
        isBackgroundBuildMode = newState;
        if (typeof window !== 'undefined') window.isBackgroundBuildMode = newState;
        if (typeof setEngineIsBackgroundBuildMode === 'function') setEngineIsBackgroundBuildMode(newState);
        playSound('click');
        const indicator = document.getElementById('bg-build-indicator');
        if (indicator) {
            indicator.classList.toggle('hidden', !isBackgroundBuildMode);
        }
        const overlay = document.getElementById('bg-build-overlay');
        if (overlay) {
            overlay.classList.toggle('hidden', !isBackgroundBuildMode);
        }
        showToast(isBackgroundBuildMode ? 'Background Build Mode: ON' : 'Background Build Mode: OFF');
    }

    export function updateMapWorldBadge() {
        const badgeEl = document.getElementById('map-world-badge');
        if (badgeEl) {
            badgeEl.innerText = `${WORLD_WIDTH}x${WORLD_HEIGHT} ${currentWorldSize.toUpperCase()}`;
        }
    }

    export function updateMapZoomBadge() {
        const badge = document.getElementById('map-zoom-badge');
        if (badge) {
            badge.innerText = `${Math.round(mapZoom * 100)}%`;
        }
    }

    export function centerMapOnPlayer() {
        const curPlayer = player || (typeof window !== 'undefined' && window.player);
        if (curPlayer) {
            mapPanX = curPlayer.x / TILE_SIZE;
            mapPanY = (curPlayer.y + (curPlayer.height || TILE_SIZE) / 2) / TILE_SIZE;
        } else {
            mapPanX = WORLD_WIDTH / 2;
            mapPanY = WORLD_HEIGHT / 2;
        }
        if (typeof window !== 'undefined') {
            window.mapPanX = mapPanX;
            window.mapPanY = mapPanY;
        }
        if (typeof setMapPan === 'function') setMapPan(mapPanX, mapPanY);
    }

    export function resetMapView() {
        centerMapOnPlayer();
        const mapCanvas = document.getElementById('world-map-canvas');
        if (mapCanvas && mapCanvas.clientWidth > 0) {
            mapZoom = Math.max(0.6, Math.min(2.5, (mapCanvas.clientWidth / WORLD_WIDTH) * 1.6));
        } else {
            mapZoom = 1.0;
        }
        if (typeof window !== 'undefined') window.mapZoom = mapZoom;
        if (typeof setMapZoom === 'function') setMapZoom(mapZoom);
        updateMapZoomBadge();
    }

    export function changeMapZoom(factor) {
        mapZoom = Math.max(0.25, Math.min(8.0, mapZoom * factor));
        if (typeof window !== 'undefined') window.mapZoom = mapZoom;
        if (typeof setMapZoom === 'function') setMapZoom(mapZoom);
        updateMapZoomBadge();
    }

    export function initWorldMapEvents() {
        if (mapEventsInitialized) return;
        mapEventsInitialized = true;

        const mapCanvas = document.getElementById('world-map-canvas');
        if (!mapCanvas) return;

        mapCanvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                isMapDragging = true;
                mapDragStartX = e.clientX;
                mapDragStartY = e.clientY;
                mapDragOriginPanX = mapPanX;
                mapDragOriginPanY = mapPanY;
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!isWorldMapOpen) return;
            const rect = mapCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const tileSize = Math.max(1, 4 * mapZoom);
            const cx = mapCanvas.width / 2;
            const cy = mapCanvas.height / 2;

            if (isMapDragging) {
                const dx = e.clientX - mapDragStartX;
                const dy = e.clientY - mapDragStartY;
                mapPanX = mapDragOriginPanX - dx / tileSize;
                mapPanY = mapDragOriginPanY - dy / tileSize;
                
                mapPanX = Math.max(-50, Math.min(WORLD_WIDTH + 50, mapPanX));
                mapPanY = Math.max(-30, Math.min(WORLD_HEIGHT + 30, mapPanY));
                if (typeof window !== 'undefined') {
                    window.mapPanX = mapPanX;
                    window.mapPanY = mapPanY;
                }
                if (typeof setMapPan === 'function') setMapPan(mapPanX, mapPanY);
            }

            if (mouseX >= 0 && mouseX < mapCanvas.width && mouseY >= 0 && mouseY < mapCanvas.height) {
                mapHoverTileX = Math.floor(mapPanX + (mouseX - cx) / tileSize);
                mapHoverTileY = Math.floor(mapPanY + (mouseY - cy) / tileSize);
                updateMapCoordinateReadout();
            }
        });

        window.addEventListener('mouseup', () => {
            isMapDragging = false;
        });

        mapCanvas.addEventListener('wheel', (e) => {
            if (!isWorldMapOpen) return;
            e.preventDefault();
            e.stopPropagation();

            const rect = mapCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const cx = mapCanvas.width / 2;
            const cy = mapCanvas.height / 2;

            const oldTileSize = Math.max(1, 4 * mapZoom);
            const worldUnderMouseX = mapPanX + (mouseX - cx) / oldTileSize;
            const worldUnderMouseY = mapPanY + (mouseY - cy) / oldTileSize;

            if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                let panDelta = (e.deltaX || e.deltaY) / oldTileSize;
                mapPanX += panDelta * 0.7;
                mapPanX = Math.max(-50, Math.min(WORLD_WIDTH + 50, mapPanX));
                if (typeof window !== 'undefined') window.mapPanX = mapPanX;
                if (typeof setMapPan === 'function') setMapPan(mapPanX, mapPanY);
                return;
            }

            const zoomFactor = e.deltaY < 0 ? 1.25 : (1 / 1.25);
            mapZoom = Math.max(0.25, Math.min(8.0, mapZoom * zoomFactor));
            updateMapZoomBadge();

            const newTileSize = Math.max(1, 4 * mapZoom);
            mapPanX = worldUnderMouseX - (mouseX - cx) / newTileSize;
            mapPanY = worldUnderMouseY - (mouseY - cy) / newTileSize;

            mapPanX = Math.max(-50, Math.min(WORLD_WIDTH + 50, mapPanX));
            mapPanY = Math.max(-30, Math.min(WORLD_HEIGHT + 30, mapPanY));
            if (typeof window !== 'undefined') {
                window.mapPanX = mapPanX;
                window.mapPanY = mapPanY;
                window.mapZoom = mapZoom;
            }
            if (typeof setMapPan === 'function') setMapPan(mapPanX, mapPanY);
            if (typeof setMapZoom === 'function') setMapZoom(mapZoom);
        }, { passive: false });
    }

    export function updateMapCoordinateReadout() {
        const playerCoordsEl = document.getElementById('map-player-coords');
        const cursorCoordsEl = document.getElementById('map-cursor-coords');
        if (playerCoordsEl) {
            const curPlayer = player || (typeof window !== 'undefined' && window.player);
            if (curPlayer && curPlayer.x !== undefined) {
                let px = Math.floor(curPlayer.x / TILE_SIZE);
                let py = Math.floor(((curPlayer.y || 0) + (curPlayer.height || 48)) / TILE_SIZE);
                playerCoordsEl.innerText = `X: ${px}, Y: ${py}`;
            } else {
                playerCoordsEl.innerText = `X: 0, Y: 0`;
            }
        }
        if (cursorCoordsEl) {
            let hx = mapHoverTileX;
            let hy = mapHoverTileY;
            if (hx >= 0 && hx < WORLD_WIDTH && hy >= 0 && hy < WORLD_HEIGHT) {
                const curWorld = world || (typeof window !== 'undefined' && window.world);
                let block = curWorld ? curWorld[hx]?.[hy] : undefined;
                let blockName = "Air";
                if (block !== undefined && block !== IDS.AIR) {
                    blockName = getMapBlockName(block);
                } else if (typeof getFluid === 'function' && getFluid(hx, hy)) {
                    blockName = getFluid(hx, hy).type === IDS.LAVA ? "Lava" : "Water";
                }
                cursorCoordsEl.innerText = `X: ${hx}, Y: ${hy} (${blockName})`;
            } else {
                cursorCoordsEl.innerText = `X: ${hx}, Y: ${hy} (Void)`;
            }
        }
    }

    export function getMapBlockName(id) {
        switch(id) {
            case IDS.GRASS: return "Grass Block";
            case IDS.DIRT: return "Dirt";
            case IDS.STONE: return "Stone";
            case IDS.WOOD: return "Oak Wood";
            case IDS.LEAVES: return "Leaves";
            case IDS.SAND: return "Sand";
            case IDS.SNOW: return "Snow";
            case IDS.COAL_ORE: return "Coal Ore";
            case IDS.IRON_ORE: return "Iron Ore";
            case IDS.GOLD_ORE: return "Gold Ore";
            case IDS.DIAMOND_ORE: return "Diamond Ore";
            case IDS.TORCH: return "Torch";
            case IDS.BED: return "Bed";
            case IDS.CHEST: return "Chest";
            case IDS.FURNACE: return "Furnace";
            case IDS.CRAFTING_TABLE: return "Crafting Table";
            case IDS.DOOR: case IDS.DOOR_TOP: case IDS.DOOR_OPEN: case IDS.DOOR_OPEN_TOP: return "Door";
            case IDS.CACTUS: return "Cactus";
            default: return "Block #" + id;
        }
    }

    // =========================================================================
    // =========================================================================
    // ONBOARDING & TUTORIAL GUIDE SYSTEM (AUTHENTIC PIXEL-ART GAME DESIGN)
    // =========================================================================
    export let currentTutorialStep = 0;
    export const TOTAL_TUTORIAL_STEPS = 6;

    export function getTutorialTextureSrc(id) {
        if (typeof textures !== 'undefined' && textures && textures[id]) {
            return textures[id].src || '';
        }
        return '';
    }

    export function renderItemFrameHtml(id, label = '') {
        const src = getTutorialTextureSrc(id);
        const imgHtml = src ? `<img src="${src}" class="w-8 h-8 pixelated" alt="${label}" />` : `<div class="w-6 h-6 bg-amber-600/40"></div>`;
        return `<div class="achievement-icon-frame" title="${label}">${imgHtml}</div>`;
    }

    export const TUTORIAL_STEPS = [
        {
            title: "The Infinite Sandbox",
            badge: "World & Biomes",
            render(container) {
                container.innerHTML = `
                    <div class="w-full flex flex-col items-center">
                        <div class="tutorial-preview-box w-full mb-2">
                            <canvas id="tutorial-preview-canvas" width="760" height="135" class="tutorial-canvas"></canvas>
                        </div>
                        <div class="tutorial-grid-2">
                            <div class="tutorial-card">
                                ${renderItemFrameHtml(IDS.GRASS, "Biomes")}
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title gold">Vibrant Biomes</span>
                                    <p class="tutorial-card-desc">Explore lush Plains, dense Plain Woods, scorching Deserts with cactuses, and snowy peaks with auroras.</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                ${renderItemFrameHtml(IDS.DIAMOND_ORE, "Minerals")}
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title cyan">Mineral Veins</span>
                                    <p class="tutorial-card-desc">Excavate subterranean caverns beneath the soil to discover Coal, Iron, Gold, and precious Diamond veins.</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                ${renderItemFrameHtml(IDS.TORCH, "Light & Dark")}
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title orange">Day & Night Dynamics</span>
                                    <p class="tutorial-card-desc">Daylight provides a calm window for gathering resources. Nightfall brings dangerous monsters to unlit lands.</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                ${renderItemFrameHtml(IDS.COBBLESTONE, "Building")}
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title green">Complete Creative Freedom</span>
                                    <p class="tutorial-card-desc">Place solid foreground blocks and background walls [B] to build reinforced shelters and grand castles.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                drawTutorialWorldScene();
            }
        },
        {
            title: "Controls & Navigation",
            badge: "How to Play",
            render(container) {
                container.innerHTML = `
                    <div class="w-full flex flex-col items-center">
                        <div class="tutorial-grid-2 mb-2">
                            <div class="tutorial-card">
                                <div class="flex gap-1.5 min-w-[70px] justify-center">
                                    <span class="mc-keycap">A</span>
                                    <span class="mc-keycap">D</span>
                                </div>
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title gold">Horizontal Movement</span>
                                    <p class="tutorial-card-desc">Walk and sprint left or right across the terrain.</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                <div class="flex gap-1.5 min-w-[70px] justify-center">
                                    <span class="mc-keycap">SPACE</span>
                                    <span class="mc-keycap">W</span>
                                </div>
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title gold">Jump & Climb</span>
                                    <p class="tutorial-card-desc">Leap over blocks and ascend vertical ladders.</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                <div class="min-w-[70px] flex justify-center">
                                    <span class="mc-mouse-btn">HOLD L-CLICK</span>
                                </div>
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title orange">Mine / Attack</span>
                                    <p class="tutorial-card-desc">Break target blocks in range or strike hostile mobs.</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                <div class="min-w-[70px] flex justify-center">
                                    <span class="mc-mouse-btn blue">R-CLICK</span>
                                </div>
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title cyan">Place / Interact</span>
                                    <p class="tutorial-card-desc">Place held item, open chests & furnaces, sleep in bed.</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                <div class="min-w-[70px] flex justify-center">
                                    <span class="mc-keycap">E</span>
                                </div>
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title gold">Inventory & Crafting</span>
                                    <p class="tutorial-card-desc">Manage hotbar, backpack storage, and craft recipes.</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                <div class="min-w-[70px] flex justify-center">
                                    <span class="mc-keycap">B</span>
                                </div>
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title orange">Background Build Mode</span>
                                    <p class="tutorial-card-desc">Toggles orange screen overlay to place cozy back-wall blocks.</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                <div class="min-w-[70px] flex justify-center">
                                    <span class="mc-keycap">M</span>
                                </div>
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title green">World Map</span>
                                    <p class="tutorial-card-desc">Open full interactive world map with smooth pan and zoom.</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                <div class="flex gap-1 min-w-[70px] justify-center">
                                    <span class="mc-keycap">1-9</span>
                                    <span class="mc-keycap">WHEEL</span>
                                </div>
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title gold">Hotbar Select</span>
                                    <p class="tutorial-card-desc">Select active tool or block to hold in your hand.</p>
                                </div>
                            </div>
                        </div>
                        <div class="tutorial-tip-box">
                            ${renderItemFrameHtml(IDS.TORCH, "Light Tip")}
                            <span><b>PRO TIP:</b> Toggle Background Build Mode with <b>'B'</b> to seal houses with background walls. Monsters cannot spawn inside closed houses!</span>
                        </div>
                    </div>
                `;
            }
        },
        {
            title: "Crafting & Tool Progression",
            badge: "Tech Tree",
            render(container) {
                container.innerHTML = `
                    <div class="w-full flex flex-col items-center">
                        <div class="tutorial-preview-box w-full mb-2">
                            <canvas id="tutorial-preview-canvas" width="760" height="125" class="tutorial-canvas"></canvas>
                        </div>
                        <div class="tutorial-grid-2">
                            <div class="tutorial-card">
                                <div class="flex gap-1">
                                    ${renderItemFrameHtml(IDS.WOOD, "Wood Logs")}
                                    ${renderItemFrameHtml(IDS.PLANKS, "Planks")}
                                </div>
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title orange">1. Harvest Timber</span>
                                    <p class="tutorial-card-desc">Chop oak trees to obtain Wood Logs. In inventory [E], refine logs into Planks and Sticks.</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                ${renderItemFrameHtml(IDS.CRAFTING_TABLE, "Crafting Table")}
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title gold">2. Build Crafting Table</span>
                                    <p class="tutorial-card-desc">Combine 4 Planks to build a Crafting Table. Place it and Right-Click to unlock the 3x3 recipe grid!</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                <div class="flex gap-1">
                                    ${renderItemFrameHtml(IDS.WOOD_PICKAXE, "Wood")}
                                    ${renderItemFrameHtml(IDS.IRON_PICKAXE, "Iron")}
                                    ${renderItemFrameHtml(IDS.DIAMOND_PICKAXE, "Diamond")}
                                </div>
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title cyan">3. Tool Tiers</span>
                                    <p class="tutorial-card-desc">Wood -> Stone -> Iron -> Gold -> Diamond. Stronger pickaxes harvest harder minerals (Iron for Diamond).</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                <div class="flex gap-1">
                                    ${renderItemFrameHtml(IDS.FURNACE, "Furnace")}
                                    ${renderItemFrameHtml(IDS.IRON_INGOT, "Ingot")}
                                </div>
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title orange">4. Smelting & Metal Ore</span>
                                    <p class="tutorial-card-desc">Craft a Furnace with 8 Cobblestone. Fuel it with Coal or Wood to smelt raw Iron & Gold ores into ingots!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                drawTutorialCraftingScene();
            }
        },
        {
            title: "Wildlife & Night Survival",
            badge: "Survival & Combat",
            render(container) {
                container.innerHTML = `
                    <div class="w-full flex flex-col items-center">
                        <div class="tutorial-preview-box w-full mb-2">
                            <canvas id="tutorial-preview-canvas" width="760" height="135" class="tutorial-canvas"></canvas>
                        </div>
                        <div class="tutorial-grid-3">
                            <div class="tutorial-card">
                                <div class="flex gap-1">
                                    ${renderItemFrameHtml(IDS.RAW_PORKCHOP, "Porkchop")}
                                    ${renderItemFrameHtml(IDS.WOOL, "Wool")}
                                </div>
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title green">Peaceful Wildlife</span>
                                    <p class="tutorial-card-desc">Hunt Pigs for Porkchops to replenish hunger and heal. Shear Sheep for Wool.</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                <div class="flex gap-1">
                                    ${renderItemFrameHtml(IDS.IRON_SWORD, "Sword")}
                                    ${renderItemFrameHtml(IDS.BONE, "Bone")}
                                </div>
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title orange">Monsters in the Dark</span>
                                    <p class="tutorial-card-desc">Zombies, Skeletons, and Creepers spawn in the dark. Craft a Sword to fight back!</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                ${renderItemFrameHtml(IDS.BED, "Bed")}
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title gold">Sleep Through Night</span>
                                    <p class="tutorial-card-desc">Combine 3 Planks + 3 Wool. Right-Click a Bed at dusk to fast-forward to morning safely.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                drawTutorialMobsScene();
            }
        },
        {
            title: "Armor & Equipment",
            badge: "Defense & Storage",
            render(container) {
                container.innerHTML = `
                    <div class="w-full flex flex-col items-center">
                        <div class="tutorial-preview-box w-full mb-2">
                            <canvas id="tutorial-preview-canvas" width="760" height="135" class="tutorial-canvas"></canvas>
                        </div>
                        <div class="tutorial-grid-2">
                            <div class="tutorial-card">
                                <div class="flex gap-1">
                                    ${renderItemFrameHtml(IDS.HELMET_IRON, "Helmet")}
                                    ${renderItemFrameHtml(IDS.CHESTPLATE_IRON, "Chestplate")}
                                </div>
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title cyan">Head & Torso Defense</span>
                                    <p class="tutorial-card-desc">Helmets and Chestplates provide primary damage absorption against monster attacks and falling debris.</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                <div class="flex gap-1">
                                    ${renderItemFrameHtml(IDS.LEGGINGS_IRON, "Leggings")}
                                    ${renderItemFrameHtml(IDS.BOOTS_IRON, "Boots")}
                                </div>
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title cyan">Leggings & Boots</span>
                                    <p class="tutorial-card-desc">Complete your suit with Leggings and Boots to soften high impacts and cushion falls from underground caverns.</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                <div class="flex gap-1">
                                    ${renderItemFrameHtml(IDS.IRON_INGOT, "Ingot")}
                                    ${renderItemFrameHtml(IDS.DIAMOND, "Diamond")}
                                </div>
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title gold">Tier Progression</span>
                                    <p class="tutorial-card-desc">Leather -> Iron -> Gold -> Diamond. Diamond armor offers peak damage reduction and the greatest durability.</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                ${renderItemFrameHtml(IDS.CHEST, "Chest")}
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title orange">Item Safeguarding</span>
                                    <p class="tutorial-card-desc">Craft Chests (8 Planks) to stash your valuable minerals, backup tools, and armor so they are never lost upon death.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                drawTutorialArmorScene();
            }
        },
        {
            title: "Multiplayer & Custom Skins",
            badge: "Online Co-Op & Skins",
            render(container) {
                container.innerHTML = `
                    <div class="w-full flex flex-col items-center">
                        <div class="tutorial-preview-box w-full mb-2">
                            <canvas id="tutorial-preview-canvas" width="760" height="135" class="tutorial-canvas"></canvas>
                        </div>
                        <div class="tutorial-grid-2">
                            <div class="tutorial-card">
                                <div class="achievement-icon-frame font-['VT323'] text-2xl text-emerald-400 font-bold">MP</div>
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title green">Instant P2P Hosting</span>
                                    <p class="tutorial-card-desc">Press Esc -> 'Open to Multiplayer' in any singleplayer world. Set a room name and optional password to invite friends!</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                <div class="achievement-icon-frame font-['VT323'] text-2xl text-cyan-400 font-bold">SV</div>
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title cyan">Server Browser</span>
                                    <p class="tutorial-card-desc">Browse active public rooms in the Multiplayer Lobby. Join survival adventures or build together in real-time.</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                <div class="achievement-icon-frame font-['VT323'] text-2xl text-amber-400 font-bold">KEY</div>
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title orange">Private Co-Op Security</span>
                                    <p class="tutorial-card-desc">Protect your private worlds with a password so only your invited friends can join and build with you.</p>
                                </div>
                            </div>
                            <div class="tutorial-card">
                                <div class="achievement-icon-frame font-['VT323'] text-2xl text-purple-400 font-bold">SK</div>
                                <div class="tutorial-card-content">
                                    <span class="tutorial-card-title purple">Pixel Skin Studio</span>
                                    <p class="tutorial-card-desc">Open the built-in Skin Maker in the main menu to paint, save, and wear your own unique pixel-art character skin!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                drawTutorialMultiplayerScene();
            }
        }
    ];

    function drawTutorialBlock(ctx, id, x, y, size = 32) {
        if (typeof textures !== 'undefined' && textures && textures[id]) {
            try {
                ctx.drawImage(textures[id], Math.floor(x), Math.floor(y), size, size);
                return;
            } catch(e) {}
        }
        ctx.fillStyle = '#5c4033';
        ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
    }

    export function drawTutorialWorldScene() {
        const c = typeof document !== 'undefined' ? document.getElementById('tutorial-preview-canvas') : null;
        if (!c) return;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        const w = c.width, h = c.height;
        ctx.imageSmoothingEnabled = false;

        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, '#4a8ee8');
        skyGrad.addColorStop(0.65, '#99caff');
        skyGrad.addColorStop(1, '#d8edff');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // Sun with ray glow
        ctx.fillStyle = 'rgba(255, 240, 150, 0.12)';
        ctx.fillRect(w - 90, 0, 55, h);
        ctx.fillRect(w - 75, 10, 32, 32);
        ctx.fillStyle = '#fff480';
        ctx.fillRect(w - 71, 14, 24, 24);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(w - 67, 18, 10, 10);

        // Rolling Mountains in background
        ctx.fillStyle = '#5c8299';
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 16) {
            ctx.lineTo(x, h - 55 - Math.sin(x * 0.015) * 16 - Math.cos(x * 0.03) * 6);
        }
        ctx.lineTo(w, h);
        ctx.fill();

        // Woodland horizon layer
        ctx.fillStyle = '#426848';
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 12) {
            ctx.lineTo(x, h - 42 - Math.sin(x * 0.025) * 8);
        }
        ctx.lineTo(w, h);
        ctx.fill();

        // Biome Terrain Surface:
        const bSize = 24;
        const groundY = h - 46;

        for (let x = 0; x < w; x += bSize) {
            let topBlock = IDS.GRASS;
            if (x < 180) topBlock = IDS.SAND;
            else if (x >= 560) topBlock = IDS.SNOW;

            drawTutorialBlock(ctx, topBlock, x, groundY, bSize);
            drawTutorialBlock(ctx, topBlock === IDS.SAND ? IDS.SAND : IDS.DIRT, x, groundY + bSize, bSize);
        }

        // Subterranean Ores in the underground slice:
        drawTutorialBlock(ctx, IDS.STONE, 240, groundY + bSize, bSize);
        drawTutorialBlock(ctx, IDS.COAL_ORE, 264, groundY + bSize, bSize);
        drawTutorialBlock(ctx, IDS.IRON_ORE, 288, groundY + bSize, bSize);
        drawTutorialBlock(ctx, IDS.DIAMOND_ORE, 312, groundY + bSize, bSize);
        drawTutorialBlock(ctx, IDS.STONE, 336, groundY + bSize, bSize);

        // Desert Cactuses
        drawTutorialBlock(ctx, IDS.CACTUS, 80, groundY - bSize, bSize);
        drawTutorialBlock(ctx, IDS.CACTUS, 80, groundY - bSize * 2, bSize);

        // Plains Oak Tree (authentic wood and leaves textures!)
        const treeX = 450;
        drawTutorialBlock(ctx, IDS.WOOD, treeX, groundY - bSize, bSize);
        drawTutorialBlock(ctx, IDS.WOOD, treeX, groundY - bSize * 2, bSize);
        drawTutorialBlock(ctx, IDS.WOOD, treeX, groundY - bSize * 3, bSize);
        for (let lx = -bSize * 1.5; lx <= bSize * 1.5; lx += bSize) {
            for (let ly = -bSize * 2; ly <= 0; ly += bSize) {
                drawTutorialBlock(ctx, IDS.LEAVES, treeX + lx, groundY - bSize * 3 + ly, bSize);
            }
        }

        // Flowers & Vegetation
        drawTutorialBlock(ctx, IDS.FLOWER_RED, 230, groundY - bSize + 6, bSize);
        drawTutorialBlock(ctx, IDS.FLOWER_YELLOW, 290, groundY - bSize + 6, bSize);
        drawTutorialBlock(ctx, IDS.SHORT_GRASS, 350, groundY - bSize + 8, bSize);

        // Player Character standing on grass
        const px = 250, py = groundY - 44;
        ctx.fillStyle = '#1c6ca8';
        ctx.fillRect(px, py + 20, 12, 16);
        ctx.fillStyle = '#299cd2';
        ctx.fillRect(px - 1, py + 8, 14, 13);
        ctx.fillStyle = '#f8b584';
        ctx.fillRect(px + 1, py - 4, 11, 12);
        ctx.fillStyle = '#4a2c16';
        ctx.fillRect(px, py - 6, 13, 5);
        drawTutorialBlock(ctx, IDS.DIAMOND_PICKAXE, px + 12, py + 2, 20);
    }

    export function drawTutorialCraftingScene() {
        const c = typeof document !== 'undefined' ? document.getElementById('tutorial-preview-canvas') : null;
        if (!c) return;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        const w = c.width, h = c.height;
        ctx.imageSmoothingEnabled = false;

        // Dark workshop stone backdrop
        ctx.fillStyle = '#15191d';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = '#1d232a';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 24) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }

        const items = [
            { id: IDS.WOOD, name: "Wood" },
            { id: IDS.PLANKS, name: "Planks" },
            { id: IDS.CRAFTING_TABLE, name: "Table" },
            { id: IDS.STONE_PICKAXE, name: "Pickaxe" },
            { id: IDS.FURNACE, name: "Furnace" },
            { id: IDS.IRON_INGOT, name: "Ingot" },
            { id: IDS.DIAMOND, name: "Diamond" }
        ];

        const slotSize = 44;
        const spacing = w / items.length;

        for (let i = 0; i < items.length; i++) {
            const it = items[i];
            const cx = Math.floor(i * spacing + spacing / 2);
            const cy = Math.floor(h / 2) - 8;

            ctx.fillStyle = '#101418';
            ctx.fillRect(cx - slotSize / 2, cy - slotSize / 2, slotSize, slotSize);
            ctx.strokeStyle = '#333a41';
            ctx.lineWidth = 2;
            ctx.strokeRect(cx - slotSize / 2, cy - slotSize / 2, slotSize, slotSize);
            ctx.strokeStyle = '#46515a';
            ctx.beginPath();
            ctx.moveTo(cx - slotSize / 2, cy + slotSize / 2);
            ctx.lineTo(cx - slotSize / 2, cy - slotSize / 2);
            ctx.lineTo(cx + slotSize / 2, cy - slotSize / 2);
            ctx.stroke();

            drawTutorialBlock(ctx, it.id, cx - 15, cy - 15, 30);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px VT323, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(it.name, cx, cy + slotSize / 2 + 18);

            if (i < items.length - 1) {
                ctx.fillStyle = '#ffd34d';
                ctx.font = '24px VT323, monospace';
                ctx.fillText('▶', cx + spacing / 2, cy + 6);
            }
        }
    }

    export function drawTutorialMobsScene() {
        const c = typeof document !== 'undefined' ? document.getElementById('tutorial-preview-canvas') : null;
        if (!c) return;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        const w = c.width, h = c.height;
        ctx.imageSmoothingEnabled = false;

        const halfW = Math.floor(w / 2);

        // Day half on left
        const dayGrad = ctx.createLinearGradient(0, 0, halfW, 0);
        dayGrad.addColorStop(0, '#4a8ee8');
        dayGrad.addColorStop(1, '#9cd1ff');
        ctx.fillStyle = dayGrad;
        ctx.fillRect(0, 0, halfW, h);

        // Night half on right
        const nightGrad = ctx.createLinearGradient(halfW, 0, w, 0);
        nightGrad.addColorStop(0, '#101728');
        nightGrad.addColorStop(1, '#080c16');
        ctx.fillStyle = nightGrad;
        ctx.fillRect(halfW, 0, halfW, h);

        // Night twinkling pixel stars
        ctx.fillStyle = '#ffffff';
        const stars = [[halfW + 40, 20], [halfW + 110, 45], [halfW + 190, 15], [halfW + 260, 35], [halfW + 320, 25]];
        stars.forEach(([sx, sy]) => ctx.fillRect(sx, sy, 2, 2));

        // Golden divider
        ctx.strokeStyle = '#ffd34d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(halfW, 0);
        ctx.lineTo(halfW, h);
        ctx.stroke();

        // Day Ground
        const bSize = 24;
        const groundY = h - 36;
        for (let x = 0; x < halfW; x += bSize) {
            drawTutorialBlock(ctx, IDS.GRASS, x, groundY, bSize);
            drawTutorialBlock(ctx, IDS.DIRT, x, groundY + bSize, bSize);
        }

        // Night Ground
        for (let x = halfW; x < w; x += bSize) {
            drawTutorialBlock(ctx, IDS.GRASS, x, groundY, bSize);
            drawTutorialBlock(ctx, IDS.DIRT, x, groundY + bSize, bSize);
        }
        ctx.fillStyle = 'rgba(5, 10, 20, 0.45)';
        ctx.fillRect(halfW, groundY, halfW, 40);

        // Banners
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 20px VT323, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DAY: PEACEFUL FAUNA', halfW / 2, 22);

        ctx.fillStyle = '#f87171';
        ctx.fillText('NIGHT: DANGEROUS MONSTERS', halfW + halfW / 2, 22);

        // Animals
        try {
            if (typeof Pig === 'function') {
                const p = new Pig(80, groundY - 24);
                p.dir = 1;
                p.draw(ctx, 0, 0);
            }
            if (typeof Sheep === 'function') {
                const s = new Sheep(210, groundY - 28);
                s.dir = 1;
                s.draw(ctx, 0, 0);
            }
        } catch(e) {}

        // Red Flower
        drawTutorialBlock(ctx, IDS.FLOWER_RED, 150, groundY - 20, 20);

        // Shelter on right with Bed & Torch
        drawTutorialBlock(ctx, IDS.BED, w - 80, groundY - 18, 36);
        drawTutorialBlock(ctx, IDS.TORCH, w - 110, groundY - 24, 20);
        const tGlow = ctx.createRadialGradient(w - 100, groundY - 14, 2, w - 100, groundY - 14, 35);
        tGlow.addColorStop(0, 'rgba(255, 180, 50, 0.35)');
        tGlow.addColorStop(1, 'rgba(255, 180, 50, 0)');
        ctx.fillStyle = tGlow;
        ctx.fillRect(w - 135, groundY - 49, 70, 70);

        // Monsters
        try {
            if (typeof Zombie === 'function') {
                const z = new Zombie(halfW + 65, groundY - 50);
                z.facingRight = false;
                z.draw(ctx, 0, 0);
            }
            if (typeof Creeper === 'function') {
                const cr = new Creeper(halfW + 165, groundY - 46);
                cr.facingRight = false;
                cr.draw(ctx, 0, 0);
            }
        } catch(e) {}
    }

    export function drawTutorialArmorScene() {
        const c = typeof document !== 'undefined' ? document.getElementById('tutorial-preview-canvas') : null;
        if (!c) return;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        const w = c.width, h = c.height;
        ctx.imageSmoothingEnabled = false;

        // Dark armory stone backdrop
        ctx.fillStyle = '#13171c';
        ctx.fillRect(0, 0, w, h);

        // Subtle armory stone grid
        ctx.strokeStyle = '#1d232a';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 24) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }

        // Top centered banner
        ctx.fillStyle = '#1a222a';
        ctx.fillRect(w / 2 - 200, 7, 400, 24);
        ctx.strokeStyle = '#ffd34d';
        ctx.lineWidth = 1;
        ctx.strokeRect(w / 2 - 200, 7, 400, 24);

        ctx.fillStyle = '#ffd34d';
        ctx.font = 'bold 18px VT323, monospace';
        ctx.textAlign = 'center';
        ctx.fillText("ARMOR & GEAR: +15 SUIT DEFENSE (60% DAMAGE REDUCTION)", w / 2, 24);

        // 5 Armor & Weapon slots, perfectly centered in canvas
        const armors = [
            { id: IDS.HELMET_IRON, name: "Helmet", def: "+2 Armor" },
            { id: IDS.CHESTPLATE_IRON, name: "Chestplate", def: "+6 Armor" },
            { id: IDS.LEGGINGS_IRON, name: "Leggings", def: "+5 Armor" },
            { id: IDS.BOOTS_IRON, name: "Boots", def: "+2 Armor" },
            { id: IDS.IRON_SWORD, name: "Sword", def: "6 Attack" }
        ];

        const slotSize = 46;
        const spacing = 110;
        const totalW = (armors.length - 1) * spacing + slotSize;
        const startX = Math.floor((w - totalW) / 2);
        const sy = 40;

        for (let i = 0; i < armors.length; i++) {
            const it = armors[i];
            const sx = startX + i * spacing;

            // Slot shadow / base
            ctx.fillStyle = '#0a0d10';
            ctx.fillRect(sx, sy, slotSize, slotSize);
            ctx.strokeStyle = '#333a41';
            ctx.lineWidth = 2;
            ctx.strokeRect(sx, sy, slotSize, slotSize);

            // Highlight bevel
            ctx.strokeStyle = '#5a6672';
            ctx.beginPath();
            ctx.moveTo(sx, sy + slotSize);
            ctx.lineTo(sx, sy);
            ctx.lineTo(sx + slotSize, sy);
            ctx.stroke();

            // Inner dark inset
            ctx.fillStyle = '#101418';
            ctx.fillRect(sx + 3, sy + 3, slotSize - 6, slotSize - 6);

            // Real Texture inside slot
            drawTutorialBlock(ctx, it.id, sx + 7, sy + 7, 32);

            // Label
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px VT323, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(it.name, sx + slotSize / 2, sy + slotSize + 16);

            // Stat
            ctx.fillStyle = (i === 4) ? '#fde047' : '#67e8f9';
            ctx.font = '16px VT323, monospace';
            ctx.fillText(it.def, sx + slotSize / 2, sy + slotSize + 30);
        }

        // Left and right Storage Chests for aesthetic balance
        drawTutorialBlock(ctx, IDS.CHEST, 42, 46, 38);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px VT323, monospace';
        ctx.textAlign = 'center';
        ctx.fillText("Storage", 61, 102);

        drawTutorialBlock(ctx, IDS.CHEST, w - 80, 46, 38);
        ctx.fillText("Storage", w - 61, 102);
    }

    export function drawTutorialMultiplayerScene() {
        const c = typeof document !== 'undefined' ? document.getElementById('tutorial-preview-canvas') : null;
        if (!c) return;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        const w = c.width, h = c.height;
        ctx.imageSmoothingEnabled = false;

        // Dark sky with sunset tones
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#1c2842');
        bgGrad.addColorStop(0.6, '#313e61');
        bgGrad.addColorStop(1, '#53435c');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Ground terrain
        const bSize = 24;
        const groundY = h - 36;
        for (let x = 0; x < w; x += bSize) {
            drawTutorialBlock(ctx, IDS.GRASS, x, groundY, bSize);
            drawTutorialBlock(ctx, IDS.DIRT, x, groundY + bSize, bSize);
        }

        // Two Co-op Players
        const p1X = 140, p1Y = groundY - 44;
        ctx.fillStyle = '#1c6ca8';
        ctx.fillRect(p1X, p1Y + 20, 12, 16);
        ctx.fillStyle = '#299cd2';
        ctx.fillRect(p1X - 1, p1Y + 8, 14, 13);
        ctx.fillStyle = '#f8b584';
        ctx.fillRect(p1X + 1, p1Y - 4, 11, 12);
        ctx.fillStyle = '#4a2c16';
        ctx.fillRect(p1X, p1Y - 6, 13, 5);
        drawTutorialBlock(ctx, IDS.TORCH, p1X + 12, p1Y + 2, 20);

        // Player 2 (Custom Skin)
        const p2X = 220, p2Y = groundY - 44;
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(p2X, p2Y + 20, 12, 16);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(p2X - 1, p2Y + 8, 14, 13);
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(p2X + 1, p2Y - 4, 11, 12);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(p2X, p2Y - 6, 13, 5);
        drawTutorialBlock(ctx, IDS.IRON_SWORD, p2X + 12, p2Y + 2, 20);

        // Storage Chest
        drawTutorialBlock(ctx, IDS.CHEST, 290, groundY - 26, 32);

        // Speech Bubble
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(130, 16, 210, 32);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.strokeRect(130, 16, 210, 32);
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 18px VT323, monospace';
        ctx.textAlign = 'left';
        ctx.fillText("<Alex>: Ready to mine diamond ore!", 138, 38);

        // Right side: Multiplayer Room Banner
        const bannerX = 400;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bannerX, 22, 320, 68);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.strokeRect(bannerX, 22, 320, 68);

        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 22px VT323, monospace';
        ctx.fillText("● MULTIPLAYER WORLD", bannerX + 16, 46);
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px VT323, monospace';
        ctx.fillText("Room: Co-Op Survival [2 / 8 Players]", bannerX + 16, 66);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '16px VT323, monospace';
        ctx.fillText("Ping: 24ms | Seamless P2P Sync", bannerX + 16, 82);
    }

    export let isTutorialOnboardingMode = false;
    export let tutorialOnboardingCallback = null;

    export function renderTutorialStep(stepIndex) {
        currentTutorialStep = Math.max(0, Math.min(TOTAL_TUTORIAL_STEPS - 1, stepIndex));
        const step = TUTORIAL_STEPS[currentTutorialStep];
        if (!step) return;

        const titleEl = document.getElementById('tutorial-title');
        if (titleEl) titleEl.innerText = step.title;

        const indicatorEl = document.getElementById('tutorial-step-indicator');
        if (indicatorEl) indicatorEl.innerText = `${currentTutorialStep + 1} / ${TOTAL_TUTORIAL_STEPS}`;

        // Sync Top Navigation Tabs
        const tabs = document.querySelectorAll('#tutorial-step-tabs button');
        tabs.forEach((tab, idx) => {
            tab.classList.toggle('active', idx === currentTutorialStep);
        });

        const contentEl = document.getElementById('tutorial-step-content');
        if (contentEl) {
            step.render(contentEl);
        }

        // Prev / Next button states
        const prevBtn = document.getElementById('tutorial-prev-btn');
        if (prevBtn) {
            prevBtn.style.visibility = (currentTutorialStep === 0) ? 'hidden' : 'visible';
            prevBtn.innerText = "< Previous";
            prevBtn.className = "mc-btn tutorial-nav-btn prev-btn";
        }

        const nextBtn = document.getElementById('tutorial-next-btn');
        if (nextBtn) {
            if (currentTutorialStep === TOTAL_TUTORIAL_STEPS - 1) {
                nextBtn.innerText = isTutorialOnboardingMode ? "Enter World" : "I Understand";
                nextBtn.className = "mc-btn tutorial-nav-btn finish-btn";
            } else {
                nextBtn.innerText = "Next >";
                nextBtn.className = "mc-btn tutorial-nav-btn next-btn";
            }
        }
    }

    export function openTutorialModal(step = 0, options = {}) {
        const modal = document.getElementById('tutorial-modal');
        if (!modal) return;
        isTutorialOnboardingMode = !!(options && options.onboarding);
        tutorialOnboardingCallback = (options && typeof options.onComplete === 'function') ? options.onComplete : null;
        renderTutorialStep(step);
        modal.classList.remove('hidden');
    }

    export function closeTutorialModal() {
        const modal = document.getElementById('tutorial-modal');
        if (modal) modal.classList.add('hidden');
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('webcraft_tutorial_seen', 'true');
            }
        } catch(e) {}

        const cb = tutorialOnboardingCallback;
        const wasOnboarding = isTutorialOnboardingMode;
        tutorialOnboardingCallback = null;
        isTutorialOnboardingMode = false;

        if (wasOnboarding && typeof cb === 'function') {
            cb();
        }
    }

    export function nextTutorialStep() {
        if (currentTutorialStep < TOTAL_TUTORIAL_STEPS - 1) {
            renderTutorialStep(currentTutorialStep + 1);
        } else {
            closeTutorialModal();
        }
    }

    export function prevTutorialStep() {
        if (currentTutorialStep > 0) {
            renderTutorialStep(currentTutorialStep - 1);
        }
    }

    export function goToTutorialStep(step) {
        renderTutorialStep(step);
    }

// Global Window Bridge for cross-module & HTML event compatibility
try { if (typeof ACCENT_PRESETS !== "undefined") window.ACCENT_PRESETS = ACCENT_PRESETS; } catch(e) {}
try { if (typeof ACHIEVEMENTS !== "undefined") window.ACHIEVEMENTS = ACHIEVEMENTS; } catch(e) {}
try { if (typeof DEFAULT_ACCENT_COLOR !== "undefined") window.DEFAULT_ACCENT_COLOR = DEFAULT_ACCENT_COLOR; } catch(e) {}
try { if (typeof DEFAULT_KEYBINDS !== "undefined") window.DEFAULT_KEYBINDS = DEFAULT_KEYBINDS; } catch(e) {}
try { if (typeof DISPLAY_VERSION !== "undefined") window.DISPLAY_VERSION = DISPLAY_VERSION; } catch(e) {}
try { if (typeof GAME_BUILD !== "undefined") window.GAME_BUILD = GAME_BUILD; } catch(e) {}
try { if (typeof GAME_VERSION !== "undefined") window.GAME_VERSION = GAME_VERSION; } catch(e) {}
try { if (typeof KEYBINDS !== "undefined") window.KEYBINDS = KEYBINDS; } catch(e) {}
try { if (typeof MP_CHUNK_SIZE !== "undefined") window.MP_CHUNK_SIZE = MP_CHUNK_SIZE; } catch(e) {}
try { if (typeof RECIPES !== "undefined") window.RECIPES = RECIPES; } catch(e) {}
try { if (typeof SHOPKEEPER_DIALOGUES !== "undefined") window.SHOPKEEPER_DIALOGUES = SHOPKEEPER_DIALOGUES; } catch(e) {}
try { if (typeof SPLASH_TEXTS !== "undefined") window.SPLASH_TEXTS = SPLASH_TEXTS; } catch(e) {}
try { if (typeof addArmorDurabilityBar !== "undefined") window.addArmorDurabilityBar = addArmorDurabilityBar; } catch(e) {}
try { if (typeof addCurrentColorToCustom !== "undefined") window.addCurrentColorToCustom = addCurrentColorToCustom; } catch(e) {}
try { if (typeof addDurabilityBar !== "undefined") window.addDurabilityBar = addDurabilityBar; } catch(e) {}
try { if (typeof addGallerySkinToLibrary !== "undefined") window.addGallerySkinToLibrary = addGallerySkinToLibrary; } catch(e) {}
try { if (typeof addPlayerEmeralds !== "undefined") window.addPlayerEmeralds = addPlayerEmeralds; } catch(e) {}
try { if (typeof adjustBrightness !== "undefined") window.adjustBrightness = adjustBrightness; } catch(e) {}
try { if (typeof advanceIntro !== "undefined") window.advanceIntro = advanceIntro; } catch(e) {}
try { if (typeof appendChatMessage !== "undefined") window.appendChatMessage = appendChatMessage; } catch(e) {}
try { if (typeof applyAccentColor !== "undefined") window.applyAccentColor = applyAccentColor; } catch(e) {}
try { if (typeof applyAccentPreset !== "undefined") window.applyAccentPreset = applyAccentPreset; } catch(e) {}
try { if (typeof applyMinimapShape !== "undefined") window.applyMinimapShape = applyMinimapShape; } catch(e) {}
try { if (typeof applySkinEdit !== "undefined") window.applySkinEdit = applySkinEdit; } catch(e) {}
try { if (typeof autoSaveSkin !== "undefined") window.autoSaveSkin = autoSaveSkin; } catch(e) {}
try { if (typeof buildMinimapCircleBezel !== "undefined") window.buildMinimapCircleBezel = buildMinimapCircleBezel; } catch(e) {}
try { if (typeof buyAndEquipGallerySkin !== "undefined") window.buyAndEquipGallerySkin = buyAndEquipGallerySkin; } catch(e) {}
try { if (typeof cachedMinimapCircleBezelCanvas !== "undefined") window.cachedMinimapCircleBezelCanvas = cachedMinimapCircleBezelCanvas; } catch(e) {}
try { if (typeof canFitItem !== "undefined") window.canFitItem = canFitItem; } catch(e) {}
try { if (typeof centerMapOnPlayer !== "undefined") window.centerMapOnPlayer = centerMapOnPlayer; } catch(e) {}
try { if (typeof changeMapZoom !== "undefined") window.changeMapZoom = changeMapZoom; } catch(e) {}
try { if (typeof chatSeenMessageIds !== "undefined") window.chatSeenMessageIds = chatSeenMessageIds; } catch(e) {}
try { if (typeof checkAfkKick !== "undefined") window.checkAfkKick = checkAfkKick; } catch(e) {}
try { if (typeof checkArmorAchievements !== "undefined") window.checkArmorAchievements = checkArmorAchievements; } catch(e) {}
try { if (typeof checkAutosave !== "undefined") window.checkAutosave = checkAutosave; } catch(e) {}
try { if (typeof checkNearCraftingTable !== "undefined") window.checkNearCraftingTable = checkNearCraftingTable; } catch(e) {}
try { if (typeof clearCraftingSearch !== "undefined") window.clearCraftingSearch = clearCraftingSearch; } catch(e) {}
try { if (typeof clearUnsupportedWorldStorage !== "undefined") window.clearUnsupportedWorldStorage = clearUnsupportedWorldStorage; } catch(e) {}
try { if (typeof closeAccentColorPicker !== "undefined") window.closeAccentColorPicker = closeAccentColorPicker; } catch(e) {}
try { if (typeof closeAchievements !== "undefined") window.closeAchievements = closeAchievements; } catch(e) {}
try { if (typeof closeChat !== "undefined") window.closeChat = closeChat; } catch(e) {}
try { if (typeof closeCredits !== "undefined") window.closeCredits = closeCredits; } catch(e) {}
try { if (typeof closeNewWorldModal !== "undefined") window.closeNewWorldModal = closeNewWorldModal; } catch(e) {}
try { if (typeof closeSettings !== "undefined") window.closeSettings = closeSettings; } catch(e) {}
try { if (typeof closeSkinMaker !== "undefined") window.closeSkinMaker = closeSkinMaker; } catch(e) {}
try { if (typeof closeSkinOwnedModal !== "undefined") window.closeSkinOwnedModal = closeSkinOwnedModal; } catch(e) {}
try { if (typeof closeSkinUploadModal !== "undefined") window.closeSkinUploadModal = closeSkinUploadModal; } catch(e) {}
try { if (typeof closeSkins !== "undefined") window.closeSkins = closeSkins; } catch(e) {}
try { if (typeof closeWhatsNew !== "undefined") window.closeWhatsNew = closeWhatsNew; } catch(e) {}
try { if (typeof closeWorldsMenu !== "undefined") window.closeWorldsMenu = closeWorldsMenu; } catch(e) {}
try { if (typeof compileRemoteSkin !== "undefined") window.compileRemoteSkin = compileRemoteSkin; } catch(e) {}
try { if (typeof compileSkinCanvas !== "undefined") window.compileSkinCanvas = compileSkinCanvas; } catch(e) {}
try { if (typeof compressChunk !== "undefined") window.compressChunk = compressChunk; } catch(e) {}
try { if (typeof compressWorld !== "undefined") window.compressWorld = compressWorld; } catch(e) {}
try { if (typeof confirmCreateWorld !== "undefined") window.confirmCreateWorld = confirmCreateWorld; } catch(e) {}
try { if (typeof confirmSkinUpload !== "undefined") window.confirmSkinUpload = confirmSkinUpload; } catch(e) {}
try { if (typeof consumeItem !== "undefined") window.consumeItem = consumeItem; } catch(e) {}
try { if (typeof craftRecipe !== "undefined") window.craftRecipe = craftRecipe; } catch(e) {}
try { if (typeof craftedItemsCount !== "undefined") window.craftedItemsCount = craftedItemsCount; } catch(e) {}
try { if (typeof craftingCategory !== "undefined") window.craftingCategory = craftingCategory; } catch(e) {}
try { if (typeof craftingSearchQuery !== "undefined") window.craftingSearchQuery = craftingSearchQuery; } catch(e) {}
try { if (typeof createGallerySkinCard !== "undefined") window.createGallerySkinCard = createGallerySkinCard; } catch(e) {}
try { if (typeof createSkinCard !== "undefined") window.createSkinCard = createSkinCard; } catch(e) {}
try { if (typeof currentAccentColor !== "undefined") window.currentAccentColor = currentAccentColor; } catch(e) {}
try { if (typeof currentAccentName !== "undefined") window.currentAccentName = currentAccentName; } catch(e) {}
try { if (typeof currentAchievementsTab !== "undefined") window.currentAchievementsTab = currentAchievementsTab; } catch(e) {}
try { if (typeof currentColor !== "undefined") window.currentColor = currentColor; } catch(e) {}
try { if (typeof currentShopkeeperDialogueIdx !== "undefined") window.currentShopkeeperDialogueIdx = currentShopkeeperDialogueIdx; } catch(e) {}
try { if (typeof currentTool !== "undefined") window.currentTool = currentTool; } catch(e) {}
try { if (typeof currentUploadPrice !== "undefined") window.currentUploadPrice = currentUploadPrice; } catch(e) {}
try { if (typeof currentWorldAchievementsEnabled !== "undefined") window.currentWorldAchievementsEnabled = currentWorldAchievementsEnabled; } catch(e) {}
try { if (typeof cycleFpsCap !== "undefined") window.cycleFpsCap = cycleFpsCap; } catch(e) {}
try { if (typeof cycleShopkeeperDialogue !== "undefined") window.cycleShopkeeperDialogue = cycleShopkeeperDialogue; } catch(e) {}
try { if (typeof cycleWorldDifficulty !== "undefined") window.cycleWorldDifficulty = cycleWorldDifficulty; } catch(e) {}
try { if (typeof damageSelectedTool !== "undefined") window.damageSelectedTool = damageSelectedTool; } catch(e) {}
try { if (typeof decompressChunkInto !== "undefined") window.decompressChunkInto = decompressChunkInto; } catch(e) {}
try { if (typeof decompressWorld !== "undefined") window.decompressWorld = decompressWorld; } catch(e) {}
try { if (typeof deepBlocksMinedCount !== "undefined") window.deepBlocksMinedCount = deepBlocksMinedCount; } catch(e) {}
try { if (typeof deleteSkin !== "undefined") window.deleteSkin = deleteSkin; } catch(e) {}
try { if (typeof deleteWorld !== "undefined") window.deleteWorld = deleteWorld; } catch(e) {}
try { if (typeof dismissKickModal !== "undefined") window.dismissKickModal = dismissKickModal; } catch(e) {}
try { if (typeof drawShopkeeperAvatar !== "undefined") window.drawShopkeeperAvatar = drawShopkeeperAvatar; } catch(e) {}
try { if (typeof eCtx !== "undefined") window.eCtx = eCtx; } catch(e) {}
try { if (typeof editSkin !== "undefined") window.editSkin = editSkin; } catch(e) {}
try { if (typeof editorCanvas !== "undefined") window.editorCanvas = editorCanvas; } catch(e) {}
try { if (typeof ensureToolDurability !== "undefined") window.ensureToolDurability = ensureToolDurability; } catch(e) {}
try { if (typeof exportSkin !== "undefined") window.exportSkin = exportSkin; } catch(e) {}
try { if (typeof exportWorld !== "undefined") window.exportWorld = exportWorld; } catch(e) {}
try { if (typeof fillSkin !== "undefined") window.fillSkin = fillSkin; } catch(e) {}
try { if (typeof filterAchievementsByDiff !== "undefined") window.filterAchievementsByDiff = filterAchievementsByDiff; } catch(e) {}
try { if (typeof finishIntro !== "undefined") window.finishIntro = finishIntro; } catch(e) {}
try { if (typeof floodFillSkin !== "undefined") window.floodFillSkin = floodFillSkin; } catch(e) {}
try { if (typeof formatAchievementDate !== "undefined") window.formatAchievementDate = formatAchievementDate; } catch(e) {}
try { if (typeof formatKeyDisplay !== "undefined") window.formatKeyDisplay = formatKeyDisplay; } catch(e) {}
try { if (typeof generateDefaultSkin !== "undefined") window.generateDefaultSkin = generateDefaultSkin; } catch(e) {}
try { if (typeof getAccentPalette !== "undefined") window.getAccentPalette = getAccentPalette; } catch(e) {}
try { if (typeof getAchievementEmeraldReward !== "undefined") window.getAchievementEmeraldReward = getAchievementEmeraldReward; } catch(e) {}
try { if (typeof getAchievementsStorage !== "undefined") window.getAchievementsStorage = getAchievementsStorage; } catch(e) {}
try { if (typeof getActiveSkinEditorData !== "undefined") window.getActiveSkinEditorData = getActiveSkinEditorData; } catch(e) {}
try { if (typeof getActiveSkinId !== "undefined") window.getActiveSkinId = getActiveSkinId; } catch(e) {}
try { if (typeof getClaimedAchievementRewards !== "undefined") window.getClaimedAchievementRewards = getClaimedAchievementRewards; } catch(e) {}
try { if (typeof getClientUid !== "undefined") window.getClientUid = getClientUid; } catch(e) {}
try { if (typeof getDefaultSkinData !== "undefined") window.getDefaultSkinData = getDefaultSkinData; } catch(e) {}
try { if (typeof getEditorGridPos !== "undefined") window.getEditorGridPos = getEditorGridPos; } catch(e) {}
try { if (typeof getFuelValue !== "undefined") window.getFuelValue = getFuelValue; } catch(e) {}
try { if (typeof getMapBlockName !== "undefined") window.getMapBlockName = getMapBlockName; } catch(e) {}
try { if (typeof getMemoryUsageText !== "undefined") window.getMemoryUsageText = getMemoryUsageText; } catch(e) {}
try { if (typeof getPixelEmeraldSvg !== "undefined") window.getPixelEmeraldSvg = getPixelEmeraldSvg; } catch(e) {}
try { if (typeof getPlayerEmeralds !== "undefined") window.getPlayerEmeralds = getPlayerEmeralds; } catch(e) {}
try { if (typeof getPurchasedSkins !== "undefined") window.getPurchasedSkins = getPurchasedSkins; } catch(e) {}
try { if (typeof getRecipeCategory !== "undefined") window.getRecipeCategory = getRecipeCategory; } catch(e) {}
try { if (typeof getSavedSkins !== "undefined") window.getSavedSkins = getSavedSkins; } catch(e) {}
try { if (typeof getSavedWorlds !== "undefined") window.getSavedWorlds = getSavedWorlds; } catch(e) {}
try { if (typeof getSkinToneFromContext !== "undefined") window.getSkinToneFromContext = getSkinToneFromContext; } catch(e) {}
try { if (typeof getSmeltResult !== "undefined") window.getSmeltResult = getSmeltResult; } catch(e) {}
try { if (typeof giveItem !== "undefined") window.giveItem = giveItem; } catch(e) {}
try { if (typeof goToMySkinsFromOwnedModal !== "undefined") window.goToMySkinsFromOwnedModal = goToMySkinsFromOwnedModal; } catch(e) {}
try { if (typeof handleArmorSlotClick !== "undefined") window.handleArmorSlotClick = handleArmorSlotClick; } catch(e) {}
try { if (typeof handleCraftingSearch !== "undefined") window.handleCraftingSearch = handleCraftingSearch; } catch(e) {}
try { if (typeof handleEditorCanvasAction !== "undefined") window.handleEditorCanvasAction = handleEditorCanvasAction; } catch(e) {}
try { if (typeof handleRebindKey !== "undefined") window.handleRebindKey = handleRebindKey; } catch(e) {}
try { if (typeof handleSlotClick !== "undefined") window.handleSlotClick = handleSlotClick; } catch(e) {}
try { if (typeof hasItem !== "undefined") window.hasItem = hasItem; } catch(e) {}
try { if (typeof hexToRgb !== "undefined") window.hexToRgb = hexToRgb; } catch(e) {}
try { if (typeof hotbarWrapAround !== "undefined") window.hotbarWrapAround = hotbarWrapAround; } catch(e) {}
try { if (typeof importSkin !== "undefined") window.importSkin = importSkin; } catch(e) {}
try { if (typeof importWorld !== "undefined") window.importWorld = importWorld; } catch(e) {}
try { if (typeof initChatEvents !== "undefined") window.initChatEvents = initChatEvents; } catch(e) {}
try { if (typeof initEmeraldSystem !== "undefined") window.initEmeraldSystem = initEmeraldSystem; } catch(e) {}
try { if (typeof initSkinEditor !== "undefined") window.initSkinEditor = initSkinEditor; } catch(e) {}
try { if (typeof initWorldMapEvents !== "undefined") window.initWorldMapEvents = initWorldMapEvents; } catch(e) {}
try { if (typeof invertScrollWheel !== "undefined") window.invertScrollWheel = invertScrollWheel; } catch(e) {}
try { if (typeof isActionActive !== "undefined") window.isActionActive = isActionActive; } catch(e) {}
try { if (typeof isChatOpen !== "undefined") window.isChatOpen = isChatOpen; } catch(e) {}
try { if (typeof isDrawing !== "undefined") window.isDrawing = isDrawing; } catch(e) {}
try { if (typeof isErasing !== "undefined") window.isErasing = isErasing; } catch(e) {}
try { if (typeof isMyGallerySkin !== "undefined") window.isMyGallerySkin = isMyGallerySkin; } catch(e) {}
try { if (typeof isSkinInMySkins !== "undefined") window.isSkinInMySkins = isSkinInMySkins; } catch(e) {}
try { if (typeof isSkinOwned !== "undefined") window.isSkinOwned = isSkinOwned; } catch(e) {}
try { if (typeof isTool !== "undefined") window.isTool = isTool; } catch(e) {}
try { if (typeof lastAutosaveTimestamp !== "undefined") window.lastAutosaveTimestamp = lastAutosaveTimestamp; } catch(e) {}
try { if (typeof lastSplashText !== "undefined") window.lastSplashText = lastSplashText; } catch(e) {}
try { if (typeof lastUiClickSoundTime !== "undefined") window.lastUiClickSoundTime = lastUiClickSoundTime; } catch(e) {}
try { if (typeof loadSavedSettings !== "undefined") window.loadSavedSettings = loadSavedSettings; } catch(e) {}
try { if (typeof loadSkin !== "undefined") window.loadSkin = loadSkin; } catch(e) {}
try { if (typeof loadSkinGallery !== "undefined") window.loadSkinGallery = loadSkinGallery; } catch(e) {}
try { if (typeof loadWorld !== "undefined") window.loadWorld = loadWorld; } catch(e) {}
try { if (typeof loadWorldData !== "undefined") window.loadWorldData = loadWorldData; } catch(e) {}
try { if (typeof minimapShape !== "undefined") window.minimapShape = minimapShape; } catch(e) {}
try { if (typeof monstersKilledCount !== "undefined") window.monstersKilledCount = monstersKilledCount; } catch(e) {}
try { if (typeof moveItemToContainer !== "undefined") window.moveItemToContainer = moveItemToContainer; } catch(e) {}
try { if (typeof openAchievements !== "undefined") window.openAchievements = openAchievements; } catch(e) {}
try { if (typeof openAchievementsFromPause !== "undefined") window.openAchievementsFromPause = openAchievementsFromPause; } catch(e) {}
try { if (typeof openChat !== "undefined") window.openChat = openChat; } catch(e) {}
try { if (typeof openCredits !== "undefined") window.openCredits = openCredits; } catch(e) {}
try { if (typeof openNewWorldModal !== "undefined") window.openNewWorldModal = openNewWorldModal; } catch(e) {}
try { if (typeof openSettings !== "undefined") window.openSettings = openSettings; } catch(e) {}
try { if (typeof openSettingsFromPause !== "undefined") window.openSettingsFromPause = openSettingsFromPause; } catch(e) {}
try { if (typeof openSkinMaker !== "undefined") window.openSkinMaker = openSkinMaker; } catch(e) {}
try { if (typeof openSkinOwnedModal !== "undefined") window.openSkinOwnedModal = openSkinOwnedModal; } catch(e) {}
try { if (typeof openSkinUploadModal !== "undefined") window.openSkinUploadModal = openSkinUploadModal; } catch(e) {}
try { if (typeof openSkins !== "undefined") window.openSkins = openSkins; } catch(e) {}
try { if (typeof openWhatsNew !== "undefined") window.openWhatsNew = openWhatsNew; } catch(e) {}
try { if (typeof openWhatsNewOnce !== "undefined") window.openWhatsNewOnce = openWhatsNewOnce; } catch(e) {}
try { if (typeof openWorldsMenu !== "undefined") window.openWorldsMenu = openWorldsMenu; } catch(e) {}
try { if (typeof openedAchievementsFromPause !== "undefined") window.openedAchievementsFromPause = openedAchievementsFromPause; } catch(e) {}
try { if (typeof pendingUploadSkinData !== "undefined") window.pendingUploadSkinData = pendingUploadSkinData; } catch(e) {}
try { if (typeof pendingUploadSkinId !== "undefined") window.pendingUploadSkinId = pendingUploadSkinId; } catch(e) {}
try { if (typeof performWorldAutosave !== "undefined") window.performWorldAutosave = performWorldAutosave; } catch(e) {}
try { if (typeof persistSkin !== "undefined") window.persistSkin = persistSkin; } catch(e) {}
try { if (typeof playChatChime !== "undefined") window.playChatChime = playChatChime; } catch(e) {}
try { if (typeof playTestSound !== "undefined") window.playTestSound = playTestSound; } catch(e) {}
try { if (typeof populateSlotItemDOM !== "undefined") window.populateSlotItemDOM = populateSlotItemDOM; } catch(e) {}
try { if (typeof previewCanvasEl !== "undefined") window.previewCanvasEl = previewCanvasEl; } catch(e) {}
try { if (typeof publishCurrentSkin !== "undefined") window.publishCurrentSkin = publishCurrentSkin; } catch(e) {}
try { if (typeof quitToMenu !== "undefined") window.quitToMenu = quitToMenu; } catch(e) {}
try { if (typeof rebindingAction !== "undefined") window.rebindingAction = rebindingAction; } catch(e) {}
try { if (typeof rebindingBtnEl !== "undefined") window.rebindingBtnEl = rebindingBtnEl; } catch(e) {}
try { if (typeof recentSkinColors !== "undefined") window.recentSkinColors = recentSkinColors; } catch(e) {}
try { if (typeof recordPurchasedSkin !== "undefined") window.recordPurchasedSkin = recordPurchasedSkin; } catch(e) {}
try { if (typeof redoSkinEdit !== "undefined") window.redoSkinEdit = redoSkinEdit; } catch(e) {}
try { if (typeof renderAchievementsList !== "undefined") window.renderAchievementsList = renderAchievementsList; } catch(e) {}
try { if (typeof renderCraftingRecipes !== "undefined") window.renderCraftingRecipes = renderCraftingRecipes; } catch(e) {}
try { if (typeof renderEditorCanvas !== "undefined") window.renderEditorCanvas = renderEditorCanvas; } catch(e) {}
try { if (typeof renderPaletteMatrix !== "undefined") window.renderPaletteMatrix = renderPaletteMatrix; } catch(e) {}
try { if (typeof renderPatchNoteList !== "undefined") window.renderPatchNoteList = renderPatchNoteList; } catch(e) {}
try { if (typeof renderRecentSkinColors !== "undefined") window.renderRecentSkinColors = renderRecentSkinColors; } catch(e) {}
try { if (typeof renderSkinLibrary !== "undefined") window.renderSkinLibrary = renderSkinLibrary; } catch(e) {}
try { if (typeof renderWhatsNewHistory !== "undefined") window.renderWhatsNewHistory = renderWhatsNewHistory; } catch(e) {}
try { if (typeof renderWorldsList !== "undefined") window.renderWorldsList = renderWorldsList; } catch(e) {}
try { if (typeof resetAccentColor !== "undefined") window.resetAccentColor = resetAccentColor; } catch(e) {}
try { if (typeof resetAchievements !== "undefined") window.resetAchievements = resetAchievements; } catch(e) {}
try { if (typeof resetKeybindsToDefault !== "undefined") window.resetKeybindsToDefault = resetKeybindsToDefault; } catch(e) {}
try { if (typeof resetMapView !== "undefined") window.resetMapView = resetMapView; } catch(e) {}
try { if (typeof resetSkinHistory !== "undefined") window.resetSkinHistory = resetSkinHistory; } catch(e) {}
try { if (typeof resetSkinToDefault !== "undefined") window.resetSkinToDefault = resetSkinToDefault; } catch(e) {}
try { if (typeof respawn !== "undefined") window.respawn = respawn; } catch(e) {}
try { if (typeof rgbToHex !== "undefined") window.rgbToHex = rgbToHex; } catch(e) {}
try { if (typeof saveAchievementsStorage !== "undefined") window.saveAchievementsStorage = saveAchievementsStorage; } catch(e) {}
try { if (typeof saveCurrentSettings !== "undefined") window.saveCurrentSettings = saveCurrentSettings; } catch(e) {}
try { if (typeof saveCurrentWorld !== "undefined") window.saveCurrentWorld = saveCurrentWorld; } catch(e) {}
try { if (typeof saveSavedSkins !== "undefined") window.saveSavedSkins = saveSavedSkins; } catch(e) {}
try { if (typeof saveSkin !== "undefined") window.saveSkin = saveSkin; } catch(e) {}
try { if (typeof saveWorldsList !== "undefined") window.saveWorldsList = saveWorldsList; } catch(e) {}
try { if (typeof scrollSensitivity !== "undefined") window.scrollSensitivity = scrollSensitivity; } catch(e) {}
try { if (typeof selectDifficulty !== "undefined") window.selectDifficulty = selectDifficulty; } catch(e) {}
try { if (typeof selectSkin !== "undefined") window.selectSkin = selectSkin; } catch(e) {}
try { if (typeof selectSkinColor !== "undefined") window.selectSkinColor = selectSkinColor; } catch(e) {}
try { if (typeof selectSkinTool !== "undefined") window.selectSkinTool = selectSkinTool; } catch(e) {}
try { if (typeof selectedAchDifficultyFilter !== "undefined") window.selectedAchDifficultyFilter = selectedAchDifficultyFilter; } catch(e) {}
try { if (typeof sendCurrentChatMessage !== "undefined") window.sendCurrentChatMessage = sendCurrentChatMessage; } catch(e) {}
try { if (typeof setCraftingCategory !== "undefined") window.setCraftingCategory = setCraftingCategory; } catch(e) {}
try { if (typeof setCustomAccentColor !== "undefined") window.setCustomAccentColor = setCustomAccentColor; } catch(e) {}
try { if (typeof setPlayerEmeralds !== "undefined") window.setPlayerEmeralds = setPlayerEmeralds; } catch(e) {}
try { if (typeof setRandomSplashText !== "undefined") window.setRandomSplashText = setRandomSplashText; } catch(e) {}
try { if (typeof setSkinToolStatus !== "undefined") window.setSkinToolStatus = setSkinToolStatus; } catch(e) {}
try { if (typeof setSkinUploadPrice !== "undefined") window.setSkinUploadPrice = setSkinUploadPrice; } catch(e) {}
try { if (typeof setupFurnaceSlot !== "undefined") window.setupFurnaceSlot = setupFurnaceSlot; } catch(e) {}
try { if (typeof showAchievementBanner !== "undefined") window.showAchievementBanner = showAchievementBanner; } catch(e) {}
try { if (typeof showAutosaveToast !== "undefined") window.showAutosaveToast = showAutosaveToast; } catch(e) {}
try { if (typeof showBiomeGrading !== "undefined") window.showBiomeGrading = showBiomeGrading; } catch(e) {}
try { if (typeof showEditorGrid !== "undefined") window.showEditorGrid = showEditorGrid; } catch(e) {}
try { if (typeof showEditorGuides !== "undefined") window.showEditorGuides = showEditorGuides; } catch(e) {}
try { if (typeof showHeatShimmer !== "undefined") window.showHeatShimmer = showHeatShimmer; } catch(e) {}
try { if (typeof showItemPopups !== "undefined") window.showItemPopups = showItemPopups; } catch(e) {}
try { if (typeof showKickModal !== "undefined") window.showKickModal = showKickModal; } catch(e) {}
try { if (typeof showMainMenu !== "undefined") window.showMainMenu = showMainMenu; } catch(e) {}
try { if (typeof showScreenShake !== "undefined") window.showScreenShake = showScreenShake; } catch(e) {}
try { if (typeof showToast !== "undefined") window.showToast = showToast; } catch(e) {}
try { if (typeof showVignette !== "undefined") window.showVignette = showVignette; } catch(e) {}
try { if (typeof skinAutoSaveTimer !== "undefined") window.skinAutoSaveTimer = skinAutoSaveTimer; } catch(e) {}
try { if (typeof skinEditor32Palette !== "undefined") window.skinEditor32Palette = skinEditor32Palette; } catch(e) {}
try { if (typeof skinEditorZoom !== "undefined") window.skinEditorZoom = skinEditorZoom; } catch(e) {}
try { if (typeof skinRedoStack !== "undefined") window.skinRedoStack = skinRedoStack; } catch(e) {}
try { if (typeof skinUndoStack !== "undefined") window.skinUndoStack = skinUndoStack; } catch(e) {}
try { if (typeof startIntro !== "undefined") window.startIntro = startIntro; } catch(e) {}
try { if (typeof startRebinding !== "undefined") window.startRebinding = startRebinding; } catch(e) {}
try { if (typeof startSkinAutoSave !== "undefined") window.startSkinAutoSave = startSkinAutoSave; } catch(e) {}
try { if (typeof switchAchievementTab !== "undefined") window.switchAchievementTab = switchAchievementTab; } catch(e) {}
try { if (typeof switchSettingsTab !== "undefined") window.switchSettingsTab = switchSettingsTab; } catch(e) {}
try { if (typeof switchSkinLibraryTab !== "undefined") window.switchSkinLibraryTab = switchSkinLibraryTab; } catch(e) {}
try { if (typeof toggleAccentColorPicker !== "undefined") window.toggleAccentColorPicker = toggleAccentColorPicker; } catch(e) {}
try { if (typeof toggleAutoJump !== "undefined") window.toggleAutoJump = toggleAutoJump; } catch(e) {}
try { if (typeof toggleBackgroundBuildMode !== "undefined") window.toggleBackgroundBuildMode = toggleBackgroundBuildMode; } catch(e) {}
try { if (typeof toggleClouds !== "undefined") window.toggleClouds = toggleClouds; } catch(e) {}
try { if (typeof toggleDebug !== "undefined") window.toggleDebug = toggleDebug; } catch(e) {}
try { if (typeof toggleFootsteps !== "undefined") window.toggleFootsteps = toggleFootsteps; } catch(e) {}
try { if (typeof toggleGrading !== "undefined") window.toggleGrading = toggleGrading; } catch(e) {}
try { if (typeof toggleGraphics !== "undefined") window.toggleGraphics = toggleGraphics; } catch(e) {}
try { if (typeof toggleHotbarWrap !== "undefined") window.toggleHotbarWrap = toggleHotbarWrap; } catch(e) {}
try { if (typeof toggleIntro !== "undefined") window.toggleIntro = toggleIntro; } catch(e) {}
try { if (typeof toggleInventory !== "undefined") window.toggleInventory = toggleInventory; } catch(e) {}
try { if (typeof toggleInvertWheel !== "undefined") window.toggleInvertWheel = toggleInvertWheel; } catch(e) {}
try { if (typeof toggleItemPopups !== "undefined") window.toggleItemPopups = toggleItemPopups; } catch(e) {}
try { if (typeof toggleMinimapShape !== "undefined") window.toggleMinimapShape = toggleMinimapShape; } catch(e) {}
try { if (typeof toggleMuteAudio !== "undefined") window.toggleMuteAudio = toggleMuteAudio; } catch(e) {}
try { if (typeof toggleScreenShake !== "undefined") window.toggleScreenShake = toggleScreenShake; } catch(e) {}
try { if (typeof toggleShimmer !== "undefined") window.toggleShimmer = toggleShimmer; } catch(e) {}
try { if (typeof toggleSkinEditorGrid !== "undefined") window.toggleSkinEditorGrid = toggleSkinEditorGrid; } catch(e) {}
try { if (typeof toggleSkinEditorGuides !== "undefined") window.toggleSkinEditorGuides = toggleSkinEditorGuides; } catch(e) {}
try { if (typeof toggleTutorial !== "undefined") window.toggleTutorial = toggleTutorial; } catch(e) {}
try { if (typeof toggleVignette !== "undefined") window.toggleVignette = toggleVignette; } catch(e) {}
try { if (typeof toggleWhatsNewStartup !== "undefined") window.toggleWhatsNewStartup = toggleWhatsNewStartup; } catch(e) {}
try { if (typeof toggleWorldMap !== "undefined") window.toggleWorldMap = toggleWorldMap; } catch(e) {}
try { if (typeof triggerHotbarItemPopup !== "undefined") window.triggerHotbarItemPopup = triggerHotbarItemPopup; } catch(e) {}
try { if (typeof undoSkinEdit !== "undefined") window.undoSkinEdit = undoSkinEdit; } catch(e) {}
try { if (typeof unlockAchievement !== "undefined") window.unlockAchievement = unlockAchievement; } catch(e) {}
try { if (typeof unlockAudioContextOnGesture !== "undefined") window.unlockAudioContextOnGesture = unlockAudioContextOnGesture; } catch(e) {}
try { if (typeof updateArmorUI !== "undefined") window.updateArmorUI = updateArmorUI; } catch(e) {}
try { if (typeof updateEmeraldsUI !== "undefined") window.updateEmeraldsUI = updateEmeraldsUI; } catch(e) {}
try { if (typeof updateFurnaceVisual !== "undefined") window.updateFurnaceVisual = updateFurnaceVisual; } catch(e) {}
try { if (typeof updateGraphicsButton !== "undefined") window.updateGraphicsButton = updateGraphicsButton; } catch(e) {}
try { if (typeof updateHealthUI !== "undefined") window.updateHealthUI = updateHealthUI; } catch(e) {}
try { if (typeof updateHudArmorBar !== "undefined") window.updateHudArmorBar = updateHudArmorBar; } catch(e) {}
try { if (typeof updateHungerUI !== "undefined") window.updateHungerUI = updateHungerUI; } catch(e) {}
try { if (typeof updateKeybindButtonsUI !== "undefined") window.updateKeybindButtonsUI = updateKeybindButtonsUI; } catch(e) {}
try { if (typeof updateMapCoordinateReadout !== "undefined") window.updateMapCoordinateReadout = updateMapCoordinateReadout; } catch(e) {}
try { if (typeof updateMapWorldBadge !== "undefined") window.updateMapWorldBadge = updateMapWorldBadge; } catch(e) {}
try { if (typeof updateMapZoomBadge !== "undefined") window.updateMapZoomBadge = updateMapZoomBadge; } catch(e) {}
try { if (typeof updateMasterVolume !== "undefined") window.updateMasterVolume = updateMasterVolume; } catch(e) {}
try { if (typeof updateMpAchievementWarning !== "undefined") window.updateMpAchievementWarning = updateMpAchievementWarning; } catch(e) {}
try { if (typeof updateNewWorldAchievementWarning !== "undefined") window.updateNewWorldAchievementWarning = updateNewWorldAchievementWarning; } catch(e) {}
try { if (typeof updateOxygenUI !== "undefined") window.updateOxygenUI = updateOxygenUI; } catch(e) {}
try { if (typeof updateScrollSens !== "undefined") window.updateScrollSens = updateScrollSens; } catch(e) {}
try { if (typeof updateSettingsDifficultyUI !== "undefined") window.updateSettingsDifficultyUI = updateSettingsDifficultyUI; } catch(e) {}
try { if (typeof updateSettingsUI !== "undefined") window.updateSettingsUI = updateSettingsUI; } catch(e) {}
try { if (typeof updateSfxVolume !== "undefined") window.updateSfxVolume = updateSfxVolume; } catch(e) {}
try { if (typeof updateSkinEditorTitle !== "undefined") window.updateSkinEditorTitle = updateSkinEditorTitle; } catch(e) {}
try { if (typeof updateSkinEditorZoom !== "undefined") window.updateSkinEditorZoom = updateSkinEditorZoom; } catch(e) {}
try { if (typeof updateSkinHistoryButtons !== "undefined") window.updateSkinHistoryButtons = updateSkinHistoryButtons; } catch(e) {}
try { if (typeof updateSkinNameCharCount !== "undefined") window.updateSkinNameCharCount = updateSkinNameCharCount; } catch(e) {}
try { if (typeof updateSkinUploadPriceDisplay !== "undefined") window.updateSkinUploadPriceDisplay = updateSkinUploadPriceDisplay; } catch(e) {}
try { if (typeof updateTutorialUI !== "undefined") window.updateTutorialUI = updateTutorialUI; } catch(e) {}
try { if (typeof updateUI !== "undefined") window.updateUI = updateUI; } catch(e) {}
try { if (typeof updateUiVolume !== "undefined") window.updateUiVolume = updateUiVolume; } catch(e) {}
try { if (typeof updateVersionLabels !== "undefined") window.updateVersionLabels = updateVersionLabels; } catch(e) {}
try { if (typeof updateWhatsNewStartupToggle !== "undefined") window.updateWhatsNewStartupToggle = updateWhatsNewStartupToggle; } catch(e) {}
try { if (typeof whatsNewModalBackdrop !== "undefined") window.whatsNewModalBackdrop = whatsNewModalBackdrop; } catch(e) {}
try { if (typeof zoomInSkinEditor !== "undefined") window.zoomInSkinEditor = zoomInSkinEditor; } catch(e) {}
try { if (typeof zoomOutSkinEditor !== "undefined") window.zoomOutSkinEditor = zoomOutSkinEditor; } catch(e) {}
try { if (typeof zoomResetSkinEditor !== "undefined") window.zoomResetSkinEditor = zoomResetSkinEditor; } catch(e) {}
try { if (typeof masterVolume !== "undefined") window.masterVolume = masterVolume; } catch(e) {}
try { if (typeof sfxVolume !== "undefined") window.sfxVolume = sfxVolume; } catch(e) {}
try { if (typeof uiVolume !== "undefined") window.uiVolume = uiVolume; } catch(e) {}
try { if (typeof isAudioMuted !== "undefined") window.isAudioMuted = isAudioMuted; } catch(e) {}
try { if (typeof footstepsEnabled !== "undefined") window.footstepsEnabled = footstepsEnabled; } catch(e) {}
try { if (typeof openTutorialModal !== "undefined") window.openTutorialModal = openTutorialModal; } catch(e) {}
try { if (typeof closeTutorialModal !== "undefined") window.closeTutorialModal = closeTutorialModal; } catch(e) {}
try { if (typeof nextTutorialStep !== "undefined") window.nextTutorialStep = nextTutorialStep; } catch(e) {}
try { if (typeof prevTutorialStep !== "undefined") window.prevTutorialStep = prevTutorialStep; } catch(e) {}
try { if (typeof goToTutorialStep !== "undefined") window.goToTutorialStep = goToTutorialStep; } catch(e) {}
try { if (typeof renderTutorialStep !== "undefined") window.renderTutorialStep = renderTutorialStep; } catch(e) {}
try { if (typeof drawTutorialWorldScene !== "undefined") window.drawTutorialWorldScene = drawTutorialWorldScene; } catch(e) {}
try { if (typeof drawTutorialCraftingScene !== "undefined") window.drawTutorialCraftingScene = drawTutorialCraftingScene; } catch(e) {}
try { if (typeof drawTutorialMobsScene !== "undefined") window.drawTutorialMobsScene = drawTutorialMobsScene; } catch(e) {}
try { if (typeof drawTutorialArmorScene !== "undefined") window.drawTutorialArmorScene = drawTutorialArmorScene; } catch(e) {}
try { if (typeof drawTutorialMultiplayerScene !== "undefined") window.drawTutorialMultiplayerScene = drawTutorialMultiplayerScene; } catch(e) {}
try { if (typeof getTutorialTextureSrc !== "undefined") window.getTutorialTextureSrc = getTutorialTextureSrc; } catch(e) {}
try { if (typeof renderItemFrameHtml !== "undefined") window.renderItemFrameHtml = renderItemFrameHtml; } catch(e) {}
try { if (typeof isTutorialOnboardingMode !== "undefined") window.isTutorialOnboardingMode = isTutorialOnboardingMode; } catch(e) {}
try { if (typeof tutorialOnboardingCallback !== "undefined") window.tutorialOnboardingCallback = tutorialOnboardingCallback; } catch(e) {}
try { if (typeof currentUserProfile !== "undefined") window.currentUserProfile = currentUserProfile; } catch(e) {}
try { if (typeof currentAuthTab !== "undefined") window.currentAuthTab = currentAuthTab; } catch(e) {}
try { if (typeof loadUserProfile !== "undefined") window.loadUserProfile = loadUserProfile; } catch(e) {}
try { if (typeof checkProfileOnStartup !== "undefined") window.checkProfileOnStartup = checkProfileOnStartup; } catch(e) {}
try { if (typeof updateMainMenuProfileBadge !== "undefined") window.updateMainMenuProfileBadge = updateMainMenuProfileBadge; } catch(e) {}
try { if (typeof openAuthProfileModal !== "undefined") window.openAuthProfileModal = openAuthProfileModal; } catch(e) {}
try { if (typeof closeAuthProfileModal !== "undefined") window.closeAuthProfileModal = closeAuthProfileModal; } catch(e) {}
try { if (typeof switchAuthTab !== "undefined") window.switchAuthTab = switchAuthTab; } catch(e) {}
try { if (typeof updateAuthAvatarPreview !== "undefined") window.updateAuthAvatarPreview = updateAuthAvatarPreview; } catch(e) {}
try { if (typeof toggleAuthPasswordVisibility !== "undefined") window.toggleAuthPasswordVisibility = toggleAuthPasswordVisibility; } catch(e) {}
try { if (typeof handleAuthSubmit !== "undefined") window.handleAuthSubmit = handleAuthSubmit; } catch(e) {}
try { if (typeof handleAuthSkipToGuest !== "undefined") window.handleAuthSkipToGuest = handleAuthSkipToGuest; } catch(e) {}
try { if (typeof handleAuthRecommend !== "undefined") window.handleAuthRecommend = handleAuthRecommend; } catch(e) {}
try { if (typeof openProfileDetailsModal !== "undefined") window.openProfileDetailsModal = openProfileDetailsModal; } catch(e) {}
try { if (typeof closeProfileDetailsModal !== "undefined") window.closeProfileDetailsModal = closeProfileDetailsModal; } catch(e) {}
try { if (typeof handleProfileSignOut !== "undefined") window.handleProfileSignOut = handleProfileSignOut; } catch(e) {}
try { if (typeof promptGuestOnAuthClose !== "undefined") window.promptGuestOnAuthClose = promptGuestOnAuthClose; } catch(e) {}
try { if (typeof confirmContinueAsGuest !== "undefined") window.confirmContinueAsGuest = confirmContinueAsGuest; } catch(e) {}
try { if (typeof cancelGuestPrompt !== "undefined") window.cancelGuestPrompt = cancelGuestPrompt; } catch(e) {}
try { if (typeof handleUnderConstruction !== "undefined") window.handleUnderConstruction = handleUnderConstruction; } catch(e) {}
