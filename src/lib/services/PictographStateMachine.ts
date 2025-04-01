// src/lib/services/PictographStateMachine.ts
import type { PictographData } from '$lib/types/PictographData';

export type PictographState =
	| 'idle' // Initial, no data loaded
	| 'initializing' // Starting to load components
	| 'grid_loading' // Grid is being loaded
	| 'props_loading' // Props are being loaded
	| 'arrows_loading' // Arrows are being loaded
	| 'complete' // All components loaded successfully
	| 'error'; // An error occurred during loading

export interface PictographStateTransition {
	from: PictographState;
	to: PictographState;
	reason?: string;
	timestamp: number;
}

export class PictographStateMachine {
	private currentState: PictographState = 'idle';
	private stateHistory: PictographStateTransition[] = [];
	private data: PictographData | null = null;
	private loadedComponents = new Set<string>();
	private errorDetails: {
		message: string;
		component?: string;
		timestamp: number;
	} | null = null;

	/**
	 * Transition to a new state with minimal logging and warnings
	 * @param newState Target state
	 * @param reason Optional reason for state change
	 */
	transitionTo(newState: PictographState, reason?: string): void {
		// Always allow transitions to error state or back to idle
		if (newState === this.currentState) return;

		const transition: PictographStateTransition = {
			from: this.currentState,
			to: newState,
			reason,
			timestamp: Date.now()
		};

		// Limit history to last 10 transitions
		if (this.stateHistory.length >= 10) {
			this.stateHistory.shift();
		}
		this.stateHistory.push(transition);

		// Update current state with minimal logging
		this.currentState = newState;
	}

	/**
	 * Mark a component as loaded
	 * @param componentName Name of the loaded component
	 */
	markComponentLoaded(componentName: string): void {
		this.loadedComponents.add(componentName);

		// Determine next state based on loaded components
		if (this.isAllComponentsLoaded()) {
			this.transitionTo('complete', 'All components loaded');
		}
	}

	/**
	 * Check if all required components are loaded
	 */
	private isAllComponentsLoaded(): boolean {
		const requiredComponents = ['grid', 'redProp', 'blueProp', 'redArrow', 'blueArrow'];

		return requiredComponents.every((component) => 
			this.loadedComponents.has(component) || 
			this.currentState === 'complete'
		);
	}

	/**
	 * Handle loading error
	 * @param message Error message
	 * @param component Optional component that caused the error
	 */
	handleError(message: string, component?: string): void {
		this.errorDetails = {
			message,
			component,
			timestamp: Date.now()
		};
		this.transitionTo('error', message);
	}

	/**
	 * Reset the state machine
	 */
	reset(): void {
		this.currentState = 'idle';
		this.stateHistory = [];
		this.data = null;
		this.loadedComponents.clear();
		this.errorDetails = null;
	}

	/**
	 * Get current state
	 */
	getCurrentState(): PictographState {
		return this.currentState;
	}

	/**
	 * Get error details
	 */
	getErrorDetails() {
		return this.errorDetails;
	}

	/**
	 * Get load progress
	 */
	getLoadProgress(): number {
		const requiredComponents = ['grid', 'redProp', 'blueProp', 'redArrow', 'blueArrow'];

		const loadedCount = requiredComponents.filter((component) =>
			this.loadedComponents.has(component)
		).length;

		return Math.floor((loadedCount / requiredComponents.length) * 100);
	}

	/**
	 * Get state transition history
	 */
	getStateHistory(): PictographStateTransition[] {
		return [...this.stateHistory];
	}
}

// Optional: Create a singleton instance
export const pictographStateMachine = new PictographStateMachine();