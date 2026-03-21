import type {
	AbilityHunterState,
	AbilityExecutionResult,
	AbilityMonsterState,
	AbilityRoomState,
	AuraBeamAbilityContext,
} from "../../../types/abilities";

const AURA_BEAM_DAMAGE_MULTIPLIER = 1.5;

export class AuraBeamAbility {
	readonly action = "auraBeam" as const;

	execute<
		TRoom extends AbilityRoomState,
		THunter extends AbilityHunterState,
		TMonster extends AbilityMonsterState,
	>(
		context: AuraBeamAbilityContext<TRoom, THunter, TMonster>,
	): AbilityExecutionResult {
		const didHit = context.random() < context.successChance / 100;
		const playerDamage = Math.round(
			context.rollBasePlayerDamage(
				context.hunter.level,
				context.monster.level,
			) * AURA_BEAM_DAMAGE_MULTIPLIER,
		);

		if (didHit) {
			context.room.monsterHealth = Math.max(
				0,
				context.room.monsterHealth - playerDamage,
			);
			context.room.monsterDamagedCount += 1;

			if (context.room.monsterHealth === 0) {
				context.addBattleLogEntry(
					context.room,
					`${context.hunter.name} defeated Lv. ${context.monster.level} ${context.monster.name} and earned ${context.monster.reward}.`,
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
				`${context.hunter.name} used Aura Beam on ${context.monster.name} for ${playerDamage}.`,
				"hunter",
			);
		} else {
			context.addBattleLogEntry(
				context.room,
				`${context.hunter.name} used Aura Beam, but missed ${context.monster.name}.`,
				"hunter",
			);
		}

		context.setNextTurnOrMonster(context.room, context.hunter.id);

		return {
			consumedTurn: true,
			battleEnded: false,
		};
	}
}
