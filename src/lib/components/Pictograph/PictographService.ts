// src/lib/services/PictographService.ts (Updated)
import type { PictographData } from '$lib/types/PictographData';
import type { PropData } from '$lib/components/objects/Prop/PropData';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import type { MotionData } from '$lib/components/objects/Motion/MotionData';
import { PropType, type Color, type Loc } from '$lib/types/Types';

import { Motion } from '$lib/components/objects/Motion/Motion';
import { RED, BLUE } from '$lib/types/Constants';

import { PictographChecker } from './services/PictographChecker';
import { pictographStore } from '$lib/stores/pictograph/pictographStore';
import ArrowLocationManager from '$lib/components/objects/Arrow/ArrowLocationManager';
import ArrowRotAngleManager from '$lib/components/objects/Arrow/ArrowRotAngleManager';
import { LetterConditions } from './constants/LetterConditions';
import { ArrowPlacementManager } from '../objects/Arrow/ArrowPlacementManager';
import { BetaPropPositioner } from '../objects/Prop/PropPlacementManager/BetaPropPositioner';

export class PictographService {
	private data: PictographData;
	private checker: PictographChecker;

	constructor(pictographData: PictographData) {
		this.data = pictographData;
		this.checker = new PictographChecker(pictographData);
		this.initialize();
	}

	private initialize(): void {
		try {
			this.initializeMotions();
			pictographStore.setData(this.data);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Pictograph initialization failed';
			pictographStore.setError(errorMessage, 'initialization');
		}
	}

	private initializeMotions(): void {
		if (this.data.redMotionData && !this.data.redMotion) {
			this.data.redMotion = new Motion(this.data, this.data.redMotionData);
		}
		if (this.data.blueMotionData && !this.data.blueMotion) {
			this.data.blueMotion = new Motion(this.data, this.data.blueMotionData);
		}
	}

	createPropData(motionData: MotionData, color: Color): PropData {
		// Find the corresponding motion object
		const motion = color === 'red' ? this.data.redMotion : this.data.blueMotion;

		// Use the motion's calculated end orientation
		const endOri = motion ? motion.calculateFinalEndOrientation() : motionData.endOri;
		const propData: PropData = {
			id: crypto.randomUUID(),
			motionId: motionData.id,
			color,
			propType: PropType.STAFF,
			ori: endOri,
			radialMode: ['in', 'out'].includes(endOri) ? 'radial' : 'nonradial',
			coords: { x: 0, y: 0 },
			loc: motionData.endLoc,
			rotAngle: 0
		};

		pictographStore.updatePropData(color, propData);
		return propData;
	}
	createArrowData(motionData: MotionData, color: Color): ArrowData {
		const motion = color === 'red' ? this.data.redMotion : this.data.blueMotion;
		const arrowLoc = motion
			? this.calculateArrowLocation(motion, motionData.endLoc)
			: motionData.endLoc;

		const arrowData: ArrowData = {
			id: crypto.randomUUID(),
			motionId: motionData.id,
			color,
			coords: { x: 0, y: 0 },
			loc: arrowLoc,
			rotAngle: 0,
			svgMirrored: false,
			svgCenter: { x: 0, y: 0 },
			svgLoaded: false,
			svgData: null,
			...(({ id: _id, color: _color, ...rest }) => rest)(motionData)
		};

		pictographStore.updateArrowData(color, arrowData);
		return arrowData;
	}

	private calculateArrowLocation(motion: Motion | null, defaultLoc: Loc): Loc {
		if (!motion) return defaultLoc;
		try {
			const locationManager = new ArrowLocationManager(this);
			return (
				locationManager.getArrowLocation(
					motion,
					(m) => this.getOtherMotion(m),
					() => this.getShiftMotion(),
					this.data.letter
				) ?? defaultLoc
			);
		} catch (error) {
			console.warn('Arrow location calculation failed:', error);
			return defaultLoc;
		}
	}

