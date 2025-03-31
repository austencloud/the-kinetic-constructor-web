<!-- src/lib/components/SequenceWorkbench/GraphEditor/TurnsBox/TurnsWidget/TurnsLabel.svelte -->
<script lang="ts">
	import type { TurnsValue } from './turnsUtils';

	export let turns: TurnsValue;
	export let color: 'blue' | 'red';
	export let onClick: () => void;

	// Determine the color for styling
	$: colorHex = color === 'blue' ? '#2E3192' : '#ED1C24';
</script>

<button
	class="turns-label"
	style="--color: {colorHex}"
	on:click={onClick}
	aria-label="Set turns value"
>
	{typeof turns === 'number' ? turns : turns}
</button>

<style>
	.turns-label {
		color: black;
		font-weight: bold;
		font-size: 3.5em;
		display: flex;
		justify-content: center;
		cursor: pointer;
		border: 4px solid var(--color);
		background-color: white;
		width: 30%;
		border-radius: 50%;
		height: 100%;
		align-items: center;
		transition:
			transform 0.1s,
			background-color 0.2s;
	}
	.turns-label:hover {
		transform: scale(1.1);
		box-shadow:
			0px 4px 8px rgba(0, 0, 0, 0.3),
			inset 0px 1px 3px rgba(255, 255, 255, 0.5);
	}
	.turns-label:active {
		transform: scale(0.9);
	}
</style>
