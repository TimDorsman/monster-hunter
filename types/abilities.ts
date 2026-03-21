import type { MonsterAbilityName } from "../utils/battle-abilities";

export type HunterAbilityAction = "auraBeam" | "heal" | "burn";

export type BattleAction = "attack" | HunterAbilityAction;

export type AbilityLogSource = "hunter" | "monster" | "system";

export interface AbilityRoomState {
	monsterHealth: number;
	monsterDamagedCount: number;
	monsterHealedCount: number;
	monsterBurnRounds: number;
	battleEnded: boolean;
	isAwaitingMonsterAttack: boolean;
	turnHunterId: string | null;
}

export interface AbilityHunterState {
	id: string;
	name: string;
	level: number;
	health: number;
	maxHealth: number;
}

export interface AbilityMonsterState {
	name: string;
	level: number;
	reward: string;
	experienceReward: number;
	health: number;
	abilities?: Array<{
		name: MonsterAbilityName;
		chance: number;
	}>;
}

export interface AbilityContext<
	TRoom extends AbilityRoomState = AbilityRoomState,
	THunter extends AbilityHunterState = AbilityHunterState,
	TMonster extends AbilityMonsterState = AbilityMonsterState,
> {
	room: TRoom;
	hunter: THunter;
	monster: TMonster;
	addBattleLogEntry: (
		room: TRoom,
		message: string,
		source?: AbilityLogSource,
	) => void;
	setNextTurnOrMonster: (room: TRoom, hunterId: string) => void;
	awardExperienceToHunters: (room: TRoom, baseExperience: number) => void;
}

export interface AuraBeamAbilityContext<
	TRoom extends AbilityRoomState = AbilityRoomState,
	THunter extends AbilityHunterState = AbilityHunterState,
	TMonster extends AbilityMonsterState = AbilityMonsterState,
> extends AbilityContext<TRoom, THunter, TMonster> {
	successChance: number;
	rollBasePlayerDamage: (
		hunterLevel: number,
		monsterLevel: number,
	) => number;
	random: () => number;
}

export interface AttackAbilityContext<
	TRoom extends AbilityRoomState = AbilityRoomState,
	THunter extends AbilityHunterState = AbilityHunterState,
	TMonster extends AbilityMonsterState = AbilityMonsterState,
> extends AbilityContext<TRoom, THunter, TMonster> {
	successChance: number;
	rollBasePlayerDamage: (
		hunterLevel: number,
		monsterLevel: number,
	) => number;
	random: () => number;
}

export interface HealAbilityContext<
	TRoom extends AbilityRoomState = AbilityRoomState,
	THunter extends AbilityHunterState = AbilityHunterState,
	TMonster extends AbilityMonsterState = AbilityMonsterState,
> extends AbilityContext<TRoom, THunter, TMonster> {
	successChance: number;
	rollPlayerHealAmount: (level: number) => number;
	random: () => number;
}

export interface MonsterHealAbilityContext<
	TRoom extends AbilityRoomState = AbilityRoomState,
	TMonster extends AbilityMonsterState = AbilityMonsterState,
> {
	room: TRoom;
	monster: TMonster;
	addBattleLogEntry: (
		room: TRoom,
		message: string,
		source?: AbilityLogSource,
	) => void;
	rollMonsterHealAmount: () => number;
}

export interface BurnAbilityContext<
	TRoom extends AbilityRoomState = AbilityRoomState,
	THunter extends AbilityHunterState = AbilityHunterState,
	TMonster extends AbilityMonsterState = AbilityMonsterState,
> extends AbilityContext<TRoom, THunter, TMonster> {
	successChance: number;
	random: () => number;
}

export interface BurnEffectContext<
	TRoom extends AbilityRoomState = AbilityRoomState,
	TMonster extends AbilityMonsterState = AbilityMonsterState,
> {
	room: TRoom;
	monster: TMonster;
	addBattleLogEntry: (
		room: TRoom,
		message: string,
		source?: AbilityLogSource,
	) => void;
	awardExperienceToHunters: (room: TRoom, baseExperience: number) => void;
	randomIntInclusive: (min: number, max: number) => number;
}

export interface AbilityExecutionResult {
	consumedTurn: boolean;
	battleEnded: boolean;
}

export interface StatusEffectResult {
	triggered: boolean;
	battleEnded: boolean;
}
