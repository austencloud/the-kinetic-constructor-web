<script lang="ts">
	import { useResponsiveLayout } from '$lib/composables/useResponsiveLayout';
	import { getSequenceContext, sequenceActions } from '$lib/context/sequence/sequenceContext';

	// Import Type for Button Definitions
	import type { ButtonDefinition } from './ButtonPanel/types'; // Adjust path if necessary

	// Components
	import IndicatorLabel from './Labels/IndicatorLabel.svelte';
	import CurrentWordLabel from './Labels/CurrentWordLabel.svelte';
	import DifficultyLabel from './Labels/DifficultyLabel.svelte';
	// Import the ButtonPanel component (ensure path/name matches your file structure)
	import BeatFrame from './SequenceBeatFrame/SequenceBeatFrame.svelte';
	import ButtonPanel from './ButtonPanel';

	// Props
	export let workbenchHeight: number;

	// Get context
	const { state, dispatch } = getSequenceContext();

	// Use responsive layout hook for dimensions
	const { dimensions } = useResponsiveLayout();

	// Calculate workbench orientation based on workbench dimensions instead of window
	$: workbenchIsPortrait = $dimensions.width < workbenchHeight;

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

	// Derived values from context state
	$: ({ sequenceName, difficultyLevel, status } = $state);
	$: statusText = getStatusText(status);

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

	// Handler for button panel actions (remains the same)
	function handleButtonAction(event: CustomEvent<{ id: string }>) {
		const { id } = event.detail;

		// Map button actions to context actions
		switch (id) {
			case 'addToDictionary':
				dispatch({ type: 'SET_STATUS', payload: 'saving' });
				setTimeout(() => dispatch({ type: 'SET_STATUS', payload: 'ready' }), 500);
				break;
			case 'saveImage':
				dispatch({ type: 'SET_STATUS', payload: 'saving' });
				setTimeout(() => dispatch({ type: 'SET_STATUS', payload: 'ready' }), 500);
				break;
			case 'viewFullScreen':
				console.log('Entering full screen mode');
				break;
			case 'mirrorSequence':
				dispatch(sequenceActions.mirrorSequence());
				break;
			case 'swapColors':
				dispatch(sequenceActions.swapColors());
				break;
			case 'rotateSequence':
				dispatch({ type: 'SET_STATUS', payload: 'editing' });
				setTimeout(() => dispatch({ type: 'SET_STATUS', payload: 'ready' }), 200);
				break;
			case 'deleteBeat':
				if ($state.selectedBeatIndex >= 0) {
					dispatch(sequenceActions.removeBeat($state.selectedBeatIndex));
				}
				break;
			case 'clearSequence':
				dispatch(sequenceActions.clearSequence());
				break;
		}
	}
</script>

<div class="sequence-widget">
	<div class="main-layout" class:portrait={workbenchIsPortrait}>
		<div class="left-vbox">
			<div class="centered-group">
				<div class="sequence-widget-labels">
					<CurrentWordLabel currentWord={sequenceName} width={$dimensions.width} />
					<DifficultyLabel {difficultyLevel} width={$dimensions.width} />
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
					isPortrait={workbenchIsPortrait}
					containerWidth={$dimensions.width}
					containerHeight={$dimensions.height}
					buttons={buttonPanelButtons}
					on:action={handleButtonAction}
				/>
			{/if}
		</div>

		{#if !workbenchIsPortrait}
			<ButtonPanel
				isPortrait={workbenchIsPortrait}
				containerWidth={$dimensions.width}
				containerHeight={workbenchHeight}
				buttons={buttonPanelButtons}
				on:action={handleButtonAction}
			/>
		{/if}
	</div>
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
	}

	.main-layout.portrait {
		flex-direction: column;
	}

	.left-vbox {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		min-height: 0;
		flex: 14; /* Adjust flex basis as needed */
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
		gap: 5px; /* Reduced gap */
		color: white;
		padding-top: 10px; /* Add padding */
	}

	.indicator-label-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 5px 10px; /* Adjust padding */
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
	}
</style>
