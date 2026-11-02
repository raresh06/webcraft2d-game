
export let canvas = typeof document !== 'undefined' ? document.getElementById('gameCanvas') : null;
export let ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;

// =============================================================================
// WEBCRAFT 2D - MASTER WORLD RENDERER (js/rendering/renderer.js)
// Main canvas render pipeline: tiles, entities, lighting blend, FX & HUD overlays
// =============================================================================

import {
    IDS, TILE_SIZE, BED_LENGTH, CAVE_SKY_START_TILES, isTool
} from '../core/constants.js';

import {
    mouse, world, backgroundWorld, surfaceHeights, player, remotePlayers, entities, particles, floatingTexts,
    signs, furnaces, inventory, selectedHotbarIndex, camera, clouds, timeOfDay,
    frameCount,  STATE, WORLD_WIDTH, WORLD_HEIGHT,
    worldBiomes, isMultiplayer, isSleeping, sleepStartTime, destroyProgress, destroyTarget,
    setEngineBgBuildDarknessAlpha, droppedItems, isInventoryOpen
} from '../core/state.js';

import {
    isDevConsoleOpen, activeGraphicPreset, showClouds, graphicsQuality, advancedGraphics, fabulousConfig
} from '../core/config.js';

import {
    isSolidWorldBlock, isClimbableBlock, isDoorBlock, isOpenDoorBlock, isJungleDoorBlock, getCrackStage, isChestPairedWithLeft
} from '../world/blockhelper.js';

import {
    getFluid, 
} from '../world/fluids.js';

import {
    getActiveBiomeAt, } from '../world/worldgen.js';

import {
    hasDirectSkyAccess
} from '../world/spawner.js';

import {
    textures, waterStillFrames, waterFlowFrames, lavaStillFrames, lavaFlowFrames,
    cachedCavernWallStone, cachedCavernWallDirt, cachedCavernWallSand, getBedLength, getBedPairStart, isBedRenderStart
} from './textures.js';

import {
    LIGHT_SCALE, lightCanvas, lightCtx, cachedLightVignette, updateCachedVignette,
    cachedCeilingAO, cachedLeftWallAO, cachedRightWallAO, cachedCornerAOTopLeft, cachedCornerAOTopRight,
    cachedTorchLightCanvas, cachedTorchGlowCanvas, cachedLavaGlowCanvas, cachedBloomAuraCanvas
} from './lighting.js';

import {
    menuBgCanvas, menuCtx, cachedSunGlowDayCanvas, cachedSunGlowSunsetCanvas, cachedMoonGlowCanvas,
    cachedShadowCanvas, cachedFabulousVignetteCanvas, cachedSnowFogCanvas,
    drawDynamicSky, drawMountains, drawPixelAurora, drawBiomeGrading, drawSnowFog, drawVignette,
    drawUnderwaterScreenEffect, drawDesertHeatShimmer, drawForestGodRays, drawPlainsWindBreeze,
    updateAndDrawFabulousParticles, getPlayerCaveSkyOpacity
} from './atmosphere.js';

import {
    drawMinimap
} from './map.js';

import {
    spawnParticle, noteParticles
} from './particles.js';

