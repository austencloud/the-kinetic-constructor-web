<!-- src/lib/components/SequenceWorkbench/GraphEditor/TurnsBox/DirectSetTurnsButton.svelte -->
<script lang="ts">
	export let value: string;
	export let borderColor: string;
	export let onClick: () => void;
</script>

<button
	class="button"
	style="border-color: {borderColor};"
	on:click={onClick}
	aria-label={`Set turns to ${value}`}
>
	{value}
</button>

<style>
	.button {
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: white;
		cursor: pointer;
		font-weight: bold;
		width: 100%;
		transition:
			background-color 0.3s,
			transform 0.2s,
			box-shadow 0.2s;
		aspect-ratio: 1 / 1;
		font-size: 2em;
		border: 4px solid;
	}

	.button:hover {
		background-color: #e0e7ff;
		box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
		transform: scale(1.1);
	}

	.button:active {
		background-color: #c7d2fe;
		box-shadow: inset 0px 4px 8px rgba(0, 0, 0, 0.2);
	}
</style>
