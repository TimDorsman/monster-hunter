import type { BattleGameSettings, MonsterGameSettings } from "~~/types/game-settings";

function clampInteger(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, Math.round(value)));
}

function normalizeNullableInteger(
	value: unknown,
	min: number,
	max: number,
): number | null {
	if (value === null || value === undefined) {
		return null;
	}

	const numericValue =
		typeof value === "number" ? value : Number.parseFloat(String(value));
	if (!Number.isFinite(numericValue)) {
		return null;
	}

	return clampInteger(numericValue, min, max);
}

function normalizeInteger(value: unknown, fallback: number, min: number, max: number) {
	const numericValue =
		typeof value === "number" ? value : Number.parseFloat(String(value));
	if (!Number.isFinite(numericValue)) {
		return fallback;
	}

	return clampInteger(numericValue, min, max);
}

export const GAME_SETTINGS_LIMITS = {
	hunter: {
		maxHealth: { min: 25, max: 500 },
		damageMin: { min: 1, max: 150 },
		damageRange: { min: 1, max: 200 },
		healBase: { min: 1, max: 150 },
		healRange: { min: 1, max: 150 },
		dodgeChance: { min: 0, max: 100 },
		abilityChances: {
			attackChance: { min: 0, max: 100 },
			auraBeamChance: { min: 0, max: 100 },
			healChance: { min: 0, max: 100 },
			burnChance: { min: 0, max: 100 },
		},
	},
	monster: {
		health: { min: 50, max: 2500 },
		retaliationMinDamage: { min: 1, max: 200 },
		retaliationDamageRange: { min: 1, max: 250 },
		attackChance: { min: 0, max: 100 },
		healChance: { min: 0, max: 100 },
	},
} as const;

export const DEFAULT_BATTLE_GAME_SETTINGS: BattleGameSettings = {
	hunter: {
		maxHealth: 100,
		damageMin: 12,
		damageRange: 19,
		healBase: 12,
		healRange: 9,
		dodgeChance: 10,
		abilityChances: {
			attackChance: 90,
			auraBeamChance: 72,
			healChance: 85,
			burnChance: 55,
		},
	},
	monster: {
		health: null,
		retaliationMinDamage: null,
		retaliationDamageRange: null,
		attackChance: null,
		healChance: null,
	},
};

export function cloneBattleGameSettings(
	settings: BattleGameSettings = DEFAULT_BATTLE_GAME_SETTINGS,
): BattleGameSettings {
	return {
		hunter: {
			maxHealth: settings.hunter.maxHealth,
			damageMin: settings.hunter.damageMin,
			damageRange: settings.hunter.damageRange,
			healBase: settings.hunter.healBase,
			healRange: settings.hunter.healRange,
			dodgeChance: settings.hunter.dodgeChance,
			abilityChances: {
				attackChance: settings.hunter.abilityChances.attackChance,
				auraBeamChance: settings.hunter.abilityChances.auraBeamChance,
				healChance: settings.hunter.abilityChances.healChance,
				burnChance: settings.hunter.abilityChances.burnChance,
			},
		},
		monster: {
			health: settings.monster.health,
			retaliationMinDamage: settings.monster.retaliationMinDamage,
			retaliationDamageRange: settings.monster.retaliationDamageRange,
			attackChance: settings.monster.attackChance,
			healChance: settings.monster.healChance,
		},
	};
}

export function createDefaultBattleGameSettings() {
	return cloneBattleGameSettings(DEFAULT_BATTLE_GAME_SETTINGS);
}

export function sanitizeMonsterGameSettings(
	input: Partial<MonsterGameSettings> | null | undefined,
): MonsterGameSettings {
	return {
		health: normalizeNullableInteger(
			input?.health,
			GAME_SETTINGS_LIMITS.monster.health.min,
			GAME_SETTINGS_LIMITS.monster.health.max,
		),
		retaliationMinDamage: normalizeNullableInteger(
			input?.retaliationMinDamage,
			GAME_SETTINGS_LIMITS.monster.retaliationMinDamage.min,
			GAME_SETTINGS_LIMITS.monster.retaliationMinDamage.max,
		),
		retaliationDamageRange: normalizeNullableInteger(
			input?.retaliationDamageRange,
			GAME_SETTINGS_LIMITS.monster.retaliationDamageRange.min,
			GAME_SETTINGS_LIMITS.monster.retaliationDamageRange.max,
		),
		attackChance: normalizeNullableInteger(
			input?.attackChance,
			GAME_SETTINGS_LIMITS.monster.attackChance.min,
			GAME_SETTINGS_LIMITS.monster.attackChance.max,
		),
		healChance: normalizeNullableInteger(
			input?.healChance,
			GAME_SETTINGS_LIMITS.monster.healChance.min,
			GAME_SETTINGS_LIMITS.monster.healChance.max,
		),
	};
}

