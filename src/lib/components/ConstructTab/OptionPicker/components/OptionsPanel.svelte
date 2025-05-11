<script lang="ts">
	import { onMount } from 'svelte';
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

	const { selectedTab = null, options = [], transitionKey = 'default' } = $props<{
		selectedTab?: string | null;
		options?: PictographData[];
		transitionKey?: string | number;
	}>();

	let panelElement: HTMLElement;
	let contentIsShort = $state(false); // Use $state for reactive updates
	let layoutRows: LayoutRow[] = $state([]); // Use $state for reactive updates
	let previousTab: string | null = null;
	let isReady = $state(false); // Track if component is ready to be shown, use $state

	// Get sort method from store
	let sortMethod: SortMethod;
	// No need for manual subscription with $effect
	$effect(() => {
		sortMethod = $uiState.sortMethod;
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
	$effect(() => {
		// This effect runs when selectedTab changes
		if (selectedTab !== previousTab && previousTab !== null) {
			// Save the scroll position of the previous tab before switching
			if (panelElement && previousTab) {
				scrollActions.savePosition(`tab-${previousTab}`, panelElement.scrollTop);
			}
		}
		previousTab = selectedTab;

		// When selectedTab changes, try to restore its scroll position
		// This needs to happen after the DOM updates for the new tab
		// Using a timeout allows the DOM to update.
		setTimeout(() => {
			restoreScrollPosition();
		}, 0);
	});


	// Restore scroll position when component mounts for the initial tab
	onMount(() => {
		// Ensure this runs after the panelElement is available and initial content is rendered
		setTimeout(() => {
			restoreScrollPosition();
		}, 50); // A small delay might be needed for initial render
	});


	// Group options based on the 'type' sort method, regardless of the global sortMethod
	// This ensures consistent grouping within the OptionsPanel.
	const MAX_ITEMS_FOR_SMALL_GROUP = 2;

	$effect(() => {
		const subGroups: Record<string, PictographData[]> = {};
		options.forEach((option: PictographData) => {
			const groupKey = determineGroupKey(option, 'type'); // Always group by 'type' here
			if (!subGroups[groupKey]) subGroups[groupKey] = [];
			subGroups[groupKey].push(option);
		});

		const currentSortedGroupKeys = getSortedGroupKeys(Object.keys(subGroups), 'type'); // Sort keys by 'type' logic

		const rows: LayoutRow[] = [];
		let i = 0;
		while (i < currentSortedGroupKeys.length) {
			const currentKey = currentSortedGroupKeys[i];
			const currentOptions = subGroups[currentKey];
			if (!currentOptions || currentOptions.length === 0) {
				i++;
				continue;
			}
			const isCurrentSmall = currentOptions.length <= MAX_ITEMS_FOR_SMALL_GROUP;

			if (isCurrentSmall) {
				const smallGroupSequence = [{ key: currentKey, options: currentOptions }];
				let j = i + 1;
				while (j < currentSortedGroupKeys.length) {
					const nextKey = currentSortedGroupKeys[j];
					const nextOptions = subGroups[nextKey];
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
		layoutRows = rows; // Update the $state variable
	});


	// Debounced function to check content height
	const debouncedCheckContentHeight = (() => {
		let timeoutId: ReturnType<typeof setTimeout> | null = null;
		return () => {
			if (timeoutId !== null) clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				if (!panelElement) return;
				const panelContent = panelElement.querySelector('.panel-content');
				if (!panelContent) return;

				// Simplified check: scrollHeight includes content's own padding.
				// Compare directly with container's clientHeight.
				const buffer = 10; // Small buffer to prevent flickering
				const fits = panelContent.scrollHeight + buffer <= panelElement.clientHeight;
				
				if (fits !== contentIsShort) {
					contentIsShort = fits; // Update $state variable
					if (import.meta.env.DEV) {
						console.debug('OptionsPanel content fits:', fits, {
							contentHeight: panelContent.scrollHeight,
							containerHeight: panelElement.clientHeight,
							buffer
						});
					}
				}
				timeoutId = null;
			}, 100); // Debounce delay
		};
	})();

	// Effect to check content height when options or panelElement change
	$effect(() => {
		if (options && panelElement) {
			// Use setTimeout to ensure check runs after DOM updates
			setTimeout(() => debouncedCheckContentHeight(), 0);
		}
	});

	// Effect for initial readiness and content height check
	onMount(() => {
		setTimeout(() => {
			debouncedCheckContentHeight();
			isReady = true; // Update $state variable
		}, 100); // Delay for initial render
	});

</script>

<div
	class="options-panel"
	class:ready={isReady}
	bind:this={panelElement}
	use:resize={debouncedCheckContentHeight}
	class:vertically-center={contentIsShort}
	role="tabpanel"
	aria-labelledby="tab-{selectedTab}"
	id="options-panel-{selectedTab}"
	onscroll={handleScroll}
>
	<div class="panel-content">
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
		overflow-y: auto; /* Allows vertical scrolling */
		overflow-x: hidden; /* Prevents horizontal scrolling */
		box-sizing: border-box;
		display: flex; /* Using flex to help with centering logic */
		flex-direction: column;
		/* justify-content: flex-start; Default, but explicit for scrollable content */
		opacity: 0;
		transition: opacity 0.2s ease-out;
	}

	.options-panel.ready {
		opacity: 1;
	}

	.panel-content {
		width: 100%;
		padding: 0.5rem 0; /* Consistent padding, includes 0.5rem top and bottom */
		display: flex;
		flex-direction: column;
		align-items: center;
		/* min-height: fit-content; /* Ensures it takes at least the height of its content */
		/* flex-grow: 1; /* Allows panel-content to grow if options-panel is taller and not vertically centered */
	}

	/* When content is short, center it. panel-content itself is absolutely positioned. */
	.options-panel.vertically-center {
		justify-content: center; /* Center .panel-content if it's smaller than .options-panel */
	}
	.options-panel.vertically-center .panel-content {
		position: absolute; /* Detach from flow for centering */
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		/* Padding is already 0.5rem 0 from its own rule, no need to override here unless different */
		/* max-height: 100%; /* Ensure it doesn't overflow its centered container */
	}

	/* REMOVED THIS RULE: This was the primary cause of the scrolling issue.
	   By applying padding-top here, it was added *inside* the scrollable area.
	*/
	/*
	.options-panel:not(.vertically-center) .panel-content {
		padding-top: 20px; 
	}
	*/

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
			min-width: 80px;
		}
	}

	.options-panel {
		scrollbar-width: thin;
		scrollbar-color: rgba(100, 116, 139, 0.7) rgba(30, 41, 59, 0.1);
	}

	.options-panel::-webkit-scrollbar {
		width: 10px;
	}

	.options-panel::-webkit-scrollbar-track {
		background: rgba(30, 41, 59, 0.1);
		border-radius: 6px;
		margin: 2px 0;
	}

	.options-panel::-webkit-scrollbar-thumb {
		background-color: rgba(100, 116, 139, 0.7);
		border-radius: 6px;
		border: 2px solid transparent;
		background-clip: padding-box;
	}

	.options-panel::-webkit-scrollbar-thumb:hover {
		background-color: rgba(148, 163, 184, 0.9);
	}
</style>
