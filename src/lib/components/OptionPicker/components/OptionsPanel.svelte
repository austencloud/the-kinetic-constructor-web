<script lang="ts">
	import { getContext } from 'svelte';
	import { fade } from 'svelte/transition'; // Keep fade if needed for panel itself
	import { cubicOut } from 'svelte/easing';
	import type { PictographData } from '$lib/types/PictographData';
	import { LAYOUT_CONTEXT_KEY, type LayoutContext } from '../layoutContext';
	import { uiState } from '../store'; // Import uiState store
	import { determineGroupKey, getSortedGroupKeys } from '../services/OptionsService'; // Import helpers
	import type { SortMethod } from '../config'; // Import type

	// Import the new components
	import SectionHeader from './SectionHeader.svelte';
	import OptionGroupGrid from './OptionGroupGrid.svelte';

	// --- Props ---
	export let selectedTab: string | null = null; // Still needed to know which group to display when sortMethod is 'type'
	export let options: PictographData[] = []; // Still needed as the source data

	// --- Get Sort Method from Store ---
	let currentSortMethod: SortMethod;
	uiState.subscribe((state) => {
		currentSortMethod = state.sortMethod;
	});

	// --- Computed Grouping Logic ---
	// This determines the structure for rendering:
	// - If sorting by type, just pass the pre-filtered options for the selected tab.
	// - Otherwise, create header/options pairs by sub-grouping the passed options by type.
	$: displayData = (() => {
		// For other sorts (endPosition, reversals), sub-group the incoming options by their letter type.
		const subGroups: Record<string, PictographData[]> = {};
		options.forEach((option) => {
			const groupKey = determineGroupKey(option, 'type'); // Group by 'type' key (e.g., Type1)
			if (!subGroups[groupKey]) subGroups[groupKey] = [];
			subGroups[groupKey].push(option);
		});

		// Sort the type group keys (Type1, Type2...)
		const sortedKeys = getSortedGroupKeys(Object.keys(subGroups), 'type');

		// Create an array interleaving headers and their corresponding option groups
		const result: Array<{ key: string; options?: PictographData[]; isHeader: boolean }> = [];
		sortedKeys.forEach((key) => {
			if (subGroups[key]?.length > 0) {
				result.push({ key: key, isHeader: true }); // Header item (using key like Type1)
				result.push({ key: key + '-options', options: subGroups[key], isHeader: false }); // Options item
			}
		});
		return result;
	})();

	// Helper to generate a unique key for the outer each loop, preventing conflicts
	function getDisplayKey(groupData: { key: string; isHeader: boolean }): string {
		return groupData.isHeader ? `header-${groupData.key}` : `options-${groupData.key}`;
	}
</script>

<div
	class="options-panel"
	role="tabpanel"
	aria-labelledby="tab-{selectedTab}"
	id="options-panel-{selectedTab}"
>
	{#each displayData as groupData, index (getDisplayKey(groupData))}
		{#if groupData.isHeader}
			<SectionHeader groupKey={groupData.key} isFirstHeader={index === 0} />
		{:else if groupData.options}
			<OptionGroupGrid options={groupData.options} groupKey={groupData.key} />
		{/if}
	{/each}
</div>

<style>
	/* UPDATED: Keeping position:absolute for crossfade but fixing scroll issues */
	.options-panel {
		display: flex;
		flex-direction: column;
		align-items: center; /* Center groups horizontally */
		position: absolute; /* Keep this for crossfade */
		width: 100%;
		height: 100%;
		padding: 0.5rem;
		box-sizing: border-box;
		overflow-y: auto;
		overflow-x: hidden;
		/* Add padding to ensure first items aren't cut off */
		padding-top: 1rem;
		/* Add padding to ensure last items aren't cut off at bottom when scrolling */
		padding-bottom: 2rem;
		/* Ensure scrolling works properly */
		top: 0;
		left: 0;
	}

	/* --- Scrollbar --- */
	.options-panel::-webkit-scrollbar {
		width: 6px;
	}
	.options-panel::-webkit-scrollbar-track {
		background: rgba(30, 41, 59, 0.3);
		border-radius: 3px;
	}
	.options-panel::-webkit-scrollbar-thumb {
		background-color: rgba(71, 85, 105, 0.6);
		border-radius: 3px;
	}
	.options-panel::-webkit-scrollbar-thumb:hover {
		background-color: rgba(100, 116, 139, 0.7);
	}

	/* If content taller than panel, revert to top alignment for natural scrolling */
	.options-panel:has(> :nth-child(n+10)) {
		align-items: flex-start; /* Align to top when many items for better scrolling */
		justify-content: center; /* Keep horizontal centering */
	}
</style>



