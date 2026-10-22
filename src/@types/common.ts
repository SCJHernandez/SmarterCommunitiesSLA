import type { CSSProperties, ReactNode } from 'react'

export interface CommonProps {
    id?: string
    className?: string
    children?: ReactNode
    style?: CSSProperties
}

export interface ProviderProps {
    children?: ReactNode
}

/** A select / segment option. */
export interface Option {
    value: string
    label: string
}

/** An option shown with a coloured badge (`badgeClass`, e.g. `bg-success`). */
export interface BadgeOption extends Option {
    badgeClass?: string
}
