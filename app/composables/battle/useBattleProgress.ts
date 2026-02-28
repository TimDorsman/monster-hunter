const PLAYER_PROGRESS_STORAGE_KEY = "monster-hunter-player-progress-v1";
const PLAYER_ID_SESSION_KEY = "monster-hunter-player-id-session-v1";

export function calculateRequiredExperience(level: number) {
	return Math.round(60 + level * 40 + level * level * 12);
}

export function useBattleProgress() {
	function getOrCreatePlayerId() {
		if (!import.meta.client) {
			return "server-player";
		}

		const existingId = sessionStorage.getItem(PLAYER_ID_SESSION_KEY);
		if (existingId) {
			return existingId;
		}

		let nextId = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
		if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
			nextId = crypto.randomUUID();
		}
		sessionStorage.setItem(PLAYER_ID_SESSION_KEY, nextId);
		return nextId;
	}

	function loadPlayerProgress() {
		if (!import.meta.client) {
			return {
				level: 1,
				experience: 0,
			};
		}

		try {
			const rawProgress = localStorage.getItem(PLAYER_PROGRESS_STORAGE_KEY);
			if (!rawProgress) {
				return {
					level: 1,
					experience: 0,
				};
			}

			const parsedProgress = JSON.parse(rawProgress) as Partial<{
				level: number;
				experience: number;
			}>;
			const level = Number(parsedProgress.level);
			const experience = Number(parsedProgress.experience);
			return {
				level: Number.isFinite(level) && level >= 1 ? Math.floor(level) : 1,
				experience:
					Number.isFinite(experience) && experience >= 0
						? Math.floor(experience)
						: 0,
			};
		} catch {
			return {
				level: 1,
				experience: 0,
			};
		}
	}

	function persistPlayerProgress(level: number, experience: number) {
		if (!import.meta.client) {
			return;
		}

		localStorage.setItem(
			PLAYER_PROGRESS_STORAGE_KEY,
			JSON.stringify({
				level,
				experience,
			}),
		);
	}

	return {
		getOrCreatePlayerId,
		loadPlayerProgress,
		persistPlayerProgress,
	};
}
