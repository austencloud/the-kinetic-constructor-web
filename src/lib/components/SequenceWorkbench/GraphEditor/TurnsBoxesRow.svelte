<!-- src/lib/components/SequenceWorkbench/GraphEditor/TurnsBoxesRow.svelte -->
<script lang="ts">
	import TurnsBox from './TurnsBox/TurnsBox.svelte';
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Direction } from '$lib/stores/sequence/turnsStore';
	import type { PropRotDir } from '$lib/types/Types';

	// Define props using Svelte 5 runes syntax
	const props = $props<{
		onTurnsChanged: (data: { color: 'blue' | 'red'; turns: any }) => void;
		onDirectionChanged: (data: { color: 'blue' | 'red'; direction: PropRotDir }) => void;
	}>();

	// Handle turns changed event
	function handleTurnsChanged(data: { color: 'blue' | 'red'; turns: any }) {
		if (props.onTurnsChanged) {
			props.onTurnsChanged(data);
		}
	}

	// Handle direction changed event
	function handleDirectionChanged(data: { color: 'blue' | 'red'; direction: Direction }) {
		if (props.onDirectionChanged) {
			// Convert Direction to PropRotDir
			const propRotDir: PropRotDir =
				data.direction === 'clockwise'
					? 'cw'
					: data.direction === 'counterclockwise'
						? 'ccw'
						: 'no_rot';

			props.onDirectionChanged({
				color: data.color,
				direction: propRotDir
			});
		}
	}
</script>

<div class="turns-boxes-row" in:fade={{ duration: 200, delay: 100, easing: cubicOut }}>
	<div class="turns-box-container blue-box">
		<TurnsBox
			color="blue"
			onTurnsChanged={handleTurnsChanged}
			onDirectionChanged={handleDirectionChanged}
		/>
	</div>

	<div class="turns-box-container red-box">
		<TurnsBox
			color="red"
			onTurnsChanged={handleTurnsChanged}
			onDirectionChanged={handleDirectionChanged}
		/>
	</div>
</div>

<style>
	/* Container for horizontal arrangement of TurnsBox components below pictograph */
	.turns-boxes-row {
		display: flex;
		flex-direction: row;
		justify-content: center; /* Center boxes horizontally */
		align-items: stretch; /* Stretch boxes to equal height */
		width: 100%;
		gap: 1.5rem; /* Increased gap for better spacing */
		/* Ensure proper containment */
		contain: layout;
		/* Add minimum height to ensure visibility */
		min-height: 200px;
		/* Prevent overflow */
		overflow: visible;
	}

	.turns-box-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: center;
		height: 100%;
		min-width: 0; /* Allow container to shrink below content size */
		max-width: 350px; /* Prevent boxes from getting too wide */
		width: 100%; /* Take full width of parent up to max-width */
		/* Ensure the turns box container doesn't affect other components */
		box-sizing: border-box;
		/* Add subtle transition for smoother resizing */
		transition: all 0.3s ease;
		/* Prevent overflow */
		overflow: hidden;
		/* Ensure proper containment */
		contain: layout paint;
		/* Add minimum height to ensure visibility */
		min-height: 200px;
		/* Add maximum height to prevent excessive stretching */
		max-height: 400px;
	}

	/* Responsive adjustments for different screen sizes */
	@media (max-width: 768px) {
		.turns-boxes-row {
			gap: 1rem; /* Reduced gap on smaller screens */
		}

		.turns-box-container {
			max-width: 300px; /* Smaller max-width on smaller screens */
		}
	}

	@media (max-width: 480px) {
		.turns-boxes-row {
			gap: 0.75rem; /* Further reduced gap on mobile */
		}

		.turns-box-container {
			max-width: 250px; /* Even smaller max-width on mobile */
			min-height: 180px; /* Reduced min-height on mobile */
		}
	}
</style>
