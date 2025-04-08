<script lang="ts">
	import TabsNavigation from './TabsNavigation.svelte';
	import TabContent from './TabContent.svelte';
	import DialogActions from './DialogActions.svelte';
	import { activeTabStore } from '../../stores/ui/settingsStore';
	import { get } from 'svelte/store';
	import { createEventDispatcher } from 'svelte';

	export let isOpen: boolean;
	export let onClose: () => void;
	export let background: string;
	export let onChangeBackground: (newBackground: string) => void;

	
	// Create event dispatcher for change background events
	const dispatch = createEventDispatcher<{
		changeBackground: string;
	}>();

	// Function to dispatch changeBackground event
	const handleChangeBackground = (newBackground: string) => {
		dispatch('changeBackground', newBackground);
	};

	let activeTab = get(activeTabStore);

	// Update the store whenever the activeTab changes
	$: activeTabStore.set(activeTab);
</script>

{#if isOpen}
	<div
		class="dialog-backdrop"
		role="button"
		aria-label="Close settings dialog by clicking outside"
		on:click|self={onClose}
		tabindex="0"
		on:keydown|self={(e) => {
			if (e.key === 'Enter' || e.key === ' ') onClose();
		}}
	>
		<div class="dialog" role="dialog">
			<h2 class="dialog-title">Settings</h2>
			<TabsNavigation {activeTab} on:changeTab={(e) => (activeTab = e.detail)} />
			<TabContent {activeTab} {background} onChangeBackground={handleChangeBackground} />
			<DialogActions {onClose} />
		</div>
	</div>
{/if}

<style>
	.dialog-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		width: 100%;
		cursor: pointer;
		z-index: 1000;
		pointer-events: auto;
	}

	.dialog {
		width: 60vw;
		height: 80vh;
		display: flex;
		flex-direction: column;
		padding: 20px;
		font-family: Arial, sans-serif;
		border-radius: 12px;
		overflow: hidden;
		cursor: default;
		transform-origin: center;
		z-index: 1001;
		position: relative;
		pointer-events: auto;

		/* Gradient matching your snowfall background */
		background: linear-gradient(to bottom, #0b1d2a 0%, #1e3a5f 40%, #0b1d2a 100%);
		color: white;
		border: 1px solid rgba(108, 156, 233, 0.2);
		box-shadow:
			0 10px 25px rgba(0, 0, 0, 0.4),
			0 0 0 1px rgba(255, 255, 255, 0.05);
	}

	.dialog-title {
		margin: 0;
		font-size: 1.8rem;
		text-align: center;
		padding: 10px 0;
		color: #6c9ce9;
		border-bottom: 2px solid rgba(108, 156, 233, 0.3);
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}
</style>
