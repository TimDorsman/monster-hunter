import { computed, ref } from "vue";
import type { BattleInventoryRow } from "~~/types/battle-ui";
import type { ShopCatalogRow, ShopFeedback } from "~~/types/shop";
import { getLootItemDefinition } from "~~/utils/loot";
import { sellAllInventory } from "~~/utils/battle/rewards";
import {
	buyLootItem,
	calculateLootBuyPrice,
	getShopCatalog,
	sellInventoryItem,
} from "~~/utils/shop";
import { useBattlePlayerProgress } from "~/composables/battle/useBattlePlayerProgress";

const DEFAULT_FEEDBACK: ShopFeedback = {
	message: "Trade monster loot for gold, then restock your crafting materials.",
	tone: "neutral",
};

export function useShop() {
	const playerProgress = useBattlePlayerProgress();
	const feedback = ref<ShopFeedback>(DEFAULT_FEEDBACK);

	const inventoryRows = computed<BattleInventoryRow[]>(() => {
		return playerProgress.playerInventoryDetails.value;
	});

	const merchantRows = computed<ShopCatalogRow[]>(() => {
		const ownedQuantityByItemId = new Map(
			playerProgress.playerInventory.value.map((inventoryEntry) => [
				inventoryEntry.itemId,
				inventoryEntry.quantity,
			]),
		);

		return getShopCatalog().map((itemDefinition) => {
			const buyPrice = calculateLootBuyPrice(
				itemDefinition.baseSellValue,
				itemDefinition.rarity,
			);

			return {
				...itemDefinition,
				buyPrice,
				canAfford: playerProgress.playerGold.value >= buyPrice,
				ownedQuantity: ownedQuantityByItemId.get(itemDefinition.id) ?? 0,
			};
		});
	});

	function setFeedback(nextFeedback: ShopFeedback) {
		feedback.value = nextFeedback;
	}

	function buyItem(itemId: string) {
		const purchaseResult = buyLootItem(playerProgress.playerProgress.value, itemId);
		const itemDefinition = getLootItemDefinition(itemId);
		const itemName = itemDefinition?.name ?? itemId;
		if (!purchaseResult.purchased) {
			setFeedback({
				message: `You need more gold before you can buy ${itemName}.`,
				tone: "danger",
			});
			return false;
		}

		playerProgress.persistNextPlayerProgress(purchaseResult.nextProgress);
		setFeedback({
			message: `Bought ${itemName} for ${purchaseResult.goldSpent} gold.`,
			tone: "success",
		});
		return true;
	}

	function sellItemStack(itemId: string) {
		const inventoryRow = inventoryRows.value.find((row) => row.itemId === itemId);
		const itemName = inventoryRow?.name ?? itemId;
		const saleResult = sellInventoryItem(playerProgress.playerProgress.value, itemId);
		if (!saleResult.sold) {
			setFeedback({
				message: `There is no ${itemName} stack ready to sell.`,
				tone: "danger",
			});
			return 0;
		}

		playerProgress.persistNextPlayerProgress(saleResult.nextProgress);
		setFeedback({
			message: `Sold ${saleResult.quantity}x ${itemName} for ${saleResult.goldEarned} gold.`,
			tone: "success",
		});
		return saleResult.goldEarned;
	}

	function sellAllItemStacks() {
		const saleResult = sellAllInventory(playerProgress.playerProgress.value);
		if (!saleResult.sold) {
			setFeedback({
				message: "Your inventory is empty, so there is nothing to sell.",
				tone: "danger",
			});
			return 0;
		}

		playerProgress.persistNextPlayerProgress(saleResult.nextProgress);
		setFeedback({
			message: `Sold every loot stack for ${saleResult.goldEarned} gold.`,
			tone: "success",
		});
		return saleResult.goldEarned;
	}

	return {
		playerGold: playerProgress.playerGold,
		inventoryRows,
		inventorySaleValue: playerProgress.playerInventorySaleValue,
		merchantRows,
		feedback,
		buyItem,
		sellItemStack,
		sellAllItemStacks,
	};
}
