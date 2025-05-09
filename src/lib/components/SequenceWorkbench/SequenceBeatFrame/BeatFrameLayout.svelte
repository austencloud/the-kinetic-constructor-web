<!-- src/lib/components/SequenceWorkbench/SequenceBeatFrame/BeatFrameLayout.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { useResizeObserver } from '$lib/composables/useResizeObserver';
	import { browser } from '$app/environment';
	import { calculateCellSize } from './beatFrameHelpers';
	import BeatGrid from './BeatGrid.svelte';
	import type { BeatData } from './BeatData';
	import type { PictographData } from '$lib/types/PictographData';

	// Props
	export let beats: BeatData[] = [];
	export let selectedBeatIndex: number = -1;
	export let startPosition: PictographData | null = null;
	export let beatRows: number = 1;
	export let beatCols: number = 1;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		'beat-click': { beatIndex: number };
		'start-pos-click': void;
	}>();

	// Set up resize observer
	const ssrDefaults = { width: 800, height: 600 }; // Example reasonable defaults
	const { size, resizeObserver } = useResizeObserver({
		width: browser ? window.innerWidth : 800,
		height: browser ? window.innerHeight : 600
	});

	// Computed properties
	$: beatCount = beats.length;

	// Calculate cell size based on container dimensions
	$: cellSize = calculateCellSize(
		beatCount,
		$size.width || 0,
		$size.height || 0,
		beatRows,
		beatCols + 1, // Add 1 for start position column
		0 // No gap
	);

	// Force recalculation when layout changes
	$: if (beatRows || beatCols) {
		cellSize = calculateCellSize(
			beatCount,
			$size.width || 0,
			$size.height || 0,
			beatRows,
			beatCols + 1,
			0
		);
	}

	// Event handlers
	function handleBeatClick(event: CustomEvent<{ beatIndex: number }>) {
		dispatch('beat-click', { beatIndex: event.detail.beatIndex });
	}

	function handleStartPosClick() {
		dispatch('start-pos-click');
	}
</script>

<div use:resizeObserver class="beat-frame-container scrollable">
	<BeatGrid
		{beats}
		{selectedBeatIndex}
		{startPosition}
		{beatRows}
		{beatCols}
		{cellSize}
		on:beat-click={handleBeatClick}
		on:start-pos-click={handleStartPosClick}
	/>
</div>

<style>
	.beat-frame-container {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
		position: relative;
	}

	.scrollable {
		overflow-y: auto; /* Show vertical scrollbar when content overflows */
		overflow-x: hidden; /* Hide horizontal scrollbar */
		align-items: flex-start; /* Align content to the top when scrolling */
	}
</style>
