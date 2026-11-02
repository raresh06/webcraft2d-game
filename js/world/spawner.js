// =============================================================================
// WEBCRAFT 2D - MOB & ANIMAL SPAWNER (js/world/spawner.js)
// Passive animal herds, ambient birds, hostile mob cycles & Gloomstalker dread
// =============================================================================

import {
    IDS, TILE_SIZE, DIFFICULTIES, CAVE_SKY_START_TILES
} from '../core/constants.js';

import {
    world, surfaceHeights, entities, player, remotePlayers, camera,
    currentDifficulty, timeOfDay, frameCount, gloomDreadTimer,
    setEngineEntities, setEngineGloomDreadTimer, WORLD_WIDTH, WORLD_HEIGHT,
    particles, floatingTexts, isMultiplayer, isMultiplayerAuthority
} from '../core/state.js';

import {
    isSolidWorldBlock, getWorldSurfaceY, 
} from './blockhelper.js';

import {
    getFluid
} from './fluids.js';

import {
    getActiveBiomeAt
} from './worldgen.js';

function getMaxAnimals() {
    if (typeof window !== 'undefined' && typeof window.getMaxAnimals === 'function') {
        return window.getMaxAnimals();
    }
    return 40;
}

function getDayDifficultyMultiplier() {
    if (typeof window !== 'undefined' && typeof window.getDayDifficultyMultiplier === 'function') {
        return window.getDayDifficultyMultiplier();
    }
    return 1.0;
}

function getPlaySoundFn() {
    if (typeof window !== 'undefined' && typeof window.playSound === 'function') return window.playSound;
    return null;
}

function getParticleClass() {
    if (typeof window !== 'undefined' && window.Particle) return window.Particle;
    return null;
}

function getFloatingTextClass() {
    if (typeof window !== 'undefined' && window.FloatingText) return window.FloatingText;
    return null;
}

function getEntityClass(name) {
    if (typeof window !== 'undefined' && window[name]) return window[name];
    return null;
}

export function isNearTorch(gx, gy, radius = 7) {
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    if (!curWorld) return false;
    let minX = Math.max(0, gx - Math.ceil(radius));
    let maxX = Math.min(WORLD_WIDTH - 1, gx + Math.ceil(radius));
    let minY = Math.max(0, gy - Math.ceil(radius));
    let maxY = Math.min(WORLD_HEIGHT - 1, gy + Math.ceil(radius));
    for (let x = minX; x <= maxX; x++) {
        if (!curWorld[x]) continue;
        for (let y = minY; y <= maxY; y++) {
            const b = curWorld[x][y];
            if (b === IDS.TORCH || b === IDS.FURNACE || b === IDS.GLOOM_LANTERN) {
                if (Math.hypot(gx - x, gy - y) <= radius) return true;
            }
        }
    }
    return false;
}

export function isNearGloomLantern(gx, gy, radius = 7) {
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    if (!curWorld) return false;
    let minX = Math.max(0, gx - Math.ceil(radius));
    let maxX = Math.min(WORLD_WIDTH - 1, gx + Math.ceil(radius));
    let minY = Math.max(0, gy - Math.ceil(radius));
    let maxY = Math.min(WORLD_HEIGHT - 1, gy + Math.ceil(radius));
    for (let x = minX; x <= maxX; x++) {
        if (!curWorld[x]) continue;
        for (let y = minY; y <= maxY; y++) {
            if (curWorld[x][y] === IDS.GLOOM_LANTERN) {
                if (Math.hypot(gx - x, gy - y) <= radius) return true;
            }
        }
    }
    return false;
}

export function hasDirectSkyAccess(gx, gy, ignoreTranslucent = true) {
    if (gx < 0 || gx >= WORLD_WIDTH) return true;
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    if (!curWorld) return true;
    const nonSunlightBlocking = new Set([
        IDS.AIR, IDS.TORCH, IDS.SAPLING, IDS.JUNGLE_SAPLING,
        IDS.FLOWER_RED, IDS.FLOWER_YELLOW, IDS.FERN, IDS.SHORT_GRASS,
        IDS.TALL_GRASS, IDS.VINES, IDS.GLASS
    ]);
    if (ignoreTranslucent) {
        nonSunlightBlocking.add(IDS.LEAVES);
        nonSunlightBlocking.add(IDS.PINE_LEAVES);
        nonSunlightBlocking.add(IDS.JUNGLE_LEAVES);
        nonSunlightBlocking.add(IDS.BAMBOO);
    }
    for (let y = gy; y >= 0; y--) {
        let b = curWorld[gx]?.[y];
        if (b !== undefined && !nonSunlightBlocking.has(b)) {
            return false;
        }
    }
    return true;
}

