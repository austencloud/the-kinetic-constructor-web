<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { isMobile, isPortrait } from '../../../utils/deviceUtils';

	export let isActive: boolean = false;
	export let onClick: () => void;

	let fontSize: number;
	let buttonWidth: number;
	let buttonHeight: number;

	let isMobileDevice = false;
	let isPortraitMode = false;

	const updateStyles = () => {
		isMobileDevice = isMobile();
		isPortraitMode = isPortrait();

		if (isMobileDevice) {
			// Mobile: Always round buttons
			buttonWidth = Math.max(30, Math.min(60, window.innerWidth / 10));
			buttonHeight = buttonWidth;
			fontSize = buttonWidth * 0.5;
		} else if (isPortraitMode) {
			// Desktop Portrait: Round buttons
			buttonWidth = Math.max(30, Math.min(60, window.innerWidth / 10));
			buttonHeight = buttonWidth;
			fontSize = buttonWidth * 0.5;
		} else {
			// Desktop Landscape: Rectangular buttons
			buttonWidth = Math.max(120, window.innerWidth / 8);
			buttonHeight = Math.max(40, window.innerHeight / 20);
			fontSize = Math.min(26, Math.max(18, window.innerWidth / 70));
		}
	};

	onMount(() => {
		updateStyles();
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', updateStyles);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', updateStyles);
		}
	});

	$: if (typeof window !== 'undefined') {
		updateStyles(); // Ensure updates on reactivity
	}
</script>

<button
	on:click={onClick}
	class={`nav-button ${isActive ? 'active' : 'inactive'}`}
	style="font-size: {fontSize}px; 
		   width: {buttonWidth}px; 
		   height: {buttonHeight}px; 
		   border-radius: {isMobileDevice || isPortraitMode ? '50%' : '10px'};"
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
