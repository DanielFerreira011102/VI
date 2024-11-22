<script lang="ts">
	import MdAdd from 'svelte-icons/md/MdAdd.svelte';
	import MdClose from 'svelte-icons/md/MdClose.svelte';
	import Select from '$lib/components/Select.svelte';
	import Input from '$lib/components/Input.svelte';
	import type { Option } from '$lib/types/option';

	export interface FilterConfig {
		[key: string]: {
			type: 'select' | 'number' | 'boolean' | 'text' | 'date';
			operators: Option[];
			options?: Option[];
			label?: string;
			allowMultiple?: boolean;
		};
	}

	let {
		config,
		onChange = (filters: string[]) => {},
		className = ''
	} = $props<{
		config: FilterConfig;
		onChange: (filters: string[]) => void;
		className?: string;
	}>();

	let activeFilters = $state<
		Array<{
			field: string;
			operator: string;
			value: string;
			values: Option[];
		}>
	>([]);

	const filterFields: Option[] = Object.entries(config).map(([value, fieldConfig]) => ({
		value,
		label:
			fieldConfig.label ||
			value
				.split('_')
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ')
	}));

	function isFieldInUse(field: string): boolean {
		return activeFilters.some((filter) => filter.field === field);
	}

	function getAvailableFields(): Option[] {
		return filterFields.filter((field) => !isFieldInUse(field.value));
	}

	function getOperatorsForField(field: string): Option[] {
		return config[field]?.operators || [];
	}

	function getOptionsForField(field: string): Option[] | null {
		return config[field]?.options || null;
	}

	function getFilterType(field: string): string {
		return config[field]?.type || 'text';
	}

	function isMultipleAllowed(field: string): boolean {
		return config[field]?.allowMultiple || false;
	}

	function addFilter() {
		const availableFields = getAvailableFields();
		if (availableFields.length === 0) return;

		const firstField = availableFields[0].value;
		const firstOperator = getOperatorsForField(firstField)[0].value;
		activeFilters = [
			...activeFilters,
			{
				field: firstField,
				operator: firstOperator,
				value: '',
				values: []
			}
		];
	}

	function removeFilter(index: number) {
		activeFilters = activeFilters.filter((_, i) => i !== index);
		updateFilters();
	}

	function updateFilters() {
		const filters = activeFilters
			.filter((f) => f.value.trim() !== '' || f.values.length > 0)
			.map((f) => {
				if (f.values.length > 0) {
					const values = f.values.map((v) => v.value).join('|');
					return `${f.field}${f.operator}${values}`;
				}

				if (f.operator === '-' && f.value.includes(',')) {
					const [min, max] = f.value.split(',').map((v) => v.trim());
					return `${f.field}:${min}-${max}`;
				} else if (f.operator === 'lt') {
					const value = parseInt(f.value);
					return `${f.field}:<${value}`;
				} else if (f.operator === 'gt') {
					const value = parseInt(f.value);
					return `${f.field}:>${value}`;
				}

				return `${f.field}${f.operator}${f.value}`;
			});
		onChange(filters);
	}

	function handleValueChange(filter: (typeof activeFilters)[0]) {
		return (value: string) => {
			filter.value = value;
			updateFilters();
		};
	}

	function handleMultiValueChange(filter: (typeof activeFilters)[0]) {
		return (options: Option[]) => {
			filter.values = options;
			updateFilters();
		};
	}
</script>

<div class="space-y-4 rounded-lg border border-gray-200 bg-white p-4 {className}">
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-medium text-gray-900">Filters</h3>
		<button
			onclick={addFilter}
			class="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100"
			disabled={getAvailableFields().length === 0}
		>
			<div class="h-4 w-4">
				<MdAdd />
			</div>
			Add Filter
		</button>
	</div>

	<div class="space-y-4">
		{#each activeFilters as filter, index}
			<div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
					<!-- Field Select -->
					<div class="lg:col-span-3">
						<Select
							options={getAvailableFields()}
							defaultOption={filterFields.find((f) => f.value === filter.field)}
							onChange={(option) => {
								filter.field = option.value;
								filter.operator = getOperatorsForField(option.value)[0].value;
								filter.value = '';
								filter.values = [];
								updateFilters();
							}}
							buttonHeight="3rem"
							buttonPadding="1rem"
							buttonBorderRadius="0.5rem"
							buttonClassName="h-12 p-4 rounded-lg leading-6"
							dropdownClassName="w-full max-h-72"
							dropdownPadding="1rem"
							dropdownOptionHeight="3.5rem"
							dropdownTop="-0.5rem"
							wrapperClassName="block w-full"
						/>
					</div>

					<!-- Operator Select -->
					<div class="lg:col-span-3">
						<Select
							options={getOperatorsForField(filter.field)}
							defaultOption={getOperatorsForField(filter.field).find(
								(o) => o.value === filter.operator
							)}
							onChange={(option) => {
								filter.operator = option.value;
								updateFilters();
							}}
							buttonHeight="3rem"
							buttonPadding="1rem"
							buttonBorderRadius="0.5rem"
							buttonClassName="h-12 p-4 rounded-lg leading-6"
							dropdownClassName="w-full max-h-72"
							dropdownPadding="1rem"
							dropdownOptionHeight="3.5rem"
							dropdownTop="-0.5rem"
							wrapperClassName="block w-full"
						/>
					</div>

					<!-- Value Input/Select -->
					<div class="lg:col-span-5">
						{#if getFilterType(filter.field) === 'select' || getFilterType(filter.field) === 'boolean'}
							<Select
								options={getOptionsForField(filter.field) || []}
								defaultSelected={filter.values}
								isMulti={isMultipleAllowed(filter.field)}
								onChange={isMultipleAllowed(filter.field)
									? (options) => handleMultiValueChange(filter)(options as Option[])
									: (option) => handleValueChange(filter)((option as Option).value)}
								buttonHeight="3rem"
								buttonPadding="1rem"
								buttonBorderRadius="0.5rem"
								buttonClassName="h-12 p-4 rounded-lg leading-6"
								dropdownClassName="w-full max-h-72"
								dropdownPadding="1rem"
								dropdownOptionHeight="3.5rem"
								dropdownTop="-0.5rem"
								wrapperClassName="block w-full"
							/>
						{:else}
							<Input
								value={filter.value}
								onInput={handleValueChange(filter)}
								placeholder={filter.operator === '-' ? 'min,max' : 'Filter value...'}
								showClear={false}
								height="3rem"
								padding="1rem"
								borderRadius="0.5rem"
								wrapperClassName="w-full"
								inputClassName="text-base leading-6"
							/>
						{/if}
					</div>

					<!-- Remove Button -->
					<div class="flex items-center justify-end lg:col-span-1">
						<button
							onclick={() => removeFilter(index)}
							class="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
							title="Remove filter"
						>
							<div class="h-6 w-6">
								<MdClose />
							</div>
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
