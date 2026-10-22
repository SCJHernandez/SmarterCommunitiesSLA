'use client'

import { useEffect } from 'react'
import { create } from 'zustand'
import type { BreadcrumbItem } from '@/components/ui/Breadcrumbs'

interface BreadcrumbsState {
    items: BreadcrumbItem[]
    setBreadcrumbs: (items: BreadcrumbItem[]) => void
}

/** Breadcrumbs shown above the page by PostLoginLayout. */
export const useBreadcrumbs = create<BreadcrumbsState>((set) => ({
    items: [],
    setBreadcrumbs: (items) => set({ items }),
}))

/** Sets the page's breadcrumbs while it's mounted. Pass a stable key (e.g. JSON) to avoid loops. */
export const usePageBreadcrumbs = (items: BreadcrumbItem[] | null) => {
    const setBreadcrumbs = useBreadcrumbs((state) => state.setBreadcrumbs)
    const key = JSON.stringify(items)
    useEffect(() => {
        if (items) setBreadcrumbs(items)
        return () => setBreadcrumbs([])
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, setBreadcrumbs])
}

export default useBreadcrumbs
