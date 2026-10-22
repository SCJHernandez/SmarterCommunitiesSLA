import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Loading from '@/components/shared/Loading'
import SlaSWRProvider from '@/components/sla/SlaSWRProvider'
import SlaRecordsClientPage from '@/components/sla/records/SlaRecordsClientPage'
import { getCurrentUser } from '@/server/actions/auth'
import { hasPermission } from '@/@types/auth/Roles'

export const metadata: Metadata = { title: 'SLA records' }

export default async function SlaRecordsPage() {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user.roles, 'sla.view')) notFound()

    return (
        <Suspense fallback={<Loading loading message="Loading SLA records…" />}>
            <SlaSWRProvider>
                <SlaRecordsClientPage />
            </SlaSWRProvider>
        </Suspense>
    )
}
