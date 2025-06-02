/**
 * Production Integration Tests - Modern OptionPicker Nuclear Rebuild
 * Tests the complete integration with the existing application
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SequenceService } from '$lib/services/SequenceService.svelte';
import { OptionService } from '../services/OptionService.svelte';
import { StartPositionService } from '../services/StartPositionService.svelte';
import { LayoutService } from '../services/LayoutService.svelte';
import type { PictographData } from '$lib/types/PictographData';

// Mock data for testing
const createMockPictographData = (overrides: Partial<PictographData> = {}): PictographData => ({
  letter: 'A',
  startPos: 'alpha',
  endPos: 'beta',
  timing: 'together',
  direction: 'clockwise',
  gridMode: 'diamond',
  gridData: null,
  blueMotionData: { motionType: 'pro', direction: 'clockwise' },
  redMotionData: { motionType: 'anti', direction: 'counter-clockwise' },
  redPropData: null,
  bluePropData: null,
  redArrowData: null,
  blueArrowData: null,
  grid: 'diamond',
  ...overrides
});

// Mock the OptionsService
vi.mock('../../services/OptionsService', () => ({
  getNextOptions: vi.fn(),
  determineGroupKey: vi.fn(),
  getSorter: vi.fn()
}));

// Mock the PictographDataLoader
vi.mock('$lib/utils/testing/PictographDataLoader', () => ({
  pictographDataLoader: {
    getAllPictographData: vi.fn(),
    getRandomPictographData: vi.fn(),
    getValidPictographSequence: vi.fn()
  }
}));

describe('Production Integration Tests', () => {
  let sequenceService: SequenceService;
  let optionService: OptionService;
  let startPositionService: StartPositionService;
  let layoutService: LayoutService;
  let testData: PictographData[];

  beforeEach(async () => {
    // Create test data
    testData = [
      createMockPictographData({ letter: 'A', endPos: 'alpha' }),
      createMockPictographData({ letter: 'B', startPos: 'alpha', endPos: 'beta' }),
      createMockPictographData({ letter: 'C', startPos: 'beta', endPos: 'gamma' }),
      createMockPictographData({ letter: 'D', startPos: 'gamma', endPos: 'delta' })
    ];

    // Setup mocks
    const { pictographDataLoader } = await import('$lib/utils/testing/PictographDataLoader');
    const { getNextOptions, determineGroupKey, getSorter } = await import('../../services/OptionsService');
    
    vi.mocked(pictographDataLoader.getAllPictographData).mockResolvedValue(testData);
    vi.mocked(getNextOptions).mockReturnValue(testData.slice(1));
    vi.mocked(determineGroupKey).mockReturnValue('test-group');
    vi.mocked(getSorter).mockReturnValue((a: any, b: any) => a.letter?.localeCompare(b.letter) || 0);

    // Create service instances
    sequenceService = new SequenceService({
      autoSave: false,
      autoSaveDelay: 1000,
      maxBeats: 100,
      enablePlayback: false,
      persistenceKey: 'test_sequence_state'
    });

    optionService = new OptionService({
      maxOptions: 100,
      enableCaching: true,
      cacheTimeout: 300000,
      autoFilter: true,
      defaultSort: { field: 'letter', direction: 'asc' }
    });

    startPositionService = new StartPositionService({
      enableValidation: true,
      autoSync: true,
      enableCaching: true,
      cacheTimeout: 600000,
      maxPositions: 500
    });

    layoutService = new LayoutService({
      enableResponsive: true,
      enablePerformanceOptimization: true,
      calculationThrottle: 16,
      defaultBreakpoints: {
        xs: 480,
        sm: 768,
        md: 1024,
        lg: 1280,
        xl: 1536
      },
      defaultConstraints: {
        minCellSize: 80,
        maxCellSize: 200,
        minColumns: 2,
        maxColumns: 8,
        preferredAspectRatio: 1.0,
        containerPadding: 16
      }
    });

    // Set up service integration
    startPositionService.syncWithSequenceService(sequenceService);
  });

  describe('Service Integration', () => {
    it('should integrate all services correctly', () => {
      expect(sequenceService).toBeDefined();
      expect(optionService).toBeDefined();
      expect(startPositionService).toBeDefined();
      expect(layoutService).toBeDefined();
    });

    it('should sync start position with sequence service', async () => {
      await startPositionService.loadPositions();
      
      const position = testData[0];
      startPositionService.selectPosition(position);

      expect(sequenceService.state.startPosition).toEqual(position);
    });

    it('should load options for selected start position', async () => {
      const startPosition = testData[0];
      
      await optionService.loadOptionsForPosition(startPosition);
      
      expect(optionService.availableOptions.length).toBeGreaterThan(0);
      expect(optionService.hasOptions).toBe(true);
    });

    it('should create beats when options are selected', () => {
      const option = testData[1];
      
      // Simulate option selection by directly adding to sequence
      const beatData = {
        id: 'test-beat-1',
        beatNumber: 1,
        filled: true,
        pictographData: option,
        duration: 1,
        metadata: {
          blueReversal: false,
          redReversal: false,
          tags: [`letter-${option.letter}`]
        }
      };

      sequenceService.addBeat(beatData);

      expect(sequenceService.state.beats.length).toBe(1);
      expect(sequenceService.state.beats[0].pictographData).toEqual(option);
    });
  });

  describe('Layout Service Integration', () => {
    it('should calculate responsive layouts', () => {
      layoutService.updateContainerSize(800, 600);
      layoutService.setItemCount(12);

      const layout = layoutService.optimalGridLayout;
      
      expect(layout.columns).toBeGreaterThan(0);
      expect(layout.rows).toBeGreaterThan(0);
      expect(layout.cellSize).toBeGreaterThan(0);
      expect(layout.totalWidth).toBeGreaterThan(0);
      expect(layout.totalHeight).toBeGreaterThan(0);
    });

    it('should handle breakpoint changes', () => {
      const breakpoint = layoutService.getBreakpointForWidth(1200);
      expect(['xs', 'sm', 'md', 'lg', 'xl']).toContain(breakpoint);
    });

    it('should optimize layouts for performance', () => {
      const layout = {
        columns: 4,
        rows: 3,
        cellSize: 120.7,
        gap: 8,
        totalWidth: 512.8,
        totalHeight: 368.1,
        aspectRatio: 1.39
      };

      const optimized = layoutService.optimizeForPerformance(layout);
      
      expect(optimized.cellSize).toBe(121); // Rounded
      expect(optimized.totalWidth).toBe(513); // Rounded
      expect(optimized.totalHeight).toBe(368); // Rounded
    });
  });

  describe('Performance Validation', () => {
    it('should handle large datasets efficiently', async () => {
      const startTime = performance.now();
      
      // Simulate large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => 
        createMockPictographData({ 
          letter: String.fromCharCode(65 + (i % 26)),
          startPos: `pos-${i}`,
          endPos: `pos-${i + 1}`
        })
      );

      vi.mocked(await import('../../services/OptionsService')).getNextOptions.mockReturnValue(largeDataset);
      
      await optionService.loadOptionsForPosition(testData[0]);
      
      const loadTime = performance.now() - startTime;
      
      expect(loadTime).toBeLessThan(100); // Should load within 100ms
      expect(optionService.availableOptions.length).toBeLessThanOrEqual(100); // Respects maxOptions limit
    });

    it('should render components efficiently', () => {
      const startTime = performance.now();
      
      // Simulate component render by updating layout
      layoutService.updateContainerSize(1200, 800);
      layoutService.setItemCount(50);
      
      const renderTime = performance.now() - startTime;
      
      expect(renderTime).toBeLessThan(10); // Should render within 10ms target
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Mock an error in the options service
      vi.mocked(await import('../../services/OptionsService')).getNextOptions.mockImplementation(() => {
        throw new Error('Test error');
      });

      await optionService.loadOptionsForPosition(testData[0]);
      
      expect(optionService.error).not.toBeNull();
      expect(optionService.isLoading).toBe(false);
    });

    it('should validate data integrity', () => {
      const invalidOption = createMockPictographData({
        letter: null,
        startPos: null,
        endPos: null
      });

      const isValid = optionService.validateOption(invalidOption);
      expect(isValid).toBe(false);
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory during extended usage', async () => {
      // Simulate extended usage
      for (let i = 0; i < 100; i++) {
        await optionService.loadOptionsForPosition(testData[0]);
        optionService.clearOptions();
        
        layoutService.updateContainerSize(800 + i, 600 + i);
        layoutService.setItemCount(i % 20);
      }

      // Should complete without memory issues
      expect(optionService.availableOptions.length).toBe(0);
      expect(layoutService.optimalGridLayout).toBeDefined();
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain API compatibility', () => {
      // Test that the service APIs match expected interfaces
      expect(typeof optionService.loadOptionsForPosition).toBe('function');
      expect(typeof optionService.selectOption).toBe('function');
      expect(typeof optionService.clearOptions).toBe('function');
      
      expect(typeof startPositionService.loadPositions).toBe('function');
      expect(typeof startPositionService.selectPosition).toBe('function');
      expect(typeof startPositionService.clearPosition).toBe('function');
      
      expect(typeof layoutService.updateContainerSize).toBe('function');
      expect(typeof layoutService.calculateOptimalLayout).toBe('function');
    });

    it('should provide reactive state access', () => {
      expect(optionService.availableOptions).toBeDefined();
      expect(optionService.isLoading).toBeDefined();
      expect(optionService.error).toBeDefined();
      
      expect(startPositionService.availablePositions).toBeDefined();
      expect(startPositionService.selectedPosition).toBeDefined();
      
      expect(layoutService.optimalGridLayout).toBeDefined();
      expect(layoutService.cellSize).toBeDefined();
    });
  });
});
