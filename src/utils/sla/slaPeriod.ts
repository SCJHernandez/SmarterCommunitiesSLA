import dayjs from 'dayjs'
import { type DateRange, type MonthRange, type RollingRange, isMonthRange } from '@/@types/sla/SlaFilter'

/** The selected period and the one it's compared with. Both are [start, end) in the browser's time zone. */
export interface SlaPeriod {
    start: Date
    end: Date
    previousStart: Date
    previousEnd: Date
    /** Completes "SLAs created …", e.g. "in the last 30 days", "in October 2026 so far" */
    label: string
    /** Completes "vs …", e.g. "the previous 30 days", "1–22 Sep", "September 2026" */
    previousLabel: string
}

const ROLLING_DAYS: Record<RollingRange, number> = {
    Today: 1,
    'Last 7 Days': 7,
    'Last 30 Days': 30,
    'Last 90 Days': 90,
}

const rollingSpan = (range: RollingRange) => (range === 'Today' ? '24 hours' : `${ROLLING_DAYS[range]} days`)

/** First day of the month, local midnight. */
const monthStart = (range: MonthRange) => dayjs(`${range.slice('month:'.length)}-01`).startOf('month')

export const toMonthRange = (date: Date | dayjs.Dayjs): MonthRange => `month:${dayjs(date).format('YYYY-MM')}`

/**
 * Rolling ranges compare with the equal-length window just before. A completed month compares with the whole
 * previous month; the current month (to date) with the same days of the previous month.
 */
export const getSlaPeriod = (range: DateRange, now: Date = new Date()): SlaPeriod => {
    if (isMonthRange(range)) {
        const start = monthStart(range)
        const nextMonth = start.add(1, 'month')
        const inProgress = dayjs(now).isBefore(nextMonth)
        const end = inProgress ? dayjs(now) : nextMonth
        const previousStart = start.subtract(1, 'month')
        // Same elapsed time into the previous month, but never past its end
        const sameSpan = previousStart.add(end.diff(start), 'millisecond')
        const previousEnd = inProgress && sameSpan.isBefore(start) ? sameSpan : start

        return {
            start: start.toDate(),
            end: end.toDate(),
            previousStart: previousStart.toDate(),
            previousEnd: previousEnd.toDate(),
            label: inProgress ? `in ${start.format('MMMM YYYY')} so far` : `in ${start.format('MMMM YYYY')}`,
            previousLabel:
                inProgress && previousEnd.isBefore(start)
                    ? `1–${previousEnd.subtract(1, 'millisecond').format('D MMM')}`
                    : previousStart.format('MMMM YYYY'),
        }
    }

    const days = ROLLING_DAYS[range] ?? 30
    const end = dayjs(now)
    const start = end.subtract(days, 'day')
    return {
        start: start.toDate(),
        end: end.toDate(),
        previousStart: start.subtract(days, 'day').toDate(),
        previousEnd: start.toDate(),
        label: `in the last ${rollingSpan(range)}`,
        previousLabel: `the previous ${rollingSpan(range)}`,
    }
}

/** The current month and the `count - 1` before it, newest first, for the month filter. */
export const getRecentMonths = (now: Date = new Date(), count = 12): { value: MonthRange; label: string }[] =>
    Array.from({ length: count }, (_, i) => {
        const month = dayjs(now).startOf('month').subtract(i, 'month')
        const name = month.format('MMMM YYYY')
        return { value: toMonthRange(month), label: i === 0 ? `${name} (this month)` : name }
    })

/** Short label for a selected range, e.g. "30 days" or "October 2026". */
export const getRangeLabel = (range: DateRange) =>
    isMonthRange(range) ? monthStart(range).format('MMMM YYYY') : rollingSpan(range)
