import monsters from "~/data/monsters.json";

type ElementType =
	| "normal"
	| "fire"
	| "water"
	| "electric"
	| "grass"
	| "ice"
	| "fighting"
	| "poison"
	| "ground"
	| "flying"
	| "psychic"
	| "bug"
	| "rock"
	| "ghost"
	| "dragon"
	| "dark"
	| "steel"
	| "fairy";

export type Monster = {
	name: string;
	health: number;
	weaknesses: ElementType[];
	strenghts: ElementType[];
	reward: string;
};

const PLAYER_MAX_HEALTH = 100;

export function useBattle() {
	const monsterList = monsters as Monster[];
	const currentMonster = ref<Monster | null>(null);
	const monsterHealth = ref(0);
	const playerHealth = ref(PLAYER_MAX_HEALTH);
	const attackLog = ref("");
	const isLoading = ref(true);
	const isAwaitingMonsterAttack = ref(false);
	let monsterAttackTimer: ReturnType<typeof setTimeout> | null = null;
	let battleToken = 0;

	const monsterHealthPercent = computed(() => {
		if (!currentMonster.value) {
			return 0;
		}

		return Math.max(
			0,
			Math.round((monsterHealth.value / currentMonster.value.health) * 100),
		);
	});

	const playerHealthPercent = computed(() =>
		Math.max(0, Math.round((playerHealth.value / PLAYER_MAX_HEALTH) * 100)),
	);
	const monsterDefeated = computed(() => monsterHealth.value <= 0);
	const playerDefeated = computed(() => playerHealth.value <= 0);
	const battleEnded = computed(
		() => monsterDefeated.value || playerDefeated.value,
	);
	const activeTurn = computed<"player" | "monster" | "ended">(() => {
		if (battleEnded.value) {
			return "ended";
		}

		if (isAwaitingMonsterAttack.value) {
			return "monster";
		}

		return "player";
	});

	function clearMonsterAttackTimer() {
		if (monsterAttackTimer) {
			clearTimeout(monsterAttackTimer);
			monsterAttackTimer = null;
		}
	}

	function pickRandomMonster() {
		battleToken += 1;
		clearMonsterAttackTimer();
		isAwaitingMonsterAttack.value = false;

		const randomIndex = Math.floor(Math.random() * monsterList.length);
		const nextMonster = monsterList[randomIndex];

		currentMonster.value = nextMonster;
		monsterHealth.value = nextMonster.health;
		playerHealth.value = PLAYER_MAX_HEALTH;
		attackLog.value = `${nextMonster.name} appeared from the wild.`;
	}

	function attackMonster() {
		if (
			!currentMonster.value ||
			battleEnded.value ||
			isAwaitingMonsterAttack.value
		) {
			return;
		}

		const playerDamage = Math.floor(Math.random() * 19) + 12;
		monsterHealth.value = Math.max(0, monsterHealth.value - playerDamage);

		if (monsterHealth.value === 0) {
			attackLog.value = `You defeated ${currentMonster.value.name} and earned ${currentMonster.value.reward}.`;
			return;
		}

		const delaySeconds = Math.floor(Math.random() * 4) + 1;
		const currentBattleToken = battleToken;
		const monsterName = currentMonster.value.name;

		isAwaitingMonsterAttack.value = true;
		attackLog.value = `You hit ${monsterName} for ${playerDamage}. ${monsterName} attacks in ${delaySeconds}s.`;

		clearMonsterAttackTimer();
		monsterAttackTimer = setTimeout(() => {
			if (
				currentBattleToken !== battleToken ||
				!currentMonster.value ||
				battleEnded.value
			) {
				isAwaitingMonsterAttack.value = false;
				return;
			}

			const retaliationDamage = Math.floor(Math.random() * 15) + 6;
			playerHealth.value = Math.max(0, playerHealth.value - retaliationDamage);
			isAwaitingMonsterAttack.value = false;

			if (playerHealth.value === 0) {
				attackLog.value = `${currentMonster.value.name} hit back for ${retaliationDamage}. You were defeated.`;
				return;
			}

			attackLog.value = `${currentMonster.value.name} hit back for ${retaliationDamage}.`;
		}, delaySeconds * 1000);
	}

	function initializeBattle() {
		isLoading.value = true;
		pickRandomMonster();
		isLoading.value = false;
	}

	onBeforeUnmount(() => {
		clearMonsterAttackTimer();
	});

	return {
		PLAYER_MAX_HEALTH,
		isLoading,
		currentMonster,
		monsterHealth,
		playerHealth,
		attackLog,
		monsterHealthPercent,
		playerHealthPercent,
		monsterDefeated,
		playerDefeated,
		battleEnded,
		activeTurn,
		isAwaitingMonsterAttack,
		initializeBattle,
		pickRandomMonster,
		attackMonster,
	};
}
