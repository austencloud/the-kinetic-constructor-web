<script lang="ts">
	import type { PictographData } from '$lib/types/PictographData';
	import type { GridData } from '$lib/components/objects/Grid/GridData';
	import type { PropData } from '$lib/components/objects/Prop/PropData';
	import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
	import { PictographService } from './PictographService';
	import { svgPreloadingService } from '$lib/services/SvgPreloadingService';

	import PictographError from './components/PictographError.svelte';
	import PictographDebug from './components/PictographDebug.svelte';
	import InitializingSpinner from './components/InitializingSpinner.svelte';
	import LoadingProgress from './components/LoadingProgress.svelte';
	import PictographStateManager from './components/PictographStateManager.svelte';
	import PictographComponentRenderer from './components/PictographComponentRenderer.svelte';
	import PictographLoadingManager from './components/PictographLoadingManager.svelte';
	import PictographComponentManager from './components/PictographComponentManager.svelte';
	import PictographErrorHandler from './components/PictographErrorHandler.svelte';

	import { shouldShowDebugInfo } from './utils/PictographRenderUtils';

	const props = $props<{
		pictographData?: PictographData;
		onClick?: () => void;
		debug?: boolean;
		animationDuration?: number;
		showLoadingIndicator?: boolean;
		beatNumber?: number | null;
		isStartPosition?: boolean;
		disableAnimations?: boolean;
		onLoaded?: (result: { error: boolean }) => void;
		onError?: (error: { message: string; component: string }) => void;
	}>();

	const svgsAreReady = svgPreloadingService.isReady();
	const shouldStartReady = svgsAreReady || props.disableAnimations;

	let currentState = $state(shouldStartReady ? 'complete' : 'initializing');
	let errorMessage = $state<string | null>(null);
	let showPictograph = $state(shouldStartReady);
	let loadProgress = $state(shouldStartReady ? 100 : 0);
	
	let gridData = $state<GridData | null>(null);
	let redPropData = $state<PropData | null>(null);
	let bluePropData = $state<PropData | null>(null);
	let redArrowData = $state<ArrowData | null>(null);
	let blueArrowData = $state<ArrowData | null>(null);
	let service = $state<PictographService | null>(null);
	
	let renderCount = $state(0);
	let componentsLoaded = $state(shouldStartReady ? 1 : 0);
	let totalComponentsToLoad = $state(1);

	let stateManager = $state<PictographStateManager | null>(null);
	let loadingManager = $state<PictographLoadingManager | null>(null);
	let componentManager = $state<PictographComponentManager | null>(null);
	let errorHandler = $state<PictographErrorHandler | null>(null);

	if (shouldStartReady && props.pictographData) {
		queueMicrotask(() => {
			props.onLoaded?.({ error: false });
		});
	}

	function handleStateChange(state: string) {
		if (!shouldStartReady || state === 'error') {
			currentState = state;
		}
	}

	function handleErrorMessageChange(message: string | null) {
		errorMessage = message;
	}

	function handleServiceInitialized(newService: PictographService) {
		service = newService;
	}

	function handleGridLoaded(data: GridData) {
		gridData = data;
		if (loadingManager) {
			(loadingManager as any).handleGridLoaded(data);
		}
		componentsLoaded = Math.max(componentsLoaded, 1);
	}

	function handleComponentLoaded(component: string) {
		if (loadingManager) {
			(loadingManager as any).handleComponentLoaded(component);
		}
		componentsLoaded++;
	}

	function handleGlyphLoaded(event: CustomEvent<boolean>) {
		if (loadingManager) {
			(loadingManager as any).handleGlyphLoaded(event);
		}
	}

	function handleComponentError(component: string, error: any) {
		if (errorHandler) {
			(errorHandler as any).handleComponentError(component, error);
		} else {
			errorMessage = typeof error === 'string' ? error : error.message || 'Unknown error';
			currentState = 'error';
		}
	}

	function handleShowPictograph(show: boolean) {
		showPictograph = show || shouldStartReady;
	}

	function createAndPositionComponents() {
		if (componentManager) {
			(componentManager as any).createAndPositionComponents();
		}
	}

	function handleComponentUpdates(components: {
		redPropData: PropData | null;
		bluePropData: PropData | null;
		redArrowData: ArrowData | null;
		blueArrowData: ArrowData | null;
		requiredComponents: string[];
		totalComponentsToLoad: number;
	}) {
		redPropData = components.redPropData;
		bluePropData = components.bluePropData;
		redArrowData = components.redArrowData;
		blueArrowData = components.blueArrowData;
		totalComponentsToLoad = components.totalComponentsToLoad;

		if (loadingManager) {
			(loadingManager as any).updateRequiredComponents(components.requiredComponents);
			(loadingManager as any).updateTotalComponentsToLoad(components.totalComponentsToLoad);
		}

		renderCount++;
	}

	$effect(() => {
		if (loadingManager) {
			loadProgress = (loadingManager as any).getLoadProgress?.() ?? (shouldStartReady ? 100 : 0);
		}
	});
