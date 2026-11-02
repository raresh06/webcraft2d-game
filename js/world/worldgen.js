// =============================================================================
// WEBCRAFT 2D - PROCEDURAL WORLD GENERATION (js/world/worldgen.js)
// 6 biomes, mountain corner anchoring, 3-tier caves, ore strata, lakes & vegetation
// =============================================================================

import {
    IDS, TILE_SIZE, isFoliageOrAir
} from '../core/constants.js';

import {
    world, bgWorld, worldBiomes, surfaceHeights, nonCollidableTreeWood,
    WORLD_WIDTH, WORLD_HEIGHT, fluids, fluidWakeQueue, leafDecayQueue,
    treeDecayClusters, saplingGrowthQueue, cropGrowthQueue, dirtToGrassQueue,
    snowRegrowthQueue, fallingBlocks, activeProjectiles, chests, signs,
    setWorldDimensions, setEngineWorld, setEngineBgWorld, setEngineFluids,
    setEngineFluidTick, setEngineSaplingGrowthQueue, setEngineCropGrowthQueue,
    setEngineDirtToGrassQueue, setEngineSnowRegrowthQueue, setEngineFallingBlocks,
    setEngineActiveProjectiles, setEngineChests, setEngineOpenedChest, setEngineSigns,
    setEngineWorldBiomes, setEngineNonCollidableTreeWood, setEngineSurfaceHeights
} from '../core/state.js';

import {
    isSolidWorldBlock, getWorldSurfaceY, ensureTreeWoodNonCollidable, isWater
} from './blockhelper.js';

import {
    getFluid, setFluid, removeFluid, wakeAllFluids
} from './fluids.js';

export let mapSeed = Math.floor(Math.random() * 1000000);

export function setMapSeed(newSeed) {
    mapSeed = newSeed;
    if (typeof window !== 'undefined') window.mapSeed = newSeed;
}

export function seededRandom() {
    mapSeed = (mapSeed * 9301 + 49297) % 233280;
    return mapSeed / 233280;
}

export function getInitialSpawnPoint(customWorld) {
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    const targetWorld = (customWorld && customWorld.data) ? customWorld.data : (customWorld || curWorld);
    let centerCol = Math.floor(WORLD_WIDTH / 2);
    const chosenBiomePref = (typeof window !== 'undefined' && window.selectedStartingBiomeChoice) ? window.selectedStartingBiomeChoice : null;
    const curBiomes = (typeof worldBiomes !== 'undefined' && worldBiomes) ? worldBiomes : ((typeof window !== 'undefined' && window.worldBiomes) ? window.worldBiomes : null);
    if (chosenBiomePref && curBiomes) {
        let bStart = curBiomes.indexOf(chosenBiomePref);
        let bEnd = curBiomes.lastIndexOf(chosenBiomePref);
        if (bStart !== -1 && bEnd !== -1) {
            centerCol = Math.floor((bStart + bEnd) / 2);
        }
    }
    const nonSolid = new Set([
        IDS.AIR, IDS.TORCH, IDS.SAPLING, IDS.JUNGLE_SAPLING,
        IDS.DOOR_OPEN, IDS.DOOR_OPEN_TOP, IDS.JUNGLE_DOOR_OPEN, IDS.JUNGLE_DOOR_OPEN_TOP,
        IDS.WATER, IDS.LAVA, IDS.SHORT_GRASS, IDS.TALL_GRASS, IDS.FLOWER_RED, IDS.FLOWER_YELLOW,
        IDS.FERN, IDS.BAMBOO, IDS.VINES, IDS.LEAVES, IDS.JUNGLE_LEAVES
    ]);
    const hazard = new Set([IDS.LAVA, IDS.CACTUS]);

    for (let r = 0; r < Math.floor(WORLD_WIDTH / 2); r++) {
        const offsets = r === 0 ? [0] : [r, -r];
        for (let offset of offsets) {
            const sx = centerCol + offset;
            if (sx < 2 || sx >= WORLD_WIDTH - 2) continue;

            for (let sy = 2; sy < WORLD_HEIGHT - 2; sy++) {
                const blockBelow = targetWorld[sx]?.[sy];
                if (blockBelow !== undefined && !nonSolid.has(blockBelow) && !hazard.has(blockBelow)) {
                    const blockHead = targetWorld[sx]?.[sy - 2];
                    const blockTorso = targetWorld[sx]?.[sy - 1];
                    if (
                        blockHead !== undefined && nonSolid.has(blockHead) &&
                        blockTorso !== undefined && nonSolid.has(blockTorso) &&
                        !getFluid(sx, sy) && !getFluid(sx, sy - 1) && !getFluid(sx, sy - 2)
                    ) {
                        return {
                            x: customWorld ? sx : (sx * TILE_SIZE + (TILE_SIZE - (TILE_SIZE * 0.75)) / 2),
                            y: customWorld ? (sy - 2) : (sy * TILE_SIZE - (TILE_SIZE * 1.8)),
                            gridX: sx,
                            gridY: sy - 2
                        };
                    }
                }
            }
        }
    }

    let fallbackX = Math.floor(WORLD_WIDTH / 2);
    let fallbackY = 0;
    while (fallbackY < WORLD_HEIGHT && targetWorld[fallbackX]?.[fallbackY] === IDS.AIR) fallbackY++;
    return {
        x: customWorld ? fallbackX : (fallbackX * TILE_SIZE + (TILE_SIZE - (TILE_SIZE * 0.75)) / 2),
        y: customWorld ? Math.max(0, fallbackY - 2) : Math.max(0, fallbackY * TILE_SIZE - (TILE_SIZE * 1.8)),
        gridX: fallbackX,
        gridY: Math.max(0, fallbackY - 2)
    };
}

export function buildTree(tx, sy, treeType = 'oak') {
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    if (!curWorld) return;
    const curNonCollidable = (typeof nonCollidableTreeWood !== 'undefined' && nonCollidableTreeWood) ? nonCollidableTreeWood : (typeof window !== 'undefined' ? window.nonCollidableTreeWood : null);

    const setTrunk = (bx, by) => {
        if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) return;
        if (isWater(bx, by) || getFluid(bx, by)) return;
        curWorld[bx][by] = IDS.WOOD;
        if (curNonCollidable) curNonCollidable.add(`${bx}_${by}`);
    };
    const setLeaf = (bx, by) => {
        if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) return;
        if (isWater(bx, by) || getFluid(bx, by)) return;
        if (curWorld[bx][by] === IDS.AIR) curWorld[bx][by] = IDS.LEAVES;
    };

    if (treeType === 'bush' || treeType === 'snow_bush') {
        setTrunk(tx, sy - 1);
        for (let lx = -1; lx <= 1; lx++) {
            for (let ly = -2; ly <= -1; ly++) {
                setLeaf(tx + lx, sy + ly);
            }
        }
        setLeaf(tx, sy - 3);
    }
    else if (treeType === 'pine' || treeType === 'tall_pine') {
        const th = treeType === 'tall_pine' ? (Math.floor(seededRandom() * 3) + 7) : (Math.floor(seededRandom() * 3) + 5);
        for (let i = 1; i <= th; i++) setTrunk(tx, sy - i);
        
        const top = sy - th;
        setLeaf(tx, top - 1);
        for (let layer = 0; layer <= th - 2; layer++) {
            const layerY = top + layer;
            let rad;
            if (layer === 0 || layer === 1) rad = 1;
            else if (layer % 2 === 0) rad = 2;
            else rad = 3;
            
            if (layerY > sy - 2) continue;

            for (let lx = -rad; lx <= rad; lx++) {
                if (Math.abs(lx) === rad && layer % 2 === 1 && Math.abs(lx) === 3 && seededRandom() < 0.25) continue;
                setLeaf(tx + lx, layerY);
            }
        }
    }
    else if (treeType === 'tall_oak' || treeType === 'fancy') {
        const th = Math.floor(seededRandom() * 4) + 7;
        for (let i = 1; i <= th; i++) setTrunk(tx, sy - i);

        const branchY = sy - Math.floor(th * 0.65);
        const branchDir = seededRandom() > 0.5 ? 1 : -1;
        setTrunk(tx + branchDir, branchY);

        const top = sy - th;
        for (let lx = -2; lx <= 2; lx++) {
            for (let ly = -2; ly <= -1; ly++) {
                if (Math.abs(lx) + Math.abs(ly + 1) <= 2) setLeaf(tx + lx, top + ly);
            }
        }
        for (let lx = -3; lx <= 3; lx++) {
            for (let ly = 0; ly <= 2; ly++) {
                if (Math.abs(lx) + Math.abs(ly - 1) <= 3) setLeaf(tx + lx, top + ly);
            }
        }
        for (let lx = -2; lx <= 2; lx++) {
            setLeaf(tx + lx, top + 3);
        }
    }
    else {
        // Classic full-canopy Minecraft oak tree
        const th = Math.floor(seededRandom() * 3) + 4;
        for (let i = 1; i <= th; i++) setTrunk(tx, sy - i);
        const top = sy - th;

        // Base canopy layer (width 5, height 2)
        for (let lx = -2; lx <= 2; lx++) {
            for (let ly = -1; ly <= 1; ly++) {
                if (Math.abs(lx) === 2 && Math.abs(ly) === 1 && seededRandom() < 0.35) continue;
                setLeaf(tx + lx, top + ly);
            }
        }
        // Upper dome layer (width 3, height 2)
        for (let lx = -1; lx <= 1; lx++) {
            for (let ly = -3; ly <= -2; ly++) {
                if (Math.abs(lx) === 1 && ly === -3 && seededRandom() < 0.45) continue;
                setLeaf(tx + lx, top + ly);
            }
        }
        // Peak crown top leaf
        setLeaf(tx, top - 4);
    }
}

