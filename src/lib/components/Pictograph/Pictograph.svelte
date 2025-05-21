<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { get } from 'svelte/store';
	import { popIn } from '$lib/transitions/popIn';
	import type { PictographData } from '$lib/types/PictographData';
	import { logger } from '$lib/core/logging';
	import type { PropData } from '../objects/Prop/PropData';
	import type { ArrowData } from '../objects/Arrow/ArrowData';
	import type { GridData } from '../objects/Grid/GridData';
	import Grid from '../objects/Grid/Grid.svelte';
	import Prop from '../objects/Prop/Prop.svelte';
	import Arrow from '../objects/Arrow/Arrow.svelte';
	import TKAGlyph from '../objects/Glyphs/TKAGlyph/TKAGlyph.svelte';
	import SvgManager from '../SvgManager/SvgManager';
	import type { Color, MotionType, Orientation, TKATurns } from '$lib/types/Types';
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
	export let animationDuration = 200; // Animation duration for transitions
	export let showLoadingIndicator = true;
	export let beatNumber: number | null = null;
	export let isStartPosition = false;
	export let disableAnimations = false; // Add this prop to disable animations for OptionPicker

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

	// Enhanced loading state tracking
	let glyphLoaded = disableAnimations ? true : false;
	let allComponentsLoaded = disableAnimations ? true : false;
	let showPictograph = disableAnimations ? true : false; // Only show when everything is loaded

	// Define the PictographEvents interface for proper typing
	interface PictographEvents {
		loaded: { error?: boolean };
		error: { message: string; component?: string };
		dataUpdated: { data: PictographData };
	}

	// Event dispatcher with proper typing
	const dispatch = createEventDispatcher<PictographEvents>();

	// Create a wrapper function for dispatch to use in contexts that expect a simpler function signature
	function dispatchWrapper(event: string, detail?: any): void {
		if (event === 'error' && detail?.message) {
			dispatch('error', { message: detail.message, component: detail.component });
		} else if (event === 'loaded') {
			dispatch('loaded', detail || {});
		} else if (event === 'dataUpdated' && detail?.data) {
			dispatch('dataUpdated', { data: detail.data });
		}
	}

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
			dispatchWrapper,
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
			dispatch: dispatchWrapper,
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

	/**
	 * Helper function to detect mobile devices
	 */
	function isMobile(): boolean {
		return (
			typeof window !== 'undefined' &&
			(window.innerWidth <= 768 ||
				/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
		);
	}

	/**
	 * Preload arrow SVGs in parallel for better performance
	 */
	function preloadArrowSvgs() {
		// Use requestAnimationFrame to schedule the preloading for the next frame
		if (typeof window !== 'undefined') {
			requestAnimationFrame(async () => {
				if (!service || !get(pictographDataStore)) return;

				const data = get(pictographDataStore);
				const arrowConfigs: Array<{
					motionType: MotionType;
					startOri: Orientation;
					turns: TKATurns;
					color: Color;
				}> = [];

				// Add red arrow config if exists
				if (data.redArrowData) {
					arrowConfigs.push({
						motionType: data.redArrowData.motionType,
						startOri: data.redArrowData.startOri,
						turns: data.redArrowData.turns,
						color: data.redArrowData.color
					});
				}

				// Add blue arrow config if exists
				if (data.blueArrowData) {
					arrowConfigs.push({
						motionType: data.blueArrowData.motionType,
						startOri: data.blueArrowData.startOri,
						turns: data.blueArrowData.turns,
						color: data.blueArrowData.color
					});
				}

				// Preload SVGs if we have any configs
				if (arrowConfigs.length > 0 && service) {
					try {
						// Create a new SvgManager instance for preloading
						const svgManager = new SvgManager();
						await svgManager.preloadArrowSvgs(arrowConfigs);
					} catch (error) {
						// Silently handle preloading errors
						if (import.meta.env.DEV) {
							console.warn('Arrow SVG preloading error:', error);
						}
					}
				}
			});
		} else {
			// No preloading in SSR environment
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

			// Preload arrow SVGs in parallel
			preloadArrowSvgs();
		} catch (error) {
			handleError('component creation', error);
		}
	}

	// Debounce timer for component loading
	let componentLoadDebounceTimer: number | null = null;
	let pendingComponents = new Set<string>();

	// Optimized wrapper for handleComponentLoadedUtil to maintain local state
	function handleComponentLoaded(component: string) {
		// If animations are disabled (for OptionPicker), use a simpler, faster approach
		if (disableAnimations) {
			// For OptionPicker, we've already set showPictograph to true
			// Just mark the component as loaded immediately without animations or delays
			const context = getLoadingManagerContext();
			handleComponentLoadedUtil(component, context);
			componentsLoaded = context.componentsLoaded;

			// Dispatch loaded event if not already dispatched
			if (!showPictograph) {
				showPictograph = true;
				dispatch('loaded', { error: false });
			}
			return;
		}

		// Normal animation flow for other cases
		// Add component to pending set
		pendingComponents.add(component);

		// Clear existing debounce timer
		if (componentLoadDebounceTimer !== null && typeof window !== 'undefined') {
			window.clearTimeout(componentLoadDebounceTimer);
		}

		// Use requestAnimationFrame to schedule the update for the next frame
		if (typeof window !== 'undefined') {
			// Set a short debounce to batch multiple component loads
			componentLoadDebounceTimer = window.setTimeout(() => {
				// Process all pending components at once
				if (pendingComponents.size > 0) {
					// Create a local context once
					const context = getLoadingManagerContext();

					// Process all pending components
					pendingComponents.forEach((comp) => {
						// Call the utility function
						handleComponentLoadedUtil(comp, context);
					});

					// Update local state once
					componentsLoaded = context.componentsLoaded;

					// Check if loading is complete
					checkLoadingComplete();

					// Clear pending components
					pendingComponents.clear();
				}

				// Clear the timer reference
				componentLoadDebounceTimer = null;
			}, 16); // Use a frame-based timing (roughly 60fps)
		} else {
			// Fallback for SSR
			const context = getLoadingManagerContext();
			handleComponentLoadedUtil(component, context);
			componentsLoaded = context.componentsLoaded;
			checkLoadingComplete();
		}
	}

	// Optimized wrapper for checkLoadingCompleteUtil to maintain local state
	function checkLoadingComplete() {
		// If animations are disabled (for OptionPicker), use a simpler, faster approach
		if (disableAnimations) {
			// For OptionPicker, we've already set showPictograph to true
			// Call the utility function directly without animation frames
			const isComplete = checkLoadingCompleteUtil(getLoadingManagerContext());

			// Update our enhanced loading state
			if (isComplete) {
				allComponentsLoaded = true;

				// Dispatch loaded event if not already dispatched
				if (!showPictograph) {
					showPictograph = true;
					dispatch('loaded', { error: false });
				}
			}
			return;
		}

		// Normal animation flow for other cases
		// Use requestAnimationFrame to schedule the update for the next frame
		if (typeof window !== 'undefined') {
			requestAnimationFrame(() => {
				// Call the utility function
				const isComplete = checkLoadingCompleteUtil(getLoadingManagerContext());

				// Update render count
				renderCount++;

				// Update our enhanced loading state
				if (isComplete) {
					allComponentsLoaded = true;

					// Only show the pictograph when both components and glyph are loaded
					updateShowPictographState();
				}
			});
		} else {
			// Fallback for SSR
			const isComplete = checkLoadingCompleteUtil(getLoadingManagerContext());
			renderCount++;
			if (isComplete) {
				allComponentsLoaded = true;
				updateShowPictographState();
			}
		}
	}

	// Handle glyph loading events
	function handleGlyphLoading() {
		// Just log the event, we don't need to track the loading state
		logger.debug('Pictograph: Glyph loading started');
	}

	function handleGlyphLoaded(event: CustomEvent<boolean>) {
		glyphLoaded = event.detail;
		logger.debug(`Pictograph: Glyph loaded (success: ${event.detail})`);

		// If animations are disabled, we've already set showPictograph to true
		if (disableAnimations) {
			// Dispatch loaded event if not already dispatched
			if (!showPictograph) {
				showPictograph = true;
				dispatch('loaded', { error: false });
			}
			return;
		}

		// Normal flow with animations
		updateShowPictographState();
	}

	// Update the showPictograph state based on all loading conditions
	function updateShowPictographState() {
		// Use requestAnimationFrame to schedule the update for the next frame
		if (typeof window !== 'undefined') {
			requestAnimationFrame(() => {
				showPictograph = allComponentsLoaded && glyphLoaded;

				// If everything is loaded, dispatch the loaded event
				if (showPictograph) {
					dispatch('loaded', { error: false });
				}
			});
		} else {
			// Fallback for SSR
			showPictograph = allComponentsLoaded && glyphLoaded;

			// If everything is loaded, dispatch the loaded event
			if (showPictograph) {
				dispatch('loaded', { error: false });
			}
		}
	}

	// Create component error handler context
	function getComponentErrorContext(): ComponentErrorContext {
		return {
			loadedComponents,
			componentsLoaded,
			totalComponentsToLoad,
			dispatch: dispatchWrapper,
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
			dispatch: dispatchWrapper,
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

			{#if shouldShowMotionComponents(state)}
				<!-- First, load all components but keep them hidden until fully loaded -->
				<g style="visibility: hidden; position: absolute;">
					{#if get(pictographDataStore)?.letter}
						<TKAGlyph
							letter={get(pictographDataStore)?.letter}
							turnsTuple="(s, 0, 0)"
							x={50}
							y={800}
							on:loading={handleGlyphLoading}
							on:loaded={handleGlyphLoaded}
						/>
					{/if}

					{#each [{ color: 'red', propData: redPropData, arrowData: redArrowData }, { color: 'blue', propData: bluePropData, arrowData: blueArrowData }] as { color, propData, arrowData } (color)}
						{#if propData}
							<Prop
								{propData}
								loaded={() => handleComponentLoaded(`${color}Prop`)}
								error={(e) => handleComponentError(`${color}Prop`, e.message)}
							/>
						{/if}

						{#if arrowData}
							<!-- Use a keyed each block to force component recreation when turns change -->
							<!-- Use a more efficient key that doesn't include renderCount to reduce unnecessary reloads -->
							{#each [`${arrowData.id}-${arrowData.turns}-${arrowData.propRotDir}`] as key (key)}
								<Arrow
									{arrowData}
									loadTimeoutMs={isMobile() ? 2000 : 1000}
									pictographService={service}
									loaded={() => handleComponentLoaded(`${color}Arrow`)}
									error={(e) => handleComponentError(`${color}Arrow`, e.message)}
								/>
							{/each}
						{/if}
					{/each}
				</g>

				<!-- Only show the visible components when everything is loaded -->
				{#if showPictograph}
					<!-- For OptionPicker, skip animation completely -->
					{#if disableAnimations}
						<g style="transform-origin: center center;">
							{#if get(pictographDataStore)?.letter}
								<TKAGlyph
									letter={get(pictographDataStore)?.letter}
									turnsTuple="(s, 0, 0)"
									x={50}
									y={800}
								/>
							{/if}

							{#each [{ color: 'red', propData: redPropData, arrowData: redArrowData }, { color: 'blue', propData: bluePropData, arrowData: blueArrowData }] as { color, propData, arrowData } (color)}
								{#if propData}
									<Prop {propData} animationDuration={0} />
								{/if}

								{#if arrowData}
									<!-- Use a keyed each block to force component recreation when turns change -->
									<!-- Use a more efficient key that doesn't include renderCount to reduce unnecessary reloads -->
									{#each [`${arrowData.id}-${arrowData.turns}-${arrowData.propRotDir}`] as key (key)}
										<Arrow
											{arrowData}
											loadTimeoutMs={10}
											pictographService={service}
											loaded={() => {}}
											error={() => {}}
										/>
									{/each}
								{/if}
							{/each}
						</g>
						<!-- For normal use, apply animation -->
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
								/>
							{/if}

							{#each [{ color: 'red', propData: redPropData, arrowData: redArrowData }, { color: 'blue', propData: bluePropData, arrowData: blueArrowData }] as { color, propData, arrowData } (color)}
								{#if propData}
									<Prop {propData} {animationDuration} />
								{/if}

								{#if arrowData}
									<!-- Use a keyed each block to force component recreation when turns change -->
									<!-- Use a more efficient key that doesn't include renderCount to reduce unnecessary reloads -->
									{#each [`${arrowData.id}-${arrowData.turns}-${arrowData.propRotDir}`] as key (key)}
										<Arrow
											{arrowData}
											loadTimeoutMs={isMobile() ? 2000 : 1000}
											pictographService={service}
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
