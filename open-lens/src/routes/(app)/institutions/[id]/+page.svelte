<script lang="ts">
	import Select from '$lib/components/Select.svelte';
	import BarChart from '$lib/components/BarChart.svelte';
	import PieChart from '$lib/components/PieChart.svelte';
	import LineChart from '$lib/components/LineChart.svelte';
	import type { PageData } from './$types';
	import MdHelpOutline from 'svelte-icons/md/MdHelpOutline.svelte';

	// Props
	let { data }: { data: PageData } = $props();

	// Types
	type MetricType = 'works' | 'citations' | 'avgCitations';
	let selectedMetric = $state<MetricType>('works');

	// Chart configurations
	const chartConfigs = {
		bar: {
			xAxis: {
				interval: 1,
				format: (value: any) => value?.toString() || '',
				rotation: 0,
				fontSize: 14,
				padding: 25,
				filter: () => true,
				color: '#9e9e9e',
				showAxis: true,
				axisColor: '#9e9e9e'
			},
			yAxis: {
				min: 0,
				max: 100,
				interval: 20,
				rotation: 0,
				fontSize: 14,
				padding: 15,
				filter: (value: any, index: number) => index > 0,
				format: (value: number) => {
					if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
					if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
					if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
					return value.toString();
				},
				gridLines: true,
				gridLineColor: '#e0e0e0',
				color: '#bdbdbd',
				showAxis: false,
				axisColor: '#9e9e9e'
			},
			series: {
				barWidth: 0.8,
				barSpacing: 0.05,
				showHoverEffects: true,
				hoverStyle: {
					borderWidth: 2,
					borderOpacity: 0.15
				}
			}
		}
	};

	type InstitutionChartState = {
		yearly: {
			data: any[];
			yAxis: typeof chartConfigs.bar.yAxis;
			series: {
				values: string[];
				color: string;
			};
		};
	};

	// Initialize chart state
	let chartState = $state<InstitutionChartState>({
		yearly: {
			data: [],
			yAxis: chartConfigs.bar.yAxis,
			series: {
				values: [],
				color: '#FFC107'
			}
		}
	});

	// Utility functions
	const getMetricValue = (yearData: any, metric: MetricType): number => {
		if (!yearData) return 0;

		switch (metric) {
			case 'works':
				return yearData.works_count || 0;
			case 'citations':
				return yearData.cited_by_count || 0;
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

	// Data transformers
	const transformers = {
		yearly: (rawData: any[], metric: MetricType) => {
			return rawData.map((yearData) => ({
				year: yearData.year,
				[metric]: getMetricValue(yearData, metric)
			}));
		},
		pie: {
			openAccess: (data: any) => {
				return data.openAccessDivision.group_by.map((item: any) => ({
					label: item.key === 'true' ? 'Open' : 'Restrict',
					value: item.count
				}));
			},
			funders: (data: any) => {
				// You can add funders transformation logic here when needed
				return data.openAccessDivision.group_by.map((item: any) => ({
					label: item.key === 'true' ? 'Open' : 'Restrict',
					value: item.count
				}));
			}
		}
	};

	// Templates
	const templates = {
		yearly: (item: any) => `
			<div class="relative bg-white bg-opacity-90 text-gray-900 border border-gray-200 shadow-md p-3 min-w-48 max-w-72 z-50">
				<div class="pb-2 font-semibold">Year ${item.year}</div>
				<div class="flex items-center justify-between h-4 mt-2">
					<span class="truncate">${getMetricLabel(selectedMetric)}</span>
					<span class="ml-4" style="color: ${chartState.yearly.series.color}">
						${
							selectedMetric === 'avgCitations'
								? item[selectedMetric].toFixed(1)
								: item[selectedMetric].toLocaleString()
						}
					</span>
				</div>
			</div>
		`,
		pie: (item: any) => `
			<div class="bg-white shadow-lg rounded p-2">
				<div class="font-bold">${item.label}</div>
				<div>value: ${item.value}</div>
			</div>
		`
	};

	// Effect to update chart data
	$effect(() => {
		if (!data.yearlyWorkOutput) {
			chartState = {
				yearly: {
					data: [],
					yAxis: chartConfigs.bar.yAxis,
					series: {
						values: [],
						color: '#FFC107'
					}
				}
			};
			return;
		}

		// Transform data using the transformer
		const yearlyData = transformers.yearly(data.yearlyWorkOutput, selectedMetric);

		// Calculate max value based on selected metric
		const maxValue = Math.max(...yearlyData.map((item) => item[selectedMetric]), 1);

		// Calculate y-axis configurations
		let max: number;
		let interval: number;

		if (selectedMetric === 'avgCitations') {
			max = Math.ceil(maxValue);
			interval = Math.ceil(max / 4);
		} else {
			const maxOrder = Math.floor(Math.log10(maxValue)) - 1;
			max = Math.ceil(maxValue / 10 ** maxOrder) * 10 ** maxOrder;
			interval = Math.ceil(max / 4);
		}

		// Update chart state
		chartState = {
			yearly: {
				data: yearlyData,
				yAxis: {
					...chartConfigs.bar.yAxis,
					max,
					interval
				},
				series: {
					values: [selectedMetric],
					color: '#FFC107'
				}
			}
		};
	});
</script>

<div class="container mx-auto flex flex-col gap-y-8 p-8">
	<!-- Header section -->
	<div class="flex h-min w-full items-center justify-evenly">
		<div class="w-1/4">
			<img class="h-full w-full object-cover" src={data.info.image_url} alt="University logo" />
		</div>
		<div class="flex w-3/4 flex-wrap items-center justify-center">
			<div class="rounded-md border border-slate-200 p-2">
				<h1>{data.info.display_name}</h1>
			</div>
			<div class="rounded-md border border-slate-200 p-2">
				<h1>Homepage Url: {data.info.homepage_url}</h1>
			</div>
			<div class="rounded-md border border-slate-200 p-2">
				<h1>Acronym: {data.info.display_name_acronyms}</h1>
			</div>
			<div class="rounded-md border border-slate-200 p-2">
				<h1>Country Code: {data.info.country_code}</h1>
			</div>
		</div>
	</div>

	<!-- Stats section -->
	<div class="flex w-full items-center justify-between">
		<!-- Works count -->
		<div class="flex w-1/5 flex-col gap-y-2 rounded bg-slate-100 p-6 shadow-md">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-medium">Number of Works</h3>
				<button class="h-8 w-8 text-gray-500">
					<MdHelpOutline />
				</button>
			</div>
			<h3 class="text-3xl font-medium">{data.info.works_count}</h3>
		</div>

		<!-- Citations count -->
		<div class="flex w-1/5 flex-col gap-y-2 rounded bg-slate-100 p-6 shadow-md">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-medium">Number of Citations</h3>
				<button class="h-8 w-8 text-gray-500">
					<MdHelpOutline />
				</button>
			</div>
			<h3 class="text-3xl font-medium">{data.info.cited_by_count}</h3>
		</div>

		<!-- Open Access -->
		<div class="flex w-1/5 flex-col gap-y-2 rounded bg-slate-100 p-6 shadow-md">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-medium">Open Access Works</h3>
				<button class="h-8 w-8 text-gray-500">
					<MdHelpOutline />
				</button>
			</div>
			<div>
				<PieChart
					data={transformers.pie.openAccess(data)}
					colors={['#4ecdc4', '#ff6b6b']}
					popupTemplate={templates.pie}
					seriesConfig={{
						innerRadius: 0.6,
						padAngle: 0.02,
						cornerRadius: 0,
						showHoverEffects: true,
						hoverStyle: {
							borderWidth: 2,
							borderOpacity: 0.15
						}
					}}
				/>
			</div>
		</div>

		<!-- Funders -->
		<div class="flex w-1/5 flex-col gap-y-2 rounded bg-slate-100 p-6 shadow-md">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-medium">Funders Distribution</h3>
				<button class="h-8 w-8 text-gray-500">
					<MdHelpOutline />
				</button>
			</div>
			<div class="container mx-auto">
				<PieChart
					data={transformers.pie.funders(data)}
					colors={['#4ecdc4', '#ff6b6b']}
					popupTemplate={templates.pie}
					seriesConfig={{
						innerRadius: 0.6,
						padAngle: 0.02,
						cornerRadius: 0,
						showHoverEffects: true,
						hoverStyle: {
							borderWidth: 2,
							borderOpacity: 0.15
						}
					}}
				/>
			</div>
		</div>
	</div>

	<!-- Yearly metrics chart -->
	<div class="flex w-full flex-col rounded bg-slate-100 p-6 shadow-md">
		<div class="flex items-center justify-between">
			<div class="flex w-2/5 items-center justify-between">
				<h3 class="text-lg font-medium">{getMetricLabel(selectedMetric)} by Year</h3>
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
					dropdownTop="-0.5rem"
				/>
			</div>
			<button class="h-8 w-8 text-gray-500">
				<MdHelpOutline />
			</button>
		</div>
		<div class="w-full px-4 pb-8 pt-12">
			<div class="h-80">
				<BarChart
					data={chartState.yearly.data}
					series={chartState.yearly.series.values}
					colors={Array(data.yearlyWorkOutput?.length || 0).fill(chartState.yearly.series.color)}
					xAxisLabel="year"
					xAxisConfig={chartConfigs.bar.xAxis}
					yAxisConfig={chartState.yearly.yAxis}
					popupTemplate={templates.yearly}
					margins={{ left: 60, bottom: 40, right: 20, top: 20 }}
					seriesConfig={chartConfigs.bar.series}
				/>
			</div>
		</div>
	</div>

	<div class="w-full rounded bg-slate-100 p-6 shadow-md">Barchart Most Discussed Topics</div>
	<div class="w-full rounded bg-slate-100 p-6 shadow-md">Table for most recent works.</div>
</div>
