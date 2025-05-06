<!-- src/lib/components/SequenceWorkbench/ToolsPanel/ToolsPanel.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { fly } from 'svelte/transition';
    import ButtonsContainer from '../ButtonPanel/components/ButtonsContainer.svelte';
    import type { ButtonDefinition, ActionEventDetail } from '../ButtonPanel/types';
  
    // Props
    export let buttons: ButtonDefinition[] = [];
    
    // Event dispatcher
    const dispatch = createEventDispatcher<{
      action: ActionEventDetail;
      close: void;
    }>();
  
    // Forward button click events
    function handleButtonClick(event: CustomEvent<ActionEventDetail>) {
      dispatch('action', event.detail);
    }
  
    // Close tools panel
    function handleClose() {
      dispatch('close');
    }
  </script>
  
  <div class="tools-panel" transition:fly={{ y: 20, duration: 300 }}>
    <div class="tools-header">
      <h2>Sequence Tools</h2>
      <button 
        class="close-button" 
        on:click={handleClose}
        aria-label="Close tools panel"
      >
        ✕
      </button>
    </div>
  
    <div class="tools-content">
      <ButtonsContainer 
        {buttons} 
        buttonSize={55} 
        layout="horizontal" 
        on:action={handleButtonClick} 
      />
    </div>
  </div>
  
  <style>
    .tools-panel {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: white;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }
  
    .tools-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px;
      background: linear-gradient(135deg, #6a11cb, #2575fc);
      color: white;
    }
  
    .tools-header h2 {
      margin: 0;
      font-size: 1.2rem;
    }
  
    .close-button {
      background: rgba(255, 255, 255, 0.3);
      border: none;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      color: white;
      font-weight: bold;
      transition: all 0.2s ease;
    }
  
    .close-button:hover {
      background: rgba(255, 255, 255, 0.5);
      transform: scale(1.1);
    }
  
    .tools-content {
      flex: 1;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow-y: auto;
    }
  
    /* Make buttons container fill the available space */
    :global(.tools-panel .buttons-wrapper) {
      width: 100%;
      height: 100%;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
    }
  </style>