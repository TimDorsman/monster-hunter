import { describe, expect, it } from "vitest";
import {
	claimBattleReward,
	getBattleRewardClaimStatus,
	sellAllInventory,
} from "~~/utils/battle/rewards";
import type { BattleReward, PlayerProgress } from "~~/types/loot";

function createPlayerProgress(): PlayerProgress {
	return {
		level: 3,
		experience: 40,
		gold: 25,
		inventory: [
			{
				itemId: "carapace-shard",
				quantity: 2,
				rarity: "rare",
				baseSellValue: 10,
				category: "material",
				craftingTags: [],
				appearance: 0.45,
				timesSold: 0,
				lastObtainedAt: 100,
			},
		],
		claimedRewardIds: [],
	};
}

function createReward(): BattleReward {
	return {
		rewardId: "reward-1",
		monsterId: 1,
		monsterName: "Ash Drake",
		monsterLevel: 4,
		gold: 80,
		drops: [
			{
				itemId: "ash-scale",
				name: "Ash Scale",
				rarity: "uncommon",
				category: "material",
				baseSellValue: 8,
				craftingTags: [],
				quantity: 3,
				appearance: 0.73,
			},
		],
		eligibleHunterIds: ["player-1"],
		createdAt: 1234,
	};
}

describe("battle rewards", () => {
	it("reports claimable rewards for eligible active hunters", () => {
		expect(
			getBattleRewardClaimStatus(
				createPlayerProgress(),
				createReward(),
				"player-1",
				false,
			),
		).toBe("claimable");
	});

	it("applies gold, drops, and claim tracking when claiming a reward", () => {
		const result = claimBattleReward(
			createPlayerProgress(),
			createReward(),
			"player-1",
			false,
		);

		expect(result.claimed).toBe(true);
		expect(result.nextProgress.gold).toBe(105);
		expect(result.nextProgress.inventory).toHaveLength(2);
		expect(result.nextProgress.claimedRewardIds).toContain("reward-1");
	});

	it("sells the full inventory and banks the gold", () => {
		const result = sellAllInventory(createPlayerProgress());

		expect(result.sold).toBe(true);
		expect(result.goldEarned).toBeGreaterThan(0);
		expect(result.nextProgress.inventory).toEqual([]);
		expect(result.nextProgress.gold).toBe(62);
	});
});
