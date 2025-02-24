import { RED, BLUE } from '$lib/types/Constants';
import { Motion } from '../objects/Motion/Motion';
import type { MotionData } from '../objects/Motion/MotionData';
import type { PictographData } from '$lib/types/PictographData';
import SvgManager from '../SvgManager/SvgManager';

export class PictographGetter {
	private _currentData: PictographData;
	private _initialized = false;
	private _svgManager = new SvgManager();

	constructor(initialData: PictographData) {
		this._currentData = initialData;
		this._initializeMotions();
	}

	public async initializeMotions(): Promise<void> {
		if (this._initialized) return;

		// Preload required SVGs
		await Promise.all([
			this.preloadMotionSvg(this._currentData.redMotionData ?? undefined),
			this.preloadMotionSvg(this._currentData.blueMotionData ?? undefined)
		]);

		this._initializeMotions();
	}

	private async preloadMotionSvg(motionData?: MotionData): Promise<void> {
		if (!motionData) return;

		try {
			await this._svgManager.getArrowSvg(
				motionData.motionType,
				motionData.startOri,
				motionData.turns,
				motionData.color
			);
		} catch (error) {
			console.error('Preload failed:', error);
		}
	}
	private _initializeMotions(): void {
		if (this._initialized) return;

		try {
			if (this._currentData.redMotionData && !this._currentData.redMotion) {
				this._currentData.redMotion = new Motion(
					this._currentData,
					this._currentData.redMotionData
				);
			}
			if (this._currentData.blueMotionData && !this._currentData.blueMotion) {
				this._currentData.blueMotion = new Motion(
					this._currentData,
					this._currentData.blueMotionData
				);
			}
			this._initialized = true;
		} catch (error) {
			console.error('Motion initialization failed:', error);
			this._initialized = false;
		}
	}

	private _deepClone<T>(obj: T): T {
		return JSON.parse(JSON.stringify(obj));
	}

	updateData(newData: PictographData): void {
		this._currentData = newData;
		this._initializeMotions();
	}

	public getShiftMotion(): Motion | null {
		try {
			const motions = [this._currentData.redMotion, this._currentData.blueMotion].filter(
				(m) => m?.motionData?.motionType
			);

			return (
				motions.find((m) => ['pro', 'anti', 'float'].includes(m!.motionData.motionType)) ?? null
			);
		} catch (error) {
			console.error('Shift motion detection failed:', error);
			return null;
		}
	}

	// Other methods remain similar but with added error handling
	public getOtherMotion(currentMotion: Motion): Motion | null {
		try {
			if (!this._initialized) return null;

			const otherColor = currentMotion.color === RED ? BLUE : RED;
			return this.motionByColor(otherColor);
		} catch (error) {
			console.error('Failed to get other motion:', error);
			return null;
		}
	}

	private motionByColor(color: string): Motion | null {
		try {
			return color === RED ? this._currentData.redMotion : this._currentData.blueMotion;
		} catch (error) {
			console.error('Motion by color failed:', error);
			return null;
		}
	}
}
