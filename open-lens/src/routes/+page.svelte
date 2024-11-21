<script lang="ts">
	import { onMount } from 'svelte';
	import type {
		Institution,
		InstitutionsResponse,
		SortField,
		SortDirection
	} from '$lib/types/institution';
	import type { Option } from '$lib/types/option';
	import Select from '$lib/components/Select.svelte';
	import Input from '$lib/components/Input.svelte';
	import LoadingStates from '$lib/components/LoadingStates.svelte';
	import MdSearch from 'svelte-icons/md/MdSearch.svelte';
	import InstitutionCard from '$lib/components/InstitutionCard.svelte';
	import FilterBuilder from '$lib/components/FilterBuilder.svelte';

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
	let pageInput = $state('');

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

	const commonStyles = {
		minWidth: '12rem',
		height: '3rem',
		padding: '1rem',
		borderRadius: '0.5rem'
	};

	const selectStyles = {
		buttonClassName: 'min-w-48 h-12 p-4 rounded-lg leading-6',
		dropdownClassName: 'min-w-48',
		dropdownPadding: '1rem',
		dropdownOptionHeight: '3.5rem',
		dropdownTop: '-0.5rem'
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
		pageInput = String(newPage);
		fetchInstitutions();
	}

	function handlePageInput(value: string) {
		pageInput = value;
	}

	function handlePageKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			const newPage = parseInt(pageInput);
			if (!isNaN(newPage)) {
				handlePageChange(newPage);
			}
		}
	}

	onMount(fetchInstitutions);
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8 space-y-4">
		<!-- Search and Sort Controls -->
		<div class="flex flex-wrap gap-4">
			<div class="relative flex-1">
				<Input
					value={searchQuery}
					onInput={handleSearchInput}
					onKeydown={handleSearch}
					placeholder="Search institutions..."
					Icon={MdSearch}
					className="w-full"
					{...commonStyles}
				/>
			</div>
			<Select
				options={sortOptions}
				onChange={handleSort}
				defaultOption={sortOptions[0]}
				{...selectStyles}
			/>
			<Select
				options={directionOptions}
				onChange={handleDirectionChange}
				defaultOption={directionOptions[0]}
				{...selectStyles}
			/>
		</div>

		<!-- Filter Builder -->
		<FilterBuilder onChange={handleFiltersChange} />
	</div>

	<!-- Loading States -->
	<LoadingStates loadingState={{ isLoading, error }} />

	{#if !isLoading && !error}
		<!-- Institution Cards Grid -->
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each institutions as institution (institution.id)}
				<InstitutionCard {institution} />
			{/each}
		</div>

		<!-- Pagination -->
		<div class="mt-8 flex items-center justify-center gap-4">
			<button
				class="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
				disabled={currentPage === 1}
				onclick={() => handlePageChange(currentPage - 1)}
			>
				Previous
			</button>

			<div class="flex items-center gap-2">
				<Input
					value={pageInput}
					onInput={handlePageInput}
					onKeydown={handlePageKeydown}
					className="w-16 text-center"
					{...commonStyles}
				/>
				<span class="text-gray-600">
					of {Math.ceil(totalCount / perPage)}
				</span>
			</div>

			<button
				class="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
				disabled={currentPage === Math.ceil(totalCount / perPage)}
				onclick={() => handlePageChange(currentPage + 1)}
			>
				Next
			</button>
		</div>
	{/if}
</div>
