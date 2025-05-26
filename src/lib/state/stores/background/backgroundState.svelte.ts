/**
 * Background State Management with Svelte 5 Runes
 *
 * Modern replacement for backgroundAdapter.ts using Svelte 5 runes
 */

import type {
	BackgroundType,
	QualityLevel,
	PerformanceMetrics
} from '$lib/components/Backgrounds/types/types';

export interface BackgroundState {
	currentBackground: BackgroundType;
	isReady: boolean;
	isVisible: boolean;
	quality: QualityLevel;
	availableBackgrounds: BackgroundType[];
	performanceMetrics: PerformanceMetrics | null;
	error: Error | null;
}

/**
 * Create reactive background state with Svelte 5 runes
 */
export function createBackgroundState(initialState?: Partial<BackgroundState>) {
	let state = $state<BackgroundState>({
		currentBackground: 'snowfall',
		isReady: false,
		isVisible: true,
		quality: 'medium',
		availableBackgrounds: ['snowfall', 'nightSky', 'deepOcean'],
		performanceMetrics: null,
		error: null,
		...initialState
	});

	// Derived states
	const isLoading = $derived(!state.isReady && !state.error);
	const hasError = $derived(!!state.error);
	const performanceScore = $derived(
		state.performanceMetrics ? state.performanceMetrics.fps : 0
	);

	return {
		// State getters
		get state() {
			return state;
		},
		get currentBackground() {
			return state.currentBackground;
		},
		get isReady() {
			return state.isReady;
		},
		get isVisible() {
			return state.isVisible;
		},
		get quality() {
			return state.quality;
		},
		get availableBackgrounds() {
			return state.availableBackgrounds;
		},
		get performanceMetrics() {
			return state.performanceMetrics;
		},
		get error() {
			return state.error;
		},
		get isLoading() {
			return isLoading;
		},
		get hasError() {
			return hasError;
		},
		get performanceScore() {
			return performanceScore;
		},

		// State setters
		setBackground: (background: BackgroundType) => {
			state.currentBackground = background;
		},
		setReady: (isReady: boolean) => {
			state.isReady = isReady;
		},
		setVisible: (isVisible: boolean) => {
			state.isVisible = isVisible;
		},
		setQuality: (quality: QualityLevel) => {
			state.quality = quality;
		},
		updatePerformanceMetrics: (metrics: PerformanceMetrics) => {
			state.performanceMetrics = metrics;
		},
		setError: (error: Error | null) => {
			state.error = error;
		},
		addAvailableBackground: (background: BackgroundType) => {
			if (!state.availableBackgrounds.includes(background)) {
				state.availableBackgrounds = [...state.availableBackgrounds, background];
			}
		},
		removeAvailableBackground: (background: BackgroundType) => {
			state.availableBackgrounds = state.availableBackgrounds.filter(
				(bg) => bg !== background
			);
		},

		// Complex operations
		switchBackground: async (background: BackgroundType) => {
			state.isReady = false;
			state.error = null;
			state.currentBackground = background;
			
			// Simulate background loading
			try {
				await new Promise(resolve => setTimeout(resolve, 100));
				state.isReady = true;
			} catch (error) {
				state.error = error instanceof Error ? error : new Error('Failed to load background');
			}
		},

		adjustQualityBasedOnPerformance: () => {
			if (state.performanceMetrics) {
				const fps = state.performanceMetrics.fps;
				if (fps < 30 && state.quality !== 'low') {
					state.quality = 'low';
				} else if (fps > 50 && state.quality !== 'high') {
					state.quality = 'high';
				} else if (fps >= 30 && fps <= 50 && state.quality !== 'medium') {
					state.quality = 'medium';
				}
			}
		},

		reset: () => {
			state = {
				currentBackground: 'snowfall',
				isReady: false,
				isVisible: true,
				quality: 'medium',
				availableBackgrounds: ['snowfall', 'nightSky', 'deepOcean'],
				performanceMetrics: null,
				error: null
			};
		}
	};
}

/**
 * Global background state instance
 */
export const backgroundState = createBackgroundState();

/**
 * Reactive effects for background state
 */
export function setupBackgroundEffects() {
	// Auto-adjust quality based on performance
	$effect(() => {
		if (backgroundState.performanceMetrics) {
			backgroundState.adjustQualityBasedOnPerformance();
		}
	});

	// Log background changes
	$effect(() => {
		console.log('Background changed to:', backgroundState.currentBackground);
	});

	// Handle errors
	$effect(() => {
		if (backgroundState.error) {
			console.error('Background error:', backgroundState.error);
		}
	});
}
