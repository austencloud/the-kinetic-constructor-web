<!-- src/lib/components/PageTransition.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { cubicInOut } from 'svelte/easing';

	// Convert export let to $props() for Svelte 5
	const { active = false, direction = 'right' } = $props<{
		active?: boolean;
		direction?: 'right' | 'left';
	}>();

	let pageTransition: HTMLDivElement;
	let isAnimating = false;

	onMount(() => {
		if (active && pageTransition) {
			startTransition();
		}
	});

	// Replace reactive if-block with $effect
	$effect(() => {
		if (active && pageTransition && !isAnimating) {
			startTransition();
		}
	});

	function startTransition() {
		isAnimating = true;

		// Reset any existing animations
		pageTransition.style.animation = 'none';

		// Force reflow
		void pageTransition.offsetWidth;

		// Start animation
		pageTransition.style.animation = `page-transition-${direction} 0.8s ${cubicInOut} forwards`;

		// Dispatch animation start event is now handled via on:transitionstart
	}

	function handleAnimationEnd() {
		isAnimating = false;
		// Dispatch is now handled via on:transitionend
	}
</script>

<div
	class="page-transition"
	bind:this={pageTransition}
	onanimationend={handleAnimationEnd}
	ontransitionstart={() => dispatchEvent(new CustomEvent('transitionstart'))}
	ontransitionend={() => dispatchEvent(new CustomEvent('transitionend'))}
></div>

<style>
	.page-transition {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #1e3c72 0%, #6c9ce9 100%);
		z-index: 100;
		pointer-events: none;
		transform: translateX(-100%);
	}

	@keyframes page-transition-right {
		0% {
			transform: translateX(-100%);
			opacity: 0.7;
		}
		100% {
			transform: translateX(100%);
			opacity: 0;
		}
	}

	@keyframes page-transition-left {
		0% {
			transform: translateX(100%);
			opacity: 0.7;
		}
		100% {
			transform: translateX(-100%);
			opacity: 0;
		}
	}
</style>
