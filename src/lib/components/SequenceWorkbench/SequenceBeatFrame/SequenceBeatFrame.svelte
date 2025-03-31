<!-- src/lib/components/SequenceWorkbench/SequenceBeatFrame/SequenceBeatFrame.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import StartPosBeat from './StartPosBeat.svelte';
	import Beat from './Beat.svelte';
	import SelectionOverlay from './SelectionOverlay.svelte';
	import ReversalGlyph from './ReversalGlyph.svelte';
	import BeatNumberLabel from './BeatNumberLabel.svelte';
	
	import { beatsStore, selectedBeatIndexStore, addBeat, selectBeat } from '$lib/stores/beatsStore';
	import { selectedStartPos } from '$lib/stores/constructStores';
	import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';
	import { applyLayout, autoAdjustLayout, calculateCellSize } from './beatFrameHelpers';
	import type { BeatData } from './BeatData';
	import type { PictographData } from '$lib/types/PictographData';

	// Create a writable for starting position
	let startPosBeatData: BeatData = {
		beatNumber: 0,
		filled: false,
		pictographData: defaultPictographData
	};
	
	// Subscribe to the selectedStartPos store to update our local beat data
	selectedStartPos.subscribe(newStartPos => {
		if (newStartPos) {
			startPosBeatData = {
				...startPosBeatData,
				filled: true,
				pictographData: newStartPos
			};
		}
	});

	// Element references and size variables
	let frameElement: HTMLElement;
	let frameWidth = 0;
	let frameHeight = 0;
	let cellSize = 50;
	let gap = 10;
	
	// Grid layout variables
	let beatRows = 1;
	let beatCols = 1;
	
	// Handle resize of the frame container
	function onResize(width: number, height: number) {
		frameWidth = width;
		frameHeight = height;
		updateCellSize();
	}
	
	// Update the element size when available
	onMount(() => {
		if (frameElement) {
			const rect = frameElement.getBoundingClientRect();
			frameWidth = rect.width;
			frameHeight = rect.height;
			updateCellSize();
		}
	});
	
	// Reactive updates to layout based on beat count
	$: {
		[beatRows, beatCols] = applyLayout({}, $beatsStore.length, autoAdjustLayout($beatsStore.length));
		updateCellSize();
	}
	
	// Calculate the cell size based on container dimensions and grid layout
	function updateCellSize() {
		if (frameWidth > 0 && frameHeight > 0) {
			cellSize = calculateCellSize(frameWidth, frameHeight, beatRows, beatCols, gap);
		}
	}
	
	// Handle beat click events
	function handleStartPosBeatClick() {
		// For start position, we might want different behavior
		// For now, just add a new beat like the original code did
		addBeat();
	}
	
	function handleBeatClick(beatIndex: number) {
		// Select the beat when clicked
		selectBeat(beatIndex);
	}
	
	// Use a resize observer to track container size changes
	function resizeObserver(node: HTMLElement) {
		const observer = new ResizeObserver(entries => {
			for (const entry of entries) {
				onResize(entry.contentRect.width, entry.contentRect.height);
			}
		});
		
		observer.observe(node);
		
		return {
			destroy() {
				observer.disconnect();
			}
		};
	}
</script>

<div
	bind:this={frameElement}
	use:resizeObserver
	class="beat-frame"
	style="--total-rows: {beatRows}; --total-cols: {beatCols}; --gap: {gap}px; --cell-size: {cellSize}px;"
>
	<!-- Start Position Beat -->
	<div class="beat-container start-position">
		<StartPosBeat 
			beatData={startPosBeatData}
			onClick={handleStartPosBeatClick}
		/>
	</div>

	<!-- Regular Beats -->
	{#each $beatsStore as beat, index (beat.beatNumber)}
		<div 
			class="beat-container" 
			class:selected={$selectedBeatIndexStore === index}
		>
			<Beat 
				{beat}
				onClick={() => handleBeatClick(index)} 
			/>
			
			<!-- Show beat number -->
			<div class="beat-number">
				<BeatNumberLabel 
					beatNumber={beat.beatNumber} 
					duration={beat.duration || 1} 
				/>
			</div>
			
			<!-- Show reversals if any -->
			{#if beat.metadata?.blueReversal || beat.metadata?.redReversal}
				<div class="reversal-indicator">
					<ReversalGlyph 
						blueReversal={beat.metadata?.blueReversal || false} 
						redReversal={beat.metadata?.redReversal || false} 
					/>
				</div>
			{/if}
			
			<!-- Selection overlay -->
			<SelectionOverlay isSelected={$selectedBeatIndexStore === index} />
		</div>
	{/each}
</div>

<style>
	.beat-frame {
		display: grid;
		grid-template-columns: repeat(var(--total-cols), var(--cell-size));
		grid-template-rows: repeat(var(--total-rows), var(--cell-size));
		gap: var(--gap);
		justify-content: center;
		align-content: center;
		width: 100%;
		height: 100%;
	}
	
	.beat-container {
		position: relative;
		width: var(--cell-size);
		height: var(--cell-size);
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	.start-position {
		grid-column: 1;
		grid-row: 1;
	}
	
	.beat-number {
		position: absolute;
		top: 5px;
		left: 5px;
		z-index: 2;
	}
	
	.reversal-indicator {
		position: absolute;
		bottom: 5px;
		right: 5px;
		z-index: 2;
	}
	
	.selected {
		/* Any additional styling for selected beats */
	}
</style>