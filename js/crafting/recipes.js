// =============================================================================
// WEBCRAFT 2D - CRAFTING RECIPES MODULE (js/crafting/recipes.js)
// 66 declarative crafting recipes catalog, category metadata & query helpers.
// =============================================================================

import { IDS, ID_NAMES, isArmor, isTool } from '../core/constants.js';

export const RECIPES = [
    { output: { id: IDS.BUCKET, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 3 }], reqTable: true, category: 'utility' },
    { output: { id: IDS.JUKEBOX, count: 1 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 8 }, { id: IDS.DIAMOND, count: 1 }], reqTable: true, category: 'utility' },
    { output: { id: IDS.EMPTY_VINYL, count: 1 }, inputs: [{ id: IDS.COAL, count: 4 }, { id: IDS.IRON_INGOT, count: 1 }], reqTable: true, category: 'utility' },
    { output: { id: IDS.PLANKS, count: 4 }, inputs: [{ id: IDS.WOOD, count: 1 }], reqTable: false, category: 'blocks' },
    { output: { id: IDS.JUNGLE_PLANKS, count: 4 }, inputs: [{ id: IDS.JUNGLE_WOOD, count: 1 }], reqTable: false, category: 'blocks' },
    { output: { id: IDS.CHEST, count: 1 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 8 }], reqTable: true, category: 'blocks' },
    { output: { id: IDS.STICK, count: 4 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 2 }], reqTable: false, category: 'utility' },
    { output: { id: IDS.JUNGLE_DOOR, count: 1 }, inputs: [{ id: IDS.JUNGLE_PLANKS, count: 6 }], reqTable: true, category: 'blocks' },
    { output: { id: IDS.SIGN, count: 3 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 6 }, { id: IDS.STICK, count: 1 }], reqTable: true, category: 'utility' },
    { output: { id: IDS.MELON_SEEDS, count: 1 }, inputs: [{ id: IDS.MELON_SLICE, count: 1 }], reqTable: false, category: 'utility' },
    { output: { id: IDS.MELON, count: 1 }, inputs: [{ id: IDS.MELON_SLICE, count: 9 }], reqTable: true, category: 'blocks' },
    { output: { id: IDS.LADDER, count: 3 }, inputs: [{ id: IDS.STICK, count: 7 }], reqTable: true, category: 'blocks' },
    { output: { id: IDS.WOODEN_STAIRS, count: 4 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 6 }], reqTable: true, category: 'blocks' },
    { output: { id: IDS.COBBLESTONE_STAIRS, count: 4 }, inputs: [{ id: IDS.COBBLESTONE, count: 6 }], reqTable: true, category: 'blocks' },
    { output: { id: IDS.TORCH, count: 4 }, inputs: [{ id: IDS.COAL, count: 1 }, { id: IDS.STICK, count: 1 }], reqTable: false, category: 'utility' },
    { output: { id: IDS.CRAFTING_TABLE, count: 1 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 4 }], reqTable: false, category: 'blocks' },
    { output: { id: IDS.DOOR, count: 1 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 6 }], reqTable: true, category: 'blocks' },
    { output: { id: IDS.FURNACE, count: 1 }, inputs: [{ id: IDS.COBBLESTONE, count: 8 }], reqTable: true, category: 'blocks' },
    { output: { id: IDS.BED, count: 1 }, inputs: [{ id: IDS.WOOL, count: 3 }, { id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 3 }], reqTable: true, category: 'blocks' },
    { output: { id: IDS.WOOD_PICKAXE, count: 1 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.WOOD_SWORD, count: 1 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 2 }, { id: IDS.STICK, count: 1 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.WOOD_AXE, count: 1 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.WOOD_SHOVEL, count: 1 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 1 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.WOOD_HOE, count: 1 }, inputs: [{ id: IDS.PLANKS, ids: [IDS.PLANKS, IDS.JUNGLE_PLANKS], name: 'Any Planks', count: 2 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.STONE_PICKAXE, count: 1 }, inputs: [{ id: IDS.COBBLESTONE, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.STONE_SWORD, count: 1 }, inputs: [{ id: IDS.COBBLESTONE, count: 2 }, { id: IDS.STICK, count: 1 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.STONE_AXE, count: 1 }, inputs: [{ id: IDS.COBBLESTONE, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.STONE_SHOVEL, count: 1 }, inputs: [{ id: IDS.COBBLESTONE, count: 1 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.STONE_HOE, count: 1 }, inputs: [{ id: IDS.COBBLESTONE, count: 2 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.IRON_INGOT, count: 1 }, inputs: [{ id: IDS.IRON_ORE, count: 1 }, { id: IDS.COAL, count: 1 }], reqTable: true, category: 'materials' },
    { output: { id: IDS.GOLD_INGOT, count: 1 }, inputs: [{ id: IDS.GOLD_ORE, count: 1 }, { id: IDS.COAL, count: 1 }], reqTable: true, category: 'materials' },
    { output: { id: IDS.DIAMOND, count: 1 }, inputs: [{ id: IDS.DIAMOND_ORE, count: 1 }], reqTable: true, category: 'materials' },
    { output: { id: IDS.GOLD_PICKAXE, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.GOLD_SWORD, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 2 }, { id: IDS.STICK, count: 1 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.GOLD_AXE, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.GOLD_SHOVEL, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 1 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.GOLD_HOE, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 2 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.IRON_PICKAXE, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.IRON_SWORD, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 2 }, { id: IDS.STICK, count: 1 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.IRON_AXE, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.IRON_SHOVEL, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 1 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.IRON_HOE, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 2 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.DIAMOND_PICKAXE, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.DIAMOND_SWORD, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 2 }, { id: IDS.STICK, count: 1 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.DIAMOND_AXE, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.DIAMOND_SHOVEL, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 1 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.DIAMOND_HOE, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 2 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.BREAD, count: 1 }, inputs: [{ id: IDS.WHEAT, count: 3 }], reqTable: true, category: 'utility' },
    { output: { id: IDS.SNOW, count: 1 }, inputs: [{ id: IDS.SNOWBALL, count: 4 }], reqTable: false, category: 'blocks' },
    { output: { id: IDS.DIAMOND_AXE, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 3 }, { id: IDS.STICK, count: 2 }], reqTable: true, category: 'tools' },
    // --- ARMOR RECIPES ---
    { output: { id: IDS.HELMET_IRON, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 5 }], reqTable: true, category: 'armor' },
    { output: { id: IDS.CHESTPLATE_IRON, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 8 }], reqTable: true, category: 'armor' },
    { output: { id: IDS.LEGGINGS_IRON, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 7 }], reqTable: true, category: 'armor' },
    { output: { id: IDS.BOOTS_IRON, count: 1 }, inputs: [{ id: IDS.IRON_INGOT, count: 4 }], reqTable: true, category: 'armor' },
    { output: { id: IDS.HELMET_GOLD, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 5 }], reqTable: true, category: 'armor' },
    { output: { id: IDS.CHESTPLATE_GOLD, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 8 }], reqTable: true, category: 'armor' },
    { output: { id: IDS.LEGGINGS_GOLD, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 7 }], reqTable: true, category: 'armor' },
    { output: { id: IDS.BOOTS_GOLD, count: 1 }, inputs: [{ id: IDS.GOLD_INGOT, count: 4 }], reqTable: true, category: 'armor' },
    { output: { id: IDS.HELMET_DIAMOND, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 5 }], reqTable: true, category: 'armor' },
    { output: { id: IDS.CHESTPLATE_DIAMOND, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 8 }], reqTable: true, category: 'armor' },
    { output: { id: IDS.LEGGINGS_DIAMOND, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 7 }], reqTable: true, category: 'armor' },
    { output: { id: IDS.BOOTS_DIAMOND, count: 1 }, inputs: [{ id: IDS.DIAMOND, count: 4 }], reqTable: true, category: 'armor' },
    { output: { id: IDS.SUNBURST_MELON_SEEDS, count: 1 }, inputs: [{ id: IDS.SUNBURST_MELON_SLICE, count: 1 }], reqTable: false, category: 'utility' },
    { output: { id: IDS.SUNBURST_MELON, count: 1 }, inputs: [{ id: IDS.SUNBURST_MELON_SLICE, count: 9 }], reqTable: true, category: 'blocks' },
    { output: { id: IDS.SHADOWFANG, count: 1 }, inputs: [{ id: IDS.SHADOW_CARAPACE, count: 2 }, { id: IDS.GLOOM_SILK, count: 2 }, { id: IDS.IRON_INGOT, count: 1 }], reqTable: true, category: 'tools' },
    { output: { id: IDS.GLOOM_LANTERN, count: 1 }, inputs: [{ id: IDS.GLOOM_SILK, count: 4 }, { id: IDS.TORCH, count: 1 }, { id: IDS.IRON_INGOT, count: 2 }], reqTable: true, category: 'utility' }
];

