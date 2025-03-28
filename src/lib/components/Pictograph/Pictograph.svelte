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
	import { applyFallbackPosition } from './utils/positionUtils';
	import { 
		DEFAULT_COMPONENT_LOADING, 
		DEFAULT_COMPONENT_POSITIONING,
		MAX_RETRIES,
		DEFAULT_SAFETY_TIMEOUT,
		type RenderStage
	} from './constants/trackingConstants';
	import { 
		checkAllComponentsLoaded,
		checkAllComponentsPositioned,
		determineNextStage,
		handleComponentError
	} from './utils/componentStatusUtils';

	export let pictographDataStore: Writable<PictographData>;
	export const onClick: () => void = () => {};
	export let debug: boolean = false; // Enable debug mode

	// Track rendering stages with more detail
	let stage: RenderStage = 'initializing';
	let componentLoading = { ...DEFAULT_COMPONENT_LOADING };
	let componentPositioning = { ...DEFAULT_COMPONENT_POSITIONING };

	let gridData: GridData | null = null;
	let pictographManagers: PictographManagers | null = null;
	let initializer: PictographInitializer | null = null;
	let elements: Writable<ReturnType<typeof createPictographElements>> | null = null;

	let redProp: PropData | null = null;
	let blueProp: PropData | null = null;
	let redArrow: ArrowData | null = null;
	let blueArrow: ArrowData | null = null;
	let gridDataLoaded = false;
	let initializationComplete = false;
	let retryCount = 0;

	// Create event dispatcher for loaded event
	const dispatch = createEventDispatcher();

	// Prevent infinite loading with a safety timeout
	let safetyTimer: number;

	// Handle grid data loading - CRITICAL for prop positioning
	function handleGridDataReady(data: GridData) {
		try {
			// Store grid data globally for access
			gridData = data;

			// Log a few grid points for debugging
			if (debug) {
				const samplePoints = Object.entries(data.allHandPointsNormal).slice(0, 3);
			}

			// Store grid data in pictograph data for placement managers
			pictographDataStore.update((existingData) => ({
				...existingData,
				gridData: data
			}));

			gridDataLoaded = true;
			componentLoading.grid = true;
			stage = 'grid_ready';

			// Initialize managers and elements after grid is loaded
			initializeAll();
		} catch (error) {
			componentLoading.grid = true; // Mark as loaded anyway
			checkComponentStatus();
		}
	}

	// Initialize everything in the correct order
	async function initializeAll() {
		if (initializationComplete) return;

		try {
			// Initialize elements first
			initializer = new PictographInitializer(pictographDataStore);
			elements = initializer.elements;

			// Wait for initializer to complete
			await initializer.initialize();

			// Now that we have elements, create and initialize the managers
			pictographManagers = new PictographManagers(pictographDataStore);

			// Extract the stored components
			const pictographElements = get(elements);

			redProp = get(pictographElements.redPropData);
			blueProp = get(pictographElements.bluePropData);
			redArrow = get(pictographElements.redArrowData);
			blueArrow = get(pictographElements.blueArrowData);

			// Wait for managers to be ready
			await pictographManagers.ready;

			initializationComplete = true;

			// Check if we can proceed to positioning (grid data and elements must be loaded)
			if (gridDataLoaded && redProp && blueProp) {
				if (pictographManagers && pictographManagers.propPlacementManager) {
					stage = 'components_ready';
					updatePlacements();
				}
			}
		} catch (error) {
			// Retry initialization a few times before giving up
			if (retryCount < MAX_RETRIES) {
				retryCount++;
				setTimeout(initializeAll, 500); // Wait before retrying
			} else {
				// Even on error, show something
				stage = 'complete';
				dispatch('loaded', { error: true });
				dispatch('error', { message: (error as any)?.message || 'Unknown error' });
				clearTimeout(safetyTimer);
			}
		}
	}

	// Check component status and update stage accordingly
	function checkComponentStatus() {
		const allLoaded = checkAllComponentsLoaded(componentLoading);
		const allPositioned = checkAllComponentsPositioned(componentPositioning);
		
		const nextStage = determineNextStage(stage, allLoaded, allPositioned);
		
		if (nextStage !== stage) {
			stage = nextStage;
			
			if (stage === 'components_ready') {
				updatePlacements();
			} else if (stage === 'complete') {
				dispatch('loaded');
			}
		}
	}

	// CRITICAL: This updates the positions of props and arrows
	async function updatePlacements() {
		if (!pictographManagers) {
			return;
		}

		// Set stage to positioning
		stage = 'positioning';

		if (pictographManagers.propPlacementManager && pictographManagers.arrowPlacementManager) {
			try {
				// Make sure we have grid data
				const pictograph = get(pictographDataStore);
				if (!pictograph.gridData) {
					pictograph.gridData = gridData;
					if (!pictograph.gridData) return;
				}

				// Position the props
				if (redProp && blueProp) {
					// First apply default positioning
					pictographManagers.propPlacementManager.defaultPositioner.updateCoords(redProp);
					pictographManagers.propPlacementManager.defaultPositioner.updateCoords(blueProp);

					// Then apply beta positioning if needed
					if (pictographManagers.checker.endsWithBeta()) {
						pictographManagers.propPlacementManager.betaPositioner.reposition([redProp, blueProp]);
					}

					// Create completely new prop objects to trigger Svelte reactivity
					redProp = JSON.parse(JSON.stringify(redProp));
					blueProp = JSON.parse(JSON.stringify(blueProp));

					// Log final positions
					console.log('FINAL POSITIONS:');
					if (redProp) {
						console.log(`Red: (${redProp.coords.x}, ${redProp.coords.y})`);
					} else {
						console.log('Red prop is null');
					}
					console.log(`Blue: (${blueProp?.coords?.x ?? 'N/A'}, ${blueProp?.coords?.y ?? 'N/A'})`);

					componentPositioning.redProp = true;
					componentPositioning.blueProp = true;
				}

				// Wait for Svelte to update the DOM
				await tick();
				// Position the arrows
				if (redArrow && blueArrow) {
					pictographManagers.arrowPlacementManager.updateArrowPlacements([redArrow, blueArrow]);
					componentPositioning.redArrow = true;
					componentPositioning.blueArrow = true;
				}

				// Apply fallback positions if needed
				if (redProp && redProp.coords.x === 0 && redProp.coords.y === 0) {
					applyFallbackPosition(redProp, 'red');
				}

				if (blueProp && blueProp.coords.x === 0 && blueProp.coords.y === 0) {
					applyFallbackPosition(blueProp, 'blue');
				}

				// Debug prop positioning

				// Wait for the DOM to update
				await tick();
				checkComponentStatus();
			} catch (error) {
				// Apply fallbacks even on error
				if (redProp) applyFallbackPosition(redProp, 'red');
				if (blueProp) applyFallbackPosition(blueProp, 'blue');
				checkComponentStatus();
			}
		} else {
			// Apply fallbacks if managers are not ready
			if (redProp) applyFallbackPosition(redProp, 'red');
			if (blueProp) applyFallbackPosition(blueProp, 'blue');
			checkComponentStatus();
		}
	}
	
	function handlePictographComponentError(component: string, error?: any) {
		componentLoading = handleComponentError(component, componentLoading);
		checkComponentStatus();
	}

	onMount(() => {
		// Set a safety timeout
		safetyTimer = setTimeout(() => {
			if (stage !== 'complete') {
				// Even with timeout, try to render what we have
				if (stage === 'loading' || stage === 'grid_ready' || stage === 'components_ready') {
					stage = 'positioning';
					updatePlacements();
					tick().then(() => {
						stage = 'complete';
						dispatch('loaded', { timedOut: true });
					});
				} else {
					stage = 'complete';
					dispatch('loaded', { timedOut: true });
				}
			}
		}, DEFAULT_SAFETY_TIMEOUT);

		// Start initialization process
		if (!initializationComplete) {
			stage = 'loading';

			// If grid data is already loaded somehow, we can proceed to initialization
			if (gridDataLoaded && !initializationComplete) {
				initializeAll();
			}
		}

		return () => {
			clearTimeout(safetyTimer);
		};
	});

	function handlePropLoaded(color: 'red' | 'blue') {
		componentLoading[`${color}Prop`] = true;
		checkComponentStatus();
	}

	function handleArrowLoaded(color: 'red' | 'blue') {
		componentLoading[`${color}Arrow`] = true;
		checkComponentStatus();
	}
