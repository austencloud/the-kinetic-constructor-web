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
    import LoadingSpinner from '../MainWidget/LoadingSpinner.svelte';

    export let pictographDataStore: Writable<PictographData>;
    export const onClick: () => void = () => {};

    // Track rendering stages
    let stage = 'initializing'; // initializing -> loading -> rendering -> complete
    let componentLoading = {
        grid: false,
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
    
    // Check if all components are loaded and ready to display
    function checkAllComponentsLoaded() {
        const allLoaded = Object.values(componentLoading).every(loaded => loaded);
        if (allLoaded && stage === 'loading') {
            console.log('✅ All components loaded, displaying pictograph');
            stage = 'rendering';
            
            // Add a small delay to ensure everything renders correctly
            tick().then(() => {
                stage = 'complete';
                dispatch('loaded');
            });
        }
    }

    onMount(() => {
        // Set a safety timeout (5 seconds maximum)
        safetyTimer = setTimeout(() => {
            console.warn('⚠️ Safety timeout triggered for pictograph');
            if (stage !== 'complete') {
                stage = 'complete';
                dispatch('loaded', { timedOut: true });
            }
        }, 5000);

        (async () => {
            try {
                // First stage: initialize the pictograph data
                await initializer.initialize();
                console.log('🟢 Pictograph Initialization Complete');

                // Get the stored components
                redProp = get(get(elements).redPropData);
                blueProp = get(get(elements).bluePropData);
                redArrow = get(get(elements).redArrowData);
                blueArrow = get(get(elements).blueArrowData);

                // Update component placements before showing anything
                await updatePlacements();
                
                // Update to loading stage - now we'll wait for individual components to load
                stage = 'loading';
            } catch (error) {
                console.error('Failed to initialize pictograph:', error);
                // Even on error, show something 
                stage = 'complete';
                dispatch('loaded', { error: true });
                clearTimeout(safetyTimer);
            }
        })();

        return () => {
            clearTimeout(safetyTimer);
        };
    });

    async function updatePlacements() {
        if (pictographManagers.propPlacementManager && pictographManagers.arrowPlacementManager) {
            pictographManagers.propPlacementManager.updatePropPlacement([redProp!, blueProp!]);
            pictographManagers.arrowPlacementManager.updateArrowPlacements([redArrow!, blueArrow!]);
            console.log('✅ Props & Arrows repositioned');
            
            // Wait for next tick to ensure the DOM updates
            await tick();
        }
    }

    function handleGridDataReady(data: any) {
        elements.update((els) => {
            els.gridData.set(data);
            return els;
        });
        gridDataLoaded = true;
        componentLoading.grid = true;
        checkAllComponentsLoaded();
    }
    
    function handlePropLoaded(color: 'red'|'blue') {
        componentLoading[`${color}Prop`] = true;
        checkAllComponentsLoaded();
    }
    
    function handleArrowLoaded(color: 'red'|'blue') {
        componentLoading[`${color}Arrow`] = true;
        checkAllComponentsLoaded();
    }
    
    // Add keyboard event handler for accessibility
    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Enter' || e.key === ' ') {
            onClick();
        }
    }
</script>

<!-- Use div wrapper instead of direct SVG clicks for accessibility -->
<div 
    class="pictograph-wrapper" 
    role="button"
    tabindex="0"
    on:click={onClick}
    on:keydown={handleKeyDown}
    aria-label="Pictograph visualization"
>
    <svg class="pictograph" viewBox="0 0 950 950" xmlns="http://www.w3.org/2000/svg" role="img">
        {#if stage === 'initializing'}
            <!-- Initial loading spinner -->
            <g transform="translate(475, 475)">
                <foreignObject width="80" height="80" x="-40" y="-40">
                    <div class="spinner-container">
                        <LoadingSpinner />
                        <div class="loading-text">Initializing...</div>
                    </div>
                </foreignObject>
            </g>
        {:else if stage === 'loading'}
            <!-- Component loading spinner -->
            <g transform="translate(475, 475)">
                <foreignObject width="80" height="80" x="-40" y="-40">
                    <div class="spinner-container">
                        <LoadingSpinner />
                        <div class="loading-text">Loading components...</div>
                    </div>
                </foreignObject>
            </g>
        {:else}
            <!-- All components rendered at once when ready -->
            <Grid
                gridMode={get(pictographDataStore)?.gridMode || 'diamond'}
                onPointsReady={handleGridDataReady}
            />
            <TKAGlyph letter={get(pictographDataStore).letter} turnsTuple="(s, 0, 0)" x={50} y={800} />

            {#if redProp}
                <Prop 
                    propData={redProp} 
                    on:loaded={() => handlePropLoaded('red')} 
                />
            {/if}
            
            {#if blueProp}
                <Prop 
                    propData={blueProp} 
                    on:loaded={() => handlePropLoaded('blue')}
                />
            {/if}

            {#if redArrow}
                <Arrow 
                    arrowData={redArrow} 
                    on:loaded={() => handleArrowLoaded('red')}
                />
            {/if}
            
            {#if blueArrow}
                <Arrow 
                    arrowData={blueArrow} 
                    on:loaded={() => handleArrowLoaded('blue')}
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

    .spinner-container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #555;
    }
    
    .loading-text {
        margin-top: 10px;
        font-size: 12px;
        color: #555;
    }
</style>