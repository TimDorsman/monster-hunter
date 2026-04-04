<script setup lang="ts">
import { getBattleTurnBannerClassState } from "~~/utils/battle/presentation";

const props = defineProps<{
	bannerLabel: string;
	hintLabel: string;
	isPlayerTurn: boolean;
	isMonsterTurn: boolean;
	isOtherHunterTurn: boolean;
}>();

const bannerClassState = computed(() =>
	getBattleTurnBannerClassState(
		{
			bannerLabel: props.bannerLabel,
			hintLabel: props.hintLabel,
			isMonsterTurn: props.isMonsterTurn,
			isOtherHunterTurn: props.isOtherHunterTurn,
		},
		props.isPlayerTurn,
	),
);
</script>

<template>
	<div class="turn-banner section-text-outline rounded-xl border px-4 py-2 text-sm font-bold tracking-[0.08em]" :class="bannerClassState">
		<p class="text-center">{{ bannerLabel }}</p>
		<p class="turn-banner-hint mt-1 text-center text-[0.65rem] font-semibold tracking-[0.06em]">
			{{ hintLabel }}
		</p>
	</div>
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

.turn-banner {
	background: rgba(15, 23, 42, 0.78);
	border-color: rgba(148, 163, 184, 0.45);
	color: rgba(241, 245, 249, 0.96);
	min-width: 20rem;
	box-shadow: 0 8px 24px rgba(2, 6, 23, 0.35);
}

.turn-banner-hint {
	color: rgba(226, 232, 240, 0.92);
}

.turn-banner-player {
	background: rgba(6, 78, 59, 0.8);
	border-color: rgba(16, 185, 129, 0.55);
	color: rgba(167, 243, 208, 1);
	box-shadow: 0 0 22px rgba(16, 185, 129, 0.35);
	animation: turn-banner-player-pulse 0.95s ease-in-out infinite alternate;
}

.turn-banner-monster {
	background: rgba(76, 5, 25, 0.8);
	border-color: rgba(244, 63, 94, 0.55);
	color: rgba(254, 205, 211, 1);
	box-shadow: 0 0 22px rgba(244, 63, 94, 0.35);
	animation: turn-banner-monster-pulse 0.95s ease-in-out infinite alternate;
}

.turn-banner-other {
	background: rgba(30, 58, 138, 0.8);
	border-color: rgba(96, 165, 250, 0.55);
	color: rgba(191, 219, 254, 1);
	box-shadow: 0 0 22px rgba(96, 165, 250, 0.3);
}

@keyframes turn-banner-player-pulse {
	from {
		transform: translateY(0);
	}
	to {
		transform: translateY(-2px);
	}
}

@keyframes turn-banner-monster-pulse {
	from {
		transform: translateY(0);
	}
	to {
		transform: translateY(-2px);
	}
}
</style>
