import { computed, onMounted, onScopeDispose, ref } from "vue";
import type { BattleInventoryRow } from "~~/types/battle-ui";
import type { BattleStateMessage } from "~~/types/battle";
import type { LootItemDefinition } from "~~/types/loot";
import type {
	ShopCatalogRow,
	ShopFeedback,
	ShopStatePayload,
} from "~~/types/shop";
import { getLootItemDefinition } from "~~/utils/loot";
import { createDefaultBattleGameSettings } from "~~/utils/game-settings";
import { sellAllInventory } from "~~/utils/battle/rewards";
import {
	buyLootItem,
	calculateLootBuyPrice,
	getShopCatalog,
	sellInventoryItem,
} from "~~/utils/shop";
import { useBattleSocket } from "~/composables/battle/useBattleSocket";
import { useBattlePlayerProgress } from "~/composables/battle/useBattlePlayerProgress";

const DEFAULT_FEEDBACK: ShopFeedback = {
	message: "Trade monster loot for gold, then restock your crafting materials.",
	tone: "neutral",
};

const PLAYER_NAME = "Swifty Mercury";

function createDefaultShopStatePayload(): ShopStatePayload {
	return {
		stockItemIds: [],
		nextRefreshAt: Date.now(),
	};
}

export function useShop() {
	const playerProgress = useBattlePlayerProgress();
	const feedback = ref<ShopFeedback>(DEFAULT_FEEDBACK);
	const currentTime = ref(Date.now());
	const sharedShopState = ref<ShopStatePayload>(createDefaultShopStatePayload());

	const shopCatalog = getShopCatalog();
	const catalogById = new Map(
		shopCatalog.map((itemDefinition) => [itemDefinition.id, itemDefinition]),
	);

	let countdownTimer: ReturnType<typeof setInterval> | null = null;

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

		return sharedShopState.value.stockItemIds
			.map((itemId) => catalogById.get(itemId) ?? null)
			.filter(
				(itemDefinition): itemDefinition is LootItemDefinition =>
					Boolean(itemDefinition),
			)
			.map((itemDefinition) => {
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

	const remainingTotalSeconds = computed(() => {
		const millisecondsRemaining =
			sharedShopState.value.nextRefreshAt - currentTime.value;
		return Math.max(0, Math.ceil(millisecondsRemaining / 1000));
	});
	const refreshMinutes = computed(() =>
		Math.floor(remainingTotalSeconds.value / 60),
	);
	const refreshSeconds = computed(() => remainingTotalSeconds.value % 60);
	const stockItemCount = computed(() => merchantRows.value.length);

	function applySharedShopState(message: BattleStateMessage) {
		sharedShopState.value = message.state.shop;
		currentTime.value = Date.now();
	}

	const socket = useBattleSocket({
		playerId: playerProgress.playerId,
		playerName: PLAYER_NAME,
		getPlayerLevel: () => playerProgress.playerLevel.value,
		getPlayerExperience: () => playerProgress.playerExperience.value,
		getGameSettings: () => createDefaultBattleGameSettings(),
		onStateMessage: applySharedShopState,
		syncSettingsOnOpen: false,
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

	onMounted(() => {
		socket.connect();
		countdownTimer = setInterval(() => {
			currentTime.value = Date.now();
		}, 1000);
	});

	onScopeDispose(() => {
		if (!countdownTimer) {
			return;
		}

		clearInterval(countdownTimer);
		countdownTimer = null;
	});

	return {
		playerGold: playerProgress.playerGold,
		inventoryRows,
		inventorySaleValue: playerProgress.playerInventorySaleValue,
		merchantRows,
		refreshMinutes,
		refreshSeconds,
		stockItemCount,
		feedback,
		buyItem,
		sellItemStack,
		sellAllItemStacks,
	};
}
