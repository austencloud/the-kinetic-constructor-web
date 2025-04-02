export const AnimationConfig = {
	performance: {
		lowPerformanceThreshold: 40,
		criticalPerformanceThreshold: 20,
		adaptationInterval: 2000
	},

	snowflake: {
		density: 0.0001,
		windChangeInterval: 200,
		minSize: 2,
		maxSize: 7,
		minSpeed: 1,
		maxSpeed: 3,
		colors: ['#FFFFFF', '#D6EAF8', '#AED6F1', '#85C1E9']
	},

	santa: {
		minInterval: 1200,
		maxInterval: 1500,
		minSpeed: 0.001,
		maxSpeed: 0.002,
		minY: 0.1,
		maxY: 0.3,
		opacity: 0.8,
		maxSizePercent: 0.05,
		maxSizePx: 100,
		assets: {
			leftImage: '/images/santa-left.png',
			rightImage: '/images/santa-right.png',
			fallbackLeft: 'data:image/png;base64,iVBORw0KGgo...',
			fallbackRight: 'data:image/png;base64,iVBORw0KGgo...'
		}
	},

	shootingStar: {
		minInterval: 1000,
		maxInterval: 1500,
		minSize: 3,
		maxSize: 5,
		minSpeed: 0.02,
		maxSpeed: 0.05,
		tailLength: {
			min: 10,
			max: 20
		},
		colors: ['#FFD700', '#FFFFFF', '#FFA500', '#00FFFF'],
		fadeRate: 0.02,
		twinkleChance: 0.5
	},

	diamond: {
		density: 0.00005,
		minSize: 4,
		maxSize: 12,
		minSpeed: 0.2,
		maxSpeed: 0.8,
		colors: ['#E8F6F3', '#D1F2EB', '#F0F8FF', '#FDFEFE'],
		shimmer: {
			frequency: 0.05,
			duration: 15,
			intensity: 0.3
		},
		rotation: {
			minSpeed: 0.001,
			maxSpeed: 0.005
		}
	},

	background: {
		gradientStops: [
			{ position: 0, color: '#0A0A2A' }, // Darker top
			{ position: 0.15, color: '#121239' }, // Transition
			{ position: 0.3, color: '#1A1A4D' }, // Transition
			{ position: 0.7, color: '#85C1E9' }, // Transition
			{ position: 0.85, color: '#70A8D1' }, // Transition
			{ position: 1, color: '#85C1E9' } // Icy blue bottom
		],
	
	
		alternativeGradients: {
			aurora: [
				{ position: 0, color: '#001A33' },
				{ position: 0.4, color: '#003D66' },
				{ position: 0.7, color: '#147A6F' },
				{ position: 1, color: '#0F5B5F' }
			],
			sunset: [
				{ position: 0, color: '#0F2027' },
				{ position: 0.3, color: '#203A43' },
				{ position: 0.7, color: '#2C5364' },
				{ position: 1, color: '#72616E' }
			],
			mystical: [
				{ position: 0, color: '#0f0c29' },
				{ position: 0.3, color: '#302b63' },
				{ position: 0.7, color: '#24243e' },
				{ position: 1, color: '#3b2667' }
			]
		}
	},

	quality: {
		high: {
			densityMultiplier: 1.0,
			enableShootingStars: true,
			enableSeasonal: true,
			enableDiamonds: true,
			particleComplexity: 'high',
			enableBloom: true,
			enableReflections: true
		},
		medium: {
			densityMultiplier: 0.7,
			enableShootingStars: true,
			enableSeasonal: true,
			enableDiamonds: true,
			particleComplexity: 'medium',
			enableBloom: false,
			enableReflections: false
		},
		low: {
			densityMultiplier: 0.4,
			enableShootingStars: false,
			enableSeasonal: false,
			enableDiamonds: true,
			particleComplexity: 'low',
			enableBloom: false,
			enableReflections: false
		},
		minimal: {
			densityMultiplier: 0.2,
			enableShootingStars: false,
			enableSeasonal: false,
			enableDiamonds: false,
			particleComplexity: 'minimal',
			enableBloom: false,
			enableReflections: false
		}
	},

	accessibility: {
		reducedMotion: {
			enabled: false,
			particleSpeed: 0.3,
			effectsOpacity: 0.7
		},
		highContrast: {
			enabled: false,
			colors: {
				background: [
					{ position: 0, color: '#000000' },
					{ position: 1, color: '#0A1855' }
				],
				particles: ['#F0F8FF', '#E3F2FD']
			}
		}
	},

	seasonal: {
		enabled: true,
		isChristmas: () => {
			const date = new Date();
			const month = date.getMonth();
			const day = date.getDate();
			return month === 11 || (month === 0 && day <= 7);
		},
		isNewYear: () => {
			const date = new Date();
			const month = date.getMonth();
			const day = date.getDate();
			return (month === 11 && day >= 30) || (month === 0 && day <= 7);
		},
		isHalloween: () => {
			const date = new Date();
			const month = date.getMonth();
			const day = date.getDate();
			return month === 9 && day >= 15;
		},
		themes: {
			christmas: {
				background: {
					gradientStops: [
						{ position: 0, color: '#1a472a' },
						{ position: 0.5, color: '#2d623d' },
						{ position: 1, color: '#5d8b75' }
					]
				},
				particles: {
					additionalColors: ['#FF0000', '#FFFF00', '#00FF00']
				}
			},
			halloween: {
				background: {
					gradientStops: [
						{ position: 0, color: '#000000' },
						{ position: 0.5, color: '#310A31' },
						{ position: 1, color: '#571B7E' }
					]
				},
				particles: {
					additionalColors: ['#FF6700', '#C21807']
				}
			}
		}
	}
};

