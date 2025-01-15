<script lang="ts">
	import { selectedPictograph } from '$lib/stores/selectedPictographStore';
  import Pictograph from '../Pictograph/Pictograph.svelte';
  import Option from './Option.svelte';

  export let options: { name: string; pictographData: any }[] = [];
</script>

<div class="optionPicker">
  <h2 class="title">Options:</h2>
  <div class="scrollArea">
    {#each options as { name, pictographData }}
      <Option {name} {pictographData} selectedPictographStore={selectedPictograph} />
    {/each}
  </div>

  <div class="pictograph-container">
    {#if $selectedPictograph}
      <Pictograph pictographData={$selectedPictograph} onClick={() => {}} />
    {/if}
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

  .pictograph-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 10px;
    background: #fff;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
</style>
