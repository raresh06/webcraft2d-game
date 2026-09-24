// =============================================================================
// WEBCRAFT 2D - PIXEL-ART ICONS & SPRITES REGISTRY (js/icons/pixelicons.js)
// Centralized 16x16 Crisp Pixel-Art SVG Library
// Eliminates raw Unicode emojis and hard-coded inline SVGs across the game.
// =============================================================================

/**
 * 16x16 Pixel Art SVGs with crispEdges and authentic Minecraft aesthetic.
 */
export const PIXEL_ICON_DEFS = {
    // -------------------------------------------------------------------------
    // Wrench & Hammer / Developer Tools (Replaces 🛠️)
    // -------------------------------------------------------------------------
    wrench: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Crossed Hammer (Wood handle + Stone head) -->
            <rect x="2" y="13" width="2" height="2" fill="#78350f"/>
            <rect x="4" y="11" width="2" height="2" fill="#92400e"/>
            <rect x="6" y="9" width="2" height="2" fill="#b45309"/>
            <rect x="8" y="7" width="2" height="2" fill="#92400e"/>
            <rect x="10" y="5" width="2" height="2" fill="#64748b"/>
            <rect x="9" y="3" width="4" height="2" fill="#475569"/>
            <rect x="11" y="1" width="4" height="2" fill="#94a3b8"/>
            <rect x="13" y="3" width="2" height="4" fill="#334155"/>
            <!-- Wrench (Steel body + Open jaw) -->
            <rect x="12" y="13" width="2" height="2" fill="#64748b"/>
            <rect x="10" y="11" width="2" height="2" fill="#94a3b8"/>
            <rect x="8" y="9" width="2" height="2" fill="#cbd5e1"/>
            <rect x="6" y="7" width="2" height="2" fill="#94a3b8"/>
            <rect x="4" y="5" width="2" height="2" fill="#cbd5e1"/>
            <!-- Wrench Head -->
            <rect x="2" y="2" width="2" height="3" fill="#cbd5e1"/>
            <rect x="5" y="2" width="2" height="3" fill="#94a3b8"/>
            <rect x="2" y="1" width="5" height="1" fill="#e2e8f0"/>
            <rect x="3" y="2" width="2" height="2" fill="#1e293b"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Lightning Bolt / Energy / Cheats (Replaces ⚡)
    // -------------------------------------------------------------------------
    lightning: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <rect x="7" y="1" width="4" height="2" fill="#fde047"/>
            <rect x="6" y="3" width="4" height="2" fill="#facc15"/>
            <rect x="5" y="5" width="4" height="2" fill="#fde047"/>
            <rect x="4" y="7" width="9" height="2" fill="#facc15"/>
            <rect x="6" y="9" width="4" height="2" fill="#eab308"/>
            <rect x="5" y="11" width="3" height="2" fill="#ca8a04"/>
            <rect x="4" y="13" width="2" height="2" fill="#fde047"/>
            <!-- Highlight glow -->
            <rect x="8" y="2" width="2" height="2" fill="#ffffff"/>
            <rect x="6" y="7" width="4" height="1" fill="#ffffff"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // World / Globe / Earth (Replaces 🌍)
    // -------------------------------------------------------------------------
    world: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Globe base circle outline -->
            <rect x="4" y="1" width="8" height="14" fill="#0284c7"/>
            <rect x="2" y="2" width="12" height="12" fill="#0284c7"/>
            <rect x="1" y="4" width="14" height="8" fill="#0369a1"/>
            <!-- Continents (Green) -->
            <rect x="3" y="3" width="3" height="3" fill="#22c55e"/>
            <rect x="5" y="5" width="3" height="3" fill="#16a34a"/>
            <rect x="9" y="3" width="4" height="2" fill="#22c55e"/>
            <rect x="10" y="5" width="3" height="4" fill="#15803d"/>
            <rect x="4" y="9" width="4" height="3" fill="#22c55e"/>
            <rect x="8" y="10" width="3" height="2" fill="#16a34a"/>
            <!-- Clouds (White) -->
            <rect x="2" y="7" width="4" height="1" fill="#ffffff"/>
            <rect x="9" y="2" width="3" height="1" fill="#f8fafc"/>
            <rect x="11" y="9" width="3" height="1" fill="#ffffff"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Sun / Noon (Replaces ☀️)
    // -------------------------------------------------------------------------
    sun: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Rays -->
            <rect x="7" y="1" width="2" height="2" fill="#f59e0b"/>
            <rect x="7" y="13" width="2" height="2" fill="#f59e0b"/>
            <rect x="1" y="7" width="2" height="2" fill="#f59e0b"/>
            <rect x="13" y="7" width="2" height="2" fill="#f59e0b"/>
            <rect x="3" y="3" width="2" height="2" fill="#fbbf24"/>
            <rect x="11" y="3" width="2" height="2" fill="#fbbf24"/>
            <rect x="3" y="11" width="2" height="2" fill="#fbbf24"/>
            <rect x="11" y="11" width="2" height="2" fill="#fbbf24"/>
            <!-- Solar Core -->
            <rect x="4" y="4" width="8" height="8" fill="#fde047"/>
            <rect x="5" y="5" width="6" height="6" fill="#fef08a"/>
            <rect x="6" y="6" width="3" height="3" fill="#ffffff"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Dawn / Sunrise (Replaces 🌅)
    // -------------------------------------------------------------------------
    dawn: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Sky Gradient -->
            <rect x="1" y="1" width="14" height="2" fill="#3b0764"/>
            <rect x="1" y="3" width="14" height="2" fill="#86198f"/>
            <rect x="1" y="5" width="14" height="2" fill="#e11d48"/>
            <rect x="1" y="7" width="14" height="2" fill="#f97316"/>
            <!-- Rising Sun -->
            <rect x="6" y="6" width="4" height="4" fill="#fde047"/>
            <rect x="7" y="7" width="2" height="2" fill="#ffffff"/>
            <!-- Horizon & Mountains -->
            <rect x="1" y="9" width="14" height="2" fill="#fdba74"/>
            <rect x="1" y="11" width="14" height="4" fill="#0f172a"/>
            <rect x="3" y="10" width="3" height="2" fill="#1e293b"/>
            <rect x="9" y="10" width="4" height="2" fill="#1e293b"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Sunset / Dusk (Replaces 🌇)
    // -------------------------------------------------------------------------
    sunset: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Twilight Sky -->
            <rect x="1" y="1" width="14" height="2" fill="#1e1b4b"/>
            <rect x="1" y="3" width="14" height="2" fill="#4c1d95"/>
            <rect x="1" y="5" width="14" height="2" fill="#9d174d"/>
            <rect x="1" y="7" width="14" height="2" fill="#ea580c"/>
            <!-- Setting Sun sinking into mountains -->
            <rect x="5" y="6" width="6" height="3" fill="#fbbf24"/>
            <rect x="6" y="7" width="4" height="2" fill="#fef08a"/>
            <!-- Dark Skyline -->
            <rect x="1" y="9" width="14" height="6" fill="#090d16"/>
            <rect x="2" y="8" width="3" height="2" fill="#111827"/>
            <rect x="8" y="8" width="4" height="2" fill="#111827"/>
            <rect x="13" y="8" width="2" height="2" fill="#111827"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Moon / Midnight (Replaces 🌙)
    // -------------------------------------------------------------------------
    moon: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Crescent Moon -->
            <rect x="5" y="2" width="4" height="2" fill="#f8fafc"/>
            <rect x="4" y="4" width="4" height="2" fill="#f1f5f9"/>
            <rect x="3" y="6" width="4" height="4" fill="#e2e8f0"/>
            <rect x="4" y="10" width="4" height="2" fill="#cbd5e1"/>
            <rect x="5" y="12" width="4" height="2" fill="#94a3b8"/>
            <!-- Moon Shadow cut / Inner Crescent -->
            <rect x="7" y="4" width="2" height="8" fill="#0f172a"/>
            <!-- Stars -->
            <rect x="12" y="3" width="2" height="2" fill="#fde047"/>
            <rect x="11" y="9" width="1" height="1" fill="#fef08a"/>
            <rect x="13" y="12" width="2" height="2" fill="#fde047"/>
            <rect x="2" y="13" width="1" height="1" fill="#ffffff"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Surface / Mountain Landscape (Replaces 🏞️)
    // -------------------------------------------------------------------------
    surface: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Sky -->
            <rect x="1" y="1" width="14" height="8" fill="#38bdf8"/>
            <rect x="2" y="2" width="2" height="2" fill="#fef08a"/>
            <rect x="9" y="3" width="4" height="2" fill="#ffffff"/>
            <!-- Mountains -->
            <rect x="5" y="5" width="2" height="2" fill="#e2e8f0"/>
            <rect x="4" y="7" width="4" height="2" fill="#64748b"/>
            <!-- Grassy Terrain -->
            <rect x="1" y="9" width="14" height="3" fill="#22c55e"/>
            <rect x="1" y="12" width="14" height="3" fill="#78350f"/>
            <!-- Oak Tree -->
            <rect x="11" y="6" width="3" height="3" fill="#15803d"/>
            <rect x="12" y="9" width="1" height="2" fill="#451a03"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Bed / Spawn (Replaces 🛏️)
    // -------------------------------------------------------------------------
    bed: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- White Pillow -->
            <rect x="2" y="5" width="4" height="4" fill="#f8fafc"/>
            <rect x="2" y="5" width="4" height="1" fill="#cbd5e1"/>
            <!-- Red Blanket -->
            <rect x="6" y="5" width="8" height="4" fill="#dc2626"/>
            <rect x="6" y="5" width="8" height="1" fill="#ef4444"/>
            <!-- Wood Bed Frame -->
            <rect x="1" y="9" width="14" height="2" fill="#78350f"/>
            <!-- Bed Legs -->
            <rect x="1" y="11" width="2" height="3" fill="#451a03"/>
            <rect x="13" y="11" width="2" height="3" fill="#451a03"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Pickaxe / Deep Caves (Replaces ⛏️)
    // -------------------------------------------------------------------------
    pickaxe: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Diamond Pickaxe Head -->
            <rect x="7" y="1" width="7" height="2" fill="#38bdf8"/>
            <rect x="12" y="3" width="2" height="3" fill="#38bdf8"/>
            <rect x="5" y="3" width="2" height="3" fill="#0284c7"/>
            <rect x="9" y="3" width="2" height="2" fill="#0ea5e9"/>
            <rect x="13" y="2" width="2" height="2" fill="#bae6fd"/>
            <rect x="4" y="5" width="2" height="2" fill="#0369a1"/>
            <!-- Oak Wood Handle -->
            <rect x="8" y="6" width="2" height="2" fill="#78350f"/>
            <rect x="6" y="8" width="2" height="2" fill="#92400e"/>
            <rect x="4" y="10" width="2" height="2" fill="#78350f"/>
            <rect x="2" y="12" width="2" height="2" fill="#92400e"/>
            <rect x="1" y="13" width="2" height="2" fill="#451a03"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Void / Bedrock / Cosmic Rift (Replaces 🌌)
    // -------------------------------------------------------------------------
    void: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Obsidian Bedrock Frame -->
            <rect x="1" y="1" width="14" height="14" fill="#090d16"/>
            <!-- Bedrock Pattern -->
            <rect x="2" y="2" width="3" height="3" fill="#1e293b"/>
            <rect x="11" y="3" width="3" height="2" fill="#334155"/>
            <rect x="3" y="11" width="4" height="3" fill="#1e293b"/>
            <rect x="10" y="10" width="4" height="4" fill="#334155"/>
            <!-- Purple Void Portal Core -->
            <rect x="5" y="4" width="6" height="8" fill="#581c87"/>
            <rect x="6" y="5" width="4" height="6" fill="#7e22ce"/>
            <rect x="7" y="6" width="2" height="4" fill="#c084fc"/>
            <!-- Sparkles -->
            <rect x="8" y="7" width="1" height="1" fill="#ffffff"/>
            <rect x="4" y="7" width="1" height="1" fill="#e9d5ff"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Compass / Kael Navigator (Replaces 🧭)
    // -------------------------------------------------------------------------
    compass: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Brass Case -->
            <rect x="4" y="1" width="8" height="14" fill="#ca8a04"/>
            <rect x="2" y="3" width="12" height="10" fill="#eab308"/>
            <rect x="1" y="5" width="14" height="6" fill="#ca8a04"/>
            <!-- Dial Face -->
            <rect x="3" y="3" width="10" height="10" fill="#1e293b"/>
            <!-- North Needle (Red) -->
            <rect x="7" y="4" width="2" height="4" fill="#ef4444"/>
            <rect x="8" y="3" width="1" height="2" fill="#f87171"/>
            <!-- South Needle (Silver/White) -->
            <rect x="7" y="8" width="2" height="4" fill="#cbd5e1"/>
            <!-- Center Pivot Pin -->
            <rect x="7" y="7" width="2" height="2" fill="#ffd34d"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Cursor Arrow / Target (Replaces 🖱️)
    // -------------------------------------------------------------------------
    cursor: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Black Drop Shadow Outline -->
            <rect x="2" y="1" width="3" height="12" fill="#000000"/>
            <rect x="2" y="1" width="11" height="3" fill="#000000"/>
            <rect x="5" y="4" width="3" height="3" fill="#000000"/>
            <rect x="7" y="6" width="3" height="3" fill="#000000"/>
            <rect x="9" y="8" width="3" height="3" fill="#000000"/>
            <rect x="6" y="9" width="3" height="6" fill="#000000"/>
            <rect x="8" y="13" width="3" height="3" fill="#000000"/>
            <!-- White Cursor Body -->
            <rect x="3" y="2" width="1" height="10" fill="#ffffff"/>
            <rect x="4" y="3" width="1" height="8" fill="#ffffff"/>
            <rect x="5" y="4" width="1" height="6" fill="#ffffff"/>
            <rect x="6" y="5" width="1" height="5" fill="#ffffff"/>
            <rect x="7" y="6" width="1" height="3" fill="#ffffff"/>
            <rect x="8" y="7" width="1" height="2" fill="#ffffff"/>
            <!-- Tail -->
            <rect x="7" y="9" width="1" height="4" fill="#ffffff"/>
            <rect x="8" y="11" width="1" height="3" fill="#ffffff"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Monster Face / Creeper Silhouette (Replaces 👾)
    // -------------------------------------------------------------------------
    monster: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Creeper Green Head -->
            <rect x="2" y="2" width="12" height="12" fill="#22c55e"/>
            <rect x="3" y="3" width="10" height="10" fill="#16a34a"/>
            <!-- Eyes (Black) -->
            <rect x="4" y="5" width="2" height="2" fill="#052e16"/>
            <rect x="10" y="5" width="2" height="2" fill="#052e16"/>
            <!-- Snout & Mouth -->
            <rect x="7" y="7" width="2" height="3" fill="#052e16"/>
            <rect x="6" y="8" width="4" height="4" fill="#052e16"/>
            <rect x="5" y="9" width="1" height="4" fill="#052e16"/>
            <rect x="10" y="9" width="1" height="4" fill="#052e16"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Chest / Item Spawner / Drawer (Replaces 📦)
    // -------------------------------------------------------------------------
    chest: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Wood Chest Body -->
            <rect x="2" y="3" width="12" height="10" fill="#78350f"/>
            <rect x="3" y="4" width="10" height="8" fill="#b45309"/>
            <!-- Lid Border -->
            <rect x="2" y="6" width="12" height="1" fill="#451a03"/>
            <!-- Metal Corners -->
            <rect x="2" y="3" width="2" height="10" fill="#451a03"/>
            <rect x="12" y="3" width="2" height="10" fill="#451a03"/>
            <!-- Front Lock Latch (Silver/Gold) -->
            <rect x="7" y="5" width="2" height="3" fill="#f8fafc"/>
            <rect x="7" y="6" width="2" height="1" fill="#94a3b8"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Scroll / Changelog / Sign (Replaces 📜 in index.html)
    // -------------------------------------------------------------------------
    scroll: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Parchment Paper Body -->
            <rect x="3" y="2" width="10" height="12" fill="#fef3c7"/>
            <rect x="4" y="3" width="8" height="10" fill="#fde68a"/>
            <!-- Rolled Edges -->
            <rect x="2" y="1" width="12" height="2" fill="#d97706"/>
            <rect x="2" y="13" width="12" height="2" fill="#d97706"/>
            <rect x="1" y="2" width="2" height="1" fill="#b45309"/>
            <rect x="13" y="13" width="2" height="1" fill="#b45309"/>
            <!-- Written Text Lines -->
            <rect x="5" y="4" width="6" height="1" fill="#78350f"/>
            <rect x="5" y="6" width="6" height="1" fill="#78350f"/>
            <rect x="5" y="8" width="5" height="1" fill="#78350f"/>
            <rect x="5" y="10" width="4" height="1" fill="#78350f"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Emerald (Standard Green Currency)
    // -------------------------------------------------------------------------
    emerald: `
        <svg class="{CLASS}" viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="1" width="6" height="1" fill="#0b3d1d"/>
            <rect x="4" y="2" width="1" height="1" fill="#0b3d1d"/>
            <rect x="11" y="2" width="1" height="1" fill="#0b3d1d"/>
            <rect x="3" y="3" width="1" height="1" fill="#0b3d1d"/>
            <rect x="12" y="3" width="1" height="1" fill="#0b3d1d"/>
            <rect x="2" y="4" width="1" height="1" fill="#0b3d1d"/>
            <rect x="13" y="4" width="1" height="1" fill="#0b3d1d"/>
            <rect x="1" y="5" width="1" height="6" fill="#0b3d1d"/>
            <rect x="14" y="5" width="1" height="6" fill="#0b3d1d"/>
            <rect x="2" y="11" width="1" height="1" fill="#0b3d1d"/>
            <rect x="13" y="11" width="1" height="1" fill="#0b3d1d"/>
            <rect x="3" y="12" width="1" height="1" fill="#0b3d1d"/>
            <rect x="12" y="12" width="1" height="1" fill="#0b3d1d"/>
            <rect x="4" y="13" width="1" height="1" fill="#0b3d1d"/>
            <rect x="11" y="13" width="1" height="1" fill="#0b3d1d"/>
            <rect x="5" y="14" width="6" height="1" fill="#0b3d1d"/>
            <rect x="11" y="5" width="3" height="6" fill="#136d33"/>
            <rect x="5" y="13" width="6" height="1" fill="#136d33"/>
            <rect x="10" y="11" width="3" height="2" fill="#136d33"/>
            <rect x="8" y="12" width="3" height="1" fill="#0e5326"/>
            <rect x="5" y="2" width="6" height="1" fill="#1b9549"/>
            <rect x="4" y="4" width="8" height="1" fill="#46f381"/>
            <rect x="3" y="5" width="8" height="6" fill="#17c858"/>
            <rect x="3" y="11" width="7" height="1" fill="#17c858"/>
            <rect x="4" y="12" width="4" height="1" fill="#136d33"/>
            <rect x="5" y="2" width="5" height="1" fill="#a8ffc6"/>
            <rect x="4" y="3" width="3" height="1" fill="#a8ffc6"/>
            <rect x="3" y="4" width="2" height="1" fill="#a8ffc6"/>
            <rect x="2" y="5" width="1" height="3" fill="#a8ffc6"/>
            <rect x="5" y="3" width="3" height="2" fill="#ffffff"/>
            <rect x="4" y="4" width="2" height="1" fill="#ffffff"/>
            <rect x="6" y="5" width="2" height="1" fill="#a8ffc6"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Astral Emerald (Purple Prestige Currency)
    // -------------------------------------------------------------------------
    astral_emerald: `
        <svg class="{CLASS}" viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="1" width="6" height="1" fill="#1e0836"/>
            <rect x="4" y="2" width="1" height="1" fill="#1e0836"/>
            <rect x="11" y="2" width="1" height="1" fill="#1e0836"/>
            <rect x="3" y="3" width="1" height="1" fill="#1e0836"/>
            <rect x="12" y="3" width="1" height="1" fill="#1e0836"/>
            <rect x="2" y="4" width="1" height="1" fill="#1e0836"/>
            <rect x="13" y="4" width="1" height="1" fill="#1e0836"/>
            <rect x="1" y="5" width="1" height="6" fill="#1e0836"/>
            <rect x="14" y="5" width="1" height="6" fill="#1e0836"/>
            <rect x="2" y="11" width="1" height="1" fill="#1e0836"/>
            <rect x="13" y="11" width="1" height="1" fill="#1e0836"/>
            <rect x="3" y="12" width="1" height="1" fill="#1e0836"/>
            <rect x="12" y="12" width="1" height="1" fill="#1e0836"/>
            <rect x="4" y="13" width="1" height="1" fill="#1e0836"/>
            <rect x="11" y="13" width="1" height="1" fill="#1e0836"/>
            <rect x="5" y="14" width="6" height="1" fill="#1e0836"/>
            <rect x="11" y="5" width="3" height="6" fill="#4c1d95"/>
            <rect x="5" y="13" width="6" height="1" fill="#4c1d95"/>
            <rect x="10" y="11" width="3" height="2" fill="#4c1d95"/>
            <rect x="8" y="12" width="3" height="1" fill="#3b0764"/>
            <rect x="5" y="2" width="6" height="1" fill="#6d28d9"/>
            <rect x="4" y="4" width="8" height="1" fill="#c084fc"/>
            <rect x="3" y="5" width="8" height="6" fill="#9333ea"/>
            <rect x="3" y="11" width="7" height="1" fill="#9333ea"/>
            <rect x="4" y="12" width="4" height="1" fill="#4c1d95"/>
            <rect x="5" y="2" width="5" height="1" fill="#e9d5ff"/>
            <rect x="4" y="3" width="3" height="1" fill="#e9d5ff"/>
            <rect x="3" y="4" width="2" height="1" fill="#e9d5ff"/>
            <rect x="2" y="5" width="1" height="3" fill="#e9d5ff"/>
            <rect x="5" y="3" width="3" height="2" fill="#ffffff"/>
            <rect x="4" y="4" width="2" height="1" fill="#ffffff"/>
            <rect x="6" y="5" width="2" height="1" fill="#e9d5ff"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Padlock / Security
    // -------------------------------------------------------------------------
    padlock: `
        <svg viewBox="0 0 12 12" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;display:inline-block;vertical-align:middle;" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="1" width="6" height="5" fill="#94a3b8"/>
            <rect x="5" y="3" width="2" height="3" fill="#1e293b"/>
            <rect x="2" y="5" width="8" height="6" fill="#f59e0b"/>
            <rect x="5" y="7" width="2" height="2" fill="#78350f"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Warning Triangle
    // -------------------------------------------------------------------------
    warning: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="pixel-art-warning-icon inline-block flex-shrink-0 align-middle {CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <rect x="7" y="1" width="2" height="2" fill="#fbbf24"/>
            <rect x="6" y="3" width="4" height="2" fill="#fbbf24"/>
            <rect x="5" y="5" width="6" height="2" fill="#fbbf24"/>
            <rect x="4" y="7" width="8" height="2" fill="#fbbf24"/>
            <rect x="3" y="9" width="10" height="2" fill="#fbbf24"/>
            <rect x="2" y="11" width="12" height="2" fill="#fbbf24"/>
            <rect x="1" y="13" width="14" height="2" fill="#f59e0b"/>
            <rect x="7" y="5" width="2" height="4" fill="#000000"/>
            <rect x="7" y="10" width="2" height="2" fill="#000000"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Cogwheel / Settings / General (Bedrock General Tab)
    // -------------------------------------------------------------------------
    gear: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Outer teeth -->
            <rect x="7" y="1" width="2" height="2" fill="#d97706"/>
            <rect x="7" y="13" width="2" height="2" fill="#92400e"/>
            <rect x="1" y="7" width="2" height="2" fill="#b45309"/>
            <rect x="13" y="7" width="2" height="2" fill="#92400e"/>
            <rect x="3" y="3" width="2" height="2" fill="#f59e0b"/>
            <rect x="11" y="3" width="2" height="2" fill="#d97706"/>
            <rect x="3" y="11" width="2" height="2" fill="#92400e"/>
            <rect x="11" y="11" width="2" height="2" fill="#78350f"/>
            <!-- Wheel Body -->
            <rect x="4" y="4" width="8" height="8" fill="#f59e0b"/>
            <rect x="5" y="5" width="6" height="6" fill="#fbbf24"/>
            <!-- Center Hole -->
            <rect x="7" y="7" width="2" height="2" fill="#1e293b"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Mountain / Terrain / World Generation (Bedrock World Tab)
    // -------------------------------------------------------------------------
    terrain: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Sky -->
            <rect x="1" y="1" width="14" height="6" fill="#38bdf8"/>
            <rect x="12" y="2" width="2" height="2" fill="#fef08a"/>
            <!-- Snow Cap Peak Left -->
            <rect x="4" y="4" width="3" height="2" fill="#ffffff"/>
            <rect x="3" y="6" width="5" height="2" fill="#64748b"/>
            <!-- Snow Cap Peak Right -->
            <rect x="10" y="3" width="3" height="2" fill="#ffffff"/>
            <rect x="9" y="5" width="5" height="3" fill="#475569"/>
            <!-- Grass & Earth Foothills -->
            <rect x="1" y="8" width="14" height="4" fill="#16a34a"/>
            <rect x="2" y="9" width="4" height="2" fill="#22c55e"/>
            <rect x="1" y="12" width="14" height="3" fill="#78350f"/>
            <rect x="3" y="13" width="2" height="1" fill="#92400e"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Sword / Gameplay & Combat (Bedrock Gameplay Tab)
    // -------------------------------------------------------------------------
    sword: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Diamond Blade Point -->
            <rect x="12" y="1" width="3" height="3" fill="#38bdf8"/>
            <rect x="13" y="2" width="1" height="1" fill="#bae6fd"/>
            <rect x="10" y="3" width="3" height="3" fill="#0284c7"/>
            <rect x="11" y="3" width="2" height="2" fill="#38bdf8"/>
            <rect x="8" y="5" width="3" height="3" fill="#0284c7"/>
            <rect x="9" y="5" width="2" height="2" fill="#38bdf8"/>
            <rect x="6" y="7" width="3" height="3" fill="#0369a1"/>
            <rect x="7" y="7" width="2" height="2" fill="#0284c7"/>
            <!-- Crossguard (Gold / Brass) -->
            <rect x="4" y="8" width="3" height="2" fill="#f59e0b"/>
            <rect x="7" y="11" width="2" height="3" fill="#d97706"/>
            <rect x="5" y="9" width="3" height="3" fill="#78350f"/>
            <!-- Hilt Handle -->
            <rect x="3" y="11" width="2" height="2" fill="#92400e"/>
            <!-- Pommel -->
            <rect x="1" y="13" width="2" height="2" fill="#f59e0b"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Dice / Random Seed Generator
    // -------------------------------------------------------------------------
    dice: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Die Body -->
            <rect x="2" y="2" width="12" height="12" fill="#f8fafc"/>
            <rect x="2" y="13" width="12" height="1" fill="#cbd5e1"/>
            <rect x="13" y="2" width="1" height="12" fill="#cbd5e1"/>
            <rect x="1" y="2" width="1" height="12" fill="#94a3b8"/>
            <rect x="2" y="1" width="12" height="1" fill="#94a3b8"/>
            <rect x="2" y="14" width="12" height="1" fill="#64748b"/>
            <rect x="14" y="2" width="1" height="12" fill="#64748b"/>
            <!-- 5 Pips Pattern -->
            <rect x="4" y="4" width="2" height="2" fill="#0f172a"/>
            <rect x="10" y="4" width="2" height="2" fill="#0f172a"/>
            <rect x="7" y="7" width="2" height="2" fill="#dc2626"/>
            <rect x="4" y="10" width="2" height="2" fill="#0f172a"/>
            <rect x="10" y="10" width="2" height="2" fill="#0f172a"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Grid View Switcher
    // -------------------------------------------------------------------------
    grid: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="5" height="5" fill="#4ade80"/>
            <rect x="9" y="2" width="5" height="5" fill="#4ade80"/>
            <rect x="2" y="9" width="5" height="5" fill="#4ade80"/>
            <rect x="9" y="9" width="5" height="5" fill="#4ade80"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // List View Switcher
    // -------------------------------------------------------------------------
    list: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="3" width="12" height="2" fill="#94a3b8"/>
            <rect x="2" y="7" width="12" height="2" fill="#94a3b8"/>
            <rect x="2" y="11" width="12" height="2" fill="#94a3b8"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Pencil / Rename World
    // -------------------------------------------------------------------------
    pencil: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Eraser & Metal Band -->
            <rect x="12" y="1" width="3" height="3" fill="#f43f5e"/>
            <rect x="11" y="3" width="2" height="2" fill="#cbd5e1"/>
            <!-- Yellow Wooden Body -->
            <rect x="9" y="4" width="3" height="3" fill="#facc15"/>
            <rect x="7" y="6" width="3" height="3" fill="#eab308"/>
            <rect x="5" y="8" width="3" height="3" fill="#facc15"/>
            <rect x="3" y="10" width="3" height="3" fill="#ca8a04"/>
            <!-- Wood Tip -->
            <rect x="2" y="12" width="2" height="2" fill="#fed7aa"/>
            <!-- Graphite Lead -->
            <rect x="1" y="14" width="2" height="1" fill="#0f172a"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Clone / Duplicate World
    // -------------------------------------------------------------------------
    clone: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Back Card -->
            <rect x="5" y="1" width="10" height="10" fill="#475569"/>
            <rect x="6" y="2" width="8" height="8" fill="#64748b"/>
            <!-- Front Card -->
            <rect x="1" y="5" width="10" height="10" fill="#1e293b"/>
            <rect x="2" y="6" width="8" height="8" fill="#38bdf8"/>
            <rect x="3" y="7" width="6" height="2" fill="#bae6fd"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Trash / Delete World
    // -------------------------------------------------------------------------
    trash: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <!-- Lid -->
            <rect x="6" y="1" width="4" height="2" fill="#ef4444"/>
            <rect x="2" y="3" width="12" height="2" fill="#dc2626"/>
            <!-- Can Body -->
            <rect x="3" y="5" width="10" height="10" fill="#991b1b"/>
            <rect x="4" y="6" width="8" height="8" fill="#7f1d1d"/>
            <!-- Vertical Grooves -->
            <rect x="5" y="7" width="1" height="6" fill="#ef4444"/>
            <rect x="8" y="7" width="1" height="6" fill="#ef4444"/>
            <rect x="10" y="7" width="1" height="6" fill="#ef4444"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Play Triangle
    // -------------------------------------------------------------------------
    play: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="2" width="2" height="12" fill="#22c55e"/>
            <rect x="5" y="3" width="2" height="10" fill="#22c55e"/>
            <rect x="7" y="4" width="2" height="8" fill="#4ade80"/>
            <rect x="9" y="5" width="2" height="6" fill="#4ade80"/>
            <rect x="11" y="6" width="2" height="4" fill="#86efac"/>
            <rect x="13" y="7" width="1" height="2" fill="#ffffff"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Search (Magnifying Glass)
    // -------------------------------------------------------------------------
    search: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="1" width="6" height="2" fill="#cbd5e1"/>
            <rect x="1" y="3" width="2" height="6" fill="#cbd5e1"/>
            <rect x="9" y="3" width="2" height="6" fill="#cbd5e1"/>
            <rect x="3" y="9" width="6" height="2" fill="#cbd5e1"/>
            <rect x="3" y="3" width="6" height="6" fill="#0f172a" fill-opacity="0.6"/>
            <rect x="8" y="8" width="3" height="3" fill="#64748b"/>
            <rect x="10" y="10" width="3" height="3" fill="#94a3b8"/>
            <rect x="12" y="12" width="3" height="3" fill="#cbd5e1"/>
            <rect x="13" y="13" width="2" height="2" fill="#f8fafc"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Checkmark (Green Unlocked)
    // -------------------------------------------------------------------------
    check: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="7" width="2" height="3" fill="#22c55e"/>
            <rect x="4" y="9" width="2" height="3" fill="#22c55e"/>
            <rect x="6" y="11" width="3" height="3" fill="#4ade80"/>
            <rect x="8" y="9" width="2" height="3" fill="#22c55e"/>
            <rect x="10" y="7" width="2" height="3" fill="#22c55e"/>
            <rect x="12" y="4" width="2" height="4" fill="#4ade80"/>
            <rect x="13" y="2" width="2" height="3" fill="#86efac"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Pin / Thumbtack
    // -------------------------------------------------------------------------
    pin: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <rect x="7" y="1" width="2" height="3" fill="#fbbf24"/>
            <rect x="5" y="4" width="6" height="3" fill="#f59e0b"/>
            <rect x="4" y="7" width="8" height="2" fill="#d97706"/>
            <rect x="7" y="9" width="2" height="5" fill="#e2e8f0"/>
            <rect x="7" y="14" width="2" height="1" fill="#94a3b8"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Reset / Reload
    // -------------------------------------------------------------------------
    reset: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="2" width="5" height="2" fill="#ef4444"/>
            <rect x="11" y="4" width="2" height="4" fill="#ef4444"/>
            <rect x="10" y="8" width="2" height="3" fill="#ef4444"/>
            <rect x="6" y="11" width="4" height="2" fill="#ef4444"/>
            <rect x="3" y="8" width="2" height="3" fill="#ef4444"/>
            <rect x="3" y="5" width="2" height="3" fill="#ef4444"/>
            <polygon points="2,2 7,2 5,6" fill="#ef4444"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Trophy (Milestones / Achievements)
    // -------------------------------------------------------------------------
    trophy: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="12" height="2" fill="#fbbf24"/>
            <rect x="1" y="4" width="14" height="4" fill="#f59e0b"/>
            <rect x="3" y="8" width="10" height="3" fill="#d97706"/>
            <rect x="5" y="11" width="6" height="2" fill="#b45309"/>
            <rect x="7" y="13" width="2" height="1" fill="#78350f"/>
            <rect x="4" y="14" width="8" height="2" fill="#92400e"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Sprout (Easy Tier)
    // -------------------------------------------------------------------------
    sprout: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <rect x="7" y="7" width="2" height="8" fill="#15803d"/>
            <rect x="3" y="4" width="4" height="3" fill="#4ade80"/>
            <rect x="2" y="3" width="5" height="2" fill="#86efac"/>
            <rect x="9" y="3" width="5" height="3" fill="#22c55e"/>
            <rect x="10" y="2" width="4" height="2" fill="#4ade80"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Ingot (Medium Tier)
    // -------------------------------------------------------------------------
    ingot: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="5" width="10" height="6" fill="#94a3b8"/>
            <rect x="4" y="4" width="8" height="2" fill="#e2e8f0"/>
            <rect x="3" y="11" width="10" height="1" fill="#475569"/>
            <rect x="2" y="6" width="1" height="4" fill="#cbd5e1"/>
            <rect x="13" y="6" width="1" height="4" fill="#475569"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Diamond (Hard Tier)
    // -------------------------------------------------------------------------
    diamond: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <polygon points="8,1 14,6 8,15 2,6" fill="#06b6d4"/>
            <polygon points="8,3 12,6 8,13 4,6" fill="#67e8f9"/>
            <rect x="7" y="5" width="2" height="3" fill="#ecfeff"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Crown (Master Tier)
    // -------------------------------------------------------------------------
    crown: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="11" width="12" height="3" fill="#d97706"/>
            <rect x="2" y="6" width="2" height="6" fill="#f59e0b"/>
            <rect x="7" y="4" width="2" height="8" fill="#f59e0b"/>
            <rect x="12" y="6" width="2" height="6" fill="#f59e0b"/>
            <rect x="2" y="4" width="2" height="2" fill="#fef08a"/>
            <rect x="7" y="2" width="2" height="2" fill="#fef08a"/>
            <rect x="12" y="4" width="2" height="2" fill="#fef08a"/>
            <rect x="5" y="8" width="2" height="4" fill="#b45309"/>
            <rect x="9" y="8" width="2" height="4" fill="#b45309"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Close / X Mark
    // -------------------------------------------------------------------------
    close: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="2" height="2" fill="#cbd5e1"/>
            <rect x="4" y="4" width="2" height="2" fill="#cbd5e1"/>
            <rect x="6" y="6" width="4" height="4" fill="#cbd5e1"/>
            <rect x="10" y="4" width="2" height="2" fill="#cbd5e1"/>
            <rect x="12" y="2" width="2" height="2" fill="#cbd5e1"/>
            <rect x="4" y="10" width="2" height="2" fill="#cbd5e1"/>
            <rect x="2" y="12" width="2" height="2" fill="#cbd5e1"/>
            <rect x="10" y="10" width="2" height="2" fill="#cbd5e1"/>
            <rect x="12" y="12" width="2" height="2" fill="#cbd5e1"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Arrow Right (Replaces ➔)
    // -------------------------------------------------------------------------
    arrow_right: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="7" width="8" height="2" fill="currentColor"/>
            <rect x="8" y="5" width="2" height="6" fill="currentColor"/>
            <rect x="10" y="6" width="2" height="4" fill="currentColor"/>
            <rect x="12" y="7" width="2" height="2" fill="currentColor"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Sparkle / Star (Replaces ✦ and ★)
    // -------------------------------------------------------------------------
    sparkle: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <rect x="7" y="1" width="2" height="14" fill="currentColor"/>
            <rect x="1" y="7" width="14" height="2" fill="currentColor"/>
            <rect x="6" y="4" width="4" height="8" fill="currentColor"/>
            <rect x="4" y="6" width="8" height="4" fill="currentColor"/>
            <rect x="7" y="7" width="2" height="2" fill="#ffffff"/>
        </svg>
    `,

    // -------------------------------------------------------------------------
    // Clipboard / Copy (Replaces 📋)
    // -------------------------------------------------------------------------
    clipboard: `
        <svg viewBox="0 0 16 16" width="{SIZE}" height="{SIZE}" class="{CLASS}" style="{STYLE}image-rendering:pixelated;shape-rendering:crispEdges;" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="2" width="10" height="13" fill="#92400e"/>
            <rect x="4" y="3" width="8" height="11" fill="#fed7aa"/>
            <rect x="6" y="1" width="4" height="3" fill="#64748b"/>
            <rect x="7" y="2" width="2" height="1" fill="#cbd5e1"/>
            <rect x="5" y="6" width="6" height="1" fill="#78350f"/>
            <rect x="5" y="8" width="6" height="1" fill="#78350f"/>
            <rect x="5" y="10" width="4" height="1" fill="#78350f"/>
        </svg>
    `
};

