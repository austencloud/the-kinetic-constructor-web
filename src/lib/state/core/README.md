# Svelte 5 Runes State Management

This directory contains the core utilities for state management in the Kinetic Constructor application. It now focuses exclusively on Svelte 5 runes-based state management without any store integration.

## Key Components

### Runes-based State Management

The runes-based approach provides a direct and efficient way to manage state in Svelte 5 components.

- `svelte5-integration.svelte.ts` - Utility functions for working with Svelte 5 runes
- `MIGRATION-GUIDE.md` - Guide for migrating from stores to runes

## Usage Examples

### Using Safe State Updates

```svelte
<script lang="ts">
	import { safeUpdate } from '$lib/state/core/svelte5-integration.svelte';

	// Create a state variable
	let count = $state(0);

	// Create a safe update function
	const increment = safeUpdate(() => {
		count += 1;
	});

	const decrement = safeUpdate(() => {
		count -= 1;
	});

	const reset = safeUpdate(() => {
		count = 0;
	});
</script>

<div>
	<h1>Counter: {count}</h1>
	<button on:click={increment}>Increment</button>
	<button on:click={decrement}>Decrement</button>
	<button on:click={reset}>Reset</button>
</div>
```

### Using Safe Effects

```svelte
<script lang="ts">
	import { safeEffect } from '$lib/state/core/svelte5-integration.svelte';

	let count = $state(0);
	let doubleCount = $state(0);

	// Create a safe effect that won't cause infinite loops
	safeEffect(() => {
		doubleCount = count * 2;
		console.log('Count changed:', count, 'Double:', doubleCount);
	});
</script>

<div>
	<h1>Count: {count}</h1>
	<p>Double: {doubleCount}</p>
	<button on:click={() => (count += 1)}>Increment</button>
</div>
```

### Using Memoized Values

```svelte
<script lang="ts">
	import { memoized } from '$lib/state/core/svelte5-integration.svelte';

	let count = $state(0);

	// Create a memoized value function
	const getDoubleCount = memoized(() => count * 2);
	const getTripleCount = memoized(() => count * 3);

	// Use the memoized values in a component
	function logValues() {
		console.log('Double:', getDoubleCount());
		console.log('Triple:', getTripleCount());
	}
</script>

<div>
	<h1>Count: {count}</h1>
	<p>Double: {getDoubleCount()}</p>
	<p>Triple: {getTripleCount()}</p>
	<button on:click={() => (count += 1)}>Increment</button>
	<button on:click={logValues}>Log Values</button>
</div>
```

### Using Safe State Objects

```svelte
<script lang="ts">
	import { createSafeState } from '$lib/state/core/svelte5-integration.svelte';

	// Create a safe state object
	const { state, update, reset } = createSafeState({
		user: null,
		isLoggedIn: false,
		preferences: {
			theme: 'light',
			notifications: true
		}
	});

	// Update specific properties safely
	function updateTheme(theme) {
		update({
			preferences: {
				...state.preferences,
				theme
			}
		});
	}
</script>

<div>
	<h1>User Settings</h1>
	<p>Theme: {state.preferences.theme}</p>
	<button on:click={() => updateTheme('dark')}>Dark Theme</button>
	<button on:click={() => updateTheme('light')}>Light Theme</button>
	<button on:click={reset}>Reset All</button>
</div>
```

### Using Debounced Updates

```svelte
<script lang="ts">
	import { debouncedUpdate } from '$lib/state/core/svelte5-integration.svelte';

	let searchTerm = $state('');
	let results = $state([]);

	// Create a debounced search function
	const performSearch = debouncedUpdate(async (term) => {
		// This won't run on every keystroke, only after the user stops typing
		results = await fetchSearchResults(term);
	}, 300); // 300ms debounce

	// Run the search when the search term changes
	$effect(() => {
		performSearch(searchTerm);
	});
</script>

<div>
	<input bind:value={searchTerm} placeholder="Search..." />
	<ul>
		{#each results as result}
			<li>{result.title}</li>
		{/each}
	</ul>
</div>
```

## Migration Guide

We've completely moved away from store-based state management to use Svelte 5 runes exclusively. This provides:

1. Simpler mental model - no need to subscribe/unsubscribe
2. Better performance - fewer reactivity layers
3. Type safety - full TypeScript integration
4. Fewer bugs - prevents common issues like memory leaks

See the [Runes Migration Guide](./MIGRATION-GUIDE.md) for detailed instructions on migrating your components.
