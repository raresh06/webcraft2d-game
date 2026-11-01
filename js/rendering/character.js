// =============================================================================
// WEBCRAFT 2D - CHARACTER & SKIN RENDERING (js/rendering/character.js)
// Limb segmentation, armor overlay, dynamic poses, and custom player skins
// =============================================================================

import {
    IDS, isTool
} from '../core/constants.js';

import {
    STATE, equippedArmor, frameCount
} from '../core/state.js';

import {
    textures
} from './textures.js';

    export const SKIN_W = 16;
export const SKIN_H = 32;
    export let playerSkinData = new Array(SKIN_W * SKIN_H).fill(null);
    export let editingSkinId = null;
    export let activeSkinId = 'default';

export function paintDefaultSteveSkin(targetCanvas) {
    if (!targetCanvas) return;
    const sCtx = targetCanvas.getContext('2d');
    if (!sCtx) return;
    sCtx.clearRect(0, 0, SKIN_W, SKIN_H);

    // Head (x: 4..11, y: 0..7) - Classic skin tone
    sCtx.fillStyle = '#d09f7a';
    sCtx.fillRect(4, 0, 8, 8);
    // Hair
    sCtx.fillStyle = '#4a2c11';
    sCtx.fillRect(4, 0, 8, 2);
    sCtx.fillRect(4, 2, 1, 2);
    sCtx.fillRect(11, 2, 1, 2);
    // Eyes & Mouth
    sCtx.fillStyle = '#ffffff';
    sCtx.fillRect(5, 4, 1, 1);
    sCtx.fillRect(10, 4, 1, 1);
    sCtx.fillStyle = '#2b4d8a';
    sCtx.fillRect(6, 4, 1, 1);
    sCtx.fillRect(9, 4, 1, 1);
    sCtx.fillStyle = '#885533';
    sCtx.fillRect(6, 6, 4, 1);

    // Torso (x: 4..11, y: 8..19) - Classic Steve teal shirt
    sCtx.fillStyle = '#008888';
    sCtx.fillRect(4, 8, 8, 12);
    // Belt
    sCtx.fillStyle = '#222222';
    sCtx.fillRect(4, 19, 8, 1);

    // Right Arm (x: 0..3, y: 8..19)
    sCtx.fillStyle = '#008888';
    sCtx.fillRect(0, 8, 4, 4);
    sCtx.fillStyle = '#d09f7a';
    sCtx.fillRect(0, 12, 4, 8);

    // Left Arm (x: 12..15, y: 8..19)
    sCtx.fillStyle = '#008888';
    sCtx.fillRect(12, 8, 4, 4);
    sCtx.fillStyle = '#d09f7a';
    sCtx.fillRect(12, 12, 4, 8);

    // Right Leg (x: 4..7, y: 20..31) - Classic blue jeans + dark shoes
    sCtx.fillStyle = '#333399';
    sCtx.fillRect(4, 20, 4, 10);
    sCtx.fillStyle = '#444444';
    sCtx.fillRect(4, 30, 4, 2);

    // Left Leg (x: 8..11, y: 20..31) - Classic blue jeans + dark shoes
    sCtx.fillStyle = '#333399';
    sCtx.fillRect(8, 20, 4, 10);
    sCtx.fillStyle = '#444444';
    sCtx.fillRect(8, 30, 4, 2);
}

    export let skinCanvasObj = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (skinCanvasObj) {
        skinCanvasObj.width = SKIN_W;
        skinCanvasObj.height = SKIN_H;
        paintDefaultSteveSkin(skinCanvasObj);
    }
    export let previewWalkAnimation = 0;
