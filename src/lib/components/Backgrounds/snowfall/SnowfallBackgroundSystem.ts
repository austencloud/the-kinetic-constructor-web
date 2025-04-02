import { createSnowflakeSystem } from '../systems/SnowflakeSystem';
import { createShootingStarSystem } from '../systems/ShootingStarSystem';
import type {
	BackgroundSystem,
	Dimensions,
	QualityLevel,
	ShootingStarState,
	Snowflake
} from '../types/types';
import { drawBackgroundGradient } from './utils/backgroundUtils';
import { AnimationConfig } from '../core/AnimationConfig';

export class SnowfallBackgroundSystem implements BackgroundSystem {
	private snowflakeSystem = createSnowflakeSystem();
	private shootingStarSystem = createShootingStarSystem();

	private snowflakes: Snowflake[] = [];
	private shootingStarState: ShootingStarState;

	private quality: QualityLevel = 'medium';
	private isDecember: boolean = false;

	constructor() {
		this.shootingStarState = this.shootingStarSystem.initialState;

		this.isDecember = new Date().getMonth() === 11;
	}

	public initialize(dimensions: Dimensions, quality: QualityLevel): void {
		this.quality = quality;

		this.snowflakes = this.snowflakeSystem.initialize(dimensions, quality);

		this.shootingStarState = this.shootingStarSystem.initialState;
	}

	public update(dimensions: Dimensions): void {
		this.snowflakes = this.snowflakeSystem.update(this.snowflakes, dimensions);

		if (this.quality === 'high') {
			this.shootingStarState = this.shootingStarSystem.update(this.shootingStarState, dimensions);
		}
	}

	public draw(ctx: CanvasRenderingContext2D, dimensions: Dimensions): void {
		drawBackgroundGradient(ctx, dimensions, AnimationConfig.background.gradientStops);

		this.snowflakeSystem.draw(this.snowflakes, ctx, dimensions);

		if (this.quality === 'high') {
			this.shootingStarSystem.draw(this.shootingStarState, ctx);
		}
	}

	public setQuality(quality: QualityLevel): void {
		this.quality = quality;
	}

	public handleResize(oldDimensions: Dimensions, newDimensions: Dimensions): void {
		this.snowflakes = this.snowflakeSystem.adjustToResize(
			this.snowflakes,
			oldDimensions,
			newDimensions,
			this.quality
		);

		this.shootingStarState = this.shootingStarSystem.initialState;
	}

	public cleanup(): void {}
}
