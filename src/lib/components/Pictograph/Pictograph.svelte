<!-- src/lib/components/Pictograph/Pictograph.svelte -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { get } from 'svelte/store';
	import { popIn } from '$lib/transitions/popIn';
	import type { PictographData } from '$lib/types/PictographData';
	
	// Component imports
	import Grid from '../objects/Grid/Grid.svelte';
	import Prop from '../objects/Prop/Prop.svelte';
	import Arrow from '../objects/Arrow/Arrow.svelte';
	import TKAGlyph from '../objects/Glyphs/TKAGlyph/TKAGlyph.svelte';
	import PictographError from './components/PictographError.svelte';
	import PictographDebug from './components/PictographDebug.svelte';
	import InitializingSpinner from './components/InitializingSpinner.svelte';
	import LoadingProgress from './components/LoadingProgress.svelte';
	import BeatLabel from './components/BeatLabel.svelte';
	import PictographWrapper from './components/PictographWrapper.svelte';
	import PictographSVG from './components/PictographSVG.svelte';
  
	// Composables
	import { createPictographState } from './composables/usePictographState';
	import { usePictographData } from './composables/usePictographData';
	import { usePictographLoading } from './composables/usePictographLoading';
	import { usePictographComponents } from './composables/usePictographComponents';
	import { usePictographSvgPreloading } from './composables/usePictographSvgPreloading';
	import { usePictographErrorHandling } from './composables/usePictographErrorHandling';
  
	// Utility imports
	import {
	  shouldShowBeatLabel,
	  shouldShowDebugInfo,
	  shouldShowLoadingIndicator,
	  shouldShowMotionComponents
	} from './utils/PictographRenderUtils';
  
	// Props
	export let pictographData: PictographData | undefined = undefined;
	export let onClick: (() => void) | undefined = undefined;
	export let debug = false;
	export let animationDuration = 200;
	export let showLoadingIndicator = true;
	export let beatNumber: number | null = null;
	export let isStartPosition = false;
	export let disableAnimations = false;
  
	// Derived values
	const isBeatFramePictograph = beatNumber !== null || isStartPosition;
  
	// Event dispatcher
	interface PictographEvents {
	  loaded: { error?: boolean };
	  error: { message: string; component?: string };
	  dataUpdated: { data: PictographData };
	}
	const dispatch = createEventDispatcher<PictographEvents>();
  
	// Create a generic dispatch wrapper for composables
	const dispatchWrapper = (event: string, detail?: any) => {
	  if (event === 'loaded' && typeof detail?.error === 'boolean') {
		dispatch('loaded', { error: detail.error });
	  } else if (event === 'error' && detail?.message) {
		dispatch('error', { message: detail.message, component: detail.component });
	  } else if (event === 'dataUpdated' && detail?.data) {
		dispatch('dataUpdated', { data: detail.data });
	  } else {
		// Fallback for other events - cast to bypass TypeScript
		(dispatch as any)(event, detail);
	  }
	};
  
	// Create state
	const state = createPictographState(pictographData, disableAnimations);
  
	// Create error handling
	const { handleError, handleComponentError } = usePictographErrorHandling(
	  state,
	  dispatchWrapper
	);
  
	// Create SVG preloading
	const { preloadAllSvgs } = usePictographSvgPreloading(
	  state,
	  isBeatFramePictograph
	);
  
	// Create component management
	const { createAndPositionComponents, updateComponentsFromData } = usePictographComponents(
	  state,
	  preloadAllSvgs
	);
  
	// Create loading management
	const {
	  handleGridLoaded,
	  handleComponentLoaded,
	  handleGlyphLoaded,
	  updateShowPictographState
	} = usePictographLoading(
	  state,
	  dispatchWrapper,
	  createAndPositionComponents,
	  checkLoadingComplete,
	  disableAnimations
	);
  
	// Create data management
	const { initialize, setupDataSubscription, updatePictographData } = usePictographData(
	  state,
	  dispatchWrapper,
	  updateComponentsFromData,
	  handleError,
	  debug
	);
  
	// Check loading complete function
	function checkLoadingComplete() {
	  if (disableAnimations) {
		const isComplete = get(state.requiredComponents).every(comp => 
		  get(state.loadedComponents).has(comp)
		);
		
		if (isComplete) {
		  state.allComponentsLoaded.set(true);
		  if (!get(state.showPictograph)) {
			state.showPictograph.set(true);
			dispatch('loaded', { error: false });
		  }
		}
		return;
	  }
  
	  // Normal flow with animations
	  if (typeof window !== 'undefined') {
		requestAnimationFrame(() => {
		  const isComplete = get(state.requiredComponents).every(comp => 
			get(state.loadedComponents).has(comp)
		  );
		  
		  state.renderCount.update(count => count + 1);
		  
		  if (isComplete) {
			state.allComponentsLoaded.set(true);
			updateShowPictographState();
		  }
		});
	  }
	}
  
	// Reactive statement to update pictograph data
	$: if (pictographData) {
	  updatePictographData(pictographData);
	}
  
	// Extract individual stores for reactive statements
	const {
	  state: currentStateStore,
	  errorMessage: errorMessageStore,
	  gridData: gridDataStore,
	  redPropData: redPropDataStore,
	  bluePropData: bluePropDataStore,
	  redArrowData: redArrowDataStore,
	  blueArrowData: blueArrowDataStore,
	  loadProgress: loadProgressStore,
	  renderCount: renderCountStore,
	  componentsLoaded: componentsLoadedStore,
	  totalComponentsToLoad: totalComponentsToLoadStore,
	  showPictograph: showPictographStore,
	  pictographDataStore
	} = state;
  
	// Reactive values using auto-subscription
	$: currentState = $currentStateStore;
	$: errorMessage = $errorMessageStore;
	$: gridData = $gridDataStore;
	$: redPropData = $redPropDataStore;
	$: bluePropData = $bluePropDataStore;
	$: redArrowData = $redArrowDataStore;
	$: blueArrowData = $blueArrowDataStore;
	$: loadProgress = $loadProgressStore;
	$: renderCount = $renderCountStore;
	$: componentsLoaded = $componentsLoadedStore;
	$: totalComponentsToLoad = $totalComponentsToLoadStore;
	$: showPictograph = $showPictographStore;
  
	// Mobile detection
	function isMobile(): boolean {
	  return (
		typeof window !== 'undefined' &&
		(window.innerWidth <= 768 ||
		  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
	  );
	}
  
	// Lifecycle
	let subscription = { unsubscribe: () => {} };
  
	onMount(() => {
	  // Initialize the pictograph
	  initialize();
	  
	  // Set up data subscription
	  subscription = setupDataSubscription();
	  
	  // Cleanup function
	  return () => {
		get(state.loadedComponents).clear();
		subscription.unsubscribe();
	  };
	});
  </script>
  
  <PictographWrapper {pictographDataStore} {onClick} state={currentState}>
	<PictographSVG {pictographDataStore} state={currentState} {errorMessage}>
	  {#if currentState === 'initializing'}
		{#if shouldShowLoadingIndicator(currentState, showLoadingIndicator)}
		  <InitializingSpinner {animationDuration} />
		{/if}
	  {:else if currentState === 'error'}
		<PictographError {errorMessage} {animationDuration} />
	  {:else}
		<Grid
		  gridMode={get(pictographDataStore)?.gridMode}
		  onPointsReady={handleGridLoaded}
		  onError={(message) => handleComponentError('grid', message)}
		  {debug}
		/>
  
		{#if shouldShowBeatLabel(beatNumber, isStartPosition)}
		  <BeatLabel
			text={isStartPosition ? 'Start' : beatNumber?.toString() || ''}
			position="top-left"
			{animationDuration}
		  />
		{/if}
  
		{#if shouldShowMotionComponents(currentState)}
		  <!-- Hidden components for preloading -->
		  <g style="visibility: hidden; position: absolute;">
			{#if get(pictographDataStore)?.letter}
			  <TKAGlyph
				letter={get(pictographDataStore)?.letter}
				turnsTuple="(s, 0, 0)"
				x={50}
				y={800}
				scale={1}
				on:loading={() => {}}
				on:loaded={handleGlyphLoaded}
			  />
			{/if}
  
			{#each [
			  { color: 'red', propData: redPropData, arrowData: redArrowData }, 
			  { color: 'blue', propData: bluePropData, arrowData: blueArrowData }
			] as { color, propData, arrowData } (color)}
			  {#if propData}
				<Prop
				  {propData}
				  loaded={() => handleComponentLoaded(`${color}Prop`)}
				  error={(e) => handleComponentError(`${color}Prop`, e.message)}
				/>
			  {/if}
  
			  {#if arrowData}
				{#each [`${arrowData.id}-${arrowData.turns}-${arrowData.propRotDir}-${arrowData.motionType}`] as key (key)}
				  <Arrow
					{arrowData}
					loadTimeoutMs={isMobile() ? 2000 : 1000}
					pictographService={get(state.service)}
					loaded={() => handleComponentLoaded(`${color}Arrow`)}
					error={(e) => handleComponentError(`${color}Arrow`, e.message)}
				  />
				{/each}
			  {/if}
			{/each}
		  </g>
  
		  <!-- Visible components -->
		  {#if showPictograph}
			{#if disableAnimations}
			  <g style="transform-origin: center center;">
				{#if get(pictographDataStore)?.letter}
				  <TKAGlyph
					letter={get(pictographDataStore)?.letter}
					turnsTuple="(s, 0, 0)"
					x={50}
					y={800}
					scale={1}
				  />
				{/if}
  
				{#each [
				  { color: 'red', propData: redPropData, arrowData: redArrowData }, 
				  { color: 'blue', propData: bluePropData, arrowData: blueArrowData }
				] as { color, propData, arrowData } (color)}
				  {#if propData}
					<Prop {propData} animationDuration={0} />
				  {/if}
  
				  {#if arrowData}
					{#each [`${arrowData.id}-${arrowData.turns}-${arrowData.propRotDir}-${arrowData.motionType}`] as key (key)}
					  <Arrow
						{arrowData}
						loadTimeoutMs={10}
						pictographService={get(state.service)}
						loaded={() => {}}
						error={() => {}}
					  />
					{/each}
				  {/if}
				{/each}
			  </g>
			{:else}
			  <g
				in:popIn={{
				  duration: animationDuration,
				  start: 0.85,
				  opacity: 0.2
				}}
				style="transform-origin: center center;"
			  >
				{#if get(pictographDataStore)?.letter}
				  <TKAGlyph
					letter={get(pictographDataStore)?.letter}
					turnsTuple="(s, 0, 0)"
					x={50}
					y={800}
					scale={1}
				  />
				{/if}
  
				{#each [
				  { color: 'red', propData: redPropData, arrowData: redArrowData }, 
				  { color: 'blue', propData: bluePropData, arrowData: blueArrowData }
				] as { color, propData, arrowData } (color)}
				  {#if propData}
					<Prop {propData} {animationDuration} />
				  {/if}
  
				  {#if arrowData}
					{#each [`${arrowData.id}-${arrowData.turns}-${arrowData.propRotDir}-${arrowData.motionType}`] as key (key)}
					  <Arrow
						{arrowData}
						loadTimeoutMs={isMobile() ? 2000 : 1000}
						pictographService={get(state.service)}
						loaded={() => {}}
						error={() => {}}
					  />
					{/each}
				  {/if}
				{/each}
			  </g>
			{/if}
		  {/if}
		{/if}
	  {/if}
	</PictographSVG>
  
	{#if currentState === 'loading' && shouldShowLoadingIndicator(currentState, showLoadingIndicator)}
	  <LoadingProgress {loadProgress} showText={true} />
	{/if}
  
	{#if shouldShowDebugInfo(debug)}
	  <PictographDebug
		state={currentState}
		{componentsLoaded}
		totalComponents={totalComponentsToLoad}
		{renderCount}
	  />
	{/if}
  </PictographWrapper>