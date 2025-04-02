import { AnimationConfig } from '../core/AnimationConfig';
import type { Diamond, Dimensions, QualityLevel } from '../types/types';

export const createDiamondSystem = () => {
	let currentQuality: QualityLevel = 'medium';

	const createDiamondShape = (
		size: number,
		complexity: 'high' | 'medium' | 'low' | 'minimal'
	): Path2D => {
		const path = new Path2D();

		let points = 8;

		if (complexity === 'high') {
			points = 12;
		} else if (complexity === 'low') {
			points = 6;
		} else if (complexity === 'minimal') {
			points = 4;
		}

		const facetVariation = complexity === 'high' ? 0.2 : complexity === 'medium' ? 0.1 : 0;

		for (let i = 0; i < points; i++) {
			const angle = (i * Math.PI * 2) / points;

			const facetLength = size * (1 + (Math.random() * facetVariation - facetVariation / 2));

			const x = Math.cos(angle) * facetLength;
			const y = Math.sin(angle) * facetLength;

			if (i === 0) {
				path.moveTo(x, y);
			} else {
				path.lineTo(x, y);
			}

			if (complexity === 'high' && i % 2 === 0) {
				const innerAngle = angle + (Math.PI * 2) / points / 2;
				const innerX = Math.cos(innerAngle) * facetLength * 0.4;
				const innerY = Math.sin(innerAngle) * facetLength * 0.4;
				path.lineTo(innerX, innerY);
			}
		}

		path.closePath();
		return path;
	};

	const getRandomDiamondColor = (): string => {
		const colors = AnimationConfig.diamond.colors;
		const baseColor = colors[Math.floor(Math.random() * colors.length)];

		if (currentQuality === 'high' || currentQuality === 'medium') {
			const r = parseInt(baseColor.slice(1, 3), 16);
			const g = parseInt(baseColor.slice(3, 5), 16);
			const b = parseInt(baseColor.slice(5, 7), 16);

			const variation = 13;
			const newR = Math.min(
				255,
				Math.max(0, r + Math.floor(Math.random() * variation - variation / 2))
			);
			const newG = Math.min(
				255,
				Math.max(0, g + Math.floor(Math.random() * variation - variation / 2))
			);
			const newB = Math.min(
				255,
				Math.max(0, b + Math.floor(Math.random() * variation - variation / 2))
			);

			return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
		}

		return baseColor;
	};

	const createDiamond = (width: number, height: number): Diamond => {
		const config = AnimationConfig.diamond;
		const size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
		const speed = Math.random() * (config.maxSpeed - config.minSpeed) + config.minSpeed;
		const rotationSpeed =
			Math.random() * (config.rotation.maxSpeed - config.rotation.minSpeed) +
			config.rotation.minSpeed;

		let complexity: 'high' | 'medium' | 'low' | 'minimal';
		if (currentQuality === 'high') complexity = 'high';
		else if (currentQuality === 'medium') complexity = 'medium';
		else if (currentQuality === 'low') complexity = 'low';
		else complexity = 'minimal';

		return {
			x: Math.random() * width,
			y: Math.random() * height,
			size,
			speed,
			horizontalSpeed: (Math.random() - 0.5) * speed * 0.7,
			rotationAngle: Math.random() * Math.PI * 2,
			rotationSpeed: (Math.random() > 0.5 ? 1 : -1) * rotationSpeed,
			shape: createDiamondShape(size, complexity),
			color: getRandomDiamondColor(),
			opacity: Math.random() * 0.3 + 0.7,
			shimmerFactor: 0,
			shimmerDirection: 1,
			shimmerActive: false,
			shimmerDuration: 0
		};
	};

	const initialize = (dimensions: Dimensions, quality: QualityLevel): Diamond[] => {
		currentQuality = quality;
		const { width, height } = dimensions;

		let densityFactor = 1;
		if (quality === 'medium') densityFactor = 0.7;
		else if (quality === 'low') densityFactor = 0.4;
		else if (quality === 'minimal') densityFactor = 0.2;

		const screenSizeFactor = Math.min(1, (width * height) / (1920 * 1080));
		const count = Math.floor(
			width * height * AnimationConfig.diamond.density * densityFactor * screenSizeFactor
		);

		return Array.from({ length: count }, () => createDiamond(width, height));
	};

	const update = (diamonds: Diamond[], dimensions: Dimensions): Diamond[] => {
		const { width, height } = dimensions;
		const config = AnimationConfig.diamond;

		return diamonds.map((diamond) => {
			let newY = diamond.y + diamond.speed;
			let newX = diamond.x + diamond.horizontalSpeed;

			if (newY > height + diamond.size) {
				newY = -diamond.size;
				newX = Math.random() * width;
			}

			if (newX > width + diamond.size) {
				newX = -diamond.size;
			} else if (newX < -diamond.size) {
				newX = width + diamond.size;
			}

			const newRotationAngle = (diamond.rotationAngle + diamond.rotationSpeed) % (Math.PI * 2);

			let shimmerFactor = diamond.shimmerFactor;
			let shimmerDirection = diamond.shimmerDirection;
			let shimmerActive = diamond.shimmerActive;
			let shimmerDuration = diamond.shimmerDuration;

			if (!shimmerActive && Math.random() < config.shimmer.frequency) {
				shimmerActive = true;
				shimmerDuration = config.shimmer.duration;
			}

			if (shimmerActive) {
				shimmerFactor += 0.05 * shimmerDirection;

				if (shimmerFactor >= config.shimmer.intensity) {
					shimmerFactor = config.shimmer.intensity;
					shimmerDirection = -1;
				} else if (shimmerFactor <= 0) {
					shimmerFactor = 0;
					shimmerDirection = 1;
				}

				shimmerDuration--;
				if (shimmerDuration <= 0) {
					shimmerActive = false;
					shimmerFactor = 0;
				}
			}

			return {
				...diamond,
				x: newX,
				y: newY,
				rotationAngle: newRotationAngle,
				shimmerFactor,
				shimmerDirection,
				shimmerActive,
				shimmerDuration
			};
		});
	};

	const draw = (
		diamonds: Diamond[],
		ctx: CanvasRenderingContext2D,
		dimensions: Dimensions
	): void => {
		if (!ctx) return;

		const colorGroups = new Map<string, Diamond[]>();

		diamonds.forEach((diamond) => {
			if (!colorGroups.has(diamond.color)) {
				colorGroups.set(diamond.color, []);
			}
			colorGroups.get(diamond.color)!.push(diamond);
		});

		colorGroups.forEach((groupDiamonds, color) => {
			groupDiamonds.forEach((diamond) => {
				ctx.save();

				ctx.translate(diamond.x, diamond.y);

				ctx.rotate(diamond.rotationAngle);

				const shimmerOpacity = diamond.opacity + diamond.shimmerFactor;
				ctx.globalAlpha = shimmerOpacity;

				if (currentQuality === 'high') {
					ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
					ctx.shadowBlur = diamond.size / 2;
				}

				ctx.fillStyle = diamond.color;

				if (currentQuality === 'high' && diamond.shimmerActive) {
					const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, diamond.size);
					gradient.addColorStop(0, 'white');
					gradient.addColorStop(0.5, diamond.color);
					gradient.addColorStop(1, diamond.color);
					ctx.fillStyle = gradient;
				}

				ctx.fill(diamond.shape);

				if ((currentQuality === 'high' || currentQuality === 'medium') && diamond.shimmerActive) {
					ctx.beginPath();
					ctx.arc(0, 0, diamond.size * 0.3, 0, Math.PI * 2);
					ctx.fillStyle = `rgba(255, 255, 255, ${diamond.shimmerFactor * 0.7})`;
					ctx.fill();
				}

				ctx.restore();
			});
		});
	};

	const adjustToResize = (
		diamonds: Diamond[],
		oldDimensions: Dimensions,
		newDimensions: Dimensions,
		quality: QualityLevel
	): Diamond[] => {
		currentQuality = quality;

		const targetCount = Math.floor(
			newDimensions.width *
				newDimensions.height *
				AnimationConfig.diamond.density *
				(quality === 'high' ? 1 : quality === 'medium' ? 0.7 : quality === 'low' ? 0.4 : 0.2)
		);

		const currentCount = diamonds.length;

		if (targetCount > currentCount) {
			return [
				...diamonds,
				...Array.from({ length: targetCount - currentCount }, () =>
					createDiamond(newDimensions.width, newDimensions.height)
				)
			];
		} else if (targetCount < currentCount) {
			return diamonds.slice(0, targetCount);
		}

		return diamonds;
	};

	const setQuality = (quality: QualityLevel): void => {
		currentQuality = quality;
	};

	return {
		initialize,
		update,
		draw,
		adjustToResize,
		setQuality
	};
};
