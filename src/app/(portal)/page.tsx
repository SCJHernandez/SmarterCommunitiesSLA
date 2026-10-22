import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Loading from '@/components/shared/Loading'
import SlaSWRProvider from '@/components/sla/SlaSWRProvider'
import SlaDashboardClientPage from '@/components/sla/dashboard/SlaDashboardClientPage'
import { getCurrentUser } from '@/server/actions/auth'
import { hasPermission } from '@/@types/auth/Roles'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user.roles, 'sla.view')) notFound()

    return (
        <Suspense fallback={<Loading loading message="Loading the dashboard…" />}>
            <SlaSWRProvider>
                <SlaDashboardClientPage />
            </SlaSWRProvider>
        </Suspense>
    )
}