export function spawnAnimals(count = 1, nearPlayerBias = 0.35) {
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    const curPlayer = (typeof player !== 'undefined' && player) ? player : (typeof window !== 'undefined' ? window.player : null);
    const curHeights = (typeof surfaceHeights !== 'undefined' && surfaceHeights) ? surfaceHeights : (typeof window !== 'undefined' ? window.surfaceHeights : null);
    const curEntities = (typeof entities !== 'undefined' && entities) ? entities : (typeof window !== 'undefined' ? window.entities : null);
    const curRemotes = (typeof remotePlayers !== 'undefined' && remotePlayers) ? remotePlayers : (typeof window !== 'undefined' ? window.remotePlayers : null);
    if (!curWorld || !curEntities) return false;

    const AnimalClass = getEntityClass('Animal');
    const PigeonClass = getEntityClass('Pigeon');
    const ParrotClass = getEntityClass('Parrot');
    const CatClass = getEntityClass('Cat');
    const SheepClass = getEntityClass('Sheep');
    const PigClass = getEntityClass('Pig');
    const CowClass = getEntityClass('Cow');
    const ChickenClass = getEntityClass('Chicken');

    let maxAnimals = getMaxAnimals();
    let currentAnimals = AnimalClass ? curEntities.filter(e => e instanceof AnimalClass).length : 0;
    if (currentAnimals >= maxAnimals) return;

    let activePlayers = (curPlayer && curPlayer.x !== undefined) ? [{ x: curPlayer.x, y: curPlayer.y }] : [];
    if (isMultiplayer && isMultiplayerAuthority() && curRemotes) {
        Object.values(curRemotes).forEach(rp => {
            if (rp && !rp.isDead && rp.x !== undefined) activePlayers.push({ x: rp.x, y: rp.y });
        });
    }
    if (activePlayers.length === 0) return;

    const validGround = new Set([IDS.GRASS, IDS.SNOW, IDS.SHORT_GRASS, IDS.TALL_GRASS, IDS.DIRT, IDS.JUNGLE_LEAVES, IDS.LEAVES]);
    const nonSolid = new Set([IDS.AIR, IDS.TORCH, IDS.SAPLING, IDS.JUNGLE_SAPLING, IDS.SHORT_GRASS, IDS.TALL_GRASS, IDS.FLOWER_RED, IDS.FLOWER_YELLOW, IDS.DOOR_OPEN, IDS.DOOR_OPEN_TOP, IDS.BAMBOO, IDS.FERN, IDS.VINES]);

    for (let i = 0; i < count && currentAnimals < maxAnimals; i++) {
        let chosenPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
        let isNear = Math.random() < nearPlayerBias;
        let offsetTiles = isNear ? (32 + Math.random() * 33) : (70 + Math.random() * 90);
        let side = Math.random() > 0.5 ? 1 : -1;
        let spawnX = chosenPlayer.x + side * offsetTiles * TILE_SIZE;
        let gx = Math.floor(spawnX / TILE_SIZE);
        if (gx < 5 || gx >= WORLD_WIDTH - 5) continue;

        let gy = curHeights ? curHeights[gx] : undefined;
        if (gy === undefined || gy < 2 || gy >= WORLD_HEIGHT - 3) {
            gy = 0;
            while (gy < WORLD_HEIGHT && nonSolid.has(curWorld[gx]?.[gy])) gy++;
        }
        if (gy >= WORLD_HEIGHT || gy < 2) continue;

        let groundBlock = curWorld[gx]?.[gy];
        let headBlock = curWorld[gx]?.[gy - 2];
        let torsoBlock = curWorld[gx]?.[gy - 1];

        let hasFluidNearby = false;
        for (let ox = -3; ox <= 3; ox++) {
            const tgx = gx + ox;
            if (tgx < 0 || tgx >= WORLD_WIDTH) continue;
            for (let oy = -2; oy <= 2; oy++) {
                const tgy = gy + oy;
                if (isWater(tgx, tgy) || isLava(tgx, tgy) || getFluid(tgx, tgy)) {
                    hasFluidNearby = true;
                    break;
                }
            }
            if (hasFluidNearby) break;
        }
        if (hasFluidNearby) continue;

        if (groundBlock !== undefined && validGround.has(groundBlock) && 
            headBlock !== undefined && nonSolid.has(headBlock) && 
            torsoBlock !== undefined && nonSolid.has(torsoBlock)) {
            
            const isJungle = typeof getActiveBiomeAt === 'function' && getActiveBiomeAt(gx) === 'jungle';
            const isVillage = typeof getActiveBiomeAt === 'function' && getActiveBiomeAt(gx) === 'village';
            let currentPigeons = PigeonClass ? curEntities.filter(e => e instanceof PigeonClass).length : 0;
            let targetPigeons = Math.round(maxAnimals * 0.28);
            let animalType;
            if (isVillage && Math.random() < 0.60) {
                animalType = 'Cat';
            } else if (isJungle && Math.random() < 0.65) {
                animalType = 'Parrot';
            } else if (currentPigeons < targetPigeons) {
                let roll = Math.random();
                if (roll < 0.35) animalType = 'Pigeon';
                else if (roll < 0.51) animalType = 'Sheep';
                else if (roll < 0.67) animalType = 'Pig';
                else if (roll < 0.83) animalType = 'Cow';
                else animalType = 'Chicken';
            } else {
                let roll = Math.random();
                if (roll < 0.25) animalType = 'Sheep';
                else if (roll < 0.50) animalType = 'Pig';
                else if (roll < 0.75) animalType = 'Cow';
                else animalType = 'Chicken';
            }
            let spawnWorldY = (gy - 2) * TILE_SIZE;
            
            if (animalType === 'Sheep' && SheepClass) curEntities.push(new SheepClass(spawnX, spawnWorldY));
            else if (animalType === 'Pig' && PigClass) curEntities.push(new PigClass(spawnX, spawnWorldY));
            else if (animalType === 'Cow' && CowClass) curEntities.push(new CowClass(spawnX, spawnWorldY));
            else if (animalType === 'Chicken' && ChickenClass) curEntities.push(new ChickenClass(spawnX, spawnWorldY));
            else if (animalType === 'Cat' && CatClass) {
                const cat = new CatClass(spawnX, spawnWorldY);
                curEntities.push(cat);
                currentAnimals++;
            }
            else if (animalType === 'Parrot' && ParrotClass) {
                const parrot = new ParrotClass(spawnX, spawnWorldY);
                curEntities.push(parrot);
                currentAnimals++;
                if (Math.random() < 0.45 && currentAnimals < maxAnimals) {
                    curEntities.push(new ParrotClass(spawnX + 16, spawnWorldY));
                    currentAnimals++;
                }
            }
            else if (PigeonClass) {
                const p1 = new PigeonClass(spawnX, spawnWorldY);
                curEntities.push(p1);
                currentAnimals++;
                if (Math.random() < 0.50 && currentAnimals < maxAnimals && (currentPigeons + 1) < 12) {
                    const p2 = new PigeonClass(spawnX + 16, spawnWorldY);
                    p1.partner = p2;
                    p2.partner = p1;
                    curEntities.push(p2);
                    currentAnimals++;
                }
            }
            currentAnimals++;

            if (animalType !== 'Pigeon' && animalType !== 'Parrot' && Math.random() < 0.15 && currentAnimals < maxAnimals) {
                let herdOffset = (Math.random() > 0.5 ? 2 : -2);
                let hgx = gx + herdOffset;
                if (hgx >= 2 && hgx < WORLD_WIDTH - 2) {
                    let hgy = (curHeights ? curHeights[hgx] : undefined) || gy;
                    if (hgy >= 2 && hgy < WORLD_HEIGHT - 2 && validGround.has(curWorld[hgx]?.[hgy]) &&
                        !isWater(hgx, hgy) && !isWater(hgx, hgy - 1) && !isWater(hgx, hgy - 2) &&
                        !isLava(hgx, hgy) && !isLava(hgx, hgy - 1) && !isLava(hgx, hgy - 2) &&
                        !getFluid(hgx, hgy) && !getFluid(hgx, hgy - 1) && !getFluid(hgx, hgy - 2)) {
                        let hSpawnX = hgx * TILE_SIZE;
                        let hSpawnY = (hgy - 2) * TILE_SIZE;
                        if (animalType === 'Sheep' && SheepClass) curEntities.push(new SheepClass(hSpawnX, hSpawnY));
                        else if (animalType === 'Pig' && PigClass) curEntities.push(new PigClass(hSpawnX, hSpawnY));
                        else if (animalType === 'Cow' && CowClass) curEntities.push(new CowClass(hSpawnX, hSpawnY));
                        else if (ChickenClass) curEntities.push(new ChickenClass(hSpawnX, hSpawnY));
                        currentAnimals++;
                    }
                }
            }
        }
    }
    return true;
}

