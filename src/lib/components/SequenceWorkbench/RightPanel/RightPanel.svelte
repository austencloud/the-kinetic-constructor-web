<!-- src/lib/components/SequenceWorkbench/RightPanel/RightPanel.svelte -->
<script lang="ts">
	import { workbenchStore } from '$lib/state/stores/workbenchStore';
	import ModernGenerationControls from './ModernGenerationControls.svelte';
	import ModernOptionPicker from '$lib/components/ConstructTab/OptionPicker/modern/ModernOptionPicker.svelte';
	import StartPositionPicker from '$lib/components/ConstructTab/OptionPicker/components/StartPositionPicker.svelte';
	import GraphEditor from '$lib/components/SequenceWorkbench/GraphEditor/GraphEditor.svelte';
	import TransitionWrapper from './TransitionWrapper.svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
	import { getContext } from 'svelte';
	import type { ISequenceService } from '$lib/services/core/ISequenceService';

	// Get SequenceService from context (modern approach with getter pattern)
	const sequenceServiceGetter = getContext<() => ISequenceService | null>('sequenceService');
	const sequenceService = $derived(sequenceServiceGetter?.() || null);

	// Local state
	let hasSelectedBeats = $state(false);

	// Modern reactive approach: Get sequence state from SequenceService
	const isSequenceEmpty = $derived(
		sequenceService
			? sequenceService.state.beats.length === 0 && sequenceService.state.startPosition === null
			: true
	);

	// Subscribe to the sequence container to check for selected beats
	$effect(() => {
		const unsubscribe = sequenceContainer.subscribe((state) => {
			hasSelectedBeats = state.selectedBeatIds.length > 0;
		});

		return unsubscribe;
	});

	// Transition parameters
	const transitionDuration = 400;
	const fadeParams = { duration: transitionDuration, easing: cubicInOut };
	const flyParams = {
		duration: transitionDuration,
		easing: cubicInOut,
		y: 20
	};
</script>

<div class="right-panel">
	{#if $workbenchStore.activeTab === 'generate'}
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
		<TransitionWrapper {isSequenceEmpty} {transitionDuration}>
			<div slot="startPosPicker" class="full-height-wrapper">
				<StartPositionPicker />
			</div>
			<div slot="optionPicker" class="full-height-wrapper">
				<ModernOptionPicker
					autoLoadPositions={true}
					enableFiltering={true}
					enableSorting={true}
					enableValidation={true}
					showPreview={false}
				/>
			</div>
		</TransitionWrapper>
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
</style>
