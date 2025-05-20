// src/lib/components/SequenceWorkbench/GraphEditor/utils/BeatDataHandler.ts
import type { PictographData } from './mocks';
import { DIAMOND, sequenceContainer } from './mocks';
import { browser } from '$app/environment';

// Define the type for the sequence container
type SequenceContainer = typeof sequenceContainer;
/**
 * Handles loading and updating beat data for the GraphEditor
 * @param sequenceContainer The sequence container instance
 * @param pictographData Reference to the pictograph data state with value property
 * @returns Object containing functions for loading and updating beat data
 */
export function createBeatDataHandler(
	sequenceContainer: SequenceContainer,
	pictographData: { value: PictographData }
) {
	/**
	 * Loads data from the selected beat into the pictograph data
	 */
	function loadSelectedBeatData() {
		const selectedBeatIds = sequenceContainer.state.selectedBeatIds;
		if (selectedBeatIds.length > 0) {
			const beatId = selectedBeatIds[0];

			// Check if the start position is selected
			if (beatId === 'start-position') {
				// Create a basic pictograph data object for the editor
				const newData = {
					letter: null,
					startPos: null,
					endPos: null,
					timing: null,
					direction: null,
					gridMode: DIAMOND,
					blueMotionData: null,
					redMotionData: null,
					gridData: null,
					redPropData: null,
					bluePropData: null,
					redArrowData: null,
					blueArrowData: null,
					grid: ''
				} as PictographData;

				// Get the start position data from localStorage directly
				if (browser) {
					try {
						const startPosJson = localStorage.getItem('start_position');
						if (startPosJson) {
							const startPosData = JSON.parse(startPosJson);

							// Copy over the properties we need
							if (startPosData.letter) newData.letter = startPosData.letter;
							if (startPosData.startPos) newData.startPos = startPosData.startPos;
							if (startPosData.endPos) newData.endPos = startPosData.endPos;
							if (startPosData.blueMotionData) newData.blueMotionData = startPosData.blueMotionData;
							if (startPosData.redMotionData) newData.redMotionData = startPosData.redMotionData;
							if (startPosData.bluePropData) newData.bluePropData = startPosData.bluePropData;
							if (startPosData.redPropData) newData.redPropData = startPosData.redPropData;
							if (startPosData.grid) newData.grid = startPosData.grid;
						}
					} catch (error) {
						console.error('Error loading start position data:', error);
					}
				}

				// Update the pictograph data
				pictographData.value = newData;
			} else {
				// Handle regular beat selection
				const beat = sequenceContainer.state.beats.find((b: { id: string }) => b.id === beatId);

				if (beat) {
					// Convert beat data to pictograph data
					const newData = {
						letter: beat.metadata?.letter || null,
						startPos: beat.metadata?.startPos || null,
						endPos: beat.metadata?.endPos || null,
						timing: null,
						direction: null,
						gridMode: DIAMOND,
						blueMotionData: beat.blueMotionData,
						redMotionData: beat.redMotionData,
						gridData: null,
						redPropData: beat.redPropData,
						bluePropData: beat.bluePropData,
						redArrowData: null,
						blueArrowData: null,
						grid: '',
						isStartPosition: false
					} as PictographData; // Type assertion to handle potential null values

					// Update the pictograph data
					pictographData.value = newData;
				}
			}
		}
	}

	/**
	 * Updates the motion data for a specific beat
	 * @param color The color of the motion data to update ('blue' or 'red')
	 * @param property The property to update ('turns' or 'direction')
	 * @param value The new value for the property
	 */
	function updateBeatMotionData(
		color: 'blue' | 'red',
		property: 'turns' | 'direction',
		value: number | string | 'clockwise' | 'counterclockwise' | 'fl' | null
	) {
		const selectedBeatIds = sequenceContainer.state.selectedBeatIds;
		if (selectedBeatIds.length > 0) {
			const beatId = selectedBeatIds[0];
			const beat = sequenceContainer.state.beats.find((b: { id: string }) => b.id === beatId);

			if (beat) {
				// Update the motion data based on the color
				if (color === 'blue') {
					// Update blue motion data
					if (beat.blueMotionData) {
						sequenceContainer.updateBeat(beatId, {
							blueMotionData: {
								...beat.blueMotionData,
								[property]: value
							}
						});
					}
				} else {
					// Update red motion data
					if (beat.redMotionData) {
						sequenceContainer.updateBeat(beatId, {
							redMotionData: {
								...beat.redMotionData,
								[property]: value
							}
						});
					}
				}
			}
		}
	}

	/**
	 * Sets up a subscription to the sequence container to update pictograph data when selection changes
	 * @returns Cleanup function to unsubscribe
	 */
	function setupSequenceSubscription() {
		// Load selected beat data initially
		loadSelectedBeatData();

		// Subscribe to selection changes
		const unsubscribe = sequenceContainer.subscribe(() => {
			loadSelectedBeatData();
		});

		// Return cleanup function
		return unsubscribe;
	}

	return {
		loadSelectedBeatData,
		updateBeatMotionData,
		setupSequenceSubscription
	};
}
