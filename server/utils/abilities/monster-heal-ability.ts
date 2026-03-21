import type {
	AbilityExecutionResult,
	AbilityMonsterState,
	AbilityRoomState,
	MonsterHealAbilityContext,
} from "../../../types/abilities";

export class MonsterHealAbility {
	readonly action = "heal" as const;

	getHealChance<TMonster extends Pick<AbilityMonsterState, "abilities">>(
		monster: TMonster,
	): number {
		return (
			monster.abilities?.find((ability) => ability.name === "heal")?.chance ?? 0
		);
	}

	shouldExecute<
		TMonster extends Pick<AbilityMonsterState, "abilities" | "health">,
	>(
		monster: TMonster,
		currentHealth: number,
		random: () => number,
	): boolean {
		const chance = this.getHealChance(monster);

		if (!chance) {
			return false;
		}
		if (currentHealth >= monster.health) {
			return false;
		}

		const missingHealthRatio = (monster.health - currentHealth) / monster.health;
		if (missingHealthRatio < 0.2) {
			return false;
		}

		return random() < chance / 100;
	}

	execute<
		TRoom extends AbilityRoomState,
		TMonster extends AbilityMonsterState,
	>(
		context: MonsterHealAbilityContext<TRoom, TMonster>,
	): AbilityExecutionResult {
		const healAmount = context.rollMonsterHealAmount();
		const beforeHeal = context.room.monsterHealth;
		context.room.monsterHealth = Math.min(
			context.monster.health,
			context.room.monsterHealth + healAmount,
		);
		const actualHeal = context.room.monsterHealth - beforeHeal;

		if (actualHeal > 0) {
			context.room.monsterHealedCount += 1;
		}

		context.addBattleLogEntry(
			context.room,
			`${context.monster.name} used Heal and recovered ${actualHeal} HP.`,
			"monster",
		);

		return {
			consumedTurn: true,
			battleEnded: false,
		};
	}
}
