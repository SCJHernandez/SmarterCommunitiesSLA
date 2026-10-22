import 'server-only'
import { type Collection } from '@/@types/dynamics/collections'
import { type SlaKpiInstanceDto } from '@/@types/sla/SlaKpiInstance'
import { type SlaStatusName } from '@/@types/sla/SlaStatusOptions'
import { ServiceUnavailableError } from '@/@types/errors'
import { dataverse, formatted } from '@/server/data/dataverse'

// SLA KPI instances from Dataverse, joined to their Case (incident), the Case owner and the SLA item.
// FetchXML because the joins (incident → systemuser) can't be expressed with OData $expand on a
// polymorphic lookup. Read-only: this app never writes to Dataverse.

const PAGE_SIZE = 5000
const CACHE_MS = 3 * 60 * 1000
/** Open work changes minute to minute, and it's a small query */
const OPEN_CACHE_MS = 60 * 1000

type Row = Record<string, unknown>

const STATUS: Record<number, SlaStatusName> = {
    0: 'In Progress',
    1: 'Noncompliant',
    2: 'Nearing Noncompliance',
    3: 'Paused',
    4: 'Succeeded',
    5: 'Canceled',
}

// incident.prioritycode (custom values for Emergency and Urgent), shown as "<rank> - <label>"
const PRIORITY: Record<number, string> = {
    921910001: '1 - Emergency',
    921910000: '2 - Urgent',
    1: '3 - High',
    2: '4 - Normal',
    3: '5 - Low',
}

/** incident.statecode: 1 Resolved, 2 Cancelled */
const CLOSED_CASE_STATES = new Set([1, 2])

const xmlAttr = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Which SLAs: created in a window, or every SLA still in play on a case that's open now. */
type SlaScope = { kind: 'created'; start: Date; end: Date } | { kind: 'open' }

/** Met (4) and cancelled (5) SLAs need no action, so open work leaves them out. */
const scopeFilter = (scope: SlaScope) =>
    scope.kind === 'created'
        ? `<filter type="and">
      <condition attribute="createdon" operator="ge" value="${scope.start.toISOString()}" />
      <condition attribute="createdon" operator="lt" value="${scope.end.toISOString()}" />
    </filter>`
        : `<filter type="and">
      <condition attribute="status" operator="not-in"><value>4</value><value>5</value></condition>
    </filter>`

const buildFetchXml = (scope: SlaScope, page: number, pagingCookie: string | null) => `
<fetch version="1.0" mapping="logical" count="${PAGE_SIZE}" page="${page}"${pagingCookie ? ` paging-cookie="${xmlAttr(pagingCookie)}"` : ''}>
  <entity name="slakpiinstance">
    <attribute name="slakpiinstanceid" />
    <attribute name="name" />
    <attribute name="msdyn_slaitemid" />
    <attribute name="regarding" />
    <attribute name="status" />
    <attribute name="failuretime" />
    <attribute name="warningtime" />
    <attribute name="succeededon" />
    <attribute name="pausedon" />
    <attribute name="createdon" />
    <attribute name="modifiedon" />
    <attribute name="ownerid" />
    <attribute name="elapsedtime" />
    <order attribute="createdon" descending="true" />
    ${scopeFilter(scope)}
    <link-entity name="incident" from="incidentid" to="regarding" link-type="${scope.kind === 'open' ? 'inner' : 'outer'}" alias="case">
      <attribute name="ticketnumber" />
      <attribute name="title" />
      <attribute name="prioritycode" />
      <attribute name="statecode" />
      ${scope.kind === 'open' ? '<filter><condition attribute="statecode" operator="eq" value="0" /></filter>' : ''}
      <link-entity name="systemuser" from="systemuserid" to="ownerid" link-type="outer" alias="caseowner">
        <attribute name="fullname" />
      </link-entity>
    </link-entity>
    <link-entity name="slaitem" from="slaitemid" to="msdyn_slaitemid" link-type="outer" alias="slaitem">
      <attribute name="msdyn_slakpiid" />
      <attribute name="name" />
    </link-entity>
  </entity>
</fetch>`

/** The `pagingcookie` attribute of the cookie Dataverse returns (it arrives URL-encoded twice). */
const readPagingCookie = (cookieXml: unknown): string | null => {
    if (typeof cookieXml !== 'string') return null
    const match = /pagingcookie="([^"]*)"/.exec(cookieXml)
    return match ? decodeURIComponent(decodeURIComponent(match[1])) : null
}

