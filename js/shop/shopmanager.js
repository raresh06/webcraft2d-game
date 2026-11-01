// =============================================================================
// WEBCRAFT 2D - SHOP & ECONOMY MANAGER (js/shop/shopmanager.js)
// Headless dual-currency wallet (Emeralds & Astral Emeralds), exchange logic,
// cosmetic purchasing and equip transactions, and Atlas Market integration.
// =============================================================================

import { getCosmeticItem, getDefaultCustomization, isCosmeticUnlocked as checkUnlocked, COSMETIC_CATEGORIES } from '../cosmeticscatalog.js';
import { showToast } from '../ui/toasts.js';

// --- Dual-Currency Wallet Management ---

export function getPlayerEmeralds() {
    if (typeof localStorage === 'undefined') return 0;
    try {
        const val = parseInt(localStorage.getItem('swc_emeralds_v1'), 10);
        return isNaN(val) || val < 0 ? 0 : val;
    } catch (e) {
        return 0;
    }
}

export function setPlayerEmeralds(val) {
    try {
        const safeVal = Math.max(0, Math.floor(val));
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('swc_emeralds_v1', safeVal.toString());
        }
        let profile = getCurrentUserProfile();
        if (profile) {
            profile.emeralds = safeVal;
            saveCurrentUserProfile(profile);
        }
        if (typeof window !== 'undefined' && typeof window.updateEmeraldsUI === 'function') {
            window.updateEmeraldsUI();
        }
        return safeVal;
    } catch (e) {
        return 0;
    }
}

export function addPlayerEmeralds(amt) {
    const current = getPlayerEmeralds();
    return setPlayerEmeralds(current + amt);
}

export function getPlayerAstralEmeralds() {
    if (typeof localStorage === 'undefined') return 0;
    try {
        const val = parseInt(localStorage.getItem('swc_astral_emeralds_v1'), 10);
        return isNaN(val) || val < 0 ? 0 : val;
    } catch (e) {
        return 0;
    }
}

export function setPlayerAstralEmeralds(val) {
    try {
        const safeVal = Math.max(0, Math.floor(val));
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('swc_astral_emeralds_v1', safeVal.toString());
        }
        let profile = getCurrentUserProfile();
        if (profile) {
            profile.astralEmeralds = safeVal;
            saveCurrentUserProfile(profile);
        }
        if (typeof window !== 'undefined' && typeof window.updateEmeraldsUI === 'function') {
            window.updateEmeraldsUI();
        }
        return safeVal;
    } catch (e) {
        return 0;
    }
}

export function addPlayerAstralEmeralds(amt) {
    const current = getPlayerAstralEmeralds();
    return setPlayerAstralEmeralds(current + amt);
}

export function performAstralExchange(emeraldCost, astralGain) {
    const profile = getCurrentUserProfile();
    const isGuest = !profile || profile.isGuest;
    if (isGuest) {
        showToast("Registered account required for Astral Emerald Exchange!");
        return { success: false, reason: 'guest' };
    }
    const current = getPlayerEmeralds();
    if (current < emeraldCost) {
        showToast(`Not enough Emeralds! (${emeraldCost} needed, you have ${current})`);
        return { success: false, reason: 'insufficient_funds' };
    }
    addPlayerEmeralds(-emeraldCost);
    addPlayerAstralEmeralds(astralGain);

    if (typeof playSound === 'function') playSound('astral_exchange');
    else if (typeof window !== 'undefined' && typeof window.playSound === 'function') window.playSound('astral_exchange');

    showToast(`Exchanged ${emeraldCost} Emeralds for +${astralGain} Astral Emerald${astralGain > 1 ? 's' : ''}!`);

    if (typeof window !== 'undefined' && typeof window.unlockAchievement === 'function') {
        window.unlockAchievement('astral_pioneer');
        window.unlockAchievement('astral_exchange_master');
    }
    if (typeof window !== 'undefined') {
        if (typeof window.updateEmeraldsUI === 'function') window.updateEmeraldsUI();
        if (typeof window.renderAstralExchangeUI === 'function') window.renderAstralExchangeUI();
    }
    return { success: true, emeraldCost, astralGain };
}

// --- Profile & Customization State ---

