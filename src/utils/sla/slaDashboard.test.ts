import { describe, expect, it } from 'vitest'
import { buildDashboardData } from './slaDashboard'
import { DEFAULT_SLA_FILTER, type SlaFilter } from '@/@types/sla/SlaFilter'
import { type SlaKpiInstance } from '@/@types/sla/SlaKpiInstance'
import { getVisibleSlaRecords } from '@/stores/SlaStore'
import { makeInstance, NOW } from '@/test/fixtures'

const last7Days: SlaFilter = { ...DEFAULT_SLA_FILTER, dateRange: 'Last 7 Days' }

/** Open work as the server returns it: not met or cancelled, on a case that's still open. */
const openWorkOf = (instances: SlaKpiInstance[]) =>
    instances.filter((r) => !r.isCaseResolved && r.status !== 'Succeeded' && r.status !== 'Canceled')

const build = (
    instances: SlaKpiInstance[],
    filter: SlaFilter = last7Days,
    { open = openWorkOf(instances), now = NOW }: { open?: SlaKpiInstance[]; now?: Date } = {},
) => buildDashboardData({ instances, openInstances: open, filter, now })

describe('period outcomes', () => {
    it('compare SLAs created in the period with those created in the previous one', () => {
        const instances = [
            makeInstance({ status: 'Succeeded', createdOn: '2026-10-20T08:00:00Z' }),
            makeInstance({ status: 'Noncompliant', createdOn: '2026-10-19T08:00:00Z' }),
            // previous period (8-14 days ago)
            makeInstance({ status: 'Noncompliant', createdOn: '2026-10-10T08:00:00Z' }),
            makeInstance({ status: 'Noncompliant', createdOn: '2026-10-10T09:00:00Z' }),
            // before both: ignored even if the API returned it
            makeInstance({ status: 'Noncompliant', createdOn: '2026-10-05T08:00:00Z' }),
        ]

        const { kpiStats, totalRecords } = build(instances).summary

        expect(totalRecords).toBe(2)
        expect(kpiStats).toMatchObject({
            startedCount: 2,
            startedTrend: 0,
            successRate: 50,
            successRateTrend: 50, // 50% now vs 0% before
            breachedCount: 1,
            breachedTrend: -1, // 1 breach now vs 2 before
        })
    })

    it('count breaches whether or not the case has since been resolved', () => {
        const instances = [
            makeInstance({ status: 'Noncompliant', isCaseResolved: true, createdOn: '2026-10-20T08:00:00Z' }),
            makeInstance({ status: 'Noncompliant', createdOn: '2026-10-10T08:00:00Z' }),
        ]

        const { kpiStats, healthStats } = build(instances).summary

        expect(kpiStats.breachedCount).toBe(1)
        expect(kpiStats.breachedTrend).toBe(0)
        // Open work ignores the period: the older breach's case is still open, so it needs action now
        expect(healthStats.breached).toBe(1)
    })

    it('report no comparison (null) — and no success rate — when there is nothing to compare', () => {
        const { kpiStats } = build([makeInstance({ status: 'In Progress' })]).summary

        expect(kpiStats.successRate).toBeNull()
        expect(kpiStats.successRateTrend).toBeNull()
        expect(kpiStats.breachedTrend).toBeNull()
        expect(kpiStats.medianTimeToMeet).toBeNull()
        expect(kpiStats.medianTimeToMeetTrend).toBeNull()
    })

    it('use the median calendar time to meet, not the paused duration', () => {
        const met = (createdOn: string, hours: number) =>
            makeInstance({
                status: 'Succeeded',
                createdOn,
                succeededOn: new Date(Date.parse(createdOn) + hours * 3_600_000).toISOString(),
                pausedBusinessMinutes: 30,
            })
        const instances = [
            met('2026-10-19T08:00:00Z', 2),
            met('2026-10-19T09:00:00Z', 4),
            met('2026-10-19T10:00:00Z', 100),
            met('2026-10-10T08:00:00Z', 10),
        ]

        const { kpiStats } = build(instances).summary

        expect(kpiStats.medianTimeToMeet).toBe(4)
        expect(kpiStats.medianTimeToMeetTrend).toBe(-6)
    })

    it('compare a calendar month with the previous month', () => {
        const instances = [
            makeInstance({ status: 'Noncompliant', createdOn: '2026-09-15T08:00:00Z' }),
            makeInstance({ status: 'Noncompliant', createdOn: '2026-09-16T08:00:00Z' }),
            makeInstance({ status: 'Noncompliant', createdOn: '2026-08-20T08:00:00Z' }),
            makeInstance({ status: 'Succeeded', createdOn: '2026-10-02T08:00:00Z' }), // October: outside
        ]

        const { summary, records, trend } = build(instances, { ...DEFAULT_SLA_FILTER, dateRange: 'month:2026-09' })

        expect(records).toHaveLength(2)
        expect(summary.kpiStats.breachedTrend).toBe(1)
        expect(trend).toHaveLength(30)
        expect(trend[0].date).toBe('Sep 01')
    })
})