export let previewWalkUntil = 0;
export let previewWalkAnimId = null;
    export let isPreviewWalking = false;
    export let staticPreviewDrawn = false;

    export function getSkinSaveData() {
        if (typeof window !== 'undefined' && typeof window.playerSkinData !== 'undefined' && Array.isArray(window.playerSkinData) && window.playerSkinData.length === SKIN_W * SKIN_H) {
            return window.playerSkinData.slice(0, SKIN_W * SKIN_H);
        }
        return playerSkinData.slice(0, SKIN_W * SKIN_H);
    }


    export function drawCharacterArm(ctx, skinCanvas, srcX, srcY, destX, destY, pivotX, pivotY, angle, sX, sY, chestPal, renderItem = false, heldItemId = null) {
        if (!skinCanvas) return;
        ctx.save();
        ctx.translate(destX + pivotX, destY + pivotY);
        ctx.rotate(angle);
        
        // 1. Draw Arm Skin (4x12)
        ctx.drawImage(skinCanvas, srcX, srcY, 4, 12, -pivotX, -pivotY, 4 * sX, 12 * sY);
        
        // 2. Draw Chestplate Arm / Sleeve Armor (Shoulder pauldron & upper arm, leaving hand on exterior)
        if (chestPal) {
            ctx.fillStyle = chestPal.base;
            ctx.fillRect(-pivotX, -pivotY, 4 * sX, 6 * sY);
            ctx.fillStyle = chestPal.highlight;
            ctx.fillRect(-pivotX + 1 * sX, -pivotY, 2 * sX, 1 * sY);
            ctx.fillStyle = chestPal.trim;
            ctx.fillRect(-pivotX, -pivotY + 5 * sY, 4 * sX, 1 * sY);

            if (chestPal.isAstral) {
                const glintAlpha = 0.25 + Math.sin(Date.now() / 220) * 0.15;
                ctx.fillStyle = `rgba(216, 180, 254, ${glintAlpha})`;
                ctx.fillRect(-pivotX, -pivotY, 4 * sX, 6 * sY);
            }
        }

        // 3. Draw Held Item
        if (renderItem && heldItemId && textures[heldItemId]) {
            ctx.translate(-pivotX + (4 * sX) / 2, -pivotY + (12 * sY)); 
            const isHandheld = (typeof isTool === 'function' && isTool(heldItemId)) || [
                IDS.STICK, IDS.TORCH, IDS.BOW, IDS.BONE, IDS.FEATHER,
                IDS.ASTRAL_SHARD, IDS.CHRONO_ANCHOR, IDS.CELESTIAL_COMPASS, IDS.VOID_BEACON,
                IDS.GLOOM_LANTERN
            ].includes(heldItemId);

            if (isHandheld) {
                // Diagonal handheld tool/weapon: pivot at grip (handle at hand), angled 45° forward & up in player facing direction
                ctx.rotate(Math.PI * 0.5);
                ctx.drawImage(textures[heldItemId], -20, -20, 24, 24);
            } else {
                // Blocks, food, and generic items held upright in front of the hand
                ctx.rotate(Math.PI * 0.1);
                ctx.drawImage(textures[heldItemId], -6, -18, 18, 18);
            }
        }
        ctx.restore();
    }

    export function drawCharacterLeg(ctx, skinCanvas, srcX, srcY, destX, destY, pivotX, pivotY, angle, sX, sY, legPal, bootPal) {
        if (!skinCanvas) return;
        ctx.save();
        ctx.translate(destX + pivotX, destY + pivotY);
        ctx.rotate(angle);
        
        // 1. Draw Leg Skin (4x12)
        ctx.drawImage(skinCanvas, srcX, srcY, 4, 12, -pivotX, -pivotY, 4 * sX, 12 * sY);
        
        // 2. Draw Leggings Thigh Armor (Rotates with swinging leg)
        if (legPal) {
            ctx.fillStyle = legPal.base;
            ctx.fillRect(-pivotX, -pivotY, 4 * sX, 6 * sY);
            ctx.fillStyle = legPal.highlight;
            ctx.fillRect(-pivotX + 1 * sX, -pivotY + 1 * sY, 2 * sX, 4 * sY);
            ctx.fillStyle = legPal.trim;
            ctx.fillRect(-pivotX, -pivotY + 5 * sY, 4 * sX, 1 * sY);

            if (legPal.isAstral) {
                const glintAlpha = 0.25 + Math.sin(Date.now() / 220 + 1) * 0.15;
                ctx.fillStyle = `rgba(216, 180, 254, ${glintAlpha})`;
                ctx.fillRect(-pivotX, -pivotY, 4 * sX, 6 * sY);
            }
        }

        // 3. Draw Boot Armor (Attached directly to each individual swinging foot)
        if (bootPal) {
            ctx.fillStyle = bootPal.base;
            ctx.fillRect(-pivotX, -pivotY + 7 * sY, 4 * sX, 5 * sY);
            ctx.fillStyle = bootPal.highlight;
            ctx.fillRect(-pivotX + 1 * sX, -pivotY + 7 * sY, 2 * sX, 2 * sY);
            ctx.fillStyle = bootPal.trim;
            ctx.fillRect(-pivotX, -pivotY + 7 * sY, 4 * sX, 1 * sY);
            ctx.fillStyle = bootPal.dark;
            ctx.fillRect(-pivotX, -pivotY + 11 * sY, 4 * sX, 1 * sY); // Boot sole

            if (bootPal.isAstral) {
                const glintAlpha = 0.25 + Math.sin(Date.now() / 220 + 2) * 0.15;
                ctx.fillStyle = `rgba(216, 180, 254, ${glintAlpha})`;
                ctx.fillRect(-pivotX, -pivotY + 7 * sY, 4 * sX, 5 * sY);
            }
        }

        ctx.restore();
    }

    export function drawCharacterTorso(ctx, skinCanvas, destX, destY, pivotX, pivotY, angle, sX, sY, chestPal, legPal) {
        if (!skinCanvas) return;
        ctx.save();
        ctx.translate(destX + pivotX, destY + pivotY);
        ctx.rotate(angle);
        
        // 1. Draw Torso Skin (8x12)
        ctx.drawImage(skinCanvas, 4, 8, 8, 12, -pivotX, -pivotY, 8 * sX, 12 * sY);
        
        // 2. Draw Chestplate Breastplate on Torso
        if (chestPal) {
            ctx.fillStyle = chestPal.base;
            ctx.fillRect(-pivotX, -pivotY, 8 * sX, 10 * sY);
            ctx.fillStyle = chestPal.highlight;
            ctx.fillRect(-pivotX + 1 * sX, -pivotY + 1 * sY, 6 * sX, 2 * sY);
            ctx.fillStyle = chestPal.trim;
            ctx.fillRect(-pivotX, -pivotY + 9 * sY, 8 * sX, 1 * sY);
            ctx.fillStyle = chestPal.dark;
            ctx.fillRect(-pivotX + 3 * sX, -pivotY + 3 * sY, 2 * sX, 6 * sY);

            if (chestPal.isAstral) {
                const glintAlpha = 0.25 + Math.sin(Date.now() / 220 + 0.5) * 0.15;
                ctx.fillStyle = `rgba(216, 180, 254, ${glintAlpha})`;
                ctx.fillRect(-pivotX, -pivotY, 8 * sX, 10 * sY);
            }
        }

        // 3. Draw Leggings Pelvis / Waistband on Lower Torso
        if (legPal) {
            ctx.fillStyle = legPal.base;
            ctx.fillRect(-pivotX, -pivotY + 10 * sY, 8 * sX, 2 * sY);
            ctx.fillStyle = legPal.trim;
            ctx.fillRect(-pivotX, -pivotY + 10 * sY, 8 * sX, 1 * sY);

            if (legPal.isAstral) {
                const glintAlpha = 0.25 + Math.sin(Date.now() / 220 + 1.5) * 0.15;
                ctx.fillStyle = `rgba(216, 180, 254, ${glintAlpha})`;
                ctx.fillRect(-pivotX, -pivotY + 10 * sY, 8 * sX, 2 * sY);
            }
        }

        ctx.restore();
    }

    export function drawCharacterHead(ctx, skinCanvas, destX, destY, pivotX, pivotY, angle, sX, sY, helmetPal) {
        if (!skinCanvas) return;
        ctx.save();
        ctx.translate(destX + pivotX, destY + pivotY);
        ctx.rotate(angle);
        
        // 1. Draw Head Skin (8x8)
        ctx.drawImage(skinCanvas, 4, 0, 8, 8, -pivotX, -pivotY, 8 * sX, 8 * sY);
        
        // 2. Draw Helmet Armor Overlay
        if (helmetPal) {
            ctx.fillStyle = helmetPal.base;
            ctx.fillRect(-pivotX, -pivotY, 8 * sX, 3 * sY); // Cap
            ctx.fillRect(-pivotX, -pivotY, 1 * sX, 6 * sY); // Left ear
            ctx.fillRect(-pivotX + 7 * sX, -pivotY, 1 * sX, 6 * sY); // Right ear
            ctx.fillStyle = helmetPal.highlight;
            ctx.fillRect(-pivotX + 1 * sX, -pivotY, 6 * sX, 1 * sY); // Brow highlight
            ctx.fillStyle = helmetPal.dark;
            ctx.fillRect(-pivotX + 3 * sX, -pivotY + 3 * sY, 2 * sX, 3 * sY); // Nose guard

            if (helmetPal.isAstral) {
                const glintAlpha = 0.25 + Math.sin(Date.now() / 220) * 0.15;
                ctx.fillStyle = `rgba(216, 180, 254, ${glintAlpha})`;
                ctx.fillRect(-pivotX, -pivotY, 8 * sX, 6 * sY);
            }
        }

        ctx.restore();
    }

    export function getArmorPalette(armorPiece) {
        if (!armorPiece || !armorPiece.id) return null;
        const id = armorPiece.id;
        if (id === IDS.HELMET_IRON || id === IDS.CHESTPLATE_IRON || id === IDS.LEGGINGS_IRON || id === IDS.BOOTS_IRON) {
            return { base: '#d8dee9', trim: '#94a3b8', highlight: '#ffffff', dark: '#64748b' };
        }
        if (id === IDS.HELMET_GOLD || id === IDS.CHESTPLATE_GOLD || id === IDS.LEGGINGS_GOLD || id === IDS.BOOTS_GOLD) {
            return { base: '#facc15', trim: '#ca8a04', highlight: '#fef08a', dark: '#854d0e' };
        }
        if (id === IDS.HELMET_DIAMOND || id === IDS.CHESTPLATE_DIAMOND || id === IDS.LEGGINGS_DIAMOND || id === IDS.BOOTS_DIAMOND) {
            return { base: '#22d3ee', trim: '#0891b2', highlight: '#cffafe', dark: '#164e63' };
        }
        if (id === IDS.ASTRAL_HELMET || id === IDS.ASTRAL_CHESTPLATE || id === IDS.ASTRAL_LEGGINGS || id === IDS.ASTRAL_BOOTS) {
            return { base: '#7c3aed', trim: '#5b21b6', highlight: '#e9d5ff', dark: '#2e1065', isAstral: true };
        }
        if (id === IDS.STRIDER_BOOTS) {
            return { base: '#059669', trim: '#047857', highlight: '#6ee7b7', dark: '#064e3b', isAstral: true };
        }
        return null;
    }

    // Central drawing function for local & remote characters with limb segmentation and armor overlays
    export function drawShoulderParrot(ctx, parrot, px, py, sX, sY) {
        if (!parrot) return;
        ctx.save();
        ctx.translate(px, py);

        const v = parrot.variant || 0;
        let cBody = '#dc2626', cWing = '#eab308', cFlight = '#2563eb', cBeak = '#1e293b', cCrest = null;
        if (v === 1) { cBody = '#16a34a'; cWing = '#ef4444'; cFlight = '#0d9488'; cBeak = '#fef08a'; }
        else if (v === 2) { cBody = '#0284c7'; cWing = '#38bdf8'; cFlight = '#1d4ed8'; cBeak = '#111827'; }
        else if (v === 3) { cBody = '#64748b'; cWing = '#f8fafc'; cFlight = '#475569'; cBeak = '#d1d5db'; cCrest = '#fde047'; }

        // Tail
        ctx.fillStyle = cFlight;
        ctx.fillRect(-1.5 * sX, 3.5 * sY, 2.5 * sX, 3.5 * sY);

        // Body
        ctx.fillStyle = cBody;
        ctx.fillRect(-1 * sX, 0, 3.5 * sX, 4.5 * sY);

        // Head
        ctx.fillRect(0.5 * sX, -3 * sY, 3 * sX, 3 * sY);

        // Crest if cockatiel
        if (cCrest) {
            ctx.fillStyle = cCrest;
            ctx.fillRect(0.5 * sX, -4.8 * sY, 1.5 * sX, 2 * sY);
        }

        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(1.8 * sX, -2.2 * sY, 1.2 * sX, 1.2 * sY);
        ctx.fillStyle = '#000000';
        ctx.fillRect(2.2 * sX, -2.2 * sY, 0.8 * sX, 1.2 * sY);

        // Beak
        ctx.fillStyle = cBeak;
        ctx.fillRect(3.5 * sX, -1.8 * sY, 1.2 * sX, 1.2 * sY);

        // Wing
        ctx.fillStyle = cWing;
        ctx.fillRect(-0.2 * sX, 0.8 * sY, 2.2 * sX, 2.6 * sY);

        ctx.restore();
    }

    export function drawCharacter(ctx, skinCanvas, x, y, w, h, facingRight, walkAnim, isMoving, isDamage, headTargetX, headTargetY, isAttacking, heldItemId, isClimbing = false, armorList = null, shoulderParrots = null, walkBlend = null) {
        const curArmor = (armorList !== null && armorList !== undefined)
            ? armorList
            : ((typeof equippedArmor !== 'undefined' ? equippedArmor : (typeof window !== 'undefined' ? window.equippedArmor : null)) || [null, null, null, null]);
        const activeArmor = (STATE === 'MENU') ? (armorList || [null, null, null, null]) : curArmor;
        const curFrame = (typeof frameCount !== 'undefined' ? frameCount : (typeof window !== 'undefined' ? window.frameCount : 0)) || 0;
        const activeSkin = skinCanvas || (typeof window !== 'undefined' && window.skinCanvasObj) || skinCanvasObj;
        if (!activeSkin) return;

        ctx.save();
        ctx.translate(x, y);
        if (isDamage) {
            ctx.filter = 'sepia(1) saturate(8) hue-rotate(315deg) brightness(0.95)';
            if (Math.floor(curFrame / 4) % 2 === 0) ctx.globalAlpha = 0.75;
        }

        let sX = w / 16;
        let sY = h / 32;

        const blend = (walkBlend !== null && typeof walkBlend === 'number') ? Math.max(0, Math.min(1, walkBlend)) : (isMoving ? 1 : 0);
        let swing = (!isMoving && !isClimbing && blend <= 0) ? 0 : (isClimbing ? Math.sin(walkAnim) * Math.PI / 7 : Math.sin(walkAnim) * (Math.PI / 4.2) * blend);
        let armSwing = (!isMoving && !isClimbing && blend <= 0) ? 0 : (isClimbing ? -Math.PI / 1.5 + Math.sin(walkAnim) * Math.PI / 7 : Math.sin(walkAnim) * (Math.PI / 6) * blend);
        let frontArmSwing = isAttacking ? -Math.PI / 2 - Math.sin(curFrame * 0.4) * 0.5 : (isClimbing ? -Math.PI / 1.5 - Math.sin(walkAnim) * Math.PI / 7 : -armSwing);

        if (!facingRight) {
            ctx.translate(w, 0);
            ctx.scale(-1, 1);
        }

        let headAngle = 0;
        let headOffset = 0;

        const helmetPal = (activeArmor && activeArmor[0]) ? getArmorPalette(activeArmor[0]) : null;
        const chestPal = (activeArmor && activeArmor[1]) ? getArmorPalette(activeArmor[1]) : null;
        const legPal = (activeArmor && activeArmor[2]) ? getArmorPalette(activeArmor[2]) : null;
        const bootPal = (activeArmor && activeArmor[3]) ? getArmorPalette(activeArmor[3]) : null;

        // Proper Layer Draw Order (back to front):
        // 1. Back Arm (with shoulder sleeve armor)
        drawCharacterArm(ctx, activeSkin, 12, 8, 6 * sX, 8 * sY, 2 * sX, 2 * sY, armSwing, sX, sY, chestPal, false, null);
        
        // Back shoulder parrot (if any)
        if (shoulderParrots && shoulderParrots.left) {
            drawShoulderParrot(ctx, shoulderParrots.left, 2 * sX, 4 * sY, sX, sY);
        }

        // 2. Back Leg (with back thigh armor and back boot moving with swinging foot)
        drawCharacterLeg(ctx, activeSkin, 8, 20, 6 * sX, 20 * sY, 2 * sX, 2 * sY, -swing, sX, sY, legPal, bootPal);
        
        // 3. Torso (with chestplate breastplate and pelvis waistband)
        drawCharacterTorso(ctx, activeSkin, 4 * sX, 8 * sY, 4 * sX, 6 * sY, 0, sX, sY, chestPal, legPal);
        
        // 4. Head (with helmet overlay)
        drawCharacterHead(ctx, activeSkin, 4 * sX + headOffset, 0, 4 * sX, 6 * sY, headAngle, sX, sY, helmetPal);
        
        // 5. Front Leg (with front thigh armor and front boot moving with swinging foot)
        drawCharacterLeg(ctx, activeSkin, 4, 20, 6 * sX, 20 * sY, 2 * sX, 2 * sY, swing, sX, sY, legPal, bootPal);
        
        // 6. Front Arm ON EXTERIOR (with shoulder sleeve armor, hands on the exterior, and held item)
        drawCharacterArm(ctx, activeSkin, 0, 8, 6 * sX, 8 * sY, 2 * sX, 2 * sY, frontArmSwing, sX, sY, chestPal, true, heldItemId);

        // Front shoulder parrot (if any)
        if (shoulderParrots && shoulderParrots.right) {
            drawShoulderParrot(ctx, shoulderParrots.right, 9 * sX, 4 * sY, sX, sY);
        }

        ctx.restore();
    }

    export function drawFrontCharacter(ctx, skinCanvas, x, y, w, h, bounceOffset = 0) {
        const activeCanvas = skinCanvas || (typeof window !== 'undefined' && window.skinCanvasObj) || skinCanvasObj;
        if (!activeCanvas) return;
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Calculate aspect-fit centered rectangle for 16x32 front-facing character
        const scale = Math.min(w / 16, h / 32);
        const drawW = Math.round(16 * scale);
        const drawH = Math.round(32 * scale);
        const drawX = Math.round(x + (w - drawW) / 2);
        const drawY = Math.round(y + (h - drawH) / 2 - bounceOffset);

        ctx.drawImage(activeCanvas, 0, 0, 16, 32, drawX, drawY, drawW, drawH);
        ctx.restore();
    }

    export function drawPlayerHead(ctx, skinCanvas, x, y, size) {
        const activeCanvas = skinCanvas || (typeof window !== 'undefined' && window.skinCanvasObj) || skinCanvasObj;
        if (!activeCanvas) return;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        // Head in skinCanvas (16x32) is 8x8 pixels at source x: 4, y: 0, w: 8, h: 8
        ctx.drawImage(activeCanvas, 4, 0, 8, 8, Math.round(x), Math.round(y), Math.round(size), Math.round(size));
        ctx.restore();
    }

    export function setStaticPreviewDrawn(val) {
        staticPreviewDrawn = !!val;
        if (typeof window !== 'undefined') window.staticPreviewDrawn = staticPreviewDrawn;
    }

    export function renderStaticPlayerPreview() {
        let pCanvas = document.getElementById('player-preview-canvas');
        if (!pCanvas) return;
        let pCtx = pCanvas.getContext('2d');
        pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
        pCtx.imageSmoothingEnabled = false;
        const activeCanvas = (typeof window !== 'undefined' && window.skinCanvasObj) ? window.skinCanvasObj : skinCanvasObj;
        drawFrontCharacter(pCtx, activeCanvas, 0, 0, pCanvas.width, pCanvas.height, 0);
        staticPreviewDrawn = true;
        if (typeof window !== 'undefined') window.staticPreviewDrawn = true;
    }

    export function drawPlayerPreview(force = false) {
        if (force) {
            staticPreviewDrawn = false;
            if (typeof window !== 'undefined') window.staticPreviewDrawn = false;
        }
        if (!isPreviewWalking && (!staticPreviewDrawn || force)) {
            renderStaticPlayerPreview();
        }
    }

    export function startPlayerPreviewWalk() {
        if (isPreviewWalking) return; // Prevent double clicking or spamming while animation runs
        let pCanvas = document.getElementById('player-preview-canvas');
        if (!pCanvas || getComputedStyle(pCanvas).display === 'none') return;

        isPreviewWalking = true;
        staticPreviewDrawn = false;
        if (typeof window !== 'undefined') window.staticPreviewDrawn = false;
        let startTime = performance.now();
        let duration = 1600; // ms

        isPreviewWalking = false;
        if (previewWalkAnimId) {
            cancelAnimationFrame(previewWalkAnimId);
            previewWalkAnimId = null;
        }

        function animLoop(now) {
            if (!isPreviewWalking) {
                renderStaticPlayerPreview();
                return;
            }
            let elapsed = now - startTime;
            if (elapsed >= duration || STATE !== 'MENU') {
                isPreviewWalking = false;
                previewWalkAnimId = null;
                renderStaticPlayerPreview();
                return;
            }

            let pCtx = pCanvas.getContext('2d');
            pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
            pCtx.imageSmoothingEnabled = false;
            let walkAnimPhase = (elapsed / 1000) * (Math.PI * 4); // Constant smooth ~2 steps/sec
            const activeCanvas = (typeof window !== 'undefined' && window.skinCanvasObj) ? window.skinCanvasObj : skinCanvasObj;
            drawCharacter(pCtx, activeCanvas, 0, 0, pCanvas.width, pCanvas.height, true, walkAnimPhase, true, false, null, null, false, null, false, [null, null, null, null]);

            previewWalkAnimId = requestAnimationFrame(animLoop);
        }

        previewWalkAnimId = requestAnimationFrame(animLoop);
        staticPreviewDrawn = false;
        if (typeof window !== 'undefined') window.staticPreviewDrawn = false;
        renderStaticPlayerPreview();
    }