</script>

<div class="pictograph-wrapper">
	<svg class="pictograph" viewBox="0 0 950 950" xmlns="http://www.w3.org/2000/svg" role="img">
		{#if stage === 'initializing' || stage === 'loading'}
			<!-- Initial loading indicator -->
			<text x="475" y="475" text-anchor="middle" font-size="24">Loading...</text>
		{:else}
			<!-- Render all components -->
			<Grid
				gridMode={get(pictographDataStore)?.gridMode || 'diamond'}
				onPointsReady={handleGridDataReady}
				on:error={() => handlePictographComponentError('grid')}
			/>

			{#if get(pictographDataStore).letter}
				<TKAGlyph letter={get(pictographDataStore).letter} turnsTuple="(s, 0, 0)" x={50} y={800} />
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

			<!-- Debug markers for props -->
			{#if debug}
				{#if redProp}
					<circle cx={redProp.coords.x} cy={redProp.coords.y} r="8" fill="red" opacity="0.5" />
					<text
						x={redProp.coords.x}
						y={redProp.coords.y - 10}
						text-anchor="middle"
						fill="red"
						font-size="12"
						stroke="white"
						stroke-width="0.5"
					>
						({Math.round(redProp.coords.x)}, {Math.round(redProp.coords.y)})
					</text>
				{/if}

				{#if blueProp}
					<circle cx={blueProp.coords.x} cy={blueProp.coords.y} r="8" fill="blue" opacity="0.5" />
					<text
						x={blueProp.coords.x}
						y={blueProp.coords.y - 10}
						text-anchor="middle"
						fill="blue"
						font-size="12"
						stroke="white"
						stroke-width="0.5"
					>
						({Math.round(blueProp.coords.x)}, {Math.round(blueProp.coords.y)})
					</text>
				{/if}

				<!-- Additional debug info -->
				<text x="10" y="20" font-size="12" fill="white" stroke="black" stroke-width="0.5">
					Stage: {stage}
				</text>

				<text x="10" y="40" font-size="12" fill="white" stroke="black" stroke-width="0.5">
					Beta active: {pictographManagers?.checker?.endsWithBeta() ? 'Yes' : 'No'}
				</text>
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