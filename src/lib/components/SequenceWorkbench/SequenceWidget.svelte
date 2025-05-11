<script lang="ts">
	import { useResponsiveLayout } from '$lib/composables/useResponsiveLayout';
	import { sequenceActions, sequenceSelectors } from '$lib/state/machines/sequenceMachine';
	import { sequenceStore } from '$lib/state/stores/sequenceStore';
	import { derived, writable } from 'svelte/store';
	import {
		isSequenceFullScreen,
		openSequenceFullScreen,
		closeSequenceFullScreen
	} from '$lib/stores/sequence/fullScreenStore';
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	// Define the event types for better type safety
	interface SequenceWidgetEvents {
		toggleToolsPanel: void;
	}

	// Import Type for Button Definitions
	import type { ButtonDefinition, ActionEventDetail } from './ButtonPanel/types';

	// Components
	import CurrentWordLabel from './Labels/CurrentWordLabel.svelte';
	import DifficultyLabel from './Labels/DifficultyLabel.svelte';
	import BeatFrame from './BeatFrame/BeatFrame.svelte';
	import FullScreenOverlay from './components/FullScreenOverlay.svelte';
	import ToolsButton from './ToolsButton.svelte';
	import ToolsPanel from './ToolsPanel/ToolsPanel.svelte';
	import ClearSequenceButton from './ClearSequenceButton.svelte';

	// Import stores for sequence state
	import { selectedStartPos } from '$lib/stores/sequence/selectionStore';
	import { fly } from 'svelte/transition';

	// We no longer need the isSequenceEmpty store as it's not used in this component

	// Props
	export let workbenchHeight: number;
	export let toolsPanelOpen = false;

	// Use responsive layout hook for dimensions
	const { dimensions } = useResponsiveLayout();

	// Track tools panel state - use the prop value
	const isToolsPanelOpen = writable(toolsPanelOpen);

	// Update the store when the prop changes
	$: isToolsPanelOpen.set(toolsPanelOpen);

	// Track the active mode
	const activeMode = writable<'construct' | 'generate' | null>('construct');

	// Calculate workbench orientation based on workbench dimensions instead of window
	$: workbenchIsPortrait = $dimensions.width < workbenchHeight;

	// Calculate button size factor based on container dimensions
	$: buttonSizeFactor = calculateButtonSizeFactor($dimensions.width, $dimensions.height);

	// Function to calculate button size factor based on container dimensions
	function calculateButtonSizeFactor(width: number, height: number): number {
		const smallerDimension = Math.min(width, height);

		// Use a more fluid approach with constraints
		// Map the dimension to a factor between 0.9 (minimum) and 1.4 (maximum)
		// with a smooth transition for better touch targets on small screens

		// Constants for the calculation
		const minDimension = 320; // Very small mobile screens
		const maxDimension = 1200; // Large desktop screens
		const minFactor = 0.9; // Increased minimum size factor for better touch targets
		const maxFactor = 1.4; // Increased maximum size factor
		const defaultFactor = 1.1; // Increased default size factor

		// If dimensions are invalid, return default
		if (!width || !height || width <= 0 || height <= 0) {
			return defaultFactor;
		}

		// Clamp the dimension between min and max
		const clampedDimension = Math.max(minDimension, Math.min(smallerDimension, maxDimension));

		// Calculate the factor using linear interpolation
		const range = maxDimension - minDimension;
		const normalizedPosition = (clampedDimension - minDimension) / range;
		const factor = minFactor + normalizedPosition * (maxFactor - minFactor);

		// Round to 2 decimal places for better performance
		return Math.round(factor * 100) / 100;
	}

	// Subscribe to stores
	$: toolsPanelOpen = $isToolsPanelOpen;

	// Subscribe to the sequence store for metadata
	const sequenceName = derived(sequenceStore, ($store) => $store.metadata.name);
	const difficultyLevel = derived(sequenceStore, ($store) => $store.metadata.difficulty);

	// --- Define Button Panel Data ---
	const buttonPanelButtons: ButtonDefinition[] = [
		// Mode switching tools
		{
			icon: 'fa-hammer',
			title: 'Construct',
			id: 'constructMode',
			color: '#4361ee'
		},
		{
			icon: 'fa-robot',
			title: 'Generate',
			id: 'generateMode',
			color: '#3a86ff'
		},
		// Sharing and viewing tools
		{ icon: 'fa-share-nodes', title: 'Share', id: 'saveImage', color: '#3a86ff' },
		{ icon: 'fa-expand', title: 'Full Screen', id: 'viewFullScreen', color: '#4cc9f0' },
		// Sequence manipulation tools
		{
			icon: 'fa-arrows-left-right',
			title: 'Mirror',
			id: 'mirrorSequence',
			color: '#4895ef'
		},
		{ icon: 'fa-paintbrush', title: 'Swap Colors', id: 'swapColors', color: '#ff6b6b' },
		{ icon: 'fa-rotate', title: 'Rotate', id: 'rotateSequence', color: '#f72585' },
		// Dictionary tool
		{
			icon: 'fa-book-medical',
			title: 'Add to Dictionary',
			id: 'addToDictionary',
			color: '#4361ee'
		},
		// Destructive actions
		{ icon: 'fa-trash', title: 'Delete Beat', id: 'deleteBeat', color: '#ff9e00' }
	];

	// No status tracking needed anymore

	function handleButtonAction(event: CustomEvent<ActionEventDetail>) {
		const { id } = event.detail;
		switch (id) {
			case 'constructMode':
				// Switch to construct mode
				activeMode.set('construct');
				// Dispatch an event to notify parent components
				const constructEvent = new CustomEvent('switch-mode', {
					detail: { mode: 'construct' },
					bubbles: true
				});
				document.dispatchEvent(constructEvent);
				break;
			case 'generateMode':
				// Switch to generate mode
				activeMode.set('generate');
				// Dispatch an event to notify parent components
				const generateEvent = new CustomEvent('switch-mode', {
					detail: { mode: 'generate' },
					bubbles: true
				});
				document.dispatchEvent(generateEvent);
				break;
			case 'addToDictionary':
				// Handle add to dictionary action
				break;
			case 'saveImage':
				// Handle save image action
				break;
			case 'viewFullScreen':
				openSequenceFullScreen();
				break;
			case 'mirrorSequence':
				// Handle mirror sequence action
				break;
			case 'swapColors':
				// Handle swap colors action
				break;
			case 'rotateSequence':
				// Handle rotate sequence action
				break;
			case 'deleteBeat':
				const selectedBeatIds = sequenceSelectors.selectedBeatIds();
				if (selectedBeatIds.length > 0) {
					sequenceActions.removeBeatAndFollowing(selectedBeatIds[0]);
				}
				break;
			case 'clearSequence':
				sequenceActions.clearSequence();
				selectedStartPos.set(null);
				// isSequenceEmpty is now derived and will update automatically
				break;
		}
		if ($isToolsPanelOpen) {
			isToolsPanelOpen.set(false);
		}
	}

	function handleClearSequence() {
		const event = new CustomEvent<ActionEventDetail>('action', {
			detail: { id: 'clearSequence' }
		});
		handleButtonAction(event);
	}

	// Initialize the event dispatcher
	const dispatch = createEventDispatcher();

	function toggleToolsPanel() {
		// Always dispatch the event to the parent component
		dispatch('toggleToolsPanel');

		// If parent's panel is not open, also toggle our local panel
		if (!toolsPanelOpen) {
			isToolsPanelOpen.update((value) => !value);
		}
	}

	let buttonActionListener: (event: CustomEvent) => void;
	onMount(() => {
		buttonActionListener = (event: CustomEvent) => {
			if (event.detail && event.detail.id) {
				handleButtonAction(event);
			}
		};
		document.addEventListener('action', buttonActionListener as EventListener);
	});
	onDestroy(() => {
		if (buttonActionListener) {
			document.removeEventListener('action', buttonActionListener as EventListener);
		}
	});
