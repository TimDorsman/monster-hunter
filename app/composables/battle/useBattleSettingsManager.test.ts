import { effectScope, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Monster } from "~~/types/battle";
import { useBattleSettingsManager } from "~/composables/battle/useBattleSettingsManager";

const monster = ref<Monster | null>({
	id: 1,
	name: "Ash Drake",
	health: 300,
	experience: 45,
	weaknesses: [],
	strenghts: [],
	abilities: [
		{
			name: "attack",
			chance: 70,
		},
	],
	lootTable: [],
	level: 5,
	baseHealth: 300,
	baseExperience: 45,
	defaultHealth: 300,
	retaliationMinDamage: 9,
	retaliationDamageRange: 14,
	defaultRetaliationMinDamage: 9,
	defaultRetaliationDamageRange: 14,
	defaultAttackChance: 70,
	defaultHealChance: 0,
	experienceReward: 80,
});

describe("useBattleSettingsManager", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("debounces outbound settings sync and only sends the latest settings", () => {
		vi.useFakeTimers();
		const sentSettings: number[] = [];
		let manager: ReturnType<typeof useBattleSettingsManager> | undefined;
		const scope = effectScope();

		scope.run(() => {
			manager = useBattleSettingsManager({
				currentMonster: monster,
				sendSettings: (settings) => {
					sentSettings.push(settings.hunter.maxHealth);
				},
			});
		});

		if (!manager) {
			throw new Error("Expected settings manager to initialize.");
		}

		manager.updateGameSettings({
			...manager.settings.value,
			hunter: {
				...manager.settings.value.hunter,
				maxHealth: 120,
			},
		});
		manager.updateGameSettings({
			...manager.settings.value,
			hunter: {
				...manager.settings.value.hunter,
				maxHealth: 140,
			},
		});

		expect(sentSettings).toEqual([]);
		vi.advanceTimersByTime(89);
		expect(sentSettings).toEqual([]);
		vi.advanceTimersByTime(1);
		expect(sentSettings).toEqual([140]);

		scope.stop();
	});
});
