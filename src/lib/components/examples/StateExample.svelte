<script lang="ts">
  import { onMount } from 'svelte';
  import { appSelectors, appActions } from '$lib/state/machines/appMachine';
  import { sequenceStore } from '$lib/state/stores/sequenceStore';
  import { initializeStateManagement } from '$lib/state';
  
  // Initialize state management
  onMount(() => {
    initializeStateManagement();
  });
  
  // Get state from machines and stores
  $: isLoading = appSelectors.isLoading();
  $: currentTab = appSelectors.currentTab();
  $: sequence = $sequenceStore;
  
  // Event handlers
  function handleChangeTab(tab: number) {
    appActions.changeTab(tab);
  }
  
  function handleAddBeat() {
    sequenceStore.addBeat({
      id: crypto.randomUUID(),
      number: sequence.beats.length + 1
    });
  }
</script>

<div class="state-example">
  <h2>State Management Example</h2>
  
  {#if isLoading}
    <div class="loading">Loading...</div>
  {:else}
    <div class="tabs">
      <button 
        class:active={currentTab === 0} 
        on:click={() => handleChangeTab(0)}
      >
        Tab 1
      </button>
      <button 
        class:active={currentTab === 1} 
        on:click={() => handleChangeTab(1)}
      >
        Tab 2
      </button>
      <button 
        class:active={currentTab === 2} 
        on:click={() => handleChangeTab(2)}
      >
        Tab 3
      </button>
    </div>
    
    <div class="content">
      <h3>Current Tab: {currentTab}</h3>
      
      <div class="sequence">
        <h4>Sequence ({sequence.beats.length} beats)</h4>
        
        <div class="beats">
          {#each sequence.beats as beat (beat.id)}
            <div class="beat">
              Beat {beat.number}
            </div>
          {/each}
        </div>
        
        <button on:click={handleAddBeat}>Add Beat</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .state-example {
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 5px;
    margin: 20px;
  }
  
  .loading {
    padding: 20px;
    text-align: center;
    font-style: italic;
  }
  
  .tabs {
    display: flex;
    margin-bottom: 20px;
  }
  
  .tabs button {
    padding: 10px 20px;
    margin-right: 5px;
    border: 1px solid #ccc;
    background: #f5f5f5;
    cursor: pointer;
  }
  
  .tabs button.active {
    background: #007bff;
    color: white;
    border-color: #0056b3;
  }
  
  .content {
    padding: 20px;
    border: 1px solid #eee;
    border-radius: 5px;
  }
  
  .beats {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .beat {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    background: #f9f9f9;
  }
  
  button {
    padding: 8px 16px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:hover {
    background: #0056b3;
  }
</style>
