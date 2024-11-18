import { writable, get } from 'svelte/store';
import { goto } from '$app/navigation';
import type { Term } from '$lib/types/term';
import { TERM_COLORS, MAX_TERMS } from '$lib/constants/term';
import { loadingStore } from './loadingStore';
import { topicStore } from './topicStore';

const createInitialTerm = (): Term => ({
	id: '1',
	value: '',
	type: 'search',
	color: TERM_COLORS[0],
	isLoading: false
});

function createTermStore() {
	const store = writable<Term[]>([createInitialTerm()]);
	const { subscribe, set, update } = store;

	const fetchInstitutionData = async (term: string, topicId?: string) => {
		try {
			// First fetch basic institution data
			const response = await fetch(
				`https://api.openalex.org/institutions?filter=display_name.search:${encodeURIComponent(term)}`
			);
			if (!response.ok) throw new Error(`API request failed for term: ${term}`);
			const data = await response.json();
			const institution = data.results[0];

			if (!institution) return null;

			// If topic is selected, fetch topic-specific data
			if (topicId && topicId !== 'allTopics') {
				const topicResponse = await fetch(
					`https://api.openalex.org/works?page=1&filter=authorships.institutions.lineage:${institution.id.replace('https://openalex.org/', '')},primary_topic.id:${topicId}`
				);
				if (!topicResponse.ok)
					throw new Error(`Topic API request failed for institution: ${institution.id}`);
				const topicData = await topicResponse.json();

				// Merge topic-specific data with institution data
				return {
					...institution,
					topic_data: {
						works_count: topicData.meta.count
						// Add any other topic-specific metrics you want to track
					}
				};
			}

			return institution;
		} catch (error) {
			console.error(`Error fetching data for ${term}:`, error);
			return null;
		}
	};

	const updateURL = (terms: Term[]) => {
		const searchParams = new URLSearchParams(window.location.search);

		const selectedTerms = terms
			.filter((t) => t.type === 'selected')
			.map((t) => t.value)
			.join(',');

		if (selectedTerms) {
			searchParams.set('q', selectedTerms);
		} else {
			searchParams.delete('q');
		}

		const newURL = `/explore${searchParams.toString() ? `?${searchParams}` : ''}`;
		goto(decodeURI(newURL), { replaceState: true });
	};

	const addCompareTerm = (terms: Term[]): Term[] =>
		terms.length < MAX_TERMS && !terms.some((t) => t.type === 'compare')
			? [
					...terms,
					{
						id: String(terms.length + 1),
						value: '',
						type: 'compare',
						color: TERM_COLORS[terms.length],
						isLoading: false
					}
				]
			: terms;

	const refreshTopicData = async (terms: Term[], topicId: string) => {
		const selectedTerms = terms.filter((t) => t.type === 'selected' && t.value);

		if (!selectedTerms.length) return terms;

		const updatedTerms = [...terms];

		for (const term of selectedTerms) {
			const index = terms.findIndex((t) => t.id === term.id);
			if (index !== -1) {
				updatedTerms[index] = { ...term, isLoading: true };
				const data = await fetchInstitutionData(term.value, topicId);
				updatedTerms[index] = { ...term, isLoading: false, data };
			}
		}

		return updatedTerms;
	};

	return {
		subscribe,
		initialize: async (queryString: string) => {
			loadingStore.startLoading();
			try {
				const params = new URLSearchParams(queryString);
				const terms = params.get('q')?.split(',').filter(Boolean) || [];
				const currentTopic = get(topicStore);

				if (!terms.length) {
					set([createInitialTerm()]);
					loadingStore.stopLoading();
					return;
				}

				const termsWithLoading = terms.map((value, index) => ({
					id: String(index + 1),
					value,
					type: 'selected' as const,
					color: TERM_COLORS[index],
					isLoading: true
				}));

				set(addCompareTerm(termsWithLoading));

				const results = await Promise.all(
					terms.map((term) => fetchInstitutionData(term, currentTopic.id))
				);

				const updatedTerms = termsWithLoading.map((term, index) => ({
					...term,
					isLoading: false,
					data: results[index]
				}));

				set(addCompareTerm(updatedTerms));
			} catch (error) {
				console.error('Error initializing terms:', error);
				set([createInitialTerm()]);
				loadingStore.setError('Failed to initialize terms');
			} finally {
				loadingStore.stopLoading();
			}
		},

		updateTerm: async (id: string, value: string) => {
			const currentTopic = get(topicStore);

			update((terms) => {
				const updatedTerms = terms
					.filter((term) => term.type !== 'compare')
					.map((term) =>
						term.id === id ? { ...term, value, type: 'selected', isLoading: true } : term
					);
				return addCompareTerm(updatedTerms);
			});

			try {
				const data = await fetchInstitutionData(value, currentTopic.id);
				update((terms) => {
					const updatedTerms = terms.map((term) =>
						term.id === id ? { ...term, isLoading: false, data } : term
					);
					updateURL(updatedTerms);
					return updatedTerms;
				});
			} catch (error) {
				console.error('Error updating term:', error);
				update((terms) =>
					terms.map((term) => (term.id === id ? { ...term, isLoading: false, data: null } : term))
				);
			}
		},

		refreshTopicData: async (topicId: string) => {
			const terms = get(store);
			const refreshedTerms = await refreshTopicData(terms, topicId);
			set(refreshedTerms);
		},

		convertCompareToSearch: (id: string) => {
			update((terms) => {
				const updatedTerms = terms.map((term) =>
					term.id === id ? { ...term, type: 'search', value: '' } : term
				);
				return updatedTerms;
			});
		},

		setType: (id: string, type: Term['type']) => {
			update((terms) => {
				const updatedTerms = terms.map((term) => (term.id === id ? { ...term, type } : term));
				updateURL(updatedTerms);
				return updatedTerms;
			});
		},

		deleteTerm: (id: string) => {
			update((terms) => {
				const filteredTerms = terms.filter((term) => term.id !== id);

				if (!filteredTerms.length || !filteredTerms.some((t) => t.type === 'selected')) {
					const initialTerm = createInitialTerm();
					updateURL([initialTerm]);
					return [initialTerm];
				}

				const normalizedTerms = filteredTerms.map((term, index) => ({
					...term,
					id: String(index + 1),
					color: TERM_COLORS[index]
				}));

				const finalTerms = addCompareTerm(normalizedTerms);
				updateURL(finalTerms);
				return finalTerms;
			});
		},

		resetToInitial: () => {
			const initialTerm = createInitialTerm();
			set([initialTerm]);
			updateURL([initialTerm]);
		}
	};
}

export const termStore = createTermStore();
