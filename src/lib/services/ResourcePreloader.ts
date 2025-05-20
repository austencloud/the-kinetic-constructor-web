// src/lib/services/ResourcePreloader.ts
import { writable, get } from 'svelte/store';
import type { Color, TKATurns } from '$lib/types/Types';
import { PropType as PropTypeEnum } from '$lib/types/Types';
import { logger } from '$lib/core/logging';
import { toAppError } from '$lib/types/ErrorTypes';

// Import the SvgManager directly to avoid circular dependencies
import SvgManager from '$lib/components/SvgManager/SvgManager';

// Define resource categories
export enum ResourceCategory {
	PROPS = 'props',
	ARROWS = 'arrows',
	GRIDS = 'grids',
	GLYPHS = 'glyphs'
}

// Define resource loading status
export interface ResourceLoadingStatus {
	loaded: number;
	total: number;
	failed: number;
	inProgress: boolean;
	category: ResourceCategory | null;
	message: string;
	progress: number;
	errors: Array<{ resource: string; error: string }>;
}

// Create a store for the loading status
export const resourceLoadingStatus = writable<ResourceLoadingStatus>({
	loaded: 0,
	total: 0,
	failed: 0,
	inProgress: false,
	category: null,
	message: '',
	progress: 0,
	errors: []
});

/**
 * ResourcePreloader Service
 *
 * Centralized service for preloading and caching all application resources
 */
export class ResourcePreloader {
	private svgManager: SvgManager;
	private resourcesLoaded = new Set<string>();
	private resourcesFailed = new Set<string>();
	private progressCallback?: (progress: number, message: string) => void;

	constructor() {
		this.svgManager = new SvgManager();
	}

	/**
	 * Set a callback function to report progress to the application
	 */
	setProgressCallback(callback: (progress: number, message: string) => void) {
		this.progressCallback = callback;
	}

	/**
	 * Update the loading status
	 */
	private updateStatus(updates: Partial<ResourceLoadingStatus>) {
		resourceLoadingStatus.update((status) => {
			const newStatus = { ...status, ...updates };

			// Calculate progress percentage
			if (newStatus.total > 0) {
				newStatus.progress = Math.floor((newStatus.loaded / newStatus.total) * 100);
			}

			// Report progress if callback is set
			if (this.progressCallback) {
				this.progressCallback(
					newStatus.progress,
					newStatus.message || `Loading ${newStatus.category || 'resources'}...`
				);
			}

			return newStatus;
		});
	}

	/**
	 * Mark a resource as loaded
	 */
	private markResourceLoaded(resourceKey: string) {
		if (!this.resourcesLoaded.has(resourceKey)) {
			this.resourcesLoaded.add(resourceKey);
			this.updateStatus({ loaded: this.resourcesLoaded.size });
		}
	}

	/**
	 * Mark a resource as failed
	 */
	private markResourceFailed(resourceKey: string, error: any) {
		if (!this.resourcesFailed.has(resourceKey)) {
			this.resourcesFailed.add(resourceKey);

			const errorMessage = error instanceof Error ? error.message : String(error);

			this.updateStatus({
				failed: this.resourcesFailed.size,
				errors: [
					...get(resourceLoadingStatus).errors,
					{ resource: resourceKey, error: errorMessage }
				]
			});

			logger.warn(`Failed to preload resource: ${resourceKey}`, { error });
		}
	}

	/**
	 * Preload all prop SVGs
	 */
	async preloadProps(): Promise<void> {
		const propTypes = Object.values(PropTypeEnum);
		const colors: Color[] = ['red', 'blue'];
		const totalProps = propTypes.length * colors.length;

		this.updateStatus({
			category: ResourceCategory.PROPS,
			message: 'Loading prop pictographs...',
			total: get(resourceLoadingStatus).total + totalProps,
			inProgress: true
		});

		const loadPromises = propTypes.flatMap((propType) =>
			colors.map(async (color) => {
				const resourceKey = `prop:${propType}:${color}`;
				try {
					await this.svgManager.getPropSvg(propType, color);
					this.markResourceLoaded(resourceKey);
				} catch (error) {
					this.markResourceFailed(resourceKey, error);
				}
			})
		);

		await Promise.allSettled(loadPromises);
	}

