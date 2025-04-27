<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';

	// Components
	import FullScreen from '$lib/FullScreen.svelte';
	import MainLayout from './layout/MainLayout.svelte';
	import LoadingOverlay from './loading/LoadingOverlay.svelte';
	import BackgroundCanvas from '../Backgrounds/BackgroundCanvas.svelte';
	import BackgroundProvider from '../Backgrounds/BackgroundProvider.svelte';

	// State Management
	import { appSelectors, appActions } from '$lib/state/machines/appMachine';
	import { uiStore } from '$lib/state/stores/uiStore';

	// Get window dimensions from UI store
	$: windowHeight = $uiStore ? $uiStore.windowHeight + 'px' : '100vh';

	// Types
	interface PerformanceReportEvent {
		fps: number;
		memory?: { used: number; total: number };
	}
	// Adjust event map if needed, though dispatching 'tabChange' is internal here
	type Events = {
		// tabChange: { index: number; id: string }; // This component dispatches other events upwards
		changeBackground: string;
		toggleFullscreen: boolean;
	};

	const dispatch = createEventDispatcher<Events>();

	// --- Get State from the app state machine ---
	$: isLoading = appSelectors.isLoading();
	$: isInitializingApp = appSelectors.isInitializingApp();
	$: hasFailed = appSelectors.hasInitializationFailed();
	$: isReady = appSelectors.isReady();
	$: currentBackground = appSelectors.background();
	$: initializationErrorMsg = appSelectors.initializationError();
	$: loadingProgress = appSelectors.loadingProgress();
	$: loadingMessage = appSelectors.loadingMessage();

	// --- Event Handlers ---
	function handleFullScreenToggle(event: CustomEvent<boolean>) {
		appActions.setFullScreen(event.detail);
		dispatch('toggleFullscreen', event.detail);
	}
	function handleBackgroundChange(event: CustomEvent<string>) {
		appActions.updateBackground(event.detail);
		dispatch('changeBackground', event.detail);
	}

	function handleTabChange(event: CustomEvent<number>) {
		// Update the app state machine
		appActions.changeTab(event.detail);
	}

	function handleRetry(): void {
		appActions.retryInitialization();
	}
	function handleBackgroundReady(): void {
		appActions.backgroundReady();
	}
	function handlePerformanceReport(event: CustomEvent<PerformanceReportEvent>): void {
		const fps = event.detail?.fps ?? 0;
		if (fps < 30) {
			console.warn('Low performance detected in background animation');
		}
	}

	// --- Lifecycle ---
	onMount(() => {
		// Log the current state for debugging
		console.log('MainWidget mounted');
		console.log('App state:', appSelectors.isReady() ? 'ready' : 'not ready');
		console.log('Loading state:', appSelectors.isLoading() ? 'loading' : 'not loading');
		console.log('Background:', appSelectors.background());

		// Force the state machine to transition
		setTimeout(() => {
			console.log('Triggering background ready');
			appActions.backgroundReady();

			// Force a UI update
			isLoading = appSelectors.isLoading();
			isInitializingApp = appSelectors.isInitializingApp();
			hasFailed = appSelectors.hasInitializationFailed();
			isReady = appSelectors.isReady();
			currentBackground = appSelectors.background();
			initializationErrorMsg = appSelectors.initializationError();
			loadingProgress = appSelectors.loadingProgress();
			loadingMessage = appSelectors.loadingMessage();
		}, 500);
	});
</script>

<div id="main-widget" style="height: {windowHeight}" class="main-widget">
	<FullScreen on:toggleFullscreen={handleFullScreenToggle}>
		<div class="background" class:blur-background={isInitializingApp || hasFailed}>
			<BackgroundProvider
				backgroundType={currentBackground || 'snowfall'}
				isLoading={isInitializingApp || hasFailed}
				initialQuality={isInitializingApp || hasFailed ? 'medium' : 'high'}
			>
				<BackgroundCanvas
					appIsLoading={isInitializingApp || hasFailed}
					on:ready={handleBackgroundReady}
					on:performanceReport={handlePerformanceReport}
				/>
			</BackgroundProvider>
		</div>

		{#if isInitializingApp || hasFailed}
			<div class="loading-overlay-wrapper" transition:fade={{ duration: 300 }}>
				<LoadingOverlay
					message={loadingMessage}
					progress={loadingProgress}
					onRetry={handleRetry}
					showInitializationError={hasFailed}
					errorMessage={initializationErrorMsg}
				/>
			</div>
		{/if}

		{#if isReady}
			<div class="main-layout-wrapper" transition:fade={{ duration: 500, delay: 100 }}>
				<MainLayout
					background={currentBackground}
					on:changeBackground={handleBackgroundChange}
					on:tabChange={handleTabChange}
				/>
			</div>
		{/if}
	</FullScreen>
</div>

<style>
	/* Styles remain the same */
	.main-widget {
		display: flex;
		flex-direction: column;
		flex: 1;
		position: relative;
		color-scheme: light dark;
		color: light-dark(black, white);
		overflow: hidden;
		background-color: rgb(11, 29, 42);
	}

	.background {
		position: absolute;
		inset: 0;
		overflow: hidden;
		z-index: 0;
		transition: filter 0.3s ease-in-out;
		filter: blur(0px);
	}
	.background.blur-background {
		filter: blur(4px);
	}
	.loading-overlay-wrapper {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 999;
	}
	.main-layout-wrapper {
		flex: 1;
		display: flex;
		min-height: 0;
		position: relative;
		z-index: 1;
	}
</style>
