import monsters from "../../app/data/monsters.json";

type ElementType =
	| "normal"
	| "fire"
	| "water"
	| "electric"
	| "grass"
	| "ice"
	| "fighting"
	| "poison"
	| "ground"
	| "flying"
	| "psychic"
	| "bug"
	| "rock"
	| "ghost"
	| "dragon"
	| "dark"
	| "steel"
	| "fairy";

type Monster = {
	id: number;
	name: string;
	health: number;
	experience: number;
	weaknesses: ElementType[];
	strenghts: ElementType[];
	abilities?: Array<{
		name: "heal";
		chance: number;
	}>;
	reward: string;
};

type EncounterMonster = Monster & {
	level: number;
	baseHealth: number;
	baseExperience: number;
	retaliationMinDamage: number;
	retaliationDamageRange: number;
	experienceReward: number;
};

type LogSource = "hunter" | "monster" | "system";

type BattleLogEntry = {
	id: number;
	message: string;
	source: LogSource;
};

type HunterRole = "hunter" | "spectator";

type HunterState = {
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

type ClientMessage =
	| {
			type: "join";
			playerId: string;
			name: string;
			level: number;
			experience: number;
	  }
	| {
			type: "ping";
	  }
	| {
			type: "action";
			action: "attack" | "auraBeam" | "heal";
	  }
	| {
			type: "new_monster";
	  };

type BattleStatePayload = {
	type: "state";
	state: {
		monster: EncounterMonster | null;
		monsterHealth: number;
		logs: BattleLogEntry[];
		isAwaitingMonsterAttack: boolean;
		battleEnded: boolean;
		monsterAttackCount: number;
		monsterDamagedCount: number;
		monsterHealedCount: number;
		turnHunterId: string | null;
		maxHunters: number;
		hunters: HunterState[];
	};
};

const PLAYER_MAX_HEALTH = 100;
const MAX_HUNTERS = 4;
const PLAYER_MIN_DAMAGE = 12;
const PLAYER_DAMAGE_RANGE = 19;
const PLAYER_HEAL_BASE = 12;
const PLAYER_HEAL_RANGE = 9;
const PLAYER_DODGE_CHANCE = 0.1;
const MONSTER_HEAL_MIN = 10;
const MONSTER_HEAL_RANGE = 11;

type PeerLike = {
	send: (payload: string) => void;
};

type BattleRoom = {
	peersByPlayerId: Map<string, PeerLike>;
	playerIdByPeer: Map<PeerLike, string>;
	hunters: Map<string, HunterState>;
	disconnectCleanupTimers: Map<string, ReturnType<typeof setTimeout>>;
	currentMonster: EncounterMonster | null;
	monsterHealth: number;
	logs: BattleLogEntry[];
	logSequence: number;
	isAwaitingMonsterAttack: boolean;
	battleEnded: boolean;
	monsterAttackCount: number;
	monsterDamagedCount: number;
	monsterHealedCount: number;
	turnHunterId: string | null;
	monsterTurnTimer: ReturnType<typeof setTimeout> | null;
};

function getRandomIntInclusive(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculateRequiredExperience(level: number) {
	return Math.round(60 + level * 40 + level * level * 12);
}

function getMonsterHealChance(monster: Monster) {
	const healAbility = monster.abilities?.find((ability) => ability.name === "heal");
	return healAbility?.chance ?? 0;
}

function calculateMonsterSpeciesPower(monster: Monster) {
	const healChance = getMonsterHealChance(monster);
	const healthFactor = monster.health / 200;
	return 0.88 + healthFactor * 0.34 + healChance * 0.004;
}

function calculateMonsterDamagePower(monster: Monster) {
	const healChance = getMonsterHealChance(monster);
	const experienceFactor = Math.max(0.65, Math.min(1.5, monster.experience / 220));
	return 0.9 + experienceFactor * 0.32 + healChance * 0.003;
}

function rollMonsterLevelForParty(avgHunterLevel: number) {
	const levelRoll = Math.random();

	if (levelRoll < 0.65) {
		return getRandomIntInclusive(
			Math.max(1, avgHunterLevel - 2),
			avgHunterLevel + 2,
		);
	}

	if (levelRoll < 0.85) {
		const minLevel = Math.max(1, avgHunterLevel - 5);
		const maxLevel = Math.max(minLevel, avgHunterLevel - 1);
		return getRandomIntInclusive(minLevel, maxLevel);
	}

	if (levelRoll < 0.97) {
		return getRandomIntInclusive(avgHunterLevel + 3, avgHunterLevel + 8);
	}

	return getRandomIntInclusive(avgHunterLevel + 9, avgHunterLevel + 14);
}

function createEncounterMonster(monster: Monster, level: number): EncounterMonster {
	const speciesPower = calculateMonsterSpeciesPower(monster);
	const damagePower = calculateMonsterDamagePower(monster);
	const levelPower = 1 + (level - 1) * 0.075 + Math.log2(level) * 0.1;
	const scaledHealth = Math.max(
		70,
		Math.round(monster.health * speciesPower * levelPower),
	);
	const retaliationMinDamage = Math.max(
		6,
		Math.round(
			7 * damagePower * (1 + (level - 1) * 0.05),
		),
	);
	const retaliationDamageRange = Math.max(
		10,
		Math.round(
			14 * damagePower * (1 + (level - 1) * 0.04),
		),
	);
	const experienceReward = Math.max(
		8,
		Math.round(
			monster.experience * (1 + (level - 1) * 0.16) * (0.9 + speciesPower * 0.2),
		),
	);

	return {
		...monster,
		level,
		baseHealth: monster.health,
		baseExperience: monster.experience,
		health: scaledHealth,
		retaliationMinDamage,
		retaliationDamageRange,
		experienceReward,
	};
}

function getActiveHunters(room: BattleRoom) {
	return Array.from(room.hunters.values())
		.filter((hunter) => hunter.role === "hunter")
		.sort((a, b) => a.joinedAt - b.joinedAt);
}

function getAliveHunters(room: BattleRoom) {
	return getActiveHunters(room).filter((hunter) => hunter.health > 0);
}

function addBattleLogEntry(room: BattleRoom, message: string, source: LogSource = "system") {
	room.logSequence += 1;
	room.logs.push({
		id: room.logSequence,
		message,
		source,
	});
	if (room.logs.length > 40) {
		room.logs = room.logs.slice(-40);
	}
}

function buildStatePayload(room: BattleRoom): BattleStatePayload {
	return {
		type: "state",
		state: {
			monster: room.currentMonster,
			monsterHealth: room.monsterHealth,
			logs: room.logs.slice(-12),
			isAwaitingMonsterAttack: room.isAwaitingMonsterAttack,
			battleEnded: room.battleEnded,
			monsterAttackCount: room.monsterAttackCount,
			monsterDamagedCount: room.monsterDamagedCount,
			monsterHealedCount: room.monsterHealedCount,
			turnHunterId: room.turnHunterId,
			maxHunters: MAX_HUNTERS,
			hunters: Array.from(room.hunters.values()).sort(
				(a, b) => a.joinedAt - b.joinedAt,
			),
		},
	};
}

function broadcastState(room: BattleRoom) {
	const payload = JSON.stringify(buildStatePayload(room));
	for (const peer of room.peersByPlayerId.values()) {
		peer.send(payload);
	}
}

function pickNewMonster(room: BattleRoom) {
	const monsterPool = monsters as Monster[];
	const randomIndex = Math.floor(Math.random() * monsterPool.length);
	const selectedMonster = monsterPool[randomIndex];
	const aliveHunters = getActiveHunters(room);
	const avgHunterLevel =
		aliveHunters.length > 0
			? Math.round(
					aliveHunters.reduce((sum, hunter) => sum + hunter.level, 0) /
						aliveHunters.length,
			  )
			: 1;
	const monsterLevel = rollMonsterLevelForParty(avgHunterLevel);
	const encounter = createEncounterMonster(selectedMonster, monsterLevel);

	room.currentMonster = encounter;
	room.monsterHealth = encounter.health;
	room.battleEnded = false;
	room.isAwaitingMonsterAttack = false;

	for (const hunter of getActiveHunters(room)) {
		hunter.health = hunter.maxHealth;
	}

	const firstAlive = getAliveHunters(room)[0];
	room.turnHunterId = firstAlive ? firstAlive.id : null;
	room.logs = [];
	room.logSequence = 0;
	addBattleLogEntry(
		room,
		`${encounter.name} (Lv. ${encounter.level}) appeared from the wild.`,
		"system",
	);
}

function rollBasePlayerDamage(level: number) {
	const baseDamage = Math.floor(Math.random() * PLAYER_DAMAGE_RANGE) + PLAYER_MIN_DAMAGE;
	const levelMultiplier = 1 + Math.log2(level) * 0.18;
	return Math.round(baseDamage * levelMultiplier);
}

function rollPlayerHealAmount(level: number) {
	const baseHeal = Math.floor(Math.random() * PLAYER_HEAL_RANGE) + PLAYER_HEAL_BASE;
	const levelMultiplier = 1 + Math.log2(level) * 0.14;
	return Math.max(1, Math.round(baseHeal * levelMultiplier));
}

function rollMonsterHealAmount() {
	return Math.floor(Math.random() * MONSTER_HEAL_RANGE) + MONSTER_HEAL_MIN;
}

function awardExperienceToHunters(room: BattleRoom, baseExperience: number) {
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
		addBattleLogEntry(room, `${hunter.name} gained ${splitExperience} XP.`, "system");

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

function setNextTurnOrMonster(room: BattleRoom, currentHunterId: string) {
	const aliveHunters = getAliveHunters(room);
	if (aliveHunters.length === 0) {
		room.turnHunterId = null;
		room.battleEnded = true;
		addBattleLogEntry(room, "All hunters have fallen. Battle lost.", "system");
		broadcastState(room);
		return;
	}

	const currentIndex = aliveHunters.findIndex((hunter) => hunter.id === currentHunterId);
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

function shouldMonsterHeal(monster: EncounterMonster, currentHealth: number) {
	const chance = getMonsterHealChance(monster);
	if (!chance) {
		return false;
	}
	if (currentHealth >= monster.health) {
		return false;
	}
	return Math.random() < chance / 100;
}

function executeMonsterTurn(room: BattleRoom) {
	if (room.monsterTurnTimer) {
		clearTimeout(room.monsterTurnTimer);
	}

	room.monsterTurnTimer = setTimeout(() => {
		if (!room.currentMonster || room.battleEnded) {
			room.isAwaitingMonsterAttack = false;
			broadcastState(room);
			return;
		}

		if (shouldMonsterHeal(room.currentMonster, room.monsterHealth)) {
			const healAmount = rollMonsterHealAmount();
			const beforeHeal = room.monsterHealth;
			room.monsterHealth = Math.min(
				room.currentMonster.health,
				room.monsterHealth + healAmount,
			);
			const actualHeal = room.monsterHealth - beforeHeal;
			if (actualHeal > 0) {
				room.monsterHealedCount += 1;
			}
			addBattleLogEntry(
				room,
				`${room.currentMonster.name} used Heal and recovered ${actualHeal} HP.`,
				"monster",
			);
		} else {
			room.monsterAttackCount += 1;
			const aliveHunters = getAliveHunters(room);

			for (const hunter of aliveHunters) {
				if (Math.random() < PLAYER_DODGE_CHANCE) {
					addBattleLogEntry(
						room,
						`${room.currentMonster.name} attacked ${hunter.name}, but they dodged.`,
						"monster",
					);
					continue;
				}

				const retaliationDamage =
					Math.floor(Math.random() * room.currentMonster.retaliationDamageRange) +
					room.currentMonster.retaliationMinDamage;
				hunter.health = Math.max(0, hunter.health - retaliationDamage);
				hunter.damagedCount += 1;
				addBattleLogEntry(
					room,
					`${room.currentMonster.name} hit ${hunter.name} for ${retaliationDamage}.`,
					"monster",
				);

				if (hunter.health === 0) {
					addBattleLogEntry(room, `${hunter.name} was defeated.`, "monster");
				}
			}
		}

		const nextAlive = getAliveHunters(room)[0];
		room.isAwaitingMonsterAttack = false;
		if (!nextAlive) {
			room.battleEnded = true;
			room.turnHunterId = null;
			addBattleLogEntry(room, "All hunters have fallen. Battle lost.", "system");
		} else {
			room.turnHunterId = nextAlive.id;
		}
		broadcastState(room);
	}, 900);
}

function promoteSpectatorsIfSlots(room: BattleRoom) {
	const activeHunters = getActiveHunters(room);
	if (activeHunters.length >= MAX_HUNTERS) {
		return;
	}

	const spectators = Array.from(room.hunters.values())
		.filter((hunter) => hunter.role === "spectator")
		.sort((a, b) => a.joinedAt - b.joinedAt);
	for (const spectator of spectators) {
		if (getActiveHunters(room).length >= MAX_HUNTERS) {
			break;
		}
		spectator.role = "hunter";
		spectator.health = spectator.maxHealth;
		addBattleLogEntry(room, `${spectator.name} joined as an active hunter.`, "system");
	}
}

function handlePlayerAction(room: BattleRoom, playerId: string, action: "attack" | "auraBeam" | "heal") {
	const hunter = room.hunters.get(playerId);
	if (!hunter || hunter.role !== "hunter") {
		return;
	}
	if (!room.currentMonster || room.battleEnded || room.isAwaitingMonsterAttack) {
		return;
	}
	if (room.turnHunterId !== hunter.id) {
		return;
	}
	if (hunter.health <= 0) {
		return;
	}

	const monsterName = room.currentMonster.name;
	let didHit = true;
	let playerDamage = rollBasePlayerDamage(hunter.level);

	if (action !== "heal") {
		hunter.attackCount += 1;
	}

	if (action === "auraBeam") {
		didHit = Math.random() < 0.75;
		playerDamage = Math.round(playerDamage * 1.5);
	}

	if (action === "heal") {
		const healAmount = rollPlayerHealAmount(hunter.level);
		const beforeHeal = hunter.health;
		hunter.health = Math.min(hunter.maxHealth, hunter.health + healAmount);
		const actualHeal = hunter.health - beforeHeal;
		if (actualHeal <= 0) {
			addBattleLogEntry(room, `${hunter.name} is already at full HP.`, "system");
			broadcastState(room);
			return;
		}

		addBattleLogEntry(room, `${hunter.name} healed for ${actualHeal} HP.`, "hunter");
		setNextTurnOrMonster(room, hunter.id);
		return;
	}

	if (didHit) {
		room.monsterHealth = Math.max(0, room.monsterHealth - playerDamage);
		room.monsterDamagedCount += 1;

		if (room.monsterHealth === 0) {
			addBattleLogEntry(
				room,
				`${hunter.name} defeated Lv. ${room.currentMonster.level} ${monsterName} and earned ${room.currentMonster.reward}.`,
				"hunter",
			);
			awardExperienceToHunters(room, room.currentMonster.experienceReward);
			room.battleEnded = true;
			room.turnHunterId = null;
			room.isAwaitingMonsterAttack = false;
			broadcastState(room);
			return;
		}
	}

	if (action === "auraBeam") {
		if (didHit) {
			addBattleLogEntry(
				room,
				`${hunter.name} used Aura Beam on ${monsterName} for ${playerDamage}.`,
				"hunter",
			);
		} else {
			addBattleLogEntry(
				room,
				`${hunter.name} used Aura Beam, but missed ${monsterName}.`,
				"hunter",
			);
		}
	} else {
		addBattleLogEntry(
			room,
			`${hunter.name} hit ${monsterName} for ${playerDamage}.`,
			"hunter",
		);
	}

	setNextTurnOrMonster(room, hunter.id);
}

function createBattleRoom(): BattleRoom {
	return {
		peersByPlayerId: new Map<string, PeerLike>(),
		playerIdByPeer: new Map<PeerLike, string>(),
		hunters: new Map<string, HunterState>(),
		disconnectCleanupTimers: new Map<string, ReturnType<typeof setTimeout>>(),
		currentMonster: null,
		monsterHealth: 0,
		logs: [],
		logSequence: 0,
		isAwaitingMonsterAttack: false,
		battleEnded: false,
		monsterAttackCount: 0,
		monsterDamagedCount: 0,
		monsterHealedCount: 0,
		turnHunterId: null,
		monsterTurnTimer: null,
	};
}

declare global {
	var __monsterHunterBattleRoom: BattleRoom | undefined;
}

export function getBattleRoom() {
	if (!globalThis.__monsterHunterBattleRoom) {
		globalThis.__monsterHunterBattleRoom = createBattleRoom();
	}
	return globalThis.__monsterHunterBattleRoom;
}

async function parseTextMessage(message: unknown) {
	if (typeof message === "string") {
		return message;
	}
	if (message instanceof Uint8Array) {
		return new TextDecoder().decode(message);
	}
	if (message instanceof ArrayBuffer) {
		return new TextDecoder().decode(new Uint8Array(message));
	}
	if (
		message &&
		typeof message === "object" &&
		"text" in message &&
		typeof (message as { text: unknown }).text === "function"
	) {
		try {
			const nextText = (message as { text: () => string | Promise<string> }).text();
			if (typeof nextText === "string") {
				return nextText;
			}
			return await nextText;
		} catch {
			return "";
		}
	}
	return "";
}

export function handleBattlePeerOpen(room: BattleRoom, peer: PeerLike) {
	const generatedPlayerId = `peer-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
	const activeCount = getActiveHunters(room).length;
	const role: HunterRole = activeCount < MAX_HUNTERS ? "hunter" : "spectator";

	room.playerIdByPeer.set(peer, generatedPlayerId);
	room.peersByPlayerId.set(generatedPlayerId, peer);
	room.hunters.set(generatedPlayerId, {
		id: generatedPlayerId,
		name: "Hunter",
		role,
		connected: true,
		level: 1,
		experience: 0,
		health: PLAYER_MAX_HEALTH,
		maxHealth: PLAYER_MAX_HEALTH,
		joinedAt: Date.now(),
		attackCount: 0,
		damagedCount: 0,
		levelUpCount: 0,
	});

	if (!room.currentMonster) {
		pickNewMonster(room);
	}

	broadcastState(room);
}

export function handleBattlePeerClose(room: BattleRoom, peer: PeerLike) {
	const playerId = room.playerIdByPeer.get(peer);
	if (!playerId) {
		return;
	}

	room.playerIdByPeer.delete(peer);
	room.peersByPlayerId.delete(playerId);
	const hunter = room.hunters.get(playerId);

	if (!hunter) {
		return;
	}

	hunter.connected = false;
	if (playerId.startsWith("peer-")) {
		room.hunters.delete(playerId);
		promoteSpectatorsIfSlots(room);
	} else {
		const existingCleanupTimer = room.disconnectCleanupTimers.get(playerId);
		if (existingCleanupTimer) {
			clearTimeout(existingCleanupTimer);
		}

		const cleanupTimer = setTimeout(() => {
			const staleHunter = room.hunters.get(playerId);
			if (!staleHunter || staleHunter.connected) {
				return;
			}

			room.hunters.delete(playerId);
			room.disconnectCleanupTimers.delete(playerId);
			promoteSpectatorsIfSlots(room);
			const activeHuntersAfterCleanup = getActiveHunters(room);
			if (
				room.turnHunterId &&
				!activeHuntersAfterCleanup.some(
					(nextHunter) => nextHunter.id === room.turnHunterId,
				)
			) {
				room.turnHunterId = activeHuntersAfterCleanup[0]?.id ?? null;
			}
			broadcastState(room);
		}, 60_000);

		room.disconnectCleanupTimers.set(playerId, cleanupTimer);
	}

	const activeHunters = getActiveHunters(room);
	if (activeHunters.length === 0) {
		room.turnHunterId = null;
		room.isAwaitingMonsterAttack = false;
	} else if (
		room.turnHunterId &&
		!activeHunters.some((hunter) => hunter.id === room.turnHunterId)
	) {
		room.turnHunterId = activeHunters[0].id;
	}

	broadcastState(room);
}

export async function handleBattlePeerMessage(
	room: BattleRoom,
	peer: PeerLike,
	rawMessage: unknown,
) {
	const text = await parseTextMessage(rawMessage);
	if (!text) {
		return;
	}

	let parsedMessage: ClientMessage;
	try {
		parsedMessage = JSON.parse(text) as ClientMessage;
	} catch {
		return;
	}

	if (parsedMessage.type === "join") {
		const playerId = parsedMessage.playerId;
		const existingPeerPlayerId = room.playerIdByPeer.get(peer);
		const existing = room.hunters.get(playerId);

		if (existingPeerPlayerId && existingPeerPlayerId !== playerId) {
			const generatedHunter = room.hunters.get(existingPeerPlayerId);
			room.peersByPlayerId.delete(existingPeerPlayerId);
			room.hunters.delete(existingPeerPlayerId);
			if (room.turnHunterId === existingPeerPlayerId) {
				room.turnHunterId = playerId;
			}

			if (generatedHunter && !existing) {
				generatedHunter.id = playerId;
				room.hunters.set(playerId, generatedHunter);
			}
		}

		room.playerIdByPeer.set(peer, playerId);
		room.peersByPlayerId.set(playerId, peer);

		const upserted = room.hunters.get(playerId);
		const nextLevel = Math.max(1, Math.floor(parsedMessage.level));
		const nextExperience = Math.max(0, Math.floor(parsedMessage.experience));
		const cleanupTimer = room.disconnectCleanupTimers.get(playerId);
		if (cleanupTimer) {
			clearTimeout(cleanupTimer);
			room.disconnectCleanupTimers.delete(playerId);
		}
		if (existing) {
			existing.name = parsedMessage.name;
			existing.level = nextLevel;
			existing.experience = nextExperience;
			existing.connected = true;
		} else if (upserted) {
			upserted.name = parsedMessage.name;
			upserted.level = nextLevel;
			upserted.experience = nextExperience;
			upserted.connected = true;
		} else {
			const activeCount = getActiveHunters(room).length;
			const role: HunterRole = activeCount < MAX_HUNTERS ? "hunter" : "spectator";
			room.hunters.set(playerId, {
				id: playerId,
				name: parsedMessage.name,
				role,
				connected: true,
				level: nextLevel,
				experience: nextExperience,
				health: PLAYER_MAX_HEALTH,
				maxHealth: PLAYER_MAX_HEALTH,
				joinedAt: Date.now(),
				attackCount: 0,
				damagedCount: 0,
				levelUpCount: 0,
			});
			if (role === "spectator") {
				addBattleLogEntry(
					room,
					`${parsedMessage.name} joined as spectator (room is full).`,
					"system",
				);
			} else {
				addBattleLogEntry(
					room,
					`${parsedMessage.name} joined the battle.`,
					"system",
				);
			}
		}

		if (!room.battleEnded && room.currentMonster && !room.isAwaitingMonsterAttack) {
			const aliveHunters = getAliveHunters(room);
			if (aliveHunters.length > 0 && !room.turnHunterId) {
				room.turnHunterId = aliveHunters[0].id;
			}
		}

		if (!room.currentMonster) {
			pickNewMonster(room);
		}

		broadcastState(room);
		return;
	}

	const playerId = room.playerIdByPeer.get(peer);
	if (!playerId) {
		return;
	}

	if (parsedMessage.type === "ping") {
		peer.send(JSON.stringify({ type: "pong" }));
		return;
	}

	if (parsedMessage.type === "action") {
		handlePlayerAction(room, playerId, parsedMessage.action);
		broadcastState(room);
		return;
	}

	if (parsedMessage.type === "new_monster") {
		const hunter = room.hunters.get(playerId);
		if (!hunter || hunter.role !== "hunter") {
			return;
		}
		pickNewMonster(room);
		broadcastState(room);
	}
}
