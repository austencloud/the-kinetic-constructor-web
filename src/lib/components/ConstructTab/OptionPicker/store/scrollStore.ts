// src/lib/components/ConstructTab/OptionPicker/store/scrollStore.ts - Modern Non-Runes Store

// Simple state management without runes (since this is a .ts file)
let scrollPositions: Record<string, number> = {};

// Helper functions for managing scroll positions
export function setScrollPosition(key: string, position: number) {
	scrollPositions[key] = position;
}

export function getScrollPosition(key: string): number {
	return scrollPositions[key] || 0;
}

export function clearScrollPosition(key: string) {
	delete scrollPositions[key];
}

export function clearAllScrollPositions() {
	scrollPositions = {};
}

/**
 * Helper functions for managing scroll positions
 */
export const scrollActions = {
	/**
	 * Save the scroll position for a specific key
	 * @param key Unique identifier (usually tab name)
	 * @param position Scroll position to save
	 */
	savePosition(key: string, position: number) {
		setScrollPosition(key, position);
	},

	/**
	 * Get the saved scroll position for a specific key
	 * @param key Unique identifier (usually tab name)
	 * @returns The saved scroll position or 0 if not found
	 */
	getPosition(key: string): number {
		return getScrollPosition(key);
	},

	/**
	 * Restore the scroll position for an element
	 * @param element The DOM element to scroll
	 * @param key Unique identifier (usually tab name)
	 * @param delay Optional delay before restoring (default: 50ms)
	 */
	restorePosition(element: HTMLElement | null, key: string, delay: number = 50) {
		if (!element) return;

		const savedPosition = this.getPosition(key);
		setTimeout(() => {
			if (element) {
				element.scrollTop = savedPosition;
			}
		}, delay);
	},

	/**
	 * Clear all saved scroll positions
	 */
	clearAll() {
		clearAllScrollPositions();
	}
};
