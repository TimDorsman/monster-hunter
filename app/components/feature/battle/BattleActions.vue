<script setup lang="ts">
const props = defineProps<{
	reward: string;
	isLoading: boolean;
	battleEnded: boolean;
	activeTurn: "player" | "monster" | "ended";
}>();

defineEmits<{
	attack: [];
}>();

const turnLabel = computed(() => {
	if (props.activeTurn === "player") {
		return "Your Turn";
	}

	if (props.activeTurn === "monster") {
		return "Monster Turn";
	}

	return "Battle Ended";
});

const turnColor = computed<"success" | "error" | "neutral">(() => {
	if (props.activeTurn === "player") {
		return "success";
	}

	if (props.activeTurn === "monster") {
		return "error";
	}

	return "neutral";
});

const turnContainerClass = computed(() => {
	if (props.activeTurn === "player") {
		return "border-emerald-400/40 bg-emerald-500/15";
	}

	if (props.activeTurn === "monster") {
		return "border-red-400/40 bg-red-500/15 animate-pulse";
	}

	return "border-white/20 bg-white/10";
});

const turnBadgeClass = computed(() => {
	if (props.activeTurn === "monster") {
		return "animate-pulse";
	}

	return "";
});
</script>

<template>
	<div class="space-y-3">
		<div
			class="rounded-xl border px-4 py-3"
			:class="turnContainerClass"
		>
			<p class="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
				Current Turn
			</p>
			<div class="mt-1 flex items-center gap-3">
				<UBadge
					:color="turnColor"
					variant="solid"
					size="lg"
					:class="turnBadgeClass"
				>
					{{ turnLabel }}
				</UBadge>
				<p class="text-sm text-white/85">
					<span v-if="activeTurn === 'player'">Choose your next action.</span>
					<span v-else-if="activeTurn === 'monster'">Waiting for the monster attack...</span>
					<span v-else>The encounter is finished.</span>
				</p>
			</div>
		</div>

		<div class="flex flex-wrap items-center justify-between gap-3">
			<UBadge color="primary" variant="soft">Reward: {{ reward }}</UBadge>
		
			<UButton
				color="error"
				size="xl"
				:disabled="isLoading || battleEnded"
				@click="$emit('attack')"
			>
				Attack
			</UButton>
		</div>
	</div>
</template>
