// =============================================================================
// WEBCRAFT 2D - BLOCK & TILE HELPERS (js/world/blockhelper.js)
// Surface heights, solid block checks, harvest tiers, doors & crack animation maps
// =============================================================================

import {
    IDS, MINING_TOOL_TIERS, getRequiredMiningTier, isLeafBlock, isFoliageOrAir, TILE_SIZE,
    isPickaxe, isAxe, isShovel, isSword, isHoe, isShears, isTool,
    isPickaxeBlock, isAxeBlock, isShovelBlock, isShearsBlock,
    BACKGROUND_BUILDING_BLOCKS, isBackgroundBuildingBlock
} from '../core/constants.js';

import {
    world, surfaceHeights, nonCollidableTreeWood, WORLD_WIDTH, WORLD_HEIGHT,
    fluids, inventory, selectedHotbarIndex, STATE, particles, floatingTexts
} from '../core/state.js';



export const BLOCK_CRACK_STAGES = [
    // Stage 0: 0% - 10% (Fine center impact fracture)
    [[8,8], [7,8], [8,7], [9,8], [8,9]],
    // Stage 1: 10% - 20%
    [[8,8], [7,8], [8,7], [9,8], [8,9], [6,8], [8,6], [10,8], [8,10], [7,7], [9,9]],
    // Stage 2: 20% - 30%
    [[8,8], [7,8], [8,7], [9,8], [8,9], [6,8], [8,6], [10,8], [8,10], [7,7], [9,9], [6,6], [5,6], [10,10], [11,10], [9,7], [10,6], [7,9], [6,10]],
    // Stage 3: 30% - 40%
    [[8,8], [7,8], [8,7], [9,8], [8,9], [6,8], [8,6], [10,8], [8,10], [7,7], [9,9], [6,6], [5,6], [10,10], [11,10], [9,7], [10,6], [7,9], [6,10], [5,5], [4,5], [11,11], [12,11], [11,5], [12,5], [5,11], [4,11], [8,5], [8,11]],
    // Stage 4: 40% - 50%
    [[8,8], [7,8], [8,7], [9,8], [8,9], [6,8], [8,6], [10,8], [8,10], [7,7], [9,9], [6,6], [5,6], [10,10], [11,10], [9,7], [10,6], [7,9], [6,10], [5,5], [4,5], [11,11], [12,11], [11,5], [12,5], [5,11], [4,11], [8,5], [8,11], [3,5], [2,5], [13,11], [13,12], [13,4], [13,3], [4,12], [3,12], [8,4], [8,3], [9,4], [6,11], [6,12]],
    // Stage 5: 50% - 60%
    [[8,8], [7,8], [8,7], [9,8], [8,9], [6,8], [8,6], [10,8], [8,10], [7,7], [9,9], [6,6], [5,6], [10,10], [11,10], [9,7], [10,6], [7,9], [6,10], [5,5], [4,5], [11,11], [12,11], [11,5], [12,5], [5,11], [4,11], [8,5], [8,11], [3,5], [2,5], [13,11], [13,12], [13,4], [13,3], [4,12], [3,12], [8,4], [8,3], [9,4], [6,11], [6,12], [1,5], [0,5], [14,12], [14,13], [14,3], [14,2], [3,13], [2,13], [7,3], [6,3], [10,4], [10,3], [10,11], [11,12]],
    // Stage 6: 60% - 70%
    [[8,8], [7,8], [8,7], [9,8], [8,9], [6,8], [8,6], [10,8], [8,10], [7,7], [9,9], [6,6], [5,6], [10,10], [11,10], [9,7], [10,6], [7,9], [6,10], [5,5], [4,5], [11,11], [12,11], [11,5], [12,5], [5,11], [4,11], [8,5], [8,11], [3,5], [2,5], [13,11], [13,12], [13,4], [13,3], [4,12], [3,12], [8,4], [8,3], [9,4], [6,11], [6,12], [1,5], [0,5], [14,12], [14,13], [14,3], [14,2], [3,13], [2,13], [7,3], [6,3], [10,4], [10,3], [10,11], [11,12], [15,2], [15,13], [1,13], [8,2], [8,1], [5,3], [4,2], [11,3], [12,2], [2,8], [3,8], [4,8], [12,8], [13,8], [14,8]],
    // Stage 7: 70% - 80%
    [[8,8], [7,8], [8,7], [9,8], [8,9], [6,8], [8,6], [10,8], [8,10], [7,7], [9,9], [6,6], [5,6], [10,10], [11,10], [9,7], [10,6], [7,9], [6,10], [5,5], [4,5], [11,11], [12,11], [11,5], [12,5], [5,11], [4,11], [8,5], [8,11], [3,5], [2,5], [13,11], [13,12], [13,4], [13,3], [4,12], [3,12], [8,4], [8,3], [9,4], [6,11], [6,12], [1,5], [0,5], [14,12], [14,13], [14,3], [14,2], [3,13], [2,13], [7,3], [6,3], [10,4], [10,3], [10,11], [11,12], [15,2], [15,13], [1,13], [8,2], [8,1], [5,3], [4,2], [11,3], [12,2], [2,8], [3,8], [4,8], [12,8], [13,8], [14,8], [3,2], [2,2], [13,1], [14,1], [1,14], [0,14], [8,12], [8,13], [8,14], [6,5], [5,4], [10,9], [11,9], [9,10], [9,11]],
    // Stage 8: 80% - 90%
    [[8,8], [7,8], [8,7], [9,8], [8,9], [6,8], [8,6], [10,8], [8,10], [7,7], [9,9], [6,6], [5,6], [10,10], [11,10], [9,7], [10,6], [7,9], [6,10], [5,5], [4,5], [11,11], [12,11], [11,5], [12,5], [5,11], [4,11], [8,5], [8,11], [3,5], [2,5], [13,11], [13,12], [13,4], [13,3], [4,12], [3,12], [8,4], [8,3], [9,4], [6,11], [6,12], [1,5], [0,5], [14,12], [14,13], [14,3], [14,2], [3,13], [2,13], [7,3], [6,3], [10,4], [10,3], [10,11], [11,12], [15,2], [15,13], [1,13], [8,2], [8,1], [5,3], [4,2], [11,3], [12,2], [2,8], [3,8], [4,8], [12,8], [13,8], [14,8], [3,2], [2,2], [13,1], [14,1], [1,14], [0,14], [8,12], [8,13], [8,14], [6,5], [5,4], [10,9], [11,9], [9,10], [9,11], [1,2], [0,2], [8,0], [8,15], [15,1], [15,8], [15,14], [4,6], [3,7], [12,6], [13,7], [4,10], [3,9], [12,10], [13,9]],
    // Stage 9: 90% - 100%
    [[8,8], [7,8], [8,7], [9,8], [8,9], [6,8], [8,6], [10,8], [8,10], [7,7], [9,9], [6,6], [5,6], [10,10], [11,10], [9,7], [10,6], [7,9], [6,10], [5,5], [4,5], [11,11], [12,11], [11,5], [12,5], [5,11], [4,11], [8,5], [8,11], [3,5], [2,5], [13,11], [13,12], [13,4], [13,3], [4,12], [3,12], [8,4], [8,3], [9,4], [6,11], [6,12], [1,5], [0,5], [14,12], [14,13], [14,3], [14,2], [3,13], [2,13], [7,3], [6,3], [10,4], [10,3], [10,11], [11,12], [15,2], [15,13], [1,13], [8,2], [8,1], [5,3], [4,2], [11,3], [12,2], [2,8], [3,8], [4,8], [12,8], [13,8], [14,8], [3,2], [2,2], [13,1], [14,1], [1,14], [0,14], [8,12], [8,13], [8,14], [6,5], [5,4], [10,9], [11,9], [9,10], [9,11], [1,2], [0,2], [8,0], [8,15], [15,1], [15,8], [15,14], [4,6], [3,7], [12,6], [13,7], [4,10], [3,9], [12,10], [13,9], [1,1], [0,1], [14,0], [15,0], [0,15], [1,15], [14,15], [15,15], [7,1], [6,1], [9,1], [10,1], [7,14], [6,14], [9,14], [10,14], [2,4], [1,3], [14,4], [13,5], [2,11], [1,12], [14,11], [13,10]]
];