import {
    drawCharacter
} from './character.js';



    export function initCanvases() {
        if (!canvas && typeof document !== 'undefined') canvas = document.getElementById('gameCanvas');
        if (canvas && !ctx) ctx = canvas.getContext('2d', { alpha: false });
        if (typeof window !== 'undefined') {
            if (!window.menuBgCanvas && typeof document !== 'undefined') window.menuBgCanvas = document.getElementById('menuBgCanvas');
            if (window.menuBgCanvas && !window.menuCtx) window.menuCtx = window.menuBgCanvas.getContext('2d', { alpha: false });
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
        const curMenuBg = (typeof window !== 'undefined' && window.menuBgCanvas) ? window.menuBgCanvas : menuBgCanvas;
        if (curMenuBg) {
            curMenuBg.width = window.innerWidth;
            curMenuBg.height = window.innerHeight;
        }
        const curLight = (typeof window !== 'undefined' && window.lightCanvas) ? window.lightCanvas : lightCanvas;
        if (curLight) {
            curLight.width = Math.max(1, Math.ceil(window.innerWidth * LIGHT_SCALE));
            curLight.height = Math.max(1, Math.ceil(window.innerHeight * LIGHT_SCALE));
        }
        if (typeof updateCachedVignette === 'function') {
            updateCachedVignette();
        }
    }

    if (typeof window !== 'undefined') {
    window.canvas = canvas;
    window.ctx = ctx;
        window.addEventListener('resize', resizeCanvases);
    }

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


    export function drawWorld() {
        const camX = Math.round(camera.x);
        const camY = Math.round(camera.y);
        if (typeof window !== 'undefined' && typeof window.updateSignInlinePosition === 'function') {
            window.updateSignInlinePosition();
        }
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

        let startCol = Math.floor(camX / TILE_SIZE) - 1;
        let endCol = Math.floor(camX / TILE_SIZE) + Math.ceil(canvas.width / TILE_SIZE) + 2;
        let startRow = Math.max(0, Math.floor(camY / TILE_SIZE) - 1);
        let endRow = Math.min(WORLD_HEIGHT - 1, Math.floor(camY / TILE_SIZE) + Math.ceil(canvas.height / TILE_SIZE) + 2);

        const visibleLightSources = [];

        // -------------------------------------------------------------------------
        // PASS 1: BACKGROUND LAYER & SUBTERRANEAN CAVERN WALLS
        // Rendered across all visible columns BEFORE any foreground tiles are drawn
        // -------------------------------------------------------------------------
        for (let x = startCol; x <= endCol; x++) {
            let drawX = Math.round(x * TILE_SIZE - camX);
            // Infinite ocean bounds masking for cutoff fix
            if (x < 0 || x >= WORLD_WIDTH) {
                for (let y = startRow; y <= endRow; y++) {
                    if (y >= Math.floor(WORLD_HEIGHT / 2)) {
                        let drawY = Math.round(y * TILE_SIZE - camY);
                        // Sea level
                        ctx.fillStyle = (y === Math.floor(WORLD_HEIGHT / 2)) ? 'rgba(30, 144, 255, 0.7)' : 'rgba(20, 100, 200, 0.9)';
                        ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                        // Sand floor
                        if (y > Math.floor(WORLD_HEIGHT / 2) + 10) {
                            ctx.fillStyle = '#e6cc80';
                            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                        }
                    }
                }
                continue;
            }

            const colSurfY = (surfaceHeights && surfaceHeights[x] !== undefined) ? surfaceHeights[x] : getWorldSurfaceY(x);
            const isDesertCol = (worldBiomes && worldBiomes[x] === 'desert');

            for (let y = startRow; y <= endRow; y++) {
                let drawY = Math.round(y * TILE_SIZE - camY);
                let hasPlayerBg = false;

                // 1. Player-placed background blocks (darker depth tone)
                if (bgWorld && bgWorld[x]) {
                    let bgBlock = bgWorld[x][y];
                    if (bgBlock !== undefined && bgBlock !== IDS.AIR && textures[bgBlock]) {
                        hasPlayerBg = true;
                        ctx.drawImage(textures[bgBlock], drawX, drawY, TILE_SIZE, TILE_SIZE);
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
                        ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                    }
                }

                // 2. Subterranean Cavern Wall backdrop:
                // If there is no player-placed background wall and we are below the surface (caves),
                // draw natural cavern wall behind air, vines, ladders, torches, doors, chests, or non-opaque blocks.
                if (!hasPlayerBg && x >= 0 && x < WORLD_WIDTH && y > colSurfY) {
                    const fgBlock = world[x]?.[y];
                    const isSolidOpaqueTerrain = fgBlock === IDS.STONE || fgBlock === IDS.DIRT || fgBlock === IDS.COBBLESTONE ||
                        fgBlock === IDS.GRASS || fgBlock === IDS.SAND || fgBlock === IDS.SNOW || fgBlock === IDS.COAL_ORE ||
                        fgBlock === IDS.IRON_ORE || fgBlock === IDS.GOLD_ORE || fgBlock === IDS.DIAMOND_ORE || fgBlock === IDS.EMERALD_ORE ||
                        fgBlock === IDS.OBSIDIAN || fgBlock === IDS.WOOD || fgBlock === IDS.PLANKS || fgBlock === IDS.JUNGLE_WOOD ||
                        fgBlock === IDS.JUNGLE_PLANKS || fgBlock === IDS.WOOL;

                    const hasFluidInCell = (typeof getFluid === 'function' && getFluid(x, y)) || fgBlock === IDS.WATER || fgBlock === IDS.LAVA;
                    if (!isSolidOpaqueTerrain && !hasFluidInCell) {
                        let cavernWall = cachedCavernWallStone;
                        if (isDesertCol) {
                            cavernWall = cachedCavernWallSand || cachedCavernWallStone;
                        } else if (y < colSurfY + 4) {
                            cavernWall = cachedCavernWallDirt || cachedCavernWallStone;
                        }
                        if (cavernWall) {
                            ctx.drawImage(cavernWall, drawX, drawY, TILE_SIZE, TILE_SIZE);
                        }
                    }
                }

                // 3. Natural Ambient Occlusion (AO) on cave ceilings, overhangs, walls, and inner corners
                if (advancedGraphics && y > 0 && y >= colSurfY && (world[x]?.[y] === IDS.AIR || isClimbableBlock(world[x]?.[y]))) {
                    const hasCeiling = world[x][y - 1] !== undefined && isSolidWorldBlock(x, y - 1, world[x][y - 1]);
                    const hasLeftWall = x > 0 && world[x - 1]?.[y] !== undefined && isSolidWorldBlock(x - 1, y, world[x - 1][y]);
                    const hasRightWall = x < WORLD_WIDTH - 1 && world[x + 1]?.[y] !== undefined && isSolidWorldBlock(x + 1, y, world[x + 1][y]);

                    if (hasCeiling || hasLeftWall || hasRightWall) {
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
            }
        }

        // -------------------------------------------------------------------------
        // PASS 2: FOREGROUND BLOCKS
        // Rendered on top of the completed background and cavern wall layer
        // -------------------------------------------------------------------------
        for (let x = startCol; x <= endCol; x++) {
            if (x < 0 || x >= WORLD_WIDTH) continue;
            let drawX = Math.round(x * TILE_SIZE - camX);

            for (let y = startRow; y <= endRow; y++) {
                let block = world[x]?.[y];
                if (block === undefined || block === IDS.AIR) continue;

                let drawY = Math.round(y * TILE_SIZE - camY);

                if (block === IDS.BED) {
                    if (!isBedRenderStart(x, y)) continue;
                    let bedLength = getBedLength(x, y);
                    if (textures[block]) ctx.drawImage(textures[block], drawX, drawY, TILE_SIZE * bedLength, TILE_SIZE);
                } else if (block === IDS.CHEST) {
                    const isPairedLeft = isChestPairedWithLeft(x, y);
                    if (isPairedLeft) continue;

                    const hasChestRight = x < WORLD_WIDTH - 1 && world[x + 1]?.[y] === IDS.CHEST;
                    if (hasChestRight) {
                        const doubleTex = (largeChestTexture && (largeChestTexture.width || largeChestTexture.complete)) ? largeChestTexture :
                                          (largeChestImage && (largeChestImage.width || largeChestImage.complete)) ? largeChestImage : null;
                        if (doubleTex) {
                            ctx.drawImage(doubleTex, drawX, drawY, TILE_SIZE * 2, TILE_SIZE);
                        } else if (textures[block]) {
                            ctx.drawImage(textures[block], drawX, drawY, TILE_SIZE, TILE_SIZE);
                            ctx.drawImage(textures[block], drawX + TILE_SIZE, drawY, TILE_SIZE, TILE_SIZE);
                        }
                    } else if (textures[block]) {
                        ctx.drawImage(textures[block], drawX, drawY, TILE_SIZE, TILE_SIZE);
                    }
                } else if (block === IDS.TORCH) {
                    visibleLightSources.push({ x: x * TILE_SIZE + TILE_SIZE / 2, y: y * TILE_SIZE + TILE_SIZE / 2, type: 'torch', gridX: x, gridY: y });
                    let bottomSolid = (y < WORLD_HEIGHT - 1 && world[x][y + 1] !== IDS.AIR && world[x][y + 1] !== IDS.TORCH);
                    let leftSolid = (x > 0 && world[x - 1][y] !== IDS.AIR && world[x - 1][y] !== IDS.TORCH);
                    let rightSolid = (x < WORLD_WIDTH - 1 && world[x + 1][y] !== IDS.AIR && world[x + 1][y] !== IDS.TORCH);

                    ctx.save();
                    ctx.translate(drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
                    if (!bottomSolid) {
                        if (leftSolid) { ctx.translate(-TILE_SIZE / 3, TILE_SIZE / 6); ctx.rotate(Math.PI / 5); }
                        else if (rightSolid) { ctx.translate(TILE_SIZE / 3, TILE_SIZE / 6); ctx.rotate(-Math.PI / 5); }
                    }
                    if (textures[block]) ctx.drawImage(textures[block], -TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
                    ctx.restore();
                } else if (((fabulousGraphics && fabulousConfig.foliageSway) || (!fabulousGraphics && advancedGraphics)) && (
                    block === IDS.SHORT_GRASS || block === IDS.TALL_GRASS ||
                    block === IDS.FLOWER_RED || block === IDS.FLOWER_YELLOW ||
                    block === IDS.SAPLING ||
                    block === IDS.WHEAT_STAGE_1 || block === IDS.WHEAT_STAGE_2 ||
                    block === IDS.WHEAT_STAGE_3 || block === IDS.WHEAT_STAGE_4
                )) {
                    let swayFactor = 0.035;
                    if (block === IDS.TALL_GRASS) swayFactor = 0.045;
                    else if (block === IDS.WHEAT_STAGE_1) swayFactor = 0.018;
                    else if (block === IDS.WHEAT_STAGE_2) swayFactor = 0.028;
                    else if (block === IDS.WHEAT_STAGE_3) swayFactor = 0.042;
                    else if (block === IDS.WHEAT_STAGE_4) swayFactor = 0.052;

                    const sway = Math.sin(frameCount * 0.045 + x * 0.7) * 2.0;
                    ctx.save();
                    ctx.translate(drawX + TILE_SIZE / 2, drawY + TILE_SIZE);
                    ctx.transform(1, 0, sway * swayFactor, 1, 0, 0);
                    if (textures[block]) ctx.drawImage(textures[block], -TILE_SIZE / 2, -TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    ctx.restore();
                } else if (block === IDS.FURNACE) {
                    const liveFurnaces = (typeof window !== 'undefined' && Array.isArray(window.furnaces)) ? window.furnaces : furnaces;
                    const isLit = liveFurnaces.some(f => f.x === x && f.y === y && f.burnTime > 0);
                    const furnaceTex = (isLit && textures.furnace_lit) ? textures.furnace_lit : textures[IDS.FURNACE];
                    if (furnaceTex) ctx.drawImage(furnaceTex, drawX, drawY, TILE_SIZE, TILE_SIZE);
                    if (isLit) {
                        visibleLightSources.push({ x: x * TILE_SIZE + TILE_SIZE / 2, y: y * TILE_SIZE + TILE_SIZE / 2, type: 'torch', gridX: x, gridY: y });
                    }
                } else {
                    if (textures[block]) ctx.drawImage(textures[block], drawX, drawY, TILE_SIZE, TILE_SIZE);
                }
            }
        }

        visibleFluids.length = 0;
        const animTick = frameCount;

        // Separate lists for Water and Lava to batch render cleanly
        const visibleWater = [];
        const visibleLava = [];

        for (let fx = startCol; fx <= endCol; fx++) {
            if (fx < 0 || fx >= WORLD_WIDTH) continue;
            for (let fy = startRow; fy <= endRow; fy++) {
                const fluid = getFluid(fx, fy);
                if (!fluid) continue;
                const drawX = Math.floor(fx * TILE_SIZE - camera.x);
                const drawY = Math.floor(fy * TILE_SIZE - camera.y);
                const entry = { fluid, fluidX: fx, fluidY: fy, drawX, drawY };
                visibleFluids.push(entry);
                if (fluid.type === IDS.WATER) visibleWater.push(entry);
                else if (fluid.type === IDS.LAVA) visibleLava.push(entry);
            }
        }

        // -------------------------------------------------------------------------
        // PASS 3: FLUIDS (Animated Pixel-Art Textures for Water & Lava)
        // -------------------------------------------------------------------------
        const animFrame = Math.floor(animTick / 4) % NUM_FLUID_FRAMES;
        const waterStillTex = (waterStillFrames && waterStillFrames[animFrame]) || textures[IDS.WATER];
        const waterFlowTex = (waterFlowFrames && waterFlowFrames[animFrame]) || textures[IDS.WATER];
        const lavaStillTex = (lavaStillFrames && lavaStillFrames[animFrame]) || textures[IDS.LAVA];
        const lavaFlowTex = (lavaFlowFrames && lavaFlowFrames[animFrame]) || textures[IDS.LAVA];

        // Keep textures[IDS.WATER] and textures[IDS.LAVA] updated to active animated frames
        if (waterStillTex) textures[IDS.WATER] = waterStillTex;
        if (lavaStillTex) textures[IDS.LAVA] = lavaStillTex;

        // 1. RENDER WATER (Unified single aquatic palette, authentic animated 16x16 pixel art, seamless connected surface)
        if (visibleWater.length > 0) {
            ctx.save();
            ctx.imageSmoothingEnabled = false;

            const getWaterNominalHeight = (gx, gy) => {
                if (gx < 0 || gx >= WORLD_WIDTH || gy < 0 || gy >= WORLD_HEIGHT) return 0;
                const f = getFluid(gx, gy);
                if (!f || f.type !== IDS.WATER) return 0;
                const fAbove = getFluid(gx, gy - 1);
                if (fAbove && fAbove.type === IDS.WATER) return 1.0;
                if (f.falling) return 1.0;
                if (f.source) return 0.92;
                return Math.max(0.24, 0.88 - (f.level / (WATER_FLOW_MAX + 1)) * 0.64);
            };

            for (let i = 0; i < visibleWater.length; i++) {
                const { fluid, fluidX, fluidY, drawX, drawY } = visibleWater[i];
                const fluidAbove = getFluid(fluidX, fluidY - 1);
                const hasFluidAbove = (fluidAbove && fluidAbove.type === IDS.WATER);

                const isSolidBelow = isSolidWorldBlock(fluidX, fluidY + 1, world[fluidX]?.[fluidY + 1]);
                const isSolidLeft = isSolidWorldBlock(fluidX - 1, fluidY, world[fluidX - 1]?.[fluidY]);
                const isSolidRight = isSolidWorldBlock(fluidX + 1, fluidY, world[fluidX + 1]?.[fluidY]);

                const leftFluid = getFluid(fluidX - 1, fluidY);
                const isLeftWater = (leftFluid && leftFluid.type === IDS.WATER);
                const rightFluid = getFluid(fluidX + 1, fluidY);
                const isRightWater = (rightFluid && rightFluid.type === IDS.WATER);

                const leftDownFluid = getFluid(fluidX - 1, fluidY + 1);
                const isLeftDownWater = (leftDownFluid && leftDownFluid.type === IDS.WATER);
                const rightDownFluid = getFluid(fluidX + 1, fluidY + 1);
                const isRightDownWater = (rightDownFluid && rightDownFluid.type === IDS.WATER);

                const leftUpFluid = getFluid(fluidX - 1, fluidY - 1);
                const isLeftUpWater = (leftUpFluid && leftUpFluid.type === IDS.WATER);
                const rightUpFluid = getFluid(fluidX + 1, fluidY - 1);
                const isRightUpWater = (rightUpFluid && rightUpFluid.type === IDS.WATER);

                if (hasFluidAbove) {
                    // Submerged Water Block: Full tile seamless animated pixel art
                    if (waterStillTex) {
                        ctx.drawImage(waterStillTex, drawX, drawY, TILE_SIZE, TILE_SIZE);
                    } else {
                        ctx.fillStyle = 'rgba(48, 114, 222, 0.68)';
                        ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                    }

                    // Contact shading along solid floor/walls only (never between fluid cells!)
                    if (isSolidBelow) {
                        ctx.fillStyle = 'rgba(20, 60, 130, 0.22)';
                        ctx.fillRect(drawX, drawY + TILE_SIZE - 2, TILE_SIZE, 2);
                    }
                    if (isSolidLeft) {
                        ctx.fillStyle = 'rgba(20, 60, 130, 0.18)';
                        ctx.fillRect(drawX, drawY, 2, TILE_SIZE);
                    }
                    if (isSolidRight) {
                        ctx.fillStyle = 'rgba(20, 60, 130, 0.18)';
                        ctx.fillRect(drawX + TILE_SIZE - 2, drawY, 2, TILE_SIZE);
                    }
                } else if (fluid.falling) {
                    // Falling waterfall stream column with animated downward flow texture
                    let x0 = drawX;
                    if (!isSolidLeft && !isLeftWater) x0 = drawX + 3;
                    let x1 = drawX + TILE_SIZE;
                    if (!isSolidRight && !isRightWater) x1 = drawX + TILE_SIZE - 3;
                    const streamW = x1 - x0;

                    let y0 = drawY;
                    if (!hasFluidAbove) {
                        if (isLeftWater && !leftFluid.falling) {
                            const hLeftPour = getWaterNominalHeight(fluidX - 1, fluidY) * 0.75;
                            y0 = Math.floor(drawY + TILE_SIZE * (1.0 - hLeftPour));
                        } else if (isRightWater && !rightFluid.falling) {
                            const hRightPour = getWaterNominalHeight(fluidX + 1, fluidY) * 0.75;
                            y0 = Math.floor(drawY + TILE_SIZE * (1.0 - hRightPour));
                        }
                    }

                    // Waterfall crest connection from adjacent surface stream over the cliff ledge
                    if (!hasFluidAbove && isLeftWater && !leftFluid.falling && waterFlowTex) {
                        ctx.drawImage(waterFlowTex, drawX - 3, y0, 6, drawY + TILE_SIZE - y0);
                    } else if (!hasFluidAbove && isRightWater && !rightFluid.falling && waterFlowTex) {
                        ctx.drawImage(waterFlowTex, x1 - 3, y0, 6, drawY + TILE_SIZE - y0);
                    }

                    // Render waterfall column with flowing texture
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(x0, y0, streamW, drawY + TILE_SIZE - y0);
                    ctx.clip();
                    if (waterFlowTex) {
                        ctx.drawImage(waterFlowTex, drawX, drawY, TILE_SIZE, TILE_SIZE);
                    } else {
                        ctx.fillStyle = 'rgba(48, 114, 222, 0.68)';
                        ctx.fillRect(x0, y0, streamW, drawY + TILE_SIZE - y0);
                    }
                    ctx.restore();

                    // Downward waterfall impact & splash
                    const belowF = getFluid(fluidX, fluidY + 1);
                    const isWaterBelow = (belowF && belowF.type === IDS.WATER);

                    if (isSolidBelow) {
                        // Striking solid ground: pixelated white-water froth at impact
                        ctx.fillStyle = 'rgba(225, 245, 255, 0.90)';
                        ctx.fillRect(x0 - 2, drawY + TILE_SIZE - 4, streamW + 4, 4);
                        const sprayH = Math.floor(Math.abs(Math.sin(animTick * 0.20 + fluidX * 4)) * 4);
                        ctx.fillStyle = 'rgba(180, 225, 255, 0.85)';
                        ctx.fillRect(x0 - 1, drawY + TILE_SIZE - 6 - sprayH, 3, 3);
                        ctx.fillRect(x1 - 2, drawY + TILE_SIZE - 5 - sprayH, 3, 3);
                    } else if (isWaterBelow && !belowF.falling) {
                        // Plunging into pool: pixelated foam ripple at surface
                        ctx.fillStyle = 'rgba(225, 245, 255, 0.90)';
                        ctx.fillRect(x0 - 2, drawY + TILE_SIZE - 3, streamW + 4, 3);
                    }
                } else {
                    // Surface Water Block: Connected sloping surface with authentic 16x16 pixel art texture
                    const hSelf = getWaterNominalHeight(fluidX, fluidY);

                    // Compute shared vertex height at left boundary (fluidX)
                    let hLeft;
                    if (isLeftWater) {
                        hLeft = leftFluid.falling ? Math.max(0.35, hSelf * 0.75) : (hSelf + getWaterNominalHeight(fluidX - 1, fluidY)) * 0.5;
                    } else if (isSolidLeft) {
                        hLeft = hSelf;
                    } else if (isLeftUpWater) {
                        hLeft = 1.0;
                    } else if (isLeftDownWater) {
                        hLeft = Math.max(0.35, hSelf * 0.75);
                    } else {
                        hLeft = hSelf * 0.5;
                    }

                    // Compute shared vertex height at right boundary (fluidX + 1)
                    let hRight;
                    if (isRightWater) {
                        hRight = rightFluid.falling ? Math.max(0.35, hSelf * 0.75) : (hSelf + getWaterNominalHeight(fluidX + 1, fluidY)) * 0.5;
                    } else if (isSolidRight) {
                        hRight = hSelf;
                    } else if (isRightUpWater) {
                        hRight = 1.0;
                    } else if (isRightDownWater) {
                        hRight = Math.max(0.35, hSelf * 0.75);
                    } else {
                        hRight = hSelf * 0.5;
                    }

                    // Snap to crisp pixel-art vertical steps (2px increments)
                    const topYL = drawY + Math.round((TILE_SIZE * (1.0 - hLeft)) / 2) * 2;
                    const topYR = drawY + Math.round((TILE_SIZE * (1.0 - hRight)) / 2) * 2;
                    const botY = drawY + TILE_SIZE;

                    // 1. Clip quad and render the animated pixel-art water texture
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(drawX, topYL);
                    ctx.lineTo(drawX + TILE_SIZE, topYR);
                    ctx.lineTo(drawX + TILE_SIZE, botY);
                    ctx.lineTo(drawX, botY);
                    ctx.closePath();
                    ctx.clip();

                    if (waterStillTex) {
                        ctx.drawImage(waterStillTex, drawX, drawY, TILE_SIZE, TILE_SIZE);
                    } else {
                        ctx.fillStyle = 'rgba(48, 114, 222, 0.68)';
                        ctx.fillRect(drawX, Math.min(topYL, topYR), TILE_SIZE, botY - Math.min(topYL, topYR));
                    }
                    ctx.restore();

                    // 2. Step-down spillover cascade connection (cascading over terrain steps)
                    if (isLeftDownWater && !isLeftWater && !isSolidLeft) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(drawX, topYL);
                        ctx.lineTo(drawX + 4, topYL);
                        ctx.lineTo(drawX + 4, botY + 8);
                        ctx.lineTo(drawX - 2, botY + 8);
                        ctx.lineTo(drawX - 2, botY);
                        ctx.closePath();
                        ctx.clip();
                        if (waterFlowTex) {
                            ctx.drawImage(waterFlowTex, drawX - 4, drawY, TILE_SIZE, TILE_SIZE + 8);
                        } else {
                            ctx.fillStyle = 'rgba(48, 114, 222, 0.68)';
                            ctx.fillRect(drawX - 2, topYL, 6, botY + 8 - topYL);
                        }
                        ctx.restore();
                    }
                    if (isRightDownWater && !isRightWater && !isSolidRight) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(drawX + TILE_SIZE - 4, topYR);
                        ctx.lineTo(drawX + TILE_SIZE, topYR);
                        ctx.lineTo(drawX + TILE_SIZE + 2, botY);
                        ctx.lineTo(drawX + TILE_SIZE + 2, botY + 8);
                        ctx.lineTo(drawX + TILE_SIZE - 4, botY + 8);
                        ctx.closePath();
                        ctx.clip();
                        if (waterFlowTex) {
                            ctx.drawImage(waterFlowTex, drawX + TILE_SIZE - 4, drawY, TILE_SIZE, TILE_SIZE + 8);
                        } else {
                            ctx.fillStyle = 'rgba(48, 114, 222, 0.68)';
                            ctx.fillRect(drawX + TILE_SIZE - 4, topYR, 6, botY + 8 - topYR);
                        }
                        ctx.restore();
                    }

                    // 3. Pixelated surface crest highlight (in 4px / 2px pixel steps instead of smooth vector lines)
                    ctx.fillStyle = 'rgba(215, 240, 255, 0.85)';
                    for (let sx = 0; sx < TILE_SIZE; sx += 4) {
                        const t = (sx + 2) / TILE_SIZE;
                        const sy = Math.floor(topYL * (1 - t) + topYR * t);
                        const rippleOffset = ((sx / 4 + Math.floor(animTick / 6)) % 4 === 0) ? -1 : 0;
                        ctx.fillRect(drawX + sx, sy + rippleOffset, 4, 2);
                    }

                    // Shoreline foam against solid banks
                    if (isSolidLeft) {
                        ctx.fillStyle = 'rgba(240, 250, 255, 0.90)';
                        ctx.fillRect(drawX, topYL - 1, 4, 3);
                    }
                    if (isSolidRight) {
                        ctx.fillStyle = 'rgba(240, 250, 255, 0.90)';
                        ctx.fillRect(drawX + TILE_SIZE - 4, topYR - 1, 4, 3);
                    }
                }
            }
            ctx.restore();
        }

        // 2. RENDER LAVA (Authentic Minecraft animated 16x16 pixel art matching Image 2, seamless connected flowing magma)
        if (visibleLava.length > 0) {
            ctx.save();
            ctx.imageSmoothingEnabled = false;

            const getLavaNominalHeight = (gx, gy) => {
                if (gx < 0 || gx >= WORLD_WIDTH || gy < 0 || gy >= WORLD_HEIGHT) return 0;
                const f = getFluid(gx, gy);
                if (!f || f.type !== IDS.LAVA) return 0;
                const fAbove = getFluid(gx, gy - 1);
                if (fAbove && fAbove.type === IDS.LAVA) return 1.0;
                if (f.falling) return 1.0;
                if (f.source) return 0.94;
                return Math.max(0.30, 0.90 - (f.level / (LAVA_FLOW_MAX + 1)) * 0.60);
            };

            for (let i = 0; i < visibleLava.length; i++) {
                const { fluid, fluidX, fluidY, drawX, drawY } = visibleLava[i];
                const fluidAbove = getFluid(fluidX, fluidY - 1);
                const hasFluidAbove = (fluidAbove && fluidAbove.type === IDS.LAVA);

                const isSolidBelow = isSolidWorldBlock(fluidX, fluidY + 1, world[fluidX]?.[fluidY + 1]);
                const isSolidLeft = isSolidWorldBlock(fluidX - 1, fluidY, world[fluidX - 1]?.[fluidY]);
                const isSolidRight = isSolidWorldBlock(fluidX + 1, fluidY, world[fluidX + 1]?.[fluidY]);

                const leftFluid = getFluid(fluidX - 1, fluidY);
                const isLeftLava = (leftFluid && leftFluid.type === IDS.LAVA);
                const rightFluid = getFluid(fluidX + 1, fluidY);
                const isRightLava = (rightFluid && rightFluid.type === IDS.LAVA);

                const leftDownFluid = getFluid(fluidX - 1, fluidY + 1);
                const isLeftDownLava = (leftDownFluid && leftDownFluid.type === IDS.LAVA);
                const rightDownFluid = getFluid(fluidX + 1, fluidY + 1);
                const isRightDownLava = (rightDownFluid && rightDownFluid.type === IDS.LAVA);

                const leftUpFluid = getFluid(fluidX - 1, fluidY - 1);
                const isLeftUpLava = (leftUpFluid && leftUpFluid.type === IDS.LAVA);
                const rightUpFluid = getFluid(fluidX + 1, fluidY - 1);
                const isRightUpLava = (rightUpFluid && rightUpFluid.type === IDS.LAVA);

                if (hasFluidAbove) {
                    // Submerged Lava Block: Seamless animated molten Minecraft pixel art (Image 2 style)
                    if (lavaStillTex) {
                        ctx.drawImage(lavaStillTex, drawX, drawY, TILE_SIZE, TILE_SIZE);
                    } else {
                        ctx.fillStyle = '#d4530c';
                        ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                    }

                    // Basalt contact edge against solid rock floor/walls
                    if (isSolidBelow) {
                        ctx.fillStyle = '#6e1804';
                        ctx.fillRect(drawX, drawY + TILE_SIZE - 2, TILE_SIZE, 2);
                    }
                    if (isSolidLeft) {
                        ctx.fillStyle = '#6e1804';
                        ctx.fillRect(drawX, drawY, 2, TILE_SIZE);
                    }
                    if (isSolidRight) {
                        ctx.fillStyle = '#6e1804';
                        ctx.fillRect(drawX + TILE_SIZE - 2, drawY, 2, TILE_SIZE);
                    }
                } else if (fluid.falling) {
                    // Falling lava cascade with animated downward streaming molten veins
                    let x0 = drawX;
                    if (!isSolidLeft && !isLeftLava) x0 = drawX + 2;
                    let x1 = drawX + TILE_SIZE;
                    if (!isSolidRight && !isRightLava) x1 = drawX + TILE_SIZE - 2;
                    const streamW = x1 - x0;

                    let y0 = drawY;
                    if (!hasFluidAbove) {
                        if (isLeftLava && !leftFluid.falling) {
                            const hLeftPour = getLavaNominalHeight(fluidX - 1, fluidY) * 0.75;
                            y0 = Math.floor(drawY + TILE_SIZE * (1.0 - hLeftPour));
                        } else if (isRightLava && !rightFluid.falling) {
                            const hRightPour = getLavaNominalHeight(fluidX + 1, fluidY) * 0.75;
                            y0 = Math.floor(drawY + TILE_SIZE * (1.0 - hRightPour));
                        }
                    }

                    // Lava crest connection over cliff ledge
                    if (!hasFluidAbove && isLeftLava && !leftFluid.falling && lavaFlowTex) {
                        ctx.drawImage(lavaFlowTex, drawX - 3, y0, 6, drawY + TILE_SIZE - y0);
                    } else if (!hasFluidAbove && isRightLava && !rightFluid.falling && lavaFlowTex) {
                        ctx.drawImage(lavaFlowTex, x1 - 3, y0, 6, drawY + TILE_SIZE - y0);
                    }

                    // Falling stream body with flowing pixel art texture
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(x0, y0, streamW, drawY + TILE_SIZE - y0);
                    ctx.clip();
                    if (lavaFlowTex) {
                        ctx.drawImage(lavaFlowTex, drawX, drawY, TILE_SIZE, TILE_SIZE);
                    } else {
                        ctx.fillStyle = '#cf4a0a';
                        ctx.fillRect(x0, y0, streamW, drawY + TILE_SIZE - y0);
                    }
                    ctx.restore();

                    // Downward impact flare
                    const belowF = getFluid(fluidX, fluidY + 1);
                    const isLavaBelow = (belowF && belowF.type === IDS.LAVA);

                    if (isSolidBelow) {
                        // Striking solid stone floor: golden incandescent impact splash
                        ctx.fillStyle = '#ffd738';
                        ctx.fillRect(x0 - 2, drawY + TILE_SIZE - 4, streamW + 4, 4);
                        ctx.fillStyle = '#fff08c';
                        ctx.fillRect(x0 + 1, drawY + TILE_SIZE - 3, Math.max(2, streamW - 2), 2);
                        if (advancedGraphics && Math.random() < 0.08) {
                            let p = spawnParticle(fluidX * TILE_SIZE + 4 + Math.random() * (TILE_SIZE - 8), (fluidY + 1) * TILE_SIZE - 2, Math.random() < 0.5 ? '#ffd700' : '#ff5500');
                            if (p) {
                                p.vy = -1.2 - Math.random() * 1.5;
                                p.vx = (Math.random() - 0.5) * 1.4;
                                p.life = 20;
                            }
                        }
                    } else if (isLavaBelow && !belowF.falling) {
                        // Plunging into lava pool: incandescent molten flare at surface
                        ctx.fillStyle = '#ffd738';
                        ctx.fillRect(x0 - 2, drawY + TILE_SIZE - 3, streamW + 4, 3);
                        ctx.fillStyle = '#fff08c';
                        ctx.fillRect(x0, drawY + TILE_SIZE - 2, streamW, 2);
                    }
                } else {
                    // Surface Lava Block: Seamless connected sloping quad textured with Image 2 style pixel art
                    const hSelf = getLavaNominalHeight(fluidX, fluidY);

                    // Shared vertex height at left boundary (fluidX)
                    let hLeft;
                    if (isLeftLava) {
                        hLeft = leftFluid.falling ? Math.max(0.35, hSelf * 0.75) : (hSelf + getLavaNominalHeight(fluidX - 1, fluidY)) * 0.5;
                    } else if (isSolidLeft) {
                        hLeft = hSelf;
                    } else if (isLeftUpLava) {
                        hLeft = 1.0;
                    } else if (isLeftDownLava) {
                        hLeft = Math.max(0.35, hSelf * 0.75);
                    } else {
                        hLeft = hSelf * 0.5;
                    }

                    // Shared vertex height at right boundary (fluidX + 1)
                    let hRight;
                    if (isRightLava) {
                        hRight = rightFluid.falling ? Math.max(0.35, hSelf * 0.75) : (hSelf + getLavaNominalHeight(fluidX + 1, fluidY)) * 0.5;
                    } else if (isSolidRight) {
                        hRight = hSelf;
                    } else if (isRightUpLava) {
                        hRight = 1.0;
                    } else if (isRightDownLava) {
                        hRight = Math.max(0.35, hSelf * 0.75);
                    } else {
                        hRight = hSelf * 0.5;
                    }

                    // Snap to crisp pixel-art vertical steps (2px increments)
                    const topYL = drawY + Math.round((TILE_SIZE * (1.0 - hLeft)) / 2) * 2;
                    const topYR = drawY + Math.round((TILE_SIZE * (1.0 - hRight)) / 2) * 2;
                    const botY = drawY + TILE_SIZE;

                    // 1. Clip quad and render the animated pixel-art lava texture
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(drawX, topYL);
                    ctx.lineTo(drawX + TILE_SIZE, topYR);
                    ctx.lineTo(drawX + TILE_SIZE, botY);
                    ctx.lineTo(drawX, botY);
                    ctx.closePath();
                    ctx.clip();

                    if (lavaStillTex) {
                        ctx.drawImage(lavaStillTex, drawX, drawY, TILE_SIZE, TILE_SIZE);
                    } else {
                        ctx.fillStyle = '#b53c07';
                        ctx.fillRect(drawX, Math.min(topYL, topYR), TILE_SIZE, botY - Math.min(topYL, topYR));
                    }
                    ctx.restore();

                    // 2. Step-down spillover cascade connection (cascading down stairs/ledges)
                    if (isLeftDownLava && !isLeftLava && !isSolidLeft) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(drawX, topYL);
                        ctx.lineTo(drawX + 4, topYL);
                        ctx.lineTo(drawX + 4, botY + 8);
                        ctx.lineTo(drawX - 2, botY + 8);
                        ctx.lineTo(drawX - 2, botY);
                        ctx.closePath();
                        ctx.clip();
                        if (lavaFlowTex) {
                            ctx.drawImage(lavaFlowTex, drawX - 4, drawY, TILE_SIZE, TILE_SIZE + 8);
                        } else {
                            ctx.fillStyle = '#cf4a0a';
                            ctx.fillRect(drawX - 2, topYL, 6, botY + 8 - topYL);
                        }
                        ctx.restore();
                    }
                    if (isRightDownLava && !isRightLava && !isSolidRight) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(drawX + TILE_SIZE - 4, topYR);
                        ctx.lineTo(drawX + TILE_SIZE, topYR);
                        ctx.lineTo(drawX + TILE_SIZE + 2, botY);
                        ctx.lineTo(drawX + TILE_SIZE + 2, botY + 8);
                        ctx.lineTo(drawX + TILE_SIZE - 4, botY + 8);
                        ctx.closePath();
                        ctx.clip();
                        if (lavaFlowTex) {
                            ctx.drawImage(lavaFlowTex, drawX + TILE_SIZE - 4, drawY, TILE_SIZE, TILE_SIZE + 8);
                        } else {
                            ctx.fillStyle = '#cf4a0a';
                            ctx.fillRect(drawX + TILE_SIZE - 4, topYR, 6, botY + 8 - topYR);
                        }
                        ctx.restore();
                    }

                    // 3. Crisp pixelated incandescent crest highlight along the top edge
                    ctx.fillStyle = '#ffd738';
                    for (let sx = 0; sx < TILE_SIZE; sx += 4) {
                        const t = (sx + 2) / TILE_SIZE;
                        const sy = Math.floor(topYL * (1 - t) + topYR * t);
                        const rippleOffset = ((sx / 4 + Math.floor(animTick / 7)) % 3 === 0) ? -1 : 0;
                        ctx.fillRect(drawX + sx, sy + rippleOffset, 4, 2);
                    }

                    // Top white-hot thermal sparkle glints
                    if ((fluidX + Math.floor(animTick / 10)) % 5 === 0) {
                        ctx.fillStyle = '#fff08c';
                        const midX = drawX + 12;
                        const midY = Math.floor((topYL + topYR) * 0.5);
                        ctx.fillRect(midX, midY - 1, 4, 2);
                    }

                    // Occasional floating ember spark drifting upward
                    if (fabulousGraphics && fabulousConfig.lavaGlow && Math.random() < 0.03) {
                        spawnParticle(fluidX * TILE_SIZE + Math.random() * TILE_SIZE, fluidY * TILE_SIZE + 2, Math.random() < 0.5 ? '#ffd700' : '#ff4500');
                    } else if (advancedGraphics && Math.random() < 0.015) {
                        spawnParticle(fluidX * TILE_SIZE + Math.random() * TILE_SIZE, fluidY * TILE_SIZE + 2, '#ff4500');
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
            if (advancedGraphics && cachedShadowCanvas) {
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

        if (Array.isArray(droppedItems)) droppedItems.forEach(d => { if (d && typeof d.draw === 'function') d.draw(ctx, camX, camY); });
        const curEntities = (typeof window !== 'undefined' && Array.isArray(window.entities)) ? window.entities : (Array.isArray(entities) ? entities : []);
        curEntities.forEach(e => {
            if (e && typeof e.draw === 'function') {
                try {
                    e.draw(ctx, camX, camY);
                } catch (entErr) {
                    console.error("Entity draw error:", e, entErr);
                }
            }
        });
        const curPlayer = player || (typeof window !== 'undefined' ? window.player : null);
        if (curPlayer && typeof curPlayer.draw === 'function') {
            try {
                curPlayer.draw(ctx, camX, camY);
            } catch (pErr) {
                console.error("Player draw error:", pErr);
            }
        }

        // Developer Cheats: Render Hitboxes
        if (typeof window !== 'undefined' && window.devCheats?.showHitboxes) {
            ctx.save();
            ctx.lineWidth = 1.5;
            if (player) {
                ctx.strokeStyle = '#22c55e';
                ctx.strokeRect(player.x - camX, player.y - camY, player.width, player.height);
                ctx.font = '14px VT323, monospace';
                ctx.fillStyle = '#22c55e';
                ctx.fillText(`Player HP:${Math.round(player.health)}`, player.x - camX, player.y - camY - 4);
            }
            entities.forEach(e => {
                const isHostile = (e instanceof Zombie || e instanceof Creeper || e instanceof Scorpion || e instanceof Gloomstalker);
                ctx.strokeStyle = isHostile ? '#ef4444' : '#38bdf8';
                ctx.strokeRect(e.x - camX, e.y - camY, e.width, e.height);
                ctx.font = '12px VT323, monospace';
                ctx.fillStyle = ctx.strokeStyle;
                const name = e.constructor?.name || 'Entity';
                ctx.fillText(`${name} ${e.health !== undefined ? Math.round(e.health) : ''}`, e.x - camX, e.y - camY - 2);
            });
            if (Array.isArray(droppedItems)) {
                droppedItems.forEach(item => {
                    if (!item) return;
                    ctx.strokeStyle = '#eab308';
                    ctx.strokeRect(item.x - camX, item.y - camY, item.width || 12, item.height || 12);
                });
            }
            ctx.restore();
        }
        
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

                        // 2. Stable pixel-art cracks without screen/crack jitter
                        if (crackPixels.length > 0) {
                            // 3. Pixel-Art 3D Relief Highlight (+1px physical offset)
                            ctx.fillStyle = curBgMode ? 'rgba(255, 235, 175, 0.40)' : 'rgba(255, 255, 255, 0.35)';
                            for (let i = 0; i < crackPixels.length; i++) {
                                const [tx, ty] = crackPixels[i];
                                const x0 = Math.floor(tx * TILE_SIZE / 16);
                                const x1 = Math.floor((tx + 1) * TILE_SIZE / 16);
                                const y0 = Math.floor(ty * TILE_SIZE / 16);
                                const y1 = Math.floor((ty + 1) * TILE_SIZE / 16);
                                ctx.fillRect(drawX + x0 + 1, drawY + y0 + 1, x1 - x0, y1 - y0);
                            }

                            // 4. Pixel-Art Dark Core Fracture Fissure (Snap-to-grid 16x16 texels)
                            ctx.fillStyle = curBgMode ? 'rgba(120, 53, 15, 0.96)' : 'rgba(10, 10, 10, 0.95)';
                            for (let i = 0; i < crackPixels.length; i++) {
                                const [tx, ty] = crackPixels[i];
                                const x0 = Math.floor(tx * TILE_SIZE / 16);
                                const x1 = Math.floor((tx + 1) * TILE_SIZE / 16);
                                const y0 = Math.floor(ty * TILE_SIZE / 16);
                                const y1 = Math.floor((ty + 1) * TILE_SIZE / 16);
                                ctx.fillRect(drawX + x0, drawY + y0, x1 - x0, y1 - y0);
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

        // Base surface night darkness fill across screen
        if (surfaceDarkness > 0) {
            lightCtx.fillStyle = `rgba(0, 0, 15, ${surfaceDarkness})`;
            lightCtx.fillRect(0, 0, lightCanvas.width, lightCanvas.height);
        }

        // Terraria-style subterranean depth shadow gradient
        // Starts around the 7th block below the surface so shallow excavation and finding coal remains visible,
        // then smoothly fades into deep atmospheric darkness in true caves.
        const subDarkness = 0.988;
        const subDarkDepthOffset = 6; // Starts from 7th block down (surfY + 6)
        const depthSteps = [0.35, 0.65, 0.88, 0.96];

        for (let x = startCol; x <= endCol; x++) {
            let drawX = x * TILE_SIZE - camX;
            let drawW = TILE_SIZE;

            let surfY = Math.floor(WORLD_HEIGHT / 2);
            let skyCutoffY = 0;
            if (x >= 0 && x < WORLD_WIDTH) {
                const natSurfY = (surfaceHeights && surfaceHeights[x] !== undefined) ? surfaceHeights[x] : getWorldSurfaceY(x);
                const topSolidY = getWorldSurfaceY(x);
                surfY = Math.max(natSurfY, topSolidY);

                // Determine where exterior daylight stops penetrating from open sky
                while (skyCutoffY < WORLD_HEIGHT && hasDirectSkyAccess(x, skyCutoffY, true)) {
                    skyCutoffY++;
                }
            } else {
                skyCutoffY = surfY;
            }

            // Subterranean depth only begins under true solid ceiling and below the surface
            let effectiveSurfY = Math.max(surfY, skyCutoffY);

            // Depth transition rows starting at (effectiveSurfY + subDarkDepthOffset)
            for (let d = 0; d < depthSteps.length; d++) {
                let gy = effectiveSurfY + subDarkDepthOffset + d;
                if (gy >= startRow && gy <= endRow && (x < 0 || x >= WORLD_WIDTH || !hasDirectSkyAccess(x, gy, true))) {
                    let dAlpha = surfaceDarkness + (subDarkness - surfaceDarkness) * depthSteps[d];

                    // Soften darkness if this is an open cave mouth bordering exterior daylight horizontally
                    if (x >= 0 && x < WORLD_WIDTH && world[x]?.[gy] === IDS.AIR) {
                        const leftAir = x > 0 && world[x - 1]?.[gy] === IDS.AIR && gy < Math.max(surfaceHeights[x - 1] || surfY, getWorldSurfaceY(x - 1));
                        const rightAir = x < WORLD_WIDTH - 1 && world[x + 1]?.[gy] === IDS.AIR && gy < Math.max(surfaceHeights[x + 1] || surfY, getWorldSurfaceY(x + 1));
                        if (leftAir || rightAir) {
                            dAlpha = Math.max(surfaceDarkness, dAlpha - 0.40);
                        }
                    }

                    if (dAlpha > surfaceDarkness) {
                        let drawY = gy * TILE_SIZE - camY;
                        lightCtx.fillStyle = `rgba(0, 0, 6, ${dAlpha})`;
                        lightCtx.fillRect(drawX, drawY, drawW, TILE_SIZE);
                    }
                }
            }

            // Deep subterranean shadow rows downward from (effectiveSurfY + subDarkDepthOffset + depthSteps.length) to endRow
            const deepThreshold = effectiveSurfY + subDarkDepthOffset + depthSteps.length;
            let deepStartRow = Math.max(startRow, deepThreshold);
            if (deepStartRow < skyCutoffY) {
                deepStartRow = skyCutoffY;
            }
            if (deepStartRow <= endRow) {
                let uniformStartRow = deepStartRow;
                for (let gy = deepStartRow; gy <= Math.min(endRow, deepStartRow + 2); gy++) {
                    if (x >= 0 && x < WORLD_WIDTH && world[x]?.[gy] === IDS.AIR) {
                        const leftAir = x > 0 && world[x - 1]?.[gy] === IDS.AIR && gy < Math.max(surfaceHeights[x - 1] || surfY, getWorldSurfaceY(x - 1));
                        const rightAir = x < WORLD_WIDTH - 1 && world[x + 1]?.[gy] === IDS.AIR && gy < Math.max(surfaceHeights[x + 1] || surfY, getWorldSurfaceY(x + 1));
                        if (leftAir || rightAir) {
                            let dAlpha = Math.max(surfaceDarkness, subDarkness - 0.35);
                            let drawY = gy * TILE_SIZE - camY;
                            lightCtx.fillStyle = `rgba(0, 0, 6, ${dAlpha})`;
                            lightCtx.fillRect(drawX, drawY, drawW, TILE_SIZE);
                            uniformStartRow = gy + 1;
                        }
                    }
                }

                if (uniformStartRow <= endRow) {
                    let deepY0 = uniformStartRow * TILE_SIZE - camY;
                    let deepY1 = (endRow + 1) * TILE_SIZE - camY;
                    let deepH = deepY1 - deepY0;
                    if (deepH > 0) {
                        lightCtx.fillStyle = `rgba(0, 0, 6, ${subDarkness})`;
                        lightCtx.fillRect(drawX, deepY0, drawW, deepH);
                    }
                }
            }
        }

        lightCtx.globalCompositeOperation = 'destination-out';
        
        function drawLight(worldX, worldY, radius, intensity) {
            let drawX = Math.round(worldX - camX);
            let drawY = Math.round(worldY - camY);
            let r = Math.round(radius);
            if (drawX < -r || drawX > lightCanvas.width + r || drawY < -r || drawY > lightCanvas.height + r) return;
            lightCtx.imageSmoothingEnabled = false;
            lightCtx.globalAlpha = intensity;
            if (cachedTorchLightCanvas) {
                lightCtx.drawImage(cachedTorchLightCanvas, drawX - r, drawY - r, r * 2, r * 2);
            }
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
        if ((heldItem && heldItem.id === IDS.GLOOM_LANTERN) || (offhandItem && offhandItem.id === IDS.GLOOM_LANTERN)) {
            visibleLightSources.push({ x: player.x + player.width/2, y: player.y + player.height/2, type: 'gloom_lantern' });
        }
        
        for(let rpId in remotePlayers) {
            let rp = remotePlayers[rpId];
            if (rp && !rp.isDead && !rp.isDisconnected && (!rp.lastSeenLocalTime || Date.now() - rp.lastSeenLocalTime < 12000)) {
                let rx = rp.renderX !== undefined ? rp.renderX : (rp.x || 0);
                let ry = rp.renderY !== undefined ? rp.renderY : (rp.y || 0);
                if (rp.heldItem === IDS.TORCH) {
                    visibleLightSources.push({ x: rx + TILE_SIZE/2, y: ry + TILE_SIZE/2, type: 'remote_torch' });
                } else if (rp.heldItem === IDS.GLOOM_LANTERN) {
                    visibleLightSources.push({ x: rx + TILE_SIZE/2, y: ry + TILE_SIZE/2, type: 'remote_lantern' });
                }
            }
        }

        if (!fabulousGraphics || fabulousConfig.lavaGlow) {
            for (let i = 0; i < visibleFluids.length; i++) {
                const vf = visibleFluids[i];
                if (vf.fluid && vf.fluid.type === IDS.LAVA && (((vf.fluidX + vf.fluidY) & 1) === 0)) {
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
            } else if (ls.type === 'gloom_lantern' || ls.type === 'remote_lantern') {
                let lanternFlicker = 0.96 + Math.sin(frameCount * 0.15) * 0.04;
                drawLight(ls.x, ls.y, TILE_SIZE * 7, lanternFlicker);
            } else {
                drawLight(ls.x, ls.y, TILE_SIZE * 5, 0.9);
            }
        }
        
        lightCtx.globalCompositeOperation = 'source-over';
        if (cachedLightVignette) {
            let vignetteStrength = 0.12 + caveSkyOpacity * 0.38;
            if (player && player.gloomBlindTimer > 0) {
                vignetteStrength = Math.min(0.92, vignetteStrength + 0.45);
            }
            lightCtx.globalAlpha = vignetteStrength;
            lightCtx.fillStyle = cachedLightVignette;
            lightCtx.fillRect(0, 0, lightCanvas.width, lightCanvas.height);
            lightCtx.globalAlpha = 1.0;
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.imageSmoothingEnabled = false;
        if (typeof window === 'undefined' || !window.devCheats?.fullbright) {
            ctx.drawImage(lightCanvas, 0, 0);
        }

        if (advancedGraphics || fabulousGraphics) {
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.globalCompositeOperation = 'lighter';
            const glowR = TILE_SIZE * 1.7;
            const glowD = glowR * 2;
            for (let i = 0; i < visibleLightSources.length; i++) {
                const ls = visibleLightSources[i];
                let gx = Math.round(ls.x - camX);
                let gy = Math.round(ls.y - camY);
                if (gx < -glowR || gx > canvas.width + glowR || gy < -glowR || gy > canvas.height + glowR) continue;

                if (ls.type === 'torch' || ls.type === 'player_torch' || ls.type === 'remote_torch') {
                    if (cachedTorchGlowCanvas) ctx.drawImage(cachedTorchGlowCanvas, gx - glowR, gy - glowR, glowD, glowD);
                    ctx.fillStyle = 'rgba(255, 235, 160, 0.34)';
                    ctx.fillRect(Math.floor(gx - 3), Math.floor(gy - 3), 6, 6);
                    if (fabulousGraphics && fabulousConfig.bloomAura && cachedBloomAuraCanvas) {
                        const bR = Math.round(glowR * 1.45);
                        ctx.drawImage(cachedBloomAuraCanvas, gx - bR, gy - bR, bR * 2, bR * 2);
                    }
                } else if (ls.type === 'furnace') {
                    if (cachedTorchGlowCanvas) ctx.drawImage(cachedTorchGlowCanvas, gx - glowR, gy - glowR, glowD, glowD);
                    if (fabulousGraphics && fabulousConfig.bloomAura && cachedBloomAuraCanvas) {
                        const bR = Math.round(glowR * 1.35);
                        ctx.drawImage(cachedBloomAuraCanvas, gx - bR, gy - bR, bR * 2, bR * 2);
                    }
                } else if (ls.type === 'lava' && (!fabulousGraphics || fabulousConfig.lavaGlow)) {
                    if (cachedLavaGlowCanvas) {
                        ctx.drawImage(cachedLavaGlowCanvas, gx - glowR, gy - glowR, glowD, glowD);
                    }
                    if (fabulousGraphics && fabulousConfig.bloomAura && cachedBloomAuraCanvas) {
                        const bR = Math.round(glowR * 1.25);
                        ctx.drawImage(cachedBloomAuraCanvas, gx - bR, gy - bR, bR * 2, bR * 2);
                    }
                } else if (ls.type === 'gloom_lantern' || ls.type === 'remote_lantern') {
                    if (cachedTorchGlowCanvas) ctx.drawImage(cachedTorchGlowCanvas, gx - glowR * 1.3, gy - glowR * 1.3, glowD * 1.3, glowD * 1.3);
                    ctx.fillStyle = 'rgba(192, 132, 252, 0.45)';
                    ctx.fillRect(Math.floor(gx - 4), Math.floor(gy - 4), 8, 8);
                    if (fabulousGraphics && fabulousConfig.bloomAura && cachedBloomAuraCanvas) {
                        const bR = Math.round(glowR * 1.6);
                        ctx.drawImage(cachedBloomAuraCanvas, gx - bR, gy - bR, bR * 2, bR * 2);
                    }
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

        if (showHeatShimmer && (!fabulousGraphics || fabulousConfig.heatShimmer)) drawDesertHeatShimmer(ctx, canvas.width, canvas.height, camera.x);
        if (!fabulousGraphics || fabulousConfig.godRays) drawForestGodRays(ctx, canvas.width, canvas.height, camera.x, camera.y);
        if (!fabulousGraphics || fabulousConfig.windBreeze) drawPlainsWindBreeze(ctx, canvas.width, canvas.height, camera.x, camera.y);
        if (!fabulousGraphics || fabulousConfig.ambientParticles) updateAndDrawFabulousParticles(ctx, camera.x, camera.y, canvas.width, canvas.height);
        if (showBiomeGrading && (!fabulousGraphics || fabulousConfig.colorGrading)) drawBiomeGrading(ctx, canvas.width, canvas.height);
        if (showVignette && (!fabulousGraphics || fabulousConfig.vignette)) drawVignette(ctx, canvas.width, canvas.height);
        drawUnderwaterScreenEffect(ctx, canvas.width, canvas.height);

        // Smoothly darken and illuminate orange frame in Background Build Mode
        const curBgModeForDarkness = (typeof window !== 'undefined' && window.isBackgroundBuildMode !== undefined) ? window.isBackgroundBuildMode : isBackgroundBuildMode;
        const targetBgDarkness = curBgModeForDarkness ? 0.45 : 0;
        setEngineBgBuildDarknessAlpha(bgBuildDarknessAlpha + (targetBgDarkness - bgBuildDarknessAlpha) * 0.18);
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

        if (isSleeping) {
            const elapsed = sleepStartTime ? (performance.now() - sleepStartTime) : 500;
            const progress = Math.min(1, elapsed / (sleepTransitionMs || 2200));
            ctx.save();
            const darkAlpha = Math.min(0.92, 0.35 + progress * 0.57);
            ctx.fillStyle = `rgba(5, 5, 12, ${darkAlpha.toFixed(2)})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Centered sleep text with pulsating Zzz
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Minecraft, sans-serif';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 8;
            const zDots = '.'.repeat(1 + (Math.floor(elapsed / 400) % 3));
            ctx.fillText(`Sleeping${zDots} [Zzz]`, canvas.width / 2, canvas.height / 2 - 10);
            ctx.font = '14px Minecraft, sans-serif';
            ctx.fillStyle = '#aaaaaa';
            ctx.fillText('Press any movement key to wake up', canvas.width / 2, canvas.height / 2 + 25);
            ctx.restore();
        }
    }

// Global Window Registration for cross-module compatibility
if (typeof window !== 'undefined') {
    window.canvas = canvas;
    window.ctx = ctx;
    window.initCanvases = initCanvases;
    window.resizeCanvases = resizeCanvases;
    window.updateCamera = updateCamera;
    window.drawWorld = drawWorld;
}