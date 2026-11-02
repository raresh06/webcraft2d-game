import { advancedGraphics } from '../core/config.js';
import { drawCharacter, skinCanvasObj } from '../rendering/character.js';
// =============================================================================
// WEBCRAFT 2D - PLAYER ENTITY (js/entities/player.js)
// Movement, status effects, hunger/oxygen, tool power, durability & damage
// =============================================================================

import {
    IDS, TILE_SIZE, MOVE_SPEED, JUMP_FORCE, HARDNESS, DIFFICULTIES,
    getDayHungerDrainMultiplier, isTool, isPickaxeBlock, isAxeBlock,
    isShovelBlock, isShearsBlock, isFoodItem, getRequiredMiningTier,
    ensureArmorDurability, ensureToolDurability, ARMOR_DEFENSE
} from '../core/constants.js';

import {
    world, player, inventory, selectedHotbarIndex, equippedArmor, isInventoryOpen,
    mouse, keys, isSleeping, isMultiplayer, currentMpRoom, currentDifficulty,
    currentWorldId, frameCount, particles, floatingTexts, attackAnimationTimer,
    WORLD_WIDTH, WORLD_HEIGHT, setEngineState
} from '../core/state.js';

import {
    isSolidWorldBlock, isClimbableBlock, isDoorBlock, isWater, canHarvestBlock
} from '../world/blockhelper.js';

import {
    getFluid, getFluidFlowVector, triggerSteamEffect
} from '../world/fluids.js';

import {
    PhysicsEntity
} from './physicsentity.js';

function getParticleClass() {
    if (typeof window !== 'undefined' && window.Particle) return window.Particle;
    return null;
}

function getFloatingTextClass() {
    if (typeof window !== 'undefined' && window.FloatingText) return window.FloatingText;
    return null;
}

function getPlaySoundFn() {
    if (typeof window !== 'undefined' && typeof window.playSound === 'function') return window.playSound;
    return null;
}

export function getTotalArmorDefense() {
    const curArmor = (typeof equippedArmor !== 'undefined' && Array.isArray(equippedArmor)) ? equippedArmor : (typeof window !== 'undefined' && Array.isArray(window.equippedArmor) ? window.equippedArmor : []);
    let total = 0;
    for (let i = 0; i < 4; i++) {
        const piece = curArmor[i];
        if (piece && piece.id && ARMOR_DEFENSE[piece.id]) {
            total += ARMOR_DEFENSE[piece.id];
        }
    }
    return total;
}

export function getArmorDamageReductionRatio() {
    const defense = getTotalArmorDefense();
    return Math.min(0.80, (defense * 4) / 100);
}

export function isActionActive(action) {
    if (typeof window !== 'undefined' && typeof window.isActionActive === 'function' && window.isActionActive !== isActionActive) {
        return window.isActionActive(action);
    }
    if (typeof window !== 'undefined' && window.GamepadManager && typeof window.GamepadManager.isGamepadActionActive === 'function') {
        if (window.GamepadManager.isGamepadActionActive(action)) return true;
    }
    const activeKeys = (typeof window !== 'undefined' && window.keys) ? window.keys : keys;
    if (!activeKeys) return false;
    if (action === 'left') return !!(activeKeys['KeyA'] || activeKeys['ArrowLeft'] || activeKeys['a'] || activeKeys['A'] || activeKeys['arrowleft']);
    if (action === 'right') return !!(activeKeys['KeyD'] || activeKeys['ArrowRight'] || activeKeys['d'] || activeKeys['D'] || activeKeys['arrowright']);
    if (action === 'jump') return !!(activeKeys['KeyW'] || activeKeys['Space'] || activeKeys['ArrowUp'] || activeKeys['w'] || activeKeys['W'] || activeKeys[' '] || activeKeys['arrowup']);
    if (action === 'sneak' || action === 'down') return !!(activeKeys['ShiftLeft'] || activeKeys['ShiftRight'] || activeKeys['KeyS'] || activeKeys['ArrowDown'] || activeKeys['s'] || activeKeys['S'] || activeKeys['arrowdown']);
    return false;
}

export function getFootstepMaterial(p) {
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    if (!p || !Array.isArray(curWorld) || curWorld.length === 0) return 'dirt';

    const xPositions = [
        p.x + 4,
        p.x + (p.width || 24) / 2,
        p.x + (p.width || 24) - 4
    ];
    
    const footGy = Math.floor(((p.y || 0) + (p.height || 48) - 2) / TILE_SIZE);
    const bodyGy = Math.floor(((p.y || 0) + (p.height || 48) / 2) / TILE_SIZE);
    const headGy = Math.floor(((p.y || 0) + 4) / TILE_SIZE);
    const belowGy = Math.floor(((p.y || 0) + (p.height || 48) + 2) / TILE_SIZE);

    for (let posX of xPositions) {
        const gx = Math.floor(posX / TILE_SIZE);
        if (isClimbableBlock(curWorld[gx]?.[footGy]) || isClimbableBlock(curWorld[gx]?.[bodyGy]) || isClimbableBlock(curWorld[gx]?.[headGy])) {
            return 'ladder';
        }
    }

    for (let posX of xPositions) {
        const gx = Math.floor(posX / TILE_SIZE);
        if (isWater(gx, footGy) || isWater(gx, bodyGy) || isWater(gx, belowGy)) {
            return 'water';
        }
    }

    const checkTiles = [];
    for (let posX of xPositions) {
        const gx = Math.floor(posX / TILE_SIZE);
        if (gx >= 0 && gx < WORLD_WIDTH && Array.isArray(curWorld[gx])) {
            if (footGy >= 0 && footGy < WORLD_HEIGHT) {
                const blockAtFeet = curWorld[gx][footGy];
                if (blockAtFeet !== undefined && blockAtFeet !== IDS.AIR && blockAtFeet !== IDS.TORCH) {
                    checkTiles.push(blockAtFeet);
                }
            }
            if (belowGy >= 0 && belowGy < WORLD_HEIGHT) {
                const blockBelow = curWorld[gx][belowGy];
                if (blockBelow !== undefined && blockBelow !== IDS.AIR && blockBelow !== IDS.TORCH) {
                    checkTiles.push(blockBelow);
                }
            }
        }
    }

    for (const block of checkTiles) {
        if (block === IDS.SNOW) return 'snow';
        if (block === IDS.SAND) return 'sand';
        if (block === IDS.GRASS || block === IDS.SHORT_GRASS || block === IDS.TALL_GRASS || block === IDS.FLOWER_RED || block === IDS.FLOWER_YELLOW || block === IDS.SAPLING) {
            return 'grass';
        }
        if (block === IDS.LEAVES) return 'leaves';
        if (block === IDS.WOOL) return 'wool';
        if (block === IDS.LADDER) return 'ladder';
        if (block === IDS.WOOD || block === IDS.PLANKS || block === IDS.CRAFTING_TABLE || 
            block === IDS.JUKEBOX ||
            block === IDS.WOODEN_STAIRS || block === IDS.WOODEN_STAIRS_LEFT || block === IDS.WOODEN_STAIRS_RIGHT ||
            block === IDS.DOOR || block === IDS.DOOR_TOP || block === IDS.DOOR_OPEN || block === IDS.DOOR_OPEN_TOP ||
            block === IDS.CHEST || block === IDS.BED) {
            return 'wood';
        }
        if (block === IDS.STONE || block === IDS.COBBLESTONE || block === IDS.COBBLESTONE_STAIRS ||
            block === IDS.COBBLESTONE_STAIRS_LEFT || block === IDS.COBBLESTONE_STAIRS_RIGHT ||
            block === IDS.COAL_ORE || block === IDS.IRON_ORE || block === IDS.GOLD_ORE ||
            block === IDS.DIAMOND_ORE || block === IDS.FURNACE) {
            return 'stone';
        }
        if (block === IDS.DIRT) return 'dirt';
        if (block === IDS.CACTUS) return 'wood';
    }

    return 'dirt';
}

