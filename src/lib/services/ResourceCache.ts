// src/lib/services/ResourceCache.ts
import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { logger } from '$lib/core/logging';
import { toAppError } from '$lib/types/ErrorTypes';

// Define cache storage types
export enum CacheStorageType {
	MEMORY = 'memory',
	LOCAL_STORAGE = 'localStorage',
	INDEXED_DB = 'indexedDB'
}

// Define cache entry with metadata
export interface CacheEntry<T> {
	value: T;
	timestamp: number;
	expires?: number; // Optional expiration timestamp
}

// Define cache statistics
export interface CacheStats {
	totalEntries: number;
	memoryUsage: number; // Approximate memory usage in bytes
	categories: Record<string, number>; // Count by category
	storageType: CacheStorageType;
}

// Cache status store
export const cacheStatus = writable<{
	initialized: boolean;
	stats: CacheStats;
}>({
	initialized: false,
	stats: {
		totalEntries: 0,
		memoryUsage: 0,
		categories: {},
		storageType: CacheStorageType.MEMORY
	}
});

/**
 * ResourceCache Service
 *
 * Centralized service for caching application resources
 */
export class ResourceCache {
	private memoryCache: Map<string, CacheEntry<any>> = new Map();
	private storageType: CacheStorageType = CacheStorageType.MEMORY;
	private dbPromise: Promise<IDBDatabase> | null = null;
	private DB_NAME = 'kinetic-constructor-cache';
	private DB_VERSION = 1;
	private STORE_NAME = 'resources';

	constructor() {
		this.initializeCache();
	}

	/**
	 * Initialize the cache based on available storage options
	 */
	private async initializeCache(): Promise<void> {
		if (!browser) {
			// In SSR context, only use memory cache
			this.storageType = CacheStorageType.MEMORY;
			this.updateCacheStatus();
			return;
		}

		try {
			// Try to use IndexedDB if available
			if (this.isIndexedDBAvailable()) {
				this.storageType = CacheStorageType.INDEXED_DB;
				await this.initIndexedDB();
			} else if (this.isLocalStorageAvailable()) {
				// Fallback to localStorage
				this.storageType = CacheStorageType.LOCAL_STORAGE;
				this.loadFromLocalStorage();
			} else {
				// Fallback to memory-only cache
				this.storageType = CacheStorageType.MEMORY;
			}
		} catch (error) {
			logger.error('Failed to initialize cache, falling back to memory cache', {
				error: toAppError(error)
			});
			this.storageType = CacheStorageType.MEMORY;
		}

		this.updateCacheStatus();
	}

	/**
	 * Check if IndexedDB is available
	 */
	private isIndexedDBAvailable(): boolean {
		return browser && 'indexedDB' in window;
	}

	/**
	 * Check if localStorage is available
	 */
	private isLocalStorageAvailable(): boolean {
		if (!browser) return false;

		try {
			const testKey = '__cache_test__';
			localStorage.setItem(testKey, testKey);
			localStorage.removeItem(testKey);
			return true;
		} catch (e) {
			return false;
		}
	}

	/**
	 * Initialize IndexedDB
	 */
	private initIndexedDB(): Promise<void> {
		if (!this.isIndexedDBAvailable()) {
			return Promise.reject(new Error('IndexedDB is not available'));
		}

		this.dbPromise = new Promise((resolve, reject) => {
			const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

			request.onerror = (event) => {
				reject(new Error('Failed to open IndexedDB'));
			};

			request.onsuccess = (event) => {
				resolve((event.target as IDBOpenDBRequest).result);
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(this.STORE_NAME)) {
					db.createObjectStore(this.STORE_NAME, { keyPath: 'key' });
				}
			};
		});

