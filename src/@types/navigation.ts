/** A record the user opened (an SLA case here), for "Recently viewed" in the side navigation. */
export interface RecentItem {
    kind: 'building' | 'bylaw' | 'case'
    id: string
    title: string
    /** e.g. the bylaw's building */
    subtitle?: string
    href: string
    /** Epoch ms */
    visitedAt: number
}

export interface NavigationTree {
    key: string
    path: string
    isExternalLink?: boolean
    title: string
    translateKey?: string
    icon: string
    type: 'title' | 'collapse' | 'item'
    authority: string[]
    subMenu: NavigationTree[]
}
