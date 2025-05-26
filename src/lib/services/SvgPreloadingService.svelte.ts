// src/lib/services/SvgPreloadingService.svelte.ts
// FIXED: Non-reactive preloading service to prevent infinite loops

import { browser } from '$app/environment';

export interface SvgPreloadingStatus {
	isComplete: boolean;
	propsLoaded: boolean;
	arrowsLoaded: boolean;
	glyphsLoaded: boolean;
	totalAssets: number;
	loadedAssets: number;
	progress: number; // 0-100
}

class SvgPreloadingService {
	private status = $state<SvgPreloadingStatus>({
		isComplete: false,
		propsLoaded: false,
		arrowsLoaded: false,
		glyphsLoaded: false,
		totalAssets: 0,
		loadedAssets: 0,
		progress: 0
	});
	private initialized = false;

	constructor() {
		// No need for subscription with runes
	}

	initialize() {
		if (this.initialized) return;
		this.initialized = true;

		this.status = {
			isComplete: false,
			propsLoaded: false,
			arrowsLoaded: false,
			glyphsLoaded: false,
			totalAssets: 0,
			loadedAssets: 0,
			progress: 0
		};
	}

	/**
	 * Get the current status (for components that need reactive updates)
	 */
	getStatus() {
		return this.status;
	}

	/**
	 * Non-reactive status checks to prevent infinite loops
	 */
	isReady(): boolean {
		if (!browser) return false;
		return this.status.isComplete;
	}

	arePropsReady(): boolean {
		if (!browser) return false;
		return this.status.propsLoaded;
	}

	areArrowsReady(): boolean {
		if (!browser) return false;
		return this.status.arrowsLoaded;
	}

	areGlyphsReady(): boolean {
		if (!browser) return false;
		return this.status.glyphsLoaded;
	}

	/**
	 * Update methods
	 */
	markPropsLoaded() {
		const newStatus = { ...this.status, propsLoaded: true };
		this.updateProgress(newStatus);
		this.status = newStatus;
	}

	markArrowsLoaded() {
		const newStatus = { ...this.status, arrowsLoaded: true };
		this.updateProgress(newStatus);
		this.status = newStatus;
	}

	markGlyphsLoaded() {
		const newStatus = { ...this.status, glyphsLoaded: true };
		this.updateProgress(newStatus);
		this.status = newStatus;
	}

	updateAssetCounts(total: number, loaded: number) {
		const newStatus = {
			...this.status,
			totalAssets: total,
			loadedAssets: loaded
		};
		this.updateProgress(newStatus);
		this.status = newStatus;
	}

	private updateProgress(status: SvgPreloadingStatus) {
		let completedCategories = 0;
		const totalCategories = 3;

		if (status.propsLoaded) completedCategories++;
		if (status.arrowsLoaded) completedCategories++;
		if (status.glyphsLoaded) completedCategories++;

		status.progress = Math.floor((completedCategories / totalCategories) * 100);
		status.isComplete = completedCategories === totalCategories;
	}

	reset() {
		this.status = {
			isComplete: false,
			propsLoaded: false,
			arrowsLoaded: false,
			glyphsLoaded: false,
			totalAssets: 0,
			loadedAssets: 0,
			progress: 0
		};
	}

	forceComplete() {
		this.status = {
			isComplete: true,
			propsLoaded: true,
			arrowsLoaded: true,
			glyphsLoaded: true,
			totalAssets: 0,
			loadedAssets: 0,
			progress: 100
		};
	}
}

export const svgPreloadingService = new SvgPreloadingService();

if (browser) {
	svgPreloadingService.initialize();
}
