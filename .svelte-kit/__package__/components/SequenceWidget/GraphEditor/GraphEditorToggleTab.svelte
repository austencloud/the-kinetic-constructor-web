<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  export let isExpanded: boolean;
  export let animationDuration: number;
  export let graphEditorHeight: number;

  const dispatch = createEventDispatcher();

  const handleClick = () => {
    dispatch('click');
  };

  // Use `onMount` to run code only in the browser
  onMount(() => {
    // Update the CSS variables dynamically
    document.documentElement.style.setProperty(
      '--graph-editor-offset',
      `${graphEditorHeight}px`
    );
    document.documentElement.style.setProperty(
      '--animation-duration',
      `${animationDuration}ms`
    );
  });

  // Reactive block to update dynamically after initial mount
  $: if (typeof window !== 'undefined') {
    document.documentElement.style.setProperty(
      '--graph-editor-offset',
      `${graphEditorHeight}px`
    );
    document.documentElement.style.setProperty(
      '--animation-duration',
      `${animationDuration}ms`
    );
  }
</script>

<button
  class="toggleTab"
  on:click={handleClick}
  aria-expanded={isExpanded}
  aria-label={isExpanded ? 'Collapse Editor' : 'Expand Editor'}
>
  <span class="icon {isExpanded ? 'expanded' : ''}">▼</span>
  {isExpanded ? 'Collapse Editor' : 'Expand Editor'}
</button>

<style>
  .toggleTab {
    position: absolute;
    bottom: var(--graph-editor-offset, 0px);
    left: 0;
    width: 20%;
    text-align: center;
    padding: 10px 20px;
    background: linear-gradient(135deg, #6a11cb, #2575fc);
    color: white;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    border-radius: 10px 10px 0 0;
    border: 1px solid #555;
    transition:
      bottom var(--animation-duration) ease-in-out,
      transform var(--animation-duration) ease-in-out;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
  }

  .toggleTab:hover {
    transform: scale(1.05);
    box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.3);
  }

  .icon {
    display: inline-block;
    transition: transform var(--animation-duration) ease-in-out;
  }

  .icon.expanded {
    transform: rotate(180deg);
  }
</style>
