// =============================================================================
// WEBCRAFT 2D - HOSTILE MOBS (js/entities/mobs.js)
// Hostile mob classes: Zombie, Creeper, Scorpion, Gloomstalker, and targeting AI
// =============================================================================

import {
    IDS, TILE_SIZE, MOVE_SPEED, GRAVITY, TERMINAL_VELOCITY, JUMP_FORCE
} from '../core/constants.js';

import {
    world, player, entities, remotePlayers, particles, floatingTexts, frameCount, timeOfDay,
    WORLD_WIDTH, WORLD_HEIGHT, isMultiplayer, isMultiplayerAuthority, inventory, selectedHotbarIndex
} from '../core/state.js';

import {
    advancedGraphics
} from '../core/config.js';

import {
    isSolid, isSolidWorldBlock, getWorldSurfaceY, breakDoorAt, isClimbableBlock, isDoorBlock, isOpenDoorBlock, getDoorBaseY
} from '../world/blockhelper.js';

import {
    getFluid, removeFluid, wakeFluidsAround
} from '../world/fluids.js';

import {
    scheduleDirtToGrass, scheduleSnowRegrowth
} from '../world/lifecycle.js';

import {
    isNearTorch, hasDirectSkyAccess
} from '../world/spawner.js';

import {
    } from '../world/worldgen.js';

import {
    PhysicsEntity
} from './physicsentity.js';

import {
    spawnDroppedItem
} from './itemdrop.js';

import {
    GloomTetherProjectile
} from './projectile.js';

// Safe proxy for Particle
class ParticleProxy {
    constructor(...args) {
        const RealClass = (typeof window !== 'undefined' && window.Particle) ? window.Particle : null;
        if (RealClass) return new RealClass(...args);
        this.x = args[0] || 0; this.y = args[1] || 0; this.color = args[2] || '#fff';
        this.vx = (Math.random() - 0.5) * 2; this.vy = (Math.random() - 0.5) * 2;
        this.life = 30; this.maxLife = 30;
    }
    update() { this.x += this.vx; this.y += this.vy; this.life--; }
    draw() {}
}
const Particle = ParticleProxy;

// Safe proxy for FloatingText
class FloatingTextProxy {
    constructor(...args) {
        const RealClass = (typeof window !== 'undefined' && window.FloatingText) ? window.FloatingText : null;
        if (RealClass) return new RealClass(...args);
        this.x = args[0] || 0; this.y = args[1] || 0; this.text = args[2] || ''; this.color = args[3] || '#ff0';
        this.life = 40;
    }
    update() { this.y -= 0.5; this.life--; }
    draw() {}
}
const FloatingText = FloatingTextProxy;

function playSound(name, opts) {
    if (typeof window !== 'undefined' && typeof window.playSound === 'function') {
        return window.playSound(name, opts);
    }
}

function dropItemForWorld(itemId, x, y, count = 1) {
    if (typeof spawnDroppedItem === 'function') {
        return spawnDroppedItem(itemId, x, y, count);
    } else if (typeof window !== 'undefined' && window.spawnDroppedItem) {
        return window.spawnDroppedItem(itemId, x, y, count);
    }
}

export function damageRemotePlayer(id, amt, isPoison) {
    if (typeof window !== 'undefined' && window.network && typeof window.network.damagePlayer === 'function') {
        window.network.damagePlayer(id, amt, isPoison);
    }
}

function syncBlock(gx, gy, blockId) {
    if (typeof window !== 'undefined' && typeof window.syncBlock === 'function') {
        window.syncBlock(gx, gy, blockId);
    }
}

function updateHealthUI() {
    if (typeof window !== 'undefined' && typeof window.updateHealthUI === 'function') {
        window.updateHealthUI();
    }
}

const cachedShadowCanvas = (typeof window !== 'undefined' && window.cachedShadowCanvas)
    ? window.cachedShadowCanvas
    : (() => {
        if (typeof document === 'undefined') return null;
        const c = document.createElement('canvas');
        c.width = 24; c.height = 8;
        const ctx = c.getContext('2d');
        if (ctx) {
            ctx.imageSmoothingEnabled = false;
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 24; x++) {
                    const dx = (x - 11.5) / 11;
                    const dy = (y - 3.5) / 3.5;
                    const distSq = dx * dx + dy * dy;
                    if (distSq <= 0.55) { ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'; ctx.fillRect(x, y, 1, 1); }
                    else if (distSq <= 1.0) { ctx.fillStyle = 'rgba(0, 0, 0, 0.22)'; ctx.fillRect(x, y, 1, 1); }
                }
            }
        }
        return c;
    })();
