<script setup lang="ts">
import { Icon } from "@iconify/vue";
import BaseModal from "~~/app/components/base/BaseModal.vue";
import type { ResolvedLootDrop } from "~~/types/loot";
import type { BattleRewardClaimStatus } from "~~/utils/battle/rewards";
import { getLootRarityClass } from "~~/utils/battle/presentation";
import {
	getBattleRewardActionLabel,
	getBattleRewardStatusMessage,
} from "~~/utils/battle/presentation";
import { lootRarityLabels } from "~~/utils/loot";

const props = defineProps<{
	showChest: boolean;
	showLootPopup: boolean;
	currentMonsterName: string;
	rewardDrops: ResolvedLootDrop[];
	rewardGold: number;
	rewardClaimStatus: BattleRewardClaimStatus;
	canClaimResolvedReward: boolean;
	hasClaimedCurrentReward: boolean;
}>();

const emit = defineEmits<{
	(event: "chest-click"): void;
	(event: "reward-action"): void;
	(event: "update:showLootPopup", value: boolean): void;
}>();

const rewardActionLabel = computed(() =>
	getBattleRewardActionLabel(props.canClaimResolvedReward),
);
const rewardStatusMessage = computed(() =>
	getBattleRewardStatusMessage(
		props.rewardClaimStatus,
		props.hasClaimedCurrentReward,
	),
);

const lootPopupOpen = computed({
	get: () => props.showLootPopup,
	set: (value: boolean) => emit("update:showLootPopup", value),
});
</script>

<template>
	<div v-if="showChest" class="loot-overlay">
		<div class="loot-stage">
			<button
				type="button"
				class="loot-chest-button"
				@click="$emit('chest-click')"
			>
				<img
					src="/images/chests/skull-chest.png"
					alt="Reward chest"
					class="loot-chest-image"
					width="240"
				/>
			</button>
			<p class="loot-chest-hint section-text-outline">
				Click the chest to open your loot
			</p>
		</div>
	</div>

	<BaseModal
		v-model="lootPopupOpen"
		title="Loot Acquired"
		:close-on-backdrop="false"
		:show-close-button="false"
	>
		<div class="loot-popup-content">
			<p class="loot-popup-subtitle section-text-outline">
				{{ currentMonsterName }} dropped:
			</p>
			<div class="loot-popup-gold">
				<div class="loot-popup-gold-icon">
					<Icon icon="mdi:cash-multiple" />
				</div>
				<div>
					<p class="loot-popup-gold-label">Gold Reward</p>
					<p class="loot-popup-gold-value">{{ rewardGold }}</p>
				</div>
			</div>
			<ul class="loot-popup-list">
				<li
					v-for="lootItem in rewardDrops"
					:key="lootItem.itemId"
					class="loot-popup-item"
				>
					<div class="loot-popup-item-copy">
						<span class="loot-popup-item-value">
							{{ lootItem.quantity }}x {{ lootItem.name }}
						</span>
						<span class="loot-popup-item-meta">
							{{ lootItem.category }}
						</span>
					</div>
					<span
						class="loot-popup-item-rarity"
						:class="getLootRarityClass(lootItem.rarity)"
					>
						{{ lootRarityLabels[lootItem.rarity] }}
					</span>
				</li>
			</ul>
			<p class="loot-popup-status section-text-outline">
				{{ rewardStatusMessage }}
			</p>
			<UButton
				class="loot-popup-button w-full"
				:color="canClaimResolvedReward ? 'warning' : 'neutral'"
				size="lg"
				@click="$emit('reward-action')"
			>
				{{ rewardActionLabel }}
			</UButton>
		</div>
	</BaseModal>
</template>

<style scoped>
.section-text-outline {
	text-shadow:
		-1px -1px 0 rgba(0, 0, 0, 0.88),
		1px -1px 0 rgba(0, 0, 0, 0.88),
		-1px 1px 0 rgba(0, 0, 0, 0.88),
		1px 1px 0 rgba(0, 0, 0, 0.88),
		0 2px 8px rgba(0, 0, 0, 0.5);
}

