<!-- src/lib/components/Pictograph/Pictograph.svelte -->
<script lang="ts">
	import type { PictographData } from '$lib/types/PictographData';
	import type { GridData } from '$lib/components/objects/Grid/GridData';
	import type { PropData } from '$lib/components/objects/Prop/PropData';
	import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
	import { PictographService } from './PictographService';

	// Component imports
	import PictographError from './components/PictographError.svelte';
	import PictographDebug from './components/PictographDebug.svelte';
	import InitializingSpinner from './components/InitializingSpinner.svelte';
	import LoadingProgress from './components/LoadingProgress.svelte';
	import PictographStateManager from './components/PictographStateManager.svelte';
	import PictographComponentRenderer from './components/PictographComponentRenderer.svelte';
	import PictographLoadingManager from './components/PictographLoadingManager.svelte';
	import PictographComponentManager from './components/PictographComponentManager.svelte';
	import PictographErrorHandler from './components/PictographErrorHandler.svelte';

	// Utility imports
	import { shouldShowDebugInfo } from './utils/PictographRenderUtils';

	// Define props using Svelte 5 runes syntax
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

	// State variables
	let currentState = $state('initializing');
	let errorMessage = $state<string | null>(null);
	let gridData = $state<GridData | null>(null);
	let redPropData = $state<PropData | null>(null);
	let bluePropData = $state<PropData | null>(null);
	let redArrowData = $state<ArrowData | null>(null);
	let blueArrowData = $state<ArrowData | null>(null);
	let loadProgress = $state(0);
	let renderCount = $state(0);
	let showPictograph = $state(props.disableAnimations ?? false);
	let service = $state<PictographService | null>(null);

	// Component references - using $state to ensure reactivity
	let stateManager = $state<PictographStateManager | null>(null);
	let loadingManager = $state<PictographLoadingManager | null>(null);
	let componentManager = $state<PictographComponentManager | null>(null);
	let errorHandler = $state<PictographErrorHandler | null>(null);

	// Track loading state for debug display
	let componentsLoaded = $state(0);
	let totalComponentsToLoad = $state(1);

	// Handle state change
	function handleStateChange(state: string) {
		currentState = state;
	}

	// Handle error message change
	function handleErrorMessageChange(message: string | null) {
		errorMessage = message;
	}

	// Handle service initialization
	function handleServiceInitialized(newService: PictographService) {
		service = newService;
	}

	// Handle grid loaded
	function handleGridLoaded(data: GridData) {
		gridData = data;
		if (loadingManager) {
			// Use type assertion to access the exposed methods
			(loadingManager as any).handleGridLoaded(data);
		}
		// Update component counts for debug display
		componentsLoaded = 1;
	}

	// Handle component loaded
	function handleComponentLoaded(component: string) {
		if (loadingManager) {
			// Use type assertion to access the exposed methods
			(loadingManager as any).handleComponentLoaded(component);
		}
		// Update component counts for debug display
		componentsLoaded++;
	}

	// Handle glyph loaded
	function handleGlyphLoaded(event: CustomEvent<boolean>) {
		if (loadingManager) {
			// Use type assertion to access the exposed methods
			(loadingManager as any).handleGlyphLoaded(event);
		}
	}

	// Handle component error
	function handleComponentError(component: string, error: any) {
		if (errorHandler) {
			// Use type assertion to access the exposed methods
			(errorHandler as any).handleComponentError(component, error);
		} else {
			// Fallback error handling
			errorMessage = typeof error === 'string' ? error : error.message || 'Unknown error';
			currentState = 'error';
		}
	}

	// Handle show pictograph
	function handleShowPictograph(show: boolean) {
		showPictograph = show;
	}

	// Create and position components
	function createAndPositionComponents() {
		if (componentManager) {
			// Use type assertion to access the exposed methods
			(componentManager as any).createAndPositionComponents();
		}
	}

	// Handle component updates
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

		// Update component counts for debug display
		totalComponentsToLoad = components.totalComponentsToLoad;

		if (loadingManager) {
			// Use type assertion to access the exposed methods
			(loadingManager as any).updateRequiredComponents(components.requiredComponents);
			(loadingManager as any).updateTotalComponentsToLoad(components.totalComponentsToLoad);
		}

		renderCount++;
	}

	// Update load progress
	$effect(() => {
		if (loadingManager) {
			// Use type assertion to access the exposed methods
			loadProgress = (loadingManager as any).getLoadProgress?.() ?? 0;
		}
	});
</script>

<!-- Component Managers (no visual output) -->
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
	disableAnimations={props.disableAnimations}
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

<!-- Visual Output -->
{#if props.onClick}
	<button type="button" class="pictograph-wrapper clickable" onclick={props.onClick}>
		<svg class="pictograph" viewBox="0 0 950 950" xmlns="http://www.w3.org/2000/svg">
			{#if currentState === 'initializing'}
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
					animationDuration={props.animationDuration}
					beatNumber={props.beatNumber}
					isStartPosition={props.isStartPosition}
					disableAnimations={props.disableAnimations}
					onGridLoaded={handleGridLoaded}
					onComponentLoaded={handleComponentLoaded}
					onComponentError={handleComponentError}
					onGlyphLoaded={handleGlyphLoaded}
				/>
			{/if}
		</svg>

		{#if currentState === 'loading' && (props.showLoadingIndicator ?? true)}
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
			{#if currentState === 'initializing'}
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
					animationDuration={props.animationDuration}
					beatNumber={props.beatNumber}
					isStartPosition={props.isStartPosition}
					disableAnimations={props.disableAnimations}
					onGridLoaded={handleGridLoaded}
					onComponentLoaded={handleComponentLoaded}
					onComponentError={handleComponentError}
					onGlyphLoaded={handleGlyphLoaded}
				/>
			{/if}
		</svg>

		{#if currentState === 'loading' && (props.showLoadingIndicator ?? true)}
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
