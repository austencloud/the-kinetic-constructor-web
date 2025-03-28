<!-- src/lib/components/Pictograph/Pictograph.svelte -->
<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher, tick } from 'svelte';
	import { get, writable, type Writable, derived } from 'svelte/store';

	// --- Core Types & Data ---
	import type { PictographData } from '$lib/types/PictographData.js';
	import type { PropData } from '../objects/Prop/PropData';
	import type { ArrowData } from '../objects/Arrow/ArrowData';
    import type { GridData } from '../objects/Grid/GridData';
	import {
        type RenderStage,
        type ComponentLoadingStatus,
        type ComponentPositioningStatus
    } from './constants/trackingConstants';

	// --- Child Component for Rendering ---
	import PictographContent from './PictographContent.svelte';

	// --- Initialization & Management ---
	import { PictographInitializer } from './PictographInitializer';
	import { PictographManagers } from './PictographManagers';
    import type { PictographElementStores } from './PictographElements'; // Import type helper

	// --- Services ---
	import { PictographLifecycleService } from './services/PictographLifecycleService';
	import { PictographValidationService } from './services/PictographValidationService';
	import { PictographPositioningService } from './services/PictographPositioningService';
	import { PictographComponentStatusService } from './services/PictographComponentStatusService';

	// --- Props ---
    /** The Svelte store containing the primary data for this pictograph. */
	export let pictographDataStore: Writable<PictographData>;
    /** Optional click handler for the entire pictograph wrapper. */
	export let onClick: (() => void) | undefined = undefined;
    /** Flag to enable/disable debug overlays and console logging. */
	export let debug: boolean = false;

	// --- Event Dispatcher ---
	const dispatch = createEventDispatcher<{
        loaded: { incompleteData?: boolean; timedOut?: boolean; error?: boolean; message?: string;[key: string]: any }; // More specific payload
        error: { source: string; error?: any; message?: string };
    }>();

	// --- Core State ---
    /** Current rendering stage of the pictograph. */
	let stage: RenderStage = 'initializing';
    /** Flag indicating if the Initializer.initialize() method has been run. */
    let initializationAttempted = false;
    /** Flag indicating if the Initializer completed without needing fallbacks due to incomplete input data. */
    let initializationSucceeded = false;

	// --- Core Objects (Initialized in onMount) ---
    /** Handles creation of motions, props, arrows from initial data. */
	let initializer: PictographInitializer | null = null;
    /** Holds stores for elements created by the initializer. */
    let elementStores: Writable<PictographElementStores> | null = null;
    /** Manages checker, getter, placement managers. */
	let pictographManagers: PictographManagers | null = null;

	// --- Services (Initialized Immediately) ---
    // Note: Services are instantiated here, dependencies are passed in.

    /** Manages overall lifecycle, initialization triggers, retries, timeouts. */
	const lifecycleService = new PictographLifecycleService(
		pictographDataStore,
		(newStage) => { stage = newStage; }, // Update local stage state
		(eventData) => dispatch('loaded', eventData), // Forward loaded events
		(eventData) => dispatch('error', eventData), // Forward error events
        debug // Pass debug flag
	);

    /** Validates data completeness for rendering and positioning. */
	const validationService = new PictographValidationService(pictographDataStore, debug);

    /** Calculates and applies positions to props and arrows. */
	const positioningService = new PictographPositioningService(debug);

    /** Tracks loading/positioning status of individual components, triggers stage changes. */
	const componentStatusService = new PictographComponentStatusService(
        () => stage, // Provide current stage reactively
		(newStage) => { stage = newStage; }, // Update local stage state
		() => { void triggerPositioning(); }, // Trigger positioning when components are ready
        () => { dispatch('loaded', { completed: true }); }, // Dispatch final loaded event on completion
		debug
	);

    // --- Derived State from Element Stores ---
    // These automatically update when the underlying stores in `elementStores` change.
    // Initialize as null stores, they get replaced once elementStores is available.
    let redPropStore = writable<PropData | null>(null);
    let bluePropStore = writable<PropData | null>(null);
    let redArrowStore = writable<ArrowData | null>(null);
    let blueArrowStore = writable<ArrowData | null>(null);

    // Reactive variables subscribed to the derived stores
    $: redProp = $redPropStore;
    $: blueProp = $bluePropStore;
    $: redArrow = $redArrowStore;
    $: blueArrow = $blueArrowStore;


	// --- Lifecycle Hooks ---
	onMount(() => {
		if (debug) console.log(`🚀 [${get(pictographDataStore)?.letter || 'NoLetter'}] Pictograph Mounted`);

        // Start the overall initialization process via the lifecycle service
        // Pass the main initialization orchestrator function (`initializeCoreComponents`)
		lifecycleService.startInitialization(initializeCoreComponents);

		return () => {
            if (debug) console.log(`🧹 [${get(pictographDataStore)?.letter || 'NoLetter'}] Pictograph Destroyed`);
			lifecycleService.cleanup(); // Clean up timers etc.
            // Optional: Add cleanup for managers or initializer if needed
		};
	});

	// --- Initialization Orchestration ---

    /**
     * Primary initialization function called by the LifecycleService *after* grid data is ready.
     * It runs the Initializer, sets up Managers, and updates derived stores.
     */
    async function initializeCoreComponents(): Promise<void> {
        if (initializationAttempted) {
            if (debug) console.log('ℹ️ Initialization already attempted, skipping.');
            return;
        }
        initializationAttempted = true;
        if (debug) console.log(`🛠️ [${get(pictographDataStore)?.letter || 'NoLetter'}] Initializing Core Components...`);

        try {
            // 1. Create and run the Initializer
            initializer = new PictographInitializer(pictographDataStore);
            elementStores = initializer.elements; // Get the element stores object

            // Subscribe derived stores to the actual element stores
            // This links $:redProp etc. to the data coming from the initializer
            redPropStore = get(elementStores).redPropData;
            bluePropStore = get(elementStores).bluePropData;
            redArrowStore = get(elementStores).redArrowData;
            blueArrowStore = get(elementStores).blueArrowData;
            // Note: Grid data store is handled separately by handleGridDataReady

            await initializer.initialize(); // Wait for initializer to finish

            // 2. Check initializer outcome
            if (initializer.hasIncompleteData) {
                lifecycleService.handleIncompleteData(); // Signal incomplete data scenario
                initializationSucceeded = false;
                // No need to proceed to managers or positioning
                return;
            } else {
                lifecycleService.handleInitializationSuccess(); // Signal successful initialization
                initializationSucceeded = true;
            }

            // 3. Create Managers (requires grid data, ensured by calling context)
            pictographManagers = new PictographManagers(pictographDataStore);
            // Initialize placement managers (this now expects gridData to be in the store)
            await pictographManagers.initializePlacementManagers();
            if (debug) console.log(`✅ [${get(pictographDataStore)?.letter || 'NoLetter'}] Managers Initialized`);


            // 4. Initial components are created and managers are ready.
            // The ComponentStatusService will take over driving the stages
            // from 'grid_ready' -> 'components_ready' -> 'positioning' -> 'complete'
            // as the child components report 'loaded'.

        } catch (error) {
            console.error(`❌ [${get(pictographDataStore)?.letter || 'NoLetter'}] Core Component Initialization Failed:`, error);
            initializationSucceeded = false;
            // Let lifecycle service handle retries/failure reporting
            // Error is re-thrown by initializer/managers if needed
             dispatch('error', { source: 'core_initialization', error });
             // Force stage to complete to show *something*
             stage = 'complete';
             dispatch('loaded', { error: true, message: 'Core initialization failed' });
        }
    }


	// --- Event Handlers from PictographContent ---

    /** Handles grid data readiness, updates store, and triggers core initialization. */
	function handleGridDataReady(gridData: GridData) {
        if (debug) console.log(`🔌 [${get(pictographDataStore)?.letter || 'NoLetter'}] Grid Ready Event Received`);
        // Update status service first
        componentStatusService.updateComponentStatus('grid', 'loading', true);
		// Let lifecycle service handle store update and trigger the main init flow
        lifecycleService.handleGridDataReady(gridData, initializeCoreComponents);
	}

    /** Updates component loading status when a prop finishes rendering. */
	function handlePropLoaded(color: 'red' | 'blue') {
        const key = `${color}Prop` as keyof ComponentLoadingStatus;
        if (debug) console.log(`🎨 [${get(pictographDataStore)?.letter || 'NoLetter'}] Prop Loaded: ${color}`);
		componentStatusService.updateComponentStatus(key, 'loading', true);
	}

    /** Updates component loading status when an arrow finishes rendering. */
	function handleArrowLoaded(color: 'red' | 'blue') {
         const key = `${color}Arrow` as keyof ComponentLoadingStatus;
        if (debug) console.log(`→ [${get(pictographDataStore)?.letter || 'NoLetter'}] Arrow Loaded: ${color}`);
		componentStatusService.updateComponentStatus(key, 'loading', true);
	}

    /** Reports component errors to the status service. */
	function handlePictographComponentError(componentKey: keyof ComponentLoadingStatus, error?: any) {
        console.error(`🔥 [${get(pictographDataStore)?.letter || 'NoLetter'}] Component Error: ${componentKey}`, error);
		componentStatusService.reportComponentError(componentKey, error);
        // Also dispatch a top-level error event
        dispatch('error', { source: `component_${componentKey}`, error });
	}

	// --- Positioning Logic ---

    /**
     * Function called by ComponentStatusService when stage should transition to 'positioning'.
     * Invokes the PositioningService to calculate and apply placements.
     */
	async function triggerPositioning() {
        if (!initializationSucceeded) {
             if (debug) console.warn(`🚫 [${get(pictographDataStore)?.letter || 'NoLetter'}] Skipping positioning: Initializatio n did not succeed or was incomplete.`);
             // Ensure stage moves to complete even if positioning is skipped
             stage = 'complete';
             dispatch('loaded', { positioningSkipped: true });
             return;
        }
		if (debug) console.log(`📐 [${get(pictographDataStore)?.letter || 'NoLetter'}] Triggering Positioning...`);

		const updateStatusCallback = (component: keyof ComponentPositioningStatus, isComplete: boolean) => {
            componentStatusService.updateComponentStatus(component, 'positioning', isComplete);
        };

		try {
            const positionedProps = await positioningService.updatePlacements(
                // Inputs
                pictographManagers, // Pass managers
                redProp,          // Pass current prop data
                blueProp,
                redArrow,         // Pass current arrow data
                blueArrow,
                // Dependencies / Callbacks
                updateStatusCallback,                             // Callback to update positioning status
                (arrow) => validationService.validateArrowDataForPositioning(arrow), // Arrow validation fn
                isDataCompleteForRendering,                      // Data completion check fn
                (newStage) => { stage = newStage; },              // Stage update fn
                (data) => dispatch('loaded', data)                // Final loaded event fn (might be redundant if status service handles it)
            );

             // IMPORTANT: Update the local stores with the *new* prop objects returned
             // by the positioning service to ensure reactivity in PictographContent.
             if (positionedProps.redProp) $redPropStore = positionedProps.redProp;
             if (positionedProps.blueProp) $bluePropStore = positionedProps.blueProp;
             // Arrows are assumed to be modified in place by positionArrows for now

             if (debug) console.log(`✅ [${get(pictographDataStore)?.letter || 'NoLetter'}] Positioning process completed.`);

        } catch (error) {
            console.error(`❌ [${get(pictographDataStore)?.letter || 'NoLetter'}] Error during triggerPositioning:`, error);
             dispatch('error', { source: 'positioning_orchestration', error });
             // Ensure stage completes and loaded is dispatched even on error
             stage = 'complete';
             dispatch('loaded', { error: true, message: 'Positioning failed' });
        }
	}

	// --- Data Completeness Check ---
    /**
     * Wrapper function passed to PictographContent to check for rendering completeness.
     * Uses the ValidationService.
     */
	function isDataCompleteForRendering(): boolean {
        // Call the validation service method
        const isComplete = validationService.isDataCompleteForRendering(
            redProp,
            blueProp,
            redArrow,
            blueArrow,
            stage,
            initializationAttempted
        );
        // if (debug && !isComplete && stage !== 'loading' && stage !== 'initializing' && stage !== 'grid_ready') {
        //     console.log(`📉 [${get(pictographDataStore)?.letter || 'NoLetter'}] Data IS NOT Complete for Rendering (Stage: ${stage})`);
        // }
        return isComplete;
	}

    // --- Click Handling ---
    function handleWrapperClick() {
        if (onClick) {
            onClick();
        }
    }

