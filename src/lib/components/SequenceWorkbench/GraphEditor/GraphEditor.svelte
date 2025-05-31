<!-- src/lib/components/SequenceWorkbench/GraphEditor/GraphEditor.svelte -->
<script lang="ts">
	import type { PictographData } from '$lib/types/PictographData';
	import { DIAMOND } from '$lib/types/Constants';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
	import { editModeStore } from '$lib/state/stores/editModeStore';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';
	import { panelStore } from '$lib/components/SequenceWorkbench/ButtonPanel/stores/panelStore';
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	// Import refactored components
	import EditorHeader from './EditorHeader.svelte';
	import PictographSection from './PictographSection.svelte';
	import TurnsBoxesRow from './TurnsBoxesRow.svelte';
	import TurnsContainer from './TurnsContainer.svelte';
	import ConstructButton from './ConstructButton.svelte';

	// Import utility functions
	import { createGraphEditorState } from './utils/GraphEditorState';
	import { createBeatDataHandler } from './utils/BeatDataHandler';
	import { createEventHandlers } from './utils/EventHandlers';

	// Define props using Svelte 5 runes syntax
	const props = $props<{
		onTurnsChanged?: (data: { color: 'blue' | 'red'; turns: any }) => void;
		onDirectionChanged?: (data: { color: 'blue' | 'red'; direction: any }) => void;
	}>();

	// Container element reference
	let containerElement = $state<HTMLElement | null>(null);

	// Create pictograph data - initialize with default values
	let pictographData = $state<PictographData>({
		letter: null,
		startPos: null,
		endPos: null,
		timing: null,
		direction: null,
		gridMode: DIAMOND,
		blueMotionData: null,
		redMotionData: null,
		gridData: null,
		redPropData: null,
		bluePropData: null,
		redArrowData: null,
		blueArrowData: null,
		grid: ''
	});

	// Get panel layout from store
	const panelLayout = $derived($panelStore.layout);

	// Create responsive state manager
	const editorState = $derived(createGraphEditorState(containerElement, panelLayout));

	// Extract state values for use in the template
	const isPortrait = $derived(editorState.isPortrait.value);
	const isSmallScreen = $derived(editorState.isSmallScreen.value);
	const isPanelHorizontal = $derived(editorState.isPanelHorizontal.value);
	const isPanelVertical = $derived(editorState.isPanelVertical.value);
	const pictographSize = $derived(editorState.pictographSize.value);

	// Create beat data handler with pictograph data wrapper
	const pictographDataWrapper = $derived({ value: pictographData });
	// @ts-ignore - Ignore type errors for the sequenceContainer
	const beatDataHandler = $derived(createBeatDataHandler(sequenceContainer, pictographDataWrapper));

	// Create event handlers and extract functions
	const { handleExitClick, handleTurnsChanged, handleDirectionChanged } = $derived(
		createEventHandlers(editModeStore, hapticFeedbackService, beatDataHandler, {
			onTurnsChanged: props.onTurnsChanged,
			onDirectionChanged: props.onDirectionChanged
		})
	);

	// Set up resize observer and initialization using $effect instead of onMount
	$effect(() => {
		// Only run this effect when containerElement is available
		if (!containerElement) return;

		// Set up resize observer
		const cleanupResizeObserver = editorState.setupResizeObserver();

		// Set up sequence subscription
		const cleanupSequenceSubscription = beatDataHandler.setupSequenceSubscription();

		// Return cleanup function
		return () => {
			if (cleanupResizeObserver) cleanupResizeObserver();
			cleanupSequenceSubscription();
		};
	});
</script>

<div class="graph-editor" bind:this={containerElement}>
	<EditorHeader onExitClick={handleExitClick} />
	<ConstructButton />

	<div
		class="editor-content"
		class:portrait={isPortrait}
		class:small-screen={isSmallScreen}
		class:panel-horizontal={isPanelHorizontal}
		class:panel-vertical={isPanelVertical}
	>
		{#if isPanelHorizontal}
			<!-- Panel is horizontal (bottom) layout: Only show TurnsBox components, hide Pictograph -->
			<TurnsContainer
				onTurnsChanged={handleTurnsChanged}
				onDirectionChanged={handleDirectionChanged}
			/>
		{:else}
			<!-- Panel is vertical (right) layout: Show Pictograph and TurnsBox components -->
			<!-- Always use vertical layout with pictograph on top and turns boxes below -->

			<!-- Pictograph section at the top -->
			<div class="pictograph-container-wrapper" in:fade={{ duration: 200, easing: cubicOut }}>
				<div
					class="pictograph-container"
					style="width: {pictographSize}px; height: {pictographSize}px;"
				>
					<PictographSection {pictographData} isStartPosition={false} />
				</div>
			</div>

			<!-- Turns boxes row below pictograph -->
			<TurnsBoxesRow
				onTurnsChanged={handleTurnsChanged}
				onDirectionChanged={handleDirectionChanged}
			/>
		{/if}
	</div>
</div>

<style>
	@import './styles/GraphEditor.css';
</style>
