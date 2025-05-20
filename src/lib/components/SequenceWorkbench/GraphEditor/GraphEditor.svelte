<!-- src/lib/components/SequenceWorkbench/GraphEditor/GraphEditor.svelte -->
<script lang="ts">
	import TurnsBox from './TurnsBox/TurnsBox.svelte';
	import Pictograph from '$lib/components/Pictograph/Pictograph.svelte';
	import type { PictographData } from '$lib/types/PictographData';
	import { DIAMOND } from '$lib/types/Constants';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
	import { onMount, createEventDispatcher } from 'svelte';
	import { editModeStore } from '$lib/state/stores/editModeStore';
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import hapticFeedbackService from '$lib/services/HapticFeedbackService';
	import { panelStore } from '$lib/components/SequenceWorkbench/ButtonPanel/stores/panelStore';

	// Create event dispatcher
	const dispatch = createEventDispatcher<{
		turnsChanged: { color: 'blue' | 'red'; turns: any };
		directionChanged: { color: 'blue' | 'red'; direction: any };
	}>();

	// Local state
	let containerHeight = $state(0);
	let containerWidth = $state(0);
	let containerElement = $state<HTMLElement | null>(null);
	let isPortrait = $state(false);
	let isSmallScreen = $state(false);

	// Get panel layout from store
	const panelLayout = $derived($panelStore.layout);
	const isPanelHorizontal = $derived(panelLayout === 'horizontal');
	const isPanelVertical = $derived(panelLayout === 'vertical');

	// Panel position determines layout
	// When panel is horizontal (bottom), hide pictograph and stack TurnsBox components vertically
	// When panel is vertical (right), show pictograph and arrange TurnsBox components horizontally

	// Derived values with improved responsive calculations
	// Minimum size ensures the pictograph is always visible and usable
	const minPictographSize = 220; // Slightly increased minimum size for better visibility

	// Dynamic border size based on container dimensions (clamped between 2-6px)
	const borderSize = $derived(
		Math.max(2, Math.min(6, Math.floor(Math.min(containerHeight, containerWidth) * 0.02)))
	);

	// Calculate optimal content size based on container dimensions with better space utilization
	// In landscape: use up to 60% of the smaller dimension for better proportions
	// In portrait: use up to 70% of the width for better space utilization
	const contentSize = $derived(() => {
		const smallerDimension = Math.min(containerHeight, containerWidth);
		const sizeFactor = isPortrait ? 0.7 : 0.6;
		const optimalSize = isPortrait
			? Math.max(minPictographSize, containerWidth * sizeFactor)
			: Math.max(minPictographSize, smallerDimension * sizeFactor);

		// Ensure the size doesn't exceed 90% of the container height in portrait mode
		return isPortrait ? Math.min(optimalSize, containerHeight * 0.9) : optimalSize;
	});

	// Final pictograph size with border adjustment
	const pictographSize = $derived(() => {
		// Ensure we're working with numbers for the calculation
		return typeof contentSize === 'number' ? contentSize - 2 * borderSize : 0;
	});

	// Update orientation and screen size based on container dimensions
	$effect(() => {
		isPortrait = containerWidth < containerHeight;
		isSmallScreen = containerWidth < 600; // Threshold for small screen adjustments

		// Note: Panel layout (horizontal/vertical) is determined by the panelStore
		// and is independent of the container dimensions
	});

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

	// Update container dimensions when the element is resized
	function updateContainerDimensions() {
		if (containerElement) {
			containerHeight = containerElement.clientHeight;
			containerWidth = containerElement.clientWidth;
		}
	}

	// Load selected beat data
	function loadSelectedBeatData() {
		const selectedBeatIds = sequenceContainer.state.selectedBeatIds;
		if (selectedBeatIds.length > 0) {
			const beatId = selectedBeatIds[0];
			const beat = sequenceContainer.state.beats.find((b) => b.id === beatId);

			if (beat) {
				// Convert beat data to pictograph data
				const newData = {
					letter: beat.metadata?.letter || null,
					startPos: beat.metadata?.startPos || null,
					endPos: beat.metadata?.endPos || null,
					timing: null,
					direction: null,
					gridMode: DIAMOND,
					blueMotionData: beat.blueMotionData,
					redMotionData: beat.redMotionData,
					gridData: null,
					redPropData: beat.redPropData,
					bluePropData: beat.bluePropData,
					redArrowData: null,
					blueArrowData: null,
					grid: ''
				} as PictographData; // Type assertion to handle potential null values

				// Update the pictograph data
				pictographData = newData;
			}
		}
	}

	// Set up resize observer
	onMount(() => {
		// Initial update of container dimensions
		updateContainerDimensions();

		// Set up resize observer
		const resizeObserver = new ResizeObserver(() => {
			updateContainerDimensions();
		});

		if (containerElement) {
			resizeObserver.observe(containerElement);
		}

		// Load selected beat data
		loadSelectedBeatData();

		// Subscribe to selection changes
		const unsubscribe = sequenceContainer.subscribe(() => {
			loadSelectedBeatData();
		});

		return () => {
			resizeObserver.disconnect();
			unsubscribe();
		};
	});

	// Handle exit button click
	function handleExitClick() {
		editModeStore.setEditMode(false);
	}

	// Handle turns changed event
	function handleTurnsChanged(event: CustomEvent) {
		const { color, turns } = event.detail;

		// Trigger haptic feedback
		hapticFeedbackService.trigger('selection');

		// Dispatch event to notify parent components
		dispatch('turnsChanged', { color, turns });

		// Dispatch custom event for AnimatedBeat components to show the highlight effect
		const highlightEvent = new CustomEvent('beat-highlight', {
			bubbles: true,
			detail: { active: true, color }
		});
		document.dispatchEvent(highlightEvent);

		// Update the selected beat in the sequence
		const selectedBeatIds = sequenceContainer.state.selectedBeatIds;
		if (selectedBeatIds.length > 0) {
			const beatId = selectedBeatIds[0];
			const beat = sequenceContainer.state.beats.find((b) => b.id === beatId);

			if (beat) {
				// Update the motion data based on the color
				if (color === 'blue') {
					// Update blue motion data
					if (beat.blueMotionData) {
						sequenceContainer.updateBeat(beatId, {
							blueMotionData: {
								...beat.blueMotionData,
								turns
							}
						});
					}
				} else {
					// Update red motion data
					if (beat.redMotionData) {
						sequenceContainer.updateBeat(beatId, {
							redMotionData: {
								...beat.redMotionData,
								turns
							}
						});
					}
				}
			}
		}
	}

	// Handle direction changed event
	function handleDirectionChanged(event: CustomEvent) {
		const { color, direction } = event.detail;

		// Trigger haptic feedback
		hapticFeedbackService.trigger('selection');

		// Dispatch event to notify parent components
		dispatch('directionChanged', { color, direction });

		// Dispatch custom event for AnimatedBeat components to show the highlight effect
		const highlightEvent = new CustomEvent('beat-highlight', {
			bubbles: true,
			detail: { active: true, color }
		});
		document.dispatchEvent(highlightEvent);

		// Update the selected beat in the sequence
		const selectedBeatIds = sequenceContainer.state.selectedBeatIds;
		if (selectedBeatIds.length > 0) {
			const beatId = selectedBeatIds[0];
			const beat = sequenceContainer.state.beats.find((b) => b.id === beatId);

			if (beat) {
				// Update the motion data based on the color
				if (color === 'blue') {
					// Update blue motion data
					if (beat.blueMotionData) {
						sequenceContainer.updateBeat(beatId, {
							blueMotionData: {
								...beat.blueMotionData,
								direction
							}
						});
					}
				} else {
					// Update red motion data
					if (beat.redMotionData) {
						sequenceContainer.updateBeat(beatId, {
							redMotionData: {
								...beat.redMotionData,
								direction
							}
						});
					}
				}
			}
		}
	}
