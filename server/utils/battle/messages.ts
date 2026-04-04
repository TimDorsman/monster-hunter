import { pickNewMonster } from "./monster-factory";
import { createDefaultHunter } from "./room-state";
import { applyBattleGameSettings } from "./settings";
import {
	type BattleRoom,
	type ClientMessage,
	type PeerLike,
	MAX_HUNTERS,
} from "./types";
import {
	addBattleLogEntry,
	broadcastState,
	getActiveHunters,
	getAliveHunters,
	promoteSpectatorsIfSlots,
	syncTurnToFirstActiveHunter,
} from "./room-utils";
import { handlePlayerAction } from "./combat";

async function parseTextMessage(message: unknown) {
	if (typeof message === "string") {
		return message;
	}
	if (message instanceof Uint8Array) {
		return new TextDecoder().decode(message);
	}
	if (message instanceof ArrayBuffer) {
		return new TextDecoder().decode(new Uint8Array(message));
	}
	if (
		message &&
		typeof message === "object" &&
		"text" in message &&
		typeof (message as { text: unknown }).text === "function"
	) {
		try {
			const nextText = (
				message as { text: () => string | Promise<string> }
			).text();
			if (typeof nextText === "string") {
				return nextText;
			}
			return await nextText;
		} catch {
			return "";
		}
	}
	return "";
}

function addPeerToPlayer(room: BattleRoom, playerId: string, peer: PeerLike) {
	const existingPeers = room.peersByPlayerId.get(playerId);
	if (existingPeers) {
		existingPeers.add(peer);
		return;
	}

	room.peersByPlayerId.set(playerId, new Set([peer]));
}

function removePeerFromPlayer(
	room: BattleRoom,
	playerId: string,
	peer: PeerLike,
) {
	const existingPeers = room.peersByPlayerId.get(playerId);
	if (!existingPeers) {
		return;
	}

	existingPeers.delete(peer);
	if (existingPeers.size > 0) {
		return;
	}

	room.peersByPlayerId.delete(playerId);
}

