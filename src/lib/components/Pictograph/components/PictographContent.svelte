<script lang="ts">
	import { get } from 'svelte/store';
	import type { Writable } from 'svelte/store';
	import type { PictographData } from '$lib/types/PictographData.js';
	import type { PropData } from '../../objects/Prop/PropData';
	import type { ArrowData } from '../../objects/Arrow/ArrowData';
	import type { PictographManagers } from '../core/PictographManagers';
	import type { RenderStage, ComponentLoadingStatus } from '../constants/trackingConstants';
	import type { GridData } from '../../objects/Grid/GridData';
	
	// Components
	import Grid from '../../objects/Grid/Grid.svelte';
	import TKAGlyph from '../../objects/Glyphs/TKAGlyph/TKAGlyph.svelte';
	import Prop from '../../objects/Prop/Prop.svelte';
	import Arrow from '../../objects/Arrow/Arrow.svelte';
	import LoadingIndicator from './LoadingIndicator.svelte';
	
	// Conditional imports for debug mode
	import PictographDebugView from './PictographDebugView.svelte';
	import PropPositionDebugger from './PropPositionDebugger.svelte';

	// Props
	export let pictographDataStore: Writable<PictographData>;
	export let stage: RenderStage;
	export let debug: boolean;
	export let isDataCompleteForRendering: () => boolean;
	export let redProp: PropData | null;
	export let blueProp: PropData | null;
	export let redArrow: ArrowData | null;
	export let blueArrow: ArrowData | null;
	export let pictographManagers: PictographManagers | null;
	
	// Event handlers
	export let onGridDataReady: (data: GridData) => void;
	export let onPropLoaded: (color: 'red' | 'blue') => void;
	export let onArrowLoaded: (color: 'red' | 'blue') => void;
	export let onComponentError: (componentKey: keyof ComponentLoadingStatus, error?: any) => void;

	// Reactive declarations
	$: pictographData = get(pictographDataStore);
	$: gridMode = pictographData?.gridMode || 'diamond';
	$: letter = pictographData?.letter;
	$: isLoading = stage === 'initializing' || stage === 'loading';
	$: dataComplete = isDataCompleteForRendering();
	$: gridData = pictographData?.gridData;
</script>

{#if isLoading}
	<LoadingIndicator />
{:else}
	<!-- Grid is always rendered -->
	<Grid
		{gridMode}
		onPointsReady={onGridDataReady}
		on:error={(e) => onComponentError('grid', e.detail)}
	/>

	{#if dataComplete}
		<!-- Letter glyph -->
		{#if letter}
			<TKAGlyph
				{letter}
				turnsTuple="(s, 0, 0)"
				x={50}
				y={800}
			/>
		{/if}

		<!-- Props -->
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

		<!-- Arrows -->
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

	<!-- Debug overlays -->
	{#if debug}
		<PictographDebugView
			{redProp}
			{blueProp}
			{stage}
			{pictographManagers}
			isDataComplete={isDataCompleteForRendering}
			visible={true}
		/>
		
		{#if gridData && (redProp || blueProp)}
			<PropPositionDebugger
				{gridData}
				{redProp}
				{blueProp}
				visible={true}
			/>
		{/if}
	{/if}
{/if}