/**
 * Pictograph Data Validator
 * Provides comprehensive validation for pictograph data integrity
 * Ensures loaded data matches expected schema and business rules
 */

import type { PictographData } from '$lib/types/PictographData';
import type { DiamondPictographEntry } from './PictographDataLoader';

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

export interface ValidationOptions {
	strictMode?: boolean;
	checkBusinessRules?: boolean;
	allowEmptyFields?: boolean;
}

export class PictographDataValidator {
	private static readonly VALID_POSITIONS = [
		'alpha1',
		'alpha3',
		'alpha5',
		'alpha7',
		'beta1',
		'beta3',
		'beta5',
		'beta7',
		'gamma1',
		'gamma3',
		'gamma5',
		'gamma7',
		'gamma9',
		'gamma11',
		'gamma13',
		'gamma15'
	];

	private static readonly VALID_MOTION_TYPES = ['pro', 'anti', 'static', 'dash'];
	private static readonly VALID_DIRECTIONS = ['cw', 'ccw', 'no_rot'];
	private static readonly VALID_LOCATIONS = ['n', 's', 'e', 'w'];
	private static readonly VALID_TIMINGS = ['split', 'tog', 'quarter', 'none'];
	private static readonly VALID_DIRECTION_TYPES = ['same', 'opp', 'none'];

	/**
	 * Validate a CSV entry structure
	 */
	public static validateCsvEntry(
		entry: DiamondPictographEntry,
		options: ValidationOptions = {}
	): ValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Required field validation
		if (!entry.letter) {
			errors.push('Letter field is required');
		}

		if (!entry.startPos) {
			errors.push('Start position is required');
		} else if (!this.VALID_POSITIONS.includes(entry.startPos)) {
			errors.push(`Invalid start position: ${entry.startPos}`);
		}

		if (!entry.endPos) {
			errors.push('End position is required');
		} else if (!this.VALID_POSITIONS.includes(entry.endPos)) {
			errors.push(`Invalid end position: ${entry.endPos}`);
		}

		// Timing validation
		if (!this.VALID_TIMINGS.includes(entry.timing)) {
			errors.push(`Invalid timing: ${entry.timing}`);
		}

		// Direction validation
		if (!this.VALID_DIRECTION_TYPES.includes(entry.direction)) {
			errors.push(`Invalid direction type: ${entry.direction}`);
		}

		// Motion type validation
		if (!this.VALID_MOTION_TYPES.includes(entry.blueMotionType)) {
			errors.push(`Invalid blue motion type: ${entry.blueMotionType}`);
		}

		if (!this.VALID_MOTION_TYPES.includes(entry.redMotionType)) {
			errors.push(`Invalid red motion type: ${entry.redMotionType}`);
		}

		// Rotation direction validation
		if (!this.VALID_DIRECTIONS.includes(entry.bluePropRotDir)) {
			errors.push(`Invalid blue prop rotation direction: ${entry.bluePropRotDir}`);
		}

		if (!this.VALID_DIRECTIONS.includes(entry.redPropRotDir)) {
			errors.push(`Invalid red prop rotation direction: ${entry.redPropRotDir}`);
		}

		// Location validation
		if (!this.VALID_LOCATIONS.includes(entry.blueStartLoc)) {
			errors.push(`Invalid blue start location: ${entry.blueStartLoc}`);
		}

		if (!this.VALID_LOCATIONS.includes(entry.blueEndLoc)) {
			errors.push(`Invalid blue end location: ${entry.blueEndLoc}`);
		}

		if (!this.VALID_LOCATIONS.includes(entry.redStartLoc)) {
			errors.push(`Invalid red start location: ${entry.redStartLoc}`);
		}

		if (!this.VALID_LOCATIONS.includes(entry.redEndLoc)) {
			errors.push(`Invalid red end location: ${entry.redEndLoc}`);
		}

