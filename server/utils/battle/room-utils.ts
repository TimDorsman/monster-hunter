import {
	type BattleLogMetadata,
	type BattleRoom,
	type BattleStatePayload,
	type HunterState,
	type LogSource,
	MAX_HUNTERS,
} from "./types";

export function getActiveHunters(room: BattleRoom) {
	return Array.from(room.hunters.values())
		.filter((hunter) => hunter.role === "hunter")
		.sort((a, b) => a.joinedAt - b.joinedAt);
}

export function getAliveHunters(room: BattleRoom) {
	return getActiveHunters(room).filter((hunter) => hunter.health > 0);
}

export function addBattleLogEntry(
	room: BattleRoom,
	message: string,
	source: LogSource = "system",
	metadata?: BattleLogMetadata,
) {
	room.logSequence += 1;
	room.logs.push({
		id: room.logSequence,
		message,
		source,
		metadata,
	});
	if (room.logs.length > 40) {
		room.logs = room.logs.slice(-40);
	}
}

export function buildStatePayload(room: BattleRoom): BattleStatePayload {
	return {
		type: "state",
		state: {
			monster: room.currentMonster,
			monsterHealth: room.monsterHealth,
			logs: room.logs.slice(-12),
			isAwaitingMonsterAttack: room.isAwaitingMonsterAttack,
			battleEnded: room.battleEnded,
			monsterAttackCount: room.monsterAttackCount,
			monsterDamagedCount: room.monsterDamagedCount,
			monsterHealedCount: room.monsterHealedCount,
			monsterBurnRounds: room.monsterBurnRounds,
			turnHunterId: room.turnHunterId,
			maxHunters: MAX_HUNTERS,
			settings: room.settings,
			resolvedReward: room.resolvedReward,
			hunters: Array.from(room.hunters.values()).sort(
				(a, b) => a.joinedAt - b.joinedAt,
			),
		},
	};
}

export function broadcastState(room: BattleRoom) {
	const payload = JSON.stringify(buildStatePayload(room));
	for (const peer of room.peersByPlayerId.values()) {
		peer.send(payload);
	}
}

export function promoteSpectatorsIfSlots(room: BattleRoom) {
	const activeHunters = getActiveHunters(room);
	if (activeHunters.length >= MAX_HUNTERS) {
		return;
	}

	const spectators = Array.from(room.hunters.values())
		.filter((hunter) => hunter.role === "spectator")
		.sort((a, b) => a.joinedAt - b.joinedAt);
	for (const spectator of spectators) {
		if (getActiveHunters(room).length >= MAX_HUNTERS) {
			break;
		}
		spectator.role = "hunter";
		spectator.health = spectator.maxHealth;
		addBattleLogEntry(
			room,
			`${spectator.name} joined as an active hunter.`,
			"system",
		);
	}
}

export function syncTurnToFirstActiveHunter(room: BattleRoom, hunters: HunterState[]) {
	if (hunters.length === 0) {
		room.turnHunterId = null;
		room.isAwaitingMonsterAttack = false;
		return;
	}

	if (
		room.turnHunterId &&
		hunters.some((hunter) => hunter.id === room.turnHunterId)
	) {
		return;
	}

	room.turnHunterId = hunters[0].id;
}
