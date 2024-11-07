// termStore.ts
import { writable } from 'svelte/store';
import { goto } from '$app/navigation';

export type Term = {
  id: string;
  value: string;
  type: 'search' | 'selected' | 'compare';
  color?: string;
};

function createTermStore() {
  const COLORS = ['#4c8df6', '#e46962', '#f7ce52', '#1ea446', '#886cd5'];
  const MAX_TERMS = 5;
  
  const initialTerm: Term = { id: '1', value: '', type: 'search', color: COLORS[0] };
  const { subscribe, set, update } = writable<Term[]>([initialTerm]);

  const updateURL = (terms: Term[]) => {
    const selectedTerms = terms.filter(t => t.type === 'selected').map(t => t.value);
    const queryString = selectedTerms.length > 0 ? `?q=${selectedTerms.join(',')}` : '';
    goto(`/explore${queryString}`, { replaceState: true });
  };

  return {
    subscribe,
    initialize: (queryString: string) => {
      try {
        if (!queryString) {
          set([initialTerm]);
          return;
        }

        const params = new URLSearchParams(queryString);
        const terms = params.get('q')?.split(',').filter(Boolean) || [];
        
        if (terms.length === 0) {
          set([initialTerm]);
          return;
        }

        const newTerms: Term[] = terms.map((value, index) => ({
          id: String(index + 1),
          value,
          type: 'selected',
          color: COLORS[index]
        }));

        if (newTerms.length < MAX_TERMS) {
          newTerms.push({
            id: String(newTerms.length + 1),
            value: '',
            type: 'compare',
            color: COLORS[newTerms.length]
          });
        }

        set(newTerms);
      } catch (error) {
        console.error('Error initializing terms:', error);
        set([initialTerm]);
      }
    },
    convertCompareToSearch: (id: string) => {
      update((terms): Term[] => {
        const updatedTerms = terms.map(term => 
          term.id === id ? { ...term, type: 'search' as const } : term
        );
        updateURL(updatedTerms);
        return updatedTerms;
      });
    },
    updateTerm: (id: string, value: string) => {
      update((terms): Term[] => {
        let updatedTerms = terms.map(term => 
          term.id === id ? { ...term, value, type: 'selected' as const } : term
        );
        
        updatedTerms = updatedTerms.filter(term => term.type !== 'compare');
        
        if (updatedTerms.length < MAX_TERMS) {
          updatedTerms.push({ 
            id: String(updatedTerms.length + 1), 
            value: '', 
            type: 'compare',
            color: COLORS[updatedTerms.length] 
          });
        }
        
        updateURL(updatedTerms);
        return updatedTerms;
      });
    },
    setType: (id: string, type: Term['type']) => {
      update((terms): Term[] => {
        const updatedTerms = terms.map(term => 
          term.id === id ? { ...term, type } : term
        );
        updateURL(updatedTerms);
        return updatedTerms;
      });
    },
    deleteEmptyTerm: (id: string) => {
      update((terms): Term[] => {
        const remainingSelected = terms.filter(t => t.type === 'selected' && t.id !== id);
        
        if (remainingSelected.length === 0) {
          updateURL([initialTerm]);
          return [initialTerm];
        }

        const updatedTerms: Term[] = terms
          .filter(t => t.id !== id)
          .map((term, index) => ({
            ...term,
            id: String(index + 1),
            color: COLORS[index]
          }));

        if (updatedTerms.length < MAX_TERMS && !updatedTerms.some(t => t.type === 'compare')) {
          updatedTerms.push({
            id: String(updatedTerms.length + 1),
            value: '',
            type: 'compare',
            color: COLORS[updatedTerms.length]
          });
        }

        updateURL(updatedTerms);
        return updatedTerms;
      });
    },
    deleteTerm: (id: string) => {
      update((terms): Term[] => {
        const filteredTerms = terms.filter(term => term.id !== id);
        
        if (filteredTerms.length === 0 || !filteredTerms.some(t => t.type === 'selected')) {
          updateURL([initialTerm]);
          return [initialTerm];
        }

        const updatedTerms: Term[] = filteredTerms.map((term, index) => ({
          ...term,
          id: String(index + 1),
          color: COLORS[index]
        }));

        if (updatedTerms.length < MAX_TERMS && !updatedTerms.some(t => t.type === 'compare')) {
          updatedTerms.push({
            id: String(updatedTerms.length + 1),
            value: '',
            type: 'compare',
            color: COLORS[updatedTerms.length]
          });
        }

        updateURL(updatedTerms);
        return updatedTerms;
      });
    },
    resetToInitial: () => {
      set([initialTerm]);
      updateURL([initialTerm]);
    },
  };
}

export const termStore = createTermStore();