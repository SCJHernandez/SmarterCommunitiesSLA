import { describe, expect, it } from 'vitest'
import { getRecentMonths, getSlaPeriod } from './slaPeriod'

// Tests run with TZ=UTC (vitest.config.ts)
const NOW = new Date('2026-10-22T09:00:00Z')
const iso = (d: Date) => d.toISOString()

describe('getSlaPeriod', () => {
    it('compares the last 30 days with the 30 days before them', () => {
        const p = getSlaPeriod('Last 30 Days', NOW)
        expect(iso(p.start)).toBe('2026-09-22T09:00:00.000Z')
        expect(iso(p.end)).toBe('2026-10-22T09:00:00.000Z')
        expect(iso(p.previousStart)).toBe('2026-08-23T09:00:00.000Z')
        expect(iso(p.previousEnd)).toBe('2026-09-22T09:00:00.000Z')
        expect(p.previousLabel).toBe('the previous 30 days')
    })

    it('compares the last 24 hours with the 24 hours before', () => {
        const p = getSlaPeriod('Today', NOW)
        expect(iso(p.previousStart)).toBe('2026-10-20T09:00:00.000Z')
        expect(iso(p.previousEnd)).toBe(iso(p.start))
        expect(p.label).toBe('in the last 24 hours')
    })

    it('compares a completed month with the whole previous month', () => {
        const p = getSlaPeriod('month:2026-09', NOW)
        expect(iso(p.start)).toBe('2026-09-01T00:00:00.000Z')
        expect(iso(p.end)).toBe('2026-10-01T00:00:00.000Z')
        expect(iso(p.previousStart)).toBe('2026-08-01T00:00:00.000Z')
        expect(iso(p.previousEnd)).toBe('2026-09-01T00:00:00.000Z')
        expect(p.label).toBe('in September 2026')
        expect(p.previousLabel).toBe('August 2026')
    })

    it('compares the current month to date with the same days of the previous month', () => {
        const p = getSlaPeriod('month:2026-10', NOW)
        expect(iso(p.start)).toBe('2026-10-01T00:00:00.000Z')
        expect(iso(p.end)).toBe(iso(NOW))
        expect(iso(p.previousStart)).toBe('2026-09-01T00:00:00.000Z')
        expect(iso(p.previousEnd)).toBe('2026-09-22T09:00:00.000Z')
        expect(p.label).toBe('in October 2026 so far')
        expect(p.previousLabel).toBe('1–22 Sep')
    })

    it('never runs the comparison past the end of a shorter previous month', () => {
        const p = getSlaPeriod('month:2026-03', new Date('2026-03-31T12:00:00Z'))
        expect(iso(p.previousStart)).toBe('2026-02-01T00:00:00.000Z')
        expect(iso(p.previousEnd)).toBe('2026-03-01T00:00:00.000Z')
        expect(p.previousLabel).toBe('February 2026')
    })
})

describe('getRecentMonths', () => {
    it('lists this month first, then the eleven before it', () => {
        const months = getRecentMonths(NOW)
        expect(months).toHaveLength(12)
        expect(months[0]).toEqual({ value: 'month:2026-10', label: 'October 2026 (this month)' })
        expect(months[1]).toEqual({ value: 'month:2026-09', label: 'September 2026' })
        expect(months[11].value).toBe('month:2025-11')
    })
})
