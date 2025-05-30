# COMPLETE XSTATE OBLITERATION & SVELTE 5 RUNES MIGRATION

## PRIMARY OBJECTIVE
Completely remove ALL XState usage and convert ALL state management to Svelte 5 runes. NO Svelte 4 patterns should remain. This is a complete migration with ZERO tolerance for legacy patterns.

## PHASE 1: XSTATE SEARCH & DESTROY

### 1.1 Search and Remove ALL XState References
- Search entire codebase for: `xstate`, `@xstate`, `createMachine`, `useMachine`, `interpret`, `Machine`, `assign`, `spawn`, `send`, `transition`
- Remove ALL XState imports: `import { ... } from 'xstate'` or `import { ... } from '@xstate/...'`
- Delete ALL XState-related files and configurations
- Remove XState from package.json dependencies and devDependencies
- Remove any XState-related type definitions

### 1.2 XState Package Removal Commands
```bash
npm uninstall xstate @xstate/svelte @xstate/fsm @xstate/graph @xstate/inspect
npm uninstall --save-dev @xstate/cli
```

## PHASE 2: SVELTE 4 PATTERN OBLITERATION & TERMINOLOGY UPDATE

### 2.1 Rename State Management Terminology
**FIND AND REPLACE ALL INSTANCES OF:**
- `createEventStore` → `createEventManager`
- `eventStore` → `eventManager`
- `taskStore` → `taskManager`
- `performerStore` → `performerManager`
- `clientStore` → `clientManager`
- `src/lib/stores/` → `src/lib/state/` or `src/lib/managers/`

**Modern Naming Conventions:**
- State managers, not stores (no subscription/reactivity abstraction needed)
- Services for business logic
- Controllers for UI state  
- Managers for domain logic

**Why This Matters:** Svelte 5 runes don't need the "store" abstraction - they ARE the reactivity system. The old "store" terminology is confusing and misleading in the runes world.
#### Writable Store Pattern (DELETE THIS):
```typescript
// ❌ OBLITERATE THIS PATTERN
import { writable } from 'svelte/store';
const { subscribe, set, update } = writable(initialState);
```

#### Derived Store Pattern (DELETE THIS):
```typescript
// ❌ OBLITERATE THIS PATTERN  
import { derived } from 'svelte/store';
export const derivedValue = derived(store, $store => $store.value);
```

#### Store Subscription Pattern (DELETE THIS):
```typescript
// ❌ OBLITERATE THIS PATTERN
$: someValue = $store.value;
let unsubscribe = store.subscribe(value => { ... });
```

### 2.3 Replace with Svelte 5 Runes (MANDATORY NEW PATTERN):
```typescript
// ✅ REPLACE WITH THIS PATTERN
function createStateManager() {
  let data = $state([]);
  let loading = $state(false);
  let error = $state(null);
  let selectedItem = $state(null);
  
  return {
    // Getters for reactive access
    get data() { return data; },
    get loading() { return loading; },
    get error() { return error; },
    get selectedItem() { return selectedItem; },
    
    // Derived values using $derived
    get isEmpty() { return data.length === 0; },
    get hasError() { return error !== null; },
    
    // Actions that modify state
    async loadData() {
      loading = true;
      error = null;
      try {
        data = await fetchData();
      } catch (err) {
        error = err.message;
      } finally {
        loading = false;
      }
    },
    
    setSelected(item) {
      selectedItem = item;
    },
    
    clearError() {
      error = null;
    }
  };
}
```

## PHASE 3: COMPONENT CONVERSION (MANDATORY)

### 3.1 Props Pattern Conversion
```svelte
<!-- ❌ OBLITERATE THIS SVELTE 4 PATTERN -->
<script lang="ts">
  export let title: string;
  export let value: number;
  export let color: string = 'blue';
</script>

<!-- ✅ REPLACE WITH SVELTE 5 RUNES -->
<script lang="ts">
  let { 
    title,
    value,
    color = 'blue'
  }: {
    title: string;
    value: number;
    color?: string;
  } = $props();
</script>
```

### 3.2 Event Handler Conversion
```svelte
<!-- ❌ OBLITERATE THIS SVELTE 4 PATTERN -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  
  function handleClick() {
    dispatch('click', data);
  }
</script>

<!-- ✅ REPLACE WITH SVELTE 5 RUNES -->
<script lang="ts">
  let { onclick }: { onclick?: (data: any) => void } = $props();
  
  function handleClick() {
    onclick?.(data);
  }
</script>
```

### 3.3 Reactive Statement Conversion
```svelte
<!-- ❌ OBLITERATE THIS SVELTE 4 PATTERN -->
<script lang="ts">
  export let items: Item[];
  $: filteredItems = items.filter(item => item.active);
  $: totalCount = filteredItems.length;
</script>

<!-- ✅ REPLACE WITH SVELTE 5 RUNES -->
<script lang="ts">
  let { items }: { items: Item[] } = $props();
  
  const filteredItems = $derived(items.filter(item => item.active));
  const totalCount = $derived(filteredItems.length);
</script>
```