// Global Window Registration for cross-module compatibility
if (typeof window !== 'undefined') {
    window.SKIN_W = SKIN_W;
    window.SKIN_H = SKIN_H;
    window.playerSkinData = playerSkinData;
    window.editingSkinId = editingSkinId;
    window.activeSkinId = activeSkinId;
    window.skinCanvasObj = skinCanvasObj;
    window.previewWalkAnimation = previewWalkAnimation;
    window.previewWalkUntil = previewWalkUntil;
    window.previewWalkAnimId = previewWalkAnimId;
    window.isPreviewWalking = isPreviewWalking;
    window.staticPreviewDrawn = staticPreviewDrawn;
    window.getSkinSaveData = getSkinSaveData;
    window.drawCharacterArm = drawCharacterArm;
    window.drawCharacterLeg = drawCharacterLeg;
    window.drawCharacterTorso = drawCharacterTorso;
    window.drawCharacterHead = drawCharacterHead;
    window.getArmorPalette = getArmorPalette;
    window.drawShoulderParrot = drawShoulderParrot;
    window.drawCharacter = drawCharacter;
    window.paintDefaultSteveSkin = paintDefaultSteveSkin;
    window.drawFrontCharacter = drawFrontCharacter;
    window.drawPlayerHead = drawPlayerHead;
    window.setStaticPreviewDrawn = setStaticPreviewDrawn;
    window.renderStaticPlayerPreview = renderStaticPlayerPreview;
    window.drawPlayerPreview = drawPlayerPreview;
    window.startPlayerPreviewWalk = startPlayerPreviewWalk;
}
