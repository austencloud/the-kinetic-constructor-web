<!-- src/lib/components/SequenceWorkbench/ShareDropdown.svelte -->
<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { clickOutside } from '$lib/utils/clickOutside';
  import { copyToClipboard, shareViaEmail, isFileShareSupported } from '$lib/utils/shareUtils';
  
  export let url: string = '';
  export let sequenceName: string = '';
  export let onDownloadImage: () => void;
  export let onShareWithImage: () => void;
  export let onClose: () => void;
</script>

<div 
  class="share-dropdown"
  transition:fly={{ y: 5, duration: 200 }}
  use:clickOutside={{ callback: onClose }}
>
  <div class="dropdown-header">
    <h3>Share Sequence</h3>
    <button class="close-button" on:click={onClose} aria-label="Close">
      <i class="fa-solid fa-times"></i>
    </button>
  </div>
  
  <div class="dropdown-content">
    {#if isFileShareSupported()}
      <button class="share-option" on:click={onShareWithImage}>
        <i class="fa-solid fa-share-from-square"></i>
        <span>Share with Image</span>
      </button>
    {/if}
    
    <button class="share-option" on:click={() => copyToClipboard(url)}>
      <i class="fa-solid fa-link"></i>
      <span>Copy Link</span>
    </button>
    
    <button class="share-option" on:click={onDownloadImage}>
      <i class="fa-solid fa-download"></i>
      <span>Download as Image</span>
    </button>
    
    <button class="share-option" on:click={() => shareViaEmail(sequenceName, url)}>
      <i class="fa-solid fa-envelope"></i>
      <span>Share via Email</span>
    </button>
  </div>
</div>

<style>
  .share-dropdown {
    position: absolute;
    top: calc(var(--button-size-factor, 1) * var(--base-size) + 10px);
    right: calc(var(--button-size-factor, 1) * var(--base-margin));
    width: 220px;
    background-color: var(--tkc-button-panel-background, #2a2a2e);
    border-radius: 8px;
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.2),
      0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 50;
    overflow: hidden;
  }
  
  .dropdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .dropdown-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
  }
  
  .close-button {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: color 0.2s ease;
  }
  
  .close-button:hover {
    color: #ffffff;
  }
  
  .dropdown-content {
    padding: 8px 0;
  }
  
  .share-option {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 10px 16px;
    background: transparent;
    border: none;
    color: #ffffff;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.2s ease;
  }
  
  .share-option:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .share-option i {
    margin-right: 12px;
    width: 16px;
    text-align: center;
    color: var(--tkc-icon-color-share, #00bcd4);
  }
  
  .share-option span {
    font-size: 14px;
  }
</style>