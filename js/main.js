// =============================================================================
// WEBCRAFT 2D - MAIN MODULE (main.js)
// Central Hub, Game State, Audio Engine, Game Simulation & Boot Sequence
// =============================================================================

import * as Network from './network.js';
import * as Engine from './engine.js';
import * as UI from './ui.js';

// Expose exports to window for HTML inline event handlers (e.g. onclick)
import {
    IDS, ID_NAMES, TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT, HARDNESS, REACH, MOVE_SPEED, JUMP_FORCE,
    BED_LENGTH, CAVE_SKY_FADE_TILES, CAVE_SKY_START_TILES, DIFFICULTIES, DIRT_TO_GRASS_DAYS,
    LAVA_FLOW_INTERVAL, LAVA_FLOW_MAX, LEAF_DECAY_MIN_FRAMES, LEAF_DECAY_RANDOM_FRAMES,
    SAPLING_GROWTH_DAYS, SNOW_REGROWTH_DAYS, WATER_FLOW_INTERVAL, WATER_FLOW_MAX,
    canHarvestBlock, canSaplingGrowAt, checkSandFallAbove, currentWorldSize, getBedPairStart,
    getBlockColor, getChestGroup, getChestKey, getDayDifficultyMultiplier, getDayHungerDrainMultiplier,
    getDoorBaseY, getMaxAnimals, getRequiredMiningTier, isBackgroundBuildingBlock, isDoorBlock,
    isFoodItem, isOpenDoorBlock, isSolidWorldBlock, isWorldMapOpen, notifyBlockedSaplings,
    scheduleDirtToGrass, scheduleSnowRegrowth, scheduleTreeLeafDecay, setWorldDimensions,
    showClouds, showDebug, showTutorial, autoJumpEnabled, graphicsMode, advancedGraphics,
    fabulousGraphics, introEnabled, introPhase, introTimer, selectedDiffChoice, settingsPreviousState,
    playerName, sleepWakeVersion, mpPeerIds, lastWorldSyncTime, lastWorldStateTimestamp, lastDamageEventId,
    mpPlayerSyncPending, mpPlayerSyncQueued, mpPlayerSyncPendingStartTime, mpWorldSyncPending,
    lastSyncTime, lastSentSkinData, lastFluidStateTimestamp, menuBgCanvas, menuCtx, hotbarSize,
    Player, Zombie, Pig, Chicken, Sheep, Creeper, Scorpion, FallingBlock, SnowballProjectile,
    Particle, FloatingText, Cloud, ItemDrop,
    generateWorld, getInitialSpawnPoint, drawCharacter, drawPlayerPreview,
    startPlayerPreviewWalk, ensureDesertScorpions, ensureTreeWoodNonCollidable,
    textures, getPlayerCaveSkyOpacity, getWorldSurfaceY,
    setEngineWorld, setEngineBgWorld, setEnginePlayer, setEngineSurfaceHeights,
    setEngineInventory, setEngineEquippedArmor, setEngineEntities, setEngineFluids,
    setEngineFurnaces, setEngineChests, setEngineDroppedItems, setEngineState, setGameState,
    setEngineTimeOfDay, setEngineDayCount, setEngineFrameCount, setEngineCurrentWorldId,
    setEngineCurrentDifficulty, setEngineIsMultiplayer, setEngineCurrentMpRoom,
    setEngineCurrentMpWorldName, setEngineRemotePlayers, setEngineIsSleeping,
    setEngineIsBackgroundBuildMode, setEngineIsInventoryOpen, setSelectedHotbarIndex, setAttackAnimationTimer,
    drawMenuBackground, drawWorld, updateCamera,
    getSnowBiomeRatio, initCanvases, resizeCanvases, canvas, ctx,
    lightCanvas, lightCtx, LIGHT_SCALE, updateCachedVignette,
    PHYSICS_TICK_RATE, PHYSICS_TICK_MS, fpsCap,
    updateFluids, getFluid, setFluid, removeFluid, wakeFluidsAround, syncChest,
    spawnAnimals, spawnMobs, GRAVITY, TERMINAL_VELOCITY, DAY_LENGTH_FRAMES, DAY_LENGTH,
    updateTreeLeafDecay, updateSaplingGrowth, updateNaturalRegrowth, processDroppedItems,
    miningTarget,
    world, bgWorld, player, inventory, equippedArmor, entities, mobs, activeProjectiles, fallingBlocks,
    particles, floatingTexts, clouds, fluids, fluidTick, furnaces, chests,
    mouse, keys, camera, isMultiplayer, currentMpRoom, currentMpWorldName, remotePlayers, isSleeping,
    sleepStartTime, isBackgroundBuildMode, bgBuildDarknessAlpha, nonCollidableTreeWood, leafDecayQueue,
    saplingGrowthQueue, saplingBlockedWarnings, dirtToGrassQueue, snowRegrowthQueue,
    hotbarWheelLockUntil,
    surfaceHeights, droppedItems, timeOfDay, dayCount, frameCount, STATE,
    currentDifficulty, currentWorldId,
    keepInventory, currentWorldAchievementsEnabled
} from './engine.js';

export {
    IDS, ID_NAMES, TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT, HARDNESS, REACH, MOVE_SPEED, JUMP_FORCE,
    BED_LENGTH, CAVE_SKY_FADE_TILES, CAVE_SKY_START_TILES, DIFFICULTIES, DIRT_TO_GRASS_DAYS,
    LAVA_FLOW_INTERVAL, LAVA_FLOW_MAX, LEAF_DECAY_MIN_FRAMES, LEAF_DECAY_RANDOM_FRAMES,
    SAPLING_GROWTH_DAYS, SNOW_REGROWTH_DAYS, WATER_FLOW_INTERVAL, WATER_FLOW_MAX,
    canHarvestBlock, canSaplingGrowAt, checkSandFallAbove, currentWorldSize, getBedPairStart,
    getBlockColor, getChestGroup, getChestKey, getDayDifficultyMultiplier, getDayHungerDrainMultiplier,
    getDoorBaseY, getMaxAnimals, getRequiredMiningTier, isBackgroundBuildingBlock, isDoorBlock,
    isFoodItem, isOpenDoorBlock, isSolidWorldBlock, isWorldMapOpen, notifyBlockedSaplings,
    scheduleDirtToGrass, scheduleSnowRegrowth, scheduleTreeLeafDecay, setWorldDimensions,
    showClouds, showDebug, showTutorial, autoJumpEnabled, graphicsMode, advancedGraphics,
    fabulousGraphics, introEnabled, introPhase, introTimer, selectedDiffChoice, settingsPreviousState,
    playerName, sleepWakeVersion, mpPeerIds, lastWorldSyncTime, lastWorldStateTimestamp, lastDamageEventId,
    mpPlayerSyncPending, mpPlayerSyncQueued, mpPlayerSyncPendingStartTime, mpWorldSyncPending,
    lastSyncTime, lastSentSkinData, lastFluidStateTimestamp, menuBgCanvas, menuCtx, hotbarSize,
    Player, Zombie, Pig, Chicken, Sheep, Creeper, Scorpion, FallingBlock, SnowballProjectile,
    Particle, FloatingText, Cloud, ItemDrop,
    generateWorld, getInitialSpawnPoint, drawCharacter, drawPlayerPreview,
    startPlayerPreviewWalk, ensureDesertScorpions, ensureTreeWoodNonCollidable,
    textures, getPlayerCaveSkyOpacity, getWorldSurfaceY,
    setEngineWorld, setEngineBgWorld, setEnginePlayer, setEngineSurfaceHeights,
    setEngineInventory, setEngineEquippedArmor, setEngineEntities, setEngineFluids,
    setEngineFurnaces, setEngineChests, setEngineDroppedItems, setEngineState, setGameState,
    setEngineTimeOfDay, setEngineDayCount, setEngineFrameCount, setEngineCurrentWorldId,
    setEngineCurrentDifficulty, setEngineIsMultiplayer, setEngineCurrentMpRoom,
    setEngineCurrentMpWorldName, setEngineRemotePlayers, setEngineIsSleeping,
    setEngineIsBackgroundBuildMode, setEngineIsInventoryOpen, setSelectedHotbarIndex, setAttackAnimationTimer,
    drawMenuBackground, drawWorld, updateCamera,
    getSnowBiomeRatio, initCanvases, resizeCanvases, canvas, ctx,
    lightCanvas, lightCtx, LIGHT_SCALE, updateCachedVignette,
    PHYSICS_TICK_RATE, PHYSICS_TICK_MS, fpsCap,
    updateFluids, getFluid, setFluid, removeFluid, wakeFluidsAround, syncChest,
    spawnAnimals, spawnMobs, GRAVITY, TERMINAL_VELOCITY, DAY_LENGTH_FRAMES, DAY_LENGTH,
    updateTreeLeafDecay, updateSaplingGrowth, updateNaturalRegrowth, processDroppedItems,
    miningTarget,
    world, bgWorld, player, inventory, equippedArmor, entities, mobs, activeProjectiles, fallingBlocks,
    particles, floatingTexts, clouds, fluids, fluidTick, furnaces, chests,
    mouse, keys, camera, isMultiplayer, currentMpRoom, currentMpWorldName, remotePlayers, isSleeping,
    sleepStartTime, isBackgroundBuildMode, bgBuildDarknessAlpha, nonCollidableTreeWood, leafDecayQueue,
    saplingGrowthQueue, saplingBlockedWarnings, dirtToGrassQueue, snowRegrowthQueue,
    hotbarWheelLockUntil,
    surfaceHeights, droppedItems, timeOfDay, dayCount, frameCount, STATE,
    currentDifficulty, currentWorldId,
    keepInventory, currentWorldAchievementsEnabled
};

export let attackAnimationTimer = 0;
export let selectedHotbarIndex = 0;
export let heldItemObj = null;
export let heldItemIndex = -1;
export let heldItemDraggedOutside = false;
export let openedFurnace = null;
export let openedChest = null;
export let isInventoryOpen = false;
export let monstersKilledCount = 0;
export let deepBlocksMinedCount = 0;
export let caveSkyOpacity = 0;
export let tooltipEl = null;

export let physicsAccumulator = 0;
export let lastFrameTime = 0;
export let lastRenderTime = 0;
export let currentFps = 60;
export let frameDeltaMs = 16.6;
export let lastPlayerActivityAt = Date.now();
export let lastAutosaveTimestamp = Date.now();

export function updateUI() { if (typeof window !== 'undefined' && typeof window.updateUI === 'function' && window.updateUI !== updateUI) return window.updateUI(); }
export function updateHealthUI() { if (typeof window !== 'undefined' && typeof window.updateHealthUI === 'function' && window.updateHealthUI !== updateHealthUI) return window.updateHealthUI(); }
export function updateHungerUI() { if (typeof window !== 'undefined' && typeof window.updateHungerUI === 'function' && window.updateHungerUI !== updateHungerUI) return window.updateHungerUI(); }
export function updateTimeUI() { if (typeof window !== 'undefined' && typeof window.updateTimeUI === 'function' && window.updateTimeUI !== updateTimeUI) return window.updateTimeUI(); }
export function updateTutorialUI() { if (typeof window !== 'undefined' && typeof window.updateTutorialUI === 'function' && window.updateTutorialUI !== updateTutorialUI) return window.updateTutorialUI(); }
export function updateArmorUI() { if (typeof window !== 'undefined' && typeof window.updateArmorUI === 'function' && window.updateArmorUI !== updateArmorUI) return window.updateArmorUI(); }
export function updateHudArmorBar() { if (typeof window !== 'undefined' && typeof window.updateHudArmorBar === 'function' && window.updateHudArmorBar !== updateHudArmorBar) return window.updateHudArmorBar(); }
export function saveCurrentWorld() { if (typeof window !== 'undefined' && typeof window.saveCurrentWorld === 'function' && window.saveCurrentWorld !== saveCurrentWorld) return window.saveCurrentWorld(); }
export function showToast(msg, duration) { if (typeof window !== 'undefined' && typeof window.showToast === 'function' && window.showToast !== showToast) return window.showToast(msg, duration); }
export function checkAutosave() { if (typeof window !== 'undefined' && typeof window.checkAutosave === 'function' && window.checkAutosave !== checkAutosave) return window.checkAutosave(); }
export function isActionActive(action) { if (typeof window !== 'undefined' && typeof window.isActionActive === 'function' && window.isActionActive !== isActionActive) return window.isActionActive(action); return false; }
export function getMemoryUsageText() { if (typeof window !== 'undefined' && typeof window.getMemoryUsageText === 'function' && window.getMemoryUsageText !== getMemoryUsageText) return window.getMemoryUsageText(); return ''; }

