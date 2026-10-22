'use client'

import { useCallback, useContext } from 'react'
import SessionContext from '@/components/auth/SessionContext'
import { type Permission, hasPermission } from '@/@types/auth/Roles'

/**
 * The signed-in user and what their roles allow. Use `can` to hide or disable actions — the API
 * checks the same permissions, so this is for a clear UI, not for security.
 */
export default function useSession() {
    const user = useContext(SessionContext)
    const can = useCallback((permission: Permission) => !!user && hasPermission(user.roles, permission), [user])
    return { user, can }
}
