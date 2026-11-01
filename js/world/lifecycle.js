// =============================================================================
// WEBCRAFT 2D - WORLD LIFECYCLE & NATURAL REGROWTH (js/world/lifecycle.js)
// Leaf decay, sapling growth, crop maturation, dirt-to-grass & snow regrowth
// =============================================================================

import {
    IDS, TILE_SIZE, LEAF_DECAY_MIN_FRAMES, LEAF_DECAY_RANDOM_FRAMES,
    DIRT_TO_GRASS_DAYS, SNOW_REGROWTH_DAYS, isFoliageOrAir
} from '../core/constants.js';

import {
    world, leafDecayQueue, treeDecayClusters, saplingGrowthQueue, saplingBlockedWarnings,
    cropGrowthQueue, dirtToGrassQueue, snowRegrowthQueue, dayCount, timeOfDay,
    frameCount, player, particles, remotePlayers, isMultiplayer, isMultiplayerAuthority,
    WORLD_WIDTH, WORLD_HEIGHT, nonCollidableTreeWood
} from '../core/state.js';

import {
    isSolidWorldBlock, getWorldSurfaceY, isWater
} from './blockhelper.js';

import {
    getFluid
} from './fluids.js';

import {
    getActiveBiomeAt, buildJungleTree
} from './worldgen.js';

function getGiveItemFn() {
    if (typeof window !== 'undefined' && typeof window.giveItem === 'function') return window.giveItem;
    return null;
}

function getDropItemFn() {
    if (typeof window !== 'undefined' && typeof window.dropItemForWorld === 'function') return window.dropItemForWorld;
    if (typeof window !== 'undefined' && typeof window.spawnDroppedItem === 'function') return window.spawnDroppedItem;
    return null;
}

function getSyncBlockFn() {
    if (typeof window !== 'undefined' && typeof window.syncBlock === 'function') return window.syncBlock;
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

export function isLeafConnectedToWood(lx, ly, maxDistance = 4) {
    if (lx < 0 || lx >= WORLD_WIDTH || ly < 0 || ly >= WORLD_HEIGHT) return false;
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    if (!curWorld) return false;

    // Fast direct check
    for (let dx = -maxDistance; dx <= maxDistance; dx++) {
        for (let dy = -maxDistance; dy <= maxDistance; dy++) {
            if (Math.abs(dx) + Math.abs(dy) > maxDistance) continue;
            const nx = lx + dx;
            const ny = ly + dy;
            if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
                const blk = curWorld[nx]?.[ny];
                if ((blk === IDS.WOOD || blk === IDS.JUNGLE_WOOD) && Math.abs(dx) <= 1 && Math.abs(dy) <= 1) return true;
            }
        }
    }

    // BFS leaf/wood connectivity check
    const queue = [[lx, ly, 0]];
    const visited = new Set([`${lx}_${ly}`]);
    
    while (queue.length > 0) {
        const [cx, cy, dist] = queue.shift();
        const cur = curWorld[cx]?.[cy];
        if (cur === IDS.WOOD || cur === IDS.JUNGLE_WOOD) return true;
        if (dist < maxDistance) {
            const neighbors = [
                [cx + 1, cy], [cx - 1, cy],
                [cx, cy + 1], [cx, cy - 1],
                [cx + 1, cy + 1], [cx - 1, cy - 1],
                [cx + 1, cy - 1], [cx - 1, cy + 1]
            ];
            for (const [nx, ny] of neighbors) {
                const key = `${nx}_${ny}`;
                if (!visited.has(key) && nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
                    const block = curWorld[nx]?.[ny];
                    if (block === IDS.WOOD || block === IDS.JUNGLE_WOOD) return true;
                    if (block === IDS.LEAVES || block === IDS.JUNGLE_LEAVES) {
                        visited.add(key);
                        queue.push([nx, ny, dist + 1]);
                    }
                }
            }
        }
    }
    return false;
}

