// src/lib/components/Pictograph/composables/usePictographSvgPreloading.ts
import { get } from 'svelte/store';
import type { PictographState } from './usePictographState';
import SvgManager from '../../SvgManager/SvgManager';
import type { Color, MotionType, Orientation, TKATurns } from '$lib/types/Types';
import { PropType } from '$lib/types/Types';

export function usePictographSvgPreloading(state: PictographState, isBeatFramePictograph: boolean) {
	function isMobile(): boolean {
		return (
			typeof window !== 'undefined' &&
			(window.innerWidth <= 768 ||
				/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
		);
	}

	function preloadAllSvgs() {
		if (typeof window === 'undefined' || !get(state.service)) return;

		const delay = isBeatFramePictograph ? 0 : 10;

		setTimeout(async () => {
			const data = get(state.pictographDataStore);

			const arrowConfigs: Array<{
				motionType: MotionType;
				startOri: Orientation;
				turns: TKATurns;
				color: Color;
			}> = [];

			const propConfigs: Array<{
				propType: PropType;
				color: Color;
			}> = [];

			// Collect configs
			if (data.redArrowData) {
				arrowConfigs.push({
					motionType: data.redArrowData.motionType,
					startOri: data.redArrowData.startOri,
					turns: data.redArrowData.turns,
					color: data.redArrowData.color
				});
			}

			if (data.blueArrowData) {
				arrowConfigs.push({
					motionType: data.blueArrowData.motionType,
					startOri: data.blueArrowData.startOri,
					turns: data.blueArrowData.turns,
					color: data.blueArrowData.color
				});
			}

			if (data.redPropData) {
				propConfigs.push({
					propType: data.redPropData.propType,
					color: data.redPropData.color
				});
			}

			if (data.bluePropData) {
				propConfigs.push({
					propType: data.bluePropData.propType,
					color: data.bluePropData.color
				});
			}

			// Preload in parallel
			if (arrowConfigs.length > 0 || propConfigs.length > 0) {
				try {
					const svgManager = new SvgManager();

					await Promise.all([
						propConfigs.length > 0 ? svgManager.preloadPropSvgs(propConfigs) : Promise.resolve(),
						arrowConfigs.length > 0 ? svgManager.preloadArrowSvgs(arrowConfigs) : Promise.resolve()
					]);

					if (import.meta.env.DEV) {
						console.debug('Pictograph: Preloaded all SVGs:', {
							props: propConfigs.length,
							arrows: arrowConfigs.length,
							isBeatFrame: isBeatFramePictograph
						});
					}
				} catch (error) {
					if (import.meta.env.DEV) {
						console.warn('Pictograph: SVG preloading error:', error);
					}
				}
			}
		}, delay);
	}

	return {
		preloadAllSvgs
	};
}