export const BLOCK_CRACK_SEGMENTS = [
    // Stage 0: 0% - 10% (Center impact star)
    [
        [[8,8], [7,8]], [[8,8], [9,8]], [[8,8], [8,7]], [[8,8], [8,9]]
    ],
    // Stage 1: 10% - 20%
    [
        [[8,8], [6,8]], [[8,8], [10,8]], [[8,8], [8,6]], [[8,8], [8,10]],
        [[8,8], [7,7]], [[8,8], [9,9]]
    ],
    // Stage 2: 20% - 30%
    [
        [[8,8], [6,8]], [[6,8], [5,6]], [[8,8], [10,8]], [[10,8], [11,10]],
        [[8,8], [8,6]], [[8,6], [10,6]], [[8,8], [8,10]], [[8,10], [6,10]],
        [[8,8], [6,6]], [[8,8], [10,10]]
    ],
    // Stage 3: 30% - 40%
    [
        [[8,8], [6,8]], [[6,8], [4,5]], [[8,8], [10,8]], [[10,8], [12,11]],
        [[8,8], [8,6]], [[8,6], [12,5]], [[8,8], [8,10]], [[8,10], [4,11]],
        [[8,8], [5,5]], [[8,8], [11,11]], [[8,6], [8,5]], [[8,10], [8,11]]
    ],
    // Stage 4: 40% - 50%
    [
        [[8,8], [6,8]], [[6,8], [2,5]], [[8,8], [10,8]], [[10,8], [13,12]],
        [[8,8], [8,6]], [[8,6], [13,3]], [[8,8], [8,10]], [[8,10], [3,12]],
        [[8,8], [5,5]], [[8,8], [11,11]], [[8,6], [8,3]], [[8,10], [8,12]],
        [[8,3], [9,4]], [[8,12], [6,11]]
    ],
    // Stage 5: 50% - 60%
    [
        [[8,8], [6,8]], [[6,8], [0,5]], [[8,8], [10,8]], [[10,8], [14,13]],
        [[8,8], [8,6]], [[8,6], [14,2]], [[8,8], [8,10]], [[8,10], [2,13]],
        [[8,8], [5,5]], [[8,8], [11,11]], [[8,6], [6,3]], [[8,10], [11,12]],
        [[14,2], [10,3]], [[2,13], [7,3]]
    ],
    // Stage 6: 60% - 70%
    [
        [[8,8], [6,8]], [[6,8], [0,5]], [[8,8], [10,8]], [[10,8], [14,13]],
        [[8,8], [8,6]], [[8,6], [14,2]], [[8,8], [8,10]], [[8,10], [2,13]],
        [[8,8], [2,8]], [[8,8], [14,8]], [[8,6], [8,1]], [[8,10], [8,13]],
        [[14,2], [15,2]], [[2,13], [1,13]], [[6,8], [4,2]], [[10,8], [12,2]]
    ],
    // Stage 7: 70% - 80%
    [
        [[8,8], [0,5]], [[8,8], [14,13]], [[8,8], [14,2]], [[8,8], [2,13]],
        [[8,8], [2,8]], [[8,8], [14,8]], [[8,8], [8,1]], [[8,8], [8,14]],
        [[14,2], [14,1]], [[2,13], [0,14]], [[4,2], [2,2]], [[12,2], [13,1]],
        [[6,8], [5,4]], [[10,8], [11,9]], [[8,10], [9,11]]
    ],
    // Stage 8: 80% - 90%
    [
        [[8,8], [0,5]], [[8,8], [14,13]], [[8,8], [14,2]], [[8,8], [2,13]],
        [[8,8], [2,8]], [[8,8], [14,8]], [[8,8], [8,0]], [[8,8], [8,15]],
        [[14,2], [15,1]], [[2,13], [15,14]], [[2,2], [0,2]], [[13,1], [15,8]],
        [[5,4], [3,7]], [[11,9], [13,7]], [[9,11], [12,10]], [[5,4], [3,9]]
    ],
    // Stage 9: 90% - 100% (Complete network fracture spanning all 4 edges & corners)
    [
        [[8,8], [0,5]], [[8,8], [14,13]], [[8,8], [14,2]], [[8,8], [2,13]],
        [[8,8], [2,8]], [[8,8], [14,8]], [[8,8], [8,0]], [[8,8], [8,15]],
        [[0,5], [0,1]], [[0,1], [0,15]], [[14,13], [15,15]], [[15,15], [15,0]],
        [[14,2], [14,0]], [[2,13], [1,15]], [[8,0], [7,1]], [[8,0], [9,1]],
        [[8,15], [7,14]], [[8,15], [9,14]], [[2,8], [1,3]], [[2,8], [1,12]],
        [[14,8], [13,5]], [[14,8], [13,10]]
    ]
];

