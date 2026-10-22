import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

/** "3 Oct 2026" — or a dash when there's no date. */
export const formatDate = (value: Date | string | null | undefined, format = 'D MMM YYYY') =>
    value ? dayjs(value).format(format) : '—'

export const formatDateTime = (value: Date | string | null | undefined) => formatDate(value, 'D MMM YYYY, h:mm a')

/** "5 minutes ago" */
export const fromNow = (value: Date | string | null | undefined) => (value ? dayjs(value).fromNow() : '—')

/** "1m 05s" from milliseconds */
export const formatDuration = (ms: number) => {
    const seconds = Math.max(0, Math.round(ms / 1000))
    if (seconds < 60) return `${seconds}s`
    return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`
}

/** Value for <input type="date"> */
export const toDateInputValue = (value: Date | string | null | undefined) =>
    value ? dayjs(value).format('YYYY-MM-DD') : ''
