<script lang="ts">
	import type { Term } from '$lib/types/term';
	import type {
		LineChartDataPoint,
		BarChartDataPoint,
		StarChartDataPoint,
		YAxisConfig,
		AxisConfig
	} from '$lib/types/chart';

	import LineChart from '$lib/components/LineChart.svelte';
	import BarChart from '$lib/components/BarChart.svelte';
	import StarChart from '$lib/components/StarChart.svelte';
	import Select from '$lib/components/Select.svelte';
	import MdHelpOutline from 'svelte-icons/md/MdHelpOutline.svelte';

	let { selectedTerms } = $props<{ selectedTerms: Term[] }>();

	// Types
	type MetricType = 'works' | 'citations' | 'avgCitations';
	let selectedMetric = $state<MetricType>('works');

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

	// Base configurations
	const chartConfigs = {
		line: {
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
				max: 120,
				interval: 30,
				rotation: 0,
				fontSize: 14,
				padding: 15,
				filter: (value: any, index: number) => index > 0,
				format: (value: number) => {
					if (value >= 1000000000000) return `${(value / 1000000000000).toFixed(1)}T`;
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
				lineWidth: 4,
				pointSize: 4,
				showPoints: false,
				showHoverEffects: true,
				hoverStyle: {
					circleRadius: 6.5,
					circleOpacity: 0.25
				}
			}
		},
		bar: {
			series: {
				barWidth: 0.8,
				barSpacing: 0.05,
				showHoverEffects: true,
				hoverStyle: {
					borderWidth: 2,
					borderOpacity: 0.15
				}
			}
		},
		star: {
			axes: [
				{
					key: 'works_count',
					label: 'Works Count',
					minValue: 0,
					gridConfig: {
						fontSize: 14,
						color: '#bdbdbd',
						format: (value: number, index: number, total: number) => {
							return `${(index / total) * 100}%`;
						},
						offsetX: 20,
						offsetY: -10
					}
				},
				{
					key: 'cited_by_count',
					label: 'Citations',
					minValue: 0,
					gridConfig: {
						filter: () => false // Hide all labels for this axis
					}
				},
				{
					key: 'mean_citedness',
					label: '2yr Mean Citedness',
					minValue: 0,
					gridConfig: {
						filter: () => false // Hide all labels for this axis
					}
				},
				{ key: 'h_index', label: 'H-Index', minValue: 0, gridConfig: { filter: () => false } },
				{ key: 'i10_index', label: 'i10-Index', minValue: 0, gridConfig: { filter: () => false } }
			],
			grid: {
				circleCount: 4,
				lineColor: '#ddd',
				lineWidth: 0.5
			},
			axis: {
				lineColor: '#999',
				lineWidth: 1,
				labelStyle: {
					fontSize: 14,
					color: '#9e9e9e',
					distance: 40
				}
			},
			series: {
				lineWidth: 4,
				pointSize: 4,
				showPoints: true,
				fill: true,
				fillOpacity: 0.1
			},
			margins: {
				top: 50,
				right: 40,
				bottom: 50,
				left: 40
			}
		},
		apc: {
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
				rotation: 0,
				fontSize: 14,
				padding: 15,
				filter: (value: any, index: number) => index > 0,
				format: (value: number) => {
					if (value >= 1000000000000) return `${(value / 1000000000000).toFixed(1)}T`;
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
				barSpacing: 0.03,
				showHoverEffects: true,
				hoverStyle: {
					borderWidth: 2,
					borderOpacity: 0.15
				}
			}
		}
	};

	// Chart state type
	type InstitutionChartState = {
		yearly: {
			data: LineChartDataPoint[];
			yAxis: YAxisConfig;
		};
		average: {
			data: BarChartDataPoint[];
			yAxis: YAxisConfig;
		};
		stats: {
			data: StarChartDataPoint[];
		};
		apc: {
			data: BarChartDataPoint[];
			yAxis: YAxisConfig;
			xAxis: AxisConfig;
		};
		series: {
			values: string[];
			colors: string[];
		};
	};

	// Initialize chart state
	let chartState = $state<InstitutionChartState>({
		yearly: {
			data: [],
			yAxis: chartConfigs.line.yAxis
		},
		average: {
			data: [],
			yAxis: { ...chartConfigs.line.yAxis, filter: () => false }
		},
		stats: {
			data: []
		},
		apc: {
			data: [],
			yAxis: { ...chartConfigs.line.yAxis, filter: (_, index) => index > 0 },
			xAxis: {
				...chartConfigs.apc.xAxis,
				rotation: 0
			}
		},
		series: {
			values: [],
			colors: []
		}
	});

	// Data transformers
	const transformers = {
		yearly: (terms: Term[], metric: MetricType): LineChartDataPoint[] => {
			const yearSet = new Set<number>();
			terms.forEach((term) => {
				term.data?.counts_by_year?.forEach((count: any) => yearSet.add(count.year));
			});

			return Array.from(yearSet)
				.sort()
				.map((year) => {
					const point: LineChartDataPoint = { year };
					terms.forEach((term) => {
						const yearData = term.data?.counts_by_year?.find((c: any) => c.year === year);
						point[term.value] = getMetricValue(yearData, metric);
					});
					return point;
				});
		},
		average: (yearlyData: LineChartDataPoint[], terms: Term[]): BarChartDataPoint[] => {
			const averages: BarChartDataPoint = {
				category: 'Average',
				...Object.fromEntries(
					terms.map((term) => [
						term.value,
						Math.round(
							yearlyData.reduce((sum, point) => sum + (point[term.value] ?? 0), 0) /
								yearlyData.length
						)
					])
				)
			};
			return [averages];
		},
		stats: (terms: Term[]): StarChartDataPoint[] => {
			if (!terms.length) return [];
			return terms.map((term) => ({
				label: term.value,
				color: term.color,
				values: {
					works_count: term.data?.works_count ?? 0,
					cited_by_count: term.data?.cited_by_count ?? 0,
					mean_citedness: term.data?.summary_stats?.['2yr_mean_citedness'] ?? 0,
					h_index: term.data?.summary_stats?.h_index ?? 0,
					i10_index: term.data?.summary_stats?.i10_index ?? 0
				}
			}));
		},
		apc: (terms: Term[]): BarChartDataPoint[] => {
			return terms.map((term) => ({
				category: term.value,
				apc_list_sum_usd: term.data?.works?.apc_list_sum_usd || 0,
				apc_paid_sum_usd: term.data?.works?.apc_paid_sum_usd || 0
			}));
		}
	};

	// Templates
	const templates = {
		yearly: (item: LineChartDataPoint) => `
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
    `,
		average: (item: BarChartDataPoint, series: string, seriesIndex: number) => {
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
		},
		apc: (item: BarChartDataPoint, series: string, seriesIndex: number) => {
			const term = selectedTerms.find((term) => term.value === item.category);
			if (!term) return '';
			const isListPrice = series === 'apc_list_sum_usd';
			return `
				<div class="relative bg-white bg-opacity-90 text-gray-900 border border-gray-200 shadow-md p-3 min-w-48 max-w-72 z-50">
					<div class="pb-2 font-semibold">${term.value}</div>
					<div class="flex items-center justify-between h-4 mt-2">
						<span class="truncate">${isListPrice ? 'List Price' : 'Paid Amount'}</span>
						<span class="ml-4" style="color: ${term.color}">
							$${(item[series] || 0).toLocaleString()}
						</span>
					</div>
				</div>
			`;
		}
	};

	// Effect to update chart data
	$effect(() => {
		if (!selectedTerms.length) {
			chartState = {
				yearly: {
					data: [],
					yAxis: chartConfigs.line.yAxis
				},
				average: {
					data: [],
					yAxis: { ...chartConfigs.line.yAxis, filter: () => false }
				},
				stats: {
					data: []
				},
				apc: {
					data: [],
					yAxis: { ...chartConfigs.line.yAxis, filter: (_, index) => index > 0 },
					xAxis: {
						...chartConfigs.apc.xAxis,
						rotation: 0
					}
				},
				series: {
					values: [],
					colors: []
				}
			};
			return;
		}

		// Transform data for all charts
		const yearlyData = transformers.yearly(selectedTerms, selectedMetric);
		const averageData = transformers.average(yearlyData, selectedTerms);
		const statsData = transformers.stats(selectedTerms);
		const apcData = transformers.apc(selectedTerms);

		// Calculate y-axis configurations
		const maxValue = Math.max(
			...yearlyData.flatMap((point) =>
				Object.values(point).filter((value) => typeof value === 'number' && value !== point.year)
			),
			1
		);

		const maxOrder = Math.floor(Math.log10(maxValue)) - 1;
		const max = Math.ceil(maxValue / 10 ** maxOrder) * 10 ** maxOrder;
		const interval = Math.ceil(max / 4);
		const yAxisConfig = {
			...chartConfigs.line.yAxis,
			max,
			interval
		};

		// Calculate max value for APC chart
		const maxApcValue = Math.max(
			...apcData.flatMap((point) => [point.apc_list_sum_usd, point.apc_paid_sum_usd]),
			1
		);

		const apcMaxOrder = Math.floor(Math.log10(maxApcValue)) - 1;
		const apcMax = Math.ceil(maxApcValue / 10 ** apcMaxOrder) * 10 ** apcMaxOrder;
		const apcInterval = Math.ceil(apcMax / 4);

		// If we have 4 or more terms, apc x-axis labels should be rotated
		const apcXAxisRotation = selectedTerms.length >= 4 ? -25 : 0;

		// Update chart state
		chartState = {
			yearly: {
				data: yearlyData,
				yAxis: { ...yAxisConfig, filter: (_, index) => index > 0 }
			},
			average: {
				data: averageData,
				yAxis: { ...yAxisConfig, filter: () => false }
			},
			stats: {
				data: statsData
			},
			apc: {
				data: apcData,
				yAxis: {
					...chartConfigs.apc.yAxis,
					max: apcMax,
					interval: apcInterval
				},
				xAxis: {
					...chartConfigs.apc.xAxis,
					rotation: apcXAxisRotation
				}
			},
			series: {
				values: selectedTerms.map((term) => term.value),
				colors: selectedTerms.map((term) => term.color)
			}
		};
	});
