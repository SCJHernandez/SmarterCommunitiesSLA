import { create } from 'zustand'
import { DEFAULT_SLA_FILTER, type SlaFilter } from '@/@types/sla/SlaFilter'
import { type SlaKpiInstance } from '@/@types/sla/SlaKpiInstance'
import { SLA_STATUS_ORDER } from '@/@types/sla/SlaStatusOptions'
import { getPriorityRank } from '@/utils/sla/priority'

export type SlaRecordsSortKey = 'case' | 'status' | 'priority' | 'owner' | 'deadline'

interface SlaStore {
    /** Instances for the selected range and the period before it (see services/sla) */
    records: SlaKpiInstance[]
    /** Open work: SLAs on cases open now, whatever the period */
    openRecords: SlaKpiInstance[]
    loading: boolean
    validating: boolean
    error: string | null
    /** When the data was last loaded */
    loadedAt: Date | null
    filter: SlaFilter
    /** The user's saved filter has been read (see useSavedSlaFilter) — data isn't fetched before, to fetch once */
    filterLoaded: boolean
    order: { key: SlaRecordsSortKey; direction: 'asc' | 'desc' }
    refresh: () => Promise<unknown>
    setRecords: (records: SlaKpiInstance[]) => void
    setOpenRecords: (openRecords: SlaKpiInstance[]) => void
    setLoading: (loading: boolean, validating: boolean) => void
    setError: (error: string | null) => void
    setFilter: (filter: Partial<SlaFilter>) => void
    /** The filter the user last used (or the defaults), once per page load */
    restoreFilter: (filter: SlaFilter) => void
    /** Back to the defaults, keeping the period (and any `keep` fields) */
    resetFilter: (options?: { keep?: (keyof SlaFilter)[] }) => void
    toggleOrder: (key: SlaRecordsSortKey) => void
    setRefresh: (refresh: () => Promise<unknown>) => void
}

export const useSlaStore = create<SlaStore>((set) => ({
    records: [],
    openRecords: [],
    loading: true,
    validating: false,
    error: null,
    loadedAt: null,
    filter: DEFAULT_SLA_FILTER,
    filterLoaded: false,
    order: { key: 'deadline', direction: 'asc' },
    refresh: async () => undefined,
    setRecords: (records) => set({ records, loadedAt: new Date() }),
    setOpenRecords: (openRecords) => set({ openRecords }),
    setLoading: (loading, validating) => set({ loading, validating }),
    setError: (error) => set({ error }),
    setFilter: (filter) => set((state) => ({ filter: { ...state.filter, ...filter } })),
    restoreFilter: (filter) => set({ filter, filterLoaded: true }),
    // Keeps the date range: clearing the other filters shouldn't refetch
    resetFilter: (options) =>
        set((state) => {
            const filter: SlaFilter = { ...DEFAULT_SLA_FILTER, dateRange: state.filter.dateRange }
            for (const key of options?.keep ?? []) Object.assign(filter, { [key]: state.filter[key] })
            return { filter }
        }),
    setRefresh: (refresh) => set({ refresh }),
    toggleOrder: (key) =>
        set((state) => ({
            order: { key, direction: state.order.key === key && state.order.direction === 'asc' ? 'desc' : 'asc' },
        })),
}))

/** How many filters (other than the date range) are on. */
export const countActiveFilters = (filter: SlaFilter) =>
    (['status', 'priority', 'slaKpi', 'owner', 'openOnly'] as const).filter(
        (key) => filter[key] !== DEFAULT_SLA_FILTER[key],
    ).length + (filter.query.trim() ? 1 : 0)

/** Records matching the search, sorted. Call inside useMemo — it returns a new array. */
export const getVisibleSlaRecords = (
    records: SlaKpiInstance[],
    state: Pick<SlaStore, 'filter' | 'order'>,
): SlaKpiInstance[] => {
    const query = state.filter.query.trim().toLowerCase()
    const sortValue = (r: SlaKpiInstance): string | number => {
        switch (state.order.key) {
            case 'case':
                return r.regardingNumber.toLowerCase()
            case 'status':
                return SLA_STATUS_ORDER[r.status] ?? 99
            case 'priority':
                return getPriorityRank(r.priority)
            case 'owner':
                return r.owner.toLowerCase()
            case 'deadline':
                return r.failureTime?.getTime() ?? Number.MAX_SAFE_INTEGER
        }
    }
    const direction = state.order.direction === 'asc' ? 1 : -1
    return records
        .filter(
            (r) =>
                !query ||
                [r.regardingNumber, r.regardingSubject, r.owner, r.kpiName].some((v) =>
                    v?.toLowerCase().includes(query),
                ),
        )
        .sort((a, b) => (sortValue(a) > sortValue(b) ? direction : sortValue(a) < sortValue(b) ? -direction : 0))
}
