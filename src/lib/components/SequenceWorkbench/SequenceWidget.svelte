<script lang="ts">
	import { useResponsiveLayout } from '$lib/composables/useResponsiveLayout';
	import { sequenceActions, sequenceSelectors } from '$lib/state/machines/sequenceMachine';
	import { sequenceStore } from '$lib/state/stores/sequenceStore';
	import { derived } from 'svelte/store';
	import {
		isSequenceFullScreen,
		openSequenceFullScreen,
		closeSequenceFullScreen
	} from '$lib/stores/sequence/fullScreenStore';

	// Import Type for Button Definitions
	import type { ButtonDefinition } from './ButtonPanel/types'; // Adjust path if necessary

	// Components
	import IndicatorLabel from './Labels/IndicatorLabel.svelte';
	import CurrentWordLabel from './Labels/CurrentWordLabel.svelte';
	import DifficultyLabel from './Labels/DifficultyLabel.svelte';
	// Import the ButtonPanel component (ensure path/name matches your file structure)
	import BeatFrame from './SequenceBeatFrame/SequenceBeatFrame.svelte';
	import ButtonPanel from './ButtonPanel';
	import FullScreenOverlay from './components/FullScreenOverlay.svelte';

	// Props
	export let workbenchHeight: number;

	// Use responsive layout hook for dimensions
	const { dimensions } = useResponsiveLayout();

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
	function handleButtonAction(event: CustomEvent<{ id: string }>) {
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
				status = 'editing';
				setTimeout(() => (status = 'ready'), 200);
				break;
		}
	}
</script>

<div class="sequence-widget">
	<div class="main-layout" class:portrait={workbenchIsPortrait}>
		<div class="left-vbox">
			<div class="centered-group">
				<div class="sequence-widget-labels">
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

			{#if workbenchIsPortrait}
				<ButtonPanel
					containerWidth={$dimensions.width}
					containerHeight={$dimensions.height}
					buttons={buttonPanelButtons}
					on:action={handleButtonAction}
				/>
			{/if}
		</div>

		{#if !workbenchIsPortrait}
			<ButtonPanel
				containerWidth={$dimensions.width}
				containerHeight={workbenchHeight}
				buttons={buttonPanelButtons}
				on:action={handleButtonAction}
			/>
		{/if}
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

	.centered-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%; /* Take remaining height */
		width: 100%;
		flex-grow: 1; /* Allow group to grow */
		min-height: 0; /* Prevent overflow */
	}

	.beat-frame-container {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1; /* Allow beat frame to take available space */
		min-height: 0; /* Important for flex children */
		width: 100%; /* Take full width */
		padding: 10px; /* Add some padding */
		box-sizing: border-box;
	}

	.sequence-widget-labels {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: white;
		padding-top: 10px; /* Add padding */
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
