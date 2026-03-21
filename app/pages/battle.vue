<script setup lang="ts">
import { Icon } from "@iconify/vue";
import BattleGameSettingsPanel from "../../components/BattleGameSettingsPanel.vue";
import type { HunterAbilityChanceSettings, HunterGameSettings, MonsterGameSettings } from "~/types/game-settings";
import { useBattleSettingsStorage } from "../composables/battle/useBattleSettingsStorage";

const {
	isLoading,
	currentMonster,
	monsterHealth,
	playerHealth,
	playerMaxHealth,
	recentAttackLogs,
	playerLevel,
	playerExperience,
	playerGold,
	levelUpAnnouncementCount,
	experienceRequiredForNextLevel,
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
	hunterAttackCount,
	hunterDamagedCount,
	monsterAttackCount,
	monsterDamagedCount,
	monsterBurned,
	settings,
	effectiveMonsterSettings,
	initializeBattle,
	updateGameSettings,
	resetGameSettings,
	pickRandomMonster,
	addPlayerGold,
	attackMonster,
	castAuraBeam,
	castBurn,
	healHunter,
} = useBattle();
const { loadPanelOpenState, persistPanelOpenState } = useBattleSettingsStorage();

const showLevelUpOverlay = ref(false);
const levelUpOverlayKey = ref(0);
let levelUpOverlayTimer: ReturnType<typeof setTimeout> | null = null;
const showChest = ref(false);
const showLootPopup = ref(false);
const hasInitializedRewardState = ref(false);
const isHunterCardShaking = ref(false);
const isMonsterCardShaking = ref(false);
const isHunterCardHit = ref(false);
const isMonsterCardHit = ref(false);
let hunterShakeTimer: ReturnType<typeof setTimeout> | null = null;
let monsterShakeTimer: ReturnType<typeof setTimeout> | null = null;
let hunterHitTimer: ReturnType<typeof setTimeout> | null = null;
let monsterHitTimer: ReturnType<typeof setTimeout> | null = null;
const goldRewardAmount = 320;
const lootItems = [
	{ label: "Gold", value: `${goldRewardAmount}` },
	{ label: "Hunter Potion", value: "2x Mega Potion" },
	{ label: "Rare Material", value: "1x Wyvern Fang" },
];

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

