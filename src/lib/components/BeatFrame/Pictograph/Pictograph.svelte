<!-- src/lib/components/BeatFrame/Pictograph/Pictograph.svelte -->
<script lang="ts">
	import type { Beat } from '$lib/types/Beat';
	import { createEventDispatcher } from 'svelte';

	// Props
	export let shouldAnimate: boolean = false;

	const dispatch = createEventDispatcher();

	// Only trigger animation if shouldAnimate is true
	let hasAnimated = false;

	function handleAnimationEnd() {
		if (!hasAnimated && shouldAnimate) {
			hasAnimated = true;
			dispatch('animationComplete');
		}
	}
</script>

<div
	class="pictograph"
	class:animate={shouldAnimate && !hasAnimated}
	on:animationend={handleAnimationEnd}
>
	<!-- Your pictograph content here -->
</div>

<style>
	.pictograph {
		width: 100%;
		height: 100%;
		transform-origin: center;
	}

	.animate {
		animation: fadeInScale 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	@keyframes fadeInScale {
		0% {
			opacity: 0;
			transform: scale(0.8);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
