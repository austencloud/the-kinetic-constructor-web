# OptionPicker Component Refactoring Strategy

## Problem Statement

The `OptionPicker` component has grown too large and unwieldy, with multiple responsibilities and a hybrid state management approach. Previous modularization attempts have failed due to complex state interdependencies, tightly coupled layout logic, and inconsistent event handling patterns.

## Goals

1. Break down the monolithic component into smaller, focused components
2. Establish a consistent state management approach using Svelte 5 runes
3. Create clear component interfaces with well-defined props and events
4. Maintain all existing functionality and user experience
5. Improve maintainability and testability

## Architecture Overview

We will adopt a container-based architecture with the following key components:

1. **State Container**: Centralized state management using Svelte 5 runes
2. **Layout Provider**: Manages responsive layout and provides context
3. **Header Component**: Manages tabs and view controls
4. **Display Component**: Handles option display and selection
5. **Utility Functions**: Extracted pure functions for data processing

## Directory Structure

```
src/lib/components/ConstructTab/OptionPicker/
├── index.ts                      # Main export
├── OptionPicker.svelte           # Main container component (simplified)
├── store/                        # State management
│   ├── index.ts                  # Re-exports
│   ├── optionPickerContainer.ts  # Main state container
│   ├── derivedStores.ts          # Derived values
│   └── types.ts                  # Type definitions
├── layout/                       # Layout management
│   ├── index.ts                  # Re-exports
│   ├── LayoutProvider.svelte     # Layout context provider
│   ├── layoutContext.ts          # Layout context definition
│   ├── useResponsiveLayout.ts    # Layout hook
│   └── config.ts                 # Layout configuration
├── header/                       # Header components
│   ├── index.ts                  # Re-exports
│   ├── OptionPickerHeader.svelte # Main header component
│   ├── TabsContainer.svelte      # Tabs container
│   └── ViewControl/              # View control components
├── display/                      # Display components
│   ├── index.ts                  # Re-exports
│   ├── OptionDisplayArea.svelte  # Main display component
│   ├── OptionsPanel.svelte       # Options panel
│   └── ...                       # Other display components
├── utils/                        # Utility functions
│   ├── index.ts                  # Re-exports
│   ├── typeUtils.ts              # Type validation utilities
│   ├── dataConversion.ts         # Data conversion utilities
│   └── ...                       # Other utilities
└── services/                     # Services
    ├── index.ts                  # Re-exports
    ├── OptionsService.ts         # Options service
    └── ...                       # Other services
```

## Implementation Plan

### Phase 1: State Centralization

1. **Consolidate State Management**
   - Fully migrate to the `optionPickerContainer` approach
   - Remove duplicate state in the main component
   - Ensure all components use the container for state access

2. **Create Clear State Interfaces**
   - Define clear types for all state
   - Create helper functions for state access
   - Document state dependencies

### Phase 2: Component Extraction

1. **Extract Layout Provider**
   - Create `layout/LayoutProvider.svelte`
   - Move layout calculation logic
   - Provide layout context to child components

2. **Extract Header Component**
   - Create `header/OptionPickerHeader.svelte`
   - Move tab management logic
   - Connect to state container

3. **Extract Display Component**
   - Create `display/OptionDisplayArea.svelte`
   - Move option display logic
   - Connect to state container

4. **Extract Utility Functions**
   - Create `utils/typeUtils.ts` for type validation
   - Create `utils/dataConversion.ts` for data transformation
   - Move pure functions from the main component

5. **Simplify Main Component**
   - Reduce to coordination logic
   - Handle component lifecycle
   - Manage high-level events

### Phase 3: Event Handling Refactoring

1. **Standardize Event Patterns**
   - Use consistent event names
   - Ensure proper event propagation
   - Clean up event listeners

2. **Improve Event Documentation**
   - Document all events
   - Specify event payloads
   - Clarify event flow

### Phase 4: Testing and Refinement

1. **Component Testing**
   - Test each extracted component
   - Verify props and events
   - Test layout adaptation

2. **Integration Testing**
   - Test the full component
   - Verify state transitions
   - Test with real data

3. **Refinement**
   - Address any issues found in testing
   - Optimize performance
   - Improve documentation

## Component Interfaces

### LayoutProvider.svelte

**Responsibilities**:
- Calculate responsive layout
- Provide layout context
- Handle resize events

**Interface**:
- Props: None (self-contained)
- Events: None (uses context)
- Slots: Default slot for child components

### OptionPickerHeader.svelte

**Responsibilities**:
- Display tabs for categories
- Handle tab selection
- Display view control

**Interface**:
- Props: 
  - `selectedTab: string | null`
  - `categoryKeys: string[]`
  - `showTabs: boolean`
- Events:
  - `tabSelect` - When a tab is selected
  - `viewChange` - When the view mode changes

### OptionDisplayArea.svelte

**Responsibilities**:
- Display options based on selected tab
- Handle loading and empty states
- Manage transitions

**Interface**:
- Props:
  - `isLoading: boolean`
  - `selectedTab: string | null`
  - `optionsToDisplay: PictographData[]`
  - `hasCategories: boolean`
- Events:
  - `optionSelect` - When an option is selected

## Success Criteria

1. All existing functionality works exactly as before
2. Component code is more maintainable and easier to understand
3. State management is consistent and well-documented
4. Components have clear responsibilities and interfaces
5. Performance is maintained or improved
