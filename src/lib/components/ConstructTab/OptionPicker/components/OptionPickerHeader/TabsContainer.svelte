<!-- src/lib/components/ConstructTab/OptionPicker/components/OptionPickerHeader/TabsContainer.svelte -->
<script lang="ts">
	import { get, type Writable } from 'svelte/store';
	import TabButton from './TabButton.svelte';
	import ScrollIndicator from './ScrollIndicator.svelte';

	// Props
	const props = $props<{
		selectedTab: string | null;
		categoryKeys: string[];
		isScrollable: boolean;
		showScrollIndicator: boolean;
		useShortLabels: boolean;
		isMobileDevice: boolean; // Keep if used directly for styling/logic within TabsContainer
		compactMode: boolean; // Keep if used directly for styling/logic
		tabsContainerRefStore?: Writable<HTMLDivElement | null>; // Expects the store itself
		onScroll?: () => void; // Event handler for scroll
	}>();

	// Local state for the DOM element
	let actualTabsContainerElement = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (props.tabsContainerRefStore) {
			props.tabsContainerRefStore.set(actualTabsContainerElement);
		}
		// Optional: Cleanup when the element is unmounted or store changes
		// This might be more robustly handled by the hook's onDestroy if the hook manages the lifecycle
		return () => {
			if (
				props.tabsContainerRefStore &&
				actualTabsContainerElement &&
				get(props.tabsContainerRefStore) === actualTabsContainerElement
			) {
				// If the hook doesn't clear it on its own destroy, uncommenting this might be useful.
				// props.tabsContainerRefStore.set(null);
			}
		};
	});

	// Forward scroll event if onScroll prop is provided
	function handleScroll() {
		if (props.onScroll) {
			props.onScroll();
		}
	}
</script>

{#if props.categoryKeys && props.categoryKeys.length > 0}
	<div
		class="tabs"
		role="tablist"
		bind:this={actualTabsContainerElement}
		class:scrollable={props.isScrollable}
		onscroll={handleScroll}
	>
		<div class="tabs-inner-container">
			{#each props.categoryKeys as categoryKey, index (categoryKey)}
				<TabButton
					{categoryKey}
					isActive={props.selectedTab === categoryKey}
					isFirstTab={index === 0}
					isLastTab={index === props.categoryKeys.length - 1}
					useShortLabels={props.useShortLabels}
					tabFlexBasis={`${100 / props.categoryKeys.length}%`}
					{index}
					totalTabs={props.categoryKeys.length}
				/>
			{/each}
		</div>

		<ScrollIndicator show={props.showScrollIndicator} />
	</div>
{:else}
	<!-- Placeholder when tabs are shown but empty -->
	<div class="tabs-placeholder">
		<span class="no-categories-message">No sub-categories</span>
	</div>
{/if}

<style>
	.tabs {
		display: flex;
		justify-content: flex-start;
		flex-wrap: nowrap; /* Prevent tabs from wrapping to a new line */
		padding: 0;
		margin: 0;
		flex-grow: 1; /* Allow tabs container to grow */
		flex-shrink: 1;
		flex-basis: 0;
		min-width: 50px;
		overflow-x: auto; /* Enable horizontal scrolling */
		scrollbar-width: thin; /* For Firefox */
		scrollbar-color: rgba(255, 255, 255, 0.3) transparent; /* For Firefox */
		-ms-overflow-style: none; /* Hide scrollbar in IE and Edge */
		position: relative; /* For scroll indicator positioning */
		padding-bottom: 4px; /* Space for scrollbar */
		/* Add padding to prevent border clipping */
		padding-top: 2px;
		padding-left: 2px;
		padding-right: 2px;
		width: 100%; /* Ensure .tabs itself takes full available width from parent */
	}

	.tabs-inner-container {
		display: flex; /* Make this a flex container */
		width: 100%; /* Make it take the full width of .tabs */
		min-width: max-content; /* Ensure it's wide enough for all tabs if not scrollable */
		gap: 4px;
		padding: 0 4px;
		/* Ensure inner container doesn't clip borders */
		margin: 0 -2px; /* Compensate for tabs padding */
	}

	/* Hide scrollbar in Webkit browsers by default */
	.tabs::-webkit-scrollbar {
		height: 4px;
		background: transparent;
	}

	.tabs::-webkit-scrollbar-thumb {
		background-color: rgba(255, 255, 255, 0.3);
		border-radius: 4px;
	}

	/* Show scrollbar on hover for better UX */
	.tabs:hover::-webkit-scrollbar {
		height: 6px;
	}

	/* Scrollable class for visual indication */
	.tabs.scrollable {
		padding-right: 20px; /* Space for scroll indicator */
	}

	/* Placeholder used only for "No sub-categories" message */
	.tabs-placeholder {
		display: flex;
		justify-content: flex-start; /* Align message left */
		align-items: center;
		flex-grow: 1;
		flex-shrink: 1;
		flex-basis: 0;
		min-width: 50px;
		min-height: 30px; /* Ensure it has some height */
	}

	.no-categories-message {
		color: #94a3b8;
		font-style: italic;
		padding: clamp(0.4rem, 1vw, 0.6rem) clamp(0.8rem, 1.5vw, 1.2rem);
		white-space: nowrap;
		/* text-align: center; Removed, placeholder is justify-content: flex-start */
	}

	/* Mobile styles */
	@media (max-width: 640px) {
		.tabs-placeholder {
			justify-content: flex-start; /* Ensure "No sub-categories" aligns left */
		}

		.no-categories-message {
			font-size: 0.9rem;
			padding: 0.4rem 0.6rem;
		}

		/* Reduce gap between tabs */
		.tabs {
			gap: 2px 4px;
		}
	}

	/* Very small screens */
	@media (max-width: 480px) {
		/* Further reduce gap between tabs */
		.tabs {
			gap: 1px 2px;
		}
	}
</style>
