// =============================================================================
// WEBCRAFT 2D - CORE CONSTANTS MODULE (js/core/constants.js)
// Zero-dependency leaf module defining block/item IDs, hardness, durabilities,
// mining tool tiers, physics tuning constants, difficulty tables & type guards.
// =============================================================================

export const TILE_SIZE = 40;
export const GRAVITY = 0.45;
export const TERMINAL_VELOCITY = 15;
export const JUMP_FORCE = -8.5;
export const MOVE_SPEED = 3.6;
export const REACH = 4.2;
export const DAY_LENGTH_FRAMES = 60 * 60 * 20; // 72,000 frames = 20 minutes
export const DAY_LENGTH = 24000;
export const CAVE_SKY_START_TILES = 6;
export const CAVE_SKY_FADE_TILES = 3;
export const SAPLING_GROWTH_DAYS = 2;
export const DIRT_TO_GRASS_DAYS = 1.5;
export const SNOW_REGROWTH_DAYS = 1.0;
export const BED_LENGTH = 2;
export const LEAF_DECAY_MIN_FRAMES = 180;
export const LEAF_DECAY_RANDOM_FRAMES = 180;
export const WATER_FLOW_MAX = 7;
export const LAVA_FLOW_MAX = 3;
export const WATER_FLOW_INTERVAL = 4;
export const LAVA_FLOW_INTERVAL = 16;

export const PHYSICS_TICK_RATE = 60;
export const PHYSICS_TICK_MS = 1000 / PHYSICS_TICK_RATE;

export const DIFFICULTIES = {
    peaceful: { name: 'Peaceful', mobSpawn: 0, mobDmg: 0, starve: false, hpRegen: 40 },
    easy:     { name: 'Easy', mobSpawn: 0.12, mobDmg: 0.75, starve: false, hpRegen: 100 },
    normal:   { name: 'Normal', mobSpawn: 0.28, mobDmg: 1.0, starve: true, hpRegen: 120 },
    hard:     { name: 'Hard', mobSpawn: 0.55, mobDmg: 1.5, starve: true, hpRegen: 160 },
    hardcore: { name: 'Hardcore', mobSpawn: 0.55, mobDmg: 1.5, starve: true, hpRegen: 160, permadeath: true }
};

export const diffDescriptions = {
    peaceful: "Peaceful: No monsters spawn at night. Player health regenerates rapidly and hunger never starves you.",
    easy: "Easy: Monsters spawn less frequently and deal light damage. Creepers produce smaller explosions.",
    normal: "Normal: Standard survival experience with standard monster spawns and hunger depletion.",
    hard: "Hard: Monsters spawn frequently, deal extra damage, creepers swell faster, and hunger drains quicker.",
    hardcore: "Hardcore: Locked to Hard difficulty with PERMANENT DEATH. If you die, your world is permanently deleted!"
};

export function getDayDifficultyMultiplier(dayCount = 1, currentDifficulty = 'normal') {
    if (currentDifficulty === 'peaceful') return 1.0;
    const currentDays = Math.max(1, dayCount);
    const progress = Math.min(50, currentDays - 1);
    return 1 + (progress * 0.045);
}

export function getDayHungerDrainMultiplier(dayCount = 1, currentDifficulty = 'normal') {
    if (currentDifficulty === 'peaceful') return 0;
    const currentDays = Math.max(1, dayCount);
    const progress = Math.min(50, currentDays - 1);
    const baseMult = 1 + (progress * 0.015);
    if (currentDifficulty === 'easy') return 0.5 * baseMult;
    return baseMult;
}

export const IDS = {
    AIR: 0, DIRT: 1, GRASS: 2, STONE: 3, COBBLESTONE: 4, 
    WOOD: 5, LEAVES: 6, PLANKS: 7, COAL_ORE: 8, GOLD_ORE: 9, CRAFTING_TABLE: 10, FURNACE: 11, TORCH: 12,
    SAND: 13, SNOW: 14, CACTUS: 15, BED: 16, IRON_ORE: 17, DIAMOND_ORE: 18, DOOR: 19, DOOR_TOP: 20, DOOR_OPEN: 21, DOOR_OPEN_TOP: 22, SAPLING: 23, WATER: 24, LAVA: 25,
    CHEST: 26, SHORT_GRASS: 27, TALL_GRASS: 28, FLOWER_RED: 29, FLOWER_YELLOW: 30,
    LADDER: 31, WOODEN_STAIRS: 32, WOODEN_STAIRS_LEFT: 32, COBBLESTONE_STAIRS: 33, COBBLESTONE_STAIRS_LEFT: 33,
    WOODEN_STAIRS_RIGHT: 34, COBBLESTONE_STAIRS_RIGHT: 35,
    PLOWED_DIRT: 36, FARMLAND: 36,
    WHEAT_STAGE_1: 37, WHEAT_STAGE_2: 38, WHEAT_STAGE_3: 39, WHEAT_STAGE_4: 40,
    JUKEBOX: 41,
    JUNGLE_WOOD: 42, JUNGLE_LEAVES: 43, JUNGLE_PLANKS: 44, JUNGLE_SAPLING: 45,
    JUNGLE_DOOR: 46, JUNGLE_DOOR_TOP: 47, JUNGLE_DOOR_OPEN: 48, JUNGLE_DOOR_OPEN_TOP: 49,
    VINES: 50, MELON: 51, FERN: 52, BAMBOO: 53, MELON_STEM: 54,
    EMERALD_ORE: 55, PRISM_GLASS: 56, VOID_STONE_BRICK: 57, ASTRAL_INFUSER: 58, VOID_BERRY_BUSH: 59, SUNBURST_MELON: 60,
    SIGN: 61,
    OBSIDIAN: 62,
    STICK: 100, WOOD_PICKAXE: 101, STONE_PICKAXE: 102, 
    WOOD_SWORD: 103, STONE_SWORD: 104, WOOD_AXE: 105, 
    COAL: 106, GOLD_INGOT: 107,
    STONE_AXE: 108, GOLD_PICKAXE: 109, GOLD_SWORD: 110, GOLD_AXE: 111,
    RAW_PORKCHOP: 112, COOKED_PORKCHOP: 113, APPLE: 114,
    RAW_CHICKEN: 115, COOKED_CHICKEN: 116, FEATHER: 117, WOOL: 118, RAW_MUTTON: 119,
    IRON_INGOT: 120, DIAMOND: 121, BUCKET: 128, WATER_BUCKET: 129, LAVA_BUCKET: 130,
    SEEDS: 131, COOKED_MUTTON: 132, BONE: 133, SNOWBALL: 134,
    HELMET_IRON: 135, CHESTPLATE_IRON: 136, LEGGINGS_IRON: 137, BOOTS_IRON: 138,
    HELMET_GOLD: 139, CHESTPLATE_GOLD: 140, LEGGINGS_GOLD: 141, BOOTS_GOLD: 142,
    HELMET_DIAMOND: 143, CHESTPLATE_DIAMOND: 144, LEGGINGS_DIAMOND: 145, BOOTS_DIAMOND: 146,
    IRON_PICKAXE: 122, IRON_SWORD: 123, IRON_AXE: 124,
    DIAMOND_PICKAXE: 125, DIAMOND_SWORD: 126, DIAMOND_AXE: 127,
    WOOD_SHOVEL: 147, STONE_SHOVEL: 148, IRON_SHOVEL: 149, GOLD_SHOVEL: 150, DIAMOND_SHOVEL: 151,
    WOOD_HOE: 152, STONE_HOE: 153, IRON_HOE: 154, GOLD_HOE: 155, DIAMOND_HOE: 156,
    WHEAT: 157, BREAD: 158,
    RAW_BEEF: 159, COOKED_BEEF: 160, LEATHER: 161,
    EMPTY_VINYL: 162, VINYL_DISC: 162,
    MELON_SLICE: 163, MELON_SEEDS: 164,
    ASTRAL_EMERALD: 165, ASTRAL_SHARD: 166,
    VOID_BERRY_SPORES: 167, VOID_BERRY: 168,
    SUNBURST_MELON_SEEDS: 169, SUNBURST_MELON_SLICE: 170,
    MUSIC_DISC_SYNTHWAVE: 171, MUSIC_DISC_AMBIENT: 172,
    KINETIC_SHEARS: 173, STRIDER_BOOTS: 174,
    ASTRAL_SWORD: 175, ASTRAL_PICKAXE: 176, ASTRAL_AXE: 177, ASTRAL_SHOVEL: 178,
    ASTRAL_HELMET: 179, ASTRAL_CHESTPLATE: 180, ASTRAL_LEGGINGS: 181, ASTRAL_BOOTS: 182,
    EMERALD: 183,
    GLOOM_SILK: 184,
    SHADOW_CARAPACE: 185,
    SHADOWFANG: 186,
    GLOOM_LANTERN: 187
};

