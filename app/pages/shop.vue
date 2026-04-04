<script setup lang="ts">
import { Icon } from "@iconify/vue";
import ShopCatalogPanel from "~~/components/feature/shop/ShopCatalogPanel.vue";
import ShopInventoryPanel from "~~/components/feature/shop/ShopInventoryPanel.vue";
import { useShop } from "~/composables/useShop";

const {
	playerGold,
	inventoryRows,
	inventorySaleValue,
	merchantRows,
	feedback,
	buyItem,
	sellItemStack,
	sellAllItemStacks,
} = useShop();

const feedbackClass = computed(() => {
	if (feedback.value.tone === "success") {
		return "shop-feedback-success";
	}

	if (feedback.value.tone === "danger") {
		return "shop-feedback-danger";
	}

	return "shop-feedback-neutral";
});
</script>

<template>
	<main class="shop-page min-h-screen px-4 py-6 sm:px-6 lg:px-8">
		<div class="mx-auto flex max-w-7xl flex-col gap-6">
			<header class="shop-hero">
				<div class="shop-hero-copy">
					<p class="shop-kicker">Town Market</p>
					<h1 class="shop-heading">Restock the hunt and cash out your spoils</h1>
					<p class="shop-subheading">
						Sell monster loot for gold, then turn around and buy materials
						for the next build path.
					</p>
				</div>

				<div class="shop-hero-actions">
					<UButton color="primary" variant="solid" to="/battle">
						<Icon icon="mdi:sword-cross" />
						<span>Return to Battle</span>
					</UButton>
					<UButton color="neutral" variant="soft" to="/">
						<Icon icon="mdi:home-outline" />
						<span>Town Hub</span>
					</UButton>
				</div>
			</header>

			<section class="shop-status-grid">
				<div class="shop-gold-card">
					<div class="shop-gold-icon">
						<Icon icon="mdi:cash-multiple" />
					</div>
					<div>
						<p class="shop-status-label">Current Gold</p>
						<p class="shop-status-value">{{ playerGold }}</p>
					</div>
				</div>

				<div class="shop-feedback-card" :class="feedbackClass">
					<p class="shop-status-label">Trader Notes</p>
					<p class="shop-feedback-message">{{ feedback.message }}</p>
				</div>
			</section>

			<section class="shop-panels">
				<ShopCatalogPanel
					:merchant-rows="merchantRows"
					@buy-item="buyItem"
				/>
				<ShopInventoryPanel
					:inventory-rows="inventoryRows"
					:player-inventory-sale-value="inventorySaleValue"
					@sell-item="sellItemStack"
					@sell-all="sellAllItemStacks"
				/>
			</section>
		</div>
	</main>
</template>

<style scoped>
.shop-page {
	position: relative;
}

.shop-page::before {
	content: "";
	position: fixed;
	inset: 0;
	pointer-events: none;
	background:
		radial-gradient(circle at top left, rgba(251, 191, 36, 0.12), transparent 26%),
		radial-gradient(circle at top right, rgba(34, 197, 94, 0.12), transparent 24%),
		linear-gradient(180deg, rgba(12, 9, 18, 0.12), rgba(6, 8, 15, 0.42));
	z-index: 0;
}

.shop-hero,
.shop-status-grid,
.shop-panels {
	position: relative;
	z-index: 1;
}

.shop-hero {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 1.5rem;
	padding: 1.6rem;
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 1.75rem;
	background:
		linear-gradient(135deg, rgba(20, 16, 28, 0.92), rgba(12, 13, 23, 0.86)),
		radial-gradient(circle at top left, rgba(251, 191, 36, 0.18), transparent 40%);
	box-shadow:
		0 20px 60px rgba(0, 0, 0, 0.32),
		inset 0 1px 0 rgba(255, 255, 255, 0.06);
	backdrop-filter: blur(18px);
}

.shop-hero-copy {
	max-width: 42rem;
}

.shop-kicker {
	font-size: 0.76rem;
	font-weight: 800;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	color: rgba(252, 211, 77, 0.8);
}

.shop-heading {
	margin-top: 0.6rem;
	font-size: clamp(2rem, 4vw, 3.35rem);
	font-weight: 900;
	line-height: 1.05;
	color: #fef3c7;
	text-wrap: balance;
}

.shop-subheading {
	margin-top: 0.8rem;
	max-width: 34rem;
	font-size: 1rem;
	line-height: 1.6;
	color: rgba(226, 232, 240, 0.82);
}

.shop-hero-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 0.8rem;
}

.shop-status-grid {
	display: grid;
	grid-template-columns: minmax(0, 18rem) minmax(0, 1fr);
	gap: 1rem;
}

.shop-gold-card,
.shop-feedback-card {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1.1rem 1.2rem;
	border: 1px solid rgba(255, 255, 255, 0.08);
	border-radius: 1.35rem;
	backdrop-filter: blur(16px);
}

.shop-gold-card {
	background: linear-gradient(135deg, rgba(120, 53, 15, 0.72), rgba(38, 20, 7, 0.82));
}

.shop-feedback-card {
	background: linear-gradient(135deg, rgba(15, 23, 42, 0.84), rgba(9, 12, 20, 0.82));
}

.shop-feedback-neutral {
	border-color: rgba(148, 163, 184, 0.2);
}

.shop-feedback-success {
	border-color: rgba(74, 222, 128, 0.3);
	background: linear-gradient(135deg, rgba(17, 94, 89, 0.72), rgba(9, 34, 31, 0.84));
}

.shop-feedback-danger {
	border-color: rgba(248, 113, 113, 0.32);
	background: linear-gradient(135deg, rgba(127, 29, 29, 0.74), rgba(42, 10, 10, 0.84));
}

.shop-gold-icon {
	display: grid;
	place-items: center;
	width: 3rem;
	height: 3rem;
	border-radius: 9999px;
	background: rgba(255, 255, 255, 0.1);
	color: #fde68a;
	font-size: 1.35rem;
}

.shop-status-label {
	font-size: 0.72rem;
	font-weight: 800;
	letter-spacing: 0.16em;
	text-transform: uppercase;
	color: rgba(226, 232, 240, 0.74);
}

.shop-status-value {
	margin-top: 0.32rem;
	font-size: 1.85rem;
	font-weight: 900;
	color: #fff7ed;
}

.shop-feedback-message {
	margin-top: 0.35rem;
	font-size: 0.94rem;
	line-height: 1.5;
	color: rgba(248, 250, 252, 0.92);
}

.shop-panels {
	display: grid;
	grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
	gap: 1rem;
}

@media (max-width: 1100px) {
	.shop-panels {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 900px) {
	.shop-hero {
		flex-direction: column;
		align-items: flex-start;
	}

	.shop-status-grid {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 640px) {
	.shop-page {
		padding-right: 0.9rem;
		padding-left: 0.9rem;
	}

	.shop-hero {
		padding: 1.15rem;
		border-radius: 1.35rem;
	}

	.shop-heading {
		font-size: 2.1rem;
	}

	.shop-hero-actions {
		width: 100%;
	}
}
</style>