	positionComponents(
		redProp: PropData | null,
		blueProp: PropData | null,
		redArrow: ArrowData | null,
		blueArrow: ArrowData | null,
		grid: GridData
	): void {
		try {
			if (redProp) this.positionProp(redProp, grid);
			if (blueProp) this.positionProp(blueProp, grid);

			if (redProp && blueProp && this.checker.checkLetterCondition(LetterConditions.BETA_ENDING)) {
				new BetaPropPositioner(this.data).reposition([redProp, blueProp]);
			}

			this.positionArrows(redArrow, blueArrow, grid);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Component positioning failed';
			pictographStore.setError(errorMessage, 'positioning');
		}
	}

	private positionProp(prop: PropData, grid: GridData): void {
		const pointName = `${prop.loc}_${this.data.gridMode}_hand_point`;
		prop.coords =
			grid.allHandPointsNormal?.[pointName]?.coordinates ?? this.getFallbackPosition(prop.loc);
	}

	private positionArrows(
		redArrow: ArrowData | null,
		blueArrow: ArrowData | null,
		grid: GridData
	): void {
		// Create a rotation angle manager once to be reused
		const rotAngleManager = new ArrowRotAngleManager(this.data, this);

		// First, determine the arrow locations
		if (redArrow && this.data.redMotion) {
			const locationManager = new ArrowLocationManager(this);
			const arrowLoc = redArrow.loc;

			if (arrowLoc) {
				redArrow.loc = arrowLoc;
			}
		}

		if (blueArrow && this.data.blueMotion) {
			const locationManager = new ArrowLocationManager(this);
			const arrowLoc = blueArrow.loc;

			if (arrowLoc) {
				blueArrow.loc = arrowLoc;
			}
		}

		// Next, update arrow placements
		if (redArrow || blueArrow) {
			try {
				const placementManager = new ArrowPlacementManager({
					pictographData: this.data,
					gridData: grid,
					checker: this.checker
				});

				const arrows = [redArrow, blueArrow].filter(Boolean) as ArrowData[];

				placementManager.updateArrowPlacements(arrows);

				// After updating placements, recalculate rotation angles
				// This ensures the angles are correct after any layout shifts
				if (redArrow && this.data.redMotion && redArrow.loc) {
					redArrow.rotAngle = rotAngleManager.calculateRotationAngle(
						this.data.redMotion,
						redArrow.loc
					);
				}

				if (blueArrow && this.data.blueMotion && blueArrow.loc) {
					blueArrow.rotAngle = rotAngleManager.calculateRotationAngle(
						this.data.blueMotion,
						blueArrow.loc
					);
				}
			} catch (error) {
				console.warn('Advanced arrow placement failed:', error);

				// Even if placement fails, still try to calculate rotation angles
				if (redArrow && this.data.redMotion && redArrow.loc) {
					redArrow.rotAngle = rotAngleManager.calculateRotationAngle(
						this.data.redMotion,
						redArrow.loc
					);
				}

				if (blueArrow && this.data.blueMotion && blueArrow.loc) {
					blueArrow.rotAngle = rotAngleManager.calculateRotationAngle(
						this.data.blueMotion,
						blueArrow.loc
					);
				}
			}
		}
	}

	private getFallbackPosition(loc?: string): { x: number; y: number } {
		const fallbackPositions: Record<string, { x: number; y: number }> = {
			n: { x: 475, y: 330 },
			e: { x: 620, y: 475 },
			s: { x: 475, y: 620 },
			w: { x: 330, y: 475 },
			ne: { x: 620, y: 330 },
			se: { x: 620, y: 620 },
			sw: { x: 330, y: 620 },
			nw: { x: 330, y: 330 }
		};

		return loc && fallbackPositions[loc] ? fallbackPositions[loc] : { x: 475, y: 475 };
	}

	getShiftMotion(): Motion | null {
		const motions = [this.data.redMotion, this.data.blueMotion].filter((m): m is Motion => !!m);
		return motions.find((m) => ['pro', 'anti', 'float'].includes(m.motionType)) ?? null;
	}

	getOtherMotion(motion: Motion): Motion | null {
		if (!motion) return null;
		const otherColor = motion.color === RED ? BLUE : RED;
		return otherColor === RED ? (this.data.redMotion ?? null) : (this.data.blueMotion ?? null);
	}

	// Getter for the pictograph data
	getData(): PictographData {
		return this.data;
	}

