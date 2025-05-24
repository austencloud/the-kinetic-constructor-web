// src/lib/components/SequenceWorkbench/BeatFrame/utils/beatFrameUtils.ts

import type { BeatData as LegacyBeatData } from '../BeatData';
import type { PictographData } from '$lib/types/PictographData';

/**
 * Convert container beats to legacy BeatData format for backward compatibility
 */
export function convertContainerBeatsToLegacyFormat(containerBeats: any[]): LegacyBeatData[] {
	return containerBeats.map((beat) => {
		const pictographData = {
			letter: beat.metadata?.letter || null,
			startPos: beat.metadata?.startPos || null,
			endPos: beat.metadata?.endPos || null,
			gridMode: beat.metadata?.gridMode || 'diamond',
			redPropData: beat.redPropData || null,
			bluePropData: beat.bluePropData || null,
			redMotionData: beat.redMotionData || null,
			blueMotionData: beat.blueMotionData || null,
			redArrowData: beat.redArrowData || null,
			blueArrowData: beat.blueArrowData || null,
			grid: beat.metadata?.grid || ''
		};

		return {
			id: beat.id,
			beatNumber: beat.number,
			filled: true,
			pictographData,
			duration: 1,
			metadata: beat.metadata
		} as LegacyBeatData;
	});
}

/**
 * Convert PictographData to container beat format
 */
export function convertPictographToContainerFormat(pictographData: PictographData) {
	return {
		id: crypto.randomUUID(),
		number: 0, // Will be set by container
		redPropData: pictographData.redPropData,
		bluePropData: pictographData.bluePropData,
		redMotionData: pictographData.redMotionData,
		blueMotionData: pictographData.blueMotionData,
		redArrowData: pictographData.redArrowData,
		blueArrowData: pictographData.blueArrowData,
		metadata: {
			letter: pictographData.letter,
			startPos: pictographData.startPos,
			endPos: pictographData.endPos,
			gridMode: pictographData.gridMode,
			timing: pictographData.timing,
			direction: pictographData.direction
		}
	};
}

/**
 * Convert legacy BeatData to container beat format
 */
export function convertLegacyBeatToContainerFormat(beatData: LegacyBeatData) {
	const beatWithId = beatData.id ? beatData : { ...beatData, id: crypto.randomUUID() };

	return {
		id: beatWithId.id || crypto.randomUUID(),
		number: beatWithId.beatNumber,
		redPropData: beatWithId.pictographData.redPropData,
		bluePropData: beatWithId.pictographData.bluePropData,
		redMotionData: beatWithId.pictographData.redMotionData,
		blueMotionData: beatWithId.pictographData.blueMotionData,
		redArrowData: beatWithId.pictographData.redArrowData,
		blueArrowData: beatWithId.pictographData.blueArrowData,
		metadata: {
			...beatWithId.metadata,
			letter: beatWithId.pictographData.letter,
			startPos: beatWithId.pictographData.startPos,
			endPos: beatWithId.pictographData.endPos,
			gridMode: beatWithId.pictographData.gridMode
		}
	};
}

/**
 * Create a custom event that bubbles up through the DOM
 */
export function createBubbleEvent(eventType: string, detail: any) {
	return new CustomEvent(eventType, {
		detail,
		bubbles: true
	});
}

/**
 * Dispatch an event on a specific element or document
 */
export function dispatchEvent(element: HTMLElement | null, event: CustomEvent) {
	if (element) {
		element.dispatchEvent(event);
	} else {
		document.dispatchEvent(event);
	}
}

/**
 * Throttle function to limit the frequency of function calls
 */
export function throttle<T extends (...args: any[]) => any>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle: boolean;
	return function (this: any, ...args: Parameters<T>) {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}

/**
 * Debounce function to delay function execution
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout>;
	return function (this: any, ...args: Parameters<T>) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func.apply(this, args), delay);
	};
}

/**
 * Safe effect wrapper to prevent infinite loops
 */
export function safeEffect(fn: () => void | (() => void)) {
	let cleanup: (() => void) | void;

	const effect = () => {
		if (cleanup) {
			cleanup();
		}
		cleanup = fn();
	};

	// Use a microtask to ensure the effect runs after the current update cycle
	queueMicrotask(effect);

	return () => {
		if (cleanup) {
			cleanup();
		}
	};
}
