<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { writable, get } from 'svelte/store';
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
	import { errorService, ErrorSeverity } from '../../services/ErrorHandlingService';
	import { logger } from '$lib/core/logging';
	// Import both legacy and modern implementations
	import { defaultPictographData } from './utils/defaultPictographData';
	import PictographSvelte5 from './PictographSvelte5.svelte';

	// Feature flag for using new state management
	export let useNewStateManagement = false;

	// Props
	export let pictographData: PictographData | undefined = undefined;
	export let onClick: (() => void) | undefined = undefined;
	export let debug = false;
	export let animationDuration = 300;
	export let showLoadingIndicator = true;
	export let beatNumber: number | null = null;
	export let isStartPosition = false;

	// Create a local pictograph data store
	const pictographDataStore = writable(pictographData || defaultPictographData);

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
	let lastDataSnapshot: any = null;

	// Event dispatcher
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
					hasMotionData: hasRequiredMotionData(get(pictographDataStore)),
					letter: get(pictographDataStore)?.letter,
					gridMode: get(pictographDataStore)?.gridMode
				}
			});

			service = new PictographService(get(pictographDataStore));

			// Initialize data snapshot
			updateLastKnownValues(get(pictographDataStore));

			if (hasRequiredMotionData(get(pictographDataStore))) {
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
			logger.debug('Pictograph component unmounting');
		};
	});

	// Subscribe to the pictographDataStore to update components when it changes
	pictographDataStore.subscribe((data) => {
		if (data && service) {
			// Use a safe comparison method that avoids circular references
			const hasChanged = checkForDataChanges(data);

			// Only process if there's a real change and service is initialized
			if (hasChanged) {
				if (debug) console.debug('Pictograph data changed, updating components');

				// Update the service with new data
				service.updateData(data);

				// Update local state
				updateComponentsFromData();

				// Notify parent about the update
				dispatch('dataUpdated', { type: 'all' });
			}
		}
	});

	// Safe comparison function that avoids circular references
	function checkForDataChanges(newData: PictographData): boolean {
		// If this is the first time, always return true
		if (!lastDataSnapshot) {
			// Update last known values for safe comparison next time
			updateLastKnownValues(newData);
			return true;
		}

		try {
			// Compare important fields directly - add any fields that should trigger a rerender
			const fieldsChanged =
				lastDataSnapshot.letter !== newData.letter ||
				lastDataSnapshot.gridMode !== newData.gridMode ||
				lastDataSnapshot.startPos !== newData.startPos ||
				lastDataSnapshot.endPos !== newData.endPos ||
				lastDataSnapshot.direction !== newData.direction ||
				compareMotionData('red') ||
				compareMotionData('blue');

			// Update last known values if changed
			if (fieldsChanged) {
				updateLastKnownValues(newData);
			}

			return fieldsChanged;
		} catch (error) {
			console.warn('Error comparing pictograph data:', error);
			return true; // Assume changed on error to be safe
		}

		// Helper function to compare motion data
		function compareMotionData(color: 'red' | 'blue'): boolean {
			const key = color === 'red' ? 'redMotionData' : 'blueMotionData';
			const oldMotion = lastDataSnapshot[key as keyof typeof lastDataSnapshot] as MotionData | null;
			const newMotion = newData[key as keyof typeof newData] as MotionData | null;

			// If both null/undefined or same reference, no change
			if (oldMotion === newMotion) return false;

			// If one exists and the other doesn't, changed
			if ((!oldMotion && newMotion) || (oldMotion && !newMotion)) return true;

			// Compare critical motion properties
			if (oldMotion && newMotion) {
				return (
					oldMotion.id !== newMotion.id ||
					oldMotion.startLoc !== newMotion.startLoc ||
					oldMotion.endLoc !== newMotion.endLoc ||
					oldMotion.startOri !== newMotion.startOri ||
					oldMotion.endOri !== newMotion.endOri ||
					oldMotion.motionType !== newMotion.motionType
				);
			}

			return false;
		}
	}

	function updateLastKnownValues(data: PictographData): void {
		lastDataSnapshot = {
			letter: data.letter,
			gridMode: data.gridMode,
			startPos: data.startPos,
			endPos: data.endPos,
			direction: data.direction,
			redMotionData: data.redMotionData
				? {
						id: data.redMotionData.id,
						startLoc: data.redMotionData.startLoc,
						endLoc: data.redMotionData.endLoc,
						startOri: data.redMotionData.startOri,
						endOri: data.redMotionData.endOri,
						motionType: data.redMotionData.motionType
					}
				: null,
			blueMotionData: data.blueMotionData
				? {
						id: data.blueMotionData.id,
						startLoc: data.blueMotionData.startLoc,
						endLoc: data.blueMotionData.endLoc,
						startOri: data.blueMotionData.startOri,
						endOri: data.blueMotionData.endOri,
						motionType: data.blueMotionData.motionType
					}
				: null
		};
	}

	// Function to update components when pictographData changes
	function updateComponentsFromData() {
		try {
			// Reset state if needed
			if (state === 'error') {
				state = 'loading';
				errorMessage = null;
			}

			// Make sure we have data to work with
			if (!get(pictographDataStore)) {
				state = 'grid_only';
				return;
			}

			// Update state based on available motion data
			if (hasRequiredMotionData(get(pictographDataStore))) {
				if (state === 'grid_only') state = 'loading';
			} else {
				state = 'grid_only';
			}

			// Only recreate components if grid data is available
			if (gridData) {
				// Create and position components
				createAndPositionComponents();

				// Update rendering count
				renderCount++;

				// If all required components were already loaded previously,
				// mark as complete immediately
				if (requiredComponents.every((comp) => loadedComponents.has(comp))) {
					state = 'complete';
				}
			}
		} catch (error) {
			handleError('data update', error);
		}
	}

	function handleGridLoaded(data: GridData) {
		try {
			// Update state
			gridData = data;
			componentsLoaded++;
			loadedComponents.add('grid');

			// Exit if grid-only mode
			if (state === 'grid_only') {
				dispatch('loaded', { complete: false });
				return;
			}

			// Continue loading
			createAndPositionComponents();
		} catch (error) {
			handleError('grid loading', error);
		}
	}

	function createAndPositionComponents() {
		try {
			// Initialize required components
			requiredComponents = ['grid'];

			// Don't reset total components to load since we may already have loaded some
			if (state !== 'complete') totalComponentsToLoad = 1;

			// Make sure we have data to work with
			if (!get(pictographDataStore) || !service) return;

			// Create red components if needed
			if (get(pictographDataStore).redMotionData) {
				const redMotionData = get(pictographDataStore).redMotionData as MotionData;
				redPropData = service.createPropData(redMotionData, 'red');
				redArrowData = service.createArrowData(redMotionData, 'red');

				if (!requiredComponents.includes('redProp')) {
					requiredComponents.push('redProp', 'redArrow');
					if (state !== 'complete') totalComponentsToLoad += 2;
				}
			} else {
				// Clear red components if no longer needed
				redPropData = null;
				redArrowData = null;
			}

			// Create blue components if needed
			if (get(pictographDataStore).blueMotionData) {
				const blueMotionData = get(pictographDataStore).blueMotionData as MotionData;
				bluePropData = service.createPropData(blueMotionData, 'blue');
				blueArrowData = service.createArrowData(blueMotionData, 'blue');

				if (!requiredComponents.includes('blueProp')) {
					requiredComponents.push('blueProp', 'blueArrow');
					if (state !== 'complete') totalComponentsToLoad += 2;
				}
			} else {
				// Clear blue components if no longer needed
				bluePropData = null;
				blueArrowData = null;
			}

			// Position components if grid data is available
			if (gridData) {
				service.positionComponents(
					redPropData,
					bluePropData,
					redArrowData,
					blueArrowData,
					gridData
				);
			}
		} catch (error) {
			handleError('component creation', error);
		}
	}

	function handleComponentLoaded(component: string) {
		loadedComponents.add(component);
		componentsLoaded++;
		dispatch('componentLoaded', { componentName: component });
		checkLoadingComplete();
	}

	function checkLoadingComplete() {
		const startCheck = performance.now();
		const allLoaded = requiredComponents.every((component) => loadedComponents.has(component));

		if (allLoaded) {
			state = 'complete';
			renderCount++;

			const loadTime = performance.now() - startCheck;
			logger.info(`Pictograph fully loaded`, {
				duration: loadTime,
				data: {
					componentsLoaded,
					totalComponentsToLoad,
					renderCount,
					letter: get(pictographDataStore)?.letter,
					gridMode: get(pictographDataStore)?.gridMode,
					loadedComponents: Array.from(loadedComponents)
				}
			});

			dispatch('loaded', { complete: true });
		}
	}

	function handleComponentError(component: string, error: any) {
		logger.warn(`Component error (${component})`, {
			error: error instanceof Error ? error : new Error(String(error)),
			data: {
				component,
				letter: get(pictographDataStore)?.letter,
				gridMode: get(pictographDataStore)?.gridMode,
				applyingFallback: true
			}
		});

		applyFallbackPositioning(component);

		loadedComponents.add(component);
		componentsLoaded++;

		logger.debug(`Applied fallback positioning for ${component}`, {
			data: {
				component,
				loadedComponents: Array.from(loadedComponents),
				componentsLoaded,
				totalComponentsToLoad
			}
		});

		checkLoadingComplete();
	}

	function applyFallbackPositioning(component: string) {
		const centerX = 475;
		const centerY = 475;
		const offset = 50;

		switch (component) {
			case 'redProp':
				if (redPropData) {
					redPropData.coords = { x: centerX - offset, y: centerY };
					redPropData.rotAngle = 0;
				}
				break;
			case 'blueProp':
				if (bluePropData) {
					bluePropData.coords = { x: centerX + offset, y: centerY };
					bluePropData.rotAngle = 0;
				}
				break;
			case 'redArrow':
				if (redArrowData) {
					redArrowData.coords = { x: centerX, y: centerY - offset };
					redArrowData.rotAngle = -90;
				}
				break;
			case 'blueArrow':
				if (blueArrowData) {
					blueArrowData.coords = { x: centerX, y: centerY + offset };
					blueArrowData.rotAngle = 90;
				}
				break;
			default:
				console.warn(`Unknown component: ${component}, using center position`);
		}
	}

	function handleError(source: string, error: any) {
		try {
			// Create a safe error message that won't have circular references
			const errorMsg =
				error instanceof Error
					? error.message
					: typeof error === 'string'
						? error
						: 'Unknown error';

			// Log using the new structured logging system
			logger.pictograph(`Error in ${source}`, {
				letter: get(pictographDataStore)?.letter
					? String(get(pictographDataStore)?.letter)
					: undefined,
				gridMode: get(pictographDataStore)?.gridMode,
				componentState: state,
				renderMetrics: {
					componentsLoaded: componentsLoaded,
					totalComponents: totalComponentsToLoad,
					renderTime: performance.now()
				},
				error: error instanceof Error ? error : new Error(errorMsg),
				data: {
					source,
					errorSource: source,
					isCritical: source === 'initialization'
				}
			});

			// For backward compatibility, also log with the error service
			const errorObj = errorService.createError(
				`Pictograph:${source}`,
				{ message: errorMsg },
				source === 'initialization' ? ErrorSeverity.CRITICAL : ErrorSeverity.ERROR
			);

			errorObj.context = {
				loadedCount: componentsLoaded,
				totalCount: totalComponentsToLoad
			};

			errorService.log(errorObj);

			// Set local error message
			errorMessage = errorMsg;
			state = 'error';

			// Dispatch events
			dispatch('error', { source, error: { message: errorMsg }, message: errorMsg });
			dispatch('loaded', { complete: false, error: true, message: errorMsg });
		} catch (errorHandlingError) {
			// If error handling itself fails, use a simpler approach
			logger.error('Error in Pictograph error handler', {
				error:
					errorHandlingError instanceof Error
						? errorHandlingError
						: new Error(String(errorHandlingError)),
				data: { originalSource: source }
			});

			errorMessage = 'Error in Pictograph component';
			state = 'error';
			dispatch('error', { source, error: null, message: 'Error in Pictograph component' });
			dispatch('loaded', {
				complete: false,
				error: true,
				message: 'Error in Pictograph component'
			});
		}
	}

	function getPictographAriaLabel(): string {
		if (state === 'error') return `Pictograph error: ${errorMessage}`;
		const letterPart = get(pictographDataStore)?.letter
			? `for letter ${get(pictographDataStore)?.letter}`
			: '';
		const statePart = state === 'complete' ? 'complete' : 'loading';
		return `Pictograph visualization ${letterPart} - ${statePart}`;
	}

	function hasRequiredMotionData(data: PictographData): boolean {
		return Boolean(data?.redMotionData || data?.blueMotionData);
	}
