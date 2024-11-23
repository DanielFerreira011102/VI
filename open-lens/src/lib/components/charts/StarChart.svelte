<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import { measure } from '$lib/actions/measure';
	import type { Dimensions, Position } from '$lib/types/chart';
	import type {
		StarChartAxis,
		StarChartDataPoint,
		StarChartProps,
		StarChartPointerState
	} from '$lib/types/charts';

	const props = $props<StarChartProps>();

	const data = $derived(props.data ?? []);
	const axes = $derived(props.axes ?? []);

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
		fillOpacity: 0.2,
		showHoverEffects: true,
		hoverStyle: {
			fillOpacity: 0.1,
			lineOpacity: 0.2
		}
	};

	const defaultAxisGridConfig = {
		format: (value: number, _index: number, _total: number) => value.toString(),
		fontSize: 12,
		color: '#9ca3af',
		filter: (_: number, _i: number, _t: number) => true,
		offsetX: 0,
		offsetY: 0
	};

	let pointer = $state<StarChartPointerState>({
		show: false,
		x: 0,
		y: 0,
		data: null,
		index: -1,
		anchorPoints: [] // Array of points forming the polygon for the highlighted series
	});

	let popupDimensions = $state<Dimensions>({ width: 0, height: 0 });

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

	// Merge provided configs with defaults
	const gridConfig = $derived({ ...defaultGridConfig, ...props.gridConfig });
	const axisConfig = $derived({ ...defaultAxisConfig, ...props.axisConfig });
	const seriesConfig = $derived({ ...defaultSeriesConfig, ...props.seriesConfig });

	function defaultPopoverTemplate(data: StarChartDataPoint, index: number) {
		return `
				<div class="bg-white shadow-lg rounded p-2">
					<div class="font-semibold" style="color: ${data.color}">
						${data.label}
					</div>
					<div class="space-y-1">
						${Object.entries(data.values)
							.map(
								([key, value]) =>
									`<div>${axes.find((a) => a.key === key)?.label ?? key}: ${value}</div>`
							)
							.join('')}
					</div>
				</div>
			`;
	}

	const popupTemplate = $derived(props.popupTemplate ?? defaultPopoverTemplate);

	function getAxisBounds(axisKey: string) {
		const axis = axes.find((a) => a.key === axisKey);
		if (!axis) return { minValue: 0, maxValue: 100 };

		const values = data.map((d) => d.values[axisKey]).filter((v): v is number => v !== undefined);
		if (values.length === 0) return { minValue: 0, maxValue: 100 };

		const dataMin = Math.min(...values);
		const dataMax = Math.max(...values);

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

	function getScaleForAxis(axis: StarChartAxis) {
		const { minValue, maxValue } = getAxisBounds(axis.key);
		const scale = d3.scaleLinear().domain([minValue, maxValue]).range([0, radius]);

		if (axis.autoScale === false) {
			scale.clamp(true);
		}

		return scale;
	}

	function calculatePopupPosition(
		points: [number, number][],
		dimensions: Dimensions,
		margin: { top: number; right: number; bottom: number; left: number }
	): Position {
		if (!points.length) return { x: 0, y: 0 };

		const padding = 16;

		// Find the bounding box of the highlighted series
		const minX = Math.min(...points.map((p) => p[0]));
		const maxX = Math.max(...points.map((p) => p[0]));
		const minY = Math.min(...points.map((p) => p[1]));
		const maxY = Math.max(...points.map((p) => p[1]));

		// Calculate the center of the bounding box
		const centerY = (minY + maxY) / 2;

		// First attempt: Try right side with some adjustments to avoid center
		let x = maxX + padding;
		let y = centerY - dimensions.height / 2;

		// If we're too close to the vertical center, shift up or down
		const verticalCenter = actualHeight / 2;
		if (Math.abs(y + dimensions.height / 2 - verticalCenter) < dimensions.height / 4) {
			// If there's more room above, shift up; otherwise, shift down
			if (y > verticalCenter) {
				y = Math.max(y - dimensions.height / 2, margin.top + padding);
			} else {
				y = Math.min(
					y + dimensions.height / 2,
					actualHeight - margin.bottom - dimensions.height - padding
				);
			}
		}

		// If it would overflow right edge, try left side
		if (x + dimensions.width > actualWidth - margin.right) {
			x = minX - dimensions.width - padding;
		}

		// Only as a last resort, if both left and right don't work,
		// position below (never in the center)
		if (x < margin.left || x + dimensions.width > actualWidth - margin.right) {
			x = Math.min(
				Math.max(maxX - dimensions.width + padding, margin.left + padding),
				actualWidth - margin.right - dimensions.width - padding
			);
			y = maxY + padding;

			// If it would overflow bottom, put it above
			if (y + dimensions.height > actualHeight - margin.bottom) {
				y = minY - dimensions.height - padding;
			}
		}

		// Final bounds check
		x = Math.max(
			margin.left + padding,
			Math.min(x, actualWidth - margin.right - dimensions.width - padding)
		);
		y = Math.max(
			margin.top + padding,
			Math.min(y, actualHeight - margin.bottom - dimensions.height - padding)
		);

		return { x, y };
	}
	function getClosestPoint(
		mouseX: number,
		mouseY: number
	): { point: StarChartDataPoint; points: [number, number][]; index: number } | null {
		let closestPoint = null;
		let minDistance = Infinity;

		data.forEach((series, seriesIndex) => {
			const points = axes.map((axis, i) => {
				const value = series.values[axis.key];
				const rScale = getScaleForAxis(axis);
				const r = rScale(value);
				const angle = (i * 2 * Math.PI) / axes.length - Math.PI / 2;
				return [centerX + r * Math.cos(angle), centerY + r * Math.sin(angle)] as [number, number];
			});

			for (let i = 0; i < points.length; i++) {
				const p1 = points[i];
				const p2 = points[(i + 1) % points.length];

				const distance = distToSegment(mouseX, mouseY, p1[0], p1[1], p2[0], p2[1]);

				if (distance < minDistance && distance < 20) {
					minDistance = distance;
					closestPoint = {
						point: series,
						points: points,
						index: seriesIndex
					};
				}
			}
		});

		return closestPoint;
	}

	function distToSegment(
		x: number,
		y: number,
		x1: number,
		y1: number,
		x2: number,
		y2: number
	): number {
		const A = x - x1;
		const B = y - y1;
		const C = x2 - x1;
		const D = y2 - y1;

		const dot = A * C + B * D;
		const len_sq = C * C + D * D;
		let param = -1;

		if (len_sq !== 0) param = dot / len_sq;

		let xx, yy;

		if (param < 0) {
			xx = x1;
			yy = y1;
		} else if (param > 1) {
			xx = x2;
			yy = y2;
		} else {
			xx = x1 + param * C;
			yy = y1 + param * D;
		}

		const dx = x - xx;
		const dy = y - yy;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function updateSeriesStyles() {
		if (!svgRef || !seriesConfig.showHoverEffects) return;

		const svg = d3.select(svgRef);

		svg.selectAll('.series-group').each(function (d: any) {
			const group = d3.select(this);
			const series = group.select('.series-path').datum() as StarChartDataPoint;
			const isHighlighted = pointer.show && pointer.data === series;

			// Update line opacity
			group
				.select('.series-path')
				.style(
					'opacity',
					pointer.show ? (isHighlighted ? 1 : seriesConfig.hoverStyle.lineOpacity) : 1
				)
				.style(
					'stroke-opacity',
					pointer.show ? (isHighlighted ? 1 : seriesConfig.hoverStyle.lineOpacity) : 1
				);

			// Update fill opacity separately
			if (seriesConfig.fill) {
				group
					.select('.series-area')
					.style('opacity', 1) // Keep base opacity at 1
					.style(
						'fill-opacity',
						pointer.show
							? isHighlighted
								? seriesConfig.fillOpacity
								: seriesConfig.hoverStyle.fillOpacity
							: seriesConfig.fillOpacity
					);
			}

			// Update points opacity
			group
				.selectAll('.series-point')
				.style(
					'opacity',
					pointer.show ? (isHighlighted ? 1 : seriesConfig.hoverStyle.lineOpacity) : 1
				);
		});
	}

	function handleMouseMove(event: MouseEvent) {
		if (!chart || !svgRef) return;

		const rect = chart.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		const closestPoint = getClosestPoint(x, y);

		if (closestPoint) {
			pointer = {
				show: true,
				x: x,
				y: y,
				data: closestPoint.point,
				index: closestPoint.index,
				anchorPoints: closestPoint.points
			};
		} else {
			pointer = {
				...pointer,
				show: false,
				data: null,
				index: -1,
				anchorPoints: []
			};
		}

		updateSeriesStyles();
	}

	function handleMouseLeave() {
		pointer = {
			...pointer,
			show: false,
			data: null,
			index: -1
		};
		updateSeriesStyles();
	}

	function handleMeasure(dimensions: Dimensions) {
		popupDimensions = dimensions;
	}

	function render(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
		if (axes.length === 0) return;

		svg.selectAll('*').remove();

		const numAxes = axes.length;
		const angleStep = (2 * Math.PI) / numAxes;

		axes.forEach((axis, axisIndex) => {
			const axisBounds = getAxisBounds(axis.key);
			const valueRange = axisBounds.maxValue - axisBounds.minValue;
			const valueStep = valueRange / gridConfig.circleCount;
			const angle = axisIndex * angleStep - Math.PI / 2;

			const axisGridConfig = {
				...defaultAxisGridConfig,
				...axis.gridConfig
			};

			for (let i = 1; i <= gridConfig.circleCount; i++) {
				const value = axisBounds.minValue + i * valueStep;
				const rScale = getScaleForAxis(axis);
				const r = rScale(value);

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

				if (axisGridConfig.filter(value, i, gridConfig.circleCount)) {
					const labelX = centerX + r * Math.cos(angle);
					const labelY = centerY + r * Math.sin(angle);

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
						.attr('x', labelX + (axisGridConfig.offsetX ?? 0))
						.attr('y', labelY + (axisGridConfig.offsetY ?? 0))
						.attr('dy', '0.3em')
						.attr('text-anchor', textAnchor)
						.attr('font-size', axisGridConfig.fontSize)
						.attr('fill', axisGridConfig.color)
						.text(axisGridConfig.format(value, i, gridConfig.circleCount));
				}
			}

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

		data.forEach((series) => {
			const points = axes.map((axis, i) => {
				const value = series.values[axis.key];
				const rScale = getScaleForAxis(axis);
				const r = rScale(value);
				const angle = i * angleStep - Math.PI / 2;
				return [centerX + r * Math.cos(angle), centerY + r * Math.sin(angle)];
			});

			const closedPoints = [...points, points[0]];
			const lineGenerator = d3.line();

			// Create a group for the series
			const seriesGroup = svg.append('g').attr('class', 'series-group');

			// Draw filled area if enabled
			if (seriesConfig.fill) {
				seriesGroup
					.append('path')
					.datum(series)
					.attr('class', 'series-area')
					.attr('d', lineGenerator(closedPoints))
					.attr('fill', series.color)
					.attr('stroke', 'none')
					.attr('fill-opacity', seriesConfig.fillOpacity);
			}

			// Draw the connecting lines
			seriesGroup
				.append('path')
				.datum(series)
				.attr('class', 'series-path')
				.attr('d', lineGenerator(closedPoints))
				.attr('fill', 'none')
				.attr('stroke', series.color)
				.attr('stroke-width', seriesConfig.lineWidth);

			// Draw the points
			if (seriesConfig.showPoints) {
				points.forEach((point) => {
					seriesGroup
						.append('circle')
						.datum({ series, point })
						.attr('class', 'series-point')
						.attr('cx', point[0])
						.attr('cy', point[1])
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
		if (svgRef) {
			render(d3.select(svgRef));
		}
	}

	onMount(() => {
		handleResize();
		resizeObserver = new ResizeObserver(() => {
			handleResize();
		});
		resizeObserver.observe(chart);
	});

	onDestroy(() => {
		if (resizeObserver) {
			resizeObserver.disconnect();
		}
	});

	$effect(() => {
		if (data && containerWidth > 0 && containerHeight > 0 && svgRef) {
			render(d3.select(svgRef));
		}
	});

	let popupPosition = $derived(
		pointer.show && pointer.data && pointer.anchorPoints.length
			? calculatePopupPosition(pointer.anchorPoints, popupDimensions, margin)
			: { x: 0, y: 0 }
	);
</script>

<div
	class="relative h-full w-full overflow-hidden outline-none"
	bind:this={chart}
	onmousemove={handleMouseMove}
	onmouseleave={handleMouseLeave}
	role="button"
	tabindex="0"
>
	{#if actualWidth > 0 && actualHeight > 0 && axes.length > 0}
		<svg bind:this={svgRef} width={actualWidth} height={actualHeight} />

		{#if pointer.show && pointer.data && seriesConfig.showHoverEffects}
			<div
				use:measure={handleMeasure}
				class="pointer-events-none absolute"
				style="left: {popupPosition.x}px; top: {popupPosition.y}px;"
				role="tooltip"
			>
				{@html popupTemplate(pointer.data, pointer.index)}
			</div>
		{/if}
	{/if}
</div>