</script>

<!-- The main wrapper div -->
<div
    class="pictograph-wrapper"
    on:click={handleWrapperClick}
    on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick && onClick()}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined} 
    aria-label="Pictograph container for letter {get(pictographDataStore)?.letter || 'N/A'}"
>
    <!-- The SVG container -->
	<svg
		class="pictograph"
		viewBox="0 0 950 950"
		xmlns="http://www.w3.org/2000/svg"
		role="img"
		aria-label="Pictograph visualization for letter {get(pictographDataStore)?.letter || 'N/A'}"
	>
        <!-- Delegate all SVG content rendering to the child component -->
        <PictographContent
            {pictographDataStore}
            {stage}
            {debug}
            {isDataCompleteForRendering}
            {redProp}
            {blueProp}
            {redArrow}
            {blueArrow}
            {pictographManagers}
            onGridDataReady={handleGridDataReady}
            onPropLoaded={handlePropLoaded}
            onArrowLoaded={handleArrowLoaded}
            onComponentError={handlePictographComponentError}
        />
	</svg>
</div>

<!-- Styles remain the same -->
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

    /* Remove cursor pointer if no onClick is provided */
    .pictograph-wrapper:not([role='button']) {
        cursor: default;
    }

	.pictograph {
		/* ... existing styles ... */
		width: 100%;
		height: 100%;
		max-width: 100%;
		max-height: 100%;
		display: block; /* Use block instead of flex for SVG */
		/* flex: 1; */ /* Not needed for block */
		background-color: white;
		transition: transform 0.1s ease-in-out; /* Smoother transition */
		transform: scale(1);
		z-index: 1;
		position: relative;
		border: 1px solid #ccc; /* Lighter border */
		aspect-ratio: 1 / 1; /* Explicit aspect ratio */
		margin: auto;
		overflow: visible; /* Keep overflow visible */
		transform-origin: center center;
	}

	.pictograph-wrapper[role='button']:hover .pictograph {
		transform: scale(1.05); /* Slightly less dramatic hover */
		z-index: 4;
		border: 2px solid gold; /* Thinner hover border */
        box-shadow: 0 4px 12px rgba(0,0,0,0.2); /* Add subtle shadow on hover */
	}

	.pictograph-wrapper[role='button']:active .pictograph {
		transform: scale(1);
        transition-duration: 0.05s; /* Faster transition on click */
	}

	/* Improved focus state */
	.pictograph-wrapper[role='button']:focus-visible {
		outline: none; /* Remove default outline */
	}
    .pictograph-wrapper[role='button']:focus-visible .pictograph {
        outline: 3px solid #4299e1;
        outline-offset: 2px;
    }
</style>