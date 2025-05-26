<!-- src/lib/components/SequenceWorkbench/BeatFrame/BeatFrameComposable.svelte -->
<script lang="ts">
	import type { BeatFrameLayoutOptions } from '$lib/types/BeatFrameLayoutOptions';
	import type { BeatData as LegacyBeatData } from './BeatData';
	import BeatFrameGrid from './components/BeatFrameGrid.svelte';
	import { useResizeObserver } from '$lib/composables/useResizeObserver.svelte';
	import { browser } from '$app/environment';
	import { useBeatFrameState } from './composables/useBeatFrameState.svelte';
	import { useBeatFrameLayout } from './composables/useBeatFrameLayout.svelte';
	import { setContext } from 'svelte';
	import { BEAT_FRAME_CONTEXT_KEY } from '../context/ElementContext';

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

	// Set up resize observer for container dimensions
	const { size: sizeStore, resizeObserver } = useResizeObserver({
		width: browser ? window.innerWidth : 800,
		height: browser ? window.innerHeight : 600
	});

	const size = $derived({
		width: sizeStore?.width || 0,
		height: sizeStore?.height || 0
	});

	// Container element reference
	let beatFrameContainerRef = $state<HTMLElement | null>(null);

	// Use composables for state and layout management
	const stateManager = useBeatFrameState();

	// Create layout manager reactively - it will update when dependencies change
	const layoutManager = $derived(
		useBeatFrameLayout(stateManager.beatCount, beatFrameContainerRef, size)
	);

	// Create a derived value for scrollable state that can be used internally
	// Note: We use shouldScroll internally instead of directly modifying isScrollable
	// because bindable props are constants and cannot be assigned to directly.
	// The parent component can observe layout changes through events if needed.
	const shouldScroll = $derived(layoutManager?.contentOverflows || false);

	// Element management
	$effect(() => {
		if (beatFrameContainerRef) {
			// Set context for other components
			setContext(BEAT_FRAME_CONTEXT_KEY, {
				getElement: () => beatFrameContainerRef
			});

			// Store in global variables for fallback
			if (browser) {
				(window as any).__beatFrameElementRef = beatFrameContainerRef;
				(window as any).__pendingBeatFrameElement = beatFrameContainerRef;
			}

			// Call element receiver
			if (typeof elementReceiver === 'function') {
				try {
					elementReceiver(beatFrameContainerRef);
				} catch (error) {
					console.error('BeatFrame: Error calling elementReceiver:', error);
				}
			}

			// Dispatch element available event
			if (browser) {
				const event = new CustomEvent('beatframe-element-available', {
					bubbles: true,
					detail: { element: beatFrameContainerRef }
				});
				document.dispatchEvent(event);
			}
		}
	});

	// Public API methods
	export function addBeat(beatData: LegacyBeatData) {
		return stateManager.addBeat(beatData);
	}

	export function clearBeats() {
		return stateManager.clearBeats();
	}

	export function testPersistence() {
		return stateManager.testPersistence();
	}
</script>

<!-- Main Container -->
<div
	use:resizeObserver
	class="beat-frame-container"
	class:scrollable-active={shouldScroll}
	class:fullscreen-mode={fullScreenMode}
	bind:this={beatFrameContainerRef}
>
	<BeatFrameGrid
		beats={stateManager.beats}
		startPosBeatData={stateManager.startPosBeatData}
		selectedBeatIndex={stateManager.selectedBeatIndex}
		sequenceIsEmpty={stateManager.sequenceIsEmpty}
		beatRows={layoutManager.beatRows}
		beatCols={layoutManager.beatCols}
		beatCount={stateManager.beatCount}
		cellSize={layoutManager.cellSize}
		onStartPosBeatClick={stateManager.handleStartPosBeatClick}
		onBeatClick={stateManager.handleBeatClick}
	/>
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
