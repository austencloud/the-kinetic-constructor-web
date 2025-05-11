<!-- src/lib/components/BeatFrame/BeatFrame.svelte -->
<script lang="ts">
	import { workbenchStore } from '$lib/state/stores/workbenchStore';
	import { onMount } from 'svelte';
	import Pictograph from './Pictograph/Pictograph.svelte';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
	import { tick } from 'svelte';
	import type { Beat } from '$lib/types/Beat';
	import type { BeatData } from '$lib/state/stores/sequence/SequenceContainer';
	import type { PictographData } from '$lib/types/PictographData';
	import type { Letter } from '$lib/types/Letter'; // Import Letter type
	import type { TKAPosition } from '$lib/types/TKAPosition'; // Import TKAPosition type

	// Animation state tracking
	const hasAnimated = new Map<string, boolean>();

	// Get beats from the sequence container store
	const sequenceState = $sequenceContainer;

	const beats = $derived(
		sequenceState.beats.map((beatData: BeatData): Beat => {
			const pictographData: PictographData = {
				letter: (beatData.letter as Letter) || null,
				startPos: (beatData.position as TKAPosition) || null,
				endPos: null, // Placeholder, determine if available from beatData or elsewhere
				// Properties like orientation, motionType, leadState belong in MotionData, not directly here.
				gridMode: 'diamond', // Example default, should come from beatData or context if dynamic

				redMotionData: beatData.redMotionData || null,
				blueMotionData: beatData.blueMotionData || null,

				redPropData: beatData.redPropData || null,
				bluePropData: beatData.bluePropData || null,

				redArrowData: beatData.redArrowData || null,
				blueArrowData: beatData.blueArrowData || null,

				grid: typeof beatData.metadata?.grid === 'string' ? beatData.metadata.grid : '', // Ensure grid is a string
				gridData: null, // Added missing property, initialize as null or from beatData

				// VTG properties if available in beatData, otherwise null
				timing: null, // Placeholder
				direction: null // Placeholder
			};
			return {
				id: beatData.id,
				beatNumber: beatData.number,
				pictographData: pictographData,
				filled: true, // Assuming all beats in the sequence are 'filled'
				metadata: beatData.metadata
					? {
							...beatData.metadata,
							letter: (beatData.letter as Letter) || (beatData.metadata as any)?.letter
						}
					: { letter: beatData.letter as Letter }
			};
		})
	);

	onMount(() => {
		// Reset animation state on component mount only
		hasAnimated.clear();
	});
</script>

{#key null}
	<!-- Never re-render on tab switch -->
	<div class="beat-frame">
		{#each beats as beat (beat.id)}
			<Pictograph
				shouldAnimate={!hasAnimated.has(beat.id)}
				on:animationComplete={() => {
					hasAnimated.set(beat.id, true);
				}}
			/>
		{/each}
	</div>
{/key}

<style>
	.beat-frame {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		gap: 1rem;
		padding: 1rem;
		width: 100%;
		height: 100%;
		overflow: auto;
		align-items: center;
		justify-items: center;
	}
</style>
