// src/lib/components/Pictograph/services/PictographPositioningService.ts

import type { ArrowData } from "$lib/components/objects/Arrow/ArrowData";
import type { PropData } from "$lib/components/objects/Prop/PropData";
import { tick } from "svelte";
import type { ComponentPositioningStatus, RenderStage } from "../../constants/trackingConstants";
import type { PictographManagers } from "../../core/PictographManagers";
import { applyFallbackPosition } from "../../utils/positionUtils";

/** Type for the callback function to update component positioning status. */
type UpdatePositioningStatusCallback = (
    component: keyof ComponentPositioningStatus,
    isComplete: boolean
) => void;

/** Type for the arrow validation function. */
type ArrowValidationFn = (arrow: ArrowData | null) => boolean;

/** Type for the data completeness check function. */
type DataCompletenessFn = () => boolean;

/** Type for the stage change callback. */
type StageChangeCallback = (stage: RenderStage) => void;

/** Type for the final loaded event callback. */
type LoadedEventCallback = (data?: any) => void;


/**
 * Service dedicated to calculating and applying the final positions
 * of Props and Arrows within the Pictograph SVG canvas.
 *
 * It orchestrates the use of `PropPlacementManager` and `ArrowPlacementManager`
 * and handles fallback positioning scenarios.
 */
export class PictographPositioningService {
    private debug: boolean;

	constructor(debug: boolean = false) {
        this.debug = debug;
        if (this.debug) console.log('🔄 PositioningService: Initialized');
    }

	/**
	 * Applies fallback positions to props if their coordinates are still zero
	 * (indicating positioning likely failed or was skipped).
     * Also marks all components as "positioned" in the status tracker.
	 *
	 * @param redProp - The red prop data object.
	 * @param blueProp - The blue prop data object.
	 * @param updateStatusCallback - Function to update the positioning status.
	 */
	public applyFallbackPositions(
		redProp: PropData | null,
		blueProp: PropData | null,
        updateStatusCallback: UpdatePositioningStatusCallback
	): void {
        if (this.debug) console.warn('⚠️ PositioningService: Applying fallback positions...');

		if (redProp) {
			// Check if coords are default/uninitialized (e.g., 0,0 or undefined)
			if (!redProp.coords || (redProp.coords.x === 0 && redProp.coords.y === 0)) {
				applyFallbackPosition(redProp, 'red');
                 if (this.debug) console.log(`   - Applied fallback to Red Prop at (${redProp.coords.x}, ${redProp.coords.y})`);
			}
			updateStatusCallback('redProp', true); // Mark as positioned (even if fallback)
		} else {
             updateStatusCallback('redProp', true); // Mark as complete if prop doesn't exist
        }

		if (blueProp) {
			if (!blueProp.coords || (blueProp.coords.x === 0 && blueProp.coords.y === 0)) {
				applyFallbackPosition(blueProp, 'blue');
                if (this.debug) console.log(`   - Applied fallback to Blue Prop at (${blueProp.coords.x}, ${blueProp.coords.y})`);
			}
			updateStatusCallback('blueProp', true);
		} else {
            updateStatusCallback('blueProp', true);
        }

		// Mark arrows as positioned as well, as we won't attempt arrow positioning in fallback mode
		updateStatusCallback('redArrow', true);
		updateStatusCallback('blueArrow', true);
        if (this.debug) console.log('   - Marked arrows as positioned (skipped).');
	}

