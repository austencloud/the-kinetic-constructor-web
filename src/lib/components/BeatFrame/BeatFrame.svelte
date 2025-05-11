<!-- src/lib/components/BeatFrame/BeatFrame.svelte -->
<script lang="ts">
	import { workbenchStore } from '$lib/state/stores/workbenchStore';
	import { onMount } from 'svelte';
	import Pictograph from './Pictograph/Pictograph.svelte';
	import { sequenceContainer } from '$lib/state/machines/sequenceMachine'; // Updated import
	import { tick } from 'svelte';

	// Animation state tracking
	const hasAnimated = new Map<string, boolean>();

	// Get beats from the sequence container
	const beats = $derived(sequenceContainer.state.beats);

	onMount(() => {
		// Reset animation state on component mount only
		hasAnimated.clear();
	});
</script>

{#key null}
	<!-- Never re-render on tab switch -->
	<div class="beat-frame">
		{#each beats as beat (beat.id)} // Use the derived rune
			<Pictograph
				{beat}
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
