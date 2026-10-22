import 'server-only'
import { type NextRequest } from 'next/server'
import { DataError } from '@/@types/errors'
import { type Permission } from '@/@types/auth/Roles'
import { type SessionUser } from '@/@types/auth/SessionUser'
import { getApiErrorResponse } from '@/server/utils/response'
import { assertPermission, requireUser } from '@/server/actions/auth'

// Wrappers for every API route handler: consistent error responses and logging.
// `apiAuthHandler` also requires a signed-in user with the given permission (401 / 403 otherwise).
// Dataverse, Graph and Foundry are still called with the app registration; the user is recorded
// as the author of what they change.

export interface ApiRouteContext<P extends Record<string, string> = Record<string, string>> {
    params: Promise<P>
}

type ApiRouteHandler<P extends Record<string, string>> = (
    req: NextRequest,
    ctx: ApiRouteContext<P>,
) => Promise<Response>

export const apiHandler =
    <P extends Record<string, string> = Record<string, string>>(handler: ApiRouteHandler<P>) =>
    async (req: NextRequest, ctx: ApiRouteContext<P>) => {
        try {
            return await handler(req, ctx)
        } catch (error) {
            return getApiErrorResponse(error)
        }
    }

type ApiAuthRouteHandler<P extends Record<string, string>> = (
    req: NextRequest,
    ctx: ApiRouteContext<P>,
    user: SessionUser,
) => Promise<Response>

export const apiAuthHandler = <P extends Record<string, string> = Record<string, string>>(
    permission: Permission,
    handler: ApiAuthRouteHandler<P>,
) =>
    apiHandler<P>(async (req, ctx) => {
        const user = await requireUser()
        assertPermission(user, permission)
        return handler(req, ctx, user)
    })

/** Parses a JSON body; malformed JSON becomes a 400. */
export const readJsonBody = async <T = unknown>(req: NextRequest): Promise<T> => {
    try {
        return (await req.json()) as T
    } catch {
        throw new DataError('The request body must be valid JSON.')
    }
}
