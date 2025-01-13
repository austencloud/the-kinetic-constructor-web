<script lang="ts">
  import GraphEditorPictographContainer from './GraphEditorPictographContainer.svelte';
  import TurnsBox from './TurnsBox/TurnsBox.svelte';

  export let isExpanded: boolean;
  export let animationDuration: number;

  const maxEditorHeight = 300; // Fixed height for the GraphEditor
</script>

<div
  class="graph-editor"
  style="--animation-duration: {animationDuration}ms; height: {isExpanded
    ? maxEditorHeight + 'px'
    : '0px'};"
>
  <div class="turns-box">
    <TurnsBox color="blue" />
  </div>
  <div
    class="pictograph-container"
    style="width: {maxEditorHeight}px; height: {maxEditorHeight}px;"
  >
    <GraphEditorPictographContainer maxHeight={maxEditorHeight} />
  </div>
  <div class="turns-box">
    <TurnsBox color="red" />
  </div>
</div>

<style>
  .graph-editor {
    position: relative;
    background-color: #f4f4f4;
    border-top: 2px solid #ccc;
    overflow: hidden;
    width: 100%;
    transition: height var(--animation-duration) ease-in-out;
    display: flex;
    flex-direction: row;
    align-items: stretch; /* Ensures children stretch vertically */
    justify-content: space-between;
    height: 100%;
  }

  .turns-box {
    flex: 1; /* Allow TurnsBox to grow and fill the remaining width */
    display: flex;
    flex-direction: column;
    align-items: stretch; /* Ensure full height stretching */
    justify-content: stretch;
    height: 100%; /* Full height of the parent GraphEditor */
    min-width: 0; /* Prevent content overflow issues */
  }

  .pictograph-container {
    flex: 0 0 auto; /* Prevent resizing of the PictographContainer */
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: 0; /* Prevent content overflow issues */
  }
</style>