describe('open work', () => {
    it('includes open cases created before the period (the Action Center must not lose them)', () => {
        const old = makeInstance({ status: 'Noncompliant', createdOn: '2026-09-01T08:00:00Z' })
        const recent = makeInstance({ status: 'In Progress', failureTime: '2026-10-25T00:00:00Z' })

        const { summary, actionRecords } = build([recent], last7Days, { open: [old, recent] })

        expect(summary.healthStats).toMatchObject({ breached: 1, healthy: 1 })
        expect(actionRecords.map((a) => a.category).sort()).toEqual(['BREACHED', 'ON_TRACK'])
    })

    it('counts running SLAs past their deadline as breached, and past the warning time as at risk', () => {
        const open = [
            makeInstance({ status: 'In Progress', failureTime: '2026-10-21T09:00:00Z' }), // overdue, not flagged yet
            makeInstance({
                status: 'In Progress',
                warningTime: '2026-10-21T09:00:00Z',
                failureTime: '2026-10-21T12:00:00Z',
            }),
            makeInstance({ status: 'Nearing Noncompliance', failureTime: '2026-10-21T11:00:00Z' }),
            makeInstance({
                status: 'In Progress',
                warningTime: '2026-10-22T09:00:00Z',
                failureTime: '2026-10-23T09:00:00Z',
            }),
            makeInstance({ status: 'Paused' }),
        ]

        const { healthStats, kpiStats } = build([], last7Days, { open }).summary

        expect(healthStats).toEqual({ breached: 1, atRisk: 2, healthy: 1, paused: 1 })
        expect(kpiStats.atRiskCount).toBe(2)
        expect(kpiStats.atRiskPercent).toBe(67) // 2 of 3 running SLAs
    })

    it('lists each case and SLA item once in the Action Center, keeping the most urgent instance', () => {
        const open = [
            makeInstance({ regardingId: 'case-a', status: 'Paused' }),
            makeInstance({ regardingId: 'case-a', status: 'Noncompliant', failureTime: '2026-10-20T08:00:00Z' }),
            makeInstance({ regardingId: 'case-b', status: 'In Progress', failureTime: '2026-10-24T00:00:00Z' }),
        ]

        const { actionRecords } = build([], last7Days, { open })

        expect(actionRecords.map((a) => [a.instance.regardingId, a.category, a.duplicates])).toEqual([
            ['case-a', 'BREACHED', 1],
            ['case-b', 'ON_TRACK', 0],
        ])
        expect(actionRecords[0].recommendedAction).toBe('Escalate')
        expect(actionRecords[0].remainingMinutes).toBe(-26 * 60)
    })

    it('respects the priority, SLA item and owner filters', () => {
        const open = [
            makeInstance({ status: 'Noncompliant', owner: 'Ann' }),
            makeInstance({ status: 'Noncompliant', owner: 'Bob' }),
        ]

        const { healthStats } = build([], { ...last7Days, owner: 'Ann' }, { open }).summary

        expect(healthStats.breached).toBe(1)
    })
})

