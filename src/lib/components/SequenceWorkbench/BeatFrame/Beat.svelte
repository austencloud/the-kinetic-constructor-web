<script lang="ts">
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';
	import type { BeatData } from './BeatData';
	import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';
	import StyledBorderOverlay from '$lib/components/Pictograph/components/BeatHoverEffect.svelte';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';

	// Props using Svelte 5 runes
	const props = $props<{
		beat: BeatData;
		onClick: () => void;
		isStartPosition?: boolean;
		isSelected?: boolean;
	}>();

	// Default values for optional props
	const isStartPosition = $derived(props.isStartPosition ?? false);
	const isSelected = $derived(props.isSelected ?? false);

	// Derived values
	const pictographData = $derived(props.beat?.pictographData || defaultPictographData);
	const isFilled = $derived(props.beat?.filled ?? false);
	const beatNumber = $derived(props.beat?.beatNumber ?? 0);

	// State
	let showBorder = $state(false);

	// Handle the click event
	function handleClick(event: MouseEvent) {
		event.stopPropagation();

		// Provide haptic feedback when selecting a beat
		if (typeof window !== 'undefined' && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('selection');
		}

		props.onClick();
	}

	function handleMouseEnter() {
		// Only show hover border if not selected
		if (!isSelected) {
			showBorder = true;
		}
	}

	function handleMouseLeave() {
		showBorder = false;
	}
</script>

<button
	class="beat"
	class:filled={isFilled}
	onclick={handleClick}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	aria-label={`Beat ${beatNumber}`}
>
	<div class="pictograph-wrapper">
		<Pictograph {pictographData} {beatNumber} {isStartPosition} showLoadingIndicator={false} />
		<StyledBorderOverlay {pictographData} isEnabled={showBorder} />
	</div>
</button>

<style>
	.beat {
		width: 100%;
		height: 100%;
		background-color: transparent;
		border: none;
		padding: 0;
		margin: 0;
		cursor: pointer;
		transition: all 0.18s ease;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 8px;
		min-width: 100%;
		min-height: 100%;
		box-sizing: border-box;
		overflow: visible;
		transform-origin: center center;
		will-change: transform, z-index;
		transform: translateZ(0);
		position: relative;
		z-index: 1;
	}

	.beat:hover {
		transform: scale(1.05) translateZ(0); /* Increased scale for more noticeable hover effect */
		z-index: 10; /* Raise z-index on hover to prevent overflow issues */
	}

	.pictograph-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 8px;
		overflow: visible; /* Changed from hidden to visible to allow hover effects to overflow */
		transition: all 0.18s ease;
		transform: translateZ(0);
		will-change: transform;
		box-sizing: border-box;
	}
</style>
