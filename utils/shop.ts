import type { PlayerProgress, LootRarity, ResolvedLootDrop } from "~~/types/loot";
import type {
	ShopPurchaseResult,
	ShopSaleResult,
} from "~~/types/shop";
import {
	calculateInventoryEntrySellValue,
	calculateLootSellPrice,
	clonePlayerProgress,
	getLootCatalog,
	lootRarityMultipliers,
	mergeInventoryDrops,
	requireLootItemDefinition,
	stackInventoryEntries,
} from "~~/utils/loot";

const SHOP_BUY_PRICE_MULTIPLIER = 2;

function clampPositiveInteger(value: number, fallback: number) {
	if (!Number.isFinite(value)) {
		return fallback;
	}

	return Math.max(1, Math.floor(value));
}

function createPurchasedDrop(
	itemId: string,
	quantity: number,
): ResolvedLootDrop {
	const itemDefinition = requireLootItemDefinition(itemId);

	return {
		itemId: itemDefinition.id,
		name: itemDefinition.name,
		rarity: itemDefinition.rarity,
		category: itemDefinition.category,
		baseSellValue: itemDefinition.baseSellValue,
		craftingTags: [...itemDefinition.craftingTags],
		quantity,
		appearance: 1,
	};
}

function sortShopCatalogByValue(
	leftItem: { rarity: LootRarity; baseSellValue: number; name: string },
	rightItem: { rarity: LootRarity; baseSellValue: number; name: string },
) {
	const rarityDifference =
		lootRarityMultipliers[leftItem.rarity] -
		lootRarityMultipliers[rightItem.rarity];
	if (rarityDifference !== 0) {
		return rarityDifference;
	}

	const valueDifference = leftItem.baseSellValue - rightItem.baseSellValue;
	if (valueDifference !== 0) {
		return valueDifference;
	}

	return leftItem.name.localeCompare(rightItem.name);
}

export function calculateLootBuyPrice(
	baseSellValue: number,
	rarity: LootRarity,
	quantity = 1,
) {
	const safeQuantity = clampPositiveInteger(quantity, 1);
	const sellPrice = calculateLootSellPrice(baseSellValue, rarity, safeQuantity);
	return Math.max(
		safeQuantity,
		Math.round(sellPrice * SHOP_BUY_PRICE_MULTIPLIER),
	);
}

export function getShopCatalog() {
	return getLootCatalog()
		.filter((itemDefinition) => itemDefinition.category === "material")
		.sort(sortShopCatalogByValue);
}

export function buyLootItem(
	progress: PlayerProgress,
	itemId: string,
	quantity = 1,
	obtainedAt = Date.now(),
): ShopPurchaseResult {
	const safeQuantity = clampPositiveInteger(quantity, 1);

	let itemDefinition: ReturnType<typeof requireLootItemDefinition>;
	try {
		itemDefinition = requireLootItemDefinition(itemId);
	} catch {
		return {
			purchased: false,
			nextProgress: progress,
			goldSpent: 0,
			itemId,
			quantity: safeQuantity,
			reason: "missing-item",
		};
	}

	const goldSpent = calculateLootBuyPrice(
		itemDefinition.baseSellValue,
		itemDefinition.rarity,
		safeQuantity,
	);
	if (progress.gold < goldSpent) {
		return {
			purchased: false,
			nextProgress: progress,
			goldSpent: 0,
			itemId,
			quantity: safeQuantity,
			reason: "insufficient-gold",
		};
	}

	const nextProgress = clonePlayerProgress(progress);
	nextProgress.gold -= goldSpent;
	nextProgress.inventory = mergeInventoryDrops(
		nextProgress.inventory,
		[createPurchasedDrop(itemId, safeQuantity)],
		obtainedAt,
	);

	return {
		purchased: true,
		nextProgress,
		goldSpent,
		itemId,
		quantity: safeQuantity,
	};
}

export function sellInventoryItem(
	progress: PlayerProgress,
	itemId: string,
): ShopSaleResult {
	if (progress.inventory.length === 0) {
		return {
			sold: false,
			nextProgress: progress,
			goldEarned: 0,
			itemId,
			quantity: 0,
			reason: "empty-inventory",
		};
	}

	const stackedInventory = stackInventoryEntries(progress.inventory);
	const inventoryEntry = stackedInventory.find(
		(entry) => entry.itemId === itemId,
	);
	if (!inventoryEntry) {
		return {
			sold: false,
			nextProgress: progress,
			goldEarned: 0,
			itemId,
			quantity: 0,
			reason: "missing-item",
		};
	}

	const nextProgress = clonePlayerProgress(progress);
	const goldEarned = calculateInventoryEntrySellValue(inventoryEntry);
	nextProgress.gold += goldEarned;
	nextProgress.inventory = stackedInventory.filter(
		(entry) => entry.itemId !== itemId,
	);

	return {
		sold: true,
		nextProgress,
		goldEarned,
		itemId,
		quantity: inventoryEntry.quantity,
	};
}
