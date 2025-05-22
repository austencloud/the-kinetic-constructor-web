<!-- src/lib/components/ConstructTab/OptionPicker/components/ViewControl/ViewControlContainer.svelte -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { SortMethod } from '../../config';
	import ViewButton from './ViewButton.svelte';
	import ViewDropdown from './ViewDropdown.svelte';
	import { viewOptions } from './viewOptions';
	import type { ViewOption } from './types';

	// --- Props ---
	const props = $props<{
		initialSortMethod?: SortMethod;
		compact?: boolean;
	}>();

	// --- State ---
	let isOpen = $state(false);
	let selectedViewOption = $state<ViewOption>(viewOptions[0]);
	let buttonElement = $state<HTMLButtonElement | null>(null);
	let isCompact = $state(props.compact || false);

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

	// --- Dropdown Management ---
	function toggleDropdown() {
		isOpen = !isOpen;

		// Add haptic feedback on mobile devices when opening
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

	// --- Option Selection ---
	function handleViewSelect(option: ViewOption) {
		selectedViewOption = option;
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

	// Clean up event listeners
	onDestroy(() => {
		document.removeEventListener('click', () => {});
		document.removeEventListener('update-view-control', () => {});
		document.removeEventListener('option-picker-update', () => {});
	});
</script>

<div
	class="view-control"
	class:compact={isCompact}
	class:dropdown-open={isOpen}
	id="view-control-container"
>
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

	/* Add a z-index boost when the dropdown is open */
	.view-control.dropdown-open {
		z-index: 1000;
	}
</style>
