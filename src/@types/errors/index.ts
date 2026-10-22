// Typed errors thrown by server actions and mapped to HTTP responses by `apiHandler`.
// `code` lets the UI show a specific message; `extra` is merged into the JSON error body.

export class ApiRouteError extends Error {
    readonly status: number
    readonly code: string | null
    readonly extra: Record<string, unknown>

    constructor(status: number, message: string, code?: string | null, extra: Record<string, unknown> = {}) {
        super(message)
        this.status = status
        this.code = code ?? null
        this.extra = extra
    }
}

export class DataError extends ApiRouteError {
    constructor(message: string, code: string | null = 'INVALID_DATA', extra?: Record<string, unknown>) {
        super(400, message, code, extra)
    }
}

export class UnauthorizedError extends ApiRouteError {
    constructor(message = 'Unauthorized', code: string | null = 'UNAUTHORIZED') {
        super(401, message, code)
    }
}

export class ForbiddenError extends ApiRouteError {
    constructor(message = 'Forbidden', code: string | null = 'FORBIDDEN') {
        super(403, message, code)
    }
}

export class NotFoundError extends ApiRouteError {
    constructor(message = 'Not found', code: string | null = 'NOT_FOUND') {
        super(404, message, code)
    }
}

export class ConflictError extends ApiRouteError {
    constructor(message: string, code: string | null = 'CONFLICT', extra?: Record<string, unknown>) {
        super(409, message, code, extra)
    }
}

export class DataTooLargeError extends ApiRouteError {
    constructor(message: string, code: string | null = 'DATA_TOO_LARGE') {
        super(413, message, code)
    }
}

export class ServiceUnavailableError extends ApiRouteError {
    constructor(message: string, code: string | null = 'SERVICE_UNAVAILABLE') {
        super(503, message, code)
    }
}

/** Shape of every error response body. */
export interface ApiErrorBody {
    error: string
    code: string | null
    details?: string | null
    [key: string]: unknown
}
