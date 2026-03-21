import { type BattleRoom, type PeerLike, PLAYER_MAX_HEALTH } from "./types";

function createBattleRoom(): BattleRoom {
	return {
		peersByPlayerId: new Map<string, PeerLike>(),
		playerIdByPeer: new Map<PeerLike, string>(),
		hunters: new Map(),
		disconnectCleanupTimers: new Map(),
		currentMonster: null,
		monsterHealth: 0,
		logs: [],
		logSequence: 0,
		isAwaitingMonsterAttack: false,
		battleEnded: false,
		monsterAttackCount: 0,
		monsterDamagedCount: 0,
		monsterHealedCount: 0,
		monsterBurnRounds: 0,
		turnHunterId: null,
		monsterTurnTimer: null,
	};
}

declare global {
	var __monsterHunterBattleRoom: BattleRoom | undefined;
}

export function getBattleRoom() {
	if (!globalThis.__monsterHunterBattleRoom) {
		globalThis.__monsterHunterBattleRoom = createBattleRoom();
	}

	return globalThis.__monsterHunterBattleRoom;
}

export function createDefaultHunter(
	playerId: string,
	role: "hunter" | "spectator",
) {
	return {
		id: playerId,
		name: "Hunter",
		role,
		connected: true,
		level: 1,
		experience: 0,
		health: PLAYER_MAX_HEALTH,
		maxHealth: PLAYER_MAX_HEALTH,
		joinedAt: Date.now(),
		attackCount: 0,
		damagedCount: 0,
		levelUpCount: 0,
	};
}