const canHeal = computed(() => playerHealth.value < playerMaxHealth.value);
const isLowHealth = computed(() => playerHealthPercent.value < 20 && !battleEnded.value);
const isCriticalHealth = computed(
	() => playerHealthPercent.value < 10 && !battleEnded.value,
);
const showRoomStatus = ref(false);
const showGameSettings = ref(loadPanelOpenState());
const hunterAbilitySuccessChances = computed(
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
const isMonsterTurn = computed(() => {
	if (battleEnded.value) {
		return false;
	}
	if (isAwaitingMonsterAttack.value) {
		return true;
	}
	if (activeTurn.value !== "monster") {
		return false;
	}
	return !currentTurnHunterName.value;
});
const isOtherHunterTurn = computed(() => {
	if (battleEnded.value) {
		return false;
	}
	if (isAwaitingMonsterAttack.value) {
		return false;
	}
	if (activeTurn.value !== "monster") {
		return false;
	}
	return Boolean(currentTurnHunterName.value);
});
const turnBannerLabel = computed(() => {
	if (battleEnded.value) {
		return "BATTLE ENDED";
	}
	if (isAwaitingMonsterAttack.value) {
		return "MONSTER TURN";
	}
	if (isSpectator.value && currentTurnHunterName.value) {
		return `${currentTurnHunterName.value.toUpperCase()}'S TURN`;
	}
	if (activeTurn.value === "player") {
		return "YOUR TURN";
	}
	if (currentTurnHunterName.value) {
		return `${currentTurnHunterName.value.toUpperCase()}'S TURN`;
	}
	return "WAITING...";
});
const turnHintLabel = computed(() => {
	if (battleEnded.value) {
		return "Select a new monster to start another round.";
	}
	if (isAwaitingMonsterAttack.value) {
		return `${currentMonster.value?.name ?? "Monster"} is preparing an attack.`;
	}
	if (activeTurn.value === "player" && !isSpectator.value) {
		return "Choose an ability to take your action.";
	}
	if (isSpectator.value && currentTurnHunterName.value) {
		return `${currentTurnHunterName.value} can act now.`;
	}
	if (currentTurnHunterName.value) {
		return `Waiting for ${currentTurnHunterName.value} to act.`;
	}
	return "Waiting for battle state...";
});
const currentEncounterKey = computed(() => {
	if (!currentMonster.value) {
		return "";
	}

	return `${currentMonster.value.id}-${currentMonster.value.level}-${currentMonster.value.health}`;
});
const isRewardSequenceActive = computed(
	() => showChest.value || showLootPopup.value,
);

function resetRewardSequence() {
	showChest.value = false;
	showLootPopup.value = false;
}

function handleChestClick() {
	showChest.value = false;
	showLootPopup.value = true;
}

function handleLootClaim() {
	addPlayerGold(goldRewardAmount);
	showLootPopup.value = false;
	showChest.value = false;
	pickRandomMonster();
}

function getRequiredExperienceForLevel(level: number) {
	return Math.round(60 + level * 40 + level * level * 12);
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

const hunterCards = computed(() => {
	const cards = [...activeHunters.value];
	while (cards.length < 4) {
		cards.push(null as unknown as (typeof activeHunters.value)[number]);
	}
	return cards.slice(0, 4);
});

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

watch(currentEncounterKey, () => {
	resetRewardSequence();
});

watch(showGameSettings, (isOpen) => {
	persistPanelOpenState(isOpen);
});

watch(
	() => Boolean(currentMonster.value) && battleEnded.value && monsterDefeated.value,
	(isMonsterKilled, wasMonsterKilled) => {
		if (!hasInitializedRewardState.value) {
			hasInitializedRewardState.value = true;
			if (!isMonsterKilled) {
				resetRewardSequence();
			}
			return;
		}

		if (!isMonsterKilled) {
			resetRewardSequence();
			return;
		}
		if (wasMonsterKilled) {
			return;
		}

		showChest.value = true;
		showLootPopup.value = false;
	},
);

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

	<div
		class="section-text-outline fixed left-6 top-6 z-30 flex items-center gap-2 rounded-xl border border-amber-300/40 bg-black/55 px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-amber-100 backdrop-blur"
	>
		<Icon icon="mdi:cash-multiple" />
		<span>Gold {{ playerGold }}</span>
	</div>

	<div v-if="showChest" class="loot-overlay">
		<div class="loot-stage">
			<button
				type="button"
				class="loot-chest-button"
				@click="handleChestClick"
			>
				<img
					src="/images/chests/skull-chest.png"
					alt="Reward chest"
					class="loot-chest-image"
					width="240"
				>
			</button>
			<p class="loot-chest-hint section-text-outline">
				Click the chest to open your loot
			</p>
		</div>
	</div>

	<BaseModal
		v-model="showLootPopup"
		title="Loot Acquired"
		:close-on-backdrop="false"
		:show-close-button="false"
	>
		<div class="loot-popup-content">
			<p class="loot-popup-subtitle section-text-outline">
				{{ currentMonster?.name ?? "Monster" }} dropped:
			</p>
			<ul class="loot-popup-list">
				<li
					v-for="lootItem in lootItems"
					:key="lootItem.label"
					class="loot-popup-item"
				>
					<span class="loot-popup-item-label">{{ lootItem.label }}</span>
					<span class="loot-popup-item-value">{{ lootItem.value }}</span>
				</li>
			</ul>
			<UButton
				class="loot-popup-button w-full"
				color="warning"
				size="lg"
				@click="handleLootClaim"
			>
				Claim Loot
			</UButton>
		</div>
	</BaseModal>

	<div class="fixed right-6 top-6 z-30">
		<UButton
			color="neutral"
			variant="soft"
			:disabled="isLoading || isAwaitingMonsterAttack || isSpectator || isRewardSequenceActive"
			@click="pickRandomMonster"
		>
			New Monster
		</UButton>
	</div>

	<div class="fixed top-6 left-1/2 z-30 -translate-x-1/2">
		<div
			class="turn-banner section-text-outline rounded-xl border px-4 py-2 text-sm font-bold tracking-[0.08em]"
			:class="{
				'turn-banner-player': activeTurn === 'player' && !isSpectator,
				'turn-banner-monster': isMonsterTurn,
				'turn-banner-other': isOtherHunterTurn,
			}"
		>
			<p class="text-center">{{ turnBannerLabel }}</p>
			<p class="turn-banner-hint mt-1 text-center text-[0.65rem] font-semibold tracking-[0.06em]">
				{{ turnHintLabel }}
			</p>
		</div>
	</div>

	<div class="fixed bottom-6 left-6 z-30 flex flex-col-reverse items-start gap-3">
		<div class="flex items-center gap-2">
			<UButton
				color="neutral"
				variant="soft"
				size="sm"
				@click="showGameSettings = !showGameSettings"
			>
				{{ showGameSettings ? "Hide Settings" : "Game Settings" }}
			</UButton>
			<UButton
				color="neutral"
				variant="soft"
				size="sm"
				@click="showRoomStatus = !showRoomStatus"
			>
				{{ showRoomStatus ? "Hide Room" : "Show Room" }}
			</UButton>
			<UButton color="neutral" variant="subtle" size="sm" to="/">
				Back Home
			</UButton>
		</div>

		<Transition name="settings-panel">
			<BattleGameSettingsPanel
				v-if="showGameSettings"
				:settings="settings"
				:effective-monster-settings="effectiveMonsterSettings"
				@update-hunter-setting="updateHunterSetting($event.key, $event.value)"
				@update-hunter-ability-setting="updateHunterAbilitySetting($event.key, $event.value)"
				@update-monster-setting="updateMonsterSetting($event.key, $event.value)"
				@reset="resetGameSettings"
			/>
		</Transition>

		<Transition name="settings-panel">
			<div
				v-if="showRoomStatus"
				class="w-[min(20rem,calc(100vw-3rem))] rounded-xl border border-white/20 bg-black/55 p-3 backdrop-blur"
			>
				<p class="section-text-outline text-xs uppercase tracking-[0.16em] text-white/80">
					Room Status
				</p>
				<p class="section-text-outline mt-1 text-sm font-semibold text-cyan-100">
					Role: {{ isSpectator ? "Spectator" : "Hunter" }}
				</p>
				<p class="section-text-outline text-xs text-white/80">
					Connection: {{ connectionStatus }}
				</p>
				<p class="section-text-outline text-xs text-white/80">
					Active Hunters: {{ activeHunters.length }} / {{ maxHunters }}
				</p>
				<p class="section-text-outline text-xs text-white/80">
					Spectators: {{ spectatorHunters.length }}
				</p>
				<p class="section-text-outline mt-1 text-xs text-amber-200">
					Turn: {{ currentTurnHunterName || "Monster" }}
				</p>
			</div>
		</Transition>
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
								selfHunter &&
								hunter.id === selfHunter.id &&
								isHunterCardShaking,
							'combat-card combat-card-hit':
								hunter &&
								selfHunter &&
								hunter.id === selfHunter.id &&
								isHunterCardHit,
						}"
					>
						<template v-if="hunter">
							<p
								v-if="!isAwaitingMonsterAttack && !battleEnded && turnHunterId === hunter.id"
								class="turn-card-badge turn-card-badge-hunter section-text-outline"
							>
								Turn
							</p>
							<p class="section-text-outline text-sm font-bold">
								{{ hunter.name }}
							</p>
							<div
								class="relative mt-2 h-6 overflow-hidden rounded-full border border-cyan-300/40 bg-black/40"
							>
								<div
									class="h-full bg-cyan-500/70 transition-all duration-300"
									:style="{
										width: `${Math.max(
											0,
											Math.round((hunter.health / hunter.maxHealth) * 100),
										)}%`,
									}"
								/>
								<span
									class="section-text-outline absolute inset-0 flex items-center justify-center text-xs font-semibold"
								>
									{{ hunter.health }} / {{ hunter.maxHealth }}
								</span>
							</div>
							<div class="section-text-outline mt-2 text-xs text-cyan-100">
								<p class="font-semibold">Level {{ hunter.level }}</p>
								<p>
									XP {{ hunter.experience }} /
									{{ getRequiredExperienceForLevel(hunter.level) }}
								</p>
							</div>
							<img
								src="/images/hunter.png"
								:alt="`${hunter.name} portrait`"
								class="mt-2 h-32 w-full rounded-lg border border-cyan-300/30 bg-black/35 object-contain p-2"
							/>
						</template>
						<template v-else>
							<p class="section-text-outline text-sm font-semibold text-white/70">
								Open Slot
							</p>
							<div class="mt-2 flex h-52 items-center justify-center rounded-lg border border-dashed border-white/20 text-xs text-white/50">
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
				:disabled="isActionDisabled"
				@click="attackMonster"
			>
				<span class="ability-label">
					<Icon class="ability-icon" icon="mdi:sword-cross" />
					Attack
				</span>
				<span class="ability-chance">{{ hunterAbilitySuccessChances.attackChance }}%</span>
			</UButton>

			<UButton
				class="ability-button ability-button-aura"
				color="primary"
				size="xl"
				:disabled="isActionDisabled"
				@click="castAuraBeam"
			>
				<span class="ability-label">
					<Icon class="ability-icon ability-icon-spin" icon="mdi:star-four-points-circle" />
					Aura Beam
				</span>
				<span class="ability-chance">{{ hunterAbilitySuccessChances.auraBeamChance }}%</span>
			</UButton>

			<UButton
				class="ability-button ability-button-heal"
				color="success"
				size="xl"
				:disabled="isActionDisabled || !canHeal"
				@click="healHunter"
			>
				<span class="ability-label">
					<Icon class="ability-icon" icon="mdi:heart-plus" />
					Heal
				</span>
				<span class="ability-chance">{{ hunterAbilitySuccessChances.healChance }}%</span>
			</UButton>

			<UButton
				class="ability-button ability-button-burn"
				color="error"
				size="xl"
				:disabled="isActionDisabled"
				@click="castBurn"
			>
				<span class="ability-label">
					<Icon class="ability-icon" icon="mdi:fire" />
					Burn
				</span>
				<span class="ability-chance">{{ hunterAbilitySuccessChances.burnChance }}%</span>
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
		<p
			v-if="isSpectator"
			class="section-text-outline fixed bottom-[8.5rem] left-1/2 z-30 -translate-x-1/2 rounded-md border border-amber-300/40 bg-black/55 px-3 py-1 text-xs text-amber-200"
		>
			You are spectating. Wait for a free hunter slot.
		</p>

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

	</main>
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

