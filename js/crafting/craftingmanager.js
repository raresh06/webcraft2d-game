// =============================================================================
// WEBCRAFT 2D - CRAFTING MANAGER MODULE (js/crafting/craftingmanager.js)
// Inventory queries, material consumption, table proximity & recipe execution.
// =============================================================================

import { IDS, TILE_SIZE, isArmor, isTool } from '../core/constants.js';
import { RECIPES, getRecipeCategory } from './recipes.js';

export function isNonStackable(id) {
    if (typeof window !== 'undefined' && typeof window.isNonStackable === 'function') {
        return window.isNonStackable(id);
    }
    if (isArmor(id)) return true;
    if (isTool(id)) return true;
    if (id === IDS.BED || id === IDS.DOOR || id === IDS.JUNGLE_DOOR || id === IDS.SIGN ||
        id === IDS.EMPTY_VINYL || id === IDS.MUSIC_DISC_SYNTHWAVE || id === IDS.MUSIC_DISC_AMBIENT) {
        return true;
    }
    return false;
}

export function getItemMaxStack(id) {
    if (typeof window !== 'undefined' && typeof window.getItemMaxStack === 'function') {
        return window.getItemMaxStack(id);
    }
    return isNonStackable(id) ? 1 : 64;
}

export function canFitItem(id, amount, optionalInv) {
    const liveInv = optionalInv || (typeof window !== 'undefined' && Array.isArray(window.inventory) ? window.inventory : null) || [];
    let capacity = 0;
    const maxStack = getItemMaxStack(id);
    for (let i = 0; i < 27; i++) {
        if (liveInv[i] && liveInv[i].id === id && maxStack > 1) {
            capacity += Math.max(0, maxStack - liveInv[i].count);
        } else if (!liveInv[i]) {
            capacity += maxStack;
        }
        if (capacity >= amount) return true;
    }
    return false;
}

export function getItemCount(id, optionalInv) {
    const liveInv = optionalInv || (typeof window !== 'undefined' && Array.isArray(window.inventory) ? window.inventory : null) || [];
    let count = 0;
    for (let i = 0; i < 27; i++) {
        if (liveInv[i] && liveInv[i].id === id) count += liveInv[i].count;
    }
    return count;
}

export function hasItem(id, amount = 1, optionalInv) {
    return getItemCount(id, optionalInv) >= amount;
}

export function consumeItem(id, amount, optionalInv) {
    const liveInv = optionalInv || (typeof window !== 'undefined' && Array.isArray(window.inventory) ? window.inventory : null) || [];
    for (let i = 0; i < 27; i++) {
        if (liveInv[i] && liveInv[i].id === id) {
            if (liveInv[i].count >= amount) {
                liveInv[i].count -= amount;
                if (liveInv[i].count === 0) liveInv[i] = null;
                return true;
            } else {
                amount -= liveInv[i].count;
                liveInv[i] = null;
            }
        }
    }
    return false;
}

export function getRecipeInputCount(input, optionalInv) {
    if (Array.isArray(input.ids)) {
        let total = 0;
        input.ids.forEach(id => {
            total += getItemCount(id, optionalInv);
        });
        return total;
    }
    return getItemCount(input.id, optionalInv);
}

export function hasRecipeInput(input, optionalInv) {
    return getRecipeInputCount(input, optionalInv) >= input.count;
}

export function consumeRecipeInput(input, optionalInv) {
    if (Array.isArray(input.ids)) {
        let remainingNeeded = input.count;
        const inv = optionalInv || (typeof window !== 'undefined' && window.inventory ? window.inventory : null) || [];
        for (let i = 0; i < inv.length; i++) {
            const item = inv[i];
            if (item && input.ids.includes(item.id)) {
                if (item.count <= remainingNeeded) {
                    remainingNeeded -= item.count;
                    inv[i] = null;
                } else {
                    item.count -= remainingNeeded;
                    remainingNeeded = 0;
                }
                if (remainingNeeded <= 0) break;
            }
        }
        if (!optionalInv) {
            if (typeof window !== 'undefined' && typeof window.setEngineInventory === 'function') {
                window.setEngineInventory(inv);
            }
            if (typeof window !== 'undefined') window.inventory = inv;
        }
        return remainingNeeded <= 0;
    }
    return consumeItem(input.id, input.count, optionalInv);
}

