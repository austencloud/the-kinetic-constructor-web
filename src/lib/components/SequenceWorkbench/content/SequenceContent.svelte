<script lang="ts">
	import { useSequenceMetadata } from '../utils/SequenceMetadataManager';
	import CurrentWordLabel from '../Labels/CurrentWordLabel.svelte';
	import BeatFrame from '../BeatFrame/BeatFrame.svelte';
	import { calculateBeatFrameShouldScroll } from '../utils/SequenceLayoutCalculator';
	import { createEventDispatcher, setContext } from 'svelte';
	import { browser } from '$app/environment';
	import { BEAT_FRAME_CONTEXT_KEY, type ElementContext } from '../context/ElementContext';

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		beatselected: { beatId: string };
	}>();

	// We're using the shared context key from ElementContext.ts

	// Props
	const { containerHeight = $bindable(0), containerWidth = $bindable(0) } = $props<{
		containerHeight?: number;
		containerWidth?: number;
	}>();

	// State
	let beatFrameNaturalHeight = $state(0);
	let beatFrameShouldScroll = $state(false);
	let currentWordLabelElement = $state<HTMLElement | null>(null);
	let sequenceName = $state('');
	let beatFrameElement = $state<HTMLElement | null>(null);

	// Create a context for the beat frame element that can be accessed by child components
	setContext<ElementContext>(BEAT_FRAME_CONTEXT_KEY, {
		getElement: () => beatFrameElement,
		setElement: (el: HTMLElement | null) => {
			if (el) {
				beatFrameElement = el;

				// Also store in global variables for maximum compatibility
				if (browser) {
					(window as any).__beatFrameElementRef = el;
					(window as any).__pendingBeatFrameElement = el;
				}

				// Dispatch a custom event for components that don't use context
				const event = new CustomEvent('beatframe-element-available', {
					bubbles: true,
					detail: { element: el }
				});
				document.dispatchEvent(event);

				return true;
			}
			return false;
		}
	});

	// Update metadata from the sequence store
	$effect(() => {
		const { unsubscribe } = useSequenceMetadata((metadata) => {
			sequenceName = metadata.name;
		});

		return unsubscribe;
	});

	// Determine if beat frame should scroll based on natural height and available space
	$effect(() => {
		if (containerHeight === 0 || !currentWordLabelElement) return;

		const labelHeight = currentWordLabelElement.offsetHeight || 0;

		// Use the extracted layout calculator function
		beatFrameShouldScroll = calculateBeatFrameShouldScroll(
			beatFrameNaturalHeight,
			containerHeight,
			labelHeight
		);


	});

	// Handle beat frame height change event
	function handleBeatFrameHeightChange(event: CustomEvent<{ height: number }>) {
		beatFrameNaturalHeight = event.detail.height;


	}

	// Handle beat selected event
	function handleBeatSelected(event: CustomEvent<{ beatId: string }>) {
		// Forward the event to the parent component
		dispatch('beatselected', { beatId: event.detail.beatId });
	}
</script>

<div
	class="sequence-container"
	style:justify-content={beatFrameShouldScroll ? 'flex-start' : 'center'}
	style:align-items={beatFrameShouldScroll ? 'stretch' : 'center'}
>
	<!-- Content wrapper with full height -->
	<div class="content-wrapper" class:scroll-mode-active={beatFrameShouldScroll}>
		<!-- Group label and beat frame together as a single unit -->
		<div class="label-and-beatframe-unit" class:scroll-mode-active={beatFrameShouldScroll}>
			<div bind:this={currentWordLabelElement} class="sequence-widget-labels">
				<CurrentWordLabel currentWord={sequenceName} width={containerWidth} />
			</div>

			<!-- Beat frame wrapper with adjusted height to account for label -->
			<div class="beat-frame-wrapper" class:scroll-mode-active={beatFrameShouldScroll}>
				<!-- Pass the scrollable state to BeatFrame to let it handle scrolling -->
				<BeatFrame
					on:naturalheightchange={handleBeatFrameHeightChange}
					on:beatselected={handleBeatSelected}
					isScrollable={beatFrameShouldScroll}
					elementReceiver={function (el: HTMLElement | null) {
						// Use a function to update the element reference

						if (el) {
							// Update our local state
							beatFrameElement = el;

							// Store in global variables for maximum compatibility
							if (browser) {
								(window as any).__beatFrameElementRef = el;
								(window as any).__pendingBeatFrameElement = el;
							}

							// Dispatch a custom event for components that don't use context
							const event = new CustomEvent('beatframe-element-available', {
								bubbles: true,
								detail: { element: el }
							});
							document.dispatchEvent(event);

						} 
					}}
				/>
			</div>
		</div>
	</div>
</div>

<style>
	.sequence-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		min-height: 0; /* Important for flex children */
		overflow: hidden; /* Let children handle their own scrolling */
		/* Add padding that respects safe area insets */
		padding: calc(10px + var(--safe-inset-top, 0px)) calc(0px + var(--safe-inset-right, 0px))
			calc(10px + var(--safe-inset-bottom, 0px)) calc(0px + var(--safe-inset-left, 0px));
		box-sizing: border-box;
		/* Add transition for smooth layout changes */
		transition: all 0.3s ease-out;
	}

	/* Content wrapper for label + beat frame that can be centered as a unit */
	.content-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center; /* Center children vertically by default */
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

	/* Group the label and beat frame as a single unit for centering */
	.label-and-beatframe-unit {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		/* Keep the label and beat frame together with no gap */
		gap: 0;
		/* Don't grow to fill space in non-scrolling mode - this is crucial for centering */
		flex: 0 0 auto;
		/* Add transition for smooth layout changes */
		transition: all 0.3s ease-out;
	}

	/* Apply different styles when in scroll mode */
	.label-and-beatframe-unit.scroll-mode-active {
		width: 100%; /* Take full width in scroll mode */
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

	/* Add global styles for the BeatFrame container */
	:global(.beat-frame-container) {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
		transition: all 0.3s ease-out;
		max-height: 100%; /* Prevent expanding beyond parent height */
	}
</style>
