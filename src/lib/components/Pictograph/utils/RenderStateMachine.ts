// src/lib/components/Pictograph/utils/RenderStateMachine.ts
import { Logger } from '$lib/utils/Logger';

/**
 * All possible render states for the Pictograph component
 */
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

/**
 * Events that can trigger state transitions
 */
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

/**
 * Type for state transition definitions
 */
type StateTransition = {
  [key in RenderEvent]?: RenderState;
};

/**
 * Type for the state machine configuration
 */
type StateMachineConfig = {
  [key in RenderState]: StateTransition;
};

/**
 * State machine configuration defining all valid state transitions
 */
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

/**
 * Handler type for state change events
 */
export type StateChangeHandler = (
  newState: RenderState, 
  prevState: RenderState, 
  event: RenderEvent,
  payload?: any
) => void;

/**
 * Manages state transitions for the Pictograph render lifecycle.
 * Ensures only valid state transitions can occur and notifies listeners of changes.
 */
export class RenderStateMachine {
  private currentState: RenderState;
  private stateChangeHandlers: StateChangeHandler[] = [];
  private stateHistory: Array<{state: RenderState, event: RenderEvent, timestamp: number}> = [];
  private logger = new Logger('RenderStateMachine');
  
  /**
   * Creates a new render state machine starting in the INITIALIZING state.
   */
  constructor(initialState: RenderState = RenderState.INITIALIZING) {
    this.currentState = initialState;
    this.recordStateChange(initialState, RenderEvent.RESET);
    this.logger.debug(`State machine initialized in state: ${initialState}`);
  }
  
  /**
   * Gets the current render state.
   */
  public getState(): RenderState {
    return this.currentState;
  }
  
  /**
   * Triggers a state transition if valid for the given event.
   * @param event - The event triggering the transition
   * @param payload - Optional data to pass to state change handlers
   * @returns true if transition was successful, false if invalid
   */
  public transition(event: RenderEvent, payload?: any): boolean {
    const transitions = STATE_TRANSITIONS[this.currentState];
    const nextState = transitions[event];
    
    if (nextState === undefined) {
      this.logger.warn(
        `Invalid state transition: ${event} not allowed from ${this.currentState}`
      );
      return false;
    }
    
    const prevState = this.currentState;
    this.currentState = nextState;
    
    // Record this transition
    this.recordStateChange(nextState, event);
    
    // Notify all state change handlers
    this.stateChangeHandlers.forEach(handler => {
      try {
        handler(nextState, prevState, event, payload);
      } catch (error) {
        this.logger.error('Error in state change handler', error);
      }
    });
    
    this.logger.debug(`State transition: ${prevState} → ${nextState} (${event})`);
    return true;
  }
  
  /**
   * Records state change in history for debugging
   */
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
  
  /**
   * Adds a handler to be called on state changes.
   * @param handler - Function to call when state changes
   * @returns A function to remove this handler
   */
  public onStateChange(handler: StateChangeHandler): () => void {
    this.stateChangeHandlers.push(handler);
    
    // Return a function to remove this handler
    return () => {
      this.removeStateChangeHandler(handler);
    };
  }
  
  /**
   * Removes a previously added state change handler.
   * @param handler - Handler to remove
   */
  public removeStateChangeHandler(handler: StateChangeHandler): void {
    this.stateChangeHandlers = this.stateChangeHandlers.filter(h => h !== handler);
  }
  
  /**
   * Checks if the current state is one of the specified states.
   * @param states - States to check against
   */
  public isInState(...states: RenderState[]): boolean {
    return states.includes(this.currentState);
  }
  
  /**
   * Returns state history for debugging
   */
  public getStateHistory(): Array<{state: RenderState, event: RenderEvent, timestamp: number}> {
    return [...this.stateHistory];
  }
  
  /**
   * Gets the duration in milliseconds the machine has been in the current state
   */
  public getTimeInCurrentState(): number {
    if (this.stateHistory.length === 0) {
      return 0;
    }
    const lastTransition = this.stateHistory[this.stateHistory.length - 1];
    return Date.now() - lastTransition.timestamp;
  }
  
  /**
   * Resets the state machine to its initial state.
   */
  public reset(): void {
    this.transition(RenderEvent.RESET);
  }
}

// Singleton state machine instance
let stateMachineInstance: RenderStateMachine | null = null;

/**
 * Gets the singleton instance of the state machine
 */
export function getStateMachine(): RenderStateMachine {
  if (!stateMachineInstance) {
    stateMachineInstance = new RenderStateMachine();
  }
  return stateMachineInstance;
}