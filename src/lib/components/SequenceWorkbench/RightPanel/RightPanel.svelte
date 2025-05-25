<!-- src/lib/components/SequenceWorkbench/RightPanel/RightPanel.svelte -->
<script lang="ts">
	import { isGenerateTabActive } from '$lib/state/stores/workbenchStore.svelte';
	import ModernGenerationControls from './ModernGenerationControls.svelte';
	// StartPosPicker is now integrated into OptionPicker
	import GraphEditor from '$lib/components/SequenceWorkbench/GraphEditor/GraphEditor.svelte';
	// sequenceState no longer needed - OptionPicker handles sequence state internally
	import { fade, fly } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
	import OptionPicker from '$lib/components/ConstructTab/OptionPicker';

	// Local state
	let hasSelectedBeats = $state(false);

	// Subscribe to the sequence container to check for selected beats
	$effect(() => {
		const unsubscribe = sequenceContainer.subscribe((state) => {
			hasSelectedBeats = state.selectedBeatIds.length > 0;
		});

		return unsubscribe;
	});

	// Transition parameters - faster for snappier feel
	const transitionDuration = 200; // Reduced from 400ms to 200ms for snappier transitions
	const fadeParams = { duration: transitionDuration, easing: cubicInOut };
	const flyParams = {
		duration: transitionDuration,
		easing: cubicInOut,
		y: 20
	};
</script>

<div class="right-panel">
	{#if isGenerateTabActive}
		<div in:fly={flyParams} out:fade={fadeParams}>
			<ModernGenerationControls />
		</div>
	{:else if hasSelectedBeats}
		<div
			class="full-height-wrapper graph-editor-wrapper"
			in:fade={fadeParams}
			out:fade={fadeParams}
		>
			<GraphEditor />
		</div>
	{:else}
		<!-- Unified OptionPicker (handles both start position and beat options internally) -->
		<div class="full-height-wrapper" in:fade={fadeParams} out:fade={fadeParams}>
			<OptionPicker />
		</div>
	{/if}
</div>

<style>
	.right-panel {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		overflow: hidden;
	}

	/* Button panel container removed - now handled by SharedWorkbench */

	.full-height-wrapper {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	/* Specific styles for the graph editor wrapper */
	.graph-editor-wrapper {
		/* Ensure the graph editor wrapper doesn't affect other components */
		box-sizing: border-box;
		/* Ensure the graph editor wrapper is contained within its parent */
		max-width: 100%;
		max-height: 100%;
		/* Ensure the graph editor wrapper doesn't interfere with BeatFrame sizing */
		isolation: isolate;
	}

	/* Transition loading styles removed - no longer needed with unified component */
</style>
