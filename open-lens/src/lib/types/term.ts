export type TermType = 'search' | 'selected' | 'compare';

export type Term = {
	id: string;
	value: string;
	type: 'search' | 'selected' | 'compare';
	color: string;
	isLoading?: boolean;
	data?: any;
};
