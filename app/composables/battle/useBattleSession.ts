import { ref } from "vue";
import type {
	BattleHunterState,
	BattleLogEntry,
	BattleStateMessage,
	Monster,
} from "~~/types/battle";
import type { BattleGameSettings } from "~~/types/game-settings";
import type { BattleReward } from "~~/types/loot";
import { useBattleAudio } from "~/composables/battle/useBattleAudio";
import { useBattleSocket } from "~/composables/battle/useBattleSocket";

type UseBattleSessionOptions = {
	playerId: string;
	playerName: string;
	getPlayerLevel: () => number;
	getPlayerExperience: () => number;
	getGameSettings: () => BattleGameSettings;
	applyRemoteSettings: (settings: BattleGameSettings) => void;
	updatePlayerCombatProgress: (level: number, experience: number) => void;
};

export function useBattleSession(options: UseBattleSessionOptions) {
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
	const playerHealth = ref(0);
	const levelUpAnnouncementCount = ref(0);
	const hunterAttackCount = ref(0);
	const hunterDamagedCount = ref(0);
	const monsterAttackCount = ref(0);
	const monsterDamagedCount = ref(0);
	const monsterHealedCount = ref(0);
	const monsterBurnRounds = ref(0);

	const { playBattleSound } = useBattleAudio();
	const hasProcessedInitialBattleState = ref(false);
	const latestProcessedLogId = ref(0);

	function playAudioForNewLogs(nextLogs: BattleLogEntry[]) {
		const latestLogId = nextLogs[nextLogs.length - 1]?.id ?? 0;

		if (!hasProcessedInitialBattleState.value) {
			hasProcessedInitialBattleState.value = true;
			latestProcessedLogId.value = latestLogId;
			return;
		}

		if (latestLogId <= latestProcessedLogId.value) {
			if (latestLogId < latestProcessedLogId.value) {
				latestProcessedLogId.value = latestLogId;
			}
			return;
		}

		const newLogs = nextLogs.filter(
			(logEntry) => logEntry.id > latestProcessedLogId.value,
		);
		for (const logEntry of newLogs) {
			if (logEntry.metadata?.eventType !== "ability") {
				continue;
			}
			if (
				logEntry.metadata.action !== "attack" &&
				logEntry.metadata.action !== "auraBeam"
			) {
				continue;
			}
			if (logEntry.source !== "hunter" && logEntry.source !== "monster") {
				continue;
			}

			void playBattleSound(logEntry.source, logEntry.metadata.action);
		}

		latestProcessedLogId.value = latestLogId;
	}

	function applyStateMessage(message: BattleStateMessage) {
		const nextState = message.state;
		playAudioForNewLogs(nextState.logs);
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
		options.applyRemoteSettings(nextState.settings);

		const self = nextState.hunters.find(
			(hunter) => hunter.id === options.playerId,
		);
		if (self) {
			isSpectator.value = self.role === "spectator";
			playerHealth.value = self.health;
			hunterAttackCount.value = self.attackCount;
			hunterDamagedCount.value = self.damagedCount;
			levelUpAnnouncementCount.value = self.levelUpCount;
			options.updatePlayerCombatProgress(self.level, self.experience);
		} else {
			isSpectator.value = false;
			playerHealth.value = options.getGameSettings().hunter.maxHealth;
		}

		isLoading.value = false;
	}

	const socket = useBattleSocket({
		playerId: options.playerId,
		playerName: options.playerName,
		getPlayerLevel: options.getPlayerLevel,
		getPlayerExperience: options.getPlayerExperience,
		getGameSettings: options.getGameSettings,
		onStateMessage: applyStateMessage,
	});

	function initializeBattle() {
		isLoading.value = true;
		socket.connect();
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

	return {
		isLoading,
		currentMonster,
		resolvedReward,
		monsterHealth,
		attackLogs,
		isAwaitingMonsterAttack,
		battleEnded,
		turnHunterId,
		maxHunters,
		hunters,
		isSpectator,
		playerHealth,
		levelUpAnnouncementCount,
		hunterAttackCount,
		hunterDamagedCount,
		monsterAttackCount,
		monsterDamagedCount,
		monsterHealedCount,
		monsterBurnRounds,
		connectionStatus: socket.connectionStatus,
		sendSettings: socket.sendSettings,
		initializeBattle,
		pickRandomMonster,
		attackMonster,
		castAuraBeam,
		healHunter,
		castBurn,
	};
}
