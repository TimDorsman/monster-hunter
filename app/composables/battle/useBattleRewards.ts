import { computed } from "vue";
import type { BattleReward, PlayerProgress } from "~~/types/loot";
import {
	claimBattleReward,
	getBattleRewardClaimStatus,
	hasClaimedReward,
	sellAllInventory,
} from "~~/utils/battle/rewards";

type UseBattleRewardsOptions = {
	playerId: string;
	playerProgress: Ref<PlayerProgress>;
	resolvedReward: Ref<BattleReward | null>;
	isSpectator: Ref<boolean>;
	persistNextPlayerProgress: (nextProgress: PlayerProgress) => void;
};

export function useBattleRewards(options: UseBattleRewardsOptions) {
	const rewardClaimStatus = computed(() =>
		getBattleRewardClaimStatus(
			options.playerProgress.value,
			options.resolvedReward.value,
			options.playerId,
			options.isSpectator.value,
		),
	);
	const canClaimResolvedReward = computed(
		() => rewardClaimStatus.value === "claimable",
	);
	const hasClaimedCurrentReward = computed(() => {
		const reward = options.resolvedReward.value;
		if (!reward) {
			return false;
		}

		return hasClaimedReward(
			options.playerProgress.value,
			reward.rewardId,
		);
	});

	function claimResolvedBattleReward() {
		const rewardClaimResult = claimBattleReward(
			options.playerProgress.value,
			options.resolvedReward.value,
			options.playerId,
			options.isSpectator.value,
		);
		if (!rewardClaimResult.claimed) {
			return false;
		}

		options.persistNextPlayerProgress(rewardClaimResult.nextProgress);
		return true;
	}

	function sellAllPlayerInventory() {
		const sellInventoryResult = sellAllInventory(options.playerProgress.value);
		if (!sellInventoryResult.sold) {
			return 0;
		}

		options.persistNextPlayerProgress(sellInventoryResult.nextProgress);
		return sellInventoryResult.goldEarned;
	}

	return {
		rewardClaimStatus,
		canClaimResolvedReward,
		hasClaimedCurrentReward,
		claimResolvedBattleReward,
		sellAllPlayerInventory,
	};
}
