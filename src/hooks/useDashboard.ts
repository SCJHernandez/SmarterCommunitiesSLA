import { useState, useEffect, useCallback } from 'react';
import { FilterState, SlaSummary, SlaTrend, SlaBreakdown, SlaActionRecord, SlaKpiInstance, Insight, DashboardData } from '../models';
import { slaService } from '../services/slaService';
import { generateDashboardInsights } from '../services/slaInsightService';

export function useDashboard(filters: FilterState) {
  const [summary, setSummary] = useState<{ data: SlaSummary | null; loading: boolean; error: Error | null }>({ data: null, loading: true, error: null });
  const [trend, setTrend] = useState<{ data: SlaTrend | null; loading: boolean; error: Error | null }>({ data: null, loading: true, error: null });
  const [breakdown, setBreakdown] = useState<{ data: SlaBreakdown | null; loading: boolean; error: Error | null }>({ data: null, loading: true, error: null });
  const [actions, setActions] = useState<{ data: SlaActionRecord[] | null; loading: boolean; error: Error | null }>({ data: null, loading: true, error: null });
  const [records, setRecords] = useState<{ data: SlaKpiInstance[] | null; loading: boolean; error: Error | null }>({ data: null, loading: true, error: null });
  
  // Auto insights is derived from the other data
  const [autoInsights, setAutoInsights] = useState<Insight[]>([]);

  // We consider it a global failure only if records/summary fail completely
  const [globalError, setGlobalError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setSummary(prev => ({ ...prev, loading: true, error: null }));
    setTrend(prev => ({ ...prev, loading: true, error: null }));
    setBreakdown(prev => ({ ...prev, loading: true, error: null }));
    setActions(prev => ({ ...prev, loading: true, error: null }));
    setRecords(prev => ({ ...prev, loading: true, error: null }));
    setGlobalError(null);

    try {
      // Simulate network delay for development to see loading states
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

      const handleErr = (e: any) => { setGlobalError(e instanceof Error ? e : new Error(String(e))); return null; };
      const pSummary = slaService.getSlaSummary(filters).then(async d => { await delay(300); setSummary({ data: d, loading: false, error: null }); return d; }).catch(e => { setSummary(prev => ({ ...prev, loading: false, error: e })); handleErr(e); });
      const pTrend = slaService.getSlaTrend(filters).then(async d => { await delay(600); setTrend({ data: d, loading: false, error: null }); return d; }).catch(e => { setTrend(prev => ({ ...prev, loading: false, error: e })); handleErr(e); });
      const pBreakdown = slaService.getSlaBreakdown(filters).then(async d => { await delay(500); setBreakdown({ data: d, loading: false, error: null }); return d; }).catch(e => { setBreakdown(prev => ({ ...prev, loading: false, error: e })); handleErr(e); });
      const pActions = slaService.getSlaActionItems(filters).then(async d => { await delay(800); setActions({ data: d, loading: false, error: null }); return d; }).catch(e => { setActions(prev => ({ ...prev, loading: false, error: e })); handleErr(e); });
      const pRecords = slaService.getSlaRecords(filters).then(async d => { await delay(400); setRecords({ data: d, loading: false, error: null }); return d; }).catch(e => { setRecords(prev => ({ ...prev, loading: false, error: e })); handleErr(e); });

      await Promise.allSettled([pSummary, pTrend, pBreakdown, pActions, pRecords]);

      // Calculate insights if we have everything
      // In a real app we might recalculate this inside an effect when dependencies change, but here is fine.
    } catch (err) {
      setGlobalError(err instanceof Error ? err : new Error('Unable to load SLA data.'));
    }
  }, [filters]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);
  
  // Re-calculate insights when all data is present
  useEffect(() => {
    if (summary.data && trend.data && breakdown.data && actions.data && records.data) {
       const dashboardData: DashboardData = {
          records: records.data,
          insights: summary.data.insights,
          kpiStats: summary.data.kpiStats,
          healthStats: summary.data.healthStats,
          totalRecords: summary.data.totalRecords,
          timeSeries: trend.data,
          priorityBreakdown: breakdown.data.priorityBreakdown,
          teamBreakdown: breakdown.data.teamBreakdown,
          attentionItems: records.data.filter(r => r.status === 'Noncompliant' || r.status === 'Nearing Noncompliance'),
          actionRecords: actions.data
       };
       setAutoInsights(generateDashboardInsights(dashboardData));
    }
  }, [summary.data, trend.data, breakdown.data, actions.data, records.data]);

  const isLoadingInitial = summary.loading && records.loading && trend.loading && breakdown.loading && actions.loading;

  return {
    summary,
    trend,
    breakdown,
    actions,
    records,
    autoInsights,
    globalError,
    isLoadingInitial,
    refetch: fetchAll
  };
}