export function getCurrentUserProfile() {
    if (typeof window !== 'undefined' && window.currentUserProfile) {
        return window.currentUserProfile;
    }
    if (typeof localStorage !== 'undefined') {
        try {
            const raw = localStorage.getItem('webcraft_user_profile');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
    }
    return {
        isGuest: true,
        username: 'Player',
        unlockedCosmetics: ['frame_classic', 'banner_slate', 'title_novice', 'theme_slate']
    };
}

export function saveCurrentUserProfile(profile) {
    if (typeof window !== 'undefined') {
        window.currentUserProfile = profile;
    }
    if (typeof localStorage !== 'undefined') {
        try {
            localStorage.setItem('webcraft_user_profile', JSON.stringify(profile));
        } catch (e) {}
    }
}

export function getPlayerUnlockedCosmetics(profile = null) {
    const p = profile || getCurrentUserProfile();
    if (p && Array.isArray(p.unlockedCosmetics)) {
        return p.unlockedCosmetics;
    }
    return ['frame_classic', 'banner_slate', 'title_novice', 'theme_slate'];
}

export function isCosmeticUnlocked(profile, cosmeticId) {
    return checkUnlocked(profile, cosmeticId);
}

export function getCosmeticPrice(itemId) {
    const item = getCosmeticItem(itemId);
    return item ? (item.price || 0) : 0;
}

// --- Cosmetic Purchasing & Equipping ---

export async function purchaseCosmeticItem(itemId, optionalProfile = null) {
    let profile = optionalProfile || (typeof window !== 'undefined' ? window.currentUserProfile : null) || getCurrentUserProfile();
    const isGuest = !profile || profile.isGuest;
    if (isGuest) {
        showToast("Log in or create an account to purchase cosmetics with Astral Gems!");
        if (typeof window !== 'undefined' && typeof window.closeShop === 'function') window.closeShop();
        if (typeof window !== 'undefined' && typeof window.openAuthProfileModal === 'function') window.openAuthProfileModal('credentials');
        return { success: false, reason: 'guest' };
    }

    const item = getCosmeticItem(itemId);
    if (!item) return { success: false, reason: 'not_found' };

    const unlocked = getPlayerUnlockedCosmetics(profile);
    if (unlocked.includes(itemId)) {
        showToast(`${item.name} is already unlocked!`);
        return { success: false, reason: 'already_unlocked' };
    }

    const gems = getPlayerAstralEmeralds();
    if (gems < item.price) {
        showToast(`Not enough Astral Gems! (${item.price} ✦ required, you have ${gems} ✦)`);
        return { success: false, reason: 'insufficient_funds' };
    }

    // Deduct currency
    addPlayerAstralEmeralds(-item.price);

    // Add to unlocked cosmetics
    if (!Array.isArray(profile.unlockedCosmetics)) {
        profile.unlockedCosmetics = ['frame_classic', 'banner_slate', 'title_novice', 'theme_slate'];
    }
    profile.unlockedCosmetics.push(itemId);

    // Auto-equip the newly purchased cosmetic
    if (!profile.profileCustomization) {
        profile.profileCustomization = getDefaultCustomization();
    }
    if (item.category === COSMETIC_CATEGORIES.FRAME) profile.profileCustomization.avatarFrame = item.id;
    if (item.category === COSMETIC_CATEGORIES.BANNER) profile.profileCustomization.bannerPattern = item.id;
    if (item.category === COSMETIC_CATEGORIES.TITLE) profile.profileCustomization.titlePlate = item.id;
    if (item.category === COSMETIC_CATEGORIES.THEME) profile.profileCustomization.cardTheme = item.id;

    saveCurrentUserProfile(profile);

    if (typeof window !== 'undefined' && typeof window.saveProfileCustomizationToCloud === 'function') {
        try {
            await window.saveProfileCustomizationToCloud(profile.profileCustomization, profile.unlockedCosmetics);
        } catch (e) {
            console.warn("Cloud sync warning", e);
        }
    }

    if (typeof playSound === 'function') playSound('astral_exchange');
    else if (typeof window !== 'undefined' && typeof window.playSound === 'function') window.playSound('astral_exchange');

    showToast(`Unlocked and equipped ${item.name}!`);

    // Update UI balances & previews if in browser
    if (typeof window !== 'undefined') {
        const astralCount = document.getElementById('shop-astral-count');
        if (astralCount) astralCount.innerText = getPlayerAstralEmeralds().toLocaleString();
        if (typeof window.updateEmeraldsUI === 'function') window.updateEmeraldsUI();
        if (typeof window.updateStoreShowcase === 'function') window.updateStoreShowcase();
        if (typeof window.updateStoreLockerShowcase === 'function') window.updateStoreLockerShowcase();
        if (window.currentShopTab === 'locker' && typeof window.renderShopLocker === 'function') {
            window.renderShopLocker(window.currentLockerFilter);
        } else if (typeof window.renderShopCosmetics === 'function') {
            window.renderShopCosmetics(window.currentCosmeticsFilter);
        }
    }

    return { success: true, item, profile };
}

export function purchaseCosmetic(itemId, userProfile) {
    return purchaseCosmeticItem(itemId, userProfile);
}

export async function equipCosmeticItem(itemId, optionalProfile = null) {
    const item = getCosmeticItem(itemId);
    if (!item) return { success: false, reason: 'not_found' };

    let profile = optionalProfile || (typeof window !== 'undefined' ? window.currentUserProfile : null) || getCurrentUserProfile();
    if (!profile) profile = { isGuest: true, username: 'Player' };
    if (!profile.profileCustomization) profile.profileCustomization = getDefaultCustomization();

    if (item.category === COSMETIC_CATEGORIES.FRAME) profile.profileCustomization.avatarFrame = item.id;
    if (item.category === COSMETIC_CATEGORIES.BANNER) profile.profileCustomization.bannerPattern = item.id;
    if (item.category === COSMETIC_CATEGORIES.TITLE) profile.profileCustomization.titlePlate = item.id;
    if (item.category === COSMETIC_CATEGORIES.THEME) profile.profileCustomization.cardTheme = item.id;

    saveCurrentUserProfile(profile);

    if (!profile.isGuest && typeof window !== 'undefined' && typeof window.saveProfileCustomizationToCloud === 'function') {
        try {
            await window.saveProfileCustomizationToCloud(profile.profileCustomization, profile.unlockedCosmetics || []);
        } catch (e) {}
    }

    if (typeof playSound === 'function') playSound('click');
    else if (typeof window !== 'undefined' && typeof window.playSound === 'function') window.playSound('click');

    showToast(`Equipped ${item.name}!`);

    if (typeof window !== 'undefined') {
        if (typeof window.updateStoreShowcase === 'function') window.updateStoreShowcase();
        if (typeof window.updateStoreLockerShowcase === 'function') window.updateStoreLockerShowcase();
        if (window.currentShopTab === 'locker' && typeof window.renderShopLocker === 'function') {
            window.renderShopLocker(window.currentLockerFilter);
        } else if (typeof window.renderShopCosmetics === 'function') {
            window.renderShopCosmetics(window.currentCosmeticsFilter);
        }
    }

    return { success: true, item, profile };
}

// --- Atlas Market Trades Integration ---

export function getAtlasTrades() {
    if (typeof window !== 'undefined' && window.AtlasTradeManager && typeof window.AtlasTradeManager.getTrades === 'function') {
        return window.AtlasTradeManager.getTrades();
    }
    return [];
}

export const ShopManager = {
    getPlayerEmeralds,
    setPlayerEmeralds,
    addPlayerEmeralds,
    getPlayerAstralEmeralds,
    setPlayerAstralEmeralds,
    addPlayerAstralEmeralds,
    performAstralExchange,
    getCurrentUserProfile,
    saveCurrentUserProfile,
    getPlayerUnlockedCosmetics,
    isCosmeticUnlocked,
    getCosmeticPrice,
    purchaseCosmeticItem,
    purchaseCosmetic,
    equipCosmeticItem,
    getAtlasTrades
};

// Backward compatibility window bindings
if (typeof window !== 'undefined') {
    window.ShopManager = ShopManager;
    window.getPlayerEmeralds = getPlayerEmeralds;
    window.setPlayerEmeralds = setPlayerEmeralds;
    window.addPlayerEmeralds = addPlayerEmeralds;
    window.getPlayerAstralEmeralds = getPlayerAstralEmeralds;
    window.setPlayerAstralEmeralds = setPlayerAstralEmeralds;
    window.addPlayerAstralEmeralds = addPlayerAstralEmeralds;
    window.performAstralExchange = performAstralExchange;
    window.purchaseCosmeticItem = purchaseCosmeticItem;
    window.equipCosmeticItem = equipCosmeticItem;
    window.getCosmeticPrice = getCosmeticPrice;
}
