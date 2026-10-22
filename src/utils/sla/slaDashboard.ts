import dayjs from 'dayjs'
import {
    type ActionCategory,
    type BreakdownSeries,
    type RiskLevel,
    type SlaActionRecord,
    type SlaBreakdown,
    type SlaDashboardData,
    type SlaFilterOptions,
    type SlaHealthStats,
    type SlaSummary,
    type SlaTrendPoint,
} from '@/@types/sla/SlaDashboard'
import { type SlaFilter } from '@/@types/sla/SlaFilter'
import { type SlaKpiInstance } from '@/@types/sla/SlaKpiInstance'
import { SLA_STATUS_FILTERS } from '@/@types/sla/SlaStatusOptions'
import { getPriorityRank } from './priority'
import { type SlaPeriod, getSlaPeriod } from './slaPeriod'
import { type DimensionBreachRates, generateInsights } from './slaInsights'
import {
    calculateBreachConcentration,
    calculateMedianTimeToMeet,
    calculateSuccessRate,
    classifyRisk,
    isAtRisk,
    isEvaluated,
    minutesUntil,
} from './slaCalculations'

const MS_PER_HOUR = 60 * 60 * 1000

/** SLA timers left running on resolved or cancelled cases. */
const isOrphanedTimer = (r: SlaKpiInstance) =>
    r.isCaseResolved && (r.status === 'In Progress' || r.status === 'Nearing Noncompliance')

/** Still running but past its deadline — Dataverse hasn't flagged it yet. Counts as breached. */
const isOverdue = (r: SlaKpiInstance, now: Date) =>
    (r.status === 'In Progress' || r.status === 'Nearing Noncompliance') && !!r.failureTime && r.failureTime <= now

/** Where an SLA on an open case stands right now. */
type OpenState = 'breached' | 'atRisk' | 'onTrack' | 'paused'

const openState = (r: SlaKpiInstance, now: Date): OpenState | null => {
    if (r.status === 'Noncompliant' || isOverdue(r, now)) return 'breached'
    if (r.status === 'Paused') return 'paused'
    if (isAtRisk(r, now)) return 'atRisk'
    if (r.status === 'In Progress') return 'onTrack'
    return null // met or cancelled: nothing to do
}

/** The status chips: each a group of Dataverse statuses, in the dashboard's words. */
export const matchesStatusFilter = (r: SlaKpiInstance, status: SlaFilter['status'], now: Date = new Date()) => {
    switch (status) {
        case 'All':
            return true
        case 'On track':
            return !r.isCaseResolved && openState(r, now) === 'onTrack'
        case 'At risk':
            return !r.isCaseResolved && openState(r, now) === 'atRisk'
        case 'Breached':
            return r.status === 'Noncompliant' || (!r.isCaseResolved && isOverdue(r, now))
        case 'Met':
            return r.status === 'Succeeded'
        case 'Paused':
            return r.status === 'Paused'
        case 'Cancelled':
            return r.status === 'Canceled'
    }
}

/** Priority, SLA item and owner — the filters that apply to every population. */
const matchesDimensions = (r: SlaKpiInstance, filter: SlaFilter) =>
    (filter.priority === 'All' || r.priority === filter.priority) &&
    (filter.slaKpi === 'All' || r.kpiName === filter.slaKpi) &&
    (filter.owner === 'All' || r.owner === filter.owner)

const within = (date: Date | undefined, start: Date, end: Date) => !!date && date >= start && date < end

const breaches = (records: SlaKpiInstance[]) => records.filter((r) => r.status === 'Noncompliant').length

const toHours = (ms: number | null) => (ms === null ? null : Number((ms / MS_PER_HOUR).toFixed(1)))

const difference = (current: number | null, previous: number | null) =>
    current === null || previous === null ? null : Number((current - previous).toFixed(1))

const buildHealth = (open: SlaKpiInstance[], now: Date): SlaHealthStats => {
    const health: SlaHealthStats = { healthy: 0, atRisk: 0, breached: 0, paused: 0 }
    for (const r of open) {
        const state = openState(r, now)
        if (state === 'breached') health.breached++
        else if (state === 'atRisk') health.atRisk++
        else if (state === 'onTrack') health.healthy++
        else if (state === 'paused') health.paused++
    }
    return health
}

