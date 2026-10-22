'use client'

import { useEffect } from 'react'
import { useSWRRoleDirectory } from '@/services/users'
import { useUsersStore } from '@/stores/UsersStore'
import { tryGetErrorMessage } from '@/utils/errors'
import type { ProviderProps } from '@/@types/common'

/** Fetches who has which role (from Entra ID) into UsersStore. */
export default function UsersSWRProvider({ children }: ProviderProps) {
    const { data, error, isLoading, isValidating, mutate } = useSWRRoleDirectory()
    const setDirectory = useUsersStore((state) => state.setDirectory)
    const setLoading = useUsersStore((state) => state.setLoading)
    const setError = useUsersStore((state) => state.setError)
    const setRefresh = useUsersStore((state) => state.setRefresh)

    useEffect(() => setDirectory(data), [data, setDirectory])
    useEffect(() => setLoading(isLoading, isValidating), [isLoading, isValidating, setLoading])
    useEffect(() => setError(error ? tryGetErrorMessage(error) : null), [error, setError])
    useEffect(() => setRefresh(() => mutate()), [mutate, setRefresh])

    return <>{children}</>
}
