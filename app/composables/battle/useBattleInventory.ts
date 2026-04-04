import type { BattleReward, PlayerProgress } from "~~/types/loot";
import {
	claimBattleReward,
	getBattleRewardClaimStatus,
	hasClaimedReward,
	type BattleRewardClaimStatus,
	sellAllInventory,
} from "~~/utils/battle/rewards";

export function useBattleInventory() {
	return {
		hasClaimedReward,
		getBattleRewardClaimStatus,
		claimBattleReward,
		sellAllInventory,
	};
}
