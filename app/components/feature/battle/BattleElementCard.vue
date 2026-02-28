<script setup lang="ts">
defineProps<{
	title: string;
	badgeColor: "success" | "info";
	headingClass: string;
	items: string[];
	itemKeyPrefix: string;
}>();
</script>

<template>
	<div class="rounded-xl border border-white/10 bg-surface-700/40 p-4">
		<p
			class="mb-3 text-xs font-semibold uppercase tracking-[0.2em]"
			:class="headingClass"
		>
			{{ title }}
		</p>
		<div class="flex flex-wrap gap-2">
			<UBadge
				v-for="item in items"
				:key="`${itemKeyPrefix}-${item}`"
				:color="badgeColor"
				variant="soft"
			>
				{{ item }}
			</UBadge>
		</div>
	</div>
</template>
