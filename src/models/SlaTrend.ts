export interface TimeSeriesDataPoint {
  date: string;
  Succeeded: number;
  Failed: number;
  Open: number;
}

export type SlaTrend = TimeSeriesDataPoint[];
