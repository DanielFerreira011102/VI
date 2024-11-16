<script lang="ts">
	import type { Term } from '$lib/types/term';
	import type {
		LineChartDataPoint,
		BarChartDataPoint,
		AxisConfig,
		YAxisConfig,
		StarChartProps
	} from '$lib/types/chart';

	import LineChart from '$lib/components/LineChart.svelte';
	import BarChart from '$lib/components/BarChart.svelte';
	import StarChart from '$lib/components/StarChart.svelte';
	import MdHelpOutline from 'svelte-icons/md/MdHelpOutline.svelte';
	import Select from '$lib/components/Select.svelte';

	let { selectedTerms } = $props<{ selectedTerms: Term[] }>();

	// Types
	type MetricType = 'works' | 'citations' | 'avgCitations';
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
		gridLineColor: '#e0e0e0',
		color: '#bdbdbd',
		showAxis: false,
		axisColor: '#9e9e9e'
	};

	// Star Chart Configuration
	const starChartConfig: StarChartProps = {
		data: [
			{
				label: 'Sample 1',
				color: '#fbd38d',
				values: {
					speed: 85,
					power: 750000,
					range: 42,
					accuracy: 95,
					control: 8
				}
			},
			{
				label: 'Sample 2',
				color: '#4299e1',
				values: {
					speed: 92,
					power: 900000,
					range: 38,
					accuracy: 88,
					control: 6
				}
			}
		],
		axes: [
			{
				key: 'speed',
				label: 'Speed',
				maxValue: 100
			},
			{
				key: 'power',
				label: 'Power',
				maxValue: 1000000
			},
			{
				key: 'range',
				label: 'Range',
				maxValue: 50,
				minValue: 0
			},
			{
				key: 'accuracy',
				label: 'Accuracy',
				maxValue: 100,
				minValue: 0
			},
			{
				key: 'control',
				label: 'Control',
				maxValue: 10,
				minValue: 0
			}
		],
		gridConfig: {
			circleCount: 4,
			lineColor: '#ddd',
			lineWidth: 0.5,
			showLabels: true,
			labelStyle: {
				fontSize: 14,
				color: '#666',
				format: (value) => `${value}%`
			}
		},
		axisConfig: {
			lineColor: '#999',
			lineWidth: 1,
			labelStyle: {
				fontSize: 14,
				color: '#333',
				distance: 40
			}
		},
		seriesConfig: {
			lineWidth: 4,
			pointSize: 4,
			showPoints: true,
			fill: true,
			fillOpacity: 0.1
		},
		margins: {
			top: 60,
			right: 40,
			bottom: 60,
			left: 40
		}
	};

	// Chart state
	type ChartState = {
		lineData: LineChartDataPoint[];
		averageData: BarChartDataPoint[];
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

	// Chart templates
	const createLinePopup = (item: LineChartDataPoint) => `
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

	const createBarPopup = (item: BarChartDataPoint, series: string, seriesIndex: number) => {
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

	// Effect to update chart data
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
				const point: LineChartDataPoint = { year };
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
		const averages: BarChartDataPoint = {
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
					data={chartState.averageData}
					series={chartState.termValues}
					colors={chartState.termColors}
					xAxisLabel="category"
					{xAxisConfig}
					yAxisConfig={chartState.barYAxisConfig}
					popupTemplate={createBarPopup}
					margins={{ left: 30 }}
					seriesConfig={{
						barWidth: 0.8,
						barSpacing: 0.05,
						showHoverEffects: true,
						hoverStyle: {
							borderWidth: 2,
							borderOpacity: 0.15
						}
					}}
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
					seriesConfig={{
						lineWidth: 4,
						pointSize: 4,
						showPoints: false,
						showHoverEffects: true,
						hoverStyle: {
							circleRadius: 6.5,
							circleOpacity: 0.25
						}
					}}
				/>
			</div>
		</div>
	</div>
</div>
<div class="container mx-auto grid grid-cols-12 items-center justify-between gap-8 p-4">
	<div class="col-span-6 w-full rounded-2xl bg-white p-4"></div>
	<div class="col-span-6 h-[560px] w-full rounded-2xl bg-white p-4">
		<StarChart {...starChartConfig} />
	</div>
</div>
<div class="container mx-auto flex items-center justify-between p-4">
	<div class="w-full rounded-2xl bg-white p-4"></div>
</div>