export function getSelectedMiningTier() {
    const item = inventory[selectedHotbarIndex];
    return item ? (MINING_TOOL_TIERS[item.id] || 0) : 0;
}

export function canHarvestBlock(blockId) {
    const requiredTier = getRequiredMiningTier(blockId);
    return requiredTier === 0 || getSelectedMiningTier() >= requiredTier;
}

export function isWoodPartOfTree(wx, wy) {
    if (!world || !world[wx]) return false;
    const b = world[wx][wy];
    if (b !== IDS.WOOD && b !== IDS.JUNGLE_WOOD) return false;

    const isNaturalGround = (blk) => (
        blk === IDS.DIRT || blk === IDS.GRASS || blk === IDS.STONE ||
        blk === IDS.SAND || blk === IDS.PODZOL || blk === IDS.SNOW || blk === IDS.GRAVEL
    );

    // Canopy leaves check:
    let hasCanopyLeaves = false;
    for (let dx = -5; dx <= 5; dx++) {
        const nx = wx + dx;
        if (nx < 0 || nx >= WORLD_WIDTH || !world[nx]) continue;
        for (let dy = -18; dy <= 4; dy++) {
            const ny = wy + dy;
            if (ny < 0 || ny >= WORLD_HEIGHT) continue;
            const blk = world[nx][ny];
            if (isLeafBlock(blk)) {
                hasCanopyLeaves = true;
                break;
            }
        }
        if (hasCanopyLeaves) break;
    }
    if (!hasCanopyLeaves) return false;

    const isWood = (id) => id === IDS.WOOD || id === IDS.JUNGLE_WOOD;
    const up = world[wx]?.[wy - 1];
    const down = world[wx]?.[wy + 1];
    const left = world[wx - 1]?.[wy];
    const right = world[wx + 1]?.[wy];

    const isVerticalTrunk = isWood(up) || isWood(down) || isNaturalGround(down) || isLeafBlock(up) || isLeafBlock(down);
    const isBranch = (isWood(left) && (isWood(world[wx - 1]?.[wy - 1]) || isWood(world[wx - 1]?.[wy + 1]) || isNaturalGround(world[wx - 1]?.[wy + 1]))) ||
                     (isWood(right) && (isWood(world[wx + 1]?.[wy - 1]) || isWood(world[wx + 1]?.[wy + 1]) || isNaturalGround(world[wx + 1]?.[wy + 1])));

    if (!isVerticalTrunk && !isBranch) return false;

    // Reject long horizontal platforms (bridges / roofs >= 5 blocks wide)
    let horizRun = 1;
    let lx = wx - 1;
    while (lx >= 0 && isWood(world[lx]?.[wy])) {
        horizRun++;
        lx--;
    }
    let rx = wx + 1;
    while (rx < WORLD_WIDTH && isWood(world[rx]?.[wy])) {
        horizRun++;
        rx++;
    }
    if (horizRun >= 5) return false;

    // Ground connectivity check:
    let reachesGround = false;
    for (let cx = Math.max(0, wx - 2); cx <= Math.min(WORLD_WIDTH - 1, wx + 2); cx++) {
        if (!world[cx]) continue;
        for (let cy = wy; cy < Math.min(WORLD_HEIGHT, wy + 26); cy++) {
            const cb = world[cx][cy];
            if (isNaturalGround(cb)) {
                reachesGround = true;
                break;
            }
            if (cb === IDS.PLANKS || cb === IDS.JUNGLE_PLANKS || cb === IDS.BRICKS || cb === IDS.STONE_BRICKS) {
                break;
            }
        }
        if (reachesGround) break;
    }

    return reachesGround;
}