export const HARDNESS = {
    [IDS.DIRT]: 20, [IDS.PLOWED_DIRT]: 20, [IDS.GRASS]: 25, [IDS.STONE]: 150, [IDS.COBBLESTONE]: 150,
    [IDS.WOOD]: 60, [IDS.LEAVES]: 5, [IDS.PLANKS]: 60, [IDS.COAL_ORE]: 160, 
    [IDS.GOLD_ORE]: 180, [IDS.IRON_ORE]: 180, [IDS.DIAMOND_ORE]: 240,
    [IDS.CRAFTING_TABLE]: 60, [IDS.FURNACE]: 150, [IDS.TORCH]: 5, [IDS.SAPLING]: 5,
    [IDS.JUKEBOX]: 60,
    [IDS.SHORT_GRASS]: 1, [IDS.TALL_GRASS]: 1, [IDS.FLOWER_RED]: 1, [IDS.FLOWER_YELLOW]: 1,
    [IDS.WHEAT_STAGE_1]: 1, [IDS.WHEAT_STAGE_2]: 1, [IDS.WHEAT_STAGE_3]: 1, [IDS.WHEAT_STAGE_4]: 1,
    [IDS.SAND]: 15, [IDS.SNOW]: 10, [IDS.CACTUS]: 20, [IDS.BED]: 30,
    [IDS.DOOR]: 45, [IDS.DOOR_TOP]: 45, [IDS.DOOR_OPEN]: 45, [IDS.DOOR_OPEN_TOP]: 45, [IDS.CHEST]: 45,
    [IDS.LADDER]: 10, [IDS.WOODEN_STAIRS]: 60, [IDS.WOODEN_STAIRS_RIGHT]: 60,
    [IDS.COBBLESTONE_STAIRS]: 150, [IDS.COBBLESTONE_STAIRS_RIGHT]: 150,
    [IDS.WATER]: 1, [IDS.LAVA]: 1,
    [IDS.JUNGLE_WOOD]: 60, [IDS.JUNGLE_LEAVES]: 5, [IDS.JUNGLE_PLANKS]: 60, [IDS.JUNGLE_SAPLING]: 5,
    [IDS.JUNGLE_DOOR]: 45, [IDS.JUNGLE_DOOR_TOP]: 45, [IDS.JUNGLE_DOOR_OPEN]: 45, [IDS.JUNGLE_DOOR_OPEN_TOP]: 45,
    [IDS.VINES]: 5, [IDS.MELON]: 30, [IDS.FERN]: 1, [IDS.BAMBOO]: 15, [IDS.MELON_STEM]: 1,
    [IDS.EMERALD_ORE]: 240, [IDS.PRISM_GLASS]: 15, [IDS.VOID_STONE_BRICK]: 200,
    [IDS.ASTRAL_INFUSER]: 250, [IDS.VOID_BERRY_BUSH]: 10, [IDS.SUNBURST_MELON]: 30,
    [IDS.SIGN]: 15,
    [IDS.OBSIDIAN]: 500
};

