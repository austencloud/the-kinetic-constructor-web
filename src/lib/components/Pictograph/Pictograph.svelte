<!-- Pictograph.svelte -->
<script lang="ts">
	import { PropType } from '$lib/types/Types';
	import { onMount, createEventDispatcher } from 'svelte';
	import { get, writable, type Writable } from 'svelte/store';
	
	import type { PictographData } from '$lib/types/PictographData.js';
	import type { PropData } from '../objects/Prop/PropData';
	import type { ArrowData } from '../objects/Arrow/ArrowData';
	import type { GridData } from '../objects/Grid/GridData';
	
	// Components
	import Grid from '../objects/Grid/Grid.svelte';
	import Prop from '../objects/Prop/Prop.svelte';
	import Arrow from '../objects/Arrow/Arrow.svelte';
	import TKAGlyph from '../objects/Glyphs/TKAGlyph/TKAGlyph.svelte';
	import PictographDebugView from './components/PictographDebugView.svelte';
	
	// Import the BetaPropPositioner for proper beta positioning
	import { BetaPropPositioner } from '$lib/components/PlacementManagers/PropPlacementManager/BetaPropPositioner';
	
	import { CLOCK, COUNTER, IN, OUT, STAFF } from '$lib/types/Constants';
	import { LetterUtils } from '$lib/utils/LetterUtils';
	import { LetterConditions } from './LetterConditions';
	
	// Import the external PictographChecker class
	import { PictographChecker } from './PictographChecker';
	
	// Props
	export let pictographDataStore: Writable<PictographData>;
	export let onClick: (() => void) | undefined = undefined;
	export let debug: boolean = false;
	
	// Event dispatcher
	const dispatch = createEventDispatcher<{
	  loaded: {
		complete: boolean;
		error?: boolean;
		message?: string;
	  };
	  error: { source: string; error?: any; message?: string };
	}>();
	
	// State
	let renderStage: 'initializing' | 'grid_only' | 'loading' | 'complete' | 'error' = 'initializing';
	let gridData: GridData | null = null;
	let redPropData: PropData | null = null;
	let bluePropData: PropData | null = null;
	let redArrowData: ArrowData | null = null;
	let blueArrowData: ArrowData | null = null;
	let error: string | null = null;
	
	// Create the checker instance reactively
	let pictographChecker: PictographChecker;
	$: pictographChecker = new PictographChecker(get(pictographDataStore));
	
	// Track loaded components
	let componentsLoaded = {
	  grid: false,
	  redProp: false,
	  blueProp: false,
	  redArrow: false,
	  blueArrow: false
	};
	
	// Check if pictograph data is complete enough for full rendering
	function hasRequiredPictographData(data: PictographData): boolean {
	  return !!(
		data && 
		data.redMotionData && 
		data.blueMotionData
	  );
	}
	
	// Handle when grid component provides its data
	function onGridDataReady(data: GridData) {
	  // Store grid data
	  gridData = data;
	  
	  // Update central store
	  pictographDataStore.update(store => ({
		...store,
		gridData: data
	  }));
	  
	  // Mark grid as loaded
	  componentsLoaded.grid = true;
	  
	  if (debug) console.log('Grid data ready:', data);
	  
	  // If we're in grid_only mode, we're already done
	  if (renderStage === 'grid_only') {
		dispatch('loaded', { complete: false });
		return;
	  }
	  
	  // Otherwise, continue with initialization of other components
	  initializeComponents();
	}
	
	// Initialize components based on motion data
	function initializeComponents() {
	  try {
		const data = get(pictographDataStore);
		
		// Create props
		if (data.redMotionData) {
		  redPropData = createPropFromMotion(data.redMotionData, 'red');
		}
		
		if (data.blueMotionData) {
		  bluePropData = createPropFromMotion(data.blueMotionData, 'blue');
		}
		
		// Create arrows
		if (data.redMotionData) {
		  redArrowData = createArrowFromMotion(data.redMotionData, 'red');
		}
		
		if (data.blueMotionData) {
		  blueArrowData = createArrowFromMotion(data.blueMotionData, 'blue');
		}
		
		// Update the store with new data
		pictographDataStore.update(store => ({
		  ...store,
		  redPropData,
		  bluePropData,
		  redArrowData,
		  blueArrowData
		}));
		
		// Change stage to loading
		renderStage = 'loading';
		
	  } catch (err) {
		handleError('initialization', err);
	  }
	}
	
	// Helper function to create prop data from motion data
	function createPropFromMotion(motionData: any, color: 'red' | 'blue'): PropData {
	  // Create prop with correct PropType enum value
	  return {
		id: crypto.randomUUID(),
		motionId: motionData.id,
		color: color,
		propType: PropType.STAFF, // Using imported constant
		radialMode: ['in', 'out'].includes(motionData.endOri) ? 'radial' : 'nonradial',
		ori: motionData.endOri,
		coords: { x: 0, y: 0 }, // Will be positioned later
		loc: motionData.endLoc,
		rotAngle: 0 // Will be calculated by the Prop component
	  };
	}
	
	// Helper function to create arrow data from motion data
	function createArrowFromMotion(motionData: any, color: 'red' | 'blue'): ArrowData {
	  // Simplified arrow creation
	  return {
		id: crypto.randomUUID(),
		motionId: motionData.id,
		color: color,
		coords: { x: 0, y: 0 }, // Will be positioned later
		loc: motionData.endLoc,
		rotAngle: 0, // Will be calculated separately
		svgMirrored: false, // Will be determined later
		svgCenter: { x: 0, y: 0 },
		svgLoaded: false,
		svgData: null,
		motionType: motionData.motionType,
		startOri: motionData.startOri,
		endOri: motionData.endOri,
		turns: motionData.turns,
		propRotDir: motionData.propRotDir
	  };
	}
	
	// Handle prop component loaded event
	function onPropLoaded(color: 'red' | 'blue') {
	  if (debug) console.log(`${color} prop loaded`);
	  componentsLoaded[`${color}Prop`] = true;
	  checkAllComponentsLoaded();
	}
	
	// Handle arrow component loaded event
	function onArrowLoaded(color: 'red' | 'blue') {
	  if (debug) console.log(`${color} arrow loaded`);
	  componentsLoaded[`${color}Arrow`] = true;
	  checkAllComponentsLoaded();
	}
	
	// Check if all required components are loaded
	function checkAllComponentsLoaded() {
	  // For grid_only mode, we only need the grid
	  if (renderStage === 'grid_only' && componentsLoaded.grid) {
		renderStage = 'complete';
		dispatch('loaded', { complete: false });
		return;
	  }
	  
	  // For full rendering, we need all components
	  if (
		componentsLoaded.grid &&
		componentsLoaded.redProp &&
		componentsLoaded.blueProp &&
		componentsLoaded.redArrow &&
		componentsLoaded.blueArrow
	  ) {
		positionComponents();
	  }
	}
	
	// Position components based on grid data
	function positionComponents() {
	  try {
		if (!gridData) {
		  throw new Error('Grid data not available for positioning');
		}
  
		// Simple positioning using predetermined grid points
		if (redPropData) {
		  positionProp(redPropData, gridData);
		}
		
		if (bluePropData) {
		  positionProp(bluePropData, gridData);
		}
		
		// Check if beta positioning is needed based on letter condition
		if (redPropData && bluePropData) {
		  const needsBetaPositioning = pictographChecker.endsWithBeta();
		  
		  if (debug) {
			console.log('Checking beta status for letter:', get(pictographDataStore).letter);
			console.log('Beta positioning needed:', needsBetaPositioning);
		  }
		  
		  if (needsBetaPositioning) {
			if (debug) console.log('Beta ending detected, applying BetaPropPositioner');
			
			// Use the actual BetaPropPositioner for proper beta positioning
			try {
			  const pictographData = get(pictographDataStore);
			  const betaPositioner = new BetaPropPositioner(pictographData);
			  
			  // Log before positions for debugging
			  if (debug) {
				console.log(`Before beta positioning: Red at (${redPropData.coords.x}, ${redPropData.coords.y}), Blue at (${bluePropData.coords.x}, ${bluePropData.coords.y})`);
			  }
			  
			  // Apply proper beta positioning using the original BetaPropPositioner
			  betaPositioner.reposition([redPropData, bluePropData]);
			  
			  // Log after positions
			  if (debug) {
				console.log(`After beta positioning: Red at (${redPropData.coords.x}, ${redPropData.coords.y}), Blue at (${bluePropData.coords.x}, ${bluePropData.coords.y})`);
			  }
			} catch (betaError) {
			  console.error('Error applying beta positioning:', betaError);
			}
		  }
		}
		
		// Position arrows relative to the positioned props
		if (redArrowData) {
		  positionArrow(redArrowData, gridData);
		}
		
		if (blueArrowData) {
		  positionArrow(blueArrowData, gridData);
		}
		
		// Update the store with positioned data
		pictographDataStore.update(store => ({
		  ...store,
		  redPropData,
		  bluePropData,
		  redArrowData,
		  blueArrowData
		}));
		
		// Everything is ready
		renderStage = 'complete';
		dispatch('loaded', { complete: true });
		
	  } catch (err) {
		handleError('positioning', err);
	  }
	}
	
	// Simple positioning function for props
	function positionProp(prop: PropData, gridData: GridData) {
	  const gridMode = get(pictographDataStore).gridMode;
	  const pointName = `${prop.loc}_${gridMode}_hand_point`;
	  
	  if (gridData.allHandPointsNormal && gridData.allHandPointsNormal[pointName]?.coordinates) {
		// Position using grid point coordinates without any arbitrary offsets
		prop.coords = { ...gridData.allHandPointsNormal[pointName].coordinates! };
	  } else {
		// Fallback positioning if grid point not found
		applyFallbackPropPosition(prop);
	  }
	  
	  if (debug) console.log(`Positioned ${prop.color} prop at (${prop.coords.x}, ${prop.coords.y})`);
	}
	
	// Simple positioning function for arrows
	function positionArrow(arrow: ArrowData, gridData: GridData) {
	  // For simplicity, arrows are positioned at their prop location with a slight offset
	  const colorProp = arrow.color === 'red' ? redPropData : bluePropData;
	  
	  if (colorProp && colorProp.coords) {
		arrow.coords = { 
		  x: colorProp.coords.x + (arrow.color === 'red' ? 30 : -30), 
		  y: colorProp.coords.y + 30 
		};
	  } else {
		// Fallback positioning
		arrow.coords = { x: 475, y: 475 };
	  }
	}
	
	// Fallback positioning for props when grid points aren't found
	function applyFallbackPropPosition(prop: PropData) {
	  const basePositions: Record<string, { x: number; y: number }> = {
		n: { x: 475, y: 330 },
		e: { x: 620, y: 475 },
		s: { x: 475, y: 620 },
		w: { x: 330, y: 475 },
		ne: { x: 620, y: 330 },
		se: { x: 620, y: 620 },
		sw: { x: 330, y: 620 },
		nw: { x: 330, y: 330 }
	  };
	  
	  if (prop.loc && basePositions[prop.loc]) {
		prop.coords = { ...basePositions[prop.loc] };
	  } else {
		// Default center position
		prop.coords = { x: 475, y: 475 };
	  }
	}
	
	// Handle errors gracefully
	function handleError(source: string, err: any) {
	  const message = err instanceof Error ? err.message : String(err);
	  console.error(`Pictograph error [${source}]:`, err);
	  
	  error = message;
	  renderStage = 'error';
	  
	  dispatch('error', { source, error: err, message });
	  dispatch('loaded', { complete: false, error: true, message });
	}
	
	// Handle component errors
	function handleComponentError(componentKey: string, err: any) {
	  console.warn(`Component error (${componentKey}):`, err);
	  
	  // Mark the component as loaded anyway so we don't get stuck
	  componentsLoaded[componentKey as keyof typeof componentsLoaded] = true;
	  checkAllComponentsLoaded();
	}
	
	// Initialize on mount
	onMount(() => {
	  const pictographData = get(pictographDataStore);
	  
	  // Early check for data completeness
	  if (!hasRequiredPictographData(pictographData)) {
		if (debug) console.log('Incomplete pictograph data, using grid-only mode');
		renderStage = 'grid_only';
		return;
	  }
	  
	  renderStage = 'loading';
	  if (debug) console.log('Pictograph data is complete, proceeding with full initialization');
	  
	  // Note: We don't call initializeComponents() here
	  // It will be called after the grid is ready (in onGridDataReady)
	});
	
	// Handle wrapper click
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
	  <!-- Loading State -->
	  {#if renderStage === 'initializing'}
		<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="24" fill="grey">
		  Loading...
		</text>
	  
	  <!-- Error State -->
	  {:else if renderStage === 'error'}
		<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="24" fill="red">
		  Error: {error}
		</text>
		
	  <!-- All Other States (grid_only, loading, complete) - Always render grid -->
	  {:else}
		<!-- Grid (always rendered) -->
		<Grid
		  gridMode={get(pictographDataStore).gridMode}
		  onPointsReady={onGridDataReady}
		  on:error={(e) => handleComponentError('grid', e.detail)}
		  {debug}
		/>
		
		<!-- Only render other components if we're not in grid_only mode -->
		{#if renderStage !== 'grid_only'}
		  <!-- Letter/Glyph (if available) -->
		  {#if get(pictographDataStore).letter}
			<TKAGlyph
			  letter={get(pictographDataStore).letter}
			  turnsTuple="(s, 0, 0)"
			  x={50}
			  y={800}
			/>
		  {/if}
		  
		  <!-- Red Prop -->
		  {#if redPropData}
			<Prop
			  propData={redPropData}
			  on:loaded={() => onPropLoaded('red')}
			  on:error={(e) => handleComponentError('redProp', e.detail)}
			/>
		  {/if}
		  
		  <!-- Blue Prop -->
		  {#if bluePropData}
			<Prop
			  propData={bluePropData}
			  on:loaded={() => onPropLoaded('blue')}
			  on:error={(e) => handleComponentError('blueProp', e.detail)}
			/>
		  {/if}
		  
		  <!-- Red Arrow -->
		  {#if redArrowData}
			<Arrow
			  arrowData={redArrowData}
			  on:loaded={() => onArrowLoaded('red')}
			  on:error={(e) => handleComponentError('redArrow', e.detail)}
			/>
		  {/if}
		  
		  <!-- Blue Arrow -->
		  {#if blueArrowData}
			<Arrow
			  arrowData={blueArrowData}
			  on:loaded={() => onArrowLoaded('blue')}
			  on:error={(e) => handleComponentError('blueArrow', e.detail)}
			/>
		  {/if}
		{/if}
		
		<!-- Debug Overlay (if debug mode is on) -->
		{#if debug}
		  <!-- Modified PictographDebugView to support beta status -->
		  <g>
			<!-- Debug points for props -->
			{#if redPropData}
			  <circle cx={redPropData.coords.x} cy={redPropData.coords.y} r="8" fill="red" opacity="0.5" />
			  <text
				x={redPropData.coords.x}
				y={redPropData.coords.y - 10}
				text-anchor="middle"
				fill="red"
				font-size="12"
				stroke="white"
				stroke-width="0.5"
			  >
				({Math.round(redPropData.coords.x)}, {Math.round(redPropData.coords.y)})
			  </text>
			{/if}
  
			{#if bluePropData}
			  <circle cx={bluePropData.coords.x} cy={bluePropData.coords.y} r="8" fill="blue" opacity="0.5" />
			  <text
				x={bluePropData.coords.x}
				y={bluePropData.coords.y - 10}
				text-anchor="middle"
				fill="blue"
				font-size="12"
				stroke="white"
				stroke-width="0.5"
			  >
				({Math.round(bluePropData.coords.x)}, {Math.round(bluePropData.coords.y)})
			  </text>
			{/if}
  
			<!-- Debug status text -->
			<text x="10" y="20" font-size="12" fill="white" stroke="black" stroke-width="0.5">
			  Stage: {renderStage}
			</text>
  
			<text x="10" y="40" font-size="12" fill="white" stroke="black" stroke-width="0.5">
			  Data Complete: {renderStage !== 'grid_only' ? 'Yes' : 'No'}
			</text>
  
			<text x="10" y="60" font-size="12" fill="white" stroke="black" stroke-width="0.5">
			  Beta active: {pictographChecker && pictographChecker.endsWithBeta() ? 'Yes' : 'No'}
			</text>
		  </g>
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
  
	/* Always set pointer cursor on hover */
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