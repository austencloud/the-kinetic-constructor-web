<script lang="ts">
	import { PropType } from '$lib/types/Types';
	import { onMount, createEventDispatcher } from 'svelte';
	import { get, writable, type Writable } from 'svelte/store';

	import type { PictographData } from '$lib/types/PictographData.js';
	import type { PropData } from '../objects/Prop/PropData';
	import type { ArrowData } from '../objects/Arrow/ArrowData';
	import type { GridData } from '../objects/Grid/GridData';

	import Grid from '../objects/Grid/Grid.svelte';
	import Prop from '../objects/Prop/Prop.svelte';
	import Arrow from '../objects/Arrow/Arrow.svelte';
	import TKAGlyph from '../objects/Glyphs/TKAGlyph/TKAGlyph.svelte';
	import { BetaPropPositioner } from '$lib/components/PlacementManagers/PropPlacementManager/BetaPropPositioner';
	import { PictographChecker } from './PictographChecker';
	import { PictographComponentLoader } from './services/PictographComponentLoader';
	import { PictographComponentPositioner } from './services/PictographComponentPositioner';

	export let pictographDataStore: Writable<PictographData>;
	export let onClick: (() => void) | undefined = undefined;
	export let debug: boolean = false;

	const dispatch = createEventDispatcher<{
		loaded: { complete: boolean; error?: boolean; message?: string };
		error: { source: string; error?: any; message?: string };
	}>();

	// Define render states for clarity
	const RENDER_STATES = {
		INITIALIZING: 'initializing',
		GRID_ONLY: 'grid_only',
		LOADING: 'loading',
		COMPLETE: 'complete',
		ERROR: 'error'
	};

	// Component state
	let renderState = RENDER_STATES.INITIALIZING;
	let gridData: GridData | null = null;
	let redPropData: PropData | null = null;
	let bluePropData: PropData | null = null;
	let redArrowData: ArrowData | null = null;
	let blueArrowData: ArrowData | null = null;
	let errorMessage: string | null = null;

	// Component loading trackers 
	const requiredComponents = new Set<string>(['grid']);
	const loadedComponents = new Set<string>();

	// Services
	let componentLoader: PictographComponentLoader;
	let componentPositioner: PictographComponentPositioner;
	$: pictographChecker = new PictographChecker(get(pictographDataStore));

	// Initialize services on mount
	onMount(() => {
		componentLoader = new PictographComponentLoader(pictographDataStore);
		componentPositioner = new PictographComponentPositioner(pictographDataStore);

		const pictographData = get(pictographDataStore);

		// Determine initial state based on available data
		if (!hasRequiredPictographData(pictographData)) {
			renderState = RENDER_STATES.GRID_ONLY;
			return;
		}

		renderState = RENDER_STATES.LOADING;
	});

	// Check if we have minimum required data for full pictograph
	function hasRequiredPictographData(data: PictographData): boolean {
		return !!(data && data.redMotionData && data.blueMotionData);
	}

	// Handle grid data being ready
	function onGridDataReady(data: GridData) {
		gridData = data;

		// Update store with grid data
		pictographDataStore.update((store) => ({
			...store,
			gridData: data
		}));

		// Mark grid as loaded
		loadedComponents.add('grid');

		// If we're only showing the grid, dispatch partial loading complete
		if (renderState === RENDER_STATES.GRID_ONLY) {
			dispatch('loaded', { complete: false });
			return;
		}

		// Initialize other components
		initializeComponents();
	}

	// Initialize components based on motion data
	function initializeComponents() {
		try {
			const data = get(pictographDataStore);

			// Create components from motion data
			if (data.redMotionData) {
				redPropData = componentLoader.createPropFromMotion(data.redMotionData, 'red');
				redArrowData = componentLoader.createArrowFromMotion(data.redMotionData, 'red');
				requiredComponents.add('redProp');
				requiredComponents.add('redArrow');
			}

			if (data.blueMotionData) {
				bluePropData = componentLoader.createPropFromMotion(data.blueMotionData, 'blue');
				blueArrowData = componentLoader.createArrowFromMotion(data.blueMotionData, 'blue');
				requiredComponents.add('blueProp');
				requiredComponents.add('blueArrow');
			}

			// Update store with component data
			pictographDataStore.update((store) => ({
				...store,
				redPropData,
				bluePropData,
				redArrowData,
				blueArrowData
			}));

			renderState = RENDER_STATES.LOADING;
		} catch (err) {
			handleError('initialization', err);
		}
	}

	// Component loading handler
	function onComponentLoaded(component: string) {
		loadedComponents.add(component);
		checkAllComponentsLoaded();
	}

	// Check if all required components are loaded
	function checkAllComponentsLoaded() {
		const allLoaded = Array.from(requiredComponents).every((comp) => loadedComponents.has(comp));
		if (allLoaded) {
			positionComponents();
		}
	}

	// Position components once all are loaded
	function positionComponents() {
		try {
			if (!gridData) {
				throw new Error('Grid data not available for positioning');
			}

			// Position all components
			if (redPropData) componentPositioner.positionProp(redPropData, gridData);
			if (bluePropData) componentPositioner.positionProp(bluePropData, gridData);

			// Special positioning for beta ending
			if (redPropData && bluePropData && pictographChecker.endsWithBeta()) {
				try {
					const pictographData = get(pictographDataStore);
					const betaPositioner = new BetaPropPositioner(pictographData);
					betaPositioner.reposition([redPropData, bluePropData]);
				} catch (betaError) {
					console.error('Error applying beta positioning:', betaError);
				}
			}

			// Position arrows after props
			if (redArrowData) componentPositioner.positionArrow(redArrowData, gridData, redPropData);
			if (blueArrowData) componentPositioner.positionArrow(blueArrowData, gridData, bluePropData);

			// Update store with positioned components
			pictographDataStore.update((store) => ({
				...store,
				redPropData,
				bluePropData,
				redArrowData,
				blueArrowData
			}));

			// Mark as complete
			renderState = RENDER_STATES.COMPLETE;
			dispatch('loaded', { complete: true });
		} catch (err) {
			handleError('positioning', err);
		}
	}

	// Centralized error handler
	function handleError(source: string, err: any) {
		const message = err instanceof Error ? err.message : String(err);
		console.error(`Pictograph error [${source}]:`, err);

		errorMessage = message;
		renderState = RENDER_STATES.ERROR;

		dispatch('error', { source, error: err, message });
		dispatch('loaded', { complete: false, error: true, message });
	}

	// Handle component errors but continue loading
	function handleComponentError(componentKey: string, err: any) {
		console.warn(`Component error (${componentKey}):`, err);
		// Mark as loaded even with error to avoid hanging
		loadedComponents.add(componentKey);
		checkAllComponentsLoaded();
	}

	// Handle click on wrapper
	function handleWrapperClick() {
		if (onClick) onClick();
	}
