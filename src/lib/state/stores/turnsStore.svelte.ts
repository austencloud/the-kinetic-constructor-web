/**
 * Modern Turns Store using Svelte 5 Runes
 * Replaces the deleted legacy turnsStore with modern reactive state
 */

import { browser } from '$app/environment';

// Types
export type TurnsValue = number | 'fl';
export type Direction = 'clockwise' | 'counterclockwise' | null;

export interface TurnsData {
	turns: TurnsValue;
	direction: Direction;
}

// Internal reactive state
let _blueTurns = $state<TurnsData>({ turns: 0, direction: null });
let _redTurns = $state<TurnsData>({ turns: 0, direction: null });

// Export reactive getters as functions
export function getBlueTurns(): TurnsData {
	return _blueTurns;
}

export function getRedTurns(): TurnsData {
	return _redTurns;
}

// Note: Cannot export $derived from modules in Svelte 5
// Use getBlueTurns() and getRedTurns() functions instead

// Utility functions
export function parseTurnsValue(value: TurnsValue): number {
	return value === 'fl' ? -0.5 : Number(value);
}

export function displayTurnsValue(n: number): TurnsValue {
	return n === -0.5 ? 'fl' : n;
}

export function adjustTurns(currentValue: TurnsValue, delta: number): TurnsValue {
	const numericValue = parseTurnsValue(currentValue);
	const newValue = Math.max(-0.5, Math.min(3, numericValue + delta));
	return displayTurnsValue(newValue);
}

export function isMinTurns(value: TurnsValue): boolean {
	return parseTurnsValue(value) <= -0.5;
}

export function isMaxTurns(value: TurnsValue): boolean {
	return parseTurnsValue(value) >= 3;
}

// Store actions
export const turnsStore = {
	setTurns(color: 'blue' | 'red', turns: TurnsValue) {
		if (color === 'blue') {
			_blueTurns = { ..._blueTurns, turns };
		} else {
			_redTurns = { ..._redTurns, turns };
		}
	},

	setDirection(color: 'blue' | 'red', direction: Direction) {
		if (color === 'blue') {
			_blueTurns = { ..._blueTurns, direction };
		} else {
			_redTurns = { ..._redTurns, direction };
		}
	},

	incrementTurns(color: 'blue' | 'red') {
		const currentData = color === 'blue' ? _blueTurns : _redTurns;
		const newTurns = adjustTurns(currentData.turns, 0.5);
		this.setTurns(color, newTurns);
	},

	decrementTurns(color: 'blue' | 'red') {
		const currentData = color === 'blue' ? _blueTurns : _redTurns;
		const newTurns = adjustTurns(currentData.turns, -0.5);
		this.setTurns(color, newTurns);
	},

	reset(color?: 'blue' | 'red') {
		const defaultData: TurnsData = { turns: 0, direction: null };
		if (color === 'blue') {
			_blueTurns = { ...defaultData };
		} else if (color === 'red') {
			_redTurns = { ...defaultData };
		} else {
			_blueTurns = { ...defaultData };
			_redTurns = { ...defaultData };
		}
	},

	// Getter functions for compatibility
	getTurns(color: 'blue' | 'red'): TurnsValue {
		return color === 'blue' ? _blueTurns.turns : _redTurns.turns;
	},

	getDirection(color: 'blue' | 'red'): Direction {
		return color === 'blue' ? _blueTurns.direction : _redTurns.direction;
	},

	// Subscribe function for backward compatibility
	subscribe(callback: (state: { blue: TurnsData; red: TurnsData }) => void) {
		// This is a simplified subscribe for backward compatibility
		// In a real implementation, you'd want to track subscriptions properly
		let isSubscribed = true;

		const unsubscribe = () => {
			isSubscribed = false;
		};

		// Initial call
		if (isSubscribed) {
			callback({ blue: _blueTurns, red: _redTurns });
		}

		return unsubscribe;
	}
};

// Initialize with default values
if (browser) {
	turnsStore.reset();
}
