// =============================================================================
// WEBCRAFT 2D - DYNAMIC LIGHTING (js/rendering/lighting.js)
// Realtime lighting canvas, ambient occlusion (AO), stamps, torch & lava glow
// =============================================================================

import {
    TILE_SIZE
} from '../core/constants.js';

export const LIGHT_SCALE = 1.0;
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

// Global Window Registration for cross-module compatibility
if (typeof window !== 'undefined') {
    window.LIGHT_SCALE = LIGHT_SCALE;
    window.lightCanvas = lightCanvas;
    window.lightCtx = lightCtx;
    window.cachedLightVignette = cachedLightVignette;
    window.cachedVignetteW = cachedVignetteW;
    window.cachedVignetteH = cachedVignetteH;
    window.updateCachedVignette = updateCachedVignette;
    window.cachedCeilingAO = cachedCeilingAO;
    window.cachedLeftWallAO = cachedLeftWallAO;
    window.cachedRightWallAO = cachedRightWallAO;
    window.cachedCornerAOTopLeft = cachedCornerAOTopLeft;
    window.cachedCornerAOTopRight = cachedCornerAOTopRight;
    window.cachedOverhangShadow = cachedOverhangShadow;
    window.generatePixelArtLightStamp = generatePixelArtLightStamp;
    if (typeof generatePixelArtGlowStamp !== "undefined") window.generatePixelArtGlowStamp = generatePixelArtGlowStamp;
    window.cachedTorchLightCanvas = cachedTorchLightCanvas;
    window.cachedTorchGlowCanvas = cachedTorchGlowCanvas;
    window.cachedLavaGlowCanvas = cachedLavaGlowCanvas;
    window.cachedBloomAuraCanvas = cachedBloomAuraCanvas;
}
