<script lang="ts">
	import { getContext } from 'svelte';
	import { fade } from 'svelte/transition'; // Keep fade if needed for panel itself
	import { cubicOut } from 'svelte/easing';
	import type { PictographData } from '$lib/types/PictographData';
	import { LAYOUT_CONTEXT_KEY, type LayoutContext } from '../layoutContext';
	import { uiState } from '../store'; // Import uiState store
	import { determineGroupKey, getSortedGroupKeys } from '../services/OptionsService'; // Import helpers
	import type { SortMethod } from '../config'; // Import type

	// Import the child components
	import SectionHeader from './SectionHeader.svelte';
	import OptionGroupGrid from './OptionGroupGrid.svelte';

	// --- Props ---
	export let selectedTab: string | null = null;
	export let options: PictographData[] = [];

	// --- Get Sort Method from Store ---
	let currentSortMethod: SortMethod;
	uiState.subscribe((state) => {
		currentSortMethod = state.sortMethod;
	});

	// --- Computed Grouping Logic ---
	// Determines the structure for rendering headers and grids
	$: displayData = (() => {
		const subGroups: Record<string, PictographData[]> = {};
		options.forEach((option) => {
			// Always group by 'type' for consistent sectioning, regardless of sort method
			const groupKey = determineGroupKey(option, 'type');
			if (!subGroups[groupKey]) subGroups[groupKey] = [];
			subGroups[groupKey].push(option);
		});

		// Sort the group keys (Type1, Type2...)
		const sortedKeys = getSortedGroupKeys(Object.keys(subGroups), 'type');

		// Create an array interleaving headers and their corresponding option groups
		const result: Array<{ key: string; options?: PictographData[]; isHeader: boolean }> = [];
		sortedKeys.forEach((key) => {
			if (subGroups[key]?.length > 0) {
				result.push({ key: key, isHeader: true }); // Header item
				result.push({ key: key + '-options', options: subGroups[key], isHeader: false }); // Options item
			}
		});
		return result;
	})();

	// Helper to generate a unique key for the outer each loop
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
			<OptionGroupGrid options={groupData.options} />
		{/if}
	{/each}
</div>

<style>
	.options-panel {
		display: flex;
		flex-direction: column;
		align-items: center; /* Center groups horizontally */
		/* FIXED: Align content to the top for proper scrolling */
		justify-content: flex-start;
		position: absolute; /* Keep for crossfade transitions */
		width: 100%;
		height: 100%;
		/* FIXED: Restore padding */
		padding: 1rem 0.5rem 2rem 0.5rem; /* Added top/bottom padding, kept side padding */
		box-sizing: border-box;
		/* FIXED: Enable vertical scrolling */
		overflow-y: auto;
		overflow-x: hidden; /* Keep horizontal overflow hidden */
		top: 0;
		left: 0;
	}

	/* --- Scrollbar Styles --- */
	.options-panel::-webkit-scrollbar {
		width: 6px;
	}
	.options-panel::-webkit-scrollbar-track {
		background: rgba(30, 41, 59, 0.3); /* Slightly transparent dark track */
		border-radius: 3px;
	}
	.options-panel::-webkit-scrollbar-thumb {
		background-color: rgba(100, 116, 139, 0.7); /* Semi-transparent thumb */
		border-radius: 3px;
	}
	.options-panel::-webkit-scrollbar-thumb:hover {
		background-color: rgba(148, 163, 184, 0.8); /* Lighter thumb on hover */
	}
</style>
