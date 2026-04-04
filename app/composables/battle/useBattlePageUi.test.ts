import { effectScope, nextTick, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBattlePageUi } from "~/composables/battle/useBattlePageUi";

describe("useBattlePageUi", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("opens the chest when a new reward id arrives and advances the reward flow", async () => {
		const levelUpAnnouncementCount = ref(0);
		const hunterAttackCount = ref(0);
		const monsterAttackCount = ref(0);
		const hunterDamagedCount = ref(0);
		const monsterDamagedCount = ref(0);
		const currentRewardId = ref("");
		let ui: ReturnType<typeof useBattlePageUi> | undefined;
		const scope = effectScope();

		scope.run(() => {
			ui = useBattlePageUi({
				levelUpAnnouncementCount,
				hunterAttackCount,
				monsterAttackCount,
				hunterDamagedCount,
				monsterDamagedCount,
				currentRewardId,
				onLevelUp: () => undefined,
			});
		});

		if (!ui) {
			throw new Error("Expected page UI state to initialize.");
		}

		currentRewardId.value = "reward-1";
		await nextTick();

		expect(ui.showChest.value).toBe(false);
		expect(ui.showLootPopup.value).toBe(false);

		currentRewardId.value = "reward-2";
		await nextTick();

		expect(ui.showChest.value).toBe(true);
		expect(ui.showLootPopup.value).toBe(false);

		ui.openRewardChest();

		expect(ui.showChest.value).toBe(false);
		expect(ui.showLootPopup.value).toBe(true);

		ui.closeRewardSequence();

		expect(ui.showLootPopup.value).toBe(false);
		expect(ui.showChest.value).toBe(false);

		scope.stop();
	});

	it("resets level-up and hit animations after their timers finish", async () => {
		vi.useFakeTimers();
		const levelUpAnnouncementCount = ref(0);
		const hunterAttackCount = ref(0);
		const monsterAttackCount = ref(0);
		const hunterDamagedCount = ref(0);
		const monsterDamagedCount = ref(0);
		const currentRewardId = ref("");
		let levelUpCalls = 0;
		let ui: ReturnType<typeof useBattlePageUi> | undefined;
		const scope = effectScope();

		scope.run(() => {
			ui = useBattlePageUi({
				levelUpAnnouncementCount,
				hunterAttackCount,
				monsterAttackCount,
				hunterDamagedCount,
				monsterDamagedCount,
				currentRewardId,
				onLevelUp: () => {
					levelUpCalls += 1;
				},
			});
		});

		if (!ui) {
			throw new Error("Expected page UI state to initialize.");
		}

		levelUpAnnouncementCount.value = 1;
		hunterAttackCount.value = 1;
		monsterDamagedCount.value = 1;
		await nextTick();

		expect(levelUpCalls).toBe(0);
		expect(ui.showLevelUpOverlay.value).toBe(false);
		expect(ui.isHunterCardShaking.value).toBe(false);
		expect(ui.isMonsterCardHit.value).toBe(false);

		levelUpAnnouncementCount.value = 2;
		hunterAttackCount.value = 2;
		monsterDamagedCount.value = 2;
		await nextTick();

		expect(levelUpCalls).toBe(1);
		expect(ui.showLevelUpOverlay.value).toBe(true);
		expect(ui.isHunterCardShaking.value).toBe(true);
		expect(ui.isMonsterCardHit.value).toBe(true);

		vi.advanceTimersByTime(220);
		expect(ui.isMonsterCardHit.value).toBe(false);
		vi.advanceTimersByTime(100);
		expect(ui.isHunterCardShaking.value).toBe(false);
		vi.advanceTimersByTime(2380);
		expect(ui.showLevelUpOverlay.value).toBe(false);

		scope.stop();
	});

	it("does not replay existing reward or level-up state on initial sync", async () => {
		const levelUpAnnouncementCount = ref(0);
		const hunterAttackCount = ref(0);
		const monsterAttackCount = ref(0);
		const hunterDamagedCount = ref(0);
		const monsterDamagedCount = ref(0);
		const currentRewardId = ref("");
		let levelUpCalls = 0;
		let ui: ReturnType<typeof useBattlePageUi> | undefined;
		const scope = effectScope();

		scope.run(() => {
			ui = useBattlePageUi({
				levelUpAnnouncementCount,
				hunterAttackCount,
				monsterAttackCount,
				hunterDamagedCount,
				monsterDamagedCount,
				currentRewardId,
				onLevelUp: () => {
					levelUpCalls += 1;
				},
			});
		});

		if (!ui) {
			throw new Error("Expected page UI state to initialize.");
		}

		levelUpAnnouncementCount.value = 3;
		currentRewardId.value = "reward-1";
		await nextTick();

		expect(levelUpCalls).toBe(0);
		expect(ui.showLevelUpOverlay.value).toBe(false);
		expect(ui.showChest.value).toBe(false);
		expect(ui.showLootPopup.value).toBe(false);

		scope.stop();
	});
});
