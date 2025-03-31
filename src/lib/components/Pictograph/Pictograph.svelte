<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { get, type Writable } from 'svelte/store';

	import type { PictographData } from '$lib/types/PictographData';
	import type { PropData } from '../objects/Prop/PropData';
	import type { ArrowData } from '../objects/Arrow/ArrowData';
	import type { GridData } from '../objects/Grid/GridData';
	import type { Letter } from '$lib/types/Letter';

	import Grid from '../objects/Grid/Grid.svelte';
	import Prop from '../objects/Prop/Prop.svelte';
	import Arrow from '../objects/Arrow/Arrow.svelte';
	import TKAGlyph from '../objects/Glyphs/TKAGlyph/TKAGlyph.svelte';
	import { BetaPropPositioner } from '$lib/components/PlacementManagers/PropPlacementManager/BetaPropPositioner';
	import { PictographChecker } from './PictographChecker';
	import { PictographComponentLoader } from './services/PictographComponentLoader';
	import { PictographComponentPositioner } from './services/PictographComponentPositioner';
	import { PictographGetter } from './PictographGetter';
	import ArrowRotAngleManager from '../objects/Arrow/ArrowRotAngleManager';
	import ArrowLocationManager from '../objects/Arrow/ArrowLocationManager';

	// Props
	export let pictographDataStore: Writable<PictographData>;
	export let onClick: (() => void) | undefined = undefined;
	export let debug = false;

	// Dispatch for events
	const dispatch = createEventDispatcher<{
		loaded: { complete: boolean; error?: boolean; message?: string };
		error: { source: string; error?: any; message?: string };
	}>();

	// Define color type for better type safety
	type PictographColor = 'red' | 'blue';

	// Use const object instead of enum (Svelte-friendly)
	const PictographState = {
		Initializing: 'initializing',
		GridOnly: 'grid_only',
		Loading: 'loading',
		Complete: 'complete',
		Error: 'error'
	} as const;
	
	type PictographStateType = typeof PictographState[keyof typeof PictographState];

	// Create reactive declarations from store
	$: pictographData = $pictographDataStore;
	$: letter = pictographData?.letter || null;
	$: gridMode = pictographData?.gridMode;
	$: pictographChecker = new PictographChecker(pictographData);

	// Component state
	let state: PictographStateType = PictographState.Initializing;
	let gridData: GridData | null = null;
	let redPropData: PropData | null = null;
	let bluePropData: PropData | null = null;
	let redArrowData: ArrowData | null = null;
	let blueArrowData: ArrowData | null = null;
	let errorMessage: string | null = null;

	// Component loading tracking
	let requiredComponents = ['grid'];
	const componentStatus: Record<string, boolean> = { grid: false };

	// Services
	let componentLoader: PictographComponentLoader;
	let componentPositioner: PictographComponentPositioner;
	let pictographGetter: PictographGetter;

	// Initialize the component
	onMount(() => {
		initializeServices();
		checkMotionData();
	});

	// Single-responsibility initialization functions
	function initializeServices() {
		pictographGetter = new PictographGetter(get(pictographDataStore));
		componentLoader = new PictographComponentLoader(pictographDataStore);
		componentPositioner = new PictographComponentPositioner(pictographDataStore);
	}

	function checkMotionData() {
		const data = get(pictographDataStore);
		if (!hasRequiredMotionData(data)) {
			state = PictographState.GridOnly;
			return;
		}
		state = PictographState.Loading;
	}

	function hasRequiredMotionData(data: PictographData) {
		return !!(data && data.redMotionData && data.blueMotionData);
	}

	// Grid loading handler
	function handleGridLoaded(data: GridData) {
		gridData = data;
		pictographDataStore.update((store) => ({ ...store, gridData: data }));
		componentStatus.grid = true;

		if (state === PictographState.GridOnly) {
			dispatch('loaded', { complete: false });
			return;
		}

		createComponents();
	}

	// Component creation & initialization
	function createComponents() {
		try {
			const data = get(pictographDataStore);
			requiredComponents = ['grid'];

			createColorComponents('red', data);
			createColorComponents('blue', data);

			// Single store update instead of multiple updates
			pictographDataStore.update((store) => ({
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

	function createColorComponents(color: PictographColor, data: PictographData) {
		const motionDataKey = `${color}MotionData` as const;
		if (!data[motionDataKey]) return;

		// Safer type handling
		const motionData = data[motionDataKey]!;
		
		if (color === 'red') {
			redPropData = componentLoader.createPropFromMotion(motionData, color);
			redArrowData = componentLoader.createArrowFromMotion(motionData, color);
			componentStatus.redProp = false;
			componentStatus.redArrow = false;
			requiredComponents.push('redProp', 'redArrow');
		} else {
			bluePropData = componentLoader.createPropFromMotion(motionData, color);
			blueArrowData = componentLoader.createArrowFromMotion(motionData, color);
			componentStatus.blueProp = false;
			componentStatus.blueArrow = false;
			requiredComponents.push('blueProp', 'blueArrow');
		}
	}

	// Component loading tracking
	function handleComponentLoaded(component: string) {
		componentStatus[component] = true;
		checkLoadingComplete();
	}

	function checkLoadingComplete() {
		const allLoaded = requiredComponents.every((component) => componentStatus[component]);
		if (allLoaded) positionComponents();
	}

	// Component positioning 
	function positionComponents() {
		try {
			if (!gridData) throw new Error('Grid data not available');

			const data = get(pictographDataStore);

			positionProps(data, gridData);
			positionArrows(data, gridData);

			// Update the store with the positioned components
			pictographDataStore.update((store) => ({
				...store,
				redPropData,
				bluePropData,
				redArrowData,
				blueArrowData
			}));

			state = PictographState.Complete;
			dispatch('loaded', { complete: true });
		} catch (error) {
			handleError('positioning', error);
		}
	}

	// Remove non-null assertions by passing gridData as parameter
	function positionProps(data: PictographData, grid: GridData) {
		if (redPropData) componentPositioner.positionProp(redPropData, grid);
		if (bluePropData) componentPositioner.positionProp(bluePropData, grid);

		applyBetaPositioningIfNeeded(data);
	}

	function applyBetaPositioningIfNeeded(data: PictographData) {
		if (redPropData && bluePropData && pictographChecker.endsWithBeta()) {
			try {
				new BetaPropPositioner(data).reposition([redPropData, bluePropData]);
			} catch (error) {
				console.warn('Beta positioning error:', error);
			}
		}
	}

	function positionArrows(data: PictographData, grid: GridData) {
		positionRedArrow(data);
		positionBlueArrow(data);

		if (redArrowData && blueArrowData && redPropData) {
			componentPositioner.positionArrows(redArrowData, blueArrowData, grid);
		}
	}

	function positionRedArrow(data: PictographData) {
		if (!redArrowData || !data.redMotion) return;

		try {
			const locationManager = new ArrowLocationManager(pictographGetter);
			const arrowLoc = locationManager.getArrowLocation(data.redMotion);
			if (arrowLoc) {
				redArrowData.loc = arrowLoc;
				const rotAngleManager = new ArrowRotAngleManager();
				redArrowData.rotAngle = rotAngleManager.updateRotation(data.redMotion, arrowLoc);
			}
		} catch (error) {
			console.warn(`Arrow location calculation error (red):`, error);
		}
	}

	function positionBlueArrow(data: PictographData) {
		if (!blueArrowData || !data.blueMotion) return;

		try {
			const locationManager = new ArrowLocationManager(pictographGetter);
			const arrowLoc = locationManager.getArrowLocation(data.blueMotion);
			if (arrowLoc) {
				blueArrowData.loc = arrowLoc;
				const rotAngleManager = new ArrowRotAngleManager();
				blueArrowData.rotAngle = rotAngleManager.updateRotation(data.blueMotion, arrowLoc);
			}
		} catch (error) {
			console.warn(`Arrow location calculation error (blue):`, error);
		}
	}

	// Error handling with better structure
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

	function handleComponentError(component: string, error: any) {
		const errorObj = {
			component,
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			timestamp: new Date().toISOString()
		};

		console.warn(`Component error (${component}):`, errorObj);

		// Try to recover with fallbacks
		applyFallbackPositioning(component);

		// Mark as loaded so we don't hang
		if (requiredComponents.includes(component)) {
			componentStatus[component] = true;
			checkLoadingComplete();
		}
	}

	// Explicit fallback system
	function applyFallbackPositioning(component: string) {
		const centerX = 475;
		const centerY = 475;

		// Apply simple offsets based on component type
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

	// UI event handling
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