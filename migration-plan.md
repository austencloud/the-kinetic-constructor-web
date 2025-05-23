# Pictograph Component Migration Plan: Svelte 4 to Svelte 5 Runes

## Overview

This document outlines the plan for migrating the Pictograph component from Svelte 4 to Svelte 5 runes syntax. The migration will involve converting reactive declarations, stores, lifecycle methods, and event handlers to their Svelte 5 equivalents.

## Current Implementation Analysis

### Component Structure
- The Pictograph component is a complex component that manages the rendering of pictographs with various sub-components
- It uses a composable pattern with multiple utility functions that manage different aspects of the component
- It heavily relies on Svelte stores for state management

### Key Areas for Migration

1. **State Management**
   - Current: Uses Svelte stores created in `createPictographState`
   - Migration: Convert to `$state` and `$derived` runes

2. **Reactive Declarations**
   - Current: Uses `$:` for reactive declarations
   - Migration: Convert to `$derived` runes

3. **Store Subscriptions**
   - Current: Uses auto-subscriptions with `$storeVariable` syntax
   - Migration: Replace with `$derived` or direct access to state variables

4. **Lifecycle Methods**
   - Current: Uses `onMount` for initialization
   - Migration: Use `$effect` runes for lifecycle management

5. **Event Handling**
   - Current: Uses `createEventDispatcher` for custom events
   - Migration: Keep using `createEventDispatcher` as it's still supported in Svelte 5

6. **Transitions**
   - Current: Uses custom transitions like `popIn`
   - Migration: Transitions are still supported in Svelte 5, but may need adjustments

## Detailed Migration Steps

### 1. Convert State Management

#### Current State Structure
```typescript
const state = createPictographState(pictographData, disableAnimations);
```

#### Migration Approach
- Replace the store-based state with `$state` variables
- Convert derived stores to `$derived` expressions
- Update all composables to work with the new state structure

### 2. Convert Reactive Declarations

#### Current Reactive Declarations
```typescript
$: if (pictographData) {
  updatePictographData(pictographData);
}

$: currentState = $currentStateStore;
$: errorMessage = $errorMessageStore;
// ... more reactive declarations
```

#### Migration Approach
- Convert reactive declarations to `$derived` or direct state access
- For side effects, use `$effect` runes

### 3. Update Lifecycle Methods

#### Current Lifecycle
```typescript
onMount(() => {
  // Initialize the pictograph
  initialize();
  
  // Set up data subscription
  subscription = setupDataSubscription();
  
  // Cleanup function
  return () => {
    get(state.loadedComponents).clear();
    subscription.unsubscribe();
  };
});
```

#### Migration Approach
- Replace `onMount` with `$effect` rune
- Handle cleanup with the return function in `$effect`

### 4. Update Composables

The composables need to be updated to work with the new state structure:

- `usePictographState`: Convert to return `$state` variables instead of stores
- `usePictographLoading`: Update to work with direct state access
- `usePictographData`: Update to work with direct state access
- `usePictographComponents`: Update to work with direct state access
- `usePictographSvgPreloading`: Update to work with direct state access
- `usePictographErrorHandling`: Update to work with direct state access

### 5. Update Template Bindings

- Update template bindings to work with the new state structure
- Remove `$` prefixes from store variables in the template
- Update conditional rendering to work with the new state structure

## Implementation Plan

1. **Preparation**
   - Create a backup of the current implementation
   - Set up a test environment to verify the migration

2. **State Migration**
   - Convert the state structure to use `$state` and `$derived`
   - Update all references to the state

3. **Lifecycle Migration**
   - Convert `onMount` to `$effect`
   - Ensure cleanup functions are properly handled

4. **Template Updates**
   - Update template bindings to work with the new state
   - Test rendering with different states

5. **Testing**
   - Verify that all functionality works as expected
   - Test edge cases and error handling

## Potential Challenges

1. **Complex State Management**: The component uses a complex state management system with multiple stores and derived values.
2. **Composables Integration**: The composables need to be updated to work with the new state structure.
3. **Transition Compatibility**: Ensure transitions work correctly with the new runes syntax.
4. **Event Handling**: Ensure event handling works correctly with the new state structure.

## Success Criteria

1. The component renders correctly with the new runes syntax
2. All functionality works as expected
3. Performance is maintained or improved
4. Code is more readable and maintainable
