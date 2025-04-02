import { AnimationConfig } from '../../AnimationConfig';
import type { Dimensions, SantaState } from '../../types/types';

export const createSantaSystem = () => {
	// Santa image preloading
	let santaImageLeft: HTMLImageElement | null = null;
	let santaImageRight: HTMLImageElement | null = null;
	let imageLoaded = false;

	/**
	 * Preload Santa images for better performance
	 */
	const preloadImages = (): Promise<void> => {
		return new Promise((resolve) => {
			// Only preload in browser environment
			if (typeof window === 'undefined') {
				resolve();
				return;
			}

			santaImageLeft = new Image();
			santaImageRight = new Image();

			let loadedCount = 0;

			const onLoad = () => {
				loadedCount++;
				if (loadedCount === 2) {
					imageLoaded = true;
					resolve();
				}
			};

			santaImageLeft.onload = onLoad;
			santaImageRight.onload = onLoad;

			// Set source paths - these should be added to your public assets
			santaImageLeft.src = '/images/santa-left.png';
			santaImageRight.src = '/images/santa-right.png';
		});
	};

	/**
	 * Get random interval for santa appearance
	 */
	const getRandomInterval = (): number => {
		const config = AnimationConfig.santa;
		return (
			Math.floor(Math.random() * (config.maxInterval - config.minInterval + 1)) + config.minInterval
		);
	};

	/**
	 * Get random speed for santa movement
	 */
	const getRandomSpeed = (): number => {
		const config = AnimationConfig.santa;
		return Math.random() * (config.maxSpeed - config.minSpeed) + config.minSpeed;
	};

	/**
	 * Calculate appropriate size based on screen dimensions
	 */
	const calculateSize = (width: number): number => {
		const config = AnimationConfig.santa;
		const sizeByPercent = width * config.maxSizePercent;
		return Math.min(sizeByPercent, config.maxSizePx);
	};

	/**
	 * Initial santa state
	 */
	const initialState: SantaState = {
		x: -100, // Off-screen
		y: 0,
		speed: 0,
		active: false,
		direction: 1, // 1 for right, -1 for left
		opacity: AnimationConfig.santa.opacity
	};

	/**
	 * Update santa position and state
	 */
	const update = (
		state: SantaState,
		{ width, height }: Dimensions,
		isDecember: boolean
	): SantaState => {
		// Only show Santa during December if seasonal features are enabled
		const isSeasonalEnabled =
			AnimationConfig.seasonal.enabled && (isDecember || AnimationConfig.seasonal.isChristmas());

		if (!state.active && isSeasonalEnabled) {
			// Chance to activate Santa (1% per frame when inactive)
			if (Math.random() < 0.01) {
				const direction = Math.random() > 0.5 ? 1 : -1;
				const startX = direction > 0 ? -calculateSize(width) : width + calculateSize(width);
				const randomY =
					height *
					(Math.random() * (AnimationConfig.santa.maxY - AnimationConfig.santa.minY) +
						AnimationConfig.santa.minY);

				return {
					x: startX,
					y: randomY,
					speed: getRandomSpeed(),
					active: true,
					direction: direction,
					opacity: AnimationConfig.santa.opacity
				};
			}
			return state;
		} else if (state.active) {
			// Update position
			const newX = state.x + state.speed * width * state.direction;

			// Check if gone off-screen
			if (
				(state.direction > 0 && newX > width + calculateSize(width)) ||
				(state.direction < 0 && newX < -calculateSize(width))
			) {
				return {
					...initialState
				};
			}

			return {
				...state,
				x: newX
			};
		}

		return state;
	};

	/**
	 * Draw santa to canvas
	 */
	const draw = (state: SantaState, ctx: CanvasRenderingContext2D, { width }: Dimensions): void => {
		if (!state.active || !ctx || !imageLoaded) return;

		const santaSize = calculateSize(width);
		const santaImage = state.direction > 0 ? santaImageRight : santaImageLeft;

		if (!santaImage) return;

		ctx.save();
		ctx.globalAlpha = state.opacity;

		// Draw the appropriate santa image
		ctx.drawImage(
			santaImage,
			state.x - santaSize / 2,
			state.y - santaSize / 2,
			santaSize,
			santaSize
		);

		ctx.restore();
	};

	return {
		preloadImages,
		initialState,
		update,
		draw
	};
};
