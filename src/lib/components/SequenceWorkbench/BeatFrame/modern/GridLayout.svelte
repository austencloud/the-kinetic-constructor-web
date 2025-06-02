<!--
  Modern GridLayout Component
  Smart container for layout calculations and overflow management
  Uses service injection and eliminates performance bottlenecks
  Handles grid dimension calculations and responsive layout
-->
<script lang="ts">
	import { getContext, createEventDispatcher, untrack } from 'svelte';
	import { autoAdjustLayout, calculateCellSize } from '../beatFrameHelpers';

	// Service injection - handle getter functions from context
	const sequenceServiceGetter = getContext<() => any>('sequenceService');
	const workbenchServiceGetter = getContext<() => any>('workbenchService');

	// Get actual service instances
	const sequenceService = $derived(sequenceServiceGetter?.());
	const workbenchService = $derived(workbenchServiceGetter?.());

	// Validate service injection
	$effect(() => {
		if (!sequenceServiceGetter) {
			console.error('❌ GridLayout: sequenceService getter not available in context');
		}
		if (!workbenchServiceGetter) {
			console.error('❌ GridLayout: workbenchService getter not available in context');
		}
	});

	// Event dispatcher for layout changes
	const dispatch = createEventDispatcher<{
		layoutchange: { rows: number; cols: number; cellSize: number };
		overflow: { hasOverflow: boolean; direction: 'horizontal' | 'vertical' | 'both' };
	}>();

	// Props interface
	const props = $props<{
		containerWidth: number;
		containerHeight: number;
		isScrollable?: boolean;
		fullScreenMode?: boolean;
	}>();

	// Reactive state from services with null checks (NO manual subscriptions)
	const beatCount = $derived(sequenceService?.state?.beats?.length || 0);

	// Layout calculations (pure derivations)
	const gridDimensions = $derived.by(() => {
		// Always ensure at least one row for the start position
		const [rows, cols] = autoAdjustLayout(Math.max(1, beatCount));
		return { rows, cols };
	});

	const cellSize = $derived(
		calculateCellSize(
			beatCount,
			props.containerWidth,
			props.containerHeight,
			gridDimensions.rows,
			gridDimensions.cols + 1, // Add 1 for start position column
			0 // No gap
		)
	);

	const gridStyle = $derived.by(() => {
		const { rows, cols } = gridDimensions;
		const totalCols = beatCount === 0 ? 1 : cols + 1;

		return {
			'--grid-rows': rows,
			'--grid-cols': totalCols,
			'--cell-size': `${cellSize}px`,
			'--total-width': `${totalCols * cellSize}px`,
			'--total-height': `${rows * cellSize}px`
		};
	});

	// Overflow detection (pure calculation)
	const overflowState = $derived.by(() => {
		const { rows, cols } = gridDimensions;
		const totalWidth = (cols + 1) * cellSize;
		const totalHeight = rows * cellSize;

		const horizontalOverflow = totalWidth > props.containerWidth;
		const verticalOverflow = totalHeight > props.containerHeight;

		let direction: 'horizontal' | 'vertical' | 'both' | null = null;
		if (horizontalOverflow && verticalOverflow) {
			direction = 'both';
		} else if (horizontalOverflow) {
			direction = 'horizontal';
		} else if (verticalOverflow) {
			direction = 'vertical';
		}

		return {
			hasOverflow: horizontalOverflow || verticalOverflow,
			direction,
			horizontalOverflow,
			verticalOverflow
		};
	});

	// Layout change effect (PURE - no state modification)
	let previousLayout = $state({ rows: 0, cols: 0, cellSize: 0 });

	$effect(() => {
		const { rows, cols } = gridDimensions;
		const currentCellSize = cellSize;

		// Check if layout has actually changed
		if (
			rows !== previousLayout.rows ||
			cols !== previousLayout.cols ||
			currentCellSize !== previousLayout.cellSize
		) {
			// Update workbench service with new layout (with null check)
			if (workbenchService?.updateLayout) {
				workbenchService.updateLayout({
					beatGridRows: rows,
					beatGridColumns: cols,
					cellSize: currentCellSize,
					containerWidth: props.containerWidth,
					containerHeight: props.containerHeight
				});
			}

			// Dispatch layout change event
			dispatch('layoutchange', {
				rows,
				cols,
				cellSize: currentCellSize
			});

			// Update previous layout for comparison
			previousLayout = { rows, cols, cellSize: currentCellSize };

			// Development logging
			if (import.meta.env.DEV) {
				console.log('GridLayout: Layout changed', {
					from: `${previousLayout.rows}x${previousLayout.cols}`,
					to: `${rows}x${cols}`,
					cellSize: currentCellSize,
					beatCount
				});
			}
		}
	});

	// Overflow change effect (PURE - no state modification)
	let previousOverflow = $state<{
		hasOverflow: boolean;
		direction: 'horizontal' | 'vertical' | 'both' | null;
	}>({ hasOverflow: false, direction: null });

	$effect(() => {
		const currentOverflow = overflowState;

		// Check if overflow state has changed
		if (
			currentOverflow.hasOverflow !== previousOverflow.hasOverflow ||
			currentOverflow.direction !== previousOverflow.direction
		) {
			// Dispatch overflow change event
			if (currentOverflow.hasOverflow && currentOverflow.direction) {
				dispatch('overflow', {
					hasOverflow: currentOverflow.hasOverflow,
					direction: currentOverflow.direction
				});
			}

			// Update previous overflow for comparison
			previousOverflow = {
				hasOverflow: currentOverflow.hasOverflow,
				direction: currentOverflow.direction
			};

			// Development logging
			if (import.meta.env.DEV) {
				console.log('GridLayout: Overflow state changed', {
					hasOverflow: currentOverflow.hasOverflow,
					direction: currentOverflow.direction,
					containerSize: `${props.containerWidth}x${props.containerHeight}`,
					gridSize: `${gridStyle['--total-width']}x${gridStyle['--total-height']}`
				});
			}
		}
	});

	// Performance monitoring (development only)
	let renderTime = $state(0);

	$effect(() => {
		if (import.meta.env.DEV) {
			const start = performance.now();
			// Use untrack to prevent infinite loops when setting renderTime
			setTimeout(() => {
				untrack(() => {
					renderTime = performance.now() - start;
					if (renderTime > 10) {
						console.warn(`GridLayout slow calculation: ${renderTime.toFixed(2)}ms`);
					}
				});
			}, 0);
		}
	});

	// Export computed values for parent components
	export function getLayoutData() {
		return {
			rows: gridDimensions.rows,
			cols: gridDimensions.cols,
			cellSize,
			totalWidth: (gridDimensions.cols + 1) * cellSize,
			totalHeight: gridDimensions.rows * cellSize,
			overflow: overflowState,
			style: gridStyle
		};
	}
</script>

<!-- This component is purely computational - no visual output -->
<!-- It provides layout calculations and overflow detection -->
<!-- Parent components use the exported layoutData -->

<!-- Performance indicator (development only) -->
{#if import.meta.env.DEV && renderTime > 0}
	<div class="performance-indicator" class:slow={renderTime > 10}>
		Layout: {renderTime.toFixed(1)}ms
	</div>
{/if}

<style>
	/* Performance indicator */
	.performance-indicator {
		position: fixed;
		top: 60px;
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
</style>