export function handleBattlePeerOpen(room: BattleRoom, peer: PeerLike) {
	const generatedPlayerId = `peer-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
	const activeCount = getActiveHunters(room).length;
	const role = activeCount < MAX_HUNTERS ? "hunter" : "spectator";

	room.playerIdByPeer.set(peer, generatedPlayerId);
	addPeerToPlayer(room, generatedPlayerId, peer);
	room.hunters.set(
		generatedPlayerId,
		createDefaultHunter(generatedPlayerId, role, room.settings.hunter.maxHealth),
	);

	if (!room.currentMonster) {
		pickNewMonster(room);
	}

	broadcastState(room);
}

export function handleBattlePeerClose(room: BattleRoom, peer: PeerLike) {
	const playerId = room.playerIdByPeer.get(peer);
	if (!playerId) {
		return;
	}

	room.playerIdByPeer.delete(peer);
	removePeerFromPlayer(room, playerId, peer);
	const hunter = room.hunters.get(playerId);

	if (!hunter) {
		return;
	}

	if ((room.peersByPlayerId.get(playerId)?.size ?? 0) > 0) {
		broadcastState(room);
		return;
	}

	hunter.connected = false;
	if (playerId.startsWith("peer-")) {
		room.hunters.delete(playerId);
		promoteSpectatorsIfSlots(room);
	} else {
		const existingCleanupTimer = room.disconnectCleanupTimers.get(playerId);
		if (existingCleanupTimer) {
			clearTimeout(existingCleanupTimer);
		}

		const cleanupTimer = setTimeout(() => {
			const staleHunter = room.hunters.get(playerId);
			if (!staleHunter || staleHunter.connected) {
				return;
			}

			room.hunters.delete(playerId);
			room.disconnectCleanupTimers.delete(playerId);
			promoteSpectatorsIfSlots(room);
			syncTurnToFirstActiveHunter(room, getActiveHunters(room));
			broadcastState(room);
		}, 60_000);

		room.disconnectCleanupTimers.set(playerId, cleanupTimer);
	}

	syncTurnToFirstActiveHunter(room, getActiveHunters(room));
	broadcastState(room);
}

function handleJoinMessage(
	room: BattleRoom,
	peer: PeerLike,
	parsedMessage: Extract<ClientMessage, { type: "join" }>,
) {
	const playerId = parsedMessage.playerId;
	const existingPeerPlayerId = room.playerIdByPeer.get(peer);
	const existing = room.hunters.get(playerId);

	if (existingPeerPlayerId && existingPeerPlayerId !== playerId) {
		const generatedHunter = room.hunters.get(existingPeerPlayerId);
		removePeerFromPlayer(room, existingPeerPlayerId, peer);
		room.hunters.delete(existingPeerPlayerId);
		if (room.turnHunterId === existingPeerPlayerId) {
			room.turnHunterId = playerId;
		}

		if (generatedHunter && !existing) {
			generatedHunter.id = playerId;
			room.hunters.set(playerId, generatedHunter);
		}
	}

	room.playerIdByPeer.set(peer, playerId);
	addPeerToPlayer(room, playerId, peer);

	const upserted = room.hunters.get(playerId);
	const nextLevel = Math.max(1, Math.floor(parsedMessage.level));
	const nextExperience = Math.max(0, Math.floor(parsedMessage.experience));
	const cleanupTimer = room.disconnectCleanupTimers.get(playerId);
	if (cleanupTimer) {
		clearTimeout(cleanupTimer);
		room.disconnectCleanupTimers.delete(playerId);
	}
	if (existing) {
		existing.name = parsedMessage.name;
		existing.level = nextLevel;
		existing.experience = nextExperience;
		existing.connected = true;
	} else if (upserted) {
		upserted.name = parsedMessage.name;
		upserted.level = nextLevel;
		upserted.experience = nextExperience;
		upserted.connected = true;
	} else {
		const activeCount = getActiveHunters(room).length;
		const role = activeCount < MAX_HUNTERS ? "hunter" : "spectator";
		room.hunters.set(playerId, {
			id: playerId,
			name: parsedMessage.name,
			role,
			connected: true,
			level: nextLevel,
			experience: nextExperience,
			health: room.settings.hunter.maxHealth,
			maxHealth: room.settings.hunter.maxHealth,
			joinedAt: Date.now(),
			attackCount: 0,
			damagedCount: 0,
			levelUpCount: 0,
		});
		if (role === "spectator") {
			addBattleLogEntry(
				room,
				`${parsedMessage.name} joined as spectator (room is full).`,
				"system",
			);
		} else {
			addBattleLogEntry(
				room,
				`${parsedMessage.name} joined the battle.`,
				"system",
			);
		}
	}

	if (!room.battleEnded && room.currentMonster && !room.isAwaitingMonsterAttack) {
		const aliveHunters = getAliveHunters(room);
		if (aliveHunters.length > 0 && !room.turnHunterId) {
			room.turnHunterId = aliveHunters[0].id;
		}
	}

	if (!room.currentMonster) {
		pickNewMonster(room);
	}

	broadcastState(room);
}

export async function handleBattlePeerMessage(
	room: BattleRoom,
	peer: PeerLike,
	rawMessage: unknown,
) {
	const text = await parseTextMessage(rawMessage);
	if (!text) {
		return;
	}

	let parsedMessage: ClientMessage;
	try {
		parsedMessage = JSON.parse(text) as ClientMessage;
	} catch {
		return;
	}

	if (parsedMessage.type === "join") {
		handleJoinMessage(room, peer, parsedMessage);
		return;
	}

	const playerId = room.playerIdByPeer.get(peer);
	if (!playerId) {
		return;
	}

	if (parsedMessage.type === "ping") {
		peer.send(JSON.stringify({ type: "pong" }));
		return;
	}

	if (parsedMessage.type === "action") {
		handlePlayerAction(room, playerId, parsedMessage.action);
		broadcastState(room);
		return;
	}

	if (parsedMessage.type === "new_monster") {
		const hunter = room.hunters.get(playerId);
		if (!hunter || hunter.role !== "hunter") {
			return;
		}
		pickNewMonster(room);
		broadcastState(room);
		return;
	}

	if (parsedMessage.type === "update_settings") {
		applyBattleGameSettings(room, parsedMessage.settings);
		broadcastState(room);
	}
}
