// src/lib/components/SvgManager/SvgManager.ts
import {
	PropType,
	type Color,
	type MotionType,
	type Orientation,
	type TKATurns
} from '$lib/types/Types';

/**
 * Enhanced SvgManager that doesn't depend on svgPreloader
 */
export default class SvgManager {
	/**
	 * Cache for SVG content by key to avoid duplicate network requests
	 */
	private static readonly cache: Map<string, string> = new Map();

	/**
	 * Get a unique key for caching SVG content
	 */
	private getCacheKey(parts: string[]): string {
		return parts.join(':');
	}

	/**
	 * Fetch SVG content with error handling and timeout
	 */
	private async fetchSvg(path: string): Promise<string> {
		try {
			if (typeof window === 'undefined') {
				throw new Error('Cannot fetch SVG in SSR context');
			}

			// Use AbortController for timeout control - increased timeout to 5000ms
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000);

			// Add retry logic for network issues
			let retries = 2;
			let response;

			while (retries >= 0) {
				try {
					response = await fetch(path, {
						signal: controller.signal,
						// Add cache control headers
						headers: {
							'Cache-Control': 'max-age=3600'
						}
					});
					break; // If successful, exit the retry loop
				} catch (fetchError) {
					if (retries === 0) throw fetchError;
					retries--;
					// Wait a bit before retrying
					await new Promise((resolve) => setTimeout(resolve, 300));
				}
			}

			clearTimeout(timeoutId);

			if (!response || !response.ok) {
				throw new Error(`Failed to fetch SVG: ${path} (${response?.status || 'unknown'})`);
			}

			return response.text();
		} catch (error) {
			// Handle AbortError specifically
			if (error instanceof DOMException && error.name === 'AbortError') {
				console.warn(`SVG fetch timeout for ${path} - request took too long`);
				// Return a simple fallback SVG
				return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
					<rect width="100" height="100" fill="#cccccc" />
					<text x="10" y="50" fill="#666666">Timeout</text>
					<circle id="centerPoint" cx="50" cy="50" r="2" fill="red" />
				</svg>`;
			}

			// Minimal logging in production
			if (import.meta.env.DEV) {
				console.error(`SVG fetch error for ${path}:`, error);
			} else {
				console.error(`SVG fetch error for ${path}`);
			}
			throw error;
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

		// Check local cache first
		if (SvgManager.cache.has(cacheKey)) {
			return SvgManager.cache.get(cacheKey)!;
		}

		try {
			// Fallback to direct fetch - use the correct path with static prefix
			const path = `/images/props/${propType}.svg`;
			const baseSvg = await this.fetchSvg(path);

			// Apply color transformation if needed
			const coloredSvg = propType === PropType.HAND ? baseSvg : this.applyColor(baseSvg, color);

			// Ensure the SVG has a centerPoint element
			const svgWithCenterPoint = this.ensureCenterPoint(coloredSvg);

			// Cache for future use
			SvgManager.cache.set(cacheKey, svgWithCenterPoint);
			return svgWithCenterPoint;
		} catch (error) {
			console.error('Error fetching prop SVG:', error);
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

		// Check local cache first
		if (SvgManager.cache.has(cacheKey)) {
			return SvgManager.cache.get(cacheKey)!;
		}

		try {
			// Fallback to direct fetch
			const basePath = '/images/arrows';
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

			// Cache for future use
			SvgManager.cache.set(cacheKey, svgWithCenterPoint);
			return svgWithCenterPoint;
		} catch (error) {
			// Check if it's a specific error we can handle
			if (error instanceof DOMException && error.name === 'AbortError') {
				console.warn(`Arrow SVG fetch timeout: ${motionType}_${turns}.svg`);
			} else {
				console.error('Error fetching arrow SVG:', error);
			}

			// Return a fallback SVG with centerPoint
			return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
				<rect width="240" height="80" fill="#cccccc" opacity="0.2" />
				<path d="M240,40C240,40,240,40,240,40c-4,4.8-28.6,32.6-38.3,39.8c-1.4,1.1-8.4,4-16.6-4.2l26.8-27.2H9c-6.1,0-9.1-4.2-9-8.3
					c0-4.3,3-8.5,9-8.5h202.6L184.9,4.4c8.2-8.2,15.2-5.3,16.6-4.2C211.2,7.3,235.8,35.2,239.8,40C239.9,39.9,239.8,39.9,240,40z"
					fill="${color === 'red' ? '#ED1C24' : '#2E3192'}" />
				<circle id="centerPoint" cx="120" cy="40" r="2" fill="red" />
			</svg>`;
		}
	}

