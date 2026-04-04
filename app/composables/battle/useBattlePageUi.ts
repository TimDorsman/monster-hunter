import { computed, onScopeDispose, ref, watch } from "vue";
import { useBattleSettingsStorage } from "~/composables/battle/useBattleSettingsStorage";

const LEVEL_UP_OVERLAY_DURATION_MS = 2700;
const CARD_SHAKE_DURATION_MS = 320;
const CARD_HIT_DURATION_MS = 220;

type UseBattlePageUiOptions = {
	levelUpAnnouncementCount: Ref<number>;
	hunterAttackCount: Ref<number>;
	monsterAttackCount: Ref<number>;
	hunterDamagedCount: Ref<number>;
	monsterDamagedCount: Ref<number>;
	currentRewardId: Ref<string>;
	onLevelUp: () => void;
};

export function useBattlePageUi(options: UseBattlePageUiOptions) {
	const { loadPanelOpenState, persistPanelOpenState } =
		useBattleSettingsStorage();

	const showLevelUpOverlay = ref(false);
	const levelUpOverlayKey = ref(0);
	const showChest = ref(false);
	const showLootPopup = ref(false);
	const isHunterCardShaking = ref(false);
	const isMonsterCardShaking = ref(false);
	const isHunterCardHit = ref(false);
	const isMonsterCardHit = ref(false);
	const showRoomStatus = ref(false);
	const showGameSettings = ref(loadPanelOpenState());
	const showInventory = ref(true);
	const isRewardSequenceActive = computed(
		() => showChest.value || showLootPopup.value,
	);

	let levelUpOverlayTimer: ReturnType<typeof setTimeout> | null = null;
	let hunterShakeTimer: ReturnType<typeof setTimeout> | null = null;
	let monsterShakeTimer: ReturnType<typeof setTimeout> | null = null;
	let hunterHitTimer: ReturnType<typeof setTimeout> | null = null;
	let monsterHitTimer: ReturnType<typeof setTimeout> | null = null;
	let hasHydratedLevelUpCount = false;
	let hasHydratedHunterAttackCount = false;
	let hasHydratedMonsterAttackCount = false;
	let hasHydratedHunterDamagedCount = false;
	let hasHydratedMonsterDamagedCount = false;
	let hasHydratedRewardId = false;

	function resetRewardSequence() {
		showChest.value = false;
		showLootPopup.value = false;
	}

	function openRewardChest() {
		showChest.value = false;
		showLootPopup.value = true;
	}

	function closeRewardSequence() {
		showLootPopup.value = false;
		showChest.value = false;
	}

	function toggleRoomStatus() {
		showRoomStatus.value = !showRoomStatus.value;
	}

	function toggleGameSettings() {
		showGameSettings.value = !showGameSettings.value;
	}

	function toggleInventory() {
		showInventory.value = !showInventory.value;
	}

	watch(options.levelUpAnnouncementCount, () => {
		if (!hasHydratedLevelUpCount) {
			hasHydratedLevelUpCount = true;
			return;
		}

		options.onLevelUp();
		levelUpOverlayKey.value += 1;
		showLevelUpOverlay.value = true;
		if (levelUpOverlayTimer) {
			clearTimeout(levelUpOverlayTimer);
		}
		levelUpOverlayTimer = setTimeout(() => {
			showLevelUpOverlay.value = false;
			levelUpOverlayTimer = null;
		}, LEVEL_UP_OVERLAY_DURATION_MS);
	});

	watch(options.hunterAttackCount, () => {
		if (!hasHydratedHunterAttackCount) {
			hasHydratedHunterAttackCount = true;
			return;
		}

		isHunterCardShaking.value = true;
		if (hunterShakeTimer) {
			clearTimeout(hunterShakeTimer);
		}
		hunterShakeTimer = setTimeout(() => {
			isHunterCardShaking.value = false;
			hunterShakeTimer = null;
		}, CARD_SHAKE_DURATION_MS);
	});

	watch(options.monsterAttackCount, () => {
		if (!hasHydratedMonsterAttackCount) {
			hasHydratedMonsterAttackCount = true;
			return;
		}

		isMonsterCardShaking.value = true;
		if (monsterShakeTimer) {
			clearTimeout(monsterShakeTimer);
		}
		monsterShakeTimer = setTimeout(() => {
			isMonsterCardShaking.value = false;
			monsterShakeTimer = null;
		}, CARD_SHAKE_DURATION_MS);
	});

	watch(options.hunterDamagedCount, () => {
		if (!hasHydratedHunterDamagedCount) {
			hasHydratedHunterDamagedCount = true;
			return;
		}

		isHunterCardHit.value = true;
		if (hunterHitTimer) {
			clearTimeout(hunterHitTimer);
		}
		hunterHitTimer = setTimeout(() => {
			isHunterCardHit.value = false;
			hunterHitTimer = null;
		}, CARD_HIT_DURATION_MS);
	});

	watch(options.monsterDamagedCount, () => {
		if (!hasHydratedMonsterDamagedCount) {
			hasHydratedMonsterDamagedCount = true;
			return;
		}

		isMonsterCardHit.value = true;
		if (monsterHitTimer) {
			clearTimeout(monsterHitTimer);
		}
		monsterHitTimer = setTimeout(() => {
			isMonsterCardHit.value = false;
			monsterHitTimer = null;
		}, CARD_HIT_DURATION_MS);
	});

	watch(showGameSettings, (isOpen) => {
		persistPanelOpenState(isOpen);
	});

	watch(options.currentRewardId, (rewardId, previousRewardId) => {
		if (!hasHydratedRewardId) {
			hasHydratedRewardId = true;
			return;
		}

		if (!rewardId) {
			resetRewardSequence();
			return;
		}

		if (rewardId === previousRewardId) {
			return;
		}

		showChest.value = true;
		showLootPopup.value = false;
	});

	onScopeDispose(() => {
		if (levelUpOverlayTimer) {
			clearTimeout(levelUpOverlayTimer);
		}
		if (hunterShakeTimer) {
			clearTimeout(hunterShakeTimer);
		}
		if (monsterShakeTimer) {
			clearTimeout(monsterShakeTimer);
		}
		if (hunterHitTimer) {
			clearTimeout(hunterHitTimer);
		}
		if (monsterHitTimer) {
			clearTimeout(monsterHitTimer);
		}
	});

	return {
		showLevelUpOverlay,
		levelUpOverlayKey,
		showChest,
		showLootPopup,
		isHunterCardShaking,
		isMonsterCardShaking,
		isHunterCardHit,
		isMonsterCardHit,
		showRoomStatus,
		showGameSettings,
		showInventory,
		isRewardSequenceActive,
		resetRewardSequence,
		openRewardChest,
		closeRewardSequence,
		toggleRoomStatus,
		toggleGameSettings,
		toggleInventory,
	};
}
