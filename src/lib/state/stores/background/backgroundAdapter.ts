/**
 * DEPRECATED: Background Store Adapter
 *
 * This file is deprecated as we've moved to 100% Svelte 5 runes.
 * NO STORES - RUNES ONLY!
 *
 * Use the BackgroundContainer directly with pure runes.
 */

// Re-export the container for modern usage
export { backgroundContainer } from './BackgroundContainer';
export type { BackgroundState, BackgroundContainer } from './BackgroundContainer';

// All store adapters are deprecated
export function deprecatedBackgroundStore() {
	throw new Error(
		'Background store adapters are deprecated. Use backgroundContainer directly with runes.'
	);
}

// For backward compatibility, export deprecated functions
export const backgroundStore = {
	get value() {
		throw new Error('backgroundStore is deprecated. Use backgroundContainer.state directly.');
	}
};

export const currentBackgroundStore = {
	get value() {
		throw new Error(
			'currentBackgroundStore is deprecated. Use backgroundContainer.state.currentBackground directly.'
		);
	}
};

export const isBackgroundReadyStore = {
	get value() {
		throw new Error(
			'isBackgroundReadyStore is deprecated. Use backgroundContainer.state.isReady directly.'
		);
	}
};

export const isBackgroundVisibleStore = {
	get value() {
		throw new Error(
			'isBackgroundVisibleStore is deprecated. Use backgroundContainer.state.isVisible directly.'
		);
	}
};

export const backgroundQualityStore = {
	get value() {
		throw new Error(
			'backgroundQualityStore is deprecated. Use backgroundContainer.state.quality directly.'
		);
	}
};

export const availableBackgroundsStore = {
	get value() {
		throw new Error(
			'availableBackgroundsStore is deprecated. Use backgroundContainer.state.availableBackgrounds directly.'
		);
	}
};
