/**
 * Modern Background Container
 *
 * This module provides a modern container-based implementation for managing
 * background state in the application.
 */

import { createContainer } from '$lib/state/core/container.svelte';
import type {
	BackgroundType,
	QualityLevel,
	PerformanceMetrics
} from '$lib/components/Backgrounds/types/types';
import { browser } from '$app/environment';

// Define the container state interface
export interface BackgroundState {
	currentBackground: BackgroundType;
	isReady: boolean;
	isVisible: boolean;
	quality: QualityLevel;
	performanceMetrics: PerformanceMetrics | null;
	availableBackgrounds: BackgroundType[];
	error: Error | null;
}

// Initial state
const initialState: BackgroundState = {
	currentBackground: 'snowfall',
	isReady: false,
	isVisible: true,
	quality: 'medium',
	performanceMetrics: null,
	availableBackgrounds: ['snowfall', 'nightSky', 'deepOcean'],
	error: null
};

// Load persisted state from localStorage if available
function loadPersistedState(): Partial<BackgroundState> {
	if (!browser) return {};

	try {
		const persisted = localStorage.getItem('background_state');
		if (persisted) {
			return JSON.parse(persisted);
		}
	} catch (error) {
		console.error('Failed to load persisted background state:', error);
	}

	return {};
}

// Merge initial state with persisted state
const mergedInitialState: BackgroundState = {
	...initialState,
	...loadPersistedState()
};

/**
 * Create the background container
 */
export const backgroundContainer = createContainer(mergedInitialState, (state, update) => {
	return {
		setBackground: (background: BackgroundType) => {
			update((state) => {
				// Validate background type
				if (!state.availableBackgrounds.includes(background)) {
					console.warn(`Invalid background type: ${background}. Using default.`);
					return state;
				}

				return {
					...state,
					currentBackground: background,
					isReady: false // Reset ready state when changing background
				};
			});
		},

		setReady: (isReady: boolean) => {
			update((state) => ({
				...state,
				isReady
			}));
		},

		setVisible: (isVisible: boolean) => {
			update((state) => ({
				...state,
				isVisible
			}));
		},

		setQuality: (quality: QualityLevel) => {
			update((state) => ({
				...state,
				quality
			}));
		},

		updatePerformanceMetrics: (metrics: PerformanceMetrics) => {
			update((state) => ({
				...state,
				performanceMetrics: metrics
			}));
		},

		setError: (error: Error | null) => {
			update((state) => ({
				...state,
				error
			}));
		},

		addAvailableBackground: (background: BackgroundType) => {
			update((state) => {
				if (state.availableBackgrounds.includes(background)) {
					return state;
				}

				return {
					...state,
					availableBackgrounds: [...state.availableBackgrounds, background]
				};
			});
		},

		removeAvailableBackground: (background: BackgroundType) => {
			update((state) => {
				if (!state.availableBackgrounds.includes(background)) {
					return state;
				}

				return {
					...state,
					availableBackgrounds: state.availableBackgrounds.filter((bg) => bg !== background)
				};
			});
		}
	};
});

// Set up state persistence after container creation to avoid circular dependency
if (browser) {
	const saveState = () => {
		try {
			const currentState = backgroundContainer.state;
			localStorage.setItem(
				'background_state',
				JSON.stringify({
					currentBackground: currentState.currentBackground,
					isVisible: currentState.isVisible,
					quality: currentState.quality
				})
			);
		} catch (error) {
			console.error('Failed to save background state:', error);
		}
	};

	// Set up a reactive effect to save state changes - NO STORES!
	$effect(() => {
		// Watch for any changes in the background container state
		backgroundContainer.state;
		saveState();
	});
}

// Export types
export type BackgroundContainer = typeof backgroundContainer;
