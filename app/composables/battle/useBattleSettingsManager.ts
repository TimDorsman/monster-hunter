import { computed, onScopeDispose, ref } from "vue";
import type { Monster } from "~~/types/battle";
import type { BattleGameSettings } from "~~/types/game-settings";
import { resolveEffectiveMonsterSettings } from "~~/utils/battle/selectors";
import {
	createDefaultBattleGameSettings,
	sanitizeBattleGameSettings,
} from "~~/utils/game-settings";
import { useBattleSettingsStorage } from "~/composables/battle/useBattleSettingsStorage";

const SETTINGS_SYNC_DELAY_MS = 90;

type UseBattleSettingsManagerOptions = {
	currentMonster: Ref<Monster | null>;
	sendSettings: (settings: BattleGameSettings) => void;
};

export function useBattleSettingsManager(
	options: UseBattleSettingsManagerOptions,
) {
	const { loadGameSettings, persistGameSettings } =
		useBattleSettingsStorage();

	const settings = ref<BattleGameSettings>(loadGameSettings());
	const effectiveMonsterSettings = computed(() =>
		resolveEffectiveMonsterSettings(
			options.currentMonster.value,
			settings.value,
		),
	);

	let settingsSyncTimer: ReturnType<typeof setTimeout> | null = null;

	function persistSanitizedSettings(nextSettings: BattleGameSettings) {
		const sanitizedSettings = sanitizeBattleGameSettings(nextSettings);
		settings.value = sanitizedSettings;
		persistGameSettings(sanitizedSettings);
		return sanitizedSettings;
	}

	function applyRemoteSettings(nextSettings: BattleGameSettings) {
		persistSanitizedSettings(nextSettings);
	}

	function updateGameSettings(nextSettings: BattleGameSettings) {
		const sanitizedSettings = persistSanitizedSettings(nextSettings);

		if (settingsSyncTimer) {
			clearTimeout(settingsSyncTimer);
		}

		settingsSyncTimer = setTimeout(() => {
			options.sendSettings(sanitizedSettings);
			settingsSyncTimer = null;
		}, SETTINGS_SYNC_DELAY_MS);
	}

	function resetGameSettings() {
		updateGameSettings(createDefaultBattleGameSettings());
	}

	onScopeDispose(() => {
		if (settingsSyncTimer) {
			clearTimeout(settingsSyncTimer);
		}
	});

	return {
		settings,
		effectiveMonsterSettings,
		applyRemoteSettings,
		updateGameSettings,
		resetGameSettings,
	};
}