export function checkNearCraftingTable(optionalPlayer, optionalWorld) {
    const p = optionalPlayer || (typeof window !== 'undefined' ? window.player : null);
    if (!p) return false;
    const px = Math.floor((p.x + p.width / 2) / TILE_SIZE);
    const py = Math.floor((p.y + p.height / 2) / TILE_SIZE);
    const w = optionalWorld || (typeof window !== 'undefined' ? window.world : null);
    if (!w) return false;
    const width = w.width || (Array.isArray(w) ? w.length : 1024);
    const height = w.height || (Array.isArray(w) && w[0] ? w[0].length : 320);
    for (let x = px - 3; x <= px + 3; x++) {
        for (let y = py - 3; y <= py + 3; y++) {
            if (x >= 0 && x < width && y >= 0 && y < height && w[x] && w[x][y] === IDS.CRAFTING_TABLE) {
                return true;
            }
        }
    }
    return false;
}

export function canCraftRecipe(recipeOrIndex, optionalInv, nearTable = null) {
    const recipe = typeof recipeOrIndex === 'number' ? RECIPES[recipeOrIndex] : recipeOrIndex;
    if (!recipe) return false;
    const isNearTable = (nearTable !== null) ? nearTable : checkNearCraftingTable();
    if (recipe.reqTable && !isNearTable) return false;
    return recipe.inputs.every(req => hasRecipeInput(req, optionalInv));
}

export function craftItem(recipeOrIndex, optionalInv, nearTable = null) {
    const recipe = typeof recipeOrIndex === 'number' ? RECIPES[recipeOrIndex] : recipeOrIndex;
    if (!recipe) return { success: false, error: 'Invalid recipe' };
    if (!canCraftRecipe(recipe, optionalInv, nearTable)) {
        return { success: false, error: 'Requirements not met' };
    }
    recipe.inputs.forEach(req => consumeRecipeInput(req, optionalInv));
    return { success: true, recipe, output: { ...recipe.output } };
}

