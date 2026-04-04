<script setup lang="ts">
import type { BattleHunterState, Monster } from "~~/types/battle";
import { calculateRequiredExperience } from "~~/utils/battle/progression";

const props = defineProps<{
	isLoading: boolean;
	currentMonster: Monster | null;
	monsterHealth: number;
	monsterHealthPercent: number;
	monsterBurned: boolean;
	monsterDefeated: boolean;
	battleEnded: boolean;
	playerDefeated: boolean;
	hunterCards: Array<BattleHunterState | null>;
	selfHunterId: string | null;
	turnHunterId: string | null;
	isAwaitingMonsterAttack: boolean;
	isMonsterTurn: boolean;
	showLevelUpOverlay: boolean;
	levelUpOverlayKey: number;
	isLowHealth: boolean;
	isCriticalHealth: boolean;
	isHunterCardShaking: boolean;
	isHunterCardHit: boolean;
	isMonsterCardShaking: boolean;
	isMonsterCardHit: boolean;
}>();

const monsterImageSrc = computed(() => {
	if (!props.currentMonster) {
		return "/images/monsters/1.png";
	}

	return `/images/monsters/${props.currentMonster.id}.png`;
});
</script>

<template>
	<div
		v-if="isLowHealth"
		class="low-health-overlay"
		:class="{ 'low-health-overlay-critical': isCriticalHealth }"
	/>

	<div
		v-if="showLevelUpOverlay"
		:key="levelUpOverlayKey"
		class="level-up-overlay"
	>
		<p class="level-up-text text-center">LEVEL UP!</p>
	</div>

	<main class="min-h-screen px-8 pb-32 pt-10 text-white">
		<div
			v-if="isLoading"
			class="flex min-h-[60vh] items-center justify-center"
		>
			<p class="text-2xl font-semibold text-white/80">
				Loading battle...
			</p>
		</div>

		<div
			v-else-if="currentMonster"
			class="flex min-h-[60vh] items-start justify-between gap-12"
		>
			<section class="w-full max-w-2xl space-y-4">
				<p
					class="section-text-outline text-sm uppercase tracking-[0.18em] text-cyan-200"
				>
					Hunter
				</p>

				<div class="grid grid-cols-2 gap-4">
					<div
						v-for="(hunter, index) in hunterCards"
						:key="hunter ? hunter.id : `empty-${index}`"
						class="rounded-xl border border-cyan-300/30 bg-black/35 p-3"
						:class="{
							'hunter-turn-card':
								hunter &&
								!isAwaitingMonsterAttack &&
								turnHunterId === hunter.id &&
								!battleEnded,
							'combat-card combat-card-shake':
								hunter &&
								selfHunterId &&
								hunter.id === selfHunterId &&
								isHunterCardShaking,
							'combat-card combat-card-hit':
								hunter &&
								selfHunterId &&
								hunter.id === selfHunterId &&
								isHunterCardHit,
						}"
					>
						<template v-if="hunter">
							<p
								v-if="
									!isAwaitingMonsterAttack &&
									!battleEnded &&
									turnHunterId === hunter.id
								"
								class="turn-card-badge turn-card-badge-hunter section-text-outline"
							>
								Turn
							</p>
							<p class="section-text-outline text-sm font-bold">
								{{ hunter.name }}
							</p>
							<div
								class="relative mt-2 h-6 overflow-hidden rounded-full border border-red-300/70 bg-red-950/80"
							>
								<div
									class="absolute bottom-0 left-0 top-0 bg-red-500 transition-all duration-300"
									:style="{
										width: `${Math.max(
											0,
											Math.round(
												(hunter.health /
													hunter.maxHealth) *
													100,
											),
										)}%`,
									}"
								/>
								<span
									class="section-text-outline pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-xs font-semibold text-white"
								>
									{{ hunter.health }} / {{ hunter.maxHealth }}
								</span>
							</div>
							<div
								class="section-text-outline mt-2 text-xs text-cyan-100"
							>
								<p class="font-semibold">
									Level {{ hunter.level }}
								</p>
								<p>
									XP {{ hunter.experience }} /
									{{
										calculateRequiredExperience(
											hunter.level,
										)
									}}
								</p>
							</div>
							<img
								src="/images/hunter.png"
								:alt="`${hunter.name} portrait`"
								class="mt-2 h-32 w-full rounded-lg border border-cyan-300/30 bg-black/35 object-contain p-2"
							/>
						</template>
						<template v-else>
							<p
								class="section-text-outline text-sm font-semibold text-white/70"
							>
								Open Slot
							</p>
							<div
								class="mt-2 flex h-52 items-center justify-center rounded-lg border border-dashed border-white/20 text-xs text-white/50"
							>
								Waiting for hunter...
							</div>
						</template>
					</div>
				</div>
			</section>

			<section class="w-full max-w-sm space-y-4">
				<p
					class="section-text-outline text-sm uppercase tracking-[0.18em] text-rose-200"
				>
					Monster
				</p>

				<p class="section-text-outline text-xl font-bold">
					{{ currentMonster.name }}
				</p>

				<div
					class="relative h-8 overflow-hidden rounded-full border border-red-300/70 bg-red-950/80"
				>
					<div
						class="absolute bottom-0 left-0 top-0 bg-red-500 transition-all duration-300"
						:style="{ width: `${monsterHealthPercent}%` }"
					/>
					<span
						class="section-text-outline pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-sm font-semibold text-white"
					>
						{{ monsterHealth }} / {{ currentMonster.health }}
					</span>
				</div>

				<div class="section-text-outline text-sm text-rose-100">
					<p class="font-semibold">
						Level {{ currentMonster.level }}
					</p>
					<p>XP Reward {{ currentMonster.experienceReward }}</p>
				</div>

				<div
					class="combat-card monster-card-shell w-fit"
					:class="{
						'combat-card-shake': isMonsterCardShaking,
						'combat-card-hit': isMonsterCardHit,
						'monster-turn-card': isMonsterTurn,
					}"
				>
					<p
						v-if="isMonsterTurn && !battleEnded"
						class="turn-card-badge turn-card-badge-monster section-text-outline"
					>
						Monster Turn
					</p>
					<p
						v-if="monsterBurned && !monsterDefeated"
						class="status-badge status-badge-burn section-text-outline"
					>
						BURN
					</p>
					<NuxtImg
						:src="monsterImageSrc"
						:alt="`${currentMonster.name} portrait`"
						width="320"
						height="320"
						format="webp"
						class="h-72 w-72 rounded-xl border border-rose-300/30 bg-black/35 p-2 transition duration-200"
						:class="{ 'grayscale opacity-70': monsterDefeated }"
					/>
				</div>
			</section>
		</div>

		<div v-else class="flex min-h-[60vh] items-center justify-center">
			<p class="text-xl text-white/80">No monster selected.</p>
		</div>
	</main>
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

