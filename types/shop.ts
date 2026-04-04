import type { PlayerProgress, LootItemDefinition } from "~~/types/loot";

export type ShopActionFailureReason =
	| "empty-inventory"
	| "insufficient-gold"
	| "missing-item";

export type ShopPurchaseResult = {
	purchased: boolean;
	nextProgress: PlayerProgress;
	goldSpent: number;
	itemId: string;
	quantity: number;
	reason?: ShopActionFailureReason;
};

export type ShopSaleResult = {
	sold: boolean;
	nextProgress: PlayerProgress;
	goldEarned: number;
	itemId: string;
	quantity: number;
	reason?: ShopActionFailureReason;
};

export type ShopCatalogRow = LootItemDefinition & {
	buyPrice: number;
	canAfford: boolean;
	ownedQuantity: number;
};

export type ShopFeedbackTone = "neutral" | "success" | "danger";

export type ShopFeedback = {
	message: string;
	tone: ShopFeedbackTone;
};
