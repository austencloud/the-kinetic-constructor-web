<script lang="ts">
	import ActHeader from './header/ActHeader.svelte';
	import BeatGrid from './grid/BeatGrid.svelte';
	import CueScroll from './cue/CueScroll.svelte';
	import { uiState } from '../state/uiState.svelte';

	// Reactive variable to store the current cell size
	let currentCellSize = $state(uiState.cellSize);

	// Handle synchronized scrolling between beat grid and cue scroll
	function handleBeatGridScroll(event: { scrollTop: number }) {
		uiState.updateBeatGridScroll(event.scrollTop);
		uiState.updateCueScrollPosition(event.scrollTop);
	}

	function handleCueScrollScroll(event: { scrollTop: number }) {
		uiState.updateCueScrollPosition(event.scrollTop);
		uiState.updateBeatGridScroll(event.scrollTop);
	}

	// Handle grid resize events
	function handleGridResize(event: { cellSize: number; width?: number; height?: number }) {
		currentCellSize = event.cellSize;
		uiState.updateCellSize(event.cellSize);
	}
</script>

<div class="sheet-panel">
	<ActHeader />

	<div class="sheet-content" style="--current-cell-size: {currentCellSize}px;">
		<CueScroll onscroll={handleCueScrollScroll} />
		<BeatGrid onscroll={handleBeatGridScroll} onresize={handleGridResize} />
	</div>
</div>

<style>
	.sheet-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		background-color: #1a1a1a;
		color: #e0e0e0;
	}

	.sheet-content {
		display: grid;
		grid-template-columns: auto 1fr; /* First column for cues, second for grid */
		flex: 1;
		overflow: hidden;
		--cell-size: var(--current-cell-size, 80px); /* Share cell size with children */
	}
</style>
