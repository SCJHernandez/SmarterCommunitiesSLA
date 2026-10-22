'use client'

import { useContext } from 'react'
import ThemeContext from '@/components/template/Theme/ThemeContext'
import type { Mode, Theme } from '@/@types/theme'

export interface ThemeState extends Theme {
    setMode: (mode: Mode) => void
    setSideNavCollapse: (collapsed: boolean) => void
}

/** Reads the theme from ThemeProvider (persisted in a cookie by server/actions/theme). */
export default function useTheme<T>(selector: (state: ThemeState) => T): T {
    const { theme, setTheme } = useContext(ThemeContext)
    return selector({
        ...theme,
        setMode: (mode) => setTheme((current) => ({ ...current, mode })),
        setSideNavCollapse: (sideNavCollapse) =>
            setTheme((current) => ({ ...current, layout: { ...current.layout, sideNavCollapse } })),
    })
}
