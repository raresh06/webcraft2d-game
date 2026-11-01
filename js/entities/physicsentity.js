// =============================================================================
// WEBCRAFT 2D - BASE PHYSICS ENTITY (js/entities/physicsentity.js)
// AABB collision resolution, stair slope traversal, gravity & liquid buoyancy
// =============================================================================

import {
    IDS, TILE_SIZE, GRAVITY, TERMINAL_VELOCITY, JUMP_FORCE
} from '../core/constants.js';

import {
    frameCount, currentDifficulty, particles, floatingTexts, player,
    WORLD_WIDTH, WORLD_HEIGHT
} from '../core/state.js';

import {
    getActivePhysicsWorld, getActivePhysicsTerrain, isSolidWorldBlock, 
} from '../world/blockhelper.js';

import {
    getFluid, getFluidFlowVector
} from '../world/fluids.js';

function getParticleClass() {
    if (typeof window !== 'undefined' && window.Particle) return window.Particle;
    return null;
}

function getFloatingTextClass() {
    if (typeof window !== 'undefined' && window.FloatingText) return window.FloatingText;
    return null;
}

export function checkCactusContact(entity) {
    const activeWorld = getActivePhysicsWorld(entity);
    if (!activeWorld) return;
    const curWorldW = activeWorld.length;
    const curWorldH = activeWorld[0]?.length || 0;
    const padding = 2;
    const leftTile = Math.max(0, Math.floor((entity.x - padding) / TILE_SIZE));
    const rightTile = Math.min(curWorldW - 1, Math.floor((entity.x + entity.width + padding) / TILE_SIZE));
    const topTile = Math.max(0, Math.floor((entity.y - padding) / TILE_SIZE));
    const bottomTile = Math.min(curWorldH - 1, Math.floor((entity.y + entity.height + padding) / TILE_SIZE));
    for (let tileY = topTile; tileY <= bottomTile; tileY++) {
        for (let tileX = leftTile; tileX <= rightTile; tileX++) {
            if (activeWorld[tileX]?.[tileY] === IDS.CACTUS && entity.damageCooldown <= 0) {
                if (typeof entity.takeDamage === 'function') {
                    entity.takeDamage(1, 0);
                }
                return;
            }
        }
    }
}

export class PhysicsEntity {
    constructor(x, y, w, h) {
        this.x = x; this.y = y; this.width = w; this.height = h;
        this.vx = 0; this.vy = 0; this.isGrounded = false;
        this.fallStartY = y;
    }

    getActiveWorld() {
        return getActivePhysicsWorld(this);
    }

    getActiveTerrain() {
        return getActivePhysicsTerrain(this);
    }

