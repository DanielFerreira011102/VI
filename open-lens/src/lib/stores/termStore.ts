import { writable } from 'svelte/store';
import { goto } from '$app/navigation';
import type { Term } from '$lib/types/term';
import { TERM_COLORS, MAX_TERMS } from '$lib/constants/term';
import { loadingStore } from './loadingStore';

const createInitialTerm = (): Term => ({
	id: '1',
	value: '',
	type: 'search',
	color: TERM_COLORS[0],
	isLoading: false
});

function createTermStore() {
	const { subscribe, set, update } = writable<Term[]>([createInitialTerm()]);

	const fetchInstitutionData = async (term: string) => {
		try {
			const response = await fetch(
				`https://api.openalex.org/institutions?filter=display_name.search:${encodeURIComponent(term)}`
			);
			if (!response.ok) throw new Error(`API request failed for term: ${term}`);
			const data = await response.json();
			return data.results[0];
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

	return {
		subscribe,
		initialize: async (queryString: string) => {
			loadingStore.startLoading();
			try {
				const params = new URLSearchParams(queryString);
				const terms = params.get('q')?.split(',').filter(Boolean) || [];

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

				const results = await Promise.all(terms.map(fetchInstitutionData));

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
			update((terms) => {
				const updatedTerms = terms
					.filter((term) => term.type !== 'compare')
					.map((term) =>
						term.id === id ? { ...term, value, type: 'selected', isLoading: true } : term
					);
				return addCompareTerm(updatedTerms);
			});

			try {
				const data = await fetchInstitutionData(value);
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
