<script setup lang="ts">
import type { HunterAbilityChanceSettings } from "~~/types/game-settings";
import { Icon } from "@iconify/vue";

defineProps<{
	hunterAbilitySuccessChances: HunterAbilityChanceSettings;
	isActionDisabled: boolean;
	canHeal: boolean;
	isSpectator: boolean;
}>();

defineEmits<{
	(event: "attack"): void;
	(event: "aura-beam"): void;
	(event: "heal"): void;
	(event: "burn"): void;
}>();
</script>

<template>
	<section
		class="ability-grid fixed bottom-6 left-1/2 z-30 grid w-[min(26rem,calc(100vw-3rem))] -translate-x-1/2 grid-cols-3 gap-3"
	>
		<UButton
			class="ability-button ability-button-attack"
			color="error"
			size="xl"
			:disabled="isActionDisabled"
			@click="$emit('attack')"
		>
			<span class="ability-label">
				<Icon class="ability-icon" icon="mdi:sword-cross" />
				Attack
			</span>
			<span class="ability-chance">
				{{ hunterAbilitySuccessChances.attackChance }}%
			</span>
		</UButton>

		<UButton
			class="ability-button ability-button-aura"
			color="primary"
			size="xl"
			:disabled="isActionDisabled"
			@click="$emit('aura-beam')"
		>
			<span class="ability-label">
				<Icon
					class="ability-icon ability-icon-spin"
					icon="mdi:star-four-points-circle"
				/>
				Aura Beam
			</span>
			<span class="ability-chance">
				{{ hunterAbilitySuccessChances.auraBeamChance }}%
			</span>
		</UButton>

		<UButton
			class="ability-button ability-button-heal"
			color="success"
			size="xl"
			:disabled="isActionDisabled || !canHeal"
			@click="$emit('heal')"
		>
			<span class="ability-label">
				<Icon class="ability-icon" icon="mdi:heart-plus" />
				Heal
			</span>
			<span class="ability-chance">
				{{ hunterAbilitySuccessChances.healChance }}%
			</span>
		</UButton>

		<UButton
			class="ability-button ability-button-burn"
			color="error"
			size="xl"
			:disabled="isActionDisabled"
			@click="$emit('burn')"
		>
			<span class="ability-label">
				<Icon class="ability-icon" icon="mdi:fire" />
				Burn
			</span>
			<span class="ability-chance">
				{{ hunterAbilitySuccessChances.burnChance }}%
			</span>
		</UButton>

		<UButton
			class="ability-button ability-button-empty"
			size="xl"
			color="neutral"
			variant="soft"
			:disabled="true"
		>
			<span class="ability-label">
				<Icon class="ability-icon" icon="mdi:lock-outline" />
				Empty
			</span>
		</UButton>

		<UButton
			class="ability-button ability-button-empty"
			size="xl"
			color="neutral"
			variant="soft"
			:disabled="true"
		>
			<span class="ability-label">
				<Icon class="ability-icon" icon="mdi:hexagon-outline" />
				Empty
			</span>
		</UButton>
	</section>

	<p
		v-if="isSpectator"
		class="section-text-outline fixed bottom-[8.5rem] left-1/2 z-30 -translate-x-1/2 rounded-md border border-amber-300/40 bg-black/55 px-3 py-1 text-xs text-amber-200"
	>
		You are spectating. Wait for a free hunter slot.
	</p>
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

.ability-grid::before {
	content: "";
	position: absolute;
	inset: -0.6rem -0.8rem;
	z-index: -1;
	border-radius: 1.25rem;
	background:
		radial-gradient(
			circle at 10% 20%,
			rgba(56, 189, 248, 0.25),
			transparent 36%
		),
		radial-gradient(
			circle at 90% 80%,
			rgba(244, 63, 94, 0.2),
			transparent 34%
		),
		rgba(8, 12, 20, 0.65);
	backdrop-filter: blur(6px);
	border: 1px solid rgba(255, 255, 255, 0.14);
}

:deep(.ability-button) {
	position: relative;
	isolation: isolate;
	overflow: hidden;
	border: 1px solid rgba(255, 255, 255, 0.28);
	box-shadow:
		0 0 0 rgba(255, 255, 255, 0),
		0 10px 18px rgba(2, 6, 23, 0.45);
	transition:
		transform 0.2s ease,
		box-shadow 0.2s ease,
		border-color 0.2s ease,
		filter 0.2s ease;
}

