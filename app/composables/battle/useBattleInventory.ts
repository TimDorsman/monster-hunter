import type { BattleReward, PlayerProgress } from "~~/types/loot";
import {
	calculateInventorySellTotal,
	clonePlayerProgress,
	mergeInventoryDrops,
} from "~~/utils/loot";

export type BattleRewardClaimStatus =
	| "claimable"
	| "claimed"
	| "spectator"
	| "ineligible"
	| "missing";

export function useBattleInventory() {
	function hasClaimedReward(progress: PlayerProgress, rewardId: string) {
		return progress.claimedRewardIds.includes(rewardId);
	}

	function getBattleRewardClaimStatus(
		progress: PlayerProgress,
		reward: BattleReward | null,
		playerId: string,
		isSpectator: boolean,
	): BattleRewardClaimStatus {
		if (!reward) {
			return "missing";
		}

		if (isSpectator) {
			return "spectator";
		}

		if (!reward.eligibleHunterIds.includes(playerId)) {
			return "ineligible";
		}

		if (hasClaimedReward(progress, reward.rewardId)) {
			return "claimed";
		}

		return "claimable";
	}

	function claimBattleReward(
		progress: PlayerProgress,
		reward: BattleReward | null,
		playerId: string,
		isSpectator: boolean,
	) {
		const claimStatus = getBattleRewardClaimStatus(
			progress,
			reward,
			playerId,
			isSpectator,
		);
		if (!reward || claimStatus !== "claimable") {
			return {
				claimed: false,
				claimStatus,
				nextProgress: progress,
			};
		}

		const nextProgress = clonePlayerProgress(progress);
		nextProgress.gold += reward.gold;
		nextProgress.inventory = mergeInventoryDrops(
			nextProgress.inventory,
			reward.drops,
			reward.createdAt,
		);
		nextProgress.claimedRewardIds.push(reward.rewardId);

		return {
			claimed: true,
			claimStatus,
			nextProgress,
		};
	}

	function sellAllInventory(progress: PlayerProgress) {
		if (progress.inventory.length === 0) {
			return {
				sold: false,
				goldEarned: 0,
				nextProgress: progress,
			};
		}

		const nextProgress = clonePlayerProgress(progress);
		const goldEarned = calculateInventorySellTotal(nextProgress.inventory);
		if (goldEarned <= 0) {
			return {
				sold: false,
				goldEarned: 0,
				nextProgress: progress,
			};
		}

		nextProgress.gold += goldEarned;
		nextProgress.inventory = [];

		return {
			sold: true,
			goldEarned,
			nextProgress,
		};
	}

	return {
		hasClaimedReward,
		getBattleRewardClaimStatus,
		claimBattleReward,
		sellAllInventory,
	};
}
