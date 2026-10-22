'use server'

import { cookies } from 'next/headers'
import { type PartialTheme } from '@/@types/theme'
import { THEME_COOKIE } from '@/constants/app.constant'

// Theme preference persisted in a cookie so the server renders the right mode (no flash).

export const getTheme = async (): Promise<Partial<PartialTheme>> => {
    const raw = (await cookies()).get(THEME_COOKIE)?.value
    if (!raw) return {}
    try {
        return (JSON.parse(raw) as { state?: Partial<PartialTheme> }).state ?? {}
    } catch {
        return {}
    }
}

export const setTheme = async (theme: string) => {
    ;(await cookies()).set(THEME_COOKIE, theme, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
}
