import { computed } from "vue";
import type {
	BattleHunterState,
	BattleLogEntry,
	Monster,
} from "~~/types/battle";
import type { BattleGameSettings } from "~~/types/game-settings";
import {
	calculateMonsterHealthPercent,
	calculatePlayerHealthPercent,
	createHunterCardSlots,
	getBattleTurnViewState,
	sliceRecentBattleLogs,
} from "~~/utils/battle/selectors";

type UseBattleSelectorsOptions = {
	playerId: string;
	hunters: Ref<BattleHunterState[]>;
	currentMonster: Ref<Monster | null>;
	monsterHealth: Ref<number>;
	playerHealth: Ref<number>;
	battleEnded: Ref<boolean>;
	isSpectator: Ref<boolean>;
	turnHunterId: Ref<string | null>;
	attackLogs: Ref<BattleLogEntry[]>;
	monsterBurnRounds: Ref<number>;
	settings: Ref<BattleGameSettings>;
	isAwaitingMonsterAttack: Ref<boolean>;
};

export function useBattleSelectors(options: UseBattleSelectorsOptions) {
	const selfHunter = computed(
		() =>
			options.hunters.value.find(
				(hunter) => hunter.id === options.playerId,
			) ?? null,
	);
	const playerMaxHealth = computed(() => {
		if (selfHunter.value) {
			return selfHunter.value.maxHealth;
		}

		return options.settings.value.hunter.maxHealth;
	});
	const activeHunters = computed(() =>
		options.hunters.value.filter((hunter) => hunter.role === "hunter"),
	);
	const spectatorHunters = computed(() =>
		options.hunters.value.filter((hunter) => hunter.role === "spectator"),
	);
	const currentTurnHunterName = computed(() => {
		if (!options.turnHunterId.value) {
			return "";
		}

		const hunter = options.hunters.value.find(
			(candidate) => candidate.id === options.turnHunterId.value,
		);
		if (!hunter) {
			return "";
		}

		return hunter.name;
	});
	const isMyTurn = computed(() => {
		if (options.battleEnded.value || options.isSpectator.value) {
			return false;
		}

		return options.turnHunterId.value === options.playerId;
	});
	const activeTurn = computed<"player" | "monster" | "ended">(() => {
		if (options.battleEnded.value) {
			return "ended";
		}

		if (isMyTurn.value) {
			return "player";
		}

		return "monster";
	});
	const playerHealthPercent = computed(() =>
		calculatePlayerHealthPercent(
			options.playerHealth.value,
			playerMaxHealth.value,
		),
	);
	const monsterHealthPercent = computed(() =>
		calculateMonsterHealthPercent(
			options.monsterHealth.value,
			options.currentMonster.value,
		),
	);
	const monsterDefeated = computed(() => options.monsterHealth.value <= 0);
	const monsterBurned = computed(() => options.monsterBurnRounds.value > 0);
	const playerDefeated = computed(() => options.playerHealth.value <= 0);
	const recentAttackLogs = computed(() =>
		sliceRecentBattleLogs(options.attackLogs.value),
	);
	const hunterCards = computed(() =>
		createHunterCardSlots(activeHunters.value),
	);
	const turnViewState = computed(() =>
		getBattleTurnViewState({
			battleEnded: options.battleEnded.value,
			isAwaitingMonsterAttack: options.isAwaitingMonsterAttack.value,
			activeTurn: activeTurn.value,
			isSpectator: options.isSpectator.value,
			currentTurnHunterName: currentTurnHunterName.value,
			currentMonsterName: options.currentMonster.value?.name ?? "Monster",
		}),
	);

	return {
		selfHunter,
		playerMaxHealth,
		activeHunters,
		spectatorHunters,
		currentTurnHunterName,
		isMyTurn,
		activeTurn,
		playerHealthPercent,
		monsterHealthPercent,
		monsterDefeated,
		monsterBurned,
		playerDefeated,
		recentAttackLogs,
		hunterCards,
		turnViewState,
	};
}
