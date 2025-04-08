<script lang="ts">
	import { getContext } from 'svelte';
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Option from './Option.svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import { LAYOUT_CONTEXT_KEY, type LayoutContext } from '../layoutContext';
	import { uiState } from '../store'; // Needed to check sortMethod for single/two item class

	// --- Props ---
	export let options: PictographData[] = [];
	export let groupKey: string; // Unique key for this group (e.g., "Type1-options")

	// --- Context ---
	const layoutContext = getContext<LayoutContext>(LAYOUT_CONTEXT_KEY);
	$: ({ gridColumns, optionSize, gridGap, gridClass, aspectClass } = $layoutContext.layoutConfig);
	$: isMobileDevice = $layoutContext.isMobile;
	$: isTabletDevice = $layoutContext.isTablet;
	$: isPortraitMode = $layoutContext.isPortrait;

	// --- Get Sort Method from Store ---
	let currentSortMethod: string | null; // Can be SortMethod or null initially
	uiState.subscribe((state) => {
		currentSortMethod = state.sortMethod;
	});

	// --- Animation ---
	const baseDelay = 50; // ms
	const itemDelayIncrement = 20; // ms per item

	// Determine if special single/two item styling should apply
	// Only apply these classes if we are sorting by type (meaning this grid represents *all* options for that type)
	$: applySingleItemClass = options.length === 1 && currentSortMethod === 'type';
	$: applyTwoItemClass = options.length === 2 && currentSortMethod === 'type';
</script>

<div
	class="options-grid {gridClass} {aspectClass}"
	class:single-item-grid={applySingleItemClass}
	class:two-item-grid={applyTwoItemClass}
	class:mobile-grid={isMobileDevice}
	class:tablet-grid={isTabletDevice}
	class:tablet-portrait-grid={isTabletDevice && isPortraitMode}
	style:grid-template-columns={gridColumns}
	style:--grid-gap={gridGap}
	style:--option-size={optionSize}
>
	{#each options as option, i ((option.letter ?? '') + (option.startPos ?? '') + (option.endPos ?? '') + i)}
		<div
			class="grid-item-wrapper"
			class:single-item={applySingleItemClass}
			class:two-item={applyTwoItemClass}
			in:fade={{ duration: 250, delay: baseDelay + i * itemDelayIncrement, easing: cubicOut }}
			out:fade={{ duration: 150, delay: i * itemDelayIncrement * 0.5, easing: cubicOut }}
		>
			<Option pictographData={option} isPartOfTwoItems={applyTwoItemClass} />
		</div>
	{/each}
</div>

<style>
	/* --- Options Grid (Applied per group) --- */
	.options-grid {
		display: grid;
		max-width: max-content;
		width: auto;
		justify-items: center;
		justify-content: center;
		align-content: center; /* Changed from flex-start to center */
		grid-gap: var(--grid-gap, 8px);
	}

	/* --- Grid Item Wrapper --- */
	.grid-item-wrapper {
		width: var(--option-size, 100px);
		height: var(--option-size, 100px);
		aspect-ratio: 1 / 1;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
		z-index: 1;
		transition: z-index 0s 0.2s;
	}
	.grid-item-wrapper:hover {
		z-index: 10;
		transition-delay: 0s;
	}

	/* --- Specific Grid Layout Classes --- */
	.options-grid.tall-aspect-container {
		width: auto;
		max-width: max-content;
		align-content: center; /* Changed from flex-start to center */
	}
	.options-grid.wide-aspect-container,
	.options-grid.square-aspect-container {
		align-content: center;
	}

	/* Apply single/two item grid styles directly */

	/* --- Responsive Grid Adjustments --- */
	.mobile-grid {
		padding: 0.2rem;
		grid-gap: var(--grid-gap, 6px);
	}

	.tablet-portrait-grid {
		grid-gap: 0.5rem;
		padding: 0.25rem;
	}
	@media (min-width: 1280px) {
		.many-items-grid {
			max-width: 100%;
		}
	}
</style>
