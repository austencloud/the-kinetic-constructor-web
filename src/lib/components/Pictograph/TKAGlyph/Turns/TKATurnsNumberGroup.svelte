<!-- TkaTurnsNumberGroup.svelte -->
<script lang="ts">
	import TkaNumberItem from './TKANumberItem.svelte';
	export let topValue: any;
	export let bottomValue: any;
  
	let topX = 80, topY = -20;
	let bottomX = 80, bottomY = 20;
  </script>
  
  <g class="turns-number-group">
	{#if topValue != 0}
	  <TkaNumberItem value={topValue} x={topX} y={topY} />
	{/if}
	{#if bottomValue != 0}
	  <TkaNumberItem value={bottomValue} x={bottomX} y={bottomY} />
	{/if}
  </g>
  