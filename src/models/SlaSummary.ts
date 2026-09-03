export interface SlaSummary {
  insights: {
    level1Headline: string;
    level1Subheadline: string;
    level2TrendInsight: string;
    level3BreakdownInsight: string;
  };
  kpiStats: {
    successRate: number;
    successRateTrend: number;
    atRiskCount: number;
    atRiskTrend: number;
    breachedCount: number;
    breachedTrend: number;
    avgResolutionTime: number;
    avgResolutionTimeTrend: number;
  };
  healthStats: {
    healthy: number;
    atRisk: number;
    breached: number;
  };
  totalRecords: number;
}
