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
	import { loadingState } from '$lib/stores/ui/loadingStore';
	import { appState, activeTab, tabs } from './state/appState';
	import {
		createActions,
		type TabChangeEvent,
		type SettingsChangeEvent,
		type AppDispatch
	} from './state/actions';

	// Utils
	import { initializeApplication } from '$lib/utils/appInitializer';

	// NEW: Declarative dynamicHeight from derived store
	import { windowHeight } from '$lib/stores/ui/windowStore';

	const dispatch = createEventDispatcher<{
		tabChange: TabChangeEvent;
		settingsChange: SettingsChangeEvent;
	}>();

	const actions = createActions(dispatch as AppDispatch);

	// Local mutable tab component map
	const tabComponentOverrides = new Map<string, typeof SequenceWorkbench>();
	tabComponentOverrides.set('construct', SequenceWorkbench);

	onMount(() => {
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
	});

	const handleRetry = () => window.location.reload();
</script>

<div id="main-widget" style="height: {$windowHeight}" class="main-widget">
	<FullScreen on:toggleFullscreen={(e) => actions.setFullScreen(e.detail)}>
		<div class="background">
			<SnowfallBackground />
		</div>

		<MainLayout
			background={$appState.background}
			onSettingsClick={actions.openSettings}
			on:changeBackground={(e) => actions.updateBackground(e.detail)}
			on:tabChange={(e) => actions.changeTab(e.detail)}
			onRetry={handleRetry}
		/>
	</FullScreen>
</div>

<style>
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
