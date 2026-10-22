'use client'

import { useMemo } from 'react'
import useTheme from '@/utils/hooks/useTheme'

/**
 * Design-token colours (CSS variables from assets/styles/tailwind) as values, for libraries that need a colour
 * string rather than a class — e.g. recharts. Re-read when the theme mode changes.
 */
export default function useTokenColors<T extends string>(tokens: readonly T[]): Record<T, string> {
    const mode = useTheme((state) => state.mode)
    const key = tokens.join(',')

    return useMemo(() => {
        const style = getComputedStyle(document.documentElement)
        return Object.fromEntries(
            key.split(',').map((token) => [token, style.getPropertyValue(`--${token}`).trim() || 'currentColor']),
        ) as Record<T, string>
        // `mode` re-reads the variables after a theme switch
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, mode])
}
