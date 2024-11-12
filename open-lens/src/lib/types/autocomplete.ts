type AutocompleteConfig = {
	enabled: boolean;
	fetchSuggestions: (query: string) => Promise<Array<{ id: string; display_name: string }>>;
	debounceMs?: number;
	minChars?: number;
	processResult?: (result: { id: string; display_name: string }) => string;
};

export type { AutocompleteConfig };
