import { describe, expect, it } from "vitest";
import type { Monster } from "~~/types/battle";
import { DEFAULT_BATTLE_GAME_SETTINGS } from "~~/utils/game-settings";
import {
	getBattleTurnViewState,
	resolveEffectiveMonsterSettings,
} from "~~/utils/battle/selectors";

const monster: Monster = {
	id: 7,
	name: "Frostclaw",
	health: 320,
	experience: 55,
	weaknesses: [],
	strenghts: [],
	abilities: [
		{
			name: "attack",
			chance: 68,
		},
		{
			name: "heal",
			chance: 22,
		},
	],
	lootTable: [],
	level: 6,
	baseHealth: 320,
	baseExperience: 55,
	defaultHealth: 320,
	retaliationMinDamage: 12,
	retaliationDamageRange: 18,
	defaultRetaliationMinDamage: 12,
	defaultRetaliationDamageRange: 18,
	defaultAttackChance: 68,
	defaultHealChance: 22,
	experienceReward: 95,
};

describe("battle selectors", () => {
	it("derives effective monster settings from the live monster when no overrides exist", () => {
		expect(
			resolveEffectiveMonsterSettings(monster, DEFAULT_BATTLE_GAME_SETTINGS),
		).toEqual({
			health: 320,
			retaliationMinDamage: 12,
			retaliationDamageRange: 18,
			attackChance: 68,
			healChance: 22,
		});
	});

	it("builds player-turn banner copy", () => {
		expect(
			getBattleTurnViewState({
				battleEnded: false,
				isAwaitingMonsterAttack: false,
				activeTurn: "player",
				isSpectator: false,
				currentTurnHunterName: "",
				currentMonsterName: "Frostclaw",
			}),
		).toEqual({
			bannerLabel: "YOUR TURN",
			hintLabel: "Choose an ability to take your action.",
			isMonsterTurn: false,
			isOtherHunterTurn: false,
		});
	});

	it("builds monster-turn banner copy", () => {
		expect(
			getBattleTurnViewState({
				battleEnded: false,
				isAwaitingMonsterAttack: true,
				activeTurn: "monster",
				isSpectator: false,
				currentTurnHunterName: "",
				currentMonsterName: "Frostclaw",
			}),
		).toEqual({
			bannerLabel: "MONSTER TURN",
			hintLabel: "Frostclaw is preparing an attack.",
			isMonsterTurn: true,
			isOtherHunterTurn: false,
		});
	});
});
