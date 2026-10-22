import { type SlaStatusName } from './SlaStatusOptions'

/** An SLA KPI instance (one SLA timer on a Case), as the app uses it. Dates are hydrated by services/sla. */
export interface SlaKpiInstance {
    id: string
    name: string
    kpiId: string
    /** The SLA item, e.g. "Resolve by KPI" */
    kpiName: string
    /** The Case (incident) the SLA belongs to */
    regardingId: string
    regardingType: string
    regardingNumber: string
    regardingSubject: string

    status: SlaStatusName
    failureTime?: Date
    warningTime?: Date
    succeededOn?: Date
    pausedOn?: Date
    createdOn: Date
    modifiedOn: Date

    owner: string
    team: string
    /** Dataverse priority as "<rank> - <label>", e.g. "1 - Emergency" (see utils/sla/priority) */
    priority: string
    category: string
    /** The parent Case is resolved or cancelled */
    isCaseResolved: boolean
    /** Time the SLA timer was paused, in business-hours minutes (Dataverse `elapsedtime`: "Paused duration of a KPI") */
    pausedBusinessMinutes?: number
}

/** Shape returned by GET /api/sla/kpis (server/actions/sla). */
export interface SlaKpiInstanceDto extends Omit<
    SlaKpiInstance,
    'failureTime' | 'warningTime' | 'succeededOn' | 'pausedOn' | 'createdOn' | 'modifiedOn' | 'pausedBusinessMinutes'
> {
    failureTime?: string | null
    warningTime?: string | null
    succeededOn?: string | null
    pausedOn?: string | null
    createdOn: string
    modifiedOn: string
    pausedBusinessMinutes?: number | null
}
