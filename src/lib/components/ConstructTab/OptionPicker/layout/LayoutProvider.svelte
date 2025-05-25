<script lang="ts">
	import { setContext, onMount, onDestroy } from 'svelte';
	import { writable, derived, type Readable } from 'svelte/store';
	import { LAYOUT_CONTEXT_KEY, type LayoutContextValue } from '../layoutContext';
	import { getResponsiveLayout, getEnhancedDeviceType } from '../utils/layoutUtils';
	import { getContainerAspect, BREAKPOINTS } from '../config';
	import { resize } from '../actions/resize';
	import type { PictographData } from '$lib/types/PictographData';
	import { optionPickerState } from '../optionPickerState.svelte';

	// --- State Stores ---
	// Use sensible defaults for window dimensions
	const windowWidth = writable(
		typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.desktop
	);
	const windowHeight = writable(typeof window !== 'undefined' ? window.innerHeight : 768);

	// Initialize container dimensions with fallback values to avoid invalid dimensions
	const containerWidth = writable(
		typeof window !== 'undefined' ? Math.max(300, window.innerWidth * 0.8) : BREAKPOINTS.desktop
	);
	const containerHeight = writable(
		typeof window !== 'undefined' ? Math.max(200, window.innerHeight * 0.6) : 768
	);

	// Create writable stores for filteredOptions and groupedOptions
	const filteredOptionsStore = writable<PictographData[]>([]);
	const groupedOptionsStore = writable<Record<string, PictographData[]>>({});

	// Update the writable stores when the option picker state changes using $effect
	$effect(() => {
		filteredOptionsStore.set(optionPickerState.filteredOptions);
		groupedOptionsStore.set(optionPickerState.groupedOptions);
	});

	// --- Derived Layout Context ---
	// This derived store calculates layout values based on various inputs
	const layoutContextValue: Readable<LayoutContextValue> = derived(
		[
			windowWidth,
			windowHeight,
			containerWidth,
			containerHeight,
			filteredOptionsStore,
			groupedOptionsStore
		],
		([
			$windowWidth,
			_windowHeight, // Prefix with underscore to indicate it's unused
			$containerWidth,
			$containerHeight,
			$filteredOptionsStore,
			$groupedOptionsStore
		]) => {
			// Get the current selected tab from the option picker state
			const selectedTab = optionPickerState.lastSelectedTab[optionPickerState.sortMethod] || 'all';

			// 1. Get enhanced device info using container width (more reliable for component layout)
			const { deviceType: enhancedDeviceType, foldableInfo } = getEnhancedDeviceType(
				$containerWidth > 0 ? $containerWidth : $windowWidth,
				$windowWidth < BREAKPOINTS.tablet
			);

			// 2. Determine isMobile/isTablet BASED ON the final enhancedDeviceType
			const isMobile = enhancedDeviceType === 'smallMobile' || enhancedDeviceType === 'mobile';
			const isTablet = enhancedDeviceType === 'tablet';

			// 3. Determine portrait/aspect based on container dimensions
			const isPortrait = $containerHeight > $containerWidth;
			const currentContainerAspect = getContainerAspect($containerWidth, $containerHeight);

			// 4. Calculate the count of items currently being displayed for layout purposes
			const optionsCount =
				selectedTab &&
				selectedTab !== 'all' &&
				$groupedOptionsStore &&
				$groupedOptionsStore[selectedTab]
					? $groupedOptionsStore[selectedTab].length // Count for the specific selected tab
					: $filteredOptionsStore.length; // Count for the 'all' view

			// 5. Get the responsive layout configuration, passing foldableInfo
			const currentLayoutConfig = getResponsiveLayout(
				optionsCount,
				$containerHeight,
				$containerWidth,
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
				containerWidth: $containerWidth,
				containerHeight: $containerHeight,
				ht: $containerHeight, // Add missing 'ht' property
				containerAspect: currentContainerAspect,
				layoutConfig: currentLayoutConfig,
				foldableInfo: foldableInfo // IMPORTANT: Pass the full foldable info object
			};
		}
	);

	// --- Set Context ---
	// Make the derived layout context available to child components
	setContext<Readable<LayoutContextValue>>(LAYOUT_CONTEXT_KEY, layoutContextValue);

	// --- Reactive Access to Context (Optional) ---
	// You can reactively access the context value if needed directly in this component's logic/template
	// Use $derived if needed: const context = $derived($layoutContextValue);

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
					containerWidth.set(width);
					containerHeight.set(height);
				} else {
					// If we get invalid dimensions, use fallback values based on window size
					// This can happen during initial render or when container is hidden
					if (width <= 0) {
						const fallbackWidth =
							typeof window !== 'undefined'
								? Math.max(300, window.innerWidth * 0.8)
								: BREAKPOINTS.desktop;
						containerWidth.set(fallbackWidth);
					}

					if (height <= 0) {
						const fallbackHeight =
							typeof window !== 'undefined' ? Math.max(200, window.innerHeight * 0.6) : 768;
						containerHeight.set(fallbackHeight);
					}
				}
				timeoutId = null;
			}, 100);
		};
	})();

	// Update window dimensions on resize
	function updateWindowSize() {
		windowWidth.set(window.innerWidth);
		windowHeight.set(window.innerHeight);
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
	<slot />
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
