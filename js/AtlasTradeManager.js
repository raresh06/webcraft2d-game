// =============================================================================
// WEBCRAFT 2D - ATLAS TRADE MANAGER (AtlasTradeManager.js)
// Catalog, stock rolling, validation, and execution for Kael's Astral Market
// =============================================================================

import {
    IDS, giveItem, playSound, showToast, unlockAchievement,
    isMultiplayer, isMultiplayerAuthority, broadcastDataPacket
} from './engine.js';
import { getPlayerAstralEmeralds, addPlayerAstralEmeralds } from './ui.js';

export const ATLAS_CATALOG = [
    {
        id: 'trade_void_spores',
        itemId: IDS.VOID_BERRY_SPORES,
        amount: 1,
        cost: 5,
        baseStock: 3,
        name: 'Void Berry Spores',
        category: 'flora',
        description: 'Cosmic spores that grow into glowing violet berry bushes with restorative astral fruit.'
    },
    {
        id: 'trade_sunburst_seeds',
        itemId: IDS.SUNBURST_MELON_SEEDS,
        amount: 1,
        cost: 6,
        baseStock: 3,
        name: 'Sunburst Melon Seeds',
        category: 'flora',
        description: 'Golden solar seeds that cultivate sweet, honeyed Sunburst Melons rich in saturation.'
    },
    {
        id: 'trade_disc_synthwave',
        itemId: IDS.MUSIC_DISC_SYNTHWAVE,
        amount: 1,
        cost: 10,
        baseStock: 1,
        name: 'Audio Relic - Neon Horizon',
        category: 'relic',
        description: 'An ancient planar vinyl disc capturing neon synthwave melodies from beyond the rift.'
    },
    {
        id: 'trade_disc_ambient',
        itemId: IDS.MUSIC_DISC_AMBIENT,
        amount: 1,
        cost: 10,
        baseStock: 1,
        name: 'Audio Relic - Echoes of the Void',
        category: 'relic',
        description: 'A stellar vinyl disc vibrating with tranquil, celestial ambient harmonies.'
    },
    {
        id: 'trade_kinetic_shears',
        itemId: IDS.KINETIC_SHEARS,
        amount: 1,
        cost: 12,
        baseStock: 1,
        name: 'Kinetic Shears',
        category: 'gear',
        description: 'Accelerated planar shears that instantly harvest foliage, vines, tall grass, and sheep wool.'
    },
    {
        id: 'trade_strider_boots',
        itemId: IDS.STRIDER_BOOTS,
        amount: 1,
        cost: 15,
        baseStock: 1,
        name: 'Strider Boots',
        category: 'gear',
        description: 'Celestial winged boots that grant +25% player movement speed across all terrain.'
    },
    {
        id: 'trade_prism_glass',
        itemId: IDS.PRISM_GLASS,
        amount: 16,
        cost: 4,
        baseStock: 4,
        name: 'Prism Glass (x16)',
        category: 'tiles',
        description: 'Refractive, crystal-clear glass blocks that disperse rainbow light and sparkles.'
    },
    {
        id: 'trade_void_bricks',
        itemId: IDS.VOID_STONE_BRICK,
        amount: 32,
        cost: 6,
        baseStock: 4,
        name: 'Void Stone Brick (x32)',
        category: 'tiles',
        description: 'Dense obsidian-violet architectural bricks mortared with glowing planar energy.'
    },
    {
        id: 'trade_astral_shard',
        itemId: IDS.ASTRAL_SHARD,
        amount: 1,
        cost: 8,
        baseStock: 2,
        name: 'Astral Shard',
        category: 'material',
        description: 'A pure crystallised fragment of the Astral Void used to forge Astral equipment in the Astral Infuser.'
    },
    {
        id: 'trade_astral_infuser',
        itemId: IDS.ASTRAL_INFUSER,
        amount: 1,
        cost: 7,
        baseStock: 1,
        name: 'Astral Infuser',
        category: 'tiles',
        description: 'Celestial crafting station forged from rift matter. Infuses diamond tools and armor with Astral Shards.'
    }
];

class AtlasTradeManagerClass {
    constructor() {
        this.currentStock = {};
        this.rollNewStock();
    }

    rollNewStock() {
        this.currentStock = {};
        ATLAS_CATALOG.forEach(trade => {
            this.currentStock[trade.id] = trade.baseStock;
        });
    }

    getStock(tradeId) {
        return this.currentStock[tradeId] !== undefined ? this.currentStock[tradeId] : 0;
    }

    canAfford(tradeId) {
        const trade = ATLAS_CATALOG.find(t => t.id === tradeId);
        if (!trade) return false;
        return getPlayerAstralEmeralds() >= trade.cost;
    }

