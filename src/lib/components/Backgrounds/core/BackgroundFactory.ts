// src/lib/components/Backgrounds/core/BackgroundFactory.ts
import { SnowfallBackgroundSystem } from '../snowfall/SnowfallBackgroundSystem';
import type {
  BackgroundSystem,
  BackgroundType,
  QualityLevel,
  AccessibilitySettings,
  BackgroundFactoryParams
} from '../types/types';
import { detectAppropriateQuality } from '../config';

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
      case 'starfield':
        console.warn('Starfield background not yet implemented, using snowfall instead');
        backgroundSystem = new SnowfallBackgroundSystem();
        break;
      default:
        // Default to snowfall if type is unknown
        backgroundSystem = new SnowfallBackgroundSystem();
    }

    if (backgroundSystem.setAccessibility) {
      backgroundSystem.setAccessibility(accessibility);
    }

    return backgroundSystem;
  }

  public static createOptimalBackgroundSystem(): BackgroundSystem {
    const quality = detectAppropriateQuality();
    
    // Since we only have snowfall now, we'll just return that
    return this.createBackgroundSystem({
      type: 'snowfall',
      initialQuality: quality
    });
  }

  public static isBackgroundSupported(type: BackgroundType): boolean {
    const quality = detectAppropriateQuality();

    switch (type) {
      case 'snowfall':
        return quality !== 'minimal';
      case 'starfield':
        return false; // Not implemented yet
      default:
        return false;
    }
  }
}