	/**
	 * Clear the SVG cache (useful for testing or when memory needs to be reclaimed)
	 */
	public static clearCache(): void {
		SvgManager.cache.clear();
	}

	/**
	 * Get stats about the cache
	 */
	public static getCacheStats(): { size: number } {
		return {
			size: SvgManager.cache.size
		};
	}

	/**
	 * Preload multiple arrow SVGs in parallel for better performance
	 */
	public async preloadArrowSvgs(
		arrowConfigs: Array<{
			motionType: MotionType;
			startOri: Orientation;
			turns: TKATurns;
			color: Color;
		}>
	): Promise<void> {
		// Create an array of promises for all SVGs
		const fetchPromises = arrowConfigs.map(async (config) => {
			const { motionType, startOri, turns, color } = config;
			const cacheKey = this.getCacheKey(['arrow', motionType, startOri, String(turns), color]);

			// Skip if already cached
			if (SvgManager.cache.has(cacheKey)) {
				return Promise.resolve();
			}

			// Create the path
			const basePath = '/images/arrows';
			const typePath = motionType.toLowerCase();
			const radialPath = startOri === 'out' || startOri === 'in' ? 'from_radial' : 'from_nonradial';
			const fixedTurns = (typeof turns === 'number' ? turns : parseFloat(turns.toString())).toFixed(
				1
			);
			const svgPath = `${basePath}/${typePath}/${radialPath}/${motionType}_${fixedTurns}.svg`;

			try {
				// Fetch the SVG with retry logic
				const svgData = await this.fetchSvg(svgPath);
				const coloredSvg = this.applyColor(svgData, color);

				// Ensure the SVG has a centerPoint element
				const svgWithCenterPoint = this.ensureCenterPoint(coloredSvg);

				// Cache the processed SVG
				SvgManager.cache.set(cacheKey, svgWithCenterPoint);
			} catch (error) {
				// Handle errors gracefully without failing the entire batch
				if (error instanceof DOMException && error.name === 'AbortError') {
					console.warn(`Preload timeout for ${svgPath}`);
				} else if (import.meta.env.DEV) {
					console.warn(`Preload failed for ${svgPath}:`, error);
				}

				// Create a fallback SVG with centerPoint for the cache
				const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
					<rect width="240" height="80" fill="#cccccc" opacity="0.2" />
					<path d="M240,40C240,40,240,40,240,40c-4,4.8-28.6,32.6-38.3,39.8c-1.4,1.1-8.4,4-16.6-4.2l26.8-27.2H9c-6.1,0-9.1-4.2-9-8.3
						c0-4.3,3-8.5,9-8.5h202.6L184.9,4.4c8.2-8.2,15.2-5.3,16.6-4.2C211.2,7.3,235.8,35.2,239.8,40C239.9,39.9,239.8,39.9,240,40z"
						fill="${color === 'red' ? '#ED1C24' : '#2E3192'}" />
					<circle id="centerPoint" cx="120" cy="40" r="2" fill="red" />
				</svg>`;

				// Cache the fallback SVG
				SvgManager.cache.set(cacheKey, fallbackSvg);
			}
		});

		// Wait for all fetches to complete (or fail)
		await Promise.allSettled(fetchPromises);
	}
}
