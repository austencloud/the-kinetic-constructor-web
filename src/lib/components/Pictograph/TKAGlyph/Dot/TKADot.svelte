<script lang="ts">
	import { onMount } from 'svelte';
	import type { DirRelation } from '../../types/Types';
	export let dirRelation: DirRelation;
	export let visible: boolean = false;
	export let x: number = 0;
	export let y: number = 0;

	// The actual dot svg path
	let dotPath = '/images/same_opp_dot.svg'; // for both same & opp
</script>

<g transform={`translate(${x}, ${y})`} opacity={visible ? 1 : 0}>
	<image href={dotPath} width="12" height="12" />
</g>