	/**
	 * Positions props using the `PropPlacementManager`. Handles default and beta positioning.
	 * Returns new prop objects to ensure Svelte reactivity.
	 *
	 * @param pictographManagers - The managers object containing placement managers.
	 * @param redProp - Current red prop data.
	 * @param blueProp - Current blue prop data.
     * @param updateStatusCallback - Function to update positioning status.
	 * @returns A promise resolving with newly created, positioned prop data objects.
	 */
	public async positionProps(
		pictographManagers: PictographManagers,
		redProp: PropData,
		blueProp: PropData,
        updateStatusCallback: UpdatePositioningStatusCallback
	): Promise<{ redProp: PropData; blueProp: PropData }> {
		if (this.debug) console.log('📐 PositioningService: Positioning props...');
		try {
			if (!pictographManagers.propPlacementManager) {
				throw new Error('Prop placement manager is not available.');
			}

			// Apply default positioning first
			pictographManagers.propPlacementManager.defaultPositioner.updateCoords(redProp);
			pictographManagers.propPlacementManager.defaultPositioner.updateCoords(blueProp);
            if (this.debug) console.log(`   - Default Red: (${redProp.coords?.x}, ${redProp.coords?.y}), Blue: (${blueProp.coords?.x}, ${blueProp.coords?.y})`);

			// Apply beta adjustments if the pictograph ends in beta
			if (pictographManagers.checker.endsWithBeta()) {
                if (this.debug) console.log('   - Applying Beta positioning...');
				pictographManagers.propPlacementManager.betaPositioner.reposition([redProp, blueProp]);
                if (this.debug) console.log(`   - Beta Adjusted Red: (${redProp.coords?.x}, ${redProp.coords?.y}), Blue: (${blueProp.coords?.x}, ${blueProp.coords?.y})`);
			}

			// Create NEW objects from the modified props to trigger Svelte's reactivity.
            // Simple deep clone using JSON parse/stringify works for plain data objects.
			const newRedProp = JSON.parse(JSON.stringify(redProp));
			const newBlueProp = JSON.parse(JSON.stringify(blueProp));

			// Mark props as positioned in the status tracker
			updateStatusCallback('redProp', true);
			updateStatusCallback('blueProp', true);

            if (this.debug) console.log('   - Props positioned successfully.');
			return { redProp: newRedProp, blueProp: newBlueProp };

		} catch (error) {
			console.error('❌ PositioningService: Error during prop positioning:', error);
            // Mark as positioned even on error to prevent getting stuck
			updateStatusCallback('redProp', true);
			updateStatusCallback('blueProp', true);
			throw error; // Re-throw to be caught by the main updatePlacements method
		}
	}

	/**
	 * Positions arrows using the `ArrowPlacementManager`.
	 * Validates arrow data before attempting placement.
	 *
	 * @param pictographManagers - The managers object containing placement managers.
	 * @param redArrow - Current red arrow data.
	 * @param blueArrow - Current blue arrow data.
     * @param updateStatusCallback - Function to update positioning status.
	 * @param validationFn - Function to validate if an arrow has sufficient data for positioning.
	 */
	public positionArrows(
		pictographManagers: PictographManagers,
		redArrow: ArrowData | null,
		blueArrow: ArrowData | null,
        updateStatusCallback: UpdatePositioningStatusCallback,
		validationFn: ArrowValidationFn
	): void {
        if (this.debug) console.log('📐 PositioningService: Positioning arrows...');

		// Ensure arrows exist and manager is available
        if (!redArrow || !blueArrow) {
             if (this.debug) console.warn('   - Skipping arrow positioning: One or both arrows missing.');
             updateStatusCallback('redArrow', true); // Mark as complete if missing
             updateStatusCallback('blueArrow', true);
             return;
        }
		if (!pictographManagers.arrowPlacementManager) {
			console.warn('   - Skipping arrow positioning: Arrow placement manager not available.');
			updateStatusCallback('redArrow', true); // Mark as complete if manager missing
			updateStatusCallback('blueArrow', true);
			return;
		}

		// Validate required arrow data *before* attempting positioning
		const isRedValid = validationFn(redArrow);
		const isBlueValid = validationFn(blueArrow);

		if (!isRedValid || !isBlueValid) {
			console.warn(`   - Skipping arrow positioning due to incomplete data (Red valid: ${isRedValid}, Blue valid: ${isBlueValid}).`);
			updateStatusCallback('redArrow', true); // Mark as complete (skipped)
			updateStatusCallback('blueArrow', true);
			return;
		}

		try {
			// Both arrows are valid, proceed with positioning
            // Arrow placement manager might modify the objects directly or return new ones.
            // Assume it modifies them for now. If it returns new ones, update references.
			pictographManagers.arrowPlacementManager.updateArrowPlacements([redArrow, blueArrow]);

			// Mark arrows as positioned
			updateStatusCallback('redArrow', true);
			updateStatusCallback('blueArrow', true);
            if (this.debug) console.log('   - Arrows positioned successfully.');

		} catch (error) {
			console.error('❌ PositioningService: Error during arrow positioning:', error);
            // Mark as positioned even on error
            updateStatusCallback('redArrow', true);
			updateStatusCallback('blueArrow', true);
            // Don't re-throw here, allow positioning to "complete" even if arrows fail
		}
	}

