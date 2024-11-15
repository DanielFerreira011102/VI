<script lang="ts">
    import type { AutocompleteConfig } from '$lib/types/autocomplete';
    import type { Term } from '$lib/types/term';
    import type { Option } from '$lib/types/option';
    import MdClose from 'svelte-icons/md/MdClose.svelte';
    import Dropdown from './Dropdown.svelte';
    import { debounce } from '$lib/utils/debounce';

    const props = $props<{
        term: Term;
        wasCompare?: boolean;
        autocomplete?: AutocompleteConfig;
        onSubmit: (value: string, label: string, group: 'institution' | 'search term') => void;
        onDelete: () => void;
        onEdit?: () => void;
        onBlur: (value: string, label: string, group: 'institution' | 'search term') => void;
        onRevert: () => void;
    }>();

    let searchValue = $state(props.term.label || '');
    let inputElement = $state<HTMLInputElement | null>(null);
    let isProcessing = $state(false);
    let suggestions = $state<Option[]>([]);
    let isDropdownOpen = $state(false);
    let isFetching = $state(false);
    let dropdownRef = $state<Dropdown | null>(null);

    $effect(() => {
        inputElement?.focus();
    });

    async function fetchSuggestions(query: string) {
        if (!props.autocomplete?.enabled) {
            suggestions = [];
            return;
        }

        if (query.length < (props.autocomplete.minChars || 0) && props.autocomplete.minChars !== 0) {
            suggestions = [];
            return;
        }

        isFetching = true;
        try {
            const results = await props.autocomplete.fetchSuggestions(query);
            suggestions = results.map((result: any) => props.autocomplete!.processResult(result));
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            suggestions = [];
        } finally {
            isFetching = false;
        }
    }

    const debouncedFetch = props.autocomplete?.enabled
        ? debounce(fetchSuggestions, props.autocomplete.debounceMs || 300)
        : null;

    const handleSubmit = async (selectedOption: Option | null) => {
        if (isProcessing) return;

        isProcessing = true;
        try {
            const trimmedSearchValue = searchValue.trim();

            if (!trimmedSearchValue) {
                if (props.wasCompare) {
                    props.onRevert();
                } else if (props.term.type === 'selected') {
                    props.onDelete();
                } else {
                    searchValue = '';
                }
                return;
            }

            if (selectedOption) {
                // Institution selected from dropdown
                props.onSubmit(selectedOption.value, selectedOption.label, 'institution');
            } else {
                // Free text search
                props.onSubmit(trimmedSearchValue, trimmedSearchValue, 'search term');
            }
            isDropdownOpen = false;
        } finally {
            setTimeout(() => {
                isProcessing = false;
            }, 100);
        }
    };

    const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const selectedOption = suggestions.find(opt => opt.label === searchValue);
            handleSubmit(selectedOption);
        } else if (event.key === 'ArrowDown' && suggestions.length > 0) {
            event.preventDefault();
            isDropdownOpen = true;
            dropdownRef?.focusOption(0);
        }
    };

    const handleInput = (event: Event) => {
        const value = (event.target as HTMLInputElement).value;
        searchValue = value;

        if (debouncedFetch) {
            debouncedFetch(value);
            isDropdownOpen = true;
        } else {
            suggestions = [];
            isDropdownOpen = false;
        }
    };

    const handleBlur = (event: FocusEvent) => {
        if (isProcessing) return;

        const relatedTarget = event.relatedTarget as HTMLElement;
        if (relatedTarget?.closest('[role="listbox"]') || relatedTarget?.dataset.action === 'clear')
            return;

        if (props.wasCompare) {
            props.onRevert();
            return;
        }

        const trimmedValue = searchValue.trim();
        const selectedOption = suggestions.find(opt => opt.label === trimmedValue);

        if (!trimmedValue && props.term.type === 'selected') {
            props.onDelete();
        } else if (props.term.type === 'selected') {
            if (selectedOption) {
                props.onBlur(selectedOption.value, selectedOption.label, 'institution');
            } else {
                props.onBlur(trimmedValue, trimmedValue, 'search term');
            }
        }
    };

    const clearSearch = () => {
        searchValue = '';
        suggestions = [];
        isDropdownOpen = false;
        inputElement?.focus();
    };

    const handleSuggestionSelect = (option: Option) => {
        searchValue = option.label;
        isDropdownOpen = false;
        handleSubmit(option);
    };

    const handleDropdownClose = () => {
        isDropdownOpen = false;
    };

    $effect(() => {
        if (props.autocomplete?.enabled && props.autocomplete.minChars === 0 && searchValue) {
            fetchSuggestions(searchValue);
        }
    });
</script>

<div class="relative w-full flex-1">
    <div class="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <input
            bind:this={inputElement}
            type="search"
            value={searchValue}
            onkeydown={handleKeydown}
            oninput={handleInput}
            onblur={handleBlur}
            class="relative z-10 h-32 w-full border-none bg-inherit pl-6 pr-16 text-xl leading-6 text-gray-900 outline-none"
            placeholder="Add a search term"
        />

        {#if searchValue}
            <button
                data-action="clear"
                onclick={clearSearch}
                class="absolute right-6 top-1/2 z-20 -translate-y-1/2 text-gray-500"
                aria-label="Clear search"
            >
                <div class="h-6 w-6">
                    <MdClose />
                </div>
            </button>
        {/if}
    </div>

    <Dropdown
        bind:this={dropdownRef}
        isOpen={isDropdownOpen}
        anchor={inputElement}
        options={suggestions}
        selectedOption={{ value: props.term.value, label: searchValue }}
        onSelect={handleSuggestionSelect}
        onClose={handleDropdownClose}
        width="100%"
        padding="1.5rem"
        optionHeight="3.5rem"
        top="100%"
        className="max-h-64"
        autoFocus={false}
        {isFetching}
    />
</div>