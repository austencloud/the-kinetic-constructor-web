/**
 * Pictograph Test Scenarios
 * Comprehensive test scenarios for data-driven pictograph testing
 * Provides structured test cases using authentic CSV data
 */

import { 
  getRandomPictographData, 
  getPictographDataByLetter, 
  getValidPictographSequence,
  getAllValidLetters,
  pictographDataLoader,
  type PictographDataLoaderOptions 
} from './PictographDataLoader';
import { PictographDataValidator } from './PictographDataValidator';
import type { PictographData } from '$lib/types/PictographData';

export interface TestScenario {
  name: string;
  description: string;
  execute: () => Promise<TestScenarioResult>;
}

export interface TestScenarioResult {
  scenario: string;
  pictographs: PictographData[];
  startPosition: PictographData | null;
  validationResults: any[];
  metadata: {
    executionTime: number;
    dataSource: 'csv-authentic';
    testType: string;
    coverage: string[];
  };
}

export class PictographTestScenarios {
  private static instance: PictographTestScenarios;

  private constructor() {}

  public static getInstance(): PictographTestScenarios {
    if (!PictographTestScenarios.instance) {
      PictographTestScenarios.instance = new PictographTestScenarios();
    }
    return PictographTestScenarios.instance;
  }

  /**
   * Get all available test scenarios
   */
  public getAvailableScenarios(): TestScenario[] {
    return [
      {
        name: 'Random Pictographs',
        description: 'Tests with randomly selected authentic pictographs from CSV',
        execute: () => this.executeRandomPictographs()
      },
      {
        name: 'Motion Type Coverage',
        description: 'Tests covering all motion types (pro, anti, static, dash)',
        execute: () => this.executeMotionTypeCoverage()
      },
      {
        name: 'Letter Progression',
        description: 'Tests with alphabetical letter progression sequences',
        execute: () => this.executeLetterProgression()
      },
      {
        name: 'Connected Sequences',
        description: 'Tests with pictographs that connect start-to-end positions',
        execute: () => this.executeConnectedSequences()
      },
      {
        name: 'Timing Variations',
        description: 'Tests covering different timing types (split, tog, quarter, none)',
        execute: () => this.executeTimingVariations()
      },
      {
        name: 'Direction Combinations',
        description: 'Tests with same/opposite direction combinations',
        execute: () => this.executeDirectionCombinations()
      },
      {
        name: 'Edge Cases',
        description: 'Tests with edge cases and boundary conditions',
        execute: () => this.executeEdgeCases()
      },
      {
        name: 'Performance Stress Test',
        description: 'Tests with large sequences for performance validation',
        execute: () => this.executePerformanceStressTest()
      },
      {
        name: 'Validation Comprehensive',
        description: 'Tests that exercise all validation rules and edge cases',
        execute: () => this.executeValidationComprehensive()
      }
    ];
  }

  /**
   * Execute random pictographs scenario
   */
  private async executeRandomPictographs(): Promise<TestScenarioResult> {
    const startTime = performance.now();
    
    const pictographs = await Promise.all([
      getRandomPictographData(),
      getRandomPictographData(),
      getRandomPictographData(),
      getRandomPictographData()
    ]);
    
    const startPosition = await getRandomPictographData();
    
    const validationResults = pictographs.map((p, index) => ({
      beatIndex: index,
      ...PictographDataValidator.validatePictographData(p, { 
        strictMode: true, 
        checkBusinessRules: true 
      })
    }));
    
    return {
      scenario: 'Random Pictographs',
      pictographs,
      startPosition,
      validationResults,
      metadata: {
        executionTime: performance.now() - startTime,
        dataSource: 'csv-authentic',
        testType: 'random-sampling',
        coverage: ['random-selection', 'basic-validation']
      }
    };
  }

  /**
   * Execute motion type coverage scenario
   */
  private async executeMotionTypeCoverage(): Promise<TestScenarioResult> {
    const startTime = performance.now();
    
    const motionTypes = ['pro', 'anti', 'static', 'dash'];
    const pictographs: PictographData[] = [];
    
    for (const motionType of motionTypes) {
      const options: PictographDataLoaderOptions = {
        includeStaticMotions: motionType === 'static',
        includeDashMotions: motionType === 'dash'
      };
      
      // Get pictographs that include this motion type
      let attempts = 0;
      let found = false;
      
      while (!found && attempts < 10) {
        const pictograph = await getRandomPictographData(options);
        
        // Check if this pictograph contains the desired motion type
        const hasMotionType = 
          pictograph.blueMotionData?.motionType === motionType ||
          pictograph.redMotionData?.motionType === motionType;
        
        if (hasMotionType) {
          pictographs.push(pictograph);
          found = true;
        }
        attempts++;
      }
    }
    
    const startPosition = await getRandomPictographData();
    
    const validationResults = pictographs.map((p, index) => ({
      beatIndex: index,
      ...PictographDataValidator.validatePictographData(p, { 
        strictMode: true, 
        checkBusinessRules: true 
      })
    }));
    
    return {
      scenario: 'Motion Type Coverage',
      pictographs,
      startPosition,
      validationResults,
      metadata: {
        executionTime: performance.now() - startTime,
        dataSource: 'csv-authentic',
        testType: 'motion-coverage',
        coverage: motionTypes.map(type => `motion-${type}`)
      }
    };
  }

