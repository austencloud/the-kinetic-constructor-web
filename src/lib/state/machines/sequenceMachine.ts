/**
 * Sequence State Machine
 *
 * Manages the sequence generation process and related operations.
 */

import {
	createMachine,
	assign,
	fromCallback,
	type EventObject // Base type for events
} from 'xstate';
import { stateRegistry } from '../core/registry';
import { sequenceStore } from '../stores/sequenceStore';
import type { BeatData as StoreBeatData, SequenceState } from '../stores/sequenceStore';
import {
	type GenerateSequenceInput,
	type SequenceGenerationOptions,
	type FreeformSequenceOptions,
	convertToStoreBeatData
} from './sequenceMachine.types';

// Context for the sequence state machine
export interface SequenceMachineContext {
	error: string | null;
	isGenerating: boolean;
	generationProgress: number;
	generationMessage: string;
	generationType: 'circular' | 'freeform';
	generationOptions: SequenceGenerationOptions | FreeformSequenceOptions;
	// Add field for result if needed, or handle in updateSequence action
	// generatedSequence: any | null;
}

// Events for the sequence state machine
export type SequenceMachineEvent =
	// Generation events
	| {
			type: 'GENERATE';
			options: SequenceGenerationOptions | FreeformSequenceOptions;
			generationType: 'circular' | 'freeform';
	  }
	| { type: 'UPDATE_PROGRESS'; progress: number; message: string } // Sent by actor
	| { type: 'GENERATION_COMPLETE'; output: any[] } // Sent by actor on success
	| { type: 'GENERATION_ERROR'; error: string } // Sent by actor on failure (optional)
	| { type: 'CANCEL' }
	| { type: 'RETRY' }
	| { type: 'RESET' }

	// Beat manipulation events
	| { type: 'SELECT_BEAT'; beatId: string }
	| { type: 'DESELECT_BEAT'; beatId?: string } // Optional beatId, if not provided, deselects all
	| { type: 'ADD_BEAT'; beat: Partial<StoreBeatData> }
	| { type: 'REMOVE_BEAT'; beatId: string }
	| { type: 'REMOVE_BEAT_AND_FOLLOWING'; beatId: string }
	| { type: 'UPDATE_BEAT'; beatId: string; updates: Partial<StoreBeatData> }
	| { type: 'CLEAR_SEQUENCE' };

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
			// generatedSequence: null,
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
					// Removed onDone and onError - handled by events now
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
								// generatedSequence: ({ event }) => event.output, // Store result if needed
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
				// Removed exit assignment, handled by event transitions now
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
			updateSequence: ({ event }) => {
				// Type assertion for the custom event
				const doneEvent = event as { type: 'GENERATION_COMPLETE'; output?: any[] };

				// Update the sequence store with the generated beats
				if (doneEvent.output && Array.isArray(doneEvent.output)) {
					// Convert the output to the store's BeatData format
					const storeBeats = convertToStoreBeatData(doneEvent.output);
					sequenceStore.setSequence(storeBeats);
					console.log('Sequence updated with new data:', storeBeats);
				}
			},

			// Beat manipulation actions
			selectBeat: ({ event }) => {
				const selectEvent = event as { type: 'SELECT_BEAT'; beatId: string };
				sequenceStore.selectBeat(selectEvent.beatId);

				// Dispatch a custom event for components that need to know about selection changes
				if (typeof document !== 'undefined') {
					const selectionEvent = new CustomEvent('beat-selected', {
						detail: { beatId: selectEvent.beatId },
						bubbles: true
					});
					document.dispatchEvent(selectionEvent);
				}
			},

			deselectBeat: ({ event }) => {
				const deselectEvent = event as { type: 'DESELECT_BEAT'; beatId?: string };

				if (deselectEvent.beatId) {
					// Deselect a specific beat
					sequenceStore.deselectBeat(deselectEvent.beatId);
				} else {
					// Deselect all beats
					sequenceStore.clearSelection();
				}

				// Dispatch a custom event
				if (typeof document !== 'undefined') {
					const selectionEvent = new CustomEvent('beat-deselected', {
						detail: { beatId: deselectEvent.beatId },
						bubbles: true
					});
					document.dispatchEvent(selectionEvent);
				}
			},

			addBeat: ({ event }) => {
				const addEvent = event as { type: 'ADD_BEAT'; beat: Partial<StoreBeatData> };

				// Generate a unique ID if not provided
				const beatId = addEvent.beat.id || crypto.randomUUID();

				// Create a complete beat object
				const newBeat: StoreBeatData = {
					id: beatId,
					number: addEvent.beat.number || 0,
					...addEvent.beat
				};

				// Add the beat to the sequence store
				sequenceStore.addBeat(newBeat);

				// Dispatch a custom event
				if (typeof document !== 'undefined') {
					const beatEvent = new CustomEvent('beat-added', {
						detail: { beat: newBeat },
						bubbles: true
					});
					document.dispatchEvent(beatEvent);
				}
			},

			removeBeat: ({ event }) => {
				const removeEvent = event as { type: 'REMOVE_BEAT'; beatId: string };
				sequenceStore.removeBeat(removeEvent.beatId);

				// Dispatch a custom event
				if (typeof document !== 'undefined') {
					const beatEvent = new CustomEvent('beat-removed', {
						detail: { beatId: removeEvent.beatId },
						bubbles: true
					});
					document.dispatchEvent(beatEvent);
				}
			},

			removeBeatAndFollowing: ({ event }) => {
				const removeEvent = event as { type: 'REMOVE_BEAT_AND_FOLLOWING'; beatId: string };

				// Get the current beats
				let currentState: SequenceState | undefined;
				sequenceStore.subscribe((state) => {
					currentState = state;
				})();

				if (!currentState) return;

				const beats = currentState.beats;

				// Find the index of the beat to remove
				const beatIndex = beats.findIndex((beat: StoreBeatData) => beat.id === removeEvent.beatId);

				if (beatIndex >= 0) {
					// Get all beats that should be removed (the selected beat and all following beats)
					const beatsToRemove = beats.slice(beatIndex).map((beat: StoreBeatData) => beat.id);

					// Remove each beat
					beatsToRemove.forEach((id: string) => {
						sequenceStore.removeBeat(id);
					});

					// Dispatch a custom event
					if (typeof document !== 'undefined') {
						const sequenceUpdatedEvent = new CustomEvent('sequence-updated', {
							detail: { type: 'beats-removed', fromIndex: beatIndex },
							bubbles: true
						});
						document.dispatchEvent(sequenceUpdatedEvent);
					}
				}
			},

			updateBeat: ({ event }) => {
				const updateEvent = event as {
					type: 'UPDATE_BEAT';
					beatId: string;
					updates: Partial<StoreBeatData>;
				};
				sequenceStore.updateBeat(updateEvent.beatId, updateEvent.updates);

				// Dispatch a custom event
				if (typeof document !== 'undefined') {
					const beatEvent = new CustomEvent('beat-updated', {
						detail: { beatId: updateEvent.beatId, updates: updateEvent.updates },
						bubbles: true
					});
					document.dispatchEvent(beatEvent);
				}
			},

			clearSequence: () => {
				// Set an empty sequence
				sequenceStore.setSequence([]);

				// Dispatch a custom event
				if (typeof document !== 'undefined') {
					const sequenceUpdatedEvent = new CustomEvent('sequence-updated', {
						detail: { type: 'sequence-cleared' },
						bubbles: true
					});
					document.dispatchEvent(sequenceUpdatedEvent);
				}
			}
		},
		actors: {
			// Sequence generation actor
			generateSequenceActor: fromCallback<SequenceMachineEvent, GenerateSequenceInput>(
				({ sendBack, input }) => {
					console.log(
						`Generating ${input.generationType} sequence with options:`,
						input.generationOptions
					);

					// Import the appropriate generator based on the type
					(async () => {
						try {
							// Start with initial progress update
							sendBack({
								type: 'UPDATE_PROGRESS',
								progress: 10,
								message: `Initializing ${input.generationType} sequence generation...`
							});

							// Small delay to ensure the progress update is processed
							await new Promise((resolve) => setTimeout(resolve, 10));

							// Dynamically import the appropriate generator
							let generatedSequence: any[] = [];

							if (input.generationType === 'circular') {
								// Import circular sequence generator
								const { createCircularSequence } = await import(
									'../../components/GenerateTab/circular/createCircularSequence'
								);

								sendBack({
									type: 'UPDATE_PROGRESS',
									progress: 30,
									message: 'Creating circular sequence pattern...'
								});

								// Generate the sequence - use type assertion to handle type mismatch
								const circularOptions = input.generationOptions as any;
								generatedSequence = await createCircularSequence(circularOptions);
							} else {
								// Import freeform sequence generator
								const { createFreeformSequence } = await import(
									'../../components/GenerateTab/Freeform/createFreeformSequence'
								);

								sendBack({
									type: 'UPDATE_PROGRESS',
									progress: 30,
									message: 'Creating freeform sequence pattern...'
								});

								// Generate the sequence - use type assertion to handle type mismatch
								const freeformOptions = input.generationOptions as any;
								generatedSequence = await createFreeformSequence(freeformOptions);
							}

							// Final progress update
							sendBack({
								type: 'UPDATE_PROGRESS',
								progress: 90,
								message: 'Finalizing sequence...'
							});

							// Send completion event with the generated sequence
							sendBack({
								type: 'GENERATION_COMPLETE',
								output: generatedSequence
							});
						} catch (error) {
							// Handle any errors during generation
							const errorMessage =
								error instanceof Error ? error.message : 'Unknown error during sequence generation';
							console.error('Sequence generation error:', error);

							// Send error event
							sendBack({
								type: 'GENERATION_ERROR',
								error: errorMessage
							});
						}
					})();

					// Return cleanup function
					return () => {
						// Any cleanup if needed
					};
				} // End of callback function
			) // End of fromCallback
		} // End of actors object
	} // End of machine options
); // End of createMachine

