import type { Mode } from '@/@types/theme'
import { setThemeMode } from './setThemeMode'

type ThemeSchemaConfig = Record<string, Partial<Record<Mode, Record<string, string>>>>

/** Applies a preset colour schema (CSS variables) and the light/dark mode. */
export default function applyTheme(schema: string, mode: Mode | undefined, config: ThemeSchemaConfig) {
    if (typeof window === 'undefined') return
    setThemeMode(mode)
    const variables = config[schema]?.[mode ?? 'light']
    if (!variables) return
    Object.entries(variables).forEach(([name, value]) => {
        document.documentElement.style.setProperty(`--${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`, value)
    })
}
