/**
 * Webcraft2D World Thumbnails & Procedural Biome Art Generator
 * (js/ui/worldthumbnails.js)
 * 
 * Provides:
 *  1. Live in-game canvas snapshot capture (16:9 160x90 thumbnail on world save)
 *  2. Procedural 2D pixel-art biome landscape generator for new or imported worlds
 */

const proceduralCache = new Map();

/**
 * Capture a crisp 16:9 thumbnail from the active game canvas.
 * @param {HTMLCanvasElement} [gameCanvas] 
 * @returns {string|null} dataURL or null
 */
export function captureWorldThumbnail(gameCanvas) {
    try {
        const cv = gameCanvas || document.getElementById('game-canvas');
        if (!cv || !cv.width || !cv.height) return null;

        const thumb = document.createElement('canvas');
        thumb.width = 160;
        thumb.height = 90;
        const ctx = thumb.getContext('2d');
        if (!ctx) return null;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(cv, 0, 0, 160, 90);
        return thumb.toDataURL('image/jpeg', 0.72);
    } catch (e) {
        console.warn('Failed to capture world thumbnail:', e);
        return null;
    }
}

/**
 * Simple deterministic pseudo-random generator based on a seed number.
 */
function createSeededRng(initialSeed) {
    let s = (Math.abs(Math.floor(initialSeed || 12345)) % 2147483647) || 1;
    return function() {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

/**
 * Generate a procedural pixel-art 16:9 thumbnail for a world.
 * @param {Object} options
 * @param {number|string} [options.seed]
 * @param {string} [options.biome='plains'] - 'plains', 'forest', 'desert', 'snow', 'mountains', 'flat'
 * @param {string} [options.mode='survival'] - 'survival', 'creative'
 * @param {string} [options.worldSize='small'] - 'small', 'big', 'flat'
 * @param {number} [options.dayCount=1]
 * @param {boolean} [options.includePill=true]
 * @returns {string} dataURL
 */
export function generateProceduralThumbnail({
    seed = 12345,
    biome = 'plains',
    mode = 'survival',
    worldSize = 'small',
    dayCount = 1,
    includePill = true
} = {}) {
    const cacheKey = `${seed}_${biome}_${mode}_${worldSize}_${includePill ? 1 : 0}`;
    if (proceduralCache.has(cacheKey)) {
        return proceduralCache.get(cacheKey);
    }

    const numSeed = typeof seed === 'string' ? seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : (seed || 12345);
    const rng = createSeededRng(numSeed + 42);

    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.imageSmoothingEnabled = false;

    // Pick time of day theme based on seed
    const timeChoice = rng();
    const isSunset = timeChoice > 0.75;
    const isNight = timeChoice < 0.20;

    // 1. SKY BACKGROUND
    if (isNight) {
        // Deep midnight sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, 60);
        skyGrad.addColorStop(0, '#090d16');
        skyGrad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 160, 90);

        // Crescent moon
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(128, 12, 10, 10);
        ctx.fillStyle = '#090d16';
        ctx.fillRect(125, 10, 8, 10);

        // Twinkling stars
        ctx.fillStyle = '#fde047';
        for (let i = 0; i < 18; i++) {
            const sx = Math.floor(rng() * 156) + 2;
            const sy = Math.floor(rng() * 40) + 2;
            ctx.fillRect(sx, sy, 1.5, 1.5);
        }
    } else if (isSunset) {
        // Twilight sunset
        const skyGrad = ctx.createLinearGradient(0, 0, 0, 60);
        skyGrad.addColorStop(0, '#3b0764');
        skyGrad.addColorStop(0.5, '#9d174d');
        skyGrad.addColorStop(1, '#ea580c');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 160, 90);

        // Setting sun
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(115, 34, 14, 14);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(118, 37, 8, 8);
    } else {
        // Daytime blue sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, 60);
        skyGrad.addColorStop(0, '#0284c7');
        skyGrad.addColorStop(0.7, '#38bdf8');
        skyGrad.addColorStop(1, '#bae6fd');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 160, 90);

        // Golden square Minecraft sun
        ctx.fillStyle = '#facc15';
        ctx.fillRect(120, 10, 16, 16);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(123, 13, 10, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(126, 16, 4, 4);

        // Pixel clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(16, 14, 32, 6);
        ctx.fillRect(24, 10, 20, 4);
        ctx.fillRect(72, 22, 28, 5);
        ctx.fillRect(78, 19, 16, 3);
    }

    // 2. BIOME TERRAIN & HILLS
    const baseGroundY = 56;
    const b = (biome || '').toLowerCase();

    if (b === 'desert') {
        // Distant dunes
        ctx.fillStyle = isNight ? '#78350f' : (isSunset ? '#b45309' : '#d97706');
        ctx.beginPath();
        ctx.moveTo(0, baseGroundY - 4);
        for (let x = 0; x <= 160; x += 10) {
            const dy = Math.sin((x + numSeed) * 0.04) * 8;
            ctx.lineTo(x, baseGroundY - 6 + dy);
        }
        ctx.lineTo(160, 90); ctx.lineTo(0, 90); ctx.fill();

        // Foreground dunes
        ctx.fillStyle = isNight ? '#92400e' : (isSunset ? '#d97706' : '#f59e0b');
        ctx.beginPath();
        ctx.moveTo(0, baseGroundY + 4);
        for (let x = 0; x <= 160; x += 10) {
            const dy = Math.cos((x + numSeed * 2) * 0.05) * 6;
            ctx.lineTo(x, baseGroundY + dy);
        }
        ctx.lineTo(160, 90); ctx.lineTo(0, 90); ctx.fill();

        // Cacti
        ctx.fillStyle = '#15803d';
        ctx.fillRect(36, baseGroundY - 14, 4, 16);
        ctx.fillRect(32, baseGroundY - 10, 4, 3);
        ctx.fillRect(32, baseGroundY - 13, 3, 4);
        ctx.fillRect(40, baseGroundY - 8, 4, 3);
        ctx.fillRect(41, baseGroundY - 11, 3, 4);

        ctx.fillRect(100, baseGroundY - 10, 3, 12);
        ctx.fillRect(98, baseGroundY - 7, 2, 2);
    } else if (b === 'snow' || b === 'mountains') {
        // Jagged mountain peaks with snow caps
        ctx.fillStyle = isNight ? '#1e293b' : '#475569';
        ctx.beginPath();
        ctx.moveTo(0, baseGroundY);
        ctx.lineTo(30, 28);
        ctx.lineTo(65, baseGroundY + 2);
        ctx.lineTo(105, 20);
        ctx.lineTo(140, baseGroundY - 2);
        ctx.lineTo(160, baseGroundY + 6);
        ctx.lineTo(160, 90); ctx.lineTo(0, 90); ctx.fill();

        // Snow Caps
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath(); ctx.moveTo(22, 38); ctx.lineTo(30, 28); ctx.lineTo(38, 38); ctx.fill();
        ctx.beginPath(); ctx.moveTo(94, 32); ctx.lineTo(105, 20); ctx.lineTo(116, 32); ctx.fill();

        // Snowy Ground
        ctx.fillStyle = isNight ? '#cbd5e1' : '#f1f5f9';
        ctx.fillRect(0, baseGroundY + 6, 160, 90);

        // Pine Trees
        ctx.fillStyle = '#334155';
        ctx.fillRect(52, baseGroundY + 2, 2, 8);
        ctx.fillStyle = '#1e3a5f';
        ctx.beginPath(); ctx.moveTo(47, baseGroundY + 2); ctx.lineTo(53, baseGroundY - 8); ctx.lineTo(59, baseGroundY + 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.moveTo(50, baseGroundY - 2); ctx.lineTo(53, baseGroundY - 8); ctx.lineTo(56, baseGroundY - 2); ctx.fill();
    } else {
        // Plains & Forest: Undulating Green Hills
        // Far hills
        ctx.fillStyle = isNight ? '#064e3b' : (isSunset ? '#15803d' : '#16a34a');
        ctx.beginPath();
        ctx.moveTo(0, baseGroundY - 6);
        for (let x = 0; x <= 160; x += 12) {
            const dy = Math.sin((x + numSeed) * 0.035) * 8;
            ctx.lineTo(x, baseGroundY - 8 + dy);
        }
        ctx.lineTo(160, 90); ctx.lineTo(0, 90); ctx.fill();

        // Near grassy hills
        ctx.fillStyle = isNight ? '#0f766e' : (isSunset ? '#16a34a' : '#22c55e');
        ctx.beginPath();
        ctx.moveTo(0, baseGroundY + 2);
        for (let x = 0; x <= 160; x += 10) {
            const dy = Math.cos((x + numSeed * 1.5) * 0.04) * 6;
            ctx.lineTo(x, baseGroundY + dy);
        }
        ctx.lineTo(160, 90); ctx.lineTo(0, 90); ctx.fill();

        // Earth underneath
        ctx.fillStyle = '#78350f';
        ctx.fillRect(0, baseGroundY + 12, 160, 90);

        // Oak Trees
        const drawOakTree = (tx, ty) => {
            ctx.fillStyle = '#451a03'; // Trunk
            ctx.fillRect(tx, ty, 3, 10);
            ctx.fillStyle = '#14532d'; // Foliage shadow
            ctx.fillRect(tx - 6, ty - 8, 15, 8);
            ctx.fillStyle = '#16a34a'; // Foliage main
            ctx.fillRect(tx - 5, ty - 12, 13, 7);
            ctx.fillStyle = '#4ade80'; // Foliage highlight
            ctx.fillRect(tx - 3, ty - 11, 4, 3);
        };
        drawOakTree(28, baseGroundY - 2);
        drawOakTree(88, baseGroundY - 4);
        drawOakTree(132, baseGroundY);

        // Little flowers
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(52, baseGroundY + 5, 2, 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(72, baseGroundY + 7, 2, 2);
        ctx.fillRect(115, baseGroundY + 6, 2, 2);
    }

    // 3. CUTE DETAILS: Wooden Shelter or Crafting Bench
    ctx.fillStyle = '#92400e'; // Wooden cabin roof
    ctx.fillRect(60, baseGroundY - 1, 14, 8);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(62, baseGroundY + 1, 10, 6);
    ctx.fillStyle = '#fde047'; // Warm lit window
    ctx.fillRect(66, baseGroundY + 2, 3, 3);

    // 4. BOTTOM PILL: MODE & DIMENSIONS (Optional)
    if (includePill) {
        const isCreative = (mode || '').toLowerCase() === 'creative';
        const modeBg = isCreative ? 'rgba(59, 130, 246, 0.85)' : 'rgba(22, 163, 74, 0.85)';
        const modeText = isCreative ? 'CREATIVE' : 'SURVIVAL';

        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 72, 160, 18);

        ctx.fillStyle = modeBg;
        ctx.fillRect(6, 75, modeText.length * 6 + 8, 12);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(modeText, 10, 84);

        const sizeLabel = worldSize === 'big' ? '2048x512' : (worldSize === 'flat' ? 'FLAT' : '1024x320');
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '8px monospace';
        ctx.fillText(sizeLabel, 110, 84);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    proceduralCache.set(cacheKey, dataUrl);
    return dataUrl;
}

if (typeof window !== 'undefined') {
    window.WorldThumbnails = {
        captureWorldThumbnail,
        generateProceduralThumbnail
    };
}

