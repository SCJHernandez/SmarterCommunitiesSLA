export type InsightSeverity = 'critical' | 'warning' | 'positive' | 'info';

export interface Insight {
  severity: InsightSeverity;
  title: string;
  message: string;
  relatedMetric?: string;
  actionLabel?: string;
  actionFilter?: any;
}
