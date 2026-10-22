import { type NextRequest, NextResponse } from 'next/server'
import { getAppOrigin } from '@/server/actions/auth'
import { ROLE_ADMIN_COOKIE, SESSION_COOKIE } from '@/constants/auth.constant'
import { loginPath } from '@/configs/app.config'

// GET -> ends the session in this app (the Microsoft 365 session stays, like other work apps)
export const GET = (req: NextRequest) => {
    const res = NextResponse.redirect(new URL(`${loginPath}?signedOut=1`, getAppOrigin(req.nextUrl.origin)))
    res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
    res.cookies.set(ROLE_ADMIN_COOKIE, '', { path: '/', maxAge: 0 })
    return res
}
