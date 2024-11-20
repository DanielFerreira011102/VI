// src/lib/services/api.ts
import type { Institution } from '$lib/types/institution';
import { institutionCache } from './cache';

const API_TIMEOUT = 5000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 500;
const MAX_CONCURRENT_REQUESTS = 3;
const RATE_LIMIT_DELAY = 500; // Reduced to 500ms

class ConcurrentRequestQueue {
	private queue: Array<{
		request: () => Promise<any>;
		resolve: (value: any) => void;
		reject: (error: any) => void;
	}> = [];
	private activeRequests = 0;

	async add<T>(request: () => Promise<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			this.queue.push({ request, resolve, reject });
			this.processQueue();
		});
	}

	private async processQueue() {
		if (this.activeRequests >= MAX_CONCURRENT_REQUESTS || this.queue.length === 0) return;

		while (this.queue.length > 0 && this.activeRequests < MAX_CONCURRENT_REQUESTS) {
			const item = this.queue.shift();
			if (!item) continue;

			this.activeRequests++;

			try {
				const result = await item.request();
				item.resolve(result);
			} catch (error) {
				item.reject(error);
			} finally {
				this.activeRequests--;
				await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
				this.processQueue();
			}
		}
	}

	// Get queue status
	getStatus() {
		return {
			queueLength: this.queue.length,
			activeRequests: this.activeRequests
		};
	}
}

const requestQueue = new ConcurrentRequestQueue();

async function fetchWithRetry(
	url: string,
	timeout: number,
	retries = MAX_RETRIES
): Promise<Response> {
	let lastError: Error | null = null;

	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			const response = await fetchWithTimeout(url, timeout);

			if (response.status === 429) {
				lastError = new Error('Rate limit exceeded');
				const retryAfter = response.headers.get('Retry-After');
				const delay = retryAfter ? parseInt(retryAfter) * 1000 : RETRY_DELAY * Math.pow(2, attempt);
				await new Promise((resolve) => setTimeout(resolve, delay));
				continue;
			}

			return response;
		} catch (error) {
			lastError = error as Error;
			if (attempt === retries) break;
			await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempt)));
		}
	}

	throw lastError || new Error('All retry attempts failed');
}

async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetch(url, {
			signal: controller.signal,
			headers: {
				Accept: 'application/json'
			}
		});
		clearTimeout(id);
		return response;
	} catch (error) {
		clearTimeout(id);
		throw error;
	}
}

export const fetchInstitutionData = async (term: string, topicId?: string): Promise<Institution | null> => {
	const cacheKey = `${term}-${topicId || 'all'}`;
	const cachedResult = institutionCache.get(cacheKey);
	if (cachedResult) {
		return cachedResult;
	}

	return requestQueue.add(async () => {
		try {
			// First request: get institution
			const institutionUrl = `https://api.openalex.org/institutions?search=${encodeURIComponent(term)}&select=id,display_name,relevance_score,works_count,cited_by_count,summary_stats,counts_by_year`;


			const institutionResponse = await fetchWithRetry(institutionUrl, API_TIMEOUT);
			if (!institutionResponse.ok) throw new Error(`API request failed for term: ${term}`);

			const institutionData = await institutionResponse.json();
			const institution = institutionData.results[0];

			if (!institution) return null;

			const id = institution.id.replace('https://openalex.org/', '');
			// Second request: get topic data
			const topicUrl = `https://api.openalex.org/works?filter=authorships.institutions.lineage:${id}${
				topicId && topicId !== 'allTopics' ? `,primary_topic.id:${topicId}` : ''
			}&apc_sum=true&cited_by_count_sum=true&per-page=1`;

			const topicResponse = await fetchWithRetry(topicUrl, API_TIMEOUT);
			if (!topicResponse.ok) {
				throw new Error(`Topic API request failed for institution: ${institution.id}`);
			}

			const topicData = await topicResponse.json();

			const result: Institution = {
				...institution,
				works: {
					apc_list_sum_usd: topicData.meta.apc_list_sum_usd,
					apc_paid_sum_usd: topicData.meta.apc_paid_sum_usd,
					cited_by_count_sum: topicData.meta.cited_by_count_sum,
					count: topicData.meta.count
				}
			};

			institutionCache.set(cacheKey, result);

			return result;
		} catch (error) {
			if (error.name === 'AbortError') {
				throw new Error(`Request timeout for term: ${term}`);
			}
			console.error(`Error fetching data for ${term}:`, error);
			return null;
		}
	});
};
