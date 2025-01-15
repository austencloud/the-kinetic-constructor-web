<script lang="ts">
	import IncrementButton from './IncrementButton.svelte';
	import TurnsLabel from './TurnsLabel.svelte';
	import { parseTurnsValue, displayTurnsValue } from './turnsUtils';

	export let color: 'blue' | 'red' = 'blue';
	export let turns: number | string;
	export let onOpenDialog: () => void;

	let numericTurns = 0;

	// Keep the numeric version
	$: numericTurns = parseTurnsValue(turns);

	/**
	 * adjustTurns: add or subtract 0.5, then clamp to -0.5..3
	 */
	function adjustTurns(delta: number) {
		let newVal = numericTurns + delta;
		if (newVal < -0.5) newVal = -0.5; // "fl"
		if (newVal > 3) newVal = 3;
		numericTurns = newVal;
		// Convert back to string => if -0.5 => "fl"
		turns = displayTurnsValue(numericTurns);
	}

	function incrementTurns() { adjustTurns(0.5); }
	function decrementTurns() { adjustTurns(-0.5); }
</script>

<div class="turns-display-frame">
	<!-- Decrement button: disable if numericTurns <= -0.5 (i.e. "fl") -->
	<IncrementButton
		type="decrement"
		on:click={decrementTurns}
		{color}
		disabled={numericTurns <= -0.5}
	/>

	<!-- The middle "label" that opens the direct-set dialog -->
	<TurnsLabel {turns} {color} onClick={onOpenDialog} />

	<!-- Increment button: disable if numericTurns >= 3 -->
	<IncrementButton
		type="increment"
		on:click={incrementTurns}
		{color}
		disabled={numericTurns >= 3}
	/>
</div>

<style>
	.turns-display-frame {
		display: flex;
		justify-content: space-evenly;
		align-items: center;
		width: 100%;
	}
</style>
