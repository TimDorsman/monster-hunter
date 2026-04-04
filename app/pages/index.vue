<template>
	<main class="town-page min-h-screen px-4 py-6 sm:px-6 lg:px-8">
		<div class="mx-auto flex max-w-6xl flex-col gap-6">
			<section class="town-hero">
				<div>
					<p class="town-kicker">Monster Hunter</p>
					<h1 class="town-heading">Choose your next stop in town</h1>
					<p class="town-subheading">
						Step into battle to hunt new monsters, or visit the market to turn
						loot into gold and restock crafting materials.
					</p>
				</div>

				<div class="town-actions">
					<UButton color="primary" variant="solid" size="xl" to="/battle">
						Start Battle
					</UButton>
					<UButton color="neutral" variant="soft" size="xl" to="/shop">
						Visit Shop
					</UButton>
				</div>
			</section>

			<section class="town-route-list">
				<NuxtLink class="town-route town-route-battle" to="/battle">
					<div class="town-route-copy">
						<p class="town-route-kicker">Hunt</p>
						<h2 class="town-route-title">Battle Arena</h2>
						<p class="town-route-copy-text">
							Fight monsters, claim the chest, and bring home gold plus rare drops.
						</p>
					</div>
					<p class="town-route-arrow">Enter</p>
				</NuxtLink>

				<NuxtLink class="town-route town-route-shop" to="/shop">
					<div class="town-route-copy">
						<p class="town-route-kicker">Trade</p>
						<h2 class="town-route-title">Merchant Quarter</h2>
						<p class="town-route-copy-text">
							Sell stacked loot, buy fresh materials, and keep your hunting loop moving.
						</p>
					</div>
					<p class="town-route-arrow">Enter</p>
				</NuxtLink>
			</section>
		</div>
	</main>
</template>

<style scoped>
.town-page {
	position: relative;
}

.town-page::before {
	content: "";
	position: fixed;
	inset: 0;
	pointer-events: none;
	background:
		radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 24%),
		radial-gradient(circle at top right, rgba(251, 191, 36, 0.14), transparent 28%),
		repeating-linear-gradient(
			90deg,
			rgba(255, 255, 255, 0.02) 0,
			rgba(255, 255, 255, 0.02) 1px,
			transparent 1px,
			transparent 90px
		),
		linear-gradient(180deg, rgba(7, 10, 20, 0.2), rgba(10, 7, 15, 0.46));
}

.town-hero,
.town-route-list {
	position: relative;
	z-index: 1;
}

.town-hero {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	align-items: end;
	gap: 1.25rem;
	padding: 1.2rem 1.3rem 1.4rem;
	border: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 1.35rem;
	background:
		linear-gradient(135deg, rgba(17, 24, 39, 0.88), rgba(20, 12, 23, 0.82)),
		radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 40%);
	backdrop-filter: blur(16px);
}

.town-kicker,
.town-route-kicker {
	font-size: 0.78rem;
	font-weight: 800;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	color: rgba(191, 219, 254, 0.78);
}

.town-heading {
	margin-top: 0.65rem;
	font-size: clamp(2.2rem, 4vw, 3.7rem);
	font-weight: 900;
	line-height: 1.04;
	color: #eff6ff;
}

.town-subheading {
	margin-top: 0.9rem;
	max-width: 38rem;
	font-size: 1rem;
	line-height: 1.65;
	color: rgba(226, 232, 240, 0.82);
}

.town-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 0.9rem;
	margin-top: 1.4rem;
}

.town-route-list {
	display: grid;
	gap: 0.65rem;
}

.town-route {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	align-items: center;
	gap: 1rem;
	padding: 1rem 1.15rem;
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 1.1rem;
	text-decoration: none;
	transition:
		transform 0.22s ease,
		border-color 0.22s ease;
	backdrop-filter: blur(14px);
}

.town-route:hover {
	transform: translateX(6px);
	border-color: rgba(255, 255, 255, 0.24);
}

.town-route-battle {
	background:
		linear-gradient(90deg, rgba(59, 130, 246, 0.28), rgba(8, 18, 36, 0.82) 34%),
		rgba(10, 14, 24, 0.82);
}

.town-route-shop {
	background:
		linear-gradient(90deg, rgba(251, 191, 36, 0.24), rgba(36, 20, 8, 0.82) 34%),
		rgba(14, 11, 9, 0.82);
}

.town-route-title {
	margin-top: 0.35rem;
	font-size: 1.45rem;
	font-weight: 800;
	color: #f8fafc;
}

.town-route-copy-text {
	margin-top: 0.55rem;
	font-size: 0.95rem;
	line-height: 1.6;
	color: rgba(226, 232, 240, 0.8);
}

.town-route-arrow {
	font-size: 0.78rem;
	font-weight: 800;
	letter-spacing: 0.16em;
	text-transform: uppercase;
	color: rgba(226, 232, 240, 0.64);
}

@media (max-width: 768px) {
	.town-hero {
		grid-template-columns: 1fr;
		padding: 1rem 1rem 1.1rem;
	}

	.town-route {
		grid-template-columns: 1fr;
	}
}
</style>