export const ID_NAMES = Object.fromEntries(Object.entries(IDS).map(([k, v]) => [v, k.replace(/_/g, ' ')]));
ID_NAMES[IDS.SAPLING] = 'Oak Sapling';
ID_NAMES[IDS.JUKEBOX] = 'Jukebox';
ID_NAMES[IDS.EMPTY_VINYL] = 'Vinyl Disc';
ID_NAMES[IDS.SHORT_GRASS] = 'Short Grass';
ID_NAMES[IDS.TALL_GRASS] = 'Tall Grass';
ID_NAMES[IDS.FLOWER_RED] = 'Poppy';
ID_NAMES[IDS.FLOWER_YELLOW] = 'Dandelion';
ID_NAMES[IDS.SEEDS] = 'Seeds';
ID_NAMES[IDS.PLOWED_DIRT] = 'Farmland';
ID_NAMES[IDS.WHEAT_STAGE_1] = 'Wheat Crop';
ID_NAMES[IDS.WHEAT_STAGE_2] = 'Wheat Crop';
ID_NAMES[IDS.WHEAT_STAGE_3] = 'Wheat Crop';
ID_NAMES[IDS.WHEAT_STAGE_4] = 'Wheat Crop';
ID_NAMES[IDS.WOOD_SHOVEL] = 'Wooden Shovel';
ID_NAMES[IDS.STONE_SHOVEL] = 'Stone Shovel';
ID_NAMES[IDS.IRON_SHOVEL] = 'Iron Shovel';
ID_NAMES[IDS.GOLD_SHOVEL] = 'Golden Shovel';
ID_NAMES[IDS.DIAMOND_SHOVEL] = 'Diamond Shovel';
ID_NAMES[IDS.WOOD_HOE] = 'Wooden Hoe';
ID_NAMES[IDS.STONE_HOE] = 'Stone Hoe';
ID_NAMES[IDS.IRON_HOE] = 'Iron Hoe';
ID_NAMES[IDS.GOLD_HOE] = 'Golden Hoe';
ID_NAMES[IDS.DIAMOND_HOE] = 'Diamond Hoe';
ID_NAMES[IDS.WHEAT] = 'Wheat';
ID_NAMES[IDS.BREAD] = 'Bread';
ID_NAMES[IDS.RAW_MUTTON] = 'Raw Mutton';
ID_NAMES[IDS.COOKED_MUTTON] = 'Cooked Mutton';
ID_NAMES[IDS.RAW_BEEF] = 'Raw Beef';
ID_NAMES[IDS.COOKED_BEEF] = 'Cooked Beef';
ID_NAMES[IDS.LEATHER] = 'Leather';
ID_NAMES[IDS.BONE] = 'Bone';
ID_NAMES[IDS.SNOWBALL] = 'Snowball';
ID_NAMES[IDS.LADDER] = 'Ladder';
ID_NAMES[IDS.WOODEN_STAIRS] = 'Oak Stairs';
ID_NAMES[IDS.WOODEN_STAIRS_RIGHT] = 'Oak Stairs';
ID_NAMES[IDS.COBBLESTONE_STAIRS] = 'Cobblestone Stairs';
ID_NAMES[IDS.COBBLESTONE_STAIRS_RIGHT] = 'Cobblestone Stairs';
ID_NAMES[IDS.HELMET_IRON] = 'Iron Helmet';
ID_NAMES[IDS.CHESTPLATE_IRON] = 'Iron Chestplate';
ID_NAMES[IDS.LEGGINGS_IRON] = 'Iron Leggings';
ID_NAMES[IDS.BOOTS_IRON] = 'Iron Boots';
ID_NAMES[IDS.HELMET_GOLD] = 'Golden Helmet';
ID_NAMES[IDS.JUNGLE_WOOD] = 'Jungle Wood';
ID_NAMES[IDS.JUNGLE_LEAVES] = 'Jungle Leaves';
ID_NAMES[IDS.JUNGLE_PLANKS] = 'Jungle Planks';
ID_NAMES[IDS.JUNGLE_SAPLING] = 'Jungle Sapling';
ID_NAMES[IDS.JUNGLE_DOOR] = 'Jungle Door';
ID_NAMES[IDS.JUNGLE_DOOR_TOP] = 'Jungle Door';
ID_NAMES[IDS.JUNGLE_DOOR_OPEN] = 'Jungle Door';
ID_NAMES[IDS.JUNGLE_DOOR_OPEN_TOP] = 'Jungle Door';
ID_NAMES[IDS.VINES] = 'Vines';
ID_NAMES[IDS.MELON] = 'Melon';
ID_NAMES[IDS.FERN] = 'Fern';
ID_NAMES[IDS.BAMBOO] = 'Bamboo';
ID_NAMES[IDS.MELON_STEM] = 'Melon Stem';
ID_NAMES[IDS.MELON_SLICE] = 'Melon Slice';
ID_NAMES[IDS.MELON_SEEDS] = 'Melon Seeds';
ID_NAMES[IDS.CHESTPLATE_GOLD] = 'Golden Chestplate';
ID_NAMES[IDS.LEGGINGS_GOLD] = 'Golden Leggings';
ID_NAMES[IDS.BOOTS_GOLD] = 'Golden Boots';
ID_NAMES[IDS.HELMET_DIAMOND] = 'Diamond Helmet';
ID_NAMES[IDS.CHESTPLATE_DIAMOND] = 'Diamond Chestplate';
ID_NAMES[IDS.LEGGINGS_DIAMOND] = 'Diamond Leggings';
ID_NAMES[IDS.BOOTS_DIAMOND] = 'Diamond Boots';
ID_NAMES[IDS.EMERALD_ORE] = 'Emerald Ore';
ID_NAMES[IDS.PRISM_GLASS] = 'Prism Glass';
ID_NAMES[IDS.VOID_STONE_BRICK] = 'Void Stone Brick';
ID_NAMES[IDS.ASTRAL_INFUSER] = 'Astral Infuser';
ID_NAMES[IDS.VOID_BERRY_BUSH] = 'Void Berry Bush';
ID_NAMES[IDS.SUNBURST_MELON] = 'Sunburst Melon';
ID_NAMES[IDS.ASTRAL_EMERALD] = 'Astral Emerald';
ID_NAMES[IDS.ASTRAL_SHARD] = 'Astral Shard';
ID_NAMES[IDS.VOID_BERRY_SPORES] = 'Void Berry Spores';
ID_NAMES[IDS.VOID_BERRY] = 'Void Berry';
ID_NAMES[IDS.SUNBURST_MELON_SEEDS] = 'Sunburst Melon Seeds';
ID_NAMES[IDS.SUNBURST_MELON_SLICE] = 'Sunburst Melon Slice';
ID_NAMES[IDS.MUSIC_DISC_SYNTHWAVE] = 'Audio Relic - Neon Horizon';
ID_NAMES[IDS.MUSIC_DISC_AMBIENT] = 'Audio Relic - Echoes of the Void';
ID_NAMES[IDS.KINETIC_SHEARS] = 'Kinetic Shears';
ID_NAMES[IDS.STRIDER_BOOTS] = 'Strider Boots';
ID_NAMES[IDS.ASTRAL_SWORD] = 'Astral Sword';
ID_NAMES[IDS.ASTRAL_PICKAXE] = 'Astral Pickaxe';
ID_NAMES[IDS.ASTRAL_AXE] = 'Astral Axe';
ID_NAMES[IDS.ASTRAL_SHOVEL] = 'Astral Shovel';
ID_NAMES[IDS.ASTRAL_HELMET] = 'Astral Helmet';
ID_NAMES[IDS.ASTRAL_CHESTPLATE] = 'Astral Chestplate';
ID_NAMES[IDS.ASTRAL_LEGGINGS] = 'Astral Leggings';
ID_NAMES[IDS.ASTRAL_BOOTS] = 'Astral Boots';
ID_NAMES[IDS.EMERALD] = 'Emerald';
ID_NAMES[IDS.SIGN] = 'Sign';
ID_NAMES[IDS.GLOOM_SILK] = 'Gloom Silk';
ID_NAMES[IDS.SHADOW_CARAPACE] = 'Shadow Carapace';
ID_NAMES[IDS.SHADOWFANG] = 'Shadowfang Dagger';
ID_NAMES[IDS.GLOOM_LANTERN] = 'Gloom Lantern';

export const TOOL_DURABILITY = {
    [IDS.WOOD_PICKAXE]: 60, [IDS.WOOD_AXE]: 60, [IDS.WOOD_SWORD]: 60,
    [IDS.WOOD_SHOVEL]: 60, [IDS.WOOD_HOE]: 60,
    [IDS.STONE_PICKAXE]: 120, [IDS.STONE_AXE]: 120, [IDS.STONE_SWORD]: 120,
    [IDS.STONE_SHOVEL]: 120, [IDS.STONE_HOE]: 120,
    [IDS.IRON_PICKAXE]: 240, [IDS.IRON_AXE]: 240, [IDS.IRON_SWORD]: 240,
    [IDS.IRON_SHOVEL]: 240, [IDS.IRON_HOE]: 240,
    [IDS.GOLD_PICKAXE]: 180, [IDS.GOLD_AXE]: 180, [IDS.GOLD_SWORD]: 180,
    [IDS.GOLD_SHOVEL]: 180, [IDS.GOLD_HOE]: 180,
    [IDS.DIAMOND_PICKAXE]: 480, [IDS.DIAMOND_AXE]: 480, [IDS.DIAMOND_SWORD]: 480,
    [IDS.DIAMOND_SHOVEL]: 480, [IDS.DIAMOND_HOE]: 480,
    [IDS.ASTRAL_PICKAXE]: 750, [IDS.ASTRAL_AXE]: 750, [IDS.ASTRAL_SWORD]: 750,
    [IDS.ASTRAL_SHOVEL]: 750, [IDS.KINETIC_SHEARS]: 500, [IDS.SHADOWFANG]: 450
};

