<script lang="ts">
	import { getPictographContext } from '../context/PictographContext';
	import { RenderState } from '../utils/RenderStateMachine';
	import { Logger } from '$lib/utils/Logger';

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
	export let state: RenderState;
	export let showDebugOverlay: boolean = false;
	// State helper functions
	export let isLoading: () => boolean;
	// Define constants instead of unused exports
	export const isError = null; // Not using this directly in template
	export const isComplete = null; // Not using this directly in template

	const logger = new Logger('PictographContent');

	// Get context provided by parent
	const context = getPictographContext();
	const {
		pictographDataStore,
		redPropStore,
		bluePropStore,
		redArrowStore,
		blueArrowStore,
		gridDataStore,
		stateMachine
	} = context;

	// Create reactive references to our store values
	$: redProp = $redPropStore;
	$: blueProp = $bluePropStore;
	$: redArrow = $redArrowStore;
	$: blueArrow = $blueArrowStore;
	$: gridData = $gridDataStore;
	$: pictographData = $pictographDataStore;

	// Derived values
	$: gridMode = pictographData?.gridMode || 'diamond';
	$: letter = pictographData?.letter;
	$: showDebugInfo = showDebugOverlay || (context.debug && state === RenderState.COMPLETE);

	function isDataComplete(): boolean {
		if (!pictographData?.redMotionData || !pictographData?.blueMotionData) {
			return false;
		}

		if (state === RenderState.INITIALIZING || state === RenderState.LOADING) {
			return false;
		}

		if (!redProp || !blueProp || !redArrow || !blueArrow) {
			return false;
		}

		return true;
	}

	function handleGridDataReady(data: any) {
		logger.debug('Grid data ready', data);
		gridDataStore.set(data);
    
		pictographDataStore.update((current) => ({
			...current,
			gridData: data
		}));
	}

	function handlePropLoaded(color: 'red' | 'blue') {
		logger.debug(`${color} prop loaded`);
	}

	function handleArrowLoaded(color: 'red' | 'blue') {
		logger.debug(`${color} arrow loaded`);
	}

	function handleComponentError(componentKey: string, error?: any) {
		logger.error(`Error in component: ${componentKey}`, error);
		throw error;
	}
</script>

{#if isLoading()}
	<LoadingIndicator />
{:else}
	<Grid
		{gridMode}
		onPointsReady={handleGridDataReady}
		on:error={(e) => handleComponentError('grid', e.detail)}
	/>

	{#if isDataComplete()}
		{#if letter}
			<TKAGlyph {letter} turnsTuple="(s, 0, 0)" x={50} y={800} />
		{/if}

		{#if redProp}
			<Prop
				propData={redProp}
				on:loaded={() => handlePropLoaded('red')}
				on:error={(e) => handleComponentError('redProp', e.detail)}
			/>
		{/if}

		{#if blueProp}
			<Prop
				propData={blueProp}
				on:loaded={() => handlePropLoaded('blue')}
				on:error={(e) => handleComponentError('blueProp', e.detail)}
			/>
		{/if}

		<!-- Arrows -->
		{#if redArrow}
			<Arrow
				arrowData={redArrow}
				on:loaded={() => handleArrowLoaded('red')}
				on:error={(e) => handleComponentError('redArrow', e.detail)}
			/>
		{/if}

		{#if blueArrow}
			<Arrow
				arrowData={blueArrow}
				on:loaded={() => handleArrowLoaded('blue')}
				on:error={(e) => handleComponentError('blueArrow', e.detail)}
			/>
		{/if}
	{/if}

	<!-- Debug overlays -->
	{#if showDebugInfo}
		<PictographDebugView
			{redProp}
			{blueProp}
			stage={state}
			pictographManagers={context.managers}
			{isDataComplete}
			visible={true}
		/>

		{#if gridData && (redProp || blueProp)}
			<PropPositionDebugger {gridData} {redProp} {blueProp} visible={true} />
		{/if}
	{/if}
{/if}
