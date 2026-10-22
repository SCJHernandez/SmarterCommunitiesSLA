'use client'

import { useEffect } from 'react'
import { useSlaStore } from '@/stores/SlaStore'
import useSession from '@/utils/hooks/useSession'
import { parseSavedSlaFilter, savedSlaFilterKey, toSavedSlaFilter } from '@/utils/sla/savedSlaFilter'

/**
 * Opens the SLA pages with the filters this user last used, and remembers every change — in this browser's
 * localStorage, per signed-in user. Read after the first render, so the server's HTML matches the browser's.
 * Storage can be unavailable (private windows, blocked site data): then the defaults apply and nothing is saved.
 */
export default function useSavedSlaFilter() {
    const { user } = useSession()
    const key = savedSlaFilterKey(user?.id ?? 'anonymous')

    // Once per page load: moving between the dashboard and the records list keeps the filter in the store
    useEffect(() => {
        if (useSlaStore.getState().filterLoaded) return
        let saved: unknown = null
        try {
            saved = JSON.parse(window.localStorage.getItem(key) ?? 'null')
        } catch {
            // nothing saved that we can read
        }
        useSlaStore.getState().restoreFilter(parseSavedSlaFilter(saved))
    }, [key])

    useEffect(
        () =>
            useSlaStore.subscribe((state, previous) => {
                if (!state.filterLoaded || state.filter === previous.filter) return
                try {
                    window.localStorage.setItem(key, JSON.stringify(toSavedSlaFilter(state.filter)))
                } catch {
                    // storage full or blocked: the filter still works, it just isn't remembered
                }
            }),
        [key],
    )
}
