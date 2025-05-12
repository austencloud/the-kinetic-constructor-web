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
	import { logger } from '$lib/core/logging';
	// Import utility functions
	import { defaultPictographData } from './utils/defaultPictographData';
	import { createDataSnapshot, type PictographDataSnapshot } from './utils/dataComparison';
	import {
		handlePictographError,
		handlePictographComponentError,
		type ErrorHandlerContext,
		type ComponentErrorContext,
		type FallbackDataContext
	} from './handlers/PictographErrorHandler';
	import {
		createAndPositionComponents as createAndPositionComponentsUtil,
		getPictographAriaLabel
	} from './utils/componentPositioning';
	import {
		getPictographElement,
		getPictographRole,
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
		const startTime = performance.now();

		try {
			// Make sure we have data to work with
			if (!pictographData && !get(pictographDataStore)) {
				// If no data is available, use default data
				pictographDataStore.set(defaultPictographData);
				return;
			}

			// Log component initialization
			logger.info('Pictograph component initializing', {
				data: {
					debug,
					hasMotionData: hasRequiredMotionDataUtil(get(pictographDataStore)),
					letter: get(pictographDataStore)?.letter,
					gridMode: get(pictographDataStore)?.gridMode
				}
			});

			service = initializePictographService(pictographDataStore);

			// Initialize data snapshot
			lastDataSnapshot = createDataSnapshot(get(pictographDataStore));

			if (hasRequiredMotionDataUtil(get(pictographDataStore))) {
				state = 'loading';
				logger.debug('Pictograph: Motion data available, entering loading state', {
					data: {
						redMotionData: get(pictographDataStore)?.redMotionData ? true : false,
						blueMotionData: get(pictographDataStore)?.blueMotionData ? true : false
					}
				});
			} else {
				state = 'grid_only';
				logger.debug('Pictograph: No motion data, entering grid-only state');
			}

			const initTime = performance.now() - startTime;
			logger.info(`Pictograph initialized in ${initTime.toFixed(2)}ms`, {
				duration: initTime,
				data: {
					state,
					letter: get(pictographDataStore)?.letter,
					gridMode: get(pictographDataStore)?.gridMode
				}
			});
		} catch (error) {
			handleError('initialization', error);
		}

		return () => {
			loadedComponents.clear();
			subscription.unsubscribe();
			logger.debug('Pictograph component unmounting');
		};
	});

	// Subscribe to the pictographDataStore to update components when it changes
	const subscription = setupPictographDataSubscription(
		pictographDataStore,
		service,
		lastDataSnapshot,
		updateComponentsFromData,
		dispatch,
		debug,
		checkForDataChangesUtil
	);

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

{#if false}
	<!-- Svelte 5 implementation removed -->
{:else}
	<!-- Use a button if onClick is provided, otherwise use a div -->
	<svelte:element
		this={getPictographElement(onClick)}
		class="pictograph-wrapper"
		on:click={onClick ? () => onClick() : undefined}
		aria-label={onClick
			? `Pictograph for letter ${get(pictographDataStore)?.letter || 'unknown'}`
			: undefined}
		role={getPictographRole(onClick)}
		data-state={state}
		data-letter={get(pictographDataStore)?.letter || 'none'}
		{...onClick ? { type: 'button' } : {}}
	>
		<svg
			class="pictograph"
			viewBox="0 0 950 950"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label={getPictographAriaLabel(state, errorMessage, get(pictographDataStore))}
		>
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
		</svg>

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
	</svelte:element>
{/if}

<style>
	.pictograph-wrapper {
		width: 100%;
		height: 100%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		aspect-ratio: 1;
	}

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
		aspect-ratio: 1;
		margin: auto;
		overflow: visible;
		transform-origin: center center;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pictograph-wrapper:hover .pictograph {
		transform: scale(1.05);
		z-index: 4;
		border: 4px solid #48bb78;
		box-shadow:
			0 0 0 2px rgba(72, 187, 120, 0.4),
			0 4px 12px rgba(0, 0, 0, 0.2);
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

	.pictograph-wrapper[data-state='error'] .pictograph {
		border-color: #fc8181;
		box-shadow: 0 0 0 1px #fc8181;
	}
</style>
