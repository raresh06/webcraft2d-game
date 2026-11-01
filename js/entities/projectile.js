// =============================================================================
// WEBCRAFT 2D - PROJECTILES (js/entities/projectile.js)
// Snowball physics, trajectory trails, and Gloom Tether projectile mechanics
// =============================================================================

import {
    IDS, TILE_SIZE, HARDNESS
} from '../core/constants.js';

import {
    world, player, entities, remotePlayers, particles,
    WORLD_WIDTH, WORLD_HEIGHT, isMultiplayer, isMultiplayerAuthority, frameCount
} from '../core/state.js';

import {
    isSolidWorldBlock
} from '../world/blockhelper.js';

function getParticleClass() {
    if (typeof window !== 'undefined' && window.Particle) return window.Particle;
    return null;
}

function getPlaySoundFn() {
    if (typeof window !== 'undefined' && typeof window.playSound === 'function') return window.playSound;
    return null;
}

export class SnowballProjectile {
    constructor(x, y, vx, vy, ownerId, id) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.ownerId = ownerId;
        this.id = id;
        this.size = 10;
        this.alive = true;
        this.age = 0;
        this.maxAge = 180;
        this.trail = [];
    }

    update() {
        if (!this.alive) return;
        this.age++;
        if (this.age > this.maxAge) { this.alive = false; return; }

        this.trail.push({ x: this.x, y: this.y, age: 0 });
        if (this.trail.length > 6) this.trail.shift();
        for (let t of this.trail) t.age++;

        this.vy += 0.35;
        this.vx *= 0.994;
        this.vy *= 0.994;

        const PClass = getParticleClass();
        if (this.age % 2 === 0 && PClass && Array.isArray(particles)) {
            const trailParticle = new PClass(this.x + (Math.random() - 0.5) * 4, this.y + (Math.random() - 0.5) * 4, '#e8f4fc');
            trailParticle.vx = -this.vx * 0.08 + (Math.random() - 0.5) * 0.8;
            trailParticle.vy = -this.vy * 0.08 + (Math.random() - 0.5) * 0.8;
            trailParticle.life = 10;
            particles.push(trailParticle);
        }

        const steps = Math.ceil(Math.max(Math.abs(this.vx), Math.abs(this.vy)) / (TILE_SIZE / 2)) + 1;
        const sx = this.vx / steps;
        const sy = this.vy / steps;
        const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
        const curPlayer = (typeof player !== 'undefined' && player) ? player : (typeof window !== 'undefined' ? window.player : null);
        const curEntities = (typeof entities !== 'undefined' && entities) ? entities : (typeof window !== 'undefined' ? window.entities : []);
        const curRemotes = (typeof remotePlayers !== 'undefined' && remotePlayers) ? remotePlayers : (typeof window !== 'undefined' ? window.remotePlayers : {});

        for (let s = 0; s < steps; s++) {
            this.x += sx;
            this.y += sy;

            if (this.x < 0 || this.x > WORLD_WIDTH * TILE_SIZE || this.y < 0 || this.y > WORLD_HEIGHT * TILE_SIZE) {
                this.alive = false;
                return;
            }

            const gx = Math.floor(this.x / TILE_SIZE);
            const gy = Math.floor(this.y / TILE_SIZE);
            if (curWorld && gx >= 0 && gx < WORLD_WIDTH && gy >= 0 && gy < WORLD_HEIGHT) {
                const block = curWorld[gx]?.[gy];
                if (block !== undefined && block !== IDS.AIR && HARDNESS[block] !== undefined) {
                    this._impact();
                    return;
                }
            }

            if (!isMultiplayer || isMultiplayerAuthority()) {
                for (let i = 0; i < curEntities.length; i++) {
                    const e = curEntities[i];
                    if (e.health <= 0) continue;
                    if (this.x >= e.x && this.x <= e.x + e.width && this.y >= e.y && this.y <= e.y + e.height) {
                        if (typeof e.takeDamage === 'function') {
                            e.takeDamage(1, this.vx > 0 ? 1 : -1);
                        }
                        this._impact();
                        return;
                    }
                }
            }

            if (!isMultiplayer || isMultiplayerAuthority()) {
                const isLocalOwner = (this.ownerId === (window.user?.uid || 'local'));
                if (!isLocalOwner || this.age > 10) {
                    if (!isLocalOwner && curPlayer) {
                        if (this.x >= curPlayer.x && this.x <= curPlayer.x + curPlayer.width && this.y >= curPlayer.y && this.y <= curPlayer.y + curPlayer.height && !curPlayer.isDead) {
                            curPlayer.takeDamage(1);
                            this._impact();
                            return;
                        }
                    }
                    Object.entries(curRemotes).forEach(([rpId, rp]) => {
                        if (!this.alive || rp.isDead) return;
                        const rpX = rp.renderX ?? rp.x;
                        const rpY = rp.renderY ?? rp.y;
                        if (rpX == null) return;
                        const rpW = TILE_SIZE * 0.75;
                        const rpH = TILE_SIZE * 1.8;
                        if (this.x >= rpX && this.x <= rpX + rpW && this.y >= rpY && this.y <= rpY + rpH) {
                            if (isMultiplayer && typeof window.broadcastDataPacket === 'function') {
                                const evtId = this.id + '_dmg_' + rpId;
                                window.broadcastDataPacket({
                                    type: 'damage',
                                    targetUid: rpId,
                                    amount: 1,
                                    isPoison: false,
                                    id: evtId
                                });
                            }
                            this._impact();
                        }
                    });
                    if (!this.alive) return;
                }
            }
        }
    }

    _impact() {
        this.alive = false;
        const PClass = getParticleClass();
        if (PClass && Array.isArray(particles)) {
            for (let i = 0; i < 10; i++) {
                const p = new PClass(this.x, this.y, '#e8f4fc');
                p.vx = (Math.random() - 0.5) * 5;
                p.vy = -1 - Math.random() * 3;
                p.life = 12 + Math.floor(Math.random() * 8);
                particles.push(p);
            }
            for (let i = 0; i < 4; i++) {
                const p = new PClass(this.x, this.y, '#b0d4f1');
                p.vx = (Math.random() - 0.5) * 3;
                p.vy = -0.5 - Math.random() * 2;
                particles.push(p);
            }
        }
    }

    draw(ctx, camX, camY) {
        if (!this.alive) return;
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const tx = Math.round(t.x - camX);
            const ty = Math.round(t.y - camY);
            const ratio = (i + 1) / (this.trail.length + 1);
            const trailSize = Math.max(2, Math.round(5 * ratio));
            ctx.fillStyle = `rgba(230, 245, 255, ${0.15 + 0.35 * ratio})`;
            ctx.fillRect(tx - trailSize / 2, ty - trailSize / 2, trailSize, trailSize);
        }

        const sx = Math.round(this.x - camX);
        const sy = Math.round(this.y - camY);
        const r = 5;

        ctx.fillStyle = '#688ca8';
        ctx.fillRect(sx - r + 1, sy - r, 8, 10);
        ctx.fillRect(sx - r, sy - r + 1, 10, 8);

        ctx.fillStyle = '#a6cbe8';
        ctx.fillRect(sx - r + 1, sy - r + 1, 8, 8);

        ctx.fillStyle = '#ebf4fc';
        ctx.fillRect(sx - r + 1, sy - r + 1, 7, 7);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx - r + 2, sy - r + 1, 4, 3);
        ctx.fillRect(sx - r + 1, sy - r + 2, 3, 4);

        ctx.fillStyle = '#c5e0f7';
        ctx.fillRect(sx + 1, sy + 1, 2, 2);
    }
}

