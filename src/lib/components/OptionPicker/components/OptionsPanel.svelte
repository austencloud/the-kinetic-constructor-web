<script lang="ts">
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Option from './Option.svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import type { ResponsiveLayoutConfig } from '../utils/layoutConfig/layoutUtils';
	import { tick } from 'svelte';

	// Props
	export let selectedTab: string | null = null;
	export let options: PictographData[] = [];
	export let layout: ResponsiveLayoutConfig;
	export let isMobileDevice: boolean = false;
	export let isPortraitMode: boolean = false;

	// Destructure layout props reactively
	$: ({ gridColumns, optionSize, gridGap, gridClass, aspectClass, scaleFactor } = layout);

	// Combine custom style properties
	$: customStyle = `--option-size: ${optionSize}; --grid-gap: ${gridGap};`;
	
	// Keep track of current and previous tab state for sequenced animation
	let currentOptionsKey = selectedTab || 'initial';
	let previousOptionsKey: string | null = null;
	let isTransitioning = false;
	
	// When selectedTab changes, sequence the animations
	$: if (selectedTab !== currentOptionsKey && !isTransitioning) {
		handleTabChange();
	}
	
	async function handleTabChange() {
		isTransitioning = true;
		previousOptionsKey = currentOptionsKey;
		await tick();
		
		// After a brief delay (enough for exit animation), update to new options
		setTimeout(() => {
			currentOptionsKey = selectedTab || 'empty';
			previousOptionsKey = null;
			isTransitioning = false;
		}, 250); // This should match or be slightly longer than the exit animation duration
	}
	
	// Calculate item animation delay based on position rather than index
	function getItemDelay(index: number, isExiting = false): number {
		// For exit animations, we want them to fade out more quickly and with less delay between items
		if (isExiting) return index * 15; // Shorter delays between items when exiting
		
		const columns = layout.gridColumns.match(/repeat\((\d+)/)?.[1];
		const numCols = columns ? parseInt(columns) : 4; // Default to 4 if parsing fails
		
		if (numCols <= 1) return index * 25; // Sequential for single column
		
		// Calculate row and column positions
		const row = Math.floor(index / numCols);
		const col = index % numCols;
		
		// Wave-like animation (diagonal pattern)
		return (row + col) * 25;
	}
</script>

<div class="options-panel-container">
	{#if previousOptionsKey !== null}
		<!-- Previous options fading out -->
		<div
			class="options-panel exiting"
			out:fade={{ duration: 200, easing: cubicOut }}
		>
			<div
				class="options-grid {gridClass} {aspectClass}"
				class:mobile-grid={isMobileDevice}
				class:tablet-portrait-grid={isMobileDevice && isPortraitMode}
				style:grid-template-columns={gridColumns}
				style={customStyle}
			>
				{#each options as option, i (`${previousOptionsKey}-${option.letter}-${option.startPos}-${option.endPos}-${i}`)}
					<div
						class="grid-item-wrapper"
						class:single-item={options.length === 1}
						class:two-item={options.length === 2}
						out:fade={{ duration: 150, delay: getItemDelay(i, true), easing: cubicOut }}
					>
						<Option pictographData={option} isPartOfTwoItems={options.length === 2} />
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<!-- Current options fading in -->
		<div
			class="options-panel"
			in:fade={{ duration: 150, delay: 100, easing: cubicOut }}
		>
			<div
				class="options-grid {gridClass} {aspectClass}"
				class:mobile-grid={isMobileDevice}
				class:tablet-portrait-grid={isMobileDevice && isPortraitMode}
				style:grid-template-columns={gridColumns}
				style={customStyle}
			>
				{#each options as option, i (`${currentOptionsKey}-${option.letter}-${option.startPos}-${option.endPos}-${i}`)}
					<div
						class="grid-item-wrapper"
						class:single-item={options.length === 1}
						class:two-item={options.length === 2}
						in:fade={{ duration: 200, delay: getItemDelay(i), easing: cubicOut }}
					>
						<Option pictographData={option} isPartOfTwoItems={options.length === 2} />
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.options-panel-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.options-panel {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding: 0.5rem;
		box-sizing: border-box;
	}

	.options-panel.exiting {
		pointer-events: none; /* Prevent interaction with items that are exiting */
	}

	.options-grid {
		display: grid;
		width: 100%;
		max-width: 1200px;
		justify-items: center;
		align-content: flex-start;
		position: relative;
		grid-gap: var(--grid-gap, 8px);
		padding: var(--grid-internal-padding, 0.5rem);
		margin: auto;
	}

	/* Container aspect-based grid styling */
	.wide-aspect-container,
	.square-aspect-container {
		align-content: center;
	}
	.tall-aspect-container {
		align-content: flex-start;
	}

	/* Grid item wrapper */
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
		overflow: hidden;
	}
	.grid-item-wrapper:hover {
		z-index: 10;
		transition-delay: 0s;
	}

	/* Special layout classes */
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

	/* Count-based classes */
	.few-items-grid,
	.medium-items-grid {
		align-content: center;
		justify-content: center;
	}
	.many-items-grid {
		justify-content: center;
		align-content: flex-start;
	}

	/* Mobile styling */
	.mobile-grid {
		padding: 0.2rem;
		grid-gap: var(--grid-gap, 6px);
	}
	.mobile-grid.two-item-grid,
	.mobile-grid.single-item-grid {
		padding: 0.5rem;
	}

	/* Tablet portrait specific styling */
	.tablet-portrait-grid {
		grid-gap: 0.5rem;
		padding: 0.25rem;
	}

	/* Responsive adjustments */
	@media (max-width: 480px) {
		/* Panel padding handled by margin:auto on grid */
	}
	@media (min-width: 1280px) {
		.many-items-grid {
			max-width: 90%;
		}
	}
</style>