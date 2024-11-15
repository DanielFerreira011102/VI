import { writable } from 'svelte/store';
import { goto } from '$app/navigation';
import { ITEM_GROUPS, getGroupPrefix, type ItemGroup, type Term } from '$lib/types/term';
import { TERM_COLORS, MAX_TERMS } from '$lib/constants/term';

const createInitialTerm = (): Term => ({
    id: '1',
    value: '',
    label: '',
    type: 'search',
    group: null,
    color: TERM_COLORS[0]
});

function createTermStore() {
    const { subscribe, set, update } = writable<Term[]>([createInitialTerm()]);

    const updateURL = (terms: Term[]) => {
        const selectedTerms = terms
            .filter((t) => t.type === 'selected')
            .map((t) => {
                const prefix = getGroupPrefix(t.group);
                return encodeURIComponent(`${prefix}${t.value}`);
            });
        const queryString = selectedTerms.length ? `?q=${selectedTerms.join(',')}` : '';
        goto(`/explore${queryString}`, { replaceState: true });
    };

    const addCompareTerm = (terms: Term[]): Term[] => {
        if (terms.length < MAX_TERMS && !terms.some((t) => t.type === 'compare')) {
            return [
                ...terms,
                {
                    id: String(terms.length + 1),
                    value: '',
                    label: '',
                    type: 'compare',
                    group: null,
                    color: TERM_COLORS[terms.length]
                }
            ];
        }
        return terms;
    };

    const normalizeTerms = (terms: Term[]): Term[] => {
        return terms.map((term, index) => ({
            ...term,
            id: String(index + 1),
            color: TERM_COLORS[index]
        }));
    };

    return {
        subscribe,
        initialize: (queryString: string) => {
            try {
                if (!queryString) {
                    set([createInitialTerm()]);
                    return;
                }

                const params = new URLSearchParams(queryString);
                const encodedTerms = params.get('q')?.split(',').filter(Boolean) || [];

                if (!encodedTerms.length) {
                    set([createInitialTerm()]);
                    return;
                }

                const newTerms = encodedTerms.map((encoded, index) => {
                    const decodedTerm = decodeURIComponent(encoded);
                    
                    // Check each group prefix
                    for (const [group, prefix] of Object.entries(ITEM_GROUPS)) {
                        if (decodedTerm.startsWith(prefix)) {
                            const value = decodedTerm.slice(prefix.length);
                            return {
                                id: String(index + 1),
                                value,      // Just the ID/value without prefix
                                label: value, // This will be updated by the parent component
                                type: 'selected' as const,
                                group: group as ItemGroup,
                                color: TERM_COLORS[index]
                            };
                        }
                    }
                    // If no prefix matches, it's a search term
                    return {
                        id: String(index + 1),
                        value: decodedTerm,
                        label: decodedTerm,
                        type: 'selected' as const,
                        group: 'search term',
                        color: TERM_COLORS[index]
                    };
                });

                set(addCompareTerm(newTerms));
            } catch (error) {
                console.error('Error initializing terms:', error);
                set([createInitialTerm()]);
            }
        },

        updateTerm: (id: string, value: string, label: string, group: ItemGroup) => {
            update((terms) => {
                const updatedTerms = terms
                    .filter((term) => term.type !== 'compare')
                    .map((term) =>
                        term.id === id
                            ? { ...term, value, label, group, type: 'selected' }
                            : term
                    );
                const finalTerms = addCompareTerm(updatedTerms);
                updateURL(finalTerms);
                return finalTerms;
            });
        },

        setType: (id: string, type: Term['type']) => {
            update((terms) => {
                const updatedTerms = terms.map((term) => (term.id === id ? { ...term, type } : term));
                updateURL(updatedTerms);
                return updatedTerms;
            });
        },

        convertCompareToSearch: (id: string) => {
            update((terms) => {
                const updatedTerms = terms.map((term) =>
                    term.id === id ? { ...term, type: 'search', value: '', label: '', group: null } : term
                );
                return updatedTerms;
            });
        },

        deleteTerm: (id: string, shouldResetIfEmpty = false) => {
            update((terms) => {
                const filteredTerms = terms.filter((term) => term.id !== id);
                const hasSelectedTerms = filteredTerms.some((t) => t.type === 'selected');

                if (!filteredTerms.length || (!hasSelectedTerms && shouldResetIfEmpty)) {
                    const initialTerm = createInitialTerm();
                    updateURL([initialTerm]);
                    return [initialTerm];
                }

                const normalizedTerms = normalizeTerms(filteredTerms);
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