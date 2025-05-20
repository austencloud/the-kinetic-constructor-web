// src/lib/components/SequenceWorkbench/GraphEditor/utils/EventHandlers.ts
import type { PropRotDir } from './mocks';
import { editModeStore, hapticFeedbackService } from './mocks';

// Define types for the imported modules
type EditModeStore = typeof editModeStore;
type HapticFeedbackService = typeof hapticFeedbackService;

/**
 * Creates event handlers for the GraphEditor component
 * @param editModeStore The edit mode store instance
 * @param hapticFeedbackService The haptic feedback service instance
 * @param beatDataHandler The beat data handler instance
 * @param callbacks Optional callback functions to call when events occur
 * @returns Object containing event handler functions
 */
export function createEventHandlers(
	editModeStore: EditModeStore,
	hapticFeedbackService: HapticFeedbackService,
	beatDataHandler: ReturnType<typeof import('./BeatDataHandler').createBeatDataHandler>,
	callbacks?: {
		onTurnsChanged?: (data: { color: 'blue' | 'red'; turns: number | string | 'fl' }) => void;
		onDirectionChanged?: (data: { color: 'blue' | 'red'; direction: PropRotDir }) => void;
	}
) {
	/**
	 * Handles exit button click
	 */
	function handleExitClick() {
		editModeStore.setEditMode(false);
	}

	/**
	 * Handles turns changed event
	 * @param data Object containing color and turns value
	 */
	function handleTurnsChanged(data: { color: 'blue' | 'red'; turns: number | string | 'fl' }) {
		const { color, turns } = data;

		// Trigger haptic feedback
		hapticFeedbackService.trigger('selection');

		// Call the callback prop if provided
		if (callbacks?.onTurnsChanged) {
			callbacks.onTurnsChanged({ color, turns });
		}

		// Dispatch custom event for AnimatedBeat components to show the highlight effect
		const highlightEvent = new CustomEvent('beat-highlight', {
			bubbles: true,
			detail: { active: true, color }
		});
		document.dispatchEvent(highlightEvent);

		// Update the selected beat in the sequence
		beatDataHandler.updateBeatMotionData(color, 'turns', turns);
	}

	/**
	 * Handles direction changed event
	 * @param data Object containing color and direction value
	 */
	function handleDirectionChanged(data: { color: 'blue' | 'red'; direction: PropRotDir }) {
		const { color, direction } = data;

		// Trigger haptic feedback
		hapticFeedbackService.trigger('selection');

		// Call the callback prop if provided
		if (callbacks?.onDirectionChanged) {
			callbacks.onDirectionChanged({ color, direction });
		}

		// Dispatch custom event for AnimatedBeat components to show the highlight effect
		const highlightEvent = new CustomEvent('beat-highlight', {
			bubbles: true,
			detail: { active: true, color }
		});
		document.dispatchEvent(highlightEvent);

		// Update the selected beat in the sequence
		beatDataHandler.updateBeatMotionData(color, 'direction', direction);
	}

	return {
		handleExitClick,
		handleTurnsChanged,
		handleDirectionChanged
	};
}
