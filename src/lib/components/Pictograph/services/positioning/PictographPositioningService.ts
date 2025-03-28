import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import { tick } from 'svelte';
import type { ComponentPositioningStatus, RenderStage } from '../../constants/trackingConstants';
import type { PictographManagers } from '../../core/PictographManagers';
import { applyFallbackPosition } from '../../utils/positionUtils';

type UpdatePositioningStatusCallback = (
	component: keyof ComponentPositioningStatus,
	isComplete: boolean
) => void;

type ArrowValidationFn = (arrow: ArrowData | null) => boolean;

type DataCompletenessFn = () => boolean;

type StageChangeCallback = (stage: RenderStage) => void;

type LoadedEventCallback = (data?: any) => void;

export class PictographPositioningService {
	private debug: boolean;

	constructor(debug: boolean = false) {
		this.debug = debug;
		if (this.debug) console.log('🔄 PositioningService: Initialized');
	}

	public applyFallbackPositions(
		redProp: PropData | null,
		blueProp: PropData | null,
		updateStatusCallback: UpdatePositioningStatusCallback
	): void {
		if (this.debug) console.warn('⚠️ PositioningService: Applying fallback positions...');

		if (redProp) {
			if (!redProp.coords || (redProp.coords.x === 0 && redProp.coords.y === 0)) {
				applyFallbackPosition(redProp, 'red');
				if (this.debug)
					console.log(
						`   - Applied fallback to Red Prop at (${redProp.coords.x}, ${redProp.coords.y})`
					);
			}
			updateStatusCallback('redProp', true);
		} else {
			updateStatusCallback('redProp', true);
		}

		if (blueProp) {
			if (!blueProp.coords || (blueProp.coords.x === 0 && blueProp.coords.y === 0)) {
				applyFallbackPosition(blueProp, 'blue');
				if (this.debug)
					console.log(
						`   - Applied fallback to Blue Prop at (${blueProp.coords.x}, ${blueProp.coords.y})`
					);
			}
			updateStatusCallback('blueProp', true);
		} else {
			updateStatusCallback('blueProp', true);
		}

		updateStatusCallback('redArrow', true);
		updateStatusCallback('blueArrow', true);
		if (this.debug) console.log('   - Marked arrows as positioned (skipped).');
	}

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

			pictographManagers.propPlacementManager.defaultPositioner.updateCoords(redProp);
			pictographManagers.propPlacementManager.defaultPositioner.updateCoords(blueProp);
			if (this.debug)
				console.log(
					`   - Default Red: (${redProp.coords?.x}, ${redProp.coords?.y}), Blue: (${blueProp.coords?.x}, ${blueProp.coords?.y})`
				);

			if (pictographManagers.checker.endsWithBeta()) {
				if (this.debug) console.log('   - Applying Beta positioning...');
				pictographManagers.propPlacementManager.betaPositioner.reposition([redProp, blueProp]);
				if (this.debug)
					console.log(
						`   - Beta Adjusted Red: (${redProp.coords?.x}, ${redProp.coords?.y}), Blue: (${blueProp.coords?.x}, ${blueProp.coords?.y})`
					);
			}

			const newRedProp = JSON.parse(JSON.stringify(redProp));
			const newBlueProp = JSON.parse(JSON.stringify(blueProp));

			updateStatusCallback('redProp', true);
			updateStatusCallback('blueProp', true);

