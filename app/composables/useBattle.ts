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
	id: number;
	name: string;
	health: number;
	experience: number;
	weaknesses: ElementType[];
	strenghts: ElementType[];
	abilities?: Array<{
		name: "heal";
		chance: number;
	}>;
	reward: string;
};

export type BattleLogEntry = {
	id: number;
	message: string;
	source: "hunter" | "monster" | "system";
};

const PLAYER_MAX_HEALTH = 100;
const PLAYER_MIN_DAMAGE = 12;
const PLAYER_DAMAGE_RANGE = 19;
const PLAYER_DODGE_CHANCE = 0.1;
const MONSTER_HEAL_MIN = 10;
const MONSTER_HEAL_RANGE = 11;
const PLAYER_HEAL_BASE = 12;
const PLAYER_HEAL_RANGE = 9;
const PLAYER_PROGRESS_STORAGE_KEY = "monster-hunter-player-progress-v1";

type PlayerMove = "attack" | "auraBeam" | "heal";
type PlayerProgress = {
	level: number;
	experience: number;
};
type EncounterMonster = Monster & {
	level: number;
	baseHealth: number;
	baseExperience: number;
	retaliationMinDamage: number;
	retaliationDamageRange: number;
	experienceReward: number;
};

export function useBattle() {
	const monsterList = monsters as Monster[];
	const currentMonster = ref<EncounterMonster | null>(null);
	const monsterHealth = ref(0);
	const playerHealth = ref(PLAYER_MAX_HEALTH);
	const attackLogs = ref<BattleLogEntry[]>([]);
	const isLoading = ref(true);
	const isAwaitingMonsterAttack = ref(false);
	const playerLevel = ref(1);
	const playerExperience = ref(0);
	const levelUpAnnouncementCount = ref(0);
	const hunterAttackCount = ref(0);
	const hunterDamagedCount = ref(0);
	const monsterAttackCount = ref(0);
	const monsterDamagedCount = ref(0);
	const monsterHealedCount = ref(0);
	let monsterAttackTimer: ReturnType<typeof setTimeout> | null = null;
	let battleToken = 0;
	let battleLogSequence = 0;

	const monsterHealthPercent = computed(() => {
		if (!currentMonster.value) {
			return 0;
		}

		return Math.max(
			0,
			Math.round(
				(monsterHealth.value / currentMonster.value.health) * 100,
			),
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
	const recentAttackLogs = computed(() => attackLogs.value.slice(-5));
	const experienceRequiredForNextLevel = computed(() =>
		calculateRequiredExperience(playerLevel.value),
	);
	const experiencePercentToNextLevel = computed(() =>
		Math.min(
			100,
			Math.round(
				(playerExperience.value /
					experienceRequiredForNextLevel.value) *
					100,
			),
		),
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

	function addBattleLogEntry(
		message: string,
		source: BattleLogEntry["source"] = "system",
	) {
		battleLogSequence += 1;
		attackLogs.value.push({
			id: battleLogSequence,
			message,
			source,
		});
	}

	function getRandomIntInclusive(min: number, max: number) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function getMonsterHealChance(monster: Monster) {
		const healAbility = monster.abilities?.find(
			(ability) => ability.name === "heal",
		);
		return healAbility?.chance ?? 0;
	}

	function calculateMonsterSpeciesPower(monster: Monster) {
		const healChance = getMonsterHealChance(monster);
		const healthFactor = monster.health / 200;
		return 0.88 + healthFactor * 0.34 + healChance * 0.004;
	}

	function rollMonsterLevelForHunter(hunterLevel: number) {
		const levelRoll = Math.random();

		if (levelRoll < 0.65) {
			const minLevel = Math.max(1, hunterLevel - 2);
			const maxLevel = hunterLevel + 2;
			return getRandomIntInclusive(minLevel, maxLevel);
		}

		if (levelRoll < 0.85) {
			const minLevel = Math.max(1, hunterLevel - 5);
			const maxLevel = Math.max(minLevel, hunterLevel - 1);
			return getRandomIntInclusive(minLevel, maxLevel);
		}

		if (levelRoll < 0.97) {
			const minLevel = hunterLevel + 3;
			const maxLevel = hunterLevel + 8;
			return getRandomIntInclusive(minLevel, maxLevel);
		}

		const minLevel = hunterLevel + 9;
		const maxLevel = hunterLevel + 14;
		return getRandomIntInclusive(minLevel, maxLevel);
	}

	function createEncounterMonster(
		monster: Monster,
		level: number,
	): EncounterMonster {
		const speciesPower = calculateMonsterSpeciesPower(monster);
		const levelPower = 1 + (level - 1) * 0.075 + Math.log2(level) * 0.1;
		const scaledHealth = Math.max(
			70,
			Math.round(monster.health * speciesPower * levelPower),
		);
		const retaliationMinDamage = Math.max(
			6,
			Math.round(
				(6 + (monster.health - 120) * 0.04) *
					speciesPower *
					(1 + (level - 1) * 0.05),
			),
		);
		const retaliationDamageRange = Math.max(
			10,
			Math.round(
				(15 + (monster.health - 120) * 0.05) *
					speciesPower *
					(1 + (level - 1) * 0.04),
			),
		);
		const experienceReward = Math.max(
			8,
			Math.round(
				monster.experience *
					(1 + (level - 1) * 0.16) *
					(0.9 + speciesPower * 0.2),
			),
		);

		return {
			...monster,
			level,
			baseHealth: monster.health,
			baseExperience: monster.experience,
			health: scaledHealth,
			retaliationMinDamage,
			retaliationDamageRange,
			experienceReward,
		};
	}

	function calculateRequiredExperience(level: number) {
		// Smooth quadratic growth: not trivial early, not excessively grindy later.
		return Math.round(60 + level * 40 + level * level * 12);
	}

	function loadPlayerProgress() {
		if (!import.meta.client) {
			return;
		}

		try {
			const rawProgress = localStorage.getItem(
				PLAYER_PROGRESS_STORAGE_KEY,
			);
			if (!rawProgress) {
				return;
			}

			const parsedProgress = JSON.parse(
				rawProgress,
			) as Partial<PlayerProgress>;
			const nextLevel = Number(parsedProgress.level);
			const nextExperience = Number(parsedProgress.experience);

			if (Number.isFinite(nextLevel) && nextLevel >= 1) {
				playerLevel.value = Math.floor(nextLevel);
			}

			if (Number.isFinite(nextExperience) && nextExperience >= 0) {
				playerExperience.value = Math.floor(nextExperience);
			}
		} catch {
			playerLevel.value = 1;
			playerExperience.value = 0;
		}
	}

	function persistPlayerProgress() {
		if (!import.meta.client) {
			return;
		}

		const progress: PlayerProgress = {
			level: playerLevel.value,
			experience: playerExperience.value,
		};
		localStorage.setItem(
			PLAYER_PROGRESS_STORAGE_KEY,
			JSON.stringify(progress),
		);
	}

	function awardPlayerExperience(amount: number) {
		if (amount <= 0) {
			return;
		}

		playerExperience.value += amount;
		let didLevelUp = false;

		while (playerExperience.value >= experienceRequiredForNextLevel.value) {
			playerExperience.value -= experienceRequiredForNextLevel.value;
			playerLevel.value += 1;
			didLevelUp = true;
		}

		addBattleLogEntry(`You gained ${amount} XP.`);
		if (didLevelUp) {
			levelUpAnnouncementCount.value += 1;
			addBattleLogEntry(
				`Level Up! You reached level ${playerLevel.value}.`,
				"system",
			);
		}
		persistPlayerProgress();
	}

	function pickRandomMonster() {
		battleToken += 1;
		clearMonsterAttackTimer();
		isAwaitingMonsterAttack.value = false;

		const randomIndex = Math.floor(Math.random() * monsterList.length);
		const selectedMonster = monsterList[randomIndex];
		const monsterLevel = rollMonsterLevelForHunter(playerLevel.value);
		const nextMonster = createEncounterMonster(
			selectedMonster,
			monsterLevel,
		);

		currentMonster.value = nextMonster;
		monsterHealth.value = nextMonster.health;
		playerHealth.value = PLAYER_MAX_HEALTH;
		attackLogs.value = [];
		battleLogSequence = 0;
		addBattleLogEntry(
			`${nextMonster.name} (Lv. ${nextMonster.level}) appeared from the wild.`,
			"system",
		);
	}

	function rollBasePlayerDamage() {
		const baseDamage =
			Math.floor(Math.random() * PLAYER_DAMAGE_RANGE) + PLAYER_MIN_DAMAGE;
		// Diminishing-returns scaling keeps progression meaningful without becoming OP.
		const levelMultiplier = 1 + Math.log2(playerLevel.value) * 0.18;
		return Math.round(baseDamage * levelMultiplier);
	}

	function rollMonsterHealAmount() {
		return (
			Math.floor(Math.random() * MONSTER_HEAL_RANGE) + MONSTER_HEAL_MIN
		);
	}

	function rollPlayerHealAmount() {
		const baseHeal =
			Math.floor(Math.random() * PLAYER_HEAL_RANGE) + PLAYER_HEAL_BASE;
		const levelMultiplier = 1 + Math.log2(playerLevel.value) * 0.14;
		return Math.max(1, Math.round(baseHeal * levelMultiplier));
	}

	function shouldMonsterHeal(monster: Monster) {
		const healAbility = monster.abilities?.find(
			(ability) => ability.name === "heal",
		);

		if (!healAbility) {
			return false;
		}

		if (monsterHealth.value >= monster.health) {
			return false;
		}

		return Math.random() < healAbility.chance / 100;
	}

	function scheduleMonsterRetaliation(delaySeconds: number) {
		const currentBattleToken = battleToken;

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

			if (shouldMonsterHeal(currentMonster.value)) {
				const healAmount = rollMonsterHealAmount();
				const healthBeforeHeal = monsterHealth.value;
				monsterHealth.value = Math.min(
					currentMonster.value.health,
					monsterHealth.value + healAmount,
				);
				const actualHeal = monsterHealth.value - healthBeforeHeal;
				if (actualHeal > 0) {
					monsterHealedCount.value += 1;
				}
				isAwaitingMonsterAttack.value = false;
				addBattleLogEntry(
					`${currentMonster.value.name} used Heal and recovered ${actualHeal} HP.`,
					"monster",
				);
				return;
			}

			monsterAttackCount.value += 1;
			const didPlayerDodge = Math.random() < PLAYER_DODGE_CHANCE;
			if (didPlayerDodge) {
				isAwaitingMonsterAttack.value = false;
				addBattleLogEntry(
					`${currentMonster.value.name} attacked, but you dodged.`,
					"monster",
				);
				return;
			}

			const retaliationDamage =
				Math.floor(
					Math.random() * currentMonster.value.retaliationDamageRange,
				) + currentMonster.value.retaliationMinDamage;
			playerHealth.value = Math.max(
				0,
				playerHealth.value - retaliationDamage,
			);
			hunterDamagedCount.value += 1;
			isAwaitingMonsterAttack.value = false;

			if (playerHealth.value === 0) {
				addBattleLogEntry(
					`${currentMonster.value.name} hit back for ${retaliationDamage}. You were defeated.`,
					"monster",
				);
				return;
			}

			addBattleLogEntry(
				`${currentMonster.value.name} hit back for ${retaliationDamage}.`,
				"monster",
			);
		}, delaySeconds * 1000);
	}

	function executePlayerMove(move: PlayerMove) {
		if (
			!currentMonster.value ||
			battleEnded.value ||
			isAwaitingMonsterAttack.value
		) {
			return;
		}

		const monsterName = currentMonster.value.name;
		const delaySeconds = Math.floor(Math.random() * 4) + 1;
		let didHit = true;
		let playerDamage = rollBasePlayerDamage();

		if (move !== "heal") {
			hunterAttackCount.value += 1;
		}

		if (move === "auraBeam") {
			didHit = Math.random() < 0.75;
			playerDamage = Math.round(playerDamage * 1.5);
		}

		if (move === "heal") {
			const healAmount = rollPlayerHealAmount();
			const healthBeforeHeal = playerHealth.value;
			playerHealth.value = Math.min(
				PLAYER_MAX_HEALTH,
				playerHealth.value + healAmount,
			);
			const actualHeal = playerHealth.value - healthBeforeHeal;

			if (actualHeal <= 0) {
				addBattleLogEntry("Your HP is already full.", "system");
				return;
			}

			isAwaitingMonsterAttack.value = true;
			addBattleLogEntry(`You healed for ${actualHeal} HP.`, "hunter");
			addBattleLogEntry(
				`${monsterName} attacks in ${delaySeconds}s.`,
				"monster",
			);
			scheduleMonsterRetaliation(delaySeconds);
			return;
		}

		if (didHit) {
			monsterHealth.value = Math.max(
				0,
				monsterHealth.value - playerDamage,
			);
			monsterDamagedCount.value += 1;

			if (monsterHealth.value === 0) {
				const experienceReward = currentMonster.value.experienceReward;
				addBattleLogEntry(
					`You defeated Lv. ${currentMonster.value.level} ${monsterName} and earned ${currentMonster.value.reward}.`,
					"hunter",
				);
				awardPlayerExperience(experienceReward);
				return;
			}
		}

		let playerActionLog = `You hit ${monsterName} for ${playerDamage}.`;

		if (move === "auraBeam") {
			if (didHit) {
				playerActionLog = `Aura Beam hits ${monsterName} for ${playerDamage}.`;
			} else {
				playerActionLog = `Aura Beam missed ${monsterName}.`;
			}
		}

		isAwaitingMonsterAttack.value = true;
		addBattleLogEntry(playerActionLog, "hunter");
		addBattleLogEntry(
			`${monsterName} attacks in ${delaySeconds}s.`,
			"monster",
		);
		scheduleMonsterRetaliation(delaySeconds);
	}

	function attackMonster() {
		executePlayerMove("attack");
	}

	function castAuraBeam() {
		executePlayerMove("auraBeam");
	}

	function healHunter() {
		executePlayerMove("heal");
	}

	function initializeBattle() {
		isLoading.value = true;
		loadPlayerProgress();
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
		monsterAttackCount,
		monsterDamagedCount,
		monsterHealedCount,
		initializeBattle,
		pickRandomMonster,
		attackMonster,
		castAuraBeam,
		healHunter,
	};
}
