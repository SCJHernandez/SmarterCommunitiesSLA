import { SlaKpiInstance, DashboardData, FilterState, SlaActionRecord, ActionCategory, RiskLevel, TimeSeriesDataPoint, KPIStats, DashboardInsights, DataverseSlaKpiInstance } from '../models';
import { mapDataverseToDomain } from '../utils/slaMapper';
import { differenceInMinutes, parseISO, isAfter, subDays, format } from 'date-fns';
import { apiClient } from '../api/apiClient';
import { SlaSummary } from '../models/SlaSummary';
import { SlaTrend } from '../models/SlaTrend';
import { SlaFilters } from '../models/SlaFilters';
import { SlaBreakdown } from '../models/SlaBreakdown';
import { generateDashboardInsights } from './slaInsightService';
import { 
  calculateSuccessRate, 
  calculateBreachRate, 
  calculateAtRiskCount, 
  calculateAverageResolutionTime, 
  calculateSlaComplianceTrend, 
  calculateBreachConcentration,
  classifyRisk
} from '../utils/slaCalculations';

class SlaService {
  private liveDataverseInstances: SlaKpiInstance[] | null = null;
  private lastFetchTime: number = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private async fetchLiveData(filters?: FilterState | SlaFilters): Promise<SlaKpiInstance[]> {
    let queryParams = '';
    
    // Add date filtering to the API call
    if (filters && filters.dateRange) {
      const now = new Date();
      let days = 30;
      if (filters.dateRange === 'Today') days = 1;
      else if (filters.dateRange === 'Last 7 Days') days = 7;
      else if (filters.dateRange === 'Last 90 Days') days = 90;
      
      const startDate = subDays(now, days).toISOString();
      const endDate = now.toISOString();
      queryParams = `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    }
    
    const cacheKey = queryParams || 'default';
    const nowTime = Date.now();
    
    // Simple memory cache mechanism on the frontend to avoid spamming if Filters don't change
    if (this.liveDataverseInstances && this.lastFetchTime === cacheKey) {
      return this.liveDataverseInstances;
    }
    
    const backendUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5240/api';
    
    try {
      const response = await fetch(`${backendUrl}/sla/kpis${queryParams}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch from backend', errorText);
        throw new Error(`Failed to fetch Dataverse KPIs from API. Server responded with: ${response.status}`);
      }
      
      const data = await response.json();
      const rawItems = data.items || [];
      
      this.liveDataverseInstances = rawItems.map(mapDataverseToDomain);
      this.lastFetchTime = cacheKey as any; // Using this as cache key
      
      return this.liveDataverseInstances || [];
    } catch (error) {
      console.error('Network or parsing error fetching SLA KPIs:', error);
      throw error;
    }
  }

  private async getFilteredInstances(filters: FilterState | SlaFilters): Promise<SlaKpiInstance[]> {
    const instances = await this.fetchLiveData(filters);
    
    return instances.filter(r => {
      // Exclude orphaned SLA timers: cases that are resolved but left timers hanging
      if (r.isCaseResolved && (r.status === 'In Progress' || r.status === 'Nearing Noncompliance')) {
        return false;
      }

      if (filters.status && filters.status !== 'All Statuses') {
        if (filters.status === 'Evaluated (Succeeded & Breached)') {
          if (r.status !== 'Succeeded' && r.status !== 'Noncompliant') return false;
        } else if (filters.status === 'Active Breaches') {
          if (r.status !== 'Noncompliant' || r.isCaseResolved) return false;
        } else if (r.status !== filters.status) {
          return false;
        }
      }
      if (filters.priority && filters.priority !== 'All Priorities' && r.priority !== filters.priority) return false;
      if (filters.slaKpi && filters.slaKpi !== 'All SLA Items' && r.kpiName !== filters.slaKpi) return false;
      if (filters.owner && filters.owner !== 'All Owners' && r.owner !== filters.owner) return false;
      return true;
    });
  }

  async getSlaRecords(filters: FilterState | SlaFilters): Promise<SlaKpiInstance[]> {
    return this.getFilteredInstances(filters);
  }

  async getSlaRecord(id: string): Promise<SlaKpiInstance | null> {
    const instances = await this.fetchLiveData();
    return instances.find(r => r.id === id) || null;
  }

  async getSlaSummary(filters: FilterState | SlaFilters): Promise<SlaSummary> {
    const filtered = await this.getFilteredInstances(filters);
    const totalRecords = filtered.length;
    
    const successRate = Math.round(calculateSuccessRate(filtered));
    const breachedCount = filtered.filter(r => r.status === 'Noncompliant' && !r.isCaseResolved).length;
    const atRiskCount = calculateAtRiskCount(filtered);
    const healthy = filtered.filter(r => r.status === 'In Progress' && !r.isCaseResolved).length;
    
    const avgResolutionTimeMs = calculateAverageResolutionTime(filtered);
    const avgResolutionTimeHours = avgResolutionTimeMs > 0 ? Number((avgResolutionTimeMs / (1000 * 60 * 60)).toFixed(1)) : 0;
    
    // Real Trend Calculation: Compare recent half of records vs older half
    const now = new Date();
    let days = 30;
    if (filters.dateRange === 'Today') days = 1;
    else if (filters.dateRange === 'Last 7 Days') days = 7;
    else if (filters.dateRange === 'Last 90 Days') days = 90;
    
    const midpointDate = subDays(now, days / 2);
    
    const recentRecords = filtered.filter(r => new Date(r.createdOn) >= midpointDate);
    const olderRecords = filtered.filter(r => new Date(r.createdOn) < midpointDate);

    // Calculate metrics for recent half
    const recentSuccessRate = calculateSuccessRate(recentRecords);
    const recentAtRisk = calculateAtRiskCount(recentRecords);
    const recentBreached = recentRecords.filter(r => r.status === 'Noncompliant').length;
    const recentAvgTimeMs = calculateAverageResolutionTime(recentRecords);
    const recentAvgTimeHours = recentAvgTimeMs > 0 ? Number((recentAvgTimeMs / (1000 * 60 * 60)).toFixed(1)) : 0;

    // Calculate metrics for older half
    const olderSuccessRate = calculateSuccessRate(olderRecords);
    const olderAtRisk = calculateAtRiskCount(olderRecords);
    const olderBreached = olderRecords.filter(r => r.status === 'Noncompliant').length;
    const olderAvgTimeMs = calculateAverageResolutionTime(olderRecords);
    const olderAvgTimeHours = olderAvgTimeMs > 0 ? Number((olderAvgTimeMs / (1000 * 60 * 60)).toFixed(1)) : 0;

    // Calculate trends (difference)
    const successRateTrend = Number((recentSuccessRate - olderSuccessRate).toFixed(1));
    const atRiskTrend = recentAtRisk - olderAtRisk;
    const breachedTrend = recentBreached - olderBreached;
    const avgResolutionTimeTrend = Number((recentAvgTimeHours - olderAvgTimeHours).toFixed(1));

    const kpiStats: KPIStats = {
      successRate,
      successRateTrend: isNaN(successRateTrend) ? 0 : successRateTrend,
      atRiskCount,
      atRiskTrend,
      breachedCount,
      breachedTrend,
      avgResolutionTime: avgResolutionTimeHours,
      avgResolutionTimeTrend: isNaN(avgResolutionTimeTrend) ? 0 : avgResolutionTimeTrend
    };

    const healthStats = {
      healthy,
      atRisk: atRiskCount,
      breached: breachedCount
    };

    const insights: DashboardInsights = {
      level1Headline: "SLA Performance Overview",
      level1Subheadline: `You have an overall success rate of ${successRate}%. Based on the live data from Dataverse.`,
      level2TrendInsight: "The data reflects real-time SLA KPI Instance records.",
      level3BreakdownInsight: "Focus on the highest priority cases assigned to the team with the most non-compliance."
    };

    return { insights, kpiStats, healthStats, totalRecords };
  }

  async getSlaTrend(filters: FilterState | SlaFilters): Promise<SlaTrend> {
    const filtered = await this.getFilteredInstances(filters);
    
    const groupedByDate: Record<string, { Succeeded: number, Failed: number, Open: number }> = {};
    
    filtered.forEach(r => {
      // Succeeded uses actual resolution time. Failed uses actual modification time. 
      // Open (active) uses createdOn (when it entered the pipeline) instead of future target dates.
      let d = new Date(r.createdOn);
      if (r.status === 'Succeeded' && r.succeededOn) {
        d = new Date(r.succeededOn);
      } else if (r.status === 'Noncompliant' && r.modifiedOn) {
        d = new Date(r.modifiedOn);
      }

      const dateKey = format(d, 'MMM dd');
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = { Succeeded: 0, Failed: 0, Open: 0 };
      }
      
      if (r.status === 'Succeeded') {
        groupedByDate[dateKey].Succeeded += 1;
      } else if (r.status === 'Noncompliant') {
        groupedByDate[dateKey].Failed += 1;
      } else if (r.status === 'In Progress' || r.status === 'Nearing Noncompliance') {
        groupedByDate[dateKey].Open += 1;
      }
    });
    
    return Object.entries(groupedByDate)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);
  }

  async getSlaBreakdown(filters: FilterState | SlaFilters): Promise<SlaBreakdown> {
    const filtered = await this.getFilteredInstances(filters);
    const concentration = calculateBreachConcentration(filtered);
    
    return {
      priorityBreakdown: concentration.byPriority.map(c => ({ name: c.name, value: c.breached })),
      teamBreakdown: concentration.byCategory.map(c => ({ name: c.name, value: c.breached })) // Now uses kpiName via byCategory
    };
  }

  async getSlaActionItems(filters: FilterState | SlaFilters): Promise<SlaActionRecord[]> {
    const filtered = await this.getFilteredInstances(filters);
    const actionRecords: SlaActionRecord[] = [];
    
    filtered.forEach(r => {
      if (r.status === 'Canceled') return;
      // Skip if the parent Case is already resolved or canceled
      if (r.isCaseResolved) return;
      
      let category: ActionCategory = 'DUE_SOON';
      let riskLevel: RiskLevel = 'Medium';
      let remainingMinutes = 0;
      
      if (r.status === 'Succeeded') {
        category = 'COMPLETED';
      } else if (r.status === 'Paused') {
        category = 'PAUSED';
      } else if (r.status === 'Noncompliant') {
        category = 'BREACHED';
        remainingMinutes = r.failureTime ? differenceInMinutes(parseISO(r.failureTime), new Date()) : -1440; 
      } else if (r.status === 'Nearing Noncompliance') {
        category = 'AT_RISK';
        remainingMinutes = r.failureTime ? differenceInMinutes(parseISO(r.failureTime), new Date()) : 120;
      } else if (r.status === 'In Progress' && r.failureTime) {
        // Show all In Progress records in the action center
        remainingMinutes = differenceInMinutes(parseISO(r.failureTime), new Date());
        category = 'DUE_SOON';
      } else {
        return; // No failureTime or not actionable
      }
      
      const calculatedRisk = classifyRisk(r);
      riskLevel = (calculatedRisk === 'None' || calculatedRisk === 'Low') ? 'Medium' : calculatedRisk as RiskLevel;
      
      actionRecords.push({
        id: r.id,
        category,
        regardingId: r.regardingId,
        regardingNumber: r.regardingNumber,
        regardingSubject: r.regardingSubject,
        priority: r.priority,
        owner: r.owner,
        team: r.team,
        kpiName: r.kpiName,
        status: r.status,
        createdOn: r.createdOn,
        warningTime: r.warningTime,
        deadline: r.failureTime || '',
        breachedDateTime: category === 'BREACHED' ? r.failureTime : undefined,
        overdueDurationFormatted: r.overdueDurationFormatted,
        remainingTimeFormatted: r.remainingTimeFormatted,
        remainingMinutes,
        riskLevel,
        recommendedAction: r.recommendedAction,
        availableActions: r.availableActions || ['View Case', 'Assign', 'Escalate']
      });
    });
    
    return actionRecords;
  }

  async getDashboardData(filters: FilterState | SlaFilters): Promise<DashboardData> {
    const [
      instances,
      summary,
      trend,
      breakdowns,
      actionItems
    ] = await Promise.all([
      this.getSlaRecords(filters),
      this.getSlaSummary(filters),
      this.getSlaTrend(filters),
      this.getSlaBreakdown(filters),
      this.getSlaActionItems(filters)
    ]);

    const dashboardData: DashboardData = {
      records: instances,
      insights: summary.insights,
      kpiStats: summary.kpiStats,
      healthStats: summary.healthStats,
      totalRecords: summary.totalRecords,
      timeSeries: trend as TimeSeriesDataPoint[],
      priorityBreakdown: breakdowns.priorityBreakdown,
      teamBreakdown: breakdowns.teamBreakdown,
      attentionItems: instances.filter(r => r.status === 'Noncompliant' || r.status === 'Nearing Noncompliance'),
      actionRecords: actionItems
    };

    dashboardData.autoInsights = generateDashboardInsights(dashboardData);
    
    return dashboardData;
  }
}

export const slaService = new SlaService();
