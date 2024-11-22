// api.ts
import type { Institution } from '$lib/types/institution';
import { CacheService } from './cache';

const institutionCache = new CacheService<Institution>({
	duration: 30 * 60 * 1000,
	maxSize: 200
});

const worksCache = new CacheService<Institution['works']>({
	duration: 5 * 60 * 1000,
	maxSize: 500
});

const API_TIMEOUT = 5000;
const MAX_CONCURRENT = 3;
const MIN_DELAY = 75;
const MAX_RETRIES = 3;

class RequestScheduler {
	private queue: Promise<any> = Promise.resolve();
	private active = 0;

	async schedule<T>(fn: () => Promise<T>, priority = 0): Promise<T> {
		while (this.active >= MAX_CONCURRENT) {
			await new Promise((resolve) => setTimeout(resolve, MIN_DELAY));
		}

		this.active++;
		try {
			await new Promise((resolve) => setTimeout(resolve, priority * MIN_DELAY));
			return await this.retryWithBackoff(fn);
		} finally {
			this.active--;
		}
	}

	private async retryWithBackoff(fn: () => Promise<any>, attempt = 0): Promise<any> {
		try {
			return await fn();
		} catch (error) {
			if (error instanceof Error && error.message.includes('429') && attempt < MAX_RETRIES) {
				const delay = Math.pow(2, attempt) * MIN_DELAY;
				await new Promise((resolve) => setTimeout(resolve, delay));
				return this.retryWithBackoff(fn, attempt + 1);
			}
			throw error;
		}
	}
}

const scheduler = new RequestScheduler();

async function fetchWithTimeout(url: string): Promise<Response> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

	try {
		const response = await fetch(url, {
			signal: controller.signal,
			headers: { Accept: 'application/json' }
		});
		clearTimeout(timeoutId);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return response;
	} catch (error) {
		clearTimeout(timeoutId);
		throw error;
	}
}

export async function fetchInstitutionsParallel(
	terms: string[],
	topicId?: string
): Promise<Map<string, Institution | null>> {
	const results = new Map<string, Institution | null>();
	const cacheHits = new Set<string>();

	// Check caches first
	terms.forEach((term) => {
		const cached = institutionCache.get(term);
		if (cached) {
			results.set(term, cached);
			cacheHits.add(term);

			const id = cached.id.replace('https://openalex.org/', '');
			const worksCacheKey = `${id}-${topicId || 'all'}`;
			const cachedWorks = worksCache.get(worksCacheKey);

			if (cachedWorks) {
				results.set(term, { ...cached, works: cachedWorks });
			}
		}
	});

	// Fetch uncached institutions
	const uncachedTerms = terms.filter((term) => !cacheHits.has(term));
	if (uncachedTerms.length > 0) {
		const institutionFetches = uncachedTerms.map((term, idx) =>
			scheduler.schedule(async () => {
				const response = await fetchWithTimeout(
					`https://api.openalex.org/institutions?search=${encodeURIComponent(term)}&select=id,display_name,relevance_score,works_count,cited_by_count,summary_stats,counts_by_year,topics`
				);
				const data = await response.json();
				const institution = data.results?.[0] || null;
				if (institution) institutionCache.set(term, institution);
				results.set(term, institution);
				return { term, institution };
			}, idx)
		);

		await Promise.all(institutionFetches);
	}

	// Fetch missing works data
	const worksFetches = Array.from(results.entries())
		.filter(([_, inst]) => inst && !inst.works)
		.map(([term, institution], idx) => {
			const id = institution!.id.replace('https://openalex.org/', '');
			const worksCacheKey = `${id}-${topicId || 'all'}`;

			return scheduler.schedule(async () => {
				const response = await fetchWithTimeout(
					`https://api.openalex.org/works?filter=authorships.institutions.lineage:${id}${
						topicId && topicId !== 'allTopics' ? `,primary_topic.id:${topicId}` : ''
					}&apc_sum=true&cited_by_count_sum=true&per-page=1`
				);
				const data = await response.json();
				const works = {
					apc_list_sum_usd: data.meta.apc_list_sum_usd,
					apc_paid_sum_usd: data.meta.apc_paid_sum_usd,
					cited_by_count_sum: data.meta.cited_by_count_sum,
					count: data.meta.count
				};
				worksCache.set(worksCacheKey, works);
				results.set(term, { ...institution!, works });
			}, idx);
		});

	if (worksFetches.length > 0) {
		await Promise.all(worksFetches);
	}

	return results;
}

export async function fetchInstitutionData(
	term: string,
	topicId?: string
): Promise<Institution | null> {
	const results = await fetchInstitutionsParallel([term], topicId);
	return results.get(term) || null;
}
