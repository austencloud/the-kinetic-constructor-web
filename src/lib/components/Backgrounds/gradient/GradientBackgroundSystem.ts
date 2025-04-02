import { AnimationConfig } from '../core/AnimationConfig';
import { drawBackgroundGradient } from '../snowfall/utils/backgroundUtils';
import type { BackgroundSystem, Dimensions, GradientStop, QualityLevel } from '../types/types';

export class GradientBackgroundSystem implements BackgroundSystem {
	private gradientStops: GradientStop[] = [];

	constructor() {
		this.gradientStops = [...AnimationConfig.background.gradientStops];
	}

	public initialize(dimensions: Dimensions, quality: QualityLevel): void {}

	public update(dimensions: Dimensions): void {}

	public draw(ctx: CanvasRenderingContext2D, dimensions: Dimensions): void {
		drawBackgroundGradient(ctx, dimensions, this.gradientStops);
	}

	public setQuality(quality: QualityLevel): void {}

	public cleanup(): void {}

	public setGradient(gradientStops: GradientStop[]): void {
		this.gradientStops = [...gradientStops];
	}
}