export function scheduleTreeLeafDecay(trunkX, trunkY = null) {
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    if (!curWorld) return;
    const curLeafQueue = (typeof leafDecayQueue !== 'undefined' && leafDecayQueue) ? leafDecayQueue : (typeof window !== 'undefined' ? window.leafDecayQueue : null);
    const curClusters = (typeof treeDecayClusters !== 'undefined' && treeDecayClusters) ? treeDecayClusters : (typeof window !== 'undefined' ? window.treeDecayClusters : null);
    if (!curLeafQueue || !curClusters) return;

    const minY = (trunkY !== null && typeof trunkY === 'number') ? Math.max(0, trunkY - 14) : 0;
    const maxY = (trunkY !== null && typeof trunkY === 'number') ? Math.min(WORLD_HEIGHT - 1, trunkY + 4) : (WORLD_HEIGHT - 1);
    const minX = Math.max(0, trunkX - 6);
    const maxX = Math.min(WORLD_WIDTH - 1, trunkX + 6);

    const unassignedLeaves = [];
    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            const blk = curWorld[x]?.[y];
            if ((blk === IDS.LEAVES || blk === IDS.JUNGLE_LEAVES) && !curLeafQueue.has(`${x}_${y}`)) {
                if (!isLeafConnectedToWood(x, y, 5)) {
                    unassignedLeaves.push({ x, y, blk });
                }
            }
        }
    }

    if (unassignedLeaves.length === 0) return;

    // Group newly disconnected leaves into connected canopy components
    const visited = new Set();
    const leafMap = new Map();
    for (const leaf of unassignedLeaves) {
        leafMap.set(`${leaf.x}_${leaf.y}`, leaf);
    }

    let clusterSeq = 0;
    for (const leaf of unassignedLeaves) {
        const key = `${leaf.x}_${leaf.y}`;
        if (visited.has(key)) continue;

        const component = [];
        const queue = [leaf];
        visited.add(key);

        while (queue.length > 0) {
            const cur = queue.shift();
            component.push(cur);

            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const nKey = `${cur.x + dx}_${cur.y + dy}`;
                    if (leafMap.has(nKey) && !visited.has(nKey)) {
                        visited.add(nKey);
                        queue.push(leafMap.get(nKey));
                    }
                }
            }
        }

        const clusterId = `tree_decay_${Date.now()}_${trunkX}_${clusterSeq++}_${Math.floor(Math.random() * 10000)}`;

        const roll = Math.random();
        let targetSaplings = roll < 0.20 ? 0 : (roll < 0.70 ? 1 : 2);
        targetSaplings = Math.min(targetSaplings, component.length);

        curClusters.set(clusterId, {
            id: clusterId,
            type: leaf.blk === IDS.JUNGLE_LEAVES ? 'jungle' : 'oak',
            targetSaplings: targetSaplings,
            droppedSaplings: 0,
            leavesRemaining: component.length,
            totalLeaves: component.length
        });

        for (const l of component) {
            curLeafQueue.set(`${l.x}_${l.y}`, {
                delay: LEAF_DECAY_MIN_FRAMES + Math.floor(Math.random() * LEAF_DECAY_RANDOM_FRAMES),
                clusterId: clusterId
            });
        }
    }
}

export function deliverLeafDecayItem(dropId, x, y, count = 1) {
    if (!dropId) return;
    const curPlayer = (typeof player !== 'undefined') ? player : (typeof window !== 'undefined' ? window.player : null);
    const curRemotes = (typeof remotePlayers !== 'undefined') ? remotePlayers : (typeof window !== 'undefined' ? window.remotePlayers : null);
    const giveFn = getGiveItemFn();
    const dropFn = getDropItemFn();
    const sndFn = getPlaySoundFn();
    const PClass = getParticleClass();
    
    let targetPlayer = curPlayer;
    if (isMultiplayer && curRemotes) {
        let pX = curPlayer ? curPlayer.x : 0;
        let pY = curPlayer ? curPlayer.y : 0;
        let minDist = Math.hypot(pX - (x * TILE_SIZE + TILE_SIZE / 2), pY - (y * TILE_SIZE + TILE_SIZE / 2));
        Object.values(curRemotes).forEach(rp => {
            if (rp && !rp.isDead && rp.x !== undefined) {
                let d = Math.hypot(rp.x - (x * TILE_SIZE + TILE_SIZE / 2), rp.y - (y * TILE_SIZE + TILE_SIZE / 2));
                if (d < minDist) {
                    minDist = d;
                    targetPlayer = rp;
                }
            }
        });
    }

    if (targetPlayer === curPlayer && curPlayer) {
        const given = giveFn ? giveFn(dropId, count) : false;
        if (given) {
            if (sndFn) sndFn('pop', { vol: 0.35 });
            if (PClass && Array.isArray(particles)) {
                particles.push(new PClass(curPlayer.x + curPlayer.width / 2, curPlayer.y + 10, '#84cc16'));
            }
        } else if (dropFn) {
            dropFn(dropId, curPlayer.x + curPlayer.width / 2, curPlayer.y, count);
        }
    } else if (isMultiplayer && isMultiplayerAuthority()) {
        const targetX = targetPlayer ? targetPlayer.x + (targetPlayer.width || 24) / 2 : x * TILE_SIZE + TILE_SIZE / 2;
        const targetY = targetPlayer ? targetPlayer.y + 10 : y * TILE_SIZE + TILE_SIZE / 2;
        if (dropFn) dropFn(dropId, targetX, targetY, count);
    } else {
        const given = giveFn ? giveFn(dropId, count) : false;
        if (!given && curPlayer && dropFn) {
            dropFn(dropId, curPlayer.x + curPlayer.width / 2, curPlayer.y, count);
        }
    }
}

