import { AnimationConfig } from "../AnimationConfig";

/**
 * Background gradient configuration
 */
export const backgroundGradient = AnimationConfig.background.gradientStops.map(stop => ({
    stop: stop.position,
    color: stop.color
}));

/**
 * Performance thresholds
 */
export const performanceThresholds = {
    // Minimum FPS to render non-essential animations
    minRenderFps: 30,
    // FPS threshold to reduce quality
    lowPerformanceThreshold: AnimationConfig.performance.lowPerformanceThreshold,
    // FPS threshold to disable some animations
    criticalPerformanceThreshold: AnimationConfig.performance.criticalPerformanceThreshold
};

/**
 * Quality settings mappings
 */
export const qualitySettings = {
    high: {
        densityMultiplier: 1.0,
        enableShootingStars: true,
        enableSeasonal: true
    },
    medium: {
        densityMultiplier: 0.75,
        enableShootingStars: true,
        enableSeasonal: true
    },
    low: {
        densityMultiplier: 0.5,
        enableShootingStars: false,
        enableSeasonal: false
    }
};

/**
 * Resize handling configuration
 */
export const resizeConfig = {
    // Delay before restoring quality after resize (ms)
    qualityRestoreDelay: 500,
    // Quality setting to use during resize
    resizeQuality: 'low' as 'high' | 'medium' | 'low'
};