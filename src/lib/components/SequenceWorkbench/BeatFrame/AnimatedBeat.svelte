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

	// Listen for highlight events from the GraphEditor or beat selection
	onMount(() => {
		const handleBeatHighlight = (event: CustomEvent) => {
			if (!isSelected) return;

			const { color } = event.detail;

			if (color === 'blue') {
				// Reset the pulse effect to ensure it can be triggered again
				bluePulseEffect = false;
				// Use setTimeout to ensure the state change is processed
				setTimeout(() => {
					bluePulseEffect = true;
					// Reset after animation completes
					setTimeout(() => {
						bluePulseEffect = false;
					}, 500);
				}, 10);
			} else {
				// Reset the pulse effect to ensure it can be triggered again
				redPulseEffect = false;
				// Use setTimeout to ensure the state change is processed
				setTimeout(() => {
					redPulseEffect = true;
					// Reset after animation completes
					setTimeout(() => {
						redPulseEffect = false;
					}, 500);
				}, 10);
			}
		};

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
	onanimationend={handleAnimationEnd}
>
	<Beat beat={props.beat} onClick={props.onClick} />

	{#if isSelected}
		<!-- Animated highlights for blue and red turns -->
		<AnimatedHighlight active={true} color="blue" pulseEffect={bluePulseEffect} />
		<AnimatedHighlight active={true} color="red" pulseEffect={redPulseEffect} />
	{/if}
</div>

<style>
	.animated-beat-container {
		width: 100%;
		height: 100%;
		position: relative;
		transform: scale(0.8);
		transition: transform 0.2s ease;
		/* Ensure proper aspect ratio */
		aspect-ratio: 1 / 1;
		/* Prevent any layout shifts during animation */
		will-change: transform;
	}

	.visible {
		transform: scale(1);
	}

	.animate {
		/* Faster animation for more responsive feel */
		animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}

	@keyframes scaleIn {
		0% {
			transform: scale(0.6);
			opacity: 0.7;
		}
		50% {
			transform: scale(1.05);
			opacity: 1;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	/* Selection indicator replaced with SelectionBorderOverlay component */
</style>
