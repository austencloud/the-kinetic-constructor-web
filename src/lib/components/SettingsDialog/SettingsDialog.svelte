<script lang="ts">
	export let isOpen: boolean;
	export let onClose: () => void;
	export let background: string;
	export let onChangeBackground: (newBackground: string) => void;

	import TabsNavigation from './TabsNavigation.svelte';
	import TabContent from './TabContent.svelte';
	import DialogActions from './DialogActions.svelte';

	let activeTab = 'User';
</script>

{#if isOpen}
	<div
		class="dialog-backdrop"
		role="button"
		aria-label="Close settings dialog by clicking outside"
		on:click|self={onClose}
		on:keydown|self={(e) => e.key === 'Enter' && onClose()}
		tabindex="0"
	>
		<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
			<h2 id="dialog-title" class="dialog-title">Settings</h2>
			<TabsNavigation {activeTab} on:changeTab={(e) => (activeTab = e.detail)} />
			<div class="content-wrapper">
				<TabContent {activeTab} {background} {onChangeBackground} />
			</div>
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
		z-index: 1000;
	}

	.dialog {
		position: relative;
		background: white;
		padding: 10px 20px;
		border-radius: 8px;
		width: 60%;
		height: 80%;
		max-width: 1000px;
		display: flex;
		flex-direction: column;
		justify-content: space-between; /* Ensure Close Button is at the bottom */
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
	}

	.dialog-title {
		font-size: 1.8rem;
		font-weight: bold;
		text-align: center;
		margin: 0;
	}

	.content-wrapper {
		flex: 1;
		display: flex;
		overflow: auto;
		padding: 10px;
	}
</style>
