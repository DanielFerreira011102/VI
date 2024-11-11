type AxisConfig = {
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

type YAxisConfig = AxisConfig & {
  min: number;
  max: number;
  gridLines: boolean;
  gridLineColor: string;
};

type DataPoint = Record<string, any>;

type PointerState = {
  x: number;
  y: number[];
  show: boolean;
  data: DataPoint | null;
  index: number;
};

type Margin = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type Dimensions = {
  width: number;
  height: number;
};

type PopupPosition = {
  left: number;
  top: number;
};

export type {
  AxisConfig,
  YAxisConfig,
  DataPoint,
  PointerState,
  Margin,
  Dimensions,
  PopupPosition,
};