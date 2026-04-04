<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { BattleInventoryRow } from "~~/types/battle-ui";
import { getLootRarityClass } from "~~/utils/battle/presentation";
import { formatLootAppearance, lootRarityLabels } from "~~/utils/loot";

const props = defineProps<{
	inventoryRows: BattleInventoryRow[];
	playerInventorySaleValue: number;
}>();

defineEmits<{
	(event: "sell-all"): void;
}>();

const hasInventory = computed(() => props.inventoryRows.length > 0);
const inventorySummaryLabel = computed(() => {
	if (!hasInventory.value) {
		return "No loot collected yet";
	}

	return `${props.inventoryRows.length} stacked items`;
});

const sellAllLabel = computed(() => {
	if (!hasInventory.value) {
		return "Sell All";
	}

	return `Sell All (${props.playerInventorySaleValue} Gold)`;
});

const inventoryColumns: TableColumn<BattleInventoryRow>[] = [
	{
		accessorKey: "name",
		header: "Item",
		meta: {
			class: {
				th: "w-[14rem]",
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
		accessorKey: "appearance",
		header: "Appearance",
		meta: {
			class: {
				th: "w-28",
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
];

const inventoryTableUi = {
	root: "overflow-auto rounded-xl border border-white/10 bg-white/3",
	base: "min-w-[35.25rem] border-separate [border-spacing:0_0.65rem]",
	thead: "sticky top-0 z-10 bg-black/72 backdrop-blur",
	tbody: "align-top",
	tr: "border-0",
	th: "border-0 bg-transparent px-3 py-0 text-left text-[0.72rem] font-extrabold uppercase tracking-[0.08em] text-slate-200/78",
	td: "border border-white/8 bg-white/4 px-3 py-4 text-sm text-white/90 whitespace-nowrap first:rounded-l-[0.9rem] last:rounded-r-[0.9rem]",
} as const;
</script>

<template>
	<div
		class="inventory-panel w-[min(36rem,calc(100vw-3rem))] rounded-xl border border-white/20 bg-black/60 p-4 backdrop-blur"
	>
		<div class="inventory-panel-header">
			<div>
				<p class="section-text-outline text-xs uppercase tracking-[0.16em] text-white/80">
					Inventory
				</p>
				<p class="section-text-outline mt-1 text-sm font-semibold text-cyan-100">
					{{ inventorySummaryLabel }}
				</p>
			</div>
			<UButton
				color="warning"
				variant="soft"
				size="sm"
				:disabled="!hasInventory"
				@click="$emit('sell-all')"
			>
				{{ sellAllLabel }}
			</UButton>
		</div>

		<UTable
			v-if="hasInventory"
			:data="inventoryRows"
			:columns="inventoryColumns"
			:ui="inventoryTableUi"
			sticky="header"
			class="inventory-table max-h-72"
		>
			<template #name-cell="{ row }">
				<div class="inventory-cell inventory-cell-item">
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
					class="inventory-cell inventory-cell-rarity loot-popup-item-rarity"
					:class="getLootRarityClass(row.original.rarity)"
				>
					{{ lootRarityLabels[row.original.rarity] }}
				</span>
			</template>

			<template #appearance-cell="{ row }">
				<span class="inventory-cell inventory-cell-appearance">
					{{ formatLootAppearance(row.original.appearance) }}
				</span>
			</template>
		</UTable>

		<div v-else class="inventory-empty section-text-outline">
			<p>Your bags are empty.</p>
			<p>Claim loot from the chest after a victory to fill this panel.</p>
		</div>
	</div>
</template>

<style scoped>
.section-text-outline {
	text-shadow:
		-1px -1px 0 rgba(0, 0, 0, 0.88),
		1px -1px 0 rgba(0, 0, 0, 0.88),
		-1px 1px 0 rgba(0, 0, 0, 0.88),
		1px 1px 0 rgba(0, 0, 0, 0.88),
		0 2px 8px rgba(0, 0, 0, 0.5);
}

.inventory-panel {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.inventory-panel-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 1rem;
}

.inventory-cell {
	min-width: 0;
}

.inventory-cell-item {
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
}

.inventory-item-name {
	font-size: 0.95rem;
	font-weight: 700;
	color: #fff7ed;
}

.inventory-item-meta {
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: rgba(226, 232, 240, 0.72);
}

.inventory-cell-qty,
.inventory-cell-appearance,
.inventory-cell-value {
	font-size: 0.88rem;
	font-weight: 700;
	color: rgba(255, 255, 255, 0.9);
}

.inventory-cell-rarity {
	min-width: 0;
}

.inventory-empty {
	display: grid;
	gap: 0.3rem;
	padding: 1rem;
	border: 1px dashed rgba(255, 255, 255, 0.18);
	border-radius: 0.9rem;
	background: rgba(255, 255, 255, 0.03);
	font-size: 0.82rem;
	color: rgba(255, 255, 255, 0.78);
}

.loot-popup-item-rarity {
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
</style>