// Create and register the sequence actor
export const sequenceActor = stateRegistry.registerMachine('sequence', sequenceMachine, {
	persist: false,
	description: 'Manages sequence generation and related operations'
});

// Helper functions to interact with the sequence machine
export const sequenceActions = {
	// Generation actions
	generate: (options: any, type: 'circular' | 'freeform' = 'circular') => {
		// Validate and convert options to the correct type
		let validOptions: SequenceGenerationOptions | FreeformSequenceOptions;

		if (type === 'circular') {
			validOptions = {
				capType: options.capType || 'mirrored',
				numBeats: options.numBeats || 8,
				turnIntensity: options.turnIntensity || 3,
				propContinuity: options.propContinuity || 'continuous'
			};
		} else {
			validOptions = {
				numBeats: options.numBeats || 8,
				turnIntensity: options.turnIntensity || 3,
				propContinuity: options.propContinuity || 'continuous',
				letterTypes: options.letterTypes || []
			};
		}

		sequenceActor.send({ type: 'GENERATE', options: validOptions, generationType: type });
	},
	cancel: () => {
		sequenceActor.send({ type: 'CANCEL' });
	},
	retry: () => {
		sequenceActor.send({ type: 'RETRY' });
	},
	reset: () => {
		sequenceActor.send({ type: 'RESET' });
	},

	// Beat manipulation actions
	selectBeat: (beatId: string) => {
		sequenceActor.send({ type: 'SELECT_BEAT', beatId });
	},
	deselectBeat: (beatId?: string) => {
		sequenceActor.send({ type: 'DESELECT_BEAT', beatId });
	},
	addBeat: (beat: Partial<StoreBeatData>) => {
		sequenceActor.send({ type: 'ADD_BEAT', beat });
	},
	removeBeat: (beatId: string) => {
		sequenceActor.send({ type: 'REMOVE_BEAT', beatId });
	},
	removeBeatAndFollowing: (beatId: string) => {
		sequenceActor.send({ type: 'REMOVE_BEAT_AND_FOLLOWING', beatId });
	},
	updateBeat: (beatId: string, updates: Partial<StoreBeatData>) => {
		sequenceActor.send({ type: 'UPDATE_BEAT', beatId, updates });
	},
	clearSequence: () => {
		sequenceActor.send({ type: 'CLEAR_SEQUENCE' });
	}
};

