<!--
  Modern BeatGrid Component - Phase 2 Implementation
  Pure presentation component with service injection
  Uses modern Svelte 5 architecture and eliminates reactive loops
  Integrates BeatCell, StartPositionCell, and GridLayout components
-->
<script lang="ts">
	import { getContext } from 'svelte';

	import BeatCell from './BeatCell.svelte';
	import StartPositionCell from './StartPositionCell.svelte';
	import GridLayout from './GridLayout.svelte';

	// Service injection with null checks - handle getter functions from context
	const sequenceServiceGetter = getContext<() => any>('sequenceService');
	const workbenchServiceGetter = getContext<() => any>('workbenchService');

	// Get actual service instances
	const sequenceService = $derived(sequenceServiceGetter?.());
	const workbenchService = $derived(workbenchServiceGetter?.());

	// Validate service injection
	$effect(() => {
		if (!sequenceServiceGetter) {
			console.error('❌ ModernBeatGrid: sequenceService getter not available in context');
		}
		if (!workbenchServiceGetter) {
			console.error('❌ ModernBeatGrid: workbenchService getter not available in context');
		}

		// Debug logging for service injection
		console.log('🔧 ModernBeatGrid: Services injected:', {
			sequenceService: !!sequenceService,
			workbenchService: !!workbenchService
		});
	});

	// Props interface (pure presentation) - startPosition removed, now derived from service
	const props = $props<{
		containerWidth: number;
		containerHeight: number;
		isScrollable?: boolean;
		fullScreenMode?: boolean;
		onBeatClick?: (beatId: string) => void;
		onBeatDoubleClick?: (beatId: string) => void;
		onStartPosClick?: () => void;
	}>();

	// Debug logging for props changes
	$effect(() => {
		console.log('🔧 ModernBeatGrid: Props updated:', {
			startPosition: props.startPosition?.letter || 'null',
			containerWidth: props.containerWidth,
			containerHeight: props.containerHeight
		});
	});

	// Reactive state from services with null checks (NO manual subscriptions)
	const beats = $derived(sequenceService?.state?.beats || []);
	const selectedBeatIds = $derived(sequenceService?.state?.selectedBeatIds || []);
	const isEmpty = $derived(sequenceService?.isEmpty ?? true);

	// FIXED: Get start position from SequenceService state, not props
	const startPosition = $derived(sequenceService?.state?.startPosition || null);

	// Layout management
	let layoutData = $state({
		rows: 1,
		cols: 1,
		cellSize: 100,
		totalWidth: 100,
		totalHeight: 100,
		overflow: { hasOverflow: false, direction: null },
		style: {}
	});

	// Handle layout changes from GridLayout component
	function handleLayoutChange(event: CustomEvent) {
		const { rows, cols, cellSize } = event.detail;
		layoutData = {
			...layoutData,
			rows,
			cols,
			cellSize,
			totalWidth: (cols + 1) * cellSize,
			totalHeight: rows * cellSize
		};
	}

	// Handle overflow changes from GridLayout component
	function handleOverflowChange(event: CustomEvent) {
		const { hasOverflow, direction } = event.detail;
		layoutData = {
			...layoutData,
			overflow: { hasOverflow, direction }
		};
	}

	// Pure event handlers (no side effects)
	function handleBeatClick(beatId: string) {
		if (sequenceService?.selectBeat) {
			sequenceService.selectBeat(beatId);
		}
		props.onBeatClick?.(beatId);
	}

	function handleBeatDoubleClick(beatId: string) {
		if (sequenceService?.selectBeat) {
			sequenceService.selectBeat(beatId);
		}
		if (workbenchService?.setActivePanel) {
			workbenchService.setActivePanel('construct');
		}
		props.onBeatDoubleClick?.(beatId);
	}

	function handleStartPosClick() {
		if (sequenceService?.selectBeat) {
			sequenceService.selectBeat('start-position');
		}
		props.onStartPosClick?.();
	}

	// Keyboard navigation support
	function handleKeydown(event: KeyboardEvent) {
		if (!selectedBeatIds.length) return;

		const currentIndex = beats.findIndex(
			(beat: any) => beat.id && selectedBeatIds.includes(beat.id)
		);
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
				newIndex = Math.min(currentIndex + layoutData.cols, beats.length - 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				newIndex = Math.max(currentIndex - layoutData.cols, 0);
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				if (beats[currentIndex]?.id) {
					handleBeatDoubleClick(beats[currentIndex].id!);
				}
				return;
			case 'Delete':
			case 'Backspace':
				event.preventDefault();
				selectedBeatIds.forEach((beatId: string) => {
					if (beatId !== 'start-position' && sequenceService?.removeBeat) {
						sequenceService.removeBeat(beatId);
					}
				});
				return;
		}

		if (newIndex !== currentIndex && beats[newIndex]?.id && sequenceService?.selectBeat) {
			sequenceService.selectBeat(beats[newIndex].id!);
		}
	}

	// Performance monitoring
	let renderTime = $state(0);

	$effect(() => {
		if (import.meta.env.DEV) {
			const start = performance.now();
			setTimeout(() => {
				renderTime = performance.now() - start;
				if (renderTime > 20) {
					console.warn(`ModernBeatGrid slow render: ${renderTime.toFixed(2)}ms`);
				}
			}, 0);
		}
	});

	// Debug logging (development only)
	$effect(() => {
		if (import.meta.env.DEV) {
			console.log('🔧 ModernBeatGrid reactive state:', {
				beatCount: beats.length,
				selectedCount: selectedBeatIds.length,
				isEmpty,
				startPosition: startPosition?.letter || 'null',
				hasStartPosition: !!startPosition,
				gridSize: `${layoutData.rows}x${layoutData.cols}`,
				cellSize: layoutData.cellSize,
				renderTime: renderTime.toFixed(2) + 'ms'
			});
		}
	});
