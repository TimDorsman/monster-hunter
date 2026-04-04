export type LootRarity =
	| "common"
	| "uncommon"
	| "rare"
	| "epic"
	| "legendary"
	| "mythic";

export type LootCategory = "material" | "trophy" | "core";

export type LootItemDefinition = {
	id: string;
	name: string;
	rarity: LootRarity;
	category: LootCategory;
	baseSellValue: number;
	craftingTags: string[];
};

export type LootTableEntry = {
	itemId: string;
	chance: number;
	minQuantity: number;
	maxQuantity: number;
};

export type ResolvedLootDrop = {
	itemId: string;
	name: string;
	rarity: LootRarity;
	category: LootCategory;
	baseSellValue: number;
	craftingTags: string[];
	quantity: number;
};

export type BattleReward = {
	rewardId: string;
	monsterId: number;
	monsterName: string;
	monsterLevel: number;
	gold: number;
	drops: ResolvedLootDrop[];
	eligibleHunterIds: string[];
	createdAt: number;
};

export type InventoryEntry = {
	itemId: string;
	quantity: number;
	rarity: LootRarity;
	baseSellValue: number;
	category: LootCategory;
	craftingTags: string[];
	timesSold: number;
	lastObtainedAt: number;
};

export type CraftingRequirement = {
	itemId: string;
	quantity: number;
};

export type PlayerProgress = {
	level: number;
	experience: number;
	gold: number;
	inventory: InventoryEntry[];
	claimedRewardIds: string[];
};
