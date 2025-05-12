<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { get } from 'svelte/store';
	import type { PictographData } from '$lib/types/PictographData';
	import type { PropData } from '../objects/Prop/PropData';
	import type { ArrowData } from '../objects/Arrow/ArrowData';
	import type { GridData } from '../objects/Grid/GridData';
	import type { MotionData } from '../objects/Motion/MotionData';
	import Grid from '../objects/Grid/Grid.svelte';
	import Prop from '../objects/Prop/Prop.svelte';
	import Arrow from '../objects/Arrow/Arrow.svelte';
	import TKAGlyph from '../objects/Glyphs/TKAGlyph/TKAGlyph.svelte';
	import { PictographService } from './PictographService';
	import PictographError from './components/PictographError.svelte';
	import PictographDebug from './components/PictographDebug.svelte';
	import InitializingSpinner from './components/InitializingSpinner.svelte';
	import LoadingProgress from './components/LoadingProgress.svelte';
	import BeatLabel from './components/BeatLabel.svelte';
	import PictographWrapper from './components/PictographWrapper.svelte';
	import PictographSVG from './components/PictographSVG.svelte';
	// Import utility functions
	import { defaultPictographData } from './utils/defaultPictographData';
	import type { PictographDataSnapshot } from './utils/dataComparison';
	import {
		handlePictographError,
		handlePictographComponentError,
		type ErrorHandlerContext,
		type ComponentErrorContext,
		type FallbackDataContext
	} from './handlers/PictographErrorHandler';
	import { createAndPositionComponents as createAndPositionComponentsUtil } from './utils/componentPositioning';
	import {
		shouldShowBeatLabel,
		shouldShowDebugInfo,
		shouldShowLoadingIndicator,
		shouldShowMotionComponents
	} from './utils/PictographRenderUtils';
	import {
		handleGridLoaded as handleGridLoadedUtil,
		handleComponentLoaded as handleComponentLoadedUtil,
		checkLoadingComplete as checkLoadingCompleteUtil,
		hasRequiredMotionData as hasRequiredMotionDataUtil,
		type LoadingManagerContext
	} from './managers/PictographLoadingManager';

	// Import state management functions
	import {
		createPictographDataStore,
		initializePictographService,
		checkForDataChanges as checkForDataChangesUtil,
		updateComponentsFromData as updateComponentsFromDataUtil,
		setupPictographDataSubscription
	} from './managers/PictographStateManager';

	// Import lifecycle management functions
	import {
		initializePictograph,
		createCleanupFunction,
		createInitializationContext
	} from './managers/PictographLifecycle';

	// Props
	export let pictographData: PictographData | undefined = undefined;
	export let onClick: (() => void) | undefined = undefined;
	export let debug = false;
	export let animationDuration = 300;
	export let showLoadingIndicator = true;
	export let beatNumber: number | null = null;
	export let isStartPosition = false;

	// Create a local pictograph data store
	const pictographDataStore = createPictographDataStore(pictographData);

	// Reactively update the pictographDataStore when the pictographData changes.
	// Since pictographData is already a new object when the beat itself is updated
	// (due to the mapping in BeatFrameState), a direct assignment is sufficient and safer
	// than JSON.parse(JSON.stringify()), which can corrupt complex data.
	$: if (pictographData) {
		pictographDataStore.set(pictographData);
	}

	// Component state
	let state = 'initializing';
	let errorMessage: string | null = null;
	let gridData: GridData | null = null;
	let redPropData: PropData | null = null;
	let bluePropData: PropData | null = null;
	let redArrowData: ArrowData | null = null;
	let blueArrowData: ArrowData | null = null;
	let loadedComponents = new Set<string>();
	let requiredComponents = ['grid'];
	let totalComponentsToLoad = 1;
	let componentsLoaded = 0;
	let renderCount = 0;
	let loadProgress = 0;
	let service: PictographService | null = null;
	let lastDataSnapshot: PictographDataSnapshot | null = null;

	// Event dispatcher
	// @ts-ignore - Ignoring deprecated warning
	const dispatch = createEventDispatcher();

	onMount(() => {
		// Make sure we have data to work with
		if (!pictographData && !get(pictographDataStore)) {
			// If no data is available, use default data
			pictographDataStore.set(defaultPictographData);
			return;
		}

		// Create a writable store for the service
		const serviceStore = {
			set: (value: PictographService | null) => {
				service = value;
			},
			update: (updater: (value: PictographService | null) => PictographService | null) => {
				service = updater(service);
			},
			subscribe: () => {
				return () => {};
			}
		};

		// Create a writable store for the state
		const stateStore = {
			set: (value: string) => {
				state = value;
			},
			update: (updater: (value: string) => string) => {
				state = updater(state);
			},
			subscribe: () => {
				return () => {};
			}
		};

		// Create a writable store for the lastDataSnapshot
		const lastDataSnapshotStore = {
			set: (value: PictographDataSnapshot | null) => {
				lastDataSnapshot = value;
			},
			update: (
				updater: (value: PictographDataSnapshot | null) => PictographDataSnapshot | null
			) => {
				lastDataSnapshot = updater(lastDataSnapshot);
			},
			subscribe: () => {
				return () => {};
			}
		};

		// Create initialization context
		const context = createInitializationContext(
			pictographDataStore,
			serviceStore,
			stateStore,
			lastDataSnapshotStore,
			initializePictographService,
			handleError
		);

		// Initialize the pictograph
		initializePictograph(context, debug);

		// Return cleanup function
		return createCleanupFunction(loadedComponents, subscription.unsubscribe);
	});

	// Create subscription for the pictographDataStore
	let subscription = { unsubscribe: () => {} };

	// Initialize subscription in onMount to ensure proper order
	onMount(() => {
		// Set up subscription to the pictographDataStore
		subscription = setupPictographDataSubscription(
			pictographDataStore,
			service,
			lastDataSnapshot,
			updateComponentsFromData,
			dispatch,
			debug,
			checkForDataChangesUtil
		);
	});

	// Function to update components when pictographData changes
	function updateComponentsFromData() {
		try {
			const result = updateComponentsFromDataUtil(
				pictographDataStore,
				service,
				state,
				errorMessage,
				gridData,
				createAndPositionComponents,
				requiredComponents,
				loadedComponents,
				hasRequiredMotionDataUtil
			);

			// Update local state
			state = result.state;
			errorMessage = result.errorMessage;
			if (result.renderCount > 0) {
				renderCount += result.renderCount;
			}
		} catch (error) {
			handleError('data update', error);
		}
	}

	// Create loading manager context
	function getLoadingManagerContext(): LoadingManagerContext {
		return {
			state: {
				set: (value: string) => {
					state = value;
				}
			},
			loadedComponents,
			requiredComponents,
			componentsLoaded,
			totalComponentsToLoad,
			dispatch,
			pictographData: get(pictographDataStore)
		};
	}

	// Wrapper for handleGridLoadedUtil to maintain local state
	function handleGridLoaded(data: GridData) {
		try {
			// Update local state
			gridData = data;

			// Call the utility function
			handleGridLoadedUtil(data, getLoadingManagerContext(), {
				createAndPositionComponents
			});
		} catch (error) {
			handleError('grid loading', error);
		}
	}

	// Wrapper for createAndPositionComponentsUtil to maintain local state
	function createAndPositionComponents() {
		try {
			// Make sure we have data to work with
			if (!get(pictographDataStore) || !service) return;

			// Create state context
			const stateContext = {
				requiredComponents,
				totalComponentsToLoad
			};

			// Call the utility function
			const result = createAndPositionComponentsUtil(
				get(pictographDataStore),
				service,
				gridData,
				stateContext
			);

			// Update local state
			requiredComponents = stateContext.requiredComponents;
			totalComponentsToLoad = stateContext.totalComponentsToLoad;
			redPropData = result.redPropData;
			bluePropData = result.bluePropData;
			redArrowData = result.redArrowData;
			blueArrowData = result.blueArrowData;
		} catch (error) {
			handleError('component creation', error);
		}
	}

	// Wrapper for handleComponentLoadedUtil to maintain local state
	function handleComponentLoaded(component: string) {
		// Call the utility function
		handleComponentLoadedUtil(component, getLoadingManagerContext());

		// Update local state
		componentsLoaded = getLoadingManagerContext().componentsLoaded;

		// Check if loading is complete
		checkLoadingComplete();
	}

	// Wrapper for checkLoadingCompleteUtil to maintain local state
	function checkLoadingComplete() {
		// Call the utility function
		checkLoadingCompleteUtil(getLoadingManagerContext());

		// Update render count
		renderCount++;
	}

	// Create component error handler context
	function getComponentErrorContext(): ComponentErrorContext {
		return {
			loadedComponents,
			componentsLoaded,
			totalComponentsToLoad,
			dispatch,
			checkLoadingComplete
		};
	}

	// Create fallback data context
	function getFallbackDataContext(): FallbackDataContext {
		return {
			redPropData,
			bluePropData,
			redArrowData,
			blueArrowData
		};
	}

	// Handle component errors
	function handleComponentError(component: string, error: any) {
		handlePictographComponentError(
			component,
			error,
			getComponentErrorContext(),
			getFallbackDataContext()
		);
	}

	// Create error handler context
	function getErrorHandlerContext(): ErrorHandlerContext {
		return {
			pictographDataStore,
			dispatch,
			state: {
				set: (value: string) => {
					state = value;
				}
			},
			errorMessage: {
				set: (value: string | null) => {
					errorMessage = value;
				}
			},
			componentsLoaded,
			totalComponentsToLoad
		};
	}

	// Handle general errors
	function handleError(source: string, error: any) {
		handlePictographError(source, error, getErrorHandlerContext());
	}

	// Using imported utility functions
