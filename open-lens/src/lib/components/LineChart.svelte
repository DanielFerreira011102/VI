<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import { measure } from '$lib/actions/measure';
	import type {
		AxisConfig,
		YAxisConfig,
		DataPoint,
		PointerState,
		Dimensions,
		PopupPosition
	} from '$lib/types/chart';

	const props = $props<{
		data?: DataPoint[];
		series?: string[];
		colors?: string[];
		popupTemplate?: (item: DataPoint, series?: string) => string;
		xAxisLabel?: string;
		xAxisConfig?: AxisConfig;
		yAxisConfig?: YAxisConfig;
		margins?: {
			top?: number;
			right?: number;
			bottom?: number;
			left?: number;
		};
	}>();

	// Initialize props with default values
	const data = $derived(props.data ?? []);
	const series = $derived(props.series ?? []);
	const colors = $derived(props.colors ?? []);
	const xAxisLabel = $derived(props.xAxisLabel ?? 'x');

	const popupTemplate = $derived(
		props.popupTemplate ??
			((item: DataPoint, series?: string) => `
  <div class="bg-white shadow-lg rounded p-2">
    ${series ? `${series}: ${item[series]}` : `Value: ${item.value}`}
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
			filter: (value, index) => true,
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

	let pointer = $state<PointerState & { series?: string }>({
		x: 0,
		y: [],
		show: false,
		data: null,
		index: -1
	});

	let containerWidth = $state(0);
	let containerHeight = $state(0);
	let popupDimensions = $state<Dimensions>({ width: 0, height: 0 });

	// Derived values
	let margin = $derived({
		top: props.margins?.top ?? 20,
		right: props.margins?.right ?? 30,
		bottom:
			(props.margins?.bottom ?? yAxisConfig.filter === (() => false))
				? 20
				: xAxisConfig.padding + xAxisConfig.fontSize * 1.5,
		left:
			(props.margins?.left ?? yAxisConfig.filter === (() => false))
				? 30
				: yAxisConfig.padding + yAxisConfig.fontSize * 3.5
	});

	let actualWidth = $derived(Math.max(containerWidth || 0, margin.left + margin.right + 100));
	let actualHeight = $derived(Math.max(containerHeight || 0, margin.top + margin.bottom + 50));

	let validColors = $derived(
		colors.length >= series.length
			? colors
			: [...colors, ...Array(series.length - colors.length).fill('#9e9e9e')]
	);

	// Scales
	let xScale = $derived(
		d3
			.scaleLinear()
			.domain([0, Math.max(1, (data?.length || 1) - 1)])
			.range([margin.left, actualWidth - margin.right])
	);

	let yScale = $derived(
		d3
			.scaleLinear()
			.domain([yAxisConfig.min, yAxisConfig.max])
			.range([actualHeight - margin.bottom, margin.top])
	);

	$effect(() => {
		if (svgRef && data?.length > 0 && actualWidth > 0 && actualHeight > 0) {
			render(d3.select(svgRef));
		}
	});

	function renderAxisAndGrid(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
		// Calculate Y-axis ticks
		const yTicks = d3.range(
			yAxisConfig.min,
			yAxisConfig.max + yAxisConfig.interval,
			yAxisConfig.interval
		);

		// Add grid lines
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

		// Add Y axis labels
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

		// Add axes
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

		// Add X axis labels
		const xTicks = d3
			.range(0, data.length, xAxisConfig.interval)
			.filter((index) => xAxisConfig.filter(data[index]?.[xAxisLabel], index));

		svg
			.selectAll('.x-axis-label')
			.data(xTicks)
			.join('text')
			.attr('class', 'x-axis-label')
			.attr('x', (d) => xScale(d))
			.attr('y', actualHeight - margin.bottom + xAxisConfig.padding)
			.attr('text-anchor', 'middle')
			.attr('fill', xAxisConfig.color)
			.attr('font-size', xAxisConfig.fontSize)
			.attr('transform', (d) => {
				const x = xScale(d);
				const y = actualHeight - margin.bottom + xAxisConfig.padding;
				return `rotate(${xAxisConfig.rotation}, ${x}, ${y})`;
			})
			.text((d) => xAxisConfig.format(data[d]?.[xAxisLabel]));
	}

	function render(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
		if (!data?.length || !series?.length) return;

		// Clear previous content
		svg.selectAll('*').remove();

		// Render axes and grid
		renderAxisAndGrid(svg);

		// Add lines
		series.forEach((seriesName, i) => {
			const line = d3
				.line<DataPoint>()
				.x((_, i) => xScale(i))
				.y((d) => {
					const value = d[seriesName];
					return typeof value === 'number' ? yScale(value) : yScale(yAxisConfig.min);
				})
				.defined((d) => typeof d[seriesName] === 'number');

			svg
				.append('path')
				.datum(data)
				.attr('class', 'line')
				.attr('fill', 'none')
				.attr('stroke', validColors[i])
				.attr('stroke-width', 4)
				.attr('d', line);
		});

		// Add focus elements if pointer is active
		if (pointer.show) {
			addFocusElements(svg);
		}
	}

	function addFocusElements(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
		if (!pointer.show) return;

		// Add vertical line
		svg
			.append('line')
			.attr('class', 'focus-element')
			.attr('x1', pointer.x)
			.attr('x2', pointer.x)
			.attr('y1', margin.top)
			.attr('y2', actualHeight - margin.bottom)
			.attr('stroke', '#e0e0e0')
			.attr('stroke-width', 1)
			.attr('stroke-opacity', 0.3);

		// Add focus points
		series.forEach((seriesName, i) => {
			if (!pointer.data || typeof pointer.data[seriesName] !== 'number') return;

			const focusGroup = svg.append('g').attr('class', 'focus-element');

			// Ripple circles
			[
				{ r: 6.5, opacity: 0.05 },
				{ r: 5.5, opacity: 0.1 },
				{ r: 4.5, opacity: 0.25 }
			].forEach(({ r, opacity }) => {
				focusGroup
					.append('circle')
					.attr('cx', pointer.x)
					.attr('cy', pointer.y[i])
					.attr('r', r)
					.attr('stroke', '#000000')
					.attr('stroke-width', 1)
					.attr('stroke-opacity', opacity)
					.attr('fill', 'none');
			});

			// Center point
			focusGroup
				.append('circle')
				.attr('cx', pointer.x)
				.attr('cy', pointer.y[i])
				.attr('r', 4)
				.attr('fill', validColors[i]);
		});
	}

	function handleMouseMove(event: MouseEvent) {
		if (!svgRef || !data?.length) return;

		const rect = svgRef.getBoundingClientRect();
		const xPos = Math.max(
			margin.left,
			Math.min(actualWidth - margin.right, event.clientX - rect.left)
		);
		const xValue = xScale.invert(xPos);
		const index = Math.round(Math.max(0, Math.min(data.length - 1, xValue)));

		if (index >= 0 && index < data.length) {
			const item = data[index];
			const seriesY = series
				.map((s) => {
					const value = item[s];
					return typeof value === 'number' ? yScale(value) : null;
				})
				.filter((y): y is number => y !== null);

			if (seriesY.length > 0) {
				pointer = {
					x: xScale(index),
					y: seriesY,
					show: true,
					data: item,
					index
				};
				render(d3.select(svgRef));
			}
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
		pointer: PointerState,
		margin: any,
		width: number,
		height: number,
		popup: Dimensions
	): PopupPosition {
		if (!pointer.show || !pointer.data || width <= 0 || height <= 0) {
			return { left: 0, top: 0 };
		}

		const padding = 16;
		const gap = 32; // Distance between popup and hovered points

		// Try positioning to the left first
		let left = pointer.x - popup.width - gap;

		// If it doesn't fit on the left, position to the right
		if (left < margin.left + padding) {
			left = pointer.x + gap;
		}

		// Ensure popup stays within horizontal bounds
		left = Math.max(
			margin.left + padding,
			Math.min(width - margin.right - popup.width - padding, left)
		);

		// Calculate optimal vertical position by averaging all point positions
		const averageY = pointer.y.reduce((sum, y) => sum + y, 0) / pointer.y.length;
		// Center the popup vertically relative to the average point position
		let top = averageY - popup.height / 2;

		// Ensure popup stays within vertical bounds
		top = Math.max(
			margin.top + padding,
			Math.min(height - margin.bottom - popup.height - padding, top)
		);

		return { left, top };
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
	aria-label="Interactive line chart visualization"
>
	{#if actualWidth > 0 && actualHeight > 0}
		<svg bind:this={svgRef} width={actualWidth} height={actualHeight} role="presentation" />
	{/if}

	{#if pointer.show && pointer.data}
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
