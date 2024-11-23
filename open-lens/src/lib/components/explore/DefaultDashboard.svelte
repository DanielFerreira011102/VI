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
	import CircularPackingChart from '$lib/components/charts/CircularPackingChart.svelte';
	import Select from '$lib/components/Select.svelte';
	import { helpTexts, helpTemplates } from '$lib/constants/helperTemplates';
	import LoadingStates from '$lib/components/LoadingStates.svelte';
	import HelperPopup from '$lib/components/HelperPopup.svelte';
	import type { Institution } from '$lib/types/institution';

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
						1: { strokeWidth: 2, strokeOpacity: 1, fillOpacity: 0.12 },
						2: { strokeWidth: 1.8, strokeOpacity: 0.9, fillOpacity: 0.25 },
						3: { strokeWidth: 1.6, strokeOpacity: 0.8, fillOpacity: 0.37 }
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

							// First group topics by domain
							const domainMap = new Map<
								string,
								{
									name: string;
									id: string;
									children: Map<
										string,
										{
											name: string;
											id: string;
											children: Map<
												string,
												{
													name: string;
													id: string;
													children: Array<{
														name: string;
														id: string;
														value: number;
													}>;
												}
											>;
										}
									>;
								}
							>();

							// Process each topic and build the hierarchy
							institution.topics?.forEach((topic) => {
								const domainId = topic.domain.id;
								const fieldId = topic.field.id;
								const subfieldId = topic.subfield.id;

								// Initialize domain if not exists
								if (!domainMap.has(domainId)) {
									domainMap.set(domainId, {
										name: topic.domain.display_name,
										id: domainId,
										children: new Map()
									});
								}

								// Get domain and initialize field if not exists
								const domain = domainMap.get(domainId)!;
								if (!domain.children.has(fieldId)) {
									domain.children.set(fieldId, {
										name: topic.field.display_name,
										id: fieldId,
										children: new Map()
									});
								}

								// Get field and initialize subfield if not exists
								const field = domain.children.get(fieldId)!;
								if (!field.children.has(subfieldId)) {
									field.children.set(subfieldId, {
										name: topic.subfield.display_name,
										id: subfieldId,
										children: []
									});
								}

								// Add topic to subfield
								const subfield = field.children.get(subfieldId)!;
								subfield.children.push({
									name: topic.display_name,
									id: topic.id,
									value: topic.count
								});
							});

							// Convert the Maps to arrays for the final structure
							return {
								name: institution.display_name,
								children: Array.from(domainMap.values()).map((domain) => ({
									name: domain.name,
									children: Array.from(domain.children.values()).map((field) => ({
										name: field.name,
										children: Array.from(field.children.values()).map((subfield) => ({
											name: subfield.name,
											children: subfield.children
										}))
									}))
								}))
							};
						})
						.filter((inst) => inst.children.length > 0)
				};

				// Create colors object for all levels
				const colors = Object.fromEntries(
					terms
						.filter((term) => term.data?.topics?.length)
						.map((term) => [
							term.data.display_name,
							{
								1: term.color + '20', // 12.5% opacity for institution level
								2: term.color + '40', // 25% opacity for domain level
								3: term.color + '60', // 37.5% opacity for field level
								4: term.color + '80', // 50% opacity for subfield level
								5: term.color // Full opacity for topics
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
					${chartConfigs.star.stats.axes
						.map((axis) => {
							const value = item.values[axis.key];
							return `
							<div class="flex items-center justify-between mt-2">
								<span class="truncate">${axis.label}</span>
								<span class="ml-4" style="color: ${term.color}">${
									axis.key === 'mean_citedness' ? value.toFixed(2) : value
								}</span>
							</div>
						`;
						})
						.join('')}
				</div>
			`;
			}
		},
		packing: {
			top: (node: d3.HierarchyNode<HierarchyNode>) => {
				// Just use the current node's name and data directly
				const name = node.data.name;
				const count = node.value;

				// Find the top-level parent for color
				let topParent = node;
				while (topParent.parent && topParent.parent.data.name !== 'root') {
					topParent = topParent.parent;
				}
				const term = selectedTerms.find((term) => term.data.display_name === topParent.data.name);

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
					line: { yearly: { data: [], yAxis: chartConfigs.line.yearly.yAxis } },
					bar: {
						average: {
							data: [],
							yAxis: { ...chartConfigs.line.yearly.yAxis, filter: () => false }
						},
						apc: {
							data: [],
							yAxis: { ...chartConfigs.line.yearly.yAxis, filter: (_, index) => index > 0 },
							xAxis: { ...chartConfigs.bar.apc.xAxis, rotation: 0 }
						}
					},
					star: { stats: { data: [] } },
					packing: { top: { data: { name: 'root', children: [] }, colors: {} } },
					series: { values: [], colors: [] }
				};
				return;
			}

			try {
				// Time Series Chart (Line Chart + Average Bar) data and configuration
				const timeSeriesData = transformers.line.yearly(selectedTerms, selectedMetric);
				const timeSeriesAverageData = transformers.bar.average(timeSeriesData, selectedTerms);

				const timeSeriesMaxValue = Math.max(
					...timeSeriesData.flatMap((point) =>
						Object.values(point).filter(
							(value) => typeof value === 'number' && value !== point.year
						)
					),
					1
				);

				const timeSeriesMaxOrder = Math.floor(Math.log10(timeSeriesMaxValue)) - 1;
				const timeSeriesMax =
					Math.ceil(timeSeriesMaxValue / 10 ** timeSeriesMaxOrder) * 10 ** timeSeriesMaxOrder;
				const timeSeriesInterval = Math.ceil(timeSeriesMax / 4);

				const timeSeriesYAxisConfig = {
					...chartConfigs.line.yearly.yAxis,
					max: timeSeriesMax,
					interval: timeSeriesInterval
				};

				// APC Chart data and configuration
				const apcChartData = transformers.bar.apc(selectedTerms);
				const apcMaxValue = Math.max(
					...apcChartData.flatMap((point) => [point.apc_list_sum_usd, point.apc_paid_sum_usd]),
					1
				);
				const apcMaxOrder = Math.floor(Math.log10(apcMaxValue)) - 1;
				const apcChartMax = Math.ceil(apcMaxValue / 10 ** apcMaxOrder) * 10 ** apcMaxOrder;
				const apcChartInterval = Math.ceil(apcChartMax / 4);
				const apcChartXAxisRotation = selectedTerms.length >= 4 ? -25 : 0;

				// Stats Chart (Star Chart) data
				const statsChartData = transformers.star.stats(selectedTerms);

				// Topics Chart (Circular Packing) data
				const { data: topicsChartData, colors: topicsChartColors } =
					transformers.packing.top(selectedTerms);

				// Series configuration used across charts
				const seriesValues = selectedTerms.map((term) => term.value);
				const seriesColors = selectedTerms.map((term) => term.color);

				// Update all chart states
				chartState = {
					line: {
						yearly: {
							data: timeSeriesData,
							yAxis: { ...timeSeriesYAxisConfig, filter: (_, index) => index > 0 }
						}
					},
					bar: {
						average: {
							data: timeSeriesAverageData,
							yAxis: { ...timeSeriesYAxisConfig, filter: () => false }
						},
						apc: {
							data: apcChartData,
							yAxis: {
								...chartConfigs.bar.apc.yAxis,
								max: apcChartMax,
								interval: apcChartInterval
							},
							xAxis: {
								...chartConfigs.bar.apc.xAxis,
								rotation: apcChartXAxisRotation
							}
						}
					},
					star: {
						stats: {
							data: statsChartData
						}
					},
					packing: {
						top: {
							data: topicsChartData,
							colors: topicsChartColors
						}
					},
					series: {
						values: seriesValues,
						colors: seriesColors
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
				<HelperPopup content={helpTexts.overTime} popupTemplate={helpTemplates.default} />
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
			<HelperPopup content={helpTexts.apc} popupTemplate={helpTemplates.default} />
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
			<HelperPopup content={helpTexts.stats} popupTemplate={helpTemplates.default} />
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
			<HelperPopup content={helpTexts.topics} popupTemplate={helpTemplates.default} />
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