export function spawnMobs(forcePassive = false) {
    const curEntities = (typeof entities !== 'undefined' && entities) ? entities : (typeof window !== 'undefined' ? window.entities : null);
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    const curPlayer = (typeof player !== 'undefined' && player) ? player : (typeof window !== 'undefined' ? window.player : null);
    const curRemotes = (typeof remotePlayers !== 'undefined' && remotePlayers) ? remotePlayers : (typeof window !== 'undefined' ? window.remotePlayers : null);
    if (!curWorld || !curEntities) return;

    const AnimalClass = getEntityClass('Animal');
    const AtlasExplorerClass = getEntityClass('AtlasExplorer');
    const ZombieClass = getEntityClass('Zombie');
    const CreeperClass = getEntityClass('Creeper');
    const ScorpionClass = getEntityClass('Scorpion');
    const GloomstalkerClass = getEntityClass('Gloomstalker');
    const PClass = getParticleClass();
    const FTClass = getFloatingTextClass();
    const sndFn = getPlaySoundFn();

    let diff = DIFFICULTIES[currentDifficulty] || DIFFICULTIES.normal;
    if (diff.mobSpawn <= 0) {
        setEngineEntities(curEntities.filter(e => (AnimalClass && e instanceof AnimalClass) || (AtlasExplorerClass && e instanceof AtlasExplorerClass)));
        if (!forcePassive) return;
    }

    const isNight = timeOfDay >= 0.68 && timeOfDay < 0.90;
    const isDay = !isNight;

    if (!curPlayer || curPlayer.x === undefined) return;
    let activePlayerPositions = [{ x: curPlayer.x, y: curPlayer.y }];
    if (isMultiplayer && isMultiplayerAuthority() && curRemotes) {
        Object.values(curRemotes).forEach(rp => {
            if (rp && !rp.isDead && rp.x !== undefined) activePlayerPositions.push({ x: rp.x, y: rp.y });
        });
    }

    // 1. Despawn burning mobs in daytime and distant hostile mobs
    setEngineEntities(curEntities.filter(e => {
        if (AtlasExplorerClass && e instanceof AtlasExplorerClass) return !e.isDeparted;
        const isHostile = (ZombieClass && e instanceof ZombieClass) ||
                          (CreeperClass && e instanceof CreeperClass) ||
                          (ScorpionClass && e instanceof ScorpionClass) ||
                          (GloomstalkerClass && e instanceof GloomstalkerClass);
        if (isHostile) {
            if (isDay && ((ZombieClass && e instanceof ZombieClass) || (GloomstalkerClass && e instanceof GloomstalkerClass))) {
                let headGx = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor((e.x + e.width / 2) / TILE_SIZE)));
                let headGy = Math.max(0, Math.floor((e.y + 4) / TILE_SIZE));
                let footGy = Math.max(0, Math.floor((e.y + e.height - 2) / TILE_SIZE));
                let inWater = (typeof isWater === 'function' && isWater(headGx, footGy));
                if (!inWater && hasDirectSkyAccess(headGx, headGy, true)) {
                    if (frameCount % 15 === 0) {
                        e.takeDamage(3, 0);
                        if (PClass && Array.isArray(particles)) {
                            for (let p = 0; p < 2; p++) {
                                particles.push(new PClass(e.x + Math.random() * e.width, e.y + Math.random() * e.height * 0.7, (GloomstalkerClass && e instanceof GloomstalkerClass) ? '#a855f7' : '#ffaa00'));
                            }
                        }
                    }
                    if (e.health <= 0) return false;
                }
            }
            let isNearAnyPlayer = activePlayerPositions.some(p => {
                return Math.abs(e.x - p.x) < 45 * TILE_SIZE && Math.abs(e.y - p.y) < 32 * TILE_SIZE;
            });
            if (!isNearAnyPlayer) return false;
        }
        return e.health > 0;
    }));

    if (forcePassive) {
        spawnAnimals(2, 0.35);
        return;
    }

    if (diff.mobSpawn <= 0) return;

    let anyPlayerInCave = activePlayerPositions.some(p => {
        let gx = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor((p.x + 12) / TILE_SIZE)));
        let gy = Math.floor((p.y + 40) / TILE_SIZE);
        let surfY = getWorldSurfaceY(gx);
        const caveOp = (typeof window !== 'undefined' && typeof window.caveSkyOpacity !== 'undefined') ? window.caveSkyOpacity : 0;
        return gy > surfY + CAVE_SKY_START_TILES && caveOp > 0.2;
    });

    let spawnInterval = 40;
    if (anyPlayerInCave) {
        if (currentDifficulty === 'easy') spawnInterval = 28;
        else if (currentDifficulty === 'normal') spawnInterval = 18;
        else if (currentDifficulty === 'hard' || currentDifficulty === 'hardcore') spawnInterval = 12;
    } else {
        if (currentDifficulty === 'easy') spawnInterval = 55;
        else if (currentDifficulty === 'normal') spawnInterval = 35;
        else if (currentDifficulty === 'hard' || currentDifficulty === 'hardcore') spawnInterval = 22;
    }

    if (frameCount % spawnInterval !== 0) return;

    if (!isNight && !anyPlayerInCave && Math.random() < 0.65) {
        return;
    }

    const dayMultiplier = getDayDifficultyMultiplier();
    const updatedEntities = (typeof entities !== 'undefined' && entities) ? entities : (typeof window !== 'undefined' ? window.entities : []);
    const hostileEntities = updatedEntities.filter(e => 
        (ZombieClass && e instanceof ZombieClass) ||
        (CreeperClass && e instanceof CreeperClass) ||
        (ScorpionClass && e instanceof ScorpionClass) ||
        (GloomstalkerClass && e instanceof GloomstalkerClass)
    );
    
    let maxHostiles = 16;
    let spawnChance = 0.45;
    let packSize = 1;

    if (anyPlayerInCave) {
        if (currentDifficulty === 'easy') {
            maxHostiles = Math.min(12, Math.floor(6 + (dayMultiplier - 1) * 4));
            spawnChance = 0.45;
            packSize = 1;
        } else if (currentDifficulty === 'normal') {
            maxHostiles = Math.min(24, Math.floor(12 + (dayMultiplier - 1) * 8));
            spawnChance = 0.65;
            packSize = (Math.random() < 0.35) ? 2 : 1;
        } else {
            maxHostiles = Math.min(48, Math.floor(22 + (dayMultiplier - 1) * 18));
            spawnChance = 0.85;
            packSize = (Math.random() < 0.55) ? (Math.floor(Math.random() * 2) + 2) : 1;
        }
    } else {
        if (currentDifficulty === 'easy') {
            maxHostiles = Math.min(8, Math.floor(4 + (dayMultiplier - 1) * 3));
            spawnChance = 0.28;
            packSize = 1;
        } else if (currentDifficulty === 'normal') {
            maxHostiles = Math.min(16, Math.floor(8 + (dayMultiplier - 1) * 5));
            spawnChance = 0.42;
            packSize = (isNight && Math.random() < 0.15) ? 2 : 1;
        } else {
            maxHostiles = Math.min(42, Math.floor(18 + (dayMultiplier - 1) * 16));
            spawnChance = 0.65;
            packSize = (Math.random() < 0.40) ? (Math.floor(Math.random() * 2) + 2) : 1;
        }
    }

    if (hostileEntities.length >= maxHostiles || Math.random() >= spawnChance) {
        return;
    }

    let chosenPlayer = activePlayerPositions[Math.floor(Math.random() * activePlayerPositions.length)];
    let pGx = Math.floor((chosenPlayer.x + (chosenPlayer.width || 24) / 2) / TILE_SIZE);
    let pGy = Math.floor((chosenPlayer.y + (chosenPlayer.height || 48)) / TILE_SIZE);
    let pSurfY = getWorldSurfaceY(pGx);
    const caveOp = (typeof window !== 'undefined' && typeof window.caveSkyOpacity !== 'undefined') ? window.caveSkyOpacity : 0;
    let isPlayerInCave = pGy > pSurfY + CAVE_SKY_START_TILES && caveOp > 0.2;

    let tryCave = isPlayerInCave || isDay || Math.random() < 0.50;
    let spawnSide = Math.random() > 0.5 ? 1 : -1;

    const isFluidAt = (gx, gy) => {
        if (gx < 0 || gx >= WORLD_WIDTH || gy < 0 || gy >= WORLD_HEIGHT) return false;
        const b = curWorld[gx]?.[gy];
        if (b === IDS.WATER || b === IDS.LAVA) return true;
        const fl = getFluid(gx, gy);
        if (fl && (fl.type === IDS.WATER || fl.type === IDS.LAVA)) return true;
        if (isWater(gx, gy) || isLava(gx, gy)) return true;
        return false;
    };

    const canvasObj = (typeof window !== 'undefined' && window.canvas) ? window.canvas : null;
    const cW = canvasObj?.width || 1280;
    const cH = canvasObj?.height || 720;
    const curCamera = (typeof camera !== 'undefined' && camera) ? camera : (typeof window !== 'undefined' ? window.camera : { x: 0, y: 0 });
    const camLeftTile = Math.floor(curCamera.x / TILE_SIZE);
    const camRightTile = Math.ceil((curCamera.x + cW) / TILE_SIZE);
    const camTopTile = Math.floor(curCamera.y / TILE_SIZE);
    const camBottomTile = Math.ceil((curCamera.y + cH) / TILE_SIZE);

    const isPointOnScreen = (gx, gy, marginTiles = 3) => {
        return (gx >= camLeftTile - marginTiles && gx <= camRightTile + marginTiles &&
                gy >= camTopTile - marginTiles && gy <= camBottomTile + marginTiles);
    };

    const screenHalfTilesX = Math.max(20, Math.ceil(cW / (2 * TILE_SIZE)));
    const minSpawnDist = screenHalfTilesX + 4;
    const maxSpawnDist = minSpawnDist + 14;

    const isNearKael = (gx, gy, distTiles = 14) => {
        for (const e of updatedEntities) {
            if (AtlasExplorerClass && e instanceof AtlasExplorerClass && !e.isDeparted) {
                const kGx = Math.floor((e.x + e.width / 2) / TILE_SIZE);
                const kGy = Math.floor((e.y + e.height / 2) / TILE_SIZE);
                if (Math.hypot(gx - kGx, gy - kGy) < distTiles) return true;
            }
        }
        return false;
    };

    if (tryCave) {
        let foundX = -1;
        let foundY = -1;
        let spawnClinging = false;
        let maxAttempts = isPlayerInCave ? 65 : 45;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            let dist = minSpawnDist + Math.floor(Math.random() * (maxSpawnDist - minSpawnDist));
            let candX = pGx + spawnSide * dist;
            if (candX < 2 || candX >= WORLD_WIDTH - 2) {
                spawnSide = -spawnSide;
                continue;
            }
            let surfY = getWorldSurfaceY(candX);
            let minY = isDay ? (surfY + 6) : (isPlayerInCave ? Math.max(surfY + 2, pGy - 14) : surfY + 3);
            let maxY = isPlayerInCave ? Math.min(WORLD_HEIGHT - 3, pGy + 16) : WORLD_HEIGHT - 4;
            if (minY >= maxY) continue;

            let candY = minY + Math.floor(Math.random() * (maxY - minY));
            if (isDay && candY < surfY + 6) continue;

            if (isPointOnScreen(candX, candY, 3)) continue;

            let floorBlock = curWorld[candX]?.[candY + 1];
            let feetBlock = curWorld[candX]?.[candY];
            let headBlock = curWorld[candX]?.[candY - 1];

            if (isFluidAt(candX, candY) || isFluidAt(candX, candY - 1) || isFluidAt(candX, candY + 1)) continue;

            if (feetBlock === IDS.AIR && headBlock === IDS.AIR && floorBlock !== undefined && isSolidWorldBlock(candX, candY + 1, floorBlock) && floorBlock !== IDS.WATER && floorBlock !== IDS.LAVA && !isFluidAt(candX, candY + 1)) {
                if (isDay && hasDirectSkyAccess(candX, candY, true)) {
                    continue;
                }
                if (isNearGloomLantern(candX, candY, 7) || isNearKael(candX, candY, 14)) {
                    continue;
                }

                foundX = candX;
                foundY = candY;
                let ceilBlock = curWorld[candX]?.[candY - 2];
                if (ceilBlock !== undefined && ceilBlock !== IDS.AIR && ceilBlock !== IDS.WATER && ceilBlock !== IDS.LAVA && !isFluidAt(candX, candY - 2)) {
                    if (Math.random() < 0.35) {
                        spawnClinging = true;
                    }
                }
                break;
            }
        }

        if (foundX > 0 && foundY > 0) {
            const isDesert = (typeof getActiveBiomeAt === 'function' && getActiveBiomeAt(foundX) === 'desert');
            const candSurfY = getWorldSurfaceY(foundX);
            const isDeepCavern = foundY >= (candSurfY + 16) && foundY >= 48;
            const maxGloomstalkers = (currentDifficulty === 'hard' || currentDifficulty === 'hardcore') ? 2 : 1;
            const activeGloomstalkers = GloomstalkerClass ? updatedEntities.filter(e => e instanceof GloomstalkerClass).length : 0;

            for (let k = 0; k < packSize; k++) {
                const curHostiles = updatedEntities.filter(e => 
                    (ZombieClass && e instanceof ZombieClass) ||
                    (CreeperClass && e instanceof CreeperClass) ||
                    (ScorpionClass && e instanceof ScorpionClass) ||
                    (GloomstalkerClass && e instanceof GloomstalkerClass)
                );
                if (curHostiles.length >= maxHostiles) break;
                let mobX = foundX * TILE_SIZE + (k * 16 * (Math.random() > 0.5 ? 1 : -1));
                let mobGx = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor(mobX / TILE_SIZE)));
                let mobY = (foundY - 1) * TILE_SIZE;

                if (isFluidAt(mobGx, foundY) || isFluidAt(mobGx, foundY - 1) || isFluidAt(mobGx, foundY + 1)) continue;

                const mobNearTorch = isNearTorch(mobGx, foundY, 7);
                if (mobNearTorch) {
                    if (isDeepCavern && activeGloomstalkers < maxGloomstalkers && Math.random() < 0.06 && GloomstalkerClass) {
                        let gs = new GloomstalkerClass(mobX, spawnClinging ? (foundY - 2) * TILE_SIZE : mobY);
                        if (spawnClinging) gs.isCeilingClinging = true;
                        updatedEntities.push(gs);
                    }
                    continue;
                }

                let roll = Math.random();
                if (isDesert) {
                    if (roll < 0.38 && ScorpionClass) {
                        updatedEntities.push(new ScorpionClass(mobX, mobY));
                    } else if (roll < 0.45 && isDeepCavern && activeGloomstalkers < maxGloomstalkers && GloomstalkerClass) {
                        let gs = new GloomstalkerClass(mobX, spawnClinging ? (foundY - 2) * TILE_SIZE : mobY);
                        if (spawnClinging) gs.isCeilingClinging = true;
                        updatedEntities.push(gs);
                    } else if (roll < 0.72 && CreeperClass) {
                        updatedEntities.push(new CreeperClass(mobX, mobY));
                    } else if (ZombieClass) {
                        updatedEntities.push(new ZombieClass(mobX, mobY));
                    }
                } else {
                    if (roll < 0.07 && isDeepCavern && activeGloomstalkers < maxGloomstalkers && GloomstalkerClass) {
                        let gs = new GloomstalkerClass(mobX, spawnClinging ? (foundY - 2) * TILE_SIZE : mobY);
                        if (spawnClinging) gs.isCeilingClinging = true;
                        updatedEntities.push(gs);
                    } else if (roll < 0.40 && CreeperClass) {
                        updatedEntities.push(new CreeperClass(mobX, mobY));
                    } else if (ZombieClass) {
                        updatedEntities.push(new ZombieClass(mobX, mobY));
                    }
                }
            }
            return;
        }
    }

    if (isNight) {
        let foundX = -1;
        let foundY = -1;
        for (let attempt = 0; attempt < 35; attempt++) {
            let dist = minSpawnDist + Math.floor(Math.random() * (maxSpawnDist - minSpawnDist));
            let candX = pGx + spawnSide * dist;
            if (candX < 2 || candX >= WORLD_WIDTH - 2) {
                spawnSide = -spawnSide;
                continue;
            }
            let surfY = getWorldSurfaceY(candX);
            if (surfY <= 0 || surfY >= WORLD_HEIGHT - 3) continue;

            if (isPointOnScreen(candX, surfY - 1, 3)) continue;

            let floorBlock = curWorld[candX]?.[surfY];
            let feetBlock = curWorld[candX]?.[surfY - 1];
            let headBlock = curWorld[candX]?.[surfY - 2];

            if (isFluidAt(candX, surfY) || isFluidAt(candX, surfY - 1) || isFluidAt(candX, surfY - 2)) continue;

            if (feetBlock === IDS.AIR && headBlock === IDS.AIR && floorBlock !== undefined && isSolidWorldBlock(candX, surfY, floorBlock) && !isFluidAt(candX, surfY)) {
                if (!isNearGloomLantern(candX, surfY - 1, 7) && !isNearKael(candX, surfY - 1, 14)) {
                    foundX = candX;
                    foundY = surfY;
                    break;
                }
            }
        }

        if (foundX > 0 && foundY > 0) {
            const isDesert = (typeof getActiveBiomeAt === 'function' && getActiveBiomeAt(foundX) === 'desert');
            const maxGloomstalkers = (currentDifficulty === 'hard' || currentDifficulty === 'hardcore') ? 2 : 1;
            const activeGloomstalkers = GloomstalkerClass ? updatedEntities.filter(e => e instanceof GloomstalkerClass).length : 0;

            for (let k = 0; k < packSize; k++) {
                const curHostiles = updatedEntities.filter(e => 
                    (ZombieClass && e instanceof ZombieClass) ||
                    (CreeperClass && e instanceof CreeperClass) ||
                    (ScorpionClass && e instanceof ScorpionClass) ||
                    (GloomstalkerClass && e instanceof GloomstalkerClass)
                );
                if (curHostiles.length >= maxHostiles) break;
                let mobX = foundX * TILE_SIZE + (k * 16 * (Math.random() > 0.5 ? 1 : -1));
                let mobGx = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor(mobX / TILE_SIZE)));
                let mobY = (foundY - 2) * TILE_SIZE;

                if (isFluidAt(mobGx, foundY) || isFluidAt(mobGx, foundY - 1) || isFluidAt(mobGx, foundY - 2)) continue;

                const mobNearTorch = isNearTorch(mobGx, foundY - 1, 7);
                if (mobNearTorch) {
                    if (activeGloomstalkers < maxGloomstalkers && Math.random() < 0.015 && GloomstalkerClass) {
                        updatedEntities.push(new GloomstalkerClass(mobX, mobY));
                    }
                    continue;
                }

                let roll = Math.random();
                if (isDesert) {
                    if (roll < 0.45 && ScorpionClass) {
                        updatedEntities.push(new ScorpionClass(mobX, mobY));
                    } else if (roll < 0.47 && activeGloomstalkers < maxGloomstalkers && GloomstalkerClass) {
                        updatedEntities.push(new GloomstalkerClass(mobX, mobY));
                    } else if (roll < 0.72 && CreeperClass) {
                        updatedEntities.push(new CreeperClass(mobX, mobY));
                    } else if (ZombieClass) {
                        updatedEntities.push(new ZombieClass(mobX, mobY));
                    }
                } else {
                    if (roll < 0.015 && activeGloomstalkers < maxGloomstalkers && GloomstalkerClass) {
                        updatedEntities.push(new GloomstalkerClass(mobX, mobY));
                    } else if (roll < 0.36 && CreeperClass) {
                        updatedEntities.push(new CreeperClass(mobX, mobY));
                    } else if (ZombieClass) {
                        updatedEntities.push(new ZombieClass(mobX, mobY));
                    }
                }
            }
        }
    }

    // Dread Stalker Presence
    if (curPlayer && curPlayer.health > 0 && GloomstalkerClass) {
        const maxGloomstalkers = (currentDifficulty === 'hard' || currentDifficulty === 'hardcore') ? 2 : 1;
        const curGloomstalkers = updatedEntities.filter(e => e instanceof GloomstalkerClass).length;
        if (curGloomstalkers < maxGloomstalkers) {
            const plGx = Math.floor((curPlayer.x + curPlayer.width / 2) / TILE_SIZE);
            const plGy = Math.floor((curPlayer.y + curPlayer.height / 2) / TILE_SIZE);
            const plSurfY = getWorldSurfaceY(plGx);
            const isDeepCave = plGy >= (plSurfY + 14) && plGy >= 44;
            const isPitchBlackSurface = isNight && !isNearTorch(plGx, plGy, 8);

            if (isDeepCave || isPitchBlackSurface) {
                setEngineGloomDreadTimer(gloomDreadTimer + (isDeepCave ? 1.4 : 1.0));

                const DREAD_THRESHOLD = 3200;
                if (gloomDreadTimer >= DREAD_THRESHOLD) {
                    const spawnDir = curPlayer.vx > 0.5 ? -1 : (curPlayer.vx < -0.5 ? 1 : (Math.random() > 0.5 ? 1 : -1));
                    const distTiles = minSpawnDist + Math.floor(Math.random() * 4);
                    const spawnGx = Math.max(3, Math.min(WORLD_WIDTH - 4, plGx + spawnDir * distTiles));

                    for (let testGy = Math.max(4, plGy - 4); testGy <= Math.min(WORLD_HEIGHT - 4, plGy + 4); testGy++) {
                        const floorB = curWorld[spawnGx]?.[testGy + 1];
                        const footB = curWorld[spawnGx]?.[testGy];
                        const headB = curWorld[spawnGx]?.[testGy - 1];

                        if (isFluidAt(spawnGx, testGy) || isFluidAt(spawnGx, testGy - 1) || isFluidAt(spawnGx, testGy + 1)) continue;

                        if (floorB !== undefined && isSolidWorldBlock(spawnGx, testGy + 1, floorB) && !isFluidAt(spawnGx, testGy + 1) && floorB !== IDS.LAVA && floorB !== IDS.WATER) {
                            if (footB === IDS.AIR && headB === IDS.AIR) {
                                const gs = new GloomstalkerClass(spawnGx * TILE_SIZE, (testGy - 1) * TILE_SIZE);
                                updatedEntities.push(gs);
                                if (sndFn) sndFn('gloom_screech', { vol: 0.35 });
                                if (PClass && Array.isArray(particles)) {
                                    for (let p = 0; p < 16; p++) {
                                        particles.push(new PClass(gs.x + Math.random() * gs.width, gs.y + Math.random() * gs.height, '#38006b'));
                                    }
                                }
                                if (FTClass && Array.isArray(floatingTexts)) {
                                    floatingTexts.push(new FTClass(curPlayer.x + curPlayer.width / 2, curPlayer.y - 20, "Something watches from the dark...", "#c084fc"));
                                }
                                break;
                            }
                        }
                    }
                    setEngineGloomDreadTimer(-2400);
                }
            } else {
                if (gloomDreadTimer > 0) setEngineGloomDreadTimer(Math.max(0, gloomDreadTimer - 1.5));
            }
        } else {
            setEngineGloomDreadTimer(-1800);
        }
    }
}

