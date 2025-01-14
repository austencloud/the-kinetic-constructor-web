<script lang="ts">
	import LayoutControls from './LayoutControls.svelte';
	import GridPreview from './GridPreview.svelte';
	import { onMount, tick } from 'svelte';

	export let numBeats: number = 16;

	let currentLayout = { rows: 4, cols: 4 };
	let grid: number[][] = [];
	let validLayouts: { rows: number; cols: number }[] = [];
	let dialogRef: HTMLDivElement | null = null;

	// Fetch layouts and transform data
	const fetchLayouts = async () => {
		try {
			const response = await fetch('/beat_frame_layout_options.json');
			if (!response.ok) throw new Error(`Failed to fetch layouts: ${response.statusText}`);
			const data = await response.json();
			validLayouts =
				data[numBeats]?.map(([rows, cols]: [number, number]) => ({ rows, cols })) || [];
			if (validLayouts.length > 0) currentLayout = validLayouts[0];
			updateGrid();
		} catch (error) {
			console.error('Error loading layouts:', error);
		}
	};

	// Update the grid preview
	const updateGrid = () => {
		grid = Array.from({ length: currentLayout.rows }, (_, row) =>
			Array.from({ length: currentLayout.cols }, (_, col) => col + 1 + row * currentLayout.cols)
		);
	};



	// Handle layout change
	const handleLayoutChange = (layout: { rows: number; cols: number }) => {
		currentLayout = layout;
		updateGrid();
	};

	// Handle sequence length change
	const handleSequenceLengthChange = async (delta: number) => {
		numBeats = Math.max(1, Math.min(64, numBeats + delta));
		await fetchLayouts();
		updateGrid();
	};

	// Fetch layouts and attach resize listener

</script>

<div class="settings-dialog" bind:this={dialogRef}>
	<div class="layout-controls">
		<LayoutControls
			{numBeats}
			{currentLayout}
			{validLayouts}
			onSequenceLengthChange={(e) => handleSequenceLengthChange(e.detail)}
			onLayoutChange={(e) => handleLayoutChange(e.detail)}
		/>
	</div>

	<div class="grid-preview">
		<GridPreview {grid} {numBeats} />
	</div>
</div>

<style>
	.settings-dialog {
		display: flex;
		flex-direction: column;
		gap: 20px;
		width: 100%;
		height: 100%;
		padding: 10px;
		box-sizing: border-box;
	}

	.layout-controls {
		flex: 0 0 auto;
	}

	.grid-preview {
		flex: 1 1 auto;
		display: flex;
		overflow: hidden;
	}
</style>