export const ARMOR_DURABILITY = {
    [IDS.HELMET_IRON]: 165, [IDS.CHESTPLATE_IRON]: 240, [IDS.LEGGINGS_IRON]: 225, [IDS.BOOTS_IRON]: 195,
    [IDS.HELMET_GOLD]: 77, [IDS.CHESTPLATE_GOLD]: 112, [IDS.LEGGINGS_GOLD]: 105, [IDS.BOOTS_GOLD]: 91,
    [IDS.HELMET_DIAMOND]: 363, [IDS.CHESTPLATE_DIAMOND]: 528, [IDS.LEGGINGS_DIAMOND]: 495, [IDS.BOOTS_DIAMOND]: 429,
    [IDS.ASTRAL_HELMET]: 520, [IDS.ASTRAL_CHESTPLATE]: 650, [IDS.ASTRAL_LEGGINGS]: 600, [IDS.ASTRAL_BOOTS]: 540,
    [IDS.STRIDER_BOOTS]: 500
};

export const ARMOR_DEFENSE = {
    [IDS.HELMET_IRON]: 2, [IDS.CHESTPLATE_IRON]: 6, [IDS.LEGGINGS_IRON]: 5, [IDS.BOOTS_IRON]: 2,
    [IDS.HELMET_GOLD]: 2, [IDS.CHESTPLATE_GOLD]: 5, [IDS.LEGGINGS_GOLD]: 3, [IDS.BOOTS_GOLD]: 1,
    [IDS.HELMET_DIAMOND]: 3, [IDS.CHESTPLATE_DIAMOND]: 8, [IDS.LEGGINGS_DIAMOND]: 6, [IDS.BOOTS_DIAMOND]: 3,
    [IDS.ASTRAL_HELMET]: 4, [IDS.ASTRAL_CHESTPLATE]: 9, [IDS.ASTRAL_LEGGINGS]: 7, [IDS.ASTRAL_BOOTS]: 4,
    [IDS.STRIDER_BOOTS]: 2
};

export const ARMOR_SLOT_TYPE = {
    [IDS.HELMET_IRON]: 0, [IDS.HELMET_GOLD]: 0, [IDS.HELMET_DIAMOND]: 0, [IDS.ASTRAL_HELMET]: 0,
    [IDS.CHESTPLATE_IRON]: 1, [IDS.CHESTPLATE_GOLD]: 1, [IDS.CHESTPLATE_DIAMOND]: 1, [IDS.ASTRAL_CHESTPLATE]: 1,
    [IDS.LEGGINGS_IRON]: 2, [IDS.LEGGINGS_GOLD]: 2, [IDS.LEGGINGS_DIAMOND]: 2, [IDS.ASTRAL_LEGGINGS]: 2,
    [IDS.BOOTS_IRON]: 3, [IDS.BOOTS_GOLD]: 3, [IDS.BOOTS_DIAMOND]: 3, [IDS.ASTRAL_BOOTS]: 3,
    [IDS.STRIDER_BOOTS]: 3
};

export function isArmor(id) {
    return ARMOR_SLOT_TYPE[id] !== undefined;
}

export function getArmorSlotIndex(id) {
    return ARMOR_SLOT_TYPE[id] !== undefined ? ARMOR_SLOT_TYPE[id] : -1;
}


export function ensureToolDurability(item) {
    if (!item || !isTool(item.id)) return item;
    if (item.durability === undefined) {
        const max = TOOL_DURABILITY[item.id] || 60;
        item.durability = max;
        item.maxDurability = max;
    }
    return item;
}

export function ensureArmorDurability(item) {
    if (!item || !isArmor(item.id)) return;
    if (item.durability === undefined) {
        item.durability = ARMOR_DURABILITY[item.id] || 100;
    }
}

export const MINING_TOOL_TIERS = {
    [IDS.WOOD_PICKAXE]: 1,
    [IDS.STONE_PICKAXE]: 2,
    [IDS.IRON_PICKAXE]: 3,
    [IDS.GOLD_PICKAXE]: 4,
    [IDS.DIAMOND_PICKAXE]: 5,
    [IDS.ASTRAL_PICKAXE]: 6
};

export function getRequiredMiningTier(blockId) {
    if (blockId === IDS.STONE || blockId === IDS.COAL_ORE || blockId === IDS.COBBLESTONE || blockId === IDS.FURNACE || blockId === IDS.COBBLESTONE_STAIRS || blockId === IDS.COBBLESTONE_STAIRS_LEFT || blockId === IDS.COBBLESTONE_STAIRS_RIGHT) return 1;
    if (blockId === IDS.IRON_ORE || blockId === IDS.VOID_STONE_BRICK) return 2;
    if (blockId === IDS.GOLD_ORE || blockId === IDS.DIAMOND_ORE || blockId === IDS.EMERALD_ORE || blockId === IDS.ASTRAL_INFUSER) return 3;
    if (blockId === IDS.OBSIDIAN) return 5;
    return 0;
}

export function isPickaxe(id) {
    return id === IDS.WOOD_PICKAXE || id === IDS.STONE_PICKAXE || id === IDS.IRON_PICKAXE ||
           id === IDS.GOLD_PICKAXE || id === IDS.DIAMOND_PICKAXE || id === IDS.ASTRAL_PICKAXE;
}

export function isAxe(id) {
    return id === IDS.WOOD_AXE || id === IDS.STONE_AXE || id === IDS.IRON_AXE ||
           id === IDS.GOLD_AXE || id === IDS.DIAMOND_AXE || id === IDS.ASTRAL_AXE;
}

export function isShovel(id) {
    return id === IDS.WOOD_SHOVEL || id === IDS.STONE_SHOVEL || id === IDS.IRON_SHOVEL ||
           id === IDS.GOLD_SHOVEL || id === IDS.DIAMOND_SHOVEL || id === IDS.ASTRAL_SHOVEL;
}

export function isSword(id) {
    return id === IDS.WOOD_SWORD || id === IDS.STONE_SWORD || id === IDS.IRON_SWORD ||
           id === IDS.GOLD_SWORD || id === IDS.DIAMOND_SWORD || id === IDS.ASTRAL_SWORD ||
           id === IDS.SHADOWFANG;
}

export function isHoe(id) {
    return id === IDS.WOOD_HOE || id === IDS.STONE_HOE || id === IDS.IRON_HOE ||
           id === IDS.GOLD_HOE || id === IDS.DIAMOND_HOE;
}

export function isShears(id) {
    return id === IDS.KINETIC_SHEARS || (typeof IDS.SHEARS !== 'undefined' && id === IDS.SHEARS);
}

export function isTool(id) {
    return isPickaxe(id) || isAxe(id) || isShovel(id) || isSword(id) || isHoe(id) || isShears(id);
}

