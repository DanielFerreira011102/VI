<script lang="ts">
	import { onMount } from 'svelte';
	import { measure } from '$lib/actions/measure';
	import type {
		AxisConfig,
		YAxisConfig,
		DataPoint,
		PointerState,
		Dimensions,
		PopupPosition
	} from '$lib/types/chart';

	export let data: DataPoint[] = [];
	export let series: string[] = [];
	export let colors: string[] = [];
	export let popupTemplate: (item: DataPoint, series: string) => string = (item, series) => `
      <div class="bg-white shadow-lg rounded p-2">
        ${series}: ${item[series]}
      </div>
    `;

	export let xAxisLabel = 'x';
	export let xAxisConfig: AxisConfig = {
		interval: 1,
		format: (value: any) => value?.toString() || '',
		rotation: 0,
		fontSize: 12,
		padding: 20,
		filter: (value, index) => true,
		color: '#9e9e9e',
		showAxis: true,
		axisColor: '#9e9e9e'
	};

	export let yAxisConfig: YAxisConfig = {
		min: 0,
		max: 100,
		interval: 25,
		rotation: 0,
		format: (value) => value.toString(),
		fontSize: 12,
		padding: 10,
		filter: (value, index) => true,
		gridLines: true,
		gridLineColor: '#e0e0e0',
		color: '#bdbdbd',
		showAxis: true,
		axisColor: '#9e9e9e'
	};

	let chart: HTMLDivElement;
	let popup: HTMLDivElement;
	let svg: SVGSVGElement;
	let pointer: PointerState = { x: 0, y: [], show: false, data: null, index: -1 };
	let containerWidth: number;
	let containerHeight: number;

	$: margin = {
		top: 20,
		right: 30,
		bottom: xAxisConfig.padding + xAxisConfig.fontSize,
		left: 30
	};

	$: actualWidth = containerWidth || 0;
	$: actualHeight = containerHeight || 0;

	$: innerWidth = actualWidth - margin.left - margin.right;
	$: innerHeight = actualHeight - margin.top - margin.bottom;

	// Calculate total width needed for all bars with spacing
	$: totalBarWidth = innerWidth * 0.75;
	$: barSpacing = totalBarWidth * 0.05;
	$: barWidth = (totalBarWidth - barSpacing * (series.length - 1)) / series.length;
	$: groupStartX = margin.left + (innerWidth - totalBarWidth) / 2; // Center the group

	// Update xScale to include spacing
	$: xScale = (seriesIndex: number) => {
		return groupStartX + seriesIndex * (barWidth + barSpacing);
	};

	$: yScale = (y: number) => {
		return (
			margin.top +
			innerHeight -
			((y - yAxisConfig.min) * innerHeight) / (yAxisConfig.max - yAxisConfig.min)
		);
	};

	$: yValues = Array.from(
		{ length: Math.floor((yAxisConfig.max - yAxisConfig.min) / yAxisConfig.interval) + 1 },
		(_, i) => yAxisConfig.min + i * yAxisConfig.interval
	);

	// Add this calculation for yLabels
	$: yLabels = yValues
		.map((value, i) => ({
			value,
			y: yScale(value),
			show: yAxisConfig.filter(value, i)
		}))
		.filter((label) => label.show);

	// Center x-axis label
	$: xLabelX = margin.left + innerWidth / 2;

	let popupDimensions: Dimensions = { width: 0, height: 0 };

	$: popupPosition = calculatePopupPosition(
		pointer,
		margin,
		actualWidth,
		actualHeight,
		popupDimensions
	);

	function calculatePopupPosition(
		pointer: PointerState,
		margin: any,
		width: number,
		height: number,
		popup: Dimensions
	): PopupPosition {
		if (!pointer.show || !pointer.data) return { left: 0, top: 0 };

		const padding = 16;

		let left = pointer.x - popup.width / 2;
		let top = Math.min(...pointer.y) - popup.height - padding;

		// Ensure popup doesn't overflow right edge
		if (left + popup.width > width - margin.right) {
			left = width - margin.right - popup.width - padding;
		}

		// Ensure popup doesn't overflow left edge
		if (left < margin.left) {
			left = margin.left + padding;
		}

		// If popup would go above chart, position it below the bar
		if (top < margin.top) {
			top = Math.max(...pointer.y) + padding;
		}

		return { left, top };
	}

	function handleMeasure(dimensions: Dimensions) {
		popupDimensions = dimensions;
	}

	function handleMouseMove(event: MouseEvent) {
		if (!svg) return;

		const rect = svg.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;

		// Find which bar was clicked
		let found = false;

		for (let j = 0; j < series.length; j++) {
			const barX = xScale(j);
			const barY = yScale(data[0][series[j]]);
			const barHeight = actualHeight - margin.bottom - barY;

			if (
				mouseX >= barX &&
				mouseX <= barX + barWidth &&
				mouseY >= barY &&
				mouseY <= barY + barHeight
			) {
				pointer = {
					x: barX + barWidth / 2,
					y: [barY],
					show: true,
					data: data[0],
					index: j,
					series: series[j] // Store which series (bar) is being hovered
				};
				found = true;
				break;
			}
		}

		if (!found) {
			pointer.show = false;
		}
	}

	function handleMouseLeave() {
		pointer.show = false;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			pointer.show = false;
		}
	}

	function handleResize() {
		if (!chart) return;
		const rect = chart.getBoundingClientRect();
		containerWidth = rect.width;
		containerHeight = rect.height;
	}

	onMount(() => {
		handleResize();
		const resizeObserver = new ResizeObserver(handleResize);
		resizeObserver.observe(chart);
		return () => resizeObserver.disconnect();
	});
