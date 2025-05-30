/**
 * Progress Store - Svelte 5 Runes Implementation
 */

interface BadgeStatus {
	earned: boolean;
	progress: number;
	name: string;
}

function createProgressStore() {
	let badges = $state<BadgeStatus[]>([]);
	let overallProgress = $state(0);

	return {
		get badges() { return badges; },
		get overallProgress() { return overallProgress; },
		
		addBadge(badge: BadgeStatus) {
			badges.push(badge);
		},
		
		updateProgress(progress: number) {
			overallProgress = progress;
		},
		
		reset() {
			badges = [];
			overallProgress = 0;
		}
	};
}

function createBadgeStatus() {
	let earned = $state(false);
	let progress = $state(0);
	let name = $state('');

	return {
		get earned() { return earned; },
		get progress() { return progress; },
		get name() { return name; },
		
		setEarned(value: boolean) { earned = value; },
		setProgress(value: number) { progress = value; },
		setName(value: string) { name = value; }
	};
}

export const progressStore = createProgressStore();
export const badgeStatus = createBadgeStatus();
