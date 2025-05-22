<!-- src/lib/components/ConstructTab/OptionPicker/components/OptionPickerHeader/TabsInnerContainer.svelte -->
<script lang="ts">
	import TabButton from './TabButton.svelte';

	// Add a default export to make this component importable
	export {};

	// Props
	const props = $props<{
		categoryKeys: string[];
		selectedTab: string | null;
		useShortLabels: boolean;
	}>();

	// Set up event listener for tabSelect events from TabButton components
	$effect(() => {
		// Function to handle tab selection events
		const handleTabSelect = (event: CustomEvent<string>) => {
			// Get the target element
			const target = event.target as HTMLElement;

			// Check if this is a tab button click
			const isTabButtonClick = target && target.closest('.tab');

			// Check if this event has already been processed by THIS component
			const isProcessedByThisComponent = (event as any).__innerContainerProcessed === true;

			// We should process the event if:
			// 1. It's a tab button click AND
			// 2. It hasn't been processed by this component yet
			if (isTabButtonClick && !isProcessedByThisComponent) {
				// Mark this event as handled by this component
				(event as any).__innerContainerProcessed = true;

				// Stop propagation to prevent duplicate handling
				event.stopPropagation();

				// Create a new event with a different name to avoid recursion
				const forwardEvent = new CustomEvent('tabSelected', {
					detail: event.detail,
					bubbles: true,
					composed: true
				});

				// Dispatch the renamed event from the document
				document.dispatchEvent(forwardEvent);

				// Log for debugging
				console.log('TabsInnerContainer: Forwarded tab selection for', event.detail);
			} else if (isProcessedByThisComponent) {
				// Log that we're skipping an already processed event
				console.log(
					'TabsInnerContainer: Skipping already processed event (processed by this component)'
				);
			} else if (!isTabButtonClick) {
				// Log that we're skipping an event that's not from a tab button
				console.log('TabsInnerContainer: Skipping event (not from a tab button)');
			}
		};

		// Add event listener to the document for tab selection events
		document.addEventListener('tabSelect', handleTabSelect as EventListener);

		// Clean up on destroy
		return () => {
			document.removeEventListener('tabSelect', handleTabSelect as EventListener);
		};
	});
</script>

<div class="tabs-inner-container">
	{#each props.categoryKeys as categoryKey, index (categoryKey)}
		<TabButton
			{categoryKey}
			isActive={String(props.selectedTab) === String(categoryKey)}
			isFirstTab={index === 0}
			isLastTab={index === props.categoryKeys.length - 1}
			useShortLabels={props.useShortLabels}
			tabFlexBasis={`${100 / props.categoryKeys.length}%`}
			{index}
			totalTabs={props.categoryKeys.length}
		/>
	{/each}
</div>

<style>
	.tabs-inner-container {
		display: flex; /* Make this a flex container */
		width: 100%; /* Make it take the full width of .tabs */
		min-width: max-content; /* Ensure it's wide enough for all tabs if not scrollable */
		gap: 4px;
		padding: 0 4px;
		/* Ensure inner container doesn't clip borders */
		margin: 0 -2px; /* Compensate for tabs padding */
		position: relative; /* For tooltip positioning */
	}

	/* Mobile styles */
	@media (max-width: 640px) {
		/* Reduce gap between tabs */
		.tabs-inner-container {
			gap: 2px;
		}
	}

	/* Very small screens */
	@media (max-width: 480px) {
		/* Further reduce gap between tabs */
		.tabs-inner-container {
			gap: 1px;
		}
	}
</style>
