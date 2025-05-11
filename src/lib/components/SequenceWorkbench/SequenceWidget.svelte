<script lang="ts">
	import { useResponsiveLayout } from '$lib/composables/useResponsiveLayout';
	import { onMount, onDestroy } from 'svelte';
	import { useResizeObserver } from '$lib/composables/useResizeObserver';

	// Import extracted modules
	import { getButtonPanelButtons, handleButtonAction } from './ButtonPanel/ButtonPanelLogic';
	import { useToolsPanelManager } from './ToolsPanel/ToolsPanelManager';
	import {
		calculateWorkbenchIsPortrait,
		calculateButtonSizeFactor
	} from './utils/LayoutCalculator';
	import { useSequenceMetadata } from './utils/SequenceMetadataManager';
	import { useFullScreenManager } from './FullScreen/FullScreenManager';

	// Import Type for Button Definitions
	import type { ActionEventDetail } from './ButtonPanel/types';
	import { appActions } from '$lib/state/machines/app/app.actions'; // Added import

	// Components
	import CurrentWordLabel from './Labels/CurrentWordLabel.svelte';
	import BeatFrame from './BeatFrame/BeatFrame.svelte';
	import FullScreenOverlay from './components/FullScreenOverlay.svelte';
	import ToolsButton from './ToolsButton.svelte';
	import ToolsPanel from './ToolsPanel/ToolsPanel.svelte';
	import ClearSequenceButton from './ClearSequenceButton.svelte';
	import ShareButton from './ShareButton.svelte';
	import SettingsButton from '$lib/components/MenuBar/SettingsButton/SettingsButton.svelte'; // Added import

	// Import transition for animations
	import { fly } from 'svelte/transition';

	// Props using Svelte 5 runes
	const props = $props<{
		toolsPanelOpen?: boolean;
	}>();

	// Set up resize observer for the component
	const { size, resizeObserver } = useResizeObserver();

	// Use responsive layout hook for dimensions
	const { dimensions } = useResponsiveLayout();

	// Track tools panel state
	let isToolsPanelOpen = $state(false);

	// Update local state when prop changes
	$effect(() => {
		isToolsPanelOpen = props.toolsPanelOpen ?? false;
	});

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

	// Get button panel buttons
	const buttonPanelButtons = getButtonPanelButtons();

	// Set up full screen manager
	const fullScreenManager = useFullScreenManager();

	// Set up tools panel manager
	const { toggleToolsPanel, setupEventListeners } = useToolsPanelManager({
		setToolsPanelOpen: (isOpen) => {
			if (typeof isOpen === 'function') {
				isToolsPanelOpen = isOpen(isToolsPanelOpen);
			} else {
				isToolsPanelOpen = isOpen;
			}
		},
		parentPanelOpen: props.toolsPanelOpen
	});

	// Handle button actions
	function handleButtonActionWrapper(event: CustomEvent<ActionEventDetail>) {
		handleButtonAction({
			id: event.detail.id,
			activeMode,
			setActiveMode: (mode) => {
				activeMode = mode;
			},
			closeToolsPanel: () => {
				if (isToolsPanelOpen) {
					isToolsPanelOpen = false;
				}
			},
			openFullScreen: fullScreenManager.openFullScreen
		});
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

		// Set up tools panel event listeners
		setupEventListeners();
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

			{#if isToolsPanelOpen && !props.toolsPanelOpen}
				<!-- Only show this tools panel if the parent's panel is not open -->
				<div class="tools-panel-container" transition:fly={{ duration: 300, y: 0, x: 20 }}>
					<ToolsPanel
						buttons={buttonPanelButtons}
						{activeMode}
						on:action={handleButtonActionWrapper}
						on:close={() => (isToolsPanelOpen = false)}
					/>
				</div>
			{/if}

			<SettingsButton on:click={handleSettingsClick} />
			<ClearSequenceButton on:clearSequence={handleClearSequence} />
			<ShareButton {beatFrameElement} />

			{#if !props.toolsPanelOpen}
				<!-- Only show the tools button if the parent's panel is not open -->
				<ToolsButton {isToolsPanelOpen} on:toggleToolsPanel={toggleToolsPanel} />
			{/if}
		</div>

		<FullScreenOverlay
			isOpen={fullScreenManager.isFullScreen}
			title={sequenceName}
			on:close={fullScreenManager.closeFullScreen}
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

	.tools-panel-container {
		/* Position the tools panel to take up the entire right side */
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		width: 320px; /* Fixed width for desktop */
		display: flex;
		flex-direction: column;
		padding: 0; /* Remove padding to let the panel handle its own spacing */
		background-color: transparent; /* Transparent background */
		z-index: 50; /* Ensure it's above other content */
		box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1); /* Add shadow on the left side */
		overflow: hidden; /* Prevent content from overflowing */
		backdrop-filter: blur(5px); /* Add blur effect */
		-webkit-backdrop-filter: blur(5px);
	}

	/* Responsive adjustments for the tools panel */
	@media (max-width: 768px) {
		.tools-panel-container {
			width: 280px; /* Slightly smaller on tablets */
		}
	}

	@media (max-width: 480px) {
		.tools-panel-container {
			width: 100%; /* Full width on mobile */
			left: 0; /* Cover the entire screen */
		}
	}

	/* Adjust for portrait mode */
	.main-layout.portrait .tools-panel-container {
		width: 100%; /* Full width in portrait mode */
		height: 70%; /* Take up 70% of the height */
		top: auto; /* Reset top position */
		bottom: 0; /* Align to bottom */
		left: 0; /* Cover full width */
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1); /* Shadow on top */
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
