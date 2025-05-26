// src/lib/composables/useResponsiveLayout.ts
// MODERNIZED: NO STORES - RUNES ONLY!
import { browser } from '$app/environment';

export interface Dimensions {
	width: number;
	height: number;
}

export type LayoutMode = 'horizontal' | 'vertical';

/**
 * MODERNIZED: A composable hook for responsive layouts using runes
 * Returns reactive runes for dimensions, orientation and layout mode
 */
export function useResponsiveLayout() {
	// MODERNIZED: Use runes instead of stores - NO STORES!
	let dimensions = $state<Dimensions>({ width: 0, height: 0 });

	// Initialize and set up resize listener
	if (browser) {
		// Initial value
		dimensions = {
			width: window.innerWidth,
			height: window.innerHeight
		};

		// Update on resize
		const handleResize = () => {
			dimensions = {
				width: window.innerWidth,
				height: window.innerHeight
			};
		};

		window.addEventListener('resize', handleResize);

		// Note: Cleanup would need to be handled by the calling component
		// using onDestroy or similar lifecycle method
	}

	// MODERNIZED: Derived values using $derived - NO STORES!
	const isPortrait = $derived(dimensions.height > dimensions.width);
	const layout = $derived<LayoutMode>(isPortrait ? 'horizontal' : 'vertical');

	return {
		get dimensions() {
			return dimensions;
		},
		get isPortrait() {
			return isPortrait;
		},
		get layout() {
			return layout;
		}
	};
}
