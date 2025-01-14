<script lang="ts">
	import { onMount, tick } from 'svelte';
	import TabsNavigation from './TabsNavigation.svelte';
	import TabContent from './TabContent.svelte';
	import DialogActions from './DialogActions.svelte';

	export let isOpen: boolean;
	export let onClose: () => void;
	export let background: string;
	export let onChangeBackground: (newBackground: string) => void;

	let activeTab = 'User';
	let dialogRef: HTMLDivElement | null = null;
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
		<div class="dialog" bind:this={dialogRef} role="dialog">
			<h2 class="dialog-title">Settings</h2>
			<TabsNavigation {activeTab} on:changeTab={(e) => (activeTab = e.detail)} />
			<TabContent {activeTab} {background} {onChangeBackground} />
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
		height: 100%; /* Ensure full height */
		width: 100%; /* Ensure full width */
	}

	.dialog {
		width: 90vw; /* 90% of viewport width */
		height: 90vh; /* 90% of viewport height */
		display: flex;
		flex-direction: column;
		padding: 20px; /* Grid padding */
		box-sizing: border-box;
		background: white;
		border-radius: 8px;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
	}

	.dialog-title {
		margin: 0;
		font-size: 1.5rem;
		text-align: center;
		padding: 10px 0;
		border-bottom: 1px solid #ccc;
	}
</style>
