/**
 * Sequence Overlay State - Svelte 5 Runes Implementation
 */

interface SequenceOverlayState {
	isOpen: boolean;
	content: any;
}

function createSequenceOverlayState() {
	let isOpen = $state(false);
	let content = $state(null);

	return {
		get isOpen() { return isOpen; },
		get content() { return content; },
		
		open(overlayContent?: any) {
			content = overlayContent;
			isOpen = true;
		},
		
		close() {
			isOpen = false;
			content = null;
		},
		
		subscribe(callback: (state: SequenceOverlayState) => void) {
			// Simple subscription pattern
			const unsubscribe = () => {};
			callback({ isOpen, content });
			return unsubscribe;
		}
	};
}

export const sequenceOverlayStore = createSequenceOverlayState();

export function openSequenceOverlay(content?: any) {
	sequenceOverlayStore.open(content);
}

export function closeSequenceOverlay() {
	sequenceOverlayStore.close();
}
