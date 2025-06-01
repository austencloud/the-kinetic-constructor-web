# BeatFrame Component Decomposition Plan

## Current Monolithic Architecture Analysis

### BeatFrame.svelte - 823 Lines of Complexity

#### State Variables (15 total)
```typescript
// Layout State
let beatRows = $state(1);                    // Line 73
let beatCols = $state(1);                    // Line 74  
let prevRows = $state(1);                    // Line 75
let prevCols = $state(1);                    // Line 76
let cellSize = $state(100);                  // Line 77
let naturalGridHeight = $state(0);           // Line 78

// Sequence State
let startPosition = $state<PictographData | null>(null);  // Line 72
let sequenceIsEmpty = $state(true);          // Line 92

// Dimension Tracking
let sequenceWidgetWidth = $state(0);         // Line 191
let sequenceWidgetHeight = $state(0);        // Line 192

// Element References
let beatFrameContainerRef: HTMLElement;      // Line 195
let beatFrameElementState = $state<HTMLElement | null>(null);  // Line 241
```

#### $effect Blocks (8 total - REACTIVE LOOP RISKS)
1. **Lines 93-101**: `isSequenceEmpty` subscription (MANUAL SUBSCRIPTION)
2. **Lines 156-188**: Layout calculation and store updates (STATE MODIFICATION)
3. **Lines 201-225**: Natural grid height calculation (DOM DEPENDENCY)
4. **Lines 228-238**: Natural height event dispatch (EVENT SIDE EFFECT)
5. **Lines 245-285**: Element reference management (DOM SIDE EFFECT)
6. **Lines 388-415**: Cell size calculation (COMPLEX CALCULATION)

#### Event Handling Patterns (LEGACY)
- **Lines 35-39**: `createEventDispatcher` usage
- **Lines 363-385**: Manual DOM event listeners in `onMount`
- **Lines 455-503**: Complex DOM mutation observer setup
- **Lines 506-518**: Custom DOM event dispatching

#### Animation System Integration
- **Lines 660-664**: `AnimatedBeat` component integration
- **Lines 666-673**: `ReversalGlyph` conditional rendering
- **Lines 342-346**: Pulse effect management

#### Data Handling Mechanisms
- **Lines 111-137**: Legacy BeatData conversion function
- **Lines 561-586**: Beat addition with format conversion
- **Lines 104-108**: Start position beat data derivation
- **Lines 81-86**: Beat selection and indexing logic

## Target Decomposed Architecture

### 1. BeatGrid.svelte (Pure Presentation)
**Responsibilities**: Grid layout and cell positioning only
**Props Interface**:
```typescript
interface BeatGridProps {
  beats: BeatData[];
  selectedBeatIds: string[];
  gridColumns: number;
  gridRows: number;
  cellSize: number;
  onBeatClick: (beatId: string) => void;
  onStartPosClick: () => void;
}
```

**Key Features**:
- Zero business logic
- Pure CSS Grid layout
- No state management
- Event delegation only

### 2. BeatCell.svelte (Pure Presentation)
**Responsibilities**: Individual beat rendering and interaction
**Props Interface**:
```typescript
interface BeatCellProps {
  beat: BeatData;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
}
```

**Key Features**:
- Pictograph rendering
- Hover effects
- Selection state display
- Animation integration

### 3. StartPositionCell.svelte (Specialized Cell)
**Responsibilities**: Start position specific behavior
**Props Interface**:
```typescript
interface StartPositionCellProps {
  startPosition: PictographData | null;
  isEmpty: boolean;
  isSelected: boolean;
  onClick: () => void;
}
```

**Key Features**:
- Empty state handling
- Start position specific styling
- Specialized interaction patterns

### 4. GridLayout.svelte (Layout Logic Container)
**Responsibilities**: Layout calculations and overflow management
**Service Dependencies**:
- `IWorkbenchService` for layout state
- `ISequenceService` for beat count

**Key Features**:
- Grid dimension calculations
- Cell size optimization
- Overflow detection
- Responsive layout adjustments

## Service Integration Strategy

### Service Injection Pattern
```typescript
// In each component
const sequenceService = getContext<ISequenceService>('sequenceService');
const workbenchService = getContext<IWorkbenchService>('workbenchService');

// Pure derivations (NO manual subscriptions)
const beats = $derived(sequenceService.state.beats);
const layout = $derived(workbenchService.state.layout);
```

### Eliminated Anti-Patterns
1. **Direct Container Imports**: Remove `sequenceContainer` imports
2. **Manual Subscriptions**: Replace `$effect` subscriptions with `$derived`
3. **Store Updates**: Move to service methods
4. **DOM Event Chains**: Replace with service-mediated communication

## Implementation Phases

### Phase 1: Create Pure Components (Week 1, Days 1-3)
1. **BeatCell.svelte**: Extract from lines 654-675
2. **StartPositionCell.svelte**: Extract from lines 640-646  
3. **Basic BeatGrid.svelte**: Grid structure without logic

### Phase 2: Service Integration (Week 1, Days 4-5)
1. **GridLayout.svelte**: Extract layout logic (lines 156-188, 388-415)
2. **Service method creation**: Move state management to services
3. **Event handling modernization**: Replace dispatchers with service calls

### Phase 3: Integration & Testing (Week 2, Days 1-3)
1. **Component integration**: Assemble decomposed components
2. **Functionality validation**: Ensure all features preserved
3. **Performance testing**: Verify improvements

### Phase 4: Legacy Cleanup (Week 2, Days 4-5)
1. **Remove monolithic BeatFrame**: Replace with modern architecture
2. **Update imports**: Fix component dependencies
3. **Documentation**: Component contracts and usage

## Critical Functionality Preservation

### Must Maintain Features
1. **Clear Sequence**: `clearBeats()` method (lines 589-592)
2. **Beat Addition**: `addBeat()` method (lines 561-586)
3. **Pictograph Updates**: Data flow for arrows, props, glyphs
4. **Animation Integration**: Pulse effects and transitions
5. **Selection Management**: Beat selection and highlighting
6. **Layout Responsiveness**: Grid adaptation to container size

### Performance Requirements
- **Render Time**: <10ms per component
- **Memory Usage**: Reduced through pure components
- **Reactive Updates**: Minimal through proper derivations
- **Animation Smoothness**: 60fps maintained

## Risk Mitigation Strategies

### Identified Risks
1. **Complex State Dependencies**: 15 state variables with interdependencies
2. **Animation Timing**: Pulse effects and transitions
3. **DOM Integration**: Element references and observers
4. **Event Coordination**: Multiple event handling patterns

### Mitigation Approaches
1. **Incremental Migration**: One component at a time
2. **Parallel Implementation**: Keep legacy during transition
3. **Comprehensive Testing**: Unit tests for each component
4. **Performance Monitoring**: Real-time metrics tracking

## Success Metrics

### Technical Metrics
- ✅ Zero `$:` reactive statements
- ✅ Zero manual store subscriptions
- ✅ Zero direct container imports
- ✅ All service injection implemented
- ✅ No reactive loops detected

### Functional Metrics
- ✅ All BeatFrame functionality preserved
- ✅ Clear sequence working correctly
- ✅ Pictograph data updates functional
- ✅ Animation system integrated
- ✅ Performance improved or maintained

---

**NEXT STEP**: Begin implementation with BeatCell.svelte as the foundational pure presentation component.
