import type { BattleAction } from "~~/types/abilities";
import { AttackAbility } from "../abilities/attack-ability";
import { AuraBeamAbility } from "../abilities/aura-beam-ability";
import { BurnAbility } from "../abilities/burn-ability";
import { HealAbility } from "../abilities/heal-ability";
import { MonsterHealAbility } from "../abilities/monster-heal-ability";
import { getRandomIntInclusive } from "./random";
import {
	type BattleRoom,
	MONSTER_HEAL_MIN,
	MONSTER_HEAL_RANGE,
} from "./types";
import {
	addBattleLogEntry,
	broadcastState,
	getAliveHunters,
} from "./room-utils";
import { getEffectiveMonsterAttackChance } from "./settings";

const attackAbility = new AttackAbility();
const auraBeamAbility = new AuraBeamAbility();
const healAbility = new HealAbility();
const burnAbility = new BurnAbility();
const monsterHealAbility = new MonsterHealAbility();

function calculateRequiredExperience(level: number) {
	return Math.round(60 + level * 40 + level * level * 12);
}

function rollBasePlayerDamage(
	room: BattleRoom,
	hunterLevel: number,
	monsterLevel: number,
) {
	const baseDamage =
		Math.floor(Math.random() * room.settings.hunter.damageRange) +
		room.settings.hunter.damageMin;
	const levelMultiplier = 1 + Math.log2(hunterLevel) * 0.18;
	const levelDelta = hunterLevel - monsterLevel;
	const advantageMultiplier =
		levelDelta >= 0
			? 1 + Math.min(0.6, levelDelta * 0.12)
			: Math.max(0.72, 1 + levelDelta * 0.08);
	return Math.round(baseDamage * levelMultiplier * advantageMultiplier);
}

function rollPlayerHealAmount(room: BattleRoom, level: number) {
	const baseHeal =
		Math.floor(Math.random() * room.settings.hunter.healRange) +
		room.settings.hunter.healBase;
	const levelMultiplier = 1 + Math.log2(level) * 0.14;
	return Math.max(1, Math.round(baseHeal * levelMultiplier));
}

function rollMonsterHealAmount() {
	return Math.floor(Math.random() * MONSTER_HEAL_RANGE) + MONSTER_HEAL_MIN;
}

export function awardExperienceToHunters(room: BattleRoom, baseExperience: number) {
	const eligibleHunters = getAliveHunters(room);
	if (eligibleHunters.length === 0) {
		return;
	}

	const splitExperience = Math.max(
		1,
		Math.floor(baseExperience / eligibleHunters.length),
	);

	for (const hunter of eligibleHunters) {
		hunter.experience += splitExperience;
		addBattleLogEntry(
			room,
			`${hunter.name} gained ${splitExperience} XP.`,
			"system",
		);

		while (hunter.experience >= calculateRequiredExperience(hunter.level)) {
			hunter.experience -= calculateRequiredExperience(hunter.level);
			hunter.level += 1;
			hunter.levelUpCount += 1;
			addBattleLogEntry(
				room,
				`${hunter.name} leveled up to ${hunter.level}!`,
				"system",
			);
		}
	}
}

function applyBurnDamage(room: BattleRoom) {
	if (!room.currentMonster) {
		return false;
	}

	const result = burnAbility.applyRoundEffect({
		room,
		monster: room.currentMonster,
		addBattleLogEntry,
		awardExperienceToHunters,
		randomIntInclusive: getRandomIntInclusive,
	});

	return result.battleEnded;
}

