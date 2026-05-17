/* ── Types for Excel Analytics ── */

export interface ColumnProfile {
  name: string;
  dataType: 'numeric' | 'date' | 'categorical' | 'boolean' | 'unknown';
  uniqueValues: number;
  nullCount: number;
  nullPercentage: number;
  totalCount: number;
  cardinality: 'high' | 'low';
  isNumeric: boolean;
  isDate: boolean;
  min: number | null;
  max: number | null;
  mean: number | null;
  median: number | null;
  mode: number | null;
  stdDev: number | null;
  sampleValues: any[];
  topValues: { value: string; count: number }[];
}

export interface PivotGroup {
  id: string;
  name: string;
  type: 'time-series' | 'category-comparison' | 'correlation' | 'distribution' | 'multi-dimensional';
  chartType: ChartKind;
  dimensions: string[];
  measures: string[];
  timeDimension?: string;
  confidence: number;
  reason: string;
  alternativeChartType?: ChartKind;
}

export type ChartKind = 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'doughnut';

export interface ChartConfig {
  id: string;
  title: string;
  type: ChartKind;
  xAxisColumn: string;
  yAxisColumn: string;
  yAxisColumn2?: string;              // for scatter charts with two measures
  colorScheme?: string[];
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  source?: 'manual' | 'smart-analytics';  // where the chart was created
  confidence?: number;                    // confidence score if from pivot
}

export interface Filter {
  id: string;
  column: string;
  operator: FilterOperator;
  value: any;
  value2?: any;
}

export type FilterOperator =
  | '==' | '!=' | '>' | '<' | '>=' | '<='
  | 'contains' | 'startsWith' | 'endsWith'
  | 'between' | 'isEmpty' | 'isNotEmpty';

export interface CalculatedColumn {
  id: string;
  name: string;
  expression: string;
  error?: string;
}

export interface CorrelationResult {
  columnA: string;
  columnB: string;
  value: number;
}

export interface UploadedFileMetadata {
  fileName: string;
  fileExtension: string;
  uploadTimestamp: number;
  rowCount: number;
  columnCount: number;
}

export type ActiveView =
  | 'upload'
  | 'auto-analytics'
  | 'dashboard'
  | 'data-summary'
  | 'filters'
  | 'calculated-columns'
  | 'correlation'
  | 'export';