/**
 * Get an SVG pixel icon by key.
 * @param {string} name - The icon name (e.g. 'wrench', 'sun', 'moon', 'chest', etc.)
 * @param {number} [size=16] - Size in pixels (width & height)
 * @param {string} [className=''] - Optional CSS class names
 * @param {string} [extraStyle=''] - Optional inline style string
 * @returns {string} The formatted SVG markup
 */
export function getPixelIconSvg(name, size = 16, className = '', extraStyle = '') {
    const key = (name || '').toLowerCase().trim();
    const template = PIXEL_ICON_DEFS[key] || PIXEL_ICON_DEFS.wrench;

    const stylePrefix = extraStyle ? (extraStyle.endsWith(';') ? extraStyle : `${extraStyle};`) : '';
    return template
        .replace(/{SIZE}/g, String(size))
        .replace(/{CLASS}/g, className)
        .replace(/{STYLE}/g, stylePrefix);
}

// Aliases for convenience & backward compatibility
export const getPixelIcon = getPixelIconSvg;
export const getPixelEmeraldSvg = (size = 14, cls = '', style = '') => getPixelIconSvg('emerald', size, cls, style);
export const getPixelAstralEmeraldSvg = (size = 14, cls = '', style = '') => getPixelIconSvg('astral_emerald', size, cls, style);
export const getPixelPadlockSvg = (size = 12, cls = '', style = '') => getPixelIconSvg('padlock', size, cls, style);
export const getPixelWarningSvg = (size = 18, cls = '', style = '') => getPixelIconSvg('warning', size, cls, style);
export const getPixelSearchSvg = (size = 16, cls = '', style = '') => getPixelIconSvg('search', size, cls, style);
export const getPixelCheckSvg = (size = 14, cls = '', style = '') => getPixelIconSvg('check', size, cls, style);
export const getPixelPinSvg = (size = 14, cls = '', style = '') => getPixelIconSvg('pin', size, cls, style);
export const getPixelResetSvg = (size = 14, cls = '', style = '') => getPixelIconSvg('reset', size, cls, style);
export const getPixelTrophySvg = (size = 18, cls = '', style = '') => getPixelIconSvg('trophy', size, cls, style);
export const getPixelCloseSvg = (size = 12, cls = '', style = '') => getPixelIconSvg('close', size, cls, style);
export const getPixelSproutSvg = (size = 14, cls = '', style = '') => getPixelIconSvg('sprout', size, cls, style);
export const getPixelIngotSvg = (size = 14, cls = '', style = '') => getPixelIconSvg('ingot', size, cls, style);
export const getPixelDiamondSvg = (size = 14, cls = '', style = '') => getPixelIconSvg('diamond', size, cls, style);
export const getPixelCrownSvg = (size = 14, cls = '', style = '') => getPixelIconSvg('crown', size, cls, style);
export const getPixelArrowRightSvg = (size = 12, cls = '', style = '') => getPixelIconSvg('arrow_right', size, cls, style);
export const getPixelSparkleSvg = (size = 12, cls = '', style = '') => getPixelIconSvg('sparkle', size, cls, style);
export const getPixelClipboardSvg = (size = 14, cls = '', style = '') => getPixelIconSvg('clipboard', size, cls, style);

