<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import type { PictographData } from '$lib/types/PictographData';
	import type { PropData } from '../objects/Prop/PropData';
	import type { ArrowData } from '../objects/Arrow/ArrowData';
	import type { GridData } from '../objects/Grid/GridData';
	import Grid from '../objects/Grid/Grid.svelte';
	import Prop from '../objects/Prop/Prop.svelte';
	import Arrow from '../objects/Arrow/Arrow.svelte';
	import TKAGlyph from '../objects/Glyphs/TKAGlyph/TKAGlyph.svelte';
	import { PictographService } from './services/PictographService';
	import PictographLoading from './components/PictographLoading.svelte';
	import PictographError from './components/PictographError.svelte';
	import PictographDebug from './components/PictographDebug.svelte';

	// Props with defaults - unchanged
	import type { Writable } from 'svelte/store';
	import { errorService, ErrorSeverity } from './services/ErrorHandlingService';

	export let pictographDataStore: Writable<PictographData>;
	export let onClick: (() => void) | undefined = undefined;
	export let debug = false;
	export let animationDuration = 300;
	export let showLoadingIndicator = true;

	// Event dispatcher - unchanged
	const dispatch = createEventDispatcher<{
		loaded: { complete: boolean; error?: boolean; message?: string };
		error: { source: string; error?: any; message?: string };
		componentLoaded: { componentName: string };
	}>();

	// Component state variables - unchanged but better organized
	let state = 'initializing'; // 'initializing', 'grid_only', 'loading', 'complete', 'error'
	let errorMessage: string | null = null;
	let gridData: GridData | null = null;
	let redPropData: PropData | null = null;
	let bluePropData: PropData | null = null;
	let redArrowData: ArrowData | null = null;
	let blueArrowData: ArrowData | null = null;
	let loadedComponents = new Set<string>();
	let requiredComponents: string[] = ['grid'];
	let totalComponentsToLoad = 1;
	let componentsLoaded = 0;
	let loadProgress = 0;
	let renderCount = 0;
	let service: PictographService;

	// Reactive values derived from pictographDataStore - unchanged
	$: pictographData = $pictographDataStore;
	$: letter = pictographData?.letter || null;
	$: gridMode = pictographData?.gridMode || 'diamond';

	// Improve aria-label logic with a helper function
	$: pictographAriaLabel = getPictographAriaLabel();
	$: interactiveProps = onClick
		? {
				role: 'button',
				tabIndex: 0,
				'aria-label': `Pictograph for letter ${letter || 'unknown'}`
			}
		: {};

	/**
	 * Get the ARIA label based on component state - new helper function
	 */
	function getPictographAriaLabel(): string {
		if (state === 'error') {
			return `Pictograph error: ${errorMessage}`;
		}

		const letterPart = letter ? `for letter ${letter}` : '';
		const statePart = state === 'complete' ? 'complete' : 'loading';
		return `Pictograph visualization ${letterPart} - ${statePart}`;
	}

	/**
	 * Check if data has required motion information - new helper function
	 */
	function hasRequiredMotionData(data: PictographData): boolean {
		return Boolean(data?.redMotionData || data?.blueMotionData);
	}

	// Component initialization - mostly unchanged, slight improvements
	onMount(() => {
		const startTime = performance.now();

		try {
			service = new PictographService(pictographData);

			if (hasRequiredMotionData(pictographData)) {
				state = 'loading';
				if (debug) console.debug('Pictograph: Motion data available, entering loading state');
			} else {
				state = 'grid_only';
				if (debug) console.debug('Pictograph: No motion data, entering grid-only state');
			}

			const initTime = performance.now() - startTime;
			if (debug) console.debug(`Pictograph initialized in ${initTime.toFixed(2)}ms`);
		} catch (error) {
			handleError('initialization', error);
		}

		return () => {
			loadedComponents.clear();
		};
	});

	/**
	 * Handle grid loading completion - mostly unchanged
	 */
	function handleGridLoaded(data: GridData) {
		try {
			// Update state
			gridData = data;
			componentsLoaded++;
			loadedComponents.add('grid');

			// Update progress
			updateLoadProgress();

			// Update pictograph data store
			pictographDataStore.update((store) => ({ ...store, gridData: data }));

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

	/**
	 * Create and position components - better organized but same logic
	 */
	function createAndPositionComponents() {
		try {
			// Initialize required components
			requiredComponents = ['grid'];
			totalComponentsToLoad = 1;

			// Create red components if needed
			if (pictographData.redMotionData) {
				redPropData = service.createPropData(pictographData.redMotionData, 'red');
				redArrowData = service.createArrowData(pictographData.redMotionData, 'red');
				requiredComponents.push('redProp', 'redArrow');
				totalComponentsToLoad += 2;
			}

			// Create blue components if needed
			if (pictographData.blueMotionData) {
				bluePropData = service.createPropData(pictographData.blueMotionData, 'blue');
				blueArrowData = service.createArrowData(pictographData.blueMotionData, 'blue');
				requiredComponents.push('blueProp', 'blueArrow');
				totalComponentsToLoad += 2;
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

			// Update pictograph data store
			pictographDataStore.update((store) => ({
				...store,
				redPropData,
				bluePropData,
				redArrowData,
				blueArrowData
			}));

			updateLoadProgress();
		} catch (error) {
			handleError('component creation', error);
		}
	}

	/**
	 * Handle component loading - unchanged
	 */
	function handleComponentLoaded(component: string) {
		loadedComponents.add(component);
		componentsLoaded++;
		updateLoadProgress();
		dispatch('componentLoaded', { componentName: component });
		checkLoadingComplete();
	}

	/**
	 * Update load progress - unchanged
	 */
	function updateLoadProgress() {
		loadProgress = Math.floor((componentsLoaded / Math.max(totalComponentsToLoad, 1)) * 100);
	}

	/**
	 * Check if loading is complete - unchanged
	 */
	function checkLoadingComplete() {
		const startCheck = performance.now();
		const allLoaded = requiredComponents.every((component) => loadedComponents.has(component));

		if (allLoaded) {
			state = 'complete';
			renderCount++;

			if (debug) {
				console.debug(`Pictograph fully loaded in ${performance.now() - startCheck}ms`);
				console.debug(`Total components loaded: ${componentsLoaded}/${totalComponentsToLoad}`);
			}

			dispatch('loaded', { complete: true });
		}
	}

	/**
	 * Handle component error - unchanged
	 */
	function handleComponentError(component: string, error: any) {
		if (debug) console.warn(`Component error (${component}):`, error);

		applyFallbackPositioning(component);

		loadedComponents.add(component);
		componentsLoaded++;
		updateLoadProgress();

		checkLoadingComplete();
	}

	/**
	 * Apply fallback positioning - unchanged
	 */
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

	/**
	 * Handle error - improved with better organization
	 */
	/**
	 * Handle error - improved with better organization using ErrorHandlingService
	 */
	function handleError(source: string, error: any) {
		// Create an error object using the new error service
		const errorObj = errorService.createError(
			`Pictograph:${source}`,
			error,
			// Determine severity based on the source
			source === 'initialization' ? ErrorSeverity.CRITICAL : ErrorSeverity.ERROR
		);

		// Add additional context specific to Pictograph
		errorObj.context = {
			loadedCount: componentsLoaded,
			totalCount: totalComponentsToLoad
		};

		// Log the error using the service
		errorService.log(errorObj);

		// Set local error message (maintaining existing behavior)
		errorMessage = errorObj.message;
		state = 'error';

		// Maintain existing debug logging
		if (debug) {
			console.error(`Pictograph error [${source}]:`, errorObj);
		} else {
			console.error(`Pictograph error: ${errorMessage}`);
		}

		// Dispatch events exactly as before
		dispatch('error', { source, error, message: errorMessage });
		dispatch('loaded', { complete: false, error: true, message: errorMessage });
	}

	/**
	 * Handle wrapper click - unchanged
	 */
	function handleWrapperClick() {
		if (onClick) onClick();
	}

	/**
	 * Handle key presses for accessibility - unchanged
	 */
	function handleKeydown(e: KeyboardEvent) {
		if (onClick && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			onClick();
		}
	}
</script>

<!-- Template remains completely unchanged to ensure compatibility -->
<div
	class="pictograph-wrapper"
	on:click={handleWrapperClick}
	on:keydown={handleKeydown}
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
				<PictographLoading {animationDuration} initializing={true} />
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

			{#if state !== 'grid_only'}
				{#if letter}
					<g in:fade={{ duration: animationDuration, delay: 100 }}>
						<TKAGlyph {letter} turnsTuple="(s, 0, 0)" x={50} y={800} />
					</g>
				{/if}

				{#each [{ color: 'red', propData: redPropData, arrowData: redArrowData, delay: 150 }, { color: 'blue', propData: bluePropData, arrowData: blueArrowData, delay: 200 }] as { color, propData, arrowData, delay }}
					{#if propData}
						<g
							in:fade={{ duration: animationDuration, delay }}
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
							in:fade={{ duration: animationDuration, delay }}
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

			{#if debug}
				<PictographDebug
					{state}
					{componentsLoaded}
					totalComponents={totalComponentsToLoad}
					{renderCount}
				/>
			{/if}
		{/if}
	</svg>

	{#if state === 'loading' && showLoadingIndicator}
		<PictographLoading {loadProgress} {animationDuration} showText={true} initializing={false} />
	{/if}
</div>

<style>
	/* Styles completely unchanged */
	.pictograph-wrapper {
		width: 100%;
		height: 100%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
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

	.pictograph-wrapper[data-state='error'] .pictograph {
		border-color: #fc8181;
		box-shadow: 0 0 0 1px #fc8181;
	}

	.pictograph-wrapper[data-state='complete'] .pictograph {
		border-color: #48bb78;
	}
</style>
