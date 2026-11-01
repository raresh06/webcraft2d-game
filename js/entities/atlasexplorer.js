// =============================================================================
// WEBCRAFT 2D - ATLAS EXPLORER NPC (js/entities/atlasexplorer.js)
// Kael the Atlas Explorer, Planar Rift teleports, dialogue and cosmetics NPC
// =============================================================================

import {
    IDS, TILE_SIZE, MOVE_SPEED, GRAVITY, TERMINAL_VELOCITY, JUMP_FORCE
} from '../core/constants.js';

import {
    world, player, entities, particles, floatingTexts, camera,
    WORLD_WIDTH, WORLD_HEIGHT, isMultiplayer, isMultiplayerAuthority, frameCount
} from '../core/state.js';

import {
    advancedGraphics
} from '../core/config.js';

import {
    isSolidWorldBlock, getWorldSurfaceY
} from '../world/blockhelper.js';

import {
    
} from '../world/fluids.js';

import {
    } from '../world/worldgen.js';

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

function playSound(name, opts) {
    if (typeof window !== 'undefined' && typeof window.playSound === 'function') {
        return window.playSound(name, opts);
    }
}

function drawCharacter(...args) {
    if (typeof window !== 'undefined' && typeof window.drawCharacter === 'function') {
        return window.drawCharacter(...args);
    }
}

function openAtlasDialogue(...args) {
    if (typeof window !== 'undefined' && typeof window.openAtlasDialogue === 'function') {
        return window.openAtlasDialogue(...args);
    }
}

function openAtlasMarket(...args) {
    if (typeof window !== 'undefined' && typeof window.openAtlasMarket === 'function') {
        return window.openAtlasMarket(...args);
    }
}