export function sanitizeTreeWoodCollision() {
    if (!nonCollidableTreeWood || nonCollidableTreeWood.size === 0 || !world || !world.length) return;
    const toRemove = [];
    for (const cell of nonCollidableTreeWood) {
        const sep = cell.indexOf('_');
        if (sep === -1) { toRemove.push(cell); continue; }
        const x = parseInt(cell.slice(0, sep), 10);
        const y = parseInt(cell.slice(sep + 1), 10);
        if (isNaN(x) || isNaN(y) || x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) {
            toRemove.push(cell);
            continue;
        }
        const b = world[x]?.[y];
        if (b !== IDS.WOOD && b !== IDS.JUNGLE_WOOD) {
            toRemove.push(cell);
            continue;
        }
    }
    for (let i = 0; i < toRemove.length; i++) {
        nonCollidableTreeWood.delete(toRemove[i]);
    }
    if (typeof window !== 'undefined') window.nonCollidableTreeWood = nonCollidableTreeWood;
}

export function ensureTreeWoodNonCollidable() {
    if (!world || !world.length) return;
    for (let x = 0; x < WORLD_WIDTH; x++) {
        if (!world[x]) continue;
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            const b = world[x][y];
            if ((b === IDS.WOOD || b === IDS.JUNGLE_WOOD) && isWoodPartOfTree(x, y)) {
                nonCollidableTreeWood.add(`${x}_${y}`);
            }
        }
    }
    sanitizeTreeWoodCollision();
}