export function craftRecipe(recipeIndex) {
    const recipe = RECIPES[recipeIndex];
    if (!recipe) return;
    const canCraft = recipe.inputs.every(req => hasRecipeInput(req));
    const outputFits = canFitItem(recipe.output.id, recipe.output.count);
    const isMp = typeof window !== 'undefined' && window.isMultiplayer;
    const isAuth = typeof window !== 'undefined' && typeof window.isMultiplayerAuthority === 'function' ? window.isMultiplayerAuthority() : true;
    const pendingDrop = typeof window !== 'undefined' && window.pendingDropRequest;
    if (canCraft && !outputFits && isMp && !isAuth && pendingDrop) return;
    if (canCraft) {
        recipe.inputs.forEach(req => consumeRecipeInput(req));
        const p = typeof window !== 'undefined' ? window.player : null;
        if (!outputFits) {
            if (typeof window !== 'undefined' && typeof window.dropItemForWorld === 'function' && p) {
                window.dropItemForWorld(recipe.output.id, p.x + p.width / 2, p.y, recipe.output.count);
            }
        } else {
            if (typeof window !== 'undefined' && typeof window.giveItem === 'function') {
                window.giveItem(recipe.output.id, recipe.output.count);
            }
        }
        if (typeof window !== 'undefined' && typeof window.trackDailyQuestProgress === 'function') {
            window.trackDailyQuestProgress('craft_item', { itemId: recipe.output.id, count: recipe.output.count });
        }
        if (typeof window !== 'undefined') {
            window.craftedItemsCount = (window.craftedItemsCount || 0) + 1;
            if (window.craftedItemsCount >= 20 && typeof window.unlockAchievement === 'function') {
                window.unlockAchievement('master_crafter');
            }
            const unlock = typeof window.unlockAchievement === 'function' ? window.unlockAchievement : () => {};
            if (recipe.output.id === IDS.CRAFTING_TABLE) unlock('benchmarking');
            else if (recipe.output.id === IDS.WOOD_PICKAXE) unlock('time_to_mine');
            else if (recipe.output.id === IDS.FURNACE) unlock('hot_topic');
            else if (recipe.output.id === IDS.WOOD_SWORD) unlock('time_to_strike');
            else if (recipe.output.id === IDS.LADDER) unlock('ladder_climber');
            else if (recipe.output.id === IDS.WOODEN_STAIRS || recipe.output.id === IDS.COBBLESTONE_STAIRS) unlock('stairway_heaven');
            else if (recipe.output.id === IDS.IRON_PICKAXE) unlock('iron_age');
            else if (recipe.output.id === IDS.BUCKET) unlock('bucket_brigade');
            else if (recipe.output.id === IDS.DIAMOND_PICKAXE || recipe.output.id === IDS.DIAMOND_SWORD || recipe.output.id === IDS.DIAMOND_AXE) unlock('diamond_tools');
            else if (recipe.output.id === IDS.GOLD_PICKAXE || recipe.output.id === IDS.GOLD_SWORD || recipe.output.id === IDS.GOLD_AXE) unlock('shiny_bling');
            else if ([IDS.WOOD_HOE, IDS.STONE_HOE, IDS.IRON_HOE, IDS.GOLD_HOE, IDS.DIAMOND_HOE].includes(recipe.output.id)) unlock('time_to_cultivate');
            else if (recipe.output.id === IDS.BREAD) unlock('bake_bread');
            else if (recipe.output.id === IDS.ASTRAL_INFUSER) unlock('astral_infusion');
            else if (recipe.output.id === IDS.SIGN) unlock('notice_board');
            else if (recipe.output.id === IDS.DOOR || recipe.output.id === IDS.JUNGLE_DOOR) unlock('knock_knock');
            else if (recipe.output.id === IDS.EMPTY_VINYL) unlock('craft_vinyl');
            else if (recipe.output.id === IDS.PRISM_GLASS) unlock('prism_glass_art');
            else if (recipe.output.id === IDS.SHADOWFANG) unlock('forge_shadowfang');
            else if (recipe.output.id === IDS.GLOOM_LANTERN) unlock('gloom_lantern_placed');
            else if ([IDS.ASTRAL_SWORD, IDS.ASTRAL_AXE, IDS.ASTRAL_SHOVEL].includes(recipe.output.id)) unlock('stellar_arsenal');
            if (isArmor(recipe.output.id)) {
                unlock('suit_up');
                if (recipe.output.id === IDS.HELMET_GOLD || recipe.output.id === IDS.CHESTPLATE_GOLD || recipe.output.id === IDS.LEGGINGS_GOLD || recipe.output.id === IDS.BOOTS_GOLD) {
                    unlock('shiny_bling');
                }
            }
            if (typeof window.renderCraftingRecipes === 'function') window.renderCraftingRecipes();
            if (typeof window.renderPinnedAchievementHUD === 'function') window.renderPinnedAchievementHUD();
        }
    }
}

// Backward compatibility window bindings
if (typeof window !== 'undefined') {
    window.canFitItem = canFitItem;
    window.getItemCount = getItemCount;
    window.hasItem = hasItem;
    window.consumeItem = consumeItem;
    window.getRecipeInputCount = getRecipeInputCount;
    window.hasRecipeInput = hasRecipeInput;
    window.consumeRecipeInput = consumeRecipeInput;
    window.checkNearCraftingTable = checkNearCraftingTable;
    window.canCraftRecipe = canCraftRecipe;
    window.craftItem = craftItem;
    window.craftRecipe = craftRecipe;
}