// Helper functions to get current state
export const sequenceSelectors = {
	// Generation selectors
	isGenerating: () => {
		return sequenceActor.getSnapshot().matches('generating');
	},
	hasError: () => {
		return sequenceActor.getSnapshot().matches('error');
	},
	error: () => {
		return sequenceActor.getSnapshot().context.error;
	},
	progress: () => {
		return sequenceActor.getSnapshot().context.generationProgress;
	},
	message: () => {
		return sequenceActor.getSnapshot().context.generationMessage;
	},
	generationMessage: () => {
		return sequenceActor.getSnapshot().context.generationMessage;
	},
	generationType: () => {
		return sequenceActor.getSnapshot().context.generationType;
	},
	generationOptions: () => {
		return sequenceActor.getSnapshot().context.generationOptions;
	},

	// Beat selectors (using sequenceStore)
	selectedBeatIds: () => {
		let selectedIds: string[] = [];
		sequenceStore.subscribe((state) => {
			selectedIds = state.selectedBeatIds;
		})();
		return selectedIds;
	},

	selectedBeats: () => {
		let selected: StoreBeatData[] = [];
		sequenceStore.subscribe((state) => {
			selected = state.beats.filter((beat) => state.selectedBeatIds.includes(beat.id));
		})();
		return selected;
	},

	currentBeatIndex: () => {
		let index = 0;
		sequenceStore.subscribe((state) => {
			index = state.currentBeatIndex;
		})();
		return index;
	},

	beats: () => {
		let beats: StoreBeatData[] = [];
		sequenceStore.subscribe((state) => {
			beats = state.beats;
		})();
		return beats;
	},

	beatCount: () => {
		let count = 0;
		sequenceStore.subscribe((state) => {
			count = state.beats.length;
		})();
		return count;
	}
};
