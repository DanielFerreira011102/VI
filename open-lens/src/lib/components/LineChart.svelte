<script lang="ts">
  import { onMount } from 'svelte';
  import { measure } from '$lib/actions/measure';
  import type { AxisConfig, YAxisConfig, DataPoint, PointerState, Dimensions, PopupPosition } from '$lib/types/lineChart';
  
  // Remove width and height props since we'll calculate dynamically
  export let data: DataPoint[] = [];
  export let series: string[] = [];
  export let colors: string[] = [];
  export let popupTemplate: (item: DataPoint) => string = (item) => `Value: ${item.value}`;
  
  // Rest of the props remain the same...
  export let xAxisLabel = 'x';
  export let xAxisConfig: AxisConfig = {
    interval: 1,
    format: (value) => value.toString(),
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
    left: yAxisConfig.padding + yAxisConfig.fontSize * 3
  };
  
  $: actualWidth = containerWidth || 0;
  $: actualHeight = containerHeight || 0;
  
  $: innerWidth = actualWidth - margin.left - margin.right;
  $: innerHeight = actualHeight - margin.top - margin.bottom;
  
  $: xScale = (x: number) => {
    const range = data.length - 1;
    return margin.left + (x * innerWidth) / range;
  };
  
  $: yScale = (y: number) => {
    return margin.top + innerHeight - ((y - yAxisConfig.min) * innerHeight) / (yAxisConfig.max - yAxisConfig.min);
  };
  
  $: yValues = Array.from(
    { length: Math.floor((yAxisConfig.max - yAxisConfig.min) / yAxisConfig.interval) + 1 },
    (_, i) => yAxisConfig.min + (i * yAxisConfig.interval)
  );
  
  $: xLabels = data
    .map((d, i) => ({
      value: d[xAxisLabel],
      x: xScale(i),
      show: i % xAxisConfig.interval === 0
    }))
    .filter(label => label.show)
    .filter((label, i) => xAxisConfig.filter(label.value, i));
    
  $: yLabels = yValues
    .map((value, i) => ({
      value,
      y: yScale(value),
      show: yAxisConfig.filter(value, i)
    }))
    .filter(label => label.show);
  
  $: linePath = (seriesName: string) => {
    return data
      .map((d, i) => {
        const x = xScale(i);
        const y = yScale(d[seriesName]);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join('');
  };

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
    
    // Default position (left-biased)
    let left = pointer.x - popup.width - padding;
    let top = margin.top + padding;
    
    // If too close to left edge, position on right side of pointer
    if (left < margin.left + padding) {
      left = pointer.x + padding;
    }
    
    // Ensure popup doesn't overflow right edge
    if (left + popup.width > width - margin.right - padding) {
      left = width - margin.right - popup.width - padding;
    }
    
    // Ensure popup doesn't overflow left edge
    if (left < margin.left + padding) {
      left = margin.left + padding;
    }
    
    // Calculate vertical position
    const pointerVerticalCenter = Math.min(...pointer.y);
    
    // Position above points if there's room
    if (pointerVerticalCenter - popup.height - padding > margin.top) {
      top = pointerVerticalCenter - popup.height - padding;
    }
    // Otherwise position below points if there's room
    else if (pointerVerticalCenter + popup.height + padding < height - margin.bottom) {
      top = pointerVerticalCenter + padding;
    }
    // Fallback to top of chart if no good position found
    else {
      top = margin.top + padding;
    }
    
    return { left, top };
  }

  function handleMeasure(dimensions: Dimensions) {
    popupDimensions = dimensions;
  }

  function handleMouseMove(event: MouseEvent) {
    if (!svg) return;
    
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left - margin.left;
    const index = Math.round((x * (data.length - 1)) / innerWidth);
    
    if (index >= 0 && index < data.length) {
      const item = data[index];
      const seriesY = series.map(s => yScale(item[s]));
      
      pointer = {
        x: xScale(index),
        y: seriesY,
        show: true,
        data: item,
        index
      };
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
  class="relative w-full h-full outline-none"
  bind:this={chart}
  on:mousemove={handleMouseMove}
  on:mouseleave={handleMouseLeave}
  on:keydown={handleKeyDown}
  role="button"
  tabindex="0"
  aria-label="Interactive line chart visualization"
>
{#if actualWidth > 0 && actualHeight > 0}
  <svg
    width={actualWidth}
    height={actualHeight}
    bind:this={svg}
    role="presentation"
  >

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
    
    <!-- X-axis labels -->
    {#each xLabels as label}
      <text
        x={label.x}
        y={actualHeight - margin.bottom + xAxisConfig.padding}
        text-anchor="middle"
        font-size={xAxisConfig.fontSize}
        fill={xAxisConfig.color}
        transform="rotate({xAxisConfig.rotation}, {label.x}, {actualHeight - margin.bottom + xAxisConfig.padding})"
      >
        {xAxisConfig.format(label.value)}
      </text>
    {/each}
    
    <!-- Data lines -->
    {#each series as seriesName, i}
      <path
        d={linePath(seriesName)}
        stroke={colors[i]}
        stroke-width="4"
        fill="none"
      />
    {/each}
    
    <!-- Focus point indicators -->
    {#if pointer.show}
      <!-- Vertical line -->
      <line
        x1={pointer.x}
        y1={margin.top}
        x2={pointer.x}
        y2={actualHeight - margin.bottom}
        stroke="#e0e0e0"
        stroke-width="1"
        stroke-opacity="0.3"
      />
      
      <!-- Focus points with ripple effect -->
      {#each series as seriesName, i}
        <g>
          <circle
            cx={pointer.x}
            cy={pointer.y[i]}
            r="6.5"
            stroke="#000000"
            stroke-width="1"
            stroke-opacity="0.05"
            fill="none"
          />
          <circle
            cx={pointer.x}
            cy={pointer.y[i]}
            r="5.5"
            stroke="#000000"
            stroke-width="1"
            stroke-opacity="0.1"
            fill="none"
          />
          <circle
            cx={pointer.x}
            cy={pointer.y[i]}
            r="4.5"
            stroke="#000000"
            stroke-width="1"
            stroke-opacity="0.25"
            fill="none"
          />
          <circle
            cx={pointer.x}
            cy={pointer.y[i]}
            r="4"
            fill={colors[i]}
          />
        </g>
      {/each}
    {/if}
  </svg>
{/if}
  
  <!-- Popup -->
  {#if pointer.show && pointer.data}
    <div
      use:measure={handleMeasure}
      class="absolute pointer-events-none"
      style="left: {popupPosition.left}px; top: {popupPosition.top}px;"
      role="tooltip"
    >
      {@html popupTemplate(pointer.data)}
    </div>
  {/if}
</div>