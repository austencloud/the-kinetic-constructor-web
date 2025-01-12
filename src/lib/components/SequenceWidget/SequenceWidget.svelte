<script>
  import SequenceWidgetButtonPanel from "./ButtonPanel/SequenceWidgetButtonPanel.svelte";

  let isGraphEditorExpanded = false;
  let graphEditorHeight = 0;

  const toggleGraphEditor = () => {
    isGraphEditorExpanded = !isGraphEditorExpanded;
    graphEditorHeight = isGraphEditorExpanded ? 300 : 0;
  };
</script>

<style>
  .sequence-widget-container {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .sequence-widget {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .sequence-widget-main {
    display: flex;
    flex-direction: row;
    flex: 1;
  }

  .sequence-widget-labels {
    display: flex;
    justify-content: space-around;
    padding: 10px;
  }

  .scroll-area {
    flex: 10;
    overflow-y: auto;
    padding: 10px;
  }
</style>

<div class="sequence-widget-container">
  <div class="sequence-widget">
    <!-- Labels -->
    <div class="sequence-widget-labels">
      <div>Indicator Label</div>
      <div>Current Word</div>
      <div>Difficulty</div>
    </div>

    <!-- Main Content Area -->
    <div class="sequence-widget-main">
      <div class="scroll-area">Scroll Area</div>
      <SequenceWidgetButtonPanel />
    </div>
  </div>

  <!-- GraphEditor Toggle Tab -->
  <button
    on:click={toggleGraphEditor}
    style="cursor: pointer; text-align: center; padding: 10px; background: lightgray; border: none; width: 100%;"
    aria-expanded={isGraphEditorExpanded}
  >
    {isGraphEditorExpanded ? "Collapse Editor ▲" : "Expand Editor ▼"}
  </button>

  <!-- GraphEditor (placeholder) -->
  <div
    style="background: #f4f4f4; border-top: 2px solid #ccc; height: {graphEditorHeight}px; transition: height 0.3s ease-in-out;"
  ></div>
</div>