.low-health-overlay {
	position: fixed;
	inset: 0;
	z-index: 45;
	pointer-events: none;
	background:
		radial-gradient(
			circle at 50% 50%,
			rgba(255, 0, 0, 0) 58%,
			rgba(153, 27, 27, 0.18) 100%
		),
		radial-gradient(
			circle at 50% 50%,
			rgba(255, 255, 255, 0) 70%,
			rgba(220, 38, 38, 0.26) 100%
		);
	animation: low-health-pulse 1.1s ease-in-out infinite;
}

.low-health-overlay-critical {
	background:
		radial-gradient(
			circle at 50% 50%,
			rgba(255, 0, 0, 0) 54%,
			rgba(127, 29, 29, 0.26) 100%
		),
		radial-gradient(
			circle at 50% 50%,
			rgba(255, 255, 255, 0) 66%,
			rgba(220, 38, 38, 0.38) 100%
		);
	animation: low-health-pulse-critical 0.72s ease-in-out infinite;
}

.level-up-overlay {
	position: fixed;
	inset: 0;
	z-index: 80;
	overflow: hidden;
	background: rgba(0, 0, 0, 0.68);
	animation: level-up-backdrop 2.7s ease forwards;
}

.level-up-text {
	position: absolute;
	top: 50%;
	left: 50%;
	margin: 0;
	user-select: none;
	-webkit-user-select: none;
	font-size: clamp(6rem, 18vw, 24rem);
	font-weight: 900;
	line-height: 0.82;
	letter-spacing: 0.04em;
	color: #ffffff;
	text-shadow:
		0 0 18px rgba(255, 255, 255, 0.65),
		0 0 42px rgba(255, 255, 255, 0.35);
	transform: translate(calc(-50% - 120vw), -50%);
	animation: level-up-slide 2.7s cubic-bezier(0.2, 0.8, 0.24, 1) forwards;
}

