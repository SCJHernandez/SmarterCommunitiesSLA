import { redirect } from 'next/navigation'
import PostLoginLayout from '@/components/template/PostLoginLayout'
import SessionProvider from '@/components/auth/SessionProvider'
import { getCurrentUser } from '@/server/actions/auth'
import { loginPath } from '@/configs/app.config'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
    // proxy.ts only checks the cookie exists; this verifies it (expired or tampered → sign in again).
    const user = await getCurrentUser()
    if (!user) redirect(loginPath)

    return (
        <SessionProvider user={user}>
            {/* No header search: the SLA records page has its own, next to its filters */}
            <PostLoginLayout headerSearch={false}>{children}</PostLoginLayout>
        </SessionProvider>
    )
}
