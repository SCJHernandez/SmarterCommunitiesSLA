'use client'

import Button from '@/components/ui/Button'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import { RefreshIcon } from '@/configs/icons.config'
import { useSlaStore } from '@/stores/SlaStore'
import { fromNow } from '@/utils/dates'

/** Reloads SLA data from Dataverse, saying when it was last loaded. */
export default function SlaRefreshButton() {
    const refresh = useSlaStore((state) => state.refresh)
    const validating = useSlaStore((state) => state.validating)
    const loadedAt = useSlaStore((state) => state.loadedAt)

    const onRefresh = async () => {
        try {
            await refresh()
            toastSuccess('SLA data refreshed.')
        } catch (error) {
            toastError("Couldn't refresh the SLA data. Try again in a minute.", error)
        }
    }

    return (
        <div className="flex items-center gap-3">
            {loadedAt && <span className="hidden text-xs text-gray-500 sm:inline">Updated {fromNow(loadedAt)}</span>}
            <Button variant="default" size="sm" icon={<RefreshIcon />} loading={validating} onClick={onRefresh}>
                Refresh
            </Button>
        </div>
    )
}
