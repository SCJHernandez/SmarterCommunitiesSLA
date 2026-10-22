import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import LandingPage from '@/components/auth/LandingPage'
import { getCurrentUser, safeReturnTo } from '@/server/actions/auth'
import { authConfig } from '@/server/data/auth/entra'
import { getAuthErrorMessage } from '@/constants/auth.constant'

export const metadata: Metadata = { title: 'Welcome' }

type LoginPageProps = {
    searchParams: Promise<{ error?: string; returnTo?: string; signedOut?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const { error, returnTo, signedOut } = await searchParams
    const target = safeReturnTo(returnTo)
    // Already signed in (and not here because something went wrong): carry on.
    const user = error || signedOut ? null : await getCurrentUser().catch(() => null)
    if (user) redirect(target)

    return (
        <LandingPage
            returnTo={target}
            error={getAuthErrorMessage(error)}
            signedOut={!!signedOut}
            allowedDomains={authConfig.allowedDomains}
        />
    )
}
