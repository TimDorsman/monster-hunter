<script setup lang="ts">
const {
	PLAYER_MAX_HEALTH,
	isLoading,
	currentMonster,
	monsterHealth,
	playerHealth,
	attackLog,
	monsterHealthPercent,
	playerHealthPercent,
	monsterDefeated,
	playerDefeated,
	battleEnded,
	activeTurn,
	isAwaitingMonsterAttack,
	initializeBattle,
	pickRandomMonster,
	attackMonster,
} = useBattle();

onMounted(() => {
	initializeBattle();
});
</script>

<template>
	<main
		class="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-16"
	>
		<UCard
			class="w-full border border-white/10 bg-surface-800/80 backdrop-blur"
		>
			<template #header>
				<BattleHeader
					:is-loading="isLoading || isAwaitingMonsterAttack"
					@new-monster="pickRandomMonster"
				/>
			</template>

			<BattleLoader v-if="isLoading" />

			<div v-else-if="currentMonster" class="space-y-6">
				<BattleHealthStats
					:player-health="playerHealth"
					:player-max-health="PLAYER_MAX_HEALTH"
					:player-health-percent="playerHealthPercent"
					:monster-health="monsterHealth"
					:monster-max-health="currentMonster.health"
					:monster-name="currentMonster.name"
					:monster-health-percent="monsterHealthPercent"
				/>

				<BattleActions
					:reward="currentMonster.reward"
					:is-loading="isLoading || isAwaitingMonsterAttack"
					:battle-ended="battleEnded"
					:active-turn="activeTurn"
					@attack="attackMonster"
				/>

				<section class="grid gap-4 md:grid-cols-2">
					<BattleElementCard
						title="Weaknesses"
						badge-color="success"
						heading-class="text-accent-200"
						:items="currentMonster.weaknesses"
						item-key-prefix="weak"
					/>

					<BattleElementCard
						title="Strengths"
						badge-color="info"
						heading-class="text-brand-200"
						:items="currentMonster.strenghts"
						item-key-prefix="str"
					/>
				</section>

				<section class="flex flex-wrap items-center gap-3">
					<UButton color="neutral" variant="subtle" to="/">
						Back Home
					</UButton>
				</section>

				<BattleLogAlert
					:player-defeated="playerDefeated"
					:monster-defeated="monsterDefeated"
					:attack-log="attackLog"
				/>
			</div>

			<div v-else>
				<USkeleton class="h-8 w-1/2" />
			</div>
		</UCard>
	</main>
</template>
