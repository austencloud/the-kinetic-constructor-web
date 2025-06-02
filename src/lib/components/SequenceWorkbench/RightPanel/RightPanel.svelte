<!-- src/lib/components/SequenceWorkbench/RightPanel/RightPanel.svelte -->
<script lang="ts">
	import { workbenchStore } from '$lib/state/stores/workbenchStore';
	import ModernGenerationControls from './ModernGenerationControls.svelte';
	import GraphEditor from '$lib/components/SequenceWorkbench/GraphEditor/GraphEditor.svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import OptionPicker from '$lib/components/ConstructTab/OptionPicker';
	import { sequenceContainer } from '$lib/state';
	import { useContainer } from '$lib/state/core/svelte5-integration.svelte';

	const sequence = useContainer(sequenceContainer);
	const hasSelectedBeats = $derived(sequence.selectedBeatIds.length > 0);

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
		<!-- Modern OptionPicker handles both start positions and options internally -->
		<div class="full-height-wrapper" in:fade={fadeParams} out:fade={fadeParams}>
			<OptionPicker
				autoLoadPositions={true}
				enableFiltering={true}
				enableSorting={true}
				enableValidation={true}
				showPreview={false}
			/>
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

	.full-height-wrapper {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.graph-editor-wrapper {
		box-sizing: border-box;
		max-width: 100%;
		max-height: 100%;
		isolation: isolate;
	}
</style>
