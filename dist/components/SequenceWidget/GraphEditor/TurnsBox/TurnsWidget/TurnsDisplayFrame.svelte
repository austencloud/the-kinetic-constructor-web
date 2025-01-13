<script>
	import IncrementButton from './IncrementButton.svelte';
	import TurnsLabel from './TurnsLabel.svelte';

	export let color = 'blue';

	let turns = 0;

	const incrementTurns = () => {
		turns = Math.min(turns + 0.5, 3);
	};

	const decrementTurns = () => {
		turns = Math.max(turns - 0.5, 0);
	};
</script>

<div class="turns-display-frame">
	<IncrementButton type="decrement" on:click={decrementTurns} {color} />
	<TurnsLabel {turns} {color} />
	<IncrementButton type="increment" on:click={incrementTurns} {color} />
</div>

<style>
	.turns-display-frame {
		display: flex;
		justify-content: space-evenly;
		align-items: center;
		width: 100%;
	}
</style>
