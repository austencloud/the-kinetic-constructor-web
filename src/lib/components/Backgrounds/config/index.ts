// src/lib/components/Backgrounds/config/index.ts
import { CoreConfig, detectAppropriateQuality, isWebGL2Supported } from './core';
import { SnowfallConfig } from './snowfall';
import { DiamondConfig } from './diamond';
import { SeasonalConfig } from './seasonal';
import { SantaConfig } from './santa';
import type { QualityLevel } from '../types/types';

export {
	CoreConfig,
	SnowfallConfig,
	DiamondConfig,
	SeasonalConfig,
	SantaConfig,
	detectAppropriateQuality,
	isWebGL2Supported
};

// Function to get optimized configuration based on quality level
export function getOptimizedConfig(quality: QualityLevel) {
	const qualitySettings = CoreConfig.quality[quality];

	// Apply accessibility settings if enabled
	let config = {
		core: { ...CoreConfig },
		snowfall: { ...SnowfallConfig },
		diamond: { ...DiamondConfig },
		seasonal: { ...SeasonalConfig },
		santa: { ...SantaConfig }
	};

	if (CoreConfig.accessibility.reducedMotion.enabled) {
		const speedFactor = CoreConfig.accessibility.reducedMotion.particleSpeed;
		config.snowfall.snowflake.minSpeed *= speedFactor;
		config.snowfall.snowflake.maxSpeed *= speedFactor;
		config.diamond.minSpeed *= speedFactor;
		config.diamond.maxSpeed *= speedFactor;
		config.snowfall.shootingStar.minSpeed *= speedFactor;
		config.snowfall.shootingStar.maxSpeed *= speedFactor;
	}

	if (CoreConfig.accessibility.highContrast.enabled) {
		config.core.background.gradientStops = CoreConfig.accessibility.highContrast.colors.background;
		config.snowfall.snowflake.colors = CoreConfig.accessibility.highContrast.colors.particles;
		config.diamond.colors = CoreConfig.accessibility.highContrast.colors.particles;
	}

	// Apply seasonal themes if enabled
	if (SeasonalConfig.enabled && qualitySettings.enableSeasonal) {
		if (SeasonalConfig.isChristmas()) {
			config.core.background.gradientStops =
				SeasonalConfig.themes.christmas.background.gradientStops;
			config.snowfall.snowflake.colors = [
				...config.snowfall.snowflake.colors,
				...SeasonalConfig.themes.christmas.particles.additionalColors
			];
		} else if (SeasonalConfig.isHalloween()) {
			config.core.background.gradientStops =
				SeasonalConfig.themes.halloween.background.gradientStops;
			config.snowfall.snowflake.colors = [
				...config.snowfall.snowflake.colors,
				...SeasonalConfig.themes.halloween.particles.additionalColors
			];
		}
	}

	return {
		config,
		qualitySettings
	};
}