.loot-overlay {
	position: fixed;
	inset: 0;
	z-index: 75;
	display: flex;
	align-items: center;
	justify-content: center;
	background:
		radial-gradient(circle at 50% 45%, rgba(250, 204, 21, 0.16), transparent 30%),
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

.loot-popup-item-label {
	font-size: 0.8rem;
	font-weight: 800;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: rgba(253, 230, 138, 0.88);
}

.loot-popup-item-value {
	font-size: 1rem;
	font-weight: 700;
	color: #fff7ed;
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

@keyframes turn-banner-player-pulse {
	from {
		box-shadow: 0 0 10px rgba(16, 185, 129, 0.26);
	}
	to {
		box-shadow: 0 0 26px rgba(16, 185, 129, 0.48);
	}
}

@keyframes turn-banner-monster-pulse {
	from {
		box-shadow: 0 0 10px rgba(244, 63, 94, 0.26);
	}
	to {
		box-shadow: 0 0 26px rgba(244, 63, 94, 0.48);
	}
}

@keyframes monster-turn-pulse {
	from {
		box-shadow:
			0 0 0 1px rgba(251, 113, 133, 0.5),
			0 0 14px rgba(244, 63, 94, 0.3);
	}
	to {
		box-shadow:
			0 0 0 1px rgba(251, 113, 133, 0.75),
			0 0 34px rgba(244, 63, 94, 0.48);
	}
}

.low-health-overlay {
	position: fixed;
	inset: 0;
	z-index: 45;
	pointer-events: none;
	background:
		radial-gradient(circle at 50% 50%, rgba(255, 0, 0, 0) 58%, rgba(153, 27, 27, 0.18) 100%),
		radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0) 70%, rgba(220, 38, 38, 0.26) 100%);
	animation: low-health-pulse 1.1s ease-in-out infinite;
}

.low-health-overlay-critical {
	background:
		radial-gradient(circle at 50% 50%, rgba(255, 0, 0, 0) 54%, rgba(127, 29, 29, 0.26) 100%),
		radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0) 66%, rgba(220, 38, 38, 0.38) 100%);
	animation: low-health-pulse-critical 0.72s ease-in-out infinite;
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
</style>
