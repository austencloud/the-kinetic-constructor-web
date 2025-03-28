<script lang="ts">
	import { get } from 'svelte/store';
	import type { Writable } from 'svelte/store';
	import type { PictographData } from '$lib/types/PictographData.js';
	import type { PropData } from '../objects/Prop/PropData';
	import type { ArrowData } from '../objects/Arrow/ArrowData';
	import type { PictographManagers } from './PictographManagers';
	import type { RenderStage, ComponentLoadingStatus, ComponentPositioningStatus } from './constants/trackingConstants';
	import type { GridData } from '../objects/Grid/GridData';
	import Grid from '../objects/Grid/Grid.svelte';
	import TKAGlyph from './../objects/Glyphs/TKAGlyph/TKAGlyph.svelte';
	import Prop from '../objects/Prop/Prop.svelte';
	import Arrow from '../objects/Arrow/Arrow.svelte';
	import PictographDebugView from './PictographDebugView.svelte';

	export let pictographDataStore: Writable<PictographData>;
	export let stage: RenderStage;
	export let debug: boolean;
	export let isDataCompleteForRendering: () => boolean;
	export let redProp: PropData | null;
	export let blueProp: PropData | null;
	export let redArrow: ArrowData | null;
	export let blueArrow: ArrowData | null;
	export let pictographManagers: PictographManagers | null;
	export let onGridDataReady: (data: GridData) => void;
	export let onPropLoaded: (color: 'red' | 'blue') => void;
	export let onArrowLoaded: (color: 'red' | 'blue') => void;
	export let onComponentError: (componentKey: keyof ComponentLoadingStatus, error?: any) => void;

	$: gridMode = get(pictographDataStore)?.gridMode || 'diamond';
	$: letter = get(pictographDataStore)?.letter;
</script>

{#if stage === 'initializing' || stage === 'loading'}
	<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="24" fill="grey">
		Loading...
	</text>
{:else}
	<Grid
		{gridMode}
		onPointsReady={onGridDataReady}
		on:error={(e) => onComponentError('grid', e.detail)}
	/>

	{#if isDataCompleteForRendering()}
		{#if letter}
			<TKAGlyph
				{letter}
				turnsTuple="(s, 0, 0)"
				x={50}
				y={800}
			/>
		{/if}

		{#if redProp}
			<Prop
				propData={redProp}
				on:loaded={() => onPropLoaded('red')}
				on:error={(e) => onComponentError('redProp', e.detail)}
			/>
		{/if}

		{#if blueProp}
			<Prop
				propData={blueProp}
				on:loaded={() => onPropLoaded('blue')}
				on:error={(e) => onComponentError('blueProp', e.detail)}
			/>
		{/if}

		{#if redArrow}
			<Arrow
				arrowData={redArrow}
				on:loaded={() => onArrowLoaded('red')}
				on:error={(e) => onComponentError('redArrow', e.detail)}
			/>
		{/if}

		{#if blueArrow}
			<Arrow
				arrowData={blueArrow}
				on:loaded={() => onArrowLoaded('blue')}
				on:error={(e) => onComponentError('blueArrow', e.detail)}
			/>
		{/if}
	{/if}

	{#if debug}
		<PictographDebugView
			{redProp}
			{blueProp}
			{stage}
			{pictographManagers}
			isDataComplete={isDataCompleteForRendering}
			visible={true}
		/>
	{/if}
{/if}
