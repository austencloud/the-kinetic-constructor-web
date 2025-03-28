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

	// Props and exports
	export let pictographDataStore: Writable<PictographData>;
	export const onClick: () => void = () => {};
	export let debug: boolean = false; // Enable debug mode

	// Event dispatcher
	const dispatch = createEventDispatcher();

	// Rendering state
	let stage: RenderStage = 'initializing';
	let componentLoading = { ...DEFAULT_COMPONENT_LOADING };
	let componentPositioning = { ...DEFAULT_COMPONENT_POSITIONING };
	let retryCount = 0;
	let safetyTimer: number;

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

	// ---------------------------------
	// Lifecycle and Initialization
	// ---------------------------------

	onMount(() => {
		// Set a safety timeout to ensure we always render something
		safetyTimer = setTimeout(handleSafetyTimeout, DEFAULT_SAFETY_TIMEOUT);

		// Start initialization process
		if (!initializationComplete) {
			stage = 'loading';

			// If grid data is already loaded, proceed to initialization
			if (gridDataLoaded && !initializationComplete) {
				initializeAll();
			}
		}

		return () => {
			clearTimeout(safetyTimer);
		};
	});
	/**
	 * Initialize all components with immediate completion for incomplete data
	 */
	async function initializeAll() {
		if (initializationComplete) return;

		try {
			// Step 1: Initialize elements with clear progress tracking
			stage = 'initializing';
			initializer = new PictographInitializer(pictographDataStore);
			elements = initializer.elements;

			// Wait for initializer to complete
			await initializer.initialize();

			// CRITICAL CHANGE: Check if we're dealing with incomplete data
			// If the initializer found incomplete data, it should have set
			// its 'initialized' flag but not created any components
			if (initializer.hasIncompleteData) {
				console.log('Detected incomplete data, transitioning to complete stage');
				// Skip further initialization
				initializationComplete = true;
				stage = 'complete';
				dispatch('loaded', { incompleteData: true });
				return;
			}

			// Step 2: Initialize managers (only if we have complete data)
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

			// Check if we can proceed to positioning
			if (gridDataLoaded && redProp && blueProp) {
				if (pictographManagers?.propPlacementManager) {
					stage = 'components_ready';
					updatePlacements();
				}
			}
		} catch (error) {
			handleInitializationError(error);
		}
	}

	function handleInitializationError(error: any) {
		console.error('Initialization error:', error);

		// Retry initialization a few times before giving up
		if (retryCount < MAX_RETRIES) {
			retryCount++;
			console.log(`Retrying initialization (attempt ${retryCount} of ${MAX_RETRIES})...`);
			setTimeout(initializeAll, 500);
		} else {
			// If we've exhausted retries, try to show something anyway
			console.error('Maximum retries reached, attempting to show fallback view');
			stage = 'complete';
			dispatch('loaded', { error: true });
			dispatch('error', { message: (error as any)?.message || 'Unknown error' });
			clearTimeout(safetyTimer);
		}
	}

	/**
	 * Handle safety timeout to ensure we always render something
	 * Enhanced to handle more edge cases and provide better state recovery
	 */
	function handleSafetyTimeout() {
		if (stage !== 'complete') {
			console.warn('Safety timeout triggered, forcing rendering completion');

			// Force initialization completion if necessary
			if (initializer && !initializer.ready) {
				console.log('Forcing initializer completion');
				try {
					// @ts-ignore - Accessing private method for emergency timeout
					initializer.resolveReady();
				} catch (e) {
					console.error('Could not force initializer completion:', e);
				}
			}

			// Mark all components as loaded to unblock rendering
			Object.keys(componentLoading).forEach((key) => {
				componentLoading[key as keyof typeof componentLoading] = true;
			});

			// Mark all positioning as complete to unblock rendering
			Object.keys(componentPositioning).forEach((key) => {
				if (key in componentPositioning) {
					componentPositioning[key as keyof typeof componentPositioning] = true;
				}
			});

			// Apply fallback positions to any available props
			applyFallbackPositions();

			// Force transition to complete stage
			stage = 'complete';

			// Notify that loading completed (with timeout)
			dispatch('loaded', { timedOut: true });
		}
	}

	// ---------------------------------
	// Grid Handling
	// ---------------------------------

	function handleGridDataReady(data: GridData) {
		try {
			// Store grid data
			gridData = data;

			// Debug logging
			if (debug) {
				const samplePoints = Object.entries(data.allHandPointsNormal).slice(0, 3);
				console.log('Sample grid points:', samplePoints);
			}

			// Update pictograph data with grid
			pictographDataStore.update((existingData) => ({
				...existingData,
				gridData: data
			}));

			gridDataLoaded = true;
			componentLoading.grid = true;
			stage = 'grid_ready';

			// Initialize components now that grid is ready
			initializeAll();
		} catch (error) {
			console.error('Error handling grid data:', error);
			componentLoading.grid = true; // Mark as loaded anyway
			checkComponentStatus();
		}
	}

	// ---------------------------------
	// Component Status Management
	// ---------------------------------

	function checkComponentStatus() {
		const allLoaded = checkAllComponentsLoaded(componentLoading);
		const allPositioned = checkAllComponentsPositioned(componentPositioning);

		const nextStage = determineNextStage(stage, allLoaded, allPositioned);

		if (nextStage !== stage) {
			if (debug) {
				console.log(`Pictograph stage transition: ${stage} -> ${nextStage}`);
			}

			stage = nextStage;

			if (stage === 'components_ready') {
				updatePlacements();
			} else if (stage === 'complete') {
				dispatch('loaded');
			}
		}
	}

	function handlePictographComponentError(component: string, error?: any) {
		if (debug) {
			console.error(`Error in ${component}:`, error);
		}

		componentLoading = handleComponentError(component, componentLoading);
		checkComponentStatus();
	}

	// ---------------------------------
	// Component Loading Events
	// ---------------------------------

	function handlePropLoaded(color: 'red' | 'blue') {
		componentLoading[`${color}Prop`] = true;
		if (debug) {
			console.log(`${color} prop loaded`);
		}
		checkComponentStatus();
	}

	function handleArrowLoaded(color: 'red' | 'blue') {
		componentLoading[`${color}Arrow`] = true;
		if (debug) {
			console.log(`${color} arrow loaded`);
		}
		checkComponentStatus();
	}

	// ---------------------------------
	// Positioning
	// ---------------------------------
	/**
	 * Update placements for props and arrows
	 * Enhanced with defensive programming to safely handle incomplete data
	 */
	async function updatePlacements() {
		try {
			// Check for complete data first - exit early if incomplete
			if (!isDataComplete()) {
				console.log('Pictograph has incomplete data, applying fallback positions only');
				applyFallbackPositions();
				// Still transition to complete to avoid loading state
				stage = 'complete';
				dispatch('loaded');
				return;
			}

			// Check for manager availability
			if (!pictographManagers) {
				console.warn('Cannot update placements: managers not initialized');
				applyFallbackPositions();
				stage = 'complete';
				dispatch('loaded');
				return;
			}

			// Set stage to positioning
			stage = 'positioning';

			// Position props (with error handling)
			let propsPositioned = false;
			try {
				if (pictographManagers.propPlacementManager && redProp && blueProp) {
					await positionProps();
					propsPositioned = true;
				}
			} catch (propError) {
				console.error('Error positioning props:', propError);
			}

			// If props weren't positioned, use fallbacks
			if (!propsPositioned) {
				applyFallbackPositions();
			}

			// Wait for Svelte to update the DOM
			await tick();

			// Position arrows (with independent error handling)
			try {
				if (pictographManagers.arrowPlacementManager && redArrow && blueArrow) {
					positionArrows();
				} else {
					// Mark arrows as positioned if we can't position them
					componentPositioning.redArrow = true;
					componentPositioning.blueArrow = true;
				}
			} catch (arrowError) {
				console.error('Error positioning arrows:', arrowError);
				// Mark arrows as positioned even on error
				componentPositioning.redArrow = true;
				componentPositioning.blueArrow = true;
			}

			// Always transition to complete state
			stage = 'complete';
			dispatch('loaded');
		} catch (error) {
			// Catch-all error handler
			console.error('Fatal error in updatePlacements:', error);
			applyFallbackPositions();
			stage = 'complete';
			dispatch('loaded', { error: true });
		}
	}

	async function positionProps() {
		if (!pictographManagers?.propPlacementManager || !redProp || !blueProp) {
			return;
		}

		try {
			// First apply default positioning
			pictographManagers.propPlacementManager.defaultPositioner.updateCoords(redProp);
			pictographManagers.propPlacementManager.defaultPositioner.updateCoords(blueProp);

			// Then apply beta positioning if needed
			if (pictographManagers.checker.endsWithBeta()) {
				pictographManagers.propPlacementManager.betaPositioner.reposition([redProp, blueProp]);
			}

			// Create new prop objects to trigger Svelte reactivity
			redProp = JSON.parse(JSON.stringify(redProp));
			blueProp = JSON.parse(JSON.stringify(blueProp));

			componentPositioning.redProp = true;
			componentPositioning.blueProp = true;
		} catch (error) {
			console.error('Error positioning props:', error);
			throw error;
		}
	}
	/**
	 * Position arrows using the arrow placement manager
	 * Modified to handle incomplete data safely
	 */
	/**
	 * Position arrows using the arrow placement manager
	 * Enhanced with comprehensive validation to prevent the 'Cannot read properties of undefined' error
	 */
	function positionArrows() {
		// Early exit if we don't have the required manager
		if (!pictographManagers?.arrowPlacementManager) {
			componentPositioning.redArrow = true;
			componentPositioning.blueArrow = true;
			return;
		}

		// Early exit if arrow data is missing
		if (!redArrow || !blueArrow) {
			componentPositioning.redArrow = true;
			componentPositioning.blueArrow = true;
			return;
		}

		// Create safe copies of arrows to work with
		const safeRedArrow = { ...redArrow };
		const safeBlueArrow = { ...blueArrow };

		// Comprehensive validation of arrow properties
		const isRedArrowValid =
			safeRedArrow &&
			safeRedArrow.motionType &&
			safeRedArrow.startOri &&
			safeRedArrow.turns &&
			safeRedArrow.propRotDir;

		const isBlueArrowValid =
			safeBlueArrow &&
			safeBlueArrow.motionType &&
			safeBlueArrow.startOri &&
			safeBlueArrow.turns &&
			safeBlueArrow.propRotDir;

		// Skip positioning if either arrow is invalid
		if (!isRedArrowValid || !isBlueArrowValid) {
			console.warn('Incomplete arrow data, skipping arrow positioning');
			console.log('Red arrow valid:', isRedArrowValid, 'Blue arrow valid:', isBlueArrowValid);

			// Mark as positioned to allow rendering to continue
			componentPositioning.redArrow = true;
			componentPositioning.blueArrow = true;
			return;
		}

		try {
			// Only attempt positioning if both arrows are fully valid
			pictographManagers.arrowPlacementManager.updateArrowPlacements([safeRedArrow, safeBlueArrow]);
			componentPositioning.redArrow = true;
			componentPositioning.blueArrow = true;
		} catch (error) {
			console.error('Error positioning arrows:', error);
			// Mark arrows as positioned even on error to allow rendering to complete
			componentPositioning.redArrow = true;
			componentPositioning.blueArrow = true;
		}
	}

	function applyFallbackPositions() {
		if (redProp) {
			if (redProp.coords.x === 0 && redProp.coords.y === 0) {
				applyFallbackPosition(redProp, 'red');
			}
			componentPositioning.redProp = true;
		}

		if (blueProp) {
			if (blueProp.coords.x === 0 && blueProp.coords.y === 0) {
				applyFallbackPosition(blueProp, 'blue');
			}
			componentPositioning.blueProp = true;
		}

		// For arrows, we just mark them as positioned since fallbacks are less critical
		componentPositioning.redArrow = true;
		componentPositioning.blueArrow = true;
	}

	/**
	 * Check if the pictograph data is complete enough to render all components
	 * Enhanced to handle more edge cases and provide better logging
	 * @returns boolean indicating if all required data is present
	 */
	function isDataComplete(): boolean {
		const pictograph = get(pictographDataStore);

		// Check for required motion data
		if (!pictograph.redMotionData || !pictograph.blueMotionData) {
			if (debug) console.log('Incomplete pictograph: Missing motion data');
			return false;
		}

		// Deeper check for motion data completeness
		if (
			!pictograph.redMotionData.motionType ||
			!pictograph.redMotionData.startOri ||
			!pictograph.blueMotionData.motionType ||
			!pictograph.blueMotionData.startOri
		) {
			if (debug) console.log('Incomplete pictograph: Missing required motion properties');
			return false;
		}

		// Check if all required props and arrows are available
		if (!redProp || !blueProp || !redArrow || !blueArrow) {
			// Only return false if we're not in the middle of loading
			// This prevents flickering during normal loading
			if (stage === 'complete' || initializationComplete) {
				if (debug) console.log('Incomplete pictograph: Missing required visual components');
				return false;
			}
		}

		return true;
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

			<!-- Debug visualization -->
			{#if debug}
				<!-- Prop position markers -->
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

				<!-- Render status information -->
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
