<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { ShopCatalogRow } from "~~/types/shop";
import { getLootRarityClass } from "~~/utils/battle/presentation";
import { lootRarityLabels } from "~~/utils/loot";

defineProps<{
	merchantRows: ShopCatalogRow[];
}>();

defineEmits<{
	(event: "buy-item", itemId: string): void;
}>();

function formatCraftingTags(craftingTags: string[]) {
	return craftingTags.slice(0, 3).join(" / ");
}

const catalogColumns: TableColumn<ShopCatalogRow>[] = [
	{
		accessorKey: "name",
		header: "Stock",
		meta: {
			class: {
				th: "w-[14rem]",
				td: "whitespace-normal align-top",
			},
		},
	},
	{
		accessorKey: "rarity",
		header: "Rarity",
		meta: {
			class: {
				th: "w-28 text-center",
				td: "text-center",
			},
		},
	},
	{
		accessorKey: "ownedQuantity",
		header: "Owned",
		meta: {
			class: {
				th: "w-20 text-right",
				td: "text-right",
			},
		},
	},
	{
		accessorKey: "buyPrice",
		header: "Price",
		meta: {
			class: {
				th: "w-24 text-right",
				td: "text-right",
			},
		},
	},
	{
		id: "actions",
		header: "",
		meta: {
			class: {
				th: "w-24",
				td: "text-right",
			},
		},
	},
];

const catalogTableUi = {
	root: "overflow-auto rounded-[1rem] border border-white/8 bg-black/24",
	base: "min-w-[35rem] border-separate [border-spacing:0_0.35rem]",
	thead: "sticky top-0 z-10 bg-[#16131d]/72 backdrop-blur",
	tbody: "align-top",
	tr: "border-0",
	th: "border-0 bg-transparent px-3 py-0 text-left text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-slate-300/76",
	td: "border-y border-white/7 bg-white/[0.05] px-3 py-4 text-sm text-white/90 whitespace-nowrap",
} as const;
</script>

<template>
	<section class="shop-panel">
		<div class="shop-panel-header">
			<div>
				<p class="shop-kicker">Merchant Stock</p>
				<h2 class="shop-title">Crafting materials on offer</h2>
			</div>
			<p class="shop-caption">
				Every purchase goes straight into the same bag you use after battles.
			</p>
		</div>

		<UTable
			:data="merchantRows"
			:columns="catalogColumns"
			:ui="catalogTableUi"
			sticky="header"
			class="max-h-[32rem]"
		>
			<template #name-cell="{ row }">
				<div class="catalog-cell-item">
					<span class="catalog-item-name">
						{{ row.original.name }}
					</span>
					<span class="catalog-item-meta">
						{{ row.original.category }}
					</span>
					<span class="catalog-item-detail">
						{{ formatCraftingTags(row.original.craftingTags) }}
					</span>
				</div>
			</template>

			<template #rarity-cell="{ row }">
				<span
					class="catalog-rarity-pill"
					:class="getLootRarityClass(row.original.rarity)"
				>
					{{ lootRarityLabels[row.original.rarity] }}
				</span>
			</template>

			<template #actions-cell="{ row }">
				<UButton
					color="primary"
					variant="soft"
					size="xs"
					:disabled="!row.original.canAfford"
					@click="$emit('buy-item', row.original.id)"
				>
					Buy
				</UButton>
			</template>
		</UTable>
	</section>
</template>

<style scoped>
.shop-panel {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.1rem 1rem 1rem;
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 1.2rem;
	background:
		linear-gradient(180deg, rgba(13, 16, 30, 0.84), rgba(11, 9, 16, 0.8)),
		radial-gradient(circle at top right, rgba(34, 197, 94, 0.14), transparent 42%);
	backdrop-filter: blur(16px);
}

.shop-panel-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
}

.shop-kicker {
	font-size: 0.72rem;
	font-weight: 800;
	letter-spacing: 0.16em;
	text-transform: uppercase;
	color: rgba(134, 239, 172, 0.78);
}

.shop-title {
	margin-top: 0.45rem;
	font-size: 1.3rem;
	font-weight: 800;
	color: #dcfce7;
}

.shop-caption {
	max-width: 16rem;
	font-size: 0.82rem;
	line-height: 1.5;
	color: rgba(226, 232, 240, 0.76);
}

.catalog-cell-item {
	display: flex;
	flex-direction: column;
	gap: 0.28rem;
}

.catalog-item-name {
	font-size: 0.95rem;
	font-weight: 700;
	color: #f0fdf4;
}

.catalog-item-meta,
.catalog-item-detail {
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: rgba(226, 232, 240, 0.7);
}

.catalog-rarity-pill {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 6.2rem;
	padding: 0.32rem 0.7rem;
	border-radius: 9999px;
	border: 1px solid rgba(255, 255, 255, 0.14);
	font-size: 0.72rem;
	font-weight: 800;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.loot-rarity-common {
	background: rgba(148, 163, 184, 0.18);
	color: rgba(226, 232, 240, 0.92);
}

.loot-rarity-uncommon {
	background: rgba(34, 197, 94, 0.16);
	color: rgba(187, 247, 208, 0.98);
}

.loot-rarity-rare {
	background: rgba(59, 130, 246, 0.16);
	color: rgba(191, 219, 254, 0.98);
}

.loot-rarity-epic {
	background: rgba(168, 85, 247, 0.16);
	color: rgba(233, 213, 255, 0.98);
}

.loot-rarity-legendary {
	background: rgba(245, 158, 11, 0.18);
	color: rgba(253, 230, 138, 0.98);
}

.loot-rarity-mythic {
	background: rgba(244, 63, 94, 0.18);
	color: rgba(254, 205, 211, 0.98);
}

@media (max-width: 640px) {
	.shop-panel {
		padding: 0.95rem 0.85rem 0.85rem;
	}

	.shop-panel-header {
		flex-direction: column;
	}

	.shop-caption {
		max-width: none;
	}
}
</style>
