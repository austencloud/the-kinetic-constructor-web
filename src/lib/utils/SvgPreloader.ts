// src/lib/utils/SvgPreloader.ts
import type { Color, MotionType, Orientation, TKATurns } from '$lib/types/Types';
import { PropType } from '$lib/types/Types';
import { resourceCache } from '$lib/services/ResourceCache';
import { logger } from '$lib/core/logging';
import { toAppError } from '$lib/types/ErrorTypes';

export default class SvgPreloader {
	private svgManager: any = null;

	constructor() {
		// Defer creation of SvgManager until needed
		// This breaks the circular dependency
	}

	// Lazy-load SvgManager when needed
	private async getSvgManager() {
		if (!this.svgManager) {
			// Only import when needed, not during module initialization
			// This avoids the circular dependency at module load time
			if (typeof window !== 'undefined') {
				// Only attempt to load in browser context
				const { default: SvgManager } = await import('../components/SvgManager/SvgManager');
				this.svgManager = new SvgManager();
			}
		}
		return this.svgManager;
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
	private async isCached(key: string): Promise<boolean> {
		return await resourceCache.has(key);
	}

	/**
	 * Get SVG from cache or fetch and cache it
	 */
	private async getOrFetchSvg(key: string, fetchFn: () => Promise<string>): Promise<string> {
		// Check ResourceCache first
		const cachedSvg = await resourceCache.get<string>(key);
		if (cachedSvg) {
			return cachedSvg;
		}

		try {
			const svgContent = await fetchFn();
			await resourceCache.set(key, svgContent);
			logger.debug(`Cached SVG for key: ${key}`);
			return svgContent;
		} catch (error) {
			logger.error(`Failed to fetch SVG for key ${key}:`, { error: toAppError(error) });
			throw error;
		}
	}

	/**
	 * Preload a prop SVG
	 */
	async preloadPropSvg(propType: PropType, color: Color): Promise<string> {
		const key = this.getCacheKey('prop', propType, color);
		const manager = await this.getSvgManager();
		if (!manager) {
			throw new Error('SVG Manager could not be initialized (SSR context)');
		}
		return this.getOrFetchSvg(key, () => manager.getPropSvg(propType, color));
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
		const manager = await this.getSvgManager();
		if (!manager) {
			throw new Error('SVG Manager could not be initialized (SSR context)');
		}
		return this.getOrFetchSvg(key, () => manager.getArrowSvg(motionType, startOri, turns, color));
	}

	/**
	 * Bulk preload SVGs for common props
	 */
	async preloadCommonProps(): Promise<void> {
		const propTypes: PropType[] = [PropType.STAFF, PropType.CLUB, PropType.HAND];
		const colors: Color[] = ['red', 'blue'];

		try {
			const promises = propTypes.flatMap((propType) =>
				colors.map((color) => this.preloadPropSvg(propType, color))
			);

			await Promise.all(promises);
		} catch (error) {
			console.warn('Prop preloading skipped (possibly SSR context):', error);
		}
	}

	/**
	 * Bulk preload SVGs for common arrows
	 */
	async preloadCommonArrows(): Promise<void> {
		// Common combinations for arrows
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

		try {
			const promises = commonCombinations.flatMap((combo) =>
				colors.map((color) =>
					this.preloadArrowSvg(combo.motionType, combo.startOri, combo.turns, color)
				)
			);

			await Promise.all(promises);
			('✅ Common arrow SVGs preloaded');
		} catch (error) {
			console.warn('Arrow preloading skipped (possibly SSR context):', error);
		}
	}

	/**
	 * Preload all common SVGs
	 */
	async preloadCommonSvgs(): Promise<void> {
		try {
			await Promise.all([this.preloadCommonProps(), this.preloadCommonArrows()]);
		} catch (error) {
			console.warn('SVG preloading skipped (possibly SSR context)', error);
		}
	}

	/**
	 * Get SVG cache stats
	 */
	getCacheStats(): { resourceCacheStats: any } {
		return {
			resourceCacheStats: resourceCache.getStats()
		};
	}
}

// Create singleton instance
export const svgPreloader = new SvgPreloader();

// Function to initialize preloading at app startup
export async function initSvgPreloading(): Promise<void> {
	// Skip preloading in SSR context
	if (typeof window === 'undefined') {
		return;
	}

	try {
		await svgPreloader.preloadCommonSvgs();
	} catch (error) {
		console.error('SVG preloading failed:', error);
	}
}
