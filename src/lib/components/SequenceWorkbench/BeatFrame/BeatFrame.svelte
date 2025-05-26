<script lang="ts">
	import type { BeatFrameLayoutOptions } from '$lib/types/BeatFrameLayoutOptions';
	import type { BeatData as LegacyBeatData } from './BeatData';
	import BeatFrameStateManager from './managers/BeatFrameStateManager.svelte';
	import BeatFrameLayoutManager from './managers/BeatFrameLayoutManager.svelte';
	import BeatFrameElementManager from './managers/BeatFrameElementManager.svelte';
	import BeatFrameGrid from './components/BeatFrameGrid.svelte';
	import { useResizeObserver } from '$lib/composables/useResizeObserver.svelte';
	import { browser } from '$app/environment';

	// Props using Svelte 5 runes
	const {
		isScrollable = $bindable(false),
		layoutOverride = $bindable(null),
		elementReceiver = $bindable<(element: HTMLElement | null) => void>(() => {}),
		fullScreenMode = $bindable(false),
		onnaturalheightchange,
		onbeatselected
	} = $props<{
		isScrollable?: boolean;
		layoutOverride?: BeatFrameLayoutOptions | null;
		elementReceiver?: (element: HTMLElement | null) => void;
		fullScreenMode?: boolean;
		onnaturalheightchange?: (event: CustomEvent) => void;
		onbeatselected?: (event: CustomEvent) => void;
	}>();

	// Set up resize observer for container dimensions
	const { resizeObserver } = useResizeObserver({
		width: browser ? window.innerWidth : 800,
		height: browser ? window.innerHeight : 600
	});

	// Container element reference
	let beatFrameContainerRef = $state<HTMLElement | null>(null);

	// Manager component references
	let stateManager = $state<any>();
	let layoutManager = $state<any>();
	let elementManager = $state<any>();

	// Reactive state derived from managers
	let stateData = $state<any>({});
	let layoutInfo = $state<any>({});

	// Event handlers for manager events
	function handleNaturalHeightChange(event: CustomEvent) {
		// Call the callback prop if provided
		if (onnaturalheightchange) {
			onnaturalheightchange(event);
		}

		// Re-dispatch the event to maintain the external API for backward compatibility
		const customEvent = new CustomEvent('naturalheightchange', {
			detail: event.detail,
			bubbles: true
		});
		beatFrameContainerRef?.dispatchEvent(customEvent);
	}

	function handleBeatSelected(event: CustomEvent) {
		// Call the callback prop if provided
		if (onbeatselected) {
			onbeatselected(event);
		}

		// Re-dispatch the event to maintain the external API for backward compatibility
		const customEvent = new CustomEvent('beatselected', {
			detail: event.detail,
			bubbles: true
		});
		beatFrameContainerRef?.dispatchEvent(customEvent);
	}

	// Update state from managers
	$effect(() => {
		if (stateManager) {
			stateData = stateManager.getState();
		}
	});

	$effect(() => {
		if (layoutManager) {
			layoutInfo = layoutManager.getLayoutInfo();
		}
	});

	// Public API methods that delegate to the state manager
	export function addBeat(beatData: LegacyBeatData) {
		return stateManager?.addBeat(beatData);
	}

	export function clearBeats() {
		return stateManager?.clearBeats();
	}

	export function testPersistence() {
		return stateManager?.testPersistence();
	}
</script>

<!-- Manager Components -->
<BeatFrameStateManager bind:this={stateManager} on:beatselected={handleBeatSelected} />

<BeatFrameLayoutManager
	bind:this={layoutManager}
	beatCount={stateData.beatCount || 0}
	containerRef={beatFrameContainerRef}
	{isScrollable}
	{layoutOverride}
	{fullScreenMode}
	on:naturalheightchange={handleNaturalHeightChange}
/>

<BeatFrameElementManager
	bind:this={elementManager}
	containerRef={beatFrameContainerRef}
	{elementReceiver}
/>

<!-- Main Container -->
<div
	use:resizeObserver
	class="beat-frame-container"
	class:scrollable-active={isScrollable}
	class:fullscreen-mode={fullScreenMode}
	bind:this={beatFrameContainerRef}
>
	{#if stateData.beats && layoutInfo.beatRows}
		<BeatFrameGrid
			beats={stateData.beats}
			startPosBeatData={stateData.startPosBeatData}
			selectedBeatIndex={stateData.selectedBeatIndex}
			sequenceIsEmpty={stateData.sequenceIsEmpty}
			beatRows={layoutInfo.beatRows}
			beatCols={layoutInfo.beatCols}
			beatCount={stateData.beatCount}
			cellSize={layoutInfo.cellSize}
			onStartPosBeatClick={stateManager?.handleStartPosBeatClick}
			onBeatClick={stateManager?.handleBeatClick}
		/>
	{/if}
</div>

<style>
	.beat-frame-container {
		width: 100%;
		height: auto;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
		transition: all 0.3s ease-out;
		overflow: visible;
		margin: auto;
	}

	.beat-frame-container.scrollable-active {
		height: 100%;
		overflow-y: auto !important;
		overflow-x: hidden;
		scrollbar-width: thin;
		scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
		align-items: flex-start !important;
		padding-right: 8px;
		margin: 0;
	}

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

	.beat-frame-container.scrollable-active {
		align-items: flex-start;
		justify-content: center;
		padding: 10px 0;
	}

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
