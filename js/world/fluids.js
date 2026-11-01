// =============================================================================
// WEBCRAFT 2D - FLUID MECHANICS (js/world/fluids.js)
// Water and lava cellular automata simulation, slope seeking & solidification
// =============================================================================

import {
    IDS, WATER_FLOW_INTERVAL, LAVA_FLOW_INTERVAL, WATER_FLOW_MAX, LAVA_FLOW_MAX, TILE_SIZE
} from '../core/constants.js';

import {
    world, player, fluids, fluidTick, fluidWakeQueue, particles,
    saplingGrowthQueue, saplingBlockedWarnings, setEngineFluidTick,
    WORLD_WIDTH, WORLD_HEIGHT
} from '../core/state.js';

import { getFluidKey, isSolidWorldBlock, isWater, isLava } from './blockhelper.js';


function getDropItemFn() {
    if (typeof window !== 'undefined' && typeof window.dropItemForWorld === 'function') return window.dropItemForWorld;
    return null;
}

function getSyncBlockFn() {
    if (typeof window !== 'undefined' && typeof window.syncBlock === 'function') return window.syncBlock;
    return null;
}

function getCheckSandFallFn() {
    if (typeof window !== 'undefined' && typeof window.checkSandFallAbove === 'function') return window.checkSandFallAbove;
    return null;
}

function getPlaySoundFn() {
    if (typeof window !== 'undefined' && typeof window.playSound === 'function') return window.playSound;
    return null;
}

function getParticleClass() {
    if (typeof window !== 'undefined' && window.Particle) return window.Particle;
    return null;
}

export function getFluid(x, y) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return null;
    const curFluids = (typeof fluids !== 'undefined' && fluids) ? fluids : (typeof window !== 'undefined' ? window.fluids : null);
    const fl = curFluids ? curFluids.get(getFluidKey(x, y)) : null;
    if (fl) return fl;
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    if (curWorld && curWorld[x]) {
        const b = curWorld[x][y];
        if (b === IDS.WATER) return { type: IDS.WATER, level: 0, source: true, falling: false, x, y };
        if (b === IDS.LAVA) return { type: IDS.LAVA, level: 0, source: true, falling: false, x, y };
    }
    return null;
}

export function getFluidFlowVector(gx, gy) {
    if (gx < 0 || gx >= WORLD_WIDTH || gy < 0 || gy >= WORLD_HEIGHT) return { vx: 0, vy: 0 };
    const fl = getFluid(gx, gy);
    if (!fl) return { vx: 0, vy: 0 };
    if (fl.falling) return { vx: 0, vy: 0.35 };
    if (fl.source) return { vx: 0, vy: 0 };

    let vx = 0;
    const left = getFluid(gx - 1, gy);
    const right = getFluid(gx + 1, gy);
    const isWaterCell = fl.type === IDS.WATER;
    const maxFlow = isWaterCell ? WATER_FLOW_MAX : LAVA_FLOW_MAX;

    let leftStrength = 0;
    if (left && left.type === fl.type) {
        if (left.source) leftStrength = maxFlow + 1;
        else if (!left.falling && left.level < fl.level) leftStrength = maxFlow - left.level;
    }

    let rightStrength = 0;
    if (right && right.type === fl.type) {
        if (right.source) rightStrength = maxFlow + 1;
        else if (!right.falling && right.level < fl.level) rightStrength = maxFlow - right.level;
    }

    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    if (!left && gx > 0 && curWorld && !isSolidWorldBlock(gx - 1, gy, curWorld[gx - 1]?.[gy])) {
        rightStrength += 1.5;
    }
    if (!right && gx < WORLD_WIDTH - 1 && curWorld && !isSolidWorldBlock(gx + 1, gy, curWorld[gx + 1]?.[gy])) {
        leftStrength += 1.5;
    }

    vx = (leftStrength - rightStrength) * (isWaterCell ? 0.08 : 0.03);
    return { vx, vy: 0 };
}

