import type {
	BattleHunterState,
	BattleLogEntry,
	Monster,
} from "~~/types/battle";
import type { BattleGameSettings } from "~~/types/game-settings";
import type {
	BattleTurnViewState,
	EffectiveMonsterSettings,
} from "~~/types/battle-ui";
import { getMonsterAbilityChance } from "~~/utils/battle-abilities";

function calculateHealthPercent(currentHealth: number, maxHealth: number) {
	if (maxHealth <= 0) {
		return 0;
	}

	return Math.max(0, Math.round((currentHealth / maxHealth) * 100));
}

export function resolveEffectiveMonsterSettings(
	currentMonster: Monster | null,
	settings: BattleGameSettings,
): EffectiveMonsterSettings {
	const nextSettings = settings.monster;
	return {
		health: nextSettings.health ?? currentMonster?.health ?? 0,
		retaliationMinDamage:
			nextSettings.retaliationMinDamage ??
			currentMonster?.retaliationMinDamage ??
			0,
		retaliationDamageRange:
			nextSettings.retaliationDamageRange ??
			currentMonster?.retaliationDamageRange ??
			0,
		attackChance:
			nextSettings.attackChance ??
			(currentMonster
				? getMonsterAbilityChance(currentMonster.abilities, "attack", 0)
				: 0),
		healChance:
			nextSettings.healChance ??
			(currentMonster
				? getMonsterAbilityChance(currentMonster.abilities, "heal", 0)
				: 0),
	};
}

export function calculatePlayerHealthPercent(
	playerHealth: number,
	playerMaxHealth: number,
) {
	return calculateHealthPercent(playerHealth, playerMaxHealth);
}

export function calculateMonsterHealthPercent(
	monsterHealth: number,
	currentMonster: Monster | null,
) {
	if (!currentMonster) {
		return 0;
	}

	return calculateHealthPercent(monsterHealth, currentMonster.health);
}

export function sliceRecentBattleLogs(
	logs: BattleLogEntry[],
	limit = 8,
) {
	return logs.slice(-limit);
}

export function createHunterCardSlots(
	hunters: BattleHunterState[],
	maxCards = 4,
) {
	const cards = [...hunters];
	while (cards.length < maxCards) {
		cards.push(null);
	}

	return cards.slice(0, maxCards);
}

type BattleTurnViewStateOptions = {
	battleEnded: boolean;
	isAwaitingMonsterAttack: boolean;
	activeTurn: "player" | "monster" | "ended";
	isSpectator: boolean;
	currentTurnHunterName: string;
	currentMonsterName: string;
};

export function getBattleTurnViewState(
	options: BattleTurnViewStateOptions,
): BattleTurnViewState {
	const {
		activeTurn,
		battleEnded,
		currentMonsterName,
		currentTurnHunterName,
		isAwaitingMonsterAttack,
		isSpectator,
	} = options;

	if (battleEnded) {
		return {
			bannerLabel: "BATTLE ENDED",
			hintLabel: "Select a new monster to start another round.",
			isMonsterTurn: false,
			isOtherHunterTurn: false,
		};
	}

	if (isAwaitingMonsterAttack) {
		return {
			bannerLabel: "MONSTER TURN",
			hintLabel: `${currentMonsterName} is preparing an attack.`,
			isMonsterTurn: true,
			isOtherHunterTurn: false,
		};
	}

	if (isSpectator && currentTurnHunterName) {
		return {
			bannerLabel: `${currentTurnHunterName.toUpperCase()}'S TURN`,
			hintLabel: `${currentTurnHunterName} can act now.`,
			isMonsterTurn: false,
			isOtherHunterTurn: true,
		};
	}

	if (activeTurn === "player") {
		return {
			bannerLabel: "YOUR TURN",
			hintLabel: "Choose an ability to take your action.",
			isMonsterTurn: false,
			isOtherHunterTurn: false,
		};
	}

	if (currentTurnHunterName) {
		return {
			bannerLabel: `${currentTurnHunterName.toUpperCase()}'S TURN`,
			hintLabel: `Waiting for ${currentTurnHunterName} to act.`,
			isMonsterTurn: false,
			isOtherHunterTurn: true,
		};
	}

	return {
		bannerLabel: "WAITING...",
		hintLabel: "Waiting for battle state...",
		isMonsterTurn: activeTurn === "monster",
		isOtherHunterTurn: false,
	};
}