export function isPickaxeBlock(blockId) {
    return blockId === IDS.STONE ||
           blockId === IDS.COBBLESTONE ||
           blockId === IDS.COAL_ORE ||
           blockId === IDS.IRON_ORE ||
           blockId === IDS.GOLD_ORE ||
           blockId === IDS.DIAMOND_ORE ||
           blockId === IDS.EMERALD_ORE ||
           blockId === IDS.FURNACE ||
           blockId === IDS.COBBLESTONE_STAIRS ||
           blockId === IDS.COBBLESTONE_STAIRS_LEFT ||
           blockId === IDS.COBBLESTONE_STAIRS_RIGHT ||
           blockId === IDS.VOID_STONE_BRICK ||
           blockId === IDS.ASTRAL_INFUSER;
}

export function isAxeBlock(blockId) {
    return blockId === IDS.WOOD ||
           blockId === IDS.PLANKS ||
           blockId === IDS.JUNGLE_WOOD ||
           blockId === IDS.JUNGLE_PLANKS ||
           blockId === IDS.WOODEN_STAIRS ||
           blockId === IDS.WOODEN_STAIRS_LEFT ||
           blockId === IDS.WOODEN_STAIRS_RIGHT ||
           blockId === IDS.CRAFTING_TABLE ||
           blockId === IDS.CHEST ||
           blockId === IDS.DOOR ||
           blockId === IDS.DOOR_TOP ||
           blockId === IDS.DOOR_OPEN ||
           blockId === IDS.DOOR_OPEN_TOP ||
           blockId === IDS.JUNGLE_DOOR ||
           blockId === IDS.JUNGLE_DOOR_TOP ||
           blockId === IDS.JUNGLE_DOOR_OPEN ||
           blockId === IDS.JUNGLE_DOOR_OPEN_TOP ||
           blockId === IDS.JUKEBOX ||
           blockId === IDS.LADDER ||
           blockId === IDS.BAMBOO ||
           blockId === IDS.SIGN ||
           blockId === IDS.MELON ||
           blockId === IDS.SUNBURST_MELON;
}

export function isShovelBlock(blockId) {
    return blockId === IDS.DIRT ||
           blockId === IDS.GRASS ||
           blockId === IDS.PLOWED_DIRT ||
           blockId === IDS.FARMLAND ||
           blockId === IDS.SAND ||
           blockId === IDS.SNOW;
}

export function isShearsBlock(blockId) {
    return blockId === IDS.LEAVES ||
           blockId === IDS.JUNGLE_LEAVES ||
           blockId === IDS.VINES ||
           blockId === IDS.SHORT_GRASS ||
           blockId === IDS.TALL_GRASS ||
           blockId === IDS.FERN ||
           blockId === IDS.VOID_BERRY_BUSH;
}

export const BACKGROUND_BUILDING_BLOCKS = new Set([
    IDS.DIRT, IDS.GRASS, IDS.STONE, IDS.COBBLESTONE, IDS.WOOD, IDS.PLANKS,
    IDS.SAND, IDS.SNOW, IDS.WOOL, IDS.WOODEN_STAIRS, IDS.COBBLESTONE_STAIRS,
    IDS.WOODEN_STAIRS_RIGHT, IDS.COBBLESTONE_STAIRS_RIGHT,
    IDS.JUNGLE_WOOD, IDS.JUNGLE_PLANKS,
    IDS.VOID_STONE_BRICK, IDS.PRISM_GLASS, IDS.OBSIDIAN
]);

export function isBackgroundBuildingBlock(id) {
    return BACKGROUND_BUILDING_BLOCKS.has(id);
}

export function isFoodItem(id) {
    return id === IDS.RAW_PORKCHOP || id === IDS.COOKED_PORKCHOP || id === IDS.APPLE ||
           id === IDS.RAW_CHICKEN || id === IDS.COOKED_CHICKEN || id === IDS.RAW_MUTTON ||
           id === IDS.COOKED_MUTTON || id === IDS.BREAD ||
           id === IDS.RAW_BEEF || id === IDS.COOKED_BEEF || id === IDS.MELON_SLICE ||
           id === IDS.VOID_BERRY || id === IDS.SUNBURST_MELON_SLICE;
}

export function isLeafBlock(id) {
    return id === IDS.LEAVES || id === IDS.PINE_LEAVES || id === IDS.JUNGLE_LEAVES;
}

export function isFoliageOrAir(id) {
    return id === IDS.AIR || id === IDS.SHORT_GRASS || id === IDS.TALL_GRASS ||
           id === IDS.FLOWER_RED || id === IDS.FLOWER_YELLOW || id === IDS.FERN ||
           id === IDS.VINES || id === IDS.SNOW || isLeafBlock(id);
}

export const PATCH_NOTES_0_1_6 = {
    title: 'Beta 0.1.6 (Smarter Hostile Mobs, Door Breaches & Combat Overhaul)',
    items: [
        'Smarter Zombie AI & Bloodlust Frenzy: Undead mobs sprint aggressively when pursuing players or when below 50% health, detect and leap 2-block walls, and unleash airborne leap attacks.',
        'Undead Alert Pulse (Call of the Undead): Striking a zombie alerts all nearby zombies within 16-24 blocks, sending them into an aggressive frenzy.',
        'Shelter Defense & Door Breaching: Zombies and hostile mobs attack wooden doors when blocked. On Normal and Hard difficulty, sustained strikes will splinter and breach doors.',
        'Weapon-Tiered Knockback System: Bare hands and building blocks no longer stunlock mobs. Swords and axes deliver authentic tiered knockback from Wood through Diamond and Astral tiers.',
        'Mob Poise & Knockback Resistance: Hostile mobs gain poise and knockback resistance on Normal (20%) and Hard (45%), preventing them from being endlessly juggled by low-tier strikes.',
        'Tactical Creeper Stalking & Ambush: Creepers approach slowly while you watch, but sprint silently when your back is turned. Creepers dropping from ledges prime their explosion fuse mid-air.',
        'Desert Scorpion Camouflage & Evasion: Scorpions bury beneath desert sand when idle, bursting out to ambush approaching players, and performing tactical backward evasive hops after striking.',
        'Procedural Web Audio & Bioluminescence: Added procedural audio for zombie roars, snarling jaws, door bashing, door splintering, and creeper hisses. Hostile mobs feature glowing bioluminescent eyes in subterranean caves and night shadows.',
        'Beta 0.1.5 World Forward-Compatibility: Seamless one-click conversion for worlds created in Beta 0.1.5, safely preserving 100% of terrain, blocks, chests, items, player inventories, and coordinates while unlocking 0.1.6 mechanics.',
        'One-Click World Backup: Integrated instant local JSON backup export directly within the world conversion screen prior to upgrading.',
        'Corner Control Hints & Tutorial: Added interactive bottom-left HUD hotkey hints ([C] Emerald Vault, [L] Achievements, [M] World Map, [B] Background Build) with authentic pixel-art keycaps, plus a toggle in Settings to customize visibility.',
        'Unboxed Retro Cassette Autosave: Overhauled autosave notifications into an unboxed, large retro pixel-art cassette tape with animated spinning reels and crisp text.',
        'Circular Radar Minimap Default: The minimap now defaults to the circular radar shape for a modern, sleek HUD view.',
        'Offhand Quick-Swap & Full Stack Drop: Instantly swap held items into the offhand slot using the customizable [F] key or by clicking the HUD offhand slot, and drop entire item stacks at once with [Ctrl + Q].',
        'Webcraft Store & Wardrobe Overhaul: Ground-up overhaul of the Webcraft Store with authentic retro pixel-art shop box UI, generous breathing room and spacious multi-column layout, crisp zero-blur typography (zero blurry text glows or halos), authentic 3D beveled inventory slot wells, sunken display pedestals, and polished Live Try-On preview.'
    ]
};

