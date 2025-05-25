<!-- src/lib/components/SequenceWorkbench/RightPanel/RightPanel.svelte -->
<script lang="ts">
	import { workbenchStore } from '$lib/state/stores/workbenchStore';
	import ModernGenerationControls from './ModernGenerationControls.svelte';
	import StartPosPicker from '$lib/components/ConstructTab/StartPosPicker/StartPosPicker.svelte';
	import GraphEditor from '$lib/components/SequenceWorkbench/GraphEditor/GraphEditor.svelte';
	import { sequenceState } from '$lib/state/sequence/sequenceState.svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
	import OptionPicker from '$lib/components/ConstructTab/OptionPicker';

	// Local state
	let hasSelectedBeats = $state(false);
	let isTransitioning = $state(false);
	let currentComponent = $state<'startPos' | 'optionPicker' | null>(null);

	// Subscribe to the sequence container to check for selected beats
	$effect(() => {
		const unsubscribe = sequenceContainer.subscribe((state) => {
			hasSelectedBeats = state.selectedBeatIds.length > 0;
		});

		return unsubscribe;
	});

	// Handle component transitions based on sequence state
	$effect(() => {
		const shouldShowStartPos = sequenceState.isEmpty;
		const targetComponent = shouldShowStartPos ? 'startPos' : 'optionPicker';

		// Only transition if the target component is different from current
		if (currentComponent !== targetComponent) {
			if (currentComponent === null) {
				// Initial load - no transition needed
				currentComponent = targetComponent;
			} else {
				// Start transition
				isTransitioning = true;

				// After fade out completes, switch component and fade in
				setTimeout(() => {
					currentComponent = targetComponent;
					setTimeout(() => {
						isTransitioning = false;
					}, 50); // Small delay to ensure component is mounted
				}, transitionDuration * 0.6); // Fade out duration
			}
		}
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
		<!-- Sequential transition between StartPosPicker and OptionPicker -->
		{#if currentComponent && !isTransitioning}
			{#if currentComponent === 'startPos'}
				<div class="full-height-wrapper" in:fade={fadeParams} out:fade={fadeParams}>
					<StartPosPicker />
				</div>
			{:else if currentComponent === 'optionPicker'}
				<div class="full-height-wrapper" in:fade={fadeParams} out:fade={fadeParams}>
					<OptionPicker />
				</div>
			{/if}
		{:else if isTransitioning}
			<!-- Show loading indicator during transition -->
			<div
				class="full-height-wrapper transition-loading"
				in:fade={{ duration: 100 }}
				out:fade={{ duration: 100 }}
			>
				<div class="loading-content">
					<div class="loading-spinner"></div>
					<p>Loading...</p>
				</div>
			</div>
		{/if}
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

	/* Transition loading styles */
	.transition-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(15, 23, 42, 0.8);
	}

	.loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		color: #e2e8f0;
	}

	.loading-spinner {
		width: 32px;
		height: 32px;
		border: 3px solid rgba(255, 204, 0, 0.3);
		border-top: 3px solid #ffcc00;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
