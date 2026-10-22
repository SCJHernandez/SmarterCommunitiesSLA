/** Encrypted session (the signed-in user) */
export const SESSION_COOKIE = 'sla_session'

/** Short-lived state of a sign-in in progress (state, nonce, PKCE verifier, return address) */
export const AUTH_FLOW_COOKIE = 'sla_auth_flow'

/** Refers to the Admin's role-editing token (kept on the server) — see server/data/auth/delegatedTokens */
export const ROLE_ADMIN_COOKIE = 'sla_role_admin'

/** URL search param holding where to go after signing in */
export const RETURN_TO_URL_KEY = 'returnTo'

export type AuthErrorCode =
    'DOMAIN_NOT_ALLOWED' | 'NO_ROLE' | 'SIGN_IN_CANCELLED' | 'SIGN_IN_EXPIRED' | 'SIGN_IN_FAILED' | 'NOT_CONFIGURED'

/** What the sign-in page says for each `?error=` code. */
export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
    DOMAIN_NOT_ALLOWED: "That account isn't allowed here. Sign in with your work email address.",
    NO_ROLE: "Your account doesn't have access to this app yet. Ask an administrator to assign you a role.",
    SIGN_IN_CANCELLED: 'Sign-in was cancelled.',
    SIGN_IN_EXPIRED: 'The sign-in took too long. Please try again.',
    SIGN_IN_FAILED: "We couldn't sign you in. Please try again.",
    NOT_CONFIGURED: "Sign-in isn't set up on this server yet. Contact your administrator.",
}

export const getAuthErrorMessage = (code: string | null | undefined) =>
    code ? (AUTH_ERROR_MESSAGES[code as AuthErrorCode] ?? AUTH_ERROR_MESSAGES.SIGN_IN_FAILED) : null
