export * from './SlaKpiInstance';
export * from './Dataverse';
export * from './Insight';
export * from './SlaFilters';
export * from './SlaSummary';
export * from './SlaTrend';
export * from './SlaBreakdown';

import { SlaKpiInstance, Priority } from './SlaKpiInstance';
import { Insight } from './Insight';

export interface DashboardInsights {
  level1Headline: string;
  level1Subheadline: string;
  level2TrendInsight: string;
  level3BreakdownInsight: string;
}

export interface DashboardData {
  records: SlaKpiInstance[];
  insights: DashboardInsights;
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
  timeSeries: any[];
  priorityBreakdown: any[];
  teamBreakdown: any[];
  attentionItems: SlaKpiInstance[];
  actionRecords: SlaActionRecord[];
  autoInsights?: Insight[];
}

export type ActionCategory = 'BREACHED' | 'AT_RISK' | 'DUE_SOON' | 'COMPLETED' | 'CANCELED' | 'PAUSED';
export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'None';

export interface SlaActionRecord {
  id: string;
  category: ActionCategory;
  regardingId: string;
  regardingNumber: string;
  regardingSubject: string;
  priority: Priority;
  owner: string;
  team: string;
  kpiName: string;
  status: string;
  createdOn: string;
  warningTime?: string;
  deadline: string;
  breachedDateTime?: string;
  overdueDurationFormatted?: string;
  remainingTimeFormatted?: string;
  remainingMinutes: number;
  riskLevel: RiskLevel;
  recommendedAction?: string;
  availableActions: string[];
}
export type FilterState = any;
export type KPIStats = any;
export type BreakdownDataPoint = { name: string; value: number };
