// =============================================================================
// Webcraft2D Cosmetics Catalog & Profile Customization System
// =============================================================================

export const COSMETIC_CATEGORIES = {
    FRAME: 'frame',
    BANNER: 'banner',
    TITLE: 'title',
    THEME: 'theme'
};

export const COSMETICS_CATALOG = [
    // -------------------------------------------------------------------------
    // 1. AVATAR FRAMES & SHAPES
    // -------------------------------------------------------------------------
    {
        id: 'frame_classic',
        name: 'Classic Square',
        category: COSMETIC_CATEGORIES.FRAME,
        rarity: 'Common',
        price: 0,
        isDefault: true,
        description: 'Traditional 3D beveled slate square frame with stone edges.',
        frameClass: 'avatar-frame-classic',
        cssRadius: '0px',
        borderColor: '#4a5a6a',
        boxShadow: 'inset 0 0 0 1px #0e141a',
        iconSvg: `<svg viewBox="0 0 16 16" width="24" height="24" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="1" y="1" width="14" height="14" fill="#20252b" stroke="#69737b" stroke-width="2"/><rect x="3" y="3" width="10" height="10" fill="#14181d"/></svg>`
    },
    {
        id: 'frame_circle',
        name: 'Pixel Rounded',
        category: COSMETIC_CATEGORIES.FRAME,
        rarity: 'Uncommon',
        price: 50,
        description: 'Smooth retro pixel-rounded profile silhouette.',
        frameClass: 'avatar-frame-circle',
        cssRadius: '50%',
        borderColor: '#69737b',
        boxShadow: '0 0 0 2px #20252b, 0 2px 4px rgba(0,0,0,0.5)',
        iconSvg: `<svg viewBox="0 0 16 16" width="24" height="24" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="4" y="1" width="8" height="14" fill="#333a41"/><rect x="1" y="4" width="14" height="8" fill="#333a41"/><rect x="2" y="2" width="12" height="12" fill="#333a41"/><rect x="3" y="3" width="10" height="10" fill="#14181d"/></svg>`
    },
    {
        id: 'frame_emerald',
        name: 'Emerald Bezel',
        category: COSMETIC_CATEGORIES.FRAME,
        rarity: 'Rare',
        price: 100,
        description: 'Infused with gleaming green gemstone ore that radiates a subtle green aura.',
        frameClass: 'avatar-frame-emerald',
        cssRadius: '0px',
        borderColor: '#10b981',
        boxShadow: '0 0 8px rgba(16, 185, 129, 0.5), inset 0 0 0 1px #047857',
        iconSvg: `<svg viewBox="0 0 16 16" width="24" height="24" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="1" y="1" width="14" height="14" fill="#064e3b" stroke="#10b981" stroke-width="2"/><rect x="3" y="3" width="10" height="10" fill="#022c22"/><rect x="6" y="6" width="4" height="4" fill="#34d399"/></svg>`
    },
    {
        id: 'frame_diamond',
        name: 'Diamond Facet',
        category: COSMETIC_CATEGORIES.FRAME,
        rarity: 'Rare',
        price: 150,
        description: 'Chiseled cyan diamond plating with reinforced protective corner brackets.',
        frameClass: 'avatar-frame-diamond',
        cssRadius: '2px',
        borderColor: '#38bdf8',
        boxShadow: '0 0 10px rgba(56, 189, 248, 0.55), inset 0 0 0 1px #0284c7',
        iconSvg: `<svg viewBox="0 0 16 16" width="24" height="24" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="1" y="1" width="14" height="14" fill="#082f49" stroke="#38bdf8" stroke-width="2"/><rect x="3" y="3" width="10" height="10" fill="#0c4a6e"/><rect x="5" y="5" width="6" height="6" fill="#7dd3fc"/></svg>`
    },
    {
        id: 'frame_obsidian',
        name: 'Obsidian Spikes',
        category: COSMETIC_CATEGORIES.FRAME,
        rarity: 'Epic',
        price: 250,
        description: 'Hardened volcanic glass forged in deep nether vents with sharp corner spikes.',
        frameClass: 'avatar-frame-obsidian',
        cssRadius: '0px',
        borderColor: '#7e22ce',
        boxShadow: '0 0 10px rgba(126, 34, 206, 0.6), inset 0 0 4px #a855f7',
        iconSvg: `<svg viewBox="0 0 16 16" width="24" height="24" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="1" y="1" width="14" height="14" fill="#2e1065" stroke="#7e22ce" stroke-width="2"/><rect x="0" y="0" width="3" height="3" fill="#a855f7"/><rect x="13" y="0" width="3" height="3" fill="#a855f7"/><rect x="0" y="13" width="3" height="3" fill="#a855f7"/><rect x="13" y="13" width="3" height="3" fill="#a855f7"/></svg>`
    },
    {
        id: 'frame_crown',
        name: 'Golden Crown',
        category: COSMETIC_CATEGORIES.FRAME,
        rarity: 'Epic',
        price: 350,
        description: 'Polished royal gold border adorned with a gleaming ruby-crested golden crown.',
        frameClass: 'avatar-frame-crown',
        cssRadius: '0px',
        borderColor: '#ffd34d',
        boxShadow: '0 0 12px rgba(255, 211, 77, 0.65), inset 0 0 0 1px #b45309',
        iconSvg: `<svg viewBox="0 0 16 16" width="24" height="24" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="1" y="3" width="14" height="12" fill="#451a03" stroke="#ffd34d" stroke-width="2"/><rect x="3" y="0" width="10" height="4" fill="#fbbf24"/><rect x="3" y="0" width="2" height="2" fill="#ef4444"/><rect x="11" y="0" width="2" height="2" fill="#ef4444"/><rect x="7" y="0" width="2" height="2" fill="#38bdf8"/></svg>`
    },
    {
        id: 'frame_astral',
        name: 'Astral Ring Aura',
        category: COSMETIC_CATEGORIES.FRAME,
        rarity: 'Legendary',
        price: 500,
        description: 'Resonates with pure crystallized astral energy, bathing your avatar in cosmic violet light.',
        frameClass: 'avatar-frame-astral',
        cssRadius: '50%',
        borderColor: '#c084fc',
        boxShadow: '0 0 14px rgba(192, 132, 252, 0.8), inset 0 0 8px rgba(168, 85, 247, 0.5)',
        iconSvg: `<svg viewBox="0 0 16 16" width="24" height="24" style="image-rendering: pixelated; shape-rendering: crispEdges;"><circle cx="8" cy="8" r="7" fill="#1e1035" stroke="#c084fc" stroke-width="2"/><circle cx="8" cy="8" r="5" fill="#3b0764"/><circle cx="8" cy="8" r="2" fill="#f5d0fe"/></svg>`
    },
    {
        id: 'frame_magma',
        name: 'Nether Magma Core',
        category: COSMETIC_CATEGORIES.FRAME,
        rarity: 'Legendary',
        price: 600,
        description: 'Molten lava channels forged in nether fortresses that glow with fiery crimson heat.',
        frameClass: 'avatar-frame-magma',
        cssRadius: '0px',
        borderColor: '#f97316',
        boxShadow: '0 0 14px rgba(249, 115, 22, 0.8), inset 0 0 6px #ea580c',
        iconSvg: `<svg viewBox="0 0 16 16" width="24" height="24" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="1" y="1" width="14" height="14" fill="#431407" stroke="#f97316" stroke-width="2"/><rect x="3" y="3" width="10" height="10" fill="#7c2d12"/><rect x="4" y="4" width="8" height="8" fill="#ea580c"/><rect x="6" y="6" width="4" height="4" fill="#fdba74"/></svg>`
    },

    // -------------------------------------------------------------------------
    // 2. PROFILE BANNERS & PIXEL PATTERNS
    // -------------------------------------------------------------------------
    {
        id: 'banner_slate',
        name: 'Slate Minimal',
        category: COSMETIC_CATEGORIES.BANNER,
        rarity: 'Common',
        price: 0,
        isDefault: true,
        description: 'Clean charcoal slate stone backdrop with subtle top highlight.',
        bannerClass: 'banner-pattern-slate',
        color: '#181e24',
        accentColor: '#4a5968',
        iconSvg: `<svg viewBox="0 0 20 12" width="28" height="16" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect width="20" height="12" fill="#181e24"/><rect y="0" width="20" height="2" fill="#2c3642"/></svg>`
    },
    {
        id: 'banner_lush',
        name: 'Lush Canopy',
        category: COSMETIC_CATEGORIES.BANNER,
        rarity: 'Uncommon',
        price: 75,
        description: 'Deep forest foliage bathed in emerald daylight with pixel leaf motifs.',
        bannerClass: 'banner-pattern-lush',
        color: '#13301f',
        accentColor: '#10b981',
        iconSvg: `<svg viewBox="0 0 20 12" width="28" height="16" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect width="20" height="12" fill="#0f291a"/><rect x="2" y="2" width="6" height="5" fill="#15803d"/><rect x="10" y="3" width="7" height="6" fill="#22c55e"/><rect x="4" y="4" width="2" height="2" fill="#4ade80"/></svg>`
    },
    {
        id: 'banner_stars',
        name: 'Midnight Constellation',
        category: COSMETIC_CATEGORIES.BANNER,
        rarity: 'Rare',
        price: 120,
        description: 'Deep indigo night sky dotted with glistening twinkling pixel stars.',
        bannerClass: 'banner-pattern-stars',
        color: '#0e1626',
        accentColor: '#38bdf8',
        iconSvg: `<svg viewBox="0 0 20 12" width="28" height="16" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect width="20" height="12" fill="#0c1222"/><rect x="3" y="3" width="2" height="2" fill="#ffffff"/><rect x="11" y="2" width="2" height="2" fill="#7dd3fc"/><rect x="16" y="7" width="2" height="2" fill="#ffffff"/><rect x="6" y="8" width="1" height="1" fill="#fde047"/></svg>`
    },
    {
        id: 'banner_nether',
        name: 'Nether Molten Rift',
        category: COSMETIC_CATEGORIES.BANNER,
        rarity: 'Rare',
        price: 200,
        description: 'Craggy obsidian bedrock split by glowing veins of incandescent molten magma.',
        bannerClass: 'banner-pattern-nether',
        color: '#2a0a0a',
        accentColor: '#ef4444',
        iconSvg: `<svg viewBox="0 0 20 12" width="28" height="16" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect width="20" height="12" fill="#2b0d0d"/><path d="M0 6 L5 6 L8 9 L13 9 L16 4 L20 4" stroke="#f97316" stroke-width="2" fill="none"/><rect x="7" y="8" width="3" height="2" fill="#fef08a"/></svg>`
    },
    {
        id: 'banner_redstone',
        name: 'Redstone Pulse',
        category: COSMETIC_CATEGORIES.BANNER,
        rarity: 'Epic',
        price: 280,
        description: 'Dark cyber stone inscribed with energized redstone circuit logic and repeater traces.',
        bannerClass: 'banner-pattern-redstone',
        color: '#1a0d12',
        accentColor: '#f43f5e',
        iconSvg: `<svg viewBox="0 0 20 12" width="28" height="16" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect width="20" height="12" fill="#170c10"/><rect x="2" y="5" width="16" height="2" fill="#e11d48"/><rect x="8" y="2" width="2" height="8" fill="#e11d48"/><rect x="8" y="5" width="2" height="2" fill="#ffe4e6"/></svg>`
    },
    {
        id: 'banner_dawn',
        name: 'Golden Sunrise',
        category: COSMETIC_CATEGORIES.BANNER,
        rarity: 'Epic',
        price: 350,
        description: 'Dawn rising over distant voxel peaks with radiant amber sun rays.',
        bannerClass: 'banner-pattern-dawn',
        color: '#2e1c08',
        accentColor: '#f59e0b',
        iconSvg: `<svg viewBox="0 0 20 12" width="28" height="16" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect width="20" height="12" fill="#351e06"/><circle cx="10" cy="11" r="5" fill="#fbbf24"/><polygon points="0,12 6,7 12,12" fill="#78350f"/><polygon points="9,12 15,8 20,12" fill="#92400e"/></svg>`
    },
    {
        id: 'banner_astral',
        name: 'Planar Astral Nebula',
        category: COSMETIC_CATEGORIES.BANNER,
        rarity: 'Legendary',
        price: 500,
        description: 'Swirling deep cosmos infused with cosmic dust, planar auroras, and astral gems.',
        bannerClass: 'banner-pattern-astral',
        color: '#1b0c2e',
        accentColor: '#c084fc',
        iconSvg: `<svg viewBox="0 0 20 12" width="28" height="16" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect width="20" height="12" fill="#1b0c2e"/><rect x="2" y="3" width="7" height="6" fill="#6b21a8"/><rect x="11" y="2" width="8" height="7" fill="#7e22ce"/><rect x="7" y="5" width="4" height="4" fill="#c084fc"/><rect x="8" y="6" width="2" height="2" fill="#fdf4ff"/></svg>`
    },

    // -------------------------------------------------------------------------
    // 3. TITLE PLATES & NAMEPLATE COLORS
    // -------------------------------------------------------------------------
    {
        id: 'title_novice',
        name: 'Novice Crafter',
        category: COSMETIC_CATEGORIES.TITLE,
        rarity: 'Common',
        price: 0,
        isDefault: true,
        titleText: 'Novice Crafter',
        nameColor: '#ffffff',
        prefixTag: '[Crafter]',
        description: 'Clean default white player nameplate with standard title.',
        iconSvg: `<svg viewBox="0 0 16 16" width="24" height="24" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="2" y="4" width="12" height="8" fill="#333a41" stroke="#69737b" stroke-width="1"/><rect x="4" y="7" width="8" height="2" fill="#ffffff"/></svg>`
    },
    {
        id: 'title_forager',
        name: 'Forest Forager',
        category: COSMETIC_CATEGORIES.TITLE,
        rarity: 'Uncommon',
        price: 50,
        titleText: 'Forest Forager',
        nameColor: '#4ade80',
        prefixTag: '[Forager]',
        description: 'Vibrant woodland green nameplate with the Forest Forager title.',
        iconSvg: `<svg viewBox="0 0 16 16" width="24" height="24" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="2" y="4" width="12" height="8" fill="#14532d" stroke="#22c55e" stroke-width="1"/><rect x="4" y="7" width="8" height="2" fill="#4ade80"/></svg>`
    },
    {
        id: 'title_delver',
        name: 'Deep Delver',
        category: COSMETIC_CATEGORIES.TITLE,
        rarity: 'Rare',
        price: 100,
        titleText: 'Deep Delver',
        nameColor: '#38bdf8',
        prefixTag: '[Delver]',
        description: 'Glacial diamond blue nameplate worn by seasoned subterranean miners.',
        iconSvg: `<svg viewBox="0 0 16 16" width="24" height="24" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="2" y="4" width="12" height="8" fill="#082f49" stroke="#0284c7" stroke-width="1"/><rect x="4" y="7" width="8" height="2" fill="#38bdf8"/></svg>`
    },
    {
        id: 'title_nether',
        name: 'Nether Champion',
        category: COSMETIC_CATEGORIES.TITLE,
        rarity: 'Rare',
        price: 250,
        titleText: 'Nether Champion',
        nameColor: '#fb923c',
        prefixTag: '[Champion]',
        description: 'Blazing flame orange nameplate earned through mastery of the Nether.',
        iconSvg: `<svg viewBox="0 0 16 16" width="24" height="24" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="2" y="4" width="12" height="8" fill="#431407" stroke="#ea580c" stroke-width="1"/><rect x="4" y="7" width="8" height="2" fill="#fb923c"/></svg>`
    },
    {
        id: 'title_baron',
        name: 'Emerald Baron',
        category: COSMETIC_CATEGORIES.TITLE,
        rarity: 'Epic',
        price: 350,
        titleText: 'Emerald Baron',
        nameColor: '#34d399',
        prefixTag: '[Baron]',
        description: 'Luminous neon emerald nameplate displaying grand trading prestige.',
        iconSvg: `<svg viewBox="0 0 16 16" width="24" height="24" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="2" y="4" width="12" height="8" fill="#064e3b" stroke="#10b981" stroke-width="1"/><rect x="4" y="7" width="8" height="2" fill="#34d399"/></svg>`
    },
    {
        id: 'title_astral',
        name: 'Astral Voyager',
        category: COSMETIC_CATEGORIES.TITLE,
        rarity: 'Legendary',
        price: 500,
        titleText: 'Astral Voyager',
        nameColor: '#c084fc',
        prefixTag: '[✦ Voyager]',
        description: 'Mystical cosmic violet glowing nameplate reserved for planar wanderers.',
        iconSvg: `<svg viewBox="0 0 16 16" width="24" height="24" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="2" y="4" width="12" height="8" fill="#3b0764" stroke="#a855f7" stroke-width="1"/><rect x="4" y="7" width="8" height="2" fill="#c084fc"/></svg>`
    },
    {
        id: 'title_architect',
        name: 'Master Architect',
        category: COSMETIC_CATEGORIES.TITLE,
        rarity: 'Legendary',
        price: 750,
        titleText: 'Master Architect',
        nameColor: '#ffd34d',
        prefixTag: '[👑 Architect]',
        description: 'Brilliant gold nameplate with crown emblem awarded to world-class builders.',
        iconSvg: `<svg viewBox="0 0 16 16" width="24" height="24" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="2" y="4" width="12" height="8" fill="#451a03" stroke="#ffd34d" stroke-width="1"/><rect x="4" y="7" width="8" height="2" fill="#ffd34d"/></svg>`
    },

    // -------------------------------------------------------------------------
    // 4. PROFILE CARD THEMES & BORDERS
    // -------------------------------------------------------------------------
    {
        id: 'theme_slate',
        name: 'Slate Classic',
        category: COSMETIC_CATEGORIES.THEME,
        rarity: 'Common',
        price: 0,
        isDefault: true,
        description: 'Authentic 3D Minecraft slate frame with dark stone bevels.',
        themeClass: 'card-theme-slate',
        borderColor: '#46515a',
        bg: '#181c24',
        iconSvg: `<svg viewBox="0 0 16 16" width="24" height="24" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="1" y="1" width="14" height="14" fill="#181c24" stroke="#46515a" stroke-width="2"/></svg>`
    },
    {
        id: 'theme_spruce',
        name: 'Rustic Wood',
        category: COSMETIC_CATEGORIES.THEME,
        rarity: 'Uncommon',
        price: 60,
        description: 'Hand-carved dark spruce timber border with brass corner studs.',
        themeClass: 'card-theme-spruce',
        borderColor: '#78350f',
        bg: '#1c150e',
        iconSvg: `<svg viewBox="0 0 16 16" width="24" height="24" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="1" y="1" width="14" height="14" fill="#1c150e" stroke="#78350f" stroke-width="2"/><rect x="2" y="2" width="2" height="2" fill="#d97706"/><rect x="12" y="2" width="2" height="2" fill="#d97706"/></svg>`
    },
    {
        id: 'theme_golden',
        name: 'Golden Guild',
        category: COSMETIC_CATEGORIES.THEME,
        rarity: 'Epic',
        price: 250,
        description: 'Opulent polished brass and gold trim with imperial crest bevels.',
        themeClass: 'card-theme-golden',
        borderColor: '#ffd34d',
        bg: '#201a10',
        iconSvg: `<svg viewBox="0 0 16 16" width="24" height="24" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="1" y="1" width="14" height="14" fill="#201a10" stroke="#ffd34d" stroke-width="2"/><rect x="3" y="3" width="10" height="10" stroke="#b45309" stroke-width="1" fill="none"/></svg>`
    },
    {
        id: 'theme_obsidian',
        name: 'Obsidian Citadel',
        category: COSMETIC_CATEGORIES.THEME,
        rarity: 'Epic',
        price: 400,
        description: 'Hardened deep void obsidian with dark runic edge carvings.',
        themeClass: 'card-theme-obsidian',
        borderColor: '#7e22ce',
        bg: '#120b1c',
        iconSvg: `<svg viewBox="0 0 16 16" width="24" height="24" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="1" y="1" width="14" height="14" fill="#120b1c" stroke="#7e22ce" stroke-width="2"/><rect x="3" y="3" width="10" height="10" stroke="#a855f7" stroke-width="1" fill="none"/></svg>`
    },
    {
        id: 'theme_nebula',
        name: 'Astral Nebula',
        category: COSMETIC_CATEGORIES.THEME,
        rarity: 'Legendary',
        price: 600,
        description: 'Pulsing outer planar cosmos with illuminated starlight edges.',
        themeClass: 'card-theme-nebula',
        borderColor: '#c084fc',
        bg: '#16092b',
        iconSvg: `<svg viewBox="0 0 16 16" width="24" height="24" style="image-rendering: pixelated; shape-rendering: crispEdges;"><rect x="1" y="1" width="14" height="14" fill="#16092b" stroke="#c084fc" stroke-width="2"/><rect x="4" y="4" width="8" height="8" stroke="#f5d0fe" stroke-width="1" fill="#3b0764"/></svg>`
    }
];

