<script lang="ts">
	import { onMount, createEventDispatcher, tick } from 'svelte';
	import { get, writable, type Writable } from 'svelte/store';
	import type { PictographData } from '$lib/types/PictographData.js';
	import { PictographInitializer } from './PictographInitializer';
	import type { PropData } from '../objects/Prop/PropData';
	import type { ArrowData } from '../objects/Arrow/ArrowData';
	import Prop from '../objects/Prop/Prop.svelte';
	import Arrow from '../objects/Arrow/Arrow.svelte';
	import Grid from '../objects/Grid/Grid.svelte';
	import TKAGlyph from './../objects/Glyphs/TKAGlyph/TKAGlyph.svelte';
	import { PictographManagers } from './PictographManagers';
	import { createPictographElements } from './PictographElements';
	import type { GridData } from '../objects/Grid/GridData';
	import { type RenderStage } from './constants/trackingConstants';
	
	// Import our services
	import { PictographLifecycleService } from './services/PictographLifecycleService';
	import { PictographValidationService } from './services/PictographValidationService';
	import { PictographPositioningService } from './services/PictographPositioningService';
	import { PictographComponentStatusService } from './services/PictographComponentStatusService';
	import PictographDebugView from './PictographDebugView.svelte';

	// Props and exports
	export let pictographDataStore: Writable<PictographData>;
	export const onClick: () => void = () => {};
	export let debug: boolean = false; // Enable debug mode

	// Event dispatcher
	const dispatch = createEventDispatcher();

	// Rendering state
	let stage: RenderStage = 'initializing';
	
	// Component state
	let gridData: GridData | null = null;
	let gridDataLoaded = false;
	let initializationComplete = false;

	// Core objects
	let pictographManagers: PictographManagers | null = null;
	let initializer: PictographInitializer | null = null;
	let elements: Writable<ReturnType<typeof createPictographElements>> | null = null;

	// Visual elements
	let redProp: PropData | null = null;
	let blueProp: PropData | null = null;
	let redArrow: ArrowData | null = null;
	let blueArrow: ArrowData | null = null;

	// Initialize services
	const lifecycleService = new PictographLifecycleService(
		pictographDataStore,
		(newStage) => (stage = newStage),
		(eventData) => dispatch('loaded', eventData),
		(eventData) => dispatch('error', eventData)
	);

	const validationService = new PictographValidationService(pictographDataStore, debug);

	const positioningService = new PictographPositioningService(debug);
	
	const componentStatusService = new PictographComponentStatusService(
		stage,
		(newStage) => (stage = newStage),
		() => updatePlacements(),
		() => dispatch('loaded'),
		debug
	);

	// ---------------------------------
	// Lifecycle and Initialization
	// ---------------------------------

	onMount(() => {
		// Start initialization with lifecycle service
		lifecycleService.startInitialization(stage, initializer, initializeAll);

		return () => {
			lifecycleService.cleanup();
		};
	});

	async function initializeAll() {
		if (initializationComplete) return;

		try {
			// Step 1: Initialize elements
			stage = 'initializing';
			initializer = new PictographInitializer(pictographDataStore);
			elements = initializer.elements;

			// Wait for initializer to complete
			await initializer.initialize();

			// Check if data is incomplete
			if (initializer.hasIncompleteData) {
				console.log('Detected incomplete data, transitioning to complete stage');
				initializationComplete = true;
				stage = 'complete';
				dispatch('loaded', { incompleteData: true });
				return;
			}

			// Step 2: Initialize managers and components
			await initializeManagersAndComponents();

			initializationComplete = true;

			// Proceed to positioning if we can
			if (gridDataLoaded && redProp && blueProp) {
				if (pictographManagers?.propPlacementManager) {
					stage = 'components_ready';
					updatePlacements();
				}
			}
		} catch (error) {
			lifecycleService.handleInitializationError(error, initializeAll);
		}
	}

	async function initializeManagersAndComponents() {
		// Initialize managers
		pictographManagers = new PictographManagers(pictographDataStore);

		// Extract components
		const pictographElements = elements ? get(elements) : null;
		redProp = pictographElements ? get(pictographElements.redPropData) : null;
		blueProp = pictographElements ? get(pictographElements.bluePropData) : null;
		redArrow = pictographElements ? get(pictographElements.redArrowData) : null;
		blueArrow = pictographElements ? get(pictographElements.blueArrowData) : null;

		// Wait for managers to be ready
		await pictographManagers.ready;
	}

	// ---------------------------------
	// Grid Handling
	// ---------------------------------

	function handleGridDataReady(data: GridData) {
		gridData = data;
		lifecycleService.handleGridDataReady(data, debug, initializeAll);
		gridDataLoaded = true;
		componentStatusService.updateComponentStatus('grid', 'loading');
	}

	// ---------------------------------
	// Component Loading Events
	// ---------------------------------

	function handlePropLoaded(color: 'red' | 'blue') {
		componentStatusService.updateComponentStatus(`${color}Prop`, 'loading');
	}

	function handleArrowLoaded(color: 'red' | 'blue') {
		componentStatusService.updateComponentStatus(`${color}Arrow`, 'loading');
	}

	function handlePictographComponentError(component: string, error?: any) {
		componentStatusService.handleComponentError(component, error);
	}

	// ---------------------------------
	// Positioning
	// ---------------------------------

	async function updatePlacements() {
		const componentPositioning = componentStatusService.getComponentPositioning();
		
		const result = await positioningService.updatePlacements(
			pictographManagers,
			redProp,
			blueProp,
			redArrow,
			blueArrow,
			componentPositioning,
			// Pass validation function
			(arrow) => validationService.validateArrowForPositioning(arrow),
			// Pass data completeness check function
			() => isDataComplete(),
			// Pass stage change callback
			(newStage) => (stage = newStage),
			// Pass loaded event callback
			(data) => dispatch('loaded', data)
		);

		// Update props with positioned versions
		if (result && result.redProp && result.blueProp) {
			redProp = result.redProp;
			blueProp = result.blueProp;
		}
	}

	// ---------------------------------
	// Data Validation
	// ---------------------------------

	function isDataComplete(): boolean {
		return validationService.isDataComplete(
			redProp,
			blueProp,
			redArrow,
			blueArrow,
			stage,
			initializationComplete
		);
	}