export function sanitizeBattleGameSettings(input: unknown): BattleGameSettings {
	const candidate =
		input && typeof input === "object"
			? (input as Partial<BattleGameSettings>)
			: undefined;

	return {
		hunter: {
			maxHealth: normalizeInteger(
				candidate?.hunter?.maxHealth,
				DEFAULT_BATTLE_GAME_SETTINGS.hunter.maxHealth,
				GAME_SETTINGS_LIMITS.hunter.maxHealth.min,
				GAME_SETTINGS_LIMITS.hunter.maxHealth.max,
			),
			damageMin: normalizeInteger(
				candidate?.hunter?.damageMin,
				DEFAULT_BATTLE_GAME_SETTINGS.hunter.damageMin,
				GAME_SETTINGS_LIMITS.hunter.damageMin.min,
				GAME_SETTINGS_LIMITS.hunter.damageMin.max,
			),
			damageRange: normalizeInteger(
				candidate?.hunter?.damageRange,
				DEFAULT_BATTLE_GAME_SETTINGS.hunter.damageRange,
				GAME_SETTINGS_LIMITS.hunter.damageRange.min,
				GAME_SETTINGS_LIMITS.hunter.damageRange.max,
			),
			healBase: normalizeInteger(
				candidate?.hunter?.healBase,
				DEFAULT_BATTLE_GAME_SETTINGS.hunter.healBase,
				GAME_SETTINGS_LIMITS.hunter.healBase.min,
				GAME_SETTINGS_LIMITS.hunter.healBase.max,
			),
			healRange: normalizeInteger(
				candidate?.hunter?.healRange,
				DEFAULT_BATTLE_GAME_SETTINGS.hunter.healRange,
				GAME_SETTINGS_LIMITS.hunter.healRange.min,
				GAME_SETTINGS_LIMITS.hunter.healRange.max,
			),
			dodgeChance: normalizeInteger(
				candidate?.hunter?.dodgeChance,
				DEFAULT_BATTLE_GAME_SETTINGS.hunter.dodgeChance,
				GAME_SETTINGS_LIMITS.hunter.dodgeChance.min,
				GAME_SETTINGS_LIMITS.hunter.dodgeChance.max,
			),
			abilityChances: {
				attackChance: normalizeInteger(
					candidate?.hunter?.abilityChances?.attackChance,
					DEFAULT_BATTLE_GAME_SETTINGS.hunter.abilityChances.attackChance,
					GAME_SETTINGS_LIMITS.hunter.abilityChances.attackChance.min,
					GAME_SETTINGS_LIMITS.hunter.abilityChances.attackChance.max,
				),
				auraBeamChance: normalizeInteger(
					candidate?.hunter?.abilityChances?.auraBeamChance,
					DEFAULT_BATTLE_GAME_SETTINGS.hunter.abilityChances.auraBeamChance,
					GAME_SETTINGS_LIMITS.hunter.abilityChances.auraBeamChance.min,
					GAME_SETTINGS_LIMITS.hunter.abilityChances.auraBeamChance.max,
				),
				healChance: normalizeInteger(
					candidate?.hunter?.abilityChances?.healChance,
					DEFAULT_BATTLE_GAME_SETTINGS.hunter.abilityChances.healChance,
					GAME_SETTINGS_LIMITS.hunter.abilityChances.healChance.min,
					GAME_SETTINGS_LIMITS.hunter.abilityChances.healChance.max,
				),
				burnChance: normalizeInteger(
					candidate?.hunter?.abilityChances?.burnChance,
					DEFAULT_BATTLE_GAME_SETTINGS.hunter.abilityChances.burnChance,
					GAME_SETTINGS_LIMITS.hunter.abilityChances.burnChance.min,
					GAME_SETTINGS_LIMITS.hunter.abilityChances.burnChance.max,
				),
			},
		},
		monster: sanitizeMonsterGameSettings(candidate?.monster),
	};
}
