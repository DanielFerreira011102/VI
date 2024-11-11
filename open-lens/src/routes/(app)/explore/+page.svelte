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
	
	let { data } = $props<{ data: PageData }>();
	let terms = $state<Term[]>([]);
	let selectedTerms = $derived(terms.filter(term => term.type === 'selected'));
	
	// Chart data interface
	interface ChartState {
		lineData: DataPoint[];
		averageData: DataPoint[];
		termValues: string[];
		termColors: string[];
		lineYAxisConfig: YAxisConfig;
		barYAxisConfig: YAxisConfig;
	}
	
	// Base configurations
	const xAxisConfig: AxisConfig = {
		interval: 1,
		format: value => value.toString(),
		rotation: 0,
		fontSize: 14,
		padding: 25,
		filter: () => true,
		color: '#9e9e9e',
		showAxis: true,
		axisColor: '#9e9e9e'
	};
		
	// Separate Y-axis configurations for line and bar charts
	const baseLineYAxisConfig: YAxisConfig = {
		min: 0,
		max: 120,
		interval: 30,
		rotation: 0,
		fontSize: 14,
		padding: 15,
		format: value => value.toString(),
		filter: (_, index) => index > 0, // Show labels except first
		gridLines: true,
		showAxis: false,
		gridLineColor: '#e0e0e0',
		color: '#bdbdbd',
		axisColor: '#9e9e9e'
	};

	const baseBarYAxisConfig: YAxisConfig = {
		...baseLineYAxisConfig,
		filter: () => false // Hide all labels for bar chart
	};
	
	// Initialize chart state
	let chartState = $state<ChartState>({
		lineData: [],
		averageData: [],
		termValues: [],
		termColors: [],
		lineYAxisConfig: baseLineYAxisConfig,
		barYAxisConfig: baseBarYAxisConfig
	});
	
	// Update chart data when selected terms change
	$effect(() => {
		if (!selectedTerms.length || !data) {
			chartState = {
				lineData: [],
				averageData: [],
				termValues: [],
				termColors: [],
				lineYAxisConfig: baseLineYAxisConfig,
				barYAxisConfig: baseBarYAxisConfig
			};
			return;
		}
	
		// Get year data
		const yearSet = new Set<number>();
		selectedTerms.forEach(term => {
			data[term.value]?.counts_by_year?.forEach(count => yearSet.add(count.year));
		});
	
		const lineData = Array.from(yearSet).sort().map(year => {
			const point: DataPoint = { year };
			selectedTerms.forEach(term => {
				const yearData = data[term.value]?.counts_by_year?.find(c => c.year === year);
				point[term.value] = yearData?.works_count ?? 0;
			});
			return point;
		});
	
		// Calculate max value for y-axis
		const maxValue = Math.max(
			...lineData.flatMap(point => 
				Object.values(point).filter(value => typeof value === 'number' && value !== point.year)
			),
			1 // Ensure we always have a positive max value
		);

		const max = Math.ceil(maxValue / 100) * 100;
	    const interval = Math.ceil(max / 4);

		// Calculate averages
		const averages: DataPoint = {
			identifier: 'Average',
			...Object.fromEntries(
				selectedTerms.map(term => [
					term.value,
					Math.round(
						lineData.reduce((sum, point) => sum + (point[term.value] ?? 0), 0) / lineData.length
					)
				])
			)
		};
	
		// Update chart state with separate axis configurations
		chartState = {
			lineData,
			averageData: [averages],
			termValues: selectedTerms.map(term => term.value),
			termColors: selectedTerms.map(term => term.color ?? '#000'),
			lineYAxisConfig: {
				...baseLineYAxisConfig,
				max,
				interval
			},
			barYAxisConfig: {
				...baseBarYAxisConfig,
				max,
				interval
			}
		};
	});
	
	// Popup template
	const createPopup = (item: DataPoint, title: string) => `
		<div class="bg-white bg-opacity-90 border border-gray-200 rounded shadow-md p-3 w-48">
			<div class="pb-2 font-semibold">${title}</div>
			${selectedTerms.map(term => `
				<div class="flex items-center justify-between h-4 mt-2">
					<span>${term.value}</span>
					<span style="color: ${term.color ?? '#000'}">${(item[term.value] ?? 0).toLocaleString()}</span>
				</div>
			`).join('')}
		</div>
	`;
	
	// Initialize term store
	onMount(() => termStore.initialize($page.url.search));
	termStore.subscribe(value => {
		terms = value;
	});
	</script>
	
	<div class="grid space-y-4 bg-blue-500 bg-opacity-10 py-6 lg:space-y-3">
		<div class="container mx-auto flex items-center justify-between px-2">
			<TermIndicator />
		</div>
		<div class="container mx-auto flex items-center justify-between px-2">
			<div class="h-16 w-full rounded-2xl bg-white p-4"></div>
		</div>
	</div>
	
	<div class="bg-blue-400 bg-opacity-10 py-4">
		<div class="container mx-auto flex items-center justify-between p-4">
			<div class="w-full rounded-2xl bg-white p-4">
				<div class="flex items-center justify-between p-4">
					<div class="flex items-center space-x-4">
						<h1 class="text-2xl leading-6">Some nice title</h1>
						<button class="h-8 w-8 text-gray-500">
							<MdHelpOutline />
						</button>
					</div>
				</div>
				<div class="grid w-full grid-cols-12 px-4 pb-12 pt-16">
					{#if selectedTerms.length > 0}
						<div class="col-span-2 h-72">
							<BarChart
								data={chartState.averageData}
								series={chartState.termValues}
								colors={chartState.termColors}
								xAxisLabel="Average"
								{xAxisConfig}
								yAxisConfig={chartState.barYAxisConfig}
								popupTemplate={(item) => createPopup(item, 'Average')}
							/>
						</div>
						<div class="col-span-10 h-72">
							<LineChart
								data={chartState.lineData}
								series={chartState.termValues}
								colors={chartState.termColors}
								popupTemplate={(item) => createPopup(item, String(item.year))}
								xAxisLabel="year"
								{xAxisConfig}
								yAxisConfig={chartState.lineYAxisConfig}
							/>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>