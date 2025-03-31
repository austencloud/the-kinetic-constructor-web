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

	// Props
	export let pictographDataStore: Writable<PictographData>;
	export let onClick: (() => void) | undefined = undefined;
	export let debug = false;

	// Dispatch for events
	const dispatch = createEventDispatcher<{
		loaded: { complete: boolean; error?: boolean; message?: string };
		error: { source: string; error?: any; message?: string };
	}>();

	// Pictograph states
	const PictographState = {
		Initializing: 'initializing',
		GridOnly: 'grid_only',
		Loading: 'loading',
		Complete: 'complete',
		Error: 'error'
	} as const;
	
	type PictographStateType = typeof PictographState[keyof typeof PictographState];

	// Reactive store access
	$: pictographData = $pictographDataStore;
	$: letter = pictographData?.letter || null;
	$: gridMode = pictographData?.gridMode;

	// Component state
	let state: PictographStateType = PictographState.Initializing;
	let gridData: GridData | null = null;
	let redPropData: PropData | null = null;
	let bluePropData: PropData | null = null;
	let redArrowData: ArrowData | null = null;
	let blueArrowData: ArrowData | null = null;
	let errorMessage: string | null = null;
	let service: PictographService;

	// Track loaded components
	let loadedComponents = new Set<string>();
	let requiredComponents: string[] = ['grid'];

	// Initialize on mount
	onMount(() => {
		service = new PictographService(get(pictographDataStore));
		
		// Check if we can display motion components
		if (hasRequiredMotionData(get(pictographDataStore))) {
			state = PictographState.Loading;
		} else {
			state = PictographState.GridOnly;
		}
	});

	// Check if data has required motion info
	function hasRequiredMotionData(data: PictographData): boolean {
		return !!(data && data.redMotionData && data.blueMotionData);
	}

	// Grid loading handler
	function handleGridLoaded(data: GridData) {
		gridData = data;
		pictographDataStore.update(store => ({ ...store, gridData: data }));
		loadedComponents.add('grid');

		if (state === PictographState.GridOnly) {
			dispatch('loaded', { complete: false });
			return;
		}

		createAndPositionComponents();
	}

	// Create and position all components
	function createAndPositionComponents() {
		try {
			const data = get(pictographDataStore);
			
			// Generate required component list
			requiredComponents = ['grid'];
			
			// Create red components if needed
			if (data.redMotionData) {
				redPropData = service.createPropData(data.redMotionData, 'red');
				redArrowData = service.createArrowData(data.redMotionData, 'red');
				requiredComponents.push('redProp', 'redArrow');
			}
			
			// Create blue components if needed
			if (data.blueMotionData) {
				bluePropData = service.createPropData(data.blueMotionData, 'blue');
				blueArrowData = service.createArrowData(data.blueMotionData, 'blue');
				requiredComponents.push('blueProp', 'blueArrow');
			}
			
			// Position all components if grid is ready
			if (gridData) {
				service.positionComponents(redPropData, bluePropData, redArrowData, blueArrowData, gridData);
			}
			
			// Update store with new components
			pictographDataStore.update(store => ({
				...store,
				redPropData,
				bluePropData,
				redArrowData,
				blueArrowData
			}));
			
		} catch (error) {
			handleError('component creation', error);
		}
	}

	// Track component loading status
	function handleComponentLoaded(component: string) {
		loadedComponents.add(component);
		checkLoadingComplete();
	}

	// Check if all required components are loaded
	function checkLoadingComplete() {
		const allLoaded = requiredComponents.every(component => loadedComponents.has(component));
		
		if (allLoaded) {
			state = PictographState.Complete;
			dispatch('loaded', { complete: true });
		}
	}

	// Handle component errors with fallback
	function handleComponentError(component: string, error: any) {
		console.warn(`Component error (${component}):`, error);
		
		// Apply fallback positioning
		applyFallbackPositioning(component);
		
		// Mark as loaded to continue
		loadedComponents.add(component);
		checkLoadingComplete();
	}

	// Apply fallback positioning for error recovery
	function applyFallbackPositioning(component: string) {
		const centerX = 475;
		const centerY = 475;

		switch (component) {
			case 'redProp':
				if (redPropData) redPropData.coords = { x: centerX - 50, y: centerY };
				break;
			case 'blueProp':
				if (bluePropData) bluePropData.coords = { x: centerX + 50, y: centerY };
				break;
			case 'redArrow':
				if (redArrowData) redArrowData.coords = { x: centerX, y: centerY - 50 };
				break;
			case 'blueArrow':
				if (blueArrowData) blueArrowData.coords = { x: centerX, y: centerY + 50 };
				break;
		}
	}

	// Structured error handling
	function handleError(source: string, error: any) {
		const errorObj = {
			source,
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			timestamp: new Date().toISOString()
		};

		errorMessage = errorObj.message;
		console.error(`Pictograph error [${source}]:`, errorObj);

		state = PictographState.Error;
		dispatch('error', { source, error, message: errorMessage });
		dispatch('loaded', { complete: false, error: true, message: errorMessage });
	}

	// Handle UI click events
	function handleWrapperClick() {
		if (onClick) onClick();
	}
</script>

<div
	class="pictograph-wrapper"
	on:click={handleWrapperClick}
	on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick && onClick()}
	role={onClick ? 'button' : undefined}
	tabIndex={onClick ? 0 : undefined}
	aria-label="Pictograph container for letter {letter}"
>
	<svg
		class="pictograph"
		viewBox="0 0 950 950"
		xmlns="http://www.w3.org/2000/svg"
		role="img"
		aria-label="Pictograph visualization for letter {letter}"
	>
		{#if state === PictographState.Initializing}
			<text
				x="50%"
				y="50%"
				dominant-baseline="middle"
				text-anchor="middle"
				font-size="24"
				fill="grey"
			>
				Loading...
			</text>
		{:else if state === PictographState.Error}
			<text
				x="50%"
				y="50%"
				dominant-baseline="middle"
				text-anchor="middle"
				font-size="24"
				fill="red"
			>
				Error: {errorMessage}
			</text>
		{:else}
			<Grid
				gridMode={gridMode}
				onPointsReady={handleGridLoaded}
				on:error={(e) => handleComponentError('grid', e.detail)}
				{debug}
			/>

			{#if state !== PictographState.GridOnly}
				<!-- Letter glyph -->
				{#if letter}
					<TKAGlyph
						letter={letter}
						turnsTuple="(s, 0, 0)"
						x={50}
						y={800}
					/>
				{/if}

				<!-- Motion components using each loop -->
				{#each [
					{ color: 'red', propData: redPropData, arrowData: redArrowData },
					{ color: 'blue', propData: bluePropData, arrowData: blueArrowData }
				] as { color, propData, arrowData }}
					{#if propData}
						<Prop
							propData={propData}
							on:loaded={() => handleComponentLoaded(`${color}Prop`)}
							on:error={(e) => handleComponentError(`${color}Prop`, e.detail)}
						/>
					{/if}

					{#if arrowData}
						<Arrow
							arrowData={arrowData}
							on:loaded={() => handleComponentLoaded(`${color}Arrow`)}
							on:error={(e) => handleComponentError(`${color}Arrow`, e.detail)}
						/>
					{/if}
				{/each}
			{/if}
		{/if}
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