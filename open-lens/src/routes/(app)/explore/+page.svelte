<script lang="ts">
	import type { PageData } from './$types';
	import type { AxisConfig, YAxisConfig, DataPoint } from '$lib/types/chart';
	import type { Term } from '$lib/types/term';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { termStore } from '$lib/stores/termStore';
	import TermIndicator from '$lib/components/TermIndicator.svelte';
	import LineChart from '$lib/components/LineChart.svelte';
	import BarChart from '$lib/components/BarChart.svelte';
	import MdHelpOutline from 'svelte-icons/md/MdHelpOutline.svelte';
	import Select from '$lib/components/Select.svelte';

	// Types
	type MetricType = 'works' | 'citations' | 'avgCitations';
	type YearData = {
		year: number;
		works_count: number;
		cited_by_count: number;
	};

	type ChartState = {
		lineData: DataPoint[];
		averageData: DataPoint[];
		termValues: string[];
		termColors: string[];
		lineYAxisConfig: YAxisConfig;
		barYAxisConfig: YAxisConfig;
	};

	// Component state
	let { data } = $props<{ data: PageData }>();
	console.log(data);
	let terms = $state<Term[]>([]);
	let selectedTerms = $derived(terms.filter((term) => term.type === 'selected'));
	let selectedMetric = $state<MetricType>('works');

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

	// Utility functions remain the same
	const getMetricValue = (yearData: YearData | undefined, metric: MetricType): number => {
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

	// Initialize chart state
	let chartState = $state<ChartState>({
		lineData: [],
		averageData: [],
		termValues: [],
		termColors: [],
		lineYAxisConfig: { ...baseYAxisConfig, filter: (_, index) => index > 0 },
		barYAxisConfig: { ...baseYAxisConfig, filter: () => false }
	});

	$effect(() => {
		if (!selectedTerms.length || !data) {
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
			data[term.value]?.counts_by_year?.forEach((count) => yearSet.add(count.year));
		});

		// Generate line chart data
		const lineData = Array.from(yearSet)
			.sort()
			.map((year) => {
				const point: DataPoint = { year };
				selectedTerms.forEach((term) => {
					const yearData = data[term.value]?.counts_by_year?.find((c) => c.year === year);
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

		// Calculate averages for bar chart (keep original structure)
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
			termColors: selectedTerms.map((term) => term.color ?? '#000'),
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

	// Keep original popup templates
	const createLinePopup = (item: DataPoint) => `
  <div class="bg-white bg-opacity-90 text-gray-900 border border-gray-200 shadow-md p-3 min-w-48 max-w-72">
    <div class="pb-2 font-semibold">${item.year}</div>
    ${selectedTerms
			.map(
				(term) => `
    <div class="flex items-center justify-between h-4 mt-2">
      <span class="truncate">${term.value}</span>
      <span class="ml-4" style="color: ${term.color ?? '#000'}">${(item[term.value] ?? 0).toLocaleString()}</span>
    </div>
    `
			)
			.join('')}
  </div>
`;

	const createBarPopup = (item: DataPoint, series: string) => {
		const term = selectedTerms.find((term) => term.value === series);
		if (!term) return '';

		return `
    <div class="bg-white bg-opacity-90 text-gray-900 border border-gray-200 shadow-md p-3 min-w-48 max-w-72">
      <div class="pb-2 font-semibold">Average</div>
      <div class="flex items-center justify-between h-4 mt-2">
        <span class="truncate">${series}</span>
        <span class="ml-4" style="color: ${term.color ?? '#000'}">${(item[series] ?? 0).toLocaleString()}</span>
      </div>
    </div>
  `;
	};

	// Initialize term store
	onMount(() => termStore.initialize($page.url.search));
	termStore.subscribe((value) => {
		terms = value;
	});
</script>

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
				processResult: (result) => result.display_name
			}}
		/>
	</div>
	<div class="container mx-auto flex items-center justify-between px-2">
		<div class="w-full rounded-2xl bg-white p-4">
			<Select
				options={[
					{ value: 'works', label: 'Works' },
					{ value: 'citations', label: 'Citations' },
					{ value: 'avgCitations', label: 'Average Citations' }
				]}
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
					minChars: 2,
					processResult: (result) => result.display_name
				}}
				onChange={(value) => {}}
				autoFocusDropdown={false}
				buttonClassName="w-48 h-12 p-4 rounded-lg leading-6"
				dropdownClassName="max-h-64"
				dropdownWidth="24rem"
				dropdownPadding="1rem"
				dropdownOptionHeight="3.5rem"
				dropdownTop="3.2rem"
			/>
		</div>
	</div>
</div>

<div class="bg-blue-400 bg-opacity-10 py-4">
	{#if selectedTerms.length > 0}
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
						onChange={(value) => (selectedMetric = value as MetricType)}
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
		<div class="container mx-auto grid gap-8 grid-cols-12 items-center justify-between p-4">
			<div class="w-full col-span-8 rounded-2xl bg-white p-4"></div>
			<div class="w-full col-span-4 rounded-2xl bg-white p-4"></div>
		</div>
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