</script>

<div
	class="pictograph-wrapper"
	on:click={onClick}
	on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
	role="button"
	tabindex="0"
	aria-label="Pictograph container"
>
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
				onPointsReady={handleGridDataReady}
				on:error={() => handlePictographComponentError('grid')}
			/>

			<!-- Check if pictograph data is complete -->
			{#if isDataComplete()}
				<!-- Render all components -->
				{#if get(pictographDataStore).letter}
					<TKAGlyph
						letter={get(pictographDataStore).letter}
						turnsTuple="(s, 0, 0)"
						x={50}
						y={800}
					/>
				{/if}

				{#if redProp}
					<Prop
						propData={redProp}
						on:loaded={() => handlePropLoaded('red')}
						on:error={() => handlePictographComponentError('redProp')}
					/>
				{/if}

				{#if blueProp}
					<Prop
						propData={blueProp}
						on:loaded={() => handlePropLoaded('blue')}
						on:error={() => handlePictographComponentError('blueProp')}
					/>
				{/if}

				{#if redArrow}
					<Arrow
						arrowData={redArrow}
						on:loaded={() => handleArrowLoaded('red')}
						on:error={() => handlePictographComponentError('redArrow')}
					/>
				{/if}

				{#if blueArrow}
					<Arrow
						arrowData={blueArrow}
						on:loaded={() => handleArrowLoaded('blue')}
						on:error={() => handlePictographComponentError('blueArrow')}
					/>
				{/if}
			{/if}

			<!-- Debug visualization using the dedicated component -->
			{#if debug}
				<PictographDebugView {redProp} {blueProp} {stage} {pictographManagers} {isDataComplete} />
			{/if}
		{/if}
	</svg>
</div>

<style>
	.pictograph-wrapper {
		width: 100%;
		height: 100%;
		cursor: pointer;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pictograph {
		width: 100%;
		height: 100%;
		max-width: 100%;
		max-height: 100%;
		display: flex;
		flex: 1;
		background-color: white;
		transition: transform 0.1s;
		transform: scale(1);
		z-index: 1;
		position: relative;
		border: 1px solid black;
		aspect-ratio: 1;
		margin: auto;
		overflow: visible;
		transform-origin: center center;
	}

	.pictograph-wrapper:hover .pictograph {
		transform: scale(1.1);
		z-index: 4;
		border: 4px solid gold;
	}

	.pictograph-wrapper:active .pictograph {
		transform: scale(1);
	}

	.pictograph-wrapper:focus {
		outline: 3px solid #4299e1;
	}
</style>