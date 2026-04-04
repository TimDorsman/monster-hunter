<script setup lang="ts">
import { Icon } from "@iconify/vue";
import ShopCatalogPanel from "~~/components/feature/shop/ShopCatalogPanel.vue";
import ShopInventoryPanel from "~~/components/feature/shop/ShopInventoryPanel.vue";
import AnimatedNumber from "~~/components/ui/AnimatedNumber.vue";
import { useShop } from "~/composables/useShop";

const {
	playerGold,
	inventoryRows,
	inventorySaleValue,
	merchantRows,
	refreshMinutes,
	refreshSeconds,
	stockItemCount,
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

			<section class="shop-market-shell">
				<div class="shop-market-backdrop" />

				<section class="shop-status-strip">
					<div class="shop-gold-meter">
						<div class="shop-gold-icon">
							<Icon icon="mdi:cash-multiple" />
						</div>
						<div>
							<p class="shop-status-label">Current Gold</p>
							<p class="shop-status-value">
								<AnimatedNumber :value="playerGold" />
							</p>
						</div>
					</div>

					<div class="shop-timer-meter">
						<div class="shop-timer-icon">
							<Icon icon="mdi:timer-sand" />
						</div>
						<div>
							<p class="shop-status-label">New Stock In</p>
							<div class="shop-timer-value">
								<AnimatedNumber
									:value="refreshMinutes"
									:minimum-integer-digits="2"
									:highlight-direction="false"
								/>
								<span class="shop-timer-separator">:</span>
								<AnimatedNumber
									:value="refreshSeconds"
									:minimum-integer-digits="2"
									:highlight-direction="false"
								/>
							</div>
							<p class="shop-status-meta">
								{{ stockItemCount }} items in this rotation
							</p>
						</div>
					</div>

					<div class="shop-feedback-strip" :class="feedbackClass">
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
		radial-gradient(circle at top left, rgba(251, 191, 36, 0.13), transparent 24%),
		radial-gradient(circle at top right, rgba(34, 197, 94, 0.11), transparent 22%),
		repeating-linear-gradient(
			90deg,
			rgba(255, 255, 255, 0.02) 0,
			rgba(255, 255, 255, 0.02) 1px,
			transparent 1px,
			transparent 88px
		),
		linear-gradient(180deg, rgba(12, 9, 18, 0.1), rgba(6, 8, 15, 0.38));
	z-index: 0;
}

.shop-hero,
.shop-market-shell,
.shop-status-strip,
.shop-panels {
	position: relative;
	z-index: 1;
}

.shop-hero {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	align-items: end;
	gap: 1.5rem;
	padding: 1.2rem 1.35rem 1.4rem;
	border: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 1.4rem;
	background:
		linear-gradient(135deg, rgba(20, 16, 28, 0.88), rgba(12, 13, 23, 0.82)),
		radial-gradient(circle at top left, rgba(251, 191, 36, 0.18), transparent 40%);
	backdrop-filter: blur(16px);
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

.shop-status-strip {
	display: grid;
	grid-template-columns: minmax(0, 18rem) minmax(0, 17rem) minmax(0, 1fr);
	gap: 1rem;
	align-items: end;
}

.shop-market-shell {
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.15rem;
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 1.5rem;
	overflow: hidden;
	background: rgba(4, 8, 18, 0.52);
	backdrop-filter: blur(18px);
}

.shop-market-backdrop {
	position: absolute;
	inset: 0;
	pointer-events: none;
	background:
		radial-gradient(circle at top left, rgba(251, 191, 36, 0.14), transparent 28%),
		radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.12), transparent 34%),
		linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0));
}

.shop-gold-meter,
.shop-timer-meter,
.shop-feedback-strip {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 0.95rem 1.1rem;
	border: 1px solid rgba(255, 255, 255, 0.09);
	border-radius: 1.1rem;
	backdrop-filter: blur(14px);
	background: rgba(10, 14, 24, 0.7);
}

.shop-feedback-neutral {
	border-color: rgba(148, 163, 184, 0.2);
	background: rgba(15, 23, 42, 0.76);
}

.shop-feedback-success {
	border-color: rgba(74, 222, 128, 0.3);
	background: linear-gradient(135deg, rgba(8, 54, 47, 0.88), rgba(8, 27, 25, 0.82));
}

.shop-feedback-danger {
	border-color: rgba(248, 113, 113, 0.32);
	background: linear-gradient(135deg, rgba(95, 24, 24, 0.9), rgba(34, 10, 10, 0.84));
}

.shop-gold-icon {
	display: grid;
	place-items: center;
	width: 3rem;
	height: 3rem;
	border-radius: 0.95rem;
	background: linear-gradient(135deg, rgba(146, 64, 14, 0.64), rgba(51, 24, 8, 0.82));
	color: #fde68a;
	font-size: 1.35rem;
}

.shop-timer-icon {
	display: grid;
	place-items: center;
	width: 3rem;
	height: 3rem;
	border-radius: 0.95rem;
	background: linear-gradient(135deg, rgba(21, 101, 192, 0.62), rgba(16, 35, 68, 0.8));
	color: #bfdbfe;
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

.shop-timer-value {
	display: flex;
	align-items: center;
	gap: 0.16rem;
	margin-top: 0.32rem;
	font-size: 1.85rem;
	font-weight: 900;
	color: #eff6ff;
	font-variant-numeric: tabular-nums;
}

.shop-timer-separator {
	display: inline-block;
	transform: translateY(-0.04em);
	color: rgba(226, 232, 240, 0.86);
}

.shop-status-meta {
	margin-top: 0.18rem;
	font-size: 0.76rem;
	font-weight: 700;
	letter-spacing: 0.04em;
	color: rgba(191, 219, 254, 0.76);
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
		grid-template-columns: 1fr;
		align-items: start;
	}

	.shop-status-strip {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 640px) {
	.shop-page {
		padding-right: 0.9rem;
		padding-left: 0.9rem;
	}

	.shop-hero {
		padding: 1rem 1rem 1.1rem;
	}

	.shop-heading {
		font-size: 2.1rem;
	}

	.shop-hero-actions {
		width: 100%;
	}

	.shop-market-shell {
		padding: 0.95rem;
		border-radius: 1.2rem;
	}
}
</style>
