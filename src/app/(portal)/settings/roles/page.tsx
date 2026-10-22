import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import UsersSWRProvider from '@/components/users/UsersSWRProvider'
import RolesClientPage from '@/components/users/RolesClientPage'
import { getCurrentUser } from '@/server/actions/auth'
import { hasPermission } from '@/@types/auth/Roles'

export const metadata: Metadata = { title: 'Roles & permissions' }

type RolesPageProps = { searchParams: Promise<{ roleEditing?: string }> }

export default async function RolesPage({ searchParams }: RolesPageProps) {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user.roles, 'users.view')) notFound()
    const { roleEditing } = await searchParams
    return (
        <UsersSWRProvider>
            <RolesClientPage roleEditing={roleEditing === 'enabled' || roleEditing === 'failed' ? roleEditing : null} />
        </UsersSWRProvider>
    )
}
