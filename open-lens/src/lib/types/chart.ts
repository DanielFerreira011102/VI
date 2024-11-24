type Dimensions = {
	width: number;
	height: number;
};

type Margin = {
	top: number;
	right: number;
	bottom: number;
	left: number;
};

type Position = {
	x: number;
	y: number;
};

type BaseAxisConfig = {
	interval: number;
	format: (value: any) => string;
	rotation: number;
	fontSize: number;
	padding: number;
	filter: (value: any, index: number) => boolean;
	color: string;
	showAxis: boolean;
	axisColor: string;
};

type BaseYAxisConfig = BaseAxisConfig & {
	min: number;
	max: number;
	gridLines: boolean;
	gridLineColor: string;
};

// Line Chart Types
type LineChartDataPoint = Record<string, any>;

type LineChartPointerState = {
	x: number;
	y: number[];
	show: boolean;
	data: LineChartDataPoint | null;
	index: number;
	series?: string;
};

type LineChartSeriesConfig = {
	/** Width of the lines */
	lineWidth?: number;
	/** Size of the data points */
	pointSize?: number;
	/** Whether to show data points */
	showPoints?: boolean;
	/** Whether to show hover effects */
	showHoverEffects?: boolean;
	/** Style for hover effects */
	hoverStyle?: {
		circleRadius?: number;
		circleOpacity?: number;
	};
};

type LineChartProps = {
	/** The data to be displayed */
	data?: LineChartDataPoint[];
	/** Series names to plot from the data */
	series?: string[];
	/** Colors for each series */
	colors?: string[];
	/** Function to generate popup content */
	popupTemplate?: (item: LineChartDataPoint, series?: string) => string;
	/** X-axis field name */
	xAxisLabel?: string;
	/** X-axis configuration */
	xAxisConfig?: BaseAxisConfig;
	/** Y-axis configuration */
	yAxisConfig?: BaseYAxisConfig;
	/** Chart margins */
	margins?: Partial<Margin>;
	/** Series appearance configuration */
	seriesConfig?: LineChartSeriesConfig;
};

// Bar Chart Types
type BarChartDataPoint = Record<string, any>;

type BarChartPointerState = {
	x: number;
	y: number[];
	show: boolean;
	data: BarChartDataPoint | null;
	index: number;
	series?: string;
	categoryIndex?: number;
	seriesIndex?: number;
};

type BarChartSeriesConfig = {
	/** Width of bars relative to available space */
	barWidth?: number;
	/** Spacing between bars */
	barSpacing?: number;
	/** Whether to show hover effects */
	showHoverEffects?: boolean;
	/** Style for hover effects */
	hoverStyle?: {
		borderWidth?: number;
		borderOpacity?: number;
	};
};

type BarChartProps = {
	/** The data to be displayed */
	data?: BarChartDataPoint[];
	/** Series names to plot from the data */
	series?: string[];
	/** Colors for each series */
	colors?: string[];
	/** Function to generate popup content */
	popupTemplate?: (item: BarChartDataPoint, series: string, seriesIndex: number) => string;
	/** X-axis field name */
	xAxisLabel?: string;
	/** X-axis configuration */
	xAxisConfig?: BaseAxisConfig;
	/** Y-axis configuration */
	yAxisConfig?: BaseYAxisConfig;
	/** Chart margins */
	margins?: Partial<Margin>;
	/** Series appearance configuration */
	seriesConfig?: BarChartSeriesConfig;
};

// Star Chart Types
type StarChartDataPoint = {
	label: string;
	color: string;
	values: Record<string, number>;
};

type StarChartPointerState = {
	show: boolean;
	x: number;
	y: number;
	data: StarChartDataPoint | null;
	index: number;
	anchorPoints: Position[];
};

type StarChartAxis = {
	key: string;
	label: string;
	minValue?: number;
	maxValue?: number;
	autoScale?: boolean;
	gridConfig?: {
		format?: (value: number, index: number, total: number) => string;
		fontSize?: number;
		color?: string;
		filter?: (value: number, index: number, total: number) => boolean;
		offsetX?: number;
		offsetY?: number;
	};
};

type StarChartGridConfig = {
	circleCount?: number;
	lineColor?: string;
	lineWidth?: number;
};

