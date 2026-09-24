// =============================================================================
// WEBCRAFT 2D - DEVELOPER DEBUG CONSOLE (devconsole.js)
// Comprehensive In-Game Debug & Cheats Suite
// Undisruptive Corner-Docked Live Debug Panel
// =============================================================================

import {
    IDS, ID_NAMES, textures, player, inventory, entities, droppedItems,
    timeOfDay, dayCount, currentDifficulty, setEngineTimeOfDay, setEngineDayCount,
    setEngineCurrentDifficulty, setEngineEntities, setEngineInventory, getWorldSurfaceY,
    TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT, Particle, particles,
    Zombie, Creeper, Scorpion, Gloomstalker, Pig, Chicken, Sheep, Cow, Pigeon, Parrot, AtlasExplorer
} from './engine.js';
import { getPixelIconSvg } from './icons/pixelicons.js';

// UI & Audio helper bridges (resolved dynamically via window to avoid circular or CDN dependencies)
const giveItem = (id, count) => {
    if (typeof window !== 'undefined' && typeof window.giveItem === 'function') {
        return window.giveItem(id, count);
    }
    return false;
};
const showToast = (msg) => {
    if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
        window.showToast(msg);
    } else {
        console.log(msg);
    }
};
const playSound = (snd, opt) => {
    if (typeof window !== 'undefined' && typeof window.playSound === 'function') {
        window.playSound(snd, opt);
    }
};
const updateUI = () => {
    if (typeof window !== 'undefined' && typeof window.updateUI === 'function') {
        window.updateUI();
    }
};
const updateHealthUI = () => {
    if (typeof window !== 'undefined' && typeof window.updateHealthUI === 'function') {
        window.updateHealthUI();
    }
};
const updateOxygenUI = (sub) => {
    if (typeof window !== 'undefined' && typeof window.updateOxygenUI === 'function') {
        window.updateOxygenUI(sub);
    }
};

// Global dev cheats state
if (typeof window !== 'undefined') {
    window.devCheats = window.devCheats || {
        godMode: false,
        noclip: false,
        instantMine: false,
        fullbright: false,
        infiniteOxygen: false,
        infiniteHunger: false,
        highJump: false,
        showHitboxes: false,
        speedMultiplier: 1.0,
        reachMultiplier: 1.0,
        freezeMobs: false,
        timeSpeed: 1.0
    };
}

class DevConsoleManager {
    constructor() {
        this.isOpen = false;
        this.isMinimized = false;
        this.dockSide = (typeof localStorage !== 'undefined' && localStorage.getItem('webcraft_dev_dock')) || 'left';
        this.itemDrawerOpen = false;
        this.giveCount = 1;
        this.itemSearchTerm = '';
        this.selectedCategory = 'all';
        this.commandHistory = [];
        this.historyIndex = -1;
        this.containerEl = null;
        this.cachedItems = null;
        this.initialized = false;
        this._lastToggle = 0;
        this._isDragging = false;
        this._dragOffsetX = 0;
        this._dragOffsetY = 0;
        this._customPos = false;
    }