export function isClimbableBlock(block) {
    return block === IDS.LADDER || block === IDS.VINES;
}

export function isSolidWorldBlock(x, y, block) {
    if (block === IDS.AIR || block === IDS.TORCH || block === IDS.LEAVES || block === IDS.JUNGLE_LEAVES ||
        block === IDS.SAPLING || block === IDS.JUNGLE_SAPLING || block === IDS.WATER || block === IDS.LAVA ||
        block === IDS.SHORT_GRASS || block === IDS.TALL_GRASS || block === IDS.FLOWER_RED || block === IDS.FLOWER_YELLOW ||
        block === IDS.LADDER || block === IDS.VINES || block === IDS.FERN || block === IDS.MELON_STEM ||
        block === IDS.VOID_BERRY_BUSH || block === IDS.BAMBOO || block === IDS.SIGN) return false;
    if (block === IDS.WHEAT_STAGE_1 || block === IDS.WHEAT_STAGE_2 || block === IDS.WHEAT_STAGE_3 || block === IDS.WHEAT_STAGE_4) return false;
    if (block === IDS.DOOR_OPEN || block === IDS.DOOR_OPEN_TOP || block === IDS.JUNGLE_DOOR_OPEN || block === IDS.JUNGLE_DOOR_OPEN_TOP) return false;
    if (block === IDS.WOOD || block === IDS.JUNGLE_WOOD) {
        const activeTreeWood = (typeof window !== 'undefined' && window.nonCollidableTreeWood) ? window.nonCollidableTreeWood : nonCollidableTreeWood;
        return !activeTreeWood.has(`${x}_${y}`);
    }
    return true;
}

export function isNonSurfaceBlock(block) {
    if (block === undefined || block === IDS.AIR) return true;
    if (block === IDS.LEAVES || block === IDS.JUNGLE_LEAVES) return true;
    if (block === IDS.WOOD || block === IDS.JUNGLE_WOOD) return true;
    if (block === IDS.SAPLING || block === IDS.JUNGLE_SAPLING) return true;
    if (block === IDS.TORCH || block === IDS.LADDER || block === IDS.SIGN) return true;
    if (block === IDS.SHORT_GRASS || block === IDS.TALL_GRASS) return true;
    if (block === IDS.FLOWER_RED || block === IDS.FLOWER_YELLOW || block === IDS.FERN) return true;
    if (block === IDS.VINES || block === IDS.BAMBOO || block === IDS.CACTUS) return true;
    if (block === IDS.MELON || block === IDS.MELON_STEM || block === IDS.SUNBURST_MELON) return true;
    if (block === IDS.VOID_BERRY_BUSH || block === IDS.PRISM_GLASS) return true;
    if (block >= IDS.WHEAT_STAGE_1 && block <= IDS.WHEAT_STAGE_4) return true;
    if (block >= IDS.DOOR && block <= IDS.DOOR_OPEN_TOP) return true;
    if (block >= IDS.JUNGLE_DOOR && block <= IDS.JUNGLE_DOOR_OPEN_TOP) return true;
    return false;
}


