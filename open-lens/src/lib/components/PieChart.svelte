<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import { measure } from '$lib/actions/measure';
	import type { Dimensions, Margin, Position } from '$lib/types/chart';
	import Main from './Main.svelte';

	type PieChartDataPoint = {
		label: string;
		value: number;
		[key: string]: any;
	};

	type PieChartPointerState = {
		x: number;
		y: number;
		show: boolean;
		data: PieChartDataPoint | null;
		index: number;
	};

	type PieChartSeriesConfig = {
		/** Inner radius ratio (0-1), 0 for pie, >0 for donut */
		innerRadius?: number;
		/** Padding between sectors in degrees */
		padAngle?: number;
		/** Corner radius for sectors */
		cornerRadius?: number;
		/** Whether to show hover effects */
		showHoverEffects?: boolean;
		/** Style for hover effects */
		hoverStyle?: {
			borderWidth?: number;
			borderOpacity?: number;
		};
	};

	type PieChartProps = {
		/** The data to be displayed */
		data?: PieChartDataPoint[];
		/** Colors for each slice */
		colors?: string[];
		/** Function to generate popup content */
		popupTemplate?: (item: PieChartDataPoint, index: number) => string;
		/** Chart margins */
		margins?: {
			top?: number;
			right?: number;
			bottom?: number;
			left?: number;
		};
		/** Series appearance configuration */
		seriesConfig?: PieChartSeriesConfig;
	};

	const props = $props<PieChartProps>();

	// Initialize props with default values
	const data = $derived(props.data ?? []);
	const colors = $derived(props.colors ?? []);

	const margin = $derived({
		top: props.margins?.top ?? 20,
		right: props.margins?.right ?? 20,
		bottom: props.margins?.bottom ?? 20,
		left: props.margins?.left ?? 20
	});

	const seriesConfig = $derived(
		props.seriesConfig ?? {
			innerRadius: 0.6,
			padAngle: 0.02,
			cornerRadius: 4,
			showHoverEffects: true,
			hoverStyle: {
				borderWidth: 2.5,
				borderOpacity: 0.3
			}
		}
	);

	const popupTemplate = $derived(
		props.popupTemplate ??
			((item: PieChartDataPoint, index: number) => `
        <div class="bg-white shadow-lg rounded p-2">
          <div>${item.label}: ${item.value}</div>
        </div>
      `)
	);

	// Local state
	let chart: HTMLDivElement;
	let svgRef = $state<SVGSVGElement | null>(null);
	let resizeObserver: ResizeObserver;

	let pointer = $state<PieChartPointerState>({
		x: 0,
		y: 0,
		show: false,
		data: null,
		index: -1
	});

	let containerWidth = $state(0);
	let containerHeight = $state(0);
	let popupDimensions = $state<Dimensions>({ width: 0, height: 0 });

	// Derived values
	let actualWidth = $derived(Math.max(containerWidth || 0, margin.left + margin.right + 100));
	let actualHeight = $derived(Math.max(containerHeight || 0, margin.top + margin.bottom + 100));
	let radius = $derived(
		Math.min(actualWidth - margin.left - margin.right, actualHeight - margin.top - margin.bottom) /
			2
	);

	let validColors = $derived(
		colors.length >= data.length
			? colors
			: [...colors, ...Array(data.length - colors.length).fill('#9e9e9e')]
	);

	let pie = $derived(
		d3
			.pie<PieChartDataPoint>()
			.value((d) => d.value)
			.padAngle(seriesConfig.padAngle)
	);

	let arc = $derived(
		d3
			.arc<d3.PieArcDatum<PieChartDataPoint>>()
			.innerRadius(radius * (seriesConfig.innerRadius ?? 0))
			.outerRadius(radius)
			.cornerRadius(seriesConfig.cornerRadius ?? 0)
	);

	$effect(() => {
		if (svgRef && data?.length > 0 && actualWidth > 0 && actualHeight > 0) {
			render(d3.select(svgRef));
		}
	});

	function render(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
		if (!data?.length) return;

		svg.selectAll('*').remove();

		const g = svg
			.append('g')
			.attr('transform', `translate(${actualWidth / 2},${actualHeight / 2})`);

		const arcs = pie(data);

		// Create a group for each sector
		const sectors = g.selectAll('.sector-group').data(arcs).join('g').attr('class', 'sector-group');

		// Render base sectors
		sectors
			.append('path')
			.attr('class', 'sector')
			.attr('d', arc)
			.attr('fill', (_, i) => validColors[i]);

		// Add hover effect
        if (pointer.show && pointer.data && seriesConfig.showHoverEffects) {
    const hoveredArc = arcs[pointer.index];
    const { borderWidth = 2.5, borderOpacity = 0.3 } = seriesConfig.hoverStyle ?? {};

    [-0.5, -1.5, -2.5].forEach((offset, i) => {
        const opacity = borderOpacity * [1, 0.5, 0.2][i];
        const angleOffset = offset / radius;
        
        // Create arc with offset on all sides
        const borderArc = d3
            .arc<d3.PieArcDatum<PieChartDataPoint>>()
            .innerRadius(radius * (seriesConfig.innerRadius ?? 0) + offset)
            .outerRadius(radius - offset)
            .startAngle(hoveredArc.startAngle + angleOffset)
            .endAngle(hoveredArc.endAngle - angleOffset)
            .cornerRadius(seriesConfig.cornerRadius ?? 0);

        // Add the border arc
        g.append('path')
            .attr('d', borderArc(hoveredArc))
            .attr('fill', 'none')
            .attr('stroke', '#000000')
            .attr('stroke-width', borderWidth)
            .attr('stroke-opacity', opacity);
    });
}
	}

	function handleMouseMove(event: MouseEvent) {
		if (!svgRef || !data?.length) return;

		// Get coordinates relative to the SVG element
		const [x, y] = d3.pointer(event, svgRef);

		// Convert to local coordinates (relative to pie center)
		const centerX = actualWidth / 2;
		const centerY = actualHeight / 2;
		const [localX, localY] = [x - centerX, y - centerY];

		// Calculate angle and radius
		const r = Math.sqrt(localX * localX + localY * localY);
		let angle = Math.atan2(localY, localX);

		// Convert angle to [0, 2π] range
		if (angle < 0) {
			angle += 2 * Math.PI;
		}

		const arcs = pie(data);
		let found = false;

		for (let i = 0; i < arcs.length; i++) {
			const arcData = arcs[i];

			// Normalize angles to [0, 2π] range
			let startAngle = arcData.startAngle - Math.PI / 2;
			let endAngle = arcData.endAngle - Math.PI / 2;

			if (startAngle < 0) startAngle += 2 * Math.PI;
			if (endAngle < 0) endAngle += 2 * Math.PI;

			// Check if point is within sector
			let isWithinAngles;
			if (startAngle <= endAngle) {
				isWithinAngles = angle >= startAngle && angle <= endAngle;
			} else {
				// Handle case when sector crosses 0
				isWithinAngles = angle >= startAngle || angle <= endAngle;
			}

			const innerRadius = radius * (seriesConfig.innerRadius ?? 0);
			const isWithinRadius = r >= innerRadius && r <= radius;

			if (isWithinAngles && isWithinRadius) {
				pointer = {
					x,
					y,
					show: true,
					data: arcData.data,
					index: i
				};
				found = true;
				break;
			}
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
		pointer: PieChartPointerState,
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

		let x = pointer.x + gap;
		let y = pointer.y - popup.height / 2;

		// Ensure popup stays within bounds
		x = Math.max(margin.left + padding, Math.min(width - margin.right - popup.width - padding, x));
		y = Math.max(
			margin.top + padding,
			Math.min(height - margin.bottom - popup.height - padding, y)
		);

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
	aria-label="Interactive pie chart visualization"
>
	{#if actualWidth > 0 && actualHeight > 0}
		<svg bind:this={svgRef} width={actualWidth} height={actualHeight} role="presentation" />
	{/if}

	{#if pointer.show && pointer.data}
		<div
			use:measure={handleMeasure}
			class="pointer-events-none absolute"
			style="left: {popupPosition.x}px; top: {popupPosition.y}px;"
			role="tooltip"
		>
			{@html popupTemplate(pointer.data, pointer.index)}
		</div>
	{/if}
</div>
