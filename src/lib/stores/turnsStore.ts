// stores/turnsStore.ts
import { writable, derived } from 'svelte/store';

// Define clear types
export type TurnsValue = number | 'fl';
export type Direction = 'clockwise' | 'counterclockwise' | null;

interface TurnsState {
  blue: {
    turns: TurnsValue;
    direction: Direction;
  };
  red: {
    turns: TurnsValue;
    direction: Direction;
  };
}

// Initial state
const initialState: TurnsState = {
  blue: { turns: 0, direction: null },
  red: { turns: 0, direction: null }
};

// Create the main store
const turnsState = writable<TurnsState>(initialState);

// Pure utility functions
export const parseTurnsValue = (value: TurnsValue): number => {
  return value === 'fl' ? -0.5 : Number(value);
};

export const displayTurnsValue = (n: number): TurnsValue => {
  return n === -0.5 ? 'fl' : n;
};

export const isMinTurns = (value: TurnsValue): boolean => {
  return parseTurnsValue(value) <= -0.5;
};

export const isMaxTurns = (value: TurnsValue): boolean => {
  return parseTurnsValue(value) >= 3;
};

// Derived stores for convenient access
export const blueTurns = derived(turnsState, $state => $state.blue);
export const redTurns = derived(turnsState, $state => $state.red);

// Action creators
export const turnsStore = {
  setTurns: (color: 'blue' | 'red', turns: TurnsValue) => {
    turnsState.update(state => ({
      ...state,
      [color]: { ...state[color], turns }
    }));
  },
  
  setDirection: (color: 'blue' | 'red', direction: Direction) => {
    turnsState.update(state => ({
      ...state,
      [color]: { ...state[color], direction }
    }));
  },
  
  incrementTurns: (color: 'blue' | 'red') => {
    turnsState.update(state => {
      const currentValue = state[color].turns;
      const numericValue = parseTurnsValue(currentValue);
      const newValue = Math.min(3, numericValue + 0.5);
      return {
        ...state,
        [color]: { ...state[color], turns: displayTurnsValue(newValue) }
      };
    });
  },
  
  decrementTurns: (color: 'blue' | 'red') => {
    turnsState.update(state => {
      const currentValue = state[color].turns;
      const numericValue = parseTurnsValue(currentValue);
      const newValue = Math.max(-0.5, numericValue - 0.5);
      return {
        ...state,
        [color]: { ...state[color], turns: displayTurnsValue(newValue) }
      };
    });
  },
  
  reset: () => {
    turnsState.set(initialState);
  }
};