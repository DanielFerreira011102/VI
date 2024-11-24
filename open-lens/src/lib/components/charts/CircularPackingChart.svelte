<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';
	import { measure } from '$lib/actions/measure';
	import type { Dimensions, Position } from '$lib/types/chart';
	import type {
		HierarchyNode,
		CircularPackingPointerState,
		CircularPackingProps
	} from '$lib/types/chart';

	const props = $props<CircularPackingProps>();
	const data = $derived(props.data ?? { name: 'root', children: [] });
	const colors = $derived(
		props.colors ?? {
			'Group 1': { 1: '#FFE5B4', 2: '#FFD700' },
			'Group 2': { 1: '#E6E6FA', 2: '#9370DB' }
		}
	);

	const circleConfig = $derived(
		props.circleConfig ?? {
			padding: 10,
			levelStyle: {
				1: { strokeWidth: 2, strokeOpacity: 1, fillOpacity: 0.2 },
				2: { strokeWidth: 1.5, strokeOpacity: 0.8, fillOpacity: 0.3 }
			},
			showHoverEffects: true,
			hoverStyles: {
				strokeOpacity: 0.2,
				fillOpacity: 0.1
			}
		}
	);

	const labelConfig = $derived(
		props.labelConfig ?? {
			show: true,
			fontSize: 13,
			autoFitText: true,
			groupFontSizeMultiplier: 1.2,
			fontWeight: 400,
			color: '#333333',
			minRadiusToShow: 20,
			filter: (node: d3.HierarchyNode<HierarchyNode>) => node.depth > 1
		}
	);

	const popupTemplate = $derived(props.popupTemplate ?? defaultPopupTemplate);

	let chart: HTMLDivElement;
	let svgRef = $state<SVGSVGElement | null>(null);
	let resizeObserver: ResizeObserver;
	let nodes: d3.HierarchyNode<HierarchyNode>[] = [];
	let simulation: d3.Simulation<any, undefined> | null = null;

	let pointer = $state<CircularPackingPointerState>({
		x: 0,
		y: 0,
		show: false,
		data: null,
		depth: -1,
		highlightedNodes: new Set<d3.HierarchyNode<HierarchyNode>>()
	});

	let containerWidth = $state(0);
	let containerHeight = $state(0);
	let popupDimensions = $state<Dimensions>({ width: 0, height: 0 });

	const margin = {
		top: props.margins?.top ?? 20,
		right: props.margins?.right ?? 20,
		bottom: props.margins?.bottom ?? 20,
		left: props.margins?.left ?? 20
	};

	let actualWidth = $derived(Math.max(containerWidth || 0, margin.left + margin.right + 100));
	let actualHeight = $derived(Math.max(containerHeight || 0, margin.top + margin.bottom + 50));
	let innerWidth = $derived(actualWidth - margin.left - margin.right);
	let innerHeight = $derived(actualHeight - margin.top - margin.bottom);

	function defaultPopupTemplate(node: d3.HierarchyNode<HierarchyNode>) {
		const parentName = node.parent?.data.name === 'root' ? node.data.name : node.parent?.data.name;
		const color = getNodeColor(node);
		return `
					<div class="bg-white shadow-lg rounded p-2">
					<div class="font-semibold" style="color: ${color}">
						${node.data.name}
						<span class="text-xs text-gray-500">(depth: ${node.depth})</span>
					</div>
					${node.value ? `<div>Value: ${node.value}</div>` : ''}
					${node.children ? `<div>Children: ${node.children.length}</div>` : ''}
					</div>
				`;
	}

	function getNodeColor(node: d3.HierarchyNode<HierarchyNode>) {
		// Find the top-level parent (institution)
		let topParent = node;
		while (topParent.parent && topParent.parent.data.name !== 'root') {
			topParent = topParent.parent;
		}

		const institutionName = topParent.data.name;
		return colors[institutionName]?.[node.depth] || '#CCCCCC';
	}

	function calculateRadius(node: d3.HierarchyNode<HierarchyNode>): number {
		return (Math.sqrt(node.value || 50) * Math.min(innerWidth, innerHeight)) / 1000;
	}

	function isPointInCircle(px: number, py: number, cx: number, cy: number, r: number): boolean {
		const dx = px - cx;
		const dy = py - cy;
		return dx * dx + dy * dy <= r * r;
	}

	function findHoveredNode(x: number, y: number): d3.HierarchyNode<HierarchyNode> | null {
		return (
			nodes
				.slice()
				.sort((a, b) => (a.r || 0) - (b.r || 0))
				.find((node) => isPointInCircle(x, y, node.x || 0, node.y || 0, node.r || 0)) || null
		);
	}

	function updateCircleStyles() {
		if (!svgRef) return;

		const svg = d3.select(svgRef);
		svg.selectAll('circle').each(function (d: any) {
			const node = d as d3.HierarchyNode<HierarchyNode>;
			const isHighlighted = pointer.show && pointer.highlightedNodes.has(node);
			const defaultStyle = circleConfig.levelStyle?.[node.depth] ?? {
				strokeWidth: 2,
				strokeOpacity: 1,
				fillOpacity: 0.2
			};
			const hoverStyle = circleConfig.hoverStyles ?? {
				strokeOpacity: 0.2,
				fillOpacity: 0.1
			};

			d3.select(this)
				.style('fill', getNodeColor(node))
				.style('stroke', getNodeColor(node))
				.style(
					'fill-opacity',
					pointer.show
						? isHighlighted
							? defaultStyle.fillOpacity
							: hoverStyle.fillOpacity
						: defaultStyle.fillOpacity
				)
				.style(
					'stroke-opacity',
					pointer.show
						? isHighlighted
							? defaultStyle.strokeOpacity
							: hoverStyle.strokeOpacity
						: defaultStyle.strokeOpacity
				);
		});

		svg.selectAll('text').each(function (d: any) {
			const node = d as d3.HierarchyNode<HierarchyNode>;
			const isHighlighted = pointer.show && pointer.highlightedNodes.has(node);
			d3.select(this).style('opacity', pointer.show ? (isHighlighted ? 1 : 0.3) : 1);
		});
	}

	function packChildren(parentNode: d3.HierarchyNode<HierarchyNode>) {
		if (!parentNode.children) return;

		const tempData: HierarchyNode = {
			name: 'temp',
			children: parentNode.children.map((child) => child.data)
		};

		const tempHierarchy = d3
			.hierarchy(tempData)
			.sum((d) => d.value ?? 1)
			.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

		const parentRadius = parentNode.r ?? 0;
		const pack = d3
			.pack<HierarchyNode>()
			.size([parentRadius * 2, parentRadius * 2])
			.padding(circleConfig.padding);

		const packedChildren = pack(tempHierarchy);

		if (packedChildren.children) {
			parentNode.children.forEach((child, i) => {
				const packedChild = packedChildren.children![i];
				const parentX = parentNode.x ?? 0;
				const parentY = parentNode.y ?? 0;

				child.x = packedChild.x - parentRadius + parentX;
				child.y = packedChild.y - parentRadius + parentY;
				child.r = packedChild.r;

				// Recursively pack deeper levels
				if (child.children) {
					packChildren(child);
				}
			});
		}
	}

	function render(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
		if (!data || !data.children) return;

		svg.selectAll('*').remove();

		const container = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

		const hierarchy = d3.hierarchy(data).sum((d) => d.value || 1);

		const depth1Nodes = hierarchy.children || [];
		depth1Nodes.forEach((node) => {
			node.r = calculateRadius(node);
		});

		// Build complete node collection once
		nodes = [...depth1Nodes];
		depth1Nodes.forEach((node) => {
			packChildren(node);
			nodes = nodes.concat(node.descendants().slice(1));
		});

		if (simulation) simulation.stop();

		simulation = d3
			.forceSimulation(depth1Nodes)
			.force(
				'collision',
				d3.forceCollide().radius((d) => (d as any).r + circleConfig.padding)
			)
			.force('x', d3.forceX(innerWidth / 2).strength(0.1))
			.force('y', d3.forceY(innerHeight / 2).strength(0.1))
			.force('box', boxingForce())
			.on('tick', () => {
				// Only update positions during simulation
				depth1Nodes.forEach((node) => {
					packChildren(node);
				});
				updatePositions(container);
			});

		simulation.tick(300);

		// Final update after simulation is complete
		updateNodes(nodes, container);
	}

	function updateNodes(
		nodes: d3.HierarchyNode<HierarchyNode>[] = [],
		container: d3.Selection<SVGGElement, unknown, null, undefined>
	) {
		const allNodes = container.selectAll('.node').data(nodes, (d: any) => d.data.name);

		allNodes.exit().remove();

		const newNodes = allNodes.enter().append('g').attr('class', 'node');

		newNodes.append('circle');
		newNodes
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'middle')
			.style('pointer-events', 'none');

		const allNodesWithEnter = allNodes.merge(newNodes as any);

		allNodesWithEnter.each(function (node: any) {
			const group = d3.select(this);
			const style = circleConfig.levelStyle?.[node.depth] ?? {
				strokeWidth: 1,
				strokeOpacity: 0.5,
				fillOpacity: 0.3
			};

			// Update circle
			group
				.select('circle')
				.attr('r', node.r)
				.attr('fill', getNodeColor(node))
				.attr('fill-opacity', style.fillOpacity)
				.attr('stroke', getNodeColor(node))
				.attr('stroke-width', style.strokeWidth)
				.attr('stroke-opacity', style.strokeOpacity);

			// Update label
			const label = group.select('text');
			if (labelConfig.show && labelConfig.filter(node) && node.r >= labelConfig.minRadiusToShow) {
				label
					.attr('font-size', labelConfig.fontSize)
					.attr('font-weight', labelConfig.fontWeight)
					.attr('fill', labelConfig.color)
					.text(node.data.name);

				fitText(label, node.r);
				} else {
				label.text('');
			}
		});
	}

	function fitText(text: d3.Selection<SVGTextElement, any, any, any>, radius: number) {
		const node = text.node();
		if (!node) return;

		const originalText = text.text();
		const maxWidth = radius * 1.8; // Diameter minus some padding

		// If text is too small, don't show it at all
		if (radius < labelConfig.minRadiusToShow) {
			text.text('');
			return;
		}

		// Get the computed text length
		const textLength = node.getComputedTextLength();

		if (textLength > maxWidth) {
			// If text is too long, try to abbreviate it
			let abbreviated = originalText;
			let ellipsis = '...';

			while (abbreviated.length > 0) {
				text.text(abbreviated + ellipsis);
				if (node.getComputedTextLength() <= maxWidth) {
					break;
				}
				abbreviated = abbreviated.slice(0, -1);
			}

			// If even a single character plus ellipsis is too long, show nothing
			if (abbreviated.length === 0) {
				text.text('');
			}
		}
	}

	function boxingForce() {
		return function (alpha: number) {
			for (const node of nodes) {
				const r = (node as any).r;
				const x = (node as any).x;
				const y = (node as any).y;

				if (x - r < 0) (node as any).x = r;
				if (x + r > innerWidth) (node as any).x = innerWidth - r;
				if (y - r < 0) (node as any).y = r;
				if (y + r > innerHeight) (node as any).y = innerHeight - r;
			}
		};
	}

	function updatePositions(container: d3.Selection<SVGGElement, unknown, null, undefined>) {
		container.selectAll('.node').attr('transform', (d: any) => `translate(${d.x},${d.y})`);
	}

	function calculatePopupPosition(
		node: d3.HierarchyNode<HierarchyNode>,
		dimensions: Dimensions
	): Position {
		if (!chart || !svgRef) return { x: 0, y: 0 };

		const padding = 16;
		const rect = chart.getBoundingClientRect();
		const svgPoint = svgRef.createSVGPoint();

		// Get circle center position
		svgPoint.x = (node.x || 0) + margin.left;
		svgPoint.y = (node.y || 0) + margin.top;

		const container = svgRef.firstChild as SVGGElement;
		const matrix = container?.getCTM();
		if (!matrix) return { x: 0, y: 0 };

		// Transform to screen coordinates
		const transformedPoint = svgPoint.matrixTransform(matrix);

		let posX = transformedPoint.x + node.r + padding;
		let posY = transformedPoint.y - dimensions.height / 2;

		// Adjust if popup would go outside bounds
		if (posX + dimensions.width > actualWidth - margin.right) {
			posX = transformedPoint.x - node.r - dimensions.width - padding;
		}

		if (posY < margin.top + padding) {
			posY = margin.top + padding;
		} else if (posY + dimensions.height > actualHeight - margin.bottom - padding) {
			posY = actualHeight - margin.bottom - dimensions.height - padding;
		}

		return { x: posX, y: posY };
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

	function handleMouseMove(event: MouseEvent) {
		if (!chart || !svgRef) return;

		const rect = chart.getBoundingClientRect();
		const svgPoint = svgRef.createSVGPoint();

		svgPoint.x = event.clientX - rect.left;
		svgPoint.y = event.clientY - rect.top;

		const container = svgRef.firstChild as SVGGElement;
		const matrix = container?.getCTM();
		if (!matrix) return;

		// Transform to SVG coordinates
		const transformedPoint = svgPoint.matrixTransform(matrix.inverse());
		const hoveredNode = findHoveredNode(
			transformedPoint.x, // Remove the margin subtraction
			transformedPoint.y // Remove the margin subtraction
		);

		if (hoveredNode) {
			// Create a set with the hovered node and all its descendants
			const highlightedNodes = new Set<d3.HierarchyNode<HierarchyNode>>();
			hoveredNode.descendants().forEach((node) => highlightedNodes.add(node));

			pointer = {
				x: hoveredNode.x || 0,
				y: hoveredNode.y || 0,
				show: true,
				data: hoveredNode,
				depth: hoveredNode.depth,
				highlightedNodes // Use the set containing all descendants
			};
		} else {
			pointer = {
				...pointer,
				show: false,
				data: null,
				highlightedNodes: new Set()
			};
		}

		updateCircleStyles();
	}

	function handleMouseLeave() {
		pointer = {
			...pointer,
			show: false,
			data: null,
			highlightedNodes: new Set()
		};
		updateCircleStyles();
	}

	function handleMeasure(dimensions: Dimensions) {
		popupDimensions = dimensions;
	}

	onMount(() => {
		resizeObserver = new ResizeObserver(handleResize);
		resizeObserver.observe(chart);
		handleResize();
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
		pointer.data ? calculatePopupPosition(pointer.data, popupDimensions) : { x: 0, y: 0 }
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
	<svg
		bind:this={svgRef}
		width={actualWidth}
		height={actualHeight}
		preserveAspectRatio="xMidYMid meet"
		role="presentation"
	/>

	{#if pointer.show && pointer.data}
		<div
			use:measure={handleMeasure}
			class="pointer-events-none absolute"
			style="left: {popupPosition.x}px; top: {popupPosition.y}px;"
			role="tooltip"
		>
			{@html popupTemplate(pointer.data)}
		</div>
	{/if}
</div>