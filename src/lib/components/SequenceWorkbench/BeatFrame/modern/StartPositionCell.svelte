<!--
  Modern StartPositionCell Component
  Pure presentation component for start position handling
  Uses Svelte 5 runes and service injection patterns
  Zero business logic, zero reactive loops
-->
<script lang="ts">
	import { getContext } from 'svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import type { ISequenceService } from '$lib/services/core/ISequenceService';
	import StartPosBeat from '../StartPosBeat.svelte';
	import EmptyStartPosLabel from '../EmptyStartPosLabel.svelte';
	import AnimatedHighlight from '../AnimatedHighlight.svelte';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';

	// Service injection
	const sequenceService = getContext<ISequenceService>('sequenceService');

	// Props interface (pure presentation)
	const props = $props<{
		startPosition: PictographData | null;
		isEmpty: boolean;
		isSelected: boolean;
		onClick: () => void;
	}>();

	// Pure derived values (NO state modifications)
	const hasStartPosition = $derived(props.startPosition !== null);
	const showEmptyLabel = $derived(props.isEmpty && !hasStartPosition);

	// Debug logging for start position changes
	$effect(() => {
		console.log('🔧 StartPositionCell: Props updated:', {
			hasStartPosition,
			startPositionLetter: props.startPosition?.letter || 'null',
			isEmpty: props.isEmpty,
			showEmptyLabel,
			isSelected: props.isSelected
		});
	});

	// Local presentation state (UI only)
	let showBorder = $state(false);
	let bluePulseEffect = $state(false);
	let redPulseEffect = $state(false);

	// Create synthetic beat data for StartPosBeat component
	const startPosBeatData = $derived(() => {
		if (!hasStartPosition) return null;

		return {
			id: 'start-position',
			beatNumber: 0,
			filled: true,
			pictographData: props.startPosition,
			duration: 1,
			metadata: {
				blueReversal: false,
				redReversal: false,
				tags: []
			}
		};
	});

	// Pure event handlers (no side effects)
	function handleClick(event: MouseEvent) {
		event.stopPropagation();

		// Haptic feedback for start position selection
		if (typeof window !== 'undefined' && hapticFeedbackService.isAvailable()) {
			hapticFeedbackService.trigger('selection');
		}

		props.onClick();
	}

	// Wrapper function for components that expect () => void
	function handleComponentClick() {
		props.onClick();
	}

	// Keyboard event handler for accessibility
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleComponentClick();
		}
	}

	function handleMouseEnter() {
		// Only show hover border if not selected
		if (!props.isSelected) {
			showBorder = true;
		}
	}

	function handleMouseLeave() {
		showBorder = false;
	}

	// Animation effect for external highlight events (PURE - no state modification)
	$effect(() => {
		function handleBeatHighlight(event: CustomEvent) {
			if (!props.isSelected) return;

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

	// Performance monitoring (development only)
	let renderTime = $state(0);

	$effect(() => {
		if (import.meta.env.DEV) {
			const start = performance.now();
			setTimeout(() => {
				renderTime = performance.now() - start;
				if (renderTime > 5) {
					console.warn(`StartPositionCell slow render: ${renderTime.toFixed(2)}ms`);
				}
			}, 0);
		}
	});
</script>

<div
	class="start-position-cell"
	class:selected={props.isSelected}
	class:empty={showEmptyLabel}
	class:filled={hasStartPosition}
	class:hover={showBorder}
	onclick={handleClick}
	onkeydown={handleKeyDown}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	role="gridcell"
	aria-label="Start position"
	aria-selected={props.isSelected}
	tabindex={props.isSelected ? 0 : -1}
>
	<div class="content-wrapper">
		{#if showEmptyLabel}
			<EmptyStartPosLabel onClick={handleComponentClick} />
		{:else if startPosBeatData()}
			<StartPosBeat beatData={startPosBeatData()!} onClick={handleComponentClick} />
		{/if}

		<!-- Selection highlights -->
		{#if props.isSelected && hasStartPosition}
			<div class="selection-highlights">
				<AnimatedHighlight active={true} color="blue" pulseEffect={bluePulseEffect} />
				{#if props.startPosition?.redMotionData}
					<AnimatedHighlight active={true} color="red" pulseEffect={redPulseEffect} />
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Performance indicator (development only) -->
{#if import.meta.env.DEV && renderTime > 0}
	<div class="performance-indicator" class:slow={renderTime > 5}>
		SP: {renderTime.toFixed(1)}ms
	</div>
{/if}

<style>
	.start-position-cell {
		position: relative;
		width: 100%;
		height: 100%;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.18s ease;
		overflow: visible;
		contain: layout style paint; /* Performance optimization */
		transform: translateZ(0); /* Force GPU layer */

		/* Start position specific styling */
		background: rgba(34, 197, 94, 0.05);
		border: 2px solid rgba(34, 197, 94, 0.2);
	}

	.start-position-cell:focus-visible {
		outline: 2px solid #22c55e;
		outline-offset: 2px;
	}

	.start-position-cell.empty {
		background: rgba(156, 163, 175, 0.1);
		border-color: rgba(156, 163, 175, 0.3);
		border-style: dashed;
	}

	.start-position-cell.filled {
		background: rgba(34, 197, 94, 0.1);
		border-color: rgba(34, 197, 94, 0.4);
		border-style: solid;
	}

	.start-position-cell.selected {
		transform: scale(1.02) translateZ(0);
		z-index: 10;
		border-color: rgba(34, 197, 94, 0.6);
		box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
	}

	.start-position-cell.hover:not(.selected) {
		transform: scale(1.01) translateZ(0);
		z-index: 5;
		border-color: rgba(34, 197, 94, 0.5);
	}

	.content-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.selection-highlights {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
		z-index: 2;
	}

	/* Performance indicator */
	.performance-indicator {
		position: absolute;
		top: 2px;
		left: 2px;
		background: rgba(34, 197, 94, 0.8);
		color: white;
		padding: 1px 3px;
		border-radius: 2px;
		font-size: 0.6rem;
		font-family: monospace;
		z-index: 1000;
		pointer-events: none;
	}

	.performance-indicator.slow {
		background: rgba(220, 38, 38, 0.8);
	}

	/* Accessibility improvements */
	@media (prefers-reduced-motion: reduce) {
		.start-position-cell {
			transition: none;
		}

		.start-position-cell:hover,
		.start-position-cell.selected {
			transform: none;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.start-position-cell {
			border-width: 3px;
		}

		.start-position-cell.selected {
			border-color: currentColor;
		}
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.start-position-cell {
			background: rgba(34, 197, 94, 0.1);
		}

		.start-position-cell.empty {
			background: rgba(75, 85, 99, 0.2);
			border-color: rgba(75, 85, 99, 0.5);
		}
	}

	/* Mobile optimizations */
	@media (max-width: 768px) {
		.start-position-cell {
			/* Larger touch targets on mobile */
			min-width: 44px;
			min-height: 44px;
		}
	}
</style>
