<script lang="ts">
  import SequenceWidget from './SequenceWidget/SequenceWidget.svelte';
  import GraphEditor from './GraphEditor/GraphEditor.svelte';
  import GraphEditorToggleTab from './GraphEditor/GraphEditorToggleTab.svelte';

  let isExpanded = false;
  const animationDuration = 300; // Animation duration in milliseconds
  const maxEditorHeight = 300;

  const toggleGraphEditor = () => {
    isExpanded = !isExpanded;
  };
</script>

<div class="sequence-workbench">
  <SequenceWidget
  />

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
  .sequence-workbench {
    /* position: relative; */
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }
</style>
