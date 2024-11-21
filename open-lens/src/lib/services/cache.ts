// src/lib/services/cache.ts
import type { Institution } from '$lib/types/institution';

export interface CacheOptions {
	duration: number; // Cache duration in milliseconds
	maxSize?: number; // Maximum number of items to store
}

export interface CacheEntry<T> {
	data: T;
	timestamp: number;
}

export class CacheService<T = any> {
	private cache: Map<string, CacheEntry<T>>;
	private options: Required<CacheOptions>;

	constructor(options: CacheOptions) {
		this.cache = new Map();
		this.options = {
			maxSize: 1000, // Default max size
			...options
		};
	}

	get(key: string): T | null {
		const entry = this.cache.get(key);
		if (!entry) return null;

		const now = Date.now();
		if (now - entry.timestamp > this.options.duration) {
			this.delete(key);
			return null;
		}

		return entry.data;
	}

	set(key: string, data: T): void {
		// If cache is at max size, remove oldest entry
		if (this.cache.size >= this.options.maxSize) {
			const oldestKey = this.findOldestEntry();
			if (oldestKey) this.delete(oldestKey);
		}

		this.cache.set(key, {
			data,
			timestamp: Date.now()
		});
	}

	delete(key: string): void {
		this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
	}

	has(key: string): boolean {
		return this.cache.has(key);
	}

	private findOldestEntry(): string | null {
		let oldestKey: string | null = null;
		let oldestTime = Infinity;

		for (const [key, entry] of this.cache.entries()) {
			if (entry.timestamp < oldestTime) {
				oldestTime = entry.timestamp;
				oldestKey = key;
			}
		}

		return oldestKey;
	}

	// Get all valid (non-expired) keys
	getValidKeys(): string[] {
		const now = Date.now();
		return Array.from(this.cache.entries())
			.filter(([_, entry]) => now - entry.timestamp <= this.options.duration)
			.map(([key]) => key);
	}

	// Get cache statistics
	getStats() {
		const now = Date.now();
		const validEntries = Array.from(this.cache.entries()).filter(
			([_, entry]) => now - entry.timestamp <= this.options.duration
		);

		return {
			totalEntries: this.cache.size,
			validEntries: validEntries.length,
			maxSize: this.options.maxSize,
			cacheDuration: this.options.duration
		};
	}
}
