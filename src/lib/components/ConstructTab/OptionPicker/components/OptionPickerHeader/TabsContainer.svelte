<!-- src/lib/components/ConstructTab/OptionPicker/components/OptionPickerHeader/TabsContainer.svelte -->
<script lang="ts">
	import { get, type Writable } from 'svelte/store';
	import ScrollIndicator from './ScrollIndicator.svelte';
	import ScrollHint from './ScrollHint.svelte';
	import TabsTooltip from './TabsTooltip.svelte';
	import TabsInnerContainer from './TabsInnerContainer.svelte';

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

	// Local state for the DOM element and scroll position
	let actualTabsContainerElement = $state<HTMLDivElement | null>(null);
	let scrollPosition = $state(0);
	let maxScroll = $state(0);
	let showTooltip = $state(false);

	// Show tooltip after a delay
	setTimeout(() => {
		showTooltip = true;
		// Hide tooltip after 5 seconds
		setTimeout(() => {
			showTooltip = false;
		}, 5000);
	}, 1000);

	$effect(() => {
		if (props.tabsContainerRefStore) {
			props.tabsContainerRefStore.set(actualTabsContainerElement);
		}
		// Optional: Cleanup when the element is unmounted or store changes
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

	// Forward scroll event if onScroll prop is provided and update scroll position
	function handleScroll() {
		if (props.onScroll) {
			props.onScroll();
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
</script>

{#if Array.isArray(props.categoryKeys) && props.categoryKeys.length > 0}
	<div class="tabs-wrapper">
		<!-- Left scroll indicator -->
		<ScrollHint direction="left" show={props.isScrollable && scrollPosition > 20} />

		<div
			class="tabs"
			role="tablist"
			bind:this={actualTabsContainerElement}
			class:scrollable={props.isScrollable}
			onscroll={handleScroll}
		>
			<TabsInnerContainer
				categoryKeys={props.categoryKeys}
				selectedTab={props.selectedTab}
				useShortLabels={props.useShortLabels}
			/>

			<!-- Tooltip to indicate more options in other tabs -->
			<TabsTooltip show={showTooltip} categoryCount={props.categoryKeys.length} />
		</div>

		<!-- Right scroll indicator -->
		<ScrollHint direction="right" show={props.isScrollable && scrollPosition < maxScroll - 20} />
	</div>

	{#if props.showScrollIndicator}
		<ScrollIndicator show={props.isScrollable} />
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
