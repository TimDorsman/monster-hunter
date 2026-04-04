import lootCatalogData from "~~/app/data/loot.json";
import type {
	BattleReward,
	CraftingRequirement,
	InventoryEntry,
	LootItemDefinition,
	LootRarity,
	LootTableEntry,
	PlayerProgress,
	ResolvedLootDrop,
} from "~~/types/loot";

const lootCatalog = lootCatalogData as LootItemDefinition[];
const lootCatalogById = new Map(
	lootCatalog.map((itemDefinition) => [itemDefinition.id, itemDefinition]),
);

export const lootRarityLabels: Record<LootRarity, string> = {
	common: "Common",
	uncommon: "Uncommon",
	rare: "Rare",
	epic: "Epic",
	legendary: "Legendary",
	mythic: "Mythic",
};

export const lootRarityMultipliers: Record<LootRarity, number> = {
	common: 1,
	uncommon: 1.35,
	rare: 1.85,
	epic: 2.6,
	legendary: 3.8,
	mythic: 5.4,
};

function clampPositiveInteger(value: number, fallback: number) {
	if (!Number.isFinite(value)) {
		return fallback;
	}

	return Math.max(1, Math.floor(value));
}

function cloneInventoryEntry(entry: InventoryEntry): InventoryEntry {
	return {
		...entry,
		craftingTags: [...entry.craftingTags],
	};
}

function sortInventoryEntriesByRecent(
	leftEntry: InventoryEntry,
	rightEntry: InventoryEntry,
) {
	return rightEntry.lastObtainedAt - leftEntry.lastObtainedAt;
}

function rollDropQuantity(
	entry: Pick<LootTableEntry, "minQuantity" | "maxQuantity">,
	random: () => number,
) {
	const minQuantity = clampPositiveInteger(entry.minQuantity, 1);
	const maxQuantity = clampPositiveInteger(entry.maxQuantity, minQuantity);
	if (maxQuantity <= minQuantity) {
		return minQuantity;
	}

	const quantityRange = maxQuantity - minQuantity + 1;
	return minQuantity + Math.floor(random() * quantityRange);
}

export function getLootCatalog() {
	return lootCatalog.map((itemDefinition) => ({
		...itemDefinition,
		craftingTags: [...itemDefinition.craftingTags],
	}));
}

export function getLootItemDefinition(itemId: string) {
	const itemDefinition = lootCatalogById.get(itemId);
	if (!itemDefinition) {
		return null;
	}

	return {
		...itemDefinition,
		craftingTags: [...itemDefinition.craftingTags],
	};
}

export function requireLootItemDefinition(itemId: string) {
	const itemDefinition = getLootItemDefinition(itemId);
	if (!itemDefinition) {
		throw new Error(`Unknown loot item id: ${itemId}`);
	}

	return itemDefinition;
}

export function calculateLootSellPrice(
	baseSellValue: number,
	rarity: LootRarity,
	quantity = 1,
) {
	const safeBaseSellValue = clampPositiveInteger(baseSellValue, 1);
	const safeQuantity = clampPositiveInteger(quantity, 1);
	return Math.max(
		safeQuantity,
		Math.round(
			safeBaseSellValue * lootRarityMultipliers[rarity] * safeQuantity,
		),
	);
}

export function resolveLootTableDrops(
	lootTable: LootTableEntry[],
	random: () => number = Math.random,
) {
	const drops: ResolvedLootDrop[] = [];

	for (const entry of lootTable) {
		const didDrop = random() * 100 < entry.chance;
		if (!didDrop) {
			continue;
		}

		const itemDefinition = requireLootItemDefinition(entry.itemId);
		drops.push({
			itemId: itemDefinition.id,
			name: itemDefinition.name,
			rarity: itemDefinition.rarity,
			category: itemDefinition.category,
			baseSellValue: itemDefinition.baseSellValue,
			craftingTags: [...itemDefinition.craftingTags],
			quantity: rollDropQuantity(entry, random),
		});
	}

	if (drops.length > 0) {
		return drops;
	}

	const fallbackEntry = lootTable[0];
	if (!fallbackEntry) {
		return [];
	}

	const fallbackItemDefinition = requireLootItemDefinition(fallbackEntry.itemId);
	return [
		{
			itemId: fallbackItemDefinition.id,
			name: fallbackItemDefinition.name,
			rarity: fallbackItemDefinition.rarity,
			category: fallbackItemDefinition.category,
			baseSellValue: fallbackItemDefinition.baseSellValue,
			craftingTags: [...fallbackItemDefinition.craftingTags],
			quantity: Math.max(1, Math.floor(fallbackEntry.minQuantity)),
		},
	];
}

export function calculateBattleRewardGold(
	monsterLevel: number,
	experienceReward: number,
	drops: ResolvedLootDrop[],
) {
	const totalDropValue = drops.reduce((totalValue, drop) => {
		return totalValue + calculateLootSellPrice(
			drop.baseSellValue,
			drop.rarity,
			drop.quantity,
		);
	}, 0);

	const levelBonus = Math.max(12, monsterLevel * 18);
	const experienceBonus = Math.max(10, Math.round(experienceReward * 1.35));
	const dropBonus = Math.round(totalDropValue * 0.35);
	return Math.max(24, levelBonus + experienceBonus + dropBonus);
}