    canFitAt(targetX, targetY) {
        const eps = 0.05;
        const activeWorld = this.getActiveWorld();
        if (!activeWorld) return false;
        const curWorldW = activeWorld.length;
        const curWorldH = activeWorld[0]?.length || 0;
        if (!curWorldW || !curWorldH) return false;

        let leftTile = Math.max(0, Math.floor((targetX + eps) / TILE_SIZE));
        let rightTile = Math.min(curWorldW - 1, Math.floor((targetX + this.width - eps) / TILE_SIZE));
        let topTile = Math.max(0, Math.floor((targetY + eps) / TILE_SIZE));
        let bottomTile = Math.min(curWorldH - 1, Math.floor((targetY + this.height - eps) / TILE_SIZE));

        for (let y = topTile; y <= bottomTile; y++) {
            for (let x = leftTile; x <= rightTile; x++) {
                let block = activeWorld[x]?.[y];
                if (isSolidWorldBlock(x, y, block)) {
                    let bMinX = x * TILE_SIZE;
                    let bMaxX = (x + 1) * TILE_SIZE;
                    let bMinY = y * TILE_SIZE;
                    let bMaxY = (y + 1) * TILE_SIZE;

                    if (block === IDS.DOOR || block === IDS.DOOR_TOP || block === IDS.JUNGLE_DOOR || block === IDS.JUNGLE_DOOR_TOP) {
                        bMinX = x * TILE_SIZE + 2.5;
                        bMaxX = x * TILE_SIZE + 12.5;
                    }

                    let curLeft = targetX + eps;
                    let curRight = targetX + this.width - eps;
                    let curTop = targetY + eps;
                    let curBottom = targetY + this.height - eps;

                    let isStairRight = (block === IDS.WOODEN_STAIRS_RIGHT || block === IDS.COBBLESTONE_STAIRS_RIGHT);
                    let isStairLeft = (block === IDS.WOODEN_STAIRS || block === IDS.WOODEN_STAIRS_LEFT || block === IDS.COBBLESTONE_STAIRS || block === IDS.COBBLESTONE_STAIRS_LEFT);

                    if (isStairRight || isStairLeft) {
                        let slabMinY = bMinY + TILE_SIZE / 2;
                        let hitSlab = (curRight > bMinX && curLeft < bMaxX && curBottom > slabMinY && curTop < bMaxY);
                        let stepMinX = isStairRight ? bMinX + TILE_SIZE / 2 : bMinX;
                        let stepMaxX = isStairRight ? bMaxX : bMinX + TILE_SIZE / 2;
                        let hitStep = (curRight > stepMinX && curLeft < stepMaxX && curBottom > bMinY && curTop < slabMinY);
                        if (hitSlab || hitStep) return false;
                    } else {
                        if (curRight > bMinX && curLeft < bMaxX && curBottom > bMinY && curTop < bMaxY) {
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    }

    applyPhysics() {
        const isPlayerInst = (this.constructor && this.constructor.name === 'Player') || (typeof player !== 'undefined' && this === player);
        if (typeof window !== 'undefined' && window.devCheats?.noclip && isPlayerInst) {
            return;
        }
        const wasGrounded = this.isGrounded;
        const prevVy = this.vy;
        if (this.isGrounded) {
            this.fallStartY = this.y;
        } else if (this.vy <= 0) {
            this.fallStartY = Math.min(this.fallStartY ?? this.y, this.y);
        }

        // Fluid physics for non-player entities
        if (!isPlayerInst) {
            const entGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const entFootGy = Math.floor((this.y + this.height - 2) / TILE_SIZE);
            const entBodyGy = Math.floor((this.y + this.height / 2) / TILE_SIZE);
            const footFl = getFluid(entGx, entFootGy);
            const bodyFl = getFluid(entGx, entBodyGy);

            const inWater = (footFl?.type === IDS.WATER) || (bodyFl?.type === IDS.WATER);
            const inLava = (footFl?.type === IDS.LAVA) || (bodyFl?.type === IDS.LAVA);

            if (inWater) {
                this.fallStartY = this.y;
                this.vx *= 0.86;
                if (this.vy > 2.0) this.vy = 2.0;
                const isChicken = (this.constructor && this.constructor.name === 'Chicken');
                const buoyancyFactor = isChicken ? 1.5 : 0.95;
                this.vy -= GRAVITY * buoyancyFactor;
                const flow = getFluidFlowVector(entGx, entFootGy);
                this.vx += flow.vx * 0.7;
            } else if (inLava) {
                this.fallStartY = this.y;
                this.vx *= 0.50;
                this.vy *= 0.55;
                if (this.vy > 1.2) this.vy = 1.2;
                this.vy -= GRAVITY * 0.5;
                if (this.health !== undefined && frameCount % 16 === 0) {
                    if (typeof this.takeDamage === 'function') {
                        this.takeDamage(4, 0);
                    } else if (typeof this.applyMobDamage === 'function') {
                        this.applyMobDamage(4, 0, '#ff4500');
                    }
                    const PClass = getParticleClass();
                    if (PClass && Array.isArray(particles)) {
                        for (let i = 0; i < 3; i++) {
                            particles.push(new PClass(this.x + this.width / 2, this.y + this.height / 2, '#ff4500'));
                        }
                    }
                }
            }
        }

        this.vy += GRAVITY;
        if (this.vy > TERMINAL_VELOCITY) this.vy = TERMINAL_VELOCITY;

        this.x += this.vx;
        this.handleCollisions(true);

        this.y += this.vy;
        this.isGrounded = false;
        this.handleCollisions(false);

        // Downward slope assist for grounded walking on stairs
        const activeWorldPhys = this.getActiveWorld();
        if (this.isGrounded && Math.abs(this.vx) > 0.1 && this.vy === 0 && activeWorldPhys) {
            const footGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const footGy = Math.floor((this.y + this.height + 4) / TILE_SIZE);
            const bUnder = activeWorldPhys[footGx]?.[footGy];
            const isUnderStairs = (bUnder === IDS.WOODEN_STAIRS || bUnder === IDS.WOODEN_STAIRS_LEFT || bUnder === IDS.WOODEN_STAIRS_RIGHT ||
                                   bUnder === IDS.COBBLESTONE_STAIRS || bUnder === IDS.COBBLESTONE_STAIRS_LEFT || bUnder === IDS.COBBLESTONE_STAIRS_RIGHT);
            if (isUnderStairs) {
                const isRight = (bUnder === IDS.WOODEN_STAIRS_RIGHT || bUnder === IDS.COBBLESTONE_STAIRS_RIGHT);
                const isLeft = (bUnder === IDS.WOODEN_STAIRS || bUnder === IDS.WOODEN_STAIRS_LEFT ||
                               bUnder === IDS.COBBLESTONE_STAIRS || bUnder === IDS.COBBLESTONE_STAIRS_LEFT);

                const isDescending = (isRight && this.vx < -0.1) || (isLeft && this.vx > 0.1);
                if (isDescending) {
                    const bUnderMinX = footGx * TILE_SIZE;
                    const bUnderMinY = footGy * TILE_SIZE;
                    const stepMinX = isRight ? bUnderMinX + TILE_SIZE / 2 : bUnderMinX;
                    const stepMaxX = isRight ? bUnderMinX + TILE_SIZE : bUnderMinX + TILE_SIZE / 2;
                    
                    const curLeft = this.x + 0.05;
                    const curRight = this.x + this.width - 0.05;
                    const onHigh = isRight ? (curRight > stepMinX) : (curLeft < stepMaxX);
                    const targetFloor = onHigh ? bUnderMinY : (bUnderMinY + TILE_SIZE / 2);
                    const dropDist = targetFloor - (this.y + this.height);
                    if (dropDist > 0 && dropDist <= TILE_SIZE / 2 + 4) {
                        const testY = targetFloor - this.height - 0.05;
                        if (this.canFitAt(this.x, testY)) {
                            this.y = testY;
                        }
                    }
                }
            }
        }

        const isChickenInst = (this.constructor && this.constructor.name === 'Chicken');
        if (!wasGrounded && this.isGrounded && prevVy > 0 && !isPlayerInst && !isChickenInst && this.health !== undefined) {
            const curGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const curGy = Math.floor((this.y + this.height - 2) / TILE_SIZE);
            if (!isWater(curGx, curGy, this) && this.fallStartY !== undefined) {
                const fallTiles = (this.y - this.fallStartY) / TILE_SIZE;
                if (fallTiles > 4) {
                    const fallDmg = Math.floor(fallTiles - 4);
                    if (fallDmg > 0 && typeof this.takeDamage === 'function') {
                        this.takeDamage(fallDmg, 0);
                    }
                }
            }
            this.fallStartY = this.y;
        }

        if (this.health !== undefined && !isPlayerInst) checkCactusContact(this);
        
        const activeWorld = this.getActiveWorld();
        const maxWorldW = activeWorld ? activeWorld.length : ((typeof window !== 'undefined' && window.menuWorld && window.menuWorld.width) ? window.menuWorld.width : WORLD_WIDTH);
        if (this.x < 0) this.x = 0;
        if (this.x > maxWorldW * TILE_SIZE - this.width) this.x = maxWorldW * TILE_SIZE - this.width;
    }

    checkObstacleJump(dir) {
        if (!this.isGrounded || this.vx === 0) return;
        const activeWorld = this.getActiveWorld();
        if (!activeWorld) return;
        const curWorldW = activeWorld.length;
        const stepDir = dir !== undefined ? dir : (this.vx > 0 ? 1 : -1);
        const checkX = Math.floor((this.x + this.width / 2 + stepDir * (this.width / 2 + 5)) / TILE_SIZE);
        const footY = Math.floor((this.y + this.height - 5) / TILE_SIZE);
        const headY = Math.floor((this.y + 5) / TILE_SIZE);
        if (checkX >= 0 && checkX < curWorldW) {
            const b = activeWorld[checkX]?.[footY];
            const upperB = activeWorld[checkX]?.[headY - 1];
            if (b !== undefined && isSolidWorldBlock(checkX, footY, b) && !isSolidWorldBlock(checkX, headY - 1, upperB) && !isWater(checkX, headY - 1, this)) {
                this.vy = JUMP_FORCE;
                this.isGrounded = false;
            }
        }
    }

    applyMobDamage(amt, knockbackDir, particleColor = '#3b6a2c', knockbackForce = 4.0) {
        if (this.damageCooldown > 0) return false;
        this.health -= amt;
        this.damageCooldown = 15;

        let resistance = 0;
        const diff = (typeof currentDifficulty !== 'undefined') ? currentDifficulty : 'normal';
        if (diff === 'normal') resistance = 0.20;
        else if (diff === 'hard' || diff === 'hardcore') resistance = 0.45;

        if (this.isFrenzied || this.isLunging) {
            resistance += 0.25;
        }
        resistance = Math.min(0.85, resistance);

        const finalForce = Math.max(0.6, (knockbackForce !== undefined ? knockbackForce : 4.0) * (1 - resistance));
        this.vy = -3.0 * (1 - resistance * 0.4);
        this.vx = (knockbackDir || 0) * finalForce;

        const PClass = getParticleClass();
        if (PClass && Array.isArray(particles)) {
            for (let i = 0; i < 8; i++) {
                particles.push(new PClass(this.x + this.width / 2, this.y + this.height / 2, particleColor));
            }
        }
        const FTClass = getFloatingTextClass();
        if (FTClass && Array.isArray(floatingTexts)) {
            floatingTexts.push(new FTClass(this.x + this.width / 2, this.y - 10, amt, "#ffcc00"));
        }
        return true;
    }

    handleCollisions(isAxisX) {
        const eps = 0.05; 
        const activeWorld = this.getActiveWorld();
        if (!activeWorld) return;
        const curWorldW = activeWorld.length;
        const curWorldH = activeWorld[0]?.length || 0;
        if (!curWorldW || !curWorldH) return;
        
        let leftTile = Math.floor((this.x + (isAxisX ? 0 : eps)) / TILE_SIZE);
        let rightTile = Math.floor((this.x + this.width - (isAxisX ? 0 : eps)) / TILE_SIZE);
        let topTile = Math.floor((this.y + (isAxisX ? eps : 0)) / TILE_SIZE);
        let bottomTile = Math.floor((this.y + this.height - (isAxisX ? eps : 0)) / TILE_SIZE);

        leftTile = Math.max(0, Math.min(leftTile, curWorldW - 1));
        rightTile = Math.max(0, Math.min(rightTile, curWorldW - 1));
        topTile = Math.max(0, Math.min(topTile, curWorldH - 1));
        bottomTile = Math.max(0, Math.min(bottomTile, curWorldH - 1));

        for (let y = topTile; y <= bottomTile; y++) {
            for (let x = leftTile; x <= rightTile; x++) {
                let block = activeWorld[x][y];
                if (isSolidWorldBlock(x, y, block)) {
                    let bMinX = x * TILE_SIZE;
                    let bMaxX = (x + 1) * TILE_SIZE;
                    let bMinY = y * TILE_SIZE;
                    let bMaxY = (y + 1) * TILE_SIZE;

                    if (block === IDS.DOOR || block === IDS.DOOR_TOP || block === IDS.JUNGLE_DOOR || block === IDS.JUNGLE_DOOR_TOP) {
                        bMinX = x * TILE_SIZE + 2.5;
                        bMaxX = x * TILE_SIZE + 12.5;
                    }

                    let curLeft = this.x + (isAxisX ? 0 : eps);
                    let curRight = this.x + this.width - (isAxisX ? 0 : eps);
                    let curTop = this.y + (isAxisX ? eps : 0);
                    let curBottom = this.y + this.height - (isAxisX ? eps : 0);

                    let isStairRight = (block === IDS.WOODEN_STAIRS_RIGHT || block === IDS.COBBLESTONE_STAIRS_RIGHT);
                    let isStairLeft = (block === IDS.WOODEN_STAIRS || block === IDS.WOODEN_STAIRS_LEFT || block === IDS.COBBLESTONE_STAIRS || block === IDS.COBBLESTONE_STAIRS_LEFT);

                    if (isStairRight || isStairLeft) {
                        let slabMinY = bMinY + TILE_SIZE / 2;
                        let hitSlab = (curRight > bMinX && curLeft < bMaxX && curBottom > slabMinY && curTop < bMaxY);
                        let stepMinX = isStairRight ? bMinX + TILE_SIZE / 2 : bMinX;
                        let stepMaxX = isStairRight ? bMaxX : bMinX + TILE_SIZE / 2;
                        let hitStep = (curRight > stepMinX && curLeft < stepMaxX && curBottom > bMinY && curTop < slabMinY);

                        if (hitSlab || hitStep) {
                            if (isAxisX) {
                                const moveDir = this.vx;
                                let targetSurface = null;
                                if (moveDir > 0) {
                                    if (isStairRight) {
                                        targetSurface = (hitStep || curRight > stepMinX) ? bMinY : slabMinY;
                                    } else {
                                        if (curBottom <= bMinY + 4) targetSurface = bMinY;
                                    }
                                } else if (moveDir < 0) {
                                    if (isStairLeft) {
                                        targetSurface = (hitStep || curLeft < stepMaxX) ? bMinY : slabMinY;
                                    } else {
                                        if (curBottom <= bMinY + 4) targetSurface = bMinY;
                                    }
                                }

                                let stepHeight = targetSurface !== null ? ((this.y + this.height) - targetSurface) : 999;
                                let canStepUp = false;
                                if (stepHeight > 0 && stepHeight <= TILE_SIZE / 2 + 4) {
                                    let testTargetY = targetSurface - this.height - 0.05;
                                    if (this.canFitAt(this.x, testTargetY)) {
                                        canStepUp = true;
                                    }
                                }

                                if (canStepUp) {
                                    this.y = targetSurface - this.height - 0.05;
                                    this.isGrounded = true;
                                    this.vy = 0;
                                } else {
                                    if (moveDir > 0) this.x = (hitStep ? stepMinX : bMinX) - this.width - 0.1;
                                    else if (moveDir < 0) this.x = (hitStep ? stepMaxX : bMaxX) + 0.1;
                                    this.vx = 0;
                                }
                            } else {
                                let onHigh = isStairRight ? (curRight > stepMinX) : (curLeft < stepMaxX);
                                let floorY = onHigh ? bMinY : slabMinY;

                                if (this.vy >= 0) {
                                    this.y = floorY - this.height - 0.05;
                                    this.isGrounded = true;
                                    this.vy = 0;
                                } else if (this.vy < 0) {
                                    this.y = bMaxY + 0.05;
                                    this.vy = 0;
                                }
                            }
                        }
                        continue;
                    }

                    if (curRight > bMinX && curLeft < bMaxX && curBottom > bMinY && curTop < bMaxY) {
                        if (isAxisX) {
                            if (this.vx > 0) this.x = bMinX - this.width - 0.1;
                            else if (this.vx < 0) this.x = bMaxX + 0.1;
                            this.vx = 0;
                        } else {
                            if (this.vy > 0 || this.vy === 0) {
                                this.y = bMinY - this.height - 0.05;
                                this.isGrounded = true;
                            } else if (this.vy < 0) {
                                this.y = bMaxY + 0.05;
                            }
                            this.vy = 0;
                        }
                    }
                }
            }
        }
    }
}

// Window self-registration for backward compatibility
try {
    if (typeof window !== 'undefined') {
        window.PhysicsEntity = PhysicsEntity;
        window.checkCactusContact = checkCactusContact;
    }
} catch (e) {}