<script lang="ts">
	import { onMount } from 'svelte';

	export let beatNumber: number = 1;
	export let duration: number = 1; // Support for multi-beat durations

	$: beatText = duration > 1 ? `${beatNumber}-${beatNumber + duration - 1}` : `${beatNumber}`;

	let container: HTMLElement;
	let parentSize = 0;

	// Function to calculate font size based on parent container size
	function calculateFontSize(): string {
		// Base the font size on the parent container width
		// Using a percentage ensures it scales proportionally
		return `${Math.max(parentSize * 0.15, 14)}px`;
	}

	// Function to update the parent size
	function updateParentSize() {
		if (!container) return;

		// Get the parent beat container
		const beatContainer = container.closest('.beat-container');
		if (!beatContainer) return;

		// Get the computed size of the beat container
		const computedStyle = window.getComputedStyle(beatContainer);
		const width = parseFloat(computedStyle.width);

		// Update the parent size
		parentSize = width;
	}

	onMount(() => {
		// Initial size calculation
		updateParentSize();

		// Set up a resize observer to update when the container size changes
		const resizeObserver = new ResizeObserver(() => {
			updateParentSize();
		});

		// Find the parent beat container to observe
		const beatContainer = container.closest('.beat-container');
		if (beatContainer) {
			resizeObserver.observe(beatContainer);
		}

		// Clean up the observer when the component is destroyed
		return () => {
			resizeObserver.disconnect();
		};
	});
</script>

<div class="beat-number-label" bind:this={container} style="font-size: {calculateFontSize()}">
	{beatText}
</div>

<style>
	.beat-number-label {
		font-weight: bold;
		text-align: center;
		background-color: transparent;
		color: #000;
		padding: 0;
		border-radius: 4px;
		position: absolute;
		top: 5%;
		left: 5%;
		/* Add a subtle text shadow to make it readable on any background */
		text-shadow:
			0px 0px 2px #fff,
			0px 0px 3px #fff,
			0px 0px 4px #fff;
		/* Prevent text selection */
		user-select: none;
		/* Ensure it's above the pictograph but doesn't interfere with interactions */
		pointer-events: none;
		z-index: 5;
	}
</style>
