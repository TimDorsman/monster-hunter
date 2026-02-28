<script setup lang="ts">
defineProps<{
	isLoading: boolean;
}>();

defineEmits<{
	newMonster: [];
}>();
</script>

<template>
	<div class="flex items-center justify-between gap-3">
		<div>
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">
				Battle Zone
			</p>
			<h1 class="text-3xl font-bold text-white">Monster Encounter</h1>
		</div>
		<UButton
			color="neutral"
			variant="soft"
			:disabled="isLoading"
			@click="$emit('newMonster')"
		>
			New Monster
		</UButton>
	</div>
</template>
