// src/lib/services/ResourcePreloader.ts
import { writable, get } from 'svelte/store';
import type { Color, TKATurns } from '$lib/types/Types';
import { PropType } from '$lib/types/Types';
import { logger } from '$lib/core/logging';
import { toAppError } from '$lib/types/ErrorTypes';

// Import the SvgManager directly to avoid circular dependencies
import SvgManager from '$lib/components/SvgManager/SvgManager';
import { resourceCache } from '$lib/services/ResourceCache';

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
	 * Generate a fallback SVG for missing resources
	 * This can be used to create simple placeholder SVGs when files are missing
	 */
	private generateFallbackSvg(type: string, color: string = '#000000'): string {
		switch (type) {
			case 'dot':
				return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25">
					<circle cx="12.5" cy="12.5" r="12.5" fill="${color}"/>
				</svg>`;
			case 'dash':
				return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20">
					<rect x="0" y="5" width="100" height="10" fill="${color}"/>
				</svg>`;
			case 'grid':
				return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
					<rect x="0" y="0" width="200" height="200" fill="none" stroke="${color}" stroke-width="2"/>
					<line x1="0" y1="100" x2="200" y2="100" stroke="${color}" stroke-width="1"/>
					<line x1="100" y1="0" x2="100" y2="200" stroke="${color}" stroke-width="1"/>
				</svg>`;
			case 'number':
				return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
					<text x="10" y="35" font-family="Arial" font-size="30" fill="${color}">0</text>
				</svg>`;
			default:
				return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
					<rect x="5" y="5" width="40" height="40" fill="none" stroke="${color}" stroke-width="2"/>
					<text x="15" y="32" font-family="Arial" font-size="20" fill="${color}">?</text>
				</svg>`;
		}
	}

	/**
	 * Mark a resource as failed
	 */
	private markResourceFailed(resourceKey: string, error: any) {
		if (!this.resourcesFailed.has(resourceKey)) {
			this.resourcesFailed.add(resourceKey);

			const errorMessage = error instanceof Error ? error.message : String(error);
			const is404Error =
				errorMessage.includes('404') ||
				(error instanceof Error && error.message.includes('HTTP error 404'));

			// Only add to the errors list if it's not a common 404 for optional resources
			const isOptionalResource =
				resourceKey.includes('glyph:letter:') ||
				resourceKey.includes('glyph:number:') ||
				resourceKey.includes('glyph:special:') ||
				resourceKey.includes('grid:') ||
				resourceKey === 'glyph:special:dot';

			if (!isOptionalResource || !is404Error) {
				this.updateStatus({
					failed: this.resourcesFailed.size,
					errors: [
						...get(resourceLoadingStatus).errors,
						{ resource: resourceKey, error: errorMessage }
					]
				});
			} else {
				// Just update the count without adding to the errors list
				this.updateStatus({
					failed: this.resourcesFailed.size
				});
			}

			// Only log detailed errors in development mode
			if (import.meta.env.DEV) {
				// In development, log the full error for debugging
				// But don't log 404s for optional resources to reduce noise
				if (!isOptionalResource || !is404Error) {
					logger.warn(`Failed to preload resource: ${resourceKey}`, { error });
				}
			} else {
				// In production, just log the resource key without the full error details
				// This prevents console spam for expected 404s
				if (!isOptionalResource && !is404Error) {
					// Only log non-optional, non-404 errors in production
					logger.warn(`Failed to preload resource: ${resourceKey}`);
				}
			}
		}
	}

	/**
	 * Preload all prop SVGs
	 */
	async preloadProps(): Promise<void> {
		const propTypes = Object.values(PropType);
		const colors: Color[] = ['red', 'blue'];
		const totalProps = propTypes.length * colors.length;

		this.updateStatus({
			category: ResourceCategory.PROPS,
			message: 'Loading prop pictographs...',
			total: get(resourceLoadingStatus).total + totalProps,
			inProgress: true
		});

		// Create an array of all prop configurations for better progress tracking
		const propConfigs = [];
		for (const propType of propTypes) {
			for (const color of colors) {
				propConfigs.push({ propType, color });
			}
		}

		// Track progress for detailed updates
		let loadedCount = 0;

		// Process props in sequence to provide accurate progress updates
		for (const { propType, color } of propConfigs) {
			const resourceKey = `prop:${propType}:${color}`;
			try {
				// Update message with specific prop being loaded
				this.updateStatus({
					message: `Loading prop: ${propType} (${color})...`
				});

				await this.svgManager.getPropSvg(propType, color);

				loadedCount++;
				// Update progress message with percentage
				const progressPercent = Math.floor((loadedCount / totalProps) * 100);
				this.updateStatus({
					message: `Loading props (${progressPercent}%)... ${propType} ${color}`
				});

				this.markResourceLoaded(resourceKey);
			} catch (error) {
				this.markResourceFailed(resourceKey, error);
			}

			// Yield to the main thread between props to keep UI responsive
			if (typeof window !== 'undefined') {
				await new Promise((resolve) => setTimeout(resolve, 0));
			}
		}
	}

	/**
	 * Preload common arrow SVGs
	 */
	async preloadArrows(): Promise<void> {
		// Use the actual motion types that exist in the file system
		const motionTypes = ['pro', 'anti', 'float', 'dash', 'static'] as const;
		// Only use orientations that exist in the file system
		const orientations = ['in', 'out', 'clock', 'counter'] as const;
		const turns: TKATurns[] = [0, 0.5, 1, 1.5, 2, 2.5, 3];
		const colors: Color[] = ['red', 'blue'];

		// Create batches of promises to avoid overwhelming the browser
		const batchSize = 10;
		const arrowConfigs = [];

		// Generate all valid combinations
		for (const motionType of motionTypes) {
			// Skip float for regular turns processing - we'll add it separately
			if (motionType === 'float') continue;

			for (const orientation of orientations) {
				for (const turn of turns) {
					for (const color of colors) {
						arrowConfigs.push({ motionType, orientation, turn, color });
					}
				}
			}
		}

		// Add special handling for float.svg which has a different structure
		arrowConfigs.push({
			motionType: 'float',
			orientation: 'in',
			turn: 'fl' as TKATurns,
			color: 'red'
		});
		arrowConfigs.push({
			motionType: 'float',
			orientation: 'in',
			turn: 'fl' as TKATurns,
			color: 'blue'
		});

		// Calculate total arrows to load
		const totalArrows = arrowConfigs.length;

		this.updateStatus({
			category: ResourceCategory.ARROWS,
			message: 'Loading arrow pictographs...',
			total: get(resourceLoadingStatus).total + totalArrows,
			inProgress: true
		});

		// Track progress for detailed updates
		let loadedCount = 0;
		let currentBatch = 1;
		const totalBatches = Math.ceil(arrowConfigs.length / batchSize);

		// Process in batches
		for (let i = 0; i < arrowConfigs.length; i += batchSize) {
			const batch = arrowConfigs.slice(i, i + batchSize);

			// Update message with batch information
			this.updateStatus({
				message: `Loading arrows (batch ${currentBatch}/${totalBatches})...`
			});

			await Promise.allSettled(
				batch.map(async ({ motionType, orientation, turn, color }) => {
					const resourceKey = `arrow:${motionType}:${orientation}:${turn}:${color}`;
					try {
						// Skip float with numeric turns since they don't exist
						if (motionType === 'float' && turn !== 'fl') {
							return;
						}

						await this.svgManager.getArrowSvg(
							motionType as any,
							orientation as any,
							turn,
							color as any
						);

						loadedCount++;
						// Update progress message with more specific information
						const progressPercent = Math.floor((loadedCount / totalArrows) * 100);
						this.updateStatus({
							message: `Loading arrows (${progressPercent}%)... ${motionType}_${turn} ${color}`
						});

						this.markResourceLoaded(resourceKey);
					} catch (error) {
						this.markResourceFailed(resourceKey, error);
					}
				})
			);

			// Yield to the main thread between batches to keep UI responsive
			if (typeof window !== 'undefined') {
				await new Promise((resolve) => setTimeout(resolve, 0));
			}

			currentBatch++;
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
				// Try the correct path first
				const path = `/images/grid/${gridType}_grid.svg`;

				try {
					const response = await fetch(path);
					if (!response.ok) {
						throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
					}
					this.markResourceLoaded(resourceKey);
				} catch (fetchError) {
					// Try alternative paths
					const altPaths = [`/images/grids/${gridType}.svg`, `/images/grid/${gridType}.svg`];

					let loaded = false;
					for (const altPath of altPaths) {
						try {
							const altResponse = await fetch(altPath);
							if (altResponse.ok) {
								this.markResourceLoaded(resourceKey);
								loaded = true;
								break;
							}
						} catch {
							// Continue to next alternative
						}
					}

					if (!loaded) {
						// Generate a fallback grid SVG
						const fallbackSvg = this.generateFallbackSvg('grid');

						// Create a Blob from the SVG string
						const blob = new Blob([fallbackSvg], { type: 'image/svg+xml' });
						const url = URL.createObjectURL(blob);

						try {
							// Fetch the blob URL to cache it
							const fallbackResponse = await fetch(url);
							if (fallbackResponse.ok) {
								// Store in ResourceCache
								try {
									resourceCache.set(`fallback:grid:${gridType}`, fallbackSvg);
								} catch (e) {
									// Ignore cache errors
								}

								this.markResourceLoaded(resourceKey);
								return;
							}
						} catch {
							// If blob URL fetch fails, just mark as loaded anyway
							this.markResourceLoaded(resourceKey);
						} finally {
							// Clean up the blob URL
							URL.revokeObjectURL(url);
						}
					}
				}
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

		// Import the getLetterPath function from glyphStore
		const { getLetterPath } = await import('$lib/stores/glyphStore');
		const { Letter } = await import('$lib/types/Letter');

		// Preload letters
		const letterPromises = letters.map(async (letter) => {
			const resourceKey = `glyph:letter:${letter}`;
			try {
				// Convert string to Letter enum and use getLetterPath to get the correct path
				// For A-V, they are in Type1 folder
				const letterEnum = Letter[letter as keyof typeof Letter];
				const path = letterEnum
					? getLetterPath(letterEnum)
					: `/images/letters_trimmed/Type1/${letter}.svg`;

				try {
					const response = await fetch(path);
					if (!response.ok) {
						throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
					}
					this.markResourceLoaded(resourceKey);
				} catch (fetchError) {
					// If the primary path fails, try the fallback path
					try {
						const fallbackPath = `/images/letters_trimmed/Type1/${letter}.svg`;
						if (path !== fallbackPath) {
							const fallbackResponse = await fetch(fallbackPath);
							if (fallbackResponse.ok) {
								this.markResourceLoaded(resourceKey);
								return;
							}
						}
						throw fetchError; // Re-throw if fallback also fails or is the same as primary
					} catch {
						throw fetchError; // Re-throw the original error
					}
				}
			} catch (error) {
				this.markResourceFailed(resourceKey, error);
			}
		});

		// Preload numbers
		const numberPromises = numbers.map(async (number) => {
			const resourceKey = `glyph:number:${number}`;
			try {
				// Skip 0 since it doesn't exist and isn't needed
				if (number === 0) {
					// Mark as loaded to avoid errors
					this.markResourceLoaded(resourceKey);
					return;
				}

				// Use the correct path for number SVGs
				const path = `/images/numbers/${number}.svg`;

				try {
					const response = await fetch(path);
					if (!response.ok) {
						throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
					}
					this.markResourceLoaded(resourceKey);
				} catch (fetchError) {
					// Try alternative format (with underscore instead of dot)
					try {
						const altPath = `/images/numbers/${number.toString().replace('.', '_')}.svg`;
						if (path !== altPath) {
							const altResponse = await fetch(altPath);
							if (altResponse.ok) {
								this.markResourceLoaded(resourceKey);
								return;
							}
						}
						// Generate a fallback number SVG
						const fallbackSvg = this.generateFallbackSvg('number');

						// Create a Blob from the SVG string
						const blob = new Blob([fallbackSvg], { type: 'image/svg+xml' });
						const url = URL.createObjectURL(blob);

						try {
							// Fetch the blob URL to cache it
							const fallbackResponse = await fetch(url);
							if (fallbackResponse.ok) {
								// Store in ResourceCache
								try {
									resourceCache.set(`fallback:number:${number}`, fallbackSvg);
								} catch (e) {
									// Ignore cache errors
								}

								this.markResourceLoaded(resourceKey);
								return;
							}
						} catch {
							// If blob URL fetch fails, just mark as loaded anyway
							this.markResourceLoaded(resourceKey);
							return;
						} finally {
							// Clean up the blob URL
							URL.revokeObjectURL(url);
						}
					} catch {
						throw fetchError;
					}
				}
			} catch (error) {
				// Only log errors for non-zero numbers in production
				if (number !== 0 || import.meta.env.DEV) {
					this.markResourceFailed(resourceKey, error);
				} else {
					// Silently mark as loaded to avoid errors
					this.markResourceLoaded(resourceKey);
				}
			}
		});

		// Preload special glyphs
		const specialPromises = specialGlyphs.map(async (glyph) => {
			const resourceKey = `glyph:special:${glyph}`;
			try {
				// Use specific paths for known glyphs
				let primaryPath = '';
				if (glyph === 'dot') {
					primaryPath = `/images/same_opp_dot.svg`;
				} else if (glyph === 'dash') {
					primaryPath = `/images/dash.svg`;
				} else {
					primaryPath = `/images/${glyph}.svg`;
				}

				try {
					const response = await fetch(primaryPath);
					if (!response.ok) {
						throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
					}
					this.markResourceLoaded(resourceKey);
				} catch (fetchError) {
					// Try alternative locations with comprehensive fallbacks
					const altPaths = [
						`/images/${glyph}.svg`,
						`/images/arrows/${glyph}.svg`,
						`/images/same_opp_${glyph}.svg`,
						`/images/special/${glyph}.svg`
					];

					// Remove the primary path from alternatives if it's already in the list
					const uniqueAltPaths = altPaths.filter((path) => path !== primaryPath);

					for (const altPath of uniqueAltPaths) {
						try {
							const altResponse = await fetch(altPath);
							if (altResponse.ok) {
								this.markResourceLoaded(resourceKey);
								return;
							}
						} catch {
							// Continue to next alternative
						}
					}

					// If we get here, all alternatives failed
					// For certain glyphs, create a fallback SVG in memory
					if (glyph === 'dot' || glyph === 'dash') {
						// Generate a fallback SVG and cache it
						const fallbackSvg = this.generateFallbackSvg(glyph);

						// Create a Blob from the SVG string
						const blob = new Blob([fallbackSvg], { type: 'image/svg+xml' });
						const url = URL.createObjectURL(blob);

						// Fetch the blob URL to cache it
						try {
							const fallbackResponse = await fetch(url);
							if (fallbackResponse.ok) {
								// Store in ResourceCache if available
								try {
									// Use our own resourceCache instance instead of window
									resourceCache.set(`fallback:${glyph}`, fallbackSvg);
								} catch (e) {
									// Ignore cache errors
								}

								this.markResourceLoaded(resourceKey);
								return;
							}
						} catch {
							// If blob URL fetch fails, just mark as loaded anyway
							this.markResourceLoaded(resourceKey);
							return;
						} finally {
							// Clean up the blob URL
							URL.revokeObjectURL(url);
						}
					}

					throw fetchError;
				}
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
		// Reset loading state
		this.resourcesLoaded.clear();
		this.resourcesFailed.clear();

		this.updateStatus({
			loaded: 0,
			failed: 0,
			inProgress: true,
			message: 'Starting resource preloading...',
			progress: 0,
			total: 0 // Will be updated by each preload method
		});

		try {
			// Define the loading phases with descriptive names
			const phases = [
				{ name: 'Props', method: this.preloadProps.bind(this), weight: 20 },
				{ name: 'Grids', method: this.preloadGrids.bind(this), weight: 10 },
				{ name: 'Arrows', method: this.preloadArrows.bind(this), weight: 50 },
				{ name: 'Glyphs', method: this.preloadGlyphs.bind(this), weight: 20 }
			];

			// Calculate total weight for percentage calculations
			const totalWeight = phases.reduce((sum, phase) => sum + phase.weight, 0);
			let completedWeight = 0;

			// Process each phase sequentially for better progress tracking
			for (let i = 0; i < phases.length; i++) {
				const phase = phases[i];
				const phaseNumber = i + 1;

				// Update overall progress message
				this.updateStatus({
					message: `Phase ${phaseNumber}/${phases.length}: Loading ${phase.name}...`
				});

				// Execute the preload method for this phase
				await phase.method();

				// Update completed weight for overall progress calculation
				completedWeight += phase.weight;
				const overallProgress = Math.floor((completedWeight / totalWeight) * 100);

				// Update overall progress
				this.updateStatus({
					progress: overallProgress,
					message: `${overallProgress}% complete - Finished loading ${phase.name}`
				});

				// Small delay between phases for UI updates
				if (typeof window !== 'undefined') {
					await new Promise((resolve) => setTimeout(resolve, 100));
				}
			}

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
