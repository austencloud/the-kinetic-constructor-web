<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let name: string;
	export let isActive: boolean = false;
	export let onClick: () => void;

	let fontSize: number;
	let buttonWidth: number;
	let buttonHeight: number;

	const updateButtonStyles = () => {
		if (typeof window !== 'undefined') {
			const windowWidth = window.innerWidth;
			const windowHeight = window.innerHeight;

			fontSize = Math.max(10, windowHeight / 50);
			buttonWidth = Math.max(80, windowWidth / 10);
			buttonHeight = Math.max(30, windowHeight / 20);
		}
	};

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

<button
	on:click={onClick}
	class={isActive ? 'active' : 'inactive'}
	style="
  font-size: {fontSize}px;
  width: {buttonWidth}px;
  height: {buttonHeight}px;
  "
>
	{name}
</button>

<style>
	button {
		font-family: Georgia, serif;
		padding: 5px 10px;
		border-radius: 5px;
		border: 1px solid gray;
		cursor: pointer;
		transition:
			all 0.3s ease,
			transform 0.2s ease;
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
