import { describe, expect, it } from 'vitest'
import { DEFAULT_SLA_FILTER } from '@/@types/sla/SlaFilter'
import { parseSavedSlaFilter, toSavedSlaFilter } from './savedSlaFilter'

const now = new Date('2026-10-22T10:00:00Z')

describe('saved SLA filters', () => {
    it('round-trips everything but the search text', () => {
        const filter = {
            ...DEFAULT_SLA_FILTER,
            dateRange: 'month:2026-09' as const,
            status: 'Breached' as const,
            owner: 'Ann',
            openOnly: true,
            query: 'CAS-1',
        }
        const saved = JSON.parse(JSON.stringify(toSavedSlaFilter(filter)))
        expect(saved).not.toHaveProperty('query')
        expect(parseSavedSlaFilter(saved, now)).toEqual({ ...filter, query: '' })
    })

    it('falls back to the defaults for nothing saved, or something unreadable', () => {
        expect(parseSavedSlaFilter(null, now)).toEqual(DEFAULT_SLA_FILTER)
        expect(parseSavedSlaFilter('nonsense', now)).toEqual(DEFAULT_SLA_FILTER)
    })

    it('drops fields that are out of date or not understood, keeping the rest', () => {
        const parsed = parseSavedSlaFilter(
            {
                dateRange: 'month:2024-01', // no longer offered by the month picker
                status: 'Reopened', // not a status any more
                priority: 42,
                owner: 'Ann',
                openOnly: 'yes',
            },
            now,
        )
        expect(parsed).toEqual({ ...DEFAULT_SLA_FILTER, owner: 'Ann' })
    })

    it('keeps a rolling period', () => {
        expect(parseSavedSlaFilter({ dateRange: 'Last 7 Days' }, now).dateRange).toBe('Last 7 Days')
    })
})
