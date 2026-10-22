import type { Mode } from '@/@types/theme'

/** Toggles the `dark` class on <html>. */
export const setThemeMode = (mode: Mode | undefined) => {
    if (typeof window === 'undefined') return
    document.documentElement.classList.toggle('dark', mode === 'dark')
}
