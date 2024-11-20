<script lang="ts">
	import BarChart from '$lib/components/BarChart.svelte';
	import PieChart from '$lib/components/PieChart.svelte';

	const data = [
		{
			category: 'bunny',
			size: 45,
			weight: 62,
			age: 78
		},
		{
			category: 'cat',
			size: 55,
			weight: 48,
			age: 82
		},
		{
			category: 'dog',
			size: 75,
			weight: 85,
			age: 65
		}
	];

	const series = ['size', 'weight', 'age'];
	const colors = ['#4CAF50', '#2196F3', '#FFC107', '#FF5722'];

	const popupTemplate = (item: any, series: string) => `
	  <div class="bg-white shadow-lg rounded p-2">
		<div class="font-bold">${item.category}</div>
		<div>${series}: ${item[series]}</div>
	  </div>
	`;

	const xAxisConfig = {
		interval: 1,
		format: (value: any) => value?.toString() || '',
		rotation: 0,
		fontSize: 12,
		padding: 10,
		filter: (value: any, index: number) => true,
		color: '#9e9e9e',
		showAxis: true,
		axisColor: '#9e9e9e'
	};

	const yAxisConfig = {
		min: 0,
		max: 100,
		interval: 20,
		rotation: 0,
		format: (value: number) => value.toString(),
		fontSize: 12,
		padding: 10,
		filter: (value: number, index: number) => true,
		gridLines: true,
		gridLineColor: '#e0e0e0',
		color: '#bdbdbd',
		showAxis: true,
		axisColor: '#9e9e9e'
	};
</script>

<div class="h-[400px] w-full">
	<BarChart
		{data}
		{series}
		{colors}
		xAxisLabel="category"
		seriesConfig={{
			barSpacing: 0.02
		}}
		{xAxisConfig}
		{yAxisConfig}
		{popupTemplate}
	/>
</div>
<div class="h-112 w-full">
	<PieChart
		data={[
			{ label: 'A', value: 40 },
			{ label: 'B', value: 75 },
			{ label: 'C', value: 25 }
		]}
		colors={['#ff6b6b', '#4ecdc4', '#45b7d1']}
		popupTemplate={(item: any) => `
		  <div class="bg-white shadow-lg rounded p-2">
			<div class="font-bold">${item.label}</div>
			<div>value: ${item.value}</div>
		  </div>
		`}
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