</script>

{#if useNewStateManagement}
	<svelte:component
		this={PictographSvelte5}
		{pictographData}
		{onClick}
		{debug}
		{animationDuration}
		{showLoadingIndicator}
		{beatNumber}
		{isStartPosition}
		onComponentLoaded={(e: { componentName: string }) => dispatch('componentLoaded', e)}
		onLoaded={(e: { complete: boolean; error?: boolean; message?: string }) =>
			dispatch('loaded', e)}
		onError={(e: { source: string; error: any; message: string }) => dispatch('error', e)}
		onDataUpdated={(e: { type: string }) => dispatch('dataUpdated', e)}
		{...$$restProps}
	/>
{:else}
	<!-- Use a button if onClick is provided, otherwise use a div -->
	<svelte:element
		this={onClick ? 'button' : 'div'}
		class="pictograph-wrapper"
		on:click={onClick ? () => onClick() : undefined}
		aria-label={onClick
			? `Pictograph for letter ${get(pictographDataStore)?.letter || 'unknown'}`
			: undefined}
		role={onClick ? 'button' : 'img'}
		data-state={state}
		data-letter={get(pictographDataStore)?.letter || 'none'}
		type={onClick ? 'button' : undefined}
	>
		<svg
			class="pictograph"
			viewBox="0 0 950 950"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label={getPictographAriaLabel()}
		>
			{#if state === 'initializing'}
				{#if showLoadingIndicator}
					<InitializingSpinner {animationDuration} />
				{/if}
			{:else if state === 'error'}
				<PictographError {errorMessage} {animationDuration} />
			{:else}
				<Grid
					gridMode={get(pictographDataStore)?.gridMode}
					onPointsReady={handleGridLoaded}
					on:error={(e) => handleComponentError('grid', e.detail)}
					{debug}
				/>

				{#if beatNumber !== null}
					<BeatLabel
						text={isStartPosition ? 'Start' : beatNumber.toString()}
						position="top-left"
						{animationDuration}
					/>
				{/if}

				{#if state !== 'grid_only'}
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
									on:error={(e) => handleComponentError(`${color}Prop`, e.detail)}
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
									on:error={(e) => handleComponentError(`${color}Arrow`, e.detail)}
								/>
							</g>
						{/if}
					{/each}
				{/if}
			{/if}
		</svg>

		{#if state === 'loading' && showLoadingIndicator}
			<LoadingProgress {loadProgress} showText={true} />
		{/if}

		{#if debug}
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
