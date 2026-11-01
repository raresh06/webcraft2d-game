// =============================================================================
// WEBCRAFT 2D - FALLING BLOCK PHYSICS (js/entities/fallingblock.js)
// Sand gravity simulation, cascade collapse, fragile object crushing & landing
// =============================================================================

import {
    IDS, TILE_SIZE
} from '../core/constants.js';

import {
    world, player, fallingBlocks, particles, WORLD_WIDTH, WORLD_HEIGHT
} from '../core/state.js';

import {
    isSolidWorldBlock
} from '../world/blockhelper.js';

import {
    removeFluid, wakeFluidsAround
} from '../world/fluids.js';

import {
    spawnDroppedItem
} from './itemdrop.js';

function getParticleClass() {
    if (typeof window !== 'undefined' && window.Particle) return window.Particle;
    return null;
}

function getPlaySoundFn() {
    if (typeof window !== 'undefined' && typeof window.playSound === 'function') return window.playSound;
    return null;
}

function getTextures() {
    if (typeof window !== 'undefined' && window.textures) return window.textures;
    return {};
}

function getSyncBlockFn() {
    if (typeof window !== 'undefined' && typeof window.syncBlock === 'function') return window.syncBlock;
    return null;
}

export class FallingBlock {
    constructor(gx, gy, blockId = IDS.SAND) {
        this.gx = gx;
        this.gy = gy;
        this.x = gx * TILE_SIZE;
        this.y = gy * TILE_SIZE;
        this.blockId = blockId;
        this.vy = 0;
        this.alive = true;
        this.age = 0;
        this.hitPlayer = false;
    }

    update() {
        if (!this.alive) return;
        this.age++;

        this.vy = Math.min(16, this.vy + 0.55);
        this.y += this.vy;

        const curPlayer = (typeof player !== 'undefined' && player) ? player : (typeof window !== 'undefined' ? window.player : null);
        if (this.vy > 1 && !this.hitPlayer && curPlayer) {
            const px = curPlayer.x;
            const py = curPlayer.y;
            const pw = curPlayer.width;
            const ph = curPlayer.height;
            const hitX = (this.x < px + pw) && (this.x + TILE_SIZE > px);
            const hitY = (this.y + TILE_SIZE >= py) && (this.y <= py + ph * 0.75);
            if (hitX && hitY && !curPlayer.isDead) {
                curPlayer.takeDamage(1);
                this.hitPlayer = true;
                const PClass = getParticleClass();
                if (PClass && Array.isArray(particles)) {
                    for (let i = 0; i < 4; i++) {
                        particles.push(new PClass(this.x + Math.random() * TILE_SIZE, this.y + TILE_SIZE, '#e6cc80'));
                    }
                }
            }
        }

        const targetGy = Math.floor((this.y + TILE_SIZE) / TILE_SIZE);
        const currentTileX = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.round(this.x / TILE_SIZE)));
        const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
        if (!curWorld) return;

        if (targetGy >= WORLD_HEIGHT - 1) {
            this._land(currentTileX, WORLD_HEIGHT - 1);
            return;
        }

        const blockBelow = curWorld[currentTileX]?.[targetGy];
        if (isSolidWorldBlock(currentTileX, targetGy, blockBelow)) {
            const landY = targetGy - 1;
            this._land(currentTileX, landY);
            return;
        }

        if (blockBelow !== undefined && blockBelow !== IDS.AIR && [IDS.TORCH, IDS.FLOWER_RED, IDS.FLOWER_YELLOW, IDS.SHORT_GRASS, IDS.TALL_GRASS, IDS.SAPLING].includes(blockBelow)) {
            if (blockBelow === IDS.TORCH) spawnDroppedItem(IDS.TORCH, currentTileX * TILE_SIZE + TILE_SIZE / 2, targetGy * TILE_SIZE + TILE_SIZE / 2, 1);
            else if (blockBelow === IDS.SAPLING) spawnDroppedItem(IDS.SAPLING, currentTileX * TILE_SIZE + TILE_SIZE / 2, targetGy * TILE_SIZE + TILE_SIZE / 2, 1);
            else if (blockBelow === IDS.FLOWER_RED || blockBelow === IDS.FLOWER_YELLOW) spawnDroppedItem(blockBelow, currentTileX * TILE_SIZE + TILE_SIZE / 2, targetGy * TILE_SIZE + TILE_SIZE / 2, 1);
            else if (blockBelow === IDS.SHORT_GRASS || blockBelow === IDS.TALL_GRASS) {
                if (Math.random() < 0.2) spawnDroppedItem(IDS.SEEDS, currentTileX * TILE_SIZE + TILE_SIZE / 2, targetGy * TILE_SIZE + TILE_SIZE / 2, 1);
            }
            curWorld[currentTileX][targetGy] = IDS.AIR;
            const syncFn = getSyncBlockFn();
            if (syncFn) syncFn(currentTileX, targetGy, IDS.AIR);
        }
    }

    _land(gx, gy) {
        this.alive = false;
        if (gy < 0 || gy >= WORLD_HEIGHT || gx < 0 || gx >= WORLD_WIDTH) return;
        const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
        if (!curWorld) return;

        if (curWorld[gx][gy] === IDS.AIR || !isSolidWorldBlock(gx, gy, curWorld[gx][gy])) {
            removeFluid(gx, gy);
            curWorld[gx][gy] = this.blockId;
            const syncFn = getSyncBlockFn();
            if (syncFn) syncFn(gx, gy, this.blockId);
            wakeFluidsAround(gx, gy);
            const snd = getPlaySoundFn();
            if (snd) snd('place');

            const PClass = getParticleClass();
            if (PClass && Array.isArray(particles)) {
                for (let i = 0; i < 6; i++) {
                    const p = new PClass(gx * TILE_SIZE + Math.random() * TILE_SIZE, (gy + 1) * TILE_SIZE - 2, '#e6cc80');
                    p.vx = (Math.random() - 0.5) * 3;
                    p.vy = -Math.random() * 2;
                    particles.push(p);
                }
            }
        } else {
            spawnDroppedItem(this.blockId, gx * TILE_SIZE + TILE_SIZE / 2, gy * TILE_SIZE + TILE_SIZE / 2, 1);
        }

        checkSandFallAbove(gx, gy);
    }

    draw(ctx, camX, camY) {
        if (!this.alive) return;
        const drawX = Math.floor(this.x - camX);
        const drawY = Math.floor(this.y - camY);
        const canvasObj = (typeof window !== 'undefined' && window.canvas) ? window.canvas : null;
        const cW = canvasObj?.width || 1280;
        const cH = canvasObj?.height || 720;
        if (drawX > cW || drawX + TILE_SIZE < 0 || drawY > cH || drawY + TILE_SIZE < 0) return;

        const texMap = getTextures();
        if (texMap[this.blockId]) {
            ctx.drawImage(texMap[this.blockId], drawX, drawY, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = '#e6cc80';
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
        }
    }
}

