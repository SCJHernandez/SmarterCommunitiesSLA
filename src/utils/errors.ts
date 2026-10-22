import { ApiError } from '@/services/api'

/** Best human-readable message for anything thrown or returned as an error. */
export const tryGetErrorMessage = (error: unknown): string => {
    if (!error) return ''
    if (typeof error === 'string') return error
    if (error instanceof Error) return error.message
    if (typeof error === 'object') {
        const e = error as Record<string, unknown>
        for (const key of ['error', 'message', 'details']) {
            if (typeof e[key] === 'string' && e[key]) return e[key] as string
        }
        try {
            return JSON.stringify(error)
        } catch {
            /* circular */
        }
    }
    return String(error)
}

/** The API's machine-readable error code, if any (e.g. 'OPEN_ITEMS', 'REVISION_CONFLICT'). */
export const getErrorCode = (error: unknown): string | null => (error instanceof ApiError ? error.code : null)

export const isNotFoundError = (error: unknown) => error instanceof ApiError && error.status === 404

export const isConflictError = (error: unknown) => error instanceof ApiError && error.status === 409
