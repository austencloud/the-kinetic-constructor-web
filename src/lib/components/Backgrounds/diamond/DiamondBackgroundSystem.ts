import { getOptimizedConfig, isWebGL2Supported } from '../core/AnimationConfig';
import { drawBackgroundGradient } from '../snowfall/utils/backgroundUtils';
import { createDiamondSystem } from '../systems/DiamondSystem';
import { createShootingStarSystem } from '../systems/ShootingStarSystem';
import type {
	BackgroundSystem,
	Dimensions,
	Diamond,
	QualityLevel,
	ShootingStarState
} from '../types/types';

export class DiamondBackgroundSystem implements BackgroundSystem {
	private diamondSystem = createDiamondSystem();
	private shootingStarSystem = createShootingStarSystem();

	private diamonds: Diamond[] = [];
	private shootingStarState: ShootingStarState;

	private quality: QualityLevel = 'medium';
	private webGL2Available: boolean = false;

	private effectsCanvas: HTMLCanvasElement | null = null;
	private effectsContext: CanvasRenderingContext2D | null = null;

	constructor() {
		this.shootingStarState = this.shootingStarSystem.initialState;

		this.webGL2Available = isWebGL2Supported();
	}

	public initialize(dimensions: Dimensions, quality: QualityLevel): void {
		this.quality = quality;

		const { qualitySettings } = getOptimizedConfig(quality);

		this.diamonds = this.diamondSystem.initialize(dimensions, quality);

		this.shootingStarState = this.shootingStarSystem.initialState;

		if (qualitySettings.enableBloom && this.webGL2Available) {
			this.setupEffectsCanvas(dimensions);
		} else {
			this.cleanupEffectsCanvas();
		}
	}

	private setupEffectsCanvas(dimensions: Dimensions): void {
		if (!this.effectsCanvas) {
			this.effectsCanvas = document.createElement('canvas');
			this.effectsContext = this.effectsCanvas.getContext('2d');
		}

		if (this.effectsCanvas && this.effectsContext) {
			this.effectsCanvas.width = dimensions.width;
			this.effectsCanvas.height = dimensions.height;
		}
	}

	private cleanupEffectsCanvas(): void {
		if (this.effectsCanvas) {
			this.effectsCanvas = null;
			this.effectsContext = null;
		}
	}

	private applyBloomEffect(
		sourceCtx: CanvasRenderingContext2D,
		targetCtx: CanvasRenderingContext2D,
		dimensions: Dimensions
	): void {
		if (!this.effectsContext) return;

		const { width, height } = dimensions;

		this.effectsContext.clearRect(0, 0, width, height);
		this.effectsContext.drawImage(sourceCtx.canvas, 0, 0);

		const imageData = this.effectsContext.getImageData(0, 0, width, height);
		const data = imageData.data;

		const thresholdR = 200;
		const thresholdG = 200;
		const thresholdB = 200;

		for (let i = 0; i < data.length; i += 4) {
			if (data[i] < thresholdR && data[i + 1] < thresholdG && data[i + 2] < thresholdB) {
				data[i] = 0;
				data[i + 1] = 0;
				data[i + 2] = 0;
				data[i + 3] = 0;
			}
		}

		this.effectsContext.putImageData(imageData, 0, 0);

		this.effectsContext.filter = 'blur(4px)';
		this.effectsContext.globalCompositeOperation = 'lighter';
		this.effectsContext.drawImage(this.effectsContext.canvas, 0, 0);
		this.effectsContext.filter = 'blur(2px)';
		this.effectsContext.drawImage(this.effectsContext.canvas, 0, 0);

		this.effectsContext.filter = 'none';
		this.effectsContext.globalCompositeOperation = 'source-over';

		targetCtx.globalCompositeOperation = 'lighter';
		targetCtx.drawImage(this.effectsContext.canvas, 0, 0);
		targetCtx.globalCompositeOperation = 'source-over';
	}

	public update(dimensions: Dimensions): void {
		const { qualitySettings } = getOptimizedConfig(this.quality);

		this.diamonds = this.diamondSystem.update(this.diamonds, dimensions);

		if (qualitySettings.enableShootingStars) {
			this.shootingStarState = this.shootingStarSystem.update(this.shootingStarState, dimensions);
		}

		if (
			this.effectsCanvas &&
			(this.effectsCanvas.width !== dimensions.width ||
				this.effectsCanvas.height !== dimensions.height)
		) {
			this.setupEffectsCanvas(dimensions);
		}
	}

	public draw(ctx: CanvasRenderingContext2D, dimensions: Dimensions): void {
		const { baseConfig, qualitySettings } = getOptimizedConfig(this.quality);

		drawBackgroundGradient(ctx, dimensions, baseConfig.background.gradientStops);

		this.diamondSystem.draw(this.diamonds, ctx, dimensions);

		if (qualitySettings.enableShootingStars) {
			this.shootingStarSystem.draw(this.shootingStarState, ctx);
		}

		if (qualitySettings.enableBloom && this.webGL2Available && this.effectsContext) {
			this.applyBloomEffect(ctx, ctx, dimensions);
		}
	}

	public setQuality(quality: QualityLevel): void {
		if (this.quality !== quality) {
			this.quality = quality;
			this.diamondSystem.setQuality(quality);

			const { qualitySettings } = getOptimizedConfig(quality);
			if (qualitySettings.enableBloom && this.webGL2Available) {
				if (this.effectsCanvas) {
					this.setupEffectsCanvas({
						width: this.effectsCanvas.width,
						height: this.effectsCanvas.height
					});
				}
			} else {
				this.cleanupEffectsCanvas();
			}
		}
	}

	public handleResize(oldDimensions: Dimensions, newDimensions: Dimensions): void {
		this.diamonds = this.diamondSystem.adjustToResize(
			this.diamonds,
			oldDimensions,
			newDimensions,
			this.quality
		);

		this.shootingStarState = this.shootingStarSystem.initialState;

		if (this.effectsCanvas) {
			this.setupEffectsCanvas(newDimensions);
		}
	}

	public cleanup(): void {
		this.cleanupEffectsCanvas();
	}
}
