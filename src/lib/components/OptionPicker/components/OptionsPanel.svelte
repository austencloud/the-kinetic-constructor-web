<!-- src/lib/components/OptionPicker/components/OptionsPanel.svelte -->
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

	// Destructure layout props for easier access
	$: ({ gridColumns, optionSize, gridGap, gridClass, aspectClass, scaleFactor } = layout);
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
				<Option
					pictographData={option}
					size={optionSize}
					isSingleOption={options.length === 1}
					isPartOfTwoItems={options.length === 2}
				/>
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
		padding: clamp(0.5rem, 1vw, 1rem);
		display: flex;
		justify-content: center;
		align-items: flex-start;
		box-sizing: border-box;
	}

	.options-grid {
		display: grid;
		width: 100%;
		max-width: 1200px;
		justify-content: center;
		align-content: flex-start;
		position: relative;
		grid-gap: var(--grid-gap, 8px);
	}

	/* Container aspect-based grid styling */
	.wide-aspect-container {
		align-content: center;
	}

	.tall-aspect-container {
		align-content: flex-start;
		padding-top: clamp(0.5rem, 2vh, 2rem);
	}

	.square-aspect-container {
		align-content: center;
	}

	/* Grid item wrapper */
	.grid-item-wrapper {
		aspect-ratio: 1 / 1;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
		z-index: 1;
		transition: z-index 0s 0.2s;
		max-width: var(--option-size, auto);
		max-height: var(--option-size, auto);
		margin: 0 auto;
	}

	.grid-item-wrapper:hover {
		z-index: 10;
		transition-delay: 0s;
	}

	/* Special layout classes */
	.single-item-grid {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
	}

	.single-item-grid .grid-item-wrapper {
		transform: scale(1.2);
	}

	.two-item-grid {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
		gap: var(--grid-gap, 16px);
	}
  
	.two-item-grid.horizontal-layout {
		flex-direction: row;
	}
  
	.two-item-grid.vertical-layout {
		flex-direction: column;
	}

	.two-item-grid .grid-item-wrapper {
		flex-grow: 0;
		flex-shrink: 0;
	}

	/* Count-based classes */
	.few-items-grid {
		align-content: center;
		justify-content: center;
	}
  
	.medium-items-grid {
		align-content: center;
		justify-content: center;
	}

	.many-items-grid {
		justify-content: center;
	}

	/* Mobile styling */
	.mobile-grid {
		padding: 0.2rem;
		grid-gap: var(--grid-gap, 6px);
	}

	.mobile-grid.two-item-grid {
		padding: 0.5rem;
	}

	/* Responsive scaling for different grid configurations */
	@media (max-width: 480px) {
		.options-panel {
			padding: 0.3rem;
		}
      
		.grid-item-wrapper {
			max-width: 100%;
		}
	}
  
	@media (min-width: 1280px) {
		.many-items-grid {
			max-width: 90%;
			margin: 0 auto;
		}
	}
</style>