const buildSummary = (
    current: SlaKpiInstance[],
    previous: SlaKpiInstance[],
    open: SlaKpiInstance[],
    period: SlaPeriod,
    now: Date,
): SlaSummary => {
    const successRate = current.some(isEvaluated) ? calculateSuccessRate(current) : null
    const previousSuccessRate = previous.some(isEvaluated) ? calculateSuccessRate(previous) : null
    const medianMs = calculateMedianTimeToMeet(current)
    const previousMedianMs = calculateMedianTimeToMeet(previous)
    const health = buildHealth(open, now)
    const running = health.healthy + health.atRisk

    return {
        period,
        kpiStats: {
            startedCount: current.length,
            startedTrend: previous.length ? current.length - previous.length : null,
            successRate: successRate === null ? null : Math.round(successRate),
            // Percentage points, from unrounded rates
            successRateTrend: difference(successRate, previousSuccessRate),
            atRiskCount: health.atRisk,
            atRiskPercent: running ? Math.round((health.atRisk / running) * 100) : 0,
            breachedCount: breaches(current),
            breachedTrend: previous.length ? breaches(current) - breaches(previous) : null,
            medianTimeToMeet: toHours(medianMs),
            // Hours, from unrounded medians
            medianTimeToMeetTrend: toHours(
                medianMs === null || previousMedianMs === null ? null : medianMs - previousMedianMs,
            ),
        },
        healthStats: health,
        totalRecords: current.length,
    }
}

/**
 * SLA flow per day: SLAs that started, and SLAs met or breached that day (a breach happens at its deadline).
 * Outcomes count on the day they happened, so SLAs started in the previous period but met or breached in this one
 * count too.
 */
const buildTrend = (current: SlaKpiInstance[], both: SlaKpiInstance[], period: SlaPeriod): SlaTrendPoint[] => {
    const buckets = new Map<string, Omit<SlaTrendPoint, 'date'>>()
    for (let d = dayjs(period.start).startOf('day'); d.isBefore(period.end); d = d.add(1, 'day')) {
        buckets.set(d.format('YYYY-MM-DD'), { Created: 0, Succeeded: 0, Failed: 0 })
    }
    const add = (date: Date | undefined, key: keyof Omit<SlaTrendPoint, 'date'>) => {
        if (!within(date, period.start, period.end)) return
        const bucket = buckets.get(dayjs(date).format('YYYY-MM-DD'))
        if (bucket) bucket[key]++
    }

    for (const r of current) add(r.createdOn, 'Created')
    for (const r of both) {
        if (r.status === 'Succeeded') add(r.succeededOn, 'Succeeded')
        else if (r.status === 'Noncompliant') add(r.failureTime, 'Failed')
    }

    return [...buckets.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, counts]) => ({ date: dayjs(key).format('MMM DD'), ...counts }))
}

const DIMENSIONS = {
    owner: { label: 'Owner', key: (i: SlaKpiInstance) => i.owner },
    priority: { label: 'Priority', key: (i: SlaKpiInstance) => i.priority },
    kpi: { label: 'SLA item', key: (i: SlaKpiInstance) => i.kpiName },
} as const

const buildBreakdowns = (current: SlaKpiInstance[]) => {
    const evaluated = current.filter(isEvaluated)
    const overallRate = evaluated.length ? (breaches(evaluated) / evaluated.length) * 100 : 0
    const breakdown = {} as SlaBreakdown
    const rates: DimensionBreachRates[] = []

    for (const [dimension, { label, key }] of Object.entries(DIMENSIONS) as [
        keyof SlaBreakdown,
        (typeof DIMENSIONS)[keyof typeof DIMENSIONS],
    ][]) {
        const rows = calculateBreachConcentration(current, key)
        const series: BreakdownSeries = {
            points: rows.map((c) => ({ name: c.name, value: c.breached })),
            groups: new Set(evaluated.map((i) => key(i) || 'Unassigned')).size,
        }
        breakdown[dimension] = series
        rates.push({ dimension, label, groups: series.groups, overallRate, rows })
    }
    return { breakdown, rates }
}

const CATEGORY_ORDER: Record<ActionCategory, number> = { BREACHED: 0, AT_RISK: 1, ON_TRACK: 2, PAUSED: 3 }

