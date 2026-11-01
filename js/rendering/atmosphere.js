// =============================================================================
// WEBCRAFT 2D - ATMOSPHERE & CELESTIAL SKY (js/rendering/atmosphere.js)
// Celestial cycle, sky gradients, mountain parallax, aurora, weather & menu FX
// =============================================================================

import {
    IDS, TILE_SIZE, CAVE_SKY_START_TILES
} from '../core/constants.js';

import {
    mouse, world, backgroundWorld, surfaceHeights, player, clouds, timeOfDay, frameCount, dayCount,
    camera, WORLD_WIDTH, WORLD_HEIGHT, worldBiomes, setTimeOfDay, timeUI,
    setEngineUnderwaterDeepFactor, setEngineUnderwaterScreenAlpha
} from '../core/state.js';

import {
    advancedGraphics, showClouds, graphicsQuality
} from '../core/config.js';

import {
    getActiveBiomeAt, } from '../world/worldgen.js';

import {
    isSolidWorldBlock, isWater, isLava, isNonSurfaceBlock
} from '../world/blockhelper.js';

import {
    getFluid
} from '../world/fluids.js';

import {
    textures, getBlockColor
} from './textures.js';


export let menuBgCanvas = typeof document !== 'undefined' ? document.getElementById('menuBgCanvas') : null;
export let menuCtx = menuBgCanvas ? menuBgCanvas.getContext('2d', { alpha: false }) : null;

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


        export const LEAF_COLORS = ['#6f9f38', '#8dbb45', '#c28a3d', '#d0a34a'];
        export let caveSkyOpacity = 0;
    
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
            else if (drawX > ((typeof window !== 'undefined' && window.canvas) ? window.canvas.width : 1280) + this.w) drawX -= WORLD_WIDTH * TILE_SIZE;

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
    export let menuBackgroundRendered = false;

    export function dismissBootLoadingScreen() {
        if (typeof document === 'undefined') return;
        const loader = document.getElementById('boot-loading-screen');
        if (!loader || loader.classList.contains('dismissed')) return;

        // Smoothly complete progress bar and status text before fading
        const bar = document.getElementById('boot-loading-bar-fill');
        const percent = document.getElementById('boot-loading-percent');
        const status = document.getElementById('boot-loading-status-text');
        if (bar) bar.style.width = '100%';
        if (percent) percent.innerText = '100%';
        if (status) status.innerText = 'Ready to explore!';

        setTimeout(() => {
            loader.classList.add('dismissed');
            loader.style.opacity = '0';
            loader.style.pointerEvents = 'none';
            setTimeout(() => {
                loader.style.display = 'none';
                loader.classList.add('hidden');
            }, 450);
        }, 160);
    }
    export let menuEntities = [];
    export let menuTime = 0.20 + Math.random() * 0.15;
    export let menuLastFrame = performance.now();

    export let menuFireflies = Array.from({ length: 64 }, (_, i) => {
        const typeRoll = i % 4;
        const type = typeRoll === 0 ? 'water_drop' : (typeRoll === 1 ? 'magma_ember' : (typeRoll === 2 ? 'gloom_wisp' : 'cave_dust'));
        return {
            x: Math.random() * 3200,
            y: Math.random() * 1400,
            type,
            vx: type === 'magma_ember' ? (Math.random() - 0.5) * 0.8 : (type === 'gloom_wisp' ? (Math.random() - 0.5) * 0.35 : (Math.random() - 0.5) * 0.2),
            vy: type === 'water_drop' ? (2.2 + Math.random() * 2.4) : (type === 'magma_ember' ? (-0.7 - Math.random() * 0.9) : (type === 'gloom_wisp' ? (-0.2 - Math.random() * 0.35) : (Math.random() - 0.5) * 0.15)),
            phase: Math.random() * Math.PI * 2,
            size: type === 'magma_ember' ? (1.5 + Math.random() * 2) : (type === 'water_drop' ? (2 + Math.random() * 1.5) : (type === 'gloom_wisp' ? (2.5 + Math.random() * 2) : 1)),
            color: type === 'water_drop' ? ['#38bdf8', '#67e8f9', '#7dd3fc', '#0284c7'][Math.floor(Math.random() * 4)]
                 : type === 'magma_ember' ? ['#f97316', '#ef4444', '#fb923c', '#facc15'][Math.floor(Math.random() * 4)]
                 : type === 'gloom_wisp' ? ['#c084fc', '#a855f7', '#7c3aed', '#e879f9'][Math.floor(Math.random() * 4)]
                 : '#94a3b8'
        };
    });

    export function drawMenuFireflies(targetCtx, w, h, camX, camY) {
        targetCtx.save();
        for (let i = 0; i < menuFireflies.length; i++) {
            const f = menuFireflies[i];
            f.phase += 0.04;

            if (f.type === 'water_drop') {
                f.y += f.vy;
                f.vy = Math.min(6.5, f.vy + 0.05); // Gravity acceleration for droplets
                f.x += Math.sin(f.phase) * 0.2;
            } else if (f.type === 'magma_ember') {
                f.y += f.vy;
                f.x += f.vx + Math.sin(f.phase * 1.5) * 0.4;
            } else if (f.type === 'gloom_wisp') {
                f.y += f.vy + Math.sin(f.phase * 0.8) * 0.25;
                f.x += f.vx + Math.cos(f.phase * 0.6) * 0.35;
            } else {
                f.x += f.vx;
                f.y += f.vy;
            }

            if (f.x < camX - 100) f.x = camX + w + 80;
            if (f.x > camX + w + 100) f.x = camX - 80;
            if (f.y < camY - 80) {
                f.y = camY + h + 40;
                if (f.type === 'water_drop') f.vy = 2.2 + Math.random() * 1.5;
            }
            if (f.y > camY + h + 80) {
                f.y = camY - 40;
                if (f.type === 'water_drop') f.vy = 2.2 + Math.random() * 1.5;
            }

            const screenX = f.x - camX;
            const screenY = f.y - camY;
            if (screenX >= -10 && screenX <= w + 10 && screenY >= -10 && screenY <= h + 10) {
                const pulse = (Math.sin(f.phase) + 1) * 0.5;
                if (f.type === 'water_drop') {
                    targetCtx.fillStyle = f.color;
                    targetCtx.fillRect(Math.floor(screenX), Math.floor(screenY), 1.5, Math.min(5, f.vy * 1.1));
                    targetCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    targetCtx.fillRect(Math.floor(screenX), Math.floor(screenY), 1, 1);
                } else if (f.type === 'magma_ember') {
                    const glowAlpha = Math.max(0.15, pulse * 0.85);
                    targetCtx.fillStyle = `rgba(249, 115, 22, ${glowAlpha * 0.35})`;
                    targetCtx.fillRect(Math.floor(screenX - 2), Math.floor(screenY - 2), f.size + 4, f.size + 4);
                    targetCtx.fillStyle = f.color;
                    targetCtx.fillRect(Math.floor(screenX), Math.floor(screenY), f.size, f.size);
                } else if (f.type === 'gloom_wisp') {
                    const glowAlpha = Math.max(0.12, pulse * 0.75);
                    targetCtx.fillStyle = `rgba(168, 85, 247, ${glowAlpha * 0.4})`;
                    targetCtx.fillRect(Math.floor(screenX - 3), Math.floor(screenY - 3), f.size + 6, f.size + 6);
                    targetCtx.fillStyle = f.color;
                    targetCtx.fillRect(Math.floor(screenX), Math.floor(screenY), f.size, f.size);
                } else {
                    targetCtx.fillStyle = 'rgba(203, 213, 225, 0.35)';
                    targetCtx.fillRect(Math.floor(screenX), Math.floor(screenY), 1.5, 1.5);
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
        menuTime = 0.85; // Deep subterranean cavern night ambiance
        const terrain = new Array(MENU_WORLD_WIDTH);
        const blocks = new Array(MENU_WORLD_WIDTH);

        // 1. Generate Cavern Ceiling, Void & Rocky Floor
        for (let x = 0; x < MENU_WORLD_WIDTH; x++) {
            const col = new Array(MENU_WORLD_HEIGHT).fill(IDS.AIR);

            // Ceiling Profile
            const ceilY = Math.round(22 + Math.sin(x * 0.08) * 3 + Math.cos(x * 0.14) * 2);
            for (let y = 0; y <= ceilY; y++) {
                const r = menuRandom();
                if (r < 0.06) col[y] = IDS.COAL_ORE;
                else if (r < 0.10) col[y] = IDS.IRON_ORE;
                else if (r < 0.22) col[y] = IDS.COBBLESTONE;
                else col[y] = IDS.STONE;
            }

            // Stalactites (Tapered spikes hanging down from ceiling)
            if (x % 3 === 0 || x % 7 === 0 || x % 11 === 0) {
                const stLen = Math.floor(menuRandom() * 5) + 2;
                for (let s = 1; s <= stLen; s++) {
                    const sy = ceilY + s;
                    if (sy < 44) {
                        col[sy] = (s === stLen && menuRandom() < 0.5) ? IDS.COBBLESTONE : IDS.STONE;
                    }
                }
                // Hanging Roots / Moss Vines
                if (menuRandom() < 0.6) {
                    const vineLen = Math.floor(menuRandom() * 3) + 1;
                    for (let v = 1; v <= vineLen; v++) {
                        const vy = ceilY + stLen + v;
                        if (vy < 46) col[vy] = IDS.VINES;
                    }
                }
            }

            // Floor Profile
            let floorY = Math.round(53 + Math.sin(x * 0.07) * 2.2 + Math.cos(x * 0.13) * 1.5);

            // Chasm Abyss under Trestle Bridge (x = 48 to 66)
            const inChasm = (x >= 48 && x <= 66);
            if (inChasm) {
                floorY = 68 + Math.round(Math.sin((x - 48) * 0.2) * 3);
            }

            // Magma / Lava Basin (x = 76 to 90)
            const inLavaBasin = (x >= 76 && x <= 90);
            if (inLavaBasin) {
                floorY = 56;
            }

            terrain[x] = inChasm ? 50 : floorY; // Surface anchor for entities

            // Fill rocky floor down to world bottom
            for (let y = floorY; y < MENU_WORLD_HEIGHT; y++) {
                const r = menuRandom();
                if (y === floorY && !inChasm && !inLavaBasin) {
                    col[y] = (r < 0.45) ? IDS.COBBLESTONE : ((r < 0.7) ? IDS.STONE : IDS.DIRT);
                } else {
                    if (r < 0.05) col[y] = IDS.COAL_ORE;
                    else if (r < 0.09) col[y] = IDS.IRON_ORE;
                    else if (y > floorY + 4 && r < 0.12) col[y] = IDS.GOLD_ORE;
                    else if (y > floorY + 8 && r < 0.14) col[y] = IDS.DIAMOND_ORE;
                    else if (y > floorY + 6 && r < 0.155) col[y] = IDS.EMERALD_ORE;
                    else if (r < 0.28) col[y] = IDS.COBBLESTONE;
                    else col[y] = IDS.STONE;
                }
            }

            // Molten Lava in Magma Basin
            if (inLavaBasin) {
                col[54] = IDS.LAVA;
                col[55] = IDS.LAVA;
                col[56] = IDS.COBBLESTONE;
            }

            // Stalagmites (Pointed spikes rising from floor)
            if (!inChasm && !inLavaBasin && (x % 4 === 0 || x % 9 === 0)) {
                const smLen = Math.floor(menuRandom() * 4) + 2;
                for (let s = 1; s <= smLen; s++) {
                    const smy = floorY - s;
                    if (smy > ceilY + 4) {
                        col[smy] = (s === smLen) ? IDS.COBBLESTONE : IDS.STONE;
                    }
                }
            }

            blocks[x] = col;
        }

        // 2. Custom Cave Build #1: Ancient Gloom Crypt / Ritual Altar (x = 16 to 34)
        for (let x = 16; x <= 34; x++) {
            for (let y = 53; y < MENU_WORLD_HEIGHT; y++) {
                blocks[x][y] = IDS.COBBLESTONE;
            }
        }
        // Cobblestone Access Steps
        blocks[17][53] = IDS.COBBLESTONE_STAIRS_RIGHT;
        blocks[18][52] = IDS.COBBLESTONE_STAIRS_RIGHT;
        blocks[19][51] = IDS.COBBLESTONE_STAIRS_RIGHT;
        // Void Stone Brick Altar Dais (Tier 1)
        for (let x = 20; x <= 30; x++) {
            blocks[x][51] = IDS.VOID_STONE_BRICK;
            blocks[x][52] = IDS.VOID_STONE_BRICK;
        }
        // Void Stone Brick Altar Dais (Tier 2)
        for (let x = 22; x <= 28; x++) {
            blocks[x][49] = IDS.VOID_STONE_BRICK;
            blocks[x][50] = IDS.VOID_STONE_BRICK;
        }
        // Right Access Steps
        blocks[31][51] = IDS.COBBLESTONE_STAIRS;
        blocks[32][52] = IDS.COBBLESTONE_STAIRS;
        blocks[33][53] = IDS.COBBLESTONE_STAIRS;

        // Central Altar: Astral Infuser, Void Berries, Ancient Crypt Chest
        blocks[25][48] = IDS.ASTRAL_INFUSER;
        blocks[23][48] = IDS.VOID_BERRY_BUSH;
        blocks[27][48] = IDS.CHEST;

        // Gloom Lantern Pedestals
        blocks[21][50] = IDS.VOID_STONE_BRICK;
        blocks[21][49] = IDS.GLOOM_LANTERN;
        blocks[29][50] = IDS.VOID_STONE_BRICK;
        blocks[29][49] = IDS.GLOOM_LANTERN;

        // Hanging Gloom Lantern from Stalactite above Altar
        for (let y = 24; y <= 35; y++) {
            blocks[25][y] = (y <= 33) ? IDS.STONE : IDS.VINES;
        }
        blocks[25][36] = IDS.GLOOM_LANTERN;

        // 3. Custom Cave Build #2: Abandoned Mine Trestle Bridge & Scaffolding (x = 42 to 72)
        // Horizontal Bridge Walkway Deck
        for (let x = 42; x <= 72; x++) {
            blocks[x][50] = IDS.PLANKS;
        }
        blocks[42][49] = IDS.WOODEN_STAIRS_RIGHT;
        blocks[72][49] = IDS.WOODEN_STAIRS;

        // Heavy Timber Structural Support Pillars down into the abyss
        const timberPillars = [45, 52, 59, 66];
        timberPillars.forEach(px => {
            for (let y = 51; y <= 68; y++) {
                blocks[px][y] = IDS.WOOD;
            }
            // Horizontal cross bracing
            for (let bx = px - 2; bx <= px + 2; bx++) {
                if (bx >= 44 && bx <= 67 && blocks[bx][56] === IDS.AIR) blocks[bx][56] = IDS.PLANKS;
                if (bx >= 44 && bx <= 67 && blocks[bx][62] === IDS.AIR) blocks[bx][62] = IDS.PLANKS;
            }
        });

        // Lower Catwalk & Maintenance Access Ladders
        for (let x = 52; x <= 59; x++) {
            blocks[x][57] = IDS.PLANKS;
        }
        for (let y = 51; y <= 56; y++) {
            blocks[53][y] = IDS.LADDER;
        }

        // Bridge Lanterns, Torches & Supply Chests
        blocks[46][49] = IDS.WOOD;
        blocks[46][48] = IDS.TORCH;
        blocks[55][49] = IDS.CHEST;
        blocks[60][49] = IDS.WOOD;
        blocks[60][48] = IDS.GLOOM_LANTERN;
        blocks[68][49] = IDS.WOOD;
        blocks[68][48] = IDS.TORCH;

        // Suspended Gloom Lantern hanging from upper bridge crossbeam
        blocks[56][58] = IDS.GLOOM_LANTERN;

        // 4. Custom Cave Build #3: Magma Basin Stepping Stones & Torch Outpost (x = 76 to 90)
        blocks[78][53] = IDS.COBBLESTONE;
        blocks[78][52] = IDS.TORCH;
        blocks[82][53] = IDS.COBBLESTONE;
        blocks[85][53] = IDS.COBBLESTONE;
        blocks[89][53] = IDS.COBBLESTONE;
        blocks[89][52] = IDS.GLOOM_LANTERN;

        // 5. Custom Cave Build #4: Deep Spider Crevice & Cobweb Hollow (x = 96 to 118)
        // Jagged overhead arch
        for (let x = 98; x <= 114; x++) {
            const archY = Math.round(34 + Math.sin((x - 98) * 0.2) * 4);
            blocks[x][archY] = IDS.STONE;
            blocks[x][archY + 1] = IDS.COBBLESTONE;
            // Hanging web/vines
            if (menuRandom() < 0.7) {
                const webLen = Math.floor(menuRandom() * 4) + 2;
                for (let w = 1; w <= webLen; w++) {
                    if (archY + 1 + w < 48) blocks[x][archY + 1 + w] = IDS.VINES;
                }
            }
        }
        // Terrace platform & hidden chest
        for (let x = 104; x <= 112; x++) {
            blocks[x][49] = IDS.VOID_STONE_BRICK;
        }
        blocks[108][48] = IDS.CHEST;
        blocks[105][48] = IDS.GLOOM_LANTERN;
        blocks[111][48] = IDS.TORCH;

        // Additional Hanging Lanterns throughout Cavern
        blocks[10][32] = IDS.TORCH;
        blocks[38][36] = IDS.GLOOM_LANTERN;
        blocks[75][34] = IDS.GLOOM_LANTERN;
        blocks[93][35] = IDS.TORCH;
        blocks[122][35] = IDS.GLOOM_LANTERN;

        // 6. Living Animated Cave Monsters (Authentic Webcraft Creatures)
        const caveMobs = [];

        // Gloomstalker #1: Upside-down Ceiling Clinger stalking on cavern roof stalactites
        const gsCeiling = new Gloomstalker(58 * TILE_SIZE, 26 * TILE_SIZE);
        gsCeiling.isCeilingClinging = true;
        gsCeiling.facingRight = true;
        gsCeiling.isMenuEntity = true;
        caveMobs.push({ type: 'gloomstalker_ceiling', entity: gsCeiling });

        // Gloomstalker #2: Altar Prowler stalking on the Void Stone Altar dais
        const gsAltar = new Gloomstalker(24 * TILE_SIZE, 47 * TILE_SIZE);
        gsAltar.isGrounded = true;
        gsAltar.facingRight = false;
        gsAltar.isMenuEntity = true;
        caveMobs.push({ type: 'gloomstalker', entity: gsAltar });

        // Zombie #1: Stone Floor Roamer near Altar
        const z1 = new Zombie(35 * TILE_SIZE, 50 * TILE_SIZE);
        z1.isGrounded = true;
        z1.isMenuEntity = true;
        caveMobs.push({ type: 'zombie', entity: z1 });

        // Zombie #2: Mine Trestle Bridge Patroller
        const z2 = new Zombie(51 * TILE_SIZE, 48 * TILE_SIZE);
        z2.isGrounded = true;
        z2.isMenuEntity = true;
        caveMobs.push({ type: 'zombie', entity: z2 });

        // Zombie #3: Distant Shadow Crevice Walker
        const z3 = new Zombie(112 * TILE_SIZE, 51 * TILE_SIZE);
        z3.isGrounded = true;
        z3.isMenuEntity = true;
        caveMobs.push({ type: 'zombie', entity: z3 });

        // Creeper #1: Chasm Abutment Watcher overlooking lava pool
        const c1 = new Creeper(73 * TILE_SIZE, 48 * TILE_SIZE);
        c1.isGrounded = true;
        c1.facingRight = true;
        c1.isMenuEntity = true;
        caveMobs.push({ type: 'creeper', entity: c1 });

        // Creeper #2: Spider Hollow Alcove Lurker
        const c2 = new Creeper(103 * TILE_SIZE, 47 * TILE_SIZE);
        c2.isGrounded = true;
        c2.facingRight = false;
        c2.isMenuEntity = true;
        caveMobs.push({ type: 'creeper', entity: c2 });

        // Scorpion #1: Altar Steps Guardian
        const s1 = new Scorpion(19 * TILE_SIZE, 50 * TILE_SIZE);
        s1.isGrounded = true;
        s1.facingRight = true;
        s1.isMenuEntity = true;
        caveMobs.push({ type: 'scorpion', entity: s1 });

        // Scorpion #2: Magma Basin Shore Stalker
        const s2 = new Scorpion(88 * TILE_SIZE, 52 * TILE_SIZE);
        s2.isGrounded = true;
        s2.facingRight = false;
        s2.isMenuEntity = true;
        caveMobs.push({ type: 'scorpion', entity: s2 });

        menuEntities = caveMobs;

        menuWorld = {
            terrain,
            surfaceHeights: terrain,
            blocks,
            animals: caveMobs,
            width: MENU_WORLD_WIDTH
        };
        menuWorldInitialized = true;
        if (typeof window !== 'undefined') {
            window.menuWorld = menuWorld;
            window.menuEntities = caveMobs;
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
        const mObj = (typeof mouse !== "undefined" && mouse && typeof mouse.clientX === "number") ? mouse : ((typeof window !== "undefined" && window.mouse) ? window.mouse : { clientX: (typeof window !== "undefined" ? window.innerWidth : 800) / 2, clientY: (typeof window !== "undefined" ? window.innerHeight : 600) / 2 });
        const pointerX = Math.max(-1, Math.min(1, (mObj.clientX - window.innerWidth / 2) / Math.max(1, window.innerWidth / 2)));
        const pointerY = Math.max(-1, Math.min(1, (mObj.clientY - window.innerHeight / 2) / Math.max(1, window.innerHeight / 2)));
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

        // 1. Deep Subterranean Pitch-Black Abyss Canvas
        menuCtx.fillStyle = '#04050a';
        menuCtx.fillRect(0, 0, width, height);

        const caveGrad = menuCtx.createLinearGradient(0, 0, 0, height);
        caveGrad.addColorStop(0, '#030206');
        caveGrad.addColorStop(0.35, '#070512');
        caveGrad.addColorStop(0.70, '#0b081a');
        caveGrad.addColorStop(1, '#05030c');
        menuCtx.fillStyle = caveGrad;
        menuCtx.fillRect(0, 0, width, height);

        // 2. Parallax Distant Cavern Wall Silhouettes (Layer 1: Far, Layer 2: Mid)
        menuCtx.save();
        // Far Cave Walls (Parallax 0.12)
        const farOffset = (menuCamX * 0.12 + menuParallaxX * 0.3) % width;
        menuCtx.fillStyle = '#0a0816';
        menuCtx.beginPath();
        menuCtx.moveTo(0, height * 0.28);
        for (let px = 0; px <= width + 64; px += 48) {
            const worldFarX = (px + farOffset);
            const jaggedCeil = height * 0.25 + Math.sin(worldFarX * 0.008) * 40 + Math.cos(worldFarX * 0.02) * 20;
            menuCtx.lineTo(px, jaggedCeil);
        }
        menuCtx.lineTo(width, 0);
        menuCtx.lineTo(0, 0);
        menuCtx.closePath();
        menuCtx.fill();

        menuCtx.beginPath();
        menuCtx.moveTo(0, height);
        for (let px = 0; px <= width + 64; px += 48) {
            const worldFarX = (px + farOffset);
            const jaggedFloor = height * 0.72 - Math.sin(worldFarX * 0.009) * 35 - Math.cos(worldFarX * 0.018) * 18;
            menuCtx.lineTo(px, jaggedFloor);
        }
        menuCtx.lineTo(width, height);
        menuCtx.lineTo(0, height);
        menuCtx.closePath();
        menuCtx.fill();

        // Mid Cave Wall Buttresses & Pillars (Parallax 0.26)
        const midOffset = (menuCamX * 0.26 + menuParallaxX * 0.5) % width;
        menuCtx.fillStyle = '#110d22';
        menuCtx.beginPath();
        menuCtx.moveTo(0, height * 0.22);
        for (let px = 0; px <= width + 64; px += 64) {
            const worldMidX = (px + midOffset);
            const jaggedCeil = height * 0.22 + Math.sin(worldMidX * 0.012) * 50 + Math.sin(worldMidX * 0.035) * 25;
            menuCtx.lineTo(px, jaggedCeil);
        }
        menuCtx.lineTo(width, 0);
        menuCtx.lineTo(0, 0);
        menuCtx.closePath();
        menuCtx.fill();

        menuCtx.beginPath();
        menuCtx.moveTo(0, height);
        for (let px = 0; px <= width + 64; px += 64) {
            const worldMidX = (px + midOffset);
            const jaggedFloor = height * 0.76 - Math.sin(worldMidX * 0.014) * 45 - Math.cos(worldMidX * 0.028) * 20;
            menuCtx.lineTo(px, jaggedFloor);
        }
        menuCtx.lineTo(width, height);
        menuCtx.lineTo(0, height);
        menuCtx.closePath();
        menuCtx.fill();

        // Magma Underglow in the distance
        const lavaScreenX = (83 * TILE_SIZE - menuCamX * 0.6 + width) % width;
        const lavaGlow = menuCtx.createRadialGradient(lavaScreenX, height * 0.85, 20, lavaScreenX, height * 0.85, height * 0.6);
        lavaGlow.addColorStop(0, 'rgba(239, 68, 68, 0.28)');
        lavaGlow.addColorStop(0.35, 'rgba(249, 115, 22, 0.16)');
        lavaGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        menuCtx.fillStyle = lavaGlow;
        menuCtx.fillRect(0, 0, width, height);

        // 3. Creepy Blinking Glowing Eyes in Distant Shadow Niches
        const shadowEyes = [
            { gx: 12, gy: 35, color: '#ef4444', blinkPeriod: 4200, offset: 0 },
            { gx: 38, gy: 32, color: '#f59e0b', blinkPeriod: 3600, offset: 1200 },
            { gx: 71, gy: 36, color: '#22c55e', blinkPeriod: 4800, offset: 2400 },
            { gx: 93, gy: 33, color: '#a855f7', blinkPeriod: 5100, offset: 800 },
            { gx: 120, gy: 38, color: '#ef4444', blinkPeriod: 3900, offset: 3100 }
        ];
        shadowEyes.forEach(eye => {
            const eyeWorldX = eye.gx * TILE_SIZE;
            const eyeScreenX = ((eyeWorldX - menuCamX * 0.5) % (MENU_WORLD_WIDTH * TILE_SIZE * 0.5) + (MENU_WORLD_WIDTH * TILE_SIZE * 0.5)) % (MENU_WORLD_WIDTH * TILE_SIZE * 0.5) - 100;
            const eyeScreenY = eye.gy * (height / 80) + menuParallaxY * 0.4;
            const isBlinking = ((now + eye.offset) % eye.blinkPeriod) < 160;
            if (!isBlinking && eyeScreenX >= -20 && eyeScreenX <= width + 20) {
                menuCtx.fillStyle = eye.color;
                menuCtx.fillRect(Math.floor(eyeScreenX), Math.floor(eyeScreenY), 2.5, 2);
                menuCtx.fillRect(Math.floor(eyeScreenX + 5), Math.floor(eyeScreenY), 2.5, 2);
                menuCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                menuCtx.fillRect(Math.floor(eyeScreenX + 1), Math.floor(eyeScreenY), 1, 1);
                menuCtx.fillRect(Math.floor(eyeScreenX + 6), Math.floor(eyeScreenY), 1, 1);
            }
        });
        menuCtx.restore();

        // 4. Foreground Cavern Blocks (Centered on Cavern Hall)
        const cameraX = menuCamX;
        const cameraY = (47 * TILE_SIZE) - height * 0.50 + menuParallaxY * 0.8;
        const startCol = Math.floor(cameraX / TILE_SIZE) - 1;
        const endCol = startCol + Math.ceil(width / TILE_SIZE) + 2;
        const startRow = Math.max(0, Math.floor(cameraY / TILE_SIZE) - 2);
        const endRow = Math.min(MENU_WORLD_HEIGHT - 1, Math.ceil((cameraY + height) / TILE_SIZE) + 1);

        menuCtx.imageSmoothingEnabled = false;

        // Dynamic Light Bloom Sources Collection
        const lightBlooms = [];

        for (let x = startCol; x <= endCol; x++) {
            const wrappedX = ((x % MENU_WORLD_WIDTH) + MENU_WORLD_WIDTH) % MENU_WORLD_WIDTH;
            const drawX = Math.round(x * TILE_SIZE - cameraX);
            const col = menuWorld.blocks?.[wrappedX];
            if (!col) continue;

            for (let y = startRow; y <= endRow; y++) {
                const block = col[y];
                if (block === undefined || block === IDS.AIR) continue;
                const drawY = Math.round(y * TILE_SIZE - cameraY);
                if (drawY + TILE_SIZE < -20 || drawY > height + 20) continue;

                // Hanging Chain links above suspended lanterns/torches
                if ((block === IDS.GLOOM_LANTERN || block === IDS.TORCH) && y > 0 && col[y - 1] === IDS.AIR) {
                    menuCtx.fillStyle = '#475569';
                    menuCtx.fillRect(drawX + 7, drawY - 8, 2, 8);
                    menuCtx.fillStyle = '#1e293b';
                    menuCtx.fillRect(drawX + 8, drawY - 8, 1, 8);
                }

                if (textures[block]) {
                    menuCtx.drawImage(textures[block], drawX, drawY, TILE_SIZE, TILE_SIZE);
                }

                // Register Light Bloom Emitters
                if (block === IDS.GLOOM_LANTERN) {
                    lightBlooms.push({ x: drawX + TILE_SIZE / 2, y: drawY + TILE_SIZE / 2, type: 'gloom' });
                } else if (block === IDS.TORCH) {
                    lightBlooms.push({ x: drawX + TILE_SIZE / 2, y: drawY + TILE_SIZE / 2, type: 'torch' });
                } else if (block === IDS.ASTRAL_INFUSER) {
                    lightBlooms.push({ x: drawX + TILE_SIZE / 2, y: drawY + TILE_SIZE / 2, type: 'astral' });
                } else if (block === IDS.LAVA && y === 54 && x % 2 === 0) {
                    lightBlooms.push({ x: drawX + TILE_SIZE / 2, y: drawY + TILE_SIZE / 2, type: 'lava' });
                }
            }
        }

        // 5. Living Animated Cave Monsters
        if (menuEntities && menuEntities.length) {
            menuEntities.forEach(entry => {
                const entity = entry.entity;
                entity.isMenuEntity = true;

                if (entry.type === 'gloomstalker_ceiling') {
                    // Upside-down Ceiling Clinger AI
                    entity.isCeilingClinging = true;
                    entity.vy = 0;
                    entity.walkAnimTime += 0.05;
                    const spd = 0.55;
                    entity.x += (entity.facingRight ? 1 : -1) * spd;
                    if (entity.x < 51 * TILE_SIZE) entity.facingRight = true;
                    else if (entity.x > 67 * TILE_SIZE) entity.facingRight = false;
                } else {
                    // Prowling Hostile Cave AI for Main Menu
                    entity.onFire = false; // Suppress daytime sunlight combustion
                    if (entity instanceof Creeper) entity.swell = 0; // Prevent fuse countdown
                    
                    if (!entity.menuPatrolDir) entity.menuPatrolDir = (Math.random() > 0.5 ? 1 : -1);
                    if (!entity.menuPatrolTimer) entity.menuPatrolTimer = 120 + Math.floor(Math.random() * 180);
                    entity.menuPatrolTimer--;
                    if (entity.menuPatrolTimer <= 0) {
                        entity.menuPatrolDir *= -1;
                        entity.menuPatrolTimer = 180 + Math.floor(Math.random() * 240);
                    }

                    const curSpeed = (entity.speed || entity.baseSpeed || 1.2) * 0.55;
                    entity.vx = entity.menuPatrolDir * curSpeed;
                    entity.facingRight = entity.menuPatrolDir > 0;
                    entity.walkAnimTime += 0.08;

                    // Edge & Wall Awareness (smooth turn-around before falling or hitting solid wall)
                    const nextGx = Math.floor((entity.x + entity.width / 2 + entity.menuPatrolDir * (entity.width / 2 + 8)) / TILE_SIZE);
                    const footGy = Math.floor((entity.y + entity.height + 2) / TILE_SIZE);
                    const waistGy = Math.floor((entity.y + entity.height * 0.5) / TILE_SIZE);
                    const isWallAhead = isSolidWorldBlock(nextGx, waistGy, menuWorld.blocks?.[nextGx]?.[waistGy]);
                    const isGroundAhead = isSolidWorldBlock(nextGx, footGy, menuWorld.blocks?.[nextGx]?.[footGy]);

                    if (isWallAhead || !isGroundAhead || entity.x < 6 * TILE_SIZE || entity.x > (MENU_WORLD_WIDTH - 6) * TILE_SIZE) {
                        entity.menuPatrolDir *= -1;
                        entity.vx = entity.menuPatrolDir * curSpeed;
                        entity.facingRight = entity.menuPatrolDir > 0;
                    }

                    entity.applyPhysics();
                }

                entity.draw(menuCtx, cameraX, cameraY);
            });
        }

        // 6. Radiant Lighting Blooms (Lighter Composite Operation)
        menuCtx.save();
        menuCtx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < lightBlooms.length; i++) {
            const b = lightBlooms[i];
            if (b.x < -100 || b.x > width + 100 || b.y < -100 || b.y > height + 100) continue;

            if (b.type === 'gloom') {
                // Eerie Violet Gloom Bloom
                const gloomPulse = Math.sin(now * 0.003 + b.x) * 0.06;
                const rad = 85 + gloomPulse * 15;
                const gGrad = menuCtx.createRadialGradient(b.x, b.y, 4, b.x, b.y, rad);
                gGrad.addColorStop(0, 'rgba(238, 210, 255, 0.65)');
                gGrad.addColorStop(0.25, 'rgba(168, 85, 247, 0.42)');
                gGrad.addColorStop(0.65, 'rgba(124, 58, 237, 0.18)');
                gGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                menuCtx.fillStyle = gGrad;
                menuCtx.fillRect(b.x - rad, b.y - rad, rad * 2, rad * 2);
            } else if (b.type === 'torch') {
                // Warm Amber Torch Bloom
                const flicker = Math.sin(now * 0.012 + b.x * 0.5) * 4;
                const rad = 72 + flicker;
                const tGrad = menuCtx.createRadialGradient(b.x, b.y, 3, b.x, b.y, rad);
                tGrad.addColorStop(0, 'rgba(255, 237, 160, 0.65)');
                tGrad.addColorStop(0.30, 'rgba(249, 115, 22, 0.38)');
                tGrad.addColorStop(0.70, 'rgba(217, 119, 6, 0.12)');
                tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                menuCtx.fillStyle = tGrad;
                menuCtx.fillRect(b.x - rad, b.y - rad, rad * 2, rad * 2);
            } else if (b.type === 'astral') {
                // Astral Void Rift Bloom
                const rad = 95 + Math.sin(now * 0.005) * 10;
                const aGrad = menuCtx.createRadialGradient(b.x, b.y, 5, b.x, b.y, rad);
                aGrad.addColorStop(0, 'rgba(224, 231, 255, 0.70)');
                aGrad.addColorStop(0.35, 'rgba(192, 132, 252, 0.45)');
                aGrad.addColorStop(0.75, 'rgba(91, 33, 182, 0.18)');
                aGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                menuCtx.fillStyle = aGrad;
                menuCtx.fillRect(b.x - rad, b.y - rad, rad * 2, rad * 2);
            } else if (b.type === 'lava') {
                // Molten Lava Glow
                const rad = 65;
                const lGrad = menuCtx.createRadialGradient(b.x, b.y, 4, b.x, b.y, rad);
                lGrad.addColorStop(0, 'rgba(251, 146, 60, 0.40)');
                lGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.20)');
                lGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                menuCtx.fillStyle = lGrad;
                menuCtx.fillRect(b.x - rad, b.y - rad, rad * 2, rad * 2);
            }
        }
        menuCtx.restore();

        // 7. Subterranean Volumetric Mist / Low Cavern Fog
        menuCtx.save();
        const fogLayers = [
            { speed: 0.04, alpha: 0.16, yOffset: 0.48, hRatio: 0.45 },
            { speed: 0.08, alpha: 0.12, yOffset: 0.62, hRatio: 0.38 }
        ];
        for (let l = 0; l < fogLayers.length; l++) {
            const layer = fogLayers[l];
            const a = layer.alpha;
            const fogGrad = menuCtx.createLinearGradient(0, height * layer.yOffset, 0, height * (layer.yOffset + layer.hRatio));
            fogGrad.addColorStop(0, 'rgba(59, 7, 100, 0)');
            fogGrad.addColorStop(0.35, `rgba(46, 16, 101, ${a.toFixed(3)})`);
            fogGrad.addColorStop(0.70, `rgba(17, 24, 39, ${(a * 1.2).toFixed(3)})`);
            fogGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
            menuCtx.fillStyle = fogGrad;
            menuCtx.fillRect(0, height * layer.yOffset, width, height * layer.hRatio);
        }
        menuCtx.restore();

        // 8. Atmospheric Cavern Particles (Dripping water drops, magma sparks, gloom wisps)
        drawMenuFireflies(menuCtx, width, height, cameraX, cameraY);

        // 9. Horror Cave Biome Color Grading
        menuCtx.save();
        menuCtx.fillStyle = 'rgba(12, 6, 24, 0.28)'; // Deep obsidian-void subterranean grade
        menuCtx.fillRect(0, 0, width, height);
        menuCtx.restore();

        // 10. Heavy Cinematic Vignette
        const vignette = menuCtx.createRadialGradient(width / 2, height * 0.48, height * 0.25, width / 2, height * 0.48, height * 0.88);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(0.65, 'rgba(3, 2, 8, 0.42)');
        vignette.addColorStop(1, 'rgba(1, 1, 4, 0.88)');
        menuCtx.fillStyle = vignette;
        menuCtx.fillRect(0, 0, width, height);
        menuLastFrame = now;

        if (!menuBackgroundRendered) {
            menuBackgroundRendered = true;
            if (typeof window !== 'undefined') window.menuBackgroundRendered = true;
            dismissBootLoadingScreen();
        }
    }


    export function getPlayerCaveSkyOpacity() {
        const curPlayer = player || window.player;
        const curWorld = world || window.world;
        if (!curPlayer || !curWorld) return 0;

        const playerCenterX = (curPlayer.x || 0) + (curPlayer.width || 24) / 2;
        const playerFeetWorldY = (curPlayer.y || 0) + (curPlayer.height || 48);
        const playerGridX = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor(playerCenterX / TILE_SIZE)));
        const playerHeadGridY = Math.max(0, Math.floor((curPlayer.y || 0) / TILE_SIZE));

        // 1. Raycast upward directly above player to test for open sky access vs solid subterranean ceiling
        const leftCol = Math.max(0, Math.floor(((curPlayer.x || 0) + 2) / TILE_SIZE));
        const rightCol = Math.min(WORLD_WIDTH - 1, Math.floor(((curPlayer.x || 0) + (curPlayer.width || 24) - 2) / TILE_SIZE));

        let maxCeilingThickness = 0;
        let hasOpenSky = false;

        for (let cx = leftCol; cx <= rightCol; cx++) {
            let solidCount = 0;
            for (let y = playerHeadGridY; y >= 0; y--) {
                const b = curWorld[cx]?.[y];
                if (b !== undefined && !isNonSurfaceBlock(b)) {
                    solidCount++;
                }
            }
            if (solidCount === 0) {
                hasOpenSky = true;
            }
            if (solidCount > maxCeilingThickness) {
                maxCeilingThickness = solidCount;
            }
        }

        // Direct open sky or only foliage/canopy/air above means player is definitely not in a subterranean cave
        if (hasOpenSky) {
            return 0;
        }

        // A thin surface structure (e.g. 1-2 block wooden bridge or roof) does not constitute a subterranean cave
        if (maxCeilingThickness < 3) {
            return 0;
        }

        // 2. Measure depth below the local terrain surface
        let avgSurfaceY = 0;
        let count = 0;
        for (let ox = -2; ox <= 2; ox++) {
            let gx = Math.max(0, Math.min(WORLD_WIDTH - 1, playerGridX + ox));
            avgSurfaceY += getWorldSurfaceY(gx);
            count++;
        }
        avgSurfaceY = (avgSurfaceY / count) * TILE_SIZE;

        const caveDepthTiles = (playerFeetWorldY - avgSurfaceY) / TILE_SIZE;
        if (caveDepthTiles <= CAVE_SKY_START_TILES) {
            return 0;
        }

        // Smoothly fade from 0 to 1 as player ventures deeper into subterranean cavern
        const depthFactor = Math.max(0, Math.min(1, (caveDepthTiles - CAVE_SKY_START_TILES) / CAVE_SKY_FADE_TILES));
        const ceilingFactor = Math.max(0, Math.min(1, (maxCeilingThickness - 2) / 3));

        return Math.min(depthFactor, ceilingFactor);
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



    export function initFabulousParticles() {
        const budget = getFabulousParticleBudget();
        if (fabulousAmbientParticles.length >= budget) {
            if (fabulousAmbientParticles.length > budget) {
                fabulousAmbientParticles.length = budget;
            }
            return;
        }
        for (let i = fabulousAmbientParticles.length; i < budget; i++) {
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
        if (!fabulousGraphics || !fabulousConfig.colorGrading || !player) {
            currentBiomeHue.a = 0;
            currentFogDensity = 0;
            return;
        }
        const playerGridX = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor(((player.x || 0) + (player.width || 24) / 2) / TILE_SIZE)));
        const playerFeetGridY = ((player.y || 0) + (player.height || 48)) / TILE_SIZE;
        const surfY = getWorldSurfaceY(playerGridX);
        const isUnderground = playerFeetGridY > surfY + CAVE_SKY_START_TILES && caveSkyOpacity > 0.15;

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
            targetR = 200; targetG = 235; targetB = 255; targetA = 0.08;
            targetFog = 0.55;
        } else if (activeBiome === 'desert') {
            if (timeOfDay >= 0.68 && timeOfDay < 0.90) {
                targetR = 18; targetG = 32; targetB = 76; targetA = 0.14;
            } else {
                targetR = 255; targetG = 175; targetB = 45; targetA = 0.16;
            }
        } else if (activeBiome === 'jungle') {
            // Tropical Jungle: Rich lush canopy with warm natural sunlight
            if (timeOfDay >= 0.58 && timeOfDay < 0.68) {
                // Tropical Sunset: warm golden amber
                targetR = 255; targetG = 160; targetB = 60; targetA = 0.07;
                targetFog = 0.0;
            } else if (timeOfDay >= 0.68 && timeOfDay < 0.90) {
                // Rainforest Night: deep moonlit night
                targetR = 15; targetG = 25; targetB = 50; targetA = 0.06;
                targetFog = 0.0;
            } else {
                // Daytime: clear natural sunlight with subtle warm tropical canopy filter
                targetR = 230; targetG = 240; targetB = 215; targetA = 0.03;
                targetFog = 0.0;
            }
        } else if (activeBiome === 'forest') {
            if (timeOfDay >= 0.58 && timeOfDay < 0.68) {
                targetR = 255; targetG = 165; targetB = 70; targetA = 0.06;
            } else if (timeOfDay >= 0.68 && timeOfDay < 0.90) {
                targetR = 15; targetG = 25; targetB = 55; targetA = 0.05;
            } else {
                targetR = 240; targetG = 245; targetB = 220; targetA = 0.02;
            }
        } else if (activeBiome === 'mountains') {
            if (timeOfDay >= 0.68 && timeOfDay < 0.90) {
                targetR = 16; targetG = 28; targetB = 68; targetA = 0.08;
            } else {
                targetR = 180; targetG = 210; targetB = 255; targetA = 0.04;
            }
        } else {
            // Open Plains: Warm sun-drenched golden-meadow tint
            if (timeOfDay >= 0.58 && timeOfDay < 0.68) {
                targetR = 255; targetG = 170; targetB = 75; targetA = 0.06;
            } else if (timeOfDay >= 0.68 && timeOfDay < 0.90) {
                targetR = 18; targetG = 30; targetB = 60; targetA = 0.05;
            } else {
                targetR = 255; targetG = 245; targetB = 220; targetA = 0.02;
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
        if (!fabulousGraphics || !fabulousConfig.colorGrading || currentBiomeHue.a <= 0.005 || w <= 0 || h <= 0) return;
        targetCtx.save();
        targetCtx.fillStyle = `rgba(${Math.round(currentBiomeHue.r)}, ${Math.round(currentBiomeHue.g)}, ${Math.round(currentBiomeHue.b)}, ${currentBiomeHue.a.toFixed(3)})`;
        targetCtx.fillRect(0, 0, w, h);
        targetCtx.restore();
    }

    export function drawSnowFog(targetCtx, w, h, camX) {
        if (!fabulousGraphics || !fabulousConfig.volumetricFog || currentFogDensity <= 0.01 || w <= 0 || h <= 0) return;
        if (cachedActiveBiome !== 'snow' && cachedActiveBiome !== 'mountains') return;
        targetCtx.save();
        const layers = [
            { speed: 0.8, alpha: 0.28, yOffset: 0.15, hRatio: 0.7 },
            { speed: 1.4, alpha: 0.22, yOffset: 0.35, hRatio: 0.65 },
            { speed: 0.5, alpha: 0.18, yOffset: 0.0, hRatio: 1.0 }
        ];

        for (let l = 0; l < layers.length; l++) {
            const layer = layers[l];
            const a = layer.alpha * currentFogDensity;
            const fogGrad = targetCtx.createLinearGradient(0, h * layer.yOffset, 0, h * (layer.yOffset + layer.hRatio));
            fogGrad.addColorStop(0, `rgba(230, 245, 255, 0)`);
            fogGrad.addColorStop(0.3, `rgba(225, 242, 255, ${a.toFixed(3)})`);
            fogGrad.addColorStop(0.7, `rgba(215, 238, 255, ${(a * 1.2).toFixed(3)})`);
            fogGrad.addColorStop(1, `rgba(230, 245, 255, 0)`);

            targetCtx.fillStyle = fogGrad;
            targetCtx.fillRect(0, h * layer.yOffset, w, h * layer.hRatio);
        }
        targetCtx.restore();
    }

    export function drawVignette(targetCtx, w, h) {
        if (!showVignette || (!fabulousGraphics && !advancedGraphics) || (fabulousGraphics && !fabulousConfig.vignette) || w <= 0 || h <= 0) return;
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

    export function drawUnderwaterScreenEffect(targetCtx, w, h) {
        if (!player || w <= 0 || h <= 0) return;
        const curPlayer = player;
        const pGx = Math.floor(((curPlayer.x || 0) + (curPlayer.width || 24) / 2) / TILE_SIZE);
        const pHeadGy = Math.floor(((curPlayer.y || 0) + 6) / TILE_SIZE);
        const pChestGy = Math.floor(((curPlayer.y || 0) + (curPlayer.height || 48) * 0.45) / TILE_SIZE);

        const headFluid = getFluid(pGx, pHeadGy);
        const chestFluid = getFluid(pGx, pChestGy);
        const isSubmerged = (headFluid && headFluid.type === IDS.WATER) &&
                            (chestFluid && chestFluid.type === IDS.WATER);

        const targetAlpha = isSubmerged ? 1.0 : 0.0;
        setEngineUnderwaterScreenAlpha(underwaterScreenAlpha + (targetAlpha - underwaterScreenAlpha) * 0.15);
        if (underwaterScreenAlpha <= 0.005) return;

        // Calculate depth (number of continuous water blocks directly above the player's head)
        let waterDepthAbove = 0;
        if (headFluid && headFluid.type === IDS.WATER) {
            for (let cy = pHeadGy; cy >= 0; cy--) {
                const fl = getFluid(pGx, cy);
                if (fl && fl.type === IDS.WATER) {
                    waterDepthAbove++;
                } else {
                    break;
                }
            }
        }

        // Deep water calculation:
        // When only a few blocks under water (depth <= 2), deepFactor is 0 (clean translucent blue tint)
        // Beyond 2-3 blocks, deepFactor ramps smoothly up to 1.0 (darkens screen and adds deep-water vignette)
        const targetDeep = isSubmerged ? Math.min(1.0, Math.max(0, (waterDepthAbove - 2) / 3.5)) : 0;
        setEngineUnderwaterDeepFactor(underwaterDeepFactor + (targetDeep - underwaterDeepFactor) * 0.12);

        targetCtx.save();

        // 1. Base underwater translucent blue tint (pure flat blue tinted color, non-textured)
        const baseBlueAlpha = (0.24 * underwaterScreenAlpha).toFixed(3);
        targetCtx.fillStyle = `rgba(16, 92, 204, ${baseBlueAlpha})`;
        targetCtx.fillRect(0, 0, w, h);

        // 2. Deep underwater darkening & vignette
        if (underwaterDeepFactor > 0.01) {
            // Ambient darkening overlay
            const darkAlpha = (0.42 * underwaterDeepFactor * underwaterScreenAlpha).toFixed(3);
            targetCtx.fillStyle = `rgba(3, 10, 28, ${darkAlpha})`;
            targetCtx.fillRect(0, 0, w, h);

            // Deep underwater oceanic vignette (dark radial corners closing in)
            const maxR = Math.hypot(w / 2, h / 2);
            const vig = targetCtx.createRadialGradient(
                w / 2, h / 2, Math.max(1, maxR * (0.35 - underwaterDeepFactor * 0.12)),
                w / 2, h / 2, Math.max(2, maxR)
            );
            const midVigAlpha = (0.36 * underwaterDeepFactor * underwaterScreenAlpha).toFixed(3);
            const edgeVigAlpha = (0.82 * underwaterDeepFactor * underwaterScreenAlpha).toFixed(3);
            vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
            vig.addColorStop(0.55, `rgba(2, 11, 30, ${midVigAlpha})`);
            vig.addColorStop(1.0, `rgba(1, 5, 18, ${edgeVigAlpha})`);

            targetCtx.fillStyle = vig;
            targetCtx.fillRect(0, 0, w, h);
        }

        targetCtx.restore();
    }

    export function drawDesertHeatShimmer(targetCtx, w, h, camX) {
        if (!fabulousGraphics || !fabulousConfig.heatShimmer || caveSkyOpacity > 0.5 || w <= 0 || h <= 0 || !player) return;
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
        if (!fabulousGraphics || !fabulousConfig.godRays || caveSkyOpacity > 0.45 || w <= 0 || h <= 0 || !player) return;
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

        const numRays = (activeBiome === 'jungle') ? 4 : 3;
        const baseSpacing = w / (numRays - 1);
        const parallaxOffset = (camX * 0.12) % baseSpacing;
        const pixelStep = 8;
        const sliceHeight = 48;

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
                r = 255;
                g = (activeBiome === 'jungle') ? 175 : 165;
                b = (activeBiome === 'jungle') ? 70 : 80;
            } else if (isSunrise) {
                baseAlpha = (0.016 + rayPulse * 0.010) * skyClear;
                r = 255; g = 210; b = 130;
            } else if (isDaytime) {
                if (activeBiome === 'jungle') {
                    baseAlpha = (0.020 + rayPulse * 0.010) * skyClear;
                    r = 245; g = 250; b = 210;
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
        if (!fabulousGraphics || !fabulousConfig.windBreeze || caveSkyOpacity > 0.4 || w <= 0 || h <= 0 || !player) return;
        const playerGridX = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor(((player.x || 0) + (player.width || 24) / 2) / TILE_SIZE)));
        const activeBiome = getActiveBiomeAt(playerGridX);
        if (activeBiome !== 'plains' && activeBiome !== 'forest') return;

        targetCtx.save();
        const numGusts = 3;
        const t = frameCount * 0.015;

        for (let g = 0; g < numGusts; g++) {
            const gustSpeed = 1.4 + g * 0.5;
            const gustCycle = (frameCount * gustSpeed * 2.0 + g * 350) % (w + 600) - 300;
            const startX = Math.floor(gustCycle);
            const baseY = Math.floor(h * (0.55 + g * 0.12) + Math.sin(t + g * 2.0) * 18);
            const numSegments = 6;
            const segW = 28 + g * 8;
            const barH = 3;

            for (let s = 0; s < numSegments; s++) {
                const segX = Math.floor(startX + s * (segW + 6));
                if (segX + segW < 0 || segX > w) continue;
                const waveY = Math.floor(Math.sin(t * 2.2 + g + s * 0.45) * 5);
                const drawY = Math.floor(baseY + waveY);
                const fade = Math.sin((s / (numSegments - 1)) * Math.PI);
                targetCtx.fillStyle = `rgba(235, 255, 215, ${(fade * 0.10).toFixed(3)})`;
                targetCtx.fillRect(segX, drawY, segW, barH);
            }
        }
        targetCtx.restore();
    }

    export function updateAndDrawFabulousParticles(targetCtx, camX, camY, w, h) {
        if (!fabulousGraphics || !fabulousConfig.ambientParticles || w <= 0 || h <= 0 || !player) return;
        const budget = getFabulousParticleBudget();
        if (budget <= 0) return;
        initFabulousParticles();

        const playerGridX = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor(((player.x || 0) + (player.width || 24) / 2) / TILE_SIZE)));
        const activeBiome = getActiveBiomeAt(playerGridX);
        const isSnowy = (activeBiome === 'snow') || (getSnowBiomeRatio(playerGridX, 10) > 0.25);
        const isUnderground = caveSkyOpacity > 0.4;
        const isNight = timeOfDay >= 0.68 && timeOfDay <= 0.90;

        targetCtx.save();
        const activeParticleCount = Math.min(fabulousAmbientParticles.length, budget);
        for (let i = 0; i < activeParticleCount; i++) {
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


// Global Window Registration for cross-module compatibility
if (typeof window !== 'undefined') {
    window.menuBgCanvas = menuBgCanvas;
    window.menuCtx = menuCtx;
    window.cachedFabulousVignetteCanvas = cachedFabulousVignetteCanvas;
    window.cachedSnowFogCanvas = cachedSnowFogCanvas;
    window.cachedSunGlowDayCanvas = cachedSunGlowDayCanvas;
    window.cachedSunGlowSunsetCanvas = cachedSunGlowSunsetCanvas;
    window.cachedMoonGlowCanvas = cachedMoonGlowCanvas;
    window.cachedShadowCanvas = cachedShadowCanvas;
    window.auroraCanvas = auroraCanvas;
    window.auroraCtx = auroraCtx;
    window.auroraImageData = auroraImageData;
    window.auroraSnowOpacity = auroraSnowOpacity;
    window.LEAF_COLORS = LEAF_COLORS;
    window.caveSkyOpacity = caveSkyOpacity;
    window.Cloud = Cloud;
    window.clouds = clouds;
    window.SKY_STARS = SKY_STARS;
    window.SKY_STARS_BUCKETS = SKY_STARS_BUCKETS;
    window.SKY_STAR_BRIGHTNESSES = SKY_STAR_BRIGHTNESSES;
    window.DAYLIGHT_TOP = DAYLIGHT_TOP;
    window.DAYLIGHT_BOTTOM = DAYLIGHT_BOTTOM;
    window.TWILIGHT_TOP = TWILIGHT_TOP;
    window.TWILIGHT_BOTTOM = TWILIGHT_BOTTOM;
    window.NIGHT_TOP = NIGHT_TOP;
    window.NIGHT_BOTTOM = NIGHT_BOTTOM;
    window.skyTopColor = skyTopColor;
    window.skyBottomColor = skyBottomColor;
    window.smoothStep = smoothStep;
    window.blendColor = blendColor;
    window.drawDynamicSky = drawDynamicSky;
    window.drawMountains = drawMountains;
    window.MENU_WORLD_WIDTH = MENU_WORLD_WIDTH;
    window.MENU_WORLD_HEIGHT = MENU_WORLD_HEIGHT;
    window.MENU_SURFACE_Y = MENU_SURFACE_Y;
    window.menuCamX = menuCamX;
    window.menuParallaxX = menuParallaxX;
    window.menuParallaxY = menuParallaxY;
    window.menuWorldSeed = menuWorldSeed;
    window.menuWorld = menuWorld;
    window.menuWorldInitialized = menuWorldInitialized;
    window.menuBackgroundRendered = menuBackgroundRendered;
    window.dismissBootLoadingScreen = dismissBootLoadingScreen;
    window.menuEntities = menuEntities;
    window.menuTime = menuTime;
    window.menuLastFrame = menuLastFrame;
    window.menuFireflies = menuFireflies;
    window.drawMenuFireflies = drawMenuFireflies;
    window.menuRandom = menuRandom;
    window.generateMenuWorld = generateMenuWorld;
    window.drawMenuBackground = drawMenuBackground;
    window.getPlayerCaveSkyOpacity = getPlayerCaveSkyOpacity;
    window.getSnowBiomeRatio = getSnowBiomeRatio;
    window.drawPixelAurora = drawPixelAurora;
    window.initFabulousParticles = initFabulousParticles;
    window.updateBiomeAtmosphere = updateBiomeAtmosphere;
    window.drawBiomeGrading = drawBiomeGrading;
    window.drawSnowFog = drawSnowFog;
    window.drawVignette = drawVignette;
    window.drawUnderwaterScreenEffect = drawUnderwaterScreenEffect;
    window.drawDesertHeatShimmer = drawDesertHeatShimmer;
    window.drawForestGodRays = drawForestGodRays;
    window.drawPlainsWindBreeze = drawPlainsWindBreeze;
    window.updateAndDrawFabulousParticles = updateAndDrawFabulousParticles;
    window.updateTimeUI = updateTimeUI;
    window.drawTimeClock = drawTimeClock;
}