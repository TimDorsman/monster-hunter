<script setup lang="ts">
import { Icon } from "@iconify/vue";
import type {
	HunterAbilityChanceSettings,
	HunterGameSettings,
	MonsterGameSettings,
} from "~~/types/game-settings";
import BattleActionBar from "~~/components/feature/battle/BattleActionBar.vue";
import BattleArena from "~~/components/feature/battle/BattleArena.vue";
import BattleGameSettingsPanel from "~~/components/feature/battle/BattleGameSettingsPanel.vue";
import BattleInventoryPanel from "~~/components/feature/battle/BattleInventoryPanel.vue";
import BattleLogPanel from "~~/components/feature/battle/BattleLogPanel.vue";
import BattleRewardSequence from "~~/components/feature/battle/BattleRewardSequence.vue";
import BattleRoomStatusPanel from "~~/components/feature/battle/BattleRoomStatusPanel.vue";
import BattleTurnBanner from "~~/components/feature/battle/BattleTurnBanner.vue";
import { useBattleAudio } from "~/composables/battle/useBattleAudio";
import { useBattlePageUi } from "~/composables/battle/useBattlePageUi";

const {
	isLoading,
	currentMonster,
	resolvedReward,
	monsterHealth,
	playerHealth,
	playerMaxHealth,
	recentAttackLogs,
	playerGold,
	playerInventoryDetails,
	playerInventorySaleValue,
	levelUpAnnouncementCount,
	monsterHealthPercent,
	playerHealthPercent,
	monsterDefeated,
	playerDefeated,
	battleEnded,
	activeTurn,
	isAwaitingMonsterAttack,
	turnHunterId,
	connectionStatus,
	isSpectator,
	activeHunters,
	spectatorHunters,
	currentTurnHunterName,
	maxHunters,
	selfHunter,
	hunterCards,
	turnViewState,
	hunterAttackCount,
	hunterDamagedCount,
	monsterAttackCount,
	monsterDamagedCount,
	monsterBurned,
	settings,
	effectiveMonsterSettings,
	rewardClaimStatus,
	canClaimResolvedReward,
	hasClaimedCurrentReward,
	initializeBattle,
	updateGameSettings,
	resetGameSettings,
	pickRandomMonster,
	claimResolvedBattleReward,
	sellAllPlayerInventory,
	attackMonster,
	castAuraBeam,
	castBurn,
	healHunter,
} = useBattle();

const {
	unlockAudio: unlockBattleAudio,
	playChestOpenSound,
	playLevelUpSound,
} = useBattleAudio();

const currentRewardId = computed(() => resolvedReward.value?.rewardId ?? "");
const rewardDrops = computed(() => resolvedReward.value?.drops ?? []);
const rewardGold = computed(() => resolvedReward.value?.gold ?? 0);
const battleLogTitle = computed(() => {
	if (playerDefeated.value) {
		return "Defeat";
	}

	if (monsterDefeated.value) {
		return "Victory";
	}

	return "Battle Log";
});
const canHeal = computed(() => playerHealth.value < playerMaxHealth.value);
const isLowHealth = computed(
	() => playerHealthPercent.value < 20 && !battleEnded.value,
);
const isCriticalHealth = computed(
	() => playerHealthPercent.value < 10 && !battleEnded.value,
);
const hunterAbilitySuccessChances = computed<HunterAbilityChanceSettings>(
	() => settings.value.hunter.abilityChances,
);
const isActionDisabled = computed(() => {
	if (isLoading.value) {
		return true;
	}

	if (battleEnded.value) {
		return true;
	}

	if (activeTurn.value !== "player") {
		return true;
	}

	if (isSpectator.value) {
		return true;
	}

	return false;
});
const isPlayerTurn = computed(
	() => activeTurn.value === "player" && !isSpectator.value,
);

const {
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
	openRewardChest,
	closeRewardSequence,
	toggleRoomStatus,
	toggleGameSettings,
	toggleInventory,
} = useBattlePageUi({
	levelUpAnnouncementCount,
	hunterAttackCount,
	monsterAttackCount,
	hunterDamagedCount,
	monsterDamagedCount,
	currentRewardId,
	onLevelUp: () => {
		void playLevelUpSound();
	},
});

