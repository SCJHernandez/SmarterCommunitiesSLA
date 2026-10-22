import {
    DEFAULT_SLA_FILTER,
    type DateRange,
    ROLLING_RANGES,
    type SlaFilter,
    isMonthRange,
} from '@/@types/sla/SlaFilter'
import { SLA_STATUS_FILTERS } from '@/@types/sla/SlaStatusOptions'
import { getRecentMonths } from '@/utils/sla/slaPeriod'

// The SLA filters each person last used, kept in their browser (per signed-in user, this device only) so the
// dashboard opens the way they left it. The search box isn't kept — it's for finding one thing, once.

/** What's remembered: everything but the search text. */
export type SavedSlaFilter = Omit<SlaFilter, 'query'>

export const savedSlaFilterKey = (userId: string) => `sla_filter_${userId}`

export const toSavedSlaFilter = ({
    dateRange,
    status,
    priority,
    slaKpi,
    owner,
    openOnly,
}: SlaFilter): SavedSlaFilter => ({
    dateRange,
    status,
    priority,
    slaKpi,
    owner,
    openOnly,
})

const isDateRange = (value: unknown, now: Date): value is DateRange =>
    typeof value === 'string' &&
    ((ROLLING_RANGES as readonly string[]).includes(value) ||
        // Only months the month picker still offers
        (isMonthRange(value as DateRange) && getRecentMonths(now).some((m) => m.value === value)))

const isText = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length < 200

/**
 * A saved filter, checked field by field: anything missing, out of date or not understood falls back to the
 * default, so a bad or old entry can't leave the dashboard stuck on a filter nobody can see.
 */
export const parseSavedSlaFilter = (raw: unknown, now: Date = new Date()): SlaFilter => {
    const saved = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    const status = saved.status
    return {
        ...DEFAULT_SLA_FILTER,
        dateRange: isDateRange(saved.dateRange, now) ? saved.dateRange : DEFAULT_SLA_FILTER.dateRange,
        status:
            status === 'All' || (SLA_STATUS_FILTERS as readonly unknown[]).includes(status)
                ? (status as SlaFilter['status'])
                : DEFAULT_SLA_FILTER.status,
        priority: isText(saved.priority) ? saved.priority : DEFAULT_SLA_FILTER.priority,
        slaKpi: isText(saved.slaKpi) ? saved.slaKpi : DEFAULT_SLA_FILTER.slaKpi,
        owner: isText(saved.owner) ? saved.owner : DEFAULT_SLA_FILTER.owner,
        openOnly: typeof saved.openOnly === 'boolean' ? saved.openOnly : DEFAULT_SLA_FILTER.openOnly,
    }
}