// Enrich recipe objects with convenience getters for contract compatibility
RECIPES.forEach((r, idx) => {
    r.id = r.id || `recipe_${idx}_${r.output.id}`;
    r.name = r.name || (ID_NAMES[r.output.id] || 'Unknown');
    r.out = r.output.id;
    r.count = r.output.count;
    r.in = {};
    for (const inp of r.inputs) {
        r.in[inp.id] = inp.count;
    }
});

export function getRecipeCategory(recipe) {
    if (recipe.category) return recipe.category;
    if (isArmor(recipe.output.id)) return 'armor';
    if (isTool(recipe.output.id)) return 'tools';
    if ([IDS.GOLD_INGOT, IDS.IRON_INGOT, IDS.DIAMOND].includes(recipe.output.id)) return 'materials';
    if ([IDS.BUCKET, IDS.WATER_BUCKET, IDS.LAVA_BUCKET].includes(recipe.output.id)) return 'utility';
    if ([IDS.PLANKS, IDS.CRAFTING_TABLE, IDS.FURNACE, IDS.BED, IDS.DOOR, IDS.CHEST].includes(recipe.output.id)) return 'blocks';
    return 'utility';
}

export function getRecipesByCategory(category) {
    if (!category || category === 'all') return [...RECIPES];
    return RECIPES.filter(r => getRecipeCategory(r) === category);
}

export function getRecipeByIdx(index) {
    if (index >= 0 && index < RECIPES.length) return RECIPES[index];
    return null;
}

export function findRecipesByOutput(outputId) {
    return RECIPES.filter(r => r.output.id === outputId);
}

export function searchRecipes(query, category = 'all') {
    const q = (query || '').trim().toLowerCase();
    return RECIPES.filter((recipe, idx) => {
        const cat = getRecipeCategory(recipe);
        if (category !== 'all' && cat !== category) return false;
        if (!q) return true;
        const name = (ID_NAMES[recipe.output.id] || '').toLowerCase();
        if (name.includes(q)) return true;
        for (const input of recipe.inputs) {
            const inName = (input.name || ID_NAMES[input.id] || '').toLowerCase();
            if (inName.includes(q)) return true;
        }
        return false;
    });
}

// Backward compatibility window bindings
if (typeof window !== 'undefined') {
    window.RECIPES = RECIPES;
    window.getRecipeCategory = getRecipeCategory;
}
