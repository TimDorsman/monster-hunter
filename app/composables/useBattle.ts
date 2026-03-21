import type { BattleHunterState, BattleLogEntry, BattleStateMessage, Monster } from "~~/types/battle";
import type { BattleGameSettings } from "~~/types/game-settings";
import {
	createDefaultBattleGameSettings,
	sanitizeBattleGameSettings,
} from "~~/utils/game-settings";
import { getMonsterAbilityChance } from "~~/utils/battle-abilities";
import { calculateRequiredExperience, useBattleProgress } from "~/composables/battle/useBattleProgress";
import { useBattleSettingsStorage } from "~/composables/battle/useBattleSettingsStorage";
import { useBattleSocket } from "~/composables/battle/useBattleSocket";

const PLAYER_NAME = "Swifty Mercury";

export function useBattle() {
	const isLoading = ref(true);
	const currentMonster = ref<Monster | null>(null);
	const monsterHealth = ref(0);
	const attackLogs = ref<BattleLogEntry[]>([]);
	const isAwaitingMonsterAttack = ref(false);
	const battleEnded = ref(false);
	const turnHunterId = ref<string | null>(null);
	const maxHunters = ref(4);
	const hunters = ref<BattleHunterState[]>([]);
	const isSpectator = ref(false);

	const { getOrCreatePlayerId, loadPlayerProgress, persistPlayerProgress } = useBattleProgress();
	const { loadGameSettings, persistGameSettings } = useBattleSettingsStorage();
	const playerId = getOrCreatePlayerId();
	const initialProgress = loadPlayerProgress();
	const initialSettings = loadGameSettings();
	const playerLevel = ref(initialProgress.level);
	const playerExperience = ref(initialProgress.experience);
	const playerGold = ref(initialProgress.gold);
	const settings = ref<BattleGameSettings>(initialSettings);
	const playerHealth = ref(initialSettings.hunter.maxHealth);
	const levelUpAnnouncementCount = ref(0);
	const hunterAttackCount = ref(0);
	const hunterDamagedCount = ref(0);
	const monsterAttackCount = ref(0);
	const monsterDamagedCount = ref(0);
	const monsterHealedCount = ref(0);
	const monsterBurnRounds = ref(0);

	const selfHunter = computed(() =>
		hunters.value.find((hunter) => hunter.id === playerId) ?? null,
	);
	const playerMaxHealth = computed(
		() => selfHunter.value?.maxHealth ?? settings.value.hunter.maxHealth,
	);
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
		return hunter ? hunter.name : "";
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
		return {
			health: settings.value.monster.health ?? activeMonster?.health ?? 0,
			retaliationMinDamage:
				settings.value.monster.retaliationMinDamage ??
				activeMonster?.retaliationMinDamage ??
				0,
			retaliationDamageRange:
				settings.value.monster.retaliationDamageRange ??
				activeMonster?.retaliationDamageRange ??
				0,
			attackChance:
				settings.value.monster.attackChance ??
				(activeMonster
					? getMonsterAbilityChance(activeMonster.abilities, "attack", 0)
					: 0),
			healChance:
				settings.value.monster.healChance ??
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

	function applyStateMessage(message: BattleStateMessage) {
		const nextState = message.state;
		currentMonster.value = nextState.monster;
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
			playerLevel.value = self.level;
			playerExperience.value = self.experience;
			playerHealth.value = self.health;
			hunterAttackCount.value = self.attackCount;
			hunterDamagedCount.value = self.damagedCount;
			levelUpAnnouncementCount.value = self.levelUpCount;
			persistPlayerProgress(self.level, self.experience, playerGold.value);
		} else {
			isSpectator.value = false;
			playerHealth.value = settings.value.hunter.maxHealth;
		}

		isLoading.value = false;
	}

	const socket = useBattleSocket({
		playerId,
		playerName: PLAYER_NAME,
		getPlayerLevel: () => playerLevel.value,
		getPlayerExperience: () => playerExperience.value,
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

	function addPlayerGold(amount: number) {
		if (amount <= 0) {
			return;
		}

		playerGold.value += Math.floor(amount);
		persistPlayerProgress(
			playerLevel.value,
			playerExperience.value,
			playerGold.value,
		);
	}

	function initializeBattle() {
		isLoading.value = true;
		socket.connect();
	}

	return {
		isLoading,
		connectionStatus: socket.connectionStatus,
		currentMonster,
		monsterHealth,
		playerHealth,
		playerMaxHealth,
		recentAttackLogs,
		playerLevel,
		playerExperience,
		playerGold,
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
		initializeBattle,
		updateGameSettings,
		resetGameSettings,
		pickRandomMonster,
		addPlayerGold,
		attackMonster,
		castAuraBeam,
		castBurn,
		healHunter,
	};
}
