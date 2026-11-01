// =============================================================================
// WEBCRAFT 2D - PROCEDURAL TEXTURES (js/rendering/textures.js)
// Procedural pixel-art block textures, animated fluid frames, and cavern wall sprites
// =============================================================================

import {
    IDS, TILE_SIZE, BED_LENGTH
} from '../core/constants.js';

import {
    world, WORLD_WIDTH, WORLD_HEIGHT
} from '../core/state.js';

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


// Global Window Registration for cross-module compatibility
if (typeof window !== 'undefined') {
    window.textures = textures;
    window.COBBLESTONE_MAP = COBBLESTONE_MAP;
    window.getCobblestonePixel = getCobblestonePixel;
    window.NUM_FLUID_FRAMES = NUM_FLUID_FRAMES;
    window.waterStillFrames = waterStillFrames;
    window.waterFlowFrames = waterFlowFrames;
    window.lavaStillFrames = lavaStillFrames;
    window.lavaFlowFrames = lavaFlowFrames;
    window.cachedCavernWallStone = cachedCavernWallStone;
    window.cachedCavernWallDirt = cachedCavernWallDirt;
    window.cachedCavernWallSand = cachedCavernWallSand;
    window.initCavernWallTextures = initCavernWallTextures;
    window.getBedLength = getBedLength;
    window.getBedPairStart = getBedPairStart;
    window.isBedRenderStart = isBedRenderStart;
    window.getBlockColor = getBlockColor;
}
