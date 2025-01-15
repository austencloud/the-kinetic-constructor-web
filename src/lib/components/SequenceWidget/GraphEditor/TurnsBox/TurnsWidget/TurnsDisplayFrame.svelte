<script lang="ts">
	import IncrementButton from './IncrementButton.svelte';
	import TurnsLabel from './TurnsLabel.svelte';

	export let color = 'blue'; // Pass color as a prop

	// Centralized turns state
	let turns = 0;

	const adjustTurns = (delta: number) => {
		turns = Math.max(0, Math.min(turns + delta, 3)); // Clamp turns between 0 and 3
		if (turns === 1.0 || turns === 2.0 || turns === 3.0) {
			turns = Math.round(turns);
		}
	};

	const incrementTurns = () => adjustTurns(0.5);
	const decrementTurns = () => adjustTurns(-0.5);
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
