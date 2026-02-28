<script setup lang="ts">
import { Icon } from "@iconify/vue";

const {
	PLAYER_MAX_HEALTH,
	isLoading,
	currentMonster,
	monsterHealth,
	playerHealth,
	recentAttackLogs,
	playerLevel,
	playerExperience,
	levelUpAnnouncementCount,
	experienceRequiredForNextLevel,
	monsterHealthPercent,
	playerHealthPercent,
	monsterDefeated,
	playerDefeated,
	battleEnded,
	activeTurn,
	isAwaitingMonsterAttack,
	hunterAttackCount,
	hunterDamagedCount,
	monsterAttackCount,
	monsterDamagedCount,
	initializeBattle,
	pickRandomMonster,
	attackMonster,
	castAuraBeam,
	healHunter,
} = useBattle();

const showLevelUpOverlay = ref(false);
const levelUpOverlayKey = ref(0);
let levelUpOverlayTimer: ReturnType<typeof setTimeout> | null = null;
const isHunterCardShaking = ref(false);
const isMonsterCardShaking = ref(false);
const isHunterCardHit = ref(false);
const isMonsterCardHit = ref(false);
let hunterShakeTimer: ReturnType<typeof setTimeout> | null = null;
let monsterShakeTimer: ReturnType<typeof setTimeout> | null = null;
let hunterHitTimer: ReturnType<typeof setTimeout> | null = null;
let monsterHitTimer: ReturnType<typeof setTimeout> | null = null;

const monsterImageSrc = computed(() => {
	if (!currentMonster.value) {
		return "/images/monsters/1.png";
	}

	return `/images/monsters/${currentMonster.value.id}.png`;
});

const battleLogTitle = computed(() => {
	if (playerDefeated.value) {
		return "Defeat";
	}

	if (monsterDefeated.value) {
		return "Victory";
	}

	return "Battle Log";
});

const canHeal = computed(() => playerHealth.value < PLAYER_MAX_HEALTH);

function getLogSourceLabel(source: "hunter" | "monster" | "system") {
	if (source === "hunter") {
		return "Hunter";
	}

	if (source === "monster") {
		return "Monster";
	}

	return "System";
}

function getLogItemClass(source: "hunter" | "monster" | "system") {
	if (source === "hunter") {
		return "battle-log-item-hunter";
	}

	if (source === "monster") {
		return "battle-log-item-monster";
	}

	return "battle-log-item-system";
}

watch(levelUpAnnouncementCount, () => {
	levelUpOverlayKey.value += 1;
	showLevelUpOverlay.value = true;
	if (levelUpOverlayTimer) {
		clearTimeout(levelUpOverlayTimer);
	}
	levelUpOverlayTimer = setTimeout(() => {
		showLevelUpOverlay.value = false;
		levelUpOverlayTimer = null;
	}, 2700);
});

watch(hunterAttackCount, () => {
	isHunterCardShaking.value = true;
	if (hunterShakeTimer) {
		clearTimeout(hunterShakeTimer);
	}
	hunterShakeTimer = setTimeout(() => {
		isHunterCardShaking.value = false;
		hunterShakeTimer = null;
	}, 320);
});

watch(monsterAttackCount, () => {
	isMonsterCardShaking.value = true;
	if (monsterShakeTimer) {
		clearTimeout(monsterShakeTimer);
	}
	monsterShakeTimer = setTimeout(() => {
		isMonsterCardShaking.value = false;
		monsterShakeTimer = null;
	}, 320);
});

watch(hunterDamagedCount, () => {
	isHunterCardHit.value = true;
	if (hunterHitTimer) {
		clearTimeout(hunterHitTimer);
	}
	hunterHitTimer = setTimeout(() => {
		isHunterCardHit.value = false;
		hunterHitTimer = null;
	}, 220);
});

watch(monsterDamagedCount, () => {
	isMonsterCardHit.value = true;
	if (monsterHitTimer) {
		clearTimeout(monsterHitTimer);
	}
	monsterHitTimer = setTimeout(() => {
		isMonsterCardHit.value = false;
		monsterHitTimer = null;
	}, 220);
});

onMounted(() => {
	initializeBattle();
});

