import { writable, type Writable, get } from 'svelte/store';
import type { Institution } from '$lib/types/institution';

// Type for the comparison state
interface CompareState {
	institutions: Institution[];
	maxItems: number;
}

// Create the store with initial state
const createCompareStore = () => {
	const store: Writable<CompareState> = writable<CompareState>({
		institutions: [],
		maxItems: 5
	});

	return {
		subscribe: store.subscribe,

		// Add an institution to comparison
		add: (institution: Institution) => {
			store.update((state) => {
				if (state.institutions.length >= state.maxItems) return state;
				if (state.institutions.find((i) => i.id === institution.id)) return state;

				return {
					...state,
					institutions: [...state.institutions, institution]
				};
			});
		},

		// Remove an institution from comparison
		remove: (institutionId: string) => {
			store.update((state) => ({
				...state,
				institutions: state.institutions.filter((i) => i.id !== institutionId)
			}));
		},

		// Clear all institutions from comparison
		clear: () => {
			store.update((state) => ({
				...state,
				institutions: []
			}));
		},

		// Check if an institution is in the comparison list
		isComparing: (institutionId: string): boolean => {
			const state = get(store);
			return state.institutions.some((i) => i.id === institutionId);
		}
	};
};

export const compareStore = createCompareStore();
