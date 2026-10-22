import 'server-only'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

// Microsoft 365 (Entra ID) sign-in: OpenID Connect authorization code flow with PKCE, as a
// confidential client. Only accounts in our tenant can sign in (single-tenant authority).
//
// Uses the AUTH_* app registration; falls back to the Graph (SharePoint) one, then the Dataverse one.

const env = (...names: string[]) => names.map((name) => process.env[name]?.trim()).find(Boolean) || ''

export const authConfig = {
    tenantId: env('AUTH_TENANT_ID', 'GRAPH_TENANT_ID', 'DATAVERSE_TENANT_ID'),
    clientId: env('AUTH_CLIENT_ID', 'GRAPH_CLIENT_ID'),
    clientSecret: env('AUTH_CLIENT_SECRET', 'GRAPH_CLIENT_SECRET'),
    /** Public address of the app, e.g. https://sla.example.com (defaults to the request's origin) */
    baseUrl: env('AUTH_BASE_URL').replace(/\/$/, ''),
    /** Comma-separated email domains allowed to sign in */
    allowedDomains: (env('AUTH_ALLOWED_EMAIL_DOMAINS') || 'smartercommunities.com.au,smarterdirectory.com.au')
        .split(',')
        .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
        .filter(Boolean),
    /** Role for users with no app role assigned; 'none' turns them away */
    defaultRole: env('AUTH_DEFAULT_ROLE') || 'Viewer',
    sessionHours: Number(env('AUTH_SESSION_HOURS')) || 8,
}

export const isAuthConfigured = () => !!(authConfig.tenantId && authConfig.clientId && authConfig.clientSecret)

const authority = () => `https://login.microsoftonline.com/${authConfig.tenantId}`

/** Delegated scopes: who the user is, plus their Microsoft 365 profile. */
const SCOPES = 'openid profile email User.Read'

/**
 * Extra delegated scopes an Admin consents to once, to assign roles from the app. Entra ID only
 * allows it if that person may manage this app (an owner of the enterprise app, or a Cloud
 * Application Administrator) — the app itself holds no permission to change roles.
 */
export const ROLE_ADMIN_SCOPES = 'AppRoleAssignment.ReadWrite.All Application.Read.All User.ReadBasic.All'

export type SignInPurpose = 'sign-in' | 'manage-roles'

const scopesFor = (purpose: SignInPurpose) => (purpose === 'manage-roles' ? `${SCOPES} ${ROLE_ADMIN_SCOPES}` : SCOPES)

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

export const getAuthorizeUrl = (input: {
    redirectUri: string
    state: string
    nonce: string
    codeChallenge: string
    selectAccount?: boolean
    purpose?: SignInPurpose
}) => {
    const params = new URLSearchParams({
        client_id: authConfig.clientId,
        response_type: 'code',
        response_mode: 'query',
        redirect_uri: input.redirectUri,
        scope: scopesFor(input.purpose ?? 'sign-in'),
        state: input.state,
        nonce: input.nonce,
        code_challenge: input.codeChallenge,
        code_challenge_method: 'S256',
    })
    if (input.selectAccount) params.set('prompt', 'select_account')
    return `${authority()}/oauth2/v2.0/authorize?${params}`
}

export const redeemCode = async (input: {
    code: string
    redirectUri: string
    codeVerifier: string
    purpose?: SignInPurpose
}) => {
    const res = await fetch(`${authority()}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: authConfig.clientId,
            client_secret: authConfig.clientSecret,
            code: input.code,
            redirect_uri: input.redirectUri,
            code_verifier: input.codeVerifier,
            scope: scopesFor(input.purpose ?? 'sign-in'),
        }),
        cache: 'no-store',
    })
    if (!res.ok) throw new Error(`Entra ID token request failed: ${await res.text()}`)
    const data = await res.json()
    return {
        idToken: data.id_token as string,
        accessToken: data.access_token as string,
        expiresIn: Number(data.expires_in) || 3600,
    }
}

export interface IdTokenClaims extends JWTPayload {
    oid?: string
    name?: string
    preferred_username?: string
    email?: string
    nonce?: string
    roles?: string[]
}

/** Checks the id token's signature, issuer (our tenant), audience (this app) and nonce. */
export const verifyIdToken = async (idToken: string, nonce: string): Promise<IdTokenClaims> => {
    jwks ??= createRemoteJWKSet(new URL(`${authority()}/discovery/v2.0/keys`))
    const { payload } = await jwtVerify<IdTokenClaims>(idToken, jwks, {
        issuer: `${authority()}/v2.0`,
        audience: authConfig.clientId,
    })
    if (payload.nonce !== nonce) throw new Error('The sign-in response did not match this browser.')
    return payload
}

export interface GraphProfile {
    displayName: string | null
    mail: string | null
    userPrincipalName: string | null
    jobTitle: string | null
    department: string | null
}

/** The user's own Microsoft 365 photo (User.Read is enough); null when they have none. */
export const getMyPhoto = async (accessToken: string): Promise<Buffer | null> => {
    const res = await fetch('https://graph.microsoft.com/v1.0/me/photos/96x96/$value', {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
    })
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`Microsoft Graph returned ${res.status} for the profile photo`)
    return Buffer.from(await res.arrayBuffer())
}

/** The user's Microsoft 365 profile, read with their own (delegated) token. */
export const getMyProfile = async (accessToken: string): Promise<GraphProfile | null> => {
    const res = await fetch(
        'https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName,jobTitle,department',
        { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' },
    )
    return res.ok ? res.json() : null
}