// Attach globally for window scripts
if (typeof window !== 'undefined') {
    window.PixelIcons = {
        defs: PIXEL_ICON_DEFS,
        get: getPixelIconSvg,
        getPixelIconSvg,
        getPixelEmeraldSvg,
        getPixelAstralEmeraldSvg,
        getPixelPadlockSvg,
        getPixelWarningSvg,
        getPixelSearchSvg,
        getPixelCheckSvg,
        getPixelPinSvg,
        getPixelResetSvg,
        getPixelTrophySvg,
        getPixelCloseSvg,
        getPixelSproutSvg,
        getPixelIngotSvg,
        getPixelDiamondSvg,
        getPixelCrownSvg,
        getPixelArrowRightSvg,
        getPixelSparkleSvg,
        getPixelClipboardSvg
    };
    window.getPixelIconSvg = getPixelIconSvg;
    window.getPixelSearchSvg = getPixelSearchSvg;
    window.getPixelCheckSvg = getPixelCheckSvg;
    window.getPixelPinSvg = getPixelPinSvg;
    window.getPixelResetSvg = getPixelResetSvg;
    window.getPixelTrophySvg = getPixelTrophySvg;
    window.getPixelCloseSvg = getPixelCloseSvg;
    window.getPixelSproutSvg = getPixelSproutSvg;
    window.getPixelIngotSvg = getPixelIngotSvg;
    window.getPixelDiamondSvg = getPixelDiamondSvg;
    window.getPixelCrownSvg = getPixelCrownSvg;
    window.getPixelArrowRightSvg = getPixelArrowRightSvg;
    window.getPixelSparkleSvg = getPixelSparkleSvg;
    window.getPixelClipboardSvg = getPixelClipboardSvg;
}
