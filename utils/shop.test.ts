import { describe, expect, it } from "vitest";
import type { PlayerProgress } from "~~/types/loot";
import {
	buyLootItem,
	calculateLootBuyPrice,
	createShopRotationState,
	getShopCatalog,
	resolveShopRotationState,
	SHOP_REFRESH_INTERVAL_MS,
	sellInventoryItem,
} from "~~/utils/shop";

function createPlayerProgress(): PlayerProgress {
	return {
		level: 2,
		experience: 14,
		gold: 100,
		inventory: [
			{
				itemId: "brinebone-shard",
				quantity: 2,
				rarity: "common",
				baseSellValue: 12,
				category: "material",
				craftingTags: ["bone", "water", "scale"],
				timesSold: 0,
				lastObtainedAt: 100,
			},
		],
		claimedRewardIds: [],
	};
}

describe("shop utils", () => {
	it("calculates merchant prices as a markup over sell value", () => {
		expect(calculateLootBuyPrice(12, "common")).toBe(24);
		expect(calculateLootBuyPrice(20, "uncommon", 2)).toBe(108);
	});

	it("filters merchant stock to crafting materials", () => {
		const shopCatalog = getShopCatalog();

		expect(shopCatalog.length).toBeGreaterThan(0);
		expect(shopCatalog.every((item) => item.category === "material")).toBe(
			true,
		);
	});

	it("creates a six-item rotating stock window", () => {
		const itemIds = getShopCatalog().map((item) => item.id);
		const rotationState = createShopRotationState(itemIds, 5_000, () => 0);

		expect(rotationState.stockItemIds).toHaveLength(6);
		expect(rotationState.rotationIndex).toBe(6);
		expect(rotationState.nextRefreshAt).toBe(5_000 + SHOP_REFRESH_INTERVAL_MS);
	});

	it("advances expired stock windows to a fresh future refresh", () => {
		const itemIds = getShopCatalog().map((item) => item.id);
		const initialRotationState = createShopRotationState(
			itemIds,
			1_000,
			() => 0,
		);

		const resolvedRotationState = resolveShopRotationState(
			initialRotationState,
			itemIds,
			initialRotationState.nextRefreshAt + SHOP_REFRESH_INTERVAL_MS + 10,
			() => 0,
		);

		expect(resolvedRotationState.nextRefreshAt).toBeGreaterThan(
			initialRotationState.nextRefreshAt + SHOP_REFRESH_INTERVAL_MS,
		);
		expect(resolvedRotationState.stockItemIds).toHaveLength(6);
		expect(resolvedRotationState.stockItemIds).not.toEqual(
			initialRotationState.stockItemIds,
		);
	});

	it("adds purchased items to the shared inventory and removes gold", () => {
		const result = buyLootItem(createPlayerProgress(), "deepsea-frill");

		expect(result.purchased).toBe(true);
		expect(result.goldSpent).toBe(54);
		expect(result.nextProgress.gold).toBe(46);
		expect(result.nextProgress.inventory).toHaveLength(2);
		expect(result.nextProgress.inventory[0]?.itemId).toBe("deepsea-frill");
	});

	it("blocks purchases when the player cannot afford the item", () => {
		const progress = createPlayerProgress();
		progress.gold = 10;

		const result = buyLootItem(progress, "deepsea-frill");

		expect(result.purchased).toBe(false);
		expect(result.reason).toBe("insufficient-gold");
		expect(result.nextProgress).toBe(progress);
	});

	it("sells a stacked inventory entry for gold", () => {
		const result = sellInventoryItem(createPlayerProgress(), "brinebone-shard");

		expect(result.sold).toBe(true);
		expect(result.goldEarned).toBe(24);
		expect(result.nextProgress.gold).toBe(124);
		expect(result.nextProgress.inventory).toEqual([]);
	});
});
