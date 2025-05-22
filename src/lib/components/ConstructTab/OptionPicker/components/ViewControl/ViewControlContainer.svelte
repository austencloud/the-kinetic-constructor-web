<!-- src/lib/components/ConstructTab/OptionPicker/components/ViewControl/ViewControlContainer.svelte -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { SortMethod } from '../../config';
	import ViewButton from './ViewButton.svelte';
	import ViewDropdown from './ViewDropdown.svelte';
	import { viewOptions } from './viewOptions';
	import { initializeViewControlState, handleViewSelect } from './ViewControlState.svelte';
	import {
		setupEventListeners,
		handleKeydown,
		setupStateEffects
	} from './ViewControlEvents.svelte';
	import { initializeViewControl, initializeCompactMode } from './ViewControlInitialization.svelte';

	// --- Props ---
	const props = $props<{
		initialSortMethod?: SortMethod;
		compact?: boolean;
	}>();

	// --- Initialize State ---
	const state = initializeViewControlState();

	// --- Initialization ---
	// Initialize the ViewControl component
	initializeViewControl(state);

	// Initialize compact mode based on props and window size
	initializeCompactMode(state, props.compact);

	// Set up state effects to sync UI with container state
	setupStateEffects(state);

	// --- Event Listeners ---
	// Set up event listeners for the ViewControl component
	setupEventListeners(state);

	// --- Dropdown Management ---
	function toggleDropdown() {
		// Simply toggle the state
		state.isOpen = !state.isOpen;

		// Add haptic feedback on mobile devices when opening
		if (state.isOpen && 'vibrate' in window.navigator) {
			try {
				window.navigator.vibrate(50);
			} catch (e) {
				// Ignore errors if vibration is not supported
			}
		}
	}

	function closeDropdown() {
		state.isOpen = false;
	}

	// --- Option Selection ---
	function handleViewSelectWrapper(option: any) {
		handleViewSelect(option, state, closeDropdown);
	}

	// --- Keyboard Navigation ---
	function handleKeydownWrapper(event: KeyboardEvent) {
		handleKeydown(event, state, closeDropdown, handleViewSelectWrapper);
	}

	// This onDestroy is redundant with the cleanup in the $effect above
	// But we keep it as a safety measure
	onDestroy(() => {
		document.removeEventListener('click', () => {});
		document.removeEventListener('update-view-control', () => {});
		document.removeEventListener('option-picker-update', () => {});
	});
</script>

<div
	class="view-control"
	class:compact={state.isCompact}
	class:dropdown-open={state.isOpen}
	id="view-control-container"
>
	<ViewButton
		selectedViewOption={state.selectedViewOption}
		isOpen={state.isOpen}
		onClick={toggleDropdown}
		compact={state.isCompact}
		onButtonRef={(element) => (state.buttonElement = element)}
	/>

	<ViewDropdown
		isOpen={state.isOpen}
		selectedViewOption={state.selectedViewOption}
		{viewOptions}
		onSelect={handleViewSelectWrapper}
		onKeydown={handleKeydownWrapper}
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
