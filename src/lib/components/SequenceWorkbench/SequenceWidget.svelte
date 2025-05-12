<script lang="ts">
	import { useResponsiveLayout } from '$lib/composables/useResponsiveLayout';
	import { onMount, onDestroy } from 'svelte';
	import { useResizeObserver } from '$lib/composables/useResizeObserver';

	// Import extracted modules
	import { handleButtonAction } from './ButtonPanel/ButtonPanelLogic';
	import {
		calculateWorkbenchIsPortrait,
		calculateButtonSizeFactor
	} from './utils/LayoutCalculator';
	import { useSequenceMetadata } from './utils/SequenceMetadataManager';
	import { useSequenceOverlayManager } from './SequenceOverlay/SequenceOverlayManager';
	import {
		openSequenceFullScreen,
		closeSequenceFullScreen
	} from '$lib/stores/sequence/sequenceOverlayStore';

	// Import Type for Button Definitions
	import type { ActionEventDetail } from './ButtonPanel/types';
	import { appActions } from '$lib/state/machines/app/app.actions';
	import * as sequenceActions from '$lib/state/machines/sequenceMachine/actions';
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';

	// Components
	import CurrentWordLabel from './Labels/CurrentWordLabel.svelte';
	import BeatFrame from './BeatFrame/BeatFrame.svelte';
	import SequenceOverlay from './components/SequenceOverlay.svelte';
	import ClearSequenceButton from './ClearSequenceButton.svelte';
	import RemoveBeatButton from './RemoveBeatButton.svelte';
	import SequenceOverlayButton from './SequenceOverlayButton.svelte';
	import ShareButton from './ShareButton.svelte';
	import SettingsButton from '$lib/components/MenuBar/SettingsButton/SettingsButton.svelte';

	// No props needed

	// Set up resize observer for the component
	const { size, resizeObserver } = useResizeObserver();

	// Use responsive layout hook for dimensions
	const { dimensions } = useResponsiveLayout();

	// Track the active mode
	let activeMode = $state<'construct' | 'generate'>('construct');

	// Track beat frame natural height and scrolling state
	let beatFrameNaturalHeight = $state(0);
	let beatFrameShouldScroll = $state(false);
	let currentWordLabelElement = $state<HTMLElement | null>(null);
	let beatFrameElement = $state<HTMLElement | null>(null); // State for BeatFrame element

	// Emit the full sequence widget dimensions whenever they change
	$effect(() => {
		// Only emit if we have valid dimensions
		if ($size && $size.width > 0 && $size.height > 0) {
			// Create a custom event with the full widget dimensions
			const event = new CustomEvent('sequence-widget-dimensions', {
				bubbles: true,
				detail: {
					width: $size.width,
					height: $size.height
				}
			});

			// Dispatch the event
			document.dispatchEvent(event);
		}
	});

	// Determine if beat frame should scroll based on natural height and available space
	$effect(() => {
		if (!$size || $size.height === 0 || !currentWordLabelElement) return;

		const labelHeight = currentWordLabelElement.offsetHeight || 0;

		// Define overall vertical padding for the main content area
		const widgetVerticalPadding = 20; // 10px top + 10px bottom for .sequence-container

		// Padding for the beat-frame-wrapper that is outside the scrollable area
		const beatFrameWrapperPaddingBottom = 10;

		const availableHeightForBeatFrameAndLabel = $size.height - widgetVerticalPadding;
		const availableHeightForBeatFrameItself =
			availableHeightForBeatFrameAndLabel - labelHeight - beatFrameWrapperPaddingBottom;

		if (beatFrameNaturalHeight > 0) {
			beatFrameShouldScroll = beatFrameNaturalHeight > availableHeightForBeatFrameItself;

			// Log for debugging
			if (import.meta.env.DEV) {
				console.log('Scroll calculation:', {
					beatFrameNaturalHeight,
					availableHeightForBeatFrameItself,
					shouldScroll: beatFrameShouldScroll,
					labelHeight,
					totalHeight: $size.height
				});
			}
		} else {
			beatFrameShouldScroll = false; // Default if natural height isn't reported yet
		}
	});

	// Handle beat frame height change event
	function handleBeatFrameHeightChange(event: CustomEvent<{ height: number }>) {
		beatFrameNaturalHeight = event.detail.height;

		// Log for debugging
		if (import.meta.env.DEV) {
			console.log('Beat frame natural height changed:', beatFrameNaturalHeight);
		}
	}

	// Calculate workbench orientation based on container dimensions
	const workbenchIsPortrait = $derived(
		calculateWorkbenchIsPortrait($dimensions.width, $size.height)
	);

	// Calculate button size factor based on container dimensions
	const buttonSizeFactor = $derived(
		calculateButtonSizeFactor($dimensions.width, $dimensions.height)
	);

	// Subscribe to the sequence store for metadata
	let sequenceName = $state('');

	// Update metadata from the sequence store
	$effect(() => {
		const { unsubscribe } = useSequenceMetadata((metadata) => {
			sequenceName = metadata.name;
		});

		return unsubscribe;
	});

	// Set up sequence overlay manager with Svelte 5 reactivity
	const fullScreenManager = $state(useSequenceOverlayManager());

	// Handle button actions
	function handleButtonActionWrapper(event: CustomEvent<ActionEventDetail>) {
		handleButtonAction({
			id: event.detail.id,
			activeMode,
			setActiveMode: (mode) => {
				activeMode = mode;
			},
			openFullScreen: fullScreenManager.openFullScreen
		});
	}

	// Handle sequence overlay button click
	function handleViewSequenceOverlay() {
		console.log('Opening sequence overlay view');
		// Direct call to store function for more reliable state updates
		openSequenceFullScreen();
	}

	// Handle remove beat button click
	function handleRemoveBeat() {
		// Get the selected beat ID from the sequence container
		const selectedBeatIds = sequenceContainer.state.selectedBeatIds;
		if (selectedBeatIds.length > 0) {
			// Create the event object expected by the action
			const event = { type: 'REMOVE_BEAT_AND_FOLLOWING', beatId: selectedBeatIds[0] };
			sequenceActions.removeBeatAndFollowing({ event });
		}
	}

	function handleClearSequence() {
		const event = new CustomEvent<ActionEventDetail>('action', {
			detail: { id: 'clearSequence' }
		});
		handleButtonActionWrapper(event);
	}

	function handleSettingsClick() {
		// Placeholder for settings functionality
		console.log('Settings button clicked in SequenceWidget');
		appActions.openSettings(); // Call appActions to open the main settings dialog
		// TODO: Implement settings panel toggle or other action
	}

	let buttonActionListener: (event: CustomEvent) => void;

	onMount(() => {
		// Listen for button actions
		buttonActionListener = (event: CustomEvent) => {
			if (event.detail && event.detail.id) {
				handleButtonActionWrapper(event);
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
	<div class="sequence-widget" use:resizeObserver>
		<div
			class="main-layout"
			class:portrait={workbenchIsPortrait}
			style="--container-width: {$dimensions.width}px;
		       --container-height: {$dimensions.height}px;
		       --button-size-factor: {buttonSizeFactor};"
		>
			<div class="left-vbox">
				<div
					class="sequence-container"
					style:justify-content={beatFrameShouldScroll ? 'flex-start' : 'center'}
					style:align-items={beatFrameShouldScroll ? 'stretch' : 'center'}
				>
					<div class="content-wrapper" class:scroll-mode-active={beatFrameShouldScroll}>
						<!-- Group label and beat frame together as a single unit -->
						<div class="label-and-beatframe-unit" class:scroll-mode-active={beatFrameShouldScroll}>
							<div bind:this={currentWordLabelElement} class="sequence-widget-labels">
								<CurrentWordLabel currentWord={sequenceName} width={$dimensions.width} />
							</div>

							<div class="beat-frame-wrapper" class:scroll-mode-active={beatFrameShouldScroll}>
								<BeatFrame
									on:naturalheightchange={handleBeatFrameHeightChange}
									isScrollable={beatFrameShouldScroll}
									elementReceiver={(el: HTMLElement | null) => (beatFrameElement = el)}
								/>
							</div>
						</div>
					</div>

					<!-- Difficulty label moved below the beats -->
					<!-- <div class="difficulty-label-container">
						<DifficultyLabel {difficultyLevel} width={$dimensions.width} />
					</div> -->
				</div>
			</div>

			<SettingsButton on:click={handleSettingsClick} />
			<ClearSequenceButton on:clearSequence={handleClearSequence} />
			<RemoveBeatButton on:removeBeat={handleRemoveBeat} />
			<SequenceOverlayButton on:viewSequenceOverlay={handleViewSequenceOverlay} />
			<ShareButton {beatFrameElement} />
		</div>

		<SequenceOverlay
			isOpen={fullScreenManager.isFullScreen}
			title={sequenceName}
			on:close={() => closeSequenceFullScreen()}
		>
			<div class="fullscreen-beat-container">
				<!-- Clone the BeatFrame with the same data but optimized for fullscreen display -->
				<BeatFrame isScrollable={false} fullScreenMode={true} />
			</div>
		</SequenceOverlay>
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
		/* Add transition for smooth layout changes */
		transition: all 0.3s ease-out;
	}

	.sequence-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		/* align-items will be dynamic */
		/* justify-content will be dynamic */
		padding: 10px 0; /* Add some vertical padding */
		box-sizing: border-box;
		/* Add transition for smooth layout changes */
		transition: all 0.3s ease-out;
	}

	/* Content wrapper for label + beat frame that can be centered as a unit */
	.content-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center; /* Center children vertically */
		width: 100%;
		/* Allow natural sizing based on content */
		height: 100%; /* Take full height to enable vertical centering */
		/* Ensure it can grow to fill available space when needed */
		flex: 1;
		min-height: 0; /* Crucial for flex-grow in a flex column */
		/* Add transition for smooth layout changes */
		transition: all 0.3s ease-out;
	}

	/* Apply different styles when in scroll mode */
	.content-wrapper.scroll-mode-active {
		justify-content: flex-start; /* Align to top in scroll mode */
	}

	/* Container that keeps the label and beat frame together as a single unit */
	.label-and-beatframe-unit {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		/* Keep the label and beat frame together with no gap */
		gap: 0;
		/* Don't grow to fill space in non-scrolling mode */
		flex: 0 0 auto;
		/* Add transition for smooth layout changes */
		transition: all 0.3s ease-out;
	}

	/* Apply different styles when in scroll mode */
	.label-and-beatframe-unit.scroll-mode-active {
		width: 100%;
		/* Take up all available space in scroll mode */
		flex: 1 1 auto;
		min-height: 0; /* Crucial for flex-grow in a flex column */
	}

	.sequence-widget-labels {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: white;
		width: 100%;
		flex-shrink: 0; /* Prevent labels from shrinking */
		padding-bottom: 2px; /* Minimal space between labels and beat frame */
		margin-bottom: 0; /* Ensure it hugs the beat frame */
		/* Ensure the label stays with the beat frame */
		position: relative;
		z-index: 1;
	}

	/* Container for the difficulty label below the beats */

	/* This wrapper ensures BeatFrame maintains its defined dimensions and handles overflow */
	.beat-frame-wrapper {
		display: flex; /* To center BeatFrame when not scrolling */
		justify-content: center; /* To center BeatFrame when not scrolling */
		align-items: center; /* To center BeatFrame when not scrolling */
		width: 100%;
		padding: 0 10px; /* Horizontal padding for the beat frame area */
		box-sizing: border-box;
		position: relative;
		overflow: visible; /* IMPORTANT: This wrapper does NOT scroll. BeatFrame does. */
		/* Default: height determined by content (BeatFrame) */
		transition: all 0.3s ease-out;
		/* Remove vertical margin to hug the label */
		margin: 0;
	}

	/* Apply different styles when in scroll mode */
	.beat-frame-wrapper.scroll-mode-active {
		flex-grow: 1; /* Allow it to take available space when scrolling */
		min-height: 0; /* Crucial for flex-grow in a flex column */
		align-items: stretch; /* Make BeatFrame fill height */
		/* The actual height constraint is implicitly set by flex-grow and parent's height */
		/* Remove auto margins in scroll mode */
		margin: 0;
	}

	/* This is the actual container passed to BeatFrame via use:resizeObserver */
	/* Its styles are in BeatFrame.svelte but its flex behavior is controlled here */
	:global(.beat-frame-container) {
		/* The BeatFrame's direct parent (from BeatFrame.svelte) */
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative; /* Changed from absolute to allow proper overflow handling */
		/* Add transition for smooth layout changes */
		transition: all 0.3s ease-out;
		max-height: 100%; /* Prevent expanding beyond parent height */
	}

	/* Indicator label container removed */

	/* Tools panel container removed */

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
		.sequence-widget-labels {
			padding-bottom: 5px;
		}
	}

	/* Ensure smooth transitions between portrait and landscape modes */
	.main-layout {
		transition: flex-direction 0.3s ease-out;
	}

	/* Ensure beat frame wrapper maintains consistent dimensions during transitions */
	.beat-frame-wrapper {
		transition: all 0.3s ease-out;
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

	/* Add styles for the new SettingsButton to position it top-left */
	:global(.sequence-widget > .main-layout > .settings-button) {
		position: absolute;
		top: calc(var(--button-size-factor, 1) * 10px); /* Consistent with other buttons */
		left: calc(var(--button-size-factor, 1) * 10px);
		width: calc(var(--button-size-factor, 1) * 45px); /* Base size from ShareButton */
		height: calc(var(--button-size-factor, 1) * 45px);
		z-index: 40; /* Consistent with other FABs */
		/* Override default margin from SettingsButton's own style if necessary */
		margin: 0 !important;
	}

	/* Ensure the icon inside scales correctly if its internal styling doesn't use a factor */
	:global(.sequence-widget > .main-layout > .settings-button .settings-icon) {
		font-size: calc(var(--button-size-factor, 1) * 19px); /* Base icon size from ShareButton */
	}

	/* REMOVED .styled-clear-button STYLES AS THEY ARE NOW IN ClearSequenceButton.svelte */
</style>
