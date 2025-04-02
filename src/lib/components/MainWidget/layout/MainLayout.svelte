<!-- src/lib/components/MainWidget/layout/MainLayout.svelte -->
<script lang="ts">
	import { loadingState } from '$lib/stores/ui/loadingStore';
	import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
	import LoadingOverlay from '../loading/LoadingOverlay.svelte';
	import SettingsDialog from '$lib/components/SettingsDialog/SettingsDialog.svelte';
	import TabContent from '../tabs/TabContent.svelte';
	import { appState } from '../state/appState';
	import { derived } from 'svelte/store';
	import { createEventDispatcher } from 'svelte';

	export let background: string = 'Snowfall';
	export let onSettingsClick: () => void;
	export let onRetry: () => void;

	const dispatch = createEventDispatcher();

	const isSettingsDialogOpen = derived(appState, (s) => s.isSettingsDialogOpen);
	const contentVisible = derived(appState, (s) => s.contentVisible);
	const initializationError = derived(appState, (s) => s.initializationError);

	const handleCloseSettings = () => {
		appState.update((s) => ({ ...s, isSettingsDialogOpen: false }));
	};
</script>

{#if $loadingState.isLoading}
	<LoadingOverlay {onRetry} showInitializationError={$initializationError} />
{:else}
	<div class="content">
		<div class="menuBar">
			<MenuBar
				{background}
				on:settingsClick={onSettingsClick}
				on:changeBackground={(e) => dispatch('changeBackground', e.detail)}
				on:tabChange={(e) => dispatch('tabChange', e.detail)}
			/>
		</div>

		<div class="mainContent" class:hidden={!$contentVisible}>
			<TabContent isVisible={$contentVisible} />
		</div>

		{#if $isSettingsDialogOpen}
			<SettingsDialog
				isOpen={$isSettingsDialogOpen}
				{background}
				on:changeBackground={(e) => dispatch('changeBackground', e.detail)}
				onClose={handleCloseSettings}
			/>
		{/if}
	</div>
{/if}

<style>
	.content {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
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