// Helper to look up a cosmetic by ID
export function getCosmeticItem(id) {
    return COSMETICS_CATALOG.find(item => item.id === id) || null;
}

// Helper to get all cosmetics in a category
export function getCosmeticsByCategory(cat) {
    if (!cat || cat === 'all') return COSMETICS_CATALOG;
    return COSMETICS_CATALOG.filter(item => item.category === cat);
}

// Default profile customization object
export function getDefaultCustomization() {
    return {
        avatarFrame: 'frame_classic',
        bannerPattern: 'banner_slate',
        bannerColor: '#181e24',
        titlePlate: 'title_novice',
        titleId: 'title_novice',
        nameColor: '#ffffff',
        cardTheme: 'theme_slate',
        bio: ''
    };
}

// Check if a user has unlocked a cosmetic
export function isCosmeticUnlocked(profile, cosmeticId) {
    if (!cosmeticId) return true;
    const item = getCosmeticItem(cosmeticId);
    if (!item) return false;
    if (item.isDefault || item.price === 0) return true;
    if (!profile) return false;
    const unlocked = Array.isArray(profile.unlockedCosmetics) ? profile.unlockedCosmetics : [];
    return unlocked.includes(cosmeticId);
}

// Global bridge
try {
    if (typeof window !== 'undefined') {
        window.COSMETICS_CATALOG = COSMETICS_CATALOG;
        window.getCosmeticItem = getCosmeticItem;
        window.getCosmeticsByCategory = getCosmeticsByCategory;
        window.getDefaultCustomization = getDefaultCustomization;
        window.isCosmeticUnlocked = isCosmeticUnlocked;
    }
} catch (e) {}