const buildActionRecords = (open: SlaKpiInstance[], now: Date): SlaActionRecord[] => {
    const records: SlaActionRecord[] = []
    for (const instance of open) {
        const state = openState(instance, now)
        if (!state) continue
        const minutesToFailure = instance.failureTime ? minutesUntil(instance.failureTime, now) : undefined
        const category: ActionCategory =
            state === 'breached'
                ? 'BREACHED'
                : state === 'atRisk'
                  ? 'AT_RISK'
                  : state === 'paused'
                    ? 'PAUSED'
                    : 'ON_TRACK'
        if (category === 'ON_TRACK' && minutesToFailure === undefined) continue // no deadline: nothing to act on

        const risk = classifyRisk(instance, now)
        records.push({
            instance,
            category,
            remainingMinutes: minutesToFailure ?? 0,
            riskLevel: risk === 'None' || risk === 'Low' ? 'Medium' : (risk as RiskLevel),
            recommendedAction: category === 'BREACHED' ? 'Escalate' : category === 'AT_RISK' ? 'Review' : undefined,
            duplicates: 0,
        })
    }

    // Dynamics re-applies SLAs, so a case can carry several instances of one SLA item: show the most urgent once
    const byCase = new Map<string, SlaActionRecord>()
    const counts = new Map<string, number>()
    for (const record of records) {
        const key = `${record.instance.regardingId || record.instance.id}|${record.instance.kpiName}`
        counts.set(key, (counts.get(key) ?? 0) + 1)
        const kept = byCase.get(key)
        const moreUrgent =
            !kept ||
            CATEGORY_ORDER[record.category] < CATEGORY_ORDER[kept.category] ||
            (record.category === kept.category && record.remainingMinutes < kept.remainingMinutes)
        if (moreUrgent) byCase.set(key, record)
    }
    return [...byCase.entries()].map(([key, record]) => ({ ...record, duplicates: (counts.get(key) ?? 1) - 1 }))
}

const buildFilterOptions = (records: SlaKpiInstance[]): SlaFilterOptions => {
    const unique = (values: string[]) => [...new Set(values.filter(Boolean))]
    return {
        kpis: unique(records.map((r) => r.kpiName)).sort(),
        owners: unique(records.map((r) => r.owner))
            .filter((o) => o !== 'Unassigned')
            .sort(),
        priorities: unique(records.map((r) => r.priority)).sort((a, b) => getPriorityRank(a) - getPriorityRank(b)),
    }
}

/** How many records each status chip would show, with the other filters applied. */
const countStatuses = (records: SlaKpiInstance[], now: Date) => {
    const counts = { All: records.length } as Record<SlaFilter['status'], number>
    for (const status of SLA_STATUS_FILTERS) {
        counts[status] = records.filter((r) => matchesStatusFilter(r, status, now)).length
    }
    return counts
}

export interface DashboardInput {
    /** SLAs created in the selected period and the one it's compared with (services/sla) */
    instances: SlaKpiInstance[]
    /** SLAs on cases that are open now, whenever they were created (services/sla) */
    openInstances: SlaKpiInstance[]
    filter: SlaFilter
    now?: Date
}

/**
 * Derives every dashboard section. Builds new objects — call inside useMemo.
 * Outcomes use the period's SLAs; what needs action uses open work (see @types/sla/SlaDashboard). The status
 * filter narrows only the records list: the KPIs, charts and Action Center are themselves a breakdown by status.
 */
export const buildDashboardData = ({
    instances,
    openInstances,
    filter,
    now = new Date(),
}: DashboardInput): SlaDashboardData => {
    const period = getSlaPeriod(filter.dateRange, now)

    const relevant = instances.filter((r) => !isOrphanedTimer(r) && matchesDimensions(r, filter))
    const current = relevant.filter((r) => within(r.createdOn, period.start, period.end))
    const previous = relevant.filter((r) => within(r.createdOn, period.previousStart, period.previousEnd))
    const open = openInstances.filter((r) => !r.isCaseResolved && openState(r, now) && matchesDimensions(r, filter))

    const summary = buildSummary(current, previous, open, period, now)
    const { breakdown, rates } = buildBreakdowns(current)
    // "Open cases only" lists all open work, whatever the period
    const listed = filter.openOnly ? open : current

    return {
        records: listed.filter((r) => matchesStatusFilter(r, filter.status, now)),
        summary,
        trend: buildTrend(current, [...current, ...previous], period),
        breakdown,
        actionRecords: buildActionRecords(open, now),
        insights: generateInsights(summary, rates, open, now),
        filterOptions: buildFilterOptions([
            ...instances.filter((r) => within(r.createdOn, period.start, period.end)),
            ...openInstances,
        ]),
        statusCounts: countStatuses(listed, now),
    }
}
