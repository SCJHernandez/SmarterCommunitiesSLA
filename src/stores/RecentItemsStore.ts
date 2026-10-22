import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type RecentItem } from '@/@types/navigation'

// The SLA cases each user opened most recently. Kept in the browser's localStorage — per signed-in
// user, on this device only.

export const MAX_RECENT_ITEMS = 6

interface RecentItemsStore {
    /** Newest first, by user (Entra ID object id), so people sharing a computer don't mix */
    byUser: Record<string, RecentItem[]>
    addRecent: (userId: string, item: RecentItem) => void
    clearRecent: (userId: string) => void
}

export const useRecentItemsStore = create<RecentItemsStore>()(
    persist(
        (set) => ({
            byUser: {},
            addRecent: (userId, item) =>
                set((state) => ({
                    byUser: {
                        ...state.byUser,
                        [userId]: [item, ...(state.byUser[userId] ?? []).filter((i) => i.id !== item.id)].slice(
                            0,
                            MAX_RECENT_ITEMS,
                        ),
                    },
                })),
            clearRecent: (userId) => set((state) => ({ byUser: { ...state.byUser, [userId]: [] } })),
        }),
        // Read from localStorage after the first render (see ensureRecentItemsLoaded), so the
        // server-rendered navigation matches the browser's first paint.
        { name: 'sla_recent_items', skipHydration: true },
    ),
)

/** Loads the saved list once; safe to call repeatedly. Wait for it before adding. */
export const ensureRecentItemsLoaded = async () => {
    if (!useRecentItemsStore.persist.hasHydrated()) await useRecentItemsStore.persist.rehydrate()
}

const NONE: RecentItem[] = []

/** The user's recent items (a stable reference — safe as a store selector). */
export const selectRecentItems = (userId: string | null | undefined) => (state: RecentItemsStore) =>
    (userId && state.byUser[userId]) || NONE
