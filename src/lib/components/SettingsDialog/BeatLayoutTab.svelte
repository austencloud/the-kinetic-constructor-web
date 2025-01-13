<script lang="ts">
	import { onMount } from 'svelte';

	// Number of beats in the sequence
	export let numBeats: number = 16;

	// Current layout (rows x columns)
	let currentLayout: { rows: number; cols: number } = { rows: 4, cols: 4 };

	// Valid layouts (example layouts for simplicity)
	let validLayouts: { rows: number; cols: number }[] = [
		{ rows: 1, cols: 16 },
		{ rows: 2, cols: 8 },
		{ rows: 4, cols: 4 },
		{ rows: 8, cols: 2 },
		{ rows: 16, cols: 1 }
	];

	// Explicitly define the parameter type for layout
	const handleLayoutChange = (layout: { rows: number; cols: number }) => {
		currentLayout = layout;
		updateGrid();
	};

	const updateGrid = () => {
		// Update grid layout based on currentLayout and numBeats
		grid = Array.from({ length: currentLayout.rows }, (_, row) =>
			Array.from({ length: currentLayout.cols }, (_, col) => col + 1 + row * currentLayout.cols)
		);
	};

	const handleSequenceLengthChange = (delta: number) => {
		numBeats = Math.max(1, Math.min(64, numBeats + delta));
		updateGrid();
	};

	let grid: number[][] = [];
	onMount(updateGrid);
</script>

<div class="beat-layout-tab">
	<div class="controls">
		<!-- Sequence Length Controls -->
		<div class="sequence-length">
			<button class="length-btn" on:click={() => handleSequenceLengthChange(-1)}>-</button>
			<span>{numBeats}</span>
			<button class="length-btn" on:click={() => handleSequenceLengthChange(1)}>+</button>
		</div>

		<!-- Layout Selector -->
		<div class="layout-selector">
			<label for="layout-dropdown">Select Layout:</label>
			<select
				id="layout-dropdown"
				on:change={(e) => handleLayoutChange(validLayouts[(e.target as HTMLSelectElement).selectedIndex])}
			>
				{#each validLayouts as { rows, cols }}
					<option>
						{rows} x {cols}
					</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Grid Preview -->
	<div class="grid">
		{#each grid as row}
			<div class="grid-row">
				{#each row as beat}
					<div class="grid-cell">
						<span>{beat <= numBeats ? beat : ''}</span>
					</div>
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	/* Styles remain the same */
	.beat-layout-tab {
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.controls {
		display: flex;
		justify-content: space-between;
		gap: 20px;
	}

	.sequence-length {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.length-btn {
		background-color: #f0f0f0;
		border: 1px solid #ccc;
		border-radius: 5px;
		padding: 5px 10px;
		cursor: pointer;
		font-size: 1rem;
		transition: background-color 0.2s;
	}

	.length-btn:hover {
		background-color: #ddd;
	}

	.layout-selector {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	select {
		padding: 5px;
		border: 1px solid #ccc;
		border-radius: 5px;
		font-size: 1rem;
	}

	.grid {
		display: grid;
		gap: 5px;
	}

	.grid-row {
		display: flex;
		gap: 5px;
	}

	.grid-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background-color: #f0f0f0;
		border: 1px solid #ccc;
		border-radius: 5px;
		font-size: 0.8rem;
		font-weight: bold;
	}
</style>
