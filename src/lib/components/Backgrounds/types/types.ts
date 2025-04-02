/**
 * Common type definitions for background systems
 */

export type Dimensions = {
	width: number;
	height: number;
};

export type PerformanceMetrics = {
	fps: number;
	warnings: string[];
};

export type QualityLevel = 'high' | 'medium' | 'low';

export type BackgroundType = 'snowfall' | 'starfield' | 'gradient';

export interface GradientStop {
	position: number;
	color: string;
}

export interface QualitySettings {
	densityMultiplier: number;
	enableShootingStars: boolean;
	enableSeasonal: boolean;
}

/**
 * Interfaces for animation components
 */

// Base interface for all animation components
export interface AnimationComponent {
	initialize: (dimensions: Dimensions, quality: QualityLevel) => void;
	update: (dimensions: Dimensions) => void;
	draw: (ctx: CanvasRenderingContext2D, dimensions: Dimensions) => void;
	cleanup: () => void;
}

// Snowflake-specific types
export interface Snowflake {
	x: number;
	y: number;
	speed: number;
	size: number;
	sway: number;
	opacity: number;
	shape: Path2D;
	color: string;
}

// Shooting star types
export interface ShootingStar {
	x: number;
	y: number;
	dx: number;
	dy: number;
	size: number;
	speed: number;
	tail: Array<{
		x: number;
		y: number;
		size: number;
		color: string;
	}>;
	prevX: number;
	prevY: number;
	tailLength: number;
	opacity: number;
	offScreen: boolean;
	color: string;
	twinkle: boolean;
}

export interface ShootingStarState {
	star: ShootingStar | null;
	timer: number;
	interval: number;
}

// Santa types
export interface SantaState {
	x: number;
	y: number;
	speed: number;
	active: boolean;
	direction: number;
	opacity: number;
}

// Animation system interfaces
export interface AnimationSystem<T> {
	initialize: (dimensions: Dimensions, quality: QualityLevel) => T;
	update: (state: T, dimensions: Dimensions) => T;
	draw: (state: T, ctx: CanvasRenderingContext2D, dimensions: Dimensions) => void;
	cleanup?: () => void;
}

// Background system interface
export interface BackgroundSystem {
	initialize: (dimensions: Dimensions, quality: QualityLevel) => void;
	update: (dimensions: Dimensions) => void;
	draw: (ctx: CanvasRenderingContext2D, dimensions: Dimensions) => void;
	setQuality: (quality: QualityLevel) => void;
	cleanup: () => void;
}
