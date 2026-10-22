'use client'

import { useEffect } from 'react'
import { type RecentItem } from '@/@types/navigation'
import { ensureRecentItemsLoaded, useRecentItemsStore } from '@/stores/RecentItemsStore'
import useSession from '@/utils/hooks/useSession'

/** Adds the record on screen to the user's "Recently viewed" (null while it loads). */
export default function useRecordRecentItem(item: Omit<RecentItem, 'visitedAt'> | null) {
    const { user } = useSession()
    const addRecent = useRecentItemsStore((state) => state.addRecent)
    const { kind, id, title, subtitle, href } = item ?? {}

    useEffect(() => {
        if (!user || !kind || !id || !title || !href) return
        let cancelled = false
        // Load what's saved first, or this visit would replace the whole list.
        void ensureRecentItemsLoaded().then(() => {
            if (!cancelled) addRecent(user.id, { kind, id, title, subtitle, href, visitedAt: Date.now() })
        })
        return () => {
            cancelled = true
        }
    }, [user, kind, id, title, subtitle, href, addRecent])
}
