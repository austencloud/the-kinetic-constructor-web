<!-- src/lib/components/SequenceWorkbench/SequenceBeatFrame/BeatContainer.svelte -->
<script lang="ts">
	import Beat from './Beat.svelte';
	import SelectionOverlay from './SelectionOverlay.svelte';
	import ReversalGlyph from './ReversalGlyph.svelte';
	import type { BeatData } from './BeatData';

	// Props
	export let beat: BeatData;
	export let isSelected: boolean = false;
	export let gridRow: number;
	export let gridColumn: number;
	export let onClick: () => void;

	// Computed properties
	$: hasReversal = beat.metadata?.blueReversal || beat.metadata?.redReversal;
</script>

<div
	class="beat-container"
	class:selected={isSelected}
	style="grid-row: {gridRow}; grid-column: {gridColumn};"
>
	<Beat {beat} {onClick} />

	{#if hasReversal}
		<div class="reversal-indicator">
			<ReversalGlyph
				blueReversal={beat.metadata?.blueReversal || false}
				redReversal={beat.metadata?.redReversal || false}
			/>
		</div>
	{/if}
	
	<SelectionOverlay {isSelected} />
</div>

<style>
	.beat-container {
		position: relative;
		width: var(--adjusted-cell-size, var(--cell-size));
		height: var(--adjusted-cell-size, var(--cell-size));
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: transparent;
		transition:
			width 0.3s ease,
			height 0.3s ease;
		box-sizing: border-box;
		overflow: hidden;
	}

	.reversal-indicator {
		position: absolute;
		bottom: 5px;
		right: 5px;
		z-index: 2;
	}
</style>
