<script lang="ts">
	import { onMount } from 'svelte';

	export let icon: string;
	export let title: string;
	export let buttonSize: number = 50; // Default size
	export let onClick: () => void;

	let isHovered = false;
	let isClicked = false;
	let isMobile = false;

	// Detect mobile devices
	function updateIsMobile() {
		isMobile = window.innerWidth <= 768; // Example threshold for mobile
	}

	// Add event listener for resizing
	onMount(() => {
		updateIsMobile();
		window.addEventListener('resize', updateIsMobile);

		return () => {
			window.removeEventListener('resize', updateIsMobile);
		};
	});

	const handleMouseEnter = () => (isHovered = true);
	const handleMouseLeave = () => (isHovered = false);
	const handleMouseDown = () => (isClicked = true);
	const handleMouseUp = () => (isClicked = false);
</script>

<button
	class="button"
	style="
		width: {buttonSize}px;
		height: {buttonSize}px;
		background-color: {isHovered ? '#f0f0f0' : 'white'};
		transform: {isClicked ? 'scale(0.9)' : isHovered ? 'scale(1.1)' : 'scale(1)'};"
	on:click={onClick}
	on:mouseenter={handleMouseEnter}
	on:mouseleave={handleMouseLeave}
	on:mousedown={handleMouseDown}
	on:mouseup={handleMouseUp}
	{title}
>
	<img src={icon} alt={title} class:is-mobile={isMobile} />
</button>

<style>
	.button {
		border-radius: 50%;
		border: 1px solid #ccc;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		justify-content: center;
		align-items: center;
		aspect-ratio: 1 / 1; /* Always maintain circular shape */
		box-sizing: border-box;
	}

	.button img {
		width: 100%; /* Fully fill the button size */
		height: 100%;
		object-fit: contain; /* Prevent distortion */
		max-width: inherit; /* Ensure scaling doesn't exceed its container */
		max-height: inherit;
	}

	.button img.is-mobile {
		width: 80%; /* Larger icon size for mobile */
		height: 80%;
	}
</style>
