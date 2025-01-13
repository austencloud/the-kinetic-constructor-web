<script lang="ts">
	export let grid: number[][] = [];
	export let numBeats: number = 16;
	export let containerWidth: number = 0;
	export let containerHeight: number = 0;

	let cellSize = 40; // Default size

	// Calculate the size of each cell based on the container dimensions
	const calculateCellSize = () => {
		// Ensure valid dimensions are available
		if (containerWidth > 0 && containerHeight > 0 && grid.length > 0) {
			const cols = grid[0]?.length || 1; // Number of columns
			const rows = grid.length || 1; // Number of rows
			const gap = 5; // Gap between cells

			// Calculate available width and height for cells
			const availableWidth = containerWidth - gap * (cols - 1);
			const availableHeight = containerHeight - gap * (rows - 1);

			// Calculate max width and height of each cell
			const maxWidth = availableWidth / cols;
			const maxHeight = availableHeight / rows;

			// Use the smaller of the two to avoid overflow
			cellSize = Math.max(10, Math.min(maxWidth, maxHeight)); // Minimum size of 10px
		} else {
			cellSize = 10; // Fallback size
			console.warn('Invalid container dimensions or grid not ready.');
		}
	};

	$: calculateCellSize();
</script>

<div class="grid">
	{#each grid as row}
		<div class="grid-row">
			{#each row as beat (beat)}
				{#if beat <= numBeats}
					<div
						class="grid-cell"
						style="width: {cellSize}px; height: {cellSize}px;"
					>
						{beat}
					</div>
				{/if}
			{/each}
		</div>
	{/each}
</div>

<style>
	.grid {
		display: flex;
		flex-direction: column;
		gap: 5px; /* Gap between rows */
		width: 100%;
		height: 100%;
	}

	.grid-row {
		display: flex;
		gap: 5px; /* Gap between cells in a row */
		width: 100%;
		justify-content: center;
	}

	.grid-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f0f0f0;
		border: 1px solid #ccc;
		border-radius: 5px;
		font-size: 1rem;
		font-weight: bold;
		text-align: center;
		box-sizing: border-box; /* Ensures padding/border don't affect size */
		overflow: hidden; /* Prevents text overflow */
	}
</style>
