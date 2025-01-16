<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let isMobile: boolean;   // new prop
	export let isActive: boolean = false;
	export let onClick: () => void;

	let fontSize: number;
	let buttonWidth: number;
	let buttonHeight: number;

	function updateButtonStyles() {
		if (typeof window !== 'undefined') {
			const w = window.innerWidth;
			const h = window.innerHeight;

			if (isMobile) {
				// Mobile: circle shape
				// let’s pick a target diameter
				buttonWidth = Math.max(60, w / 8);
				buttonHeight = buttonWidth;     // circle => width = height
				fontSize = buttonWidth * 0.5;   // large enough for the emoji
			} else {
				// Desktop: rectangle shape
				// let’s pick some logic for a comfortable size
				buttonWidth = Math.max(120, w / 10);
				buttonHeight = Math.max(40, h / 20);
				fontSize = Math.max(14, h / 50);
			}
		}
	}

	onMount(() => {
		updateButtonStyles();
		window.addEventListener('resize', updateButtonStyles);
	});

	onDestroy(() => {
		window.removeEventListener('resize', updateButtonStyles);
	});
</script>

<button
	on:click={onClick}
	class={isActive ? 'active' : 'inactive'}
	style="
		font-size: {fontSize}px;
		width: {buttonWidth}px;
		height: {buttonHeight}px;
		{isMobile
			? 'border-radius: 50%;'
			: 'border-radius: 10px;'
		}
	"
>
	<!-- The slot contains either just the emoji (mobile) or text+emoji (desktop) -->
	<slot />
</button>

<style>
	button {
		font-family: Georgia, serif;
		border: 1px solid gray;
		cursor: pointer;
		transition: all 0.3s ease, transform 0.2s ease;
		transition-duration: 0.4s;
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
