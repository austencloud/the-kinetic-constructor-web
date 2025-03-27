// src/lib/utils/SvgPreloader.ts
import SvgManager from '../components/SvgManager/SvgManager';
import type { Color, MotionType, Orientation, TKATurns } from '$lib/types/Types';
import { PropType } from '$lib/types/Types';

// Cache for SVG content
const svgCache: Record<string, string> = {};

export default class SvgPreloader {
	private svgManager: SvgManager;

	constructor() {
		this.svgManager = new SvgManager();
	}

	/**
	 * Generate a cache key for SVG content
	 */
	private getCacheKey(type: 'prop' | 'arrow', ...args: string[]): string {
		return `${type}:${args.join(':')}`;
	}

	/**
	 * Check if an SVG is already cached
	 */
	private isCached(key: string): boolean {
		return !!svgCache[key];
	}

	/**
	 * Get SVG from cache or fetch and cache it
	 */
	private async getOrFetchSvg(key: string, fetchFn: () => Promise<string>): Promise<string> {
		if (this.isCached(key)) {
			return svgCache[key];
		}

		try {
			const svgContent = await fetchFn();
			svgCache[key] = svgContent;
			return svgContent;
		} catch (error) {
			console.error(`Failed to fetch SVG for key ${key}:`, error);
			throw error;
		}
	}

	/**
	 * Preload a prop SVG
	 */
	async preloadPropSvg(propType: PropType, color: Color): Promise<string> {
		const key = this.getCacheKey('prop', propType, color);
		return this.getOrFetchSvg(key, () => this.svgManager.getPropSvg(propType, color));
	}

	/**
	 * Preload an arrow SVG
	 */
	async preloadArrowSvg(
		motionType: MotionType,
		startOri: Orientation,
		turns: TKATurns,
		color: Color
	): Promise<string> {
		const key = this.getCacheKey('arrow', motionType, startOri, String(turns), color);
		return this.getOrFetchSvg(key, () =>
			this.svgManager.getArrowSvg(motionType, startOri, turns, color)
		);
	}

	/**
	 * Bulk preload SVGs for common props
	 */
	async preloadCommonProps(): Promise<void> {
		const propTypes: PropType[] = [
			PropType.STAFF, 
			PropType.CLUB, 
			PropType.HAND
		];
		const colors: Color[] = ['red', 'blue'];

		const promises = propTypes.flatMap((propType) =>
			colors.map((color) => this.preloadPropSvg(propType, color))
		);

		await Promise.all(promises);
		console.log('✅ Common prop SVGs preloaded');
	}

	/**
	 * Bulk preload SVGs for common arrows
	 */
	async preloadCommonArrows(): Promise<void> {
		// To avoid too many preloads at once, we'll just preload the most common combinations
		const commonCombinations = [
			// Pro motions with common turns
			{ motionType: 'pro' as MotionType, startOri: 'in' as Orientation, turns: 0 as TKATurns },
			{ motionType: 'pro' as MotionType, startOri: 'out' as Orientation, turns: 0 as TKATurns },
			{ motionType: 'pro' as MotionType, startOri: 'in' as Orientation, turns: 1 as TKATurns },
			// Anti motions with common turns
			{ motionType: 'anti' as MotionType, startOri: 'in' as Orientation, turns: 0 as TKATurns },
			{ motionType: 'anti' as MotionType, startOri: 'out' as Orientation, turns: 0 as TKATurns },
			// Static and dash
			{ motionType: 'static' as MotionType, startOri: 'in' as Orientation, turns: 0 as TKATurns },
			{ motionType: 'dash' as MotionType, startOri: 'in' as Orientation, turns: 0 as TKATurns }
		];

		const colors: Color[] = ['red', 'blue'];

		const promises = commonCombinations.flatMap((combo) =>
			colors.map((color) =>
				this.preloadArrowSvg(combo.motionType, combo.startOri, combo.turns, color)
			)
		);

		await Promise.all(promises);
		console.log('✅ Common arrow SVGs preloaded');
	}

	/**
	 * Preload all common SVGs
	 */
	async preloadCommonSvgs(): Promise<void> {
		await Promise.all([this.preloadCommonProps(), this.preloadCommonArrows()]);
		console.log(
			`✅ SVG preloading complete. Cache contains ${Object.keys(svgCache).length} items.`
		);
	}

	/**
	 * Get SVG cache stats
	 */
	getCacheStats(): { total: number; props: number; arrows: number } {
		const cacheKeys = Object.keys(svgCache);
		return {
			total: cacheKeys.length,
			props: cacheKeys.filter((key) => key.startsWith('prop:')).length,
			arrows: cacheKeys.filter((key) => key.startsWith('arrow:')).length
		};
	}
}

// Create singleton instance
export const svgPreloader = new SvgPreloader();

// Function to initialize preloading at app startup
export async function initSvgPreloading(): Promise<void> {
	try {
		await svgPreloader.preloadCommonSvgs();
	} catch (error) {
		console.error('SVG preloading failed:', error);
	}
}