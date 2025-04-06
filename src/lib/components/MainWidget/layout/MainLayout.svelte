<script lang="ts">
	import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
	import SettingsDialog from '$lib/components/SettingsDialog/SettingsDialog.svelte';
	import TabContent from '../tabs/TabContent.svelte';
	import { createEventDispatcher } from 'svelte';
	import SequenceInspector from '$lib/components/Developer/SequenceInspector.svelte';

	// --- XState Imports ---
	import { selectIsSettingsOpen, selectContentVisible } from '../state/store';
	import { actions } from '../state/actions';

	// --- Props & Events ---
	export let background: string;
	export let onSettingsClick: () => void;

	// --- Events Emitted Up ---
	// Adjust the event type here if needed, though dispatching 'tabChange' is fine
	const dispatch = createEventDispatcher<{
		changeBackground: string;
		tabChange: number; // Dispatching the index number directly
	}>();

	// --- Get State from XState using specific selectors ---
	const isSettingsDialogOpen = selectIsSettingsOpen();
	// const contentVisible = selectContentVisible(); // Still using simplified version

	// --- Event Handlers ---
	function handleCloseSettings() {
		actions.closeSettings();
	}

	function handleBackgroundChange(event: CustomEvent<string>) {
		const validBackgrounds = ['snowfall'];
		const requestedBackground = event.detail;
		const backgroundType = requestedBackground.toLowerCase();
		if (validBackgrounds.includes(backgroundType)) {
			dispatch('changeBackground', backgroundType);
		} else {
			console.warn(`Invalid background type: ${requestedBackground}. Using default.`);
			dispatch('changeBackground', 'snowfall');
		}
	}

	// *** FIX: Update handler signature and dispatch call ***
	function handleTabChange(event: CustomEvent<number>) {
		// Directly dispatch the received number (index)
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

	<div class="mainContent">
		<TabContent />
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
	/* Styles remain the same */
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
</style>
