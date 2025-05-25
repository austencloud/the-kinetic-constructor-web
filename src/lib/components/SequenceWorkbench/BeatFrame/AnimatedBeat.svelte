<script lang="ts">
	import { onMount } from 'svelte';
	import Beat from './Beat.svelte';
	import AnimatedHighlight from './GoldSelectionBorder.svelte';
	import type { BeatData } from './BeatData';

	const props = $props<{
		beat: BeatData;
		onClick: () => void;
		isSelected?: boolean;
		animationDelay?: number;
		isNewlyAdded?: boolean; // New prop to indicate if this beat was just added
	}>();

	const isSelected = $derived(props.isSelected ?? false);
	const isNewlyAdded = $derived(props.isNewlyAdded ?? false);

	let shouldAnimate = $state(false); // Default to false, only animate newly added beats
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

	// Handle animation based on whether this is a newly added beat
	onMount(() => {
		if (isNewlyAdded) {
			// For newly added beats, start with animation
			shouldAnimate = true;
			requestAnimationFrame(() => {
				isVisible = true;
			});
		} else {
			// For existing beats, show immediately without animation
			isVisible = true;
			hasAnimated = true; // Mark as already animated to prevent future animations
		}
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
	<Beat beat={props.beat} onClick={props.onClick} {isSelected} />

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
		/* Selection indicator without scaling */
		z-index: 25; /* Higher z-index for selected beats */
	}

	/* Allow hover effect to control scaling for both selected and non-selected beats */
	.animated-beat-container:hover {
		transform: scale(1.05) translateZ(0); /* Apply scale on hover only */
		z-index: 30; /* Higher z-index when hovered */
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
