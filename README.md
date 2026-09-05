<img width="1440" height="900" alt="image" src="https://github.com/user-attachments/assets/24766ac6-143f-4b39-bcfe-6f2ee37f3982" />

# ⛏️ Webcraft2D

**Webcraft2D** is an action-packed, feature-rich 2D browser-based sandbox survival game inspired by Minecraft. Built from scratch using modern vanilla Web technologies, Webcraft2D combines classic block-building creativity with survival mechanics, procedural world exploration, crafting pipelines, animal husbandry, and native controller support—all running smoothly directly in your web browser.

---

## 🌟 Game Features Overview

### 🌍 World Generation & Exploration
* **Procedural Biomes**: Explore dynamically generated worlds featuring grassy plains, dense forests, sandy deserts, snowy tundras, and deep subterranean cave networks.
* **Day & Night Cycle**: Experience full day-night transitions complete with dynamic lighting, smooth skies, and aggressive night-time hostiles.
* **Subterranean Caves & Ores**: Mine underground to discover rich seams of Coal, Iron, Gold, Diamond, Redstone, and Lapis Lazuli embedded deep in stone strata.

### ⛏️ Mining, Tools & Progression
* **Authentic Mining Tiers**: Gear up across 5 material tiers: **Wood, Stone, Iron, Gold, and Diamond**. Lower tier tools cannot harvest high-grade ores, enforcing authentic progression.
* **Full Toolset**: Craft Pickaxes, Shovels, Axes, Swords, and Hoes—each optimized with specific mining speeds, durability, and block drop rules.
* **10-Stage Block Fracture**: Authentic pixelated crack animations visually indicate block damage as you mine.

### 🌾 Agriculture, Farming & Cooking
* **Tillable Farmland**: Use hoes to convert soil into fertile farmland near water sources to accelerate crop growth.
* **Progressive Crop Cultivation**: Plant Wheat Seeds and watch them evolve through multiple growth stages into golden wheat ready for harvest.
* **Baking & Cooking**: Cook raw meats in a furnace or combine harvested wheat into fresh Bread to keep your hunger bar full and restore health.

### 🐄 Livestock & Passive Mobs
* **Animal Husbandry**: Encounter peaceful mobs including Cows, Pigs, Sheep, and Chickens roaming the surface biomes.
* **Living Ecosystems**: Animals feature custom procedural walking animations, head bobbing, and idle behaviors.
* **Resource Production**: Harvest animals for Raw Meats, Leather, and Wool, or use an empty bucket to milk cows for Milk Buckets.

### 🎵 Custom Audio, Jukeboxes & Music Discs
* **13 Vinyl Discs**: Collect rare music records throughout the world and play them in craftable Jukebox blocks with ambient particle effects.
* **Custom MP3 Player**: Import local MP3 files directly into your in-game Jukeboxes. Audio files persist locally via IndexedDB storage.
* **Floating Audio HUD**: Track music playback with interactive seek bars, volume controls, and real-time audio waveform visualizers.

### 🔥 Smelting & Container Storage
* **Dynamic Furnaces**: Smelt ores into refined ingots, transform sand into glass, and cook raw food into nutritious meals. Furnaces feature lit/unlit states and cast dynamic light while burning fuel.
* **Container Inventories**: Store items, tools, and materials across chest networks, furnaces, and player inventories with full state persistence across world saves.

### 🎮 Native Gamepad & Controller Support
* **Plug-and-Play Compatibility**: Full support for Xbox, PlayStation DualShock/DualSense, Nintendo Switch Pro, and standard Bluetooth/USB gamepads.
* **Dual Analog Controls**: Smooth platformer movement with the left stick and 360° crosshair aiming with the right stick.
* **Spatial UI Navigation**: Navigate hotbars, inventory slots, settings, and crafting grids using D-Pad and analog stick focus navigation.
* **Haptic Feedback**: Dual-motor vibration support for block breaking, taking damage, and tool feedback.

### ⚙️ World Modes & Quality of Life
* **Multiple Difficulties**: Play on **Peaceful** (no hostile spawns or hunger), **Easy**, **Normal**, or **Hard**.
* **Recipe Pinning HUD**: Pin crafting requirements directly to your HUD to track materials in real time while exploring.
* **Dynamic Theme Engines**: Customize UI accent colors, focus rings, and glowing elements with dynamic color palettes.

---

## 🎮 Game Controls

### Keyboard & Mouse
| Action | Key Binding |
| :--- | :--- |
| **Move Left / Right** | `A` / `D` or `Left Arrow` / `Right Arrow` |
| **Jump** | `W`, `Space`, or `Up Arrow` |
| **Crouch / Sneak** | `S` or `Down Arrow` |
| **Mine Block / Attack** | `Left Click` (Hold) |
| **Place Block / Interact / Till** | `Right Click` |
| **Open Inventory & Crafting** | `E` |
| **Hotbar Selection** | `1` – `9` or `Mouse Wheel` |
| **Pause / Settings** | `ESC` |

### Gamepad / Controller
| Action | Button |
| :--- | :--- |
| **Move / Aim** | `Left Stick` (Movement) / `Right Stick` (Aim Crosshair) |
| **Jump / Crouch** | `A` / `Cross` (Jump) • `B` / `Circle` (Crouch) |
| **Mine / Attack** | `RT` / `R2` |
| **Place / Interact** | `LT` / `L2` |
| **Hotbar Navigation** | `LB` / `RB` (L1 / R1) |
| **UI Navigation** | `D-Pad` or `Left Stick` |

---

## 🛠️ Built With

* **Rendering Engine**: Native HTML5 `<canvas>` API with custom pixel-art render passes.
* **Language**: Vanilla Modern JavaScript (ES6+), HTML5, and CSS3.
* **Audio Engine**: Web Audio API & Web Storage (IndexedDB) for persistent local music tracks.
* **Input Engine**: Gamepad API for hardware controller support and rumble feedback.
* **Storage**: LocalStorage & IndexedDB for saving world states, inventory contents, difficulty settings, and custom audio files.

---

## 🚀 How to Run Locally

Webcraft2D runs completely in the browser without any heavy dependencies, build tools, or frameworks required! But you can also download a fully electron compiled version for Windows, MacOS with Apple Silicon or with Intel.

### Option 1: Direct File Launch
1. Clone or download the repository:
   ```bash
   git clone [https://github.com/raresh06/webcraft2d-game.git](https://github.com/raresh06/webcraft2d-game.git)