</script>

<div
	class="pictograph-wrapper"
	on:click={handleWrapperClick}
	on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick && onClick()}
	role={onClick ? 'button' : undefined}
	tabIndex={onClick ? 0 : undefined}
	aria-label="Pictograph container for letter {get(pictographDataStore)?.letter || 'N/A'}"
>
	<svg
		class="pictograph"
		viewBox="0 0 950 950"
		xmlns="http://www.w3.org/2000/svg"
		role="img"
		aria-label="Pictograph visualization for letter {get(pictographDataStore)?.letter || 'N/A'}"
	>
		<!-- Display appropriate content based on render state -->
		{#if renderState === RENDER_STATES.INITIALIZING}
			<text
				x="50%"
				y="50%"
				dominant-baseline="middle"
				text-anchor="middle"
				font-size="24"
				fill="grey"
			>
				Loading...
			</text>
		{:else if renderState === RENDER_STATES.ERROR}
			<text
				x="50%"
				y="50%"
				dominant-baseline="middle"
				text-anchor="middle"
				font-size="24"
				fill="red"
			>
				Error: {errorMessage}
			</text>
		{:else}
			<!-- Grid is always shown -->
			<Grid
				gridMode={get(pictographDataStore).gridMode}
				onPointsReady={onGridDataReady}
				on:error={(e) => handleComponentError('grid', e.detail)}
				{debug}
			/>

			<!-- Show additional components if not grid-only mode -->
			{#if renderState !== RENDER_STATES.GRID_ONLY}
				<!-- Letter glyph -->
				{#if get(pictographDataStore).letter}
					<TKAGlyph
						letter={get(pictographDataStore).letter}
						turnsTuple="(s, 0, 0)"
						x={50}
						y={800}
					/>
				{/if}

				<!-- Props -->
				{#if redPropData}
					<Prop
						propData={redPropData}
						on:loaded={() => onComponentLoaded('redProp')}
						on:error={(e) => handleComponentError('redProp', e.detail)}
					/>
				{/if}

				{#if bluePropData}
					<Prop
						propData={bluePropData}
						on:loaded={() => onComponentLoaded('blueProp')}
						on:error={(e) => handleComponentError('blueProp', e.detail)}
					/>
				{/if}

				<!-- Arrows -->
				{#if redArrowData}
					<Arrow
						arrowData={redArrowData}
						on:loaded={() => onComponentLoaded('redArrow')}
						on:error={(e) => handleComponentError('redArrow', e.detail)}
					/>
				{/if}

				{#if blueArrowData}
					<Arrow
						arrowData={blueArrowData}
						on:loaded={() => onComponentLoaded('blueArrow')}
						on:error={(e) => handleComponentError('blueArrow', e.detail)}
					/>
				{/if}
			{/if}
		{/if}
	</svg>
</div>

<style>
	.pictograph-wrapper {
		width: 100%;
		height: 100%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pictograph-wrapper:hover {
		cursor: pointer;
	}

	.pictograph {
		width: 100%;
		height: 100%;
		max-width: 100%;
		max-height: 100%;
		display: block;
		background-color: white;
		transition: transform 0.1s ease-in-out;
		transform: scale(1);
		z-index: 1;
		position: relative;
		border: 1px solid #ccc;
		aspect-ratio: 1 / 1;
		margin: auto;
		overflow: visible;
		transform-origin: center center;
	}

	.pictograph-wrapper:hover .pictograph {
		transform: scale(1.05);
		z-index: 4;
		border: 4px solid gold;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.pictograph-wrapper:active .pictograph {
		transform: scale(1);
		transition-duration: 0.05s;
	}

	.pictograph-wrapper:focus-visible {
		outline: none;
	}

	.pictograph-wrapper:focus-visible .pictograph {
		outline: 3px solid #4299e1;
		outline-offset: 2px;
	}
</style>