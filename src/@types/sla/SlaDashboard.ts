import { type SlaPeriod } from '@/utils/sla/slaPeriod'
import { type SlaFilter } from './SlaFilter'
import { type SlaKpiInstance } from './SlaKpiInstance'

// Two populations, never mixed:
// - Period: SLAs *created* in the selected period, compared like-for-like with the period before (SlaPeriod).
//   Used for outcomes: success rate, breaches, time to meet, breakdowns.
// - Open work: SLAs on cases that are open *now*, whenever they were created. Used for what needs action:
//   at risk, open SLA health, the Action Center.
// A trend is `null` when the previous period has nothing to compare with.

export interface SlaKpiStats {
    /** SLAs started (created) in the period */
    startedCount: number
    /** vs the previous period */
    startedTrend: number | null
    /** % of the period's evaluated SLAs (met + breached) that were met; null when none were evaluated */
    successRate: number | null
    /** Percentage-point change vs the previous period */
    successRateTrend: number | null
    /** Open SLAs at risk now: nearing their deadline (a snapshot, so no trend) */
    atRiskCount: number
    /** % of open SLAs that aren't breached yet that are at risk */
    atRiskPercent: number
    /** SLAs created in the period that missed their deadline */
    breachedCount: number
    /** Breaches in the period minus breaches in the previous period */
    breachedTrend: number | null
    /** Median hours from the SLA starting to being met (calendar time); null when none were met */
    medianTimeToMeet: number | null
    /** Hours, vs the previous period's median */
    medianTimeToMeetTrend: number | null
}

/** Open SLAs now (cases still open, any creation date): on track, at risk, breached, paused. */
export interface SlaHealthStats {
    healthy: number
    atRisk: number
    breached: number
    paused: number
}

export interface SlaSummary {
    period: SlaPeriod
    kpiStats: SlaKpiStats
    healthStats: SlaHealthStats
    /** SLAs created in the period (with the filters applied) */
    totalRecords: number
}

/** One day of SLA flow: started, met and breached that day. */
export interface SlaTrendPoint {
    /** "Oct 21" */
    date: string
    Created: number
    Succeeded: number
    Failed: number
}

export type BreakdownDataPoint = { name: string; value: number }

/** Breaches by one dimension, plus how many groups it has (a single-group breakdown says nothing). */
export interface BreakdownSeries {
    points: BreakdownDataPoint[]
    /** Distinct values among the period's evaluated SLAs */
    groups: number
}

export interface SlaBreakdown {
    owner: BreakdownSeries
    priority: BreakdownSeries
    kpi: BreakdownSeries
}

export type InsightSeverity = 'critical' | 'warning' | 'positive' | 'info'

export interface Insight {
    severity: InsightSeverity
    title: string
    message: string
    actionLabel?: string
    actionFilter?: Partial<SlaFilter>
}

/** Action Center tabs, most urgent first. Met and cancelled SLAs need no action, so they aren't here. */
export type ActionCategory = 'BREACHED' | 'AT_RISK' | 'ON_TRACK' | 'PAUSED'
export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'None'

/** An SLA on an open case that may need someone to act, for the Action Center. */
export interface SlaActionRecord {
    instance: SlaKpiInstance
    category: ActionCategory
    /** Minutes until the deadline (negative once overdue) */
    remainingMinutes: number
    riskLevel: RiskLevel
    /** e.g. "Escalate" for a breach */
    recommendedAction?: string
    /** Other SLA instances of the same case and SLA item (Dynamics re-applies SLAs), shown once */
    duplicates: number
}

/** Filter dropdown options, drawn from the whole date range (not narrowed by the other filters). */
export interface SlaFilterOptions {
    kpis: string[]
    owners: string[]
    priorities: string[]
}

/** Everything the dashboard shows (utils/sla/slaDashboard). */
export interface SlaDashboardData {
    /** The records list: the period's SLAs — or, with "Open cases only", all open work — matching the filter */
    records: SlaKpiInstance[]
    summary: SlaSummary
    trend: SlaTrendPoint[]
    breakdown: SlaBreakdown
    actionRecords: SlaActionRecord[]
    insights: Insight[]
    filterOptions: SlaFilterOptions
    /** Records per status chip, with the other filters applied */
    statusCounts: Record<SlaFilter['status'], number>
}