export const PATCH_NOTES_0_1_5 = {
    title: 'Beta 0.1.5 (Jungle Biome, Avian Wildlife, Atlas Explorer, Terraria Caverns & Cosmetics Overhaul)',
    items: [
        'Jungle Biome & Canopy Ecosystem: Dynamic procedural generation of vibrant tropical Jungle biomes featuring towering Jungle Trees with winding climbable vines, lush canopy umbrellas, hanging understory vegetation, and dense shrubbery.',
        'Jungle Wood & Timber Progression: Harvest Jungle Logs to craft rich auburn Jungle Wood Planks, sticks, and cultivate saplings to grow towering rainforest canopies anywhere.',
        'Authentic Jungle Doors: Craftable Jungle Doors featuring authentic dual-state pixel textures—an open front-facing porthole window with polished wood trim and a thin closed side profile slit—paired with custom wooden door sound effects and precise collision bounds.',
        'Wild Melons & Tropical Agriculture: Discover wild melon blocks scattered across jungle clearings. Break them to collect fresh Melon Slices for instant hunger restoration, or combine with gold nuggets to craft Glistering Melons.',
        'Exotic Avian Wildlife (Parrots): Lush jungles are now alive with wild Parrots inhabiting treetops in 5 authentic, vibrant color morphs (Red Scarlet Macaw, Blue Macaw, Vibrant Green, Cyan, and Gray).',
        'Parrot Taming & Shoulder Companions: Feed wild parrots seeds to tame them, celebrated with charming floating heart particles. Tamed parrots follow you across biomes, perch comfortably on your shoulder, and whistle tropical melodies.',
        'Sweet Avian Wildlife (Pigeons): Populated plains and forest biomes with sweet, innocent Pigeons featuring charming pixel art, shimmering emerald-violet neck plumage, and rhythmic head bobs.',
        'Aerodynamic Flight Physics & Leaf Perching: Both Pigeons and Parrots possess genuine flight dynamics, flapping wings to soar effortlessly above tree canopies, smoothly banking into turns, gliding gracefully, and landing softly on leaves to perch and rest.',
        'Ground Foraging, Startle Reflexes & Flocking: Birds land on open fields to hunt for seeds, walking with realistic head bobs. Approaching without seeds causes wild birds to startle and scatter, while holding seeds pacifies them and triggers flocking calls that summon nearby companions.',
        'Social Pairing & Bittersweet Achievements: Pigeons often roam and fly in synchronized pairs. Defeating an innocent pigeon unlocks the bittersweet Master achievement "Why Would You Do That?"... they drop no loot, and the world feels a little quieter.',
        'Kael, The Atlas Explorer (Planar NPC): Experience the cinematic arrival of dimensional cartographer Kael, entering your world through a swirling, animated pixel rift portal complete with cosmic stardust ripples, deep dimensional audio, and floating announcement banners.',
        'Permanent World Settlement: Once summoned, Kael settles permanently into your world as an immortal dimensional cartographer and trader, never despawning across day/night cycles, world exits, or restarts.',
        'Planar Sanctuary Aura: Kael projects an active 4.5-block dimensional ward that repels hostile mobs (Zombies, Creepers, Scorpions) with cosmic lilac ripples, instantly defuses Creeper explosion fuses to zero, shields surrounding terrain blocks from blast damage, and suppresses hostile spawns within 14 blocks.',
        'The Atlas Market (Planar Outpost): Interact with Kael using "E" to explore rich planar lore and access the Atlas Market, organized into a clean 5-column categorized interface offering rare dimensional curios, planar tools, and otherworldly commodities.',
        'Astral Infuser Workstation: Channel Astral Emeralds and Planar Gems through the newly introduced Astral Infuser workstation to forge legendary Astral armor sets and empowered utilities.',
        'Astral Armor & Cosmic Protection: Craft the full Astral Armor set (Astral Helmet, Chestplate, Leggings, and Boots) radiating ethereal amethyst particles, granting enhanced defense ratings and mystical protection upon respawn.',
        'Kinetic Shears & Planar Relics: Unlock high-efficiency Kinetic Shears for instant leaf and vine harvesting, alongside specialized relics that expand late-game survival capabilities.',
        'Terraria-Style Subterranean Cavern Shadows: Underground exploration now features deep cavern wall backdrop textures (stone, dirt, sand) that conceal the exterior sky, seamlessly transitioning into 98.8% deep inky blackness (#000006) for authentic subterranean mystery.',
        'Subterranean Depth Offset: Surface daylight now penetrates 6 blocks into the ground, ensuring shallow coal seams, iron deposits, and cave mouths remain clearly visible during daylight before fading smoothly into subterranean blackness.',
        'Direct Sky Access Daylight Raycasting: Replaced naive surface height calculations with dynamic direct-sky access checks, eliminating vertical black shadow glitches and ensuring daylight floods open ravines and cliffside openings naturally.',
        'Diverse & Interconnected Caverns: Overhauled subterranean cave generation with vastly expanded cavern systems, winding subterranean tunnels, soaring underground chambers, vertical shafts, and subterranean water and lava reservoirs.',
        'Real-time In-World Signboards: Craft wooden signs and place them anywhere. Right-clicking opens an in-world floating speech bubble anchored directly above the signpost with smooth camera tracking, displaying your text in real time.',
        'Interactive Sign Editor & Auto-Save: Features a live blinking cursor ("|"), multi-line text input (up to 4 lines with Shift+Enter), and effortless multi-trigger auto-saving (pressing Enter, right-clicking outside, or simply walking away).',
        'Sign Tooltips & Multiplayer Sync: Aiming at signs from a distance displays a clear hover tooltip with the sign\'s contents. Sign placement, edits, and deletions are fully synchronized in real-time across peer-to-peer multiplayer.',
        'Discord-Style Profile Customization: Redesigned the Player Profile screen with full visual customization, showcasing avatar banners, frame wrappers, custom crafter titles, Planar Tier badges, Astral Gem counters, and custom pixel-art scrollbars.',
        'Cosmetics Catalog System: Introduced a modular cosmetics catalog system featuring collectible avatar frames, profile banners, crafter titles, and UI color themes that persist across sessions.',
        'Chest Storage Integrity & Double Chest Architecture: Re-engineered container serialization for both Small (27-slot) and Large Double (54-slot) chests with deep item cloning, eliminating item loss across world quits, page reloads, and browser restarts.',
        'Fabulous Shaders & Settings Menu: Dedicated "Fabulous Settings" panel with granular toggle switches for Volumetric God Rays, Wind Breeze Foliage Animations, Desert Heat Shimmer, Ambient Firefly Swarms, Vignette, and Ambient Occlusion.',
        'Dynamic FPS Cap Selector: Configurable frame rate limiter (30 FPS, 60 FPS, 120 FPS, 144 FPS, and Unlimited) with persistent local storage to match your monitor\'s refresh rate and conserve laptop battery.',
        'Smooth Day Transition Respawning: Animal respawn queues are now deferred and distributed smoothly across morning frames, completely eliminating hitching and frame drops when waking up or transitioning from night to day.',
        'Tree Canopy Navigation & Foliage Pass: Sanitized tree wood and leaf collision handling to ensure smooth vertical climbing and exploration through dense forests and jungle canopies without snagging.',
        'Culinary Texture Revamp: Re-illustrated mouth-watering 16x16 pixel-art food textures for Cooked Porkchops, Bread, Raw and Cooked Beef, Golden Apples, and Melons.',
        'Difficulty & Hunger Rebalancing: Rebalanced hunger saturation, sprint exhaustion rates, health regeneration curves, and mob damage multipliers across Peaceful, Easy, Normal, Hard, and Hardcore modes.',
        'Universal Timber Recipes: All crafting recipes accepting wooden planks now flexibly accept any wood type (Oak, Jungle, and future timber variants) seamlessly.',
        'New Achievements & Emerald Rewards: Unlock brand-new achievements including "Polly Want a Cracker?" (Tame a wild parrot), "Why Would You Do That?" (Bittersweet pigeon achievement), "Planar Commerce" (Trade with Kael), and "Astral Engineering" (Craft the Astral Infuser).'
    ]
};