.combat-card {
	position: relative;
	display: inline-block;
	border-radius: 0.75rem;
	overflow: hidden;
}

.combat-card::after {
	content: "";
	position: absolute;
	inset: 0;
	background: rgba(239, 68, 68, 0);
	pointer-events: none;
}

.combat-card-shake {
	animation: combat-card-shake 0.32s ease-in-out;
}

.combat-card-hit {
	animation: combat-card-hit 0.22s ease-out;
}

.combat-card-hit::after {
	animation: combat-hit-overlay 0.22s ease-out;
}

.hunter-turn-card {
	border-color: rgba(34, 211, 238, 0.72);
	box-shadow:
		0 0 0 1px rgba(34, 211, 238, 0.65),
		0 0 22px rgba(34, 211, 238, 0.35);
}

.turn-card-badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 0.35rem;
	padding: 0.1rem 0.5rem;
	border-radius: 9999px;
	font-size: 0.65rem;
	font-weight: 800;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	border: 1px solid transparent;
}

.turn-card-badge-hunter {
	background: rgba(34, 211, 238, 0.2);
	border-color: rgba(34, 211, 238, 0.55);
	color: rgba(165, 243, 252, 0.98);
}

.monster-card-shell {
	position: relative;
}

.monster-turn-card {
	box-shadow:
		0 0 0 1px rgba(251, 113, 133, 0.65),
		0 0 28px rgba(244, 63, 94, 0.38);
	animation: monster-turn-pulse 0.95s ease-in-out infinite alternate;
}

.turn-card-badge-monster {
	position: absolute;
	left: 0.75rem;
	top: 0.75rem;
	z-index: 2;
	background: rgba(244, 63, 94, 0.24);
	border-color: rgba(251, 113, 133, 0.6);
	color: rgba(254, 205, 211, 1);
}

.status-badge {
	position: absolute;
	right: 0.75rem;
	top: 0.75rem;
	z-index: 2;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0.1rem 0.55rem;
	border-radius: 9999px;
	border: 1px solid transparent;
	font-size: 0.68rem;
	font-weight: 900;
	letter-spacing: 0.12em;
	text-transform: uppercase;
}

.status-badge-burn {
	background: rgba(127, 29, 29, 0.88);
	border-color: rgba(248, 113, 113, 0.7);
	color: #fecaca;
	box-shadow: 0 0 18px rgba(239, 68, 68, 0.35);
}

@keyframes low-health-pulse {
	0% {
		opacity: 0.55;
	}
	50% {
		opacity: 0.92;
	}
	100% {
		opacity: 0.55;
	}
}

@keyframes low-health-pulse-critical {
	0% {
		opacity: 0.62;
	}
	50% {
		opacity: 1;
	}
	100% {
		opacity: 0.62;
	}
}

@keyframes level-up-slide {
	0% {
		opacity: 0;
		transform: translate(calc(-50% - 120vw), -50%);
	}
	22% {
		opacity: 1;
		transform: translate(-50%, -50%);
	}
	78% {
		opacity: 1;
		transform: translate(-50%, -50%);
	}
	100% {
		opacity: 0;
		transform: translate(calc(-50% + 120vw), -50%);
	}
}

@keyframes level-up-backdrop {
	0% {
		opacity: 0;
	}
	10% {
		opacity: 1;
	}
	88% {
		opacity: 1;
	}
	100% {
		opacity: 0;
	}
}

@keyframes combat-card-shake {
	0% {
		transform: translateX(0);
	}
	20% {
		transform: translateX(-5px);
	}
	40% {
		transform: translateX(5px);
	}
	60% {
		transform: translateX(-3px);
	}
	80% {
		transform: translateX(3px);
	}
	100% {
		transform: translateX(0);
	}
}

@keyframes combat-card-hit {
	0% {
		filter: saturate(1);
	}
	50% {
		filter: saturate(1.25);
	}
	100% {
		filter: saturate(1);
	}
}

@keyframes combat-hit-overlay {
	0% {
		background: rgba(239, 68, 68, 0);
	}
	45% {
		background: rgba(239, 68, 68, 0.36);
	}
	100% {
		background: rgba(239, 68, 68, 0);
	}
}

@keyframes monster-turn-pulse {
	from {
		transform: translateY(0);
	}
	to {
		transform: translateY(-2px);
	}
}
</style>
