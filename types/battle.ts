export type Monster = {
	id: number;
	name: string;
	health: number;
	experience: number;
	weaknesses: string[];
	strenghts: string[];
	abilities?: Array<{
		name: "heal";
		chance: number;
	}>;
	reward: string;
	level: number;
	baseHealth: number;
	baseExperience: number;
	retaliationMinDamage: number;
	retaliationDamageRange: number;
	experienceReward: number;
};

export type BattleLogEntry = {
	id: number;
	message: string;
	source: "hunter" | "monster" | "system";
};

export type HunterRole = "hunter" | "spectator";

export type BattleHunterState = {
	id: string;
	name: string;
	role: HunterRole;
	connected: boolean;
	level: number;
	experience: number;
	health: number;
	maxHealth: number;
	joinedAt: number;
	attackCount: number;
	damagedCount: number;
	levelUpCount: number;
};

export type BattleStateMessage = {
	type: "state";
	state: {
		monster: Monster | null;
		monsterHealth: number;
		logs: BattleLogEntry[];
		isAwaitingMonsterAttack: boolean;
		battleEnded: boolean;
		monsterAttackCount: number;
		monsterDamagedCount: number;
		monsterHealedCount: number;
		turnHunterId: string | null;
		maxHunters: number;
		hunters: BattleHunterState[];
	};
};

export type PongMessage = {
	type: "pong";
};

export type ConnectionStatus = "connecting" | "connected" | "disconnected";
