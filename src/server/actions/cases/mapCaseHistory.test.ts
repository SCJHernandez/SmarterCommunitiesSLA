import { describe, expect, it } from 'vitest'
import { mapCaseHistory } from './index'

const F = '@OData.Community.Display.V1.FormattedValue'

// Shaped like Dataverse's RetrieveRecordChangeHistory response (AuditDetailCollection.AuditDetails)
const audit = (id: string, createdon: string, action: number, actionLabel: string, user = 'Josephine Sciglitano') => ({
    auditid: id,
    createdon,
    action,
    [`action${F}`]: actionLabel,
    _userid_value: '11111111-1111-1111-1111-111111111111',
    [`_userid_value${F}`]: user,
})

const details = [
    {
        '@odata.type': '#Microsoft.Dynamics.CRM.AttributeAuditDetail',
        AuditRecord: audit('a1', '2026-10-01T09:00:00Z', 1, 'Create'),
        OldValue: {},
        NewValue: { title: 'Printer offline', modifiedon: '2026-10-01T09:00:00Z' },
    },
    {
        '@odata.type': '#Microsoft.Dynamics.CRM.AttributeAuditDetail',
        AuditRecord: audit('a2', '2026-10-03T10:00:00Z', 2, 'Update'),
        OldValue: { statuscode: 1, [`statuscode${F}`]: 'In Progress', modifiedon: '2026-10-01T09:00:00Z' },
        NewValue: { statuscode: 5, [`statuscode${F}`]: 'Problem Solved', modifiedon: '2026-10-03T10:00:00Z' },
    },
    {
        '@odata.type': '#Microsoft.Dynamics.CRM.AttributeAuditDetail',
        AuditRecord: audit('a3', '2026-10-02T08:00:00Z', 13, 'Assign', 'Harvey Castanares'),
        OldValue: { _ownerid_value: 'x', [`_ownerid_value${F}`]: 'Myka Cleofe' },
        NewValue: { _ownerid_value: 'y', [`_ownerid_value${F}`]: 'Sosan Brown' },
    },
    {
        // Saved with nothing readable changed: dropped
        '@odata.type': '#Microsoft.Dynamics.CRM.AttributeAuditDetail',
        AuditRecord: audit('a4', '2026-10-04T08:00:00Z', 2, 'Update'),
        OldValue: { modifiedon: '2026-10-03T10:00:00Z' },
        NewValue: { modifiedon: '2026-10-04T08:00:00Z' },
    },
    {
        '@odata.type': '#Microsoft.Dynamics.CRM.AttributeAuditDetail',
        AuditRecord: audit('a5', '2026-10-05T08:00:00Z', 2, 'Update'),
        OldValue: { prioritycode: 2, [`prioritycode${F}`]: 'Normal', description: null },
        NewValue: { prioritycode: 1, [`prioritycode${F}`]: 'High', description: 'Customer called again' },
    },
]

describe('mapCaseHistory', () => {
    const entries = mapCaseHistory(details, { statuscode: 'Status Reason', prioritycode: 'Priority' })

    it('lists events newest first and drops saves that changed nothing readable', () => {
        expect(entries.map((e) => e.id)).toEqual(['a5', 'a2', 'a3', 'a1'])
    })

    it('uses formatted values and display names, without bookkeeping fields', () => {
        const status = entries.find((e) => e.id === 'a2')!
        expect(status).toMatchObject({ user: 'Josephine Sciglitano', action: 'updated', actionLabel: 'Update' })
        expect(status.changes).toEqual([
            { field: 'statuscode', label: 'Status Reason', oldValue: 'In Progress', newValue: 'Problem Solved' },
        ])
    })

    it('reads lookups (owner) by their logical name', () => {
        const assign = entries.find((e) => e.id === 'a3')!
        expect(assign.action).toBe('assigned')
        expect(assign.changes).toEqual([
            { field: 'ownerid', label: 'Ownerid', oldValue: 'Myka Cleofe', newValue: 'Sosan Brown' },
        ])
    })

    it('keeps several changes of one save together, with empty old values as null', () => {
        const update = entries.find((e) => e.id === 'a5')!
        expect(update.changes).toEqual([
            { field: 'prioritycode', label: 'Priority', oldValue: 'Normal', newValue: 'High' },
            { field: 'description', label: 'Description', oldValue: null, newValue: 'Customer called again' },
        ])
    })
})