			if (this.debug) console.log('   - Props positioned successfully.');
			return { redProp: newRedProp, blueProp: newBlueProp };
		} catch (error) {
			console.error('❌ PositioningService: Error during prop positioning:', error);

			updateStatusCallback('redProp', true);
			updateStatusCallback('blueProp', true);
			throw error;
		}
	}

	public positionArrows(
		pictographManagers: PictographManagers,
		redArrow: ArrowData | null,
		blueArrow: ArrowData | null,
		updateStatusCallback: UpdatePositioningStatusCallback,
		validationFn: ArrowValidationFn
	): void {
		if (this.debug) console.log('📐 PositioningService: Positioning arrows...');

		if (!redArrow || !blueArrow) {
			if (this.debug) console.warn('   - Skipping arrow positioning: One or both arrows missing.');
			updateStatusCallback('redArrow', true);
			updateStatusCallback('blueArrow', true);
			return;
		}
		if (!pictographManagers.arrowPlacementManager) {
			console.warn('   - Skipping arrow positioning: Arrow placement manager not available.');
			updateStatusCallback('redArrow', true);
			updateStatusCallback('blueArrow', true);
			return;
		}

		const isRedValid = validationFn(redArrow);
		const isBlueValid = validationFn(blueArrow);

		if (!isRedValid || !isBlueValid) {
			console.warn(
				`   - Skipping arrow positioning due to incomplete data (Red valid: ${isRedValid}, Blue valid: ${isBlueValid}).`
			);
			updateStatusCallback('redArrow', true);
			updateStatusCallback('blueArrow', true);
			return;
		}

		try {
			pictographManagers.arrowPlacementManager.updateArrowPlacements([redArrow, blueArrow]);

			updateStatusCallback('redArrow', true);
			updateStatusCallback('blueArrow', true);
			if (this.debug) console.log('   - Arrows positioned successfully.');
		} catch (error) {
			console.error('❌ PositioningService: Error during arrow positioning:', error);

			updateStatusCallback('redArrow', true);
			updateStatusCallback('blueArrow', true);
		}
	}

	public async updatePlacements(
		pictographManagers: PictographManagers | null,
		redProp: PropData | null,
		blueProp: PropData | null,
		redArrow: ArrowData | null,
		blueArrow: ArrowData | null,

		updateStatusCallback: UpdatePositioningStatusCallback,
		validationFn: ArrowValidationFn,
		isDataCompleteFn: DataCompletenessFn,
		onStageChange: StageChangeCallback,
		onLoaded: LoadedEventCallback
	): Promise<{ redProp: PropData | null; blueProp: PropData | null }> {
		let currentRedProp = redProp;
		let currentBlueProp = blueProp;

		try {
			if (!pictographManagers || !pictographManagers.propPlacementManager) {
				console.warn(
					'⚠️ PositioningService: Cannot update placements - managers not fully initialized. Applying fallbacks.'
				);
				this.applyFallbackPositions(currentRedProp, currentBlueProp, updateStatusCallback);
				onStageChange('complete');
				onLoaded({ warning: 'Positioning skipped due to missing managers' });
				return { redProp: currentRedProp, blueProp: currentBlueProp };
			}

			if (!isDataCompleteFn()) {
				if (this.debug)
					console.log(
						'ℹ️ PositioningService: Data deemed incomplete by validation service. Applying fallbacks.'
					);
				this.applyFallbackPositions(currentRedProp, currentBlueProp, updateStatusCallback);
				onStageChange('complete');
				onLoaded({ incompleteData: true });
				return { redProp: currentRedProp, blueProp: currentBlueProp };
			}

			if (this.debug)
				console.log('🚀 PositioningService: Starting coordinated placement update...');
			onStageChange('positioning');

			try {
				if (currentRedProp && currentBlueProp) {
					const positionedProps = await this.positionProps(
						pictographManagers,
						currentRedProp,
						currentBlueProp,
						updateStatusCallback
					);

					currentRedProp = positionedProps.redProp;
					currentBlueProp = positionedProps.blueProp;
				} else {
					if (this.debug) console.warn('   - Skipping prop positioning: Red or Blue prop missing.');
					updateStatusCallback('redProp', true);
					updateStatusCallback('blueProp', true);
				}
			} catch (propError) {
				console.error(
					'❌ PositioningService: Failed to position props, applying fallbacks for safety.',
					propError
				);

				this.applyFallbackPositions(currentRedProp, currentBlueProp, updateStatusCallback);
			}

			await tick();
			if (this.debug) console.log('⏳ PositioningService: Tick complete after prop positioning.');

			this.positionArrows(
				pictographManagers,
				redArrow,
				blueArrow,
				updateStatusCallback,
				validationFn
			);

			if (this.debug) console.log('✅ PositioningService: Placement update process finished.');

			return { redProp: currentRedProp, blueProp: currentBlueProp };
		} catch (error) {
			console.error(
				'❌ PositioningService: Fatal error during updatePlacements orchestration:',
				error
			);
			this.applyFallbackPositions(currentRedProp, currentBlueProp, updateStatusCallback);
			onStageChange('complete');
			onLoaded({ error: true, message: 'Fatal positioning error' });
			return { redProp: currentRedProp, blueProp: currentBlueProp };
		}
	}
}
