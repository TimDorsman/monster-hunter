import type {
	AbilityHunterState,
	AbilityExecutionResult,
	AbilityMonsterState,
	AbilityRoomState,
	AttackAbilityContext,
} from "~~/types/abilities";
import { formatBattleRewardSummary } from "~~/utils/loot";

export class AttackAbility {
	readonly action = "attack" as const;

	execute<
		TRoom extends AbilityRoomState,
		THunter extends AbilityHunterState,
		TMonster extends AbilityMonsterState,
	>(
		context: AttackAbilityContext<TRoom, THunter, TMonster>,
	): AbilityExecutionResult {
		const didHit = context.random() < context.successChance / 100;
		if (!didHit) {
			context.addBattleLogEntry(
				context.room,
				`${context.hunter.name} attacked ${context.monster.name}, but missed.`,
				"hunter",
			);
			context.setNextTurnOrMonster(context.room, context.hunter.id);

			return {
				consumedTurn: true,
				battleEnded: false,
			};
		}

		const playerDamage = context.rollBasePlayerDamage(
			context.hunter.level,
			context.monster.level,
		);
		context.room.monsterHealth = Math.max(
			0,
			context.room.monsterHealth - playerDamage,
		);
		context.room.monsterDamagedCount += 1;

		if (context.room.monsterHealth === 0) {
			const reward = context.resolveBattleReward(
				context.room,
				context.monster,
			);
			context.addBattleLogEntry(
				context.room,
				`${context.hunter.name} defeated Lv. ${context.monster.level} ${context.monster.name} and earned ${formatBattleRewardSummary(reward)}.`,
				"hunter",
			);
			context.awardExperienceToHunters(
				context.room,
				context.monster.experienceReward,
			);
			context.room.battleEnded = true;
			context.room.turnHunterId = null;
			context.room.isAwaitingMonsterAttack = false;

			return {
				consumedTurn: true,
				battleEnded: true,
			};
		}

		context.addBattleLogEntry(
			context.room,
			`${context.hunter.name} hit ${context.monster.name} for ${playerDamage}.`,
			"hunter",
		);
		context.setNextTurnOrMonster(context.room, context.hunter.id);

		return {
			consumedTurn: true,
			battleEnded: false,
		};
	}
}
