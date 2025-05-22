<!-- src/lib/components/ConstructTab/OptionPicker/components/OptionPickerHeader/TabButton.svelte -->
<script lang="ts">
	// No need to import the type since we're using $props()
	import { formatTabName, formatShortTabName } from './tabLabelFormatter';
	import { fly } from 'svelte/transition';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';
	import { actions } from '../../store';

	// Props
	const props = $props<{
		categoryKey: string;
		isActive: boolean;
		isFirstTab: boolean;
		isLastTab: boolean;
		useShortLabels: boolean;
		tabFlexBasis: string;
		index: number;
		totalTabs: number;
	}>();

	// Local state for hover effect
	let isHovered = $state(false);

	// Event handler
	function handleClick(event: MouseEvent) {
		// Provide haptic feedback when selecting a category tab
		if (typeof window !== 'undefined' && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('navigation');
		}

		// Create a custom event that will bubble up to the parent component
		const customEvent = new CustomEvent('tabSelect', {
			detail: props.categoryKey,
			bubbles: true,
			composed: true // Allows the event to cross the shadow DOM boundary
		});

		// Stop the original click event from bubbling to prevent duplicate handling
		event.stopPropagation();

		// Get the current button element
		const buttonElement = event.currentTarget as HTMLElement;
		if (buttonElement) {
			// Dispatch the event directly from the clicked button
			// This ensures the event.target is correct for event delegation
			buttonElement.dispatchEvent(customEvent);
			console.log('TabButton: Dispatched tabSelect event for', props.categoryKey);

			// Also dispatch a direct event to the document as a fallback
			// This ensures the event is caught even if the bubbling chain is broken
			const directEvent = new CustomEvent('direct-tab-select', {
				detail: props.categoryKey,
				bubbles: false // Don't bubble to prevent loops
			});
			document.dispatchEvent(directEvent);
		} else {
			// Fallback to document if button element is not available
			console.warn('Button element not available, using document for event dispatch');
			document.dispatchEvent(customEvent);
		}

		// Force the UI to update by directly updating the store
		// This is a critical fix for the tab selection issue
		try {
			// Get the current sort method from the view control element
			const viewControlElement = document.querySelector('.view-control');
			const currentSortMethod = viewControlElement?.getAttribute('data-sort-method') || 'type';

			// Update the store directly
			actions.setLastSelectedTabForSort(currentSortMethod as any, props.categoryKey);

			console.log('TabButton: Directly updated store with tab selection:', {
				sortMethod: currentSortMethod,
				tabKey: props.categoryKey
			});
		} catch (error) {
			console.error('Error directly updating store:', error);
		}
	}

	// Handle mouse enter/leave for hover effects
	function handleMouseEnter() {
		isHovered = true;
	}

	function handleMouseLeave() {
		isHovered = false;
	}
</script>

<button
	class="tab"
	class:active={props.isActive}
	class:first-tab={props.isFirstTab}
	class:last-tab={props.isLastTab}
	class:hovered={isHovered}
	onclick={handleClick}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	role="tab"
	aria-selected={props.isActive}
	aria-controls={`options-panel-${props.categoryKey}`}
	id="tab-{props.categoryKey}"
	data-category-key={props.categoryKey}
	title={formatTabName(props.categoryKey)}
	style="--tab-flex-basis: {props.tabFlexBasis}"
>
	<!-- Tab content with indicator -->
	<div class="tab-content">
		<span class="tab-text">
			{props.useShortLabels
				? formatShortTabName(props.categoryKey)
				: formatTabName(props.categoryKey)}
		</span>

		<!-- Hover indicator that shows on non-active tabs -->
		{#if isHovered && !props.isActive}
			<div class="hover-indicator" transition:fly={{ y: 10, duration: 200 }}></div>
		{/if}
	</div>
</button>

<style>
	.tab {
		background: rgba(15, 23, 42, 0.4);
		border: 1px solid rgba(148, 163, 184, 0.2);
		padding: clamp(0.4rem, 0.8vw, 0.7rem) clamp(0.6rem, 1vw, 1.2rem);
		cursor: pointer;
		font-weight: 500;
		font-size: clamp(0.85rem, 1.5vw, 1.05rem);
		color: #e2e8f0;
		transition:
			background-color 0.3s ease,
			color 0.3s ease,
			transform 0.3s ease,
			box-shadow 0.3s ease,
			border-color 0.3s ease;
		white-space: nowrap;
		flex: 1 1 var(--tab-flex-basis, 0); /* Use flex to expand tabs evenly */
		border-radius: 8px;
		margin: 0 0 2px 0;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 36px; /* Ensure minimum touch target size */
		min-height: 36px; /* Ensure minimum touch target size */
		max-width: none; /* Allow tabs to grow */
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative; /* For positioning indicators */
	}

	/* Tab content container */
	.tab-content {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
	}

	.tab-text {
		position: relative;
		z-index: 2;
		transition: transform 0.3s ease;
	}

	/* Special styling for first and last tabs */
	.tab.first-tab {
		margin-left: 0;
	}

	.tab.last-tab {
		margin-right: 0;
	}

	/* Active tab styling */
	.tab.active {
		background: #0f172a;
		color: #ffcc00; /* Gold color to match beat display area */
		font-weight: 600;
		border: 2px solid #ffcc00; /* Gold border to match beat display area */
		padding: calc(clamp(0.4rem, 0.8vw, 0.7rem) - 2px) calc(clamp(0.6rem, 1vw, 1.2rem) - 2px);
		box-shadow:
			0 0 8px rgba(255, 204, 0, 0.4),
			/* Gold glow */ 0 4px 6px rgba(0, 0, 0, 0.3);
		position: relative;
		z-index: 2;
		transform: translateY(-2px); /* Slight lift effect */
	}

	/* Active indicator - the dot at the bottom */

	/* Hover indicator - subtle line at the bottom */
	.hover-indicator {
		position: absolute;
		bottom: -2px;
		left: 50%;
		transform: translateX(-50%);
		width: 20px;
		height: 2px;
		background-color: rgba(255, 204, 0, 0.4); /* Subtle gold color */
		border-radius: 1px;
	}

	/* Hover state for non-active tabs */
	.tab:hover:not(.active) {
		background: #172033;
		color: #f8fafc;
		border-color: rgba(148, 163, 184, 0.4);
		transform: translateY(-1px);
		box-shadow: 0 3px 5px rgba(0, 0, 0, 0.25);
	}

	/* Hover effect for the text */
	.tab:hover:not(.active) .tab-text {
		transform: translateY(-1px);
	}

	/* Focus state */
	.tab:focus-visible {
		outline: 2px solid #60a5fa;
		outline-offset: 1px;
		background-color: rgba(59, 130, 246, 0.1);
	}

	/* Add a subtle pulse animation to the active tab */
	@keyframes pulse {
		0% {
			box-shadow:
				0 0 8px rgba(255, 204, 0, 0.4),
				0 4px 6px rgba(0, 0, 0, 0.3);
		}
		50% {
			box-shadow:
				0 0 12px rgba(255, 204, 0, 0.6),
				0 4px 6px rgba(0, 0, 0, 0.3);
		}
		100% {
			box-shadow:
				0 0 8px rgba(255, 204, 0, 0.4),
				0 4px 6px rgba(0, 0, 0, 0.3);
		}
	}

	.tab.active {
		animation: pulse 2s infinite ease-in-out;
	}
</style>
