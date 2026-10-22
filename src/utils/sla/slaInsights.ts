import { type Insight, type InsightSeverity, type SlaBreakdown, type SlaSummary } from '@/@types/sla/SlaDashboard'
import { type SlaFilter } from '@/@types/sla/SlaFilter'
import { type SlaKpiInstance } from '@/@types/sla/SlaKpiInstance'
import { getPriorityLabel } from './priority'
import { type BreachConcentration } from './slaCalculations'

const SEVERITY_ORDER: Record<InsightSeverity, number> = { critical: 0, warning: 1, positive: 2, info: 3 }

/** A group needs at least this many met-or-breached SLAs before its breach rate is worth pointing out. */
const MIN_SAMPLE = 5
/** Percentage points: a change smaller than this is noise, not a finding. */
const MEANINGFUL_CHANGE = 5
const LONG_PAUSE_DAYS = 7

/** Breach rates for one dimension (owner, priority, SLA item) in the period. */
export interface DimensionBreachRates {
    dimension: keyof SlaBreakdown
    label: string
    /** Distinct values among evaluated SLAs — one group means nothing to compare */
    groups: number
    /** Breached ÷ evaluated, all groups together (%) */
    overallRate: number
    rows: BreachConcentration[]
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

const FILTER_KEY: Record<keyof SlaBreakdown, keyof SlaFilter> = { owner: 'owner', priority: 'priority', kpi: 'slaKpi' }

/**
 * The group whose breach rate stands out: well above the overall rate (1.5× and 10 points), with enough SLAs for it
 * to mean something. Rates rather than counts, so a busy owner isn't flagged just for handling more cases.
 */
const findBreachRateOutlier = (rates: DimensionBreachRates[]): Insight | null => {
    let best: { dim: DimensionBreachRates; row: BreachConcentration } | null = null
    for (const dim of rates) {
        if (dim.groups < 2) continue
        for (const row of dim.rows) {
            const standsOut =
                row.total >= MIN_SAMPLE &&
                row.breachRate >= dim.overallRate * 1.5 &&
                row.breachRate >= dim.overallRate + 10
            if (standsOut && (!best || row.breachRate - dim.overallRate > best.row.breachRate - best.dim.overallRate)) {
                best = { dim, row }
            }
        }
    }
    if (!best) return null

    const { dim, row } = best
    const name = dim.dimension === 'priority' ? `${getPriorityLabel(row.name)} priority` : row.name
    return {
        severity: 'warning',
        title: `High breach rate: ${name}`,
        message: `${Math.round(row.breachRate)}% of SLAs for ${name} were breached (${row.breached} of ${row.total}), against ${Math.round(dim.overallRate)}% overall.`,
        actionLabel: `See breaches for ${name}`,
        actionFilter: { [FILTER_KEY[dim.dimension]]: row.name, status: 'Breached', openOnly: false },
    }
}

/** Plain-language findings, most severe first (at most five): what needs action now, then how the period went. */
export const generateInsights = (
    summary: SlaSummary,
    rates: DimensionBreachRates[],
    open: SlaKpiInstance[],
    now: Date = new Date(),
): Insight[] => {
    const insights: Insight[] = []
    const { kpiStats, healthStats, period } = summary

    // 1. Open breaches: the first thing to act on
    if (healthStats.breached > 0) {
        insights.push({
            severity: 'critical',
            title: 'Breached SLAs on open cases',
            message: `${plural(healthStats.breached, 'SLA has', 'SLAs have')} missed the deadline and the case is still open.`,
            actionLabel: 'Review breached cases',
            actionFilter: { status: 'Breached', openOnly: true },
        })
    }

    // 2. About to breach
    if (healthStats.atRisk > 0) {
        insights.push({
            severity: 'warning',
            title: 'Approaching deadlines',
            message: `${plural(healthStats.atRisk, 'open SLA is', 'open SLAs are')} past the warning time (${kpiStats.atRiskPercent}% of running SLAs).`,
            actionLabel: 'Review at-risk cases',
            actionFilter: { status: 'At risk', openOnly: true },
        })
    }

    // 3. Where breaches concentrate (only for dimensions with more than one group)
    const outlier = findBreachRateOutlier(rates)
    if (outlier) insights.push(outlier)

    // 4. How the period compares
    const successChange = kpiStats.successRateTrend
    if (successChange !== null && successChange <= -MEANINGFUL_CHANGE) {
        insights.push({
            severity: 'warning',
            title: 'Adherence falling',
            message: `SLA adherence fell by ${Math.abs(successChange)} percentage points vs ${period.previousLabel}.`,
            actionLabel: 'See breaches in this period',
            actionFilter: { status: 'Breached', openOnly: false },
        })
    } else if (successChange !== null && successChange >= MEANINGFUL_CHANGE) {
        insights.push({
            severity: 'positive',
            title: 'Adherence improving',
            message: `SLA adherence improved by ${successChange} percentage points vs ${period.previousLabel}.`,
        })
    }
    if (kpiStats.medianTimeToMeetTrend !== null && kpiStats.medianTimeToMeetTrend < 0) {
        insights.push({
            severity: 'positive',
            title: 'SLAs met faster',
            message: `The median time to meet an SLA fell by ${Math.abs(kpiStats.medianTimeToMeetTrend)} hours vs ${period.previousLabel}.`,
        })
    }

    // 5. Paused for a long time: easy to forget, and the case isn't moving
    const longPaused = open.filter(
        (r) =>
            r.status === 'Paused' && r.pausedOn && now.getTime() - r.pausedOn.getTime() > LONG_PAUSE_DAYS * 86_400_000,
    ).length
    if (longPaused > 0) {
        insights.push({
            severity: 'info',
            title: 'Long-paused SLAs',
            message: `${plural(longPaused, 'SLA has', 'SLAs have')} been paused for more than ${LONG_PAUSE_DAYS} days.`,
            actionLabel: 'Review paused cases',
            actionFilter: { status: 'Paused', openOnly: true },
        })
    }

    return insights.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]).slice(0, 5)
}
