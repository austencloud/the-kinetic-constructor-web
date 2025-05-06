<!-- src/lib/components/SequenceWorkbench/ToolsButton.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
  
    // Props
    export let isToolsPanelOpen = false;
  
    // Event dispatcher
    const dispatch = createEventDispatcher<{
      toggleToolsPanel: void;
    }>();
  
    // Handle click event
    function handleClick() {
      dispatch('toggleToolsPanel');
    }
  </script>
  
  <button 
    class="tools-button ripple" 
    on:click={handleClick}
    aria-label={isToolsPanelOpen ? "Close Tools Panel" : "Open Tools Panel"}
    aria-expanded={isToolsPanelOpen}
    data-mdb-ripple="true"
    data-mdb-ripple-color="light"
  >
    <span class="tools-emoji">🛠️</span>
    <span class="tools-text">Tools</span>
  </button>
  
  <style>
    .tools-button {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 10;
      background: white;
      border: 2px solid #3a7bd5;
      border-radius: 20px;
      padding: 5px 15px;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease-in-out;
      font-size: 14px;
      font-weight: bold;
      color: #333;
    }
  
    .tools-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      background: #3a7bd5;
      color: white;
    }
  
    .tools-button:active {
      transform: scale(0.95);
    }
  
    .tools-emoji {
      font-size: 1.2em;
    }
  </style>