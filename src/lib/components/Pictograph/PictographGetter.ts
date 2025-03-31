import type { PictographData } from '$lib/types/PictographData';
import { Motion } from '$lib/components/objects/Motion/Motion';
import type { MotionData } from '$lib/components/objects/Motion/MotionData';
import SvgManager from '$lib/components/SvgManager/SvgManager';
import { RED, BLUE } from '$lib/types/Constants';

export class PictographGetter {
	private _currentData: PictographData;
	public initialized = false;
	private _svgManager = new SvgManager();
	// Add memoization cache
	private _memoCache: Map<string, any> = new Map();

	constructor(initialData: PictographData) {
		this._currentData = initialData;
		this._initializeMotions();
	}

	public async initializeMotions(): Promise<void> {
		if (this.initialized) return;
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
		if (this.initialized) return;
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
			this.initialized = true;
		} catch (error) {
			console.error('Motion initialization failed:', error);
			this.initialized = false;
		}
	}

	updateData(newData: PictographData): void {
		this._currentData = newData;
		// Clear memoization cache on data change
		this._memoCache.clear();
		this._initializeMotions();
	}

	public getShiftMotion(): Motion | null {
		// Use memoization for expensive calculations
		const cacheKey = 'shiftMotion';

		if (this._memoCache.has(cacheKey)) {
			return this._memoCache.get(cacheKey);
		}

		try {
			const motions = [this._currentData.redMotion, this._currentData.blueMotion].filter(
				(m) => m?.motionType
			);
			const result = motions.find((m) => ['pro', 'anti', 'float'].includes(m!.motionType)) ?? null;

			// Cache the result
			this._memoCache.set(cacheKey, result);
			return result;
		} catch (error) {
			console.error('Shift motion detection failed:', error);
			return null;
		}
	}

	public getOtherMotion(currentMotion: Motion): Motion | null {
		// Create a unique cache key based on the input motion
		const cacheKey = `otherMotion:${currentMotion.id}`;

		if (this._memoCache.has(cacheKey)) {
			return this._memoCache.get(cacheKey);
		}

		try {
			if (!this.initialized) return null;
			const otherColor = currentMotion.color === RED ? BLUE : RED;
			const result = this.motionByColor(otherColor);

			// Cache the result
			this._memoCache.set(cacheKey, result);
			return result;
		} catch (error) {
			console.error('Failed to get other motion:', error);
			return null;
		}
	}

	private motionByColor(color: string): Motion | null {
		const cacheKey = `motionByColor:${color}`;

		if (this._memoCache.has(cacheKey)) {
			return this._memoCache.get(cacheKey);
		}

		try {
			const result =
				(color === RED ? this._currentData.redMotion : this._currentData.blueMotion) ?? null;
			this._memoCache.set(cacheKey, result);
			return result;
		} catch (error) {
			console.error('Motion by color failed:', error);
			return null;
		}
	}
}
