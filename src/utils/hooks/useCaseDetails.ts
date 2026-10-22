'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CASE_URL_KEY } from '@/constants/app.constant'

/**
 * Which case's details are open, kept in the URL (`?case=<instance id>`) so it survives a refresh and can be
 * linked to (e.g. from "Recently viewed").
 */
export default function useCaseDetails() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const caseId = searchParams.get(CASE_URL_KEY)

    const withCase = useCallback(
        (id: string | null) => {
            const params = new URLSearchParams(searchParams)
            if (id) params.set(CASE_URL_KEY, id)
            else params.delete(CASE_URL_KEY)
            const query = params.toString()
            return query ? `${pathname}?${query}` : pathname
        },
        [pathname, searchParams],
    )

    const openCase = useCallback((id: string) => router.push(withCase(id)), [router, withCase])
    const closeCase = useCallback(() => router.replace(withCase(null)), [router, withCase])

    return { caseId, openCase, closeCase }
}
