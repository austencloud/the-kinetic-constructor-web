// src/lib/services/SvgPreloadingService.ts
// FIXED: Non-reactive preloading service to prevent infinite loops

import { writable, type Writable } from 'svelte/store';
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
	private status: Writable<SvgPreloadingStatus>;
	private initialized = false;
	
	// CRITICAL FIX: Cache status to avoid reactive subscriptions
	private cachedStatus: SvgPreloadingStatus = {
		isComplete: false,
		propsLoaded: false,
		arrowsLoaded: false,
		glyphsLoaded: false,
		totalAssets: 0,
		loadedAssets: 0,
		progress: 0
	};

	constructor() {
		this.status = writable<SvgPreloadingStatus>(this.cachedStatus);
		
		// CRITICAL FIX: Subscribe once and maintain cache
		this.status.subscribe((status) => {
			this.cachedStatus = { ...status };
		});
	}

	initialize() {
		if (this.initialized) return;
		this.initialized = true;

		const initialStatus = {
			isComplete: false,
			propsLoaded: false,
			arrowsLoaded: false,
			glyphsLoaded: false,
			totalAssets: 0,
			loadedAssets: 0,
			progress: 0
		};

		this.cachedStatus = initialStatus;
		this.status.set(initialStatus);
	}

	/**
	 * Get the current status store (for components that need reactive updates)
	 */
	getStatus() {
		return this.status;
	}

	/**
	 * CRITICAL FIX: Non-reactive status checks to prevent infinite loops
	 * These methods now return cached values instead of subscribing to stores
	 */
	isReady(): boolean {
		if (!browser) return false;
		return this.cachedStatus.isComplete;
	}

	arePropsReady(): boolean {
		if (!browser) return false;
		return this.cachedStatus.propsLoaded;
	}

	areArrowsReady(): boolean {
		if (!browser) return false;
		return this.cachedStatus.arrowsLoaded;
	}

	areGlyphsReady(): boolean {
		if (!browser) return false;
		return this.cachedStatus.glyphsLoaded;
	}

	/**
	 * Update methods that maintain the cache
	 */
	markPropsLoaded() {
		this.status.update((status) => {
			const newStatus = { ...status, propsLoaded: true };
			this.updateProgress(newStatus);
			return newStatus;
		});
	}

	markArrowsLoaded() {
		this.status.update((status) => {
			const newStatus = { ...status, arrowsLoaded: true };
			this.updateProgress(newStatus);
			return newStatus;
		});
	}

	markGlyphsLoaded() {
		this.status.update((status) => {
			const newStatus = { ...status, glyphsLoaded: true };
			this.updateProgress(newStatus);
			return newStatus;
		});
	}

	updateAssetCounts(total: number, loaded: number) {
		this.status.update((status) => {
			const newStatus = {
				...status,
				totalAssets: total,
				loadedAssets: loaded
			};
			this.updateProgress(newStatus);
			return newStatus;
		});
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
		const resetStatus = {
			isComplete: false,
			propsLoaded: false,
			arrowsLoaded: false,
			glyphsLoaded: false,
			totalAssets: 0,
			loadedAssets: 0,
			progress: 0
		};
		
		this.cachedStatus = resetStatus;
		this.status.set(resetStatus);
	}

	forceComplete() {
		const completeStatus = {
			isComplete: true,
			propsLoaded: true,
			arrowsLoaded: true,
			glyphsLoaded: true,
			totalAssets: 0,
			loadedAssets: 0,
			progress: 100
		};
		
		this.cachedStatus = completeStatus;
		this.status.set(completeStatus);
	}
}

export const svgPreloadingService = new SvgPreloadingService();

if (browser) {
	svgPreloadingService.initialize();
}