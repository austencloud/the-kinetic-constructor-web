<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let isMobile: boolean;   // new prop
	export let isActive: boolean = false;
	export let onClick: () => void;

	let fontSize: number;
	let buttonWidth: number;
	let buttonHeight: number;

	// Update button styles dynamically based on window dimensions
	function updateButtonStyles() {
		if (typeof window !== 'undefined') { 
			const w = window.innerWidth;
			const h = window.innerHeight;

			if (isMobile) {
				// Mobile: circle shape
				buttonWidth = Math.max(50, w / 16);
				buttonHeight = buttonWidth; // Circle => width = height
				fontSize = buttonWidth * 0.5; // Emoji size
			} else {
				// Desktop: rectangle shape
				buttonWidth = Math.max(120, w / 8);
				buttonHeight = Math.max(40, h / 20);
				fontSize = Math.max(16, w / 70);
			}
		}
	}

	// Run the updateButtonStyles only in the browser
	onMount(() => {
		updateButtonStyles();
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', updateButtonStyles);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', updateButtonStyles);
		}
	});
</script>

<!-- Button component -->
<button
	on:click={onClick}
	class={isActive ? 'active' : 'inactive'}
	style="font-size: {fontSize}px;
	       width: {buttonWidth}px;
	       height: {buttonHeight}px;
	       {isMobile ? 'border-radius: 50%;' : 'border-radius: 10px;'}"
>
	<slot />
</button>

<style>
	button {
		font-family: Georgia, serif;
		border: 1px solid gray;
		cursor: pointer;
		transition: all 0.3s ease, transform 0.2s ease;
		display: flex;
		justify-content: center;
		align-items: center;
		box-sizing: border-box;
	}

	button:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	button:active {
		transform: scale(0.95);
	}

	.active {
		background-color: blue;
		color: white;
		font-weight: bold;
	}
	.inactive {
		background-color: white;
		color: black;
		font-weight: normal;
	}
</style>
