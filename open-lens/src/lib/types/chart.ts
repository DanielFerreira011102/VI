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
	margins?: Partial<BaseMargin>;
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
	margins?: Partial<BaseMargin>;
	/** Series appearance configuration */
	seriesConfig?: BarChartSeriesConfig;
};

// Star Chart Types (existing code...)
type StarChartDataPoint = {
	label: string;
	color: string;
	values: Record<string, number>;
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
};

type StarChartProps = {
	data: StarChartDataPoint[];
	axes: StarChartAxis[];
	margins?: Partial<Margin>;
	gridConfig?: StarChartGridConfig;
	axisConfig?: StarChartAxisConfig;
	seriesConfig?: StarChartSeriesConfig;
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
	StarChartAxis,
	StarChartGridConfig,
	StarChartAxisConfig,
	StarChartSeriesConfig,
	StarChartProps
};
