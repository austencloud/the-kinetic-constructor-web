/**
 * Machine Factory - Svelte 5 Runes Implementation
 * Provides machine creation utilities
 */

export { createModernMachine, createMachineContainer, createSupervisedMachine } from './stateMachine';

// Re-export for compatibility
export type { MachineConfig, MachineContainer } from './stateMachine';