export function ensureDesertScorpions() {
    if (typeof getActiveBiomeAt !== 'function') return;
    const curEntities = (typeof entities !== 'undefined' && entities) ? entities : (typeof window !== 'undefined' ? window.entities : null);
    const curWorld = (typeof world !== 'undefined' && world) ? world : (typeof window !== 'undefined' ? window.world : null);
    if (!Array.isArray(curEntities) || !curWorld) return;

    const ScorpionClass = getEntityClass('Scorpion');
    const AtlasExplorerClass = getEntityClass('AtlasExplorer');
    if (!ScorpionClass) return;

    const isNight = timeOfDay >= 0.68 && timeOfDay < 0.90;
    if (!isNight) return;
    const currentScorpions = curEntities.filter(e => e instanceof ScorpionClass).length;
    if (currentScorpions >= 3) return;

    const isNearKael = (cgx, cgy) => {
        for (const e of curEntities) {
            if (AtlasExplorerClass && e instanceof AtlasExplorerClass && !e.isDeparted) {
                const kGx = Math.floor((e.x + e.width / 2) / TILE_SIZE);
                const kGy = Math.floor((e.y + e.height / 2) / TILE_SIZE);
                if (Math.hypot(cgx - kGx, cgy - kGy) < 14) return true;
            }
        }
        return false;
    };

    for (let gx = 10; gx < WORLD_WIDTH - 10; gx += 12) {
        if (getActiveBiomeAt(gx) === 'desert') {
            let gy = 0; while (gy < WORLD_HEIGHT && curWorld[gx]?.[gy] === IDS.AIR) gy++;
            if (gy > 0 && gy < WORLD_HEIGHT && curWorld[gx]?.[gy] === IDS.SAND && !isNearKael(gx, gy) &&
                !isWater(gx, gy) && !isWater(gx, gy - 1) && !isLava(gx, gy) && !isLava(gx, gy - 1) &&
                !getFluid(gx, gy) && !getFluid(gx, gy - 1)) {
                curEntities.push(new ScorpionClass(gx * TILE_SIZE, (gy - 1) * TILE_SIZE));
                if (curEntities.filter(e => e instanceof ScorpionClass).length >= 4) break;
            }
        }
    }
}

// Window self-registration for backward compatibility
try {
    if (typeof window !== 'undefined') {
        window.isNearTorch = isNearTorch;
        window.isNearGloomLantern = isNearGloomLantern;
        window.hasDirectSkyAccess = hasDirectSkyAccess;
        window.spawnAnimals = spawnAnimals;
        window.spawnMobs = spawnMobs;
        window.ensureDesertScorpions = ensureDesertScorpions;
    }
} catch (e) {}