  /**
   * Execute letter progression scenario
   */
  private async executeLetterProgression(): Promise<TestScenarioResult> {
    const startTime = performance.now();
    
    const letters = await getAllValidLetters();
    const selectedLetters = letters.slice(0, 5); // First 5 letters
    
    const pictographs: PictographData[] = [];
    
    for (const letter of selectedLetters) {
      const letterPictographs = await getPictographDataByLetter(letter);
      if (letterPictographs.length > 0) {
        pictographs.push(letterPictographs[0]); // Take first variant
      }
    }
    
    const startPosition = await getRandomPictographData();
    
    const validationResults = pictographs.map((p, index) => ({
      beatIndex: index,
      ...PictographDataValidator.validatePictographData(p, { 
        strictMode: true, 
        checkBusinessRules: true 
      })
    }));
    
    return {
      scenario: 'Letter Progression',
      pictographs,
      startPosition,
      validationResults,
      metadata: {
        executionTime: performance.now() - startTime,
        dataSource: 'csv-authentic',
        testType: 'letter-progression',
        coverage: selectedLetters.map(letter => `letter-${letter}`)
      }
    };
  }

  /**
   * Execute connected sequences scenario
   */
  private async executeConnectedSequences(): Promise<TestScenarioResult> {
    const startTime = performance.now();
    
    const pictographs = await getValidPictographSequence(4);
    const startPosition = await getRandomPictographData();
    
    const validationResults = pictographs.map((p, index) => ({
      beatIndex: index,
      ...PictographDataValidator.validatePictographData(p, { 
        strictMode: true, 
        checkBusinessRules: true 
      })
    }));
    
    // Additional sequence validation
    const sequenceValidation = PictographDataValidator.validateSequence(pictographs, {
      strictMode: true,
      checkBusinessRules: true
    });
    
    validationResults.push({
      beatIndex: -1,
      scenario: 'sequence-connectivity',
      ...sequenceValidation
    });
    
    return {
      scenario: 'Connected Sequences',
      pictographs,
      startPosition,
      validationResults,
      metadata: {
        executionTime: performance.now() - startTime,
        dataSource: 'csv-authentic',
        testType: 'connected-sequence',
        coverage: ['sequence-connectivity', 'position-transitions']
      }
    };
  }

  /**
   * Execute timing variations scenario
   */
  private async executeTimingVariations(): Promise<TestScenarioResult> {
    const startTime = performance.now();
    
    const timingTypes = ['split', 'tog', 'quarter', 'none'];
    const pictographs: PictographData[] = [];
    
    for (const timing of timingTypes) {
      const options: PictographDataLoaderOptions = {
        filterByTiming: [timing as any],
        includeStaticMotions: true,
        includeDashMotions: true
      };
      
      const pictograph = await getRandomPictographData(options);
      pictographs.push(pictograph);
    }
    
    const startPosition = await getRandomPictographData();
    
    const validationResults = pictographs.map((p, index) => ({
      beatIndex: index,
      ...PictographDataValidator.validatePictographData(p, { 
        strictMode: true, 
        checkBusinessRules: true 
      })
    }));
    
    return {
      scenario: 'Timing Variations',
      pictographs,
      startPosition,
      validationResults,
      metadata: {
        executionTime: performance.now() - startTime,
        dataSource: 'csv-authentic',
        testType: 'timing-coverage',
        coverage: timingTypes.map(timing => `timing-${timing}`)
      }
    };
  }

