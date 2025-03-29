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
  export const isError = null;  // Not using this directly in template
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
  
  /**
   * Determines if all necessary data is available for rendering
   */
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
  
  /**
   * Handles grid data becoming ready
   */
  function handleGridDataReady(data: any) {
    logger.debug('Grid data ready', data);
    // Store the grid data
    gridDataStore.set(data);
    
    // Update pictograph data store to include grid data
    pictographDataStore.update(current => ({
      ...current,
      gridData: data
    }));
  }
  
  /**
   * Handles props being loaded
   */
  function handlePropLoaded(color: 'red' | 'blue') {
    logger.debug(`${color} prop loaded`);
  }
  
  /**
   * Handles arrows being loaded
   */
  function handleArrowLoaded(color: 'red' | 'blue') {
    logger.debug(`${color} arrow loaded`);
  }
  
  /**
   * Handles component errors
   */
  function handleComponentError(componentKey: string, error?: any) {
    logger.error(`Error in component: ${componentKey}`, error);
    // Forward to parent through context's state machine
    throw error;
  }
</script>

{#if isLoading()}
  <LoadingIndicator />
{:else}
  <!-- Grid is always rendered -->
  <Grid
    {gridMode}
    onPointsReady={handleGridDataReady}
    on:error={(e) => handleComponentError('grid', e.detail)}
  />

  {#if isDataComplete()}
    <!-- Letter glyph -->
    {#if letter}
      <TKAGlyph
        {letter}
        turnsTuple="(s, 0, 0)"
        x={50}
        y={800}
      />
    {/if}

    <!-- Props -->
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
      isDataComplete={isDataComplete}
      visible={true}
    />
    
    {#if gridData && (redProp || blueProp)}
      <PropPositionDebugger
        {gridData}
        {redProp}
        {blueProp}
        visible={true}
      />
    {/if}
  {/if}
{/if}