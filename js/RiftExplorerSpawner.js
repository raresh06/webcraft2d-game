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
import { showKaelArrivalBanner, showKaelDepartureBanner } from './ui.js';

class RiftExplorerSpawnerManager {
    constructor() {
        this.lastCheckedDay = 0;
        this.nextArrivalDay = 2;
        this.nextArrivalDayTime = 0.20;
        this.activeExplorer = null;
        this.hasSpawnedInitial = false;
        this.lastArrivalDay = 0;
        this.arrivalIntervalMin = 3;
        this.arrivalIntervalMax = 5;
    }

    initNewWorld() {
        this.lastCheckedDay = 1;
        this.hasSpawnedInitial = true;
        this.activeExplorer = null;
        this.lastArrivalDay = 0;
        // Does NOT always spawn in the beginning!
        // 25% chance of arriving later on Day 1 (afternoon), otherwise arrives Day 2, 3, or 4
        if (Math.random() < 0.25) {
            this.nextArrivalDay = 1;
            this.nextArrivalDayTime = 0.28 + Math.random() * 0.15; // Afternoon of Day 1
        } else {
            this.nextArrivalDay = Math.floor(Math.random() * 3) + 2; // Day 2, 3, or 4
            this.nextArrivalDayTime = 0.10 + Math.random() * 0.30;
        }
    }

    reset() {
        this.lastCheckedDay = 0;
        this.nextArrivalDay = 2;
        this.nextArrivalDayTime = 0.20;
        this.activeExplorer = null;
        this.hasSpawnedInitial = false;
        this.lastArrivalDay = 0;
    }

    saveState() {
        return {
            nextArrivalDay: this.nextArrivalDay,
            nextArrivalDayTime: this.nextArrivalDayTime,
            lastCheckedDay: this.lastCheckedDay,
            hasSpawnedInitial: this.hasSpawnedInitial,
            lastArrivalDay: this.lastArrivalDay
        };
    }

    loadState(data) {
        if (!data) return;
        if (data.nextArrivalDay !== undefined) this.nextArrivalDay = data.nextArrivalDay;
        if (data.nextArrivalDayTime !== undefined) this.nextArrivalDayTime = data.nextArrivalDayTime;
        if (data.lastCheckedDay !== undefined) this.lastCheckedDay = data.lastCheckedDay;
        if (data.hasSpawnedInitial !== undefined) this.hasSpawnedInitial = !!data.hasSpawnedInitial;
        if (data.lastArrivalDay !== undefined) this.lastArrivalDay = data.lastArrivalDay;
    }

    checkCycle(currentDayCount, timeOfDay, playerRef) {
        // In multiplayer, only the host/authority decides spawner events
        if (isMultiplayer && !isMultiplayerAuthority()) return;

        // Clean up active explorer reference if departed or removed
        if (this.activeExplorer && (this.activeExplorer.isDeparted || !entities.includes(this.activeExplorer))) {
            this.activeExplorer = null;
        }

        // Only spawn if no active explorer is already present in the world!
        const existing = entities.find(e => (e instanceof AtlasExplorer || (e && e.constructor && e.constructor.name === 'AtlasExplorer')) && !e.isDeparted);
        if (existing) {
            this.activeExplorer = existing;
            return;
        }

        // If legacy world was not initialized, schedule first arrival for a future day
        if (!this.hasSpawnedInitial) {
            this.hasSpawnedInitial = true;
            this.nextArrivalDay = currentDayCount + Math.floor(Math.random() * 3) + 1;
            this.nextArrivalDayTime = 0.15 + Math.random() * 0.25;
            return;
        }

        // Check if day has advanced to or past scheduled arrival day
        if (currentDayCount >= this.nextArrivalDay) {
            const targetTime = this.nextArrivalDayTime !== undefined ? this.nextArrivalDayTime : 0.20;
            if (currentDayCount > this.nextArrivalDay || timeOfDay >= targetTime) {
                // Prevent duplicate spawn on same day
                if (this.lastArrivalDay === currentDayCount) return;

                this.lastArrivalDay = currentDayCount;
                this.lastCheckedDay = currentDayCount;
                this.scheduleNextArrival(currentDayCount);
                this.spawnExplorer(playerRef);
            }
        }
    }

    scheduleNextArrival(currentDay) {
        const delta = Math.floor(Math.random() * (this.arrivalIntervalMax - this.arrivalIntervalMin + 1)) + this.arrivalIntervalMin;
        this.nextArrivalDay = currentDay + delta;
        this.nextArrivalDayTime = 0.10 + Math.random() * 0.30;
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
                            // Ensure Kael does not spawn trapped in a 1-wide trench
                            const leftSolid = isSolidWorldBlock(checkGx - 1, gy - 1, curWorld[checkGx - 1]?.[gy - 1]);
                            const rightSolid = isSolidWorldBlock(checkGx + 1, gy - 1, curWorld[checkGx + 1]?.[gy - 1]);
                            if (leftSolid && rightSolid) continue;

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

        // Sound & visual banner alert
        if (typeof showKaelArrivalBanner === 'function') {
            showKaelArrivalBanner();
        } else if (typeof window !== 'undefined' && typeof window.showKaelArrivalBanner === 'function') {
            window.showKaelArrivalBanner();
        } else {
            playSound('portal_warp');
            showToast('Planar Rift Opened: Kael, The Atlas Explorer has arrived!', 6000);
        }

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
        if (typeof showKaelArrivalBanner === 'function') {
            showKaelArrivalBanner();
        } else if (typeof window !== 'undefined' && typeof window.showKaelArrivalBanner === 'function') {
            window.showKaelArrivalBanner();
        } else {
            playSound('portal_warp');
            showToast('Planar Rift Opened: Kael, The Atlas Explorer has arrived!', 6000);
        }
    }

    handleRemoteDeparture() {
        if (this.activeExplorer) {
            this.activeExplorer.warpState = 'warping_out';
            if (typeof showKaelDepartureBanner === 'function') {
                showKaelDepartureBanner();
            } else if (typeof window !== 'undefined' && typeof window.showKaelDepartureBanner === 'function') {
                window.showKaelDepartureBanner();
            } else {
                playSound('portal_warp');
                showToast('Planar Rift Closed: Kael steps through a collapsing rift into the Astral Void.', 5000);
            }
        }
    }
}

export const RiftExplorerSpawner = new RiftExplorerSpawnerManager();

if (typeof window !== 'undefined') {
    window.RiftExplorerSpawner = RiftExplorerSpawner;
}

