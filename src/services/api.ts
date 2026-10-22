import axios, { type AxiosRequestConfig, type AxiosResponse, isAxiosError } from 'axios'
import axiosRetry from 'axios-retry'
import { apiPath, loginPath } from '@/configs/app.config'
import { RETURN_TO_URL_KEY } from '@/constants/auth.constant'
import { type ApiErrorBody } from '@/@types/errors'

// Centralised HTTP client for the browser. Every service in src/services goes through this.

export type ApiOptions = Pick<AxiosRequestConfig, 'signal' | 'timeout' | 'onUploadProgress'>

/** Error from our API, carrying the server's machine-readable `code` (e.g. OPEN_ITEMS). */
export class ApiError extends Error {
    readonly status: number
    readonly code: string | null
    readonly body: Partial<ApiErrorBody>

    constructor(message: string, status: number, code: string | null, body: Partial<ApiErrorBody> = {}) {
        super(message)
        this.status = status
        this.code = code
        this.body = body
    }
}

const STATUS_MESSAGES: Record<number, string> = {
    400: 'The request was not valid.',
    401: 'Your session has expired. Please sign in again.',
    403: "You don't have access to this.",
    404: 'Not found.',
    409: 'This was changed by someone else.',
    413: 'The file is too large.',
    500: 'Something went wrong on the server.',
    502: 'A service the app depends on is not responding.',
    503: 'The service is temporarily unavailable.',
}

const toApiError = async (error: unknown): Promise<ApiError> => {
    if (!isAxiosError(error)) return new ApiError(error instanceof Error ? error.message : String(error), 0, null)
    if (!error.response) return new ApiError('Could not reach the server. Check your connection.', 0, 'NETWORK_ERROR')

    let body = error.response.data as Partial<ApiErrorBody> | Blob | undefined
    if (body instanceof Blob)
        body = await body
            .text()
            .then((text) => JSON.parse(text))
            .catch(() => ({}))
    const status = error.response.status
    const parsed = (body ?? {}) as Partial<ApiErrorBody>
    return new ApiError(
        parsed.error || STATUS_MESSAGES[status] || `Request failed (${status})`,
        status,
        parsed.code ?? null,
        parsed,
    )
}

const instance = axios.create({ baseURL: apiPath, timeout: 60_000 })

axiosRetry(instance, {
    retries: 3,
    retryDelay: (count) => count * 5000,
    // Only idempotent requests, and only transient failures
    retryCondition: (error) =>
        ['get', 'head', 'options'].includes(error.config?.method ?? '') &&
        (!error.response || [502, 503, 504].includes(error.response.status)),
})

const request = async <T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    try {
        return await instance.request<T>(config)
    } catch (error) {
        const apiError = await toApiError(error)
        // The session ended: sign in again and come back (unsaved editor changes are kept as a local draft).
        if (apiError.status === 401 && typeof window !== 'undefined') {
            const returnTo = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
            // A full page load (not router navigation): the sign-in leaves the app for Microsoft.
            window.location.href = new URL(`${loginPath}?${RETURN_TO_URL_KEY}=${returnTo}`, window.location.origin).href
        }
        throw apiError
    }
}

const api = {
    /** Returns the response body. */
    fetchJson: async <T>(config: AxiosRequestConfig): Promise<T> => (await request<T>(config)).data,
    /** Returns the full response. */
    fetch: request,
    /** Returns a file as a Blob plus its name from Content-Disposition. */
    fetchBlob: async (config: AxiosRequestConfig): Promise<{ data: Blob; name: string }> => {
        const res = await request<Blob>({ ...config, responseType: 'blob' })
        const disposition = String(res.headers['content-disposition'] ?? '')
        const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? 'download'
        return { data: res.data, name }
    },
}

export default api
