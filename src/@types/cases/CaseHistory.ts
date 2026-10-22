/** One field that changed in an audited event. Values are display text (formatted by Dataverse). */
export interface CaseFieldChange {
    /** Logical name, e.g. `statuscode` */
    field: string
    /** Display name, e.g. "Status Reason" */
    label: string
    oldValue: string | null
    newValue: string | null
}

export type CaseHistoryAction = 'created' | 'updated' | 'assigned' | 'merged' | 'deleted' | 'other'

/** An event in a Case's Dataverse audit history. */
export interface CaseHistoryEntry {
    id: string
    createdOn: Date
    /** Who did it (a person, or an integration such as an SLA flow) */
    user: string
    action: CaseHistoryAction
    /** Dataverse's own name for the action, e.g. "Update", "Assign" */
    actionLabel: string
    changes: CaseFieldChange[]
}

/** The JSON shape (dates as strings). */
export type CaseHistoryEntryDto = Omit<CaseHistoryEntry, 'createdOn'> & { createdOn: string }
