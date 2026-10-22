// The API returns Dataverse priorities as "<rank> - <label>", e.g. "1 - Emergency", "4 - Normal".
// Labels without a rank are still ranked so sorting stays stable.

const LEGACY_RANK: Record<string, number> = { emergency: 1, urgent: 2, high: 3, normal: 4, low: 5 }

export const getPriorityRank = (priority: string | undefined): number => {
    if (!priority) return 99
    const match = /^(\d+)\s*-/.exec(priority)
    if (match) return Number(match[1])
    return LEGACY_RANK[priority.trim().toLowerCase()] ?? 99
}

/** Display label without the numeric prefix ("1 - Emergency" → "Emergency"). */
export const getPriorityLabel = (priority: string | undefined) => (priority ?? '').replace(/^\d+\s*-\s*/, '')

/** Tag colours: emergency/urgent stand out, low fades. */
export const getPriorityTagClass = (priority: string | undefined) => {
    const rank = getPriorityRank(priority)
    if (rank <= 2) return 'border-transparent bg-error-subtle text-error'
    if (rank === 3) return 'border-transparent bg-warning-subtle text-warning'
    return ''
}
