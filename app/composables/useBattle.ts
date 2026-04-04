import { computed } from "vue";
import type { BattleGameSettings } from "~~/types/game-settings";
import { calculateRequiredExperience } from "~~/utils/battle/progression";
import { createDefaultBattleGameSettings } from "~~/utils/game-settings";
import { useBattleAudio } from "~/composables/battle/useBattleAudio";
import { useBattlePlayerProgress } from "~/composables/battle/useBattlePlayerProgress";
import { useBattleRewards } from "~/composables/battle/useBattleRewards";
import { useBattleSelectors } from "~/composables/battle/useBattleSelectors";
import { useBattleSession } from "~/composables/battle/useBattleSession";
import { useBattleSettingsManager } from "~/composables/battle/useBattleSettingsManager";

const PLAYER_NAME = "Swifty Mercury";

export function useBattle() {
	const { unlockAudio } = useBattleAudio();
	const playerProgress = useBattlePlayerProgress();

	let getGameSettings = () => createDefaultBattleGameSettings();
	let applyRemoteSettings = (_settings: BattleGameSettings) => undefined;

	const session = useBattleSession({
		playerId: playerProgress.playerId,
		playerName: PLAYER_NAME,
		getPlayerLevel: () => playerProgress.playerLevel.value,
		getPlayerExperience: () => playerProgress.playerExperience.value,
		getGameSettings: () => getGameSettings(),
		applyRemoteSettings: (settings) => applyRemoteSettings(settings),
		updatePlayerCombatProgress: playerProgress.updatePlayerCombatProgress,
	});

	const settingsManager = useBattleSettingsManager({
		currentMonster: session.currentMonster,
		sendSettings: session.sendSettings,
	});

	getGameSettings = () => settingsManager.settings.value;
	applyRemoteSettings = settingsManager.applyRemoteSettings;

	const selectors = useBattleSelectors({
		playerId: playerProgress.playerId,
		hunters: session.hunters,
		currentMonster: session.currentMonster,
		monsterHealth: session.monsterHealth,
		playerHealth: session.playerHealth,
		battleEnded: session.battleEnded,
		isSpectator: session.isSpectator,
		turnHunterId: session.turnHunterId,
		attackLogs: session.attackLogs,
		monsterBurnRounds: session.monsterBurnRounds,
		settings: settingsManager.settings,
		isAwaitingMonsterAttack: session.isAwaitingMonsterAttack,
	});

	const rewards = useBattleRewards({
		playerId: playerProgress.playerId,
		playerProgress: playerProgress.playerProgress,
		resolvedReward: session.resolvedReward,
		isSpectator: session.isSpectator,
		persistNextPlayerProgress: playerProgress.persistNextPlayerProgress,
	});

	const experienceRequiredForNextLevel = computed(() =>
		calculateRequiredExperience(playerProgress.playerLevel.value),
	);
	const experiencePercentToNextLevel = computed(() => {
		const requiredExperience = experienceRequiredForNextLevel.value;
		if (requiredExperience <= 0) {
			return 0;
		}

		return Math.min(
			100,
			Math.round(
				(playerProgress.playerExperience.value / requiredExperience) * 100,
			),
		);
	});

	return {
		isLoading: session.isLoading,
		connectionStatus: session.connectionStatus,
		currentMonster: session.currentMonster,
		resolvedReward: session.resolvedReward,
		monsterHealth: session.monsterHealth,
		playerHealth: session.playerHealth,
		playerMaxHealth: selectors.playerMaxHealth,
		recentAttackLogs: selectors.recentAttackLogs,
		playerLevel: playerProgress.playerLevel,
		playerExperience: playerProgress.playerExperience,
		playerGold: playerProgress.playerGold,
		playerInventory: playerProgress.playerInventory,
		playerInventoryDetails: playerProgress.playerInventoryDetails,
		playerInventorySaleValue: playerProgress.playerInventorySaleValue,
		levelUpAnnouncementCount: session.levelUpAnnouncementCount,
		hunterAttackCount: session.hunterAttackCount,
		hunterDamagedCount: session.hunterDamagedCount,
		experienceRequiredForNextLevel,
		experiencePercentToNextLevel,
		monsterHealthPercent: selectors.monsterHealthPercent,
		playerHealthPercent: selectors.playerHealthPercent,
		monsterDefeated: selectors.monsterDefeated,
		playerDefeated: selectors.playerDefeated,
		battleEnded: session.battleEnded,
		activeTurn: selectors.activeTurn,
		isAwaitingMonsterAttack: session.isAwaitingMonsterAttack,
		turnHunterId: session.turnHunterId,
		monsterAttackCount: session.monsterAttackCount,
		monsterDamagedCount: session.monsterDamagedCount,
		monsterHealedCount: session.monsterHealedCount,
		monsterBurnRounds: session.monsterBurnRounds,
		monsterBurned: selectors.monsterBurned,
		isSpectator: session.isSpectator,
		settings: settingsManager.settings,
		effectiveMonsterSettings: settingsManager.effectiveMonsterSettings,
		activeHunters: selectors.activeHunters,
		spectatorHunters: selectors.spectatorHunters,
		currentTurnHunterName: selectors.currentTurnHunterName,
		maxHunters: session.maxHunters,
		selfHunter: selectors.selfHunter,
		hunterCards: selectors.hunterCards,
		turnViewState: selectors.turnViewState,
		rewardClaimStatus: rewards.rewardClaimStatus,
		canClaimResolvedReward: rewards.canClaimResolvedReward,
		hasClaimedCurrentReward: rewards.hasClaimedCurrentReward,
		unlockBattleAudio: unlockAudio,
		initializeBattle: session.initializeBattle,
		updateGameSettings: settingsManager.updateGameSettings,
		resetGameSettings: settingsManager.resetGameSettings,
		pickRandomMonster: session.pickRandomMonster,
		claimResolvedBattleReward: rewards.claimResolvedBattleReward,
		sellAllPlayerInventory: rewards.sellAllPlayerInventory,
		attackMonster: session.attackMonster,
		castAuraBeam: session.castAuraBeam,
		castBurn: session.castBurn,
		healHunter: session.healHunter,
	};
}
