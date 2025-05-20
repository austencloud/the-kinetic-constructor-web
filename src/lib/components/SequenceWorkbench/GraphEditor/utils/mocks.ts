// src/lib/components/SequenceWorkbench/GraphEditor/utils/mocks.ts
// This file contains mock types for external modules to fix TypeScript errors
/* eslint-disable @typescript-eslint/no-unused-vars */

// Mock PictographData type
export interface PictographData {
	letter: string | null;
	startPos: string | null;
	endPos: string | null;
	timing: string | null;
	direction: string | null;
	gridMode: string;
	blueMotionData: Record<string, unknown> | null;
	redMotionData: Record<string, unknown> | null;
	gridData: Record<string, unknown> | null;
	redPropData: Record<string, unknown> | null;
	bluePropData: Record<string, unknown> | null;
	redArrowData: Record<string, unknown> | null;
	blueArrowData: Record<string, unknown> | null;
	grid: string;
}

// Use PropRotDir from the codebase
export type PropRotDir = 'cw' | 'ccw' | 'no_rot';

// Mock DIAMOND constant
export const DIAMOND = 'diamond';

// Mock SequenceContainer
export const sequenceContainer = {
	state: {
		selectedBeatIds: [] as string[],
		beats: [] as Array<{
			id: string;
			metadata?: {
				letter?: string | null;
				startPos?: string | null;
				endPos?: string | null;
			};
			blueMotionData: Record<string, unknown> | null;
			redMotionData: Record<string, unknown> | null;
			redPropData: Record<string, unknown> | null;
			bluePropData: Record<string, unknown> | null;
		}>
	},
	updateBeat: (_id: string, _data: Record<string, unknown>) => {},
	subscribe: (_callback: () => void) => () => {}
};

// Mock EditModeStore
export const editModeStore = {
	setEditMode: (_mode: boolean) => {}
};

// Mock HapticFeedbackType
export type HapticFeedbackType =
	| 'selection'
	| 'success'
	| 'warning'
	| 'error'
	| 'navigation'
	| 'custom';

// Mock HapticFeedbackService
export const hapticFeedbackService = {
	trigger: (_type?: HapticFeedbackType) => false
};

// Mock PanelStore
export const panelStore = {
	layout: 'vertical' as 'horizontal' | 'vertical'
};
