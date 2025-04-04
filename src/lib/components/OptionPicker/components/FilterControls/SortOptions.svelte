<script lang="ts">
	import { optionPickerStore, type SortMethod } from '../../stores/optionPickerStore';
	import { fade } from 'svelte/transition';
	import { clickOutside } from '$lib/actions/clickOutside';

	// --- Props ---
	export let isMobileDevice: boolean = false;

	// --- State ---
	let isOpen = false; // Controls dropdown visibility
	let buttonRef: HTMLElement; // Reference to the button for positioning/actions

	// --- Data ---
	// Define available sorting options with associated metadata
	const sortOptions = [
		{ value: 'type', label: 'Sort by Type', icon: '📁' }, // Using folder icon for type
		{ value: 'endPosition', label: 'Sort by End Position', icon: '🏁' },
		{ value: 'reversals', label: 'Sort by Reversals', icon: '🔄' }
	] as const; // Use 'as const' for stricter typing on 'value'

	// --- Reactive Computations ---
	// Get the currently selected sort method directly from the store
	$: selectedSortMethod = $optionPickerStore.sortMethod;

	// Find the icon corresponding to the currently selected sort method
	$: selectedOptionIcon =
		sortOptions.find((opt) => opt.value === selectedSortMethod)?.icon ?? sortOptions[0].icon;

	// --- Event Handlers ---
	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function closeDropdown() {
		isOpen = false;
	}

	function handleSort(method: SortMethod) {
		optionPickerStore.setSortMethod(method); // Update the store
		closeDropdown(); // Close dropdown after selection
	}
</script>

<div class="sort-options" class:mobile={isMobileDevice} use:clickOutside={closeDropdown}>
	<button
		class="sort-button"
		class:mobile={isMobileDevice}
		bind:this={buttonRef}
		on:click={toggleDropdown}
		aria-label="Change sorting method"
		aria-expanded={isOpen}
		aria-haspopup="listbox"
	>
		<span class="sort-icon" aria-hidden="true">{selectedOptionIcon}</span>
		{#if !isMobileDevice}
			<span class="sort-text">Sort</span>
		{/if}
		<span class="dropdown-arrow" aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
	</button>

	{#if isOpen}
		<div
			class="dropdown"
			class:mobile={isMobileDevice}
			transition:fade={{ duration: 150 }}
			role="listbox"
			aria-label="Sorting options"
		>
			{#each sortOptions as option (option.value)}
				<button
					class="dropdown-item"
					class:selected={selectedSortMethod === option.value}
					on:click={() => handleSort(option.value)}
					role="option"
					aria-selected={selectedSortMethod === option.value}
				>
					<span class="option-icon" aria-hidden="true">{option.icon}</span>
					<span class="option-text">{option.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.sort-options {
		/* REMOVED: position, top, left, z-index */
		/* These are now controlled by OptionPicker.svelte */
		/* Keep display or other properties if needed, but position is handled externally */
		display: inline-block; /* Or block, depending on desired flow */
	}


	.sort-button {
		display: flex;
		align-items: center;
		gap: 6px; /* Space between elements */
		background-color: #ffffff;
		border: 1px solid #e2e8f0; /* Tailwind gray-200 */
		border-radius: 6px;
		padding: 8px 12px;
		font-size: 0.9rem; /* Slightly smaller */
		font-weight: 500;
		color: #374151; /* Tailwind gray-700 */
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		transition:
			background-color 0.2s ease,
			box-shadow 0.2s ease;
	}

	.sort-button.mobile {
		padding: 6px 10px;
		gap: 4px;
	}

	.sort-button:hover {
		background-color: #f9fafb; /* Tailwind gray-50 */
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	}

	.sort-button:focus-visible {
		outline: 2px solid #4299e1; /* Focus ring */
		outline-offset: 1px;
	}

	.sort-icon {
		font-size: 1.1em; /* Relative size */
		line-height: 1; /* Prevent extra space */
	}

	.dropdown-arrow {
		font-size: 0.7em;
		opacity: 0.7;
		margin-left: auto; /* Push arrow to the right if space allows */
		padding-left: 4px;
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 6px); /* Position below the button */
		/* Changed left: 0 to right: 0 to align dropdown with the button on the right */
		right: 0;
		background-color: white;
		border-radius: 6px;
		border: 1px solid #e2e8f0;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		min-width: 200px; /* Slightly wider */
		z-index: 100; /* Above other elements */
		overflow: hidden;
	}

	.dropdown.mobile {
		min-width: 180px;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		text-align: left;
		padding: 10px 14px; /* Slightly more padding */
		border: none;
		background: none;
		cursor: pointer;
		font-size: 0.9rem;
		color: #374151;
		transition: background-color 0.15s ease;
	}

	.dropdown-item:hover {
		background-color: #f1f5f9; /* Tailwind slate-100 */
	}

	.dropdown-item.selected {
		background-color: #e5e7eb; /* Tailwind gray-200 */
		font-weight: 600; /* Bolder selected item */
		color: #1f2937; /* Tailwind gray-800 */
	}

	.dropdown-item:focus-visible {
		background-color: #f1f5f9;
		outline: none;
	}

	.option-icon {
		font-size: 1.1rem;
		width: 1.2em; /* Ensure alignment */
		text-align: center;
		line-height: 1;
	}
	.option-text {
		flex-grow: 1; /* Take remaining space */
	}
</style>
