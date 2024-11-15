<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { StarChartAxis, StarChartProps } from '$lib/types/chart';

	const props = $props<StarChartProps>();

	// Initialize props with default values
	const data = $derived(props.data ?? []);
	const axes = $derived(props.axes ?? []);

	// Default configurations
	const defaultGridConfig: Required<NonNullable<StarChartProps['gridConfig']>> = {
		circleCount: 4,
		lineColor: '#e5e7eb',
		lineWidth: 1,
		showLabels: true,
		labelStyle: {
			fontSize: 12,
			color: '#9ca3af',
			format: (value: number) => `${value.toFixed(0)}%`
		}
	};

	const defaultAxisConfig: Required<NonNullable<StarChartProps['axisConfig']>> = {
		lineColor: '#e5e7eb',
		lineWidth: 1,
		labelStyle: {
			fontSize: 14,
			color: '#9ca3af',
			distance: 20
		}
	};

	const defaultSeriesConfig: Required<NonNullable<StarChartProps['seriesConfig']>> = {
		lineWidth: 4,
		pointSize: 4,
		showPoints: true,
		fill: false,
		fillOpacity: 0.2
	};

	// Merge provided configs with defaults
	const gridConfig = $derived({ ...defaultGridConfig, ...props.gridConfig });
	const axisConfig = $derived({ ...defaultAxisConfig, ...props.axisConfig });
	const seriesConfig = $derived({ ...defaultSeriesConfig, ...props.seriesConfig });

	// Rest of the component logic remains similar, but using the new config values
	function getAxisBounds(axisKey: string) {
		const axis = axes.find((a) => a.key === axisKey)!;
		const values = data.map((d) => d.values[axisKey]).filter((v) => v !== undefined);

		const minValue = axis.minValue ?? Math.min(0, ...values);
		const maxValue = axis.maxValue ?? Math.max(...values);

		return { minValue, maxValue };
	}

	// Local state
	let chart: HTMLDivElement;
	let svgRef = $state<SVGSVGElement | null>(null);
	let resizeObserver: ResizeObserver;

	let containerWidth = $state(0);
	let containerHeight = $state(0);

	let margin = $derived({
		top: props.margins?.top ?? 40,
		right: props.margins?.right ?? 40,
		bottom: props.margins?.bottom ?? 40,
		left: props.margins?.left ?? 40
	});

	let actualWidth = $derived(Math.max(containerWidth || 0, margin.left + margin.right + 100));
	let actualHeight = $derived(Math.max(containerHeight || 0, margin.top + margin.bottom + 100));

	let centerX = $derived(actualWidth / 2);
	let centerY = $derived(actualHeight / 2);
	let radius = $derived(
		Math.min(actualWidth - margin.left - margin.right, actualHeight - margin.top - margin.bottom) /
			2
	);

	function getScaleForAxis(axis: StarChartAxis) {
		const { minValue, maxValue } = getAxisBounds(axis.key);
		return d3.scaleLinear().domain([minValue, maxValue]).range([0, radius]);
	}

	function render(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
		svg.selectAll('*').remove();

		const numAxes = axes.length;
		const angleStep = (2 * Math.PI) / numAxes;

		// Draw circular grid lines
		const firstAxisBounds = getAxisBounds(axes[0].key);
		const valueRange = firstAxisBounds.maxValue - firstAxisBounds.minValue;
		const valueStep = valueRange / gridConfig.circleCount;

		// Draw concentric circles for the grid
		for (let i = 1; i <= gridConfig.circleCount; i++) {
			const value = firstAxisBounds.minValue + i * valueStep;
			const rScale = getScaleForAxis(axes[0]);
			const r = rScale(value);

			svg
				.append('circle')
				.attr('cx', centerX)
				.attr('cy', centerY)
				.attr('r', r)
				.attr('fill', 'none')
				.attr('stroke', gridConfig.lineColor)
				.attr('stroke-width', gridConfig.lineWidth);

			if (gridConfig.showLabels) {
				const labelX = centerX;
				const labelY = centerY - r;

				svg
					.append('text')
					.attr('x', labelX)
					.attr('y', labelY)
					.attr('dy', -4)
					.attr('text-anchor', 'middle')
					.attr('font-size', gridConfig.labelStyle.fontSize)
					.attr('fill', gridConfig.labelStyle.color)
					.text(gridConfig.labelStyle.format(value));
			}
		}

		// Draw axes lines and labels
		axes.forEach((axis, axisIndex) => {
			const angle = axisIndex * angleStep - Math.PI / 2;
			const rScale = getScaleForAxis(axis);

			const x2 = centerX + radius * Math.cos(angle);
			const y2 = centerY + radius * Math.sin(angle);

			svg
				.append('line')
				.attr('x1', centerX)
				.attr('y1', centerY)
				.attr('x2', x2)
				.attr('y2', y2)
				.attr('stroke', axisConfig.lineColor)
				.attr('stroke-width', axisConfig.lineWidth);

			const labelRadius = radius + axisConfig.labelStyle.distance;
			const labelX = centerX + labelRadius * Math.cos(angle);
			const labelY = centerY + labelRadius * Math.sin(angle);

			svg
				.append('text')
				.attr('x', labelX)
				.attr('y', labelY)
				.attr('text-anchor', 'middle')
				.attr('dominant-baseline', 'middle')
				.attr('font-size', axisConfig.labelStyle.fontSize)
				.attr('fill', axisConfig.labelStyle.color)
				.text(axis.label);
		});

		// Draw data series
		data.forEach((series) => {
			const points = axes.map((axis, i) => {
				const value = series.values[axis.key];
				const rScale = getScaleForAxis(axis);
				const r = rScale(value);
				const angle = i * angleStep - Math.PI / 2;
				return [centerX + r * Math.cos(angle), centerY + r * Math.sin(angle)];
			});
			points.push(points[0]); // Close the shape

			// Draw filled area if enabled
			if (seriesConfig.fill) {
				svg
					.append('path')
					.datum(points)
					.attr('d', d3.line())
					.attr('fill', series.color)
					.attr('fill-opacity', seriesConfig.fillOpacity);
			}

			// Draw the connecting lines
			svg
				.append('path')
				.datum(points)
				.attr('d', d3.line())
				.attr('fill', 'none')
				.attr('stroke', series.color)
				.attr('stroke-width', seriesConfig.lineWidth);

			// Draw the points
			if (seriesConfig.showPoints) {
				points.slice(0, -1).forEach(([x, y]) => {
					svg
						.append('circle')
						.attr('cx', x)
						.attr('cy', y)
						.attr('r', seriesConfig.pointSize)
						.attr('fill', series.color);
				});
			}
		});
	}

	function handleResize() {
		if (!chart) return;
		const rect = chart.getBoundingClientRect();
		containerWidth = rect.width;
		containerHeight = rect.height;
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
</script>

<div
	class="relative h-full w-full"
	bind:this={chart}
	role="img"
	aria-label="Star chart visualization"
>
	{#if actualWidth > 0 && actualHeight > 0}
		<svg bind:this={svgRef} width={actualWidth} height={actualHeight} />
	{/if}
</div>
