<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher, tick } from 'svelte';
	import { get, writable, type Writable, derived } from 'svelte/store';

	import type { PictographData } from '$lib/types/PictographData.js';
	import type { PropData } from '../objects/Prop/PropData';
	import type { ArrowData } from '../objects/Arrow/ArrowData';
	import type { GridData } from '../objects/Grid/GridData';
	import {
		type RenderStage,
		type ComponentLoadingStatus,
		type ComponentPositioningStatus
	} from './constants/trackingConstants';

	import PictographContent from './PictographContent.svelte';

	import { PictographInitializer } from './PictographInitializer';
	import { PictographManagers } from './PictographManagers';
	import type { PictographElementStores } from './PictographElements';

	import { PictographLifecycleService } from './services/PictographLifecycleService';
	import { PictographValidationService } from './services/PictographValidationService';
	import { PictographPositioningService } from './services/PictographPositioningService';
	import { PictographComponentStatusService } from './services/PictographComponentStatusService';

	export let pictographDataStore: Writable<PictographData>;
	export let onClick: (() => void) | undefined = undefined;
	export let debug: boolean = false;

	const dispatch = createEventDispatcher<{
		loaded: {
			incompleteData?: boolean;
			timedOut?: boolean;
			error?: boolean;
			message?: string;
			[key: string]: any;
		};
		error: { source: string; error?: any; message?: string };
	}>();

	let stage: RenderStage = 'initializing';
	let initializationAttempted = false;
	let initializationSucceeded = false;

	let initializer: PictographInitializer | null = null;
	let elementStores: Writable<PictographElementStores> | null = null;
	let pictographManagers: PictographManagers | null = null;

	const lifecycleService = new PictographLifecycleService(
		pictographDataStore,
		(newStage) => {
			stage = newStage;
		},
		(eventData) => dispatch('loaded', eventData),
		(eventData) => dispatch('error', eventData),
		debug
	);

	const validationService = new PictographValidationService(pictographDataStore, debug);

	const positioningService = new PictographPositioningService(debug);

	const componentStatusService = new PictographComponentStatusService(
		() => stage,
		(newStage) => {
			stage = newStage;
		},
		() => {
			void triggerPositioning();
		},
		() => {
			dispatch('loaded', { completed: true });
		},
		debug
	);

	let redPropStore = writable<PropData | null>(null);
	let bluePropStore = writable<PropData | null>(null);
	let redArrowStore = writable<ArrowData | null>(null);
	let blueArrowStore = writable<ArrowData | null>(null);

	$: redProp = $redPropStore;
	$: blueProp = $bluePropStore;
	$: redArrow = $redArrowStore;
	$: blueArrow = $blueArrowStore;

	onMount(() => {
		if (debug)
			console.log(`🚀 [${get(pictographDataStore)?.letter || 'NoLetter'}] Pictograph Mounted`);

		lifecycleService.startInitialization(initializeCoreComponents);

		return () => {
			if (debug)
				console.log(`🧹 [${get(pictographDataStore)?.letter || 'NoLetter'}] Pictograph Destroyed`);
			lifecycleService.cleanup();
		};
	});

	async function initializeCoreComponents(): Promise<void> {
		if (initializationAttempted) {
			if (debug) console.log('ℹ️ Initialization already attempted, skipping.');
			return;
		}
		initializationAttempted = true;
		if (debug)
			console.log(
				`🛠️ [${get(pictographDataStore)?.letter || 'NoLetter'}] Initializing Core Components...`
			);

		try {
			initializer = new PictographInitializer(pictographDataStore);
			elementStores = initializer.elements;

			redPropStore = get(elementStores).redPropData;
			bluePropStore = get(elementStores).bluePropData;
			redArrowStore = get(elementStores).redArrowData;
			blueArrowStore = get(elementStores).blueArrowData;

			await initializer.initialize();

			if (initializer.hasIncompleteData) {
				lifecycleService.handleIncompleteData();
				initializationSucceeded = false;
				return;
			} else {
				lifecycleService.handleInitializationSuccess();
				initializationSucceeded = true;
			}

			pictographManagers = new PictographManagers(pictographDataStore);
			await pictographManagers.initializePlacementManagers();
			if (debug)
				console.log(`✅ [${get(pictographDataStore)?.letter || 'NoLetter'}] Managers Initialized`);
		} catch (error) {
			console.error(
				`❌ [${get(pictographDataStore)?.letter || 'NoLetter'}] Core Component Initialization Failed:`,
				error
			);
			initializationSucceeded = false;
			dispatch('error', { source: 'core_initialization', error });
			stage = 'complete';
			dispatch('loaded', { error: true, message: 'Core initialization failed' });
		}
	}

	function handleGridDataReady(gridData: GridData) {
		if (debug)
			console.log(
				`🔌 [${get(pictographDataStore)?.letter || 'NoLetter'}] Grid Ready Event Received`
			);
		componentStatusService.updateComponentStatus('grid', 'loading', true);
		lifecycleService.handleGridDataReady(gridData, initializeCoreComponents);
	}

	function handlePropLoaded(color: 'red' | 'blue') {
		const key = `${color}Prop` as keyof ComponentLoadingStatus;
		if (debug)
			console.log(`🎨 [${get(pictographDataStore)?.letter || 'NoLetter'}] Prop Loaded: ${color}`);
		componentStatusService.updateComponentStatus(key, 'loading', true);
	}

	function handleArrowLoaded(color: 'red' | 'blue') {
		const key = `${color}Arrow` as keyof ComponentLoadingStatus;
		if (debug)
			console.log(`→ [${get(pictographDataStore)?.letter || 'NoLetter'}] Arrow Loaded: ${color}`);
		componentStatusService.updateComponentStatus(key, 'loading', true);
	}

	function handlePictographComponentError(componentKey: keyof ComponentLoadingStatus, error?: any) {
		console.error(
			`🔥 [${get(pictographDataStore)?.letter || 'NoLetter'}] Component Error: ${componentKey}`,
			error
		);
		componentStatusService.reportComponentError(componentKey, error);
		dispatch('error', { source: `component_${componentKey}`, error });
	}

	async function triggerPositioning() {
		if (!initializationSucceeded) {
			if (debug)
				console.warn(
					`🚫 [${get(pictographDataStore)?.letter || 'NoLetter'}] Skipping positioning: Initializatio n did not succeed or was incomplete.`
				);
			stage = 'complete';
			dispatch('loaded', { positioningSkipped: true });
			return;
		}
		if (debug)
			console.log(
				`📐 [${get(pictographDataStore)?.letter || 'NoLetter'}] Triggering Positioning...`
			);

		const updateStatusCallback = (
			component: keyof ComponentPositioningStatus,
			isComplete: boolean
		) => {
			componentStatusService.updateComponentStatus(component, 'positioning', isComplete);
		};

		try {
			const positionedProps = await positioningService.updatePlacements(
				pictographManagers,
				redProp,
				blueProp,
				redArrow,
				blueArrow,
				updateStatusCallback,
				(arrow) => validationService.validateArrowDataForPositioning(arrow),
				isDataCompleteForRendering,
				(newStage) => {
					stage = newStage;
				},
				(data) => dispatch('loaded', data)
			);

			if (positionedProps.redProp) $redPropStore = positionedProps.redProp;
			if (positionedProps.blueProp) $bluePropStore = positionedProps.blueProp;

			if (debug)
				console.log(
					`✅ [${get(pictographDataStore)?.letter || 'NoLetter'}] Positioning process completed.`
				);
		} catch (error) {
			console.error(
				`❌ [${get(pictographDataStore)?.letter || 'NoLetter'}] Error during triggerPositioning:`,
				error
			);
			dispatch('error', { source: 'positioning_orchestration', error });
			stage = 'complete';
			dispatch('loaded', { error: true, message: 'Positioning failed' });
		}
	}

	function isDataCompleteForRendering(): boolean {
		const isComplete = validationService.isDataCompleteForRendering(
			redProp,
			blueProp,
			redArrow,
			blueArrow,
			stage,
			initializationAttempted
		);
		return isComplete;
	}

	function handleWrapperClick() {
		if (onClick) {
			onClick();
		}
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
