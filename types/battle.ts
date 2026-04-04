import type { BattleGameSettings } from "~~/types/game-settings";
import type { BattleReward, LootTableEntry } from "~~/types/loot";
import type { ShopStatePayload } from "~~/types/shop";

export type Monster = {
	id: number;
	name: string;
	health: number;
	experience: number;
	weaknesses: string[];
	strenghts: string[];
	abilities?: Array<{
		name: "attack" | "heal";
		chance: number;
	}>;
	lootTable: LootTableEntry[];
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

export type BattleLogEventType = "ability";

export type BattleLogAction = "attack" | "auraBeam" | "heal" | "burn";

export type BattleLogMetadata = {
	eventType: BattleLogEventType;
	action: BattleLogAction;
};

export type BattleLogEntry = {
	id: number;
	message: string;
	source: "hunter" | "monster" | "system";
	metadata?: BattleLogMetadata;
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
		monsterBurnRounds: number;
		turnHunterId: string | null;
		maxHunters: number;
		hunters: BattleHunterState[];
		settings: BattleGameSettings;
		resolvedReward: BattleReward | null;
		shop: ShopStatePayload;
	};
};

export type PongMessage = {
	type: "pong";
};

export type ConnectionStatus = "connecting" | "connected" | "disconnected";