		// Business rule validation
		if (options.checkBusinessRules) {
			this.validateBusinessRules(entry, errors, warnings);
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings
		};
	}

	/**
	 * Validate a PictographData object
	 */
	public static validatePictographData(
		data: PictographData,
		options: ValidationOptions = {}
	): ValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Required fields
		if (!data.letter) {
			errors.push('Letter is required');
		}

		if (!data.startPos) {
			errors.push('Start position is required');
		}

		if (!data.endPos) {
			errors.push('End position is required');
		}

		if (!data.gridMode) {
			errors.push('Grid mode is required');
		} else if (data.gridMode !== 'diamond') {
			warnings.push(`Non-diamond grid mode detected: ${data.gridMode}`);
		}

		// Motion data validation
		if (data.blueMotionData) {
			const blueValidation = this.validateMotionData(data.blueMotionData, 'blue');
			errors.push(...blueValidation.errors);
			warnings.push(...blueValidation.warnings);
		}

		if (data.redMotionData) {
			const redValidation = this.validateMotionData(data.redMotionData, 'red');
			errors.push(...redValidation.errors);
			warnings.push(...redValidation.warnings);
		}

		// Prop data validation
		if (data.bluePropData) {
			const bluePropValidation = this.validatePropData(data.bluePropData, 'blue');
			errors.push(...bluePropValidation.errors);
			warnings.push(...bluePropValidation.warnings);
		}

		if (data.redPropData) {
			const redPropValidation = this.validatePropData(data.redPropData, 'red');
			errors.push(...redPropValidation.errors);
			warnings.push(...redPropValidation.warnings);
		}

		// Arrow data validation
		if (data.blueArrowData) {
			const blueArrowValidation = this.validateArrowData(data.blueArrowData, 'blue');
			errors.push(...blueArrowValidation.errors);
			warnings.push(...blueArrowValidation.warnings);
		}

		if (data.redArrowData) {
			const redArrowValidation = this.validateArrowData(data.redArrowData, 'red');
			errors.push(...redArrowValidation.errors);
			warnings.push(...redArrowValidation.warnings);
		}

		// Consistency checks
		if (options.checkBusinessRules) {
			this.validatePictographConsistency(data, errors, warnings);
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings
		};
	}

	/**
	 * Validate motion data structure
	 */
	private static validateMotionData(motionData: any, color: string): ValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		if (!motionData.motionType) {
			errors.push(`${color} motion type is required`);
		} else if (!this.VALID_MOTION_TYPES.includes(motionData.motionType)) {
			errors.push(`Invalid ${color} motion type: ${motionData.motionType}`);
		}

		if (!motionData.propRotDir) {
			errors.push(`${color} motion prop rotation direction is required`);
		} else if (!['cw', 'ccw', 'no_rot'].includes(motionData.propRotDir)) {
			errors.push(`Invalid ${color} motion prop rotation direction: ${motionData.propRotDir}`);
		}

		return { isValid: errors.length === 0, errors, warnings };
	}

	/**
	 * Validate prop data structure
	 */
	private static validatePropData(propData: any, color: string): ValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		if (!propData.propType) {
			errors.push(`${color} prop type is required`);
		}

		if (!propData.ori) {
			errors.push(`${color} prop orientation is required`);
		} else if (!['in', 'out', 'clock', 'counter'].includes(propData.ori)) {
			errors.push(`Invalid ${color} prop orientation: ${propData.ori}`);
		}

		return { isValid: errors.length === 0, errors, warnings };
	}

	/**
	 * Validate arrow data structure
	 */
	private static validateArrowData(arrowData: any, color: string): ValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		if (!arrowData.loc) {
			errors.push(`${color} arrow location is required`);
		} else if (!this.VALID_LOCATIONS.includes(arrowData.loc)) {
			errors.push(`Invalid ${color} arrow location: ${arrowData.loc}`);
		}

		if (!arrowData.motionType) {
			errors.push(`${color} arrow motion type is required`);
		} else if (!this.VALID_MOTION_TYPES.includes(arrowData.motionType)) {
			errors.push(`Invalid ${color} arrow motion type: ${arrowData.motionType}`);
		}

		return { isValid: errors.length === 0, errors, warnings };
	}

	/**
	 * Validate business rules for CSV entries
	 */
	private static validateBusinessRules(
		entry: DiamondPictographEntry,
		errors: string[],
		warnings: string[]
	): void {
		// Static motion should have no_rot
		if (entry.blueMotionType === 'static' && entry.bluePropRotDir !== 'no_rot') {
			warnings.push('Static blue motion should have no_rot prop rotation');
		}

		if (entry.redMotionType === 'static' && entry.redPropRotDir !== 'no_rot') {
			warnings.push('Static red motion should have no_rot prop rotation');
		}

		// Dash motion should have no_rot
		if (entry.blueMotionType === 'dash' && entry.bluePropRotDir !== 'no_rot') {
			warnings.push('Dash blue motion should have no_rot prop rotation');
		}

		if (entry.redMotionType === 'dash' && entry.redPropRotDir !== 'no_rot') {
			warnings.push('Dash red motion should have no_rot prop rotation');
		}

		// Same direction should have matching motion types
		if (entry.direction === 'same' && entry.blueMotionType !== entry.redMotionType) {
			warnings.push('Same direction should have matching motion types');
		}

		// Start and end positions should be different for non-static motions
		if (entry.startPos === entry.endPos && entry.timing !== 'none') {
			warnings.push('Start and end positions are the same for non-static timing');
		}
	}

	/**
	 * Validate consistency within PictographData
	 */
	private static validatePictographConsistency(
		data: PictographData,
		errors: string[],
		warnings: string[]
	): void {
		// Check motion data consistency with prop data
		if (data.blueMotionData && data.bluePropData) {
			// Compare prop rotation direction with prop orientation (both relate to rotation/direction)
			const motionPropRotDir = data.blueMotionData.propRotDir;
			const propOri = data.bluePropData.ori;

			// Only warn if both are rotational but don't match the expected pattern
			if (
				motionPropRotDir &&
				propOri &&
				((motionPropRotDir === 'cw' && !['clock'].includes(propOri)) ||
					(motionPropRotDir === 'ccw' && !['counter'].includes(propOri)))
			) {
				warnings.push('Blue motion prop rotation direction may not match prop orientation pattern');
			}
		}

		if (data.redMotionData && data.redPropData) {
			// Compare prop rotation direction with prop orientation (both relate to rotation/direction)
			const motionPropRotDir = data.redMotionData.propRotDir;
			const propOri = data.redPropData.ori;

			// Only warn if both are rotational but don't match the expected pattern
			if (
				motionPropRotDir &&
				propOri &&
				((motionPropRotDir === 'cw' && !['clock'].includes(propOri)) ||
					(motionPropRotDir === 'ccw' && !['counter'].includes(propOri)))
			) {
				warnings.push('Red motion prop rotation direction may not match prop orientation pattern');
			}
		}

		// Check for missing motion data when arrow data exists
		if (data.blueArrowData && !data.blueMotionData) {
			warnings.push('Blue arrow data exists without corresponding motion data');
		}

		if (data.redArrowData && !data.redMotionData) {
			warnings.push('Red arrow data exists without corresponding motion data');
		}

		// Check for static motions with movement arrows
		if (data.blueMotionData?.motionType === 'static' && data.blueArrowData) {
			// For static motions, check if the arrow is in a movement position
			if (data.blueArrowData.loc && data.blueMotionData.startLoc !== data.blueMotionData.endLoc) {
				warnings.push('Static blue motion should not have movement between different locations');
			}
		}

		if (data.redMotionData?.motionType === 'static' && data.redArrowData) {
			// For static motions, check if the arrow is in a movement position
			if (data.redArrowData.loc && data.redMotionData.startLoc !== data.redMotionData.endLoc) {
				warnings.push('Static red motion should not have movement between different locations');
			}
		}
	}

	/**
	 * Validate an array of pictograph data for sequence consistency
	 */
	public static validateSequence(
		sequence: PictographData[],
		options: ValidationOptions = {}
	): ValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		if (sequence.length === 0) {
			warnings.push('Empty sequence provided');
			return { isValid: true, errors, warnings };
		}

		// Validate each individual pictograph
		sequence.forEach((pictograph, index) => {
			const validation = this.validatePictographData(pictograph, options);
			validation.errors.forEach((error) => errors.push(`Beat ${index + 1}: ${error}`));
			validation.warnings.forEach((warning) => warnings.push(`Beat ${index + 1}: ${warning}`));
		});

		// Validate sequence connectivity
		if (options.checkBusinessRules) {
			for (let i = 0; i < sequence.length - 1; i++) {
				const current = sequence[i];
				const next = sequence[i + 1];

				if (current.endPos !== next.startPos) {
					warnings.push(
						`Beat ${i + 1} end position (${current.endPos}) does not connect to beat ${i + 2} start position (${next.startPos})`
					);
				}
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings
		};
	}

	/**
	 * Get validation summary for debugging
	 */
	public static getValidationSummary(results: ValidationResult[]): {
		totalValidated: number;
		validCount: number;
		invalidCount: number;
		totalErrors: number;
		totalWarnings: number;
		commonErrors: Record<string, number>;
		commonWarnings: Record<string, number>;
	} {
		const commonErrors: Record<string, number> = {};
		const commonWarnings: Record<string, number> = {};
		let totalErrors = 0;
		let totalWarnings = 0;

		results.forEach((result) => {
			totalErrors += result.errors.length;
			totalWarnings += result.warnings.length;

			result.errors.forEach((error) => {
				commonErrors[error] = (commonErrors[error] || 0) + 1;
			});

			result.warnings.forEach((warning) => {
				commonWarnings[warning] = (commonWarnings[warning] || 0) + 1;
			});
		});

		return {
			totalValidated: results.length,
			validCount: results.filter((r) => r.isValid).length,
			invalidCount: results.filter((r) => !r.isValid).length,
			totalErrors,
			totalWarnings,
			commonErrors,
			commonWarnings
		};
	}
}
