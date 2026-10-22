import 'server-only'
import { cookies } from 'next/headers'
import { type SessionUser } from '@/@types/auth/SessionUser'
import { type Permission, PERMISSION_LABELS, hasPermission, toRoleNames } from '@/@types/auth/Roles'
import { ForbiddenError, UnauthorizedError } from '@/@types/errors'
import { type AuthErrorCode, SESSION_COOKIE } from '@/constants/auth.constant'
import {
    authConfig,
    getAuthorizeUrl,
    getMyPhoto,
    getMyProfile,
    isAuthConfigured,
    redeemCode,
    type SignInPurpose,
    verifyIdToken,
} from '@/server/data/auth/entra'
import { storeRoleAdminToken } from '@/server/data/auth/delegatedTokens'
import { pkceChallenge, randomToken, seal, unseal } from '@/server/data/auth/session'
import { deleteCachedPhoto, saveCachedPhoto } from '@/server/data/storage/photoCache'
import { isGuid } from '@/server/data/dataverse'

// Who is signed in, what they may do, and the sign-in / sign-out flow.

/** Sign-in can be switched off for local development only (never in production). */
export const isAuthDisabled = () => process.env.AUTH_DISABLED === 'true' && process.env.NODE_ENV !== 'production'

const DEV_USER: SessionUser = {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Local developer',
    email: 'developer@localhost',
    jobTitle: null,
    department: null,
    roles: ['Admin'],
}

const SIGN_IN_FLOW_SECONDS = 10 * 60

export class AuthFlowError extends Error {
    readonly code: AuthErrorCode
    /** Set when the failed attempt was "enable role editing": go back to that page, not the sign-in page */
    readonly returnTo: string | null

    constructor(code: AuthErrorCode, message?: string | null, returnTo: string | null = null) {
        super(message || code)
        this.code = code
        this.returnTo = returnTo
    }
}

interface AuthFlow {
    state: string
    nonce: string
    verifier: string
    returnTo: string
    redirectUri: string
    purpose: SignInPurpose
}

export const sessionCookieOptions = (maxAgeSeconds: number) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
})

export const sessionMaxAge = () => authConfig.sessionHours * 60 * 60

/** The app's public origin (AUTH_BASE_URL behind a proxy), else the request's. */
export const getAppOrigin = (requestOrigin: string) => authConfig.baseUrl || requestOrigin

/** The signed-in user, or null. */
export const getCurrentUser = async (): Promise<SessionUser | null> => {
    if (isAuthDisabled()) return DEV_USER
    const store = await cookies()
    return unseal<SessionUser>(store.get(SESSION_COOKIE)?.value)
}

export const requireUser = async (): Promise<SessionUser> => {
    const user = await getCurrentUser()
    if (!user) throw new UnauthorizedError('Your session has expired. Please sign in again.')
    return user
}

export const assertPermission = (user: SessionUser, permission: Permission) => {
    if (!hasPermission(user.roles, permission)) {
        throw new ForbiddenError(
            `Your role doesn't allow this (${PERMISSION_LABELS[permission].toLowerCase()}). Ask an administrator if you need it.`,
        )
    }
}

/** Only same-site paths, so the sign-in can't be used to bounce people to another site. */
export const safeReturnTo = (value: string | null | undefined) =>
    value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : '/'

const isAllowedEmail = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase()
    return !!domain && authConfig.allowedDomains.includes(domain)
}

const refreshCachedPhoto = async (userId: string, accessToken: string) => {
    try {
        const photo = await getMyPhoto(accessToken)
        if (photo) saveCachedPhoto(userId, photo)
        else deleteCachedPhoto(userId)
    } catch (error) {
        // Not worth failing a sign-in over: initials are shown instead.
        console.warn('[auth] Could not cache the profile photo', error instanceof Error ? error.message : error)
    }
}

/** Where to send the browser to sign in, plus the cookie that remembers this attempt. */
export const startSignIn = async (
    origin: string,
    returnTo: string | null,
    selectAccount = false,
    purpose: SignInPurpose = 'sign-in',
) => {
    if (!isAuthConfigured()) throw new AuthFlowError('NOT_CONFIGURED', 'AUTH_CLIENT_ID / AUTH_CLIENT_SECRET not set')
    const flow: AuthFlow = {
        state: randomToken(),
        nonce: randomToken(),
        verifier: randomToken(48),
        returnTo: safeReturnTo(returnTo),
        redirectUri: `${getAppOrigin(origin)}/api/auth/callback`,
        purpose,
    }
    const url = getAuthorizeUrl({
        redirectUri: flow.redirectUri,
        state: flow.state,
        nonce: flow.nonce,
        codeChallenge: pkceChallenge(flow.verifier),
        selectAccount,
        purpose,
    })
    return { url, flowCookie: await seal(flow, SIGN_IN_FLOW_SECONDS) }
}

/** Finishes the sign-in Microsoft redirected back with: verifies it and builds the session. */
export const completeSignIn = async (params: URLSearchParams, flowCookie: string | undefined) => {
    const flow = await unseal<AuthFlow>(flowCookie)
    const error = params.get('error')
    if (error) {
        throw new AuthFlowError(
            error === 'access_denied' ? 'SIGN_IN_CANCELLED' : 'SIGN_IN_FAILED',
            params.get('error_description'),
            flow?.purpose === 'manage-roles' ? flow.returnTo : null,
        )
    }
    if (!flow || params.get('state') !== flow.state) throw new AuthFlowError('SIGN_IN_EXPIRED')
    const code = params.get('code')
    if (!code) throw new AuthFlowError('SIGN_IN_FAILED', 'No authorization code')

    const tokens = await redeemCode({
        code,
        redirectUri: flow.redirectUri,
        codeVerifier: flow.verifier,
        purpose: flow.purpose,
    })
    const claims = await verifyIdToken(tokens.idToken, flow.nonce)
    const profile = await getMyProfile(tokens.accessToken).catch(() => null)

    const addresses = [profile?.mail, claims.email, claims.preferred_username, profile?.userPrincipalName]
        .filter((a): a is string => !!a)
        .map((a) => a.toLowerCase())
    const email = addresses.find(isAllowedEmail)
    if (!email) throw new AuthFlowError('DOMAIN_NOT_ALLOWED', `Not an allowed domain: ${addresses[0] ?? 'no email'}`)

    let roles = toRoleNames(claims.roles)
    if (!roles.length) {
        roles = toRoleNames([authConfig.defaultRole])
        if (!roles.length) throw new AuthFlowError('NO_ROLE', `${email} has no app role`)
    }

    // Their photo, for the header, role list and history (cached; refreshed at each sign-in).
    if (isGuid(claims.oid)) await refreshCachedPhoto(claims.oid, tokens.accessToken)

    const user: SessionUser = {
        id: claims.oid || claims.sub || email,
        name: profile?.displayName || claims.name || email,
        email,
        jobTitle: profile?.jobTitle ?? null,
        department: profile?.department ?? null,
        roles,
    }
    // Enabling role editing: keep the token that carries the Admin's consent (server-side only).
    const roleAdmin =
        flow.purpose === 'manage-roles' && hasPermission(user.roles, 'users.manage')
            ? await storeRoleAdminToken(user.id, tokens.accessToken, tokens.expiresIn)
            : null
    return { user, returnTo: flow.returnTo, session: await seal(user, sessionMaxAge()), roleAdmin }
}
