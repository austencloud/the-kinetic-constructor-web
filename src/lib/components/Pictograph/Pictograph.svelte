<script lang="ts">
    import { onMount } from 'svelte';
    import Grid from './Grid/Grid.svelte';
    import Arrow from './Arrow/Arrow.svelte';
    import Prop from './Prop/Prop.svelte';
    import PictographInitializer from './PictographInitializer.svelte';
  
    export let pictographData: any; // Data defining the pictograph layout
    export let settings: any; // Configuration settings
  
    let grid: any = null;
    let arrows: any[] = [];
    let props: any[] = [];
  
    // Listen to updates from PictographInitializer
    let onGridUpdate = (event: CustomEvent) => {
      grid = event.detail;
    };
  
    let onArrowsUpdate = (event: CustomEvent) => {
      arrows = event.detail;
    };
  
    let onPropsUpdate = (event: CustomEvent) => {
      props = event.detail;
    };
  </script>
  
  <!-- Use PictographInitializer as a child component -->
  <PictographInitializer
    {pictographData}
    {settings}
    on:gridUpdate={onGridUpdate}
    on:arrowsUpdate={onArrowsUpdate}
    on:propsUpdate={onPropsUpdate}
  />
  
  <div class="pictograph">
    {#if grid}
      <Grid {grid} />
    {/if}
    {#each arrows as arrow (arrow.id)}
      <Arrow {arrow} />
    {/each}
    {#each props as prop (prop.id)}
      <Prop {prop} />
    {/each}
  </div>
  
  <style>
    .pictograph {
      position: relative;
      width: 100%;
      height: 100%;
    }
  </style>
  