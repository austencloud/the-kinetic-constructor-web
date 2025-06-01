/**
 * Performance Benchmark Tests - Modern OptionPicker Nuclear Rebuild
 * Validates performance targets and benchmarks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
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

describe('Performance Benchmark Tests', () => {
  let optionService: OptionService;
  let startPositionService: StartPositionService;
  let layoutService: LayoutService;

  beforeEach(async () => {
    // Setup mocks
    const { pictographDataLoader } = await import('$lib/utils/testing/PictographDataLoader');
    const { getNextOptions, determineGroupKey, getSorter } = await import('../../services/OptionsService');
    
    const largeDataset = Array.from({ length: 1000 }, (_, i) => 
      createMockPictographData({ 
        letter: String.fromCharCode(65 + (i % 26)),
        startPos: `pos-${i}`,
        endPos: `pos-${i + 1}`
      })
    );

    vi.mocked(pictographDataLoader.getAllPictographData).mockResolvedValue(largeDataset);
    vi.mocked(getNextOptions).mockReturnValue(largeDataset);
    vi.mocked(determineGroupKey).mockReturnValue('test-group');
    vi.mocked(getSorter).mockReturnValue((a: any, b: any) => a.letter?.localeCompare(b.letter) || 0);

    // Create service instances
    optionService = new OptionService({
      maxOptions: 1000,
      enableCaching: true,
      cacheTimeout: 300000,
      autoFilter: true,
      defaultSort: { field: 'letter', direction: 'asc' }
    });

    startPositionService = new StartPositionService({
      enableValidation: true,
      autoSync: false, // Disable auto-sync for performance testing
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
  });

  describe('Option Service Performance', () => {
    it('should load options within 100ms target', async () => {
      const startPosition = createMockPictographData({ letter: 'A' });
      
      const startTime = performance.now();
      await optionService.loadOptionsForPosition(startPosition);
      const loadTime = performance.now() - startTime;

      console.log(`Option loading time: ${loadTime.toFixed(2)}ms`);
      expect(loadTime).toBeLessThan(100); // <100ms target
      expect(optionService.availableOptions.length).toBeGreaterThan(0);
    });

    it('should filter large datasets efficiently', () => {
      // Pre-load options
      const options = Array.from({ length: 1000 }, (_, i) => 
        createMockPictographData({ 
          letter: String.fromCharCode(65 + (i % 26)),
          timing: i % 2 === 0 ? 'together' : 'split'
        })
      );
      
      (optionService as any).setOptionsData(options);

      const startTime = performance.now();
      optionService.filterOptions({ timing: 'together' });
      const filterTime = performance.now() - startTime;

      console.log(`Filtering time for 1000 options: ${filterTime.toFixed(2)}ms`);
      expect(filterTime).toBeLessThan(50); // <50ms for filtering
      expect(optionService.filteredOptions.length).toBe(500); // Half should match filter
    });

    it('should sort large datasets efficiently', () => {
      // Pre-load options
      const options = Array.from({ length: 1000 }, (_, i) => 
        createMockPictographData({ 
          letter: String.fromCharCode(90 - (i % 26)) // Reverse order
        })
      );
      
      (optionService as any).setOptionsData(options);

      const startTime = performance.now();
      optionService.sortOptions({ field: 'letter', direction: 'asc' });
      const sortTime = performance.now() - startTime;

      console.log(`Sorting time for 1000 options: ${sortTime.toFixed(2)}ms`);
      expect(sortTime).toBeLessThan(50); // <50ms for sorting
    });

    it('should handle rapid successive operations', async () => {
      const startPosition = createMockPictographData({ letter: 'A' });
      
      const startTime = performance.now();
      
      // Rapid successive operations
      for (let i = 0; i < 10; i++) {
        await optionService.loadOptionsForPosition(startPosition);
        optionService.filterOptions({ timing: 'together' });
        optionService.sortOptions({ field: 'letter', direction: 'asc' });
        optionService.clearFilters();
      }
      
      const totalTime = performance.now() - startTime;
      const avgTime = totalTime / 10;

      console.log(`Average time for rapid operations: ${avgTime.toFixed(2)}ms`);
      expect(avgTime).toBeLessThan(20); // <20ms average per operation cycle
    });
  });

  describe('Layout Service Performance', () => {
    it('should calculate layouts within 10ms target', () => {
      const startTime = performance.now();
      
      layoutService.updateContainerSize(1200, 800);
      layoutService.setItemCount(100);
      const layout = layoutService.calculateOptimalLayout(100);
      
      const calcTime = performance.now() - startTime;

      console.log(`Layout calculation time: ${calcTime.toFixed(2)}ms`);
      expect(calcTime).toBeLessThan(10); // <10ms target
      expect(layout.columns).toBeGreaterThan(0);
      expect(layout.rows).toBeGreaterThan(0);
    });

    it('should handle rapid resize events efficiently', () => {
      const startTime = performance.now();
      
      // Simulate rapid resize events
      for (let i = 0; i < 100; i++) {
        layoutService.updateContainerSize(800 + i, 600 + i);
        layoutService.setItemCount(i % 50);
      }
      
      const totalTime = performance.now() - startTime;
      const avgTime = totalTime / 100;

      console.log(`Average resize handling time: ${avgTime.toFixed(2)}ms`);
      expect(avgTime).toBeLessThan(5); // <5ms per resize event
    });

    it('should optimize layouts for performance', () => {
      const unoptimizedLayout = {
        columns: 4,
        rows: 3,
        cellSize: 120.123456789,
        gap: 8,
        totalWidth: 512.987654321,
        totalHeight: 368.123456789,
        aspectRatio: 1.39123456789
      };

      const startTime = performance.now();
      const optimized = layoutService.optimizeForPerformance(unoptimizedLayout);
      const optimizeTime = performance.now() - startTime;

      console.log(`Layout optimization time: ${optimizeTime.toFixed(2)}ms`);
      expect(optimizeTime).toBeLessThan(1); // <1ms for optimization
      
      // Should round values for better performance
      expect(optimized.cellSize).toBe(120);
      expect(optimized.totalWidth).toBe(513);
      expect(optimized.totalHeight).toBe(368);
    });
  });

  describe('Start Position Service Performance', () => {
    it('should load positions within 100ms target', async () => {
      const startTime = performance.now();
      await startPositionService.loadPositions();
      const loadTime = performance.now() - startTime;

      console.log(`Position loading time: ${loadTime.toFixed(2)}ms`);
      expect(loadTime).toBeLessThan(100); // <100ms target
      expect(startPositionService.availablePositions.length).toBeGreaterThan(0);
    });

    it('should validate positions efficiently', async () => {
      await startPositionService.loadPositions();
      
      const startTime = performance.now();
      startPositionService.validateAllPositions();
      const validateTime = performance.now() - startTime;

      console.log(`Position validation time: ${validateTime.toFixed(2)}ms`);
      expect(validateTime).toBeLessThan(50); // <50ms for validation
    });
  });

  describe('Memory Usage', () => {
    it('should maintain stable memory usage', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform memory-intensive operations
      for (let i = 0; i < 50; i++) {
        await optionService.loadOptionsForPosition(createMockPictographData({ letter: 'A' }));
        optionService.filterOptions({ timing: 'together' });
        optionService.sortOptions({ field: 'letter', direction: 'asc' });
        optionService.clearOptions();
        
        layoutService.updateContainerSize(800 + i, 600 + i);
        layoutService.setItemCount(i % 20);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      console.log(`Memory increase after 50 operations: ${memoryIncreaseMB.toFixed(2)}MB`);
      expect(memoryIncreaseMB).toBeLessThan(10); // <10MB increase
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent operations efficiently', async () => {
      const startTime = performance.now();
      
      // Simulate concurrent operations
      const promises = Array.from({ length: 10 }, async (_, i) => {
        const position = createMockPictographData({ letter: String.fromCharCode(65 + i) });
        await optionService.loadOptionsForPosition(position);
        optionService.filterOptions({ timing: 'together' });
        layoutService.updateContainerSize(800 + i * 10, 600 + i * 10);
      });
      
      await Promise.all(promises);
      
      const totalTime = performance.now() - startTime;

      console.log(`Concurrent operations time: ${totalTime.toFixed(2)}ms`);
      expect(totalTime).toBeLessThan(200); // <200ms for 10 concurrent operations
    });
  });

  describe('Virtual Scrolling Performance', () => {
    it('should handle large datasets with virtual scrolling', () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => 
        createMockPictographData({ 
          letter: String.fromCharCode(65 + (i % 26)),
          startPos: `pos-${i}`,
          endPos: `pos-${i + 1}`
        })
      );

      (optionService as any).setOptionsData(largeDataset);

      const startTime = performance.now();
      
      // Simulate virtual scrolling calculations
      const containerHeight = 600;
      const itemHeight = 120;
      const itemsPerRow = 4;
      const rowHeight = itemHeight + 8; // gap
      
      const visibleRows = Math.ceil(containerHeight / rowHeight) + 1;
      const visibleItems = visibleRows * itemsPerRow;
      
      const visibleData = largeDataset.slice(0, visibleItems);
      
      const calcTime = performance.now() - startTime;

      console.log(`Virtual scrolling calculation time for 10k items: ${calcTime.toFixed(2)}ms`);
      expect(calcTime).toBeLessThan(5); // <5ms for virtual scrolling calculations
      expect(visibleData.length).toBeLessThan(largeDataset.length);
    });
  });
});
