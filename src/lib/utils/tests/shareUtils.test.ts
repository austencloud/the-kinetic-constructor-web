/**
 * Test utilities for shareUtils.ts
 * These functions can be used to test the URL parameter encoding/decoding system
 */
import type { BeatData } from '$lib/state/stores/sequence/SequenceContainer';
import { testSequenceUrlEncoding } from '$lib/utils/shareUtils';

/**
 * Generate a test sequence with the specified number of beats
 * @param numBeats Number of beats to generate
 * @returns A test sequence with the specified number of beats
 */
export function generateTestSequence(numBeats: number): BeatData[] {
  // Create a start position beat
  const startPosBeat: BeatData = {
    id: `beat-start-test`,
    number: 0,
    letter: '',
    position: 'alpha5',
    orientation: '',
    turnsTuple: '',
    redPropData: null,
    bluePropData: null,
    redArrowData: null,
    blueArrowData: null,
    redMotionData: {
      id: `motion-start-red-test`,
      color: 'red',
      motionType: 'static',
      startLoc: 's',
      endLoc: 's',
      startOri: 'in',
      endOri: 'in',
      propRotDir: 'no_rot',
      turns: 0,
      handRotDir: 'static',
      leadState: 'leading',
      prefloatMotionType: null,
      prefloatPropRotDir: null
    },
    blueMotionData: {
      id: `motion-start-blue-test`,
      color: 'blue',
      motionType: 'static',
      startLoc: 's',
      endLoc: 's',
      startOri: 'in',
      endOri: 'in',
      propRotDir: 'no_rot',
      turns: 0,
      handRotDir: 'static',
      leadState: 'leading',
      prefloatMotionType: null,
      prefloatPropRotDir: null
    },
    metadata: {
      isStartPosition: true,
      startPos: 'alpha5',
      endPos: 'alpha5'
    }
  };

  // Create regular beats
  const beats: BeatData[] = [startPosBeat];

  for (let i = 1; i <= numBeats; i++) {
    const beat: BeatData = {
      id: `beat-test-${i}`,
      number: i,
      letter: String.fromCharCode(64 + (i % 26) + 1), // A, B, C, ...
      position: 'alpha5',
      orientation: '',
      turnsTuple: '',
      redPropData: null,
      bluePropData: null,
      redArrowData: null,
      blueArrowData: null,
      redMotionData: {
        id: `motion-red-test-${i}`,
        color: 'red',
        motionType: i % 2 === 0 ? 'anti' : 'pro',
        startLoc: 's',
        endLoc: i % 2 === 0 ? 'e' : 'w',
        startOri: 'in',
        endOri: 'in',
        propRotDir: i % 2 === 0 ? 'cw' : 'ccw',
        turns: i % 3 === 0 ? 1 : 0.5,
        handRotDir: i % 2 === 0 ? 'cw_shift' : 'ccw_shift',
        leadState: 'leading',
        prefloatMotionType: null,
        prefloatPropRotDir: null
      },
      blueMotionData: {
        id: `motion-blue-test-${i}`,
        color: 'blue',
        motionType: i % 2 === 0 ? 'pro' : 'anti',
        startLoc: 's',
        endLoc: i % 2 === 0 ? 'w' : 'e',
        startOri: 'in',
        endOri: 'in',
        propRotDir: i % 2 === 0 ? 'ccw' : 'cw',
        turns: i % 4 === 0 ? 1.5 : 0.5,
        handRotDir: i % 2 === 0 ? 'ccw_shift' : 'cw_shift',
        leadState: 'leading',
        prefloatMotionType: null,
        prefloatPropRotDir: null
      },
      metadata: {
        letter: String.fromCharCode(64 + (i % 26) + 1),
        startPos: 'alpha5',
        endPos: i % 2 === 0 ? 'beta1' : 'beta5'
      }
    };

    beats.push(beat);
  }

  return beats;
}

/**
 * Run a test of the URL parameter encoding/decoding system
 * @param numBeats Number of beats to test with
 * @returns Test results
 */
export function runUrlEncodingTest(numBeats: number = 5) {
  // Generate a test sequence
  const testSequence = generateTestSequence(numBeats);
  
  // Test the encoding/decoding
  return testSequenceUrlEncoding(testSequence);
}

// Export a function that can be called from the browser console
if (typeof window !== 'undefined') {
  (window as any).testShareUtils = {
    generateTestSequence,
    runUrlEncodingTest
  };
  
  console.log('Share utils test utilities initialized. Access via window.testShareUtils in the console.');
}
