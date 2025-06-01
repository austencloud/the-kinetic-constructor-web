# Component Specifications - Modern OptionPicker

## 📋 Component Inventory

### Smart Containers (Business Logic)
1. **ModernOptionPickerContainer.svelte** - Main orchestrator
2. **StartPositionContainer.svelte** - Start position business logic
3. **OptionContainer.svelte** - Option selection business logic
4. **LayoutContainer.svelte** - Layout management logic

### Pure Presentation Components (UI Only)
1. **ModernStartPositionPicker.svelte** - Start position display
2. **ModernOptionGrid.svelte** - Option grid display
3. **ModernOptionCard.svelte** - Individual option display
4. **ResponsiveGridLayout.svelte** - Grid layout calculations
5. **LoadingSpinner.svelte** - Loading state display
6. **ErrorDisplay.svelte** - Error state display

### Service Layer
1. **IOptionService.ts** - Option management interface
2. **OptionService.svelte.ts** - Option service implementation
3. **IStartPositionService.ts** - Start position interface
4. **StartPositionService.svelte.ts** - Start position implementation
5. **ILayoutService.ts** - Layout management interface
6. **LayoutService.svelte.ts** - Layout service implementation

## 🎯 Detailed Component Specifications

### 1. ModernOptionPickerContainer.svelte

**Purpose**: Main orchestrator component that coordinates all OptionPicker functionality

**Type**: Smart Container

**Props Interface**:
```typescript
interface Props {
  // External integration
  onStartPositionSelected?: (position: PictographData) => void;
  onOptionSelected?: (option: PictographData) => void;
  onSequenceChanged?: () => void;
  
  // Configuration
  maxOptions?: number;
  enableFiltering?: boolean;
  enableSorting?: boolean;
  
  // Layout
  containerWidth?: number;
  containerHeight?: number;
}
```

**Service Dependencies**:
- `ISequenceService` - For sequence integration
- `IOptionService` - For option management
- `IStartPositionService` - For start position handling
- `ILayoutService` - For responsive layout
- `IWorkbenchService` - For panel coordination

**Responsibilities**:
- Service injection and coordination
- Event handling and delegation
- State synchronization between services
- Error handling and recovery
- Performance monitoring

**Key Methods**:
```typescript
function handleStartPositionSelect(position: PictographData): void;
function handleOptionSelect(option: PictographData): void;
function handleLayoutChange(layout: LayoutData): void;
function handleError(error: Error): void;
```

### 2. StartPositionContainer.svelte

**Purpose**: Manages start position selection business logic

**Type**: Smart Container

**Props Interface**:
```typescript
interface Props {
  onPositionSelected?: (position: PictographData) => void;
  enableValidation?: boolean;
  showPreview?: boolean;
}
```

**Service Dependencies**:
- `IStartPositionService` - Primary service
- `ISequenceService` - For integration
- `IOptionService` - For option loading

**Responsibilities**:
- Start position loading and caching
- Position validation
- Selection state management
- Integration with SequenceService
- Option loading trigger

### 3. ModernStartPositionPicker.svelte

**Purpose**: Pure presentation component for start position display

**Type**: Pure Presentation

**Props Interface**:
```typescript
interface Props {
  // Data
  startPositions: PictographData[];
  selectedPosition: PictographData | null;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Layout
  gridColumns: number;
  cellSize: number;
  
  // Events
  onPositionClick: (position: PictographData) => void;
  onPositionHover?: (position: PictographData | null) => void;
}
```

**Features**:
- Responsive grid layout
- Keyboard navigation
- Accessibility support
- Loading states
- Error handling
- Hover effects
- Selection highlighting

**Styling**:
```css
.modern-start-position-picker {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), 1fr);
  gap: var(--cell-gap);
  padding: var(--container-padding);
}

.position-card {
  aspect-ratio: 1;
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
  cursor: pointer;
}

.position-card:hover {
  transform: scale(1.05);
  box-shadow: var(--hover-shadow);
}

.position-card.selected {
  border: 2px solid var(--primary-color);
  background: var(--selected-background);
}
```

### 4. ModernOptionGrid.svelte

**Purpose**: Pure presentation component for option grid display

**Type**: Pure Presentation

**Props Interface**:
```typescript
interface Props {
  // Data
  options: PictographData[];
  selectedOptions: string[];
  
  // Layout
  gridLayout: GridLayout;
  virtualScrolling?: boolean;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Events
  onOptionClick: (option: PictographData) => void;
  onOptionDoubleClick: (option: PictographData) => void;
  onOptionHover?: (option: PictographData | null) => void;
}
```

**Features**:
- Virtual scrolling for performance
- Responsive grid layout
- Multi-selection support
- Keyboard navigation
- Accessibility support
- Loading states
- Error handling
- Smooth animations

