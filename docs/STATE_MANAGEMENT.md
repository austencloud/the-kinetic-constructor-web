# State Management Architecture

This document outlines the state management architecture for The Kinetic Constructor application.

## Core Principles

1. **Appropriate Tools for the Job**: Use the right state management approach based on complexity and scope
2. **Single Source of Truth**: Avoid state duplication across different stores
3. **Testability**: All state should be easily testable
4. **Developer Experience**: State management should be intuitive and well-documented
5. **Performance**: State updates should be efficient and minimize unnecessary re-renders

## State Management Layers

Our application uses a tiered approach to state management:

### Tier 1: Application Core (XState)

XState is used for complex, stateful workflows that benefit from explicit state machines:

- **Application lifecycle**: Initialization, loading, error states
- **Authentication flows**: Login, registration, password reset
- **Multi-step processes**: Wizards, complex forms, guided workflows

#### When to use XState:

- The state has clear, finite states (e.g., loading, success, error)
- Transitions between states have complex conditions
- The state involves side effects (API calls, local storage, etc.)
- You need to visualize the state flow (using XState's visualization tools)

### Tier 2: Feature State (Svelte Stores)

Svelte stores are used for feature-specific state:

- **Domain data**: Pictographs, sequences, grids
- **Feature settings**: User preferences, feature flags
- **UI state**: Tab selection, panel visibility

#### When to use Svelte stores:

- The state is specific to a feature or domain
- The state doesn't have complex transitions
- Multiple components need to access or modify the state
- The state needs to be persisted

### Tier 3: Component State (Svelte reactivity)

Svelte's built-in reactivity is used for component-level state:

- **Form inputs**: Text fields, checkboxes, etc.
- **Local UI state**: Hover states, focus states
- **Temporary visual state**: Animations, transitions

#### When to use component state:

- The state is only needed by a single component
- The state is temporary and doesn't need to be persisted
- The state doesn't affect other parts of the application

## State Registry

All state containers (XState machines and Svelte stores) are registered with a central registry. This provides:

- **Debugging capabilities**: Inspect all state in one place
- **Persistence**: Easily persist and rehydrate state
- **Testing**: Mock and reset state during tests

## Store Structure

### XState Machines

XState machines should follow this structure:

```typescript
// src/lib/state/machines/[feature]/[name].machine.ts

import { createMachine } from 'xstate';
import { stateRegistry } from '$lib/state/core/registry';

export interface SomeMachineContext {
  // Context properties
}

export type SomeMachineEvents =
  | { type: 'SOME_EVENT'; data: any }
  | { type: 'ANOTHER_EVENT' };

export const someMachine = createMachine({
  id: 'someMachine',
  types: {} as {
    context: SomeMachineContext;
    events: SomeMachineEvents;
  },
  context: {
    // Initial context
  },
  initial: 'idle',
  states: {
    // State definitions
  }
});

// Register the machine with the registry
export const someService = stateRegistry.registerMachine('someMachine', someMachine, {
  persist: true, // Whether to persist this machine's state
  description: 'Manages the some feature state'
});
```

### Svelte Stores

Svelte stores should follow this structure:

```typescript
// src/lib/state/stores/[feature]/[name].store.ts

import { writable, derived } from 'svelte/store';
import { stateRegistry } from '$lib/state/core/registry';

// Define the state interface
export interface SomeState {
  // State properties
}

// Initial state
const initialState: SomeState = {
  // Initial values
};

// Create the store
function createSomeStore() {
  const { subscribe, set, update } = writable<SomeState>(initialState);
  
  // Register with the registry
  stateRegistry.registerStore('someStore', { subscribe }, {
    persist: true,
    description: 'Manages some feature state'
  });
  
  return {
    subscribe,
    
    // Actions
    someAction: (param: any) => {
      update(state => ({
        ...state,
        // Update logic
      }));
    },
    
    // Reset action (always include this)
    reset: () => set(initialState)
  };
}

// Export the store instance
export const someStore = createSomeStore();

// Export derived stores if needed
export const someDerivedValue = derived(
  someStore,
  $store => $store.someProperty
);
```

## Persistence

State persistence is handled through the registry. Stores marked with `persist: true` will have their state automatically saved to and loaded from local storage.

## Testing

Each state container should have corresponding tests:

```typescript
// src/lib/state/stores/[feature]/[name].store.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { someStore } from './some.store';

describe('someStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    someStore.reset();
  });
  
  it('should have the correct initial state', () => {
    const state = get(someStore);
    expect(state).toEqual({
      // Expected initial state
    });
  });
  
  it('should update state correctly when action is called', () => {
    someStore.someAction('test');
    const state = get(someStore);
    expect(state.someProperty).toBe('expected value');
  });
});
```

## Best Practices

1. **Keep stores focused**: Each store should manage a specific domain or feature
2. **Use derived stores**: Compute derived values using `derived` rather than in components
3. **Immutable updates**: Always create new state objects rather than mutating existing ones
4. **Include reset methods**: Every store should have a `reset` method to restore initial state
5. **Document store APIs**: Document the purpose and API of each store
6. **Test state transitions**: Write tests for all state transitions and actions
