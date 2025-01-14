<script lang="ts">
    import { onMount } from 'svelte';
  
    export let pictographData: any;
    export let gridMode: 'diamond' | 'box' = 'diamond';
  
    const gridSize = 650;
    let svgUrl: string = `/static/${gridMode}_grid.svg`;
  
    let arrowPositions: { x: number; y: number; type: string }[] = [];
  
    const loadArrowPositions = () => {
      if (!pictographData) return;
  
      const { blue_attributes, red_attributes } = pictographData;
      arrowPositions = [
        { x: 325, y: 500, type: 'blue' }, // Example logic for blue arrow
        { x: 500, y: 325, type: 'red' },  // Example logic for red arrow
      ];
  
      // Extend with dynamic placement based on `pictographData`
      // Adjust the `x` and `y` positions dynamically based on the actual logic.
    };
  
    onMount(() => {
      loadArrowPositions();
    });
  </script>
  
  <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${gridSize} ${gridSize}`} class="pictograph">
    <image href={svgUrl} width={gridSize} height={gridSize} />
    {#each arrowPositions as { x, y, type }}
      <circle cx={x} cy={y} r="10" fill={type === 'blue' ? 'blue' : 'red'} />
    {/each}
  </svg>
  
  <style>
    .pictograph {
      border: 1px solid black;
      width: 100%;
      height: auto;
    }
  </style>
  