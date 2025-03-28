<script lang="ts">
	import { get } from 'svelte/store';
	import type { Writable } from 'svelte/store';
	import type { PictographData } from '$lib/types/PictographData.js';
	import type { PropData } from '../objects/Prop/PropData';
	import type { ArrowData } from '../objects/Arrow/ArrowData';
	import Prop from '../objects/Prop/Prop.svelte';
	import Arrow from '../objects/Arrow/Arrow.svelte';
	import Grid from '../objects/Grid/Grid.svelte';
	import TKAGlyph from './../objects/Glyphs/TKAGlyph/TKAGlyph.svelte';
	import PictographDebugView from './PictographDebugView.svelte';
	import type { PictographManagers } from './PictographManagers';
	import type { RenderStage } from './constants/trackingConstants';

	// Props
	export let pictographDataStore: Writable<PictographData>;
	export let stage: RenderStage;
	export let redProp: PropData | null = null;
	export let blueProp: PropData | null = null;
	export let redArrow: ArrowData | null = null;
	export let blueArrow: ArrowData | null = null;
	export let pictographManagers: PictographManagers | null = null;
	export let debug: boolean = false;
	export let isDataComplete: () => boolean;

	// Event handlers
	export let onGridDataReady: (data: any) => void;
	export let onPropLoaded: (color: 'red' | 'blue') => void;
	export let onArrowLoaded: (color: 'red' | 'blue') => void;
	export let onComponentError: (component: string, error?: any) => void;
</script>

<svg
	class="pictograph"
	viewBox="0 0 950 950"
	xmlns="http://www.w3.org/2000/svg"
	role="img"
	aria-label="Pictograph"
>
	{#if stage === 'initializing' || stage === 'loading'}
		<!-- Initial loading indicator -->
		<text x="475" y="475" text-anchor="middle" font-size="24">Loading...</text>
	{:else}
		<!-- Always render the grid -->
		<Grid
			gridMode={get(pictographDataStore)?.gridMode || 'diamond'}
			onPointsReady={onGridDataReady}
			on:error={() => onComponentError('grid')}
		/>

		<!-- Check if pictograph data is complete -->
		{#if isDataComplete()}
			<!-- Render all components -->
			{#if get(pictographDataStore).letter}
				<TKAGlyph letter={get(pictographDataStore).letter} turnsTuple="(s, 0, 0)" x={50} y={800} />
			{/if}

			{#if redProp}
				<Prop
					propData={redProp}
					on:loaded={() => onPropLoaded('red')}
					on:error={() => onComponentError('redProp')}
				/>
			{/if}

			{#if blueProp}
				<Prop
					propData={blueProp}
					on:loaded={() => onPropLoaded('blue')}
					on:error={() => onComponentError('blueProp')}
				/>
			{/if}

			{#if redArrow}
				<Arrow
					arrowData={redArrow}
					on:loaded={() => onArrowLoaded('red')}
					on:error={() => onComponentError('redArrow')}
				/>
			{/if}

			{#if blueArrow}
				<Arrow
					arrowData={blueArrow}
					on:loaded={() => onArrowLoaded('blue')}
					on:error={() => onComponentError('blueArrow')}
				/>
			{/if}
		{/if}

		<!-- Debug visualization using the dedicated component -->
		{#if debug}
			<PictographDebugView {redProp} {blueProp} {stage} {pictographManagers} {isDataComplete} />
		{/if}
	{/if}
</svg>

<style>
	.pictograph {
		width: 100%;
		height: 100%;
		max-width: 100%;
		max-height: 100%;
		display: flex;
		flex: 1;
		background-color: white;
		transform: scale(1);
		z-index: 1;
		position: relative;
		border: 1px solid black;
		aspect-ratio: 1;
		margin: auto;
		overflow: visible;
		transform-origin: center center;
		transition: transform 0.1s;
	}
</style>
