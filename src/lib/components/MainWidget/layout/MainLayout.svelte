<script lang="ts">
	import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
	import SettingsDialog from '$lib/components/SettingsDialog/SettingsDialog.svelte';
	import TabContent from '../tabs/TabContent.svelte';
	import { appState } from '../state/appState';
	import { derived } from 'svelte/store';
	import { createEventDispatcher } from 'svelte';
	import SequenceInspector from '$lib/components/Developer/SequenceInspector.svelte';
	import type { BackgroundType } from '../state/appState';

	// Props with TypeScript types
	export let background: string = 'Snowfall';
	export let onSettingsClick: () => void;

	const dispatch = createEventDispatcher();

	// Keep your original store derivations
	const isSettingsDialogOpen = derived(appState, (s) => s.isSettingsDialogOpen);
	const contentVisible = derived(appState, (s) => s.contentVisible);

	// Event handlers with improved type safety
	function handleCloseSettings() {
		appState.update((s) => ({ ...s, isSettingsDialogOpen: false }));
	}
	
	function handleBackgroundChange(event: CustomEvent<string>) {
		// Validate background type
		const validBackgrounds = ['snowfall', 'particles', 'gradient', 'waves'];
		
		if (validBackgrounds.includes(event.detail.toLowerCase())) {
			dispatch('changeBackground', event.detail);
		} else {
			console.warn(`Invalid background type: ${event.detail}. Using default.`);
			dispatch('changeBackground', 'Snowfall');
		}
	}
	
	function handleTabChange(event: CustomEvent<{ index: number }>) {
		dispatch('tabChange', event.detail);
	}
</script>

<div class="content">
	<div class="menuBar">
		<MenuBar
			{background}
			on:settingsClick={onSettingsClick}
			on:changeBackground={handleBackgroundChange}
			on:tabChange={handleTabChange}
		/>
		{#if import.meta.env.DEV}
			<SequenceInspector />
		{/if}
	</div>

	<div class="mainContent" class:hidden={!$contentVisible}>
		<TabContent isVisible={$contentVisible} />
	</div>

	{#if $isSettingsDialogOpen}
		<SettingsDialog
			isOpen={$isSettingsDialogOpen}
			{background}
			on:changeBackground={handleBackgroundChange}
			onClose={handleCloseSettings}
		/>
	{/if}
</div>

<style>
	/* Keep your original flex layout but with improved properties */
	.content {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		z-index: 1;
	}

	.mainContent {
		display: flex;
		flex: 1;
		overflow: hidden;
		position: relative;
		z-index: 0;
		width: 100%;
		opacity: 1;
		transition: opacity 0.3s ease;
	}

	.mainContent.hidden {
		opacity: 0;
	}
</style>