export function buildJungleTree(tx, sy, treeType = 'giant') {
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    if (!curWorld) return;
    const curNonCollidable = (typeof nonCollidableTreeWood !== 'undefined' && nonCollidableTreeWood) ? nonCollidableTreeWood : (typeof window !== 'undefined' ? window.nonCollidableTreeWood : null);
    const doSync = (typeof window !== 'undefined' && typeof window.syncBlock === 'function') ? window.syncBlock : null;

    const setTrunk = (bx, by) => {
        if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) return;
        if (typeof isWater === 'function' && isWater(bx, by)) return;
        if (typeof getFluid === 'function' && getFluid(bx, by)) return;
        curWorld[bx][by] = IDS.JUNGLE_WOOD;
        if (curNonCollidable) curNonCollidable.add(`${bx}_${by}`);
        if (doSync) doSync(bx, by, IDS.JUNGLE_WOOD, { treeTrunk: true });
    };
    const setLeaf = (bx, by) => {
        if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) return;
        if (typeof isWater === 'function' && isWater(bx, by)) return;
        if (typeof getFluid === 'function' && getFluid(bx, by)) return;
        const cur = curWorld[bx][by];
        if (cur === IDS.AIR || isFoliageOrAir(cur)) {
            curWorld[bx][by] = IDS.JUNGLE_LEAVES;
            if (doSync) doSync(bx, by, IDS.JUNGLE_LEAVES);
        }
    };
    const setVine = (bx, by) => {
        if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) return;
        if (typeof isWater === 'function' && isWater(bx, by)) return;
        if (typeof getFluid === 'function' && getFluid(bx, by)) return;
        if (curWorld[bx][by] === IDS.AIR) {
            curWorld[bx][by] = IDS.VINES;
            if (doSync) doSync(bx, by, IDS.VINES);
        }
    };

    const rnd = () => (typeof seededRandom === 'function' ? seededRandom() : Math.random());

    if (treeType === 'jungle_bush') {
        setTrunk(tx, sy - 1);
        for (let lx = -1; lx <= 1; lx++) {
            for (let ly = -2; ly <= -1; ly++) {
                setLeaf(tx + lx, sy + ly);
            }
        }
        setLeaf(tx, sy - 3);
        return;
    }

    // Giant Jungle Tree: 12 to 20 blocks high
    const th = Math.floor(rnd() * 9) + 12;
    const is2x2 = rnd() < 0.65;
    const trunkWidth = is2x2 ? 2 : 1;

    // Grow main trunk
    for (let i = 1; i <= th; i++) {
        for (let tw = 0; tw < trunkWidth; tw++) {
            setTrunk(tx + tw, sy - i);
        }
    }

    // Spreading branch arms midway up
    const branchY1 = sy - Math.floor(th * 0.55);
    setTrunk(tx - 1, branchY1);
    setLeaf(tx - 2, branchY1);
    setLeaf(tx - 2, branchY1 - 1);
    setLeaf(tx - 1, branchY1 - 1);

    const branchY2 = sy - Math.floor(th * 0.75);
    setTrunk(tx + trunkWidth, branchY2);
    setLeaf(tx + trunkWidth + 1, branchY2);
    setLeaf(tx + trunkWidth + 1, branchY2 - 1);
    setLeaf(tx + trunkWidth, branchY2 - 1);

    // Broad canopy at top (radius 4 to 6)
    const top = sy - th;
    const canopyRadius = is2x2 ? 5 : 4;
    for (let ly = -4; ly <= 2; ly++) {
        const layerY = top + ly;
        const r = canopyRadius - Math.abs(ly + 1);
        for (let lx = -r; lx <= r + (is2x2 ? 1 : 0); lx++) {
            if (Math.abs(lx) === r && Math.abs(ly + 1) >= 2 && rnd() < 0.4) continue;
            setLeaf(tx + lx, layerY);
        }
    }

    // Hanging Vines on trunk sides and under canopy
    for (let side of [-1, trunkWidth]) {
        const vineX = tx + side;
        const startVineY = top + 2;
        const vineLen = Math.floor(rnd() * 6) + 3;
        for (let v = 0; v < vineLen; v++) {
            const vy = startVineY + v;
            if (vy < sy - 1) {
                setVine(vineX, vy);
            }
        }
    }
    // Hanging vines under outer canopy edges
    for (let offset of [-canopyRadius + 1, canopyRadius + (is2x2 ? 0 : -1)]) {
        const vineX = tx + offset;
        const startVineY = top + 3;
        const vineLen = Math.floor(rnd() * 5) + 2;
        for (let v = 0; v < vineLen; v++) {
            const vy = startVineY + v;
            if (vy < sy - 1) {
                setVine(vineX, vy);
            }
        }
    }
    ensureTreeWoodNonCollidable();
}

