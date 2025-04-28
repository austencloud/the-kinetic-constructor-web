<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { crossfade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { PictographData } from '$lib/types/PictographData';
	import { uiState } from '../store';
	import { determineGroupKey, getSortedGroupKeys } from '../services/OptionsService';
	import type { SortMethod } from '../config';
	import { resize } from '../actions/resize';

	import SectionHeader from './SectionHeader.svelte';
	import OptionGroupGrid from './OptionGroupGrid.svelte';

	// Import new utilities
	import { scrollActions } from '../store/scrollStore';
	import { prefersReducedMotion } from '../utils/a11y';

	type LayoutRow = {
		type: 'single' | 'multi';
		groups: Array<{ key: string; options: PictographData[] }>;
	};

	export let selectedTab: string | null = null;
	export let options: PictographData[] = [];

	let panelElement: HTMLElement;
	let contentIsShort = false;
	let layoutRows: LayoutRow[] = [];
	let panelKey = selectedTab || 'default';
	let previousTab: string | null = null;

	// Set up crossfade for switching between layouts
	const [send, receive] = crossfade({
		duration: $prefersReducedMotion ? 0 : 300,
		easing: cubicOut
	});

	// Get sort method from store
	let sortMethod: SortMethod;
	uiState.subscribe((state) => {
		sortMethod = state.sortMethod;
	});

	// Update panel key for transitions
	$: {
		if (selectedTab) {
			panelKey = selectedTab;
		}
	}

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
	class="options-panel transition-optimized"
	bind:this={panelElement}
	use:resize={checkContentHeight}
	class:vertically-center={contentIsShort}
	role="tabpanel"
	aria-labelledby="tab-{selectedTab}"
	id="options-panel-{selectedTab}"
	in:receive={{ key: `panel-${panelKey}` }}
	out:send={{ key: `panel-${panelKey}` }}
	on:scroll={handleScroll}
>
	<div class="panel-content">
		{#each layoutRows as row, rowIndex}
			{#if row.type === 'single'}
				{#each row.groups as group}
					<SectionHeader groupKey={group.key} isFirstHeader={rowIndex === 0} />
					<OptionGroupGrid options={group.options} key={`${selectedTab}-${group.key}`} />
				{/each}
			{:else if row.type === 'multi'}
				<div class="multi-group-row">
					{#each row.groups as group, groupIndex}
						<div class="multi-group-item">
							<SectionHeader
								groupKey={group.key}
								isFirstHeader={rowIndex === 0 && groupIndex === 0}
							/>
							<OptionGroupGrid options={group.options} key={`${selectedTab}-${group.key}`} />
						</div>
					{/each}
				</div>
			{/if}
		{/each}
	</div>
</div>

<style>
	.options-panel {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		width: 100%;
		height: 100%;
		padding: 1rem 1rem 2rem 1rem; /* Increased horizontal padding for more breathing room */
		box-sizing: border-box;
		overflow-y: auto; /* Keep scrolling */
		overflow-x: hidden;
		transition: justify-content 0.2s ease-out;
	}

	/* Performance optimizations */
	.transition-optimized {
		will-change: transform, opacity;
		backface-visibility: hidden;
		transform: translateZ(0); /* Hardware acceleration hint */
	}

	.panel-content {
		width: 100%;
		height: 100%;
		position: relative;
	}

	.options-panel.vertically-center {
		justify-content: center;
	}

	.multi-group-row {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: space-evenly;
		align-items: flex-start;
		width: 100%;
		margin-top: 24px; /* Increased margin for better spacing */
		margin-bottom: 20px; /* Increased margin for better spacing */
		gap: 16px; /* Add explicit gap for consistent spacing */
	}

	.multi-group-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 120px;
		margin: 0 8px; /* Add horizontal margin between multi-group items */
	}

	/* --- Scrollbar Styles --- */
	.options-panel::-webkit-scrollbar {
		width: 8px; /* Slightly wider scrollbar for easier use */
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
