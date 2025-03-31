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
	import { PictographService } from './services/PictographService';
	import { fade, scale } from 'svelte/transition';
	import { DIAMOND } from '$lib/types/Constants';

	import PictographLoading from './components/PictographLoading.svelte';
	import PictographError from './components/PictographError.svelte';
	import PictographDebug from './components/PictographDebug.svelte';

	export let pictographDataStore: Writable<PictographData>;
	export let onClick: (() => void) | undefined = undefined;
	export let debug = false;
	export let animationDuration = 300;
	export let showLoadingIndicator = true;

	const dispatch = createEventDispatcher<{
		loaded: { complete: boolean; error?: boolean; message?: string };
		error: { source: string; error?: any; message?: string };
		componentLoaded: { componentName: string };
	}>();

	const PictographState = {
		Initializing: 'initializing',
		GridOnly: 'grid_only',
		Loading: 'loading',
		Complete: 'complete',
		Error: 'error'
	} as const;

	type PictographStateType = (typeof PictographState)[keyof typeof PictographState];
	$: pictographData = $pictographDataStore;
	$: letter = pictographData?.letter || null;
	$: gridMode = pictographData?.gridMode || DIAMOND;

	let state: PictographStateType = PictographState.Initializing;
	let gridData: GridData | null = null;
	let redPropData: PropData | null = null;
	let bluePropData: PropData | null = null;
	let redArrowData: ArrowData | null = null;
	let blueArrowData: ArrowData | null = null;
	let errorMessage: string | null = null;
	let service: PictographService;
	let renderCount = 0;

	let loadedComponents = new Set<string>();
	let requiredComponents: string[] = ['grid'];
	let totalComponentsToLoad = 1;
	let componentsLoaded = 0;
	let loadProgress = 0;

	$: pictographAriaLabel = getPictographAriaLabel();
	$: interactiveProps = onClick
		? {
				role: 'button',
				tabIndex: 0,
				'aria-label': `Pictograph for letter ${letter || 'unknown'}`
			}
		: {};

	function getPictographAriaLabel(): string {
		if (state === PictographState.Error) {
			return `Pictograph error: ${errorMessage}`;
		}

		const letterPart = letter ? `for letter ${letter}` : '';
		const statePart = state === PictographState.Complete ? 'complete' : 'loading';
		return `Pictograph visualization ${letterPart} - ${statePart}`;
	}

	onMount(() => {
		const startTime = performance.now();

		try {
			service = new PictographService(get(pictographDataStore));

			if (hasRequiredMotionData(get(pictographDataStore))) {
				state = PictographState.Loading;
				console.debug('Pictograph: Motion data available, entering loading state');
			} else {
				state = PictographState.GridOnly;
				console.debug('Pictograph: No motion data, entering grid-only state');
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

	function hasRequiredMotionData(data: PictographData): boolean {
		return Boolean(data?.redMotionData || data?.blueMotionData);
	}

	function handleGridLoaded(data: GridData) {
		try {
			gridData = data;
			componentsLoaded++;
			updateLoadProgress();

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

	function createAndPositionComponents() {
		try {
			const data = get(pictographDataStore);

			requiredComponents = ['grid'];
			totalComponentsToLoad = 1;

			if (data.redMotionData) {
				redPropData = service.createPropData(data.redMotionData, 'red');
				redArrowData = service.createArrowData(data.redMotionData, 'red');
				requiredComponents.push('redProp', 'redArrow');
				totalComponentsToLoad += 2;
			}

			if (data.blueMotionData) {
				bluePropData = service.createPropData(data.blueMotionData, 'blue');
				blueArrowData = service.createArrowData(data.blueMotionData, 'blue');
				requiredComponents.push('blueProp', 'blueArrow');
				totalComponentsToLoad += 2;
			}

			if (gridData) {
				service.positionComponents(
					redPropData,
					bluePropData,
					redArrowData,
					blueArrowData,
					gridData
				);
			}

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

	function handleComponentLoaded(component: string) {
		loadedComponents.add(component);
		componentsLoaded++;
		updateLoadProgress();
		dispatch('componentLoaded', { componentName: component });
		checkLoadingComplete();
	}

	function updateLoadProgress() {
		loadProgress = Math.floor((componentsLoaded / Math.max(totalComponentsToLoad, 1)) * 100);
	}

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

	function handleComponentError(component: string, error: any) {
		if (debug) console.warn(`Component error (${component}):`, error);

		applyFallbackPositioning(component);

		loadedComponents.add(component);
		componentsLoaded++;
		updateLoadProgress();

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

		if (debug) {
			console.error(`Pictograph error [${source}]:`, errorObj);
		} else {
			console.error(`Pictograph error: ${errorMessage}`);
		}

		state = PictographState.Error;
		dispatch('error', { source, error, message: errorMessage });
		dispatch('loaded', { complete: false, error: true, message: errorMessage });
	}

	function handleWrapperClick() {
		if (onClick) onClick();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (onClick && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
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
				<PictographLoading {animationDuration} initializing={true} />
			{/if}
		{:else if state === PictographState.Error}
			<PictographError {errorMessage} {animationDuration} />
		{:else}
			<Grid
				{gridMode}
				onPointsReady={handleGridLoaded}
				on:error={(e) => handleComponentError('grid', e.detail)}
				{debug}
			/>

			{#if state !== PictographState.GridOnly}
				{#if letter}
					<g in:fade={{ duration: animationDuration, delay: 100 }}>
						<TKAGlyph {letter} turnsTuple="(s, 0, 0)" x={50} y={800} />
					</g>
				{/if}

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

	{#if state === PictographState.Loading && showLoadingIndicator}
		<PictographLoading {loadProgress} {animationDuration} showText={true} initializing={false} />
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

	.pictograph-wrapper[data-state='error'] .pictograph {
		border-color: #fc8181;
		box-shadow: 0 0 0 1px #fc8181;
	}

	.pictograph-wrapper[data-state='complete'] .pictograph {
		border-color: #48bb78;
	}
</style>
