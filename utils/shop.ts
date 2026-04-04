import type {
	LootItemDefinition,
	LootRarity,
	PlayerProgress,
	ResolvedLootDrop,
} from "~~/types/loot";
import type {
	ShopPurchaseResult,
	ShopRotationState,
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

export const SHOP_BUY_PRICE_MULTIPLIER = 2;
export const SHOP_REFRESH_INTERVAL_MS = 10 * 60 * 1000;
export const SHOP_STOCK_SIZE = 6;

function clampPositiveInteger(value: number, fallback: number) {
	if (!Number.isFinite(value)) {
		return fallback;
	}

	return Math.max(1, Math.floor(value));
}

function getUniqueItemIds(itemIds: string[]) {
	return Array.from(new Set(itemIds));
}

function shuffleItemIds(
	itemIds: string[],
	random: () => number = Math.random,
) {
	const shuffledItemIds = [...itemIds];
	for (let index = shuffledItemIds.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(random() * (index + 1));
		const currentItemId = shuffledItemIds[index];
		shuffledItemIds[index] = shuffledItemIds[swapIndex] ?? currentItemId ?? "";
		shuffledItemIds[swapIndex] = currentItemId ?? shuffledItemIds[index] ?? "";
	}

	return shuffledItemIds;
}

function getResolvedShopStockSize(itemCount: number) {
	if (itemCount <= 0) {
		return 0;
	}

	return Math.min(SHOP_STOCK_SIZE, itemCount);
}

function createStockItemIds(
	catalogOrderItemIds: string[],
	rotationIndex: number,
) {
	const stockSize = getResolvedShopStockSize(catalogOrderItemIds.length);
	if (stockSize === 0) {
		return [];
	}

	return catalogOrderItemIds.slice(rotationIndex, rotationIndex + stockSize);
}

function advanceSingleShopRotationState(
	rotationState: ShopRotationState,
	random: () => number = Math.random,
) {
	const uniqueCatalogOrderItemIds = getUniqueItemIds(
		rotationState.catalogOrderItemIds,
	);
	const stockSize = getResolvedShopStockSize(uniqueCatalogOrderItemIds.length);
	if (stockSize === 0) {
		return {
			catalogOrderItemIds: [],
			stockItemIds: [],
			rotationIndex: 0,
			nextRefreshAt: rotationState.nextRefreshAt + SHOP_REFRESH_INTERVAL_MS,
		};
	}

	if (uniqueCatalogOrderItemIds.length <= stockSize) {
		const shuffledCatalogOrderItemIds = shuffleItemIds(
			uniqueCatalogOrderItemIds,
			random,
		);
		return {
			catalogOrderItemIds: shuffledCatalogOrderItemIds,
			stockItemIds: shuffledCatalogOrderItemIds.slice(0, stockSize),
			rotationIndex: stockSize,
			nextRefreshAt: rotationState.nextRefreshAt + SHOP_REFRESH_INTERVAL_MS,
		};
	}

	let nextCatalogOrderItemIds = [...uniqueCatalogOrderItemIds];
	let nextRotationIndex = rotationState.rotationIndex;
	if (nextRotationIndex + stockSize > nextCatalogOrderItemIds.length) {
		nextCatalogOrderItemIds = shuffleItemIds(nextCatalogOrderItemIds, random);
		nextRotationIndex = 0;
	}

	const stockItemIds = createStockItemIds(
		nextCatalogOrderItemIds,
		nextRotationIndex,
	);

	return {
		catalogOrderItemIds: nextCatalogOrderItemIds,
		stockItemIds,
		rotationIndex: nextRotationIndex + stockItemIds.length,
		nextRefreshAt: rotationState.nextRefreshAt + SHOP_REFRESH_INTERVAL_MS,
	};
}

function hasExactCatalogCoverage(
	catalogOrderItemIds: string[],
	validCatalogItemIds: string[],
) {
	if (catalogOrderItemIds.length !== validCatalogItemIds.length) {
		return false;
	}

	const validItemIds = new Set(validCatalogItemIds);
	return catalogOrderItemIds.every((itemId) => validItemIds.has(itemId));
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

export function createShopRotationState(
	catalogItemIds: string[],
	now = Date.now(),
	random: () => number = Math.random,
): ShopRotationState {
	const uniqueCatalogItemIds = getUniqueItemIds(catalogItemIds);
	const stockSize = getResolvedShopStockSize(uniqueCatalogItemIds.length);
	if (stockSize === 0) {
		return {
			catalogOrderItemIds: [],
			stockItemIds: [],
			rotationIndex: 0,
			nextRefreshAt: now + SHOP_REFRESH_INTERVAL_MS,
		};
	}

	const catalogOrderItemIds = shuffleItemIds(uniqueCatalogItemIds, random);
	const stockItemIds = createStockItemIds(catalogOrderItemIds, 0);

	return {
		catalogOrderItemIds,
		stockItemIds,
		rotationIndex: stockItemIds.length,
		nextRefreshAt: now + SHOP_REFRESH_INTERVAL_MS,
	};
}

export function sanitizeShopRotationState(
	rawState: unknown,
	validCatalogItemIds: string[],
): ShopRotationState | null {
	if (!rawState || typeof rawState !== "object") {
		return null;
	}

	const candidate = rawState as Partial<ShopRotationState>;
	const validItemIds = new Set(validCatalogItemIds);
	const catalogOrderItemIds = Array.isArray(candidate.catalogOrderItemIds)
		? getUniqueItemIds(
				candidate.catalogOrderItemIds.filter(
					(itemId): itemId is string =>
						typeof itemId === "string" && validItemIds.has(itemId),
				),
			)
		: [];

	if (!hasExactCatalogCoverage(catalogOrderItemIds, validCatalogItemIds)) {
		return null;
	}

	const stockSize = getResolvedShopStockSize(validCatalogItemIds.length);
	const stockItemIds = Array.isArray(candidate.stockItemIds)
		? getUniqueItemIds(
				candidate.stockItemIds.filter(
					(itemId): itemId is string =>
						typeof itemId === "string" &&
						catalogOrderItemIds.includes(itemId),
				),
			).slice(0, stockSize)
		: [];
	if (stockItemIds.length !== stockSize) {
		return null;
	}

	const rotationIndex = Number(candidate.rotationIndex);
	const nextRefreshAt = Number(candidate.nextRefreshAt);
	if (
		!Number.isFinite(rotationIndex) ||
		rotationIndex < 0 ||
		rotationIndex > catalogOrderItemIds.length ||
		!Number.isFinite(nextRefreshAt) ||
		nextRefreshAt <= 0
	) {
		return null;
	}

	return {
		catalogOrderItemIds,
		stockItemIds,
		rotationIndex: Math.floor(rotationIndex),
		nextRefreshAt: Math.floor(nextRefreshAt),
	};
}

export function resolveShopRotationState(
	rawState: unknown,
	validCatalogItemIds: string[],
	now = Date.now(),
	random: () => number = Math.random,
) {
	let nextRotationState =
		sanitizeShopRotationState(rawState, validCatalogItemIds) ??
		createShopRotationState(validCatalogItemIds, now, random);

	while (nextRotationState.nextRefreshAt <= now) {
		nextRotationState = advanceSingleShopRotationState(
			nextRotationState,
			random,
		);
	}

	return nextRotationState;
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

export function buyLootItem(
	progress: PlayerProgress,
	itemId: string,
	quantity = 1,
	obtainedAt = Date.now(),
): ShopPurchaseResult {
	const safeQuantity = clampPositiveInteger(quantity, 1);

	let itemDefinition: LootItemDefinition;
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