export function executeMonsterTurn(room: BattleRoom) {
	if (room.monsterTurnTimer) {
		clearTimeout(room.monsterTurnTimer);
	}

	room.monsterTurnTimer = setTimeout(() => {
		if (!room.currentMonster || room.battleEnded) {
			room.isAwaitingMonsterAttack = false;
			broadcastState(room);
			return;
		}

		if (applyBurnDamage(room)) {
			broadcastState(room);
			return;
		}

		if (
			monsterHealAbility.shouldExecute(
				room.currentMonster,
				room.monsterHealth,
				Math.random,
			)
		) {
			monsterHealAbility.execute({
				room,
				monster: room.currentMonster,
				addBattleLogEntry,
				rollMonsterHealAmount,
			});
		} else {
			room.monsterAttackCount += 1;
			const monsterAttackLogMetadata = {
				eventType: "ability",
				action: "attack",
			} as const;
			const didAttackHit =
				Math.random() <
				getEffectiveMonsterAttackChance(room, room.currentMonster) / 100;
			const aliveHunters = getAliveHunters(room);

			if (!didAttackHit) {
				addBattleLogEntry(
					room,
					`${room.currentMonster.name} attacked, but missed the party.`,
					"monster",
					monsterAttackLogMetadata,
				);
			}

			let loggedMonsterAttackEvent = false;

			for (const hunter of aliveHunters) {
				if (!didAttackHit) {
					continue;
				}

				if (
					Math.random() <
					room.settings.hunter.dodgeChance / 100
				) {
					const attackEventMetadata = loggedMonsterAttackEvent
						? undefined
						: monsterAttackLogMetadata;
					addBattleLogEntry(
						room,
						`${room.currentMonster.name} attacked ${hunter.name}, but they dodged.`,
						"monster",
						attackEventMetadata,
					);
					loggedMonsterAttackEvent = true;
					continue;
				}

				const retaliationDamage =
					Math.floor(
						Math.random() *
							room.currentMonster.retaliationDamageRange,
					) + room.currentMonster.retaliationMinDamage;
				hunter.health = Math.max(0, hunter.health - retaliationDamage);
				hunter.damagedCount += 1;
				const attackEventMetadata = loggedMonsterAttackEvent
					? undefined
					: monsterAttackLogMetadata;
				addBattleLogEntry(
					room,
					`${room.currentMonster.name} hit ${hunter.name} for ${retaliationDamage}.`,
					"monster",
					attackEventMetadata,
				);
				loggedMonsterAttackEvent = true;

				if (hunter.health === 0) {
					addBattleLogEntry(
						room,
						`${hunter.name} was defeated.`,
						"monster",
					);
				}
			}
		}

		const nextAlive = getAliveHunters(room)[0];
		room.isAwaitingMonsterAttack = false;
		if (!nextAlive) {
			room.battleEnded = true;
			room.turnHunterId = null;
			addBattleLogEntry(
				room,
				"All hunters have fallen. Battle lost.",
				"system",
			);
		} else {
			room.turnHunterId = nextAlive.id;
		}
		broadcastState(room);
	}, 900);
}

export function setNextTurnOrMonster(room: BattleRoom, currentHunterId: string) {
	const aliveHunters = getAliveHunters(room);
	if (aliveHunters.length === 0) {
		room.turnHunterId = null;
		room.battleEnded = true;
		addBattleLogEntry(
			room,
			"All hunters have fallen. Battle lost.",
			"system",
		);
		broadcastState(room);
		return;
	}

	const currentIndex = aliveHunters.findIndex(
		(hunter) => hunter.id === currentHunterId,
	);
	const nextHunter = aliveHunters[currentIndex + 1];
	if (nextHunter) {
		room.turnHunterId = nextHunter.id;
		room.isAwaitingMonsterAttack = false;
		broadcastState(room);
		return;
	}

	room.turnHunterId = null;
	room.isAwaitingMonsterAttack = true;
	broadcastState(room);
	executeMonsterTurn(room);
}

export function handlePlayerAction(
	room: BattleRoom,
	playerId: string,
	action: BattleAction,
) {
	const hunter = room.hunters.get(playerId);
	if (!hunter || hunter.role !== "hunter") {
		return;
	}
	if (
		!room.currentMonster ||
		room.battleEnded ||
		room.isAwaitingMonsterAttack
	) {
		return;
	}
	if (room.turnHunterId !== hunter.id) {
		return;
	}
	if (hunter.health <= 0) {
		return;
	}

	if (action !== "heal") {
		hunter.attackCount += 1;
	}

	if (action === "heal") {
		healAbility.execute({
			room,
			hunter,
			monster: room.currentMonster,
			addBattleLogEntry,
			setNextTurnOrMonster,
			awardExperienceToHunters,
			successChance: room.settings.hunter.abilityChances.healChance,
			rollPlayerHealAmount: (level) => rollPlayerHealAmount(room, level),
			random: Math.random,
		});
		return;
	}

	if (action === "burn") {
		burnAbility.execute({
			room,
			hunter,
			monster: room.currentMonster,
			addBattleLogEntry,
			setNextTurnOrMonster,
			awardExperienceToHunters,
			successChance: room.settings.hunter.abilityChances.burnChance,
			random: Math.random,
		});
		return;
	}

	if (action === "auraBeam") {
		auraBeamAbility.execute({
			room,
			hunter,
			monster: room.currentMonster,
			addBattleLogEntry,
			setNextTurnOrMonster,
			awardExperienceToHunters,
			successChance: room.settings.hunter.abilityChances.auraBeamChance,
			rollBasePlayerDamage: (hunterLevel, monsterLevel) =>
				rollBasePlayerDamage(room, hunterLevel, monsterLevel),
			random: Math.random,
		});
		return;
	}

	attackAbility.execute({
		room,
		hunter,
		monster: room.currentMonster,
		addBattleLogEntry,
		setNextTurnOrMonster,
		awardExperienceToHunters,
		successChance: room.settings.hunter.abilityChances.attackChance,
		rollBasePlayerDamage: (hunterLevel, monsterLevel) =>
			rollBasePlayerDamage(room, hunterLevel, monsterLevel),
		random: Math.random,
	});
}
