<script lang="ts">
	import type { PictographData } from '$lib/types/PictographData';
	import SectionHeader from '../SectionHeader.svelte';
	import OptionGroupGrid from '../OptionGroupGrid.svelte';
	import type { Action } from 'svelte/action';

	// Props
	const props = $props<{
		groups: Array<{ key: string; options: PictographData[] }>;
		transitionKey: string | number;
		rowIndex: number;
		onoptionselect?: (option: PictographData) => void;
	}>();

	// Handle option selection events from OptionGroupGrid
	function handleOptionSelect(option: PictographData) {
		// Call the callback if provided
		if (props.onoptionselect) {
			props.onoptionselect(option);
		}
	}

	// Debounce function for performance
	function debounce<T extends (...args: any[]) => any>(
		func: T,
		wait: number
	): (...args: Parameters<T>) => void {
		let timeout: ReturnType<typeof setTimeout> | null = null;
		return function (...args: Parameters<T>) {
			if (timeout !== null) {
				clearTimeout(timeout);
			}
			timeout = setTimeout(() => {
				func(...args);
				timeout = null;
			}, wait);
		};
	}

	// Action to handle multi-group row overflow detection and prevention
	const setupMultiGroupRow: Action<HTMLElement> = (node) => {
		let resizeObserver: ResizeObserver | null = null;
		let debouncedCheckOverflow: () => void;

		// Function to get the minimum width based on screen size
		function getMinGroupWidth(): number {
			// Check if window is defined (for SSR safety, though less critical in action)
			if (typeof window === 'undefined') return 140; // Default if no window
			if (window.innerWidth <= 380) {
				return 80; // Minimum width for very small screens
			} else if (window.innerWidth <= 640) {
				return 100; // Minimum width for small screens
			} else {
				return 140; // Default minimum width
			}
		}

		// Function to check if the multi-group row would overflow
		function checkOverflow() {
			// Get all group items in this row
			const groupItems = Array.from(node.querySelectorAll('.multi-group-item'));
			if (groupItems.length <= 1) return; // No need to check with only one item

			// Get the container width
			const containerWidth = node.clientWidth;
			if (containerWidth <= 0) return; // Skip if container has no width

			// Calculate the minimum width each group should have
			const minGroupWidth = getMinGroupWidth();

			// Calculate the total width needed for all groups to fit side by side
			// Include a small gap between items (e.g., 10px per item)
			const gapPerItem = 10;
			const totalWidthNeeded =
				groupItems.length * minGroupWidth + (groupItems.length - 1) * gapPerItem;

			// Determine if the groups would overflow
			const wouldOverflow = totalWidthNeeded > containerWidth;

			groupItems.forEach((item, index) => {
				// Force new row only on the *last* item if it would overflow
				// and remove from others.
				if (wouldOverflow && index === groupItems.length - 1) {
					item.classList.add('force-new-row');
				} else {
					item.classList.remove('force-new-row');
				}
			});
		}

		// Debounce the checkOverflow function for window resize
		debouncedCheckOverflow = debounce(checkOverflow, 150);

		if (typeof ResizeObserver !== 'undefined') {
			resizeObserver = new ResizeObserver(() => {
				checkOverflow(); // ResizeObserver is usually already optimized
			});
			resizeObserver.observe(node);
		}

		// Listen for window resize events (debounced)
		const handleWindowResize = () => {
			debouncedCheckOverflow();
		};

		if (typeof window !== 'undefined') {
			window.addEventListener('resize', handleWindowResize);
			// Initial check
			setTimeout(checkOverflow, 0);
		}

		return {
			destroy() {
				if (resizeObserver) {
					resizeObserver.disconnect();
				}
				if (typeof window !== 'undefined') {
					window.removeEventListener('resize', handleWindowResize);
				}
			}
		};
	};
</script>

<div class="multi-group-row" use:setupMultiGroupRow>
	{#each props.groups as group, groupIndex (props.transitionKey + '-multi-' + group.key)}
		<div class="multi-group-item" data-group-index={groupIndex}>
			<SectionHeader
				groupKey={group.key}
				isFirstHeader={props.rowIndex === 0 && groupIndex === 0}
				isCompact={true}
			/>
			<OptionGroupGrid
				options={group.options}
				key={props.transitionKey + '-multiopt-' + group.key}
				onoptionselect={handleOptionSelect}
			/>
		</div>
	{/each}
</div>

<style>
	/* Styles moved from OptionsPanel.svelte */
	.multi-group-row {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: space-evenly; /* Distributes space, good for varying item counts */
		align-items: flex-start; /* Align items to the top of the row */
		width: 100%;
		background-color: rgba(0, 0, 0, 0.01); /* Subtle background for the row */
		gap: 0.25rem; /* Consistent gap between items */
	}

	.multi-group-item {
		display: flex;
		flex-direction: column;
		align-items: center; /* Center content (header, grid) within the item */
		min-width: 140px; /* Minimum width before wrapping or shrinking too much */
		flex: 1; /* Allow items to grow and share space */
		margin: 0.25rem; /* Margin around each item */
		padding: 0.25rem; /* Padding inside each item */
		border-radius: 12px; /* Rounded corners for items */
		transition: all 0.2s ease-out;
	}

	@media (max-width: 640px) {
		.multi-group-row {
			gap: 0.1rem;
		}
		.multi-group-item {
			min-width: 100px;
			margin: 0.1rem;
			padding: 0.1rem;
		}
	}

	@media (max-width: 380px) {
		.multi-group-item {
			min-width: 80px; /* Further reduce min-width for very small screens */
		}
	}
</style>
