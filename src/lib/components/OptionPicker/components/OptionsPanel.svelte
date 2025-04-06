<script lang="ts">
	import { fade, crossfade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Option from './Option.svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import type { ResponsiveLayoutConfig } from '../utils/layoutConfig/layoutUtils';

	// Props
	export let selectedTab: string | null = null;
	export let options: PictographData[] = [];
	export let layout: ResponsiveLayoutConfig;
	export let isMobileDevice: boolean = false;
	export let isPortraitMode: boolean = false;

	// Destructure layout props reactively
	$: ({ gridColumns, optionSize, gridGap, gridClass, aspectClass, scaleFactor } = layout);

	// Log layout changes for debugging
	$: {
		console.log('[OptionsPanel Layout Update]', {
			count: options.length,
			gridColumns,
			optionSize,
			gridGap,
			gridClass,
			aspectClass,
			scaleFactor
		});
	}

	// Combine custom style properties
	$: customStyle = `--option-size: ${optionSize}; --grid-gap: ${gridGap};`;

	// Setup transitions
	const [send, receive] = crossfade({
		duration: 400,
		easing: cubicOut,
		fallback: (node, params) => fade(node, { duration: 250, easing: cubicOut })
	});
</script>

<div
	class="options-panel"
	role="tabpanel"
	aria-labelledby="tab-{selectedTab}"
	id="options-panel-{selectedTab}"
	out:send={{ key: selectedTab }}
	in:receive={{ key: selectedTab }}
>
	<div
		class="options-grid {gridClass} {aspectClass}"
		class:mobile-grid={isMobileDevice}
		class:tablet-portrait-grid={isMobileDevice && isPortraitMode}
		style:grid-template-columns={gridColumns}
		style={customStyle}
	>
		{#each options as option, i (`${option.letter}-${option.startPos}-${option.endPos}-${i}`)}
			<div
				class="grid-item-wrapper"
				class:single-item={options.length === 1}
				class:two-item={options.length === 2}
				transition:fade={{ duration: 250, delay: 30 * i, easing: cubicOut }}
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
		overflow-y: auto;
		overflow-x: hidden;
		display: flex; /* Keep flex for easy horizontal centering */
		justify-content: center; /* Center grid horizontally */
		/* --- Vertical Alignment Fix --- */
		align-items: flex-start; /* Align grid to the top of the padded area */
		/* Add padding top/bottom for visual spacing */
		padding-top: 0.5rem; /* Adjust as needed */
		padding-bottom: 0.5rem; /* Adjust as needed */
		/* Keep left/right padding if needed, or remove if justify-content is enough */
		padding-left: 0.5rem; /* Adjust as needed */
		padding-right: 0.5rem; /* Adjust as needed */
		/* --- End Fix --- */
		box-sizing: border-box; /* Ensure padding is included in height */
	}

	.options-grid {
		display: grid;
		width: 100%; /* Grid takes full width within panel */
		max-width: 1200px; /* But constrained by max-width */
		/* --- Grid Item Centering Fix --- */
		justify-items: center; /* Horizontally center items within their grid cell */
		/* align-items: center; */ /* Add this if vertical centering *within* the cell is also needed */
		/* --- End Fix --- */
		align-content: flex-start; /* Default alignment for rows */
		position: relative;
		grid-gap: var(--grid-gap, 8px);
		padding: var(--grid-internal-padding, 0.5rem);

		/* Vertical centering using margins (works with flex parent) */
		margin-top: auto;
		margin-bottom: auto;

		/* Horizontal centering of the grid block itself */
		margin-left: auto;
		margin-right: auto;
	}

	/* Container aspect-based grid styling */
	/* Controls alignment of rows when grid has extra vertical space */
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
		display: flex; /* Keep flex for internal centering of Option component if needed */
		justify-content: center;
		align-items: center;
		position: relative;
		z-index: 1;
		transition: z-index 0s 0.2s;
		overflow: hidden;
		/* margin: 0 auto; */ /* REMOVED - Handled by justify-items on grid */
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
		margin-top: auto;
		margin-bottom: auto;
		justify-items: center; /* Ensure centering even for single */
	}
	.single-item-grid .grid-item-wrapper {
		transform: scale(1.1);
	}

	.two-item-grid {
		height: auto;
		padding: 0.5rem;
		width: fit-content;
		margin-top: auto;
		margin-bottom: auto;
		justify-items: center; /* Ensure centering even for two */
	}
	.two-item-grid .grid-item-wrapper {
		flex-grow: 0;
		flex-shrink: 0;
	}

	/* Count-based classes */
	.few-items-grid,
	.medium-items-grid {
		align-content: center;
		justify-content: center; /* Centers grid columns if grid is wider than columns */
	}
	.many-items-grid {
		justify-content: center; /* Centers grid columns */
		align-content: flex-start; /* Aligns rows to top */
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