.loot-overlay {
	position: fixed;
	inset: 0;
	z-index: 75;
	display: flex;
	align-items: center;
	justify-content: center;
	background:
		radial-gradient(
			circle at 50% 45%,
			rgba(250, 204, 21, 0.16),
			transparent 30%
		),
		rgba(0, 0, 0, 0.42);
	backdrop-filter: blur(6px);
}

.loot-stage {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 23rem;
	padding: 1.5rem;
}

.loot-chest-button {
	position: relative;
	border: 0;
	background: transparent;
	padding: 0;
	cursor: pointer;
}

.loot-chest-image {
	display: block;
	width: 240px;
	max-width: 240px;
	height: auto;
	filter: drop-shadow(0 20px 35px rgba(0, 0, 0, 0.52));
	animation: loot-chest-bob 2.2s ease-in-out infinite;
}

.loot-chest-hint {
	margin-top: 1rem;
	font-size: 0.82rem;
	font-weight: 700;
	letter-spacing: 0.06em;
	color: rgba(254, 240, 138, 0.96);
	text-transform: uppercase;
}

.loot-popup-content {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.loot-popup-subtitle {
	font-size: 0.9rem;
	color: rgba(255, 247, 237, 0.82);
}

.loot-popup-gold {
	display: flex;
	align-items: center;
	gap: 0.9rem;
	padding: 1rem 1.1rem;
	border: 1px solid rgba(251, 191, 36, 0.28);
	border-radius: 1rem;
	background:
		radial-gradient(
			circle at top left,
			rgba(251, 191, 36, 0.18),
			transparent 42%
		),
		rgba(120, 53, 15, 0.18);
}

.loot-popup-gold-icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2.8rem;
	height: 2.8rem;
	border-radius: 9999px;
	background: rgba(251, 191, 36, 0.18);
	color: #fde68a;
	font-size: 1.3rem;
}

.loot-popup-gold-label {
	margin: 0;
	font-size: 0.72rem;
	font-weight: 800;
	letter-spacing: 0.1em;
	text-transform: uppercase;
	color: rgba(253, 230, 138, 0.88);
}

.loot-popup-gold-value {
	margin: 0.2rem 0 0;
	font-size: 1.2rem;
	font-weight: 800;
	color: #fff7ed;
}

.loot-popup-list {
	display: grid;
	gap: 0.75rem;
}

.loot-popup-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 0.9rem 1rem;
	border: 1px solid rgba(251, 191, 36, 0.22);
	border-radius: 0.9rem;
	background: rgba(255, 255, 255, 0.04);
}

.loot-popup-item-copy {
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
}

.loot-popup-item-value {
	font-size: 1rem;
	font-weight: 700;
	color: #fff7ed;
}

.loot-popup-item-meta {
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: rgba(226, 232, 240, 0.74);
}

.loot-popup-item-rarity {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 6.2rem;
	padding: 0.32rem 0.7rem;
	border-radius: 9999px;
	border: 1px solid rgba(255, 255, 255, 0.14);
	font-size: 0.72rem;
	font-weight: 800;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.loot-rarity-common {
	background: rgba(148, 163, 184, 0.18);
	color: rgba(226, 232, 240, 0.92);
}

.loot-rarity-uncommon {
	background: rgba(34, 197, 94, 0.16);
	color: rgba(187, 247, 208, 0.98);
}

.loot-rarity-rare {
	background: rgba(59, 130, 246, 0.16);
	color: rgba(191, 219, 254, 0.98);
}

.loot-rarity-epic {
	background: rgba(168, 85, 247, 0.16);
	color: rgba(233, 213, 255, 0.98);
}

.loot-rarity-legendary {
	background: rgba(245, 158, 11, 0.18);
	color: rgba(253, 230, 138, 0.98);
}

.loot-rarity-mythic {
	background: rgba(244, 63, 94, 0.18);
	color: rgba(254, 205, 211, 0.98);
}

.loot-popup-status {
	font-size: 0.82rem;
	color: rgba(255, 247, 237, 0.82);
}

.loot-popup-button {
	margin-top: 0.35rem;
}

@keyframes loot-chest-bob {
	0%,
	100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-10px);
	}
}
</style>
