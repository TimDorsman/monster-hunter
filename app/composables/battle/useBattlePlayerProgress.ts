import { computed, ref } from "vue";
import type { BattleInventoryRow } from "~~/types/battle-ui";
import type { PlayerProgress } from "~~/types/loot";
import {
	calculateInventoryEntrySellValue,
	calculateInventorySellTotal,
	clonePlayerProgress,
	getLootItemDefinition,
} from "~~/utils/loot";
import { useBattleProgress } from "~/composables/battle/useBattleProgress";

export function useBattlePlayerProgress() {
	const { getOrCreatePlayerId, loadPlayerProgress, persistPlayerProgress } =
		useBattleProgress();

	const playerId = getOrCreatePlayerId();
	const playerProgress = ref<PlayerProgress>(loadPlayerProgress());

	const playerLevel = computed(() => playerProgress.value.level);
	const playerExperience = computed(() => playerProgress.value.experience);
	const playerGold = computed(() => playerProgress.value.gold);
	const playerInventory = computed(() => playerProgress.value.inventory);
	const playerInventoryDetails = computed<BattleInventoryRow[]>(() => {
		return playerInventory.value.map((inventoryEntry) => {
			const itemDefinition = getLootItemDefinition(inventoryEntry.itemId);
			return {
				...inventoryEntry,
				name: itemDefinition?.name ?? inventoryEntry.itemId,
				stackValue: calculateInventoryEntrySellValue(inventoryEntry),
			};
		});
	});
	const playerInventorySaleValue = computed(() =>
		calculateInventorySellTotal(playerInventory.value),
	);

	function persistNextPlayerProgress(nextProgress: PlayerProgress) {
		playerProgress.value = nextProgress;
		persistPlayerProgress(nextProgress);
	}

	function updatePlayerCombatProgress(level: number, experience: number) {
		const nextProgress = clonePlayerProgress(playerProgress.value);
		nextProgress.level = level;
		nextProgress.experience = experience;
		persistNextPlayerProgress(nextProgress);
	}

	return {
		playerId,
		playerProgress,
		playerLevel,
		playerExperience,
		playerGold,
		playerInventory,
		playerInventoryDetails,
		playerInventorySaleValue,
		persistNextPlayerProgress,
		updatePlayerCombatProgress,
	};
}
