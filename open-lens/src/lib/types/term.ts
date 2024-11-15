// types/term.ts

// Define the group configurations
export const ITEM_GROUPS = {
    'search term': '',
    'institution': '/i/'
} as const;

// Create a type from the keys of ITEM_GROUPS
export type ItemGroup = keyof typeof ITEM_GROUPS | null;

// Use a helper function to get the prefix
export const getGroupPrefix = (group: ItemGroup): string => {
    if (!group) return '';
    return ITEM_GROUPS[group];
};

export type TermType = 'search' | 'selected' | 'compare';

export interface Term {
    id: string;
    value: string;
    label: string;
    type: TermType;
    group: ItemGroup;
    color?: string;
}