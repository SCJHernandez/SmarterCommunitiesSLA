import { DashboardData, Insight } from '../models';

export function generateDashboardInsights(data: DashboardData): Insight[] {
  const insights: Insight[] = [];
  const { kpiStats, priorityBreakdown, teamBreakdown, healthStats, timeSeries } = data;

  // 1. Critical operational problems: Concentration of breaches
  const topPriority = priorityBreakdown && priorityBreakdown.length > 0 ? priorityBreakdown[0] : null;
  const topSlaItem = teamBreakdown && teamBreakdown.length > 0 ? teamBreakdown[0] : null;
  
  const totalBreaches = topPriority ? priorityBreakdown.reduce((sum, item) => sum + item.value, 0) : 0;

  if (totalBreaches >= 2) {
    const priorityPct = topPriority ? topPriority.value / totalBreaches : 0;
    const slaItemPct = topSlaItem ? topSlaItem.value / totalBreaches : 0;

    if (slaItemPct > 0.5 && slaItemPct >= priorityPct) {
      insights.push({
        severity: 'critical',
        title: 'SLA Item Breach Concentration',
        message: `${topSlaItem!.name} accounts for ${Math.round(slaItemPct * 100)}% of all SLA breaches.`,
        relatedMetric: 'Breach Rate',
        actionLabel: `Investigate ${topSlaItem!.name} cases`,
        actionFilter: { slaKpi: topSlaItem!.name, status: 'Noncompliant' }
      });
    } else if (priorityPct > 0.5) {
      const cleanPriorityName = topPriority!.name.replace(/^\d+\s*-\s*/, '');
      insights.push({
        severity: 'critical',
        title: 'Priority Breach Concentration',
        message: `${cleanPriorityName} priority cases account for ${Math.round(priorityPct * 100)}% of all SLA breaches.`,
        relatedMetric: 'Breach Rate',
        actionLabel: `Investigate ${cleanPriorityName} priority cases`,
        actionFilter: { priority: topPriority!.name, status: 'Noncompliant' }
      });
    }
  }

  // 2. Significant negative trends / at risk
  let atRiskInsightAdded = false;
  if (kpiStats.atRiskTrend > 0) {
    // If the trend is positive number, it means at-risk cases increased
    insights.push({
      severity: 'warning',
      title: 'Escalating At-Risk Volume',
      message: `${kpiStats.atRiskTrend} more cases entered the at-risk window this period.`,
      relatedMetric: 'At Risk Count',
      actionLabel: 'Review at-risk cases',
      actionFilter: { status: 'Nearing Noncompliance' }
    });
    atRiskInsightAdded = true;
  }

  // 3. Positive improvements
  if (kpiStats.successRateTrend > 0) {
    insights.push({
      severity: 'positive',
      title: 'Adherence Improving',
      message: `SLA adherence improved by ${kpiStats.successRateTrend}% this period.`,
      relatedMetric: 'Success Rate'
    });
  } else if (kpiStats.avgResolutionTimeTrend < 0) {
    // Negative trend in resolution time is a positive thing (faster)
    insights.push({
      severity: 'positive',
      title: 'Resolution Time Decreasing',
      message: `Average resolution time decreased by ${Math.abs(kpiStats.avgResolutionTimeTrend)} hours this period.`,
      relatedMetric: 'Avg Resolution Time'
    });
  }

  // 4. Recommended actions
  if (healthStats.atRisk > 0 && !atRiskInsightAdded) {
    insights.push({
      severity: 'info',
      title: 'Approaching Deadlines',
      message: `${healthStats.atRisk} cases are approaching their SLA deadline.`,
      relatedMetric: 'Action Required',
      actionLabel: 'Review active cases',
      actionFilter: { status: 'Nearing Noncompliance' }
    });
  }

  // Sort and limit: critical -> warning -> positive -> info
  const severityOrder = { 'critical': 0, 'warning': 1, 'positive': 2, 'info': 3 };
  insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return insights.slice(0, 5);
}
