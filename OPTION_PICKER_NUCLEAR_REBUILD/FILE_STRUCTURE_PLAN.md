# File Structure Plan - Modern OptionPicker

## 📁 Complete Directory Structure

```
src/lib/components/ConstructTab/OptionPicker/modern/
├── 📁 services/
│   ├── 📁 core/
│   │   ├── 📄 IOptionService.ts                    # Option service interface
│   │   ├── 📄 IStartPositionService.ts             # Start position service interface
│   │   ├── 📄 ILayoutService.ts                    # Layout service interface
│   │   └── 📄 ServiceTypes.ts                      # Shared service types
│   ├── 📄 OptionService.svelte.ts                  # Option service implementation
│   ├── 📄 StartPositionService.svelte.ts           # Start position service implementation
│   ├── 📄 LayoutService.svelte.ts                  # Layout service implementation
│   ├── 📄 ModernOptionServiceProvider.svelte       # Service dependency injection
│   └── 📁 __tests__/
│       ├── 📄 OptionService.test.ts                # Option service tests
│       ├── 📄 StartPositionService.test.ts         # Start position service tests
│       ├── 📄 LayoutService.test.ts                # Layout service tests
│       └── 📄 ServiceIntegration.test.ts           # Service integration tests
├── 📁 components/
│   ├── 📁 containers/
│   │   ├── 📄 ModernOptionPickerContainer.svelte   # Main orchestrator (smart)
│   │   ├── 📄 StartPositionContainer.svelte        # Start position logic (smart)
│   │   ├── 📄 OptionContainer.svelte               # Option selection logic (smart)
│   │   └── 📄 LayoutContainer.svelte               # Layout management (smart)
│   ├── 📁 presentation/
│   │   ├── 📄 ModernStartPositionPicker.svelte     # Start position display (pure)
│   │   ├── 📄 ModernOptionGrid.svelte              # Option grid display (pure)
│   │   ├── 📄 ModernOptionCard.svelte              # Individual option display (pure)
│   │   ├── 📄 ResponsiveGridLayout.svelte          # Grid layout calculations (pure)
│   │   ├── 📄 LoadingSpinner.svelte                # Loading state display (pure)
│   │   └── 📄 ErrorDisplay.svelte                  # Error state display (pure)
│   └── 📁 __tests__/
│       ├── 📄 ModernOptionPickerContainer.test.ts  # Container tests
│       ├── 📄 ModernStartPositionPicker.test.ts    # Presentation tests
│       ├── 📄 ModernOptionGrid.test.ts             # Grid tests
│       ├── 📄 ModernOptionCard.test.ts             # Card tests
│       └── 📄 ComponentIntegration.test.ts         # Component integration tests
├── 📁 types/
│   ├── 📄 OptionTypes.ts                           # Option-related types
│   ├── 📄 LayoutTypes.ts                           # Layout-related types
│   ├── 📄 ComponentTypes.ts                        # Component prop types
│   └── 📄 index.ts                                 # Type exports
├── 📁 utils/
│   ├── 📄 optionHelpers.ts                         # Option utility functions
│   ├── 📄 layoutHelpers.ts                         # Layout utility functions
│   ├── 📄 validationHelpers.ts                     # Validation utilities
│   ├── 📄 performanceHelpers.ts                    # Performance utilities
│   └── 📄 testHelpers.ts                           # Testing utilities
├── 📁 styles/
│   ├── 📄 modern-option-picker.css                 # Main component styles
│   ├── 📄 grid-layout.css                          # Grid layout styles
│   ├── 📄 animations.css                           # Animation definitions
│   └── 📄 responsive.css                           # Responsive breakpoints
├── 📁 __tests__/
│   ├── 📄 EndToEndIntegration.test.ts              # E2E workflow tests
│   ├── 📄 PerformanceTests.test.ts                 # Performance benchmarks
│   ├── 📄 AccessibilityTests.test.ts               # Accessibility tests
│   └── 📄 DataDrivenTests.test.ts                  # Authentic CSV data tests
├── 📁 migration/
│   ├── 📄 LegacyDataMigration.ts                   # Legacy data migration
│   ├── 📄 ComponentMigration.ts                    # Component migration utilities
│   └── 📄 StateMigration.ts                        # State migration helpers
├── 📄 index.ts                                     # Main exports
├── 📄 ModernOptionPicker.svelte                    # Main entry point
└── 📄 README.md                                    # Component documentation
```

## 📋 File Descriptions

### Service Layer Files

#### **IOptionService.ts**
```typescript
// Core interface for option management
export interface IOptionService {
  readonly state: OptionServiceState;
  readonly availableOptions: PictographData[];
  loadOptionsForPosition(position: PictographData): Promise<void>;
  selectOption(option: PictographData): void;
  // ... other methods
}
```

#### **OptionService.svelte.ts**
```typescript
// Svelte 5 service implementation using runes
export class OptionService implements IOptionService {
  #state = $state<OptionServiceState>({
    options: [],
    selectedOptions: [],
    isLoading: false,
    error: null
  });
  
  readonly state = this.#state;
  // ... implementation
}
```

