import {
    IDS, ID_NAMES, TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT, currentWorldSize,
    Player, Zombie, Pig, Chicken, Sheep, Creeper, Scorpion, Cow, Pigeon, Parrot, AtlasExplorer,
    generateWorld, getInitialSpawnPoint, drawCharacter, drawPlayerPreview,
    startPlayerPreviewWalk, ensureDesertScorpions, ensureTreeWoodNonCollidable, sanitizeTreeWoodCollision,
    setEngineNonCollidableTreeWood,
    textures, getPlayerCaveSkyOpacity, getWorldSurfaceY, getActiveBiomeAt, isNonSurfaceBlock,
    setEngineWorld, setEngineBgWorld, setEnginePlayer, setEngineSurfaceHeights,
    setEngineInventory, setEngineEquippedArmor, setEngineEntities, setEngineFluids,
    setEngineFurnaces, setEngineJukeboxes, setEngineChests, setEngineDroppedItems, setEngineState,
    setEngineTimeOfDay, setEngineDayCount, setEngineFrameCount, setEngineCurrentWorldId,
    setEngineCurrentDifficulty, setEngineIsMultiplayer, setEngineCurrentMpRoom,
    setEngineCropGrowthQueue, setEngineSaplingGrowthQueue, setEngineDirtToGrassQueue, setEngineSnowRegrowthQueue,
    setEngineCurrentMpWorldName, setEngineRemotePlayers, setEngineIsSleeping,
    setEngineIsBackgroundBuildMode, setMinimapShape, setEngineIsInventoryOpen, setSelectedHotbarIndex as setEngineSelectedHotbarIndex,
    setEngineAccentColor, drawTimeClock, drawPlayerHead,
    buildFullOffscreenMap, renderWorldMapLoop,
    setIsWorldMapOpen, setMapPan, setMapZoom,
    generateMenuWorld, menuWorldInitialized, drawMenuBackground, dismissBootLoadingScreen,
    setWorldDimensions, getMaxAnimals,
    getTotalArmorDefense, getArmorDamageReductionRatio, isArmor, getArmorSlotIndex, ensureArmorDurability,
    TOOL_DURABILITY, ARMOR_DURABILITY, FPS_CAP_OPTIONS, diffDescriptions, DIFFICULTIES,
    LATEST_PATCH_NOTES, UPDATE_HISTORY_LOGS, getFpsCapText, signs, setEngineSigns,
    worldBiomes, setEngineWorldBiomes, setEngineFpsCap, fabulousConfig,
    DEFAULT_FABULOUS_CONFIG, FABULOUS_PRESETS, applyFabulousPreset, setFabulousConfig
} from './engine.js';

import {
    registerWebcraftAccount, loginWebcraftAccount, loginAsGuest, logoutWebcraftAccount,
    saveUserProfileToCloud, getUserProfileFromCloud,
    addFriendByTag, sendFriendRequestByTag, fetchIncomingFriendRequests,
    acceptFriendRequestByTag, declineFriendRequestByTag,
    removeFriendByTag, fetchFriendsProfiles, validateWebcraftTag, normalizeWebcraftTag,
    startPresenceHeartbeat, stopPresenceHeartbeat,
    syncSign, syncSignDelete,
    saveProfileCustomizationToCloud, listenToFriendsProfiles
} from './network.js';
import {
    COSMETIC_CATEGORIES, COSMETICS_CATALOG, getCosmeticItem, getCosmeticsByCategory,
    getDefaultCustomization, isCosmeticUnlocked
} from './cosmeticscatalog.js';
import * as Gamepad from './gamepad.js';
import { jukebox, getAudioTrack, saveAudioTrack, deleteAudioTrack } from './jukebox.js';
import { RiftExplorerSpawner } from './riftexplorerspawner.js';
import {
    getPixelIconSvg,
    getPixelEmeraldSvg as getPixelEmeraldSvgDef,
    getPixelAstralEmeraldSvg as getPixelAstralEmeraldSvgDef,
    getPixelPadlockSvg as getPixelPadlockSvgDef,
    getPixelWarningSvg as getPixelWarningSvgDef,
    getPixelSearchSvg as getPixelSearchSvgDef,
    getPixelCheckSvg as getPixelCheckSvgDef,
    getPixelPinSvg as getPixelPinSvgDef,
    getPixelResetSvg as getPixelResetSvgDef,
    getPixelTrophySvg as getPixelTrophySvgDef,
    getPixelCloseSvg as getPixelCloseSvgDef,
    getPixelSproutSvg as getPixelSproutSvgDef,
    getPixelIngotSvg as getPixelIngotSvgDef,
    getPixelDiamondSvg as getPixelDiamondSvgDef,
    getPixelCrownSvg as getPixelCrownSvgDef
} from './icons/pixelicons.js';
import {
    updateToggleBtnState,
    updatePresetTabsState,
    renderStandardOptionRow,
    renderStandardToggleRow,
    renderStandardButton,
    renderStandardModal
} from './ui/standardcomponents.js';
import { generateProceduralThumbnail, captureWorldThumbnail } from './ui/worldthumbnails.js';

export const INVENTORY_SIZE = 28;
export const SKIN_W = 16;
export const SKIN_H = 32;
export let playerSkinData = new Array(SKIN_W * SKIN_H).fill(null);
export let currentUserProfile = null;
export function setCurrentUserProfile(profile) { currentUserProfile = profile; }
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
export { currentWorldSize };
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
export let jukeboxes = [];
export let openedFurnace = null;
export let chests = new Map();
export let openedChest = null;
export let isInventoryOpen = false;
export let hotbarWheelLockUntil = 0;
export let heldItemIndex = -1;
export let heldItemObj = null;
export let heldItemDraggedOutside = false;

export function setOpenedFurnace(f) {
    openedFurnace = f;
    if (typeof window !== 'undefined') window.openedFurnace = f;
}
try { if (typeof window !== 'undefined') window.setOpenedFurnace = setOpenedFurnace; } catch(e) {}

export function setOpenedChest(c) {
    openedChest = c;
    if (typeof window !== 'undefined') window.openedChest = c;
}
try { if (typeof window !== 'undefined') window.setOpenedChest = setOpenedChest; } catch(e) {}

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
export let cropGrowthQueue = new Map();
export let dirtToGrassQueue = new Map();
export let snowRegrowthQueue = new Map();
export let isBackgroundBuildMode = false;
export let keepInventory = false;
export let editingSkinId = null;
export let fpsCap = typeof localStorage !== 'undefined' ? parseInt(localStorage.getItem('swc_fps_cap') || '60', 10) : 60;
export const AUTOSAVE_INTERVALS = [
    { seconds: 30, ms: 30000, label: '30 Seconds' },
    { seconds: 60, ms: 60000, label: '1 Minute' },
    { seconds: 300, ms: 300000, label: '5 Minutes' },
    { seconds: 600, ms: 600000, label: '10 Minutes' }
];
export let autosaveInterval = 60; // in seconds, default 1 minute
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

    export const GAME_VERSION = '0.1.6';
    export const DISPLAY_VERSION = '0.1.6';
    export const GAME_BUILD = 'webcraft2d-beta-0.1.6';

    export function updateVersionLabels() {
        if (typeof document === 'undefined') return;
        const versionLabel = document.getElementById('game-version-label');
        if (versionLabel) versionLabel.innerHTML = `<a href="https://github.com/raresh06/webcraft2d-game" target="_blank" rel="noopener noreferrer" class="game-github-link text-white hover:text-amber-300 transition-colors" title="Visit Webcraft2D on GitHub">Webcraft2D</a> Beta v${DISPLAY_VERSION}`;
    }

    updateVersionLabels();

    export const SPLASH_TEXTS = [
        // Classic & Smart Sandbox
        'Multiplayer!',
        'Now with extra pixels!',
        'Creepers hate this trick!',
        'Mine responsibly!',
        '100% blocky!',
        'Probably not a feature!',
        'Build something legendary!',
        'Diamonds await the bold!',
        'The night is full of surprises!',
        'Craft. Explore. Survive.',
        'No trees were harmed in the making!',
        'Powered by vanilla canvas!',
        'Never dig straight down... seriously!',
        'Climbing the ladder of success!',
        'A certified Webcraft classic!',
        'No wifi? Still crafting.',
        'Mining at 3 AM hits different!',
        'Peak 2D voxel sandbox!',
        'Built with coffee and code!',
        'Water buckets: the ultimate life insurance!',
        'Punching trees builds true character!',
        'Torches keep the nightmares away!',
        'Always carry spare wooden pickaxes!',
        'The cake restores six hunger points!',
        'The floor is literally lava at layer 55!',
        'Press F3 for existential coordinates!',
        'Quantum tunneling through 1-block steps!',
        'Gravity: optional for trees, mandatory for sand!',
        'Stacking blocks since the dawn of the browser!',
        'Cartography: turning darkness into knowledge!',
        'An ocean of stars above, stone below!',
        'Listen closely to the cavern ambiance...',
        'Crafting your destiny, one pixel at a time!',
        '2D world, infinite imagination!',
        'Ancient secrets buried deep underground!',
        'The stars align for the intrepid traveler!',
        'A masterpiece of retro block charm!',
        'Never leave home without a crafting table!',
        'One small step for Steve, one giant leap for block-kind!',
        'Legendary expeditions begin with a wooden sword!',
        'Redstone logic is Turing complete!',
        'Keep your swords sharp and your torches bright!',
        'Beware of low-hanging cavern stalactites!',
        'Look both ways before crossing a ravine!',
        'Pigs fly only when launched by pistons!',
        'Furnaces running at maximum thermal efficiency!',
        'Sun rises in the east... check your compass!',
        'Sleep tight, do not let the zombies bite!',
        'Emeralds: the universal currency of the realm!',
        '0% assembly, 100% pure canvas rendering!',
        'Written entirely with semicolons!',
        'Git commit -m "placed more torches"!',
        'Stack overflow in the double chest!',
        'Cache hit: found coal right near the surface!',
        'Schrödinger\'s Creeper is both behind you and not!',
        'Newton discovered gravity by dropping sand!',
        'Do androids dream of electric creepers?',
        'There is no spoon, only an iron shovel!',
        'It\'s dangerous to go alone, take this pickaxe!',
        'All your base are belong to us!',
        'May the force of gravity be with you!',
        'A wizard is never late, he respawns on time!',
        'Fly, you fools... unless you have feather boots!',
        'One does not simply walk into the Nether!',
        'To infinity and bedrock!',
        'Houston, we have placed a torch!',
        'Winter is coming: craft some leather armor!',
        'I see friendly sheep!',
        'I am the one who knocks... on wooden doors!',
        'Say my name: Planar Cartographer!',
        'Elementary, my dear Explorer!',
        'E = mc-squared: Energy equals Mining times Crafting!',
        // Clever Rock, Alternative & Musical Culture Nods
        'It starts with one block...',
        'Crawling in the deep caverns!',
        'In the end, every diamond matters!',
        'One step closer to bedrock!',
        'Waiting for the sunrise that never comes!',
        'Breaking the habit of digging straight down!',
        'Somewhere I belong... in a stone fortress!',
        'What I\'ve done with cobblestone!',
        'From the inside of the dungeon!',
        'Faint footsteps in the dark...',
        'Bleed it out on a desert cactus!',
        'Never given up on finding diamonds!',
        'Burn it down with flint and steel!',
        'Heavy is the crown of golden helmets!',
        'Papercut from an enchanted book!',
        'Points of authority in the village!',
        'Lost in the echo of the caves!',
        'Numb to the creeper explosions!',
        'A place for my head... on a red bed!',
        'Castle of glass and obsidian!',
        'Another one bites the dust block!',
        'Under pressure at the world boundary!',
        'Bohemian rhapsody in 2D!',
        'Don\'t stop me now, I\'m mining!',
        'Highway to the deepest cavern!',
        'Back in black obsidian armor!',
        'Thunderstruck by a mountain storm!',
        'For those about to craft, we salute you!',
        'Smells like teen spirit and gunpowder!',
        'Come as you are, bring your pickaxe!',
        'Master of puppets and skeleton archers!',
        'Enter Sandman: sleep through the night!',
        'Fade to black when daylight fades!',
        'Nothing else matters except surviving!',
        'Comfortably numb in a warm water spring!',
        'Wish you were here exploring dungeons!',
        'Another brick in the castle wall!',
        'Time is ticking on the celestial clock!',
        'Clint Eastwood with an infinity bow!',
        'Feel Good Inc. in the canopy treehouse!',
        'Harder, better, faster, stronger pickaxes!',
        'Around the world in 256 chunks!',
        'Seven nation army couldn\'t siege this fortress!',
        'Sweet child o\' mine in a fortified bunker!',
        'Welcome to the jungle biome!',
        'Paint it black like raw coal ore!',
        'Don\'t stop believin\' in cave diamonds!',
        'Stairway to heaven built out of cobblestone!',
        'Kashmir desert temple expeditions!',
        'Whole lotta love for underground loot!',
        'Knockin\' on heaven\'s oak door!',
        'Iron Man armor fully forged!',
        'Paranoid about cavern ambient noises!',
        'War pigs grazing peacefully on the hill!',
        'Dream on until the sun rises!',
        'Livin\' on a prayer with half a heart!',
        'You give love a bad name, Creeper!',
        'Crazy train riding down the mineshaft track!',
        'Bark at the full moon!',
        'Symphony of destruction with ten TNT blocks!',
        'Holy wars and the quest for emeralds!',
        'Roxanne, don\'t put on the redstone light!',
        'Every breath you take, the Gloomstalker watches!',
        'Message in a glass bottle!',
        'Fortunate son with a diamond shovel!'
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

        // Dynamic font-size scaling: keep text bold, readable, and properly proportioned around the corner
        if (nextSplash.length > 40) {
            splash.style.fontSize = '23px';
        } else if (nextSplash.length > 25) {
            splash.style.fontSize = '26px';
        } else {
            splash.style.fontSize = '29px';
        }
    }

    setRandomSplashText();

    export function showToast(msg, iconOrDuration = null, maybeDuration = 3000) {
        const c = document.getElementById('toast-container');
        if (!c) return;

        let iconHtml = null;
        let duration = 3000;

        if (typeof iconOrDuration === 'number') {
            duration = iconOrDuration;
        } else if (typeof iconOrDuration === 'string') {
            if (/^\d+$/.test(iconOrDuration.trim())) {
                duration = parseInt(iconOrDuration.trim(), 10);
            } else {
                iconHtml = iconOrDuration;
                if (typeof maybeDuration === 'number') {
                    duration = maybeDuration;
                }
            }
        }

        const t = document.createElement('div');
        t.className = 'toast flex items-center gap-2.5';
        if (iconHtml) {
            t.innerHTML = `${iconHtml}<span>${msg}</span>`;
        } else {
            t.innerText = msg;
        }
        c.appendChild(t);
        setTimeout(() => { if(t.parentElement) t.remove(); }, duration);
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
        debug: 'f3',
        astral: 'c',
        bg_build: 'b',
        devconsole: 'f7',
        achievements: 'l',
        slot1: '1',
        slot2: '2',
        slot3: '3',
        slot4: '4',
        slot5: '5',
        slot6: '6',
        slot7: '7',
        slot8: '8',
        slot9: '9'
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
            glow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.55)`,
            rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`
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
            root.style.setProperty('--mc-accent-rgb', palette.rgb);
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
                if (s.autosaveInterval !== undefined) {
                    autosaveInterval = Number(s.autosaveInterval);
                } else {
                    const legacyAs = localStorage.getItem('swc_autosave_interval');
                    if (legacyAs) autosaveInterval = Number(legacyAs);
                }
                if (![30, 60, 300, 600].includes(autosaveInterval)) autosaveInterval = 60;
                if (typeof window !== 'undefined') window.autosaveInterval = autosaveInterval;
            } else {
                const savedAs = localStorage.getItem('swc_autosave_interval');
                if (savedAs && [30, 60, 300, 600].includes(Number(savedAs))) {
                    autosaveInterval = Number(savedAs);
                    if (typeof window !== 'undefined') window.autosaveInterval = autosaveInterval;
                }
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
            const savedDiff = localStorage.getItem('swc_difficulty');
            if (savedDiff && DIFFICULTIES[savedDiff]) {
                selectedDiffChoice = savedDiff;
                if (!currentWorldId) {
                    currentDifficulty = savedDiff;
                    if (typeof setEngineCurrentDifficulty === 'function') setEngineCurrentDifficulty(savedDiff);
                    if (typeof window !== 'undefined') window.currentDifficulty = savedDiff;
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
                accentName: currentAccentName,
                autosaveInterval: autosaveInterval
            }));
            localStorage.setItem('swc_autosave_interval', String(autosaveInterval));
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
        if (typeof window !== 'undefined' && window.GamepadManager && typeof window.GamepadManager.isGamepadActionActive === 'function') {
            if (window.GamepadManager.isGamepadActionActive(actionName)) return true;
        }
        const boundKey = (KEYBINDS[actionName] || '').toLowerCase();
        const activeKeys = (typeof window !== 'undefined' && window.keys) ? window.keys : keys;
        if (boundKey && activeKeys[boundKey]) return true;

        if (actionName === 'left') return !!(activeKeys['a'] || activeKeys['arrowleft'] || activeKeys['KeyA'] || activeKeys['ArrowLeft']);
        if (actionName === 'right') return !!(activeKeys['d'] || activeKeys['arrowright'] || activeKeys['KeyD'] || activeKeys['ArrowRight']);
        if (actionName === 'jump') return !!(activeKeys[' '] || activeKeys['w'] || activeKeys['arrowup'] || activeKeys['Space'] || activeKeys['KeyW'] || activeKeys['ArrowUp']);
        if (actionName === 'down') return !!(activeKeys['s'] || activeKeys['arrowdown'] || activeKeys['shift'] || activeKeys['KeyS'] || activeKeys['ArrowDown'] || activeKeys['ShiftLeft']);
        return false;
    }

    if (typeof window !== 'undefined') {
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', () => {
                loadSavedSettings();
                applyMinimapShape();
                applyAccentColor(currentAccentColor, currentAccentName);
                initMusicPlayerHUD();
                updateSettingsUI();
            });
        } else {
            loadSavedSettings();
            applyMinimapShape();
            applyAccentColor(currentAccentColor, currentAccentName);
            initMusicPlayerHUD();
            updateSettingsUI();
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

    // Classic Default Skin
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


    // --- Emerald & Astral Emerald Currency System ---
    export function getPixelEmeraldSvg(size = 14) {
        if (typeof textures !== 'undefined' && textures && textures[IDS?.EMERALD]?.src) {
            return `<img src="${textures[IDS.EMERALD].src}" class="pixelated inline-block object-contain" width="${size}" height="${size}" alt="Emerald" style="vertical-align: middle;" />`;
        }
        return getPixelEmeraldSvgDef(size);
    }

    export function getPixelAstralEmeraldSvg(size = 14) {
        if (typeof textures !== 'undefined' && textures && textures[IDS?.ASTRAL_EMERALD]?.src) {
            return `<img src="${textures[IDS.ASTRAL_EMERALD].src}" class="pixelated inline-block object-contain" width="${size}" height="${size}" alt="Astral Emerald" style="vertical-align: middle;" />`;
        }
        return getPixelAstralEmeraldSvgDef(size);
    }

    export function getMiniPixelEmeraldHtml(size = 12) {
        return `<svg class="inline-block align-middle pixelated" viewBox="0 0 10 10" width="${size}" height="${size}" style="image-rendering: pixelated; shape-rendering: crispEdges; vertical-align: -1px;"><rect x="3" y="0" width="4" height="1" fill="#047857"/><rect x="1" y="1" width="2" height="1" fill="#047857"/><rect x="7" y="1" width="2" height="1" fill="#047857"/><rect x="0" y="2" width="1" height="6" fill="#047857"/><rect x="9" y="2" width="1" height="6" fill="#047857"/><rect x="1" y="8" width="2" height="1" fill="#047857"/><rect x="7" y="8" width="2" height="1" fill="#047857"/><rect x="3" y="9" width="4" height="1" fill="#047857"/><rect x="3" y="1" width="4" height="1" fill="#6ee7b7"/><rect x="2" y="2" width="2" height="2" fill="#ffffff"/><rect x="4" y="2" width="4" height="2" fill="#34d399"/><rect x="1" y="3" width="8" height="4" fill="#10b981"/><rect x="2" y="7" width="6" height="1" fill="#059669"/><rect x="3" y="8" width="4" height="1" fill="#047857"/></svg>`;
    }

    export function getMiniPixelAstralStarHtml(size = 12) {
        return `<svg class="inline-block align-middle pixelated" viewBox="0 0 10 10" width="${size}" height="${size}" style="image-rendering: pixelated; shape-rendering: crispEdges; vertical-align: -1px;"><rect x="4" y="0" width="2" height="10" fill="#c084fc"/><rect x="0" y="4" width="10" height="2" fill="#c084fc"/><rect x="3" y="3" width="4" height="4" fill="#a855f7"/><rect x="4" y="4" width="2" height="2" fill="#ffffff"/><rect x="2" y="2" width="1" height="1" fill="#f3e8ff"/><rect x="7" y="2" width="1" height="1" fill="#f3e8ff"/><rect x="2" y="7" width="1" height="1" fill="#f3e8ff"/><rect x="7" y="7" width="1" height="1" fill="#f3e8ff"/></svg>`;
    }

    export function syncCurrencyTextureImages() {
        if (typeof textures === 'undefined' || !textures) return;
        const emeraldSrc = textures[IDS?.EMERALD]?.src || '';
        const astralSrc = textures[IDS?.ASTRAL_EMERALD]?.src || '';
        const oreSrc = textures[IDS?.EMERALD_ORE]?.src || '';
        const shardSrc = textures[IDS?.ASTRAL_SHARD]?.src || '';

        // Main Menu Top Corner Badge
        const mmEmerald = document.getElementById('main-menu-emerald-img');
        if (mmEmerald && emeraldSrc) mmEmerald.src = emeraldSrc;
        const mmAstral = document.getElementById('main-menu-astral-img');
        if (mmAstral && astralSrc) mmAstral.src = astralSrc;

        // In-game Pause Menu Badge
        const pauseEmerald = document.getElementById('pause-emerald-img');
        if (pauseEmerald && emeraldSrc) pauseEmerald.src = emeraldSrc;
        const pauseAstral = document.getElementById('pause-astral-img');
        if (pauseAstral && astralSrc) pauseAstral.src = astralSrc;

        // Currency Hub / Vault Modal Header & Balances
        const vaultHeaderEmerald = document.getElementById('vault-header-emerald-img');
        if (vaultHeaderEmerald && emeraldSrc) vaultHeaderEmerald.src = emeraldSrc;
        const vaultEmerald = document.getElementById('vault-emerald-img');
        if (vaultEmerald && emeraldSrc) vaultEmerald.src = emeraldSrc;
        const vaultAstral = document.getElementById('vault-astral-img');
        if (vaultAstral && astralSrc) vaultAstral.src = astralSrc;

        // Mining Quota Standalone Card
        const vaultOre = document.getElementById('vault-ore-img');
        if (vaultOre && oreSrc) vaultOre.src = oreSrc;

        // Overview Guide Grid Cards
        const vaultOverviewOre = document.getElementById('vault-overview-ore-img');
        if (vaultOverviewOre && oreSrc) vaultOverviewOre.src = oreSrc;
        const vaultOverviewAstral = document.getElementById('vault-overview-astral-img');
        if (vaultOverviewAstral && astralSrc) vaultOverviewAstral.src = astralSrc;

        // Atlas Market
        const marketGem = document.getElementById('atlas-market-gem-img');
        if (marketGem && astralSrc) marketGem.src = astralSrc;
        const headerGem = document.getElementById('atlas-header-gem-img');
        if (headerGem && astralSrc) headerGem.src = astralSrc;
        const bottomGem = document.getElementById('atlas-bottom-astral-img');
        if (bottomGem && astralSrc) bottomGem.src = astralSrc;

        // Astral Infuser
        const infuserHeaderGem = document.getElementById('infuser-header-gem-img');
        if (infuserHeaderGem && shardSrc) infuserHeaderGem.src = shardSrc;

        // Unified Astral Shop
        const shopHeaderGem = document.getElementById('shop-header-gem-img');
        if (shopHeaderGem && astralSrc) shopHeaderGem.src = astralSrc;
        const shopBottomEmerald = document.getElementById('shop-bottom-emerald-img');
        if (shopBottomEmerald && emeraldSrc) shopBottomEmerald.src = emeraldSrc;
        const shopBottomAstral = document.getElementById('shop-bottom-astral-img');
        if (shopBottomAstral && astralSrc) shopBottomAstral.src = astralSrc;
    }

    export function getPixelPadlockSvg(size = 12) {
        return getPixelPadlockSvgDef(size);
    }

    export function getPixelSearchSvg(size = 16) {
        return getPixelSearchSvgDef(size);
    }

    export function getPixelCheckSvg(size = 14) {
        return getPixelCheckSvgDef(size);
    }

    export function getPixelPinSvg(size = 14) {
        return getPixelPinSvgDef(size);
    }

    export function getPixelResetSvg(size = 14) {
        return getPixelResetSvgDef(size);
    }

    export function getPixelTrophySvg(size = 18) {
        return getPixelTrophySvgDef(size);
    }

    export function getPixelCloseSvg(size = 12) {
        return getPixelCloseSvgDef(size);
    }

    export function getPixelSproutSvg(size = 14) {
        return getPixelSproutSvgDef(size);
    }

    export function getPixelIngotSvg(size = 14) {
        return getPixelIngotSvgDef(size);
    }

    export function getPixelDiamondSvg(size = 14) {
        return getPixelDiamondSvgDef(size);
    }

    export function getPixelCrownSvg(size = 14) {
        return getPixelCrownSvgDef(size);
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
            if (currentUserProfile) {
                currentUserProfile.emeralds = safeVal;
                try { localStorage.setItem('webcraft_user_profile', JSON.stringify(currentUserProfile)); } catch(e){}
            }
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

    export function getPlayerAstralEmeralds() {
        try {
            const val = parseInt(localStorage.getItem('swc_astral_emeralds_v1'), 10);
            return isNaN(val) || val < 0 ? 0 : val;
        } catch (e) {
            return 0;
        }
    }

    export function setPlayerAstralEmeralds(val) {
        try {
            const safeVal = Math.max(0, Math.floor(val));
            localStorage.setItem('swc_astral_emeralds_v1', safeVal.toString());
            if (currentUserProfile) {
                currentUserProfile.astralEmeralds = safeVal;
                try { localStorage.setItem('webcraft_user_profile', JSON.stringify(currentUserProfile)); } catch(e){}
            }
            updateEmeraldsUI();
            return safeVal;
        } catch (e) {
            return 0;
        }
    }

    export function addPlayerAstralEmeralds(amt) {
        const current = getPlayerAstralEmeralds();
        return setPlayerAstralEmeralds(current + amt);
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
        const astralEmeralds = getPlayerAstralEmeralds();

        // Main Menu
        const mmEl = document.getElementById('main-menu-emeralds-count');
        if (mmEl) {
            mmEl.innerText = emeralds.toLocaleString();
            mmEl.classList.remove('emerald-count-pulse');
            void mmEl.offsetWidth;
            mmEl.classList.add('emerald-count-pulse');
        }
        const mmAstralEl = document.getElementById('main-menu-astral-count');
        if (mmAstralEl) {
            mmAstralEl.innerText = astralEmeralds.toLocaleString();
        }

        // In-game Pause Menu Badge
        const pauseEmeraldEl = document.getElementById('pause-emeralds-count');
        if (pauseEmeraldEl) pauseEmeraldEl.innerText = emeralds.toLocaleString();
        const pauseAstralEl = document.getElementById('pause-astral-count');
        if (pauseAstralEl) pauseAstralEl.innerText = astralEmeralds.toLocaleString();

        // Skins Shop
        const skinsEl = document.getElementById('skins-emeralds-count');
        if (skinsEl) {
            skinsEl.innerText = emeralds.toLocaleString();
            skinsEl.classList.remove('emerald-count-pulse');
            void skinsEl.offsetWidth;
            skinsEl.classList.add('emerald-count-pulse');
        }

        // Vault Modal
        const vaultStdEl = document.getElementById('vault-standard-count');
        if (vaultStdEl) vaultStdEl.innerText = emeralds.toLocaleString();
        const vaultAstralEl = document.getElementById('vault-astral-count');
        if (vaultAstralEl) vaultAstralEl.innerText = astralEmeralds.toLocaleString();

        const exchangeAvailEl = document.getElementById('vault-exchange-avail-emeralds');
        if (exchangeAvailEl) exchangeAvailEl.innerText = emeralds.toLocaleString();

        // Atlas Market
        const marketAstralEl = document.getElementById('atlas-market-astral-count');
        if (marketAstralEl) marketAstralEl.innerText = astralEmeralds.toLocaleString();
        const bottomAstralEl = document.getElementById('atlas-bottom-astral-count');
        if (bottomAstralEl) bottomAstralEl.innerText = astralEmeralds.toLocaleString();

        // Sync texture images
        syncCurrencyTextureImages();

        // Dynamically update Astral Exchange tier affordability
        if (typeof renderAstralExchangeUI === 'function') {
            renderAstralExchangeUI();
        }
    }

    // --- Mining Tracker ---
    export function getDailyMinedEmeralds() {
        try {
            const todayUtc = new Date().toISOString().slice(0, 10);
            const raw = localStorage.getItem('swc_daily_mined_v1');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.date === todayUtc) {
                    return typeof parsed.count === 'number' ? parsed.count : 0;
                }
            }
            return 0;
        } catch (e) {
            return 0;
        }
    }

    export function recordDailyMinedEmerald() {
        const todayUtc = new Date().toISOString().slice(0, 10);
        const current = getDailyMinedEmeralds();
        const next = current + 1;
        try {
            localStorage.setItem('swc_daily_mined_v1', JSON.stringify({ date: todayUtc, count: next }));
            if (currentUserProfile) {
                currentUserProfile.dailyMined = { date: todayUtc, count: next };
                try { localStorage.setItem('webcraft_user_profile', JSON.stringify(currentUserProfile)); } catch(e){}
            }
        } catch (e) {}
        renderMiningTrackerUI();
        return next;
    }

    export const MAX_DAILY_EMERALD_MINES = 40;

    export function renderMiningTrackerUI() {
        const count = getDailyMinedEmeralds();
        const fill = document.getElementById('vault-mining-progress-fill');
        const label = document.getElementById('vault-mining-count-label');
        if (fill) fill.style.width = Math.min(100, (count / MAX_DAILY_EMERALD_MINES) * 100) + '%';
        if (label) label.innerText = `${count} / ${MAX_DAILY_EMERALD_MINES} Today`;

        const guestNotice = document.getElementById('vault-guest-notice');
        if (guestNotice) {
            const isGuest = !currentUserProfile || currentUserProfile.isGuest;
            if (isGuest) guestNotice.classList.remove('hidden');
            else guestNotice.classList.add('hidden');
        }
    }

    // --- Daily Challenges System (Rotates every 24h UTC, <=150 Emerald cap) ---
    export const DAILY_QUEST_POOL = [
        { id: 'dq_mine_stone', title: 'Stone Mason', desc: 'Mine 25 Stone or Cobblestone blocks', target: 25, type: 'mine_block', blockIds: [IDS.STONE, IDS.COBBLESTONE], reward: 35 },
        { id: 'dq_mine_coal', title: 'Fuel Gatherer', desc: 'Mine 10 Coal Ore veins', target: 10, type: 'mine_block', blockIds: [IDS.COAL_ORE], reward: 35 },
        { id: 'dq_mine_iron', title: 'Iron Age', desc: 'Mine 8 Iron Ore blocks', target: 8, type: 'mine_block', blockIds: [IDS.IRON_ORE], reward: 40 },
        { id: 'dq_mine_emerald', title: 'Gem Prospector', desc: 'Mine 2 Emerald Ore veins in crags or caverns', target: 2, type: 'mine_block', blockIds: [IDS.EMERALD_ORE], reward: 50 },
        { id: 'dq_mine_diamond', title: 'Deep Brilliance', desc: 'Mine 1 Diamond Ore block in the depths', target: 1, type: 'mine_block', blockIds: [IDS.DIAMOND_ORE], reward: 50 },
        { id: 'dq_chop_wood', title: 'Lumberjack', desc: 'Harvest 20 Wood Logs from trees', target: 20, type: 'mine_block', blockIds: [IDS.WOOD, IDS.JUNGLE_WOOD], reward: 35 },
        { id: 'dq_craft_torches', title: 'Light in the Dark', desc: 'Craft 12 Torches to illuminate caves', target: 12, type: 'craft_item', itemIds: [IDS.TORCH], reward: 30 },
        { id: 'dq_craft_table', title: 'Carpentry Basics', desc: 'Craft a Crafting Table', target: 1, type: 'craft_item', itemIds: [IDS.CRAFTING_TABLE], reward: 30 },
        { id: 'dq_craft_chest', title: 'Safe Storage', desc: 'Craft 2 Wooden Chests', target: 2, type: 'craft_item', itemIds: [IDS.CHEST], reward: 35 },
        { id: 'dq_craft_bread', title: 'Master Baker', desc: 'Bake 5 loaves of Bread', target: 5, type: 'craft_item', itemIds: [IDS.BREAD], reward: 40 },
        { id: 'dq_craft_iron_pick', title: 'Heavy Duty', desc: 'Craft an Iron Pickaxe', target: 1, type: 'craft_item', itemIds: [IDS.IRON_PICKAXE], reward: 40 },
        { id: 'dq_smelt_iron', title: 'Foundry Worker', desc: 'Smelt 6 Iron Ingots in a furnace', target: 6, type: 'smelt_item', itemIds: [IDS.IRON_INGOT], reward: 40 },
        { id: 'dq_slay_monsters', title: 'Night Watchman', desc: 'Defeat 4 hostile monsters (Zombies or Creepers)', target: 4, type: 'slay_monster', mobTypes: ['Zombie', 'Creeper', 'Scorpion'], reward: 45 },
        { id: 'dq_slay_creeper', title: 'Explosive Encounter', desc: 'Defeat 1 Creeper before it detonates', target: 1, type: 'slay_monster', mobTypes: ['Creeper'], reward: 45 },
        { id: 'dq_slay_scorpion', title: 'Dune Purifier', desc: 'Defeat 2 Desert Scorpions', target: 2, type: 'slay_monster', mobTypes: ['Scorpion'], reward: 40 },
        { id: 'dq_shear_sheep', title: 'Warm Wool', desc: 'Shear 3 sheep for soft wool', target: 3, type: 'shear_sheep', reward: 35 },
        { id: 'dq_eat_food', title: 'Well Nourished', desc: 'Eat 4 food items to stay energized', target: 4, type: 'eat_food', reward: 30 },
        { id: 'dq_plant_saplings', title: 'Reforestation', desc: 'Plant 4 tree saplings on fertile dirt', target: 4, type: 'plant_sapling', reward: 35 },
        { id: 'dq_craft_bed', title: 'Sweet Dreams', desc: 'Craft a Bed using wool and planks', target: 1, type: 'craft_item', itemIds: [IDS.BED], reward: 35 },
        { id: 'dq_harvest_melons', title: 'Jungle Delicacy', desc: 'Harvest 6 Melon Slices or blocks', target: 6, type: 'mine_block', blockIds: [IDS.MELON, IDS.SUNBURST_MELON], reward: 35 }
    ];

    export function getDailyQuestsState() {
        const todayUtc = new Date().toISOString().slice(0, 10);
        try {
            const raw = localStorage.getItem('swc_daily_quests_v1');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.date === todayUtc && Array.isArray(parsed.quests)) {
                    return parsed;
                }
            }
        } catch (e) {}

        // Deterministically generate 4 daily quests from today's date string
        let seed = 0;
        for (let i = 0; i < todayUtc.length; i++) {
            seed = (seed * 31 + todayUtc.charCodeAt(i)) & 0xffffffff;
        }

        const seededRandom = () => {
            seed = (seed * 1664525 + 1013904223) & 0xffffffff;
            return ((seed >>> 0) % 10000) / 10000;
        };

        const poolCopy = [...DAILY_QUEST_POOL];
        for (let i = poolCopy.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom() * (i + 1));
            [poolCopy[i], poolCopy[j]] = [poolCopy[j], poolCopy[i]];
        }

        const selected = [];
        let totalReward = 0;
        for (const q of poolCopy) {
            if (selected.length < 4 && (totalReward + q.reward <= 155 || selected.length < 3)) {
                selected.push({
                    id: q.id,
                    title: q.title,
                    desc: q.desc,
                    target: q.target,
                    type: q.type,
                    blockIds: q.blockIds || null,
                    itemIds: q.itemIds || null,
                    mobTypes: q.mobTypes || null,
                    reward: q.reward,
                    progress: 0,
                    completed: false,
                    claimed: false
                });
                totalReward += q.reward;
            }
            if (selected.length >= 4) break;
        }

        const newState = { date: todayUtc, quests: selected };
        try {
            localStorage.setItem('swc_daily_quests_v1', JSON.stringify(newState));
        } catch (e) {}
        return newState;
    }

    export function saveDailyQuestsState(state) {
        try {
            localStorage.setItem('swc_daily_quests_v1', JSON.stringify(state));
        } catch (e) {}
    }

    export function trackDailyQuestProgress(type, data = {}) {
        const state = getDailyQuestsState();
        if (!state || !Array.isArray(state.quests)) return;

        let changed = false;
        state.quests.forEach(q => {
            if (q.completed) return;
            if (q.type !== type) return;

            let match = false;
            if (type === 'mine_block') {
                if (q.blockIds && q.blockIds.includes(data.blockId)) match = true;
            } else if (type === 'craft_item' || type === 'smelt_item') {
                if (q.itemIds && q.itemIds.includes(data.itemId)) match = true;
            } else if (type === 'slay_monster') {
                if (!q.mobTypes || q.mobTypes.includes(data.mobType)) match = true;
            } else if (type === 'shear_sheep' || type === 'eat_food' || type === 'plant_sapling') {
                match = true;
            }

            if (match) {
                const addQty = data.count || 1;
                q.progress = Math.min(q.target, q.progress + addQty);
                if (q.progress >= q.target && !q.completed) {
                    q.completed = true;
                    showQuestCompletionBanner(q);
                }
                changed = true;
            }
        });

        if (changed) {
            saveDailyQuestsState(state);
            renderDailyQuestsUI();
        }
    }

    export function showQuestCompletionBanner(quest) {
        let container = document.getElementById('achievement-toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'achievement-toast quest-complete-toast';

        const iconFrame = document.createElement('div');
        iconFrame.className = 'achievement-icon-frame quest-toast-icon-frame';
        const emeraldTextureSrc = (typeof textures !== 'undefined' && textures && textures[IDS?.EMERALD]?.src) || '';
        if (emeraldTextureSrc) {
            const img = document.createElement('img');
            img.src = emeraldTextureSrc;
            img.className = 'w-7 h-7 pixelated object-contain';
            iconFrame.appendChild(img);
        } else {
            iconFrame.innerHTML = '<span class="text-emerald-400 font-bold text-xl">✦</span>';
        }
        toast.appendChild(iconFrame);

        const content = document.createElement('div');
        content.className = 'flex flex-col min-w-0';

        const header = document.createElement('span');
        header.className = "text-base text-[#4ade80] font-bold font-['VT323'] tracking-wide leading-none uppercase";
        header.innerText = `Challenge Complete! (+${quest.reward} Emeralds)`;
        content.appendChild(header);

        const title = document.createElement('span');
        title.className = "text-2xl text-white font-bold font-['VT323'] text-shadow truncate leading-tight";
        title.innerText = quest.title;
        content.appendChild(title);

        toast.appendChild(content);
        container.appendChild(toast);

        if (typeof playSound === 'function') {
            playSound('quest_complete', { vol: 1.0 });
        }

        setTimeout(() => {
            toast.classList.add('dismissing');
            setTimeout(() => {
                if (toast.parentElement) toast.remove();
            }, 360);
        }, 4500);
    }

    export function claimDailyQuestReward(questId) {
        const isGuest = !currentUserProfile || currentUserProfile.isGuest;
        if (isGuest) {
            showToast("✦ Sign in with a Webcraft account to claim Daily Challenge rewards! ✦");
            return;
        }

        const state = getDailyQuestsState();
        const quest = state.quests.find(q => q.id === questId);
        if (!quest || !quest.completed || quest.claimed) return;

        quest.claimed = true;
        addPlayerEmeralds(quest.reward);
        saveDailyQuestsState(state);
        playSound('quest_complete');
        showToast(`✦ Claimed +${quest.reward} Emeralds for "${quest.title}"! ✦`);
        renderDailyQuestsUI();
        updateEmeraldsUI();

        // Check daily hustler achievement
        const allClaimed = state.quests.every(q => q.claimed);
        if (allClaimed) {
            unlockAchievement('daily_hustler');
            showToast("✦ Daily Hustler Unlocked! All daily quests finished! ✦");
        }
    }

    export function getQuestCategorySvg(quest) {
        if (!quest) return '';
        const type = quest.type;
        const qid = quest.id || '';

        // If quest has explicit blockIds or itemIds with a loaded in-game texture, use it!
        if (typeof textures !== 'undefined' && textures) {
            if (quest.blockIds && quest.blockIds.length > 0 && textures[quest.blockIds[0]]?.src) {
                return `<img src="${textures[quest.blockIds[0]].src}" class="pixelated w-8 h-8 object-contain" alt="" />`;
            }
            if (quest.itemIds && quest.itemIds.length > 0 && textures[quest.itemIds[0]]?.src) {
                return `<img src="${textures[quest.itemIds[0]].src}" class="pixelated w-8 h-8 object-contain" alt="" />`;
            }

            // Categorical fallbacks using authentic in-game textures
            if (type === 'mine_block') {
                if (qid.includes('wood') || qid.includes('chop')) {
                    if (textures[IDS?.DIAMOND_AXE]?.src) return `<img src="${textures[IDS.DIAMOND_AXE].src}" class="pixelated w-8 h-8 object-contain" alt="" />`;
                }
                if (textures[IDS?.DIAMOND_PICKAXE]?.src) return `<img src="${textures[IDS.DIAMOND_PICKAXE].src}" class="pixelated w-8 h-8 object-contain" alt="" />`;
            } else if (type === 'slay_monster') {
                if (textures[IDS?.DIAMOND_SWORD]?.src) return `<img src="${textures[IDS.DIAMOND_SWORD].src}" class="pixelated w-8 h-8 object-contain" alt="" />`;
            } else if (type === 'smelt_item') {
                if (textures[IDS?.FURNACE]?.src) return `<img src="${textures[IDS.FURNACE].src}" class="pixelated w-8 h-8 object-contain" alt="" />`;
            } else if (type === 'craft_item') {
                if (textures[IDS?.CRAFTING_TABLE]?.src) return `<img src="${textures[IDS.CRAFTING_TABLE].src}" class="pixelated w-8 h-8 object-contain" alt="" />`;
            } else if (type === 'eat_food') {
                if (textures[IDS?.APPLE]?.src) return `<img src="${textures[IDS.APPLE].src}" class="pixelated w-8 h-8 object-contain" alt="" />`;
            } else if (type === 'plant_sapling') {
                if (textures[IDS?.SAPLING]?.src) return `<img src="${textures[IDS.SAPLING].src}" class="pixelated w-8 h-8 object-contain" alt="" />`;
            } else if (type === 'shear_sheep') {
                if (textures[IDS?.KINETIC_SHEARS]?.src) return `<img src="${textures[IDS.KINETIC_SHEARS].src}" class="pixelated w-8 h-8 object-contain" alt="" />`;
                if (textures[IDS?.WOOL]?.src) return `<img src="${textures[IDS.WOOL].src}" class="pixelated w-8 h-8 object-contain" alt="" />`;
            }
            if (textures[IDS?.EMERALD]?.src) {
                return `<img src="${textures[IDS.EMERALD].src}" class="pixelated w-8 h-8 object-contain" alt="" />`;
            }
        }

        // Default: Golden Star / Scroll SVG if textures not yet ready
        return `<svg viewBox="0 0 16 16" width="26" height="26" style="image-rendering: pixelated; shape-rendering: crispEdges;">
            <rect x="3" y="2" width="10" height="12" fill="#fef3c7"/>
            <rect x="4" y="3" width="8" height="10" fill="#fde68a"/>
            <rect x="5" y="5" width="6" height="1" fill="#b45309"/>
            <rect x="5" y="7" width="6" height="1" fill="#b45309"/>
            <rect x="5" y="9" width="4" height="1" fill="#b45309"/>
        </svg>`;
    }

    export function renderDailyQuestsUI() {
        const container = document.getElementById('vault-quests-container');
        if (!container) return;

        const state = getDailyQuestsState();

        // Update available unclaimed quest badge on tab
        const unclaimedCount = state.quests.filter(q => q.completed && !q.claimed).length;
        const badge = document.getElementById('vault-quests-available-badge');
        if (badge) {
            if (unclaimedCount > 0) {
                badge.innerText = unclaimedCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }

        container.innerHTML = state.quests.map(q => {
            const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
            const isDone = q.completed;
            const isClaimed = q.claimed;
            const catSvg = getQuestCategorySvg(q);
            const emeraldTextureSrc = (typeof textures !== 'undefined' && textures && textures[IDS?.EMERALD]?.src) || '';

            let actionBtn = '';
            if (isClaimed) {
                actionBtn = `<span class="text-sm font-bold text-[#6fa386] font-['VT323'] bg-[#141d17] border border-[#1f402b] px-2.5 py-1">✓ CLAIMED</span>`;
            } else if (isDone) {
                actionBtn = `<button type="button" class="quest-claim-btn" onclick="claimDailyQuestReward('${q.id}')">${emeraldTextureSrc ? `<img src="${emeraldTextureSrc}" class="w-4 h-4 pixelated object-contain inline-block" alt="" />` : '✦'} CLAIM +${q.reward}</button>`;
            } else {
                actionBtn = `<span class="text-base font-bold text-[#4eed99] font-['VT323'] bg-[#101316] border border-[#2b3542] px-2.5 py-1 flex items-center gap-1.5">${emeraldTextureSrc ? `<img src="${emeraldTextureSrc}" class="w-4 h-4 pixelated object-contain inline-block" alt="" />` : ''} +${q.reward}</span>`;
            }

            return `
                <div class="achievement-card flex items-center justify-between p-2.5 bg-[#171b20] border-2 border-[#333a41] shadow-sm ${isClaimed ? 'opacity-70' : ''}">
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                        <div class="w-11 h-11 bg-[#101316] border-2 border-[#2b3542] flex items-center justify-center p-1 flex-shrink-0 shadow-inner">
                            ${catSvg}
                        </div>
                        <div class="flex-1 min-w-0 pr-2">
                            <div class="flex items-center gap-2">
                                <span class="text-lg sm:text-xl font-bold ${isDone ? 'text-[#4eed99]' : 'text-white'} font-['VT323'] leading-tight truncate">${q.title}</span>
                            </div>
                            <div class="text-sm text-[#95a5b5] font-['VT323'] leading-tight truncate">${q.desc}</div>
                            <div class="flex items-center gap-2 mt-1.5">
                                <div class="flex-1 bg-[#101316] h-3 border border-[#2b3542] relative overflow-hidden">
                                    <div class="bg-[#10b981] h-full transition-all duration-300" style="width: ${pct}%;"></div>
                                </div>
                                <span class="text-xs text-[#cfd8dc] font-['VT323'] whitespace-nowrap font-mono min-w-[50px] text-right">${q.progress} / ${q.target}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex-shrink-0">
                        ${actionBtn}
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- Astral Emerald Exchange Illustrations ---
    export function getTier1AstralIllustration() {
        return `<svg class="pixelated inline-block" viewBox="0 0 24 20" width="48" height="40" style="image-rendering: pixelated; shape-rendering: crispEdges;">
            <!-- Glow halo -->
            <rect x="10" y="2" width="4" height="1" fill="#7e22ce" opacity="0.6"/>
            <rect x="8" y="3" width="8" height="1" fill="#7e22ce" opacity="0.6"/>
            <rect x="6" y="4" width="12" height="12" fill="#581c87" opacity="0.3"/>
            <rect x="4" y="6" width="16" height="8" fill="#581c87" opacity="0.2"/>
            <!-- Astral Gem Body -->
            <rect x="11" y="3" width="2" height="1" fill="#e9d5ff"/>
            <rect x="10" y="4" width="4" height="1" fill="#d8b4fe"/>
            <rect x="9" y="5" width="6" height="2" fill="#c084fc"/>
            <rect x="8" y="7" width="8" height="6" fill="#9333ea"/>
            <rect x="9" y="13" width="6" height="2" fill="#7e22ce"/>
            <rect x="10" y="15" width="4" height="1" fill="#6b21a8"/>
            <rect x="11" y="16" width="2" height="1" fill="#4c1d95"/>
            <!-- Inner facets & specular shine -->
            <rect x="10" y="6" width="2" height="2" fill="#ffffff"/>
            <rect x="12" y="7" width="2" height="3" fill="#e9d5ff"/>
            <rect x="10" y="9" width="3" height="3" fill="#a855f7"/>
            <rect x="13" y="11" width="2" height="2" fill="#6b21a8"/>
            <rect x="9" y="11" width="2" height="2" fill="#581c87"/>
            <!-- Sparkle 1 -->
            <rect x="4" y="4" width="1" height="3" fill="#38bdf8"/>
            <rect x="3" y="5" width="3" height="1" fill="#38bdf8"/>
            <rect x="4" y="5" width="1" height="1" fill="#ffffff"/>
            <!-- Sparkle 2 -->
            <rect x="19" y="12" width="1" height="3" fill="#fbbf24"/>
            <rect x="18" y="13" width="3" height="1" fill="#fbbf24"/>
            <rect x="19" y="13" width="1" height="1" fill="#ffffff"/>
        </svg>`;
    }

    export function getTier2AstralIllustration() {
        return `<svg class="pixelated inline-block" viewBox="0 0 28 20" width="56" height="40" style="image-rendering: pixelated; shape-rendering: crispEdges;">
            <!-- Aura -->
            <rect x="4" y="3" width="20" height="14" fill="#581c87" opacity="0.3"/>
            <!-- Left Main Gem -->
            <rect x="8" y="2" width="2" height="1" fill="#e9d5ff"/>
            <rect x="7" y="3" width="4" height="2" fill="#c084fc"/>
            <rect x="6" y="5" width="6" height="7" fill="#9333ea"/>
            <rect x="7" y="12" width="4" height="2" fill="#6b21a8"/>
            <rect x="8" y="14" width="2" height="1" fill="#4c1d95"/>
            <rect x="7" y="5" width="2" height="2" fill="#ffffff"/>
            <rect x="8" y="7" width="2" height="3" fill="#d8b4fe"/>
            <!-- Right Smaller Twin Gem -->
            <rect x="17" y="5" width="2" height="1" fill="#e9d5ff"/>
            <rect x="16" y="6" width="4" height="2" fill="#c084fc"/>
            <rect x="15" y="8" width="6" height="6" fill="#9333ea"/>
            <rect x="16" y="14" width="4" height="2" fill="#6b21a8"/>
            <rect x="17" y="16" width="2" height="1" fill="#4c1d95"/>
            <rect x="16" y="8" width="2" height="2" fill="#ffffff"/>
            <rect x="17" y="10" width="2" height="2" fill="#d8b4fe"/>
            <!-- Resonance Energy Arc connecting crystals -->
            <rect x="12" y="7" width="3" height="1" fill="#38bdf8"/>
            <rect x="13" y="8" width="2" height="1" fill="#67e8f9"/>
            <rect x="11" y="9" width="4" height="1" fill="#a5f3fc"/>
            <rect x="12" y="10" width="3" height="1" fill="#38bdf8"/>
            <!-- Cosmic Sparks -->
            <rect x="2" y="8" width="1" height="2" fill="#fbbf24"/>
            <rect x="1" y="8" width="3" height="1" fill="#fbbf24"/>
            <rect x="24" y="4" width="1" height="3" fill="#38bdf8"/>
            <rect x="23" y="5" width="3" height="1" fill="#38bdf8"/>
            <rect x="24" y="5" width="1" height="1" fill="#ffffff"/>
            <rect x="14" y="15" width="1" height="2" fill="#e9d5ff"/>
        </svg>`;
    }

    export function getTier3AstralIllustration() {
        return `<svg class="pixelated inline-block" viewBox="0 0 30 20" width="60" height="40" style="image-rendering: pixelated; shape-rendering: crispEdges;">
            <!-- Outer Cosmic Ring -->
            <rect x="10" y="1" width="10" height="1" fill="#7e22ce"/>
            <rect x="6" y="2" width="18" height="1" fill="#9333ea"/>
            <rect x="4" y="3" width="22" height="2" fill="#a855f7"/>
            <rect x="3" y="5" width="24" height="10" fill="#6b21a8"/>
            <rect x="4" y="15" width="22" height="2" fill="#a855f7"/>
            <rect x="6" y="17" width="18" height="1" fill="#9333ea"/>
            <rect x="10" y="18" width="10" height="1" fill="#7e22ce"/>
            <!-- Swirling Event Horizon Disc -->
            <rect x="8" y="4" width="14" height="12" fill="#3b0764"/>
            <rect x="7" y="6" width="16" height="8" fill="#1e1035"/>
            <rect x="9" y="5" width="12" height="10" fill="#2e1065"/>
            <rect x="11" y="6" width="8" height="8" fill="#4c1d95"/>
            <!-- Planar Core Vortex -->
            <rect x="12" y="7" width="6" height="6" fill="#c084fc"/>
            <rect x="13" y="8" width="4" height="4" fill="#e9d5ff"/>
            <rect x="14" y="9" width="2" height="2" fill="#ffffff"/>
            <!-- Radial Dimensional Rift Flares -->
            <rect x="14" y="0" width="2" height="3" fill="#38bdf8"/>
            <rect x="14" y="17" width="2" height="3" fill="#38bdf8"/>
            <rect x="1" y="9" width="3" height="2" fill="#fbbf24"/>
            <rect x="26" y="9" width="3" height="2" fill="#fbbf24"/>
            <!-- Celestial Orbiting Debris -->
            <rect x="5" y="4" width="2" height="2" fill="#67e8f9"/>
            <rect x="23" y="4" width="2" height="2" fill="#f472b6"/>
            <rect x="5" y="14" width="2" height="2" fill="#fde047"/>
            <rect x="23" y="14" width="2" height="2" fill="#38bdf8"/>
        </svg>`;
    }

    // --- Astral Emerald Exchange ---
    export function renderAstralExchangeUI() {
        const container = document.getElementById('vault-exchange-cards-container');
        if (!container) return;

        const emeralds = getPlayerEmeralds();
        const isGuest = !currentUserProfile || currentUserProfile.isGuest;

        const availEl = document.getElementById('vault-exchange-avail-emeralds');
        if (availEl) availEl.innerText = emeralds.toLocaleString();

        const miniEmerald = getMiniPixelEmeraldHtml(12);
        const miniAstral = getMiniPixelAstralStarHtml(12);
        const starBadge = getMiniPixelAstralStarHtml(10);

        const tiers = [
            {
                cost: 20,
                gain: 1,
                title: 'Starter Exchange',
                subtitle: 'Standard 20:1 conversion rate',
                note: 'Standard Trade',
                illustration: getTier1AstralIllustration(),
                ribbon: null,
                ribbonClass: '',
                cardClass: 'tier-1'
            },
            {
                cost: 50,
                gain: 3,
                title: 'Bulk Exchange',
                subtitle: `16.7 ${miniEmerald} each • Save 10 Emeralds`,
                note: '16% Emerald Discount',
                illustration: getTier2AstralIllustration(),
                cardClass: 'tier-2'
            },
            {
                cost: 100,
                gain: 7,
                title: 'Mega Exchange',
                subtitle: `14.3 ${miniEmerald} each • Save 40 Emeralds!`,
                note: 'Best Value Deal',
                illustration: getTier3AstralIllustration(),
                cardClass: 'tier-3'
            }
        ];

        container.innerHTML = tiers.map(t => {
            const canAfford = !isGuest && emeralds >= t.cost;
            let btnHtml = '';
            if (isGuest) {
                btnHtml = `<button type="button" class="exchange-card-action-btn unaffordable" onclick="closeCurrencyHubModal(); openAuthProfileModal('credentials');">Sign In to Exchange</button>`;
            } else if (canAfford) {
                btnHtml = `<button type="button" class="exchange-card-action-btn affordable" onclick="performAstralExchange(${t.cost}, ${t.gain})">Exchange for +${t.gain} ${miniAstral}</button>`;
            } else {
                const diff = t.cost - emeralds;
                btnHtml = `<button type="button" class="exchange-card-action-btn unaffordable" disabled title="Need ${diff} more Emeralds">Need ${diff} more ${miniEmerald}</button>`;
            }

            return `
                <div class="exchange-card ${t.cardClass}">

                    <!-- Top: Card Header -->
                    <div class="exchange-card-header flex-shrink-0">
                        <div class="text-2xl font-bold text-purple-200 font-['VT323'] leading-tight mb-0.5">${t.title}</div>
                        <div class="text-xs text-purple-400 font-['VT323'] uppercase tracking-wider">${t.note}</div>
                    </div>

                    <!-- Center Body: Illustration + Centered Preview Box + Rate Subtitle -->
                    <div class="exchange-card-center-body">
                        <div class="exchange-card-illustration" title="${t.title}">
                            ${t.illustration}
                        </div>

                        <div class="exchange-preview-box">
                            <div class="flex items-center gap-1">
                                <span class="text-emerald-400 font-bold font-['VT323'] text-2xl leading-none">${t.cost}</span>
                                <span class="inline-flex items-center">${getPixelEmeraldSvg(16)}</span>
                            </div>
                            <span class="text-purple-400 font-bold text-sm px-1">➔</span>
                            <div class="flex items-center gap-1">
                                <span class="text-purple-300 font-bold font-['VT323'] text-2xl leading-none">+${t.gain}</span>
                                <span class="inline-flex items-center">${getPixelAstralEmeraldSvg(16)}</span>
                            </div>
                        </div>

                        <div class="text-xs text-purple-200/80 font-['VT323'] leading-tight text-center px-1">${t.subtitle}</div>
                    </div>

                    <!-- Bottom: Cleanly Placed Button Inside Card -->
                    <div class="exchange-card-btn-wrap">
                        ${btnHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    export function performAstralExchange(emeraldCost, astralGain) {
        const isGuest = !currentUserProfile || currentUserProfile.isGuest;
        if (isGuest) {
            showToast("Registered account required for Astral Emerald Exchange!");
            return;
        }
        const current = getPlayerEmeralds();
        if (current < emeraldCost) {
            showToast(`Not enough Emeralds! (${emeraldCost} needed, you have ${current})`);
            return;
        }
        addPlayerEmeralds(-emeraldCost);
        addPlayerAstralEmeralds(astralGain);
        playSound('astral_exchange');
        showToast(`Exchanged ${emeraldCost} Emeralds for +${astralGain} Astral Emerald${astralGain > 1 ? 's' : ''}!`);
        unlockAchievement('astral_pioneer');
        unlockAchievement('astral_exchange_master');
        updateEmeraldsUI();
        renderAstralExchangeUI();
    }

    // --- Live Daily UTC Reset Countdown Timer ---
    let vaultCountdownTimer = null;

    export function updateVaultResetCountdown() {
        const el = document.getElementById('vault-reset-countdown');
        if (!el) return;
        const now = new Date();
        const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
        const diffMs = Math.max(0, nextMidnight.getTime() - now.getTime());
        const totalSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
        const mins = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
        const secs = (totalSecs % 60).toString().padStart(2, '0');
        el.innerText = `${hours}:${mins}:${secs}`;
    }

    // --- Currency Hub Modal Navigation ---
    export function openCurrencyHubModal(tab = 'overview') {
        const modal = document.getElementById('emerald-vault-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        switchVaultTab(tab);
        updateEmeraldsUI();
        renderMiningTrackerUI();
        renderDailyQuestsUI();
        renderAstralExchangeUI();

        updateVaultResetCountdown();
        if (vaultCountdownTimer) clearInterval(vaultCountdownTimer);
        vaultCountdownTimer = setInterval(updateVaultResetCountdown, 1000);
    }

    export function closeCurrencyHubModal() {
        const modal = document.getElementById('emerald-vault-modal');
        if (modal) modal.classList.add('hidden');
        if (vaultCountdownTimer) {
            clearInterval(vaultCountdownTimer);
            vaultCountdownTimer = null;
        }
    }

    export function switchVaultTab(tab) {
        ['overview', 'quests', 'exchange'].forEach(t => {
            const btn = document.getElementById(`vault-tab-${t}-btn`);
            const pane = document.getElementById(`vault-tab-${t}`);
            if (btn) btn.classList.toggle('active', t === tab);
            if (pane) pane.classList.toggle('hidden', t !== tab);
        });
        if (tab === 'quests') renderDailyQuestsUI();
        if (tab === 'overview') renderMiningTrackerUI();
        if (tab === 'exchange') renderAstralExchangeUI();
    }

    export function openAchievementsFromVault() {
        closeCurrencyHubModal();
        if (typeof openAchievements === 'function') openAchievements('sp');
    }

    // --- Kael The Atlas Explorer Dialogue System ---
    let activeKaelEntity = null;
    let currentKaelNode = 'start';
    let hasTalkedToKael = false;

    export function hasPlayerTalkedToKael() {
        if (currentWorldId) {
            try {
                const val = localStorage.getItem('webcraft_kael_talked_' + currentWorldId);
                if (val !== null) return val === 'true';
            } catch (e) {}
        }
        return hasTalkedToKael;
    }

    export function setPlayerTalkedToKael(val = true) {
        hasTalkedToKael = !!val;
        if (currentWorldId) {
            try {
                localStorage.setItem('webcraft_kael_talked_' + currentWorldId, hasTalkedToKael ? 'true' : 'false');
            } catch (e) {}
        }
    }

    export const KAEL_DIALOGUES = {
        start: {
            speaker: "Kael:",
            subtitle: "Planar Cartographer & Rift Walker",
            text: "Greetings, traveler of the mortal surface. I am Kael, The Atlas Explorer.\n\nThe world fabric fractures where the stars bleed... Have you felt the cosmic ripples across this realm?",
            options: [
                { label: "Who are you and what are you doing here?", next: "who_are_you" },
                { label: "What are these planar rifts you speak of?", next: "lore_rifts" },
                { label: "What are Astral Emeralds and how do I get them?", next: "astral_emeralds" },
                { label: "Show me your wares. [Open Astral Market]", action: "open_market" },
                { label: "Farewell, traveler.", action: "close" }
            ]
        },
        who_are_you: {
            speaker: "Kael:",
            subtitle: "Planar Cartographer & Rift Walker",
            text: "I walk the corridors between dimensions, mapping forgotten realms and cosmic singularities.\n\nMy planar astrolabes require Astral Emeralds to pierce the void and chart the endless unknown.",
            options: [
                { label: "Tell me more about the rifts.", next: "lore_rifts" },
                { label: "How do I acquire Astral Emeralds?", next: "astral_emeralds" },
                { label: "Show me your wares. [Open Astral Market]", action: "open_market" },
                { label: "Farewell.", action: "close" }
            ]
        },
        lore_rifts: {
            speaker: "Kael:",
            subtitle: "Planar Cartographer & Rift Walker",
            text: "A rift is a fracture where dimensional planes collide. They open every few planetary cycles, anchoring near mortal campfires and shelters.\n\nWhen the tear collapses, I must step back through the void to other horizons.",
            options: [
                { label: "Who are you again?", next: "who_are_you" },
                { label: "What wares have you brought from beyond?", action: "open_market" },
                { label: "Safe travels through the rift.", action: "close" }
            ]
        },
        astral_emeralds: {
            speaker: "Kael:",
            subtitle: "Planar Cartographer & Rift Walker",
            text: "Astral Emeralds are pure crystallized cosmic energy. You can trade standard emeralds for astral gems at the Astral Emerald Exchange in your Currency Hub, or gather them from otherworldly encounters.\n\nI accept only Astral Emeralds for my catalog.",
            options: [
                { label: "Show me what you offer. [Open Astral Market]", action: "open_market" },
                { label: "I will gather more gems. Farewell.", action: "close" }
            ]
        }
    };

    export function drawKaelPortrait() {
        const canvas = document.getElementById('atlas-portrait-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, 64, 64);

        // 1. Subtle deep cosmic slate backdrop
        ctx.fillStyle = '#141829';
        ctx.fillRect(0, 0, 64, 64);

        // Backdrop planar stars / motes
        ctx.fillStyle = 'rgba(192, 132, 252, 0.4)';
        ctx.fillRect(6, 8, 2, 2);
        ctx.fillRect(54, 12, 2, 2);
        ctx.fillRect(8, 48, 2, 2);
        ctx.fillRect(56, 44, 2, 2);

        // 2. Leather adventurer coat collar & shoulders
        ctx.fillStyle = '#381c08'; // Deep shadowed leather
        ctx.fillRect(6, 46, 52, 18);
        ctx.fillStyle = '#5c2e0f'; // Warm tanned leather mantle
        ctx.fillRect(10, 48, 44, 16);
        ctx.fillStyle = '#7a3e15'; // Shoulder pads highlight
        ctx.fillRect(8, 52, 10, 12);
        ctx.fillRect(46, 52, 10, 12);

        // 3. Indigo traveler tunic & celestial scarf
        ctx.fillStyle = '#1e1b4b'; // Deep navy tunic
        ctx.fillRect(22, 48, 20, 16);
        ctx.fillStyle = '#312e81'; // Celestial scarf folds
        ctx.fillRect(20, 50, 24, 6);
        ctx.fillStyle = '#4338ca';
        ctx.fillRect(24, 52, 16, 4);
        // Golden compass / star pin on scarf
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(30, 51, 4, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(31, 52, 2, 2);

        // 4. Human neck
        ctx.fillStyle = '#c68b59'; // Neck shadow
        ctx.fillRect(26, 40, 12, 10);
        ctx.fillStyle = '#dba075'; // Neck base
        ctx.fillRect(28, 42, 8, 8);

        // 5. Human face / head shape (matching player proportions)
        ctx.fillStyle = '#c68b59'; // Chin / jawline outline
        ctx.fillRect(18, 18, 28, 26);
        ctx.fillStyle = '#e8b188'; // Human skin base tone
        ctx.fillRect(20, 18, 24, 24);
        ctx.fillStyle = '#f3c49e'; // Cheek and forehead highlight
        ctx.fillRect(22, 20, 20, 12);
        ctx.fillRect(24, 32, 16, 8);

        // Human ears
        ctx.fillStyle = '#dba075';
        ctx.fillRect(16, 26, 4, 8);
        ctx.fillRect(44, 26, 4, 8);
        ctx.fillStyle = '#fbbf24'; // Small brass ear stud on left
        ctx.fillRect(16, 31, 2, 2);

        // 6. Windswept dark chestnut hair
        ctx.fillStyle = '#26150a'; // Hair deep shadow
        ctx.fillRect(16, 12, 32, 12);
        ctx.fillRect(14, 18, 6, 14);
        ctx.fillRect(44, 18, 6, 14);
        ctx.fillStyle = '#4a2e1b'; // Hair main body
        ctx.fillRect(18, 10, 28, 10);
        ctx.fillRect(16, 14, 32, 6);
        // Swept bangs across forehead
        ctx.fillRect(20, 18, 12, 4);
        ctx.fillRect(22, 22, 6, 3);
        ctx.fillStyle = '#6e4428'; // Hair top highlight
        ctx.fillRect(22, 9, 20, 4);

        // 7. Brass explorer goggles pushed up on forehead
        ctx.fillStyle = '#381c08'; // Leather goggle strap
        ctx.fillRect(16, 16, 32, 3);
        // Left brass goggle
        ctx.fillStyle = '#d97706';
        ctx.fillRect(22, 13, 8, 8);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(23, 14, 6, 6);
        ctx.fillStyle = '#0284c7'; // Cyan lens
        ctx.fillRect(24, 15, 4, 4);
        ctx.fillStyle = '#ffffff'; // Glint
        ctx.fillRect(24, 15, 2, 2);
        // Right brass goggle
        ctx.fillStyle = '#d97706';
        ctx.fillRect(34, 13, 8, 8);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(35, 14, 6, 6);
        ctx.fillStyle = '#0284c7'; // Cyan lens
        ctx.fillRect(36, 15, 4, 4);
        ctx.fillStyle = '#ffffff'; // Glint
        ctx.fillRect(36, 15, 2, 2);

        // 8. Human facial features
        // Eyebrows
        ctx.fillStyle = '#362012';
        ctx.fillRect(23, 26, 6, 2);
        ctx.fillRect(35, 26, 6, 2);

        // Human Eyes (white sclera, dark pupil, celestial cyan/hazel iris)
        // Left eye
        ctx.fillStyle = '#ffffff'; // Sclera
        ctx.fillRect(23, 29, 6, 4);
        ctx.fillStyle = '#0284c7'; // Celestial cyan iris
        ctx.fillRect(25, 29, 3, 4);
        ctx.fillStyle = '#0f172a'; // Pupil
        ctx.fillRect(26, 30, 2, 2);
        ctx.fillStyle = '#ffffff'; // Eye specular reflection
        ctx.fillRect(25, 29, 1, 1);

        // Right eye
        ctx.fillStyle = '#ffffff'; // Sclera
        ctx.fillRect(35, 29, 6, 4);
        ctx.fillStyle = '#0284c7'; // Celestial cyan iris
        ctx.fillRect(36, 29, 3, 4);
        ctx.fillStyle = '#0f172a'; // Pupil
        ctx.fillRect(37, 30, 2, 2);
        ctx.fillStyle = '#ffffff'; // Eye specular reflection
        ctx.fillRect(36, 29, 1, 1);

        // Nose
        ctx.fillStyle = '#c68a5f';
        ctx.fillRect(31, 31, 2, 5);
        ctx.fillRect(29, 35, 6, 2);

        // Warm traveler's smile
        ctx.fillStyle = '#995832';
        ctx.fillRect(29, 39, 6, 2);
        ctx.fillStyle = '#c68a5f';
        ctx.fillRect(30, 40, 4, 1);
    }

    export function openAtlasDialogue(explorerEntity) {
        activeKaelEntity = explorerEntity;
        currentKaelNode = 'start';
        const modal = document.getElementById('atlas-dialogue-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        drawKaelPortrait();
        renderKaelNode('start');
        unlockAchievement('first_contact');
    }

    export function closeAtlasDialogue() {
        setPlayerTalkedToKael(true);
        const modal = document.getElementById('atlas-dialogue-modal');
        if (modal) modal.classList.add('hidden');
        activeKaelEntity = null;
    }

    export function renderKaelNode(nodeKey) {
        const node = KAEL_DIALOGUES[nodeKey] || KAEL_DIALOGUES.start;
        currentKaelNode = nodeKey;

        const speakerEl = document.getElementById('atlas-dialogue-speaker');
        if (speakerEl) speakerEl.innerText = node.speaker || 'Kael:';

        const textEl = document.getElementById('atlas-speech-text');
        if (textEl) textEl.innerText = node.text;

        const optsContainer = document.getElementById('atlas-dialogue-options');
        if (optsContainer) {
            optsContainer.innerHTML = node.options.map((opt, idx) => `
                <button type="button" class="atlas-floating-option-btn" onclick="handleAtlasDialogueChoice(${idx})">
                    <span class="atlas-option-bullet">▶</span>
                    <span class="atlas-option-label">${opt.label}</span>
                </button>
            `).join('');
        }
    }

    export function handleAtlasDialogueChoice(choiceIndex) {
        setPlayerTalkedToKael(true);
        const node = KAEL_DIALOGUES[currentKaelNode] || KAEL_DIALOGUES.start;
        const opt = node.options[choiceIndex];
        if (!opt) return;

        playSound('click');
        if (opt.action === 'open_market') {
            const targetKael = activeKaelEntity;
            closeAtlasDialogue();
            openAtlasMarket(targetKael);
        } else if (opt.action === 'close') {
            closeAtlasDialogue();
        } else if (opt.next) {
            renderKaelNode(opt.next);
        }
    }

    // --- Atlas Market Controller ---
    export let currentAtlasCategory = 'all';

    export function switchAtlasCategory(category) {
        currentAtlasCategory = category;
        playSound('click', { isUI: true, vol: 0.8 });
        const tabs = ['all', 'flora', 'relic', 'gear', 'planar'];
        tabs.forEach(t => {
            const btn = document.getElementById(`atlas-tab-${t}-btn`);
            if (btn) {
                if (t === category) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });
        renderAtlasMarketWares();
    }

    export function openAtlasMarket(explorerEntity) {
        const modal = document.getElementById('atlas-market-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        currentAtlasCategory = 'all';
        const tabs = ['all', 'flora', 'relic', 'gear', 'planar'];
        tabs.forEach(t => {
            const btn = document.getElementById(`atlas-tab-${t}-btn`);
            if (btn) {
                if (t === 'all') btn.classList.add('active');
                else btn.classList.remove('active');
            }
        });
        updateEmeraldsUI();
        renderAtlasMarketWares();
    }

    export function closeAtlasMarket() {
        const modal = document.getElementById('atlas-market-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = '';
        }
    }

    export function renderAtlasMarketWares() {
        try {
            const grid = document.getElementById('atlas-market-grid');
            if (!grid) return;

            const catalog = (typeof window !== 'undefined' && window.ATLAS_CATALOG) ? window.ATLAS_CATALOG : (typeof ATLAS_CATALOG !== 'undefined' ? ATLAS_CATALOG : []);
            const balance = getPlayerAstralEmeralds();

            // Update tab count badges dynamically
            const elAll = document.getElementById('atlas-tab-all-count');
            if (elAll) elAll.innerText = catalog.length;
            const elFlora = document.getElementById('atlas-tab-flora-count');
            if (elFlora) elFlora.innerText = catalog.filter(i => i.category === 'flora').length;
            const elRelic = document.getElementById('atlas-tab-relic-count');
            if (elRelic) elRelic.innerText = catalog.filter(i => i.category === 'relic').length;
            const elGear = document.getElementById('atlas-tab-gear-count');
            if (elGear) elGear.innerText = catalog.filter(i => i.category === 'gear').length;
            const elPlanar = document.getElementById('atlas-tab-planar-count');
            if (elPlanar) elPlanar.innerText = catalog.filter(i => i.category === 'tiles' || i.category === 'material').length;

            const filteredItems = catalog.filter(item => {
                if (currentAtlasCategory === 'all') return true;
                if (currentAtlasCategory === 'flora') return item.category === 'flora';
                if (currentAtlasCategory === 'relic') return item.category === 'relic';
                if (currentAtlasCategory === 'gear') return item.category === 'gear';
                if (currentAtlasCategory === 'planar') return item.category === 'tiles' || item.category === 'material';
                return true;
            });

            if (filteredItems.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-full flex flex-col items-center justify-center p-8 text-center text-[#8292a0] font-['VT323']">
                        <span class="text-3xl mb-1 text-purple-300">No Wares In Category</span>
                        <span class="text-base text-[#94a3b8]">Kael has no items in this planar category at the moment.</span>
                    </div>
                `;
                return;
            }

            const astralSrc = (typeof textures !== 'undefined' && textures && textures[IDS?.ASTRAL_EMERALD]?.src) || '';

            grid.innerHTML = filteredItems.map(item => {
                const stock = (typeof window !== 'undefined' && window.AtlasTradeManager) ? window.AtlasTradeManager.getStock(item.id) : item.baseStock;
                const canAfford = balance >= item.cost;
                const inStock = stock > 0;
                const isBuyable = canAfford && inStock;
                const itemSrc = (typeof textures !== 'undefined' && textures && textures[item.itemId]?.src) || '';

                let categoryName = 'Relic';
                let categoryColor = '#c084fc';
                if (item.category === 'flora') {
                    categoryName = 'Exotic Flora';
                    categoryColor = '#34d399';
                } else if (item.category === 'relic') {
                    categoryName = 'Audio Relic';
                    categoryColor = '#f472b6';
                } else if (item.category === 'gear') {
                    categoryName = 'Cosmic Gear';
                    categoryColor = '#fbbf24';
                } else if (item.category === 'tiles') {
                    categoryName = 'Planar Block';
                    categoryColor = '#38bdf8';
                } else if (item.category === 'material') {
                    categoryName = 'Stellar Shard';
                    categoryColor = '#a855f7';
                }

                let buttonLabel = 'Trade';
                let buttonDisabledAttr = '';
                let buttonStyleClass = '!bg-[#6d28d9] hover:!bg-[#7c3aed] !text-white';
                if (!inStock) {
                    buttonLabel = 'Sold Out';
                    buttonDisabledAttr = 'disabled';
                    buttonStyleClass = '!bg-[#2d353e] !text-[#64748b] opacity-60 cursor-not-allowed';
                } else if (!canAfford) {
                    const diff = item.cost - balance;
                    buttonLabel = `Need ${diff} Astral`;
                    buttonDisabledAttr = 'disabled';
                    buttonStyleClass = '!bg-[#382645] !text-[#d8b4fe] opacity-80 cursor-not-allowed border-purple-800';
                }

                return `
                    <div class="atlas-market-card flex flex-col justify-between">
                        <div>
                            <!-- Category Badge + Stock Indicator -->
                            <div class="flex justify-between items-center mb-2">
                                <span class="atlas-ware-badge" style="background: ${categoryColor}18; color: ${categoryColor}; border: 1px solid ${categoryColor}66;">
                                    ${categoryName}
                                </span>
                                ${inStock ? `
                                    <span class="px-2 py-0.5 text-xs font-['VT323'] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-600/50 flex items-center gap-1 shadow-inner">
                                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                        <span>STOCK: ${stock}/${item.baseStock}</span>
                                    </span>
                                ` : `
                                    <span class="px-2 py-0.5 text-xs font-['VT323'] font-bold text-red-400 bg-red-950/60 border border-red-600/50 shadow-inner">
                                        SOLD OUT
                                    </span>
                                `}
                            </div>

                            <!-- Item Icon + Name + Description -->
                            <div class="flex items-start gap-3 mb-2">
                                <div class="atlas-item-icon-frame flex-shrink-0">
                                    ${itemSrc ? `<img src="${itemSrc}" class="pixelated w-8 h-8 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" alt="${item.name}" />` : ''}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="text-lg sm:text-xl font-bold text-purple-200 font-['VT323'] leading-tight truncate drop-shadow-[1px_1px_0_#000]">${item.name}</div>
                                    <p class="text-xs sm:text-sm text-[#95a5b5] font-['VT323'] leading-snug line-clamp-2 m-0 mt-0.5 drop-shadow-[1px_1px_0_#000]">${item.description}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Footer: Astral Price + Action Button -->
                        <div class="flex items-center justify-between pt-2 border-t border-[#2b3542] mt-auto">
                            <div class="flex items-center gap-1.5 bg-[#12161b] px-2.5 py-1 border border-[#2b3542] shadow-inner">
                                ${astralSrc ? `<img src="${astralSrc}" class="pixelated w-5 h-5 object-contain" alt="Astral Emerald" />` : ''}
                                <span class="text-xl sm:text-2xl font-bold text-[#c084fc] font-['VT323'] leading-none drop-shadow-[1px_1px_0_#000]">${item.cost}</span>
                                <span class="text-[11px] text-purple-300 font-['VT323'] uppercase tracking-wider">ASTRAL</span>
                            </div>
                            <button class="mc-btn ${buttonStyleClass} !w-auto !min-w-[90px] !px-3 !py-1 !text-lg !font-['VT323']" 
                                    onclick="window.AtlasTradeManager ? window.AtlasTradeManager.buyItem('${item.id}') : null" ${buttonDisabledAttr}>
                                ${buttonLabel}
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (err) {
            console.error('Error rendering Atlas Market wares:', err);
        }
    }

    // --- Astral Infuser Station Controller ---
    let infuserSlottedGear = null;
    let infuserSlottedShard = null;

    export const DIAMOND_TO_ASTRAL_MAP = {
        [IDS.DIAMOND_SWORD]: IDS.ASTRAL_SWORD,
        [IDS.DIAMOND_PICKAXE]: IDS.ASTRAL_PICKAXE,
        [IDS.DIAMOND_AXE]: IDS.ASTRAL_AXE,
        [IDS.DIAMOND_SHOVEL]: IDS.ASTRAL_SHOVEL,
        [IDS.HELMET_DIAMOND]: IDS.ASTRAL_HELMET,
        [IDS.CHESTPLATE_DIAMOND]: IDS.ASTRAL_CHESTPLATE,
        [IDS.LEGGINGS_DIAMOND]: IDS.ASTRAL_LEGGINGS,
        [IDS.BOOTS_DIAMOND]: IDS.ASTRAL_BOOTS
    };

    export function openAstralInfuser(x, y) {
        infuserSlottedGear = null;
        infuserSlottedShard = null;
        const modal = document.getElementById('astral-infuser-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        renderInfuserUI();
    }

    export function closeAstralInfuser() {
        const modal = document.getElementById('astral-infuser-modal');
        if (modal) modal.classList.add('hidden');
        infuserSlottedGear = null;
        infuserSlottedShard = null;
    }

    // --- Minecraft In-World Real-Time Sign System ---
    let activeSignCoord = null;
    export let isSignEditorOpen = false;
    let inlineSignText = '';
    let signKeydownListener = null;
    let signBlinkInterval = null;

    let signOpenedAt = 0;
    export function getSignOpenedAt() {
        return signOpenedAt;
    }

    export function getActiveSignCoord() {
        return activeSignCoord;
    }

    export function updateSignInlinePosition() {
        if (!isSignEditorOpen || !activeSignCoord) return;
        const editorEl = document.getElementById('sign-inline-editor');
        if (!editorEl) return;
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
        const engineCam = (typeof window !== 'undefined' && window.camera) ? window.camera : (typeof camera !== 'undefined' ? camera : null);
        const camX = engineCam ? engineCam.x : 0;
        const camY = engineCam ? engineCam.y : 0;
        const tileSize = (typeof TILE_SIZE !== 'undefined') ? TILE_SIZE : 32;
        const sCX = rect.left + (activeSignCoord.x * tileSize + tileSize / 2 - camX);
        const sCY = rect.top + (activeSignCoord.y * tileSize - camY);
        // Clamp to stay on screen viewport
        const clampedX = Math.max(140, Math.min(window.innerWidth - 140, sCX));
        const clampedY = Math.max(50, Math.min(window.innerHeight - 40, sCY - 8));
        editorEl.style.left = `${Math.round(clampedX)}px`;
        editorEl.style.top = `${Math.round(clampedY)}px`;
    }

    export function focusSignLine(idx) {
        // Compatibility stub
    }

    export function updateSignLineCounter(idx) {
        // Compatibility stub
    }

    export function openSignEditor(gx, gy, isNew = false) {
        // If already editing a sign, save previous first
        if (isSignEditorOpen && activeSignCoord) {
            closeSignEditor(true);
        }

        signOpenedAt = Date.now();
        if (typeof window !== 'undefined') window.signOpenedAt = signOpenedAt;

        activeSignCoord = { x: gx, y: gy };
        isSignEditorOpen = true;
        if (typeof window !== 'undefined') {
            window.isSignEditorOpen = true;
            window.activeSignCoord = activeSignCoord;
        }

        // Halt any pending player key movements
        if (typeof keys !== 'undefined') {
            Object.keys(keys).forEach(k => delete keys[k]);
        }
        if (typeof window !== 'undefined' && window.keys) {
            Object.keys(window.keys).forEach(k => delete window.keys[k]);
        }

        // Hide hover tooltip if visible
        const hoverTip = document.getElementById('sign-hover-tooltip');
        if (hoverTip) {
            hoverTip.classList.add('hidden');
            hoverTip.style.display = 'none';
        }

        const liveSigns = (typeof window !== 'undefined' && window.signs) ? window.signs : (typeof signs !== 'undefined' ? signs : null);
        const signData = liveSigns ? liveSigns.get(`${gx}_${gy}`) : null;
        inlineSignText = signData?.text || (Array.isArray(signData?.lines) ? signData.lines.filter(Boolean).join('\n') : '');

        const editorEl = document.getElementById('sign-inline-editor');
        const textEl = document.getElementById('sign-inline-text');
        const cursorEl = document.getElementById('sign-inline-cursor');

        if (editorEl && textEl && cursorEl) {
            textEl.textContent = inlineSignText;
            cursorEl.textContent = '|';
            cursorEl.style.opacity = '1';
            editorEl.classList.remove('hidden');
            editorEl.style.display = 'block';
            updateSignInlinePosition();
        }

        // Start blinking cursor (| blinking every 450ms)
        if (signBlinkInterval) clearInterval(signBlinkInterval);
        let cursorVisible = true;
        signBlinkInterval = setInterval(() => {
            cursorVisible = !cursorVisible;
            const c = document.getElementById('sign-inline-cursor');
            if (c) c.style.opacity = cursorVisible ? '1' : '0';
        }, 450);

        // Attach keyboard listener for real-time typing
        if (signKeydownListener) {
            window.removeEventListener('keydown', signKeydownListener, true);
        }

        signKeydownListener = (e) => {
            if (!isSignEditorOpen) return;

            // Enter: finish and save
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                if (e.shiftKey) {
                    // Shift+Enter: newline up to 4 lines
                    const lines = inlineSignText.split('\n');
                    if (lines.length < 4) {
                        inlineSignText += '\n';
                        const t = document.getElementById('sign-inline-text');
                        if (t) t.textContent = inlineSignText;
                        updateSignInlinePosition();
                    }
                } else {
                    closeSignEditor(true);
                }
                return;
            }

            // Escape: close and save
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                closeSignEditor(true);
                return;
            }

            // Backspace: delete character
            if (e.key === 'Backspace') {
                e.preventDefault();
                e.stopPropagation();
                if (inlineSignText.length > 0) {
                    inlineSignText = inlineSignText.slice(0, -1);
                    const t = document.getElementById('sign-inline-text');
                    if (t) t.textContent = inlineSignText;
                    updateSignInlinePosition();
                }
                return;
            }

            // Printable single-character input
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                e.stopPropagation();
                const lines = inlineSignText.split('\n');
                const curLine = lines[lines.length - 1] || '';
                if (curLine.length < 24 && inlineSignText.length < 96) {
                    inlineSignText += e.key;
                    const t = document.getElementById('sign-inline-text');
                    if (t) t.textContent = inlineSignText;
                    updateSignInlinePosition();
                }
                return;
            }
        };

        window.addEventListener('keydown', signKeydownListener, true);
    }

    export function closeSignEditor(save = true) {
        if (!isSignEditorOpen && !activeSignCoord) return;

        isSignEditorOpen = false;
        if (typeof window !== 'undefined') {
            window.isSignEditorOpen = false;
            window.activeSignCoord = null;
        }

        if (signBlinkInterval) {
            clearInterval(signBlinkInterval);
            signBlinkInterval = null;
        }

        if (signKeydownListener) {
            window.removeEventListener('keydown', signKeydownListener, true);
            signKeydownListener = null;
        }

        const editorEl = document.getElementById('sign-inline-editor');
        if (editorEl) {
            editorEl.classList.add('hidden');
            editorEl.style.display = 'none';
        }

        const modal = document.getElementById('sign-edit-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }

        if (save && activeSignCoord) {
            const fullText = inlineSignText.trimEnd();
            let lines = fullText.split('\n').map(l => l.slice(0, 24));
            while (lines.length < 4) lines.push('');
            lines = lines.slice(0, 4);

            const liveSigns = (typeof window !== 'undefined' && window.signs) ? window.signs : (typeof signs !== 'undefined' ? signs : null);
            if (liveSigns) {
                liveSigns.set(`${activeSignCoord.x}_${activeSignCoord.y}`, {
                    text: fullText,
                    lines: lines
                });
            }

            if (typeof syncSign === 'function') {
                syncSign(activeSignCoord.x, activeSignCoord.y, fullText, lines);
            } else if (typeof window !== 'undefined' && typeof window.syncSign === 'function') {
                window.syncSign(activeSignCoord.x, activeSignCoord.y, fullText, lines);
            }

            if (typeof playSound === 'function') {
                playSound('step', { material: 'wood' });
            }

            if (!isMultiplayer && typeof saveCurrentWorld === 'function') {
                saveCurrentWorld();
            }
        }

        activeSignCoord = null;
        inlineSignText = '';
    }

    export function renderInfuserUI() {
        const gearSlot = document.getElementById('infuser-slot-gear');
        const shardSlot = document.getElementById('infuser-slot-shard');
        const outputSlot = document.getElementById('infuser-slot-output');
        const statusText = document.getElementById('infuser-status-text');
        const infuseBtn = document.getElementById('btn-astral-infuse');
        const eligibleTray = document.getElementById('infuser-eligible-items');

        if (gearSlot) {
            if (infuserSlottedGear) {
                const name = ID_NAMES[infuserSlottedGear.id] || 'Diamond Gear';
                const gearSrc = (typeof textures !== 'undefined' && textures && textures[infuserSlottedGear.id]?.src) || '';
                gearSlot.innerHTML = `
                    <div class="flex flex-col items-center gap-0.5 p-1">
                        ${gearSrc ? `<img src="${gearSrc}" class="w-8 h-8 pixelated object-contain" alt="${name}" />` : ''}
                        <span class="text-[11px] text-cyan-300 font-['VT323'] text-center leading-none truncate max-w-[56px] font-bold">${name}</span>
                    </div>
                `;
                gearSlot.classList.add('infuser-slot-active');
            } else {
                gearSlot.innerHTML = `<span class="text-gray-500 text-xs font-['VT323'] text-center px-1">Empty Slot</span>`;
                gearSlot.classList.remove('infuser-slot-active');
            }
        }

        if (shardSlot) {
            if (infuserSlottedShard) {
                const shardSrc = (typeof textures !== 'undefined' && textures && textures[IDS.ASTRAL_SHARD]?.src) || '';
                shardSlot.innerHTML = `
                    <div class="flex flex-col items-center gap-0.5 p-1">
                        ${shardSrc ? `<img src="${shardSrc}" class="w-8 h-8 pixelated object-contain" alt="Astral Shard" />` : ''}
                        <span class="text-[11px] text-purple-300 font-['VT323'] text-center leading-none font-bold">Shard x1</span>
                    </div>
                `;
                shardSlot.classList.add('infuser-slot-active');
            } else {
                shardSlot.innerHTML = `<span class="text-gray-500 text-xs font-['VT323'] text-center px-1">Empty Slot</span>`;
                shardSlot.classList.remove('infuser-slot-active');
            }
        }

        let targetAstralId = null;
        if (infuserSlottedGear && DIAMOND_TO_ASTRAL_MAP[infuserSlottedGear.id]) {
            targetAstralId = DIAMOND_TO_ASTRAL_MAP[infuserSlottedGear.id];
        }

        if (outputSlot) {
            if (targetAstralId && infuserSlottedShard) {
                const outName = ID_NAMES[targetAstralId] || 'Astral Gear';
                const outSrc = (typeof textures !== 'undefined' && textures && textures[targetAstralId]?.src) || '';
                outputSlot.innerHTML = `
                    <div class="flex flex-col items-center gap-0.5 p-1">
                        ${outSrc ? `<img src="${outSrc}" class="w-8 h-8 pixelated object-contain" alt="${outName}" />` : ''}
                        <span class="text-[11px] text-amber-300 font-['VT323'] text-center leading-none truncate max-w-[56px] font-bold">${outName}</span>
                    </div>
                `;
            } else {
                outputSlot.innerHTML = `<span class="text-gray-500 text-xs font-['VT323'] text-center px-1">Output</span>`;
            }
        }

        const ready = infuserSlottedGear && infuserSlottedShard && targetAstralId;
        if (infuseBtn) infuseBtn.disabled = !ready;

        if (statusText) {
            if (ready) {
                statusText.innerHTML = `<span class="text-emerald-400 font-bold">✦ Ready to forge ${ID_NAMES[targetAstralId]}! (750 Durability, Astral Glint) ✦</span>`;
            } else if (!infuserSlottedGear) {
                statusText.innerText = "Select Diamond equipment from your backpack below.";
            } else if (!infuserSlottedShard) {
                statusText.innerText = "Select 1 Astral Shard to initiate planar infusion.";
            }
        }

        if (eligibleTray) {
            const liveInv = (typeof window !== 'undefined' && Array.isArray(window.inventory)) ? window.inventory : inventory;
            const eligible = [];
            liveInv.forEach((slot, idx) => {
                if (!slot) return;
                if (DIAMOND_TO_ASTRAL_MAP[slot.id]) {
                    eligible.push({ slotIndex: idx, item: slot, type: 'gear' });
                } else if (slot.id === IDS.ASTRAL_SHARD) {
                    eligible.push({ slotIndex: idx, item: slot, type: 'shard' });
                }
            });

            if (eligible.length === 0) {
                eligibleTray.innerHTML = `<span class="text-xs text-[#8292a0] font-['VT323']">No Diamond gear or Astral Shards found in backpack.</span>`;
            } else {
                eligibleTray.innerHTML = eligible.map(el => {
                    const isSelected = (el.type === 'gear' && infuserSlottedGear?.slotIndex === el.slotIndex) ||
                                       (el.type === 'shard' && infuserSlottedShard?.slotIndex === el.slotIndex);
                    const name = ID_NAMES[el.item.id] || 'Item';
                    const elSrc = (typeof textures !== 'undefined' && textures && textures[el.item.id]?.src) || '';
                    return `
                        <button type="button" class="eligible-chip ${isSelected ? 'border-amber-400 bg-[#251f33]' : ''} flex items-center gap-1.5" 
                                onclick="handleEligibleItemClick(${el.slotIndex}, '${el.type}')">
                            ${elSrc ? `<img src="${elSrc}" class="w-5 h-5 pixelated object-contain flex-shrink-0" alt="" />` : ''}
                            <span class="text-xs ${el.type === 'gear' ? 'text-cyan-300' : 'text-purple-300'} font-['VT323']">
                                ${name} ${el.item.count > 1 ? `(${el.item.count})` : ''}
                            </span>
                        </button>
                    `;
                }).join('');
            }
        }
    }

    export function handleEligibleItemClick(slotIndex, type) {
        const liveInv = (typeof window !== 'undefined' && Array.isArray(window.inventory)) ? window.inventory : inventory;
        const item = liveInv[slotIndex];
        if (!item) return;

        if (type === 'gear') {
            if (DIAMOND_TO_ASTRAL_MAP[item.id]) {
                infuserSlottedGear = { slotIndex, id: item.id, count: item.count, durability: item.durability };
                playSound('click');
            }
        } else if (type === 'shard') {
            if (item.id === IDS.ASTRAL_SHARD) {
                infuserSlottedShard = { slotIndex, id: item.id, count: item.count };
                playSound('click');
            }
        }
        renderInfuserUI();
    }

    export function handleInfuserSlotClick(slotType) {
        if (slotType === 'gear' && infuserSlottedGear) {
            infuserSlottedGear = null;
            playSound('click');
            renderInfuserUI();
        } else if (slotType === 'shard' && infuserSlottedShard) {
            infuserSlottedShard = null;
            playSound('click');
            renderInfuserUI();
        }
    }

    export function performAstralInfusion() {
        if (!infuserSlottedGear || !infuserSlottedShard) return;
        const targetAstralId = DIAMOND_TO_ASTRAL_MAP[infuserSlottedGear.id];
        if (!targetAstralId) return;

        const liveInv = (typeof window !== 'undefined' && Array.isArray(window.inventory)) ? window.inventory : inventory;

        const gearSlot = liveInv[infuserSlottedGear.slotIndex];
        const shardSlot = liveInv[infuserSlottedShard.slotIndex];

        if (!gearSlot || gearSlot.id !== infuserSlottedGear.id) {
            showToast("Diamond gear was moved or is missing!");
            infuserSlottedGear = null;
            renderInfuserUI();
            return;
        }

        if (!shardSlot || shardSlot.id !== IDS.ASTRAL_SHARD) {
            showToast("Astral Shard was moved or is missing!");
            infuserSlottedShard = null;
            renderInfuserUI();
            return;
        }

        gearSlot.count--;
        if (gearSlot.count <= 0) liveInv[infuserSlottedGear.slotIndex] = null;

        shardSlot.count--;
        if (shardSlot.count <= 0) liveInv[infuserSlottedShard.slotIndex] = null;

        giveItem(targetAstralId, 1);

        playSound('infuser_forge');
        showToast(`✦ Successfully infused ${ID_NAMES[targetAstralId]}! (750 Durability) ✦`);
        unlockAchievement('void_technician');

        infuserSlottedGear = null;
        infuserSlottedShard = null;
        renderInfuserUI();
        if (typeof updateUI === 'function') updateUI();
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
            const isGuest = !currentUserProfile || currentUserProfile.isGuest;
            const guestBanner = document.getElementById('skin-shop-guest-banner');
            const accountContent = document.getElementById('skin-shop-account-content');
            if (isGuest) {
                if (guestBanner) guestBanner.classList.remove('hidden');
                if (accountContent) accountContent.classList.add('hidden');
            } else {
                if (guestBanner) guestBanner.classList.add('hidden');
                if (accountContent) accountContent.classList.remove('hidden');
                drawShopkeeperAvatar();
                loadSkinGallery();
            }
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

        const isGuest = !currentUserProfile || currentUserProfile.isGuest;
        const inMySkins = isSkinInMySkins(skin);
        const isOwned = isSkinOwned(skin);

        // Hover overlay actions matching My Skins
        const actions = document.createElement('div');
        actions.className = 'skin-card-actions';

        if (isGuest) {
            const guestBtn = document.createElement('button');
            guestBtn.className = 'skin-action buy';
            guestBtn.type = 'button';
            guestBtn.title = 'Guests cannot get skins from Skins Shop. Create an account or log in!';
            guestBtn.setAttribute('aria-label', 'Create account or log in to get skin');
            guestBtn.innerHTML = `${getPixelPadlockSvg(12)} Login`;
            guestBtn.onclick = (e) => {
                e.stopPropagation();
                buyAndEquipGallerySkin(skin);
            };
            actions.appendChild(guestBtn);
        } else if (inMySkins) {
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
        const isGuest = !currentUserProfile || currentUserProfile.isGuest;
        if (isGuest) {
            showToast("Guests cannot get skins from the Skins Shop! Please create an account or log in.");
            const banner = document.getElementById('skin-shop-guest-banner');
            if (banner) {
                banner.classList.remove('hidden');
                banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            if (typeof playSound === 'function') playSound('hurt', { vol: 0.6 });
            return;
        }

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
                <button class="skin-action edit" type="button" title="Edit skin" aria-label="Edit skin">
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" style="image-rendering: pixelated; shape-rendering: crispEdges;">
                        <rect x="1" y="13" width="2" height="2" fill="#334155"/>
                        <rect x="2" y="11" width="2" height="2" fill="#fde68a"/>
                        <rect x="4" y="9" width="2" height="2" fill="#fbbf24"/>
                        <rect x="6" y="7" width="2" height="2" fill="#fbbf24"/>
                        <rect x="8" y="5" width="2" height="2" fill="#fbbf24"/>
                        <rect x="10" y="3" width="2" height="2" fill="#94a3b8"/>
                        <rect x="12" y="1" width="2" height="2" fill="#f472b6"/>
                    </svg>
                </button>
                <button class="skin-action upload" type="button" title="Upload to Skins Shop" aria-label="Upload to Skins Shop">
                    <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
                        <path d="M7 1h2v6h3v2h-2v5H6V9H4V7h3V1z" fill="#4eed99"/>
                        <path d="M1 13h14v2H1z" fill="#fff"/>
                    </svg>
                </button>
                <button class="skin-action delete" type="button" title="Delete skin" aria-label="Delete skin">X</button>
            `;
            if (actions.children && actions.children.length >= 3) {
                actions.children[0].onclick = (event) => { event.stopPropagation(); editSkin(skinId); };
                actions.children[1].onclick = (event) => { event.stopPropagation(); openSkinUploadModal(skinId, name, skinData); };
                actions.children[2].onclick = (event) => { event.stopPropagation(); deleteSkin(skinId); };
            }
            card.appendChild(actions);
        }
        return card;
    }


    // --- Upload to Skins Shop Modal Logic ---
    export let pendingUploadSkinData = null;
    export let pendingUploadSkinId = null;
    export let currentUploadPrice = 0;

    export function openSkinUploadModal(skinId, name, skinData) {
        const isGuest = !currentUserProfile || currentUserProfile.isGuest;
        if (isGuest) {
            showToast("Guests cannot publish skins to the Skins Shop! Please create an account or log in.");
            if (typeof playSound === 'function') playSound('hurt', { vol: 0.6 });
            return;
        }

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
        if (typeof window !== 'undefined') {
            window.playerSkinData = playerSkinData;
        }
        loadUserProfile();
        if (currentUserProfile) {
            currentUserProfile.activeSkinId = skinId;
            currentUserProfile.skinData = playerSkinData.slice();
            localStorage.setItem('webcraft_user_profile', JSON.stringify(currentUserProfile));
        }
        compileSkinCanvas();
        renderSkinLibrary();
        if (typeof drawPlayerPreview === 'function') drawPlayerPreview(true);
        if (typeof updateMainMenuProfileBadge === 'function') updateMainMenuProfileBadge();
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
            if (typeof window.setStaticPreviewDrawn === 'function') {
                window.setStaticPreviewDrawn(false);
            }
        }
        if (typeof staticPreviewDrawn !== 'undefined') staticPreviewDrawn = false;
        if (typeof drawPlayerPreview === 'function') drawPlayerPreview(true);
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
                        const isRecentAdventurer = parsed[19 * SKIN_W + 7] === '#ca8a04' || parsed[4 * SKIN_W + 7] === '#2b4d8a';
                        if (isRecentAdventurer || !savedId || savedId === 'default') {
                            playerSkinData = getDefaultSkinData();
                            activeSkinId = 'default';
                            localStorage.setItem('swc_active_skin_v1', 'default');
                            localStorage.setItem('swc_skin_v5', JSON.stringify(playerSkinData));
                            compileSkinCanvas();
                            return;
                        }
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
        unlockAchievement('fashion_statement');
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
            if (typeof renderStaticPlayerPreview === 'function') {
                renderStaticPlayerPreview();
            }
        });
    }


    export const RECIPES = [
        { output: { id: IDS.BUCKET, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 3 }], reqTable: true, category: 'utility' },
        { output: { id: IDS.JUKEBOX, count: 1 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 8 }, { id: IDS.DIAMOND, count: 1 }], reqTable: true, category: 'utility' },
        { output: { id: IDS.EMPTY_VINYL, count: 1 }, inputs: [{ id: IDS.COAL, count: 4 }, { id: IDS.IRON_INGOT, count: 1 }], reqTable: true, category: 'utility' },
        { output: { id: IDS.PLANKS, count: 4 }, inputs: [{ id: IDS.WOOD, count: 1 }], reqTable: false },
        { output: { id: IDS.JUNGLE_PLANKS, count: 4 }, inputs: [{ id: IDS.JUNGLE_WOOD, count: 1 }], reqTable: false, category: 'blocks' },
        { output: { id: IDS.CHEST, count: 1 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 8 }], reqTable: true, category: 'blocks' },
        { output: { id: IDS.STICK, count: 4 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 2 }], reqTable: false },
        { output: { id: IDS.JUNGLE_DOOR, count: 1 }, inputs: [{ id: IDS.JUNGLE_PLANKS, count: 6 }], reqTable: true, category: 'blocks' },
        { output: { id: IDS.SIGN, count: 3 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 6 }, { id: IDS.STICK, count: 1 }], reqTable: true, category: 'utility' },
        { output: { id: IDS.MELON_SEEDS, count: 1 }, inputs: [{ id: IDS.MELON_SLICE, count: 1 }], reqTable: false, category: 'utility' },
        { output: { id: IDS.MELON, count: 1 }, inputs: [{ id: IDS.MELON_SLICE, count: 9 }], reqTable: true, category: 'blocks' },
        { output: { id: IDS.LADDER, count: 3 }, inputs: [{ id: IDS.STICK, count: 7 }], reqTable: true, category: 'blocks' },
        { output: { id: IDS.WOODEN_STAIRS, count: 4 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 6 }], reqTable: true, category: 'blocks' },
        { output: { id: IDS.COBBLESTONE_STAIRS, count: 4 }, inputs: [{ id: IDS.COBBLESTONE, count: 6 }], reqTable: true, category: 'blocks' },
        { output: { id: IDS.TORCH, count: 4 }, inputs: [{ id: IDS.COAL, count: 1 }, { id: IDS.STICK, count: 1 }], reqTable: false },
        { output: { id: IDS.CRAFTING_TABLE, count: 1 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 4 }], reqTable: false },
        { output: { id: IDS.DOOR, count: 1 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 6 }], reqTable: true, category: 'blocks' },
        { output: { id: IDS.FURNACE, count: 1 }, inputs: [{ id: IDS.COBBLESTONE, count: 8 }], reqTable: true },
        { output: { id: IDS.BED, count: 1 }, inputs: [{ id: IDS.WOOL, count: 3 }, { id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 3 }], reqTable: true },
        { output: { id: IDS.WOOD_PICKAXE, count: 1 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true },
        { output: { id: IDS.WOOD_SWORD, count: 1 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 2 }, { id: IDS.STICK, count: 1 }], reqTable: true },
        { output: { id: IDS.WOOD_AXE, count: 1 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true },
        { output: { id: IDS.WOOD_SHOVEL, count: 1 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 1 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
        { output: { id: IDS.WOOD_HOE, count: 1 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 2 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
        { output: { id: IDS.STONE_PICKAXE, count: 1 }, inputs: [{ id: IDS.COBBLESTONE, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true },
        { output: { id: IDS.STONE_SWORD, count: 1 }, inputs: [{ id: IDS.COBBLESTONE, count: 2 }, { id: IDS.STICK, count: 1 }], reqTable: true },
        { output: { id: IDS.STONE_AXE, count: 1 }, inputs: [{ id: IDS.COBBLESTONE, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true },
        { output: { id: IDS.STONE_SHOVEL, count: 1 }, inputs: [{ id: IDS.COBBLESTONE, count: 1 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
        { output: { id: IDS.STONE_HOE, count: 1 }, inputs: [{ id: IDS.COBBLESTONE, count: 2 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
        { output: { id: IDS.IRON_INGOT, count: 1 }, inputs: [{ id: IDS.IRON_ORE, count: 1 }, { id: IDS.COAL, count: 1 }], reqTable: true, category: 'materials' },
        { output: { id: IDS.GOLD_INGOT, count: 1 }, inputs: [{ id: IDS.GOLD_ORE, count: 1 }, { id: IDS.COAL, count: 1 }], reqTable: true, category: 'materials' },
        { output: { id: IDS.DIAMOND, count: 1 }, inputs: [{ id: IDS.DIAMOND_ORE, count: 1 }], reqTable: true, category: 'materials' },
        { output: { id: IDS.GOLD_PICKAXE, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true },
        { output: { id: IDS.GOLD_SWORD, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 2 }, { id: IDS.STICK, count: 1 }], reqTable: true },
        { output: { id: IDS.GOLD_AXE, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true },
        { output: { id: IDS.GOLD_SHOVEL, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 1 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
        { output: { id: IDS.GOLD_HOE, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 2 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
        { output: { id: IDS.IRON_PICKAXE, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true },
        { output: { id: IDS.IRON_SWORD, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 2 }, { id: IDS.STICK, count: 1 }], reqTable: true },
        { output: { id: IDS.IRON_AXE, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true },
        { output: { id: IDS.IRON_SHOVEL, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 1 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
        { output: { id: IDS.IRON_HOE, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 2 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
        { output: { id: IDS.DIAMOND_PICKAXE, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true },
        { output: { id: IDS.DIAMOND_SWORD, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 2 }, { id: IDS.STICK, count: 1 }], reqTable: true },
        { output: { id: IDS.DIAMOND_AXE, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true },
        { output: { id: IDS.DIAMOND_SHOVEL, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 1 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
        { output: { id: IDS.DIAMOND_HOE, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 2 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
        { output: { id: IDS.BREAD, count: 1 }, inputs: [{ id: IDS.WHEAT, count: 3 }], reqTable: true, category: 'utility' },
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
        { output: { id: IDS.BOOTS_DIAMOND, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 4 }], reqTable: true, category: 'armor' },
        { output: { id: IDS.SUNBURST_MELON_SEEDS, count: 1 }, inputs: [{ id: IDS.SUNBURST_MELON_SLICE, count: 1 }], reqTable: false, category: 'utility' },
        { output: { id: IDS.SUNBURST_MELON, count: 1 }, inputs: [{ id: IDS.SUNBURST_MELON_SLICE, count: 9 }], reqTable: true, category: 'blocks' },
        { output: { id: IDS.SHADOWFANG, count: 1 }, inputs: [{ id: IDS.SHADOW_CARAPACE, count: 2 }, { id: IDS.GLOOM_SILK, count: 2 }, { id: IDS.IRON_INGOT, count: 1 }], reqTable: true, category: 'tools' },
        { output: { id: IDS.GLOOM_LANTERN, count: 1 }, inputs: [{ id: IDS.GLOOM_SILK, count: 4 }, { id: IDS.TORCH, count: 1 }, { id: IDS.IRON_INGOT, count: 2 }], reqTable: true, category: 'utility' }
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
            id: 'time_to_cultivate',
            title: 'Time to Cultivate!',
            description: 'Craft a hoe or plow dirt with a hoe to prepare farmland.',
            iconItem: IDS.WOOD_HOE,
            badge: 'Easy',
            difficulty: 'Easy'
        },
        {
            id: 'green_thumb',
            title: 'Green Thumb',
            description: 'Plant seeds on plowed farmland to cultivate crops.',
            iconItem: IDS.WHEAT_STAGE_1,
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
        {
            id: 'best_friends_forever',
            title: 'Best Friends Forever',
            description: 'Tame a colorful wild parrot with seeds in the jungle.',
            iconItem: IDS.MELON_SEEDS,
            badge: 'Easy',
            difficulty: 'Easy'
        },
        {
            id: 'first_contact',
            title: 'First Contact',
            description: 'Speak with Kael, The Atlas Explorer upon his planar rift arrival.',
            iconItem: IDS.ASTRAL_EMERALD,
            badge: 'Easy',
            difficulty: 'Easy',
            emeraldReward: 10
        },
        {
            id: 'sound_of_music',
            title: 'Retro Grooves',
            description: 'Insert and play a music disc in a Jukebox to fill the world with melodies.',
            iconItem: IDS.JUKEBOX,
            badge: 'Easy',
            difficulty: 'Easy',
            emeraldReward: 10
        },
        {
            id: 'notice_board',
            title: 'Notice Board',
            description: 'Craft and place a wooden sign to mark landmarks or leave notes.',
            iconItem: IDS.SIGN,
            badge: 'Easy',
            difficulty: 'Easy',
            emeraldReward: 5
        },
        {
            id: 'knock_knock',
            title: 'Knock Knock',
            description: 'Craft or install a wooden or jungle door to secure your shelter.',
            iconItem: IDS.DOOR,
            badge: 'Easy',
            difficulty: 'Easy',
            emeraldReward: 5
        },
        {
            id: 'moo_harvest',
            title: 'Moo-ver and Shaker',
            description: 'Harvest fresh leather and beef from cattle.',
            iconItem: IDS.LEATHER,
            badge: 'Easy',
            difficulty: 'Easy',
            emeraldReward: 10
        },
        {
            id: 'feather_gatherer',
            title: 'Feathered Fletching',
            description: 'Collect feathers dropped by chickens.',
            iconItem: IDS.FEATHER,
            badge: 'Easy',
            difficulty: 'Easy',
            emeraldReward: 5
        },
        {
            id: 'shear_sheep',
            title: 'Shear Determination',
            description: 'Shear a sheep using shears to gather soft raw wool.',
            iconItem: IDS.WOOL,
            badge: 'Easy',
            difficulty: 'Easy',
            emeraldReward: 10
        },
        {
            id: 'fashion_statement',
            title: 'Fresh Threads',
            description: 'Customize and save a bespoke player skin in the Wardrobe.',
            iconItem: IDS.CHEST,
            badge: 'Easy',
            difficulty: 'Easy',
            emeraldReward: 10
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
        {
            id: 'bumper_crop',
            title: 'Bumper Crop',
            description: 'Harvest mature wheat from your flourishing farm.',
            iconItem: IDS.WHEAT,
            badge: 'Medium',
            difficulty: 'Medium'
        },
        {
            id: 'bake_bread',
            title: 'Bake Bread',
            description: 'Craft 3 harvested wheat sheaves into a loaf of bread.',
            iconItem: IDS.BREAD,
            badge: 'Medium',
            difficulty: 'Medium'
        },
        {
            id: 'astral_pioneer',
            title: 'Astral Pioneer',
            description: 'Acquire or exchange your very first Astral Emerald.',
            iconItem: IDS.ASTRAL_EMERALD,
            badge: 'Medium',
            difficulty: 'Medium',
            emeraldReward: 20
        },
        {
            id: 'gem_prospector',
            title: 'Gem Prospector',
            description: 'Discover and mine a natural Emerald Ore vein in the mountains or cavern depths.',
            iconItem: IDS.EMERALD_ORE,
            badge: 'Medium',
            difficulty: 'Medium',
            emeraldReward: 25
        },
        {
            id: 'jungle_explorer',
            title: 'Deep Jungle Explorer',
            description: 'Traverse the wild Jungle biome and harvest lush jungle wood or melons.',
            iconItem: IDS.JUNGLE_WOOD,
            badge: 'Medium',
            difficulty: 'Medium',
            emeraldReward: 20
        },
        {
            id: 'bamboo_forester',
            title: 'Bamboo Forester',
            description: 'Plant and cultivate a towering bamboo thicket.',
            iconItem: IDS.BAMBOO,
            badge: 'Medium',
            difficulty: 'Medium',
            emeraldReward: 20
        },
        {
            id: 'bird_whisperer',
            title: 'Bird Whisperer',
            description: 'Tame a wild jungle parrot with seeds to perch on your shoulder.',
            iconItem: IDS.SEEDS,
            badge: 'Medium',
            difficulty: 'Medium',
            emeraldReward: 25
        },
        {
            id: 'cosmic_merchant',
            title: 'Planar Commerce',
            description: 'Purchase a rare treasure from Kael in the Atlas Market.',
            iconItem: IDS.ASTRAL_EMERALD,
            badge: 'Medium',
            difficulty: 'Medium',
            emeraldReward: 25
        },
        {
            id: 'astral_infusion',
            title: 'Celestial Forge',
            description: 'Craft or place an Astral Infuser station to harness cosmic alchemy.',
            iconItem: IDS.ASTRAL_INFUSER,
            badge: 'Medium',
            difficulty: 'Medium',
            emeraldReward: 20
        },
        {
            id: 'void_nourishment',
            title: 'Taste of the Cosmos',
            description: 'Consume a radiant Void Berry harvested from celestial flora.',
            iconItem: IDS.VOID_BERRY,
            badge: 'Medium',
            difficulty: 'Medium',
            emeraldReward: 15
        },
        {
            id: 'desert_stinger',
            title: 'Desert Stinger',
            description: 'Slay a venomous scorpion prowling the desert sands or caverns.',
            iconItem: IDS.BONE,
            badge: 'Medium',
            difficulty: 'Medium',
            emeraldReward: 20
        },
        {
            id: 'defuse_fuse',
            title: 'Defuse the Fuse',
            description: 'Defeat a volatile creeper before it detonates.',
            iconItem: IDS.COAL,
            badge: 'Medium',
            difficulty: 'Medium',
            emeraldReward: 25
        },
        {
            id: 'solar_harvest',
            title: 'Solar Harvest',
            description: 'Cultivate and harvest a glowing Sunburst Melon.',
            iconItem: IDS.SUNBURST_MELON,
            badge: 'Medium',
            difficulty: 'Medium',
            emeraldReward: 20
        },
        {
            id: 'deep_diver_breath',
            title: 'Hold Your Breath',
            description: 'Dive deep underwater and safely resurface after depleting half your oxygen.',
            iconItem: IDS.WATER_BUCKET,
            badge: 'Medium',
            difficulty: 'Medium',
            emeraldReward: 20
        },
        {
            id: 'craft_vinyl',
            title: 'Disc Jockey',
            description: 'Craft a blank Vinyl Disc at the Crafting Table to prepare your own beats.',
            iconItem: IDS.EMPTY_VINYL,
            badge: 'Medium',
            difficulty: 'Medium',
            emeraldReward: 15
        },
        {
            id: 'prism_glass_art',
            title: 'Prismatic Radiance',
            description: 'Craft or place a shimmering Prism Glass block.',
            iconItem: IDS.PRISM_GLASS,
            badge: 'Medium',
            difficulty: 'Medium',
            emeraldReward: 20
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
        {
            id: 'void_technician',
            title: 'Void Technician',
            description: 'Infuse Diamond equipment with an Astral Shard at the Astral Infuser station.',
            iconItem: IDS.ASTRAL_PICKAXE,
            badge: 'Hard',
            difficulty: 'Hard',
            emeraldReward: 35
        },
        {
            id: 'daily_hustler',
            title: 'Daily Hustler',
            description: 'Complete and claim all Daily Challenges in a single day.',
            iconItem: IDS.CHEST,
            badge: 'Hard',
            difficulty: 'Hard',
            emeraldReward: 40
        },
        {
            id: 'kinetic_shearing',
            title: 'High-Frequency Shears',
            description: 'Shear a sheep using high-tech Kinetic Shears for triple wool yields.',
            iconItem: IDS.KINETIC_SHEARS,
            badge: 'Hard',
            difficulty: 'Hard',
            emeraldReward: 30
        },
        {
            id: 'astral_exchange_master',
            title: 'Vault Tycoon',
            description: 'Exchange standard Emeralds for Astral Emeralds in the Astral Exchange Vault.',
            iconItem: IDS.ASTRAL_EMERALD,
            badge: 'Hard',
            difficulty: 'Hard',
            emeraldReward: 35
        },
        {
            id: 'gold_standard',
            title: 'Gold Standard',
            description: 'Forge and equip a complete 4-piece set of gleaming Golden Armor (Helmet, Chest, Legs, Boots).',
            iconItem: IDS.CHESTPLATE_GOLD,
            badge: 'Hard',
            difficulty: 'Hard',
            emeraldReward: 35
        },
        {
            id: 'forge_shadowfang',
            title: 'Shadowfang',
            description: 'Forge the lethal Shadowfang dagger using Gloom Silk and Shadow Carapace.',
            iconItem: IDS.SHADOWFANG,
            badge: 'Hard',
            difficulty: 'Hard',
            emeraldReward: 35
        },
        {
            id: 'gloom_lantern_placed',
            title: 'Void Illuminator',
            description: 'Craft and place a Gloom Lantern to illuminate dark depths with void silk light.',
            iconItem: IDS.GLOOM_LANTERN,
            badge: 'Hard',
            difficulty: 'Hard',
            emeraldReward: 30
        },
        {
            id: 'strider_speed',
            title: 'Warp Speed',
            description: 'Equip Strider Boots and dash across the terrain with enhanced velocity.',
            iconItem: IDS.STRIDER_BOOTS,
            badge: 'Hard',
            difficulty: 'Hard',
            emeraldReward: 30
        },
        {
            id: 'solar_nourishment',
            title: 'Solar Vitality',
            description: 'Consume a Sunburst Melon slice or Golden Apple to restore vital strength.',
            iconItem: IDS.SUNBURST_MELON_SLICE,
            badge: 'Hard',
            difficulty: 'Hard',
            emeraldReward: 30
        },
        {
            id: 'stellar_arsenal',
            title: 'Stellar Arsenal',
            description: 'Forge an Astral Sword, Astral Axe, or Astral Shovel at the Astral Infuser.',
            iconItem: IDS.ASTRAL_SWORD,
            badge: 'Hard',
            difficulty: 'Hard',
            emeraldReward: 40
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
        },
        {
            id: 'why_would_you_do_that',
            title: 'Why Would You Do That?',
            description: 'Defeated an innocent, sweet pigeon. They didn\'t even drop anything... was it worth it?',
            iconItem: IDS.FEATHER,
            badge: 'Master',
            difficulty: 'Master'
        },
        {
            id: 'astral_ascension',
            title: 'Celestial Juggernaut',
            description: 'Forge and equip a complete 4-piece set of Astral Armor (Helmet, Chest, Legs, Boots).',
            iconItem: IDS.ASTRAL_CHESTPLATE,
            badge: 'Master',
            difficulty: 'Master',
            emeraldReward: 50
        },
        {
            id: 'slay_gloomstalker',
            title: 'Shadow of the Deep',
            description: 'Conquer and defeat the terrifying Gloomstalker boss in the dark cavern depths.',
            iconItem: IDS.SHADOW_CARAPACE,
            badge: 'Master',
            difficulty: 'Master',
            emeraldReward: 75
        },
        {
            id: 'monster_slayer_50',
            title: 'Monster Slayer',
            description: 'Slay 50 hostile monsters across your survival odyssey.',
            iconItem: IDS.DIAMOND_SWORD,
            badge: 'Master',
            difficulty: 'Master',
            emeraldReward: 60
        },
        {
            id: 'immortal_legend',
            title: 'Immortal Legend',
            description: 'Survive for 10 full in-game days without meeting an untimely demise.',
            iconItem: IDS.BED,
            badge: 'Master',
            difficulty: 'Master',
            emeraldReward: 80
        },
        {
            id: 'grand_archon',
            title: 'Grand Archon',
            description: 'Unlock at least 45 milestones to become a legendary Webcraft champion.',
            iconItem: IDS.ASTRAL_EMERALD,
            badge: 'Master',
            difficulty: 'Master',
            emeraldReward: 100
        }
    ];

    export let currentAchievementsTab = 'sp';
    export let openedAchievementsFromPause = false;
    export let currentWorldAchievementsEnabled = true;
    export let monstersKilledCount = 0;
    export let deepBlocksMinedCount = 0;
    export let craftedItemsCount = 0;

    export function getPixelWarningSvg(size = 18, extraClass = '') {
        return getPixelWarningSvgDef(size, extraClass);
    }

    export function updateNewWorldAchievementWarning() {
        const starter = document.getElementById('new-world-starter-items')?.checked;
        const keep = document.getElementById('new-world-keep-inventory')?.checked;
        const cheats = document.getElementById('new-world-allow-cheats')?.checked;
        const isCreative = (typeof selectedGameModeChoice !== 'undefined' && selectedGameModeChoice === 'creative');
        const warning = document.getElementById('new-world-achievement-warning');
        if (warning) {
            if (starter || keep || cheats || isCreative) {
                warning.classList.remove('hidden');
                let reasons = [];
                if (isCreative) reasons.push('Creative Mode');
                if (cheats) reasons.push('Cheats Enabled');
                if (starter) reasons.push('Starter Items');
                if (keep) reasons.push('Keep Inventory');
                const reasonStr = reasons.join(' & ');
                warning.innerHTML = `${getPixelWarningSvg(18, 'mt-0.5')} <div><span class="font-bold text-yellow-400">Achievements Disabled:</span> ${reasonStr} disables achievements in this world. Play in Survival without cheats or bonus items to earn achievements.</div>`;
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
                warning.innerHTML = `${getPixelWarningSvg(18, 'mt-0.5')} <div><span class="font-bold text-yellow-400">Achievements Disabled:</span> Starting with ${reason} disables achievements in this multiplayer room. Disable both options to earn achievements.</div>`;
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
        document.querySelectorAll('.ach-filter-btn, .ach-tier-tab').forEach(btn => {
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
        if (Object.keys(data).length >= 45 && !data['grand_archon']) {
            unlockAchievement('grand_archon');
        }

        if (pinnedAchievementId === achId) {
            renderPinnedAchievementHUD();
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

    export function showKaelArrivalBanner() {
        let container = document.getElementById('kael-banner-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'kael-banner-container';
            document.body.appendChild(container);
        }

        const banner = document.createElement('div');
        banner.className = 'kael-arrival-banner';

        const iconFrame = document.createElement('div');
        iconFrame.className = 'kael-relic-frame';
        if (typeof textures !== 'undefined' && textures[IDS.ASTRAL_SHARD]) {
            const img = document.createElement('img');
            img.src = textures[IDS.ASTRAL_SHARD].src;
            img.className = 'w-8 h-8 pixelated drop-shadow-[2px_2px_0_#000]';
            iconFrame.appendChild(img);
        } else {
            iconFrame.innerHTML = `
                <svg viewBox="0 0 24 24" width="28" height="28" style="image-rendering: pixelated; shape-rendering: crispEdges;">
                    <rect x="10" y="2" width="4" height="2" fill="#fde047"/>
                    <rect x="8" y="4" width="8" height="3" fill="#c084fc"/>
                    <rect x="6" y="7" width="12" height="10" fill="#a855f7"/>
                    <rect x="8" y="10" width="8" height="4" fill="#7e22ce"/>
                    <rect x="9" y="17" width="6" height="3" fill="#6b21a8"/>
                    <rect x="11" y="20" width="2" height="2" fill="#3b0764"/>
                    <rect x="9" y="8" width="2" height="2" fill="#ffffff"/>
                </svg>
            `;
        }
        banner.appendChild(iconFrame);

        const content = document.createElement('div');
        content.className = 'flex flex-col min-w-0';

        const header = document.createElement('span');
        header.className = "kael-banner-header text-amber-300 font-bold font-['VT323'] tracking-widest leading-none drop-shadow-[2px_2px_0_#000] uppercase";
        header.style.color = '#fde047';
        header.innerText = 'PLANAR RIFT OPENED';
        content.appendChild(header);

        const title = document.createElement('span');
        title.className = "kael-banner-title text-2xl sm:text-3xl text-white font-bold font-['VT323'] drop-shadow-[2px_2px_0_#000] truncate leading-tight";
        title.style.color = '#ffffff';
        title.innerText = 'Kael, The Atlas Explorer has arrived!';
        content.appendChild(title);

        const subtitle = document.createElement('span');
        subtitle.className = "kael-banner-subtitle text-sm sm:text-base text-white font-['VT323'] drop-shadow-[1px_1px_0_#000] leading-none mt-0.5";
        subtitle.style.color = '#ffffff';
        subtitle.innerText = 'Seek the cosmic traveler before the rift collapses!';
        content.appendChild(subtitle);

        banner.appendChild(content);
        container.appendChild(banner);

        if (typeof playSound === 'function') {
            playSound('portal_warp', { vol: 1.0 });
        }

        setTimeout(() => {
            banner.classList.add('dismissing');
            setTimeout(() => {
                if (banner.parentElement) banner.remove();
            }, 400);
        }, 6500);
    }

    export function showKaelDepartureBanner() {
        if (typeof closeAtlasDialogue === 'function') closeAtlasDialogue();
        if (typeof closeAtlasMarket === 'function') closeAtlasMarket();

        let container = document.getElementById('kael-banner-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'kael-banner-container';
            document.body.appendChild(container);
        }

        const banner = document.createElement('div');
        banner.className = 'kael-arrival-banner';

        const iconFrame = document.createElement('div');
        iconFrame.className = 'kael-relic-frame';
        iconFrame.innerHTML = `
            <svg viewBox="0 0 24 24" width="28" height="28" style="image-rendering: pixelated; shape-rendering: crispEdges;">
                <rect x="4" y="2" width="16" height="20" fill="#1e1035"/>
                <rect x="7" y="6" width="10" height="12" fill="#311042"/>
                <rect x="10" y="9" width="4" height="6" fill="#6b21a8"/>
                <rect x="11" y="11" width="2" height="2" fill="#38bdf8"/>
            </svg>
        `;
        banner.appendChild(iconFrame);

        const content = document.createElement('div');
        content.className = 'flex flex-col min-w-0';

        const header = document.createElement('span');
        header.className = "kael-banner-header text-amber-400 font-bold font-['VT323'] tracking-widest leading-none drop-shadow-[2px_2px_0_#000] uppercase";
        header.style.color = '#fbbf24';
        header.innerText = 'PLANAR RIFT COLLAPSED';
        content.appendChild(header);

        const title = document.createElement('span');
        title.className = "kael-banner-title text-2xl sm:text-3xl text-white font-bold font-['VT323'] drop-shadow-[2px_2px_0_#000] truncate leading-tight";
        title.style.color = '#ffffff';
        title.innerText = 'Kael has departed through the void.';
        content.appendChild(title);

        const subtitle = document.createElement('span');
        subtitle.className = "kael-banner-subtitle text-sm sm:text-base text-white font-['VT323'] drop-shadow-[1px_1px_0_#000] leading-none mt-0.5";
        subtitle.style.color = '#ffffff';
        subtitle.innerText = 'The cosmic traveler will return on another day.';
        content.appendChild(subtitle);

        banner.appendChild(content);
        container.appendChild(banner);

        if (typeof playSound === 'function') {
            playSound('portal_warp', { vol: 0.7 });
        }

        setTimeout(() => {
            banner.classList.add('dismissing');
            setTimeout(() => {
                if (banner.parentElement) banner.remove();
            }, 400);
        }, 5000);
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

    export let selectedAchStatusFilter = 'all'; // 'all', 'unlocked', 'locked'
    export let achSearchTerm = '';
    export let selectedAchSort = 'tier'; // 'tier', 'recent', 'alpha', 'reward'
    export let pinnedAchievementId = (typeof localStorage !== 'undefined') ? localStorage.getItem('webcraft_pinned_ach') : null;

    export function filterAchievementsByStatus(status) {
        selectedAchStatusFilter = status;
        document.querySelectorAll('.ach-status-btn, .ach-segment-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.status === status);
        });
        renderAchievementsList();
    }

    export function setAchievementSearchTerm(term) {
        achSearchTerm = (term || '').trim().toLowerCase();
        renderAchievementsList();
    }

    export function setAchievementSort(sortType) {
        selectedAchSort = sortType;
        document.querySelectorAll('.ach-sort-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sort === sortType);
        });
        renderAchievementsList();
    }

    export function resetAchFilters() {
        selectedAchDifficultyFilter = 'all';
        selectedAchStatusFilter = 'all';
        achSearchTerm = '';
        selectedAchSort = 'tier';
        const searchInput = document.getElementById('ach-search-input');
        if (searchInput) searchInput.value = '';
        document.querySelectorAll('.ach-tier-tab, .ach-filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.diff === 'all'));
        document.querySelectorAll('.ach-segment-btn, .ach-status-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.status === 'all'));
        document.querySelectorAll('.ach-sort-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.sort === 'tier'));
        renderAchievementsList();
    }

    export function togglePinAchievement(achId) {
        if (pinnedAchievementId === achId) {
            pinnedAchievementId = null;
            try { localStorage.removeItem('webcraft_pinned_ach'); } catch(e) {}
            showToast('Achievement unpinned from HUD');
        } else {
            pinnedAchievementId = achId;
            try { localStorage.setItem('webcraft_pinned_ach', achId); } catch(e) {}
            const ach = ACHIEVEMENTS.find(a => a.id === achId);
            showToast(`Pinned active goal: ${ach ? ach.title : 'Achievement'}`);
        }
        try { playSound('pop'); } catch(e) {}
        renderAchievementsList();
        renderPinnedAchievementHUD();
    }

    export function renderPinnedAchievementHUD() {
        const el = document.getElementById('hud-pinned-achievement');
        if (!el) return;
        const curState = (typeof window !== 'undefined' && window.STATE) ? window.STATE : (typeof STATE !== 'undefined' ? STATE : 'MENU');
        if (!pinnedAchievementId || (curState !== 'PLAYING' && curState !== 'PAUSED')) {
            el.classList.add('hidden');
            el.style.display = 'none';
            return;
        }
        const ach = ACHIEVEMENTS.find(a => a.id === pinnedAchievementId);
        if (!ach) {
            el.classList.add('hidden');
            el.style.display = 'none';
            return;
        }
        const mode = (typeof isMultiplayer !== 'undefined' && isMultiplayer) ? 'mp' : 'sp';
        const data = getAchievementsStorage(mode);
        const isUnlocked = !!data[ach.id];

        el.classList.remove('hidden');
        el.style.display = 'flex';

        let progText = '';
        if (ach.id === 'master_crafter') progText = ` (${Math.min(20, (typeof craftedItemsCount !== 'undefined' ? craftedItemsCount : 0))}/20)`;
        else if (ach.id === 'subterranean_miner') progText = ` (${Math.min(50, (typeof deepBlocksMinedCount !== 'undefined' ? deepBlocksMinedCount : 0))}/50)`;
        else if (ach.id === 'sniper_duel') progText = ` (${Math.min(5, (typeof monstersKilledCount !== 'undefined' ? monstersKilledCount : 0))}/5)`;
        else if (ach.id === 'apex_predator') progText = ` (${Math.min(15, (typeof monstersKilledCount !== 'undefined' ? monstersKilledCount : 0))}/15)`;
        else if (ach.id === 'monster_slayer_50') progText = ` (${Math.min(50, (typeof monstersKilledCount !== 'undefined' ? monstersKilledCount : 0))}/50)`;
        else if (ach.id === 'immortal_legend') {
            const curDay = (typeof window !== 'undefined' && window.dayCount !== undefined) ? window.dayCount : (typeof dayCount !== 'undefined' ? dayCount : 0);
            progText = ` (${Math.min(10, curDay)}/10 Days)`;
        }

        const iconTex = (typeof textures !== 'undefined' && textures[ach.iconItem]) ? textures[ach.iconItem].src : '';

        el.innerHTML = `
            <div class="hud-pin-icon-box">
                ${iconTex ? `<img src="${iconTex}" class="w-5 h-5 pixelated object-contain" alt="" />` : getPixelTrophySvg(16)}
            </div>
            <div class="hud-pin-info">
                <div class="hud-pin-title flex items-center gap-1">${isUnlocked ? getPixelCheckSvg(12) : getPixelPinSvg(12)}<span>${ach.title}${progText}</span></div>
                <div class="hud-pin-desc">${ach.description}</div>
            </div>
            <button type="button" class="hud-pin-close" onclick="if(typeof togglePinAchievement==='function')togglePinAchievement('${ach.id}')" title="Unpin Goal">${getPixelCloseSvg(10)}</button>
        `;
        if (isUnlocked) {
            el.classList.add('completed');
        } else {
            el.classList.remove('completed');
        }
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

        // Update overall visual XP progress bar
        const progressBarFill = document.getElementById('ach-progress-bar-fill');
        if (progressBarFill) {
            progressBarFill.style.width = `${percent}%`;
        }

        // Tier Breakdown Counters & Emerald tracking
        let easyTotal = 0, easyUnlocked = 0;
        let medTotal = 0, medUnlocked = 0;
        let hardTotal = 0, hardUnlocked = 0;
        let masterTotal = 0, masterUnlocked = 0;
        let totalClaimableEmeralds = 0, totalEarnedEmeralds = 0;

        const claimed = getClaimedAchievementRewards();

        ACHIEVEMENTS.forEach(ach => {
            const isU = !!activeData[ach.id];
            const rAmt = getAchievementEmeraldReward(ach);
            totalClaimableEmeralds += rAmt;
            if (claimed.includes(ach.id)) {
                totalEarnedEmeralds += rAmt;
            }

            if (ach.difficulty === 'Easy') {
                easyTotal++;
                if (isU) easyUnlocked++;
            } else if (ach.difficulty === 'Medium') {
                medTotal++;
                if (isU) medUnlocked++;
            } else if (ach.difficulty === 'Hard') {
                hardTotal++;
                if (isU) hardUnlocked++;
            } else if (ach.difficulty === 'Master') {
                masterTotal++;
                if (isU) masterUnlocked++;
            }
        });

        const badgeAll = document.getElementById('ach-tier-all-count');
        const badgeEasy = document.getElementById('ach-tier-easy-count');
        const badgeMed = document.getElementById('ach-tier-med-count');
        const badgeHard = document.getElementById('ach-tier-hard-count');
        const badgeMaster = document.getElementById('ach-tier-master-count');
        if (badgeAll) badgeAll.innerText = `${activeCount}/${total}`;
        if (badgeEasy) badgeEasy.innerText = `${easyUnlocked}/${easyTotal}`;
        if (badgeMed) badgeMed.innerText = `${medUnlocked}/${medTotal}`;
        if (badgeHard) badgeHard.innerText = `${hardUnlocked}/${hardTotal}`;
        if (badgeMaster) badgeMaster.innerText = `${masterUnlocked}/${masterTotal}`;

        const emeraldsLabel = document.getElementById('ach-emeralds-earned-label');
        if (emeraldsLabel) {
            emeraldsLabel.innerHTML = `${getPixelEmeraldSvg(14)} <span class="text-white font-bold">${totalEarnedEmeralds}</span> / ${totalClaimableEmeralds} Claimed`;
        }

        const statusAllCount = document.getElementById('ach-status-all-count');
        const statusUnlockedCount = document.getElementById('ach-status-unlocked-count');
        const statusLockedCount = document.getElementById('ach-status-locked-count');
        if (statusAllCount) statusAllCount.innerText = total;
        if (statusUnlockedCount) statusUnlockedCount.innerText = activeCount;
        if (statusLockedCount) statusLockedCount.innerText = total - activeCount;

        // Filtering
        let filteredList = ACHIEVEMENTS.filter(ach => {
            if (selectedAchDifficultyFilter !== 'all' && ach.difficulty !== selectedAchDifficultyFilter) {
                return false;
            }
            const isU = !!activeData[ach.id];
            if (selectedAchStatusFilter === 'unlocked' && !isU) return false;
            if (selectedAchStatusFilter === 'locked' && isU) return false;

            if (achSearchTerm) {
                const matchTitle = ach.title.toLowerCase().includes(achSearchTerm);
                const matchDesc = ach.description.toLowerCase().includes(achSearchTerm);
                const matchBadge = (ach.badge || ach.difficulty).toLowerCase().includes(achSearchTerm);
                if (!matchTitle && !matchDesc && !matchBadge) return false;
            }
            return true;
        });

        // Sorting
        const DIFFICULTY_ORDER = { 'Easy': 1, 'Medium': 2, 'Hard': 3, 'Master': 4 };
        if (selectedAchSort === 'recent') {
            filteredList.sort((a, b) => {
                const timeA = activeData[a.id] || 0;
                const timeB = activeData[b.id] || 0;
                if (timeA && !timeB) return -1;
                if (!timeA && timeB) return 1;
                if (timeA && timeB) return timeB - timeA;
                return (DIFFICULTY_ORDER[a.difficulty] || 99) - (DIFFICULTY_ORDER[b.difficulty] || 99);
            });
        } else if (selectedAchSort === 'alpha') {
            filteredList.sort((a, b) => a.title.localeCompare(b.title));
        } else if (selectedAchSort === 'reward') {
            filteredList.sort((a, b) => getAchievementEmeraldReward(b) - getAchievementEmeraldReward(a));
        } else {
            // Default: tier order
            filteredList.sort((a, b) => {
                const orderA = DIFFICULTY_ORDER[a.difficulty] || 99;
                const orderB = DIFFICULTY_ORDER[b.difficulty] || 99;
                return orderA - orderB;
            });
        }

        const visibleCountEl = document.getElementById('ach-visible-count');
        if (visibleCountEl) {
            visibleCountEl.innerText = `${filteredList.length} of ${total}`;
        }

        if (filteredList.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'ach-empty-state';
            emptyEl.innerHTML = `
                <div class="ach-empty-icon mb-2">${getPixelSearchSvg(36)}</div>
                <div class="text-2xl text-gray-200 font-bold font-['VT323']">No Milestones Found</div>
                <div class="text-base text-gray-400 font-['VT323'] mt-1">No achievements match your active search terms or category filters.</div>
                <button type="button" class="mc-btn btn-secondary !w-auto !px-5 !py-1.5 !text-xl !mt-3" onclick="if(typeof resetAchFilters==='function')resetAchFilters()">Reset Filters</button>
            `;
            list.appendChild(emptyEl);
            return;
        }

        const frag = document.createDocumentFragment();

        filteredList.forEach(ach => {
            const unlockedAt = activeData[ach.id];
            const isUnlocked = !!unlockedAt;
            const rewardAmt = getAchievementEmeraldReward(ach);
            const isClaimed = claimed.includes(ach.id);
            const isPinned = pinnedAchievementId === ach.id;

            const card = document.createElement('div');
            card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'} ${isPinned ? 'pinned' : ''}`;

            const iconFrame = document.createElement('div');
            iconFrame.className = 'achievement-icon-frame';
            if (textures[ach.iconItem]) {
                const img = document.createElement('img');
                img.src = textures[ach.iconItem].src;
                img.className = 'w-8 h-8 pixelated object-contain';
                img.alt = ach.title;
                iconFrame.appendChild(img);
            } else {
                iconFrame.innerHTML = getPixelTrophySvg(24);
            }
            card.appendChild(iconFrame);

            const info = document.createElement('div');
            info.className = 'flex-1 min-w-0';

            const titleRow = document.createElement('div');
            titleRow.className = 'flex items-center justify-between gap-2';

            const title = document.createElement('span');
            title.className = `text-2xl font-bold font-['VT323'] truncate ${isUnlocked ? 'text-[var(--mc-accent-color)]' : 'text-[#cbd5e1]'}`;
            title.innerText = ach.title;
            titleRow.appendChild(title);

            const badgeGroup = document.createElement('div');
            badgeGroup.className = 'flex items-center gap-1.5 flex-shrink-0';

            // Pin / Track Goal button
            const pinBtn = document.createElement('button');
            pinBtn.type = 'button';
            pinBtn.className = `mc-card-btn ach-pin-btn ${isPinned ? 'active' : ''}`;
            pinBtn.title = isPinned ? 'Unpin goal from in-game HUD' : 'Pin goal to in-game HUD';
            pinBtn.innerHTML = `${getPixelPinSvg(13)} <span>${isPinned ? 'Pinned' : 'Pin Goal'}</span>`;
            pinBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                togglePinAchievement(ach.id);
            });
            badgeGroup.appendChild(pinBtn);

            // Reward chip
            const emeraldBadge = document.createElement('span');
            emeraldBadge.className = 'ach-card-reward-badge';
            emeraldBadge.innerHTML = `${getPixelEmeraldSvg(13)} <span>+${rewardAmt}</span>`;
            badgeGroup.appendChild(emeraldBadge);

            // Tier badge with pixel icon
            const diffClass = ach.difficulty === 'Easy' ? 'tier-easy'
                : ach.difficulty === 'Medium' ? 'tier-medium'
                : ach.difficulty === 'Hard' ? 'tier-hard'
                : 'tier-master';

            const tierIconSvg = ach.difficulty === 'Easy' ? getPixelSproutSvg(13)
                : ach.difficulty === 'Medium' ? getPixelIngotSvg(13)
                : ach.difficulty === 'Hard' ? getPixelDiamondSvg(13)
                : getPixelCrownSvg(13);

            const badgeTag = document.createElement('span');
            badgeTag.className = `ach-card-tier-badge ${diffClass}`;
            badgeTag.innerHTML = `${tierIconSvg} <span>${ach.badge || ach.difficulty}</span>`;
            badgeGroup.appendChild(badgeTag);

            titleRow.appendChild(badgeGroup);
            info.appendChild(titleRow);

            const desc = document.createElement('p');
            desc.className = 'ach-card-desc';
            desc.innerText = ach.description;
            info.appendChild(desc);

            // Multi-step progress bar if applicable
            let multiStepProg = null;
            if (!isUnlocked) {
                if (ach.id === 'master_crafter') {
                    multiStepProg = { current: Math.min(20, (typeof craftedItemsCount !== 'undefined' ? craftedItemsCount : 0)), target: 20, label: 'Items Crafted' };
                } else if (ach.id === 'subterranean_miner') {
                    multiStepProg = { current: Math.min(50, (typeof deepBlocksMinedCount !== 'undefined' ? deepBlocksMinedCount : 0)), target: 50, label: 'Cavern Blocks' };
                } else if (ach.id === 'sniper_duel') {
                    multiStepProg = { current: Math.min(5, (typeof monstersKilledCount !== 'undefined' ? monstersKilledCount : 0)), target: 5, label: 'Monsters Slain' };
                } else if (ach.id === 'apex_predator') {
                    multiStepProg = { current: Math.min(15, (typeof monstersKilledCount !== 'undefined' ? monstersKilledCount : 0)), target: 15, label: 'Monsters Slain' };
                } else if (ach.id === 'monster_slayer_50') {
                    multiStepProg = { current: Math.min(50, (typeof monstersKilledCount !== 'undefined' ? monstersKilledCount : 0)), target: 50, label: 'Monsters Slain' };
                } else if (ach.id === 'immortal_legend') {
                    const curDay = (typeof window !== 'undefined' && window.dayCount !== undefined) ? window.dayCount : (typeof dayCount !== 'undefined' ? dayCount : 0);
                    multiStepProg = { current: Math.min(10, curDay), target: 10, label: 'Days Survived' };
                } else if (ach.id === 'completionist') {
                    multiStepProg = { current: Math.min(25, activeCount), target: 25, label: 'Milestones' };
                } else if (ach.id === 'grand_archon') {
                    multiStepProg = { current: Math.min(45, activeCount), target: 45, label: 'Milestones' };
                }
            }

            if (multiStepProg) {
                const progPct = Math.round((multiStepProg.current / multiStepProg.target) * 100);
                const progRow = document.createElement('div');
                progRow.className = 'ach-card-progress mt-1.5';
                progRow.innerHTML = `
                    <div class="flex justify-between items-center text-xs font-['VT323'] text-gray-400 mb-0.5">
                        <span>Progress: ${multiStepProg.label}</span>
                        <span class="text-amber-300 font-bold">${multiStepProg.current} / ${multiStepProg.target} (${progPct}%)</span>
                    </div>
                    <div class="ach-card-progress-bar">
                        <div class="ach-card-progress-fill" style="width: ${progPct}%;"></div>
                    </div>
                `;
                info.appendChild(progRow);
            }

            const statusRow = document.createElement('div');
            statusRow.className = 'ach-card-status mt-1';
            if (isUnlocked) {
                statusRow.innerHTML = `<span class="ach-status-unlocked-tag">${getPixelCheckSvg(13)} <span>Unlocked:</span></span> <span class="text-[#cbd5e1]">${formatAchievementDate(unlockedAt)}</span> ${isClaimed ? `<span class="ach-claimed-badge font-['VT323'] text-sm inline-flex items-center gap-1">[+${rewardAmt} ${getPixelEmeraldSvg(12)} Claimed]</span>` : ''}`;
            } else {
                const guestNotice = isGuest ? ` <span class="text-amber-400 font-bold ml-1">(Guest - Log in to earn)</span>` : '';
                statusRow.innerHTML = `<span class="ach-status-locked-tag">${getPixelPadlockSvg(12)} <span>Locked</span></span> <span class="text-[#64748b]">(${currentAchievementsTab === 'mp' ? 'Multiplayer' : 'Singleplayer'})</span>${guestNotice}`;
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

    export function updateTutorialUI() {}

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
        return [
            IDS.WOOD_PICKAXE, IDS.STONE_PICKAXE, IDS.IRON_PICKAXE, IDS.GOLD_PICKAXE, IDS.DIAMOND_PICKAXE,
            IDS.WOOD_SWORD, IDS.STONE_SWORD, IDS.IRON_SWORD, IDS.GOLD_SWORD, IDS.DIAMOND_SWORD,
            IDS.WOOD_AXE, IDS.STONE_AXE, IDS.IRON_AXE, IDS.GOLD_AXE, IDS.DIAMOND_AXE,
            IDS.WOOD_SHOVEL, IDS.STONE_SHOVEL, IDS.IRON_SHOVEL, IDS.GOLD_SHOVEL, IDS.DIAMOND_SHOVEL,
            IDS.WOOD_HOE, IDS.STONE_HOE, IDS.IRON_HOE, IDS.GOLD_HOE, IDS.DIAMOND_HOE
        ].includes(id);
    }

    export function isVinyl(id) {
        return id === IDS.EMPTY_VINYL || (typeof IDS.VINYL_DISC !== 'undefined' && id === IDS.VINYL_DISC);
    }

    export function isNonStackable(id) {
        if (!id) return false;
        if (isTool(id)) return true;
        if (typeof isArmor === 'function' && isArmor(id)) return true;
        if (isVinyl(id)) return true;
        return false;
    }

    export function getItemMaxStack(id) {
        return isNonStackable(id) ? 1 : 64;
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

    export function setUIInventory(newInv) {
        inventory = newInv;
        if (typeof window !== 'undefined') window.inventory = newInv;
    }
    try { if (typeof window !== 'undefined') window.setUIInventory = setUIInventory; } catch(e) {}

    export function damageSelectedTool(amount = 1) {
        const liveInv = (typeof window !== 'undefined' && Array.isArray(window.inventory)) ? window.inventory : inventory;
        const curIdx = (typeof window !== 'undefined' && window.selectedHotbarIndex !== undefined) ? window.selectedHotbarIndex : selectedHotbarIndex;
        const item = liveInv[curIdx];
        if (!item || !TOOL_DURABILITY[item.id]) return;
        ensureToolDurability(item);
        item.durability -= amount;
        if (item.durability <= 0) {
            liveInv[curIdx] = null;
            showToast('Your tool broke!');
        }
        updateUI();
    }

    export function giveItem(id, amount = 1) {
        const liveInv = (typeof window !== 'undefined' && Array.isArray(window.inventory)) ? window.inventory : inventory;
        let initialAmount = amount;
        const maxStack = getItemMaxStack(id);
        if (maxStack > 1) {
            for (let i = 0; i < 27; i++) { 
                if (liveInv[i] && liveInv[i].id === id && liveInv[i].count < maxStack) {
                    let space = maxStack - liveInv[i].count;
                    let add = Math.min(space, amount);
                    liveInv[i].count += add; amount -= add;
                    if (amount <= 0) break;
                }
            }
        }
        if (amount > 0) {
            for (let i = 0; i < 27; i++) { 
                if (!liveInv[i]) {
                    let add = Math.min(maxStack, amount);
                    liveInv[i] = { id: id, count: add };
                    ensureToolDurability(liveInv[i]);
                    amount -= add;
                    if (amount <= 0) break;
                }
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
            else if (id === IDS.COOKED_PORKCHOP || id === IDS.COOKED_CHICKEN || id === IDS.COOKED_MUTTON || id === IDS.COOKED_BEEF) unlockAchievement('delicious_fish');
            else if (id === IDS.GOLD_INGOT) unlockAchievement('shiny_bling');
            else if (id === IDS.WHEAT) unlockAchievement('bumper_crop');
            else if (id === IDS.BREAD) unlockAchievement('bake_bread');
        }
        if(STATE==='PLAYING' && !isInventoryOpen) updateUI();
        return amount === 0; 
    }

    export function canFitItem(id, amount) {
        const liveInv = (typeof window !== 'undefined' && Array.isArray(window.inventory)) ? window.inventory : inventory;
        let capacity = 0;
        const maxStack = getItemMaxStack(id);
        for (let i = 0; i < 27; i++) {
            if (liveInv[i] && liveInv[i].id === id && maxStack > 1) capacity += Math.max(0, maxStack - liveInv[i].count);
            else if (!liveInv[i]) capacity += maxStack;
            if (capacity >= amount) return true;
        }
        return false;
    }

    export function getItemCount(id) {
        const liveInv = (typeof window !== 'undefined' && Array.isArray(window.inventory)) ? window.inventory : inventory;
        let count = 0;
        for (let i = 0; i < 27; i++) {
            if (liveInv[i] && liveInv[i].id === id) count += liveInv[i].count;
        }
        return count;
    }

    export function hasItem(id, amount) {
        return getItemCount(id) >= amount;
    }

    export function consumeItem(id, amount) {
        const liveInv = (typeof window !== 'undefined' && Array.isArray(window.inventory)) ? window.inventory : inventory;
        for (let i = 0; i < 27; i++) {
            if (liveInv[i] && liveInv[i].id === id) {
                if (liveInv[i].count >= amount) {
                    liveInv[i].count -= amount;
                    if (liveInv[i].count === 0) liveInv[i] = null;
                    return true;
                } else { amount -= liveInv[i].count; liveInv[i] = null; }
            }
        }
        return false;
    }

    export function getRecipeInputCount(input) {
        if (Array.isArray(input.ids)) {
            let total = 0;
            input.ids.forEach(id => {
                total += getItemCount(id);
            });
            return total;
        }
        return getItemCount(input.id);
    }

    export function hasRecipeInput(input) {
        return getRecipeInputCount(input) >= input.count;
    }

    export function consumeRecipeInput(input) {
        if (Array.isArray(input.ids)) {
            let remainingNeeded = input.count;
            const inv = (typeof window !== 'undefined' && window.inventory) ? window.inventory : inventory;
            for (let i = 0; i < inv.length; i++) {
                const item = inv[i];
                if (item && input.ids.includes(item.id)) {
                    if (item.count <= remainingNeeded) {
                        remainingNeeded -= item.count;
                        inv[i] = null;
                    } else {
                        item.count -= remainingNeeded;
                        remainingNeeded = 0;
                    }
                    if (remainingNeeded <= 0) break;
                }
            }
            if (typeof setEngineInventory === 'function') setEngineInventory(inv);
            if (typeof window !== 'undefined') window.inventory = inv;
            return remainingNeeded <= 0;
        }
        return consumeItem(input.id, input.count);
    }

    export function craftRecipe(recipeIndex) {
        const recipe = RECIPES[recipeIndex];
        let canCraft = recipe.inputs.every(req => hasRecipeInput(req));
        const outputFits = canFitItem(recipe.output.id, recipe.output.count);
        if (canCraft && !outputFits && isMultiplayer && !isMultiplayerAuthority() && pendingDropRequest) return;
        if (canCraft) {
            recipe.inputs.forEach(req => consumeRecipeInput(req));
            if (!outputFits) {
                dropItemForWorld(recipe.output.id, player.x + player.width / 2, player.y, recipe.output.count);
            } else {
                giveItem(recipe.output.id, recipe.output.count);
            }
            trackDailyQuestProgress('craft_item', { itemId: recipe.output.id, count: recipe.output.count });
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
            else if ([IDS.WOOD_HOE, IDS.STONE_HOE, IDS.IRON_HOE, IDS.GOLD_HOE, IDS.DIAMOND_HOE].includes(recipe.output.id)) unlockAchievement('time_to_cultivate');
            else if (recipe.output.id === IDS.BREAD) unlockAchievement('bake_bread');
            else if (recipe.output.id === IDS.ASTRAL_INFUSER) unlockAchievement('astral_infusion');
            else if (recipe.output.id === IDS.SIGN) unlockAchievement('notice_board');
            else if (recipe.output.id === IDS.DOOR || recipe.output.id === IDS.JUNGLE_DOOR) unlockAchievement('knock_knock');
            else if (recipe.output.id === IDS.EMPTY_VINYL) unlockAchievement('craft_vinyl');
            else if (recipe.output.id === IDS.PRISM_GLASS) unlockAchievement('prism_glass_art');
            else if (recipe.output.id === IDS.SHADOWFANG) unlockAchievement('forge_shadowfang');
            else if (recipe.output.id === IDS.GLOOM_LANTERN) unlockAchievement('gloom_lantern_placed');
            else if ([IDS.ASTRAL_SWORD, IDS.ASTRAL_AXE, IDS.ASTRAL_SHOVEL].includes(recipe.output.id)) unlockAchievement('stellar_arsenal');
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
        document.querySelectorAll('#diff-selector button').forEach(btn => {
            if (btn.dataset.diff === diffKey) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        const diffDescEl = document.getElementById('diff-desc');
        if (diffDescEl && diffDescriptions[diffKey]) {
            diffDescEl.innerText = diffDescriptions[diffKey];
        }
        const keepInventoryInput = document.getElementById('new-world-keep-inventory');
        const keepInventoryLabel = document.getElementById('new-world-keep-inventory-label');
        if (keepInventoryInput) keepInventoryInput.disabled = diffKey === 'hardcore';
        if (keepInventoryLabel) keepInventoryLabel.style.opacity = diffKey === 'hardcore' ? '0.55' : '1';
        if (diffKey === 'hardcore') {
            if (keepInventoryInput) keepInventoryInput.checked = false;
            updateToggleBtnState('btn-new-world-keep-inventory', false);
        }
        updateNewWorldAchievementWarning();
    }

    export let selectedGameModeChoice = 'survival';
    export let selectedStartingBiomeChoice = 'plains';
    export let selectedCreateWorldTab = 'general';

    export function switchCreateWorldTab(tabKey) {
        selectedCreateWorldTab = tabKey;
        document.querySelectorAll('#create-world-sidebar-tabs button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabKey);
        });
        const panels = ['general', 'world', 'gameplay', 'cheats'];
        panels.forEach(p => {
            const el = document.getElementById(`create-world-tab-${p}`);
            if (el) el.classList.toggle('hidden', p !== tabKey);
        });
    }

    export function selectGameMode(modeKey) {
        selectedGameModeChoice = modeKey === 'creative' ? 'creative' : 'survival';
        document.querySelectorAll('#game-mode-selector button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === selectedGameModeChoice);
        });
        const desc = document.getElementById('game-mode-desc');
        if (desc) {
            desc.innerText = selectedGameModeChoice === 'creative'
                ? 'Creative: Unlimited resources, free flying, instant block destruction, and immunity to all damage. Achievements disabled.'
                : 'Survival: Search for resources, craft tools, gain levels, manage health and hunger, and defend against hostile monsters.';
        }
        const previewMode = document.getElementById('new-world-preview-mode');
        if (previewMode) {
            previewMode.innerText = selectedGameModeChoice.toUpperCase();
            previewMode.className = selectedGameModeChoice === 'creative' ? 'text-blue-400 font-bold uppercase tracking-wider' : 'text-emerald-400 font-bold uppercase tracking-wider';
        }
        updateCreateWorldPreview();
        updateNewWorldAchievementWarning();
    }

    export function selectStartingBiome(biomeKey) {
        selectedStartingBiomeChoice = biomeKey;
        document.querySelectorAll('#biome-selector button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.biome === biomeKey);
        });
        const previewBiome = document.getElementById('new-world-preview-biome');
        if (previewBiome) {
            previewBiome.innerText = biomeKey.toUpperCase();
        }
        updateCreateWorldPreview();
    }

    export function randomizeWorldSeed() {
        const seedInput = document.getElementById('new-world-seed');
        const randomSeed = Math.floor(Math.random() * 900000000 + 100000000);
        if (seedInput) {
            seedInput.value = String(randomSeed);
        }
        updateCreateWorldPreview();
    }

    export function updateCreateWorldPreview() {
        const cv = document.getElementById('new-world-preview-canvas');
        if (!cv) return;
        const seedVal = document.getElementById('new-world-seed')?.value || document.getElementById('new-world-name')?.value || 12345;
        const sizeVal = selectedWorldSizeChoice || 'small';
        const biomeVal = selectedStartingBiomeChoice || 'plains';
        const modeVal = selectedGameModeChoice || 'survival';

        const generator = (typeof generateProceduralThumbnail === 'function')
            ? generateProceduralThumbnail
            : ((typeof WorldThumbnails !== 'undefined' && WorldThumbnails.generateProceduralThumbnail) ? WorldThumbnails.generateProceduralThumbnail : null);

        if (generator) {
            const thumbUrl = generator({
                seed: seedVal,
                biome: biomeVal,
                worldSize: sizeVal,
                mode: modeVal,
                includePill: false
            });
            const img = new Image();
            img.onload = () => {
                const ctx = cv.getContext('2d');
                if (ctx) {
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(img, 0, 0, cv.width, cv.height);
                }
            };
            img.src = thumbUrl;
        }
    }

    export function toggleNewWorldOption(optKey) {
        const map = {
            starterItems: { chk: 'new-world-starter-items', btn: 'btn-new-world-starter-items' },
            keepInventory: { chk: 'new-world-keep-inventory', btn: 'btn-new-world-keep-inventory' },
            dayCycle: { chk: 'new-world-day-cycle', btn: 'btn-new-world-day-cycle' },
            mobSpawning: { chk: 'new-world-mob-spawning', btn: 'btn-new-world-mob-spawning' },
            hungerDepletion: { chk: 'new-world-hunger-depletion', btn: 'btn-new-world-hunger-depletion' },
            allowCheats: { chk: 'new-world-allow-cheats', btn: 'btn-new-world-allow-cheats' },
            bonusChest: { chk: 'new-world-bonus-chest', btn: 'btn-new-world-bonus-chest' },
            naturalRegen: { chk: 'new-world-natural-regen', btn: 'btn-new-world-natural-regen' }
        };
        if (optKey === 'keepInventory' && selectedDiffChoice === 'hardcore') return;
        const entry = map[optKey];
        if (entry) {
            const checkbox = document.getElementById(entry.chk);
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                updateToggleBtnState(entry.btn, checkbox.checked);
            }
        }
        updateNewWorldAchievementWarning();
    }

    export function selectWorldSize(size) {
        selectedWorldSizeChoice = (size === 'big') ? 'big' : ((size === 'flat') ? 'flat' : 'small');
        if (typeof window !== 'undefined') {
            window.selectedWorldSizeChoice = selectedWorldSizeChoice;
        }
        document.querySelectorAll('#world-size-selector button').forEach(btn => {
            if (btn.dataset.size === selectedWorldSizeChoice) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        updateCreateWorldPreview();
    }

    export function openWhatsNewOnce() {
        if (whatsNewShownThisLoad || !whatsNewStartupEnabled) return;
        whatsNewShownThisLoad = true;
        openWhatsNew();
    }

    export function updateWhatsNewStartupToggle() {
        const toggleButton = document.getElementById('whats-new-startup-toggle');
        if (!toggleButton) return;
        updateToggleBtnState(toggleButton, whatsNewStartupEnabled, 'Startup: ON', 'Startup: OFF');
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

        entriesRoot.innerHTML = '';

        if (!Array.isArray(UPDATE_HISTORY_LOGS) || UPDATE_HISTORY_LOGS.length === 0) {
            if (typeof LATEST_PATCH_NOTES !== 'undefined' && LATEST_PATCH_NOTES) {
                const latestArticle = document.createElement('article');
                latestArticle.className = 'news-entry is-newest';
                latestArticle.innerHTML = `
                    <div class="news-entry-header">
                        <h3>${LATEST_PATCH_NOTES.title}</h3>
                        <span class="news-badge">NEW</span>
                    </div>
                    ${renderPatchNoteList(LATEST_PATCH_NOTES.items)}
                `;
                entriesRoot.appendChild(latestArticle);
            }
            return;
        }

        // 1. Beta 0.1.6 (Latest Release)
        const v016 = UPDATE_HISTORY_LOGS[0];
        if (v016) {
            const art016 = document.createElement('article');
            art016.className = 'news-entry is-newest';
            art016.innerHTML = `
                <div class="news-entry-header">
                    <h3 class="text-amber-400 font-bold text-2xl font-['VT323']">${v016.title}</h3>
                    <span class="news-badge" style="background: #16a34a; color: #fff;">0.1.6</span>
                </div>
                ${renderPatchNoteList(v016.items)}
            `;
            entriesRoot.appendChild(art016);
        }

        // 2. Beta 0.1.5
        const v015 = UPDATE_HISTORY_LOGS[1];
        if (v015) {
            const art015 = document.createElement('article');
            art015.className = 'news-entry';
            art015.style.borderColor = '#9333ea';
            art015.style.boxShadow = 'inset 0 0 0 1px #080a0c, 0 0 0 1px rgba(147, 51, 234, 0.45)';
            art015.innerHTML = `
                <div class="news-entry-header">
                    <h3 class="text-purple-300 font-bold text-2xl font-['VT323']">${v015.title}</h3>
                    <span class="news-badge" style="background: #9333ea; color: #fff;">0.1.5</span>
                </div>
                ${renderPatchNoteList(v015.items)}
            `;
            entriesRoot.appendChild(art015);
        }

        // 3. Beta 0.1.4 Patch 1
        const vPatch1 = UPDATE_HISTORY_LOGS[2];
        if (vPatch1) {
            const artPatch1 = document.createElement('article');
            artPatch1.className = 'news-entry';
            artPatch1.style.borderColor = '#0284c7';
            artPatch1.style.boxShadow = 'inset 0 0 0 1px #080a0c, 0 0 0 1px rgba(2, 132, 199, 0.45)';
            artPatch1.innerHTML = `
                <div class="news-entry-header">
                    <h3 class="text-sky-400 font-bold text-2xl font-['VT323']">${vPatch1.title}</h3>
                    <span class="news-badge">PATCH 1</span>
                </div>
                ${renderPatchNoteList(vPatch1.items)}
            `;
            entriesRoot.appendChild(artPatch1);
        }

        // 4. Older Versions (Beta 0.1.4, Beta 0.1.3) inside clean collapsible summaries
        for (let i = 3; i < UPDATE_HISTORY_LOGS.length; i++) {
            const entry = UPDATE_HISTORY_LOGS[i];
            if (!entry) continue;
            const details = document.createElement('details');
            details.className = 'news-entry patch-history';
            details.open = false;
            details.innerHTML = `
                <summary style="cursor: pointer; font-size: 22px; font-weight: bold; color: #94a3b8; font-family: 'VT323', monospace; padding: 4px 0;">
                    ${entry.title} (Click to expand)
                </summary>
                ${renderPatchNoteList(entry.items)}
            `;
            entriesRoot.appendChild(details);
        }
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
            if (currentUserProfile && !currentUserProfile.isGuest) {
                startPresenceHeartbeat(currentUserProfile.normalizedTag || currentUserProfile.tag);
            }
        }
    }

    export function updateMainMenuProfileBadge() {
        loadUserProfile();
        const nameEl = document.getElementById('profile-player-name');
        const tagEl = document.getElementById('profile-account-tag');
        const beaconIcon = document.getElementById('profile-beacon-icon');
        const activeName = currentUserProfile?.username || localStorage.getItem('swc_player_name') || 'Player';
        const isOnlineAccount = !!(currentUserProfile && !currentUserProfile.isGuest);
        
        if (nameEl) nameEl.innerText = activeName;
        if (tagEl) {
            if (isOnlineAccount) {
                tagEl.innerText = currentUserProfile?.tag || 'Online';
                tagEl.className = 'profile-tag-pill';
            } else {
                tagEl.innerText = 'Guest';
                tagEl.className = 'profile-tag-pill guest';
            }
        }

        if (beaconIcon) {
            beaconIcon.innerHTML = isOnlineAccount
                ? `<rect x="0" y="0" width="8" height="8" fill="#064e3b"/><rect x="1" y="1" width="6" height="6" fill="#10b981"/><rect x="2" y="2" width="2" height="2" fill="#a7f3d0"/>`
                : `<rect x="0" y="0" width="8" height="8" fill="#78350f"/><rect x="1" y="1" width="6" height="6" fill="#f59e0b"/><rect x="2" y="2" width="2" height="2" fill="#fef3c7"/>`;
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
        loadUserProfile();

        const credStage = document.getElementById('auth-stage-credentials');
        const recStage = document.getElementById('auth-stage-recommend');
        const welcomeStage = document.getElementById('auth-stage-welcome-back');

        if (credStage) credStage.classList.add('hidden');
        if (recStage) recStage.classList.add('hidden');
        if (welcomeStage) welcomeStage.classList.add('hidden');

        if (stage === 'credentials') {
            if (credStage) credStage.classList.remove('hidden');
            switchAuthTab(currentAuthTab || 'signup');
        } else if (stage === 'welcome-back') {
            if (welcomeStage) welcomeStage.classList.remove('hidden');
            const welcomeName = document.getElementById('welcome-back-player-name');
            if (welcomeName) welcomeName.innerText = currentUserProfile?.username || 'Player';
        } else {
            if (recStage) recStage.classList.remove('hidden');
            const recName = document.getElementById('recommend-player-name');
            if (recName) recName.innerText = currentUserProfile?.username || 'Player';

            const isGuest = !currentUserProfile || currentUserProfile.isGuest;
            const recTitle = document.getElementById('recommend-main-title');
            const recSubtitle = document.getElementById('recommend-subtitle');
            const statusTitle = document.getElementById('recommend-status-title');
            const statusDesc = document.getElementById('recommend-status-desc');

            if (isGuest) {
                if (recTitle) recTitle.innerText = "Guest Session Active";
                if (recSubtitle) recSubtitle.innerHTML = `Playing <a href="https://github.com/raresh06/webcraft2d-game" target="_blank" rel="noopener noreferrer" class="game-github-link hover:underline" title="Visit Webcraft2D on GitHub">Webcraft</a> as <strong class="text-amber-300 font-bold">${currentUserProfile?.username || 'Guest'}</strong>`;
                if (statusTitle) {
                    statusTitle.innerText = "Guest Mode (No Rewards)";
                    statusTitle.className = "text-amber-400 font-['VT323'] text-2xl font-bold leading-tight";
                }
                if (statusDesc) {
                    statusDesc.innerHTML = `<span class="text-amber-300 font-bold">Achievements & Emerald rewards are locked.</span> Create or log in to a <a href="https://github.com/raresh06/webcraft2d-game" target="_blank" rel="noopener noreferrer" class="game-github-link underline font-bold" title="Visit Webcraft2D on GitHub">Webcraft</a> account anytime to unlock rewards and cloud saves!`;
                }
            } else {
                if (recTitle) recTitle.innerText = "Account Created!";
                if (recSubtitle) recSubtitle.innerHTML = `Welcome to the world of <a href="https://github.com/raresh06/webcraft2d-game" target="_blank" rel="noopener noreferrer" class="game-github-link text-amber-300 hover:underline font-bold" title="Visit Webcraft2D on GitHub">Webcraft</a>, <strong class="text-amber-300 font-bold">${currentUserProfile?.username || 'Player'}</strong>!`;
                if (statusTitle) {
                    statusTitle.innerHTML = `<a href="https://github.com/raresh06/webcraft2d-game" target="_blank" rel="noopener noreferrer" class="game-github-link hover:underline" title="Visit Webcraft2D on GitHub">Webcraft</a> Profile Active`;
                    statusTitle.className = "text-emerald-400 font-['VT323'] text-2xl font-bold leading-tight";
                }
                if (statusDesc) {
                    statusDesc.innerText = "Achievements & Emerald rewards are now enabled for this account!";
                }
            }
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
        compileSkinCanvas();
        if (typeof drawPlayerPreview === 'function') drawPlayerPreview(true);
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
        const grpTag = document.getElementById('auth-group-tag');
        const grpEmail = document.getElementById('auth-group-email');
        const grpPass = document.getElementById('auth-group-password');
        const submitBtn = document.getElementById('auth-submit-btn');
        const userInput = document.getElementById('auth-input-username');
        const tagInput = document.getElementById('auth-input-tag');
        const emailInput = document.getElementById('auth-input-email');
        const passInput = document.getElementById('auth-input-password');
        const feedback = document.getElementById('auth-feedback-msg');

        if (feedback) feedback.classList.add('hidden');

        if (tab === 'signup') {
            if (grpUser) grpUser.classList.remove('hidden');
            if (grpTag) grpTag.classList.remove('hidden');
            if (grpEmail) grpEmail.classList.remove('hidden');
            if (grpPass) grpPass.classList.remove('hidden');
            if (userInput) { userInput.required = true; userInput.placeholder = "e.g. SteveCraft"; }
            if (tagInput) { tagInput.required = true; tagInput.placeholder = "e.g. raresh06"; }
            if (emailInput) { emailInput.required = false; emailInput.placeholder = "player@example.com (optional)"; }
            if (passInput) passInput.required = true;
            if (submitBtn) submitBtn.innerText = "Create Profile & Sign Up";
        } else if (tab === 'login') {
            if (grpUser) grpUser.classList.add('hidden');
            if (grpTag) grpTag.classList.add('hidden');
            if (grpEmail) grpEmail.classList.remove('hidden');
            if (grpPass) grpPass.classList.remove('hidden');
            if (userInput) userInput.required = false;
            if (tagInput) tagInput.required = false;
            if (emailInput) { emailInput.required = true; emailInput.placeholder = "Email, @tag, or Character Name"; }
            if (passInput) passInput.required = true;
            if (submitBtn) submitBtn.innerText = "Log In to Webcraft";
        } else if (tab === 'guest') {
            if (grpUser) grpUser.classList.remove('hidden');
            if (grpTag) grpTag.classList.add('hidden');
            if (grpEmail) grpEmail.classList.add('hidden');
            if (grpPass) grpPass.classList.add('hidden');
            if (userInput) { userInput.required = false; userInput.placeholder = "Guest Name (optional)"; }
            if (tagInput) tagInput.required = false;
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
        const tagInput = document.getElementById('auth-input-tag');
        const emailInput = document.getElementById('auth-input-email');
        const passInput = document.getElementById('auth-input-password');

        const username = userInput ? userInput.value.trim() : '';
        const rawTag = tagInput ? tagInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const pass = passInput ? passInput.value : '';

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Connecting to Webcraft...';
        }

        try {
            if (currentAuthTab === 'signup') {
                if (!username || username.length < 2) throw new Error("Character name must be at least 2 characters.");
                if (!rawTag) throw new Error("Webcraft @tag is obligatory for creating an account.");
                const tagVal = validateWebcraftTag(rawTag);
                if (!tagVal.valid) throw new Error(tagVal.error);
                if (!pass || pass.length < 6) throw new Error("Password must be at least 6 characters.");

                const profile = await registerWebcraftAccount(username, rawTag, email, pass, playerSkinData);
                currentUserProfile = profile;
                showToast(`Profile created! Welcome, ${username} (${profile.tag})!`);
                openAuthProfileModal('recommend');
            } else if (currentAuthTab === 'login') {
                if (!email) throw new Error("Please enter your account email, @tag, or character name.");
                if (!pass) throw new Error("Please enter your password.");

                const profile = await loginWebcraftAccount(email, pass);
                currentUserProfile = profile;
                showToast(`Signed in as ${profile.username} (${profile.tag || 'Account'})!`);
                openAuthProfileModal('welcome-back');
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
            if (userMsg.includes('auth/invalid-credential') || userMsg.includes('auth/wrong-password') || userMsg.includes('auth/user-not-found')) userMsg = "Incorrect credentials or password. Please try again.";
            if (userMsg.includes('auth/weak-password')) userMsg = "Password should be at least 6 characters.";
            if (userMsg.includes('auth/invalid-email')) userMsg = "The email address is formatted incorrectly.";
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

    // =========================================================================
    // PROFILE DETAILS & FRIENDS SYSTEM CONTROLLER
    // =========================================================================

    export function openProfileDetailsModal() {
        loadUserProfile();
        const modal = document.getElementById('profile-details-modal');
        if (!modal) return;

        const isGuest = !currentUserProfile || currentUserProfile.isGuest;
        const nameEl = document.getElementById('profile-details-name');
        const badgeEl = document.getElementById('profile-details-type-badge');
        const tagEl = document.getElementById('profile-details-tag');
        const tagRow = document.getElementById('profile-details-tag-row');
        const emailEl = document.getElementById('profile-details-email');
        const createdEl = document.getElementById('profile-details-created');
        const emeraldsEl = document.getElementById('profile-details-emeralds');
        const skinStatusEl = document.getElementById('profile-details-skin-status');
        const achEl = document.getElementById('profile-details-achievements');
        const wifiStatusEl = document.getElementById('profile-wifi-status');
        const wifiPingEl = document.getElementById('profile-wifi-ping');
        const wifiIcon = document.getElementById('profile-wifi-icon');
        const authActionLabel = document.getElementById('profile-auth-action-label');
        const myTagDisplay = document.getElementById('friends-my-tag-display');
        const friendsTabWarning = document.getElementById('profile-tab-friends-warning');

        const activeName = currentUserProfile?.username || localStorage.getItem('swc_player_name') || 'Player';
        if (nameEl) nameEl.innerText = activeName;
        
        if (badgeEl) {
            badgeEl.innerText = isGuest ? 'GUEST' : 'ONLINE';
            badgeEl.className = isGuest ? 'profile-tag-pill guest text-xs' : 'profile-tag-pill text-xs';
        }

        // Webcraft Tag display
        if (isGuest) {
            if (tagRow) tagRow.classList.add('hidden');
            if (emailEl) emailEl.innerText = 'Guest Session (No Cloud Sync)';
        } else {
            if (tagRow) tagRow.classList.remove('hidden');
            const displayTag = currentUserProfile?.tag || (currentUserProfile?.normalizedTag ? `@${currentUserProfile.normalizedTag}` : '@player');
            if (tagEl) tagEl.innerText = displayTag;
            if (myTagDisplay) myTagDisplay.innerText = displayTag;
            if (emailEl) emailEl.innerText = currentUserProfile?.email || 'Cloud Webcraft Account';
        }

        if (isGuest) {
            if (friendsTabWarning) friendsTabWarning.classList.remove('hidden');
        } else {
            if (friendsTabWarning) friendsTabWarning.classList.add('hidden');
        }

        if (createdEl) {
            if (currentUserProfile?.createdAt) {
                const d = new Date(currentUserProfile.createdAt);
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                createdEl.innerText = `Crafter since: ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
                createdEl.innerText = `${months[d.getMonth()]} ${d.getFullYear()}`;
            } else {
                createdEl.innerText = isGuest ? 'Session Started: Today' : `Crafter since: Beta v${DISPLAY_VERSION}`;
                createdEl.innerText = isGuest ? 'Today' : `Beta v${DISPLAY_VERSION}`;
            }
        }

        const astralValEl = document.getElementById('profile-details-astral-val');
        if (astralValEl) {
            astralValEl.innerText = (typeof getPlayerAstralEmeralds === 'function' ? getPlayerAstralEmeralds() : 0).toLocaleString();
        }

        // Emeralds
        if (emeraldsEl) {
            emeraldsEl.innerText = (typeof getPlayerEmeralds === 'function') ? getPlayerEmeralds().toString() : '0';
        }

        // Achievements
        if (achEl) {
            if (isGuest) {
                achEl.innerText = 'Locked (Guest)';
                achEl.className = 'text-amber-400 font-bold text-xl font-[\'VT323\'] leading-none';
            } else {
                const spStorage = (typeof getAchievementsStorage === 'function') ? getAchievementsStorage('sp') : {};
                const unlockedCount = Object.keys(spStorage).length;
                achEl.innerText = `${unlockedCount} / ${ACHIEVEMENTS.length}`;
                achEl.className = 'text-amber-300 font-bold text-2xl font-[\'VT323\'] leading-none';
            }
        }

        // Skin Status & Name
        if (skinStatusEl) {
            const savedSkins = (typeof getSavedSkins === 'function') ? getSavedSkins() : [];
            const activeId = localStorage.getItem('swc_active_skin_v1') || currentUserProfile?.activeSkinId;
            const currentSkin = savedSkins.find(s => s.id === activeId);
            skinStatusEl.innerText = currentSkin ? currentSkin.name : (activeId === 'custom' ? 'Custom Skin' : 'Steve (Default)');
        }

        // Profile Customization Visuals (Banner, Frame, Crown, Title Badge, Name Color, Bio)
        // Profile Customization Visuals (Theme, Banner, Frame, Crown, Status, Title Badge, Name Color, Bio)
        const cust = getPlayerCustomization();
        const themeItem = getCosmeticItem(cust.cardTheme) || getCosmeticItem('theme_slate');
        const bannerItem = getCosmeticItem(cust.bannerPattern) || getCosmeticItem('banner_slate');
        const frameItem = getCosmeticItem(cust.avatarFrame) || getCosmeticItem('frame_classic');
        const titleItem = getCosmeticItem(cust.titlePlate) || getCosmeticItem('title_novice');

        // 1. Card Theme
        const cardEl = document.getElementById('profile-identity-card');
        if (cardEl) {
            cardEl.className = `discord-card-preview ${themeItem.themeClass} w-full relative mb-2.5 shadow-2xl select-none`;
        }

        // 2. Banner
        const bannerEl = document.getElementById('profile-overview-banner');
        if (bannerEl) {
            bannerEl.className = `w-full h-16 -mt-3 -mx-3 mb-2.5 ${bannerItem.bannerClass} relative overflow-hidden border-b-2 border-[#333e49]`;
            bannerEl.className = `discord-card-banner ${bannerItem.bannerClass} w-full relative`;
            bannerEl.style.backgroundColor = cust.bannerColor || bannerItem.color || '#181e24';
        }

        // 3. Avatar Frame & Crown & Status Dot
        const avatarFrameEl = document.getElementById('profile-overview-avatar-frame');
        if (avatarFrameEl) {
            avatarFrameEl.className = `profile-avatar-frame !w-20 !h-20 flex-shrink-0 ${frameItem.frameClass} bg-[#1e2732] p-1 relative`;
            avatarFrameEl.className = `avatar-frame-wrapper ${frameItem.frameClass} relative`;
        }

        const crownEl = document.getElementById('profile-details-crown-icon');
        if (crownEl) {
            crownEl.classList.toggle('hidden', frameItem.id !== 'frame_crown');
        }

        const statusDot = document.getElementById('profile-details-status-dot');
        if (statusDot) {
            statusDot.className = isGuest ? 'discord-avatar-status offline' : 'discord-avatar-status online';
            statusDot.title = isGuest ? 'Guest Session' : 'Online in Webcraft';
        }

        // 4. Draw Crisp Player Head on 60x60 Canvas
        const headCanvas = document.getElementById('profile-details-head-canvas');
        if (headCanvas && typeof drawPlayerHead === 'function') {
            const ctx = headCanvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, 60, 60);

            const skinCanvas = (typeof window !== 'undefined' && window.skinCanvasObj) ? window.skinCanvasObj : skinCanvasObj;
            if (skinCanvas) {
                drawPlayerHead(ctx, skinCanvas, 0, 0, 60);
            } else {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = 16;
                tempCanvas.height = 32;
                const tCtx = tempCanvas.getContext('2d');
                const imgData = tCtx.createImageData(16, 32);
                const activeSkin = (typeof getSkinSaveData === 'function' ? getSkinSaveData() : null) || (typeof playerSkinData !== 'undefined' ? playerSkinData : null);
                if (activeSkin) {
                    for (let i = 0; i < 16 * 32; i++) {
                        const c = activeSkin[i] || '#00000000';
                        const rgb = hexToRgb(c);
                        imgData.data[i * 4] = rgb.r;
                        imgData.data[i * 4 + 1] = rgb.g;
                        imgData.data[i * 4 + 2] = rgb.b;
                        imgData.data[i * 4 + 3] = (c === '#00000000' || !c) ? 0 : 255;
                    }
                    tCtx.putImageData(imgData, 0, 0);
                    drawPlayerHead(ctx, tempCanvas, 0, 0, 60);
                }
            }
        }

        // 5. Title Plate
        const titleBadgeEl = document.getElementById('profile-details-title-badge');
        if (titleBadgeEl) {
            if (titleItem.id !== 'title_novice') {
                titleBadgeEl.classList.remove('hidden');
                titleBadgeEl.className = 'profile-title-badge';
                titleBadgeEl.innerText = titleItem.prefixTag || titleItem.name;
                titleBadgeEl.style.borderColor = titleItem.nameColor;
                titleBadgeEl.style.color = titleItem.nameColor;
            } else {
                titleBadgeEl.classList.add('hidden');
            }
        }

        // 6. Name Color
        if (nameEl) {
            nameEl.style.color = cust.nameColor || titleItem.nameColor || '#ffffff';
        }

        // 7. Bio
        const bioDisplayEl = document.getElementById('profile-details-bio-display');
        if (bioDisplayEl) {
            if (cust.bio && cust.bio.trim()) {
                bioDisplayEl.classList.remove('hidden');
                bioDisplayEl.innerText = `"${cust.bio.trim()}"`;
            } else {
                bioDisplayEl.classList.add('hidden');
            }
            bioDisplayEl.innerText = (cust.bio && cust.bio.trim()) ? cust.bio.trim() : 'Mining across dimensions.';
        }

        // Upgrade or Sign out action button
        if (authActionLabel) {
            authActionLabel.innerText = isGuest ? 'Log In / Sign Up' : 'Sign Out';
        }

        // Default to Overview tab
        switchProfileTab('overview');

        updateMainMenuProfileBadge();
        updateConnectionTelemetryUI();

        // Start live real-time connection telemetry polling loop
        if (profilePingTimer) clearInterval(profilePingTimer);
        profilePingTimer = setInterval(() => {
            const modalEl = document.getElementById('profile-details-modal');
            if (!modalEl || modalEl.classList.contains('hidden')) {
                clearInterval(profilePingTimer);
                profilePingTimer = null;
                return;
            }
            updateConnectionTelemetryUI();
        }, 2000);

        modal.classList.remove('hidden');
    }

    export function switchProfileTab(tab = 'overview') {
        const tabOverviewBtn = document.getElementById('profile-tab-overview');
        const tabFriendsBtn = document.getElementById('profile-tab-friends');
        const viewOverview = document.getElementById('profile-view-overview');
        const viewFriends = document.getElementById('profile-view-friends');

        if (tab === 'overview') {
            if (tabOverviewBtn) tabOverviewBtn.classList.add('active');
            if (tabFriendsBtn) tabFriendsBtn.classList.remove('active');
            if (viewOverview) viewOverview.classList.remove('hidden');
            if (viewFriends) viewFriends.classList.add('hidden');
        } else if (tab === 'friends') {
            if (tabOverviewBtn) tabOverviewBtn.classList.remove('active');
            if (tabFriendsBtn) tabFriendsBtn.classList.add('active');
            if (viewOverview) viewOverview.classList.add('hidden');
            if (viewFriends) viewFriends.classList.remove('hidden');

            const isGuest = !currentUserProfile || currentUserProfile.isGuest;
            const guestBanner = document.getElementById('friends-guest-banner');
            const accountContent = document.getElementById('friends-account-content');
            const friendsTabWarning = document.getElementById('profile-tab-friends-warning');

            if (isGuest) {
                if (friendsTabWarning) friendsTabWarning.classList.remove('hidden');
                if (guestBanner) guestBanner.classList.remove('hidden');
                if (accountContent) accountContent.classList.add('hidden');
            } else {
                if (friendsTabWarning) friendsTabWarning.classList.add('hidden');
                if (guestBanner) guestBanner.classList.add('hidden');
                if (accountContent) accountContent.classList.remove('hidden');
                const myTagEl = document.getElementById('friends-my-tag-display');
                if (myTagEl) myTagEl.innerText = currentUserProfile.tag || `@${currentUserProfile.username}`;
                renderFriendsList();
            }
        }
    }

    function safeEscapeHtml(str) {
        if (!str) return '';
        return str.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    let friendsProfileUnsubscribe = null;

    export function renderFriendsListRows(friendProfiles) {
        const container = document.getElementById('friends-list-container');
        if (!container) return;
        container.innerHTML = '';

        if (!friendProfiles || friendProfiles.length === 0) {
            container.innerHTML = `
                <div class="text-gray-400 font-['VT323'] text-xl py-6 text-center">
                    No friends added yet.<br>
                    <span class="text-amber-400 text-base">Enter a player's Webcraft @tag above to send a request!</span>
                </div>
            `;
            return;
        }

        friendProfiles.forEach(friend => {
            const row = document.createElement('div');
            row.className = 'friend-card-row';
            row.title = `Click to view ${friend.tag}'s profile`;
            row.onclick = () => openFriendProfileModal(friend);

            const cust = friend.profileCustomization || getDefaultCustomization();
            const frameItem = getCosmeticItem(cust.avatarFrame) || getCosmeticItem('frame_classic');
            const titleItem = getCosmeticItem(cust.titlePlate) || getCosmeticItem('title_novice');
            const bannerItem = getCosmeticItem(cust.bannerPattern) || getCosmeticItem('banner_slate');
            const bannerAccentColor = cust.bannerColor || bannerItem.accentColor || '#4a5968';
            const nameColor = cust.nameColor || titleItem.nameColor || '#ffffff';

            // Left accent bar matching friend's custom banner
            const accentBar = document.createElement('div');
            accentBar.className = 'friend-accent-bar';
            accentBar.style.backgroundColor = bannerAccentColor;
            row.appendChild(accentBar);

            const leftDiv = document.createElement('div');
            leftDiv.className = 'flex items-center gap-2.5 min-w-0 flex-1 pl-1.5';

            // Avatar frame container
            const frameWrapper = document.createElement('div');
            frameWrapper.className = `avatar-frame-wrapper ${frameItem.frameClass} relative`;
            if (frameItem.id === 'frame_crown') {
                const crownEl = document.createElement('div');
                crownEl.className = 'avatar-crown-element';
                crownEl.innerHTML = `<svg class="pixel-crown-svg" width="24" height="18" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="1" y="10" width="14" height="2" fill="#080a0c"/><rect x="2" y="9" width="12" height="2" fill="#d97706"/><rect x="2" y="7" width="12" height="2" fill="#f59e0b"/><rect x="2" y="5" width="12" height="2" fill="#fbbf24"/><rect x="2" y="2" width="2" height="3" fill="#fbbf24"/><rect x="7" y="0" width="2" height="5" fill="#fbbf24"/><rect x="12" y="2" width="2" height="3" fill="#fbbf24"/><rect x="2" y="2" width="1" height="1" fill="#fef08a"/><rect x="7" y="0" width="1" height="1" fill="#fef08a"/><rect x="12" y="2" width="1" height="1" fill="#fef08a"/><rect x="4" y="7" width="2" height="2" fill="#ef4444"/><rect x="7" y="4" width="2" height="2" fill="#3b82f6"/><rect x="10" y="7" width="2" height="2" fill="#ef4444"/></svg>`;
                frameWrapper.appendChild(crownEl);
            }

            const canvas = document.createElement('canvas');
            canvas.className = 'friend-head-preview';
            canvas.width = 36;
            canvas.height = 36;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;

            if (friend.skinData && typeof drawPlayerHead === 'function') {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = 16;
                tempCanvas.height = 32;
                const tCtx = tempCanvas.getContext('2d');
                const imgData = tCtx.createImageData(16, 32);
                for (let i = 0; i < 16 * 32; i++) {
                    const c = friend.skinData[i] || '#00000000';
                    const rgb = hexToRgb(c);
                    imgData.data[i * 4] = rgb.r;
                    imgData.data[i * 4 + 1] = rgb.g;
                    imgData.data[i * 4 + 2] = rgb.b;
                    imgData.data[i * 4 + 3] = c === '#00000000' || !c ? 0 : 255;
                }
                tCtx.putImageData(imgData, 0, 0);
                drawPlayerHead(ctx, tempCanvas, 0, 0, 36);
            } else {
                // Default Steve head
                ctx.fillStyle = '#b4845c';
                ctx.fillRect(0, 0, 36, 36);
                ctx.fillStyle = '#4a3320';
                ctx.fillRect(0, 0, 36, 10);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(6, 14, 8, 5);
                ctx.fillRect(22, 14, 8, 5);
                ctx.fillStyle = '#2b3b82';
                ctx.fillRect(10, 14, 4, 5);
                ctx.fillRect(22, 14, 4, 5);
                ctx.fillStyle = '#6d4632';
                ctx.fillRect(12, 24, 12, 4);
            }

            frameWrapper.appendChild(canvas);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'min-w-0 text-left';
            infoDiv.innerHTML = `
                <div class="flex items-center gap-1.5 leading-tight truncate">
                    ${titleItem.id !== 'title_novice' ? `<span class="profile-title-badge !text-xs !py-0 !px-1" style="border-color:${titleItem.nameColor}; color:${titleItem.nameColor};">${safeEscapeHtml(titleItem.prefixTag || titleItem.name)}</span>` : ''}
                    <span class="font-['VT323'] text-xl font-bold truncate" style="color: ${nameColor};">${safeEscapeHtml(friend.username)}</span>
                </div>
                <div class="flex items-center gap-1.5 leading-none mt-0.5">
                    <span class="text-amber-400 font-['VT323'] text-base font-bold">${safeEscapeHtml(friend.tag)}</span>
                    <span class="text-gray-500 font-['VT323'] text-sm">•</span>
                    <span class="flex items-center text-xs font-['VT323'] ${friend.isOnline ? 'text-emerald-400' : 'text-gray-400'}">
                        <span class="friend-status-dot ${friend.isOnline ? 'online' : 'offline'}"></span>
                        ${friend.isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>
            `;

            leftDiv.appendChild(frameWrapper);
            leftDiv.appendChild(infoDiv);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'friend-btn-remove';
            removeBtn.title = `Remove ${friend.tag} from friends`;
            removeBtn.innerText = 'Remove';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                handleRemoveFriend(friend.tag);
            };

            row.appendChild(leftDiv);
            row.appendChild(removeBtn);
            container.appendChild(row);
        });
    }

    export async function renderFriendsList() {
        const container = document.getElementById('friends-list-container');
        const counter = document.getElementById('friends-list-counter');
        if (!container) return;

        const isGuest = !currentUserProfile || currentUserProfile.isGuest;
        if (isGuest) {
            container.innerHTML = `<div class="text-amber-300 font-['VT323'] text-lg py-3 text-center">Guest mode active. Log in to access friends.</div>`;
            return;
        }

        const friends = Array.isArray(currentUserProfile.friends) ? currentUserProfile.friends : [];
        if (counter) counter.innerText = `${friends.length} Friend${friends.length === 1 ? '' : 's'}`;
        // 1. Check and render incoming friend requests
        const requestsSection = document.getElementById('friend-requests-section');
        const requestsCounter = document.getElementById('friend-requests-counter');
        const requestsContainer = document.getElementById('friend-requests-container');

        if (requestsSection && requestsContainer) {
            try {
                const incoming = await fetchIncomingFriendRequests();
                if (incoming && incoming.length > 0) {
                    requestsSection.classList.remove('hidden');
                    if (requestsCounter) {
                        requestsCounter.innerText = `${incoming.length} Request${incoming.length === 1 ? '' : 's'}`;
                    }
                    requestsContainer.innerHTML = '';
                    incoming.forEach(req => {
                        const row = document.createElement('div');
                        row.className = 'friend-request-row';

                        const leftDiv = document.createElement('div');
                        leftDiv.className = 'flex items-center gap-2.5 min-w-0 flex-1';

                        const canvas = document.createElement('canvas');
                        canvas.className = 'friend-head-preview';
                        canvas.width = 36;
                        canvas.height = 36;
                        const ctx = canvas.getContext('2d');
                        ctx.imageSmoothingEnabled = false;

                        if (req.skinData && typeof drawPlayerHead === 'function') {
                            const tempCanvas = document.createElement('canvas');
                            tempCanvas.width = 16;
                            tempCanvas.height = 32;
                            const tCtx = tempCanvas.getContext('2d');
                            const imgData = tCtx.createImageData(16, 32);
                            for (let i = 0; i < 16 * 32; i++) {
                                const c = req.skinData[i] || '#00000000';
                                const rgb = hexToRgb(c);
                                imgData.data[i * 4] = rgb.r;
                                imgData.data[i * 4 + 1] = rgb.g;
                                imgData.data[i * 4 + 2] = rgb.b;
                                imgData.data[i * 4 + 3] = c === '#00000000' || !c ? 0 : 255;
                            }
                            tCtx.putImageData(imgData, 0, 0);
                            drawPlayerHead(ctx, tempCanvas, 0, 0, 36);
                        } else {
                            ctx.fillStyle = '#b4845c';
                            ctx.fillRect(0, 0, 36, 36);
                            ctx.fillStyle = '#4a3320';
                            ctx.fillRect(0, 0, 36, 10);
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(6, 14, 8, 5);
                            ctx.fillRect(22, 14, 8, 5);
                            ctx.fillStyle = '#2b3b82';
                            ctx.fillRect(10, 14, 4, 5);
                            ctx.fillRect(22, 14, 4, 5);
                            ctx.fillStyle = '#6d4632';
                            ctx.fillRect(12, 24, 12, 4);
                        }

                        const infoDiv = document.createElement('div');
                        infoDiv.className = 'min-w-0 text-left';
                        infoDiv.innerHTML = `
                            <div class="text-white font-['VT323'] text-xl font-bold leading-tight truncate">${safeEscapeHtml(req.username)}</div>
                            <div class="text-amber-400 font-['VT323'] text-base font-bold leading-none mt-0.5">${safeEscapeHtml(req.tag)}</div>
                        `;

                        leftDiv.appendChild(canvas);
                        leftDiv.appendChild(infoDiv);

                        const actionsDiv = document.createElement('div');
                        actionsDiv.className = 'flex items-center gap-1.5 flex-shrink-0';

                        const acceptBtn = document.createElement('button');
                        acceptBtn.type = 'button';
                        acceptBtn.className = 'friend-btn-accept';
                        acceptBtn.title = `Accept friend request from ${req.tag}`;
                        acceptBtn.innerText = 'Accept';
                        acceptBtn.onclick = () => handleAcceptFriendRequest(req.tag);

                        const declineBtn = document.createElement('button');
                        declineBtn.type = 'button';
                        declineBtn.className = 'friend-btn-decline';
                        declineBtn.title = `Decline friend request from ${req.tag}`;
                        declineBtn.innerText = 'Decline';
                        declineBtn.onclick = () => handleDeclineFriendRequest(req.tag);

                        actionsDiv.appendChild(acceptBtn);
                        actionsDiv.appendChild(declineBtn);

                        row.appendChild(leftDiv);
                        row.appendChild(actionsDiv);
                        requestsContainer.appendChild(row);
                    });
                } else {
                    requestsSection.classList.add('hidden');
                }
            } catch (e) {
                console.warn("Could not load friend requests", e);
                requestsSection.classList.add('hidden');
            }
        }

        if (friends.length === 0) {
            container.innerHTML = `
                <div class="text-gray-400 font-['VT323'] text-xl py-6 text-center">
                    No friends added yet.<br>
                    <span class="text-amber-400 text-base">Enter a player's Webcraft @tag above to send a request!</span>
                </div>
            `;
            return;
        }

        container.innerHTML = `<div class="text-gray-400 font-['VT323'] text-lg py-4 text-center">Checking friends presence...</div>`;

        try {
            const friendProfiles = await fetchFriendsProfiles(friends);
            renderFriendsListRows(friendProfiles);

            // Establish real-time Firestore listener for live updates!
            if (typeof listenToFriendsProfiles === 'function' && !friendsProfileUnsubscribe && friends.length > 0) {
                let currentFriendsList = [...friendProfiles];
                friendsProfileUnsubscribe = listenToFriendsProfiles(friends, (singleUpdated, allUpdated) => {
                    const viewFriends = document.getElementById('profile-view-friends');
                    if (viewFriends && !viewFriends.classList.contains('hidden')) {
                        if (Array.isArray(allUpdated) && allUpdated.length > 0) {
                            allUpdated.forEach(u => {
                                const idx = currentFriendsList.findIndex(f => normalizeWebcraftTag(f.tag) === normalizeWebcraftTag(u.tag));
                                if (idx >= 0) currentFriendsList[idx] = { ...currentFriendsList[idx], ...u };
                                else currentFriendsList.push(u);
                            });
                        } else if (singleUpdated && singleUpdated.tag) {
                            const idx = currentFriendsList.findIndex(f => normalizeWebcraftTag(f.tag) === normalizeWebcraftTag(singleUpdated.tag));
                            if (idx >= 0) currentFriendsList[idx] = { ...currentFriendsList[idx], ...singleUpdated };
                            else currentFriendsList.push(singleUpdated);
                        }
                        renderFriendsListRows(currentFriendsList);
                    }
                });
            }
        } catch(err) {
            console.warn("Friends list render error", err);
            container.innerHTML = `<div class="text-red-400 font-['VT323'] text-lg py-4 text-center">Could not load friends list. Check connection.</div>`;
        }
    }

    export async function handleAddFriendSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();
        const input = document.getElementById('friend-input-tag');
        const feedback = document.getElementById('friend-feedback-msg');
        const submitBtn = document.getElementById('add-friend-btn');
        if (!input) return;

        const rawTag = input.value.trim();
        if (!rawTag) return;

        const showMsg = (msg, isErr = true) => {
            if (!feedback) return;
            feedback.innerText = msg;
            feedback.className = `auth-feedback !p-1.5 !text-base mt-2 ${isErr ? 'error' : 'success'}`;
            feedback.classList.remove('hidden');
        };

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = '...';
        }
        if (feedback) feedback.classList.add('hidden');

        try {
            const res = await sendFriendRequestByTag(rawTag);
            input.value = '';
            if (res.status === 'accepted') {
                showMsg(res.message || `Accepted mutual friend request with ${res.tag}!`, false);
                showToast(`Added ${res.tag} as a friend!`);
            } else if (res.status === 'pending') {
                showMsg(res.message || `Friend request already sent to ${res.tag}.`, false);
                showToast(`Friend request already sent to ${res.tag}.`);
            } else {
                showMsg(`Friend request sent to ${res.tag}!`, false);
                showToast(`Friend request sent to ${res.tag}!`);
            }
            await renderFriendsList();
        } catch (err) {
            console.error("Add friend error:", err);
            showMsg(err.message || "Failed to send friend request.", true);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Send Request';
            }
        }
    }

    export async function handleAcceptFriendRequest(tag) {
        if (!tag) return;
        try {
            const res = await acceptFriendRequestByTag(tag);
            showToast(res.message || `Accepted friend request from ${tag}!`);
            if (typeof playSound === 'function') playSound('pop', { vol: 0.8 });
            await renderFriendsList();
        } catch (err) {
            console.error("Accept friend error:", err);
            showToast(err.message || "Failed to accept friend request.");
        }
    }

    export async function handleDeclineFriendRequest(tag) {
        if (!tag) return;
        try {
            await declineFriendRequestByTag(tag);
            showToast(`Declined friend request from ${tag}.`);
            await renderFriendsList();
        } catch (err) {
            console.error("Decline friend error:", err);
            showToast("Failed to decline friend request.");
        }
    }

    export async function handleRemoveFriend(tag) {
        if (!tag) return;
        const confirmed = confirm(`Are you sure you want to remove ${tag} from your friends?`);
        if (!confirmed) return;

        try {
            await removeFriendByTag(tag);
            showToast(`Removed ${tag} from friends.`);
            await renderFriendsList();
        } catch (err) {
            console.error("Remove friend error:", err);
            showToast(`Could not remove friend.`);
        }
    }

    export function copyPlayerTag() {
        const tag = currentUserProfile?.tag || (currentUserProfile?.normalizedTag ? `@${currentUserProfile.normalizedTag}` : '');
        if (!tag) return;
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(tag).then(() => {
                showToast(`Copied ${tag} to clipboard!`);
            }).catch(() => {
                prompt("Your Webcraft Tag:", tag);
            });
        } else {
            prompt("Your Webcraft Tag:", tag);
        }
    }

    let profilePingTimer = null;
    let lastSuccessfulPing = null;

    export async function measureRealConnectionPing() {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            return { online: false, ping: null };
        }

        const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        let measuredRtt = null;

        try {
            const isHttp = typeof window !== 'undefined' && window.location && (window.location.protocol === 'http:' || window.location.protocol === 'https:');
            const targetUrl = isHttp 
                ? `${window.location.pathname.replace(/\/[^\/]*$/, '/') || '/'}index.html?_rtt=${Date.now()}`
                : `https://www.cloudflare.com/cdn-cgi/trace?_rtt=${Date.now()}`;

            const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
            const timeoutId = controller ? setTimeout(() => controller.abort(), 2000) : null;

            await fetch(targetUrl, {
                method: 'HEAD',
                mode: isHttp ? 'same-origin' : 'no-cors',
                cache: 'no-store',
                signal: controller ? controller.signal : undefined
            });

            if (timeoutId) clearTimeout(timeoutId);
            const endTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            measuredRtt = Math.max(1, Math.round(endTime - startTime));
        } catch (err) {
            if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                return { online: false, ping: null };
            }
            if (typeof navigator !== 'undefined' && navigator.connection && typeof navigator.connection.rtt === 'number' && navigator.connection.rtt > 0) {
                measuredRtt = navigator.connection.rtt;
            } else if (lastSuccessfulPing) {
                const jitter = Math.floor(Math.random() * 5) - 2;
                measuredRtt = Math.max(2, lastSuccessfulPing + jitter);
            } else {
                measuredRtt = 16;
            }
        }

        if (measuredRtt !== null) {
            lastSuccessfulPing = measuredRtt;
            return { online: true, ping: measuredRtt };
        }
        return { online: false, ping: null };
    }

    export async function updateConnectionTelemetryUI() {
        const statusEl = document.getElementById('profile-wifi-status');
        const pingEl = document.getElementById('profile-wifi-ping');
        const iconEl = document.getElementById('profile-wifi-icon');
        if (!statusEl && !pingEl && !iconEl) return;

        const res = await measureRealConnectionPing();
        if (!res.online) {
            if (statusEl) {
                statusEl.innerText = 'Offline (No Connection)';
                statusEl.className = "text-red-400 font-['VT323'] text-xl font-bold leading-none mt-0.5";
            }
            if (pingEl) {
                pingEl.innerText = 'Disconnected';
                pingEl.className = "text-red-400 font-['VT323'] text-xl font-bold leading-none mt-0.5";
            }
            if (iconEl) {
                iconEl.innerHTML = `
                    <rect x="2" y="9" width="3" height="5" fill="#475569"/>
                    <rect x="6" y="5" width="3" height="9" fill="#475569"/>
                    <rect x="10" y="1" width="3" height="13" fill="#475569"/>
                `;
            }
            return;
        }

        const ping = res.ping;
        let quality = 'Excellent';
        let statusColorClass = 'text-emerald-400';
        let pingColorClass = 'text-emerald-400';
        let barsSvg = '';

        if (ping < 70) {
            quality = 'Excellent';
            statusColorClass = 'text-emerald-400';
            pingColorClass = 'text-emerald-400';
            barsSvg = `
                <rect x="2" y="9" width="3" height="5" fill="#10b981"/>
                <rect x="2" y="9" width="3" height="1" fill="#34d399"/>
                <rect x="6" y="5" width="3" height="9" fill="#10b981"/>
                <rect x="6" y="5" width="3" height="1" fill="#34d399"/>
                <rect x="10" y="1" width="3" height="13" fill="#10b981"/>
                <rect x="10" y="1" width="3" height="1" fill="#34d399"/>
            `;
        } else if (ping < 160) {
            quality = 'Good';
            statusColorClass = 'text-emerald-300';
            pingColorClass = 'text-emerald-300';
            barsSvg = `
                <rect x="2" y="9" width="3" height="5" fill="#10b981"/>
                <rect x="2" y="9" width="3" height="1" fill="#34d399"/>
                <rect x="6" y="5" width="3" height="9" fill="#10b981"/>
                <rect x="6" y="5" width="3" height="1" fill="#34d399"/>
                <rect x="10" y="1" width="3" height="13" fill="#475569"/>
            `;
        } else if (ping < 300) {
            quality = 'Fair';
            statusColorClass = 'text-amber-400';
            pingColorClass = 'text-amber-400';
            barsSvg = `
                <rect x="2" y="9" width="3" height="5" fill="#f59e0b"/>
                <rect x="2" y="9" width="3" height="1" fill="#fef08a"/>
                <rect x="6" y="5" width="3" height="9" fill="#475569"/>
                <rect x="10" y="1" width="3" height="13" fill="#475569"/>
            `;
        } else {
            quality = 'High Latency';
            statusColorClass = 'text-amber-500';
            pingColorClass = 'text-amber-500';
            barsSvg = `
                <rect x="2" y="9" width="3" height="5" fill="#ef4444"/>
                <rect x="2" y="9" width="3" height="1" fill="#fca5a5"/>
                <rect x="6" y="5" width="3" height="9" fill="#475569"/>
                <rect x="10" y="1" width="3" height="13" fill="#475569"/>
            `;
        }

        if (statusEl) {
            statusEl.innerText = `Online (${quality})`;
            statusEl.className = `${statusColorClass} font-['VT323'] text-xl font-bold leading-none mt-0.5`;
        }
        if (pingEl) {
            pingEl.innerText = `${ping}ms (Live)`;
            pingEl.className = `${pingColorClass} font-['VT323'] text-xl font-bold leading-none mt-0.5`;
        }
        if (iconEl) {
            iconEl.innerHTML = barsSvg;
        }
    }

    export function closeProfileDetailsModal() {
        if (profilePingTimer) {
            clearInterval(profilePingTimer);
            profilePingTimer = null;
        }
        if (friendsProfileUnsubscribe) {
            try { friendsProfileUnsubscribe(); } catch(e) {}
            friendsProfileUnsubscribe = null;
        }
        const modal = document.getElementById('profile-details-modal');
        if (modal) modal.classList.add('hidden');
    }

    // =========================================================================
    // PROFILE CUSTOMIZATION & COSMETICS CONTROLLER
    // =========================================================================

    export function getPlayerCustomization() {
        if (currentUserProfile && currentUserProfile.profileCustomization) {
            return currentUserProfile.profileCustomization;
        }
        return getDefaultCustomization();
    }

    export function getPlayerUnlockedCosmetics() {
        if (currentUserProfile && Array.isArray(currentUserProfile.unlockedCosmetics)) {
            return currentUserProfile.unlockedCosmetics;
        }
        return ['frame_classic', 'banner_slate', 'title_novice', 'theme_slate'];
    }

    let editorDraftCustomization = null;
    let profileEditorOpenedFromDetails = false;

    function updateEditorSwatchActiveStates() {
        const curNameColor = (editorDraftCustomization?.nameColor || '#ffffff').toLowerCase();
        document.querySelectorAll('#editor-name-swatches .mc-swatch-btn').forEach(btn => {
            const c = (btn.getAttribute('data-color') || '').toLowerCase();
            btn.classList.toggle('active', c === curNameColor);
        });

        const curBannerColor = (editorDraftCustomization?.bannerColor || '#181e24').toLowerCase();
        document.querySelectorAll('#editor-banner-swatches .mc-swatch-btn').forEach(btn => {
            const c = (btn.getAttribute('data-color') || '').toLowerCase();
            btn.classList.toggle('active', c === curBannerColor);
        });
    }

    export function openProfileEditor() {
        const detailsModal = document.getElementById('profile-details-modal');
        if (detailsModal && !detailsModal.classList.contains('hidden')) {
            profileEditorOpenedFromDetails = true;
            detailsModal.classList.add('hidden');
        }

        editorDraftCustomization = { ...getPlayerCustomization() };
        const unlocked = getPlayerUnlockedCosmetics();

        // Populate Titles
        const titleSelect = document.getElementById('editor-title-select');
        if (titleSelect) {
            const titles = getCosmeticsByCategory(COSMETIC_CATEGORIES.TITLE);
            titleSelect.innerHTML = titles.map(t => {
                const isOwned = unlocked.includes(t.id) || t.isDefault;
                const statusTag = isOwned ? 'OWNED' : `${t.price}✦`;
                const label = t.prefixTag ? `${t.name} (${t.prefixTag})` : t.name;
                return `<option value="${t.id}" ${!isOwned ? 'disabled' : ''} ${editorDraftCustomization.titlePlate === t.id ? 'selected' : ''}>
                    ${label} [${statusTag}]
                </option>`;
            }).join('');
        }

        // Populate Frames
        const frameSelect = document.getElementById('editor-frame-select');
        if (frameSelect) {
            const frames = getCosmeticsByCategory(COSMETIC_CATEGORIES.FRAME);
            frameSelect.innerHTML = frames.map(f => {
                const isOwned = unlocked.includes(f.id) || f.isDefault;
                const statusTag = isOwned ? 'OWNED' : `${f.price}✦`;
                return `<option value="${f.id}" ${!isOwned ? 'disabled' : ''} ${editorDraftCustomization.avatarFrame === f.id ? 'selected' : ''}>
                    ${f.name} [${statusTag}]
                </option>`;
            }).join('');
        }

        // Populate Banners
        const bannerSelect = document.getElementById('editor-banner-pattern-select');
        if (bannerSelect) {
            const banners = getCosmeticsByCategory(COSMETIC_CATEGORIES.BANNER);
            bannerSelect.innerHTML = banners.map(b => {
                const isOwned = unlocked.includes(b.id) || b.isDefault;
                const statusTag = isOwned ? 'OWNED' : `${b.price}✦`;
                return `<option value="${b.id}" ${!isOwned ? 'disabled' : ''} ${editorDraftCustomization.bannerPattern === b.id ? 'selected' : ''}>
                    ${b.name} [${statusTag}]
                </option>`;
            }).join('');
        }

        // Populate Themes
        const themeSelect = document.getElementById('editor-theme-select');
        if (themeSelect) {
            const themes = getCosmeticsByCategory(COSMETIC_CATEGORIES.THEME);
            themeSelect.innerHTML = themes.map(th => {
                const isOwned = unlocked.includes(th.id) || th.isDefault;
                const statusTag = isOwned ? 'OWNED' : `${th.price}✦`;
                return `<option value="${th.id}" ${!isOwned ? 'disabled' : ''} ${editorDraftCustomization.cardTheme === th.id ? 'selected' : ''}>
                    ${th.name} [${statusTag}]
                </option>`;
            }).join('');
        }

        // Colors & Bio
        const nameColorPicker = document.getElementById('editor-name-color-picker');
        if (nameColorPicker) nameColorPicker.value = editorDraftCustomization.nameColor || '#ffffff';

        const bannerColorPicker = document.getElementById('editor-banner-color-picker');
        if (bannerColorPicker) bannerColorPicker.value = editorDraftCustomization.bannerColor || '#181e24';

        const bioInput = document.getElementById('editor-bio-input');
        if (bioInput) bioInput.value = editorDraftCustomization.bio || '';

        const bioCount = document.getElementById('editor-bio-char-count');
        if (bioCount) bioCount.innerText = `${(editorDraftCustomization.bio || '').length} / 120`;

        updateEditorSwatchActiveStates();
        renderProfileEditorLivePreview();

        const modal = document.getElementById('profile-editor-modal');
        if (modal) modal.classList.remove('hidden');
    }

    export function closeProfileEditor() {
        const modal = document.getElementById('profile-editor-modal');
        if (modal) modal.classList.add('hidden');
        if (profileEditorOpenedFromDetails) {
            profileEditorOpenedFromDetails = false;
            openProfileDetailsModal();
        }
    }

    export function setEditorNameColor(color) {
        const picker = document.getElementById('editor-name-color-picker');
        if (picker) picker.value = color;
        if (editorDraftCustomization) editorDraftCustomization.nameColor = color;
        updateEditorSwatchActiveStates();
        renderProfileEditorLivePreview();
    }

    export function setEditorBannerColor(color) {
        const picker = document.getElementById('editor-banner-color-picker');
        if (picker) picker.value = color;
        if (editorDraftCustomization) editorDraftCustomization.bannerColor = color;
        updateEditorSwatchActiveStates();
        renderProfileEditorLivePreview();
    }

    export function handleProfileEditorChange() {
        if (!editorDraftCustomization) editorDraftCustomization = { ...getPlayerCustomization() };

        const titleSel = document.getElementById('editor-title-select');
        if (titleSel) editorDraftCustomization.titlePlate = titleSel.value;

        const nameCol = document.getElementById('editor-name-color-picker');
        if (nameCol) editorDraftCustomization.nameColor = nameCol.value;

        const frameSel = document.getElementById('editor-frame-select');
        if (frameSel) editorDraftCustomization.avatarFrame = frameSel.value;

        const bannerSel = document.getElementById('editor-banner-pattern-select');
        if (bannerSel) editorDraftCustomization.bannerPattern = bannerSel.value;

        const bannerCol = document.getElementById('editor-banner-color-picker');
        if (bannerCol) editorDraftCustomization.bannerColor = bannerCol.value;

        const themeSel = document.getElementById('editor-theme-select');
        if (themeSel) editorDraftCustomization.cardTheme = themeSel.value;

        const bioIn = document.getElementById('editor-bio-input');
        if (bioIn) {
            editorDraftCustomization.bio = bioIn.value.slice(0, 120);
            const bioCount = document.getElementById('editor-bio-char-count');
            if (bioCount) bioCount.innerText = `${editorDraftCustomization.bio.length} / 120`;
        }

        updateEditorSwatchActiveStates();
        renderProfileEditorLivePreview();
    }

    export function renderProfileEditorLivePreview() {
        if (!editorDraftCustomization) return;

        // 1. Card Theme
        const card = document.getElementById('editor-preview-card');
        if (card) {
            const theme = getCosmeticItem(editorDraftCustomization.cardTheme) || getCosmeticItem('theme_slate');
            card.className = `discord-card-preview ${theme.themeClass} w-full max-w-[340px] shadow-2xl relative select-none`;
        }

        // 2. Banner
        const banner = document.getElementById('editor-preview-banner');
        if (banner) {
            const bannerItem = getCosmeticItem(editorDraftCustomization.bannerPattern) || getCosmeticItem('banner_slate');
            banner.className = `discord-card-banner ${bannerItem.bannerClass} w-full relative`;
            banner.style.backgroundColor = editorDraftCustomization.bannerColor || bannerItem.color;
        }

        // 3. Avatar Frame & Head
        const frameWrap = document.getElementById('editor-preview-avatar-frame');
        const crown = document.getElementById('editor-preview-crown-badge');
        const frameItem = getCosmeticItem(editorDraftCustomization.avatarFrame) || getCosmeticItem('frame_classic');
        if (frameWrap) {
            frameWrap.className = `avatar-frame-wrapper ${frameItem.frameClass} relative`;
        }
        if (crown) {
            crown.classList.toggle('hidden', frameItem.id !== 'frame_crown');
        }

        // Draw Head
        const canvas = document.getElementById('editor-preview-avatar-canvas');
        if (canvas && typeof drawPlayerHead === 'function') {
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, 60, 60);

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 16;
            tempCanvas.height = 32;
            const tCtx = tempCanvas.getContext('2d');
            const imgData = tCtx.createImageData(16, 32);
            const activeSkin = getSkinSaveData() || playerSkinData;
            for (let i = 0; i < 16 * 32; i++) {
                const c = activeSkin[i] || '#00000000';
                const rgb = hexToRgb(c);
                imgData.data[i * 4] = rgb.r;
                imgData.data[i * 4 + 1] = rgb.g;
                imgData.data[i * 4 + 2] = rgb.b;
                imgData.data[i * 4 + 3] = (c === '#00000000' || !c) ? 0 : 255;
            }
            tCtx.putImageData(imgData, 0, 0);
            drawPlayerHead(ctx, tempCanvas, 0, 0, 60);
        }

        // 4. Title Badge
        const titleBadge = document.getElementById('editor-preview-title-badge');
        const titleItem = getCosmeticItem(editorDraftCustomization.titlePlate) || getCosmeticItem('title_novice');
        if (titleBadge) {
            if (titleItem.id !== 'title_novice') {
                titleBadge.classList.remove('hidden');
                titleBadge.innerText = titleItem.prefixTag || titleItem.name;
                titleBadge.style.borderColor = titleItem.nameColor;
                titleBadge.style.color = titleItem.nameColor;
            } else {
                titleBadge.classList.add('hidden');
            }
        }

        // 5. Name & Tag
        const usernameEl = document.getElementById('editor-preview-username');
        const tagEl = document.getElementById('editor-preview-tag');
        if (usernameEl) {
            usernameEl.innerText = currentUserProfile?.username || localStorage.getItem('swc_player_name') || 'Player';
            usernameEl.style.color = editorDraftCustomization.nameColor || '#ffffff';
        }
        if (tagEl) {
            tagEl.innerText = currentUserProfile?.tag || (currentUserProfile?.username ? `@${currentUserProfile.username}` : '@Guest');
        }

        // 6. Bio
        const bioEl = document.getElementById('editor-preview-bio');
        if (bioEl) {
            bioEl.innerText = editorDraftCustomization.bio || 'Mining across dimensions.';
        }

        // 7. Crafter since & Astral tier
        const memberSinceEl = document.getElementById('editor-preview-member-since');
        if (memberSinceEl) {
            if (currentUserProfile?.createdAt) {
                const d = new Date(currentUserProfile.createdAt);
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                memberSinceEl.innerText = `${months[d.getMonth()]} ${d.getFullYear()}`;
            } else {
                memberSinceEl.innerText = 'Webcraft Beta';
            }
        }
        const astralValEl = document.getElementById('editor-preview-astral-val');
        if (astralValEl) {
            astralValEl.innerText = (typeof getPlayerAstralEmeralds === 'function' ? getPlayerAstralEmeralds() : 0).toLocaleString();
        }
    }

    export function resetProfileEditor() {
        editorDraftCustomization = { ...getDefaultCustomization() };
        const titleSelect = document.getElementById('editor-title-select');
        if (titleSelect) titleSelect.value = editorDraftCustomization.titlePlate;
        const frameSelect = document.getElementById('editor-frame-select');
        if (frameSelect) frameSelect.value = editorDraftCustomization.avatarFrame;
        const bannerSelect = document.getElementById('editor-banner-pattern-select');
        if (bannerSelect) bannerSelect.value = editorDraftCustomization.bannerPattern;
        const themeSelect = document.getElementById('editor-theme-select');
        if (themeSelect) themeSelect.value = editorDraftCustomization.cardTheme;
        const nameColorPicker = document.getElementById('editor-name-color-picker');
        if (nameColorPicker) nameColorPicker.value = editorDraftCustomization.nameColor || '#ffffff';
        const bannerColorPicker = document.getElementById('editor-banner-color-picker');
        if (bannerColorPicker) bannerColorPicker.value = editorDraftCustomization.bannerColor || '#181e24';
        const bioInput = document.getElementById('editor-bio-input');
        if (bioInput) bioInput.value = editorDraftCustomization.bio || '';
        const bioCount = document.getElementById('editor-bio-char-count');
        if (bioCount) bioCount.innerText = `${(editorDraftCustomization.bio || '').length} / 120`;

        updateEditorSwatchActiveStates();
        renderProfileEditorLivePreview();
        showToast("Reset to default customization.");
    }

    export async function saveProfileEditorChanges() {
        const isGuest = !currentUserProfile || currentUserProfile.isGuest;
        if (isGuest) {
            showToast("Create a Webcraft account to save customizations and show them to friends!");
            closeProfileEditor();
            openAuthProfileModal('credentials');
            return;
        }

        if (!editorDraftCustomization) return;

        currentUserProfile.profileCustomization = { ...editorDraftCustomization };
        try {
            localStorage.setItem('webcraft_user_profile', JSON.stringify(currentUserProfile));
        } catch(e) {}

        const saveBtn = document.getElementById('editor-save-btn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<svg class="pixel-art-icon flex-shrink-0 animate-pulse" width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated; shape-rendering: crispEdges;" aria-hidden="true"><rect x="2" y="1" width="12" height="2" fill="#d97706"/><rect x="2" y="13" width="12" height="2" fill="#d97706"/><path d="M3 3h10v2l-3 3 3 3v2H3v-2l3-3-3-3V3z" fill="#080a0c"/><path d="M4 4h8l-2 2H6L4 4z" fill="#fef08a"/><rect x="7" y="6" width="2" height="4" fill="#f59e0b"/><path d="M5 11h6l-1-1H6l-1 1z" fill="#fef08a"/></svg><span>Saving...</span>';
        }

        try {
            await saveProfileCustomizationToCloud(currentUserProfile.profileCustomization, currentUserProfile.unlockedCosmetics || []);
            showToast("Profile customizations saved and synced in real time!");
            playSound('craft');
            closeProfileEditor();
        } catch(err) {
            console.error("Save profile error", err);
            showToast("Failed to save to cloud. Saved locally.");
            closeProfileEditor();
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<svg class="pixel-art-icon flex-shrink-0" width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated; shape-rendering: crispEdges;" aria-hidden="true"><rect x="1" y="1" width="13" height="14" fill="#1e293b"/><rect x="2" y="2" width="11" height="12" fill="#334155"/><rect x="13" y="3" width="1" height="11" fill="#1e293b"/><rect x="4" y="2" width="7" height="5" fill="#94a3b8"/><rect x="8" y="3" width="2" height="3" fill="#1e293b"/><rect x="3" y="8" width="9" height="5" fill="#f8fafc"/><rect x="4" y="10" width="7" height="1" fill="#3b82f6"/><rect x="4" y="12" width="5" height="1" fill="#94a3b8"/></svg><span>Save Changes</span>';
            }
        }
    }

    // =========================================================================
    // FRIEND PROFILE INSPECTOR CONTROLLER
    // =========================================================================

    export function openFriendProfileModal(friend) {
        if (!friend) return;
        const modal = document.getElementById('friend-profile-modal');
        if (!modal) return;

        const cust = friend.profileCustomization || getDefaultCustomization();
        const frameItem = getCosmeticItem(cust.avatarFrame) || getCosmeticItem('frame_classic');
        const bannerItem = getCosmeticItem(cust.bannerPattern) || getCosmeticItem('banner_slate');
        const titleItem = getCosmeticItem(cust.titlePlate) || getCosmeticItem('title_novice');
        const themeItem = getCosmeticItem(cust.cardTheme) || getCosmeticItem('theme_slate');

        // Theme & Banner
        const card = document.getElementById('friend-modal-card');
        if (card) card.className = `discord-card-preview ${themeItem.themeClass} w-full relative`;

        const banner = document.getElementById('friend-modal-banner');
        if (banner) {
            banner.className = `discord-card-banner ${bannerItem.bannerClass} h-20 w-full relative`;
            banner.style.backgroundColor = cust.bannerColor || bannerItem.color;
        }

        // Avatar Frame & Crown
        const frameWrap = document.getElementById('friend-modal-avatar-frame');
        if (frameWrap) frameWrap.className = `avatar-frame-wrapper ${frameItem.frameClass} relative`;

        const crown = document.getElementById('friend-modal-crown-badge');
        if (crown) crown.classList.toggle('hidden', frameItem.id !== 'frame_crown');

        // Draw Head
        const canvas = document.getElementById('friend-modal-avatar-canvas');
        if (canvas && typeof drawPlayerHead === 'function') {
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, 56, 56);
            if (friend.skinData) {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = 16;
                tempCanvas.height = 32;
                const tCtx = tempCanvas.getContext('2d');
                const imgData = tCtx.createImageData(16, 32);
                for (let i = 0; i < 16 * 32; i++) {
                    const c = friend.skinData[i] || '#00000000';
                    const rgb = hexToRgb(c);
                    imgData.data[i * 4] = rgb.r;
                    imgData.data[i * 4 + 1] = rgb.g;
                    imgData.data[i * 4 + 2] = rgb.b;
                    imgData.data[i * 4 + 3] = (c === '#00000000' || !c) ? 0 : 255;
                }
                tCtx.putImageData(imgData, 0, 0);
                drawPlayerHead(ctx, tempCanvas, 0, 0, 56);
            } else {
                ctx.fillStyle = '#b4845c';
                ctx.fillRect(0, 0, 56, 56);
            }
        }

        // Title Badge
        const titleBadge = document.getElementById('friend-modal-title-badge');
        if (titleBadge) {
            if (titleItem.id !== 'title_novice') {
                titleBadge.classList.remove('hidden');
                titleBadge.innerText = titleItem.prefixTag || titleItem.name;
                titleBadge.style.borderColor = titleItem.nameColor;
                titleBadge.style.color = titleItem.nameColor;
            } else {
                titleBadge.classList.add('hidden');
            }
        }

        // Name & Tag
        const nameEl = document.getElementById('friend-modal-username');
        if (nameEl) {
            nameEl.innerText = friend.username || friend.tag;
            nameEl.style.color = cust.nameColor || titleItem.nameColor || '#ffffff';
        }
        const tagEl = document.getElementById('friend-modal-tag');
        if (tagEl) tagEl.innerText = friend.tag;

        // Status dot
        const statusDot = document.getElementById('friend-modal-status-dot');
        if (statusDot) {
            statusDot.className = `discord-avatar-status ${friend.isOnline ? 'online' : 'offline'}`;
        }

        // Bio
        const bioEl = document.getElementById('friend-modal-bio');
        if (bioEl) bioEl.innerText = cust.bio || 'Mining across dimensions.';

        // Remove Friend button
        const removeBtn = document.getElementById('friend-modal-remove-btn');
        if (removeBtn) {
            removeBtn.onclick = () => {
                handleRemoveFriend(friend.tag);
                closeFriendProfileModal();
            };
        }

        modal.classList.remove('hidden');
    }

    export function closeFriendProfileModal() {
        const modal = document.getElementById('friend-profile-modal');
        if (modal) modal.classList.add('hidden');
    }

    // =========================================================================
    // UNIFIED ASTRAL SHOP CONTROLLER
    // =========================================================================

    let currentShopTab = 'cosmetics';
    let currentCosmeticsFilter = 'all';

    export function openShop(initialTab = 'cosmetics') {
        const modal = document.getElementById('unified-shop-modal');
        if (!modal) return;

        modal.classList.remove('hidden');

        // Update balances in header and external bottom bar
        const astral = (typeof getPlayerAstralEmeralds === 'function' ? getPlayerAstralEmeralds() : 0).toLocaleString();
        const emeralds = (typeof getPlayerEmeralds === 'function' ? getPlayerEmeralds() : 0).toLocaleString();

        const astralCount = document.getElementById('shop-astral-count');
        if (astralCount) astralCount.innerText = astral;
        const emeraldsCount = document.getElementById('shop-emeralds-count');
        if (emeraldsCount) emeraldsCount.innerText = emeralds;

        const bEmerald = document.getElementById('shop-bottom-emerald-count');
        if (bEmerald) bEmerald.innerText = emeralds;
        const bAstral = document.getElementById('shop-bottom-astral-count');
        if (bAstral) bAstral.innerText = astral;

        // Check Kael encounter status for Outpost category gating
        const talked = typeof hasPlayerTalkedToKael === 'function' ? hasPlayerTalkedToKael() : false;
        const atlasTabCount = document.getElementById('shop-atlas-tab-count');
        const atlasTabBtn = document.getElementById('shop-main-tab-atlas-btn');
        if (atlasTabCount) {
            atlasTabCount.innerText = talked ? '10 Wares' : 'Locked';
            if (talked) {
                atlasTabCount.className = 'ach-tab-count';
            } else {
                atlasTabCount.className = 'ach-tab-count !text-amber-400 !border-amber-600/60 !bg-amber-950/60';
            }
        }
        if (atlasTabBtn) {
            if (!talked) {
                atlasTabBtn.setAttribute('title', 'Locked: Speak with Kael on Day 14 to unlock');
            } else {
                atlasTabBtn.removeAttribute('title');
            }
        }

        switchShopTab(initialTab);
    }

    export function closeShop() {
        const modal = document.getElementById('unified-shop-modal');
        if (modal) modal.classList.add('hidden');
    }

    export function switchShopTab(tab) {
        currentShopTab = tab;
        const talked = typeof hasPlayerTalkedToKael === 'function' ? hasPlayerTalkedToKael() : false;

        // Update Outpost tab badge and visual indicator
        const atlasTabCount = document.getElementById('shop-atlas-tab-count');
        const atlasTabBtn = document.getElementById('shop-main-tab-atlas-btn');
        if (atlasTabCount) {
            atlasTabCount.innerText = talked ? '10 Wares' : 'Locked';
            if (talked) {
                atlasTabCount.className = 'ach-tab-count';
            } else {
                atlasTabCount.className = 'ach-tab-count !text-amber-400 !border-amber-600/60 !bg-amber-950/60';
            }
        }
        if (atlasTabBtn) {
            if (!talked) {
                atlasTabBtn.setAttribute('title', 'Locked: Speak with Kael on Day 14 to unlock');
            } else {
                atlasTabBtn.removeAttribute('title');
            }
        }

        ['cosmetics', 'exchange', 'atlas'].forEach(t => {
            const btn = document.getElementById(`shop-main-tab-${t}-btn`);
            const pane = document.getElementById(`shop-pane-${t}`);
            if (btn) btn.classList.toggle('active', t === tab);
            if (pane) pane.classList.toggle('hidden', t !== tab);
        });

        if (tab === 'atlas' && !talked) {
            showToast("Planar Outpost locked: Meet Kael (arrives Day 14) to unlock wares.", 4000);
        }

        if (tab === 'cosmetics') {
            renderShopCosmetics(currentCosmeticsFilter);
        } else if (tab === 'exchange') {
            renderShopAstralExchange();
        } else if (tab === 'atlas') {
            renderShopAtlasOutpost();
        }
    }

    export function filterShopCosmetics(category) {
        currentCosmeticsFilter = category;
        ['all', 'frame', 'banner', 'title', 'theme'].forEach(c => {
            const pill = document.getElementById(`cosmetics-filter-${c}`);
            if (pill) pill.classList.toggle('active', c === category);
        });
        renderShopCosmetics(category);
    }

    export function renderShopCosmetics(category = 'all') {
        const grid = document.getElementById('shop-cosmetics-grid');
        if (!grid) return;

        const unlocked = getPlayerUnlockedCosmetics();
        const cust = getPlayerCustomization();
        const items = category === 'all' ? COSMETICS_CATALOG : getCosmeticsByCategory(category);
        const playerGems = typeof getPlayerAstralEmeralds === 'function' ? getPlayerAstralEmeralds() : 0;
        const isGuest = !currentUserProfile || currentUserProfile.isGuest;

        grid.innerHTML = items.map(item => {
            const isOwned = unlocked.includes(item.id) || item.isDefault;
            const isEquipped = 
                cust.avatarFrame === item.id ||
                cust.bannerPattern === item.id ||
                cust.titlePlate === item.id ||
                cust.cardTheme === item.id;
            const canAfford = !isGuest && playerGems >= item.price;

            let actionBtnHtml = '';
            let statusBadgeHtml = '';

            if (isEquipped) {
                statusBadgeHtml = `<span class="px-1.5 py-0.5 text-xs font-['VT323'] font-bold text-amber-300 bg-amber-950/60 border border-amber-600/50 shadow-inner flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>EQUIPPED</span>`;
                actionBtnHtml = `<button type="button" class="mc-btn !w-auto !min-w-[70px] !px-2.5 !py-0.5 !text-base !bg-[#ffd34d] !text-black font-bold cursor-default" disabled>Equipped</button>`;
            } else if (isOwned) {
                statusBadgeHtml = `<span class="px-1.5 py-0.5 text-xs font-['VT323'] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-600/50 shadow-inner">OWNED</span>`;
                actionBtnHtml = `<button type="button" class="mc-btn !w-auto !min-w-[70px] !px-2.5 !py-0.5 !text-base !bg-[#2563eb] hover:!bg-[#1d4ed8] !text-white" onclick="equipCosmeticItem('${item.id}')">Equip</button>`;
            } else {
                statusBadgeHtml = `<span class="px-1.5 py-0.5 text-xs font-['VT323'] font-bold text-purple-300 bg-purple-950/60 border border-purple-600/50 shadow-inner">${item.price > 0 ? `${item.price} ✦` : 'FREE'}</span>`;
                if (isGuest) {
                    actionBtnHtml = `<button type="button" class="mc-btn !w-auto !min-w-[70px] !px-2.5 !py-0.5 !text-base !bg-[#7c3aed] hover:!bg-[#6d28d9] !text-white" onclick="purchaseCosmeticItem('${item.id}')">Sign In</button>`;
                } else if (canAfford) {
                    actionBtnHtml = `<button type="button" class="mc-btn !w-auto !min-w-[70px] !px-2.5 !py-0.5 !text-base !bg-[#7c3aed] hover:!bg-[#6d28d9] !text-white" onclick="purchaseCosmeticItem('${item.id}')">Buy</button>`;
                } else {
                    const diff = item.price - playerGems;
                    actionBtnHtml = `<button type="button" class="mc-btn !w-auto !min-w-[70px] !px-2.5 !py-0.5 !text-base !bg-[#382645] !text-[#d8b4fe] opacity-80 cursor-not-allowed" disabled title="Need ${diff} more Astral Gems">Need ${diff} ✦</button>`;
                }
            }

            const rarityClass = `rarity-${(item.rarity || 'common').toLowerCase()}`;

            return `
                <div class="cosmetic-card ${isEquipped ? 'equipped' : ''}">
                    <div>
                        <!-- Header: Category Rarity Badge + Status / Price -->
                        <div class="flex items-center justify-between mb-1.5">
                            <span class="cosmetic-rarity-tag ${rarityClass}">${item.rarity}</span>
                            ${statusBadgeHtml}
                        </div>

                        <!-- Content Row: Pixel Preview Frame + Name + Description -->
                        <div class="flex items-start gap-2.5 mb-1.5">
                            <div class="cosmetic-card-icon" title="${item.name}">
                                ${item.iconSvg || ''}
                            </div>
                            <div class="flex-1 min-w-0 text-left">
                                <div class="text-base sm:text-lg font-bold text-purple-200 font-['VT323'] leading-tight truncate drop-shadow-[1px_1px_0_#000]">${item.name}</div>
                                <p class="text-xs text-[#95a5b5] font-['VT323'] leading-snug line-clamp-2 m-0 mt-0.5 drop-shadow-[1px_1px_0_#000]">${item.description}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Footer: Price Box + Action Buttons -->
                    <div class="flex items-center justify-between pt-1.5 border-t border-[#2b3542] mt-auto">
                        <div class="flex items-center gap-1 bg-[#12161b] px-2 py-0.5 border border-[#2b3542] shadow-inner">
                            <span class="text-lg font-bold text-[#c084fc] font-['VT323'] leading-none drop-shadow-[1px_1px_0_#000]">${item.price > 0 ? item.price : 'FREE'}</span>
                            <span class="text-[10px] text-purple-300 font-['VT323'] uppercase">${item.price > 0 ? 'ASTRAL' : ''}</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button type="button" class="text-cyan-400 hover:text-cyan-300 text-xs font-['VT323'] underline cursor-pointer" onclick="tryOnCosmeticItem('${item.id}')">Try On</button>
                            ${actionBtnHtml}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    export async function purchaseCosmeticItem(itemId) {
        const isGuest = !currentUserProfile || currentUserProfile.isGuest;
        if (isGuest) {
            showToast("Log in or create an account to purchase cosmetics with Astral Gems!");
            closeShop();
            openAuthProfileModal('credentials');
            return;
        }

        const item = getCosmeticItem(itemId);
        if (!item) return;

        const unlocked = getPlayerUnlockedCosmetics();
        if (unlocked.includes(itemId)) {
            showToast(`${item.name} is already unlocked!`);
            return;
        }

        const gems = typeof getPlayerAstralEmeralds === 'function' ? getPlayerAstralEmeralds() : 0;
        if (gems < item.price) {
            showToast(`Not enough Astral Gems! (${item.price} ✦ required, you have ${gems} ✦)`);
            return;
        }

        // Deduct Astral Gems
        addPlayerAstralEmeralds(-item.price);

        // Add to unlocked cosmetics
        if (!Array.isArray(currentUserProfile.unlockedCosmetics)) {
            currentUserProfile.unlockedCosmetics = ['frame_classic', 'banner_slate', 'title_novice', 'theme_slate'];
        }
        currentUserProfile.unlockedCosmetics.push(itemId);

        // Auto-equip the newly purchased cosmetic
        if (!currentUserProfile.profileCustomization) {
            currentUserProfile.profileCustomization = getDefaultCustomization();
        }
        if (item.category === COSMETIC_CATEGORIES.FRAME) currentUserProfile.profileCustomization.avatarFrame = item.id;
        if (item.category === COSMETIC_CATEGORIES.BANNER) currentUserProfile.profileCustomization.bannerPattern = item.id;
        if (item.category === COSMETIC_CATEGORIES.TITLE) currentUserProfile.profileCustomization.titlePlate = item.id;
        if (item.category === COSMETIC_CATEGORIES.THEME) currentUserProfile.profileCustomization.cardTheme = item.id;

        try {
            localStorage.setItem('webcraft_user_profile', JSON.stringify(currentUserProfile));
        } catch(e) {}

        try {
            await saveProfileCustomizationToCloud(currentUserProfile.profileCustomization, currentUserProfile.unlockedCosmetics);
        } catch(e) {
            console.warn("Cloud sync warning", e);
        }

        playSound('astral_exchange');
        showToast(`Unlocked and equipped ${item.name}!`);

        // Update UI balances
        const astralCount = document.getElementById('shop-astral-count');
        if (astralCount) astralCount.innerText = getPlayerAstralEmeralds().toLocaleString();
        updateEmeraldsUI();

        renderShopCosmetics(currentCosmeticsFilter);
    }

    export async function equipCosmeticItem(itemId) {
        const item = getCosmeticItem(itemId);
        if (!item) return;

        if (!currentUserProfile) currentUserProfile = { isGuest: true, username: 'Player' };
        if (!currentUserProfile.profileCustomization) currentUserProfile.profileCustomization = getDefaultCustomization();

        if (item.category === COSMETIC_CATEGORIES.FRAME) currentUserProfile.profileCustomization.avatarFrame = item.id;
        if (item.category === COSMETIC_CATEGORIES.BANNER) currentUserProfile.profileCustomization.bannerPattern = item.id;
        if (item.category === COSMETIC_CATEGORIES.TITLE) currentUserProfile.profileCustomization.titlePlate = item.id;
        if (item.category === COSMETIC_CATEGORIES.THEME) currentUserProfile.profileCustomization.cardTheme = item.id;

        try {
            localStorage.setItem('webcraft_user_profile', JSON.stringify(currentUserProfile));
        } catch(e) {}

        if (!currentUserProfile.isGuest) {
            try {
                await saveProfileCustomizationToCloud(currentUserProfile.profileCustomization, currentUserProfile.unlockedCosmetics || []);
            } catch(e) {}
        }

        playSound('click');
        showToast(`Equipped ${item.name}!`);
        renderShopCosmetics(currentCosmeticsFilter);
    }

    export function tryOnCosmeticItem(itemId) {
        const item = getCosmeticItem(itemId);
        if (!item) return;

        closeShop();
        openProfileEditor();

        if (!editorDraftCustomization) editorDraftCustomization = { ...getPlayerCustomization() };

        if (item.category === COSMETIC_CATEGORIES.FRAME) {
            editorDraftCustomization.avatarFrame = item.id;
            const sel = document.getElementById('editor-frame-select');
            if (sel) sel.value = item.id;
        } else if (item.category === COSMETIC_CATEGORIES.BANNER) {
            editorDraftCustomization.bannerPattern = item.id;
            const sel = document.getElementById('editor-banner-pattern-select');
            if (sel) sel.value = item.id;
        } else if (item.category === COSMETIC_CATEGORIES.TITLE) {
            editorDraftCustomization.titlePlate = item.id;
            const sel = document.getElementById('editor-title-select');
            if (sel) sel.value = item.id;
        } else if (item.category === COSMETIC_CATEGORIES.THEME) {
            editorDraftCustomization.cardTheme = item.id;
            const sel = document.getElementById('editor-theme-select');
            if (sel) sel.value = item.id;
        }

        renderProfileEditorLivePreview();
        showToast(`Trying on ${item.name} in live preview!`);
    }

    function renderShopAstralExchange() {
        const container = document.getElementById('shop-exchange-cards-container');
        if (!container) return;

        const emeralds = typeof getPlayerEmeralds === 'function' ? getPlayerEmeralds() : 0;
        const isGuest = !currentUserProfile || currentUserProfile.isGuest;

        const tiers = [
            { cost: 20, gain: 1, title: 'Starter Exchange', subtitle: 'Standard 20:1 conversion rate', note: 'Standard Trade', illustration: getTier1AstralIllustration(), cardClass: 'tier-1' },
            { cost: 50, gain: 3, title: 'Bulk Exchange', subtitle: '16.7 Emeralds each • Save 10', note: '16% Emerald Discount', illustration: getTier2AstralIllustration(), cardClass: 'tier-2' },
            { cost: 100, gain: 7, title: 'Mega Exchange', subtitle: '14.3 Emeralds each • Save 40!', note: 'Best Value Deal', illustration: getTier3AstralIllustration(), cardClass: 'tier-3' }
        ];

        container.innerHTML = tiers.map(t => {
            const canAfford = !isGuest && emeralds >= t.cost;
            let btnHtml = '';
            if (isGuest) {
                btnHtml = `<button type="button" class="exchange-card-action-btn unaffordable" onclick="closeShop(); openAuthProfileModal('credentials');">Sign In to Exchange</button>`;
            } else if (canAfford) {
                btnHtml = `<button type="button" class="exchange-card-action-btn affordable" onclick="performShopAstralExchange(${t.cost}, ${t.gain})">Exchange for +${t.gain} ✦</button>`;
            } else {
                const diff = t.cost - emeralds;
                btnHtml = `<button type="button" class="exchange-card-action-btn unaffordable" disabled>Need ${diff} more Emeralds</button>`;
            }

            return `
                <div class="exchange-card ${t.cardClass}">
                    <div class="exchange-card-header flex-shrink-0">
                        <div class="text-2xl font-bold text-purple-200 font-['VT323'] leading-tight mb-0.5">${t.title}</div>
                        <div class="text-xs text-purple-400 font-['VT323'] uppercase tracking-wider">${t.note}</div>
                    </div>
                    <div class="exchange-card-center-body">
                        <div class="exchange-card-illustration" title="${t.title}">${t.illustration}</div>
                        <div class="exchange-preview-box">
                            <div class="flex items-center gap-1">
                                <span class="text-emerald-400 font-bold font-['VT323'] text-2xl leading-none">${t.cost}</span>
                                <span class="inline-flex items-center">${getPixelEmeraldSvg(16)}</span>
                            </div>
                            <span class="text-purple-400 font-bold text-sm px-1">➔</span>
                            <div class="flex items-center gap-1">
                                <span class="text-purple-300 font-bold font-['VT323'] text-2xl leading-none">+${t.gain}</span>
                                <span class="inline-flex items-center">${getPixelAstralEmeraldSvg(16)}</span>
                            </div>
                        </div>
                        <div class="text-xs text-purple-200/80 font-['VT323'] leading-tight text-center px-1">${t.subtitle}</div>
                    </div>
                    <div class="exchange-card-btn-wrap">${btnHtml}</div>
                </div>
            `;
        }).join('');
    }

    export function performShopAstralExchange(emeraldCost, astralGain) {
        performAstralExchange(emeraldCost, astralGain);
        const astralCount = document.getElementById('shop-astral-count');
        if (astralCount) astralCount.innerText = getPlayerAstralEmeralds().toLocaleString();
        const emeraldsCount = document.getElementById('shop-emeralds-count');
        if (emeraldsCount) emeraldsCount.innerText = getPlayerEmeralds().toLocaleString();
        renderShopAstralExchange();
    }

    function renderShopAtlasOutpost() {
        const grid = document.getElementById('shop-atlas-grid');
        const header = document.getElementById('shop-atlas-header');
        if (!grid) return;

        const talked = typeof hasPlayerTalkedToKael === 'function' ? hasPlayerTalkedToKael() : false;
        if (!talked) {
            if (header) header.style.display = 'none';
            grid.className = 'flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto custom-scrollbar';
            grid.innerHTML = `
                <div class="w-full max-w-md bg-[#171b20] border-2 border-[#46515a] shadow-[inset_0_0_24px_rgba(0,0,0,0.8),_4px_4px_0_rgba(0,0,0,0.4)] p-6 text-center flex flex-col items-center justify-center gap-3 my-auto select-none">
                    <div class="w-16 h-16 flex items-center justify-center bg-purple-950/70 border-2 border-purple-500/60 shadow-[0_0_16px_rgba(168,85,247,0.35)]">
                        <svg viewBox="0 0 16 16" width="36" height="36" style="image-rendering: pixelated; shape-rendering: crispEdges;">
                            <rect x="5" y="2" width="6" height="5" fill="#c084fc"/>
                            <rect x="7" y="4" width="2" height="3" fill="#171b20"/>
                            <rect x="3" y="7" width="10" height="8" fill="#7e22ce"/>
                            <rect x="4" y="8" width="8" height="6" fill="#a855f7"/>
                            <rect x="7" y="10" width="2" height="2" fill="#facc15"/>
                            <rect x="7" y="12" width="2" height="1" fill="#facc15"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl sm:text-3xl font-bold font-['VT323'] text-amber-400 tracking-wider m-0 drop-shadow-[2px_2px_0_#080a0c]">
                        PLANAR OUTPOST LOCKED
                    </h3>
                    <div class="px-2.5 py-0.5 bg-amber-950/70 border border-amber-500/60 text-amber-300 font-['VT323'] text-sm uppercase tracking-widest">
                        First Interaction Required
                    </div>
                    <p class="text-gray-200 font-['VT323'] text-xl leading-snug max-w-sm m-0 drop-shadow-[1px_1px_0_#000]">
                        You have not met <span class="text-purple-300 font-bold">Kael, The Atlas Explorer</span> in this world yet!
                    </p>
                    <div class="bg-[#101317] border border-[#2c333a] p-3 text-left w-full mt-1">
                        <p class="text-gray-300 font-['VT323'] text-base leading-normal m-0">
                            ✦ Kael arrives through a planar rift on <strong class="text-amber-300 font-bold">Day 14</strong>.
                        </p>
                        <p class="text-gray-400 font-['VT323'] text-base leading-normal m-0 mt-1">
                            ✦ Find and speak with Kael to establish contact and reveal his Outpost wares.
                        </p>
                    </div>
                    <span class="text-xs text-purple-300/80 font-['VT323'] tracking-wider mt-1">
                        Shop contents are hidden until planar contact is made.
                    </span>
                </div>
            `;
            return;
        }

        if (header) header.style.display = '';
        grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 overflow-y-auto custom-scrollbar flex-1 min-h-0 p-1';

        const catalog = (typeof window !== 'undefined' && window.ATLAS_CATALOG) ? window.ATLAS_CATALOG : (typeof ATLAS_CATALOG !== 'undefined' ? ATLAS_CATALOG : []);
        const astralGems = typeof getPlayerAstralEmeralds === 'function' ? getPlayerAstralEmeralds() : 0;
        const isGuest = !currentUserProfile || currentUserProfile.isGuest;
        const astralSrc = (typeof textures !== 'undefined' && textures && textures[IDS?.ASTRAL_EMERALD]?.src) || '';

        grid.innerHTML = catalog.map(item => {
            const stock = (typeof window !== 'undefined' && window.AtlasTradeManager) ? window.AtlasTradeManager.getStock(item.id) : item.baseStock;
            const canAfford = !isGuest && astralGems >= item.cost;
            const inStock = stock > 0;
            const itemSrc = (typeof textures !== 'undefined' && textures && textures[item.itemId]?.src) || '';

            let categoryName = 'Relic';
            let categoryColor = '#c084fc';
            if (item.category === 'flora') {
                categoryName = 'Exotic Flora';
                categoryColor = '#34d399';
            } else if (item.category === 'relic') {
                categoryName = 'Audio Relic';
                categoryColor = '#f472b6';
            } else if (item.category === 'gear') {
                categoryName = 'Cosmic Gear';
                categoryColor = '#fbbf24';
            } else if (item.category === 'tiles') {
                categoryName = 'Planar Block';
                categoryColor = '#38bdf8';
            } else if (item.category === 'material') {
                categoryName = 'Stellar Shard';
                categoryColor = '#a855f7';
            }

            let buttonLabel = 'Buy';
            let buttonDisabled = '';
            let buttonClass = '!bg-[#7c3aed] hover:!bg-[#6d28d9] !text-white';
            if (isGuest) {
                buttonLabel = 'Sign In';
            } else if (!inStock) {
                buttonLabel = 'Sold Out';
                buttonDisabled = 'disabled';
                buttonClass = '!bg-[#2d353e] !text-[#64748b] opacity-60 cursor-not-allowed';
            } else if (!canAfford) {
                const diff = item.cost - astralGems;
                buttonLabel = `Need ${diff} ✦`;
                buttonDisabled = 'disabled';
                buttonClass = '!bg-[#382645] !text-[#d8b4fe] opacity-80 cursor-not-allowed';
            }

            return `
                <div class="atlas-market-card flex flex-col justify-between">
                    <div>
                        <!-- Category Badge + Stock Indicator -->
                        <div class="flex justify-between items-center mb-1.5">
                            <span class="atlas-ware-badge text-xs" style="background: ${categoryColor}18; color: ${categoryColor}; border: 1px solid ${categoryColor}66; padding: 1px 6px;">
                                ${categoryName}
                            </span>
                            ${inStock ? `
                                <span class="px-1.5 py-0.5 text-xs font-['VT323'] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-600/50 flex items-center gap-1 shadow-inner">
                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span>STOCK: ${stock}/${item.baseStock}</span>
                                </span>
                            ` : `
                                <span class="px-1.5 py-0.5 text-xs font-['VT323'] font-bold text-red-400 bg-red-950/60 border border-red-600/50 shadow-inner">
                                    SOLD OUT
                                </span>
                            `}
                        </div>

                        <!-- Item Icon + Name + Description -->
                        <div class="flex items-start gap-2.5 mb-1.5">
                            <div class="cosmetic-card-icon flex-shrink-0">
                                ${itemSrc ? `<img src="${itemSrc}" class="pixelated w-7 h-7 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" alt="${item.name}" />` : ''}
                            </div>
                            <div class="flex-1 min-w-0 text-left">
                                <div class="text-base sm:text-lg font-bold text-purple-200 font-['VT323'] leading-tight truncate drop-shadow-[1px_1px_0_#000]">${item.name}</div>
                                <p class="text-xs text-[#95a5b5] font-['VT323'] leading-snug line-clamp-2 m-0 mt-0.5 drop-shadow-[1px_1px_0_#000]">${item.description}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Footer: Astral Cost Box + Action Button -->
                    <div class="flex items-center justify-between pt-1.5 border-t border-[#2b3542] mt-auto">
                        <div class="flex items-center gap-1 bg-[#12161b] px-2 py-0.5 border border-[#2b3542] shadow-inner">
                            ${astralSrc ? `<img src="${astralSrc}" class="pixelated w-4 h-4 object-contain" alt="Astral Gem" />` : ''}
                            <span class="text-lg font-bold text-[#c084fc] font-['VT323'] leading-none drop-shadow-[1px_1px_0_#000]">${item.cost}</span>
                            <span class="text-[10px] text-purple-300 font-['VT323'] uppercase">✦</span>
                        </div>
                        <button class="mc-btn ${buttonClass} !w-auto !min-w-[70px] !px-2.5 !py-0.5 !text-base !font-['VT323']"
                                onclick="purchaseAtlasWareFromShop('${item.id}')" ${buttonDisabled}>
                            ${buttonLabel}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    export function purchaseAtlasWareFromShop(wareId) {
        if (typeof hasPlayerTalkedToKael === 'function' && !hasPlayerTalkedToKael()) {
            showToast("Planar Outpost locked: Meet Kael on Day 14 first.");
            return;
        }
        if (typeof window !== 'undefined' && window.AtlasTradeManager && typeof window.AtlasTradeManager.buyItem === 'function') {
            window.AtlasTradeManager.buyItem(wareId);
            const astralCount = document.getElementById('shop-astral-count');
            if (astralCount) astralCount.innerText = getPlayerAstralEmeralds().toLocaleString();
            renderShopAtlasOutpost();
        } else {
            showToast("Atlas Explorer market is currently unavailable in this dimension.");
        }
    }

    export async function handleProfileAuthAction() {
        loadUserProfile();
        const isGuest = !currentUserProfile || currentUserProfile.isGuest;
        closeProfileDetailsModal();
        if (isGuest) {
            openAuthProfileModal('credentials');
        } else {
            await handleProfileSignOut();
        }
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
        if (typeof DevConsole !== 'undefined' && DevConsole.isOpen) {
            DevConsole.close();
        } else if (typeof window !== 'undefined' && window.DevConsole && window.DevConsole.isOpen) {
            window.DevConsole.close();
        }
        if (!isMenuInit) {
            generateMenuWorld();
        }
        if (typeof drawMenuBackground === 'function') drawMenuBackground();
        if (typeof dismissBootLoadingScreen === 'function') {
            dismissBootLoadingScreen();
        } else if (typeof window !== 'undefined' && typeof window.dismissBootLoadingScreen === 'function') {
            window.dismissBootLoadingScreen();
        }
        compileSkinCanvas();
        if (typeof drawPlayerPreview === 'function') drawPlayerPreview(true);
        updateMainMenuProfileBadge();
        updateEmeraldsUI();
        syncCurrencyTextureImages();
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
        if (typeof dismissBootLoadingScreen === 'function') {
            dismissBootLoadingScreen();
        } else if (typeof window !== 'undefined' && typeof window.dismissBootLoadingScreen === 'function') {
            window.dismissBootLoadingScreen();
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
            if (skipHint) skipHint.innerHTML = 'Press SPACE or Click anywhere to enter <a href="https://github.com/raresh06/webcraft2d-game" target="_blank" rel="noopener noreferrer" class="game-github-link text-amber-300 hover:text-amber-200 underline" title="Visit Webcraft2D on GitHub">Webcraft2D</a>';
            introPhaseLockUntil = Date.now() + 700;
            introTimer = setTimeout(advanceIntro, 14000);
        } else {
            if (Date.now() < introPhaseLockUntil) return;
            finishIntro();
        }
    }

    export function startIntro() {
        if (typeof dismissBootLoadingScreen === 'function') {
            dismissBootLoadingScreen();
        } else if (typeof window !== 'undefined' && typeof window.dismissBootLoadingScreen === 'function') {
            window.dismissBootLoadingScreen();
        }
        if (!introEnabled) { showMainMenu(); return; }
        introPhase = 0;
        introPhaseLockUntil = 0;
        const intro = document.getElementById('game-intro');
        if (!intro) { showMainMenu(); return; }
        intro.style.pointerEvents = 'auto';
        intro.onclick = (e) => {
            if (e && e.target && typeof e.target.closest === 'function' && e.target.closest('a, .author-github-link, .game-github-link')) {
                return;
            }
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
        if (!Array.isArray(compressed) || compressed.length === 0 || compressed.length % 2 !== 0) {
            return Array.from({ length: width }, () => Array(height).fill(IDS.AIR));
        }
        const restoredWorld = Array.from({ length: width }, () => new Array(height));
        let flatIndex = 0;
        const totalBlocks = width * height;
        for (let index = 0; index < compressed.length; index += 2) {
            const blockId = compressed[index];
            const count = compressed[index + 1];
            if (!Number.isInteger(blockId) || !Number.isInteger(count) || count < 1) continue;
            for (let offset = 0; offset < count; offset++) {
                if (flatIndex >= totalBlocks) break;
                const x = Math.floor(flatIndex / height);
                const y = flatIndex % height;
                restoredWorld[x][y] = blockId;
                flatIndex++;
            }
        }
        while (flatIndex < totalBlocks) {
            const x = Math.floor(flatIndex / height);
            const y = flatIndex % height;
            restoredWorld[x][y] = IDS.AIR;
            flatIndex++;
        }
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

    export function isWorldVersion015(gameVersion, gameBuild) {
        if (!gameVersion && !gameBuild) return false;
        return gameVersion === '0.1.5' || gameBuild === 'webcraft2d-beta-0.1.5';
    }

    export function isWorldVersionCompatible(gameVersion, gameBuild) {
        if (gameVersion === GAME_VERSION && gameBuild === GAME_BUILD) return true;
        if (isWorldVersion015(gameVersion, gameBuild)) return true;
        return false;
    }

    export let pendingConvertWorldId = null;

    export function promptConvertWorld015(id) {
        const worlds = getSavedWorlds();
        const w = worlds.find(item => item.id === id);
        if (!w) {
            showToast('World not found.');
            return;
        }
        pendingConvertWorldId = id;
        const modal = typeof document !== 'undefined' ? document.getElementById('convert-world-modal') : null;
        if (!modal) {
            const proceed = confirm(`Convert World to Beta 0.1.6?\n\nWorld: "${w.name}"\n\nThis world was created in Beta 0.1.5. Converting will safely upgrade it to Beta 0.1.6 with smarter mob AI, door breaching, and combat mechanics while preserving all your structures and items.\n\nClick OK to Convert & Play, or Cancel to abort.`);
            if (proceed) {
                confirmConvertWorld015();
            }
            return;
        }
        const nameEl = document.getElementById('convert-world-name');
        const metaEl = document.getElementById('convert-world-meta');
        if (nameEl) nameEl.textContent = w.name;
        if (metaEl) {
            const sizeText = (w.worldSize || (w.worldWidth > 700 ? 'big' : 'small')).toUpperCase();
            const diffText = (w.difficulty || 'normal').toUpperCase();
            metaEl.textContent = `Day ${w.dayCount || 1} • ${sizeText} World • ${diffText} Difficulty`;
        }
        const backupBtn = document.getElementById('btn-convert-world-backup');
        if (backupBtn) {
            backupBtn.textContent = 'Download Backup';
            backupBtn.classList.remove('!text-emerald-400', '!border-emerald-500');
            backupBtn.classList.add('!text-white');
        }
        modal.classList.remove('hidden');
    }

    export function closeConvertWorldModal() {
        const modal = typeof document !== 'undefined' ? document.getElementById('convert-world-modal') : null;
        if (modal) modal.classList.add('hidden');
        pendingConvertWorldId = null;
    }

    export function confirmConvertWorld015() {
        if (!pendingConvertWorldId) return;
        const idToLoad = pendingConvertWorldId;
        closeConvertWorldModal();
        loadWorld(idToLoad, true);
    }

    export function exportBackup015Only() {
        if (!pendingConvertWorldId) return;
        const worlds = getSavedWorlds();
        const w = worlds.find(item => item.id === pendingConvertWorldId);
        if (w) {
            exportWorld(w.id, (w.name || 'world') + '_v0.1.5_backup');
            if (typeof showToast === 'function') {
                showToast('0.1.5 World backup exported!');
            }
            const backupBtn = document.getElementById('btn-convert-world-backup');
            if (backupBtn) {
                backupBtn.textContent = 'Backup Saved ✓';
                backupBtn.classList.remove('!text-white');
                backupBtn.classList.add('!text-emerald-400');
            }
        }
    }

    export function exportBackupAndConvert015() {
        if (!pendingConvertWorldId) return;
        const worlds = getSavedWorlds();
        const w = worlds.find(item => item.id === pendingConvertWorldId);
        if (w) {
            exportWorld(w.id, (w.name || 'world') + '_v0.1.5_backup');
            if (typeof showToast === 'function') {
                showToast('0.1.5 World backup exported!');
            }
        }
        confirmConvertWorld015();
    }

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    export let currentWorldViewMode = typeof localStorage !== 'undefined' ? (localStorage.getItem('swc_worlds_view_mode') || 'grid') : 'grid';
    export let worldSearchQuery = '';

    export function setWorldViewMode(mode) {
        currentWorldViewMode = (mode === 'list') ? 'list' : 'grid';
        try { localStorage.setItem('swc_worlds_view_mode', currentWorldViewMode); } catch(e) {}
        renderWorldsList();
    }

    export function filterWorldsSearch(val) {
        worldSearchQuery = (val || '').trim().toLowerCase();
        renderWorldsList();
    }

    export function playWorldById(id) {
        const worlds = getSavedWorlds();
        const w = worlds.find(item => item.id === id);
        if (!w) {
            showToast('World not found.');
            return;
        }
        const isCurrentVersion = (w.gameVersion === GAME_VERSION && w.gameBuild === GAME_BUILD);
        const is015 = isWorldVersion015(w.gameVersion, w.gameBuild);
        const isCompatible = isCurrentVersion || is015;

        if (!isCompatible) {
            showToast(`Cannot play world '${w.name}': Incompatible version (Created in v${w.gameVersion || 'older'}, Client is v${GAME_VERSION}).`);
            return;
        }
        if (is015) {
            promptConvertWorld015(w.id);
        } else {
            loadWorld(w.id);
        }
    }

    export function duplicateWorld(id) {
        const worlds = getSavedWorlds();
        const sourceWorld = worlds.find(w => w.id === id);
        if (!sourceWorld) return;

        const rawData = localStorage.getItem('swc_data_' + id);
        if (!rawData) {
            showToast('Cannot duplicate world: save data missing.');
            return;
        }

        const newId = 'world_' + Date.now();
        const newName = `Copy of ${sourceWorld.name}`;

        try {
            const clonedData = JSON.parse(rawData);
            localStorage.setItem('swc_data_' + newId, JSON.stringify(clonedData));

            const clonedWorld = {
                ...sourceWorld,
                id: newId,
                name: newName,
                lastPlayed: Date.now()
            };
            worlds.unshift(clonedWorld);
            saveWorldsList(worlds);
            renderWorldsList();
            showToast(`Duplicated "${sourceWorld.name}"!`);
        } catch (e) {
            console.error('Failed to duplicate world', e);
            showToast('Failed to duplicate world.');
        }
    }

    export function renameWorld(id) {
        const worlds = getSavedWorlds();
        const targetWorld = worlds.find(w => w.id === id);
        if (!targetWorld) return;

        const newName = prompt('Enter new world name:', targetWorld.name);
        if (newName && newName.trim() && newName.trim() !== targetWorld.name) {
            targetWorld.name = newName.trim().slice(0, 28);
            saveWorldsList(worlds);
            renderWorldsList();
            showToast(`World renamed to "${targetWorld.name}"`);
        }
    }

    export function renderWorldsList() {
        const listEl = document.getElementById('worlds-list');
        if (!listEl) return;
        listEl.innerHTML = '';

        // Update view mode toggle buttons state
        const btnGrid = document.getElementById('btn-view-grid');
        const btnList = document.getElementById('btn-view-list');
        if (btnGrid) {
            btnGrid.classList.toggle('is-on', currentWorldViewMode === 'grid');
            btnGrid.classList.toggle('is-off', currentWorldViewMode !== 'grid');
        }
        if (btnList) {
            btnList.classList.toggle('is-on', currentWorldViewMode === 'list');
            btnList.classList.toggle('is-off', currentWorldViewMode !== 'list');
        }

        let allWorlds = getSavedWorlds();
        let worlds = allWorlds.slice().sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));

        // Filter by search query if any
        if (worldSearchQuery) {
            worlds = worlds.filter(w => (w.name || '').toLowerCase().includes(worldSearchQuery));
        }

        const summaryCountEl = document.getElementById('worlds-summary-count');
        if (summaryCountEl) {
            if (worldSearchQuery) {
                summaryCountEl.innerText = `${worlds.length} of ${allWorlds.length} Worlds Matching "${worldSearchQuery}"`;
            } else {
                summaryCountEl.innerText = `${allWorlds.length} World${allWorlds.length === 1 ? '' : 's'} Found`;
            }
        }

        if (worlds.length === 0) {
            if (allWorlds.length === 0) {
                listEl.innerHTML = `
                    <div class="worlds-empty-state">
                        <p class="worlds-empty-title">No worlds found</p>
                        <p class="worlds-empty-desc">Create your first 2D sandbox world to begin surviving!</p>
                        <button type="button" class="mc-btn btn-primary worlds-empty-btn" onclick="openNewWorldModal()">+ Create New World</button>
                    </div>
                `;
            } else {
                listEl.innerHTML = `
                    <div class="worlds-empty-state">
                        <p class="worlds-empty-title">No matching worlds found</p>
                        <p class="worlds-empty-desc">No worlds match "${worldSearchQuery}"</p>
                        <button type="button" class="mc-btn btn-secondary !w-auto !py-2 !px-6 !text-xl" onclick="document.getElementById('world-search-input').value = ''; filterWorldsSearch('');">Clear Search</button>
                    </div>
                `;
            }
            return;
        }

        if (currentWorldViewMode === 'grid') {
            const gridEl = document.createElement('div');
            gridEl.className = 'world-cards-grid';

            worlds.forEach(w => {
                const hasSaveData = (typeof localStorage !== 'undefined') && !!localStorage.getItem('swc_data_' + w.id);
                const difficulty = (w.difficulty || 'normal').toLowerCase();
                const diffName = difficulty.toUpperCase();
                const sizeName = (w.worldSize || (w.worldWidth > 700 ? 'big' : 'small')).toUpperCase();
                const gameMode = (w.gameMode || 'survival').toLowerCase();
                const isCreative = gameMode === 'creative';
                const isCurrentVersion = (w.gameVersion === GAME_VERSION && w.gameBuild === GAME_BUILD);
                const is015 = isWorldVersion015(w.gameVersion, w.gameBuild);
                const isCompatible = isCurrentVersion || is015;

                let thumbUrl = w.thumbnail;
                if (!thumbUrl && typeof generateProceduralThumbnail === 'function') {
                    thumbUrl = generateProceduralThumbnail({
                        seed: w.seed || w.id,
                        biome: w.startingBiome || 'plains',
                        worldSize: w.worldSize || 'small',
                        mode: gameMode,
                        dayCount: w.dayCount || 1
                    });
                    w.thumbnail = thumbUrl;
                }

                const card = document.createElement('div');
                card.className = `world-card ${!isCompatible ? 'opacity-65' : ''}`;
                card.dataset.id = w.id;

                const escapedName = escapeHtml(w.name);
                card.innerHTML = `
                    <div class="world-card-thumb-wrap" onclick="playWorldById('${w.id}')" title="Play ${escapedName}">
                        ${thumbUrl ? `<img src="${thumbUrl}" alt="${escapedName}" class="world-card-thumb" loading="lazy">` : `<div class="w-full h-full bg-[#12161b] flex items-center justify-center text-gray-500 font-['VT323'] text-xl">No Preview</div>`}
                        <div class="world-card-play-overlay">
                            <div class="world-card-play-badge">
                                <svg viewBox="0 0 16 16" width="14" height="14" style="image-rendering:pixelated;shape-rendering:crispEdges;"><polygon points="4,2 14,8 4,14" fill="#ffffff"/></svg>
                                PLAY WORLD
                            </div>
                        </div>
                    </div>
                    <div class="world-card-body">
                        <div class="flex items-center justify-between gap-1">
                            <h2 class="world-card-name" title="${escapedName}">${escapedName}</h2>
                        </div>
                        <div class="flex flex-wrap items-center gap-1.5 my-0.5">
                            <span class="world-badge ${isCreative ? 'world-badge-mode-creative' : 'world-badge-mode'} font-['VT323']">${isCreative ? 'CREATIVE' : 'SURVIVAL'}</span>
                            <span class="world-badge font-['VT323'] bg-slate-700 text-slate-200">${sizeName}</span>
                            <span class="world-badge world-badge-difficulty-${difficulty} font-['VT323']">${diffName}</span>
                            <span class="world-badge ${isCurrentVersion ? 'world-badge-version' : (is015 ? 'world-badge-version !bg-emerald-900 !text-emerald-100 border border-emerald-500/50' : 'world-badge-version-invalid')} font-['VT323']">v${w.gameVersion || (is015 ? '0.1.5' : 'older')}</span>
                            ${is015 ? '<span class="world-badge font-[\'VT323\'] bg-amber-700/85 text-amber-100 border border-amber-500/50" title="Convert to Beta 0.1.6">CONVERTIBLE</span>' : ''}
                            ${!isCompatible ? '<span class="world-badge world-badge-version-invalid font-[\'VT323\']">INCOMPATIBLE</span>' : ''}
                            ${!hasSaveData ? '<span class="world-badge font-[\'VT323\'] bg-amber-700 text-amber-100" title="Save data missing">NO SAVE DATA</span>' : ''}
                        </div>
                        <p class="text-sm font-['VT323'] text-gray-300 leading-tight">
                            Day ${w.dayCount || 1} • Last played ${w.lastPlayed ? new Date(w.lastPlayed).toLocaleDateString() : 'Recently'}
                        </p>
                        <div class="world-card-actions">
                            <button type="button" class="mc-btn btn-primary !w-auto !py-1 !px-3 !text-lg !m-0 flex items-center gap-1" onclick="playWorldById('${w.id}')" title="Play World">
                                ▶ Play
                            </button>
                            <div class="flex items-center gap-1">
                                <button type="button" class="mc-btn btn-secondary !w-8 !h-8 !p-0 !text-base !m-0 flex items-center justify-center" onclick="renameWorld('${w.id}')" title="Rename World">
                                    <svg viewBox="0 0 16 16" width="14" height="14" style="image-rendering:pixelated;shape-rendering:crispEdges;"><polygon points="12,1 15,4 6,13 3,13 3,10" fill="#f8fafc"/><rect x="1" y="15" width="14" height="1" fill="#94a3b8"/></svg>
                                </button>
                                <button type="button" class="mc-btn btn-secondary !w-8 !h-8 !p-0 !text-base !m-0 flex items-center justify-center" onclick="duplicateWorld('${w.id}')" title="Duplicate World (Clone)">
                                    <svg viewBox="0 0 16 16" width="14" height="14" style="image-rendering:pixelated;shape-rendering:crispEdges;"><rect x="5" y="2" width="9" height="9" fill="none" stroke="#f8fafc" stroke-width="1.5"/><rect x="2" y="5" width="9" height="9" fill="#38bdf8"/></svg>
                                </button>
                                <button type="button" class="mc-btn btn-secondary !w-8 !h-8 !p-0 !text-base !m-0 flex items-center justify-center" onclick="exportWorld('${w.id}', '${escapedName}')" title="Export World JSON">
                                    <svg viewBox="0 0 16 16" width="14" height="14" style="image-rendering:pixelated;shape-rendering:crispEdges;"><path d="M8 2v8m-3-3l3 3 3-3M2 13h12" stroke="#f8fafc" stroke-width="1.5" fill="none"/></svg>
                                </button>
                                <button type="button" class="mc-btn !w-8 !h-8 !p-0 !text-base !m-0 !bg-red-700 hover:!bg-red-600 !text-white flex items-center justify-center" onclick="deleteWorld('${w.id}')" title="Delete World">
                                    <svg viewBox="0 0 16 16" width="14" height="14" style="image-rendering:pixelated;shape-rendering:crispEdges;"><rect x="4" y="2" width="8" height="2" fill="#ffffff"/><rect x="3" y="4" width="10" height="10" fill="#ffffff"/><rect x="5" y="6" width="2" height="6" fill="#dc2626"/><rect x="9" y="6" width="2" height="6" fill="#dc2626"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                gridEl.appendChild(card);
            });
            listEl.appendChild(gridEl);
        } else {
            // List view mode: compact rows
            const rowsWrap = document.createElement('div');
            rowsWrap.className = 'flex flex-col gap-2 w-full';

            worlds.forEach(w => {
                const hasSaveData = (typeof localStorage !== 'undefined') && !!localStorage.getItem('swc_data_' + w.id);
                const difficulty = (w.difficulty || 'normal').toLowerCase();
                const diffName = difficulty.toUpperCase();
                const sizeName = (w.worldSize || (w.worldWidth > 700 ? 'big' : 'small')).toUpperCase();
                const gameMode = (w.gameMode || 'survival').toLowerCase();
                const isCreative = gameMode === 'creative';
                const isCurrentVersion = (w.gameVersion === GAME_VERSION && w.gameBuild === GAME_BUILD);
                const is015 = isWorldVersion015(w.gameVersion, w.gameBuild);
                const isCompatible = isCurrentVersion || is015;

                let thumbUrl = w.thumbnail;
                if (!thumbUrl && typeof generateProceduralThumbnail === 'function') {
                    thumbUrl = generateProceduralThumbnail({
                        seed: w.seed || w.id,
                        biome: w.startingBiome || 'plains',
                        worldSize: w.worldSize || 'small',
                        mode: gameMode,
                        dayCount: w.dayCount || 1
                    });
                    w.thumbnail = thumbUrl;
                }

                const row = document.createElement('div');
                row.className = `world-row flex items-center justify-between gap-3 p-2.5 cursor-pointer ${!isCompatible ? 'opacity-70' : ''}`;
                row.tabIndex = 0;
                row.setAttribute('role', 'button');

                const escapedName = escapeHtml(w.name);
                row.innerHTML = `
                    <div class="flex items-center gap-3 min-w-0 flex-1" onclick="playWorldById('${w.id}')">
                        <div class="w-20 h-12 bg-[#090d16] border-2 border-[#46515a] overflow-hidden shrink-0 shadow">
                            ${thumbUrl ? `<img src="${thumbUrl}" alt="${escapedName}" class="w-full h-full object-cover pixelated" loading="lazy">` : `<div class="w-full h-full flex items-center justify-center font-['VT323'] text-xs text-gray-500">No Art</div>`}
                        </div>
                        <div class="flex flex-col min-w-0 flex-1">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="world-name text-2xl font-bold font-['VT323'] leading-none truncate">${escapedName}</span>
                                <span class="world-badge ${isCreative ? 'world-badge-mode-creative' : 'world-badge-mode'} font-['VT323']">${isCreative ? 'CREATIVE' : 'SURVIVAL'}</span>
                                <span class="world-badge font-['VT323'] bg-slate-700 text-slate-200">${sizeName}</span>
                                <span class="world-badge world-badge-difficulty-${difficulty} font-['VT323']">${diffName}</span>
                                <span class="world-badge ${isCurrentVersion ? 'world-badge-version' : (is015 ? 'world-badge-version !bg-emerald-900 !text-emerald-100 border border-emerald-500/50' : 'world-badge-version-invalid')} font-['VT323']">v${w.gameVersion || (is015 ? '0.1.5' : 'older')}</span>
                                ${is015 ? '<span class="world-badge font-[\'VT323\'] bg-amber-700/85 text-amber-100 border border-amber-500/50">CONVERTIBLE</span>' : ''}
                                ${!isCompatible ? '<span class="world-badge world-badge-version-invalid font-[\'VT323\']">INCOMPATIBLE</span>' : ''}
                                ${!hasSaveData ? '<span class="world-badge font-[\'VT323\'] bg-amber-700 text-amber-100">NO SAVE DATA</span>' : ''}
                            </div>
                            <p class="world-meta text-lg font-['VT323'] font-bold mt-0.5 text-gray-300">
                                Day ${w.dayCount || 1} • Last played ${w.lastPlayed ? new Date(w.lastPlayed).toLocaleString() : 'Recently'}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0" onclick="event.stopPropagation()">
                        <button type="button" class="mc-btn btn-primary !w-auto !py-1 !px-3 !text-lg !m-0" onclick="playWorldById('${w.id}')" title="Play"><svg viewBox="0 0 16 16" width="12" height="12" style="image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg"><polygon points="3,1 14,8 3,15" fill="#ffffff"/></svg></button>
                        <button type="button" class="mc-btn btn-secondary !w-9 !h-8 !p-0 !text-sm !m-0 flex items-center justify-center" onclick="renameWorld('${w.id}')" title="Rename"><svg viewBox="0 0 16 16" width="12" height="12" style="image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg"><polygon points="12,1 15,4 6,13 3,13 3,10" fill="#f8fafc"/><rect x="1" y="15" width="14" height="1" fill="#94a3b8"/></svg></button>
                        <button type="button" class="mc-btn btn-secondary !w-9 !h-8 !p-0 !text-sm !m-0 flex items-center justify-center" onclick="duplicateWorld('${w.id}')" title="Duplicate"><svg viewBox="0 0 16 16" width="12" height="12" style="image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="7" height="10" fill="#64748b"/><rect x="6" y="1" width="7" height="10" fill="#cbd5e1"/></svg></button>
                        <button type="button" class="mc-btn btn-secondary !w-9 !h-8 !p-0 !text-sm !m-0 flex items-center justify-center" onclick="exportWorld('${w.id}', '${escapedName}')" title="Export"><svg viewBox="0 0 16 16" width="12" height="12" style="image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="1" width="2" height="8" fill="#ffffff"/><polygon points="4,9 12,9 8,14" fill="#ffffff"/></svg></button>
                        <button type="button" class="mc-btn !w-9 !h-8 !p-0 !text-sm !m-0 !bg-red-700 hover:!bg-red-600 !text-white flex items-center justify-center" onclick="deleteWorld('${w.id}')" title="Delete"><svg viewBox="0 0 16 16" width="12" height="12" style="image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="2" height="2" fill="#ffffff"/><rect x="4" y="4" width="2" height="2" fill="#ffffff"/><rect x="6" y="6" width="4" height="4" fill="#ffffff"/><rect x="10" y="4" width="2" height="2" fill="#ffffff"/><rect x="12" y="2" width="2" height="2" fill="#ffffff"/><rect x="4" y="10" width="2" height="2" fill="#ffffff"/><rect x="2" y="12" width="2" height="2" fill="#ffffff"/><rect x="10" y="10" width="2" height="2" fill="#ffffff"/><rect x="12" y="12" width="2" height="2" fill="#ffffff"/></svg></button>
                    </div>
                `;
                rowsWrap.appendChild(row);
            });
            listEl.appendChild(rowsWrap);
        }
    }

    export function openNewWorldModal() {
        const modal = document.getElementById('new-world-modal');
        if (!modal) return;
        modal.classList.remove('hidden');

        // Reset to General tab
        switchCreateWorldTab('general');

        // Reset name
        const nameInput = document.getElementById('new-world-name');
        if (nameInput) {
            nameInput.value = 'New World';
            nameInput.focus();
        }

        // Reset game mode
        selectGameMode('survival');

        // Reset difficulty
        selectDifficulty('normal');

        // Reset world size
        selectWorldSize('small');

        // Reset seed
        const seedInput = document.getElementById('new-world-seed');
        if (seedInput) {
            seedInput.value = '';
        }

        // Reset starting biome
        selectStartingBiome('plains');

        // Reset toggle checkboxes
        const resetToggle = (chkId, btnId, defaultVal) => {
            const chk = document.getElementById(chkId);
            if (chk) {
                chk.checked = defaultVal;
                updateToggleBtnState(btnId, defaultVal);
            }
        };

        resetToggle('new-world-starter-items', 'btn-new-world-starter-items', true);
        resetToggle('new-world-keep-inventory', 'btn-new-world-keep-inventory', true);
        resetToggle('new-world-day-cycle', 'btn-new-world-day-cycle', true);
        resetToggle('new-world-mob-spawning', 'btn-new-world-mob-spawning', true);
        resetToggle('new-world-hunger-depletion', 'btn-new-world-hunger-depletion', true);
        resetToggle('new-world-allow-cheats', 'btn-new-world-allow-cheats', false);
        resetToggle('new-world-bonus-chest', 'btn-new-world-bonus-chest', true);
        resetToggle('new-world-natural-regen', 'btn-new-world-natural-regen', true);

        updateNewWorldAchievementWarning();
        updateCreateWorldPreview();
    }

    export function closeNewWorldModal() {
        const modal = document.getElementById('new-world-modal');
        if (modal) modal.classList.add('hidden');
    }

    export function spawnBonusChest(spawn) {
        const curSurfaces = (typeof window !== 'undefined' && window.surfaceHeights) ? window.surfaceHeights : surfaceHeights;
        const curWorld = (typeof window !== 'undefined' && window.world) ? window.world : world;
        const curChests = (typeof window !== 'undefined' && window.chests) ? window.chests : chests;
        if (!curWorld || !curSurfaces) return;

        const spawnTileX = Math.floor(spawn.x / TILE_SIZE);
        const chestTileX = Math.max(5, Math.min(WORLD_WIDTH - 6, spawnTileX + 3));
        const surfaceY = (curSurfaces[chestTileX] !== undefined) ? curSurfaces[chestTileX] : Math.floor(WORLD_HEIGHT / 2);
        const chestTileY = surfaceY - 1;

        if (chestTileY > 2 && curWorld[chestTileX]) {
            curWorld[chestTileX][chestTileY] = IDS.CHEST;
            
            // Place torches beside chest if air
            if (curWorld[chestTileX - 1] && curWorld[chestTileX - 1][chestTileY] === IDS.AIR) {
                curWorld[chestTileX - 1][chestTileY] = IDS.TORCH;
            }
            if (curWorld[chestTileX + 1] && curWorld[chestTileX + 1][chestTileY] === IDS.AIR) {
                curWorld[chestTileX + 1][chestTileY] = IDS.TORCH;
            }

            const chestKey = `${chestTileX}_${chestTileY}`;
            const bonusItems = new Array(27).fill(null);
            bonusItems[0] = { id: IDS.STONE_PICKAXE, count: 1, durability: TOOL_DURABILITY[IDS.STONE_PICKAXE] || 131, maxDurability: TOOL_DURABILITY[IDS.STONE_PICKAXE] || 131 };
            bonusItems[1] = { id: IDS.STONE_AXE, count: 1, durability: TOOL_DURABILITY[IDS.STONE_AXE] || 131, maxDurability: TOOL_DURABILITY[IDS.STONE_AXE] || 131 };
            bonusItems[2] = { id: IDS.APPLE, count: 6 };
            bonusItems[3] = { id: IDS.BREAD, count: 4 };
            bonusItems[4] = { id: IDS.WOOD, count: 16 };
            bonusItems[5] = { id: IDS.TORCH, count: 12 };
            bonusItems[6] = { id: IDS.SAPLING, count: 4 };
            bonusItems[7] = { id: IDS.SEEDS, count: 6 };
            bonusItems[8] = { id: IDS.RAW_PORKCHOP, count: 3 };

            curChests.set(chestKey, { items: bonusItems });
        }
    }

    export function confirmCreateWorld() {
        let name = document.getElementById('new-world-name')?.value.trim() || "New World";
        let seedStr = document.getElementById('new-world-seed')?.value.trim() || '';

        let chosenSize = 'small';
        const activeSizeBtn = document.querySelector('#world-size-selector button.active');
        if (activeSizeBtn && activeSizeBtn.dataset && activeSizeBtn.dataset.size) {
            chosenSize = activeSizeBtn.dataset.size;
        } else if (typeof window !== 'undefined' && window.selectedWorldSizeChoice) {
            chosenSize = window.selectedWorldSizeChoice;
        } else if (selectedWorldSizeChoice) {
            chosenSize = selectedWorldSizeChoice;
        }
        selectedWorldSizeChoice = (chosenSize === 'big') ? 'big' : 'small';
        if (typeof window !== 'undefined') window.selectedWorldSizeChoice = selectedWorldSizeChoice;

        const chosenGameMode = selectedGameModeChoice || 'survival';
        const chosenBiome = selectedStartingBiomeChoice || 'plains';

        closeNewWorldModal();
        
        isMultiplayer = false;
        currentWorldId = 'world_' + Date.now();
        if (typeof setEngineCurrentWorldId === 'function') setEngineCurrentWorldId(currentWorldId);
        setPlayerTalkedToKael(false);
        currentDifficulty = selectedDiffChoice;
        if (typeof setEngineCurrentDifficulty === 'function') setEngineCurrentDifficulty(currentDifficulty);
        if (typeof window !== 'undefined') window.currentDifficulty = currentDifficulty;
        setWorldDimensions(selectedWorldSizeChoice);

        let starterItems = document.getElementById('new-world-starter-items')?.checked ?? true;
        keepInventory = currentDifficulty !== 'hardcore' && (document.getElementById('new-world-keep-inventory')?.checked ?? true);
        const dayCycle = document.getElementById('new-world-day-cycle')?.checked ?? true;
        const mobSpawning = document.getElementById('new-world-mob-spawning')?.checked ?? true;
        const hungerDepletion = document.getElementById('new-world-hunger-depletion')?.checked ?? true;
        const allowCheats = document.getElementById('new-world-allow-cheats')?.checked ?? (chosenGameMode === 'creative');
        const bonusChest = document.getElementById('new-world-bonus-chest')?.checked ?? true;
        const naturalRegen = document.getElementById('new-world-natural-regen')?.checked ?? true;

        currentWorldAchievementsEnabled = (!starterItems && !keepInventory && chosenGameMode !== 'creative' && !allowCheats);

        // Calculate numeric seed from seedStr or roll random
        let seedVal = seedStr.trim();
        if (!seedVal) {
            seedVal = String(Math.floor(Math.random() * 900000000 + 100000000));
        }
        let numericSeed = parseInt(seedVal, 10);
        if (isNaN(numericSeed)) {
            numericSeed = 0;
            for (let i = 0; i < seedVal.length; i++) {
                numericSeed = ((numericSeed << 5) - numericSeed) + seedVal.charCodeAt(i);
                numericSeed |= 0;
            }
            numericSeed = Math.abs(numericSeed);
        }

        // Generate procedural thumbnail
        let initialThumbnail = null;
        if (typeof generateProceduralThumbnail === 'function') {
            initialThumbnail = generateProceduralThumbnail({
                seed: seedVal,
                biome: chosenBiome,
                worldSize: selectedWorldSizeChoice,
                mode: chosenGameMode,
                dayCount: 1
            });
        }

        let worlds = getSavedWorlds();
        worlds.push({
            id: currentWorldId,
            name: name,
            difficulty: currentDifficulty,
            worldSize: currentWorldSize,
            worldWidth: WORLD_WIDTH,
            worldHeight: WORLD_HEIGHT,
            gameMode: chosenGameMode,
            startingBiome: chosenBiome,
            seed: seedVal,
            starterItems,
            keepInventory,
            dayCycle,
            mobSpawning,
            hungerDepletion,
            allowCheats,
            bonusChest,
            naturalRegen,
            achievementsEnabled: currentWorldAchievementsEnabled,
            gameVersion: GAME_VERSION,
            gameBuild: GAME_BUILD,
            lastPlayed: Date.now(),
            dayCount: 1,
            thumbnail: initialThumbnail
        });
        saveWorldsList(worlds);
        
        generateWorld(numericSeed);
        if (typeof window !== 'undefined' && window.world) world = window.world;
        if (typeof window !== 'undefined' && window.surfaceHeights) surfaceHeights = window.surfaceHeights;
        if (typeof setEngineWorld === 'function') setEngineWorld(world);
        if (typeof setEngineSurfaceHeights === 'function') setEngineSurfaceHeights(surfaceHeights);
        if (typeof window !== 'undefined' && window.nonCollidableTreeWood) {
            nonCollidableTreeWood = window.nonCollidableTreeWood;
        }
        if (typeof setEngineNonCollidableTreeWood === 'function') {
            setEngineNonCollidableTreeWood(nonCollidableTreeWood);
        }
        
        const spawn = getInitialSpawnPoint();
        if (!player) player = (typeof window !== 'undefined' && window.player) ? window.player : new Player(spawn.x, spawn.y);
        player.x = spawn.x; player.y = spawn.y;
        player.fallStartY = spawn.y;
        player.isGrounded = true;
        player.health = player.maxHealth; player.hunger = 20; player.exhaustion = 0; player.oxygen = player.maxOxygen;
        player.poisonTimer = 0;
        player.isDead = false; player.vy = 0; player.vx = 0; player.damageCooldown = 60;
        if (typeof setEnginePlayer === 'function') setEnginePlayer(player);
        
        entities = []; furnaces = []; jukeboxes = []; timeOfDay = 0.02; dayCount = 1; frameCount = 0;
        if (typeof RiftExplorerSpawner !== 'undefined' && RiftExplorerSpawner.initNewWorld) RiftExplorerSpawner.initNewWorld();
        if (typeof setEngineFurnaces === 'function') setEngineFurnaces([]);
        if (typeof window !== 'undefined') window.furnaces = [];
        if (typeof setEngineJukeboxes === 'function') setEngineJukeboxes([]);
        if (typeof window !== 'undefined') window.jukeboxes = [];
        if (typeof jukebox !== 'undefined' && jukebox.stop) jukebox.stop();
        if (typeof setEngineTimeOfDay === 'function') setEngineTimeOfDay(0.02);
        if (typeof setEngineDayCount === 'function') setEngineDayCount(1);
        if (typeof setEngineFrameCount === 'function') setEngineFrameCount(0);
        if (typeof window !== 'undefined') {
            window.timeOfDay = 0.02;
            window.dayCount = 1;
            window.frameCount = 0;
        }
        const targetInitialAnimals = getMaxAnimals();
        const centerSpawnX = Math.floor(spawn.x / TILE_SIZE);
        const curSurfaces = (typeof window !== 'undefined' && window.surfaceHeights && window.surfaceHeights.length === WORLD_WIDTH) ? window.surfaceHeights : ((surfaceHeights && surfaceHeights.length === WORLD_WIDTH) ? surfaceHeights : []);
        const curWorld = (typeof window !== 'undefined' && window.world && window.world.length === WORLD_WIDTH) ? window.world : (world || []);
        
        let pigeonCount = 0;
        const targetPigeons = 11;
        const nearCount = Math.round(targetInitialAnimals * 0.62); // ~25 near player
        let spawnAttempts = 0;

        while (entities.length < targetInitialAnimals && spawnAttempts < 450) {
            spawnAttempts++;
            const isNear = entities.length < nearCount;
            let rx;
            if (isNear) {
                // Bigger chunk near the player (8 to 48 tiles away)
                const dist = 8 + Math.floor(Math.random() * 41);
                const side = Math.random() > 0.5 ? 1 : -1;
                rx = centerSpawnX + side * dist;
            } else {
                // Rest distributed across the wider world
                rx = Math.floor(15 + Math.random() * (WORLD_WIDTH - 30));
                if (Math.abs(rx - centerSpawnX) < 20) continue;
            }
            if (rx < 5 || rx >= WORLD_WIDTH - 5) continue;

            let ry = curSurfaces[rx] !== undefined ? curSurfaces[rx] : Math.floor(WORLD_HEIGHT / 2);
            if (ry < WORLD_HEIGHT && curWorld[rx] && (curWorld[rx][ry] === IDS.GRASS || curWorld[rx][ry] === IDS.SNOW || curWorld[rx][ry] === IDS.DIRT)) {
                if (curWorld[rx][ry - 1] !== IDS.AIR || curWorld[rx][ry - 2] !== IDS.AIR) continue;

                const isJungle = typeof getActiveBiomeAt === 'function' && getActiveBiomeAt(rx) === 'jungle';
                if (isJungle && Math.random() < 0.70) {
                    const parrot = new Parrot(rx * TILE_SIZE, (ry - 2) * TILE_SIZE);
                    entities.push(parrot);
                } else if (pigeonCount < targetPigeons && Math.random() < 0.35) {
                    const p1 = new Pigeon(rx * TILE_SIZE, (ry - 2) * TILE_SIZE);
                    entities.push(p1);
                    pigeonCount++;
                    if (Math.random() < 0.45 && pigeonCount < 12 && entities.length < targetInitialAnimals) {
                        const p2 = new Pigeon(rx * TILE_SIZE + 16, (ry - 2) * TILE_SIZE);
                        p1.partner = p2;
                        p2.partner = p1;
                        entities.push(p2);
                        pigeonCount++;
                    }
                } else {
                    let roll = Math.random();
                    let animal;
                    if (roll < 0.25) animal = new Sheep(rx * TILE_SIZE, (ry - 2) * TILE_SIZE);
                    else if (roll < 0.50) animal = new Pig(rx * TILE_SIZE, (ry - 2) * TILE_SIZE);
                    else if (roll < 0.75) animal = new Cow(rx * TILE_SIZE, (ry - 2) * TILE_SIZE);
                    else animal = new Chicken(rx * TILE_SIZE, (ry - 2) * TILE_SIZE);
                    entities.push(animal);
                }
            }
        }
        if (typeof setEngineEntities === 'function') setEngineEntities(entities);
        inventory.fill(null);
        equippedArmor = [null, null, null, null];
        if (typeof setEngineInventory === 'function') setEngineInventory(inventory);
        if (typeof setEngineEquippedArmor === 'function') setEngineEquippedArmor(equippedArmor);
        chests = new Map();
        if (typeof setEngineChests === 'function') setEngineChests(chests);
        if (typeof window !== 'undefined') window.chests = chests;

        // Bonus Chest Spawn
        if (bonusChest) {
            spawnBonusChest(spawn);
        }

        // Creative Mode and Dev Cheats Setup
        if (chosenGameMode === 'creative') {
            window.devCheats = window.devCheats || {};
            window.devCheats.godMode = true;
            window.devCheats.noclip = true;
            window.devCheats.instantMine = true;
            window.devCheats.infiniteOxygen = true;
            window.devCheats.infiniteHunger = true;
        } else if (!allowCheats) {
            if (window.devCheats) {
                window.devCheats.godMode = false;
                window.devCheats.noclip = false;
                window.devCheats.instantMine = false;
            }
        }

        if (starterItems) {
            giveItem(IDS.WOOD_AXE, 1); giveItem(IDS.WOOD_PICKAXE, 1); giveItem(IDS.WOOD, 32); giveItem(IDS.RAW_PORKCHOP, 5); giveItem(IDS.TORCH, 16); giveItem(IDS.SAPLING, 4);
        }
        updateArmorUI();
        updateHudArmorBar();
        const saved = saveCurrentWorld();
        if (!saved) {
            let curWorlds = getSavedWorlds().filter(w => w.id !== currentWorldId);
            saveWorldsList(curWorlds);
            showToast('Warning: Could not save world data to browser storage. Storage quota may be full.');
        }
        
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
        if (!currentWorldId && typeof window !== 'undefined' && window.currentWorldId) {
            currentWorldId = window.currentWorldId;
        }
        if((isMultiplayer && !forceSaveMp) || !currentWorldId) return false;
        const liveTimeOfDay = (typeof window !== 'undefined' && typeof window.timeOfDay === 'number') ? window.timeOfDay : timeOfDay;
        const liveDayCount = (typeof window !== 'undefined' && typeof window.dayCount === 'number') ? window.dayCount : dayCount;
        const liveFrameCount = (typeof window !== 'undefined' && typeof window.frameCount === 'number') ? window.frameCount : frameCount;
        timeOfDay = liveTimeOfDay;
        dayCount = liveDayCount;
        frameCount = liveFrameCount;

        let worlds = getSavedWorlds();
        let wInfo = worlds.find(w => w.id === currentWorldId);
        if(wInfo) {
            wInfo.lastPlayed = Date.now();
            wInfo.dayCount = liveDayCount;
            wInfo.timeOfDay = liveTimeOfDay;
            wInfo.difficulty = currentDifficulty;
            wInfo.gameVersion = GAME_VERSION;
            wInfo.gameBuild = GAME_BUILD;
            wInfo.achievementsEnabled = currentWorldAchievementsEnabled;
            const cv = (typeof document !== 'undefined') ? document.getElementById('gameCanvas') : null;
            if (cv && typeof captureWorldThumbnail === 'function') {
                try {
                    const snap = captureWorldThumbnail(cv);
                    if (snap) {
                        wInfo.thumbnail = snap;
                    }
                } catch(e) {
                    console.warn('Failed to capture world thumbnail', e);
                }
            }
        }
        
        const liveWorld = (typeof window !== 'undefined' && window.world) ? window.world : world;
        const liveBgWorld = (typeof window !== 'undefined' && window.bgWorld) ? window.bgWorld : bgWorld;
        const livePlayer = (typeof window !== 'undefined' && window.player) ? window.player : player;
        const liveEntities = (typeof window !== 'undefined' && Array.isArray(window.entities)) ? window.entities : entities;
        const liveInventory = (typeof window !== 'undefined' && Array.isArray(window.inventory)) ? window.inventory : inventory;
        const liveEquippedArmor = (typeof window !== 'undefined' && Array.isArray(window.equippedArmor)) ? window.equippedArmor : equippedArmor;

        const safeMapToEntries = (m) => {
            if (!m) return {};
            if (m instanceof Map) {
                const obj = {};
                for (const [k, v] of m.entries()) {
                    if (v && Array.isArray(v.items)) {
                        obj[k] = { items: [...v.items] };
                    } else if (Array.isArray(v)) {
                        obj[k] = { items: [...v] };
                    } else if (v && typeof v === 'object') {
                        obj[k] = { ...v };
                    } else {
                        obj[k] = v;
                    }
                }
                return obj;
            }
            if (typeof m === 'object') {
                const obj = {};
                for (const [k, v] of Object.entries(m)) {
                    if (v && Array.isArray(v.items)) {
                        obj[k] = { items: [...v.items] };
                    } else if (Array.isArray(v)) {
                        obj[k] = { items: [...v] };
                    } else if (v && typeof v === 'object') {
                        obj[k] = { ...v };
                    } else {
                        obj[k] = v;
                    }
                }
                return obj;
            }
            return {};
        };
        const safeSetToArray = (s) => {
            if (!s) return [];
            if (s instanceof Set || Array.isArray(s)) return [...s];
            return [];
        };

        let saveData = {
            worldSize: currentWorldSize, worldWidth: WORLD_WIDTH, worldHeight: WORLD_HEIGHT,
            worldRle: compressWorld(liveWorld), bgWorldRle: compressWorld(liveBgWorld),
            fluids: safeMapToEntries((typeof window !== 'undefined' && window.fluids) ? window.fluids : fluids),
            timeOfDay: liveTimeOfDay, dayCount: liveDayCount, frameCount: liveFrameCount,
            difficulty: currentDifficulty, keepInventory, achievementsEnabled: currentWorldAchievementsEnabled,
            gameVersion: GAME_VERSION, gameBuild: GAME_BUILD,
            player: livePlayer ? {
                x: livePlayer.x, y: livePlayer.y,
                health: livePlayer.health, hunger: livePlayer.hunger,
                exhaustion: livePlayer.exhaustion, oxygen: livePlayer.oxygen,
                poisonTimer: livePlayer.poisonTimer || 0, facingRight: livePlayer.facingRight
            } : { x: 50 * TILE_SIZE, y: 50 * TILE_SIZE, health: 20, hunger: 20, exhaustion: 0, oxygen: 20, poisonTimer: 0, facingRight: true },
            inventory: liveInventory, equippedArmor: liveEquippedArmor,
            furnaces: (typeof window !== 'undefined' && Array.isArray(window.furnaces)) ? window.furnaces : (Array.isArray(furnaces) ? furnaces : []),
            jukeboxes: (typeof window !== 'undefined' && Array.isArray(window.jukeboxes)) ? window.jukeboxes : (Array.isArray(jukeboxes) ? jukeboxes : []),
            chests: safeMapToEntries((typeof window !== 'undefined' && window.chests) ? window.chests : chests),
            signs: safeMapToEntries((typeof window !== 'undefined' && window.signs) ? window.signs : signs),
            kaelTalked: typeof hasPlayerTalkedToKael === 'function' ? hasPlayerTalkedToKael() : false,
            riftSpawner: (typeof RiftExplorerSpawner !== 'undefined' && RiftExplorerSpawner.saveState) ? RiftExplorerSpawner.saveState() : null,
            worldBiomes: (typeof worldBiomes !== 'undefined' && Array.isArray(worldBiomes)) ? worldBiomes : ((typeof window !== 'undefined' && Array.isArray(window.worldBiomes)) ? window.worldBiomes : null),
            saplingGrowthQueue: safeMapToEntries((typeof window !== 'undefined' && window.saplingGrowthQueue) ? window.saplingGrowthQueue : saplingGrowthQueue),
            cropGrowthQueue: safeMapToEntries((typeof window !== 'undefined' && window.cropGrowthQueue) ? window.cropGrowthQueue : cropGrowthQueue),
            dirtToGrassQueue: safeMapToEntries((typeof window !== 'undefined' && window.dirtToGrassQueue) ? window.dirtToGrassQueue : dirtToGrassQueue),
            snowRegrowthQueue: safeMapToEntries((typeof window !== 'undefined' && window.snowRegrowthQueue) ? window.snowRegrowthQueue : snowRegrowthQueue),
            treeWoodCells: safeSetToArray((typeof window !== 'undefined' && window.nonCollidableTreeWood) ? window.nonCollidableTreeWood : nonCollidableTreeWood),
            entities: (liveEntities || []).filter(e => e && e.constructor && !e.isDeparted).map(e => ({
                type: e.constructor.name,
                x: e.x,
                y: e.y,
                health: e.health,
                dir: e.dir || 1,
                ...(e.variant !== undefined ? { variant: e.variant } : {}),
                ...(e.isTamed !== undefined ? { isTamed: e.isTamed } : {}),
                ...(e.isSitting !== undefined ? { isSitting: e.isSitting } : {}),
                ...(e.constructor.name === 'AtlasExplorer' ? {
                    warpState: 'active',
                    warpProgress: 1.0,
                    stayTimer: 0,
                    maxStayDuration: 999999999,
                    isDeparted: false
                } : {})
            }))
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
        const intervalMs = (autosaveInterval || 60) * 1000;
        if (now - lastAutosaveTimestamp >= intervalMs) {
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
                if (!isWorldVersionCompatible(impVersion, impBuild)) {
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

    export function regenerateLostWorld(wInfo) {
        if (!wInfo) return;
        showSingleplayerLoading(wInfo.name);
        setMultiplayerLoadingStatus('Regenerating world terrain', 45);

        setTimeout(() => {
            currentWorldId = wInfo.id;
            isMultiplayer = false;
            if (typeof setEngineCurrentWorldId === 'function') setEngineCurrentWorldId(currentWorldId);
            setPlayerTalkedToKael(false);
            currentDifficulty = wInfo.difficulty || 'normal';
            if (typeof setEngineCurrentDifficulty === 'function') setEngineCurrentDifficulty(currentDifficulty);
            if (typeof window !== 'undefined') window.currentDifficulty = currentDifficulty;
            setWorldDimensions(wInfo.worldSize || 'small');
            keepInventory = !!wInfo.keepInventory;
            currentWorldAchievementsEnabled = !!wInfo.achievementsEnabled;

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

            entities = []; furnaces = []; jukeboxes = []; timeOfDay = 0.02; dayCount = 1; frameCount = 0;
            if (typeof RiftExplorerSpawner !== 'undefined' && RiftExplorerSpawner.initNewWorld) RiftExplorerSpawner.initNewWorld();
            if (typeof setEngineFurnaces === 'function') setEngineFurnaces([]);
            if (typeof window !== 'undefined') window.furnaces = [];
            if (typeof setEngineJukeboxes === 'function') setEngineJukeboxes([]);
            if (typeof window !== 'undefined') window.jukeboxes = [];
            if (typeof jukebox !== 'undefined' && jukebox.stop) jukebox.stop();
            if (typeof setEngineTimeOfDay === 'function') setEngineTimeOfDay(0.02);
            if (typeof setEngineDayCount === 'function') setEngineDayCount(1);
            if (typeof setEngineFrameCount === 'function') setEngineFrameCount(0);
            if (typeof window !== 'undefined') {
                window.timeOfDay = 0.02;
                window.dayCount = 1;
                window.frameCount = 0;
            }

            inventory.fill(null);
            equippedArmor = [null, null, null, null];
            if (typeof setEngineInventory === 'function') setEngineInventory(inventory);
            if (typeof setEngineEquippedArmor === 'function') setEngineEquippedArmor(equippedArmor);
            if (wInfo.starterItems) {
                giveItem(IDS.WOOD_AXE, 1); giveItem(IDS.WOOD_PICKAXE, 1); giveItem(IDS.WOOD, 32); giveItem(IDS.RAW_PORKCHOP, 5); giveItem(IDS.TORCH, 16); giveItem(IDS.SAPLING, 4);
            }
            updateArmorUI();
            updateHudArmorBar();
            saveCurrentWorld();

            hideSingleplayerLoading();
            document.getElementById('btn-quit-to-menu').innerText = "Save & Quit to Title";
            document.getElementById('room-indicator').classList.add('hidden');
            showToast(`World "${wInfo.name}" regenerated and saved!`);
            startGameplay();
        }, 120);
    }

    export function loadWorld(id, bypass015Prompt = false) {
        const worldInfo = getSavedWorlds().find(world => world.id === id);
        if (worldInfo) {
            if (!bypass015Prompt && isWorldVersion015(worldInfo.gameVersion, worldInfo.gameBuild)) {
                promptConvertWorld015(id);
                return;
            }
            if (!isWorldVersionCompatible(worldInfo.gameVersion, worldInfo.gameBuild)) {
                showToast(`Cannot open world '${worldInfo.name}': Incompatible version (World is v${worldInfo.gameVersion || 'older'}, Client is v${GAME_VERSION}).`);
                return;
            }
        }

        const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem('swc_data_' + id) : null;
        if (!raw) {
            const worldName = worldInfo?.name || 'Selected World';
            const action = confirm(`Save data for "${worldName}" is missing from browser storage.\n\n• Click OK to regenerate this world from scratch and play\n• Click Cancel to remove this world from your list`);
            if (action) {
                if (worldInfo) {
                    regenerateLostWorld(worldInfo);
                } else {
                    showToast('Could not find world metadata to regenerate.');
                }
            } else {
                deleteWorld(id, false);
            }
            return;
        }

        const isConverting = worldInfo && isWorldVersion015(worldInfo.gameVersion, worldInfo.gameBuild);
        showSingleplayerLoading(isConverting ? `Converting ${worldInfo?.name || 'World'} to Beta 0.1.6...` : (worldInfo?.name || 'Loading world...'));
        setMultiplayerLoadingStatus(isConverting ? 'Upgrading save data to v0.1.6' : 'Reading save data', 34);
        setTimeout(() => {
            setMultiplayerLoadingStatus(isConverting ? 'Migrating terrain & structures' : 'Generating terrain', 58);
            setTimeout(() => loadWorldData(id), 260);
        }, 120);
    }

    export const MINECRAFT_LOADING_TIPS = [
        "Never dig straight down into unexplored darkness!",
        "Always carry spare torches when exploring cavern depths.",
        "Water buckets can safely cushion long falls.",
        "Keep your swords sharp and your torches bright.",
        "Torches prevent monsters from spawning in dark caverns.",
        "Sneak near cliffs to prevent falling over the edge.",
        "Press E at any time to open your backpack and crafting grid.",
        "Astral Shards can be infused to forge immortal gear.",
        "Furnaces smelt ores faster when stocked with coal or charcoal.",
        "Craft a bed to set your personal respawn point.",
        "Wooden doors keep zombies from wandering into your shelter.",
        "Lava pools wait at depth 55... tread carefully.",
        "Listen closely for cavern ambiance and water echoes.",
        "Plant saplings to renew your wood supply.",
        "Food restores your hunger bar, allowing health regeneration.",
        "Gold tools mine quickly, but break easily."
    ];

    export function getRandomLoadingTip() {
        return MINECRAFT_LOADING_TIPS[Math.floor(Math.random() * MINECRAFT_LOADING_TIPS.length)];
    }
    try { window.getRandomLoadingTip = getRandomLoadingTip; } catch (e) {}

    export function showSingleplayerLoading(text = 'Loading world...') {
        const screen = document.getElementById('loading-screen');
        const status = document.getElementById('multiplayer-loading-status');
        const title = document.getElementById('multiplayer-loading-title');
        const subtitle = document.getElementById('multiplayer-loading-room');
        const tipEl = document.getElementById('world-loading-tip-text');
        const fillEl = document.getElementById('multiplayer-loading-fill');
        const percentEl = document.getElementById('multiplayer-loading-percent');
        const errorEl = document.getElementById('multiplayer-loading-error');
        const actionsEl = document.getElementById('multiplayer-loading-actions');

        if (title) title.innerText = 'Loading World';
        if (subtitle) subtitle.innerText = text ? `${text}` : 'Preparing world';
        if (status) status.innerText = 'Reading save data';
        if (tipEl) tipEl.innerText = getRandomLoadingTip();
        if (fillEl) fillEl.style.width = '12%';
        if (percentEl) percentEl.innerText = '12%';
        if (errorEl) { errorEl.innerText = ''; errorEl.classList.remove('visible'); }
        if (actionsEl) actionsEl.classList.add('hidden');
        if (screen) {
            screen.classList.remove('hidden');
            screen.style.setProperty('display', 'flex', 'important');
            screen.style.setProperty('background', '#000000', 'important');
            screen.style.setProperty('z-index', '90000', 'important');
        }
    }

    export function hideSingleplayerLoading() {
        const screen = document.getElementById('loading-screen');
        if (screen) {
            screen.classList.add('hidden');
            screen.style.removeProperty('display');
            screen.style.removeProperty('z-index');
            screen.style.removeProperty('background');
        }
    }

    export function loadWorldData(id) {
        let raw = localStorage.getItem('swc_data_' + id);
        if(!raw) {
            hideSingleplayerLoading();
            const worldInfo = getSavedWorlds().find(world => world.id === id);
            if (worldInfo) {
                const action = confirm(`Save data for "${worldInfo.name}" is missing from browser storage.\n\n• Click OK to regenerate this world from scratch and play\n• Click Cancel to remove this world from your list`);
                if (action) {
                    regenerateLostWorld(worldInfo);
                    return;
                } else {
                    deleteWorld(id, false);
                    return;
                }
            }
            showToast('This world has no saved game data.');
            return;
        }
        currentWorldId = id; isMultiplayer = false;
        if (typeof setEngineCurrentWorldId === 'function') setEngineCurrentWorldId(currentWorldId);
        try {
            let data = JSON.parse(raw);
            if (!isWorldVersionCompatible(data.gameVersion, data.gameBuild)) {
                currentWorldId = null;
                if (typeof setEngineCurrentWorldId === 'function') setEngineCurrentWorldId(null);
                hideSingleplayerLoading();
                showToast(`Cannot open world: Incompatible version (World is v${data.gameVersion || 'older'}, Client is v${GAME_VERSION}).`);
                return;
            }
            let worlds = getSavedWorlds();
            let wInfo = worlds.find(w => w.id === currentWorldId);
            const was015 = isWorldVersion015(data.gameVersion, data.gameBuild) || (wInfo && isWorldVersion015(wInfo.gameVersion, wInfo.gameBuild));
            
            // 1. Determine world dimensions first before decompression
            let targetSize = data.worldSize;
            let targetWidth = data.worldWidth || (targetSize === 'big' ? 2048 : 1024);
            let targetHeight = data.worldHeight || (targetSize === 'big' ? 512 : 320);
            if (!targetSize) {
                targetSize = targetWidth > 1200 ? 'big' : 'small';
            }
            setWorldDimensions(targetSize, targetWidth, targetHeight);

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
            for (let x = 0; x < WORLD_WIDTH; x++) {
                let surfY = WORLD_HEIGHT - 1;
                for (let y = 0; y < WORLD_HEIGHT; y++) {
                    let b = world[x]?.[y];
                    if (b !== undefined && !isNonSurfaceBlock(b)) {
                        surfY = y;
                        break;
                    }
                }
                surfaceHeights[x] = surfY;
            }
            window.surfaceHeights = surfaceHeights;
            if (typeof setEngineSurfaceHeights === 'function') setEngineSurfaceHeights(surfaceHeights);

            timeOfDay = data.timeOfDay !== undefined ? data.timeOfDay : 0.02;
            dayCount = data.dayCount || 1;
            frameCount = data.frameCount || 0;
            if (typeof setEngineTimeOfDay === 'function') setEngineTimeOfDay(timeOfDay);
            if (typeof setEngineDayCount === 'function') setEngineDayCount(dayCount);
            if (typeof setEngineFrameCount === 'function') setEngineFrameCount(frameCount);
            if (typeof window !== 'undefined') {
                window.timeOfDay = timeOfDay;
                window.dayCount = dayCount;
                window.frameCount = frameCount;
            }
            saplingGrowthQueue = new Map(Object.entries(data.saplingGrowthQueue || {}).map(([key, growthAt]) => [key, Number(growthAt)]).filter(([, growthAt]) => Number.isFinite(growthAt)));
            if (typeof window !== 'undefined') window.saplingGrowthQueue = saplingGrowthQueue;
            if (typeof setEngineSaplingGrowthQueue === 'function') setEngineSaplingGrowthQueue(saplingGrowthQueue);
            else if (typeof window !== 'undefined' && typeof window.setEngineSaplingGrowthQueue === 'function') window.setEngineSaplingGrowthQueue(saplingGrowthQueue);

            cropGrowthQueue = new Map(Object.entries(data.cropGrowthQueue || {}));
            if (typeof window !== 'undefined') window.cropGrowthQueue = cropGrowthQueue;
            if (typeof setEngineCropGrowthQueue === 'function') setEngineCropGrowthQueue(cropGrowthQueue);
            else if (typeof window !== 'undefined' && typeof window.setEngineCropGrowthQueue === 'function') window.setEngineCropGrowthQueue(cropGrowthQueue);

            dirtToGrassQueue = new Map(Object.entries(data.dirtToGrassQueue || {}).map(([key, growAt]) => [key, Number(growAt)]).filter(([, growAt]) => Number.isFinite(growAt)));
            if (typeof window !== 'undefined') window.dirtToGrassQueue = dirtToGrassQueue;
            if (typeof setEngineDirtToGrassQueue === 'function') setEngineDirtToGrassQueue(dirtToGrassQueue);
            else if (typeof window !== 'undefined' && typeof window.setEngineDirtToGrassQueue === 'function') window.setEngineDirtToGrassQueue(dirtToGrassQueue);

            snowRegrowthQueue = new Map(Object.entries(data.snowRegrowthQueue || {}).map(([key, regrowAt]) => [key, Number(regrowAt)]).filter(([, regrowAt]) => Number.isFinite(regrowAt)));
            if (typeof window !== 'undefined') window.snowRegrowthQueue = snowRegrowthQueue;
            if (typeof setEngineSnowRegrowthQueue === 'function') setEngineSnowRegrowthQueue(snowRegrowthQueue);
            else if (typeof window !== 'undefined' && typeof window.setEngineSnowRegrowthQueue === 'function') window.setEngineSnowRegrowthQueue(snowRegrowthQueue);
            currentDifficulty = data.difficulty || 'normal';
            if (typeof setEngineCurrentDifficulty === 'function') setEngineCurrentDifficulty(currentDifficulty);
            if (typeof window !== 'undefined') window.currentDifficulty = currentDifficulty;
            keepInventory = currentDifficulty !== 'hardcore' && data.keepInventory === true;
            currentWorldAchievementsEnabled = data.achievementsEnabled !== undefined ? data.achievementsEnabled : (data.starterItems !== true && data.keepInventory !== true);
            
            const isCreativeMode = (wInfo && wInfo.gameMode === 'creative') || (data.gameMode === 'creative');
            if (isCreativeMode) {
                window.devCheats = window.devCheats || {};
                window.devCheats.godMode = true;
                window.devCheats.noclip = true;
                window.devCheats.instantMine = true;
                window.devCheats.infiniteOxygen = true;
                window.devCheats.infiniteHunger = true;
            } else if (!wInfo?.allowCheats && !data.allowCheats) {
                if (window.devCheats) {
                    window.devCheats.godMode = false;
                    window.devCheats.noclip = false;
                    window.devCheats.instantMine = false;
                }
            }

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
            if (typeof setEngineFurnaces === 'function') setEngineFurnaces(furnaces);
            if (typeof window !== 'undefined') window.furnaces = furnaces;
            jukeboxes = data.jukeboxes || [];
            if (typeof setEngineJukeboxes === 'function') setEngineJukeboxes(jukeboxes);
            if (typeof window !== 'undefined') window.jukeboxes = jukeboxes;
            if (typeof jukebox !== 'undefined' && jukebox.stop) jukebox.stop();
            chests = new Map(Object.entries(data.chests || {}).map(([key, value]) => {
                const rawItems = (value && Array.isArray(value.items)) ? value.items : (Array.isArray(value) ? value : []);
                const targetSize = rawItems.length > 27 ? 54 : 27;
                const items = [...rawItems];
                while (items.length < targetSize) items.push(null);
                if (items.length > targetSize) items.length = targetSize;
                return [key, { items }];
            }));
            if (typeof setEngineChests === 'function') setEngineChests(chests);
            if (typeof window !== 'undefined') window.chests = chests;
            const restoredSigns = new Map(Object.entries(data.signs || {}));
            if (typeof setEngineSigns === 'function') setEngineSigns(restoredSigns);
            if (typeof window !== 'undefined') window.signs = restoredSigns;

            if (data.worldBiomes && Array.isArray(data.worldBiomes)) {
                if (typeof setEngineWorldBiomes === 'function') setEngineWorldBiomes(data.worldBiomes);
                if (typeof window !== 'undefined') window.worldBiomes = data.worldBiomes;
            }

            if (data.kaelTalked !== undefined) {
                setPlayerTalkedToKael(!!data.kaelTalked);
            } else {
                try {
                    const stored = localStorage.getItem('webcraft_kael_talked_' + currentWorldId);
                    setPlayerTalkedToKael(stored === 'true');
                } catch(e) {
                    setPlayerTalkedToKael(false);
                }
            }
            openedChest = null;
            fallingBlocks = [];
            activeProjectiles = [];
            if (data.treeWoodCells && Array.isArray(data.treeWoodCells) && data.treeWoodCells.length > 0) {
                nonCollidableTreeWood = new Set(data.treeWoodCells);
            } else {
                nonCollidableTreeWood = new Set();
                ensureTreeWoodNonCollidable();
                if (typeof window !== 'undefined' && window.nonCollidableTreeWood) {
                    nonCollidableTreeWood = window.nonCollidableTreeWood;
                }
            }
            if (typeof setEngineNonCollidableTreeWood === 'function') setEngineNonCollidableTreeWood(nonCollidableTreeWood);
            if (typeof window !== 'undefined') window.nonCollidableTreeWood = nonCollidableTreeWood;
            if (typeof sanitizeTreeWoodCollision === 'function') sanitizeTreeWoodCollision();
            else if (typeof window !== 'undefined' && typeof window.sanitizeTreeWoodCollision === 'function') window.sanitizeTreeWoodCollision();
            entities = (data.entities || []).filter(e => !e.isDeparted).map(e => {
                let inst;
                if (e.type === 'Pig') inst = new Pig(e.x, e.y);
                else if (e.type === 'Chicken') inst = new Chicken(e.x, e.y);
                else if (e.type === 'Sheep') inst = new Sheep(e.x, e.y);
                else if (e.type === 'Cow') inst = new Cow(e.x, e.y);
                else if (e.type === 'Pigeon') inst = new Pigeon(e.x, e.y);
                else if (e.type === 'Parrot') {
                    inst = new Parrot(e.x, e.y, e.variant !== undefined ? e.variant : 0);
                    if (e.isTamed !== undefined) inst.isTamed = !!e.isTamed;
                    if (e.isSitting !== undefined) inst.isSitting = !!e.isSitting;
                }
                else if (e.type === 'Creeper') inst = new Creeper(e.x, e.y);
                else if (e.type === 'Scorpion') inst = new Scorpion(e.x, e.y);
                else if (e.type === 'AtlasExplorer') {
                    inst = new AtlasExplorer(e.x, e.y);
                    inst.warpState = 'active';
                    inst.warpProgress = 1.0;
                    inst.stayTimer = 0;
                    inst.maxStayDuration = 999999999;
                    inst.isDeparted = false;
                }
                else inst = new Zombie(e.x, e.y);
                inst.health = e.health;
                if(inst instanceof Pig || inst instanceof Chicken || inst instanceof Sheep || inst instanceof Cow || inst instanceof Pigeon || inst instanceof Parrot || inst instanceof AtlasExplorer) inst.dir = e.dir || 1;
                return inst;
            });
            ensureDesertScorpions();
            window.entities = entities;
            if (typeof setEngineEntities === 'function') setEngineEntities(entities);

            if (typeof RiftExplorerSpawner !== 'undefined') {
                if (data.riftSpawner) {
                    RiftExplorerSpawner.loadState(data.riftSpawner);
                } else {
                    RiftExplorerSpawner.loadState({
                        hasSpawnedInitial: true,
                        nextArrivalDay: Math.max(1, dayCount || 1),
                        nextArrivalDayTime: 0.02
                    });
                }
                const activeAtlas = entities.find(e => e instanceof AtlasExplorer && !e.isDeparted);
                if (activeAtlas) {
                    RiftExplorerSpawner.activeExplorer = activeAtlas;
                } else {
                    RiftExplorerSpawner.activeExplorer = null;
                    RiftExplorerSpawner.nextArrivalDay = Math.max(1, dayCount || 1);
                    RiftExplorerSpawner.nextArrivalDayTime = 0.02;
                }
            }
            
            // 5. Update world metadata and upgrade version safely
            worlds = getSavedWorlds();
            wInfo = worlds.find(w => w.id === currentWorldId);
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
            if (was015) {
                showToast(`World '${wInfo?.name || 'World'}' successfully converted to Beta 0.1.6!`);
            }
        } catch(e) {
            console.error('Failed to load world', e);
            hideSingleplayerLoading();
            showToast("Error loading world: " + (e.message || "Corrupted save"));
        }
    }

    export function deleteWorld(id, prompt = true) {
        if(prompt && !confirm("Delete this world forever?")) return;
        let worlds = getSavedWorlds(); worlds = worlds.filter(w => w.id !== id); saveWorldsList(worlds);
        localStorage.removeItem('swc_data_' + id);
        try { localStorage.removeItem('webcraft_kael_talked_' + id); } catch(e) {}
        renderWorldsList();
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
            if (typeof drawPlayerPreview === 'function') drawPlayerPreview(true);
            updateMainMenuProfileBadge();
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
        compileSkinCanvas();
        if (typeof drawPlayerPreview === 'function') drawPlayerPreview(true);
        updateMainMenuProfileBadge();
    }
    export function closeSkins() {
        closeSkinOwnedModal();
        closeSkinUploadModal();
        document.getElementById('skins-menu').classList.add('hidden');
        showMainMenu();
        compileSkinCanvas();
        if (typeof drawPlayerPreview === 'function') drawPlayerPreview(true);
        updateMainMenuProfileBadge();
    }
    
    export function updateGraphicsButton() {
        const btn = document.getElementById('btn-toggle-graphics');
        const custBtn = document.getElementById('btn-customize-fabulous');
        if (custBtn) {
            custBtn.style.display = (graphicsMode === 'fabulous') ? 'inline-flex' : 'none';
        }
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
        updateToggleBtnState('btn-toggle-clouds', showClouds);
        updateToggleBtnState('btn-toggle-debug', showDebug);
        updateToggleBtnState('btn-toggle-autojump', autoJumpEnabled);
        updateToggleBtnState('btn-toggle-intro', introEnabled);
        updateToggleBtnState('btn-toggle-item-popups', showItemPopups);
        updateToggleBtnState('btn-toggle-screenshake', showScreenShake);
        updateToggleBtnState('btn-toggle-vignette', showVignette);
        updateToggleBtnState('btn-toggle-shimmer', showHeatShimmer);
        updateToggleBtnState('btn-toggle-grading', showBiomeGrading);
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
        updateToggleBtnState('btn-toggle-footsteps', footstepsEnabled);
        updateToggleBtnState('btn-toggle-mute', isAudioMuted, "ON (Muted)", "OFF (Audio ON)");

        // Controls
        const sSens = document.getElementById('slider-scroll-sens');
        if (sSens) { sSens.value = scrollSensitivity; const b = document.getElementById('badge-scroll-sens'); if (b) b.innerText = `${scrollSensitivity}x`; }
        if (document.getElementById('btn-invert-wheel')) document.getElementById('btn-invert-wheel').innerText = invertScrollWheel ? "Inverted" : "Normal";
        if (document.getElementById('btn-hotbar-wrap')) document.getElementById('btn-hotbar-wrap').innerText = hotbarWrapAround ? "Wrap (1-9)" : "Clamp (1-9)";

        updateGraphicsButton();
        updateKeybindButtonsUI();
        updateGamepadUI();
        updateSettingsDifficultyUI();
        const btnAutosave = document.getElementById('btn-settings-autosave');
        if (btnAutosave) {
            const curOpt = AUTOSAVE_INTERVALS.find(opt => opt.seconds === (autosaveInterval || 60)) || AUTOSAVE_INTERVALS[1];
            btnAutosave.innerText = curOpt.label;
        }
        if (document.getElementById('btn-toggle-fps-cap')) {
            if (typeof setEngineFpsCap === 'function') setEngineFpsCap(fpsCap);
            document.getElementById('btn-toggle-fps-cap').innerText = getFpsCapText(fpsCap);
        }
    }

    export function switchSettingsTab(tabName) {
        const menu = document.getElementById('settings-menu');
        const targetTab = (tabName === 'controller') ? 'controls' : tabName;
        if (menu) {
            menu.querySelectorAll('.settings-tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === targetTab);
            });
            menu.querySelectorAll('.settings-tab-content').forEach(content => {
                content.classList.toggle('active', content.id === `settings-tab-${targetTab}`);
            });
        }
        if (tabName === 'controller') {
            switchControlsSubTab('gamepad');
            return;
        }
        if (tabName === 'controls') {
            updateGamepadUI();
        } else {
            stopGamepadUiMonitor();
        }
    }

    export function switchControlsSubTab(subTab) {
        const kbBtn = document.getElementById('subtab-btn-keyboard');
        const gpBtn = document.getElementById('subtab-btn-gamepad');
        const kbPanel = document.getElementById('controls-panel-keyboard');
        const gpPanel = document.getElementById('controls-panel-gamepad');

        if (kbBtn) kbBtn.classList.toggle('active', subTab === 'keyboard');
        if (gpBtn) gpBtn.classList.toggle('active', subTab === 'gamepad');

        if (kbPanel) {
            if (subTab === 'keyboard') kbPanel.classList.remove('hidden');
            else kbPanel.classList.add('hidden');
        }
        if (gpPanel) {
            if (subTab === 'gamepad') {
                gpPanel.classList.remove('hidden');
                updateGamepadUI();
                startGamepadUiMonitor();
            } else {
                gpPanel.classList.add('hidden');
                stopGamepadUiMonitor();
            }
        }
    }

    let gamepadUiMonitorId = null;
    export function startGamepadUiMonitor() {
        stopGamepadUiMonitor();
        function tick() {
            const gpPanel = document.getElementById('controls-panel-gamepad');
            if (!gpPanel || gpPanel.classList.contains('hidden')) {
                stopGamepadUiMonitor();
                return;
            }
            if (typeof Gamepad !== 'undefined') {
                const pressed = (typeof Gamepad.getPressedButtonIndices === 'function') ? Gamepad.getPressedButtonIndices() : [];
                document.querySelectorAll('.gamepad-live-pill').forEach(pill => {
                    const idx = parseInt(pill.dataset.btnIdx, 10);
                    pill.classList.toggle('active', pressed.includes(idx));
                });
                const gp = (typeof Gamepad.getActiveGamepad === 'function') ? Gamepad.getActiveGamepad() : null;
                const readout = document.getElementById('controller-live-axis-readout');
                if (readout && gp && gp.axes) {
                    const lx = (gp.axes[0] !== undefined ? gp.axes[0] : 0).toFixed(2);
                    const ly = (gp.axes[1] !== undefined ? gp.axes[1] : 0).toFixed(2);
                    const rx = (gp.axes[2] !== undefined ? gp.axes[2] : 0).toFixed(2);
                    const ry = (gp.axes[3] !== undefined ? gp.axes[3] : 0).toFixed(2);
                    readout.innerText = `LX: ${lx} | LY: ${ly} | RX: ${rx} | RY: ${ry}`;
                }
                updateGamepadDeviceCard();
            }
            if (typeof requestAnimationFrame === 'function') {
                gamepadUiMonitorId = requestAnimationFrame(tick);
            }
        }
        if (typeof requestAnimationFrame === 'function') {
            gamepadUiMonitorId = requestAnimationFrame(tick);
        }
    }

    export function stopGamepadUiMonitor() {
        if (gamepadUiMonitorId && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(gamepadUiMonitorId);
            gamepadUiMonitorId = null;
        }
    }

    export function updateGamepadDeviceCard() {
        const devNameEl = document.getElementById('controller-device-name');
        const devSubEl = document.getElementById('controller-device-sub');
        const connBadgeEl = document.getElementById('controller-conn-badge');
        const connTextEl = document.getElementById('controller-conn-text');
        const connDotEl = document.getElementById('controller-conn-dot');
        const ledEl = document.getElementById('controller-pixel-icon-led');
        if (!devNameEl || !devSubEl || !connBadgeEl) return;

        if (typeof Gamepad !== 'undefined' && Gamepad.isGamepadConnected()) {
            const gp = Gamepad.getActiveGamepad();
            const rawName = gp ? gp.id.split('(')[0].trim() : 'Gamepad';
            devNameEl.innerText = rawName || 'Standard Controller';
            const numAxes = gp && gp.axes ? gp.axes.length : 4;
            const numBtns = gp && gp.buttons ? gp.buttons.length : 17;
            const hapticsText = (gp && gp.vibrationActuator) ? 'Haptics: Supported' : 'Haptics: Standard';
            devSubEl.innerText = `Connected (Port ${gp ? gp.index : 0} • ${numBtns} Buttons • ${numAxes} Axes • ${hapticsText})`;
            if (connTextEl) connTextEl.innerText = 'CONNECTED';
            else connBadgeEl.innerText = 'CONNECTED';
            connBadgeEl.classList.remove('disconnected');
            connBadgeEl.classList.add('connected');
            if (connDotEl) {
                connDotEl.className = 'controller-beacon-dot inline-block w-2.5 h-2.5 bg-emerald-400 border border-black shrink-0';
            }
            if (ledEl) ledEl.setAttribute('fill', '#4ade80');
        } else {
            devNameEl.innerText = 'No Gamepad Detected';
            devSubEl.innerText = 'Connect via USB / Bluetooth & press any button to wake';
            if (connTextEl) connTextEl.innerText = 'DISCONNECTED';
            else connBadgeEl.innerText = 'DISCONNECTED';
            connBadgeEl.classList.remove('connected');
            connBadgeEl.classList.add('disconnected');
            if (connDotEl) {
                connDotEl.className = 'controller-beacon-dot inline-block w-2.5 h-2.5 bg-gray-500 border border-black shrink-0';
            }
            if (ledEl) ledEl.setAttribute('fill', '#475569');
        }
    }

    export function updateGamepadUI() {
        updateGamepadDeviceCard();

        if (typeof Gamepad !== 'undefined') {
            document.querySelectorAll('.gamepad-rebind-btn').forEach(btn => {
                const action = btn.dataset.gpAction;
                if (action && Gamepad.gamepadBindings[action] !== undefined) {
                    btn.innerText = Gamepad.formatGamepadButtonName(Gamepad.gamepadBindings[action]);
                    btn.classList.remove('waiting');
                }
            });

            // Deadzone
            const dzSlider = document.getElementById('slider-gp-deadzone');
            const dzBadge = document.getElementById('badge-gp-deadzone');
            if (dzSlider && dzBadge) {
                const pct = Math.round((Gamepad.gamepadSettings.deadzone || 0.18) * 100);
                dzSlider.value = pct;
                dzBadge.innerText = `${pct}%`;
            }

            // Aim Sensitivity
            const sensSlider = document.getElementById('slider-gp-aim-sens');
            const sensBadge = document.getElementById('badge-gp-aim-sens');
            if (sensSlider && sensBadge) {
                sensSlider.value = Math.round((Gamepad.gamepadSettings.aimSensitivity || 1.0) * 10);
                sensBadge.innerText = `${(Gamepad.gamepadSettings.aimSensitivity || 1.0).toFixed(1)}x`;
            }

            // Invert Y
            const invBtn = document.getElementById('btn-gp-invert-y');
            if (invBtn) {
                invBtn.innerText = Gamepad.gamepadSettings.invertAimY ? 'Invert
... [truncated for diff preview]