export function triggerSandFall(x, y) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT - 1) return false;
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    if (!curWorld || curWorld[x]?.[y] !== IDS.SAND) return false;
    const curFalling = (typeof fallingBlocks !== 'undefined' && fallingBlocks) ? fallingBlocks : (typeof window !== 'undefined' ? window.fallingBlocks : []);

    if (curFalling.some(fb => fb.alive && fb.gx === x && Math.abs(fb.y - y * TILE_SIZE) < TILE_SIZE * 0.5)) return false;

    const belowBlock = curWorld[x]?.[y + 1];
    if (!isSolidWorldBlock(x, y + 1, belowBlock)) {
        curWorld[x][y] = IDS.AIR;
        const syncFn = getSyncBlockFn();
        if (syncFn) syncFn(x, y, IDS.AIR);
        wakeFluidsAround(x, y);
        curFalling.push(new FallingBlock(x, y, IDS.SAND));

        if (y > 0 && curWorld[x]?.[y - 1] === IDS.SAND) {
            triggerSandFall(x, y - 1);
        }
        return true;
    }
    return false;
}

export function checkSandFallAbove(x, y) {
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    if (!curWorld) return;
    for (let checkY = y - 1; checkY >= 0; checkY--) {
        if (curWorld[x]?.[checkY] === IDS.SAND) {
            triggerSandFall(x, checkY);
        } else {
            break;
        }
    }
}

// Window self-registration for backward compatibility
try {
    if (typeof window !== 'undefined') {
        window.FallingBlock = FallingBlock;
        window.triggerSandFall = triggerSandFall;
        window.checkSandFallAbove = checkSandFallAbove;
    }
} catch (e) {}

