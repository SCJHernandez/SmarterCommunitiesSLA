'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { slaRecordsPath } from '@/configs/app.config'
import { type SlaFilter } from '@/@types/sla/SlaFilter'
import { useSlaStore } from '@/stores/SlaStore'

/** Applies filters and opens the SLA records list (from a dashboard tile, chart bar or insight). */
export default function useSlaDrillDown() {
    const router = useRouter()
    const setFilter = useSlaStore((state) => state.setFilter)

    return useCallback(
        (filter: Partial<SlaFilter>) => {
            setFilter(filter)
            router.push(slaRecordsPath)
        },
        [router, setFilter],
    )
}
