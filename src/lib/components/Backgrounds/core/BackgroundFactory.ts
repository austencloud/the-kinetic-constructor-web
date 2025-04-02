import { SnowfallBackgroundSystem } from '../snowfall/SnowfallBackgroundSystem';
import { GradientBackgroundSystem } from '../gradient/GradientBackgroundSystem';
import { DiamondBackgroundSystem } from '../diamond/DiamondBackgroundSystem';
import type {
	BackgroundSystem,
	BackgroundType,
	QualityLevel,
	AccessibilitySettings,
	BackgroundFactoryParams
} from '../types/types';
import { detectAppropriateQuality } from './AnimationConfig';

export class BackgroundFactory {
	private static defaultAccessibility: AccessibilitySettings = {
		reducedMotion: false,
		highContrast: false,
		visibleParticleSize: 2
	};

	public static createBackgroundSystem(
		params: BackgroundFactoryParams | BackgroundType
	): BackgroundSystem {
		const options: BackgroundFactoryParams = typeof params === 'string' ? { type: params } : params;

		const quality: QualityLevel =
			options.initialQuality ||
			(typeof window !== 'undefined' ? detectAppropriateQuality() : 'medium');

		const accessibility: AccessibilitySettings = {
			...this.defaultAccessibility,
			...(options.accessibility || {})
		};

		if (typeof window !== 'undefined' && window.matchMedia) {
			const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
			if (reducedMotionQuery.matches) {
				accessibility.reducedMotion = true;
			}

			const highContrastQuery = window.matchMedia('(prefers-contrast: more)');
			if (highContrastQuery.matches) {
				accessibility.highContrast = true;
			}
		}

		let backgroundSystem: BackgroundSystem;

		switch (options.type) {
			case 'snowfall':
				backgroundSystem = new SnowfallBackgroundSystem();
				break;
			case 'diamond':
				backgroundSystem = new DiamondBackgroundSystem();
				break;
			case 'gradient':
				backgroundSystem = new GradientBackgroundSystem();
				break;
			case 'starfield':
				console.warn('Starfield background not yet implemented, using diamond instead');
				backgroundSystem = new DiamondBackgroundSystem();
				break;
			default:
				backgroundSystem = new GradientBackgroundSystem();
		}

		if (backgroundSystem.setAccessibility) {
			backgroundSystem.setAccessibility(accessibility);
		}

		return backgroundSystem;
	}

	public static createOptimalBackgroundSystem(): BackgroundSystem {
		const quality = detectAppropriateQuality();

		let optimalType: BackgroundType = 'gradient';

		if (quality === 'high' || quality === 'medium') {
			if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
				const memory = (navigator as any).deviceMemory as number;

				if (memory >= 4) {
					optimalType = 'diamond';
				} else if (memory >= 2) {
					optimalType = 'snowfall';
				}
			} else {
				optimalType = quality === 'high' ? 'diamond' : 'snowfall';
			}
		}

		return this.createBackgroundSystem({
			type: optimalType,
			initialQuality: quality
		});
	}

	public static isBackgroundSupported(type: BackgroundType): boolean {
		const quality = detectAppropriateQuality();

		switch (type) {
			case 'gradient':
				return true;
			case 'snowfall':
				return quality !== 'minimal';
			case 'diamond':
				return quality === 'high' || quality === 'medium';
			case 'starfield':
				return false;
			default:
				return false;
		}
	}
}
