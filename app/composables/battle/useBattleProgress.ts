import type { InventoryEntry, PlayerProgress } from "~~/types/loot";
import { calculateRequiredExperience } from "~~/utils/battle/progression";
import { stackInventoryEntries } from "~~/utils/loot";

const PLAYER_PROGRESS_STORAGE_KEY = "monster-hunter-player-progress-v2";
const LEGACY_PLAYER_PROGRESS_STORAGE_KEY = "monster-hunter-player-progress-v1";
const PLAYER_ID_SESSION_KEY = "monster-hunter-player-id-session-v1";

function createDefaultPlayerProgress(): PlayerProgress {
	return {
		level: 1,
		experience: 0,
		gold: 0,
		inventory: [],
		claimedRewardIds: [],
	};
}

function normalizeInventoryEntry(
	entry: Partial<InventoryEntry> | null | undefined,
): InventoryEntry | null {
	if (!entry?.itemId) {
		return null;
	}

	const quantity = Number(entry.quantity);
	const baseSellValue = Number(entry.baseSellValue);
	const timesSold = Number(entry.timesSold);
	const lastObtainedAt = Number(entry.lastObtainedAt);

	return {
		itemId: entry.itemId,
		quantity:
			Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1,
		rarity: entry.rarity ?? "common",
		baseSellValue:
			Number.isFinite(baseSellValue) && baseSellValue > 0
				? Math.floor(baseSellValue)
				: 1,
		category: entry.category ?? "material",
		craftingTags: Array.isArray(entry.craftingTags)
			? entry.craftingTags
					.filter((tag): tag is string => typeof tag === "string")
					.slice(0, 12)
			: [],
		timesSold:
			Number.isFinite(timesSold) && timesSold >= 0
				? Math.floor(timesSold)
				: 0,
		lastObtainedAt:
			Number.isFinite(lastObtainedAt) && lastObtainedAt > 0
				? Math.floor(lastObtainedAt)
				: Date.now(),
	};
}

function normalizePlayerProgress(rawProgress: unknown): PlayerProgress {
	if (!rawProgress || typeof rawProgress !== "object") {
		return createDefaultPlayerProgress();
	}

	const candidate = rawProgress as Partial<PlayerProgress>;
	const level = Number(candidate.level);
	const experience = Number(candidate.experience);
	const gold = Number(candidate.gold);
	const inventory = Array.isArray(candidate.inventory)
		? candidate.inventory
				.map((entry) =>
					normalizeInventoryEntry(entry as Partial<InventoryEntry>),
				)
				.filter((entry): entry is InventoryEntry => Boolean(entry))
		: [];
	const claimedRewardIds = Array.isArray(candidate.claimedRewardIds)
		? candidate.claimedRewardIds.filter(
				(rewardId): rewardId is string => typeof rewardId === "string",
			)
		: [];

	return {
		level: Number.isFinite(level) && level >= 1 ? Math.floor(level) : 1,
		experience:
			Number.isFinite(experience) && experience >= 0
				? Math.floor(experience)
				: 0,
		gold: Number.isFinite(gold) && gold >= 0 ? Math.floor(gold) : 0,
		inventory: stackInventoryEntries(inventory),
		claimedRewardIds,
	};
}

function normalizeLegacyPlayerProgress(rawProgress: unknown): PlayerProgress {
	if (!rawProgress || typeof rawProgress !== "object") {
		return createDefaultPlayerProgress();
	}

	const candidate = rawProgress as Partial<{
		level: number;
		experience: number;
		gold: number;
	}>;

	return normalizePlayerProgress({
		level: candidate.level,
		experience: candidate.experience,
		gold: candidate.gold,
		inventory: [],
		claimedRewardIds: [],
	});
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
			return createDefaultPlayerProgress();
		}

		try {
			const rawProgress = localStorage.getItem(PLAYER_PROGRESS_STORAGE_KEY);
			if (rawProgress) {
				return normalizePlayerProgress(JSON.parse(rawProgress));
			}

			const rawLegacyProgress = localStorage.getItem(
				LEGACY_PLAYER_PROGRESS_STORAGE_KEY,
			);
			if (!rawLegacyProgress) {
				return createDefaultPlayerProgress();
			}

			const migratedProgress = normalizeLegacyPlayerProgress(
				JSON.parse(rawLegacyProgress),
			);
			persistPlayerProgress(migratedProgress);
			return migratedProgress;
		} catch {
			return createDefaultPlayerProgress();
		}
	}

	function persistPlayerProgress(progress: PlayerProgress) {
		if (!import.meta.client) {
			return;
		}

		localStorage.setItem(
			PLAYER_PROGRESS_STORAGE_KEY,
			JSON.stringify(progress),
		);
	}

	return {
		getOrCreatePlayerId,
		loadPlayerProgress,
		persistPlayerProgress,
	};
}
