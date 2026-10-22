import { type SlaStatusFilter } from './SlaStatusOptions'

/** A rolling window ending now. */
export const ROLLING_RANGES = ['Today', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days'] as const

export type RollingRange = (typeof ROLLING_RANGES)[number]

/** A calendar month, e.g. `month:2026-10` (the current month runs to now). */
export type MonthRange = `month:${string}`

export type DateRange = RollingRange | MonthRange

export const isMonthRange = (range: DateRange): range is MonthRange => range.startsWith('month:')

/** `'All'` means the filter is off. */
export interface SlaFilter {
    dateRange: DateRange
    status: 'All' | SlaStatusFilter
    priority: string
    slaKpi: string
    owner: string
    /** Only SLAs whose case is still open */
    openOnly: boolean
    /** Free-text search (case number, subject, owner, SLA item) */
    query: string
}

export const DEFAULT_SLA_FILTER: SlaFilter = {
    dateRange: 'Last 30 Days',
    status: 'All',
    priority: 'All',
    slaKpi: 'All',
    owner: 'All',
    openOnly: false,
    query: '',
}
