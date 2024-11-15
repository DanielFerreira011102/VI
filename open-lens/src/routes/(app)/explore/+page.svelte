<script lang="ts">
	import type { AxisConfig, YAxisConfig, DataPoint } from '$lib/types/chart';
	import type { Term } from '$lib/types/term';
	import type { Topic } from '$lib/types/topic';
	import type { LoadingState } from '$lib/types/loading';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { termStore } from '$lib/stores/termStore';
	import { topicStore } from '$lib/stores/topicStore';
	import { loadingStore } from '$lib/stores/loadingStore';
	import TermIndicator from '$lib/components/TermIndicator.svelte';
	import LineChart from '$lib/components/LineChart.svelte';
	import BarChart from '$lib/components/BarChart.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import MdHelpOutline from 'svelte-icons/md/MdHelpOutline.svelte';
	import Select from '$lib/components/Select.svelte';
	import { replaceState } from '$app/navigation';

	// Types
	type MetricType = 'works' | 'citations' | 'avgCitations';

	// Component state
	let terms = $state<Term[]>([]);
	let selectedTerms = $derived(terms.filter((term) => term.type === 'selected'));
	let selectedTopic = $state<Topic>({ id: 'allTopics', display_name: 'All Topics' });
	let selectedMetric = $state<MetricType>('works');
	let loadingState = $state<LoadingState>({ isLoading: true, error: null });

	// Chart configurations
	const xAxisConfig: AxisConfig = {
		interval: 1,
		format: (value) => value?.toString() || '',
		rotation: 0,
		fontSize: 14,
		padding: 25,
		filter: () => true,
		color: '#9e9e9e',
		showAxis: true,
		axisColor: '#9e9e9e'
	};

	const baseYAxisConfig: YAxisConfig = {
		min: 0,
		max: 120,
		interval: 30,
		rotation: 0,
		fontSize: 14,
		padding: 15,
		filter: (value, index) => index > 0,
		format: (value: number) => {
			if (value >= 1000000) {
				return (value / 1000000).toFixed(1) + 'M';
			} else if (value >= 1000) {
				return (value / 1000).toFixed(1) + 'K';
			}
			return value.toString();
		},
		gridLines: true,
		showAxis: false,
		gridLineColor: '#e0e0e0',
		color: '#bdbdbd',
		axisColor: '#9e9e9e'
	};

	// Chart state
	type ChartState = {
		lineData: DataPoint[];
		averageData: DataPoint[];
		termValues: string[];
		termColors: string[];
		lineYAxisConfig: YAxisConfig;
		barYAxisConfig: YAxisConfig;
	};

	let chartState = $state<ChartState>({
		lineData: [],
		averageData: [],
		termValues: [],
		termColors: [],
		lineYAxisConfig: { ...baseYAxisConfig, filter: (_, index) => index > 0 },
		barYAxisConfig: { ...baseYAxisConfig, filter: () => false }
	});

	// Utility functions
	const getMetricValue = (yearData: any, metric: MetricType): number => {
		if (!yearData) return 0;

		switch (metric) {
			case 'works':
				return yearData.works_count;
			case 'citations':
				return yearData.cited_by_count;
			case 'avgCitations':
				return yearData.works_count > 0 ? yearData.cited_by_count / yearData.works_count : 0;
		}
	};

	const getMetricLabel = (metric: MetricType): string => {
		switch (metric) {
			case 'works':
				return 'Works';
			case 'citations':
				return 'Citations';
			case 'avgCitations':
				return 'Average Citations per Work';
		}
	};

	// Effects
	$effect(() => {
		if (!selectedTerms.length) {
			chartState = {
				lineData: [],
				averageData: [],
				termValues: [],
				termColors: [],
				lineYAxisConfig: { ...baseYAxisConfig, filter: (_, index) => index > 0 },
				barYAxisConfig: { ...baseYAxisConfig, filter: () => false }
			};
			return;
		}

		// Collect all years from selected terms
		const yearSet = new Set<number>();
		selectedTerms.forEach((term) => {
			term.data?.counts_by_year?.forEach((count: any) => yearSet.add(count.year));
		});

		// Generate line chart data
		const lineData = Array.from(yearSet)
			.sort()
			.map((year) => {
				const point: DataPoint = { year };
				selectedTerms.forEach((term) => {
					const yearData = term.data?.counts_by_year?.find((c: any) => c.year === year);
					point[term.value] = getMetricValue(yearData, selectedMetric);
				});
				return point;
			});

		// Calculate max value for y-axis
		const maxValue = Math.max(
			...lineData.flatMap((point) =>
				Object.values(point).filter((value) => typeof value === 'number' && value !== point.year)
			),
			1
		);

		const max = Math.ceil(maxValue / 100) * 100;
		const interval = Math.ceil(max / 4);

		// Calculate averages for bar chart
		const averages: DataPoint = {
			category: 'Average',
			...Object.fromEntries(
				selectedTerms.map((term) => [
					term.value,
					Math.round(
						lineData.reduce((sum, point) => sum + (point[term.value] ?? 0), 0) / lineData.length
					)
				])
			)
		};

		// Update chart state
		chartState = {
			lineData,
			averageData: [averages],
			termValues: selectedTerms.map((term) => term.value),
			termColors: selectedTerms.map((term) => term.color),
			lineYAxisConfig: {
				...baseYAxisConfig,
				filter: (_, index) => index > 0,
				max,
				interval
			},
			barYAxisConfig: {
				...baseYAxisConfig,
				filter: () => false,
				max,
				interval
			}
		};
	});

	// Chart templates
	const createLinePopup = (item: DataPoint) => `
		<div class="relative bg-white bg-opacity-90 text-gray-900 border border-gray-200 shadow-md p-3 min-w-48 max-w-72 z-50">
			<div class="pb-2 font-semibold">${item.year}</div>
			${selectedTerms
				.map(
					(term) => `
			<div class="flex items-center justify-between h-4 mt-2">
				<span class="truncate">${term.value}</span>
				<span class="ml-4" style="color: ${term.color}">${(item[term.value] ?? 0).toLocaleString()}</span>
			</div>
			`
				)
				.join('')}
		</div>
	`;

	const createBarPopup = (item: DataPoint, series: string, seriesIndex: number) => {
		const term = selectedTerms.find(
			(term, index) => term.value === series && index === seriesIndex
		);

		if (!term) return '';

		return `
			<div class="relative bg-white bg-opacity-90 text-gray-900 border border-gray-200 shadow-md p-3 min-w-48 max-w-72 z-50">
				<div class="pb-2 font-semibold">Average</div>
				<div class="flex items-center justify-between h-4 mt-2">
					<span class="truncate">${series}</span>
					<span class="ml-4" style="color: ${term.color}">${(item[series] ?? 0).toLocaleString()}</span>
				</div>
			</div>
		`;
	};

	// Initialization
	onMount(async () => {
		await Promise.all([
			termStore.initialize($page.url.search),
			topicStore.initialize($page.url.search)
		]);
	});

	// Store subscriptions
	termStore.subscribe((value) => {
		terms = value;
	});

	topicStore.subscribe((value) => {
		selectedTopic = value;
	});

	loadingStore.subscribe((value) => {
		loadingState = value;
	});
