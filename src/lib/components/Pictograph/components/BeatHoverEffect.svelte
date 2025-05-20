<!-- src/lib/components/Pictograph/components/StyledBorderOverlay.svelte -->
<script lang="ts">
	import type { PictographData } from '$lib/types/PictographData';

	// Props using Svelte 5 runes
	const props = $props<{
		pictographData: PictographData;
		isEnabled?: boolean;
		isGold?: boolean;
	}>();
</script>

{#if props.isEnabled}
	<div class="beat-hover-effect">
		<div class="hover-overlay"></div>
	</div>
{/if}

<style>
	.beat-hover-effect {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 15; /* Increased z-index but below selection highlight */
		border-radius: 8px;
		overflow: visible; /* Changed from hidden to visible to allow hover effects to overflow */
		transform: scale(1) translateZ(0);
		transform-origin: center center;
		transition: all 0.18s ease;
		will-change: transform;
		box-sizing: border-box;
	}

	.hover-overlay {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			circle at center,
			rgba(100, 255, 100, 0.1) 0%,
			rgba(100, 255, 100, 0.05) 40%,
			transparent 70%
		);
		border: 2px solid rgba(100, 255, 100, 0.6);
		border-radius: 8px;
		box-shadow: 0 0 8px rgba(100, 255, 100, 0.3);
		opacity: 0;
		transform: scale(1) translateZ(0);
		transition: all 0.18s ease-out;
		animation: hover-in 0.18s ease-out forwards;
		box-sizing: border-box;
		overflow: visible; /* Allow the border to overflow */
	}

	@keyframes hover-in {
		0% {
			opacity: 0;
			transform: scale(1) translateZ(0);
		}
		100% {
			opacity: 1;
			transform: scale(1.05) translateZ(0); /* Match the scale of the beat hover effect */
		}
	}
</style>
