// src/lib/components/SvgManager/SvgManager.ts
import {
	PropType,
	type Color,
	type MotionType,
	type Orientation,
	type TKATurns
} from '$lib/types/Types';
import { resourceCache } from '$lib/services/ResourceCache';
import { getEmbeddedPropSvg } from '$lib/utils/embeddedSvgs';
import { getEmbeddedArrowSvg } from '$lib/utils/embeddedArrowSvgs';
import { logger } from '$lib/core/logging';
import { toAppError } from '$lib/types/ErrorTypes';

/**
 * Enhanced SvgManager that uses the centralized ResourceCache
 */
export default class SvgManager {
	/**
	 * Local memory cache for immediate access during the current session
	 * This is a fallback in case the ResourceCache is not available
	 */
	private static readonly localCache: Map<string, string> = new Map();

	/**
	 * Track in-flight SVG fetch requests to prevent duplicate fetches
	 */
	private static readonly inFlightRequests: Map<string, Promise<string>> = new Map();

	/**
	 * Get a unique key for caching SVG content
	 */
	private getCacheKey(parts: string[]): string {
		return parts.join(':');
	}

	/**
	 * Fetch SVG content with error handling and timeout
	 * Optimized to reduce setTimeout violations and prevent duplicate fetches
	 */
	private async fetchSvg(path: string): Promise<string> {
		// Check if there's already an in-flight request for this path
		if (SvgManager.inFlightRequests.has(path)) {
			try {
				// Wait for the existing request to complete
				return await SvgManager.inFlightRequests.get(path)!;
			} catch (error) {
				// If the in-flight request fails, continue with a new request
				console.warn(`In-flight SVG request for ${path} failed:`, error);
			}
		}

		// Create a new fetch promise
		const fetchSvgPromise = (async () => {
			try {
				if (typeof window === 'undefined') {
					throw new Error('Cannot fetch SVG in SSR context');
				}

				// Use a more efficient approach with Promise.race instead of setTimeout
				const fetchPromise = async () => {
					// Add retry logic for network issues
					let retries = 2;
					let response;

					while (retries >= 0) {
						try {
							// Use fetch with cache: 'force-cache' to prioritize cached responses
							response = await fetch(path, {
								cache: 'force-cache', // Prefer cached responses
								headers: {
									'Cache-Control': 'max-age=3600'
								}
							});
							break; // If successful, exit the retry loop
						} catch (fetchError) {
							if (retries === 0) throw fetchError;
							retries--;
							// Use a microtask instead of setTimeout to avoid violations
							await Promise.resolve();
						}
					}

					if (!response || !response.ok) {
						throw new Error(`Failed to fetch SVG: ${path} (${response?.status || 'unknown'})`);
					}

					return response.text();
				};

				// Detect if we're on a mobile device for longer timeout
				const isMobileDevice =
					typeof window !== 'undefined' &&
					(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
						navigator.userAgent
					) ||
						window.innerWidth <= 768);

				// Longer timeout for mobile devices
				const timeoutDuration = isMobileDevice ? 5000 : 2000;

				// Create a timeout promise that resolves with a fallback SVG
				const timeoutPromise = new Promise<string>((resolve) => {
					// Use requestAnimationFrame to schedule the timeout
					let rafId: number;
					const startTime = performance.now();

					const checkTimeout = () => {
						const elapsed = performance.now() - startTime;
						if (elapsed >= timeoutDuration) {
							// Return a simple fallback SVG
							const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
								<rect width="100" height="100" fill="#f8f8f8" />
								<circle cx="50" cy="50" r="30" fill="#cccccc" opacity="0.5" />
								<text x="50" y="55" text-anchor="middle" fill="#666666" font-size="10">Loading</text>
								<circle id="centerPoint" cx="50" cy="50" r="2" fill="red" />
							</svg>`;

							// Log timeout for debugging
							if (import.meta.env.DEV) {
								console.warn(`SVG fetch timeout (${timeoutDuration}ms) for: ${path}`);
							}

							resolve(fallbackSvg);
						} else {
							rafId = requestAnimationFrame(checkTimeout);
						}
					};

					rafId = requestAnimationFrame(checkTimeout);

					// Cleanup function
					(timeoutPromise as any).cancel = () => {
						cancelAnimationFrame(rafId);
					};
				});

				// Race the fetch against the timeout
				const result = await Promise.race([fetchPromise(), timeoutPromise]);

				// Cancel the timeout if fetch completed first
				if ((timeoutPromise as any).cancel) {
					(timeoutPromise as any).cancel();
				}

				return result;
			} catch (error) {
				// Minimal logging in production
				if (import.meta.env.DEV) {
					console.error(`SVG fetch error for ${path}:`, error);
				} else {
					console.error(`SVG fetch error for ${path}`);
				}

				// Return a fallback SVG instead of throwing
				return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
					<rect width="100" height="100" fill="#cccccc" />
					<text x="10" y="50" fill="#666666">Error</text>
					<circle id="centerPoint" cx="50" cy="50" r="2" fill="red" />
				</svg>`;
			}
		})();

		// Register this as an in-flight request
		SvgManager.inFlightRequests.set(path, fetchSvgPromise);

		try {
			// Wait for the fetch to complete
			const result = await fetchSvgPromise;
			return result;
		} finally {
			// Remove from in-flight requests when done
			if (SvgManager.inFlightRequests.get(path) === fetchSvgPromise) {
				SvgManager.inFlightRequests.delete(path);
			}
		}
	}

	/**
	 * Apply color transformation to SVG content
	 */
	public applyColor(svgData: string, color: Color): string {
		const hexColor = color === 'red' ? '#ED1C24' : '#2E3192';
		return svgData.replace(
			/\.st0{([^}]*fill:#)[0-9A-Fa-f]{6}([^}]*)}/g,
			`.st0{$1${hexColor.slice(1)}$2}`
		);
	}

	/**
	 * Ensure SVG has a centerPoint element
	 */
	private ensureCenterPoint(svgData: string): string {
		// Check if centerPoint already exists
		if (svgData.includes('id="centerPoint"')) {
			return svgData;
		}

		// Extract viewBox dimensions to calculate center
		const viewBoxMatch = svgData.match(/viewBox="([^"]+)"/);
		let centerX = 50;
		let centerY = 50;

		if (viewBoxMatch && viewBoxMatch[1]) {
			const [, , width, height] = viewBoxMatch[1].split(' ').map(parseFloat);
			centerX = width / 2;
			centerY = height / 2;
		}

		// Add centerPoint before the closing svg tag
		return svgData.replace(
			'</svg>',
			`<circle id="centerPoint" cx="${centerX}" cy="${centerY}" r="2" fill="red" style="display:none;"/></svg>`
		);
	}

	/**
	 * Get prop SVG directly from source
	 */
	public async getPropSvg(propType: PropType, color: Color): Promise<string> {
		const cacheKey = this.getCacheKey(['prop', propType, color]);

		try {
			// First check for embedded SVG (highest priority)
			const embeddedSvg = getEmbeddedPropSvg(propType, color);
			if (embeddedSvg) {
				// Store in both caches for future use
				SvgManager.localCache.set(cacheKey, embeddedSvg);
				await resourceCache.set(cacheKey, embeddedSvg);
				return embeddedSvg;
			}

			// Check ResourceCache next
			const cachedSvg = await resourceCache.get<string>(cacheKey);
			if (cachedSvg) {
				return cachedSvg;
			}

			// Check local cache as fallback
			if (SvgManager.localCache.has(cacheKey)) {
				return SvgManager.localCache.get(cacheKey)!;
			}

			// For staff props, always use embedded SVGs (this is a safety fallback)
			if (propType === PropType.STAFF) {
				const fallbackStaffSvg =
					color === 'red'
						? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 252.8 77.8">
						<path fill="#ED1C24" stroke="#FFFFFF" stroke-width="2.75" stroke-miterlimit="10" d="M251.4,67.7V10.1c0-4.8-4.1-8.7-9.1-8.7s-9.1,3.9-9.1,8.7v19.2H10.3c-4.9,0-8.9,3.8-8.9,8.5V41c0,4.6,4,8.5,8.9,8.5h222.9v18.2c0,4.8,4.1,8.7,9.1,8.7S251.4,72.5,251.4,67.7z"/>
						<circle id="centerPoint" fill="#FF0000" cx="126.4" cy="38.9" r="2"/>
					</svg>`
						: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 252.8 77.8">
						<path fill="#2E3192" stroke="#FFFFFF" stroke-width="2.75" stroke-miterlimit="10" d="M251.4,67.7V10.1c0-4.8-4.1-8.7-9.1-8.7s-9.1,3.9-9.1,8.7v19.2H10.3c-4.9,0-8.9,3.8-8.9,8.5V41c0,4.6,4,8.5,8.9,8.5h222.9v18.2c0,4.8,4.1,8.7,9.1,8.7S251.4,72.5,251.4,67.7z"/>
						<circle id="centerPoint" fill="#FF0000" cx="126.4" cy="38.9" r="2"/>
					</svg>`;

				// Store in both caches
				SvgManager.localCache.set(cacheKey, fallbackStaffSvg);
				await resourceCache.set(cacheKey, fallbackStaffSvg);
				return fallbackStaffSvg;
			}

			// Fallback to direct fetch - use the correct path with static prefix
			const path = `/static/images/props/${propType}.svg`;
			const baseSvg = await this.fetchSvg(path);

			// Apply color transformation if needed
			const coloredSvg = propType === PropType.HAND ? baseSvg : this.applyColor(baseSvg, color);

			// Ensure the SVG has a centerPoint element
			const svgWithCenterPoint = this.ensureCenterPoint(coloredSvg);

			// Store in both caches
			SvgManager.localCache.set(cacheKey, svgWithCenterPoint);
			await resourceCache.set(cacheKey, svgWithCenterPoint);

			logger.debug(`Cached prop SVG: ${propType} (${color})`);

			return svgWithCenterPoint;
		} catch (error) {
			logger.error(`Error fetching prop SVG: ${propType} (${color})`, { error: toAppError(error) });
			// Return a fallback SVG with centerPoint
			return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
				<rect width="100" height="100" fill="#cccccc" />
				<text x="10" y="50" fill="${color === 'red' ? '#ED1C24' : '#2E3192'}">Error</text>
				<circle id="centerPoint" cx="50" cy="50" r="2" fill="red" />
			</svg>`;
		}
	}

	/**
	 * Get arrow SVG directly from source
	 */
	public async getArrowSvg(
		motionType: MotionType,
		startOri: Orientation,
		turns: TKATurns,
		color: Color
	): Promise<string> {
		const cacheKey = this.getCacheKey(['arrow', motionType, startOri, String(turns), color]);

		try {
			// First check for embedded SVG (highest priority)
			const embeddedSvg = getEmbeddedArrowSvg(motionType, startOri, turns, color);
			if (embeddedSvg) {
				// Store in both caches for future use
				SvgManager.localCache.set(cacheKey, embeddedSvg);
				await resourceCache.set(cacheKey, embeddedSvg);
				return embeddedSvg;
			}

			// Check ResourceCache next
			const cachedSvg = await resourceCache.get<string>(cacheKey);
			if (cachedSvg) {
				return cachedSvg;
			}

			// Check local cache as fallback
			if (SvgManager.localCache.has(cacheKey)) {
				return SvgManager.localCache.get(cacheKey)!;
			}

			// Fallback to direct fetch - use the correct path with assets prefix
			const basePath = '/static/images/arrows';

			// Special handling for float motion type
			if (motionType === 'float' && turns === 'fl') {
				// Float has a special path
				const svgPath = `${basePath}/float.svg`;
				const svgData = await this.fetchSvg(svgPath);
				const coloredSvg = this.applyColor(svgData, color);

				// Ensure the SVG has a centerPoint element
				const svgWithCenterPoint = this.ensureCenterPoint(coloredSvg);

				// Store in both caches
				SvgManager.localCache.set(cacheKey, svgWithCenterPoint);
				await resourceCache.set(cacheKey, svgWithCenterPoint);

				logger.debug(`Cached float SVG: (${color})`);

				return svgWithCenterPoint;
			}

			// Standard path for other motion types
			const typePath = motionType.toLowerCase();
			const radialPath = startOri === 'out' || startOri === 'in' ? 'from_radial' : 'from_nonradial';
			const fixedTurns = (typeof turns === 'number' ? turns : parseFloat(turns.toString())).toFixed(
				1
			);
			const svgPath = `${basePath}/${typePath}/${radialPath}/${motionType}_${fixedTurns}.svg`;

			const svgData = await this.fetchSvg(svgPath);
			const coloredSvg = this.applyColor(svgData, color);

			// Ensure the SVG has a centerPoint element
			const svgWithCenterPoint = this.ensureCenterPoint(coloredSvg);

			// Store in both caches
			SvgManager.localCache.set(cacheKey, svgWithCenterPoint);
			await resourceCache.set(cacheKey, svgWithCenterPoint);

			logger.debug(`Cached arrow SVG: ${motionType}_${turns} (${color})`);

			return svgWithCenterPoint;
		} catch (error) {
			// Check if it's a specific error we can handle
			if (error instanceof DOMException && error.name === 'AbortError') {
				logger.warn(`Arrow SVG fetch timeout: ${motionType}_${turns}.svg`);
			} else {
				logger.error(`Error fetching arrow SVG: ${motionType}_${turns} (${color})`, {
					error: toAppError(error)
				});
			}

			// Return a fallback SVG with centerPoint
			const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
				<rect width="240" height="80" fill="#cccccc" opacity="0.2" />
				<path d="M240,40C240,40,240,40,240,40c-4,4.8-28.6,32.6-38.3,39.8c-1.4,1.1-8.4,4-16.6-4.2l26.8-27.2H9c-6.1,0-9.1-4.2-9-8.3
					c0-4.3,3-8.5,9-8.5h202.6L184.9,4.4c8.2-8.2,15.2-5.3,16.6-4.2C211.2,7.3,235.8,35.2,239.8,40C239.9,39.9,239.8,39.9,240,40z"
					fill="${color === 'red' ? '#ED1C24' : '#2E3192'}" />
				<circle id="centerPoint" cx="120" cy="40" r="2" fill="red" />
			</svg>`;

			// Cache the fallback for future use
			SvgManager.localCache.set(cacheKey, fallbackSvg);
			try {
				await resourceCache.set(cacheKey, fallbackSvg, 60000); // Short TTL for fallbacks
			} catch (cacheError) {
				// Ignore cache errors for fallbacks
			}

			return fallbackSvg;
		}
	}

	/**
	 * Clear the SVG cache (useful for testing or when memory needs to be reclaimed)
	 */
	public static async clearCache(): Promise<void> {
		SvgManager.localCache.clear();
		try {
			// Clear only SVG resources from the cache
			const stats = resourceCache.getStats();
			if (stats.categories.prop || stats.categories.arrow) {
				await resourceCache.clear();
				logger.info('Cleared resource cache for SVGs');
			}
		} catch (error) {
			logger.error('Error clearing resource cache:', { error: toAppError(error) });
		}
	}

	/**
	 * Get stats about the cache
	 */
	public static getCacheStats(): { localSize: number; resourceCacheStats: any } {
		return {
			localSize: SvgManager.localCache.size,
			resourceCacheStats: resourceCache.getStats()
		};
	}

	/**
	 * Preload multiple arrow SVGs in parallel for better performance
	 * Optimized to eliminate setTimeout violations
	 */
	public async preloadArrowSvgs(
		arrowConfigs: Array<{
			motionType: MotionType;
			startOri: Orientation;
			turns: TKATurns;
			color: Color;
		}>
	): Promise<void> {
		// Use requestAnimationFrame to schedule preloading
		if (typeof window !== 'undefined') {
			return new Promise((resolve) => {
				requestAnimationFrame(async () => {
					try {
						await this.doPreloadArrowSvgs(arrowConfigs);
					} catch (error) {
						logger.warn('Error during preloading SVGs', { error: toAppError(error) });
					}
					resolve();
				});
			});
		} else {
			// In SSR context, just resolve immediately
			return Promise.resolve();
		}
	}

	/**
	 * Preload multiple prop SVGs in parallel for better performance
	 * Optimized to eliminate setTimeout violations
	 */
	public async preloadPropSvgs(
		propConfigs: Array<{
			propType: PropType;
			color: Color;
		}>
	): Promise<void> {
		// Use requestAnimationFrame to schedule preloading
		if (typeof window !== 'undefined') {
			return new Promise((resolve) => {
				requestAnimationFrame(async () => {
					try {
						await this.doPreloadPropSvgs(propConfigs);
					} catch (error) {
						logger.warn('Error during preloading prop SVGs', { error: toAppError(error) });
					}
					resolve();
				});
			});
		} else {
			// In SSR context, just resolve immediately
			return Promise.resolve();
		}
	}

	/**
	 * Internal implementation of prop preloading that's scheduled by requestAnimationFrame
	 */
	private async doPreloadPropSvgs(
		propConfigs: Array<{
			propType: PropType;
			color: Color;
		}>
	): Promise<void> {
		// Process configs in batches to avoid overwhelming the browser
		const BATCH_SIZE = 2;
		const batches: Array<typeof propConfigs> = [];

		// Split configs into batches
		for (let i = 0; i < propConfigs.length; i += BATCH_SIZE) {
			batches.push(propConfigs.slice(i, i + BATCH_SIZE));
		}

		// Process each batch sequentially
		for (const batch of batches) {
			// Create an array of promises for the current batch
			const fetchPromises = batch.map(async (config) => {
				const { propType, color } = config;
				const cacheKey = this.getCacheKey(['prop', propType, color]);

				try {
					// First check for embedded SVG (highest priority)
					const embeddedSvg = getEmbeddedPropSvg(propType, color);
					if (embeddedSvg) {
						// Store in both caches for future use
						SvgManager.localCache.set(cacheKey, embeddedSvg);
						await resourceCache.set(cacheKey, embeddedSvg);
						logger.debug(`Using embedded SVG for: ${propType} (${color})`);
						return;
					}

					// Check if already in ResourceCache
					const cachedSvg = await resourceCache.get<string>(cacheKey);
					if (cachedSvg) {
						// Also update local cache for faster access
						SvgManager.localCache.set(cacheKey, cachedSvg);
						return;
					}

					// Check local cache as fallback
					if (SvgManager.localCache.has(cacheKey)) {
						// Update ResourceCache from local cache
						const localCachedSvg = SvgManager.localCache.get(cacheKey)!;
						await resourceCache.set(cacheKey, localCachedSvg);
						return;
					}

					// For staff props, always use embedded SVGs (this is a safety fallback)
					if (propType === PropType.STAFF) {
						const fallbackStaffSvg =
							color === 'red'
								? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 252.8 77.8">
								<path fill="#ED1C24" stroke="#FFFFFF" stroke-width="2.75" stroke-miterlimit="10" d="M251.4,67.7V10.1c0-4.8-4.1-8.7-9.1-8.7s-9.1,3.9-9.1,8.7v19.2H10.3c-4.9,0-8.9,3.8-8.9,8.5V41c0,4.6,4,8.5,8.9,8.5h222.9v18.2c0,4.8,4.1,8.7,9.1,8.7S251.4,72.5,251.4,67.7z"/>
								<circle id="centerPoint" fill="#FF0000" cx="126.4" cy="38.9" r="2"/>
							</svg>`
								: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 252.8 77.8">
								<path fill="#2E3192" stroke="#FFFFFF" stroke-width="2.75" stroke-miterlimit="10" d="M251.4,67.7V10.1c0-4.8-4.1-8.7-9.1-8.7s-9.1,3.9-9.1,8.7v19.2H10.3c-4.9,0-8.9,3.8-8.9,8.5V41c0,4.6,4,8.5,8.9,8.5h222.9v18.2c0,4.8,4.1,8.7,9.1,8.7S251.4,72.5,251.4,67.7z"/>
								<circle id="centerPoint" fill="#FF0000" cx="126.4" cy="38.9" r="2"/>
							</svg>`;

						// Store in both caches
						SvgManager.localCache.set(cacheKey, fallbackStaffSvg);
						await resourceCache.set(cacheKey, fallbackStaffSvg);
						logger.debug(`Using fallback staff SVG for: ${propType} (${color})`);
						return;
					}

					// Fetch the SVG - no retry logic here as fetchSvg already handles that
					const path = `/static/images/props/${propType}.svg`;
					const svgData = await this.fetchSvg(path);

					// Use a microtask to yield to the main thread
					await Promise.resolve();

					// Apply color transformation if needed
					const coloredSvg = propType === PropType.HAND ? svgData : this.applyColor(svgData, color);

					// Ensure the SVG has a centerPoint element
					const svgWithCenterPoint = this.ensureCenterPoint(coloredSvg);

					// Store in both caches
					SvgManager.localCache.set(cacheKey, svgWithCenterPoint);
					await resourceCache.set(cacheKey, svgWithCenterPoint);

					logger.debug(`Preloaded prop SVG: ${propType} (${color})`);
				} catch (error) {
					// Handle errors gracefully without failing the entire batch
					logger.warn(`Preload failed for prop: ${propType} (${color})`, {
						error: toAppError(error)
					});

					// Create a fallback SVG with centerPoint for the cache
					const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
						<rect width="100" height="100" fill="#cccccc" opacity="0.5" />
						<text x="10" y="50" fill="${color === 'red' ? '#ED1C24' : '#2E3192'}">Prop</text>
						<circle id="centerPoint" cx="50" cy="50" r="2" fill="red" />
					</svg>`;

					// Cache the fallback SVG in both caches
					SvgManager.localCache.set(cacheKey, fallbackSvg);
					try {
						await resourceCache.set(cacheKey, fallbackSvg, 60000); // Short TTL for fallbacks
					} catch (cacheError) {
						// Ignore cache errors for fallbacks
					}
				}
			});

			// Wait for all promises in the current batch to complete
			await Promise.all(fetchPromises);

			// Yield to the main thread between batches to keep UI responsive
			if (typeof window !== 'undefined') {
				await new Promise((resolve) => setTimeout(resolve, 0));
			}
		}
	}

	/**
	 * Internal implementation of preloading that's scheduled by requestAnimationFrame
	 */
	private async doPreloadArrowSvgs(
		arrowConfigs: Array<{
			motionType: MotionType;
			startOri: Orientation;
			turns: TKATurns;
			color: Color;
		}>
	): Promise<void> {
		// Process configs in batches to avoid overwhelming the browser
		const BATCH_SIZE = 2;
		const batches: Array<typeof arrowConfigs> = [];

		// Split configs into batches
		for (let i = 0; i < arrowConfigs.length; i += BATCH_SIZE) {
			batches.push(arrowConfigs.slice(i, i + BATCH_SIZE));
		}

		// Process each batch sequentially
		for (const batch of batches) {
			// Create an array of promises for the current batch
			const fetchPromises = batch.map(async (config) => {
				const { motionType, startOri, turns, color } = config;
				const cacheKey = this.getCacheKey(['arrow', motionType, startOri, String(turns), color]);

				try {
					// First check for embedded SVG (highest priority)
					const embeddedSvg = getEmbeddedArrowSvg(motionType, startOri, turns, color);
					if (embeddedSvg) {
						// Store in both caches for future use
						SvgManager.localCache.set(cacheKey, embeddedSvg);
						await resourceCache.set(cacheKey, embeddedSvg);
						logger.debug(`Using embedded SVG for: ${motionType} ${startOri} ${turns} (${color})`);
						return;
					}

					// Check if already in ResourceCache
					const cachedSvg = await resourceCache.get<string>(cacheKey);
					if (cachedSvg) {
						// Also update local cache for faster access
						SvgManager.localCache.set(cacheKey, cachedSvg);
						return;
					}

					// Check local cache as fallback
					if (SvgManager.localCache.has(cacheKey)) {
						// Update ResourceCache from local cache
						const localCachedSvg = SvgManager.localCache.get(cacheKey)!;
						await resourceCache.set(cacheKey, localCachedSvg);
						return;
					}

					// Create the path
					const basePath = '/images/arrows';

					// Special handling for float motion type
					let svgPath;
					if (motionType === 'float' && turns === 'fl') {
						// Float has a special path
						svgPath = `${basePath}/float.svg`;
					} else {
						// Standard path for other motion types
						const typePath = motionType.toLowerCase();
						const radialPath =
							startOri === 'out' || startOri === 'in' ? 'from_radial' : 'from_nonradial';
						const fixedTurns = (
							typeof turns === 'number' ? turns : parseFloat(turns.toString())
						).toFixed(1);
						svgPath = `${basePath}/${typePath}/${radialPath}/${motionType}_${fixedTurns}.svg`;
					}

					// Fetch the SVG - no retry logic here as fetchSvg already handles that
					const svgData = await this.fetchSvg(svgPath);

					// Use a microtask to yield to the main thread
					await Promise.resolve();

					const coloredSvg = this.applyColor(svgData, color);

					// Ensure the SVG has a centerPoint element
					const svgWithCenterPoint = this.ensureCenterPoint(coloredSvg);

					// Store in both caches
					SvgManager.localCache.set(cacheKey, svgWithCenterPoint);
					await resourceCache.set(cacheKey, svgWithCenterPoint);

					logger.debug(`Preloaded arrow SVG: ${motionType}_${turns} (${color})`);
				} catch (error) {
					// Handle errors gracefully without failing the entire batch
					logger.warn(`Preload failed for arrow: ${motionType}_${turns} (${color})`, {
						error: toAppError(error)
					});

					// Create a fallback SVG with centerPoint for the cache
					const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
						<rect width="240" height="80" fill="#cccccc" opacity="0.2" />
						<path d="M240,40C240,40,240,40,240,40c-4,4.8-28.6,32.6-38.3,39.8c-1.4,1.1-8.4,4-16.6-4.2l26.8-27.2H9c-6.1,0-9.1-4.2-9-8.3
							c0-4.3,3-8.5,9-8.5h202.6L184.9,4.4c8.2-8.2,15.2-5.3,16.6-4.2C211.2,7.3,235.8,35.2,239.8,40C239.9,39.9,239.8,39.9,240,40z"
							fill="${color === 'red' ? '#ED1C24' : '#2E3192'}" />
						<circle id="centerPoint" cx="120" cy="40" r="2" fill="red" />
					</svg>`;

					// Cache the fallback SVG in both caches
					SvgManager.localCache.set(cacheKey, fallbackSvg);
					try {
						await resourceCache.set(cacheKey, fallbackSvg, 60000); // Short TTL for fallbacks
					} catch (cacheError) {
						// Ignore cache errors for fallbacks
					}
				}
			});

			// Wait for all fetches in this batch to complete (or fail)
			await Promise.allSettled(fetchPromises);

			// Yield to the main thread between batches
			if (typeof window !== 'undefined') {
				await new Promise((resolve) => requestAnimationFrame(resolve));
			}
		}
	}
}
