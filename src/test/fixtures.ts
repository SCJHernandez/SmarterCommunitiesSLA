import { type SlaKpiInstance } from '@/@types/sla/SlaKpiInstance'

export const NOW = new Date('2026-10-21T10:00:00Z')

let nextId = 1

/** An SLA KPI instance with sensible defaults; dates may be given as ISO strings. */
export const makeInstance = (
    overrides: Partial<
        Omit<SlaKpiInstance, 'createdOn' | 'modifiedOn' | 'failureTime' | 'warningTime' | 'succeededOn'>
    > & {
        createdOn?: string
        modifiedOn?: string
        failureTime?: string
        warningTime?: string
        succeededOn?: string
    } = {},
): SlaKpiInstance => {
    const id = nextId++
    const { createdOn, modifiedOn, failureTime, warningTime, succeededOn, ...rest } = overrides
    const date = (value: string | undefined) => (value ? new Date(value) : undefined)
    return {
        id: `sla-${id}`,
        name: `SLA ${id}`,
        kpiId: 'kpi-1',
        kpiName: 'Resolve KPI',
        regardingId: `case-${id}`,
        regardingType: 'incident',
        regardingNumber: `CAS-${1000 + id}`,
        regardingSubject: `Case ${id}`,
        status: 'In Progress',
        createdOn: new Date(createdOn ?? '2026-10-20T08:00:00Z'),
        modifiedOn: new Date(modifiedOn ?? createdOn ?? '2026-10-20T08:00:00Z'),
        failureTime: date(failureTime),
        warningTime: date(warningTime),
        succeededOn: date(succeededOn),
        owner: 'Jane Doe',
        team: '',
        priority: '4 - Normal',
        category: '',
        isCaseResolved: false,
        ...rest,
    }
}