export function updateTreeLeafDecay() {
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    const curLeafQueue = (typeof leafDecayQueue !== 'undefined' && leafDecayQueue) ? leafDecayQueue : (typeof window !== 'undefined' ? window.leafDecayQueue : null);
    const curClusters = (typeof treeDecayClusters !== 'undefined' && treeDecayClusters) ? treeDecayClusters : (typeof window !== 'undefined' ? window.treeDecayClusters : null);
    if (!curWorld || !curLeafQueue) return;

    const syncFn = getSyncBlockFn();
    let decayedCount = 0;

    for (let [key, val] of curLeafQueue) {
        let delay = typeof val === 'object' && val !== null ? val.delay : val;
        const clusterId = typeof val === 'object' && val !== null ? val.clusterId : null;

        let [x, y] = key.split('_').map(Number);
        const blk = curWorld[x]?.[y];
        if (blk !== IDS.LEAVES && blk !== IDS.JUNGLE_LEAVES) {
            if (clusterId && curClusters && curClusters.has(clusterId)) {
                const c = curClusters.get(clusterId);
                c.leavesRemaining = Math.max(0, c.leavesRemaining - 1);
                if (c.leavesRemaining <= 0) curClusters.delete(clusterId);
            }
            curLeafQueue.delete(key);
            continue;
        }

        delay--;
        if (delay > 0) {
            if (typeof val === 'object' && val !== null) {
                val.delay = delay;
                curLeafQueue.set(key, val);
            } else {
                curLeafQueue.set(key, delay);
            }
            continue;
        }

        decayedCount++;
        if (decayedCount > 16) {
            break;
        }

        if (isLeafConnectedToWood(x, y, 5)) {
            if (clusterId && curClusters && curClusters.has(clusterId)) {
                const c = curClusters.get(clusterId);
                c.leavesRemaining = Math.max(0, c.leavesRemaining - 1);
                if (c.leavesRemaining <= 0) curClusters.delete(clusterId);
            }
            curLeafQueue.delete(key);
            continue;
        }

        curWorld[x][y] = IDS.AIR;
        if (syncFn) syncFn(x, y, IDS.AIR);

        let cluster = (clusterId && curClusters && curClusters.has(clusterId)) ? curClusters.get(clusterId) : null;
        if (cluster) {
            cluster.leavesRemaining = Math.max(0, cluster.leavesRemaining - 1);
            const saplingNeeded = cluster.targetSaplings - cluster.droppedSaplings;
            let droppedSapling = false;

            if (saplingNeeded > 0) {
                if (cluster.leavesRemaining < saplingNeeded) {
                    droppedSapling = true;
                } else {
                    const dropProb = saplingNeeded / (cluster.leavesRemaining + 1);
                    if (Math.random() < dropProb) droppedSapling = true;
                }
            }

            if (droppedSapling) {
                cluster.droppedSaplings++;
                const dropId = (blk === IDS.JUNGLE_LEAVES) ? IDS.JUNGLE_SAPLING : IDS.SAPLING;
                deliverLeafDecayItem(dropId, x, y, 1);
            } else {
                const roll = Math.random();
                if (blk === IDS.JUNGLE_LEAVES) {
                    if (roll < 0.15) deliverLeafDecayItem(IDS.MELON_SEEDS, x, y, 1);
                    else if (roll < 0.35) deliverLeafDecayItem(IDS.STICK, x, y, 1);
                } else {
                    if (roll < 0.05) deliverLeafDecayItem(IDS.APPLE, x, y, 1);
                    else if (roll < 0.25) deliverLeafDecayItem(IDS.STICK, x, y, 1);
                }
            }

            if (cluster.leavesRemaining <= 0) {
                curClusters.delete(clusterId);
            }
        } else {
            let roll = Math.random();
            if (blk === IDS.JUNGLE_LEAVES) {
                if (roll < 0.10) deliverLeafDecayItem(IDS.JUNGLE_SAPLING, x, y, 1);
                else if (roll < 0.25) deliverLeafDecayItem(IDS.MELON_SEEDS, x, y, 1);
                else if (roll < 0.40) deliverLeafDecayItem(IDS.STICK, x, y, 1);
            } else {
                if (roll < 0.10) deliverLeafDecayItem(IDS.SAPLING, x, y, 1);
                else if (roll < 0.30) deliverLeafDecayItem(IDS.STICK, x, y, 1);
                else if (roll < 0.35) deliverLeafDecayItem(IDS.APPLE, x, y, 1);
            }
        }

        curLeafQueue.delete(key);
    }
}

