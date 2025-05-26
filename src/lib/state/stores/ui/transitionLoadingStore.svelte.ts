/**
 * Transition Loading State - MODERNIZED WITH RUNES
 *
 * Pure Svelte 5 runes implementation for managing loading state during transitions.
 * NO STORES - RUNES ONLY!
 */

// Create reactive loading state with PURE RUNES - NO STORES!
let _transitionLoadingState = $state(false);

// Export getter function for the state
export function getTransitionLoadingState(): boolean {
	return _transitionLoadingState;
}

// Pure runes-based actions - NO STORES!
export const transitionLoading = {
	/**
	 * Start the loading state
	 */
	start: () => {
		_transitionLoadingState = true;
	},

	/**
	 * End the loading state
	 */
	end: () => {
		_transitionLoadingState = false;
	},

	/**
	 * Toggle the loading state
	 */
	toggle: () => {
		_transitionLoadingState = !_transitionLoadingState;
	}
};

// For backward compatibility, export the state directly
export const transitionLoadingStore = {
	get value() {
		return _transitionLoadingState;
	},
	set value(newValue: boolean) {
		_transitionLoadingState = newValue;
	}
};

export default transitionLoading;