describe('trend', () => {
    it('is gap-free and dates breaches at their deadline, not the last edit', () => {
        const instances = [
            makeInstance({
                status: 'Succeeded',
                createdOn: '2026-10-15T08:00:00Z',
                succeededOn: '2026-10-16T08:00:00Z',
            }),
            makeInstance({
                status: 'Noncompliant',
                createdOn: '2026-10-18T08:00:00Z',
                failureTime: '2026-10-19T08:00:00Z',
                modifiedOn: '2026-10-21T08:00:00Z', // edited later: must not move the breach
            }),
        ]

        const { trend } = build(instances)

        expect(trend).toHaveLength(8) // Oct 14 .. Oct 21 inclusive
        expect(trend.find((p) => p.date === 'Oct 15')?.Created).toBe(1)
        expect(trend.find((p) => p.date === 'Oct 16')?.Succeeded).toBe(1)
        expect(trend.find((p) => p.date === 'Oct 19')?.Failed).toBe(1)
        expect(trend.find((p) => p.date === 'Oct 21')?.Failed).toBe(0)
    })

    it('counts outcomes in the period for SLAs that started in the previous one', () => {
        const instances = [
            makeInstance({
                status: 'Succeeded',
                createdOn: '2026-10-12T08:00:00Z',
                succeededOn: '2026-10-15T08:00:00Z',
            }),
        ]

        const { trend } = build(instances)

        expect(trend.find((p) => p.date === 'Oct 15')?.Succeeded).toBe(1)
        expect(trend.reduce((sum, p) => sum + p.Created, 0)).toBe(0)
    })

    it('orders days correctly across a year boundary', () => {
        const { trend } = build([], last7Days, { now: new Date('2027-01-03T10:00:00Z') })

        expect(trend[0].date).toBe('Dec 27')
        expect(trend[trend.length - 1].date).toBe('Jan 03')
    })
})

describe('breakdowns and insights', () => {
    const evaluated = (owner: string, breached: number, met: number) => [
        ...Array.from({ length: breached }, () =>
            makeInstance({ owner, status: 'Noncompliant', isCaseResolved: true }),
        ),
        ...Array.from({ length: met }, () => makeInstance({ owner, status: 'Succeeded', isCaseResolved: true })),
    ]

    it('flags an owner whose breach rate stands out, by rate rather than volume', () => {
        // Ann: 6 of 8 breached (75%); Bob: 2 of 12 (17%); overall 40%
        const instances = [...evaluated('Ann', 6, 2), ...evaluated('Bob', 2, 10)]

        const { breakdown, insights } = build(instances)

        expect(breakdown.owner.groups).toBe(2)
        expect(insights[0]).toMatchObject({
            severity: 'warning',
            title: 'High breach rate: Ann',
            actionFilter: { owner: 'Ann', status: 'Breached', openOnly: false },
        })
        expect(insights[0].message).toBe('75% of SLAs for Ann were breached (6 of 8), against 40% overall.')
    })

    it('says nothing about a dimension with a single group (e.g. one SLA item for everything)', () => {
        const instances = evaluated('Ann', 6, 2)

        const { breakdown, insights } = build(instances)

        expect(breakdown.kpi.groups).toBe(1)
        expect(insights.some((i) => i.title.startsWith('High breach rate'))).toBe(false)
    })

    it('puts breached and at-risk open work first, with drill-downs to all open cases', () => {
        const open = [
            makeInstance({ status: 'Noncompliant' }),
            makeInstance({ status: 'Nearing Noncompliance', failureTime: '2026-10-21T11:00:00Z' }),
        ]

        const { insights } = build([], last7Days, { open })

        expect(insights.map((i) => [i.severity, i.actionFilter])).toEqual([
            ['critical', { status: 'Breached', openOnly: true }],
            ['warning', { status: 'At risk', openOnly: true }],
        ])
    })

    it('points out SLAs paused for more than a week', () => {
        const open = [makeInstance({ status: 'Paused', pausedOn: new Date('2026-10-01T00:00:00Z') })]

        const { insights } = build([], last7Days, { open })

        expect(insights).toEqual([expect.objectContaining({ severity: 'info', title: 'Long-paused SLAs' })])
    })
})

