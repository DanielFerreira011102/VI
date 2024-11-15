import type { Option } from './option';

type AutocompleteConfig = {
	enabled: boolean;
	fetchSuggestions: (query: string) => Promise<Array<{ id: string; display_name: string }>>;
	debounceMs?: number;
	minChars?: number;
	processResult?: (result: any) => Option;
};

export type { AutocompleteConfig };
