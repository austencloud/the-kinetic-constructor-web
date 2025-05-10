<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { PictographData } from '$lib/types/PictographData';
	// Import types for TypeScript type checking
	import type { PropData } from '../objects/Prop/PropData';
	import type { ArrowData } from '../objects/Arrow/ArrowData';
	import type { GridData } from '../objects/Grid/GridData';
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
	import { pictographContainer } from '$lib/state/stores/pictograph/modernPictographContainer';
	import { defaultPictographData } from './utils/defaultPictographData';

	// Props using Svelte 5 runes
	const props = $props<{
		pictographData?: PictographData;
		onClick?: () => void;
		debug?: boolean;
		animationDuration?: number;
		showLoadingIndicator?: boolean;
		beatNumber?: number | null;
		isStartPosition?: boolean;
	}>();

	// Set default values for props
	const debug = props.debug ?? false;
	const animationDuration = props.animationDuration ?? 300;
	const showLoadingIndicator = props.showLoadingIndicator ?? true;
	const beatNumber = props.beatNumber ?? null;
	const isStartPosition = props.isStartPosition ?? false;
	const onClick = props.onClick;

	// Component state with reactivity
	// Using regular variables for now since we're using the feature flag approach
	// Note: These warnings about non-reactive updates are expected and will be fixed
	// when we fully migrate to Svelte 5 and remove the feature flag
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

	// Store tracked data snapshot for comparison
	interface TrackedDataSnapshot {
		letter: string | null;
		gridMode: string;
		startPos: string | null;
		endPos: string | null;
		direction: string | null;
		redMotionData: {
			id: string;
			startLoc: string;
			endLoc: string;
			startOri: string;
			endOri: string;
			motionType: string;
		} | null;
		blueMotionData: {
			id: string;
			startLoc: string;
			endLoc: string;
			startOri: string;
			endOri: string;
			motionType: string;
		} | null;
	}
	let lastDataSnapshot: TrackedDataSnapshot | null = null;

	// Event handling
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	// Get pictograph data from props or container
	const pictographData = $derived(
		props.pictographData || pictographContainer.state.data || defaultPictographData
	);

	// Reactive values derived from pictograph data
	const letter = $derived(pictographData?.letter || null);
	const gridMode = $derived(pictographData?.gridMode || 'diamond');
	const pictographAriaLabel = $derived(getPictographAriaLabel());
	const interactiveProps = $derived(
		onClick
			? {
					role: 'button',
					tabIndex: 0,
					'aria-label': `Pictograph for letter ${letter || 'unknown'}`
				}
			: {}
	);

	// Initialize the service when component mounts
	$effect(() => {
		const startTime = performance.now();

		try {
			// Make sure we have data to work with
			if (!pictographData) {
				// If no data is available, use default data
				pictographContainer.setData(defaultPictographData);
				return;
			}

			// Log component initialization
			logger.info('Pictograph component initializing', {
				data: {
					debug,
					hasMotionData: hasRequiredMotionData(pictographData),
					letter: pictographData?.letter,
					gridMode: pictographData?.gridMode
				}
			});

			service = new PictographService(pictographData);

			// Initialize data snapshot
			updateLastKnownValues(pictographData);

			if (hasRequiredMotionData(pictographData)) {
				state = 'loading';
				logger.debug('Pictograph: Motion data available, entering loading state', {
					data: {
						redMotionData: pictographData?.redMotionData ? true : false,
						blueMotionData: pictographData?.blueMotionData ? true : false
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
					letter: pictographData?.letter,
					gridMode: pictographData?.gridMode
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

	// Watch for changes to pictographData and update components when it changes
	$effect(() => {
		if (pictographData && service) {
			// Use a safe comparison method that avoids circular references
			const hasChanged = checkForDataChanges(pictographData);

			// Only process if there's a real change and service is initialized
			if (hasChanged) {
				if (debug) console.debug('Pictograph data changed, updating components');

				// Update the service with new data
				service.updateData(pictographData);

				// Update local state
				updateComponentsFromData();

				// Notify parent about the update
				dispatch('dataUpdated', { type: 'all' });
			}
		}
	});

	// Update the container when pictograph data changes
	$effect(() => {
		if (pictographData && !props.pictographData) {
			pictographContainer.setData(pictographData);
		}
	});

	// Update load progress when components loaded or total changes
	$effect(() => {
		loadProgress = Math.floor((componentsLoaded / Math.max(totalComponentsToLoad, 1)) * 100);
	});

	// For debugging - log when pictographData changes
	$effect(() => {
		if (debug && pictographData) {
			console.log('Pictograph data changed:', pictographData);
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
			const key = `${color}MotionData` as 'redMotionData' | 'blueMotionData';
			const oldMotion = lastDataSnapshot![key]; // Use non-null assertion if sure it's initialized
			const newMotion = newData[key];

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

	function getPictographAriaLabel(): string {
		if (state === 'error') return `Pictograph error: ${errorMessage}`;
		const letterPart = letter ? `for letter ${letter}` : '';
		const statePart = state === 'complete' ? 'complete' : 'loading';
		return `Pictograph visualization ${letterPart} - ${statePart}`;
	}

	function hasRequiredMotionData(data: PictographData): boolean {
		return Boolean(data?.redMotionData || data?.blueMotionData);
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
			if (!pictographData) {
				state = 'grid_only';
				return;
			}

			// Update state based on available motion data
			if (hasRequiredMotionData(pictographData)) {
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
				if (requiredComponents.every((comp: string) => loadedComponents.has(comp))) {
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

			// Update the container
			pictographContainer.updateGridData(data);
			pictographContainer.updateComponentLoaded('grid');

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
			if (!pictographData || !service) return;

			// Create red components if needed
			if (pictographData.redMotionData) {
				redPropData = service.createPropData(pictographData.redMotionData, 'red');
				redArrowData = service.createArrowData(pictographData.redMotionData, 'red');

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
			if (pictographData.blueMotionData) {
				bluePropData = service.createPropData(pictographData.blueMotionData, 'blue');
				blueArrowData = service.createArrowData(pictographData.blueMotionData, 'blue');

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

			// Update the container
			if (redPropData) pictographContainer.updatePropData('red', redPropData);
			if (bluePropData) pictographContainer.updatePropData('blue', bluePropData);
			if (redArrowData) pictographContainer.updateArrowData('red', redArrowData);
			if (blueArrowData) pictographContainer.updateArrowData('blue', blueArrowData);
		} catch (error) {
			handleError('component creation', error);
		}
	}

	function handleComponentLoaded(component: string) {
		loadedComponents.add(component);
		componentsLoaded++;
		pictographContainer.updateComponentLoaded(component as any); // Cast needed if updateComponentLoaded has specific string literal types
		dispatch('componentLoaded', { componentName: component });
		checkLoadingComplete();
	}

	function checkLoadingComplete() {
		const startCheck = performance.now();
		const allLoaded = requiredComponents.every((component: string) =>
			loadedComponents.has(component)
		);

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
					letter: pictographData?.letter,
					gridMode: pictographData?.gridMode,
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
				letter: pictographData?.letter,
				gridMode: pictographData?.gridMode,
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
				letter: letter ? letter : undefined,
				gridMode: gridMode,
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
</script>

<div
	class="pictograph-wrapper"
	onclick={onClick ? () => onClick() : undefined}
	onkeydown={(e) => {
		if (onClick && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			onClick();
		}
	}}
	{...interactiveProps}
	data-state={state}
	data-letter={letter || 'none'}
>
	<svg
		class="pictograph"
		viewBox="0 0 950 950"
		xmlns="http://www.w3.org/2000/svg"
		role="img"
		aria-label={pictographAriaLabel}
	>
		{#if state === 'initializing'}
			{#if showLoadingIndicator}
				<InitializingSpinner {animationDuration} />
			{/if}
		{:else if state === 'error'}
			<PictographError {errorMessage} {animationDuration} />
		{:else}
			<Grid
				{gridMode}
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
				{#if letter}
					<g transition:fade={{ duration: animationDuration, delay: 100 }}>
						<TKAGlyph {letter} turnsTuple="(s, 0, 0)" x={50} y={800} />
					</g>
				{/if}

				{#each [{ color: 'red', propData: redPropData, arrowData: redArrowData, delay: 150 }, { color: 'blue', propData: bluePropData, arrowData: blueArrowData, delay: 200 }] as { color, propData: currentPropData, arrowData: currentArrowData, delay }}
					{#if currentPropData}
						<g
							transition:fade={{ duration: animationDuration, delay }}
							style="transform-origin: center center;"
						>
							<Prop
								propData={currentPropData}
								on:loaded={() => handleComponentLoaded(`${color}Prop`)}
								on:error={(e) => handleComponentError(`${color}Prop`, e.detail)}
							/>
						</g>
					{/if}

					{#if currentArrowData}
						<g
							transition:fade={{ duration: animationDuration, delay }}
							style="transform-origin: center center;"
						>
							<Arrow
								arrowData={currentArrowData}
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
</div>

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
		/* display: flex; /* Removed as SVG content handles its own layout */
		/* align-items: center; */
		/* justify-content: center; */
	}

	.pictograph-wrapper:hover .pictograph {
		transform: scale(1.05);
		z-index: 4;
		border: 4px solid #48bb78; /* Tailwind green-500 */
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
		outline: 3px solid #4299e1; /* Tailwind blue-500 */
		outline-offset: 2px;
	}

	.pictograph-wrapper[data-state='error'] .pictograph {
		border-color: #fc8181; /* Tailwind red-400 */
		box-shadow: 0 0 0 1px #fc8181; /* Tailwind red-400 */
	}
</style>
