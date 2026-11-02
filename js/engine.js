// =============================================================================
// WEBCRAFT 2D - UNIFIED ENGINE FACADE (js/engine.js)
// Modularized barrel facade aggregating all subsystems:
// - Core constants, configuration & game state
// - Crafting catalog & crafting manager
// - In-game cosmetics & Atlas trade shop
// - World generation, blocks, fluids, lifecycle & spawner
// - Entities: physics, player, drops, projectiles, falling blocks, animals, mobs, Atlas explorer
// - Rendering: textures, character skins, particles, lighting, atmosphere, minimap & master renderer
// - UI toasts & standard components
// =============================================================================

// Cross-module compatibility shims
export function playSound(type, options) { if (typeof window !== 'undefined' && typeof window.playSound === 'function' && window.playSound !== playSound) return window.playSound(type, options); }
export function giveItem(id, amount = 1) { if (typeof window !== 'undefined' && typeof window.giveItem === 'function' && window.giveItem !== giveItem) return window.giveItem(id, amount); return false; }
export function damageSelectedTool(amount = 1) { if (typeof window !== 'undefined' && typeof window.damageSelectedTool === 'function' && window.damageSelectedTool !== damageSelectedTool) return window.damageSelectedTool(amount); }
export function updateArmorUI() { if (typeof window !== 'undefined' && typeof window.updateArmorUI === 'function' && window.updateArmorUI !== updateArmorUI) return window.updateArmorUI(); }
export function updateHealthUI() { if (typeof window !== 'undefined' && typeof window.updateHealthUI === 'function' && window.updateHealthUI !== updateHealthUI) return window.updateHealthUI(); }
export function updateHungerUI() { if (typeof window !== 'undefined' && typeof window.updateHungerUI === 'function' && window.updateHungerUI !== updateHungerUI) return window.updateHungerUI(); }
export function updateOxygenUI(isSubmerged) { if (typeof window !== 'undefined' && typeof window.updateOxygenUI === 'function' && window.updateOxygenUI !== updateOxygenUI) return window.updateOxygenUI(isSubmerged); }
export function updateUI(refreshCrafting) { if (typeof window !== 'undefined' && typeof window.updateUI === 'function' && window.updateUI !== updateUI) return window.updateUI(refreshCrafting); }
export function updateTutorialUI() {}
export function updateHudArmorBar() { if (typeof window !== 'undefined' && typeof window.updateHudArmorBar === 'function' && window.updateHudArmorBar !== updateHudArmorBar) return window.updateHudArmorBar(); }
export function unlockAchievement(id) { if (typeof window !== 'undefined' && typeof window.unlockAchievement === 'function' && window.unlockAchievement !== unlockAchievement) return window.unlockAchievement(id); }
export function syncBlock(x, y, newId, extraData) { if (typeof window !== 'undefined' && typeof window.syncBlock === 'function' && window.syncBlock !== syncBlock) return window.syncBlock(x, y, newId, extraData); }
export function syncFluidState() { if (typeof window !== 'undefined' && typeof window.syncFluidState === 'function' && window.syncFluidState !== syncFluidState) return window.syncFluidState(); }
export function syncLocalPlayerState(immediate) { if (typeof window !== 'undefined' && typeof window.syncLocalPlayerState === 'function' && window.syncLocalPlayerState !== syncLocalPlayerState) return window.syncLocalPlayerState(immediate); }
export function deleteWorld(id, prompt) { if (typeof window !== 'undefined' && typeof window.deleteWorld === 'function' && window.deleteWorld !== deleteWorld) return window.deleteWorld(id, prompt); }
export function setupDeathScreen() { if (typeof window !== 'undefined' && typeof window.setupDeathScreen === 'function') return window.setupDeathScreen(); }
export function toggleBackgroundBuildMode(mode) { if (typeof window !== 'undefined' && typeof window.toggleBackgroundBuildMode === 'function' && window.toggleBackgroundBuildMode !== toggleBackgroundBuildMode) return window.toggleBackgroundBuildMode(mode); }

// =============================================================================
// DOMAIN SUBSYSTEM RE-EXPORTS
// =============================================================================

// Core Subsystems
export * from './core/constants.js';
export * from './core/config.js';
export * from './core/state.js';

// Crafting Subsystems
export * from './crafting/recipes.js';
export * from './crafting/craftingmanager.js';

// Shop Subsystem
export * from './shop/shopmanager.js';

// World Subsystems
export * from './world/blockhelper.js';
export * from './world/fluids.js';
export * from './world/worldgen.js';
export * from './world/lifecycle.js';
export * from './world/spawner.js';

// Entities Subsystems
export * from './entities/physicsentity.js';
export * from './entities/itemdrop.js';
export * from './entities/projectile.js';
export * from './entities/fallingblock.js';
export * from './entities/player.js';
export * from './entities/animals.js';
export * from './entities/mobs.js';
export * from './entities/atlasexplorer.js';

// Rendering Subsystems
export * from './rendering/textures.js';
export * from './rendering/character.js';
export * from './rendering/particles.js';
export * from './rendering/lighting.js';
export * from './rendering/atmosphere.js';
export * from './rendering/map.js';
export * from './rendering/renderer.js';

// UI Subsystems
export * from './ui/toasts.js';
export * from './ui/standardcomponents.js';
export * from './ui/worldthumbnails.js';