if (typeof window !== 'undefined' && !window.cachedShadowCanvas && cachedShadowCanvas) {
    window.cachedShadowCanvas = cachedShadowCanvas;
}

    export function getMobTarget(mob) {
        let targets = player.isDead ? [] : [{ x: player.x, y: player.y, width: player.width, height: player.height, isRemote: false }];
        if (isMultiplayer && isMultiplayerAuthority()) {
            Object.entries(remotePlayers).forEach(([id, remotePlayer]) => {
                if (remotePlayer.isDead || remotePlayer.isDisconnected || (remotePlayer.lastSeenLocalTime && Date.now() - remotePlayer.lastSeenLocalTime > 15000)) return;
                targets.push({ ...remotePlayer, id, width: TILE_SIZE * 0.75, height: TILE_SIZE * 1.8, isRemote: true });
            });
        }
        return targets
            .filter(target => Math.abs(target.x - mob.x) < TILE_SIZE * 16)
            .sort((first, second) => Math.abs(first.x - mob.x) - Math.abs(second.x - mob.x))[0] || null;
    }
    export const getZombieTarget = getMobTarget;


    export class Zombie extends PhysicsEntity {
        constructor(x, y) {
            super(x, y, TILE_SIZE * 0.75, TILE_SIZE * 1.8);
            this.health = 15;
            this.maxHealth = 15;
            this.damageCooldown = 0;
            this.baseSpeed = MOVE_SPEED * 0.45;
            this.speed = this.baseSpeed;
            this.damage = 2;
            this.facingRight = true;
            this.walkAnimTime = 0;
            this.onFire = false;

            // Smart & Terrifying AI State
            this.isFrenzied = false;
            this.isLunging = false;
            this.lungeWindup = 0;
            this.lungeCooldown = Math.floor(Math.random() * 30);
            this.doorBangTimer = 0;
            this.doorDamageCount = 0;
            this.groanTimer = Math.floor(Math.random() * 200 + 120);
            this.hasAlertedPack = false;
        }

        triggerAlertOnDamage() {
            this.isFrenzied = true;
            if (Math.random() < 0.6) playSound('zombie_roar');

            const diff = (typeof currentDifficulty !== 'undefined') ? currentDifficulty : 'normal';
            let packRadius = 16;
            if (diff === 'easy') packRadius = 8;
            else if (diff === 'hard' || diff === 'hardcore') packRadius = 24;

            const entList = (typeof entities !== 'undefined' && Array.isArray(entities)) ? entities : [];
            for (const e of entList) {
                if (e instanceof Zombie && e !== this && e.health > 0) {
                    if (Math.hypot(e.x - this.x, e.y - this.y) < packRadius * TILE_SIZE) {
                        e.isFrenzied = true;
                    }
                }
            }
        }

        checkClosedDoorAhead(stepDir) {
            const activeWorld = this.getActiveWorld();
            if (!activeWorld) return null;
            const curWorldW = activeWorld.length;
            const checkX = Math.floor((this.x + this.width / 2 + stepDir * (this.width / 2 + 6)) / TILE_SIZE);
            if (checkX < 0 || checkX >= curWorldW) return null;
            const footY = Math.floor((this.y + this.height - 4) / TILE_SIZE);
            const waistY = Math.floor((this.y + this.height * 0.5) / TILE_SIZE);

            const bFoot = activeWorld[checkX]?.[footY];
            const bWaist = activeWorld[checkX]?.[waistY];

            if (isDoorBlock(bFoot) && !isOpenDoorBlock(bFoot)) return { gx: checkX, gy: footY };
            if (isDoorBlock(bWaist) && !isOpenDoorBlock(bWaist)) return { gx: checkX, gy: waistY };
            return null;
        }

        checkSmartZombieJump(target, stepDir) {
            if (!this.isGrounded || this.vx === 0) return;
            const activeWorld = this.getActiveWorld();
            if (!activeWorld) return;
            const curWorldW = activeWorld.length;
            const checkX = Math.floor((this.x + this.width / 2 + stepDir * (this.width / 2 + 6)) / TILE_SIZE);
            if (checkX < 0 || checkX >= curWorldW) return;

            const footY = Math.floor((this.y + this.height - 4) / TILE_SIZE);
            const headY = Math.floor((this.y + 4) / TILE_SIZE);
            const above1Y = headY - 1;
            const above2Y = headY - 2;

            const bFoot = activeWorld[checkX]?.[footY];
            const bHead = activeWorld[checkX]?.[headY];
            const bAbove1 = (above1Y >= 0) ? activeWorld[checkX]?.[above1Y] : IDS.AIR;
            const bAbove2 = (above2Y >= 0) ? activeWorld[checkX]?.[above2Y] : IDS.AIR;

            // 1-block obstacle: block at foot level, open clearance at head level
            if (isSolidWorldBlock(checkX, footY, bFoot) && !isSolidWorldBlock(checkX, headY, bHead)) {
                this.vy = JUMP_FORCE;
                this.isGrounded = false;
                return;
            }

            // 2-block obstacle / high ledge: both foot and head level solid, but clearance above; vault if target elevated
            if (target && target.y < this.y - TILE_SIZE * 0.8) {
                if (isSolidWorldBlock(checkX, footY, bFoot) && isSolidWorldBlock(checkX, headY, bHead) && !isSolidWorldBlock(checkX, above1Y, bAbove1) && !isSolidWorldBlock(checkX, above2Y, bAbove2)) {
                    this.vy = -6.2; // High vault jump
                    this.vx = stepDir * this.speed * 1.25;
                    this.isGrounded = false;
                    return;
                }
            }
        }

        update() {
            if (this.damageCooldown > 0) this.damageCooldown--;
            if (this.health <= 0) return;

            // Daytime Sunlight Burning: Zombies burn rapidly in daylight when exposed to open sky
            const isDaytime = (timeOfDay < 0.58 || timeOfDay > 0.90);
            if (isDaytime) {
                let headGx = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor((this.x + this.width / 2) / TILE_SIZE)));
                let headGy = Math.max(0, Math.floor((this.y + 4) / TILE_SIZE));
                let footGy = Math.max(0, Math.floor((this.y + this.height - 2) / TILE_SIZE));
                let inWater = (typeof isWater === 'function' && isWater(headGx, footGy));
                if (!inWater && typeof hasDirectSkyAccess === 'function' && hasDirectSkyAccess(headGx, headGy, true)) {
                    this.onFire = true;
                    if (frameCount % 3 === 0) {
                        particles.push(new Particle(this.x + Math.random() * this.width, this.y + Math.random() * this.height * 0.85, Math.random() < 0.55 ? '#ff6600' : '#ffaa00'));
                        particles.push(new Particle(this.x + Math.random() * this.width, this.y + Math.random() * this.height * 0.6, '#ff4400'));
                    }
                    if (frameCount % 6 === 0) {
                        particles.push(new Particle(this.x + this.width / 2 + (Math.random() - 0.5) * this.width, this.y - 4, '#cccccc'));
                    }
                    if (frameCount % 15 === 0) {
                        this.takeDamage(2, 0);
                    }
                } else {
                    this.onFire = false;
                }
            } else {
                this.onFire = false;
            }

            if (this.lungeCooldown > 0) this.lungeCooldown--;

            // Ambient creepy groaning sound
            if (!this.onFire) {
                this.groanTimer--;
                if (this.groanTimer <= 0) {
                    this.groanTimer = Math.floor(Math.random() * 320 + 200);
                    const curP = (typeof player !== 'undefined') ? player : null;
                    if (curP && Math.hypot(curP.x - this.x, curP.y - this.y) < TILE_SIZE * 18) {
                        playSound('zombie_groan');
                    }
                }
            }

            let target = getZombieTarget(this);
            const diff = (typeof currentDifficulty !== 'undefined') ? currentDifficulty : 'normal';

            if (target) {
                let distX = (target.x + target.width / 2) - (this.x + this.width / 2);
                let distY = (target.y + target.height / 2) - (this.y + this.height / 2);
                let absDist = Math.abs(distX);
                let totalDist = Math.hypot(distX, distY);
                let stepDir = distX > 0 ? 1 : -1;

                if (totalDist < TILE_SIZE * 20) {
                    // Check if blocked by a closed wooden door in target direction
                    const doorInfo = this.checkClosedDoorAhead(stepDir);
                    const doorCenterX = doorInfo ? (doorInfo.gx + 0.5) * TILE_SIZE : 0;
                    const targetOnOtherSide = doorInfo && ((this.x < doorCenterX && target.x > doorCenterX) || (this.x > doorCenterX && target.x < doorCenterX));

                    if (doorInfo && targetOnOtherSide) {
                        this.vx = 0;
                        this.doorBangTimer++;
                        if (this.doorBangTimer % 20 === 0) {
                            playSound('door_bang');
                            for (let i = 0; i < 4; i++) {
                                particles.push(new Particle(doorInfo.gx * TILE_SIZE + 6, doorInfo.gy * TILE_SIZE + 10, '#8b5a2b'));
                            }
                            if (diff === 'normal' || diff === 'hard' || diff === 'hardcore') {
                                this.doorDamageCount++;
                                const neededHits = (diff === 'hard' || diff === 'hardcore') ? 22 : 45;
                                if (this.doorDamageCount >= neededHits) {
                                    breakDoorAt(world, doorInfo.gx, doorInfo.gy);
                                    this.doorDamageCount = 0;
                                    this.doorBangTimer = 0;
                                    this.triggerAlertOnDamage();
                                }
                            }
                        }
                        this.applyPhysics();
                        return;
                    } else {
                        this.doorBangTimer = 0;
                    }

                    // Frenzy Trigger: Within 8 blocks or below half health
                    if (absDist < TILE_SIZE * 8 || this.health <= 8) {
                        if (!this.isFrenzied) {
                            this.isFrenzied = true;
                            if (Math.random() < 0.7) playSound('zombie_roar');
                            this.triggerAlertOnDamage();
                        }
                    }

                    // Speed calculation based on Frenzy & Difficulty
                    if (this.isFrenzied) {
                        if (diff === 'hard' || diff === 'hardcore') this.speed = MOVE_SPEED * 0.85;
                        else if (diff === 'normal') this.speed = MOVE_SPEED * 0.72;
                        else this.speed = MOVE_SPEED * 0.55;
                    } else {
                        this.speed = this.baseSpeed;
                    }

                    // Predatory Lunge Initiation
                    if (absDist >= TILE_SIZE * 1.8 && absDist <= TILE_SIZE * 3.6 && Math.abs(distY) < TILE_SIZE * 1.5 && this.isGrounded && this.lungeCooldown <= 0 && this.lungeWindup <= 0) {
                        this.lungeWindup = (diff === 'hard' || diff === 'hardcore') ? 6 : (diff === 'easy' ? 14 : 10);
                        this.lungeCooldown = (diff === 'hard' || diff === 'hardcore') ? 45 : 65;
                        this.vx = 0;
                    }

                    // Lunge Windup execution
                    if (this.lungeWindup > 0) {
                        this.lungeWindup--;
                        this.vx = 0;
                        if (this.lungeWindup === 0) {
                            this.facingRight = (stepDir > 0);
                            const lungeForce = (diff === 'hard' || diff === 'hardcore') ? 5.8 : 4.8;
                            this.vx = stepDir * lungeForce;
                            this.vy = -3.8;
                            this.isGrounded = false;
                            this.isLunging = true;
                            playSound('zombie_roar');
                        }
                    } else if (!this.isLunging) {
                        if (distX > 6) { this.vx = this.speed; this.facingRight = true; }
                        else if (distX < -6) { this.vx = -this.speed; this.facingRight = false; }
                        else { this.vx = 0; }

                        this.checkSmartZombieJump(target, stepDir);
                    }
                } else {
                    this.vx = 0;
                    this.isFrenzied = false;
                }
            } else {
                this.vx = 0;
                this.isFrenzied = false;
            }

            // Ladder / Vine Climbing — mirrors player climb logic
            const zGx  = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const zFootGy = Math.floor((this.y + this.height - 2) / TILE_SIZE);
            const zBodyGy = Math.floor((this.y + this.height / 2) / TILE_SIZE);
            const zHeadGy = Math.floor((this.y + 4) / TILE_SIZE);
            const zOnClimbable = isClimbableBlock(world?.[zGx]?.[zFootGy]) ||
                                  isClimbableBlock(world?.[zGx]?.[zBodyGy]) ||
                                  isClimbableBlock(world?.[zGx]?.[zHeadGy]);
            if (zOnClimbable) {
                if (target) {
                    const targetMidY = target.y + target.height / 2;
                    const selfMidY   = this.y + this.height / 2;
                    if (targetMidY < selfMidY - TILE_SIZE * 0.5) {
                        this.vy = -this.speed * 0.85;
                    } else if (targetMidY > selfMidY + TILE_SIZE * 0.5) {
                        this.vy = this.speed * 0.85;
                    } else {
                        this.vy = 0;
                    }
                } else {
                    this.vy = Math.min(this.vy, 0);
                }
            }

            const prevX = this.x;
            this.applyPhysics();
            const actualMoved = Math.abs(this.x - prevX);

            if (this.isGrounded && this.isLunging) {
                this.isLunging = false;
            }

            if (actualMoved > 0.05 && this.isGrounded) {
                this.walkAnimTime += (this.isFrenzied ? 0.32 : 0.18);
            } else {
                this.walkAnimTime = 0;
            }

            // Attack contact with target
            if (target && this.x < target.x + target.width && this.x + this.width > target.x &&
                this.y < target.y + target.height && this.y + this.height > target.y) {
                const strikeDamage = this.isLunging ? (this.damage + 1) : this.damage;
                if (target.isRemote) {
                    damageRemotePlayer(target.id, strikeDamage);
                } else {
                    player.takeDamage(strikeDamage);
                    if (this.isLunging) {
                        player.vx = (this.facingRight ? 5 : -5);
                        player.vy = -3;
                    }
                }
                if (this.isLunging) this.isLunging = false;
            }
        }

        takeDamage(amt, knockbackDir, knockbackForce = 4.0) {
            const damaged = this.applyMobDamage(amt, knockbackDir, '#3b6a2c', knockbackForce);
            if (damaged && this.health > 0) {
                this.triggerAlertOnDamage();
            }
            return damaged;
        }

        draw(ctx, camX, camY) {
            if (this.health <= 0) return;
            const drawX = this.x - camX; const drawY = this.y - camY;
            const w = this.width; const h = this.height;

            if (advancedGraphics && cachedShadowCanvas) {
                ctx.drawImage(cachedShadowCanvas, drawX + w / 2 - w / 2.2, drawY + h - 6, w * (2 / 2.2), 8);
            }

            ctx.save();
            ctx.translate(drawX, drawY);
            if (!this.facingRight) {
                ctx.translate(w, 0);
                ctx.scale(-1, 1);
            }

            if (this.damageCooldown > 0) {
                // Red hit-flash (takes priority over fire tint)
                ctx.filter = 'sepia(1) saturate(8) hue-rotate(315deg) brightness(0.95)';
                if (Math.floor(frameCount / 4) % 2 === 0) ctx.globalAlpha = 0.75;
            } else if (this.onFire) {
                // Orange fire-burning tint — visually distinct from red hit flash
                ctx.filter = 'sepia(1) saturate(14) hue-rotate(0deg) brightness(1.15)';
                ctx.globalAlpha = 0.88 + Math.sin(frameCount * 0.4) * 0.12;
            }

            const sX = w / 16;
            const sY = h / 32;

            const legSwing = (this.walkAnimTime > 0) ? Math.sin(this.walkAnimTime) * (Math.PI / 4.5) : 0;
            const armBob = Math.sin(frameCount * 0.08) * 0.06;

            // Authentic Zombie Color Palette
            const skinBase = '#4d823b';
            const skinDark = '#345e26';
            const skinLight = '#629e4d';
            const skinRot = '#25441b';
            const hairDark = '#1b3013';

            const shirtBase = '#1f8294';
            const shirtDark = '#145c6b';
            const shirtLight = '#2cb1c9';

            const pantsBase = '#332e6b';
            const pantsDark = '#211d47';
            const pantsLight = '#46408f';
            const shoeDark = '#1a162e';

            // 1. Back Arm (Outstretched forward with aggressive elevation in frenzy/lunge)
            ctx.save();
            ctx.translate(6 * sX + 2 * sX, 8 * sY + 2 * sY);
            const reachAngle = (this.isFrenzied || this.isLunging) ? (-Math.PI / 2 - 0.24) : (-Math.PI / 2 + 0.12);
            ctx.rotate(reachAngle + armBob);
            // Sleeve
            ctx.fillStyle = shirtDark;
            ctx.fillRect(-2 * sX, -2 * sY, 4 * sX, 5 * sY);
            // Rotting Arm & Hand
            ctx.fillStyle = skinDark;
            ctx.fillRect(-2 * sX, 3 * sY, 4 * sX, 9 * sY);
            ctx.fillStyle = skinRot;
            ctx.fillRect(-1 * sX, 6 * sY, 2 * sX, 3 * sY);
            // Fingers
            ctx.fillStyle = skinLight;
            ctx.fillRect(-2 * sX, 10 * sY, 4 * sX, 2 * sY);
            ctx.restore();

            // 2. Back Leg (Swinging backward)
            ctx.save();
            ctx.translate(6 * sX + 2 * sX, 20 * sY + 2 * sY);
            ctx.rotate(-legSwing);
            // Pants thigh & shin
            ctx.fillStyle = pantsDark;
            ctx.fillRect(-2 * sX, -2 * sY, 4 * sX, 9 * sY);
            ctx.fillStyle = pantsBase;
            ctx.fillRect(-1 * sX, -1 * sY, 2 * sX, 6 * sY);
            // Ragged tear on leg
            ctx.fillStyle = skinDark;
            ctx.fillRect(-2 * sX, 5 * sY, 2 * sX, 2 * sY);
            // Shoe
            ctx.fillStyle = shoeDark;
            ctx.fillRect(-2 * sX, 7 * sY, 4 * sX, 5 * sY);
            ctx.restore();

            // 3. Torso (8x12 cyan shirt with neck and tears)
            ctx.save();
            ctx.translate(4 * sX, 8 * sY);
            ctx.fillStyle = shirtBase;
            ctx.fillRect(0, 0, 8 * sX, 12 * sY);
            // Highlights & shadows
            ctx.fillStyle = shirtLight;
            ctx.fillRect(1 * sX, 1 * sY, 6 * sX, 2 * sY);
            ctx.fillStyle = shirtDark;
            ctx.fillRect(0, 8 * sX, 8 * sX, 4 * sY);
            ctx.fillRect(6 * sX, 2 * sY, 2 * sX, 8 * sY);
            // Decayed chest skin tear / V-neck
            ctx.fillStyle = skinBase;
            ctx.fillRect(3 * sX, 0, 2 * sX, 3 * sY);
            ctx.fillRect(2 * sX, 6 * sY, 2 * sX, 2 * sY);
            ctx.fillStyle = skinRot;
            ctx.fillRect(3 * sX, 1 * sY, 2 * sX, 1 * sY);
            ctx.restore();

            // 4. Head (8x8 rotting green zombie face, hair & piercing glowing eyes)
            ctx.save();
            ctx.translate(4 * sX, 0);
            // Base face
            ctx.fillStyle = skinBase;
            ctx.fillRect(0, 0, 8 * sX, 8 * sY);
            // Rotting texture patches
            ctx.fillStyle = skinLight;
            ctx.fillRect(1 * sX, 2 * sY, 2 * sX, 2 * sY);
            ctx.fillRect(5 * sX, 5 * sY, 2 * sX, 2 * sY);
            ctx.fillStyle = skinDark;
            ctx.fillRect(0, 4 * sY, 2 * sX, 3 * sY);
            ctx.fillRect(6 * sX, 1 * sY, 2 * sX, 3 * sY);
            // Messy dark hair
            ctx.fillStyle = hairDark;
            ctx.fillRect(0, 0, 8 * sX, 2 * sY);
            ctx.fillRect(0, 2 * sY, 2 * sX, 2 * sY);
            ctx.fillRect(7 * sX, 2 * sY, 1 * sX, 1 * sY);
            ctx.fillRect(3 * sX, 2 * sY, 2 * sX, 1 * sY);

            // Sunken dark eyes
            ctx.fillStyle = '#101c0c';
            ctx.fillRect(1 * sX, 3 * sY, 2 * sX, 2 * sY);
            ctx.fillRect(5 * sX, 3 * sY, 2 * sX, 2 * sY);

            // Glowing Eyes: Crimson/Amber Bioluminescent Eyes in darkness or when frenzied/lunging!
            const isNightOrDark = (typeof timeOfDay !== 'undefined' && (timeOfDay >= 0.58 && timeOfDay <= 0.90));
            const isDeepUnderground = this.y > (WORLD_HEIGHT * 0.40 * TILE_SIZE);
            if (this.isFrenzied || this.isLunging || isNightOrDark || isDeepUnderground) {
                ctx.save();
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 6;
                ctx.fillStyle = (frameCount % 16 < 8 && this.isFrenzied) ? '#ff2222' : '#dc2626';
                ctx.fillRect(1.5 * sX, 3.5 * sY, 1.5 * sX, 1.5 * sY);
                ctx.fillRect(5.5 * sX, 3.5 * sY, 1.5 * sX, 1.5 * sY);
                ctx.fillStyle = '#fef08a';
                ctx.fillRect(2 * sX, 4 * sY, 0.7 * sX, 0.7 * sY);
                ctx.fillRect(6 * sX, 4 * sY, 0.7 * sX, 0.7 * sY);
                ctx.restore();
            } else {
                // Eye gleam / pupil
                ctx.fillStyle = '#2d4d1f';
                ctx.fillRect(2 * sX, 3 * sY, 1 * sX, 1 * sY);
                ctx.fillRect(6 * sX, 3 * sY, 1 * sX, 1 * sY);
            }

            // Snarling jaw with rotting teeth when frenzied / lunging
            if (this.isFrenzied || this.isLunging) {
                ctx.fillStyle = '#101c0c';
                ctx.fillRect(2 * sX, 5.5 * sY, 4 * sX, 2.5 * sY);
                ctx.fillStyle = '#fef08a';
                ctx.fillRect(2.5 * sX, 5.5 * sY, 1 * sX, 1 * sY);
                ctx.fillRect(4.5 * sX, 5.5 * sY, 1 * sX, 1 * sY);
                ctx.fillRect(3.5 * sX, 7 * sY, 1 * sX, 1 * sY);
            } else {
                ctx.fillStyle = skinRot;
                ctx.fillRect(3 * sX, 4 * sY, 2 * sX, 2 * sY);
                ctx.fillRect(2 * sX, 6 * sY, 4 * sX, 1 * sY);
                ctx.fillStyle = '#101c0c';
                ctx.fillRect(3 * sX, 6 * sY, 2 * sX, 1 * sY);
            }
            ctx.restore();

            // 5. Front Leg (Swinging forward)
            ctx.save();
            ctx.translate(6 * sX + 2 * sX, 20 * sY + 2 * sY);
            ctx.rotate(legSwing);
            // Pants
            ctx.fillStyle = pantsBase;
            ctx.fillRect(-2 * sX, -2 * sY, 4 * sX, 9 * sY);
            ctx.fillStyle = pantsLight;
            ctx.fillRect(-1 * sX, -1 * sY, 2 * sX, 5 * sY);
            ctx.fillStyle = pantsDark;
            ctx.fillRect(-2 * sX, 4 * sY, 4 * sX, 2 * sY);
            // Ragged tear
            ctx.fillStyle = skinBase;
            ctx.fillRect(0, 3 * sY, 2 * sX, 2 * sY);
            // Shoe
            ctx.fillStyle = shoeDark;
            ctx.fillRect(-2 * sX, 7 * sY, 4 * sX, 5 * sY);
            ctx.restore();

            // 6. Front Arm (Outstretched forward reaching aggressively toward player!)
            ctx.save();
            ctx.translate(6 * sX + 2 * sX, 8 * sY + 2 * sY);
            const frontReachAngle = (this.isFrenzied || this.isLunging) ? (-Math.PI / 2 - 0.38) : (-Math.PI / 2 - 0.08);
            ctx.rotate(frontReachAngle + armBob);
            // Sleeve
            ctx.fillStyle = shirtBase;
            ctx.fillRect(-2 * sX, -2 * sY, 4 * sX, 5 * sY);
            ctx.fillStyle = shirtLight;
            ctx.fillRect(-1 * sX, -2 * sY, 2 * sX, 1 * sY);
            ctx.fillStyle = shirtDark;
            ctx.fillRect(-2 * sX, 3 * sY, 4 * sX, 1 * sY);
            // Rotting Forearm & Hand
            ctx.fillStyle = skinBase;
            ctx.fillRect(-2 * sX, 4 * sY, 4 * sX, 8 * sY);
            ctx.fillStyle = skinLight;
            ctx.fillRect(-1 * sX, 4 * sY, 2 * sX, 5 * sY);
            ctx.fillStyle = skinRot;
            ctx.fillRect(-2 * sX, 7 * sY, 2 * sX, 2 * sY);
            // Reaching Fingers
            ctx.fillStyle = skinLight;
            ctx.fillRect(-2 * sX, 10 * sY, 4 * sX, 2 * sY);
            ctx.fillStyle = skinDark;
            ctx.fillRect(0, 11 * sY, 2 * sX, 1 * sY);
            ctx.restore();

            ctx.restore();
        }
    }


    export class Creeper extends PhysicsEntity {
        constructor(x, y) {
            super(x, y, TILE_SIZE * 0.75, TILE_SIZE * 1.8);
            this.health = 20; this.damageCooldown = 0;
            this.speed = MOVE_SPEED * 0.35; this.swell = 0; this.facingRight = true;
        }

        update() {
            if (this.damageCooldown > 0) this.damageCooldown--;
            if (this.health <= 0) return;

            let target = getMobTarget(this);
            const diff = (typeof currentDifficulty !== 'undefined') ? currentDifficulty : 'normal';
            const maxSwell = (diff === 'hard' || diff === 'hardcore') ? 60 : (diff === 'easy' ? 90 : 75);

            if (target) {
                let dx = (target.x + target.width / 2) - (this.x + this.width / 2);
                let dy = (target.y + target.height / 2) - (this.y + this.height / 2);
                let distToTarget = Math.hypot(dx, dy);

                // Stalker Stealth Logic: Creep slowly when player looks toward it, sprint when player looks away
                const curP = (typeof player !== 'undefined') ? player : null;
                const playerFacesCreeper = curP ? ((curP.facingRight && this.x > curP.x) || (!curP.facingRight && this.x < curP.x)) : false;
                if (playerFacesCreeper && distToTarget > TILE_SIZE * 3.5) {
                    this.speed = MOVE_SPEED * 0.28; // Stalking slow pace in shadows
                } else {
                    this.speed = MOVE_SPEED * 0.48; // Silent aggressive ambush speed
                }

                // Mid-air Drop Ambush: If dropping from above onto the player, prime the fuse mid-air!
                if (!this.isGrounded && this.vy > 1.2 && dy > 0 && Math.abs(dx) < TILE_SIZE * 3.2) {
                    this.swell += 2;
                    if (frameCount % 10 === 0) {
                        particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ffffff'));
                        playSound('creeper_hiss_stalk');
                    }
                }

                // Explode if physically close in BOTH horizontal and vertical dimensions
                if (distToTarget < TILE_SIZE * 2.8 && Math.abs(dy) < TILE_SIZE * 2.5) {
                    this.vx = 0;
                    this.swell++;
                    if (frameCount % 8 === 0) particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ffffff'));
                    if (this.swell >= maxSwell) this.explode();
                } else if (distToTarget < TILE_SIZE * 18 && Math.abs(dy) < TILE_SIZE * 9) {
                    this.swell = Math.max(0, this.swell - 1);
                    if (dx > 4) { this.vx = this.speed; this.facingRight = true; }
                    else if (dx < -4) { this.vx = -this.speed; this.facingRight = false; }
                    else { this.vx = 0; }
                    this.checkObstacleJump();
                } else {
                    this.vx = 0;
                    this.swell = Math.max(0, this.swell - 1);
                }
            } else {
                this.vx = 0;
                this.swell = Math.max(0, this.swell - 1);
            }

            // Ladder / Vine Climbing
            const cGx     = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const cFootGy  = Math.floor((this.y + this.height - 2) / TILE_SIZE);
            const cBodyGy  = Math.floor((this.y + this.height / 2) / TILE_SIZE);
            const cHeadGy  = Math.floor((this.y + 4) / TILE_SIZE);
            const cOnClimbable = isClimbableBlock(world?.[cGx]?.[cFootGy]) ||
                                  isClimbableBlock(world?.[cGx]?.[cBodyGy]) ||
                                  isClimbableBlock(world?.[cGx]?.[cHeadGy]);
            if (cOnClimbable && target) {
                const targetMidY = target.y + target.height / 2;
                const selfMidY   = this.y + this.height / 2;
                if (targetMidY < selfMidY - TILE_SIZE * 0.5) {
                    this.vy = -this.speed * 0.85;
                } else if (targetMidY > selfMidY + TILE_SIZE * 0.5) {
                    this.vy = this.speed * 0.85;
                } else {
                    this.vy = 0;
                }
            }

            this.applyPhysics();
        }

        explode() {
            this.health = 0;
            let cx = Math.floor((this.x + this.width/2) / TILE_SIZE);
            let cy = Math.floor((this.y + this.height/2) / TILE_SIZE);
            const isNearKael = (gx, gy) => {
                const entList = (typeof entities !== 'undefined' && Array.isArray(entities)) ? entities : (typeof window !== 'undefined' && Array.isArray(window.entities) ? window.entities : []);
                for (const e of entList) {
                    if (e instanceof AtlasExplorer && !e.isDeparted) {
                        const kGx = Math.floor((e.x + e.width / 2) / TILE_SIZE);
                        const kGy = Math.floor((e.y + e.height / 2) / TILE_SIZE);
                        if (Math.hypot(gx - kGx, gy - kGy) <= 3.5) return true;
                    }
                }
                return false;
            };

            const clearExplosionCell = (gx, gy) => {
                if (gx < 0 || gx >= WORLD_WIDTH || gy < 0 || gy >= WORLD_HEIGHT || world[gx][gy] === IDS.AIR) return;
                if (isNearKael(gx, gy)) return;
                const blockId = world[gx][gy];
                for(let i=0; i<2; i++) particles.push(new Particle(gx*TILE_SIZE+TILE_SIZE/2, gy*TILE_SIZE+TILE_SIZE/2, getBlockColor(blockId)));
                removeFluid(gx, gy);
                world[gx][gy] = IDS.AIR;
                wakeFluidsAround(gx, gy);
                syncBlock(gx, gy, IDS.AIR);
                checkSandFallAbove(gx, gy);
                dirtToGrassQueue.delete(`${gx}_${gy}`);
                if (blockId === IDS.SNOW) scheduleSnowRegrowth(gx, gy);
                if (world[gx]?.[gy + 1] === IDS.DIRT) scheduleDirtToGrass(gx, gy + 1);
                if (isDoorBlock(blockId)) {
                    const pairedY = getDoorBaseY(gy, blockId) === gy ? gy - 1 : gy + 1;
                    clearExplosionCell(gx, pairedY);
                }
            };

            const diff = (typeof currentDifficulty !== 'undefined') ? currentDifficulty : 'normal';
            let radius = (diff === 'hard' || diff === 'hardcore') ? 4 : (diff === 'easy' ? 2 : 3);

            for(let dx = -radius; dx <= radius; dx++) {
                for(let dy = -radius; dy <= radius; dy++) {
                    if (dx*dx + dy*dy <= radius*radius) {
                        let gx = cx + dx; let gy = cy + dy;
                        clearExplosionCell(gx, gy);
                    }
                }
            }

            for(let i=0; i<30; i++) particles.push(new Particle(this.x+this.width/2, this.y+this.height/2, '#ffffff'));
            for(let i=0; i<30; i++) particles.push(new Particle(this.x+this.width/2, this.y+this.height/2, '#ff6600'));

            // Damage local player if in blast radius
            let distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
            if (distToPlayer < radius * TILE_SIZE * 1.5 && !player.isDead) {
                player.takeDamage(12);
                player.vx = (player.x > this.x ? 10 : -10);
                player.vy = -8;
            }

            // Damage remote players in multiplayer
            if (isMultiplayer && isMultiplayerAuthority()) {
                Object.entries(remotePlayers).forEach(([id, rp]) => {
                    if (rp.isDead) return;
                    let dist = Math.hypot(rp.x - this.x, rp.y - this.y);
                    if (dist < radius * TILE_SIZE * 1.5) {
                        damageRemotePlayer(id, 12);
                    }
                });
            }
        }

        takeDamage(amt, knockbackDir, knockbackForce = 4.0) {
            return this.applyMobDamage(amt, knockbackDir, '#4CAF50', knockbackForce);
        }

        draw(ctx, camX, camY) {
            if (this.health <= 0) return;
            const drawX = this.x - camX; const drawY = this.y - camY;
            const w = this.width; const h = this.height;

            if (advancedGraphics && cachedShadowCanvas) {
                ctx.drawImage(cachedShadowCanvas, drawX + w/2 - w/2.2, drawY + h - 6, w * (2/2.2), 8);
            }

            ctx.save();
            ctx.translate(drawX + w/2, drawY + h);
            let swellScale = 1 + (this.swell / 90) * 0.30;
            ctx.scale(swellScale, 1 + (this.swell / 90) * 0.15);
            if (!this.facingRight) ctx.scale(-1, 1);
            ctx.translate(-w/2, -h);

            const isFlashing = (this.damageCooldown > 0) || (this.swell > 0 && Math.floor(frameCount / (this.swell > 55 ? 3 : 6)) % 2 === 0);
            const baseGreen = isFlashing ? '#ffffff' : '#52b038';
            const darkGreen = isFlashing ? '#e0e0e0' : '#327820';
            const deepGreen = isFlashing ? '#c8c8c8' : '#225814';
            const lightGreen = isFlashing ? '#ffffff' : '#7adc56';
            const faceBlack = isFlashing ? '#333333' : '#111a0d';

            // 1. HEAD (square 26x22)
            const headX = (w - 26) / 2;
            const headY = 0;
            const headW = 26;
            const headH = 22;

            ctx.fillStyle = baseGreen;
            ctx.fillRect(headX, headY, headW, headH);

            // Mottled head noise pixels
            ctx.fillStyle = lightGreen;
            ctx.fillRect(headX + 2, headY + 2, 4, 4);
            ctx.fillRect(headX + 20, headY + 1, 4, 3);
            ctx.fillRect(headX + 1, headY + 16, 4, 4);
            ctx.fillStyle = darkGreen;
            ctx.fillRect(headX + 7, headY + 1, 4, 3);
            ctx.fillRect(headX + 16, headY + 17, 5, 4);
            ctx.fillRect(headX + 1, headY + 7, 3, 4);
            ctx.fillStyle = deepGreen;
            ctx.fillRect(headX + 21, headY + 8, 4, 4);

            // Iconic Creeper Face with glowing eyes in darkness
            const isDark = (typeof timeOfDay !== 'undefined' && (timeOfDay >= 0.58 && timeOfDay <= 0.90)) || (this.y > (WORLD_HEIGHT * 0.40 * TILE_SIZE));
            if (isDark && !isFlashing) {
                ctx.save();
                ctx.shadowColor = '#4ade80';
                ctx.shadowBlur = 5;
                ctx.fillStyle = '#0f170d';
                // Eyes
                ctx.fillRect(headX + 4, headY + 6, 5, 5);
                ctx.fillRect(headX + 17, headY + 6, 5, 5);
                // Nose
                ctx.fillRect(headX + 10, headY + 11, 6, 5);
                // Mouth droop & mustache
                ctx.fillRect(headX + 7, headY + 13, 3, 8);
                ctx.fillRect(headX + 16, headY + 13, 3, 8);
                ctx.fillRect(headX + 10, headY + 16, 6, 3);

                // Pale radioactive lime pupil glow in dark caverns
                ctx.fillStyle = '#4ade80';
                ctx.fillRect(headX + 5.5, headY + 7.5, 2, 2);
                ctx.fillRect(headX + 18.5, headY + 7.5, 2, 2);
                ctx.restore();
            } else {
                ctx.fillStyle = faceBlack;
                // Eyes
                ctx.fillRect(headX + 4, headY + 6, 5, 5);
                ctx.fillRect(headX + 17, headY + 6, 5, 5);
                // Nose
                ctx.fillRect(headX + 10, headY + 11, 6, 5);
                // Mouth droop & mustache
                ctx.fillRect(headX + 7, headY + 13, 3, 8);
                ctx.fillRect(headX + 16, headY + 13, 3, 8);
                ctx.fillRect(headX + 10, headY + 16, 6, 3);
            }

            // 2. TORSO (20x32)
            const bodyX = (w - 20) / 2;
            const bodyY = 22;
            const bodyW = 20;
            const bodyH = 32;

            ctx.fillStyle = baseGreen;
            ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

            // Mottled body pixels
            ctx.fillStyle = darkGreen;
            ctx.fillRect(bodyX + 2, bodyY + 3, 5, 6);
            ctx.fillRect(bodyX + 12, bodyY + 8, 6, 7);
            ctx.fillRect(bodyX + 3, bodyY + 20, 6, 6);
            ctx.fillRect(bodyX + 13, bodyY + 23, 5, 6);
            ctx.fillStyle = lightGreen;
            ctx.fillRect(bodyX + 10, bodyY + 2, 6, 5);
            ctx.fillRect(bodyX + 1, bodyY + 11, 6, 6);
            ctx.fillRect(bodyX + 11, bodyY + 16, 5, 5);
            ctx.fillRect(bodyX + 4, bodyY + 27, 4, 4);
            ctx.fillStyle = deepGreen;
            ctx.fillRect(bodyX + 8, bodyY + 10, 3, 4);
            ctx.fillRect(bodyX + 1, bodyY + 24, 3, 4);

            // 3. SHORT STUBBY LEGS (18px high)
            const legSwing = (this.vx !== 0) ? Math.sin(frameCount * 0.35) * 3 : 0;
            const legH = 18;
            const legW = 10;

            // Back / Secondary feet
            ctx.fillStyle = deepGreen;
            ctx.fillRect(bodyX + 1 - legSwing * 0.6, 54, legW, legH - 2);
            ctx.fillRect(bodyX + bodyW - legW - 1 + legSwing * 0.6, 54, legW, legH - 2);

            // Front Left Foot
            ctx.fillStyle = baseGreen;
            ctx.fillRect(bodyX - 1 + legSwing, 54, legW, legH);
            ctx.fillStyle = darkGreen;
            ctx.fillRect(bodyX - 1 + legSwing, 54 + legH - 4, legW, 4);
            ctx.fillStyle = lightGreen;
            ctx.fillRect(bodyX + legSwing, 56, 3, 4);

            // Front Right Foot
            ctx.fillStyle = baseGreen;
            ctx.fillRect(bodyX + bodyW - legW + 1 - legSwing, 54, legW, legH);
            ctx.fillStyle = darkGreen;
            ctx.fillRect(bodyX + bodyW - legW + 1 - legSwing, 54 + legH - 4, legW, 4);
            ctx.fillStyle = lightGreen;
            ctx.fillRect(bodyX + bodyW - 3 - legSwing, 56, 3, 4);

            ctx.restore();
        }
    }


    export class Scorpion extends PhysicsEntity {
        constructor(x, y) {
            super(x, y, TILE_SIZE * 0.85, TILE_SIZE * 0.5);
            this.health = 8;
            this.damageCooldown = 0;
            this.speed = MOVE_SPEED * 0.52;
            this.damage = 1;
            this.facingRight = true;
            this.attackCooldown = 0;
            this.tailStrikeTime = 0;
            this.walkAnimTime = 0;
            this.isBurrowed = false;
        }

        update() {
            if (this.damageCooldown > 0) this.damageCooldown--;
            if (this.attackCooldown > 0) this.attackCooldown--;
            if (this.tailStrikeTime > 0) this.tailStrikeTime--;

            let target = getMobTarget(this);
            const activeWorld = this.getActiveWorld();

            // Sand Burrowing Behavior: Burrow when resting on desert sand
            if (!target && this.isGrounded && activeWorld) {
                const gx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
                const gy = Math.floor((this.y + this.height + 2) / TILE_SIZE);
                if (activeWorld[gx]?.[gy] === IDS.SAND) {
                    this.isBurrowed = true;
                }
            }

            if (target) {
                let distToPlayer = (target.x + target.width / 2) - (this.x + this.width / 2);
                let absDist = Math.abs(distToPlayer);
                let distY = (target.y + target.height / 2) - (this.y + this.height / 2);
                let totalDist = Math.hypot(distToPlayer, distY);

                // Burrow Ambush: Erupt from sand when player steps within 5.5 blocks!
                if (this.isBurrowed) {
                    if (totalDist < TILE_SIZE * 5.5) {
                        this.isBurrowed = false;
                        this.vy = -3.8;
                        this.isGrounded = false;
                        playSound('scorpion_hiss');
                        for (let i = 0; i < 10; i++) {
                            particles.push(new Particle(this.x + Math.random() * this.width, this.y + this.height, '#eab308'));
                        }
                    } else {
                        this.vx = 0;
                        this.applyPhysics();
                        return;
                    }
                }

                if (absDist < TILE_SIZE * 15) {
                    // Leaping Pounce before stinger strike
                    if (absDist < TILE_SIZE * 2.2 && Math.abs(distY) < TILE_SIZE * 1.4 && this.isGrounded && this.attackCooldown <= 0) {
                        this.vy = -2.8;
                        this.vx = (distToPlayer > 0 ? 1 : -1) * (this.speed * 1.6);
                        this.isGrounded = false;
                    } else if (distToPlayer > 6) {
                        this.vx = this.speed;
                        this.facingRight = true;
                        this.walkAnimTime += 0.25;
                    } else if (distToPlayer < -6) {
                        this.vx = -this.speed;
                        this.facingRight = false;
                        this.walkAnimTime += 0.25;
                    } else {
                        this.vx = 0;
                    }

                    this.checkObstacleJump();

                    // Tail Stinger Attack & Evasive Skitter
                    if (absDist < TILE_SIZE * 1.35 && Math.abs(distY) < TILE_SIZE * 1.3) {
                        if (this.attackCooldown <= 0) {
                            this.attackCooldown = 55;
                            this.tailStrikeTime = 18;
                            playSound('hurt');
                            playSound('scorpion_hiss');

                            for (let i = 0; i < 6; i++) {
                                particles.push(new Particle(this.x + this.width / 2, this.y - 2, '#4ade80'));
                            }

                            const diff = (typeof currentDifficulty !== 'undefined') ? currentDifficulty : 'normal';
                            const poisonDuration = (diff === 'hard' || diff === 'hardcore') ? 480 : (diff === 'easy' ? 240 : 360);

                            if (target.isRemote) {
                                damageRemotePlayer(target.id, this.damage, true);
                            } else {
                                player.takeDamage(this.damage);
                                player.poisonTimer = poisonDuration;
                                updateHealthUI();
                            }

                            // Evasive Skitter: Instantly hop backwards to dodge retaliatory sword swings!
                            this.vx = -(distToPlayer > 0 ? 1 : -1) * 3.8;
                            this.vy = -2.2;
                            this.isGrounded = false;
                        }
                    }
                } else {
                    this.vx = 0;
                }
            } else {
                this.vx = 0;
            }

            // Ladder / Vine Climbing
            const sGx     = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const sFootGy  = Math.floor((this.y + this.height - 1) / TILE_SIZE);
            const sBodyGy  = Math.floor((this.y + this.height / 2) / TILE_SIZE);
            const sOnClimbable = isClimbableBlock(world?.[sGx]?.[sFootGy]) ||
                                  isClimbableBlock(world?.[sGx]?.[sBodyGy]);
            if (sOnClimbable && target) {
                const targetMidY = target.y + target.height / 2;
                const selfMidY   = this.y + this.height / 2;
                if (targetMidY < selfMidY - TILE_SIZE * 0.5) {
                    this.vy = -this.speed * 0.85;
                } else if (targetMidY > selfMidY + TILE_SIZE * 0.5) {
                    this.vy = this.speed * 0.85;
                } else {
                    this.vy = 0;
                }
            }

            this.applyPhysics();
        }

        takeDamage(amt, knockbackDir, knockbackForce = 4.0) {
            if (this.isBurrowed) {
                this.isBurrowed = false;
                playSound('scorpion_hiss');
            }
            if (this.applyMobDamage(amt, knockbackDir || (this.facingRight ? -1 : 1), '#c28435', knockbackForce)) {
                if (this.health <= 0) {
                    if (Math.random() < 0.6) dropItemForWorld(IDS.BONE, this.x + this.width / 2, this.y + this.height / 2, 1);
                }
            }
        }

        draw(ctx, camX, camY) {
            if (this.health <= 0) return;
            const drawX = Math.round(this.x - camX);
            const drawY = Math.round(this.y - camY);
            const w = this.width;
            const h = this.height;

            if (advancedGraphics && cachedShadowCanvas) {
                ctx.drawImage(cachedShadowCanvas, drawX + w / 2 - w / 2.2, drawY + h - 4, w * (2 / 2.2), 6);
            }

            ctx.save();
            if (this.damageCooldown > 0) ctx.globalAlpha = 0.6;

            if (this.isBurrowed) {
                // Subtle sand mound with stinger tip twitching above ground
                ctx.fillStyle = '#d4a373';
                ctx.fillRect(drawX + 4, drawY + h - 6, w - 8, 6);
                ctx.fillStyle = '#b08968';
                ctx.fillRect(drawX + 8, drawY + h - 8, w - 16, 4);
                // Stinger tip poking out
                ctx.fillStyle = '#451a03';
                ctx.fillRect(drawX + w / 2 - 2, drawY + h - 11, 4, 4);
                ctx.fillStyle = '#22c55e';
                ctx.fillRect(drawX + w / 2, drawY + h - 12, 2, 2);
                ctx.restore();
                return;
            }

            const isRight = this.facingRight;
            const legWiggle = Math.sin(this.walkAnimTime) * 2.5;
            const strikeProgress = this.tailStrikeTime > 0 ? (this.tailStrikeTime / 18) : 0;
            const tailWhipOffset = Math.sin(strikeProgress * Math.PI) * 10;
            const strikeDir = isRight ? 1 : -1;
            const tailDir = isRight ? -1 : 1;

            // 1. Legs (6 skittering legs underneath)
            ctx.fillStyle = '#683b10';
            for (let i = 0; i < 3; i++) {
                let legX = drawX + (isRight ? 6 + i * 6 : w - 8 - i * 6);
                let legOffset = (i % 2 === 0 ? legWiggle : -legWiggle);
                ctx.fillRect(legX, drawY + h - 4 + legOffset, 2, 4 - legOffset);
            }

            // 2. Chitin Main Body
            ctx.fillStyle = '#c28435'; // Amber desert carapace
            ctx.fillRect(drawX + 4, drawY + 4, w - 8, h - 6);

            // Chitin segment lines
            ctx.fillStyle = '#92581f';
            ctx.fillRect(drawX + 8, drawY + 5, 2, h - 8);
            ctx.fillRect(drawX + 14, drawY + 5, 2, h - 8);

            // 3. Head & Eyes (glowing emerald in darkness)
            const headX = isRight ? drawX + w - 7 : drawX + 1;
            ctx.fillStyle = '#683b10';
            ctx.fillRect(headX, drawY + 4, 6, 6);
            const isDark = (typeof timeOfDay !== 'undefined' && (timeOfDay >= 0.58 && timeOfDay <= 0.90)) || (this.y > (WORLD_HEIGHT * 0.40 * TILE_SIZE));
            ctx.fillStyle = isDark ? '#4ade80' : '#111111';
            ctx.fillRect(isRight ? headX + 4 : headX + 1, drawY + 5, 1.5, 1.5);

            // 4. Front Pincers
            ctx.fillStyle = '#92581f';
            if (isRight) {
                ctx.fillRect(drawX + w - 3, drawY + 3, 5, 2.5);
                ctx.fillRect(drawX + w + 1, drawY + 1, 2, 2);
                ctx.fillRect(drawX + w + 1, drawY + 5, 2, 2);
            } else {
                ctx.fillRect(drawX - 2, drawY + 3, 5, 2.5);
                ctx.fillRect(drawX - 3, drawY + 1, 2, 2);
                ctx.fillRect(drawX - 3, drawY + 5, 2, 2);
            }

            // 5. Arched Tail & Poison Stinger in the back
            const tailBaseX = isRight ? drawX + 2 : drawX + w - 4;

            // Tail segment 1 (base)
            ctx.fillStyle = '#92581f';
            ctx.fillRect(tailBaseX + (tailDir * 2), drawY + 2 - (tailWhipOffset * 0.3), 3, 4);

            // Tail segment 2 (mid curve)
            ctx.fillStyle = '#c28435';
            ctx.fillRect(tailBaseX + (tailDir * 4) + (strikeDir * tailWhipOffset * 0.6), drawY - 2 - (tailWhipOffset * 0.6), 3.5, 3.5);

            // Tail segment 3 (top arch)
            ctx.fillRect(tailBaseX + (tailDir * 2) + (strikeDir * tailWhipOffset * 1.1), drawY - 6 - (tailWhipOffset * 0.8), 3.5, 3.5);

            // Stinger bulb
            ctx.fillStyle = '#451a03';
            ctx.fillRect(tailBaseX + (strikeDir * tailWhipOffset * 1.4), drawY - 8 - (tailWhipOffset * 0.5), 3, 3);

            // Glowing venom stinger tip
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(tailBaseX + (isRight ? 3 : -2) + (strikeDir * tailWhipOffset * 1.6), drawY - 7 - (tailWhipOffset * 0.5), 2, 2);

            // Red damage flash
            if (this.damageCooldown > 0) {
                ctx.fillStyle = 'rgba(255, 60, 60, 0.45)';
                ctx.fillRect(drawX - 2, drawY - 8, w + 4, h + 10);
            }

            ctx.restore();
        }
    }


    export class Gloomstalker extends PhysicsEntity {
        constructor(x, y) {
            super(x, y, TILE_SIZE * 0.85, TILE_SIZE * 1.90);
            // Nerfed & balanced stats for exciting, fair survival combat
            this.health = 14;
            this.maxHealth = 14;
            this.damageCooldown = 0;
            this.speed = MOVE_SPEED * 0.58; // Slower than player so player can outrun/kite
            this.damage = 2.2;
            this.facingRight = true;
            this.attackCooldown = 0;
            this.tetherCooldown = 80;
            this.blinkCooldown = 0;
            this.consecutiveHits = 0;
            this.hitResetTimer = 0;
            this.stunTimer = 0;
            this.walkAnimTime = 0;
            this.stalkTime = Math.random() * 100;
            this.isCeilingClinging = false;
            this.isStealthed = false;
            this.ambushPounceTime = 0;
            this.turnCooldown = 0;
            this.evasionTimer = 0;
            this.teleportEmergeTimer = 0;
            this.glitchOffset = 0;
        }

        teleportToSafeLocation(preferredDir, target) {
            const activeWorld = this.getActiveWorld();
            if (!activeWorld) return false;
            const curWorldW = activeWorld.length;

            const curGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const curGy = Math.floor((this.y + this.height - 4) / TILE_SIZE);

            // Candidate positions: behind target, or directional evasive hops
            const candidates = [];
            if (target) {
                const tGx = Math.floor((target.x + target.width / 2) / TILE_SIZE);
                const tFacing = target.facingRight ? 1 : -1;
                candidates.push(tGx - tFacing * 3);
                candidates.push(tGx - tFacing * 4);
                candidates.push(tGx + tFacing * 4);
            }
            candidates.push(curGx + preferredDir * 5);
            candidates.push(curGx + preferredDir * 4);
            candidates.push(curGx + preferredDir * 6);
            candidates.push(curGx - preferredDir * 4);
            candidates.push(curGx - preferredDir * 5);
            candidates.push(curGx + preferredDir * 3);
            candidates.push(curGx - preferredDir * 3);

            let bestX = -1;
            let bestY = -1;

            for (const candGx of candidates) {
                if (candGx < 2 || candGx >= curWorldW - 2) continue;
                if (Math.abs(candGx - curGx) < 2) continue;

                for (let dy = -3; dy <= 4; dy++) {
                    const testGy = curGy + dy;
                    if (testGy < 4 || testGy >= WORLD_HEIGHT - 3) continue;

                    const floorB = activeWorld[candGx]?.[testGy + 1];
                    const footB = activeWorld[candGx]?.[testGy];
                    const torsoB = activeWorld[candGx]?.[testGy - 1];
                    const headB = activeWorld[candGx]?.[testGy - 2];

                    const isFloorSolid = floorB !== undefined && isSolidWorldBlock(candGx, testGy + 1, floorB) && floorB !== IDS.LAVA && floorB !== IDS.WATER;
                    const isFootClear = footB === IDS.AIR || (footB !== undefined && !isSolidWorldBlock(candGx, testGy, footB) && footB !== IDS.LAVA);
                    const isTorsoClear = torsoB === IDS.AIR || (torsoB !== undefined && !isSolidWorldBlock(candGx, testGy - 1, torsoB) && torsoB !== IDS.LAVA);
                    const isHeadClear = headB === IDS.AIR || (headB !== undefined && !isSolidWorldBlock(candGx, testGy - 2, headB) && headB !== IDS.LAVA);

                    if (isFloorSolid && isFootClear && isTorsoClear && isHeadClear) {
                        bestX = candGx * TILE_SIZE + (TILE_SIZE - this.width) / 2;
                        bestY = (testGy + 1) * TILE_SIZE - this.height;
                        break;
                    }
                }
                if (bestX > 0) break;
            }

            if (bestX > 0 && bestY > 0) {
                if (Array.isArray(particles)) {
                    for (let i = 0; i < 12; i++) {
                        particles.push(new Particle(this.x + Math.random() * this.width, this.y + Math.random() * this.height, '#7c3aed'));
                        particles.push(new Particle(this.x + Math.random() * this.width, this.y + Math.random() * this.height, '#090514'));
                    }
                }
                playSound('shadow_blink', { vol: 0.75 });

                this.x = bestX;
                this.y = bestY;
                this.vx = 0;
                this.vy = -0.5;
                this.isGrounded = true;
                this.teleportEmergeTimer = 18;

                if (Array.isArray(particles)) {
                    for (let i = 0; i < 14; i++) {
                        particles.push(new Particle(this.x + Math.random() * this.width, this.y + Math.random() * this.height, '#38bdf8'));
                        particles.push(new Particle(this.x + Math.random() * this.width, this.y + Math.random() * this.height, '#c084fc'));
                    }
                }
                return true;
            }

            // Safe fallback without penetrating walls
            this.teleportEmergeTimer = 18;
            playSound('shadow_blink', { vol: 0.5 });
            this.vy = -2.5;
            this.isGrounded = false;
            return false;
        }

        update() {
            this.stalkTime += 0.05;
            if (this.damageCooldown > 0) this.damageCooldown--;
            if (this.attackCooldown > 0) this.attackCooldown--;
            if (this.tetherCooldown > 0) this.tetherCooldown--;
            if (this.blinkCooldown > 0) this.blinkCooldown--;
            if (this.ambushPounceTime > 0) this.ambushPounceTime--;
            if (this.turnCooldown > 0) this.turnCooldown--;
            if (this.evasionTimer > 0) this.evasionTimer--;
            if (this.teleportEmergeTimer > 0) this.teleportEmergeTimer--;
            if (this.hitResetTimer > 0) {
                this.hitResetTimer--;
                if (this.hitResetTimer <= 0) this.consecutiveHits = 0;
            }

            // Occasional ESP psychic twitch / glitch artifact
            if (Math.random() < 0.08) {
                this.glitchOffset = (Math.random() - 0.5) * 3.5;
            } else {
                this.glitchOffset = 0;
            }

            if (this.stunTimer > 0) {
                this.stunTimer--;
                this.vx = 0;
                if (frameCount % 6 === 0 && Array.isArray(particles)) {
                    particles.push(new Particle(this.x + Math.random() * this.width, this.y + Math.random() * this.height, '#fef08a'));
                }
                this.applyPhysics();
                return;
            }

            const target = getMobTarget(this);
            const activeWorld = this.getActiveWorld();
            const gx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const gy = Math.floor((this.y + this.height / 2) / TILE_SIZE);

            // Light Detection & Stealth Management
            const nearTorch = isNearTorch(gx, gy, 5);
            const p = (typeof player !== 'undefined') ? player : null;
            const pDist = p ? Math.hypot(p.x - this.x, p.y - this.y) : 9999;
            const pItem = (inventory && inventory[selectedHotbarIndex]) ? inventory[selectedHotbarIndex].id : null;
            const pOff = (inventory && inventory[27]) ? inventory[27].id : null;
            const playerHoldsLight = (pItem === IDS.TORCH || pItem === IDS.GLOOM_LANTERN || pOff === IDS.TORCH || pOff === IDS.GLOOM_LANTERN);
            const exposedToLight = nearTorch || (playerHoldsLight && pDist < TILE_SIZE * 6);

            if (exposedToLight) {
                if (this.isStealthed && pDist < TILE_SIZE * 5) {
                    this.stunTimer = 55; // Light stun shock
                    playSound('gloom_screech', { vol: 0.45 });
                    if (Array.isArray(particles)) {
                        for (let s = 0; s < 8; s++) {
                            particles.push(new Particle(this.x + Math.random() * this.width, this.y, '#fef08a'));
                        }
                    }
                }
                this.isStealthed = false;
            } else {
                const isNight = timeOfDay >= 0.58 && timeOfDay <= 0.90;
                const inCave = gy > (typeof getWorldSurfaceY === 'function' ? getWorldSurfaceY(gx) + 4 : 40);
                if (isNight || inCave) {
                    this.isStealthed = true;
                } else {
                    this.isStealthed = false;
                }
            }

            // Ceiling Clinging AI: Check for solid ceiling overhead
            if (activeWorld) {
                const ceilGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
                const ceilGy = Math.floor((this.y - 3) / TILE_SIZE);
                const hasCeil = isSolidWorldBlock(ceilGx, ceilGy, activeWorld[ceilGx]?.[ceilGy]);

                if (hasCeil && target && (target.y > this.y + TILE_SIZE * 1.5) && this.ambushPounceTime <= 0) {
                    this.isCeilingClinging = true;
                } else if (!hasCeil) {
                    this.isCeilingClinging = false;
                }
            }

            if (this.isCeilingClinging && activeWorld) {
                const ceilGy = Math.floor((this.y - 3) / TILE_SIZE);
                this.y = (ceilGy + 1) * TILE_SIZE;
                this.vy = 0;
                this.isGrounded = false;

                if (target) {
                    const distX = (target.x + target.width / 2) - (this.x + this.width / 2);
                    const distY = (target.y + target.height / 2) - (this.y + this.height / 2);
                    this.facingRight = distX > 0;
                    const absDist = Math.abs(distX);

                    // Deadzone & hysteresis for ceiling facing direction
                    if (absDist > 12 && this.turnCooldown <= 0) {
                        const shouldFaceRight = distX > 0;
                        if (this.facingRight !== shouldFaceRight) {
                            this.facingRight = shouldFaceRight;
                            this.turnCooldown = 16;
                        }
                    }

                    // Ambush Dive Drop
                    if (absDist < TILE_SIZE * 2.2 && distY > 0 && distY < TILE_SIZE * 10) {
                        this.isCeilingClinging = false;
                        this.vy = 8.5;
                        this.ambushPounceTime = 40;
                        playSound('gloom_screech', { vol: 0.70 });
                        if (Array.isArray(particles)) {
                            for (let i = 0; i < 8; i++) {
                                particles.push(new Particle(this.x + Math.random() * this.width, this.y, '#a855f7'));
                            }
                        }
                    } else {
                        // Crawl along ceiling toward target
                        this.vx = (this.facingRight ? 1 : -1) * (this.speed * 0.65);
                        this.walkAnimTime += 0.22;
                    }
                } else {
                    this.vx = 0;
                }
                this.applyPhysics();
                return;
            }

            // Impact Shockwave on landing from ceiling dive (nerfed slam damage)
            if (this.ambushPounceTime > 0 && this.isGrounded) {
                this.ambushPounceTime = 0;
                playSound('hit', { vol: 0.8 });
                if (Array.isArray(particles)) {
                    for (let i = 0; i < 16; i++) {
                        particles.push(new Particle(this.x + Math.random() * this.width, this.y + this.height, '#7c3aed'));
                    }
                }
                // Ground slam damage if landing right onto player
                if (target) {
                    const slamDist = Math.hypot((target.x + target.width / 2) - (this.x + this.width / 2), (target.y + target.height / 2) - (this.y + this.height / 2));
                    if (slamDist < TILE_SIZE * 1.8) {
                        if (target.isRemote) damageRemotePlayer(target.id, 2.5, true);
                        else {
                            player.takeDamage(2.5);
                            player.gloomBlindTimer = 80;
                            updateHealthUI();
                        }
                    }
                }
            }

            // Ground Combat Behavior
            if (target) {
                const distX = (target.x + target.width / 2) - (this.x + this.width / 2);
                const distY = (target.y + target.height / 2) - (this.y + this.height / 2);
                const absDist = Math.abs(distX);

                // Fix spinning left/right glitch: Deadzone threshold & turn cooldown hysteresis
                if (absDist > 14 && this.turnCooldown <= 0) {
                    const shouldFaceRight = distX > 0;
                    if (this.facingRight !== shouldFaceRight) {
                        this.facingRight = shouldFaceRight;
                        this.turnCooldown = 16;
                    }
                }

                if (absDist < TILE_SIZE * 16) {
                    if (this.evasionTimer <= 0) {
                        if (absDist > TILE_SIZE * 0.85) {
                            this.vx = (this.facingRight ? 1 : -1) * this.speed;
                        } else {
                            // Proximity deceleration prevents box clipping jitter
                            this.vx *= 0.6;
                        }
                    }
                    this.walkAnimTime += 0.20;
                    this.checkObstacleJump();

                    // Ranged Umbral Silk Web (nerfed cooldown: 200 frames)
                    if (absDist > TILE_SIZE * 3.5 && absDist < TILE_SIZE * 8.5 && Math.abs(distY) < TILE_SIZE * 3.5 && this.tetherCooldown <= 0) {
                        this.tetherCooldown = 200;
                        const angle = Math.atan2(distY, distX);
                        const pSpeed = 6.2;
                        if (Array.isArray(activeProjectiles)) {
                            activeProjectiles.push(new GloomTetherProjectile(this.x + this.width / 2, this.y + this.height * 0.35, Math.cos(angle) * pSpeed, Math.sin(angle) * pSpeed - 1.0, this));
                        }
                        playSound('tether_shoot', { vol: 0.65 });
                    }

                    // Melee Claws Strike & Gloom Blindness (nerfed: 2.2 normal damage, 80 frame blindness, 70 cooldown)
                    if (absDist < TILE_SIZE * 1.4 && Math.abs(distY) < TILE_SIZE * 1.4) {
                        if (this.attackCooldown <= 0) {
                            this.attackCooldown = 70;
                            const diff = currentDifficulty || 'normal';
                            const strikeDmg = diff === 'hard' || diff === 'hardcore' ? 3.2 : (diff === 'easy' ? 1.5 : 2.2);

                            if (target.isRemote) {
                                damageRemotePlayer(target.id, strikeDmg, true);
                            } else {
                                player.takeDamage(strikeDmg);
                                const hasGloomLantern = (inventory[selectedHotbarIndex]?.id === IDS.GLOOM_LANTERN || inventory[27]?.id === IDS.GLOOM_LANTERN);
                                if (!hasGloomLantern) {
                                    player.gloomBlindTimer = 80;
                                }
                                updateHealthUI();
                            }
                            playSound('hurt');
                            playSound('gloom_screech', { vol: 0.50 });
                            if (Array.isArray(particles)) {
                                for (let i = 0; i < 8; i++) {
                                    particles.push(new Particle(this.x + this.width / 2, this.y + this.height * 0.35, '#a855f7'));
                                }
                            }
                            // Smooth evasive hop back with evasion lock
                            const retreatDir = this.facingRight ? -1 : 1;
                            this.vx = retreatDir * 3.0;
                            this.vy = -2.2;
                            this.isGrounded = false;
                            this.evasionTimer = 16;
                        }
                    }
                } else {
                    this.vx = 0;
                }
            } else {
                this.vx = 0;
            }

            // Dripping shadow embers
            if (frameCount % 8 === 0 && Array.isArray(particles)) {
                particles.push(new Particle(this.x + Math.random() * this.width, this.y + this.height - 4, '#1e1035'));
            }

            this.applyPhysics();
        }

        takeDamage(amt, knockbackDir, knockbackForce = 4.0) {
            this.consecutiveHits++;
            this.hitResetTimer = 90;
            this.isCeilingClinging = false;

            // Safe Shadow Blink counter-escape when hit 2+ times in short succession (nerfed cooldown: 150 frames)
            if (this.consecutiveHits >= 2 && this.blinkCooldown <= 0 && this.health > 0) {
                this.consecutiveHits = 0;
                this.blinkCooldown = 150;
                const target = getMobTarget(this);
                const blinkDir = (knockbackDir ? -knockbackDir : (this.facingRight ? -1 : 1));
                this.teleportToSafeLocation(blinkDir, target);
            }

            if (this.applyMobDamage(amt, knockbackDir || (this.facingRight ? -1 : 1), '#7c3aed', knockbackForce)) {
                if (this.health <= 0) {
                    const silkCount = Math.floor(Math.random() * 3) + 1;
                    dropItemForWorld(IDS.GLOOM_SILK, this.x + this.width / 2, this.y + this.height / 2, silkCount);
                    const diff = currentDifficulty || 'normal';
                    const carapaceChance = (diff === 'hard' || diff === 'hardcore') ? 0.75 : 0.40;
                    if (Math.random() < carapaceChance) {
                        dropItemForWorld(IDS.SHADOW_CARAPACE, this.x + this.width / 2, this.y + this.height / 2, 1);
                    }
                }
            }
        }

        draw(ctx, camX, camY) {
            if (this.health <= 0) return;
            const glitch = this.glitchOffset || ((Math.random() < 0.08) ? (Math.random() - 0.5) * 3 : 0);
            const drawX = Math.round(this.x - camX) + glitch;
            const drawY = Math.round(this.y - camY);
            const w = this.width;
            const h = this.height;

            // 0. Entity Ground Contact Shadow
            if (advancedGraphics && cachedShadowCanvas && !this.isCeilingClinging) {
                ctx.drawImage(cachedShadowCanvas, drawX + w / 2 - 17, drawY + h - 4, 34, 6);
            }

            ctx.save();
            const isDamaged = this.damageCooldown > 0;
            if (isDamaged) ctx.globalAlpha = 0.70;
            else if (this.isStealthed) ctx.globalAlpha = 0.20;

            if (this.teleportEmergeTimer > 0) {
                ctx.globalAlpha *= (1.0 - (this.teleportEmergeTimer / 20) * 0.45);
            }

            if (this.isCeilingClinging) {
                ctx.translate(drawX + w / 2, drawY + h / 2);
                ctx.scale(1, -1);
                ctx.translate(-(drawX + w / 2), -(drawY + h / 2));
            }

            const isRight = this.facingRight;
            const dir = isRight ? 1 : -1;
            const walk = this.walkAnimTime;
            const stalk = this.stalkTime;
            const attacking = this.attackCooldown > 45;

            // --- HIGH QUALITY PIXEL-ART HORROR MONSTER ---
            // Palette definitions for authentic handcrafted depth:
            const cVoidDark   = '#030107'; // Pure darkest shadow & outline
            const cFleshDeep  = '#0b0416'; // Deep obsidian-void muscle & bone core
            const cChitinMid  = '#180b2d'; // Shadow chitin armor plate
            const cChitinRim  = '#2d144e'; // Specular carapace rim highlight
            const cBoneDeep   = '#4c1d95'; // Dark shadow bone
            const cBonePlate  = '#c4b5fd'; // Weathered bone mask
            const cBoneWhite  = '#f5f3ff'; // Stark ivory fangs, claws & spine tips
            const cVoidHeart  = '#38bdf8'; // Glowing celestial cyan void core
            const cSporeBulb  = '#a855f7'; // Bioluminescent purple spore bulb
            const cEyeGlow    = attacking ? '#f43f5e' : '#38bdf8'; // Eyes ignite crimson during attack

            // --- 1. BACK WRITHING SHADOW APPENDAGES (4 Segmented Tentacles) ---
            const tendrilWave1 = Math.sin(stalk * 2.4) * 6;
            const tendrilWave2 = Math.cos(stalk * 2.1) * 7;
            const tDir = dir;

            // Tentacle 1: Upper High Tentacle (arching above shoulders)
            const t1RootX = drawX + w / 2 - tDir * 4;
            const t1RootY = drawY + 16;
            ctx.fillStyle = cVoidDark;
            ctx.fillRect(t1RootX - tDir * 2, t1RootY - 4, 3, 4);
            ctx.fillStyle = cChitinMid;
            ctx.fillRect(t1RootX - tDir * 6 + tendrilWave1 * 0.4, t1RootY - 10, 3, 6);
            ctx.fillStyle = cBoneDeep;
            ctx.fillRect(t1RootX - tDir * 11 + tendrilWave1 * 0.8, t1RootY - 17, 2.5, 7);
            // Bioluminescent Apex Spore
            ctx.fillStyle = cSporeBulb;
            ctx.fillRect(t1RootX - tDir * 15 + tendrilWave1 * 1.2, t1RootY - 21, 3, 3);
            ctx.fillStyle = cBoneWhite;
            ctx.fillRect(t1RootX - tDir * 14 + tendrilWave1 * 1.2, t1RootY - 20, 1.5, 1.5);

            // Tentacle 2: Mid Flank Tentacle (whipping backward)
            const t2RootY = drawY + 26;
            ctx.fillStyle = cVoidDark;
            ctx.fillRect(t1RootX - tDir * 2, t2RootY - 2, 3, 3);
            ctx.fillStyle = cChitinMid;
            ctx.fillRect(t1RootX - tDir * 8 + tendrilWave2 * 0.5, t2RootY - 4, 3, 4);
            ctx.fillStyle = cBoneDeep;
            ctx.fillRect(t1RootX - tDir * 14 + tendrilWave2 * 0.9, t2RootY - 8, 2.5, 5);
            // Tip Bulb
            ctx.fillStyle = cSporeBulb;
            ctx.fillRect(t1RootX - tDir * 18 + tendrilWave2 * 1.2, t2RootY - 10, 3, 3);

            // Tentacle 3 & 4: Opposing Side Secondary Tentacles
            ctx.fillStyle = cVoidDark;
            ctx.fillRect(t1RootX + tDir * 1, t1RootY - 2, 2.5, 3);
            ctx.fillStyle = cChitinMid;
            ctx.fillRect(t1RootX + tDir * 4 - tendrilWave2 * 0.3, t1RootY - 8, 2.5, 5);
            ctx.fillStyle = cSporeBulb;
            ctx.fillRect(t1RootX + tDir * 7 - tendrilWave2 * 0.6, t1RootY - 13, 2, 2);

            // --- 2. DIGITIGRADE RAPTOR LEGS (Articulated Double-Jointed Anatomy) ---
            const legSwing = Math.sin(walk) * 5;
            const legLift  = Math.max(0, -Math.cos(walk)) * 4;

            // BACK LEG (in shadow):
            const bLegX = drawX + w / 2 - tDir * 3 - (isRight ? legSwing : -legSwing);
            // Thigh
            ctx.fillStyle = cVoidDark;
            ctx.fillRect(bLegX - 2, drawY + 40, 5, 14);
            ctx.fillStyle = cFleshDeep;
            ctx.fillRect(bLegX - 1, drawY + 41, 3, 12);
            // Knee / Hock joint & spur
            ctx.fillStyle = cChitinMid;
            ctx.fillRect(bLegX - tDir * 2, drawY + 52, 3, 4);
            // Lower Shin strut
            ctx.fillStyle = cVoidDark;
            ctx.fillRect(bLegX + tDir * 1, drawY + 55, 3, 14);
            ctx.fillStyle = cFleshDeep;
            ctx.fillRect(bLegX + tDir * 1.5, drawY + 56, 1.5, 12);
            // Raptor Claws
            ctx.fillStyle = cVoidDark;
            ctx.fillRect(bLegX + tDir * 2, drawY + h - 4, 6, 3);
            ctx.fillStyle = cBoneWhite;
            ctx.fillRect(bLegX + tDir * (isRight ? 6 : -1), drawY + h - 3, 2, 2);

            // FRONT LEG (illuminated near side):
            const fLegX = drawX + w / 2 + tDir * 4 + (isRight ? legSwing : -legSwing);
            const fLiftY = drawY - legLift;
            // Thigh
            ctx.fillStyle = cVoidDark;
            ctx.fillRect(fLegX - 2, fLiftY + 39, 6, 15);
            ctx.fillStyle = cChitinMid;
            ctx.fillRect(fLegX - 1, fLiftY + 40, 4, 13);
            ctx.fillStyle = cChitinRim;
            ctx.fillRect(fLegX + tDir * 1, fLiftY + 41, 1.5, 11);
            // Knee joint spur
            ctx.fillStyle = cBoneDeep;
            ctx.fillRect(fLegX - tDir * 2, fLiftY + 52, 3, 4);
            // Lower Shin
            ctx.fillStyle = cVoidDark;
            ctx.fillRect(fLegX + tDir * 1, fLiftY + 55, 3.5, 15);
            ctx.fillStyle = cChitinMid;
            ctx.fillRect(fLegX + tDir * 1.5, fLiftY + 56, 2, 13);
            // Ankle & Raptor Talons
            ctx.fillStyle = cVoidDark;
            ctx.fillRect(fLegX + tDir * 1, fLiftY + h - 5, 8, 4);
            ctx.fillStyle = cChitinRim;
            ctx.fillRect(fLegX + tDir * 2, fLiftY + h - 4, 5, 2);
            // Ivory Talon Tips
            ctx.fillStyle = cBoneWhite;
            ctx.fillRect(fLegX + tDir * (isRight ? 7 : -2), fLiftY + h - 3, 2, 2);
            ctx.fillRect(fLegX + tDir * (isRight ? 5 : 0), fLiftY + h - 2, 2, 1.5);
            ctx.fillRect(fLegX - tDir * (isRight ? 1 : -4), fLiftY + h - 3, 2, 2);

            // --- 3. MONSTER TORSO & SPECTRAL RIBCAGE ---
            const torsoX = drawX + w / 2 - 7;
            const torsoY = drawY + 14;

            // Dorsal Spinal Vertebrae Spikes
            ctx.fillStyle = cBoneDeep;
            ctx.fillRect(torsoX - tDir * 3, torsoY + 2, 3, 3);
            ctx.fillRect(torsoX - tDir * 4, torsoY + 8, 3.5, 3);
            ctx.fillRect(torsoX - tDir * 4, torsoY + 14, 3.5, 3);
            ctx.fillRect(torsoX - tDir * 3, torsoY + 20, 3, 3);
            ctx.fillStyle = cBoneWhite;
            ctx.fillRect(torsoX - tDir * 5, torsoY + 9, 1.5, 1.5);

            // Main Obsidian Torso Silhouette
            ctx.fillStyle = cVoidDark;
            ctx.fillRect(torsoX - 1, torsoY, 16, 27);
            ctx.fillStyle = cFleshDeep;
            ctx.fillRect(torsoX, torsoY + 1, 14, 25);
            ctx.fillStyle = cChitinMid;
            ctx.fillRect(torsoX + (isRight ? 1 : 3), torsoY + 2, 10, 23);

            // Hunched Carapace Pauldron
            ctx.fillStyle = cChitinRim;
            ctx.fillRect(torsoX - tDir * 1, torsoY + 1, 6, 4);

            // PULSING ABYSSAL VOID CORE (The Monster's Heart)
            const corePulse = (Math.sin(stalk * 3.8) + 1) * 0.5;
            const coreRadX = torsoX + 6 + tDir * 1;
            const coreRadY = torsoY + 11;
            ctx.fillStyle = 'rgba(168, 85, 247, 0.40)';
            ctx.fillRect(coreRadX - 3, coreRadY - 3, 7, 7);
            ctx.fillStyle = corePulse > 0.4 ? cVoidHeart : '#0284c7';
            ctx.fillRect(coreRadX - 1.5, coreRadY - 1.5, 4, 4);
            ctx.fillStyle = cBoneWhite;
            ctx.fillRect(coreRadX - 0.5, coreRadY - 0.5, 2, 2);

            // SPECTRAL RIBCAGE (4 Individual Curved Rib Pairs)
            for (let r = 0; r < 4; r++) {
                const ribY = torsoY + 6 + r * 5;
                const ribW = 12 - r * 1.5;
                const ribX = torsoX + (isRight ? 1 : 14 - ribW);
                ctx.fillStyle = cVoidDark;
                ctx.fillRect(ribX, ribY + 1, ribW, 2);
                ctx.fillStyle = (r === 1 && corePulse > 0.5) ? '#c084fc' : '#7c3aed';
                ctx.fillRect(ribX + 1, ribY, ribW - 1, 1.5);
                ctx.fillStyle = cBoneWhite;
                ctx.fillRect(ribX + (isRight ? ribW - 2 : 1), ribY, 1.5, 1.5);
            }

            // Lower Abdominal Chitin Plating
            ctx.fillStyle = cVoidDark;
            ctx.fillRect(torsoX + 2, torsoY + 24, 10, 3);
            ctx.fillStyle = cChitinRim;
            ctx.fillRect(torsoX + 3, torsoY + 24, 8, 1.5);

            // --- 4. ELONGATED SCYTHE ARMS & SICKLE CLAWS ---
            const armRootX = torsoX + (isRight ? 10 : 0);
            const armRootY = torsoY + 4;
            const armReach = attacking ? tDir * 12 : (this.tetherCooldown > 160 ? tDir * 8 : 0);
            const armLift  = attacking ? -4 : 0;

            // Shoulder Joint & Armor Plating
            ctx.fillStyle = cVoidDark;
            ctx.fillRect(armRootX - 2, armRootY - 2, 6, 6);
            ctx.fillStyle = cChitinRim;
            ctx.fillRect(armRootX - 1, armRootY - 1, 4, 4);

            // Upper Bicep
            ctx.fillStyle = cVoidDark;
            ctx.fillRect(armRootX + armReach * 0.3 - 1, armRootY + 4 + armLift * 0.4, 4, 13);
            ctx.fillStyle = cFleshDeep;
            ctx.fillRect(armRootX + armReach * 0.3, armRootY + 5 + armLift * 0.4, 2.5, 11);

            // Elbow Joint & Blade Spur
            const elbowX = armRootX + armReach * 0.5;
            const elbowY = armRootY + 16 + armLift * 0.7;
            ctx.fillStyle = cBoneDeep;
            ctx.fillRect(elbowX - tDir * 2, elbowY, 3, 3);

            // Elongated Forearm
            ctx.fillStyle = cVoidDark;
            ctx.fillRect(elbowX + armReach * 0.4 - 1, elbowY + 3 + armLift * 0.3, 3.5, 15);
            ctx.fillStyle = cChitinMid;
            ctx.fillRect(elbowX + armReach * 0.4, elbowY + 4 + armLift * 0.3, 2, 13);
            ctx.fillStyle = cChitinRim;
            ctx.fillRect(elbowX + armReach * 0.4 + (isRight ? 1 : 0), elbowY + 4 + armLift * 0.3, 1, 13);

            // Hand & 3 Articulated Razor Sickle Claws
            const handX = elbowX + armReach * 0.8;
            const handY = elbowY + 17 + armLift;
            ctx.fillStyle = cVoidDark;
            ctx.fillRect(handX - 1, handY, 4, 4);

            const clawSpread = [ -3, 0, 3 ];
            for (let c = 0; c < 3; c++) {
                const cx = handX + tDir * (4 + c * 2) + clawSpread[c] * 0.3;
                const cy = handY + 3 + Math.abs(clawSpread[c]) * 1.5;
                ctx.fillStyle = cBoneDeep;
                ctx.fillRect(handX + tDir * (1 + c), handY + 2 + c, 2, 3);
                ctx.fillStyle = cBonePlate;
                ctx.fillRect(cx - tDir * 1, cy, 2, 3.5);
                ctx.fillStyle = cBoneWhite;
                ctx.fillRect(cx, cy + 2.5, 1.5, 2.5);
            }

            // --- 5. MONSTROUS SKULL, BONE MASK & UNHINGED NEEDLE JAW ---
            const headTiltY = Math.sin(stalk * 1.8) * 1.2;
            const headX = drawX + w / 2 - 7 + tDir * 3;
            const headY = drawY + 2 + headTiltY;

            // Jagged Cranial Horns (swept-back demonic crest)
            ctx.fillStyle = cVoidDark;
            ctx.fillRect(headX - tDir * 3, headY - 2, 4, 5);
            ctx.fillRect(headX - tDir * 6, headY - 4, 4, 4);
            ctx.fillStyle = cChitinRim;
            ctx.fillRect(headX - tDir * 5, headY - 3, 2, 2);
            ctx.fillStyle = cBoneWhite;
            ctx.fillRect(headX - tDir * 7, headY - 5, 2, 2);

            // Main Cranium
            ctx.fillStyle = cVoidDark;
            ctx.fillRect(headX - 1, headY, 14, 15);
            ctx.fillStyle = cFleshDeep;
            ctx.fillRect(headX, headY + 1, 12, 13);

            // WEATHERED PALE BONE MASK (Stark creepypasta faceplate)
            ctx.save();
            if (this.isStealthed) {
                ctx.globalAlpha = 0.95; // Mask and eyes pierce vividly through darkness!
            }

            ctx.fillStyle = cBonePlate;
            ctx.fillRect(headX + (isRight ? 3 : 1), headY + 2, 8, 8);
            ctx.fillStyle = cBoneWhite;
            ctx.fillRect(headX + (isRight ? 5 : 2), headY + 3, 5, 6);
            // Skull cracks / fissure weathering
            ctx.fillStyle = cVoidDark;
            ctx.fillRect(headX + (isRight ? 6 : 4), headY + 4, 1.5, 3);
            ctx.fillRect(headX + (isRight ? 5 : 5), headY + 7, 2, 1);

            // PREDATORY GLOWING EYE CAVITIES
            ctx.fillStyle = cVoidDark;
            const eyeBaseX = headX + (isRight ? 5 : 2);
            ctx.fillRect(eyeBaseX, headY + 4, 6, 3);

            // Piercing Glowing Eye Slits & Glint
            ctx.fillStyle = cEyeGlow;
            ctx.fillRect(eyeBaseX + (isRight ? 3 : 1), headY + 4.5, 2.5, 2);
            ctx.fillRect(eyeBaseX + (isRight ? 0 : 3), headY + 4.5, 2, 2);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(eyeBaseX + (isRight ? 4 : 2), headY + 5, 1.5, 1);
            ctx.fillStyle = 'rgba(56, 189, 248, 0.65)';
            ctx.fillRect(eyeBaseX + (isRight ? 5.5 : -1), headY + 5, 3, 1);

            // GAPING UNHINGED NEEDLE-TOOTH VOID JAW
            const jawDrop = attacking ? 3.5 : 0;
            const mouthY = headY + 9;
            ctx.fillStyle = cVoidDark;
            ctx.fillRect(headX + 1, mouthY, 11, 5 + jawDrop);
            ctx.fillStyle = 'rgba(124, 58, 237, 0.70)';
            ctx.fillRect(headX + 3, mouthY + 1, 6, 2 + jawDrop * 0.6);

            // Upper Needle Fangs (5 sharp interlocking teeth)
            ctx.fillStyle = cBoneWhite;
            for (let t = 0; t < 5; t++) {
                ctx.fillRect(headX + 2 + t * 2, mouthY, 1.2, 2.5);
            }
            // Lower Needle Fangs (4 sharp upward teeth)
            const lowJawY = mouthY + 4 + jawDrop;
            ctx.fillStyle = cVoidDark;
            ctx.fillRect(headX + 1, lowJawY, 11, 3);
            ctx.fillStyle = cBoneWhite;
            for (let t = 0; t < 4; t++) {
                ctx.fillRect(headX + 3 + t * 2, lowJawY - 1.5, 1.2, 2.5);
            }
            if (attacking) {
                ctx.fillStyle = '#a855f7';
                ctx.fillRect(headX + 5, lowJawY + 2, 1.5, 3);
            }

            ctx.restore(); // Restore stealth alpha

            // 6. Damage Red Flash
            if (isDamaged) {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
                ctx.fillRect(drawX - 2, drawY - 2, w + 4, h + 4);
            }

            ctx.restore();
        }
    }

// Global Window Registration for cross-module compatibility
if (typeof window !== 'undefined') {
    window.getMobTarget = getMobTarget;
    window.getZombieTarget = getZombieTarget;
    window.Zombie = Zombie;
    window.Creeper = Creeper;
    window.Scorpion = Scorpion;
    window.Gloomstalker = Gloomstalker;
}