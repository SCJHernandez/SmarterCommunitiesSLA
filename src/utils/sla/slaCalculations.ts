import { type RiskLevel } from '@/@types/sla/SlaDashboard'
import { type SlaKpiInstance } from '@/@types/sla/SlaKpiInstance'

const MS_PER_MINUTE = 60 * 1000
const MS_PER_HOUR = 60 * MS_PER_MINUTE

/** Succeeded or Noncompliant: the SLA has reached a final outcome. */
export const isEvaluated = (i: SlaKpiInstance) => i.status === 'Succeeded' || i.status === 'Noncompliant'

/** Active (case still open) and either flagged by Dataverse or past its warning time. */
export const isAtRisk = (i: SlaKpiInstance, now: Date = new Date()) => {
    if (i.isCaseResolved) return false
    if (i.status === 'Nearing Noncompliance') return true
    return i.status === 'In Progress' && !!i.warningTime && now >= i.warningTime
}

export const calculateSuccessRate = (instances: SlaKpiInstance[]) => {
    const completed = instances.filter(isEvaluated)
    if (!completed.length) return 0
    return (completed.filter((i) => i.status === 'Succeeded').length / completed.length) * 100
}

export const classifyRisk = (instance: SlaKpiInstance, now: Date = new Date()): RiskLevel => {
    if (instance.status === 'Noncompliant') return 'Critical'
    if (instance.status === 'Nearing Noncompliance') return 'High'

    if ((instance.status === 'In Progress' || instance.status === 'Paused') && instance.failureTime) {
        const remainingHours = (instance.failureTime.getTime() - now.getTime()) / MS_PER_HOUR
        if (remainingHours <= 1) return 'High'
        if (remainingHours <= 4) return 'Medium'
        if (remainingHours <= 24) return 'Low'
    }

    return 'None'
}

/** Middle value (the mean of the two middle ones for an even count); null when empty. */
export const median = (values: number[]): number | null => {
    if (!values.length) return null
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * Median time from the SLA starting to being met, in milliseconds (calendar time); null when nothing was met.
 * The median, because a handful of long-running cases would dominate an average.
 */
export const calculateMedianTimeToMeet = (instances: SlaKpiInstance[]): number | null =>
    median(
        instances
            .filter((i) => i.status === 'Succeeded' && i.succeededOn)
            .map((i) => i.succeededOn!.getTime() - i.createdOn.getTime())
            .filter((ms) => ms >= 0),
    )

/** Minutes from `now` until `date` (negative when it has passed). */
export const minutesUntil = (date: Date, now: Date = new Date()) =>
    Math.round((date.getTime() - now.getTime()) / MS_PER_MINUTE)

/** "2h 05m", "3d 4h" — negative values count as zero. */
export const formatMinutes = (totalMinutes: number) => {
    const mins = Math.max(0, Math.round(totalMinutes))
    if (mins >= 48 * 60) return `${Math.floor(mins / (24 * 60))}d ${Math.floor((mins % (24 * 60)) / 60)}h`
    return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`
}

export interface BreachConcentration {
    name: string
    breachRate: number
    total: number
    breached: number
}

/**
 * Breach counts grouped by a key, over evaluated instances only (so active instances don't skew the rate).
 * Sorted by breach volume, highest first; groups with no breaches are omitted.
 */
export const calculateBreachConcentration = (
    instances: SlaKpiInstance[],
    keyFn: (i: SlaKpiInstance) => string,
): BreachConcentration[] => {
    const stats = new Map<string, { total: number; breached: number }>()

    for (const i of instances) {
        if (!isEvaluated(i)) continue
        const key = keyFn(i) || 'Unassigned'
        const entry = stats.get(key) ?? { total: 0, breached: 0 }
        entry.total += 1
        if (i.status === 'Noncompliant') entry.breached += 1
        stats.set(key, entry)
    }

    return [...stats.entries()]
        .filter(([, data]) => data.breached > 0)
        .map(([name, data]) => ({
            name,
            breachRate: (data.breached / data.total) * 100,
            total: data.total,
            breached: data.breached,
        }))
        .sort((a, b) => b.breached - a.breached || b.breachRate - a.breachRate)
}
