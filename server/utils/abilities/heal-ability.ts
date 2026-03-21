import type {
	AbilityHunterState,
	AbilityExecutionResult,
	AbilityMonsterState,
	AbilityRoomState,
	HealAbilityContext,
} from "../../../types/abilities";

export class HealAbility {
	readonly action = "heal" as const;

	execute<
		TRoom extends AbilityRoomState,
		THunter extends AbilityHunterState,
		TMonster extends AbilityMonsterState,
	>(
		context: HealAbilityContext<TRoom, THunter, TMonster>,
	): AbilityExecutionResult {
		if (context.hunter.health >= context.hunter.maxHealth) {
			context.addBattleLogEntry(
				context.room,
				`${context.hunter.name} is already at full HP.`,
				"system",
			);

			return {
				consumedTurn: false,
				battleEnded: false,
			};
		}

		const didHeal = context.random() < context.successChance / 100;
		if (!didHeal) {
			context.addBattleLogEntry(
				context.room,
				`${context.hunter.name} tried to heal, but the spell missed.`,
				"hunter",
			);
			context.setNextTurnOrMonster(context.room, context.hunter.id);

			return {
				consumedTurn: true,
				battleEnded: false,
			};
		}

		const healAmount = context.rollPlayerHealAmount(context.hunter.level);
		const beforeHeal = context.hunter.health;
		context.hunter.health = Math.min(
			context.hunter.maxHealth,
			context.hunter.health + healAmount,
		);
		const actualHeal = context.hunter.health - beforeHeal;

		context.addBattleLogEntry(
			context.room,
			`${context.hunter.name} healed for ${actualHeal} HP.`,
			"hunter",
		);
		context.setNextTurnOrMonster(context.room, context.hunter.id);

		return {
			consumedTurn: true,
			battleEnded: false,
		};
	}
}
