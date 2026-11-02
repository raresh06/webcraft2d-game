// =============================================================================
// WEBCRAFT 2D - MAP & MINIMAP (js/rendering/map.js)
// Fast 32-bit pixel buffer minimap, interactive fullscreen map & markers
// =============================================================================

import {
    IDS, TILE_SIZE
} from '../core/constants.js';

import {
    world, backgroundWorld, player, remotePlayers, entities, signs, timeOfDay,
    WORLD_WIDTH, WORLD_HEIGHT, isMultiplayer
} from '../core/state.js';

import {
    getActiveBiomeAt
} from '../world/worldgen.js';

import {
    isSolidWorldBlock
} from '../world/blockhelper.js';

    export const minimapOffscreenCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (minimapOffscreenCanvas) {
        minimapOffscreenCanvas.width = 64;
        minimapOffscreenCanvas.height = 64;
    }
    export const minimapOffscreenCtx = minimapOffscreenCanvas ? minimapOffscreenCanvas.getContext('2d') : null;
    export const minimapImageData = minimapOffscreenCtx ? minimapOffscreenCtx.createImageData(64, 64) : null;
    export const minimapBuf32 = minimapImageData ? new Uint32Array(minimapImageData.data.buffer) : null;


    export const MINIMAP_COLOR_32 = new Uint32Array(256);

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


// Global Window Registration for cross-module compatibility
if (typeof window !== 'undefined') {
    window.minimapOffscreenCanvas = minimapOffscreenCanvas;
    window.minimapOffscreenCtx = minimapOffscreenCtx;
    window.minimapImageData = minimapImageData;
    window.minimapBuf32 = minimapBuf32;
    window.MINIMAP_COLOR_32 = MINIMAP_COLOR_32;
    window.drawMinimap = drawMinimap;
    window.isWorldMapOpen = isWorldMapOpen;
    window.mapPanX = mapPanX;
    window.mapPanY = mapPanY;
    window.mapZoom = mapZoom;
    window.isMapDragging = isMapDragging;
    window.setIsWorldMapOpen = setIsWorldMapOpen;
    window.setMapPan = setMapPan;
    window.setMapZoom = setMapZoom;
    window.offscreenMapCanvas = offscreenMapCanvas;
    window.offscreenMapCtx = offscreenMapCtx;
    window.isOffscreenMapDirty = isOffscreenMapDirty;
    window.buildFullOffscreenMap = buildFullOffscreenMap;
    window.renderWorldMapLoop = renderWorldMapLoop;
    window.renderWorldMapFrame = renderWorldMapFrame;
    window.getMapBlockColor = getMapBlockColor;
}
