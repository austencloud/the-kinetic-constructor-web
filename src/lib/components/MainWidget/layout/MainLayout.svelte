<script lang="ts">
	import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
	import SettingsDialog from '$lib/components/SettingsDialog/SettingsDialog.svelte';
	import TabContent from '../tabs/TabContent.svelte';
	import { appStore } from '../state/appState';
	import { createEventDispatcher } from 'svelte';
	import SequenceInspector from '$lib/components/Developer/SequenceInspector.svelte';
	import type { BackgroundType } from '../state/appState';

	// Props with TypeScript types and defaults
	export let background: BackgroundType = 'snowfall';
	export let onSettingsClick: () => void;

	// Event dispatcher
	const dispatch = createEventDispatcher();

	// Reactive state using $ syntax
	$: isSettingsOpen = $appStore.isSettingsDialogOpen;
	$: isContentVisible = $appStore.contentVisible;
	$: isDevMode = import.meta.env.DEV;

	// Event handlers
	function handleCloseSettings() {
		appStore.closeSettings();
	}

	function handleBackgroundChange(event: CustomEvent<string>) {
		// Validate that it's a valid background type
		const validBackgrounds: BackgroundType[] = ['snowfall', 'particles', 'gradient', 'waves'];

		if (validBackgrounds.includes(event.detail as BackgroundType)) {
			// Type assertion after validation
			const background = event.detail as BackgroundType;
			dispatch('changeBackground', background);
		} else {
			console.warn(`Invalid background type: ${event.detail}. Using default.`);
			// Use a default value if invalid
			dispatch('changeBackground', 'snowfall');
		}
	}

	function handleTabChange(event: CustomEvent<{ index: number }>) {
		dispatch('tabChange', event.detail);
	}
</script>

<div class="layout-container">
	<header class="menuBar">
		<MenuBar
			{background}
			on:settingsClick={onSettingsClick}
			on:changeBackground={handleBackgroundChange}
			on:tabChange={handleTabChange}
		/>

		{#if isDevMode}
			<SequenceInspector />
		{/if}
	</header>

	<main class="mainContent" class:hidden={!isContentVisible}>
		<TabContent isVisible={isContentVisible} />
	</main>

	{#if isSettingsOpen}
		<SettingsDialog
			isOpen={isSettingsOpen}
			{background}
			on:changeBackground={handleBackgroundChange}
			onClose={handleCloseSettings}
		/>
	{/if}
</div>

<style>
	.layout-container {
		display: grid;
		grid-template-rows: auto 1fr;
		height: 100%;
		width: 100%;
		z-index: 1;

		/* Container query context for child components */
		container-type: inline-size;
		container-name: layout;
	}

	.menuBar {
		grid-row: 1;
		width: 100%;
		z-index: 2;
	}

	.mainContent {
		grid-row: 2;
		display: flex;
		position: relative;
		overflow: hidden;
		width: 100%;
		opacity: 1;
		transition: opacity 0.3s ease-in-out;
	}

	.mainContent.hidden {
		opacity: 0;
	}
</style>
