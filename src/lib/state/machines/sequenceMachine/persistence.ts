/**
 * Sequence Machine Persistence - Svelte 5 Runes Implementation
 */

interface SelectedStartPos {
	letter: string;
	startPos: string;
	endPos: string;
}

function createSelectedStartPos() {
	let startPos = $state<SelectedStartPos | null>(null);

	return {
		get value() { return startPos; },
		
		set(newStartPos: SelectedStartPos | null) {
			startPos = newStartPos;
		},
		
		subscribe(callback: (startPos: SelectedStartPos | null) => void) {
			// Simple subscription pattern
			const unsubscribe = () => {};
			callback(startPos);
			return unsubscribe;
		}
	};
}

export const selectedStartPos = createSelectedStartPos();