export function detectAppropriateQuality(): 'high' | 'medium' | 'low' | 'minimal' {
	if (typeof window === 'undefined') return 'medium';

	if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		AnimationConfig.accessibility.reducedMotion.enabled = true;
		return 'low';
	}

	if (window.matchMedia && window.matchMedia('(prefers-contrast: more)').matches) {
		AnimationConfig.accessibility.highContrast.enabled = true;
	}

	const lowPowerDevice =
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
		(typeof (navigator as any).deviceMemory !== 'undefined' && (navigator as any).deviceMemory < 4);

	if (lowPowerDevice) return 'low';

	const smallScreen = window.innerWidth < 768 || window.innerHeight < 600;
	if (smallScreen) return 'medium';

	return 'high';
}

export function isWebGL2Supported(): boolean {
	try {
		if (typeof window === 'undefined') return false;

		const canvas = document.createElement('canvas');
		return !!canvas.getContext('webgl2');
	} catch (e) {
		return false;
	}
}

export function getOptimizedConfig(quality: 'high' | 'medium' | 'low' | 'minimal') {
	const baseConfig = { ...AnimationConfig };
	const qualitySettings = baseConfig.quality[quality];

	if (baseConfig.accessibility.reducedMotion.enabled) {
		baseConfig.snowflake.minSpeed *= baseConfig.accessibility.reducedMotion.particleSpeed;
		baseConfig.snowflake.maxSpeed *= baseConfig.accessibility.reducedMotion.particleSpeed;
		baseConfig.diamond.minSpeed *= baseConfig.accessibility.reducedMotion.particleSpeed;
		baseConfig.diamond.maxSpeed *= baseConfig.accessibility.reducedMotion.particleSpeed;
		baseConfig.shootingStar.minSpeed *= baseConfig.accessibility.reducedMotion.particleSpeed;
		baseConfig.shootingStar.maxSpeed *= baseConfig.accessibility.reducedMotion.particleSpeed;
	}

	if (baseConfig.accessibility.highContrast.enabled) {
		baseConfig.background.gradientStops = baseConfig.accessibility.highContrast.colors.background;
		baseConfig.snowflake.colors = baseConfig.accessibility.highContrast.colors.particles;
		baseConfig.diamond.colors = baseConfig.accessibility.highContrast.colors.particles;
	}

	if (baseConfig.seasonal.enabled) {
		if (baseConfig.seasonal.isChristmas() && qualitySettings.enableSeasonal) {
			baseConfig.background.gradientStops =
				baseConfig.seasonal.themes.christmas.background.gradientStops;

			baseConfig.snowflake.colors = [
				...baseConfig.snowflake.colors,
				...baseConfig.seasonal.themes.christmas.particles.additionalColors
			];
		} else if (baseConfig.seasonal.isHalloween() && qualitySettings.enableSeasonal) {
			baseConfig.background.gradientStops =
				baseConfig.seasonal.themes.halloween.background.gradientStops;

			baseConfig.snowflake.colors = [
				...baseConfig.snowflake.colors,
				...baseConfig.seasonal.themes.halloween.particles.additionalColors
			];
		}
	}

	return {
		baseConfig,
		qualitySettings
	};
}
