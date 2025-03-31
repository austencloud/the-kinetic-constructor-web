<!-- src/lib/components/SequenceWorkbench/GraphEditor/TurnsBox/TurnsWidget/IncrementButton.svelte -->
<script lang="ts">
	type IncrementType = 'increment' | 'decrement';
	
	export let type: IncrementType = 'increment';
	export let color: 'blue' | 'red' = 'blue';
	export let disabled: boolean = false;
	
	// Determine color hex code based on color prop
	$: colorHex = color === 'blue' ? '#2E3192' : '#ED1C24';
	
	// Determine button symbol based on type prop
	$: symbol = type === 'increment' ? '+' : '−';
	
	// Determine button label for accessibility
	$: ariaLabel = type === 'increment' ? 'Increase turns' : 'Decrease turns';
</script>

<button
	class="increment-button"
	style="--color: {colorHex}"
	on:click
	aria-label={ariaLabel}
	{disabled}
>
	{symbol}
</button>

<style>
	.increment-button {
		width: 20%;
		background-color: white;
		color: black;
		border: 4px solid var(--color);
		border-radius: 50%;
		cursor: pointer;
		transition: transform 0.2s;
		aspect-ratio: 1/1;
		transition-duration: 0.1s;
		font-size: 2em;
	}

	.increment-button:hover:enabled {
		transform: scale(1.1);
		box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3),
			inset 0px 1px 3px rgba(255, 255, 255, 0.5);
	}

	.increment-button:active:enabled {
		transform: scale(0.9);
	}

	.increment-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>