describe('records list', () => {
    it('groups statuses into the status chips and counts each with the other filters applied', () => {
        const instances = [
            makeInstance({ status: 'In Progress', warningTime: '2026-10-22T09:00:00Z' }), // on track
            makeInstance({ status: 'In Progress', warningTime: '2026-10-21T09:00:00Z' }), // past warning: at risk
            makeInstance({ status: 'Nearing Noncompliance' }), // at risk
            makeInstance({ status: 'Noncompliant' }),
            makeInstance({ status: 'Noncompliant', isCaseResolved: true }),
            makeInstance({ status: 'Succeeded', isCaseResolved: true }),
            makeInstance({ status: 'Paused' }),
            makeInstance({ status: 'Canceled', isCaseResolved: true }),
            makeInstance({ status: 'Noncompliant', priority: '1 - Emergency' }), // other priority
        ]
        const filter: SlaFilter = { ...last7Days, priority: '4 - Normal', status: 'At risk' }

        const { records, statusCounts } = build(instances, filter)

        expect(records).toHaveLength(2)
        expect(statusCounts).toEqual({
            All: 8,
            'On track': 1,
            'At risk': 2,
            Breached: 2,
            Met: 1,
            Paused: 1,
            Cancelled: 1,
        })
    })

    it('narrows only the list by status — the KPIs already break down by status', () => {
        const instances = [makeInstance({ status: 'Succeeded' }), makeInstance({ status: 'Noncompliant' })]

        const { records, summary } = build(instances, { ...last7Days, status: 'Breached' })

        expect(records.map((r) => r.status)).toEqual(['Noncompliant'])
        expect(summary.kpiStats.successRate).toBe(50)
    })

    it('with "Open cases only", lists all open work whatever the period', () => {
        const old = makeInstance({ status: 'Noncompliant', createdOn: '2026-09-01T08:00:00Z' })
        const resolved = makeInstance({ status: 'Noncompliant', isCaseResolved: true })

        const { records } = build([resolved], { ...last7Days, status: 'Breached', openOnly: true }, { open: [old] })

        expect(records).toEqual([old])
    })

    it('excludes orphaned timers on resolved cases', () => {
        const instances = [
            makeInstance({ status: 'In Progress', isCaseResolved: true }),
            makeInstance({ status: 'Succeeded', isCaseResolved: true }),
        ]

        expect(build(instances).records.map((r) => r.status)).toEqual(['Succeeded'])
    })

    it('offers filter options from the period and from open work', () => {
        const instances = [
            makeInstance({ priority: '4 - Normal', owner: 'Ann' }),
            makeInstance({ priority: '5 - Low', owner: 'Unassigned' }),
        ]
        const open = [makeInstance({ priority: '1 - Emergency', owner: 'Bob', createdOn: '2026-09-01T08:00:00Z' })]

        const { filterOptions } = build(instances, { ...last7Days, owner: 'Ann' }, { open })

        expect(filterOptions.owners).toEqual(['Ann', 'Bob'])
        expect(filterOptions.priorities).toEqual(['1 - Emergency', '4 - Normal', '5 - Low'])
    })
})

describe('getVisibleSlaRecords', () => {
    it('searches case number, subject, owner and SLA item, then sorts', () => {
        const records = [
            makeInstance({ regardingNumber: 'CAS-2', owner: 'Ann', failureTime: '2026-10-22T00:00:00Z' }),
            makeInstance({ regardingNumber: 'CAS-1', owner: 'Ann', failureTime: '2026-10-21T00:00:00Z' }),
            makeInstance({ regardingNumber: 'CAS-3', owner: 'Bob' }),
        ]
        const visible = getVisibleSlaRecords(records, {
            filter: { ...DEFAULT_SLA_FILTER, query: 'ann' },
            order: { key: 'deadline', direction: 'asc' },
        })
        expect(visible.map((r) => r.regardingNumber)).toEqual(['CAS-1', 'CAS-2'])
    })
})