export function broadcastDataPacket(packet) {
    if (typeof window !== 'undefined' && window.network && typeof window.network.broadcastData === 'function') {
        window.network.broadcastData(packet);
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

    export let kaelSkinCanvas = null;
    export function getKaelSkinCanvas() {
        if (kaelSkinCanvas) return kaelSkinCanvas;
        if (typeof document === 'undefined') return null;
        const c = document.createElement('canvas');
        c.width = 16;
        c.height = 32;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const p = (x, y, col) => {
            ctx.fillStyle = col;
            ctx.fillRect(x, y, 1, 1);
        };
        const rect = (x, y, w, h, col) => {
            ctx.fillStyle = col;
            ctx.fillRect(x, y, w, h);
        };

        // --- 1. HEAD (8x8 at x: 4, y: 0) - Human face matching player build ---
        // Base human skin
        rect(4, 0, 8, 8, '#e8b188');
        // Facial shading & jawline
        rect(4, 6, 8, 2, '#dba075');
        rect(6, 7, 4, 1, '#c68b59');
        // Windswept dark chestnut traveler hair
        rect(4, 0, 8, 2, '#4a2e1b');
        p(4, 2, '#4a2e1b'); p(11, 2, '#4a2e1b');
        p(5, 2, '#6e4428'); // Hair highlight
        p(6, 2, '#4a2e1b'); p(7, 2, '#362012'); // Bangs
        // Explorer brass goggles resting on forehead
        p(6, 1, '#fbbf24'); p(7, 1, '#0284c7'); // Left goggle brass rim & cyan lens
        p(8, 1, '#fbbf24'); p(9, 1, '#0284c7'); // Right goggle
        // Human Eyes (white sclera with celestial cyan iris & dark pupil)
        // Left eye at (5, 4)
        p(5, 4, '#ffffff'); p(6, 4, '#0284c7');
        p(5, 3, '#362012'); // Eyebrow
        // Right eye at (9, 4)
        p(9, 4, '#0284c7'); p(10, 4, '#ffffff');
        p(10, 3, '#362012'); // Eyebrow
        // Nose & mouth
        p(7, 5, '#c68a5f');
        p(7, 6, '#995832'); p(8, 6, '#995832');

        // --- 2. TORSO (8x12 at x: 4, y: 8) ---
        // Celestial indigo tunic base
        rect(4, 8, 8, 12, '#1e1b4b');
        // Open rugged leather traveler vest
        rect(4, 8, 2, 9, '#582d12');
        rect(10, 8, 2, 9, '#582d12');
        p(5, 8, '#783d19'); p(10, 8, '#783d19');
        // Celestial collar / scarf
        rect(6, 8, 4, 2, '#312e81');
        p(7, 9, '#fbbf24'); // Gold celestial star clasp
        // Diagonal leather explorer sash
        p(5, 10, '#451a03'); p(6, 11, '#451a03'); p(7, 12, '#fbbf24'); p(8, 13, '#451a03'); p(9, 14, '#451a03');
        // Sturdy belt with brass buckle
        rect(4, 16, 8, 2, '#2e1102');
        p(7, 16, '#fbbf24'); p(8, 16, '#fbbf24');
        p(5, 17, '#0284c7'); // Astrolabe pouch charm

        // --- 3. FRONT ARM (4x12 at x: 0, y: 8) ---
        // Leather adventurer coat shoulder sleeve
        rect(0, 8, 4, 4, '#582d12');
        p(1, 8, '#783d19');
        // Folded tunic sleeve
        rect(0, 12, 4, 3, '#1e1b4b');
        // Bare human forearm / wrist wrap
        rect(0, 15, 4, 2, '#dba075');
        // Traveler's fingerless glove & hand
        rect(0, 17, 4, 3, '#451a03');
        rect(1, 18, 2, 2, '#e8b188'); // Exposed human fingers

        // --- 4. BACK ARM (4x12 at x: 12, y: 8) ---
        rect(12, 8, 4, 4, '#3d1a08'); // Shadowed shoulder
        rect(12, 12, 4, 3, '#161928'); // Shadowed sleeve
        rect(12, 15, 4, 2, '#c68a5f'); // Forearm
        rect(12, 17, 4, 3, '#2e1102'); // Glove

        // --- 5. FRONT LEG (4x12 at x: 4, y: 20) ---
        // Deep indigo traveler trousers
        rect(4, 20, 4, 6, '#1e2337');
        p(5, 21, '#272f48'); p(6, 23, '#161928');
        // Sturdy laced explorer boots
        rect(4, 26, 4, 6, '#451a03');
        p(5, 27, '#d97706'); p(5, 29, '#d97706'); // Brass lace buckles
        rect(4, 31, 4, 1, '#1e0c01'); // Boot sole

        // --- 6. BACK LEG (4x12 at x: 8, y: 20) ---
        // Shadowed trousers
        rect(8, 20, 4, 6, '#141826');
        // Shadowed boots
        rect(8, 26, 4, 6, '#2e1102');
        p(9, 27, '#b45309'); p(9, 29, '#b45309');
        rect(8, 31, 4, 1, '#130700');

        kaelSkinCanvas = c;
        return kaelSkinCanvas;
    }

    export function findSafeKaelPositionNear(playerRef, minDist = 18, maxDist = 28) {
        const curWorld = (typeof world !== 'undefined' && world) ? world : ((typeof window !== 'undefined' && window.world) ? window.world : null);
        if (!curWorld || !playerRef) return null;

        const curWorldW = curWorld.length || WORLD_WIDTH;
        const pGx = Math.floor((playerRef.x + (playerRef.width || 24) / 2) / TILE_SIZE);
        const pFootGy = Math.floor((playerRef.y + (playerRef.height || 48) - 2) / TILE_SIZE);
        const pFacingDir = (playerRef.facingRight !== false) ? 1 : -1;

        // Viewport bounds detection to ensure Kael spawns close, but not visible on-screen
        const curCanvas = (typeof canvas !== 'undefined' && canvas) ? canvas : (typeof window !== 'undefined' && window.canvas ? window.canvas : null);
        const curCamera = (typeof camera !== 'undefined' && camera) ? camera : (typeof window !== 'undefined' && window.camera ? window.camera : null);

        let effectiveMin = minDist;
        let effectiveMax = maxDist;

        if (minDist >= 12 && curCanvas) {
            const halfScreenTiles = Math.ceil((curCanvas.width / 2) / TILE_SIZE);
            effectiveMin = Math.max(minDist, halfScreenTiles + 3);
            effectiveMax = Math.max(maxDist, effectiveMin + 10);
        }

        const isVisibleOnCamera = (pxX, pxY) => {
            if (!curCanvas || !curCamera) return false;
            const pad = 16;
            return (
                pxX + (TILE_SIZE * 0.75) >= curCamera.x - pad &&
                pxX <= curCamera.x + curCanvas.width + pad &&
                pxY + (TILE_SIZE * 1.8) >= curCamera.y - pad &&
                pxY <= curCamera.y + curCanvas.height + pad
            );
        };

        const kaelW = TILE_SIZE * 0.75;
        const kaelH = TILE_SIZE * 1.8;

        // Candidate distances shuffled from effectiveMin to effectiveMax
        const distances = [];
        for (let d = effectiveMin; d <= effectiveMax; d++) {
            distances.push(d);
        }
        for (let i = distances.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = distances[i];
            distances[i] = distances[j];
            distances[j] = tmp;
        }

        const dirs = (Math.random() > 0.5) ? [pFacingDir, -pFacingDir] : [-pFacingDir, pFacingDir];
        const verticalOffsets = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6, -7, 7, -8, 8, -9, 9, -10, 10, -12, 12, -15, 15];

        const visibleFallbackCandidates = [];

        // 1. Primary pass: find a safe surface at candidate distance that is NOT visible on-screen
        for (const dist of distances) {
            for (const dir of dirs) {
                const candGx = pGx + (dist * dir);
                if (candGx < 3 || candGx >= curWorldW - 3) continue;

                for (const dy of verticalOffsets) {
                    const candGy = pFootGy + dy;
                    if (candGy < 3 || candGy >= WORLD_HEIGHT - 3) continue;

                    const floorB = curWorld[candGx]?.[candGy + 1];
                    const feetB = curWorld[candGx]?.[candGy];
                    const torsoB = curWorld[candGx]?.[candGy - 1];
                    const headB = curWorld[candGx]?.[candGy - 2];

                    const isFloorSolid = floorB !== undefined && isSolidWorldBlock(candGx, candGy + 1, floorB) && floorB !== IDS.LAVA && floorB !== IDS.WATER && floorB !== IDS.CACTUS;
                    const isFeetClear = feetB === IDS.AIR || (feetB !== undefined && !isSolidWorldBlock(candGx, candGy, feetB) && feetB !== IDS.LAVA && feetB !== IDS.CACTUS);
                    const isTorsoClear = torsoB === IDS.AIR || (torsoB !== undefined && !isSolidWorldBlock(candGx, candGy - 1, torsoB) && torsoB !== IDS.LAVA && torsoB !== IDS.CACTUS);
                    const isHeadClear = headB === IDS.AIR || (headB !== undefined && !isSolidWorldBlock(candGx, candGy - 2, headB) && headB !== IDS.LAVA && headB !== IDS.CACTUS);

                    if (isFloorSolid && isFeetClear && isTorsoClear && isHeadClear) {
                        // Check left/right so he's not inside a 1-block suffocating gap
                        const leftB = curWorld[candGx - 1]?.[candGy];
                        const rightB = curWorld[candGx + 1]?.[candGy];
                        const leftSolid = isSolidWorldBlock(candGx - 1, candGy, leftB);
                        const rightSolid = isSolidWorldBlock(candGx + 1, candGy, rightB);
                        if (leftSolid && rightSolid) continue;

                        const candX = candGx * TILE_SIZE + (TILE_SIZE - kaelW) / 2;
                        const candY = (candGy + 1) * TILE_SIZE - kaelH;

                        if (minDist >= 12 && isVisibleOnCamera(candX, candY)) {
                            visibleFallbackCandidates.push({ x: candX, y: candY, gx: candGx, gy: candGy });
                            continue;
                        }

                        return {
                            x: candX,
                            y: candY,
                            gx: candGx,
                            gy: candGy
                        };
                    }
                }
            }
        }

        // 2. Secondary fallback pass: if all spots in primary were visible on camera, pick the furthest visible one
        if (visibleFallbackCandidates.length > 0) {
            return visibleFallbackCandidates[visibleFallbackCandidates.length - 1];
        }

        // 3. Fallback pass: slightly wider search
        const fallbackMin = Math.max(4, effectiveMin - 6);
        const fallbackMax = effectiveMax + 12;
        for (let dist = fallbackMin; dist <= fallbackMax; dist += 2) {
            for (const dir of dirs) {
                const candGx = pGx + (dist * dir);
                if (candGx < 3 || candGx >= curWorldW - 3) continue;

                for (let dy = -16; dy <= 16; dy += 2) {
                    const candGy = pFootGy + dy;
                    if (candGy < 3 || candGy >= WORLD_HEIGHT - 3) continue;

                    const floorB = curWorld[candGx]?.[candGy + 1];
                    const feetB = curWorld[candGx]?.[candGy];
                    const torsoB = curWorld[candGx]?.[candGy - 1];

                    const isFloorSolid = floorB !== undefined && isSolidWorldBlock(candGx, candGy + 1, floorB) && floorB !== IDS.LAVA && floorB !== IDS.WATER && floorB !== IDS.CACTUS;
                    const isFeetClear = feetB === IDS.AIR || (feetB !== undefined && !isSolidWorldBlock(candGx, candGy, feetB) && feetB !== IDS.LAVA);
                    const isTorsoClear = torsoB === IDS.AIR || (torsoB !== undefined && !isSolidWorldBlock(candGx, candGy - 1, torsoB) && torsoB !== IDS.LAVA);

                    if (isFloorSolid && isFeetClear && isTorsoClear) {
                        return {
                            x: candGx * TILE_SIZE + (TILE_SIZE - kaelW) / 2,
                            y: (candGy + 1) * TILE_SIZE - kaelH,
                            gx: candGx,
                            gy: candGy
                        };
                    }
                }
            }
        }

        // 4. Safe fallback: off-screen distance from player
        return {
            x: playerRef.x + (pFacingDir * (effectiveMin * TILE_SIZE)),
            y: playerRef.y,
            gx: pGx + (pFacingDir * effectiveMin),
            gy: pFootGy
        };
    }

    export class AtlasExplorer extends PhysicsEntity {
        constructor(x, y) {
            super(x, y, TILE_SIZE * 0.75, TILE_SIZE * 1.8);
            this.health = 9999;
            this.name = 'Kael, The Atlas Explorer';
            this.title = 'Planar Cartographer';
            this.warpState = 'warping_in'; // 'warping_in', 'active', 'warping_out'
            this.warpProgress = 0.05;
            this.warpInTotalFrames = 200; // ~3.3 seconds (extended cinematic arrival)
            this.warpOutTotalFrames = 150; // ~2.5 seconds (extended departure)
            this.stayTimer = 0;
            this.maxStayDuration = 999999999; // Permanent stay once arrived
            this.isDeparted = false;
            this.facingRight = true;
            this.tetherX = x;
            this.paceTimer = 180;
            this.isPacing = false;
            this.mapReadingTimer = 120;
            this.walkAnimTime = 0;
            this.damageCooldown = 0;
            this.tooFarTimer = 0;
            this.teleportCooldown = 0;
            this.teleportVfxTimer = 0;
            this.stoppedTeleporting = true; // Stays in that place and roams around by default
        }

        teleportNearPlayer(curPlayer) {
            if (!curPlayer || curPlayer.isDead || this.stoppedTeleporting) return false;
            const dx = (curPlayer.x + curPlayer.width / 2) - (this.x + this.width / 2);
            const dy = (curPlayer.y + curPlayer.height / 2) - (this.y + this.height / 2);
            const isWayTooFar = (Math.abs(dx) > TILE_SIZE * 26) || (Math.hypot(dx, dy) > TILE_SIZE * 30);
            const isPlayerInMine = (dy > TILE_SIZE * 7) || (Math.abs(dy) > TILE_SIZE * 9);
            if (isWayTooFar || isPlayerInMine) {
                this.stoppedTeleporting = true;
                this.tooFarTimer = 0;
                this.tetherX = this.x;
                return false;
            }

            const targetPos = findSafeKaelPositionNear(curPlayer, 5, 8);
            if (!targetPos) return false;

            // 1. Departure VFX at current position
            if (Array.isArray(particles)) {
                for (let i = 0; i < 14; i++) {
                    const p = new Particle(this.x + this.width / 2 + (Math.random() - 0.5) * 16, this.y + this.height / 2 + (Math.random() - 0.5) * 32, (i % 2 === 0) ? '#c084fc' : '#38bdf8');
                    p.vx = (Math.random() - 0.5) * 3;
                    p.vy = -0.5 - Math.random() * 1.5;
                    particles.push(p);
                }
            }
            playSound('portal_warp', { vol: 0.55 });

            // 2. Relocate to safe spot near player
            this.x = targetPos.x;
            this.y = targetPos.y;
            this.vx = 0;
            this.vy = 0;
            this.isGrounded = true;
            this.tetherX = targetPos.x;
            this.facingRight = (curPlayer.x >= this.x);
            this.tooFarTimer = 0;
            this.teleportCooldown = 80;
            this.teleportVfxTimer = 24;
            this.isPacing = false;
            this.mapReadingTimer = 90;

            // 3. Arrival VFX at target position
            if (Array.isArray(particles)) {
                for (let i = 0; i < 18; i++) {
                    const p = new Particle(this.x + this.width / 2 + (Math.random() - 0.5) * 16, this.y + this.height / 2 + (Math.random() - 0.5) * 32, (i % 2 === 0) ? '#c084fc' : '#38bdf8');
                    p.vx = (Math.random() - 0.5) * 3.5;
                    p.vy = -0.8 - Math.random() * 2.0;
                    particles.push(p);
                }
            }

            // 4. Multiplayer synchronization
            if (isMultiplayer && typeof isMultiplayerAuthority === 'function' && isMultiplayerAuthority() && typeof broadcastDataPacket === 'function') {
                broadcastDataPacket({
                    type: 'ATLAS_EXPLORER_TELEPORT',
                    x: this.x,
                    y: this.y,
                    facingRight: this.facingRight
                });
            }
            return true;
        }

        takeDamage(amt, knockbackDir) {
            // Invincible planar explorer: absorbs all physical attacks with cosmic ripple, zero knockback
            this.vx = 0;
            this.spawnPlanarRipple();
            return false;
        }

        spawnPlanarRipple() {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            for (let i = 0; i < 8; i++) {
                const p = new Particle(cx, cy, (i % 2 === 0) ? '#c084fc' : '#38bdf8');
                p.vx = (Math.random() - 0.5) * 4;
                p.vy = (Math.random() - 0.5) * 4;
                particles.push(p);
            }
        }

        interact(interactor) {
            this.tetherX = this.x;
            if (typeof window !== 'undefined') {
                if (typeof window.hasPlayerTalkedToKael === 'function' && window.hasPlayerTalkedToKael()) {
                    if (typeof window.openAtlasMarket === 'function') {
                        window.openAtlasMarket(this);
                        return true;
                    }
                } else if (typeof window.openAtlasDialogue === 'function') {
                    window.openAtlasDialogue(this);
                    return true;
                }
            }
            return false;
        }

        update() {
            if (this.isDeparted) return;

            if (this.warpState === 'warping_in') {
                this.warpProgress += (1 / this.warpInTotalFrames);
                if (frameCount % 3 === 0) {
                    const cx = this.x + this.width / 2 + (Math.random() - 0.5) * 28;
                    const cy = this.y + this.height / 2 + (Math.random() - 0.5) * 44;
                    const p = new Particle(cx, cy, (Math.random() > 0.4) ? '#c084fc' : '#38bdf8');
                    p.vy = -0.5 - Math.random() * 0.8;
                    particles.push(p);
                }
                if (this.warpProgress >= 1) {
                    this.warpProgress = 1;
                    this.warpState = 'active';
                }
                return;
            }

            if (this.warpState === 'warping_out') {
                this.warpProgress -= (1 / this.warpOutTotalFrames);
                if (frameCount % 3 === 0) {
                    const cx = this.x + this.width / 2 + (Math.random() - 0.5) * 28;
                    const cy = this.y + this.height / 2 + (Math.random() - 0.5) * 44;
                    const p = new Particle(cx, cy, '#38bdf8');
                    p.vy = -0.6 - Math.random() * 0.8;
                    particles.push(p);
                }
                if (this.warpProgress <= 0) {
                    this.warpProgress = 0;
                    this.isDeparted = true;
                    const entList = (typeof entities !== 'undefined' && Array.isArray(entities)) ? entities : (typeof window !== 'undefined' && Array.isArray(window.entities) ? window.entities : []);
                    const idx = entList.indexOf(this);
                    if (idx !== -1) entList.splice(idx, 1);
                }
                return;
            }

            // Active state: Kael is a permanent visitor in the world
            this.stayTimer = 0;
            this.warpState = 'active';
            this.isDeparted = false;

            // Planar Sanctuary Ward: Hostile mobs are repelled and cannot attack Kael
            const entList = (typeof entities !== 'undefined' && Array.isArray(entities)) ? entities : (typeof window !== 'undefined' && Array.isArray(window.entities) ? window.entities : []);
            const wardRadius = TILE_SIZE * 4.5;
            const myCenterX = this.x + this.width / 2;
            const myCenterY = this.y + this.height / 2;
            for (const ent of entList) {
                if (ent && ent !== this && (ent instanceof Zombie || ent instanceof Creeper || ent instanceof Scorpion || ent instanceof Gloomstalker)) {
                    const entCenterX = ent.x + ent.width / 2;
                    const entCenterY = ent.y + ent.height / 2;
                    const dx = entCenterX - myCenterX;
                    const dy = entCenterY - myCenterY;
                    const d = Math.hypot(dx, dy);
                    if (d < wardRadius && d > 0.01) {
                        const pushForce = Math.min(2.5, (wardRadius - d) / 20 + 0.8);
                        const pushDir = dx >= 0 ? 1 : -1;
                        ent.vx = pushDir * pushForce;
                        if (ent instanceof Creeper) {
                            ent.swell = 0;
                        }
                        if (frameCount % 6 === 0) {
                            const wp = new Particle(entCenterX, entCenterY, (frameCount % 12 === 0) ? '#c084fc' : '#38bdf8');
                            wp.vx = pushDir * 1.5;
                            wp.vy = -1;
                            particles.push(wp);
                        }
                    }
                }
            }

            // Ambient planar stardust
            if (frameCount % 24 === 0) {
                const cx = this.x + this.width / 2 + (Math.random() - 0.5) * 16;
                const cy = this.y + this.height - 4;
                const p = new Particle(cx, cy, (Math.random() > 0.4) ? '#c084fc' : '#38bdf8');
                p.vy = -0.8 - Math.random() * 0.6;
                p.vx = (Math.random() - 0.5) * 0.5;
                particles.push(p);
            }

            // Water Buoyancy
            const centerGx = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const footGy = Math.floor((this.y + this.height - 2) / TILE_SIZE);
            const inWater = (typeof isWater === 'function' && isWater(centerGx, footGy));
            if (inWater) {
                this.vy = Math.min(this.vy, -2.4);
            }

            if (this.teleportCooldown > 0) this.teleportCooldown--;
            if (this.teleportVfxTimer > 0) this.teleportVfxTimer--;

            const curPlayer = (typeof player !== 'undefined') ? player : window.player;
            if (curPlayer && !curPlayer.isDead) {
                const dx = (curPlayer.x + curPlayer.width / 2) - (this.x + this.width / 2);
                const dy = (curPlayer.y + curPlayer.height / 2) - (this.y + this.height / 2);
                const dist = Math.hypot(dx, dy);

                // Detection: player going way too far in the world OR into the mine
                const isWayTooFar = (Math.abs(dx) > TILE_SIZE * 26) || (dist > TILE_SIZE * 30);
                const isPlayerInMine = (dy > TILE_SIZE * 7) || (Math.abs(dy) > TILE_SIZE * 9) || 
                    (typeof getWorldSurfaceY === 'function' && 
                     (curPlayer.y / TILE_SIZE) > (getWorldSurfaceY(Math.floor(curPlayer.x / TILE_SIZE)) + 4) && 
                     (this.y / TILE_SIZE) <= (getWorldSurfaceY(Math.floor(this.x / TILE_SIZE)) + 2));

                if (isWayTooFar || isPlayerInMine) {
                    // Stop teleporting to the player, stay in place, and roam around last location
                    this.stoppedTeleporting = true;
                    this.tooFarTimer = 0;
                    this.tetherX = this.x;
                }

                // If stopped teleporting or player has not talked to Kael, Kael NEVER teleports;
                // he stays in that place and roams around his spot.
                if (this.stoppedTeleporting) {
                    this.tooFarTimer = 0;
                } else if (typeof window !== 'undefined' && typeof window.hasPlayerTalkedToKael === 'function' && window.hasPlayerTalkedToKael()) {
                    const isFarHorizontally = Math.abs(dx) > TILE_SIZE * 16;
                    const isFarVertically = Math.abs(dy) > TILE_SIZE * 5;
                    if ((isFarHorizontally || isFarVertically) && this.warpState === 'active') {
                        this.tooFarTimer = (this.tooFarTimer || 0) + 1;
                        if (this.tooFarTimer >= 100 && this.teleportCooldown <= 0) {
                            this.teleportNearPlayer(curPlayer);
                        }
                    } else {
                        this.tooFarTimer = 0;
                    }
                } else {
                    this.tooFarTimer = 0;
                }

                if (dist < TILE_SIZE * 6) {
                    // Smart gaze & posture towards player
                    this.facingRight = (dx >= 0);
                    this.vx = 0;
                    this.isPacing = false;
                    this.mapReadingTimer = Math.max(0, this.mapReadingTimer - 1);
                } else {
                    // Pacing and map reading cycle
                    this.paceTimer--;
                    if (this.paceTimer <= 0) {
                        if (this.isPacing) {
                            this.isPacing = false;
                            this.vx = 0;
                            this.mapReadingTimer = 160 + Math.floor(Math.random() * 80);
                            this.paceTimer = 220 + Math.floor(Math.random() * 100);
                        } else {
                            this.isPacing = true;
                            // Check distance from tether
                            const distFromTether = this.x - this.tetherX;
                            if (distFromTether > TILE_SIZE * 3) this.facingRight = false;
                            else if (distFromTether < -TILE_SIZE * 3) this.facingRight = true;
                            else this.facingRight = (Math.random() > 0.5);

                            this.vx = this.facingRight ? (MOVE_SPEED * 0.28) : (-MOVE_SPEED * 0.28);
                            this.paceTimer = 120 + Math.floor(Math.random() * 80);
                        }
                    }

                    if (this.isPacing) {
                        this.walkAnimTime += 0.18;
                        this.checkObstacleJump();
                        // Intelligent pathfinding: check front obstacles, drops, hazards
                        const stepDir = this.facingRight ? 1 : -1;
                        const frontGx = Math.floor((this.x + this.width / 2 + stepDir * (this.width / 2 + 5)) / TILE_SIZE);
                        const frontFootGy = Math.floor((this.y + this.height - 4) / TILE_SIZE);
                        const frontHeadGy = Math.floor((this.y + 4) / TILE_SIZE);

                        const activeWorld = (typeof world !== 'undefined' && world) ? world : null;
                        if (activeWorld && frontGx >= 0 && frontGx < activeWorld.length) {
                            const bFoot = activeWorld[frontGx]?.[frontFootGy];
                            const bHead = activeWorld[frontGx]?.[frontHeadGy];
                            const isFootSolid = bFoot !== undefined && isSolidWorldBlock(frontGx, frontFootGy, bFoot);
                            const isHeadSolid = bHead !== undefined && isSolidWorldBlock(frontGx, frontHeadGy, bHead);
                            const isUpperSolid = isSolidWorldBlock(frontGx, frontHeadGy - 1, activeWorld[frontGx]?.[frontHeadGy - 1]);

                            // 1. 2-block high barrier or ceiling block ahead: stop and turn around
                            if (isHeadSolid || (isFootSolid && isUpperSolid)) {
                                this.facingRight = !this.facingRight;
                                this.vx = this.facingRight ? (MOVE_SPEED * 0.28) : (-MOVE_SPEED * 0.28);
                                this.isPacing = false;
                                this.mapReadingTimer = 90;
                                this.paceTimer = 110;
                            } else if (isFootSolid) {
                                // 1-block step up: jump over it smoothly!
                                this.checkObstacleJump();
                            } else {
                                // 2. Check for lethal drop or lava/cactus ahead
                                let dropDist = 0;
                                while (dropDist < 5 && (!isSolidWorldBlock(frontGx, frontFootGy + 1 + dropDist, activeWorld[frontGx]?.[frontFootGy + 1 + dropDist]))) {
                                    dropDist++;
                                }
                                const landingB = activeWorld[frontGx]?.[frontFootGy + 1 + dropDist];
                                const isHazard = (landingB === IDS.LAVA || landingB === IDS.CACTUS || (typeof isWater === 'function' && isWater(frontGx, frontFootGy + 1)));
                                if (dropDist >= 3 || isHazard) {
                                    // Turn around before falling
                                    this.facingRight = !this.facingRight;
                                    this.vx = this.facingRight ? (MOVE_SPEED * 0.28) : (-MOVE_SPEED * 0.28);
                                    this.isPacing = false;
                                    this.mapReadingTimer = 80;
                                    this.paceTimer = 100;
                                }
                            }
                        }
                    } else {
                        this.vx = 0;
                        if (this.mapReadingTimer > 0) this.mapReadingTimer--;
                    }
                }
            }

            const prevX = this.x;
            this.applyPhysics();
            const actualMoved = Math.abs(this.x - prevX);

            // Detect if blocked against a wall while pacing
            if (this.isPacing) {
                if (actualMoved < 0.05) {
                    this.stuckTimer = (this.stuckTimer || 0) + 1;
                    if (this.stuckTimer > 15) {
                        this.stuckTimer = 0;
                        this.facingRight = !this.facingRight;
                        this.isPacing = false;
                        this.mapReadingTimer = 90;
                        this.paceTimer = 110;
                    }
                } else {
                    this.stuckTimer = 0;
                }
            } else {
                this.stuckTimer = 0;
            }

            if (this.isPacing && actualMoved > 0.05 && (this.isGrounded || inWater)) {
                this.walkAnimTime += 0.18;
            } else {
                this.walkAnimTime = 0;
            }
        }

        drawPixelRiftPortal(ctx, cx, cy, progress, state) {
            ctx.save();
            ctx.imageSmoothingEnabled = false;

            const pixelSize = 4;
            const fullW = 44;
            const fullH = 76;

            // Animate portal width and height based on warp progress
            let scaleX = state === 'active' ? 1.0 : Math.min(1.0, progress * 1.5);
            let scaleY = state === 'active' ? 1.0 : Math.min(1.0, Math.max(0.08, progress * 1.25));

            const curW = Math.max(8, Math.floor((fullW * scaleX) / pixelSize) * pixelSize);
            const curH = Math.max(16, Math.floor((fullH * scaleY) / pixelSize) * pixelSize);

            const halfW = curW / 2;
            const halfH = curH / 2;
            const startY = Math.round(cy - halfH);

            const animTick = Math.floor(frameCount * 0.18);

            // 1. Stepped Pixel Aperture & Dimensional Void Frame
            for (let py = 0; py < curH; py += pixelSize) {
                const normY = (py - halfH) / halfH; // -1 to 1
                const sliceRatio = Math.sqrt(Math.max(0, 1 - normY * normY));
                const sliceHalfW = Math.floor((halfW * sliceRatio) / pixelSize) * pixelSize;
                if (sliceHalfW <= 0) continue;

                const rowX1 = Math.round(cx - sliceHalfW);
                const rowW = sliceHalfW * 2;

                // Outer cosmic void rim
                ctx.fillStyle = '#090312';
                ctx.fillRect(rowX1 - pixelSize, startY + py, rowW + pixelSize * 2, pixelSize);

                // Astral Amethyst stepped boundary ring
                const ringPhase = Math.sin(normY * 4 + animTick * 0.4);
                ctx.fillStyle = ringPhase > 0 ? '#6b21a8' : '#7e22ce';
                ctx.fillRect(rowX1, startY + py, rowW, pixelSize);

                // Inner Dimensional Swirling Energy
                const innerHalfW = Math.max(0, sliceHalfW - pixelSize);
                if (innerHalfW > 0) {
                    const innerX = Math.round(cx - innerHalfW);
                    const innerW = innerHalfW * 2;

                    for (let px = 0; px < innerW; px += pixelSize) {
                        const colIdx = Math.floor(px / pixelSize);
                        const wave = Math.sin(colIdx * 0.85 + normY * 2.8 - animTick * 0.45);
                        let col = '#a855f7';
                        if (wave > 0.65) col = '#fde047'; // Starlight gold spark
                        else if (wave > 0.25) col = '#38bdf8'; // Cyan rift glow
                        else if (wave > -0.25) col = '#c084fc'; // Bright lilac
                        else col = '#581c87'; // Deep void purple

                        ctx.fillStyle = col;
                        ctx.fillRect(innerX + px, startY + py, pixelSize, pixelSize);
                    }
                }
            }

            // 2. Swirling Pixel Orbiting Runes (4 stepped orbiting pixel crystals)
            const numRunes = 4;
            const orbitRadius = Math.max(16, halfW + 6);
            for (let r = 0; r < numRunes; r++) {
                const angle = (animTick * 0.12) + (r * (Math.PI * 2 / numRunes));
                const rx = Math.round((cx + Math.cos(angle) * orbitRadius) / pixelSize) * pixelSize;
                const ry = Math.round((cy + Math.sin(angle) * (halfH * 0.85)) / pixelSize) * pixelSize;

                ctx.fillStyle = (r % 2 === 0) ? '#38bdf8' : '#fde047';
                ctx.fillRect(rx - 2, ry - 2, 4, 4);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(rx - 1, ry - 1, 2, 2);
            }

            ctx.restore();
        }

        draw(ctx, camX, camY) {
            if (this.isDeparted) return;
            const drawX = Math.round(this.x - camX);
            const drawY = Math.round(this.y - camY);
            const w = this.width;
            const h = this.height;

            ctx.save();

            // 1. Draw Stepped Pixel-Art Planar Rift Vortex Behind Kael
            if (this.warpProgress < 1 || this.warpState !== 'active') {
                const cx = drawX + w / 2;
                const cy = drawY + h / 2;
                this.drawPixelRiftPortal(ctx, cx, cy, this.warpProgress, this.warpState);
            }

            // Kael materializes as portal establishes itself
            const kaelAlpha = (this.warpState === 'warping_in') 
                ? Math.max(0.0, Math.min(1.0, (this.warpProgress - 0.35) / 0.65))
                : Math.min(1.0, Math.max(0.0, this.warpProgress));
            ctx.globalAlpha = kaelAlpha;

            if (advancedGraphics) {
                ctx.drawImage(cachedShadowCanvas, drawX + w / 2 - 14, drawY + h - 5, 28, 7);
            }

            // Draw Kael using the standard player humanoid character renderer
            const kCanvas = getKaelSkinCanvas();
            const isReallyMoving = this.isPacing && (this.walkAnimTime > 0);
            if (kCanvas) {
                drawCharacter(
                    ctx, kCanvas, drawX, drawY, w, h,
                    this.facingRight, this.walkAnimTime, isReallyMoving, false,
                    null, null, false, null,
                    false, [null, null, null, null], null, null
                );
            }

            // Extra traveler accessories: held celestial star map or rolled map tube
            const sx = w / 16;
            const sy = h / 32;
            ctx.save();
            ctx.translate(drawX + w / 2, drawY);
            if (!this.facingRight) ctx.scale(-1, 1);
            ctx.translate(-w / 2, 0);

            if (this.mapReadingTimer > 0) {
                // Open parchment map held in front
                ctx.fillStyle = '#fef08a';
                ctx.fillRect(6 * sx, 13 * sy, 8 * sx, 6 * sy);
                ctx.fillStyle = '#0284c7';
                ctx.fillRect(7 * sx, 14 * sy, 2 * sx, 1 * sy);
                ctx.fillStyle = '#a855f7';
                ctx.fillRect(10 * sx, 15 * sy, 3 * sx, 1 * sy);
                // Gloves holding edges
                ctx.fillStyle = '#451a03';
                ctx.fillRect(5 * sx, 15 * sy, 2 * sx, 2 * sy);
                ctx.fillRect(13 * sx, 15 * sy, 2 * sx, 2 * sy);
            } else {
                // Rolled star map tube strapped to back
                ctx.fillStyle = '#fef08a';
                ctx.fillRect(2 * sx, 9 * sy, 2.5 * sx, 9 * sy);
                ctx.fillStyle = '#451a03';
                ctx.fillRect(1.5 * sx, 12 * sy, 3.5 * sx, 2 * sy); // Leather strap
            }
            ctx.restore();

            // Overhead Nameplate & Pop-up Tooltip (Authentic Webcraft Pixel-Art Style)
            if (this.warpState === 'active') {
                const nameCX = Math.round(drawX + w / 2);
                const nameY = Math.round(drawY - 22);

                ctx.font = 'bold 14px "VT323", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const titleStr = 'Kael, The Atlas Explorer';
                const subStr = '[Planar Cartographer]';
                const titleWidth = ctx.measureText(titleStr).width;
                const bgW = Math.round(Math.max(titleWidth + 28, 172));
                const bgH = 26;
                const bgX = Math.round(nameCX - bgW / 2);
                const bgY = Math.round(nameY - bgH / 2);

                // Pixel-Art Slate Nameplate (Crisp 9-slice / Minecraft slate style with sharp corners)
                // 1. Drop shadow & outer border (1px black/slate)
                ctx.fillStyle = '#080a0c';
                ctx.fillRect(bgX - 1, bgY - 1, bgW + 2, bgH + 2);

                // 2. Slate inner base
                ctx.fillStyle = 'rgba(18, 14, 28, 0.95)';
                ctx.fillRect(bgX, bgY, bgW, bgH);

                // 3. Pixel Bevel Borders (Authentic Webcraft/Minecraft highlight & shadow)
                ctx.fillStyle = '#a855f7'; // Top highlight
                ctx.fillRect(bgX, bgY, bgW, 1);
                ctx.fillRect(bgX, bgY, 1, bgH); // Left highlight
                ctx.fillStyle = '#3b0764'; // Bottom shadow
                ctx.fillRect(bgX, bgY + bgH - 1, bgW, 1);
                ctx.fillRect(bgX + bgW - 1, bgY, 1, bgH); // Right shadow

                // Corner pixel dots
                ctx.fillStyle = '#c084fc';
                ctx.fillRect(bgX + 1, bgY + 1, 1, 1);
                ctx.fillRect(bgX + bgW - 2, bgY + 1, 1, 1);

                // Title & Subtitle text
                // Pixel Diamond Badges (replacing non-pixelart unicode stars)
                ctx.fillStyle = '#fbbf24';
                ctx.fillRect(bgX + 9, nameY - 6, 3, 1);
                ctx.fillRect(bgX + 8, nameY - 5, 5, 1);
                ctx.fillRect(bgX + 9, nameY - 4, 3, 1);
                ctx.fillRect(bgX + 10, nameY - 7, 1, 3);
                ctx.fillRect(bgX + bgW - 12, nameY - 6, 3, 1);
                ctx.fillRect(bgX + bgW - 13, nameY - 5, 5, 1);
                ctx.fillRect(bgX + bgW - 12, nameY - 4, 3, 1);
                ctx.fillRect(bgX + bgW - 11, nameY - 7, 1, 3);

                ctx.fillStyle = '#f5f3ff'; // Clean crisp white/lilac
                ctx.fillText('Kael, The Atlas Explorer', nameCX, nameY - 4);

                ctx.font = '11px "VT323", monospace';
                ctx.fillStyle = '#38bdf8'; // Sky blue
                ctx.fillText(subStr, nameCX, nameY + 7);

                // Proximity Interaction Pop-up if player is near
                const curP = (typeof player !== 'undefined') ? player : window.player;
                if (curP) {
                    const dToP = Math.hypot((curP.x + curP.width / 2) - (this.x + this.width / 2), (curP.y + curP.height / 2) - (this.y + this.height / 2));
                    if (dToP < TILE_SIZE * 3.5) {
                        const hasTalked = (typeof window !== 'undefined' && typeof window.hasPlayerTalkedToKael === 'function') ? window.hasPlayerTalkedToKael() : false;
                        const actionWord = hasTalked ? 'Trade' : 'Speak';
                        const promptText = `Press [E] to ${actionWord}`;

                        // Measure prompt text dynamically so box perfectly bounds the content
                        ctx.font = 'bold 15px "VT323", monospace';
                        const textW = Math.ceil(ctx.measureText(promptText).width);
                        const popW = Math.max(154, textW + 40);
                        const popH = 22;
                        const popX = Math.round(nameCX - popW / 2);
                        const popY = Math.round(bgY - popH - 5);

                        // Pop-up outer pixel border
                        ctx.fillStyle = '#080a0c';
                        ctx.fillRect(popX - 1, popY - 1, popW + 2, popH + 2);

                        // Pop-up dark slate background
                        ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
                        ctx.fillRect(popX, popY, popW, popH);

                        // Pop-up crisp amber/gold highlight border
                        const pulse = (Math.sin(Date.now() * 0.007) + 1) * 0.5;
                        ctx.fillStyle = (pulse > 0.5) ? '#fbbf24' : '#d97706';
                        ctx.fillRect(popX, popY, popW, 1);
                        ctx.fillRect(popX, popY, 1, popH);
                        ctx.fillStyle = '#78350f';
                        ctx.fillRect(popX, popY + popH - 1, popW, 1);
                        ctx.fillRect(popX + popW - 1, popY, 1, popH);

                        // Pixel downward arrow pointer (pointing at nameplate)
                        ctx.fillStyle = '#080a0c';
                        ctx.fillRect(nameCX - 3, popY + popH, 6, 2);
                        ctx.fillRect(nameCX - 2, popY + popH + 2, 4, 1);
                        ctx.fillRect(nameCX - 1, popY + popH + 3, 2, 1);
                        ctx.fillStyle = '#fbbf24';
                        ctx.fillRect(nameCX - 2, popY + popH, 4, 1);
                        ctx.fillRect(nameCX - 1, popY + popH + 1, 2, 1);

                        // Pixel Key Badge [E]
                        const keyX = popX + 8;
                        const keyY = popY + 4;
                        const keyW = 14;
                        const keyH = 14;

                        // Key cap outer shadow
                        ctx.fillStyle = '#020617';
                        ctx.fillRect(keyX - 1, keyY - 1, keyW + 2, keyH + 2);
                        // Key cap face
                        ctx.fillStyle = '#1e293b';
                        ctx.fillRect(keyX, keyY, keyW, keyH);
                        // Key cap top highlight
                        ctx.fillStyle = '#64748b';
                        ctx.fillRect(keyX, keyY, keyW, 1);
                        ctx.fillRect(keyX, keyY, 1, keyH);
                        // Key letter E
                        ctx.font = 'bold 12px "VT323", monospace';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#fef08a';
                        ctx.fillText('E', keyX + keyW / 2, keyY + keyH / 2 + 1);

                        // Pop-up text with guaranteed spacing
                        ctx.font = 'bold 15px "VT323", monospace';
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#fef08a';
                        ctx.fillText(promptText, keyX + keyW + 7, popY + popH / 2 + 1);
                    }
                }
            }

            ctx.restore();
        }
    }

// Global Window Registration for cross-module compatibility
if (typeof window !== 'undefined') {
    window.kaelSkinCanvas = kaelSkinCanvas;
    window.getKaelSkinCanvas = getKaelSkinCanvas;
    window.findSafeKaelPositionNear = findSafeKaelPositionNear;
    window.AtlasExplorer = AtlasExplorer;
}