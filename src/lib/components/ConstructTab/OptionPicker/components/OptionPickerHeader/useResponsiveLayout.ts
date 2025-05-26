// src/lib/components/ConstructTab/OptionPicker/components/OptionPickerHeader/useResponsiveLayout.ts
import { onMount } from 'svelte';

/**
 * Hook to manage responsive layout state using Svelte 5 runes
 * @param getLayoutContext The layout context getter function for Svelte 5 runes
 * @returns An object containing responsive layout state and functions
 */
export function useResponsiveLayout(getLayoutContext: (() => any) | null) {
	// Local state using Svelte 5 runes
	let isMobileDevice = $state(false);
	let useShortLabels = $state(false);
	let tabsContainerRef = $state<HTMLDivElement | null>(null);
	let isScrollable = $state(false);
	let compactMode = $state(false);
	let showScrollIndicator = $state(false);

	// Reactive reference tracking
	$effect(() => {
		// This effect runs whenever tabsContainerRef changes
		if (tabsContainerRef) {
			checkTabsOverflow();
		}
	});

	// Function to check if tabs are overflowing
	function checkTabsOverflow() {
		if (!tabsContainerRef) return;

		const { scrollWidth, clientWidth } = tabsContainerRef;
		const newIsScrollable = scrollWidth > clientWidth;
		isScrollable = newIsScrollable;

		const isNearlyOverflowing = scrollWidth > clientWidth - 20;

		if ((newIsScrollable || isNearlyOverflowing) && !compactMode) {
			compactMode = true;
			// DISABLED: Force a re-check after a short delay to see if compact mode fixed the overflow
			// setTimeout(() => {
			// 	if (tabsContainerRef) {
			// 		const { scrollWidth, clientWidth } = tabsContainerRef;
			// 		isScrollable = scrollWidth > clientWidth;
			// 		showScrollIndicator = isScrollable;
			// 	}
			// }, 50);

			// Do a direct check instead of using setTimeout
			if (tabsContainerRef) {
				const { scrollWidth, clientWidth } = tabsContainerRef;
				isScrollable = scrollWidth > clientWidth;
				showScrollIndicator = isScrollable;
			}
		}
		showScrollIndicator = newIsScrollable;
	}

	// Reactive effect for short labels
	$effect(() => {
		useShortLabels = isMobileDevice || compactMode;
	});

	onMount(() => {
		const updateMobileState = () => {
			let mobile = false;
			if (getLayoutContext) {
				const contextValue = getLayoutContext();
				if (contextValue && typeof contextValue === 'object' && 'isMobile' in contextValue) {
					mobile = Boolean(contextValue.isMobile);
				} else {
					mobile = window.innerWidth <= 640;
				}
			} else {
				mobile = window.innerWidth <= 640;
			}
			isMobileDevice = mobile;
			if (mobile) {
				compactMode = true;
			}
		};

		updateMobileState(); // Initial check

		const handleResize = () => {
			updateMobileState();
			if (tabsContainerRef) {
				checkTabsOverflow();
			}
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	// Handle scroll events to update scroll indicator
	function handleScroll() {
		if (!tabsContainerRef) return;
		const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef;
		showScrollIndicator = scrollLeft + clientWidth < scrollWidth - 10;
	}

	// Return getters for reactive state access
	return {
		get isMobileDevice() {
			return isMobileDevice;
		},
		get useShortLabels() {
			return useShortLabels;
		},
		get tabsContainerRef() {
			return tabsContainerRef;
		},
		set tabsContainerRef(value: HTMLDivElement | null) {
			tabsContainerRef = value;
		},
		get isScrollable() {
			return isScrollable;
		},
		get compactMode() {
			return compactMode;
		},
		get showScrollIndicator() {
			return showScrollIndicator;
		},
		handleScroll,
		checkTabsOverflow
	};
}