### 5. ModernOptionCard.svelte

**Purpose**: Pure presentation component for individual option display

**Type**: Pure Presentation

**Props Interface**:
```typescript
interface Props {
  // Data
  option: PictographData;
  
  // State
  isSelected: boolean;
  isHighlighted: boolean;
  isDisabled?: boolean;
  
  // Layout
  size: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  
  // Events
  onClick: () => void;
  onDoubleClick: () => void;
  onHover?: (isHovering: boolean) => void;
}
```

**Features**:
- Pictograph rendering
- Selection states
- Hover effects
- Accessibility support
- Performance optimization
- Error handling

## 🔧 Service Specifications

### 1. IOptionService

**Purpose**: Manages option loading, filtering, and selection

**Interface**:
```typescript
interface IOptionService {
  // Reactive state
  readonly state: OptionServiceState;
  
  // Derived computations
  readonly availableOptions: PictographData[];
  readonly filteredOptions: PictographData[];
  readonly selectedOptions: PictographData[];
  readonly isLoading: boolean;
  readonly error: string | null;
  
  // Actions
  loadOptionsForPosition(position: PictographData): Promise<void>;
  filterOptions(criteria: FilterCriteria): void;
  sortOptions(criteria: SortCriteria): void;
  selectOption(option: PictographData): void;
  clearSelection(): void;
  
  // Events
  on(event: 'options:loaded', handler: (data: { options: PictographData[] }) => void): void;
  on(event: 'option:selected', handler: (data: { option: PictographData }) => void): void;
  on(event: 'options:filtered', handler: (data: { options: PictographData[] }) => void): void;
}
```

### 2. IStartPositionService

**Purpose**: Manages start position loading and selection

**Interface**:
```typescript
interface IStartPositionService {
  // Reactive state
  readonly state: StartPositionServiceState;
  
  // Derived computations
  readonly availablePositions: PictographData[];
  readonly selectedPosition: PictographData | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  
  // Validation
  readonly isValidPosition: (position: PictographData) => boolean;
  
  // Actions
  loadPositions(): Promise<void>;
  selectPosition(position: PictographData): void;
  clearPosition(): void;
  validatePosition(position: PictographData): ValidationResult;
  
  // Integration
  syncWithSequenceService(sequenceService: ISequenceService): void;
  
  // Events
  on(event: 'position:selected', handler: (data: { position: PictographData }) => void): void;
  on(event: 'positions:loaded', handler: (data: { positions: PictographData[] }) => void): void;
}
```

### 3. ILayoutService

**Purpose**: Manages responsive layout calculations

**Interface**:
```typescript
interface ILayoutService {
  // Reactive state
  readonly state: LayoutServiceState;
  
  // Derived computations
  readonly optimalGridLayout: GridLayout;
  readonly responsiveBreakpoint: BreakpointType;
  readonly cellSize: number;
  readonly gridColumns: number;
  readonly gridRows: number;
  
  // Actions
  updateContainerSize(width: number, height: number): void;
  setGridMode(mode: GridMode): void;
  calculateOptimalLayout(itemCount: number): GridLayout;
  setMinCellSize(size: number): void;
  setMaxCellSize(size: number): void;
  
  // Events
  on(event: 'layout:changed', handler: (data: { layout: GridLayout }) => void): void;
}
```

## 📊 Data Types

### Core Types
```typescript
interface GridLayout {
  columns: number;
  rows: number;
  cellSize: number;
  gap: number;
  totalWidth: number;
  totalHeight: number;
}

interface FilterCriteria {
  startPosition?: string;
  endPosition?: string;
  motionType?: string;
  propType?: string;
  difficulty?: number;
}

interface SortCriteria {
  field: 'letter' | 'difficulty' | 'frequency';
  direction: 'asc' | 'desc';
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

## 🎨 Styling Architecture

### CSS Custom Properties
```css
:root {
  /* Grid Layout */
  --option-grid-columns: 4;
  --option-grid-gap: 1rem;
  --option-cell-size: 120px;
  
  /* Colors */
  --option-card-background: #ffffff;
  --option-card-border: #e2e8f0;
  --option-card-selected: #3b82f6;
  --option-card-hover: #f1f5f9;
  
  /* Animations */
  --option-transition: all 0.2s ease;
  --option-hover-scale: 1.05;
  --option-selected-scale: 1.02;
}
```

### Component Classes
```css
.modern-option-picker { /* Container styles */ }
.option-grid { /* Grid layout styles */ }
.option-card { /* Card component styles */ }
.start-position-picker { /* Start position styles */ }
.loading-state { /* Loading indicator styles */ }
.error-state { /* Error display styles */ }
```

---

**Implementation Priority**: Start with service layer, then pure components, finally smart containers.
