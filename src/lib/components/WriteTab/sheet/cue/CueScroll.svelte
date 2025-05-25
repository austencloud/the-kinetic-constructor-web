<script lang="ts">
	import { actState } from '../../state/actState.svelte';
	import { uiState } from '../../state/uiState.svelte';
	import CueBox from './CueBox.svelte';

	// Props using Svelte 5 runes
	const { onscroll } = $props<{
		onscroll?: (event: { scrollTop: number }) => void;
	}>();

	// Grid dimensions
	const ROWS = 24;

	let scrollElement = $state<HTMLDivElement>();

	// Handle scroll events
	function handleScroll() {
		if (scrollElement) {
			onscroll?.({ scrollTop: scrollElement.scrollTop });
		}
	}

	// Handle cue updates
	function handleCueUpdate(event: { row: number; cue: string; timestamp: string }) {
		const { row, cue, timestamp } = event;
		actState.updateCueAndTimestamp(row, cue, timestamp);
	}

	// Sync scroll position when the UI state updates
	$effect(() => {
		if (scrollElement && uiState.cueScrollPosition !== undefined) {
			scrollElement.scrollTop = uiState.cueScrollPosition;
		}
	});
</script>

<div class="cue-scroll" bind:this={scrollElement} onscroll={handleScroll}>
	<div class="cue-container">
		{#each Array(ROWS) as _, rowIndex}
			<CueBox
				row={rowIndex}
				cue={actState.act.sequences[rowIndex]?.cue || ''}
				timestamp={actState.act.sequences[rowIndex]?.timestamp || ''}
				onupdate={handleCueUpdate}
			/>
		{/each}
	</div>
</div>

<style>
	.cue-scroll {
		width: 200px;
		min-width: 150px; /* Minimum width */
		max-width: 250px; /* Maximum width */
		overflow-y: hidden; /* Hide vertical scrollbar */
		overflow-x: hidden;
		background-color: #252525;
		border-right: 1px solid #333;
	}

	.cue-container {
		display: grid;
		grid-auto-rows: minmax(
			var(--cell-size, 80px),
			auto
		); /* Match the grid row height and allow growth */
		width: 100%;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.cue-scroll {
			width: 150px;
		}
	}

	@media (max-width: 480px) {
		.cue-scroll {
			width: 120px;
		}
	}
</style>
