export type HunterActionChanceKey = "attack" | "auraBeam" | "heal" | "burn";
export type MonsterAbilityName = "attack" | "heal";

export const HUNTER_ABILITY_SUCCESS_CHANCES: Record<
	HunterActionChanceKey,
	number
> = {
	attack: 90,
	auraBeam: 72,
	heal: 85,
	burn: 55,
};

export const DEFAULT_MONSTER_ATTACK_CHANCE = 80;

export function getMonsterAbilityChance(
	abilities: Array<{ name: MonsterAbilityName; chance: number }> | undefined,
	abilityName: MonsterAbilityName,
	fallbackChance: number,
) {
	return abilities?.find((ability) => ability.name === abilityName)?.chance ?? fallbackChance;
}
