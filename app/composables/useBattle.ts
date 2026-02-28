import type { BattleHunterState, BattleLogEntry, BattleStateMessage, Monster } from "~/types/battle";
import { calculateRequiredExperience, useBattleProgress } from "./battle/useBattleProgress";
import { useBattleSocket } from "./battle/useBattleSocket";

const PLAYER_MAX_HEALTH = 100;
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
	const playerId = getOrCreatePlayerId();
	const initialProgress = loadPlayerProgress();
	const playerLevel = ref(initialProgress.level);
	const playerExperience = ref(initialProgress.experience);
	const playerHealth = ref(PLAYER_MAX_HEALTH);
	const levelUpAnnouncementCount = ref(0);
	const hunterAttackCount = ref(0);
	const hunterDamagedCount = ref(0);
	const monsterAttackCount = ref(0);
	const monsterDamagedCount = ref(0);
	const monsterHealedCount = ref(0);

	const selfHunter = computed(() =>
		hunters.value.find((hunter) => hunter.id === playerId) ?? null,
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
		Math.max(0, Math.round((playerHealth.value / PLAYER_MAX_HEALTH) * 100)),
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
	const playerDefeated = computed(() => playerHealth.value <= 0);
	const recentAttackLogs = computed(() => attackLogs.value.slice(-8));
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

		const self = nextState.hunters.find((hunter) => hunter.id === playerId);
		if (self) {
			isSpectator.value = self.role === "spectator";
			playerLevel.value = self.level;
			playerExperience.value = self.experience;
			playerHealth.value = self.health;
			hunterAttackCount.value = self.attackCount;
			hunterDamagedCount.value = self.damagedCount;
			levelUpAnnouncementCount.value = self.levelUpCount;
			persistPlayerProgress(self.level, self.experience);
		} else {
			isSpectator.value = false;
			playerHealth.value = PLAYER_MAX_HEALTH;
		}

		isLoading.value = false;
	}

	const socket = useBattleSocket({
		playerId,
		playerName: PLAYER_NAME,
		getPlayerLevel: () => playerLevel.value,
		getPlayerExperience: () => playerExperience.value,
		onStateMessage: applyStateMessage,
	});

	function attackMonster() {
		socket.sendAction("attack");
	}

	function castAuraBeam() {
		socket.sendAction("auraBeam");
	}

	function healHunter() {
		socket.sendAction("heal");
	}

	function pickRandomMonster() {
		socket.sendNewMonster();
	}

	function initializeBattle() {
		isLoading.value = true;
		socket.connect();
	}

	return {
		PLAYER_MAX_HEALTH,
		isLoading,
		connectionStatus: socket.connectionStatus,
		currentMonster,
		monsterHealth,
		playerHealth,
		recentAttackLogs,
		playerLevel,
		playerExperience,
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
		isSpectator,
		activeHunters,
		spectatorHunters,
		currentTurnHunterName,
		maxHunters,
		selfHunter,
		initializeBattle,
		pickRandomMonster,
		attackMonster,
		castAuraBeam,
		healHunter,
	};
}
