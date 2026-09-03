import React, { useState, useMemo } from 'react';
import { Header } from '../components/Header';
import { FilterBar, DEFAULT_FILTERS, FilterState } from '../components/FilterBar';
import { KpiCard } from '../components/KpiCard';
import { TrendChart } from '../components/TrendChart';
import { ActionCenter } from '../components/ActionCenter';
import { BreakdownChart } from '../components/BreakdownChart';
import { SlaHealthCard } from '../components/SlaHealthCard';
import { SlaRecordsView } from '../components/SlaRecordsView';
import { InsightsPanel } from '../components/InsightsPanel';
import { useDashboard } from '../hooks/useDashboard';
import { SkeletonKpiCard, SkeletonChart } from '../components/ui/Skeletons';
import { ErrorState, EmptyState } from '../components/ui/StateViews';

type ViewMode = 'dashboard' | 'records';

export function Dashboard() {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  
  const { 
    summary, 
    trend, 
    breakdown, 
    actions, 
    records, 
    autoInsights, 
    globalError, 
    refetch 
  } = useDashboard(filters);

  // Compute available filter options dynamically from the API data
  const availableKpis = useMemo(() => {
    if (!records.data) return [];
    return [...new Set(records.data.map(r => r.kpiName).filter(Boolean))].sort();
  }, [records.data]);

  const availableOwners = useMemo(() => {
    if (!records.data) return [];
    return [...new Set(records.data.map(r => r.owner).filter(o => o && o !== 'Unassigned'))].sort();
  }, [records.data]);

  const availablePriorities = useMemo(() => {
    if (!records.data) return [];
    return [...new Set(records.data.map(r => r.priority).filter(Boolean))].sort();
  }, [records.data]);

  const handleDrillDown = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setView('records');
  };

  const hasNoRecords = summary.data?.totalRecords === 0 && !summary.loading;

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      <Header />
      <FilterBar 
        filters={filters} 
        onApply={setFilters} 
        onClear={() => {
          setFilters(DEFAULT_FILTERS);
          setView('dashboard');
        }} 
        totalRecords={summary.data?.totalRecords || 0}
        availableKpis={availableKpis}
        availableOwners={availableOwners}
        availablePriorities={availablePriorities}
      />
      
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-4 md:p-6 lg:p-8 space-y-8 pb-20">
        
        {globalError ? (
           <ErrorState message={globalError.message} onRetry={refetch} />
        ) : hasNoRecords ? (
           <EmptyState onClear={() => { setFilters(DEFAULT_FILTERS); setView('dashboard'); }} />
        ) : view === 'records' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-light text-gray-900 tracking-tight">SLA Records</h2>
                <p className="text-gray-500 mt-1">Detailed view of filtered cases.</p>
              </div>
              <button 
                onClick={() => setView('dashboard')}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm shadow-sm"
              >
                Return to dashboard
              </button>
            </div>
            <SlaRecordsView records={records.data || []} />
          </div>
        ) : (
          <>
            {/* LEVEL 1: OVERALL HEALTH (KPIs) */}
            <section className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">{summary.data?.insights.level1Headline || 'SLA Performance Overview'}</h2>
                  <p className="text-sm text-gray-500 mt-1">{summary.data?.insights.level1Subheadline || 'Analyzing current SLA conditions.'}</p>
                </div>
                
                {/* Health Bar placed logically with overall health */}
                <div className="w-full md:w-auto md:min-w-[350px]">
                  {summary.data?.healthStats && !summary.loading && (
                    <SlaHealthCard 
                      healthy={summary.data.healthStats.healthy} 
                      atRisk={summary.data.healthStats.atRisk} 
                      breached={summary.data.healthStats.breached} 
                      onDrillDown={(status) => handleDrillDown({ status })}
                    />
                  )}
                </div>
              </div>
              
              <div className="flex overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pt-2 snap-x snap-mandatory hide-scrollbar">
                {summary.loading || !summary.data ? (
                  <>
                    <SkeletonKpiCard className="w-[85vw] snap-center sm:w-auto" />
                    <SkeletonKpiCard className="w-[85vw] snap-center sm:w-auto" />
                    <SkeletonKpiCard className="w-[85vw] snap-center sm:w-auto" />
                    <SkeletonKpiCard className="w-[85vw] snap-center sm:w-auto" />
                  </>
                ) : (
                  <>
                    <KpiCard 
                      title="SLA Success Rate" 
                      value={`${summary.data.kpiStats.successRate}%`} 
                      description="Overall adherence to Resolve KPI" 
                      trend={summary.data.kpiStats.successRateTrend} 
                      onClick={() => handleDrillDown({ status: 'Evaluated (Succeeded & Breached)' })}
                      className="w-[85vw] snap-center sm:w-auto"
                    />
                    <KpiCard 
                      title="At Risk" 
                      value={summary.data.kpiStats.atRiskCount} 
                      description="Active records nearing noncompliance" 
                      trend={summary.data.kpiStats.atRiskTrend}
                      inverseTrend={true}
                      onClick={() => handleDrillDown({ status: 'Nearing Noncompliance' })}
                      className="w-[85vw] snap-center sm:w-auto"
                    />
                    <KpiCard 
                      title="Breached" 
                      value={summary.data.kpiStats.breachedCount} 
                      description="Active records past deadline" 
                      trend={summary.data.kpiStats.breachedTrend}
                      inverseTrend={true}
                      onClick={() => handleDrillDown({ status: 'Active Breaches' })}
                      className="w-[85vw] snap-center sm:w-auto"
                    />
                    <KpiCard 
                      title="Avg Resolution Time" 
                      value={`${summary.data.kpiStats.avgResolutionTime}h`} 
                      description="Average time to resolve cases" 
                      trend={summary.data.kpiStats.avgResolutionTimeTrend} 
                      trendLabel="vs last period"
                      inverseTrend={true}
                      onClick={() => handleDrillDown({ status: 'Succeeded' })}
                      className="w-[85vw] snap-center sm:w-auto"
                    />
                  </>
                )}
              </div>
            </section>

            {/* LEVEL 2: CRITICAL PROBLEMS (Insights) */}
            {!summary.loading && autoInsights && autoInsights.length > 0 && (
              <section>
                <InsightsPanel 
                  insights={autoInsights} 
                  onActionClick={(insight) => {
                    if (insight.actionFilter) {
                      handleDrillDown(insight.actionFilter);
                    } else if (insight.actionLabel?.toLowerCase().includes('at-risk')) {
                      handleDrillDown({ status: 'Nearing Noncompliance' });
                    } else {
                      setView('records');
                    }
                  }} 
                />
              </section>
            )}

            {/* LEVEL 3: AT-RISK & BREACHED CASES (Action Center) */}
            <section className="h-[600px] flex flex-col">
              <ActionCenter 
                  records={actions.data || []} 
                  isLoading={actions.loading} 
                  onViewAll={() => setView('records')} 
              />
            </section>

            {/* LEVEL 4 & 5: TRENDS & ROOT CAUSES */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Trends */}
              <section className="flex flex-col h-full">
                <div className="flex-grow min-h-[300px]">
                  {trend.loading || !trend.data ? (
                    <SkeletonChart title={false} />
                  ) : (
                    <TrendChart data={trend.data} />
                  )}
                </div>
              </section>

              {/* Root Causes / Breakdown */}
              <section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {breakdown.loading || !breakdown.data ? (
                      <>
                        <SkeletonChart title={true} />
                        <SkeletonChart title={true} />
                      </>
                  ) : (
                      <>
                      <BreakdownChart 
                        title="Breach Volume by Priority" 
                        data={breakdown.data.priorityBreakdown} 
                        color="#ef4444"
                        onClick={(name) => handleDrillDown({ priority: name as any })}
                      />
                      <BreakdownChart 
                        title="Breach Volume by SLA KPI" 
                        data={breakdown.data.teamBreakdown} 
                        color="#ef4444"
                        onClick={(name) => handleDrillDown({ slaKpi: name })}
                      />
                      </>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
