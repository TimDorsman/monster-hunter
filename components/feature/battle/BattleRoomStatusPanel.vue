<script setup lang="ts">
defineProps<{
	isSpectator: boolean;
	connectionStatus: string;
	activeHunterCount: number;
	maxHunters: number;
	spectatorCount: number;
	currentTurnHunterName: string;
}>();
</script>

<template>
	<div
		class="room-status-panel w-[min(20rem,calc(100vw-3rem))] rounded-xl border border-white/20 bg-black/55 p-3 backdrop-blur"
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
			Active Hunters: {{ activeHunterCount }} / {{ maxHunters }}
		</p>
		<p class="section-text-outline text-xs text-white/80">
			Spectators: {{ spectatorCount }}
		</p>
		<p class="section-text-outline mt-1 text-xs text-amber-200">
			Turn: {{ currentTurnHunterName || "Monster" }}
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
</style>
