<!-- src/lib/components/Pictograph/StyledBorderOverlay.svelte -->
<script lang="ts">
	import type { PictographData } from '$lib/types/PictographData';

	// Props using Svelte 5 runes
	const props = $props<{
		pictographData: PictographData;
		isEnabled?: boolean;
		isGold?: boolean;
	}>();

	// Derived values
	const isEnabled = $derived(props.isEnabled ?? false);
	const isGold = $derived(props.isGold ?? false);
</script>

{#if isEnabled}
	<div class="styled-border-overlay" class:gold={isGold}>
		<div class="overlay-effect"></div>
	</div>
{/if}

<style>
	.styled-border-overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 15;
		border-radius: 8px;
		overflow: visible;
		transform: scale(1) translateZ(0);
		transform-origin: center center;
		transition: all 0.18s ease;
		will-change: transform;
		box-sizing: border-box;
	}

	.overlay-effect {
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
		overflow: visible;
	}

	/* Gold styling for selected state */
	.gold .overlay-effect {
		background: radial-gradient(
			circle at center,
			rgba(255, 215, 0, 0.15) 0%,
			rgba(255, 215, 0, 0.1) 40%,
			transparent 70%
		);
		border: 3px solid rgba(255, 215, 0, 0.8);
		box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
		animation: gold-pulse 2s infinite ease-in-out;
	}

	@keyframes hover-in {
		0% {
			opacity: 0;
			transform: scale(1) translateZ(0);
		}
		100% {
			opacity: 1;
			transform: scale(1.05) translateZ(0);
		}
	}

	@keyframes gold-pulse {
		0% {
			opacity: 0.9;
			box-shadow: 0 0 6px rgba(255, 215, 0, 0.6);
		}
		50% {
			opacity: 1;
			box-shadow: 0 0 10px rgba(255, 215, 0, 0.9);
		}
		100% {
			opacity: 0.9;
			box-shadow: 0 0 6px rgba(255, 215, 0, 0.6);
		}
	}
</style>
