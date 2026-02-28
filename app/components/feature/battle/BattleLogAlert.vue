<script setup lang="ts">
defineProps<{
	playerDefeated: boolean;
	monsterDefeated: boolean;
	attackLog: string;
}>();
</script>

<template>
	<UAlert
		:title="
			playerDefeated
				? 'Defeat'
				: monsterDefeated
					? 'Victory'
					: 'Battle Log'
		"
		:description="attackLog"
		:color="
			playerDefeated ? 'error' : monsterDefeated ? 'success' : 'neutral'
		"
		variant="soft"
	/>
</template>
