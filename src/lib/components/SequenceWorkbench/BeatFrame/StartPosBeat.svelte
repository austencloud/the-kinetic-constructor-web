<!-- src/lib/components/SequenceWorkbench/BeatFrame/StartPosBeat.svelte -->
<script lang="ts">
	import { getContext } from 'svelte';
	import Beat from './Beat.svelte';
	import type { BeatData } from './BeatData';
	import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';
	import StyledBorderOverlay from '$lib/components/Pictograph/components/BeatHoverEffect.svelte';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';
	import AnimatedHighlight from './GoldSelectionBorder.svelte';
	import type { ISequenceService } from '$lib/services/core/ISequenceService';

	// Props using Svelte 5 runes
	const props = $props<{
		beatData: BeatData;
		onClick: () => void;
	}>();

	// Get SequenceService from context (modern approach)
	const sequenceService = getContext<ISequenceService>('sequenceService');

	// Local UI state (NOT mirroring service state)
	let showBorder = $state(false);
	let bluePulseEffect = $state(false);
	let redPulseEffect = $state(false);

	// MODERN REACTIVE APPROACH: Pure derivation from SequenceService state
	const currentStartPosition = $derived(sequenceService?.state?.startPosition || null);
	const isSelected = $derived(
		sequenceService?.state?.selectedBeatIds?.includes('start-position') || false
	);

	// Derived beat data that updates when start position changes
	const beatData = $derived(() => {
		if (currentStartPosition && currentStartPosition.letter) {
			console.log(
				'🎯 StartPosBeat: Creating beat data from start position:',
				currentStartPosition.letter
			);
			return {
				...props.beatData,
				pictographData: currentStartPosition,
				filled: true
			};
		}
		return props.beatData;
	});

	// Derived pictograph data for rendering
	const pictographData = $derived(beatData()?.pictographData || defaultPictographData);

	// Debug logging for development
	$effect(() => {
		if (import.meta.env.DEV) {
			console.log('🔍 StartPosBeat state:', {
				hasStartPosition: !!currentStartPosition,
				startPositionLetter: currentStartPosition?.letter,
				isSelected,
				hasPictographData: !!pictographData,
				pictographLetter: pictographData?.letter
			});
		}
	});

	// Handle container click
	function handleContainerClick(event: MouseEvent) {
		event.stopPropagation();

		// Provide haptic feedback when selecting a beat
		if (typeof window !== 'undefined' && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('selection');
		}

		// Only proceed if we have a valid pictograph
		if (pictographData && pictographData !== defaultPictographData) {
			console.log('🎯 StartPosBeat: Container clicked with pictograph:', pictographData.letter);

			// Trigger pulse effects for visual feedback
			if (pictographData.blueMotionData) {
				bluePulseEffect = true;
				setTimeout(() => {
					bluePulseEffect = false;
				}, 600);
			}
			if (pictographData.redMotionData) {
				redPulseEffect = true;
				setTimeout(() => {
					redPulseEffect = false;
				}, 600);
			}
		}

		// Call the actual click handler
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
	class="start-pos-beat"
	class:selected={isSelected}
	onclick={handleContainerClick}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	type="button"
>
	<div class="pictograph-wrapper">
		<Beat beat={beatData()} onClick={props.onClick} isStartPosition={true} {isSelected} />
		<StyledBorderOverlay {pictographData} isEnabled={showBorder && !isSelected} />

		{#if isSelected}
			<!-- Only show one highlight at a time to reduce rendering load -->
			<AnimatedHighlight active={true} color="blue" pulseEffect={bluePulseEffect} />
			{#if pictographData?.redMotionData}
				<AnimatedHighlight active={true} color="red" pulseEffect={redPulseEffect} />
			{/if}
		{/if}
	</div>
</button>

<style>
	.start-pos-beat {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 8px;
		background-color: transparent;
		border: none;
		padding: 0;
		margin: 0;
		box-sizing: border-box;
		transition:
			transform 0.18s ease,
			box-shadow 0.18s ease;
		transform: translateZ(0);
		will-change: transform, opacity;
	}

	.start-pos-beat.selected {
		background-color: rgba(255, 204, 0, 0.05);
		transition: all 0.18s ease;
		z-index: 25;
	}

	.start-pos-beat:hover {
		transform: scale(1.05) translateZ(0);
		z-index: 30;
	}

	.pictograph-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 8px;
		overflow: visible;
		transition: all 0.18s ease;
		transform: translateZ(0);
		will-change: transform;
		box-sizing: border-box;
		background-color: rgba(34, 34, 34, 0.9);
	}
</style>