export function growSaplingAt(x, y) {
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    if (!curWorld) return;
    const sBlock = curWorld[x]?.[y];
    if (sBlock !== IDS.SAPLING && sBlock !== IDS.JUNGLE_SAPLING) return;
    if (!canSaplingGrowAt(x, y)) {
        return;
    }
    const curWarnings = (typeof saplingBlockedWarnings !== 'undefined' && saplingBlockedWarnings) ? saplingBlockedWarnings : (typeof window !== 'undefined' ? window.saplingBlockedWarnings : null);
    const curQueue = (typeof saplingGrowthQueue !== 'undefined' && saplingGrowthQueue) ? saplingGrowthQueue : (typeof window !== 'undefined' ? window.saplingGrowthQueue : null);
    const curNonCollidable = (typeof nonCollidableTreeWood !== 'undefined' && nonCollidableTreeWood) ? nonCollidableTreeWood : (typeof window !== 'undefined' ? window.nonCollidableTreeWood : null);
    const syncFn = getSyncBlockFn();

    if (curWarnings) curWarnings.delete(`${x}_${y}`);
    if (sBlock === IDS.JUNGLE_SAPLING) {
        curWorld[x][y] = IDS.AIR;
        if (syncFn) syncFn(x, y, IDS.AIR);
        buildJungleTree(x, y + 1, 'giant');
        if (curQueue) curQueue.delete(`${x}_${y}`);
        return;
    }
    const setTreeBlock = (blockX, blockY, blockId) => {
        if (blockX < 0 || blockX >= WORLD_WIDTH || blockY < 0 || blockY >= WORLD_HEIGHT) return;
        const cur = curWorld[blockX][blockY];
        const canOverwrite = (cur === IDS.AIR || isFoliageOrAir(cur) || (blockX === x && blockY === y));
        if (!canOverwrite && blockId !== IDS.WOOD) return;
        curWorld[blockX][blockY] = blockId;
        if (blockId === IDS.WOOD && curNonCollidable) curNonCollidable.add(`${blockX}_${blockY}`);
        if (syncFn) syncFn(blockX, blockY, blockId, blockId === IDS.WOOD ? { treeTrunk: true } : {});
    };
    const height = getSaplingGrowthHeight(x, y);
    setTreeBlock(x, y, IDS.WOOD);
    for (let trunkOffset = 1; trunkOffset <= height; trunkOffset++) setTreeBlock(x, y - trunkOffset, IDS.WOOD);
    const topY = y - height;
    if (height >= 6) {
        for (let leafX = -3; leafX <= 3; leafX++) {
            for (let leafY = -2; leafY <= 2; leafY++) {
                if (Math.abs(leafX) + Math.abs(leafY) <= 4) {
                    setTreeBlock(x + leafX, topY + leafY, IDS.LEAVES);
                }
            }
        }
        setTreeBlock(x, topY - 3, IDS.LEAVES);
    } else {
        for (let leafX = -2; leafX <= 2; leafX++) {
            for (let leafY = -2; leafY <= 1; leafY++) {
                if (Math.abs(leafX) + Math.abs(leafY) <= 3 || (leafY === -2 && Math.abs(leafX) <= 1)) {
                    setTreeBlock(x + leafX, topY + leafY, IDS.LEAVES);
                }
            }
        }
        setTreeBlock(x, topY - 2, IDS.LEAVES);
    }
    if (curQueue) curQueue.delete(`${x}_${y}`);
}

export function getSaplingGrowthHeight(x, y) {
    return 4 + (Math.abs(x * 37 + y * 19) % 4);
}

