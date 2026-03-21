export type HunterAbilityChanceSettings = {
	attackChance: number;
	auraBeamChance: number;
	healChance: number;
	burnChance: number;
};

export type HunterGameSettings = {
	maxHealth: number;
	damageMin: number;
	damageRange: number;
	healBase: number;
	healRange: number;
	dodgeChance: number;
	abilityChances: HunterAbilityChanceSettings;
};

export type MonsterGameSettings = {
	health: number | null;
	retaliationMinDamage: number | null;
	retaliationDamageRange: number | null;
	attackChance: number | null;
	healChance: number | null;
};

export type BattleGameSettings = {
	hunter: HunterGameSettings;
	monster: MonsterGameSettings;
};
