<script lang="ts">
	import { onMount } from 'svelte';
	import type {
		Institution,
		InstitutionsResponse,
		SortField,
		SortDirection
	} from '$lib/types/institution';
	import type { Option } from '$lib/types/option';
	import type { FilterConfig } from '$lib/components/FilterBuilder.svelte';
	import Select from '$lib/components/Select.svelte';
	import Input from '$lib/components/Input.svelte';
	import LoadingStates from '$lib/components/LoadingStates.svelte';
	import MdSearch from 'svelte-icons/md/MdSearch.svelte';
	import InstitutionCard from '$lib/components/InstitutionCard.svelte';
	import FilterBuilder from '$lib/components/FilterBuilder.svelte';
	import Pagination from '$lib/components/Pagination.svelte';

	let institutions = $state<Institution[]>([]);
	let totalCount = $state(0);
	let currentPage = $state(1);
	let perPage = $state(9);
	let searchQuery = $state('');
	let sortField = $state<SortField>('works_count');
	let sortDirection = $state<SortDirection>('desc');
	let filters = $state<string[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	const sortOptions: Option[] = [
		{ value: 'works_count', label: 'Works Count' },
		{ value: 'cited_by_count', label: 'Citations Count' },
		{ value: 'summary_stats.h_index', label: 'H-Index' },
		{ value: 'summary_stats.i10_index', label: 'i10 Index' },
		{ value: 'summary_stats.2yr_mean_citedness', label: '2-Year Mean Citations' }
	];

	const directionOptions: Option[] = [
		{ value: 'desc', label: 'Descending' },
		{ value: 'asc', label: 'Ascending' }
	];

	const filterConfig: FilterConfig = {
		country_code: {
			type: 'select',
			label: 'Country',
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
				{ value: 'ca', label: 'Canada' },
				{ value: 'in', label: 'India' },
				{ value: 'br', label: 'Brazil' },
				{ value: 'ru', label: 'Russia' },
				{ value: 'au', label: 'Australia' },
				{ value: 'it', label: 'Italy' },
				{ value: 'es', label: 'Spain' },
				{ value: 'mx', label: 'Mexico' },
				{ value: 'kr', label: 'South Korea' },
				{ value: 'za', label: 'South Africa' },
				{ value: 'ar', label: 'Argentina' },
				{ value: 'cl', label: 'Chile' },
				{ value: 'eg', label: 'Egypt' },
				{ value: 'ng', label: 'Nigeria' },
				{ value: 'sa', label: 'Saudi Arabia' },
				{ value: 'se', label: 'Sweden' },
				{ value: 'ch', label: 'Switzerland' },
				{ value: 'tr', label: 'Turkey' },
				{ value: 'nl', label: 'Netherlands' },
				{ value: 'pt', label: 'Portugal' },
				{ value: 'be', label: 'Belgium' },
				{ value: 'dk', label: 'Denmark' },
				{ value: 'fi', label: 'Finland' },
				{ value: 'ie', label: 'Ireland' },
				{ value: 'no', label: 'Norway' },
				{ value: 'nz', label: 'New Zealand' },
				{ value: 'pl', label: 'Poland' },
				{ value: 'sg', label: 'Singapore' },
				{ value: 'at', label: 'Austria' },
				{ value: 'gr', label: 'Greece' },
				{ value: 'il', label: 'Israel' },
				{ value: 'ua', label: 'Ukraine' },
				{ value: 'vn', label: 'Vietnam' },
				{ value: 'th', label: 'Thailand' }
			],
			allowMultiple: true
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
			],
			allowMultiple: true
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
				{ value: 'lt', label: 'less than' },
				{ value: 'gt', label: 'greater than' },
				{ value: '-', label: 'between' }
			]
		},
		is_global_south: {
			type: 'boolean',
			operators: [{ value: ':', label: 'is' }],
			options: [
				{ value: 'true', label: 'Yes' },
				{ value: 'false', label: 'No' }
			]
		}
	};

	async function fetchInstitutions() {
		isLoading = true;
		error = null;

		try {
			const searchParams = new URLSearchParams({
				page: currentPage.toString(),
				per_page: perPage.toString(),
				sort: `${sortField}:${sortDirection}`
			});

			if (searchQuery) {
				searchParams.append('search', searchQuery);
			}

			if (filters.length > 0) {
				searchParams.append('filter', filters.join(','));
			}

			const response = await fetch(`https://api.openalex.org/institutions?${searchParams}`);
			if (!response.ok) throw new Error('Failed to fetch institutions');

			const data: InstitutionsResponse = await response.json();
			institutions = data.results;
			totalCount = data.meta.count;
		} catch (e) {
			error = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			isLoading = false;
		}
	}

	function handleSort(option: Option) {
		sortField = option.value as SortField;
		currentPage = 1;
		fetchInstitutions();
	}

	function handleDirectionChange(option: Option) {
		sortDirection = option.value as SortDirection;
		currentPage = 1;
		fetchInstitutions();
	}

	function handleSearch(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			currentPage = 1;
			fetchInstitutions();
		}
	}

	function handleSearchInput(value: string) {
		searchQuery = value;
	}

	function handleFiltersChange(newFilters: string[]) {
		filters = newFilters;
		currentPage = 1;
		fetchInstitutions();
	}

	function handlePageChange(newPage: number) {
		if (newPage < 1 || newPage > Math.ceil(totalCount / perPage)) return;
		currentPage = newPage;
		fetchInstitutions();
	}

	onMount(fetchInstitutions);