export function canSaplingGrowAt(x, y) {
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    if (!curWorld) return false;
    const sBlock = curWorld[x]?.[y];
    if ((sBlock !== IDS.SAPLING && sBlock !== IDS.JUNGLE_SAPLING) || ![IDS.DIRT, IDS.GRASS, IDS.PLOWED_DIRT].includes(curWorld[x]?.[y + 1])) return false;
    
    const isPermittedOverhead = (blockId) => {
        return isFoliageOrAir(blockId) || blockId === IDS.SAPLING || blockId === IDS.JUNGLE_SAPLING;
    };

    if (sBlock === IDS.JUNGLE_SAPLING) {
        for (let dy = 1; dy <= 10; dy++) {
            if (y - dy < 0) return false;
            const b = curWorld[x]?.[y - dy];
            if (!isPermittedOverhead(b)) return false;
        }
        return true;
    }

    const height = getSaplingGrowthHeight(x, y);
    const trunkCells = new Set();
    for (let trunkOffset = 0; trunkOffset <= height; trunkOffset++) trunkCells.add(`${x}_${y - trunkOffset}`);
    const topY = y - height;

    for (let trunkOffset = 1; trunkOffset <= height; trunkOffset++) {
        const ty = y - trunkOffset;
        if (ty < 0) return false;
        const tb = curWorld[x]?.[ty];
        if (!isPermittedOverhead(tb)) return false;
    }

    const leafRadius = (height >= 6) ? 3 : 2;
    const leafMinY = (height >= 6) ? -2 : -2;
    const leafMaxY = (height >= 6) ? 2 : 1;
    for (let leafX = -leafRadius; leafX <= leafRadius; leafX++) {
        for (let leafY = leafMinY; leafY <= leafMaxY; leafY++) {
            const bx = x + leafX;
            const by = topY + leafY;
            if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) return false;
            const cellKey = `${bx}_${by}`;
            if (trunkCells.has(cellKey)) continue;
            const b = curWorld[bx]?.[by];
            if (!isPermittedOverhead(b)) return false;
        }
    }
    return true;
}

export function notifyBlockedSaplings() {
    const curWarnings = (typeof saplingBlockedWarnings !== 'undefined' && saplingBlockedWarnings) ? saplingBlockedWarnings : (typeof window !== 'undefined' ? window.saplingBlockedWarnings : null);
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    if (!curWarnings || !curWorld) return;

    for (const key of curWarnings) {
        const [x, y] = key.split('_').map(Number);
        if (curWorld[x]?.[y] !== IDS.SAPLING && curWorld[x]?.[y] !== IDS.JUNGLE_SAPLING) {
            curWarnings.delete(key);
        } else if (canSaplingGrowAt(x, y)) {
            curWarnings.delete(key);
        }
    }
}

export function updateSaplingGrowth() {
    const curQueue = (typeof saplingGrowthQueue !== 'undefined' && saplingGrowthQueue) ? saplingGrowthQueue : (typeof window !== 'undefined' ? window.saplingGrowthQueue : null);
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    if (!curQueue || !curWorld) return;

    for (let [key, growthAt] of curQueue) {
        let [x, y] = key.split('_').map(Number);
        if (curWorld[x]?.[y] !== IDS.SAPLING && curWorld[x]?.[y] !== IDS.JUNGLE_SAPLING) {
            curQueue.delete(key);
            continue;
        }
        if (dayCount + timeOfDay < growthAt) continue;
        if (!isMultiplayer || isMultiplayerAuthority()) growSaplingAt(x, y);
    }
}

export function checkWaterNearCrop(x, y) {
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    if (!curWorld || !curWorld.length) return false;
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return false;
    const soilY = y + 1;
    for (let dx = -4; dx <= 4; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const wx = x + dx;
            const wy = soilY + dy;
            if (wx >= 0 && wx < WORLD_WIDTH && wy >= 0 && wy < WORLD_HEIGHT) {
                if (curWorld[wx]?.[wy] === IDS.WATER || isWater(wx, wy) || getFluid(wx, wy)?.type === IDS.WATER) {
                    return true;
                }
            }
        }
    }
    return false;
}

export function registerPlantedCrop(x, y) {
    const curCropQueue = (typeof cropGrowthQueue !== 'undefined' && cropGrowthQueue) ? cropGrowthQueue : (typeof window !== 'undefined' ? window.cropGrowthQueue : null);
    const hasWater = checkWaterNearCrop(x, y);
    const stageDuration = hasWater ? 1.0 : (4 / 3);
    const nextStageAt = dayCount + timeOfDay + stageDuration;
    if (curCropQueue) {
        curCropQueue.set(`${x}_${y}`, {
            stage: 1,
            nextStageAt: nextStageAt,
            hasWater: hasWater
        });
    }
    return hasWater;
}

