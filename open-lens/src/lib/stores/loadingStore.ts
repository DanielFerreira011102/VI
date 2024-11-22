// loadingStore.ts
import { writable } from 'svelte/store';
import type { LoadingState } from '$lib/types/loading';

const createLoadingStore = () => {
	const { subscribe, set, update } = writable<LoadingState>({
		isLoading: true,
		error: null
	});

	return {
		subscribe,
		startLoading: () => update((state) => ({ ...state, isLoading: true, error: null })),
		stopLoading: () => update((state) => ({ ...state, isLoading: false })),
		setError: (error: string) => update((state) => ({ ...state, error, isLoading: false }))
	};
};

export const loadingStore = createLoadingStore();
