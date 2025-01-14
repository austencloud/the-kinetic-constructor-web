<script lang="ts">
	import TabsNavigation from './TabsNavigation.svelte';
	import TabContent from './TabContent.svelte';
	import DialogActions from './DialogActions.svelte';
	import { fade } from 'svelte/transition';

	export let isOpen: boolean;
	export let onClose: () => void;
	export let background: string;
	export let onChangeBackground: (newBackground: string) => void;

	let activeTab = 'User';
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
		<div class="dialog" role="dialog" transition:fade>
			<h2 class="dialog-title">Settings</h2>
			<TabsNavigation {activeTab} on:changeTab={(e) => (activeTab = e.detail)} />
			<TabContent {activeTab} {background} {onChangeBackground} />
			<DialogActions {onClose} />
		</div>
	</div>
{/if}

<style>
	@keyframes gradientBackground {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}

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
	}

	.dialog {
	width: 60vw;
	height: 80vh;
	display: flex;
	flex-direction: column;
	padding: 20px;
	background: white;
	background-size: 400% 400%;
	animation: gradientBackground 30s ease infinite;
	font-family: Arial, sans-serif;
	border-radius: 12px;
	box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
	overflow: hidden;
	cursor: default;
	
}

	.dialog-title {
		margin: 0;
		font-size: 1.8rem;
		text-align: center;
		padding: 10px 0;
		border-bottom: 2px solid rgba(255, 255, 255, 0.2);
	}
</style>
