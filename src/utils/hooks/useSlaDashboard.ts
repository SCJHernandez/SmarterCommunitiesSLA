'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSlaStore } from '@/stores/SlaStore'
import { buildDashboardData } from '@/utils/sla/slaDashboard'

const TICK_MS = 60_000

/**
 * Dashboard data derived from SlaStore (records + filter). Recomputed every minute too, so countdowns and
 * "past warning time" stay current between refreshes.
 */
export default function useSlaDashboard() {
    const records = useSlaStore((state) => state.records)
    const openRecords = useSlaStore((state) => state.openRecords)
    const filter = useSlaStore((state) => state.filter)
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), TICK_MS)
        return () => clearInterval(timer)
    }, [])

    return useMemo(
        () => buildDashboardData({ instances: records, openInstances: openRecords, filter, now }),
        [records, openRecords, filter, now],
    )
}
