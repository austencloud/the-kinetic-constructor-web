<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { SortMethod } from '../../config';
	import { viewOptions } from './viewOptions';
	import type { ViewModeDetail, ViewOption } from './types';
	import ViewButton from './ViewButton.svelte';
	import ViewDropdown from './ViewDropdown.svelte';
	import { optionPickerContainer } from '$lib/state/stores/optionPicker/optionPickerContainer';

	// --- Props ---
	const props = $props<{
		initialSortMethod?: SortMethod;
		compact?: boolean;
	}>();

	// --- State ---
	let isOpen = $state(false);
	// Initialize with the current sort method from the container
	let selectedViewOption = $state<ViewOption>(
		viewOptions.find((opt) => opt.value === optionPickerContainer.state.sortMethod) ||
			viewOptions.find((opt) => opt.value === 'all') ||
			viewOptions[0]
	);
	let buttonElement = $state<HTMLButtonElement | null>(null);
	let isCompact = $state(false);

	// Update compact mode based on props and window size
	$effect(() => {
		// Force compact mode on mobile devices
		const isMobile = window.innerWidth <= 640;
		isCompact = props.compact || isMobile || false;

		// Add resize listener to update compact mode when window size changes
		const handleResize = () => {
			const isMobile = window.innerWidth <= 640;
			isCompact = props.compact || isMobile || false;
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	// --- Lifecycle ---
	$effect(() => {
		// Keep the selected option in sync with the container state
		const currentSortMethod = optionPickerContainer.state.sortMethod;

		// Always update the selectedViewOption to match the current sort method
		// This ensures the UI always reflects the actual sorting state
		if (currentSortMethod !== selectedViewOption.value) {
			// If current sort method is not 'all' (which is the default), find the matching option
			if (currentSortMethod) {
				selectedViewOption =
					viewOptions.find((opt) => opt.value === currentSortMethod) ||
					viewOptions.find((opt) => opt.value === 'all') ||
					viewOptions[0];
			} else {
				// If no sort method is set (or it's null/undefined), default to 'all'
				selectedViewOption = viewOptions.find((opt) => opt.value === 'all') || viewOptions[0];
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

		// Update the optionPickerContainer state directly
		// This ensures the container state is always in sync with the UI
		if (option.value !== 'all') {
			// Only update the sort method if it's a valid sort method
			optionPickerContainer.setSortMethod(option.value as SortMethod);
		}

		// Create a DOM event that will bubble up
		const customEvent = new CustomEvent('viewChange', {
			detail,
			bubbles: true,
			composed: true
		});

		// Dispatch the event from the button element if available
		if (buttonElement) {
			console.log('Dispatching viewChange event with detail:', detail);
			buttonElement.dispatchEvent(customEvent);
		} else {
			// Fallback to dispatching from the document
			console.warn('Button element not available, using document for event dispatch');
			document.dispatchEvent(customEvent);
		}

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

<div class="view-control" class:compact={isCompact}>
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