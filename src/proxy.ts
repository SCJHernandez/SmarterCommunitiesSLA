import { type NextRequest, NextResponse } from 'next/server'
import { RETURN_TO_URL_KEY, SESSION_COOKIE } from '@/constants/auth.constant'
import { loginPath } from '@/configs/app.config'

// Sends visitors without a session to the sign-in page (API calls get a 401). This is only an
// optimistic check that the cookie exists: the session itself is verified where it's used — the
// portal layout and `apiAuthHandler`.

export function proxy(req: NextRequest) {
    if (process.env.AUTH_DISABLED === 'true' && process.env.NODE_ENV !== 'production') return NextResponse.next()
    if (req.cookies.has(SESSION_COOKIE)) return NextResponse.next()

    if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Please sign in.', code: 'UNAUTHORIZED' }, { status: 401 })
    }
    const url = new URL(loginPath, process.env.AUTH_BASE_URL || req.url)
    url.searchParams.set(RETURN_TO_URL_KEY, `${req.nextUrl.pathname}${req.nextUrl.search}`)
    return NextResponse.redirect(url)
}

export const config = {
    matcher: [
        // Everything except sign-in itself, the health check, Next.js assets and public files
        '/((?!api/auth|api/health|login|_next/static|_next/image|img/|.*\\.(?:png|ico|svg|jpg|jpeg|webmanifest)$).*)',
    ],
}
