import type { BattleRoom } from "./types";
import type { ShopStatePayload } from "~~/types/shop";
import {
	createShopRotationState,
	getShopCatalog,
	resolveShopRotationState,
} from "~~/utils/shop";

function getServerShopCatalogItemIds() {
	return getShopCatalog().map((itemDefinition) => itemDefinition.id);
}

function getMillisecondsUntilRefresh(nextRefreshAt: number) {
	return Math.max(0, nextRefreshAt - Date.now());
}

export function createInitialShopRotationState(now = Date.now()) {
	return createShopRotationState(getServerShopCatalogItemIds(), now);
}

export function syncRoomShopRotationState(room: BattleRoom, now = Date.now()) {
	room.shopRotationState = resolveShopRotationState(
		room.shopRotationState,
		getServerShopCatalogItemIds(),
		now,
	);
}

export function buildShopStatePayload(room: BattleRoom): ShopStatePayload {
	return {
		stockItemIds: [...room.shopRotationState.stockItemIds],
		nextRefreshAt: room.shopRotationState.nextRefreshAt,
	};
}

export function scheduleShopRefresh(room: BattleRoom, onRefresh: () => void) {
	if (room.shopRefreshTimer) {
		clearTimeout(room.shopRefreshTimer);
	}

	const refreshDelay = getMillisecondsUntilRefresh(
		room.shopRotationState.nextRefreshAt,
	);

	room.shopRefreshTimer = setTimeout(() => {
		syncRoomShopRotationState(room, Date.now());
		onRefresh();
		scheduleShopRefresh(room, onRefresh);
	}, refreshDelay);
}
