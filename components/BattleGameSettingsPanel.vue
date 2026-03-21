<script setup lang="ts">
import type { BattleGameSettings, HunterAbilityChanceSettings, HunterGameSettings, MonsterGameSettings } from "~/types/game-settings";
import { GAME_SETTINGS_LIMITS } from "../utils/game-settings";

type EffectiveMonsterSettings = {
	health: number;
	retaliationMinDamage: number;
	retaliationDamageRange: number;
	attackChance: number;
	healChance: number;
};

type HunterSettingKey = Exclude<keyof HunterGameSettings, "abilityChances">;
type HunterAbilitySettingKey = keyof HunterAbilityChanceSettings;
type MonsterSettingKey = keyof MonsterGameSettings;

type SliderConfig<TKey extends string> = {
	key: TKey;
	label: string;
	unit: string;
	min: number;
	max: number;
	step?: number;
	description?: string;
};

const props = defineProps<{
	settings: BattleGameSettings;
	effectiveMonsterSettings: EffectiveMonsterSettings;
}>();

const emit = defineEmits<{
	(event: "update-hunter-setting", payload: { key: HunterSettingKey; value: number }): void;
	(event: "update-hunter-ability-setting", payload: {
		key: HunterAbilitySettingKey;
		value: number;
	}): void;
	(event: "update-monster-setting", payload: {
		key: MonsterSettingKey;
		value: number | null;
	}): void;
	(event: "reset"): void;
}>();

const hunterSettingControls: SliderConfig<HunterSettingKey>[] = [
	{
		key: "maxHealth",
		label: "Max Health",
		unit: "HP",
		...GAME_SETTINGS_LIMITS.hunter.maxHealth,
	},
	{
		key: "damageMin",
		label: "Damage Min",
		unit: "DMG",
		...GAME_SETTINGS_LIMITS.hunter.damageMin,
	},
	{
		key: "damageRange",
		label: "Damage Range",
		unit: "DMG",
		...GAME_SETTINGS_LIMITS.hunter.damageRange,
	},
	{
		key: "healBase",
		label: "Heal Base",
		unit: "HP",
		...GAME_SETTINGS_LIMITS.hunter.healBase,
	},
	{
		key: "healRange",
		label: "Heal Range",
		unit: "HP",
		...GAME_SETTINGS_LIMITS.hunter.healRange,
	},
	{
		key: "dodgeChance",
		label: "Dodge Chance",
		unit: "%",
		...GAME_SETTINGS_LIMITS.hunter.dodgeChance,
	},
];

const hunterAbilityControls: SliderConfig<HunterAbilitySettingKey>[] = [
	{
		key: "attackChance",
		label: "Attack Hit",
		unit: "%",
		...GAME_SETTINGS_LIMITS.hunter.abilityChances.attackChance,
	},
	{
		key: "auraBeamChance",
		label: "Aura Beam Hit",
		unit: "%",
		...GAME_SETTINGS_LIMITS.hunter.abilityChances.auraBeamChance,
	},
	{
		key: "healChance",
		label: "Heal Cast",
		unit: "%",
		...GAME_SETTINGS_LIMITS.hunter.abilityChances.healChance,
	},
	{
		key: "burnChance",
		label: "Burn Hit",
		unit: "%",
		...GAME_SETTINGS_LIMITS.hunter.abilityChances.burnChance,
	},
];

const monsterControls: SliderConfig<MonsterSettingKey>[] = [
	{
		key: "health",
		label: "Monster Health",
		unit: "HP",
		...GAME_SETTINGS_LIMITS.monster.health,
		description: "Overrides current and future encounters until reset.",
	},
	{
		key: "retaliationMinDamage",
		label: "Monster Damage Min",
		unit: "DMG",
		...GAME_SETTINGS_LIMITS.monster.retaliationMinDamage,
	},
	{
		key: "retaliationDamageRange",
		label: "Monster Damage Range",
		unit: "DMG",
		...GAME_SETTINGS_LIMITS.monster.retaliationDamageRange,
	},
	{
		key: "attackChance",
		label: "Monster Attack Hit",
		unit: "%",
		...GAME_SETTINGS_LIMITS.monster.attackChance,
	},
	{
		key: "healChance",
		label: "Monster Heal Chance",
		unit: "%",
		...GAME_SETTINGS_LIMITS.monster.healChance,
	},
];

function normalizeSliderValue(value: number | number[] | undefined) {
	if (Array.isArray(value)) {
		return value[0] ?? 0;
	}

	return value ?? 0;
}

function updateHunterSetting(key: HunterSettingKey, value: number | number[] | undefined) {
	emit("update-hunter-setting", {
		key,
		value: normalizeSliderValue(value),
	});
}

