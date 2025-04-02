import type { Dimensions, Snowflake } from '../../types/types';

export const createSnowflakeSystem = () => {
	const density = 0.0001; // Base density - still looks good but performant
	let windStrength = 0;
	let windChangeTimer = 0;
	const windChangeInterval = 200;

	// Pure functions for snowflake operations
	const generateSnowflakeShape = (size: number): Path2D => {
		const path = new Path2D();
		const spikes = 6 + Math.floor(Math.random() * 4);

		for (let i = 0; i < spikes; i++) {
			const angle = (i * Math.PI * 2) / spikes;
			const outerX = Math.cos(angle) * size;
			const outerY = Math.sin(angle) * size;
			path.lineTo(outerX, outerY);

			const innerX = Math.cos(angle + Math.PI / spikes) * size * 0.2;
			const innerY = Math.sin(angle + Math.PI / spikes) * size * 0.2;
			path.lineTo(innerX, innerY);
		}
		path.closePath();
		return path;
	};

	const randomSnowflakeColor = (): string => {
		const colors = ['#FFFFFF', '#E3F2FD', '#BBDEFB', '#90CAF9'];
		return colors[Math.floor(Math.random() * colors.length)];
	};

	const createSnowflake = (width: number, height: number): Snowflake => {
		const size = Math.random() * 5 + 2;
		return {
			x: Math.random() * width,
			y: Math.random() * height,
			speed: Math.random() * 2 + 1,
			size,
			sway: Math.random() * 1 - 0.5,
			opacity: Math.random() * 0.8 + 0.2,
			shape: generateSnowflakeShape(size),
			color: randomSnowflakeColor()
		};
	};

	// Initialization function
	const initialize = ({ width, height }: Dimensions, quality: string): Snowflake[] => {
		// Adjust density based on quality and screen size
		let adjustedDensity = density;

		// Scale density based on screen size for better performance on smaller devices
		const screenSizeFactor = Math.min(1, (width * height) / (1920 * 1080));
		adjustedDensity *= screenSizeFactor;

		// Adjust for quality setting
		if (quality === 'low') {
			adjustedDensity *= 0.5;
		} else if (quality === 'medium') {
			adjustedDensity *= 0.75;
		}

		const count = Math.floor(width * height * adjustedDensity);
		return Array.from({ length: count }, () => createSnowflake(width, height));
	};

	// Update function
	const update = (flakes: Snowflake[], { width, height }: Dimensions): Snowflake[] => {
		// Update wind
		windChangeTimer++;
		if (windChangeTimer >= windChangeInterval) {
			windChangeTimer = 0;
			windStrength = (Math.random() * 0.5 - 0.25) * width * 0.00005;
		}

		// Update snowflakes
		return flakes.map((flake) => {
			const newX = flake.x + flake.sway + windStrength;
			const newY = flake.y + flake.speed;

			// Reset if out of bounds
			if (newY > height) {
				return {
					...flake,
					y: Math.random() * -20, // Slightly above viewport
					x: Math.random() * width
				};
			}

			if (newX > width || newX < 0) {
				return {
					...flake,
					x: Math.random() * width
				};
			}

			return { ...flake, x: newX, y: newY };
		});
	};

	// Drawing function
	const draw = (
		flakes: Snowflake[],
		ctx: CanvasRenderingContext2D,
		{ width, height }: Dimensions
	): void => {
		if (!ctx) return;
		ctx.globalAlpha = 1.0;

		// Batch rendering by color for better performance
		const colorGroups = new Map<string, Snowflake[]>();

		flakes.forEach((flake) => {
			if (!colorGroups.has(flake.color)) {
				colorGroups.set(flake.color, []);
			}
			colorGroups.get(flake.color)!.push(flake);
		});

		// Draw each color group together
		colorGroups.forEach((groupFlakes, color) => {
			ctx.fillStyle = color;

			groupFlakes.forEach((flake) => {
				ctx.save();
				ctx.translate(flake.x, flake.y);
				ctx.globalAlpha = flake.opacity;
				ctx.fill(flake.shape);
				ctx.restore();
			});
		});
	};

	// Resize handler
	const adjustToResize = (
		flakes: Snowflake[],
		oldDimensions: Dimensions,
		newDimensions: Dimensions,
		quality: string
	): Snowflake[] => {
		const targetCount = Math.floor(
			newDimensions.width *
				newDimensions.height *
				density *
				(quality === 'low' ? 0.5 : quality === 'medium' ? 0.75 : 1)
		);

		const currentCount = flakes.length;

		if (targetCount > currentCount) {
			// Add more snowflakes
			return [
				...flakes,
				...Array.from({ length: targetCount - currentCount }, () =>
					createSnowflake(newDimensions.width, newDimensions.height)
				)
			];
		} else if (targetCount < currentCount) {
			// Remove excess snowflakes
			return flakes.slice(0, targetCount);
		}

		return flakes;
	};

	return {
		initialize,
		update,
		draw,
		adjustToResize
	};
};
