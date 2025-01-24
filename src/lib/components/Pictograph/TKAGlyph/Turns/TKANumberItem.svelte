<script lang="ts">
	import type { TkaTurns } from "../../types/Types";


	export let value: TkaTurns = 0;
	export let x: number = 0;
	export let y: number = 0;

	let numberPath: string = '';
	$: numberPath = computeNumberPath(value);

	function computeNumberPath(turns: TkaTurns | string | null): string {
		if (turns === null) return '';
		if (turns === 'fl') return '/images/numbers/float.svg';
		if (turns === 0) return '';
		return `/images/numbers/${turns}.svg`;
	}
</script>

<g transform={`translate(${x}, ${y})`} opacity={numberPath ? 1 : 0}>
	{#if numberPath}
		<image href={numberPath} width="18" height="18" />
	{/if}
</g>
