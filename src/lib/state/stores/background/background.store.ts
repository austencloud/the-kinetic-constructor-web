/**
 * Background Store
 *
 * This store manages the state of backgrounds in the application.
 */

import { createStore } from '$lib/state/core';
import type {
	BackgroundType,
	QualityLevel,
	PerformanceMetrics
} from '$lib/components/Backgrounds/types/types';

// Define the store state interface
export interface BackgroundStoreState {
	currentBackground: BackgroundType;
	isReady: boolean;
	isVisible: boolean;
	quality: QualityLevel;
	performanceMetrics: PerformanceMetrics | null;
	availableBackgrounds: BackgroundType[];
	error: Error | null;
}

// Initial state
const initialState: BackgroundStoreState = {
	currentBackground: 'snowfall',
	isReady: false,
	isVisible: true,
	quality: 'medium',
	performanceMetrics: null,
	availableBackgrounds: ['snowfall', 'nightSky'],
	error: null
};

// Create the store
export const backgroundStore = createStore<
	BackgroundStoreState,
	{
		setBackground: (background: BackgroundType) => void;
		setReady: (isReady: boolean) => void;
		setVisible: (isVisible: boolean) => void;
		setQuality: (quality: QualityLevel) => void;
		updatePerformanceMetrics: (metrics: PerformanceMetrics) => void;
		setError: (error: Error | null) => void;
	}
>(
	'background',
	initialState,
	(set, update) => {
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
			}
		};
	},
	{
		persist: true,
		description: 'Manages the state of backgrounds in the application'
	}
);