export function getFluidKey(x, y) { return `${x}_${y}`; }
export function getChestKey(x, y) { return `${x}_${y}`; }

export function isChestPairedWithLeft(cx, cy) {
    if (cx <= 0 || !world || !world[cx - 1] || world[cx - 1][cy] !== IDS.CHEST) return false;
    return !isChestPairedWithLeft(cx - 1, cy);
}

export function getChestGroup(x, y) {
    let neighbors = [[x, y]];
    if (isChestPairedWithLeft(x, y)) {
        neighbors = [[x - 1, y], [x, y]];
    } else if (x < WORLD_WIDTH - 1 && world[x + 1]?.[y] === IDS.CHEST) {
        neighbors = [[x, y], [x + 1, y]];
    }
    if (typeof window !== 'undefined' && window.chests && window.chests instanceof Map) {
        if (chests.size === 0 && window.chests.size > 0) {
            setEngineChests(window.chests);
        } else if (window.chests !== chests) {
            for (const [k, v] of window.chests.entries()) {
                if (!chests.has(k)) chests.set(k, v);
            }
        }
    }
    const key = neighbors.map(([cx, cy]) => getChestKey(cx, cy)).sort()[0];
    const targetSize = neighbors.length > 1 ? 54 : 27;
    const existingGroups = neighbors.map(([cx, cy]) => chests.get(getChestKey(cx, cy))).filter(Boolean);
    if (existingGroups.length > 1) {
        const mergedItems = existingGroups.flatMap(group => group.items || []).slice(0, 54);
        chests.set(key, { items: mergedItems.length ? mergedItems : new Array(54).fill(null) });
        neighbors.forEach(([cx, cy]) => { const neighborKey = getChestKey(cx, cy); if (neighborKey !== key) chests.delete(neighborKey); });
    } else if (!chests.has(key) && existingGroups.length === 1) {
        chests.set(key, { items: existingGroups[0].items ? [...existingGroups[0].items] : new Array(targetSize).fill(null) });
    }
    if (!chests.has(key)) chests.set(key, { items: new Array(targetSize).fill(null) });
    if (typeof window !== 'undefined') window.chests = chests;
    const chest = chests.get(key);
    while (chest.items.length < targetSize) chest.items.push(null);
    if (chest.items.length > targetSize) chest.items.length = targetSize;
    return { key, chest, size: targetSize };
}

export function syncChest(key) {
    if (!isMultiplayer) return;
    if (typeof window !== 'undefined' && window.network && typeof window.network.broadcastData === 'function') {
        window.network.broadcastData({
            type: 'chest',
            key: key,
            items: chests.get(key)?.items || []
        });
    }
}

export function applyChestState(key, data) {
    if (!key || !data || !Array.isArray(data.items)) return;
    chests.set(key, { items: data.items.slice(0, 54) });
    if (openedChest?.key === key) {
        openedChest.chest = chests.get(key);
        openedChest.size = openedChest.chest.items.length > 27 ? 54 : 27;
        if (typeof window !== 'undefined' && typeof window.updateUI === 'function') {
            window.updateUI(false);
        }
    }
}


export function getActivePhysicsWorld(entity = null) {
    if (entity?.isMenuEntity || (typeof STATE !== 'undefined' && STATE === 'MENU')) {
        return (typeof menuWorld !== 'undefined' && menuWorld && menuWorld.blocks) ? menuWorld.blocks : null;
    }
    return (typeof world !== 'undefined' && world) ? world : ((typeof menuWorld !== 'undefined' && menuWorld && menuWorld.blocks) ? menuWorld.blocks : null);
}

