
import { SnowfallBackgroundSystem } from '../snowfall/SnowfallBackgroundSystem';
import { GradientBackgroundSystem } from '../gradient/GradientBackgroundSystem';
import type { BackgroundSystem, BackgroundType } from '../types/types';

/**
 * Factory for creating background systems
 */
export class BackgroundFactory {
  /**
   * Create a background system based on type
   * @param type The type of background to create
   * @returns A background system instance
   */
  public static createBackgroundSystem(type: BackgroundType): BackgroundSystem {
    switch (type) {
      case 'snowfall':
        return new SnowfallBackgroundSystem();
      case 'gradient':
        return new GradientBackgroundSystem();
      case 'starfield':
        // Placeholder for future implementation
        // For now, fall back to gradient
        console.warn('Starfield background not yet implemented, using gradient instead');
        return new GradientBackgroundSystem();
      default:
        // Default to gradient as fallback
        return new GradientBackgroundSystem();
    }
  }
}