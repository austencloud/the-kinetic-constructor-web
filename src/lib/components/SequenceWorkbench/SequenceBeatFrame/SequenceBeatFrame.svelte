<!-- src/lib/components/SequenceWorkbench/SequenceBeatFrame/SequenceBeatFrame.svelte -->
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { beatsStore, selectedBeatIndexStore } from '$lib/stores/beatsStore';
	import { selectedStartPos } from '$lib/stores/constructStores';
	import { defaultPictographData } from '$lib/components/Pictograph/utils/defaultPictographData';
	import { sequenceActions } from '$lib/stores/sequenceActions';
	import { useResizeObserver } from '$lib/composables/useResizeObserver';
	import { autoAdjustLayout, calculateCellSize } from './beatFrameHelpers';
	
	// Components
	import StartPosBeat from './StartPosBeat.svelte';
	import Beat from './Beat.svelte';
	import SelectionOverlay from './SelectionOverlay.svelte';
	import ReversalGlyph from './ReversalGlyph.svelte';
	import BeatNumberLabel from './BeatNumberLabel.svelte';
	
	// Types
	import type { BeatData } from './BeatData';
	
	// Constants
	const GAP = 10; // Gap between cells in pixels
	
	// ===== Setup and state =====
	
	// Create a local beat data for the starting position
	$: startPosBeatData = $selectedStartPos ? {
	  beatNumber: 0,
	  filled: true,
	  pictographData: $selectedStartPos
	} : {
	  beatNumber: 0,
	  filled: false,
	  pictographData: defaultPictographData
	};
	
	// Use the resize observer hook to track container dimensions
	const { size, resizeObserver } = useResizeObserver({
	  width: window.innerWidth * 0.8,
	  height: window.innerHeight * 0.6
	});
	
	// Reactive layout calculations
	$: [beatRows, beatCols] = autoAdjustLayout($beatsStore.length);
	
	$: cellSize = calculateCellSize(
	  $size.width, 
	  $size.height, 
	  beatRows, 
	  beatCols, 
	  GAP
	);
	
	// ===== Event handlers =====
	
	function handleStartPosBeatClick() {
	  // Deselect any selected beat
	  sequenceActions.selectBeat(-1);
	  
	  // Dispatch custom event for selecting start position
	  const event = new CustomEvent('select-start-pos', {
		bubbles: true
	  });
	  document.dispatchEvent(event);
	}
	
	function handleBeatClick(beatIndex: number) {
	  sequenceActions.selectBeat(beatIndex);
	}
	
	// Ensure we've calculated layout before first render
	onMount(async () => {
	  await tick();
	});
  </script>
  
  <div
	use:resizeObserver
	class="beat-frame"
	style="--total-rows: {beatRows}; --total-cols: {beatCols}; --gap: {GAP}px; --cell-size: {cellSize}px;"
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
  </style>