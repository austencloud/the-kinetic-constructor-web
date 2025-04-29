/**
 * Sequence State Machine
 *
 * Manages the sequence generation process and related operations.
 */

import { createMachine, assign } from 'xstate';
import { stateRegistry } from '../../core/registry';

// Import from our modules
import type { 
  SequenceMachineContext, 
  SequenceMachineEvent, 
  GenerateSequenceInput,
  SequenceGenerationOptions,
  FreeformSequenceOptions
} from './types';
import { 
  updateSequence, 
  selectBeat, 
  deselectBeat, 
  addBeat, 
  removeBeat, 
  removeBeatAndFollowing, 
  updateBeat, 
  clearSequence 
} from './actions';
import { generateSequenceActor } from './actors';
import { createSequenceSelectors } from './selectors';
import { createSequenceActions } from './helpers';
import { initializePersistence } from './persistence';

// Re-export types for external use
export * from './types';

// Define the sequence machine
export const sequenceMachine = createMachine(
  {
    id: 'sequence',
    // Ensure machine types are correctly defined for inference
    types: {} as {
      context: SequenceMachineContext;
      events: SequenceMachineEvent;
      input: GenerateSequenceInput; // Define input type for the machine/actor
    },
    context: {
      error: null,
      isGenerating: false,
      generationProgress: 0,
      generationMessage: '',
      generationType: 'circular',
      generationOptions: {
        capType: 'mirrored',
        numBeats: 8,
        turnIntensity: 3,
        propContinuity: 'continuous'
      }
    },
    initial: 'idle',
    states: {
      idle: {
        on: {
          // Generation events
          GENERATE: {
            target: 'generating',
            actions: assign({
              generationType: ({ event }) => event.generationType,
              generationOptions: ({ event }) => event.options
            })
          },

          // Beat manipulation events
          SELECT_BEAT: {
            actions: 'selectBeat'
          },
          DESELECT_BEAT: {
            actions: 'deselectBeat'
          },
          ADD_BEAT: {
            actions: 'addBeat'
          },
          REMOVE_BEAT: {
            actions: 'removeBeat'
          },
          REMOVE_BEAT_AND_FOLLOWING: {
            actions: 'removeBeatAndFollowing'
          },
          UPDATE_BEAT: {
            actions: 'updateBeat'
          },
          CLEAR_SEQUENCE: {
            actions: 'clearSequence'
          }
        }
      },
      generating: {
        entry: assign({
          isGenerating: true,
          generationProgress: 0,
          generationMessage: 'Initializing sequence generation...',
          error: null // Clear previous errors
        }),
        invoke: {
          src: 'generateSequenceActor',
          // Pass required context via input - ensure it matches GenerateSequenceInput
          input: ({ context }): GenerateSequenceInput => ({
            generationType: context.generationType,
            generationOptions: context.generationOptions
          })
        },
        on: {
          UPDATE_PROGRESS: {
            actions: assign({
              generationProgress: ({ event }) => event.progress,
              generationMessage: ({ event }) => event.message
            })
          },
          // Handle completion event from actor
          GENERATION_COMPLETE: {
            target: 'idle',
            actions: [
              'updateSequence', // Call the action defined below
              assign({
                generationProgress: 100,
                generationMessage: 'Sequence generation complete',
                isGenerating: false // Ensure flag is reset
              })
            ]
          },
          // Handle potential error event from actor
          GENERATION_ERROR: {
            target: 'error',
            actions: assign({
              error: ({ event }) => event.error,
              isGenerating: false
            })
          },
          CANCEL: {
            // Allow cancellation while generating
            target: 'idle',
            actions: assign({
              isGenerating: false,
              generationProgress: 0,
              generationMessage: ''
            })
          }
        }
      },
      error: {
        on: {
          RETRY: { target: 'generating' }, // Resend necessary context via invoke input
          RESET: {
            target: 'idle',
            actions: assign({
              error: null,
              generationProgress: 0,
              generationMessage: ''
            })
          }
        }
      }
    }
  },
  {
    actions: {
      // Update the sequence store with the generated sequence
      updateSequence,

      // Beat manipulation actions
      selectBeat,
      deselectBeat,
      addBeat,
      removeBeat,
      removeBeatAndFollowing,
      updateBeat,
      clearSequence
    },
    actors: {
      // Sequence generation actor
      generateSequenceActor
    }
  }
);

// Create and register the sequence actor
export const sequenceActor = stateRegistry.registerMachine('sequence', sequenceMachine, {
  persist: true,
  description: 'Manages sequence generation and related operations'
});

// Log that the sequence actor has been registered
console.log('Sequence actor registered with persist:', true);

// Initialize persistence
if (typeof window !== 'undefined') {
  initializePersistence(sequenceActor);
}

// Create and export helper functions and selectors
export const sequenceActions = createSequenceActions(sequenceActor);
export const sequenceSelectors = createSequenceSelectors(sequenceActor);