  /**
   * Execute direction combinations scenario
   */
  private async executeDirectionCombinations(): Promise<TestScenarioResult> {
    const startTime = performance.now();
    
    const directionTypes = ['same', 'opp'];
    const pictographs: PictographData[] = [];
    
    for (const direction of directionTypes) {
      const options: PictographDataLoaderOptions = {
        filterByDirection: [direction as any],
        includeStaticMotions: true,
        includeDashMotions: true
      };
      
      const pictograph = await getRandomPictographData(options);
      pictographs.push(pictograph);
    }
    
    const startPosition = await getRandomPictographData();
    
    const validationResults = pictographs.map((p, index) => ({
      beatIndex: index,
      ...PictographDataValidator.validatePictographData(p, { 
        strictMode: true, 
        checkBusinessRules: true 
      })
    }));
    
    return {
      scenario: 'Direction Combinations',
      pictographs,
      startPosition,
      validationResults,
      metadata: {
        executionTime: performance.now() - startTime,
        dataSource: 'csv-authentic',
        testType: 'direction-coverage',
        coverage: directionTypes.map(dir => `direction-${dir}`)
      }
    };
  }

  /**
   * Execute edge cases scenario
   */
  private async executeEdgeCases(): Promise<TestScenarioResult> {
    const startTime = performance.now();
    
    // Test edge cases: static only, dash only, same start/end positions
    const edgeCaseOptions = [
      { includeStaticMotions: true, includeDashMotions: false },
      { includeStaticMotions: false, includeDashMotions: true },
      { filterByTiming: ['none'] as any },
      { filterByDirection: ['none'] as any }
    ];
    
    const pictographs: PictographData[] = [];
    
    for (const options of edgeCaseOptions) {
      try {
        const pictograph = await getRandomPictographData(options);
        pictographs.push(pictograph);
      } catch (error) {
        console.warn('Edge case scenario failed for options:', options, error);
      }
    }
    
    const startPosition = await getRandomPictographData();
    
    const validationResults = pictographs.map((p, index) => ({
      beatIndex: index,
      ...PictographDataValidator.validatePictographData(p, { 
        strictMode: true, 
        checkBusinessRules: true 
      })
    }));
    
    return {
      scenario: 'Edge Cases',
      pictographs,
      startPosition,
      validationResults,
      metadata: {
        executionTime: performance.now() - startTime,
        dataSource: 'csv-authentic',
        testType: 'edge-cases',
        coverage: ['static-only', 'dash-only', 'none-timing', 'none-direction']
      }
    };
  }

  /**
   * Execute performance stress test scenario
   */
  private async executePerformanceStressTest(): Promise<TestScenarioResult> {
    const startTime = performance.now();
    
    const pictographs = await getValidPictographSequence(10); // Large sequence
    const startPosition = await getRandomPictographData();
    
    const validationResults = pictographs.map((p, index) => ({
      beatIndex: index,
      ...PictographDataValidator.validatePictographData(p, { 
        strictMode: true, 
        checkBusinessRules: true 
      })
    }));
    
    return {
      scenario: 'Performance Stress Test',
      pictographs,
      startPosition,
      validationResults,
      metadata: {
        executionTime: performance.now() - startTime,
        dataSource: 'csv-authentic',
        testType: 'performance-stress',
        coverage: ['large-sequence', 'performance-validation']
      }
    };
  }

  /**
   * Execute comprehensive validation scenario
   */
  private async executeValidationComprehensive(): Promise<TestScenarioResult> {
    const startTime = performance.now();
    
    // Get diverse pictographs for comprehensive validation testing
    const pictographs = await Promise.all([
      getRandomPictographData({ includeStaticMotions: true, includeDashMotions: false }),
      getRandomPictographData({ includeStaticMotions: false, includeDashMotions: true }),
      getRandomPictographData({ filterByTiming: ['split'] }),
      getRandomPictographData({ filterByDirection: ['same'] }),
      getRandomPictographData({ filterByDirection: ['opp'] })
    ]);
    
    const startPosition = await getRandomPictographData();
    
    // Comprehensive validation with all options
    const validationResults = pictographs.map((p, index) => ({
      beatIndex: index,
      ...PictographDataValidator.validatePictographData(p, { 
        strictMode: true, 
        checkBusinessRules: true,
        allowEmptyFields: false
      })
    }));
    
    // Additional sequence validation
    const sequenceValidation = PictographDataValidator.validateSequence(pictographs, {
      strictMode: true,
      checkBusinessRules: true
    });
    
    validationResults.push({
      beatIndex: -1,
      scenario: 'comprehensive-validation',
      ...sequenceValidation
    });
    
    return {
      scenario: 'Validation Comprehensive',
      pictographs,
      startPosition,
      validationResults,
      metadata: {
        executionTime: performance.now() - startTime,
        dataSource: 'csv-authentic',
        testType: 'validation-comprehensive',
        coverage: ['all-validation-rules', 'business-rules', 'sequence-validation']
      }
    };
  }
}

// Convenience instance
export const pictographTestScenarios = PictographTestScenarios.getInstance();
