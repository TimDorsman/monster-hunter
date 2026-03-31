import type { Howl as HowlInstance } from "howler";

type BattleSoundSource = "hunter" | "monster";
type BattleSoundAction = "attack" | "auraBeam";
type HowlerModule = typeof import("howler");

let howlerModulePromise: Promise<HowlerModule> | null = null;
let hunterAttackSound: HowlInstance | null = null;
let hunterAuraBeamSound: HowlInstance | null = null;
let monsterAttackSound: HowlInstance | null = null;
let chestOpenSound: HowlInstance | null = null;
let levelUpSound: HowlInstance | null = null;
const isAudioUnlocked = ref(false);

async function loadHowlerModule() {
	if (!howlerModulePromise) {
		howlerModulePromise = import("howler");
	}

	return howlerModulePromise;
}

async function ensureBattleSounds() {
	if (!import.meta.client) {
		return null;
	}

	const { Howl, Howler } = await loadHowlerModule();
	Howler.autoUnlock = true;

	if (!hunterAttackSound) {
		hunterAttackSound = new Howl({
			src: ["/sounds/hunter/basic-attack.mp3"],
			preload: true,
		});
	}

	if (!monsterAttackSound) {
		monsterAttackSound = new Howl({
			src: ["/sounds/monster/basic-attack.mp3"],
			preload: true,
		});
	}

	if (!hunterAuraBeamSound) {
		hunterAuraBeamSound = new Howl({
			src: ["/sounds/hunter/aura-beam.mp3"],
			preload: true,
		});
	}

	if (!chestOpenSound) {
		chestOpenSound = new Howl({
			src: ["/sounds/chest/chest-open.mp3"],
			preload: true,
		});
	}

	if (!levelUpSound) {
		levelUpSound = new Howl({
			src: ["/sounds/level-up.mp3"],
			preload: true,
		});
	}

	if (
		!hunterAttackSound ||
		!hunterAuraBeamSound ||
		!monsterAttackSound ||
		!chestOpenSound ||
		!levelUpSound
	) {
		return null;
	}

	return {
		Howler,
		chestOpenSound,
		hunterAttackSound,
		hunterAuraBeamSound,
		levelUpSound,
		monsterAttackSound,
	};
}

export function useBattleAudio() {
	async function unlockAudio() {
		if (!import.meta.client) {
			return;
		}

		isAudioUnlocked.value = true;
		const battleSounds = await ensureBattleSounds();
		if (!battleSounds) {
			return;
		}

		try {
			await battleSounds.Howler.ctx?.resume?.();
		} catch {
			// Ignore autoplay restrictions and keep battle flow uninterrupted.
		}
	}

	async function playBattleSound(
		source: BattleSoundSource,
		action: BattleSoundAction,
	) {
		if (!import.meta.client || !isAudioUnlocked.value) {
			return;
		}

		const battleSounds = await ensureBattleSounds();
		if (!battleSounds) {
			return;
		}

		let sound: HowlInstance;
		if (source === "hunter" && action === "auraBeam") {
			sound = battleSounds.hunterAuraBeamSound;
		} else if (source === "hunter") {
			sound = battleSounds.hunterAttackSound;
		} else {
			sound = battleSounds.monsterAttackSound;
		}

		try {
			sound.stop();
			sound.play();
		} catch {
			// Ignore playback failures and keep battle flow uninterrupted.
		}
	}

	async function playChestOpenSound() {
		if (!import.meta.client || !isAudioUnlocked.value) {
			return;
		}

		const battleSounds = await ensureBattleSounds();
		if (!battleSounds) {
			return;
		}

		try {
			battleSounds.chestOpenSound.stop();
			battleSounds.chestOpenSound.play();
		} catch {
			// Ignore playback failures and keep battle flow uninterrupted.
		}
	}

	async function playLevelUpSound() {
		if (!import.meta.client || !isAudioUnlocked.value) {
			return;
		}

		const battleSounds = await ensureBattleSounds();
		if (!battleSounds) {
			return;
		}

		try {
			battleSounds.levelUpSound.stop();
			battleSounds.levelUpSound.play();
		} catch {
			// Ignore playback failures and keep battle flow uninterrupted.
		}
	}

	return {
		isAudioUnlocked,
		unlockAudio,
		playBattleSound,
		playChestOpenSound,
		playLevelUpSound,
	};
}
