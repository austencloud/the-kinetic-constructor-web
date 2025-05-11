<!-- src/lib/components/SequenceWorkbench/BeatFrame/AnimatedBeat.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import Beat from './Beat.svelte';
	import type { BeatData } from './BeatData';

	// Props using Svelte 5 runes
	const props = $props<{
		beat: BeatData;
		onClick: () => void;
		isSelected?: boolean;
		animationDelay?: number;
	}>();

	// Default values for optional props
	const isSelected = $derived(props.isSelected ?? false);
	const animationDelay = $derived(props.animationDelay ?? 0);

	// Animation state using Svelte 5 runes
	let shouldAnimate = $state(true);
	let hasAnimated = $state(false);
	let isVisible = $state(false);

	// When the component mounts, start the animation after a short delay
	onMount(() => {
		// Use setTimeout to create a staggered animation effect
		setTimeout(() => {
			isVisible = true;
		}, animationDelay);

		return () => {
			// Clean up any timers if needed
		};
	});

	// Handle animation end
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
		<div class="selection-indicator"></div>
	{/if}
</div>

<style>
	.animated-beat-container {
		width: 100%;
		height: 100%;
		position: relative;
		opacity: 0;
		transform: scale(0.8);
		transition: opacity 0.3s ease;
	}

	.visible {
		opacity: 1;
		transform: scale(1);
	}

	.animate {
		animation: fadeInScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}

	@keyframes fadeInScale {
		0% {
			opacity: 0;
			transform: scale(0.6);
		}
		50% {
			opacity: 0.8;
			transform: scale(1.05);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

	.selection-indicator {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		border: 2px solid var(--color-accent, #3a7bd5);
		border-radius: 4px;
		pointer-events: none;
	}
</style>
