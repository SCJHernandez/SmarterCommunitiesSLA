// SLA KPI instance statuses (Dataverse `slakpiinstance.status`), mapped to text by the API.

export const SLA_STATUSES = [
    'In Progress',
    'Nearing Noncompliance',
    'Noncompliant',
    'Paused',
    'Succeeded',
    'Canceled',
] as const

export type SlaStatusName = (typeof SLA_STATUSES)[number]

/** Most urgent first, for sorting. */
export const SLA_STATUS_ORDER: Record<SlaStatusName, number> = {
    Noncompliant: 1,
    'Nearing Noncompliance': 2,
    'In Progress': 3,
    Paused: 4,
    Succeeded: 5,
    Canceled: 6,
}

export const slaStatusTagClass: Record<SlaStatusName, string> = {
    Noncompliant: 'border-transparent bg-error-subtle text-error',
    'Nearing Noncompliance': 'border-transparent bg-warning-subtle text-warning',
    'In Progress': 'border-transparent bg-info-subtle text-info',
    Paused: '',
    Succeeded: 'border-transparent bg-success-subtle text-success',
    Canceled: '',
}

// What the status filter offers: the dashboard's own words, each a clear group of Dataverse statuses
// (see matchesStatusFilter in utils/sla/slaDashboard). "Open cases only" is a separate switch.
export const SLA_STATUS_FILTERS = ['On track', 'At risk', 'Breached', 'Met', 'Paused', 'Cancelled'] as const

export type SlaStatusFilter = (typeof SLA_STATUS_FILTERS)[number]

export const SLA_STATUS_FILTER_HINTS: Record<SlaStatusFilter, string> = {
    'On track': 'Open SLAs not yet past their warning time',
    'At risk': 'Nearing noncompliance, or past the warning time',
    Breached: 'Missed the deadline (noncompliant)',
    Met: 'Met the deadline (succeeded)',
    Paused: 'SLA timer paused',
    Cancelled: 'SLA cancelled',
}