:deep(.ability-button:not(:disabled):hover) {
	transform: translateY(-3px) scale(1.02);
	box-shadow:
		0 0 24px rgba(255, 255, 255, 0.2),
		0 14px 26px rgba(2, 6, 23, 0.6);
}

:deep(.ability-button:not(:disabled):active) {
	transform: translateY(0) scale(0.98);
}

:deep(.ability-button::before) {
	content: "";
	position: absolute;
	inset: -60% -30%;
	z-index: -1;
	background: linear-gradient(
		115deg,
		transparent 25%,
		rgba(255, 255, 255, 0.3) 50%,
		transparent 75%
	);
	transform: translateX(-140%) rotate(10deg);
	animation: ability-sweep 2.6s linear infinite;
}

:deep(.ability-button-attack) {
	background: linear-gradient(
		140deg,
		rgba(220, 38, 38, 0.9),
		rgba(127, 29, 29, 0.92)
	);
	animation: ability-pulse-red 1.5s ease-in-out infinite;
}

:deep(.ability-button-aura) {
	background: linear-gradient(
		140deg,
		rgba(37, 99, 235, 0.9),
		rgba(76, 29, 149, 0.92)
	);
	animation: ability-pulse-blue 1.6s ease-in-out infinite;
}

:deep(.ability-button-heal) {
	background: linear-gradient(
		140deg,
		rgba(22, 163, 74, 0.9),
		rgba(21, 128, 61, 0.92)
	);
	animation: ability-pulse-green 1.55s ease-in-out infinite;
}

:deep(.ability-button-burn) {
	background: linear-gradient(
		140deg,
		rgba(239, 68, 68, 0.92),
		rgba(194, 65, 12, 0.94)
	);
	animation: ability-pulse-burn 1.5s ease-in-out infinite;
}

:deep(.ability-button-empty) {
	border-style: dashed;
	border-color: rgba(255, 255, 255, 0.2);
	background: linear-gradient(
		140deg,
		rgba(30, 41, 59, 0.85),
		rgba(15, 23, 42, 0.9)
	);
	color: rgba(255, 255, 255, 0.45);
	filter: saturate(0.75);
}

:deep(.ability-button-empty::before) {
	opacity: 0.35;
	animation-duration: 4.5s;
}

.ability-label {
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
}

.ability-chance {
	display: block;
	margin-top: 0.2rem;
	font-size: 0.72rem;
	font-weight: 800;
	letter-spacing: 0.08em;
	opacity: 0.8;
}

.ability-icon {
	font-size: 1.1rem;
	filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.45));
}

.ability-icon-spin {
	animation: ability-icon-spin 3.4s linear infinite;
}

@keyframes ability-sweep {
	0% {
		transform: translateX(-145%) rotate(10deg);
	}
	100% {
		transform: translateX(145%) rotate(10deg);
	}
}

@keyframes ability-pulse-red {
	0%,
	100% {
		box-shadow:
			0 0 14px rgba(248, 113, 113, 0.24),
			0 12px 20px rgba(2, 6, 23, 0.45);
	}
	50% {
		box-shadow:
			0 0 26px rgba(248, 113, 113, 0.45),
			0 16px 28px rgba(2, 6, 23, 0.6);
	}
}

@keyframes ability-pulse-blue {
	0%,
	100% {
		box-shadow:
			0 0 14px rgba(96, 165, 250, 0.24),
			0 12px 20px rgba(2, 6, 23, 0.45);
	}
	50% {
		box-shadow:
			0 0 28px rgba(96, 165, 250, 0.45),
			0 16px 28px rgba(2, 6, 23, 0.6);
	}
}

@keyframes ability-pulse-green {
	0%,
	100% {
		box-shadow:
			0 0 14px rgba(74, 222, 128, 0.24),
			0 12px 20px rgba(2, 6, 23, 0.45);
	}
	50% {
		box-shadow:
			0 0 28px rgba(74, 222, 128, 0.45),
			0 16px 28px rgba(2, 6, 23, 0.6);
	}
}

@keyframes ability-pulse-burn {
	0%,
	100% {
		box-shadow:
			0 0 14px rgba(248, 113, 113, 0.28),
			0 12px 20px rgba(120, 53, 15, 0.38);
	}
	50% {
		box-shadow:
			0 0 30px rgba(251, 146, 60, 0.48),
			0 16px 28px rgba(120, 53, 15, 0.54);
	}
}

@keyframes ability-icon-spin {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}
</style>
