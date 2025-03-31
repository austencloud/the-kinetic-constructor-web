<script lang="ts">
	import { onMount } from 'svelte';
	import SnowflakeManager from './SnowflakeManager';
	import SantaManager from './SantaManager';
	import ShootingStarManager from './ShootingStarManager';

	let canvas: HTMLCanvasElement | null = null;
	let ctx: CanvasRenderingContext2D | null = null;

	// Managers
	let snowflakeManager: SnowflakeManager;
	let santaManager: SantaManager;
	let shootingStarManager: ShootingStarManager;

	const initializeCanvas = () => {
		if (!canvas) return;

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		ctx = canvas.getContext('2d');

		// Initialize managers
		snowflakeManager = new SnowflakeManager();
		snowflakeManager.initialize(canvas.width, canvas.height);

		santaManager = new SantaManager();
		santaManager.initialize(canvas.width, canvas.height);

		shootingStarManager = new ShootingStarManager();
	};

	const resizeCanvas = () => {
		if (!canvas) return;

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		// Adjust snowflake positions for new canvas size
		snowflakeManager.adjustPositions(canvas.width, canvas.height);
	};

	const animate = () => {
		if (!ctx || !canvas) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Gradient background
		const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
		gradient.addColorStop(0, '#0b1d2a');
		gradient.addColorStop(0.3, '#142030');
		gradient.addColorStop(0.7, '#325078');
		gradient.addColorStop(1, '#49708a');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw snowflakes
		snowflakeManager.draw(ctx, canvas.width, canvas.height);

		// Manage and draw shooting stars
		shootingStarManager.manageShootingStar(canvas.width, canvas.height);
		shootingStarManager.animateShootingStar(canvas.width, canvas.height);
		shootingStarManager.draw(ctx, canvas.width, canvas.height);

		// Animate and draw Santa
		santaManager.animateSanta();
		santaManager.draw(ctx, canvas.width, canvas.height);

		requestAnimationFrame(animate);
	};

	onMount(() => {
		initializeCanvas();
		requestAnimationFrame(animate);

		window.addEventListener('resize', resizeCanvas);

		return () => {
			window.removeEventListener('resize', resizeCanvas);
		};
	});
</script>

<canvas 
  bind:this={canvas} 
  style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; object-fit: contain;"
></canvas>