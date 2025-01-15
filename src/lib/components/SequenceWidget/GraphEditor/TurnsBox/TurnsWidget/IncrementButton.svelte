<script>
	export let type = 'increment'; // Increment or decrement
	export let color = 'blue'; // Button color
	export let disabled = false; // Button disabled state
</script>
<button
	class="increment-button"
	style="--color: {color}"
	on:click
	aria-label={type === 'increment' ? 'Increase' : 'Decrease'}
	disabled={disabled}
>
	{type === 'increment' ? '+' : '−'}
</button>

<style>
	.increment-button {
		width: 20%;
		background-color: white;
		color: black;
		border: 3px solid var(--color);
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
