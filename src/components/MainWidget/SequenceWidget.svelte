<script>
    import GraphEditor from './GraphEditor.svelte';
    import GraphEditorToggleTab from './GraphEditorToggleTab.svelte';
    import SequenceWidgetButtonPanel from './ButtonPanel/SequenceWidgetButtonPanel.svelte';
    let isGraphEditorExpanded = false;
  </script>
  
  <style>
    .sequenceWidgetContainer {
      position: relative;
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }
  
    .sequenceWidget {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
  
    .sequenceWidgetLabels {
      display: flex;
      justify-content: space-around;
      padding: 10px;
    }
  
    .sequenceWidgetMain {
      display: flex;
      flex-direction: row;
      flex: 1;
    }
  
    .scrollArea {
      flex: 10;
      overflow-y: auto;
      padding: 10px;
    }
  </style>
  
  <div class="sequenceWidgetContainer">
    <div class="sequenceWidget">
      <div class="sequenceWidgetLabels">
        <div>Indicator Label</div>
        <div>Current Word</div>
        <div>Difficulty</div>
      </div>
  
      <div class="sequenceWidgetMain">
        <div class="scrollArea">Scroll Area</div>
        <SequenceWidgetButtonPanel />
      </div>
    </div>
  
    <GraphEditorToggleTab
      on:toggle={() => (isGraphEditorExpanded = !isGraphEditorExpanded)}
      isExpanded={isGraphEditorExpanded}
    />
  
    <GraphEditor isExpanded={isGraphEditorExpanded} />
  </div>
  