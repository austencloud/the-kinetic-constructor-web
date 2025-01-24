import {
	ANTI,
	BOX,
	CLOCK,
	COUNTER,
	DASH,
	DIAMOND,
	FLOAT,
	IN,
	NONRADIAL,
	OUT,
	PRO,
	RADIAL,
	STATIC
} from '$lib/types/Constants';
import { LetterType, LetterUtils } from '$lib/types/Letter';
import type { GridMode, PictographInterface } from '$lib/types/PictographInterface';
import type { GridData } from '../../Grid/GridInterface';
import type { MotionType } from '../../Motion/MotionInterface';
import type { PictographChecker } from '../../PictographChecker';
import type { ArrowInterface } from '../ArrowInterface';

export class DefaultArrowPositioner {
	private pictographData: PictographInterface;
	private gridData: GridData;
	private checker: PictographChecker;
	private loaded = false;
	private loadPromise: Promise<void>;

	private allDefaults: {
		diamond: Record<MotionType, any>;
		box: Record<MotionType, any>;
	} = {
		diamond: { pro: {}, anti: {}, float: {}, dash: {}, static: {} },
		box: { pro: {}, anti: {}, float: {}, dash: {}, static: {} }
	};

	private diamondPlacementsFiles: Record<MotionType, string> = {
		pro: 'default_diamond_pro_placements.json',
		anti: 'default_diamond_anti_placements.json',
		float: 'default_diamond_float_placements.json',
		dash: 'default_diamond_dash_placements.json',
		static: 'default_diamond_static_placements.json'
	};

	private boxPlacementFiles: Record<MotionType, string> = {
		pro: 'default_box_pro_placements.json',
		anti: 'default_box_anti_placements.json',
		float: 'default_box_float_placements.json',
		dash: 'default_box_dash_placements.json',
		static: 'default_box_static_placements.json'
	};

	constructor(pictographData: PictographInterface, gridData: GridData, checker: PictographChecker) {
		this.pictographData = pictographData;
		this.gridData = gridData;
		this.checker = checker;
		this.loadPromise = this.loadAllDefaultPlacements();
	}

	public async waitUntilLoaded(): Promise<void> {
		await this.loadPromise;
	}

	private async loadAllDefaultPlacements(): Promise<void> {
		const motionTypes: MotionType[] = [PRO, ANTI, FLOAT, DASH, STATIC];
		for (const motionType of motionTypes) {
			try {
				const diamondFile = this.diamondPlacementsFiles[motionType];
				const diamondUrl = `/arrow_placement/diamond/default/${diamondFile}`;
				const diamondData = await fetch(diamondUrl).then((r) => {
					if (!r.ok) throw new Error(`Failed to load ${diamondUrl}: ${r.status}`);
					return r.json();
				});

				const boxFile = this.boxPlacementFiles[motionType];
				const boxUrl = `/arrow_placement/box/default/${boxFile}`;
				const boxData = await fetch(boxUrl).then((r) => {
					if (!r.ok) throw new Error(`Failed to load ${boxUrl}: ${r.status}`);
					return r.json();
				});

				this.allDefaults.diamond[motionType] = diamondData;
				this.allDefaults.box[motionType] = boxData;
			} catch (err) {
				console.warn(`Problem loading default placements for ${motionType}:`, err);
				this.allDefaults.diamond[motionType] = {};
				this.allDefaults.box[motionType] = {};
			}
		}

		this.loaded = true;
	}
	public isLoaded(): boolean {
		return this.loaded;
	}
	public getDefaultAdjustment(arrow: ArrowInterface): [number, number] {
		if (!this.loaded) {
			console.warn('DefaultArrowPositioner data not fully loaded yet.');
			return [0, 0];
		  }

		const motionType = arrow.motion.motionType as MotionType;
		let gridMode = (this.pictographData.gridMode ?? DIAMOND).toLowerCase();
		if (![DIAMOND, BOX].includes(gridMode)) {
			gridMode = DIAMOND;
		}

		const defaultPlacements = this.allDefaults[gridMode as GridMode][motionType] || {};
		const adjustmentKey = this._get_adjustment_key(arrow, defaultPlacements);
		const turnsString = String(arrow.motion.turns);
		if (adjustmentKey in defaultPlacements && turnsString in defaultPlacements[adjustmentKey]) {
			return defaultPlacements[adjustmentKey][turnsString];
		} else {
			return defaultPlacements[motionType]?.[turnsString] ?? [0, 0];
		}
	}

	private _get_adjustment_key(arrow: ArrowInterface, defaultPlacements: any): string {
		const motionType = arrow.motion.motionType;
		const motionEndOri = arrow.motion.endOri;

		const hasBetaProps = this.checker.endsWithBeta();
		const hasAlphaProps = this.checker.endsWithAlpha();
		const hasGammaProps = this.checker.endsWithGamma();
		const hasHybridOrientation = this.checker.endsWithLayer3();
		const hasRadialProps = this.checker.endsWithRadialOri();
		const hasNonRadialProps = this.checker.endsWithNonRadialOri();

		const keySuffix = '_to_';
		let motionEndOriKey = '';

		if (hasHybridOrientation) {
			if (motionEndOri === IN || motionEndOri === OUT) {
				motionEndOriKey = `${RADIAL}_`;
			} else if (motionEndOri === CLOCK || motionEndOri === COUNTER) {
				motionEndOriKey = `${NONRADIAL}_`;
			}
		}

		let letterSuffix = '';
		if (this.pictographData.letter) {
			const letterVal = this.pictographData.letter;
			const letter = LetterUtils.getLetter(letterVal);
			const letterType = LetterUtils.getLetterType(letter);
			if (letterType && (letterType === LetterType.Type3 || letterType === LetterType.Type5)) {
				const char = letterVal.slice(0, -1);
				letterSuffix = `_${char}_dash`;
			} else {
				letterSuffix = `_${letterVal}`;
			}
		}

		let keyMiddle = '';
		if (hasRadialProps) {
			keyMiddle = 'layer1';
		} else if (hasNonRadialProps) {
			keyMiddle = 'layer2';
		} else if (hasHybridOrientation) {
			keyMiddle = 'layer3';
		}
		if (hasAlphaProps) {
			keyMiddle += '_alpha';
		} else if (hasBetaProps) {
			keyMiddle += '_beta';
		} else if (hasGammaProps) {
			keyMiddle += '_gamma';
		}

		let key = motionType;
		if (keyMiddle) {
			key += keySuffix + motionEndOriKey + keyMiddle;
		}
		const keyWithLetter = key + letterSuffix;

		if (keyWithLetter in defaultPlacements) {
			return keyWithLetter;
		} else if (key in defaultPlacements) {
			return key;
		} else {
			return motionType;
		}
	}
}