export function syncBlock(x, y, newId, extraData = {}) {
    if (typeof window !== 'undefined' && typeof window.syncBlock === 'function' && window.syncBlock !== syncBlock) {
        return window.syncBlock(x, y, newId, extraData);
    }
}
export function syncFluidState() {
    if (typeof window !== 'undefined' && typeof window.syncFluidState === 'function' && window.syncFluidState !== syncFluidState) {
        return window.syncFluidState();
    }
}
export function syncLocalPlayerState(force = false) {
    if (typeof window !== 'undefined' && typeof window.syncLocalPlayerState === 'function' && window.syncLocalPlayerState !== syncLocalPlayerState) {
        return window.syncLocalPlayerState(force);
    }
}
export function syncMultiplayerWorldState(force = false) {
    if (typeof window !== 'undefined' && typeof window.syncMultiplayerWorldState === 'function' && window.syncMultiplayerWorldState !== syncMultiplayerWorldState) {
        return window.syncMultiplayerWorldState(force);
    }
}
export function isMultiplayerAuthority() {
    if (typeof window !== 'undefined' && typeof window.isMultiplayerAuthority === 'function' && window.isMultiplayerAuthority !== isMultiplayerAuthority) {
        return window.isMultiplayerAuthority();
    }
    return false;
}
export function getSmeltResult(id) { if (typeof window !== 'undefined' && typeof window.getSmeltResult === 'function' && window.getSmeltResult !== getSmeltResult) return window.getSmeltResult(id); return null; }
export function getFuelValue(id) { if (typeof window !== 'undefined' && typeof window.getFuelValue === 'function' && window.getFuelValue !== getFuelValue) return window.getFuelValue(id); return 0; }
export function updateFurnaceVisual(f) { if (typeof window !== 'undefined' && typeof window.updateFurnaceVisual === 'function' && window.updateFurnaceVisual !== updateFurnaceVisual) return window.updateFurnaceVisual(f); }
export function giveItem(id, amount = 1) { if (typeof window !== 'undefined' && typeof window.giveItem === 'function' && window.giveItem !== giveItem) return window.giveItem(id, amount); return false; }
export function damageSelectedTool(amount = 1) { if (typeof window !== 'undefined' && typeof window.damageSelectedTool === 'function' && window.damageSelectedTool !== damageSelectedTool) return window.damageSelectedTool(amount); }
export function canFitItem(id, amount) { if (typeof window !== 'undefined' && typeof window.canFitItem === 'function' && window.canFitItem !== canFitItem) return window.canFitItem(id, amount); return false; }
export function hasItem(id, amount) { if (typeof window !== 'undefined' && typeof window.hasItem === 'function' && window.hasItem !== hasItem) return window.hasItem(id, amount); return false; }
export function consumeItem(id, amount = 1) { if (typeof window !== 'undefined' && typeof window.consumeItem === 'function' && window.consumeItem !== consumeItem) return window.consumeItem(id, amount); return false; }
export function isTool(id) { if (typeof window !== 'undefined' && typeof window.isTool === 'function' && window.isTool !== isTool) return window.isTool(id); return false; }
export function ensureToolDurability(item) { if (typeof window !== 'undefined' && typeof window.ensureToolDurability === 'function' && window.ensureToolDurability !== ensureToolDurability) return window.ensureToolDurability(item); }
export function ensureArmorDurability(item) { if (typeof window !== 'undefined' && typeof window.ensureArmorDurability === 'function' && window.ensureArmorDurability !== ensureArmorDurability) return window.ensureArmorDurability(item); }
export function drawMinimap() { if (typeof window !== 'undefined' && typeof window.drawMinimap === 'function' && window.drawMinimap !== drawMinimap) return window.drawMinimap(); }
export function unlockAchievement(id) { if (typeof window !== 'undefined' && typeof window.unlockAchievement === 'function' && window.unlockAchievement !== unlockAchievement) return window.unlockAchievement(id); }
export function updateSettingsDifficultyUI() { if (typeof window !== 'undefined' && typeof window.updateSettingsDifficultyUI === 'function' && window.updateSettingsDifficultyUI !== updateSettingsDifficultyUI) return window.updateSettingsDifficultyUI(); }
export function getSavedWorlds() { if (typeof window !== 'undefined' && typeof window.getSavedWorlds === 'function' && window.getSavedWorlds !== getSavedWorlds) return window.getSavedWorlds(); return []; }
export function processRemotePickupRequests() { if (typeof window !== 'undefined' && typeof window.processRemotePickupRequests === 'function' && window.processRemotePickupRequests !== processRemotePickupRequests) return window.processRemotePickupRequests(); }
export function processRemoteDropRequests() { if (typeof window !== 'undefined' && typeof window.processRemoteDropRequests === 'function' && window.processRemoteDropRequests !== processRemoteDropRequests) return window.processRemoteDropRequests(); }
export function tryCompleteMultiplayerSleep() { if (typeof window !== 'undefined' && typeof window.tryCompleteMultiplayerSleep === 'function' && window.tryCompleteMultiplayerSleep !== tryCompleteMultiplayerSleep) return window.tryCompleteMultiplayerSleep(); }
export function checkAfkKick() { if (typeof window !== 'undefined' && typeof window.checkAfkKick === 'function' && window.checkAfkKick !== checkAfkKick) return window.checkAfkKick(); }
export function dropItemForWorld(itemId, x, y, count = 1) { if (typeof window !== 'undefined' && typeof window.dropItemForWorld === 'function' && window.dropItemForWorld !== dropItemForWorld) return window.dropItemForWorld(itemId, x, y, count); }


    // ==========================================
    // SOUND EFFECTS & AUDIO ENGINE (WEB AUDIO API)
    // ==========================================
    export let masterVolume = 0.8;
    export let sfxVolume = 0.8;
    export let uiVolume = 0.5;
    export let isAudioMuted = false;
    export let footstepsEnabled = true;
    export let globalAudioCtx = null;
    export let audioNoiseBuffer = null;

    export function getAudioContext() {
        if (!globalAudioCtx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                globalAudioCtx = new AudioCtx();
            }
        }
        if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
            globalAudioCtx.resume().catch(() => {});
        }
        return globalAudioCtx;
    }

    if (typeof window !== 'undefined') {
        const unlockAudio = () => {
            const ctx = getAudioContext();
            if (ctx && ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }
        };
        window.addEventListener('pointerdown', unlockAudio, { passive: true });
        window.addEventListener('keydown', unlockAudio, { passive: true });
        window.addEventListener('click', unlockAudio, { passive: true });
    }

    export function getAudioNoiseBuffer(ctx) {
        if (!audioNoiseBuffer && ctx) {
            const bufferSize = Math.floor(ctx.sampleRate * 0.15);
            audioNoiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = audioNoiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
        }
        return audioNoiseBuffer;
    }

    export function playTone(ctx, type, f0, f1, g0, dur, dest, now, fRamp = true, filter = null) {
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(f0, now);
            if (f1 !== f0) {
                if (fRamp) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), now + dur);
                else osc.frequency.setValueAtTime(f1, now + dur * 0.5);
            }
            gain.gain.setValueAtTime(g0, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
            if (filter) {
                osc.connect(filter);
                filter.connect(gain);
            } else {
                osc.connect(gain);
            }
            gain.connect(dest || ctx.destination);
            osc.start(now);
            osc.stop(now + dur + 0.01);
        } catch(e) {}
    }

    export function playNoise(ctx, buf, fType, fFreq, fQ, g0, dur, dest, now) {
        if (!buf) return;
        try {
            const noise = ctx.createBufferSource();
            noise.buffer = buf;
            const nFilter = ctx.createBiquadFilter();
            nFilter.type = fType;
            nFilter.frequency.setValueAtTime(fFreq, now);
            if (fQ) nFilter.Q.setValueAtTime(fQ, now);
            const nGain = ctx.createGain();
            nGain.gain.setValueAtTime(g0, now);
            nGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
            noise.connect(nFilter);
            nFilter.connect(nGain);
            nGain.connect(dest || ctx.destination);
            noise.start(now);
            noise.stop(now + dur + 0.005);
        } catch(e) {}
    }

    export function playFootstepSound(mat, effectiveVol, ctx, now) {
        if (!footstepsEnabled) return;
        const nBuf = getAudioNoiseBuffer(ctx);
        const pj = 0.92 + Math.random() * 0.16;

        switch (mat) {
            case 'grass':
                playTone(ctx, 'triangle', 110 * pj, 38, 0.065 * effectiveVol, 0.045, null, now);
                playNoise(ctx, nBuf, 'bandpass', 1350 * pj, 1.4, 0.045 * effectiveVol, 0.038, null, now);
                break;
            case 'stone':
                playTone(ctx, 'triangle', 650 * pj, 160, 0.045 * effectiveVol, 0.028, null, now);
                playNoise(ctx, nBuf, 'highpass', 2200 * pj, null, 0.06 * effectiveVol, 0.025, null, now);
                break;
            case 'wood':
            case 'ladder': {
                const f = ctx.createBiquadFilter();
                f.type = 'bandpass'; f.frequency.setValueAtTime(380 * pj, now); f.Q.setValueAtTime(3.8, now);
                playTone(ctx, 'triangle', 280 * pj, 110, 0.085 * effectiveVol, 0.05, null, now, true, f);
                break;
            }
            case 'sand':
                playTone(ctx, 'triangle', 75 * pj, 30, 0.04 * effectiveVol, 0.04, null, now);
                playNoise(ctx, nBuf, 'bandpass', 2600 * pj, 1.1, 0.065 * effectiveVol, 0.055, null, now);
                break;
            case 'snow':
                playTone(ctx, 'sine', 680 * pj, 390, 0.035 * effectiveVol, 0.04, null, now);
                playNoise(ctx, nBuf, 'highpass', 3200 * pj, null, 0.04 * effectiveVol, 0.035, null, now);
                break;
            case 'leaves':
                playNoise(ctx, nBuf, 'bandpass', 3400 * pj, 1.8, 0.07 * effectiveVol, 0.045, null, now);
                playTone(ctx, 'triangle', 1200 * pj, 260, 0.025 * effectiveVol, 0.018, null, now);
                break;
            case 'wool': {
                const f = ctx.createBiquadFilter();
                f.type = 'lowpass'; f.frequency.setValueAtTime(220, now);
                playTone(ctx, 'triangle', 90 * pj, 30, 0.05 * effectiveVol, 0.035, null, now, true, f);
                break;
            }
            case 'water':
                playTone(ctx, 'sine', 240 * pj, 160, 0.06 * effectiveVol, 0.065, null, now);
                playNoise(ctx, nBuf, 'bandpass', 1200 * pj, 2.0, 0.045 * effectiveVol, 0.055, null, now);
                break;
            case 'dirt':
            default:
                playTone(ctx, 'triangle', 125 * pj, 36, 0.075 * effectiveVol, 0.045, null, now);
                playNoise(ctx, nBuf, 'lowpass', 850 * pj, null, 0.038 * effectiveVol, 0.035, null, now);
                break;
        }
    }

    export function playSound(type, options = {}) {
        if (isAudioMuted) return;
        const ctx = getAudioContext();
        if (!ctx) return;

        const effectiveVol = (options.isUI ? uiVolume : sfxVolume) * masterVolume * (options.vol !== undefined ? options.vol : 1.0);
        if (effectiveVol <= 0.0005) return;

        try {
            const now = ctx.currentTime;
            switch (type) {
                case 'click':
                    playTone(ctx, 'sine', 880, 320, 0.025 * effectiveVol, 0.014, null, now);
                    break;
                case 'step':
                    playFootstepSound(options.material || 'dirt', effectiveVol, ctx, now);
                    break;
                case 'place':
                    playTone(ctx, 'sine', 160, 60, 0.20 * effectiveVol, 0.06, null, now);
                    break;
                case 'break':
                    playTone(ctx, 'sawtooth', 220, 70, 0.18 * effectiveVol, 0.08, null, now);
                    break;
                case 'craft':
                    playTone(ctx, 'sine', 523.25, 659.25, 0.15 * effectiveVol, 0.18, null, now, false);
                    break;
                case 'pop':
                    playTone(ctx, 'sine', 360, 840, 0.16 * effectiveVol, 0.05, null, now);
                    break;
                case 'hit':
                    playTone(ctx, 'sawtooth', 180, 45, 0.25 * effectiveVol, 0.09, null, now);
                    break;
                case 'hurt':
                    playTone(ctx, 'triangle', 200, 75, 0.28 * effectiveVol, 0.14, null, now);
                    break;
                case 'break_tool':
                    playTone(ctx, 'square', 440, 110, 0.25 * effectiveVol, 0.12, null, now);
                    break;
                case 'snowball_throw':
                    playTone(ctx, 'sine', 400, 180, 0.12 * effectiveVol, 0.06, null, now);
                    break;
                case 'eat':
                    playTone(ctx, 'sawtooth', 320 + Math.random() * 60, 120, 0.14 * effectiveVol, 0.05, null, now);
                    break;
            }
        } catch(e) {}
    }


    document.addEventListener('contextmenu', e => e.preventDefault());

    export let selectedWorldSizeChoice = 'small';
    export let selectedMpWorldSize = 'small';



    export function selectWorldSize(size) {
        selectedWorldSizeChoice = size;
        document.querySelectorAll('#world-size-selector button').forEach(btn => {
            if (btn.dataset.size === size) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    export function selectMpWorldSize(size) {
        selectedMpWorldSize = size;
        document.querySelectorAll('#mp-world-size-selector button').forEach(btn => {
            if (btn.dataset.size === size) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        const warningEl = document.getElementById('mp-world-size-warning');
        if (warningEl) {
            if (size === 'big') warningEl.classList.remove('hidden');
            else warningEl.classList.add('hidden');
        }
    }

    

    // Multiplayer Globals
    export let mpCreateDifficulty = 'normal';
    export let selectedJoinRoom = null;
    export let pendingPickupRequest = null;
    export let lastPickupResultId = null;
    export let seenEntityDamageEvents = new Set();
    export const INVENTORY_SIZE = 28;


    export function closeForegroundScreen() {
        const isVisible = id => {
            const el = document.getElementById(id);
            return el && !el.classList.contains('hidden') && el.style.display !== 'none';
        };
        if (isChatOpen) { closeChat(); return true; }
        if (isVisible('game-intro')) { advanceIntro(); return true; }
        if (isVisible('loading-screen')) { cancelMultiplayerConnection(); return true; }
        if (isVisible('world-map-modal') || isWorldMapOpen) { toggleWorldMap(false); return true; }
        if (isVisible('new-world-modal')) { closeNewWorldModal(); return true; }
        if (isVisible('create-room-modal') || isVisible('join-room-modal')) { closeRoomDialogs(); return true; }
        if (isVisible('publish-multiplayer-modal')) { closePublishMultiplayerModal(); return true; }
        if (isVisible('skin-upload-modal')) { closeSkinUploadModal(); return true; }
        if (isVisible('skin-owned-modal')) { closeSkinOwnedModal(); return true; }
        if (isVisible('achievements-modal')) { closeAchievements(); return true; }
        if (isVisible('credits-modal')) { closeCredits(); return true; }
        if (isVisible('accent-color-popover')) { closeAccentColorPicker(); return true; }
        if (isVisible('settings-menu')) { closeSettings(); return true; }
        if (isVisible('skin-editor-container')) { closeSkinMaker(); return true; }
        if (isVisible('skins-menu')) { closeSkins(); return true; }
        if (isVisible('whats-new-modal')) { closeWhatsNew(); return true; }
        if (isVisible('multiplayer-modal')) { closeMultiplayerMenu(); return true; }
        if (isVisible('worlds-menu')) { closeWorldsMenu(); return true; }
        if (isInventoryOpen) { toggleInventory(); return true; }
        if (isVisible('pause-menu') || STATE === 'PAUSED') { resumeGame(); return true; }
        if (STATE === 'PLAYING') { pauseGame(); return true; }
        return false;
    }

    window.addEventListener('keydown', (e) => {
        let k = (e.key || '').toLowerCase();
        const isEscape = k === 'escape' || k === 'esc' || e.code === 'Escape' || e.keyCode === 27;
        lastPlayerActivityAt = Date.now();

        // Skin Editor Keyboard Shortcuts (Ctrl+Z for Undo, Ctrl+Y or Ctrl+Shift+Z for Redo)
        const skinEditorContainer = document.getElementById('skin-editor-container');
        if (skinEditorContainer && !skinEditorContainer.classList.contains('hidden') && skinEditorContainer.style.display !== 'none') {
            if (e.ctrlKey || e.metaKey) {
                if (k === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    undoSkinEdit();
                    return;
                }
                if (k === 'y' || (k === 'z' && e.shiftKey)) {
                    e.preventDefault();
                    redoSkinEdit();
                    return;
                }
            }
        }

        if (rebindingAction) {
            handleRebindKey(e);
            return;
        }

        if (k === ' ' && !document.getElementById('game-intro').classList.contains('hidden')) {
            e.preventDefault();
            advanceIntro();
            return;
        }

        if (isChatOpen) {
            if (isEscape) {
                e.preventDefault();
                closeChat();
            }
            return;
        }

        // Ignore hotkeys when typing into search or text inputs
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
            if (isEscape) {
                e.preventDefault();
                if (document.activeElement.id === 'crafting-search') {
                    if (document.activeElement.value) {
                        clearCraftingSearch();
                    } else {
                        document.activeElement.blur();
                        toggleInventory();
                    }
                } else {
                    document.activeElement.blur();
                    closeForegroundScreen();
                }
                return;
            }
            if (e.key === 'Enter' && document.activeElement.id === 'crafting-search') {
                document.activeElement.blur();
                return;
            }
            return;
        }

        if (isEscape) {
            e.preventDefault();
            closeForegroundScreen();
            return;
        }
        if (STATE === 'PLAYING') {
            const chatKey = (KEYBINDS['chat'] || 't').toLowerCase();
            const mapKey = (KEYBINDS['map'] || 'm').toLowerCase();
            const invKey = (KEYBINDS['inventory'] || 'e').toLowerCase();
            const dropKey = (KEYBINDS['drop'] || 'q').toLowerCase();
            const debugKey = (KEYBINDS['debug'] || 'f3').toLowerCase();

            if (isMultiplayer && (k === chatKey || k === '/') && !isInventoryOpen && !isWorldMapOpen) {
                e.preventDefault();
                openChat(k === '/' ? '/' : '');
                return;
            }
            if (k === mapKey) {
                e.preventDefault();
                toggleWorldMap();
                return;
            }
            if (k === 'b' && !isInventoryOpen && !isWorldMapOpen) {
                e.preventDefault();
                toggleBackgroundBuildMode();
                return;
            }
            if (isWorldMapOpen) {
                if (k === 'c') {
                    centerMapOnPlayer();
                }
                return;
            }
            if (k === dropKey && !isInventoryOpen) {
                e.preventDefault();
                let item = inventory[selectedHotbarIndex];
                if (item && item.id) {
                    dropItemForWorld(item.id, player.x + player.width/2 + (player.facingRight ? 16 : -16), player.y + 10, 1);
                    item.count--;
                    if (item.count <= 0) inventory[selectedHotbarIndex] = null;
                    playSound('pop');
                    updateUI();
                }
                return;
            }
            if (k === debugKey) {
                e.preventDefault(); toggleDebug();
            }
            else if (k === 'f2') {
                e.preventDefault(); toggleTutorial();
            }
            else if (k === invKey || k === 'i') toggleInventory();
            else {
                keys[k] = true;
                if (e.code) keys[e.code] = true;
                if (typeof window !== 'undefined') window.keys = keys;
            }
            if (k >= '1' && k <= '9' && !isInventoryOpen) { 
                selectedHotbarIndex = parseInt(k) - 1; 
                updateUI();
                triggerHotbarItemPopup();
            }
        }
    }, true);
    window.addEventListener('keyup', (e) => {
        lastPlayerActivityAt = Date.now();
        let k = (e.key || '').toLowerCase();
        keys[k] = false;
        if (e.code) keys[e.code] = false;
        if (typeof window !== 'undefined') window.keys = keys;
    });
    window.addEventListener('mousedown', (e) => {
        lastPlayerActivityAt = Date.now();
        if (e.button !== 0 || !isInventoryOpen || !heldItemObj || !heldItemDraggedOutside) return;
        const clickedInventory = e.target && typeof e.target.closest === 'function' && e.target.closest('#inventory-menu');
        if (clickedInventory) return;
        dropItemForWorld(heldItemObj.id, player.x + player.width / 2, player.y, heldItemObj.count);
        heldItemObj = null;
        heldItemIndex = -1;
        heldItemDraggedOutside = false;
        document.getElementById('dragged-item-container').style.display = 'none';
        updateUI(false);
    });
    window.addEventListener('wheel', (e) => {
        if (e.deltaY === 0 || isInventoryOpen || STATE !== 'PLAYING' || performance.now() < hotbarWheelLockUntil) return;
        e.preventDefault();
        const dir = (e.deltaY > 0 ? 1 : -1) * (invertScrollWheel ? -1 : 1);
        const step = dir * (scrollSensitivity || 1);
        if (hotbarWrapAround) {
            selectedHotbarIndex = (selectedHotbarIndex + (step % hotbarSize) + hotbarSize) % hotbarSize;
        } else {
            selectedHotbarIndex = Math.max(0, Math.min(hotbarSize - 1, selectedHotbarIndex + step));
        }
        updateUI();
        triggerHotbarItemPopup();
    }, { passive: false });

    window.addEventListener('mousemove', (e) => {
        lastPlayerActivityAt = Date.now();
        mouse.clientX = e.clientX; mouse.clientY = e.clientY;
        
        const dragEl = document.getElementById('dragged-item-container');
        if (heldItemObj) {
            dragEl.style.display = 'block';
            dragEl.style.left = (e.clientX - 20) + 'px'; 
            dragEl.style.top = (e.clientY - 20) + 'px';
            const overInventory = e.target && typeof e.target.closest === 'function' && e.target.closest('#inventory-menu');
            if (!overInventory) heldItemDraggedOutside = true;
        } else { dragEl.style.display = 'none'; }
        
        let target = (e.target && typeof e.target.closest === 'function') ? e.target.closest('.slot, .armor-slot, .offhand-slot') : null;
        if(target && !heldItemObj && STATE === 'PLAYING' && isInventoryOpen) {
            let title = null;
            if (target.classList.contains('armor-slot')) {
                let armorIdx = parseInt(target.id.replace('armor-slot-', ''), 10);
                if (Number.isFinite(armorIdx) && equippedArmor[armorIdx]) {
                    title = ID_NAMES[equippedArmor[armorIdx].id];
                } else {
                    title = target.dataset.tip || 'Armour Slot';
                }
            } else if (target.id === 'inv-offhand-slot') {
                if (inventory[27]) title = ID_NAMES[inventory[27].id];
                else title = target.dataset.tip || 'Offhand (Shield / Torches)';
            } else if (target.parentNode && target.parentNode.id === 'inventory-storage-grid') {
                let idx = Array.from(target.parentNode.children).indexOf(target) + 9;
                if (inventory[idx]) title = ID_NAMES[inventory[idx].id];
            } else if (target.parentNode && target.parentNode.id === 'inventory-hotbar-grid') {
                let idx = Array.from(target.parentNode.children).indexOf(target);
                if (inventory[idx]) title = ID_NAMES[inventory[idx].id];
            } else if (target.parentNode && target.parentNode.id === 'inventory-grid') {
                let idx = Array.from(target.parentNode.children).indexOf(target);
                if (inventory[idx]) title = ID_NAMES[inventory[idx].id];
            } else if (target.parentNode && target.parentNode.id === 'chest-grid') {
                let idx = Array.from(target.parentNode.children).indexOf(target);
                if (openedChest?.chest?.items[idx]) title = ID_NAMES[openedChest.chest.items[idx].id];
            } else if (target.parentNode && target.parentNode.id === 'hotbar') {
                let idx = Array.from(target.parentNode.children).indexOf(target);
                if (inventory[idx]) title = ID_NAMES[inventory[idx].id];
            } else if (target.id === 'f-input' && openedFurnace?.input) {
                title = ID_NAMES[openedFurnace.input.id];
            } else if (target.id === 'f-fuel' && openedFurnace?.fuel) {
                title = ID_NAMES[openedFurnace.fuel.id];
            } else if (target.id === 'f-output' && openedFurnace?.output) {
                title = ID_NAMES[openedFurnace.output.id];
            } else {
                title = target.dataset.tip || null;
            }

            const tipEl = tooltipEl || (typeof document !== 'undefined' ? (document.getElementById('item-tooltip') || document.getElementById('tooltip')) : null);
            if (tipEl) {
                if (title) {
                    tipEl.innerText = title;
                    tipEl.style.display = 'block';
                    tipEl.style.left = (e.clientX + 15) + 'px';
                    tipEl.style.top = (e.clientY + 15) + 'px';
                } else {
                    tipEl.style.display = 'none';
                }
            }
        } else {
            const tipEl = tooltipEl || (typeof document !== 'undefined' ? (document.getElementById('item-tooltip') || document.getElementById('tooltip')) : null);
            if (tipEl) tipEl.style.display = 'none';
        }
    });

    let canvasListenersAttached = false;
    export function initCanvasMouseListeners() {
        if (typeof document === 'undefined') return;
        const curCanvas = document.getElementById('gameCanvas');
        if (!curCanvas || canvasListenersAttached) return;
        canvasListenersAttached = true;

        curCanvas.addEventListener('mousemove', (e) => { 
            lastPlayerActivityAt = Date.now();
            const r = curCanvas.getBoundingClientRect(); 
            mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; 
            mouse.worldX = mouse.x + camera.x; mouse.worldY = mouse.y + camera.y;
        });

        curCanvas.addEventListener('mousedown', (e) => {
            lastPlayerActivityAt = Date.now();
            if (STATE !== 'PLAYING' || isInventoryOpen) return;
            if (e.button === 0) { mouse.isDownLeft = true; attackAnimationTimer = 12; handleMeleeAttack(); }
            if (e.button === 2) { 
                mouse.isDownRight = true;
                attackAnimationTimer = 12;
                continuousPlaceCooldown = 0;
                lastPlacedCell.x = -1;
                lastPlacedCell.y = -1;
                if (!handleBlockInteraction()) {
                    const placed = handleRightClickPlace();
                    if (placed) {
                        playSound('place');
                        lastPlacedCell.x = Math.floor(mouse.worldX / TILE_SIZE);
                        lastPlacedCell.y = Math.floor(mouse.worldY / TILE_SIZE);
                        continuousPlaceCooldown = 4;
                    }
                } else {
                    lastPlacedCell.x = Math.floor(mouse.worldX / TILE_SIZE);
                    lastPlacedCell.y = Math.floor(mouse.worldY / TILE_SIZE);
                    continuousPlaceCooldown = 12;
                }
            }
        });

        curCanvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                mouse.isDownLeft = false;
                if (miningTarget) miningTarget.progress = 0;
            }
            if (e.button === 2) { 
                mouse.isDownRight = false; 
                if (player && typeof player.resetEat === 'function') player.resetEat(); 
                continuousPlaceCooldown = 0; 
                lastPlacedCell.x = -1; 
                lastPlacedCell.y = -1; 
            }
        });
    }

    if (typeof document !== 'undefined') {
        initCanvasMouseListeners();
    }

    window.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            mouse.isDownLeft = false;
            if (miningTarget) miningTarget.progress = 0;
        }
        if (e.button === 2) { 
            mouse.isDownRight = false; 
            if (player && typeof player.resetEat === 'function') player.resetEat(); 
            continuousPlaceCooldown = 0; 
            lastPlacedCell.x = -1; 
            lastPlacedCell.y = -1; 
        }
    });

    document.addEventListener('selectstart', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });

    export function updateSleepStatus() {
        const status = document.getElementById('sleep-status');
        if (!status) return;
        if (!isMultiplayer) {
            status.classList.add('hidden');
            return;
        }
        let totalPlayers = 1;
        let sleepingPlayers = isSleeping ? 1 : 0;
        Object.values(remotePlayers).forEach(remotePlayer => {
            if (remotePlayer && !remotePlayer.isDisconnected && (!remotePlayer.lastSeenLocalTime || Date.now() - remotePlayer.lastSeenLocalTime < 12000)) {
                totalPlayers++;
                if (remotePlayer.sleeping) sleepingPlayers++;
            }
        });
        const isWaitingForOthers = sleepingPlayers > 0 && sleepingPlayers < totalPlayers;
        if (!isWaitingForOthers) {
            status.classList.add('hidden');
            return;
        }
        status.innerText = `${sleepingPlayers}/${totalPlayers} players sleeping`;
        status.classList.remove('hidden');
    }

    export function completeSleepTransition() {
        if (!isMultiplayer) {
            setEngineTimeOfDay(0.2);
            setEngineDayCount(dayCount + 1);
            setEngineIsSleeping(false);
            entities.forEach(e => { if (e instanceof Sheep) e.isSheared = false; });
            spawnAnimals(2, 0.30);
            for (let i = 0; i < 2; i++) spawnMobs(false);
            updateSleepStatus();
            return;
        }

        if (!isMultiplayerAuthority()) return;
        const activePlayers = Object.values(remotePlayers).filter(remotePlayer => remotePlayer && !remotePlayer.isDisconnected && (!remotePlayer.lastSeenLocalTime || Date.now() - remotePlayer.lastSeenLocalTime < 12000));
        const allSleeping = activePlayers.length > 0 ? activePlayers.every(remotePlayer => remotePlayer.sleeping) : isSleeping;
        if (allSleeping && isSleeping) {
            setEngineTimeOfDay(0.2);
            setEngineDayCount(dayCount + 1);
            setEngineIsSleeping(false);
            entities.forEach(e => { if (e instanceof Sheep) e.isSheared = false; });
            spawnAnimals(2, 0.30);
            for (let i = 0; i < 2; i++) spawnMobs(false);
            updateSleepStatus();
        }
    }


    export function handleBlockInteraction() {
        let gx = Math.floor(mouse.worldX / TILE_SIZE); let gy = Math.floor(mouse.worldY / TILE_SIZE);
        if (gx < 0 || gx >= WORLD_WIDTH || gy < 0 || gy >= WORLD_HEIGHT) return false;
        
        let pCX = player.x + player.width / 2; let pCY = player.y + player.height / 2;
        let bCX = gx * TILE_SIZE + TILE_SIZE / 2; let bCY = gy * TILE_SIZE + TILE_SIZE / 2;
        if (Math.hypot(pCX - bCX, pCY - bCY) / TILE_SIZE > REACH) return false;

        if (world[gx][gy] === IDS.BED) {
            if (timeOfDay <= 0.5 || timeOfDay > 0.9) {
                showToast('You can only sleep at night.');
                return true;
            }
            if (isSleeping) {
                setEngineIsSleeping(false);
                Object.keys(keys).forEach(k => delete keys[k]);
                updateSleepStatus();
                showToast('Sleep cancelled.');
                return true;
            }
            setEngineIsSleeping(true);
            Object.keys(keys).forEach(k => delete keys[k]);
            updateSleepStatus();
            showToast('Sleeping...');
            unlockAchievement('sweet_dreams');
            return true;
        }

        if (world[gx][gy] === IDS.CRAFTING_TABLE) { toggleInventory(); return true; }
        if (isDoorBlock(world[gx][gy])) {
            const doorBaseY = getDoorBaseY(gy, world[gx][gy]);
            const doorIsOpen = isOpenDoorBlock(world[gx][gy]);
            if (doorIsOpen) {
                if (intersectsEntity(gx, doorBaseY) || intersectsEntity(gx, doorBaseY - 1)) {
                    showToast('The doorway is occupied.');
                    return true;
                }
                world[gx][doorBaseY] = IDS.DOOR;
                world[gx][doorBaseY - 1] = IDS.DOOR_TOP;
                syncBlock(gx, doorBaseY, IDS.DOOR);
                syncBlock(gx, doorBaseY - 1, IDS.DOOR_TOP);
            } else {
                world[gx][doorBaseY] = IDS.DOOR_OPEN;
                world[gx][doorBaseY - 1] = IDS.DOOR_OPEN_TOP;
                syncBlock(gx, doorBaseY, IDS.DOOR_OPEN);
                syncBlock(gx, doorBaseY - 1, IDS.DOOR_OPEN_TOP);
            }
            return true;
        }
        if (world[gx][gy] === IDS.FURNACE) {
            openedFurnace = furnaces.find(f => f.x === gx && f.y === gy);
            if (!openedFurnace) {
                openedFurnace = {x:gx, y:gy, input:null, fuel:null, output:null, progress:0, burnTime:0, maxBurnTime:0};
                furnaces.push(openedFurnace);
            }
            toggleInventory(); return true;
        }
        if (world[gx][gy] === IDS.CHEST) {
            const chestData = getChestGroup(gx, gy);
            openedChest = { key: chestData.key, chest: chestData.chest, size: chestData.size, x: gx, y: gy };
            toggleInventory();
            return true;
        }
        return false;
    }

    export function handleMeleeAttack() {
        let pCX = player.x + player.width/2; let pCY = player.y + player.height/2;
        let wDmg = player.getWeaponDamage();
        
        for (let i = entities.length - 1; i >= 0; i--) {
            let z = entities[i];
            let zCX = z.x + z.width/2; let zCY = z.y + z.height/2;
            
            if (Math.hypot(pCX - zCX, pCY - zCY) < REACH * TILE_SIZE) {
                if (mouse.worldX >= z.x && mouse.worldX <= z.x + z.width && mouse.worldY >= z.y && mouse.worldY <= z.y + z.height) {
                    z.takeDamage(wDmg, pCX < zCX ? 1 : -1);
                    damageSelectedTool(1);
                    if (z instanceof Sheep && z.health > 0 && !z.isSheared) {
                        z.isSheared = true;
                        giveItem(IDS.WOOL, 1);
                    }
                    if (z.health <= 0) {
                        if (z instanceof Sheep) {
                            giveItem(IDS.RAW_MUTTON, Math.floor(Math.random() * 2) + 1);
                            if (!z.isSheared) giveItem(IDS.WOOL, 1);
                        } else if (z instanceof Pig) giveItem(IDS.RAW_PORKCHOP, Math.floor(Math.random() * 2) + 1);
                        else if (z instanceof Chicken) {
                            giveItem(IDS.RAW_CHICKEN, 1);
                            if (Math.random() < 0.5) giveItem(IDS.FEATHER, 1);
                        }
                        else if (z instanceof Zombie) {
                            if(Math.random() < 0.5) giveItem(IDS.RAW_PORKCHOP, 1);
                            monstersKilledCount = (monstersKilledCount || 0) + 1;
                            unlockAchievement('monster_hunter');
                            if (monstersKilledCount >= 5) unlockAchievement('sniper_duel');
                            if (monstersKilledCount >= 15) unlockAchievement('apex_predator');
                        }
                        else if (z instanceof Creeper) {
                            giveItem(IDS.COAL, Math.floor(Math.random() * 2) + 1);
                            monstersKilledCount = (monstersKilledCount || 0) + 1;
                            unlockAchievement('monster_hunter');
                            if (monstersKilledCount >= 5) unlockAchievement('sniper_duel');
                            if (monstersKilledCount >= 15) unlockAchievement('apex_predator');
                        }
                        else if (z instanceof Scorpion) {
                            if (Math.random() < 0.6) giveItem(IDS.BONE, 1);
                            monstersKilledCount = (monstersKilledCount || 0) + 1;
                            unlockAchievement('monster_hunter');
                            if (monstersKilledCount >= 5) unlockAchievement('sniper_duel');
                            if (monstersKilledCount >= 15) unlockAchievement('apex_predator');
                        }
                        entities.splice(i, 1);
                    }
                    player.exhaustion += 0.15 * getDayHungerDrainMultiplier();
                    const hotbarSlot = document.getElementById('hotbar')?.children?.[selectedHotbarIndex];
                    if (hotbarSlot) hotbarSlot.classList.add('eating-anim');
                    setTimeout(() => {
                        const s = document.getElementById('hotbar')?.children?.[selectedHotbarIndex];
                        if (s) s.classList.remove('eating-anim');
                    }, 150);
                    return true;
                }
            }
        }
        return false;
    }


    export function handleMiningLogic() {
        if (!mouse.isDownLeft || isInventoryOpen || STATE !== 'PLAYING') return;
        let gridX = Math.floor(mouse.worldX / TILE_SIZE); let gridY = Math.floor(mouse.worldY / TILE_SIZE);

        if (gridX < 0 || gridX >= WORLD_WIDTH || gridY < 0 || gridY >= WORLD_HEIGHT) return;
        let pCX = player.x + player.width / 2; let pCY = player.y + player.height / 2;
        let bCX = gridX * TILE_SIZE + TILE_SIZE / 2; let bCY = gridY * TILE_SIZE + TILE_SIZE / 2;
        
        if (Math.hypot(pCX - bCX, pCY - bCY) / TILE_SIZE > REACH) { miningTarget.progress = 0; return; }

        if (isBackgroundBuildMode) {
            let bgBlockId = bgWorld[gridX]?.[gridY] || IDS.AIR;
            if (bgBlockId === IDS.AIR) { miningTarget.progress = 0; return; }

            if (miningTarget.x !== gridX || miningTarget.y !== gridY) { miningTarget.x = gridX; miningTarget.y = gridY; miningTarget.progress = 0; }

            miningTarget.progress += player.getToolPower(bgBlockId);
            if (frameCount % 10 === 0) particles.push(new Particle(mouse.worldX, mouse.worldY, getBlockColor(bgBlockId)));

            let reqHardness = HARDNESS[bgBlockId] || 100;
            if (miningTarget.progress >= reqHardness) {
                playSound('break');
                for (let p = 0; p < 8; p++) particles.push(new Particle(bCX, bCY, getBlockColor(bgBlockId)));

                bgWorld[gridX][gridY] = IDS.AIR;
                syncBlock(gridX, gridY, IDS.AIR, { isBackground: true });

                let dropId = bgBlockId;
                if (bgBlockId === IDS.GRASS) dropId = IDS.DIRT;
                if (bgBlockId === IDS.STONE) dropId = IDS.COBBLESTONE;
                if (bgBlockId === IDS.WOODEN_STAIRS || bgBlockId === IDS.WOODEN_STAIRS_LEFT || bgBlockId === IDS.WOODEN_STAIRS_RIGHT) dropId = IDS.WOODEN_STAIRS;
                if (bgBlockId === IDS.COBBLESTONE_STAIRS || bgBlockId === IDS.COBBLESTONE_STAIRS_LEFT || bgBlockId === IDS.COBBLESTONE_STAIRS_RIGHT) dropId = IDS.COBBLESTONE_STAIRS;
                if (dropId) giveItem(dropId, 1);

                player.exhaustion += 0.05 * getDayHungerDrainMultiplier();
                damageSelectedTool();
                miningTarget.progress = 0;
                if (!isMultiplayer) saveCurrentWorld();
            }
            return;
        }

        let blockId = world[gridX][gridY];
        if (blockId === IDS.AIR) { miningTarget.progress = 0; return; }

        if (miningTarget.x !== gridX || miningTarget.y !== gridY) { miningTarget.x = gridX; miningTarget.y = gridY; miningTarget.progress = 0; }

        miningTarget.progress += player.getToolPower(blockId);
        
        if(frameCount % 10 === 0) particles.push(new Particle(mouse.worldX, mouse.worldY, getBlockColor(blockId)));

        let reqHardness = HARDNESS[blockId] || 100;
        
        if (miningTarget.progress >= reqHardness) {
            playSound('break');
            for(let p=0; p<8; p++) particles.push(new Particle(bCX, bCY, getBlockColor(blockId))); 
            
            if (blockId === IDS.FURNACE) {
                let fIdx = furnaces.findIndex(f => f.x === gridX && f.y === gridY);
                if (fIdx > -1) {
                    let f = furnaces[fIdx];
                    if (f.input) giveItem(f.input.id, f.input.count);
                    if (f.fuel) giveItem(f.fuel.id, f.fuel.count);
                    if (f.output) giveItem(f.output.id, f.output.count);
                    furnaces.splice(fIdx, 1);
                }
            }
            if (blockId === IDS.CHEST) {
                const chestData = getChestGroup(gridX, gridY);
                const chestX = Number(chestData.key.split('_')[0]);
                const brokenOffset = chestData.size === 54 && gridX !== chestX ? 27 : 0;
                const brokenItems = chestData.chest.items.slice(brokenOffset, brokenOffset + 27);
                const remainingItems = chestData.size === 54 ? chestData.chest.items.slice(brokenOffset === 0 ? 27 : 0, brokenOffset === 0 ? 54 : 27) : [];
                brokenItems.forEach(item => { if (item) giveItem(item.id, item.count); });
                chests.delete(chestData.key);
                if (remainingItems.length) {
                    const remainingX = gridX === chestX ? chestX + 1 : chestX;
                    const remainingKey = getChestKey(remainingX, gridY);
                    chests.set(remainingKey, { items: remainingItems });
                    syncChest(remainingKey);
                }
                if (openedChest?.key === chestData.key) { openedChest = null; isInventoryOpen = false; document.getElementById('inventory-container').classList.add('hidden'); }
                syncChest(chestData.key);
                if (!isMultiplayer) saveCurrentWorld();
            }

            let wasTreeTrunk = nonCollidableTreeWood.has(`${gridX}_${gridY}`);
            nonCollidableTreeWood.delete(`${gridX}_${gridY}`);
            let brokenCells = [[gridX, gridY]];
            let detachedTorchCells = [];
            if (blockId !== IDS.TORCH) {
                [[gridX - 1, gridY], [gridX + 1, gridY], [gridX, gridY - 1]].forEach(([torchX, torchY]) => {
                    if (torchX >= 0 && torchX < WORLD_WIDTH && torchY >= 0 && torchY < WORLD_HEIGHT && world[torchX][torchY] === IDS.TORCH) {
                        detachedTorchCells.push([torchX, torchY]);
                    }
                });
            }
            if (isDoorBlock(blockId)) {
                const doorBaseY = getDoorBaseY(gridY, blockId);
                brokenCells = [[gridX, doorBaseY], [gridX, doorBaseY - 1]];
            } else if (blockId === IDS.BED) {
                let bedPairStart = getBedPairStart(gridX, gridY);
                brokenCells = [[bedPairStart, gridY]];
                if (bedPairStart + 1 < WORLD_WIDTH && world[bedPairStart + 1][gridY] === IDS.BED) {
                    brokenCells.push([bedPairStart + 1, gridY]);
                }
            }
            brokenCells.push(...detachedTorchCells);
            brokenCells.forEach(([brokenX, brokenY]) => {
                removeFluid(brokenX, brokenY);
                world[brokenX][brokenY] = IDS.AIR;
                wakeFluidsAround(brokenX, brokenY);
                leafDecayQueue.delete(`${brokenX}_${brokenY}`);
                saplingGrowthQueue.delete(`${brokenX}_${brokenY}`);
                saplingBlockedWarnings.delete(`${brokenX}_${brokenY}`);
                dirtToGrassQueue.delete(`${brokenX}_${brokenY}`);
                syncBlock(brokenX, brokenY, IDS.AIR);
                checkSandFallAbove(brokenX, brokenY);
                if (world[brokenX]?.[brokenY + 1] === IDS.DIRT) scheduleDirtToGrass(brokenX, brokenY + 1);
            });
            if (blockId === IDS.SNOW) scheduleSnowRegrowth(gridX, gridY);
            notifyBlockedSaplings();
            miningTarget.progress = 0;
            if (wasTreeTrunk && (!isMultiplayer || isMultiplayerAuthority()) && ![...nonCollidableTreeWood].some(cell => cell.startsWith(`${gridX}_`))) {
                scheduleTreeLeafDecay(gridX);
            }
            player.exhaustion += 0.05 * getDayHungerDrainMultiplier();
            let surfY = getWorldSurfaceY(gridX);
            if (gridY > surfY + 20 && (blockId === IDS.STONE || blockId === IDS.COBBLESTONE || blockId === IDS.COAL_ORE || blockId === IDS.IRON_ORE || blockId === IDS.GOLD_ORE || blockId === IDS.DIAMOND_ORE)) {
                deepBlocksMinedCount = (deepBlocksMinedCount || 0) + 1;
                if (deepBlocksMinedCount >= 50) unlockAchievement('subterranean_miner');
            }
            let dropId = blockId;
            if (blockId === IDS.GRASS) dropId = IDS.DIRT;
            if (!canHarvestBlock(blockId) && getRequiredMiningTier(blockId) > 0) dropId = null;
            if (isDoorBlock(blockId)) dropId = IDS.DOOR;
            if (blockId === IDS.STONE) dropId = IDS.COBBLESTONE;
            if (blockId === IDS.SNOW) { giveItem(IDS.SNOWBALL, 4); dropId = null; }
            if (blockId === IDS.COAL_ORE) dropId = IDS.COAL;
            if (blockId === IDS.IRON_ORE) dropId = IDS.IRON_ORE;
            if (blockId === IDS.DIAMOND_ORE) dropId = IDS.DIAMOND;
            if (blockId === IDS.LADDER) dropId = IDS.LADDER;
            if (blockId === IDS.WOODEN_STAIRS || blockId === IDS.WOODEN_STAIRS_LEFT || blockId === IDS.WOODEN_STAIRS_RIGHT) dropId = IDS.WOODEN_STAIRS;
            if (blockId === IDS.COBBLESTONE_STAIRS || blockId === IDS.COBBLESTONE_STAIRS_LEFT || blockId === IDS.COBBLESTONE_STAIRS_RIGHT) dropId = IDS.COBBLESTONE_STAIRS;
            if (blockId === IDS.SHORT_GRASS || blockId === IDS.TALL_GRASS) {
                if (Math.random() < 0.20) dropId = IDS.SEEDS;
                else dropId = null;
            }
            if (blockId === IDS.FLOWER_RED) dropId = IDS.FLOWER_RED;
            if (blockId === IDS.FLOWER_YELLOW) dropId = IDS.FLOWER_YELLOW;
            if (blockId === IDS.LEAVES) {
                const leafDropRoll = Math.random();
                if (leafDropRoll < 0.02) dropId = IDS.SAPLING;
                else if (leafDropRoll < 0.07) dropId = IDS.APPLE;
                else if (leafDropRoll < 0.15) dropId = IDS.STICK;
                else dropId = null;
            }
            if (dropId) giveItem(dropId, 1);
            detachedTorchCells.forEach(() => giveItem(IDS.TORCH, 1));
            // Check if flower/grass/sapling above was detached
            if (gridY > 0 && [IDS.SHORT_GRASS, IDS.TALL_GRASS, IDS.FLOWER_RED, IDS.FLOWER_YELLOW, IDS.SAPLING].includes(world[gridX]?.[gridY - 1])) {
                let aboveId = world[gridX][gridY - 1];
                world[gridX][gridY - 1] = IDS.AIR;
                syncBlock(gridX, gridY - 1, IDS.AIR);
                if (aboveId === IDS.SHORT_GRASS || aboveId === IDS.TALL_GRASS) {
                    if (Math.random() < 0.20) giveItem(IDS.SEEDS, 1);
                } else if (aboveId === IDS.FLOWER_RED || aboveId === IDS.FLOWER_YELLOW || aboveId === IDS.SAPLING) {
                    giveItem(aboveId, 1);
                }
                if (aboveId === IDS.SAPLING) {
                    saplingGrowthQueue.delete(`${gridX}_${gridY - 1}`);
                    saplingBlockedWarnings.delete(`${gridX}_${gridY - 1}`);
                }
                checkSandFallAbove(gridX, gridY - 1);
            }
            damageSelectedTool();
        }
    }

    export function intersectsEntity(gx, gy) {
        let bx = gx * TILE_SIZE, by = gy * TILE_SIZE, bw = TILE_SIZE, bh = TILE_SIZE;
        let check = (e) => !(bx >= e.x + e.width || bx + bw <= e.x || by >= e.y + e.height || by + bh <= e.y);
        if (check(player)) return true;
        for (let z of entities) if (check(z)) return true;
        for (let fb of fallingBlocks) {
            if (fb.alive && check({ x: fb.x, y: fb.y, width: TILE_SIZE, height: TILE_SIZE })) return true;
        }
        return false;
    }

    export let continuousPlaceCooldown = 0;
    export let lastPlacedCell = { x: -1, y: -1 };

    export function handleContinuousPlacingLogic() {
        if (!mouse.isDownRight || isInventoryOpen || STATE !== 'PLAYING') {
            continuousPlaceCooldown = 0;
            lastPlacedCell.x = -1;
            lastPlacedCell.y = -1;
            return;
        }

        let sel = inventory[selectedHotbarIndex];
        if (sel && isFoodItem(sel.id)) {
            return;
        }
        // Snowballs are thrown once per click — block continuous fire
        if (sel && sel.id === IDS.SNOWBALL) return;

        if (continuousPlaceCooldown > 0) {
            continuousPlaceCooldown--;
        }

        let gx = Math.floor(mouse.worldX / TILE_SIZE);
        let gy = Math.floor(mouse.worldY / TILE_SIZE);

        if ((gx !== lastPlacedCell.x || gy !== lastPlacedCell.y) && continuousPlaceCooldown === 0) {
            if (!handleBlockInteraction()) {
                const placed = handleRightClickPlace();
                if (placed) {
                    playSound('place');
                    lastPlacedCell.x = gx;
                    lastPlacedCell.y = gy;
                    continuousPlaceCooldown = 4;
                    attackAnimationTimer = 8;
                }
            } else {
                lastPlacedCell.x = gx;
                lastPlacedCell.y = gy;
                continuousPlaceCooldown = 12;
            }
        }
    }

    export function handleRightClickPlace() {
        if (isInventoryOpen || STATE !== 'PLAYING') return false;

        let selectedIndex = selectedHotbarIndex;
        let sel = inventory[selectedIndex];
        if (sel && isFoodItem(sel.id)) return false;

        // --- Snowball throw: runs BEFORE any grid/reach checks so aim can point anywhere ---
        const offhandTorch = (!isBackgroundBuildMode && inventory[27] && inventory[27].id === IDS.TORCH) ? inventory[27] : null;
        const isUnplaceableItem = id => isTool(id) || isFoodItem(id) || id === IDS.COAL || id === IDS.STICK || id === IDS.GOLD_INGOT || id === IDS.IRON_ORE || id === IDS.DIAMOND_ORE || id === IDS.IRON_INGOT || id === IDS.DIAMOND || id === IDS.FEATHER || id === IDS.SNOWBALL;
        if (!sel && offhandTorch) { selectedIndex = 27; sel = offhandTorch; }

        if (sel && sel.id === IDS.SNOWBALL && sel.count > 0) {
            const px = player.x + player.width / 2;
            const py = player.y + player.height / 2;
            const dx = mouse.worldX - px;
            const dy = mouse.worldY - py;
            const dist = Math.hypot(dx, dy);
            if (dist < 1) return false;
            const speed = 14;
            const dirX = dx / dist;
            const dirY = dy / dist;
            const vx = dirX * speed;
            const vy = dirY * speed;
            const spawnX = px + dirX * 14;
            const spawnY = py + dirY * 14;
            const projId = `sb_${window.user?.uid || 'local'}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
            activeProjectiles.push(new SnowballProjectile(spawnX, spawnY, vx, vy, window.user?.uid || 'local', projId));
            player.facingRight = dx >= 0;
            attackAnimationTimer = 8;
            playSound('snowball_throw');
            unlockAchievement('snowball_fight');
            sel.count--;
            if (sel.count <= 0) inventory[selectedIndex] = null;
            // Sync throw to multiplayer peers via WebRTC
            if (isMultiplayer) {
                broadcastDataPacket({
                    type: 'snowball',
                    id: projId,
                    x: spawnX,
                    y: spawnY,
                    vx: vx,
                    vy: vy,
                    uid: window.user?.uid || 'local'
                });
            }
            updateUI();
            return true;
        }
        // --- End snowball throw ---

        // Re-resolve selectedIndex/sel for normal block placement
        selectedIndex = selectedHotbarIndex;
        sel = inventory[selectedIndex];
        if (sel && isFoodItem(sel.id)) return false;
        const hotbarItemCanPlace = sel && !isUnplaceableItem(sel.id);
        if (!hotbarItemCanPlace && offhandTorch) { selectedIndex = 27; sel = offhandTorch; }
        if (!sel || sel.count <= 0 || isUnplaceableItem(sel.id)) return false;

        let gx = Math.floor(mouse.worldX / TILE_SIZE); let gy = Math.floor(mouse.worldY / TILE_SIZE);
        if (gx < 0 || gx >= WORLD_WIDTH || gy < 0 || gy >= WORLD_HEIGHT) return false;
        let pCX = player.x + player.width / 2; let pCY = player.y + player.height / 2;
        let bCX = gx * TILE_SIZE + TILE_SIZE / 2; let bCY = gy * TILE_SIZE + TILE_SIZE / 2;
        if (Math.hypot(pCX - bCX, pCY - bCY) / TILE_SIZE > REACH) return false;

        if (isBackgroundBuildMode) {
            if (!isBackgroundBuildingBlock(sel.id)) {
                showToast('Only building blocks can be placed in the background!');
                return false;
            }
            if (!bgWorld || !bgWorld[gx] || bgWorld[gx][gy] !== IDS.AIR) return false;

            let placedBlockId = sel.id;
            if (sel.id === IDS.WOODEN_STAIRS || sel.id === IDS.WOODEN_STAIRS_RIGHT) {
                placedBlockId = player.facingRight ? IDS.WOODEN_STAIRS_RIGHT : IDS.WOODEN_STAIRS_LEFT;
            } else if (sel.id === IDS.COBBLESTONE_STAIRS || sel.id === IDS.COBBLESTONE_STAIRS_RIGHT) {
                placedBlockId = player.facingRight ? IDS.COBBLESTONE_STAIRS_RIGHT : IDS.COBBLESTONE_STAIRS_LEFT;
            }

            bgWorld[gx][gy] = placedBlockId;
            syncBlock(gx, gy, placedBlockId, { isBackground: true });
            sel.count--;
            if (sel.count <= 0) inventory[selectedIndex] = null;
            updateUI();
            if (!isMultiplayer) saveCurrentWorld();
            return true;
        }

        if (sel.id === IDS.TORCH) {
            let canPlace = false;
            if ((gy < WORLD_HEIGHT-1 && world[gx][gy+1] !== IDS.AIR && world[gx][gy+1] !== IDS.TORCH) || 
                (gx > 0 && world[gx-1][gy] !== IDS.AIR && world[gx-1][gy] !== IDS.TORCH) || 
                (gx < WORLD_WIDTH-1 && world[gx+1][gy] !== IDS.AIR && world[gx+1][gy] !== IDS.TORCH)) {
                canPlace = true;
            }
            if (!canPlace) return false; 
        }

        const targetFluid = getFluid(gx, gy);
        if (sel.id === IDS.BUCKET && targetFluid && (!isMultiplayer || isMultiplayerAuthority())) {
            if (targetFluid.source || targetFluid.level === 0) {
                removeFluid(gx, gy);
                const filledBucketId = targetFluid.type === IDS.WATER ? IDS.WATER_BUCKET : IDS.LAVA_BUCKET;
                unlockAchievement('bucket_brigade');
                if (sel.count === 1) sel.id = filledBucketId;
                else {
                    sel.count--;
                    if (!giveItem(filledBucketId, 1)) {
                        sel.count++;
                        setFluid(gx, gy, targetFluid);
                        return false;
                    }
                }
                wakeFluidsAround(gx, gy);
                if (isMultiplayer && isMultiplayerAuthority()) syncFluidState();
                updateUI();
                return true;
            }
        }
        if ((sel.id === IDS.WATER_BUCKET || sel.id === IDS.LAVA_BUCKET) && (!isMultiplayer || isMultiplayerAuthority())) {
            if (world[gx][gy] === IDS.AIR && !intersectsEntity(gx, gy)) {
                const placed = setFluid(gx, gy, { type: sel.id === IDS.WATER_BUCKET ? IDS.WATER : IDS.LAVA, level: 0, source: true, falling: false });
                if (!placed) return false;
                if (sel.count === 1) sel.id = IDS.BUCKET;
                else {
                    sel.count--;
                    if (!giveItem(IDS.BUCKET, 1)) {
                        sel.count++;
                        removeFluid(gx, gy);
                        return false;
                    }
                }
                wakeFluidsAround(gx, gy);
                if (isMultiplayer && isMultiplayerAuthority()) syncFluidState();
                updateUI();
                return true;
            }
        }

        if (targetFluid && !HARDNESS[sel.id]) return false;

        if (sel.id === IDS.DOOR) {
            if (gy < 1 || gy >= WORLD_HEIGHT - 1 || !isSolidWorldBlock(gx, gy + 1, world[gx][gy + 1]) || world[gx][gy] !== IDS.AIR || world[gx][gy - 1] !== IDS.AIR || intersectsEntity(gx, gy) || intersectsEntity(gx, gy - 1)) return false;
            world[gx][gy] = IDS.DOOR;
            world[gx][gy - 1] = IDS.DOOR_TOP;
            syncBlock(gx, gy, IDS.DOOR);
            syncBlock(gx, gy - 1, IDS.DOOR_TOP);
            sel.count--;
            if (sel.count <= 0) inventory[selectedIndex] = null;
            updateUI();
            return true;
        }

        if (sel.id === IDS.CHEST) {
            if (world[gx][gy] !== IDS.AIR || !isSolidWorldBlock(gx, gy + 1, world[gx][gy + 1]) || intersectsEntity(gx, gy)) return false;
            world[gx][gy] = IDS.CHEST;
            syncBlock(gx, gy, IDS.CHEST);
            syncChest(getChestGroup(gx, gy).key);
            sel.count--;
            if (sel.count <= 0) inventory[selectedIndex] = null;
            if (!isMultiplayer) saveCurrentWorld();
            updateUI();
            return true;
        }

        if (sel.id === IDS.SAPLING) {
            if (gy >= WORLD_HEIGHT - 1 || world[gx][gy] !== IDS.AIR || ![IDS.DIRT, IDS.GRASS].includes(world[gx][gy + 1]) || intersectsEntity(gx, gy)) return false;
            const growthAt = dayCount + timeOfDay + SAPLING_GROWTH_DAYS;
            world[gx][gy] = IDS.SAPLING;
            const hasClearGrowthSpace = canSaplingGrowAt(gx, gy);
            saplingGrowthQueue.set(`${gx}_${gy}`, growthAt);
            syncBlock(gx, gy, IDS.SAPLING, { growthAt });
            sel.count--;
            if (sel.count <= 0) inventory[selectedIndex] = null;
            if (hasClearGrowthSpace) showToast('Sapling planted. It will grow in 2 days.');
            else {
                saplingBlockedWarnings.add(`${gx}_${gy}`);
                showToast('Sapling planted, but it needs clear space above and around it before it can grow.');
            }
            updateUI();
            return true;
        }

        if (sel.id === IDS.FLOWER_RED || sel.id === IDS.FLOWER_YELLOW || sel.id === IDS.SHORT_GRASS || sel.id === IDS.TALL_GRASS) {
            if (gy >= WORLD_HEIGHT - 1 || world[gx][gy] !== IDS.AIR || ![IDS.DIRT, IDS.GRASS].includes(world[gx][gy + 1]) || intersectsEntity(gx, gy)) return false;
            world[gx][gy] = sel.id;
            syncBlock(gx, gy, sel.id);
            sel.count--;
            if (sel.count <= 0) inventory[selectedIndex] = null;
            updateUI();
            return true;
        }

        if (sel.id === IDS.SEEDS) {
            if (gy >= WORLD_HEIGHT - 1 || world[gx][gy] !== IDS.AIR || ![IDS.DIRT, IDS.GRASS].includes(world[gx][gy + 1]) || intersectsEntity(gx, gy)) return false;
            world[gx][gy] = IDS.SHORT_GRASS;
            syncBlock(gx, gy, IDS.SHORT_GRASS);
            sel.count--;
            if (sel.count <= 0) inventory[selectedIndex] = null;
            updateUI();
            return true;
        }

        if (sel.id === IDS.LADDER) {
            if (world[gx][gy] !== IDS.AIR && world[gx][gy] !== IDS.SHORT_GRASS && world[gx][gy] !== IDS.TALL_GRASS) return false;
            let hasSupport = (gx > 0 && isSolidWorldBlock(gx - 1, gy, world[gx - 1][gy])) ||
                             (gx < WORLD_WIDTH - 1 && isSolidWorldBlock(gx + 1, gy, world[gx + 1][gy])) ||
                             (gy < WORLD_HEIGHT - 1 && (isSolidWorldBlock(gx, gy + 1, world[gx][gy + 1]) || world[gx][gy + 1] === IDS.LADDER)) ||
                             (gy > 0 && (isSolidWorldBlock(gx, gy - 1, world[gx][gy - 1]) || world[gx][gy - 1] === IDS.LADDER));
            if (!hasSupport) return false;
            removeFluid(gx, gy);
            world[gx][gy] = IDS.LADDER;
            wakeFluidsAround(gx, gy);
            syncBlock(gx, gy, IDS.LADDER);
            sel.count--;
            if (sel.count <= 0) inventory[selectedIndex] = null;
            updateUI();
            return true;
        }

        if (sel.id === IDS.WOODEN_STAIRS || sel.id === IDS.WOODEN_STAIRS_RIGHT) {
            if (world[gx][gy] !== IDS.AIR || intersectsEntity(gx, gy)) return false;
            let placedBlockId = player.facingRight ? IDS.WOODEN_STAIRS_RIGHT : IDS.WOODEN_STAIRS_LEFT;
            removeFluid(gx, gy);
            world[gx][gy] = placedBlockId;
            wakeFluidsAround(gx, gy);
            syncBlock(gx, gy, placedBlockId);
            sel.count--;
            if (sel.count <= 0) inventory[selectedIndex] = null;
            updateUI();
            return true;
        }

        if (sel.id === IDS.COBBLESTONE_STAIRS || sel.id === IDS.COBBLESTONE_STAIRS_RIGHT) {
            if (world[gx][gy] !== IDS.AIR || intersectsEntity(gx, gy)) return false;
            let placedBlockId = player.facingRight ? IDS.COBBLESTONE_STAIRS_RIGHT : IDS.COBBLESTONE_STAIRS_LEFT;
            removeFluid(gx, gy);
            world[gx][gy] = placedBlockId;
            wakeFluidsAround(gx, gy);
            syncBlock(gx, gy, placedBlockId);
            sel.count--;
            if (sel.count <= 0) inventory[selectedIndex] = null;
            updateUI();
            return true;
        }

        if (sel.id === IDS.SAND) {
            if (world[gx][gy] !== IDS.AIR || intersectsEntity(gx, gy)) return false;
            removeFluid(gx, gy);
            sel.count--;
            if (sel.count <= 0) inventory[selectedIndex] = null;
            updateUI();

            if (!isSolidWorldBlock(gx, gy + 1, world[gx]?.[gy + 1])) {
                fallingBlocks.push(new FallingBlock(gx, gy, IDS.SAND));
            } else {
                world[gx][gy] = IDS.SAND;
                syncBlock(gx, gy, IDS.SAND);
                wakeFluidsAround(gx, gy);
            }
            checkSandFallAbove(gx, gy);
            if (isMultiplayer && isMultiplayerAuthority()) syncFluidState();
            return true;
        }

        let placementLength = sel.id === IDS.BED ? BED_LENGTH : 1;
        if (gx + placementLength > WORLD_WIDTH) return false;
        for (let offset = 0; offset < placementLength; offset++) {
            if (world[gx + offset][gy] !== IDS.AIR || intersectsEntity(gx + offset, gy)) return false;
        }

        const constructionBlocks = [IDS.DIRT, IDS.GRASS, IDS.STONE, IDS.COBBLESTONE, IDS.WOOD, IDS.LEAVES, IDS.PLANKS, IDS.SAND, IDS.SNOW];
        const needsSupport = sel.id !== IDS.TORCH && !constructionBlocks.includes(sel.id);
        if (needsSupport) {
            if (gy >= WORLD_HEIGHT - 1) return false;
            for (let offset = 0; offset < placementLength; offset++) {
                if (!isSolidWorldBlock(gx + offset, gy + 1, world[gx + offset][gy + 1])) return false;
            }
        }

        if (HARDNESS[sel.id]) {
            nonCollidableTreeWood.delete(`${gx}_${gy}`);
            for (let offset = 0; offset < placementLength; offset++) {
                removeFluid(gx + offset, gy);
                world[gx + offset][gy] = sel.id;
                wakeFluidsAround(gx + offset, gy);
                syncBlock(gx + offset, gy, sel.id);
                checkSandFallAbove(gx + offset, gy);
                if (sel.id === IDS.DIRT) scheduleDirtToGrass(gx + offset, gy);
            }
            if (sel.id === IDS.FURNACE) {
                furnaces.push({x: gx, y: gy, input: null, fuel: null, output: null, progress: 0, burnTime: 0, maxBurnTime: 0});
            }
            sel.count--;
            if (sel.count <= 0) inventory[selectedIndex] = null;
            if (isMultiplayer && isMultiplayerAuthority()) syncFluidState();
            updateUI();
            return true;
        }

        return false;
    }
    

    export function startGameplay() {
        ensureTreeWoodNonCollidable();
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('worlds-menu').classList.add('hidden'); 
        document.getElementById('shared-menu-bg').classList.add('hidden');
        const introEl = document.getElementById('game-intro');
        if (introEl) { introEl.classList.add('hidden'); introEl.setAttribute('aria-hidden', 'true'); }
        document.getElementById('hud').style.display = 'block';
        document.getElementById('gameCanvas').classList.remove('hidden');
        initCanvasMouseListeners();

        if (canvas && (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight)) {
            if (typeof resizeCanvases === 'function') resizeCanvases();
        }

        const curPlayer = player || (typeof window !== 'undefined' ? window.player : null);
        const curCanvas = canvas || (typeof window !== 'undefined' ? window.canvas : null);
        if (curCanvas && curPlayer) {
            camera.x = curPlayer.x + (curPlayer.width || 24) / 2 - curCanvas.width / 2;
            camera.y = curPlayer.y + (curPlayer.height || 48) / 2 - curCanvas.height / 2;
            camera.x = Math.max(-curCanvas.width / 3, Math.min(camera.x, WORLD_WIDTH * TILE_SIZE - curCanvas.width + curCanvas.width / 3));
            camera.y = Math.max(0, Math.min(camera.y, WORLD_HEIGHT * TILE_SIZE - curCanvas.height));
        }

        caveSkyOpacity = typeof getPlayerCaveSkyOpacity === 'function' ? getPlayerCaveSkyOpacity() : 0;
        lastAutosaveTimestamp = Date.now();
        lastRenderTime = performance.now();
        lastFrameTime = performance.now();
        physicsAccumulator = 0;
        Object.keys(keys).forEach(k => delete keys[k]);

        setEngineState('PLAYING'); updateUI(); updateHealthUI(); updateHungerUI(); updateTimeUI(); updateTutorialUI(); updateArmorUI(); updateHudArmorBar();
        if(!isMultiplayer) saveCurrentWorld();
    }


    export function pauseGame() {
        setEngineState('PAUSED');
        document.getElementById('pause-menu').classList.remove('hidden');
        const mpBtn = document.getElementById('btn-pause-multiplayer');
        if (mpBtn) {
            if (isMultiplayer) mpBtn.classList.add('hidden');
            else mpBtn.classList.remove('hidden');
        }
        Object.keys(keys).forEach(k => delete keys[k]);
        physicsAccumulator = 0;
    }
    export function resumeGame() { 
        setEngineState('PLAYING'); 
        document.getElementById('pause-menu').classList.add('hidden'); 
        document.getElementById('settings-menu').classList.add('hidden'); 
        Object.keys(keys).forEach(k => delete keys[k]); 
        lastRenderTime = performance.now(); 
        lastFrameTime = performance.now(); 
        physicsAccumulator = 0; 
    }
    export function setWorldDifficulty(newDiff) {
        if (currentDifficulty === 'hardcore') return;
        if (!DIFFICULTIES[newDiff]) return;

        setEngineCurrentDifficulty(newDiff);
        updateSettingsDifficultyUI();

        // Despawn or decrease mobs accordingly
        if (newDiff === 'peaceful') {
            setEngineEntities(entities.filter(e => !(e instanceof Zombie || e instanceof Creeper || e instanceof Scorpion)));
        } else {
            let maxHostiles = (newDiff === 'easy') ? 8 : (newDiff === 'normal' ? 14 : 42);
            let hostileCount = 0;
            setEngineEntities(entities.filter(e => {
                if (e instanceof Zombie || e instanceof Creeper || e instanceof Scorpion) {
                    hostileCount++;
                    return hostileCount <= maxHostiles;
                }
                return true;
            }));
        }

        // Persist new difficulty to world metadata without affecting achievements
        if (currentWorldId) {
            let savedWorlds = getSavedWorlds();
            let wInfo = savedWorlds.find(w => w.id === currentWorldId);
            if (wInfo) {
                wInfo.difficulty = currentDifficulty;
                try {
                    localStorage.setItem('webcraft_worlds', JSON.stringify(savedWorlds));
                } catch (e) {}
            }
            saveCurrentWorld();
        }

        if (isMultiplayer && isMultiplayerAuthority() && window.fbDb && window.fbModules) {
            const { doc, updateDoc } = window.fbModules;
            updateDoc(doc(window.fbDb, 'artifacts', window.fbAppId, 'public', 'data', 'rooms', currentMpRoom), {
                difficulty: currentDifficulty
            }).catch(() => {});
        }

        showToast(`Difficulty set to ${DIFFICULTIES[newDiff].name}`);
    }


    export function updateGameSimulation() {
        setEngineFrameCount(frameCount + 1);

        let previousDayCount = dayCount;
        if (!isMultiplayer || isMultiplayerAuthority()) {
            let newTimeOfDay = timeOfDay + 1 / DAY_LENGTH_FRAMES;
            if (newTimeOfDay >= 1) {
                setEngineTimeOfDay(0);
                setEngineDayCount(dayCount + 1);
            } else {
                setEngineTimeOfDay(newTimeOfDay);
            }
        }
        if (dayCount !== previousDayCount && (!isMultiplayer || isMultiplayerAuthority())) {
            entities.forEach(e => { if (e instanceof Sheep) e.isSheared = false; });
            spawnAnimals(2, 0.30);
            for (let i = 0; i < 2; i++) spawnMobs(false);
        }
        if (!isMultiplayer || isMultiplayerAuthority()) {
            updateFluids();
            if (fluidTick % 12 === 0) syncFluidState();
        }
        if (frameCount % 60 === 0) updateTimeUI();

        furnaces.forEach(f => {
            let canSmelt = f.input && getSmeltResult(f.input.id) && (!f.output || (f.output.id === getSmeltResult(f.input.id) && f.output.count < 64));
            if (f.burnTime > 0) f.burnTime--;
            
            if (f.burnTime <= 0 && canSmelt && f.fuel && getFuelValue(f.fuel.id) > 0) {
                f.maxBurnTime = getFuelValue(f.fuel.id); f.burnTime = f.maxBurnTime;
                f.fuel.count--; if (f.fuel.count <= 0) f.fuel = null;
                if (openedFurnace === f && isInventoryOpen) updateUI();
            }
            
            if (f.burnTime > 0 && canSmelt) {
                f.progress++;
                if (f.progress >= 200) {
                    f.progress = 0;
                    let resId = getSmeltResult(f.input.id);
                    f.input.count--; if (f.input.count <= 0) f.input = null;
                    if (f.output) f.output.count++; else f.output = { id: resId, count: 1 };
                    if (openedFurnace === f && isInventoryOpen) updateUI();
                }
            } else { f.progress = 0; }
            
            updateFurnaceVisual(f);
            if (openedFurnace === f && isInventoryOpen && frameCount % 10 === 0) updateUI();
        });
        
        checkAutosave(Date.now());
        if (frameCount % 10 === 0) drawMinimap();

        const curPlayer = player || (typeof window !== 'undefined' ? window.player : null);
        if (curPlayer && typeof curPlayer.update === 'function') {
            curPlayer.update();
        }
        if (curPlayer && frameCount % 60 === 0) {
            let px = Math.floor((curPlayer.x + (curPlayer.width || 24) / 2) / TILE_SIZE);
            let py = Math.floor((curPlayer.y + (curPlayer.height || 48)) / TILE_SIZE);
            if (px >= 0 && px < WORLD_WIDTH) {
                let surfY = typeof getWorldSurfaceY === 'function' ? getWorldSurfaceY(px) : 0;
                if (py > surfY + 45) {
                    unlockAchievement('deep_diver');
                }
                if (py >= WORLD_HEIGHT - 12) {
                    unlockAchievement('deep_abyss');
                }
            }
        }

        syncLocalPlayerState(false);

        Object.values(remotePlayers).forEach(remotePlayer => {
            if (remotePlayer.damageCooldown > 0) remotePlayer.damageCooldown--;
            if (remotePlayer.isDead || remotePlayer.sleeping) return;

            const timeSincePacket = Date.now() - (remotePlayer.lastNetworkTimestamp || 0);
            const isPacketDelayed = timeSincePacket > 180;

            const vx = Number.isFinite(remotePlayer.vx) ? remotePlayer.vx : 0;
            let vy = Number.isFinite(remotePlayer.vy) ? remotePlayer.vy : 0;

            if (remotePlayer.targetX !== undefined && remotePlayer.targetY !== undefined) {
                const rpW = TILE_SIZE * 0.75;
                const rpH = TILE_SIZE * 1.8;

                if (isPacketDelayed && !remotePlayer.isClimbing) {
                    // Packet delayed > 180ms: local physics engine takeover & gravity simulation
                    vy += GRAVITY;
                    if (vy > TERMINAL_VELOCITY) vy = TERMINAL_VELOCITY;
                    remotePlayer.vy = vy;

                    let newTargetX = remotePlayer.targetX + vx;
                    let newTargetY = remotePlayer.targetY + vy;

                    // Terrain vertical collision check against ground
                    if (vy > 0 && Array.isArray(world)) {
                        const footY = Math.floor((newTargetY + rpH) / TILE_SIZE);
                        const leftTileX = Math.max(0, Math.floor((newTargetX + 2) / TILE_SIZE));
                        const rightTileX = Math.min(WORLD_WIDTH - 1, Math.floor((newTargetX + rpW - 2) / TILE_SIZE));
                        if (footY >= 0 && footY < WORLD_HEIGHT) {
                            let landed = false;
                            for (let tx = leftTileX; tx <= rightTileX; tx++) {
                                if (isSolidWorldBlock(tx, footY, world[tx]?.[footY])) {
                                    landed = true;
                                    break;
                                }
                            }
                            if (landed) {
                                newTargetY = footY * TILE_SIZE - rpH;
                                remotePlayer.vy = 0;
                                remotePlayer.isGrounded = true;
                            }
                        }
                    }

                    // Dampen horizontal velocity over time during packet loss
                    remotePlayer.vx = vx * 0.94;
                    if (Math.abs(remotePlayer.vx) < 0.05) remotePlayer.vx = 0;

                    remotePlayer.targetX = Math.max(0, Math.min(WORLD_WIDTH * TILE_SIZE - rpW, newTargetX));
                    remotePlayer.targetY = Math.max(0, Math.min(WORLD_HEIGHT * TILE_SIZE - rpH, newTargetY));
                } else if (remotePlayer.isMoving) {
                    // Normal dead-reckoning extrapolation between consecutive packets
                    if (Math.abs(vx) > 0.05) {
                        remotePlayer.targetX += vx * 0.95;
                    }
                    if (Math.abs(vy) > 0.05 && remotePlayer.isClimbing) {
                        remotePlayer.targetY += vy * 0.95;
                    }
                }
            }
        });

        if (!isMultiplayer || isMultiplayerAuthority()) {
            const curPlayer = player || (typeof window !== 'undefined' ? window.player : null);
            const playerXPositions = curPlayer ? [curPlayer.x + (curPlayer.width || 24) / 2] : [];
            if (isMultiplayer && typeof remotePlayers === 'object') {
                Object.values(remotePlayers).forEach(rp => {
                    const rx = rp.renderX ?? rp.targetX ?? rp.x;
                    if (Number.isFinite(rx)) playerXPositions.push(rx + 15);
                });
            }
            entities.forEach(e => {
                const isNearAnyPlayer = playerXPositions.some(px => Math.abs(e.x - px) < 1800);
                if (isNearAnyPlayer || !e.isGrounded || frameCount % 6 === 0) {
                    e.update();
                }
            });
            spawnMobs();
            updateTreeLeafDecay();
            processRemotePickupRequests();
            processRemoteDropRequests();
        }
        updateSaplingGrowth();
        updateNaturalRegrowth();
        processDroppedItems();
        handleMiningLogic();
        handleContinuousPlacingLogic();
        clouds.forEach(c => c.update());
        
        for (let i = 0; i < particles.length; i++) {
            if (particles[i].alive) particles[i].update();
        }
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            floatingTexts[i].update();
            if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
        }
        // Update and prune falling blocks (sand physics)
        for (let i = fallingBlocks.length - 1; i >= 0; i--) {
            fallingBlocks[i].update();
            if (!fallingBlocks[i].alive) fallingBlocks.splice(i, 1);
        }
        // Update and prune snowball projectiles
        for (let i = activeProjectiles.length - 1; i >= 0; i--) {
            activeProjectiles[i].update();
            if (!activeProjectiles[i].alive) activeProjectiles.splice(i, 1);
        }
        tryCompleteMultiplayerSleep();
        if (frameCount % 10 === 0) updateSleepStatus();
        checkAfkKick();
        syncMultiplayerWorldState();
    }

    export let isGameLoopRunning = false;

    export function gameLoop(now = performance.now()) {
        try {
            if (canvas && (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight)) {
                if (typeof resizeCanvases === 'function') resizeCanvases();
            }

            if (fpsCap > 0) {
                const minFrameDuration = 1000 / fpsCap;
                if (lastRenderTime > 0 && now - lastRenderTime < minFrameDuration - 2.0) {
                    return;
                }
            }
            let rawDelta = lastRenderTime > 0 ? (now - lastRenderTime) : PHYSICS_TICK_MS;
            lastRenderTime = now;
            lastFrameTime = now;

            rawDelta = Math.min(120, Math.max(0, rawDelta));
            frameDeltaMs = rawDelta;
            if (frameDeltaMs > 0) currentFps = Math.round(1000 / frameDeltaMs);

            if (STATE === 'MENU') {
                if (typeof drawMenuBackground === 'function') drawMenuBackground();
                if (typeof drawPlayerPreview === 'function') drawPlayerPreview();
            } 
            else if (STATE === 'PLAYING') {
                const curWorld = world || (typeof window !== 'undefined' ? window.world : null);
                const curPlayer = player || (typeof window !== 'undefined' ? window.player : null);
                if (!curWorld || !curPlayer) {
                    if (typeof drawMenuBackground === 'function') drawMenuBackground();
                    return;
                }

                // Delta time snap: If rawDelta is within ±2.8ms of a multiple of 16.67ms (e.g. 60Hz or 30Hz vsync jitter), snap it to avoid accumulator micro-stutter
                let snappedDelta = rawDelta;
                let nearestTicks = Math.round(rawDelta / PHYSICS_TICK_MS);
                if (nearestTicks >= 1 && Math.abs(rawDelta - nearestTicks * PHYSICS_TICK_MS) < 3.0) {
                    snappedDelta = nearestTicks * PHYSICS_TICK_MS;
                }

                physicsAccumulator += snappedDelta;

                let maxSteps = 5; // Prevent spiral of death on severe lag spikes
                while (physicsAccumulator >= PHYSICS_TICK_MS - 0.1 && maxSteps > 0) {
                    updateGameSimulation();
                    physicsAccumulator -= PHYSICS_TICK_MS;
                    maxSteps--;
                }
                if (maxSteps === 0 || physicsAccumulator < 0.2) {
                    physicsAccumulator = 0;
                }

                const dtFactor = Math.max(0.2, Math.min(3.0, frameDeltaMs / PHYSICS_TICK_MS));
                if (typeof updateCamera === 'function') updateCamera(dtFactor);
                if (typeof drawWorld === 'function') drawWorld();
            }
            else if (STATE === 'PAUSED' || STATE === 'DEAD') {
                physicsAccumulator = 0;
                if (typeof drawWorld === 'function') drawWorld();
            }

            if(showDebug && STATE === 'PLAYING' && frameCount % 10 === 0 && player) {
                let px = player.x / TILE_SIZE;
                let py = WORLD_HEIGHT - (player.y + player.height) / TILE_SIZE;
                let gx = Math.floor(mouse.worldX / TILE_SIZE); let gy = Math.floor(mouse.worldY / TILE_SIZE);
                let curWorld = world || (typeof window !== 'undefined' ? window.world : null);
                let targetBlockName = (curWorld && gx >= 0 && gx < WORLD_WIDTH && gy >= 0 && gy < WORLD_HEIGHT && curWorld[gx]?.[gy] !== undefined && curWorld[gx][gy] !== IDS.AIR) ? ID_NAMES[curWorld[gx][gy]] : 'Air';
                let pigs = entities.filter(e => e instanceof Pig).length;
                let chickens = entities.filter(e => e instanceof Chicken).length;
                let sheep = entities.filter(e => e instanceof Sheep).length;
                let hostiles = entities.length - pigs - chickens - sheep;
                
                let debugGridX = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor(px)));
                let surfaceY = typeof getWorldSurfaceY === 'function' ? getWorldSurfaceY(debugGridX) : 0;
                let playerFeetGridY = (player.y + player.height) / TILE_SIZE;
                let isSnowy = typeof getSnowBiomeRatio === 'function' ? getSnowBiomeRatio(debugGridX, 8) > 0.35 : false;
                let biome = playerFeetGridY > surfaceY + CAVE_SKY_START_TILES ? 'Underground' : (isSnowy ? 'Snowy Biome' : 'Plains Surface');

                const dbgEl = document.getElementById('debug-info');
                if (dbgEl) {
                    dbgEl.innerText = 
                        `Webcraft2D (${GAME_VERSION})\n` +
                        `Graphics: ${graphicsMode === 'fabulous' ? 'Fabulous (Shaders & VFX)' : (graphicsMode === 'advanced' ? 'Advanced' : 'Base')}\n` +
                        `FPS: ${currentFps} (${frameDeltaMs.toFixed(1)} ms) | Cap: ${fpsCap === 0 ? 'Unlimited' : fpsCap}\n` +
                        `TPS: ${PHYSICS_TICK_RATE} (Fixed 60Hz)\n` +
                        `XYZ: ${px.toFixed(2)} / ${py.toFixed(2)} / 0.00\n` +
                        `RAM: ${typeof getMemoryUsageText === 'function' ? getMemoryUsageText() : 'N/A'}\n` +
                        `Block: ${Math.floor(px)} ${Math.floor(py)}\n` +
                        `Facing: ${player.facingRight ? 'East (+X)' : 'West (-X)'}\n` +
                        `Biome: ${biome}\n` +
                        `Diff: ${currentDifficulty.toUpperCase()}\n` +
                        `Multiplayer: ${isMultiplayer ? currentMpRoom : 'Local'}\n` +
                        `Entities: ${entities.length} (Pigs:${pigs}, Chk:${chickens}, Sheep:${sheep}, Bad:${hostiles})\n` +
                        `Target: ${targetBlockName}\n` +
                        `Time: Day ${dayCount} (${(timeOfDay * 100).toFixed(0)}%) | Day Scale: ${typeof getDayDifficultyMultiplier === 'function' ? getDayDifficultyMultiplier().toFixed(2) : 1}x (Hunger: ${typeof getDayHungerDrainMultiplier === 'function' ? getDayHungerDrainMultiplier().toFixed(2) : 1}x)`;
                }
            }
        } catch (loopErr) {
            if (!gameLoop._lastErrorLogged || Date.now() - gameLoop._lastErrorLogged > 2000) {
                console.error("Game loop error handled:", loopErr);
                gameLoop._lastErrorLogged = Date.now();
            }
        } finally {
            requestAnimationFrame(gameLoop);
        }
    }
// Boot sequence deferred to end of module


// Global Window Bridge for cross-module & HTML event compatibility
try { if (typeof BED_LENGTH !== "undefined") window.BED_LENGTH = BED_LENGTH; } catch(e) {}
try { if (typeof CAVE_SKY_FADE_TILES !== "undefined") window.CAVE_SKY_FADE_TILES = CAVE_SKY_FADE_TILES; } catch(e) {}
try { if (typeof CAVE_SKY_START_TILES !== "undefined") window.CAVE_SKY_START_TILES = CAVE_SKY_START_TILES; } catch(e) {}
try { if (typeof DAY_LENGTH_FRAMES !== "undefined") window.DAY_LENGTH_FRAMES = DAY_LENGTH_FRAMES; } catch(e) {}
try { if (typeof DIRT_TO_GRASS_DAYS !== "undefined") window.DIRT_TO_GRASS_DAYS = DIRT_TO_GRASS_DAYS; } catch(e) {}
try { if (typeof GRAVITY !== "undefined") window.GRAVITY = GRAVITY; } catch(e) {}
try { if (typeof INVENTORY_SIZE !== "undefined") window.INVENTORY_SIZE = INVENTORY_SIZE; } catch(e) {}
try { if (typeof JUMP_FORCE !== "undefined") window.JUMP_FORCE = JUMP_FORCE; } catch(e) {}
try { if (typeof LAVA_FLOW_INTERVAL !== "undefined") window.LAVA_FLOW_INTERVAL = LAVA_FLOW_INTERVAL; } catch(e) {}
try { if (typeof LAVA_FLOW_MAX !== "undefined") window.LAVA_FLOW_MAX = LAVA_FLOW_MAX; } catch(e) {}
try { if (typeof LEAF_DECAY_MIN_FRAMES !== "undefined") window.LEAF_DECAY_MIN_FRAMES = LEAF_DECAY_MIN_FRAMES; } catch(e) {}
try { if (typeof LEAF_DECAY_RANDOM_FRAMES !== "undefined") window.LEAF_DECAY_RANDOM_FRAMES = LEAF_DECAY_RANDOM_FRAMES; } catch(e) {}
try { if (typeof LIGHT_SCALE !== "undefined") window.LIGHT_SCALE = LIGHT_SCALE; } catch(e) {}
try { if (typeof MOVE_SPEED !== "undefined") window.MOVE_SPEED = MOVE_SPEED; } catch(e) {}
try { if (typeof REACH !== "undefined") window.REACH = REACH; } catch(e) {}
try { if (typeof SAPLING_GROWTH_DAYS !== "undefined") window.SAPLING_GROWTH_DAYS = SAPLING_GROWTH_DAYS; } catch(e) {}
try { if (typeof SNOW_REGROWTH_DAYS !== "undefined") window.SNOW_REGROWTH_DAYS = SNOW_REGROWTH_DAYS; } catch(e) {}
try { if (typeof STATE !== "undefined") window.STATE = STATE; } catch(e) {}
try { if (typeof TERMINAL_VELOCITY !== "undefined") window.TERMINAL_VELOCITY = TERMINAL_VELOCITY; } catch(e) {}
try { if (typeof TILE_SIZE !== "undefined") window.TILE_SIZE = TILE_SIZE; } catch(e) {}
try { if (typeof WATER_FLOW_INTERVAL !== "undefined") window.WATER_FLOW_INTERVAL = WATER_FLOW_INTERVAL; } catch(e) {}
try { if (typeof WATER_FLOW_MAX !== "undefined") window.WATER_FLOW_MAX = WATER_FLOW_MAX; } catch(e) {}
try { if (typeof WORLD_HEIGHT !== "undefined") window.WORLD_HEIGHT = WORLD_HEIGHT; } catch(e) {}
try { if (typeof WORLD_WIDTH !== "undefined") window.WORLD_WIDTH = WORLD_WIDTH; } catch(e) {}
try { if (typeof advancedGraphics !== "undefined") window.advancedGraphics = advancedGraphics; } catch(e) {}
try { if (typeof audioNoiseBuffer !== "undefined") window.audioNoiseBuffer = audioNoiseBuffer; } catch(e) {}
try { if (typeof auroraCanvas !== "undefined") window.auroraCanvas = auroraCanvas; } catch(e) {}
try { if (typeof auroraCtx !== "undefined") window.auroraCtx = auroraCtx; } catch(e) {}
try { if (typeof auroraImageData !== "undefined") window.auroraImageData = auroraImageData; } catch(e) {}
try { if (typeof auroraSnowOpacity !== "undefined") window.auroraSnowOpacity = auroraSnowOpacity; } catch(e) {}
try { if (typeof autoJumpEnabled !== "undefined") window.autoJumpEnabled = autoJumpEnabled; } catch(e) {}
try { if (typeof cachedFabulousVignetteCanvas !== "undefined") window.cachedFabulousVignetteCanvas = cachedFabulousVignetteCanvas; } catch(e) {}
try { if (typeof cachedLightVignette !== "undefined") window.cachedLightVignette = cachedLightVignette; } catch(e) {}
try { if (typeof cachedMoonGlowCanvas !== "undefined") window.cachedMoonGlowCanvas = cachedMoonGlowCanvas; } catch(e) {}
try { if (typeof cachedShadowCanvas !== "undefined") window.cachedShadowCanvas = cachedShadowCanvas; } catch(e) {}
try { if (typeof cachedSnowFogCanvas !== "undefined") window.cachedSnowFogCanvas = cachedSnowFogCanvas; } catch(e) {}
try { if (typeof cachedSunGlowDayCanvas !== "undefined") window.cachedSunGlowDayCanvas = cachedSunGlowDayCanvas; } catch(e) {}
try { if (typeof cachedSunGlowSunsetCanvas !== "undefined") window.cachedSunGlowSunsetCanvas = cachedSunGlowSunsetCanvas; } catch(e) {}
try { if (typeof cachedTorchGlowCanvas !== "undefined") window.cachedTorchGlowCanvas = cachedTorchGlowCanvas; } catch(e) {}
try { if (typeof cachedTorchLightCanvas !== "undefined") window.cachedTorchLightCanvas = cachedTorchLightCanvas; } catch(e) {}
try { if (typeof cachedVignetteH !== "undefined") window.cachedVignetteH = cachedVignetteH; } catch(e) {}
try { if (typeof cachedVignetteW !== "undefined") window.cachedVignetteW = cachedVignetteW; } catch(e) {}
try { if (typeof canvas !== "undefined") window.canvas = canvas; } catch(e) {}
try { if (typeof closeForegroundScreen !== "undefined") window.closeForegroundScreen = closeForegroundScreen; } catch(e) {}
try { if (typeof completeSleepTransition !== "undefined") window.completeSleepTransition = completeSleepTransition; } catch(e) {}
try { if (typeof continuousPlaceCooldown !== "undefined") window.continuousPlaceCooldown = continuousPlaceCooldown; } catch(e) {}
try { if (typeof ctx !== "undefined") window.ctx = ctx; } catch(e) {}
try { if (typeof currentDifficulty !== "undefined") window.currentDifficulty = currentDifficulty; } catch(e) {}
try { if (typeof currentMpRoom !== "undefined") window.currentMpRoom = currentMpRoom; } catch(e) {}
try { if (typeof currentMpWorldName !== "undefined") window.currentMpWorldName = currentMpWorldName; } catch(e) {}
try { if (typeof currentWorldId !== "undefined") window.currentWorldId = currentWorldId; } catch(e) {}
try { if (typeof currentWorldSize !== "undefined") window.currentWorldSize = currentWorldSize; } catch(e) {}
try { if (typeof dayCount !== "undefined") window.dayCount = dayCount; } catch(e) {}
try { if (typeof fabVigCtx !== "undefined") window.fabVigCtx = fabVigCtx; } catch(e) {}
try { if (typeof fabVigGrad !== "undefined") window.fabVigGrad = fabVigGrad; } catch(e) {}
try { if (typeof fabulousGraphics !== "undefined") window.fabulousGraphics = fabulousGraphics; } catch(e) {}
try { if (typeof footstepsEnabled !== "undefined") window.footstepsEnabled = footstepsEnabled; } catch(e) {}
try { if (typeof frameCount !== "undefined") window.frameCount = frameCount; } catch(e) {}
try { if (typeof gGrad !== "undefined") window.gGrad = gGrad; } catch(e) {}
try { if (typeof gameLoop !== "undefined") window.gameLoop = gameLoop; } catch(e) {}
try { if (typeof getAudioContext !== "undefined") window.getAudioContext = getAudioContext; } catch(e) {}
try { if (typeof getAudioNoiseBuffer !== "undefined") window.getAudioNoiseBuffer = getAudioNoiseBuffer; } catch(e) {}
try { if (typeof getMaxAnimals !== "undefined") window.getMaxAnimals = getMaxAnimals; } catch(e) {}
try { if (typeof globalAudioCtx !== "undefined") window.globalAudioCtx = globalAudioCtx; } catch(e) {}
try { if (typeof graphicsMode !== "undefined") window.graphicsMode = graphicsMode; } catch(e) {}
try { if (typeof handleBlockInteraction !== "undefined") window.handleBlockInteraction = handleBlockInteraction; } catch(e) {}
try { if (typeof handleContinuousPlacingLogic !== "undefined") window.handleContinuousPlacingLogic = handleContinuousPlacingLogic; } catch(e) {}
try { if (typeof handleMeleeAttack !== "undefined") window.handleMeleeAttack = handleMeleeAttack; } catch(e) {}
try { if (typeof handleMiningLogic !== "undefined") window.handleMiningLogic = handleMiningLogic; } catch(e) {}
try { if (typeof handleRightClickPlace !== "undefined") window.handleRightClickPlace = handleRightClickPlace; } catch(e) {}
try { if (typeof hotbarSize !== "undefined") window.hotbarSize = hotbarSize; } catch(e) {}
try { if (typeof intersectsEntity !== "undefined") window.intersectsEntity = intersectsEntity; } catch(e) {}
try { if (typeof introEnabled !== "undefined") window.introEnabled = introEnabled; } catch(e) {}
try { if (typeof introPhase !== "undefined") window.introPhase = introPhase; } catch(e) {}
try { if (typeof introTimer !== "undefined") window.introTimer = introTimer; } catch(e) {}
try { if (typeof inventory !== "undefined") window.inventory = inventory; } catch(e) {}
try { if (typeof isAudioMuted !== "undefined") window.isAudioMuted = isAudioMuted; } catch(e) {}
try { if (typeof isMultiplayer !== "undefined") window.isMultiplayer = isMultiplayer; } catch(e) {}
try { if (typeof isSleeping !== "undefined") window.isSleeping = isSleeping; } catch(e) {}
try { if (typeof lastDamageEventId !== "undefined") window.lastDamageEventId = lastDamageEventId; } catch(e) {}
try { if (typeof lastFluidStateTimestamp !== "undefined") window.lastFluidStateTimestamp = lastFluidStateTimestamp; } catch(e) {}
try { if (typeof lastPickupResultId !== "undefined") window.lastPickupResultId = lastPickupResultId; } catch(e) {}
try { if (typeof lastPlacedCell !== "undefined") window.lastPlacedCell = lastPlacedCell; } catch(e) {}
try { if (typeof lastSentSkinData !== "undefined") window.lastSentSkinData = lastSentSkinData; } catch(e) {}
try { if (typeof lastSyncTime !== "undefined") window.lastSyncTime = lastSyncTime; } catch(e) {}
try { if (typeof lastWorldStateTimestamp !== "undefined") window.lastWorldStateTimestamp = lastWorldStateTimestamp; } catch(e) {}
try { if (typeof lastWorldSyncTime !== "undefined") window.lastWorldSyncTime = lastWorldSyncTime; } catch(e) {}
try { if (typeof lightCanvas !== "undefined") window.lightCanvas = lightCanvas; } catch(e) {}
try { if (typeof lightCtx !== "undefined") window.lightCtx = lightCtx; } catch(e) {}
try { if (typeof masterVolume !== "undefined") window.masterVolume = masterVolume; } catch(e) {}
try { if (typeof menuBgCanvas !== "undefined") window.menuBgCanvas = menuBgCanvas; } catch(e) {}
try { if (typeof menuCtx !== "undefined") window.menuCtx = menuCtx; } catch(e) {}
try { if (typeof mg !== "undefined") window.mg = mg; } catch(e) {}
try { if (typeof moonGlowCtx !== "undefined") window.moonGlowCtx = moonGlowCtx; } catch(e) {}
try { if (typeof mpCreateDifficulty !== "undefined") window.mpCreateDifficulty = mpCreateDifficulty; } catch(e) {}
try { if (typeof mpPeerIds !== "undefined") window.mpPeerIds = mpPeerIds; } catch(e) {}
try { if (typeof mpPlayerSyncPending !== "undefined") window.mpPlayerSyncPending = mpPlayerSyncPending; } catch(e) {}
try { if (typeof mpPlayerSyncPendingStartTime !== "undefined") window.mpPlayerSyncPendingStartTime = mpPlayerSyncPendingStartTime; } catch(e) {}
try { if (typeof mpPlayerSyncQueued !== "undefined") window.mpPlayerSyncQueued = mpPlayerSyncQueued; } catch(e) {}
try { if (typeof mpWorldSyncPending !== "undefined") window.mpWorldSyncPending = mpWorldSyncPending; } catch(e) {}
try { if (typeof pauseGame !== "undefined") window.pauseGame = pauseGame; } catch(e) {}
try { if (typeof pendingPickupRequest !== "undefined") window.pendingPickupRequest = pendingPickupRequest; } catch(e) {}
try { if (typeof playFootstepSound !== "undefined") window.playFootstepSound = playFootstepSound; } catch(e) {}
try { if (typeof playNoise !== "undefined") window.playNoise = playNoise; } catch(e) {}
try { if (typeof playSound !== "undefined") window.playSound = playSound; } catch(e) {}
try { if (typeof playTone !== "undefined") window.playTone = playTone; } catch(e) {}
try { if (typeof playerName !== "undefined") window.playerName = playerName; } catch(e) {}
try { if (typeof remotePlayers !== "undefined") window.remotePlayers = remotePlayers; } catch(e) {}
try { if (typeof resumeGame !== "undefined") window.resumeGame = resumeGame; } catch(e) {}
try { if (typeof sFogGrad !== "undefined") window.sFogGrad = sFogGrad; } catch(e) {}
try { if (typeof seenEntityDamageEvents !== "undefined") window.seenEntityDamageEvents = seenEntityDamageEvents; } catch(e) {}
try { if (typeof selectMpWorldSize !== "undefined") window.selectMpWorldSize = selectMpWorldSize; } catch(e) {}
try { if (typeof selectWorldSize !== "undefined") window.selectWorldSize = selectWorldSize; } catch(e) {}
try { if (typeof selectedDiffChoice !== "undefined") window.selectedDiffChoice = selectedDiffChoice; } catch(e) {}
try { if (typeof selectedHotbarIndex !== "undefined") window.selectedHotbarIndex = selectedHotbarIndex; } catch(e) {}
try { if (typeof selectedJoinRoom !== "undefined") window.selectedJoinRoom = selectedJoinRoom; } catch(e) {}
try { if (typeof selectedMpWorldSize !== "undefined") window.selectedMpWorldSize = selectedMpWorldSize; } catch(e) {}
try { if (typeof selectedWorldSizeChoice !== "undefined") window.selectedWorldSizeChoice = selectedWorldSizeChoice; } catch(e) {}
try { if (typeof setWorldDifficulty !== "undefined") window.setWorldDifficulty = setWorldDifficulty; } catch(e) {}
try { if (typeof setWorldDimensions !== "undefined") window.setWorldDimensions = setWorldDimensions; } catch(e) {}
try { if (typeof settingsPreviousState !== "undefined") window.settingsPreviousState = settingsPreviousState; } catch(e) {}
try { if (typeof sfxVolume !== "undefined") window.sfxVolume = sfxVolume; } catch(e) {}
try { if (typeof sgDay !== "undefined") window.sgDay = sgDay; } catch(e) {}
try { if (typeof sgSunset !== "undefined") window.sgSunset = sgSunset; } catch(e) {}
try { if (typeof shGrad !== "undefined") window.shGrad = shGrad; } catch(e) {}
try { if (typeof shadowCtx !== "undefined") window.shadowCtx = shadowCtx; } catch(e) {}
try { if (typeof showClouds !== "undefined") window.showClouds = showClouds; } catch(e) {}
try { if (typeof showDebug !== "undefined") window.showDebug = showDebug; } catch(e) {}
try { if (typeof showTutorial !== "undefined") window.showTutorial = showTutorial; } catch(e) {}
try { if (typeof sleepWakeVersion !== "undefined") window.sleepWakeVersion = sleepWakeVersion; } catch(e) {}
try { if (typeof snowFogCtx !== "undefined") window.snowFogCtx = snowFogCtx; } catch(e) {}
try { if (typeof startGameplay !== "undefined") window.startGameplay = startGameplay; } catch(e) {}
try { if (typeof sunDayCtx !== "undefined") window.sunDayCtx = sunDayCtx; } catch(e) {}
try { if (typeof sunSunsetCtx !== "undefined") window.sunSunsetCtx = sunSunsetCtx; } catch(e) {}
try { if (typeof tGrad !== "undefined") window.tGrad = tGrad; } catch(e) {}
try { if (typeof timeOfDay !== "undefined") window.timeOfDay = timeOfDay; } catch(e) {}
try { if (typeof torchGlowCtx !== "undefined") window.torchGlowCtx = torchGlowCtx; } catch(e) {}
try { if (typeof torchLightCtx !== "undefined") window.torchLightCtx = torchLightCtx; } catch(e) {}
try { if (typeof uiVolume !== "undefined") window.uiVolume = uiVolume; } catch(e) {}
try { if (typeof updateCachedVignette !== "undefined") window.updateCachedVignette = updateCachedVignette; } catch(e) {}
try { if (typeof updateGameSimulation !== "undefined") window.updateGameSimulation = updateGameSimulation; } catch(e) {}
try { if (typeof updateSleepStatus !== "undefined") window.updateSleepStatus = updateSleepStatus; } catch(e) {}


// Safe Boot Sequence
export function bootGame() {
    if (typeof document !== 'undefined') {
        tooltipEl = document.getElementById('item-tooltip') || document.getElementById('tooltip');
        initCanvasMouseListeners();
    }
    if (typeof initCanvases === 'function') initCanvases();
    if (typeof loadSavedSettings === 'function') loadSavedSettings();
    if (typeof updateSettingsUI === 'function') updateSettingsUI();
    if (typeof initEmeraldSystem === 'function') initEmeraldSystem();
    if (typeof startIntro === 'function') startIntro();
    if (!isGameLoopRunning) {
        isGameLoopRunning = true;
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(gameLoop);
        } else if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(gameLoop);
        }
    }
}

if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', bootGame);
    } else {
        bootGame();
    }
}
