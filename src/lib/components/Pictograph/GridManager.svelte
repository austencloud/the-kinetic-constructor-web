<script lang="ts">
    export let gridMode: "diamond" | "box"; // Determines which grid SVG to render
  
    let svgPath = "";
    $: svgPath = `/static/images/grid/${gridMode}_grid.svg`;
  
    // Fallback grid in case of issues loading the SVG
    let errorLoadingGrid = false;
  
    const handleLoadError = () => {
      console.error(`Failed to load grid SVG at ${svgPath}`);
      errorLoadingGrid = true;
    };
  </script>
  
  <div class="grid-container">
    {#if !errorLoadingGrid}
      <img src={svgPath} alt={`${gridMode} grid`} on:error={handleLoadError} />
    {:else}
      <div class="fallback-grid">
        <p>Grid failed to load.</p>
      </div>
    {/if}
  </div>
  
  <style>
    .grid-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      position: relative;
    }
  
    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  
    .fallback-grid {
      display: flex;
      justify-content: center;
      align-items: center;
      background: #eee;
      width: 650px;
      height: 650px;
      border: 2px dashed #ccc;
    }
  </style>
  