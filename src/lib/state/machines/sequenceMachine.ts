/**
 * Sequence State Machine
 *
 * Manages the sequence generation process and related operations.
 */

import {
	createMachine,
	assign,
	fromCallback,
	type EventObject, // Base type for events
} from 'xstate';
// Removed import for InvokeCallback
import { stateRegistry } from '../core/registry';

// Context for the sequence state machine
export interface SequenceMachineContext {
	error: string | null;
	isGenerating: boolean;
	generationProgress: number;
	generationMessage: string;
	generationType: 'circular' | 'freeform';
	generationOptions: Record<string, any>;
	// Add field for result if needed, or handle in updateSequence action
	// generatedSequence: any | null;
}

// Events for the sequence state machine
export type SequenceMachineEvent =
	| { type: 'GENERATE'; options: Record<string, any>; generationType: 'circular' | 'freeform' }
	| { type: 'UPDATE_PROGRESS'; progress: number; message: string } // Sent by actor
	| { type: 'GENERATION_COMPLETE'; output: any } // Sent by actor on success
	| { type: 'GENERATION_ERROR'; error: string } // Sent by actor on failure (optional)
	| { type: 'CANCEL' }
	| { type: 'RETRY' }
	| { type: 'RESET' };

// Define the type for the input passed to the actor
interface GenerateSequenceInput {
	generationType: 'circular' | 'freeform';
	generationOptions: Record<string, any>;
}

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
			generationOptions: {}
			// generatedSequence: null,
		},
		initial: 'idle',
		states: {
			idle: {
				on: {
					GENERATE: {
						target: 'generating',
						actions: assign({
							generationType: ({ event }) => event.generationType,
							generationOptions: ({ event }) => event.options
						})
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
					}),
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
					CANCEL: { // Allow cancellation while generating
						target: 'idle',
						actions: assign({
							isGenerating: false,
							generationProgress: 0,
							generationMessage: ''
						})
					}
				},
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
			// Keep your original action logic
			updateSequence: ({ event }) => {
				// Type assertion for the custom event
				const doneEvent = event as { type: 'GENERATION_COMPLETE'; output?: any };
				// This will be implemented to update the sequence store/state elsewhere
				console.log('Sequence updated with new data:', doneEvent.output);
			}
		},
		actors: {
			// Using standard fromCallback structure with properly typed parameters
			generateSequenceActor: fromCallback<SequenceMachineEvent, GenerateSequenceInput>(
				({ sendBack, receive, input }) => {
					// 'input' is correctly typed here
					console.log(`Generating ${input.generationType} sequence with options:`, input.generationOptions);

					// Simulate generation process
					let progress = 0;
					const interval = setInterval(() => {
						progress += 10;

						// Send progress updates back to parent machine
						// Type checking relies on inference from machine types
						sendBack({
							type: 'UPDATE_PROGRESS',
							progress,
							message: `Generating ${input.generationType} sequence (${progress}%)...`
						});

						if (progress >= 100) {
							clearInterval(interval);

							// Simulate success and send completion event
							const mockOutput = [
								{ id: '1', number: 1 },
								{ id: '2', number: 2 },
								{ id: '3', number: 3 },
								{ id: '4', number: 4 }
							];
							// Type checking relies on inference from machine types
							sendBack({
								type: 'GENERATION_COMPLETE',
								output: mockOutput
							});
						}
					}, 300); // Simulate async work

					// Return cleanup function
					return () => {
						console.log('Cleaning up generateSequenceActor interval');
						clearInterval(interval);
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

// Helper functions to interact with the sequence machine (no changes needed here)
export const sequenceActions = {
	generate: (options: Record<string, any>, type: 'circular' | 'freeform' = 'circular') => {
		sequenceActor.send({ type: 'GENERATE', options, generationType: type });
	},
	cancel: () => {
		sequenceActor.send({ type: 'CANCEL' });
	},
	retry: () => {
		sequenceActor.send({ type: 'RETRY' });
	},
	reset: () => {
		sequenceActor.send({ type: 'RESET' });
	}
};

// Helper functions to get current state (no changes needed here)
export const sequenceSelectors = {
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
	}
};
