<script lang="ts">
	import { onMount } from 'svelte';
	import Beat from './Beat.svelte';
	import AnimatedHighlight from './AnimatedHighlight.svelte';
	import type { BeatData } from './BeatData';

	const props = $props<{
		beat: BeatData;
		onClick: () => void;
		isSelected?: boolean;
		animationDelay?: number;
	}>();

	const isSelected = $derived(props.isSelected ?? false);

	let shouldAnimate = $state(true);
	let hasAnimated = $state(false);
	let isVisible = $state(false);
	let bluePulseEffect = $state(false);
	let redPulseEffect = $state(false);

	// Throttle function to prevent excessive animations
	function throttle(callback: Function, delay: number) {
		let lastCall = 0;
		return function (...args: any[]) {
			const now = Date.now();
			if (now - lastCall >= delay) {
				lastCall = now;
				callback(...args);
			}
		};
	}

	// Listen for highlight events from the GraphEditor or beat selection
	onMount(() => {
		// Throttle the highlight handler to prevent excessive animations
		const handleBeatHighlight = throttle((event: CustomEvent) => {
			if (!isSelected) return;

			const { color } = event.detail;

			if (color === 'blue') {
				bluePulseEffect = false;
				// Use a single setTimeout to reduce timer overhead
				setTimeout(() => {
					bluePulseEffect = true;
					setTimeout(() => (bluePulseEffect = false), 500);
				}, 10);
			} else {
				redPulseEffect = false;
				setTimeout(() => {
					redPulseEffect = true;
					setTimeout(() => (redPulseEffect = false), 500);
				}, 10);
			}
		}, 100); // Throttle to max 10 updates per second

		// Listen for the custom event
		document.addEventListener('beat-highlight', handleBeatHighlight as EventListener);

		return () => {
			document.removeEventListener('beat-highlight', handleBeatHighlight as EventListener);
		};
	});

	// Start animation immediately on mount
	onMount(() => {
		// Use requestAnimationFrame for smoother animation start
		requestAnimationFrame(() => {
			isVisible = true;
		});
	});

	function handleAnimationEnd() {
		if (!hasAnimated && shouldAnimate) {
			hasAnimated = true;
		}
	}
</script>

<div
	class="animated-beat-container"
	class:animate={shouldAnimate && !hasAnimated && isVisible}
	class:visible={isVisible}
	class:selected={isSelected}
	onanimationend={handleAnimationEnd}
>
	<Beat beat={props.beat} onClick={props.onClick} />

	{#if isSelected}
		<!-- Only show one highlight at a time to reduce rendering load -->
		<AnimatedHighlight active={true} color="blue" pulseEffect={bluePulseEffect} />
		{#if props.beat.metadata?.redReversal}
			<AnimatedHighlight active={true} color="red" pulseEffect={redPulseEffect} />
		{/if}
	{/if}
</div>

<style>
	.animated-beat-container {
		width: 100%;
		height: 100%;
		position: relative;
		transform: scale(0.8) translateZ(0);
		transition: all 0.18s ease;
		/* Ensure proper aspect ratio */
		aspect-ratio: 1 / 1;
		/* Use hardware acceleration */
		will-change: transform, opacity, z-index;
		border-radius: 8px;
		z-index: 1;
		box-sizing: border-box;
		overflow: visible; /* Allow content to overflow */
	}

	.visible {
		transform: scale(1) translateZ(0);
	}

	.selected {
		/* Simple selection indicator that doesn't require continuous animation */
		transform: scale(1.05) translateZ(0); /* Increased scale to match hover effect */
		box-shadow: 0 0 10px rgba(255, 204, 0, 0.3);
		z-index: 25; /* Higher z-index for selected beats */
	}

	/* Ensure the selected state maintains proper scaling when hovered */
	.selected:hover {
		transform: scale(1.05) translateZ(0); /* Keep the same scale as non-hovered selected state */
		z-index: 30; /* Even higher z-index when selected and hovered */
	}

	/* Add hover effect for non-selected state */
	.animated-beat-container:not(.selected):hover {
		z-index: 20; /* Raise z-index on hover */
	}

	.animate {
		/* Faster animation for more responsive feel */
		animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}

	@keyframes scaleIn {
		0% {
			transform: scale(0.6) translateZ(0);
			opacity: 0.7;
		}
		50% {
			transform: scale(1.05) translateZ(0);
			opacity: 1;
		}
		100% {
			transform: scale(1) translateZ(0);
			opacity: 1;
		}
	}
</style>
