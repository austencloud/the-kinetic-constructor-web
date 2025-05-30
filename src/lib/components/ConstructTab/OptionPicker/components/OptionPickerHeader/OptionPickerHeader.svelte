<!-- src/lib/components/ConstructTab/OptionPicker/components/OptionPickerHeader/OptionPickerHeader.svelte -->
<script lang="ts">
	import { getContext } from 'svelte';
	import { LAYOUT_CONTEXT_KEY } from '../../layoutContext';
	import ViewControl from '../ViewControl/ViewControl.svelte';
	import TabsContainer from './TabsContainer.svelte';
	import { useResponsiveLayout } from './useResponsiveLayout.svelte';

	// --- Props using Svelte 5 runes ---
	const props = $props<{
		selectedTab: string | null;
		categoryKeys: string[];
		showTabs: boolean;
	}>();

	// --- Context ---
	const getLayoutContext = getContext<() => any>(LAYOUT_CONTEXT_KEY);

	// --- State ---

	// --- Responsive Layout ---
	// Destructure stores from the hook - pass the getter function
	const {
		isMobileDevice,
		useShortLabels,
		isScrollable,
		compactMode,
		showScrollIndicator,
		handleScroll // Make sure to get all needed functions/stores
	} = useResponsiveLayout(getLayoutContext);
</script>

<div class="option-picker-header" class:mobile={isMobileDevice} data-testid="option-picker-header">
	<div class="header-content">
		<!-- TabsContainer or helper-message now comes first -->
		{#if props.showTabs}
			<!-- Show tabs when not in "Show All" mode -->
			<TabsContainer
				selectedTab={props.selectedTab}
				categoryKeys={Array.isArray(props.categoryKeys) ? props.categoryKeys : []}
				{isScrollable}
				{showScrollIndicator}
				{useShortLabels}
				onScroll={handleScroll}
			/>
		{:else}
			<!-- Show helper message when in "Show All" mode -->
			<div class="helper-message">Showing all options - select a filter to see sections</div>
		{/if}

		<!-- ViewControl now comes second, will be on the right -->
		<div class="view-controls" class:compact={compactMode}>
			<ViewControl compact={compactMode} />
		</div>
	</div>
</div>

<style>
	/* Export all styles as CSS custom properties */
	:global(.option-picker-header) {
		height: auto;
		width: 100%;
		position: relative;
		margin-bottom: 0.5rem;
		padding-bottom: 0.5rem;
		padding-top: 8px;
		min-height: auto;
		box-sizing: border-box;
	}

	:global(.option-picker-header.mobile) {
		padding-top: 4px;
		margin-bottom: 0.3rem;
	}

	:global(.header-content) {
		display: flex;
		justify-content: space-between; /* Changed: Puts ViewControl on right, Tabs/Helper on left */
		align-items: center;
		flex-wrap: nowrap;
		padding-right: 20px; /* Added padding for right side of ViewControl, need twice the amount of the items in the sequence widget for some reason */
	}

	/* Add this rule to ensure .tabs can grow */
	:global(.tabs) {
		flex-grow: 1;
		min-width: 0; /* Allow shrinking if content is too large */
		display: flex; /* Make it a flex container for its children like .tabs-inner-container */
	}

	:global(.view-controls) {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		/* No specific margin needed here by default, gap on parent handles spacing if using 'gap' property
		   or specific margins below will handle it. */
	}

	/* Helper message shown when showTabs is false */
	:global(.helper-message) {
		color: white;
		font-style: italic;
		font-size: 1rem;
		padding: clamp(0.4rem, 1vw, 0.6rem);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex-shrink: 1; /* Allow shrinking if needed, won't grow by default */
	}

	/* --- Responsive Layout --- */
	/* Compact mode styles */
	:global(.view-controls.compact) {
		flex-shrink: 0; /* Prevent view controls from shrinking */
		margin-left: 8px; /* Changed: from margin-right to provide space on its left */
	}

	/* Styles for when container width is constrained */
	@media (max-width: 768px) {
		:global(.header-content) {
			flex-direction: row; /* Keep items on the same line */
			align-items: center; /* Center align items vertically */
			flex-wrap: nowrap; /* Prevent wrapping to next line */
			padding-right: 10px; /* Added padding for right side of ViewControl, need twice the amount of the items in the sequence widget for some reason */
		}

		:global(.tabs),
		:global(.tabs-placeholder),
		:global(.helper-message) {
			flex-grow: 1; /* Allow tabs to take remaining space */
			width: auto; /* Don't force full width */
			max-width: calc(100%); /* Leave space for view control */
		}
	}

	/* Mobile styles */
	@media (max-width: 640px) {
		:global(.view-controls) {
			flex-shrink: 0; /* Prevent view controls from shrinking */
			margin-left: 4px; /* Changed: from margin-right */
		}

		:global(.helper-message) {
			padding-left: 0; /* Adjust padding if needed */
			font-size: 0.9rem; /* Smaller font size */
		}
	}

	/* Very small screens */
	@media (max-width: 480px) {
		:global(.helper-message) {
			font-size: 0.8rem;
		}

		/* Make view controls more compact */
		:global(.view-controls) {
			margin-left: 2px; /* Changed: from margin-right */
		}
	}
</style>
