<!-- src/lib/components/ConstructTab/OptionPicker/components/OptionPickerHeader/TabsContainer.svelte -->
<script lang="ts">
	import ScrollIndicator from './ScrollIndicator.svelte';
	import ScrollHint from './ScrollHint.svelte';
	import TabsTooltip from './TabsTooltip.svelte';
	// Import TabsInnerContainer component properly
	import TabsInnerContainer from './TabsInnerContainer.svelte';
	// Import actions from the store
	import { actions } from '../../store';

	// Props using Svelte 5 runes
	const {
		selectedTab,
		categoryKeys,
		isScrollable,
		showScrollIndicator,
		useShortLabels,
		isMobileDevice,
		compactMode,
		onScroll,
		ontabSelect
	} = $props<{
		selectedTab: string | null;
		categoryKeys: string[];
		isScrollable: boolean;
		showScrollIndicator: boolean;
		useShortLabels: boolean;
		isMobileDevice: boolean;
		compactMode: boolean;
		onScroll?: () => void;
		ontabSelect?: (event: CustomEvent<string>) => void;
	}>();

	// Local state for the DOM element and scroll position
	let actualTabsContainerElement = $state<HTMLDivElement | null>(null);
	let scrollPosition = $state(0);
	let maxScroll = $state(0);
	let showTooltip = $state(false);

	// DISABLED: Show tooltip after a delay
	// setTimeout(() => {
	// 	showTooltip = true;
	// 	// Hide tooltip after 5 seconds
	// 	setTimeout(() => {
	// 		showTooltip = false;
	// 	}, 5000);
	// }, 1000);

	// Completely disable tooltips to prevent reactivity loops
	showTooltip = false;

	// Forward scroll event if onScroll prop is provided and update scroll position
	function handleScroll() {
		if (onScroll) {
			onScroll();
		}

		if (actualTabsContainerElement) {
			scrollPosition = actualTabsContainerElement.scrollLeft;
			maxScroll = actualTabsContainerElement.scrollWidth - actualTabsContainerElement.clientWidth;
		}
	}

	// Update maxScroll when the component mounts or when tabs change
	$effect(() => {
		if (actualTabsContainerElement) {
			maxScroll = actualTabsContainerElement.scrollWidth - actualTabsContainerElement.clientWidth;
		}
	});

	// DISABLED: Set up event listener for tabSelected events
	// $effect(() => {
	// 	const handleTabSelect = (event: CustomEvent<string>) => {
	// 		// Forward the event to the parent component if the callback is provided
	// 		if (ontabSelect) {
	// 			// Create a new event with the original name for the parent component
	// 			const parentEvent = new CustomEvent('tabSelect', {
	// 				detail: event.detail
	// 			});
	//
	// 			// Call the callback directly
	// 			ontabSelect(parentEvent);
	// 			console.log('TabsContainer: Forwarded tab selection to parent for', event.detail);
	// 		}
	//
	// 		// IMPORTANT: Always update the store directly regardless of whether ontabSelect is provided
	// 		// This ensures the UI updates even if the event chain is broken
	// 		try {
	// 			// Get the current sort method from the view control element
	// 			const viewControlElement = document.querySelector('.view-control');
	// 			const currentSortMethod = viewControlElement?.getAttribute('data-sort-method') || 'type';
	//
	// 			console.log('TabsContainer: Updating store with tab selection:', {
	// 				sortMethod: currentSortMethod,
	// 				tabKey: event.detail
	// 			});
	//
	// 			// Update the store with the selected tab
	// 			actions.setLastSelectedTabForSort(currentSortMethod as any, event.detail);
	//
	// 			// Force a UI update by dispatching a custom event
	// 			const updateEvent = new CustomEvent('option-picker-tab-selected', {
	// 				detail: {
	// 					sortMethod: currentSortMethod,
	// 					tabKey: event.detail
	// 				},
	// 				bubbles: true
	// 			});
	// 			document.dispatchEvent(updateEvent);
	// 		} catch (error) {
	// 			console.error('Error updating store with tab selection:', error);
	// 		}
	// 	};
	//
	// 	// Add event listener to the document for the renamed event
	// 	document.addEventListener('tabSelected', handleTabSelect as EventListener);
	//
	// 	// Clean up on destroy
	// 	return () => {
	// 		document.removeEventListener('tabSelected', handleTabSelect as EventListener);
	// 	};
	// });

	// Completely disable event listeners to prevent reactivity loops
	console.log('TabsContainer: Event listeners disabled to prevent reactivity loops');
</script>

{#if Array.isArray(categoryKeys) && categoryKeys.length > 0}
	<div class="tabs-wrapper">
		<!-- Left scroll indicator -->
		<ScrollHint direction="left" show={isScrollable && scrollPosition > 20} />

		<div
			class="tabs"
			role="tablist"
			bind:this={actualTabsContainerElement}
			class:scrollable={isScrollable}
			onscroll={handleScroll}
		>
			<TabsInnerContainer {categoryKeys} {selectedTab} {useShortLabels} />

			<!-- Tooltip to indicate more options in other tabs -->
			<TabsTooltip show={showTooltip} categoryCount={categoryKeys.length} />
		</div>

		<!-- Right scroll indicator -->
		<ScrollHint direction="right" show={isScrollable && scrollPosition < maxScroll - 20} />
	</div>

	{#if showScrollIndicator}
		<ScrollIndicator show={isScrollable} />
	{/if}
{:else}
	<!-- Placeholder when tabs are shown but empty -->
	<div class="tabs-placeholder">
		<span class="no-categories-message">No sub-categories</span>
	</div>
{/if}

<style>
	/* Wrapper for tabs and scroll indicators */
	.tabs-wrapper {
		display: flex;
		position: relative;
		width: 100%;
		align-items: center;
		margin-bottom: 4px;
	}

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
		scroll-behavior: smooth; /* Smooth scrolling for better UX */
		transition: all 0.3s ease; /* Smooth transitions */
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
		mask-image: linear-gradient(to right, transparent, black 10px, black 90%, transparent);
		-webkit-mask-image: linear-gradient(to right, transparent, black 10px, black 90%, transparent);
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
	}
</style>