export const PATCH_NOTES_0_1_4_PATCH_1 = {
    title: 'Beta 0.1.4 (Patch 1 - Visuals, Combat & UI Polish)',
    items: [
        'Authentic 16x16 Pixel-Art Block Breaking Animation: Upgraded the block breaking animation to an authentic 16x16 texel fracture system across 10 progressive stages, featuring dual-pass 3D relief highlights, dark core hairline fissures, block damage stress darkening, and integer-snapped physical micro-vibration.',
        'Symmetrical Inventory Equipment Showcase: Redesigned the backpack equipment panel with a balanced, symmetrical 54px right-side container mirroring the vertical armor slots. Integrates the Offhand slot, stone pixel divider, and a compact pixel-art Defense Station with high-contrast text and dynamic tooltips.',
        'Furnace UI Aesthetic Refinement: Removed the fire emoji and orange text glow from the Furnace header, restoring an authentic pixel-art stone aesthetic matching the rest of the game UI.',
        'Daytime Hostile Mob Spawning Prevention: Fixed hostile mob spawning algorithms to prevent creepers, zombies, skeletons, spiders, and desert scorpions from spawning during daytime hours and after sleeping in a bed.',
        'Inventory Item Hover Tooltips: Added interactive pixel-art tooltips displaying item names and metadata upon hovering over slots across inventory, hotbar, chest, furnace, armor, and offhand slots.',
        'Escape Key Navigation Hierarchy: Pressing the Escape key now intelligently closes foreground container interfaces (Crafting Table, Furnace, Chest, Backpack) first before opening the Pause Menu.'
    ]
};

export const PATCH_NOTES_0_1_4 = {
    title: 'Beta 0.1.4 (Farming, Livestock, Jukebox & Mechanics Overhaul)',
    items: [
        'Agriculture & Farmland System: Craft hoes to till grass and dirt into fertile Farmland blocks. Farmland dynamically stays moist and hydrated when near water sources (within 4 blocks) and supports crop cultivation.',
        'Progressive 4-Stage Wheat Farming: Plant wheat seeds on farmland to cultivate wheat across 4 authentic pixel-art growth stages (sprouts, vegetative blades, tall green stalks, and golden nodding wheat heads). Harvesting mature crops yields nutritious Wheat and bonus Seeds.',
        'Nutritious Bread Crafting: Combine 3 harvested Wheat in the Crafting Table to bake fresh Bread, providing efficient hunger and saturation replenishment.',
        'Complete Shovel & Hoe Tool Sets: Full tool progression across 5 material tiers (Wood, Stone, Iron, Gold, and Diamond). Shovels allow rapid excavation of dirt, grass, sand, gravel, and snow; Hoes till soil and harvest crops.',
        'Bovine Livestock (Cows): Added peaceful grazing Cows inhabiting grassy biomes with udders, horns, animated quadruped walking legs, and head bobbing. Defeating cows yields Raw Beef and Leather.',
        'Quadruped Animal Animation Overhaul: Overhauled procedural walking animations, natural leg cycles, and pixel art models for Cows, Sheep, Pigs, and Chickens.',
        'Jukebox & Vinyl Music Discs: Craftable Jukebox block with disc slots, interactive disc insertion/ejection, custom MP3 track loading with persistent IndexedDB storage, floating Music Player HUD with audio waveform and progress scrubbers, and floating musical note particles.',
        'Dynamic Unlit & Lit Furnace Textures: Authentically rendered furnace states - unlit dark stone grates when idle, bursting into animated glowing flames and dynamic light emissions when smelting ore or cooking food.',
        'Furnace GUI & Smelting Pipeline: Seamless furnace opening, smart shift-clicking, automatic fuel consumption, cooking/smelting progress bar, and protected take-only output slot.',
        'Realistic Tool Tier Harvesting: Authentic Minecraft drop mechanics - breaking stone or ores with bare hands or an insufficient pickaxe tier slowly breaks the block, but drops NO items whatsoever. Snow requires a shovel to drop snowballs.',
        'Enhanced 10-Stage Block Fracture Animation: Rebuilt block breaking animation with 10 progressive Minecraft-style pixelated fracture stages with dynamic jagged crack lines and relief shading.',
        'Persistent Difficulty Selector: Configurable Peaceful, Easy, Normal, and Hard modes with persistent storage, dynamic mob despawning in Peaceful, and accessible switching from both Pause and Main Menu settings.',
        'UI Accent Color Customization: Integrated custom accent color theming across menu borders, buttons, hover states, How-to-Play tabs, and gamepad focus outlines.',
        'Native Gamepad API Controller Support: Full support for standard Xbox, PlayStation, and generic USB/Bluetooth gamepads with automatic plug-and-play detection.',
        'Analog Platformer Movement: Smooth, variable-speed platformer movement using the left analog stick with configurable deadzone filtering and non-linear response curves.',
        '360° Analog Aim Vector: 360-degree crosshair targeting using the right analog stick with adjustable sensitivity, Y-axis inversion, and automated facing fallback.',
        'Adaptive Trigger Controls: Mine and attack with RT / R2 (Right Trigger) and place blocks or interact with LT / L2 (Left Trigger). Alternate attack mapped to X / Square.',
        'Console-Style Controller Jump & Crouch: Jump with A / Cross (or D-Pad Up / Left Stick tilt) and crouch / climb down with B / Circle (or D-Pad Down).',
        'Bumper Hotbar Cycling: Instantly cycle active hotbar items with LB / L1 (previous) and RB / R1 (next).',
        'Haptic Vibration Rumble: Dual-rumble and haptic pulse feedback on block breaking, taking damage, tool breakage, and UI interactions with toggleable settings.',
        'Universal Gamepad UI Navigation: Full D-Pad and left-stick 2D spatial focus navigation across all menus, modals, and inventory screens (Main Menu, Settings, Worlds, Achievements, Profile, Pause, and Death screen).',
        'Retro Gold UI Focus Glow: Animated focus outline (.gamepad-focused) with auto-scrolling into view and seamless mouse-controller coexistence.',
        'Recipe Pinning to HUD: Click any recipe in the Crafting Table to pin it to your HUD with live material tracking and crafting station status while mining.'
    ]
};

