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

	export let pictographDataStore: Writable<PictographData>;
	export const onClick: () => void = () => {};
	export let debug: boolean = false; // Enable debug mode

	// Track rendering stages with more detail
	let stage = 'initializing'; // initializing -> loading -> grid_ready -> components_ready -> positioning -> complete
	let componentLoading = {
		grid: false,
		redProp: false,
		blueProp: false,
		redArrow: false,
		blueArrow: false
	};
	let componentPositioning = {
		redProp: false,
		blueProp: false,
		redArrow: false,
		blueArrow: false
	};

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
	const MAX_RETRIES = 3;

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
			checkAllComponentsLoaded();
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

	// Check if all components are loaded and ready to display
	function checkAllComponentsLoaded() {
		const allLoaded = Object.values(componentLoading).every((loaded) => loaded);

		if (allLoaded) {
			if (stage === 'grid_ready') {
				stage = 'components_ready';
				updatePlacements();
			} else if (stage === 'positioning') {
				stage = 'complete';
				dispatch('loaded');
			}
		}
	}

	// Check if all components are positioned
	function checkAllComponentsPositioned() {
		const allPositioned = Object.values(componentPositioning).every((positioned) => positioned);

		if (allPositioned) {
			stage = 'complete';
			dispatch('loaded');
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

					// Get grid data from elements store or global var
					pictograph.gridData = gridData;

					if (!pictograph.gridData) {
						return;
					}
				}

				// Log the props before positioning

				// Position the props - use temporary coordinates first to ensure change
				if (redProp && blueProp) {
					// Force props to be at origin to ensure positioning takes effect
					redProp.coords = { x: 0, y: 0 };
					blueProp.coords = { x: 0, y: 0 };

					// Now position them
					pictographManagers.propPlacementManager.updatePropPlacement([redProp, blueProp]);
					componentPositioning.redProp = true;
					componentPositioning.blueProp = true;
				}

				// Position the arrows
				if (redArrow && blueArrow) {
					pictographManagers.arrowPlacementManager.updateArrowPlacements([redArrow, blueArrow]);
					componentPositioning.redArrow = true;
					componentPositioning.blueArrow = true;
				}

				// Log the props after positioning


				// Apply fallback positions if needed
				if (redProp && redProp.coords.x === 0 && redProp.coords.y === 0) {

					applyFallbackPosition(redProp, 'red');
				}

				if (blueProp && blueProp.coords.x === 0 && blueProp.coords.y === 0) {

					applyFallbackPosition(blueProp, 'blue');
				}

				checkAllComponentsPositioned();

				// Wait for next tick to ensure the DOM updates
				await tick();
			} catch (error) {
				// Apply fallbacks even on error
				if (redProp) applyFallbackPosition(redProp, 'red');
				if (blueProp) applyFallbackPosition(blueProp, 'blue');
				checkAllComponentsPositioned();
			}
		} else {
			// Apply fallbacks if managers are not ready
			if (redProp) applyFallbackPosition(redProp, 'red');
			if (blueProp) applyFallbackPosition(blueProp, 'blue');
			checkAllComponentsPositioned();
		}
	}

	// Apply fallback positions directly to props
	function applyFallbackPosition(prop: PropData, color: string) {
		// Apply strong fallback positions based on prop location
		const fallbacks: Record<string, { x: number; y: number }> = {
			n: { x: 475, y: 330 },
			e: { x: 620, y: 475 },
			s: { x: 475, y: 620 },
			w: { x: 330, y: 475 },
			ne: { x: 620, y: 330 },
			se: { x: 620, y: 620 },
			sw: { x: 330, y: 620 },
			nw: { x: 330, y: 330 }
		};

		// Apply more spread out positions for red vs blue
		const offset = color === 'red' ? 30 : -30;

		if (prop.loc && fallbacks[prop.loc]) {
			prop.coords = {
				x: fallbacks[prop.loc].x + offset,
				y: fallbacks[prop.loc].y
			};

		} else {
			// Last resort center position with offset
			prop.coords = {
				x: 475 + offset,
				y: 475
			};

		}
	}

	onMount(() => {

		// Set a safety timeout (5 seconds maximum)
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
		}, 10);

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
		checkAllComponentsLoaded();
	}

	function handleArrowLoaded(color: 'red' | 'blue') {
		componentLoading[`${color}Arrow`] = true;
		checkAllComponentsLoaded();
	}

	// If any component errors, still mark it as loaded to not block rendering
	function handleComponentError(component: string, error?: any) {

		// Mark the component as loaded despite the error
		if (component.includes('prop')) {
			const color = component.includes('red') ? 'red' : 'blue';
			componentLoading[`${color}Prop`] = true;
		} else if (component.includes('arrow')) {
			const color = component.includes('red') ? 'red' : 'blue';
			componentLoading[`${color}Arrow`] = true;
		} else if (component.includes('grid')) {
			componentLoading.grid = true;
		}

		checkAllComponentsLoaded();
	}

	// Show debug information
	function getDebugInfo() {
		return {
			stage,
			componentLoading,
			componentPositioning,
			redProp: redProp
				? {
						loc: redProp.loc,
						coords: redProp.coords,
						id: redProp.id
					}
				: null,
			blueProp: blueProp
				? {
						loc: blueProp.loc,
						coords: blueProp.coords,
						id: blueProp.id
					}
				: null,
			gridData: gridData ? 'loaded' : 'not loaded',
			managers: pictographManagers ? 'initialized' : 'not initialized'
		};
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
				on:error={() => handleComponentError('grid')}
			/>

			{#if get(pictographDataStore).letter}
				<TKAGlyph letter={get(pictographDataStore).letter} turnsTuple="(s, 0, 0)" x={50} y={800} />
			{/if}

			{#if redProp}
				<Prop
					propData={redProp}
					on:loaded={() => handlePropLoaded('red')}
					on:error={() => handleComponentError('redProp')}
				/>

				<!-- Debug marker for red prop position -->
				{#if debug}
					<circle cx={redProp.coords.x} cy={redProp.coords.y} r="8" fill="red" opacity="0.5" />
				{/if}
			{/if}

			{#if blueProp}
				<Prop
					propData={blueProp}
					on:loaded={() => handlePropLoaded('blue')}
					on:error={() => handleComponentError('blueProp')}
				/>

				<!-- Debug marker for blue prop position -->
				{#if debug}
					<circle cx={blueProp.coords.x} cy={blueProp.coords.y} r="8" fill="blue" opacity="0.5" />
				{/if}
			{/if}

			{#if redArrow}
				<Arrow
					arrowData={redArrow}
					on:loaded={() => handleArrowLoaded('red')}
					on:error={() => handleComponentError('redArrow')}
				/>
			{/if}

			{#if blueArrow}
				<Arrow
					arrowData={blueArrow}
					on:loaded={() => handleArrowLoaded('blue')}
					on:error={() => handleComponentError('blueArrow')}
				/>
			{/if}

			<!-- Debug grid point overlay -->
			{#if debug && gridData}
				{#each Object.entries(gridData.allHandPointsNormal || {}) as [key, point]}
					{#if point && point.coordinates}
						<circle
							cx={point.coordinates.x}
							cy={point.coordinates.y}
							r="3"
							fill="rgba(0,255,0,0.5)"
							stroke="white"
							stroke-width="0.5"
						/>
					{/if}
				{/each}

				{#if gridData.centerPoint && gridData.centerPoint.coordinates}
					<circle
						cx={gridData.centerPoint.coordinates.x}
						cy={gridData.centerPoint.coordinates.y}
						r="5"
						fill="pink"
						stroke="black"
						stroke-width="1"
					/>
				{/if}
			{/if}
		{/if}

		<!-- Status indicator -->
		{#if debug}
			<text x="10" y="20" font-size="12" fill="white" stroke="black" stroke-width="0.5">
				Stage: {stage}
			</text>
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
