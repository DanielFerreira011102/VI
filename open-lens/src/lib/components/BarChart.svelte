<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import { measure } from '$lib/actions/measure';
	import type {
		BarChartProps,
		BarChartPointerState,
		BarChartDataPoint,
		Dimensions,
		Position,
		Margin
	} from '$lib/types/chart';

	const props = $props<BarChartProps>();

	// Initialize props with default values
	const data = $derived(props.data ?? []);
	const series = $derived(props.series ?? []);
	const colors = $derived(props.colors ?? []);
	const xAxisLabel = $derived(props.xAxisLabel ?? 'x');

	const seriesConfig = $derived(
		props.seriesConfig ?? {
			barWidth: 0.8,
			barSpacing: 0.2,
			showHoverEffects: true,
			hoverStyle: {
				borderWidth: 2.5,
				borderOpacity: 0.3
			}
		}
	);

	const popupTemplate = $derived(
		props.popupTemplate ??
			((item: BarChartDataPoint, series: string, seriesIndex: number) => `
	  <div class="bg-white shadow-lg rounded p-2">
		${series}: ${item[series]}
	  </div>
	`)
	);

	const xAxisConfig = $derived(
		props.xAxisConfig ?? {
			interval: 1,
			format: (value: any) => value?.toString() || '',
			rotation: 0,
			fontSize: 12,
			padding: 20,
			filter: (value: any, index: number) => true,
			color: '#9e9e9e',
			showAxis: true,
			axisColor: '#9e9e9e'
		}
	);

	const yAxisConfig = $derived(
		props.yAxisConfig ?? {
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
		}
	);

	// Local state
	let chart: HTMLDivElement;
	let svgRef = $state<SVGSVGElement | null>(null);
	let resizeObserver: ResizeObserver;

	let pointer = $state<BarChartPointerState>({
		x: 0,
		y: [],
		show: false,
		data: null,
		index: -1,
		categoryIndex: undefined,
		seriesIndex: undefined
	});

	let containerWidth = $state(0);
	let containerHeight = $state(0);
	let popupDimensions = $state<Dimensions>({ width: 0, height: 0 });

	// Derived values
	let margin = $derived({
		top: props.margins?.top ?? 20,
		right: props.margins?.right ?? 30,
		bottom:
			props.margins?.bottom ??
			(xAxisConfig.filter === (() => false)
				? 20
				: xAxisConfig.padding + xAxisConfig.fontSize * 1.5),
		left:
			props.margins?.left ??
			(yAxisConfig.filter === (() => false) ? 30 : yAxisConfig.padding + yAxisConfig.fontSize * 3.5)
	});

	let actualWidth = $derived(Math.max(containerWidth || 0, margin.left + margin.right + 100));
	let actualHeight = $derived(Math.max(containerHeight || 0, margin.top + margin.bottom + 50));
	let innerWidth = $derived(actualWidth - margin.left - margin.right);

	let validColors = $derived(
		colors.length >= series.length
			? colors
			: [...colors, ...Array(series.length - colors.length).fill('#9e9e9e')]
	);

	// Category and bar layout calculations
	let categories = $derived(data.map((d) => d[xAxisLabel]));
	let categoryWidth = $derived(innerWidth / Math.max(categories.length, 1));
	let totalBarWidth = $derived(categoryWidth * (seriesConfig.barWidth ?? 0.8));
	let barSpacing = $derived(totalBarWidth * (seriesConfig.barSpacing ?? 0.2));
	let barWidth = $derived(
		(totalBarWidth - barSpacing * (series.length - 1)) / Math.max(series.length, 1)
	);

	let yScale = $derived(
		d3
			.scaleLinear()
			.domain([yAxisConfig.min, yAxisConfig.max])
			.range([actualHeight - margin.bottom, margin.top])
	);

	let categoryStartX = $derived(
		(index: number) => margin.left + categoryWidth * index + (categoryWidth - totalBarWidth) / 2
	);

	let xScale = $derived(
		(categoryIndex: number, seriesIndex: number) =>
			categoryStartX(categoryIndex) + seriesIndex * (barWidth + barSpacing)
	);

	$effect(() => {
		if (svgRef && data?.length > 0 && actualWidth > 0 && actualHeight > 0) {
			render(d3.select(svgRef));
		}
	});

	function renderAxisAndGrid(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
		const yTicks = d3.range(
			yAxisConfig.min,
			yAxisConfig.max + yAxisConfig.interval,
			yAxisConfig.interval
		);

		if (yAxisConfig.gridLines) {
			svg
				.selectAll('.grid-line')
				.data(yTicks)
				.join('line')
				.attr('class', 'grid-line')
				.attr('x1', margin.left)
				.attr('x2', actualWidth - margin.right)
				.attr('y1', yScale)
				.attr('y2', yScale)
				.attr('stroke', yAxisConfig.gridLineColor)
				.attr('stroke-width', 1);
		}

		const filteredYTicks = yTicks.filter((value, index) => yAxisConfig.filter(value, index));
		svg
			.selectAll('.y-axis-label')
			.data(filteredYTicks)
			.join('text')
			.attr('class', 'y-axis-label')
			.attr('x', margin.left - yAxisConfig.padding)
			.attr('y', yScale)
			.attr('text-anchor', 'end')
			.attr('dominant-baseline', 'middle')
			.attr('font-size', yAxisConfig.fontSize)
			.attr('fill', yAxisConfig.color)
			.text(yAxisConfig.format);

		if (yAxisConfig.showAxis) {
			svg
				.append('line')
				.attr('class', 'y-axis')
				.attr('x1', margin.left)
				.attr('x2', margin.left)
				.attr('y1', margin.top)
				.attr('y2', actualHeight - margin.bottom)
				.attr('stroke', yAxisConfig.axisColor)
				.attr('stroke-width', 1);
		}

		if (xAxisConfig.showAxis) {
			svg
				.append('line')
				.attr('class', 'x-axis')
				.attr('x1', margin.left)
				.attr('x2', actualWidth - margin.right)
				.attr('y1', actualHeight - margin.bottom)
				.attr('y2', actualHeight - margin.bottom)
				.attr('stroke', xAxisConfig.axisColor)
				.attr('stroke-width', 1);
		}

		svg
			.selectAll('.x-axis-label')
			.data(categories)
			.join('text')
			.attr('class', 'x-axis-label')
			.attr('x', (_, i) => categoryStartX(i) + totalBarWidth / 2)
			.attr('y', actualHeight - margin.bottom + xAxisConfig.padding)
			.attr('text-anchor', 'middle')
			.attr('font-size', xAxisConfig.fontSize)
			.attr('fill', xAxisConfig.color)
			.text((d) => xAxisConfig.format(d));
	}

	function render(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
		if (!data?.length || !series?.length) return;

		svg.selectAll('*').remove();
		renderAxisAndGrid(svg);

		data.forEach((categoryData, categoryIndex) => {
			series.forEach((seriesName, seriesIndex) => {
				const barX = xScale(categoryIndex, seriesIndex);
				const value = categoryData[seriesName];
				const barY = yScale(value);
				const barHeight = actualHeight - margin.bottom - barY;
				const isHovered =
					pointer.show &&
					pointer.categoryIndex === categoryIndex &&
					pointer.seriesIndex === seriesIndex;

				const group = svg.append('g').attr('class', 'bar-group');

				group
					.append('rect')
					.attr('x', barX)
					.attr('y', barY)
					.attr('width', barWidth)
					.attr('height', barHeight)
					.attr('fill', validColors[seriesIndex]);

				if (isHovered && seriesConfig.showHoverEffects) {
					const { borderWidth = 2.5, borderOpacity = 0.3 } = seriesConfig.hoverStyle ?? {};

					// Add hover effects
					[-0.5, -1.5, -2.5].forEach((offset, i) => {
						const opacity = borderOpacity * [1, 0.5, 0.2][i];

						// Right border
						group
							.append('line')
							.attr('x1', barX + barWidth - offset)
							.attr('y1', barY + offset)
							.attr('x2', barX + barWidth - offset)
							.attr('y2', actualHeight - margin.bottom)
							.attr('stroke', '#000000')
							.attr('stroke-width', borderWidth)
							.attr('stroke-opacity', opacity);

						// Left border
						group
							.append('line')
							.attr('x1', barX + offset)
							.attr('y1', barY + offset)
							.attr('x2', barX + offset)
							.attr('y2', actualHeight - margin.bottom)
							.attr('stroke', '#000000')
							.attr('stroke-width', borderWidth)
							.attr('stroke-opacity', opacity);

						// Top border
						group
							.append('line')
							.attr('x1', barX + offset)
							.attr('y1', barY + offset)
							.attr('x2', barX + barWidth - offset)
							.attr('y2', barY + offset)
							.attr('stroke', '#000000')
							.attr('stroke-width', borderWidth)
							.attr('stroke-opacity', opacity);
					});
				}
			});
		});
	}

	function handleMouseMove(event: MouseEvent) {
		if (!svgRef || !data?.length) return;

		const rect = svgRef.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;

		let found = false;

		for (let i = 0; i < data.length; i++) {
			for (let j = 0; j < series.length; j++) {
				const barX = xScale(i, j);
				const value = data[i][series[j]];
				const barY = yScale(value);
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
						data: data[i],
						index: j,
						series: series[j],
						categoryIndex: i,
						seriesIndex: j
					};
					found = true;
					break;
				}
			}
			if (found) break;
		}

		if (!found) {
			pointer.show = false;
		}

		if (svgRef) {
			render(d3.select(svgRef));
		}
	}

	function handleMouseLeave() {
		pointer.show = false;
		if (svgRef) {
			render(d3.select(svgRef));
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleMouseLeave();
		}
	}

	function handleResize() {
		if (!chart) return;
		const rect = chart.getBoundingClientRect();
		containerWidth = rect.width;
		containerHeight = rect.height;
	}

	function calculatePopupPosition(
		pointer: BarChartPointerState,
		margin: Margin,
		width: number,
		height: number,
		popup: Dimensions
	): Position {
		if (!pointer.show || !pointer.data || width <= 0 || height <= 0) {
			return { x: 0, y: 0 };
		}

		const padding = 16;
		const gap = 12;

		const anchorX = pointer.x;
		const anchorY = Math.min(...pointer.y);

		let x = anchorX - popup.width - gap;

		if (x < margin.left + padding) {
			x = anchorX + gap;
		}

		x = Math.max(margin.left + padding, Math.min(width - margin.right - popup.width - padding, x));

		let y = anchorY - popup.height / 2;

		if (y < margin.top + padding) {
			y = margin.top + padding;
		} else if (y + popup.height > height - margin.bottom - padding) {
			y = height - margin.bottom - popup.height - padding;
		}

		return { x, y };
	}

	function handleMeasure(dimensions: Dimensions) {
		popupDimensions = dimensions;
	}

	onMount(() => {
		handleResize();
		resizeObserver = new ResizeObserver(() => {
			handleResize();
			if (svgRef) {
				render(d3.select(svgRef));
			}
		});
		resizeObserver.observe(chart);
	});

	onDestroy(() => {
		if (resizeObserver) {
			resizeObserver.disconnect();
		}
	});

	let popupPosition = $derived(
		calculatePopupPosition(pointer, margin, actualWidth, actualHeight, popupDimensions)
	);
</script>

<div
	class="relative h-full w-full outline-none"
	bind:this={chart}
	onmousemove={handleMouseMove}
	onmouseleave={handleMouseLeave}
	onkeydown={handleKeyDown}
	role="button"
	tabindex="0"
	aria-label="Interactive bar chart visualization"
>
	{#if actualWidth > 0 && actualHeight > 0}
		<svg bind:this={svgRef} width={actualWidth} height={actualHeight} role="presentation" />
	{/if}

	{#if pointer.show && pointer.data && pointer.series}
		<div
			use:measure={handleMeasure}
			class="pointer-events-none absolute"
			style="left: {popupPosition.x}px; top: {popupPosition.y}px;"
			role="tooltip"
		>
			{@html popupTemplate(pointer.data, pointer.series, pointer.seriesIndex)}
		</div>
	{/if}
</div>