export function generateWorld(seedOverride, sizeOverride) {
    if (sizeOverride) setWorldDimensions(sizeOverride);
    if (seedOverride !== undefined) {
        setMapSeed(seedOverride);
    } else {
        setMapSeed(Math.floor(Math.random() * 1000000));
    }
    
    setEngineWorld(Array.from({ length: WORLD_WIDTH }, () => Array(WORLD_HEIGHT).fill(IDS.AIR)));
    setEngineBgWorld(Array.from({ length: WORLD_WIDTH }, () => Array(WORLD_HEIGHT).fill(IDS.AIR)));
    if (typeof window !== 'undefined' && typeof window.toggleBackgroundBuildMode === 'function') {
        window.toggleBackgroundBuildMode(false);
    }
    setEngineFluids(new Map());
    setEngineFluidTick(0);
    if (fluidWakeQueue && typeof fluidWakeQueue.clear === 'function') fluidWakeQueue.clear();
    if (leafDecayQueue && typeof leafDecayQueue.clear === 'function') leafDecayQueue.clear();
    if (treeDecayClusters && typeof treeDecayClusters.clear === 'function') treeDecayClusters.clear();
    setEngineSaplingGrowthQueue(new Map());
    setEngineCropGrowthQueue(new Map());
    setEngineDirtToGrassQueue(new Map());
    setEngineSnowRegrowthQueue(new Map());
    setEngineFallingBlocks([]);
    setEngineActiveProjectiles([]);
    setEngineChests(new Map());
    setEngineOpenedChest(null);
    setEngineSigns(new Map());
    
    const baseHeight = Math.floor(WORLD_HEIGHT / 2);
    const worldSeed = seededRandom() * 10000;
    const tempSeed = seededRandom() * 10000;
    const humidSeed = seededRandom() * 10000;
    const mountainSeed = seededRandom() * 10000;
    setEngineWorldBiomes(new Array(WORLD_WIDTH));
    const biomes = worldBiomes;
    const rawSurfaceHeights = new Array(WORLD_WIDTH);
    setEngineNonCollidableTreeWood(new Set());
    let lastTreeX = -10;

    // Guaranteed Biome Distribution & Mountain Corner Rule:
    const mountainSide = (Math.floor(worldSeed) % 2 === 0) ? 'left' : 'right';

    let activeBiomeList;
    if (mountainSide === 'left') {
        activeBiomeList = (Math.floor(worldSeed * 0.5) % 2 === 0)
            ? ['mountains', 'snow', 'forest', 'plains', 'village', 'jungle', 'desert']
            : ['mountains', 'snow', 'village', 'plains', 'forest', 'jungle', 'desert'];
    } else {
        activeBiomeList = (Math.floor(worldSeed * 0.5) % 2 === 0)
            ? ['desert', 'jungle', 'village', 'plains', 'forest', 'snow', 'mountains']
            : ['desert', 'jungle', 'forest', 'plains', 'village', 'snow', 'mountains'];
    }
    const numBiomes = activeBiomeList.length;

    for (let x = 0; x < WORLD_WIDTH; x++) {
        let warp = Math.sin(x * 0.012 + worldSeed * 0.4) * 35 +
                   Math.cos(x * 0.028 + tempSeed * 0.6) * 18 +
                   Math.sin(x * 0.065 + humidSeed * 0.8) * 10;

        let distFromCorner = Math.min(x, WORLD_WIDTH - 1 - x);
        let cornerDampen = Math.min(1.0, distFromCorner / 45);
        let warpedX = Math.max(0, Math.min(WORLD_WIDTH - 1, x + warp * cornerDampen));

        let sectorFraction = (warpedX / WORLD_WIDTH) * numBiomes;
        let sectorIndex = Math.max(0, Math.min(numBiomes - 1, Math.floor(sectorFraction)));
        let sectorProgress = sectorFraction - sectorIndex;
        let biome = activeBiomeList[sectorIndex];
        biomes[x] = biome;

        let wx = x + worldSeed;
        let continental = Math.sin(wx * 0.004) * 28 + Math.cos(wx * 0.01 + worldSeed * 0.3) * 18;
        let hills = Math.sin(wx * 0.02 + worldSeed * 0.5) * 10 + Math.sin(wx * 0.045) * 5;
        let detail = Math.sin(wx * 0.1 + worldSeed * 0.8) * 2 + Math.cos(wx * 0.18) * 0.9;

        let surfaceY = baseHeight + continental + hills + detail;

        if (biome === "mountains") {
            let progressFromCorner = (mountainSide === 'left')
                ? Math.max(0, Math.min(1.0, sectorProgress))
                : Math.max(0, Math.min(1.0, 1.0 - sectorProgress));

            let mountainEnvelope = Math.sin((1.0 - progressFromCorner) * Math.PI * 0.5);
            let heightScale = WORLD_HEIGHT / 320;
            let mountainSpikes = Math.abs(Math.sin(wx * 0.028 + worldSeed * 0.4) * 65 + Math.sin(wx * 0.065 + worldSeed * 0.6) * 25 + Math.sin(wx * 0.12) * 10);
            surfaceY -= (32 + mountainSpikes) * mountainEnvelope * heightScale;
        } else if (biome === "desert") {
            let dunes = Math.sin(wx * 0.02 + worldSeed * 0.7) * 9 + Math.abs(Math.sin(wx * 0.045)) * 5;
            surfaceY = baseHeight + (continental * 0.35) + dunes + detail;
        } else if (biome === "jungle") {
            let jungleHills = Math.sin(wx * 0.028 + worldSeed * 0.2) * 12 + Math.cos(wx * 0.055) * 6;
            surfaceY += jungleHills;
        } else if (biome === "forest") {
            surfaceY += Math.sin(wx * 0.035) * 7 - 2;
        } else if (biome === "snow") {
            surfaceY += Math.sin(wx * 0.038) * 8 + 2;
        } else if (biome === "plains" || biome === "village") {
            surfaceY += Math.sin(wx * 0.025) * 5;
        }

        rawSurfaceHeights[x] = surfaceY;
    }

    setEngineSurfaceHeights(rawSurfaceHeights.map((height, x) => {
        let weightedHeight = 0;
        let totalWeight = 0;
        for (let offset = -3; offset <= 3; offset++) {
            let neighborX = Math.max(0, Math.min(WORLD_WIDTH - 1, x + offset));
            let weight = 4 - Math.abs(offset);
            weightedHeight += rawSurfaceHeights[neighborX] * weight;
            totalWeight += weight;
        }
        return Math.max(35, Math.min(WORLD_HEIGHT - 35, Math.floor(weightedHeight / totalWeight)));
    }));

    const curWorld = world;
    for (let x = 0; x < WORLD_WIDTH; x++) {
        let biome = biomes[x];
        let surfaceY = surfaceHeights[x];

        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (y < surfaceY) {
                curWorld[x][y] = IDS.AIR;
            }
            else if (y === surfaceY) {
                if (biome === "desert") curWorld[x][y] = IDS.SAND;
                else if (biome === "snow") curWorld[x][y] = IDS.SNOW;
                else if (biome === "mountains" && y < baseHeight - 45) curWorld[x][y] = IDS.SNOW;
                else if (biome === "mountains" && y >= baseHeight - 30) curWorld[x][y] = IDS.GRASS;
                else if (biome === "mountains") curWorld[x][y] = IDS.STONE;
                else curWorld[x][y] = IDS.GRASS;
            }
            else if (y > surfaceY && y < surfaceY + seededRandom() * 3 + 3) {
                if (biome === "desert") curWorld[x][y] = IDS.SAND;
                else if (biome === "snow" || biome === "plains" || biome === "village" || biome === "forest" || biome === "jungle" || (biome === "mountains" && surfaceY >= baseHeight - 30)) curWorld[x][y] = IDS.DIRT;
                else curWorld[x][y] = IDS.STONE;
            }
            else {
                curWorld[x][y] = IDS.STONE;

                let minCaveY = surfaceY + 6;
                if (biome === "mountains") minCaveY = Math.max(surfaceY + 28, baseHeight - 6);
                let isCave = false;

                if (y > minCaveY && y < WORLD_HEIGHT - 2) {
                    let cx = x + worldSeed;
                    let cy = y + worldSeed;

                    let spag1 = Math.sin(cx * 0.045 + Math.cos(cy * 0.04 + worldSeed * 0.7) * 1.8);
                    let spag2 = Math.cos(cy * 0.045 + Math.sin(cx * 0.04 + worldSeed * 0.3) * 1.8);
                    let spagDist = spag1 * spag1 + spag2 * spag2;
                    let isSpaghetti = spagDist < 0.18;

                    let cavernNoise = (Math.sin(cx * 0.024 + worldSeed * 0.2) * Math.cos(cy * 0.024 + worldSeed * 0.5) + 
                                       Math.sin(cx * 0.048 + cy * 0.048 + worldSeed * 0.8) * 0.45);
                    let cavernThresh = 0.76 - (Math.max(0, y - baseHeight) / (WORLD_HEIGHT - baseHeight)) * 0.14;
                    let isCavern = cavernNoise > cavernThresh;

                    let noodle = Math.abs(Math.sin(cx * 0.07 + Math.sin(cy * 0.06) * 1.7 + worldSeed * 0.4) + 
                                         Math.cos(cy * 0.07 + Math.cos(cx * 0.06) * 1.7 + worldSeed * 0.9));
                    let isNoodle = noodle < 0.085;

                    if (isCavern || isSpaghetti || isNoodle) {
                        isCave = true;
                    }
                }

                if (isCave) {
                    curWorld[x][y] = IDS.AIR;
                } else {
                    const undergroundDepth = WORLD_HEIGHT - baseHeight;
                    const goldMinY = baseHeight + Math.floor(undergroundDepth * 0.52);
                    const diamondMinY = baseHeight + Math.floor(undergroundDepth * 0.80);
                    const emeraldMinY = baseHeight + Math.floor(undergroundDepth * 0.65);

                    let oreRoll = seededRandom();
                    if (oreRoll < 0.035) {
                        curWorld[x][y] = IDS.COAL_ORE;
                    } else if (oreRoll < 0.065) {
                        curWorld[x][y] = IDS.IRON_ORE;
                    } else if (oreRoll < 0.080) {
                        if (y >= goldMinY) {
                            curWorld[x][y] = IDS.GOLD_ORE;
                        }
                    } else if (oreRoll < 0.084) {
                        if (y >= diamondMinY) {
                            curWorld[x][y] = IDS.DIAMOND_ORE;
                        }
                    } else if (oreRoll < 0.089) {
                        if (biome === "mountains" || y >= emeraldMinY) {
                            curWorld[x][y] = IDS.EMERALD_ORE;
                        }
                    }
                }
            }
        }
    }

    // Surface Water Bodies
    const placedWaterBodies = [];

    const generateSurfaceWaterBody = (centerX, width, depth, biome) => {
        const halfW = Math.floor(width / 2);
        const startX = Math.max(6, centerX - halfW);
        const endX = Math.min(WORLD_WIDTH - 7, startX + width - 1);
        if (endX <= startX + 2) return false;

        for (let i = 0; i < placedWaterBodies.length; i++) {
            const b = placedWaterBodies[i];
            if (startX <= b.endX + 16 && endX >= b.startX - 16) {
                return false;
            }
        }

        let minSurf = 999;
        let maxSurf = -999;
        for (let cx = startX - 2; cx <= endX + 2; cx++) {
            const sy = surfaceHeights[cx];
            if (sy !== undefined) {
                if (sy < minSurf) minSurf = sy;
                if (sy > maxSurf) maxSurf = sy;
            }
        }
        if (minSurf === 999 || maxSurf === -999) return false;
        if (maxSurf - minSurf > 5) return false;

        const yLeftRim = surfaceHeights[startX - 1] ?? maxSurf;
        const yRightRim = surfaceHeights[endX + 1] ?? maxSurf;
        const waterline = Math.max(yLeftRim, yRightRim);

        let placed = 0;

        for (let x = startX; x <= endX; x++) {
            const progress = (x - startX + 0.5) / (endX - startX + 1);
            const bowlFactor = Math.sin(progress * Math.PI);
            const bowlDepth = Math.max(1, Math.round(depth * bowlFactor));
            const bedY = waterline + bowlDepth;

            for (let y = 0; y < waterline; y++) {
                if (curWorld[x][y] !== IDS.AIR) {
                    curWorld[x][y] = IDS.AIR;
                }
                removeFluid(x, y);
            }

            for (let y = waterline; y < bedY; y++) {
                curWorld[x][y] = IDS.AIR;
                setFluid(x, y, { type: IDS.WATER, level: 0, source: true, falling: false });
                placed++;
            }

            let bedBlock = (biome === 'desert') ? IDS.SAND : IDS.DIRT;
            curWorld[x][bedY] = bedBlock;
            removeFluid(x, bedY);

            const maxBedSealY = Math.min(WORLD_HEIGHT - 2, bedY + 4);
            for (let by = bedY + 1; by <= maxBedSealY; by++) {
                removeFluid(x, by);
                if (by <= bedY + 2) {
                    curWorld[x][by] = (biome === 'desert') ? IDS.SAND : IDS.DIRT;
                } else {
                    curWorld[x][by] = IDS.STONE;
                }
            }

            surfaceHeights[x] = waterline;
        }

        const sealBank = (bx) => {
            if (bx < 0 || bx >= WORLD_WIDTH) return;
            const rimBlock = (biome === 'desert') ? IDS.SAND : (biome === 'snow' ? IDS.SNOW : IDS.GRASS);
            const subBlock = (biome === 'desert') ? IDS.SAND : IDS.DIRT;
            
            for (let y = 0; y < waterline - 1; y++) {
                if (curWorld[bx][y] === IDS.WATER) curWorld[bx][y] = IDS.AIR;
                removeFluid(bx, y);
            }
            curWorld[bx][waterline - 1] = rimBlock;
            surfaceHeights[bx] = Math.min(surfaceHeights[bx] || waterline, waterline - 1);
            
            const maxBankSealY = Math.min(WORLD_HEIGHT - 2, waterline + depth + 3);
            for (let by = waterline; by <= maxBankSealY; by++) {
                removeFluid(bx, by);
                if (by <= waterline + depth + 2) {
                    curWorld[bx][by] = subBlock;
                } else {
                    curWorld[bx][by] = IDS.STONE;
                }
            }
        };

        sealBank(startX - 2);
        sealBank(startX - 1);
        sealBank(endX + 1);
        sealBank(endX + 2);

        for (let vx = startX; vx <= endX; vx++) {
            const progress = (vx - startX + 0.5) / (endX - startX + 1);
            const bowlFactor = Math.sin(progress * Math.PI);
            const bowlDepth = Math.max(1, Math.round(depth * bowlFactor));
            const colBedY = waterline + bowlDepth;

            for (let vy = waterline; vy < colBedY; vy++) {
                curWorld[vx][vy] = IDS.AIR;
                if (!getFluid(vx, vy)) {
                    setFluid(vx, vy, { type: IDS.WATER, level: 0, source: true, falling: false });
                }
            }

            if (!isSolidWorldBlock(vx, colBedY, curWorld[vx]?.[colBedY])) {
                curWorld[vx][colBedY] = (biome === 'desert') ? IDS.SAND : IDS.DIRT;
                removeFluid(vx, colBedY);
            }

            for (let vy = waterline; vy <= waterline + depth + 4; vy++) {
                if (vy < WORLD_HEIGHT) {
                    const fl = getFluid(vx, vy);
                    if (fl && fl.type === IDS.WATER) {
                        const belowB = curWorld[vx]?.[vy + 1];
                        const belowFl = getFluid(vx, vy + 1);
                        if ((belowB === IDS.AIR || belowB === undefined || belowB === null) && !belowFl) {
                            curWorld[vx][vy + 1] = (biome === 'desert') ? IDS.SAND : IDS.DIRT;
                        }
                    }
                }
            }
        }

        placedWaterBodies.push({ startX, endX, centerX, waterline, width });

        if (biome === 'desert') {
            for (let ox of [startX - 2, startX - 1, endX + 1, endX + 2]) {
                if (ox >= 0 && ox < WORLD_WIDTH) {
                    const sy = surfaceHeights[ox];
                    if (sy && curWorld[ox][sy] === IDS.SAND) {
                        curWorld[ox][sy] = IDS.GRASS;
                        if (curWorld[ox][sy - 1] === IDS.AIR && seededRandom() < 0.65) {
                            curWorld[ox][sy - 1] = seededRandom() < 0.5 ? IDS.BAMBOO : IDS.SHORT_GRASS;
                        }
                    }
                }
            }
        } else if (biome === 'plains' || biome === 'forest' || biome === 'jungle') {
            for (let ox of [startX - 1, endX + 1]) {
                if (ox >= 0 && ox < WORLD_WIDTH) {
                    const sy = surfaceHeights[ox];
                    if (sy && curWorld[ox][sy - 1] === IDS.AIR && seededRandom() < 0.55) {
                        curWorld[ox][sy - 1] = (biome === 'jungle' || seededRandom() < 0.45) ? IDS.BAMBOO : IDS.TALL_GRASS;
                    }
                }
            }
        }

        return placed > 0;
    };

    const spawnCenter = Math.floor(WORLD_WIDTH / 2);
    let spawnLakePlaced = false;
    for (let offset of [18, -18, 26, -26, 34, -34]) {
        const testX = spawnCenter + offset;
        if (testX >= 10 && testX < WORLD_WIDTH - 10 && biomes[testX] !== 'mountains') {
            const sBiome = biomes[testX];
            if (generateSurfaceWaterBody(testX, 8, 2, sBiome)) {
                spawnLakePlaced = true;
                break;
            }
        }
    }

    let placedLakeCount = spawnLakePlaced ? 1 : 0;

    for (let x = 32; x < WORLD_WIDTH - 32; x += 16) {
        const biome = biomes[x];
        if (biome === 'mountains') continue;

        let minSpacing = 70;
        let lakeWidth = 6 + Math.floor(seededRandom() * 6);
        let lakeDepth = 2 + Math.floor(seededRandom() * 2);
        let chance = 0.35;

        if (biome === 'jungle') {
            minSpacing = 60;
            lakeWidth = 6 + Math.floor(seededRandom() * 6);
            lakeDepth = 2 + Math.floor(seededRandom() * 3);
            chance = 0.40;
        } else if (biome === 'forest') {
            minSpacing = 65;
            lakeWidth = 6 + Math.floor(seededRandom() * 5);
            lakeDepth = 2 + Math.floor(seededRandom() * 2);
            chance = 0.35;
        } else if (biome === 'plains') {
            minSpacing = 70;
            lakeWidth = 7 + Math.floor(seededRandom() * 6);
            lakeDepth = 2 + Math.floor(seededRandom() * 2);
            chance = 0.35;
        } else if (biome === 'desert') {
            minSpacing = 90;
            lakeWidth = 5 + Math.floor(seededRandom() * 4);
            lakeDepth = 2;
            chance = 0.28;
        } else if (biome === 'snow') {
            minSpacing = 80;
            lakeWidth = 5 + Math.floor(seededRandom() * 5);
            lakeDepth = 2;
            chance = 0.28;
        }

        let tooClose = false;
        for (let i = 0; i < placedWaterBodies.length; i++) {
            if (Math.abs(x - placedWaterBodies[i].centerX) < minSpacing) {
                tooClose = true;
                break;
            }
        }
        if (tooClose) continue;

        if (seededRandom() < chance) {
            if (generateSurfaceWaterBody(x, lakeWidth, lakeDepth, biome)) {
                placedLakeCount++;
            }
        }
    }

    if (placedLakeCount < 4) {
        for (let x = 24; x < WORLD_WIDTH - 24; x += 20) {
            if (placedLakeCount >= 6) break;
            if (biomes[x] === 'mountains') continue;
            let tooClose = false;
            for (let i = 0; i < placedWaterBodies.length; i++) {
                if (Math.abs(x - placedWaterBodies[i].centerX) < 50) {
                    tooClose = true;
                    break;
                }
            }
            if (tooClose) continue;
            if (generateSurfaceWaterBody(x, 6, 2, biomes[x])) {
                placedLakeCount++;
            }
        }
    }

    // Mountain waterfall springs
    let lastSpringX = -999;
    for (let x = 20; x < WORLD_WIDTH - 20; x += 12) {
        if (biomes[x] === 'mountains' && (x - lastSpringX >= 55) && seededRandom() < 0.25) {
            const peakY = surfaceHeights[x];
            if (peakY > 12 && peakY < WORLD_HEIGHT - 25) {
                const leftSlopeY = surfaceHeights[x - 1] ?? peakY;
                const rightSlopeY = surfaceHeights[x + 1] ?? peakY;
                const flowRight = rightSlopeY >= leftSlopeY;
                curWorld[x][peakY + 1] = IDS.STONE;
                curWorld[x][peakY] = IDS.AIR;
                if (flowRight) {
                    curWorld[x - 1][peakY] = IDS.STONE;
                    curWorld[x + 1][peakY] = IDS.AIR;
                } else {
                    curWorld[x + 1][peakY] = IDS.STONE;
                    curWorld[x - 1][peakY] = IDS.AIR;
                }
                setFluid(x, peakY, { type: IDS.WATER, level: 0, source: true, falling: false });
                lastSpringX = x;
            }
        }
    }

    // Subterranean Water Aquifers
    let lastAquiferX = -999;
    for (let x = 16; x < WORLD_WIDTH - 16; x += 16) {
        if (x - lastAquiferX < 45) continue;
        const surfaceY = surfaceHeights[x];
        for (let y = surfaceY + 18; y < WORLD_HEIGHT - 45; y += 3) {
            if (curWorld[x][y] === IDS.AIR && isSolidWorldBlock(x, y + 1, curWorld[x][y + 1])) {
                if (seededRandom() < 0.20) {
                    const aquiferW = 4 + Math.floor(seededRandom() * 6);
                    const startAx = Math.max(4, x - Math.floor(aquiferW / 2));
                    const endAx = Math.min(WORLD_WIDTH - 5, startAx + aquiferW);
                    for (let ax = startAx; ax <= endAx; ax++) {
                        if (curWorld[ax][y] === IDS.AIR && isSolidWorldBlock(ax, y + 1, curWorld[ax][y + 1])) {
                            setFluid(ax, y, { type: IDS.WATER, level: 0, source: true, falling: false });
                        }
                    }
                    lastAquiferX = endAx;
                    break;
                }
            }
        }
    }

    // Deep Mantle Magma Chambers
    let lastMagmaX = -999;
    for (let x = 16; x < WORLD_WIDTH - 16; x += 16) {
        if (x - lastMagmaX < 45) continue;
        const surfaceY = surfaceHeights[x];
        for (let y = WORLD_HEIGHT - 8; y > Math.max(surfaceY + 30, WORLD_HEIGHT - 45); y -= 3) {
            if (curWorld[x][y] === IDS.AIR && isSolidWorldBlock(x, y + 1, curWorld[x][y + 1])) {
                if (seededRandom() < 0.22) {
                    const poolW = 4 + Math.floor(seededRandom() * 6);
                    const startLx = Math.max(4, x - Math.floor(poolW / 2));
                    const endLx = Math.min(WORLD_WIDTH - 5, startLx + poolW);
                    for (let lx = startLx; lx <= endLx; lx++) {
                        if (curWorld[lx][y] === IDS.AIR && isSolidWorldBlock(lx, y + 1, curWorld[lx][y + 1])) {
                            setFluid(lx, y, { type: IDS.LAVA, level: 0, source: true, falling: false });
                            if (seededRandom() < 0.55 && y + 1 < WORLD_HEIGHT) {
                                curWorld[lx][y + 1] = IDS.OBSIDIAN;
                            }
                        }
                    }
                    lastMagmaX = endLx;
                    break;
                }
            }
        }
    }

    // Deep Mantle Lava Sea
    for (let x = 4; x < WORLD_WIDTH - 4; x++) {
        for (let y = WORLD_HEIGHT - 14; y < WORLD_HEIGHT - 3; y++) {
            if (curWorld[x][y] === IDS.AIR) {
                setFluid(x, y, { type: IDS.LAVA, level: 0, source: true, falling: false });
                if (y + 1 < WORLD_HEIGHT && isSolidWorldBlock(x, y + 1, curWorld[x][y + 1]) && seededRandom() < 0.40) {
                    curWorld[x][y + 1] = IDS.OBSIDIAN;
                }
            }
        }
    }

    // Cavern Ceiling Lava Springs
    let lastCeilingLavaX = -999;
    for (let x = 24; x < WORLD_WIDTH - 24; x += 18) {
        if (x - lastCeilingLavaX < 60) continue;
        for (let y = WORLD_HEIGHT - 48; y < WORLD_HEIGHT - 22; y++) {
            if (curWorld[x][y] === IDS.AIR && isSolidWorldBlock(x, y - 1, curWorld[x][y - 1]) && curWorld[x][y + 1] === IDS.AIR && curWorld[x][y + 2] === IDS.AIR) {
                if (seededRandom() < 0.18) {
                    setFluid(x, y, { type: IDS.LAVA, level: 0, source: true, falling: false });
                    lastCeilingLavaX = x;
                    break;
                }
            }
        }
    }

    // Trees and Vegetation
    const isNearWater = (checkX) => {
        for (let ox = -3; ox <= 3; ox++) {
            let tx = checkX + ox;
            if (tx < 0 || tx >= WORLD_WIDTH) continue;
            let sy = surfaceHeights[tx];
            for (let ty = sy - 4; ty <= sy + 8; ty++) {
                if (ty >= 0 && ty < WORLD_HEIGHT) {
                    if (isWater(tx, ty) || getFluid(tx, ty)) return true;
                }
            }
        }
        return false;
    };

    lastTreeX = -999;
    for (let x = 3; x < WORLD_WIDTH - 3; x++) {
        let biome = biomes[x];
        let surfaceY = surfaceHeights[x];
        let topBlock = curWorld[x][surfaceY];
        if (isNearWater(x)) continue;

        if (biome === "jungle" && topBlock === IDS.GRASS && x - lastTreeX >= 3 && seededRandom() < 0.65) {
            let roll = seededRandom();
            let treeType = roll < 0.80 ? 'giant' : 'jungle_bush';
            buildJungleTree(x, surfaceY, treeType);
            lastTreeX = x + (treeType === 'giant' ? 3 : 1);
        } else if (biome === "forest" && topBlock === IDS.GRASS && x - lastTreeX >= 4 && seededRandom() < 0.55) {
            let roll = seededRandom();
            let treeType = roll < 0.40 ? 'oak' : (roll < 0.70 ? 'tall_oak' : (roll < 0.88 ? 'fancy' : 'bush'));
            buildTree(x, surfaceY, treeType);
            lastTreeX = x + 1;
        } else if (biome === "plains" && topBlock === IDS.GRASS && x - lastTreeX >= 5 && seededRandom() < 0.20) {
            let roll = seededRandom();
            let treeType = roll < 0.65 ? 'oak' : (roll < 0.85 ? 'bush' : 'tall_oak');
            buildTree(x, surfaceY, treeType);
            lastTreeX = x + 1;
        } else if (biome === "village" && topBlock === IDS.GRASS && x - lastTreeX >= 10 && seededRandom() < 0.10) {
            let roll = seededRandom();
            let treeType = roll < 0.60 ? 'bush' : 'oak';
            buildTree(x, surfaceY, treeType);
            lastTreeX = x + 2;
        } else if (biome === "snow" && topBlock === IDS.SNOW && x - lastTreeX >= 4 && seededRandom() < 0.35) {
            let roll = seededRandom();
            let treeType = roll < 0.70 ? 'pine' : (roll < 0.88 ? 'tall_pine' : 'snow_bush');
            buildTree(x, surfaceY, treeType);
            lastTreeX = x + 1;
        } else if (topBlock === IDS.SAND && biome === "desert" && seededRandom() < 0.06) {
            let cactusHeight = Math.floor(seededRandom() * 3) + 2;
            for (let i = 1; i <= cactusHeight; i++) curWorld[x][surfaceY - i] = IDS.CACTUS;
        }

        // Natural Ground Cover
        if (topBlock === IDS.GRASS && curWorld[x][surfaceY - 1] === IDS.AIR && !isNearWater(x)) {
            const meadowDensity = Math.sin(x * 0.12 + worldSeed * 0.3) * 0.5 + Math.sin(x * 0.04) * 0.5;
            const flowerCluster = Math.sin(x * 0.22 + worldSeed * 1.7);
            let vegRoll = seededRandom();

            if (biome === "jungle") {
                if (vegRoll < 0.25) {
                    curWorld[x][surfaceY - 1] = IDS.FERN;
                } else if (vegRoll < 0.45) {
                    curWorld[x][surfaceY - 1] = IDS.TALL_GRASS;
                } else if (vegRoll < 0.60) {
                    curWorld[x][surfaceY - 1] = IDS.SHORT_GRASS;
                } else if (vegRoll < 0.75) {
                    let bambooHeight = Math.floor(seededRandom() * 4) + 2;
                    for (let b = 1; b <= bambooHeight; b++) {
                        if (surfaceY - b > 0 && curWorld[x][surfaceY - b] === IDS.AIR) {
                            curWorld[x][surfaceY - b] = IDS.BAMBOO;
                        }
                    }
                }
            } else if (biome === "plains" || biome === "village") {
                if (flowerCluster > 0.82 && vegRoll < 0.45) {
                    curWorld[x][surfaceY - 1] = IDS.FLOWER_RED;
                } else if (flowerCluster < -0.82 && vegRoll < 0.45) {
                    curWorld[x][surfaceY - 1] = IDS.FLOWER_YELLOW;
                } else if (meadowDensity > 0.15) {
                    if (vegRoll < 0.42) curWorld[x][surfaceY - 1] = IDS.SHORT_GRASS;
                    else if (vegRoll < 0.70) curWorld[x][surfaceY - 1] = IDS.TALL_GRASS;
                    else if (vegRoll < 0.75) curWorld[x][surfaceY - 1] = IDS.FLOWER_RED;
                    else if (vegRoll < 0.80) curWorld[x][surfaceY - 1] = IDS.FLOWER_YELLOW;
                } else {
                    if (vegRoll < 0.20) curWorld[x][surfaceY - 1] = IDS.SHORT_GRASS;
                    else if (vegRoll < 0.30) curWorld[x][surfaceY - 1] = IDS.TALL_GRASS;
                }
            } else if (biome === "forest") {
                if (flowerCluster > 0.85 && vegRoll < 0.38) {
                    curWorld[x][surfaceY - 1] = IDS.FLOWER_RED;
                } else if (meadowDensity > 0.10) {
                    if (vegRoll < 0.38) curWorld[x][surfaceY - 1] = IDS.SHORT_GRASS;
                    else if (vegRoll < 0.62) curWorld[x][surfaceY - 1] = IDS.TALL_GRASS;
                } else {
                    if (vegRoll < 0.18) curWorld[x][surfaceY - 1] = IDS.SHORT_GRASS;
                    else if (vegRoll < 0.28) curWorld[x][surfaceY - 1] = IDS.TALL_GRASS;
                }
            } else if (biome === "mountains" && topBlock === IDS.GRASS) {
                if (vegRoll < 0.24) curWorld[x][surfaceY - 1] = IDS.SHORT_GRASS;
                else if (vegRoll < 0.34) curWorld[x][surfaceY - 1] = IDS.FLOWER_YELLOW;
            }
        }
    }

    // Natural Wild Melon Patches in Jungle clearings
    for (let x = 10; x < WORLD_WIDTH - 10; x += 14) {
        if (biomes[x] === 'jungle' && seededRandom() < 0.48) {
            let sy = surfaceHeights[x];
            if (sy && curWorld[x][sy] === IDS.GRASS && curWorld[x][sy - 1] === IDS.AIR && !isNearWater(x)) {
                let patchSize = Math.floor(seededRandom() * 4) + 2;
                for (let p = 0; p < patchSize; p++) {
                    let mx = x + (p % 3) - 1;
                    if (mx >= 5 && mx < WORLD_WIDTH - 5) {
                        let my = surfaceHeights[mx];
                        if (my && curWorld[mx][my] === IDS.GRASS && curWorld[mx][my - 1] === IDS.AIR) {
                            curWorld[mx][my - 1] = IDS.MELON;
                        }
                    }
                }
            }
        }
    }

    // =========================================================================
    // VILLAGE BIOME GENERATION: HOUSES, WHEAT CROPS & VILLAGE DETAILS
    // =========================================================================
    function buildVillageStructures(targetWorld, targetBgWorld, biomesArr, heightsArr) {
        // Locate village biome boundaries
        let vStart = -1, vEnd = -1;
        for (let x = 0; x < WORLD_WIDTH; x++) {
            if (biomesArr[x] === 'village') {
                if (vStart === -1) vStart = x;
                vEnd = x;
            }
        }
        if (vStart === -1 || vEnd - vStart < 35) return;

        const vCenter = Math.floor((vStart + vEnd) / 2);
        const centerHeight = heightsArr[vCenter] || Math.floor(WORLD_HEIGHT / 2);

        // Smooth & level terrain across the village terrace
        for (let x = Math.max(5, vCenter - 34); x <= Math.min(WORLD_WIDTH - 6, vCenter + 34); x++) {
            const dist = Math.abs(x - vCenter);
            const blend = Math.max(0, 1 - dist / 34);
            const origY = heightsArr[x];
            const targetY = Math.round(origY * (1 - blend) + centerHeight * blend);
            if (targetY !== origY) {
                heightsArr[x] = targetY;
                for (let y = 0; y < targetY; y++) targetWorld[x][y] = IDS.AIR;
                targetWorld[x][targetY] = IDS.GRASS;
                for (let y = targetY + 1; y <= targetY + 4; y++) {
                    if (targetWorld[x][y] === IDS.AIR || targetWorld[x][y] === IDS.GRASS) {
                        targetWorld[x][y] = IDS.DIRT;
                    }
                }
            }
        }

        // Helper: prepare level plot with cobblestone foundation
        const prepPlot = (startX, width, groundY) => {
            for (let x = startX; x < startX + width; x++) {
                if (x < 2 || x >= WORLD_WIDTH - 2) continue;
                for (let y = groundY - 12; y < groundY; y++) {
                    if (y >= 0) targetWorld[x][y] = IDS.AIR;
                }
                for (let y = groundY; y <= groundY + 3; y++) {
                    if (y < WORLD_HEIGHT) targetWorld[x][y] = IDS.COBBLESTONE;
                }
                heightsArr[x] = groundY;
            }
        };

        // Helper: populate chest loot
        const populateChest = (cx, cy, items) => {
            if (cx < 0 || cx >= WORLD_WIDTH || cy < 0 || cy >= WORLD_HEIGHT) return;
            targetWorld[cx][cy] = IDS.CHEST;
            const key = `${cx}_${cy}`;
            const slots = new Array(27).fill(null);
            items.forEach((it, idx) => {
                if (idx < 27) slots[idx] = it;
            });
            const curChests = (typeof chests !== 'undefined' && chests) ? chests : (typeof window !== 'undefined' ? window.chests : null);
            if (curChests) curChests.set(key, { items: slots });
        };

        // ---------------------------------------------------------------------
        // 1. OAK COTTAGE (Cozy Village House)
        // ---------------------------------------------------------------------
        const h1X = vCenter - 26;
        const h1Y = heightsArr[h1X];
        prepPlot(h1X, 7, h1Y);
        // Background walls
        for (let x = h1X + 1; x < h1X + 6; x++) {
            for (let y = h1Y - 4; y < h1Y; y++) {
                targetBgWorld[x][y] = IDS.PLANKS;
            }
        }
        // Corner wood log pillars
        for (let y = h1Y - 4; y < h1Y; y++) {
            targetWorld[h1X][y] = IDS.WOOD;
            targetWorld[h1X + 6][y] = IDS.WOOD;
        }
        for (let x = h1X; x <= h1X + 6; x++) targetWorld[x][h1Y] = IDS.COBBLESTONE;
        // Ceiling
        for (let x = h1X + 1; x < h1X + 6; x++) targetWorld[x][h1Y - 4] = IDS.PLANKS;
        // Window
        targetWorld[h1X + 2][h1Y - 2] = IDS.PRISM_GLASS;
        targetWorld[h1X + 2][h1Y - 1] = IDS.PLANKS;
        targetWorld[h1X + 2][h1Y - 3] = IDS.PLANKS;
        // Door
        targetWorld[h1X + 4][h1Y - 1] = IDS.DOOR;
        targetWorld[h1X + 4][h1Y - 2] = IDS.DOOR_TOP;
        targetWorld[h1X + 4][h1Y - 3] = IDS.PLANKS;
        // Interior furnishings
        targetWorld[h1X + 1][h1Y - 1] = IDS.CRAFTING_TABLE;
        targetWorld[h1X + 1][h1Y - 2] = IDS.TORCH;
        // Pitched wooden roof with stairs
        targetWorld[h1X - 1][h1Y - 4] = IDS.WOODEN_STAIRS;
        targetWorld[h1X][h1Y - 5] = IDS.WOODEN_STAIRS;
        targetWorld[h1X + 1][h1Y - 5] = IDS.PLANKS;
        targetWorld[h1X + 2][h1Y - 6] = IDS.WOODEN_STAIRS;
        targetWorld[h1X + 3][h1Y - 6] = IDS.PLANKS;
        targetWorld[h1X + 4][h1Y - 6] = IDS.WOODEN_STAIRS_RIGHT;
        targetWorld[h1X + 5][h1Y - 5] = IDS.PLANKS;
        targetWorld[h1X + 6][h1Y - 5] = IDS.WOODEN_STAIRS_RIGHT;
        targetWorld[h1X + 7][h1Y - 4] = IDS.WOODEN_STAIRS_RIGHT;

        // ---------------------------------------------------------------------
        // 2. CROP SECTION OF GROWN WHEAT (Village Farmland)
        // ---------------------------------------------------------------------
        const farmX = vCenter - 17;
        const farmY = heightsArr[farmX];
        for (let x = farmX; x < farmX + 12; x++) {
            heightsArr[x] = farmY;
            for (let y = farmY - 4; y < farmY; y++) targetWorld[x][y] = IDS.AIR;
            targetWorld[x][farmY + 1] = IDS.DIRT;
        }
        // Border logs with corner torch posts
        targetWorld[farmX][farmY] = IDS.WOOD;
        targetWorld[farmX][farmY - 1] = IDS.TORCH;
        targetWorld[farmX + 11][farmY] = IDS.WOOD;
        targetWorld[farmX + 11][farmY - 1] = IDS.TORCH;
        // Center water canal
        targetWorld[farmX + 5][farmY] = IDS.WATER;
        targetWorld[farmX + 6][farmY] = IDS.WATER;
        // Farmland on both sides with fully grown mature wheat crops
        for (let x = farmX + 1; x <= farmX + 4; x++) {
            targetWorld[x][farmY] = IDS.PLOWED_DIRT;
            targetWorld[x][farmY - 1] = IDS.WHEAT_STAGE_4; // Fully grown mature wheat!
        }
        for (let x = farmX + 7; x <= farmX + 10; x++) {
            targetWorld[x][farmY] = IDS.PLOWED_DIRT;
            targetWorld[x][farmY - 1] = IDS.WHEAT_STAGE_4; // Fully grown mature wheat!
        }

        // ---------------------------------------------------------------------
        // 3. BLACKSMITH'S STONE WORKSHOP
        // ---------------------------------------------------------------------
        const smithX = vCenter - 3;
        const smithY = heightsArr[smithX];
        prepPlot(smithX, 9, smithY);
        // Background cobblestone
        for (let x = smithX + 1; x < smithX + 8; x++) {
            for (let y = smithY - 4; y < smithY; y++) {
                targetBgWorld[x][y] = IDS.COBBLESTONE;
            }
        }
        // Cobblestone pillars and floor
        for (let y = smithY - 4; y < smithY; y++) {
            targetWorld[smithX][y] = IDS.COBBLESTONE;
            targetWorld[smithX + 8][y] = IDS.COBBLESTONE;
        }
        for (let x = smithX; x <= smithX + 8; x++) targetWorld[x][smithY] = IDS.COBBLESTONE;
        // Roof
        for (let x = smithX; x <= smithX + 8; x++) targetWorld[x][smithY - 4] = IDS.COBBLESTONE;
        targetWorld[smithX][smithY - 5] = IDS.COBBLESTONE_STAIRS;
        targetWorld[smithX + 8][smithY - 5] = IDS.COBBLESTONE_STAIRS_RIGHT;
        targetWorld[smithX + 4][smithY - 5] = IDS.TORCH;
        // Furnaces, Crafting table & Torch
        targetWorld[smithX + 1][smithY - 1] = IDS.FURNACE;
        targetWorld[smithX + 2][smithY - 1] = IDS.FURNACE;
        targetWorld[smithX + 3][smithY - 1] = IDS.CRAFTING_TABLE;
        targetWorld[smithX + 2][smithY - 2] = IDS.TORCH;
        // Blacksmith chest with generous village loot
        populateChest(smithX + 5, smithY - 1, [
            { id: IDS.IRON_INGOT, count: 4 },
            { id: IDS.COOKED_BEEF, count: 5 },
            { id: IDS.BREAD, count: 6 },
            { id: IDS.EMERALD, count: 3 },
            { id: IDS.APPLE, count: 3 },
            { id: IDS.COAL, count: 8 }
        ]);
        // Door
        targetWorld[smithX + 7][smithY - 1] = IDS.DOOR;
        targetWorld[smithX + 7][smithY - 2] = IDS.DOOR_TOP;
        targetWorld[smithX + 7][smithY - 3] = IDS.COBBLESTONE;

        // ---------------------------------------------------------------------
        // 4. VILLAGER RESIDENCE / COZY BEDROOM
        // ---------------------------------------------------------------------
        const bedHouseX = vCenter + 8;
        const bedHouseY = heightsArr[bedHouseX];
        prepPlot(bedHouseX, 8, bedHouseY);
        // Background planks
        for (let x = bedHouseX + 1; x < bedHouseX + 7; x++) {
            for (let y = bedHouseY - 4; y < bedHouseY; y++) {
                targetBgWorld[x][y] = IDS.PLANKS;
            }
        }
        // Corner wood logs & floor
        for (let y = bedHouseY - 4; y < bedHouseY; y++) {
            targetWorld[bedHouseX][y] = IDS.WOOD;
            targetWorld[bedHouseX + 7][y] = IDS.WOOD;
        }
        for (let x = bedHouseX; x <= bedHouseX + 7; x++) targetWorld[x][bedHouseY] = IDS.COBBLESTONE;
        // Ceiling & roof
        for (let x = bedHouseX; x <= bedHouseX + 7; x++) targetWorld[x][bedHouseY - 4] = IDS.PLANKS;
        targetWorld[bedHouseX - 1][bedHouseY - 4] = IDS.WOODEN_STAIRS;
        targetWorld[bedHouseX + 8][bedHouseY - 4] = IDS.WOODEN_STAIRS_RIGHT;
        targetWorld[bedHouseX + 1][bedHouseY - 5] = IDS.WOODEN_STAIRS;
        targetWorld[bedHouseX + 2][bedHouseY - 5] = IDS.PLANKS;
        targetWorld[bedHouseX + 3][bedHouseY - 6] = IDS.WOODEN_STAIRS;
        targetWorld[bedHouseX + 4][bedHouseY - 6] = IDS.WOODEN_STAIRS_RIGHT;
        targetWorld[bedHouseX + 5][bedHouseY - 5] = IDS.PLANKS;
        targetWorld[bedHouseX + 6][bedHouseY - 5] = IDS.WOODEN_STAIRS_RIGHT;
        // Double Bed
        targetWorld[bedHouseX + 1][bedHouseY - 1] = IDS.BED;
        targetWorld[bedHouseX + 2][bedHouseY - 1] = IDS.BED;
        // Window & interior torch
        targetWorld[bedHouseX + 4][bedHouseY - 2] = IDS.PRISM_GLASS;
        targetWorld[bedHouseX + 4][bedHouseY - 1] = IDS.PLANKS;
        targetWorld[bedHouseX + 4][bedHouseY - 3] = IDS.PLANKS;
        targetWorld[bedHouseX + 2][bedHouseY - 3] = IDS.TORCH;
        // Residence chest
        populateChest(bedHouseX + 5, bedHouseY - 1, [
            { id: IDS.BREAD, count: 5 },
            { id: IDS.SEEDS, count: 8 },
            { id: IDS.COOKED_BEEF, count: 3 },
            { id: IDS.APPLE, count: 4 }
        ]);
        // Door
        targetWorld[bedHouseX + 6][bedHouseY - 1] = IDS.DOOR;
        targetWorld[bedHouseX + 6][bedHouseY - 2] = IDS.DOOR_TOP;
        targetWorld[bedHouseX + 6][bedHouseY - 3] = IDS.PLANKS;

        // ---------------------------------------------------------------------
        // 5. LOOKOUT WATCHTOWER (2-Story Elevated Tower)
        // ---------------------------------------------------------------------
        const towerX = vCenter + 18;
        const towerY = heightsArr[towerX];
        prepPlot(towerX, 5, towerY);
        for (let x = towerX; x < towerX + 5; x++) {
            for (let y = towerY - 8; y < towerY; y++) {
                targetBgWorld[x][y] = IDS.PLANKS;
            }
        }
        for (let y = towerY - 8; y < towerY; y++) {
            targetWorld[towerX][y] = IDS.WOOD;
            targetWorld[towerX + 4][y] = IDS.WOOD;
        }
        for (let x = towerX; x < towerX + 5; x++) {
            targetWorld[x][towerY] = IDS.COBBLESTONE;
            targetWorld[x][towerY - 4] = IDS.PLANKS;
            targetWorld[x][towerY - 8] = IDS.PLANKS;
        }
        // Vertical climbable ladders
        for (let y = towerY - 8; y < towerY; y++) {
            targetWorld[towerX + 2][y] = IDS.LADDER;
        }
        // Observation deck parapet and torches
        targetWorld[towerX - 1][towerY - 8] = IDS.WOODEN_STAIRS;
        targetWorld[towerX + 5][towerY - 8] = IDS.WOODEN_STAIRS_RIGHT;
        targetWorld[towerX][towerY - 9] = IDS.TORCH;
        targetWorld[towerX + 4][towerY - 9] = IDS.TORCH;
        // Ground entrance
        targetWorld[towerX + 1][towerY - 1] = IDS.AIR;
        targetWorld[towerX + 1][towerY - 2] = IDS.AIR;

        // ---------------------------------------------------------------------
        // 6. CONNECTING PATHWAYS & STREET LAMPS
        // ---------------------------------------------------------------------
        for (let x = h1X - 3; x <= towerX + 6; x++) {
            if (x < 2 || x >= WORLD_WIDTH - 2) continue;
            const sy = heightsArr[x];
            if (targetWorld[x][sy] === IDS.GRASS) {
                targetWorld[x][sy] = (x % 3 === 0) ? IDS.COBBLESTONE : IDS.DIRT;
            }
        }
        // Street lamp posts
        const lamp1X = vCenter - 6;
        const lamp1Y = heightsArr[lamp1X];
        if (targetWorld[lamp1X][lamp1Y - 1] === IDS.AIR) {
            targetWorld[lamp1X][lamp1Y - 1] = IDS.WOOD;
            targetWorld[lamp1X][lamp1Y - 2] = IDS.TORCH;
        }
        const lamp2X = vCenter + 16;
        const lamp2Y = heightsArr[lamp2X];
        if (targetWorld[lamp2X][lamp2Y - 1] === IDS.AIR) {
            targetWorld[lamp2X][lamp2Y - 1] = IDS.WOOD;
            targetWorld[lamp2X][lamp2Y - 2] = IDS.TORCH;
        }
    }

    buildVillageStructures(curWorld, bgWorld, biomes, surfaceHeights);

    ensureTreeWoodNonCollidable();
    if (typeof window !== 'undefined') window.nonCollidableTreeWood = nonCollidableTreeWood;
    setEngineNonCollidableTreeWood(nonCollidableTreeWood);
    if (typeof window !== 'undefined' && typeof window.ensureDesertScorpions === 'function') {
        window.ensureDesertScorpions();
    }
    if (typeof window !== 'undefined') window.fluids = fluids;
    wakeAllFluids();

    curWorld.width = WORLD_WIDTH;
    curWorld.height = WORLD_HEIGHT;
    curWorld.data = curWorld;
    curWorld.surfaceHeights = surfaceHeights;
    curWorld.bgData = bgWorld;
    return curWorld;
}

