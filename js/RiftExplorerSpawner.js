// =============================================================================
// WEBCRAFT 2D - RIFT EXPLORER SPAWNER (RiftExplorerSpawner.js)
// Controls Kael, The Atlas Explorer's planar rift arrivals, anchors, & departure cycles
// =============================================================================

import {
    IDS, TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT,
    entities, isSolidWorldBlock, showToast, playSound,
    isMultiplayer, isMultiplayerAuthority, broadcastDataPacket,
    AtlasExplorer
} from './engine.js';

class RiftExplorerSpawnerManager {
    constructor() {
        this.lastCheckedDay = 0;
        this.nextArrivalDay = 1; // Arrives Day 1!
        this.activeExplorer = null;
        this.hasSpawnedDayOne = false;
        this.arrivalIntervalMin = 3;
        this.arrivalIntervalMax = 5;
    }

    reset() {
        this.lastCheckedDay = 0;
        this.nextArrivalDay = 1;
        this.activeExplorer = null;
        this.hasSpawnedDayOne = false;
    }

    checkCycle(currentDayCount, timeOfDay, playerRef) {
        // In multiplayer, only the host/authority decides spawner events
        if (isMultiplayer && !isMultiplayerAuthority()) return;

        // Clean up active explorer reference if departed or removed
        if (this.activeExplorer && (this.activeExplorer.isDeparted || !entities.includes(this.activeExplorer))) {
            this.activeExplorer = null;
        }

        // Only spawn if no active explorer is already present
        const existing = entities.find(e => e instanceof AtlasExplorer && !e.isDeparted);
        if (existing) {
            this.activeExplorer = existing;
            return;
        }

        // Day 1 immediate arrival check
        if (!this.hasSpawnedDayOne && currentDayCount >= 1) {
            this.hasSpawnedDayOne = true;
            this.lastCheckedDay = currentDayCount;
            this.scheduleNextArrival(currentDayCount);
            this.spawnExplorer(playerRef);
            return;
        }

        // Check if day has advanced to or past scheduled arrival day
        if (currentDayCount >= this.nextArrivalDay) {
            this.lastCheckedDay = currentDayCount;
            this.scheduleNextArrival(currentDayCount);
            this.spawnExplorer(playerRef);
        }
    }

    scheduleNextArrival(currentDay) {
        const delta = Math.floor(Math.random() * (this.arrivalIntervalMax - this.arrivalIntervalMin + 1)) + this.arrivalIntervalMin;
        this.nextArrivalDay = currentDay + delta;
    }

    findSafeArrivalLocation(playerRef) {
        const curWorld = (typeof window !== 'undefined' && window.world) ? window.world : null;
        if (!curWorld || !playerRef) return null;

        const pGx = Math.floor((playerRef.x + playerRef.width / 2) / TILE_SIZE);
        const pGy = Math.floor((playerRef.y + playerRef.height / 2) / TILE_SIZE);

        // 1. Search for preferred player settlement anchors (Bed, Furnace, Crafting Table, Chest)
        const settlementBlocks = [IDS.BED, IDS.FURNACE, IDS.CRAFTING_TABLE, IDS.CHEST];
        let candidateAnchors = [];

        for (let dx = -30; dx <= 30; dx++) {
            const gx = pGx + dx;
            if (gx < 4 || gx >= WORLD_WIDTH - 4) continue;
            for (let dy = -15; dy <= 15; dy++) {
                const gy = pGy + dy;
                if (gy < 4 || gy >= WORLD_HEIGHT - 4) continue;
                const b = curWorld[gx]?.[gy];
                if (settlementBlocks.includes(b)) {
                    candidateAnchors.push({ gx, gy });
                }
            }
        }

        // If settlement anchors exist near player, pick a surface position near one
        if (candidateAnchors.length > 0) {
            const anchor = candidateAnchors[Math.floor(Math.random() * candidateAnchors.length)];
            const safePos = this.findSurfaceNear(curWorld, anchor.gx, 3, 10);
            if (safePos) return safePos;
        }

        // 2. Otherwise, find safe natural surface 10 to 20 blocks horizontally from player
        return this.findSurfaceNear(curWorld, pGx, 10, 20);
    }

    findSurfaceNear(curWorld, centerGx, minOffset, maxOffset) {
        const dir = Math.random() > 0.5 ? 1 : -1;
        const attempts = [dir, -dir];

        for (let attemptDir of attempts) {
            for (let dist = minOffset; dist <= maxOffset; dist++) {
                const checkGx = centerGx + (dist * attemptDir);
                if (checkGx < 4 || checkGx >= WORLD_WIDTH - 4) continue;

                for (let gy = 2; gy < WORLD_HEIGHT - 4; gy++) {
                    const blockBelow = curWorld[checkGx]?.[gy];
                    const isSolid = isSolidWorldBlock(checkGx, gy, blockBelow);
                    if (isSolid && blockBelow !== IDS.LAVA && blockBelow !== IDS.CACTUS) {
                        const headB = curWorld[checkGx]?.[gy - 2];
                        const torsoB = curWorld[checkGx]?.[gy - 1];
                        if (
                            !isSolidWorldBlock(checkGx, gy - 2, headB) && headB !== IDS.LAVA &&
                            !isSolidWorldBlock(checkGx, gy - 1, torsoB) && torsoB !== IDS.LAVA
                        ) {
                            return {
                                x: checkGx * TILE_SIZE + 4,
                                y: (gy - 2) * TILE_SIZE + 4
                            };
                        }
                    }
                }
            }
        }
        return null;
    }

    spawnExplorer(playerRef) {
        const loc = this.findSafeArrivalLocation(playerRef);
        if (!loc) return null;

        const explorer = new AtlasExplorer(loc.x, loc.y);
        entities.push(explorer);
        this.activeExplorer = explorer;

        if (typeof window !== 'undefined') {
            window.entities = entities;
        }

        // Sound & visual toast alert
        playSound('portal_warp');
        showToast('✦ A Planar Rift opens... Kael, The Atlas Explorer has arrived! ✦', 6000);

        // Multiplayer broadcast
        if (isMultiplayer && isMultiplayerAuthority()) {
            broadcastDataPacket({
                type: 'ATLAS_EXPLORER_ARRIVED',
                x: loc.x,
                y: loc.y,
                stayDuration: explorer.maxStayDuration
            });
        }

        return explorer;
    }

    handleRemoteArrival(packet) {
        if (!packet || packet.x === undefined || packet.y === undefined) return;
        const existing = entities.find(e => e instanceof AtlasExplorer);
        if (existing) {
            existing.x = packet.x;
            existing.y = packet.y;
            existing.warpState = 'warping_in';
            existing.warpProgress = 0.05;
            existing.isDeparted = false;
            this.activeExplorer = existing;
        } else {
            const explorer = new AtlasExplorer(packet.x, packet.y);
            entities.push(explorer);
            this.activeExplorer = explorer;
        }
        playSound('portal_warp');
        showToast('✦ A Planar Rift opens... Kael, The Atlas Explorer has arrived! ✦', 6000);
    }

    handleRemoteDeparture() {
        if (this.activeExplorer) {
            this.activeExplorer.warpState = 'warping_out';
            playSound('portal_warp');
            showToast('✦ Kael steps through a collapsing rift into the Astral Void... ✦', 5000);
        }
    }
}

export const RiftExplorerSpawner = new RiftExplorerSpawnerManager();

if (typeof window !== 'undefined') {
    window.RiftExplorerSpawner = RiftExplorerSpawner;
}