    buyItem(tradeId) {
        return this.executeTrade(tradeId);
    }

    executeTrade(tradeId) {
        const trade = ATLAS_CATALOG.find(t => t.id === tradeId);
        if (!trade) {
            showToast('Unknown item.');
            return false;
        }

        const stock = this.getStock(tradeId);
        if (stock <= 0) {
            showToast('Kael is sold out of this planar relic for this visit.');
            return false;
        }

        const playerBalance = getPlayerAstralEmeralds();
        if (playerBalance < trade.cost) {
            showToast(`Not enough Astral Emeralds! (Need ${trade.cost}, have ${playerBalance})`);
            return false;
        }

        // Multiplayer client routing
        if (isMultiplayer && !isMultiplayerAuthority()) {
            broadcastDataPacket({
                type: 'EXECUTE_ATLAS_TRADE_REQ',
                tradeId: trade.id
            });
            showToast('Requesting planar trade from host...');
            return true;
        }

        // Authority / Singleplayer execution
        return this._fulfillTrade(trade);
    }

    _fulfillTrade(trade) {
        const success = giveItem(trade.itemId, trade.amount);
        if (!success) {
            showToast('Backpack is full! Clear inventory space before trading.');
            return false;
        }

        // Deduct Astral Emeralds
        addPlayerAstralEmeralds(-trade.cost);

        // Decrement stock
        this.currentStock[trade.id] = Math.max(0, (this.currentStock[trade.id] || 1) - 1);

        // Feedback
        playSound('astral_exchange');
        showToast(`✦ Acquired ${trade.name}! (-${trade.cost} Astral Emeralds)`);
        unlockAchievement('astral_pioneer');
        unlockAchievement('cosmic_merchant');

        // Broadcast updated stock to multiplayer peers if host
        if (isMultiplayer && isMultiplayerAuthority()) {
            broadcastDataPacket({
                type: 'EXECUTE_ATLAS_TRADE_RES',
                tradeId: trade.id,
                remainingStock: this.currentStock[trade.id]
            });
        }

        // Refresh Market UI & currency counters if open
        if (typeof window !== 'undefined') {
            if (typeof window.updateEmeraldsUI === 'function') window.updateEmeraldsUI();
            if (typeof window.renderAtlasMarketWares === 'function') window.renderAtlasMarketWares();
        }

        return true;
    }

    handleTradeRequestFromPeer(packet, peerId) {
        if (!packet || !packet.tradeId) return;
        const trade = ATLAS_CATALOG.find(t => t.id === packet.tradeId);
        if (!trade) return;

        const stock = this.getStock(trade.id);
        if (stock <= 0) {
            broadcastDataPacket({
                type: 'ATLAS_TRADE_FAILED',
                reason: 'Item sold out',
                targetPeerId: peerId
            });
            return;
        }

        this.currentStock[trade.id] = Math.max(0, stock - 1);
        broadcastDataPacket({
            type: 'EXECUTE_ATLAS_TRADE_RES',
            tradeId: trade.id,
            remainingStock: this.currentStock[trade.id],
            targetPeerId: peerId
        });
    }

    handleTradeResponse(packet) {
        if (!packet || !packet.tradeId) return;
        const trade = ATLAS_CATALOG.find(t => t.id === packet.tradeId);
        if (!trade) return;

        if (packet.remainingStock !== undefined) {
            this.currentStock[trade.id] = packet.remainingStock;
        }

        if (packet.targetPeerId && packet.targetPeerId !== window.myPeerId) {
            // Updated for other peer, just update local stock count
            if (typeof window !== 'undefined' && typeof window.renderAtlasMarketWares === 'function') {
                window.renderAtlasMarketWares();
            }
            return;
        }

        const playerBalance = getPlayerAstralEmeralds();
        if (playerBalance >= trade.cost) {
            addPlayerAstralEmeralds(-trade.cost);
            giveItem(trade.itemId, trade.amount);
            playSound('astral_exchange');
            showToast(`✦ Acquired ${trade.name}! (-${trade.cost} Astral Emeralds)`);
            unlockAchievement('astral_pioneer');
            if (typeof window !== 'undefined') {
                if (typeof window.updateEmeraldsUI === 'function') window.updateEmeraldsUI();
                if (typeof window.renderAtlasMarketWares === 'function') window.renderAtlasMarketWares();
            }
        }
    }
}

export const AtlasTradeManager = new AtlasTradeManagerClass();

if (typeof window !== 'undefined') {
    window.AtlasTradeManager = AtlasTradeManager;
    window.ATLAS_CATALOG = ATLAS_CATALOG;
}

