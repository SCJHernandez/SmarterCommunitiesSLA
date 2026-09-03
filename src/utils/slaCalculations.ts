import { differenceInMilliseconds, differenceInDays, parseISO, startOfDay, startOfWeek, format } from 'date-fns';
import { SlaKpiInstance } from '../models/SlaKpiInstance';

export function calculateSuccessRate(instances: SlaKpiInstance[]): number {
  const completed = instances.filter(i => i.status === 'Succeeded' || i.status === 'Noncompliant');
  if (completed.length === 0) return 0;
  const succeeded = completed.filter(i => i.status === 'Succeeded');
  return (succeeded.length / completed.length) * 100;
}

export function calculateBreachRate(instances: SlaKpiInstance[]): number {
  const completed = instances.filter(i => i.status === 'Succeeded' || i.status === 'Noncompliant');
  if (completed.length === 0) return 0;
  const breached = completed.filter(i => i.status === 'Noncompliant');
  return (breached.length / completed.length) * 100;
}

export function calculateAtRiskCount(instances: SlaKpiInstance[]): number {
  return instances.filter(i => 
    !i.isCaseResolved && (
      i.status === 'Nearing Noncompliance' || 
      (i.status === 'In Progress' && i.warningTime && new Date() >= new Date(i.warningTime))
    )
  ).length;
}

export function classifyRisk(instance: SlaKpiInstance): 'Critical' | 'High' | 'Medium' | 'Low' | 'None' {
  if (instance.status === 'Noncompliant') return 'Critical';
  if (instance.status === 'Nearing Noncompliance') return 'High';
  
  if ((instance.status === 'In Progress' || instance.status === 'Paused') && instance.failureTime) {
    const remainingMs = new Date(instance.failureTime).getTime() - new Date().getTime();
    const remainingHours = remainingMs / (1000 * 60 * 60);
    
    if (remainingHours <= 1) return 'High';
    if (remainingHours <= 4) return 'Medium';
    if (remainingHours <= 24) return 'Low';
  }
  
  return 'None';
}

export function calculateAverageResolutionTime(instances: SlaKpiInstance[]): number {
  const succeeded = instances.filter(i => i.status === 'Succeeded' && i.succeededOn && i.createdOn);
  if (succeeded.length === 0) return 0;
  
  // Note: This relies on absolute clock time. For true business-hours SLA time, 
  // the backend would need to expose Dataverse's native 'elapsedtime' attribute.
  const totalMs = succeeded.reduce((sum, i) => {
    return sum + differenceInMilliseconds(new Date(i.succeededOn!), new Date(i.createdOn));
  }, 0);
  
  return totalMs / succeeded.length;
}

export function calculateAverageTimeToBreach(instances: SlaKpiInstance[]): number {
  const breached = instances.filter(i => i.status === 'Noncompliant' && i.modifiedOn && i.createdOn);
  if (breached.length === 0) return 0;
  
  const totalMs = breached.reduce((sum, i) => {
    // failureTime is a scheduled target. modifiedOn represents when it actually breached.
    return sum + differenceInMilliseconds(new Date(i.modifiedOn), new Date(i.createdOn));
  }, 0);
  
  return totalMs / breached.length;
}

export function calculateSlaComplianceTrend(instances: SlaKpiInstance[], period: 'day' | 'week' = 'day') {
  const trendData: Record<string, { total: number; succeeded: number }> = {};

  const applicable = instances.filter(i => i.status === 'Succeeded' || i.status === 'Noncompliant');
  
  applicable.forEach(i => {
    // Plot based on when the instance resolved (or breached), not the scheduled failureTime
    const date = i.succeededOn ? new Date(i.succeededOn) : new Date(i.modifiedOn);
    
    let key = '';
    if (period === 'day') {
      key = format(startOfDay(date), 'MMM dd');
    } else {
      key = format(startOfWeek(date), 'MMM dd');
    }

    if (!trendData[key]) {
      trendData[key] = { total: 0, succeeded: 0 };
    }
    
    trendData[key].total += 1;
    if (i.status === 'Succeeded') {
      trendData[key].succeeded += 1;
    }
  });

  return Object.entries(trendData)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, data]) => ({
      date,
      complianceRate: data.total > 0 ? (data.succeeded / data.total) * 100 : 0
    }));
}

export function calculateBreachConcentration(instances: SlaKpiInstance[]) {
  // Only calculate concentration on completed instances so active instances don't skew the rate
  const completed = instances.filter(i => i.status === 'Succeeded' || i.status === 'Noncompliant');
  
  const getConcentration = (keyFn: (i: SlaKpiInstance) => string) => {
    const stats: Record<string, { total: number; breached: number }> = {};
    completed.forEach(i => {
      const key = keyFn(i) || 'Unassigned';
      if (!stats[key]) stats[key] = { total: 0, breached: 0 };
      stats[key].total += 1;
      if (i.status === 'Noncompliant') stats[key].breached += 1;
    });

    return Object.entries(stats).map(([name, data]) => ({
      name,
      breachRate: data.total > 0 ? (data.breached / data.total) * 100 : 0,
      total: data.total,
      breached: data.breached
    })).sort((a, b) => b.breachRate - a.breachRate);
  };

  return {
    byPriority: getConcentration(i => i.priority),
    byTeam: getConcentration(i => i.owner),
    byCategory: getConcentration(i => i.kpiName)
  };
}
