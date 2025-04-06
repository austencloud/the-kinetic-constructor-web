// src/lib/components/OptionPicker/services/OptionsService.ts
import type { PictographData } from '$lib/types/PictographData';
import type { SortMethod, ReversalFilter, LayoutCategory } from '../config';
import { getLayoutCategory } from '../config';
import { NO_ROT } from '$lib/types/Constants';
import type { PropRotDir } from '$lib/types/Types';
import type { Letter } from '$lib/types/Letter';
import { LetterType } from '$lib/types/LetterType';
import { LetterUtils } from '$lib/utils/LetterUtils';
import pictographDataStore from '$lib/stores/pictograph/pictographStore';
import { get } from 'svelte/store';
import { memoizeLRU } from '$lib/utils/memoizationUtils';

export class OptionsService {
  // ===== Option Data Functions =====

  /**
   * Gets the next possible pictograph options based on the last pictograph in a sequence
   */
  static getNextOptions(sequence: PictographData[]): PictographData[] {
    const lastPictograph = sequence.at(-1);
    
    // If the sequence is empty, return initial options
    if (!lastPictograph) {
      return this.getInitialOptions();
    }
    
    // Find options where the start position matches the end position of the last pictograph
    return this.findOptionsByStartPosition(lastPictograph.endPos ?? undefined);
  }
  
  /**
   * Provides the initial set of options when no sequence exists yet
   */
  private static getInitialOptions(): PictographData[] {
    console.log('Fetching initial options (currently none).');
    return [];
  }
  
  /**
   * Finds all pictographs from the global store that start at a specific position
   */
  private static findOptionsByStartPosition(targetStartPos?: string): PictographData[] {
    if (!targetStartPos) {
      console.warn('Cannot find next options: Last pictograph has no end position.');
      return [];
    }
    
    const allPictographs = get(pictographDataStore);
    
    if (!Array.isArray(allPictographs) || allPictographs.length === 0) {
      console.warn('No pictographs available in the global store.');
      return [];
    }
    
    return allPictographs.filter(
      (pictograph) => pictograph?.startPos === targetStartPos
    );
  }

  // ===== Reversal Functions =====
  
  /**
   * Determines the reversal category of an option relative to the current sequence
   */
  static determineReversalCategory = memoizeLRU(
    (sequence: PictographData[], option: PictographData): Exclude<ReversalFilter, 'all'> => {
      const blueContinuous = this.checkColorContinuity(sequence, option, 'blue');
      const redContinuous = this.checkColorContinuity(sequence, option, 'red');
      
      if (blueContinuous && redContinuous) return 'continuous';
      if (blueContinuous || redContinuous) return 'oneReversal';
      return 'twoReversals';
    },
    100,
    (sequence, option) => {
      const lastItem = sequence[sequence.length - 1];
      return `${sequence.length}:${lastItem?.letter || 'empty'}:${option.letter || 'unknown'}:${option.startPos || ''}:${option.endPos || ''}`;
    }
  );
  
  /**
   * Finds the last non-static rotation direction for a given color in the sequence
   */
  private static findLastRotation = memoizeLRU(
    (sequence: PictographData[], color: 'blue' | 'red'): PropRotDir => {
      const motionDataKey = color === 'blue' ? 'blueMotionData' : 'redMotionData';
      
      for (let i = sequence.length - 1; i >= 0; i--) {
        const rotation = sequence[i]?.[motionDataKey]?.propRotDir;
        if (rotation && rotation !== NO_ROT) {
          return rotation;
        }
      }
      return NO_ROT;
    },
    50,
    (sequence, color) => {
      const relevantItems = sequence.slice(-5);
      return `${color}:${relevantItems
        .map((item) => `${item.letter || ''}${item.startPos || ''}${item.endPos || ''}`)
        .join(',')}`;
    }
  );
  
  /**
   * Checks if the rotation direction for a specific color is continuous
   */
  private static checkColorContinuity(
    sequence: PictographData[],
    option: PictographData,
    color: 'blue' | 'red'
  ): boolean {
    const motionDataKey = color === 'blue' ? 'blueMotionData' : 'redMotionData';
    const lastRotation = this.findLastRotation(sequence, color);
    const currentRotation = option[motionDataKey]?.propRotDir ?? NO_ROT;
    
    return (
      lastRotation === NO_ROT || 
      currentRotation === NO_ROT || 
      lastRotation === currentRotation
    );
  }

