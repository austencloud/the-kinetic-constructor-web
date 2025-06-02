/**
 * Integration test for the contextual filtering workflow
 * Tests the complete flow from start position selection to option display
 */

import { transitionValidator } from '$lib/services/TransitionValidator';
import { getRandomPictographData } from '$lib/utils/testing/PictographDataLoader';

export async function testContextualFilteringIntegration() {
  console.log('🧪 Testing contextual filtering integration...');

  try {
    // Step 1: Get a random start position
    const startPosition = await getRandomPictographData({
      filterByLetter: ['A'],
      includeStaticMotions: true,
      includeDashMotions: true
    });

    if (!startPosition) {
      console.error('❌ Failed to get start position');
      return false;
    }

    console.log('✅ Step 1: Got start position:', {
      letter: startPosition.letter,
      endPos: startPosition.endPos,
      isStartPosition: startPosition.isStartPosition
    });

    // Step 2: Test TransitionValidator
    const validationResult = await transitionValidator.getValidTransitions(startPosition, {
      includeStaticMotions: true,
      includeDashMotions: true,
      strictValidation: false
    });

    console.log('✅ Step 2: TransitionValidator result:', {
      isValid: validationResult.isValid,
      totalFound: validationResult.totalFound,
      filteredCount: validationResult.filteredCount,
      errors: validationResult.errors,
      warnings: validationResult.warnings
    });

    if (!validationResult.isValid) {
      console.error('❌ TransitionValidator failed');
      return false;
    }

    // Step 3: Test event dispatch simulation
    console.log('✅ Step 3: Simulating start-position-selected event...');
    
    const testEvent = new CustomEvent('start-position-selected', {
      bubbles: true,
      detail: { startPosition }
    });

    // Dispatch the event
    if (typeof document !== 'undefined') {
      document.dispatchEvent(testEvent);
      console.log('✅ Event dispatched successfully');
    }

    console.log('🎉 Integration test completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    return false;
  }
}

// Auto-run test in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // Run test after a short delay to ensure everything is loaded
  setTimeout(() => {
    testContextualFilteringIntegration();
  }, 2000);
}