#### **ModernOptionServiceProvider.svelte**
```svelte
<!-- Service dependency injection provider -->
<script lang="ts">
  import { setContext } from 'svelte';
  import { OptionService } from './OptionService.svelte';
  // ... other services
  
  const optionService = new OptionService();
  setContext('optionService', optionService);
</script>

<slot />
```

### Component Files

#### **ModernOptionPickerContainer.svelte**
```svelte
<!-- Main orchestrator component -->
<script lang="ts">
  import { getContext } from 'svelte';
  import type { IOptionService } from '../services/core/IOptionService';
  
  const optionService = getContext<IOptionService>('optionService');
  
  // Business logic and event handling
</script>

<!-- Template with child components -->
```

#### **ModernStartPositionPicker.svelte**
```svelte
<!-- Pure presentation component -->
<script lang="ts">
  interface Props {
    startPositions: PictographData[];
    selectedPosition: PictographData | null;
    onPositionClick: (position: PictographData) => void;
  }
  
  const props = $props<Props>();
</script>

<!-- Pure presentation template -->
```

### Type Definition Files

#### **OptionTypes.ts**
```typescript
export interface OptionServiceState {
  options: PictographData[];
  selectedOptions: PictographData[];
  isLoading: boolean;
  error: string | null;
}

export interface FilterCriteria {
  startPosition?: string;
  endPosition?: string;
  motionType?: string;
}

export interface SortCriteria {
  field: 'letter' | 'difficulty' | 'frequency';
  direction: 'asc' | 'desc';
}
```

#### **LayoutTypes.ts**
```typescript
export interface GridLayout {
  columns: number;
  rows: number;
  cellSize: number;
  gap: number;
  totalWidth: number;
  totalHeight: number;
}

export type BreakpointType = 'mobile' | 'tablet' | 'desktop' | 'wide';
export type GridMode = 'fixed' | 'responsive' | 'masonry';
```

### Utility Files

#### **optionHelpers.ts**
```typescript
export function createBeatFromOption(option: PictographData): BeatData {
  // Convert option to beat data
}

export function validateOption(option: PictographData): ValidationResult {
  // Validate option data
}

export function filterOptionsByPosition(
  options: PictographData[], 
  position: PictographData
): PictographData[] {
  // Filter options based on start position
}
```

#### **layoutHelpers.ts**
```typescript
export function calculateOptimalGrid(
  containerWidth: number,
  containerHeight: number,
  itemCount: number,
  minCellSize: number,
  maxCellSize: number
): GridLayout {
  // Calculate optimal grid layout
}

export function getBreakpoint(width: number): BreakpointType {
  // Determine current breakpoint
}
```

### Test Files

#### **EndToEndIntegration.test.ts**
```typescript
describe('OptionPicker End-to-End Integration', () => {
  it('should complete start position → option selection → beat creation workflow', async () => {
    // Test complete user workflow with authentic CSV data
  });
});
```

#### **DataDrivenTests.test.ts**
```typescript
describe('Data-Driven OptionPicker Tests', () => {
  it('should handle authentic CSV data correctly', async () => {
    const loader = new PictographDataLoader();
    await loader.loadData();
    // Test with real data
  });
});
```

### Style Files

#### **modern-option-picker.css**
```css
.modern-option-picker {
  --grid-columns: 4;
  --cell-size: 120px;
  --grid-gap: 1rem;
  --border-radius: 8px;
  --transition: all 0.2s ease;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), 1fr);
  gap: var(--grid-gap);
}
```

## 🔄 Migration Strategy

### Legacy File Mapping
```
OLD → NEW
src/lib/components/ConstructTab/OptionPicker/OptionPicker.svelte
  → src/lib/components/ConstructTab/OptionPicker/modern/ModernOptionPicker.svelte

src/lib/components/ConstructTab/OptionPicker/components/StartPositionPicker.svelte
  → src/lib/components/ConstructTab/OptionPicker/modern/components/presentation/ModernStartPositionPicker.svelte

src/lib/components/ConstructTab/OptionPicker/store.ts
  → src/lib/components/ConstructTab/OptionPicker/modern/services/OptionService.svelte.ts
```

### Import Updates
```typescript
// OLD
import OptionPicker from '$lib/components/ConstructTab/OptionPicker/OptionPicker.svelte';

// NEW
import ModernOptionPicker from '$lib/components/ConstructTab/OptionPicker/modern/ModernOptionPicker.svelte';
```

## 📦 Export Structure

### **index.ts** (Main exports)
```typescript
// Main component
export { default as ModernOptionPicker } from './ModernOptionPicker.svelte';

// Service provider
export { default as ModernOptionServiceProvider } from './services/ModernOptionServiceProvider.svelte';

// Services
export { OptionService } from './services/OptionService.svelte';
export { StartPositionService } from './services/StartPositionService.svelte';
export { LayoutService } from './services/LayoutService.svelte';

// Types
export type * from './types';

// Utilities
export * from './utils';
```

---

**Implementation Order**: Services → Types → Utils → Pure Components → Smart Containers → Integration → Testing