  // ===== Grouping & Sorting Functions =====
  
  /**
   * Determines the appropriate group key for an option based on sort method
   */
  static determineGroupKey(
    option: PictographData,
    sortMethod: SortMethod,
    sequence: PictographData[] = []
  ): string {
    switch (sortMethod) {
      case 'type':
        const parsedLetter = LetterUtils.tryFromString((option.letter as Letter) ?? undefined);
        const letterType = parsedLetter ? LetterType.getLetterType(parsedLetter) : null;
        return letterType?.folderName ?? 'Unknown Type';
        
      case 'endPosition':
        const endPos = option.endPos ?? 'Unknown';
        const match = endPos.match(/^([a-zA-Z]+)/);
        return match ? match[1] : endPos;
        
      case 'reversals':
        const reversalCategory = this.determineReversalCategory(sequence, option);
        const categoryLabels = {
          continuous: 'Continuous',
          oneReversal: 'One Reversal',
          twoReversals: 'Two Reversals'
        };
        return categoryLabels[reversalCategory];
        
      default:
        return 'Unknown Group';
    }
  }
  
  /**
   * Sorts group keys in the appropriate order based on sort method
   */
  static getSortedGroupKeys(keys: string[], sortMethod: SortMethod): string[] {
    return keys.sort((a, b) => {
      if (sortMethod === 'type') {
        const typeNumA = parseInt(a.match(/Type(\d)/)?.[1] ?? '99');
        const typeNumB = parseInt(b.match(/Type(\d)/)?.[1] ?? '99');
        if (typeNumA !== typeNumB) return typeNumA - typeNumB;
        return a.localeCompare(b);
      }
      
      if (sortMethod === 'reversals') {
        const reversalOrder: Record<string, number> = {
          Continuous: 0,
          'One Reversal': 1,
          'Two Reversals': 2
        };
        return (reversalOrder[a] ?? 99) - (reversalOrder[b] ?? 99);
      }
      
      return a.localeCompare(b);
    });
  }
  
  /**
   * Gets a sorter function for the specified sort method
   */
  static getSorter(method: SortMethod, sequence: PictographData[] = []) {
    switch (method) {
      case 'type':
        return this.getTypeSorter();
      case 'endPosition':
        return this.getEndPositionSorter();
      case 'reversals':
        return this.getReversalSorter(sequence);
      default:
        return this.getDefaultSorter();
    }
  }
  
  /**
   * Sorter for type-based sorting
   */
  private static getTypeSorter() {
    return (a: PictographData, b: PictographData) => {
      const typeA = this.getLetterTypeNumber(a.letter ?? undefined);
      const typeB = this.getLetterTypeNumber(b.letter ?? undefined);
      if (typeA !== typeB) return typeA - typeB;
      return (a.letter ?? '').localeCompare(b.letter ?? '');
    };
  }
  
  /**
   * Sorter for end position based sorting
   */
  private static getEndPositionSorter() {
    return (a: PictographData, b: PictographData) => 
      (a.endPos ?? '').localeCompare(b.endPos ?? '');
  }
  
  /**
   * Sorter for reversal-based sorting
   */
  private static getReversalSorter(sequence: PictographData[]) {
    return (a: PictographData, b: PictographData) => {
      const reversalA = this.determineReversalCategory(sequence, a);
      const reversalB = this.determineReversalCategory(sequence, b);
      
      const reversalOrder = {
        continuous: 0,
        oneReversal: 1,
        twoReversals: 2
      };
      
      return reversalOrder[reversalA] - reversalOrder[reversalB];
    };
  }
  
  /**
   * Default sorter (alphabetical by letter)
   */
  private static getDefaultSorter() {
    return (a: PictographData, b: PictographData) => 
      (a.letter ?? '').localeCompare(b.letter ?? '');
  }
  
  /**
   * Gets the numerical type (1-6) associated with a letter
   */
  static getLetterTypeNumber(letter?: Letter | string): number {
    if (!letter) return 1;
    
    const parsedLetter = LetterUtils.tryFromString(letter as Letter);
    if (!parsedLetter) return 1;
    
    const letterType = LetterType.getLetterType(parsedLetter);
    if (!letterType?.folderName) return 1;
    
    const typeMatch = letterType.folderName.match(/Type(\d)/);
    return typeMatch ? parseInt(typeMatch[1], 10) : 1;
  }
}