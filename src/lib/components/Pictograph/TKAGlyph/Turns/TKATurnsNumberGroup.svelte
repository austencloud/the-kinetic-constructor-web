<!-- TkaTurnsNumberGroup.svelte -->
<script lang="ts">
	import TKANumberItem from './TKANumberItem.svelte';
	import type { TKATurns } from '../../types/Types';

	export let topValue: TKATurns = 0;
	export let bottomValue: TKATurns = 0;
	export let letterRect: {
		left: number;
		right: number;
		top: number;
		bottom: number;
		width: number;
		height: number;
	};

	let topX = 0,
		topY = 0;
	let bottomX = 0,
		bottomY = 0;

	const paddingX = 15;
	const paddingY = 5;

	$: {
		// replicate python. e.g.
		// base_pos_x = letter_scene_rect.right + 15
		// high_pos_y = letter_scene_rect.top -5
		const basePosX = letterRect.right + paddingX;
		const highPosY = letterRect.top - paddingY;

		topX = basePosX;
		topY = highPosY;

		// bottom => letter_scene_rect.bottom + 5
		bottomX = basePosX;
		bottomY = letterRect.bottom + paddingY;
	}
</script>

<g class="turns-number-group">
	{#if topValue !== 0}
		<TKANumberItem value={topValue} x={topX} y={topY} />
	{/if}
	{#if bottomValue !== 0}
		<TKANumberItem value={bottomValue} x={bottomX} y={bottomY} />
	{/if}
</g>
