<!-- src/lib/components/OptionPicker/components/OptionsPanel.svelte -->
<script lang="ts">
	import { fade, crossfade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Option from './Option.svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import type { ResponsiveLayoutConfig } from '../utils/layoutUtils';

	// Props
	export let selectedTab: string | null = null;
	export let options: PictographData[] = [];
	export let layout: ResponsiveLayoutConfig;
	export let isMobileDevice: boolean = false;

	// Destructure layout props for easier access
	$: ({ gridColumns, optionSize, gridGap, gridClass } = layout);

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
		class="options-grid {gridClass}"
		class:mobile-grid={isMobileDevice}
		class:single-item-grid={options.length === 1}
		style:grid-template-columns={gridColumns}
		style:gap={gridGap}
	>
		{#each options as option, i (`${option.letter}-${option.startPos}-${option.endPos}-${i}`)}
			<div
				class="grid-item-wrapper"
				class:single-item={options.length === 1}
				transition:fade={{ duration: 250, delay: 30 * i, easing: cubicOut }}
			>
				<Option pictographData={option} size={optionSize} isSingleOption={options.length === 1} />
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
	}

	.grid-item-wrapper {
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

	.two-item-grid {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
		gap: var(--grid-gap, 1rem);
	}

	.two-item-grid .grid-item-wrapper {
		flex-grow: 0;
		flex-shrink: 0;
		width: auto;
	}

	.single-item-grid {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
	}

	.mobile-grid {
		padding: 0.2rem;
	}

	.small-count {
		align-content: center;
	}

	.exactly-eight {
		align-content: center;
	}
</style>
