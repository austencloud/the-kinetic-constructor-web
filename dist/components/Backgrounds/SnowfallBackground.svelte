<script lang="ts">
	import { onMount } from 'svelte';
	import SnowflakeManager from './SnowflakeManager';
	import SantaManager from './SantaManager';
	import ShootingStarManager from './ShootingStarManager';

	let canvas: HTMLCanvasElement | null = null;
	let canvasSize = { width: 0, height: 0 };

	// Managers
	let snowflakeManager: SnowflakeManager;
	let santaManager: SantaManager;
	let shootingStarManager: ShootingStarManager;

	const initializeCanvas = () => {
		if (!canvas) return;

		canvas.width = canvasSize.width = window.innerWidth;
		canvas.height = canvasSize.height = window.innerHeight;

		// Initialize managers
		snowflakeManager = new SnowflakeManager();
		snowflakeManager.initialize(canvas.width, canvas.height, 150);

		santaManager = new SantaManager();
		santaManager.initialize(canvas.width, canvas.height);

		shootingStarManager = new ShootingStarManager();
	};

	const resizeCanvas = () => {
		if (!canvas) return;

		canvas.width = canvasSize.width = window.innerWidth;
		canvas.height = canvasSize.height = window.innerHeight;

		// Adjust snowflake positions for new canvas size
		snowflakeManager.adjustPositions(canvas.width, canvas.height);
	};

	const animate = () => {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

		// Draw gradient background
		const gradient = ctx.createLinearGradient(0, 0, 0, canvasSize.height);
		gradient.addColorStop(0, '#142030');
		gradient.addColorStop(1, '#325078');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

		// Draw and animate elements
		snowflakeManager.draw(ctx, canvasSize.width, canvasSize.height);
		santaManager.animateSanta();
		santaManager.draw(ctx, canvasSize.width, canvasSize.height);
		shootingStarManager.manageShootingStar(canvasSize.width, canvasSize.height);
		shootingStarManager.animateShootingStar(canvasSize.width, canvasSize.height);
		shootingStarManager.draw(ctx, canvasSize.width, canvasSize.height);

		requestAnimationFrame(animate);
	};

	onMount(() => {
		if (typeof window === 'undefined') return; // Ensure client-side execution

		initializeCanvas();
		requestAnimationFrame(animate);

		window.addEventListener('resize', resizeCanvas);

		return () => {
			window.removeEventListener('resize', resizeCanvas);
		};
	});
</script>

<canvas bind:this={canvas} style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></canvas>