</script>

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
					data={chartState.average.data}
					series={chartState.series.values}
					colors={chartState.series.colors}
					xAxisLabel="category"
					xAxisConfig={chartConfigs.line.xAxis}
					yAxisConfig={chartState.average.yAxis}
					popupTemplate={templates.average}
					margins={{ left: 30 }}
					seriesConfig={chartConfigs.bar.series}
				/>
			</div>
			<div class="col-span-10 h-80">
				<LineChart
					data={chartState.yearly.data}
					series={chartState.series.values}
					colors={chartState.series.colors}
					popupTemplate={templates.yearly}
					xAxisLabel="year"
					xAxisConfig={chartConfigs.line.xAxis}
					yAxisConfig={chartState.yearly.yAxis}
					seriesConfig={chartConfigs.line.series}
				/>
			</div>
		</div>
	</div>
</div>
<div class="container mx-auto grid grid-cols-12 items-center justify-between gap-8 p-4">
	<div class="col-span-full w-full rounded-2xl bg-white p-4 md:col-span-6">
		<div class="flex items-center space-x-4 p-4">
			<h1 class="text-2xl leading-6 text-gray-900">Aritcle Processing Charges</h1>
			<button class="h-8 w-8 text-gray-500">
				<MdHelpOutline />
			</button>
		</div>
		<div class="w-full px-4 pb-8 pt-12">
			<div class="h-112 w-full">
				<BarChart
					data={chartState.apc.data}
					series={['apc_list_sum_usd', 'apc_paid_sum_usd']}
					colors={selectedTerms.flatMap((term, i) => [
						term.color, // List price color (full opacity)
						term.color + '80' // Paid amount color (50% opacity)
					])}
					xAxisLabel="category"
					xAxisConfig={chartState.apc.xAxis}
					yAxisConfig={chartState.apc.yAxis}
					popupTemplate={templates.apc}
					seriesConfig={chartConfigs.apc.series}
					margins={{
						bottom: 100,
						right: 20,
						left: 80
					}}
				/>
			</div>
		</div>
	</div>
	<div class="col-span-full w-full rounded-2xl bg-white p-4 md:col-span-6">
		<div class="flex items-center space-x-4 p-4">
			<h1 class="text-2xl leading-6 text-gray-900">Summary Statistics</h1>
			<button class="h-8 w-8 text-gray-500">
				<MdHelpOutline />
			</button>
		</div>
		<div class="w-full px-4 pb-8 pt-12">
			<div class="h-112 w-full">
				<StarChart
					data={chartState.stats.data}
					axes={chartConfigs.star.axes}
					gridConfig={chartConfigs.star.grid}
					axisConfig={chartConfigs.star.axis}
					seriesConfig={chartConfigs.star.series}
					margins={chartConfigs.star.margins}
				/>
			</div>
		</div>
	</div>
</div>
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
		<div class="w-full px-4 pb-8 pt-12">
			<div class="w-full h-80">
				<LineChart
					data={chartState.yearly.data}
					series={chartState.series.values}
					colors={chartState.series.colors}
					popupTemplate={templates.yearly}
					xAxisLabel="year"
					xAxisConfig={chartConfigs.line.xAxis}
					yAxisConfig={chartState.yearly.yAxis}
					seriesConfig={chartConfigs.line.series}
				/>
			</div>
		</div>
	</div>
</div>