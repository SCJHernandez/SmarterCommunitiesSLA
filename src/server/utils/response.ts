import 'server-only'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { ApiRouteError, type ApiErrorBody } from '@/@types/errors'

// Response builders used by every API route.

export const getJsonResponse = <T>(data: T, init?: { status?: number }) =>
    NextResponse.json(data, { status: init?.status ?? 200, headers: { 'Cache-Control': 'no-store' } })

export const getEmptyResponse = () => new NextResponse(null, { status: 204 })

export const getFileResponse = (
    bytes: Buffer | Uint8Array,
    {
        fileName,
        contentType = 'application/pdf',
        inline = true,
    }: { fileName: string; contentType?: string; inline?: boolean },
) =>
    new NextResponse(new Uint8Array(bytes), {
        headers: {
            'Content-Type': contentType,
            'Content-Length': String(bytes.length),
            // Plain-ASCII name for old clients, plus the exact (UTF-8) name — headers can't carry it raw.
            'Content-Disposition':
                `${inline ? 'inline' : 'attachment'}; filename="${fileName.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '')}"; ` +
                `filename*=UTF-8''${encodeURIComponent(fileName)}`,
            'Cache-Control': 'no-store',
        },
    })

/** An image the browser may keep for a while (e.g. a profile photo). Private: it's per signed-in user. */
export const getImageResponse = (bytes: Buffer | Uint8Array, contentType: string, maxAgeSeconds = 24 * 60 * 60) =>
    new NextResponse(new Uint8Array(bytes), {
        headers: {
            'Content-Type': contentType,
            'Content-Length': String(bytes.length),
            'Cache-Control': `private, max-age=${maxAgeSeconds}`,
        },
    })

/** Maps any thrown error to `{ error, code, ...extra }` with the right status. */
export const getApiErrorResponse = (error: unknown) => {
    if (error instanceof ApiRouteError) {
        if (error.status >= 500) console.error('[api]', error.message, error.extra)
        const body: ApiErrorBody = { error: error.message, code: error.code, ...error.extra }
        return NextResponse.json(body, { status: error.status })
    }
    if (error instanceof ZodError) {
        const first = error.issues[0]
        const body: ApiErrorBody = {
            error: first ? `${first.path.join('.') || 'value'}: ${first.message}` : 'Invalid request',
            code: 'INVALID_DATA',
        }
        return NextResponse.json(body, { status: 400 })
    }
    console.error('[api] Unhandled error', error)
    const body: ApiErrorBody = { error: 'Something went wrong on the server.', code: 'INTERNAL_ERROR' }
    return NextResponse.json(body, { status: 500 })
}
