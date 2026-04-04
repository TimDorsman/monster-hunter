import type { InventoryEntry, LootRarity } from "~~/types/loot";

export type BattleInventoryRow = InventoryEntry & {
	name: string;
	stackValue: number;
};

export type EffectiveMonsterSettings = {
	health: number;
	retaliationMinDamage: number;
	retaliationDamageRange: number;
	attackChance: number;
	healChance: number;
};

export type BattleTurnViewState = {
	bannerLabel: string;
	hintLabel: string;
	isMonsterTurn: boolean;
	isOtherHunterTurn: boolean;
};

export type BattleLootRarityClass = `loot-rarity-${LootRarity}`;
