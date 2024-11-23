<script lang="ts">
	import type { Term } from '$lib/types/term';
	import type {
		LineChartDataPoint,
		BarChartDataPoint,
		StarChartDataPoint,
		YAxisConfig,
		AxisConfig,
		HierarchyNode
	} from '$lib/types/chart';
	import type { LoadingState } from '$lib/types/loading';

	import LineChart from '$lib/components/charts/LineChart.svelte';
	import BarChart from '$lib/components/charts/BarChart.svelte';
	import StarChart from '$lib/components/charts/StarChart.svelte';
	import Select from '$lib/components/Select.svelte';
	import MdHelpOutline from 'svelte-icons/md/MdHelpOutline.svelte';
	import LoadingStates from '$lib/components/LoadingStates.svelte';
	import CircularPackingChart from '../charts/CircularPackingChart.svelte';

	let { selectedTerms } = $props<{ selectedTerms: Term[] }>();

	// Types
	type MetricType = 'works' | 'citations' | 'avgCitations';
	let selectedMetric = $state<MetricType>('works');

	let loadingState = $state<LoadingState>({
		isLoading: false,
		error: null
	});

	$effect(() => {
		loadingState = {
			isLoading: selectedTerms.some((term) => term.isLoading),
			error: null
		};
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

	// Base configurations organized by chart instance
	const chartConfigs = {
		line: {
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
			}
		},
		bar: {
			average: {
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
					barSpacing: 0.05,
					showHoverEffects: true,
					hoverStyle: {
						borderWidth: 2,
						borderOpacity: 0.15
					}
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
		},
		star: {
			stats: {
				axes: [
					{
						key: 'works_count',
						label: 'Works',
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
							filter: () => false
						}
					},
					{
						key: 'mean_citedness',
						label: 'Impact Factor',
						minValue: 0,
						gridConfig: {
							filter: () => false
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
			}
		},
		packing: {
			top: {
				circleConfig: {
					padding: 10,
					levelStyle: {
						1: { strokeWidth: 2, strokeOpacity: 1, fillOpacity: 0.2 },
						2: { strokeWidth: 1.5, strokeOpacity: 0.8, fillOpacity: 0.3 }
					},
					showHoverEffects: true
				},
				labelConfig: {
					show: true,
					fontSize: 13,
					fontWeight: 500,
					color: '#333333',
					minRadiusToShow: 20,
					filter: (node: any) => node.depth > 1
				}
			}
		}
	};

	// Chart state type
	type InstitutionChartState = {
		line: {
			yearly: {
				data: LineChartDataPoint[];
				yAxis: YAxisConfig;
			};
		};
		bar: {
			average: {
				data: BarChartDataPoint[];
				yAxis: YAxisConfig;
			};
			apc: {
				data: BarChartDataPoint[];
				yAxis: YAxisConfig;
				xAxis: AxisConfig;
			};
		};
		star: {
			stats: {
				data: StarChartDataPoint[];
			};
		};
		packing: {
			top: {
				data: {
					name: string;
					children: Array<{
						name: string;
						children: Array<{
							name: string;
							value: number;
						}>;
					}>;
				};
				colors: Record<string, { 1: string; 2: string }>;
			};
		};
		series: {
			values: string[];
			colors: string[];
		};
	};

	// Initialize chart state
	let chartState = $state<InstitutionChartState>({
		line: {
			yearly: {
				data: [],
				yAxis: chartConfigs.line.yearly.yAxis
			}
		},
		bar: {
			average: {
				data: [],
				yAxis: { ...chartConfigs.line.yearly.yAxis, filter: () => false }
			},
			apc: {
				data: [],
				yAxis: { ...chartConfigs.line.yearly.yAxis, filter: (_, index) => index > 0 },
				xAxis: {
					...chartConfigs.bar.apc.xAxis,
					rotation: 0
				}
			}
		},
		star: {
			stats: {
				data: []
			}
		},
		packing: {
			top: {
				data: {
					name: 'root',
					children: []
				},
				colors: {}
			}
		},
		series: {
			values: [],
			colors: []
		}
	});

	// Data transformers organized by chart instance
	const transformers = {
		line: {
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
			}
		},
		bar: {
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
			apc: (terms: Term[]): BarChartDataPoint[] => {
				return terms.map((term) => ({
					category: term.value,
					apc_list_sum_usd: term.data?.works?.apc_list_sum_usd || 0,
					apc_paid_sum_usd: term.data?.works?.apc_paid_sum_usd || 0
				}));
			}
		},
		star: {
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
			}
		},
		packing: {
			top: (terms: Term[]) => {
				const data = {
					name: 'root',
					children: terms
						.map((term) => {
							const institution = term.data as Institution;
							return {
								name: institution.display_name,
								children:
									institution.topics?.map((topic) => ({
										name: topic.display_name,
										value: topic.count
									})) || []
							};
						})
						.filter((inst) => inst.children.length > 0)
				};

				const colors = Object.fromEntries(
					terms
						.filter((term) => term.data?.topics?.length)
						.map((term) => [
							term.data.display_name,
							{
								1: term.color + '40', // 25% opacity for institution level
								2: term.color // Full opacity for topics
							}
						])
				);

				return { data, colors };
			}
		}
	};

	// Templates organized by chart instance
	const templates = {
		line: {
			yearly: (item: LineChartDataPoint) => `
            <div class="relative bg-white bg-opacity-90 text-gray-900 border border-gray-200 shadow-md p-3 min-w-48 max-w-72 z-50">
                <div class="pb-2 font-semibold">${item.year}</div>
                ${selectedTerms
									.map(
										(term) => `
                    <div class="flex items-center justify-between mt-2">
                        <span class="truncate">${term.value}</span>
                        <span class="ml-4" style="color: ${term.color}">${(item[term.value] ?? 0).toLocaleString()}</span>
                    </div>
                    `
									)
									.join('')}
            </div>
        `
		},
		bar: {
			average: (item: BarChartDataPoint, series: string, seriesIndex: number) => {
				const term = selectedTerms.find(
					(term, index) => term.value === series && index === seriesIndex
				);
				if (!term) return '';
				return `
                <div class="relative bg-white bg-opacity-90 text-gray-900 border border-gray-200 shadow-md p-3 min-w-48 max-w-72 z-50">
                    <div class="pb-2 font-semibold">Average</div>
                    <div class="flex items-center justify-between mt-2">
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
                    <div class="flex items-center justify-between mt-2">
                        <span class="truncate">${isListPrice ? 'List Price' : 'Paid Amount'}</span>
                        <span class="ml-4" style="color: ${term.color}">
                            $${(item[series] || 0).toLocaleString()}
                        </span>
                    </div>
                </div>
            `;
			}
		},
		star: {
			stats: (item: StarChartDataPoint) => {
				const term = selectedTerms.find((term) => term.value === item.label);
				return `
				<div class="relative bg-white bg-opacity-90 text-gray-900 border border-gray-200 shadow-md p-3 min-w-48 max-w-72 z-50">
					<div class="pb-2 font-semibold">${item.label}</div>
					<div class="flex items-center justify-between mt-2">
						<span class="truncate">Works</span>
						<span class="ml-4" style="color: ${term.color}">${item.values.works_count}</span>
					</div>
					<div class="flex items center justify-between mt-2">
						<span class="truncate">Citations</span>
						<span class="ml-4" style="color: ${term.color}">${item.values.cited_by_count}</span>
					</div>
					<div class="flex items center justify-between mt-2">
						<span class="truncate">Impact Factor</span>
						<span class="ml-4" style="color: ${term.color}">${item.values.mean_citedness.toFixed(2)}</span>
					</div>
					<div class="flex items center justify-between mt-2">
						<span class="truncate">H-Index</span>
						<span class="ml-4" style="color: ${term.color}">${item.values.h_index}</span>
					</div>
					<div class="flex items center justify-between mt-2">
						<span class="truncate">i10-Index</span>
						<span class="ml-4" style="color: ${term.color}">${item.values.i10_index}</span>
					</div>
				</div>
			`;
			}
		},
		packing: {
			top: (node: d3.HierarchyNode<HierarchyNode>) => {
				const parentName =
					node.parent?.data.name === 'root' ? node.data.name : node.parent?.data.name;
				const depth = node.depth;
				const name = node.data.name;
				const count = node.value;
				// get color from the term color
				const term = selectedTerms.find((term) => term.data.display_name === parentName);
				return `
				<div class="relative bg-white bg-opacity-90 text-gray-900 border border-gray-200 shadow-md p-3 min-w-48 max-w-96 z-50">
					<div class="pb-2 font-semibold">${name}</div>
					<div class="flex items center justify-between mt-2">
						<span class="truncate">Works</span>
						<span class="ml-4" style="color: ${term.color}">${count}</span>
					</div>
				</div>
			`;
			}
		}
	};

	$effect(() => {
		const updateChartData = async () => {
			if (!selectedTerms.length) {
				chartState = {
					line: {
						yearly: {
							data: [],
							yAxis: chartConfigs.line.yearly.yAxis
						}
					},
					bar: {
						average: {
							data: [],
							yAxis: { ...chartConfigs.line.yearly.yAxis, filter: () => false }
						},
						apc: {
							data: [],
							yAxis: { ...chartConfigs.line.yearly.yAxis, filter: (_, index) => index > 0 },
							xAxis: {
								...chartConfigs.bar.apc.xAxis,
								rotation: 0
							}
						}
					},
					star: {
						stats: {
							data: []
						}
					},
					packing: {
						top: {
							data: {
								name: 'root',
								children: []
							},
							colors: {}
						}
					},
					series: {
						values: [],
						colors: []
					}
				};
				return;
			}

			try {
				// Transform data for all charts
				const yearlyData = transformers.line.yearly(selectedTerms, selectedMetric);
				const averageData = transformers.bar.average(yearlyData, selectedTerms);
				const statsData = transformers.star.stats(selectedTerms);
				const apcData = transformers.bar.apc(selectedTerms);
				const { data: topicsData, colors: topicsColors } = transformers.packing.top(selectedTerms);

				topicsData.children = topicsData.children
					.map((inst) => {
						inst.children = inst.children
							.sort((a, b) => b.value - a.value)
							.slice(0, 10)
							.map((topic) => topic);
						return inst;
					})
					.filter((inst) => inst.children.length > 0);


				// Calculate y-axis configurations
				const maxValue = Math.max(
					...yearlyData.flatMap((point) =>
						Object.values(point).filter(
							(value) => typeof value === 'number' && value !== point.year
						)
					),
					1
				);

				const maxOrder = Math.floor(Math.log10(maxValue)) - 1;
				const max = Math.ceil(maxValue / 10 ** maxOrder) * 10 ** maxOrder;
				const interval = Math.ceil(max / 4);
				const yAxisConfig = {
					...chartConfigs.line.yearly.yAxis,
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
					line: {
						yearly: {
							data: yearlyData,
							yAxis: { ...yAxisConfig, filter: (_, index) => index > 0 }
						}
					},
					bar: {
						average: {
							data: averageData,
							yAxis: { ...yAxisConfig, filter: () => false }
						},
						apc: {
							data: apcData,
							yAxis: {
								...chartConfigs.bar.apc.yAxis,
								max: apcMax,
								interval: apcInterval
							},
							xAxis: {
								...chartConfigs.bar.apc.xAxis,
								rotation: apcXAxisRotation
							}
						}
					},
					star: {
						stats: {
							data: statsData
						}
					},
					packing: {
						top: {
							data: topicsData,
							colors: topicsColors
						}
					},
					series: {
						values: selectedTerms.map((term) => term.value),
						colors: selectedTerms.map((term) => term.color)
					}
				};
			} catch (error) {
				console.error('Error updating chart data:', error);
			}
		};

		updateChartData();
	});
</script>

<div class="container mx-auto flex items-center justify-between p-4">
	<div class="relative w-full rounded-2xl bg-white p-4">
		<LoadingStates {loadingState} />
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
				dropdownTop="-0.5rem"
			/>
		</div>
		<!-- First Chart Group -->
		<div class="grid w-full grid-cols-12 px-4 pb-8 pt-12">
			<div class="col-span-2 h-80">
				{#if !loadingState.isLoading}
					<BarChart
						data={chartState.bar.average.data}
						series={chartState.series.values}
						colors={chartState.series.colors}
						xAxisLabel="category"
						xAxisConfig={chartConfigs.bar.average.xAxis}
						yAxisConfig={chartState.bar.average.yAxis}
						popupTemplate={templates.bar.average}
						margins={{ left: 30 }}
						seriesConfig={chartConfigs.bar.average.series}
					/>
				{/if}
			</div>
			<div class="col-span-10 h-80">
				{#if !loadingState.isLoading}
					<LineChart
						data={chartState.line.yearly.data}
						series={chartState.series.values}
						colors={chartState.series.colors}
						popupTemplate={templates.line.yearly}
						xAxisLabel="year"
						xAxisConfig={chartConfigs.line.yearly.xAxis}
						yAxisConfig={chartState.line.yearly.yAxis}
						seriesConfig={chartConfigs.line.yearly.series}
					/>
				{/if}
			</div>
		</div>
	</div>
</div>

<div class="container mx-auto grid grid-cols-12 items-center justify-between gap-8 p-4">
	<div class="relative col-span-full w-full rounded-2xl bg-white p-4 md:col-span-6">
		<LoadingStates {loadingState} />
		<div class="flex items-center space-x-4 p-4">
			<h1 class="text-2xl leading-6 text-gray-900">Article Processing Charges</h1>
			<button class="h-8 w-8 text-gray-500">
				<MdHelpOutline />
			</button>
		</div>
		<div class="w-full px-4 pb-8 pt-12">
			<!-- APC Chart -->
			<div class="h-112 w-full">
				{#if !loadingState.isLoading}
					<BarChart
						data={chartState.bar.apc.data}
						series={['apc_list_sum_usd', 'apc_paid_sum_usd']}
						colors={selectedTerms.flatMap((term, i) => [term.color, term.color + '80'])}
						xAxisLabel="category"
						xAxisConfig={chartState.bar.apc.xAxis}
						yAxisConfig={chartState.bar.apc.yAxis}
						popupTemplate={templates.bar.apc}
						seriesConfig={chartConfigs.bar.apc.series}
						margins={{
							left: 70,
							right: 20,
							top: 20,
							bottom: 100
						}}
					/>
				{/if}
			</div>
		</div>
	</div>
	<div class="relative col-span-full w-full rounded-2xl bg-white p-4 md:col-span-6">
		<LoadingStates {loadingState} />
		<div class="flex items-center space-x-4 p-4">
			<h1 class="text-2xl leading-6 text-gray-900">Summary Statistics</h1>
			<button class="h-8 w-8 text-gray-500">
				<MdHelpOutline />
			</button>
		</div>
		<div class="w-full px-4 pb-8 pt-12">
			<!-- Stats Chart -->
			<div class="h-112 w-full">
				{#if !loadingState.isLoading}
					<StarChart
						data={chartState.star.stats.data}
						axes={chartConfigs.star.stats.axes}
						gridConfig={chartConfigs.star.stats.grid}
						axisConfig={chartConfigs.star.stats.axis}
						seriesConfig={chartConfigs.star.stats.series}
						margins={chartConfigs.star.stats.margins}
						popupTemplate={templates.star.stats}
					/>
				{/if}
			</div>
		</div>
	</div>
</div>

<div class="container mx-auto flex items-center justify-between p-4">
	<div class="relative w-full rounded-2xl bg-white p-4">
		<LoadingStates {loadingState} />
		<div class="flex items-center space-x-4 p-4">
			<h1 class="text-2xl leading-6 text-gray-900">Topics Distribution</h1>
			<button class="h-8 w-8 text-gray-500">
				<MdHelpOutline />
			</button>
		</div>
		<div class="w-full px-4 pb-8 pt-12">
			<div class="h-128 w-full">
				{#if !loadingState.isLoading}
					<!--divide all count values by 100 -->
					<CircularPackingChart
						data={chartState.packing.top.data}
						colors={chartState.packing.top.colors}
						circleConfig={chartConfigs.packing.top.circleConfig}
						labelConfig={chartConfigs.packing.top.labelConfig}
						popupTemplate={templates.packing.top}
					/>
				{/if}
			</div>
		</div>
	</div>
</div>
