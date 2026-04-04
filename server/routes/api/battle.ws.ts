import {
	handleBattlePeerClose,
	handleBattlePeerMessage,
	handleBattlePeerOpen,
} from "~~/server/utils/battle/messages";
import { getBattleRoom } from "~~/server/utils/battle/room-state";
import { broadcastState } from "~~/server/utils/battle/room-utils";
import { scheduleShopRefresh } from "~~/server/utils/battle/shop";

const room = getBattleRoom();
scheduleShopRefresh(room, () => {
	broadcastState(room);
});

export default defineWebSocketHandler({
	open(peer) {
		handleBattlePeerOpen(room, peer);
	},
	async message(peer, message) {
		await handleBattlePeerMessage(room, peer, message);
	},
	close(peer) {
		handleBattlePeerClose(room, peer);
	},
});