export function updateCropGrowth() {
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    const curCropQueue = (typeof cropGrowthQueue !== 'undefined' && cropGrowthQueue) ? cropGrowthQueue : (typeof window !== 'undefined' ? window.cropGrowthQueue : null);
    if (!curWorld || !curWorld.length || !curCropQueue) return;
    if (isMultiplayer && !isMultiplayerAuthority()) return;

    const syncFn = getSyncBlockFn();
    const dropFn = getDropItemFn();
    const PClass = getParticleClass();

    for (let [key, info] of curCropQueue) {
        const [x, y] = key.split('_').map(Number);
        const currentBlock = curWorld[x]?.[y];
        const isCrop = currentBlock === IDS.WHEAT_STAGE_1 || currentBlock === IDS.WHEAT_STAGE_2 || currentBlock === IDS.WHEAT_STAGE_3 || currentBlock === IDS.WHEAT_STAGE_4 || currentBlock === IDS.MELON_STEM;
        if (!isCrop) {
            curCropQueue.delete(key);
            continue;
        }

        if (curWorld[x]?.[y + 1] !== IDS.PLOWED_DIRT) {
            curCropQueue.delete(key);
            if (dropFn) {
                if (currentBlock === IDS.MELON_STEM) {
                    dropFn(IDS.MELON_SEEDS, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 1);
                } else if (currentBlock === IDS.WHEAT_STAGE_4) {
                    dropFn(IDS.WHEAT, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 1);
                    dropFn(IDS.SEEDS, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 2);
                } else if (currentBlock === IDS.WHEAT_STAGE_3) {
                    dropFn(IDS.WHEAT, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 1);
                } else {
                    dropFn(IDS.SEEDS, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 1);
                }
            }
            curWorld[x][y] = IDS.AIR;
            if (syncFn) syncFn(x, y, IDS.AIR);
            continue;
        }

        if (currentBlock === IDS.MELON_STEM) {
            const hasMelonAttached = (curWorld[x - 1]?.[y] === IDS.MELON || curWorld[x + 1]?.[y] === IDS.MELON);
            if (!hasMelonAttached && dayCount + timeOfDay >= info.nextStageAt) {
                const melonDirections = [-1, 1].sort(() => Math.random() - 0.5);
                for (let dx of melonDirections) {
                    const mx = x + dx;
                    if (mx >= 0 && mx < WORLD_WIDTH) {
                        const targetBlock = curWorld[mx]?.[y];
                        const isGroundValid = [IDS.DIRT, IDS.GRASS, IDS.PLOWED_DIRT].includes(curWorld[mx]?.[y + 1]);
                        const canReplace = (targetBlock === IDS.AIR || targetBlock === IDS.SHORT_GRASS || targetBlock === IDS.TALL_GRASS || targetBlock === IDS.FERN || targetBlock === IDS.FLOWER_RED || targetBlock === IDS.FLOWER_YELLOW || targetBlock === IDS.SNOW);
                        if (isGroundValid && canReplace) {
                            curWorld[mx][y] = IDS.MELON;
                            if (syncFn) syncFn(mx, y, IDS.MELON);
                            if (PClass && Array.isArray(particles)) {
                                for (let p = 0; p < 4; p++) {
                                    particles.push(new PClass(mx * TILE_SIZE + Math.random() * TILE_SIZE, y * TILE_SIZE + Math.random() * TILE_SIZE, '#22c55e'));
                                }
                            }
                            break;
                        }
                    }
                }
                const stageDuration = info.hasWater ? 1.5 : 2.5;
                info.nextStageAt = dayCount + timeOfDay + stageDuration;
            }
            continue;
        }

        if (currentBlock === IDS.WHEAT_STAGE_4 || info.stage >= 4) {
            continue;
        }

        const hasWater = checkWaterNearCrop(x, y);
        if (hasWater !== info.hasWater) {
            const oldTotal = info.hasWater ? 1.0 : (4 / 3);
            const newTotal = hasWater ? 1.0 : (4 / 3);
            const remaining = Math.max(0, info.nextStageAt - (dayCount + timeOfDay));
            const ratio = remaining / oldTotal;
            info.nextStageAt = (dayCount + timeOfDay) + ratio * newTotal;
            info.hasWater = hasWater;
        }

        if (dayCount + timeOfDay >= info.nextStageAt) {
            let nextBlock = currentBlock;
            let nextStage = info.stage;

            if (currentBlock === IDS.WHEAT_STAGE_1) {
                nextBlock = IDS.WHEAT_STAGE_2;
                nextStage = 2;
            } else if (currentBlock === IDS.WHEAT_STAGE_2) {
                nextBlock = IDS.WHEAT_STAGE_3;
                nextStage = 3;
            } else if (currentBlock === IDS.WHEAT_STAGE_3) {
                nextBlock = IDS.WHEAT_STAGE_4;
                nextStage = 4;
            }

            curWorld[x][y] = nextBlock;
            if (syncFn) syncFn(x, y, nextBlock);

            const sparkColor = nextStage === 4 ? '#facc15' : (nextStage === 3 ? '#a3e635' : '#4ade80');
            if (PClass && Array.isArray(particles)) {
                for (let p = 0; p < 4; p++) {
                    particles.push(new PClass(x * TILE_SIZE + Math.random() * TILE_SIZE, y * TILE_SIZE + Math.random() * TILE_SIZE, sparkColor));
                }
            }

            if (nextStage >= 4) {
                info.stage = 4;
            } else {
                info.stage = nextStage;
                const stageDuration = info.hasWater ? 1.0 : (4 / 3);
                info.nextStageAt = dayCount + timeOfDay + stageDuration;
            }
        }
    }
}

