<script setup lang="ts">
defineProps<{
	playerHealth: number;
	playerMaxHealth: number;
	playerHealthPercent: number;
	monsterHealth: number;
	monsterMaxHealth: number;
	monsterName: string;
	monsterHealthPercent: number;
}>();
</script>

<template>
	<section class="grid gap-4 md:grid-cols-2">
		<div class="rounded-xl border border-sky-400/40 bg-sky-500/15 p-4">
			<div class="mb-1 flex items-center justify-between text-sm text-sky-100">
				<span class="font-semibold">Hunter HP</span>
				<span>{{ playerHealth }} / {{ playerMaxHealth }}</span>
			</div>
			<UProgress
				:model-value="playerHealthPercent"
				:max="100"
				size="xl"
				color="error"
				class="w-full"
				:ui="{
					base: 'bg-white/20',
					indicator: 'bg-red-500',
				}"
			/>
		</div>

		<div class="rounded-xl border border-rose-400/40 bg-rose-500/15 p-4">
			<div class="mb-1 flex items-center justify-between text-sm text-red-100">
				<span class="font-semibold">Monster HP</span>
				<span>{{ monsterHealth }} / {{ monsterMaxHealth }}</span>
			</div>
			<UProgress
				:model-value="monsterHealthPercent"
				:max="100"
				size="xl"
				color="error"
				class="w-full"
				:ui="{
					base: 'bg-white/20',
					indicator: 'bg-red-500',
				}"
			/>
			<p class="mt-2 text-right text-sm font-semibold text-white">
				{{ monsterName }}
			</p>
		</div>
	</section>
</template>
