# Migration Guide: From Stores to Svelte 5 Runes

This guide explains how to migrate from store-based state management to Svelte 5 runes in the Kinetic Constructor application.

## Why Migrate?

Svelte 5 runes provide a more direct and efficient way to manage state compared to stores:

- **Simpler Mental Model**: No need to subscribe/unsubscribe or use derived stores
- **Better Performance**: Fewer reactivity layers means better performance
- **Type Safety**: Full TypeScript integration with runes
- **Fewer Bugs**: Prevents common issues like memory leaks and stale state
- **Prevents Infinite Loops**: The new utilities help prevent infinite update loops

## Core Concepts

### State Variables

Replace store-based state with `$state` variables:

```svelte
<!-- BEFORE: Store-based -->
<script>
  import { writable } from 'svelte/store';
  const count = writable(0);

  function increment() {
    $count += 1;
  }
</script>

<button on:click={increment}>Count: {$count}</button>

<!-- AFTER: Runes-based -->
<script>
  let count = $state(0);

  function increment() {
    count += 1;
  }
</script>

<button on:click={increment}>Count: {count}</button>
```

### Derived Values

Replace derived stores with `$derived` expressions:

```svelte
<!-- BEFORE: Store-based -->
<script>
  import { writable, derived } from 'svelte/store';
  const count = writable(0);
  const doubled = derived(count, $count => $count * 2);
</script>

<p>Doubled: {$doubled}</p>

<!-- AFTER: Runes-based -->
<script>
  let count = $state(0);
  const doubled = $derived(count * 2);
</script>

<p>Doubled: {doubled}</p>
```

### Effects

Replace store subscriptions with `$effect` blocks:

```svelte
<!-- BEFORE: Store-based -->
<script>
  import { writable, onDestroy } from 'svelte/store';
  const count = writable(0);

  const unsubscribe = count.subscribe(value => {
    console.log('Count changed:', value);
  });

  onDestroy(unsubscribe);
</script>

<!-- AFTER: Runes-based -->
<script>
  let count = $state(0);

  $effect(() => {
    console.log('Count changed:', count);
  });
</script>
```

## Migration Patterns

### 1. Replace Container Usage

**Before:**

```svelte
<script>
	import { sequenceContainer } from '$lib/state/stores/sequence/SequenceContainer';
	import { useContainer } from '$lib/state/core/svelte5-integration.svelte';

	// Use the container with Svelte 5 runes
	const sequence = useContainer(sequenceContainer);
</script>
```

**After:**

```svelte
<script>
	// Direct state management with runes
	let sequence = $state({
		beats: [],
		currentBeatIndex: 0
		// other properties...
	});

	// Import functions that operate on the state
	import { addBeat, removeBeat } from './sequenceActions';
</script>
```

### 2. Replace Machine Usage

**Before:**

```svelte
<script>
	import { pictographMachineContainer } from '$lib/state/machines/pictographMachine';
	import { useMachine } from '$lib/state/core/svelte5-integration.svelte';

	// Use the machine with Svelte 5 runes
	const pictograph = useMachine(pictographMachineContainer);
</script>
```

**After:**

```svelte
<script>
	// Direct state management with runes
	let pictographState = $state({
		status: 'idle',
		data: null,
		error: null
	});

	// Import functions for state transitions
	import { loadPictograph, resetPictograph } from './pictographActions';

	// Helper for state matching
	const matches = (state) => pictographState.status === state;
</script>
```

### 3. Use Safe Update Patterns

To prevent infinite update loops, use the safe update utilities:

```svelte
<script>
	import { safeUpdate, safeEffect } from '$lib/state/core/svelte5-integration.svelte';

	let count = $state(0);

	// Safe update function that prevents infinite loops
	const increment = safeUpdate(() => {
		count += 1;
	});

	// Safe effect that prevents infinite loops
	safeEffect(() => {
		console.log('Count changed:', count);
		// This won't cause an infinite loop even if it updates state
		if (count > 10) count = 0;
	});
</script>
```

### 4. Use Debounced Updates

For operations that might trigger rapid updates:

```svelte
<script>
	import { debouncedUpdate } from '$lib/state/core/svelte5-integration.svelte';

	let searchTerm = $state('');
	let results = $state([]);

	// Debounced search function
	const performSearch = debouncedUpdate(async (term) => {
		results = await fetchSearchResults(term);
	}, 300); // 300ms debounce

	$effect(() => {
		performSearch(searchTerm);
	});
</script>
```

### 5. Use Safe State Objects

For complex state objects:

```svelte
<script>
	import { createSafeState } from '$lib/state/core/svelte5-integration.svelte';

	const { state, update, reset } = createSafeState({
		user: null,
		isLoggedIn: false,
		preferences: {
			theme: 'light',
			notifications: true
		}
	});

	function updateTheme(theme) {
		update({
			preferences: {
				...state.preferences,
				theme
			}
		});
	}

	function logout() {
		reset(); // Reset to initial state
	}
</script>
```

## Best Practices

1. **Use `untrack()` When Needed**: Wrap code in `untrack()` to prevent it from being tracked for reactivity.

2. **Break Reactivity Chains**: Use `setTimeout` with `untrack()` to break reactivity chains that might cause infinite loops.

3. **Avoid Nested Effects**: Don't create effects inside other effects or reactive blocks.

4. **Use Safe Update Patterns**: Always use the safe update utilities for state changes that might cause loops.

5. **Prefer Simple State**: Keep state simple and flat when possible.

## Utility Functions Reference

- `safeUpdate()`: Creates an update function that prevents infinite loops
- `debouncedUpdate()`: Creates a debounced update function
- `memoized()`: Creates a function that returns a memoized value (similar to $derived but can be used in any context)
- `safeEffect()`: Creates an effect that prevents infinite loops
- `createSafeState()`: Creates a state object with safe update methods
- `safeAsyncEffect()`: Creates an async effect that prevents infinite loops
