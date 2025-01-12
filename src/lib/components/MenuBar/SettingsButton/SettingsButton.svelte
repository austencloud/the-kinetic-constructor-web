<script>
	import SettingsDialog from '$lib/components/SettingsDialog/SettingsDialog.svelte';
	import { onMount } from 'svelte';

	export let background;
	export let onChangeBackground;

	let isOpen = false;
	let buttonSize = 50;
	let iconSize = 38;

	const toggleDialog = () => {
		isOpen = !isOpen;
	};

	onMount(() => {
		const updateSizes = () => {
			const newSize = Math.max(30, window.innerWidth / 24);
			buttonSize = newSize;
			iconSize = newSize * 0.75;
		};

		updateSizes();
		window.addEventListener('resize', updateSizes);

		return () => window.removeEventListener('resize', updateSizes);
	});
</script>

<div>
	<button class="settings-button" style="--button-size: {buttonSize}px;" on:click={toggleDialog}>
		<img
			class="settings-icon"
			style="--icon-size: {iconSize}px;"
			src="settings.png"
			alt="Settings"
		/>
	</button>

	{#if isOpen}
		<SettingsDialog {background} {onChangeBackground} onClose={toggleDialog} />
	{/if}
</div>

<style>
	.settings-button {
		width: var(--button-size);
		height: var(--button-size);
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		background: transparent;
		border: none;
	}

	.settings-icon {
		width: var(--icon-size);
		height: var(--icon-size);
	}
</style>
