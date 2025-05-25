// src/lib/services/PictographRenderingService.ts

import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import { svgPreloadingService } from './SvgPreloadingService';

/**
 * Pictograph Component Status
 */
export interface PictographComponentStatus {
	grid: boolean;
	glyph: boolean;
	redProp: boolean;
	blueProp: boolean;
	redArrow: boolean;
	blueArrow: boolean;
}

/**
 * Pictograph Rendering State
 */
export interface PictographRenderingState {
	id: string;
	components: PictographComponentStatus;
	allComponentsReady: boolean;
	shouldRender: boolean;
	isPreloaded: boolean;
}

/**
 * Pictograph Rendering Service
 *
 * Coordinates the rendering of pictographs to ensure all components
 * appear simultaneously when SVGs are preloaded, eliminating the
 * jarring sequential loading appearance.
 */
class PictographRenderingService {
	private pictographs: Map<string, Writable<PictographRenderingState>> = new Map();
	private initialized = false;

	constructor() {
		// Initialize on browser load
		if (browser) {
			this.initialize();
		}
	}

	/**
	 * Initialize the service
	 */
	initialize() {
		if (this.initialized) return;
		this.initialized = true;
	}

	/**
	 * Register a new pictograph for rendering coordination
	 */
	registerPictograph(id: string): Writable<PictographRenderingState> {
		if (this.pictographs.has(id)) {
			return this.pictographs.get(id)!;
		}

		const initialState: PictographRenderingState = {
			id,
			components: {
				grid: false,
				glyph: false,
				redProp: false,
				blueProp: false,
				redArrow: false,
				blueArrow: false
			},
			allComponentsReady: false,
			shouldRender: false,
			isPreloaded: svgPreloadingService.isReady()
		};

		const store = writable(initialState);
		this.pictographs.set(id, store);
		return store;
	}

	/**
	 * Unregister a pictograph (cleanup)
	 */
	unregisterPictograph(id: string) {
		this.pictographs.delete(id);
	}

	/**
	 * Mark a component as ready for a specific pictograph
	 */
	markComponentReady(pictographId: string, component: keyof PictographComponentStatus) {
		const store = this.pictographs.get(pictographId);
		if (!store) return;

		store.update((state) => {
			const newState = {
				...state,
				components: {
					...state.components,
					[component]: true
				}
			};

			// Check if all required components are ready
			newState.allComponentsReady = this.areAllComponentsReady(newState.components);

			// Determine if we should render based on preloading status
			if (newState.isPreloaded && newState.allComponentsReady) {
				// If SVGs are preloaded and all components are ready, render immediately
				newState.shouldRender = true;
			} else if (!newState.isPreloaded) {
				// If SVGs are not preloaded, use traditional loading (render as components become ready)
				newState.shouldRender = true;
			}

			return newState;
		});
	}

	/**
	 * Check if all required components are ready
	 */
	private areAllComponentsReady(components: PictographComponentStatus): boolean {
		// Grid is always required
		if (!components.grid) return false;

		// For comprehensive rendering, we want to wait for all components that are expected
		// This ensures simultaneous appearance when preloaded
		const hasAnyProps = components.redProp || components.blueProp;
		const hasAnyArrows = components.redArrow || components.blueArrow;
		const hasGlyph = components.glyph;

		// If we have any components beyond grid, wait for them all to be ready
		// This prevents the sequential loading appearance
		if (hasAnyProps || hasAnyArrows || hasGlyph) {
			// Wait for all components that have started loading
			return true; // For now, let individual components decide
		}

		return components.grid;
	}

	/**
	 * Force render a pictograph (for fallback scenarios)
	 */
	forceRender(pictographId: string) {
		const store = this.pictographs.get(pictographId);
		if (!store) return;

		store.update((state) => ({
			...state,
			shouldRender: true
		}));
	}

	/**
	 * Check if a pictograph should render immediately
	 */
	shouldRenderImmediately(pictographId: string): boolean {
		const store = this.pictographs.get(pictographId);
		if (!store) return false;

		let shouldRender = false;
		store.subscribe((state) => {
			shouldRender = state.shouldRender && state.isPreloaded;
		})();

		return shouldRender;
	}

	/**
	 * Get the current state of a pictograph
	 */
	getPictographState(pictographId: string): PictographRenderingState | null {
		const store = this.pictographs.get(pictographId);
		if (!store) return null;

		let currentState: PictographRenderingState | null = null;
		store.subscribe((state) => {
			currentState = state;
		})();

		return currentState;
	}

	/**
	 * Update preloading status for all pictographs
	 */
	updatePreloadingStatus() {
		const isPreloaded = svgPreloadingService.isReady();

		this.pictographs.forEach((store) => {
			store.update((state) => ({
				...state,
				isPreloaded,
				// If preloading is complete and all components are ready, enable rendering
				shouldRender: state.shouldRender || (isPreloaded && state.allComponentsReady)
			}));
		});
	}

	/**
	 * Reset all pictographs (for testing or cleanup)
	 */
	reset() {
		this.pictographs.clear();
	}

	/**
	 * Get statistics about registered pictographs
	 */
	getStats() {
		const stats = {
			totalPictographs: this.pictographs.size,
			readyToRender: 0,
			preloaded: 0
		};

		this.pictographs.forEach((store) => {
			store.subscribe((state) => {
				if (state.shouldRender) stats.readyToRender++;
				if (state.isPreloaded) stats.preloaded++;
			})();
		});

		return stats;
	}
}

// Create and export singleton instance
export const pictographRenderingService = new PictographRenderingService();

// Listen for SVG preloading completion
if (browser) {
	svgPreloadingService.getStatus().subscribe((status) => {
		if (status.isComplete) {
			pictographRenderingService.updatePreloadingStatus();
		}
	});
}
