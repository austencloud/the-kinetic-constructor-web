<!-- src/lib/components/Pictograph/PictographContent.svelte -->
<script lang="ts">
	import { get } from 'svelte/store';
	import type { Writable } from 'svelte/store';
	import type { PictographData } from '$lib/types/PictographData.js';
	import type { PropData } from '../objects/Prop/PropData';
	import type { ArrowData } from '../objects/Arrow/ArrowData';
	import type { PictographManagers } from './PictographManagers';
	import type { RenderStage, ComponentLoadingStatus, ComponentPositioningStatus } from './constants/trackingConstants';
    import type { GridData } from '../objects/Grid/GridData';

	// Import Child Components
	import Grid from '../objects/Grid/Grid.svelte';
	import TKAGlyph from './../objects/Glyphs/TKAGlyph/TKAGlyph.svelte';
	import Prop from '../objects/Prop/Prop.svelte';
	import Arrow from '../objects/Arrow/Arrow.svelte';
	import PictographDebugView from './PictographDebugView.svelte';

	// --- Props Passed Down from Pictograph.svelte ---

    /** The main pictograph data store (read-only access needed here). */
	export let pictographDataStore: Writable<PictographData>;
    /** The current rendering stage (controls loading indicator). */
	export let stage: RenderStage;
    /** Flag indicating if debug mode is active. */
	export let debug: boolean;
    /** Function to check if data is complete enough for full rendering. */
	export let isDataCompleteForRendering: () => boolean;

    // Visual Component Data
    /** Data for the red prop, managed by the parent. */
	export let redProp: PropData | null;
    /** Data for the blue prop, managed by the parent. */
	export let blueProp: PropData | null;
    /** Data for the red arrow, managed by the parent. */
	export let redArrow: ArrowData | null;
    /** Data for the blue arrow, managed by the parent. */
	export let blueArrow: ArrowData | null;

    /** Access to managers, primarily for debug view. */
	export let pictographManagers: PictographManagers | null;

    // --- Event Callbacks Passed Up to Pictograph.svelte ---

    /** Callback when the Grid component has its points ready. */
	export let onGridDataReady: (data: GridData) => void;
    /** Callback when a Prop component finishes loading its SVG/rendering. */
	export let onPropLoaded: (color: 'red' | 'blue') => void;
    /** Callback when an Arrow component finishes loading its SVG/rendering. */
	export let onArrowLoaded: (color: 'red' | 'blue') => void;
    /** Callback when any child component reports an error during loading/rendering. */
	export let onComponentError: (componentKey: keyof ComponentLoadingStatus, error?: any) => void; // Use specific key type

    // Reactive derived value for grid mode
    $: gridMode = get(pictographDataStore)?.gridMode || 'diamond';
    $: letter = get(pictographDataStore)?.letter; // Reactive letter

</script>

{#if stage === 'initializing' || stage === 'loading'}
	<!-- Simple text loading indicator (can be replaced with a spinner component) -->
	<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="24" fill="grey">
		Loading...
	</text>
{:else}
	<!-- Grid is always rendered once past initial loading stages -->
	<Grid
		{gridMode}
		onPointsReady={onGridDataReady}
		on:error={(e) => onComponentError('grid', e.detail)}
	/>

	<!-- Check if data is sufficient for rendering props, arrows, glyph -->
	{#if isDataCompleteForRendering()}
		<!-- Letter Glyph -->
		{#if letter}
			<TKAGlyph
				{letter}
				turnsTuple="(s, 0, 0)"
				x={50}
				y={800}
			/>
			<!-- Maybe add on:error handler here too -->
		{/if}

		<!-- Red Prop -->
		{#if redProp}
			<Prop
				propData={redProp}
				on:loaded={() => onPropLoaded('red')}
				on:error={(e) => onComponentError('redProp', e.detail)}
			/>
		{/if}

		<!-- Blue Prop -->
		{#if blueProp}
			<Prop
				propData={blueProp}
				on:loaded={() => onPropLoaded('blue')}
				on:error={(e) => onComponentError('blueProp', e.detail)}
			/>
		{/if}

		<!-- Red Arrow -->
		{#if redArrow}
			<Arrow
				arrowData={redArrow}
				on:loaded={() => onArrowLoaded('red')}
				on:error={(e) => onComponentError('redArrow', e.detail)}
			/>
		{/if}

		<!-- Blue Arrow -->
		{#if blueArrow}
			<Arrow
				arrowData={blueArrow}
				on:loaded={() => onArrowLoaded('blue')}
				on:error={(e) => onComponentError('blueArrow', e.detail)}
			/>
		{/if}

    {/if}


	<!-- Debug View (conditionally rendered) -->
	{#if debug}
		<PictographDebugView
            {redProp}
            {blueProp}
            {stage}
            {pictographManagers}
            isDataComplete={isDataCompleteForRendering}
            visible={true}
        />
        <!-- Consider adding PropPositionDebugger if needed -->
         <!-- <PropPositionDebugger {gridData} {redProp} {blueProp} visible={true}/> -->
	{/if}
{/if}