<template>
	<main class="town-page min-h-screen px-4 py-6 sm:px-6 lg:px-8">
		<div class="mx-auto flex max-w-6xl flex-col gap-6">
			<section class="town-hero">
				<p class="town-kicker">Monster Hunter</p>
				<h1 class="town-heading">Choose your next stop in town</h1>
				<p class="town-subheading">
					Step into battle to hunt new monsters, or visit the market to turn
					loot into gold and restock crafting materials.
				</p>

				<div class="town-actions">
					<UButton color="primary" variant="solid" size="xl" to="/battle">
						Start Battle
					</UButton>
					<UButton color="neutral" variant="soft" size="xl" to="/shop">
						Visit Shop
					</UButton>
				</div>
			</section>

			<section class="town-card-grid">
				<NuxtLink class="town-card town-card-battle" to="/battle">
					<p class="town-card-kicker">Hunt</p>
					<h2 class="town-card-title">Battle Arena</h2>
					<p class="town-card-copy">
						Fight monsters, claim the chest, and bring home gold plus rare drops.
					</p>
				</NuxtLink>

				<NuxtLink class="town-card town-card-shop" to="/shop">
					<p class="town-card-kicker">Trade</p>
					<h2 class="town-card-title">Merchant Quarter</h2>
					<p class="town-card-copy">
						Sell stacked loot, buy fresh materials, and keep your hunting loop moving.
					</p>
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
		linear-gradient(180deg, rgba(7, 10, 20, 0.2), rgba(10, 7, 15, 0.46));
}

.town-hero,
.town-card-grid {
	position: relative;
	z-index: 1;
}

.town-hero {
	padding: 1.8rem;
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 1.8rem;
	background:
		linear-gradient(135deg, rgba(17, 24, 39, 0.9), rgba(20, 12, 23, 0.84)),
		radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 40%);
	box-shadow:
		0 18px 60px rgba(0, 0, 0, 0.32),
		inset 0 1px 0 rgba(255, 255, 255, 0.05);
	backdrop-filter: blur(18px);
}

.town-kicker,
.town-card-kicker {
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

.town-card-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 1rem;
}

.town-card {
	display: block;
	padding: 1.4rem;
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 1.5rem;
	text-decoration: none;
	transition:
		transform 0.22s ease,
		border-color 0.22s ease,
		background 0.22s ease;
	backdrop-filter: blur(16px);
}

.town-card:hover {
	transform: translateY(-4px);
	border-color: rgba(255, 255, 255, 0.18);
}

.town-card-battle {
	background:
		linear-gradient(145deg, rgba(30, 41, 59, 0.88), rgba(16, 23, 35, 0.8)),
		radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 40%);
}

.town-card-shop {
	background:
		linear-gradient(145deg, rgba(56, 26, 13, 0.88), rgba(25, 16, 11, 0.8)),
		radial-gradient(circle at top right, rgba(251, 191, 36, 0.2), transparent 42%);
}

.town-card-title {
	margin-top: 0.55rem;
	font-size: 1.45rem;
	font-weight: 800;
	color: #f8fafc;
}

.town-card-copy {
	margin-top: 0.7rem;
	font-size: 0.95rem;
	line-height: 1.6;
	color: rgba(226, 232, 240, 0.8);
}

@media (max-width: 768px) {
	.town-card-grid {
		grid-template-columns: 1fr;
	}

	.town-hero {
		padding: 1.25rem;
		border-radius: 1.4rem;
	}
}
</style>
