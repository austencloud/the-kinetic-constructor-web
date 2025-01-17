<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let isMobile: boolean = false;
	export let isFullScreen: boolean = false; // Receive fullscreen state
	export let isActive: boolean = false;
	export let onClick: () => void;

	let fontSize: number = 16;
	let buttonWidth: number = 120;
	let buttonHeight: number = 40;

	// Update button styles dynamically
	function updateButtonStyles() {
		if (typeof window === 'undefined') return;

		// Detect portrait mode explicitly
		const isPortrait = window.matchMedia("(orientation: portrait)").matches;

		if (isMobile && isPortrait && !isFullScreen) {
			// Portrait Mobile: Round buttons
			buttonWidth = Math.max(30, Math.min(60, window.innerWidth / 10));
			buttonHeight = buttonWidth;
			fontSize = buttonWidth * 0.5;
		} else if (isFullScreen) {
			// Fullscreen: Rectangular buttons with wider widths
			buttonWidth = Math.max(120, window.innerWidth / 8);
			buttonHeight = Math.max(40, window.innerHeight / 20);
			fontSize = Math.min(28, Math.max(18, window.innerWidth / 70));
		} else {
			// Default Desktop: Rectangular buttons
			buttonWidth = Math.max(120, window.innerWidth / 8);
			buttonHeight = Math.max(40, window.innerHeight / 20);
			fontSize = Math.min(26, Math.max(18, window.innerWidth / 70));
		}
	}

	// Initialize styles immediately
	if (typeof window !== 'undefined') {
		updateButtonStyles();
	}

	// Update styles on mount and resize
	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', updateButtonStyles);
		}
	});

	// Clean up event listener
	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', updateButtonStyles);
		}
	});

	// Recalculate styles whenever `isMobile` or `isFullScreen` changes
	$: updateButtonStyles();
</script>

<button
	on:click={onClick}
	class={`nav-button ${isActive ? 'active' : 'inactive'}`}
	style="font-size: {fontSize}px; 
	       width: {buttonWidth}px; 
	       height: {buttonHeight}px; 
	       {isMobile && !isFullScreen ? 'border-radius: 50%;' : 'border-radius: 10px;'}"
>
	<slot />
</button>

<style>
	.nav-button {
		font-family: Georgia, serif;
		border: 1px solid gray;
		cursor: pointer;
		transition: all 0.3s ease, transform 0.2s ease;
		display: flex;
		justify-content: center;
		align-items: center;
		box-sizing: border-box;
	}

	.nav-button:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.nav-button:active {
		transform: scale(0.95);
	}

	.nav-button.active {
		background-color: blue;
		color: white;
		font-weight: bold;
	}

	.nav-button.inactive {
		background-color: white;
		color: black;
		font-weight: normal;
	}
</style>
