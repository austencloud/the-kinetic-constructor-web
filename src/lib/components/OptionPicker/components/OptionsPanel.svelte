<script lang="ts">
	import { getContext } from 'svelte';
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Option from './Option.svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import { LAYOUT_CONTEXT_KEY, type LayoutContext } from '../layoutContext';

	// --- Props ---
	export let selectedTab: string | null = null; // Identifier for the panel
	export let options: PictographData[] = []; // Options for *this* panel

	// --- Context ---
	const layoutContext = getContext<LayoutContext>(LAYOUT_CONTEXT_KEY);
	$: ({ gridColumns, optionSize, gridGap, gridClass, aspectClass } = $layoutContext.layoutConfig);
	$: isMobileDevice = $layoutContext.isMobile;
	$: isTabletDevice = $layoutContext.isTablet;
	$: isPortraitMode = $layoutContext.isPortrait;

	// --- Style ---
	// Removed buttonHeightEstimate and --panel-padding-top
	$: customStyle = `--option-size: ${optionSize}; --grid-gap: ${gridGap};`;

	// --- Animation ---
	function getAnimationDelay(index: number): number {
		const columns = parseInt(gridColumns.match(/repeat\((\d+)/)?.[1] || '3');
		const row = Math.floor(index / columns);
		const col = index % columns;
		return (row + col) * 35;
	}
</script>

<div
	class="options-panel"
	role="tabpanel"
	aria-labelledby="tab-{selectedTab}"
	id="options-panel-{selectedTab}"
	transition:fade={{ duration: 200 }}
	style={customStyle}
>
	<div
		class="options-grid {gridClass} {aspectClass}"
		class:mobile-grid={isMobileDevice}
		class:tablet-grid={isTabletDevice}
		class:tablet-portrait-grid={isTabletDevice && isPortraitMode}
		style:grid-template-columns={gridColumns}
	>
		{#each options as option, i ((option.letter ?? '') + option.startPos + option.endPos + i)}
			<div
				class="grid-item-wrapper"
				class:single-item={options.length === 1}
				class:two-item={options.length === 2}
				in:fade={{ duration: 300, delay: getAnimationDelay(i), easing: cubicOut }}
				out:fade={{ duration: 200, delay: getAnimationDelay(i) * 0.6, easing: cubicOut }}
			>
				<Option pictographData={option} isPartOfTwoItems={options.length === 2} />
			</div>
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
		display: flex;
		justify-content: center;
		align-items: flex-start;
		/* Removed dynamic padding-top, revert to standard padding */
		padding: 0.5rem;
		box-sizing: border-box;
		overflow-y: auto;
		overflow-x: hidden;
	}

	.options-grid {
		display: grid;
		width: 100%;
		max-width: 1200px;
		justify-items: center;
		justify-content: center; /* Add this line */
		align-content: flex-start;
		position: relative;
		grid-gap: var(--grid-gap, 8px);
		margin: auto;
	}
	.options-grid.tall-aspect-container {
		width: auto;
		max-width: max-content;
	}

	/* Other styles remain the same */
	.wide-aspect-container,
	.square-aspect-container {
		align-content: center;
	}
	.tall-aspect-container {
		align-content: flex-start;
	}

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

	.single-item-grid {
		height: auto;
		padding: 0.5rem;
		width: fit-content;
		margin: auto;
		justify-items: center;
	}

	.single-item-grid .grid-item-wrapper {
		transform: scale(1.1);
	}

	.two-item-grid {
		height: auto;
		padding: 0.5rem;
		width: fit-content;
		margin: auto;
		justify-items: center;
	}

	.two-item-grid .grid-item-wrapper {
		flex-grow: 0;
		flex-shrink: 0;
	}

	.mobile-grid {
		padding: 0.2rem;
		grid-gap: var(--grid-gap, 6px);
	}

	.mobile-grid.two-item-grid,
	.mobile-grid.single-item-grid {
		padding: 0.5rem;
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
