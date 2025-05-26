// src/lib/components/SequenceWorkbench/BeatFrame/composables/useBeatFrameLayout.svelte.ts

import { browser } from '$app/environment';
import { autoAdjustLayout, calculateCellSize } from '../beatFrameHelpers';
import { debounce } from '../utils/beatFrameUtils';

/**
 * Composable for managing BeatFrame layout using Svelte 5 runes
 */
export function useBeatFrameLayout(
	beatCount: number,
	containerRef: HTMLElement | null,
	containerSize: { width: number; height: number }
) {
	// Layout state
	let beatRows = $state(1);
	let beatCols = $state(1);
	let prevRows = $state(1);
	let prevCols = $state(1);
	let cellSize = $state(100);
	let naturalGridHeight = $state(0);
	let contentOverflows = $state(false);

	// Sequence widget dimensions
	let sequenceWidgetWidth = $state(0);
	let sequenceWidgetHeight = $state(0);

	// Calculate layout based on beat count
	$effect(() => {
		[beatRows, beatCols] = autoAdjustLayout(Math.max(1, beatCount));

		if (beatRows !== prevRows || beatCols !== prevCols) {
			layoutState.updateLayout(beatRows, beatCols, beatCount);

			prevRows = beatRows;
			prevCols = beatCols;

			// Dispatch layout change event
			const event = new CustomEvent('layout-changed', {
				bubbles: true,
				detail: {
					rows: beatRows,
					cols: beatCols,
					beatCount,
					previousLayout: { rows: prevRows, cols: prevCols }
				}
			});
			document.dispatchEvent(event);

			// Check for overflow after layout changes
			setTimeout(checkForOverflow, 100);
		}
	});

	// Calculate natural grid height
	$effect(() => {
		if (!containerRef) return;

		const gridElement = containerRef.querySelector('.beat-frame');
		if (gridElement) {
			naturalGridHeight = gridElement.scrollHeight;
		} else {
			naturalGridHeight = beatRows * cellSize + 20;
		}

		// Dispatch natural height change event
		if (naturalGridHeight > 0) {
			const event = new CustomEvent('naturalheightchange', {
				detail: { height: naturalGridHeight },
				bubbles: true
			});
			containerRef.dispatchEvent(event);
		}

		setTimeout(checkForOverflow, 50);
	});

	// Calculate cell size
	$effect(() => {
		if (sequenceWidgetWidth > 0 && sequenceWidgetHeight > 0) {
			cellSize = calculateCellSize(
				beatCount,
				sequenceWidgetWidth,
				sequenceWidgetHeight,
				beatRows,
				beatCols + 1,
				0
			);
		} else {
			cellSize = calculateCellSize(
				beatCount,
				containerSize.width,
				containerSize.height,
				beatRows,
				beatCols + 1,
				0
			);
		}

		setTimeout(checkForOverflow, 100);
	});

	// Check for overflow when beat count changes
	$effect(() => {
		if (beatCount >= 0) {
			setTimeout(checkForOverflow, 150);
		}
	});

	// Check for overflow when layout changes
	$effect(() => {
		if (beatRows > 0 && beatCols > 0) {
			setTimeout(checkForOverflow, 150);
		}
	});

	// Check for overflow when size changes
	$effect(() => {
		if (containerSize.width > 0 && containerSize.height > 0) {
			setTimeout(checkForOverflow, 150);
		}
	});

	// Debounced overflow check function
	const checkForOverflow = debounce(() => {
		if (!containerRef) return;

		const container = containerRef;
		const beatFrame = container.querySelector('.beat-frame');

		if (!beatFrame) return;

		// Find the sequence widget container
		const sequenceWidget = container.closest('.sequence-widget') || container.parentElement;

		// Get the available height
		const availableHeight =
			sequenceWidgetHeight > 0
				? sequenceWidgetHeight
				: sequenceWidget
					? sequenceWidget.clientHeight
					: container.clientHeight;

		// Get content dimensions
		const contentHeight = beatFrame.scrollHeight;
		const contentWidth = beatFrame.scrollWidth;
		const containerWidth = container.clientWidth;

		// Buffer to prevent flickering
		const buffer = 10;

		// Calculate overflow
		const heightOverflow = contentHeight > availableHeight - buffer;
		const widthOverflow = contentWidth > containerWidth + buffer;

		// Check if grid is too tall
		const totalGridHeight = beatRows * cellSize;
		const gridTooTall = totalGridHeight > availableHeight - 40;

		const newOverflowState = heightOverflow || widthOverflow || gridTooTall;

		if (contentOverflows !== newOverflowState) {
			contentOverflows = newOverflowState;

			// Update DOM attributes
			setTimeout(() => {
				if (beatFrame) {
					beatFrame.setAttribute('data-rows', String(beatRows));
					beatFrame.setAttribute('data-scrollable', String(newOverflowState));
				}
			}, 0);
		}
	}, 100);

	// Listen for sequence widget dimensions
	$effect(() => {
		if (!browser) return;

		const handleSequenceWidgetDimensions = (event: CustomEvent) => {
			if (event.detail && event.detail.width && event.detail.height) {
				sequenceWidgetWidth = event.detail.width;
				sequenceWidgetHeight = event.detail.height;
			}
		};

		const handleResize = () => {
			setTimeout(checkForOverflow, 100);
		};

		document.addEventListener(
			'sequence-widget-dimensions',
			handleSequenceWidgetDimensions as EventListener
		);
		window.addEventListener('resize', handleResize);

		// Initial overflow check
		setTimeout(checkForOverflow, 200);

		return () => {
			document.removeEventListener(
				'sequence-widget-dimensions',
				handleSequenceWidgetDimensions as EventListener
			);
			window.removeEventListener('resize', handleResize);
		};
	});

	return {
		// State
		get beatRows() {
			return beatRows;
		},
		get beatCols() {
			return beatCols;
		},
		get cellSize() {
			return cellSize;
		},
		get naturalGridHeight() {
			return naturalGridHeight;
		},
		get contentOverflows() {
			return contentOverflows;
		},

		// Methods
		checkForOverflow
	};
}