</script>

<PictographStateManager
	bind:this={stateManager}
	pictographData={props.pictographData}
	disableAnimations={props.disableAnimations}
	onDataInitialized={handleServiceInitialized}
	onStateChange={handleStateChange}
	onError={props.onError}
/>

<PictographLoadingManager
	bind:this={loadingManager}
	{service}
	pictographData={props.pictographData}
	disableAnimations={shouldStartReady}
	onLoaded={props.onLoaded}
	onCreateAndPositionComponents={createAndPositionComponents}
	onShowPictograph={handleShowPictograph}
	onStateChange={handleStateChange}
/>

<PictographComponentManager
	bind:this={componentManager}
	{service}
	pictographData={props.pictographData}
	{gridData}
	onUpdateComponents={handleComponentUpdates}
/>

<PictographErrorHandler
	bind:this={errorHandler}
	onError={props.onError}
	onStateChange={handleStateChange}
	onErrorMessageChange={handleErrorMessageChange}
/>

{#if props.onClick}
	<button type="button" class="pictograph-wrapper clickable" onclick={props.onClick}>
		<svg class="pictograph" viewBox="0 0 950 950" xmlns="http://www.w3.org/2000/svg">
			{#if currentState === 'initializing' && !shouldStartReady}
				{#if props.showLoadingIndicator ?? true}
					<InitializingSpinner animationDuration={props.animationDuration ?? 200} />
				{/if}
			{:else if currentState === 'error'}
				<PictographError {errorMessage} animationDuration={props.animationDuration ?? 200} />
			{:else}
				<PictographComponentRenderer
					pictographData={props.pictographData}
					{currentState}
					{showPictograph}
					{service}
					{gridData}
					{redPropData}
					{bluePropData}
					{redArrowData}
					{blueArrowData}
					debug={props.debug}
					animationDuration={shouldStartReady ? 0 : props.animationDuration}
					beatNumber={props.beatNumber}
					isStartPosition={props.isStartPosition}
					disableAnimations={shouldStartReady}
					onGridLoaded={handleGridLoaded}
					onComponentLoaded={handleComponentLoaded}
					onComponentError={handleComponentError}
					onGlyphLoaded={handleGlyphLoaded}
				/>
			{/if}
		</svg>

		{#if currentState === 'loading' && (props.showLoadingIndicator ?? true) && !shouldStartReady}
			<LoadingProgress {loadProgress} showText={true} />
		{/if}

		{#if shouldShowDebugInfo(props.debug ?? false)}
			<PictographDebug
				state={currentState}
				{componentsLoaded}
				totalComponents={totalComponentsToLoad}
				{renderCount}
			/>
		{/if}
	</button>
{:else}
	<div class="pictograph-wrapper">
		<svg class="pictograph" viewBox="0 0 950 950" xmlns="http://www.w3.org/2000/svg">
			{#if currentState === 'initializing' && !shouldStartReady}
				{#if props.showLoadingIndicator ?? true}
					<InitializingSpinner animationDuration={props.animationDuration ?? 200} />
				{/if}
			{:else if currentState === 'error'}
				<PictographError {errorMessage} animationDuration={props.animationDuration ?? 200} />
			{:else}
				<PictographComponentRenderer
					pictographData={props.pictographData}
					{currentState}
					{showPictograph}
					{service}
					{gridData}
					{redPropData}
					{bluePropData}
					{redArrowData}
					{blueArrowData}
					debug={props.debug}
					animationDuration={shouldStartReady ? 0 : props.animationDuration}
					beatNumber={props.beatNumber}
					isStartPosition={props.isStartPosition}
					disableAnimations={shouldStartReady}
					onGridLoaded={handleGridLoaded}
					onComponentLoaded={handleComponentLoaded}
					onComponentError={handleComponentError}
					onGlyphLoaded={handleGlyphLoaded}
				/>
			{/if}
		</svg>

		{#if currentState === 'loading' && (props.showLoadingIndicator ?? true) && !shouldStartReady}
			<LoadingProgress {loadProgress} showText={true} />
		{/if}

		{#if shouldShowDebugInfo(props.debug ?? false)}
			<PictographDebug
				state={currentState}
				{componentsLoaded}
				totalComponents={totalComponentsToLoad}
				{renderCount}
			/>
		{/if}
	</div>
{/if}

<style>
	.pictograph-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.pictograph {
		width: 100%;
		height: 100%;
		overflow: visible;
		background: white;
		border-radius: 4px;
	}

	.clickable {
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		font: inherit;
		color: inherit;
	}
</style>
