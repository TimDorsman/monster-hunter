import {
	createDefaultBattleGameSettings,
	sanitizeBattleGameSettings,
} from "~~/utils/game-settings";
import { DEFAULT_MONSTER_ATTACK_CHANCE, getMonsterAbilityChance } from "~~/utils/battle-abilities";
import type { BattleRoom, EncounterMonster, Monster } from "./types";

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

function applyHealthRatio(currentHealth: number, previousMaxHealth: number, nextMaxHealth: number) {
	if (currentHealth <= 0) {
		return 0;
	}

	if (previousMaxHealth <= 0) {
		return nextMaxHealth;
	}

	const healthRatio = currentHealth / previousMaxHealth;
	return clamp(Math.round(nextMaxHealth * healthRatio), 1, nextMaxHealth);
}

function buildMonsterAbilities(attackChance: number, healChance: number) {
	return [
		{
			name: "attack" as const,
			chance: attackChance,
		},
		{
			name: "heal" as const,
			chance: healChance,
		},
	];
}

export function createInitialBattleGameSettings() {
	return createDefaultBattleGameSettings();
}

export function getDefaultMonsterAttackChance(monster: Monster) {
	return getMonsterAbilityChance(
		monster.abilities,
		"attack",
		DEFAULT_MONSTER_ATTACK_CHANCE,
	);
}

export function getDefaultMonsterHealChance(monster: Monster) {
	return getMonsterAbilityChance(monster.abilities, "heal", 0);
}

export function getEffectiveMonsterMaxHealth(
	room: BattleRoom,
	monster: Pick<EncounterMonster, "defaultHealth">,
) {
	return room.settings.monster.health ?? monster.defaultHealth;
}

export function getEffectiveMonsterRetaliationMinDamage(
	room: BattleRoom,
	monster: Pick<EncounterMonster, "defaultRetaliationMinDamage">,
) {
	return (
		room.settings.monster.retaliationMinDamage ??
		monster.defaultRetaliationMinDamage
	);
}

export function getEffectiveMonsterRetaliationDamageRange(
	room: BattleRoom,
	monster: Pick<EncounterMonster, "defaultRetaliationDamageRange">,
) {
	return (
		room.settings.monster.retaliationDamageRange ??
		monster.defaultRetaliationDamageRange
	);
}

export function getEffectiveMonsterAttackChance(
	room: BattleRoom,
	monster: Pick<EncounterMonster, "defaultAttackChance">,
) {
	return room.settings.monster.attackChance ?? monster.defaultAttackChance;
}

export function getEffectiveMonsterHealChance(
	room: BattleRoom,
	monster: Pick<EncounterMonster, "defaultHealChance">,
) {
	return room.settings.monster.healChance ?? monster.defaultHealChance;
}

export function applyEffectiveStatsToMonster(room: BattleRoom, monster: EncounterMonster) {
	const previousMaxHealth = monster.health;
	const nextMaxHealth = getEffectiveMonsterMaxHealth(room, monster);
	const nextAttackChance = getEffectiveMonsterAttackChance(room, monster);
	const nextHealChance = getEffectiveMonsterHealChance(room, monster);

	monster.health = nextMaxHealth;
	monster.retaliationMinDamage = getEffectiveMonsterRetaliationMinDamage(
		room,
		monster,
	);
	monster.retaliationDamageRange = getEffectiveMonsterRetaliationDamageRange(
		room,
		monster,
	);
	monster.abilities = buildMonsterAbilities(nextAttackChance, nextHealChance);
	room.monsterHealth = applyHealthRatio(room.monsterHealth, previousMaxHealth, nextMaxHealth);
}

export function applySettingsToHunters(room: BattleRoom) {
	for (const hunter of room.hunters.values()) {
		const previousMaxHealth = hunter.maxHealth;
		const nextMaxHealth = room.settings.hunter.maxHealth;
		hunter.maxHealth = nextMaxHealth;
		hunter.health = applyHealthRatio(
			hunter.health,
			previousMaxHealth,
			nextMaxHealth,
		);
	}
}

export function applyBattleGameSettings(room: BattleRoom, nextSettingsInput: unknown) {
	room.settings = sanitizeBattleGameSettings(nextSettingsInput);
	applySettingsToHunters(room);

	if (room.currentMonster) {
		applyEffectiveStatsToMonster(room, room.currentMonster);
	}
}