    init() {
        if (this.initialized || typeof document === 'undefined') return;
        if (!document.body) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.init(), { once: true });
            }
            return;
        }

        this.injectStyles();

        let modal = document.getElementById('dev-console-modal');
        if (!modal) {
            this.buildUI();
        } else {
            this.containerEl = modal;
        }
        this.bindEvents();
        this.initialized = true;
    }

    // -------------------------------------------------------------------------
    // SCOPED STYLES INJECTION
    // -------------------------------------------------------------------------
    injectStyles() {
        if (typeof document === 'undefined' || document.getElementById('dev-console-styles')) return;

        const styleEl = document.createElement('style');
        styleEl.id = 'dev-console-styles';
        styleEl.textContent = `
            #dev-console-modal {
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 999999;
                user-select: none;
            }
            .dev-debug-panel {
                position: fixed;
                pointer-events: auto;
                width: 530px;
                max-width: calc(100vw - 28px);
                max-height: calc(100vh - 120px);
                background: rgba(20, 26, 33, 0.94);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 2px solid #374151;
                border-radius: 4px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.05);
                padding: 8px 10px;
                display: flex;
                flex-direction: column;
                gap: 7px;
                font-family: 'VT323', monospace;
                color: #e2e8f0;
                transition: left 0.15s ease, right 0.15s ease;
            }
            .dev-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 2px solid #374151;
                padding-bottom: 4px;
            }
            .dev-title-wrap {
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .dev-title {
                font-family: 'Pixeloid Sans', monospace !important;
                font-size: 15px !important;
                font-weight: bold !important;
                color: #ffd34d;
                text-shadow: 2px 2px 0 #000;
                line-height: 1;
                margin: 0;
                letter-spacing: 0.5px;
            }
            .dev-hotkey-badge {
                background: #11151a;
                border: 1px solid #3b4756;
                color: #ffd34d;
                padding: 1px 5px;
                font-size: 13px;
                border-radius: 2px;
                letter-spacing: 0.5px;
            }
            .dev-ctrl-group {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .dev-ctrl-btn {
                background: #242c37;
                border: 1px solid #475569;
                color: #cbd5e1;
                font-family: 'VT323', monospace;
                font-size: 14px;
                padding: 1px 7px;
                cursor: pointer;
                border-radius: 2px;
                line-height: 1.2;
                transition: background 0.15s, color 0.15s;
            }
            .dev-ctrl-btn:hover {
                background: #374151;
                color: #fff;
                border-color: #94a3b8;
            }
            .dev-ctrl-btn.close:hover {
                background: #dc2626;
                border-color: #ef4444;
                color: #fff;
            }
            .dev-columns-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 5px;
                overflow-y: auto;
                max-height: calc(100vh - 190px);
                padding-right: 2px;
            }
            .dev-col {
                display: flex;
                flex-direction: column;
                gap: 3px;
            }
            .dev-col-header {
                font-size: 14px;
                font-weight: bold;
                color: #94a3b8;
                border-bottom: 1px solid #334155;
                padding-bottom: 2px;
                margin-bottom: 2px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .dev-grid-btn {
                background: rgba(34, 42, 53, 0.90);
                border: 1px solid #435061;
                color: #e2e8f0;
                font-family: 'VT323', monospace;
                font-size: 16px;
                height: 27px;
                line-height: 25px;
                padding: 0 6px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: pointer;
                border-radius: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                transition: background 0.12s, border-color 0.12s, transform 0.05s;
            }
            .dev-grid-btn:hover {
                background: rgba(56, 70, 88, 1);
                border-color: #94a3b8;
                color: #ffffff;
            }
            .dev-grid-btn:active {
                transform: translateY(1px);
            }
            .dev-grid-btn.active {
                background: #1e3a5f !important;
                border-color: #38bdf8 !important;
                color: #bae6fd !important;
                box-shadow: inset 0 0 6px rgba(56, 189, 248, 0.3);
            }
            .dev-badge-off {
                font-size: 12px;
                padding: 0 4px;
                background: rgba(0, 0, 0, 0.45);
                color: #94a3b8;
                border-radius: 2px;
                line-height: 1.2;
            }
            .dev-badge-on {
                font-size: 12px;
                padding: 0 4px;
                background: #0284c7;
                color: #ffffff;
                border-radius: 2px;
                font-weight: bold;
                line-height: 1.2;
            }
            .dev-btn-danger {
                background: rgba(127, 29, 29, 0.65) !important;
                border-color: #b91c1c !important;
                color: #fca5a5 !important;
            }
            .dev-btn-danger:hover {
                background: rgba(185, 28, 28, 0.95) !important;
                color: #ffffff !important;
            }
            .dev-btn-warn {
                background: rgba(120, 53, 15, 0.65) !important;
                border-color: #d97706 !important;
                color: #fde68a !important;
            }
            .dev-btn-warn:hover {
                background: rgba(180, 83, 9, 0.95) !important;
                color: #ffffff !important;
            }
            .dev-btn-purple {
                background: rgba(88, 28, 135, 0.65) !important;
                border-color: #9333ea !important;
                color: #e9d5ff !important;
            }
            .dev-btn-purple:hover {
                background: rgba(126, 34, 206, 0.95) !important;
                color: #ffffff !important;
            }
            .dev-btn-green {
                background: rgba(20, 83, 45, 0.65) !important;
                border-color: #16a34a !important;
                color: #bbf7d0 !important;
            }
            .dev-btn-green:hover {
                background: rgba(22, 101, 52, 0.95) !important;
                color: #ffffff !important;
            }
            .dev-cmd-row {
                display: flex;
                align-items: center;
                gap: 4px;
                background: #11151a;
                border: 1px solid #374151;
                padding: 2px 4px;
                border-radius: 2px;
            }
            .dev-cmd-prompt {
                color: #ffd34d;
                font-size: 20px;
                padding-left: 2px;
                line-height: 1;
            }
            .dev-cmd-input {
                flex: 1;
                background: transparent;
                border: none;
                outline: none;
                color: #f1f5f9;
                font-family: 'VT323', monospace;
                font-size: 17px;
                min-width: 0;
            }
            .dev-cmd-btn {
                background: #242c37;
                border: 1px solid #475569;
                color: #ffd34d;
                font-family: 'VT323', monospace;
                font-size: 14px;
                padding: 1px 7px;
                cursor: pointer;
                border-radius: 2px;
            }
            .dev-cmd-btn:hover {
                background: #374151;
            }
            /* Expandable Item Spawner Drawer */
            .dev-item-drawer {
                position: fixed;
                pointer-events: auto;
                width: 370px;
                max-width: calc(100vw - 32px);
                max-height: calc(100vh - 120px);
                background: rgba(17, 22, 28, 0.97);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 2px solid #475569;
                border-radius: 4px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
                padding: 8px 10px;
                display: flex;
                flex-direction: column;
                gap: 6px;
                font-family: 'VT323', monospace;
                color: #e2e8f0;
                z-index: 1000000;
            }
            .dev-minimized-chip {
                position: fixed;
                pointer-events: auto;
                background: rgba(20, 26, 33, 0.95);
                border: 2px solid #ffd34d;
                color: #ffd34d;
                padding: 6px 14px;
                font-family: 'VT323', monospace;
                font-size: 18px;
                border-radius: 4px;
                cursor: pointer;
                box-shadow: 0 4px 16px rgba(0,0,0,0.6);
                display: none;
                align-items: center;
                gap: 8px;
                z-index: 999999;
            }
            .dev-minimized-chip:hover {
                background: #2a3441;
            }
            .dev-cat-chip {
                background: #171b20;
                border: 1px solid #333a41;
                color: #aebac2;
                padding: 1px 6px;
                font-size: 15px;
                cursor: pointer;
                border-radius: 2px;
            }
            .dev-cat-chip.active {
                background: #333a41;
                border-color: #64748b;
                color: #ffffff;
            }
            .dev-qty-chip {
                background: #171b20;
                border: 1px solid #333a41;
                color: #aebac2;
                padding: 1px 5px;
                font-size: 15px;
                cursor: pointer;
                border-radius: 2px;
            }
            .dev-qty-chip.active {
                background: #0284c7;
                border-color: #38bdf8;
                color: #ffffff;
            }
        `;
        if (document.head) {
            document.head.appendChild(styleEl);
        } else if (document.body) {
            document.body.appendChild(styleEl);
        }
    }

    canOpen() {
        if (typeof document === 'undefined') return false;
        const curState = (typeof window !== 'undefined' && window.STATE) ? window.STATE : 'MENU';
        if (curState !== 'PLAYING' && curState !== 'PAUSED') {
            return false;
        }
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu && !mainMenu.classList.contains('hidden') && mainMenu.style.display !== 'none') {
            return false;
        }
        const sharedBg = document.getElementById('shared-menu-bg');
        if (sharedBg && !sharedBg.classList.contains('hidden') && sharedBg.style.display !== 'none') {
            return false;
        }
        const bootScreen = document.getElementById('boot-loading-screen');
        if (bootScreen && !bootScreen.classList.contains('hidden') && bootScreen.style.display !== 'none') {
            return false;
        }
        return true;
    }

    // -------------------------------------------------------------------------
    // DYNAMIC ITEM DISCOVERY
    // Automatically scans IDS & ID_NAMES to index all game items dynamically
    // -------------------------------------------------------------------------
    getAllRegisteredItems() {
        if (this.cachedItems && this.cachedItems.length > 0) {
            return this.cachedItems;
        }

        const items = [];
        const seenIds = new Set();
        const idSource = (typeof IDS !== 'undefined') ? IDS : (window.IDS || {});
        const namesSource = (typeof ID_NAMES !== 'undefined') ? ID_NAMES : (window.ID_NAMES || {});

        const isBlock = (id) => id < 100 && id !== idSource.WATER && id !== idSource.LAVA;
        const isToolOrWeapon = (id) => {
            const name = (namesSource[id] || '').toLowerCase();
            return name.includes('pickaxe') || name.includes('sword') || name.includes('axe') || 
                   name.includes('shovel') || name.includes('hoe') || name.includes('shears');
        };
        const isArmor = (id) => {
            const name = (namesSource[id] || '').toLowerCase();
            return name.includes('helmet') || name.includes('chestplate') || name.includes('leggings') || 
                   name.includes('boots') || (id >= 135 && id <= 146) || (id >= 179 && id <= 182);
        };
        const isFood = (id) => {
            const name = (namesSource[id] || '').toLowerCase();
            return name.includes('pork') || name.includes('chicken') || name.includes('mutton') || 
                   name.includes('beef') || name.includes('apple') || name.includes('bread') || 
                   name.includes('melon') || name.includes('berry') || name.includes('seeds') || name.includes('wheat');
        };

        for (const [key, id] of Object.entries(idSource)) {
            if (id === 0 || seenIds.has(id)) continue;
            seenIds.add(id);

            const rawName = namesSource[id] || key.replace(/_/g, ' ');
            const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

            let category = 'materials';
            if (isToolOrWeapon(id)) category = 'tools';
            else if (isArmor(id)) category = 'armor';
            else if (isFood(id)) category = 'food';
            else if (isBlock(id)) category = 'blocks';

            items.push({
                id,
                key,
                name: displayName,
                category
            });
        }

        items.sort((a, b) => a.id - b.id);
        this.cachedItems = items;
        return items;
    }

    // -------------------------------------------------------------------------
    // DYNAMIC MOB REGISTRY
    // -------------------------------------------------------------------------
    getRegisteredMobs() {
        return [
            { name: 'Zombie', category: 'Hostile', color: '#4ade80', cls: Zombie || window.Zombie },
            { name: 'Creeper', category: 'Hostile', color: '#22c55e', cls: Creeper || window.Creeper },
            { name: 'Scorpion', category: 'Hostile', color: '#f59e0b', cls: Scorpion || window.Scorpion },
            { name: 'Gloomstalker', category: 'Boss', color: '#c084fc', cls: Gloomstalker || window.Gloomstalker },
            { name: 'Pig', category: 'Passive', color: '#f472b6', cls: Pig || window.Pig },
            { name: 'Chicken', category: 'Passive', color: '#fef08a', cls: Chicken || window.Chicken },
            { name: 'Sheep', category: 'Passive', color: '#e2e8f0', cls: Sheep || window.Sheep },
            { name: 'Cow', category: 'Passive', color: '#a16207', cls: Cow || window.Cow },
            { name: 'Pigeon', category: 'Passive', color: '#94a3b8', cls: Pigeon || window.Pigeon },
            { name: 'Parrot', category: 'Passive', color: '#ef4444', cls: Parrot || window.Parrot },
            { name: 'Atlas Explorer (Kael)', category: 'NPC', color: '#38bdf8', cls: AtlasExplorer || window.AtlasExplorer }
        ];
    }

    // -------------------------------------------------------------------------
    // UI BUILDER (Undisruptive Corner-Docked 3-Column Debug Menu)
    // -------------------------------------------------------------------------
    buildUI() {
        const modal = document.createElement('div');
        modal.id = 'dev-console-modal';
        modal.className = 'hidden';
        modal.style.position = 'fixed';
        modal.style.inset = '0';
        modal.style.pointerEvents = 'none';
        modal.style.zIndex = '999999';
        modal.style.display = 'none';

        modal.innerHTML = `
            <!-- Main Floating Debug Panel (pointer-events: auto) -->
            <section id="dev-debug-panel" class="dev-debug-panel" role="region" aria-label="Developer Debug Menu">
                <!-- Header -->
                <div class="dev-header">
                    <div class="dev-title-wrap">
                        <span class="dev-title" style="display:inline-flex;align-items:center;gap:6px;">${getPixelIconSvg('wrench', 18)} DEBUG MENU</span>
                        <span class="dev-hotkey-badge" title="Press F7, Fn+F7, or ~ (Tilde)">[F7 / ~]</span>
                    </div>
                    <div class="dev-ctrl-group">
                        <button type="button" class="dev-ctrl-btn" id="dev-dock-btn" title="Flip dock to Left/Right corner">Dock: Right</button>
                        <button type="button" class="dev-ctrl-btn" id="dev-min-btn" title="Minimize debug bar">_</button>
                        <button type="button" class="dev-ctrl-btn close" id="dev-console-close" title="Close (F7 or ~)">✕</button>
                        <button type="button" class="dev-ctrl-btn close" id="dev-console-close" title="Close (F7 or ~)">${getPixelIconSvg('close', 10)}</button>
                    </div>
                </div>

                <!-- 3-Column Actions Grid -->
                <div class="dev-columns-grid">
                    
                    <!-- COLUMN 1: CHEATS & PLAYER -->
                    <div class="dev-col">
                        <div class="dev-col-header">
                            <span style="display:inline-flex;align-items:center;gap:4px;">${getPixelIconSvg('lightning', 15)} Cheats & Player</span>
                        </div>
                        <button type="button" class="dev-grid-btn" id="dev-btn-god">
                            <span>God Mode</span><span class="dev-badge-off">OFF</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-noclip">
                            <span>Fly / Noclip</span><span class="dev-badge-off">OFF</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-instantmine">
                            <span>Instant Mine</span><span class="dev-badge-off">OFF</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-fullbright">
                            <span>Fullbright</span><span class="dev-badge-off">OFF</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-oxygen">
                            <span>Inf Oxygen</span><span class="dev-badge-off">OFF</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-hunger">
                            <span>Inf Hunger</span><span class="dev-badge-off">OFF</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-jump">
                            <span>Super Jump</span><span class="dev-badge-off">OFF</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-hitboxes">
                            <span>Hitboxes</span><span class="dev-badge-off">OFF</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-speed" title="Cycle Walk Speed multiplier">
                            <span>Walk Speed</span><span class="dev-badge-off">1x</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-reach" title="Cycle Block Reach multiplier">
                            <span>Reach</span><span class="dev-badge-off">1x</span>
                        </button>
                        <button type="button" class="dev-grid-btn dev-btn-green" id="dev-btn-heal">
                            <span>Full Heal</span><span class="dev-badge-off">+20HP</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-cure">
                            <span>Clear Debuffs</span><span class="dev-badge-off">Cure</span>
                        </button>
                        <button type="button" class="dev-grid-btn dev-btn-danger" id="dev-btn-suicide">
                            <span>Kill Player</span><span class="dev-badge-off">/kill</span>
                        </button>
                    </div>

                    <!-- COLUMN 2: WORLD & TELEPORT -->
                    <div class="dev-col">
                        <div class="dev-col-header">
                            <span style="display:inline-flex;align-items:center;gap:4px;">${getPixelIconSvg('world', 15)} World & Teleport</span>
                        </div>
                        <button type="button" class="dev-grid-btn" id="dev-btn-noon">
                            <span style="display:inline-flex;align-items:center;gap:5px;">${getPixelIconSvg('sun', 15)} Set Noon</span><span class="dev-badge-off">12:00</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-dawn">
                            <span style="display:inline-flex;align-items:center;gap:5px;">${getPixelIconSvg('dawn', 15)} Set Dawn</span><span class="dev-badge-off">06:00</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-sunset">
                            <span style="display:inline-flex;align-items:center;gap:5px;">${getPixelIconSvg('sunset', 15)} Set Sunset</span><span class="dev-badge-off">18:00</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-midnight">
                            <span style="display:inline-flex;align-items:center;gap:5px;">${getPixelIconSvg('moon', 15)} Set Midnight</span><span class="dev-badge-off">00:00</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-tspd-0">
                            <span>Time Speed: 0x</span><span class="dev-badge-off">Pause</span>
                        </button>
                        <button type="button" class="dev-grid-btn active" id="dev-btn-tspd-1">
                            <span>Time Speed: 1x</span><span class="dev-badge-on">Norm</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-tspd-5">
                            <span>Time Speed: 5x</span><span class="dev-badge-off">Fast</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-tspd-20">
                            <span>Time Speed: 20x</span><span class="dev-badge-off">Hyper</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-day-fwd">
                            <span>Next Day</span><span class="dev-badge-off">Day +1</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-diff">
                            <span>Difficulty</span><span class="dev-badge-off">NORMAL</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-tp-surface">
                            <span>TP Surface</span><span class="dev-badge-off" style="display:inline-flex;align-items:center;">${getPixelIconSvg('surface', 13)}</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-tp-spawn">
                            <span>TP Spawn/Bed</span><span class="dev-badge-off" style="display:inline-flex;align-items:center;">${getPixelIconSvg('bed', 13)}</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-tp-caves">
                            <span>TP Deep Caves</span><span class="dev-badge-off" style="display:inline-flex;align-items:center;">${getPixelIconSvg('pickaxe', 13)}</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-tp-void">
                            <span>TP Bedrock</span><span class="dev-badge-off" style="display:inline-flex;align-items:center;">${getPixelIconSvg('void', 13)}</span>
                        </button>
                        <button type="button" class="dev-grid-btn dev-btn-purple" id="dev-btn-tp-kael">
                            <span>TP to Kael</span><span class="dev-badge-off" style="display:inline-flex;align-items:center;">${getPixelIconSvg('compass', 13)}</span>
                        </button>
                        <button type="button" class="dev-grid-btn dev-btn-green" id="dev-btn-tp-cursor">
                            <span>TP to Cursor</span><span class="dev-badge-off" style="display:inline-flex;align-items:center;">${getPixelIconSvg('cursor', 13)}</span>
                        </button>
                    </div>

                    <!-- COLUMN 3: MOBS & GEAR -->
                    <div class="dev-col">
                        <div class="dev-col-header">
                            <span style="display:inline-flex;align-items:center;gap:4px;">${getPixelIconSvg('monster', 15)} Mobs & Gear</span>
                        </div>
                        <button type="button" class="dev-grid-btn" id="dev-btn-sp-zombie">
                            <span>Spawn Zombie</span><span class="dev-badge-off">Near</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-sp-creeper">
                            <span>Spawn Creeper</span><span class="dev-badge-off">Near</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-sp-gloom">
                            <span>Spawn Gloom</span><span class="dev-badge-off">Boss</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-sp-scorp">
                            <span>Spawn Scorp</span><span class="dev-badge-off">Near</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-sp-passive">
                            <span>Spawn Passive</span><span class="dev-badge-off">Random</span>
                        </button>
                        <button type="button" class="dev-grid-btn dev-btn-purple" id="dev-btn-sp-kael">
                            <span>Spawn Kael</span><span class="dev-badge-off">NPC</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-freeze">
                            <span>Freeze Mobs</span><span class="dev-badge-off">OFF</span>
                        </button>
                        <button type="button" class="dev-grid-btn dev-btn-danger" id="dev-btn-kill-hostiles">
                            <span>Kill Hostiles</span><span class="dev-badge-off">Clear</span>
                        </button>
                        <button type="button" class="dev-grid-btn dev-btn-warn" id="dev-btn-kill-passives">
                            <span>Kill Passives</span><span class="dev-badge-off">Clear</span>
                        </button>
                        <button type="button" class="dev-grid-btn dev-btn-danger" id="dev-btn-kill-all">
                            <span>Kill ALL Mobs</span><span class="dev-badge-off">Wipe</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-clear-drops">
                            <span>Clear Drops</span><span class="dev-badge-off">Items</span>
                        </button>
                        <button type="button" class="dev-grid-btn dev-btn-warn" id="dev-btn-kit-diamond">
                            <span>+ Diamond Kit</span><span class="dev-badge-off">Gear</span>
                        </button>
                        <button type="button" class="dev-grid-btn dev-btn-purple" id="dev-btn-kit-astral">
                            <span>+ Astral Kit</span><span class="dev-badge-off">Gear</span>
                        </button>
                        <button type="button" class="dev-grid-btn dev-btn-green" id="dev-btn-kit-food">
                            <span>+ Food Pack</span><span class="dev-badge-off">32x</span>
                        </button>
                        <button type="button" class="dev-grid-btn dev-btn-danger" id="dev-btn-clear-inv">
                            <span>Clear Inv</span><span class="dev-badge-off">Wipe</span>
                        </button>
                        <button type="button" class="dev-grid-btn" id="dev-btn-toggle-items" style="border-color: #38bdf8; color: #7dd3fc;">
                            <span style="display:inline-flex;align-items:center;gap:4px;">${getPixelIconSvg('chest', 15)} Item Drawer</span><span class="dev-badge-off">OPEN ▶</span>
                            <span style="display:inline-flex;align-items:center;gap:4px;">${getPixelIconSvg('chest', 15)} Item Drawer</span><span class="dev-badge-off">OPEN</span>
                        </button>
                    </div>

                </div>

                <!-- Bottom Command Prompt Row -->
                <div class="dev-cmd-row">
                    <span class="dev-cmd-prompt">></span>
                    <input type="text" id="dev-cmd-input" class="dev-cmd-input" placeholder="/give diamond 64, /time set noon, /god, /fly, /tp..." autocomplete="off" spellcheck="false">
                    <button type="button" class="dev-cmd-btn" id="dev-cmd-send">Run</button>
                </div>
            </section>

            <!-- Minimized Chip (pointer-events: auto) -->
            <div id="dev-minimized-chip" class="dev-minimized-chip" title="Click to expand Developer Console">
                <span style="display:inline-flex;align-items:center;gap:6px;">${getPixelIconSvg('wrench', 16)} Debug Console [F7]</span>
                <span style="font-size: 14px; opacity: 0.8;">(Click to expand)</span>
            </div>

            <!-- Expandable Item Drawer Flyout (pointer-events: auto) -->
            <section id="dev-item-drawer" class="dev-item-drawer hidden" role="dialog" aria-label="Item Spawner Drawer">
                <div class="dev-header">
                    <div class="dev-title-wrap">
                        <span class="dev-title" style="display:inline-flex; align-items:center; gap:6px;">${getPixelIconSvg('chest', 18)} ITEM SPAWNER</span>
                        <span id="dev-items-count-label" class="dev-badge-off" style="color: #ffd34d;">Loading...</span>
                    </div>
                    <button type="button" class="dev-ctrl-btn close" id="dev-drawer-close" title="Close Item Drawer">✕</button>
                    <button type="button" class="dev-ctrl-btn close" id="dev-drawer-close" title="Close Item Drawer">${getPixelIconSvg('close', 10)}</button>
                </div>

                <!-- Search Input & Count Selector -->
                <div style="display: flex; gap: 6px; align-items: center;">
                    <input type="text" id="dev-item-search" placeholder="Search 149+ items or ID..." style="flex: 1; background: #101418; border: 1px solid #333a41; color: #fff; padding: 2px 6px; font-family: 'VT323', monospace; font-size: 16px; outline: none;">
                    <div style="display: flex; gap: 2px; align-items: center;" id="dev-qty-group">
                        <button type="button" class="dev-qty-chip active" data-qty="1">x1</button>
                        <button type="button" class="dev-qty-chip" data-qty="16">x16</button>
                        <button type="button" class="dev-qty-chip" data-qty="32">x32</button>
                        <button type="button" class="dev-qty-chip" data-qty="64">x64</button>
                    </div>
                </div>

                <!-- Category Filters -->
                <div style="display: flex; flex-wrap: wrap; gap: 3px;" id="dev-cat-group">
                    <button type="button" class="dev-cat-chip active" data-cat="all">All</button>
                    <button type="button" class="dev-cat-chip" data-cat="blocks">Blocks</button>
                    <button type="button" class="dev-cat-chip" data-cat="tools">Tools</button>
                    <button type="button" class="dev-cat-chip" data-cat="armor">Armor</button>
                    <button type="button" class="dev-cat-chip" data-cat="food">Food</button>
                    <button type="button" class="dev-cat-chip" data-cat="materials">Minerals</button>
                </div>

                <!-- Items Grid (Stone Inset) -->
                <div style="flex: 1; min-height: 280px; max-height: 380px; background: #12161c; border: 2px solid #080a0c; padding: 4px; overflow-y: auto;" class="custom-scrollbar">
                    <div id="dev-items-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)); gap: 4px;">
                        <!-- Rendered dynamically -->
                    </div>
                </div>

                <div style="font-size: 13px; color: #8292a0; display: flex; justify-content: space-between;">
                    <span>Click slot to give item. Shift+Click for full stack (x64).</span>
                </div>
            </section>
        `;

        document.body.appendChild(modal);
        this.containerEl = modal;
        this.updatePanelPosition();
        this.renderItemsGrid();
        this.updateCheatsButtons();
    }

    // -------------------------------------------------------------------------
    // CORNER DOCKING & POSITIONING
    // -------------------------------------------------------------------------
    updatePanelPosition() {
        const panel = document.getElementById('dev-debug-panel');
        const drawer = document.getElementById('dev-item-drawer');
        const chip = document.getElementById('dev-minimized-chip');
        const dockBtn = document.getElementById('dev-dock-btn');
        if (!panel) return;

        const drawerWidth = drawer ? (drawer.offsetWidth || 370) : 370;

        if (!this._customPos) {
            panel.style.transition = 'left 0.15s ease, right 0.15s ease, bottom 0.15s ease';
            if (this.dockSide === 'left') {
                panel.style.left = '14px';
                panel.style.right = 'auto';
                panel.style.bottom = '24px';
                panel.style.top = 'auto';

                if (drawer) {
                    let dLeft = 556;
                    if (dLeft + drawerWidth + 14 > window.innerWidth) {
                        dLeft = Math.max(14, window.innerWidth - drawerWidth - 14);
                    }
                    drawer.style.left = `${dLeft}px`;
                    drawer.style.right = 'auto';
                    drawer.style.bottom = '24px';
                    drawer.style.top = 'auto';
                }
                if (chip) {
                    chip.style.left = '14px';
                    chip.style.right = 'auto';
                    chip.style.bottom = '24px';
                    chip.style.top = 'auto';
                }
                if (dockBtn) dockBtn.textContent = 'Dock: Right';
            } else {
                panel.style.right = '14px';
                panel.style.left = 'auto';
                panel.style.bottom = '24px';
                panel.style.top = 'auto';

                if (drawer) {
                    let dRight = 556;
                    if (dRight + drawerWidth + 14 > window.innerWidth) {
                        dRight = Math.max(14, window.innerWidth - drawerWidth - 14);
                    }
                    drawer.style.right = `${dRight}px`;
                    drawer.style.left = 'auto';
                    drawer.style.bottom = '24px';
                    drawer.style.top = 'auto';
                }
                if (chip) {
                    chip.style.right = '14px';
                    chip.style.left = 'auto';
                    chip.style.bottom = '24px';
                    chip.style.top = 'auto';
                }
                if (dockBtn) dockBtn.textContent = 'Dock: Left';
            }
        } else if (drawer && this.itemDrawerOpen) {
            const rect = panel.getBoundingClientRect();
            drawer.style.top = `${rect.top}px`;
            drawer.style.bottom = 'auto';
            if (rect.left + rect.width + drawerWidth + 10 > window.innerWidth) {
                drawer.style.left = `${Math.max(14, rect.left - drawerWidth - 6)}px`;
                drawer.style.right = 'auto';
            } else {
                drawer.style.left = `${rect.left + rect.width + 6}px`;
                drawer.style.right = 'auto';
            }
        }
    }

    toggleDock() {
        this._customPos = false;
        this.dockSide = (this.dockSide === 'left') ? 'right' : 'left';
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('webcraft_dev_dock', this.dockSide);
            }
        } catch (e) {}
        this.updatePanelPosition();
        showToast(`Debug Menu docked to ${this.dockSide.toUpperCase()}`);
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        const panel = document.getElementById('dev-debug-panel');
        const chip = document.getElementById('dev-minimized-chip');
        const drawer = document.getElementById('dev-item-drawer');

        if (this.isMinimized) {
            if (panel) panel.style.display = 'none';
            if (drawer) drawer.style.display = 'none';
            if (chip) {
                chip.style.display = 'flex';
                chip.style.left = (this.dockSide === 'left') ? '14px' : 'auto';
                chip.style.right = (this.dockSide === 'right') ? '14px' : 'auto';
                chip.style.bottom = '24px';
                chip.style.top = 'auto';
            }
        } else {
            if (panel) panel.style.display = 'flex';
            if (drawer && this.itemDrawerOpen) drawer.style.display = 'flex';
            if (chip) chip.style.display = 'none';
            this.updatePanelPosition();
        }
    }

    toggleItemDrawer(force) {
        if (force !== undefined) {
            this.itemDrawerOpen = force;
        } else {
            this.itemDrawerOpen = !this.itemDrawerOpen;
        }
        const drawer = document.getElementById('dev-item-drawer');
        const toggleBtn = document.getElementById('dev-btn-toggle-items');
        if (!drawer) return;

        if (this.itemDrawerOpen) {
            drawer.classList.remove('hidden');
            drawer.style.display = 'flex';
            drawer.style.visibility = 'visible';
            drawer.style.opacity = '1';
            drawer.style.pointerEvents = 'auto';
            if (toggleBtn) {
                toggleBtn.classList.add('active');
                toggleBtn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:4px;">' + getPixelIconSvg('chest', 15) + ' Item Drawer</span><span class="dev-badge-on">OPEN ◀</span>';
                toggleBtn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:4px;">' + getPixelIconSvg('chest', 15) + ' Item Drawer</span><span class="dev-badge-on">OPEN</span>';
            }
            this.renderItemsGrid();
            this.updatePanelPosition();
        } else {
            drawer.classList.add('hidden');
            drawer.style.display = 'none';
            drawer.style.visibility = 'hidden';
            if (toggleBtn) {
                toggleBtn.classList.remove('active');
                toggleBtn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:4px;">' + getPixelIconSvg('chest', 15) + ' Item Drawer</span><span class="dev-badge-off">CLOSED ▶</span>';
                toggleBtn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:4px;">' + getPixelIconSvg('chest', 15) + ' Item Drawer</span><span class="dev-badge-off">CLOSED</span>';
            }
        }
    }

    // -------------------------------------------------------------------------
    // RENDER ITEMS IN THE ITEM DRAWER
    // -------------------------------------------------------------------------
    renderItemsGrid() {
        const grid = document.getElementById('dev-items-grid');
        const countLabel = document.getElementById('dev-items-count-label');
        if (!grid) return;

        const allItems = this.getAllRegisteredItems();
        const search = this.itemSearchTerm.toLowerCase().trim();
        const cat = this.selectedCategory;

        const filtered = allItems.filter(item => {
            if (cat !== 'all' && item.category !== cat) return false;
            if (search) {
                const idMatch = String(item.id).includes(search);
                const nameMatch = item.name.toLowerCase().includes(search);
                const keyMatch = item.key.toLowerCase().includes(search);
                if (!idMatch && !nameMatch && !keyMatch) return false;
            }
            return true;
        });

        if (countLabel) {
            countLabel.textContent = `${filtered.length}/${allItems.length}`;
        }

        if (filtered.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; padding: 20px; text-align: center; color: #8292a0; font-size: 18px;">No items match "${this.itemSearchTerm}"</div>`;
            return;
        }

        const fragment = document.createDocumentFragment();

        filtered.forEach(item => {
            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.style.width = '42px';
            slot.style.height = '42px';
            slot.style.position = 'relative';
            slot.style.display = 'flex';
            slot.style.alignItems = 'center';
            slot.style.justifyContent = 'center';
            slot.style.cursor = 'pointer';
            slot.title = `${item.name} (#${item.id})\nClick to give ${this.giveCount}`;
            slot.dataset.itemId = item.id;

            const tex = (typeof textures !== 'undefined' && textures[item.id]) ? textures[item.id] : null;
            const imgSrc = tex?.src || '';

            if (imgSrc) {
                const img = document.createElement('img');
                img.src = imgSrc;
                img.className = 'pixelated pointer-events-none';
                img.style.width = '28px';
                img.style.height = '28px';
                img.style.imageRendering = 'pixelated';
                slot.appendChild(img);
            } else {
                const span = document.createElement('span');
                span.style.fontSize = '12px';
                span.style.color = '#ffd34d';
                span.textContent = item.name.slice(0, 3);
                slot.appendChild(span);
            }

            const idBadge = document.createElement('span');
            idBadge.style.position = 'absolute';
            idBadge.style.top = '1px';
            idBadge.style.left = '2px';
            idBadge.style.fontSize = '9px';
            idBadge.style.color = '#94a3b8';
            idBadge.style.pointerEvents = 'none';
            idBadge.style.lineHeight = '1';
            idBadge.textContent = item.id;
            slot.appendChild(idBadge);

            slot.addEventListener('click', (e) => {
                const count = e.shiftKey ? 64 : this.giveCount;
                this.givePlayerItem(item.id, count, item.name);
            });

            fragment.appendChild(slot);
        });

        grid.innerHTML = '';
        grid.appendChild(fragment);
    }

    // -------------------------------------------------------------------------
    // EVENT BINDINGS
    // -------------------------------------------------------------------------
    bindEvents() {
        const modal = this.containerEl;
        if (!modal) return;

        // Window/panel controls
        const closeBtn = document.getElementById('dev-console-close');
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());

        const dockBtn = document.getElementById('dev-dock-btn');
        if (dockBtn) dockBtn.addEventListener('click', () => this.toggleDock());

        const minBtn = document.getElementById('dev-min-btn');
        if (minBtn) minBtn.addEventListener('click', () => this.toggleMinimize());

        const chip = document.getElementById('dev-minimized-chip');
        if (chip) chip.addEventListener('click', () => this.toggleMinimize());

        const drawerClose = document.getElementById('dev-drawer-close');
        if (drawerClose) drawerClose.addEventListener('click', () => this.toggleItemDrawer(false));

        // Ensure all buttons in modal have tabindex="-1" and blur on click so keyboard controls are never stolen
        modal.querySelectorAll('button').forEach(btn => {
            btn.setAttribute('tabindex', '-1');
            btn.addEventListener('click', () => {
                btn.blur();
                const canvas = document.getElementById('gameCanvas');
                if (canvas && typeof canvas.focus === 'function') canvas.focus();
            });
        });

        const panel = document.getElementById('dev-debug-panel');
        if (panel) {
            panel.addEventListener('mousedown', (e) => {
                if (e.target && e.target.tagName !== 'INPUT') {
                    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
                        document.activeElement.blur();
                    }
                }
            });
        }

        // Free Window Dragging Support on .dev-header
        const header = modal.querySelector('.dev-header');
        if (header && panel) {
            header.style.cursor = 'grab';

            const onHeaderPointerDown = (e) => {
                if (e.target.closest('button') || e.target.closest('input')) return;

                this._isDragging = true;
                this._customPos = true;
                const rect = panel.getBoundingClientRect();
                this._dragOffsetX = e.clientX - rect.left;
                this._dragOffsetY = e.clientY - rect.top;
                header.style.cursor = 'grabbing';
                panel.style.transition = 'none';
                e.preventDefault();
            };

            const onHeaderPointerMove = (e) => {
                if (!this._isDragging) return;

                const panelWidth = panel.offsetWidth || 530;
                const panelHeight = panel.offsetHeight || 300;
                const maxLeft = Math.max(0, window.innerWidth - panelWidth);
                const maxTop = Math.max(0, window.innerHeight - panelHeight);

                const newLeft = Math.max(0, Math.min(maxLeft, e.clientX - this._dragOffsetX));
                const newTop = Math.max(0, Math.min(maxTop, e.clientY - this._dragOffsetY));

                panel.style.left = `${newLeft}px`;
                panel.style.top = `${newTop}px`;
                panel.style.bottom = 'auto';
                panel.style.right = 'auto';

                const drawer = document.getElementById('dev-item-drawer');
                if (drawer && this.itemDrawerOpen) {
                    drawer.style.transition = 'none';
                    drawer.style.top = `${newTop}px`;
                    drawer.style.bottom = 'auto';
                    if (newLeft + panelWidth + 380 > window.innerWidth) {
                        drawer.style.left = `${Math.max(0, newLeft - 376)}px`;
                        drawer.style.right = 'auto';
                    } else {
                        drawer.style.left = `${newLeft + panelWidth + 6}px`;
                        drawer.style.right = 'auto';
                    }
                }
            };

            const onHeaderPointerUp = () => {
                if (this._isDragging) {
                    this._isDragging = false;
                    header.style.cursor = 'grab';
                }
            };

            header.addEventListener('mousedown', onHeaderPointerDown);
            window.addEventListener('mousemove', onHeaderPointerMove);
            window.addEventListener('mouseup', onHeaderPointerUp);
        }

        // Keyboard safety: ONLY stop propagation when focused on an input
        const stopIfInput = (e) => {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
                if (e.key === 'Escape') {
                    e.target.blur();
                    const canvas = document.getElementById('gameCanvas');
                    if (canvas && typeof canvas.focus === 'function') canvas.focus();
                    return;
                }
                e.stopPropagation();
            }
        };
        modal.addEventListener('keydown', stopIfInput);
        modal.addEventListener('keyup', stopIfInput);
        modal.addEventListener('keypress', stopIfInput);

        // Column 1: Cheats & Player
        const bindCheat = (btnId, key, label) => {
            const btn = document.getElementById(btnId);
            if (!btn) return;
            btn.addEventListener('click', () => {
                window.devCheats[key] = !window.devCheats[key];
                this.updateCheatsButtons();
                showToast(`${label}: ${window.devCheats[key] ? 'ON' : 'OFF'}`);
                this.log(`${label}: ${window.devCheats[key] ? 'ENABLED' : 'DISABLED'}`);
            });
        };

        bindCheat('dev-btn-god', 'godMode', 'God Mode');
        bindCheat('dev-btn-noclip', 'noclip', 'Fly / Noclip');
        bindCheat('dev-btn-instantmine', 'instantMine', 'Instant Mining');
        bindCheat('dev-btn-fullbright', 'fullbright', 'Fullbright');
        bindCheat('dev-btn-oxygen', 'infiniteOxygen', 'Infinite Oxygen');
        bindCheat('dev-btn-hunger', 'infiniteHunger', 'Infinite Hunger');
        bindCheat('dev-btn-jump', 'highJump', 'Super Jump');
        bindCheat('dev-btn-hitboxes', 'showHitboxes', 'Show Hitboxes');
        bindCheat('dev-btn-freeze', 'freezeMobs', 'Freeze Mob AI');

        const speedBtn = document.getElementById('dev-btn-speed');
        if (speedBtn) speedBtn.addEventListener('click', () => this.cycleWalkSpeed());

        const reachBtn = document.getElementById('dev-btn-reach');
        if (reachBtn) reachBtn.addEventListener('click', () => this.cycleReach());

        const healBtn = document.getElementById('dev-btn-heal');
        if (healBtn) healBtn.addEventListener('click', () => this.healPlayer());

        const cureBtn = document.getElementById('dev-btn-cure');
        if (cureBtn) cureBtn.addEventListener('click', () => this.curePlayerDebuffs());

        const suicideBtn = document.getElementById('dev-btn-suicide');
        if (suicideBtn) suicideBtn.addEventListener('click', () => this.killPlayer());

        // Column 2: World & Teleport
        const btnNoon = document.getElementById('dev-btn-noon');
        if (btnNoon) btnNoon.addEventListener('click', () => this.setTimeOfDay(0.25));

        const btnDawn = document.getElementById('dev-btn-dawn');
        if (btnDawn) btnDawn.addEventListener('click', () => this.setTimeOfDay(0.95));

        const btnSunset = document.getElementById('dev-btn-sunset');
        if (btnSunset) btnSunset.addEventListener('click', () => this.setTimeOfDay(0.62));

        const btnMidnight = document.getElementById('dev-btn-midnight');
        if (btnMidnight) btnMidnight.addEventListener('click', () => this.setTimeOfDay(0.78));

        const bindTimeSpeed = (btnId, spd) => {
            const btn = document.getElementById(btnId);
            if (!btn) return;
            btn.addEventListener('click', () => {
                this.setTimeSpeed(spd);
            });
        };
        bindTimeSpeed('dev-btn-tspd-0', 0);
        bindTimeSpeed('dev-btn-tspd-1', 1);
        bindTimeSpeed('dev-btn-tspd-5', 5);
        bindTimeSpeed('dev-btn-tspd-20', 20);

        const btnDayFwd = document.getElementById('dev-btn-day-fwd');
        if (btnDayFwd) btnDayFwd.addEventListener('click', () => this.advanceDay(1));

        const btnDiff = document.getElementById('dev-btn-diff');
        if (btnDiff) btnDiff.addEventListener('click', () => this.cycleDifficulty());

        const btnTpSurface = document.getElementById('dev-btn-tp-surface');
        if (btnTpSurface) btnTpSurface.addEventListener('click', () => this.teleportPlayer('surface'));

        const btnTpSpawn = document.getElementById('dev-btn-tp-spawn');
        if (btnTpSpawn) btnTpSpawn.addEventListener('click', () => this.teleportPlayer('spawn'));

        const btnTpCaves = document.getElementById('dev-btn-tp-caves');
        if (btnTpCaves) btnTpCaves.addEventListener('click', () => this.teleportPlayer('caves'));

        const btnTpVoid = document.getElementById('dev-btn-tp-void');
        if (btnTpVoid) btnTpVoid.addEventListener('click', () => this.teleportPlayer('void'));

        const btnTpKael = document.getElementById('dev-btn-tp-kael');
        if (btnTpKael) btnTpKael.addEventListener('click', () => this.teleportPlayer('kael'));

        const btnTpCursor = document.getElementById('dev-btn-tp-cursor');
        if (btnTpCursor) btnTpCursor.addEventListener('click', () => this.teleportPlayer('cursor'));

        // Column 3: Mobs & Gear
        const btnSpZombie = document.getElementById('dev-btn-sp-zombie');
        if (btnSpZombie) btnSpZombie.addEventListener('click', () => this.spawnMob('Zombie'));

        const btnSpCreeper = document.getElementById('dev-btn-sp-creeper');
        if (btnSpCreeper) btnSpCreeper.addEventListener('click', () => this.spawnMob('Creeper'));

        const btnSpGloom = document.getElementById('dev-btn-sp-gloom');
        if (btnSpGloom) btnSpGloom.addEventListener('click', () => this.spawnMob('Gloomstalker'));

        const btnSpScorp = document.getElementById('dev-btn-sp-scorp');
        if (btnSpScorp) btnSpScorp.addEventListener('click', () => this.spawnMob('Scorpion'));

        const btnSpPassive = document.getElementById('dev-btn-sp-passive');
        if (btnSpPassive) btnSpPassive.addEventListener('click', () => this.spawnRandomPassive());

        const btnSpKael = document.getElementById('dev-btn-sp-kael');
        if (btnSpKael) btnSpKael.addEventListener('click', () => this.spawnMob('Atlas Explorer (Kael)'));

        const btnKillHostiles = document.getElementById('dev-btn-kill-hostiles');
        if (btnKillHostiles) btnKillHostiles.addEventListener('click', () => this.killMobs('hostiles'));

        const btnKillPassives = document.getElementById('dev-btn-kill-passives');
        if (btnKillPassives) btnKillPassives.addEventListener('click', () => this.killMobs('passives'));

        const btnKillAll = document.getElementById('dev-btn-kill-all');
        if (btnKillAll) btnKillAll.addEventListener('click', () => this.killMobs('all'));

        const btnClearDrops = document.getElementById('dev-btn-clear-drops');
        if (btnClearDrops) btnClearDrops.addEventListener('click', () => this.clearDroppedItems());

        const btnKitDiamond = document.getElementById('dev-btn-kit-diamond');
        if (btnKitDiamond) btnKitDiamond.addEventListener('click', () => this.giveKit('diamond'));

        const btnKitAstral = document.getElementById('dev-btn-kit-astral');
        if (btnKitAstral) btnKitAstral.addEventListener('click', () => this.giveKit('astral'));

        const btnKitFood = document.getElementById('dev-btn-kit-food');
        if (btnKitFood) btnKitFood.addEventListener('click', () => this.giveKit('food'));

        const btnClearInv = document.getElementById('dev-btn-clear-inv');
        if (btnClearInv) btnClearInv.addEventListener('click', () => this.clearPlayerInventory());

        const toggleItemsBtn = document.getElementById('dev-btn-toggle-items');
        if (toggleItemsBtn) {
            toggleItemsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleItemDrawer();
            });
        }

        // Item Drawer Filters & Search
        const searchInput = document.getElementById('dev-item-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.itemSearchTerm = e.target.value;
                this.renderItemsGrid();
            });
        }

        const qtyChips = modal.querySelectorAll('.dev-qty-chip');
        qtyChips.forEach(chip => {
            chip.addEventListener('click', () => {
                qtyChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.giveCount = parseInt(chip.dataset.qty, 10) || 1;
            });
        });

        const catChips = modal.querySelectorAll('.dev-cat-chip');
        catChips.forEach(chip => {
            chip.addEventListener('click', () => {
                catChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.selectedCategory = chip.dataset.cat;
                this.renderItemsGrid();
            });
        });

        // Command Console Input & Execution
        const cmdInput = document.getElementById('dev-cmd-input');
        const cmdSend = document.getElementById('dev-cmd-send');
        if (cmdSend && cmdInput) {
            const executeCmd = () => {
                const text = cmdInput.value.trim();
                if (text) {
                    this.executeCommand(text);
                    this.commandHistory.push(text);
                    this.historyIndex = this.commandHistory.length;
                    cmdInput.value = '';
                }
                cmdInput.blur();
                const canvas = document.getElementById('gameCanvas');
                if (canvas && typeof canvas.focus === 'function') canvas.focus();
            };
            cmdSend.addEventListener('click', executeCmd);
            cmdInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    executeCmd();
                } else if (e.key === 'Escape') {
                    cmdInput.blur();
                    const canvas = document.getElementById('gameCanvas');
                    if (canvas && typeof canvas.focus === 'function') canvas.focus();
                } else if (e.key === 'ArrowUp') {
                    if (this.historyIndex > 0) {
                        this.historyIndex--;
                        cmdInput.value = this.commandHistory[this.historyIndex] || '';
                    }
                } else if (e.key === 'ArrowDown') {
                    if (this.historyIndex < this.commandHistory.length - 1) {
                        this.historyIndex++;
                        cmdInput.value = this.commandHistory[this.historyIndex] || '';
                    } else {
                        this.historyIndex = this.commandHistory.length;
                        cmdInput.value = '';
                    }
                }
            });
        }
    }

    // -------------------------------------------------------------------------
    // ACTIONS: ITEMS & KITS
    // -------------------------------------------------------------------------
    givePlayerItem(id, count, name) {
        const p = this.getPlayer();
        if (!p) {
            showToast('No active player in world');
            return;
        }

        const success = (typeof giveItem === 'function') ? giveItem(id, count) : (window.giveItem ? window.giveItem(id, count) : false);
        if (typeof updateUI === 'function') updateUI();
        playSound('pop');
        const itemName = name || (ID_NAMES[id] || `Item #${id}`);
        showToast(`+${count} ${itemName}`);
        this.log(`Gave ${count}x ${itemName} (#${id})`);
    }

    giveKit(type) {
        const idMap = (typeof IDS !== 'undefined') ? IDS : (window.IDS || {});
        if (type === 'diamond') {
            const kit = [
                { id: idMap.DIAMOND_SWORD, count: 1 },
                { id: idMap.DIAMOND_PICKAXE, count: 1 },
                { id: idMap.DIAMOND_AXE, count: 1 },
                { id: idMap.DIAMOND_SHOVEL, count: 1 },
                { id: idMap.HELMET_DIAMOND, count: 1 },
                { id: idMap.CHESTPLATE_DIAMOND, count: 1 },
                { id: idMap.LEGGINGS_DIAMOND, count: 1 },
                { id: idMap.BOOTS_DIAMOND, count: 1 },
                { id: idMap.COOKED_BEEF, count: 32 }
            ];
            kit.forEach(item => this.givePlayerItem(item.id, item.count));
            showToast('Diamond Gear Kit equipped!');
            this.log('Equipped player with Diamond Gear Kit');
        } else if (type === 'astral') {
            const kit = [
                { id: idMap.ASTRAL_SWORD, count: 1 },
                { id: idMap.ASTRAL_PICKAXE, count: 1 },
                { id: idMap.ASTRAL_AXE, count: 1 },
                { id: idMap.ASTRAL_SHOVEL, count: 1 },
                { id: idMap.ASTRAL_HELMET, count: 1 },
                { id: idMap.ASTRAL_CHESTPLATE, count: 1 },
                { id: idMap.ASTRAL_LEGGINGS, count: 1 },
                { id: idMap.ASTRAL_BOOTS, count: 1 },
                { id: idMap.ASTRAL_EMERALD, count: 16 }
            ];
            kit.forEach(item => this.givePlayerItem(item.id, item.count));
            showToast('Astral Gear Kit equipped!');
            this.log('Equipped player with Astral Gear Kit');
        } else if (type === 'food') {
            const idSource = (typeof IDS !== 'undefined') ? IDS : (window.IDS || {});
            const beefId = idSource.COOKED_BEEF || 103;
            const appleId = idSource.GOLDEN_APPLE || idSource.APPLE || 107;
            this.givePlayerItem(beefId, 32);
            this.givePlayerItem(appleId, 8);
            showToast('Food Pack given (+32 Steak, +8 Apples)');
            this.log('Gave food ration pack');
        }
    }

    clearPlayerInventory() {
        const liveInv = (typeof window !== 'undefined' && Array.isArray(window.inventory)) 
            ? window.inventory 
            : (typeof inventory !== 'undefined' && Array.isArray(inventory) ? inventory : null);

        if (Array.isArray(liveInv)) {
            for (let i = 0; i < liveInv.length; i++) {
                liveInv[i] = null;
            }
            if (typeof setEngineInventory === 'function') {
                setEngineInventory(liveInv);
            } else if (typeof window !== 'undefined' && typeof window.setEngineInventory === 'function') {
                window.setEngineInventory(liveInv);
            }

            if (typeof window !== 'undefined') {
                window.inventory = liveInv;
                if (typeof window.setHeldItemObj === 'function') {
                    window.setHeldItemObj(null);
                } else {
                    window.heldItemObj = null;
                }
            }

            if (typeof updateUI === 'function') {
                updateUI();
            } else if (typeof window !== 'undefined' && typeof window.updateUI === 'function') {
                window.updateUI();
            }

            playSound('pop');
            showToast('Inventory cleared');
            this.log('Cleared all player inventory slots');
        } else {
            showToast('Inventory object unavailable');
        }
    }

    // -------------------------------------------------------------------------
    // ACTIONS: MOBS
    // -------------------------------------------------------------------------
    spawnMob(mobName, location = 'near') {
        const p = this.getPlayer();
        if (!p) {
            showToast('No player in world to spawn near');
            return;
        }

        let sx = p.x + (p.facingRight ? 40 : -40);
        let sy = p.y;

        if (location === 'cursor') {
            const m = (typeof window !== 'undefined' && window.mouse) ? window.mouse : null;
            if (m && Number.isFinite(m.worldX)) {
                sx = m.worldX;
                sy = m.worldY;
            }
        }

        const mobsList = this.getRegisteredMobs();
        const found = mobsList.find(m => m.name.toLowerCase().includes(mobName.toLowerCase()));

        if (!found || !found.cls) {
            showToast(`Unknown mob type: ${mobName}`);
            return;
        }

        try {
            const mobInstance = new found.cls(sx, sy);
            const liveEntities = (typeof window !== 'undefined' && Array.isArray(window.entities)) ? window.entities : entities;
            if (Array.isArray(liveEntities)) {
                liveEntities.push(mobInstance);
                if (typeof setEngineEntities === 'function') setEngineEntities(liveEntities);
            }

            // Category & mob-specific audio & visual spawn effects
            const liveParticles = (typeof window !== 'undefined' && Array.isArray(window.particles)) ? window.particles : (typeof particles !== 'undefined' && Array.isArray(particles) ? particles : null);
            const ParticleCls = (typeof window !== 'undefined' && window.Particle) ? window.Particle : (typeof Particle !== 'undefined' ? Particle : null);

            const isPassive = found.category === 'Passive';
            const isGloom = found.name.toLowerCase().includes('gloom');
            const isZombie = found.name.toLowerCase().includes('zombie');
            const isCreeper = found.name.toLowerCase().includes('creeper');
            const isScorpion = found.name.toLowerCase().includes('scorp');
            const isKael = found.name.toLowerCase().includes('kael');

            if (isPassive) {
                // Gentle pleasant pop with clean white and spring-green sparkle puffs
                playSound('pop');
                if (liveParticles && ParticleCls) {
                    for (let i = 0; i < 8; i++) {
                        const px = sx + (Math.random() - 0.5) * 16;
                        const py = sy + (Math.random() - 0.5) * 12;
                        const col = Math.random() < 0.5 ? '#ffffff' : (Math.random() < 0.5 ? '#e2e8f0' : '#86efac');
                        liveParticles.push(new ParticleCls(px, py, col));
                    }
                }
            } else if (isGloom) {
                // Gloomstalker boss: Void screech and deep purple gloom wisp particles
                playSound('gloom_screech', { vol: 0.45 });
                if (liveParticles && ParticleCls) {
                    for (let i = 0; i < 14; i++) {
                        const px = sx + (Math.random() - 0.5) * 20;
                        const py = sy + (Math.random() - 0.5) * 24;
                        const col = ['#38006b', '#7c3aed', '#a855f7', '#c084fc'][Math.floor(Math.random() * 4)];
                        liveParticles.push(new ParticleCls(px, py, col));
                    }
                }
            } else if (isZombie) {
                playSound('zombie_groan');
                if (liveParticles && ParticleCls) {
                    for (let i = 0; i < 8; i++) {
                        const px = sx + (Math.random() - 0.5) * 16;
                        const py = sy + (Math.random() - 0.5) * 16;
                        liveParticles.push(new ParticleCls(px, py, Math.random() < 0.5 ? '#4ade80' : '#166534'));
                    }
                }
            } else if (isCreeper) {
                playSound('pop');
                if (liveParticles && ParticleCls) {
                    for (let i = 0; i < 8; i++) {
                        const px = sx + (Math.random() - 0.5) * 16;
                        const py = sy + (Math.random() - 0.5) * 16;
                        liveParticles.push(new ParticleCls(px, py, '#22c55e'));
                    }
                }
            } else if (isScorpion) {
                playSound('hit');
                if (liveParticles && ParticleCls) {
                    for (let i = 0; i < 8; i++) {
                        const px = sx + (Math.random() - 0.5) * 16;
                        const py = sy + (Math.random() - 0.5) * 16;
                        liveParticles.push(new ParticleCls(px, py, Math.random() < 0.5 ? '#f59e0b' : '#d97706'));
                    }
                }
            } else if (isKael) {
                playSound('portal_warp');
                if (liveParticles && ParticleCls) {
                    for (let i = 0; i < 10; i++) {
                        const px = sx + (Math.random() - 0.5) * 16;
                        const py = sy + (Math.random() - 0.5) * 24;
                        liveParticles.push(new ParticleCls(px, py, Math.random() < 0.5 ? '#38bdf8' : '#fef08a'));
                    }
                }
            } else {
                playSound('pop');
            }

            showToast(`Spawned ${mobName}`);
            this.log(`Spawned ${mobName} at (${Math.round(sx)}, ${Math.round(sy)})`);
        } catch (err) {
            console.error('Failed to spawn mob:', err);
            showToast(`Error spawning ${mobName}`);
        }
    }

    spawnRandomPassive() {
        const passives = ['Pig', 'Cow', 'Sheep', 'Chicken'];
        const chosen = passives[Math.floor(Math.random() * passives.length)];
        this.spawnMob(chosen, 'near');
    }

    killMobs(filter) {
        let liveEntities = (typeof window !== 'undefined' && Array.isArray(window.entities)) ? window.entities : entities;
        if (!Array.isArray(liveEntities)) return;

        const beforeCount = liveEntities.length;

        if (filter === 'hostiles') {
            liveEntities = liveEntities.filter(e => !(e instanceof Zombie || e instanceof Creeper || e instanceof Scorpion || e instanceof Gloomstalker));
        } else if (filter === 'passives') {
            liveEntities = liveEntities.filter(e => (e instanceof Zombie || e instanceof Creeper || e instanceof Scorpion || e instanceof Gloomstalker || e instanceof AtlasExplorer));
        } else if (filter === 'all') {
            liveEntities = [];
        }

        if (typeof setEngineEntities === 'function') setEngineEntities(liveEntities);
        if (typeof window !== 'undefined') window.entities = liveEntities;

        const removed = beforeCount - liveEntities.length;
        showToast(`Eliminated ${removed} entities`);
        this.log(`Removed ${removed} entities (filter: ${filter})`);
    }

    clearDroppedItems() {
        const liveDrops = (typeof window !== 'undefined' && Array.isArray(window.droppedItems)) ? window.droppedItems : droppedItems;
        if (Array.isArray(liveDrops)) {
            const count = liveDrops.length;
            liveDrops.length = 0;
            showToast(`Cleared ${count} dropped items`);
            this.log(`Cleared ${count} dropped items from world`);
        }
    }

    // -------------------------------------------------------------------------
    // ACTIONS: TIME & WORLD
    // -------------------------------------------------------------------------
    setTimeOfDay(val) {
        const safeVal = Math.max(0, Math.min(1, val));
        if (typeof setEngineTimeOfDay === 'function') setEngineTimeOfDay(safeVal);
        if (typeof window !== 'undefined') window.timeOfDay = safeVal;
        showToast(`Time set to ${this.formatTimeOfDay(safeVal)}`);
        this.log(`Time of day set to ${safeVal.toFixed(2)}`);
    }

    setTimeSpeed(spd) {
        window.devCheats.timeSpeed = spd;
        this.updateCheatsButtons();
        showToast(`Time Speed: ${spd}x`);
        this.log(`Time simulation speed set to ${spd}x`);
    }

    formatTimeOfDay(t) {
        const hours = Math.floor(t * 24);
        const minutes = Math.floor((t * 24 - hours) * 60);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
        return `${displayHours}:${displayMinutes} ${ampm} (${t.toFixed(2)})`;
    }

    advanceDay(delta = 1) {
        const cur = (typeof window !== 'undefined' && window.dayCount) ? window.dayCount : (typeof dayCount !== 'undefined' ? dayCount : 1);
        const next = Math.max(1, cur + delta);
        if (typeof setEngineDayCount === 'function') setEngineDayCount(next);
        if (typeof window !== 'undefined') window.dayCount = next;
        showToast(`Advanced to Day ${next}`);
        this.log(`Calendar day advanced to ${next}`);
    }

    cycleDifficulty() {
        const diffs = ['peaceful', 'easy', 'normal', 'hard', 'hardcore'];
        const cur = (typeof window !== 'undefined' && window.currentDifficulty) ? window.currentDifficulty : 'normal';
        let idx = diffs.indexOf(cur);
        if (idx === -1 || idx >= diffs.length - 1) idx = 0;
        else idx++;
        const nextDiff = diffs[idx];
        if (typeof setEngineCurrentDifficulty === 'function') setEngineCurrentDifficulty(nextDiff);
        if (typeof window !== 'undefined') window.currentDifficulty = nextDiff;
        this.updateCheatsButtons();
        showToast(`Difficulty: ${nextDiff.toUpperCase()}`);
        this.log(`Difficulty changed to ${nextDiff}`);
    }

    cycleWalkSpeed() {
        const speeds = [1.0, 1.5, 2.0, 3.0, 5.0];
        const cur = window.devCheats.speedMultiplier || 1.0;
        let idx = speeds.indexOf(cur);
        if (idx === -1 || idx >= speeds.length - 1) idx = 0;
        else idx++;
        window.devCheats.speedMultiplier = speeds[idx];
        this.updateCheatsButtons();
        showToast(`Walk Speed: ${speeds[idx]}x`);
        this.log(`Walk speed multiplier set to ${speeds[idx]}x`);
    }

    cycleReach() {
        const reaches = [1.0, 2.0, 3.0, 5.0];
        const cur = window.devCheats.reachMultiplier || 1.0;
        let idx = reaches.indexOf(cur);
        if (idx === -1 || idx >= reaches.length - 1) idx = 0;
        else idx++;
        window.devCheats.reachMultiplier = reaches[idx];
        this.updateCheatsButtons();
        showToast(`Reach: ${reaches[idx]}x (${reaches[idx] * 5} tiles)`);
        this.log(`Reach distance set to ${reaches[idx]}x`);
    }

    // -------------------------------------------------------------------------
    // ACTIONS: PLAYER CHEATS & TELEPORT
    // -------------------------------------------------------------------------
    getPlayer() {
        return (typeof player !== 'undefined' && player) ? player : (window.player || null);
    }

    healPlayer() {
        const p = this.getPlayer();
        if (!p) return;
        p.health = p.maxHealth || 20;
        p.hunger = 20;
        p.exhaustion = 0;
        p.oxygen = p.maxOxygen || 20;
        p.poisonTimer = 0;
        p.gloomBlindTimer = 0;
        p.gloomTetherTimer = 0;
        if (typeof updateHealthUI === 'function') updateHealthUI();
        if (typeof updateOxygenUI === 'function') updateOxygenUI(false);
        playSound('pop');
        showToast('Player fully healed (Health & Hunger full)');
        this.log('Fully healed player');
    }

    curePlayerDebuffs() {
        const p = this.getPlayer();
        if (!p) return;
        p.poisonTimer = 0;
        p.gloomBlindTimer = 0;
        p.gloomTetherTimer = 0;
        playSound('pop');
        showToast('All debuffs and status effects cured');
        this.log('Cured player debuffs');
    }

    killPlayer() {
        const p = this.getPlayer();
        if (!p) return;
        p.takeDamage(999);
        showToast('Executed /kill on player');
        this.log('Executed /kill on player');
    }

    teleportPlayer(dest, customX, customY) {
        const p = this.getPlayer();
        if (!p) return;

        if (dest === 'surface') {
            const tileX = Math.floor(p.x / TILE_SIZE);
            const surfY = typeof getWorldSurfaceY === 'function' ? getWorldSurfaceY(tileX) : 40;
            p.y = (surfY - 2) * TILE_SIZE;
            p.vx = 0; p.vy = 0;
            showToast('Teleported to ground surface');
            this.log(`Teleported to surface at Tile (${tileX}, ${surfY - 2})`);
        } else if (dest === 'spawn') {
            const targetX = p.bedX !== undefined ? p.bedX * TILE_SIZE : (WORLD_WIDTH / 2) * TILE_SIZE;
            const targetY = p.bedY !== undefined ? p.bedY * TILE_SIZE : 40 * TILE_SIZE;
            p.x = targetX;
            p.y = targetY;
            p.vx = 0; p.vy = 0;
            showToast('Teleported to spawn/bed');
            this.log('Teleported to spawn');
        } else if (dest === 'caves') {
            p.y = (WORLD_HEIGHT - 35) * TILE_SIZE;
            p.vx = 0; p.vy = 0;
            showToast('Teleported to deep caverns');
            this.log('Teleported to deep caverns');
        } else if (dest === 'void') {
            p.y = (WORLD_HEIGHT - 5) * TILE_SIZE;
            p.vx = 0; p.vy = 0;
            showToast('Teleported near void bedrock');
            this.log('Teleported to void');
        } else if (dest === 'kael') {
            const liveEntities = (typeof window !== 'undefined' && Array.isArray(window.entities)) ? window.entities : entities;
            const kael = (liveEntities || []).find(e => (e instanceof AtlasExplorer || e?.constructor?.name === 'AtlasExplorer') && !e.isDeparted);
            if (kael) {
                p.x = kael.x;
                p.y = kael.y;
                p.vx = 0; p.vy = 0;
                showToast('Teleported to Kael (Atlas Explorer)');
                this.log(`Teleported to Kael at (${Math.round(kael.x)}, ${Math.round(kael.y)})`);
            } else {
                const spawner = (typeof window !== 'undefined') ? window.RiftExplorerSpawner : null;
                if (spawner && typeof spawner.spawnExplorer === 'function') {
                    spawner.spawnExplorer(p);
                    showToast('Summoned Kael near you!');
                    this.log('Summoned Kael near player');
                } else {
                    showToast('Kael is not currently active');
                }
            }
        } else if (dest === 'cursor') {
            const m = (typeof window !== 'undefined' && window.mouse) ? window.mouse : null;
            if (m && Number.isFinite(m.worldX)) {
                p.x = m.worldX;
                p.y = m.worldY;
                p.vx = 0; p.vy = 0;
                showToast('Teleported to mouse cursor');
                this.log(`Teleported to cursor: (${Math.round(m.worldX)}, ${Math.round(m.worldY)})`);
            } else {
                showToast('Mouse cursor coordinates not available');
            }
        } else if (dest === 'custom') {
            p.x = customX * TILE_SIZE;
            p.y = customY * TILE_SIZE;
            p.vx = 0; p.vy = 0;
            showToast(`Teleported to Tile (${customX}, ${customY})`);
            this.log(`Teleported to custom coords: Tile (${customX}, ${customY})`);
        }
    }

    updateCheatsButtons() {
        const cheats = window.devCheats || {};
        const setBtn = (id, label, active) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.classList.toggle('active', !!active);
            btn.innerHTML = `<span>${label}</span><span class="${active ? 'dev-badge-on' : 'dev-badge-off'}">${active ? 'ON' : 'OFF'}</span>`;
        };

        setBtn('dev-btn-god', 'God Mode', cheats.godMode);
        setBtn('dev-btn-noclip', 'Fly / Noclip', cheats.noclip);
        setBtn('dev-btn-instantmine', 'Instant Mine', cheats.instantMine);
        setBtn('dev-btn-fullbright', 'Fullbright', cheats.fullbright);
        setBtn('dev-btn-oxygen', 'Inf Oxygen', cheats.infiniteOxygen);
        setBtn('dev-btn-hunger', 'Inf Hunger', cheats.infiniteHunger);
        setBtn('dev-btn-jump', 'Super Jump', cheats.highJump);
        setBtn('dev-btn-hitboxes', 'Hitboxes', cheats.showHitboxes);
        setBtn('dev-btn-freeze', 'Freeze Mobs', cheats.freezeMobs);

        const speedBtn = document.getElementById('dev-btn-speed');
        if (speedBtn) {
            speedBtn.innerHTML = `<span>Walk Speed</span><span class="dev-badge-off">${cheats.speedMultiplier || 1}x</span>`;
        }

        const reachBtn = document.getElementById('dev-btn-reach');
        if (reachBtn) {
            reachBtn.innerHTML = `<span>Reach</span><span class="dev-badge-off">${cheats.reachMultiplier || 1}x</span>`;
        }

        const diffBtn = document.getElementById('dev-btn-diff');
        if (diffBtn) {
            const d = (typeof window !== 'undefined' && window.currentDifficulty) ? window.currentDifficulty : 'normal';
            diffBtn.innerHTML = `<span>Difficulty</span><span class="dev-badge-off">${String(d).toUpperCase()}</span>`;
        }

        const curSpd = cheats.timeSpeed !== undefined ? cheats.timeSpeed : 1.0;
        ['0', '1', '5', '20'].forEach(s => {
            const b = document.getElementById(`dev-btn-tspd-${s}`);
            if (b) {
                const isMatch = Math.abs(curSpd - parseFloat(s)) < 0.01;
                b.classList.toggle('active', isMatch);
                b.querySelector('.dev-badge-on, .dev-badge-off')?.setAttribute('class', isMatch ? 'dev-badge-on' : 'dev-badge-off');
            }
        });
    }

    // -------------------------------------------------------------------------
    // COMMAND CONSOLE PARSER
    // -------------------------------------------------------------------------
    executeCommand(cmd) {
        this.log(`> ${cmd}`);
        const parts = cmd.trim().split(/\s+/);
        const root = parts[0].toLowerCase();

        switch (root) {
            case '/give': {
                if (parts.length < 2) {
                    this.log('Usage: /give <itemId|itemName> [count]', '#ef4444');
                    showToast('Usage: /give <itemId|itemName> [count]');
                    return;
                }
                const query = parts[1];
                const count = parseInt(parts[2], 10) || 1;
                const items = this.getAllRegisteredItems();
                let found = items.find(i => String(i.id) === query);
                if (!found) {
                    found = items.find(i => i.name.toLowerCase() === query.toLowerCase() || i.key.toLowerCase() === query.toLowerCase());
                }
                if (found) {
                    this.givePlayerItem(found.id, count, found.name);
                } else {
                    this.log(`Item "${query}" not found.`, '#ef4444');
                    showToast(`Item "${query}" not found`);
                }
                break;
            }

            case '/god': {
                window.devCheats.godMode = !window.devCheats.godMode;
                this.updateCheatsButtons();
                showToast(`God Mode: ${window.devCheats.godMode ? 'ON' : 'OFF'}`);
                this.log(`God Mode is now ${window.devCheats.godMode ? 'ON' : 'OFF'}`);
                break;
            }

            case '/fly': {
                window.devCheats.noclip = !window.devCheats.noclip;
                this.updateCheatsButtons();
                showToast(`Fly / Noclip: ${window.devCheats.noclip ? 'ON' : 'OFF'}`);
                this.log(`Flight/Noclip is now ${window.devCheats.noclip ? 'ON' : 'OFF'}`);
                break;
            }

            case '/time': {
                if (parts[1] === 'set') {
                    const t = parts[2]?.toLowerCase();
                    if (t === 'day' || t === 'noon') this.setTimeOfDay(0.25);
                    else if (t === 'sunset') this.setTimeOfDay(0.62);
                    else if (t === 'night' || t === 'midnight') this.setTimeOfDay(0.78);
                    else if (t === 'dawn') this.setTimeOfDay(0.95);
                    else {
                        const val = parseFloat(t);
                        if (!isNaN(val)) this.setTimeOfDay(val);
                    }
                } else if (parts[1] === 'speed') {
                    const spd = parseFloat(parts[2]) || 1;
                    this.setTimeSpeed(spd);
                } else {
                    this.log('Usage: /time set <day|noon|sunset|midnight|0.0-1.0> or /time speed <mult>');
                }
                break;
            }

            case '/tp': {
                if (parts[1] === 'surface') this.teleportPlayer('surface');
                else if (parts[1] === 'kael') this.teleportPlayer('kael');
                else if (parts[1] === 'spawn') this.teleportPlayer('spawn');
                else if (parts[1] === 'caves') this.teleportPlayer('caves');
                else if (parts[1] === 'void') this.teleportPlayer('void');
                else if (parts.length >= 3) {
                    const x = parseFloat(parts[1]);
                    const y = parseFloat(parts[2]);
                    this.teleportPlayer('custom', x, y);
                } else {
                    this.log('Usage: /tp <surface|spawn|caves|void|kael|x y>');
                }
                break;
            }

            case '/spawn': {
                if (parts.length < 2) {
                    this.log('Usage: /spawn <mobName> [count]');
                    return;
                }
                const mobName = parts[1];
                const count = Math.min(20, parseInt(parts[2], 10) || 1);
                for (let i = 0; i < count; i++) {
                    this.spawnMob(mobName, 'near');
                }
                break;
            }

            case '/heal': {
                this.healPlayer();
                break;
            }

            case '/kill': {
                if (parts[1] === 'hostiles' || parts[1] === 'passives' || parts[1] === 'all') {
                    this.killMobs(parts[1]);
                } else {
                    this.killPlayer();
                }
                break;
            }

            case '/clear': {
                this.clearPlayerInventory();
                break;
            }

            case '/help': {
                this.log('Available Commands:');
                this.log('  /give <item> [count] - Give item to inventory');
                this.log('  /god - Toggle god mode');
                this.log('  /fly - Toggle noclip fly mode');
                this.log('  /time set <noon|dawn|sunset|midnight|0-1>');
                this.log('  /time speed <mult> - Set simulation rate');
                this.log('  /tp <surface|spawn|caves|void|kael|x y>');
                this.log('  /spawn <mobName> [count] - Spawn mob near player');
                this.log('  /heal - Full player heal');
                this.log('  /kill [hostiles|passives|all] - Eliminate creatures');
                this.log('  /clear - Clear player inventory');
                break;
            }

            default:
                this.log(`Unknown command: "${cmd}". Type /help for assistance.`, '#ef4444');
                showToast(`Unknown command: "${cmd}"`);
        }
    }

    log(message, color = '#d9e1e7') {
        console.log(`[DevConsole] ${message}`);
    }

    // -------------------------------------------------------------------------
    // TOGGLE / OPEN / CLOSE
    // -------------------------------------------------------------------------
    open() {
        if (!this.canOpen()) {
            console.log('[DevConsole] Cannot open: Developer console is disabled on menus and outside gameplay.');
            return;
        }
        try {
            if (!this.initialized || !this.containerEl || !document.getElementById('dev-console-modal')) {
                this.initialized = false;
                this.init();
            }
            if (!this.containerEl) {
                console.error('[DevConsole] Container element could not be initialized.');
                return;
            }

            this.containerEl.classList.remove('hidden');
            this.containerEl.style.display = 'flex';
            this.containerEl.style.visibility = 'visible';
            this.containerEl.style.opacity = '1';
            this.containerEl.style.pointerEvents = 'none';
            this.isOpen = true;
            this.isMinimized = false;
            this.dockSide = 'left';
            this._customPos = false;
            this._isDragging = false;

            const panel = document.getElementById('dev-debug-panel');
            const chip = document.getElementById('dev-minimized-chip');
            if (panel) panel.style.display = 'flex';
            if (chip) chip.style.display = 'none';

            this.updatePanelPosition();
            this.updateCheatsButtons();
            try { playSound('pop'); } catch (e) {}
            console.log('[DevConsole] Dev Console opened (F7 or ~ to close)');
        } catch (err) {
            console.error('[DevConsole] Failed to open:', err);
        }
    }

    close() {
        if (!this.containerEl) return;
        this.containerEl.classList.add('hidden');
        this.containerEl.style.display = 'none';
        this.containerEl.style.visibility = 'hidden';
        this.isOpen = false;
        this._isDragging = false;
        this.toggleItemDrawer(false);
        try { playSound('pop'); } catch (e) {}
        console.log('[DevConsole] Dev Console closed.');
    }

    toggle() {
        const now = Date.now();
        if (this._lastToggle && (now - this._lastToggle < 180)) return;
        this._lastToggle = now;
        if (this.isOpen) {
            this.close();
        } else {
            if (!this.canOpen()) return;
            this.open();
        }
    }
}