	/**
	 * Preload common arrow SVGs
	 */
	async preloadArrows(): Promise<void> {
		// Define arrow motion types for preloading (these are different from the MotionType in Types.ts)
		const motionTypes = ['SAME', 'OPPOSITE', 'SPLIT', 'INSPIN', 'ANTISPIN'] as const;
		// Define orientations for preloading (only 'in' and 'out' match the Orientation type)
		const orientations = ['in', 'out', 'wall', 'wheel'] as const;
		const turns: TKATurns[] = [0, 0.5, 1, 1.5, 2, 2.5, 3];
		const colors: Color[] = ['red', 'blue'];

		// Calculate total arrows to load
		const totalArrows = motionTypes.length * orientations.length * turns.length * colors.length;

		this.updateStatus({
			category: ResourceCategory.ARROWS,
			message: 'Loading arrow pictographs...',
			total: get(resourceLoadingStatus).total + totalArrows,
			inProgress: true
		});

		// Create batches of promises to avoid overwhelming the browser
		const batchSize = 20;
		const arrowConfigs = [];

		for (const motionType of motionTypes) {
			for (const orientation of orientations) {
				for (const turn of turns) {
					for (const color of colors) {
						arrowConfigs.push({ motionType, orientation, turn, color });
					}
				}
			}
		}

		// Process in batches
		for (let i = 0; i < arrowConfigs.length; i += batchSize) {
			const batch = arrowConfigs.slice(i, i + batchSize);

			await Promise.allSettled(
				batch.map(async ({ motionType, orientation, turn, color }) => {
					const resourceKey = `arrow:${motionType}:${orientation}:${turn}:${color}`;
					try {
						// Type assertion needed because our arrow types don't match the MotionType in Types.ts
						await this.svgManager.getArrowSvg(motionType as any, orientation as any, turn, color);
						this.markResourceLoaded(resourceKey);
					} catch (error) {
						this.markResourceFailed(resourceKey, error);
					}
				})
			);
		}
	}

	/**
	 * Preload grid SVGs
	 */
	async preloadGrids(): Promise<void> {
		const gridTypes = ['diamond', 'box'];

		this.updateStatus({
			category: ResourceCategory.GRIDS,
			message: 'Loading grid templates...',
			total: get(resourceLoadingStatus).total + gridTypes.length,
			inProgress: true
		});

		const loadPromises = gridTypes.map(async (gridType) => {
			const resourceKey = `grid:${gridType}`;
			try {
				const path = `/images/grids/${gridType}.svg`;
				await fetch(path);
				this.markResourceLoaded(resourceKey);
			} catch (error) {
				this.markResourceFailed(resourceKey, error);
			}
		});

		await Promise.allSettled(loadPromises);
	}

	/**
	 * Preload glyph SVGs (letters, numbers, etc.)
	 */
	async preloadGlyphs(): Promise<void> {
		// Letters A-Z
		const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
		// Numbers 0-3 with 0.5 increments
		const numbers = [0, 0.5, 1, 1.5, 2, 2.5, 3];
		// Special glyphs
		const specialGlyphs = ['dash', 'dot'];

		const totalGlyphs = letters.length + numbers.length + specialGlyphs.length;

		this.updateStatus({
			category: ResourceCategory.GLYPHS,
			message: 'Loading glyph resources...',
			total: get(resourceLoadingStatus).total + totalGlyphs,
			inProgress: true
		});

		// Preload letters
		const letterPromises = letters.map(async (letter) => {
			const resourceKey = `glyph:letter:${letter}`;
			try {
				const path = `/images/letters/${letter}.svg`;
				await fetch(path);
				this.markResourceLoaded(resourceKey);
			} catch (error) {
				this.markResourceFailed(resourceKey, error);
			}
		});

		// Preload numbers
		const numberPromises = numbers.map(async (number) => {
			const resourceKey = `glyph:number:${number}`;
			try {
				const path = `/images/numbers/${number.toString().replace('.', '_')}.svg`;
				await fetch(path);
				this.markResourceLoaded(resourceKey);
			} catch (error) {
				this.markResourceFailed(resourceKey, error);
			}
		});

		// Preload special glyphs
		const specialPromises = specialGlyphs.map(async (glyph) => {
			const resourceKey = `glyph:special:${glyph}`;
			try {
				const path = `/images/${glyph}.svg`;
				await fetch(path);
				this.markResourceLoaded(resourceKey);
			} catch (error) {
				this.markResourceFailed(resourceKey, error);
			}
		});

		await Promise.allSettled([...letterPromises, ...numberPromises, ...specialPromises]);
	}

	/**
	 * Preload all resources
	 */
	async preloadAll(): Promise<void> {
		this.updateStatus({
			loaded: 0,
			failed: 0,
			inProgress: true,
			message: 'Starting resource preloading...',
			progress: 0
		});

		try {
			// Start with glyphs first since they're most visible to users
			// and run in parallel with other resource loading
			const glyphsPromise = this.preloadGlyphs();

			// Preload other resources in sequence to avoid overwhelming the browser
			await this.preloadProps();
			await this.preloadGrids();
			await this.preloadArrows();

			// Make sure glyphs are fully loaded before continuing
			await glyphsPromise;

			// Log completion with resource counts
			logger.info(
				`Resource preloading complete: ${this.resourcesLoaded.size} loaded, ${this.resourcesFailed.size} failed`
			);
		} catch (error) {
			logger.error('Resource preloading failed', { error: toAppError(error) });
		} finally {
			this.updateStatus({
				inProgress: false,
				message: 'Resource loading complete'
			});
		}
	}
}

// Create singleton instance
export const resourcePreloader = new ResourcePreloader();
