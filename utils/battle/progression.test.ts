import { describe, expect, it } from "vitest";
import { calculateRequiredExperience } from "~~/utils/battle/progression";

describe("battle progression", () => {
	it("increases the required experience by level", () => {
		expect(calculateRequiredExperience(1)).toBe(112);
		expect(calculateRequiredExperience(2)).toBe(188);
		expect(calculateRequiredExperience(5)).toBe(560);
	});
});
