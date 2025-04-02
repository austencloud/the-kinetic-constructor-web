<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable, derived } from 'svelte/store';
	
	// Types
	type Dimensions = { width: number; height: number };
	type PerformanceMetrics = { fps: number; warnings: string[] };
	
	interface Snowflake {
		x: number;
		y: number;
		speed: number;
		size: number;
		sway: number;
		opacity: number;
		shape: Path2D;
		color: string;
	}
	
	interface ShootingStar {
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
	
	interface SantaState {
		x: number;
		y: number;
		speed: number;
		active: boolean;
		direction: number;
		opacity: number;
	}
	
	interface ShootingStarState {
		star: ShootingStar | null;
		timer: number;
		interval: number;
	}
	
	// Stores for reactive state management
	const dimensions = writable<Dimensions>({ width: 0, height: 0 });
	const performanceMetrics = writable<PerformanceMetrics>({ fps: 60, warnings: [] });
	const isActive = writable<boolean>(true);
	const isDecember = writable<boolean>(new Date().getMonth() === 11);
	
	// Derived store to determine if rendering should occur
	const shouldRender = derived(
		[performanceMetrics, isActive],
		([$metrics, $isActive]) => $isActive && $metrics.fps > 40
	);
	
	// Canvas references
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let animationFrameId: number;
	
	// Performance tracking variables
	let lastTime = 0;
	let frameCount = 0;
	let fps = 60;
	let warnings: string[] = [];
	
	// Background gradient config
	const backgroundGradient = [
		{ stop: 0, color: '#0b1d2a' },
		{ stop: 0.3, color: '#142030' },
		{ stop: 0.7, color: '#325078' },
		{ stop: 1, color: '#49708a' }
	];
	
	// Managers configuration using a more functional approach
	const createSnowflakeSystem = () => {
		const density = 0.0001;
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
		const initialize = ({ width, height }: Dimensions): Snowflake[] => {
			const count = Math.floor(width * height * density);
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
			return flakes.map(flake => {
				const newX = flake.x + flake.sway + windStrength;
				const newY = flake.y + flake.speed;
				
				// Reset if out of bounds
				if (newY > height) {
					return {
						...flake,
						y: Math.random() * -height,
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
		const draw = (flakes: Snowflake[], ctx: CanvasRenderingContext2D, { width, height }: Dimensions): void => {
			if (!ctx) return;
			ctx.globalAlpha = 1.0;
			
			flakes.forEach(flake => {
				ctx.save();
				ctx.translate(flake.x, flake.y);
				ctx.fillStyle = flake.color;
				ctx.globalAlpha = flake.opacity;
				ctx.fill(flake.shape);
				ctx.restore();
			});
		};
		
		// Resize handler
		const adjustToResize = (
			flakes: Snowflake[], 
			oldDimensions: Dimensions, 
			newDimensions: Dimensions
		): Snowflake[] => {
			const targetCount = Math.floor(newDimensions.width * newDimensions.height * density);
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
	
	const createShootingStarSystem = () => {
		// Helper functions
		function getRandomInterval(): number {
			return Math.floor(Math.random() * (1500 - 1000 + 1)) + 1000;
		}
		
		function randomFloat(min: number, max: number): number {
			return Math.random() * (max - min) + min;
		}
		
		function getRandomColor(): string {
			const colors = ['#FFD700', '#FFFFFF', '#FFA500', '#00FFFF'];
			return colors[Math.floor(Math.random() * colors.length)];
		}
		
		// Create a new shooting star
		const spawnShootingStar = ({ width, height }: Dimensions): ShootingStar => {
			const middleY = height / 2;
			
			// Initial position (from left or right)
			const startOptions = [
				{ x: -0.1 * width, y: randomFloat(0.2, 0.8) * height }, // Left
				{ x: 1.1 * width, y: randomFloat(0.2, 0.8) * height } // Right
			];
			const startPos = startOptions[Math.floor(Math.random() * startOptions.length)];
			
			// Direction and speed
			let dx = randomFloat(0.3, 0.5) * (startPos.x > 0 ? -1 : 1); // Left or right
			let dy = Math.random() < 0.5 ? -randomFloat(0.05, 0.2) : randomFloat(0.05, 0.2);
			
			// Adjust to gravitate towards the middle
			if (startPos.y > middleY) dy -= randomFloat(0.02, 0.05);
			else dy += randomFloat(0.02, 0.05);
			
			// Normalize the direction vector
			const norm = Math.sqrt(dx * dx + dy * dy);
			dx /= norm;
			dy /= norm;
			
			return {
				x: startPos.x,
				y: startPos.y,
				dx,
				dy,
				size: randomFloat(3, 5),
				speed: randomFloat(0.02, 0.05),
				tail: [],
				prevX: startPos.x,
				prevY: startPos.y,
				tailLength: Math.floor(Math.random() * (20 - 10 + 1)) + 10,
				opacity: 1.0,
				offScreen: false,
				color: getRandomColor(),
				twinkle: Math.random() < 0.5
			};
		};
		
		// Update existing shooting star
		const updateShootingStar = (star: ShootingStar | null, { width, height }: Dimensions): ShootingStar | null => {
			if (!star) return null;
			
			const newX = star.x + star.dx * star.speed * width;
			const newY = star.y + star.dy * star.speed * height;
			
			// Add interpolated positions to make the tail denser
			const steps = 5; // Reduced for better performance
			const newTail = [...star.tail];
			
			for (let i = 0; i < steps; i++) {
				const interpX = star.prevX + (newX - star.prevX) * (i / steps);
				const interpY = star.prevY + (newY - star.prevY) * (i / steps);
				newTail.push({
					x: interpX,
					y: interpY,
					size: star.size * 0.8,
					color: star.color
				});
			}
			
			// Trim tail length
			if (newTail.length > star.tailLength * steps) {
				newTail.splice(0, steps);
			}
			
			// Check if star is off-screen
			const offScreen = 
				newX < -width * 0.1 ||
				newX > width * 1.1 ||
				newY < -height * 0.1 ||
				newY > height * 1.1;
			
			// If already off-screen, reduce opacity
			let opacity = star.opacity;
			if (offScreen) {
				opacity -= 0.02;
				if (opacity <= 0) return null;
			}
			
			return {
				...star,
				x: newX,
				y: newY,
				prevX: star.x,
				prevY: star.y,
				tail: newTail,
				offScreen,
				opacity
			};
		};
		
		// Draw shooting star
		const drawShootingStar = (star: ShootingStar | null, ctx: CanvasRenderingContext2D): void => {
			if (!star || !ctx) return;
			
			// Draw tail
			ctx.save();
			const tailLength = star.tail.length;
			
			star.tail.forEach((segment, index) => {
				const fadeFactor = 5;
				const opacity = Math.max(0, ((index + 1) / tailLength) ** fadeFactor * star.opacity);
				
				ctx.globalAlpha = opacity;
				ctx.beginPath();
				ctx.arc(segment.x, segment.y, segment.size, 0, Math.PI * 2);
				ctx.fillStyle = segment.color;
				ctx.fill();
			});
			
			// Draw head
			ctx.globalAlpha = star.opacity;
			ctx.beginPath();
			ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
			ctx.fillStyle = star.color;
			
			// Twinkling effect
			if (star.twinkle && Math.random() > 0.5) {
				ctx.shadowColor = star.color;
				ctx.shadowBlur = star.size / 2;
			}
			
			ctx.fill();
			ctx.restore();
		};
		
		// Manage shooting star state
		const update = (state: ShootingStarState, dimensions: Dimensions): ShootingStarState => {
			const timer = state.timer + 1;
			
			// Check if we need to spawn a new star
			if (!state.star && timer >= state.interval) {
				return {
					star: spawnShootingStar(dimensions),
					timer: 0,
					interval: getRandomInterval()
				};
			}
			
			// Update existing star
			return {
				star: updateShootingStar(state.star, dimensions),
				timer: state.star ? timer : 0,
				interval: state.interval
			};
		};
		
		return {
			initialState: { star: null, timer: 0, interval: getRandomInterval() },
			update,
			draw: (state: ShootingStarState, ctx: CanvasRenderingContext2D): void => {
				if (state.star && ctx) drawShootingStar(state.star, ctx);
			}
		};
	};
	
	const createSantaSystem = () => {
		let santaImage: HTMLImageElement | null = null;
		let imageLoaded = false;
		
		// Helper function
		function randomInt(min: number, max: number): number {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		}
		
		// Load santa image
		const loadImage = (): void => {
			if (typeof window === 'undefined') return;
			
			// Only load in December
			if (!$isDecember) return;
			
			santaImage = new Image();
			santaImage.src = 'santa.png';
			
			santaImage.onload = () => {
				imageLoaded = true;
			};
			
			santaImage.onerror = () => {
				console.error('Failed to load Santa image');
			};
		};
		
		// Initialize
		const initialize = (): SantaState => {
			loadImage();
			return { 
				x: -0.2, 
				y: 0.2, 
				speed: 0.001, 
				active: false, 
				direction: 1, 
				opacity: 0.8 
			};
		};
		
		// Update function
		const update = (
			santa: SantaState,
			santaTimer: number,
			santaInterval: number,
			shouldRender: boolean, 
			isDecember: boolean
		): { santa: SantaState; timer: number; interval: number } => {
			// Skip if performance is poor or not December
			if (!shouldRender || !isDecember) {
				return { santa, timer: santaTimer, interval: santaInterval };
			}
			
			// Handle active santa
			if (santa.active) {
				const newX = santa.x + santa.speed * santa.direction;
				
				// Check if santa should be deactivated
				if (
					(santa.direction === 1 && newX > 1.2) ||
					(santa.direction === -1 && newX < -0.2)
				) {
					return { 
						santa: { ...santa, active: false, x: newX },
						timer: 0,
						interval: santaInterval 
					};
				}
				
				return { 
					santa: { ...santa, x: newX },
					timer: santaTimer,
					interval: santaInterval
				};
			} else {
				// Increment timer
				const newTimer = santaTimer + 1;
				
				// Activate santa if timer reached
				if (newTimer >= santaInterval) {
					const direction = Math.random() < 0.5 ? -1 : 1;
					return {
						santa: {
							...santa,
							active: true,
							direction,
							x: direction === 1 ? -0.2 : 1.2,
							y: Math.random() * 0.2 + 0.1,
							speed: Math.random() * 0.001 + 0.001
						},
						timer: 0,
						interval: randomInt(1200, 1500)
					};
				}
				
				return {
					santa,
					timer: newTimer,
					interval: santaInterval
				};
			}
		};
		
		// Drawing function
		const draw = (
			santa: SantaState,
			shouldRender: boolean, 
			isDecember: boolean, 
			ctx: CanvasRenderingContext2D | null, 
			{ width, height }: Dimensions
		): void => {
			// Skip if performance is poor or not December
			if (!shouldRender || !isDecember || !ctx) return;
			
			// Skip if santa is not active or image not loaded
			if (!santa.active || !imageLoaded || !santaImage) return;
			
			const santaWidth = Math.max(50, Math.min(width * 0.05, 100));
			const scalingFactor = santaWidth / santaImage.width;
			const santaHeight = santaImage.height * scalingFactor;
			
			const x = santa.x * width;
			const y = santa.y * height;
			
			ctx.save();
			ctx.globalAlpha = santa.opacity;
			
			if (santa.direction === 1) {
				ctx.drawImage(santaImage, x, y, santaWidth, santaHeight);
			} else {
				ctx.translate(x + santaWidth, y);
				ctx.scale(-1, 1);
				ctx.drawImage(santaImage, 0, 0, santaWidth, santaHeight);
			}
			
			ctx.restore();
		};
		
		return {
			initialize,
			update,
			draw
		};
	};
	
	// Create our systems
	const snowflakeSystem = createSnowflakeSystem();
	const shootingStarSystem = createShootingStarSystem();
	const santaSystem = createSantaSystem();
	
	// State management
	let snowflakes: Snowflake[] = [];
	let shootingStarState: ShootingStarState = shootingStarSystem.initialState;
	let santa: SantaState;
	let santaTimer = 0;
	let santaInterval = 200;
	
	// Initialize systems
	const initializeSystems = (width: number, height: number): void => {
		snowflakes = snowflakeSystem.initialize({ width, height });
		santa = santaSystem.initialize();
	};
	
	// Resize handler with debounce
	const handleResize = (): void => {
		if (!canvas) return;
		
		// Check for browser environment
		if (typeof window === 'undefined') return;
		
		const newWidth = window.innerWidth;
		const newHeight = window.innerHeight;
		
		const oldDimensions = $dimensions;
		const newDimensions = { width: newWidth, height: newHeight };
		
		// Update canvas dimensions
		canvas.width = newWidth;
		canvas.height = newHeight;
		
		// Update store
		dimensions.set(newDimensions);
		
		// Adjust snowflakes
		snowflakes = snowflakeSystem.adjustToResize(
			snowflakes, 
			oldDimensions, 
			newDimensions
		);
	};
	
	// Performance monitoring
	const updatePerformanceMetrics = (): void => {
		// Simple FPS counter
		const now = performance.now();
		
		frameCount++;
		
		if (now >= lastTime + 1000) {
			fps = frameCount;
			frameCount = 0;
			lastTime = now;
			
			if (fps < 50) {
				warnings.push(`Low FPS detected: ${fps}`);
				// Limit warnings array size
				if (warnings.length > 5) warnings.shift();
			}
			
			performanceMetrics.set({ fps, warnings });
		}
	};
	
	// Animation loop
	const animate = (): void => {
		if (!ctx || !canvas) return;
		
		// Update performance tracking
		updatePerformanceMetrics();
		
		// Get current values from stores
		const dims = $dimensions;
		const shouldRenderValue = $shouldRender;
		const isDecemberValue = $isDecember;
		
		// Clear canvas
		ctx.clearRect(0, 0, dims.width, dims.height);
		
		// Draw gradient background
		const gradient = ctx.createLinearGradient(0, 0, 0, dims.height);
		backgroundGradient.forEach(stop => {
			gradient.addColorStop(stop.stop, stop.color);
		});
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, dims.width, dims.height);
		
		// Update and draw systems
		if (shouldRenderValue) {
			// Update systems
			snowflakes = snowflakeSystem.update(snowflakes, dims);
			shootingStarState = shootingStarSystem.update(shootingStarState, dims);
			
			const santaUpdate = santaSystem.update(
				santa, 
				santaTimer, 
				santaInterval, 
				shouldRenderValue, 
				isDecemberValue
			);
			
			santa = santaUpdate.santa;
			santaTimer = santaUpdate.timer;
			santaInterval = santaUpdate.interval;
			
			// Draw systems
			snowflakeSystem.draw(snowflakes, ctx, dims);
			shootingStarSystem.draw(shootingStarState, ctx);
			santaSystem.draw(santa, shouldRenderValue, isDecemberValue, ctx, dims);
		}
		
		// Request next frame
		animationFrameId = requestAnimationFrame(animate);
	};
	
	// Debounced resize handler
	const debouncedResize = (() => {
		// Only create this function if we're in browser context
		if (typeof window === 'undefined') {
			return () => {}; // No-op function for server-side rendering
		}
		
		let timeout: number | null = null;
		return () => {
			if (timeout) cancelAnimationFrame(timeout);
			timeout = requestAnimationFrame(handleResize);
		};
	})();
	
	onMount(() => {
		if (!canvas) return;
		
		// Initialize context
		ctx = canvas.getContext('2d');
		if (!ctx) return;
		
		// Check for browser environment
		const isBrowser = typeof window !== 'undefined';
		
		// Set initial dimensions (safely)
		const initialWidth = isBrowser ? window.innerWidth : 1280;
		const initialHeight = isBrowser ? window.innerHeight : 720;
		
		dimensions.set({ 
			width: initialWidth, 
			height: initialHeight 
		});
		
		canvas.width = initialWidth;
		canvas.height = initialHeight;
		
		// Initialize systems
		initializeSystems(canvas.width, canvas.height);
		
		// Only run animation and add listeners in browser environment
		if (isBrowser) {
			// Start animation
			animationFrameId = requestAnimationFrame(animate);
			
			// Add resize listener
			window.addEventListener('resize', debouncedResize);
		}
		
		// Check if December
		isDecember.set(new Date().getMonth() === 11);
	});
	
	onDestroy(() => {
		// Only run browser-specific cleanup in browser environment
		if (typeof window !== 'undefined') {
			if (animationFrameId) cancelAnimationFrame(animationFrameId);
			window.removeEventListener('resize', debouncedResize);
		}
	});
</script>

<canvas 
	bind:this={canvas} 
	style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; object-fit: contain;"
></canvas>