export function dismountParrot(p, shoulder) {
    if (!p) return;
    p.isMounted = false;
    p.mountedShoulder = null;
    const curPlayer = (typeof player !== 'undefined' && player) ? player : (typeof window !== 'undefined' ? window.player : null);
    if (curPlayer) {
        p.x = curPlayer.x + (shoulder === 'left' ? -12 : 12);
        p.y = curPlayer.y - 12;
    }
    p.state = 'flying';
    p.vy = -3.2;
    p.vx = (shoulder === 'left' ? -2.2 : 2.2);
    p.flightTimer = 200;
    const snd = getPlaySoundFn();
    if (snd) snd('parrot_chirp', { vol: 0.7 });
}

export function dismountAllShoulderParrots() {
    const curPlayer = (typeof player !== 'undefined' && player) ? player : (typeof window !== 'undefined' ? window.player : null);
    if (!curPlayer) return;
    if (curPlayer.leftShoulderParrot) {
        dismountParrot(curPlayer.leftShoulderParrot, 'left');
        curPlayer.leftShoulderParrot = null;
    }
    if (curPlayer.rightShoulderParrot) {
        dismountParrot(curPlayer.rightShoulderParrot, 'right');
        curPlayer.rightShoulderParrot = null;
    }
}

export class Player extends PhysicsEntity {
    constructor(x, y) {
        super(x, y, TILE_SIZE * 0.75, TILE_SIZE * 1.8);
        this.maxHealth = 20; this.health = 20;
        this.hunger = 20; this.exhaustion = 0; this.eatTimer = 0;
        this.maxOxygen = 10; this.oxygen = this.maxOxygen;
        this.damageCooldown = 0; this.isDead = false; this.facingRight = true;
        this.walkAnimTime = 0;
        this.walkBlend = 0;
        this.fallStartY = y;
        this.poisonTimer = 0;
        this.gloomTetherTimer = 0;
        this.gloomBlindTimer = 0;
        this.shadowSwiftTimer = 0;
        this.airborneTicks = 0;
        this.leftShoulderParrot = null;
        this.rightShoulderParrot = null;
    }

