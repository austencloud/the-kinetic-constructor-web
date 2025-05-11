<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { uiState } from '../../store';
	import type { SortMethod } from '../../config';
	import { viewOptions } from './viewOptions';
	import type { ViewModeDetail, ViewOption } from './types';
	import ViewButton from './ViewButton.svelte';
	import ViewDropdown from './ViewDropdown.svelte';

	// --- Props ---
	const props = $props<{
		initialSortMethod?: SortMethod;
		compact?: boolean;
	}>();

	// --- State ---
	let isOpen = $state(false);
	// Always default to the "All" view option initially
	let selectedViewOption = $state<ViewOption>(
		viewOptions.find((opt) => opt.value === 'all') || viewOptions[0]
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
		// Subscribe to UI state to keep the selected option in sync
		const unsubscribe = uiState.subscribe((state) => {
			if (state.sortMethod !== selectedViewOption.value && selectedViewOption.isSortMethod) {
				selectedViewOption =
					viewOptions.find((opt) => opt.value === state.sortMethod) || viewOptions[0];
			}
		});

		// Add click outside listener
		document.addEventListener('click', handleClickOutside);

		return () => {
			unsubscribe();
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

		// Create a DOM event that will bubble up
		const customEvent = new CustomEvent('viewchange', {
			detail,
			bubbles: true,
			composed: true
		});

		// Dispatch the event from the document to ensure it's captured by the global listener
		document.dispatchEvent(customEvent);

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
