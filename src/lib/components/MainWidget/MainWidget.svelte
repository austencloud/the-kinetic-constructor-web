<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import type { ComponentType, SvelteComponent } from 'svelte';

	// Components
	import FullScreen from '$lib/FullScreen.svelte';
	import MainLayout from './layout/MainLayout.svelte';
	import LoadingOverlay from './loading/LoadingOverlay.svelte';
	import SequenceWorkbench from '../SequenceWorkbench/Workbench.svelte';
	import BackgroundCanvas from '../Backgrounds/BackgroundCanvas.svelte';
	import BackgroundProvider from '../Backgrounds/BackgroundProvider.svelte';

	// State and Stores
	import { loadingState } from '$lib/stores/ui/loadingStore';
	import { 
		type BackgroundType,
		type TabComponentType 
	} from './state/appState';
	import {
		createActions,
		type TabChangeEvent,
		type SettingsChangeEvent,
		type EventMap,
		type AppDispatch
	} from './state/actions';
	import { 
		selectAppState, 
		selectActiveTab, 
		useSelector

	} from './state/store';

	// Utils
	import { initializeApplication } from '$lib/utils/appInitializer';

	// Declarative height from derived store
	import { windowHeight } from '$lib/stores/ui/windowStore';

	// Define performance report event type
	interface PerformanceReportEvent {
		fps: number;
		memory?: {
			used: number;
			total: number;
		};
	}

	const dispatch = createEventDispatcher<EventMap>();

	const actions = createActions(dispatch as AppDispatch);

	// Use any type to avoid component type issues
	const tabComponentOverrides = new Map<string, any>();
	tabComponentOverrides.set('construct', SequenceWorkbench);

	// Initialize background first, then the app
	let backgroundReady = false;
	let appIsLoading = $loadingState.isLoading;
	let selectedBackgroundType: BackgroundType = "snowfall";

	// Reactive variables from Redux store
	const appState = useSelector(selectAppState);
	const background = useSelector((state) => state.app.background);
	const initializationError = useSelector((state) => state.app.initializationError);

	// Sync the appIsLoading variable with the loadingState store
	$: appIsLoading = $loadingState.isLoading;

	function handleBackgroundReady(): void {
		backgroundReady = true;
		// Once background is ready, initialize the application
		initApp();
	}

	function handlePerformanceReport(event: CustomEvent<PerformanceReportEvent>): void {
		// Optional: Handle performance metrics if needed
		const fps = event.detail?.fps ?? 0;
		if (fps < 30) {
			console.warn('Low performance detected in background animation');
		}
	}

	const initApp = async (): Promise<void> => {
		try {
			const success = await initializeApplication();
			if (!success) {
				actions.setInitializationError(true);
			}
		} catch (error) {
			console.error('Application initialization failed:', error);
			actions.setInitializationError(true);
		}
	};

	const handleRetry = (): void => window.location.reload();
</script>

<div id="main-widget" style="height: {$windowHeight}" class="main-widget">
	<FullScreen on:toggleFullscreen={(e) => actions.setFullScreen(e.detail)}>
		<!-- Background ALWAYS renders first, independent of loading state -->
		<div class="background">
			<BackgroundProvider
				backgroundType={selectedBackgroundType}
				isLoading={appIsLoading}
				initialQuality={appIsLoading ? 'medium' : 'high'}
			>
				<BackgroundCanvas
					on:ready={handleBackgroundReady}
					on:performanceReport={handlePerformanceReport}
					{appIsLoading}
				/>
			</BackgroundProvider>
		</div>

		<!-- Show LoadingOverlay on top of the background during loading -->
		{#if $loadingState.isLoading}
			<LoadingOverlay
				onRetry={handleRetry}
				showInitializationError={initializationError}
			/>
		{:else}
			<!-- Main content only shown when not loading -->
			<MainLayout
				background={background}
				onSettingsClick={actions.openSettings}
				on:changeBackground={(e) => actions.updateBackground(e.detail)}
				on:tabChange={(e) => actions.changeTab(e.detail)}
			/>
		{/if}
	</FullScreen>
</div>

<style>
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
		inset: 0; /* Modern shorthand for top, right, bottom, left */
		overflow: hidden;
		z-index: 0; /* Ensure background is behind everything */
	}
</style>