export function scheduleDirtToGrass(x, y) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return;
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    if (!curWorld || curWorld[x]?.[y] !== IDS.DIRT) return;
    if (typeof getActiveBiomeAt === 'function' && getActiveBiomeAt(x) === 'desert') return;
    const above = curWorld[x]?.[y - 1];
    if (above !== undefined && isSolidWorldBlock(x, y - 1, above)) return;
    const curDirtQueue = (typeof dirtToGrassQueue !== 'undefined' && dirtToGrassQueue) ? dirtToGrassQueue : (typeof window !== 'undefined' ? window.dirtToGrassQueue : null);
    if (curDirtQueue && !curDirtQueue.has(`${x}_${y}`)) {
        const growAt = dayCount + timeOfDay + DIRT_TO_GRASS_DAYS + (Math.random() * 0.5);
        curDirtQueue.set(`${x}_${y}`, growAt);
    }
}

export function scheduleSnowRegrowth(x, y) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return;
    const isSnowBiome = (typeof getActiveBiomeAt === 'function' && getActiveBiomeAt(x) === 'snow') || (y < Math.floor(WORLD_HEIGHT / 2) - 30);
    if (!isSnowBiome) return;
    const curSnowQueue = (typeof snowRegrowthQueue !== 'undefined' && snowRegrowthQueue) ? snowRegrowthQueue : (typeof window !== 'undefined' ? window.snowRegrowthQueue : null);
    if (curSnowQueue && !curSnowQueue.has(`${x}_${y}`)) {
        const regrowAt = dayCount + timeOfDay + SNOW_REGROWTH_DAYS + (Math.random() * 0.5);
        curSnowQueue.set(`${x}_${y}`, regrowAt);
    }
}

