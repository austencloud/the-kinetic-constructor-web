<!--
  Modern StartPosBeat Component
  FIXED: Eliminates reactive loops through proper $derived usage
  Uses service injection instead of direct container imports
-->
<script lang="ts">
	import { getContext } from 'svelte';
	import type { ISequenceService } from '$lib/services/core/ISequenceService';
	import type { BeatData } from '../BeatData';
	import Beat from '../Beat.svelte';
	import StyledBorderOverlay from '../SelectionBorderOverlay.svelte';
	import AnimatedHighlight from '../GoldSelectionBorder.svelte';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';
	import type { PictographData } from '$lib/types/PictographData';
	import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';

	// Service injection (NO direct imports)
	const sequenceService = getContext<ISequenceService>('sequenceService');

	// Props using Svelte 5 runes
	const props = $props<{
		beatData: BeatData;
		onClick: () => void;
	}>();

	// Local UI state (NOT mirroring service state)
	let showBorder = $state(false);
	let bluePulseEffect = $state(false);
	let redPulseEffect = $state(false);

	// FIXED: Pure derivation from service state (NO manual subscriptions)
	const isSelected = $derived(sequenceService.state.selectedBeatIds.includes('start-position'));

	// Derived pictograph data
	const pictographData = $derived(props.beatData?.pictographData || defaultPictographData);

	// FIXED: No reactive loops - pure event handlers
	function handleClick(event: MouseEvent) {
		event.stopPropagation();

		// Provide haptic feedback
		if (typeof window !== 'undefined' && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('selection');
		}

		// Use service method (no direct state mutation)
		sequenceService.selectBeat('start-position');

		// Call parent handler
		props.onClick();

		console.log('Modern StartPosBeat: Selected start position');
	}

	function handleMouseEnter() {
		if (!isSelected) {
			showBorder = true;
		}
	}

	function handleMouseLeave() {
		showBorder = false;
	}

	// FIXED: Proper effect for external events (no subscription loops)
	$effect(() => {
		function handleBeatHighlight(event: CustomEvent) {
			if (!isSelected) return;

			const { color } = event.detail;

			if (color === 'blue') {
				bluePulseEffect = false;
				setTimeout(() => {
					bluePulseEffect = true;
					setTimeout(() => (bluePulseEffect = false), 500);
				}, 10);
			} else if (color === 'red') {
				redPulseEffect = false;
				setTimeout(() => {
					redPulseEffect = true;
					setTimeout(() => (redPulseEffect = false), 500);
				}, 10);
			}
		}

		if (typeof window !== 'undefined') {
			document.addEventListener('beat-highlight', handleBeatHighlight as EventListener);

			return () => {
				document.removeEventListener('beat-highlight', handleBeatHighlight as EventListener);
			};
		}
	});

	// Debug logging (development only)
	$effect(() => {
		if (import.meta.env.DEV) {
			console.log('Modern StartPosBeat state:', {
				isSelected,
				hasData: !!pictographData,
				showBorder,
				beatId: props.beatData?.id
			});
		}
	});
</script>

<button
	class="start-pos-beat modern"
	class:selected={isSelected}
	onclick={handleClick}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	type="button"
	aria-label="Start position beat"
	aria-pressed={isSelected}
>
	<div class="pictograph-wrapper">
		<Beat beat={props.beatData} onClick={props.onClick} isStartPosition={true} {isSelected} />

		<!-- Hover border (only when not selected) -->
		<StyledBorderOverlay {pictographData} isSelected={showBorder && !isSelected} />

		<!-- Selection highlights (only when selected) -->
		{#if isSelected}
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
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: 8px;
		transition: all 0.2s ease;
		contain: layout style paint; /* Performance optimization */
	}

	.start-pos-beat.modern {
		/* Modern styling indicator */
		box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
	}

	.start-pos-beat:hover {
		transform: scale(1.02);
	}

	.start-pos-beat.selected {
		transform: scale(1.05);
		z-index: 10;
	}

	.pictograph-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		border-radius: inherit;
		overflow: hidden;
	}

	/* Accessibility improvements */
	.start-pos-beat:focus-visible {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.start-pos-beat {
			transition: none;
		}

		.start-pos-beat:hover,
		.start-pos-beat.selected {
			transform: none;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.start-pos-beat.modern {
			box-shadow: 0 0 0 2px currentColor;
		}
	}
</style>
