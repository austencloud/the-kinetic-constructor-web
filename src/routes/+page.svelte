<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	// Components
	import FullScreen from '$lib/AppFullScreen.svelte';
	import MainLayout from '$lib/components/MainWidget/layout/MainLayout.svelte';
	import LoadingOverlay from '$lib/components/MainWidget/loading/LoadingOverlay.svelte';
	import BackgroundCanvas from '$lib/components/Backgrounds/BackgroundCanvas.svelte';
	import BackgroundProvider from '$lib/components/Backgrounds/BackgroundProvider.svelte';

	// State Management
	import { appActions } from '$lib/state/machines/app/app.actions';
	import { useSelector } from '@xstate/svelte';
	import { appService } from '$lib/state/machines/app/app.machine';
	import { uiStore } from '$lib/state/stores/uiStore';
	import type { BackgroundType } from '$lib/components/Backgrounds/types/types';

	// Get window dimensions from UI store
	$: windowHeight = $uiStore ? $uiStore.windowHeight + 'px' : '100vh';

	// Types
	interface PerformanceReportEvent {
		fps: number;
		memory?: { used: number; total: number };
	}

	// No need for event dispatching in the main page

	// --- Get State directly from the app service ---
	const isInitializingAppStore = useSelector(appService, (state) =>
		state.matches('initializingApp')
	);
	$: isInitializingApp = $isInitializingAppStore;

	const hasFailedStore = useSelector(appService, (state) => state.matches('initializationFailed'));
	$: hasFailed = $hasFailedStore;

	const isReadyStore = useSelector(appService, (state) => state.matches('ready'));
	$: isReady = $isReadyStore;

	const currentBackgroundStore = useSelector(appService, (state) => state.context.background);
	$: currentBackground = $currentBackgroundStore as BackgroundType;

	const initializationErrorMsgStore = useSelector(
		appService,
		(state) => state.context.initializationError
	);
	$: initializationErrorMsg = $initializationErrorMsgStore as string;

	const loadingProgressStore = useSelector(appService, (state) => state.context.loadingProgress);
	$: loadingProgress = $loadingProgressStore as number;

	const loadingMessageStore = useSelector(appService, (state) => state.context.loadingMessage);
	$: loadingMessage = $loadingMessageStore as string;

	// --- Event Handlers ---
	function handleFullScreenToggle(event: CustomEvent<boolean>) {
		appActions.setFullScreen(event.detail);
	}

	function handleBackgroundChange(event: CustomEvent<string>) {
		const validBackgrounds = ['snowfall', 'nightSky'] as const;
		type ValidBackground = (typeof validBackgrounds)[number];

		if (validBackgrounds.includes(event.detail as any)) {
			appActions.updateBackground(event.detail as ValidBackground);
		}
	}

	function handleBackgroundReady() {
		appActions.backgroundReady();
	}

	function handlePerformanceReport(event: CustomEvent<PerformanceReportEvent>) {
		// Log performance metrics
		const { fps, memory } = event.detail;
		// console.log('Performance metrics:', { fps, memory });
		// Note: updatePerformanceMetrics action doesn't exist in appActions
		// We would need to add it if we want to store these metrics
	}

	function handleTabChange(event: CustomEvent<number>) {
		appActions.changeTab(event.detail);
	}

	function handleRetry() {
		appActions.retryInitialization();
	}

	// --- Lifecycle ---
	onMount(() => {
		// Log the current state for debugging

		// Force the state machine to transition
		setTimeout(() => {
			appActions.backgroundReady();
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
				<MainLayout on:changeBackground={handleBackgroundChange} on:tabChange={handleTabChange} />
			</div>
		{/if}
	</FullScreen>
</div>

<style>
	.main-widget {
		width: 100%;
		height: 100vh;
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
		transition: filter 0.3s ease-in-out;
	}

	.blur-background {
		filter: blur(5px);
	}

	.loading-overlay-wrapper {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 10;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.main-layout-wrapper {
		position: relative;
		z-index: 1;
		flex: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
	}
</style>
