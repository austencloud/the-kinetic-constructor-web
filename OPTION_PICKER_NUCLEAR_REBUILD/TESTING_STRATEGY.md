# Testing Strategy - Modern OptionPicker Nuclear Rebuild

## 🎯 Testing Philosophy

**Goal**: 95%+ test coverage using authentic CSV data to ensure real-world reliability

**Approach**: Data-driven testing with authentic pictograph data, comprehensive service testing, and end-to-end workflow validation

## 📊 Testing Pyramid

### **Unit Tests (60% of test suite)**
- Service layer logic
- Utility functions
- Component prop handling
- State management

### **Integration Tests (30% of test suite)**
- Service-to-service communication
- Component-service integration
- SequenceService integration
- Data flow validation

### **End-to-End Tests (10% of test suite)**
- Complete user workflows
- Cross-browser compatibility
- Performance validation
- Accessibility compliance

## 🧪 Test Categories

### **1. Service Layer Tests**

#### **OptionService.test.ts**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OptionService } from '../services/OptionService.svelte';
import { PictographDataLoader } from '$lib/utils/PictographDataLoader';

describe('OptionService', () => {
  let optionService: OptionService;
  let mockDataLoader: PictographDataLoader;

  beforeEach(async () => {
    // Use authentic CSV data
    mockDataLoader = new PictographDataLoader();
    await mockDataLoader.loadData();
    
    optionService = new OptionService(mockDataLoader);
  });

  describe('loadOptionsForPosition', () => {
    it('should load authentic options for start position', async () => {
      // Get a real start position from CSV data
      const startPosition = mockDataLoader.getRandomPictographData();
      
      await optionService.loadOptionsForPosition(startPosition);
      
      expect(optionService.state.options.length).toBeGreaterThan(0);
      expect(optionService.state.isLoading).toBe(false);
      expect(optionService.state.error).toBeNull();
    });

    it('should filter options correctly based on start position', async () => {
      const startPosition = mockDataLoader.getPictographByLetter('α1');
      
      await optionService.loadOptionsForPosition(startPosition);
      
      // Verify all options are valid for this start position
      optionService.state.options.forEach(option => {
        expect(option.startPos).toBe(startPosition.endPos);
      });
    });

    it('should emit options:loaded event with authentic data', async () => {
      const eventSpy = vi.fn();
      optionService.on('options:loaded', eventSpy);
      
      const startPosition = mockDataLoader.getRandomPictographData();
      await optionService.loadOptionsForPosition(startPosition);
      
      expect(eventSpy).toHaveBeenCalledWith({
        options: expect.arrayContaining([
          expect.objectContaining({
            letter: expect.any(String),
            startPos: expect.any(String),
            endPos: expect.any(String)
          })
        ])
      });
    });
  });

  describe('selectOption', () => {
    it('should add option to selected options', () => {
      const option = mockDataLoader.getRandomPictographData();
      
      optionService.selectOption(option);
      
      expect(optionService.state.selectedOptions).toContain(option);
    });

    it('should emit option:selected event', () => {
      const eventSpy = vi.fn();
      optionService.on('option:selected', eventSpy);
      
      const option = mockDataLoader.getRandomPictographData();
      optionService.selectOption(option);
      
      expect(eventSpy).toHaveBeenCalledWith({ option });
    });
  });

  describe('filterOptions', () => {
    it('should filter options by motion type', async () => {
      const startPosition = mockDataLoader.getRandomPictographData();
      await optionService.loadOptionsForPosition(startPosition);
      
      optionService.filterOptions({ motionType: 'pro' });
      
      optionService.state.filteredOptions.forEach(option => {
        expect(option.redMotionData.motionType).toBe('pro');
      });
    });
  });
});
```

#### **StartPositionService.test.ts**
```typescript
describe('StartPositionService', () => {
  let startPositionService: StartPositionService;
  let mockSequenceService: ISequenceService;

  beforeEach(async () => {
    mockSequenceService = createMockSequenceService();
    startPositionService = new StartPositionService(mockSequenceService);
  });

  it('should sync with SequenceService when position selected', () => {
    const position = mockDataLoader.getRandomPictographData();
    
    startPositionService.selectPosition(position);
    
    expect(mockSequenceService.setStartPosition).toHaveBeenCalledWith(position);
    expect(startPositionService.state.selectedPosition).toBe(position);
  });

  it('should load authentic start positions from CSV', async () => {
    await startPositionService.loadPositions();
    
    expect(startPositionService.state.positions.length).toBeGreaterThan(0);
    startPositionService.state.positions.forEach(position => {
      expect(position).toMatchObject({
        letter: expect.any(String),
        startPos: expect.any(String),
        endPos: expect.any(String),
        grid: 'diamond'
      });
    });
  });
});
```

### **2. Component Tests**

#### **ModernOptionCard.test.ts**
```typescript
import { render, fireEvent } from '@testing-library/svelte';
import ModernOptionCard from '../components/presentation/ModernOptionCard.svelte';

