<script lang="ts">
	import SettingsDialog from '$lib/components/SettingsDialog/SettingsDialog.svelte';
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	export let background: string;
	export let onChangeBackground: (newBackground: string) => void;

	let isOpen = false;
	let buttonSize = 50;
	let iconSize = 38;

	// Toggle dialog visibility
	const toggleDialog = () => {
		isOpen = !isOpen;
		console.log('Dialog toggled:', isOpen); // Debugging
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
	<!-- Settings Button -->
	<button class="settings-button" style="--button-size: {buttonSize}px;" on:click={toggleDialog}>
		<img
			class="settings-icon"
			style="--icon-size: {iconSize}px;"
			src="/button_panel_icons/settings.png"
			alt="Settings"
		/>
	</button>

	<!-- Animated Dialog -->
	{#if isOpen}
		<div transition:fade={{ duration: 300 }}>
			<SettingsDialog {background} {onChangeBackground} {isOpen} onClose={toggleDialog} />
		</div>
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
		border: none;
		border-radius: 50%;
		transition:
			transform 0.3s ease,
			background-color 0.3s ease,
			box-shadow 0.3s ease;
		margin: 5px;
	}

	.settings-button:hover {
		transform: scale(1.2);
		box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
	}

	.settings-button:active {
		transform: scale(0.9);
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
	}

	.settings-icon {
		width: var(--icon-size);
		height: var(--icon-size);
		transition: transform 0.3s ease;
	}

	.settings-button:hover .settings-icon {
		transform: rotate(90deg);
	}
</style>
