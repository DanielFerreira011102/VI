<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import type { StarChartAxis, StarChartProps } from '$lib/types/chart';

	const props = $props<StarChartProps>();

	// Initialize props with default values and ensure we have at least one axis
	const data = $derived(props.data ?? []);
	const axes = $derived(props.axes ?? []);

	// Default configurations
	const defaultGridConfig: Required<NonNullable<StarChartProps['gridConfig']>> = {
		circleCount: 4,
		lineColor: '#e5e7eb',
		lineWidth: 1
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

	// Default axis grid config
	const defaultAxisGridConfig = {
		format: (value: number, _index: number, _total: number) => value.toString(),
		fontSize: 12,
		color: '#9ca3af',
		filter: (_: number, _i: number, _t: number) => true,
		offsetX: 0,
		offsetY: 0
	};

	// Merge provided configs with defaults
	const gridConfig = $derived({ ...defaultGridConfig, ...props.gridConfig });
	const axisConfig = $derived({ ...defaultAxisConfig, ...props.axisConfig });
	const seriesConfig = $derived({ ...defaultSeriesConfig, ...props.seriesConfig });

	function getAxisBounds(axisKey: string) {
		const axis = axes.find((a) => a.key === axisKey);
		if (!axis) return { minValue: 0, maxValue: 100 }; // Default bounds if axis not found

		const values = data.map((d) => d.values[axisKey]).filter((v): v is number => v !== undefined);
		if (values.length === 0) return { minValue: 0, maxValue: 100 }; // Default bounds if no values

		// Get the actual min and max from the data
		const dataMin = Math.min(...values);
		const dataMax = Math.max(...values);

		// autoScale defaults to true if not explicitly set to false
		if (axis.autoScale !== false) {
			const minValue = axis.minValue !== undefined ? Math.min(axis.minValue, dataMin) : dataMin;
			const maxValue = axis.maxValue !== undefined ? Math.max(axis.maxValue, dataMax) : dataMax;
			return { minValue, maxValue };
		} else {
			const minValue = axis.minValue ?? dataMin;
			const maxValue = axis.maxValue ?? dataMax;
			return { minValue, maxValue };
		}
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
		const scale = d3.scaleLinear().domain([minValue, maxValue]).range([0, radius]);

		// Only clamp if autoScale is explicitly set to false
		if (axis.autoScale === false) {
			scale.clamp(true);
		}

		return scale;
	}

	function render(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
		if (axes.length === 0) return;

		svg.selectAll('*').remove();

		const numAxes = axes.length;
		const angleStep = (2 * Math.PI) / numAxes;

		// Draw grid circles and labels for each axis
		axes.forEach((axis, axisIndex) => {
			const axisBounds = getAxisBounds(axis.key);
			const valueRange = axisBounds.maxValue - axisBounds.minValue;
			const valueStep = valueRange / gridConfig.circleCount;
			const angle = axisIndex * angleStep - Math.PI / 2;

			// Merge axis grid config with defaults
			const axisGridConfig = {
				...defaultAxisGridConfig,
				...axis.gridConfig
			};

			// Draw grid lines and labels
			for (let i = 1; i <= gridConfig.circleCount; i++) {
				const value = axisBounds.minValue + i * valueStep;
				const rScale = getScaleForAxis(axis);
				const r = rScale(value);

				// Only draw the circle for the first axis to avoid overlapping
				if (axisIndex === 0) {
					svg
						.append('circle')
						.attr('cx', centerX)
						.attr('cy', centerY)
						.attr('r', r)
						.attr('fill', 'none')
						.attr('stroke', gridConfig.lineColor)
						.attr('stroke-width', gridConfig.lineWidth);
				}

				// Draw label if it passes the filter
				if (axisGridConfig.filter(value, i, gridConfig.circleCount)) {
					const labelX = centerX + r * Math.cos(angle);
					const labelY = centerY + r * Math.sin(angle);

					// Calculate text anchor based on angle
					const textAnchor =
						Math.abs(angle + Math.PI / 2) < 0.1
							? 'middle'
							: angle < -Math.PI
								? 'start'
								: angle < 0
									? 'end'
									: angle < Math.PI
										? 'start'
										: 'end';

					svg
						.append('text')
						.attr('x', labelX + (axisGridConfig.offsetX ?? 0)) // Add X offset
						.attr('y', labelY + (axisGridConfig.offsetY ?? 0)) // Add Y offset
						.attr('dy', '0.3em')
						.attr('text-anchor', textAnchor)
						.attr('font-size', axisGridConfig.fontSize)
						.attr('fill', axisGridConfig.color)
						.text(axisGridConfig.format(value, i, gridConfig.circleCount));
				}
			}

			// Draw axis line
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

			// Draw axis label
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

			const closedPoints = [...points, points[0]];

			// Draw filled area if enabled
			if (seriesConfig.fill) {
				svg
					.append('path')
					.datum(closedPoints)
					.attr('d', d3.line()!)
					.attr('fill', series.color)
					.attr('fill-opacity', seriesConfig.fillOpacity);
			}

			// Draw the connecting lines
			svg
				.append('path')
				.datum(closedPoints)
				.attr('d', d3.line()!)
				.attr('fill', 'none')
				.attr('stroke', series.color)
				.attr('stroke-width', seriesConfig.lineWidth);

			// Draw the points
			if (seriesConfig.showPoints) {
				points.forEach(([x, y]) => {
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

	// Add effect to trigger render when data, axes, or dimensions change
	$effect(() => {
		if (svgRef && data && axes.length > 0 && actualWidth > 0 && actualHeight > 0) {
			render(d3.select(svgRef));
		}
	});

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
	{#if actualWidth > 0 && actualHeight > 0 && axes.length > 0}
		<svg bind:this={svgRef} width={actualWidth} height={actualHeight} />
	{/if}
</div>