export function createInventoryEntry(
	drop: ResolvedLootDrop,
	obtainedAt: number,
): InventoryEntry {
	return {
		itemId: drop.itemId,
		quantity: drop.quantity,
		rarity: drop.rarity,
		baseSellValue: drop.baseSellValue,
		category: drop.category,
		craftingTags: [...drop.craftingTags],
		timesSold: 0,
		lastObtainedAt: obtainedAt,
	};
}

export function stackInventoryEntries(inventory: InventoryEntry[]) {
	const stackedInventoryByItemId = new Map<string, InventoryEntry>();

	for (const inventoryEntry of inventory) {
		const clonedEntry = cloneInventoryEntry(inventoryEntry);
		const existingEntry = stackedInventoryByItemId.get(clonedEntry.itemId);
		if (!existingEntry) {
			stackedInventoryByItemId.set(clonedEntry.itemId, clonedEntry);
			continue;
		}

		existingEntry.quantity += clonedEntry.quantity;
		existingEntry.lastObtainedAt = Math.max(
			existingEntry.lastObtainedAt,
			clonedEntry.lastObtainedAt,
		);
		existingEntry.timesSold += clonedEntry.timesSold;
	}

	return Array.from(stackedInventoryByItemId.values()).sort(
		sortInventoryEntriesByRecent,
	);
}

export function mergeInventoryDrops(
	inventory: InventoryEntry[],
	drops: ResolvedLootDrop[],
	obtainedAt = Date.now(),
) {
	const nextInventory = stackInventoryEntries(inventory);

	for (const drop of drops) {
		const existingEntry = nextInventory.find(
			(inventoryEntry) => inventoryEntry.itemId === drop.itemId,
		);

		if (existingEntry) {
			existingEntry.quantity += drop.quantity;
			existingEntry.lastObtainedAt = obtainedAt;
			continue;
		}

		nextInventory.push(createInventoryEntry(drop, obtainedAt));
	}

	return nextInventory.sort(sortInventoryEntriesByRecent);
}

export function calculateInventoryEntrySellValue(entry: InventoryEntry) {
	return calculateLootSellPrice(
		entry.baseSellValue,
		entry.rarity,
		entry.quantity,
	);
}

export function calculateInventorySellTotal(inventory: InventoryEntry[]) {
	return stackInventoryEntries(inventory).reduce((totalValue, inventoryEntry) => {
		return totalValue + calculateInventoryEntrySellValue(inventoryEntry);
	}, 0);
}

export function canConsumeInventoryRequirements(
	inventory: InventoryEntry[],
	requirements: CraftingRequirement[],
) {
	for (const requirement of requirements) {
		const matchingQuantity = inventory
			.filter(
				(inventoryEntry) => inventoryEntry.itemId === requirement.itemId,
			)
			.reduce((totalQuantity, inventoryEntry) => {
				return totalQuantity + inventoryEntry.quantity;
			}, 0);

		if (matchingQuantity < requirement.quantity) {
			return false;
		}

		const hasMatchingEntry = inventory.some(
			(inventoryEntry) => inventoryEntry.itemId === requirement.itemId,
		);
		if (!hasMatchingEntry) {
			return false;
		}
	}

	return true;
}

export function consumeInventoryRequirements(
	inventory: InventoryEntry[],
	requirements: CraftingRequirement[],
) {
	const nextInventory = inventory.map(cloneInventoryEntry);
	if (!canConsumeInventoryRequirements(nextInventory, requirements)) {
		return nextInventory;
	}

	for (const requirement of requirements) {
		let quantityToConsume = requirement.quantity;

		for (const matchingEntry of nextInventory.filter(
			(inventoryEntry) => inventoryEntry.itemId === requirement.itemId,
		)) {
			if (quantityToConsume <= 0) {
				break;
			}

			const consumedQuantity = Math.min(
				matchingEntry.quantity,
				quantityToConsume,
			);
			matchingEntry.quantity -= consumedQuantity;
			quantityToConsume -= consumedQuantity;
		}
	}

	return nextInventory.filter((inventoryEntry) => inventoryEntry.quantity > 0);
}

export function formatResolvedLootDrop(drop: ResolvedLootDrop) {
	return `${drop.quantity}x ${drop.name} (${lootRarityLabels[drop.rarity]})`;
}

export function formatBattleRewardSummary(reward: BattleReward) {
	const summaryParts: string[] = [];
	if (reward.gold > 0) {
		summaryParts.push(`${reward.gold} gold`);
	}

	const dropSummaries = reward.drops.map((drop) => formatResolvedLootDrop(drop));
	if (dropSummaries.length > 0) {
		summaryParts.push(dropSummaries.join(", "));
	}

	if (summaryParts.length === 0) {
		return "nothing";
	}

	if (summaryParts.length === 1) {
		return summaryParts[0];
	}

	const lastSummaryPart = summaryParts.pop();
	if (!lastSummaryPart) {
		return summaryParts.join(", ");
	}

	return `${summaryParts.join(", ")} and ${lastSummaryPart}`;
}

export function clonePlayerProgress(progress: PlayerProgress): PlayerProgress {
	return {
		level: progress.level,
		experience: progress.experience,
		gold: progress.gold,
		inventory: progress.inventory.map(cloneInventoryEntry),
		claimedRewardIds: [...progress.claimedRewardIds],
	};
}
