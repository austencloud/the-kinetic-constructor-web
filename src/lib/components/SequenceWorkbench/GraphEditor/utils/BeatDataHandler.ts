// src/lib/components/SequenceWorkbench/GraphEditor/utils/BeatDataHandler.ts
import type { PictographData } from './mocks';
import { DIAMOND, sequenceContainer } from './mocks';
import { browser } from '$app/environment';
import { turnsStore, type TurnsValue } from '$lib/stores/sequence/turnsStore';
import { pictographContainer } from '$lib/state/stores/pictograph/pictographContainer';

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

					// Sync with turnsStore to ensure UI controls reflect the correct values
					syncTurnsStoreWithBeatData(newData);
				}
			}
		}
	}

	/**
	 * Synchronizes the turnsStore with the selected beat's motion data
	 * @param data The pictograph data to sync with
	 */
	function syncTurnsStoreWithBeatData(data: PictographData) {
		// Sync blue motion data
		if (data.blueMotionData) {
			// Sync turns value
			if (data.blueMotionData.turns !== undefined && data.blueMotionData.turns !== null) {
				// Ensure we have a valid TurnsValue (number or 'fl')
				const turns =
					typeof data.blueMotionData.turns === 'number' || data.blueMotionData.turns === 'fl'
						? data.blueMotionData.turns
						: 0;

				turnsStore.setTurns('blue', turns);
			}

			// Sync direction value
			if (data.blueMotionData.direction !== undefined) {
				// Convert PropRotDir to Direction
				const direction =
					data.blueMotionData.direction === 'cw'
						? 'clockwise'
						: data.blueMotionData.direction === 'ccw'
							? 'counterclockwise'
							: null;

				turnsStore.setDirection('blue', direction);
			}
		}

		// Sync red motion data
		if (data.redMotionData) {
			// Sync turns value
			if (data.redMotionData.turns !== undefined && data.redMotionData.turns !== null) {
				// Ensure we have a valid TurnsValue (number or 'fl')
				const turns =
					typeof data.redMotionData.turns === 'number' || data.redMotionData.turns === 'fl'
						? data.redMotionData.turns
						: 0;

				turnsStore.setTurns('red', turns);
			}

			// Sync direction value
			if (data.redMotionData.direction !== undefined) {
				// Convert PropRotDir to Direction
				const direction =
					data.redMotionData.direction === 'cw'
						? 'clockwise'
						: data.redMotionData.direction === 'ccw'
							? 'counterclockwise'
							: null;

				turnsStore.setDirection('red', direction);
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
						// If changing direction, we may need to update the motion type
						let updatedMotionData = {
							...beat.blueMotionData,
							[property]: value
						};

						// If changing direction, update motion type if needed
						if (property === 'direction') {
							// Convert from Direction to PropRotDir
							const propRotDir =
								value === 'clockwise' ? 'cw' : value === 'counterclockwise' ? 'ccw' : 'no_rot';

							// Update motion type based on direction change
							if (
								beat.blueMotionData.motionType === 'pro' ||
								beat.blueMotionData.motionType === 'anti'
							) {
								// If changing from clockwise to counterclockwise or vice versa,
								// switch between pro and anti motion types
								if (beat.blueMotionData.propRotDir !== propRotDir) {
									updatedMotionData.motionType =
										beat.blueMotionData.motionType === 'pro' ? 'anti' : 'pro';
								}
							}
						}

						// Update the beat in the sequence container
						sequenceContainer.updateBeat(beatId, {
							blueMotionData: updatedMotionData
						});

						// Also update the pictograph data to ensure immediate visual updates
						if (pictographData.value && pictographData.value.blueMotionData) {
							// Create a deep copy of the pictograph data
							const updatedPictographData = {
								...pictographData.value,
								blueMotionData: {
									...pictographData.value.blueMotionData,
									...updatedMotionData
								}
							};

							// Force recreation of the pictograph to update arrow angles
							// This will trigger a complete redraw of the pictograph
							// which will update the arrow angles correctly

							// Update arrow data for both turns and direction changes
							// This ensures immediate visual feedback for all parameter changes
							if (updatedPictographData.blueArrowData) {
								if (property === 'turns') {
									// Update the turns value directly in the arrow data
									updatedPictographData.blueArrowData = {
										...updatedPictographData.blueArrowData,
										turns: value
									};
								} else if (property === 'direction') {
									// Update the propRotDir value in the arrow data
									const propRotDir =
										value === 'clockwise' ? 'cw' : value === 'counterclockwise' ? 'ccw' : 'no_rot';
									updatedPictographData.blueArrowData = {
										...updatedPictographData.blueArrowData,
										propRotDir: propRotDir,
										// Also update the motion type to match the updated motion data
										motionType: updatedMotionData.motionType
									};
								}
							}

							// Always force a complete redraw for immediate visual feedback
							// This ensures real-time updates for both turns and direction changes
							if (typeof window !== 'undefined') {
								// Immediate update without requestAnimationFrame for better responsiveness
								pictographContainer.setData(updatedPictographData as any);
							} else {
								// For SSR environments, update directly
								pictographContainer.setData(updatedPictographData as any);
							}
						}
					}
				} else {
					// Update red motion data
					if (beat.redMotionData) {
						// If changing direction, we may need to update the motion type
						let updatedMotionData = {
							...beat.redMotionData,
							[property]: value
						};

						// If changing direction, update motion type if needed
						if (property === 'direction') {
							// Convert from Direction to PropRotDir
							const propRotDir =
								value === 'clockwise' ? 'cw' : value === 'counterclockwise' ? 'ccw' : 'no_rot';

							// Update motion type based on direction change
							if (
								beat.redMotionData.motionType === 'pro' ||
								beat.redMotionData.motionType === 'anti'
							) {
								// If changing from clockwise to counterclockwise or vice versa,
								// switch between pro and anti motion types
								if (beat.redMotionData.propRotDir !== propRotDir) {
									updatedMotionData.motionType =
										beat.redMotionData.motionType === 'pro' ? 'anti' : 'pro';
								}
							}
						}

						// Update the beat in the sequence container
						sequenceContainer.updateBeat(beatId, {
							redMotionData: updatedMotionData
						});

						// Also update the pictograph data to ensure immediate visual updates
						if (pictographData.value && pictographData.value.redMotionData) {
							// Create a deep copy of the pictograph data
							const updatedPictographData = {
								...pictographData.value,
								redMotionData: {
									...pictographData.value.redMotionData,
									...updatedMotionData
								}
							};

							// Force recreation of the pictograph to update arrow angles
							// This will trigger a complete redraw of the pictograph
							// which will update the arrow angles correctly

							// Update arrow data for both turns and direction changes
							// This ensures immediate visual feedback for all parameter changes
							if (updatedPictographData.redArrowData) {
								if (property === 'turns') {
									// Update the turns value directly in the arrow data
									updatedPictographData.redArrowData = {
										...updatedPictographData.redArrowData,
										turns: value
									};
								} else if (property === 'direction') {
									// Update the propRotDir value in the arrow data
									const propRotDir =
										value === 'clockwise' ? 'cw' : value === 'counterclockwise' ? 'ccw' : 'no_rot';
									updatedPictographData.redArrowData = {
										...updatedPictographData.redArrowData,
										propRotDir: propRotDir,
										// Also update the motion type to match the updated motion data
										motionType: updatedMotionData.motionType
									};
								}
							}

							// Always force a complete redraw for immediate visual feedback
							// This ensures real-time updates for both turns and direction changes
							if (typeof window !== 'undefined') {
								// Immediate update without requestAnimationFrame for better responsiveness
								pictographContainer.setData(updatedPictographData as any);
							} else {
								// For SSR environments, update directly
								pictographContainer.setData(updatedPictographData as any);
							}
						}
					}
				}

				// Also update the turnsStore to ensure UI controls reflect the correct values
				if (property === 'turns') {
					// Ensure we have a valid TurnsValue (number or 'fl')
					const turns = typeof value === 'number' || value === 'fl' ? value : 0;

					turnsStore.setTurns(color, turns as any);
				} else if (property === 'direction') {
					// Convert PropRotDir to Direction
					const direction =
						value === 'cw' ? 'clockwise' : value === 'ccw' ? 'counterclockwise' : null;

					turnsStore.setDirection(color, direction);
				}

				// Dispatch a custom event to notify components that the beat data has changed
				if (typeof document !== 'undefined') {
					const beatUpdatedEvent = new CustomEvent('beat-data-updated', {
						detail: {
							beatId,
							color,
							property,
							value
						},
						bubbles: true
					});
					document.dispatchEvent(beatUpdatedEvent);
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
