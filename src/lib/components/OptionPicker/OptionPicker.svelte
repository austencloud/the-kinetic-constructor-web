<script lang="ts">
  import { writable } from 'svelte/store';

  const selectedPictograph = writable(null);
  import { get } from 'svelte/store';

  export let options: { name: string; pictographData: any }[];
</script>

<div class="optionPicker">
  <h2 class="title">Options:</h2>
  <div class="scrollArea">
    {#each options as { name, pictographData }}
      <div
        class="option"
        role="option"
        on:click={() => selectedPictograph.set(pictographData)}
        on:keydown={(e) => e.key === 'Enter' && selectedPictograph.set(pictographData)}
        aria-selected={get(selectedPictograph) === pictographData}
        tabindex="0"
      >
        {name}
      </div>
    {/each}
  </div>
</div>


<style>
  .optionPicker {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 700px;
    margin: auto;
    background: #f0f0f0;
    padding: 20px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  .title {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .scrollArea {
    max-height: 200px;
    overflow-y: auto;
    margin-bottom: 20px;
  }

  .option {
    padding: 10px;
    margin-bottom: 5px;
    background-color: white;
    border: 1px solid #ccc;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .option:hover {
    background-color: #dbeafe;
  }

  .option[aria-selected="true"] {
    background-color: #93c5fd;
    font-weight: bold;
  }
</style>