export function updateNaturalRegrowth() {
    if (isMultiplayer && !isMultiplayerAuthority()) return;
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    const curDirtQueue = (typeof dirtToGrassQueue !== 'undefined' && dirtToGrassQueue) ? dirtToGrassQueue : (typeof window !== 'undefined' ? window.dirtToGrassQueue : null);
    const curSnowQueue = (typeof snowRegrowthQueue !== 'undefined' && snowRegrowthQueue) ? snowRegrowthQueue : (typeof window !== 'undefined' ? window.snowRegrowthQueue : null);
    const curPlayer = (typeof player !== 'undefined' && player) ? player : (typeof window !== 'undefined' ? window.player : null);
    const curRemotes = (typeof remotePlayers !== 'undefined') ? remotePlayers : (typeof window !== 'undefined' ? window.remotePlayers : null);
    if (!curWorld) return;
    const syncFn = getSyncBlockFn();

    // 1. Process queued dirt-to-grass growth
    if (curDirtQueue) {
        for (let [key, growAt] of curDirtQueue) {
            let [x, y] = key.split('_').map(Number);
            if (curWorld[x]?.[y] !== IDS.DIRT) { curDirtQueue.delete(key); continue; }
            const above = curWorld[x]?.[y - 1];
            if (above !== undefined && isSolidWorldBlock(x, y - 1, above)) {
                curDirtQueue.delete(key);
                continue;
            }
            if (dayCount + timeOfDay >= growAt) {
                curDirtQueue.delete(key);
                curWorld[x][y] = IDS.GRASS;
                if (syncFn) syncFn(x, y, IDS.GRASS);
            }
        }
    }

    // 2. Process queued snow regrowth
    if (curSnowQueue) {
        for (let [key, regrowAt] of curSnowQueue) {
            let [x, y] = key.split('_').map(Number);
            if (curWorld[x]?.[y] === IDS.SNOW) { curSnowQueue.delete(key); continue; }
            if (dayCount + timeOfDay < regrowAt) continue;

            const isSnowBiome = (typeof getActiveBiomeAt === 'function' && getActiveBiomeAt(x) === 'snow') || (y < Math.floor(WORLD_HEIGHT / 2) - 30);
            if (!isSnowBiome) { curSnowQueue.delete(key); continue; }

            if (curWorld[x]?.[y] === IDS.AIR && isSolidWorldBlock(x, y + 1, curWorld[x]?.[y + 1])) {
                curWorld[x][y] = IDS.SNOW;
                if (syncFn) syncFn(x, y, IDS.SNOW);
                curSnowQueue.delete(key);
            }
            else if ((curWorld[x]?.[y] === IDS.DIRT || curWorld[x]?.[y] === IDS.GRASS) && (curWorld[x]?.[y - 1] === IDS.AIR || !isSolidWorldBlock(x, y - 1, curWorld[x]?.[y - 1]))) {
                curWorld[x][y] = IDS.SNOW;
                if (syncFn) syncFn(x, y, IDS.SNOW);
                curSnowQueue.delete(key);
            }
            else {
                const surfY = getWorldSurfaceY(x);
                if (surfY < WORLD_HEIGHT && (curWorld[x]?.[surfY] === IDS.DIRT || curWorld[x]?.[surfY] === IDS.GRASS)) {
                    curWorld[x][surfY] = IDS.SNOW;
                    if (syncFn) syncFn(x, surfY, IDS.SNOW);
                }
                curSnowQueue.delete(key);
            }
        }
    }

    // 3. Random natural ambient spread around all active players
    if (frameCount % 30 === 0 && curPlayer) {
        const playerPositions = [curPlayer.x + curPlayer.width / 2];
        if (isMultiplayer && typeof curRemotes === 'object' && curRemotes) {
            Object.values(curRemotes).forEach(rp => {
                if (Number.isFinite(rp.x)) playerPositions.push(rp.x + 14);
            });
        }

        playerPositions.forEach(pX => {
            const centerGx = Math.floor(pX / TILE_SIZE);
            for (let i = 0; i < 4; i++) {
                const randX = Math.max(0, Math.min(WORLD_WIDTH - 1, centerGx + Math.floor((Math.random() - 0.5) * 60)));
                const surfY = getWorldSurfaceY(randX);
                if (surfY >= 0 && surfY < WORLD_HEIGHT) {
                    const block = curWorld[randX]?.[surfY];
                    const biome = typeof getActiveBiomeAt === 'function' ? getActiveBiomeAt(randX) : 'plains';
                    if (biome === 'snow' || (biome === 'mountains' && surfY < Math.floor(WORLD_HEIGHT / 2) - 30)) {
                        if ((block === IDS.DIRT || block === IDS.GRASS) && (curWorld[randX]?.[surfY - 1] === IDS.AIR || !isSolidWorldBlock(randX, surfY - 1, curWorld[randX]?.[surfY - 1]))) {
                            scheduleSnowRegrowth(randX, surfY);
                        }
                    }
                    else if (biome !== 'desert' && block === IDS.DIRT && (curWorld[randX]?.[surfY - 1] === IDS.AIR || !isSolidWorldBlock(randX, surfY - 1, curWorld[randX]?.[surfY - 1]))) {
                        const hasNearbyGrass = (randX > 0 && curWorld[randX - 1]?.[surfY] === IDS.GRASS) ||
                                               (randX < WORLD_WIDTH - 1 && curWorld[randX + 1]?.[surfY] === IDS.GRASS) ||
                                               (randX > 0 && curWorld[randX - 1]?.[surfY - 1] === IDS.GRASS) ||
                                               (randX < WORLD_WIDTH - 1 && curWorld[randX + 1]?.[surfY - 1] === IDS.GRASS) ||
                                               (randX > 0 && curWorld[randX - 1]?.[surfY + 1] === IDS.GRASS) ||
                                               (randX < WORLD_WIDTH - 1 && curWorld[randX + 1]?.[surfY + 1] === IDS.GRASS);
                        if (hasNearbyGrass) {
                            scheduleDirtToGrass(randX, surfY);
                        }
                    }
                    else if (block === IDS.GRASS && isSolidWorldBlock(randX, surfY - 1, curWorld[randX]?.[surfY - 1])) {
                        curWorld[randX][surfY] = IDS.DIRT;
                        if (syncFn) syncFn(randX, surfY, IDS.DIRT);
                    }
                }
            }
        });
    }
}

// Window self-registration for backward compatibility
try {
    if (typeof window !== 'undefined') {
        window.isLeafConnectedToWood = isLeafConnectedToWood;
        window.scheduleTreeLeafDecay = scheduleTreeLeafDecay;
        window.deliverLeafDecayItem = deliverLeafDecayItem;
        window.updateTreeLeafDecay = updateTreeLeafDecay;
        window.growSaplingAt = growSaplingAt;
        window.getSaplingGrowthHeight = getSaplingGrowthHeight;
        window.canSaplingGrowAt = canSaplingGrowAt;
        window.notifyBlockedSaplings = notifyBlockedSaplings;
        window.updateSaplingGrowth = updateSaplingGrowth;
        window.checkWaterNearCrop = checkWaterNearCrop;
        window.registerPlantedCrop = registerPlantedCrop;
        window.updateCropGrowth = updateCropGrowth;
        window.scheduleDirtToGrass = scheduleDirtToGrass;
        window.scheduleSnowRegrowth = scheduleSnowRegrowth;
        window.updateNaturalRegrowth = updateNaturalRegrowth;
    }
} catch (e) {}