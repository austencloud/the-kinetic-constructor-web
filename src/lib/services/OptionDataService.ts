import type { PictographData } from '$lib/types/PictographData';
import type { BeatData } from '$lib/components/SequenceWorkbench/SequenceBeatFrame/BeatData';
import { LetterType } from '$lib/types/LetterType';
import { NO_ROT } from '$lib/types/Constants';
import { LetterUtils } from '$lib/utils/LetterUtils';
import pictographDataStore from '$lib/stores/pictograph/pictographStore';
import { get } from 'svelte/store';

export class OptionDataService {
  static getNextOptions(sequence: PictographData[]): PictographData[] {
    if (!sequence || sequence.length === 0) {
      return this.getInitialOptions();
    }
    
    const lastBeat = sequence[sequence.length - 1];
    const nextOptions = this.findNextOptions(lastBeat);
    return nextOptions;
  }
  
  private static getInitialOptions(): PictographData[] {
    // This would typically fetch options for the beginning of a sequence
    // For now returning empty array as per original implementation
    return [];
  }
  
  private static findNextOptions(lastBeat: PictographData): PictographData[] {
    if (!lastBeat || !lastBeat.endPos) {
      console.warn('Missing last beat or end position');
      return [];
    }
    
    // Get the end position from the last beat - this will be used to find matching starts
    const targetStartPos = lastBeat.endPos;
    
    // Get all available pictograph data from the store
    const allPictographs = get(pictographDataStore);
    
    if (!Array.isArray(allPictographs) || allPictographs.length === 0) {
      console.warn('No pictographs available in store');
      return [];
    }
    
    // Filter pictographs where startPos matches targetStartPos
    const matchingOptions = allPictographs.filter(pictograph => {
      // Ensure the pictograph is valid and has a startPos
      if (!pictograph || !pictograph.startPos) return false;
      
      // Compare positions - we could do exact match or pattern-based match
      // Exact match:
      const isMatch = pictograph.startPos === targetStartPos;
      
      // If needed, we could also do a pattern match that ignores numbers
      // For example, if targetStartPos is 'alpha1' and pictograph.startPos is 'alpha2'
      // const baseTargetPos = targetStartPos.replace(/\d+/g, '');
      // const baseStartPos = pictograph.startPos.replace(/\d+/g, '');
      // const isPatternMatch = baseTargetPos === baseStartPos;
      
      return isMatch;
    });
    
    return matchingOptions;
  }
  
  static determineReversalFilter(
    sequence: PictographData[],
    option: PictographData
  ): 'continuous' | 'one_reversal' | 'two_reversals' {
    const blueContinuous = this.checkColorContinuity(sequence, option, 'blue');
    const redContinuous = this.checkColorContinuity(sequence, option, 'red');
    if (blueContinuous && redContinuous) {
      return 'continuous';
    } else if (blueContinuous || redContinuous) {
      return 'one_reversal';
    }
    return 'two_reversals';
  }
  
  private static checkColorContinuity(
    sequence: PictographData[],
    option: PictographData,
    color: 'blue' | 'red'
  ): boolean {
    const motionDataKey = color === 'blue' ? 'blueMotionData' : 'redMotionData';
    const lastRotation = this.findLastRotation(sequence, color);
    const currentRotation = option[motionDataKey]?.propRotDir || NO_ROT;
    return (
      lastRotation === NO_ROT || currentRotation === NO_ROT || lastRotation === currentRotation
    );
  }
  
  private static findLastRotation(sequence: PictographData[], color: 'blue' | 'red'): string {
    const motionDataKey = color === 'blue' ? 'blueMotionData' : 'redMotionData';
    for (let i = sequence.length - 1; i >= 0; i--) {
      const rotation = sequence[i][motionDataKey]?.propRotDir;
      if (rotation && rotation !== NO_ROT) {
        return rotation;
      }
    }
    return NO_ROT;
  }
  
  static getLetterNumber(letter: string): number {
    const parsedLetter = LetterUtils.tryFromString(letter);
    const letterType = parsedLetter ? LetterType.getLetterType(parsedLetter) : null;
    if (!letterType) return 1;
    switch (letterType.folderName) {
      case 'Type1':
        return 1;
      case 'Type2':
        return 2;
      case 'Type3':
        return 3;
      case 'Type4':
        return 4;
      case 'Type5':
        return 5;
      case 'Type6':
        return 6;
      default:
        return 1;
    }
  }
}