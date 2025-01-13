<script lang="ts">
	export let grid: number[][];
	export let numBeats: number;
	export let size: { width: number; height: number };
  </script>
  
  <div class="grid" style="--grid-width: {size.width}px; --grid-height: {size.height}px;">
	{#each grid as row}
	  <div class="grid-row">
		{#each row as beat (beat)}
		  {#if beat <= numBeats}
			<div class="grid-cell">{beat}</div>
		  {/if}
		{/each}
	  </div>
	{/each}
  </div>
  
  <style>
	.grid {
	  display: flex;
	  flex-direction: column;
	  gap: 5px;
	  width: var(--grid-width);
	  height: var(--grid-height);
	}
  
	.grid-row {
	  display: flex;
	  gap: 5px;
	}
  
	.grid-cell {
	  flex: 1;
	  aspect-ratio: 1;
	  display: flex;
	  align-items: center;
	  justify-content: center;
	  background: #f0f0f0;
	  border: 1px solid #ccc;
	  border-radius: 5px;
	}
  </style>
  