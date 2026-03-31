import { createInitialBattleGameSettings } from "./settings";
import { type BattleRoom, type PeerLike } from "./types";

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
		settings: createInitialBattleGameSettings(),
		resolvedReward: null,
		rewardSequence: 0,
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
	maxHealth: number,
) {
	return {
		id: playerId,
		name: "Hunter",
		role,
		connected: true,
		level: 1,
		experience: 0,
		health: maxHealth,
		maxHealth,
		joinedAt: Date.now(),
		attackCount: 0,
		damagedCount: 0,
		levelUpCount: 0,
	};
}
