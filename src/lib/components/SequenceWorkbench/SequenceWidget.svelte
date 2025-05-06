<!-- src/lib/components/SequenceWorkbench/SequenceWidget.svelte -->
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
	import { onMount, onDestroy } from 'svelte';

	// Import Type for Button Definitions
	import type { ButtonDefinition, ActionEventDetail } from './ButtonPanel/types';

	// Components
	import IndicatorLabel from './Labels/IndicatorLabel.svelte';
	import CurrentWordLabel from './Labels/CurrentWordLabel.svelte';
	import DifficultyLabel from './Labels/DifficultyLabel.svelte';
	import BeatFrame from './SequenceBeatFrame/SequenceBeatFrame.svelte';
	import ButtonPanel from './ButtonPanel';
	import FullScreenOverlay from './components/FullScreenOverlay.svelte';
	import ToolsButton from './ToolsButton.svelte';
	import ToolsPanel from './ToolsPanel/ToolsPanel.svelte';

	// Import stores for sequence state
	import { isSequenceEmpty } from '$lib/stores/sequence/sequenceStateStore';
	import { selectedStartPos } from '$lib/stores/sequence/selectionStore';

	// Props
	export let workbenchHeight: number;

	// Use responsive layout hook for dimensions
	const { dimensions } = useResponsiveLayout();

	// Track tools panel state
	const isToolsPanelOpen = writable(false);

	// Calculate workbench orientation based on workbench dimensions instead of window
	$: workbenchIsPortrait = $dimensions.width < workbenchHeight;

	// Subscribe to the sequence store for metadata and status
	const sequenceName = derived(sequenceStore, ($store) => $store.metadata.name);
	const difficultyLevel = derived(sequenceStore, ($store) => $store.metadata.difficulty);
	const sequenceStatus = derived(sequenceStore, ($store) =>
		$store.isModified ? 'editing' : 'ready'
	);

	// --- Define Button Panel Data ---
	// This array defines the specific buttons for this instance of the ButtonPanel
	const buttonPanelButtons: ButtonDefinition[] = [
		{
			icon: 'fa-book-medical',
			title: 'Add to Dictionary',
			id: 'addToDictionary',
			color: '#4361ee'
		},
		{ icon: 'fa-save', title: 'Save Image', id: 'saveImage', color: '#3a86ff' },
		{ icon: 'fa-expand', title: 'View Full Screen', id: 'viewFullScreen', color: '#4cc9f0' },
		{
			icon: 'fa-arrows-left-right',
			title: 'Mirror Sequence',
			id: 'mirrorSequence',
			color: '#4895ef'
		},
		{ icon: 'fa-paintbrush', title: 'Swap Colors', id: 'swapColors', color: '#ff6b6b' },
		{ icon: 'fa-rotate', title: 'Rotate Sequence', id: 'rotateSequence', color: '#f72585' },
		{ icon: 'fa-trash', title: 'Delete Beat', id: 'deleteBeat', color: '#ff9e00' },
		{ icon: 'fa-eraser', title: 'Clear Sequence', id: 'clearSequence', color: '#ff7b00' }
	];

	// Track status for UI
	let status = 'ready';
	$: statusText = getStatusText(status);

	// Update status when sequence changes
	$: {
		if ($sequenceStatus === 'editing') {
			status = 'editing';
		}
	}

	// Function to get user-friendly status text
	function getStatusText(status: string): string {
		switch (status) {
			case 'ready':
				return 'Ready';
			case 'editing':
				return 'Editing';
			case 'saving':
				return 'Saving...';
			case 'error':
				return 'Error';
			default:
				return 'Ready';
		}
	}

	// Handler for button panel actions
	function handleButtonAction(event: CustomEvent<ActionEventDetail>) {
		const { id } = event.detail;

		// Map button actions to state machine actions
		switch (id) {
			case 'addToDictionary':
				status = 'saving';
				setTimeout(() => (status = 'ready'), 500);
				break;
			case 'saveImage':
				status = 'saving';
				setTimeout(() => (status = 'ready'), 500);
				break;
			case 'viewFullScreen':
				openSequenceFullScreen();
				break;
			case 'mirrorSequence':
				// TODO: Implement mirror sequence in the state machine
				status = 'editing';
				setTimeout(() => (status = 'ready'), 200);
				break;
			case 'swapColors':
				// TODO: Implement swap colors in the state machine
				status = 'editing';
				setTimeout(() => (status = 'ready'), 200);
				break;
			case 'rotateSequence':
				status = 'editing';
				setTimeout(() => (status = 'ready'), 200);
				break;
			case 'deleteBeat':
				// Get the selected beat IDs from the sequenceStore
				const selectedBeatIds = sequenceSelectors.selectedBeatIds();
				if (selectedBeatIds.length > 0) {
					// Remove the selected beat and all following beats
					sequenceActions.removeBeatAndFollowing(selectedBeatIds[0]);
					status = 'editing';
				}
				break;
			case 'clearSequence':
				// Call the clearSequence action directly
				sequenceActions.clearSequence();
				selectedStartPos.set(null);
				isSequenceEmpty.set(true);
				status = 'editing';
				setTimeout(() => (status = 'ready'), 200);
				break;
		}

		// After action is processed, close tools panel if it's open
		if ($isToolsPanelOpen) {
			isToolsPanelOpen.set(false);
		}
	}

	// Toggle tools panel visibility
	function toggleToolsPanel() {
		isToolsPanelOpen.update((value) => !value);
	}

	// Track event listener for cleanup
	let buttonActionListener: (event: CustomEvent) => void;

	onMount(() => {
		// Set up event listener for button actions
		buttonActionListener = (event: CustomEvent) => {
			if (event.detail && event.detail.id) {
				handleButtonAction(event);
			}
		};
		document.addEventListener('action', buttonActionListener as EventListener);
	});

	onDestroy(() => {
		// Clean up event listener
		if (buttonActionListener) {
			document.removeEventListener('action', buttonActionListener as EventListener);
		}
	});
