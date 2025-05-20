// src/lib/components/SequenceWorkbench/GraphEditor/utils/types.ts
import type { PropRotDir } from './mocks';

/**
 * Props for the GraphEditor component
 */
export interface GraphEditorProps {
	onTurnsChanged?: (data: { color: 'blue' | 'red'; turns: number | string | 'fl' }) => void;
	onDirectionChanged?: (data: { color: 'blue' | 'red'; direction: PropRotDir }) => void;
}

/**
 * Type for the BeatDataHandler
 */
export interface BeatDataHandler {
	loadSelectedBeatData: () => void;
	updateBeatMotionData: (
		color: 'blue' | 'red',
		property: 'turns' | 'direction',
		value: number | string | 'clockwise' | 'counterclockwise' | 'fl' | null
	) => void;
	setupSequenceSubscription: () => () => void;
}

/**
 * Type for the GraphEditorState
 */
export interface GraphEditorState {
	containerHeight: { value: number };
	containerWidth: { value: number };
	isPortrait: { value: boolean };
	isSmallScreen: { value: boolean };
	isPanelHorizontal: { value: boolean };
	isPanelVertical: { value: boolean };
	borderSize: { value: number };
	contentSize: { value: number };
	pictographSize: { value: number };
	updateContainerDimensions: () => void;
	setupResizeObserver: () => (() => void) | null;
}

/**
 * Type for the EventHandlers
 */
export interface EventHandlers {
	handleExitClick: () => void;
	handleTurnsChanged: (data: { color: 'blue' | 'red'; turns: number | string | 'fl' }) => void;
	handleDirectionChanged: (data: { color: 'blue' | 'red'; direction: PropRotDir }) => void;
}