</script>

{#if loadingState.isLoading}
	<div class="flex h-screen items-center justify-center">
		<LoadingSpinner size="lg" />
	</div>
{:else if loadingState.error}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<h2 class="text-xl font-medium text-red-600">Error</h2>
			<p class="mt-2 text-gray-600">{loadingState.error}</p>
		</div>
	</div>
{:else}
	<div class="grid space-y-4 bg-blue-500 bg-opacity-10 py-6 lg:space-y-3">
		<div class="container mx-auto flex items-center justify-between px-2">
			<TermIndicator
				autocomplete={{
					enabled: true,
					fetchSuggestions: async (query) => {
						const response = await fetch(
							`https://api.openalex.org/autocomplete/institutions?q=${encodeURIComponent(query)}`
						);
						const data = await response.json();
						return data.results || [];
					},
					debounceMs: 300,
					minChars: 2,
					processResult: (result) => ({
						value: result.display_name,
						label: result.display_name
					})
				}}
			/>
		</div>
		<div class="container mx-auto flex items-center justify-between px-2">
			<div class="w-full rounded-2xl bg-white p-4">
				<Select
					options={[{ value: 'allTopics', label: 'All Topics' }]}
					defaultOption={{ value: selectedTopic.id, label: selectedTopic.display_name }}
					autocomplete={{
						enabled: true,
						fetchSuggestions: async (query) => {
							const response = await fetch(
								`https://api.openalex.org/autocomplete/topics?q=${encodeURIComponent(query)}`
							);
							const data = await response.json();
							return data.results || [];
						},
						debounceMs: 300,
						minChars: 0,
						processResult: (result) => ({
							value: result.id.replace('https://openalex.org/', ''),
							label: result.display_name
						})
					}}
					onChange={(option) =>
						topicStore.updateTopic({ id: option.value, display_name: option.label })}
					autoFocusDropdown={true}
					buttonClassName="w-96 h-12 p-4 rounded-lg leading-6"
					dropdownClassName="max-h-72"
					dropdownWidth="32rem"
					dropdownPadding="1rem"
					dropdownOptionHeight="3.5rem"
					dropdownTop="-1rem"
				/>
			</div>
		</div>
	</div>

	<div class="bg-blue-400 bg-opacity-10 py-4">
		{#if selectedTerms.length > 0}
			{#if selectedTopic.id === 'allTopics'}
				<div class="container mx-auto flex items-center justify-between p-4">
					<div class="w-full rounded-2xl bg-white p-4">
						<div class="flex items-center justify-between p-4">
							<div class="flex items-center space-x-4">
								<h1 class="text-2xl leading-6 text-gray-900">
									{getMetricLabel(selectedMetric)} Over Time
								</h1>
								<button class="h-8 w-8 text-gray-500">
									<MdHelpOutline />
								</button>
							</div>
							<Select
								options={[
									{ value: 'works', label: 'Works' },
									{ value: 'citations', label: 'Citations' },
									{ value: 'avgCitations', label: 'Average Citations' }
								]}
								autoFocusDropdown={true}
								onChange={(option) => (selectedMetric = option.value as MetricType)}
								buttonClassName="min-w-48 h-12 p-4 rounded-lg leading-6"
								dropdownClassName="min-w-48"
								dropdownPadding="1rem"
								dropdownOptionHeight="3.5rem"
								dropdownTop="-1rem"
							/>
						</div>
						<div class="grid w-full grid-cols-12 px-4 pb-8 pt-12">
							<div class="col-span-2 h-80">
								<BarChart
									data={chartState.averageData}
									series={chartState.termValues}
									colors={chartState.termColors}
									xAxisLabel="category"
									{xAxisConfig}
									yAxisConfig={chartState.barYAxisConfig}
									popupTemplate={createBarPopup}
									margins={{ left: 30 }}
								/>
							</div>
							<div class="col-span-10 h-80">
								<LineChart
									data={chartState.lineData}
									series={chartState.termValues}
									colors={chartState.termColors}
									popupTemplate={createLinePopup}
									xAxisLabel="year"
									{xAxisConfig}
									yAxisConfig={chartState.lineYAxisConfig}
								/>
							</div>
						</div>
					</div>
				</div>
				<div class="container mx-auto grid grid-cols-12 items-center justify-between gap-8 p-4">
					<div class="col-span-8 w-full rounded-2xl bg-white p-4"></div>
					<div class="col-span-4 w-full rounded-2xl bg-white p-4"></div>
				</div>
				<div class="container mx-auto flex items-center justify-between p-4">
					<div class="w-full rounded-2xl bg-white p-4"></div>
				</div>
			{:else}
				<div class="container mx-auto flex items-center justify-between p-4">
					<div class="w-full rounded-2xl bg-white p-4"></div>
				</div>
			{/if}
		{:else}
			<div class="container mx-auto p-4">
				<div class="w-full rounded-2xl bg-white p-12 text-center">
					<h2 class="mb-2 text-xl font-medium text-gray-900">No Terms Selected</h2>
					<p class="text-gray-600">
						Use the search box above to select terms and visualize their data.
					</p>
				</div>
			</div>
		{/if}
	</div>
{/if}
