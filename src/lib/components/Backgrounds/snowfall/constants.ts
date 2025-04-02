import { AnimationConfig } from '../core/AnimationConfig';

export const backgroundGradient = AnimationConfig.background.gradientStops.map((stop) => ({
	stop: stop.position,
	color: stop.color
}));

export const performanceThresholds = {
	minRenderFps: 30,

	lowPerformanceThreshold: AnimationConfig.performance.lowPerformanceThreshold,

	criticalPerformanceThreshold: AnimationConfig.performance.criticalPerformanceThreshold
};

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

export const resizeConfig = {
	qualityRestoreDelay: 500,

	resizeQuality: 'low' as 'high' | 'medium' | 'low'
};
