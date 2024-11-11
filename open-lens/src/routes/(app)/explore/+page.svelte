<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { termStore } from '$lib/stores/termStore';
	import TermIndicator from '$lib/components/TermIndicator.svelte';
	import LineChart from '$lib/components/LineChart.svelte';
	import type { AxisConfig, YAxisConfig, DataPoint } from '$lib/types/lineChart';
	import MdHelpOutline from 'svelte-icons/md/MdHelpOutline.svelte'

	onMount(() => termStore.initialize($page.url.search));

	const data: DataPoint[] = [
		{ year: 2014, hello: 70, bye: 10 },
		{ year: 2015, hello: 75, bye: 12 },
		{ year: 2016, hello: 80, bye: 15 },
		{ year: 2017, hello: 85, bye: 20 },
		{ year: 2018, hello: 120, bye: 25 },
		{ year: 2019, hello: 95, bye: 30 },
		{ year: 2020, hello: 80, bye: 35 },
		{ year: 2021, hello: 45, bye: 40 },
		{ year: 2022, hello: 50, bye: 45 },
		{ year: 2023, hello: 55, bye: 50 },
	];

	const xAxisConfig: AxisConfig = {
		interval: 1,
		format: (value: number) => value.toString(),
		rotation: 0,
		fontSize: 14,
		padding: 25,
		filter: (value: number, index: number) => true,
		color: '#9e9e9e',
		showAxis: true, // Show x-axis line
		axisColor: '#9e9e9e'
	};
	
	const yAxisConfig: YAxisConfig = {
		min: 0,
		max: 120,
		interval: 30,
		rotation: 0,
		format: (value: number) => value.toString(),
		fontSize: 14,
		padding: 15,
		filter: (value: number, index: number) => index > 0,
		gridLines: true,
		showAxis: false,
		gridLineColor: '#e0e0e0',
		color: '#bdbdbd',
		axisColor: '#9e9e9e'
	};
	
	const popupTemplate = (item: any) => `
		<div class="bg-white bg-opacity-90 border border-gray-200 rounded shadow-md p-3 w-48">
			<div class="text-center pb-2 font-semibold">${item.year}</div>
			<div class="flex items-center justify-between h-4 mt-2">
				<span>Hello</span>
				<span class="text-[#4c8df6]">${item.hello}</span>
			</div>
			<div class="flex items-center justify-between h-4 mt-2">
				<span>Bye</span>
				<span class="text-[#e46962]">${item.bye}</span>
			</div>
		</div>
	`;
</script>

<div class="grid space-y-4 lg:space-y-2 bg-blue-500 bg-opacity-10 py-6">
	<div class="container mx-auto flex items-center justify-between px-2">
		<TermIndicator />
	</div>
	<div class="container mx-auto flex items-center justify-between px-2">
		<div class="h-16 w-full bg-white rounded-2xl p-4">
		</div>
	</div>


</div>

<div class="bg-blue-400 bg-opacity-10 py-4">
	<div class="container mx-auto flex items-center justify-between p-4">
		<div class="w-full bg-white rounded-2xl p-4">
			<div class="flex items-center justify-between p-4">
				<div class="flex items-center space-x-4">
					<h1 class="text-2xl leading-6">Some nice title</h1>
					<button class="w-8 h-8 text-gray-500">
						<MdHelpOutline />
					</button>
				</div>
			</div>
			<div class="w-full grid grid-cols-12 gap-4 pt-16 pb-12 px-4">
				<div class="col-span-2">
					<div class="flex items-center justify-between">
						<h1 class="text-lg">Bar</h1>
					</div>
				</div>
				<div class="col-span-10 h-72">
					<LineChart
					{data}
					series={['hello', 'bye']}
					colors={['#4c8df6', '#e46962']}
					{popupTemplate}
					xAxisLabel="year"
					{xAxisConfig}
					{yAxisConfig}
					/>
				</div>
			</div>
		</div>
	</div>
</div>