function updateHunterAbilitySetting(
	key: HunterAbilitySettingKey,
	value: number | number[] | undefined,
) {
	emit("update-hunter-ability-setting", {
		key,
		value: normalizeSliderValue(value),
	});
}

function updateMonsterSetting(
	key: MonsterSettingKey,
	value: number | number[] | undefined,
) {
	emit("update-monster-setting", {
		key,
		value: normalizeSliderValue(value),
	});
}

function getMonsterDisplayValue(key: MonsterSettingKey) {
	return props.effectiveMonsterSettings[key];
}
</script>

<template>
	<section
		class="settings-panel w-[min(26rem,calc(100vw-3rem))] rounded-2xl border border-white/20 p-4 text-white shadow-2xl backdrop-blur"
	>
		<div class="mb-4 flex items-start justify-between gap-3">
			<div>
				<p class="section-text-outline text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/90">
					Game Settings
				</p>
				<p class="mt-1 text-xs text-white/70">
					Room-wide sliders update the live battle instantly and persist locally.
				</p>
			</div>
			<UButton
				size="xs"
				color="neutral"
				variant="soft"
				@click="emit('reset')"
			>
				Reset to Defaults
			</UButton>
		</div>

		<div class="settings-group">
			<p class="settings-group-title">Hunter</p>
			<div
				v-for="control in hunterSettingControls"
				:key="control.key"
				class="setting-row"
			>
				<div class="setting-row-header">
					<div>
						<p class="setting-label">{{ control.label }}</p>
					</div>
					<p class="setting-value">
						{{ settings.hunter[control.key] }}{{ control.unit }}
					</p>
				</div>
				<USlider
					:model-value="settings.hunter[control.key]"
					:min="control.min"
					:max="control.max"
					:step="control.step ?? 1"
					size="sm"
					color="neutral"
					@update:model-value="updateHunterSetting(control.key, $event)"
				/>
			</div>
		</div>

		<div class="settings-group">
			<p class="settings-group-title">Hunter Ability Chances</p>
			<div
				v-for="control in hunterAbilityControls"
				:key="control.key"
				class="setting-row"
			>
				<div class="setting-row-header">
					<p class="setting-label">{{ control.label }}</p>
					<p class="setting-value">
						{{ settings.hunter.abilityChances[control.key] }}{{ control.unit }}
					</p>
				</div>
				<USlider
					:model-value="settings.hunter.abilityChances[control.key]"
					:min="control.min"
					:max="control.max"
					:step="control.step ?? 1"
					size="sm"
					color="neutral"
					@update:model-value="updateHunterAbilitySetting(control.key, $event)"
				/>
			</div>
		</div>

		<div class="settings-group settings-group-last">
			<p class="settings-group-title">Monster</p>
			<div
				v-for="control in monsterControls"
				:key="control.key"
				class="setting-row"
			>
				<div class="setting-row-header">
					<div>
						<p class="setting-label">{{ control.label }}</p>
						<p
							v-if="control.description"
							class="setting-description"
						>
							{{ control.description }}
						</p>
					</div>
					<p class="setting-value">
						{{ getMonsterDisplayValue(control.key) }}{{ control.unit }}
					</p>
				</div>
				<USlider
					:model-value="getMonsterDisplayValue(control.key)"
					:min="control.min"
					:max="control.max"
					:step="control.step ?? 1"
					size="sm"
					color="neutral"
					@update:model-value="updateMonsterSetting(control.key, $event)"
				/>
			</div>
		</div>
	</section>
</template>

<style scoped>
.settings-panel {
	background-color: var(--ui-bg-elevated, rgba(31, 41, 55, 0.92));
}

.settings-group {
	margin-top: 1rem;
	border-top: 1px solid rgba(255, 255, 255, 0.1);
	padding-top: 1rem;
}

.settings-group-title {
	margin-bottom: 0.75rem;
	font-size: 0.75rem;
	font-weight: 800;
	letter-spacing: 0.14em;
	text-transform: uppercase;
	color: rgba(186, 230, 253, 0.88);
}

.setting-row + .setting-row {
	margin-top: 0.85rem;
}

.setting-row-header {
	margin-bottom: 0.4rem;
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 0.75rem;
}

.setting-label {
	font-size: 0.82rem;
	font-weight: 700;
	color: rgba(255, 255, 255, 0.95);
}

.setting-description {
	margin-top: 0.1rem;
	max-width: 16rem;
	font-size: 0.68rem;
	line-height: 1.35;
	color: rgba(255, 255, 255, 0.55);
}

.setting-value {
	font-size: 0.76rem;
	font-weight: 800;
	letter-spacing: 0.08em;
	color: rgba(253, 224, 71, 0.95);
	text-transform: uppercase;
}
</style>