		return this.dbPromise.then(() => {
			logger.info('IndexedDB cache initialized');
		});
	}

	/**
	 * Load cache from localStorage
	 */
	private loadFromLocalStorage(): void {
		if (!this.isLocalStorageAvailable()) return;

		try {
			const cacheData = localStorage.getItem('resource-cache');
			if (cacheData) {
				const parsed = JSON.parse(cacheData);
				Object.entries(parsed).forEach(([key, entry]) => {
					this.memoryCache.set(key, entry as CacheEntry<any>);
				});
			}
		} catch (error) {
			logger.error('Failed to load cache from localStorage', { error: toAppError(error) });
		}
	}

	/**
	 * Save cache to localStorage
	 */
	private saveToLocalStorage(): void {
		if (!this.isLocalStorageAvailable() || this.storageType !== CacheStorageType.LOCAL_STORAGE)
			return;

		try {
			const cacheObject: Record<string, CacheEntry<any>> = {};
			this.memoryCache.forEach((value, key) => {
				cacheObject[key] = value;
			});
			localStorage.setItem('resource-cache', JSON.stringify(cacheObject));
		} catch (error) {
			logger.error('Failed to save cache to localStorage', { error: toAppError(error) });
		}
	}

	/**
	 * Update cache status store
	 */
	private updateCacheStatus(): void {
		const stats: CacheStats = {
			totalEntries: this.memoryCache.size,
			memoryUsage: this.estimateMemoryUsage(),
			categories: this.getCategoryCounts(),
			storageType: this.storageType
		};

		cacheStatus.set({
			initialized: true,
			stats
		});
	}

	/**
	 * Estimate memory usage of the cache
	 */
	private estimateMemoryUsage(): number {
		let totalSize = 0;

		this.memoryCache.forEach((entry) => {
			// Estimate size of value based on type
			if (typeof entry.value === 'string') {
				totalSize += entry.value.length * 2; // Approximate size of string in bytes
			} else if (entry.value instanceof ArrayBuffer) {
				totalSize += entry.value.byteLength;
			} else if (entry.value instanceof Blob) {
				totalSize += entry.value.size;
			} else {
				// For objects, use a rough estimate
				totalSize += JSON.stringify(entry.value).length * 2;
			}
		});

		return totalSize;
	}

	/**
	 * Get counts by category
	 */
	private getCategoryCounts(): Record<string, number> {
		const categories: Record<string, number> = {};

		this.memoryCache.forEach((_, key) => {
			const category = key.split(':')[0];
			categories[category] = (categories[category] || 0) + 1;
		});

		return categories;
	}

	/**
	 * Set a value in the cache
	 */
	async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
		// Create a promise for this set operation
		const setPromise = (async () => {
			const entry: CacheEntry<T> = {
				value,
				timestamp: Date.now(),
				expires: ttlMs ? Date.now() + ttlMs : undefined
			};

			// Always update memory cache for fast access
			this.memoryCache.set(key, entry);

			// Update persistent storage based on type
			if (this.storageType === CacheStorageType.LOCAL_STORAGE) {
				this.saveToLocalStorage();
			} else if (this.storageType === CacheStorageType.INDEXED_DB) {
				await this.setInIndexedDB(key, entry);
			}

			this.updateCacheStatus();

			// Return the value so it can be used by get() if needed
			return value;
		})();

		// Register this as an in-flight request
		this.inFlightRequests.set(key, setPromise);

		try {
			// Wait for the operation to complete
			await setPromise;
		} finally {
			// Remove from in-flight requests when done
			if (this.inFlightRequests.get(key) === setPromise) {
				this.inFlightRequests.delete(key);
			}
		}
	}

	/**
	 * Set a value in IndexedDB
	 */
	private async setInIndexedDB<T>(key: string, entry: CacheEntry<T>): Promise<void> {
		if (!this.dbPromise) return;

		try {
			const db = await this.dbPromise;
			return new Promise((resolve, reject) => {
				const transaction = db.transaction([this.STORE_NAME], 'readwrite');
				const store = transaction.objectStore(this.STORE_NAME);

				const request = store.put({ key, ...entry });

				request.onsuccess = () => resolve();
				request.onerror = () => reject(new Error('Failed to store in IndexedDB'));
			});
		} catch (error) {
			logger.error(`Failed to set value in IndexedDB for key: ${key}`, {
				error: toAppError(error)
			});
		}
	}

	// Track in-flight requests to prevent duplicate fetches
	private inFlightRequests: Map<string, Promise<any>> = new Map();

	/**
	 * Get a value from the cache
	 */
	async get<T>(key: string): Promise<T | null> {
		// Check if there's an in-flight request for this key
		if (this.inFlightRequests.has(key)) {
			try {
				// Wait for the in-flight request to complete
				return (await this.inFlightRequests.get(key)) as T;
			} catch (error) {
				// If the in-flight request fails, continue with normal flow
				console.warn(`In-flight request for ${key} failed:`, error);
			}
		}

		// Check memory cache first for performance
		if (this.memoryCache.has(key)) {
			const entry = this.memoryCache.get(key) as CacheEntry<T>;

			// Check if entry has expired
			if (entry.expires && entry.expires < Date.now()) {
				this.remove(key);
				return null;
			}

			return entry.value;
		}

		// If not in memory cache, check persistent storage
		if (this.storageType === CacheStorageType.INDEXED_DB) {
			return this.getFromIndexedDB<T>(key);
		}

		return null;
	}

	/**
	 * Get a value from IndexedDB
	 */
	private async getFromIndexedDB<T>(key: string): Promise<T | null> {
		if (!this.dbPromise) return null;

		try {
			const db = await this.dbPromise;
			return new Promise((resolve, reject) => {
				const transaction = db.transaction([this.STORE_NAME], 'readonly');
				const store = transaction.objectStore(this.STORE_NAME);

				const request = store.get(key);

				request.onsuccess = () => {
					const result = request.result;
					if (!result) {
						resolve(null);
						return;
					}

					const entry = result as CacheEntry<T> & { key: string };

					// Check if entry has expired
					if (entry.expires && entry.expires < Date.now()) {
						this.remove(key);
						resolve(null);
						return;
					}

					// Update memory cache
					this.memoryCache.set(key, {
						value: entry.value,
						timestamp: entry.timestamp,
						expires: entry.expires
					});

					resolve(entry.value);
				};

				request.onerror = () => reject(new Error('Failed to get from IndexedDB'));
			});
		} catch (error) {
			logger.error(`Failed to get value from IndexedDB for key: ${key}`, {
				error: toAppError(error)
			});
			return null;
		}
	}

	/**
	 * Remove a value from the cache
	 */
	async remove(key: string): Promise<void> {
		// Remove from memory cache
		this.memoryCache.delete(key);

		// Remove from persistent storage
		if (this.storageType === CacheStorageType.LOCAL_STORAGE) {
			this.saveToLocalStorage();
		} else if (this.storageType === CacheStorageType.INDEXED_DB) {
			await this.removeFromIndexedDB(key);
		}

		this.updateCacheStatus();
	}

	/**
	 * Remove a value from IndexedDB
	 */
	private async removeFromIndexedDB(key: string): Promise<void> {
		if (!this.dbPromise) return;

		try {
			const db = await this.dbPromise;
			return new Promise((resolve, reject) => {
				const transaction = db.transaction([this.STORE_NAME], 'readwrite');
				const store = transaction.objectStore(this.STORE_NAME);

				const request = store.delete(key);

				request.onsuccess = () => resolve();
				request.onerror = () => reject(new Error('Failed to remove from IndexedDB'));
			});
		} catch (error) {
			logger.error(`Failed to remove value from IndexedDB for key: ${key}`, {
				error: toAppError(error)
			});
		}
	}

	/**
	 * Clear all entries from the cache
	 */
	async clear(): Promise<void> {
		// Clear memory cache
		this.memoryCache.clear();

		// Clear persistent storage
		if (this.storageType === CacheStorageType.LOCAL_STORAGE) {
			localStorage.removeItem('resource-cache');
		} else if (this.storageType === CacheStorageType.INDEXED_DB) {
			await this.clearIndexedDB();
		}

		this.updateCacheStatus();
	}

	/**
	 * Clear IndexedDB
	 */
	private async clearIndexedDB(): Promise<void> {
		if (!this.dbPromise) return;

		try {
			const db = await this.dbPromise;
			return new Promise((resolve, reject) => {
				const transaction = db.transaction([this.STORE_NAME], 'readwrite');
				const store = transaction.objectStore(this.STORE_NAME);

				const request = store.clear();

				request.onsuccess = () => resolve();
				request.onerror = () => reject(new Error('Failed to clear IndexedDB'));
			});
		} catch (error) {
			logger.error('Failed to clear IndexedDB', { error: toAppError(error) });
		}
	}

	/**
	 * Check if a key exists in the cache
	 */
	async has(key: string): Promise<boolean> {
		// Check memory cache first
		if (this.memoryCache.has(key)) {
			const entry = this.memoryCache.get(key);

			// Check if entry exists and has expired
			if (entry && entry.expires && entry.expires < Date.now()) {
				this.remove(key);
				return false;
			}

			return !!entry; // Return true if entry exists
		}

		// Check persistent storage
		if (this.storageType === CacheStorageType.INDEXED_DB) {
			const value = await this.getFromIndexedDB(key);
			return value !== null;
		}

		return false;
	}

	/**
	 * Get cache statistics
	 */
	getStats(): CacheStats {
		return get(cacheStatus).stats;
	}
}

// Create singleton instance
export const resourceCache = new ResourceCache();