export function getActiveBiomeAt(gridX) {
    const gx = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor(gridX)));
    if (worldBiomes && worldBiomes[gx]) return worldBiomes[gx];
    if (typeof window !== 'undefined' && window.worldBiomes && window.worldBiomes[gx]) return window.worldBiomes[gx];
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    const curHeights = (typeof surfaceHeights !== 'undefined' && surfaceHeights) ? surfaceHeights : (typeof window !== 'undefined' ? window.surfaceHeights : null);
    if (!Array.isArray(curWorld) || !Array.isArray(curHeights) || curHeights.length === 0) return 'plains';
    let snowCount = 0;
    let sandCount = 0;
    let woodCount = 0;
    let jungleCount = 0;
    let villageCount = 0;
    const checkRadius = 8;
    const startX = Math.max(0, gx - checkRadius);
    const endX = Math.min(WORLD_WIDTH - 1, gx + checkRadius);
    let totalChecked = 0;

    for (let x = startX; x <= endX; x++) {
        totalChecked++;
        let surfY = curHeights[x] !== undefined ? curHeights[x] : getWorldSurfaceY(x);
        if (surfY < WORLD_HEIGHT) {
            let b0 = curWorld[x]?.[surfY];
            let b1 = curWorld[x]?.[surfY + 1];
            let bAbove = curWorld[x]?.[surfY - 1];
            if (b0 === IDS.SNOW || b0 === IDS.ICE || b1 === IDS.SNOW || b1 === IDS.ICE) snowCount++;
            else if (b0 === IDS.SAND || b1 === IDS.SAND) sandCount++;
            else if (b0 === IDS.JUNGLE_WOOD || b0 === IDS.JUNGLE_LEAVES || b0 === IDS.BAMBOO || b0 === IDS.FERN || b0 === IDS.MELON || b0 === IDS.VINES || b1 === IDS.JUNGLE_WOOD || b1 === IDS.JUNGLE_LEAVES || bAbove === IDS.BAMBOO || bAbove === IDS.FERN || bAbove === IDS.MELON) jungleCount++;
            else if (b0 === IDS.PLOWED_DIRT || bAbove === IDS.WHEAT_STAGE_4 || b0 === IDS.PLANKS) villageCount++;
            else if (b0 === IDS.WOOD || b0 === IDS.LEAVES || b1 === IDS.WOOD || bAbove === IDS.WOOD || bAbove === IDS.LEAVES) woodCount++;
        }
    }

    if (villageCount >= 2) return 'village';
    if (jungleCount >= 1) return 'jungle';
    if (totalChecked > 0 && snowCount / totalChecked > 0.30) return 'snow';
    if (totalChecked > 0 && sandCount / totalChecked > 0.30) return 'desert';
    if (woodCount >= 1) return 'forest';
    const surfY = curHeights[gx] !== undefined ? curHeights[gx] : getWorldSurfaceY(gx);
    if (surfY < Math.floor(WORLD_HEIGHT * 0.32) || (curWorld[gx]?.[surfY] === IDS.STONE)) return 'mountains';
    return 'plains';
}

// Window self-registration for backward compatibility
try {
    if (typeof window !== 'undefined') {
        window.mapSeed = mapSeed;
        window.setMapSeed = setMapSeed;
        window.seededRandom = seededRandom;
        window.getInitialSpawnPoint = getInitialSpawnPoint;
        window.buildTree = buildTree;
        window.buildJungleTree = buildJungleTree;
        window.generateWorld = generateWorld;
        window.getActiveBiomeAt = getActiveBiomeAt;
    }
} catch (e) {}

