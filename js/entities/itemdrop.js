// =============================================================================
// WEBCRAFT 2D - ITEM DROP ENTITY (js/entities/itemdrop.js)
// Ground item drops, water flotation, lava incineration & player pickup
// =============================================================================

import {
    IDS, TILE_SIZE, GRAVITY
} from '../core/constants.js';

import {
    player, frameCount, particles, droppedItems, setEngineDroppedItems,
    isMultiplayer, isMultiplayerAuthority
} from '../core/state.js';

import {
    getFluid, getFluidFlowVector
} from '../world/fluids.js';

import {
    PhysicsEntity
} from './physicsentity.js';

function getPlaySoundFn() {
    if (typeof window !== 'undefined' && typeof window.playSound === 'function') return window.playSound;
    return null;
}

function getParticleClass() {
    if (typeof window !== 'undefined' && window.Particle) return window.Particle;
    return null;
}

function getTextures() {
    if (typeof window !== 'undefined' && window.textures) return window.textures;
    return {};
}

export class ItemDrop extends PhysicsEntity {
    constructor(id, x, y, count = 1, dropId = null) {
        super(x, y, 14, 14);
        this.itemId = id;
        this.count = count;
        this.dropId = dropId || `drop_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -3;
        this.isGrounded = false;
        this.life = 6000; // 5-minute lifespan
        this.alive = true;
    }

    update() {
        if (!this.alive) return;
        const itemGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
        const itemGy = Math.floor((this.y + this.height / 2) / TILE_SIZE);
        const fl = getFluid(itemGx, itemGy);

        if (fl && fl.type === IDS.LAVA) {
            const PClass = getParticleClass();
            if (PClass && Array.isArray(particles)) {
                for (let i = 0; i < 5; i++) {
                    let p = new PClass(this.x + this.width / 2, this.y + this.height / 2, i % 2 === 0 ? '#ff4500' : '#333333');
                    p.vy = -1.5 - Math.random() * 1.5;
                    p.vx = (Math.random() - 0.5) * 2;
                    p.life = 20;
                    particles.push(p);
                }
            }
            const curPlayer = (typeof player !== 'undefined' && player) ? player : (typeof window !== 'undefined' ? window.player : null);
            const pDist = curPlayer ? Math.hypot(curPlayer.x - this.x, curPlayer.y - this.y) : 999;
            const snd = getPlaySoundFn();
            if (pDist < 16 * TILE_SIZE && snd) snd('fizz');
            this.alive = false;
            return;
        }

        if (fl && fl.type === IDS.WATER) {
            this.fallStartY = this.y;
            this.vx *= 0.86;
            this.vy *= 0.84;
            this.vy -= GRAVITY * 1.35;
            if (this.vy < -2.0) this.vy = -2.0;

            const flow = getFluidFlowVector(itemGx, itemGy);
            this.vx += flow.vx * 1.2;

            const fluidAbove = getFluid(itemGx, itemGy - 1);
            if (!fluidAbove || fluidAbove.type !== IDS.WATER) {
                const surfaceY = itemGy * TILE_SIZE;
                if (this.y < surfaceY + 2) {
                    this.y = surfaceY + 2 + Math.sin(frameCount * 0.08 + this.x) * 1.5;
                    if (this.vy < 0) this.vy = 0;
                }
            }
        }

        this.applyPhysics();
        if (this.isGrounded) this.vx *= 0.8;
        this.life--;
        if (this.life <= 0) this.alive = false;
    }

    draw(ctx, camX, camY) {
        const texMap = getTextures();
        let texture = texMap[this.itemId];
        if (!texture) return;
        let drawX = this.x - camX;
        let drawY = this.y - camY;
        ctx.save();
        ctx.translate(drawX + this.width / 2, drawY + this.height / 2);
        ctx.rotate(Math.sin(frameCount * 0.08 + this.x) * 0.08);
        ctx.drawImage(texture, -10, -10, 20, 20);
        ctx.restore();
    }
}

export function spawnDroppedItem(itemId, x, y, count = 1) {
    let dropId = `drop_${(typeof window !== 'undefined' && window.user?.uid) || 'local'}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const drop = new ItemDrop(itemId, x, y, count, dropId);
    if (Array.isArray(droppedItems)) {
        droppedItems.push(drop);
    }
    if (typeof window !== 'undefined') {
        window.droppedItems = droppedItems;
    }
    return drop;
}

export function dropItemForWorld(itemId, x, y, count = 1) {
    return spawnDroppedItem(itemId, x, y, count);
}

export function processDroppedItems() {
    if (!Array.isArray(droppedItems)) return;
    for (let i = droppedItems.length - 1; i >= 0; i--) {
        const drop = droppedItems[i];
        if (!drop || !drop.alive) {
            droppedItems.splice(i, 1);
            continue;
        }
        drop.update();
        if (!drop.alive) {
            droppedItems.splice(i, 1);
        }
    }
    if (droppedItems.length > 120) {
        droppedItems.splice(0, droppedItems.length - 120);
    }
    const curPlayer = (typeof player !== 'undefined' && player) ? player : (typeof window !== 'undefined' ? window.player : null);
    if (!curPlayer) return;
    let pickup = droppedItems.find(drop => Math.hypot(curPlayer.x + curPlayer.width / 2 - (drop.x + drop.width / 2), curPlayer.y + curPlayer.height / 2 - (drop.y + drop.height / 2)) < TILE_SIZE * 0.9 && drop.count > 0);
    if (!pickup) return;

    if (!isMultiplayer || isMultiplayerAuthority()) {
        const giveFn = (typeof window !== 'undefined' && typeof window.giveItem === 'function') ? window.giveItem : null;
        if (giveFn && giveFn(pickup.itemId, pickup.count)) {
            setEngineDroppedItems(droppedItems.filter(drop => drop !== pickup));
        }
    } else if (typeof window !== 'undefined' && window.pendingPickupRequest !== pickup.dropId) {
        window.pendingPickupRequest = pickup.dropId;
        if (typeof window.broadcastDataPacket === 'function') {
            window.broadcastDataPacket({
                type: 'pickup_request',
                dropId: pickup.dropId,
                uid: window.user?.uid || window.fbAuth?.currentUser?.uid
            });
        }
    }
}

// Window self-registration for backward compatibility
try {
    if (typeof window !== 'undefined') {
        window.ItemDrop = ItemDrop;
        window.spawnDroppedItem = spawnDroppedItem;
        window.dropItemForWorld = dropItemForWorld;
        window.processDroppedItems = processDroppedItems;
    }
} catch (e) {}

