<script lang="ts">
	import { setContext, onMount, onDestroy, untrack, type Snippet } from 'svelte';
	import { LAYOUT_CONTEXT_KEY, type LayoutContextValue } from '../layoutContext';
	import { getResponsiveLayout, getEnhancedDeviceType } from '../utils/layoutUtils';
	import { getContainerAspect, BREAKPOINTS } from '../config';
	import { resize } from '../actions/resize';
	import type { PictographData } from '$lib/types/PictographData';
	import { optionPickerState } from '../optionPickerState.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// --- Reactive State using Svelte 5 runes ---
	// Use sensible defaults for window dimensions
	let windowWidth = $state(typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.desktop);
	let windowHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 768);

	// Initialize container dimensions with fallback values to avoid invalid dimensions
	let containerWidth = $state(
		typeof window !== 'undefined' ? Math.max(300, window.innerWidth * 0.8) : BREAKPOINTS.desktop
	);
	let containerHeight = $state(
		typeof window !== 'undefined' ? Math.max(200, window.innerHeight * 0.6) : 768
	);

	// Create reactive state for filteredOptions and groupedOptions
	let filteredOptions = $state<PictographData[]>([]);
	let groupedOptions = $state<Record<string, PictographData[]>>({});

	// Guard flag to prevent infinite loops
	let isUpdatingOptions = false;

	// Update the reactive state when the option picker state changes using $effect with guards
	$effect(() => {
		if (!isUpdatingOptions) {
			untrack(() => {
				isUpdatingOptions = true;
				filteredOptions = optionPickerState.filteredOptions;
				groupedOptions = optionPickerState.groupedOptions;
				isUpdatingOptions = false;
			});
		}
	});

	// --- Derived Layout Context ---
	// This derived value calculates layout values based on various inputs
	const layoutContextValue = $derived(() => {
		// Get the current selected tab from the option picker state
		const selectedTab = optionPickerState.lastSelectedTab[optionPickerState.sortMethod] || 'all';

		// 1. Get enhanced device info using container width (more reliable for component layout)
		const { deviceType: enhancedDeviceType, foldableInfo } = getEnhancedDeviceType(
			containerWidth > 0 ? containerWidth : windowWidth,
			windowWidth < BREAKPOINTS.tablet
		);

		// 2. Determine isMobile/isTablet BASED ON the final enhancedDeviceType
		const isMobile = enhancedDeviceType === 'smallMobile' || enhancedDeviceType === 'mobile';
		const isTablet = enhancedDeviceType === 'tablet';

		// 3. Determine portrait/aspect based on container dimensions
		const isPortrait = containerHeight > containerWidth;
		const currentContainerAspect = getContainerAspect(containerWidth, containerHeight);

		// 4. Calculate the count of items currently being displayed for layout purposes
		const optionsCount =
			selectedTab && selectedTab !== 'all' && groupedOptions && groupedOptions[selectedTab]
				? groupedOptions[selectedTab].length // Count for the specific selected tab
				: filteredOptions.length; // Count for the 'all' view

		// 5. Get the responsive layout configuration, passing foldableInfo
		const currentLayoutConfig = getResponsiveLayout(
			optionsCount,
			containerHeight,
			containerWidth,
			isMobile,
			isPortrait,
			foldableInfo // Pass the full foldable info object
		);

		// 6. Return the complete context object
		return {
			deviceType: enhancedDeviceType,
			isMobile: isMobile,
			isTablet: isTablet,
			isPortrait: isPortrait,
			containerWidth: containerWidth,
			containerHeight: containerHeight,
			ht: containerHeight, // Add missing 'ht' property
			containerAspect: currentContainerAspect,
			layoutConfig: currentLayoutConfig,
			foldableInfo: foldableInfo // IMPORTANT: Pass the full foldable info object
		};
	});

	// --- Set Context ---
	// Make the derived layout context available to child components
	// For Svelte 5 runes, we pass a getter function that returns the current value
	setContext(LAYOUT_CONTEXT_KEY, () => layoutContextValue);

	// Debounced function to update container dimensions when the container resizes
	const debouncedHandleContainerResize = (() => {
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		return (width: number, height: number) => {
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
			}

			timeoutId = setTimeout(() => {
				// Ensure we never set invalid dimensions (0 or negative values)
				// This prevents the "getResponsiveLayout called with invalid dimensions" error
				if (width > 0 && height > 0) {
					containerWidth = width;
					containerHeight = height;
				} else {
					// If we get invalid dimensions, use fallback values based on window size
					// This can happen during initial render or when container is hidden
					if (width <= 0) {
						const fallbackWidth =
							typeof window !== 'undefined'
								? Math.max(300, window.innerWidth * 0.8)
								: BREAKPOINTS.desktop;
						containerWidth = fallbackWidth;
					}

					if (height <= 0) {
						const fallbackHeight =
							typeof window !== 'undefined' ? Math.max(200, window.innerHeight * 0.6) : 768;
						containerHeight = fallbackHeight;
					}
				}
				timeoutId = null;
			}, 100);
		};
	})();

	// Update window dimensions on resize
	function updateWindowSize() {
		windowWidth = window.innerWidth;
		windowHeight = window.innerHeight;
	}

	// Set up window resize listener
	let resizeListener: (() => void) | null = null;

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', updateWindowSize);
			updateWindowSize();

			// Store the cleanup function
			resizeListener = () => {
				window.removeEventListener('resize', updateWindowSize);
			};
		}
	});

	onDestroy(() => {
		// Clean up the event listener
		if (resizeListener) {
			resizeListener();
		}
	});
</script>

<div class="layout-container" use:resize={debouncedHandleContainerResize}>
	{@render children?.()}
</div>

<style>
	.layout-container {
		width: 100%;
		height: 100%;
		position: relative;
		display: flex;
		flex-direction: column;
	}
</style>
