<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { PerformanceTracker } from './PerformanceTracker';
	import SnowflakeManager from './SnowflakeManager';
	import SantaManager from './SantaManager';
	import ShootingStarManager from './ShootingStarManager';
	let canvas: HTMLCanvasElement | null = null;
	let ctx: CanvasRenderingContext2D | null = null;
	let animationFrameId: number | null = null;
	// Create managers
	const performanceTracker = PerformanceTracker.getInstance();
	const snowflakeManager = new SnowflakeManager();
	const santaManager = SantaManager.getInstance();
	const shootingStarManager = new ShootingStarManager();
	const initializeCanvas = () => {
		if (!canvas) return;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		ctx = canvas.getContext('2d');
		// Null checks to prevent runtime errors
		if (ctx) {
			// Initialize managers
			snowflakeManager.initialize(canvas.width, canvas.height);
			santaManager.initialize(canvas.width, canvas.height);
			shootingStarManager.initialize(canvas.width, canvas.height);
		}
	};
	const resizeCanvas = () => {
		if (!canvas) return;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		// Adjust snowflake positions for new canvas size
		snowflakeManager.adjustPositions(canvas.width, canvas.height);
	};
	const throttledResize = (() => {
		let timeout: number | null = null;
		return () => {
			if (timeout) cancelAnimationFrame(timeout);
			timeout = requestAnimationFrame(resizeCanvas);
		};
	})();
	const animate = () => {
		if (!ctx || !canvas) return;
		// Update performance tracking
		performanceTracker.update();
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		// Gradient background
		const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
		gradient.addColorStop(0, '#0b1d2a');
		gradient.addColorStop(0.3, '#142030');
		gradient.addColorStop(0.7, '#325078');
		gradient.addColorStop(1, '#49708a');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		// Animate components
		shootingStarManager.animate(canvas.width, canvas.height);
		santaManager.animate(canvas.width, canvas.height);
		snowflakeManager.animate(canvas.width, canvas.height); // Added this line to animate snowflakes

		// Draw elements
		shootingStarManager.draw(ctx, canvas.width, canvas.height);
		santaManager.draw(ctx, canvas.width, canvas.height);
		snowflakeManager.draw(ctx, canvas.width, canvas.height);
		animationFrameId = requestAnimationFrame(animate);
	};
	onMount(() => {
		initializeCanvas();
		animationFrameId = requestAnimationFrame(animate);
		window.addEventListener('resize', throttledResize);
		return () => {
			if (animationFrameId) cancelAnimationFrame(animationFrameId);
			window.removeEventListener('resize', throttledResize);
		};
	});
	onDestroy(() => {
		if (animationFrameId) cancelAnimationFrame(animationFrameId);
	});
</script>

<canvas
	bind:this={canvas}
	style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; object-fit: contain;"
></canvas>
