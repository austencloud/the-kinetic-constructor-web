<!-- src/lib/components/MainWidget/MainWidget.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	// Components
	import FullScreen from '$lib/FullScreen.svelte';
	import SnowfallBackground from '../SnowfallBackground.svelte';
	import MainLayout from './layout/MainLayout.svelte';
	import SequenceWorkbench from '../SequenceWorkbench/Workbench.svelte';

	// State and Stores - UPDATED IMPORTS
	import { loadingState } from '$lib/stores/ui/loadingStore'; // Updated path
	import { appState, activeTab, tabs } from './state/appState';
	import {
		createActions,
		type TabChangeEvent,
		type SettingsChangeEvent,
		type AppDispatch
	} from './state/actions';

	// Utils
	import { initializeApplication } from '$lib/utils/appInitializer';

	// ===== Event Dispatch =====
	// Create a properly typed dispatch function
	const dispatch = createEventDispatcher<{
		tabChange: TabChangeEvent;
		settingsChange: SettingsChangeEvent;
	}>();

	// Create actions with the dispatch function (cast to match the expected type)
	const actions = createActions(dispatch as AppDispatch);

	// Initialize tab components
	const initializeTabComponents = () => {
		// We need to make a mutable copy of the readonly tabs array
		const mutableTabs = [...tabs];

		// Set component references
		mutableTabs[0].component = SequenceWorkbench;

		// Other tabs remain with null components for now since they're placeholders

		// Update component references in other modules that need them
		// This is a workaround since we can't directly modify the readonly tabs array
		// In a real implementation, you might use a different approach to component registration
	};

	// CHANGE: Calculate initial height immediately to avoid layout shift
	let initialHeight = typeof window !== 'undefined' ? `${window.innerHeight}px` : '100vh';
	
	// Immediately set the initial height in appState
	if (typeof window !== 'undefined') {
		appState.update((state) => ({
			...state,
			dynamicHeight: initialHeight
		}));
	}

	// ===== Lifecycle =====
	onMount(() => {
		// Initialize tab components
		initializeTabComponents();

		// Initialize the application
		const initApp = async () => {
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

		initApp();

		// Set up window resize handler with debounce
		let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

		const handleResize = () => {
			if (resizeTimeout) {
				clearTimeout(resizeTimeout);
			}

			resizeTimeout = setTimeout(() => {
				appState.update((state) => ({
					...state,
					dynamicHeight: `${window.innerHeight}px`
				}));
			}, 100);
		};

		window.addEventListener('resize', handleResize);
		// REMOVED: Initial call to handleResize is no longer needed as we set the height earlier
		// handleResize(); 

		// Cleanup function
		return () => {
			window.removeEventListener('resize', handleResize);
			if (resizeTimeout) {
				clearTimeout(resizeTimeout);
			}
		};
	});

	// ===== Event Handlers =====
	const handleSettingsClick = () => actions.openSettings();

	const handleFullscreenToggle = (e: CustomEvent<boolean>) => actions.setFullScreen(e.detail);

	const handleTabChange = (e: CustomEvent<number>) => {
		actions.changeTab(e.detail);
	};

	const handleBackgroundChange = (e: CustomEvent<string>) => actions.updateBackground(e.detail);

	const handleRetry = () => window.location.reload();
</script>

<div id="main-widget" style="height: {$appState.dynamicHeight}" class="main-widget">
	<FullScreen on:toggleFullscreen={handleFullscreenToggle}>
		<!-- Background always loads first for visual appeal -->
		<div class="background">
			<SnowfallBackground />
		</div>

		<!-- Main content with loading state and tab management -->
		<MainLayout
			background={$appState.background}
			onSettingsClick={handleSettingsClick}
			on:changeBackground={handleBackgroundChange}
			on:tabChange={handleTabChange}
			onRetry={handleRetry}
		/>
	</FullScreen>
</div>

<style>
	/* Base layout */
	.main-widget {
		display: flex;
		flex-direction: column;
		flex: 1;
		position: relative;
		background: linear-gradient(to bottom, #0b1d2a, #325078, #49708a);
		color: light-dark(black, white);
		overflow: hidden;
	}

	.background {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: hidden;
	}
</style>