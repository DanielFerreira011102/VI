<script lang="ts">
	import Select from '$lib/components/Select.svelte';
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import PieChart from '$lib/components/charts/PieChart.svelte';
	import type { PageData } from './$types';
	import HelperPopup from '$lib/components/HelperPopup.svelte';
	import { helpTexts, helpTemplates } from '$lib/constants/helperTemplates';

	// Props
	let { data }: { data: PageData } = $props();

	// Types
	type MetricType = 'works' | 'citations' | 'avgCitations';
	let selectedMetric = $state<MetricType>('works');

	// Chart configurations organized by chart type
	const chartConfigs = {
		bar: {
			yearly: {
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
		},
		pie: {
			openAccess: {
				seriesConfig: {
					innerRadius: 0.6,
					padAngle: 0.02,
					cornerRadius: 0,
					showHoverEffects: true,
					hoverStyle: {
						borderWidth: 2,
						borderOpacity: 0.15
					}
				},
				colors: ['#4ecdc4', '#ff6b6b']
			},
			funders: {
				seriesConfig: {
					innerRadius: 0.6,
					padAngle: 0.02,
					cornerRadius: 0,
					showHoverEffects: true,
					hoverStyle: {
						borderWidth: 2,
						borderOpacity: 0.15
					}
				},
				colors: ['#4ecdc4', '#ff6b6b']
			},
			retractions: {
				seriesConfig: {
					innerRadius: 0.6,
					padAngle: 0.02,
					cornerRadius: 0,
					showHoverEffects: true,
					hoverStyle: {
						borderWidth: 2,
						borderOpacity: 0.15
					}
				},
				colors: ['#4ecdc4', '#ff6b6b']
			}
		}
	};

	type InstitutionChartState = {
		yearly: {
			data: any[];
			yAxis: typeof chartConfigs.bar.yearly.yAxis;
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
			yAxis: chartConfigs.bar.yearly.yAxis,
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

	// Data transformers organized by chart type
	const transformers = {
		bar: {
			yearly: (rawData: any[], metric: MetricType) => {
				return rawData.map((yearData) => ({
					year: yearData.year,
					[metric]: getMetricValue(yearData, metric)
				}));
			}
		},
		pie: {
			openAccess: (data: any) => {
				return data.openAccessDivision.group_by.map((item: any) => ({
					label: item.key === 'true' ? 'Open' : 'Restrict',
					value: item.count
				}));
			},
			funders: (data: any) => {
				return data.openAccessDivision.group_by.map((item: any) => ({
					label: item.key === 'true' ? 'Open' : 'Restrict',
					value: item.count
				}));
			},
			retractions: (data: any) => {
				return data.retractions.group_by.map((item: any) => ({
					label: item.key === '0' ? 'Published' : 'Retracted',
					value: item.count
				}));
			}
		}
	};

	// Templates organized by chart type
	const templates = {
		bar: {
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
			`
		},
		pie: {
			default: (item: any) => `
				<div class="bg-white shadow-lg rounded p-2">
					<div class="font-bold">${item.label}</div>
					<div>value: ${item.value}</div>
				</div>
			`
		}
	};

	// Effect to update chart data
	$effect(() => {
		if (!data.yearlyWorkOutput) {
			chartState = {
				yearly: {
					data: [],
					yAxis: chartConfigs.bar.yearly.yAxis,
					series: {
						values: [],
						color: '#FFC107'
					}
				}
			};
			return;
		}

		// Transform data using the transformer
		const yearlyData = transformers.bar.yearly(data.yearlyWorkOutput, selectedMetric);

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
					...chartConfigs.bar.yearly.yAxis,
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
	<div class="flex h-min w-full items-center justify-around">
		<div class="w-1/4">
			<img class="h-full w-full object-cover" src={data.info.image_url} alt="University logo" />
		</div>
		<div class="flex w-3/4 items-center justify-center gap-x-24">
			<div class="flex flex-col gap-y-6">
				<h1><span class="text-xl font-bold">Name:</span> {data.info.display_name}</h1>
				<h1><span class="text-xl font-bold">Website:</span> {data.info.homepage_url}</h1>
			</div>
			<div class="flex flex-col gap-y-6">
				<h1><span class="text-xl font-bold">Acronym:</span>{data.info.display_name_acronyms}</h1>
				<h1><span class="text-xl font-bold">Country Code</span> {data.info.country_code}</h1>
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
					<HelperPopup content={helpTexts.totalWorkCount} popupTemplate={helpTemplates.compact} />
				</button>
			</div>
			<h3 class="text-3xl font-medium">{data.info.works_count}</h3>
		</div>

		<!-- Citations count -->
		<div class="flex w-1/5 flex-col gap-y-2 rounded bg-slate-100 p-6 shadow-md">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-medium">Number of Citations</h3>
				<button class="h-8 w-8 text-gray-500">
					<HelperPopup content={helpTexts.totalCitationCount} popupTemplate={helpTemplates.compact} />
				</button>
			</div>
			<h3 class="text-3xl font-medium">{data.info.cited_by_count}</h3>
		</div>

		<!-- H-index -->
		<div class="flex w-1/5 flex-col gap-y-2 rounded bg-slate-100 p-6 shadow-md">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-medium">H-Index</h3>
				<button class="h-8 w-8 text-gray-500">
					<HelperPopup content={helpTexts.hindex} popupTemplate={helpTemplates.compact} />
				</button>
			</div>
			<h3 class="text-3xl font-medium">{data.info.summary_stats.h_index}</h3>
		</div>

		<!-- i10-index -->
		<div class="flex w-1/5 flex-col gap-y-2 rounded bg-slate-100 p-6 shadow-md">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-medium">i10-index</h3>
				<button class="h-8 w-8 text-gray-500">
					<HelperPopup content={helpTexts.iindex} popupTemplate={helpTemplates.compact} />
				</button>
			</div>
			<h3 class="text-3xl font-medium">{data.info.summary_stats.i10_index}</h3>
		</div>
	</div>

	<!-- Pie Charts -->
	<div class="flex w-full items-center gap-x-16">
		<!-- Open Access -->
		<div class="flex w-1/2 flex-col gap-y-2 rounded bg-slate-100 p-6 shadow-md">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-medium">Open Access Division</h3>
				<button class="h-8 w-8 text-gray-500">
					<HelperPopup content={helpTexts.openAccess} popupTemplate={helpTemplates.default} />
				</button>
			</div>
			<div class="container mx-auto">
				<PieChart
					data={transformers.pie.funders(data)}
					colors={chartConfigs.pie.funders.colors}
					popupTemplate={templates.pie.default}
					seriesConfig={chartConfigs.pie.funders.seriesConfig}
				/>
			</div>
			<div class="flex items-center justify-around">
				<div class="flex items-center gap-x-2">
					<div class="h-3 w-3 bg-red-300"></div>
					<span class="text-sm font-bold">Restrict</span>
				</div>
				<div class="flex items-center gap-x-2">
					<div class="h-3 w-3 bg-blue-300"></div>
					<span class="text-sm font-bold">Open</span>
				</div>
			</div>
		</div>

		<!-- Paper Rectraction -->
		<div class="flex w-1/2 flex-col gap-y-2 rounded bg-slate-100 p-6 shadow-md">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-medium">Paper Retraction Division</h3>
				<button class="h-8 w-8 text-gray-500">
					<HelperPopup content={helpTexts.paperRetraction} popupTemplate={helpTemplates.default} />
				</button>
			</div>
			<div class="container mx-auto">
				<PieChart
					data={transformers.pie.retractions(data)}
					colors={chartConfigs.pie.retractions.colors}
					popupTemplate={templates.pie.default}
					seriesConfig={chartConfigs.pie.retractions.seriesConfig}
				/>
			</div>
			<div class="flex items-center justify-around">
				<div class="flex items-center gap-x-2">
					<div class="h-3 w-3 bg-red-300"></div>
					<span class="text-sm font-bold">Retracted</span>
				</div>
				<div class="flex items-center gap-x-2">
					<div class="h-3 w-3 bg-blue-300"></div>
					<span class="text-sm font-bold">Published</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Table Metrics -->
	<div class="flex w-full items-center justify-center gap-x-16">
		<!-- Most Discussed Topics -->
		<div class="flex w-1/2 flex-col gap-y-2 rounded bg-slate-100 p-6 shadow-md">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-medium">Most Discussed Topics</h3>
				<button class="h-8 w-8 text-gray-500">
					<HelperPopup content={helpTexts.mostDiscussedTopics} popupTemplate={helpTemplates.default} />
				</button>
			</div>
			<div>
				<table class="my-6 w-full table-auto overflow-y-auto p-6 text-left">
					<thead>
						<tr>
							<th class="border-b border-slate-300 p-3 pb-3 pt-0 font-medium">Topic</th>
							<th class="border-b border-slate-300 p-3 pb-3 pt-0 font-medium">Nº of Works</th>
						</tr>
					</thead>
					<tbody>
						{#each data.mostDiscussedTopics.slice(0, 5) as topic}
							<tr>
								<td class="border-b border-slate-300 p-3 pl-5">{topic.display_name}</td>
								<td class="border-b border-slate-300 p-3">{topic.count}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Funders -->
		<div class="flex w-1/2 flex-col gap-y-2 rounded bg-slate-100 p-6 shadow-md">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-medium">Top Research Funders</h3>
				<button class="h-8 w-8 text-gray-500">
					<HelperPopup content={helpTexts.topFunders} popupTemplate={helpTemplates.default} />
				</button>
			</div>
			<div class="h-4/5">
				<table class="my-6 w-full table-auto overflow-y-auto p-6 text-left">
					<thead>
						<tr>
							<th class="border-b border-slate-300 p-3 pb-3 pt-0 font-medium">Contributor</th>
							<th class="border-b border-slate-300 p-3 pb-3 pt-0 font-medium"
								>Nº of Contributions</th
							>
						</tr>
					</thead>
					<tbody>
						{#each data.funders.group_by as funder}
							<tr>
								<td class="border-b border-slate-300 p-3 pl-5">{funder.key_display_name}</td>
								<td class="border-b border-slate-300 p-3">{funder.count}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<!-- Yearly metrics chart -->
	<div class="flex w-full flex-col rounded bg-slate-100 p-6 shadow-md">
		<div class="flex items-center justify-between">
			<div class="flex w-2/5 items-center gap-x-16">
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
				<HelperPopup content={helpTexts.institutionInfo} popupTemplate={helpTemplates.default} />
			</button>
		</div>
		<div class="w-full px-4 pb-8 pt-12">
			<div class="h-80">
				<BarChart
					data={chartState.yearly.data}
					series={chartState.yearly.series.values}
					colors={Array(data.yearlyWorkOutput?.length || 0).fill(chartState.yearly.series.color)}
					xAxisLabel="year"
					xAxisConfig={chartConfigs.bar.yearly.xAxis}
					yAxisConfig={chartState.yearly.yAxis}
					popupTemplate={templates.bar.yearly}
					margins={{ left: 60, bottom: 40, right: 20, top: 20 }}
					seriesConfig={chartConfigs.bar.yearly.series}
				/>
			</div>
		</div>
	</div>

	<!-- Latest Works -->
	<div class="w-full rounded bg-slate-100 p-6 shadow-md">
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-medium">Latest Works</h3>
			<button class="h-8 w-8 text-gray-500">
				<HelperPopup content={helpTexts.latestWorks} popupTemplate={helpTemplates.default} />
			</button>
		</div>
		<table class="my-6 w-full table-auto p-6 text-left">
			<thead>
				<tr>
					<th class="border-b border-slate-300 p-4 pb-3 pt-0 font-medium">Title</th>
					<th class="border-b border-slate-300 p-4 pb-3 pt-0 font-medium">Authors</th>
					<th class="border-b border-slate-300 p-4 pb-3 pt-0 font-medium">Publish Date</th>
					<th class="border-b border-slate-300 p-4 pb-3 pt-0 font-medium">Topic</th>
					<th class="border-b border-slate-300 p-4 pb-3 pt-0 font-medium">Type</th>
					<th class="border-b border-slate-300 p-4 pb-3 pt-0 font-medium">Nº of Citations</th>
					<th class="border-b border-slate-300 p-4 pb-3 pt-0 font-medium">Open Access</th>
				</tr>
			</thead>
			<tbody>
				{#each data.mostRecentWorks.results.slice(0, 10) as work}
					<tr class="group transition-colors duration-200 hover:bg-slate-200">
						<td class="relative max-w-[300px] border-b border-slate-300 p-4 pl-8">
							<span class="line-clamp-1">{work.title}</span>
							<span
								class="absolute left-0 top-full z-10 hidden rounded bg-black p-2 text-white group-hover:block"
							>
								{work.title}
							</span>
						</td>
						<td class="border-b border-slate-300 p-4">{work.authorships[0].author.display_name}</td>
						<td class="border-b border-slate-300 p-4">{work.publication_date}</td>
						<td class="border-b border-slate-300 p-4">{work.primary_topic.domain.display_name}</td>
						<td class="border-b border-slate-300 p-4">{work.type}</td>
						<td class="border-b border-slate-300 p-4">{work.cited_by_count}</td>
						<td class="border-b border-slate-300 p-4 pr-8">{work.open_access.oa_status}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
