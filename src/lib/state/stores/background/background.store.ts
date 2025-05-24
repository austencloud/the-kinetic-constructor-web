/**
 * Background Store
 *
 * @deprecated This file is deprecated and will be removed in a future version.
 * Use backgroundStore from '$lib/state/stores/background/backgroundAdapter' instead.
 *
 * This store manages the state of backgrounds in the application.
 */

import {
	backgroundStore as modernBackgroundStore,
	type BackgroundState
} from './backgroundAdapter';



// Re-export the type with the old name for backward compatibility
export type BackgroundStoreState = BackgroundState;

// Re-export the store
export const backgroundStore = modernBackgroundStore;
