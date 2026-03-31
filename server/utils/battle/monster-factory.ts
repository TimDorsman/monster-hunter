import monsters from "~~/app/data/monsters.json";
import { MonsterHealAbility } from "../abilities/monster-heal-ability";
import {
	DEFAULT_MONSTER_ATTACK_CHANCE,
	getMonsterAbilityChance,
} from "~~/utils/battle-abilities";
import { getRandomIntInclusive } from "./random";
import {
	applyEffectiveStatsToMonster,
	getDefaultMonsterAttackChance,
	getDefaultMonsterHealChance,
} from "./settings";
import {
	type BattleRoom,
	type EncounterMonster,
	type Monster,
} from "./types";
import {
	addBattleLogEntry,
	getActiveHunters,
	getAliveHunters,
} from "./room-utils";

const monsterHealAbility = new MonsterHealAbility();

function calculateMonsterSpeciesPower(monster: Monster) {
	const healChance = monsterHealAbility.getHealChance(monster) / 100;
	const healthFactor = monster.health / 200;
	return 0.88 + healthFactor * 0.34 + healChance * 0.18;
}

function calculateMonsterDamagePower(monster: Monster) {
	const healChance = monsterHealAbility.getHealChance(monster) / 100;
	const attackChance =
		getMonsterAbilityChance(
			monster.abilities,
			"attack",
			DEFAULT_MONSTER_ATTACK_CHANCE,
		) / 100;
	const experienceFactor = Math.max(
		0.65,
		Math.min(1.5, monster.experience / 220),
	);
	return 0.9 + experienceFactor * 0.32 + healChance * 0.08 + attackChance * 0.16;
}

function rollMonsterLevelForParty(avgHunterLevel: number) {
	const levelRoll = Math.random();

	if (levelRoll < 0.65) {
		return getRandomIntInclusive(
			Math.max(1, avgHunterLevel - 2),
			avgHunterLevel + 2,
		);
	}

	if (levelRoll < 0.85) {
		const minLevel = Math.max(1, avgHunterLevel - 5);
		const maxLevel = Math.max(minLevel, avgHunterLevel - 1);
		return getRandomIntInclusive(minLevel, maxLevel);
	}

	if (levelRoll < 0.97) {
		return getRandomIntInclusive(avgHunterLevel + 3, avgHunterLevel + 8);
	}

	return getRandomIntInclusive(avgHunterLevel + 9, avgHunterLevel + 14);
}

function createEncounterMonster(
	room: BattleRoom,
	monster: Monster,
	level: number,
): EncounterMonster {
	const speciesPower = calculateMonsterSpeciesPower(monster);
	const damagePower = calculateMonsterDamagePower(monster);
	const levelPower = 1 + (level - 1) * 0.075 + Math.log2(level) * 0.1;
	const scaledHealth = Math.max(
		70,
		Math.round(monster.health * speciesPower * levelPower),
	);
	const retaliationMinDamage = Math.max(
		6,
		Math.round(7 * damagePower * (1 + (level - 1) * 0.05)),
	);
	const retaliationDamageRange = Math.max(
		10,
		Math.round(14 * damagePower * (1 + (level - 1) * 0.04)),
	);
	const experienceReward = Math.max(
		8,
		Math.round(
			monster.experience *
				(1 + (level - 1) * 0.16) *
				(0.9 + speciesPower * 0.2),
		),
	);
	const defaultAttackChance = getDefaultMonsterAttackChance(monster);
	const defaultHealChance = getDefaultMonsterHealChance(monster);

	const encounter: EncounterMonster = {
		...monster,
		level,
		baseHealth: monster.health,
		baseExperience: monster.experience,
		defaultHealth: scaledHealth,
		health: scaledHealth,
		defaultRetaliationMinDamage: retaliationMinDamage,
		defaultRetaliationDamageRange: retaliationDamageRange,
		retaliationMinDamage,
		retaliationDamageRange,
		defaultAttackChance,
		defaultHealChance,
		abilities: [
			{
				name: "attack",
				chance: defaultAttackChance,
			},
			{
				name: "heal",
				chance: defaultHealChance,
			},
		],
		experienceReward,
	};

	applyEffectiveStatsToMonster(room, encounter);
	return encounter;
}

export function pickNewMonster(room: BattleRoom) {
	const monsterPool = monsters as Monster[];
	if (monsterPool.length === 0) {
		return;
	}

	const randomIndex = Math.floor(Math.random() * monsterPool.length);
	const selectedMonster = monsterPool[randomIndex];
	if (!selectedMonster) {
		return;
	}

	const activeHunters = getActiveHunters(room);
	const avgHunterLevel =
		activeHunters.length > 0
			? Math.round(
					activeHunters.reduce(
						(sum, hunter) => sum + hunter.level,
						0,
					) / activeHunters.length,
				)
			: 1;
	const monsterLevel = rollMonsterLevelForParty(avgHunterLevel);
	const encounter = createEncounterMonster(room, selectedMonster, monsterLevel);

	room.currentMonster = encounter;
	room.monsterHealth = encounter.health;
	room.battleEnded = false;
	room.isAwaitingMonsterAttack = false;
	room.monsterBurnRounds = 0;
	room.resolvedReward = null;

	for (const hunter of getActiveHunters(room)) {
		hunter.health = hunter.maxHealth;
	}

	const firstAlive = getAliveHunters(room)[0];
	room.turnHunterId = firstAlive ? firstAlive.id : null;
	room.logs = [];
	room.logSequence = 0;
	addBattleLogEntry(
		room,
		`${encounter.name} (Lv. ${encounter.level}) appeared from the wild.`,
		"system",
	);
}
