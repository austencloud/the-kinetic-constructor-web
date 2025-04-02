import { writable, derived, get } from 'svelte/store';
import type { Dimensions, PerformanceMetrics, QualityLevel } from '../types';
import { PerformanceTracker } from './PerformanceTracker';

/**
 * Core background manager that handles common functionality across all background types
 */
export class BackgroundManager {
	// Stores for reactive state management
	public dimensions = writable<Dimensions>({ width: 0, height: 0 });
	public performanceMetrics = writable<PerformanceMetrics>({ fps: 60, warnings: [] });
	public isActive = writable<boolean>(true);
	public qualityMode = writable<QualityLevel>('high');
	public isLoading = writable<boolean>(false);

	// Performance tracker instance
	private performanceTracker: PerformanceTracker;

	// Canvas references
	private canvas: HTMLCanvasElement | null = null;
	private ctx: CanvasRenderingContext2D | null = null;

	// Animation frame reference
	private animationFrameId: number | null = null;

	// Callback for performance reporting
	private reportCallback: ((metrics: PerformanceMetrics) => void) | null = null;

	// Derived store to determine if rendering should occur
	public shouldRender = derived(
		[this.performanceMetrics, this.isActive],
		([$metrics, $isActive]) => $isActive && $metrics.fps > 30
	);

	constructor() {
		this.performanceTracker = PerformanceTracker.getInstance();
	}

	/**
	 * Initialize the canvas
	 * @param canvas The canvas element
	 * @param onReady Callback when canvas is ready
	 */
	public initializeCanvas(canvas: HTMLCanvasElement, onReady?: () => void): void {
		this.canvas = canvas;

		// Initialize context
		this.ctx = canvas.getContext('2d');
		if (!this.ctx) {
			console.error('Failed to get canvas context');
			return;
		}

		// Check for browser environment
		const isBrowser = typeof window !== 'undefined';

		// Set initial dimensions (safely)
		const initialWidth = isBrowser ? window.innerWidth : 1280;
		const initialHeight = isBrowser ? window.innerHeight : 720;

		this.dimensions.set({
			width: initialWidth,
			height: initialHeight
		});

		canvas.width = initialWidth;
		canvas.height = initialHeight;

		// Only add events in browser environment
		if (isBrowser) {
			// Add resize listener
			window.addEventListener('resize', this.handleResize.bind(this));

			// Listen for visibility changes
			document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
		}

		// Call ready callback
		if (onReady) {
			onReady();
		}
	}

	/**
	 * Start the animation loop
	 * @param renderFn Function to call on each animation frame
	 * @param reportFn Optional callback for performance reporting
	 */
	public startAnimation(
		renderFn: (ctx: CanvasRenderingContext2D, dimensions: Dimensions) => void,
		reportFn?: (metrics: PerformanceMetrics) => void
	): void {
		if (!this.ctx || !this.canvas) {
			console.error('Canvas not initialized');
			return;
		}

		if (reportFn) {
			this.reportCallback = reportFn;
		}

		this.performanceTracker.reset();

		// Animation loop
		const animate = () => {
			if (!this.ctx || !this.canvas) return;

			// Update performance tracking
			this.performanceTracker.update();

			// Get performance metrics
			const perfStatus = this.performanceTracker.getPerformanceStatus();
			this.performanceMetrics.set({
				fps: perfStatus.fps,
				warnings: perfStatus.warnings
			});

			// Report performance
			if (this.reportCallback) {
				this.reportCallback(get(this.performanceMetrics));
			}

			// Get current dimensions
			const dimensions = get(this.dimensions);

			// Only render if we should
			if (get(this.shouldRender)) {
				// Clear canvas
				this.ctx.clearRect(0, 0, dimensions.width, dimensions.height);

				// Call render function
				renderFn(this.ctx, dimensions);
			}

			// Request next frame
			this.animationFrameId = requestAnimationFrame(animate);
		};

		// Start animation if in browser environment
		if (typeof window !== 'undefined') {
			this.animationFrameId = requestAnimationFrame(animate);
		}
	}

	/**
	 * Stop the animation loop
	 */
	public stopAnimation(): void {
		if (this.animationFrameId && typeof window !== 'undefined') {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
	}

	/**
	 * Clean up resources
	 */
	public cleanup(): void {
		this.stopAnimation();

		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', this.handleResize.bind(this));
			document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
		}

		this.canvas = null;
		this.ctx = null;
	}

	/**
	 * Set quality level
	 * @param quality Quality level
	 */
	public setQuality(quality: QualityLevel): void {
		this.qualityMode.set(quality);
	}

	/**
	 * Set loading state
	 * @param isLoading Loading state
	 */
	public setLoading(isLoading: boolean): void {
		this.isLoading.set(isLoading);
	}

	/**
	 * Handle window resize with debounce
	 */
	private handleResize(): void {
		if (!this.canvas) return;

		// Check for browser environment
		if (typeof window === 'undefined') return;

		// Update canvas dimensions
		const newWidth = window.innerWidth;
		const newHeight = window.innerHeight;

		this.canvas.width = newWidth;
		this.canvas.height = newHeight;

		// Update store
		this.dimensions.set({ width: newWidth, height: newHeight });

		// Temporarily reduce quality during resize for better performance
		const currentQuality = get(this.qualityMode);
		this.qualityMode.set('low');

		// Restore original quality after resize
		setTimeout(() => {
			this.qualityMode.set(currentQuality);
		}, 500);
	}

	/**
	 * Handle visibility change to pause animations when tab is hidden
	 */
	private handleVisibilityChange(): void {
		const isVisible = document.visibilityState === 'visible';
		this.isActive.set(isVisible);
	}
}

// Helper function to create a background manager instance
export function createBackgroundManager(): BackgroundManager {
	return new BackgroundManager();
}
