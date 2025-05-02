<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import { uiState } from '../store';
	import { determineGroupKey, getSortedGroupKeys } from '../services/OptionsService';
	import type { SortMethod } from '../config';
	import { resize } from '../actions/resize';
	// Removed optionGridTransition import

	import SectionHeader from './SectionHeader.svelte';
	import OptionGroupGrid from './OptionGroupGrid.svelte';

	// Import scroll utilities
	import { scrollActions } from '../store/scrollStore';

	type LayoutRow = {
		type: 'single' | 'multi';
		groups: Array<{ key: string; options: PictographData[] }>;
	};

	export let selectedTab: string | null = null;
	export let options: PictographData[] = [];
	export let transitionKey: string | number = 'default'; // Add transition key prop

	let panelElement: HTMLElement;
	let contentIsShort = false;
	let layoutRows: LayoutRow[] = [];
	let previousTab: string | null = null;

	// Get sort method from store
	let sortMethod: SortMethod;
	uiState.subscribe((state) => {
		sortMethod = state.sortMethod;
	});

	// Save scroll position when scrolling
	function handleScroll() {
		if (panelElement && selectedTab) {
			scrollActions.savePosition(`tab-${selectedTab}`, panelElement.scrollTop);
		}
	}

	// Restore scroll position after transition
	function restoreScrollPosition() {
		if (panelElement && selectedTab) {
			scrollActions.restorePosition(panelElement, `tab-${selectedTab}`, 50);
		}
	}

	// Track tab changes for scroll position management
	$: {
		if (selectedTab !== previousTab && previousTab !== null) {
			// Save the scroll position of the previous tab before switching
			if (panelElement && previousTab) {
				scrollActions.savePosition(`tab-${previousTab}`, panelElement.scrollTop);
			}
		}
		previousTab = selectedTab;
	}

	// Restore scroll position when component mounts
	onMount(() => {
		restoreScrollPosition();
	});

	$: groupedOptions = (() => {
		const subGroups: Record<string, PictographData[]> = {};
		options.forEach((option) => {
			// Ensure 'type' is used for grouping within OptionsPanel, regardless of the main sort method
			const groupKey = determineGroupKey(option, 'type');
			if (!subGroups[groupKey]) subGroups[groupKey] = [];
			subGroups[groupKey].push(option);
		});
		return subGroups;
	})();

	// Ensure keys are sorted according to 'type' logic
	$: sortedGroupKeys = getSortedGroupKeys(Object.keys(groupedOptions), 'type');

	$: layoutRows = (() => {
		const rows: LayoutRow[] = [];
		let i = 0;
		while (i < sortedGroupKeys.length) {
			const currentKey = sortedGroupKeys[i];
			const currentOptions = groupedOptions[currentKey];
			if (!currentOptions || currentOptions.length === 0) {
				i++;
				continue;
			}
			const isCurrentSmall = currentOptions.length <= MAX_ITEMS_FOR_SMALL_GROUP;

			if (isCurrentSmall) {
				const smallGroupSequence = [{ key: currentKey, options: currentOptions }];
				let j = i + 1;
				while (j < sortedGroupKeys.length) {
					const nextKey = sortedGroupKeys[j];
					const nextOptions = groupedOptions[nextKey];
					if (
						nextOptions &&
						nextOptions.length > 0 &&
						nextOptions.length <= MAX_ITEMS_FOR_SMALL_GROUP
					) {
						smallGroupSequence.push({ key: nextKey, options: nextOptions });
						j++;
					} else {
						break;
					}
				}
				if (smallGroupSequence.length >= 2) {
					rows.push({ type: 'multi', groups: smallGroupSequence });
					i = j;
				} else {
					rows.push({ type: 'single', groups: smallGroupSequence });
					i++;
				}
			} else {
				rows.push({ type: 'single', groups: [{ key: currentKey, options: currentOptions }] });
				i++;
			}
		}
		return rows;
	})();

	// Define the maximum number of items that can be in a group for it to be considered "small"
	// and potentially combined with other small groups in a multi-group row
	const MAX_ITEMS_FOR_SMALL_GROUP = 2;

	async function checkContentHeight() {
		await tick();
		if (!panelElement) return;
		const fits = panelElement.scrollHeight <= panelElement.clientHeight;
		if (fits !== contentIsShort) {
			contentIsShort = fits;
		}
	}

	$: options, checkContentHeight();
	onMount(checkContentHeight);
</script>

<div
	class="options-panel"
	bind:this={panelElement}
	use:resize={checkContentHeight}
	class:vertically-center={contentIsShort}
	role="tabpanel"
	aria-labelledby="tab-{selectedTab}"
	id="options-panel-{selectedTab}"
	on:scroll={handleScroll}
>
	<div class="panel-content">
		<!-- Removed transition -->
		{#each layoutRows as row, rowIndex (transitionKey + '-row-' + rowIndex)}
			{#if row.type === 'single'}
				{#each row.groups as group (transitionKey + '-group-' + group.key)}
					<SectionHeader groupKey={group.key} isFirstHeader={rowIndex === 0} />
					<OptionGroupGrid options={group.options} key={transitionKey + '-optgroup-' + group.key} />
				{/each}
			{:else if row.type === 'multi'}
				<div class="multi-group-row">
					{#each row.groups as group, groupIndex (transitionKey + '-multi-' + group.key)}
						<div class="multi-group-item">
							<SectionHeader
								groupKey={group.key}
								isFirstHeader={rowIndex === 0 && groupIndex === 0}
							/>
							<OptionGroupGrid
								options={group.options}
								key={transitionKey + '-multiopt-' + group.key}
							/>
						</div>
					{/each}
				</div>
			{/if}
		{/each}
	</div>
</div>

<style>
	.options-panel {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		box-sizing: border-box;
		/* padding: 1rem; */
	}

	.panel-content {
		width: 100%;
		padding: 0.5rem 0;
	}

	/* When content is short enough to fit, center it vertically */
	.options-panel.vertically-center .panel-content {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.multi-group-row {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: space-evenly;
		align-items: flex-start;
		width: 100%;
		background-color: rgba(0, 0, 0, 0.01);
		gap: 0.25rem;
	}

	.multi-group-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 140px;
		flex: 1;
		margin: 0.25rem;
		padding: 0.25rem;
		border-radius: 12px;
	}

	/* Responsive adjustments for mobile */
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

	/* Even smaller screens */
	@media (max-width: 380px) {
		.multi-group-item {
			min-width: 80px;
		}
	}

	/* --- Scrollbar Styles --- */
	.options-panel::-webkit-scrollbar {
		width: 8px;
	}
	.options-panel::-webkit-scrollbar-track {
		background: rgba(30, 41, 59, 0.3);
		border-radius: 4px;
	}
	.options-panel::-webkit-scrollbar-thumb {
		background-color: rgba(100, 116, 139, 0.7);
		border-radius: 4px;
	}
	.options-panel::-webkit-scrollbar-thumb:hover {
		background-color: rgba(148, 163, 184, 0.8);
	}
</style>
