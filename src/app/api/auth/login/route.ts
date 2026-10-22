import { type NextRequest, NextResponse } from 'next/server'
import { AuthFlowError, getAppOrigin, startSignIn } from '@/server/actions/auth'
import { AUTH_FLOW_COOKIE, RETURN_TO_URL_KEY } from '@/constants/auth.constant'
import { loginPath } from '@/configs/app.config'

// GET ?returnTo=/path&select=1&purpose=manage-roles -> redirects to the Microsoft sign-in page
// (manage-roles also asks for the Admin's consent to assign roles from the app)
export const GET = async (req: NextRequest) => {
    const { searchParams } = req.nextUrl
    const origin = getAppOrigin(req.nextUrl.origin)
    try {
        const { url, flowCookie } = await startSignIn(
            origin,
            searchParams.get(RETURN_TO_URL_KEY),
            searchParams.get('select') === '1',
            searchParams.get('purpose') === 'manage-roles' ? 'manage-roles' : 'sign-in',
        )
        const res = NextResponse.redirect(url)
        res.cookies.set(AUTH_FLOW_COOKIE, flowCookie, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/api/auth',
            maxAge: 600,
        })
        return res
    } catch (error) {
        console.error('[auth] Could not start sign-in', error)
        const code = error instanceof AuthFlowError ? error.code : 'NOT_CONFIGURED'
        return NextResponse.redirect(new URL(`${loginPath}?error=${code}`, origin))
    }
}