export function setFluid(x, y, fluid) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return false;
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    if (!curWorld) return false;
    if (isSolidWorldBlock(x, y, curWorld[x]?.[y])) return false;
    
    let curBlock = curWorld[x]?.[y];
    if (curBlock !== IDS.AIR && !isSolidWorldBlock(x, y, curBlock)) {
        const fragileBlocks = [
            IDS.TORCH, IDS.FLOWER_RED, IDS.FLOWER_YELLOW, IDS.SHORT_GRASS, IDS.TALL_GRASS,
            IDS.SAPLING, IDS.JUNGLE_SAPLING, IDS.FERN, IDS.WHEAT_STAGE_1, IDS.WHEAT_STAGE_2,
            IDS.WHEAT_STAGE_3, IDS.WHEAT_STAGE_4, IDS.MELON_STEM
        ];
        if (fragileBlocks.includes(curBlock)) {
            if (curBlock === IDS.SAPLING || curBlock === IDS.JUNGLE_SAPLING) {
                if (saplingGrowthQueue) saplingGrowthQueue.delete(`${x}_${y}`);
                if (saplingBlockedWarnings) saplingBlockedWarnings.delete(`${x}_${y}`);
            }
            if (fluid.type === IDS.WATER) {
                let dropId = curBlock;
                if (curBlock === IDS.WHEAT_STAGE_1 || curBlock === IDS.WHEAT_STAGE_2) dropId = IDS.SEEDS;
                else if (curBlock === IDS.WHEAT_STAGE_3 || curBlock === IDS.WHEAT_STAGE_4) dropId = IDS.WHEAT;
                else if (curBlock === IDS.MELON_STEM) dropId = IDS.MELON_SEEDS;
                else if (curBlock === IDS.SHORT_GRASS || curBlock === IDS.TALL_GRASS || curBlock === IDS.FERN) {
                    dropId = Math.random() < 0.2 ? IDS.SEEDS : null;
                }
                const dropFn = getDropItemFn();
                if (dropId && dropFn) dropFn(dropId, x * TILE_SIZE + 10, y * TILE_SIZE + 10, 1);
            } else if (fluid.type === IDS.LAVA) {
                const PClass = getParticleClass();
                if (PClass && Array.isArray(particles)) {
                    for (let i = 0; i < 4; i++) {
                        particles.push(new PClass(x * TILE_SIZE + 20, y * TILE_SIZE + 20, '#ff4500'));
                    }
                }
            }
            curWorld[x][y] = IDS.AIR;
            const syncFn = getSyncBlockFn();
            if (syncFn) syncFn(x, y, IDS.AIR);
            const sandFn = getCheckSandFallFn();
            if (sandFn) sandFn(x, y);
        }
    }
    
    const curFluids = (typeof fluids !== 'undefined' && fluids) ? fluids : (typeof window !== 'undefined' ? window.fluids : null);
    if (!curFluids) return false;
    curFluids.set(getFluidKey(x, y), {
        type: fluid.type,
        level: fluid.level || 0,
        source: fluid.source === true,
        falling: fluid.falling === true,
        x: x,
        y: y
    });
    wakeFluidsAround(x, y);
    return true;
}

export function removeFluid(x, y) {
    const curFluids = (typeof fluids !== 'undefined' && fluids) ? fluids : (typeof window !== 'undefined' ? window.fluids : null);
    if (!curFluids) return false;
    const deleted = curFluids.delete(getFluidKey(x, y));
    if (deleted) wakeFluidsAround(x, y);
    return deleted;
}

export function wakeFluidsAround(x, y) {
    const queue = (typeof fluidWakeQueue !== 'undefined' && fluidWakeQueue) ? fluidWakeQueue : (typeof window !== 'undefined' ? window.fluidWakeQueue : null);
    if (!queue) return;
    for (let offsetX = -2; offsetX <= 2; offsetX++) {
        for (let offsetY = -2; offsetY <= 2; offsetY++) {
            let wx = x + offsetX;
            let wy = y + offsetY;
            if (wx >= 0 && wx < WORLD_WIDTH && wy >= 0 && wy < WORLD_HEIGHT) {
                queue.add(getFluidKey(wx, wy));
            }
        }
    }
}

