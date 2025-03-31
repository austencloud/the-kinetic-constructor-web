<!-- src/lib/components/SequenceWorkbench/GraphEditor/TurnsBox/TurnsWidget/TurnsDisplayFrame.svelte -->
<script lang="ts">
	import IncrementButton from './IncrementButton.svelte';
	import TurnsLabel from './TurnsLabel.svelte';
	import { turnsStore, blueTurns, redTurns } from '$lib/stores/turnsStore';
	import { isMaxTurns, isMinTurns } from './turnsUtils';

	
	export let color: 'blue' | 'red';
	export let onOpenDialog: () => void;
	export let width: number;

	// Get the appropriate turns store based on color
	$: turnsValue = color === 'blue' ? $blueTurns : $redTurns;
	
	// Calculate font size based on width with a minimum value of 20px
	$: fontSize = Math.min(width / 20, 20) + 'px';
	
	// Handle increment/decrement actions
	function handleIncrement() {
		turnsStore.incrementTurns(color);
	}
	
	function handleDecrement() {
		turnsStore.decrementTurns(color);
	}
</script>

<div class="turns-display-frame" style="font-size: {fontSize};">
	<!-- Decrement button -->
	<IncrementButton
		type="decrement"
		on:click={handleDecrement}
		{color}
		disabled={isMinTurns(turnsValue)}
	/>

	<!-- The middle "label" that opens the direct-set dialog -->
	<TurnsLabel turns={turnsValue} {color} onClick={onOpenDialog} />

	<!-- Increment button -->
	<IncrementButton
		type="increment"
		on:click={handleIncrement}
		{color}
		disabled={isMaxTurns(turnsValue)}
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