export class GloomTetherProjectile {
    constructor(x, y, vx, vy, sourceEntity = null) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 8;
        this.height = 8;
        this.alive = true;
        this.age = 0;
        this.maxAge = 120;
        this.source = sourceEntity;
    }

    update() {
        if (!this.alive) return;
        this.age++;
        if (this.age > this.maxAge) {
            this.alive = false;
            return;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.08;

        const PClass = getParticleClass();
        if (frameCount % 2 === 0 && PClass && Array.isArray(particles)) {
            particles.push(new PClass(this.x, this.y, Math.random() < 0.5 ? '#a855f7' : '#38bdf8'));
        }

        if (this.x < 0 || this.x > WORLD_WIDTH * TILE_SIZE || this.y < 0 || this.y > WORLD_HEIGHT * TILE_SIZE) {
            this.alive = false;
            return;
        }

        const gx = Math.floor(this.x / TILE_SIZE);
        const gy = Math.floor(this.y / TILE_SIZE);
        const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
        if (curWorld && gx >= 0 && gx < WORLD_WIDTH && gy >= 0 && gy < WORLD_HEIGHT && curWorld[gx]?.[gy] !== undefined && isSolidWorldBlock(gx, gy, curWorld[gx][gy])) {
            this.burst();
            return;
        }

        const curPlayer = (typeof player !== 'undefined' && player) ? player : (typeof window !== 'undefined' ? window.player : null);
        const sndFn = getPlaySoundFn();
        if (curPlayer && !curPlayer.isDead) {
            if (this.x >= curPlayer.x && this.x <= curPlayer.x + curPlayer.width &&
                this.y >= curPlayer.y && this.y <= curPlayer.y + curPlayer.height) {
                curPlayer.takeDamage(1);
                curPlayer.gloomTetherTimer = 240;
                if (sndFn) sndFn('hurt');
                this.burst();
                return;
            }
        }

        const curRemotes = (typeof remotePlayers !== 'undefined' && remotePlayers) ? remotePlayers : (typeof window !== 'undefined' ? window.remotePlayers : null);
        if (isMultiplayer && curRemotes) {
            for (let rId in curRemotes) {
                const rp = curRemotes[rId];
                if (!rp || rp.isDead) continue;
                if (this.x >= rp.x && this.x <= rp.x + 24 && this.y >= rp.y && this.y <= rp.y + 48) {
                    if (typeof window.damageRemotePlayer === 'function') {
                        window.damageRemotePlayer(rId, 1, true);
                    }
                    this.burst();
                    return;
                }
            }
        }
    }

    burst() {
        this.alive = false;
        const PClass = getParticleClass();
        if (PClass && Array.isArray(particles)) {
            for (let i = 0; i < 8; i++) {
                particles.push(new PClass(this.x + (Math.random() - 0.5) * 6, this.y + (Math.random() - 0.5) * 6, '#c084fc'));
            }
        }
    }

    draw(ctx, camX, camY) {
        if (!this.alive) return;
        const drawX = Math.round(this.x - camX);
        const drawY = Math.round(this.y - camY);
        ctx.save();
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(drawX - 3, drawY - 3, 6, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(drawX - 1, drawY - 1, 2, 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(drawX, drawY, 2, 2);
        ctx.restore();
    }
}

// Window self-registration for backward compatibility
try {
    if (typeof window !== 'undefined') {
        window.SnowballProjectile = SnowballProjectile;
        window.GloomTetherProjectile = GloomTetherProjectile;
    }
} catch (e) {}

