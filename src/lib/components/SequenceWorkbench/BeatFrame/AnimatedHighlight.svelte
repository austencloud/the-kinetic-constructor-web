<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';

	// Props
	export let active = false;
	export let color: 'blue' | 'red' = 'blue';
	export let pulseEffect = false;

	// Local state
	let animationFrame: number | null = null;
	let startTime = 0;
	let progress = 0;
	let trailLength = 0.3; // 30% of the path for the trail effect
	let animationDuration = 2500; // 2.5 seconds for one full circuit
	let pathElement: SVGPathElement | null = null;
	let pathLength = 0;
	let containerElement: HTMLDivElement | null = null;
	let showPulse = false;

	// No event dispatcher needed

	// Color configurations
	const colors = {
		blue: {
			primary: '#2E3192',
			glow: 'rgba(46, 49, 146, 0.8)'
		},
		red: {
			primary: '#ED1C24',
			glow: 'rgba(237, 28, 36, 0.8)'
		}
	};

	// Animation function
	function animate(timestamp: number) {
		if (!startTime) startTime = timestamp;
		const elapsed = timestamp - startTime;

		// Calculate progress (0 to 1)
		progress = (elapsed % animationDuration) / animationDuration;

		// Request next frame if still active
		if (active) {
			animationFrame = requestAnimationFrame(animate);
		}
	}

	// Start animation when component becomes active
	$: if (active && !animationFrame) {
		startTime = 0;
		animationFrame = requestAnimationFrame(animate);
	} else if (!active && animationFrame) {
		cancelAnimationFrame(animationFrame);
		animationFrame = null;
	}

	// Force animation restart when active changes to true
	$: if (active) {
		// Cancel any existing animation
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			animationFrame = null;
		}
		// Start a new animation
		startTime = 0;
		animationFrame = requestAnimationFrame(animate);
	}

	// Handle pulse effect
	$: if (pulseEffect && active) {
		showPulse = true;
		hapticFeedbackService.trigger('selection');

		// Reset pulse after animation completes
		setTimeout(() => {
			showPulse = false;
		}, 500);
	}

	// Get path length when path element is available
	function updatePathLength() {
		if (pathElement) {
			pathLength = pathElement.getTotalLength();
			// Set initial dash array and offset
			pathElement.style.strokeDasharray = `${pathLength}`;
			pathElement.style.strokeDashoffset = `${pathLength}`;
		}
	}

	// Calculate dash offset based on progress
	$: dashOffset = pathLength * (1 - progress);

	// Calculate trail end position
	$: trailEndOffset = pathLength * (1 - progress - trailLength);

	// Ensure trail wraps around correctly
	$: adjustedTrailEndOffset = trailEndOffset < 0 ? pathLength + trailEndOffset : trailEndOffset;

	// Clean up animation on component destruction
	onDestroy(() => {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			animationFrame = null;
		}
	});

	// Initialize path length when component mounts
	onMount(() => {
		updatePathLength();

		// Create a ResizeObserver to update path length if container size changes
		const resizeObserver = new ResizeObserver(() => {
			updatePathLength();
		});

		if (containerElement) {
			resizeObserver.observe(containerElement);
		}

		return () => {
			resizeObserver.disconnect();
		};
	});
</script>

<div
	class="highlight-container"
	class:active
	bind:this={containerElement}
	style="--color: {colors[color].primary}; --glow-color: {colors[color].glow};"
>
	{#if active}
		<svg class="highlight-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
			<!-- Border path that follows the container's border with rounded corners -->
			<path
				bind:this={pathElement}
				d="M10,5 H90 C95,5 95,5 95,10 V90 C95,95 95,95 90,95 H10 C5,95 5,95 5,90 V10 C5,5 5,5 10,5 Z"
				class="highlight-path"
				style="stroke-dashoffset: {dashOffset}px;"
			/>

			<!-- Trail effect (gradient that follows the leading edge) -->
			<path
				d="M10,5 H90 C95,5 95,5 95,10 V90 C95,95 95,95 90,95 H10 C5,95 5,95 5,90 V10 C5,5 5,5 10,5 Z"
				class="highlight-trail"
				style="
					stroke-dasharray: {pathLength * trailLength}px {pathLength * (1 - trailLength)}px;
					stroke-dashoffset: {adjustedTrailEndOffset}px;
				"
			/>
		</svg>

		{#if showPulse}
			<div class="pulse-effect" transition:fade={{ duration: 300, easing: cubicOut }}></div>
		{/if}
	{/if}
</div>

<style>
	.highlight-container {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
		z-index: 10;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.highlight-container.active {
		opacity: 1;
	}

	.highlight-svg {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.highlight-path {
		fill: none;
		stroke: var(--color);
		stroke-width: 3;
		stroke-linecap: round;
		filter: drop-shadow(0 0 5px var(--glow-color));
		transition: stroke 0.3s ease;
	}

	.highlight-trail {
		fill: none;
		stroke: var(--color);
		stroke-width: 3;
		stroke-linecap: round;
		filter: drop-shadow(0 0 8px var(--glow-color));
		opacity: 0.9;
	}

	.pulse-effect {
		position: absolute;
		inset: 0;
		border: 3px solid var(--color);
		border-radius: inherit;
		filter: drop-shadow(0 0 12px var(--glow-color));
		animation: pulse 0.5s ease-out;
	}

	@keyframes pulse {
		0% {
			opacity: 0.9;
			transform: scale(0.97);
		}
		50% {
			opacity: 1;
			transform: scale(1.03);
		}
		100% {
			opacity: 0;
			transform: scale(1);
		}
	}
</style>
