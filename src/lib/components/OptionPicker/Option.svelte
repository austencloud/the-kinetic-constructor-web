<script lang="ts">
    import { writable, get } from 'svelte/store';
    export let name: string;
    export let pictographData: any;
    import type { Writable } from 'svelte/store';
    export let selectedPictographStore: Writable<any>;
  
    const handleSelect = () => {
      selectedPictographStore.set(pictographData);
    };
  </script>
  
  <div
    class="option"
    role="option"
    on:click={handleSelect}
    on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(); }}
    aria-selected={$selectedPictographStore === pictographData}
    tabindex="0"
  >
    {name}
  </div>

<style>
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

	.option[aria-selected='true'] {
		background-color: #93c5fd;
		font-weight: bold;
	}
</style>
