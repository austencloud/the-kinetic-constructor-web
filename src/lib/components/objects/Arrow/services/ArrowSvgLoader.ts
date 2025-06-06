// src/lib/components/objects/Arrow/services/ArrowSvgLoader.ts
import type { Color, MotionType, Orientation, TKATurns } from '$lib/types/Types';
import type { ArrowSvgData } from '$lib/components/SvgManager/ArrowSvgData';
import { parseArrowSvg } from '$lib/components/SvgManager/parseArrowSvg';
import type SvgManager from '$lib/components/SvgManager/SvgManager';

/**
 * Service for loading and managing Arrow SVG data
 */
export class ArrowSvgLoader {
	constructor(private svgManager: SvgManager) {}

	/**
	 * Faster SVG parsing without regex for better performance
	 */
	private fastParseArrowSvg(svgText: string): ArrowSvgData {
		// Extract viewBox more efficiently
		const viewBoxStart = svgText.indexOf('viewBox="');
		if (viewBoxStart === -1) {
			return {
				imageSrc: '',
				viewBox: { x: 0, y: 0, width: 100, height: 100 },
				center: { x: 50, y: 50 }
			};
		}

		const viewBoxValueStart = viewBoxStart + 9; // Length of 'viewBox="'
		const viewBoxEnd = svgText.indexOf('"', viewBoxValueStart);
		const viewBoxValue = svgText.substring(viewBoxValueStart, viewBoxEnd);

		const parts = viewBoxValue.split(' ').map(Number);
		const width = parts[2] || 100;
		const height = parts[3] || 100;

		return {
			imageSrc: '',
			viewBox: {
				x: parts[0] || 0,
				y: parts[1] || 0,
				width,
				height
			},
			center: { x: width / 2, y: height / 2 }
		};
	}

	/**
	 * Optimized base64 encoding for modern browsers
	 */
	private fastBtoa(text: string): string {
		try {
			// Use TextEncoder and Uint8Array for better performance in modern browsers
			if (typeof TextEncoder !== 'undefined') {
				const encoder = new TextEncoder();
				const data = encoder.encode(text);
				return this.uint8ArrayToBase64(data);
			}
		} catch (e) {
			// Silently fall back to standard btoa
		}

		// Fallback to standard btoa
		return btoa(text);
	}

	/**
	 * Helper method to convert Uint8Array to base64
	 */
	private uint8ArrayToBase64(array: Uint8Array): string {
		let binary = '';
		const len = array.byteLength;
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode(array[i]);
		}
		return btoa(binary);
	}

	/**
	 * Loads an arrow SVG based on motion properties with optimized performance
	 */
	async loadSvg(
		motionType: MotionType,
		startOri: Orientation,
		turns: TKATurns,
		color: Color,
		mirrored: boolean = false
	): Promise<{ svgData: ArrowSvgData }> {
		// Maximum number of retries
		const maxRetries = 2;
		let retries = 0;
		let lastError: any = null;

		while (retries <= maxRetries) {
			try {
				// Fetch SVG from manager with timeout protection
				const svgTextPromise = this.svgManager.getArrowSvg(motionType, startOri, turns, color);

				// Set up a race with a timeout (increased to 8000ms for better reliability)
				const timeoutPromise = new Promise<string>((_, reject) => {
					setTimeout(() => reject(new Error('SVG fetch timeout')), 8000);
				});

				// Race the fetch against the timeout
				const svgText = await Promise.race([svgTextPromise, timeoutPromise]);

				// Quick validation (avoid regex for performance)
				if (!svgText || svgText.indexOf('<svg') === -1) {
					throw new Error('Invalid SVG content: Missing <svg> element');
				}

				// Use optimized parsing
				const originalSvgData = this.fastParseArrowSvg(svgText);

				// Check for centerPoint element and add it if missing
				const hasCenterPoint = svgText.includes('id="centerPoint"');

				// Adjust center point if mirrored
				const center = { ...originalSvgData.center };
				if (mirrored) {
					center.x = originalSvgData.viewBox.width - center.x;
				}

				// Create and return SVG data object with optimized base64 encoding
				return {
					svgData: {
						imageSrc: `data:image/svg+xml;base64,${this.fastBtoa(svgText)}`,
						viewBox: originalSvgData.viewBox,
						center
					}
				};
			} catch (error) {
				lastError = error;

				// If it's a timeout error, retry
				if (error instanceof Error && error.message === 'SVG fetch timeout') {
					retries++;

					// Log retry attempt in development
					if (import.meta.env.DEV) {
						console.warn(
							`Retrying SVG fetch (${retries}/${maxRetries}) for ${motionType}_${turns}.svg`
						);
					}

					// Wait a bit before retrying (increasing delay with each retry)
					await new Promise((resolve) => setTimeout(resolve, 300 * retries));
					continue;
				} else {
					// For other errors, don't retry
					break;
				}
			}
		}

		// If we got here, all retries failed
		// Minimal logging in production
		if (import.meta.env.DEV) {
			console.error('Arrow SVG loading error after retries:', lastError);
		} else {
			console.warn(`Failed to load arrow SVG: ${motionType}_${turns}.svg`);
		}

		// Return fallback data directly instead of re-throwing
		return { svgData: this.getFallbackSvgData(color) };
	}

	/**
	 * Returns fallback SVG data for error situations
	 * @param color Optional color for the fallback SVG
	 */
	getFallbackSvgData(color: Color = 'blue'): ArrowSvgData {
		// Create a more appropriate fallback arrow SVG with the correct color
		const fillColor = color === 'red' ? '#ED1C24' : '#2E3192';

		// Create a simple arrow shape SVG
		const svgContent = `
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
				<rect width="240" height="80" fill="#cccccc" opacity="0.2" />
				<path d="M240,40C240,40,240,40,240,40c-4,4.8-28.6,32.6-38.3,39.8c-1.4,1.1-8.4,4-16.6-4.2l26.8-27.2H9c-6.1,0-9.1-4.2-9-8.3
					c0-4.3,3-8.5,9-8.5h202.6L184.9,4.4c8.2-8.2,15.2-5.3,16.6-4.2C211.2,7.3,235.8,35.2,239.8,40C239.9,39.9,239.8,39.9,240,40z"
					fill="${fillColor}" />
				<circle id="centerPoint" cx="120" cy="40" r="2" fill="red" />
			</svg>
		`
			.trim()
			.replace(/\s+/g, ' ');

		return {
			imageSrc: `data:image/svg+xml;base64,${this.fastBtoa(svgContent)}`,
			viewBox: { x: 0, y: 0, width: 240, height: 80 },
			center: { x: 120, y: 40 }
		};
	}
}
