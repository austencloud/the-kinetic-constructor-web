<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	export let isMobile: boolean = false; 
	export let isActive: boolean = false;
	export let onClick: () => void;

	let fontSize: number = 16;
	let buttonWidth: number = 120;
	let buttonHeight: number = 40;

	function updateButtonStyles() {
		if (!browser) return;
		const w = window.innerWidth;
		const h = window.innerHeight;

		if (isMobile) {
			buttonWidth = Math.max(50, w / 16);
			buttonHeight = buttonWidth;
			fontSize = buttonWidth * 0.5;
		} else {
			buttonWidth = Math.max(120, w / 8);
			buttonHeight = Math.max(40, h / 20);
			fontSize = Math.max(16, w / 70);
		}
	}

	onMount(() => {
		if (!browser) return;
		updateButtonStyles();
		window.addEventListener('resize', updateButtonStyles);
	});

	onDestroy(() => {
		if (!browser) return;
		window.removeEventListener('resize', updateButtonStyles);
	});
</script>

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