type StarChartAxisConfig = {
	lineColor?: string;
	lineWidth?: number;
	labelStyle?: {
		fontSize?: number;
		color?: string;
		distance?: number;
	};
};

type StarChartSeriesConfig = {
	lineWidth?: number;
	pointSize?: number;
	showPoints?: boolean;
	fill?: boolean;
	fillOpacity?: number;
	showHoverEffects?: boolean;
	hoverStyle?: {
		fillOpacity?: number;
		lineOpacity?: number;
	};
};

type StarChartProps = {
	data: StarChartDataPoint[];
	axes: StarChartAxis[];
	margins?: Partial<Margin>;
	gridConfig?: StarChartGridConfig;
	axisConfig?: StarChartAxisConfig;
	seriesConfig?: StarChartSeriesConfig;
	popoverTemplate?: (item: StarChartDataPoint, index: number) => string;
};

// Pie Chart Types
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

// Types for the circular packing chart
type HierarchyNode = {
	name: string;
	value?: number;
	color?: string;
	children?: HierarchyNode[];
	x?: number;
	y?: number;
	r?: number;
};

type CircularPackingPointerState = {
	x: number;
	y: number;
	show: boolean;
	data: d3.HierarchyNode<HierarchyNode> | null;
	depth: number;
	highlightedNodes: Set<d3.HierarchyNode<HierarchyNode>>;
};

type TextFindingConfig = {
	gridSize?: number;
	ratios?: number[];
	minFontSize?: number;
	maxFontSize?: number;
	fontSizeStep?: number;
	leafNodePadding?: {
		x?: number;
		y?: number;
		width?: number;
		height?: number;
	};
	rectPadding?: number;
};

type CircularPackingProps = {
	/** The hierarchical data to be displayed */
	data?: HierarchyNode;
	/** Colors for different hierarchy levels */
	colors?: {
		[groupName: string]: {
			[depth: number]: string;
		};
	};
	/** Function to generate popup content */
	popupTemplate?: (node: d3.HierarchyNode<HierarchyNode>) => string;
	/** Chart margins */
	margins?: Partial<Margin>;
	/** Configuration for circles */
	circleConfig?: {
		/** Padding between circles */
		padding?: number;
		/** Style for different levels */
		levelStyle?: {
			[key: number]: {
				strokeWidth?: number;
				strokeOpacity?: number;
				fillOpacity?: number;
			};
		};
		/** Whether to show hover effects */
		showHoverEffects?: boolean;
		/** Style for hover effects */
		hoverStyle?: {
			fillOpacity?: number;
			strokeOpacity?: number;
		};
	};
	/** Label configuration */
	labelConfig?: {
		/** Show labels */
		show?: boolean;
		/** Font size */
		fontSize?: number;
		/** Font size multiplier for group labels */
		groupFontSizeMultiplier?: number;
		/** Font weight */
		fontWeight?: number | string;
		/** Label color */
		color?: string;
		/** Min circle radius to show label */
		minRadiusToShow?: number;
		/** Auto fit text in circles */
		autoFitText?: boolean;
		/** Filter function for labels */
		filter?: (node: d3.HierarchyNode<HierarchyNode>) => boolean;
		/** Text finding algorithm configuration */
		textFinding?: TextFindingConfig;
	};
};

export type {
	Margin,
	BaseAxisConfig as AxisConfig,
	BaseYAxisConfig as YAxisConfig,
	Dimensions,
	Position,
	// Line Chart exports
	LineChartDataPoint,
	LineChartPointerState,
	LineChartSeriesConfig,
	LineChartProps,
	// Bar Chart exports
	BarChartDataPoint,
	BarChartPointerState,
	BarChartSeriesConfig,
	BarChartProps,
	// Star Chart exports
	StarChartDataPoint,
	StarChartPointerState,
	StarChartAxis,
	StarChartGridConfig,
	StarChartAxisConfig,
	StarChartSeriesConfig,
	StarChartProps,
	// Pie Chart exports
	PieChartDataPoint,
	PieChartPointerState,
	PieChartSeriesConfig,
	PieChartProps,
	// Circular Packing Chart exports
	HierarchyNode,
	CircularPackingPointerState,
	CircularPackingProps
};
