<script lang="ts">
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';

	// Props using Svelte 5 runes
	const props = $props<{
		active?: boolean;
		color?: 'blue' | 'red';
		pulseEffect?: boolean;
	}>();

	// Default values for optional props
	const active = $derived(props.active ?? false);
	const colorProp = $derived(props.color ?? 'blue');
	const pulseEffect = $derived(props.pulseEffect ?? false);

	// Local state using $state
	let animationFrame = $state<number | null>(null);
	let startTime = $state(0);
	let progress = $state(0);
	let trailLength = $state(0.3); // 30% of the path for the trail effect
	let animationDuration = $state(2000); // 2 seconds for one full circuit (adjusted from 2.5s)
	let pathElement = $state<SVGPathElement | null>(null);
	let pathLength = $state(0);
	let containerElement = $state<HTMLDivElement | null>(null);
	let showPulse = $state(false);

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

	// Ensure type safety for color access
	const color = $derived(colorProp as keyof typeof colors);

	// Animation function with CSS animation as fallback
	function animate(timestamp: number) {
		if (!startTime) startTime = timestamp;
		const elapsed = timestamp - startTime;

		// Calculate progress (0 to 1)
		const newProgress = (elapsed % animationDuration) / animationDuration;

		// Only update if progress has changed
		if (newProgress !== progress) {
			progress = newProgress;

			// Directly update the SVG path for smoother animation
			if (pathElement && pathLength > 0) {
				// Update the stroke-dashoffset property directly
				const offset = pathLength * (1 - progress);
				pathElement.style.strokeDashoffset = `${offset}px`;

				// Update the trail path if it exists
				const trailPath = pathElement.nextElementSibling as SVGPathElement;
				if (trailPath) {
					const trailOffset = pathLength * (1 - progress - trailLength);
					const adjustedTrailOffset = trailOffset < 0 ? pathLength + trailOffset : trailOffset;
					trailPath.style.strokeDashoffset = `${adjustedTrailOffset}px`;
				}
			} else {
				// If path element or path length is not available, try to update them
				updatePathLength();
			}
		}

		// Request next frame if still active
		if (active) {
			animationFrame = requestAnimationFrame(animate);
		}
	}

	// Start animation when component becomes active
	$effect(() => {
		if (active && !animationFrame) {
			startTime = 0;
			animationFrame = requestAnimationFrame(animate);
		} else if (!active && animationFrame) {
			cancelAnimationFrame(animationFrame);
			animationFrame = null;
		}
	});

	// Force animation restart when active changes to true
	$effect(() => {
		if (active) {
			// Cancel any existing animation
			if (animationFrame) {
				cancelAnimationFrame(animationFrame);
				animationFrame = null;
			}
			// Start a new animation
			startTime = 0;
			animationFrame = requestAnimationFrame(animate);
		}
	});

	// Handle pulse effect
	$effect(() => {
		if (pulseEffect && active) {
			showPulse = true;
			hapticFeedbackService.trigger('selection');

			// Reset pulse after animation completes
			setTimeout(() => {
				showPulse = false;
			}, 500);
		}
	});

	// Get path length when path element is available
	function updatePathLength() {
		if (pathElement) {
			// Force a reflow to ensure the path is properly rendered
			void pathElement.getBoundingClientRect();

			// Get the total length of the path
			const totalLength = pathElement.getTotalLength();

			// Only update if the length has changed or is not set
			if (totalLength !== pathLength) {
				pathLength = totalLength;

				// Set initial dash array and offset
				pathElement.style.strokeDasharray = `${pathLength}`;

				// Reset the animation by setting the initial offset
				if (progress === 0) {
					pathElement.style.strokeDashoffset = `${pathLength}`;
				}

				console.log('Path length calculated:', pathLength);
			}
		}
	}

	// Note: We're now calculating these values directly in the animate function
	// for better performance and to avoid reactivity issues

	// Clean up animation on component destruction
	$effect(() => {
		// Return a cleanup function that will be called when the component is destroyed
		return () => {
			if (animationFrame) {
				cancelAnimationFrame(animationFrame);
				animationFrame = null;
			}
		};
	});

	// Initialize path length when component mounts or when path element changes
	$effect(() => {
		// Check if path element exists
		if (pathElement) {
			// Update path length immediately
			updatePathLength();

			// Start animation if active
			if (active && !animationFrame) {
				startTime = 0;
				animationFrame = requestAnimationFrame(animate);
			}

			// Log for debugging
			console.log('Path length updated:', pathLength);
		}
	});

	// Set up resize observer
	$effect(() => {
		if (!containerElement) return;

		// Create a ResizeObserver to update path length if container size changes
		const resizeObserver = new ResizeObserver(() => {
			updatePathLength();
			console.log('Container resized, path length updated:', pathLength);
		});

		resizeObserver.observe(containerElement);

		// Clean up when the component is destroyed
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
				style="stroke-dasharray: 300; stroke-dashoffset: 300;"
			/>

			<!-- Trail effect (gradient that follows the leading edge) -->
			<path
				d="M10,5 H90 C95,5 95,5 95,10 V90 C95,95 95,95 90,95 H10 C5,95 5,95 5,90 V10 C5,5 5,5 10,5 Z"
				class="highlight-trail"
				style="stroke-dasharray: 300 0; stroke-dashoffset: 300;"
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
		will-change: stroke-dashoffset; /* Optimize for animation */
		animation: dash 2s linear infinite;
	}

	.highlight-trail {
		fill: none;
		stroke: var(--color);
		stroke-width: 3;
		stroke-linecap: round;
		filter: drop-shadow(0 0 8px var(--glow-color));
		opacity: 0.9;
		will-change: stroke-dashoffset; /* Optimize for animation */
		animation: dash 2s linear infinite;
		animation-delay: -0.6s; /* 30% of the animation duration for trail effect */
	}

	@keyframes dash {
		from {
			stroke-dashoffset: 300; /* A large enough value to ensure full animation */
		}
		to {
			stroke-dashoffset: 0;
		}
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