</script>

{#key null}
	<!-- Never trigger pictograph re-render -->
	<div class="sequence-widget">
		<div
			class="main-layout"
			class:portrait={workbenchIsPortrait}
			style="--container-width: {$dimensions.width}px;
		       --container-height: {$dimensions.height}px;
		       --button-size-factor: {buttonSizeFactor};"
		>
			<div class="left-vbox">
				<div class="sequence-container">
					<div class="sequence-widget-labels">
						<CurrentWordLabel currentWord={$sequenceName} width={$dimensions.width} />
					</div>

					<div class="beat-frame-wrapper">
						<BeatFrame />
					</div>

					<!-- Difficulty label moved below the beats -->
					<div class="difficulty-label-container">
						<DifficultyLabel difficultyLevel={$difficultyLevel} width={$dimensions.width} />
					</div>
				</div>
			</div>

			{#if $isToolsPanelOpen && !toolsPanelOpen}
				<!-- Only show this tools panel if the parent's panel is not open -->
				<div class="tools-panel-container" transition:fly={{ duration: 300, y: 10 }}>
					<ToolsPanel
						buttons={buttonPanelButtons}
						activeMode={$activeMode}
						on:action={handleButtonAction}
						on:close={() => isToolsPanelOpen.set(false)}
					/>
				</div>
			{/if}

			<ClearSequenceButton on:clearSequence={handleClearSequence} />

			{#if !toolsPanelOpen}
				<!-- Only show the tools button if the parent's panel is not open -->
				<ToolsButton isToolsPanelOpen={$isToolsPanelOpen} on:toggleToolsPanel={toggleToolsPanel} />
			{/if}
		</div>

		<FullScreenOverlay
			isOpen={$isSequenceFullScreen}
			title={$sequenceName}
			on:close={closeSequenceFullScreen}
		>
			<div class="fullscreen-beat-container">
				<!-- BeatFrame will be wrapped in a container in the FullScreenOverlay component -->
				<BeatFrame />
			</div>
		</FullScreenOverlay>
	</div>
{/key}

<style>
	.sequence-widget {
		display: flex;
		flex-direction: column;
		height: 100%;
		flex: 1;
	}

	.main-layout {
		display: flex;
		flex-direction: row;
		height: 100%;
		width: 100%;
		overflow: hidden;
		justify-content: space-between;
		position: relative;
	}

	.main-layout.portrait {
		flex-direction: column;
		justify-content: flex-start;
	}

	.left-vbox {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		min-height: 0; /* Important for flex children in a flex container */
		flex: 1;
		overflow: hidden; /* Let children handle their own scrolling if necessary */
	}

	.sequence-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		align-items: center; /* Center children horizontally */
		justify-content: center; /* Center children vertically by default */
		padding: 10px 0; /* Add some vertical padding */
		box-sizing: border-box;
	}

	.sequence-widget-labels {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: white;
		width: 100%;
		flex-shrink: 0; /* Prevent labels from shrinking */
		padding-bottom: 10px; /* Space between labels and beat frame */
	}

	/* Container for the difficulty label below the beats */
	.difficulty-label-container {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		margin-top: 10px; /* Space between beat frame and difficulty label */
		flex-shrink: 0; /* Prevent from shrinking */
	}

	/* This wrapper ensures BeatFrame can grow and scroll if needed */
	.beat-frame-wrapper {
		display: flex; /* Allow BeatFrame to be centered if it's smaller than wrapper */
		justify-content: center;
		align-items: center;
		width: 100%;
		min-height: 0; /* Crucial for allowing BeatFrame to not push layout */
		overflow: hidden; /* BeatFrame will handle its own scroll if its content overflows */
		padding: 0 10px; /* Horizontal padding for the beat frame area */
		box-sizing: border-box;
	}

	/* This is the actual container passed to BeatFrame via use:resizeObserver */
	/* Its styles are in BeatFrame.svelte but its flex behavior is controlled here */
	:global(.beat-frame-container) {
		/* The BeatFrame's direct parent (from BeatFrame.svelte)
		   should fill the .beat-frame-wrapper */
		width: 100%;
		height: 100%;
		/* overflow: auto; If you want this div to scroll instead of BeatFrame internal grid */
	}

	/* Indicator label container removed */

	.tools-panel-container {
		/* This style is for the container that holds ToolsPanel when it slides in */
		/* Ensure it is positioned correctly relative to main-layout if it's a direct child */
		position: absolute; /* Or fixed, depending on desired behavior */
		/* right: 0; top:0; bottom:0; width: 300px; etc. for a sidebar style */
		/* For now, assuming it replaces another view or is part of the flex flow */
		flex: 1; /* If it's part of the flex flow */
		display: flex;
		flex-direction: column;
		padding: 10px;
		background-color: #f8f9fa; /* Or your desired panel background */
		z-index: 50; /* Ensure it's above other content if overlapping */
	}

	/* Conditional alignment for when content might need to scroll */
	/* (Removed unused .scrolling-active selectors) */

	/* Full screen beat container styles */
	.fullscreen-beat-container {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0; /* Remove padding to maximize space */
		box-sizing: border-box;
		/* Ensure content is centered and as large as possible */
		position: relative;
		overflow: hidden; /* Prevent scrolling within the container */
		/* Add aspect ratio handling to maximize width usage */
		min-width: 100%;
	}

	/* Full screen container styling */

	/* Responsive mobile layout adjustments */
	@media (max-width: 768px) {
		.main-layout.portrait .tools-panel-container {
			padding: 6px;
		}
		.sequence-widget-labels {
			padding-bottom: 5px;
		}
		.difficulty-label-container {
			margin-top: 5px; /* Reduced space on mobile */
		}
	}

	/* Styles from previous .beat-frame-container (now .beat-frame-wrapper) */
	/*
	@media (min-height: 800px) {
		.sequence-container {
			justify-content: flex-start;
		}

		.beat-frame-wrapper {  // Changed from .beat-frame-container
			flex: 1 1 auto;
			margin: 10px 0;
            overflow-y: auto; // Added scroll for wrapper if it exceeds this height
		}
	}
    */

	/* Improved fullscreen styling for better pictograph display */
	:global(.fullscreen-beat-container .beat-frame) {
		width: auto;
		height: auto;
		max-width: 100vw; /* Use full width */
		max-height: 85vh; /* Reduced to prevent overflow */
		transform: scale(1);
		/* No gap between pictographs */
		gap: 0;
		/* Ensure pictographs are properly aligned */
		justify-content: center;
		align-items: center;
	}

	/* Handle landscape orientation specifically */
	@media (orientation: landscape) {
		:global(.fullscreen-beat-container .beat-frame) {
			max-height: 80vh; /* Further reduce height in landscape */
		}
	}

	/* Handle small height screens in landscape */
	@media (orientation: landscape) and (max-height: 600px) {
		:global(.fullscreen-beat-container .beat-frame) {
			max-height: 75vh; /* Even smaller on very small screens */
			max-width: 95vw; /* Also reduce width slightly */
		}
	}

	:global(.fullscreen-beat-container .beat-frame-container) {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		/* Remove padding to maximize space */
		padding: 0;
		box-sizing: border-box;
		/* Ensure container takes up full width */
		min-width: 100%;
	}

	/* Fixed cell size multipliers to prevent overlapping */
	:global(.fullscreen-beat-container .beat-frame) {
		/* Default multiplier for small grids */
		--cell-size-multiplier: 1;
		--adjusted-cell-size: calc(var(--cell-size) * var(--cell-size-multiplier));
	}

	/* Single row layouts */
	:global(.fullscreen-beat-container .beat-frame[style*='--total-rows: 1']) {
		--cell-size-multiplier: 1;
	}

	/* Two row layouts */
	:global(.fullscreen-beat-container .beat-frame[style*='--total-rows: 2']) {
		--cell-size-multiplier: 1;
	}

	/* Three row layouts */
	:global(.fullscreen-beat-container .beat-frame[style*='--total-rows: 3']) {
		--cell-size-multiplier: 1;
	}

	/* Four row layouts */
	:global(.fullscreen-beat-container .beat-frame[style*='--total-rows: 4']) {
		--cell-size-multiplier: 1;
	}

	/* Five or more row layouts */
	:global(.fullscreen-beat-container .beat-frame[style*='--total-rows: 5']),
	:global(.fullscreen-beat-container .beat-frame[style*='--total-rows: 6']),
	:global(.fullscreen-beat-container .beat-frame[style*='--total-rows: 7']),
	:global(.fullscreen-beat-container .beat-frame[style*='--total-rows: 8']) {
		--cell-size-multiplier: 1;
	}

	/* Responsive adjustments for different screen sizes */
	@media (max-width: 768px) {
		:global(.fullscreen-beat-container .beat-frame) {
			/* Keep consistent multiplier on mobile */
			--cell-size-multiplier: 1;
			gap: 0; /* No gap between pictographs */
		}
	}

	@media (max-height: 600px) {
		:global(.fullscreen-beat-container .beat-frame) {
			/* Keep consistent multiplier on short screens */
			--cell-size-multiplier: 1;
		}
	}

	/* Handle landscape orientation on mobile devices */
	@media (orientation: landscape) and (max-height: 500px) {
		:global(.fullscreen-beat-container .beat-frame) {
			/* Slightly smaller multiplier for very short screens */
			--cell-size-multiplier: 0.9;
		}
	}
</style>
