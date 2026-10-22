/** Date from an ISO string / Date / timestamp; undefined when missing or invalid. */
export const tryParseDate = (value: unknown): Date | undefined => {
    if (value === null || value === undefined || value === '') return undefined
    const date = value instanceof Date ? value : new Date(value as string | number)
    return Number.isNaN(date.getTime()) ? undefined : date
}

export const tryParseJson = <T = unknown>(value: string | null | undefined): T | undefined => {
    if (!value) return undefined
    try {
        return JSON.parse(value) as T
    } catch {
        return undefined
    }
}
