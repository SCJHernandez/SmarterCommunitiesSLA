import { create } from 'zustand'
import { type RoleName } from '@/@types/auth/Roles'
import { type RoleDirectory, type UserAccount } from '@/@types/users/UserAccount'

interface UsersFilter {
    query: string
    role: 'All' | RoleName
}

interface UsersStore {
    records: UserAccount[]
    manageUrl: string | null
    problem: string | null
    /** The signed-in Admin can change roles right now (role editing enabled) */
    canManage: boolean
    loading: boolean
    validating: boolean
    error: string | null
    filter: UsersFilter
    refresh: () => Promise<unknown>
    setDirectory: (directory: RoleDirectory | undefined) => void
    setLoading: (loading: boolean, validating: boolean) => void
    setError: (error: string | null) => void
    setFilter: (filter: Partial<UsersFilter>) => void
    setRefresh: (refresh: () => Promise<unknown>) => void
}

export const useUsersStore = create<UsersStore>((set) => ({
    records: [],
    manageUrl: null,
    problem: null,
    canManage: false,
    loading: true,
    validating: false,
    error: null,
    filter: { query: '', role: 'All' },
    refresh: async () => undefined,
    setDirectory: (directory) =>
        set({
            records: directory?.accounts ?? [],
            manageUrl: directory?.manageUrl ?? null,
            problem: directory?.problem ?? null,
            canManage: directory?.canManage ?? false,
        }),
    setLoading: (loading, validating) => set({ loading, validating }),
    setError: (error) => set({ error }),
    setFilter: (filter) => set((state) => ({ filter: { ...state.filter, ...filter } })),
    setRefresh: (refresh) => set({ refresh }),
}))

/** Accounts matching the filter. Builds a new array — call inside useMemo, not as a store selector. */
export const getVisibleAccounts = (records: UserAccount[], filter: UsersFilter) => {
    const query = filter.query.trim().toLowerCase()
    return records.filter(
        (account) =>
            (filter.role === 'All' || account.role === filter.role) &&
            (!query ||
                `${account.name} ${account.email ?? ''} ${account.jobTitle ?? ''}`.toLowerCase().includes(query)),
    )
}
