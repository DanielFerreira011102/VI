<script lang="ts">
    import MdAdd from 'svelte-icons/md/MdAdd.svelte';
    import MdClose from 'svelte-icons/md/MdClose.svelte';
    import Select from '$lib/components/Select.svelte';
    import Input from '$lib/components/Input.svelte';
    import type { Option } from '$lib/types/option';

    let { onChange } = $props<{
        onChange: (filters: string[]) => void;
    }>();

    let activeFilters = $state<Array<{ field: string; operator: string; value: string }>>([]);

    // Define filter types and their specific configurations
    const filterConfig = {
        country_code: {
            type: 'select',
            operators: [
                { value: ':', label: 'is' },
                { value: '!:', label: 'is not' }
            ],
            options: [
                { value: 'us', label: 'United States' },
                { value: 'gb', label: 'United Kingdom' },
                { value: 'de', label: 'Germany' },
                { value: 'cn', label: 'China' },
                { value: 'jp', label: 'Japan' },
                { value: 'fr', label: 'France' },
                { value: 'ca', label: 'Canada' }
            ]
        },
        type: {
            type: 'select',
            operators: [
                { value: ':', label: 'is' },
                { value: '!:', label: 'is not' }
            ],
            options: [
                { value: 'education', label: 'Education' },
                { value: 'healthcare', label: 'Healthcare' },
                { value: 'company', label: 'Company' },
                { value: 'nonprofit', label: 'Non-profit' },
                { value: 'government', label: 'Government' },
                { value: 'facility', label: 'Facility' },
                { value: 'archive', label: 'Archive' }
            ]
        },
        works_count: {
            type: 'number',
            operators: [
                { value: ':', label: 'equals' },
                { value: 'lt', label: 'less than' },
                { value: 'gt', label: 'greater than' },
                { value: '-', label: 'between' }
            ]
        },
        cited_by_count: {
            type: 'number',
            operators: [
                { value: ':', label: 'equals' },
                { value: 'lt', label: 'less than (exclusive)' },
                { value: 'gt', label: 'greater than (exclusive)' },
                { value: '-', label: 'between (inclusive)' }
            ]
        },
        is_global_south: {
            type: 'boolean',
            operators: [
                { value: ':', label: 'is' }
            ],
            options: [
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' }
            ]
        },
        continent: {
            type: 'select',
            operators: [
                { value: ':', label: 'is' },
                { value: '!:', label: 'is not' }
            ],
            options: [
                { value: 'north_america', label: 'North America' },
                { value: 'south_america', label: 'South America' },
                { value: 'europe', label: 'Europe' },
                { value: 'asia', label: 'Asia' },
                { value: 'africa', label: 'Africa' },
                { value: 'oceania', label: 'Oceania' }
            ]
        },
        has_ror: {
            type: 'boolean',
            operators: [
                { value: ':', label: 'is' }
            ],
            options: [
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' }
            ]
        }
    };

    const filterFields: Option[] = Object.entries(filterConfig).map(([value, config]) => ({
        value,
        label: value
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }));

    const commonStyles = {
        minWidth: "12rem",
        height: "3rem",
        padding: "1rem",
        borderRadius: "0.5rem"
    };

    const selectStyles = {
        buttonClassName: "min-w-72 h-12 p-4 rounded-lg leading-6",
        dropdownClassName: "min-w-72 max-h-112",
        dropdownPadding: "1rem",
        dropdownOptionHeight: "3.5rem",
        dropdownTop: "-0.5rem"
    };

    const valueSelectStyles = {
        ...selectStyles,
        buttonClassName: "min-w-72 h-12 p-4 rounded-lg leading-6",
        dropdownClassName: "min-w-72 max-h-112"
    };

    function getOperatorsForField(field: string): Option[] {
        return filterConfig[field]?.operators || [];
    }

    function getOptionsForField(field: string): Option[] | null {
        return filterConfig[field]?.options || null;
    }

    function getFilterType(field: string): string {
        return filterConfig[field]?.type || 'text';
    }

    function addFilter() {
        const firstField = filterFields[0].value;
        const firstOperator = getOperatorsForField(firstField)[0].value;
        activeFilters = [...activeFilters, { 
            field: firstField, 
            operator: firstOperator, 
            value: '' 
        }];
    }

    function removeFilter(index: number) {
        activeFilters = activeFilters.filter((_, i) => i !== index);
        updateFilters();
    }

    function updateFilters() {
        const filters = activeFilters
            .filter(f => f.value.trim() !== '')
            .map(f => {
                if (f.operator === '-' && f.value.includes(',')) {
                    // Handle inclusive range filter (min,max)
                    const [min, max] = f.value.split(',').map(v => v.trim());
                    return `${f.field}:${min}-${max}`;
                } else if (f.operator === 'lt') {
                    // Handle exclusive less than
                    const value = parseInt(f.value);
                    // Subtract 1 to make it exclusive
                    return `${f.field}:-${value - 1}`;
                } else if (f.operator === 'gt') {
                    // Handle exclusive greater than
                    const value = parseInt(f.value);
                    // Add 1 to make it exclusive
                    return `${f.field}:${value + 1}-`;
                }
                return `${f.field}${f.operator}${f.value}`;
            });
        onChange(filters);
    }

    function handleValueChange(filter: { field: string; operator: string; value: string }) {
        return (value: string) => {
            filter.value = value;
            updateFilters();
        };
    }
</script>

<div class="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
    <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900">Filters</h3>
        <button
            onclick={addFilter}
            class="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100"
        >
            <div class="h-4 w-4">
                <MdAdd />
            </div>
            Add Filter
        </button>
    </div>

    <div class="space-y-3">
        {#each activeFilters as filter, index}
            <div class="flex items-center gap-3">
                <Select
                    options={filterFields}
                    defaultOption={filterFields.find(f => f.value === filter.field)}
                    onChange={(option) => {
                        filter.field = option.value;
                        filter.operator = getOperatorsForField(option.value)[0].value;
                        filter.value = '';
                        updateFilters();
                    }}
                    {...selectStyles}
                />
                
                <Select
                    options={getOperatorsForField(filter.field)}
                    defaultOption={getOperatorsForField(filter.field).find(o => o.value === filter.operator)}
                    onChange={(option) => {
                        filter.operator = option.value;
                        updateFilters();
                    }}
                    {...selectStyles}
                />

                {#if getFilterType(filter.field) === 'select'}
                    <Select
                        options={getOptionsForField(filter.field) || []}
                        defaultOption={getOptionsForField(filter.field)?.find(o => o.value === filter.value)}
                        onChange={(option) => handleValueChange(filter)(option.value)}
                        {...valueSelectStyles}
                    />
                {:else if getFilterType(filter.field) === 'boolean'}
                    <Select
                        options={getOptionsForField(filter.field) || []}
                        defaultOption={getOptionsForField(filter.field)?.find(o => o.value === filter.value)}
                        onChange={(option) => handleValueChange(filter)(option.value)}
                        {...valueSelectStyles}
                    />
                {:else if filter.operator === '-'}
                    <Input
                        value={filter.value}
                        onInput={handleValueChange(filter)}
                        placeholder="min,max"
                        className="flex-1"
                        {...commonStyles}
                    />
                {:else}
                    <Input
                        value={filter.value}
                        onInput={handleValueChange(filter)}
                        placeholder="Filter value..."
                        className="flex-1"
                        {...commonStyles}
                    />
                {/if}

                <button
                    onclick={() => removeFilter(index)}
                    class="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                    <div class="h-5 w-5">
                        <MdClose />
                    </div>
                </button>
            </div>
        {/each}
    </div>
</div>