</script>

<PictographWrapper {pictographDataStore} {onClick} {state}>
	<PictographSVG {pictographDataStore} {state} {errorMessage}>
		{#if state === 'initializing'}
			{#if shouldShowLoadingIndicator(state, showLoadingIndicator)}
				<InitializingSpinner {animationDuration} />
			{/if}
		{:else if state === 'error'}
			<PictographError {errorMessage} {animationDuration} />
		{:else}
			<Grid
				gridMode={get(pictographDataStore)?.gridMode}
				onPointsReady={handleGridLoaded}
				on:error={(e) => handleComponentError('grid', e.detail.message)}
				{debug}
			/>

			{#if shouldShowBeatLabel(beatNumber, isStartPosition)}
				<BeatLabel
					text={isStartPosition ? 'Start' : beatNumber?.toString() || ''}
					position="top-left"
					{animationDuration}
				/>
			{/if}

			{#if shouldShowMotionComponents(state)}
				{#if get(pictographDataStore)?.letter}
					<g transition:fade={{ duration: animationDuration, delay: 100 }}>
						<TKAGlyph
							letter={get(pictographDataStore)?.letter}
							turnsTuple="(s, 0, 0)"
							x={50}
							y={800}
						/>
					</g>
				{/if}

				{#each [{ color: 'red', propData: redPropData, arrowData: redArrowData, delay: 150 }, { color: 'blue', propData: bluePropData, arrowData: blueArrowData, delay: 200 }] as { color, propData, arrowData, delay }}
					{#if propData}
						<g
							transition:fade={{ duration: animationDuration, delay }}
							style="transform-origin: center center;"
						>
							<Prop
								{propData}
								on:loaded={() => handleComponentLoaded(`${color}Prop`)}
								on:error={(e) => handleComponentError(`${color}Prop`, e.detail.message)}
							/>
						</g>
					{/if}

					{#if arrowData}
						<g
							transition:fade={{ duration: animationDuration, delay }}
							style="transform-origin: center center;"
						>
							<Arrow
								{arrowData}
								on:loaded={() => handleComponentLoaded(`${color}Arrow`)}
								on:error={(e) => handleComponentError(`${color}Arrow`, e.detail.message)}
							/>
						</g>
					{/if}
				{/each}
			{/if}
		{/if}
	</PictographSVG>

	{#if state === 'loading' && shouldShowLoadingIndicator(state, showLoadingIndicator)}
		<LoadingProgress {loadProgress} showText={true} />
	{/if}

	{#if shouldShowDebugInfo(debug)}
		<PictographDebug
			{state}
			{componentsLoaded}
			totalComponents={totalComponentsToLoad}
			{renderCount}
		/>
	{/if}
</PictographWrapper>
