<script lang="ts">
  import { optionPickerStore, type ReversalFilterType } from '$lib/components/OptionPicker/optionPickerStore';
  
  export let selectedFilter: ReversalFilterType = 'all';
  export let disabled: boolean = false;
  export let isMobile: boolean = false;

  // Filter options
  const filters: { value: ReversalFilterType, label: string, shortLabel: string }[] = [
    { value: 'all', label: 'All Options', shortLabel: 'All' },
    { value: 'continuous', label: 'Continuous', shortLabel: 'Cont.' },
    { value: 'one_reversal', label: 'One Reversal', shortLabel: '1 Rev' },
    { value: 'two_reversals', label: 'Two Reversals', shortLabel: '2 Rev' }
  ];

  // Handle filter change
  function handleFilterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const newValue = select.value as ReversalFilterType;
    selectedFilter = newValue;
    optionPickerStore.setReversalFilter(newValue);
  }
</script>

<div class="reversal-filter" class:mobile={isMobile}>
  <label for="reversal-filter">{isMobile ? 'Filter:' : 'Filter Options:'}</label>
  <select 
    id="reversal-filter" 
    {disabled}
    bind:value={selectedFilter}
    on:change={handleFilterChange}
    class:mobile-select={isMobile}
  >
    {#each filters as filter}
      <option value={filter.value}>{isMobile ? filter.shortLabel : filter.label}</option>
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
  
  .mobile {
    margin-bottom: 0.5rem;
    gap: 0.3rem;
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
  
  .mobile-select {
    padding: 0.4rem;
    font-size: 0.9rem;
    min-width: 100px;
  }
  
  select:disabled {
    background-color: #f0f0f0;
    cursor: not-allowed;
  }
</style>