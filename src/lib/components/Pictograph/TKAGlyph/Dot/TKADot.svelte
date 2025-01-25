<!-- TkaDot.svelte -->
<script lang="ts">
	export let visible: boolean = false;
	export let x: number = 0;
	export let y: number = 0;
  
	let dotPath = '/images/same_opp_dot.svg';
  </script>
  
  <g transform={`translate(${x}, ${y})`} opacity={visible ? 1 : 0}>
	<image href={dotPath} width="12" height="12" />
  </g>
  