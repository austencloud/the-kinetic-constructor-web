<script lang="ts">
	import { parseTurnsValue, displayTurnsValue } from './turnsUtils';

	export let turns: string | number = 0;
	export let color: 'blue' | 'red' = 'blue';

	// This is how we open the "DirectSetTurnsDialog":
	export let onClick: () => void;

	// We'll maintain a numeric version internally
	let numericTurns = 0;

	// Whenever 'turns' changes, parse it into -0.5 for "fl", or else a float
	$: numericTurns = parseTurnsValue(turns);

	function handleClick() {
		onClick?.();
	}
</script>

<button
	class="turns-label"
	style="--color: {color}"
	on:click={handleClick}
>
	<!-- For display, convert -0.5 => "fl", etc. -->
	{displayTurnsValue(numericTurns)}
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
		transition: transform 0.1s, background-color 0.2s;
	}
	.turns-label:hover {
		transform: scale(1.1);
		box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3),
			inset 0px 1px 3px rgba(255, 255, 255, 0.5);
	}
	.turns-label:active {
		transform: scale(0.9);
	}
</style>