const text = (row: Row, column: string) => (typeof row[column] === 'string' ? (row[column] as string) : undefined)
const number = (row: Row, column: string) => (typeof row[column] === 'number' ? (row[column] as number) : undefined)

const mapSlaKpiInstance = (row: Row): SlaKpiInstanceDto => {
    const name = text(row, 'name') ?? 'Unknown KPI'
    const regarding = formatted(row, '_regarding_value')
    const ticketNumber = text(row, 'case.ticketnumber')
    const caseState = number(row, 'case.statecode')

    return {
        id: text(row, 'slakpiinstanceid') ?? '',
        name,
        kpiId: text(row, 'slaitem.msdyn_slakpiid') ?? '',
        kpiName: formatted(row, '_msdyn_slaitemid_value') ?? text(row, 'slaitem.name') ?? name,
        regardingId: text(row, '_regarding_value') ?? '',
        regardingType: ticketNumber ? 'incident' : '',
        regardingNumber: ticketNumber ?? regarding ?? 'Unknown',
        regardingSubject: text(row, 'case.title') ?? regarding ?? 'Unknown subject',
        status: STATUS[number(row, 'status') ?? 0] ?? 'In Progress',
        priority: PRIORITY[number(row, 'case.prioritycode') ?? 2] ?? '4 - Normal',
        failureTime: text(row, 'failuretime') ?? null,
        warningTime: text(row, 'warningtime') ?? null,
        succeededOn: text(row, 'succeededon') ?? null,
        pausedOn: text(row, 'pausedon') ?? null,
        createdOn: text(row, 'createdon') ?? new Date().toISOString(),
        modifiedOn: text(row, 'modifiedon') ?? new Date().toISOString(),
        // Dataverse's `elapsedtime` is the paused duration in business hours — not the time taken
        pausedBusinessMinutes: number(row, 'elapsedtime') ?? null,
        owner: text(row, 'caseowner.fullname') ?? formatted(row, '_ownerid_value') ?? 'Unassigned',
        team: '',
        category: '',
        isCaseResolved: caseState !== undefined && CLOSED_CASE_STATES.has(caseState),
    }
}

const querySlaKpis = async (scope: SlaScope): Promise<Collection<SlaKpiInstanceDto>> => {
    if (!dataverse.configured) {
        throw new ServiceUnavailableError(
            'Dataverse is not configured. Set DATAVERSE_URL and the DATAVERSE_* app registration in .env.local.',
            'DATAVERSE_NOT_CONFIGURED',
        )
    }

    const records: SlaKpiInstanceDto[] = []
    let page = 1
    let pagingCookie: string | null = null
    for (;;) {
        const fetchXml = buildFetchXml(scope, page, pagingCookie)
        const result = await dataverse.get<Row & { value: Row[] }>(
            `slakpiinstances?fetchXml=${encodeURIComponent(fetchXml)}`,
        )
        records.push(...(result?.value ?? []).map(mapSlaKpiInstance))
        if (!result?.['@Microsoft.Dynamics.CRM.morerecords']) break
        pagingCookie = readPagingCookie(result['@Microsoft.Dynamics.CRM.fetchxmlpagingcookie'])
        page++
    }

    return { total: records.length, records }
}

// Briefly cached (and shared by concurrent requests), so page loads don't each query Dataverse. Keyed to the hour:
// the browser sends "now" as the end of the range, which moves every request.
const cache = new Map<string, { expiresAt: number; result: Promise<Collection<SlaKpiInstanceDto>> }>()
const hourKey = (date: Date) => date.toISOString().slice(0, 13)

const cached = (key: string, lifetimeMs: number, query: () => Promise<Collection<SlaKpiInstanceDto>>) => {
    const now = Date.now()
    for (const [k, entry] of cache) if (entry.expiresAt <= now) cache.delete(k)

    const hit = cache.get(key)
    if (hit) return hit.result

    const result = query()
    cache.set(key, { expiresAt: now + lifetimeMs, result })
    result.catch(() => cache.delete(key)) // never cache a failure
    return result
}

/** SLA KPI instances created in [start, end). */
export const getSlaKpis = (start: Date, end: Date): Promise<Collection<SlaKpiInstanceDto>> =>
    cached(`created|${hourKey(start)}|${hourKey(end)}`, CACHE_MS, () => querySlaKpis({ kind: 'created', start, end }))

/** Open work: SLAs still running, paused or breached on cases that are open now — whenever they were created. */
export const getOpenSlaKpis = (): Promise<Collection<SlaKpiInstanceDto>> =>
    cached('open', OPEN_CACHE_MS, () => querySlaKpis({ kind: 'open' }))