export function getActivePhysicsTerrain(entity = null) {
    if (entity?.isMenuEntity || (typeof STATE !== 'undefined' && STATE === 'MENU')) {
        return (typeof menuWorld !== 'undefined' && menuWorld && (menuWorld.surfaceHeights || menuWorld.terrain)) ? (menuWorld.surfaceHeights || menuWorld.terrain) : null;
    }
    return (typeof surfaceHeights !== 'undefined' && surfaceHeights && surfaceHeights.length) ? surfaceHeights : ((typeof menuWorld !== 'undefined' && menuWorld && (menuWorld.surfaceHeights || menuWorld.terrain)) ? (menuWorld.surfaceHeights || menuWorld.terrain) : null);
}



export function isDoorBlock(block) {
    return [
        IDS.DOOR, IDS.DOOR_TOP, IDS.DOOR_OPEN, IDS.DOOR_OPEN_TOP,
        IDS.JUNGLE_DOOR, IDS.JUNGLE_DOOR_TOP, IDS.JUNGLE_DOOR_OPEN, IDS.JUNGLE_DOOR_OPEN_TOP
    ].includes(block);
}

export function isOpenDoorBlock(block) {
    return block === IDS.DOOR_OPEN || block === IDS.DOOR_OPEN_TOP ||
           block === IDS.JUNGLE_DOOR_OPEN || block === IDS.JUNGLE_DOOR_OPEN_TOP;
}

export function isJungleDoorBlock(block) {
    return block === IDS.JUNGLE_DOOR || block === IDS.JUNGLE_DOOR_TOP ||
           block === IDS.JUNGLE_DOOR_OPEN || block === IDS.JUNGLE_DOOR_OPEN_TOP;
}

export function getDoorBaseY(y, block) {
    return (block === IDS.DOOR_TOP || block === IDS.DOOR_OPEN_TOP ||
            block === IDS.JUNGLE_DOOR_TOP || block === IDS.JUNGLE_DOOR_OPEN_TOP) ? y + 1 : y;
}

export function breakDoorAt(activeWorld, gx, gy) {
    if (!activeWorld || !activeWorld[gx]) return;
    const block = activeWorld[gx][gy];
    if (!isDoorBlock(block)) return;
    const baseY = getDoorBaseY(gy, block);
    const topY = baseY - 1;
    const isJungle = isJungleDoorBlock(block);
    const dropId = isJungle ? IDS.JUNGLE_DOOR : IDS.DOOR;

    activeWorld[gx][baseY] = IDS.AIR;
    if (activeWorld[gx][topY] !== undefined) activeWorld[gx][topY] = IDS.AIR;
    if (typeof window !== 'undefined' && typeof window.syncBlock === 'function') {
        window.syncBlock(gx, baseY, IDS.AIR);
        if (activeWorld[gx][topY] !== undefined) window.syncBlock(gx, topY, IDS.AIR);
    }

    if (typeof window !== 'undefined' && typeof window.playSound === 'function') {
        window.playSound('door_break');
    }
    if (typeof window !== 'undefined' && typeof window.dropItemForWorld === 'function') {
        window.dropItemForWorld(dropId, gx * TILE_SIZE + 4, baseY * TILE_SIZE + 4, 1);
    }

    const PClass = (typeof window !== 'undefined' && window.Particle) ? window.Particle : null;
    if (PClass && particles) {
        for (let i = 0; i < 18; i++) {
            particles.push(new PClass(gx * TILE_SIZE + Math.random() * TILE_SIZE, baseY * TILE_SIZE + (Math.random() - 0.5) * TILE_SIZE * 2, '#8b5a2b'));
        }
    }
    const FTClass = (typeof window !== 'undefined' && window.FloatingText) ? window.FloatingText : null;
    if (FTClass && floatingTexts) {
        floatingTexts.push(new FTClass(gx * TILE_SIZE + 8, topY * TILE_SIZE - 6, "DOOR BREACHED!", "#ef4444"));
    }
}

