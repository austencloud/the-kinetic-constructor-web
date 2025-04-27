<script lang="ts">
	import { onMount } from 'svelte';
	import { appActions } from '$lib/state/machines/appMachine';
	import { uiStore } from '$lib/state/stores/uiStore';

	// Function to handle settings button click
	function handleClick() {
		// Update the app state
		appActions.openSettings();

		// Also dispatch the event for backward compatibility
		const event = new CustomEvent('click');
		dispatchEvent(event);
	}

	let buttonSize = 50;
	let iconSize = 38;

	// Use the UI store to get responsive information
	$: if ($uiStore && $uiStore.windowWidth) {
		buttonSize = Math.max(30, Math.min(50, $uiStore.windowWidth / 12));
		iconSize = buttonSize * 0.75;
	}

	onMount(() => {
		// Initial size calculation
		if (typeof window !== 'undefined') {
			buttonSize = Math.max(30, Math.min(50, window.innerWidth / 12));
			iconSize = buttonSize * 0.75;
		}
	});
</script>

<button
	class="settings-button"
	style="--button-size: {buttonSize}px;"
	on:click={handleClick}
	aria-label="Settings"
>
	<i class="fa-solid fa-gear settings-icon" style="--icon-size: {iconSize}px;" aria-hidden="true"
	></i>
</button>

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
		background-color: #f8f9fa;
		color: #495057;
		transition:
			transform 0.3s ease,
			background-color 0.3s ease,
			box-shadow 0.3s ease,
			color 0.3s ease;
		margin: 5px;
		padding: 0;
		overflow: hidden;
		position: absolute;
		top: 0;
		right: 0; /* Align to the top-right corner */
	}
	.settings-button:hover {
		transform: scale(1.1);
		box-shadow: 0 0 12px rgba(0, 0, 0, 0.2);
		background-color: #e9ecef;
		color: #007bff;
	}
	.settings-button:active {
		transform: scale(0.95);
		box-shadow: 0 0 8px rgba(0, 0, 0, 0.15);
	}
	.settings-icon {
		font-size: var(--icon-size);
		line-height: 1;
		transition: transform 0.3s ease;
		display: block;
	}
	.settings-button:hover .settings-icon {
		transform: rotate(90deg);
	}
</style>
