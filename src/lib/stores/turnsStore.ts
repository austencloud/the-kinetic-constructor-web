// src/lib/stores/turnsStore.ts
import { adjustTurns, isMaxTurns, isMinTurns, type TurnsValue } from '$lib/components/SequenceWorkbench/GraphEditor/TurnsBox/TurnsWidget/turnsUtils';
import { writable, derived } from 'svelte/store';

export type PropRotation = 'clockwise' | 'counterClockwise' | null;

interface TurnsState {
    blue: {
        turns: TurnsValue;
        propRotation: PropRotation;
    };
    red: {
        turns: TurnsValue;
        propRotation: PropRotation;
    };
}

// Initial state
const initialState: TurnsState = {
    blue: {
        turns: 0,
        propRotation: null
    },
    red: {
        turns: 0,
        propRotation: null
    }
};

// Create the base store
const { subscribe, update, set } = writable<TurnsState>(initialState);

// Create derived stores for each color's turns
export const blueTurns = derived(
    { subscribe },
    $state => $state.blue.turns
);

export const redTurns = derived(
    { subscribe },
    $state => $state.red.turns
);

// Create derived stores for each color's prop rotation
export const bluePropRotation = derived(
    { subscribe },
    $state => $state.blue.propRotation
);

export const redPropRotation = derived(
    { subscribe },
    $state => $state.red.propRotation
);

// Actions to update the store
function setTurns(color: 'blue' | 'red', value: TurnsValue) {
    update(state => {
        state[color].turns = value;
        return state;
    });
}

function incrementTurns(color: 'blue' | 'red') {
    update(state => {
        state[color].turns = adjustTurns(state[color].turns, 0.5);
        return state;
    });
}

function decrementTurns(color: 'blue' | 'red') {
    update(state => {
        state[color].turns = adjustTurns(state[color].turns, -0.5);
        return state;
    });
}

function setPropRotation(color: 'blue' | 'red', rotation: PropRotation) {
    update(state => {
        state[color].propRotation = rotation;
        return state;
    });
}

function togglePropRotation(color: 'blue' | 'red', rotation: 'clockwise' | 'counterClockwise') {
    update(state => {
        state[color].propRotation = state[color].propRotation === rotation ? null : rotation;
        return state;
    });
}

// Selectors to derive state
function canIncrementTurns(color: 'blue' | 'red'): boolean {
    let currentTurns: TurnsValue = 0;
    subscribe(state => {
        currentTurns = state[color].turns;
    })();
    
    return !isMaxTurns(currentTurns);
}

function canDecrementTurns(color: 'blue' | 'red'): boolean {
    let currentTurns: TurnsValue = 0;
    subscribe(state => {
        currentTurns = state[color].turns;
    })();
    
    return !isMinTurns(currentTurns);
}

// Export the store and its actions
export const turnsStore = {
    subscribe,
    setTurns,
    incrementTurns,
    decrementTurns,
    setPropRotation,
    togglePropRotation,
    canIncrementTurns,
    canDecrementTurns,
    reset: () => set(initialState)
};