// Global Window Bridge for cross-module & HTML event compatibility
try { if (typeof ARMOR_DEFENSE !== "undefined") window.ARMOR_DEFENSE = ARMOR_DEFENSE; } catch(e) {}
try { if (typeof ARMOR_DURABILITY !== "undefined") window.ARMOR_DURABILITY = ARMOR_DURABILITY; } catch(e) {}
try { if (typeof ARMOR_SLOT_TYPE !== "undefined") window.ARMOR_SLOT_TYPE = ARMOR_SLOT_TYPE; } catch(e) {}
try { if (typeof Animal !== "undefined") window.Animal = Animal; } catch(e) {}
try { if (typeof BACKGROUND_BUILDING_BLOCKS !== "undefined") window.BACKGROUND_BUILDING_BLOCKS = BACKGROUND_BUILDING_BLOCKS; } catch(e) {}
try { if (typeof Chicken !== "undefined") window.Chicken = Chicken; } catch(e) {}
try { if (typeof Cloud !== "undefined") window.Cloud = Cloud; } catch(e) {}
try { if (typeof Cow !== "undefined") window.Cow = Cow; } catch(e) {}
try { if (typeof Creeper !== "undefined") window.Creeper = Creeper; } catch(e) {}
try { if (typeof DAYLIGHT_BOTTOM !== "undefined") window.DAYLIGHT_BOTTOM = DAYLIGHT_BOTTOM; } catch(e) {}
try { if (typeof DAYLIGHT_TOP !== "undefined") window.DAYLIGHT_TOP = DAYLIGHT_TOP; } catch(e) {}
try { if (typeof DIFFICULTIES !== "undefined") window.DIFFICULTIES = DIFFICULTIES; } catch(e) {}
try { if (typeof FPS_CAP_OPTIONS !== "undefined") window.FPS_CAP_OPTIONS = FPS_CAP_OPTIONS; } catch(e) {}
try { if (typeof FallingBlock !== "undefined") window.FallingBlock = FallingBlock; } catch(e) {}
try { if (typeof FloatingText !== "undefined") window.FloatingText = FloatingText; } catch(e) {}
try { if (typeof HARDNESS !== "undefined") window.HARDNESS = HARDNESS; } catch(e) {}
try { if (typeof IDS !== "undefined") window.IDS = IDS; } catch(e) {}
try { if (typeof ID_NAMES !== "undefined") window.ID_NAMES = ID_NAMES; } catch(e) {}
try { if (typeof ItemDrop !== "undefined") window.ItemDrop = ItemDrop; } catch(e) {}
try { if (typeof LATEST_PATCH_NOTES !== "undefined") window.LATEST_PATCH_NOTES = LATEST_PATCH_NOTES; } catch(e) {}
try { if (typeof LEAF_COLORS !== "undefined") window.LEAF_COLORS = LEAF_COLORS; } catch(e) {}
try { if (typeof MAX_FABULOUS_PARTICLES !== "undefined") window.MAX_FABULOUS_PARTICLES = MAX_FABULOUS_PARTICLES; } catch(e) {}
try { if (typeof MAX_PARTICLES !== "undefined") window.MAX_PARTICLES = MAX_PARTICLES; } catch(e) {}
try { if (typeof MINIMAP_COLOR_32 !== "undefined") window.MINIMAP_COLOR_32 = MINIMAP_COLOR_32; } catch(e) {}
try { if (typeof MINING_TOOL_TIERS !== "undefined") window.MINING_TOOL_TIERS = MINING_TOOL_TIERS; } catch(e) {}
try { if (typeof NIGHT_BOTTOM !== "undefined") window.NIGHT_BOTTOM = NIGHT_BOTTOM; } catch(e) {}
try { if (typeof NIGHT_TOP !== "undefined") window.NIGHT_TOP = NIGHT_TOP; } catch(e) {}
try { if (typeof PHYSICS_TICK_MS !== "undefined") window.PHYSICS_TICK_MS = PHYSICS_TICK_MS; } catch(e) {}
try { if (typeof PHYSICS_TICK_RATE !== "undefined") window.PHYSICS_TICK_RATE = PHYSICS_TICK_RATE; } catch(e) {}
try { if (typeof Particle !== "undefined") window.Particle = Particle; } catch(e) {}
try { if (typeof PhysicsEntity !== "undefined") window.PhysicsEntity = PhysicsEntity; } catch(e) {}
try { if (typeof Pig !== "undefined") window.Pig = Pig; } catch(e) {}
try { if (typeof Pigeon !== "undefined") window.Pigeon = Pigeon; } catch(e) {}
try { if (typeof Cat !== "undefined") window.Cat = Cat; } catch(e) {}
try { if (typeof Player !== "undefined") window.Player = Player; } catch(e) {}
try { if (typeof SKIN_W !== "undefined") window.SKIN_W = SKIN_W; } catch(e) {}
try { if (typeof SKY_STARS !== "undefined") window.SKY_STARS = SKY_STARS; } catch(e) {}
try { if (typeof SKY_STARS_BUCKETS !== "undefined") window.SKY_STARS_BUCKETS = SKY_STARS_BUCKETS; } catch(e) {}
try { if (typeof SKY_STAR_BRIGHTNESSES !== "undefined") window.SKY_STAR_BRIGHTNESSES = SKY_STAR_BRIGHTNESSES; } catch(e) {}
try { if (typeof Scorpion !== "undefined") window.Scorpion = Scorpion; } catch(e) {}
try { if (typeof Gloomstalker !== "undefined") window.Gloomstalker = Gloomstalker; } catch(e) {}
try { if (typeof GloomTetherProjectile !== "undefined") window.GloomTetherProjectile = GloomTetherProjectile; } catch(e) {}
try { if (typeof gloomDreadTimer !== "undefined") window.gloomDreadTimer = gloomDreadTimer; } catch(e) {}
try { if (typeof setEngineGloomDreadTimer !== "undefined") window.setEngineGloomDreadTimer = setEngineGloomDreadTimer; } catch(e) {}
try { if (typeof Sheep !== "undefined") window.Sheep = Sheep; } catch(e) {}
try { if (typeof SnowballProjectile !== "undefined") window.SnowballProjectile = SnowballProjectile; } catch(e) {}
try { if (typeof TOOL_DURABILITY !== "undefined") window.TOOL_DURABILITY = TOOL_DURABILITY; } catch(e) {}
try { if (typeof TWILIGHT_BOTTOM !== "undefined") window.TWILIGHT_BOTTOM = TWILIGHT_BOTTOM; } catch(e) {}
try { if (typeof TWILIGHT_TOP !== "undefined") window.TWILIGHT_TOP = TWILIGHT_TOP; } catch(e) {}
try { if (typeof UPDATE_HISTORY_LOGS !== "undefined") window.UPDATE_HISTORY_LOGS = UPDATE_HISTORY_LOGS; } catch(e) {}
try { if (typeof Zombie !== "undefined") window.Zombie = Zombie; } catch(e) {}
try { if (typeof activeProjectiles !== "undefined") window.activeProjectiles = activeProjectiles; } catch(e) {}
try { if (typeof activeSkinId !== "undefined") window.activeSkinId = activeSkinId; } catch(e) {}
try { if (typeof applyChestState !== "undefined") window.applyChestState = applyChestState; } catch(e) {}
try { if (typeof attackAnimationTimer !== "undefined") window.attackAnimationTimer = attackAnimationTimer; } catch(e) {}
try { if (typeof bgBuildDarknessAlpha !== "undefined") window.bgBuildDarknessAlpha = bgBuildDarknessAlpha; } catch(e) {}
try { if (typeof bgWorld !== "undefined") window.bgWorld = bgWorld; } catch(e) {}
try { if (typeof blendColor !== "undefined") window.blendColor = blendColor; } catch(e) {}
try { if (typeof buildFullOffscreenMap !== "undefined") window.buildFullOffscreenMap = buildFullOffscreenMap; } catch(e) {}
try { if (typeof cachedActiveBiome !== "undefined") window.cachedActiveBiome = cachedActiveBiome; } catch(e) {}
try { if (typeof cachedBiomeGridX !== "undefined") window.cachedBiomeGridX = cachedBiomeGridX; } catch(e) {}
try { if (typeof cachedIsSnowy !== "undefined") window.cachedIsSnowy = cachedIsSnowy; } catch(e) {}
try { if (typeof camera !== "undefined") window.camera = camera; } catch(e) {}
try { if (typeof canHarvestBlock !== "undefined") window.canHarvestBlock = canHarvestBlock; } catch(e) {}
try { if (typeof canSaplingGrowAt !== "undefined") window.canSaplingGrowAt = canSaplingGrowAt; } catch(e) {}
try { if (typeof caveSkyOpacity !== "undefined") window.caveSkyOpacity = caveSkyOpacity; } catch(e) {}
try { if (typeof checkCactusContact !== "undefined") window.checkCactusContact = checkCactusContact; } catch(e) {}
try { if (typeof checkSandFallAbove !== "undefined") window.checkSandFallAbove = checkSandFallAbove; } catch(e) {}
try { if (typeof chests !== "undefined") window.chests = chests; } catch(e) {}
try { if (typeof clouds !== "undefined") window.clouds = clouds; } catch(e) {}
try { if (typeof currentBiomeHue !== "undefined") window.currentBiomeHue = currentBiomeHue; } catch(e) {}
try { if (typeof currentFogDensity !== "undefined") window.currentFogDensity = currentFogDensity; } catch(e) {}
try { if (typeof currentFps !== "undefined") window.currentFps = currentFps; } catch(e) {}
try { if (typeof diffDescriptions !== "undefined") window.diffDescriptions = diffDescriptions; } catch(e) {}
try { if (typeof dirtToGrassQueue !== "undefined") window.dirtToGrassQueue = dirtToGrassQueue; } catch(e) {}
try { if (typeof drawBiomeGrading !== "undefined") window.drawBiomeGrading = drawBiomeGrading; } catch(e) {}
try { if (typeof drawUnderwaterScreenEffect !== "undefined") window.drawUnderwaterScreenEffect = drawUnderwaterScreenEffect; } catch(e) {}
try { if (typeof underwaterScreenAlpha !== "undefined") window.underwaterScreenAlpha = underwaterScreenAlpha; } catch(e) {}
try { if (typeof underwaterDeepFactor !== "undefined") window.underwaterDeepFactor = underwaterDeepFactor; } catch(e) {}
try { if (typeof drawCharacter !== "undefined") window.drawCharacter = drawCharacter; } catch(e) {}
try { if (typeof drawFrontCharacter !== "undefined") window.drawFrontCharacter = drawFrontCharacter; } catch(e) {}
try { if (typeof drawPlayerHead !== "undefined") window.drawPlayerHead = drawPlayerHead; } catch(e) {}
try { if (typeof drawCharacterArm !== "undefined") window.drawCharacterArm = drawCharacterArm; } catch(e) {}
try { if (typeof drawCharacterHead !== "undefined") window.drawCharacterHead = drawCharacterHead; } catch(e) {}
try { if (typeof drawCharacterLeg !== "undefined") window.drawCharacterLeg = drawCharacterLeg; } catch(e) {}
try { if (typeof drawCharacterTorso !== "undefined") window.drawCharacterTorso = drawCharacterTorso; } catch(e) {}
try { if (typeof drawDesertHeatShimmer !== "undefined") window.drawDesertHeatShimmer = drawDesertHeatShimmer; } catch(e) {}
try { if (typeof drawForestGodRays !== "undefined") window.drawForestGodRays = drawForestGodRays; } catch(e) {}
try { if (typeof drawPlainsWindBreeze !== "undefined") window.drawPlainsWindBreeze = drawPlainsWindBreeze; } catch(e) {}
try { if (typeof drawDynamicSky !== "undefined") window.drawDynamicSky = drawDynamicSky; } catch(e) {}
try { if (typeof drawMenuBackground !== "undefined") window.drawMenuBackground = drawMenuBackground; } catch(e) {}
try { if (typeof drawMinimap !== "undefined") window.drawMinimap = drawMinimap; } catch(e) {}
try { if (typeof drawMountains !== "undefined") window.drawMountains = drawMountains; } catch(e) {}
try { if (typeof drawPixelAurora !== "undefined") window.drawPixelAurora = drawPixelAurora; } catch(e) {}
try { if (typeof drawPlayerPreview !== "undefined") window.drawPlayerPreview = drawPlayerPreview; } catch(e) {}
try { if (typeof drawSnowFog !== "undefined") window.drawSnowFog = drawSnowFog; } catch(e) {}
try { if (typeof drawTimeClock !== "undefined") window.drawTimeClock = drawTimeClock; } catch(e) {}
try { if (typeof drawVignette !== "undefined") window.drawVignette = drawVignette; } catch(e) {}
try { if (typeof drawWorld !== "undefined") window.drawWorld = drawWorld; } catch(e) {}
try { if (typeof droppedItems !== "undefined") window.droppedItems = droppedItems; } catch(e) {}
try { if (typeof editingSkinId !== "undefined") window.editingSkinId = editingSkinId; } catch(e) {}
try { if (typeof ensureArmorDurability !== "undefined") window.ensureArmorDurability = ensureArmorDurability; } catch(e) {}
try { if (typeof ensureDesertScorpions !== "undefined") window.ensureDesertScorpions = ensureDesertScorpions; } catch(e) {}
try { if (typeof ensureTreeWoodNonCollidable !== "undefined") window.ensureTreeWoodNonCollidable = ensureTreeWoodNonCollidable; } catch(e) {}
try { if (typeof entities !== "undefined") window.entities = entities; } catch(e) {}
try { if (typeof equippedArmor !== "undefined") window.equippedArmor = equippedArmor; } catch(e) {}
try { if (typeof fabulousAmbientParticles !== "undefined") window.fabulousAmbientParticles = fabulousAmbientParticles; } catch(e) {}
try { if (typeof fallingBlocks !== "undefined") window.fallingBlocks = fallingBlocks; } catch(e) {}
try { if (typeof floatingTexts !== "undefined") window.floatingTexts = floatingTexts; } catch(e) {}
try { if (typeof fluidTick !== "undefined") window.fluidTick = fluidTick; } catch(e) {}
try { if (typeof fluidWakeQueue !== "undefined") window.fluidWakeQueue = fluidWakeQueue; } catch(e) {}
try { if (typeof fluids !== "undefined") window.fluids = fluids; } catch(e) {}
try { if (typeof fpsCap !== "undefined") window.fpsCap = fpsCap; } catch(e) {}
try { if (typeof frameDeltaMs !== "undefined") window.frameDeltaMs = frameDeltaMs; } catch(e) {}
try { if (typeof furnaces !== "undefined") window.furnaces = furnaces; } catch(e) {}
try { if (typeof generateMenuWorld !== "undefined") window.generateMenuWorld = generateMenuWorld; } catch(e) {}
try { if (typeof generateTexture !== "undefined") window.generateTexture = generateTexture; } catch(e) {}
try { if (typeof generateWorld !== "undefined") window.generateWorld = generateWorld; } catch(e) {}
try { if (typeof getActiveBiomeAt !== "undefined") window.getActiveBiomeAt = getActiveBiomeAt; } catch(e) {}
try { if (typeof getArmorDamageReductionRatio !== "undefined") window.getArmorDamageReductionRatio = getArmorDamageReductionRatio; } catch(e) {}
try { if (typeof getArmorPalette !== "undefined") window.getArmorPalette = getArmorPalette; } catch(e) {}
try { if (typeof getArmorSlotIndex !== "undefined") window.getArmorSlotIndex = getArmorSlotIndex; } catch(e) {}
try { if (typeof getBedLength !== "undefined") window.getBedLength = getBedLength; } catch(e) {}
try { if (typeof getBedPairStart !== "undefined") window.getBedPairStart = getBedPairStart; } catch(e) {}
try { if (typeof getBlockColor !== "undefined") window.getBlockColor = getBlockColor; } catch(e) {}
try { if (typeof getChestGroup !== "undefined") window.getChestGroup = getChestGroup; } catch(e) {}
try { if (typeof getChestKey !== "undefined") window.getChestKey = getChestKey; } catch(e) {}
try { if (typeof getDayDifficultyMultiplier !== "undefined") window.getDayDifficultyMultiplier = getDayDifficultyMultiplier; } catch(e) {}
try { if (typeof getDayHungerDrainMultiplier !== "undefined") window.getDayHungerDrainMultiplier = getDayHungerDrainMultiplier; } catch(e) {}
try { if (typeof getDoorBaseY !== "undefined") window.getDoorBaseY = getDoorBaseY; } catch(e) {}
try { if (typeof getFluid !== "undefined") window.getFluid = getFluid; } catch(e) {}
try { if (typeof getFluidKey !== "undefined") window.getFluidKey = getFluidKey; } catch(e) {}
try { if (typeof getFootstepMaterial !== "undefined") window.getFootstepMaterial = getFootstepMaterial; } catch(e) {}
try { if (typeof getFpsCapText !== "undefined") window.getFpsCapText = getFpsCapText; } catch(e) {}
try { if (typeof getInitialSpawnPoint !== "undefined") window.getInitialSpawnPoint = getInitialSpawnPoint; } catch(e) {}
try { if (typeof getMapBlockColor !== "undefined") window.getMapBlockColor = getMapBlockColor; } catch(e) {}
try { if (typeof getMobTarget !== "undefined") window.getMobTarget = getMobTarget; } catch(e) {}
try { if (typeof getPlayerCaveSkyOpacity !== "undefined") window.getPlayerCaveSkyOpacity = getPlayerCaveSkyOpacity; } catch(e) {}
try { if (typeof getRequiredMiningTier !== "undefined") window.getRequiredMiningTier = getRequiredMiningTier; } catch(e) {}
try { if (typeof getSaplingGrowthHeight !== "undefined") window.getSaplingGrowthHeight = getSaplingGrowthHeight; } catch(e) {}
try { if (typeof getSelectedMiningTier !== "undefined") window.getSelectedMiningTier = getSelectedMiningTier; } catch(e) {}
try { if (typeof getSkinSaveData !== "undefined") window.getSkinSaveData = getSkinSaveData; } catch(e) {}
try { if (typeof getSnowBiomeRatio !== "undefined") window.getSnowBiomeRatio = getSnowBiomeRatio; } catch(e) {}
try { if (typeof getTotalArmorDefense !== "undefined") window.getTotalArmorDefense = getTotalArmorDefense; } catch(e) {}
try { if (typeof getWorldSurfaceY !== "undefined") window.getWorldSurfaceY = getWorldSurfaceY; } catch(e) {}
try { if (typeof getZombieTarget !== "undefined") window.getZombieTarget = getZombieTarget; } catch(e) {}
try { if (typeof growSaplingAt !== "undefined") window.growSaplingAt = growSaplingAt; } catch(e) {}
try { if (typeof hasDirectSkyAccess !== "undefined") window.hasDirectSkyAccess = hasDirectSkyAccess; } catch(e) {}
try { if (typeof heldItemDraggedOutside !== "undefined") window.heldItemDraggedOutside = heldItemDraggedOutside; } catch(e) {}
try { if (typeof heldItemIndex !== "undefined") window.heldItemIndex = heldItemIndex; } catch(e) {}
try { if (typeof heldItemObj !== "undefined") window.heldItemObj = heldItemObj; } catch(e) {}
try { if (typeof hotbarPopupTimeout !== "undefined") window.hotbarPopupTimeout = hotbarPopupTimeout; } catch(e) {}
try { if (typeof hotbarWheelLockUntil !== "undefined") window.hotbarWheelLockUntil = hotbarWheelLockUntil; } catch(e) {}
try { if (typeof initFabulousParticles !== "undefined") window.initFabulousParticles = initFabulousParticles; } catch(e) {}
try { if (typeof isArmor !== "undefined") window.isArmor = isArmor; } catch(e) {}
try { if (typeof isPickaxe !== "undefined") window.isPickaxe = isPickaxe; } catch(e) {}
try { if (typeof isAxe !== "undefined") window.isAxe = isAxe; } catch(e) {}
try { if (typeof isShovel !== "undefined") window.isShovel = isShovel; } catch(e) {}
try { if (typeof isSword !== "undefined") window.isSword = isSword; } catch(e) {}
try { if (typeof isHoe !== "undefined") window.isHoe = isHoe; } catch(e) {}
try { if (typeof isShears !== "undefined") window.isShears = isShears; } catch(e) {}
try { if (typeof isPickaxeBlock !== "undefined") window.isPickaxeBlock = isPickaxeBlock; } catch(e) {}
try { if (typeof isAxeBlock !== "undefined") window.isAxeBlock = isAxeBlock; } catch(e) {}
try { if (typeof isShovelBlock !== "undefined") window.isShovelBlock = isShovelBlock; } catch(e) {}
try { if (typeof isShearsBlock !== "undefined") window.isShearsBlock = isShearsBlock; } catch(e) {}
try { if (typeof isBackgroundBuildMode !== "undefined") window.isBackgroundBuildMode = isBackgroundBuildMode; } catch(e) {}
try { if (typeof isBackgroundBuildingBlock !== "undefined") window.isBackgroundBuildingBlock = isBackgroundBuildingBlock; } catch(e) {}
try { if (typeof isBedRenderStart !== "undefined") window.isBedRenderStart = isBedRenderStart; } catch(e) {}
try { if (typeof isDoorBlock !== "undefined") window.isDoorBlock = isDoorBlock; } catch(e) {}
try { if (typeof isFoodItem !== "undefined") window.isFoodItem = isFoodItem; } catch(e) {}
try { if (typeof isInventoryOpen !== "undefined") window.isInventoryOpen = isInventoryOpen; } catch(e) {}
try { if (typeof isLava !== "undefined") window.isLava = isLava; } catch(e) {}
try { if (typeof isLeafConnectedToWood !== "undefined") window.isLeafConnectedToWood = isLeafConnectedToWood; } catch(e) {}
try { if (typeof isMapDragging !== "undefined") window.isMapDragging = isMapDragging; } catch(e) {}
try { if (typeof isNearTorch !== "undefined") window.isNearTorch = isNearTorch; } catch(e) {}
try { if (typeof isOffscreenMapDirty !== "undefined") window.isOffscreenMapDirty = isOffscreenMapDirty; } catch(e) {}
try { if (typeof isOpenDoorBlock !== "undefined") window.isOpenDoorBlock = isOpenDoorBlock; } catch(e) {}
try { if (typeof isPreviewWalking !== "undefined") window.isPreviewWalking = isPreviewWalking; } catch(e) {}
try { if (typeof isNonSurfaceBlock !== "undefined") window.isNonSurfaceBlock = isNonSurfaceBlock; } catch(e) {}
try { if (typeof isSolidWorldBlock !== "undefined") window.isSolidWorldBlock = isSolidWorldBlock; } catch(e) {}
try { if (typeof isWater !== "undefined") window.isWater = isWater; } catch(e) {}
try { if (typeof isWoodPartOfTree !== "undefined") window.isWoodPartOfTree = isWoodPartOfTree; } catch(e) {}
try { if (typeof isWorldMapOpen !== "undefined") window.isWorldMapOpen = isWorldMapOpen; } catch(e) {}
try { if (typeof jukeboxes !== "undefined") window.jukeboxes = jukeboxes; } catch(e) {}
try { if (typeof keepInventory !== "undefined") window.keepInventory = keepInventory; } catch(e) {}
try { if (typeof keys !== "undefined") window.keys = keys; } catch(e) {}
try { if (typeof largeChestCtx !== "undefined") window.largeChestCtx = largeChestCtx; } catch(e) {}
try { if (typeof largeChestImage !== "undefined") window.largeChestImage = largeChestImage; } catch(e) {}
try { if (typeof largeChestTexture !== "undefined") window.largeChestTexture = largeChestTexture; } catch(e) {}
try { if (typeof lastFrameTime !== "undefined") window.lastFrameTime = lastFrameTime; } catch(e) {}
try { if (typeof lastHotbarItemId !== "undefined") window.lastHotbarItemId = lastHotbarItemId; } catch(e) {}
try { if (typeof lastPlayerActivityAt !== "undefined") window.lastPlayerActivityAt = lastPlayerActivityAt; } catch(e) {}
try { if (typeof lastRenderTime !== "undefined") window.lastRenderTime = lastRenderTime; } catch(e) {}
try { if (typeof leafDecayQueue !== "undefined") window.leafDecayQueue = leafDecayQueue; } catch(e) {}
try { if (typeof treeDecayClusters !== "undefined") window.treeDecayClusters = treeDecayClusters; } catch(e) {}
try { if (typeof getKaelSkinCanvas !== "undefined") window.getKaelSkinCanvas = getKaelSkinCanvas; } catch(e) {}
try { if (typeof mapAnimFrameId !== "undefined") window.mapAnimFrameId = mapAnimFrameId; } catch(e) {}
try { if (typeof mapDragOriginPanX !== "undefined") window.mapDragOriginPanX = mapDragOriginPanX; } catch(e) {}
try { if (typeof mapDragOriginPanY !== "undefined") window.mapDragOriginPanY = mapDragOriginPanY; } catch(e) {}
try { if (typeof mapDragStartX !== "undefined") window.mapDragStartX = mapDragStartX; } catch(e) {}
try { if (typeof mapDragStartY !== "undefined") window.mapDragStartY = mapDragStartY; } catch(e) {}
try { if (typeof mapEventsInitialized !== "undefined") window.mapEventsInitialized = mapEventsInitialized; } catch(e) {}
try { if (typeof mapHoverTileX !== "undefined") window.mapHoverTileX = mapHoverTileX; } catch(e) {}
try { if (typeof mapHoverTileY !== "undefined") window.mapHoverTileY = mapHoverTileY; } catch(e) {}
try { if (typeof mapPanX !== "undefined") window.mapPanX = mapPanX; } catch(e) {}
try { if (typeof mapPanY !== "undefined") window.mapPanY = mapPanY; } catch(e) {}
try { if (typeof mapSeed !== "undefined") window.mapSeed = mapSeed; } catch(e) {}
try { if (typeof mapZoom !== "undefined") window.mapZoom = mapZoom; } catch(e) {}
try { if (typeof menuCamX !== "undefined") window.menuCamX = menuCamX; } catch(e) {}
try { if (typeof menuEntities !== "undefined") window.menuEntities = menuEntities; } catch(e) {}
try { if (typeof menuLastFrame !== "undefined") window.menuLastFrame = menuLastFrame; } catch(e) {}
try { if (typeof menuParallaxX !== "undefined") window.menuParallaxX = menuParallaxX; } catch(e) {}
try { if (typeof menuParallaxY !== "undefined") window.menuParallaxY = menuParallaxY; } catch(e) {}
try { if (typeof menuRandom !== "undefined") window.menuRandom = menuRandom; } catch(e) {}
try { if (typeof menuTime !== "undefined") window.menuTime = menuTime; } catch(e) {}
try { if (typeof menuWorld !== "undefined") window.menuWorld = menuWorld; } catch(e) {}
try { if (typeof menuWorldInitialized !== "undefined") window.menuWorldInitialized = menuWorldInitialized; } catch(e) {}
try { if (typeof menuWorldSeed !== "undefined") window.menuWorldSeed = menuWorldSeed; } catch(e) {}
try { if (typeof minimapBuf32 !== "undefined") window.minimapBuf32 = minimapBuf32; } catch(e) {}
try { if (typeof minimapImageData !== "undefined") window.minimapImageData = minimapImageData; } catch(e) {}
try { if (typeof minimapOffscreenCanvas !== "undefined") window.minimapOffscreenCanvas = minimapOffscreenCanvas; } catch(e) {}
try { if (typeof minimapOffscreenCtx !== "undefined") window.minimapOffscreenCtx = minimapOffscreenCtx; } catch(e) {}
try { if (typeof miningTarget !== "undefined") window.miningTarget = miningTarget; } catch(e) {}
try { if (typeof BLOCK_CRACK_STAGES !== "undefined") window.BLOCK_CRACK_STAGES = BLOCK_CRACK_STAGES; } catch(e) {}
try { if (typeof BLOCK_CRACK_SEGMENTS !== "undefined") window.BLOCK_CRACK_SEGMENTS = BLOCK_CRACK_SEGMENTS; } catch(e) {}
try { if (typeof mouse !== "undefined") window.mouse = mouse; } catch(e) {}
try { if (typeof nonCollidableTreeWood !== "undefined") window.nonCollidableTreeWood = nonCollidableTreeWood; } catch(e) {}
try { if (typeof notifyBlockedSaplings !== "undefined") window.notifyBlockedSaplings = notifyBlockedSaplings; } catch(e) {}
try { if (typeof offscreenMapCanvas !== "undefined") window.offscreenMapCanvas = offscreenMapCanvas; } catch(e) {}
try { if (typeof offscreenMapCtx !== "undefined") window.offscreenMapCtx = offscreenMapCtx; } catch(e) {}
try { if (typeof openedChest !== "undefined") window.openedChest = openedChest; } catch(e) {}
try { if (typeof openedFurnace !== "undefined") window.openedFurnace = openedFurnace; } catch(e) {}
try { if (typeof particles !== "undefined") window.particles = particles; } catch(e) {}
try { if (typeof noteParticles !== "undefined") window.noteParticles = noteParticles; } catch(e) {}
try { if (typeof spawnNoteParticle !== "undefined") window.spawnNoteParticle = spawnNoteParticle; } catch(e) {}
try { if (typeof NoteParticle !== "undefined") window.NoteParticle = NoteParticle; } catch(e) {}
try { if (typeof physicsAccumulator !== "undefined") window.physicsAccumulator = physicsAccumulator; } catch(e) {}
try { if (typeof player !== "undefined") window.player = player; } catch(e) {}
try { if (typeof playerSkinData !== "undefined") window.playerSkinData = playerSkinData; } catch(e) {}
try { if (typeof previewWalkAnimId !== "undefined") window.previewWalkAnimId = previewWalkAnimId; } catch(e) {}
try { if (typeof previewWalkAnimation !== "undefined") window.previewWalkAnimation = previewWalkAnimation; } catch(e) {}
try { if (typeof previewWalkUntil !== "undefined") window.previewWalkUntil = previewWalkUntil; } catch(e) {}
try { if (typeof processDroppedItems !== "undefined") window.processDroppedItems = processDroppedItems; } catch(e) {}
try { if (typeof removeFluid !== "undefined") window.removeFluid = removeFluid; } catch(e) {}
try { if (typeof renderStaticPlayerPreview !== "undefined") window.renderStaticPlayerPreview = renderStaticPlayerPreview; } catch(e) {}
try { if (typeof renderWorldMapFrame !== "undefined") window.renderWorldMapFrame = renderWorldMapFrame; } catch(e) {}
try { if (typeof renderWorldMapLoop !== "undefined") window.renderWorldMapLoop = renderWorldMapLoop; } catch(e) {}
try { if (typeof saplingBlockedWarnings !== "undefined") window.saplingBlockedWarnings = saplingBlockedWarnings; } catch(e) {}
try { if (typeof saplingGrowthQueue !== "undefined") window.saplingGrowthQueue = saplingGrowthQueue; } catch(e) {}
try { if (typeof scheduleDirtToGrass !== "undefined") window.scheduleDirtToGrass = scheduleDirtToGrass; } catch(e) {}
try { if (typeof scheduleSnowRegrowth !== "undefined") window.scheduleSnowRegrowth = scheduleSnowRegrowth; } catch(e) {}
try { if (typeof scheduleTreeLeafDecay !== "undefined") window.scheduleTreeLeafDecay = scheduleTreeLeafDecay; } catch(e) {}
try { if (typeof seededRandom !== "undefined") window.seededRandom = seededRandom; } catch(e) {}
try { if (typeof setFluid !== "undefined") window.setFluid = setFluid; } catch(e) {}
try { if (typeof setEngineAccentColor !== "undefined") window.setEngineAccentColor = setEngineAccentColor; } catch(e) {}
try { if (typeof skinCanvasObj !== "undefined") window.skinCanvasObj = skinCanvasObj; } catch(e) {}
try { if (typeof setStaticPreviewDrawn !== "undefined") window.setStaticPreviewDrawn = setStaticPreviewDrawn; } catch(e) {}
try { if (typeof skyBottomColor !== "undefined") window.skyBottomColor = skyBottomColor; } catch(e) {}
try { if (typeof skyTopColor !== "undefined") window.skyTopColor = skyTopColor; } catch(e) {}
try { if (typeof sleepStartTime !== "undefined") window.sleepStartTime = sleepStartTime; } catch(e) {}
try { if (typeof sleepTransitionMs !== "undefined") window.sleepTransitionMs = sleepTransitionMs; } catch(e) {}
try { if (typeof smoothStep !== "undefined") window.smoothStep = smoothStep; } catch(e) {}
try { if (typeof snowRegrowthQueue !== "undefined") window.snowRegrowthQueue = snowRegrowthQueue; } catch(e) {}
try { if (typeof spawnAnimals !== "undefined") window.spawnAnimals = spawnAnimals; } catch(e) {}
try { if (typeof spawnMobs !== "undefined") window.spawnMobs = spawnMobs; } catch(e) {}
try { if (typeof spawnParticle !== "undefined") window.spawnParticle = spawnParticle; } catch(e) {}
try { if (typeof startPlayerPreviewWalk !== "undefined") window.startPlayerPreviewWalk = startPlayerPreviewWalk; } catch(e) {}
try { if (typeof staticPreviewDrawn !== "undefined") window.staticPreviewDrawn = staticPreviewDrawn; } catch(e) {}
try { if (typeof surfaceHeights !== "undefined") window.surfaceHeights = surfaceHeights; } catch(e) {}
try { if (typeof syncChest !== "undefined") window.syncChest = syncChest; } catch(e) {}
try { if (typeof textures !== "undefined") window.textures = textures; } catch(e) {}
try { if (typeof tooltipEl !== "undefined") window.tooltipEl = tooltipEl; } catch(e) {}
try { if (typeof triggerSandFall !== "undefined") window.triggerSandFall = triggerSandFall; } catch(e) {}
try { if (typeof triggerSteamEffect !== "undefined") window.triggerSteamEffect = triggerSteamEffect; } catch(e) {}
try { if (typeof updateAndDrawFabulousParticles !== "undefined") window.updateAndDrawFabulousParticles = updateAndDrawFabulousParticles; } catch(e) {}
try { if (typeof updateBiomeAtmosphere !== "undefined") window.updateBiomeAtmosphere = updateBiomeAtmosphere; } catch(e) {}
try { if (typeof updateCamera !== "undefined") window.updateCamera = updateCamera; } catch(e) {}
try { if (typeof updateFluids !== "undefined") window.updateFluids = updateFluids; } catch(e) {}
try { if (typeof wakeAllFluids !== "undefined") window.wakeAllFluids = wakeAllFluids; } catch(e) {}
try { if (typeof initAnimatedFluidTextures !== "undefined") window.initAnimatedFluidTextures = initAnimatedFluidTextures; } catch(e) {}
try { if (typeof waterStillFrames !== "undefined") window.waterStillFrames = waterStillFrames; } catch(e) {}
try { if (typeof waterFlowFrames !== "undefined") window.waterFlowFrames = waterFlowFrames; } catch(e) {}
try { if (typeof lavaStillFrames !== "undefined") window.lavaStillFrames = lavaStillFrames; } catch(e) {}
try { if (typeof lavaFlowFrames !== "undefined") window.lavaFlowFrames = lavaFlowFrames; } catch(e) {}
try { if (typeof updateNaturalRegrowth !== "undefined") window.updateNaturalRegrowth = updateNaturalRegrowth; } catch(e) {}
try { if (typeof updateSaplingGrowth !== "undefined") window.updateSaplingGrowth = updateSaplingGrowth; } catch(e) {}
try { if (typeof updateTimeUI !== "undefined") window.updateTimeUI = updateTimeUI; } catch(e) {}
try { if (typeof updateTreeLeafDecay !== "undefined") window.updateTreeLeafDecay = updateTreeLeafDecay; } catch(e) {}
    try { if (typeof setEngineSleepStartTime !== "undefined") window.setEngineSleepStartTime = setEngineSleepStartTime; } catch(e) {}
