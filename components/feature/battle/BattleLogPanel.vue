<script setup lang="ts">
import type { BattleLogEntry } from "~~/types/battle";
import {
	getBattleLogItemClass,
	getBattleLogSourceLabel,
} from "~~/utils/battle/presentation";

defineProps<{
	title: string;
	logs: BattleLogEntry[];
}>();
</script>

<template>
	<aside
		class="fixed bottom-6 right-6 z-30 w-[min(24rem,calc(100vw-3rem))] rounded-xl border border-white/20 bg-black/55 p-4 backdrop-blur"
	>
		<p class="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-white/85">
			{{ title }}
		</p>
		<ul class="max-h-56 space-y-1 overflow-y-auto pr-2 text-sm">
			<li
				v-for="log in logs"
				:key="log.id"
				class="battle-log-item"
				:class="getBattleLogItemClass(log.source)"
			>
				<span class="battle-log-source">
					{{ getBattleLogSourceLabel(log.source) }}
				</span>
				<span class="battle-log-message">{{ log.message }}</span>
			</li>
		</ul>
	</aside>
</template>

<style scoped>
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
</style>
