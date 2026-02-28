import {
	getBattleRoom,
	handleBattlePeerClose,
	handleBattlePeerMessage,
	handleBattlePeerOpen,
} from "../../utils/battleRoom";

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
