<script lang="ts">
    import { onMount } from "svelte";
    import GridManager from "./GridManager.svelte";
  
    export let gridMode: "diamond" | "box" = "diamond";
    export const pictographData: any = {}; // Placeholder until further data is introduced.
  
    let container: HTMLDivElement | null = null;
  
    onMount(() => {
      if (container) {
        console.log("Pictograph container mounted.");
        // Additional logic can be added for lifecycle interactions
      }
    });
  </script>
  
  <div bind:this={container} class="pictograph-container">
    <GridManager {gridMode} />
  </div>
  
  <style>
    .pictograph-container {
      position: relative;
      width: 650px;
      height: 650px;
      border: 1px solid #000; /* Debugging purposes */
      overflow: hidden;
    }
  </style>
  