import type { BattleGameSettings } from "~~/types/game-settings";
import {
	createDefaultBattleGameSettings,
	sanitizeBattleGameSettings,
} from "~~/utils/game-settings";

const GAME_SETTINGS_STORAGE_KEY = "monster-hunter-game-settings-v1";
const GAME_SETTINGS_PANEL_STORAGE_KEY = "monster-hunter-game-settings-panel-v1";

export function useBattleSettingsStorage() {
	function loadGameSettings(): BattleGameSettings {
		if (!import.meta.client) {
			return createDefaultBattleGameSettings();
		}

		try {
			const rawSettings = localStorage.getItem(GAME_SETTINGS_STORAGE_KEY);
			if (!rawSettings) {
				return createDefaultBattleGameSettings();
			}

			return sanitizeBattleGameSettings(JSON.parse(rawSettings));
		} catch {
			return createDefaultBattleGameSettings();
		}
	}

	function persistGameSettings(settings: BattleGameSettings) {
		if (!import.meta.client) {
			return;
		}

		localStorage.setItem(
			GAME_SETTINGS_STORAGE_KEY,
			JSON.stringify(sanitizeBattleGameSettings(settings)),
		);
	}

	function loadPanelOpenState() {
		if (!import.meta.client) {
			return false;
		}

		return localStorage.getItem(GAME_SETTINGS_PANEL_STORAGE_KEY) === "true";
	}

	function persistPanelOpenState(isOpen: boolean) {
		if (!import.meta.client) {
			return;
		}

		localStorage.setItem(
			GAME_SETTINGS_PANEL_STORAGE_KEY,
			isOpen ? "true" : "false",
		);
	}

	return {
		loadGameSettings,
		persistGameSettings,
		loadPanelOpenState,
		persistPanelOpenState,
	};
}