function runBattleInteraction(action: () => void) {
	void unlockBattleAudio();
	action();
}

function handleChestClick() {
	void unlockBattleAudio();
	void playChestOpenSound();
	openRewardChest();
}

function handleRewardAction() {
	if (canClaimResolvedReward.value) {
		const didClaimReward = claimResolvedBattleReward();
		if (!didClaimReward) {
			return;
		}

		closeRewardSequence();
		pickRandomMonster();
		return;
	}

	closeRewardSequence();
}

function handleAttackMonster() {
	runBattleInteraction(attackMonster);
}

function handleCastAuraBeam() {
	runBattleInteraction(castAuraBeam);
}

function handleHealHunter() {
	runBattleInteraction(healHunter);
}

function handleCastBurn() {
	runBattleInteraction(castBurn);
}

function handlePickRandomMonster() {
	runBattleInteraction(pickRandomMonster);
}

function updateHunterSetting(
	key: Exclude<keyof HunterGameSettings, "abilityChances">,
	value: number,
) {
	updateGameSettings({
		hunter: {
			...settings.value.hunter,
			abilityChances: {
				...settings.value.hunter.abilityChances,
			},
			[key]: value,
		},
		monster: {
			...settings.value.monster,
		},
	});
}

function updateHunterAbilitySetting(
	key: keyof HunterAbilityChanceSettings,
	value: number,
) {
	updateGameSettings({
		hunter: {
			...settings.value.hunter,
			abilityChances: {
				...settings.value.hunter.abilityChances,
				[key]: value,
			},
		},
		monster: {
			...settings.value.monster,
		},
	});
}

function updateMonsterSetting(
	key: keyof MonsterGameSettings,
	value: number | null,
) {
	updateGameSettings({
		hunter: {
			...settings.value.hunter,
			abilityChances: {
				...settings.value.hunter.abilityChances,
			},
		},
		monster: {
			...settings.value.monster,
			[key]: value,
		},
	});
}

function handleLootPopupVisibilityChange(isOpen: boolean) {
	showLootPopup.value = isOpen;
}

onMounted(() => {
	initializeBattle();
});
</script>

