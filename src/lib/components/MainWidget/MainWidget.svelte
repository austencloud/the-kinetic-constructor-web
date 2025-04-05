<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import type { ComponentType, SvelteComponent } from 'svelte';

	// Components
	import FullScreen from '$lib/FullScreen.svelte';
	import MainLayout from './layout/MainLayout.svelte';
	import LoadingOverlay from './loading/LoadingOverlay.svelte';
	import BackgroundCanvas from '../Backgrounds/BackgroundCanvas.svelte';
	import BackgroundProvider from '../Backgrounds/BackgroundProvider.svelte';

	// State (XState)
	import { appService } from './state/store'; // Import the XState service/actor
	import { useSelector } from '@xstate/svelte'; // Use the selector from the adapter
	import { actions } from './state/actions'; // Import refactored actions
	import type { BackgroundType } from './state/appState';

	// Utils (Keep if needed, but initialization is now in the machine)
	// import { initializeApplication } from '$lib/utils/appInitializer'; // No longer called directly here

	// Window Store (Keep if needed for height separate from app logic)
	import { windowHeight } from '$lib/stores/ui/windowStore';

	// Types
	interface PerformanceReportEvent {
		fps: number;
		memory?: { used: number; total: number };
	}

	type Events = {
		tabChange: { index: number; id: string }; // Keep events dispatched *out* of the widget
		changeBackground: string;
		toggleFullscreen: boolean;
	};

	const dispatch = createEventDispatcher<Events>();

	// --- Get State from XState ---
	// Use selectors from the adapter
	const state = useSelector(appService, (snapshot) => snapshot); // Get the whole state snapshot
	// Or select specific parts if preferred (using selectors from store.ts)
	// const context = useSelector(appService, s => s.context);
	// const matches = (query: string) => useSelector(appService, s => s.matches(query));

	// Derive reactive variables from the state snapshot
	$: isInitializing = $state.matches('initializing');
	$: hasFailed = $state.matches('initializationFailed');
	$: isReady = $state.matches('ready');
	$: currentBackground = $state.context.background;
	$: initializationErrorMsg = $state.context.initializationError;
	$: loadingProgress = $state.context.loadingProgress;
	$: loadingMessage = $state.context.loadingMessage;
	$: currentTab = $state.context.currentTab; // Needed for dispatching event out

	// --- Event Handlers ---
	function handleFullScreenToggle(event: CustomEvent<boolean>) {
		actions.setFullScreen(event.detail); // Assumes TOGGLE_FULLSCREEN event
		dispatch('toggleFullscreen', event.detail);
	}

	function handleBackgroundChange(event: CustomEvent<string>) {
		actions.updateBackground(event.detail);
		dispatch('changeBackground', event.detail);
	}

	function handleTabChange(event: CustomEvent<{ index: number }>) {
		const newIndex = event.detail.index;
		actions.changeTab(newIndex);
		// Dispatch out immediately (machine handles internal state)
		// You might want to dispatch out based on state changes instead if needed
		// This requires subscribing to the service directly or using reactive statements on selectors
		// dispatch('tabChange', { index: newIndex, id: tabs[newIndex].id }); // Dispatch requires tabs import
	}

	// Watch for context changes to dispatch external events if needed
	// Example: Dispatch tabChange *after* the machine context updates
	// $: dispatch('tabChange', { index: $state.context.currentTab, id: tabs[$state.context.currentTab].id });

	function handleRetry(): void {
		actions.retryInitialization();
	}

	function handleBackgroundReady(): void {
		// This might not be strictly necessary if the background
		// rendering doesn't gate the main app initialization.
		// The machine now controls the initialization flow.
		console.log('Background Canvas Ready');
	}

	function handlePerformanceReport(event: CustomEvent<PerformanceReportEvent>): void {
		const fps = event.detail?.fps ?? 0;
		if (fps < 30) {
			console.warn('Low performance detected in background animation');
		}
	}

	// --- Lifecycle ---
	onMount(() => {
		// Service is started in store.ts
		// No need to explicitly call initializeApplication here
		// The machine handles it via its invoke definition.
	});
</script>

<div id="main-widget" style="height: {$windowHeight}" class="main-widget">
	<FullScreen on:toggleFullscreen={handleFullScreenToggle}>
		<div class="background">
			<BackgroundProvider
				backgroundType={currentBackground ?? 'snowfall'}
				isLoading={isInitializing || hasFailed}
				initialQuality={isInitializing || hasFailed ? 'medium' : 'high'}
			>
				<BackgroundCanvas
					on:ready={handleBackgroundReady}
					on:performanceReport={handlePerformanceReport}
					appIsLoading={isInitializing || hasFailed}
				/>
			</BackgroundProvider>
		</div>

		{#if isInitializing || hasFailed}
			<LoadingOverlay
				message={loadingMessage}
				progress={loadingProgress}
				onRetry={handleRetry}
				showInitializationError={hasFailed}
				errorMessage={initializationErrorMsg}
			/>
		{/if}

		{#if isReady}
			<MainLayout
				background={currentBackground}
				onSettingsClick={actions.openSettings}
				on:changeBackground={handleBackgroundChange}
				on:tabChange={handleTabChange}
			/>
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
	}
	.background {
		position: absolute;
		inset: 0;
		overflow: hidden;
		z-index: 0;
	}
</style>
