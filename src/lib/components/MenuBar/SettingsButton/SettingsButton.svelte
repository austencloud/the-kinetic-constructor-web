<script lang="ts">
	import SettingsDialog from '$lib/components/SettingsDialog/SettingsDialog.svelte';
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	export let background: string;
	// Type the onChangeBackground prop for clarity
	export let onChangeBackground: (newBackground: string) => void;

	let isOpen = false;
	let buttonSize = 50; // Default size
	let iconSize = 38; // Default size

	// Toggle dialog visibility
	const toggleDialog = () => {
		isOpen = !isOpen;
	};

	onMount(() => {
		const updateSizes = () => {
			// Calculate responsive sizes (adjust logic as needed)
			const newSize = Math.max(30, Math.min(50, window.innerWidth / 12)); // Example sizing
			buttonSize = newSize;
			iconSize = newSize * 0.75; // Icon size relative to button
		};

		updateSizes(); // Initial size calculation
		window.addEventListener('resize', updateSizes);

		// Cleanup listener on component destroy
		return () => window.removeEventListener('resize', updateSizes);
	});
</script>

<div>
	<button
		class="settings-button"
		style="--button-size: {buttonSize}px;"
		on:click={toggleDialog}
		aria-label="Settings"
	>
		<i class="fa-solid fa-gear settings-icon" style="--icon-size: {iconSize}px;" aria-hidden="true"
		></i>
	</button>

	{#if isOpen}
		<div transition:fade={{ duration: 300 }}>
			<SettingsDialog {background} {isOpen} onClose={toggleDialog} />
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
		background-color: #f8f9fa; /* Example background */
		color: #495057; /* Default icon color - Adjust as needed */
		transition:
			transform 0.3s ease,
			background-color 0.3s ease,
			box-shadow 0.3s ease,
			color 0.3s ease;
		margin: 5px;
		padding: 0; /* Remove padding if icon centered with flex */
		overflow: hidden; /* Keep icon contained */
	}

	.settings-button:hover {
		transform: scale(1.1); /* Slightly smaller scale for subtlety */
		box-shadow: 0 0 12px rgba(0, 0, 0, 0.2);
		background-color: #e9ecef; /* Example hover background */
		color: #007bff; /* Example hover icon color */
	}

	.settings-button:active {
		transform: scale(0.95); /* Slightly smaller active scale */
		box-shadow: 0 0 8px rgba(0, 0, 0, 0.15);
	}

	.settings-icon {
		/* Control size with font-size using the CSS variable */
		font-size: var(--icon-size);
		/* Remove width/height as font-size controls it */
		/* width: var(--icon-size); */
		/* height: var(--icon-size); */
		line-height: 1; /* Ensure proper vertical alignment */
		transition: transform 0.3s ease;
		display: block; /* Ensure it behaves predictably */
	}

	/* Keep the rotate animation on hover */
	.settings-button:hover .settings-icon {
		transform: rotate(90deg);
	}
</style>
