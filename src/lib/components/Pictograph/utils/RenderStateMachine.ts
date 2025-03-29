// src/lib/components/Pictograph/utils/RenderStateMachine.ts
import { Logger } from '$lib/utils/Logger';

export enum RenderState {
	INITIALIZING = 'initializing',
	LOADING = 'loading',
	GRID_READY = 'grid_ready',
	COMPONENTS_READY = 'components_ready',
	POSITIONING = 'positioning',
	COMPLETE = 'complete',
	ERROR = 'error',
	TIMEOUT = 'timeout'
}

export enum RenderEvent {
	INIT_START = 'init_start',
	GRID_READY = 'grid_ready',
	COMPONENTS_LOADED = 'components_loaded',
	START_POSITIONING = 'start_positioning',
	POSITIONING_COMPLETE = 'positioning_complete',
	ERROR_OCCURRED = 'error_occurred',
	TIMEOUT = 'timeout',
	INCOMPLETE_DATA = 'incomplete_data',
	RETRY = 'retry',
	RESET = 'reset'
}

type StateTransition = {
	[key in RenderEvent]?: RenderState;
};

type StateMachineConfig = {
	[key in RenderState]: StateTransition;
};

const STATE_TRANSITIONS: StateMachineConfig = {
	[RenderState.INITIALIZING]: {
		[RenderEvent.INIT_START]: RenderState.LOADING,
		[RenderEvent.ERROR_OCCURRED]: RenderState.ERROR,
		[RenderEvent.TIMEOUT]: RenderState.TIMEOUT,
		[RenderEvent.RESET]: RenderState.INITIALIZING
	},
	[RenderState.LOADING]: {
		[RenderEvent.GRID_READY]: RenderState.GRID_READY,
		[RenderEvent.ERROR_OCCURRED]: RenderState.ERROR,
		[RenderEvent.TIMEOUT]: RenderState.TIMEOUT,
		[RenderEvent.INCOMPLETE_DATA]: RenderState.COMPLETE,
		[RenderEvent.RESET]: RenderState.INITIALIZING
	},
	[RenderState.GRID_READY]: {
		[RenderEvent.COMPONENTS_LOADED]: RenderState.COMPONENTS_READY,
		[RenderEvent.ERROR_OCCURRED]: RenderState.ERROR,
		[RenderEvent.TIMEOUT]: RenderState.TIMEOUT,
		[RenderEvent.INCOMPLETE_DATA]: RenderState.COMPLETE,
		[RenderEvent.RESET]: RenderState.INITIALIZING
	},
	[RenderState.COMPONENTS_READY]: {
		[RenderEvent.START_POSITIONING]: RenderState.POSITIONING,
		[RenderEvent.POSITIONING_COMPLETE]: RenderState.COMPLETE,
		[RenderEvent.ERROR_OCCURRED]: RenderState.ERROR,
		[RenderEvent.TIMEOUT]: RenderState.TIMEOUT,
		[RenderEvent.RESET]: RenderState.INITIALIZING
	},
	[RenderState.POSITIONING]: {
		[RenderEvent.POSITIONING_COMPLETE]: RenderState.COMPLETE,
		[RenderEvent.ERROR_OCCURRED]: RenderState.ERROR,
		[RenderEvent.TIMEOUT]: RenderState.TIMEOUT,
		[RenderEvent.RESET]: RenderState.INITIALIZING
	},
	[RenderState.COMPLETE]: {
		[RenderEvent.RESET]: RenderState.INITIALIZING
	},
	[RenderState.ERROR]: {
		[RenderEvent.RETRY]: RenderState.INITIALIZING,
		[RenderEvent.RESET]: RenderState.INITIALIZING
	},
	[RenderState.TIMEOUT]: {
		[RenderEvent.RETRY]: RenderState.INITIALIZING,
		[RenderEvent.RESET]: RenderState.INITIALIZING
	}
};

export type StateChangeHandler = (
	newState: RenderState,
	prevState: RenderState,
	event: RenderEvent,
	payload?: any
) => void;

export class RenderStateMachine {
	private currentState: RenderState;
	private stateChangeHandlers: StateChangeHandler[] = [];
	private stateHistory: Array<{ state: RenderState; event: RenderEvent; timestamp: number }> = [];
	private logger = new Logger('RenderStateMachine');

	constructor(initialState: RenderState = RenderState.INITIALIZING) {
		this.currentState = initialState;
		this.recordStateChange(initialState, RenderEvent.RESET);
		this.logger.debug(`State machine initialized in state: ${initialState}`);
	}

	public getState(): RenderState {
		return this.currentState;
	}

	public transition(event: RenderEvent, payload?: any): boolean {
		const transitions = STATE_TRANSITIONS[this.currentState];
		const nextState = transitions[event];

		if (nextState === undefined) {
			this.logger.warn(`Invalid state transition: ${event} not allowed from ${this.currentState}`);
			return false;
		}

		const prevState = this.currentState;
		this.currentState = nextState;

		// Record this transition
		this.recordStateChange(nextState, event);

		// Notify all state change handlers
		this.stateChangeHandlers.forEach((handler) => {
			try {
				handler(nextState, prevState, event, payload);
			} catch (error) {
				this.logger.error('Error in state change handler', error);
			}
		});

		this.logger.debug(`State transition: ${prevState} → ${nextState} (${event})`);
		return true;
	}

	private recordStateChange(state: RenderState, event: RenderEvent): void {
		this.stateHistory.push({
			state,
			event,
			timestamp: Date.now()
		});

		// Keep history at a reasonable size
		if (this.stateHistory.length > 100) {
			this.stateHistory.shift();
		}
	}

	public onStateChange(handler: StateChangeHandler): () => void {
		this.stateChangeHandlers.push(handler);

		// Return a function to remove this handler
		return () => {
			this.removeStateChangeHandler(handler);
		};
	}

	public removeStateChangeHandler(handler: StateChangeHandler): void {
		this.stateChangeHandlers = this.stateChangeHandlers.filter((h) => h !== handler);
	}

	public isInState(...states: RenderState[]): boolean {
		return states.includes(this.currentState);
	}

	public getStateHistory(): Array<{ state: RenderState; event: RenderEvent; timestamp: number }> {
		return [...this.stateHistory];
	}

	public getTimeInCurrentState(): number {
		if (this.stateHistory.length === 0) {
			return 0;
		}
		const lastTransition = this.stateHistory[this.stateHistory.length - 1];
		return Date.now() - lastTransition.timestamp;
	}

	public reset(): void {
		this.transition(RenderEvent.RESET);
	}
}

// Singleton state machine instance
let stateMachineInstance: RenderStateMachine | null = null;

export function getStateMachine(): RenderStateMachine {
	if (!stateMachineInstance) {
		stateMachineInstance = new RenderStateMachine();
	}
	return stateMachineInstance;
}
