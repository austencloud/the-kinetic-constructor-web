// src/lib/components/Backgrounds/config/summerDay.ts

export const SummerDayConfig = {
	// Background Gradient - Warm summer sky colors
	background: {
		gradientStops: [
			{ position: 0, color: '#4A90E2' },    // Bright blue sky at top
			{ position: 0.3, color: '#87CEEB' },  // Sky blue transition
			{ position: 0.6, color: '#FFC966' },  // Warm yellow/orange transition
			{ position: 0.8, color: '#FF9933' },  // Deeper orange near horizon
			{ position: 1, color: '#FF8C42' }     // Warm orange at bottom
		]
	},

	// Sun
	sun: {
		enabledOnQuality: ['high', 'medium', 'low'],
		radiusPercent: 0.08,         // 8% of min(width, height)
		maxRadiusPx: 80,
		color: '#FFDD66',            // Warm yellow
		glowColor: '#FFAA33',        // Orange glow
		glowSize: 1.5,               // Multiplier of radius
		position: { x: 0.85, y: 0.15 }, // Top right quadrant
		driftSpeed: 0.00001          // Very slow drift
	},

	// Clouds
	clouds: {
		enabledOnQuality: ['high', 'medium'],
		density: 0.00003,            // Density relative to canvas area
		minWidth: 80,
		maxWidth: 200,
		minHeight: 40,
		maxHeight: 80,
		color: '#FFFFFF',            // White clouds
		opacity: {
			min: 0.7,
			max: 0.9
		},
		speed: {
			min: 0.05,
			max: 0.2
		},
		count: {
			high: 8,
			medium: 5,
			low: 3,
			minimal: 1
		}
	},

	// Birds (Easter Egg)
	birds: {
		enabledOnQuality: ['high'],
		minInterval: 10000,          // Appears every 10-20 seconds
		maxInterval: 20000,
		flockSize: {
			min: 3,
			max: 7
		},
		size: {
			min: 3,
			max: 6
		},
		speed: 0.8,
		color: '#333333'             // Dark silhouettes
	},

	// Butterflies (Easter Egg)
	butterflies: {
		enabledOnQuality: ['high', 'medium'],
		minInterval: 8000,           // Appears every 8-15 seconds
		maxInterval: 15000,
		count: {
			high: 3,
			medium: 2,
			low: 1
		},
		size: {
			min: 4,
			max: 8
		},
		colors: ['#FFCC00', '#FF6699', '#99FF99', '#9999FF'], // Colorful butterflies
		speed: 0.4,
		flutterSpeed: 0.1
	}
};
