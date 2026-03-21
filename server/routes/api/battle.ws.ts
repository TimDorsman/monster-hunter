import {
	handleBattlePeerClose,
	handleBattlePeerMessage,
	handleBattlePeerOpen,
} from "../../utils/battle/messages";
import { getBattleRoom } from "../../utils/battle/room-state";

export default defineWebSocketHandler({
	open(peer) {
		const room = getBattleRoom();
		handleBattlePeerOpen(room, peer);
	},
	async message(peer, message) {
		const room = getBattleRoom();
		await handleBattlePeerMessage(room, peer, message);
	},
	close(peer) {
		const room = getBattleRoom();
		handleBattlePeerClose(room, peer);
	},
});