export const PATCH_NOTES_0_1_3 = {
    title: 'Beta 0.1.3 (Major Architecture & UI Overhaul)',
    items: [
        'Modular Codebase Architecture: Disassembled the monolithic single-file index.html into organized ES modules: main.js (game simulation & loop), engine.js (world generation & physics), ui.js (DOM, menus, inventory & skin studio), and network.js (P2P multiplayer & cloud auth).',
        'Dedicated CSS Pipeline: Migrated from runtime CDN Tailwind injection to a professional Tailwind CSS pipeline (css/input.css -> css/style.css), eliminating external CDN dependencies and dramatically improving load performance.',
        'Player Profile & Identity System: Added a dedicated Player Profile badge on the Main Menu showing your custom skin avatar head, player name, account status, and accumulated achievement emeralds.',
        'User Accounts & Authentication: Integrated Webcraft User Accounts with email/password registration, login, and cloud profile persistence.',
        'Guest Mode Architecture: Full support for playing as a Guest with local storage saves, clear guest limitations dialogs, and seamless account upgrading without progress loss.',
        'Emerald Currency System: Earn emeralds by unlocking achievements, with live balance tracking across singleplayer and multiplayer displayed on your profile card.',
        'Profile Details Modal: View account creation date, playtime statistics, unlocked achievements summary, emerald count, and manage account credentials.',
        'Aseprite-Style Pixel Skin Studio: Rebuilt the skin customizer into a professional pixel art studio with real-time 3D-mapped character preview, custom color swatches, palette history, undo/redo, canvas zoom, and cloud gallery uploading.',
        'Chunked Multiplayer World Streaming: Implemented 32x32 chunked world compression and progressive streaming (MP_CHUNK_SIZE = 32), enabling large custom worlds to be uploaded and downloaded without payload caps.',
        'Publish Singleplayer to Multiplayer: Added "Open to Multiplayer" modal in the pause menu allowing singleplayer worlds to be seamlessly converted into online multiplayer rooms with automated local backups and password protection.',
        'Multiplayer Lobby & Server Browser: Redesigned multiplayer lobby with real-time server browser, survival and minigame filter tabs, secure SHA-256 password hashing, and room difficulty badges.',
        'Multiplayer Chat System: In-game chat overlay (press T or /) with player nametags, system broadcasts, achievement unlock announcements, and auto-fading message history.',
        'AFK Inactivity Protection: Automated 5-minute inactivity watchdog that gently disconnects idle players to preserve server performance and player security.',
        'Authentic Backpack & Equipment Layout: Redesigned inventory with 4 vertical armor slots (Helmet, Chestplate, Leggings, Boots), live interactive Paperdoll preview stage, offhand slot, defense percentage readout, and separated storage/hotbar grids.',
        'Crafting Table Search & Categories: Real-time recipe search with keyword filtering, clear button, and category filters (All, Tools, Armour, Materials, Blocks, Utility).',
        'Full Armor Protection & Durability: Craftable armor sets across Iron, Gold, and Diamond tiers with unique defense ratings, damage mitigation formulas, durability bars, and breakage audio.',
        'Background Wall Building Mode: Press B to toggle background placement mode, allowing players to build and mine depth background walls behind structures with atmospheric darkening.',
        'Falling Sand Gravity Physics: Dynamic falling physics for unsupported sand blocks with natural chain-reaction cave collapses, impact damage, and head suffocation.',
        'Snowball Throwing Combat: Gather snowballs from snow blocks and throw them with ballistic trajectories, particle trails, sound effects, and knockback damage synchronized across multiplayer.',
        'Desert Scorpions & Poison Effect: Hostile Desert Scorpions spawning in arid biomes with multi-legged animations, stinger strikes, and a damage-over-time poison status effect.',
        'Synthesized Procedural Web Audio Engine: Procedural audio synthesis for material-based footsteps (grass, stone, sand, wood, ladder, water, snow), block breaking/placing, tool/armor durability breakage, eating, damage, and projectile whooshes.',
        'Dynamic Celestial Sky & Aurora Borealis: Multi-stage procedural sky with daylight, twilight, sunset, starry night cycles, radiant sun flares, lunar craters, and animated multi-layer Aurora Borealis in snowy biomes.',
        'Fabulous Atmosphere & Visual Shaders: Added graphics quality presets (Base, Advanced, Fabulous) with biome color grading, desert heat shimmer, volumetric cloud drift, ambient particles (fireflies, cave dust, spores, snow), and cinematic vignette.',
        'Delta-Time Physics Stabilization: Physics accumulator with delta-time snapping to eliminate micro-stutter and ensure deterministic 60Hz physics across 60Hz, 120Hz, and 144Hz displays.',
        'Automated Cassette Tape Autosave: 60-second recurring background autosave with animated retro cassette tape slide-up notifications.',
        'Keybinding Rebinding System: Customizable controls menu in Settings with interactive click-to-rebind buttons, escape cancellation, mouse wheel sensitivity tuning, and wrap-around toggles.'
    ]
};

export const LATEST_PATCH_NOTES = PATCH_NOTES_0_1_6;
export const UPDATE_HISTORY_LOGS = [PATCH_NOTES_0_1_6, PATCH_NOTES_0_1_5, PATCH_NOTES_0_1_4_PATCH_1, PATCH_NOTES_0_1_4, PATCH_NOTES_0_1_3];

// Backward compatibility window bindings
if (typeof window !== 'undefined') {
    window.IDS = IDS;
    window.HARDNESS = HARDNESS;
    window.ID_NAMES = ID_NAMES;
    window.TOOL_DURABILITY = TOOL_DURABILITY;
    window.ARMOR_DURABILITY = ARMOR_DURABILITY;
    window.ARMOR_DEFENSE = ARMOR_DEFENSE;
    window.ARMOR_SLOT_TYPE = ARMOR_SLOT_TYPE;
    window.MINING_TOOL_TIERS = MINING_TOOL_TIERS;
    window.TILE_SIZE = TILE_SIZE;
    window.GRAVITY = GRAVITY;
    window.TERMINAL_VELOCITY = TERMINAL_VELOCITY;
    window.JUMP_FORCE = JUMP_FORCE;
    window.MOVE_SPEED = MOVE_SPEED;
    window.REACH = REACH;
    window.DAY_LENGTH_FRAMES = DAY_LENGTH_FRAMES;
    window.DAY_LENGTH = DAY_LENGTH;
    window.DIFFICULTIES = DIFFICULTIES;
    window.diffDescriptions = diffDescriptions;
    window.isPickaxe = isPickaxe;
    window.isAxe = isAxe;
    window.isShovel = isShovel;
    window.isSword = isSword;
    window.isHoe = isHoe;
    window.isShears = isShears;
    window.isTool = isTool;
    window.isArmor = isArmor;
    window.getArmorSlotIndex = getArmorSlotIndex;
    window.ensureArmorDurability = ensureArmorDurability;
    window.ensureToolDurability = ensureToolDurability;
    window.getRequiredMiningTier = getRequiredMiningTier;
}