describe('ModernOptionCard', () => {
  const mockOption = {
    letter: 'α1',
    startPos: 'n',
    endPos: 'n',
    // ... other properties
  };

  it('should render option data correctly', () => {
    const { getByText } = render(ModernOptionCard, {
      props: {
        option: mockOption,
        isSelected: false,
        isHighlighted: false,
        size: 'medium',
        onClick: vi.fn(),
        onDoubleClick: vi.fn()
      }
    });

    expect(getByText('α1')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const onClickSpy = vi.fn();
    const { container } = render(ModernOptionCard, {
      props: {
        option: mockOption,
        isSelected: false,
        isHighlighted: false,
        size: 'medium',
        onClick: onClickSpy,
        onDoubleClick: vi.fn()
      }
    });

    const card = container.querySelector('.option-card');
    await fireEvent.click(card);

    expect(onClickSpy).toHaveBeenCalled();
  });

  it('should apply selected styles when isSelected is true', () => {
    const { container } = render(ModernOptionCard, {
      props: {
        option: mockOption,
        isSelected: true,
        isHighlighted: false,
        size: 'medium',
        onClick: vi.fn(),
        onDoubleClick: vi.fn()
      }
    });

    const card = container.querySelector('.option-card');
    expect(card).toHaveClass('option-card--selected');
  });
});
```

### **3. Integration Tests**

#### **ServiceIntegration.test.ts**
```typescript
describe('Service Integration', () => {
  let optionService: OptionService;
  let startPositionService: StartPositionService;
  let sequenceService: ISequenceService;

  beforeEach(() => {
    sequenceService = new SequenceService();
    startPositionService = new StartPositionService(sequenceService);
    optionService = new OptionService();

    // Set up service communication
    startPositionService.on('position:selected', (data) => {
      optionService.loadOptionsForPosition(data.position);
    });
  });

  it('should load options when start position is selected', async () => {
    const startPosition = mockDataLoader.getRandomPictographData();
    
    startPositionService.selectPosition(startPosition);
    
    // Wait for async option loading
    await new Promise(resolve => {
      optionService.on('options:loaded', resolve);
    });

    expect(optionService.state.options.length).toBeGreaterThan(0);
  });

  it('should create beats when options are selected', () => {
    const option = mockDataLoader.getRandomPictographData();
    
    optionService.selectOption(option);
    
    expect(sequenceService.state.beats.length).toBe(1);
    expect(sequenceService.state.beats[0].pictographData).toBe(option);
  });
});
```

### **4. End-to-End Tests**

#### **EndToEndWorkflow.test.ts**
```typescript
describe('OptionPicker End-to-End Workflow', () => {
  it('should complete start position → option selection → beat creation workflow', async () => {
    // Render complete OptionPicker with services
    const { container } = render(TestWrapper, {
      props: {
        component: ModernOptionPickerContainer
      }
    });

    // 1. Select start position
    const startPositionCards = container.querySelectorAll('.start-position-card');
    expect(startPositionCards.length).toBeGreaterThan(0);
    
    await fireEvent.click(startPositionCards[0]);

    // 2. Wait for options to load
    await waitFor(() => {
      const optionCards = container.querySelectorAll('.option-card');
      expect(optionCards.length).toBeGreaterThan(0);
    });

    // 3. Select an option
    const optionCards = container.querySelectorAll('.option-card');
    await fireEvent.click(optionCards[0]);

    // 4. Verify beat was created in SequenceService
    const sequenceService = getTestSequenceService();
    expect(sequenceService.state.beats.length).toBe(1);
    expect(sequenceService.state.startPosition).not.toBeNull();
  });

  it('should handle clear sequence correctly', async () => {
    // Set up initial state
    const sequenceService = getTestSequenceService();
    sequenceService.setStartPosition(mockDataLoader.getRandomPictographData());
    sequenceService.addBeats([createMockBeat()]);

    // Render OptionPicker
    const { getByRole } = render(TestWrapper, {
      props: { component: ModernOptionPickerContainer }
    });

    // Click clear sequence button
    const clearButton = getByRole('button', { name: /clear sequence/i });
    await fireEvent.click(clearButton);

    // Verify state is cleared
    expect(sequenceService.state.startPosition).toBeNull();
    expect(sequenceService.state.beats).toHaveLength(0);
  });
});
```

### **5. Performance Tests**

#### **PerformanceTests.test.ts**
```typescript
describe('OptionPicker Performance', () => {
  it('should render large option sets within performance targets', async () => {
    const largeOptionSet = mockDataLoader.getAllPictographData(); // ~1000+ items
    
    const startTime = performance.now();
    
    const { container } = render(ModernOptionGrid, {
      props: {
        options: largeOptionSet,
        selectedOptions: [],
        gridLayout: mockGridLayout,
        onOptionClick: vi.fn(),
        onOptionDoubleClick: vi.fn()
      }
    });
    
    const renderTime = performance.now() - startTime;
    
    expect(renderTime).toBeLessThan(10); // <10ms target
    expect(container.querySelectorAll('.option-card')).toHaveLength(largeOptionSet.length);
  });

  it('should handle rapid state changes without performance degradation', async () => {
    const optionService = new OptionService();
    const startPositions = mockDataLoader.getStartPositions();
    
    const startTime = performance.now();
    
    // Rapidly change start positions
    for (const position of startPositions.slice(0, 10)) {
      await optionService.loadOptionsForPosition(position);
    }
    
    const totalTime = performance.now() - startTime;
    expect(totalTime).toBeLessThan(100); // <100ms for 10 position changes
  });
});
```

### **6. Accessibility Tests**

#### **AccessibilityTests.test.ts**
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('OptionPicker Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(ModernOptionPickerContainer);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support keyboard navigation', async () => {
    const { container } = render(ModernStartPositionPicker, {
      props: {
        startPositions: mockDataLoader.getStartPositions().slice(0, 4),
        selectedPosition: null,
        onPositionClick: vi.fn()
      }
    });

    const firstCard = container.querySelector('.position-card');
    firstCard.focus();

    // Test Tab navigation
    await fireEvent.keyDown(firstCard, { key: 'Tab' });
    expect(document.activeElement).toBe(container.querySelector('.position-card:nth-child(2)'));

    // Test Enter activation
    const onClickSpy = vi.fn();
    await fireEvent.keyDown(document.activeElement, { key: 'Enter' });
    // Verify click was triggered
  });
});
```

## 📋 Test Data Strategy

### **Authentic CSV Data Usage**
```typescript
// Test utility for authentic data
export class TestDataProvider {
  private loader: PictographDataLoader;

  async initialize() {
    this.loader = new PictographDataLoader();
    await this.loader.loadData();
  }

  getValidStartPosition(): PictographData {
    return this.loader.getRandomPictographData();
  }

  getOptionsForPosition(position: PictographData): PictographData[] {
    return this.loader.getValidNextOptions(position);
  }

  getValidSequence(length: number): PictographData[] {
    return this.loader.getValidPictographSequence(length);
  }
}
```

## 🎯 Coverage Targets

### **Service Layer**: 98% coverage
- All public methods tested
- All state transitions tested
- All event emissions tested
- Error handling tested

### **Component Layer**: 95% coverage
- All props combinations tested
- All user interactions tested
- All accessibility features tested
- All responsive behaviors tested

### **Integration Layer**: 90% coverage
- All service integrations tested
- All data flows tested
- All error scenarios tested
- All performance targets validated

---

**Testing Priority**: Service layer first, then components, then integration. Use authentic CSV data throughout to ensure real-world reliability.