    update() {
        if (this.isDead) return;
        if (isSleeping) return;

        if (typeof window !== 'undefined' && window.devCheats) {
            if (window.devCheats.godMode) {
                this.health = this.maxHealth || 20;
                this.oxygen = this.maxOxygen || 20;
                this.hunger = 20;
                this.exhaustion = 0;
                this.poisonTimer = 0;
                this.gloomBlindTimer = 0;
                this.gloomTetherTimer = 0;
            }
            if (window.devCheats.infiniteOxygen) {
                this.oxygen = this.maxOxygen || 20;
            }
            if (window.devCheats.infiniteHunger) {
                this.hunger = 20;
                this.exhaustion = 0;
            }
            if (window.devCheats.noclip) {
                let mx = 0;
                let my = 0;
                let flySpeed = (MOVE_SPEED * 2.5) * (window.devCheats.speedMultiplier || 1.0);
                const activeKeys = (typeof window !== 'undefined' && window.keys) ? window.keys : (typeof keys !== 'undefined' ? keys : {});
                if (isActionActive('left') || activeKeys['KeyA'] || activeKeys['ArrowLeft'] || activeKeys['a'] || activeKeys['A']) mx -= 1;
                if (isActionActive('right') || activeKeys['KeyD'] || activeKeys['ArrowRight'] || activeKeys['d'] || activeKeys['D']) mx += 1;
                if (isActionActive('jump') || activeKeys['KeyW'] || activeKeys['ArrowUp'] || activeKeys['Space'] || activeKeys['w'] || activeKeys['W'] || activeKeys[' ']) my -= 1;
                if (isActionActive('down') || isActionActive('sneak') || activeKeys['KeyS'] || activeKeys['ArrowDown'] || activeKeys['ShiftLeft'] || activeKeys['ShiftRight'] || activeKeys['s'] || activeKeys['S']) my += 1;

                const gpMoveAxis = (typeof window !== 'undefined' && window.GamepadManager && typeof window.GamepadManager.getGamepadMoveAxis === 'function') ? window.GamepadManager.getGamepadMoveAxis() : 0;
                if (Math.abs(gpMoveAxis) > 0.05) {
                    mx = Math.max(-1.0, Math.min(1.0, gpMoveAxis));
                }

                if (isActionActive('sprint') || activeKeys['ControlLeft'] || activeKeys['ControlRight']) {
                    flySpeed *= 1.8;
                }

                if (mx < -0.05) this.facingRight = false;
                else if (mx > 0.05) this.facingRight = true;

                if (mx !== 0 || my !== 0) {
                    this.walkAnimTime += 0.2;
                    this.walkBlend = Math.min(1.0, this.walkBlend + 0.15);
                } else {
                    this.walkBlend = Math.max(0, this.walkBlend - 0.1);
                }

                if (this.damageCooldown > 0) this.damageCooldown--;
                this.airborneTicks = 0;
                this.x += mx * flySpeed;
                this.y += my * flySpeed;
                this.vx = 0;
                this.vy = 0;
                this.fallStartY = this.y;
                this.isGrounded = false;
                this.x = Math.max(0, Math.min((WORLD_WIDTH - 1) * TILE_SIZE, this.x));
                this.y = Math.max(-500, Math.min((WORLD_HEIGHT + 20) * TILE_SIZE, this.y));
                return;
            }
        }

        if (this.damageCooldown > 0) this.damageCooldown--;

        const curInventory = (typeof inventory !== 'undefined') ? inventory : (typeof window !== 'undefined' ? window.inventory : []);
        const curHotbarIndex = (typeof selectedHotbarIndex !== 'undefined') ? selectedHotbarIndex : (typeof window !== 'undefined' ? window.selectedHotbarIndex : 0);
        const hasGloomLantern = (curInventory[curHotbarIndex]?.id === IDS.GLOOM_LANTERN || curInventory[27]?.id === IDS.GLOOM_LANTERN);
        if (hasGloomLantern) {
            this.gloomBlindTimer = 0;
            if (this.gloomTetherTimer > 0) this.gloomTetherTimer = Math.max(0, this.gloomTetherTimer - 3);
        }

        const PClass = getParticleClass();
        const FTClass = getFloatingTextClass();
        const sndFn = getPlaySoundFn();

        if (this.gloomTetherTimer > 0) {
            this.gloomTetherTimer--;
            if (frameCount % 10 === 0 && PClass && Array.isArray(particles)) {
                particles.push(new PClass(this.x + Math.random() * this.width, this.y + this.height - 4, '#7c3aed'));
            }
        }

        if (this.gloomBlindTimer > 0) {
            this.gloomBlindTimer--;
        }

        if (this.shadowSwiftTimer > 0) {
            this.shadowSwiftTimer--;
            if (frameCount % 5 === 0 && PClass && Array.isArray(particles)) {
                particles.push(new PClass(this.x + Math.random() * this.width, this.y + this.height - 2, '#c084fc'));
            }
        }

        if (this.poisonTimer > 0) {
            this.poisonTimer--;
            if (this.poisonTimer % 75 === 0 && this.health > 1 && !this.isDead) {
                this.health -= 1;
                this.damageCooldown = 12;
                if (typeof window.updateHealthUI === 'function') window.updateHealthUI();
                if (sndFn) sndFn('hurt');
                if (PClass && Array.isArray(particles)) {
                    for (let i = 0; i < 3; i++) {
                        particles.push(new PClass(this.x + Math.random() * this.width, this.y + Math.random() * this.height, '#4ade80'));
                    }
                }
                if (FTClass && Array.isArray(floatingTexts)) {
                    floatingTexts.push(new FTClass(this.x + this.width / 2, this.y - 10, "-1", "#4ade80"));
                }
            }
            if (this.poisonTimer === 0 && typeof window.updateHealthUI === 'function') window.updateHealthUI();
        }

        let diff = DIFFICULTIES[currentDifficulty] || DIFFICULTIES.normal;
        const wasGrounded = this.isGrounded;
        const prevVy = this.vy;

        if (this.isGrounded) {
            this.fallStartY = this.y;
        } else if (this.vy <= 0) {
            this.fallStartY = Math.min(this.fallStartY ?? this.y, this.y);
        }

        const hungerRate = getDayHungerDrainMultiplier();
        let moveDir = 0;
        const gpMoveAxis = (typeof window !== 'undefined' && window.GamepadManager && typeof window.GamepadManager.getGamepadMoveAxis === 'function') ? window.GamepadManager.getGamepadMoveAxis() : 0;
        if (Math.abs(gpMoveAxis) > 0.01) {
            moveDir = Math.max(-1.0, Math.min(1.0, gpMoveAxis));
            if (moveDir < -0.05) this.facingRight = false;
            else if (moveDir > 0.05) this.facingRight = true;
        } else if (isActionActive('left')) { 
            moveDir = -1; this.facingRight = false; 
        } else if (isActionActive('right')) { 
            moveDir = 1; this.facingRight = true; 
        }

        if (moveDir !== 0) {
            let speedMult = 1.0;
            const curArmor = (typeof equippedArmor !== 'undefined' && Array.isArray(equippedArmor)) ? equippedArmor : (this.equippedArmor || (typeof window !== 'undefined' ? window.equippedArmor : null));
            const boots = curArmor ? curArmor[3] : null;
            if (boots && (boots.id === IDS.STRIDER_BOOTS || boots.id === IDS.ASTRAL_BOOTS)) {
                speedMult = 1.25;
            }
            if (this.shadowSwiftTimer > 0) {
                speedMult *= 1.35;
            }
            if (this.gloomTetherTimer > 0) {
                speedMult *= 0.55;
            }
            let speedDevMult = (typeof window !== 'undefined' && window.devCheats?.speedMultiplier) ? window.devCheats.speedMultiplier : 1.0;
            let targetVx = moveDir * MOVE_SPEED * speedMult * speedDevMult;
            if (this.isGrounded) {
                this.vx += (targetVx - this.vx) * 0.45;
            } else {
                this.vx += (targetVx - this.vx) * 0.28;
            }
            this.exhaustion += 0.005 * hungerRate * Math.abs(moveDir);
        } else {
            if (this.isGrounded) {
                this.vx *= 0.55;
                if (Math.abs(this.vx) < 0.15) this.vx = 0;
            } else {
                this.vx *= 0.88;
                if (Math.abs(this.vx) < 0.1) this.vx = 0;
            }
        }

        if (isActionActive('jump') && this.isGrounded) {
            let jumpMult = (typeof window !== 'undefined' && window.devCheats?.highJump) ? 1.8 : 1.0;
            this.vy = JUMP_FORCE * jumpMult;
            this.isGrounded = false;
            this.exhaustion += 0.05 * hungerRate;
        }
        
        const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
        const pGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
        const pFootGy = Math.floor((this.y + this.height - 2) / TILE_SIZE);
        const pWaistGy = Math.floor((this.y + this.height * 0.6) / TILE_SIZE);
        const pChestGy = Math.floor((this.y + this.height * 0.3) / TILE_SIZE);
        const pHeadGy = Math.floor((this.y + 4) / TILE_SIZE);
        const onLadder = curWorld && (isClimbableBlock(curWorld[pGx]?.[pFootGy]) || 
                         isClimbableBlock(curWorld[pGx]?.[pWaistGy]) || 
                         isClimbableBlock(curWorld[pGx]?.[pChestGy]) || 
                         isClimbableBlock(curWorld[pGx]?.[pHeadGy]));

        const footFluid = getFluid(pGx, pFootGy);
        const waistFluid = getFluid(pGx, pWaistGy);
        const chestFluid = getFluid(pGx, pChestGy);
        const headFluid = getFluid(pGx, pHeadGy);
        const inWater = (footFluid?.type === IDS.WATER) || (waistFluid?.type === IDS.WATER) || (chestFluid?.type === IDS.WATER) || (headFluid?.type === IDS.WATER);
        const inLava = (footFluid?.type === IDS.LAVA) || (waistFluid?.type === IDS.LAVA) || (chestFluid?.type === IDS.LAVA) || (headFluid?.type === IDS.LAVA);

        if (!this._wasInWater && inWater) {
            if (this.vy > 2.5) {
                if (sndFn) sndFn('splash', { vol: Math.min(1.0, this.vy / 6) });
                if (PClass && Array.isArray(particles)) {
                    for (let i = 0; i < 8; i++) {
                        let p = new PClass(this.x + this.width / 2 + (Math.random() - 0.5) * 12, pFootGy * TILE_SIZE + 2, i % 2 === 0 ? '#38bdf8' : '#ffffff');
                        p.vy = -2.0 - Math.random() * 3.5;
                        p.vx = (Math.random() - 0.5) * 4.5;
                        p.size = 2 + Math.random() * 2;
                        p.life = 18;
                        particles.push(p);
                    }
                }
                this.vy = Math.min(2.0, this.vy * 0.35);
            }
            if (this.burnTimer > 0) {
                this.burnTimer = 0;
                if (sndFn) sndFn('fizz');
                triggerSteamEffect(pGx, pFootGy);
            }
        }
        this._wasInWater = inWater;

        if (inWater) {
            this.fallStartY = this.y;
            this.vx *= 0.84;
            const submergedCount = (footFluid?.type === IDS.WATER ? 1 : 0) + (waistFluid?.type === IDS.WATER ? 1 : 0) + (chestFluid?.type === IDS.WATER ? 1 : 0) + (headFluid?.type === IDS.WATER ? 1 : 0);
            
            this.vy *= 0.85;
            this.vy -= (typeof window !== 'undefined' && window.GRAVITY ? window.GRAVITY : 0.42) * 0.72;
            if (this.vy > 1.4) this.vy = 1.4;

            const flow = getFluidFlowVector(pGx, waistFluid ? pWaistGy : pFootGy);
            this.vx += flow.vx;
            if (flow.vy) this.vy += flow.vy;

            if (isActionActive('jump')) {
                if (submergedCount <= 2) {
                    this.vy = Math.max(JUMP_FORCE * 0.85, this.vy - 1.2);
                    if (frameCount % 20 === 0 && sndFn) sndFn('swim');
                } else {
                    this.vy = Math.max(-3.5, this.vy - 0.75);
                    if (frameCount % 20 === 0 && sndFn) sndFn('swim');
                }
            }
            if (isActionActive('down')) {
                this.vy = Math.min(2.8, this.vy + 0.65);
            }

            if (advancedGraphics && (Math.abs(this.vx) > 0.4 || Math.abs(this.vy) > 0.4) && frameCount % 6 === 0 && PClass && Array.isArray(particles)) {
                particles.push(new PClass(this.x + this.width / 2 + (Math.random() - 0.5) * 8, this.y + this.height * 0.6, 'rgba(160, 230, 255, 0.75)'));
            }
        } else if (inLava) {
            this.fallStartY = this.y;
            this.burnTimer = 240;
            this.vx *= 0.45;
            this.vy *= 0.55;
            if (this.vy > 1.2) this.vy = 1.2;
            this.vy -= (typeof window !== 'undefined' && window.GRAVITY ? window.GRAVITY : 0.42) * 0.55;

            const flow = getFluidFlowVector(pGx, waistFluid ? pWaistGy : pFootGy);
            this.vx += flow.vx * 0.7;

            if (isActionActive('jump')) {
                this.vy = Math.max(-1.8, this.vy - 0.45);
            }
            if (isActionActive('down')) {
                this.vy = Math.min(1.4, this.vy + 0.35);
            }
            if (frameCount % 16 === 0) {
                this.takeDamage(4);
                if (sndFn) sndFn('fizz');
                if (PClass && Array.isArray(particles)) {
                    for (let i = 0; i < 4; i++) {
                        particles.push(new PClass(this.x + this.width / 2, this.y + this.height / 2, '#ff4500'));
                    }
                }
            }
        }

        if (this.burnTimer > 0 && !inWater) {
            this.burnTimer--;
            if (frameCount % 30 === 0 && !this.isDead) {
                this.takeDamage(1);
                if (sndFn) sndFn('fizz');
            }
            if (frameCount % 4 === 0 && PClass && Array.isArray(particles)) {
                particles.push(new PClass(this.x + Math.random() * this.width, this.y + Math.random() * this.height, Math.random() < 0.6 ? '#ff4500' : '#ffaa00'));
            }
        }

        const fullySubmerged = headFluid?.type === IDS.WATER && chestFluid?.type === IDS.WATER;
        const previousOxygen = this.oxygen;
        if (fullySubmerged) {
            if (frameCount % 25 === 0) this.oxygen = Math.max(0, this.oxygen - 1);
            if (this.oxygen <= 0 && frameCount % 15 === 0) this.takeDamage(2);
            if (this.oxygen <= 3) this._hadCriticalOxygen = true;
            if (frameCount % 20 === 0 && PClass && Array.isArray(particles)) {
                let bP = new PClass(this.x + this.width / 2 + (Math.random() - 0.5) * 6, this.y + 2, 'rgba(255, 255, 255, 0.85)');
                bP.vy = -1.2;
                bP.vx = (Math.random() - 0.5) * 0.4;
                bP.size = 2;
                bP.life = 25;
                particles.push(bP);
            }
        } else {
            if (this._hadCriticalOxygen && this.oxygen >= this.maxOxygen - 0.5) {
                this._hadCriticalOxygen = false;
                if (typeof window.unlockAchievement === 'function') window.unlockAchievement('deep_diver_breath');
            }
            this.oxygen = Math.min(this.maxOxygen, this.oxygen + 0.22);
        }
        if ((fullySubmerged || previousOxygen !== this.oxygen) && typeof window.updateOxygenUI === 'function') {
            window.updateOxygenUI(fullySubmerged);
        }

        // Check village biome exploration achievement
        if (frameCount % 30 === 0) {
            const pGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const getBiomeFn = (typeof getActiveBiomeAt === 'function') ? getActiveBiomeAt : ((typeof window !== 'undefined' && typeof window.getActiveBiomeAt === 'function') ? window.getActiveBiomeAt : null);
            if (getBiomeFn && getBiomeFn(pGx) === 'village') {
                if (typeof window !== 'undefined' && typeof window.unlockAchievement === 'function') {
                    window.unlockAchievement('village_discovery');
                }
            }
        }

        if (this.isGrounded) {
            this.airborneTicks = 0;
        } else {
            this.airborneTicks++;
        }

        const isWalking = moveDir !== 0 && (this.isGrounded || this.airborneTicks <= 4) && Math.abs(this.vx) > 0.15;
        if (isWalking) {
            this.walkAnimTime += (Math.abs(this.vx) / MOVE_SPEED) * 0.20;
            this.walkBlend = Math.min(1.0, (this.walkBlend || 0) + 0.18);
        } else if (!this.isGrounded && this.airborneTicks > 4) {
            this.walkBlend = Math.max(0.0, (this.walkBlend || 0) - 0.08);
        } else {
            this.walkBlend = Math.max(0.0, (this.walkBlend || 0) - 0.12);
            if (this.walkBlend <= 0.01) {
                this.walkBlend = 0;
                this.walkAnimTime = 0;
            } else {
                this.walkAnimTime += 0.06;
            }
        }
        if (advancedGraphics && Math.abs(this.vx) > 0.5 && this.isGrounded && frameCount % 7 === 0 && PClass && Array.isArray(particles)) {
            let footDust = new PClass(this.x + this.width / 2, this.y + this.height - 2, '#b8a982');
            footDust.vx = -this.vx * 0.08 + (Math.random() - 0.5) * 1.5;
            footDust.vy = -1.2 - Math.random() * 1.2;
            footDust.life = 10 + Math.random() * 8;
            footDust.size = 2 + Math.random() * 2;
            particles.push(footDust);
        }

        if (this.isGrounded && Math.abs(this.vx) > 0.5 && !onLadder && !inWater) {
            if (frameCount % 18 === 0 && sndFn) {
                const mat = getFootstepMaterial(this);
                sndFn('step', { material: mat });
            }
        } else if (onLadder && (this.vy !== 0) && frameCount % 16 === 0 && sndFn) {
            sndFn('step', { material: 'ladder' });
        } else if (inWater && (Math.abs(this.vx) > 0.5 || this.vy < -0.5) && frameCount % 22 === 0 && sndFn) {
            sndFn('step', { material: 'water' });
        }

        if (currentDifficulty === 'peaceful') {
            this.exhaustion = 0;
            if (this.hunger < 20 && frameCount % 20 === 0) {
                this.hunger++;
                if (typeof window.updateHungerUI === 'function') window.updateHungerUI();
            }
            if (this.health < this.maxHealth && frameCount % diff.hpRegen === 0) {
                this.health++;
                if (typeof window.updateHealthUI === 'function') window.updateHealthUI();
            }
        } else {
            if (diff.starve && frameCount % 120 === 0 && hungerRate > 1.0) {
                this.exhaustion += 0.012 * (hungerRate - 1);
            }

            const exhaustionCap = (currentDifficulty === 'easy') ? 8.0 : 4.0;
            const maxExhaustion = Math.max(2.4, exhaustionCap / Math.max(0.1, hungerRate));
            if (this.exhaustion >= maxExhaustion) {
                this.exhaustion = 0;
                this.hunger = Math.max(0, this.hunger - 1);
                if (typeof window.updateHungerUI === 'function') window.updateHungerUI();
                const hBar = (typeof document !== 'undefined') ? document.getElementById('hunger-bar') : null;
                if (hBar) {
                    if (this.hunger === 0) hBar.classList.add('shake-ui');
                    else hBar.classList.remove('shake-ui');
                }
            }

            if (this.hunger >= 18 && this.health < this.maxHealth && frameCount % diff.hpRegen === 0) {
                this.health++;
                this.exhaustion += 2 * hungerRate;
                if (typeof window.updateHealthUI === 'function') window.updateHealthUI(); 
            }
            if (this.hunger === 0 && diff.starve && frameCount % 60 === 0) {
                this.takeDamage(1);
            }
        }

        const headBlock = curWorld ? curWorld[pGx]?.[pHeadGy] : undefined;
        if (headBlock !== undefined && isSolidWorldBlock(pGx, pHeadGy, headBlock) && !isDoorBlock(headBlock) && headBlock !== IDS.LADDER) {
            if (frameCount % 30 === 0 && !this.isDead) {
                this.takeDamage(1);
                if (advancedGraphics && Math.random() < 0.5 && PClass && Array.isArray(particles)) {
                    particles.push(new PClass(this.x + this.width / 2 + (Math.random() - 0.5) * 8, this.y + 4, '#e6cc80'));
                }
            }
        }

        const curMouse = (typeof mouse !== 'undefined' && mouse) ? mouse : (typeof window !== 'undefined' ? window.mouse : {});
        if (curMouse.isDownRight && !isInventoryOpen) {
            let sel = curInventory[curHotbarIndex];
            if (sel && isFoodItem(sel.id) && this.hunger < 20) {
                this.eatTimer++;
                if (this.eatTimer > 20) {
                    let val = (sel.id === IDS.COOKED_PORKCHOP || sel.id === IDS.COOKED_MUTTON || sel.id === IDS.COOKED_BEEF) ? 8 : 
                              (sel.id === IDS.COOKED_CHICKEN || sel.id === IDS.SUNBURST_MELON_SLICE ? 6 : 
                              (sel.id === IDS.BREAD ? 5 : 
                              (sel.id === IDS.APPLE || sel.id === IDS.VOID_BERRY ? 4 : 
                              (sel.id === IDS.RAW_BEEF ? 3 : 2))));
                    this.hunger = Math.min(20, this.hunger + val);
                    if ((sel.id === IDS.MELON_SLICE || sel.id === IDS.SUNBURST_MELON_SLICE || sel.id === IDS.VOID_BERRY) && this.health < this.maxHealth) {
                        const healAmt = (sel.id === IDS.SUNBURST_MELON_SLICE || sel.id === IDS.VOID_BERRY) ? 2 : 1;
                        this.health = Math.min(this.maxHealth, this.health + healAmt);
                        if (typeof window.updateHealthUI === 'function') window.updateHealthUI();
                    }
                    const eatenId = sel.id;
                    sel.count--;
                    if (sel.count <= 0) curInventory[curHotbarIndex] = null;
                    if (typeof window.updateHungerUI === 'function') window.updateHungerUI();
                    if (typeof window.updateUI === 'function') window.updateUI();
                    if (sndFn) sndFn('eat');
                    if (typeof window !== 'undefined' && typeof window.trackDailyQuestProgress === 'function') {
                        window.trackDailyQuestProgress('eat_food', { itemId: eatenId });
                    }
                    if (eatenId === IDS.VOID_BERRY && typeof window.unlockAchievement === 'function') {
                        window.unlockAchievement('void_nourishment');
                    }
                    if (eatenId === IDS.SUNBURST_MELON_SLICE && typeof window.unlockAchievement === 'function') {
                        window.unlockAchievement('solar_nourishment');
                    }
                    let pColor = (eatenId === IDS.VOID_BERRY) ? '#c084fc' : ((eatenId === IDS.SUNBURST_MELON_SLICE) ? '#f59e0b' : ((eatenId === IDS.MELON_SLICE) ? '#ef4444' : ((eatenId === IDS.COOKED_PORKCHOP || eatenId === IDS.COOKED_MUTTON || eatenId === IDS.COOKED_BEEF) ? '#8B4513' : (eatenId === IDS.RAW_BEEF ? '#991b1b' : (eatenId === IDS.COOKED_CHICKEN ? '#d98c53' : (eatenId === IDS.BREAD ? '#d2b48c' : (eatenId === IDS.APPLE ? '#ff3333' : '#ff99cc')))))));
                    if (PClass && Array.isArray(particles)) {
                        for (let i = 0; i < 10; i++) particles.push(new PClass(this.x + this.width / 2, this.y, pColor));
                    }
                }
            } else { this.eatTimer = 0; }
        } else { this.eatTimer = 0; }

        if (onLadder) {
            this.isClimbing = true;
            this.fallStartY = this.y;
            if (isActionActive('jump')) {
                this.vy = -3.1;
                this.exhaustion += 0.008 * hungerRate;
                this.walkAnimTime += 0.24;
                if (typeof window.unlockAchievement === 'function') window.unlockAchievement('ladder_climber');
            } else if (isActionActive('down')) {
                this.vy = 2.8;
                this.walkAnimTime += 0.24;
                if (typeof window.unlockAchievement === 'function') window.unlockAchievement('ladder_climber');
            } else {
                this.vy = 0;
            }
        } else {
            this.isClimbing = false;
        }

        const autoJumpOn = (typeof window !== 'undefined' && typeof window.autoJumpEnabled !== 'undefined') ? window.autoJumpEnabled : true;
        if (autoJumpOn && Math.abs(this.vx) > 0.5 && this.isGrounded && !onLadder) {
            let dir = this.vx > 0 ? 1 : -1;
            let frontX = Math.floor((this.x + (dir > 0 ? this.width + 3 : -3)) / TILE_SIZE);
            let currentX = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            let footTileY = Math.floor((this.y + this.height - 4) / TILE_SIZE);
            let headTileY = Math.floor((this.y + 4) / TILE_SIZE);
            
            if (curWorld && frontX >= 0 && frontX < WORLD_WIDTH && frontX !== currentX) {
                let bObstacle = curWorld[frontX]?.[footTileY];
                let bAboveObstacle = curWorld[frontX]?.[footTileY - 1];
                let bHeadRoom = curWorld[currentX]?.[headTileY - 1];

                let isStairsObstacle = (bObstacle === IDS.WOODEN_STAIRS || bObstacle === IDS.WOODEN_STAIRS_LEFT || bObstacle === IDS.WOODEN_STAIRS_RIGHT ||
                                        bObstacle === IDS.COBBLESTONE_STAIRS || bObstacle === IDS.COBBLESTONE_STAIRS_LEFT || bObstacle === IDS.COBBLESTONE_STAIRS_RIGHT);

                if (!isStairsObstacle && isSolidWorldBlock(frontX, footTileY, bObstacle) && 
                    !isSolidWorldBlock(frontX, footTileY - 1, bAboveObstacle) && 
                    !isSolidWorldBlock(currentX, headTileY - 1, bHeadRoom)) {
                    this.vy = JUMP_FORCE; 
                    this.isGrounded = false;
                }
            }
        }

        if (Math.abs(this.vx) > 0.5 && this.isGrounded && !onLadder && curWorld) {
            let dir = this.vx > 0 ? 1 : -1;
            let frontX = Math.floor((this.x + this.width / 2 + dir * (this.width / 2 + 1)) / TILE_SIZE);
            let currentX = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            let footY = Math.floor((this.y + this.height - 2) / TILE_SIZE);
            if (frontX >= 0 && frontX < WORLD_WIDTH && frontX !== currentX) {
                let bFoot = curWorld[frontX]?.[footY];
                let isStairs = (bFoot === IDS.WOODEN_STAIRS || bFoot === IDS.WOODEN_STAIRS_LEFT || bFoot === IDS.WOODEN_STAIRS_RIGHT ||
                                bFoot === IDS.COBBLESTONE_STAIRS || bFoot === IDS.COBBLESTONE_STAIRS_LEFT || bFoot === IDS.COBBLESTONE_STAIRS_RIGHT);
                if (isStairs && !isSolidWorldBlock(frontX, footY - 1, curWorld[frontX]?.[footY - 1])) {
                    let stairTopY = footY * TILE_SIZE + TILE_SIZE / 2;
                    if (this.y + this.height > stairTopY && this.y + this.height <= footY * TILE_SIZE + TILE_SIZE) {
                        this.y = stairTopY - this.height;
                        this.isGrounded = true;
                    }
                }
            }
        }

        this.applyPhysics();

        if (this.leftShoulderParrot || this.rightShoulderParrot) {
            const px = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const py = Math.floor((this.y + this.height - 2) / TILE_SIZE);
            const inWaterNow = isWater(px, py) || isWater(px, py - 1);
            if (inWaterNow || this.vy > 4.5 || this.vy < -5.5 || Math.abs(this.vx) > 0.4) {
                dismountAllShoulderParrots();
            }
        }

        if (!wasGrounded && this.isGrounded && prevVy > 0) {
            const landingInWater = isWater(Math.floor((this.x + this.width / 2) / TILE_SIZE), Math.floor((this.y + this.height - 2) / TILE_SIZE)) || isWater(Math.floor((this.x + this.width / 2) / TILE_SIZE), Math.floor((this.y + this.height / 2) / TILE_SIZE));
            if (!landingInWater && this.fallStartY !== undefined) {
                const fallDistanceTiles = (this.y - this.fallStartY) / TILE_SIZE;
                if (fallDistanceTiles > 4) {
                    const fallDamage = Math.floor(fallDistanceTiles - 4);
                    if (fallDamage > 0) {
                        this.takeDamage(fallDamage);
                    }
                }
            }
            this.fallStartY = this.y;
        }

        this.checkCactusContact();
        if (this.y > WORLD_HEIGHT * TILE_SIZE) this.takeDamage(999);
    }

