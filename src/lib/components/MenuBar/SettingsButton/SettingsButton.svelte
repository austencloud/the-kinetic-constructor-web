<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { uiStore } from '$lib/state/stores/uiStore';

	// Create event dispatcher
	const dispatch = createEventDispatcher<{ click: void }>();

	// Function to handle settings button click
	function handleClick() {
		// Dispatch the click event
		dispatch('click');
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
	<div class="button-content">
		<i class="fa-solid fa-gear settings-icon" style="--icon-size: {iconSize}px;" aria-hidden="true"
		></i>
	</div>
	<div class="button-background"></div>
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
		border-radius: 12px;
		background-color: transparent;
		color: rgba(255, 255, 255, 0.9);
		transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
		margin: 5px;
		padding: 0;
		overflow: hidden;
		position: relative;
	}

	.button-content {
		position: relative;
		z-index: 2;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
	}

	.button-background {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
		z-index: 1;
	}

	.settings-button:hover {
		transform: translateY(-2px);
		color: #6c9ce9;
	}

	.settings-button:hover .button-background {
		background: rgba(30, 60, 114, 0.4);
		border-color: rgba(108, 156, 233, 0.3);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.settings-button:active {
		transform: translateY(0);
	}

	.settings-button:active .button-background {
		background: rgba(30, 60, 114, 0.6);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.settings-button:focus-visible {
		outline: none;
	}

	.settings-button:focus-visible .button-background {
		box-shadow: 0 0 0 2px rgba(108, 156, 233, 0.6);
	}

	.settings-icon {
		font-size: var(--icon-size);
		line-height: 1;
		transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		display: block;
	}

	.settings-button:hover .settings-icon {
		transform: rotate(90deg);
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.settings-button {
			border-radius: 10px;
		}

		.button-background {
			border-radius: 10px;
		}
	}
</style>
