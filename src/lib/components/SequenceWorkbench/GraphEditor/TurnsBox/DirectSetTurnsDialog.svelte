<script lang="ts">
	import DirectSetTurnsButton from './DirectSetTurnsButton.svelte';

	export let onSelectTurns: (value: string) => void;
	export let onClose: () => void;
	export let color: 'blue' | 'red';

	const turnsValues = ['fl', '0', '0.5', '1', '1.5', '2', '2.5', '3'];

	const HEX_RED = '#ED1C24';
	const HEX_BLUE = '#2E3192';

	$: borderColor = color === 'blue' ? HEX_BLUE : HEX_RED;

	import { lighten } from 'polished';

	$: dialogBackground =
		color === 'blue'
			? `linear-gradient(135deg, ${lighten(0.4, 'rgba(46,49,146,0.4)')}, ${lighten(0.2, 'rgba(46,49,146,0.8)')}), #fff`
			: `linear-gradient(135deg, ${lighten(0.4, 'rgba(237,28,36,0.4)')}, ${lighten(0.2, 'rgba(237,28,36,0.8)')}), #fff`;
</script>
<button
	class="overlay"
	on:click={onClose}
	on:keydown={(e) => e.key === 'Enter' && onClose()}
	aria-label="Close dialog"
></button>

<!-- The .dialog has the multi-layer background: gradient over white. -->
<div
	class="dialog"
	style="
		border-color: {borderColor};
		background: {dialogBackground};
	"
>
	{#each turnsValues as value}
		<DirectSetTurnsButton {value} {borderColor}  onClick={() => onSelectTurns(value)} />
	{/each}
</div>

<style>
	.overlay {
		position: absolute;
		inset: 0; /* shorthand for top: 0; left: 0; right: 0; bottom: 0 */
		background-color: rgba(0, 0, 0, 0.2);
		z-index: 0;
		cursor: pointer;
	}

	.dialog {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 3%;
		border: 3px solid;
		border-radius: 5%;
		padding: 3%;
		z-index: 1;
		height: 80%;
		width: 80%;
		align-items: center;
		justify-content: space-evenly;
		/* 
		   Because the gradient uses transparency, you’ll see the solid #fff behind it,
		   creating a subtle fade effect.
		*/
	}
</style>