    checkCactusContact() {
        const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
        if (!curWorld) return;
        const padding = 2;
        const leftTile = Math.max(0, Math.floor((this.x - padding) / TILE_SIZE));
        const rightTile = Math.min(WORLD_WIDTH - 1, Math.floor((this.x + this.width + padding) / TILE_SIZE));
        const topTile = Math.max(0, Math.floor((this.y - padding) / TILE_SIZE));
        const bottomTile = Math.min(WORLD_HEIGHT - 1, Math.floor((this.y + this.height + padding) / TILE_SIZE));
        for (let tileY = topTile; tileY <= bottomTile; tileY++) {
            for (let tileX = leftTile; tileX <= rightTile; tileX++) {
                if (curWorld[tileX]?.[tileY] === IDS.CACTUS) {
                    this.takeDamage(1);
                    return;
                }
            }
        }
    }

    resetEat() {
        this.eatTimer = 0; 
        if (typeof document !== 'undefined') {
            const hotbarEl = document.getElementById('hotbar');
            if (hotbarEl && hotbarEl.children[selectedHotbarIndex]) {
                hotbarEl.children[selectedHotbarIndex].classList.remove('eating-anim');
            }
        }
    }

    takeDamage(amt) {
        if (typeof window !== 'undefined' && window.devCheats?.godMode) {
            this.health = this.maxHealth || 20;
            this.oxygen = this.maxOxygen || 20;
            return;
        }
        if (this.damageCooldown > 0 || this.isDead) return;
        let diff = DIFFICULTIES[currentDifficulty] || DIFFICULTIES.normal;

        if (this.leftShoulderParrot || this.rightShoulderParrot) {
            dismountAllShoulderParrots();
        }
        
        let reductionRatio = getArmorDamageReductionRatio();
        let reducedAmt = amt * (1 - reductionRatio);
        let finalAmt = Math.round(reducedAmt * diff.mobDmg);
        if (amt > 0 && finalAmt < 1) finalAmt = 1;

        const curArmor = (typeof equippedArmor !== 'undefined' && Array.isArray(equippedArmor)) ? equippedArmor : (this.equippedArmor || (typeof window !== 'undefined' ? window.equippedArmor : []));
        const sndFn = getPlaySoundFn();

        if (amt > 0 && curArmor) {
            let brokeAnyArmor = false;
            for (let i = 0; i < 4; i++) {
                if (curArmor[i] && curArmor[i].id) {
                    ensureArmorDurability(curArmor[i]);
                    curArmor[i].durability -= Math.max(1, Math.round(amt / 2));
                    if (curArmor[i].durability <= 0) {
                        curArmor[i] = null;
                        brokeAnyArmor = true;
                    }
                }
            }
            if (brokeAnyArmor) {
                if (sndFn) sndFn('break_tool');
                if (typeof window.showToast === 'function') window.showToast('Armor piece broke!');
            }
            if (typeof window.updateArmorUI === 'function') window.updateArmorUI();
        }

        this.health -= finalAmt;
        this.damageCooldown = 30;
        this.vy = -4; 
        this.lastDamageEvent = { id: `${Date.now()}-${Math.random()}`, amount: finalAmt };
        if (typeof window.updateHealthUI === 'function') window.updateHealthUI();
        if (sndFn) sndFn('hurt');
        if (typeof window !== 'undefined' && window.GamepadManager && typeof window.GamepadManager.triggerGamepadVibration === 'function') {
            window.GamepadManager.triggerGamepadVibration(160, 0.6, 0.85);
        }
        
        const FTClass = getFloatingTextClass();
        if (FTClass && Array.isArray(floatingTexts)) {
            floatingTexts.push(new FTClass(this.x + this.width / 2, this.y - 10, "-" + finalAmt, "#ff3333"));
        }

        if (typeof document !== 'undefined' && document.body) {
            let flash = document.createElement('div');
            flash.className = 'fixed inset-0 bg-red-600/30 pointer-events-none z-50 transition-opacity duration-300';
            document.body.appendChild(flash);
            setTimeout(() => { if (flash && flash.style) flash.style.opacity = '0'; setTimeout(() => { if (flash && typeof flash.remove === 'function') flash.remove(); }, 300); }, 50);
        }

        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            this.poisonTimer = 0;
            if (typeof window.toggleBackgroundBuildMode === 'function') window.toggleBackgroundBuildMode(false);
            if (diff.permadeath && curArmor) {
                if (Array.isArray(inventory)) inventory.fill(null);
                curArmor.fill(null);
                if (typeof window.updateArmorUI === 'function') window.updateArmorUI();
            }
            if (typeof window.updateUI === 'function') window.updateUI();
            setEngineState('DEAD');
            if (isMultiplayer && window.user && currentMpRoom && typeof window.syncLocalPlayerState === 'function') {
                window.syncLocalPlayerState(true);
            }
            if (diff.permadeath && !isMultiplayer) {
                if (typeof window.deleteWorld === 'function') window.deleteWorld(currentWorldId, false);
                const sub = (typeof document !== 'undefined') ? document.getElementById('death-subtitle') : null;
                if (sub) sub.innerText = "Hardcore Mode: World Deleted!";
                const rBtn = (typeof document !== 'undefined') ? document.getElementById('respawn-btn') : null;
                if (rBtn) rBtn.classList.add('hidden');
                const aCont = (typeof document !== 'undefined') ? document.getElementById('death-astral-container') : null;
                if (aCont) aCont.classList.add('hidden');
            } else {
                const sub = (typeof document !== 'undefined') ? document.getElementById('death-subtitle') : null;
                if (sub) sub.innerText = "Game Over";
                const rBtn = (typeof document !== 'undefined') ? document.getElementById('respawn-btn') : null;
                if (rBtn) rBtn.classList.remove('hidden');
                if (typeof window.setupDeathScreen === 'function') {
                    window.setupDeathScreen();
                }
            }
            const dMenu = (typeof document !== 'undefined') ? document.getElementById('death-menu') : null;
            if (dMenu) dMenu.classList.remove('hidden');
            const hud = (typeof document !== 'undefined') ? document.getElementById('hud') : null;
            if (hud) hud.style.display = 'none';
        } else if (isMultiplayer && window.user && currentMpRoom && typeof window.syncLocalPlayerState === 'function') {
            window.syncLocalPlayerState(true);
        }
    }

    getToolPower(targetBlock) {
        const curInventory = (typeof inventory !== 'undefined') ? inventory : (typeof window !== 'undefined' ? window.inventory : []);
        const curHotbarIndex = (typeof selectedHotbarIndex !== 'undefined') ? selectedHotbarIndex : (typeof window !== 'undefined' ? window.selectedHotbarIndex : 0);
        let item = curInventory[curHotbarIndex];
        if (item) ensureToolDurability(item);
        if (item && isTool(item.id) && item.durability <= 0) return 0;
        let id = item ? item.id : null;

        // 1. Pickaxe blocks
        if (isPickaxeBlock(targetBlock) || (HARDNESS[targetBlock] >= 100 && !isAxeBlock(targetBlock) && !isShovelBlock(targetBlock))) {
            const requiredTier = getRequiredMiningTier(targetBlock);
            if (requiredTier > 0 && !canHarvestBlock(targetBlock)) {
                return 0.1 * Math.pow(0.5, requiredTier - 1);
            }
            if (id === IDS.ASTRAL_PICKAXE) return 24;
            if (id === IDS.DIAMOND_PICKAXE) return 18;
            if (id === IDS.GOLD_PICKAXE) return 12;
            if (id === IDS.IRON_PICKAXE) return 9;
            if (id === IDS.STONE_PICKAXE) return 6;
            if (id === IDS.WOOD_PICKAXE) return 3;
            return 1.0;
        }

        // 2. Axe blocks
        if (isAxeBlock(targetBlock)) {
            if (id === IDS.ASTRAL_AXE) return 24;
            if (id === IDS.DIAMOND_AXE) return 18;
            if (id === IDS.GOLD_AXE) return 12;
            if (id === IDS.IRON_AXE) return 9;
            if (id === IDS.STONE_AXE) return 8;
            if (id === IDS.WOOD_AXE) return 5;

            if (targetBlock === IDS.BAMBOO || targetBlock === IDS.MELON || targetBlock === IDS.SUNBURST_MELON) {
                if (id === IDS.ASTRAL_SWORD) return 18;
                if (id === IDS.DIAMOND_SWORD) return 14;
                if (id === IDS.GOLD_SWORD) return 10;
                if (id === IDS.IRON_SWORD || id === IDS.SHADOWFANG) return 8;
                if (id === IDS.STONE_SWORD) return 6;
                if (id === IDS.WOOD_SWORD) return 4;
            }

            if (id === IDS.ASTRAL_PICKAXE) return 4.0;
            if (id === IDS.DIAMOND_PICKAXE) return 2.8;
            if (id === IDS.GOLD_PICKAXE) return 2.2;
            if (id === IDS.IRON_PICKAXE) return 1.8;
            if (id === IDS.STONE_PICKAXE) return 1.4;
            if (id === IDS.WOOD_PICKAXE) return 1.2;

            if (id === IDS.ASTRAL_SHOVEL) return 3.5;
            if (id === IDS.DIAMOND_SHOVEL) return 2.5;
            if (id === IDS.GOLD_SHOVEL) return 2.0;
            if (id === IDS.IRON_SHOVEL) return 1.6;
            if (id === IDS.STONE_SHOVEL) return 1.3;
            if (id === IDS.WOOD_SHOVEL) return 1.1;

            if (id === IDS.ASTRAL_SWORD) return 2.5;
            if (id === IDS.DIAMOND_SWORD) return 2.0;
            if (id === IDS.GOLD_SWORD || id === IDS.IRON_SWORD || id === IDS.SHADOWFANG) return 1.5;
            if (id === IDS.STONE_SWORD || id === IDS.WOOD_SWORD) return 1.2;

            return (id && id >= 100) ? 1.2 : 1.0;
        }

        // 3. Shovel blocks
        if (isShovelBlock(targetBlock)) {
            if (id === IDS.ASTRAL_SHOVEL) return 24;
            if (id === IDS.DIAMOND_SHOVEL) return 18;
            if (id === IDS.GOLD_SHOVEL) return 12;
            if (id === IDS.IRON_SHOVEL) return 9;
            if (id === IDS.STONE_SHOVEL) return 6;
            if (id === IDS.WOOD_SHOVEL) return 4;

            if (id === IDS.ASTRAL_PICKAXE) return 3.2;
            if (id === IDS.DIAMOND_PICKAXE) return 2.4;
            if (id === IDS.GOLD_PICKAXE) return 2.0;
            if (id === IDS.IRON_PICKAXE) return 1.6;
            if (id === IDS.STONE_PICKAXE) return 1.3;
            if (id === IDS.WOOD_PICKAXE) return 1.1;

            if (id === IDS.ASTRAL_AXE) return 3.2;
            if (id === IDS.DIAMOND_AXE) return 2.4;
            if (id === IDS.GOLD_AXE) return 2.0;
            if (id === IDS.IRON_AXE) return 1.6;
            if (id === IDS.STONE_AXE) return 1.3;
            if (id === IDS.WOOD_AXE) return 1.1;

            return (id && id >= 100) ? 1.2 : 1.0;
        }

        // 4. Shears / Foliage blocks
        if (isShearsBlock(targetBlock)) {
            if (id === IDS.KINETIC_SHEARS || id === IDS.SHEARS) return 24;
            if (id === IDS.ASTRAL_SWORD) return 15;
            if (id === IDS.DIAMOND_SWORD || id === IDS.SHADOWFANG) return 12;
            if (id === IDS.GOLD_SWORD || id === IDS.IRON_SWORD) return 8;
            if (id === IDS.STONE_SWORD || id === IDS.WOOD_SWORD) return 5;
            if (id === IDS.ASTRAL_AXE || id === IDS.ASTRAL_PICKAXE || id === IDS.ASTRAL_SHOVEL) return 4.0;
            return (id && id >= 100) ? 2.0 : 1.0;
        }

        if (id === IDS.ASTRAL_PICKAXE || id === IDS.ASTRAL_AXE || id === IDS.ASTRAL_SHOVEL) return 3.5;
        if (id === IDS.DIAMOND_PICKAXE || id === IDS.DIAMOND_AXE || id === IDS.DIAMOND_SHOVEL) return 2.5;
        return (id && id >= 100) ? 1.5 : 1.0;
    }
    
    getWeaponDamage() {
        const curInventory = (typeof inventory !== 'undefined') ? inventory : (typeof window !== 'undefined' ? window.inventory : []);
        const curHotbarIndex = (typeof selectedHotbarIndex !== 'undefined') ? selectedHotbarIndex : (typeof window !== 'undefined' ? window.selectedHotbarIndex : 0);
        let item = curInventory[curHotbarIndex];
        if (!item) return 1;
        const dmgMap = {
            [IDS.SHADOWFANG]: 8, [IDS.ASTRAL_SWORD]: 12,
            [IDS.DIAMOND_SWORD]: 10, [IDS.IRON_SWORD]: 8, [IDS.GOLD_SWORD]: 8, [IDS.STONE_SWORD]: 6, [IDS.WOOD_SWORD]: 4,
            [IDS.ASTRAL_AXE]: 9.5, [IDS.DIAMOND_AXE]: 8, [IDS.IRON_AXE]: 7, [IDS.GOLD_AXE]: 6, [IDS.STONE_AXE]: 5, [IDS.WOOD_AXE]: 3,
            [IDS.ASTRAL_PICKAXE]: 5, [IDS.DIAMOND_PICKAXE]: 4, [IDS.IRON_PICKAXE]: 3.5, [IDS.GOLD_PICKAXE]: 3, [IDS.STONE_PICKAXE]: 2.5, [IDS.WOOD_PICKAXE]: 2,
            [IDS.ASTRAL_SHOVEL]: 5.5, [IDS.DIAMOND_SHOVEL]: 4.5, [IDS.IRON_SHOVEL]: 3.5, [IDS.GOLD_SHOVEL]: 3, [IDS.STONE_SHOVEL]: 2.5, [IDS.WOOD_SHOVEL]: 1.5,
            [IDS.DIAMOND_HOE]: 3, [IDS.IRON_HOE]: 2.5, [IDS.GOLD_HOE]: 2, [IDS.STONE_HOE]: 1.5, [IDS.WOOD_HOE]: 1
        };
        return dmgMap[item.id] || 1;
    }

    draw(ctx, camX, camY) {
        if (this.isDead) return;
        const drawX = Math.round(this.x - camX);
        const drawY = Math.round(this.y - camY);
        
        if (advancedGraphics && typeof window !== 'undefined' && window.cachedShadowCanvas) {
            ctx.drawImage(window.cachedShadowCanvas, drawX + this.width / 2 - this.width / 2.2, drawY + this.height - 6, this.width * (2 / 2.2), 8);
        }

        let isAttacking = attackAnimationTimer > 0;
        const curInventory = (typeof inventory !== 'undefined') ? inventory : (typeof window !== 'undefined' ? window.inventory : []);
        const curHotbarIndex = (typeof selectedHotbarIndex !== 'undefined') ? selectedHotbarIndex : (typeof window !== 'undefined' ? window.selectedHotbarIndex : 0);
        let activeItem = curInventory[curHotbarIndex] ? curInventory[curHotbarIndex].id : null;
        const isMoving = (this.walkBlend || 0) > 0.05 || Math.abs(this.vx) > 0.15;
        const curMouse = (typeof mouse !== 'undefined' && mouse) ? mouse : (typeof window !== 'undefined' ? window.mouse : {});
        const activeSkin = (typeof window !== 'undefined' && window.skinCanvasObj) ? window.skinCanvasObj : skinCanvasObj;
        const drawCharFn = (typeof drawCharacter === 'function') ? drawCharacter : (typeof window !== 'undefined' ? window.drawCharacter : null);
        
        if (drawCharFn) {
            drawCharFn(
                ctx, activeSkin, drawX, drawY, this.width, this.height, 
                this.facingRight, this.walkAnimTime, isMoving, this.damageCooldown > 0,
                isInventoryOpen ? null : curMouse.worldX - camX, 
                isInventoryOpen ? null : curMouse.worldY - camY, 
                isAttacking, activeItem, this.isClimbing, null,
                { left: this.leftShoulderParrot, right: this.rightShoulderParrot },
                this.walkBlend !== undefined ? this.walkBlend : 1.0
            );
        }
    }
}

// Window self-registration for backward compatibility
try {
    if (typeof window !== 'undefined') {
        window.Player = Player;
        window.getTotalArmorDefense = getTotalArmorDefense;
        window.getArmorDamageReductionRatio = getArmorDamageReductionRatio;
        window.isActionActive = isActionActive;
        window.getFootstepMaterial = getFootstepMaterial;
        window.dismountParrot = dismountParrot;
        window.dismountAllShoulderParrots = dismountAllShoulderParrots;
    }
} catch (e) {}