</script>

<!-- GridLayout component for layout calculations -->
<GridLayout
	containerWidth={props.containerWidth}
	containerHeight={props.containerHeight}
	isScrollable={props.isScrollable}
	fullScreenMode={props.fullScreenMode}
	on:layoutchange={handleLayoutChange}
	on:overflow={handleOverflowChange}
/>

<div
	class="modern-beat-grid"
	class:scrollable={props.isScrollable}
	class:fullscreen={props.fullScreenMode}
	style="
    --grid-columns: {layoutData.cols + 1}; 
    --grid-rows: {layoutData.rows}; 
    --cell-size: {layoutData.cellSize}px;
    --total-width: {layoutData.totalWidth}px;
    --total-height: {layoutData.totalHeight}px;
  "
	role="grid"
	aria-label="Beat sequence editor"
	tabindex="0"
	onkeydown={handleKeydown}
>
	<!-- Start position cell (always in first position) -->
	<div class="grid-cell start-position" style="grid-row: 1; grid-column: 1;" role="gridcell">
		<StartPositionCell
			{startPosition}
			{isEmpty}
			isSelected={selectedBeatIds.includes('start-position')}
			onClick={handleStartPosClick}
		/>
	</div>

	<!-- Beat cells -->
	{#each beats as beat, index (beat.id)}
		{@const row = Math.floor(index / layoutData.cols) + 1}
		{@const col = (index % layoutData.cols) + 2}

		<div
			class="grid-cell beat-cell"
			style="grid-row: {row}; grid-column: {col};"
			role="gridcell"
			aria-label="Beat {index + 1}"
			aria-selected={!!(beat.id && selectedBeatIds.includes(beat.id))}
		>
			<BeatCell
				{beat}
				isSelected={beat.id ? selectedBeatIds.includes(beat.id) : false}
				onClick={() => beat.id && handleBeatClick(beat.id)}
				onDoubleClick={() => beat.id && handleBeatDoubleClick(beat.id)}
			/>
		</div>
	{/each}
</div>

<!-- Performance indicator (development only) -->
{#if import.meta.env.DEV && renderTime > 0}
	<div class="performance-indicator" class:slow={renderTime > 20}>
		Grid: {renderTime.toFixed(1)}ms
	</div>
{/if}

<style>
	.modern-beat-grid {
		display: grid;
		grid-template-columns: repeat(var(--grid-columns), var(--cell-size));
		grid-template-rows: repeat(var(--grid-rows), var(--cell-size));
		gap: 8px;
		padding: 16px;
		justify-content: center;
		align-content: start;
		width: 100%;
		height: 100%;
		contain: layout style paint; /* Performance optimization */
		transform: translateZ(0); /* Force GPU layer */
	}

	.modern-beat-grid.scrollable {
		overflow: auto;
		scrollbar-width: thin;
		scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
	}

	.modern-beat-grid.fullscreen {
		padding: 32px;
		gap: 12px;
	}

	.modern-beat-grid:focus-visible {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	.grid-cell {
		position: relative;
		width: var(--cell-size);
		height: var(--cell-size);
		border-radius: 8px;
		contain: layout style paint;
	}

	/* Performance indicator */
	.performance-indicator {
		position: fixed;
		top: 40px;
		right: 10px;
		background: rgba(59, 130, 246, 0.8);
		color: white;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.7rem;
		font-family: monospace;
		z-index: 1000;
		pointer-events: none;
	}

	.performance-indicator.slow {
		background: rgba(220, 38, 38, 0.8);
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.modern-beat-grid {
			gap: 4px;
			padding: 8px;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.modern-beat-grid {
			transform: none;
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.modern-beat-grid {
			border: 1px solid currentColor;
		}
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.modern-beat-grid {
			background: rgba(0, 0, 0, 0.1);
		}
	}
</style>
