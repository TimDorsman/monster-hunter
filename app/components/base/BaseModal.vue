<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		modelValue: boolean;
		title?: string;
		closeOnBackdrop?: boolean;
		showCloseButton?: boolean;
	}>(),
	{
		title: "",
		closeOnBackdrop: true,
		showCloseButton: true,
	},
);

const emit = defineEmits<{
	"update:modelValue": [value: boolean];
}>();

function closeModal() {
	emit("update:modelValue", false);
}

function handleBackdropClick() {
	if (!props.closeOnBackdrop) {
		return;
	}

	closeModal();
}
</script>

<template>
	<Teleport to="body">
		<div
			v-if="props.modelValue"
			class="base-modal-backdrop"
			role="presentation"
			@click="handleBackdropClick"
		>
			<div
				class="base-modal-panel"
				role="dialog"
				aria-modal="true"
				:aria-label="props.title || 'Modal dialog'"
				@click.stop
			>
				<div class="base-modal-header">
					<h2 v-if="props.title" class="base-modal-title">
						{{ props.title }}
					</h2>
					<button
						v-if="props.showCloseButton"
						type="button"
						class="base-modal-close"
						aria-label="Close modal"
						@click="closeModal"
					>
						X
					</button>
				</div>

				<div class="base-modal-body">
					<slot />
				</div>
			</div>
		</div>
	</Teleport>
</template>

<style scoped>
.base-modal-backdrop {
	position: fixed;
	inset: 0;
	z-index: 90;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 1.5rem;
	background: rgba(0, 0, 0, 0.55);
	backdrop-filter: blur(8px);
}

.base-modal-panel {
	width: min(30rem, 100%);
	border: 1px solid rgba(255, 255, 255, 0.18);
	border-radius: 1.25rem;
	background:
		linear-gradient(180deg, rgba(38, 28, 15, 0.98), rgba(16, 12, 8, 0.98)),
		rgba(17, 24, 39, 0.95);
	box-shadow:
		0 24px 48px rgba(0, 0, 0, 0.45),
		0 0 32px rgba(251, 191, 36, 0.12);
	color: #fff7ed;
}

.base-modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 1.25rem 1.25rem 0;
}

.base-modal-title {
	font-size: 1.35rem;
	font-weight: 800;
	letter-spacing: 0.04em;
	text-transform: uppercase;
}

.base-modal-close {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2.25rem;
	height: 2.25rem;
	border: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.05);
	color: inherit;
	cursor: pointer;
	font-size: 1.35rem;
	line-height: 1;
}

.base-modal-body {
	padding: 1.25rem;
}
</style>