export const DevConsole = new DevConsoleManager();

// Expose to window for external access
if (typeof window !== 'undefined') {
    window.DevConsole = DevConsole;
    window.openDevConsole = () => DevConsole.open();
    window.closeDevConsole = () => DevConsole.close();
    window.toggleDevConsole = () => DevConsole.toggle();

    // Universal Global Hotkey Listener: F7, Mac Fn+F7, Mac MediaTrackPrevious, and Backquote (~)
    const handleGlobalDevKey = (e) => {
        const isF7Standard = (e.key && e.key.toUpperCase() === 'F7') || e.code === 'F7' || e.keyCode === 118;
        const isF7Media = e.key === 'MediaTrackPrevious' || e.code === 'MediaTrackPrevious' || e.key === 'MediaRewind' || e.code === 'MediaRewind' || e.keyCode === 177;
        const isBackquote = (e.key === '`' || e.key === '~' || e.code === 'Backquote' || e.keyCode === 192) &&
                            !(document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA'));

        if (isF7Standard || isF7Media || isBackquote) {
            if (!DevConsole.isOpen && !DevConsole.canOpen()) {
                return;
            }
            console.log(`[DevConsole] Hotkey pressed: key="${e.key}", code="${e.code}" -> toggling developer console`);
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation();
            }
            DevConsole.toggle();
            return false;
        }

        // If item drawer is open inside DevConsole, Escape closes just the drawer
        if (e.key === 'Escape' && DevConsole.isOpen && DevConsole.itemDrawerOpen) {
            DevConsole.toggleItemDrawer(false);
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    };

    window.addEventListener('keydown', handleGlobalDevKey, { capture: true, passive: false });

    // Auto-initialize when DOM is ready
    if (typeof document !== 'undefined') {
        const setupDevConsole = () => {
            DevConsole.init();
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupDevConsole, { once: true });
        } else {
            setupDevConsole();
        }
    }
}
