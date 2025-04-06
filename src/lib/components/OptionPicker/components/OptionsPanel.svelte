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
		overflow-y: auto; /* Allows scrolling */
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
		width: 100%; /* Take full width within panel padding */
		max-width: 1200px;
		justify-content: center;
		align-content: flex-start; /* Default alignment within grid */
		position: relative;
		grid-gap: var(--grid-gap, 8px);
		/* Removed auto margins */
		margin-top: auto;
		margin-bottom: auto;
		margin-left: auto; /* Keep horizontal auto margins if needed */
		margin-right: auto;

		/* Internal padding within the grid itself */
		padding: var(--grid-internal-padding, 0.25rem);
	}

	/* Container aspect-based grid styling */
	.wide-aspect-container,
	.square-aspect-container {
		/* Center rows within the grid if grid is taller than content */
		/* This applies *within* the grid, panel padding provides overall space */
		align-content: center;
	}
	.tall-aspect-container {
		align-content: flex-start; /* Align rows to top within the grid */
		/* padding-top: clamp(0.5rem, 2vh, 2rem); */ /* Removed, panel padding handles this */
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
		/* Removed auto margins */
	}
	.single-item-grid .grid-item-wrapper {
		transform: scale(1.1);
	}

	.two-item-grid {
		height: auto;
		padding: 0.5rem;
		width: fit-content;
		/* Removed auto margins */
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
		.options-panel {
			padding-top: 0.5rem; /* Adjust padding for smaller screens */
			padding-bottom: 0.5rem;
			padding-left: 0.3rem;
			padding-right: 0.3rem;
		}
	}
	@media (min-width: 1280px) {
		.many-items-grid {
			max-width: 90%;
		}
	}
</style>
