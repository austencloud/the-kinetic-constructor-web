<script context="module" lang="ts">
	export type ViewModeDetail = { mode: 'all' } | { mode: 'group'; method: SortMethod };
</script>

<script lang="ts">
	// Import from svelte to fix deprecation warning
	import { getContext } from 'svelte';
	// Use regular import instead of internal to avoid TS errors
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { clickOutside } from '$lib/actions/clickOutside';
	import type { SortMethod } from '../config';
	import { uiState } from '../store';
	import { LAYOUT_CONTEXT_KEY, type LayoutContext } from '../layoutContext';

	export let selectedTab: string | null;

	// UI state
	let isOpen = false;
	let buttonRef: HTMLElement;
	let dropdownRef: HTMLElement | null = null;

	// Enhanced view options with better icons and descriptions
	const viewOptions = [
		{
			value: 'all',
			label: 'All',
			icon: '✨',
			isSortMethod: false,
			description: 'Show all valid options'
		},
		{
			value: 'type',
			label: 'Type',
			icon: '📁',
			isSortMethod: true,
			description: 'Group options by type'
		},
		{
			value: 'endPosition',
			label: 'End',
			icon: '🏁',
			isSortMethod: true,
			description: 'Group by ending position'
		},
		{
			value: 'reversals',
			label: 'Reversals',
			icon: '🔄',
			isSortMethod: true,
			description: 'Group by reversals'
		}
	] as const;

	$: currentViewValue = selectedTab === 'all' ? 'all' : $uiState.sortMethod;
	$: selectedViewOption =
		viewOptions.find((opt) => opt.value === currentViewValue) || viewOptions[0];

	// Create event dispatcher for view changes
	const dispatch = createEventDispatcher<{ viewChange: ViewModeDetail }>();

	// Toggle dropdown visibility with animation timing
	const toggleDropdown = () => {
		isOpen = !isOpen;

		// If opening, set focus on the dropdown container instead of the first item
		// This prevents the first item from appearing selected by default
		if (isOpen) {
			// Wait for the dropdown to be rendered and bound
			setTimeout(() => {
				if (dropdownRef) {
					// Focus on the dropdown container itself
					dropdownRef.focus();
				}
			}, 50);
		}
	};

	// Close dropdown with focus management
	const closeDropdown = () => {
		if (isOpen) {
			isOpen = false;
			// Return focus to button for better accessibility
			if (buttonRef) setTimeout(() => buttonRef.focus(), 50);
		}
	};

	// Enhanced view selection with better feedback
	function handleViewSelect(option: (typeof viewOptions)[number]) {
		// Add haptic feedback if available
		if (window.navigator && 'vibrate' in window.navigator) {
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

	// Handle keyboard navigation for accessibility
	const handleKeydown = (event: KeyboardEvent) => {
		if (!isOpen) return;

		const items = dropdownRef?.querySelectorAll('button') || [];
		const currentIndex = Array.from(items).findIndex((item) => item === document.activeElement);

		switch (event.key) {
			case 'Escape':
				event.preventDefault();
				closeDropdown();
				break;
			case 'ArrowDown':
				event.preventDefault();
				if (currentIndex < items.length - 1) {
					(items[currentIndex + 1] as HTMLElement).focus();
				}
				break;
			case 'ArrowUp':
				event.preventDefault();
				if (currentIndex > 0) {
					(items[currentIndex - 1] as HTMLElement).focus();
				}
				break;
			case 'Home':
				event.preventDefault();
				if (items.length > 0) {
					(items[0] as HTMLElement).focus();
				}
				break;
			case 'End':
				event.preventDefault();
				if (items.length > 0) {
					(items[items.length - 1] as HTMLElement).focus();
				}
				break;
		}
	};
</script>

<div class="view-control" use:clickOutside={closeDropdown} data-testid="view-control">
	<button
		class="view-button"
		bind:this={buttonRef}
		on:click={toggleDropdown}
		aria-label="Change view mode"
		aria-expanded={isOpen}
		aria-haspopup="listbox"
		title={selectedViewOption.description}
	>
		<span class="view-icon" aria-hidden="true">{selectedViewOption.icon}</span>
		<span class="view-label">{selectedViewOption.label}</span>
		<span class="dropdown-arrow" aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
	</button>

	{#if isOpen}
		<div
			class="dropdown"
			bind:this={dropdownRef}
			transition:fade={{ duration: 200, easing: quintOut }}
			role="listbox"
			aria-label="View options"
			on:keydown={handleKeydown}
			tabindex="-1"
		>
			{#each viewOptions as option (option.value)}
				<button
					class="dropdown-item"
					class:selected={selectedViewOption.value === option.value}
					on:click={() => handleViewSelect(option)}
					role="option"
					aria-selected={selectedViewOption.value === option.value}
					title={option.description}
				>
					<span class="option-icon" aria-hidden="true">{option.icon}</span>
					<span class="option-text">{option.label}</span>
					{#if option.description}
						<span class="option-description">{option.description}</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.view-control {
		display: inline-block;
		position: relative;
		font-size: 1.1rem;
		z-index: 10;
	}

	.view-button {
		display: flex;
		align-items: center;
		gap: 8px;
		background-color: rgba(30, 41, 59, 0.8); /* Dark blue-gray with transparency */
		border: 1px solid rgba(71, 85, 105, 0.5); /* Subtle border */
		border-radius: 10px;
		padding: 10px 14px;
		font-size: 0.95rem;
		font-weight: 500;
		color: #e2e8f0; /* Light gray text */
		cursor: pointer;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		box-shadow:
			0 4px 6px rgba(0, 0, 0, 0.1),
			0 1px 3px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.1); /* Inner highlight */
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		white-space: nowrap;
		user-select: none;
		position: relative;
		overflow: hidden;
	}

	/* Add subtle glow effect on hover */
	.view-button::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: radial-gradient(circle at center, rgba(59, 130, 246, 0.15), transparent 70%);
		opacity: 0;
		transition: opacity 0.3s ease;
		pointer-events: none;
	}

	.view-button:hover::after {
		opacity: 1;
	}

	/* Label styling */
	.view-label {
		font-weight: 500;
		letter-spacing: 0.01em;
		margin-right: 4px;
	}

	.view-button:hover {
		background-color: rgba(51, 65, 85, 0.9);
		border-color: rgba(100, 116, 139, 0.6);
		box-shadow:
			0 6px 12px rgba(0, 0, 0, 0.15),
			0 2px 4px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.15);
		transform: translateY(-1px);
	}

	.view-button:active {
		transform: translateY(1px);
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.1),
			inset 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.view-button:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 3px rgba(59, 130, 246, 0.5),
			0 4px 6px rgba(0, 0, 0, 0.1);
		border-color: #3b82f6;
	}

	.view-icon {
		font-size: 1.3em;
		line-height: 1;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
		transform-origin: center;
		transition: transform 0.2s ease;
	}

	.view-button:hover .view-icon {
		transform: scale(1.1);
	}

	.dropdown-arrow {
		font-size: 0.7em;
		opacity: 0.8;
		margin-left: 4px;
		transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy transition */
	}

	.view-button:hover .dropdown-arrow {
		opacity: 1;
	}

	/* Rotate arrow when dropdown is open */
	.view-button[aria-expanded='true'] .dropdown-arrow {
		transform: rotate(180deg);
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 10px);
		left: 0;
		background-color: rgba(15, 23, 42, 0.95); /* Very dark blue with transparency */
		border-radius: 12px;
		border: 1px solid rgba(71, 85, 105, 0.6);
		box-shadow:
			0 10px 25px -5px rgba(0, 0, 0, 0.25),
			0 8px 10px -6px rgba(0, 0, 0, 0.15),
			0 0 0 1px rgba(255, 255, 255, 0.1);
		min-width: 220px;
		width: max-content;
		z-index: 100;
		overflow: hidden;
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		transform-origin: top left;
		transition: box-shadow 0.2s ease;
	}

	/* Remove outline when dropdown is focused */
	.dropdown:focus {
		outline: none;
	}

	/* Add subtle glow when dropdown is focused */
	.dropdown:focus-visible {
		box-shadow:
			0 10px 25px -5px rgba(0, 0, 0, 0.25),
			0 8px 10px -6px rgba(0, 0, 0, 0.15),
			0 0 0 3px rgba(59, 130, 246, 0.3);
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		text-align: left;
		padding: 12px 16px;
		border: none;
		background: none;
		cursor: pointer;
		font-size: 1rem;
		color: #e2e8f0; /* Light gray text */
		transition: all 0.2s ease;
		position: relative;
		overflow: hidden;
	}

	/* Highlight effect for selected item */
	.dropdown-item.selected {
		background: linear-gradient(to right, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1));
		font-weight: 600;
		color: #93c5fd; /* Light blue text */
	}

	/* Subtle hover effect with gradient - placed AFTER selected to have higher specificity */
	.dropdown-item:hover {
		background: linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));
		color: #f8fafc;
	}

	/* Ensure hover effect overrides selected state when hovering - using !important to guarantee precedence */
	.dropdown-item.selected:hover {
		background: linear-gradient(
			to right,
			rgba(59, 130, 246, 0.15),
			rgba(59, 130, 246, 0.07)
		) !important;
		color: #f8fafc !important;
	}

	/* Focus visible styling that doesn't interfere with hover states */
	.dropdown-item:focus-visible {
		outline: none;
		box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.5);
	}

	/* Only apply background color when not hovering */
	.dropdown-item:focus-visible:not(:hover) {
		background-color: rgba(59, 130, 246, 0.15);
	}

	/* Subtle divider between items */
	.dropdown-item:not(:last-child)::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 16px;
		right: 16px;
		height: 1px;
		background: linear-gradient(to right, transparent, rgba(148, 163, 184, 0.2), transparent);
	}

	.option-icon {
		font-size: 1.4rem;
		width: 1.5em;
		height: 1.5em;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		line-height: 1;
		color: #94a3b8; /* Muted blue-gray */
		background: rgba(51, 65, 85, 0.4);
		border-radius: 8px;
		padding: 6px;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	/* Selected item icon styling */
	.dropdown-item.selected .option-icon {
		background: rgba(59, 130, 246, 0.3);
		color: #3b82f6; /* Bright blue */
		box-shadow:
			0 0 0 1px rgba(59, 130, 246, 0.5),
			0 2px 4px rgba(0, 0, 0, 0.2);
	}

	/* Hover icon styling - placed AFTER selected to have higher specificity */
	.dropdown-item:hover .option-icon {
		transform: scale(1.05);
		background: rgba(59, 130, 246, 0.2);
		color: #bfdbfe; /* Lighter blue */
	}

	/* Ensure hover effect overrides selected state for icons when hovering - using !important */
	.dropdown-item.selected:hover .option-icon {
		transform: scale(1.05) !important;
		background: rgba(59, 130, 246, 0.25) !important;
		color: #bfdbfe !important; /* Lighter blue */
		box-shadow:
			0 0 0 1px rgba(59, 130, 246, 0.4),
			0 2px 4px rgba(0, 0, 0, 0.15) !important;
	}

	.option-text {
		flex-grow: 1;
		font-weight: 500;
		letter-spacing: 0.01em;
	}

	/* Description styling */
	.option-description {
		display: block;
		font-size: 0.8rem;
		color: rgba(148, 163, 184, 0.9);
		margin-top: 4px;
		font-weight: normal;
		max-width: 90%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Selected item description styling */
	.dropdown-item.selected .option-description {
		color: rgba(147, 197, 253, 0.9);
	}

	/* Hover description styling - placed AFTER selected to have higher specificity */
	.dropdown-item:hover .option-description {
		color: rgba(191, 219, 254, 0.9);
	}

	/* Ensure hover effect overrides selected state for descriptions when hovering */
	.dropdown-item.selected:hover .option-description {
		color: rgba(191, 219, 254, 0.9);
	}

	/* Add a subtle indicator for the selected item */
	.dropdown-item.selected::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 3px;
		background: #3b82f6; /* Bright blue */
		box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.view-button {
			padding: 8px 12px;
			font-size: 0.9rem;
		}

		.dropdown {
			min-width: 200px;
		}

		.dropdown-item {
			padding: 10px 14px;
		}

		.option-icon {
			font-size: 1.2rem;
		}
	}
</style>
