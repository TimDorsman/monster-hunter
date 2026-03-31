import type { BattleReward } from "~~/types/loot";
import {
	calculateBattleRewardGold,
	resolveLootTableDrops,
} from "~~/utils/loot";
import { getAliveHunters } from "./room-utils";
import type { BattleRoom, EncounterMonster } from "./types";

export function resolveBattleReward(
	room: BattleRoom,
	monster: EncounterMonster,
): BattleReward {
	if (room.resolvedReward) {
		return room.resolvedReward;
	}

	room.rewardSequence += 1;
	const drops = resolveLootTableDrops(monster.lootTable);
	const reward: BattleReward = {
		rewardId: `reward-${room.rewardSequence}-${monster.id}-${monster.level}`,
		monsterId: monster.id,
		monsterName: monster.name,
		monsterLevel: monster.level,
		gold: calculateBattleRewardGold(
			monster.level,
			monster.experienceReward,
			drops,
		),
		drops,
		eligibleHunterIds: getAliveHunters(room).map((hunter) => hunter.id),
		createdAt: Date.now(),
	};

	room.resolvedReward = reward;
	return reward;
}