## PHASE 4: PACKAGE.JSON UPDATES (MANDATORY)

### 4.1 Update to Svelte 5
```json
{
  "devDependencies": {
    "svelte": "^5.0.0",
    "@sveltejs/kit": "^2.20.0",
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "svelte-check": "^4.0.0"
  }
}
```

### 4.2 Remove ALL Legacy Dependencies
Remove if present:
- Any XState packages
- Any Svelte 4 specific packages
- Legacy store utilities

## PHASE 5: SPECIFIC FILE TRANSFORMATIONS

### 5.1 Transform All State Management Files
For EVERY file in `src/lib/stores/` (consider renaming directory to `src/lib/state/` or `src/lib/managers/`):

**Current Pattern to OBLITERATE:**
```typescript
// ❌ DELETE THIS ENTIRE PATTERN
import { writable, derived } from 'svelte/store';

function createEventStore() {
  const { subscribe, set, update } = writable({
    events: [],
    loading: false,
    error: null
  });
  
  return {
    subscribe,
    async loadEvents() {
      update(state => ({ ...state, loading: true }));
      // async logic
    }
  };
}

export const eventStore = createEventStore();
export const events = derived(eventStore, $store => $store.events);
```

**NEW RUNES PATTERN:**
```typescript
// ✅ REPLACE WITH THIS PATTERN - STATE MANAGER/SERVICE
function createEventManager() {
  let events = $state<Event[]>([]);
  let selectedEvent = $state<Event | null>(null);
  let loading = $state(false);
  let error = $state<string | null>(null);
  
  // Derived values
  const hasEvents = $derived(events.length > 0);
  const hasError = $derived(error !== null);
  
  return {
    // Reactive getters
    get events() { return events; },
    get selectedEvent() { return selectedEvent; },
    get loading() { return loading; },
    get error() { return error; },
    get hasEvents() { return hasEvents; },
    get hasError() { return hasError; },
    
    // Actions
    async loadEvents() {
      loading = true;
      error = null;
      try {
        events = await db_service.event.getAll();
      } catch (err) {
        error = 'Failed to load events';
      } finally {
        loading = false;
      }
    },
    
    setSelected(event: Event | null) {
      selectedEvent = event;
    },
    
    clearError() {
      error = null;
    }
  };
}

export const eventManager = createEventManager();
```

## PHASE 6: COMPONENT USAGE UPDATES

### 6.1 Update State Manager Usage in Components
```svelte
<!-- ❌ OBLITERATE THIS PATTERN -->
<script>
  import { eventStore, events } from '$lib/stores/eventStore';
  
  $: allEvents = $events;
  $: isLoading = $eventStore.loading;
</script>

<!-- ✅ REPLACE WITH THIS -->
<script>
  import { eventManager } from '$lib/state/eventManager';
  
  // Direct reactive access
  $: allEvents = eventManager.events;
  $: isLoading = eventManager.loading;
</script>
```

## PHASE 7: VALIDATION & CLEANUP

### 7.1 Search for Remaining Patterns
Search entire codebase for these patterns and OBLITERATE them:
- `import { writable, derived, readable, get } from 'svelte/store'`
- `$:` reactive statements (convert to `$derived` or `$effect`)
- `export let` (convert to `$props()`)
- `createEventDispatcher` (convert to callback props)
- Any store subscription patterns
- Legacy "store" terminology (rename to managers/services/controllers)

### 7.2 Build and Test
```bash
npm run check
npm run build
npm run dev
```

### 7.3 Final Verification
- [ ] NO XState imports anywhere
- [ ] NO Svelte 4 store patterns
- [ ] NO `export let` patterns
- [ ] NO `createEventDispatcher` patterns
- [ ] ALL state uses `$state`, `$derived`, `$effect`
- [ ] ALL props use `$props()`
- [ ] Build succeeds without errors
- [ ] Application runs correctly

## CRITICAL SUCCESS CRITERIA

1. **ZERO XState references** - Not a single import, type, or usage
2. **ZERO Svelte 4 patterns** - Complete runes migration
3. **Clean builds** - No TypeScript or build errors
4. **Functional app** - All features work with new patterns
5. **Modern codebase** - 100% Svelte 5 runes-based state management

## EMERGENCY COMMANDS

If you encounter any issues:
```bash
# Nuclear option - complete reinstall
rm -rf node_modules package-lock.json
npm install
npm run check
```

**DO NOT STOP until every single Svelte 4 pattern is OBLITERATED and replaced with Svelte 5 runes.**