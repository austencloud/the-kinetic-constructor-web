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
	import { BetaPropPositioner } from '$lib/components/PlacementManagers/PropPlacementManager/BetaPropPositioner';
	import { PictographChecker } from './PictographChecker';
	import { PictographComponentLoader } from './services/PictographComponentLoader';
	import { PictographComponentPositioner } from './services/PictographComponentPositioner';
	import { PictographGetter } from './PictographGetter';
	import ArrowRotAngleManager from '../objects/Arrow/ArrowRotAngleManager';
	import ArrowLocationManager from '../objects/Arrow/ArrowLocationManager';

	export let pictographDataStore: Writable<PictographData>;
	export let onClick: (() => void) | undefined = undefined;
	export let debug = false;

	const dispatch = createEventDispatcher<{
		loaded: { complete: boolean; error?: boolean; message?: string };
		error: { source: string; error?: any; message?: string };
	}>();

	// Create reactive declarations from store
	import type { Letter } from '$lib/types/Letter';
	$: pictographData = $pictographDataStore;
	$: letter = pictographData?.letter || null;
	$: gridMode = pictographData?.gridMode;
	$: pictographChecker = new PictographChecker(pictographData);

	type ComponentState = 'initializing' | 'grid_only' | 'loading' | 'complete' | 'error';

	let state: ComponentState = 'initializing';
	let gridData: GridData | null = null;
	let redPropData: PropData | null = null;
	let bluePropData: PropData | null = null;
	let redArrowData: ArrowData | null = null;
	let blueArrowData: ArrowData | null = null;
	let errorMessage: string | null = null;

	let requiredComponents = ['grid'];
	const componentStatus: Record<string, boolean> = { grid: false };

	let componentLoader: PictographComponentLoader;
	let componentPositioner: PictographComponentPositioner;
	let pictographGetter: PictographGetter;
	


	function hasRequiredMotionData(data: PictographData) {
		return !!(data && data.redMotionData && data.blueMotionData);
	}

	function handleGridLoaded(data: GridData) {
		gridData = data;
		pictographDataStore.update((store) => ({ ...store, gridData: data }));
		componentStatus.grid = true;

		if (state === 'grid_only') {
			dispatch('loaded', { complete: false });
			return;
		}

		createComponents();
	}

	function createComponents() {
		try {
			const data = get(pictographDataStore);
			requiredComponents = ['grid'];

			// Batch component creation by color
			if (data.redMotionData) {
				redPropData = componentLoader.createPropFromMotion(data.redMotionData, 'red');
				redArrowData = componentLoader.createArrowFromMotion(data.redMotionData, 'red');
				componentStatus.redProp = false;
				componentStatus.redArrow = false;
				requiredComponents.push('redProp', 'redArrow');
			}

			if (data.blueMotionData) {
				bluePropData = componentLoader.createPropFromMotion(data.blueMotionData, 'blue');
				blueArrowData = componentLoader.createArrowFromMotion(data.blueMotionData, 'blue');
				componentStatus.blueProp = false;
				componentStatus.blueArrow = false;
				requiredComponents.push('blueProp', 'blueArrow');
			}

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

	// Replace your onMount with this
	onMount(() => {
		pictographGetter = new PictographGetter(get(pictographDataStore));
		componentLoader = new PictographComponentLoader(pictographDataStore);
		componentPositioner = new PictographComponentPositioner(pictographDataStore);

		const data = get(pictographDataStore);
		if (!data || !data.redMotionData || !data.blueMotionData) {
			state = 'grid_only';
			return;
		}

		state = 'loading';
	});
	function handleComponentLoaded(component: string) {
		componentStatus[component] = true;
		checkLoadingComplete();
	}

	function checkLoadingComplete() {
		const allLoaded = requiredComponents.every((component) => componentStatus[component]);
		if (allLoaded) positionComponents();
	}
	function positionComponents() {
		try {
			if (!gridData) throw new Error('Grid data not available');

			// Get data just once instead of multiple calls to get()
			const data = get(pictographDataStore);

			if (redPropData) componentPositioner.positionProp(redPropData, gridData);
			if (bluePropData) componentPositioner.positionProp(bluePropData, gridData);

			// Apply beta positioning if needed
			if (redPropData && bluePropData && pictographChecker.endsWithBeta()) {
				try {
					new BetaPropPositioner(data).reposition([redPropData, bluePropData]);
				} catch (error) {
					console.warn('Beta positioning error:', error);
				}
			}

			// Position arrows using the existing positionArrows method
			// Use data reference instead of calling get() again

			// Update arrow locations first using the ArrowLocationManager
			if (redArrowData && data.redMotion) {
				try {
					const locationManager = new ArrowLocationManager(pictographGetter);
					const arrowLoc = locationManager.getArrowLocation(data.redMotion);
					if (arrowLoc) {
						redArrowData.loc = arrowLoc;

						// Calculate and set the rotation angle
						const rotAngleManager = new ArrowRotAngleManager();
						redArrowData.rotAngle = rotAngleManager.updateRotation(data.redMotion, arrowLoc);
					}
				} catch (error) {
					console.warn(`Arrow location calculation error (red):`, error);
				}
			}

			if (blueArrowData && data.blueMotion) {
				try {
					const locationManager = new ArrowLocationManager(pictographGetter);
					const arrowLoc = locationManager.getArrowLocation(data.blueMotion);
					if (arrowLoc) {
						blueArrowData.loc = arrowLoc;

						// Calculate and set the rotation angle
						const rotAngleManager = new ArrowRotAngleManager();
						blueArrowData.rotAngle = rotAngleManager.updateRotation(data.blueMotion, arrowLoc);
					}
				} catch (error) {
					console.warn(`Arrow location calculation error (blue):`, error);
				}
			}

			// Now position the arrows using the existing method
			if (redArrowData && blueArrowData && redPropData) {
				componentPositioner.positionArrows(redArrowData, blueArrowData, gridData);
			}

			// Update the store with the positioned components
			pictographDataStore.update((store) => ({
				...store,
				redPropData,
				bluePropData,
				redArrowData,
				blueArrowData
			}));

			state = 'complete';
			dispatch('loaded', { complete: true });
		} catch (error) {
			handleError('positioning', error);
		}
	}
	function handleError(source: string, error: any) {
		// Create a structured error object
		const errorObj = {
			source,
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			timestamp: new Date().toISOString()
		};

		errorMessage = errorObj.message;
		console.error(`Pictograph error [${source}]:`, errorObj);

		state = 'error';
		dispatch('error', { source, error, message: errorMessage });
		dispatch('loaded', { complete: false, error: true, message: errorMessage });
	}

	function handleComponentError(component: string, error: any) {
		// Create a structured error object
		const errorObj = {
			component,
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			timestamp: new Date().toISOString()
		};

		console.warn(`Component error (${component}):`, errorObj);

		// Mark as loaded so we don't hang
		if (requiredComponents.includes(component)) {
			componentStatus[component] = true;
			checkLoadingComplete();
		}
	}

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
		{#if state === 'initializing'}
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
		{:else if state === 'error'}
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

			{#if state !== 'grid_only'}
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
