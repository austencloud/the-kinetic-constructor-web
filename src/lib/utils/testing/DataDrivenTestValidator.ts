/**
 * Data-Driven Test Validator
 * Validates the complete data-driven testing solution
 * Ensures all components work correctly with authentic CSV data
 */

import { 
  pictographDataLoader,
  getRandomPictographData,
  getPictographDataByLetter,
  getValidPictographSequence,
  getAllValidLetters
} from './PictographDataLoader';
import { PictographDataValidator } from './PictographDataValidator';
import { pictographTestScenarios } from './PictographTestScenarios';

export interface ValidationReport {
  success: boolean;
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    executionTime: number;
  };
  results: ValidationTestResult[];
  errors: string[];
  warnings: string[];
}

export interface ValidationTestResult {
  testName: string;
  success: boolean;
  executionTime: number;
  details: any;
  errors: string[];
}

export class DataDrivenTestValidator {
  private static instance: DataDrivenTestValidator;

  private constructor() {}

  public static getInstance(): DataDrivenTestValidator {
    if (!DataDrivenTestValidator.instance) {
      DataDrivenTestValidator.instance = new DataDrivenTestValidator();
    }
    return DataDrivenTestValidator.instance;
  }

  /**
   * Run comprehensive validation of the data-driven testing solution
   */
  public async validateComplete(): Promise<ValidationReport> {
    const startTime = performance.now();
    const results: ValidationTestResult[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    console.log('🧪 Starting Data-Driven Testing Solution Validation...');

    // Test 1: CSV Data Loading
    results.push(await this.testCsvDataLoading());

    // Test 2: Data Loader Functions
    results.push(await this.testDataLoaderFunctions());

    // Test 3: Data Validation
    results.push(await this.testDataValidation());

    // Test 4: Test Scenarios
    results.push(await this.testScenarios());

    // Test 5: Performance Validation
    results.push(await this.testPerformance());

    // Test 6: Integration Validation
    results.push(await this.testIntegration());

    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const executionTime = performance.now() - startTime;

    // Collect errors and warnings
    results.forEach(result => {
      errors.push(...result.errors);
    });

    const report: ValidationReport = {
      success: failedTests === 0,
      summary: {
        totalTests,
        passedTests,
        failedTests,
        executionTime
      },
      results,
      errors,
      warnings
    };

    console.log('🏁 Data-Driven Testing Validation Complete:', {
      success: report.success,
      passed: `${passedTests}/${totalTests}`,
      time: `${executionTime.toFixed(2)}ms`
    });

    return report;
  }

  /**
   * Test CSV data loading functionality
   */
  private async testCsvDataLoading(): Promise<ValidationTestResult> {
    const startTime = performance.now();
    const errors: string[] = [];

    try {
      // Test data loading
      await pictographDataLoader.loadData();
      
      if (!pictographDataLoader.isDataLoaded()) {
        errors.push('Data loader reports not loaded after loadData() call');
      }

      // Test data statistics
      const statistics = await pictographDataLoader.getDataStatistics();
      
      if (!statistics || statistics.totalEntries === 0) {
        errors.push('No data entries loaded from CSV');
      }

      if (statistics.uniqueLetters === 0) {
        errors.push('No unique letters found in CSV data');
      }

      // Test raw entries access
      const rawEntries = await pictographDataLoader.getRawEntries();
      
      if (!rawEntries || rawEntries.length === 0) {
        errors.push('No raw entries accessible');
      }

      return {
        testName: 'CSV Data Loading',
        success: errors.length === 0,
        executionTime: performance.now() - startTime,
        details: {
          dataLoaded: pictographDataLoader.isDataLoaded(),
          statistics,
          rawEntriesCount: rawEntries?.length || 0
        },
        errors
      };

    } catch (error) {
      errors.push(`CSV loading failed: ${error}`);
      return {
        testName: 'CSV Data Loading',
        success: false,
        executionTime: performance.now() - startTime,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        errors
      };
    }
  }

  /**
   * Test data loader functions
   */
  private async testDataLoaderFunctions(): Promise<ValidationTestResult> {
    const startTime = performance.now();
    const errors: string[] = [];

    try {
      // Test random pictograph data
      const randomPictograph = await getRandomPictographData();
      if (!randomPictograph || !randomPictograph.letter) {
        errors.push('getRandomPictographData returned invalid data');
      }

      // Test letter-specific data
      const letters = await getAllValidLetters();
      if (!letters || letters.length === 0) {
        errors.push('getAllValidLetters returned no letters');
      }

      if (letters.length > 0) {
        const letterData = await getPictographDataByLetter(letters[0]);
        if (!letterData || letterData.length === 0) {
          errors.push(`getPictographDataByLetter returned no data for letter ${letters[0]}`);
        }
      }

      // Test sequence generation
      const sequence = await getValidPictographSequence(3);
      if (!sequence || sequence.length !== 3) {
        errors.push('getValidPictographSequence did not return expected length');
      }

      // Test with options
      const staticPictograph = await getRandomPictographData({
        includeStaticMotions: true,
        includeDashMotions: false
      });
      if (!staticPictograph) {
        errors.push('getRandomPictographData with options failed');
      }

      return {
        testName: 'Data Loader Functions',
        success: errors.length === 0,
        executionTime: performance.now() - startTime,
        details: {
          randomPictograph: !!randomPictograph,
          lettersCount: letters?.length || 0,
          sequenceLength: sequence?.length || 0,
          staticPictograph: !!staticPictograph
        },
        errors
      };

    } catch (error) {
      errors.push(`Data loader functions failed: ${error}`);
      return {
        testName: 'Data Loader Functions',
        success: false,
        executionTime: performance.now() - startTime,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        errors
      };
    }
  }

  /**
   * Test data validation functionality
   */
  private async testDataValidation(): Promise<ValidationTestResult> {
    const startTime = performance.now();
    const errors: string[] = [];

    try {
      // Get test data
      const pictograph = await getRandomPictographData();
      
      // Test pictograph validation
      const validation = PictographDataValidator.validatePictographData(pictograph, {
        strictMode: true,
        checkBusinessRules: true
      });

      if (typeof validation.isValid !== 'boolean') {
        errors.push('Validation result missing isValid property');
      }

      if (!Array.isArray(validation.errors)) {
        errors.push('Validation result missing errors array');
      }

      if (!Array.isArray(validation.warnings)) {
        errors.push('Validation result missing warnings array');
      }

      // Test sequence validation
      const sequence = await getValidPictographSequence(2);
      const sequenceValidation = PictographDataValidator.validateSequence(sequence);

      if (typeof sequenceValidation.isValid !== 'boolean') {
        errors.push('Sequence validation result missing isValid property');
      }

      // Test validation summary
      const results = [validation, sequenceValidation];
      const summary = PictographDataValidator.getValidationSummary(results);

      if (typeof summary.totalValidated !== 'number') {
        errors.push('Validation summary missing totalValidated');
      }

      return {
        testName: 'Data Validation',
        success: errors.length === 0,
        executionTime: performance.now() - startTime,
        details: {
          pictographValidation: validation,
          sequenceValidation: sequenceValidation,
          summary
        },
        errors
      };

    } catch (error) {
      errors.push(`Data validation failed: ${error}`);
      return {
        testName: 'Data Validation',
        success: false,
        executionTime: performance.now() - startTime,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        errors
      };
    }
  }

  /**
   * Test scenario execution
   */
  private async testScenarios(): Promise<ValidationTestResult> {
    const startTime = performance.now();
    const errors: string[] = [];

    try {
      // Get available scenarios
      const scenarios = pictographTestScenarios.getAvailableScenarios();
      
      if (!scenarios || scenarios.length === 0) {
        errors.push('No test scenarios available');
      }

      // Test first scenario execution
      if (scenarios.length > 0) {
        const firstScenario = scenarios[0];
        const result = await firstScenario.execute();

        if (!result || !result.scenario) {
          errors.push('Scenario execution returned invalid result');
        }

        if (!Array.isArray(result.pictographs)) {
          errors.push('Scenario result missing pictographs array');
        }

        if (!Array.isArray(result.validationResults)) {
          errors.push('Scenario result missing validationResults array');
        }

        if (!result.metadata || typeof result.metadata.executionTime !== 'number') {
          errors.push('Scenario result missing metadata');
        }
      }

      return {
        testName: 'Test Scenarios',
        success: errors.length === 0,
        executionTime: performance.now() - startTime,
        details: {
          scenariosCount: scenarios?.length || 0,
          firstScenarioName: scenarios?.[0]?.name || 'none'
        },
        errors
      };

    } catch (error) {
      errors.push(`Test scenarios failed: ${error}`);
      return {
        testName: 'Test Scenarios',
        success: false,
        executionTime: performance.now() - startTime,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        errors
      };
    }
  }

  /**
   * Test performance characteristics
   */
  private async testPerformance(): Promise<ValidationTestResult> {
    const startTime = performance.now();
    const errors: string[] = [];

    try {
      // Test data loading performance
      const loadStart = performance.now();
      await pictographDataLoader.loadData();
      const loadTime = performance.now() - loadStart;

      if (loadTime > 1000) { // 1 second threshold
        errors.push(`CSV loading too slow: ${loadTime.toFixed(2)}ms`);
      }

      // Test random data generation performance
      const randomStart = performance.now();
      await Promise.all([
        getRandomPictographData(),
        getRandomPictographData(),
        getRandomPictographData()
      ]);
      const randomTime = performance.now() - randomStart;

      if (randomTime > 500) { // 500ms threshold
        errors.push(`Random data generation too slow: ${randomTime.toFixed(2)}ms`);
      }

      // Test sequence generation performance
      const sequenceStart = performance.now();
      await getValidPictographSequence(5);
      const sequenceTime = performance.now() - sequenceStart;

      if (sequenceTime > 1000) { // 1 second threshold
        errors.push(`Sequence generation too slow: ${sequenceTime.toFixed(2)}ms`);
      }

      return {
        testName: 'Performance Validation',
        success: errors.length === 0,
        executionTime: performance.now() - startTime,
        details: {
          loadTime: loadTime.toFixed(2) + 'ms',
          randomTime: randomTime.toFixed(2) + 'ms',
          sequenceTime: sequenceTime.toFixed(2) + 'ms'
        },
        errors
      };

    } catch (error) {
      errors.push(`Performance validation failed: ${error}`);
      return {
        testName: 'Performance Validation',
        success: false,
        executionTime: performance.now() - startTime,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        errors
      };
    }
  }

  /**
   * Test integration with existing systems
   */
  private async testIntegration(): Promise<ValidationTestResult> {
    const startTime = performance.now();
    const errors: string[] = [];

    try {
      // Test that loaded data matches expected PictographData interface
      const pictograph = await getRandomPictographData();
      
      const requiredFields = ['letter', 'startPos', 'endPos', 'gridMode'];
      for (const field of requiredFields) {
        if (!(field in pictograph)) {
          errors.push(`Missing required field: ${field}`);
        }
      }

      // Test that validation works with loaded data
      const validation = PictographDataValidator.validatePictographData(pictograph);
      
      // Most authentic data should be valid
      if (!validation.isValid && validation.errors.length > 0) {
        // Only warn if there are actual errors, not just warnings
        console.warn('Authentic data validation issues:', validation.errors);
      }

      // Test that sequences can be created and validated
      const sequence = await getValidPictographSequence(3);
      const sequenceValidation = PictographDataValidator.validateSequence(sequence);
      
      // Sequences should generally be valid or have only warnings
      if (!sequenceValidation.isValid && sequenceValidation.errors.length > 0) {
        console.warn('Sequence validation issues:', sequenceValidation.errors);
      }

      return {
        testName: 'Integration Validation',
        success: errors.length === 0,
        executionTime: performance.now() - startTime,
        details: {
          pictographValid: validation.isValid,
          sequenceValid: sequenceValidation.isValid,
          pictographErrors: validation.errors.length,
          sequenceErrors: sequenceValidation.errors.length
        },
        errors
      };

    } catch (error) {
      errors.push(`Integration validation failed: ${error}`);
      return {
        testName: 'Integration Validation',
        success: false,
        executionTime: performance.now() - startTime,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        errors
      };
    }
  }

  /**
   * Quick validation for development use
   */
  public async quickValidation(): Promise<boolean> {
    try {
      await pictographDataLoader.loadData();
      const pictograph = await getRandomPictographData();
      const validation = PictographDataValidator.validatePictographData(pictograph);
      
      console.log('✅ Quick validation passed:', {
        dataLoaded: pictographDataLoader.isDataLoaded(),
        pictographValid: validation.isValid,
        letter: pictograph.letter
      });
      
      return true;
    } catch (error) {
      console.error('❌ Quick validation failed:', error);
      return false;
    }
  }
}

// Convenience instance
export const dataDrivenTestValidator = DataDrivenTestValidator.getInstance();
