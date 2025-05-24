# Component Migration Guide: Stores to Svelte 5 Runes

## Overview
This guide shows how to migrate components from using legacy Svelte stores to the new Svelte 5 runes-based state management.

## Migration Patterns

### 1. UI Store Migration

#### Before (Legacy Store)
```svelte
<script>
  import { uiStore } from './stores/uiStore';
  
  // Reactive statements
  $: isBrowserOpen = $uiStore.isBrowserPanelOpen;
  $: cellSize = $uiStore.gridSettings.cellSize;
  
  function togglePanel() {
    uiStore.toggleBrowserPanel();
  }
  
  function updateWidth(width) {
    uiStore.updateBrowserPanelWidth(width);
  }
</script>

<div class="panel" class:open={$uiStore.isBrowserPanelOpen}>
  <button on:click={togglePanel}>Toggle</button>
  <input bind:value={$uiStore.browserPanelWidth} />
</div>
```

#### After (Svelte 5 Runes)
```svelte
<script>
  import { uiState, uiActions, isBrowserPanelOpen } from './stores/uiState.svelte';
  
  // Direct access to derived states
  // No need for reactive statements
  
  function togglePanel() {
    uiActions.toggleBrowserPanel();
  }
  
  function updateWidth(width) {
    uiActions.updateBrowserPanelWidth(width);
  }
</script>

<div class="panel" class:open={isBrowserPanelOpen}>
  <button onclick={togglePanel}>Toggle</button>
  <input bind:value={uiState.browserPanelWidth} />
</div>
```

### 2. Selection Store Migration

#### Before (Legacy Store)
```svelte
<script>
  import { selectionStore, selectedBeat } from './stores/selectionStore';
  
  function selectBeat(row, col) {
    selectionStore.selectBeat(row, col);
  }
  
  function clearSelection() {
    selectionStore.clearSelection();
  }
</script>

<div class="grid">
  {#each $actStore.act.sequences as sequence, row}
    {#each sequence.beats as beat, col}
      <div 
        class="beat"
        class:selected={$selectionStore.selectedRow === row && $selectionStore.selectedCol === col}
        on:click={() => selectBeat(row, col)}
      >
        {beat.step_label}
      </div>
    {/each}
  {/each}
</div>

{#if $selectedBeat}
  <div>Selected: {$selectedBeat.beat.step_label}</div>
{/if}
```

#### After (Svelte 5 Runes)
```svelte
<script>
  import { selectionActions, hasSelection, selectedRow, selectedCol } from './stores/selectionState.svelte';
  import { actSequences } from './stores/actState.svelte';
  import { createSelectedBeatDerived } from './stores/selectionState.svelte';
  
  // Create the selected beat derived state
  const selectedBeat = createSelectedBeatDerived(actSequences);
  
  function selectBeat(row, col) {
    selectionActions.selectBeat(row, col);
  }
  
  function clearSelection() {
    selectionActions.clearSelection();
  }
</script>

<div class="grid">
  {#each actSequences as sequence, row}
    {#each sequence.beats as beat, col}
      <div 
        class="beat"
        class:selected={selectedRow === row && selectedCol === col}
        onclick={() => selectBeat(row, col)}
      >
        {beat.step_label}
      </div>
    {/each}
  {/each}
</div>

{#if selectedBeat}
  <div>Selected: {selectedBeat.beat.step_label}</div>
{/if}
```

### 3. Act Store Migration

#### Before (Legacy Store)
```svelte
<script>
  import { actStore, actTitle, isDirty } from './stores/actStore';
  import { onMount } from 'svelte';
  
  onMount(() => {
    actStore.initialize();
  });
  
  function updateTitle(title) {
    actStore.updateTitle(title);
  }
  
  function save() {
    actStore.save();
  }
  
  function undo() {
    const description = actStore.undo();
    if (description) {
      console.log(`Undid: ${description}`);
    }
  }
</script>

<div class="act-editor">
  <input bind:value={$actTitle} on:input={(e) => updateTitle(e.target.value)} />
  <button on:click={save} disabled={!$isDirty}>Save</button>
  <button on:click={undo} disabled={!actStore.canUndo()}>Undo</button>
</div>
```

#### After (Svelte 5 Runes)
```svelte
<script>
  import { 
    actActions, 
    actTitle, 
    isDirty, 
    canUndo,
    isLoading,
    error 
  } from './stores/actState.svelte';
  import { onMount } from 'svelte';
  
  onMount(() => {
    actActions.initialize();
  });
  
  function updateTitle(title) {
    actActions.updateTitle(title);
  }
  
  function save() {
    actActions.save();
  }
  
  function undo() {
    const description = actActions.undo();
    if (description) {
      console.log(`Undid: ${description}`);
    }
  }
</script>

<div class="act-editor">
  <input bind:value={actTitle} oninput={(e) => updateTitle(e.target.value)} />
  <button onclick={save} disabled={!isDirty}>Save</button>
  <button onclick={undo} disabled={!canUndo}>Undo</button>
  
  {#if isLoading}
    <div>Loading...</div>
  {/if}
  
  {#if error}
    <div class="error">{error}</div>
  {/if}
</div>
```

## Key Migration Points

### 1. Import Changes
- **Before**: `import { store } from './stores/store'`
- **After**: `import { state, actions, derivedValue } from './stores/state.svelte'`

### 2. Reactive Access
- **Before**: `$store.property` or `$derivedStore`
- **After**: `state.property` or `derivedValue` (direct access)

### 3. State Updates
- **Before**: `store.update(state => ({ ...state, prop: value }))` or `store.methodName()`
- **After**: `state.prop = value` or `actions.methodName()`

### 4. Event Handlers
- **Before**: `on:click={handler}`
- **After**: `onclick={handler}`

### 5. Reactive Statements
- **Before**: `$: computed = $store.value * 2`
- **After**: `const computed = $derived(state.value * 2)` (if needed, often direct access is sufficient)

### 6. Effects
- **Before**: `$: { if ($store.value) doSomething(); }`
- **After**: `$effect(() => { if (state.value) doSomething(); })`

## Benefits of Migration

1. **Performance**: No subscription overhead
2. **Simplicity**: Direct property access and assignment
3. **Type Safety**: Better TypeScript integration
4. **Bundle Size**: Reduced dependencies
5. **Developer Experience**: More intuitive reactive programming

## Testing Migration

After migrating a component:

1. **Verify functionality**: All features work as before
2. **Check reactivity**: UI updates correctly when state changes
3. **Test persistence**: localStorage/sessionStorage still works
4. **Validate types**: TypeScript compilation succeeds
5. **Performance check**: No memory leaks or performance regressions

## Common Pitfalls

1. **Forgetting .svelte extension**: Import from `.svelte.ts` files
2. **Using $ syntax**: Remove `$` prefix from state access
3. **Event handler syntax**: Use `onclick` instead of `on:click`
4. **Circular dependencies**: Be careful with cross-store references
5. **Effect cleanup**: Use proper cleanup in `$effect` when needed

## Rollback Strategy

If issues arise, the new state files export backward-compatible stores:
```typescript
// In the new state file
export { newState as legacyStore };
```

This allows gradual migration and easy rollback if needed.
