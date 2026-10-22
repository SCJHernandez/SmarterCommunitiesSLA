'use client'

import { useEffect } from 'react'
import { useSWROpenSlaKpis, useSWRSlaKpis } from '@/services/sla'
import { useSlaStore } from '@/stores/SlaStore'
import useSavedSlaFilter from '@/utils/hooks/useSavedSlaFilter'
import { tryGetErrorMessage } from '@/utils/errors'
import type { ProviderProps } from '@/@types/common'

const REFRESH_MS = 5 * 60 * 1000

/**
 * Fetches the selected period's SLAs (and the period it's compared with) plus open work into SlaStore, starting
 * from the filters the user last used.
 */
export default function SlaSWRProvider({ children }: ProviderProps) {
    useSavedSlaFilter()
    const filterLoaded = useSlaStore((state) => state.filterLoaded)
    const dateRange = useSlaStore((state) => state.filter.dateRange)
    // Refreshed every few minutes, so "at risk" and rolling periods stay current on a dashboard left open.
    // The period waits for the saved filter, so it isn't fetched twice (default period, then the saved one).
    const period = useSWRSlaKpis(filterLoaded ? dateRange : null, { refreshInterval: REFRESH_MS })
    const open = useSWROpenSlaKpis({ refreshInterval: REFRESH_MS })
    const { data } = period
    const loading = !filterLoaded || period.isLoading || open.isLoading
    const validating = period.isValidating || open.isValidating
    const error = period.error ?? open.error
    const setRecords = useSlaStore((state) => state.setRecords)
    const setOpenRecords = useSlaStore((state) => state.setOpenRecords)
    const setLoading = useSlaStore((state) => state.setLoading)
    const setError = useSlaStore((state) => state.setError)
    const setRefresh = useSlaStore((state) => state.setRefresh)

    // While another range loads, `data` is undefined: keep the last records and show `loading` instead
    useEffect(() => {
        if (data) setRecords(data.records)
    }, [data, setRecords])
    useEffect(() => {
        if (open.data) setOpenRecords(open.data.records)
    }, [open.data, setOpenRecords])
    useEffect(() => setLoading(loading, validating), [loading, validating, setLoading])
    useEffect(() => setError(error ? tryGetErrorMessage(error) : null), [error, setError])
    const { mutate: refreshPeriod } = period
    const { mutate: refreshOpen } = open
    useEffect(
        () => setRefresh(() => Promise.all([refreshPeriod(), refreshOpen()])),
        [refreshPeriod, refreshOpen, setRefresh],
    )

    return <>{children}</>
}
