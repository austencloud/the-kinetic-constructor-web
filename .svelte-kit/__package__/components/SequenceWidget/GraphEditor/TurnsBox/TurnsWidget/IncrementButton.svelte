<script>
	export let type = 'increment';
	export let color = 'blue';
</script>

<button
	class="increment-button"
	style="--color: {color}"
	aria-label={type === 'increment' ? 'Increase' : 'Decrease'}
>
	{type === 'increment' ? '+' : '−'}
</button>

<style>
	.increment-button {
		width: 40px;
		height: 40px;
		background-color: var(--color);
		color: white;
		border: none;
		border-radius: 50%;
		font-weight: bold;
		cursor: pointer;
		transition: transform 0.2s;
	}

	.increment-button:hover {
		transform: scale(1.1);
	}
</style>
