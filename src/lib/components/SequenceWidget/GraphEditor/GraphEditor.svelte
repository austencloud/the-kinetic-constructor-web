<script lang="ts">
  import GraphEditorPictographContainer from "./GraphEditorPictographContainer.svelte";
  import TurnsBox from "./TurnsBox/TurnsBox.svelte";

  export let isExpanded: boolean;
  const maxEditorHeight = 300;
</script>

<style>
  .graph-editor {
    position: relative;
    background-color: #f4f4f4;
    border-top: 2px solid #ccc;
    overflow: hidden;
    width: 100%;
    transition: height 0.3s ease-in-out, opacity 0.3s ease-in-out;
  }

  .main-layout {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    height: 100%;
  }

  .turns-box {
    flex: 1;
    display: flex;
  }
</style>

<div
  class="graph-editor"
  style="height: {isExpanded ? maxEditorHeight + 'px' : '0px'}; opacity: {isExpanded ? 1 : 0};"
>
  <div class="main-layout">
    <div class="turns-box">
      <TurnsBox color="blue" />
    </div>
    <GraphEditorPictographContainer maxHeight={maxEditorHeight} />
    <div class="turns-box">
      <TurnsBox color="red" />
    </div>
  </div>
</div>
