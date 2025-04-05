<script lang="ts">
	import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
	import SettingsDialog from '$lib/components/SettingsDialog/SettingsDialog.svelte';
	import TabContent from '../tabs/TabContent.svelte';
	import { createEventDispatcher } from 'svelte';
	import SequenceInspector from '$lib/components/Developer/SequenceInspector.svelte';

	// --- XState Imports ---
	import { appService } from '../state/store'; // Import service
	import { useSelector } from '@xstate/svelte'; // Import selector hook
	import { actions } from '../state/actions'; // Import refactored actions

	// --- Props & Events ---
	// The background prop might still be useful if passed down from MainWidget,
	// or it could be selected directly here. Let's keep it passed down for now.
	export let background: string;
	export let onSettingsClick: () => void; // Keep as prop, triggered from MainWidget via actions

	// Events emitted *up* from this component to MainWidget
	const dispatch = createEventDispatcher<{
		changeBackground: string;
		tabChange: { index: number };
	}>();

	// --- Get State from XState ---
	const state = useSelector(appService, s => s); // Get full snapshot
	// Or select specific context values:
	// const isSettingsDialogOpen = useSelector(appService, s => s.context.isSettingsOpen);
	// const contentVisible = useSelector(appService, s => s.context.contentVisible);

	// Reactive vars from snapshot
	$: isSettingsDialogOpen = $state.context.isSettingsOpen;
	$: contentVisible = $state.context.contentVisible; // Use machine's visibility flag

	// --- Event Handlers ---
	function handleCloseSettings() {
		// Send event to the machine via actions
		actions.closeSettings();
	}

	function handleBackgroundChange(event: CustomEvent<string>) {
		// Validate background type (Keep validation logic)
		const validBackgrounds = ['snowfall'];
		const requestedBackground = event.detail;
		const backgroundType = requestedBackground.toLowerCase();

		if (validBackgrounds.includes(backgroundType)) {
			// Dispatch up to MainWidget, which will call the action
			dispatch('changeBackground', backgroundType);
		} else {
			console.warn(`Invalid background type: ${requestedBackground}. Using default.`);
			// Dispatch default up to MainWidget
			dispatch('changeBackground', 'snowfall');
		}
	}

	function handleTabChange(event: CustomEvent<{ index: number }>) {
		// Dispatch up to MainWidget
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

	<div class="mainContent" class:hidden={!contentVisible}>
        <TabContent />
    </div>

	{#if isSettingsDialogOpen}
		<SettingsDialog
			isOpen={isSettingsDialogOpen}
			{background}
			on:changeBackground={handleBackgroundChange}
			onClose={handleCloseSettings}
		/>
	{/if}
</div>

<style>
	.content { display: flex; flex-direction: column; flex: 1; min-height: 0; z-index: 1; }
	.mainContent { display: flex; flex: 1; overflow: hidden; position: relative; z-index: 0; width: 100%; opacity: 1; transition: opacity 0.3s ease; }
	.mainContent.hidden { opacity: 0; }
</style>