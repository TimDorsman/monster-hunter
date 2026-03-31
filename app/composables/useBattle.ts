import type {
	BattleHunterState,
	BattleLogEntry,
	BattleStateMessage,
	Monster,
} from "~~/types/battle";
import type { BattleGameSettings } from "~~/types/game-settings";
import type { BattleReward, PlayerProgress } from "~~/types/loot";
import {
	calculateInventoryEntrySellValue,
	calculateInventorySellTotal,
	clonePlayerProgress,
	getLootItemDefinition,
} from "~~/utils/loot";
import { getMonsterAbilityChance } from "~~/utils/battle-abilities";
import {
	createDefaultBattleGameSettings,
	sanitizeBattleGameSettings,
} from "~~/utils/game-settings";
import { useBattleInventory } from "~/composables/battle/useBattleInventory";
import {
	calculateRequiredExperience,
	useBattleProgress,
} from "~/composables/battle/useBattleProgress";
import { useBattleSettingsStorage } from "~/composables/battle/useBattleSettingsStorage";
import { useBattleSocket } from "~/composables/battle/useBattleSocket";

const PLAYER_NAME = "Swifty Mercury";

export function useBattle() {
	const isLoading = ref(true);
	const currentMonster = ref<Monster | null>(null);
	const resolvedReward = ref<BattleReward | null>(null);
	const monsterHealth = ref(0);
	const attackLogs = ref<BattleLogEntry[]>([]);
	const isAwaitingMonsterAttack = ref(false);
	const battleEnded = ref(false);
	const turnHunterId = ref<string | null>(null);
	const maxHunters = ref(4);
	const hunters = ref<BattleHunterState[]>([]);
	const isSpectator = ref(false);

	const { getOrCreatePlayerId, loadPlayerProgress, persistPlayerProgress } =
		useBattleProgress();
	const { loadGameSettings, persistGameSettings } = useBattleSettingsStorage();
	const {
		hasClaimedReward,
		getBattleRewardClaimStatus,
		claimBattleReward,
		sellAllInventory,
	} = useBattleInventory();
	const playerId = getOrCreatePlayerId();
	const initialProgress = loadPlayerProgress();
	const initialSettings = loadGameSettings();
	const playerProgress = ref<PlayerProgress>(initialProgress);
	const settings = ref<BattleGameSettings>(initialSettings);
	const playerHealth = ref(initialSettings.hunter.maxHealth);
	const levelUpAnnouncementCount = ref(0);
	const hunterAttackCount = ref(0);
	const hunterDamagedCount = ref(0);
	const monsterAttackCount = ref(0);
	const monsterDamagedCount = ref(0);
	const monsterHealedCount = ref(0);
	const monsterBurnRounds = ref(0);

	const playerLevel = computed(() => playerProgress.value.level);
	const playerExperience = computed(() => playerProgress.value.experience);
	const playerGold = computed(() => playerProgress.value.gold);
	const playerInventory = computed(() => playerProgress.value.inventory);
	const selfHunter = computed(() =>
		hunters.value.find((hunter) => hunter.id === playerId) ?? null,
	);
	const playerInventoryDetails = computed(() => {
		return playerInventory.value.map((inventoryEntry) => {
			const itemDefinition = getLootItemDefinition(inventoryEntry.itemId);
			return {
				...inventoryEntry,
				name: itemDefinition?.name ?? inventoryEntry.itemId,
				stackValue: calculateInventoryEntrySellValue(inventoryEntry),
			};
		});
	});
	const playerInventorySaleValue = computed(() =>
		calculateInventorySellTotal(playerInventory.value),
	);
	const playerMaxHealth = computed(() => {
		if (selfHunter.value) {
			return selfHunter.value.maxHealth;
		}

		return settings.value.hunter.maxHealth;
	});
	const activeHunters = computed(() =>
		hunters.value.filter((hunter) => hunter.role === "hunter"),
	);
	const spectatorHunters = computed(() =>
		hunters.value.filter((hunter) => hunter.role === "spectator"),
	);
	const currentTurnHunterName = computed(() => {
		if (!turnHunterId.value) {
			return "";
		}

		const hunter = hunters.value.find(
			(candidate) => candidate.id === turnHunterId.value,
		);
		if (!hunter) {
			return "";
		}

		return hunter.name;
	});
	const rewardClaimStatus = computed(() =>
		getBattleRewardClaimStatus(
			playerProgress.value,
			resolvedReward.value,
			playerId,
			isSpectator.value,
		),
	);
	const canClaimResolvedReward = computed(
		() => rewardClaimStatus.value === "claimable",
	);
	const hasClaimedCurrentReward = computed(() => {
		const reward = resolvedReward.value;
		if (!reward) {
			return false;
		}

		return hasClaimedReward(playerProgress.value, reward.rewardId);
	});

	const experienceRequiredForNextLevel = computed(() =>
		calculateRequiredExperience(playerLevel.value),
	);
	const experiencePercentToNextLevel = computed(() =>
		Math.min(
			100,
			Math.round(
				(playerExperience.value / experienceRequiredForNextLevel.value) * 100,
			),
		),
	);
	const playerHealthPercent = computed(() =>
		Math.max(0, Math.round((playerHealth.value / playerMaxHealth.value) * 100)),
	);
	const monsterHealthPercent = computed(() => {
		if (!currentMonster.value) {
			return 0;
		}

		return Math.max(
			0,
			Math.round((monsterHealth.value / currentMonster.value.health) * 100),
		);
	});
	const monsterDefeated = computed(() => monsterHealth.value <= 0);
	const monsterBurned = computed(() => monsterBurnRounds.value > 0);
	const playerDefeated = computed(() => playerHealth.value <= 0);
	const recentAttackLogs = computed(() => attackLogs.value.slice(-8));
	const effectiveMonsterSettings = computed(() => {
		const activeMonster = currentMonster.value;
		const nextSettings = settings.value.monster;
		return {
			health: nextSettings.health ?? activeMonster?.health ?? 0,
			retaliationMinDamage:
				nextSettings.retaliationMinDamage ??
				activeMonster?.retaliationMinDamage ??
				0,
			retaliationDamageRange:
				nextSettings.retaliationDamageRange ??
				activeMonster?.retaliationDamageRange ??
				0,
			attackChance:
				nextSettings.attackChance ??
				(activeMonster
					? getMonsterAbilityChance(activeMonster.abilities, "attack", 0)
					: 0),
			healChance:
				nextSettings.healChance ??
				(activeMonster
					? getMonsterAbilityChance(activeMonster.abilities, "heal", 0)
					: 0),
		};
	});
	const isMyTurn = computed(() => {
		if (battleEnded.value || isSpectator.value) {
			return false;
		}

		return turnHunterId.value === playerId;
	});
	const activeTurn = computed<"player" | "monster" | "ended">(() => {
		if (battleEnded.value) {
			return "ended";
		}

		if (isMyTurn.value) {
			return "player";
		}

		return "monster";
	});

	function persistNextPlayerProgress(nextProgress: PlayerProgress) {
		playerProgress.value = nextProgress;
		persistPlayerProgress(nextProgress);
	}

	function updatePlayerCombatProgress(level: number, experience: number) {
		const nextProgress = clonePlayerProgress(playerProgress.value);
		nextProgress.level = level;
		nextProgress.experience = experience;
		persistNextPlayerProgress(nextProgress);
	}

	function applyStateMessage(message: BattleStateMessage) {
		const nextState = message.state;
		currentMonster.value = nextState.monster;
		resolvedReward.value = nextState.resolvedReward;
		monsterHealth.value = nextState.monsterHealth;
		attackLogs.value = nextState.logs;
		isAwaitingMonsterAttack.value = nextState.isAwaitingMonsterAttack;
		battleEnded.value = nextState.battleEnded;
		turnHunterId.value = nextState.turnHunterId;
		maxHunters.value = nextState.maxHunters;
		hunters.value = nextState.hunters;
		monsterAttackCount.value = nextState.monsterAttackCount;
		monsterDamagedCount.value = nextState.monsterDamagedCount;
		monsterHealedCount.value = nextState.monsterHealedCount;
		monsterBurnRounds.value = nextState.monsterBurnRounds;
		settings.value = sanitizeBattleGameSettings(nextState.settings);
		persistGameSettings(settings.value);

		const self = nextState.hunters.find((hunter) => hunter.id === playerId);
		if (self) {
			isSpectator.value = self.role === "spectator";
			playerHealth.value = self.health;
			hunterAttackCount.value = self.attackCount;
			hunterDamagedCount.value = self.damagedCount;
			levelUpAnnouncementCount.value = self.levelUpCount;
			updatePlayerCombatProgress(self.level, self.experience);
		} else {
			isSpectator.value = false;
			playerHealth.value = settings.value.hunter.maxHealth;
		}

		isLoading.value = false;
	}

	const socket = useBattleSocket({
		playerId,
		playerName: PLAYER_NAME,
		getPlayerLevel: () => playerProgress.value.level,
		getPlayerExperience: () => playerProgress.value.experience,
		getGameSettings: () => settings.value,
		onStateMessage: applyStateMessage,
	});

	function updateGameSettings(nextSettings: BattleGameSettings) {
		const sanitizedSettings = sanitizeBattleGameSettings(nextSettings);
		settings.value = sanitizedSettings;
		persistGameSettings(sanitizedSettings);
		socket.sendSettings(sanitizedSettings);
	}

	function resetGameSettings() {
		updateGameSettings(createDefaultBattleGameSettings());
	}

	function attackMonster() {
		socket.sendAction("attack");
	}

	function castAuraBeam() {
		socket.sendAction("auraBeam");
	}

	function healHunter() {
		socket.sendAction("heal");
	}

	function castBurn() {
		socket.sendAction("burn");
	}

	function pickRandomMonster() {
		socket.sendNewMonster();
	}

	function claimResolvedBattleReward() {
		const rewardClaimResult = claimBattleReward(
			playerProgress.value,
			resolvedReward.value,
			playerId,
			isSpectator.value,
		);
		if (!rewardClaimResult.claimed) {
			return false;
		}

		persistNextPlayerProgress(rewardClaimResult.nextProgress);
		return true;
	}

	function sellAllPlayerInventory() {
		const sellInventoryResult = sellAllInventory(playerProgress.value);
		if (!sellInventoryResult.sold) {
			return 0;
		}

		persistNextPlayerProgress(sellInventoryResult.nextProgress);
		return sellInventoryResult.goldEarned;
	}

	function initializeBattle() {
		isLoading.value = true;
		socket.connect();
	}

	return {
		isLoading,
		connectionStatus: socket.connectionStatus,
		currentMonster,
		resolvedReward,
		monsterHealth,
		playerHealth,
		playerMaxHealth,
		recentAttackLogs,
		playerLevel,
		playerExperience,
		playerGold,
		playerInventory,
		playerInventoryDetails,
		playerInventorySaleValue,
		levelUpAnnouncementCount,
		hunterAttackCount,
		hunterDamagedCount,
		experienceRequiredForNextLevel,
		experiencePercentToNextLevel,
		monsterHealthPercent,
		playerHealthPercent,
		monsterDefeated,
		playerDefeated,
		battleEnded,
		activeTurn,
		isAwaitingMonsterAttack,
		turnHunterId,
		monsterAttackCount,
		monsterDamagedCount,
		monsterHealedCount,
		monsterBurnRounds,
		monsterBurned,
		isSpectator,
		settings,
		effectiveMonsterSettings,
		activeHunters,
		spectatorHunters,
		currentTurnHunterName,
		maxHunters,
		selfHunter,
		rewardClaimStatus,
		canClaimResolvedReward,
		hasClaimedCurrentReward,
		initializeBattle,
		updateGameSettings,
		resetGameSettings,
		pickRandomMonster,
		claimResolvedBattleReward,
		sellAllPlayerInventory,
		attackMonster,
		castAuraBeam,
		castBurn,
		healHunter,
	};
}