export function getWorldSurfaceY(x) {
    const curWorld = world || (typeof window !== 'undefined' ? window.world : null);
    if (!curWorld || !Array.isArray(curWorld) || x < 0 || x >= WORLD_WIDTH) return WORLD_HEIGHT;
    const curHeights = (surfaceHeights && surfaceHeights.length === WORLD_WIDTH) ? surfaceHeights : (typeof window !== 'undefined' ? window.surfaceHeights : null);
    if (curHeights && curHeights.length === WORLD_WIDTH && Number.isFinite(curHeights[x])) {
        const recordedY = curHeights[x];
        const blockAtRecorded = curWorld[x]?.[recordedY];
        if (blockAtRecorded !== undefined && !isNonSurfaceBlock(blockAtRecorded)) {
            return recordedY;
        }
        for (let y = recordedY + 1; y < WORLD_HEIGHT; y++) {
            const block = curWorld[x]?.[y];
            if (block !== undefined && !isNonSurfaceBlock(block)) {
                curHeights[x] = y;
                return y;
            }
        }
        for (let y = recordedY - 1; y >= Math.max(0, recordedY - 12); y--) {
            const block = curWorld[x]?.[y];
            if (block !== undefined && !isNonSurfaceBlock(block)) {
                const belowBlock = curWorld[x]?.[y + 1];
                if (belowBlock !== undefined && !isNonSurfaceBlock(belowBlock)) {
                    curHeights[x] = y;
                    return y;
                }
            }
        }
        return recordedY;
    }
    const scanStartY = Math.max(15, Math.floor(WORLD_HEIGHT / 4));
    for (let y = scanStartY; y < WORLD_HEIGHT; y++) {
        const block = curWorld[x]?.[y];
        if (block !== undefined && !isNonSurfaceBlock(block)) {
            if (curHeights && curHeights.length === WORLD_WIDTH) {
                curHeights[x] = y;
            }
            return y;
        }
    }
    return WORLD_HEIGHT;
}

// Window self-registration for backward compatibility
try {
    if (typeof window !== 'undefined') {
        window.BLOCK_CRACK_STAGES = BLOCK_CRACK_STAGES;
        window.BLOCK_CRACK_SEGMENTS = BLOCK_CRACK_SEGMENTS;
        window.getSelectedMiningTier = getSelectedMiningTier;
        window.canHarvestBlock = canHarvestBlock;
        window.isWoodPartOfTree = isWoodPartOfTree;
        window.sanitizeTreeWoodCollision = sanitizeTreeWoodCollision;
        window.ensureTreeWoodNonCollidable = ensureTreeWoodNonCollidable;
        window.isClimbableBlock = isClimbableBlock;
        window.isSolidWorldBlock = isSolidWorldBlock;
        window.isNonSurfaceBlock = isNonSurfaceBlock;
        window.getFluidKey = getFluidKey;
        window.getChestKey = getChestKey;
        window.isChestPairedWithLeft = isChestPairedWithLeft;
    window.getChestGroup = getChestGroup;
    window.syncChest = syncChest;
    window.applyChestState = applyChestState;
        window.getActivePhysicsWorld = getActivePhysicsWorld;
        window.getActivePhysicsTerrain = getActivePhysicsTerrain;
        window.isWater = isWater;
        window.isLava = isLava;
        window.isDoorBlock = isDoorBlock;
        window.isOpenDoorBlock = isOpenDoorBlock;
        window.isJungleDoorBlock = isJungleDoorBlock;
        window.getDoorBaseY = getDoorBaseY;
        window.breakDoorAt = breakDoorAt;
        window.getWorldSurfaceY = getWorldSurfaceY;
    }
} catch (e) {}


export const isSolid = isSolidWorldBlock;
export function getCrackStage(progress) {
    if (progress <= 0) return -1;
    return Math.min(BLOCK_CRACK_STAGES.length - 1, Math.floor(progress * BLOCK_CRACK_STAGES.length));
}

export function isWater(x, y) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return false;
    return world[x]?.[y] === IDS.WATER;
}
export function isLava(x, y) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return false;
    return world[x]?.[y] === IDS.LAVA;
}
