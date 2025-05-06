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
	import FullScreenOverlay from './components/FullScreenOverlay.svelte';
	import ToolsButton from './ToolsButton.svelte';
	import ToolsPanel from './ToolsPanel/ToolsPanel.svelte';
	import ClearSequenceButton from './ClearSequenceButton.svelte';

	// Import stores for sequence state
	import { isSequenceEmpty } from '$lib/stores/sequence/sequenceStateStore';
	import { selectedStartPos } from '$lib/stores/sequence/selectionStore';
	import { fly } from 'svelte/transition';

	// Props
	export let workbenchHeight: number;

	// Use responsive layout hook for dimensions
	const { dimensions } = useResponsiveLayout();

	// Track tools panel state
	const isToolsPanelOpen = writable(false);

	// Calculate workbench orientation based on workbench dimensions instead of window
	$: workbenchIsPortrait = $dimensions.width < workbenchHeight;

	// Subscribe to stores
	$: toolsPanelOpen = $isToolsPanelOpen;

	// Subscribe to the sequence store for metadata and status
	const sequenceName = derived(sequenceStore, ($store) => $store.metadata.name);
	const difficultyLevel = derived(sequenceStore, ($store) => $store.metadata.difficulty);
	const sequenceStatus = derived(sequenceStore, ($store) =>
		$store.isModified ? 'editing' : 'ready'
	);

	// --- Define Button Panel Data ---
	const buttonPanelButtons: ButtonDefinition[] = [
		{
			icon: 'fa-book-medical',
			title: 'Add to Dictionary',
			id: 'addToDictionary',
			color: '#4361ee'
		},
		{ icon: 'fa-share-nodes', title: 'Share', id: 'saveImage', color: '#3a86ff' },
		{ icon: 'fa-expand', title: 'Full Screen', id: 'viewFullScreen', color: '#4cc9f0' },
		{
			icon: 'fa-arrows-left-right',
			title: 'Mirror',
			id: 'mirrorSequence',
			color: '#4895ef'
		},
		{ icon: 'fa-paintbrush', title: 'Swap Colors', id: 'swapColors', color: '#ff6b6b' },
		{ icon: 'fa-rotate', title: 'Rotate', id: 'rotateSequence', color: '#f72585' },
		{ icon: 'fa-trash', title: 'Delete Beat', id: 'deleteBeat', color: '#ff9e00' }
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

	function handleButtonAction(event: CustomEvent<ActionEventDetail>) {
		const { id } = event.detail;
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
				status = 'editing';
				setTimeout(() => (status = 'ready'), 200);
				break;
			case 'swapColors':
				status = 'editing';
				setTimeout(() => (status = 'ready'), 200);
				break;
			case 'rotateSequence':
				status = 'editing';
				setTimeout(() => (status = 'ready'), 200);
				break;
			case 'deleteBeat':
				const selectedBeatIds = sequenceSelectors.selectedBeatIds();
				if (selectedBeatIds.length > 0) {
					sequenceActions.removeBeatAndFollowing(selectedBeatIds[0]);
					status = 'editing';
				}
				break;
			case 'clearSequence':
				sequenceActions.clearSequence();
				selectedStartPos.set(null);
				isSequenceEmpty.set(true);
				status = 'editing';
				setTimeout(() => (status = 'ready'), 200);
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

	function toggleToolsPanel() {
		isToolsPanelOpen.update((value) => !value);
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

<div class="sequence-widget">
	<div class="main-layout" class:portrait={workbenchIsPortrait}>
		<div class="left-vbox">
			<div class="sequence-container">
				<div class="sequence-widget-labels">
					<CurrentWordLabel currentWord={$sequenceName} width={$dimensions.width} />
					<DifficultyLabel difficultyLevel={$difficultyLevel} width={$dimensions.width} />
				</div>
				
				<div class="beat-frame-wrapper"> 
					<BeatFrame />
				</div>
				
				<div class="indicator-label-container">
					<IndicatorLabel text={statusText} width={$dimensions.width} />
				</div>
			</div>
		</div>

		{#if toolsPanelOpen}
			<div class="tools-panel-container" transition:fly={{ duration: 300, y: 10 }}>
				<ToolsPanel
					buttons={buttonPanelButtons}
					on:action={handleButtonAction}
					on:close={() => isToolsPanelOpen.set(false)}
				/>
			</div>
		{/if}

		<ToolsButton isToolsPanelOpen={$isToolsPanelOpen} on:toggleToolsPanel={toggleToolsPanel} />
		<ClearSequenceButton on:clearSequence={handleClearSequence} />
	</div>

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
	/* Its styles are in SequenceBeatFrame.svelte but its flex behavior is controlled here */
	:global(.beat-frame-container) {
		/* The BeatFrame's direct parent (from SequenceBeatFrame.svelte) 
		   should fill the .beat-frame-wrapper */
		width: 100%;
		height: 100%; 
		/* overflow: auto; If you want this div to scroll instead of BeatFrame internal grid */
	}


	.indicator-label-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: white;
		width: 100%;
		flex-shrink: 0; /* Prevent label from shrinking */
		padding-top: 10px; /* Space between beat frame and indicator */
	}

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
		padding: 0;
		box-sizing: border-box;
	}

	/* Responsive mobile layout adjustments */
	@media (max-width: 768px) {
		.main-layout.portrait .tools-panel-container {
			padding: 6px;
		}
		.sequence-widget-labels {
			padding-bottom: 5px;
		}
		.indicator-label-container {
			padding-top: 5px;
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

	:global(.fullscreen-beat-container .beat-frame) {
		width: auto;
		height: auto;
		max-width: 95vw;
		max-height: 95vh;
		transform: scale(1);
	}
	:global(.fullscreen-beat-container .beat-frame-container) {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	:global(.fullscreen-beat-container .beat-frame) {
		--cell-size-multiplier: 2.5;
		--adjusted-cell-size: calc(var(--cell-size) * var(--cell-size-multiplier));
	}
	:global(.fullscreen-beat-container .beat-frame[style*='--total-rows: 3']),
	:global(.fullscreen-beat-container .beat-frame[style*='--total-cols: 4']) {
		--cell-size-multiplier: 2;
	}
	:global(.fullscreen-beat-container .beat-frame[style*='--total-rows: 4']),
	:global(.fullscreen-beat-container .beat-frame[style*='--total-cols: 5']) {
		--cell-size-multiplier: 1.5;
	}
</style>