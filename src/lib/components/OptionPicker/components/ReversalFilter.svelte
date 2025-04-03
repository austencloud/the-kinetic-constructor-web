<!-- src/lib/components/OptionPicker/components/ReversalFilter.svelte -->
<script lang="ts">
  import { optionPickerStore, type ReversalFilterType } from '$lib/stores/optionPicker/optionPickerStore';
  
  export let selectedFilter: ReversalFilterType = 'all';
  export let disabled: boolean = false;

  // Filter options
  const filters: { value: ReversalFilterType, label: string }[] = [
    { value: 'all', label: 'All Options' },
    { value: 'continuous', label: 'Continuous' },
    { value: 'one_reversal', label: 'One Reversal' },
    { value: 'two_reversals', label: 'Two Reversals' }
  ];

  // Handle filter change
  function handleFilterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const newValue = select.value as ReversalFilterType;
    selectedFilter = newValue;
    optionPickerStore.setReversalFilter(newValue);
  }
</script>

<div class="reversal-filter">
  <label for="reversal-filter">Filter Options:</label>
  <select 
    id="reversal-filter" 
    {disabled}
    bind:value={selectedFilter}
    on:change={handleFilterChange}
  >
    {#each filters as filter}
      <option value={filter.value}>{filter.label}</option>
    {/each}
  </select>
</div>

<style>
  .reversal-filter {
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  label {
    font-weight: bold;
    color: #444;
  }
  
  select {
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #ccc;
    background-color: white;
    font-size: 1rem;
    min-width: 150px;
  }
  
  select:disabled {
    background-color: #f0f0f0;
    cursor: not-allowed;
  }
</style>