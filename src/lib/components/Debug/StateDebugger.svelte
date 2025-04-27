<!--
  State Debugger Component
  
  This component displays the current state of the application.
  It's useful for debugging and development.
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { stateRegistry } from '$lib/state/core';
  import { get } from 'svelte/store';
  
  // Props
  export let open = false;
  
  // State
  let containers: ReturnType<typeof stateRegistry.getAll> = [];
  let selectedContainer: string | null = null;
  let containerValues: Record<string, any> = {};
  let updateInterval: ReturnType<typeof setInterval> | null = null;
  
  // Update containers and their values
  function updateContainers() {
    containers = stateRegistry.getAll();
    
    // Update values for all containers
    containers.forEach(container => {
      if (container.type === 'store') {
        containerValues[container.id] = get(container.instance);
      } else if (container.type === 'machine') {
        containerValues[container.id] = container.instance.getSnapshot();
      }
    });
    
    // If no container is selected, select the first one
    if (!selectedContainer && containers.length > 0) {
      selectedContainer = containers[0].id;
    }
  }
  
  // Format value for display
  function formatValue(value: any): string {
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return `[Error formatting value: ${error}]`;
    }
  }
  
  // Get container type label
  function getTypeLabel(type: string): string {
    return type === 'machine' ? 'State Machine' : 'Store';
  }
  
  // Lifecycle
  onMount(() => {
    // Initial update
    updateContainers();
    
    // Set up interval to update values
    updateInterval = setInterval(updateContainers, 1000);
  });
  
  onDestroy(() => {
    // Clean up interval
    if (updateInterval) {
      clearInterval(updateInterval);
    }
  });
  
  // Toggle debugger
  function toggleDebugger() {
    open = !open;
  }
  
  // Reset state
  function resetState() {
    if (confirm('Are you sure you want to reset all state?')) {
      stateRegistry.clear();
      updateContainers();
    }
  }
  
  // Persist state
  function persistState() {
    stateRegistry.persistState();
    alert('State persisted to localStorage');
  }
</script>

<div class="state-debugger" class:open>
  <button class="toggle-button" on:click={toggleDebugger}>
    {open ? 'Close' : 'Debug State'}
  </button>
  
  {#if open}
    <div class="debugger-content">
      <div class="header">
        <h2>State Debugger</h2>
        <div class="actions">
          <button on:click={resetState} class="danger">Reset All</button>
          <button on:click={persistState}>Persist</button>
          <button on:click={updateContainers}>Refresh</button>
        </div>
      </div>
      
      <div class="container-list">
        <h3>State Containers ({containers.length})</h3>
        <ul>
          {#each containers as container}
            <li 
              class:selected={selectedContainer === container.id}
              on:click={() => selectedContainer = container.id}
            >
              <span class="container-name">{container.id}</span>
              <span class="container-type">{getTypeLabel(container.type)}</span>
              {#if container.persist}
                <span class="persist-badge">Persisted</span>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
      
      <div class="container-details">
        {#if selectedContainer}
          {#if containerValues[selectedContainer]}
            <h3>
              {selectedContainer}
              <span class="type-badge">
                {getTypeLabel(containers.find(c => c.id === selectedContainer)?.type || 'unknown')}
              </span>
            </h3>
            <pre>{formatValue(containerValues[selectedContainer])}</pre>
          {:else}
            <p>No data available for this container.</p>
          {/if}
        {:else}
          <p>Select a container to view its state.</p>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .state-debugger {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    font-family: monospace;
  }
  
  .toggle-button {
    background: #333;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .debugger-content {
    position: fixed;
    bottom: 60px;
    right: 20px;
    width: 80vw;
    max-width: 1200px;
    height: 80vh;
    background: #1e1e1e;
    color: #eee;
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .header {
    padding: 12px 16px;
    background: #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #555;
  }
  
  .header h2 {
    margin: 0;
    font-size: 18px;
  }
  
  .actions {
    display: flex;
    gap: 8px;
  }
  
  .actions button {
    background: #444;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .actions button.danger {
    background: #a33;
  }
  
  .actions button:hover {
    background: #555;
  }
  
  .actions button.danger:hover {
    background: #c33;
  }
  
  .container-list {
    width: 250px;
    border-right: 1px solid #444;
    overflow-y: auto;
    padding: 12px;
  }
  
  .container-list h3 {
    margin-top: 0;
    font-size: 16px;
    color: #aaa;
  }
  
  .container-list ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .container-list li {
    padding: 8px 12px;
    margin-bottom: 4px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
  }
  
  .container-list li:hover {
    background: #333;
  }
  
  .container-list li.selected {
    background: #2a5d8a;
  }
  
  .container-name {
    font-weight: bold;
  }
  
  .container-type {
    font-size: 12px;
    color: #aaa;
  }
  
  .persist-badge {
    font-size: 10px;
    background: #2a5d8a;
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    margin-top: 4px;
    align-self: flex-start;
  }
  
  .container-details {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
  }
  
  .container-details h3 {
    margin-top: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .type-badge {
    font-size: 12px;
    background: #444;
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    font-weight: normal;
  }
  
  .container-details pre {
    background: #252525;
    padding: 12px;
    border-radius: 4px;
    overflow: auto;
    margin: 0;
  }
  
  @media (min-width: 768px) {
    .debugger-content {
      flex-direction: row;
    }
  }
</style>
