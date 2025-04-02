// src/lib/components/Backgrounds/types/types.ts
export type Dimensions = {
	width: number;
	height: number;
  };
  
  export type PerformanceMetrics = {
	fps: number;
	warnings: string[];
	particleCount?: number;
	renderTime?: number;
	memoryUsage?: number;
  };
  
  export type QualityLevel = 'high' | 'medium' | 'low' | 'minimal';
  
  // Updated to remove diamond and only keep snowfall and future-proof with starfield
  export type BackgroundType = 'snowfall' | 'starfield';
  
  export interface GradientStop {
	position: number;
	color: string;
  }
  
  export interface QualitySettings {
	densityMultiplier: number;
	enableShootingStars: boolean;
	enableSeasonal: boolean;
	particleComplexity: 'high' | 'medium' | 'low' | 'minimal';
	enableBloom: boolean;
	enableReflections: boolean;
  }
  
  export interface AccessibilitySettings {
	reducedMotion: boolean;
	highContrast: boolean;
	visibleParticleSize: number;
  }
  
  export interface AnimationComponent {
	initialize: (dimensions: Dimensions, quality: QualityLevel) => void;
	update: (dimensions: Dimensions) => void;
	draw: (ctx: CanvasRenderingContext2D, dimensions: Dimensions) => void;
	cleanup: () => void;
	setQuality: (quality: QualityLevel) => void;
	setAccessibility?: (settings: AccessibilitySettings) => void;
  }
  
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
  
  export interface SantaState {
	x: number;
	y: number;
	speed: number;
	active: boolean;
	direction: number;
	opacity: number;
	imageLoaded?: boolean;
  }
  
  export interface AnimationSystem<T> {
	initialize: (dimensions: Dimensions, quality: QualityLevel) => T;
	update: (state: T, dimensions: Dimensions) => T;
	draw: (state: T, ctx: CanvasRenderingContext2D, dimensions: Dimensions) => void;
	cleanup?: () => void;
	setQuality?: (quality: QualityLevel) => void;
	adjustToResize?: (
	  state: T,
	  oldDimensions: Dimensions,
	  newDimensions: Dimensions,
	  quality: QualityLevel
	) => T;
	setAccessibility?: (settings: AccessibilitySettings) => void;
  }
  
  export interface BackgroundSystem {
	initialize: (dimensions: Dimensions, quality: QualityLevel) => void;
	update: (dimensions: Dimensions) => void;
	draw: (ctx: CanvasRenderingContext2D, dimensions: Dimensions) => void;
	setQuality: (quality: QualityLevel) => void;
	cleanup: () => void;
	handleResize?: (oldDimensions: Dimensions, newDimensions: Dimensions) => void;
	setAccessibility?: (settings: AccessibilitySettings) => void;
	getMetrics?: () => PerformanceMetrics;
  }
  
  export interface BackgroundFactoryParams {
	type: BackgroundType;
	initialQuality?: QualityLevel;
	accessibility?: AccessibilitySettings;
	customConfig?: any;
  }
  
  export type BackgroundEvent =
	| { type: 'ready' }
	| { type: 'performanceReport'; metrics: PerformanceMetrics }
	| { type: 'qualityChanged'; quality: QualityLevel }
	| { type: 'error'; message: string; stack?: string };
  
  export interface ResourceTracker {
	trackResource: (resource: any) => void;
	untrackResource: (resource: any) => void;
	disposeAll: () => void;
  }