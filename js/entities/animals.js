// =============================================================================
// WEBCRAFT 2D - ANIMALS (js/entities/animals.js)
// Animal base class and passive creatures: Pig, Chicken, Pigeon, Parrot, Sheep, Cow
// =============================================================================

import {
    IDS, TILE_SIZE, MOVE_SPEED, GRAVITY, TERMINAL_VELOCITY, JUMP_FORCE
} from '../core/constants.js';

import {
    world, player, entities, particles, floatingTexts, frameCount,
    WORLD_WIDTH, WORLD_HEIGHT, isMultiplayer, isMultiplayerAuthority, inventory, selectedHotbarIndex
} from '../core/state.js';

import {
    advancedGraphics
} from '../core/config.js';

import {
    isSolid, isSolidWorldBlock
} from '../world/blockhelper.js';

import {
    getFluid
} from '../world/fluids.js';

import {
    PhysicsEntity
} from './physicsentity.js';

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

    export class Animal extends PhysicsEntity {
        constructor(x, y, w, h, health, baseSpeed) {
            super(x, y, w, h);
            this.health = health;
            this.damageCooldown = 0;
            this.baseSpeed = baseSpeed;
            this.speed = baseSpeed;
            this.timer = 0;
            this.dir = 1;
            this.panic = false;
            this.panicTimer = 0;
            this.isTempted = false;
            this.walkAnimTime = 0;
            this.idleSeed = Math.random() * 1000;
        }

        isTemptedBy(itemId) {
            return itemId === IDS.SEEDS;
        }

        hasHazardAhead(dir) {
            if (dir === 0) return false;
            const activeWorld = this.getActiveWorld();
            if (!activeWorld) return false;
            const curWorldW = activeWorld.length;
            const curH = activeWorld[0]?.length || WORLD_HEIGHT;

            // Check 1 tile and 2 tiles ahead in the movement direction
            for (let step = 1; step <= 2; step++) {
                const checkX = Math.floor((this.x + this.width / 2 + dir * (this.width / 2 + step * 10)) / TILE_SIZE);
                if (checkX < 0 || checkX >= curWorldW) return true;

                const footY = Math.floor((this.y + this.height - 4) / TILE_SIZE);
                const bodyY = Math.floor((this.y + 4) / TILE_SIZE);

                // Water or lava ahead at head, body, feet, or just above
                for (let ty = bodyY - 1; ty <= footY; ty++) {
                    if (isWater(checkX, ty, this) || isLava(checkX, ty, this) || getFluid(checkX, ty)) return true;
                }
                if (activeWorld[checkX]?.[footY] === IDS.CACTUS || activeWorld[checkX]?.[bodyY] === IDS.CACTUS) return true;

                // Step down or drop into fluid (animals strictly avoid water and lava drops)
                for (let dy = 1; dy <= 4; dy++) {
                    const testY = footY + dy;
                    if (testY >= curH) break;
                    if (isWater(checkX, testY, this) || isLava(checkX, testY, this) || getFluid(checkX, testY)) return true;
                    if (isSolidWorldBlock(checkX, testY, activeWorld[checkX]?.[testY])) break;
                }
            }
            return false;
        }

        hasLethalDropAhead(dir) {
            if (dir === 0) return false;
            const activeWorld = this.getActiveWorld();
            if (!activeWorld) return false;
            const curH = activeWorld[0]?.length || WORLD_HEIGHT;
            const checkX = Math.floor((this.x + this.width / 2 + dir * (this.width / 2 + 8)) / TILE_SIZE);
            const footY = Math.floor((this.y + this.height - 2) / TILE_SIZE);
            
            if (isSolidWorldBlock(checkX, footY, activeWorld[checkX]?.[footY])) return false;
            
            let dropDist = 0;
            for (let dy = 1; dy <= 5; dy++) {
                const testY = footY + dy;
                if (testY >= curH) break;
                // Fluid below is a hazard: animals MUST NOT jump into water or lava!
                if (isWater(checkX, testY, this) || isLava(checkX, testY, this) || getFluid(checkX, testY)) return true;
                if (isSolidWorldBlock(checkX, testY, activeWorld[checkX]?.[testY])) break;
                dropDist++;
            }
            return dropDist >= 3;
        }

        updateAnimalAI() {
            if (this.damageCooldown > 0) this.damageCooldown--;
            this.timer--;
            if (this.panicTimer > 0) this.panicTimer--;
            else this.panic = false;

            const activeWorld = this.getActiveWorld();
            const curWorldW = activeWorld ? activeWorld.length : WORLD_WIDTH;

            const curX = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const curFootY = Math.floor((this.y + this.height - 2) / TILE_SIZE);
            const curBodyY = Math.floor((this.y + this.height / 2) / TILE_SIZE);
            const currentlyInWater = isWater(curX, curFootY, this) || isWater(curX, curBodyY, this);
            const currentlyInLava = isLava(curX, curFootY, this) || isLava(curX, curBodyY, this);

            if (currentlyInLava) {
                this.panic = true;
                this.panicTimer = 180;
                this.vy = -3.2;
                this.vx = (Math.random() > 0.5 ? 1 : -1) * 3.5;
            }

            if (currentlyInWater) {
                // Smooth swimming physics: gentle buoyant rise to surface instead of violent 60fps bouncing
                if (this.vy > 0) this.vy *= 0.55;
                this.vy = Math.max(-1.4, this.vy - 0.35);
                this.fallStartY = this.y;

                let leftLand = -1;
                let rightLand = -1;
                for (let d = 1; d <= 16; d++) {
                    if (leftLand < 0 && curX - d >= 0) {
                        const b = activeWorld?.[curX - d]?.[curFootY];
                        if (isSolidWorldBlock(curX - d, curFootY, b) && !isWater(curX - d, curFootY - 1)) leftLand = d;
                        else if (!isWater(curX - d, curFootY) && !isWater(curX - d, curFootY - 1)) leftLand = d;
                    }
                    if (rightLand < 0 && curX + d < curWorldW) {
                        const b = activeWorld?.[curX + d]?.[curFootY];
                        if (isSolidWorldBlock(curX + d, curFootY, b) && !isWater(curX + d, curFootY - 1)) rightLand = d;
                        else if (!isWater(curX + d, curFootY) && !isWater(curX + d, curFootY - 1)) rightLand = d;
                    }
                }

                if (leftLand > 0 && (rightLand < 0 || leftLand <= rightLand)) {
                    this.dir = -1;
                } else if (rightLand > 0) {
                    this.dir = 1;
                } else if (this.dir === 0) {
                    this.dir = 1;
                }
                this.speed = this.baseSpeed * 0.9;
                this.vx = this.dir * this.speed;

                // Hop smoothly up onto dry shore
                const checkLandX = Math.floor((this.x + this.width / 2 + this.dir * (this.width / 2 + 5)) / TILE_SIZE);
                if (checkLandX >= 0 && checkLandX < curWorldW) {
                    const blockAtShore = activeWorld?.[checkLandX]?.[curFootY];
                    if (isSolidWorldBlock(checkLandX, curFootY, blockAtShore) && !isWater(checkLandX, curFootY - 1)) {
                        this.vy = -3.8;
                        this.isGrounded = false;
                    }
                }
            } 
            else if (this.panic) {
                this.speed = this.baseSpeed * 2.2;
                if (this.hasHazardAhead(this.dir)) this.dir = -this.dir;
                this.vx = this.dir * this.speed;
            }
            else {
                let tempted = false;
                if (player && !player.isDead) {
                    const held = inventory[selectedHotbarIndex];
                    if (held && this.isTemptedBy(held.id)) {
                        const dist = Math.hypot(player.x + player.width / 2 - (this.x + this.width / 2), player.y + player.height / 2 - (this.y + this.height / 2));
                        if (dist < 340) {
                            tempted = true;
                            const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
                            this.dir = dx > 0 ? 1 : -1;
                            
                            if (this.hasHazardAhead(this.dir) || this.hasLethalDropAhead(this.dir)) {
                                this.vx = 0;
                            } else if (dist > 65) {
                                this.speed = this.baseSpeed * 1.15;
                                this.vx = this.dir * this.speed;
                            } else {
                                this.vx = 0;
                            }

                            if (frameCount % 60 === 0 && Math.random() < 0.35) {
                                particles.push(new Particle(this.x + this.width / 2, this.y - 4, '#ff66aa'));
                            }
                        }
                    }
                }
                this.isTempted = tempted;

                if (!tempted) {
                    if (this.timer <= 0) {
                        let roll = Math.random();
                        if (roll < 0.40) {
                            this.dir = 0;
                            this.timer = Math.random() * 80 + 40;
                        } else {
                            let herdDir = 0;
                            let sameSpecies = entities.filter(e => e !== this && e.constructor === this.constructor && Math.hypot(e.x - this.x, e.y - this.y) < 400);
                            if (sameSpecies.length > 0 && Math.random() < 0.4) {
                                let avgX = sameSpecies.reduce((acc, e) => acc + e.x, 0) / sameSpecies.length;
                                herdDir = avgX > this.x ? 1 : -1;
                            }
                            this.dir = herdDir !== 0 ? herdDir : (Math.random() > 0.5 ? 1 : -1);
                            this.timer = Math.random() * 140 + 70;
                            this.speed = this.baseSpeed;
                        }
                    }

                    if (this.dir !== 0) {
                        if (this.hasHazardAhead(this.dir) || this.hasLethalDropAhead(this.dir)) {
                            if (!this.hasHazardAhead(-this.dir) && !this.hasLethalDropAhead(-this.dir)) {
                                this.dir = -this.dir;
                                this.timer = Math.random() * 100 + 50;
                            } else {
                                this.dir = 0;
                                this.timer = 50;
                            }
                        }
                    }

                    this.vx = this.dir * this.speed;
                }
            }

            if (this.vx !== 0 && (this.isGrounded || currentlyInWater)) {
                const moveDir = this.vx > 0 ? 1 : -1;
                const checkX = Math.floor((this.x + this.width / 2 + moveDir * (this.width / 2 + 5)) / TILE_SIZE);
                const footY = Math.floor((this.y + this.height - 5) / TILE_SIZE);
                const headY = Math.floor((this.y + 5) / TILE_SIZE);
                if (checkX >= 0 && checkX < curWorldW) {
                    const b = activeWorld?.[checkX]?.[footY];
                    const upperB = activeWorld?.[checkX]?.[headY - 1];
                    if (isSolidWorldBlock(checkX, footY, b) && !isSolidWorldBlock(checkX, headY - 1, upperB) && !isWater(checkX, headY - 1)) {
                        this.vy = JUMP_FORCE * 0.85;
                        this.isGrounded = false;
                    }
                }
            }

            const prevX = this.x;
            this.applyPhysics();
            const actualMoved = Math.abs(this.x - prevX);

            if (actualMoved > 0.05 && (this.isGrounded || currentlyInWater)) {
                this.walkAnimTime = (this.walkAnimTime || 0) + (actualMoved / (this.baseSpeed || 1)) * 0.22;
            } else {
                this.walkAnimTime = 0;
            }
        }
    }

    export class Pig extends Animal {
        constructor(x, y) {
            super(x, y, TILE_SIZE * 0.85, TILE_SIZE * 0.65, 10, MOVE_SPEED * 0.3);
        }

        isTemptedBy(itemId) {
            return itemId === IDS.WHEAT || itemId === IDS.APPLE;
        }

        update() {
            this.updateAnimalAI();
        }

        takeDamage(amt, knockbackDir) {
            if (this.damageCooldown > 0) return;
            this.health -= amt;
            this.damageCooldown = 15;
            this.vy = -4;
            this.vx = knockbackDir * 6;
            this.panic = true;
            this.panicTimer = 180;
            this.dir = knockbackDir || (Math.random() > 0.5 ? 1 : -1);
            for (let i = 0; i < 6; i++) particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ffafcc'));
            for (let i = 0; i < 3; i++) particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#f43f5e'));
            floatingTexts.push(new FloatingText(this.x + this.width / 2, this.y - 10, amt, "#ffcc00"));
        }

        draw(ctx, camX, camY) {
            const drawX = this.x - camX;
            const drawY = this.y - camY;
            const w = this.width;
            const h = this.height;

            if (advancedGraphics) {
                ctx.drawImage(cachedShadowCanvas, drawX + w / 2 - w / 2.2, drawY + h - 6, w * (2 / 2.2), 8);
            }

            ctx.save();
            ctx.translate(drawX + w / 2, drawY + h / 2);
            if (this.dir < 0) ctx.scale(-1, 1);

            const isMoving = Math.abs(this.vx) > 0.05;
            const walk = this.walkAnimTime || 0;
            const idle = Math.sin((frameCount + this.idleSeed) * 0.07);
            const bodyBob = isMoving ? Math.abs(Math.sin(walk * 2)) * 1.2 : idle * 0.6;
            const isBlinking = ((frameCount + Math.floor(this.idleSeed)) % 200 < 8);

            const isDamaged = this.damageCooldown > 0;
            const bodyBase = isDamaged ? '#ff4d4d' : '#f472b6';
            const bodyHigh = isDamaged ? '#ff9999' : '#fbcfe8';
            const bodyShade = isDamaged ? '#b91c1c' : '#db2777';
            const hoofColor = isDamaged ? '#450a0a' : '#500724';
            const nearHoof = isDamaged ? '#7f1d1d' : '#831843';
            const snoutBase = isDamaged ? '#ff8080' : '#fb7185';
            const snoutHigh = isDamaged ? '#ffcccc' : '#fda4af';
            const nostril = isDamaged ? '#990000' : '#881337';
            const blush = isDamaged ? '#b91c1c' : '#f43f5e';

            const farLegSwing = isMoving ? Math.sin(walk) * 3 : 0;
            const nearLegSwing = isMoving ? -Math.sin(walk) * 3 : 0;
            const farLegLift = (isMoving && Math.sin(walk) > 0) ? Math.sin(walk) * 1.5 : 0;
            const nearLegLift = (isMoving && -Math.sin(walk) > 0) ? -Math.sin(walk) * 1.5 : 0;

            // 1. Far Legs (Back and Front)
            ctx.fillStyle = bodyShade;
            ctx.fillRect(-w * 0.44 + farLegSwing, h * 0.15 - farLegLift, w * 0.17, h * 0.35);
            ctx.fillRect(w * 0.05 - farLegSwing, h * 0.15 - nearLegLift, w * 0.17, h * 0.35);
            // Far Hooves
            ctx.fillStyle = hoofColor;
            ctx.fillRect(-w * 0.44 + farLegSwing, h * 0.5 - 2 - farLegLift, w * 0.17, 3);
            ctx.fillRect(w * 0.05 - farLegSwing, h * 0.5 - 2 - nearLegLift, w * 0.17, 3);

            // 2. Curly Tail (Back)
            const tailWiggle = Math.sin(frameCount * (this.panic ? 0.6 : 0.25)) * 1.5;
            ctx.fillStyle = snoutBase;
            ctx.fillRect(-w * 0.5 - 3, -h * 0.18 + bodyBob + tailWiggle, 3, 2);
            ctx.fillRect(-w * 0.5 - 4, -h * 0.18 + bodyBob + tailWiggle - 3, 2, 3);
            ctx.fillRect(-w * 0.5 - 2, -h * 0.18 + bodyBob + tailWiggle - 4, 3, 2);

            // 3. Torso / Body
            ctx.fillStyle = bodyBase;
            ctx.fillRect(-w * 0.5, -h * 0.48 + bodyBob, w * 0.68, h * 0.68);
            // Body Top Highlight
            ctx.fillStyle = bodyHigh;
            ctx.fillRect(-w * 0.48, -h * 0.48 + bodyBob, w * 0.64, 3);
            // Body Belly Shadow
            ctx.fillStyle = bodyShade;
            ctx.fillRect(-w * 0.5, h * 0.12 + bodyBob, w * 0.68, 3);

            // 4. Head & Neck
            const headBob = bodyBob * 0.8;
            ctx.fillStyle = bodyBase;
            ctx.fillRect(w * 0.08, -h * 0.54 + headBob, w * 0.38, h * 0.64);
            ctx.fillStyle = bodyHigh;
            ctx.fillRect(w * 0.1, -h * 0.54 + headBob, w * 0.34, 3);
            ctx.fillStyle = bodyShade;
            ctx.fillRect(w * 0.08, h * 0.04 + headBob, w * 0.38, 2);

            // Cute Floppy Ear
            const earTwitch = Math.sin(frameCount * 0.12) * 0.8;
            ctx.fillStyle = snoutBase;
            ctx.fillRect(w * 0.16, -h * 0.54 - 4 + headBob + earTwitch, 4, 5);
            ctx.fillStyle = isDamaged ? '#7f1d1d' : '#be123c';
            ctx.fillRect(w * 0.18, -h * 0.54 - 3 + headBob + earTwitch, 2, 3);

            // Rosy Cheek Blush
            ctx.fillStyle = blush;
            ctx.fillRect(w * 0.22, -h * 0.12 + headBob, 4, 3);

            // Cute Eye
            if (isBlinking) {
                ctx.fillStyle = nearHoof;
                ctx.fillRect(w * 0.24, -h * 0.28 + headBob, 4, 1.5);
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(w * 0.23, -h * 0.34 + headBob, 5, 4.5);
                ctx.fillStyle = '#1e1b4b';
                ctx.fillRect(w * 0.27, -h * 0.34 + headBob, 2.5, 4.5);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(w * 0.24, -h * 0.34 + headBob, 1.5, 1.5);
            }

            // 3D Snout
            ctx.fillStyle = snoutBase;
            ctx.fillRect(w * 0.38, -h * 0.26 + headBob, w * 0.18, h * 0.36);
            ctx.fillStyle = snoutHigh;
            ctx.fillRect(w * 0.38, -h * 0.26 + headBob, w * 0.18, 2);
            // Nostrils
            ctx.fillStyle = nostril;
            ctx.fillRect(w * 0.52, -h * 0.18 + headBob, 2, 2.5);
            ctx.fillRect(w * 0.52, -h * 0.04 + headBob, 2, 2.5);

            // 5. Near Legs (Back and Front)
            ctx.fillStyle = bodyBase;
            ctx.fillRect(-w * 0.30 + nearLegSwing, h * 0.18 - nearLegLift, w * 0.17, h * 0.32);
            ctx.fillRect(w * 0.20 + farLegSwing, h * 0.18 - farLegLift, w * 0.17, h * 0.32);
            // Near Hooves
            ctx.fillStyle = nearHoof;
            ctx.fillRect(-w * 0.30 + nearLegSwing, h * 0.5 - 2 - nearLegLift, w * 0.17, 3);
            ctx.fillRect(w * 0.20 + farLegSwing, h * 0.5 - 2 - farLegLift, w * 0.17, 3);

            ctx.restore();
        }
    }

    export class Chicken extends Animal {
        constructor(x, y) {
            super(x, y, TILE_SIZE * 0.5, TILE_SIZE * 0.6, 4, MOVE_SPEED * 0.25);
            this.peckTimer = 0;
        }

        isTemptedBy(itemId) {
            return itemId === IDS.SEEDS || itemId === IDS.WHEAT || itemId === IDS.SAPLING;
        }

        update() {
            this.updateAnimalAI();
            if (this.vy > 2.2) this.vy = 2.2;
            if (this.vx === 0 && Math.random() < 0.012 && this.peckTimer <= 0) {
                this.peckTimer = 22;
            }
            if (this.peckTimer > 0) this.peckTimer--;
        }

        takeDamage(amt, knockbackDir) {
            if (this.damageCooldown > 0) return;
            this.health -= amt;
            this.damageCooldown = 15;
            this.vy = -4;
            this.vx = knockbackDir * 6;
            this.panic = true;
            this.panicTimer = 180;
            this.dir = knockbackDir || (Math.random() > 0.5 ? 1 : -1);
            for (let i = 0; i < 6; i++) particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ffffff'));
            for (let i = 0; i < 3; i++) particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ef4444'));
            floatingTexts.push(new FloatingText(this.x + this.width / 2, this.y - 10, amt, "#ffcc00"));
        }

        draw(ctx, camX, camY) {
            const drawX = this.x - camX;
            const drawY = this.y - camY;
            const w = this.width;
            const h = this.height;

            if (advancedGraphics) {
                ctx.drawImage(cachedShadowCanvas, drawX + w / 2 - w / 2.2, drawY + h - 5, w * (2 / 2.2), 7);
            }

            ctx.save();
            ctx.translate(drawX + w / 2, drawY + h / 2);
            if (this.dir < 0) ctx.scale(-1, 1);

            const isMoving = Math.abs(this.vx) > 0.05;
            const isAirborne = !this.isGrounded || this.vy > 0.5;
            const walk = this.walkAnimTime || 0;
            const idle = Math.sin((frameCount + this.idleSeed) * 0.08);
            const isBlinking = ((frameCount + Math.floor(this.idleSeed)) % 190 < 8);

            const isDamaged = this.damageCooldown > 0;
            const featherWhite = isDamaged ? '#ff7f7f' : '#ffffff';
            const featherShade = isDamaged ? '#ff4d4d' : '#cbd5e1';
            const featherDark = isDamaged ? '#cc0000' : '#94a3b8';
            const combRed = isDamaged ? '#b91c1c' : '#ef4444';
            const combLight = isDamaged ? '#f87171' : '#fca5a5';
            const wattleRed = isDamaged ? '#991b1b' : '#dc2626';
            const beakAmber = isDamaged ? '#d97706' : '#f59e0b';
            const beakLight = isDamaged ? '#fde047' : '#fbbf24';
            const legYellow = isDamaged ? '#ca8a04' : '#f59e0b';
            const clawDark = isDamaged ? '#854d0e' : '#d97706';

            // Head Bobbing & Pecking Animation
            const headBobX = isMoving ? Math.sin(walk) * 2 : 0;
            const peckBobY = (this.peckTimer > 0) ? Math.sin(this.peckTimer / 22 * Math.PI) * 3.5 : 0;
            const headBobY = (isMoving ? Math.abs(Math.sin(walk)) * 1 : idle * 0.4) + peckBobY;

            // Wing Flapping Animation
            let wingAngle = 0;
            if (isAirborne) {
                wingAngle = Math.sin(frameCount * 0.8) * 0.5;
            } else if (this.panic) {
                wingAngle = Math.sin(frameCount * 0.6) * 0.35;
            } else if (isMoving) {
                wingAngle = Math.sin(walk) * 0.12;
            }

            // Leg Swings
            const leftLegSwing = isMoving ? Math.sin(walk) * 3 : 0;
            const rightLegSwing = isMoving ? -Math.sin(walk) * 3 : 0;
            const leftLegLift = (isMoving && Math.sin(walk) < 0) ? Math.abs(Math.sin(walk)) * 2 : 0;
            const rightLegLift = (isMoving && -Math.sin(walk) < 0) ? Math.abs(Math.sin(walk)) * 2 : 0;

            // 1. Far Leg
            ctx.fillStyle = clawDark;
            ctx.fillRect(-w * 0.18 + leftLegSwing, h * 0.2 - leftLegLift, 2.5, h * 0.28);
            // Far Foot / Claws
            ctx.fillRect(-w * 0.18 + leftLegSwing - 1, h * 0.48 - 1 - leftLegLift, 5, 2);

            // 2. Tail Feathers (Upturned at back)
            const tailWiggle = Math.sin(frameCount * 0.15) * 0.6;
            ctx.fillStyle = featherWhite;
            ctx.fillRect(-w * 0.5, -h * 0.32 + tailWiggle, 4, 6);
            ctx.fillRect(-w * 0.54, -h * 0.40 + tailWiggle, 3, 5);
            ctx.fillStyle = featherShade;
            ctx.fillRect(-w * 0.48, -h * 0.24 + tailWiggle, 3, 3);

            // 3. Body
            ctx.fillStyle = featherWhite;
            ctx.fillRect(-w * 0.42, -h * 0.28, w * 0.62, h * 0.5);
            ctx.fillStyle = featherShade;
            ctx.fillRect(-w * 0.42, h * 0.14, w * 0.62, 3);
            ctx.fillStyle = featherDark;
            ctx.fillRect(-w * 0.42, h * 0.20, w * 0.45, 1.5);

            // 4. Head & Neck
            const hx = w * 0.12 + headBobX;
            const hy = -h * 0.54 + headBobY;
            ctx.fillStyle = featherWhite;
            ctx.fillRect(hx, hy, w * 0.34, h * 0.42);
            ctx.fillStyle = featherShade;
            ctx.fillRect(hx, hy + h * 0.36, w * 0.34, 2);

            // Red Comb (Head crown)
            ctx.fillStyle = combRed;
            ctx.fillRect(hx + 2, hy - 4, 3, 4);
            ctx.fillRect(hx + 5, hy - 6, 3, 6);
            ctx.fillRect(hx + 8, hy - 3, 3, 3);
            ctx.fillStyle = combLight;
            ctx.fillRect(hx + 3, hy - 4, 1.5, 2);
            ctx.fillRect(hx + 6, hy - 5, 1.5, 3);

            // Red Wattle (under chin)
            ctx.fillStyle = wattleRed;
            ctx.fillRect(hx + w * 0.24, hy + h * 0.32, 3, 4);

            // Amber Beak
            ctx.fillStyle = beakAmber;
            ctx.fillRect(hx + w * 0.28, hy + h * 0.14, 5, 3.5);
            ctx.fillStyle = beakLight;
            ctx.fillRect(hx + w * 0.28, hy + h * 0.14, 5, 1.5);
            ctx.fillStyle = clawDark;
            ctx.fillRect(hx + w * 0.28, hy + h * 0.24, 4, 1);

            // Eye
            if (isBlinking) {
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(hx + 4, hy + h * 0.14, 3, 1.5);
            } else {
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(hx + 4, hy + h * 0.10, 3.5, 3.5);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(hx + 4, hy + h * 0.10, 1.5, 1.5);
            }

            // 5. Wing (Flapping overlay)
            ctx.save();
            ctx.translate(-w * 0.08, -h * 0.12);
            ctx.rotate(wingAngle);
            ctx.fillStyle = featherWhite;
            ctx.fillRect(-w * 0.24, -h * 0.12, w * 0.44, h * 0.32);
            ctx.fillStyle = featherShade;
            ctx.fillRect(-w * 0.22, h * 0.12, w * 0.40, 2);
            ctx.fillStyle = featherDark;
            ctx.fillRect(-w * 0.12, 0, w * 0.26, 1.5);
            ctx.restore();

            // 6. Near Leg
            ctx.fillStyle = legYellow;
            ctx.fillRect(w * 0.06 + rightLegSwing, h * 0.2 - rightLegLift, 2.5, h * 0.28);
            // Near Foot / Claws
            ctx.fillStyle = clawDark;
            ctx.fillRect(w * 0.06 + rightLegSwing - 1, h * 0.48 - 1 - rightLegLift, 5, 2);

            ctx.restore();
        }
    }

    export class Pigeon extends Animal {
        constructor(x, y) {
            super(x, y, TILE_SIZE * 0.54, TILE_SIZE * 0.48, 20, MOVE_SPEED * 0.28);
            this.state = 'ground'; // 'ground' | 'flying' | 'perching'
            this.peckTimer = 0;
            this.perchTimer = 0;
            this.flightTimer = 0;
            this.flyTargetX = x;
            this.flyTargetY = y;
            this.flapTime = Math.random() * 100;
            this.targetLeaf = null;
            this.partner = null;
            this.headTilt = 0;
            this.headTiltTimer = 0;
            this.temptAlertTimer = 0;
        }

        isTemptedBy(itemId) {
            return itemId === IDS.SEEDS;
        }

        startle(scareDir) {
            if (this.state === 'perching') {
                this.targetLeaf = null;
            }
            this.state = 'flying';
            this.panic = true;
            this.panicTimer = 180;
            this.dir = scareDir || (Math.random() > 0.5 ? 1 : -1);
            this.vy = -4.5;
            this.vx = this.dir * (3.5 + Math.random() * 1.5);
            this.isGrounded = false;
            this.flightTimer = 350 + Math.random() * 300;
            this.flyTargetX = this.x + this.dir * (200 + Math.random() * 150);
            this.flyTargetY = Math.max(2 * TILE_SIZE, this.y - (120 + Math.random() * 100));

            for (let i = 0; i < 5; i++) {
                const p = new Particle(this.x + this.width / 2, this.y + this.height / 2, '#94a3b8');
                p.vx = (Math.random() - 0.5) * 3;
                p.vy = (Math.random() - 0.5) * 3;
                particles.push(p);
            }

            if (this.partner && !this.partner.panic && Math.hypot(this.partner.x - this.x, this.partner.y - this.y) < 300) {
                this.partner.startle(this.dir);
            }
        }

        alertTempted(playerX, playerY) {
            this.temptAlertTimer = 80;
            if (this.state === 'flying') {
                this.flyTargetX = playerX + (this.x < playerX ? -50 : 50);
                this.flyTargetY = playerY - 10;
            } else if (this.state === 'perching') {
                if (Math.random() < 0.05) {
                    this.state = 'flying';
                    this.targetLeaf = null;
                    this.flightTimer = 200;
                    this.flyTargetX = playerX + (this.x < playerX ? -50 : 50);
                    this.flyTargetY = playerY - 10;
                }
            }
        }

        findNearbyTreeLeaf(searchRadiusTiles = 12) {
            const activeWorld = this.getActiveWorld();
            if (!activeWorld) return null;
            const curWorldW = activeWorld.length;
            const curWorldH = activeWorld[0]?.length || WORLD_HEIGHT;
            const curGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const curGy = Math.floor((this.y + this.height / 2) / TILE_SIZE);

            const radX = Math.min(10, searchRadiusTiles);
            const radY = 8;
            const minX = Math.max(2, curGx - radX);
            const maxX = Math.min(curWorldW - 3, curGx + radX);
            const minY = Math.max(2, curGy - radY);
            const maxY = Math.min(curWorldH - 3, curGy + radY);

            let bestSpot = null;
            let bestDistSq = Infinity;

            for (let x = minX; x <= maxX; x++) {
                if (!activeWorld[x]) continue;
                for (let y = minY; y <= maxY; y++) {
                    if (activeWorld[x][y] === IDS.LEAVES || activeWorld[x][y] === IDS.JUNGLE_LEAVES) {
                        if (activeWorld[x][y - 1] === IDS.AIR) {
                            const dx = x - curGx;
                            const dy = y - curGy;
                            const distSq = dx * dx + dy * dy;
                            if (distSq < bestDistSq) {
                                bestDistSq = distSq;
                                bestSpot = { x, y };
                                if (distSq < 16) return bestSpot;
                            }
                        }
                    }
                }
            }
            return bestSpot;
        }

        update() {
            if (this.damageCooldown > 0) this.damageCooldown--;
            if (this.panicTimer > 0) this.panicTimer--;
            else this.panic = false;
            if (this.peckTimer > 0) this.peckTimer--;
            if (this.temptAlertTimer > 0) this.temptAlertTimer--;

            const activeWorld = this.getActiveWorld();
            const curWorldW = activeWorld ? activeWorld.length : WORLD_WIDTH;
            const curWorldH = activeWorld ? (activeWorld[0]?.length || WORLD_HEIGHT) : WORLD_HEIGHT;
            const activeHeights = this.getActiveTerrain();

            if (this.headTiltTimer > 0) {
                this.headTiltTimer--;
            } else if (Math.random() < 0.02) {
                this.headTilt = (Math.random() - 0.5) * 0.35;
                this.headTiltTimer = Math.floor(Math.random() * 40 + 20);
            } else {
                this.headTilt = 0;
            }

            if (!this.partner || this.partner.health <= 0) {
                this.partner = null;
                if (Math.random() < 0.02) {
                    const nearbyPigeons = entities.filter(e => e instanceof Pigeon && e !== this && !e.partner && Math.hypot(e.x - this.x, e.y - this.y) < 220);
                    if (nearbyPigeons.length > 0) {
                        const companion = nearbyPigeons[Math.floor(Math.random() * nearbyPigeons.length)];
                        this.partner = companion;
                        companion.partner = this;
                    }
                }
            }

            let pDist = 9999;
            let isHoldingSeeds = false;
            if (player && !player.isDead) {
                pDist = Math.hypot(
                    (player.x + player.width / 2) - (this.x + this.width / 2),
                    (player.y + player.height / 2) - (this.y + this.height / 2)
                );
                const held = inventory[selectedHotbarIndex];
                isHoldingSeeds = (held && this.isTemptedBy(held.id));
            }

            // 1. Skittish startle check
            if (!this.panic && player && !player.isDead) {
                if (!isHoldingSeeds && pDist < 95) {
                    const scareDir = (player.x < this.x) ? 1 : -1;
                    this.startle(scareDir);
                } else if (isHoldingSeeds && pDist < 25) {
                    const scareDir = (player.x < this.x) ? 1 : -1;
                    this.startle(scareDir);
                }
            }

            // 2. Seeds temptation & Flocking Call
            let isTemptedNow = false;
            if (isHoldingSeeds && pDist < 360 && !this.panic) {
                isTemptedNow = true;
                this.isTempted = true;

                if (frameCount % 30 === 0) {
                    const others = entities.filter(e => e instanceof Pigeon && e !== this && Math.hypot(e.x - this.x, e.y - this.y) < 280);
                    others.forEach(p => p.alertTempted(player.x, player.y));
                }

                if (frameCount % 75 === 0 && Math.random() < 0.4) {
                    particles.push(new Particle(this.x + this.width / 2, this.y - 4, '#ff80bf'));
                }
            } else {
                this.isTempted = (this.temptAlertTimer > 0);
            }

            // 3. State Machine
            if (this.state === 'perching') {
                this.vx = 0;
                this.vy = 0;
                this.isGrounded = true;

                if (this.targetLeaf) {
                    const block = activeWorld?.[this.targetLeaf.x]?.[this.targetLeaf.y];
                    if (block !== IDS.LEAVES && block !== IDS.JUNGLE_LEAVES) {
                        this.targetLeaf = null;
                        this.state = 'flying';
                        this.flightTimer = 300;
                    }
                }

                this.perchTimer--;
                if (Math.random() < 0.01) this.dir = -this.dir;

                if (this.perchTimer <= 0) {
                    this.state = 'flying';
                    this.targetLeaf = null;
                    this.flightTimer = 350 + Math.random() * 450;
                    this.vy = -3;
                    this.vx = this.dir * (1.5 + Math.random());
                    this.isGrounded = false;
                }
            }
            else if (this.state === 'ground') {
                if (this.panic) {
                    this.state = 'flying';
                    this.vy = -4.5;
                    this.flightTimer = 350;
                } else if (isTemptedNow) {
                    const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
                    this.dir = dx > 0 ? 1 : -1;
                    if (pDist > 55) {
                        this.vx = this.dir * this.baseSpeed * 1.1;
                    } else {
                        this.vx = 0;
                        if (Math.random() < 0.03 && this.peckTimer <= 0) this.peckTimer = 20;
                    }
                } else {
                    this.timer--;
                    if (this.timer <= 0) {
                        const roll = Math.random();
                        if (roll < 0.35) {
                            this.dir = 0;
                            this.peckTimer = 26;
                            this.timer = Math.random() * 60 + 30;
                        } else if (roll < 0.70) {
                            let partnerDir = 0;
                            if (this.partner && Math.hypot(this.partner.x - this.x, this.partner.y - this.y) > 40) {
                                partnerDir = this.partner.x > this.x ? 1 : -1;
                            }
                            this.dir = partnerDir !== 0 ? partnerDir : (Math.random() > 0.5 ? 1 : -1);
                            this.timer = Math.random() * 120 + 60;
                        } else {
                            this.state = 'flying';
                            this.flightTimer = 400 + Math.random() * 500;
                            this.vy = -3.8;
                            this.isGrounded = false;
                        }
                    }

                    if (this.dir !== 0 && (this.hasHazardAhead(this.dir) || this.hasLethalDropAhead(this.dir))) {
                        this.dir = -this.dir;
                        this.timer = 50;
                    }

                    this.vx = this.dir * this.baseSpeed;
                }

                if (this.vx !== 0 && this.isGrounded) {
                    const moveDir = this.vx > 0 ? 1 : -1;
                    const checkX = Math.floor((this.x + this.width / 2 + moveDir * (this.width / 2 + 4)) / TILE_SIZE);
                    const footY = Math.floor((this.y + this.height - 4) / TILE_SIZE);
                    const headY = Math.floor((this.y + 4) / TILE_SIZE);
                    if (checkX >= 0 && checkX < curWorldW) {
                        const b = activeWorld?.[checkX]?.[footY];
                        const upperB = activeWorld?.[checkX]?.[headY - 1];
                        if (isSolidWorldBlock(checkX, footY, b) && !isSolidWorldBlock(checkX, headY - 1, upperB) && !isWater(checkX, headY - 1)) {
                            this.vy = JUMP_FORCE * 0.75;
                            this.isGrounded = false;
                        }
                    }
                }

                const prevX = this.x;
                this.applyPhysics();
                const actualMoved = Math.abs(this.x - prevX);

                if (actualMoved > 0.05 && this.isGrounded) {
                    this.walkAnimTime = (this.walkAnimTime || 0) + (actualMoved / this.baseSpeed) * 0.25;
                } else {
                    this.walkAnimTime = 0;
                }

                if (!this.isGrounded && this.vy > 3.0) {
                    this.state = 'flying';
                    this.flightTimer = 300;
                }
            }
            else {
                this.flightTimer--;
                this.flapTime += (this.panic ? 0.65 : 0.38);

                const curGx = Math.max(0, Math.min(curWorldW - 1, Math.floor((this.x + this.width / 2) / TILE_SIZE)));
                const groundY = (activeHeights && activeHeights[curGx] !== undefined) ? activeHeights[curGx] : Math.floor(curWorldH / 2);
                const cruiseAltitudeY = Math.max(2 * TILE_SIZE, (groundY - 8) * TILE_SIZE);

                if (this.panic) {
                    this.flyTargetY = Math.max(2 * TILE_SIZE, cruiseAltitudeY - 3 * TILE_SIZE);
                    this.flyTargetX = this.x + this.dir * 120;
                } else if (isTemptedNow && player && !player.isDead) {
                    this.flyTargetX = player.x + (this.x < player.x ? -45 : 45);
                    this.flyTargetY = player.y - 12;
                    this.targetLeaf = null;
                } else if (this.targetLeaf) {
                    this.flyTargetX = this.targetLeaf.x * TILE_SIZE + (TILE_SIZE - this.width) / 2;
                    this.flyTargetY = (this.targetLeaf.y - 1) * TILE_SIZE + (TILE_SIZE - this.height);
                } else {
                    if (this.flightTimer % 120 === 0 || Math.abs(this.x - this.flyTargetX) < 30) {
                        const roamDistance = (Math.random() - 0.5) * 250;
                        this.flyTargetX = Math.max(50, Math.min(curWorldW * TILE_SIZE - 50, this.x + roamDistance));
                        this.flyTargetY = cruiseAltitudeY + (Math.random() - 0.5) * 50;

                        if (this.flightTimer < 250 && Math.random() < 0.45) {
                            const leafSpot = this.findNearbyTreeLeaf(18);
                            if (leafSpot) {
                                this.targetLeaf = leafSpot;
                            }
                        } else if (this.flightTimer < 100 && Math.random() < 0.4) {
                            this.flyTargetY = (groundY - 1) * TILE_SIZE;
                        }
                    }
                }

                const dx = this.flyTargetX - this.x;
                const dy = this.flyTargetY - this.y;
                const maxFlightSpeed = this.panic ? 4.2 : 2.4;
                const maxClimbSpeed = this.panic ? 3.2 : 1.8;

                const desiredVx = Math.sign(dx) * Math.min(Math.abs(dx) * 0.05, maxFlightSpeed);
                const desiredVy = Math.sign(dy) * Math.min(Math.abs(dy) * 0.05, maxClimbSpeed);

                this.vx += (desiredVx - this.vx) * 0.07;
                this.vy += (desiredVy - this.vy) * 0.07;
                this.vy += Math.sin(this.flapTime) * 0.18;

                if (Math.abs(this.vx) > 0.1) {
                    this.dir = this.vx > 0 ? 1 : -1;
                }

                this.x += this.vx;
                this.handleCollisions(true);

                this.y += this.vy;
                this.handleCollisions(false);

                if (this.targetLeaf) {
                    const leafTargetX = this.targetLeaf.x * TILE_SIZE + (TILE_SIZE - this.width) / 2;
                    const leafTargetY = (this.targetLeaf.y - 1) * TILE_SIZE + (TILE_SIZE - this.height);
                    if (Math.hypot(this.x - leafTargetX, this.y - leafTargetY) < 8 && this.vy >= -0.5) {
                        this.state = 'perching';
                        this.x = leafTargetX;
                        this.y = leafTargetY;
                        this.vx = 0;
                        this.vy = 0;
                        this.isGrounded = true;
                        this.perchTimer = 300 + Math.random() * 450;
                    }
                }

                if (this.isGrounded && this.vy >= 0 && !this.targetLeaf) {
                    this.state = 'ground';
                    this.vx = 0;
                    this.timer = 80 + Math.random() * 100;
                }
            }
        }

        takeDamage(amt, knockbackDir) {
            if (this.damageCooldown > 0) return;
            this.health -= amt;
            this.damageCooldown = 20;
            const escapeDir = knockbackDir || (Math.random() > 0.5 ? 1 : -1);
            this.startle(escapeDir);

            for (let i = 0; i < 6; i++) {
                particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#64748b'));
            }
            for (let i = 0; i < 3; i++) {
                particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ef4444'));
            }
            floatingTexts.push(new FloatingText(this.x + this.width / 2, this.y - 10, amt, "#ffcc00"));
        }

        draw(ctx, camX, camY) {
            const drawX = this.x - camX;
            const drawY = this.y - camY;
            const w = this.width;
            const h = this.height;

            if (advancedGraphics && this.state !== 'flying') {
                ctx.drawImage(cachedShadowCanvas, drawX + w / 2 - w * 0.45, drawY + h - 3, w * 0.9, 5);
            }

            ctx.save();
            ctx.translate(drawX + w / 2, drawY + h / 2);
            if (this.dir < 0) ctx.scale(-1, 1);

            const isDamaged = this.damageCooldown > 0;
            const isFlying = (this.state === 'flying');
            const isGrounded = (this.state === 'ground' && this.isGrounded);
            const isMoving = Math.abs(this.vx) > 0.05 && isGrounded;
            const walk = this.walkAnimTime || 0;
            const idle = Math.sin((frameCount + this.idleSeed) * 0.07);
            const isBlinking = ((frameCount + Math.floor(this.idleSeed)) % 190 < 6);

            // Shimmering iridescent neck cycle
            const shimmerTime = (frameCount * 0.09 + this.idleSeed);
            const shimmerVal = (Math.sin(shimmerTime) + 1) * 0.5;

            // Palette setup with damage flash override
            const cHeadBase = isDamaged ? '#ff7070' : '#334155';
            const cHeadTop = isDamaged ? '#ffa0a0' : '#475569';
            const cHeadDark = isDamaged ? '#cc4444' : '#1e293b';

            const cBreastBase = isDamaged ? '#ff8080' : '#4b5563';
            const cBreastHigh = isDamaged ? '#ffa5a5' : '#64748b';
            const cBreastDark = isDamaged ? '#cc4444' : '#334155';
            const cBellyDark = isDamaged ? '#aa3333' : '#1e293b';

            const cWingShield = isDamaged ? '#ffb0b0' : '#94a3b8';
            const cWingLight = isDamaged ? '#ffd0d0' : '#cbd5e1';
            const cWingBar = isDamaged ? '#991111' : '#0f172a';
            const cWingPrimaries = isDamaged ? '#bb2222' : '#1e293b';

            const cTailGrey = isDamaged ? '#ffa0a0' : '#475569';
            const cTailBar = isDamaged ? '#880000' : '#0f172a';
            const cTailEdge = isDamaged ? '#ffe0e0' : '#e2e8f0';

            const cCereWhite = isDamaged ? '#ffcccc' : '#f8fafc';
            const cBeakSlate = isDamaged ? '#333333' : '#1e293b';
            const cBeakTip = isDamaged ? '#222222' : '#0f172a';

            const cEyeOrange = isDamaged ? '#ff4444' : '#ea580c';
            const cEyeRing = isDamaged ? '#ff8888' : '#64748b';

            const cFootCoral = isDamaged ? '#ff4444' : '#f43f5e';
            const cFootDark = isDamaged ? '#b91c1c' : '#9f1239';
            const cClaw = isDamaged ? '#444444' : '#334155';

            // Dynamic emerald and purple iridescence
            const cIridGreen = isDamaged ? '#ff9999' : (shimmerVal > 0.4 ? '#10b981' : '#059669');
            const cIridPurple = isDamaged ? '#ff7777' : (shimmerVal > 0.6 ? '#c084fc' : '#7c3aed');
            const cIridGlint = isDamaged ? '#ffffff' : (shimmerVal > 0.5 ? '#34d399' : '#a855f7');

            // Animations
            const headBobX = isMoving ? Math.sin(walk) * 2.4 : (isFlying ? 1.2 : 0);
            const peckBobY = (this.peckTimer > 0) ? Math.sin(this.peckTimer / 26 * Math.PI) * 4.5 : 0;
            const headBobY = (isMoving ? Math.abs(Math.sin(walk)) * 1.3 : idle * 0.35) + peckBobY + (this.headTilt * 3);

            let wingAngle = 0;
            if (isFlying) {
                wingAngle = Math.sin(this.flapTime) * 0.85;
                const flyTilt = Math.max(-0.35, Math.min(0.35, this.vy * 0.08));
                ctx.rotate(flyTilt);
            } else if (this.panic) {
                wingAngle = Math.sin(frameCount * 0.65) * 0.4;
            }

            const walkSwing = isMoving ? Math.sin(walk) * 3.2 : 0;
            const walkLiftFar = (isMoving && Math.sin(walk) < 0) ? Math.abs(Math.sin(walk)) * 2.2 : 0;
            const walkLiftNear = (isMoving && -Math.sin(walk) < 0) ? Math.abs(Math.sin(walk)) * 2.2 : 0;

            // 1. Far Leg & Claws (Behind Body)
            if (!isFlying) {
                ctx.fillStyle = cFootDark;
                // Shank
                ctx.fillRect(-w * 0.12 + walkSwing, h * 0.20 - walkLiftFar, 2, h * 0.26);
                // Back toe
                ctx.fillRect(-w * 0.12 + walkSwing - 2, h * 0.46 - walkLiftFar - 1, 2, 1.5);
                // Front toes with claws
                ctx.fillRect(-w * 0.12 + walkSwing + 1, h * 0.46 - walkLiftFar - 1, 4, 1.5);
                ctx.fillStyle = cClaw;
                ctx.fillRect(-w * 0.12 + walkSwing + 4.5, h * 0.46 - walkLiftFar - 0.5, 1.5, 1);
            }

            // 2. Tail & Rump
            const tailFlutter = isFlying ? Math.sin(this.flapTime * 0.5) * 0.5 : Math.sin(frameCount * 0.12) * 0.4;
            ctx.save();
            ctx.translate(-w * 0.42, -h * 0.05 + tailFlutter);
            // Pale grey rump
            ctx.fillStyle = cWingShield;
            ctx.fillRect(0, -h * 0.14, 3, 3);
            // Tail main body
            ctx.fillStyle = cTailGrey;
            ctx.fillRect(-w * 0.22, -h * 0.10, w * 0.24, 4.5);
            // Dark terminal bar
            ctx.fillStyle = cTailBar;
            ctx.fillRect(-w * 0.22, -h * 0.10, 3.5, 4.5);
            // White outer margin edge
            ctx.fillStyle = cTailEdge;
            ctx.fillRect(-w * 0.22, -h * 0.12, 1.5, 4.8);
            ctx.restore();

            // 3. Plump Breast & Belly Body
            // Underbelly
            ctx.fillStyle = cBellyDark;
            ctx.fillRect(-w * 0.30, h * 0.14, w * 0.54, 3);
            // Main breast / body mass
            ctx.fillStyle = cBreastBase;
            ctx.fillRect(-w * 0.32, -h * 0.22, w * 0.58, h * 0.40);
            // Puffed breast curve
            ctx.fillStyle = cBreastHigh;
            ctx.fillRect(w * 0.10, -h * 0.18, 4, h * 0.30);
            ctx.fillRect(-w * 0.15, -h * 0.20, w * 0.32, 2.5);
            // Feather scallops on breast (curved plumage markings as in photo)
            ctx.fillStyle = cBreastDark;
            ctx.fillRect(-w * 0.08, -h * 0.08, 2.5, 2);
            ctx.fillRect(w * 0.04, -h * 0.04, 2.5, 2);
            ctx.fillRect(-w * 0.02, h * 0.06, 2.5, 2);
            ctx.fillRect(w * 0.12, -h * 0.12, 2, 2);

            // 4. Head, Throat & Neck
            const hx = w * 0.16 + headBobX;
            const hy = -h * 0.46 + headBobY;

            // Neck connecting body to head
            ctx.fillStyle = cHeadBase;
            ctx.fillRect(hx - 3, hy + h * 0.16, w * 0.32, h * 0.28);
            ctx.fillStyle = cHeadDark;
            ctx.fillRect(hx - 4, hy + h * 0.22, 2, h * 0.22); // Throat/nape shadow

            // Metallic Iridescent Neck Patch (Emerald Green + Purple Shimmer)
            ctx.fillStyle = cIridGreen;
            ctx.fillRect(hx - 1, hy + h * 0.18, 3.5, 3.5);
            ctx.fillRect(hx + 3, hy + h * 0.24, 3, 3);
            ctx.fillStyle = cIridPurple;
            ctx.fillRect(hx - 2, hy + h * 0.26, 3, 3);
            ctx.fillRect(hx + 2, hy + h * 0.18, 2.5, 2);
            ctx.fillStyle = cIridGlint;
            ctx.fillRect(hx, hy + h * 0.20, 1.5, 1.5);
            ctx.fillRect(hx + 3, hy + h * 0.27, 1.5, 1.5);

            // Sleek Rounded Head
            ctx.fillStyle = cHeadBase;
            ctx.fillRect(hx - 2, hy, w * 0.34, h * 0.32);
            // Head crown highlight
            ctx.fillStyle = cHeadTop;
            ctx.fillRect(hx - 1, hy, w * 0.30, 2);
            // Subtle throat shade
            ctx.fillStyle = cHeadDark;
            ctx.fillRect(hx + 3, hy + h * 0.26, 4, 2);

            // Fiery Amber-Orange Eye
            const eyeX = hx + 4;
            const eyeY = hy + 3;
            if (isBlinking) {
                ctx.fillStyle = cHeadDark;
                ctx.fillRect(eyeX - 1, eyeY + 1, 4, 1.5);
            } else {
                // Orbital skin ring
                ctx.fillStyle = cEyeRing;
                ctx.fillRect(eyeX - 0.5, eyeY - 0.5, 4.5, 4.5);
                // Fiery orange iris
                ctx.fillStyle = cEyeOrange;
                ctx.fillRect(eyeX, eyeY, 3.5, 3.5);
                // Black pupil
                ctx.fillStyle = '#020617';
                ctx.fillRect(eyeX + 1, eyeY + 1, 2, 2);
                // Crisp white catchlight gleam
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(eyeX + 1, eyeY, 1, 1);
            }

            // Beak & White Cere
            const beakX = hx + w * 0.32;
            const beakY = hy + 4;
            // Prominent White / Ivory Cere (signature pigeon feature!)
            ctx.fillStyle = cCereWhite;
            ctx.fillRect(beakX - 1, beakY - 1, 2.5, 2);
            // Slate bill
            ctx.fillStyle = cBeakSlate;
            ctx.fillRect(beakX + 1, beakY + 0.5, 4, 2.2);
            // Curved dark tip
            ctx.fillStyle = cBeakTip;
            ctx.fillRect(beakX + 3.5, beakY + 1.8, 1.8, 1.4);

            // 5. Wing (Checkered Wing Coverts + Two Black Wing Bars + Primaries)
            ctx.save();
            ctx.translate(-w * 0.04, -h * 0.08);
            ctx.rotate(wingAngle);

            if (isFlying) {
                // Expanded Aerodynamic Wing
                // Wing coverts
                ctx.fillStyle = cWingShield;
                ctx.fillRect(-w * 0.24, -h * 0.28, w * 0.52, h * 0.46);
                // Dual black wing bars
                ctx.fillStyle = cWingBar;
                ctx.fillRect(-w * 0.20, h * 0.02, w * 0.46, 2.5);
                ctx.fillRect(-w * 0.16, -h * 0.10, w * 0.42, 2.5);
                // Dark primaries with spread feather tips
                ctx.fillStyle = cWingPrimaries;
                ctx.fillRect(-w * 0.24, h * 0.12, w * 0.54, 3.5);
                ctx.fillRect(-w * 0.20, h * 0.20, 3, 2.5);
                ctx.fillRect(-w * 0.10, h * 0.22, 3, 2.5);
                ctx.fillRect(0, h * 0.22, 3, 2.5);
                ctx.fillRect(w * 0.10, h * 0.20, 3, 2.5);
                // Inner wing lining highlight
                ctx.fillStyle = cWingLight;
                ctx.fillRect(-w * 0.18, -h * 0.24, w * 0.38, 2);
            } else {
                // Folded Wing with Checker Marks and Two Bars
                // Silvery lavender wing shield
                ctx.fillStyle = cWingShield;
                ctx.fillRect(-w * 0.24, -h * 0.14, w * 0.46, h * 0.34);
                ctx.fillStyle = cWingLight;
                ctx.fillRect(-w * 0.20, -h * 0.12, w * 0.38, 2.5);

                // Checker feather spots on upper wing
                ctx.fillStyle = cWingPrimaries;
                ctx.fillRect(-w * 0.16, -h * 0.06, 2, 2);
                ctx.fillRect(-w * 0.06, -h * 0.08, 2, 2);
                ctx.fillRect(w * 0.04, -h * 0.04, 2, 2);
                ctx.fillRect(-w * 0.10, 0, 2, 2);

                // Two Iconic Black Wing Bars
                ctx.fillStyle = cWingBar;
                ctx.fillRect(-w * 0.20, h * 0.04, w * 0.38, 2.5); // First broad bar
                ctx.fillRect(-w * 0.14, h * 0.12, w * 0.32, 2.5); // Second broad bar

                // Folded Dark Primary Flight Feathers extending back
                ctx.fillStyle = cWingPrimaries;
                ctx.fillRect(-w * 0.32, h * 0.08, w * 0.22, 4);
                ctx.fillStyle = cBeakTip;
                ctx.fillRect(-w * 0.36, h * 0.10, 3, 3);
            }
            ctx.restore();

            // 6. Near Leg & Claws (In Front)
            if (!isFlying) {
                ctx.fillStyle = cFootCoral;
                // Shank
                ctx.fillRect(w * 0.06 - walkSwing, h * 0.20 - walkLiftNear, 2.2, h * 0.26);
                // Back toe
                ctx.fillRect(w * 0.06 - walkSwing - 2, h * 0.46 - walkLiftNear - 1, 2, 1.5);
                // Front toes with claws
                ctx.fillRect(w * 0.06 - walkSwing + 1, h * 0.46 - walkLiftNear - 1, 4.5, 1.5);
                ctx.fillStyle = cClaw;
                ctx.fillRect(w * 0.06 - walkSwing + 5.2, h * 0.46 - walkLiftNear - 0.5, 1.5, 1);
            } else {
                // Tucked feet in flight
                ctx.fillStyle = cFootCoral;
                ctx.fillRect(-w * 0.10, h * 0.16, 3.5, 2);
                ctx.fillRect(w * 0.04, h * 0.16, 3.5, 2);
                ctx.fillStyle = cClaw;
                ctx.fillRect(-w * 0.12, h * 0.17, 1.5, 1);
                ctx.fillRect(w * 0.02, h * 0.17, 1.5, 1);
            }

            ctx.restore();
        }
    }

    export class Parrot extends Animal {
        constructor(x, y, variant = null) {
            super(x, y, TILE_SIZE * 0.48, TILE_SIZE * 0.52, 6, MOVE_SPEED * 0.32);
            this.state = 'ground'; // 'ground' | 'flying' | 'perching'
            this.variant = (variant !== null && variant >= 0 && variant <= 3) ? variant : Math.floor(Math.random() * 4);
            this.isTamed = false;
            this.owner = null;
            this.isSitting = false;
            this.isMounted = false;
            this.mountedShoulder = null;
            this.peckTimer = 0;
            this.perchTimer = 0;
            this.flightTimer = 0;
            this.flyTargetX = x;
            this.flyTargetY = y;
            this.flapTime = Math.random() * 100;
            this.targetLeaf = null;
            this.headTilt = 0;
            this.headTiltTimer = 0;
            this.temptAlertTimer = 0;
            this.chirpTimer = Math.floor(Math.random() * 300 + 200);
            this.hopTimer = 0;
        }

        isTemptedBy(itemId) {
            return itemId === IDS.SEEDS || itemId === IDS.MELON_SEEDS;
        }

        startle(scareDir) {
            if (this.isMounted || this.isSitting) return;
            if (this.state === 'perching') this.targetLeaf = null;
            this.state = 'flying';
            this.panic = true;
            this.panicTimer = 160;
            this.dir = scareDir || (Math.random() > 0.5 ? 1 : -1);
            this.vy = -4.5;
            this.vx = this.dir * (3.5 + Math.random() * 1.5);
            this.isGrounded = false;
            this.flightTimer = 300 + Math.random() * 250;
            this.flyTargetX = this.x + this.dir * (180 + Math.random() * 120);
            this.flyTargetY = Math.max(2 * TILE_SIZE, this.y - (100 + Math.random() * 80));

            for (let i = 0; i < 5; i++) {
                const p = new Particle(this.x + this.width / 2, this.y + this.height / 2, this.getFeatherParticleColor());
                p.vx = (Math.random() - 0.5) * 3;
                p.vy = (Math.random() - 0.5) * 3;
                particles.push(p);
            }
        }

        getFeatherParticleColor() {
            switch (this.variant) {
                case 0: return '#ef4444';
                case 1: return '#22c55e';
                case 2: return '#0ea5e9';
                case 3: return '#eab308';
                default: return '#ef4444';
            }
        }

        findNearbyTreeLeaf(searchRadiusTiles = 12) {
            const activeWorld = this.getActiveWorld();
            if (!activeWorld) return null;
            const curWorldW = activeWorld.length;
            const curWorldH = activeWorld[0]?.length || WORLD_HEIGHT;
            const curGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const curGy = Math.floor((this.y + this.height / 2) / TILE_SIZE);

            const radX = Math.min(10, searchRadiusTiles);
            const radY = 8;
            const minX = Math.max(2, curGx - radX);
            const maxX = Math.min(curWorldW - 3, curGx + radX);
            const minY = Math.max(2, curGy - radY);
            const maxY = Math.min(curWorldH - 3, curGy + radY);

            let bestSpot = null;
            let bestDistSq = Infinity;

            for (let x = minX; x <= maxX; x++) {
                if (!activeWorld[x]) continue;
                for (let y = minY; y <= maxY; y++) {
                    const block = activeWorld[x][y];
                    if (block === IDS.JUNGLE_LEAVES || block === IDS.LEAVES) {
                        if (activeWorld[x][y - 1] === IDS.AIR) {
                            const dx = x - curGx;
                            const dy = y - curGy;
                            const distSq = dx * dx + dy * dy;
                            if (distSq < bestDistSq) {
                                bestDistSq = distSq;
                                bestSpot = { x, y };
                                if (distSq < 16) return bestSpot;
                            }
                        }
                    }
                }
            }
            return bestSpot;
        }

        interact(curPlayer, inv, slotIdx) {
            const held = inv ? inv[slotIdx] : null;
            if (!this.isTamed) {
                if (held && this.isTemptedBy(held.id) && held.count > 0) {
                    held.count--;
                    if (held.count <= 0) inv[slotIdx] = null;
                    if (typeof updateUI === 'function') updateUI();

                    if (Math.random() < 0.33) {
                        this.isTamed = true;
                        this.owner = 'player';
                        this.isSitting = false;
                        playSound('parrot_tame');
                        for (let i = 0; i < 7; i++) {
                            const p = new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ef4444');
                            p.vx = (Math.random() - 0.5) * 2.5;
                            p.vy = -Math.random() * 2.5 - 0.5;
                            particles.push(p);
                        }
                        if (typeof showToast === 'function') showToast('Parrot tamed!');
                        if (typeof unlockAchievement === 'function') unlockAchievement('best_friends_forever');
                    } else {
                        playSound('pop');
                        for (let i = 0; i < 4; i++) {
                            const p = new Particle(this.x + this.width / 2, this.y + this.height / 2, '#9ca3af');
                            p.vx = (Math.random() - 0.5) * 2;
                            p.vy = -Math.random() * 2;
                            particles.push(p);
                        }
                    }
                    if (!isMultiplayer && typeof saveCurrentWorld === 'function') saveCurrentWorld();
                    return true;
                }
            } else {
                if (this.isMounted) {
                    if (curPlayer.leftShoulderParrot === this) curPlayer.leftShoulderParrot = null;
                    if (curPlayer.rightShoulderParrot === this) curPlayer.rightShoulderParrot = null;
                    this.isMounted = false;
                    this.mountedShoulder = null;
                    this.state = 'flying';
                    this.vy = -3;
                    this.flightTimer = 150;
                    playSound('parrot_chirp', { vol: 0.6 });
                    return true;
                }

                this.isSitting = !this.isSitting;
                if (this.isSitting) {
                    this.state = 'ground';
                    this.vx = 0;
                    this.vy = 0;
                    if (typeof showToast === 'function') showToast('Parrot is sitting.');
                } else {
                    if (typeof showToast === 'function') showToast('Parrot is standing.');
                }
                playSound('parrot_chirp', { vol: 0.6 });
                if (!isMultiplayer && typeof saveCurrentWorld === 'function') saveCurrentWorld();
                return true;
            }
            return false;
        }

        update() {
            if (this.isMounted) {
                const curPlayer = (typeof window !== 'undefined' && window.player) ? window.player : player;
                if (!curPlayer || curPlayer.isDead || curPlayer.health <= 0) {
                    this.isMounted = false;
                    this.mountedShoulder = null;
                    this.state = 'flying';
                    this.vy = -3;
                    return;
                }
                this.x = curPlayer.x;
                this.y = curPlayer.y;
                this.vx = 0;
                this.vy = 0;
                return;
            }

            if (this.damageCooldown > 0) this.damageCooldown--;
            if (this.panicTimer > 0) this.panicTimer--;
            else this.panic = false;
            if (this.peckTimer > 0) this.peckTimer--;
            if (this.temptAlertTimer > 0) this.temptAlertTimer--;
            if (this.hopTimer > 0) this.hopTimer--;

            const activeWorld = this.getActiveWorld();
            const curWorldW = activeWorld ? activeWorld.length : WORLD_WIDTH;
            const curWorldH = activeWorld ? (activeWorld[0]?.length || WORLD_HEIGHT) : WORLD_HEIGHT;
            const activeHeights = this.getActiveTerrain();

            if (this.chirpTimer > 0) {
                this.chirpTimer--;
            } else {
                this.chirpTimer = Math.floor(Math.random() * 450 + 350);
                const curPlayer = (typeof window !== 'undefined' && window.player) ? window.player : player;
                if (curPlayer && !curPlayer.isDead && Math.hypot(this.x - curPlayer.x, this.y - curPlayer.y) < 380) {
                    playSound('parrot_chirp', { vol: 0.5 });
                }
            }

            if (this.headTiltTimer > 0) {
                this.headTiltTimer--;
            } else if (Math.random() < 0.02) {
                this.headTilt = (Math.random() - 0.5) * 0.4;
                this.headTiltTimer = Math.floor(Math.random() * 40 + 20);
            } else {
                this.headTilt = 0;
            }

            const curPlayer = (typeof window !== 'undefined' && window.player) ? window.player : player;
            let pDist = 9999;
            let isHoldingSeeds = false;
            if (curPlayer && !curPlayer.isDead) {
                pDist = Math.hypot(
                    (curPlayer.x + curPlayer.width / 2) - (this.x + this.width / 2),
                    (curPlayer.y + curPlayer.height / 2) - (this.y + this.height / 2)
                );
                const held = inventory[selectedHotbarIndex];
                isHoldingSeeds = (held && this.isTemptedBy(held.id));
            }

            if (!this.isTamed && !this.panic && curPlayer && !curPlayer.isDead && !isHoldingSeeds) {
                if (pDist < 75 && Math.abs(curPlayer.vx) > 1.5) {
                    const scareDir = (curPlayer.x < this.x) ? 1 : -1;
                    this.startle(scareDir);
                }
            }

            let isTemptedNow = false;
            if (!this.isSitting && isHoldingSeeds && pDist < 350 && !this.panic) {
                isTemptedNow = true;
                this.isTempted = true;
                if (frameCount % 60 === 0 && Math.random() < 0.4) {
                    particles.push(new Particle(this.x + this.width / 2, this.y - 4, '#ff80bf'));
                }
            } else {
                this.isTempted = false;
            }

            if (this.isTamed && !this.isSitting && curPlayer && !curPlayer.isDead) {
                const px = Math.floor((curPlayer.x + curPlayer.width / 2) / TILE_SIZE);
                const py = Math.floor((curPlayer.y + curPlayer.height - 2) / TILE_SIZE);
                const isPlayerInWater = isWater(px, py) || isWater(px, py - 1);
                const isPlayerAFK = curPlayer.isGrounded && Math.abs(curPlayer.vx) < 0.25 && !isPlayerInWater && Math.abs(curPlayer.vy) < 0.8;

                // Stuck / Left Behind Teleportation Detection:
                if (this.stuckTimer === undefined) this.stuckTimer = 0;
                if (this.lastCheckPos === undefined) this.lastCheckPos = { x: this.x, y: this.y, timer: 0 };

                this.lastCheckPos.timer++;
                if (this.lastCheckPos.timer >= 40) {
                    const distMoved = Math.hypot(this.x - this.lastCheckPos.x, this.y - this.lastCheckPos.y);
                    if (distMoved < 16 && pDist > 90) {
                        this.stuckTimer += 40;
                    } else {
                        this.stuckTimer = 0;
                    }
                    this.lastCheckPos = { x: this.x, y: this.y, timer: 0 };
                }

                // If parrot is stuck behind blocks or left behind for a few blocks (distance > 240px or stuck > 60 frames)
                if (pDist > 240 || this.stuckTimer >= 60) {
                    const teleportSide = (curPlayer.vx > 0.1 || (curPlayer.facingRight ?? true)) ? -1 : 1;
                    this.x = curPlayer.x + teleportSide * 20;
                    this.y = curPlayer.y - 14;
                    this.vx = 0;
                    this.vy = 0;
                    this.state = 'flying';
                    this.flightTimer = 300;
                    this.isGrounded = false;
                    this.stuckTimer = 0;
                    this.lastCheckPos = { x: this.x, y: this.y, timer: 0 };
                    for (let i = 0; i < 6; i++) {
                        particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, this.getFeatherParticleColor()));
                    }
                    playSound('parrot_chirp', { vol: 0.5 });
                }

                // Shoulder Perching: When player is AFK / idle on the ground, sit on shoulder!
                // When player walks, player dismounts parrot and parrot flies alongside
                if (isPlayerAFK) {
                    const hasOpenShoulder = (!curPlayer.leftShoulderParrot || (!curPlayer.rightShoulderParrot && curPlayer.leftShoulderParrot !== this));
                    if (hasOpenShoulder) {
                        if (pDist < 52) {
                            if (!curPlayer.leftShoulderParrot) {
                                curPlayer.leftShoulderParrot = this;
                                this.isMounted = true;
                                this.mountedShoulder = 'left';
                                this.state = 'ground';
                                this.vx = 0;
                                this.vy = 0;
                                playSound('parrot_chirp', { vol: 0.6 });
                                return;
                            } else if (!curPlayer.rightShoulderParrot && curPlayer.leftShoulderParrot !== this) {
                                curPlayer.rightShoulderParrot = this;
                                this.isMounted = true;
                                this.mountedShoulder = 'right';
                                this.state = 'ground';
                                this.vx = 0;
                                this.vy = 0;
                                playSound('parrot_chirp', { vol: 0.6 });
                                return;
                            }
                        }

                        // Steer toward player's shoulder
                        if (this.state !== 'flying') {
                            this.state = 'flying';
                            this.flightTimer = 200;
                            this.vy = -2.8;
                            this.isGrounded = false;
                        }
                        this.flyTargetX = curPlayer.x + (curPlayer.leftShoulderParrot ? 14 : -14);
                        this.flyTargetY = curPlayer.y - 12;
                    }
                } else {
                    // Player is moving / in water / airborne: fly alongside the player at head/shoulder height
                    if (this.state !== 'flying') {
                        this.state = 'flying';
                        this.flightTimer = 300;
                        this.vy = -3;
                        this.isGrounded = false;
                    }
                    const walkDir = Math.abs(curPlayer.vx) > 0.1 ? (curPlayer.vx > 0 ? -1 : 1) : (this.x < curPlayer.x ? -1 : 1);
                    this.flyTargetX = curPlayer.x + walkDir * 24;
                    this.flyTargetY = curPlayer.y - 12;
                }
            }

            if (this.isSitting) {
                this.vx = 0;
                this.vy = 0;
                this.isGrounded = true;
                this.applyPhysics();
                return;
            }

            if (this.state === 'perching') {
                this.vx = 0;
                this.vy = 0;
                this.isGrounded = true;

                if (this.targetLeaf) {
                    const block = activeWorld?.[this.targetLeaf.x]?.[this.targetLeaf.y];
                    if (block !== IDS.LEAVES && block !== IDS.JUNGLE_LEAVES) {
                        this.targetLeaf = null;
                        this.state = 'flying';
                        this.flightTimer = 300;
                    }
                }

                this.perchTimer--;
                if (Math.random() < 0.01) this.dir = -this.dir;

                if (this.perchTimer <= 0) {
                    this.state = 'flying';
                    this.targetLeaf = null;
                    this.flightTimer = 300 + Math.random() * 400;
                    this.vy = -3;
                    this.vx = this.dir * (1.5 + Math.random());
                    this.isGrounded = false;
                }
            }
            else if (this.state === 'ground') {
                if (this.panic) {
                    this.state = 'flying';
                    this.vy = -4.5;
                    this.flightTimer = 300;
                } else if (isTemptedNow) {
                    const dx = (curPlayer.x + curPlayer.width / 2) - (this.x + this.width / 2);
                    this.dir = dx > 0 ? 1 : -1;
                    if (pDist > 45) {
                        this.vx = this.dir * this.baseSpeed * 1.2;
                        if (this.isGrounded && this.hopTimer <= 0 && Math.random() < 0.08) {
                            this.vy = -2.5;
                            this.hopTimer = 25;
                        }
                    } else {
                        this.vx = 0;
                        if (Math.random() < 0.03 && this.peckTimer <= 0) this.peckTimer = 20;
                    }
                } else {
                    this.timer--;
                    if (this.timer <= 0) {
                        const roll = Math.random();
                        if (roll < 0.35) {
                            this.dir = 0;
                            this.peckTimer = 24;
                            this.timer = Math.random() * 60 + 30;
                        } else if (roll < 0.70) {
                            this.dir = Math.random() > 0.5 ? 1 : -1;
                            this.timer = Math.random() * 100 + 50;
                            if (this.isGrounded && Math.random() < 0.5) {
                                this.vy = -2.4;
                            }
                        } else {
                            this.state = 'flying';
                            this.flightTimer = 350 + Math.random() * 450;
                            this.vy = -3.8;
                            this.isGrounded = false;
                        }
                    }

                    if (this.dir !== 0 && (this.hasHazardAhead(this.dir) || this.hasLethalDropAhead(this.dir))) {
                        this.dir = -this.dir;
                        this.timer = 50;
                    }

                    this.vx = this.dir * this.baseSpeed;
                }

                if (this.vx !== 0 && this.isGrounded) {
                    const moveDir = this.vx > 0 ? 1 : -1;
                    const checkX = Math.floor((this.x + this.width / 2 + moveDir * (this.width / 2 + 4)) / TILE_SIZE);
                    const footY = Math.floor((this.y + this.height - 4) / TILE_SIZE);
                    const headY = Math.floor((this.y + 4) / TILE_SIZE);
                    if (checkX >= 0 && checkX < curWorldW) {
                        const b = activeWorld?.[checkX]?.[footY];
                        const upperB = activeWorld?.[checkX]?.[headY - 1];
                        if (isSolidWorldBlock(checkX, footY, b) && !isSolidWorldBlock(checkX, headY - 1, upperB) && !isWater(checkX, headY - 1)) {
                            this.vy = JUMP_FORCE * 0.75;
                            this.isGrounded = false;
                        }
                    }
                }

                const prevX = this.x;
                this.applyPhysics();
                const actualMoved = Math.abs(this.x - prevX);

                if (actualMoved > 0.05 && this.isGrounded) {
                    this.walkAnimTime = (this.walkAnimTime || 0) + (actualMoved / this.baseSpeed) * 0.25;
                } else {
                    this.walkAnimTime = 0;
                }

                if (!this.isGrounded && this.vy > 3.0) {
                    this.state = 'flying';
                    this.flightTimer = 250;
                }
            }
            else {
                this.flightTimer--;
                this.flapTime += (this.panic ? 0.7 : 0.42);

                const curGx = Math.max(0, Math.min(curWorldW - 1, Math.floor((this.x + this.width / 2) / TILE_SIZE)));
                const groundY = (activeHeights && activeHeights[curGx] !== undefined) ? activeHeights[curGx] : Math.floor(curWorldH / 2);
                const cruiseAltitudeY = Math.max(2 * TILE_SIZE, (groundY - 8) * TILE_SIZE);

                if (this.panic) {
                    this.flyTargetY = Math.max(2 * TILE_SIZE, cruiseAltitudeY - 3 * TILE_SIZE);
                    this.flyTargetX = this.x + this.dir * 120;
                } else if (isTemptedNow && curPlayer && !curPlayer.isDead) {
                    this.flyTargetX = curPlayer.x + (this.x < curPlayer.x ? -35 : 35);
                    this.flyTargetY = curPlayer.y - 10;
                    this.targetLeaf = null;
                } else if (this.isTamed && !this.isSitting && curPlayer && !curPlayer.isDead) {
                    const isPlayerAFK = curPlayer.isGrounded && Math.abs(curPlayer.vx) < 0.25;
                    if (isPlayerAFK) {
                        this.flyTargetX = curPlayer.x + (curPlayer.leftShoulderParrot ? 14 : -14);
                        this.flyTargetY = curPlayer.y - 12;
                    } else {
                        const walkDir = Math.abs(curPlayer.vx) > 0.1 ? (curPlayer.vx > 0 ? -1 : 1) : (this.x < curPlayer.x ? -1 : 1);
                        this.flyTargetX = curPlayer.x + walkDir * 24;
                        this.flyTargetY = curPlayer.y - 12;
                    }
                    this.targetLeaf = null;
                } else if (this.targetLeaf) {
                    this.flyTargetX = this.targetLeaf.x * TILE_SIZE + (TILE_SIZE - this.width) / 2;
                    this.flyTargetY = (this.targetLeaf.y - 1) * TILE_SIZE + (TILE_SIZE - this.height);
                } else {
                    if (this.flightTimer % 100 === 0 || Math.abs(this.x - this.flyTargetX) < 30) {
                        const roamDistance = (Math.random() - 0.5) * 220;
                        this.flyTargetX = Math.max(50, Math.min(curWorldW * TILE_SIZE - 50, this.x + roamDistance));
                        this.flyTargetY = cruiseAltitudeY + (Math.random() - 0.5) * 40;

                        if (this.flightTimer < 250 && Math.random() < 0.5) {
                            const leafSpot = this.findNearbyTreeLeaf(16);
                            if (leafSpot) this.targetLeaf = leafSpot;
                        } else if (this.flightTimer < 100 && Math.random() < 0.4) {
                            this.flyTargetY = (groundY - 1) * TILE_SIZE;
                        }
                    }
                }

                const dx = this.flyTargetX - this.x;
                const dy = this.flyTargetY - this.y;
                const maxFlightSpeed = this.panic ? 4.5 : 2.6;
                const maxClimbSpeed = this.panic ? 3.5 : 2.0;

                const desiredVx = Math.sign(dx) * Math.min(Math.abs(dx) * 0.05, maxFlightSpeed);
                const desiredVy = Math.sign(dy) * Math.min(Math.abs(dy) * 0.05, maxClimbSpeed);

                this.vx += (desiredVx - this.vx) * 0.08;
                this.vy += (desiredVy - this.vy) * 0.08;
                this.vy += Math.sin(this.flapTime) * 0.16;

                if (Math.abs(this.vx) > 0.1) this.dir = this.vx > 0 ? 1 : -1;

                this.x += this.vx;
                this.handleCollisions(true);
                this.y += this.vy;
                this.handleCollisions(false);

                if (this.targetLeaf) {
                    const leafTargetX = this.targetLeaf.x * TILE_SIZE + (TILE_SIZE - this.width) / 2;
                    const leafTargetY = (this.targetLeaf.y - 1) * TILE_SIZE + (TILE_SIZE - this.height);
                    if (Math.hypot(this.x - leafTargetX, this.y - leafTargetY) < 8 && this.vy >= -0.5) {
                        this.state = 'perching';
                        this.x = leafTargetX;
                        this.y = leafTargetY;
                        this.vx = 0;
                        this.vy = 0;
                        this.isGrounded = true;
                        this.perchTimer = 280 + Math.random() * 400;
                    }
                }

                if (this.isGrounded && this.vy >= 0 && !this.targetLeaf) {
                    this.state = 'ground';
                    this.vx = 0;
                    this.timer = 70 + Math.random() * 90;
                }
            }
        }

        takeDamage(amt, knockbackDir) {
            if (this.damageCooldown > 0) return;
            this.health -= amt;
            this.damageCooldown = 20;

            const curPlayer = (typeof window !== 'undefined' && window.player) ? window.player : player;
            if (this.isMounted && curPlayer) {
                if (curPlayer.leftShoulderParrot === this) curPlayer.leftShoulderParrot = null;
                if (curPlayer.rightShoulderParrot === this) curPlayer.rightShoulderParrot = null;
                this.isMounted = false;
                this.mountedShoulder = null;
            }

            playSound('parrot_hurt', { vol: 0.8 });
            const escapeDir = knockbackDir || (Math.random() > 0.5 ? 1 : -1);
            this.startle(escapeDir);

            for (let i = 0; i < 6; i++) {
                particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, this.getFeatherParticleColor()));
            }
            for (let i = 0; i < 3; i++) {
                particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ef4444'));
            }
            floatingTexts.push(new FloatingText(this.x + this.width / 2, this.y - 10, amt, "#ffcc00"));
        }

        draw(ctx, camX, camY) {
            if (this.isMounted) return;

            const drawX = this.x - camX;
            const drawY = this.y - camY;
            const w = this.width;
            const h = this.height;

            if (advancedGraphics && this.state !== 'flying') {
                ctx.drawImage(cachedShadowCanvas, drawX + w / 2 - w * 0.45, drawY + h - 3, w * 0.9, 5);
            }

            ctx.save();
            ctx.translate(drawX + w / 2, drawY + h / 2);
            if (this.dir < 0) ctx.scale(-1, 1);

            const isDamaged = this.damageCooldown > 0;
            const isFlying = (this.state === 'flying');
            const isGrounded = (this.state === 'ground' && this.isGrounded);
            const isMoving = Math.abs(this.vx) > 0.05 && isGrounded;
            const walk = this.walkAnimTime || 0;
            const idle = Math.sin((frameCount + this.idleSeed) * 0.08);
            const isBlinking = ((frameCount + Math.floor(this.idleSeed)) % 180 < 6);

            let cBody, cWingAccent, cWingFlight, cBeak, cEyeRing, cEyeIris, cTail, cCrest = null;
            if (this.variant === 0) {
                cBody = isDamaged ? '#ff6666' : '#dc2626';
                cWingAccent = isDamaged ? '#ffcc00' : '#eab308';
                cWingFlight = isDamaged ? '#60a5fa' : '#2563eb';
                cBeak = isDamaged ? '#475569' : '#1e293b';
                cEyeRing = '#ffffff';
                cEyeIris = '#0f172a';
                cTail = '#2563eb';
            } else if (this.variant === 1) {
                cBody = isDamaged ? '#86efac' : '#16a34a';
                cWingAccent = isDamaged ? '#fca5a5' : '#ef4444';
                cWingFlight = isDamaged ? '#5eead4' : '#0d9488';
                cBeak = isDamaged ? '#fef08a' : '#fef08a';
                cEyeRing = '#dcfce7';
                cEyeIris = '#0f172a';
                cTail = '#15803d';
            } else if (this.variant === 2) {
                cBody = isDamaged ? '#7dd3fc' : '#0284c7';
                cWingAccent = isDamaged ? '#38bdf8' : '#0369a1';
                cWingFlight = isDamaged ? '#93c5fd' : '#1d4ed8';
                cBeak = isDamaged ? '#475569' : '#111827';
                cEyeRing = '#facc15';
                cEyeIris = '#0f172a';
                cTail = '#1e40af';
            } else {
                cBody = isDamaged ? '#cbd5e1' : '#64748b';
                cWingAccent = '#f8fafc';
                cWingFlight = '#475569';
                cBeak = '#d1d5db';
                cEyeRing = '#fef08a';
                cEyeIris = '#1e293b';
                cTail = '#475569';
                cCrest = '#fde047';
            }

            const cFeet = '#4b5563';

            let wingAngle = 0;
            if (isFlying) {
                wingAngle = Math.sin(this.flapTime) * 0.9;
                const flyTilt = Math.max(-0.35, Math.min(0.35, this.vy * 0.08));
                ctx.rotate(flyTilt);
            } else if (this.panic) {
                wingAngle = Math.sin(frameCount * 0.65) * 0.4;
            }

            const headBobX = isMoving ? Math.sin(walk) * 2 : 0;
            const peckBobY = (this.peckTimer > 0) ? Math.sin(this.peckTimer / 24 * Math.PI) * 3.5 : 0;
            const headBobY = (isMoving ? Math.abs(Math.sin(walk)) * 1.2 : idle * 0.4) + peckBobY + (this.headTilt * 3);

            // Tail
            ctx.save();
            ctx.translate(-w * 0.35, h * 0.1);
            ctx.fillStyle = cTail;
            ctx.fillRect(-w * 0.35, 0, w * 0.45, 3.5);
            ctx.fillRect(-w * 0.25, 2, w * 0.3, 2.5);
            ctx.restore();

            // Feet
            if (!isFlying && !this.isSitting) {
                ctx.fillStyle = cFeet;
                ctx.fillRect(-w * 0.12, h * 0.35, 2, h * 0.15);
                ctx.fillRect(w * 0.08, h * 0.35, 2, h * 0.15);
                ctx.fillRect(-w * 0.15, h * 0.48, 4, 1.5);
                ctx.fillRect(w * 0.05, h * 0.48, 4, 1.5);
            }

            // Body
            const bodyY = this.isSitting ? 2 : 0;
            ctx.fillStyle = cBody;
            ctx.fillRect(-w * 0.28, -h * 0.25 + bodyY, w * 0.55, h * 0.55);

            // Head
            const hx = w * 0.05 + headBobX;
            const hy = -h * 0.48 + headBobY + bodyY;
            ctx.fillStyle = cBody;
            ctx.fillRect(hx, hy, w * 0.45, h * 0.42);

            if (cCrest) {
                ctx.fillStyle = cCrest;
                ctx.fillRect(hx - 2, hy - 4, 3.5, 5);
                ctx.fillRect(hx + 1, hy - 6, 2.5, 6);
                ctx.fillStyle = '#f97316';
                ctx.fillRect(hx + 2, hy + 5, 3, 3);
            } else {
                ctx.fillStyle = cWingAccent;
                ctx.fillRect(hx - 1, hy - 2, 2.5, 3);
            }

            // Eye
            const eyeX = hx + w * 0.22;
            const eyeY = hy + 3;
            if (isBlinking) {
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(eyeX, eyeY + 1, 3, 1);
            } else {
                ctx.fillStyle = cEyeRing;
                ctx.fillRect(eyeX - 0.5, eyeY - 0.5, 4, 4);
                ctx.fillStyle = cEyeIris;
                ctx.fillRect(eyeX, eyeY, 2.5, 2.5);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(eyeX, eyeY, 1, 1);
            }

            // Beak
            ctx.fillStyle = cBeak;
            ctx.fillRect(hx + w * 0.42, hy + 3, 3.5, 3.5);
            ctx.fillRect(hx + w * 0.42 + 1.5, hy + 5.5, 2, 2);

            // Wing
            ctx.save();
            ctx.translate(-w * 0.05, -h * 0.12 + bodyY);
            ctx.rotate(wingAngle);

            if (isFlying) {
                ctx.fillStyle = cBody;
                ctx.fillRect(-w * 0.25, -h * 0.3, w * 0.55, h * 0.4);
                ctx.fillStyle = cWingAccent;
                ctx.fillRect(-w * 0.2, -h * 0.1, w * 0.5, 2.5);
                ctx.fillStyle = cWingFlight;
                ctx.fillRect(-w * 0.25, 0, w * 0.55, 3.5);
            } else {
                ctx.fillStyle = cBody;
                ctx.fillRect(-w * 0.22, -h * 0.15, w * 0.44, h * 0.4);
                ctx.fillStyle = cWingAccent;
                ctx.fillRect(-w * 0.18, -h * 0.05, w * 0.36, 2.5);
                ctx.fillStyle = cWingFlight;
                ctx.fillRect(-w * 0.22, h * 0.05, w * 0.4, 3);
            }
            ctx.restore();

            ctx.restore();
        }
    }

    export class Sheep extends Animal {
        constructor(x, y) {
            super(x, y, TILE_SIZE * 0.85, TILE_SIZE * 0.7, 8, MOVE_SPEED * 0.22);
            this.isSheared = false;
            this.eatAnim = 0;
        }

        isTemptedBy(itemId) {
            return itemId === IDS.WHEAT || itemId === IDS.SEEDS || itemId === IDS.SAPLING;
        }

        update() {
            this.updateAnimalAI();
            if (this.eatAnim > 0) this.eatAnim--;
            if (this.isSheared && this.isGrounded && Math.random() < 0.004) {
                let gx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
                let gy = Math.floor((this.y + this.height + 2) / TILE_SIZE);
                if (gx >= 0 && gx < WORLD_WIDTH && gy >= 0 && gy < WORLD_HEIGHT) {
                    if (world[gx]?.[gy] === IDS.GRASS || world[gx]?.[gy] === IDS.SHORT_GRASS) {
                        this.isSheared = false;
                        this.eatAnim = 35;
                        for (let p = 0; p < 10; p++) particles.push(new Particle(this.x + this.width / 2, this.y + this.height - 4, '#35b042'));
                    }
                }
            }
        }

        takeDamage(amount, knockbackDir) {
            if (this.damageCooldown > 0) return;
            this.health -= amount;
            this.damageCooldown = 15;
            this.vy = -3.5;
            this.vx = knockbackDir * 6;
            this.panic = true;
            this.panicTimer = 180;
            this.dir = knockbackDir || (Math.random() > 0.5 ? 1 : -1);
            for (let i = 0; i < 6; i++) particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#ffffff'));
            for (let i = 0; i < 3; i++) particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#e2b49a'));
            floatingTexts.push(new FloatingText(this.x + this.width / 2, this.y - 10, amount, '#ffcc00'));
        }

        draw(ctx, camX, camY) {
            const drawX = this.x - camX;
            const drawY = this.y - camY;
            const w = this.width;
            const h = this.height;

            if (advancedGraphics) {
                ctx.drawImage(cachedShadowCanvas, drawX + w / 2 - w / 2.2, drawY + h - 6, w * (2 / 2.2), 8);
            }

            ctx.save();
            ctx.translate(drawX + w / 2, drawY + h / 2);
            if (this.dir < 0) ctx.scale(-1, 1);

            const isMoving = Math.abs(this.vx) > 0.05;
            const walk = this.walkAnimTime || 0;
            const idle = Math.sin((frameCount + this.idleSeed) * 0.06);
            const isBlinking = ((frameCount + Math.floor(this.idleSeed)) % 210 < 8);
            const isGrazing = this.eatAnim > 0;
            const headDip = isGrazing ? 5 : 0;
            const bodyBob = isMoving ? Math.abs(Math.sin(walk * 2)) * 1.2 : idle * 0.6;

            const isDamaged = this.damageCooldown > 0;
            const woolWhite = isDamaged ? '#ff9999' : '#ffffff';
            const woolShade = isDamaged ? '#ff6666' : '#e2e8f0';
            const woolDark = isDamaged ? '#cc3333' : '#cbd5e1';
            const skinBase = isDamaged ? '#ff8080' : '#e2b49a';
            const skinLight = isDamaged ? '#ffaaaa' : '#f5d0b5';
            const skinShade = isDamaged ? '#b91c1c' : '#c58f72';
            const hoofColor = isDamaged ? '#450a0a' : '#44352b';
            const earPink = isDamaged ? '#cc0000' : '#fca5a5';

            const farLegSwing = isMoving ? Math.sin(walk) * 3 : 0;
            const nearLegSwing = isMoving ? -Math.sin(walk) * 3 : 0;
            const farLegLift = (isMoving && Math.sin(walk) > 0) ? Math.sin(walk) * 1.5 : 0;
            const nearLegLift = (isMoving && -Math.sin(walk) > 0) ? -Math.sin(walk) * 1.5 : 0;

            // 1. Far Legs (Back and Front)
            ctx.fillStyle = isDamaged ? '#b91c1c' : (this.isSheared ? skinShade : skinBase);
            ctx.fillRect(-w * 0.42 + farLegSwing, h * 0.16 - farLegLift, w * 0.15, h * 0.34);
            ctx.fillRect(w * 0.08 - farLegSwing, h * 0.16 - nearLegLift, w * 0.15, h * 0.34);
            // Far Hooves
            ctx.fillStyle = hoofColor;
            ctx.fillRect(-w * 0.42 + farLegSwing, h * 0.5 - 2 - farLegLift, w * 0.15, 3);
            ctx.fillRect(w * 0.08 - farLegSwing, h * 0.5 - 2 - nearLegLift, w * 0.15, 3);

            // 2. Body (Sheared vs Unsheared)
            if (this.isSheared) {
                // Trimmed skin body
                ctx.fillStyle = skinLight;
                ctx.fillRect(-w * 0.48, -h * 0.36 + bodyBob, w * 0.65, h * 0.54);
                ctx.fillStyle = skinShade;
                ctx.fillRect(-w * 0.48, h * 0.12 + bodyBob, w * 0.65, 3);
                // Fleece stubble tufts
                ctx.fillStyle = woolWhite;
                ctx.fillRect(-w * 0.44, -h * 0.36 + bodyBob, 4, 3);
                ctx.fillRect(-w * 0.25, -h * 0.34 + bodyBob, 5, 3);
                ctx.fillRect(-w * 0.08, -h * 0.36 + bodyBob, 4, 3);
                ctx.fillRect(-w * 0.34, -h * 0.12 + bodyBob, 4, 2.5);
                ctx.fillRect(-w * 0.15, -h * 0.08 + bodyBob, 4, 2.5);
            } else {
                // Fluffy Cloud Wool Mounds!
                ctx.fillStyle = woolWhite;
                ctx.fillRect(-w * 0.5, -h * 0.46 + bodyBob, w * 0.72, h * 0.66);
                // Cloud scalloped top bumps
                ctx.fillRect(-w * 0.46, -h * 0.52 + bodyBob, w * 0.22, h * 0.1);
                ctx.fillRect(-w * 0.20, -h * 0.54 + bodyBob, w * 0.24, h * 0.12);
                ctx.fillRect(w * 0.06, -h * 0.50 + bodyBob, w * 0.16, h * 0.1);
                // Cloud scalloped back bump
                ctx.fillRect(-w * 0.54, -h * 0.38 + bodyBob, w * 0.08, h * 0.44);
                // Cloud shading & creases
                ctx.fillStyle = woolShade;
                ctx.fillRect(-w * 0.5, h * 0.14 + bodyBob, w * 0.72, 4);
                ctx.fillStyle = woolDark;
                ctx.fillRect(-w * 0.24, -h * 0.44 + bodyBob, 2, h * 0.4);
                ctx.fillRect(0, -h * 0.40 + bodyBob, 2, h * 0.4);
            }

            // 3. Head & Face
            const headBob = bodyBob * 0.7 + headDip;
            ctx.fillStyle = skinBase;
            ctx.fillRect(w * 0.12, -h * 0.42 + headBob, w * 0.36, h * 0.56);
            ctx.fillStyle = skinLight;
            ctx.fillRect(w * 0.14, -h * 0.42 + headBob, w * 0.32, 3);
            ctx.fillStyle = skinShade;
            ctx.fillRect(w * 0.12, h * 0.10 + headBob, w * 0.36, 2);

            // Wool Cap on Head (if not sheared)
            if (!this.isSheared) {
                ctx.fillStyle = woolWhite;
                ctx.fillRect(w * 0.10, -h * 0.54 + headBob, w * 0.38, 5);
                ctx.fillRect(w * 0.14, -h * 0.60 + headBob, w * 0.28, 4);
                ctx.fillStyle = woolShade;
                ctx.fillRect(w * 0.10, -h * 0.46 + headBob, w * 0.38, 2);
            }

            // Floppy Ears
            const earSway = Math.sin(frameCount * 0.1) * 0.8;
            ctx.fillStyle = skinShade;
            ctx.fillRect(w * 0.18, -h * 0.38 + headBob + earSway, 3, 5);
            ctx.fillRect(w * 0.15, -h * 0.34 + headBob + earSway, 3, 6);
            ctx.fillStyle = earPink;
            ctx.fillRect(w * 0.16, -h * 0.32 + headBob + earSway, 1.5, 4);

            // Muzzle / Mouth (chewing when grazing)
            const chewOffset = (isGrazing && frameCount % 6 < 3) ? 1 : 0;
            ctx.fillStyle = skinShade;
            ctx.fillRect(w * 0.36 + chewOffset, -h * 0.12 + headBob, w * 0.14, 4);
            ctx.fillStyle = hoofColor;
            ctx.fillRect(w * 0.46 + chewOffset, -h * 0.08 + headBob, 2, 2);

            // Eye
            if (isBlinking) {
                ctx.fillStyle = hoofColor;
                ctx.fillRect(w * 0.28, -h * 0.24 + headBob, 3, 1.5);
            } else {
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(w * 0.28, -h * 0.28 + headBob, 3.5, 3.5);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(w * 0.28, -h * 0.28 + headBob, 1.5, 1.5);
            }

            // 4. Near Legs (Back and Front)
            ctx.fillStyle = isDamaged ? '#ff4d4d' : skinLight;
            ctx.fillRect(-w * 0.28 + nearLegSwing, h * 0.18 - nearLegLift, w * 0.15, h * 0.32);
            ctx.fillRect(w * 0.22 + farLegSwing, h * 0.18 - farLegLift, w * 0.15, h * 0.32);
            // Wool Cuffs above hooves (if not sheared)
            if (!this.isSheared) {
                ctx.fillStyle = woolWhite;
                ctx.fillRect(-w * 0.30 + nearLegSwing, h * 0.34 - nearLegLift, w * 0.19, 3);
                ctx.fillRect(w * 0.20 + farLegSwing, h * 0.34 - farLegLift, w * 0.19, 3);
            }
            // Near Hooves
            ctx.fillStyle = hoofColor;
            ctx.fillRect(-w * 0.28 + nearLegSwing, h * 0.5 - 2 - nearLegLift, w * 0.15, 3);
            ctx.fillRect(w * 0.22 + farLegSwing, h * 0.5 - 2 - farLegLift, w * 0.15, 3);

            ctx.restore();
        }
    }

    export class Cow extends Animal {
        constructor(x, y) {
            super(x, y, TILE_SIZE * 0.95, TILE_SIZE * 0.75, 10, MOVE_SPEED * 0.22);
        }

        isTemptedBy(itemId) {
            return itemId === IDS.WHEAT;
        }

        update() {
            this.updateAnimalAI();
        }

        takeDamage(amt, knockbackDir) {
            if (this.damageCooldown > 0) return;
            this.health -= amt;
            this.damageCooldown = 15;
            this.vy = -3.5;
            this.vx = knockbackDir * 5;
            this.panic = true;
            this.panicTimer = 180;
            this.dir = knockbackDir || (Math.random() > 0.5 ? 1 : -1);
            for (let i = 0; i < 5; i++) particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#451a03'));
            for (let i = 0; i < 4; i++) particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, '#f8fafc'));
            floatingTexts.push(new FloatingText(this.x + this.width / 2, this.y - 10, amt, "#ffcc00"));
        }

        draw(ctx, camX, camY) {
            const drawX = this.x - camX;
            const drawY = this.y - camY;
            const w = this.width;
            const h = this.height;

            if (advancedGraphics) {
                ctx.drawImage(cachedShadowCanvas, drawX + w / 2 - w / 2.2, drawY + h - 6, w * (2 / 2.2), 8);
            }

            ctx.save();
            ctx.translate(drawX + w / 2, drawY + h / 2);
            if (this.dir < 0) ctx.scale(-1, 1);

            const isMoving = Math.abs(this.vx) > 0.05;
            const walk = this.walkAnimTime || 0;
            const idle = Math.sin((frameCount + this.idleSeed) * 0.07);
            const bodyBob = isMoving ? Math.abs(Math.sin(walk * 2)) * 1.2 : idle * 0.6;
            const isBlinking = ((frameCount + Math.floor(this.idleSeed)) % 220 < 8);

            const isDamaged = this.damageCooldown > 0;
            const hideWhite = isDamaged ? '#ff9999' : '#f8fafc';
            const hideHighlight = isDamaged ? '#ffcccc' : '#ffffff';
            const hideShade = isDamaged ? '#ff6666' : '#cbd5e1';
            const spotBlack = isDamaged ? '#660000' : '#27272a';
            const spotOutline = isDamaged ? '#400000' : '#18181b';
            const hoofDark = isDamaged ? '#330000' : '#18181b';
            const hoofLight = isDamaged ? '#550000' : '#27272a';
            const muzzlePink = isDamaged ? '#ff8080' : '#fbcfe8';
            const muzzleHigh = isDamaged ? '#ffaaaa' : '#ffe4e6';
            const nostrilDark = isDamaged ? '#990000' : '#9f1239';
            const udderPink = isDamaged ? '#ff8080' : '#fbcfe8';
            const teatPink = isDamaged ? '#cc0000' : '#f43f5e';
            const hornIvory = isDamaged ? '#ffcc80' : '#fef08a';
            const hornBase = isDamaged ? '#d97706' : '#ca8a04';

            const farLegSwing = isMoving ? Math.sin(walk) * 3 : 0;
            const nearLegSwing = isMoving ? -Math.sin(walk) * 3 : 0;
            const farLegLift = (isMoving && Math.sin(walk) > 0) ? Math.sin(walk) * 1.5 : 0;
            const nearLegLift = (isMoving && -Math.sin(walk) > 0) ? -Math.sin(walk) * 1.5 : 0;

            // 1. Far Legs (Back and Front)
            ctx.fillStyle = hideShade;
            ctx.fillRect(-w * 0.44 + farLegSwing, h * 0.15 - farLegLift, w * 0.16, h * 0.35);
            ctx.fillRect(w * 0.08 - farLegSwing, h * 0.15 - nearLegLift, w * 0.16, h * 0.35);
            // Black spot on far back leg
            ctx.fillStyle = spotOutline;
            ctx.fillRect(-w * 0.44 + farLegSwing, h * 0.20 - farLegLift, w * 0.16, 4);
            // Far Hooves
            ctx.fillStyle = hoofDark;
            ctx.fillRect(-w * 0.44 + farLegSwing, h * 0.5 - 2 - farLegLift, w * 0.16, 3);
            ctx.fillRect(w * 0.08 - farLegSwing, h * 0.5 - 2 - nearLegLift, w * 0.16, 3);

            // 2. Udder (underneath body between hind legs)
            ctx.fillStyle = udderPink;
            ctx.fillRect(-w * 0.22, h * 0.12 + bodyBob, w * 0.16, 4);
            ctx.fillStyle = teatPink;
            ctx.fillRect(-w * 0.20, h * 0.12 + bodyBob + 4, 2, 2.5);
            ctx.fillRect(-w * 0.10, h * 0.12 + bodyBob + 4, 2, 2.5);

            // 3. Swishing Tail (Back)
            const tailSwish = Math.sin(frameCount * (this.panic ? 0.5 : 0.12) + this.idleSeed) * 0.3;
            ctx.save();
            ctx.translate(-w * 0.48, -h * 0.24 + bodyBob);
            ctx.rotate(tailSwish);
            ctx.fillStyle = hideWhite;
            ctx.fillRect(-2, 0, 2.5, h * 0.38);
            // Black tassel tuft
            ctx.fillStyle = spotBlack;
            ctx.fillRect(-3.5, h * 0.34, 5, 5);
            ctx.restore();

            // 4. Torso / Body
            ctx.fillStyle = hideWhite;
            ctx.fillRect(-w * 0.48, -h * 0.48 + bodyBob, w * 0.70, h * 0.68);
            // Top Highlight Stripe
            ctx.fillStyle = hideHighlight;
            ctx.fillRect(-w * 0.46, -h * 0.48 + bodyBob, w * 0.66, 3);
            // Belly Shadow
            ctx.fillStyle = hideShade;
            ctx.fillRect(-w * 0.48, h * 0.14 + bodyBob, w * 0.70, 3);

            // Organic Black Cow Spots on Torso
            ctx.fillStyle = spotBlack;
            // Main flank spot
            ctx.fillRect(-w * 0.28, -h * 0.48 + bodyBob, w * 0.26, h * 0.45);
            ctx.fillRect(-w * 0.34, -h * 0.40 + bodyBob, w * 0.12, h * 0.30);
            ctx.fillRect(-w * 0.14, -h * 0.44 + bodyBob, w * 0.14, h * 0.36);
            // Hind patch
            ctx.fillRect(-w * 0.48, -h * 0.38 + bodyBob, w * 0.12, h * 0.28);
            ctx.fillRect(-w * 0.48, -h * 0.48 + bodyBob, w * 0.16, 4);

            // 5. Head & Neck
            const headBob = bodyBob * 0.75;
            ctx.fillStyle = hideWhite;
            ctx.fillRect(w * 0.10, -h * 0.52 + headBob, w * 0.38, h * 0.62);
            ctx.fillStyle = hideHighlight;
            ctx.fillRect(w * 0.12, -h * 0.52 + headBob, w * 0.34, 3);
            ctx.fillStyle = hideShade;
            ctx.fillRect(w * 0.10, h * 0.06 + headBob, w * 0.38, 2);

            // Black patch over eye / head
            ctx.fillStyle = spotBlack;
            ctx.fillRect(w * 0.10, -h * 0.52 + headBob, w * 0.20, h * 0.36);
            ctx.fillRect(w * 0.22, -h * 0.42 + headBob, w * 0.14, h * 0.22);

            // Ivory Horns on top of head
            ctx.fillStyle = hornBase;
            ctx.fillRect(w * 0.18, -h * 0.52 - 3 + headBob, 3.5, 3);
            ctx.fillRect(w * 0.28, -h * 0.52 - 3 + headBob, 3.5, 3);
            ctx.fillStyle = hornIvory;
            ctx.fillRect(w * 0.16, -h * 0.52 - 6 + headBob, 3, 3);
            ctx.fillRect(w * 0.30, -h * 0.52 - 6 + headBob, 3, 3);

            // Floppy Cow Ears (lateral droop with twitch)
            const earTwitch = Math.sin(frameCount * 0.08) * 0.8;
            ctx.fillStyle = hideWhite;
            ctx.fillRect(w * 0.06, -h * 0.40 + headBob + earTwitch, 4, 4);
            ctx.fillRect(w * 0.04, -h * 0.36 + headBob + earTwitch, 4, 4);
            ctx.fillStyle = muzzlePink;
            ctx.fillRect(w * 0.05, -h * 0.36 + headBob + earTwitch, 2.5, 3);

            // Large Soulful Cow Eye
            if (isBlinking) {
                ctx.fillStyle = hoofDark;
                ctx.fillRect(w * 0.26, -h * 0.26 + headBob, 4.5, 1.5);
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(w * 0.25, -h * 0.30 + headBob, 5, 4.5);
                ctx.fillStyle = '#1e1b4b';
                ctx.fillRect(w * 0.28, -h * 0.30 + headBob, 3, 4.5);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(w * 0.26, -h * 0.30 + headBob, 1.5, 1.5);
            }

            // Muzzle / Snout (with gentle cud-chewing motion when idle)
            const cudChew = (!isMoving && frameCount % 60 < 22) ? Math.sin(frameCount * 0.4) * 1 : 0;
            ctx.fillStyle = muzzlePink;
            ctx.fillRect(w * 0.38, -h * 0.20 + headBob + cudChew, w * 0.18, h * 0.34);
            ctx.fillStyle = muzzleHigh;
            ctx.fillRect(w * 0.38, -h * 0.20 + headBob + cudChew, w * 0.18, 2);
            // Nostrils
            ctx.fillStyle = nostrilDark;
            ctx.fillRect(w * 0.50, -h * 0.12 + headBob + cudChew, 2.5, 2.5);
            ctx.fillRect(w * 0.50, -h * 0.02 + headBob + cudChew, 2.5, 2.5);

            // 6. Near Legs (Back and Front)
            ctx.fillStyle = hideWhite;
            ctx.fillRect(-w * 0.30 + nearLegSwing, h * 0.18 - nearLegLift, w * 0.16, h * 0.32);
            ctx.fillRect(w * 0.22 + farLegSwing, h * 0.18 - farLegLift, w * 0.16, h * 0.32);
            // Spot on near front leg
            ctx.fillStyle = spotBlack;
            ctx.fillRect(w * 0.22 + farLegSwing, h * 0.24 - farLegLift, w * 0.16, 4);
            // Near Hooves
            ctx.fillStyle = hoofLight;
            ctx.fillRect(-w * 0.30 + nearLegSwing, h * 0.5 - 2 - nearLegLift, w * 0.16, 3);
            ctx.fillRect(w * 0.22 + farLegSwing, h * 0.5 - 2 - farLegLift, w * 0.16, 3);

            ctx.restore();
        }
    }

// Global Window Registration for cross-module compatibility
if (typeof window !== 'undefined') {
    window.Animal = Animal;
    window.Pig = Pig;
    window.Chicken = Chicken;
    window.Pigeon = Pigeon;
    window.Parrot = Parrot;
    window.Sheep = Sheep;
    window.Cow = Cow;
}