	/**
	 * Orchestrates the entire positioning process for props and arrows.
	 * Handles incomplete data scenarios, manager availability, and errors.
	 * Manages stage transitions related to positioning.
	 *
	 * @returns A Promise resolving with the updated (potentially new instances of) prop data.
	 */
	public async updatePlacements(
		// Inputs
        pictographManagers: PictographManagers | null,
		redProp: PropData | null,
		blueProp: PropData | null,
		redArrow: ArrowData | null,
		blueArrow: ArrowData | null,
        // Dependencies / Callbacks
        updateStatusCallback: UpdatePositioningStatusCallback,
		validationFn: ArrowValidationFn,
		isDataCompleteFn: DataCompletenessFn,
		onStageChange: StageChangeCallback,
		onLoaded: LoadedEventCallback // Callback for final 'loaded' event
	): Promise<{ redProp: PropData | null; blueProp: PropData | null }> {

        let currentRedProp = redProp;
        let currentBlueProp = blueProp;

		try {
			// 1. Check for manager availability
			if (!pictographManagers || !pictographManagers.propPlacementManager) {
				console.warn('⚠️ PositioningService: Cannot update placements - managers not fully initialized. Applying fallbacks.');
				this.applyFallbackPositions(currentRedProp, currentBlueProp, updateStatusCallback);
				onStageChange('complete'); // Force complete stage
				onLoaded({ warning: 'Positioning skipped due to missing managers' }); // Dispatch loaded with warning
				return { redProp: currentRedProp, blueProp: currentBlueProp };
			}

            // 2. Check for overall data completeness (as defined by ValidationService)
			if (!isDataCompleteFn()) {
				if (this.debug) console.log('ℹ️ PositioningService: Data deemed incomplete by validation service. Applying fallbacks.');
				this.applyFallbackPositions(currentRedProp, currentBlueProp, updateStatusCallback);
				onStageChange('complete'); // Force complete stage
				onLoaded({ incompleteData: true }); // Dispatch loaded indicating incomplete
				return { redProp: currentRedProp, blueProp: currentBlueProp };
			}

            // 3. Data is complete, managers are ready - Proceed with positioning
			if (this.debug) console.log('🚀 PositioningService: Starting coordinated placement update...');
			onStageChange('positioning'); // Signal start of positioning phase

            // 4. Position Props (await the result)
            try {
                if (currentRedProp && currentBlueProp) {
                    const positionedProps = await this.positionProps(
                        pictographManagers,
                        currentRedProp,
                        currentBlueProp,
                        updateStatusCallback
                    );
                    // Update local references to the potentially new prop objects
                    currentRedProp = positionedProps.redProp;
                    currentBlueProp = positionedProps.blueProp;
                } else {
                     if (this.debug) console.warn('   - Skipping prop positioning: Red or Blue prop missing.');
                     updateStatusCallback('redProp', true);
                     updateStatusCallback('blueProp', true);
                }
            } catch (propError) {
                console.error('❌ PositioningService: Failed to position props, applying fallbacks for safety.', propError);
                // Apply fallbacks if prop positioning itself failed critically
                this.applyFallbackPositions(currentRedProp, currentBlueProp, updateStatusCallback);
                // Stage will still move to complete via finally block
            }

			// 5. Wait for the DOM to potentially update after prop positions change (important before arrow positioning)
			await tick();
             if (this.debug) console.log('⏳ PositioningService: Tick complete after prop positioning.');


			// 6. Position Arrows (handles its own errors internally, doesn't need await here unless returning data)
            // Pass the potentially updated prop references if needed by arrow positioning
            this.positionArrows(
                pictographManagers,
                redArrow, // Pass original arrow refs, assume manager modifies them
                blueArrow,
                updateStatusCallback,
                validationFn
            );

            // 7. Positioning attempts are done. Stage transition to 'complete'
            // will be handled by the ComponentStatusService monitoring the updates.
            // The onLoaded event will also be triggered by ComponentStatusService.

            if (this.debug) console.log('✅ PositioningService: Placement update process finished.');

            // Return the latest versions of the props
            return { redProp: currentRedProp, blueProp: currentBlueProp };

		} catch (error) {
            // Catch unexpected errors in the orchestration logic
			console.error('❌ PositioningService: Fatal error during updatePlacements orchestration:', error);
			this.applyFallbackPositions(currentRedProp, currentBlueProp, updateStatusCallback); // Ensure fallbacks on major failure
			onStageChange('complete'); // Force complete
			onLoaded({ error: true, message: 'Fatal positioning error' }); // Dispatch loaded with error
			return { redProp: currentRedProp, blueProp: currentBlueProp }; // Return current (possibly fallback) props
		}
        // Note: The 'complete' stage change and final 'onLoaded' call are implicitly triggered
        // by the ComponentStatusService when all positioning statuses become true
        // (either successfully positioned or marked complete due to error/skip/fallback).
	}
}