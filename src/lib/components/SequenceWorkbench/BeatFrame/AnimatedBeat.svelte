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
		isNewlyAdded?: boolean;
	}>();

	// Use local copies to avoid reactivity issues
	const localIsSelected = props.isSelected ?? false;
	const localIsNewlyAdded = props.isNewlyAdded ?? false;

	// Initialize state directly instead of using reactive derivations
	let shouldAnimate = $state(false); 
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

	// SINGLE onMount that handles everything
	onMount(() => {
		// Set up initial animation state based on props
		if (localIsNewlyAdded) {
			shouldAnimate = true;
			// Use longer timeout to break reactivity chains
			setTimeout(() => {
				isVisible = true;
			}, 100);
		} else {
			// For existing beats, show immediately
			isVisible = true;
			hasAnimated = true;
		}

		// Set up event listener with throttling
		const handleBeatHighlight = throttle((event: CustomEvent) => {
			// Use local copy to avoid reactivity
			if (!localIsSelected) return;

			const { color } = event.detail;

			if (color === 'blue') {
				bluePulseEffect = false;
				// Use longer timeouts to break reactivity chains
				setTimeout(() => {
					bluePulseEffect = true;
					setTimeout(() => {
						bluePulseEffect = false;
					}, 500);
				}, 100);
			} else {
				redPulseEffect = false;
				setTimeout(() => {
					redPulseEffect = true;
					setTimeout(() => {
						redPulseEffect = false;
					}, 500);
				}, 100);
			}
		}, 200); // Increased throttle time

		// Add event listener
		document.addEventListener('beat-highlight', handleBeatHighlight as EventListener);

		// Cleanup function
		return () => {
			document.removeEventListener('beat-highlight', handleBeatHighlight as EventListener);
		};
	});

	function handleAnimationEnd() {
		// Use local flag to prevent reactive updates
		if (!hasAnimated && shouldAnimate) {
			hasAnimated = true;
		}
	}
</script>

<div
	class="animated-beat-container"
	class:animate={shouldAnimate && !hasAnimated && isVisible}
	class:visible={isVisible}
	class:selected={localIsSelected}
	onanimationend={handleAnimationEnd}
>
	<Beat beat={props.beat} onClick={props.onClick} isSelected={localIsSelected} />

	{#if localIsSelected}
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
		aspect-ratio: 1 / 1;
		will-change: transform, opacity, z-index;
		border-radius: 8px;
		z-index: 1;
		box-sizing: border-box;
		overflow: visible;
	}

	.visible {
		transform: scale(1) translateZ(0);
	}

	.selected {
		z-index: 25;
	}

	.animated-beat-container:hover {
		transform: scale(1.05) translateZ(0);
		z-index: 30;
	}

	.animate {
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