<template>
	<div
		class="section-text-outline fixed left-6 top-6 z-30 flex items-center gap-2 rounded-xl border border-amber-300/40 bg-black/55 px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-amber-100 backdrop-blur"
	>
		<Icon icon="mdi:cash-multiple" />
		<span>Gold {{ playerGold }}</span>
	</div>

	<BattleRewardSequence
		:show-chest="showChest"
		:show-loot-popup="showLootPopup"
		:current-monster-name="currentMonster?.name ?? 'Monster'"
		:reward-drops="rewardDrops"
		:reward-gold="rewardGold"
		:reward-claim-status="rewardClaimStatus"
		:can-claim-resolved-reward="canClaimResolvedReward"
		:has-claimed-current-reward="hasClaimedCurrentReward"
		@chest-click="handleChestClick"
		@reward-action="handleRewardAction"
		@update:show-loot-popup="handleLootPopupVisibilityChange"
	/>

	<div class="fixed right-6 top-6 z-30">
		<UButton
			color="neutral"
			variant="soft"
			:disabled="
				isLoading ||
				isAwaitingMonsterAttack ||
				isSpectator ||
				isRewardSequenceActive
			"
			@click="handlePickRandomMonster"
		>
			New Monster
		</UButton>
	</div>

	<div class="fixed left-1/2 top-6 z-30 -translate-x-1/2">
		<BattleTurnBanner
			:banner-label="turnViewState.bannerLabel"
			:hint-label="turnViewState.hintLabel"
			:is-player-turn="isPlayerTurn"
			:is-monster-turn="turnViewState.isMonsterTurn"
			:is-other-hunter-turn="turnViewState.isOtherHunterTurn"
		/>
	</div>

	<div
		class="fixed bottom-6 left-6 z-30 flex flex-col-reverse items-start gap-3"
	>
		<div class="flex items-center gap-2">
			<UButton
				color="neutral"
				variant="soft"
				size="sm"
				@click="toggleGameSettings"
			>
				{{ showGameSettings ? "Hide Settings" : "Game Settings" }}
			</UButton>
			<UButton
				color="neutral"
				variant="soft"
				size="sm"
				@click="toggleRoomStatus"
			>
				{{ showRoomStatus ? "Hide Room" : "Show Room" }}
			</UButton>
			<UButton
				color="neutral"
				variant="soft"
				size="sm"
				@click="toggleInventory"
			>
				{{ showInventory ? "Hide Inventory" : "Inventory" }}
			</UButton>
			<UButton color="warning" variant="soft" size="sm" to="/shop">
				Shop
			</UButton>
			<UButton color="neutral" variant="subtle" size="sm" to="/">
				Town Hub
			</UButton>
		</div>

		<Transition name="settings-panel">
			<BattleInventoryPanel
				v-if="showInventory"
				:inventory-rows="playerInventoryDetails"
				:player-inventory-sale-value="playerInventorySaleValue"
				@sell-all="sellAllPlayerInventory"
			/>
		</Transition>

		<Transition name="settings-panel">
			<BattleGameSettingsPanel
				v-if="showGameSettings"
				:settings="settings"
				:effective-monster-settings="effectiveMonsterSettings"
				@update-hunter-setting="
					updateHunterSetting($event.key, $event.value)
				"
				@update-hunter-ability-setting="
					updateHunterAbilitySetting($event.key, $event.value)
				"
				@update-monster-setting="
					updateMonsterSetting($event.key, $event.value)
				"
				@reset="resetGameSettings"
			/>
		</Transition>

		<Transition name="settings-panel">
			<BattleRoomStatusPanel
				v-if="showRoomStatus"
				:is-spectator="isSpectator"
				:connection-status="connectionStatus"
				:active-hunter-count="activeHunters.length"
				:max-hunters="maxHunters"
				:spectator-count="spectatorHunters.length"
				:current-turn-hunter-name="currentTurnHunterName"
			/>
		</Transition>
	</div>

	<BattleArena
		:is-loading="isLoading"
		:current-monster="currentMonster"
		:monster-health="monsterHealth"
		:monster-health-percent="monsterHealthPercent"
		:monster-burned="monsterBurned"
		:monster-defeated="monsterDefeated"
		:battle-ended="battleEnded"
		:player-defeated="playerDefeated"
		:hunter-cards="hunterCards"
		:self-hunter-id="selfHunter?.id ?? null"
		:turn-hunter-id="turnHunterId"
		:is-awaiting-monster-attack="isAwaitingMonsterAttack"
		:is-monster-turn="turnViewState.isMonsterTurn"
		:show-level-up-overlay="showLevelUpOverlay"
		:level-up-overlay-key="levelUpOverlayKey"
		:is-low-health="isLowHealth"
		:is-critical-health="isCriticalHealth"
		:is-hunter-card-shaking="isHunterCardShaking"
		:is-hunter-card-hit="isHunterCardHit"
		:is-monster-card-shaking="isMonsterCardShaking"
		:is-monster-card-hit="isMonsterCardHit"
	/>

	<BattleActionBar
		:hunter-ability-success-chances="hunterAbilitySuccessChances"
		:is-action-disabled="isActionDisabled"
		:can-heal="canHeal"
		:is-spectator="isSpectator"
		@attack="handleAttackMonster"
		@aura-beam="handleCastAuraBeam"
		@heal="handleHealHunter"
		@burn="handleCastBurn"
	/>

	<BattleLogPanel :title="battleLogTitle" :logs="recentAttackLogs" />
</template>

<style scoped>
.settings-panel-enter-active,
.settings-panel-leave-active {
	transition:
		opacity 0.24s ease,
		transform 0.24s ease;
}

.settings-panel-enter-from,
.settings-panel-leave-to {
	opacity: 0;
	transform: translateY(12px) scale(0.98);
}

.section-text-outline {
	text-shadow:
		-1px -1px 0 rgba(0, 0, 0, 0.88),
		1px -1px 0 rgba(0, 0, 0, 0.88),
		-1px 1px 0 rgba(0, 0, 0, 0.88),
		1px 1px 0 rgba(0, 0, 0, 0.88),
		0 2px 8px rgba(0, 0, 0, 0.5);
}
</style>
