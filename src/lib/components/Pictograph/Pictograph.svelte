<script lang="ts">
	// This is a minimal version focusing on the loading and positioning sequence
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

	let pictographManagers = new PictographManagers(pictographDataStore);
	let initializer = new PictographInitializer(pictographDataStore);
	let elements = initializer.elements;

	let redProp: PropData | null = null;
	let blueProp: PropData | null = null;
	let redArrow: ArrowData | null = null;
	let blueArrow: ArrowData | null = null;
	let gridDataLoaded = false;

	// Create event dispatcher for loaded event
	const dispatch = createEventDispatcher();

	// Prevent infinite loading with a safety timeout
	let safetyTimer: number;

	// For debugging
	function logDebug(message: string) {
		console.log(`[Pictograph] ${message}`);
	}

	// Handle grid data loading - CRITICAL for prop positioning
	function handleGridDataReady(data: any) {
		try {
			logDebug(
				`📊 Grid data loaded with ${Object.keys(data.allHandPointsNormal).length} hand points`
			);

			// Store grid data in store
			elements.update((els) => {
				els.gridData.set(data);
				return els;
			});

			// Store grid data in pictograph data for placement managers
			pictographDataStore.update((data) => ({
				...data,
				gridData: data as unknown as GridData
			}));

			gridDataLoaded = true;
			componentLoading.grid = true;
			stage = 'grid_ready';

			// After grid is ready, initialize placement managers
			initPlacementManagers();

			checkAllComponentsLoaded();
		} catch (error) {
			logDebug(`❌ Error handling grid data: ${error}`);
			componentLoading.grid = true; // Mark as loaded anyway
			checkAllComponentsLoaded();
		}
	}

	// Initialize placement managers after grid is loaded
	async function initPlacementManagers() {
		try {
			logDebug('🔄 Initializing placement managers...');

			// Wait for placement managers to be ready
			await pictographManagers.ready;

			// Only proceed to positioning after grid is loaded AND components are ready
			if (gridDataLoaded && redProp && blueProp && redArrow && blueArrow) {
				updatePlacements();
			} else {
				logDebug('⏳ Waiting for components before positioning...');
			}
		} catch (error) {
			logDebug(`❌ Error initializing placement managers: ${error}`);
		}
	}

	// Check if all components are loaded and ready to display
	function checkAllComponentsLoaded() {
		const allLoaded = Object.values(componentLoading).every((loaded) => loaded);

		if (allLoaded) {
			if (stage === 'grid_ready') {
				logDebug('✅ Grid and components loaded, proceeding to positioning');
				stage = 'components_ready';
				updatePlacements();
			} else if (stage === 'positioning') {
				logDebug('✅ All components loaded and positioned');
				stage = 'complete';
				dispatch('loaded');
			}
		}
	}

	// Check if all components are positioned
	function checkAllComponentsPositioned() {
		const allPositioned = Object.values(componentPositioning).every((positioned) => positioned);

		if (allPositioned) {
			logDebug('✅ All components positioned successfully');
			stage = 'complete';
			dispatch('loaded');
		}
	}

	// CRITICAL: This updates the positions of props and arrows
	async function updatePlacements() {
		logDebug(`🔄 Updating placements (stage: ${stage})`);

		if (!pictographManagers) {
			logDebug('❌ Pictograph managers not available');
			return;
		}

		// Set stage to positioning
		stage = 'positioning';

		if (pictographManagers.propPlacementManager && pictographManagers.arrowPlacementManager) {
			try {
				// Make sure we have grid data
				const pictograph = get(pictographDataStore);
				if (!pictograph.gridData) {
					logDebug('⚠️ No grid data in pictograph data store');

					// Get grid data from elements store
					pictograph.gridData = get(get(elements).gridData);

					if (!pictograph.gridData) {
						logDebug('❌ Cannot position - no grid data available');
						return;
					}
				}

				// Log the props before positioning
				logDebug(`📊 Red prop before: ${JSON.stringify(redProp?.coords)}`);
				logDebug(`📊 Blue prop before: ${JSON.stringify(blueProp?.coords)}`);

				// Position the props
				if (redProp && blueProp) {
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
				logDebug(`📊 Red prop after: ${JSON.stringify(redProp?.coords)}`);
				logDebug(`📊 Blue prop after: ${JSON.stringify(blueProp?.coords)}`);

				logDebug('✅ Props & Arrows repositioned');

				// Validate positioning
				if (redProp && redProp.coords.x === 0 && redProp.coords.y === 0) {
					logDebug('⚠️ Red prop position still at origin (0,0) after positioning');
				}
				if (blueProp && blueProp.coords.x === 0 && blueProp.coords.y === 0) {
					logDebug('⚠️ Blue prop position still at origin (0,0) after positioning');
				}

				checkAllComponentsPositioned();

				// Wait for next tick to ensure the DOM updates
				await tick();
			} catch (error) {
				logDebug(`❌ Error updating placements: ${error}`);
			}
		} else {
			logDebug('⚠️ Placement managers not available');
		}
	}

	onMount(() => {
		logDebug('Component mounted');

		// Set a safety timeout (5 seconds maximum)
		safetyTimer = setTimeout(() => {
			logDebug('⚠️ Safety timeout triggered for pictograph');
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
		}, 100);

		(async () => {
			try {
				// First stage: initialize the pictograph data
				await initializer.initialize();
				logDebug('🟢 Pictograph Initialization Complete');

				// Get the stored components
				redProp = get(get(elements).redPropData);
				blueProp = get(get(elements).bluePropData);
				redArrow = get(get(elements).redArrowData);
				blueArrow = get(get(elements).blueArrowData);

				// Log component properties for debugging
				if (redProp) logDebug(`📊 Red prop details: loc=${redProp.loc}, ori=${redProp.ori}`);
				if (blueProp) logDebug(`📊 Blue prop details: loc=${blueProp.loc}, ori=${blueProp.ori}`);

				// Update to loading stage - now we'll wait for individual components to load
				stage = 'loading';

				// If grid data is already loaded, we can proceed to positioning
				if (gridDataLoaded && pictographManagers.propPlacementManager) {
					updatePlacements();
				}
			} catch (error) {
				logDebug(`❌ Failed to initialize pictograph: ${error}`);
				// Even on error, show something
				stage = 'complete';
				dispatch('loaded', { error: true });
				dispatch('error', { message: (error as any)?.message || 'Unknown error' });
				clearTimeout(safetyTimer);
			}
		})();

		return () => {
			clearTimeout(safetyTimer);
		};
	});

	function handlePropLoaded(color: 'red' | 'blue') {
		logDebug(`✅ ${color} prop loaded`);
		componentLoading[`${color}Prop`] = true;
		checkAllComponentsLoaded();
	}

	function handleArrowLoaded(color: 'red' | 'blue') {
		logDebug(`✅ ${color} arrow loaded`);
		componentLoading[`${color}Arrow`] = true;
		checkAllComponentsLoaded();
	}

	// If any component errors, still mark it as loaded to not block rendering
	function handleComponentError(component: string, error?: any) {
		logDebug(`❌ Error loading ${component}: ${error?.message || 'Unknown error'}`);

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
			{/if}

			{#if blueProp}
				<Prop
					propData={blueProp}
					on:loaded={() => handlePropLoaded('blue')}
					on:error={() => handleComponentError('blueProp')}
				/>
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
