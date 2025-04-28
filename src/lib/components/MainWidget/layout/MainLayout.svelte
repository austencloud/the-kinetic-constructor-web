<script lang="ts">
	import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
	import TabContent from '../tabs/TabContent.svelte';
	import { createEventDispatcher } from 'svelte';
	import DeveloperTools from '$lib/components/Developer/DeveloperTools.svelte';
	import SettingsContent from '$lib/components/SettingsDialog/SettingsContent.svelte';
	import { appActions } from '$lib/state/machines/app/app.actions';
	import { useSelector } from '@xstate/svelte';
	import { appService } from '$lib/state/machines/app/app.machine';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut, quintOut } from 'svelte/easing';

	// --- Props & Events ---

	// --- Events Emitted Up ---
	const dispatch = createEventDispatcher<{
		changeBackground: string;
	}>();

	// --- Get State from App State Machine ---
	const isSettingsOpenStore = useSelector(appService, (state) => state.context.isSettingsOpen);
	$: isSettingsDialogOpen = $isSettingsOpenStore;

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

	// Handle backdrop keyboard events for accessibility
	function handleBackdropKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
			appActions.closeSettings();
		}
	}
</script>

<div class="content">
	<div class="menuBar">
		<MenuBar on:openSettings={handleToggleSettings} on:changeBackground={handleBackgroundChange} />
	</div>

	<div class="mainContent">
		<TabContent />
	</div>

	{#if isSettingsDialogOpen}
		<div
			class="settingsBackdrop"
			transition:fade={{ duration: 300, easing: cubicOut }}
			on:click={() => appActions.closeSettings()}
			on:keydown={handleBackdropKeydown}
			role="button"
			tabindex="0"
			aria-label="Close settings"
		></div>
		<div
			class="settingsContent"
			in:fly={{ y: 20, duration: 400, delay: 100, easing: quintOut }}
			out:fade={{ duration: 200, easing: cubicOut }}
		>
			<SettingsContent onClose={() => appActions.closeSettings()} />
		</div>
	{/if}

	{#if import.meta.env.DEV}
		<DeveloperTools />
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
	.settingsBackdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		z-index: 9;
		cursor: pointer;
	}

	.settingsContent {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 90%;
		max-width: 800px;
		max-height: 90vh;
		border-radius: 12px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
		z-index: 10;
		overflow: hidden;
	}
	.menuBar {
		padding: 5px 0; /* Remove horizontal padding */
		width: 100%; /* Ensure full width */
	}
</style>
