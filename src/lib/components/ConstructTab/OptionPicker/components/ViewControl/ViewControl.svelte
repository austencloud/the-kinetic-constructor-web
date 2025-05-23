<script lang="ts">
	import { onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import type { SortMethod } from '../../config';
	import { viewOptions } from './viewOptions';
	import type { ViewModeDetail, ViewOption } from './types';
	import ViewButton from './ViewButton.svelte';
	import ViewDropdown from './ViewDropdown.svelte';
	import { actions, uiState, groupedOptionsStore, type SortMethodOrAll } from '../../store'; // Use working store instead

	// --- Props using Svelte 5 runes ---
	const {
		initialSortMethod,
		compact = false,
		onviewChange
	} = $props<{
		initialSortMethod?: SortMethod;
		compact?: boolean;
		onviewChange?: (event: CustomEvent<ViewModeDetail>) => void;
	}>();

	// --- State ---
	let isOpen = $state(false);
	// Initialize with the current sort method from the store
	let selectedViewOption = $state<ViewOption>(
		viewOptions.find((opt) => opt.value === $uiState.sortMethod) ||
			viewOptions.find((opt) => opt.value === 'all') ||
			viewOptions[0]
	);
	let buttonElement = $state<HTMLButtonElement | null>(null);
	let isCompact = $state(false);

	// Update compact mode based on props and window size
	$effect(() => {
		// Force compact mode on mobile devices
		const isMobile = window.innerWidth <= 640;
		isCompact = compact || isMobile || false;

		// Add resize listener to update compact mode when window size changes
		const handleResize = () => {
			const isMobile = window.innerWidth <= 640;
			isCompact = compact || isMobile || false;
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	// --- Lifecycle ---
	$effect(() => {
		// Keep the selected option in sync with the store state
		const currentSortMethod = $uiState.sortMethod;
		const currentSelectedTab = $uiState.lastSelectedTab[currentSortMethod] || 'all';

		// Always update the selectedViewOption to match the current sorting state
		if (currentSelectedTab === 'all') {
			// If we're showing all, select the "All" option
			const allOption = viewOptions.find((opt) => opt.value === 'all');
			if (allOption && selectedViewOption.value !== 'all') {
				selectedViewOption = allOption;
			}
		} else if (currentSortMethod !== selectedViewOption.value) {
			// If we're using a specific sort method, find the matching option
			const methodOption = viewOptions.find((opt) => opt.value === currentSortMethod);
			if (methodOption) {
				selectedViewOption = methodOption;
			}
		}

		// Add click outside listener
		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	onDestroy(() => {
		document.removeEventListener('click', handleClickOutside);
	});

	// --- Dropdown Management ---
	function toggleDropdown() {
		isOpen = !isOpen;

		// Add haptic feedback on mobile devices
		if (isOpen && 'vibrate' in window.navigator) {
			try {
				window.navigator.vibrate(50);
			} catch (e) {
				// Ignore errors if vibration is not supported
			}
		}
	}

	function closeDropdown() {
		isOpen = false;
	}

	function handleClickOutside(event: MouseEvent) {
		if (isOpen && buttonElement && !buttonElement.contains(event.target as Node)) {
			closeDropdown();
		}
	}

	// --- Option Selection ---
	function handleViewSelect(option: ViewOption) {
		selectedViewOption = option;

		// Add haptic feedback on mobile devices
		if ('vibrate' in window.navigator) {
			try {
				window.navigator.vibrate(50);
			} catch (e) {
				// Ignore errors if vibration is not supported
			}
		}

		// Create the event detail
		const detail: ViewModeDetail =
			option.value === 'all'
				? { mode: 'all' }
				: { mode: 'group', method: option.value as SortMethod };

		console.log('ViewControl: handleViewSelect called with option:', option.value);

		// Update the store state directly
		if (option.value === 'all') {
			// For "Show All" view, we need to set the sort method to 'all'
			// This is critical for the UI to know we're in "Show All" mode
			console.log('ViewControl: Setting "all" view');

			// First update the sort method to ensure we're in the right mode
			actions.setSortMethod('all');

			// DISABLED: Force a UI update by dispatching a custom event
			// const showAllEvent = new CustomEvent('show-all-view', {
			// 	detail: { sortMethod: 'all' },
			// 	bubbles: true
			// });
			// document.dispatchEvent(showAllEvent);

			console.log('ViewControl: Event dispatching disabled to prevent reactivity loops');

			// Set the last selected tab to 'all' for all sort methods
			// This ensures proper display when switching back to other views
			['type', 'endPos', 'reversals'].forEach((method) => {
				actions.setLastSelectedTabForSort(method as SortMethod, 'all');
			});
		} else {
			// For other views, update the sort method
			console.log('ViewControl: Setting sort method to:', option.value);
			actions.setSortMethod(option.value as SortMethod);

			// Get the last selected tab for this sort method
			const lastSelectedTab = $uiState.lastSelectedTab[option.value as SortMethod];
			console.log('ViewControl: Last selected tab for this sort method:', lastSelectedTab);

			// If there's no last selected tab or it's 'all', we need to select the first tab
			// This ensures the tabs are displayed properly
			if (!lastSelectedTab || lastSelectedTab === 'all') {
				console.log('ViewControl: No last selected tab, will select first available tab');

				// DISABLED: Force a UI update by dispatching a custom event
				// const forceUpdateEvent = new CustomEvent('force-update-tabs', {
				// 	detail: { sortMethod: option.value },
				// 	bubbles: true
				// });
				// document.dispatchEvent(forceUpdateEvent);

				console.log('ViewControl: Event dispatching disabled to prevent reactivity loops');

				// DISABLED: We'll select the first tab in the next tick after the UI updates
				// setTimeout(() => {
				// 	// Get the grouped options for this sort method
				// 	const groupedOptions = get(groupedOptionsStore);
				// 	console.log('ViewControl: Grouped options:', groupedOptions);
				//
				// 	if (groupedOptions && Object.keys(groupedOptions).length > 0) {
				// 		// Get the first category key
				// 		const firstCategoryKey = Object.keys(groupedOptions)[0];
				// 		console.log('ViewControl: Selecting first category key:', firstCategoryKey);
				//
				// 		// Set the last selected tab to the first category key
				// 		actions.setLastSelectedTabForSort(option.value as SortMethod, firstCategoryKey);
				// 	} else {
				// 		console.log('ViewControl: No grouped options available');
				// 	}
				// }, 100);

				// Do a direct update instead of using setTimeout
				// Get the grouped options for this sort method
				const groupedOptions = get(groupedOptionsStore);
				console.log('ViewControl: Grouped options:', groupedOptions);

				if (groupedOptions && Object.keys(groupedOptions).length > 0) {
					// Get the first category key
					const firstCategoryKey = Object.keys(groupedOptions)[0];
					console.log('ViewControl: Selecting first category key:', firstCategoryKey);

					// Set the last selected tab to the first category key
					actions.setLastSelectedTabForSort(option.value as SortMethod, firstCategoryKey);
				} else {
					console.log('ViewControl: No grouped options available');
				}
			}
		}

		// DISABLED: Create a DOM event that will bubble up
		// const customEvent = new CustomEvent('viewChange', {
		// 	detail,
		// 	bubbles: true,
		// 	composed: true
		// });
		//
		// // Call the Svelte 5 callback if provided
		// if (onviewChange) {
		// 	onviewChange(customEvent);
		// }
		//
		// // Also dispatch the event from the button element if available (for compatibility)
		// if (buttonElement) {
		// 	console.log('Dispatching viewChange event with detail:', detail);
		// 	buttonElement.dispatchEvent(customEvent);
		// } else {
		// 	// Fallback to dispatching from the document
		// 	console.warn('Button element not available, using document for event dispatch');
		// 	document.dispatchEvent(customEvent);
		// }

		console.log('ViewControl: Event dispatching disabled to prevent reactivity loops');

		closeDropdown();
	}

	// --- Keyboard Navigation ---
	function handleKeydown(event: KeyboardEvent) {
		if (!isOpen) return;

		const currentIndex = viewOptions.findIndex((opt) => opt.value === selectedViewOption.value);
		let newIndex = currentIndex;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				newIndex = (currentIndex + 1) % viewOptions.length;
				break;
			case 'ArrowUp':
				event.preventDefault();
				newIndex = (currentIndex - 1 + viewOptions.length) % viewOptions.length;
				break;
			case 'Home':
				event.preventDefault();
				newIndex = 0;
				break;
			case 'End':
				event.preventDefault();
				newIndex = viewOptions.length - 1;
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				handleViewSelect(selectedViewOption);
				return;
			case 'Escape':
				event.preventDefault();
				closeDropdown();
				return;
			case 'Tab':
				// Let Tab work normally, but close the dropdown
				closeDropdown();
				return;
			default:
				// Handle first-letter navigation
				const key = event.key.toLowerCase();
				const matchingOption = viewOptions.find((opt) => opt.label.toLowerCase().startsWith(key));
				if (matchingOption) {
					event.preventDefault();
					newIndex = viewOptions.findIndex((opt) => opt.value === matchingOption.value);
				}
				break;
		}

		if (newIndex !== currentIndex) {
			selectedViewOption = viewOptions[newIndex];
		}
	}
</script>

<div class="view-control" class:compact={isCompact} data-sort-method={selectedViewOption.value}>
	<ViewButton
		{selectedViewOption}
		{isOpen}
		onClick={toggleDropdown}
		compact={isCompact}
		onButtonRef={(element) => (buttonElement = element)}
	/>

	<ViewDropdown
		{isOpen}
		{selectedViewOption}
		{viewOptions}
		onSelect={handleViewSelect}
		onKeydown={handleKeydown}
	/>
</div>

<style>
	.view-control {
		display: inline-block;
		position: relative;
		font-size: 1.1rem;
		z-index: 10;
		transition: all 0.3s ease;
	}

	.view-control.compact {
		font-size: 1rem;
		min-width: 36px;
		max-width: 36px;
	}
</style>