onBeforeUnmount(() => {
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
</script>

<template>
	<div
		v-if="showLevelUpOverlay"
		:key="levelUpOverlayKey"
		class="level-up-overlay"
	>
		<p class="level-up-text text-center">LEVEL UP!</p>
	</div>

	<div class="fixed right-6 top-6 z-30">
		<UButton
			color="neutral"
			variant="soft"
			:disabled="isLoading || isAwaitingMonsterAttack"
			@click="pickRandomMonster"
		>
			New Monster
		</UButton>
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
			<section class="w-full max-w-sm space-y-4">
				<p
					class="section-text-outline text-sm uppercase tracking-[0.18em] text-cyan-200"
				>
					Hunter
				</p>
				<p class="section-text-outline text-xl font-bold">
					Swifty Mercury
				</p>

				<div
					class="relative h-8 overflow-hidden rounded-full border border-cyan-300/40 bg-black/40"
				>
					<div
						class="h-full bg-cyan-500/70 transition-all duration-300"
						:style="{ width: `${playerHealthPercent}%` }"
					/>
					<span
						class="section-text-outline absolute inset-0 flex items-center justify-center text-sm font-semibold"
					>
						{{ playerHealth }} / {{ PLAYER_MAX_HEALTH }}
					</span>
				</div>

				<div class="section-text-outline text-sm text-cyan-100">
					<p class="font-semibold">Level {{ playerLevel }}</p>
					<p>
						XP {{ playerExperience }} /
						{{ experienceRequiredForNextLevel }}
					</p>
				</div>

				<div
					class="combat-card"
					:class="{
						'combat-card-shake': isHunterCardShaking,
						'combat-card-hit': isHunterCardHit,
					}"
				>
					<img
						src="/images/hunter.png"
						alt="Hunter portrait"
						class="h-72 w-72 rounded-xl border border-cyan-300/30 bg-black/35 object-contain p-2"
					/>
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
					class="relative h-8 overflow-hidden rounded-full border border-rose-300/40 bg-black/40"
				>
					<div
						class="h-full bg-rose-500/70 transition-all duration-300"
						:style="{ width: `${monsterHealthPercent}%` }"
					/>
					<span
						class="section-text-outline absolute inset-0 flex items-center justify-center text-sm font-semibold"
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
					class="combat-card w-fit"
					:class="{
						'combat-card-shake': isMonsterCardShaking,
						'combat-card-hit': isMonsterCardHit,
					}"
				>
					<NuxtImg
						:src="monsterImageSrc"
						:alt="`${currentMonster.name} portrait`"
						width="320"
						height="320"
						format="webp"
						class="h-72 w-72 rounded-xl border border-rose-300/30 bg-black/35 transition duration-200 p-2"
						:class="{ 'grayscale opacity-70': monsterDefeated }"
					/>
				</div>
			</section>
		</div>

		<div v-else class="flex min-h-[60vh] items-center justify-center">
			<p class="text-xl text-white/80">No monster selected.</p>
		</div>

		<section
			class="ability-grid fixed bottom-6 left-1/2 z-30 grid w-104 -translate-x-1/2 grid-cols-3 gap-3"
		>
			<UButton
				class="ability-button ability-button-attack"
				color="error"
				size="xl"
				:disabled="isLoading || battleEnded || activeTurn !== 'player'"
				@click="attackMonster"
			>
				<span class="ability-label">
					<Icon class="ability-icon" icon="mdi:sword-cross" />
					Attack
				</span>
			</UButton>

			<UButton
				class="ability-button ability-button-aura"
				color="primary"
				size="xl"
				:disabled="isLoading || battleEnded || activeTurn !== 'player'"
				@click="castAuraBeam"
			>
				<span class="ability-label">
					<Icon class="ability-icon ability-icon-spin" icon="mdi:star-four-points-circle" />
					Aura Beam
				</span>
			</UButton>

			<UButton
				class="ability-button ability-button-heal"
				color="success"
				size="xl"
				:disabled="
					isLoading ||
					battleEnded ||
					activeTurn !== 'player' ||
					!canHeal
				"
				@click="healHunter"
			>
				<span class="ability-label">
					<Icon class="ability-icon" icon="mdi:heart-plus" />
					Heal
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
			<UButton
				class="ability-button ability-button-empty"
				size="xl"
				color="neutral"
				variant="soft"
				:disabled="true"
			>
				<span class="ability-label">
					<Icon class="ability-icon" icon="mdi:flask-empty-outline" />
					Empty
				</span>
			</UButton>
		</section>

		<aside
			class="fixed bottom-6 right-6 z-30 w-[28rem] rounded-xl border border-white/20 bg-black/55 p-4 backdrop-blur"
		>
			<p
				class="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-white/85"
			>
				{{ battleLogTitle }}
			</p>
			<ul class="max-h-56 space-y-1 overflow-y-auto pr-2 text-sm">
				<li
					v-for="log in recentAttackLogs"
					:key="log.id"
					class="battle-log-item"
					:class="getLogItemClass(log.source)"
				>
					<span class="battle-log-source">{{
						getLogSourceLabel(log.source)
					}}</span>
					<span class="battle-log-message">{{ log.message }}</span>
				</li>
			</ul>
		</aside>

		<div class="fixed bottom-6 left-6 z-30">
			<UButton color="neutral" variant="subtle" to="/">
				Back Home
			</UButton>
		</div>
	</main>
</template>

<style scoped>
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

.battle-log-item {
	display: grid;
	grid-template-columns: 4.8rem 1fr;
	align-items: start;
	gap: 0.5rem;
	border-radius: 0.5rem;
	border: 1px solid rgba(255, 255, 255, 0.08);
	background: rgba(255, 255, 255, 0.04);
	padding: 0.4rem 0.5rem;
}

.battle-log-source {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 9999px;
	padding: 0.05rem 0.45rem;
	font-size: 0.7rem;
	font-weight: 700;
	letter-spacing: 0.02em;
	text-transform: uppercase;
}

.battle-log-message {
	color: rgba(255, 255, 255, 0.94);
}

.battle-log-item-hunter {
	border-color: rgba(34, 211, 238, 0.38);
	background: rgba(8, 47, 73, 0.35);
}

.battle-log-item-hunter .battle-log-source {
	background: rgba(34, 211, 238, 0.25);
	color: rgba(165, 243, 252, 0.98);
}

.battle-log-item-monster {
	border-color: rgba(251, 113, 133, 0.42);
	background: rgba(76, 5, 25, 0.3);
}

.battle-log-item-monster .battle-log-source {
	background: rgba(251, 113, 133, 0.24);
	color: rgba(254, 205, 211, 0.98);
}

.battle-log-item-system {
	border-color: rgba(148, 163, 184, 0.35);
	background: rgba(30, 41, 59, 0.34);
}

.battle-log-item-system .battle-log-source {
	background: rgba(148, 163, 184, 0.22);
	color: rgba(226, 232, 240, 0.95);
}

.ability-label {
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
}

.ability-icon {
	font-size: 1.1rem;
	filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.45));
}

.ability-icon-spin {
	animation: ability-icon-spin 3.4s linear infinite;
}

@keyframes ability-icon-spin {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
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
