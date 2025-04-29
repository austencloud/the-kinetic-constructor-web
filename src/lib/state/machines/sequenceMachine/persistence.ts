/**
 * Persistence functionality for the sequence state machine
 */
import { sequenceStore } from '../../stores/sequenceStore';
import { isSequenceEmpty } from '$lib/stores/sequence/sequenceStateStore';
import { selectedStartPos } from '$lib/stores/sequence/selectionStore';
import { pictographStore } from '$lib/state/stores/pictograph/pictograph.store';
import type { Actor } from 'xstate';

/**
 * Initialize persistence by loading backup data
 */
export function initializePersistence(sequenceActor: Actor<any>) {
  if (typeof window === 'undefined') return;

  // Try to load the sequence backup
  try {
    const backupData = localStorage.getItem('sequence_backup');
    if (backupData) {
      const backup = JSON.parse(backupData);
      console.log('Found sequence backup with beats:', backup.beats?.length);

      // Restore the beats to the sequence store
      if (backup.beats && Array.isArray(backup.beats) && backup.beats.length > 0) {
        console.log('Restoring beats from backup');
        sequenceStore.setSequence(backup.beats);

        // Set isSequenceEmpty to false to show the Option Picker
        isSequenceEmpty.set(false);

        // Extract the start position from the first beat (if it exists)
        if (backup.beats[0] && backup.beats[0].pictographData) {
          console.log('Restoring start position from backup');

          // Create a deep copy to avoid reference issues
          const startPosCopy = JSON.parse(JSON.stringify(backup.beats[0].pictographData));

          // Update the selectedStartPos store
          selectedStartPos.set(startPosCopy);

          // Also update the pictographStore
          pictographStore.setData(startPosCopy);

          console.log('Start position restored from backup:', startPosCopy);

          // Dispatch a custom event to notify components
          if (typeof document !== 'undefined') {
            const event = new CustomEvent('start-position-selected', {
              detail: { startPosition: startPosCopy },
              bubbles: true
            });
            document.dispatchEvent(event);
            console.log('Dispatched start-position-selected event');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading sequence backup:', error);
  }

  // Subscribe to state changes to save backup
  sequenceActor.subscribe((state) => {
    console.log('Sequence actor state changed:', state.context);
    // Save the state to localStorage manually as a backup
    try {
      // Get the current beats from the sequence store
      let beats: any[] = [];
      sequenceStore.subscribe((state) => {
        beats = state.beats;
      })();

      localStorage.setItem(
        'sequence_backup',
        JSON.stringify({
          beats: beats,
          options: state.context.generationOptions
        })
      );
      console.log('Saved sequence backup with beats:', beats.length);
    } catch (error) {
      console.error('Error saving sequence backup:', error);
    }
  });
}