</script>

<!-- Main container with responsive padding -->
<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-8 space-y-4">
		<!-- Search and Sort Controls -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-12">
			<!-- Search input takes full width on mobile, 6 columns on desktop -->
			<div class="sm:col-span-6">
				<Input
					value={searchQuery}
					onInput={handleSearchInput}
					onKeydown={handleSearch}
					placeholder="Search institutions..."
					Icon={MdSearch}
					height="3rem"
					padding="1rem"
					borderRadius="0.5rem"
					wrapperClassName="w-full"
					inputClassName="text-base leading-6"
				/>
			</div>

			<!-- Sort controls take full width on mobile, 6 columns on desktop -->
			<div class="grid gap-4 sm:col-span-6 sm:grid-cols-2">
				<Select
					options={sortOptions}
					onChange={handleSort}
					defaultOption={sortOptions[0]}
					buttonClassName="w-full h-12 p-4 rounded-lg leading-6"
					dropdownClassName="w-full max-h-96"
					dropdownPadding="1rem"
					dropdownOptionHeight="3.5rem"
					dropdownTop="-0.5rem"
				/>
				<Select
					options={directionOptions}
					onChange={handleDirectionChange}
					defaultOption={directionOptions[0]}
					buttonClassName="w-full h-12 p-4 rounded-lg leading-6"
					dropdownClassName="w-full max-h-96"
					dropdownPadding="1rem"
					dropdownOptionHeight="3.5rem"
					dropdownTop="-0.5rem"
				/>
			</div>
		</div>

		<!-- Filter Builder -->
		<FilterBuilder config={filterConfig} onChange={handleFiltersChange} />
	</div>

	<!-- Loading States -->
	<LoadingStates loadingState={{ isLoading, error }} fullScreen={true} />

	{#if !isLoading && !error}
		<!-- Responsive grid for institution cards -->
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each institutions as institution (institution.id)}
				<InstitutionCard {institution} />
			{/each}
		</div>

		<!-- Pagination -->
		<Pagination
			{currentPage}
			totalPages={Math.ceil(totalCount / perPage)}
			onPageChange={handlePageChange}
			disabled={isLoading}
			showFirstLast={true}
			className="mt-8"
		/>
	{/if}
</div>
