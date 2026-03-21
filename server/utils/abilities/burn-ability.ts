import type {
	AbilityHunterState,
	AbilityMonsterState,
	AbilityRoomState,
	AbilityExecutionResult,
	BurnAbilityContext,
	BurnEffectContext,
	StatusEffectResult,
} from "~~/types/abilities";

const BURN_ROUNDS = 3;
const BURN_MIN_PERCENT = 3;
const BURN_MAX_PERCENT = 5;

export class BurnAbility {
	readonly action = "burn" as const;

	execute<
		TRoom extends AbilityRoomState,
		THunter extends AbilityHunterState,
		TMonster extends AbilityMonsterState,
	>(
		context: BurnAbilityContext<TRoom, THunter, TMonster>,
	): AbilityExecutionResult {
		const didHit = context.random() < context.successChance / 100;

		if (didHit) {
			context.room.monsterBurnRounds = BURN_ROUNDS;
			context.addBattleLogEntry(
				context.room,
				`${context.hunter.name} ignited ${context.monster.name}. BURN will last ${BURN_ROUNDS} rounds.`,
				"hunter",
			);
		} else {
			context.addBattleLogEntry(
				context.room,
				`${context.hunter.name} tried to ignite ${context.monster.name}, but the burn failed.`,
				"hunter",
			);
		}

		context.setNextTurnOrMonster(context.room, context.hunter.id);

		return {
			consumedTurn: true,
			battleEnded: false,
		};
	}

	applyRoundEffect<
		TRoom extends AbilityRoomState,
		TMonster extends AbilityMonsterState,
	>(
		context: BurnEffectContext<TRoom, TMonster>,
	): StatusEffectResult {
		if (context.room.monsterBurnRounds <= 0) {
			return {
				triggered: false,
				battleEnded: false,
			};
		}

		const burnPercent = context.randomIntInclusive(
			BURN_MIN_PERCENT,
			BURN_MAX_PERCENT,
		);
		const burnDamage = Math.max(
			1,
			Math.round((context.monster.health * burnPercent) / 100),
		);

		context.room.monsterHealth = Math.max(
			0,
			context.room.monsterHealth - burnDamage,
		);
		context.room.monsterDamagedCount += 1;
		context.room.monsterBurnRounds -= 1;
		context.addBattleLogEntry(
			context.room,
			`${context.monster.name} takes ${burnDamage} burn damage (${burnPercent}%).`,
			"system",
		);

		if (context.room.monsterHealth === 0) {
			context.addBattleLogEntry(
				context.room,
				`${context.monster.name} was defeated by burn and dropped ${context.monster.reward}.`,
				"system",
			);
			context.awardExperienceToHunters(
				context.room,
				context.monster.experienceReward,
			);
			context.room.battleEnded = true;
			context.room.turnHunterId = null;
			context.room.isAwaitingMonsterAttack = false;
			context.room.monsterBurnRounds = 0;

			return {
				triggered: true,
				battleEnded: true,
			};
		}

		if (context.room.monsterBurnRounds === 0) {
			context.addBattleLogEntry(
				context.room,
				`${context.monster.name} is no longer burning.`,
				"system",
			);
		}

		return {
			triggered: true,
			battleEnded: false,
		};
	}
}
