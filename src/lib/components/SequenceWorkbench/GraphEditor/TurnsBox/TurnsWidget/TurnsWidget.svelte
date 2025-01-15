<script lang="ts">
	import TurnsTextLabel from './TurnsTextLabel.svelte';
	import TurnsDisplayFrame from './TurnsDisplayFrame.svelte';
	import MotionTypeLabel from './MotionTypeLabel.svelte';
  
	export let color: 'blue' | 'red' ;
	export let turns: string | number;
	export let onOpenDialog: () => void;
  </script>
  
  <div class="turns-widget">
	<TurnsTextLabel />
	<TurnsDisplayFrame {color} {turns} {onOpenDialog} />
	<MotionTypeLabel />
  </div>
  
  <style>
	.turns-widget {
	  display: flex;
	  flex-direction: column;
	  gap: 10px;
	  padding: 10px;
	  flex: 1;
	  justify-content: space-evenly;
	}
  </style>
  