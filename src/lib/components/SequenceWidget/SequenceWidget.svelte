<script lang="ts">
  import SequenceWidgetButtonPanel from './ButtonPanel/SequenceWidgetButtonPanel.svelte';
  import GraphEditor from './GraphEditor/GraphEditor.svelte';
  import GraphEditorToggleTab from './GraphEditor/GraphEditorToggleTab.svelte';

  let isExpanded = false;
  const animationDuration = 300; // Animation duration in milliseconds
  const maxEditorHeight = 300;

  const toggleGraphEditor = () => {
    isExpanded = !isExpanded;
  };
</script>

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
      <SequenceWidgetButtonPanel
      />
    </div>
  </div>

  <!-- GraphEditorToggleTab -->
  <GraphEditorToggleTab
    isExpanded={isExpanded}
    {animationDuration}
    graphEditorHeight={isExpanded ? maxEditorHeight : 0}
    on:click={toggleGraphEditor}
  />

  <!-- GraphEditor -->
  <GraphEditor
    isExpanded={isExpanded}
    {animationDuration}
    maxEditorHeight={maxEditorHeight}
  />
</div>

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
    color: white;
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
