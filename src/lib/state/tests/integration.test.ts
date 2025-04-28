/**
 * State Management Integration Tests
 *
 * These tests verify that different parts of the state management system
 * work together correctly.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get, type Unsubscriber } from 'svelte/store';
import { waitFor } from 'xstate';
import { stateRegistry } from '../core/registry';
import { createStore, createPersistentStore } from '../core/store';
import { resetAllState } from '../core/testing';
import { initializeStateManagement } from '..';
import { gridStore } from '../stores/grid';
import { pictographStore } from '../stores/pictograph';
import { sequenceStore } from '../stores/sequenceStore';
import { createMachine, assign } from 'xstate';

describe('State Management Integration', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.useFakeTimers();
		// Mock localStorage
		vi.stubGlobal('localStorage', {
			getItem: vi.fn(),
			setItem: vi.fn(),
			removeItem: vi.fn(),
			clear: vi.fn()
		});

		// Reset all state before each test
		resetAllState();
	});

	afterEach(() => {
		// Clean up after each test
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	describe('Machine-to-Store Communication', () => {
		it('updates stores when machines dispatch events', async () => {
			// Create a test store that will be updated by the machine
			const testStore = createStore('testStore', { value: 0 }, (set) => ({
				setValue: (value: number) => set({ value })
			}));

			// Create a test machine that will update the store
			const testMachine = createMachine(
				{
					id: 'testMachine',
					initial: 'idle',
					context: { value: 0 },
					states: {
						idle: {
							on: { INCREMENT: { actions: 'incrementValue' } }
						}
					}
				},
				{
					actions: {
						incrementValue: assign({
							value: ({ context }) => context.value + 1
						})
					}
				}
			);

			// Register the machine with the registry
			const actor = stateRegistry.registerMachine('testMachine', testMachine);

			// Set up an effect to sync the machine state with the store
			const subscription = actor.subscribe((state) => {
				testStore.setValue(state.context.value);
			});

			// Trigger an event on the machine
			actor.send({ type: 'INCREMENT' });

			// Check that the store was updated
			expect(get(testStore).value).toBe(1);

			// Send another event
			actor.send({ type: 'INCREMENT' });

			// Check that the store was updated again
			expect(get(testStore).value).toBe(2);

			// Clean up
			subscription.unsubscribe();
		});

		it('updates machines when stores change', async () => {
			// Create a test store
			const testStore = createStore<
				{ command: string | null },
				{ setCommand: (command: string) => void }
			>('controlStore', { command: null }, (set) => ({
				setCommand: (command: string) => set({ command })
			}));

			// Create a test machine that will react to store changes
			const testMachine = createMachine({
				id: 'reactingMachine',
				initial: 'idle',
				context: { lastCommand: null as string | null },
				types: {} as {
					context: { lastCommand: string | null };
					events: { type: 'STORE_UPDATED'; command: string };
				},
				states: {
					idle: {
						on: {
							STORE_UPDATED: {
								actions: assign({
									lastCommand: ({ event }) => event.command
								})
							}
						}
					}
				}
			});

			// Register the machine with the registry
			const actor = stateRegistry.registerMachine('reactingMachine', testMachine);

			// Set up an effect to send store updates to the machine
			const unsubscribe = testStore.subscribe((state) => {
				if (state.command) {
					actor.send({ type: 'STORE_UPDATED', command: state.command });
				}
			});

			// Update the store
			testStore.setCommand('test-command');

			// Check that the machine received the update
			expect(actor.getSnapshot().context.lastCommand).toBe('test-command');

			// Clean up
			unsubscribe();
		});
	});

	describe('State Synchronization', () => {
		it('synchronizes related stores through derived selectors', () => {
			// Create two related stores
			const sourceStore = createStore<{ count: number }, { increment: () => void }>(
				'sourceStore',
				{ count: 0 },
				(set, update) => ({
					increment: () => update((state) => ({ count: state.count + 1 }))
				})
			);

			const derivedStore = createStore<
				{ doubledCount: number },
				{ setDoubledCount: (value: number) => void }
			>('derivedStore', { doubledCount: 0 }, (set) => ({
				setDoubledCount: (value: number) => set({ doubledCount: value })
			}));

			// Set up synchronization
			const unsubscribe = sourceStore.subscribe((state) => {
				derivedStore.setDoubledCount(state.count * 2);
			});

			// Trigger an update in the source store
			sourceStore.increment();

			// Check that the derived store was updated
			expect(get(derivedStore).doubledCount).toBe(2);

			// Update again
			sourceStore.increment();

			// Check synchronization
			expect(get(derivedStore).doubledCount).toBe(4);

			// Clean up
			unsubscribe();
		});

		it('synchronizes machine state with multiple dependent stores', async () => {
			interface AppContext {
				data: Record<string, any> | null;
				error: string | null;
				isLoading: boolean;
			}

			interface LoadedEvent {
				type: 'LOADED';
				data: Record<string, any>;
			}

			interface ErrorEvent {
				type: 'ERROR';
				message: string;
			}

			interface UpdateEvent {
				type: 'UPDATE';
				updates: Record<string, any>;
			}

			type AppEvent =
				| LoadedEvent
				| ErrorEvent
				| UpdateEvent
				| { type: 'RELOAD' }
				| { type: 'RETRY' };

			// Create a machine that tracks application state
			const appStateMachine = createMachine({
				id: 'appState',
				initial: 'loading',
				context: {
					data: null,
					error: null,
					isLoading: true
				},
				types: {} as {
					context: AppContext;
					events: AppEvent;
				},
				states: {
					loading: {
						on: {
							LOADED: {
								target: 'ready',
								actions: assign({
									data: ({ event }) => event.data,
									isLoading: false
								})
							},
							ERROR: {
								target: 'error',
								actions: assign({
									error: ({ event }) => event.message,
									isLoading: false
								})
							}
						}
					},
					ready: {
						on: {
							UPDATE: {
								actions: assign({
									data: ({ event, context }) => ({ ...context.data, ...event.updates })
								})
							},
							RELOAD: {
								target: 'loading',
								actions: assign({ isLoading: true })
							}
						}
					},
					error: {
						on: {
							RETRY: {
								target: 'loading',
								actions: assign({
									error: null,
									isLoading: true
								})
							}
						}
					}
				}
			});

			// Register the machine
			const appActor = stateRegistry.registerMachine('appState', appStateMachine);

			// Create dependent stores
			const loadingStore = createStore<
				{ isLoading: boolean },
				{ setLoading: (isLoading: boolean) => void }
			>('loadingStore', { isLoading: true }, (set) => ({
				setLoading: (isLoading: boolean) => set({ isLoading })
			}));

			const dataStore = createStore<
				{ currentData: Record<string, any> | null },
				{ setData: (data: Record<string, any>) => void }
			>('dataStore', { currentData: null }, (set) => ({
				setData: (data: Record<string, any>) => set({ currentData: data })
			}));

			const errorStore = createStore<
				{ currentError: string | null },
				{ setError: (error: string | null) => void }
			>('errorStore', { currentError: null }, (set) => ({
				setError: (error: string | null) => set({ currentError: error })
			}));

			// Set up synchronization
			const subscription = appActor.subscribe((state) => {
				loadingStore.setLoading(state.context.isLoading);

				if (state.context.data) {
					dataStore.setData(state.context.data);
				}

				if (state.context.error) {
					errorStore.setError(state.context.error);
				} else {
					errorStore.setError(null);
				}
			});

			// Simulate loading completion
			appActor.send({
				type: 'LOADED',
				data: { id: 123, name: 'Test Item' }
			});

			// Check store synchronization
			expect(get(loadingStore).isLoading).toBe(false);
			expect(get(dataStore).currentData).toEqual({ id: 123, name: 'Test Item' });
			expect(get(errorStore).currentError).toBeNull();

			// Simulate an error
			appActor.send({
				type: 'RELOAD'
			});

			appActor.send({
				type: 'ERROR',
				message: 'Failed to load data'
			});

			// Check error state synchronization
			expect(get(loadingStore).isLoading).toBe(false);
			expect(get(errorStore).currentError).toBe('Failed to load data');

			// Clean up
			subscription.unsubscribe();
		});
	});

	describe('Dependency-Aware Initialization', () => {
		it('initializes state containers in the correct order based on dependencies', () => {
			const initOrder: string[] = [];

			// Create stores with dependencies
			const baseStore = createStore<{ isInitialized: boolean }, { initialize: () => void }>(
				'baseStore',
				{ isInitialized: false },
				(set) => ({
					initialize: () => {
						initOrder.push('baseStore');
						set({ isInitialized: true });
					}
				})
			);

			const dependentStore1 = createStore<{ isInitialized: boolean }, { initialize: () => void }>(
				'dependentStore1',
				{ isInitialized: false },
				(set) => ({
					initialize: () => {
						// Should only initialize after baseStore
						if (get(baseStore).isInitialized) {
							initOrder.push('dependentStore1');
							set({ isInitialized: true });
						}
					}
				})
			);

			const dependentStore2 = createStore<{ isInitialized: boolean }, { initialize: () => void }>(
				'dependentStore2',
				{ isInitialized: false },
				(set) => ({
					initialize: () => {
						// Should only initialize after dependentStore1
						if (get(dependentStore1).isInitialized) {
							initOrder.push('dependentStore2');
							set({ isInitialized: true });
						}
					}
				})
			);

			// Register dependencies
			stateRegistry.addDependency('dependentStore1', 'baseStore');
			stateRegistry.addDependency('dependentStore2', 'dependentStore1');

			// Get initialization order
			const orderFromRegistry = stateRegistry.getInitializationOrder();

			// Verify order includes all stores
			expect(orderFromRegistry).toContain('baseStore');
			expect(orderFromRegistry).toContain('dependentStore1');
			expect(orderFromRegistry).toContain('dependentStore2');

			// Verify order is correct
			const baseIndex = orderFromRegistry.indexOf('baseStore');
			const dep1Index = orderFromRegistry.indexOf('dependentStore1');
			const dep2Index = orderFromRegistry.indexOf('dependentStore2');

			expect(baseIndex).toBeLessThan(dep1Index);
			expect(dep1Index).toBeLessThan(dep2Index);

			// Simulate initialization in registry order
			orderFromRegistry.forEach((id) => {
				// Call each store's initialize method
				switch (id) {
					case 'baseStore':
						baseStore.initialize();
						break;
					case 'dependentStore1':
						dependentStore1.initialize();
						break;
					case 'dependentStore2':
						dependentStore2.initialize();
						break;
				}
			});

			// Verify all stores were initialized
			expect(get(baseStore).isInitialized).toBe(true);
			expect(get(dependentStore1).isInitialized).toBe(true);
			expect(get(dependentStore2).isInitialized).toBe(true);

			// Verify initialization order was correct
			expect(initOrder).toEqual(['baseStore', 'dependentStore1', 'dependentStore2']);
		});
	});

	describe('Error Propagation and Recovery', () => {
		it('handles errors in one store without breaking others', () => {
			// Create a store that will throw an error
			const erroringStore = createStore<
				{ count: number },
				{ increment: () => void; triggerError: () => void }
			>('erroringStore', { count: 0 }, (set, update) => ({
				increment: () => update((state) => ({ count: state.count + 1 })),
				triggerError: () => {
					throw new Error('Test error');
				}
			}));

			// Create a dependent store
			const dependentStore = createStore<
				{ sourceCount: number },
				{ updateFromSource: (count: number) => void }
			>('dependentStore', { sourceCount: 0 }, (set) => ({
				updateFromSource: (count: number) => set({ sourceCount: count })
			}));

			// Set up synchronization
			const unsubscribe = erroringStore.subscribe((state) => {
				// This should continue to work even after errors
				dependentStore.updateFromSource(state.count);
			});

			// Normal operation
			erroringStore.increment();
			expect(get(dependentStore).sourceCount).toBe(1);

			// Trigger error but catch it
			expect(() => erroringStore.triggerError()).toThrow();

			// Store should still function after error
			erroringStore.increment();
			expect(get(erroringStore).count).toBe(2);
			expect(get(dependentStore).sourceCount).toBe(2);

			// Clean up
			unsubscribe();
		});

		it('recovers from persistence errors without data loss', () => {
			// Mock localStorage to simulate errors
			let shouldThrow = false;
			const mockSetItem = vi.fn((key, value) => {
				if (shouldThrow) {
					throw new DOMException('Quota exceeded', 'QuotaExceededError');
				}
			});

			vi.stubGlobal('localStorage', {
				getItem: vi.fn(),
				setItem: mockSetItem,
				removeItem: vi.fn(),
				clear: vi.fn()
			});

			interface PersistentData {
				important: string;
				nonEssential: string;
			}

			// Create a persistent store
			const persistentStore = createPersistentStore<PersistentData>(
				'persistentTestStore',
				{
					important: 'critical data',
					nonEssential: 'extra data'
				},
				{
					// Prioritize important fields
					persistFields: ['important']
				}
			);

			// Update the store normally
			persistentStore.update((state) => ({
				...state,
				important: 'updated critical data',
				nonEssential: 'updated extra data'
			}));

			// Run timers to trigger debounced persistence
			vi.runAllTimers();

			// Verify persistence happened
			expect(mockSetItem).toHaveBeenCalled();

			// Now simulate quota exceeded error
			shouldThrow = true;

			// The next update should handle the error gracefully
			persistentStore.update((state) => ({
				...state,
				important: 'newer critical data'
			}));

			// Run timers
			vi.runAllTimers();

			// Store should still have the updated data in memory even if persistence failed
			expect(get(persistentStore)).toEqual({
				important: 'newer critical data',
				nonEssential: 'updated extra data'
			});
		});
	});

	describe('Complete Application Flows', () => {

		it('handles interactions between grid and pictograph stores as in the existing test', async () => {
			// Increase timeout for this test
			vi.useRealTimers(); // Use real timers for async operations
			// Initialize state management
			initializeStateManagement();

			// Mock the parseGridCoordinates function
			vi.mock('$lib/components/objects/Grid/gridUtils', () => ({
				parseGridCoordinates: vi.fn(() => ({
					handPoints: { normal: {}, strict: {} },
					layer2Points: { normal: {}, strict: {} },
					outerPoints: {},
					centerPoint: { coordinates: { x: 0, y: 0 } },
					mode: 'diamond'
				}))
			}));

			// Load grid data
			await gridStore.loadData();

			// Set pictograph data
			pictographStore.setData({
				letter: null,
				startPos: null,
				endPos: null,
				timing: null,
				direction: null,
				gridMode: 'diamond',
				gridData: null,
				blueMotionData: null,
				redMotionData: null,
				redPropData: null,
				bluePropData: null,
				redArrowData: null,
				blueArrowData: null,
				grid: ''
			});

			// Update grid component loaded
			pictographStore.updateComponentLoaded('grid');

			// Verify that the pictograph store was updated
			const pictographState = get(pictographStore);
			expect(pictographState.components.grid).toBe(true);
			expect(pictographState.loadProgress).toBeGreaterThan(0);
		});
	});
});