try { if (typeof setEngineWorldBiomes !== "undefined") window.setEngineWorldBiomes = setEngineWorldBiomes; } catch(e) {}
try { if (typeof setEngineCropGrowthQueue !== "undefined") window.setEngineCropGrowthQueue = setEngineCropGrowthQueue; } catch(e) {}
try { if (typeof setEngineSaplingGrowthQueue !== "undefined") window.setEngineSaplingGrowthQueue = setEngineSaplingGrowthQueue; } catch(e) {}
try { if (typeof setEngineDirtToGrassQueue !== "undefined") window.setEngineDirtToGrassQueue = setEngineDirtToGrassQueue; } catch(e) {}
try { if (typeof setEngineSnowRegrowthQueue !== "undefined") window.setEngineSnowRegrowthQueue = setEngineSnowRegrowthQueue; } catch(e) {}
try { if (typeof spawnDroppedItem !== "undefined") window.spawnDroppedItem = spawnDroppedItem; } catch(e) {}
try { if (typeof setEngineWorld !== "undefined") window.setEngineWorld = setEngineWorld; } catch(e) {}
try { if (typeof setEngineBgWorld !== "undefined") window.setEngineBgWorld = setEngineBgWorld; } catch(e) {}
try { if (typeof setEnginePlayer !== "undefined") window.setEnginePlayer = setEnginePlayer; } catch(e) {}
try { if (typeof setEngineSurfaceHeights !== "undefined") window.setEngineSurfaceHeights = setEngineSurfaceHeights; } catch(e) {}
try { if (typeof setEngineInventory !== "undefined") window.setEngineInventory = setEngineInventory; } catch(e) {}
try { if (typeof setEngineEquippedArmor !== "undefined") window.setEngineEquippedArmor = setEngineEquippedArmor; } catch(e) {}
try { if (typeof setEngineEntities !== "undefined") window.setEngineEntities = setEngineEntities; } catch(e) {}
try { if (typeof setEngineFluids !== "undefined") window.setEngineFluids = setEngineFluids; } catch(e) {}
try { if (typeof setEngineFurnaces !== "undefined") window.setEngineFurnaces = setEngineFurnaces; } catch(e) {}
try { if (typeof setEngineJukeboxes !== "undefined") window.setEngineJukeboxes = setEngineJukeboxes; } catch(e) {}
try { if (typeof setEngineChests !== "undefined") window.setEngineChests = setEngineChests; } catch(e) {}
try { if (typeof setEngineDroppedItems !== "undefined") window.setEngineDroppedItems = setEngineDroppedItems; } catch(e) {}
try { if (typeof setEngineState !== "undefined") window.setEngineState = setEngineState; } catch(e) {}
try { if (typeof setGameState !== "undefined") window.setGameState = setGameState; } catch(e) {}
try { if (typeof setEngineTimeOfDay !== "undefined") window.setEngineTimeOfDay = setEngineTimeOfDay; } catch(e) {}
try { if (typeof setEngineDayCount !== "undefined") window.setEngineDayCount = setEngineDayCount; } catch(e) {}
try { if (typeof setEngineFrameCount !== "undefined") window.setEngineFrameCount = setEngineFrameCount; } catch(e) {}
try { if (typeof setEngineCurrentWorldId !== "undefined") window.setEngineCurrentWorldId = setEngineCurrentWorldId; } catch(e) {}
try { if (typeof setEngineCurrentDifficulty !== "undefined") window.setEngineCurrentDifficulty = setEngineCurrentDifficulty; } catch(e) {}
try { if (typeof setEngineIsMultiplayer !== "undefined") window.setEngineIsMultiplayer = setEngineIsMultiplayer; } catch(e) {}
try { if (typeof setEngineCurrentMpRoom !== "undefined") window.setEngineCurrentMpRoom = setEngineCurrentMpRoom; } catch(e) {}
try { if (typeof setEngineCurrentMpWorldName !== "undefined") window.setEngineCurrentMpWorldName = setEngineCurrentMpWorldName; } catch(e) {}
try { if (typeof setEngineRemotePlayers !== "undefined") window.setEngineRemotePlayers = setEngineRemotePlayers; } catch(e) {}
try { if (typeof setEngineIsSleeping !== "undefined") window.setEngineIsSleeping = setEngineIsSleeping; } catch(e) {}
try { if (typeof setEngineIsBackgroundBuildMode !== "undefined") window.setEngineIsBackgroundBuildMode = setEngineIsBackgroundBuildMode; } catch(e) {}
try { if (typeof setEngineIsInventoryOpen !== "undefined") window.setEngineIsInventoryOpen = setEngineIsInventoryOpen; } catch(e) {}
try { if (typeof initCanvases !== "undefined") window.initCanvases = initCanvases; } catch(e) {}
try { if (typeof resizeCanvases !== "undefined") window.resizeCanvases = resizeCanvases; } catch(e) {}
try { if (typeof canvas !== "undefined") window.canvas = canvas; } catch(e) {}
try { if (typeof ctx !== "undefined") window.ctx = ctx; } catch(e) {}
try { if (typeof menuBgCanvas !== "undefined") window.menuBgCanvas = menuBgCanvas; } catch(e) {}
try { if (typeof menuCtx !== "undefined") window.menuCtx = menuCtx; } catch(e) {}
try { if (typeof lightCanvas !== "undefined") window.lightCanvas = lightCanvas; } catch(e) {}
try { if (typeof lightCtx !== "undefined") window.lightCtx = lightCtx; } catch(e) {}
try { if (typeof LIGHT_SCALE !== "undefined") window.LIGHT_SCALE = LIGHT_SCALE; } catch(e) {}
try { if (typeof updateCachedVignette !== "undefined") window.updateCachedVignette = updateCachedVignette; } catch(e) {}
try { if (typeof cachedLightVignette !== "undefined") window.cachedLightVignette = cachedLightVignette; } catch(e) {}
try { if (typeof cachedTorchLightCanvas !== "undefined") window.cachedTorchLightCanvas = cachedTorchLightCanvas; } catch(e) {}
try { if (typeof cachedTorchGlowCanvas !== "undefined") window.cachedTorchGlowCanvas = cachedTorchGlowCanvas; } catch(e) {}
try { if (typeof cachedBloomAuraCanvas !== "undefined") window.cachedBloomAuraCanvas = cachedBloomAuraCanvas; } catch(e) {}
try { if (typeof generatePixelArtLightStamp !== "undefined") window.generatePixelArtLightStamp = generatePixelArtLightStamp; } catch(e) {}
try { if (typeof generatePixelArtGlowStamp !== "undefined") window.generatePixelArtGlowStamp = generatePixelArtGlowStamp; } catch(e) {}
try { if (typeof cachedFabulousVignetteCanvas !== "undefined") window.cachedFabulousVignetteCanvas = cachedFabulousVignetteCanvas; } catch(e) {}
try { if (typeof cachedSnowFogCanvas !== "undefined") window.cachedSnowFogCanvas = cachedSnowFogCanvas; } catch(e) {}
try { if (typeof cachedSunGlowDayCanvas !== "undefined") window.cachedSunGlowDayCanvas = cachedSunGlowDayCanvas; } catch(e) {}
try { if (typeof cachedSunGlowSunsetCanvas !== "undefined") window.cachedSunGlowSunsetCanvas = cachedSunGlowSunsetCanvas; } catch(e) {}
try { if (typeof cachedMoonGlowCanvas !== "undefined") window.cachedMoonGlowCanvas = cachedMoonGlowCanvas; } catch(e) {}
try { if (typeof cachedShadowCanvas !== "undefined") window.cachedShadowCanvas = cachedShadowCanvas; } catch(e) {}
try { if (typeof auroraCanvas !== "undefined") window.auroraCanvas = auroraCanvas; } catch(e) {}
try { if (typeof setWorldDimensions !== "undefined") window.setWorldDimensions = setWorldDimensions; } catch(e) {}
try { if (typeof world !== "undefined") window.world = world; } catch(e) {}
try { if (typeof cropGrowthQueue !== "undefined") window.cropGrowthQueue = cropGrowthQueue; } catch(e) {}
try { if (typeof checkWaterNearCrop !== "undefined") window.checkWaterNearCrop = checkWaterNearCrop; } catch(e) {}
try { if (typeof registerPlantedCrop !== "undefined") window.registerPlantedCrop = registerPlantedCrop; } catch(e) {}
try { if (typeof updateCropGrowth !== "undefined") window.updateCropGrowth = updateCropGrowth; } catch(e) {}
try { if (typeof isClimbableBlock !== "undefined") window.isClimbableBlock = isClimbableBlock; } catch(e) {}
try { if (typeof isJungleDoorBlock !== "undefined") window.isJungleDoorBlock = isJungleDoorBlock; } catch(e) {}
try { if (typeof Parrot !== "undefined") window.Parrot = Parrot; } catch(e) {}
try { if (typeof drawShoulderParrot !== "undefined") window.drawShoulderParrot = drawShoulderParrot; } catch(e) {}
try { if (typeof dismountParrot !== "undefined") window.dismountParrot = dismountParrot; } catch(e) {}
try { if (typeof dismountAllShoulderParrots !== "undefined") window.dismountAllShoulderParrots = dismountAllShoulderParrots; } catch(e) {}
try { if (typeof AtlasExplorer !== "undefined") window.AtlasExplorer = AtlasExplorer; } catch(e) {}
try { if (typeof findSafeKaelPositionNear !== "undefined") window.findSafeKaelPositionNear = findSafeKaelPositionNear; } catch(e) {}
try { if (typeof worldBiomes !== "undefined") window.worldBiomes = worldBiomes; } catch(e) {}
try { if (typeof signs !== "undefined") window.signs = signs; } catch(e) {}
try { if (typeof setEngineSigns !== "undefined") window.setEngineSigns = setEngineSigns; } catch(e) {}
try { if (typeof deliverLeafDecayItem !== "undefined") window.deliverLeafDecayItem = deliverLeafDecayItem; } catch(e) {}
try { if (typeof cachedCavernWallStone !== "undefined") window.cachedCavernWallStone = cachedCavernWallStone; } catch(e) {}
try { if (typeof cachedCavernWallDirt !== "undefined") window.cachedCavernWallDirt = cachedCavernWallDirt; } catch(e) {}
try { if (typeof cachedCavernWallSand !== "undefined") window.cachedCavernWallSand = cachedCavernWallSand; } catch(e) {}
try { if (typeof initCavernWallTextures !== "undefined") window.initCavernWallTextures = initCavernWallTextures; } catch(e) {}
try { if (typeof cachedLavaGlowCanvas !== "undefined") window.cachedLavaGlowCanvas = cachedLavaGlowCanvas; } catch(e) {}
try { if (typeof setEngineFpsCap !== "undefined") window.setEngineFpsCap = setEngineFpsCap; } catch(e) {}
try { if (typeof fabulousConfig !== "undefined") window.fabulousConfig = fabulousConfig; } catch(e) {}
try { if (typeof DEFAULT_FABULOUS_CONFIG !== "undefined") window.DEFAULT_FABULOUS_CONFIG = DEFAULT_FABULOUS_CONFIG; } catch(e) {}
try { if (typeof FABULOUS_PRESETS !== "undefined") window.FABULOUS_PRESETS = FABULOUS_PRESETS; } catch(e) {}
try { if (typeof applyFabulousPreset !== "undefined") window.applyFabulousPreset = applyFabulousPreset; } catch(e) {}
try { if (typeof setFabulousConfig !== "undefined") window.setFabulousConfig = setFabulousConfig; } catch(e) {}
try { if (typeof loadFabulousConfig !== "undefined") window.loadFabulousConfig = loadFabulousConfig; } catch(e) {}
try { if (typeof getFabulousParticleBudget !== "undefined") window.getFabulousParticleBudget = getFabulousParticleBudget; } catch(e) {}
try { if (typeof menuBackgroundRendered !== "undefined") window.menuBackgroundRendered = menuBackgroundRendered; } catch(e) {}
try { if (typeof dismissBootLoadingScreen !== "undefined") window.dismissBootLoadingScreen = dismissBootLoadingScreen; } catch(e) {}
try { if (typeof sanitizeTreeWoodCollision !== "undefined") window.sanitizeTreeWoodCollision = sanitizeTreeWoodCollision; } catch(e) {}
try { if (typeof isChestPairedWithLeft !== "undefined") window.isChestPairedWithLeft = isChestPairedWithLeft; } catch(e) {}