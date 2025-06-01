<!--
  Modern BeatGrid Component
  Pure presentation component with service injection
  Uses modern Svelte 5 architecture and eliminates reactive loops
-->
<script lang="ts">
	import { getContext } from 'svelte';
	import type { ISequenceService } from '$lib/services/core/ISequenceService';
	import type { IWorkbenchService } from '$lib/services/core/IWorkbenchService';
	import type { BeatData } from '../BeatData';
	import BeatCell from './BeatCell.svelte';
	import StartPositionCell from './StartPositionCell.svelte';
	import GridLayout from './GridLayout.svelte';

	// Service injection
	const sequenceService = getContext<ISequenceService>('sequenceService');
	const workbenchService = getContext<IWorkbenchService>('workbenchService');

	// Props for external event handling
	const props = $props<{
		onBeatClick?: (beatId: string) => void;
		onBeatDoubleClick?: (beatId: string) => void;
		onStartPosClick?: () => void;
	}>();

	// Reactive state from services (NO manual subscriptions)
	const beats = $derived(sequenceService.state.beats);
	const selectedBeatIds = $derived(sequenceService.state.selectedBeatIds);
	const isEmpty = $derived(sequenceService.isEmpty);
	const layout = $derived(workbenchService.state.layout);

	// Grid calculations
	const gridColumns = $derived(layout.beatGridColumns);
	const gridRows = $derived(layout.beatGridRows);
	const cellSize = $derived(layout.cellSize);

	// Start position data
	const startPosBeatData = $derived(() => {
		// Create a synthetic start position beat
		return {
			id: 'start-position',
			beatNumber: 0,
			filled: !isEmpty,
			pictographData: null, // Will be populated by actual start position data
			blueMotionData: null,
			redMotionData: null,
			metadata: {
				blueReversal: false,
				redReversal: false,
				tags: []
			}
		} as BeatData;
	});

	// Event handlers (pure functions)
	function handleBeatClick(beatId: string) {
		sequenceService.selectBeat(beatId);
		props.onBeatClick?.(beatId);
	}

	function handleBeatDoubleClick(beatId: string) {
		sequenceService.selectBeat(beatId);
		workbenchService.setActivePanel('construct');
		props.onBeatDoubleClick?.(beatId);
	}

	function handleStartPosClick() {
		sequenceService.selectBeat('start-position');
		props.onStartPosClick?.();
	}

	// Keyboard navigation support
	function handleKeydown(event: KeyboardEvent) {
		if (!selectedBeatIds.length) return;

		const currentIndex = beats.findIndex((beat) => selectedBeatIds.includes(beat.id));
		if (currentIndex === -1) return;

		let newIndex = currentIndex;

		switch (event.key) {
			case 'ArrowRight':
				event.preventDefault();
				newIndex = Math.min(currentIndex + 1, beats.length - 1);
				break;
			case 'ArrowLeft':
				event.preventDefault();
				newIndex = Math.max(currentIndex - 1, 0);
				break;
			case 'ArrowDown':
				event.preventDefault();
				newIndex = Math.min(currentIndex + gridColumns, beats.length - 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				newIndex = Math.max(currentIndex - gridColumns, 0);
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				handleBeatDoubleClick(beats[currentIndex].id);
				return;
			case 'Delete':
			case 'Backspace':
				event.preventDefault();
				selectedBeatIds.forEach((beatId) => {
					if (beatId !== 'start-position') {
						sequenceService.removeBeat(beatId);
					}
				});
				return;
		}

		if (newIndex !== currentIndex && beats[newIndex]) {
			sequenceService.selectBeat(beats[newIndex].id);
		}
	}

	// Performance monitoring
	let renderTime = $state(0);

	$effect(() => {
		const start = performance.now();
		// This effect runs after render
		setTimeout(() => {
			renderTime = performance.now() - start;
		}, 0);
	});

	// Debug logging (development only)
	$effect(() => {
		if (import.meta.env.DEV) {
			console.log('Modern BeatGrid render:', {
				beatCount: beats.length,
				selectedCount: selectedBeatIds.length,
				gridSize: `${gridColumns}x${gridRows}`,
				cellSize,
				renderTime: renderTime.toFixed(2) + 'ms'
			});
		}
	});
</script>

<div
	class="beat-grid modern"
	style="--grid-columns: {gridColumns}; --grid-rows: {gridRows + 1}; --cell-size: {cellSize}px;"
	role="grid"
	aria-label="Beat sequence editor"
	aria-description="Grid with {beats.length} beats, {selectedBeatIds.length} selected"
	tabindex="0"
	onkeydown={handleKeydown}
>
	<!-- Start position (always in first cell) -->
	<div
		class="grid-cell start-position"
		style="grid-row: 1; grid-column: 1;"
		role="gridcell"
		aria-label="Start position"
	>
		{#if isEmpty}
			<EmptyStartPosLabel onClick={handleStartPosClick} />
		{:else}
			<StartPosBeat beatData={startPosBeatData} onClick={handleStartPosClick} />
		{/if}
	</div>

	<!-- Beat cells -->
	{#each beats as beat, index (beat.id)}
		{@const row = Math.floor(index / gridColumns) + 1}
		{@const col = (index % gridColumns) + 2}

		<div
			class="grid-cell beat-cell"
			style="grid-row: {row}; grid-column: {col};"
			role="gridcell"
			aria-label="Beat {index + 1}"
			aria-selected={selectedBeatIds.includes(beat.id)}
		>
			<BeatCell
				{beat}
				isSelected={selectedBeatIds.includes(beat.id)}
				onClick={() => handleBeatClick(beat.id)}
				onDoubleClick={() => handleBeatDoubleClick(beat.id)}
			/>
		</div>
	{/each}
</div>

<!-- Performance indicator (development only) -->
{#if import.meta.env.DEV && renderTime > 0}
	<div class="performance-indicator" class:slow={renderTime > 50}>
		Render: {renderTime.toFixed(1)}ms
	</div>
{/if}

<style>
	.beat-grid {
		display: grid;
		grid-template-columns: repeat(var(--grid-columns), var(--cell-size));
		grid-template-rows: repeat(var(--grid-rows), var(--cell-size));
		gap: 8px;
		padding: 16px;
		justify-content: center;
		align-content: start;
		width: 100%;
		height: 100%;
		overflow: auto;
		contain: layout style paint; /* Performance optimization */
	}

	.beat-grid.modern {
		/* Modern styling indicator */
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.02);
	}

	.grid-cell {
		position: relative;
		width: var(--cell-size);
		height: var(--cell-size);
		border-radius: 8px;
		transition: transform 0.2s ease;
		contain: layout style paint;
	}

	.grid-cell.start-position {
		/* Special styling for start position */
		background: rgba(34, 197, 94, 0.1);
		border: 2px solid rgba(34, 197, 94, 0.3);
	}

	.grid-cell.beat-cell:hover {
		transform: scale(1.02);
		z-index: 2;
	}

	/* Accessibility improvements */
	.beat-grid:focus-visible {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	.grid-cell[aria-selected='true'] {
		transform: scale(1.05);
		z-index: 3;
	}

	/* Performance indicator */
	.performance-indicator {
		position: absolute;
		top: 4px;
		left: 4px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.7rem;
		font-family: monospace;
		z-index: 1000;
	}

	.performance-indicator.slow {
		background: rgba(220, 38, 38, 0.8);
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.beat-grid {
			gap: 4px;
			padding: 8px;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.grid-cell {
			transition: none;
		}

		.grid-cell:hover,
		.grid-cell[aria-selected='true'] {
			transform: none;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.beat-grid.modern {
			border-color: currentColor;
		}

		.grid-cell.start-position {
			border-color: currentColor;
		}
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.beat-grid.modern {
			background: rgba(0, 0, 0, 0.1);
		}
	}
</style>
