import { describe, expect, it } from 'vitest'
import {
    calculateMedianTimeToMeet,
    median,
    calculateBreachConcentration,
    calculateSuccessRate,
    classifyRisk,
    formatMinutes,
    isAtRisk,
} from './slaCalculations'
import { getPriorityLabel, getPriorityRank, getPriorityTagClass } from './priority'
import { makeInstance, NOW } from '@/test/fixtures'

describe('calculateSuccessRate', () => {
    it('only counts evaluated (Succeeded / Noncompliant) instances', () => {
        const instances = [
            makeInstance({ status: 'Succeeded' }),
            makeInstance({ status: 'Succeeded' }),
            makeInstance({ status: 'Succeeded' }),
            makeInstance({ status: 'Noncompliant' }),
            makeInstance({ status: 'In Progress' }),
            makeInstance({ status: 'Paused' }),
        ]
        expect(calculateSuccessRate(instances)).toBe(75)
    })

    it('returns 0 when nothing has been evaluated', () => {
        expect(calculateSuccessRate([makeInstance({ status: 'In Progress' })])).toBe(0)
    })
})

describe('isAtRisk', () => {
    it('flags Nearing Noncompliance and In Progress past the warning time', () => {
        expect(isAtRisk(makeInstance({ status: 'Nearing Noncompliance' }), NOW)).toBe(true)
        expect(isAtRisk(makeInstance({ status: 'In Progress', warningTime: '2026-10-21T09:00:00Z' }), NOW)).toBe(true)
        expect(isAtRisk(makeInstance({ status: 'In Progress', warningTime: '2026-10-21T11:00:00Z' }), NOW)).toBe(false)
    })

    it('ignores instances whose case is already resolved', () => {
        expect(isAtRisk(makeInstance({ status: 'Nearing Noncompliance', isCaseResolved: true }), NOW)).toBe(false)
    })
})

describe('classifyRisk', () => {
    it('grades open instances by hours remaining', () => {
        const due = (iso: string) => classifyRisk(makeInstance({ status: 'In Progress', failureTime: iso }), NOW)
        expect(due('2026-10-21T10:30:00Z')).toBe('High')
        expect(due('2026-10-21T13:00:00Z')).toBe('Medium')
        expect(due('2026-10-22T08:00:00Z')).toBe('Low')
        expect(due('2026-10-25T08:00:00Z')).toBe('None')
        expect(classifyRisk(makeInstance({ status: 'Noncompliant' }), NOW)).toBe('Critical')
    })
})

describe('calculateMedianTimeToMeet', () => {
    it('is the median calendar time from start to met, ignoring paused time and other statuses', () => {
        const met = (hours: number) =>
            makeInstance({
                status: 'Succeeded',
                createdOn: '2026-10-20T00:00:00Z',
                succeededOn: new Date(Date.parse('2026-10-20T00:00:00Z') + hours * 3_600_000).toISOString(),
                pausedBusinessMinutes: 9999, // Dataverse "elapsedtime" = paused duration, not time taken
            })
        const instances = [met(1), met(3), met(200), makeInstance({ status: 'Noncompliant' })]
        expect(calculateMedianTimeToMeet(instances)).toBe(3 * 3_600_000)
    })

    it('is null when nothing was met', () => {
        expect(calculateMedianTimeToMeet([makeInstance({ status: 'Noncompliant' })])).toBeNull()
    })
})

describe('median', () => {
    it('averages the two middle values of an even count', () => {
        expect(median([4, 1, 3, 2])).toBe(2.5)
        expect(median([])).toBeNull()
    })
})

describe('calculateBreachConcentration', () => {
    it('sorts by breach volume and omits groups without breaches', () => {
        const instances = [
            makeInstance({ status: 'Noncompliant', priority: '4 - Normal' }),
            makeInstance({ status: 'Noncompliant', priority: '4 - Normal' }),
            makeInstance({ status: 'Succeeded', priority: '4 - Normal' }),
            makeInstance({ status: 'Noncompliant', priority: '1 - Emergency' }),
            makeInstance({ status: 'Succeeded', priority: '5 - Low' }),
        ]
        const result = calculateBreachConcentration(instances, (i) => i.priority)
        expect(result.map((r) => [r.name, r.breached])).toEqual([
            ['4 - Normal', 2],
            ['1 - Emergency', 1],
        ])
    })
})

describe('formatMinutes', () => {
    it('formats hours and minutes, days for long spans, and clamps negatives', () => {
        expect(formatMinutes(125)).toBe('2h 05m')
        expect(formatMinutes(3 * 24 * 60 + 4 * 60)).toBe('3d 4h')
        expect(formatMinutes(-30)).toBe('0h 00m')
    })
})

describe('priority helpers', () => {
    it('ranks Dataverse "N - Label" priorities and legacy labels', () => {
        expect(getPriorityRank('1 - Emergency')).toBe(1)
        expect(getPriorityRank('5 - Low')).toBe(5)
        expect(getPriorityRank('High')).toBe(3)
        expect(getPriorityRank(undefined)).toBe(99)
    })

    it('strips the numeric prefix for display', () => {
        expect(getPriorityLabel('2 - Urgent')).toBe('Urgent')
    })

    it('highlights emergency and urgent priorities', () => {
        expect(getPriorityTagClass('1 - Emergency')).toContain('text-error')
        expect(getPriorityTagClass('4 - Normal')).toBe('')
    })
})
