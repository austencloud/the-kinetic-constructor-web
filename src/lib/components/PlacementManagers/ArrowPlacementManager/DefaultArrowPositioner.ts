import {
	PRO,
	ANTI,
	FLOAT,
	DASH,
	STATIC,
	DIAMOND,
	BOX,
	RADIAL,
	NONRADIAL,
	CLOCK,
	COUNTER,
	IN,
	OUT
} from '$lib/types/Constants';

import diamondProData from '$lib/data/arrow_placement/diamond/default/default_diamond_pro_placements.json';
import diamondAntiData from '$lib/data/arrow_placement/diamond/default/default_diamond_anti_placements.json';
import diamondFloatData from '$lib/data/arrow_placement/diamond/default/default_diamond_float_placements.json';
import diamondDashData from '$lib/data/arrow_placement/diamond/default/default_diamond_dash_placements.json';
import diamondStaticData from '$lib/data/arrow_placement/diamond/default/default_diamond_static_placements.json';

import boxProData from '$lib/data/arrow_placement/box/default/default_box_pro_placements.json';
import boxAntiData from '$lib/data/arrow_placement/box/default/default_box_anti_placements.json';
import boxFloatData from '$lib/data/arrow_placement/box/default/default_box_float_placements.json';
import boxDashData from '$lib/data/arrow_placement/box/default/default_box_dash_placements.json';
import boxStaticData from '$lib/data/arrow_placement/box/default/default_box_static_placements.json';
import { LetterType } from '$lib/types/LetterType';
import type { PictographData } from '$lib/types/PictographData';
import type { MotionType } from '$lib/types/Types';
import type { PictographChecker } from '$lib/components/Pictograph/PictographChecker';
import type { GridData } from '$lib/components/objects/Grid/GridData';
import { LetterUtils } from '$lib/utils/LetterUtils';
import type { ArrowData } from '$lib/components/objects/Arrow/ArrowData';

export class DefaultArrowPositioner {
	private allDefaults: {
		diamond: Record<MotionType, any>;
		box: Record<MotionType, any>;
	} = {
		diamond: {
			pro: diamondProData,
			anti: diamondAntiData,
			float: diamondFloatData,
			dash: diamondDashData,
			static: diamondStaticData
		},
		box: {
			pro: boxProData,
			anti: boxAntiData,
			float: boxFloatData,
			dash: boxDashData,
			static: boxStaticData
		}
	};

	constructor(
		private pictographData: PictographData,
		private gridData: GridData,
		private checker: PictographChecker
	) {}

	public getDefaultAdjustment(arrowData: ArrowData): [number, number] {
		const motionType = arrowData.motion.motionType as MotionType;
		const gridMode = this.pictographData.gridMode || DIAMOND;
		const defaultPlacements = this.allDefaults[gridMode][motionType] || {};
		const key = this._get_adjustment_key(arrowData, defaultPlacements);
		const turnsString = String(arrowData.motion.turns);

		if (key in defaultPlacements && turnsString in defaultPlacements[key]) {
			return defaultPlacements[key][turnsString];
		} else if (motionType in defaultPlacements && turnsString in defaultPlacements[motionType]) {
			return defaultPlacements[motionType][turnsString];
		}
		return [0, 0];
	}

	private _get_adjustment_key(arrow: ArrowData, defaultPlacements: any): string {
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