</script>

<div class="graph-editor" bind:this={containerElement}>
	<div class="editor-header">
		<h2>Beat Editor</h2>
		<button class="exit-button" onclick={handleExitClick} aria-label="Close editor">
			<i class="fa-solid fa-times"></i>
		</button>
	</div>

	<div
		class="editor-content"
		class:portrait={isPortrait}
		class:small-screen={isSmallScreen}
		class:panel-horizontal={isPanelHorizontal}
		class:panel-vertical={isPanelVertical}
	>
		{#if isPanelHorizontal}
			<!-- Panel is horizontal (bottom) layout: Only show TurnsBox components, hide Pictograph -->
			<div class="turns-container" in:fade={{ duration: 200, easing: cubicOut }}>
				<div class="turns-box-container blue-box">
					<TurnsBox
						color="blue"
						on:turnsChanged={handleTurnsChanged}
						on:directionChanged={handleDirectionChanged}
					/>
				</div>

				<div class="turns-box-container red-box">
					<TurnsBox
						color="red"
						on:turnsChanged={handleTurnsChanged}
						on:directionChanged={handleDirectionChanged}
					/>
				</div>
			</div>
		{:else}
			<!-- Panel is vertical (right) layout: Show Pictograph and TurnsBox components -->
			{#if isPortrait}
				<!-- Portrait layout with panel on right: Pictograph on top, turns boxes side by side below -->
				<div class="pictograph-section" in:fade={{ duration: 200, easing: cubicOut }}>
					<div
						class="pictograph-container"
						style="width: {pictographSize}px; height: {pictographSize}px;"
					>
						<Pictograph {pictographData} />
					</div>
				</div>

				<div class="turns-boxes-row" in:fade={{ duration: 200, delay: 100, easing: cubicOut }}>
					<div class="turns-box-container blue-box">
						<TurnsBox
							color="blue"
							on:turnsChanged={handleTurnsChanged}
							on:directionChanged={handleDirectionChanged}
						/>
					</div>

					<div class="turns-box-container red-box">
						<TurnsBox
							color="red"
							on:turnsChanged={handleTurnsChanged}
							on:directionChanged={handleDirectionChanged}
						/>
					</div>
				</div>
			{:else}
				<!-- Landscape layout with panel on right: Turns boxes on either side of pictograph -->
				<div class="turns-box-container blue-box" in:fade={{ duration: 200, easing: cubicOut }}>
					<TurnsBox
						color="blue"
						on:turnsChanged={handleTurnsChanged}
						on:directionChanged={handleDirectionChanged}
					/>
				</div>

				<div
					class="pictograph-container"
					style="width: {pictographSize}px; height: {pictographSize}px;"
					in:fade={{ duration: 200, delay: 100, easing: cubicOut }}
				>
					<Pictograph {pictographData} />
				</div>

				<div class="turns-box-container red-box" in:fade={{ duration: 200, easing: cubicOut }}>
					<TurnsBox
						color="red"
						on:turnsChanged={handleTurnsChanged}
						on:directionChanged={handleDirectionChanged}
					/>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.graph-editor {
		position: relative;
		background-color: var(--tkc-background-color, #1a1a1d);
		color: var(--tkc-text-color, #f8f9fa);
		overflow: hidden;
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: column;
		border-radius: 0.75rem;
		box-sizing: border-box;
		max-width: 100%;
		max-height: 100%;
		isolation: isolate;
		/* Add subtle shadow for depth */
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
	}

	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.15);
		/* Add subtle gradient for visual interest */
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0.05), transparent);
	}

	.editor-header h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		/* Add subtle text shadow for better readability */
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
	}

	.exit-button {
		background: transparent;
		border: none;
		color: var(--tkc-text-color, #f8f9fa);
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.exit-button:hover {
		background-color: rgba(255, 255, 255, 0.1);
		transform: scale(1.1);
	}

	.exit-button:active {
		transform: scale(0.95);
	}

	.editor-content {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center; /* Center content horizontally */
		padding: 1.5rem;
		flex: 1;
		overflow: auto;
		box-sizing: border-box;
		max-width: 100%;
		max-height: 100%;
		/* Add gap between elements */
		gap: 1.5rem;
		/* Improve scrollbar styling for better user experience */
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.3) rgba(0, 0, 0, 0.1);
	}

	.editor-content.portrait {
		flex-direction: column;
		justify-content: flex-start; /* Align to top in portrait mode */
		overflow-y: auto; /* Enable vertical scrolling if needed */
	}

	/* Panel horizontal layout (panel at bottom) */
	.editor-content.panel-horizontal {
		flex-direction: column;
		justify-content: center;
		padding: 1rem;
		/* Ensure the panel-horizontal view takes up all available space */
		height: 100%;
	}

	/* Panel vertical layout (panel on right) */
	.editor-content.panel-vertical {
		/* When panel is on the right, ensure content is centered */
		justify-content: center;
		align-items: center;
		/* For panel-vertical, we want a row layout by default (landscape) */
		flex-direction: row;
	}

	/* For panel-vertical in portrait mode, we want a column layout */
	.editor-content.panel-vertical.portrait {
		flex-direction: column;
	}

	/* Container for vertical arrangement of TurnsBox components (panel horizontal/bottom) */
	.turns-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		gap: 1.5rem;
		align-items: center;
		/* Ensure the container takes up all available space */
		height: 100%;
		justify-content: center;
	}

	/* Custom scrollbar styling for WebKit browsers */
	.editor-content::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	.editor-content::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.1);
		border-radius: 4px;
	}

	.editor-content::-webkit-scrollbar-thumb {
		background-color: rgba(255, 255, 255, 0.3);
		border-radius: 4px;
		border: 2px solid transparent;
		background-clip: padding-box;
	}

	.editor-content::-webkit-scrollbar-thumb:hover {
		background-color: rgba(255, 255, 255, 0.5);
	}

	/* Container for pictograph in portrait mode with panel vertical/right */
	.pictograph-section {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		margin-bottom: 1.5rem;
	}

	/* Container for horizontal arrangement of TurnsBox components (panel vertical/right in portrait) */
	.turns-boxes-row {
		display: flex;
		flex-direction: row;
		justify-content: center; /* Center boxes horizontally */
		width: 100%;
		gap: 1.5rem; /* Increased gap for better spacing */
	}

	.turns-box-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: center;
		height: 100%;
		min-width: 0;
		max-width: 350px; /* Prevent boxes from getting too wide */
		/* Ensure the turns box container doesn't affect other components */
		box-sizing: border-box;
		/* Add subtle transition for smoother resizing */
		transition: all 0.3s ease;
	}

	/* Add specific styling for blue and red boxes */
	.blue-box {
		/* Add subtle blue glow */
		box-shadow: 0 0 15px rgba(46, 49, 146, 0.2);
	}

	.red-box {
		/* Add subtle red glow */
		box-shadow: 0 0 15px rgba(237, 28, 36, 0.2);
	}

	.editor-content.portrait .turns-box-container {
		padding: 0;
		max-width: 100%; /* Allow full width in portrait */
		height: auto; /* Allow height to adjust to content */
	}

	.pictograph-container {
		cursor: default;
		border: 3px solid gold;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		box-sizing: border-box;
		flex-shrink: 0;
		flex-grow: 0;
		/* Add subtle shadow for depth */
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.2),
			0 0 20px rgba(255, 215, 0, 0.15); /* Gold glow */
		/* Add transition for smoother resizing */
		transition: all 0.3s ease;
		/* Center the pictograph in the available space */
		margin: 0 auto;
		/* Ensure overflow content is visible with scrollbars if needed */
		overflow: auto;
		/* Improve scrollbar styling for better user experience */
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 215, 0, 0.5) rgba(0, 0, 0, 0.1);
	}

	/* Custom scrollbar styling for WebKit browsers */
	.pictograph-container::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	.pictograph-container::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.1);
		border-radius: 4px;
	}

	.pictograph-container::-webkit-scrollbar-thumb {
		background-color: rgba(255, 215, 0, 0.5);
		border-radius: 4px;
		border: 2px solid transparent;
		background-clip: padding-box;
	}

	.pictograph-container::-webkit-scrollbar-thumb:hover {
		background-color: rgba(255, 215, 0, 0.7);
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.editor-header h2 {
			font-size: 1.25rem;
		}

		.editor-content {
			padding: 1rem;
			gap: 1rem;
		}

		.pictograph-container {
			margin: 0.5rem auto;
			border-width: 2px;
		}

		.turns-boxes-row {
			gap: 1rem;
		}
	}

	@media (max-width: 480px) {
		.editor-header {
			padding: 0.75rem 1rem;
		}

		.editor-header h2 {
			font-size: 1.1rem;
		}

		.editor-content {
			padding: 0.75rem;
			gap: 0.75rem;
		}

		.editor-content.small-screen.portrait .turns-boxes-row {
			flex-direction: column;
			gap: 1rem;
		}

		.editor-content.small-screen.portrait .turns-box-container {
			margin-bottom: 0.5rem;
		}
	}

	/* Panel horizontal specific styles (applied when panel is at the bottom) */
	.editor-content.panel-horizontal {
		padding: 0.75rem 0.5rem;
	}

	/* Adjust spacing in turns container for panel-horizontal */
	.editor-content.panel-horizontal .turns-container {
		gap: 1rem;
	}

	/* Make turns boxes full width in panel-horizontal */
	.editor-content.panel-horizontal .turns-box-container {
		width: 100%;
		max-width: none;
	}
</style>