	updateData(newData: PictographData): void {
		// Log the motion types before preservation
		console.log(
			`PictographService.updateData - Before preservation: ` +
				`Red Motion Type: ${newData.redMotionData?.motionType || 'none'} -> ${this.data?.redMotionData?.motionType || 'none'}, ` +
				`Blue Motion Type: ${newData.blueMotionData?.motionType || 'none'} -> ${this.data?.blueMotionData?.motionType || 'none'}`
		);

		// Check if this is a layout shift update
		// We can detect this by looking at the stack trace for affected beats
		const stackTrace = new Error().stack || '';
		const isLayoutShift =
			stackTrace.includes('Beat 4') ||
			stackTrace.includes('Beat 5') ||
			stackTrace.includes('Beat 9') ||
			stackTrace.includes('Beat 10');

		// Also check for grid changes that indicate layout shifts
		const isGridChanged =
			this.data?.gridData?.cellSize !== newData.gridData?.cellSize ||
			this.data?.gridData?.width !== newData.gridData?.width ||
			this.data?.gridData?.height !== newData.gridData?.height;

		// Combine both checks
		const shouldForceReset = isLayoutShift || isGridChanged;

		if (shouldForceReset) {
			console.log(
				`PictographService.updateData - Layout shift detected (${isLayoutShift ? 'beat' : 'grid'} change), NOT preserving motion types`
			);

			// For layout shifts, we need to ensure the arrows are completely recreated
			// This is the key to fixing the issue
			if (newData.redArrowData) {
				// Force recalculation of rotation angle
				if (newData.redMotion) {
					const rotAngleManager = new ArrowRotAngleManager(newData);
					newData.redArrowData.rotAngle = rotAngleManager.calculateRotationAngle(
						newData.redMotion,
						newData.redArrowData.loc,
						newData.redArrowData.svgMirrored
					);
					console.log(`Recalculated red arrow rotation angle: ${newData.redArrowData.rotAngle}`);
				}

				// Ensure the motion type is correct
				if (newData.redMotion && newData.redMotionData) {
					if (newData.redArrowData.motionType !== newData.redMotionData.motionType) {
						console.log(
							`Correcting red arrow motion type from ${newData.redArrowData.motionType} to ${newData.redMotionData.motionType}`
						);
						newData.redArrowData.motionType = newData.redMotionData.motionType;
					}
				}
			}

			if (newData.blueArrowData) {
				// Force recalculation of rotation angle
				if (newData.blueMotion) {
					const rotAngleManager = new ArrowRotAngleManager(newData);
					newData.blueArrowData.rotAngle = rotAngleManager.calculateRotationAngle(
						newData.blueMotion,
						newData.blueArrowData.loc,
						newData.blueArrowData.svgMirrored
					);
					console.log(`Recalculated blue arrow rotation angle: ${newData.blueArrowData.rotAngle}`);
				}

				// Ensure the motion type is correct
				if (newData.blueMotion && newData.blueMotionData) {
					if (newData.blueArrowData.motionType !== newData.blueMotionData.motionType) {
						console.log(
							`Correcting blue arrow motion type from ${newData.blueArrowData.motionType} to ${newData.blueMotionData.motionType}`
						);
						newData.blueArrowData.motionType = newData.blueMotionData.motionType;
					}
				}
			}
		} else {
			// Preserve motion types from the current data if they exist
			if (this.data) {
				// Preserve red motion type if it exists
				if (this.data.redMotionData?.motionType && newData.redMotionData) {
					newData.redMotionData.motionType = this.data.redMotionData.motionType;
				}

				// Preserve blue motion type if it exists
				if (this.data.blueMotionData?.motionType && newData.blueMotionData) {
					newData.blueMotionData.motionType = this.data.blueMotionData.motionType;
				}
			}
		}

		// Log the motion types after preservation
		console.log(
			`PictographService.updateData - After preservation: ` +
				`Red Motion Type: ${newData.redMotionData?.motionType || 'none'}, ` +
				`Blue Motion Type: ${newData.blueMotionData?.motionType || 'none'}`
		);

		this.data = newData;
		this.checker = new PictographChecker(newData);
		this.initialize();
	}
}
