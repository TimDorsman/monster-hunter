import type { BattleLogEntry } from "~~/types/battle";
import type {
	BattleLootRarityClass,
	BattleTurnViewState,
} from "~~/types/battle-ui";
import type { LootRarity } from "~~/types/loot";
import type { BattleRewardClaimStatus } from "~~/utils/battle/rewards";

export function getBattleLogSourceLabel(source: BattleLogEntry["source"]) {
	if (source === "hunter") {
		return "Hunter";
	}

	if (source === "monster") {
		return "Monster";
	}

	return "System";
}

export function getBattleLogItemClass(source: BattleLogEntry["source"]) {
	if (source === "hunter") {
		return "battle-log-item-hunter";
	}

	if (source === "monster") {
		return "battle-log-item-monster";
	}

	return "battle-log-item-system";
}

export function getLootRarityClass(
	rarity: LootRarity,
): BattleLootRarityClass {
	return `loot-rarity-${rarity}`;
}

export function getBattleRewardActionLabel(canClaimResolvedReward: boolean) {
	if (canClaimResolvedReward) {
		return "Claim Reward";
	}

	return "Continue";
}

export function getBattleRewardStatusMessage(
	rewardClaimStatus: BattleRewardClaimStatus,
	hasClaimedCurrentReward: boolean,
) {
	if (rewardClaimStatus === "spectator") {
		return "Spectators can inspect the loot, but only active hunters can claim it.";
	}

	if (rewardClaimStatus === "ineligible") {
		return "Only hunters alive when the monster fell can claim this reward.";
	}

	if (rewardClaimStatus === "claimed" || hasClaimedCurrentReward) {
		return "You already claimed this reward.";
	}

	return "Claim the reward to bank the gold and materials in your inventory.";
}

export function getBattleTurnBannerClassState(
	turnViewState: BattleTurnViewState,
	isPlayerTurn: boolean,
) {
	return {
		"turn-banner-player": isPlayerTurn,
		"turn-banner-monster": turnViewState.isMonsterTurn,
		"turn-banner-other": turnViewState.isOtherHunterTurn,
	};
}
