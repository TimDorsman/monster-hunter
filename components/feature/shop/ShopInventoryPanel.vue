<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { BattleInventoryRow } from "~~/types/battle-ui";
import { getLootRarityClass } from "~~/utils/battle/presentation";
import { lootRarityLabels } from "~~/utils/loot";

const props = defineProps<{
	inventoryRows: BattleInventoryRow[];
	playerInventorySaleValue: number;
}>();

defineEmits<{
	(event: "sell-all"): void;
	(event: "sell-item", itemId: string): void;
}>();

const hasInventory = computed(() => props.inventoryRows.length > 0);
const inventoryColumns: TableColumn<BattleInventoryRow>[] = [
	{
		accessorKey: "name",
		header: "Item",
		meta: {
			class: {
				th: "w-[13rem]",
				td: "whitespace-normal align-top",
			},
		},
	},
	{
		accessorKey: "quantity",
		header: "Qty",
		meta: {
			class: {
				th: "w-16 text-right",
				td: "text-right",
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
		accessorKey: "stackValue",
		header: "Value",
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
				th: "w-28",
				td: "text-right",
			},
		},
	},
];

const inventoryTableUi = {
	root: "overflow-auto rounded-[1rem] border border-white/8 bg-black/24",
	base: "min-w-[34rem] border-separate [border-spacing:0_0.35rem]",
	thead: "sticky top-0 z-10 bg-[#110f17]/72 backdrop-blur",
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
				<p class="shop-kicker">Hunter Inventory</p>
				<h2 class="shop-title">Loot ready to cash out</h2>
			</div>
			<UButton
				color="warning"
				variant="soft"
				size="sm"
				:disabled="!hasInventory"
				@click="$emit('sell-all')"
			>
				Sell All ({{ playerInventorySaleValue }} Gold)
			</UButton>
		</div>

		<UTable
			v-if="hasInventory"
			:data="inventoryRows"
			:columns="inventoryColumns"
			:ui="inventoryTableUi"
			sticky="header"
			class="max-h-[32rem]"
		>
			<template #name-cell="{ row }">
				<div class="inventory-cell-item">
					<span class="inventory-item-name">
						{{ row.original.name }}
					</span>
					<span class="inventory-item-meta">
						{{ row.original.category }}
					</span>
				</div>
			</template>

			<template #rarity-cell="{ row }">
				<span
					class="inventory-rarity-pill"
					:class="getLootRarityClass(row.original.rarity)"
				>
					{{ lootRarityLabels[row.original.rarity] }}
				</span>
			</template>

			<template #actions-cell="{ row }">
				<UButton
					color="warning"
					variant="soft"
					size="xs"
					@click="$emit('sell-item', row.original.itemId)"
				>
					Sell Stack
				</UButton>
			</template>
		</UTable>

		<div v-else class="shop-empty-state">
			<p class="shop-empty-title">Your bags are empty.</p>
			<p>Win battles, open the chest, and bring monster parts back here.</p>
		</div>
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
		linear-gradient(180deg, rgba(15, 18, 31, 0.86), rgba(12, 10, 16, 0.82)),
		radial-gradient(circle at top left, rgba(251, 191, 36, 0.12), transparent 42%);
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
	color: rgba(250, 204, 21, 0.72);
}

.shop-title {
	margin-top: 0.45rem;
	font-size: 1.3rem;
	font-weight: 800;
	color: #fef3c7;
}

.inventory-cell-item {
	display: flex;
	flex-direction: column;
	gap: 0.28rem;
}

.inventory-item-name {
	font-size: 0.95rem;
	font-weight: 700;
	color: #fff7ed;
}

.inventory-item-meta,
.inventory-item-detail {
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: rgba(226, 232, 240, 0.7);
}

.inventory-rarity-pill {
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

.shop-empty-state {
	display: grid;
	gap: 0.32rem;
	padding: 1rem;
	border: 1px dashed rgba(255, 255, 255, 0.16);
	border-radius: 1rem;
	background: rgba(255, 255, 255, 0.04);
	color: rgba(241, 245, 249, 0.8);
}

.shop-empty-title {
	font-size: 1rem;
	font-weight: 700;
	color: #f8fafc;
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
}
</style>