</script>

<div
	class="relative h-full w-full outline-none"
	bind:this={chart}
	on:mousemove={handleMouseMove}
	on:mouseleave={handleMouseLeave}
	on:keydown={handleKeyDown}
	role="button"
	tabindex="0"
	aria-label="Interactive bar chart visualization"
>
	{#if actualWidth > 0 && actualHeight > 0}
		<svg width={actualWidth} height={actualHeight} bind:this={svg} role="presentation">
			<!-- Grid lines -->
			{#if yAxisConfig.gridLines}
				{#each yValues as value}
					<line
						x1={margin.left}
						y1={yScale(value)}
						x2={actualWidth - margin.right}
						y2={yScale(value)}
						stroke={yAxisConfig.gridLineColor}
						stroke-width="1"
					/>
				{/each}
			{/if}

			<!-- Axis lines -->
			{#if yAxisConfig.showAxis}
				<line
					x1={margin.left}
					y1={margin.top}
					x2={margin.left}
					y2={actualHeight - margin.bottom}
					stroke={yAxisConfig.axisColor}
					stroke-width="1"
				/>
			{/if}

			{#if xAxisConfig.showAxis}
				<line
					x1={margin.left}
					y1={actualHeight - margin.bottom}
					x2={actualWidth - margin.right}
					y2={actualHeight - margin.bottom}
					stroke={xAxisConfig.axisColor}
					stroke-width="1"
				/>
			{/if}

			<!-- Y-axis labels -->
			{#each yLabels as label}
				<text
					x={margin.left - yAxisConfig.padding}
					y={label.y}
					text-anchor="end"
					alignment-baseline="middle"
					font-size={yAxisConfig.fontSize}
					fill={yAxisConfig.color}
				>
					{yAxisConfig.format(label.value)}
				</text>
			{/each}

			<!-- X-axis label -->
			<text
				x={xLabelX}
				y={actualHeight - margin.bottom / 3}
				text-anchor="middle"
				font-size={xAxisConfig.fontSize}
				fill={xAxisConfig.color}
			>
				{xAxisLabel}
			</text>

			<!-- Bars -->
			{#each series as seriesName, seriesIndex}
				{@const barX = xScale(seriesIndex)}
				{@const barY = yScale(data[0][seriesName])}
				{@const barHeight = actualHeight - margin.bottom - barY}
				{@const isHovered = pointer.show && pointer.index === seriesIndex}

				<g>
					<!-- Main bar -->
					<rect x={barX} y={barY} width={barWidth} height={barHeight} fill={colors[seriesIndex]} />

					<!-- Hover effect - modified to stop at x-axis -->
					{#if isHovered}
						<!-- Right border -->
						<line
							x1={barX + barWidth + 0.5}
							y1={barY - 0.5}
							x2={barX + barWidth + 0.5}
							y2={actualHeight - margin.bottom}
							stroke="#000000"
							stroke-width="1"
							stroke-opacity="0.3"
						/>
						<line
							x1={barX + barWidth + 1.5}
							y1={barY - 1.5}
							x2={barX + barWidth + 1.5}
							y2={actualHeight - margin.bottom}
							stroke="#000000"
							stroke-width="1"
							stroke-opacity="0.15"
						/>
						<line
							x1={barX + barWidth + 2.5}
							y1={barY - 2.5}
							x2={barX + barWidth + 2.5}
							y2={actualHeight - margin.bottom}
							stroke="#000000"
							stroke-width="1"
							stroke-opacity="0.05"
						/>

						<!-- Left border -->
						<line
							x1={barX - 0.5}
							y1={barY - 0.5}
							x2={barX - 0.5}
							y2={actualHeight - margin.bottom}
							stroke="#000000"
							stroke-width="1"
							stroke-opacity="0.3"
						/>
						<line
							x1={barX - 1.5}
							y1={barY - 1.5}
							x2={barX - 1.5}
							y2={actualHeight - margin.bottom}
							stroke="#000000"
							stroke-width="1"
							stroke-opacity="0.15"
						/>
						<line
							x1={barX - 2.5}
							y1={barY - 2.5}
							x2={barX - 2.5}
							y2={actualHeight - margin.bottom}
							stroke="#000000"
							stroke-width="1"
							stroke-opacity="0.05"
						/>

						<!-- Top border -->
						<line
							x1={barX - 0.5}
							y1={barY - 0.5}
							x2={barX + barWidth + 0.5}
							y2={barY - 0.5}
							stroke="#000000"
							stroke-width="1"
							stroke-opacity="0.3"
						/>
						<line
							x1={barX - 1.5}
							y1={barY - 1.5}
							x2={barX + barWidth + 1.5}
							y2={barY - 1.5}
							stroke="#000000"
							stroke-width="1"
							stroke-opacity="0.15"
						/>
						<line
							x1={barX - 2.5}
							y1={barY - 2.5}
							x2={barX + barWidth + 2.5}
							y2={barY - 2.5}
							stroke="#000000"
							stroke-width="1"
							stroke-opacity="0.05"
						/>
					{/if}
				</g>
			{/each}
		</svg>
	{/if}

	<!-- Popup -->
	{#if pointer.show && pointer.data && pointer.series}
		<div
			use:measure={handleMeasure}
			class="pointer-events-none absolute"
			style="left: {popupPosition.left}px; top: {popupPosition.top}px;"
			role="tooltip"
		>
			{@html popupTemplate(pointer.data, pointer.series)}
		</div>
	{/if}
</div>
