import { type NextRequest, NextResponse } from 'next/server'
import { AuthFlowError, completeSignIn, getAppOrigin, sessionCookieOptions, sessionMaxAge } from '@/server/actions/auth'
import { AUTH_FLOW_COOKIE, ROLE_ADMIN_COOKIE, SESSION_COOKIE } from '@/constants/auth.constant'
import { loginPath } from '@/configs/app.config'

/** Back to the page with ?roleEditing=enabled|failed, so it can say what happened. */
const withRoleEditing = (returnTo: string, outcome: 'enabled' | 'failed') =>
    `${returnTo}${returnTo.includes('?') ? '&' : '?'}roleEditing=${outcome}`

// GET ?code&state (from Microsoft) -> sets the session cookie and returns to where the user was going
export const GET = async (req: NextRequest) => {
    const { searchParams } = req.nextUrl
    const origin = getAppOrigin(req.nextUrl.origin)
    try {
        const { session, returnTo, roleAdmin } = await completeSignIn(
            searchParams,
            req.cookies.get(AUTH_FLOW_COOKIE)?.value,
        )
        const res = NextResponse.redirect(new URL(roleAdmin ? withRoleEditing(returnTo, 'enabled') : returnTo, origin))
        res.cookies.set(SESSION_COOKIE, session, sessionCookieOptions(sessionMaxAge()))
        if (roleAdmin) res.cookies.set(ROLE_ADMIN_COOKIE, roleAdmin.cookie, sessionCookieOptions(roleAdmin.maxAge))
        res.cookies.set(AUTH_FLOW_COOKIE, '', { path: '/api/auth', maxAge: 0 })
        return res
    } catch (error) {
        const code = error instanceof AuthFlowError ? error.code : 'SIGN_IN_FAILED'
        console.warn(`[auth] Sign-in failed (${code})`, error instanceof Error ? error.message : error)
        // A failed "enable role editing" leaves the user signed in: take them back to the page.
        const back = error instanceof AuthFlowError ? error.returnTo : null
        const res = NextResponse.redirect(
            new URL(back ? withRoleEditing(back, 'failed') : `${loginPath}?error=${code}`, origin),
        )
        res.cookies.set(AUTH_FLOW_COOKIE, '', { path: '/api/auth', maxAge: 0 })
        return res
    }
}
