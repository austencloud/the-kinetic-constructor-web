/**
 * Layout State Management with Svelte 5 Runes
 *
 * Modern replacement for layout store using Svelte 5 runes
 * NO STORES - RUNES ONLY!
 */

export interface LayoutInfo {
	rows: number;
	cols: number;
	beatCount: number;
	lastChanged: number;
}

const createLayoutState = () => {
	const initialLayout: LayoutInfo = {
		rows: 1,
		cols: 1,
		beatCount: 0,
		lastChanged: Date.now()
	};

	let layoutState = $state<LayoutInfo>({ ...initialLayout });

	return {
		// Getter for accessing the current layout
		get state() {
			return layoutState;
		},

		// Update the layout information
		updateLayout: (rows: number, cols: number, beatCount: number) => {
			// Only update lastChanged if the layout actually changed
			const layoutChanged = layoutState.rows !== rows || layoutState.cols !== cols;
			layoutState = {
				rows,
				cols,
				beatCount,
				lastChanged: layoutChanged ? Date.now() : layoutState.lastChanged
			};
		},

		// Reset the layout to initial values
		reset: () => {
			layoutState = { ...initialLayout, lastChanged: Date.now() };
		}
	};
};

// Export the layout state
export const layoutState = createLayoutState();
