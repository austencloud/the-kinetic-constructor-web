<!-- src/lib/components/SequenceWorkbench/ToolsPanel/ToolsPanel.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import type { ButtonDefinition, ActionEventDetail } from '../ButtonPanel/types';

  // Props
  export let buttons: ButtonDefinition[] = [];
  
  // Event dispatcher
  const dispatch = createEventDispatcher<{
    action: ActionEventDetail;
    close: void;
  }>();

  // Handle button click directly
  function handleToolClick(id: string) {
    dispatch('action', { id });
  }

  // Close tools panel
  function handleClose() {
    dispatch('close');
  }
  
  // Organize buttons in logical groups
  const topButtons = buttons.filter(b => ['viewFullScreen', 'saveImage', 'addToDictionary'].includes(b.id));
  const middleButtons = buttons.filter(b => ['mirrorSequence', 'swapColors', 'rotateSequence'].includes(b.id));
  const bottomButtons = buttons.filter(b => ['deleteBeat', 'clearSequence'].includes(b.id));
  const orderedButtons = [...topButtons, ...middleButtons, ...bottomButtons];

  let gridContainer: HTMLDivElement;
  let minButtonWidth = 120; // Starting point

  function updateGridLayout() {
    if (!gridContainer) return;
    
    const containerWidth = gridContainer.clientWidth;
    const containerHeight = gridContainer.clientHeight;
    const buttonCount = orderedButtons.length;
    
    // Calculate how many columns we can fit while keeping buttons square
    // and ensuring all buttons are visible without scrolling
    const maxColumns = Math.floor(containerWidth / minButtonWidth);
    const minRows = Math.ceil(buttonCount / maxColumns);
    const availableHeight = containerHeight - 24; // Account for padding
    
    // Calculate the maximum button size that will fit all buttons
    const maxButtonHeight = availableHeight / minRows;
    const maxButtonWidth = containerWidth / maxColumns;
    const buttonSize = Math.floor(Math.min(maxButtonHeight, maxButtonWidth));
    
    // Update grid template
    gridContainer.style.setProperty('--button-size', `${buttonSize}px`);
    gridContainer.style.setProperty('--icon-size', `${Math.max(24, buttonSize * 0.3)}px`);
    gridContainer.style.setProperty('--title-size', `${Math.max(11, buttonSize * 0.11)}px`);
  }

  onMount(() => {
    updateGridLayout();
    const resizeObserver = new ResizeObserver(updateGridLayout);
    if (gridContainer) {
      resizeObserver.observe(gridContainer);
    }
    return () => resizeObserver.disconnect();
  });
</script>

<div class="tools-panel" transition:fly={{ y: 20, duration: 300 }}>
  <div class="tools-header">
    <h2>Tools</h2>
    <button 
      class="close-button" 
      on:click={handleClose}
      aria-label="Close tools panel"
    >
      ✕
    </button>
  </div>

  <div class="tools-content">
    <div class="tools-grid" bind:this={gridContainer}>
      {#each orderedButtons as button}
        <button 
          class="tool-button {button.id.includes('delete') || button.id.includes('clear') ? 'destructive' : ''}" 
          on:click={() => handleToolClick(button.id)}
          style="--button-color: {button.color}"
          title={button.title}
          aria-label={button.title}
        >
          <i class="fa-solid {button.id === 'saveImage' ? 'fa-share-nodes' : button.icon}"></i>
          <span class="button-title">{button.title}</span>
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .tools-panel {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .tools-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: linear-gradient(135deg, #6a11cb, #2575fc);
    color: white;
  }

  .tools-header h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .close-button {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    color: white;
    font-weight: bold;
    transition: all 0.2s ease;
    font-size: 12px;
  }

  .close-button:hover {
    background: rgba(255, 255, 255, 0.4);
  }

  .tools-content {
    flex: 1;
    padding: 12px;
    display: flex;
    flex-direction: column;
  }

  .tools-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, var(--button-size, 120px));
    gap: 12px;
    justify-content: center;
    align-content: center;
    width: 100%;
    height: 100%;
  }

  .tool-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: var(--button-size, 120px);
    height: var(--button-size, 120px);
    border: 1px solid #eee;
    background: #f8f9fa;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #333;
    padding: 8px;
  }

  .tool-button:hover {
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-color: var(--button-color, #555);
    transform: translateY(-2px);
  }

  .tool-button:active {
    transform: scale(0.95);
  }

  .tool-button i {
    font-size: var(--icon-size, 24px);
    color: var(--button-color, #555);
    margin-bottom: 8px;
  }

  .button-title {
    font-size: var(--title-size, 11px);
    text-align: center;
    line-height: 1.2;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .destructive {
    background-color: #fff5f5;
    border-color: #ffe0e0;
  }

  .destructive:hover {
    background-color: #fff0f0;
  }
</style>