</script>

<div class="sequence-widget">
	<div class="main-layout" class:portrait={workbenchIsPortrait}>
		<div class="left-vbox">
			<div class="centered-group">
				<div class="sequence-widget-labels">
					<ToolsButton
						isToolsPanelOpen={$isToolsPanelOpen}
						on:toggleToolsPanel={toggleToolsPanel}
					/>
					<CurrentWordLabel currentWord={$sequenceName} width={$dimensions.width} />
					<DifficultyLabel difficultyLevel={$difficultyLevel} width={$dimensions.width} />
				</div>
				<div class="beat-frame-container">
					<BeatFrame />
				</div>
			</div>

			<div class="indicator-label-container">
				<IndicatorLabel text={statusText} width={$dimensions.width} />
			</div>
		</div>

		<div class="right-panel">
			{#if $isToolsPanelOpen}
				<ToolsPanel
					buttons={buttonPanelButtons}
					on:action={handleButtonAction}
					on:close={() => isToolsPanelOpen.set(false)}
				/>
			{:else if $isSequenceEmpty}
				<div class="start-pos-picker">
					<slot name="startPosPicker"></slot>
				</div>
			{:else}
				<div class="option-picker">
					<slot name="optionPicker"></slot>
				</div>
			{/if}
		</div>
	</div>

	<!-- Full Screen Overlay -->
	<FullScreenOverlay
		isOpen={$isSequenceFullScreen}
		title={$sequenceName}
		on:close={closeSequenceFullScreen}
	>
		<div class="fullscreen-beat-container">
			<BeatFrame />
		</div>
	</FullScreenOverlay>
</div>

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
		width: 100%; /* Ensure full width */
		overflow: hidden; /* Prevent overflow */
		justify-content: space-between; /* Distribute space between children */
	}

	.main-layout.portrait {
		flex-direction: column;
		justify-content: flex-start; /* Align children to the top */
	}

	.left-vbox {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		min-height: 0;
		flex: 1; /* Changed from 14 to 1 to use proportional space */
		overflow: hidden; /* Prevent overflow */
	}

	.right-panel {
		height: 100%;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.centered-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%; /* Take remaining height */
		width: 100%;
		flex-grow: 1; /* Allow group to grow */
		min-height: 0; /* Prevent overflow */
		position: relative; /* For absolute positioning of tools button */
	}

	.sequence-widget-labels {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: white;
		padding-top: 0;
		margin-bottom: 0;
		padding-bottom: 5px;
		position: relative; /* For positioning the tools button */
		width: 100%;
	}

	.beat-frame-container {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		min-height: 0;
		width: 100%;
		padding: 10px;
		padding-top: 0;
		box-sizing: border-box;
	}

	.indicator-label-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: white;
		flex-shrink: 0; /* Prevent shrinking */
		/* Removed flex: 1 to avoid taking too much space */
	}

	.start-pos-picker,
	.option-picker {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	/* Ensure ButtonPanel has appropriate flex properties */
	:global(.sequence-widget .toolbar-container.vertical) {
		/* Target the vertical toolbar container */
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center; /* Center vertically */
		align-items: center;
		margin: auto 0; /* Ensure equal space above and below */
		min-width: 60px; /* Ensure minimum width */
		flex-shrink: 0; /* Prevent shrinking */
	}

	/* Ensure the button panel container doesn't get pushed off-screen */
	:global(.sequence-widget .main-layout:not(.portrait) > .toolbar-container) {
		flex-shrink: 0; /* Prevent shrinking */
		min-width: 60px; /* Ensure minimum width */
		width: auto; /* Allow natural width */
		margin-left: 5px; /* Add a small margin */
		margin-right: 5px; /* Add a small margin */
	}

	/* Full screen beat container styles */
	.fullscreen-beat-container {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0;
		box-sizing: border-box;
	}

	/* Make the beat frame take up as much space as possible in full screen mode */
	:global(.fullscreen-beat-container .beat-frame) {
		width: auto;
		height: auto;
		max-width: 95vw;
		max-height: 95vh;
		transform: scale(1);
	}

	/* Ensure the beat frame container fills the available space */
	:global(.fullscreen-beat-container .beat-frame-container) {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	/* Adjust cell size for optimal visibility based on grid size */
	:global(.fullscreen-beat-container .beat-frame) {
		--cell-size-multiplier: 2.5; /* Default multiplier for small grids */
		--adjusted-cell-size: calc(var(--cell-size) * var(--cell-size-multiplier));
	}

	/* Smaller multiplier for larger grids */
	:global(.fullscreen-beat-container .beat-frame[style*='--total-rows: 3']),
	:global(.fullscreen-beat-container .beat-frame[style*='--total-cols: 4']) {
		--cell-size-multiplier: 2;
	}

	/* Even smaller multiplier for very large grids */
	:global(.fullscreen-beat-container .beat-frame[style*='--total-rows: 4']),
	:global(.fullscreen-beat-container .beat-frame[style*='--total-cols: 5']) {
		--cell-size-multiplier: 1.5;
	}
</style>
