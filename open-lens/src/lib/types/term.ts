export type TermType = 'search' | 'selected' | 'compare';

export interface Term {
    id: string;
    value: string;
    type: TermType;
    color?: string;
}