import type { ElementType, JSX, LazyExoticComponent } from 'react'

export type PageHeaderProps = {
    title?: string | ElementType | LazyExoticComponent<() => JSX.Element>
    description?: string | ElementType
    contained?: boolean
    extraHeader?: string | ElementType | LazyExoticComponent<() => JSX.Element>
}

export interface Meta {
    pageContainerType?: 'default' | 'gutterless' | 'contained'
    pageBackgroundType?: 'default' | 'plain'
    header?: PageHeaderProps
    footer?: boolean
}
