<!-- src/lib/components/SequenceWorkbench/BeatFrame/BeatFrame.svelte -->
<script lang="ts">
	import { useResizeObserver } from '$lib/composables/useResizeObserver';
	import type { BeatData as LegacyBeatData } from './BeatData';
	import type { BeatFrameLayoutOptions } from '$lib/types/BeatFrameLayoutOptions';
	import { createEventDispatcher } from 'svelte';

	// Import manager components
	import BeatFrameLayoutManager from './managers/BeatFrameLayoutManager.svelte';
	import BeatFrameElementManager from './managers/BeatFrameElementManager.svelte';
	import BeatFrameStateManager from './managers/BeatFrameStateManager.svelte';

	// Import grid component
	import BeatFrameGrid from './BeatFrameGrid.svelte';

	// Import sequence container
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
	import { useContainer } from '$lib/state/core/svelte5-integration.svelte';

	// Create event dispatcher for custom events
	const dispatch = createEventDispatcher<{
		naturalheightchange: { height: number };
		beatselected: { beatId: string };
	}>();

	// Use the sequence container with Svelte 5 runes
	const sequence = useContainer(sequenceContainer);

	// Props using Svelte 5 runes
	const {
		isScrollable = $bindable(false),
		layoutOverride = $bindable(null),
		elementReceiver = $bindable<(element: HTMLElement | null) => void>(() => {}),
		fullScreenMode = $bindable(false)
	} = $props<{
		isScrollable?: boolean;
		layoutOverride?: BeatFrameLayoutOptions | null;
		elementReceiver?: (element: HTMLElement | null) => void;
		fullScreenMode?: boolean;
	}>();

	// Use resize observer
	const { resizeObserver } = useResizeObserver();

	// References to manager components
	let layoutManager = $state<BeatFrameLayoutManager | null>(null);
	let elementManager = $state<BeatFrameElementManager | null>(null);
	let stateManager = $state<BeatFrameStateManager | null>(null);

	// Reference to the container element
	let beatFrameContainerRef = $state<HTMLElement | null>(null);

	// Setup event listeners for custom events
	$effect(() => {
		if (!beatFrameContainerRef) return;

		// Listen for naturalheightchange events
		const handleNaturalHeightChange = (event: CustomEvent) => {
			// Only forward events that didn't originate from this component
			// This prevents infinite recursion
			if (event.target !== beatFrameContainerRef) {
				// Forward the event to parent components using the dispatcher
				dispatch('naturalheightchange', event.detail);
			}
		};

		// We don't need to listen for beatselected events on the document
		// The BeatFrameStateManager already dispatches these events
		// and they bubble up naturally through the DOM

		// Add event listeners - only for naturalheightchange
		document.addEventListener('naturalheightchange', handleNaturalHeightChange as EventListener);

		// Clean up event listeners
		return () => {
			document.removeEventListener(
				'naturalheightchange',
				handleNaturalHeightChange as EventListener
			);
		};
	});

	// Public methods that can be called from parent components
	export function addBeat(beatData: LegacyBeatData) {
		if (stateManager) {
			stateManager.addBeat(beatData);
		}
	}

	export function clearBeats() {
		if (stateManager) {
			stateManager.clearBeats();
		}
	}

	export function testPersistence() {
		if (stateManager) {
			return stateManager.testPersistence();
		}
		return {
			success: false,
			message: 'State manager not initialized'
		};
	}
</script>

<div
	use:resizeObserver
	class="beat-frame-container"
	class:scrollable-active={isScrollable ||
		(layoutManager?.getLayoutInfo()?.contentOverflows ?? false)}
	class:fullscreen-mode={fullScreenMode}
	bind:this={beatFrameContainerRef}
>
	<!-- Element Manager (invisible component) -->
	<BeatFrameElementManager
		bind:this={elementManager}
		containerRef={beatFrameContainerRef}
		{elementReceiver}
	/>

	<!-- State Manager (invisible component) -->
	<BeatFrameStateManager bind:this={stateManager} />

	<!-- Layout Manager (invisible component) -->
	<BeatFrameLayoutManager
		bind:this={layoutManager}
		beatCount={sequence.beats?.length ?? 0}
		containerRef={beatFrameContainerRef}
		{isScrollable}
		{layoutOverride}
		{fullScreenMode}
	/>

	<!-- Only render the grid if all managers are initialized -->
	{#if layoutManager && stateManager}
		{@const layoutInfo = layoutManager.getLayoutInfo()}
		{@const stateInfo = stateManager.getState()}

		<BeatFrameGrid
			beatRows={layoutInfo.beatRows}
			beatCols={layoutInfo.beatCols}
			cellSize={layoutInfo.cellSize}
			beats={stateInfo.beats}
			selectedBeatIndex={stateInfo.selectedBeatIndex}
			sequenceIsEmpty={stateInfo.sequenceIsEmpty}
			startPosBeatData={stateInfo.startPosBeatData}
			beatCount={stateInfo.beatCount}
			onStartPosBeatClick={stateManager.handleStartPosBeatClick}
			onBeatClick={stateManager.handleBeatClick}
		/>
	{/if}
</div>

<style>
	.beat-frame-container {
		width: 100%;
		/* height will be 'auto' by default, or '100%' when scrollable */
		height: auto;
		display: flex;
		justify-content: stretch; /* Stretch content to fill available space */
		align-items: center; /* Default alignment */
		position: relative;
		transition: all 0.3s ease-out;
		overflow: visible; /* Default */
		/* Remove horizontal margin to use full width */
		margin: auto 0;
		/* Add padding to prevent content from touching edges */
		padding: 0 5px;
	}

	/* Apply scrolling only when needed */
	.beat-frame-container.scrollable-active {
		height: 100%; /* Fill the constrained height from SequenceWidget */
		overflow-y: auto !important;
		overflow-x: hidden;
		scrollbar-width: thin; /* For Firefox */
		scrollbar-color: rgba(0, 0, 0, 0.3) transparent; /* For Firefox */
		align-items: flex-start !important; /* Pin to top when scrolling */
		padding-right: 8px; /* Space for scrollbar */
		padding-left: 5px; /* Maintain left padding */
		/* Remove auto margins in scroll mode */
		margin: 0;
	}

	/* Webkit scrollbar styling */
	.beat-frame-container.scrollable-active::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	.beat-frame-container.scrollable-active::-webkit-scrollbar-track {
		background: transparent;
	}

	.beat-frame-container.scrollable-active::-webkit-scrollbar-thumb {
		background-color: rgba(0, 0, 0, 0.3);
		border-radius: 4px;
	}

	/* Apply different alignment for scrollable containers */
	.beat-frame-container.scrollable-active {
		/* Align to top when scrolling is needed */
		align-items: flex-start;
		justify-content: stretch; /* Stretch content to fill available width */
		/* Add padding to ensure content isn't cut off */
		padding: 10px 5px;
	}

	/* Fullscreen mode styles */
	.beat-frame-container.fullscreen-mode {
		height: 100%;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: visible;
		margin: 0;
		padding: 20px;
		box-sizing: border-box;
	}
</style>