export function wakeAllFluids() {
    const curFluids = (typeof fluids !== 'undefined' && fluids) ? fluids : (typeof window !== 'undefined' ? window.fluids : null);
    const queue = (typeof fluidWakeQueue !== 'undefined' && fluidWakeQueue) ? fluidWakeQueue : (typeof window !== 'undefined' ? window.fluidWakeQueue : null);
    if (!curFluids || !queue) return;
    for (const key of curFluids.keys()) {
        queue.add(key);
    }
}

export function triggerSteamEffect(x, y) {
    const PClass = getParticleClass();
    if (PClass && Array.isArray(particles)) {
        for (let i = 0; i < 7; i++) {
            let p = new PClass(x * TILE_SIZE + 20 + (Math.random() - 0.5) * 16, y * TILE_SIZE + 10, '#d0e8f2');
            p.vy = -1.5 - Math.random() * 2.0;
            p.vx = (Math.random() - 0.5) * 1.5;
            p.life = 25;
            particles.push(p);
        }
    }
    const snd = getPlaySoundFn();
    if (snd) snd('fizz');
}

export function updateFluids() {
    setEngineFluidTick(fluidTick + 1);
    const curFluids = (typeof fluids !== 'undefined' && fluids) ? fluids : (typeof window !== 'undefined' ? window.fluids : null);
    const queue = (typeof fluidWakeQueue !== 'undefined' && fluidWakeQueue) ? fluidWakeQueue : (typeof window !== 'undefined' ? window.fluidWakeQueue : null);
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    const curPlayer = (typeof player !== 'undefined' && player) ? player : (typeof window !== 'undefined' ? window.player : null);

    if (!curFluids || !queue || !curWorld) return;

    const waterTick = fluidTick % WATER_FLOW_INTERVAL === 0;
    const lavaTick = fluidTick % LAVA_FLOW_INTERVAL === 0;
    if (!waterTick && !lavaTick && queue.size === 0) return;

    const toSet = [];
    const toRemove = [];
    const toSolidify = [];

    const pTileX = Math.floor((curPlayer?.x || 0) / TILE_SIZE);

    // Prune off-screen wake keys so fluidWakeQueue can never retain dormant offscreen cells
    if (queue.size > 0 && curPlayer) {
        for (const wakeKey of queue) {
            const sep = wakeKey.indexOf('_');
            const wx = parseInt(wakeKey.slice(0, sep), 10);
            if (Math.abs(wx - pTileX) > 80) {
                queue.delete(wakeKey);
            }
        }
    }
    if (!waterTick && !lavaTick && queue.size === 0) return;

    let entries;
    const wakeSet = new Set(queue);
    if (!waterTick && !lavaTick) {
        // Wake-only tick: only process explicitly awake nearby cells!
        entries = [];
        let count = 0;
        for (const key of queue) {
            const fl = curFluids.get(key);
            if (fl) {
                entries.push([key, fl]);
                count++;
                if (count >= 160) break; // Rate limit wake bursts per physics step
            }
        }
        queue.clear();
    } else {
        // Periodic tick: snapshot fluids within 80 tiles horizontally of player
        entries = [];
        for (const [key, fl] of curFluids) {
            let fx = fl.x;
            if (fx === undefined) {
                const sep = key.indexOf('_');
                fx = parseInt(key.slice(0, sep), 10);
                fl.x = fx;
                fl.y = parseInt(key.slice(sep + 1), 10);
            }
            if (curPlayer && Math.abs(fx - pTileX) > 80) {
                queue.delete(key);
                continue;
            }
            entries.push([key, fl]);
        }
        queue.clear();
    }

    for (let i = 0; i < entries.length; i++) {
        const [key, fluid] = entries[i];
        const x = fluid.x !== undefined ? fluid.x : parseInt(key.slice(0, key.indexOf('_')), 10);
        const y = fluid.y !== undefined ? fluid.y : parseInt(key.slice(key.indexOf('_') + 1), 10);

        // Proximity culling: Only simulate active fluid flow within 80 tiles horizontally of player
        if (curPlayer && Math.abs(x - pTileX) > 80) {
            continue;
        }
        const isWaterCell = fluid.type === IDS.WATER;
        const isLavaCell = fluid.type === IDS.LAVA;
        const isAwake = wakeSet.has(key);

        if (isWaterCell && !waterTick && !isAwake) continue;
        if (isLavaCell && !lavaTick && !isAwake) continue;

        const maxFlow = isWaterCell ? WATER_FLOW_MAX : LAVA_FLOW_MAX;

        // 1. Check drainage for non-source flowing fluid
        if (!fluid.source) {
            let hasFeeder = false;
            const above = getFluid(x, y - 1);
            if (above && above.type === fluid.type) {
                hasFeeder = true;
            } else {
                const left = getFluid(x - 1, y);
                if (left && left.type === fluid.type && (left.source || (!left.falling && (left.level < fluid.level || fluid.falling)))) {
                    hasFeeder = true;
                }
                const right = getFluid(x + 1, y);
                if (right && right.type === fluid.type && (right.source || (!right.falling && (right.level < fluid.level || fluid.falling)))) {
                    hasFeeder = true;
                }
            }

            if (!hasFeeder) {
                toRemove.push([x, y]);
                continue;
            }
        }

        // 2. Downward Flow (Gravity) & Resting / Falling State Transitions
        const belowY = y + 1;
        const isBelowSolid = belowY >= WORLD_HEIGHT || isSolidWorldBlock(x, belowY, curWorld[x]?.[belowY]);
        const belowFluid = getFluid(x, belowY);

        // A landing surface is solid ground directly beneath, or a resting fluid layer of the same type
        const isLandingSurface = isBelowSolid || (belowFluid && belowFluid.type === fluid.type && !belowFluid.falling);

        if (!isBelowSolid) {
            if (!belowFluid) {
                // Open space directly below: cascade vertically downward as falling stream column
                const fallLevel = fluid.source ? 1 : fluid.level;
                toSet.push([x, belowY, { type: fluid.type, source: false, level: fallLevel, falling: true, x, y: belowY }]);
                // Mid-air falling columns MUST NOT spray horizontally into thin air!
                continue;
            } else if (belowFluid.type !== fluid.type) {
                // Vertical contact between Water and Lava
                if (isWaterCell && belowFluid.type === IDS.LAVA) {
                    // Water above Lava -> Obsidian if lava is source, else Cobblestone
                    const solidId = (belowFluid.source || belowFluid.level === 0) ? IDS.OBSIDIAN : IDS.COBBLESTONE;
                    toSolidify.push([x, belowY, solidId]);
                } else if (isLavaCell && belowFluid.type === IDS.WATER) {
                    // Lava above Water -> Stone
                    toSolidify.push([x, belowY, IDS.STONE]);
                }
                continue;
            } else if (belowFluid.falling) {
                // Fluid below is still falling downward through open air: continue falling column!
                continue;
            }
        }

        // When a falling fluid stream strikes solid ground or a resting pool surface, it lands!
        if (fluid.falling && isLandingSurface) {
            toSet.push([x, y, { ...fluid, falling: false }]);
            fluid.falling = false;
        }

        // 3. Horizontal Spread (Forms streams and rivers across surfaces)
        // A fluid cell only spreads horizontally if supported from below (not in free fall) and within max reach
        const canSpreadHorizontally = (fluid.source || (isLandingSurface && !fluid.falling)) && fluid.level < maxFlow;

        if (canSpreadHorizontally) {
            // Flow level increments as distance increases from source, tapering stream height/volume down
            const effectiveLevel = fluid.source ? 0 : fluid.level;
            const nextLevel = effectiveLevel + 1;

            if (nextLevel <= maxFlow) {
                // --- MINECRAFT SLOPE / DROP-OFF PATHFINDING ---
                // Search up to 5 blocks (or 3 for lava) for the nearest open ledge / drop-off
                const searchDist = isWaterCell ? 5 : 3;
                const getDropDist = (dir) => {
                    for (let step = 1; step <= searchDist; step++) {
                        const cx = x + dir * step;
                        if (cx < 0 || cx >= WORLD_WIDTH) return 999;
                        if (isSolidWorldBlock(cx, y, curWorld[cx]?.[y])) return 999; // Solid wall blocks path
                        // Found an open ledge or drop-off!
                        if (y + 1 < WORLD_HEIGHT && !isSolidWorldBlock(cx, y + 1, curWorld[cx]?.[y + 1])) {
                            return step;
                        }
                    }
                    return 999;
                };

                const distLeft = getDropDist(-1);
                const distRight = getDropDist(1);

                let allowedDirs;
                if (distLeft < distRight) {
                    allowedDirs = [-1]; // Nearest drop is to the left: flow ONLY left!
                } else if (distRight < distLeft) {
                    allowedDirs = [1];  // Nearest drop is to the right: flow ONLY right!
                } else {
                    allowedDirs = [-1, 1]; // Flat ground, basin, or equal distance: spread both ways!
                }

                for (const dir of allowedDirs) {
                    const nx = x + dir;
                    if (nx < 0 || nx >= WORLD_WIDTH) continue;
                    if (isSolidWorldBlock(nx, y, curWorld[nx]?.[y])) continue;

                    const nbrFluid = getFluid(nx, y);
                    const willDropBelow = (y + 1 < WORLD_HEIGHT && !isSolidWorldBlock(nx, y + 1, curWorld[nx]?.[y + 1]));

                    if (!nbrFluid) {
                        toSet.push([nx, y, {
                            type: fluid.type,
                            source: false,
                            level: nextLevel,
                            falling: willDropBelow,
                            x: nx,
                            y: y
                        }]);
                    } else if (nbrFluid.type !== fluid.type) {
                        // Horizontal Water + Lava Reaction
                        if (isWaterCell) {
                            const solidId = (nbrFluid.source || nbrFluid.level === 0) ? IDS.OBSIDIAN : IDS.COBBLESTONE;
                            toSolidify.push([nx, y, solidId]);
                        } else {
                            toSolidify.push([nx, y, IDS.COBBLESTONE]);
                        }
                    } else if (!nbrFluid.source && nbrFluid.level > nextLevel) {
                        toSet.push([nx, y, {
                            type: fluid.type,
                            source: false,
                            level: nextLevel,
                            falling: willDropBelow,
                            x: nx,
                            y: y
                        }]);
                    }
                }
            }
        }

        // 4. Authentic Minecraft 2-Source Infinite Water Spring
        if (isWaterCell && !fluid.source && isBelowSolid && !fluid.falling) {
            const left = getFluid(x - 1, y);
            const right = getFluid(x + 1, y);
            const hasLeftSource = left && left.type === IDS.WATER && left.source;
            const hasRightSource = right && right.type === IDS.WATER && right.source;
            if (hasLeftSource && hasRightSource) {
                toSet.push([x, y, { type: IDS.WATER, source: true, level: 0, falling: false, x, y }]);
            }
        }
    }

    // Apply removals
    for (let i = 0; i < toRemove.length; i++) {
        const [rx, ry] = toRemove[i];
        removeFluid(rx, ry);
    }

    // Apply solidifications (Water + Lava reaction)
    const syncFn = getSyncBlockFn();
    for (let i = 0; i < toSolidify.length; i++) {
        const [sx, sy, blockId] = toSolidify[i];
        removeFluid(sx, sy);
        if (curWorld[sx]) curWorld[sx][sy] = blockId;
        if (syncFn) syncFn(sx, sy, blockId);
        wakeFluidsAround(sx, sy);
        triggerSteamEffect(sx, sy);
    }

    // Apply additions / updates
    for (let i = 0; i < toSet.length; i++) {
        const [sx, sy, fData] = toSet[i];
        setFluid(sx, sy, fData);
    }
}

// Window self-registration for backward compatibility
try {
    if (typeof window !== 'undefined') {
        window.getFluid = getFluid;
        window.getFluidFlowVector = getFluidFlowVector;
        window.setFluid = setFluid;
        window.removeFluid = removeFluid;
        window.wakeFluidsAround = wakeFluidsAround;
        window.wakeAllFluids = wakeAllFluids;
        window.triggerSteamEffect = triggerSteamEffect;
        window.updateFluids = updateFluids;
        window.isWater = isWater;
        window.isLava = isLava;
    }
} catch (e) {}
