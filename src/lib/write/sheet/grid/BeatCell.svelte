<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { selectionStore, selectedBeat } from '../../stores/selectionStore';
	import type { Beat } from '../../models/Act';

	export let row: number;
	export let col: number;
	export let beat: Beat | undefined = undefined;

	const dispatch = createEventDispatcher();

	// Determine if this cell is selected
	$: isSelected = $selectedBeat?.row === row && $selectedBeat?.col === col;

	// Determine if this cell has content
	$: isFilled = beat?.is_filled || !!beat?.pictograph_data;

	// Handle click events
	function handleClick() {
		dispatch('click', { row, col });
	}

	// Generate beat number for display
	$: beatNumber = beat?.beat_number || row * 8 + col + 1;
</script>

<div
	class="beat-cell"
	class:filled={isFilled}
	class:selected={isSelected}
	data-row={row}
	data-col={col}
	on:click={handleClick}
	on:keydown={(e) => e.key === 'Enter' && handleClick()}
	tabindex="0"
	role="button"
	aria-label={`Beat ${beatNumber}`}
>
	{#if isFilled}
		<div class="beat-content">
			<!-- Placeholder for pictograph visualization -->
			<div class="pictograph-placeholder">
				<span class="beat-number">{beatNumber}</span>
			</div>
		</div>
	{:else}
		<div class="empty-cell">
			<span class="beat-number">{beatNumber}</span>
		</div>
	{/if}
</div>

<style>
	.beat-cell {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #222;
		border-radius: 4px;
		cursor: pointer;
		transition:
			background-color 0.2s,
			transform 0.1s;
		user-select: none;
	}

	.beat-cell:hover {
		background-color: #2a2a2a;
	}

	.beat-cell.filled {
		background-color: #2c3e50;
	}

	.beat-cell.filled:hover {
		background-color: #34495e;
	}

	.beat-cell.selected {
		background-color: #2980b9;
		transform: scale(0.95);
		box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.5);
		z-index: 1;
	}

	.beat-content {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pictograph-placeholder {
		width: 80%;
		height: 80%;
		background-color: #3498db;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: bold;
	}

	.empty-cell {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #555;
	}

	.beat-number {
		font-size: 0.75rem;
		opacity: 0.7;
	}
</style>
