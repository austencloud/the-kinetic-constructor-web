<!-- Pictograph.svelte -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { get, type Writable } from 'svelte/store';

	import type { PictographData } from '$lib/types/PictographData';
	import type { PropData } from '../objects/Prop/PropData';
	import type { ArrowData } from '../objects/Arrow/ArrowData';
	import type { GridData } from '../objects/Grid/GridData';

	import Grid from '../objects/Grid/Grid.svelte';
	import Prop from '../objects/Prop/Prop.svelte';
	import Arrow from '../objects/Arrow/Arrow.svelte';
	import TKAGlyph from '../objects/Glyphs/TKAGlyph/TKAGlyph.svelte';
	import { PictographService } from './PictographService';
	import { fade, scale } from 'svelte/transition';
	import { DIAMOND } from '$lib/types/Constants';

	// Props with default values
	export let pictographDataStore: Writable<PictographData>;
	export let onClick: (() => void) | undefined = undefined;
	export let debug = false;
	export let animationDuration = 300; // Animation duration in ms
	export let showLoadingIndicator = true;

	// Dispatch for events with proper typing
	const dispatch = createEventDispatcher<{
		loaded: { complete: boolean; error?: boolean; message?: string };
		error: { source: string; error?: any; message?: string };
		componentLoaded: { componentName: string };
	}>();

	// Define pictograph states as const enum for better performance
	const PictographState = {
		Initializing: 'initializing',
		GridOnly: 'grid_only',
		Loading: 'loading',
		Complete: 'complete',
		Error: 'error'
	} as const;

	type PictographStateType = (typeof PictographState)[keyof typeof PictographState];
	// Reactive store access with proper typing
	$: pictographData = $pictographDataStore;
	$: letter = pictographData?.letter || null;
	$: gridMode = pictographData?.gridMode || DIAMOND;

	// Component state with strong typing
	let state: PictographStateType = PictographState.Initializing;
	let gridData: GridData | null = null;
	let redPropData: PropData | null = null;
	let bluePropData: PropData | null = null;
	let redArrowData: ArrowData | null = null;
	let blueArrowData: ArrowData | null = null;
	let errorMessage: string | null = null;
	let service: PictographService;
	let renderCount = 0; // Performance tracking

	// Component tracking with Set for O(1) lookups
	let loadedComponents = new Set<string>();
	let requiredComponents: string[] = ['grid'];
	let totalComponentsToLoad = 1; // Start with grid
	let componentsLoaded = 0;
	let loadProgress = 0;

	// Accessibility labels
	$: pictographAriaLabel = getPictographAriaLabel();
	$: interactiveProps = onClick
		? {
				role: 'button',
				tabIndex: 0,
				'aria-label': `Pictograph for letter ${letter || 'unknown'}`
			}
		: {};

	// Generate dynamic aria label based on state and content
	function getPictographAriaLabel(): string {
		if (state === PictographState.Error) {
			return `Pictograph error: ${errorMessage}`;
		}

		const letterPart = letter ? `for letter ${letter}` : '';
		const statePart = state === PictographState.Complete ? 'complete' : 'loading';
		return `Pictograph visualization ${letterPart} - ${statePart}`;
	}

	// Enhanced initialization logic
	onMount(() => {
		// Performance tracking
		const startTime = performance.now();

		// Create service with proper error handling
		try {
			service = new PictographService(get(pictographDataStore));

			// Determine initial state based on available data
			if (hasRequiredMotionData(get(pictographDataStore))) {
				state = PictographState.Loading;
				console.debug('Pictograph: Motion data available, entering loading state');
			} else {
				state = PictographState.GridOnly;
				console.debug('Pictograph: No motion data, entering grid-only state');
			}

			// Performance metrics
			const initTime = performance.now() - startTime;
			if (debug) console.debug(`Pictograph initialized in ${initTime.toFixed(2)}ms`);
		} catch (error) {
			handleError('initialization', error);
		}

		// Cleanup function
		return () => {
			// Clear any pending async operations if needed
			loadedComponents.clear();
		};
	});

	// Check if data has required motion info with null safety
	function hasRequiredMotionData(data: PictographData): boolean {
		return Boolean(data?.redMotionData || data?.blueMotionData);
	}

	// Enhanced grid loading handler with progress tracking
	function handleGridLoaded(data: GridData) {
		try {
			gridData = data;
			componentsLoaded++;
			updateLoadProgress();

			// Store grid data in pictograph store
			pictographDataStore.update((store) => ({ ...store, gridData: data }));
			loadedComponents.add('grid');

			if (state === PictographState.GridOnly) {
				dispatch('loaded', { complete: false });
				return;
			}

			createAndPositionComponents();
		} catch (error) {
			handleError('grid loading', error);
		}
	}

	// Create and position components with better error boundaries
	function createAndPositionComponents() {
		try {
			const data = get(pictographDataStore);

			// Reset required components list
			requiredComponents = ['grid'];
			totalComponentsToLoad = 1;

			// Create red components if needed
			if (data.redMotionData) {
				redPropData = service.createPropData(data.redMotionData, 'red');
				redArrowData = service.createArrowData(data.redMotionData, 'red');
				requiredComponents.push('redProp', 'redArrow');
				totalComponentsToLoad += 2;
			}

			// Create blue components if needed
			if (data.blueMotionData) {
				bluePropData = service.createPropData(data.blueMotionData, 'blue');
				blueArrowData = service.createArrowData(data.blueMotionData, 'blue');
				requiredComponents.push('blueProp', 'blueArrow');
				totalComponentsToLoad += 2;
			}

			// Position all components if grid is ready
			if (gridData) {
				service.positionComponents(
					redPropData,
					bluePropData,
					redArrowData,
					blueArrowData,
					gridData
				);
			}

			// Update store with new components atomically
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

	// Track component loading with progress
	function handleComponentLoaded(component: string) {
		loadedComponents.add(component);
		componentsLoaded++;
		updateLoadProgress();
		dispatch('componentLoaded', { componentName: component });
		checkLoadingComplete();
	}

	// Update load progress percentage
	function updateLoadProgress() {
		loadProgress = Math.floor((componentsLoaded / Math.max(totalComponentsToLoad, 1)) * 100);
	}

	// Check if all required components are loaded with performance tracking
	function checkLoadingComplete() {
		const startCheck = performance.now();
		const allLoaded = requiredComponents.every((component) => loadedComponents.has(component));

		if (allLoaded) {
			state = PictographState.Complete;
			renderCount++;

			if (debug) {
				console.debug(`Pictograph fully loaded in ${performance.now() - startCheck}ms`);
				console.debug(`Total components loaded: ${componentsLoaded}/${totalComponentsToLoad}`);
			}

			dispatch('loaded', { complete: true });
		}
	}

	// Enhanced error handling with better component recovery
	function handleComponentError(component: string, error: any) {
		if (debug) console.warn(`Component error (${component}):`, error);

		// Apply fallback positioning
		applyFallbackPositioning(component);

		// Mark as loaded to continue (graceful degradation)
		loadedComponents.add(component);
		componentsLoaded++;
		updateLoadProgress();

		// Continue loading process despite error
		checkLoadingComplete();
	}

	// Improved fallback positioning with edge case handling
	function applyFallbackPositioning(component: string) {
		// Calculate safe center point regardless of viewBox
		const centerX = 475;
		const centerY = 475;
		const offset = 50;

		// Use a more strategic placement pattern for visual clarity
		switch (component) {
			case 'redProp':
				if (redPropData) {
					redPropData.coords = { x: centerX - offset, y: centerY };
					redPropData.rotAngle = 0; // Reset any invalid rotation
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
					redArrowData.rotAngle = -90; // Point upward
				}
				break;
			case 'blueArrow':
				if (blueArrowData) {
					blueArrowData.coords = { x: centerX, y: centerY + offset };
					blueArrowData.rotAngle = 90; // Point downward
				}
				break;
			default:
				// Handle unknown component with safe defaults
				console.warn(`Unknown component: ${component}, using center position`);
		}
	}

	// Enhanced error handling with error categorization
	function handleError(source: string, error: any) {
		// Create structured error object
		const errorObj = {
			source,
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			timestamp: new Date().toISOString(),
			componentState: {
				loadedCount: componentsLoaded,
				totalCount: totalComponentsToLoad
			}
		};

		errorMessage = errorObj.message;

		// Log detailed error for debugging
		if (debug) {
			console.error(`Pictograph error [${source}]:`, errorObj);
		} else {
			console.error(`Pictograph error: ${errorMessage}`);
		}

		// Update state and notify
		state = PictographState.Error;
		dispatch('error', { source, error, message: errorMessage });
		dispatch('loaded', { complete: false, error: true, message: errorMessage });
	}

	// Interactivity handler with keyboard accessibility
	function handleWrapperClick() {
		if (onClick) onClick();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (onClick && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault(); // Prevent scrolling on space
			onClick();
		}
	}
</script>

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
		{#if state === PictographState.Initializing}
			{#if showLoadingIndicator}
				<g transition:fade={{ duration: animationDuration }}>
					<rect x="425" y="425" width="100" height="100" fill="transparent" />
					<circle cx="475" cy="475" r="40" fill="none" stroke="#ccc" stroke-width="8" />
					<path
						d="M475 435 A40 40 0 0 1 515 475"
						fill="none"
						stroke="#4299e1"
						stroke-width="8"
						stroke-linecap="round"
					>
						<animate
							attributeName="stroke-dasharray"
							from="0 1000"
							to="1000 1000"
							dur="1s"
							repeatCount="indefinite"
						/>
					</path>
					<text
						x="50%"
						y="550"
						dominant-baseline="middle"
						text-anchor="middle"
						font-size="16"
						fill="#666"
					>
						Initializing...
					</text>
				</g>
			{/if}
		{:else if state === PictographState.Error}
			<g transition:fade={{ duration: animationDuration }}>
				<circle cx="475" cy="450" r="40" fill="#fed7d7" />
				<text
					x="475"
					y="450"
					dominant-baseline="middle"
					text-anchor="middle"
					font-size="40"
					fill="#e53e3e"
				>
					!
				</text>
				<text
					x="475"
					y="520"
					dominant-baseline="middle"
					text-anchor="middle"
					font-size="18"
					fill="#e53e3e"
				>
					Error
				</text>
				<text
					x="475"
					y="550"
					dominant-baseline="middle"
					text-anchor="middle"
					font-size="14"
					fill="#718096"
				>
					{errorMessage}
				</text>
			</g>
		{:else}
			<!-- Grid always renders first -->
			<Grid
				{gridMode}
				onPointsReady={handleGridLoaded}
				on:error={(e) => handleComponentError('grid', e.detail)}
				{debug}
			/>

			{#if state !== PictographState.GridOnly}
				<!-- Animated letter glyph with transitions -->
				{#if letter}
					<g in:fade={{ duration: animationDuration, delay: 100 }}>
						<TKAGlyph {letter} turnsTuple="(s, 0, 0)" x={50} y={800} />
					</g>
				{/if}

				<!-- Motion components with transitions -->
				{#each [{ color: 'red', propData: redPropData, arrowData: redArrowData, delay: 150 }, { color: 'blue', propData: bluePropData, arrowData: blueArrowData, delay: 200 }] as { color, propData, arrowData, delay }}
					{#if propData}
						<g
							in:scale={{ duration: animationDuration, delay, start: 0, opacity: 0 }}
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
							in:scale={{ duration: animationDuration, delay, start: 0, opacity: 0 }}
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

			<!-- Debug overlay -->
			{#if debug}
				<g class="debug-overlay">
					<rect x="10" y="10" width="200" height="80" fill="rgba(0,0,0,0.7)" rx="5" />
					<text x="20" y="30" font-size="12" fill="white">State: {state}</text>
					<text x="20" y="50" font-size="12" fill="white"
						>Loaded: {componentsLoaded}/{totalComponentsToLoad}</text
					>
					<text x="20" y="70" font-size="12" fill="white">Renders: {renderCount}</text>
				</g>
			{/if}
		{/if}
	</svg>

	<!-- Loading progress bar for better UX -->
	{#if state === PictographState.Loading && showLoadingIndicator}
		<div class="loading-bar-container">
			<div class="loading-bar" style="width: {loadProgress}%"></div>
			<span class="loading-text">{loadProgress}%</span>
		</div>
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

	/* Loading bar styles */
	.loading-bar-container {
		position: absolute;
		bottom: 10px;
		left: 10px;
		right: 10px;
		height: 4px;
		background-color: #edf2f7;
		border-radius: 2px;
		overflow: hidden;
		z-index: 5;
	}

	.loading-bar {
		height: 100%;
		background-color: #4299e1;
		transition: width 0.3s ease-out;
	}

	.loading-text {
		position: absolute;
		right: 0;
		top: -18px;
		font-size: 12px;
		color: #718096;
	}

	/* State-specific styles */
	.pictograph-wrapper[data-state='error'] .pictograph {
		border-color: #fc8181;
		box-shadow: 0 0 0 1px #fc8181;
	}

	.pictograph-wrapper[data-state='complete'] .pictograph {
		border-color: #48bb78;
	}

	.debug-overlay {
		opacity: 0.9;
		pointer-events: none;
	}
</style>
