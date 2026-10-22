import 'server-only'
import { type CaseFieldChange, type CaseHistoryAction, type CaseHistoryEntryDto } from '@/@types/cases/CaseHistory'
import { ForbiddenError } from '@/@types/errors'
import { DataverseError, assertGuid, dataverse, formatted } from '@/server/data/dataverse'

// A Case's audit history from Dataverse (RetrieveRecordChangeHistory): who changed what, and when.
// Needs auditing on for Cases (it is) and the "View Audit History" privilege for the app's Dataverse user.

/** Most recent events shown */
const MAX_ENTRIES = 50
const LABELS_CACHE_MS = 24 * 60 * 60 * 1000

/** Bookkeeping columns that change with every save and mean nothing to a reader. */
const IGNORED_FIELDS = new Set([
    'modifiedon',
    'modifiedby',
    'modifiedonbehalfby',
    'versionnumber',
    'timezoneruleversionnumber',
    'utcconversiontimezonecode',
    'importsequencenumber',
    'overriddencreatedon',
    'processid',
    'stageid',
    'traversedpath',
    'exchangerate',
    'transactioncurrencyid',
    'owningbusinessunit',
    'owninguser',
    'owningteam',
])

/** audit.action → what happened. Activate/Deactivate are status changes, so they read like updates. */
const ACTIONS: Record<number, CaseHistoryAction> = {
    1: 'created',
    2: 'updated',
    3: 'deleted',
    4: 'updated',
    5: 'updated',
    13: 'assigned',
}

const toAction = (code: number, label: string | undefined): CaseHistoryAction =>
    ACTIONS[code] ?? (label && /merge/i.test(label) ? 'merged' : 'other')

type Row = Record<string, unknown>

interface AuditDetail {
    '@odata.type'?: string
    AuditRecord?: Row
    OldValue?: Row
    NewValue?: Row
}

/** `_ownerid_value` → `ownerid`; annotations and OData keys are not fields. */
const fieldName = (key: string) =>
    key.startsWith('_') && key.endsWith('_value') ? key.slice(1, -'_value'.length) : key
const isFieldKey = (key: string) => !key.includes('@') && !key.startsWith('@')

/** Display text for one value: Dataverse's formatted value when it has one (choices, lookups, dates). */
const displayValue = (row: Row | undefined, key: string): string | null => {
    if (!row || !(key in row)) return null
    const formattedValue = formatted(row, key)
    if (formattedValue !== undefined) return formattedValue
    const value = row[key]
    if (value === null || value === undefined || value === '') return null
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    return String(value)
}

const humanise = (field: string) =>
    field
        .replace(/^(sc|msdyn|adx)_/, '')
        .replace(/_/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase())

/** Maps RetrieveRecordChangeHistory audit details to history entries, newest first. Pure — exported for tests. */
export const mapCaseHistory = (details: AuditDetail[], labels: Record<string, string> = {}): CaseHistoryEntryDto[] =>
    details
        .filter((d) => d.AuditRecord)
        .map((d) => {
            const record = d.AuditRecord!
            const actionCode = typeof record.action === 'number' ? record.action : -1
            const keys = new Set(
                [...Object.keys(d.OldValue ?? {}), ...Object.keys(d.NewValue ?? {})].filter(isFieldKey),
            )
            const changes: CaseFieldChange[] = [...keys]
                .map((key) => {
                    const field = fieldName(key)
                    return {
                        field,
                        label: labels[field] ?? humanise(field),
                        oldValue: displayValue(d.OldValue, key),
                        newValue: displayValue(d.NewValue, key),
                    }
                })
                .filter((c) => !IGNORED_FIELDS.has(c.field) && c.oldValue !== c.newValue)

            return {
                id: String(record.auditid ?? ''),
                createdOn: String(record.createdon ?? ''),
                user: formatted(record, '_userid_value') ?? 'Someone',
                action: toAction(actionCode, formatted(record, 'action')),
                actionLabel: formatted(record, 'action') ?? 'Change',
                changes,
            }
        })
        // A plain save with nothing readable changed isn't worth a line
        .filter((e) => e.action !== 'updated' || e.changes.length > 0)
        .sort((a, b) => b.createdOn.localeCompare(a.createdOn))
        .slice(0, MAX_ENTRIES)

let labelsCache: { expiresAt: number; labels: Record<string, string> } | null = null

/** Case column display names ("statuscode" → "Status Reason"), cached for a day. */
const getCaseFieldLabels = async (): Promise<Record<string, string>> => {
    if (labelsCache && labelsCache.expiresAt > Date.now()) return labelsCache.labels
    const result = await dataverse.get<{
        value: { LogicalName: string; DisplayName?: { UserLocalizedLabel?: { Label?: string } } }[]
    }>("EntityDefinitions(LogicalName='incident')/Attributes?$select=LogicalName,DisplayName")
    const labels = Object.fromEntries(
        (result?.value ?? [])
            .map((a) => [a.LogicalName, a.DisplayName?.UserLocalizedLabel?.Label] as const)
            .filter((pair): pair is readonly [string, string] => !!pair[1]),
    )
    labelsCache = { expiresAt: Date.now() + LABELS_CACHE_MS, labels }
    return labels
}

/** The Case's audit history, newest first (at most MAX_ENTRIES events). */
export const getCaseHistory = async (caseId: string): Promise<CaseHistoryEntryDto[]> => {
    const target = encodeURIComponent(JSON.stringify({ '@odata.id': `incidents(${assertGuid(caseId, 'case id')})` }))
    try {
        const [result, labels] = await Promise.all([
            dataverse.get<{ AuditDetailCollection?: { AuditDetails?: AuditDetail[] } }>(
                `RetrieveRecordChangeHistory(Target=@target)?@target=${target}`,
            ),
            getCaseFieldLabels().catch(() => ({})),
        ])
        return mapCaseHistory(result?.AuditDetailCollection?.AuditDetails ?? [], labels)
    } catch (error) {
        if (error instanceof DataverseError && error.dataverseStatus === 403) {
            throw new ForbiddenError(
                "The dashboard isn't allowed to read audit history yet. A Dynamics 365 administrator needs to add the " +
                    '"View Audit History" privilege to the security role of the app\'s Dataverse user.',
                'AUDIT_NOT_PERMITTED',
            )
        }
        throw error
    }
}
