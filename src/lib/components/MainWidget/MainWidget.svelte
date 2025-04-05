<script lang="ts">
	// Use $ syntax for reactive declarations
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

	// Use the enhanced store directly
	import { loadingState } from '$lib/stores/ui/loadingStore';
	import {
		appStore, // Now using our enhanced store
		TABS,
		type BackgroundType,
		type TabId
	} from './state/appState';

	// Utils
	import { initializeApplication } from '$lib/utils/appInitializer';

	// Using the reactive $ syntax for windowHeight
	import { windowHeight } from '$lib/stores/ui/windowStore';

	// Define types
	interface PerformanceReportEvent {
		fps: number;
		memory?: {
			used: number;
			total: number;
		};
	}

	type EventMap = {
		tabChange: { index: number; id: TabId };
		settingsChange: { background: BackgroundType };
	};

	const dispatch = createEventDispatcher<EventMap>();

	// Component registry using Map with more permissive typing
	const tabComponents = new Map<TabId, any>();
	tabComponents.set('construct', SequenceWorkbench);

	// Alternatively, you can use a type assertion if you want to maintain stricter typing:
	// tabComponents.set('construct', SequenceWorkbench as unknown as ComponentType<SvelteComponent>);

	// State variables with reactive declarations
	let backgroundReady = false;
	let selectedBackgroundType: BackgroundType = 'snowfall';
	$: appIsLoading = $loadingState.isLoading;
	$: appState = $appStore;

	// Lifecycle method
	onMount(async () => {
		// Component is now mounted - can add any initialization here
	});

	// Event handlers
	function handleBackgroundReady() {
		backgroundReady = true;
		initApp();
	}

	function handlePerformanceReport(event: CustomEvent<PerformanceReportEvent>) {
		// Using optional chaining and nullish coalescing for safer code
		const fps = event.detail?.fps ?? 0;
		// Could dispatch performance metrics to parent if needed
	}

	async function initApp() {
		try {
			const success = await initializeApplication();
			if (!success) {
				appStore.setInitializationError(true);
			}
		} catch (error) {
			console.error('Application initialization failed:', error);
			appStore.setInitializationError(true);
		}
	}

	function handleRetry() {
		window.location.reload();
	}

	// Event forwarding handlers
	function handleTabChange(event: CustomEvent<{ index: number }>) {
		const tabId = TABS[event.detail.index].id;
		dispatch('tabChange', {
			index: event.detail.index,
			id: tabId
		});
	}

	function handleBackgroundChange(event: CustomEvent<BackgroundType>) {
		appStore.updateBackground(event.detail);
		dispatch('settingsChange', {
			background: event.detail
		});
	}
</script>

<div id="main-widget" style:height={$windowHeight} class="main-widget">
	<FullScreen on:toggleFullscreen={(e) => appStore.setFullScreen(e.detail)}>
		<!-- Background container -->
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

		<!-- Conditional content rendering with transitions -->
		{#if appIsLoading}
			<LoadingOverlay
				onRetry={handleRetry}
				showInitializationError={appState.initializationError}
			/>
		{:else}
			<MainLayout
				background={appState.background}
				onSettingsClick={() => appStore.openSettings()}
				on:changeBackground={handleBackgroundChange}
				on:tabChange={handleTabChange}
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
		/* Using modern CSS color-mix for gradients */
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, #0b1d2a 80%, black),
			color-mix(in srgb, #325078 70%, #49708a),
			#49708a
		);
		/* Using the modern color-scheme and light-dark() function */
		color-scheme: light dark;
		color: light-dark(#000, #fff);
		overflow: hidden;
	}

	.background {
		position: absolute;
		inset: 0; /* Modern shorthand for top, right, bottom, left */
		overflow: hidden;
		z-index: 0;
	}
</style>
