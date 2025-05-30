/**
 * Grid Store - Svelte 5 Runes Implementation
 */

interface GridState {
	isVisible: boolean;
	opacity: number;
	scale: number;
}

function createGridStore() {
	let isVisible = $state(true);
	let opacity = $state(1);
	let scale = $state(1);

	return {
		get isVisible() { return isVisible; },
		get opacity() { return opacity; },
		get scale() { return scale; },
		
		setVisible(visible: boolean) {
			isVisible = visible;
		},
		
		setOpacity(value: number) {
			opacity = value;
		},
		
		setScale(value: number) {
			scale = value;
		},
		
		reset() {
			isVisible = true;
			opacity = 1;
			scale = 1;
		}
	};
}

export const gridStore = createGridStore();
