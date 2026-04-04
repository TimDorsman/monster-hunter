export function calculateRequiredExperience(level: number) {
	return Math.round(60 + level * 40 + level * level * 12);
}
