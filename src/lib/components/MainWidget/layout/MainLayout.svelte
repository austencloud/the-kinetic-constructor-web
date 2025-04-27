<script lang="ts">
	import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
	import TabContent from '../tabs/TabContent.svelte';
	import { createEventDispatcher } from 'svelte';
	import SequenceInspector from '$lib/components/Developer/SequenceInspector.svelte';
	import SettingsContent from '$lib/components/SettingsDialog/SettingsContent.svelte';
	import { appActions } from '$lib/state/machines/app/app.actions';
	import { useSelector } from '@xstate/svelte';
	import { appService } from '$lib/state/machines/app/app.machine';

	// --- Props & Events ---

	// --- Events Emitted Up ---
	const dispatch = createEventDispatcher<{
		changeBackground: string;
	}>();

	// --- Get State from App State Machine ---
	const isSettingsOpenStore = useSelector(appService, (state) => state.context.isSettingsOpen);
	$: isSettingsDialogOpen = $isSettingsOpenStore;

	// Get active tab data from the tabs array
	import { tabs } from '$lib/components/MainWidget/state/appState';
	const currentTabIndexStore = useSelector(appService, (state) => state.context.currentTab);
	$: currentTabIndex = $currentTabIndexStore as number;
	$: activeTabData =
		currentTabIndex >= 0 && currentTabIndex < tabs.length ? tabs[currentTabIndex] : null;

	// --- Event Handlers ---
	function handleToggleSettings() {
		// Toggle settings dialog
		if (isSettingsDialogOpen) {
			appActions.closeSettings();
		} else {
			appActions.openSettings();
		}
	}

	// This function will be passed down as a prop.
	function handleBackgroundChange(event: CustomEvent<string>) {
		const newBackground = event.detail;
		if (newBackground === 'snowfall') {
			appActions.updateBackground('snowfall');
			dispatch('changeBackground', 'snowfall');
		} else {
			console.warn(`Invalid background type requested: ${newBackground}. Using default.`);
			appActions.updateBackground('snowfall');
			dispatch('changeBackground', 'snowfall');
		}
	}

	// Get the current section name based on active tab
	$: currentSection = activeTabData ? activeTabData.title : 'Construct';
</script>

<div class="content">
	<div class="menuBar">
		<MenuBar on:openSettings={handleToggleSettings} on:changeBackground={handleBackgroundChange} />
		{#if import.meta.env.DEV}
			<SequenceInspector />
		{/if}
	</div>

	<div class="mainContent">
		<TabContent />
	</div>

	{#if isSettingsDialogOpen}
		<div class="settingsContent">
			<SettingsContent {currentSection} onClose={() => appActions.closeSettings()} />
		</div>
	{/if}
</div>

<style>
	.content {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		z-index: 1;
		width: 100%;
	}
	.mainContent {
		display: flex;
		flex: 1;
		overflow: hidden;
		position: relative;
		z-index: 0;
		width: 100%;
		opacity: 1;
	}
	.settingsContent {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 10;
	}
	.menuBar {
		padding: 5px 10px;
	}
</style>
