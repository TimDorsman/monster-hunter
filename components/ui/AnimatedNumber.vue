<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		value: number;
		duration?: number;
		minimumIntegerDigits?: number;
		highlightDirection?: boolean;
	}>(),
	{
		duration: 520,
		minimumIntegerDigits: 1,
		highlightDirection: true,
	},
);

const displayedValue = ref(props.value);
const changeDirection = ref<"up" | "down" | "steady">("steady");

let animationFrameId = 0;
let settleTimer: ReturnType<typeof setTimeout> | null = null;

function stopAnimation() {
	if (!animationFrameId) {
		return;
	}

	cancelAnimationFrame(animationFrameId);
	animationFrameId = 0;
}

function clearSettleTimer() {
	if (!settleTimer) {
		return;
	}

	clearTimeout(settleTimer);
	settleTimer = null;
}

function animateToValue(nextValue: number) {
	stopAnimation();
	clearSettleTimer();

	const startingValue = displayedValue.value;
	const delta = nextValue - startingValue;
	if (delta === 0) {
		changeDirection.value = "steady";
		return;
	}

	changeDirection.value = delta > 0 ? "up" : "down";
	const startedAt = performance.now();

	const step = (currentTime: number) => {
		const elapsed = currentTime - startedAt;
		const progress = Math.min(1, elapsed / props.duration);
		const easedProgress = 1 - Math.pow(1 - progress, 3);

		displayedValue.value = Math.round(
			startingValue + delta * easedProgress,
		);

		if (progress < 1) {
			animationFrameId = requestAnimationFrame(step);
			return;
		}

		displayedValue.value = nextValue;
		animationFrameId = 0;
		settleTimer = setTimeout(() => {
			changeDirection.value = "steady";
			settleTimer = null;
		}, 220);
	};

	animationFrameId = requestAnimationFrame(step);
}

watch(
	() => props.value,
	(nextValue) => {
		animateToValue(nextValue);
	},
);

onScopeDispose(() => {
	stopAnimation();
	clearSettleTimer();
});

const formattedValue = computed(() => {
	return displayedValue.value
		.toString()
		.padStart(props.minimumIntegerDigits, "0");
});
</script>

<template>
	<span
		class="animated-number"
		:class="{
			'animated-number-up':
				props.highlightDirection && changeDirection === 'up',
			'animated-number-down':
				props.highlightDirection && changeDirection === 'down',
		}"
	>
		{{ formattedValue }}
	</span>
</template>

<style scoped>
.animated-number {
	display: inline-block;
	font-variant-numeric: tabular-nums;
	transition:
		color 0.22s ease,
		transform 0.22s ease,
		text-shadow 0.22s ease;
}

.animated-number-up {
	color: #86efac;
	transform: translateY(-1px);
	text-shadow: 0 0 16px rgba(74, 222, 128, 0.3);
}

.animated-number-down {
	color: #fca5a5;
	transform: translateY(1px);
	text-shadow: 0 0 16px rgba(248, 113, 113, 0.26);
}
</style>
