<script context="module" lang="ts">
	// Type for the dispatched event detail
	export type ViewModeDetail =
		| { mode: 'all' }
		| { mode: 'group'; method: SortMethod };
</script>

<script lang="ts">
	import { getContext, createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { clickOutside } from '$lib/actions/clickOutside';
	import type { SortMethod } from '../config';
	import { uiState } from '../store'; // Need uiState to know current sortMethod
	// REMOVED: import { selectedTab } from '../store';
	import { LAYOUT_CONTEXT_KEY, type LayoutContext } from '../layoutContext';

	// --- Props ---
	// ADDED: Prop to receive the current selected tab value ('all' or a category key)
	export let selectedTabValue: string | null;

	// Consume context for mobile styling
	const layoutContext = getContext<LayoutContext>(LAYOUT_CONTEXT_KEY);
	$: isMobileDevice = $layoutContext.isMobile;

	// Local state for dropdown visibility
	let isOpen = false;
	let buttonRef: HTMLElement;

	// Define the view options
	const viewOptions = [
		{ value: 'all', label: 'Show All', icon: '✨', isSortMethod: false },
		{ value: 'type', label: 'Group by Type', icon: '📁', isSortMethod: true },
		{ value: 'endPosition', label: 'Group by End Position', icon: '🏁', isSortMethod: true },
		{ value: 'reversals', label: 'Group by Reversals', icon: '🔄', isSortMethod: true }
	] as const;

	// Determine the currently selected view option based on props and store state
	// Use the passed prop 'selectedTabValue'
	$: currentViewValue = selectedTabValue === 'all' ? 'all' : $uiState.sortMethod;
	$: selectedViewOption =
		viewOptions.find((opt) => opt.value === currentViewValue) || viewOptions[0];

	// Event dispatcher
	const dispatch = createEventDispatcher<{ viewChange: ViewModeDetail }>();

	// Event handlers
	const toggleDropdown = () => (isOpen = !isOpen);
	const closeDropdown = () => isOpen && (isOpen = false);

	function handleViewSelect(option: (typeof viewOptions)[number]) {
		if (option.value === 'all') {
			dispatch('viewChange', { mode: 'all' });
		} else if (option.isSortMethod) {
			const method = option.value as SortMethod;
			dispatch('viewChange', { mode: 'group', method: method });
		}
		closeDropdown();
	}
</script>

<div class="view-control" use:clickOutside={closeDropdown} data-testid="view-control">
	<button
		class="view-button"
		class:mobile={isMobileDevice}
		bind:this={buttonRef}
		on:click={toggleDropdown}
		aria-label="Change view mode"
		aria-expanded={isOpen}
		aria-haspopup="listbox"
	>
		<span class="view-icon" aria-hidden="true">{selectedViewOption.icon}</span>
		{#if !isMobileDevice}
			<span class="view-text">{selectedViewOption.label}</span>
		{/if}
		<span class="dropdown-arrow" aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
	</button>

	{#if isOpen}
		<div
			class="dropdown"
			class:mobile={isMobileDevice}
			transition:fade={{ duration: 150, easing: quintOut }}
			role="listbox"
			aria-label="View options"
		>
			{#each viewOptions as option (option.value)}
				<button
					class="dropdown-item"
					class:selected={selectedViewOption.value === option.value}
					on:click={() => handleViewSelect(option)}
					role="option"
					aria-selected={selectedViewOption.value === option.value}
				>
					<span class="option-icon" aria-hidden="true">{option.icon}</span>
					<span class="option-text">{option.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Styles remain the same */
	.view-control {
		display: inline-block;
		position: relative;
	}
	.view-button {
		display: flex;
		align-items: center;
		gap: clamp(4px, 1vw, 8px);
		background-color: #ffffff;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		padding: clamp(6px, 1.4vw, 10px) clamp(12px, 2vw, 16px);
		font-size: clamp(0.85rem, 2.2vw, 0.95rem);
		font-weight: 500;
		color: #374151;
		cursor: pointer;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
		transition:
			background-color 0.2s ease,
			box-shadow 0.2s ease,
			border-color 0.2s ease;
		white-space: nowrap;
	}
	.view-button:hover {
		background-color: #f9fafb;
		border-color: #adb5bd;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.07);
	}
	.view-button:focus-visible {
		outline: 2px solid #3b82f6;
		outline-offset: 1px;
		border-color: #3b82f6;
	}
	.view-icon {
		font-size: 1.3em;
		line-height: 1;
	}
	.view-text {
		font-weight: 500;
	}
	.dropdown-arrow {
		font-size: 0.7em;
		opacity: 0.8;
		margin-left: auto;
		padding-left: 6px;
	}
	.dropdown {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		background-color: white;
		border-radius: 6px;
		border: 1px solid #e2e8f0;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
		min-width: 200px;
		width: max-content;
		z-index: 100;
		overflow: hidden;
	}
	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		text-align: left;
		padding: 12px 16px;
		border: none;
		background: none;
		cursor: pointer;
		font-size: 0.9rem;
		color: #374151;
		transition: background-color 0.15s ease;
	}
	.dropdown-item:hover {
		background-color: #f1f5f9;
	}
	.dropdown-item.selected {
		background-color: #e0f2fe;
		font-weight: 600;
		color: #0c4a6e;
	}
	.dropdown-item:focus-visible {
		background-color: #f1f5f9;
		outline: none;
	}
	.option-icon {
		font-size: 1.2rem;
		width: 1.3em;
		text-align: center;
		line-height: 1;
		color: #6b7280;
	}
	.dropdown-item.selected .option-icon {
		color: #0c4a6e;
	}
	.option-text {
		flex-grow: 1;
	}
</style>
