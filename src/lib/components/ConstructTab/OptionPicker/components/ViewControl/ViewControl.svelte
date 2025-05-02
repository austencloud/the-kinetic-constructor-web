<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { uiState } from '../../store';
	import type { SortMethod } from '../../config';
	import { viewOptions } from './viewOptions';
	import type { ViewModeDetail, ViewOption } from './types';
	import ViewButton from './ViewButton.svelte';
	import ViewDropdown from './ViewDropdown.svelte';

	// --- Props ---
	export let initialSortMethod: SortMethod = 'type';

	// --- State ---
	let isOpen = false;
	let selectedViewOption =
		viewOptions.find((opt) => opt.value === initialSortMethod) || viewOptions[0];

	// --- Event Handling ---
	const dispatch = createEventDispatcher<{
		viewChange: ViewModeDetail;
	}>();

	// --- Lifecycle ---
	onMount(() => {
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
	let buttonElement: HTMLButtonElement | null = null;

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

		if (option.value === 'all') {
			dispatch('viewChange', { mode: 'all' });
		} else if (option.isSortMethod) {
			const method = option.value as SortMethod;
			dispatch('viewChange', { mode: 'group', method: method });
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

<div class="view-control">
	<ViewButton bind:buttonElement {selectedViewOption} {isOpen} onClick={toggleDropdown} />

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
	}
</style>
