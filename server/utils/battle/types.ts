import type { BattleAction } from "~~/types/abilities";
import type { BattleGameSettings } from "~~/types/game-settings";
import type { MonsterAbilityName } from "~~/utils/battle-abilities";

export type ElementType =
	| "normal"
	| "fire"
	| "water"
	| "electric"
	| "grass"
	| "ice"
	| "fighting"
	| "poison"
	| "ground"
	| "flying"
	| "psychic"
	| "bug"
	| "rock"
	| "ghost"
	| "dragon"
	| "dark"
	| "steel"
	| "fairy";

export type Monster = {
	id: number;
	name: string;
	health: number;
	experience: number;
	weaknesses: ElementType[];
	strenghts: ElementType[];
	abilities?: Array<{
		name: MonsterAbilityName;
		chance: number;
	}>;
	reward: string;
};

export type EncounterMonster = Monster & {
	level: number;
	baseHealth: number;
	baseExperience: number;
	defaultHealth: number;
	retaliationMinDamage: number;
	retaliationDamageRange: number;
	defaultRetaliationMinDamage: number;
	defaultRetaliationDamageRange: number;
	defaultAttackChance: number;
	defaultHealChance: number;
	experienceReward: number;
};

export type LogSource = "hunter" | "monster" | "system";

export type BattleLogEventType = "ability";

export type BattleLogAction = "attack" | "auraBeam" | "heal" | "burn";

export type BattleLogMetadata = {
	eventType: BattleLogEventType;
	action: BattleLogAction;
};

export type BattleLogEntry = {
	id: number;
	message: string;
	source: LogSource;
	metadata?: BattleLogMetadata;
};

export type HunterRole = "hunter" | "spectator";

export type HunterState = {
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

export type ClientMessage =
	| {
			type: "join";
			playerId: string;
			name: string;
			level: number;
			experience: number;
	  }
	| {
			type: "ping";
	  }
	| {
			type: "action";
			action: BattleAction;
	  }
	| {
			type: "new_monster";
	  }
	| {
			type: "update_settings";
			settings: BattleGameSettings;
	  };

export type BattleStatePayload = {
	type: "state";
	state: {
		monster: EncounterMonster | null;
		monsterHealth: number;
		logs: BattleLogEntry[];
		isAwaitingMonsterAttack: boolean;
		battleEnded: boolean;
		monsterAttackCount: number;
		monsterDamagedCount: number;
		monsterHealedCount: number;
		monsterBurnRounds: number;
		turnHunterId: string | null;
		maxHunters: number;
		hunters: HunterState[];
		settings: BattleGameSettings;
	};
};

export type PeerLike = {
	send: (payload: string) => void;
};

export type BattleRoom = {
	peersByPlayerId: Map<string, PeerLike>;
	playerIdByPeer: Map<PeerLike, string>;
	hunters: Map<string, HunterState>;
	disconnectCleanupTimers: Map<string, ReturnType<typeof setTimeout>>;
	currentMonster: EncounterMonster | null;
	monsterHealth: number;
	logs: BattleLogEntry[];
	logSequence: number;
	isAwaitingMonsterAttack: boolean;
	battleEnded: boolean;
	monsterAttackCount: number;
	monsterDamagedCount: number;
	monsterHealedCount: number;
	monsterBurnRounds: number;
	turnHunterId: string | null;
	monsterTurnTimer: ReturnType<typeof setTimeout> | null;
	settings: BattleGameSettings;
};

export const MAX_HUNTERS = 4;
export const MONSTER_HEAL_MIN = 10;
export const MONSTER_HEAL_RANGE = 11;
