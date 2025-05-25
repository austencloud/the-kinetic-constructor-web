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
	const pulseEffect = $derived(props.pulseEffect ?? false);

	// Local state using $state
	let showPulse = $state(false);

	// Handle pulse effect with guard to prevent infinite loops
	let isPulsing = false;
	$effect(() => {
		if (pulseEffect && active && !isPulsing) {
			isPulsing = true;
			showPulse = true;
			hapticFeedbackService.trigger('selection');

			// Reset pulse after animation completes
			setTimeout(() => {
				showPulse = false;
				isPulsing = false;
			}, 500);
		}
	});
</script>

<div class="highlight-container" class:active>
	{#if active}
		<div class="gold-selection-border"></div>

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
		z-index: 25; /* Increased z-index to ensure it appears above other elements */
		opacity: 0;
		transition: all 0.18s ease;
		border-radius: 8px;
		/* Scale with parent element */
		transform: scale(1) translateZ(0);
		transform-origin: center center;
		will-change: transform, opacity;
		box-sizing: border-box;
		overflow: visible; /* Allow the highlight to overflow */
	}

	.highlight-container.active {
		opacity: 1;
	}

	.gold-selection-border {
		position: absolute;
		inset: 0;
		border-radius: 8px;
		border: 4px solid #ffcc00;
		box-shadow: 0 0 8px rgba(255, 204, 0, 0.7);
		opacity: 1;
		/* Use transform for hardware acceleration */
		transform: scale(1.05) translateZ(0); /* Match the hover scale exactly */
		/* Use CSS animation instead of JS-driven animation */
		animation: gold-pulse 2s infinite ease-in-out;
		box-sizing: border-box;
		overflow: visible; /* Allow the border to overflow */
		z-index: 30; /* Ensure it's above the hover effect */
	}

	@keyframes gold-pulse {
		0% {
			opacity: 0.9;
			box-shadow: 0 0 6px rgba(255, 204, 0, 0.6);
		}
		50% {
			opacity: 1;
			box-shadow: 0 0 10px rgba(255, 204, 0, 0.9);
		}
		100% {
			opacity: 0.9;
			box-shadow: 0 0 6px rgba(255, 204, 0, 0.6);
		}
	}

	.pulse-effect {
		position: absolute;
		inset: 0;
		border: 3px solid #ffcc00;
		border-radius: inherit;
		box-shadow: 0 0 8px rgba(255, 204, 0, 0.7);
		/* Use transform for hardware acceleration */
		transform: translateZ(0);
		animation: pulse 0.5s ease-out;
		box-sizing: border-box;
		z-index: 26; /* Ensure it's above the gold border */
		overflow: visible; /* Allow the pulse effect to overflow */
	}

	@keyframes pulse {
		0% {
			opacity: 0.9;
			transform: scale(0.97) translateZ(0);
		}
		50% {
			opacity: 1;
			transform: scale(1.03) translateZ(0);
		}
		100% {
			opacity: 0;
			transform: scale(1) translateZ(0);
		}
	}
</style>
