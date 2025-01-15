<script lang="ts">
	import IncrementButton from './IncrementButton.svelte';
	import TurnsLabel from './TurnsLabel.svelte';
  
	export let color = 'blue';
	export let turns: number | string;
	export let onOpenDialog: () => void;
  
	const adjustTurns = (delta: number) => {
	  if (typeof turns === 'number') {
		turns = Math.max(0, Math.min(turns + delta, 3));
	  }
	};
  
	const incrementTurns = () => adjustTurns(0.5);
	const decrementTurns = () => adjustTurns(-0.5);
  </script>
  
  <div class="turns-display-frame">
	<IncrementButton
	  type="decrement"
	  on:click={decrementTurns}
	  {color}
	  disabled={turns === 0}
	/>
	<TurnsLabel {turns} {color} on:click={onOpenDialog} />
	<IncrementButton
	  type="increment"
	  on:click={incrementTurns}
	  {color}
	  disabled={turns === 3}
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
  